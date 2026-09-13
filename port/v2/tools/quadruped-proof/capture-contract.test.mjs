import test from 'node:test';import assert from 'node:assert/strict';import {requireTenSecondMedia} from './capture-contract.mjs';
test('independent media duration rejects first short recordings and missing/overlong evidence',()=>{
 for(const seconds of [8.316351,8.316587,9.875067,0,NaN,Infinity,11])assert.throws(()=>requireTenSecondMedia(seconds),/Encoded capture/);
 for(const seconds of [10,10.1,10.75])assert.equal(requireTenSecondMedia(seconds),seconds);
});
test('startup feeds frames before acknowledgment and refuses a recorder that never starts',async()=>{
 const {primeRecorder}=await import('./capture-contract.mjs');
 for(const accepts of [true,false]){
  let ticks=0,frames=0,painted=false;
  const pending=primeRecorder({started:()=>accepts&&frames>=3,paint:()=>{painted=true;},requestFrame:()=>{assert(painted);painted=false;frames++;},schedule:fn=>queueMicrotask(()=>{ticks++;fn();}),now:()=>ticks,timeoutMs:8});
  if(accepts){await pending;assert.equal(frames,3);}else await assert.rejects(pending,/while feeding frames/);
 }
});
