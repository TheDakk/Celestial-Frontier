/** G5 engine. Routing/capability detection belongs to the caller; no model import occurs here. */
import {creatureOriginalKey, type AiCreatureInputV1, type AiCreatureOriginalStoreV1, type AiCreatureOriginalV1} from './creature-originals.js';
import {LocalModelSha256V1} from './local-model-sha256.js';
import {encodePng} from './morph/png-encode.js';
import {decodePng} from './morph/png-decode.js';
// The existing conservation instrument is deliberately shared, unchanged, with the native finisher.
// @ts-expect-error The evidence instrument is JavaScript and has no declaration file.
import {finishConservation} from '../../../tools/painted-creature/finish-conservation.mjs';

export interface CreatureFinishSourceV1 {
 readonly individualId:string; readonly visualKey:string; readonly recordRecipeHash:string;
 readonly modelHash:string; readonly settingsHash:string; readonly seed:number;
 readonly width:number; readonly height:number;
 /** Exact admitted source PNG, original RGBA ownership labels, and decompressed binding bytes. */
 readonly masterPng:Uint8Array; readonly labels:Uint8Array; readonly binding:Uint8Array;
 readonly cutoutAssetHash:string; readonly labelsHash:string; readonly bindingHash:string;
}
export interface CreatureFinishPixelsV1 {readonly rgba:Uint8Array;readonly labels:Uint8Array;readonly binding:Uint8Array}
export type CreatureFinishInferV1 = (source:Readonly<CreatureFinishPixelsV1 & {width:number;height:number;seed:number;individualId:string;visualKey:string;recordRecipeHash:string;modelHash:string;settingsHash:string}>)=>Promise<CreatureFinishPixelsV1>;
export type CreatureFinishResultV1 =
 | {readonly status:'original';readonly original:AiCreatureOriginalV1;readonly origin:'cache'|'delivery'|'inference'}
 | {readonly status:'fallback';readonly reason:string};
