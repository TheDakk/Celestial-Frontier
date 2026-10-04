import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
import {Texture,TextureSource} from 'pixi.js';
import {getBattle2MasterPin} from './battle2-master-pins.generated.js';
import {loadPinnedCreatureRigV1,loadCreatureRigV1} from './creature-rig.js';
import type {Battle2PinnedBytesV1} from './battle2-master-pin-admission.js';
import {decodePng} from './morph/png-decode.js';
const root=new URL('../../../../../',import.meta.url),pin=getBattle2MasterPin('civet')!;
const read=(p:string)=>new Uint8Array(readFileSync(new URL(p,root)));
function input():Battle2PinnedBytesV1{return {pin,creatureId:'civet',record:JSON.parse(new TextDecoder().decode(read(pin.recordPath))),alphaPath:pin.alphaPath,alpha:read('port/v2/apps/game/public/battle2/'+pin.alphaPath),bindingBytes:read(pin.recordPath.replace('record.json','binding.json')),atlasPath:pin.atlasPath,atlas:read(pin.atlasPath)};}
function decoder(){const b=JSON.parse(new TextDecoder().decode(input().bindingBytes));return vi.fn(async()=>new Texture({source:new TextureSource({width:b.atlasSize.width,height:b.atlasSize.height})}));}
it('genuine pin uses the same runtime tail and published vertices as master-byte admission',async()=>{
 const i=input(),b=JSON.parse(new TextDecoder().decode(i.bindingBytes)),r=i.record as Parameters<typeof loadCreatureRigV1>[0];
 const d=await decodePng(i.alpha),alpha=new Uint8Array(d.width*d.height);for(let k=0;k<alpha.length;k++)alpha[k]=d.rgba[k*4+3]!;
 const a=await loadPinnedCreatureRigV1(i,decoder()),old=await loadCreatureRigV1(r,b,read(pin.masterPath),alpha,i.atlas,decoder());
 try{for(const pose of[{}, {head:{rotation:.02}},{}]){a.applyPose(pose);old.applyPose(pose);
  const geometry=(rig:typeof a)=>rig.parts.map(p=>{const mesh=p.display.children[0] as unknown as {geometry:{getBuffer:(s:string)=>{data:unknown}}};return Array.from(mesh.geometry.getBuffer('aPosition').data as Float32Array);});
  expect(geometry(a)).toEqual(geometry(old));}expect(a.recipeHash).toBe(old.recipeHash);expect(a.parts.map(p=>p.id)).toEqual(old.parts.map(p=>p.id));
 }finally{a.dispose();old.dispose();}
});
it('rejects forged authority before reading caller record or decoding',async()=>{
 const i=input(),decode=decoder();let reads=0;
 for(const fake of[{...pin},JSON.parse(JSON.stringify(pin)),Object.create(pin),null]){
  await expect(loadPinnedCreatureRigV1({...i,pin:fake,get record(){reads++;throw Error('read');}},decode)).rejects.toThrow('untrusted-pin-authority');
 }expect(reads).toBe(0);expect(decode).not.toHaveBeenCalled();
});
it('rejects every changed byte authority before atlas decode, with genuine controls on both sides',async()=>{
 const decode=decoder();const good=await loadPinnedCreatureRigV1(input(),decode);good.dispose();decode.mockClear();
 const flip=(b:Uint8Array)=>{const c=b.slice();c[Math.floor(c.length/2)]!^=1;return c;};
 for(const patch of[{creatureId:'other'}, {record:{...input().record as object,recipeHash:'bad'}}, {alphaPath:'./'+pin.alphaPath}, {atlasPath:'./'+pin.atlasPath}, {alpha:flip(input().alpha)}, {bindingBytes:flip(input().bindingBytes)}, {atlas:flip(input().atlas)}]){
  await expect(loadPinnedCreatureRigV1({...input(),...patch},decode)).rejects.toThrow('battle2 pin refused');
 }expect(decode).not.toHaveBeenCalled();const last=await loadPinnedCreatureRigV1(input(),decode);last.dispose();expect(decode).toHaveBeenCalledTimes(1);
});
it('snapshots mutable bytes and record before an asynchronous hash can race the caller',async()=>{
 const i=input(),decode=decoder(),loading=loadPinnedCreatureRigV1(i,decode);
 i.alpha.fill(0);i.atlas.fill(0);i.bindingBytes.fill(0);(i.record as {recipeHash:string}).recipeHash='raced';
 const rig=await loading;expect(rig.recipeHash).toBe(pin.recipeHash);rig.dispose();expect(decode).toHaveBeenCalledTimes(1);
});
