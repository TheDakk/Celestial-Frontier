import test from 'node:test';
import assert from 'node:assert/strict';
import {measureCreatureUpdate} from './creature-update-timing.mjs';
import {inspectFramePacing} from './motion-proof-contract.mjs';

test('the creature budget counts slow producer sampling and slow contact solving',()=>{
 const deltas=Array(600).fill(1000/60);
 for(const slowPhase of ['sample','contact','publish']){
  let clock=0;const calls=[];
  const stage=(name,value)=>{calls.push(name);clock+=name===slowPhase?3:.1;return value;};
  const result=measureCreatureUpdate(()=>{
   const raw=stage('sample',{root:{rotation:.2}});
   const resolved=stage('contact',raw);
   return stage('publish',resolved);
  },()=>clock);
  assert.deepEqual(calls,['sample','contact','publish']);assert.equal(result.result.root.rotation,.2);
  assert.ok(result.updateMs>=3.19);
  assert.throws(()=>inspectFramePacing(deltas,Array(601).fill(result.updateMs),Array(601).fill(5)),/2 ms creature update/);
  if(slowPhase!=='publish'){
   // Failing control: the previous publication-only instrument misses the cost.
   assert.doesNotThrow(()=>inspectFramePacing(deltas,Array(601).fill(.1),Array(601).fill(5)));
  }
 }
});

test('timing preserves the callback result, executes once and never masks failures',()=>{
 let calls=0,clock=0;const value={pose:{}};
 const result=measureCreatureUpdate(()=>{calls++;clock=.8;return value;},()=>clock);
 assert.equal(calls,1);assert.equal(result.result,value);assert.equal(result.updateMs,.8);
 const admitted=inspectFramePacing(Array(600).fill(1000/60),Array(601).fill(.8),Array(601).fill(3));
 assert.equal(admitted.creatureUpdateP95Ms,.8);assert.equal(admitted.timingScope,'producer sampling + contact solve + rig publication');
 assert.equal(Object.hasOwn(admitted,'rigUpdateP95Ms'),false);
 assert.throws(()=>measureCreatureUpdate(()=>{throw Error('contact refused');},()=>0),/contact refused/);
 assert.throws(()=>measureCreatureUpdate(()=>{},()=>NaN),/clock/);
 const backwards=[2,1];assert.throws(()=>measureCreatureUpdate(()=>{},()=>backwards.shift()),/clock/);
});