export interface CreatureFinishEngineOptionsV1 {
 readonly tier:'desktop'|'phone'; readonly store:AiCreatureOriginalStoreV1;
 /** Lazy factory: called only for an uncached capable desktop request, never on phones. */
 readonly createInfer?:()=>Promise<CreatureFinishInferV1>;
 /** Caller resolves a trusted G3 manifest pin and fetches its bytes before supplying this result. */
 readonly delivered?:(identity:AiCreatureInputV1)=>Promise<AiCreatureOriginalV1|null>;
 /** Running + waiting unique jobs. Full queue falls back without allocation or retry. */
 readonly maxPending?:number;
}
const hash=(bytes:Uint8Array)=>new LocalModelSha256V1().update(bytes).digestHex();
const textHash=(text:string)=>hash(new TextEncoder().encode(text));
const same=(a:Uint8Array,b:Uint8Array)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const isHash=(s:string)=>/^[a-f0-9]{64}$/.test(s);
const MAX_PIXELS=2048*2048,MAX_PNG=8*1024*1024,MAX_BINDING=16*1024*1024;
function validateShape(s:CreatureFinishSourceV1):void {
 if(!s.individualId||s.individualId.length>512||!s.visualKey||s.visualKey.length>2048)throw Error('individual identity');
 if(![s.recordRecipeHash,s.modelHash,s.settingsHash,s.cutoutAssetHash,s.labelsHash,s.bindingHash].every(isHash))throw Error('source identity');
 if(!Number.isSafeInteger(s.seed)||s.seed<0||s.seed>0xffffffff)throw Error('seed');
 if(!Number.isSafeInteger(s.width)||!Number.isSafeInteger(s.height)||s.width<1||s.height<1||s.width*s.height>MAX_PIXELS)throw Error('dimensions');
 if(!s.masterPng.length||s.masterPng.length>MAX_PNG||s.labels.length!==s.width*s.height*4||!s.binding.length||s.binding.length>MAX_BINDING)throw Error('payload bounds');
}
/** Per-individual key also binds labels/binding, so a changed rig cannot reuse an old finish. */
export function creatureFinishIdentityV1(s:CreatureFinishSourceV1):AiCreatureInputV1 {
 validateShape(s);
 return Object.freeze({recordRecipeHash:s.recordRecipeHash,cutoutAssetHash:s.cutoutAssetHash,modelHash:s.modelHash,
 settingsHash:textHash(JSON.stringify(['cf.creature-finish-engine/v1',s.individualId,s.visualKey,s.settingsHash,s.seed,s.width,s.height,s.labelsHash,s.bindingHash]))});
}
function sourcePins(s:CreatureFinishSourceV1):void {
 if(hash(s.masterPng)!==s.cutoutAssetHash||hash(s.labels)!==s.labelsHash||hash(s.binding)!==s.bindingHash)throw Error('source pin mismatch');
}
function conservation(master:Uint8Array,rgba:Uint8Array,s:CreatureFinishSourceV1):unknown {
 const report=finishConservation(master,rgba,s.labels,s.width,s.height);
 if(report.status!=='PASS')throw Error('conservation: '+report.failures.join(','));
 if(!report.parts.length)throw Error('empty ownership labels');
 return report;
}
export function createCreatureFinishEngineV1(options:CreatureFinishEngineOptionsV1) {
 const maxPending=options.maxPending??4;
 if(!Number.isInteger(maxPending)||maxPending<1||maxPending>8)throw Error('finish queue bound');
 const pending=new Map<string,Promise<CreatureFinishResultV1>>();
 let tail:Promise<unknown>=Promise.resolve(),infer:CreatureFinishInferV1|undefined,closed=false;
 const request=(input:CreatureFinishSourceV1):Promise<CreatureFinishResultV1>=>{
  if(closed)return Promise.resolve({status:'fallback',reason:'engine closed'});
  let identity:AiCreatureInputV1,key:string;
  try{identity=creatureFinishIdentityV1(input);sourcePins(input);key=creatureOriginalKey(identity);}catch(e){return Promise.resolve({status:'fallback',reason:String(e)});}
  const existing=pending.get(key);if(existing)return existing;
  if(pending.size>=maxPending)return Promise.resolve({status:'fallback',reason:'finish queue full'});
  // Copy synchronously: callers may reuse buffers as soon as request returns.
  const s:CreatureFinishSourceV1={...input,masterPng:input.masterPng.slice(),labels:input.labels.slice(),binding:input.binding.slice()};
  const execute=async():Promise<CreatureFinishResultV1>=>{
   try{
    if(closed)throw Error('engine closed');
    const decoded=await decodePng(s.masterPng);
    if(decoded.width!==s.width||decoded.height!==s.height)throw Error('source PNG dimensions');
    conservation(decoded.rgba,decoded.rgba,s);
    const verify=async(row:AiCreatureOriginalV1)=>{
     if(row.key!==key||row.blob.type!=='image/png'||!row.blob.size||row.blob.size>MAX_PNG||row.receipt.length>1048576)throw Error('original identity/payload');
     const bytes=new Uint8Array(await row.blob.arrayBuffer());if(hash(bytes)!==row.sha256)throw Error('original hash');
     const receipt=JSON.parse(row.receipt);
     if(receipt.schema!=='cf.creature-finish-engine/v1'||receipt.key!==key||receipt.labelsHash!==s.labelsHash||receipt.bindingHash!==s.bindingHash||receipt.cutoutAssetHash!==s.cutoutAssetHash||receipt.outputHash!==row.sha256)throw Error('original receipt');
     const png=await decodePng(bytes);if(png.width!==s.width||png.height!==s.height)throw Error('original PNG dimensions');
     conservation(decoded.rgba,png.rgba,s);
    };
    const cached=await options.store.find(identity);if(cached){await verify(cached);return {status:'original',original:cached,origin:'cache'};}
    const delivered=await options.delivered?.(identity);
    if(delivered){await verify(delivered);if(closed)throw Error('engine closed');const row=await options.store.retain(identity,delivered.blob,delivered.receipt);return {status:'original',original:row,origin:'delivery'};}
    if(options.tier==='phone'||!options.createInfer)return {status:'fallback',reason:'delivered original unavailable'};
    infer??=await options.createInfer();
    if(closed)throw Error('engine closed');
    const modelInput={rgba:decoded.rgba.slice(),labels:s.labels.slice(),binding:s.binding.slice(),width:s.width,height:s.height,seed:s.seed,individualId:s.individualId,visualKey:s.visualKey,recordRecipeHash:s.recordRecipeHash,modelHash:s.modelHash,settingsHash:s.settingsHash};
    const output=await infer(modelInput);
    if(!same(modelInput.rgba,decoded.rgba)||!same(modelInput.labels,s.labels)||!same(modelInput.binding,s.binding))throw Error('inference mutated source');
    if(!same(output.labels,s.labels)||!same(output.binding,s.binding))throw Error('labels/binding equality');
    const report=conservation(decoded.rgba,output.rgba,s);
    const png=await encodePng(output.rgba,s.width,s.height);if(png.length>MAX_PNG)throw Error('finished PNG bound');
    const roundtrip=await decodePng(png);if(!same(roundtrip.rgba,output.rgba))throw Error('lossless PNG roundtrip');
    conservation(decoded.rgba,roundtrip.rgba,s);
    if(closed)throw Error('engine closed');
    const receipt=JSON.stringify({schema:'cf.creature-finish-engine/v1',key,identity,individualId:s.individualId,visualKey:s.visualKey,seed:s.seed,width:s.width,height:s.height,cutoutAssetHash:s.cutoutAssetHash,labelsHash:s.labelsHash,bindingHash:s.bindingHash,outputHash:hash(png),conservation:report});
    const row=await options.store.retain(identity,new Blob([new Uint8Array(png)],{type:'image/png'}),receipt);
    return {status:'original',original:row,origin:'inference'};
   }catch(e){return {status:'fallback',reason:String(e)};}
  };
  const job=tail.then(execute);pending.set(key,job);tail=job.finally(()=>{pending.delete(key);});return job;
 };
 return Object.freeze({request,get pending(){return pending.size;},close(){closed=true;}});
}
