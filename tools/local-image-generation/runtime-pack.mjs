/** Static browser runtime only. No model bytes, inference, network, package
 * installation or publication. Every copied source is pinned; readiness is the
 * final immutable manifest whose hash must be supplied to the verifier. */
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {javascriptModuleImports} from '../../port/v2/tools/sealed-worker-graph.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {assertIgnoredCache} from './fetch-model.mjs';
import {loadSpeciesReferenceSet} from './species-references.mjs';
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(HERE,'../..');
export const RUNTIME_SOURCE_PINS=path.join(HERE,'runtime-pack-source-pins.json');
export const SHIPPED_PACK_LIMIT=128*1024*1024;
export const RETAINED_UPDATE_LIMIT=256*1024*1024;
const PREFIX='__local_ai/';
const MANIFEST='runtime-pack-manifest.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
const fail=message=>{throw Error(message);};
const need=(value,message)=>{if(!value)fail(message);};
const safePath=value=>typeof value==='string'&&value.length<=240&&value.split('/').every(segment=>/^[A-Za-z0-9_@][A-Za-z0-9_.@-]*$/.test(segment)&&segment!=='.'&&segment!=='..');
const sameStat=(a,b)=>a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeMs===b.mtimeMs&&a.ctimeMs===b.ctimeMs;
const own=(object,key)=>Object.hasOwn(object,key);
const compare=(a,b)=>a<b?-1:a>b?1:0;
const versions=Object.freeze({'onnxruntime-web':'1.29.0','onnxruntime-common':'1.29.0','@huggingface/tokenizers':'0.2.0'});
const closureNames=Object.freeze({
  worker:PREFIX+'stage-worker.mjs',ort:PREFIX+'node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs',
  loader:PREFIX+'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.mjs',
  wasm:PREFIX+'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.asyncify.wasm',
  tokenizer:PREFIX+'node_modules/@huggingface/tokenizers/dist/tokenizers.mjs',
});
const generatedPaths=[PREFIX+'runtime.json',PREFIX+'deployment.json',PREFIX+'RUNTIME_NOTICES.md'];

