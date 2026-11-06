import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createArapScratch,solveArapSkin} from './arap-skin.mjs';
import * as before from '../../../../audits/ARCHETYPE_REPAIRS_20260922/03-biped-bird/solver-before/arap-skin.mjs';
const native=globalThis.WebAssembly,fixture=JSON.parse(fs.readFileSync(new URL('./test-fixtures/fish-cast-orientation.json',import.meta.url)));
const bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
function create(owner,runtime=native){try{globalThis.WebAssembly=runtime;return owner.createArapScratch(fixture.vertices,fixture.triangles,fixture.width,fixture.height,fixture.solver);}finally{globalThis.WebAssembly=native;}}
function compare(old,fresh){
 const target=Float32Array.from(fixture.target),saved=target.slice(),a=new Float32Array(target.length).fill(-77),b=a.slice();
 const oldStats={...before.solveArapSkin(old,target,a)},newStats={...solveArapSkin(fresh,target,b)};
 assert.deepEqual(newStats,oldStats,'Full solver diagnostics');
 assert.ok(old.orientationQueue.visits>0,'Retained fixture must actually invoke active projection');
 for(const key of ['position','target','rotation','rhs'])assert.ok(bytes(fresh[key]).equals(bytes(old[key])),key+' Float64 bytes');
 for(const key of ['starts','incident','heap','location','priority'])assert.ok(bytes(fresh.orientationQueue[key]).equals(bytes(old.orientationQueue[key])),key+' complete queue bytes');
 for(const key of ['size','projections','visits','stalled'])assert.ok(Object.is(fresh.orientationQueue[key],old.orientationQueue[key]),key+' scalar');
 assert.ok(bytes(a).equals(bytes(b)),'Published Float32 output bytes');
 assert.ok(bytes(target).equals(bytes(saved)),'Target input bytes');
 for(let i=0;i<fresh.n;i++)if(fresh.pins[i]){assert.equal(b[i*2],target[i*2]);assert.equal(b[i*2+1],target[i*2+1]);}
 return newStats;
}
test('actual fish cast uses the admitted active leaf with exact full solver and queue bytes',()=>{
 const old=create(before),fresh=create({createArapScratch}),kernel=fresh.orientationActiveKernel;assert.ok(kernel);let calls=0;
 fresh.orientationActiveKernel={...kernel,run(...args){calls++;return kernel.run(...args);}};
 const stats=compare(old,fresh);assert.equal(calls,1);assert.ok(fresh.orientationActiveKernel);assert.equal(stats.flippedTriangles,0);
});
test('unavailable runtime preserves the actual active fish cast through the original JS path',()=>{
 const old=create(before),fresh=create({createArapScratch},null);assert.equal(fresh.orientationActiveKernel,null);assert.equal(fresh.orientationKernel,null);assert.equal(fresh.sweepBackend,'js');compare(old,fresh);
});
test('post-private-active-work runtime trap preserves every live byte before fallback and disables the leaf',()=>{
 let calls=0,traps=0;
 const runtime={Module:native.Module,Memory:native.Memory,Instance:class{constructor(module,imports){const instance=new native.Instance(module,imports);this.exports={...instance.exports};if(instance.exports.active)this.exports.active=(...args)=>{calls++;const result=instance.exports.active(...args);if(calls>2){traps++;throw new native.RuntimeError('deliberate post-active-work trap');}return result;};}}};
 const old=create(before),fresh=create({createArapScratch},runtime);assert.ok(fresh.orientationActiveKernel,'Two admission probes must succeed');assert.equal(calls,2);
 compare(old,fresh);assert.equal(traps,1);assert.equal(calls,3);assert.equal(fresh.orientationActiveKernel,null);
 compare(old,fresh);assert.equal(traps,1);assert.equal(calls,3,'Disabled leaf must never be retried');
});
