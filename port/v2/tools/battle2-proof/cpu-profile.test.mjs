import test from 'node:test';import assert from 'node:assert/strict';import {summarizeCpuProfile} from './cpu-profile.mjs';
const frame=(functionName,url='')=>({functionName,url,lineNumber:0,columnNumber:0});
const profile={nodes:[{id:1,callFrame:frame('(root)'),children:[2,4,6]},{id:2,callFrame:frame('active-wrapper','active.mjs'),children:[3]},{id:3,callFrame:frame('wasm-function[0]','wasm://active')},{id:4,callFrame:frame('forward-wrapper','forward.mjs'),children:[5]},{id:5,callFrame:frame('wasm-function[0]','wasm://forward')},{id:6,callFrame:frame('(idle)')}],samples:[3,5,3,6],timeDeltas:[7,11,13,17]};
const resolve=cf=>cf.url||cf.functionName,run=p=>summarizeCpuProfile(p,resolve,{frames:2,cpuThrottle:4});
test('accounts first and last sample deltas and separates same-named Wasm leaves by module/caller',()=>{
 const r=run(profile);assert.equal(r.totalUs,48);assert.equal(r.samples,4);assert.equal(r.nodes.find(n=>n.id===3).selfUs,20);assert.equal(r.nodes.find(n=>n.id===5).selfUs,11);assert.equal(r.nodes.find(n=>n.id===6).selfUs,17);
 assert.deepEqual(r.wasmCallers.map(r=>[r.file,r.us]),[['active.mjs',20],['forward.mjs',11]]);assert.equal(r.files.filter(r=>r.file.startsWith('wasm:')).length,2);
 assert.notEqual(r.totalUs,profile.timeDeltas.slice(1).reduce((a,b)=>a+b,0),'shifted-delta mutant omits first sample');assert.notEqual(r.wasmCallers[0].us,31,'collapsed-function-name mutant attributes both kernels to active');
 assert.equal(r.files.reduce((s,r)=>s+r.us,0),48);
});
test('refuses missing/foreign samples, deltas and malformed capture metadata',()=>{
 for(const bad of [{...profile,timeDeltas:[1]}, {...profile,samples:[3,5,9,6]}, {...profile,timeDeltas:[7,-1,13,17]}])assert.throws(()=>run(bad));
 assert.throws(()=>summarizeCpuProfile(profile,resolve,{frames:0,cpuThrottle:4}));
 const unknown=run({...profile,nodes:profile.nodes.map(n=>n.id===2?{...n,callFrame:frame('unmapped-caller')}:n)});assert.equal(unknown.wasmCallers.find(x=>x.file==='unmapped').us,20);
});

test('native js-to-wasm trampolines are skipped when locating the actual caller',()=>{
 const bridged={...profile,nodes:profile.nodes.map(n=>n.id===2?{...n,children:[7]}:n).concat({id:7,callFrame:frame('js-to-wasm:iiiiiiiiiiiii:i'),children:[3]})};
 assert.deepEqual(run(bridged).wasmCallers,run(profile).wasmCallers);
});
