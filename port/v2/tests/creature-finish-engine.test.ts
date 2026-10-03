import {it,expect} from 'vitest';
import {createCreatureFinishEngineV1,creatureFinishIdentityV1,type CreatureFinishSourceV1,type CreatureFinishInferV1} from '../apps/game/src/creature-finish-engine.js';
import {creatureOriginalKey,type AiCreatureOriginalStoreV1,type AiCreatureOriginalV1,type AiCreatureInputV1} from '../apps/game/src/creature-originals.js';
import {LocalModelSha256V1} from '../apps/game/src/local-model-sha256.js';
import {encodePng} from '../apps/game/src/morph/png-encode.js';
import {decodePng} from '../apps/game/src/morph/png-decode.js';
const hash=(b:Uint8Array)=>new LocalModelSha256V1().update(b).digestHex();
async function source(id='individual-one'):Promise<CreatureFinishSourceV1>{
 const rgba=new Uint8Array([17,23,51,0,90,60,30,128,230,240,250,255,0,0,0,0]);
 const masterPng=await encodePng(rgba,2,2),labels=new Uint8Array([0,0,0,0,1,0,0,255,2,0,0,255,0,0,0,0]),binding=new Uint8Array([1,2,3]);
 return {individualId:id,visualKey:'species:seed:genes',recordRecipeHash:'a'.repeat(64),modelHash:'b'.repeat(64),settingsHash:'c'.repeat(64),seed:123,width:2,height:2,masterPng,labels,binding,cutoutAssetHash:hash(masterPng),labelsHash:hash(labels),bindingHash:hash(binding)};
}
function memoryStore(){const rows=new Map<string,AiCreatureOriginalV1>();let retains=0;const find=async(i:AiCreatureInputV1)=>rows.get(creatureOriginalKey(i))??null;
 const store:AiCreatureOriginalStoreV1={find,read:find,close(){},async retain(i,blob,receipt){const key=creatureOriginalKey(i);if(rows.has(key))throw Error('immutable');retains++;const row={key,blob,receipt,sha256:hash(new Uint8Array(await blob.arrayBuffer()))};rows.set(key,row);return row;}};
 return {store,rows,get retains(){return retains;}};
}
const unchanged:CreatureFinishInferV1=async(s)=>({rgba:s.rgba.slice(),labels:s.labels.slice(),binding:s.binding.slice()});
it('deduplicates pending exact individuals, separates different individuals, and reuses immutable originals',async()=>{
 const m=memoryStore();let calls=0,creates=0,active=0,maxActive=0;const engine=createCreatureFinishEngineV1({tier:'desktop',store:m.store,createInfer:async()=>{creates++;return async s=>{calls++;active++;maxActive=Math.max(maxActive,active);await Promise.resolve();active--;return unchanged(s);};}});
 const s=await source(),one=engine.request(s),two=engine.request(s),three=engine.request({...s,individualId:'another'});
 expect(one).toBe(two);const a=await one,b=await three;expect(a.status).toBe('original');expect(b.status).toBe('original');
 expect(calls).toBe(2);expect(creates).toBe(1);expect(maxActive).toBe(1);expect(m.retains).toBe(2);
 expect(await engine.request(s)).toMatchObject({status:'original',origin:'cache'});expect(calls).toBe(2);
 if(a.status==='original'){const png=await decodePng(new Uint8Array(await a.original.blob.arrayBuffer()));expect(png.rgba).toEqual((await decodePng(s.masterPng)).rgba);}
 expect(creatureOriginalKey(creatureFinishIdentityV1({...s,individualId:'another'}))).not.toBe(creatureOriginalKey(creatureFinishIdentityV1(s)));
});
it('phone accepts pinned delivered lossless original and never constructs a model, including misses',async()=>{
 const s=await source(),desktop=memoryStore(),made=await createCreatureFinishEngineV1({tier:'desktop',store:desktop.store,createInfer:async()=>unchanged}).request(s);expect(made.status).toBe('original');if(made.status!=='original')return;
 const phone=memoryStore();let creates=0;
 const engine=createCreatureFinishEngineV1({tier:'phone',store:phone.store,createInfer:async()=>{creates++;throw Error('phone model');},delivered:async i=>i.settingsHash===creatureFinishIdentityV1(s).settingsHash?made.original:null});
 expect(await engine.request(s)).toMatchObject({status:'original',origin:'delivery'});expect(await engine.request({...s,individualId:'missing'})).toMatchObject({status:'fallback'});expect(creates).toBe(0);expect(phone.retains).toBe(1);
});
for(const mutant of ['alpha','outside','labels','binding','mutate-source','boundary-gradient'] as const)it('refuses '+mutant+' before retention',async()=>{
 const m=memoryStore(),s=await source();const engine=createCreatureFinishEngineV1({tier:'desktop',store:m.store,createInfer:async()=>async input=>{const result=await unchanged(input);
  if(mutant==='alpha')result.rgba[7]=255;if(mutant==='outside')result.rgba[0]=0;
  if(mutant==='labels')result.labels[4]=2;if(mutant==='binding')result.binding[0]=99;
  if(mutant==='mutate-source')input.labels[4]=2;
  if(mutant==='boundary-gradient'){result.rgba.set([0,0,0],4);result.rgba.set([0,0,0],8);}
  return result;}});
 expect(await engine.request(s)).toMatchObject({status:'fallback'});expect(m.retains).toBe(0);
});
it('refuses wrong pins and vacuous label maps without constructing the model',async()=>{
 const s=await source(),m=memoryStore();let calls=0;const e=createCreatureFinishEngineV1({tier:'desktop',store:m.store,createInfer:async()=>{calls++;return unchanged;}});
 expect(await e.request({...s,labelsHash:'d'.repeat(64)})).toMatchObject({status:'fallback'});
 const labels=new Uint8Array(s.labels.length);expect(await e.request({...s,labels,labelsHash:hash(labels)})).toMatchObject({status:'fallback'});expect(calls).toBe(0);
});
it('bounds queue, snapshots caller buffers, and prevents retention after close',async()=>{
 const s=await source(),m=memoryStore();let release!:()=>void,started!:()=>void;const running=new Promise<void>(r=>{started=r;}),gate=new Promise<void>(r=>{release=r;});
 const e=createCreatureFinishEngineV1({tier:'desktop',store:m.store,maxPending:1,createInfer:async()=>async input=>{started();await gate;return unchanged(input);}});
 const pending=e.request(s);s.labels[4]=99;await running;expect(await e.request(await source('two'))).toEqual({status:'fallback',reason:'finish queue full'});e.close();release();expect(await pending).toMatchObject({status:'fallback',reason:'Error: engine closed'});expect(m.retains).toBe(0);
});
it('refuses corrupt delivered receipt or bytes without model fallback or retention',async()=>{
 const s=await source(),m=memoryStore(),made=await createCreatureFinishEngineV1({tier:'desktop',store:m.store,createInfer:async()=>unchanged}).request(s);if(made.status!=='original')throw Error('fixture');
 for(const row of [{...made.original,receipt:JSON.stringify({...JSON.parse(made.original.receipt),bindingHash:'e'.repeat(64)})},{...made.original,sha256:'e'.repeat(64)}]){
  const target=memoryStore();let creates=0;const e=createCreatureFinishEngineV1({tier:'desktop',store:target.store,delivered:async()=>row,createInfer:async()=>{creates++;return unchanged;}});
  expect(await e.request(s)).toMatchObject({status:'fallback'});expect(creates).toBe(0);expect(target.retains).toBe(0);
 }
});
it('retains an actual RGB finish while preserving translucent alpha and outside RGB exactly',async()=>{
 const s=await source(),m=memoryStore();const e=createCreatureFinishEngineV1({tier:'desktop',store:m.store,createInfer:async()=>async input=>{const out=await unchanged(input);out.rgba[8]=255;out.rgba[9]=255;out.rgba[10]=255;return out;}});
 const result=await e.request(s);expect(result.status).toBe('original');if(result.status!=='original')return;
 const pixels=(await decodePng(new Uint8Array(await result.original.blob.arrayBuffer()))).rgba;
 expect(pixels[8]).toBe(255);expect(pixels[7]).toBe(128);expect([...pixels.slice(0,4)]).toEqual([17,23,51,0]);
 expect(JSON.parse(result.original.receipt).conservation.parts.some((p:{rgbRms:number})=>p.rgbRms>0)).toBe(true);
});
it('every visual/seed/settings/model/rig input invalidates the exact-individual cache key',async()=>{
 const s=await source(),key=creatureOriginalKey(creatureFinishIdentityV1(s));
 for(const change of [{visualKey:'other'},{seed:124},{settingsHash:'d'.repeat(64)},{modelHash:'d'.repeat(64)},{recordRecipeHash:'d'.repeat(64)},{labelsHash:'d'.repeat(64)},{bindingHash:'d'.repeat(64)}])expect(creatureOriginalKey(creatureFinishIdentityV1({...s,...change}))).not.toBe(key);
});
it('runtime visual identities retain their exact strings through2048, while missing/non-string/2049 identities refuse',async()=>{
 const s=await source();for(const length of[739,747,2048]){const id='x'.repeat(length);const result=await createCreatureFinishEngineV1({tier:'desktop',store:memoryStore().store,createInfer:async()=>unchanged}).request({...s,individualId:id,visualKey:id});expect(result.status).toBe('original');if(result.status==='original'){const r=JSON.parse(result.original.receipt);expect(r.individualId).toBe(id);expect(r.visualKey).toBe(id);expect(result.original.receipt.length).toBeLessThan(1048576);}}
 for(const field of['individualId','visualKey'])for(const bad of['','x'.repeat(2049),undefined,null,123,[],{length:1,toString:()=> 'x'}])expect(()=>creatureFinishIdentityV1({...s,[field]:bad} as CreatureFinishSourceV1)).toThrow('individual identity');
 expect(()=>creatureFinishIdentityV1({...s,modelHash:{toString:()=> 'a'.repeat(64)}} as unknown as CreatureFinishSourceV1)).toThrow('source identity');
});
