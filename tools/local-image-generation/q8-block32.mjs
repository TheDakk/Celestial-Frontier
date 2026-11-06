import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertIgnoredCache,DEFAULT_CACHE_ROOT} from './fetch-model.mjs';
export const BLOCK32_VARIANT='q8-block32-repacked-v1';
export const PARAMETER_BYTES=347332608;
export const BLOCK32_DIRECTORY=path.join(DEFAULT_CACHE_ROOT,'derivatives','flux2-klein-4b-block32-v1');
const directory=path.dirname(fileURLToPath(import.meta.url));
const sha=/^[a-f0-9]{64}$/;
export function validateBlock32Pin(pin,parent){
  if(pin?.schema!=='cf.q8-block32-runtime-pin/v1'||pin.variant!==BLOCK32_VARIANT
    ||pin.runtimeQualified!==false||pin.qualityAccepted!==false||pin.changedNodes!==103)
    throw Error('Unqualified block32 pin contract');
  const graph=parent.files.find(x=>x.path==='transformer_q8.onnx');
  if(pin.parent?.modelId!==parent.modelId||pin.parent.revision!==parent.revision||pin.parent.graphSha256!==graph?.sha256)
    throw Error('Block32 parent identity mismatch');
  if(!Array.isArray(pin.files)||pin.files.length!==2)throw Error('Block32 file inventory');
  const expected=['transformer-q8-block32.onnx','repacked-scale-zero.data'];
  for(const [i,file] of pin.files.entries()){
    if(file.path!==expected[i]||!sha.test(file.sha256)||!Number.isSafeInteger(file.bytes)||file.bytes<1
      ||(i===0&&file.bytes>16*1024*1024)||(i===1&&file.bytes!==PARAMETER_BYTES))throw Error('Block32 file metadata');
  }
  return pin;
}
export async function verifyPinnedFile(file,entry){
  const stat=await fs.lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==entry.bytes)throw Error('Pinned derivative file type/size mismatch');
  const hash=createHash('sha256');let bytes=0;
  for await(const chunk of createReadStream(file)){bytes+=chunk.length;if(bytes>entry.bytes)throw Error('Derivative grew during verification');hash.update(chunk);}
  if(bytes!==entry.bytes||hash.digest('hex')!==entry.sha256)throw Error('Pinned derivative SHA mismatch');
  const after=await fs.lstat(file);
  if(after.ino!==stat.ino||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||after.ctimeMs!==stat.ctimeMs)throw Error('Derivative changed during verification');
  return {path:entry.path,bytes,sha256:entry.sha256};
}
export async function openBlock32Derivative(parent){
  await assertIgnoredCache(BLOCK32_DIRECTORY);
  if(await fs.realpath(BLOCK32_DIRECTORY)!==BLOCK32_DIRECTORY)throw Error('Derivative directory symlink refused');
  // This reviewed repository pin binds actual graph/data bytes, never a mutable
  // generated manifest's success claims or machine-specific sourceDirectory.
  const pin=validateBlock32Pin(JSON.parse(await fs.readFile(path.join(directory,'q8-block32-manifest.json'),'utf8')),parent);
  const files=[];
  for(const entry of pin.files)files.push(await verifyPinnedFile(path.join(BLOCK32_DIRECTORY,entry.path),entry));
  return {pin,files:files.map(row=>({...row,file:path.join(BLOCK32_DIRECTORY,row.path)}))};
}
