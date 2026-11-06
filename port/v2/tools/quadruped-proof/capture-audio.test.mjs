import test from 'node:test';import assert from 'node:assert/strict';import {inspectCapturePcm} from './capture-audio.mjs';
test('audio evidence rejects silence, corruption and incomplete tracks',()=>{
 const pcm=Float32Array.from({length:480000},(_,i)=>.05*Math.sin(i/20));assert.equal(inspectCapturePcm(pcm,48000).status,'PASS');
 assert.throws(()=>inspectCapturePcm(new Float32Array(480000),48000),/silent/);pcm[32]=NaN;assert.throws(()=>inspectCapturePcm(pcm,48000),/nonfinite/);pcm[32]=0;
 assert.throws(()=>inspectCapturePcm(pcm.slice(0,240000),48000),/incomplete/);
});
