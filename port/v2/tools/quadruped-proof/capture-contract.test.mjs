import test from 'node:test';import assert from 'node:assert/strict';import {requireTenSecondMedia} from './capture-contract.mjs';
import {requireSkinCaptureGate,requireSkinCaptureSnapshot} from './capture-contract.mjs';
test('skin capture refuses rest drift, untested motion, slow update and diagnostic substitution',()=>{
 const good={status:'PASS',mode:'--skin-gates',diagnostic:false,dirtyAtStart:[],exactSourceSnapshot:true,sources:[{path:'source',sha256:'bound'}],skinGates:{status:'PASS',rows:['civet','fox','procedural'].map(id=>({id,status:'PASS',restChangedChannels:0,finalRestChangedChannels:0,dense:{samples:1201,firstFailure:null},updateP95Ms:.9,renderedContacts:{status:'PASS'},sourceJoins:{status:'PASS',dense:{samples:1201}}}))}};
 assert.equal(requireSkinCaptureGate(good),good);
 for(const mutate of [g=>g.skinGates.rows.pop(),g=>g.skinGates.rows[1].restChangedChannels=1,g=>g.skinGates.rows[2].finalRestChangedChannels=1,g=>g.skinGates.rows[0].dense.samples=1200,g=>g.skinGates.rows[0].updateP95Ms=2,g=>g.skinGates.rows[0].renderedContacts.status='FAIL',g=>delete g.skinGates.rows[1].renderedContacts,g=>delete g.skinGates.rows[0].sourceJoins,g=>g.skinGates.rows[1].sourceJoins.status='FAIL',g=>g.skinGates.rows[2].sourceJoins.dense.samples=1200,g=>g.exactSourceSnapshot=false,g=>g.dirtyAtStart=['M source']]){const g=structuredClone(good);mutate(g);assert.throws(()=>requireSkinCaptureGate(g),/qualification/);}
 const diagnostic={...good,status:'DIAGNOSTIC_PASS',diagnostic:true,dirtyAtStart:['M source']};assert.throws(()=>requireSkinCaptureGate(diagnostic),/qualification/);assert.equal(requireSkinCaptureGate(diagnostic,{diagnostic:true}),diagnostic);
});
test('capture binds complete source inventory, manifest, generated program and actual asset routing before filming',()=>{
 const a='a'.repeat(64),b='b'.repeat(64),c='c'.repeat(64),gate={sources:[{path:'/source.mjs',sha256:a},{path:'/candidate/manifest.json',sha256:b}],captureSnapshot:{schema:'cf.motion-capture-source/v1',candidateManifest:{path:'/candidate/manifest.json',sha256:b},servedFiles:[{name:'bundle.js',sha256:c,sourcePath:null},{name:'civet.binding.json',sha256:a,sourcePath:'/candidate/civet.binding.json'}]}};
 const current=structuredClone(gate);assert.equal(requireSkinCaptureSnapshot(gate,current),true);
 current.sources.reverse();current.captureSnapshot.servedFiles.reverse();assert.equal(requireSkinCaptureSnapshot(gate,current),true);
 for(const mutate of [
  x=>x.sources.push({path:'/unqualified/new.mjs',sha256:a}),x=>x.sources.pop(),x=>x.sources[0].sha256=c,
  x=>x.captureSnapshot.candidateManifest={path:'/unqualified/manifest.json',sha256:b},
  x=>x.captureSnapshot.candidateManifest.sha256=c,
  x=>x.captureSnapshot.servedFiles[0].sha256=a,
  x=>x.captureSnapshot.servedFiles[1].sourcePath='/unqualified/civet.binding.json',
  x=>x.captureSnapshot.servedFiles[1].name='fox.binding.json',
  x=>x.captureSnapshot.servedFiles.push({...x.captureSnapshot.servedFiles[0]}),
  x=>delete x.captureSnapshot,
 ]){const changed=structuredClone(gate);mutate(changed);assert.throws(()=>requireSkinCaptureSnapshot(gate,changed),/source binding/);}
 // The old list can still hash correctly while capture loads a different asset.
 const bypass=structuredClone(gate);bypass.captureSnapshot.servedFiles[1].sha256=c;
 assert.deepEqual(bypass.sources,gate.sources);
 assert.throws(()=>requireSkinCaptureSnapshot(gate,bypass),/served program or asset differs/);
});
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
