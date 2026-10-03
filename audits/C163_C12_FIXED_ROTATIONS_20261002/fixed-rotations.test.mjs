import test from 'node:test';import assert from 'node:assert/strict';
import {createArapScratch as createBaseline} from './baseline/arap-skin.mjs';
import {createWasmArapPass} from './candidate/wasm-arap-sweep.mjs';
const native=globalThis.WebAssembly,bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
function input(pins=Array.from({length:18},(_,i)=>i)){
 const vertices=[],triangles=[];for(let y=0;y<5;y++)for(let x=0;x<5;x++)vertices.push({x:x*10,y:y*10});for(let y=0;y<4;y++)for(let x=0;x<4;x++){const i=y*5+x;triangles.push(i,i+1,i+5,i+1,i+6,i+5);}const s=createBaseline(vertices,triangles,40,40,{pins});
 return{rest:s.rest.slice(),rows:s.solveRows.slice(),neighbours:s.neighbourDofs.slice(),reciprocals:s.solveReciprocals.slice(),starts:s.starts.slice(),deltas:s.deltas.slice(),lambda:s.lambda.slice()};
}
function state(k){return ['position','target','rotation','rhs'].map(n=>bytes(k[n]).toString('hex'));}
function setPose(k,c,phase){for(let i=0;i<c.rest.length;i++){const v=c.rest[i]+2*Math.sin(phase+i*.7);k.target[i]=v;k.position[i]=v;}k.rotation.fill(123);k.rhs.fill(-17);}
function observed(){
 const calls=[];let intercept=null;
 class Instance{constructor(m,i){const real=new native.Instance(m,i);this.exports={pass:(...args)=>{calls.push(args);return intercept?intercept(real.exports.pass,args,i.env.__linear_memory):real.exports.pass(...args);}};}}
 return{calls,set intercept(v){intercept=v;},runtime:{Module:native.Module,Memory:native.Memory,Instance}};
}
test('whole synchronous pose uses full first pass and compiled dynamic subset only later; default runPass stays full',()=>{
 for(const pins of [[],Array.from({length:18},(_,i)=>i),Array.from({length:25},(_,i)=>i)]){
  const c=input(pins),o=observed(),a=createWasmArapPass(c),b=createWasmArapPass(c,o.runtime);assert(a&&b);o.calls.length=0;setPose(a,c,.3);setPose(b,c,.3);
  for(let i=0;i<4;i++)assert(a.runPass(4));assert.equal(b.runPosePasses(4,4),4);assert.deepEqual(state(b),state(a));assert.equal(o.calls.length,4);assert.equal(o.calls[0][13],0);assert(o.calls.slice(1).every(x=>x[13]>0));
  o.calls.length=0;assert(b.runPass(4));assert.equal(o.calls.length,1);assert.equal(o.calls[0][13],0);
  assert.equal(b.cachedRotationRows,pins.length===0?0:pins.length===25?25:13);
 }
});
test('fresh calls recompute from changed public pose/rotation buffers and never reuse previous solve rotations',()=>{
 const c=input(),o=observed(),a=createWasmArapPass(c),b=createWasmArapPass(c,o.runtime);assert(a&&b);
 for(const phase of [.3,-.2,.9,.3]){setPose(a,c,phase);setPose(b,c,phase);o.calls.length=0;for(let i=0;i<4;i++)a.runPass(4);assert.equal(b.runPosePasses(4,4),4);assert.deepEqual(state(b),state(a));assert.equal(o.calls[0][13],0);}
 assert.equal(a.normalPasses,b.normalPasses);assert.equal(a.robustFallbacks,b.robustFallbacks);
});
test('rotation membership and topology are snapshots; mutating caller sources cannot change later reuse',()=>{
 const c=input(),saved=structuredClone(c),a=createWasmArapPass(c),b=createWasmArapPass(saved);assert(a&&b);setPose(a,saved,.27);setPose(b,saved,.27);for(const v of Object.values(c))v.fill(0);
 assert.equal(a.runPosePasses(4,4),4);assert.equal(b.runPosePasses(4,4),4);assert.deepEqual(state(a),state(b));assert.equal(a.cachedRotationRows,b.cachedRotationRows);
});
test('invalid counts fail before any pose writes, and no cache-capable remaining-pass API is exposed',()=>{
 const c=input(),k=createWasmArapPass(c);setPose(k,c,.2);const saved=state(k);for(const count of[0,17,-1,1.5,NaN,Infinity,'4'])assert.throws(()=>k.runPosePasses(4,count),/pass budget/);for(const count of[0,33,NaN])assert.throws(()=>k.runPosePasses(count,4),/sweep budget/);assert.deepEqual(state(k),saved);assert.equal(k.normalPasses,0);assert.equal(k.robustFallbacks,0);assert.equal(k.runRemainingPass,undefined);
});
test('real late norm failure stops the synchronous block before position/RHS publication and next call starts full',()=>{
 const c=input(),o=observed(),k=createWasmArapPass(c,o.runtime);assert(k);setPose(k,c,.2);o.calls.length=0;let saved;
 o.intercept=(leaf,args,memory)=>{if(o.calls.length===2){const p=new Float64Array(memory.buffer,args[9],c.rest.length);p[p.length-2]=1e200;saved={p:p.slice(),rhs:new Float64Array(memory.buffer,args[12],c.rest.length).slice()};}return leaf(...args);};
 assert.equal(k.runPosePasses(4,4),1);assert.equal(o.calls.length,2);assert.deepEqual(k.position,saved.p);assert.deepEqual(k.rhs,saved.rhs);assert.equal(k.normalPasses,1);assert.equal(k.robustFallbacks,1);
 o.intercept=null;o.calls.length=0;setPose(k,c,-.3);assert.equal(k.runPosePasses(4,4),4);assert.equal(o.calls[0][13],0);
});
test('admission rejects a subset-only corrupting runtime even when its full first-pass result is exact',()=>{
 const c=input(),o=observed();let subsetCalls=0;o.intercept=(leaf,args,memory)=>{const result=leaf(...args);if(args[13]!==0){subsetCalls++;new Float64Array(memory.buffer,args[11],c.rest.length)[0]+=.25;}return result;};assert.equal(createWasmArapPass(c,o.runtime),null);assert(subsetCalls>0,'subset control must execute');
});
