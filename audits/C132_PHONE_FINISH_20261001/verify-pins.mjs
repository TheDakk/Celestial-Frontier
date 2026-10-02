import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export async function hashFile(file){
 const hash=createHash('sha256');let bytes=0;
 for await(const chunk of createReadStream(file)){hash.update(chunk);bytes+=chunk.length;}
 return {sha256:hash.digest('hex'),bytes};
}
export async function verifyInputPins({root,dir,pin,manifestSha256,phase,head,readHead}){
 if((await hashFile(path.join(dir,'prepared-manifest.json'))).sha256!==manifestSha256)throw Error(phase+' manifest drift');
 for(const [kind,base,rows]of[['source',root,pin.sources],['prepared',dir,pin.prepared],['model',path.join(dir,'model-cache'),pin.models],['runtime',root,pin.runtimeFiles]]){
  if(!Array.isArray(rows)||!rows.length)throw Error(phase+' empty '+kind+' inventory');
  for(const p of rows){const digest=await hashFile(path.join(base,p.file));if(digest.sha256!==p.sha256||(p.bytes!==undefined&&digest.bytes!==p.bytes))throw Error(phase+' '+kind+' drift '+p.file);}
 }
 if(await readHead()!==head)throw Error(phase+' HEAD drift');
}
