/** G5 C41: finishing is an additive texture operation AFTER the complete original rig admission.
 * A receipt never replaces master/alpha/binding/atlas authority. Labels have their own bundled supplementary pins. */
import {preflightBattle2PinnedBytesV1, type Battle2PinnedBytesV1} from './battle2-master-pin-admission.js';
import {isBattle2MasterPin, type Battle2MasterPinV1} from './battle2-master-pins.generated.js';
import {creatureFinishLabelsPinV1} from './creature-finish-source-pins.generated.js';
import {createCreatureFinishEngineV1, creatureFinishIdentityV1, type CreatureFinishSourceV1} from './creature-finish-engine.js';
import {creatureOriginalKey, type AiCreatureInputV1, type AiCreatureOriginalV1} from './creature-originals.js';
import {projectFinishedToAtlasV1, type ProjectionPartV1} from './creature-finish-route.js';
import {decodePng} from './morph/png-decode.js';
import {LocalModelSha256V1} from './local-model-sha256.js';
import {fetchArtLibraryBytesV1, artLibraryEntryV1} from './art-library.js';

const hash=(b:Uint8Array)=>new LocalModelSha256V1().update(b).digestHex();
const same=(a:Uint8Array,b:Uint8Array)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const requireValue=(v:unknown,s:string)=>{if(!v)throw Error('finish admission: '+s);};
export interface CreatureFinishedAtlasV1 {readonly key:string;readonly originalHash:string;readonly creatureId:string}
const AUTHORITY=new WeakMap<object,{pin:Battle2MasterPinV1;pixels:Uint8Array;width:number;height:number;key:string}>();

/** Verify a retained/delivered finish against independently pinned original inputs, then project into unchanged atlas frames.
 * The source and original are copied before the first await; callers cannot race authority checks by mutating their buffers. */