export function validateRuntimeSourcePins(value){
  need(value?.schema==='cf.local-ai-runtime-source-pins.v1'&&Array.isArray(value.files)
    &&value.files.length>=12&&value.files.length<=64&&Array.isArray(value.dependencies),'Invalid runtime source pins');
  const sources=new Set(),targets=new Set();let payload=0;
  for(const row of value.files){
    need(row&&safePath(row.source)&&!sources.has(row.source)&&Number.isSafeInteger(row.bytes)&&row.bytes>0
      &&row.bytes<=SHIPPED_PACK_LIMIT&&/^[a-f0-9]{64}$/.test(row.sha256),'Unsafe/duplicate/unpinned runtime source');
    sources.add(row.source);
    need(row.target===null||safePath(row.target)&&row.target.startsWith(PREFIX)&&!targets.has(row.target)
      &&!generatedPaths.includes(row.target)&&!/(?:\.onnx|\.data)$/i.test(row.target),'Unsafe/model/duplicate runtime target');
    if(row.target!==null){targets.add(row.target);payload+=row.bytes;}
  }
  need(payload<SHIPPED_PACK_LIMIT,'Runtime payload exceeds unchanged 128 MiB admission limit');
  for(const name of Object.values(closureNames))need(targets.has(name),'Required runtime closure is missing: '+name);
  for(const name of [PREFIX+'pipeline-math.mjs',PREFIX+'gpu-profile.mjs',PREFIX+'denoiser-shapes.mjs',PREFIX+'reference.png'])
    need(targets.has(name),'Required project runtime source is missing');
  need(value.dependencies.length===3&&new Set(value.dependencies.map(row=>row.name)).size===3,'Incomplete runtime dependency pins');
  for(const row of value.dependencies)need(own(versions,row.name)&&row.version===versions[row.name]
    &&typeof row.integrity==='string'&&row.integrity.startsWith('sha512-')
    &&sources.has(row.packageJson),'Changed runtime dependency pin');
  for(const name of ['packageLock','modelManifest','referenceBinding'])need(safePath(value[name])&&sources.has(value[name]),'Missing runtime metadata source');
  if(value.speciesReferences!==undefined)need(safePath(value.speciesReferences)&&sources.has(value.speciesReferences),'Missing species-reference metadata source');
  const metadata=new Set([value.packageLock,value.modelManifest,value.referenceBinding,value.speciesReferences,
    ...value.dependencies.map(row=>row.packageJson),'tools/local-image-generation/node_modules/@huggingface/tokenizers/LICENSE']);
  need(value.files.filter(row=>row.target===null).every(row=>metadata.has(row.source)),'Unreviewed metadata/model source');
  return value;
}
async function regular(file){
  const stat=await fs.lstat(file);
  need(stat.isFile()&&!stat.isSymbolicLink()&&await fs.realpath(file)===path.resolve(file),'Unsafe source/file path: '+file);
  return stat;
}
async function fileHash(file,expectedBytes){
  const hash=createHash('sha256');let bytes=0;
  for await(const chunk of createReadStream(file,{highWaterMark:1024*1024})){
    bytes+=chunk.length;need(bytes<=expectedBytes,'File exceeded pinned byte count');hash.update(chunk);
  }
  need(bytes===expectedBytes,'File byte count changed');return hash.digest('hex');
}
async function capture(file,pin){
  const stat=await regular(file);need(stat.size===pin.bytes,'Pinned source size mismatch: '+pin.source);
  need(await fileHash(file,pin.bytes)===pin.sha256,'Pinned source SHA mismatch: '+pin.source);
  need(sameStat(stat,await regular(file)),'Source changed during verification');return stat;
}
async function smallJson(sourceRoot,source){
  const file=path.join(sourceRoot,source),stat=await regular(file);need(stat.size<=256*1024,'Runtime metadata exceeded bound');
  return JSON.parse(await fs.readFile(file,'utf8'));
}
async function checkDestination(output){
  const absolute=path.resolve(output);
  if(!absolute.startsWith('/private/tmp/'))await assertIgnoredCache(absolute);
  let parent=path.dirname(absolute);
  while(parent!==path.dirname(parent)){
    try{const stat=await fs.lstat(parent);need(stat.isDirectory()&&!stat.isSymbolicLink(),'Unsafe output ancestor');}
    catch(error){if(error.code!=='ENOENT')throw error;}parent=path.dirname(parent);
  }
  try{await fs.lstat(absolute);fail('Runtime output already exists; no overwrite');}catch(error){if(error.code!=='ENOENT')throw error;}
  return absolute;
}
async function inspectClosure(sourceRoot,pins){
  const emitted=new Map(pins.files.filter(row=>row.target!==null).map(row=>[row.target,row]));
  const edges=[];
  for(const [target,row]of emitted){
    if(!target.endsWith('.mjs'))continue;
    const source=await fs.readFile(path.join(sourceRoot,row.source),'utf8');
    for(const edge of javascriptModuleImports(source)){
      if(edge.kind==='module-static'){
        need(typeof edge.specifier==='string'&&edge.specifier.startsWith('./'),'External static runtime import');
        const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(target),edge.specifier));
        need(emitted.has(resolved),'Unpackaged static runtime import: '+resolved);edges.push({from:target,to:resolved,kind:'static'});
      }else if(target===closureNames.ort){
        need(edge.specifier===null,'ORT dynamic import shape changed');edges.push({from:target,to:closureNames.loader,kind:'reviewed-computed-browser-import'});
      }else if(target===closureNames.loader){
        need(['module','worker_threads'].includes(edge.specifier),'Asyncify external import changed');
        edges.push({from:target,to:edge.specifier,kind:'pinned-node-only-branch-not-browser-runtime'});
      }else fail('Unexpected dynamic runtime import');
    }
  }
  const read=target=>fs.readFile(path.join(sourceRoot,emitted.get(target).source),'utf8');
  const ort=await read(closureNames.ort),loader=await read(closureNames.loader),worker=await read(closureNames.worker);
  need((ort.match(/ort-wasm-simd-threaded\.asyncify\.mjs/g)??[]).length===1,'ORT lazy Asyncify loader changed');
  need((loader.match(/ort-wasm-simd-threaded\.asyncify\.wasm/g)??[]).length===3,'Asyncify WASM location contract changed');
  need(worker.includes('ort.env.wasm.numThreads=1;')
    &&worker.includes("ort.env.wasm.wasmPaths=new URL('./node_modules/onnxruntime-web/dist/',import.meta.url).href;"),'Worker WASM path/thread contract changed');
  need(edges.filter(edge=>edge.kind==='reviewed-computed-browser-import').length===1,'ORT computed import closure changed');
  need(edges.filter(edge=>edge.kind==='pinned-node-only-branch-not-browser-runtime').length===2,'Node-only loader branches changed');
  edges.push({from:closureNames.loader,to:closureNames.wasm,kind:'reviewed-lazy-wasm'});
  return edges.sort((a,b)=>compare(a.from+'|'+a.to,b.from+'|'+b.to));
}
function noticeText(){return `# Celestial Frontier browser runtime pack\n\nThis review artifact contains JavaScript, WASM, an anatomical reference and retained notices. It contains no model graph, weight shard or tokenizer data, and grants no image/device acceptance.\n\nONNX Runtime Web/Common 1.29.0 is MIT licensed; the preserved bundle banner and exact retained full license accompany it. The matching official source ThirdPartyNotices aggregation is included for its native/WASM components. The npm binary is pinned by SHA and npm lock integrity; this does not reproduce its build or prove every source notice corresponds to a linked binary component.\n\nHugging Face Tokenizers.js 0.2.0 includes its exact installed Apache-2.0 license. The project pipeline-math.mjs preserves its Diffusers 040c7cde626504d14caf63b13b8b25b6a9f62120 contract attribution; that revision's full license and available notice evidence are included. Project code implements those contracts in JavaScript and does not claim identical PyTorch pixels.\n\nThe earlier isolated proof notices and provenance are retained in notices/. They include model-context records; no model is contained in this pack. See license-source-provenance.json for retrieval outcomes. Distribution qualification remains false pending exact native/WASM build/component correspondence and integration review. No hosting or redistribution action is performed by this builder.\n`;}
function deployment(){return {schema:'cf.local-ai-runtime-deployment.v1',staticPrefix:'/'+PREFIX,
  documents:{requiredHeaders:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'},secureContextRequired:true},
  runtimeAssets:{requiredHeaders:{'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff'},
    mime:{'.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.png':'image/png'},
    preserveRelativePaths:true,immutableContentOnly:true,htmlFallbackForMissingAssets:false},
  applicationRequirements:['Resolve runtime.json/worker/reference at the same game origin.',
    'Do not enqueue inference until the exact pinned OPFS model is verified; fill modelFiles only with verified Blob URLs.',
    'Do not fall back to developer-cache URLs or auto-download weights.',
    'Integrate these bytes into the complete application inventory and unchanged 128 MiB admission check.',
    'Measure complete current/retained builds against the unchanged 256 MiB retained-update constraint.',
    'Verify the real application CSP: native WASM/glue compilation and Blob data access may need explicit policy support.',
    'Version asset URLs with the external manifest SHA; do not serve changed bytes under an accepted immutable identity.'],
  serviceWorkerIncluded:false,wholeAppAdmissionQualified:false,retainedUpdateQualified:false,phoneQualified:false};}

/** sourceRoot/pins are explicit local test seams; CLI always uses repository
 * source and its checked-in pins. API callers own the checkout lock for their
 * full build/verification lifetime. No network or alternate package resolution. */
export async function buildRuntimePack({output,sourceRoot=ROOT,pinsPath=RUNTIME_SOURCE_PINS}={}){
  need(typeof output==='string','Runtime pack output is required');
  const destination=await checkDestination(output),root=path.resolve(sourceRoot);
  need(await fs.realpath(root)===root,'Source root symlink refused');
  const pinBytes=await fs.readFile(pinsPath);need(pinBytes.length<=128*1024,'Oversized source pins');
  const pins=validateRuntimeSourcePins(JSON.parse(pinBytes.toString('utf8'))),states=new Map();
  for(const row of pins.files)states.set(row.source,await capture(path.join(root,row.source),row));
  const lock=await smallJson(root,pins.packageLock),model=await smallJson(root,pins.modelManifest),binding=await smallJson(root,pins.referenceBinding);
  for(const dep of pins.dependencies){
    const installed=await smallJson(root,dep.packageJson),locked=lock.packages?.['node_modules/'+dep.name];
    need(installed.name===dep.name&&installed.version===dep.version&&locked?.version===dep.version&&locked.integrity===dep.integrity,
      'Changed installed/locked runtime dependency: '+dep.name);
  }
  need(model.modelId==='cgb/flux2-klein-4b-onnx-webgpu'&&model.revision==='3bffc0efef1d9f84727036cdbc44df3b6ab51131','Unpinned model metadata');
  const reference=pins.files.find(row=>row.target===PREFIX+'reference.png');
  need(binding.image?.path===reference.source&&binding.image.sha256===reference.sha256&&binding.image.bytes===reference.bytes
    &&binding.binding?.name==='Platypus'&&typeof binding.binding.subjectIdentityKey==='string','Reference identity/image binding changed');
  const species=pins.speciesReferences===undefined?null:await loadSpeciesReferenceSet({sourceRoot:root,manifestPath:pins.speciesReferences});
  if(species)for(const asset of species.files)need(pins.files.some(row=>row.source===asset.source&&row.target===asset.target
    &&row.bytes===asset.bytes&&row.sha256===asset.sha256),'Species asset is absent from pinned runtime payload');
  const modelPin=pins.files.find(row=>row.source===pins.modelManifest);
  const closure=await inspectClosure(root,pins);
  const config={schema:'cf.local-ai-runtime-pack.v1',workerUrl:'/'+closureNames.worker,
    modelRevision:model.revision,modelId:model.modelId,sourceManifestSha256:modelPin.sha256,
    modelSource:'verified-opfs-only',modelFiles:{},q8Block32:false,autoDownload:false,qualityAccepted:false,
    reference:{url:'/'+PREFIX+'reference.png',sha256:reference.sha256,width:480,height:320,
      speciesVisualKey:binding.binding.subjectIdentityKey},...(species?{references:species.references}:{} )};
  const generated=new Map([[PREFIX+'runtime.json',json(config)],[PREFIX+'deployment.json',json(deployment())],[PREFIX+'RUNTIME_NOTICES.md',noticeText()]]);
  await fs.mkdir(path.dirname(destination),{recursive:true});await fs.mkdir(destination);
  const rows=[];
  try{
    for(const row of pins.files.filter(row=>row.target!==null).sort((a,b)=>compare(a.target,b.target))){
      const target=path.join(destination,row.target);await fs.mkdir(path.dirname(target),{recursive:true});
      await fs.copyFile(path.join(root,row.source),target,1); // COPYFILE_EXCL; never overwrite an existing byte.
      await capture(target,{...row,source:row.target});rows.push({path:row.target,bytes:row.bytes,sha256:row.sha256,kind:'copied'});
    }
    for(const [target,body]of generated){const bytes=Buffer.from(body);await fs.writeFile(path.join(destination,target),bytes,{flag:'wx'});
      rows.push({path:target,bytes:bytes.length,sha256:sha(bytes),kind:'generated'});}
    for(const row of pins.files){need(sameStat(states.get(row.source),await regular(path.join(root,row.source))),'Pinned source changed during pack build');
      await capture(path.join(root,row.source),row);}
    rows.sort((a,b)=>compare(a.path,b.path));
    const payloadBytes=rows.reduce((sum,row)=>sum+row.bytes,0);
    const manifest={schema:'cf.local-ai-runtime-pack-inventory.v1',sourcePinsSha256:sha(pinBytes),files:rows,fileCount:rows.length,payloadBytes,
      modelWeightsIncluded:false,modelSource:'verified-opfs-only',closure,dependencies:pins.dependencies,
      distributionQualified:false,qualityAccepted:false,deviceQualified:false,
      budget:{shippedPackLimitBytes:SHIPPED_PACK_LIMIT,retainedUpdateLimitBytes:RETAINED_UPDATE_LIMIT,
        manifestBytesExcludedFromPayload:true,combinedAppAdmissionQualified:false,retainedUpdateQualified:false}};
    const bytes=Buffer.from(json(manifest));need(payloadBytes+bytes.length<=SHIPPED_PACK_LIMIT,'Static runtime pack exceeds 128 MiB admission');
    await fs.writeFile(path.join(destination,MANIFEST),bytes,{flag:'wx'});
    const result=await verifyRuntimePack({directory:destination,expectedManifestSha256:sha(bytes)});
    return {directory:destination,manifestSha256:sha(bytes),sourcePinsSha256:sha(pinBytes),config,...result};
  }catch(error){
    // Incomplete output is kept for diagnosis and has no accepted external hash.
    // Never erase a partial artifact or report it as ready after a failed copy.
    throw error;
  }
}
export async function verifyRuntimePack({directory,expectedManifestSha256,allowApplicationFiles=false}={}){
  need(typeof allowApplicationFiles==='boolean','Invalid application verification scope');
  need(typeof directory==='string'&&/^[a-f0-9]{64}$/.test(expectedManifestSha256),'Expected external manifest SHA is required');
  const root=path.resolve(directory);need(await fs.realpath(root)===root,'Pack root symlink refused');
  const file=path.join(root,MANIFEST),stat=await regular(file);need(stat.size<=256*1024,'Oversized runtime pack manifest');
  const bytes=await fs.readFile(file);need(sha(bytes)===expectedManifestSha256,'Runtime manifest SHA mismatch');
  const manifest=JSON.parse(bytes.toString('utf8'));
  need(manifest.schema==='cf.local-ai-runtime-pack-inventory.v1'&&Array.isArray(manifest.files)&&manifest.files.length<=64
    &&manifest.fileCount===manifest.files.length&&manifest.files.length>=12&&manifest.modelWeightsIncluded===false&&manifest.modelSource==='verified-opfs-only'
    &&manifest.distributionQualified===false&&manifest.qualityAccepted===false&&manifest.deviceQualified===false,'Invalid runtime manifest');
  const names=new Set([MANIFEST]);let payload=0;
  for(const row of manifest.files){need(safePath(row.path)&&row.path.startsWith(PREFIX)&&!names.has(row.path)
    &&Number.isSafeInteger(row.bytes)&&row.bytes>0&&row.bytes<=SHIPPED_PACK_LIMIT&&/^[a-f0-9]{64}$/.test(row.sha256)
    &&!/(?:\.onnx|\.data)$/i.test(row.path),'Unsafe/duplicate runtime inventory');
    names.add(row.path);payload+=row.bytes;need(payload<=SHIPPED_PACK_LIMIT,'Runtime inventory exceeds 128 MiB');
    await capture(path.join(root,row.path),{...row,source:row.path});}
  need(payload===manifest.payloadBytes&&payload+bytes.length<=SHIPPED_PACK_LIMIT,'Runtime byte accounting mismatch');
  for(const required of [...Object.values(closureNames),...generatedPaths,PREFIX+'reference.png'])
    need(names.has(required),'Required runtime inventory path is missing');
  need(manifest.budget?.shippedPackLimitBytes===SHIPPED_PACK_LIMIT&&manifest.budget.retainedUpdateLimitBytes===RETAINED_UPDATE_LIMIT
    &&manifest.budget.combinedAppAdmissionQualified===false&&manifest.budget.retainedUpdateQualified===false,'Runtime budget/qualification changed');
  let entries=0;
  async function walk(folder,prefix='',depth=0){need(depth<=12,'Runtime directory depth exceeded');
    for(const entry of await fs.readdir(folder,{withFileTypes:true})){
      need(++entries<=192&&!entry.isSymbolicLink(),'Unexpected/symlink runtime entry');const relative=prefix+entry.name;
      if(entry.isDirectory()){need([...names].some(name=>name.startsWith(relative+'/')),'Uninventoried runtime directory');await walk(path.join(folder,entry.name),relative+'/',depth+1);}
      else need(entry.isFile()&&names.has(relative),'Uninventoried runtime file: '+relative);
    }}
  if(allowApplicationFiles)await walk(path.join(root,'__local_ai'),'__local_ai/');else await walk(root);
  return {status:'PASS',scope:allowApplicationFiles?'runtime-subset-of-application':'standalone-runtime',fileCount:manifest.files.length,totalBytes:payload+bytes.length,manifestBytes:bytes.length,
    remaining128MiBBytes:SHIPPED_PACK_LIMIT-payload-bytes.length,distributionQualified:false,
    combinedAppAdmissionQualified:false,retainedUpdateQualified:false,deviceQualified:false};
}
async function main(){
  const [mode,...args]=process.argv.slice(2);let output=null,expectedManifestSha256=null;
  for(const argument of args){if(argument.startsWith('--output=')&&output===null)output=argument.slice(9);
    else if(argument.startsWith('--sha256=')&&expectedManifestSha256===null)expectedManifestSha256=argument.slice(9);
    else fail('Unknown runtime-pack argument');}
  need(['build','verify'].includes(mode)&&output,'Usage: runtime-pack.mjs build|verify --output=PATH [--sha256=EXTERNAL_MANIFEST_SHA]');
  let release;try{release=acquireWorkspaceLock('static local AI runtime pack '+mode);
    console.log(json(mode==='build'?await buildRuntimePack({output}):await verifyRuntimePack({directory:output,expectedManifestSha256})));}
  finally{release?.();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{await main();}catch(error){console.error(String(error.stack??error));process.exitCode=1;}
}
