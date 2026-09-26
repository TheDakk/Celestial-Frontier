import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {extractNativePlanning,exportCurrentPoses,PRODUCER_SHA256} from './export-current-poses.mjs';

const root=path.resolve(import.meta.dirname,'../../../..');
const manifestFile=path.join(root,'audits/C2_CONTINUOUS_SKIN_20260916/candidate-08/manifest.json');
const producerDirectory=path.join(root,'port/v2/apps/game/src');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('planning is taken from the native owner; duplicate or missing declarations refuse',()=>{
 const source=fs.readFileSync(path.join(import.meta.dirname,'parts-motion-entry.mjs'),'utf8');
 const plan=extractNativePlanning(source);
 assert.ok(plan.includes(source.match(/^ const makePlan=(.+);$/m)[1]));
 assert.ok(plan.includes(source.match(/^const bounds=(.+);$/m)[1]));
 assert.match(plan,/W=896,H=504/);
 assert.throws(()=>extractNativePlanning(source+'\n'+source.match(/^ const makePlan=.+;$/m)[0]+'\n'),/source shape changed/);
 assert.throws(()=>extractNativePlanning(source.replace(/^const bounds=.+;\n/m,'')),/source shape changed/);
 assert.throws(()=>extractNativePlanning(source.replace(/^const W=/m,'const WIDTH=')),/stage dimensions changed/);
});

test('changed producer is refused before exporting any evidence; existing output is protected',async()=>{
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-pose-export-test-'));
 try{
  fs.mkdirSync(path.join(scratch,'producer/motion'),{recursive:true});
  fs.writeFileSync(path.join(scratch,'producer/motion/gsap-adapter.ts'),'not the pinned producer');
  const outputDirectory=path.join(scratch,'output');
  await assert.rejects(exportCurrentPoses({manifestFile,producerDirectory:path.join(scratch,'producer'),outputDirectory}),/Unexpected GSAP producer bytes/);
  assert.equal(fs.existsSync(outputDirectory),false);
  await assert.rejects(exportCurrentPoses({manifestFile,producerDirectory,outputDirectory:scratch}),/New output directory required/);
 }finally{fs.rmSync(scratch,{recursive:true,force:true});}
});

test('actual current producer exports 1201 resolved poses each, deterministically and source-bound',{skip:!fs.existsSync(producerDirectory)},async()=>{
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-pose-export-test-'));
 try{
  const first=await exportCurrentPoses({manifestFile,producerDirectory,outputDirectory:path.join(scratch,'one')});
  const second=await exportCurrentPoses({manifestFile,producerDirectory,outputDirectory:path.join(scratch,'two')});
  assert.equal(first.status,'EXPORTED');assert.equal(first.exactSourceSnapshot,true);assert.equal(first.producerSha256,PRODUCER_SHA256);
  assert.deepEqual(first.subjects,second.subjects);
  for(const row of first.subjects){
   const file=fs.readFileSync(path.join(scratch,'one',row.file)),data=JSON.parse(file);
   assert.equal(sha(file),row.sha256);assert.equal(data.dense.length,1201);assert.equal(Object.keys(data.namedPoses).length,10);
   for(const [index,sample]of data.dense.entries()){
    assert.equal(sample.index,index);assert.equal(sample.atMs,index*10000/1200);
    assert.equal(sample.role,index>=600?'target':'attacker');
    if(sample.role==='target')assert.equal(sample.planted,true);
    for(const key of Object.values(sample.pose))assert.ok([key.rotation,key.dx??0,key.dy??0].every(Number.isFinite));
   }
   assert.equal(data.dense[263].atMs,2191.6666666666665);
   assert.deepEqual(data.namedPoses.rest.pose,{});
  }
  const receipt=JSON.parse(fs.readFileSync(path.join(scratch,'one/report.json')));
  assert.ok(receipt.sources.some(r=>r.path.endsWith('/turn-performance.mjs')));
  assert.ok(receipt.sources.some(r=>r.path.endsWith('/creature-rig-contact.ts')));
  assert.ok(receipt.sources.some(r=>r.path.endsWith('/parts-motion-entry.mjs')));
  for(const source of receipt.sources)assert.equal(sha(fs.readFileSync(source.path)),source.sha256);
 }finally{fs.rmSync(scratch,{recursive:true,force:true});}
});
