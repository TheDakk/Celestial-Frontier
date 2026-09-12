import assert from 'node:assert/strict';
import {test} from 'node:test';
import {erodeAlpha,keyAndDespill,pinkExcess,compositeLayer,latentInteriorMask,protectLatents} from './kit-contact-math.mjs';
import {placementBox,admitKitEngineJob} from './kit-engine-math.mjs';
import fs from 'node:fs';

test('one-pixel erosion and sampled inward despill remove injected pink edge without recolouring the interior',()=>{
  const w=32,h=32,p=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)p.set(x>=6&&x<26&&y>=6&&y<26?[70,90,40,255]:[255,0,255,255],(y*w+x)*4);
  for(let y=7;y<25;y++)p.set([145,70,135,255],(y*w+7)*4);
  const before=p.slice(),out=keyAndDespill(p,w,h);
  assert.equal(out.rgba[(16*w+6)*4+3],0);assert.equal(out.rgba[(16*w+7)*4+3],255);
  assert.equal(out.receipt.erodedPixels,76);assert.ok(out.receipt.despilledPixels>0);assert.equal(out.receipt.unresolvedEdgePixels,0);
  assert.ok(pinkExcess(...out.rgba.subarray((16*w+7)*4,(16*w+7)*4+3))<=8);
  assert.ok(pinkExcess(...before.subarray((16*w+7)*4,(16*w+7)*4+3))>8); // Same edge criterion rejects no-despill control.
  assert.deepEqual(p,before);assert.deepEqual([...out.rgba.subarray((16*w+16)*4,(16*w+16)*4+4)],[70,90,40,255]);
  assert.notDeepEqual(erodeAlpha(new Uint8Array(25).fill(255),5,5,1),new Uint8Array(25).fill(255));
});
test('premultiplied sampling cannot carry invisible magenta into a scaled edge',()=>{
  const src=Uint8ClampedArray.of(255,0,255,0,50,100,40,255),dst=new Uint8ClampedArray(8*4).fill(255);
  compositeLayer(dst,8,1,src,2,1,{x:0,y:0,width:2,height:1},{x:0,y:0,width:8,height:1});
  for(let i=0;i<8;i++)assert.ok(pinkExcess(...dst.subarray(i*4,i*4+3))===0);
});
test('latent interiors stay anchored while boundary and ground remain editable; no-mask control fails',()=>{
  const w=128,h=128,alpha=new Uint8Array(w*h);for(let y=24;y<104;y++)for(let x=24;x<104;x++)alpha[y*w+x]=255;
  const {latent}=latentInteriorMask([alpha],w,h),n=latent.length*128,original=new Float32Array(n).fill(.25),noise=new Float32Array(n).fill(.8),predicted=new Float32Array(n).fill(-.6);
  const out=protectLatents(predicted,original,noise,latent,0),inside=latent.findIndex(v=>v===1)*128,outside=latent.findIndex(v=>v===0)*128;
  assert.equal(out[inside],.25);assert.equal(out[outside],predicted[outside]);assert.notEqual(predicted[inside],out[inside]);
  assert.throws(()=>latentInteriorMask([new Uint8Array(w*h)],w,h),/Empty/);
});
test('prepared profile meets scale relationships and refuses the former unmasked recipe',()=>{
  const job=JSON.parse(fs.readFileSync(new URL('../../audits/ART_KIT_CONTACT_REVISION_20260912/prepared/recipe.json',import.meta.url)));
  admitKitEngineJob(job);const box=n=>placementBox(job.passes.find(p=>p.name===n).placement,{x:0,y:0,width:100,height:100},1024,576);
  assert.ok(box('Civet').height/576>=.28);assert.equal(box('Platypus').height/box('Civet').height,.6);assert.equal(box('Frog').width/1024,.12);assert.ok(box('Persimmon').height>box('Civet').height);
  assert.throws(()=>admitKitEngineJob({...job,finisherStrength:.08}));assert.throws(()=>admitKitEngineJob({...job,skipOrganismPasses:false}));
  const old=JSON.parse(fs.readFileSync(new URL('../../audits/ART_KIT_ENGINE_PROOF_20260912/recipe.json',import.meta.url)));assert.throws(()=>admitKitEngineJob(old),/Contact experiment/);
});
