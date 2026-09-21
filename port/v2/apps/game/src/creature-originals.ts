/** Immutable desktop-generated originals. Phone delivery may read, never infer. */
import {LocalModelSha256V1} from './local-model-sha256.js';
import {hashLandfallBlobV1} from './landfall-content-hash.js';
export interface AiCreatureInputV1 {readonly recordRecipeHash:string;readonly cutoutAssetHash:string;readonly settingsHash:string;readonly modelHash:string}
export interface AiCreatureOriginalV1 {readonly key:string;readonly sha256:string;readonly blob:Blob;readonly receipt:string}
export interface AiCreatureOriginalStoreV1 {find(input:AiCreatureInputV1):Promise<AiCreatureOriginalV1|null>;read(input:AiCreatureInputV1):Promise<AiCreatureOriginalV1|null>;retain(input:AiCreatureInputV1,blob:Blob,receipt:string):Promise<AiCreatureOriginalV1>;close():void}
export function creatureOriginalKey(input:AiCreatureInputV1):string{
 const values=[input.recordRecipeHash,input.cutoutAssetHash,input.settingsHash,input.modelHash];
 if(values.some(v=>typeof v!=='string'||!/^[a-f0-9]{64}$/.test(v)))throw Error('Creature original identity');
 return new LocalModelSha256V1().update(new TextEncoder().encode(JSON.stringify(values))).digestHex();
}
export function createAiCreatureOriginalStoreV1(factory:IDBFactory=globalThis.indexedDB):AiCreatureOriginalStoreV1{
 let db:IDBDatabase|null=null,closed=false;
 const opening=new Promise<IDBDatabase>((resolve,reject)=>{const r=factory.open('cf-ai-creature-originals-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('originals');r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Creature store blocked'));r.onsuccess=()=>{if(closed){r.result.close();reject(Error('Creature store closed'));return;}db=r.result;db.onversionchange=()=>{closed=true;db?.close();};resolve(db);};});
 const transaction=async<T>(mode:IDBTransactionMode,operation:(s:IDBObjectStore)=>IDBRequest<T>):Promise<T>=>{if(closed)throw Error('Creature store closed');const database=await opening;return new Promise((resolve,reject)=>{const t=database.transaction('originals',mode),r=operation(t.objectStore('originals'));t.oncomplete=()=>resolve(r.result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error??Error('Creature store aborted'));});};
 const find=async(input:AiCreatureInputV1):Promise<AiCreatureOriginalV1|null>=>{const key=creatureOriginalKey(input),r=await transaction('readonly',s=>s.get(key)) as AiCreatureOriginalV1|undefined;if(!r)return null;if(r.key!==key||!(r.blob instanceof Blob)||r.blob.type!=='image/png'||await hashLandfallBlobV1(r.blob)!==r.sha256)throw Error('Creature original corrupt');return Object.freeze(r);};
 return Object.freeze({find,read:find,async retain(input:AiCreatureInputV1,blob:Blob,receipt:string){const key=creatureOriginalKey(input);if(blob.type!=='image/png'||!blob.size||blob.size>64*1024*1024||!receipt||receipt.length>1048576)throw Error('Creature original payload');const row=Object.freeze({key,sha256:await hashLandfallBlobV1(blob),blob,receipt});await transaction('readwrite',s=>s.add(row,key));return (await find(input))!;},close(){closed=true;db?.close();}});
}
export async function obtainCreatureOriginalV1(store:AiCreatureOriginalStoreV1,input:AiCreatureInputV1,tier:'desktop'|'phone',infer:()=>Promise<{blob:Blob;receipt:string}>){
 const existing=await store.find(input);if(existing)return {original:existing,inferencePasses:0};
 if(tier!=='desktop')return {original:null,inferencePasses:0,painterFallback:true};
 const generated=await infer();return {original:await store.retain(input,generated.blob,generated.receipt),inferencePasses:1};
}
