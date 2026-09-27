import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createExactFieldCache} from './exact-field-cache-prototype.mjs';
import {createArapScratch,solveArapSkin} from '../../port/v2/tools/creature-animation/arap-skin.mjs';
const bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
const fixture=JSON.parse(fs.readFileSync(new URL('../../port/v2/tools/creature-animation/test-fixtures/fish-cast-orientation.json',import.meta.url)));
test('exact repeated active-set field skips work and publishes every original Float32 byte',()=>{
 const make=()=>createArapScratch(fixture.vertices,fixture.triangles,fixture.width,fixture.height,fixture.solver),a=make(),b=make(),target=Float32Array.from(fixture.target),saved=target.slice(),out=target.slice(),expected=target.slice();let calls=0;
 const run=createExactFieldCache(target.length,(t,o)=>{calls++;solveArapSkin(a,t,o);});
 const cases=[target,target.slice(),Float32Array.from(fixture.vertices.flatMap(v=>[v.x/fixture.width,v.y/fixture.height])),target,target];
 for(const t of cases){solveArapSkin(b,t,expected);run(t,out);assert.ok(bytes(out).equals(bytes(expected)));assert.deepEqual(a.stats,b.stats);out.fill(77);}
 assert.equal(calls,3,'two true avoided full solves');assert.ok(bytes(target).equals(bytes(saved)));
 assert.ok(b.orientationQueue.visits>0,'hard fixture actually exercised active orientation');
});
test('one ULP and signed-zero changes invalidate, no tolerance or target quantization',()=>{
 let calls=0;const solve=createExactFieldCache(2,(t,o)=>{calls++;o.set(t);}),t=new Float32Array([0,1]),out=t.slice();solve(t,out);solve(t.slice(),out);assert.equal(calls,1);
 t[0]=-0;solve(t,out);assert.equal(calls,2);assert.ok(Object.is(out[0],-0));
 const bits=new Uint32Array(t.buffer);bits[1]++;solve(t,out);assert.equal(calls,3);assert.ok(bytes(t).equals(bytes(out)));
});
test('refused solve invalidates the entry and never publishes cached geometry',()=>{
 const vertices=[{x:0,y:0},{x:40,y:0},{x:0,y:40}],s=createArapScratch(vertices,[0,1,2],40,40,{pins:[0,1,2]}),rest=new Float32Array([0,0,1,0,0,1]),bad=rest.slice(),out=rest.slice();let calls=0;bad[5]=-1;
 const run=createExactFieldCache(6,(t,o)=>{calls++;solveArapSkin(s,t,o);});run(rest,out);
 out.fill(17);for(let i=0;i<2;i++){assert.throws(()=>run(bad,out),/folded/);assert.ok(out.every(x=>x===17));}
 run(rest,out);assert.equal(calls,4);assert.ok(bytes(out).equals(bytes(rest)));run(rest,out);assert.equal(calls,4);
 bad[2]=NaN;assert.throws(()=>run(bad,out),/nonfinite/);assert.ok(bytes(out).equals(bytes(rest)));
});
test('owner-private bounded entry and input/output ownership cannot cross rigs',()=>{
 let calls=0;const a=createExactFieldCache(2,(t,o)=>{calls++;o.set(t);}),b=createExactFieldCache(2,(t,o)=>{calls++;o.set(t);}),t=new Float32Array([1,2]),o=t.slice();a(t,o);b(t,o);assert.equal(calls,2);
 assert.throws(()=>a(t,t),/separate/);assert.throws(()=>a(new Float64Array(2),o),/Float32/);assert.throws(()=>a(new Float32Array(3),o),/Float32/);
 // Mutation control: bypassing memoization performs both repeated expensive calls.
 let uncached=0;const raw=(t,o)=>{uncached++;o.set(t);};raw(t,o);raw(t,o);assert.equal(uncached,2);a(t,o);assert.equal(calls,2);
});
