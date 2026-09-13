import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const base=new URL('./',import.meta.url),source=fs.readFileSync(new URL('native-runner.mjs',base),'utf8');
const start=source.indexOf('function assertVoiceRetirement(report) {'),end=source.indexOf('let browser,send,evaluate',start);assert(start>0&&end>start);
const fn=Function('assert',source.slice(start,end)+';return assertVoiceRetirement;')(assert);
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),results=[];
for(const name of ['native-first','native-ordinal-corrected']){
 const bytes=fs.readFileSync(new URL(name+'/review.json',base)),r=JSON.parse(bytes);r.final??=r.after;
 fn(r);const controls=[];
 for(const [id,mutate] of [
  ['missing-retirement',x=>{x.final.audio.runtime.voices.stopped--;}],
  ['live-voice',x=>{x.final.audio.runtime.voices.active=1;}],
  ['tracked-voice',x=>{x.final.audio.runtime.voices.ids=['stale'];}],
  ['mix-owner',x=>{x.final.audio.runtime.voiceMix.activeOwners=1;}],
  ['node-leak',x=>{x.final.audio.runtime.nodes.active=x.before.audio.runtime.nodes.active+1;}],
  ['cleanup-fault',x=>{x.final.audio.runtime.cleanup.sourceStopFailures=1;}],
 ]) {const mutant=structuredClone(r);mutate(mutant);assert.throws(()=>fn(mutant),assert.AssertionError);controls.push(id);}
 results.push({name,sourceSha256:hash(bytes),baseline:'PASS',negativeControlsRejected:controls});
}
const receipt={schema:'cf-charter-finite-retirement-observer/v1',status:'PASS',observerSha256:hash(source.slice(start,end)),results,productChanged:false,nativeRetried:false};
fs.writeFileSync(new URL('completion-observer-controls.json',base),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
