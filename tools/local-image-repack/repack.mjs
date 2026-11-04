#!/usr/bin/env node
/** Explicit local derivative creation; no download, inference or source-file mutation. */
import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {inspectModel,makePlan,deriveGraph,validateDerivedGraph,expandFour,verifyParameterExpansion,sha256,DATA_FILE,MAX_GRAPH_BYTES} from './model.mjs';

const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'../..');
export const CACHE_ROOT=path.join(ROOT,'port/v2/apps/game/smoke/local-image-generation');
const GRAPH_FILE='transformer-q8-block32.onnx';
const CHUNK_BYTES=64*1024,HASH_CHUNK_BYTES=4*1024*1024;
const fail=message=>{throw Error(message);};
const json=async(file,value)=>fs.writeFile(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const inside=(root,target)=>{const r=path.relative(root,target);return r!==''&&!path.isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+path.sep);};
function assertIgnored(target){
  if(!inside(CACHE_ROOT,target))fail('Output/source outside ignored cache');
  const r=spawnSync('git',['-C',ROOT,'check-ignore','--no-index','--quiet','--',path.join(target,'repack-membership.bin')]);
  if(r.status!==0)fail('Cache path is not Git-ignored');
}
export function validateLocations(source,output){
  source=path.resolve(source);output=path.resolve(output);
  if(!inside(CACHE_ROOT,source)||!inside(CACHE_ROOT,output)||source===output||inside(source,output)||inside(output,source))fail('Unsafe source/output relationship');
  return {source,output};
}
async function regular(file,expectedBytes){
  const s=await fs.lstat(file);if(!s.isFile()||s.isSymbolicLink()||s.size!==expectedBytes)fail('Source file type/length mismatch: '+file);
  const h=await fs.open(file,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
  const stat=await h.stat({bigint:true});
  if(!stat.isFile()||stat.size!==BigInt(expectedBytes)||stat.ino!==BigInt(s.ino)||stat.dev!==BigInt(s.dev)){await h.close();fail('Source identity changed while opening: '+file);}
  return {h,stat,file};
}
const sameStat=(a,b)=>['dev','ino','size','mtimeNs','ctimeNs'].every(k=>a[k]===b[k]);
export async function readExactly(handle,position,length){
  if(!Number.isSafeInteger(position)||position<0||!Number.isSafeInteger(length)||length<0||length>HASH_CHUNK_BYTES)fail('Invalid bounded read');
  const b=Buffer.allocUnsafe(length);let done=0;
  while(done<length){const {bytesRead}=await handle.read(b,done,length-done,position+done);if(!bytesRead)fail('Truncated source/output read');done+=bytesRead;}
  return b;
}
async function writeAll(handle,buffer,position){
  let done=0;while(done<buffer.length){const {bytesWritten}=await handle.write(buffer,done,buffer.length-done,position+done);if(!bytesWritten)fail('Incomplete output write');done+=bytesWritten;}
}
export async function hashHandle(handle,size){
  const hash=createHash('sha256');for(let at=0;at<size;at+=HASH_CHUNK_BYTES)hash.update(await readExactly(handle,at,Math.min(HASH_CHUNK_BYTES,size-at)));
  return hash.digest('hex');
}
export async function assertHandleHash(handle,expected){
  const actual=await hashHandle(handle,expected.bytes);if(actual!==expected.sha256)fail('Source shard SHA mismatch: '+expected.path);return actual;
}
export function validateRanges(model,files){
  for(const t of model.targets)for(const role of ['B','S','Z']){
    const r=t.ranges[role],file=files.find(f=>f.path===r.location);
    if(!file||!Number.isSafeInteger(r.offset+r.length)||r.offset<0||r.offset+r.length>file.bytes)fail('Tensor external range outside pinned shard');
  }
}
export async function writeParameters(plan,sourceHandles,outHandle){
  const tensorReceipts=[];
  for(const t of plan.tensors){
    const source=sourceHandles.get(t.source.location);if(!source)fail('Unverified source handle');
    const originalHash=createHash('sha256'),derivedHash=createHash('sha256');
    for(let at=0;at<t.source.length;at+=CHUNK_BYTES){
      const input=await readExactly(source,t.source.offset+at,Math.min(CHUNK_BYTES,t.source.length-at));
      const expanded=expandFour(input,t.width);originalHash.update(input);derivedHash.update(expanded);
      await writeAll(outHandle,expanded,t.output.offset+at*4);
    }
    tensorReceipts.push({...t,sourceSliceSha256:originalHash.digest('hex'),derivedSliceSha256:derivedHash.digest('hex')});
  }
  await outHandle.sync();return tensorReceipts;
}
export async function verifyParameters(plan,sourceHandles,outHandle){
  const size=(await outHandle.stat()).size;if(size!==plan.totalBytes)fail('Derivative parameter-file size mismatch');
  let verifiedBytes=0;
  for(const t of plan.tensors){
    const source=sourceHandles.get(t.source.location);if(!source)fail('Missing validation source');
    for(let at=0;at<t.source.length;at+=CHUNK_BYTES){
      const n=Math.min(CHUNK_BYTES,t.source.length-at);
      const old=await readExactly(source,t.source.offset+at,n),actual=await readExactly(outHandle,t.output.offset+at*4,n*4);
      verifiedBytes+=verifyParameterExpansion(old,actual,t.width);
    }
  }
  if(verifiedBytes!==plan.totalBytes)fail('Incomplete derivative validation coverage');
  return {verifiedBytes,scope:'Every duplicated scale/zero byte re-read independently; B coordinates retain original source ranges. No GPU output equivalence claim.'};
}
async function pinToolSources(){
  const result={};for(const name of ['repack.mjs','model.mjs','protobuf.mjs','parent-contract.json'])result[name]=sha256(await fs.readFile(path.join(HERE,name)));
  return result;
}

export async function createFreshOutput(output){await fs.mkdir(output);}

export async function convertModel({source,output}){
  const receipt={schema:'cf.q8-block32-repack-run/v1',startedAt:new Date().toISOString(),status:'FAIL',
    scope:'Exact quantized-weight representation repack; new GPU accumulation order and image quality remain unverified.',sources:{},sourceFiles:[],tensors:[]};
  let destinationOwned=false,attemptDirectory,outHandle,pendingManifest;const opened=new Map();
  try{
    // Failure evidence has its own unique ignored directory; existing output
    // directories (including partial attempts) are never opened for writing.
    const cacheReal=await fs.realpath(CACHE_ROOT);if(cacheReal!==CACHE_ROOT)fail('Symlink cache root refused');
    const attempts=path.join(CACHE_ROOT,'repack-attempts');assertIgnored(attempts);
    await fs.mkdir(attempts,{recursive:true});if(await fs.realpath(attempts)!==attempts)fail('Symlink attempt path refused');
    attemptDirectory=path.join(attempts,randomUUID());await fs.mkdir(attemptDirectory);
    receipt.attemptDirectory=attemptDirectory;receipt.sources=await pinToolSources();
    ({source,output}=validateLocations(source,output));assertIgnored(source);assertIgnored(output);
    if(await fs.realpath(source)!==source||await fs.realpath(path.dirname(output))!==path.dirname(output))fail('Symlink source/output parent refused');
    receipt.sourceDirectory=source;receipt.outputDirectory=output;
    await createFreshOutput(output);destinationOwned=true; // nonrecursive + EEXIST refuse all partial reuse
    await json(path.join(output,'start.json'),receipt);
    const contract=JSON.parse(await fs.readFile(path.join(HERE,'parent-contract.json'),'utf8'));
    const graphPin=contract.files.find(f=>f.path===contract.graph);
    if(!graphPin||graphPin.bytes>MAX_GRAPH_BYTES)fail('Invalid pinned graph contract');
    const graphFile=await regular(path.join(source,contract.graph),graphPin.bytes);opened.set(contract.graph,graphFile);
    const graph=await fs.readFile(graphFile.h);if(sha256(graph)!==graphPin.sha256)fail('Pinned graph SHA mismatch');
    const model=inspectModel(graph);const plan=makePlan(model);
    if(plan.totalBytes!==contract.newParameterBytes||model.targets.length!==contract.nodeCount)fail('Pinned derivative capacity/count mismatch');
    validateRanges(model,contract.files);
    // Verify immutable original shards once before any new data. Their file
    // descriptors stay open and stat identity is checked again after conversion.
    for(const pin of contract.files.filter(x=>x.path!==contract.graph)){
      const file=await regular(path.join(source,pin.path),pin.bytes);opened.set(pin.path,file);
      const hash=await assertHandleHash(file.h,pin);receipt.sourceFiles.push({path:pin.path,bytes:pin.bytes,sha256:hash});
    }
    const derived=deriveGraph(model,plan);validateDerivedGraph(model,derived,plan);
    const handles=new Map([...opened].map(([name,file])=>[name,file.h]));
    outHandle=await fs.open(path.join(output,DATA_FILE),'wx+');
    receipt.tensors=await writeParameters(plan,handles,outHandle);
    receipt.parameterValidation=await verifyParameters(plan,handles,outHandle);
    const dataSha256=await hashHandle(outHandle,plan.totalBytes);
    await fs.writeFile(path.join(output,GRAPH_FILE),derived,{flag:'wx'});
    const diskGraph=await fs.readFile(path.join(output,GRAPH_FILE));validateDerivedGraph(model,diskGraph,plan);
    if(!diskGraph.equals(derived))fail('Derived graph changed after write');
    for(const [name,file]of opened)if(!sameStat(file.stat,await file.h.stat({bigint:true})))fail('Source changed during conversion: '+name);
    const sourceAfter=await pinToolSources();if(JSON.stringify(sourceAfter)!==JSON.stringify(receipt.sources))fail('Converter source changed during run');
    receipt.sourceGraph={path:contract.graph,bytes:graph.length,sha256:graphPin.sha256};
    receipt.outputGraph={path:GRAPH_FILE,bytes:derived.length,sha256:sha256(derived)};
    receipt.outputData={path:DATA_FILE,bytes:plan.totalBytes,sha256:dataSha256};
    const manifest={schema:'cf.q8-block32-derivative/v1',variant:'q8-block32-repacked-v1',parent:{modelId:contract.modelId,revision:contract.revision,
      sourceDirectory:source,graph:receipt.sourceGraph,shards:receipt.sourceFiles},
      derived:{graph:receipt.outputGraph,parameterData:receipt.outputData},converterSources:receipt.sources,
      externalData:[...receipt.sourceFiles.map(x=>({location:x.path,source:'parent',path:x.path,bytes:x.bytes,sha256:x.sha256})),
        {location:DATA_FILE,source:'derivative',...receipt.outputData}],
      tensors:receipt.tensors,representation:'B payloads unchanged; original float16 scale bytes and uint8 zero bytes repeated4× per original block.',
      changedNodes:model.targets.length,representedWeightProof:{...receipt.parameterValidation,
        originalGraphShaMatched:true,unchangedBExternalRanges:true,rawUnknownFieldsPreserved:true,allScaleZeroBytesCompared:true},
      status:'DERIVATIVE_VERIFIED_RUNTIME_PENDING',runtimeVerified:false,qualityAccepted:false,accumulationOrderChanged:true};
    pendingManifest=manifest; // publish only after successful handle cleanup
    receipt.status='DERIVATIVE_VERIFIED_RUNTIME_PENDING';
  }catch(error){receipt.error=String(error.stack??error);}
  finally{
    const cleanup=[];if(outHandle)try{await outHandle.close();}catch(e){cleanup.push(String(e));}
    for(const file of opened.values())try{await file.h.close();}catch(e){cleanup.push(String(e));}
    if(cleanup.length){receipt.cleanupErrors=cleanup;receipt.status='FAIL';}
    if(receipt.status==='DERIVATIVE_VERIFIED_RUNTIME_PENDING'&&pendingManifest){
      try{await json(path.join(output,'derivative-manifest.json'),pendingManifest);}
      catch(error){receipt.status='FAIL';receipt.manifestError=String(error.stack??error);}
    }
    receipt.finishedAt=new Date().toISOString();
    if(destinationOwned)await json(path.join(output,'receipt.json'),receipt);
    if(attemptDirectory)await json(path.join(attemptDirectory,'receipt.json'),receipt);
  }
  return receipt;
}
function options(args){
  if(args.length!==4||args[0]!=='--source'||args[2]!=='--output')fail('Usage: node repack.mjs --source VERIFIED_PARENT_CACHE --output NEW_IGNORED_DIRECTORY');
  return {source:args[1],output:args[3]};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{const receipt=await convertModel(options(process.argv.slice(2)));console.log(JSON.stringify(receipt));if(receipt.status!=='DERIVATIVE_VERIFIED_RUNTIME_PENDING')process.exitCode=1;}
  catch(error){console.error(String(error.stack??error));process.exitCode=1;}
}