export async function admitCreatureFinishedAtlasV1(input:Battle2PinnedBytesV1, source:CreatureFinishSourceV1,
 original:AiCreatureOriginalV1, labelsPng:Uint8Array):Promise<CreatureFinishedAtlasV1>{
 if(!isBattle2MasterPin(input.pin))throw Error('finish admission: untrusted rig pin');
 const pin=input.pin, labelsPin=creatureFinishLabelsPinV1(pin);
 const snapshot={...input,pin,record:structuredClone(input.record),alpha:input.alpha.slice(),bindingBytes:input.bindingBytes.slice(),atlas:input.atlas.slice()};
 const s={...source,masterPng:source.masterPng.slice(),labels:source.labels.slice(),binding:source.binding.slice()}, labelsBytes=labelsPng.slice();
 const row=Object.freeze({key:original.key,sha256:original.sha256,receipt:original.receipt,blob:original.blob.slice(0,original.blob.size,original.blob.type)});
 const admitted=await preflightBattle2PinnedBytesV1(snapshot);
 requireValue(s.recordRecipeHash===pin.recipeHash&&s.cutoutAssetHash===pin.masterSha256&&hash(s.masterPng)===pin.masterSha256,'source master/recipe mismatch');
 requireValue(s.width===pin.masterWidth&&s.height===pin.masterHeight,'source dimensions');
 requireValue(s.bindingHash===pin.bindingSha256&&same(s.binding,snapshot.bindingBytes),'source binding mismatch');
 requireValue(hash(labelsBytes)===labelsPin.labelsPngSha256,'source labels pin mismatch');
 const labels=await decodePng(labelsBytes);
 requireValue(labels.width===s.width&&labels.height===s.height&&same(labels.rgba,s.labels)&&hash(s.labels)===s.labelsHash,'source labels mismatch');
 const identity=creatureFinishIdentityV1(s),key=creatureOriginalKey(identity);
 // Only the phone reader is constructed: no inference factory or model path exists in this module.
 const engine=createCreatureFinishEngineV1({tier:'phone',store:{find:async()=>row,read:async()=>row,
  retain:async()=>{throw Error('admission is read-only');},close(){}}});
 let result;try{result=await engine.request(s);}finally{engine.close();}
 if(result.status!=='original')throw Error('finish admission: '+result.reason);
 const [atlas,finished]=await Promise.all([decodePng(snapshot.atlas),decodePng(new Uint8Array(await row.blob.arrayBuffer()))]);
 const binding=admitted.binding as {parts:readonly ProjectionPartV1[]};
 const pixels=projectFinishedToAtlasV1({atlas:atlas.rgba,atlasWidth:atlas.width,atlasHeight:atlas.height,
  finished:finished.rgba,finishedWidth:finished.width,finishedHeight:finished.height,parts:binding.parts});
 const token=Object.freeze({key,originalHash:row.sha256,creatureId:pin.creatureId});
 AUTHORITY.set(token,{pin,pixels,width:atlas.width,height:atlas.height,key});return token;
}
/** Private-identity capability consumed only after the loader admits the exact original pinned bytes again. */
export function creatureFinishedAtlasPixelsV1(token:unknown,pin:unknown,identity:AiCreatureInputV1):(rgba:Uint8Array,width:number,height:number)=>Uint8Array{
 const state=typeof token==='object'&&token!==null?AUTHORITY.get(token):undefined;
 if(!state||state.pin!==pin||state.key!==creatureOriginalKey(identity))throw Error('finish admission: untrusted or mismatched finished atlas');
 return (rgba,width,height)=>{requireValue(width===state.width&&height===state.height&&rgba.length===state.pixels.length,'atlas dimensions');
  for(let i=3;i<rgba.length;i+=4)requireValue(rgba[i]===state.pixels[i],'atlas alpha');return state.pixels.slice();};
}
export interface CreatureFinishDeliveryOptionsV1 {readonly base?:string;readonly fetchImpl?:typeof fetch}
/** Both files must be entries of the BUNDLED G3 manifest. A caller cannot supply a manifest pin, arbitrary path or output hash.
 * Canonical per-key location is the index; the receipt binds the exact four-field engine identity and PNG digest.
 * The engine must still check pinned source labels/binding and rerun conservation before retaining or displaying the result. */
export function createCreatureFinishDeliveryV1(options:CreatureFinishDeliveryOptionsV1={}){
 const trustedOptions={...(options.base===undefined?{}:{base:options.base}),...(options.fetchImpl===undefined?{}:{fetchImpl:options.fetchImpl})};
 return async(identity:AiCreatureInputV1):Promise<AiCreatureOriginalV1|null>=>{
  const key=creatureOriginalKey(identity),dir=`library/creature-finish/${key}/`,pngPath=dir+'original.png',receiptPath=dir+'receipt.json';
  const [pngPin,receiptPin]=await Promise.all([artLibraryEntryV1(pngPath,trustedOptions),artLibraryEntryV1(receiptPath,trustedOptions)]);
  if(!pngPin||!receiptPin)return null;
  requireValue(pngPin.bytes<=8*1024*1024&&receiptPin.bytes<=1048576,'delivery bounds');
  const [png,receiptBytes]=await Promise.all([fetchArtLibraryBytesV1(pngPath,trustedOptions),fetchArtLibraryBytesV1(receiptPath,trustedOptions)]);
  const receipt=new TextDecoder('utf-8',{fatal:true}).decode(receiptBytes),r=JSON.parse(receipt) as {schema?:unknown;key?:unknown;identity?:AiCreatureInputV1;outputHash?:unknown};
  requireValue(r.schema==='cf.creature-finish-engine/v1'&&r.key===key&&r.identity&&creatureOriginalKey(r.identity)===key&&r.outputHash===pngPin.sha256,'delivery receipt identity');
  requireValue(hash(png)===pngPin.sha256,'delivery PNG digest');
  return Object.freeze({key,sha256:pngPin.sha256,blob:new Blob([new Uint8Array(png)],{type:'image/png'}),receipt});
 };
}
