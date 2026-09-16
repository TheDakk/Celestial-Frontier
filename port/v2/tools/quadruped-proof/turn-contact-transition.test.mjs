import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {pathToFileURL} from 'node:url';
import {rolldown} from 'rolldown';
import {createTurnPoseSampler} from './turn-performance.mjs';
import {createTurnContactSampler} from './turn-contact-transition.mjs';
import {exportCurrentPoses} from './export-current-poses.mjs';
const root=path.resolve(import.meta.dirname,'../../../..');
const producer='/Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/apps/game/src';
const fixturePlans=()=>[0,1].map(i=>({
 marker:3,beats:{commandEnd:100,actionStart:200,impactAt:250,hitstopEnd:280,actionEnd:400,returnEnd:600},
 clips:{attacker:{idle:{source:'timeline',timeline:{value:1}},approach:{source:'timeline',timeline:{value:0,durationMs:100}},action:{source:'timeline',timeline:{value:0}}},target:{idle:{source:'timeline',timeline:{value:40+i}}}},
}));
const poseDelta=(a,b)=>Math.max(0,...[...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(n=>['rotation','dx','dy'].map(k=>Math.abs((a[n]?.[k]??0)-(b[n]?.[k]??0)))));

test('one idle clip continues across roles and pauses in both existing hitstops',()=>{
 const sampler=createTurnPoseSampler((timeline,target)=>({seek(ms){target.setJoint('root',timeline.value+ms/1000,0,0);},stop(){}}));
 const plans=fixturePlans();
 assert.ok(poseDelta(sampler.sample(plans[0],4999.999),sampler.sample(plans[1],.001,true))>30); // previous role reset
 const before=structuredClone(sampler.sampleSequence(plans,4999.999)),after=structuredClone(sampler.sampleSequence(plans,5000.001));
 assert.ok(poseDelta(before,after)<.00001);
 for(const offset of [0,5000])assert.deepEqual(sampler.sampleSequence(plans,offset+260),sampler.sampleSequence(plans,offset+275));
 sampler.dispose();assert.throws(()=>sampler.sampleSequence(plans,500),/Invalid turn sample/);
});

test('support releases and reacquires continuously without changing grounded solves or admitting a refused endpoint',()=>{
 const plans=fixturePlans(),motionSampler={sampleSequence:(p,ms)=>({root:{rotation:ms/10000,dy:p[0].marker/100}})};
 let groundedCalls=0;const solver={resolve(raw,planted){assert.equal(planted,true);groundedCalls++;return {pose:{root:{...raw.root,dy:raw.root.dy+.02},paw:{rotation:.4}},compression:.02};}};
 const subject=createTurnContactSampler({plans,motionSampler,solver});plans[0].marker=99;
 for(const ms of [0,100,600,5000,7400]){const result=subject.resolve(ms);assert.equal(result.planted,true);assert.equal(result.supportWeight,1);assert.deepEqual(result.pose,solver.resolve(subject.sample(ms),true).pose);}
 for(const ms of [100,200,400,600,5000])assert.ok(poseDelta(subject.resolve(ms-.00001).pose,subject.resolve(ms+.00001).pose)<.00001);
 const before=groundedCalls;subject.resolve(150);subject.resolve(300);subject.resolve(500);assert.equal(groundedCalls,before); // airborne support never forces an out-of-bound solve
 assert.equal(subject.resolve(200).supportWeight,0);assert.equal(subject.resolve(400).supportWeight,0);
 assert.equal(subject.resolve(150).supportWeight,.5);assert.equal(subject.resolve(500).supportWeight,.5);
 assert.equal(subject.sample(100).root.dy,.03); // input edits cannot alter admitted boundaries
 assert.throws(()=>createTurnContactSampler({plans:fixturePlans(),motionSampler,solver:{resolve(){throw Error('compression bound');}}}),/compression bound/);
 assert.throws(()=>subject.resolve(NaN),/Invalid turn sequence/);
 assert.throws(()=>subject.resolve(150,{root:{rotation:Infinity}}),/Nonfinite/);
});

test('actual current producer has continuous support/role boundaries, exact grounded contacts and frame-rate-independent seeks',{skip:!fs.existsSync(producer)},async()=>{
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-turn-contact-test-'));
 try{
  const manifestPath=path.join(root,'audits/C2_CONTINUOUS_SKIN_20260916/candidate-08/manifest.json');
  await exportCurrentPoses({manifestFile:manifestPath,producerDirectory:producer,outputDirectory:path.join(scratch,'poses')});
  const entry=`import {createGsapPlayer} from 'cf-proof/motion/index.ts';
import {createTurnPoseSampler} from '${root}/port/v2/tools/quadruped-proof/turn-performance.mjs';
import {createTurnContactSampler} from '${root}/port/v2/tools/quadruped-proof/turn-contact-transition.mjs';
import {createQuadrupedContactSolver} from '${root}/port/v2/apps/game/src/creature-rig-contact.ts';
export function create(record,plans){const sampler=createTurnPoseSampler(createGsapPlayer),solver=createQuadrupedContactSolver(record);return {sampler,solver,contact:createTurnContactSampler({plans,motionSampler:sampler,solver})};}`;
  const bundle=await rolldown({input:'\0actual-contact-test',platform:'node',plugins:[{name:'actual-contact-test',resolveId(id){if(id==='\0actual-contact-test')return id;if(id.startsWith('cf-proof/'))return path.join(producer,id.slice(9));},load(id){if(id==='\0actual-contact-test')return entry;}}]});
  try{await bundle.write({file:path.join(scratch,'bundle.mjs'),format:'es'});}finally{await bundle.close();}
  const {create}=await import(pathToFileURL(path.join(scratch,'bundle.mjs')).href);
  for(const row of JSON.parse(fs.readFileSync(manifestPath)).results){
   const data=JSON.parse(fs.readFileSync(path.join(scratch,'poses',row.id+'-poses.json'))),record=JSON.parse(fs.readFileSync(path.join(root,row.record))),{plans}=data,b=plans[0].beats;
   const owner=create(record,plans);
   try{
    const old=ms=>{const reverse=ms>=5000,t=reverse?ms-5000:ms,p=plans[reverse?1:0];return owner.solver.resolve(owner.sampler.sample(p,t,reverse),reverse||t<p.beats.commandEnd||t>=p.beats.returnEnd).pose;};
    for(const at of [b.commandEnd,b.returnEnd,5000])assert.ok(poseDelta(old(at-.00001),old(at+.00001))>.001,row.id+' old jump control '+at);
    for(const at of [b.commandEnd,b.actionStart,b.impactAt,b.hitstopEnd,b.actionEnd,b.returnEnd,5000,5000+plans[1].beats.impactAt,5000+plans[1].beats.hitstopEnd]){
     assert.ok(poseDelta(owner.contact.resolve(at-.00001).pose,owner.contact.resolve(at+.00001).pose)<.0001,row.id+' continuity '+at);
    }
    for(const at of [0,500,b.commandEnd,b.returnEnd,4999,5000,7110,7180,7400,9999,10000])assert.deepEqual(owner.contact.resolve(at).pose,owner.solver.resolve(owner.contact.sample(at),true).pose,row.id+' exact grounded '+at);
    assert.throws(()=>owner.solver.resolve({root:{rotation:0,dy:-1}},true),/compression bound/);
    const common=Array.from({length:11},(_,i)=>i*1000),expected=new Map(common.map(at=>[at,owner.contact.resolve(at).pose]));
    for(const hz of [30,60,120]){
     for(let i=0;i<=10*hz;i++)owner.contact.resolve(i*1000/hz);
     for(const at of common)assert.deepEqual(owner.contact.resolve(at).pose,expected.get(at),row.id+' '+hz+' Hz deterministic seek '+at);
    }
   }finally{owner.sampler.dispose();}
  }
 }finally{fs.rmSync(scratch,{recursive:true,force:true});}
});

test('right combatant keeps its own idle and releases support only during its own attack',()=>{
 const sampler=createTurnPoseSampler((timeline,target)=>({seek(ms){target.setJoint('root',timeline.value+(timeline.value?ms/1000:0),0,0);},stop(){}}));
 const plans=fixturePlans(),solver={resolve(pose){return {pose,compression:0};}},right=createTurnContactSampler({plans,motionSampler:sampler,solver,side:'right'});
 assert.equal(right.resolve(300).role,'target');assert.equal(right.resolve(300).planted,true);
 assert.equal(right.resolve(5300).role,'attacker');assert.equal(right.resolve(5300).supportWeight,0);
 assert.equal(right.resolve(5600).planted,true);
 assert.ok(right.sample(500).root.rotation>40); // refuses accidental use of the left actor's seeded idle
 assert.ok(poseDelta(right.sample(4999.999),right.sample(5000.001))<.00001);
 const old=createTurnContactSampler({plans,motionSampler:sampler,solver});assert.equal(old.resolve(5300).role,'target'); // old left-only owner is the failing-role control
 assert.notDeepEqual(old.sample(500),right.sample(500));
 assert.throws(()=>createTurnContactSampler({plans,motionSampler:sampler,solver,side:'invalid'}),/side/);
 for(const at of [5100,5200,5400,5600])assert.ok(poseDelta(right.resolve(at-.00001).pose,right.resolve(at+.00001).pose)<.00001);
 sampler.dispose();
});
