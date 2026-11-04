import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {TEMPLATE,checkGeometry,sealRecord,admitRecord,triangulateAlpha,createRig,sampleClip,applyPose,inspectShape} from './quadruped-template.mjs';
const root=new URL('../../../../',import.meta.url);
const record=JSON.parse(fs.readFileSync(new URL('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json',root)));
const bytes=fs.readFileSync(new URL(record.source,root));
test('hash-bound master, corruption, swapped cut-out and unsupported serpent controls',async()=>{
 assert(await admitRecord(record,bytes));
 const corrupt=structuredClone(record);corrupt.landmarks.head[0]=.04;
 await assert.rejects(admitRecord(corrupt,bytes),/corrupted landmark/);
 await assert.rejects(admitRecord(record,new Uint8Array([1,2])),/mismatched cut-out/);
 const serpent=structuredClone(record);serpent.kind='serpent';assert.throws(()=>checkGeometry(serpent),/unsupported body/);
 const short=structuredClone(record);short.landmarks.foreNearKnee=short.landmarks.foreNearAnkle;assert.throws(()=>checkGeometry(short),/degenerate/);
 const correctedHash=await sealRecord(record);assert.throws(()=>checkGeometry(correctedHash,new Uint8Array(1254*1254)),/outside painted alpha/);
 const override=structuredClone(record);override.clipOverrides={attack:4};assert.throws(()=>checkGeometry(override),/shared clip/);
});
test('alpha topology refines at silhouette, skips empty regions and shares edges',()=>{
 const a=new Uint8Array(128*128);for(let y=20;y<100;y++)for(let x=30;x<94;x++)a[y*128+x]=255;
 const mesh=triangulateAlpha(a,128,128);assert(mesh.leaves>0);assert(mesh.rest.length<128*128);
 assert(Math.min(...mesh.rest)>=0);const vertices=new Set();for(let i=0;i<mesh.rest.length;i+=2)vertices.add(mesh.rest[i]+','+mesh.rest[i+1]);assert.equal(vertices.size,mesh.rest.length/2);
 const sparse=a.slice();sparse.fill(0);sparse[64*128+64]=255;assert(triangulateAlpha(sparse,128,128).indices.length<mesh.indices.length);
 assert.throws(()=>triangulateAlpha(new Uint8Array(128*128),128,128),/empty alpha/);
});
test('template finite endpoints restore exact rest; curves move jaw, ears, tail and release feet only in attack',()=>{
 for(const clip of ['idle','attack','hit']){assert(Object.values(sampleClip(clip,0)).every(v=>v===0));assert(Object.values(sampleClip(clip,TEMPLATE.clips[clip])).every(v=>v===0));}
 assert(sampleClip('attack',1100).flight>0);assert.equal(sampleClip('idle',1500).flight,0);assert.equal(sampleClip('hit',650).flight,0);
 assert(sampleClip('attack',1100).jaw>0);assert(sampleClip('idle',1200).ear>0);assert.notEqual(sampleClip('idle',1200).tail,0);
 assert.throws(()=>sampleClip('idle',NaN),/finite clip/);
 const rig=createRig(record,new Uint8Array(1254*1254).fill(255));applyPose(rig,sampleClip('idle',1500));assert.notDeepEqual(rig.vertices,rig.rest);
 applyPose(rig,sampleClip('rest',0));assert.deepEqual(rig.vertices,rig.rest);assert(inspectShape(rig).holdsShape);
 const old=rig.vertices[0];rig.vertices[0]=1e8;assert.equal(inspectShape(rig).holdsShape,false);rig.vertices[0]=old;
});
