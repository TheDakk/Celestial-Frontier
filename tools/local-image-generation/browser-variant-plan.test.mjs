import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeField,concatFields} from '../local-image-repack/protobuf.mjs';
import {graphSplices,buildBrowserVariantPlan} from './browser-variant-plan.mjs';
const str=(field,text)=>encodeField(field,2,Buffer.from(text));
const model=(value,prefix='stable')=>concatFields([str(1,prefix),encodeField(7,2,concatFields([str(1,'unchanged'),str(5,value),str(11,'also stable')])),str(14,'outside')]);
const apply=(bytes,patches)=>{const out=[];let at=0;for(const p of patches){out.push(bytes.subarray(at,p.offset),Buffer.from(p.hex,'hex'));at=p.offset+p.remove;}out.push(bytes.subarray(at));return Buffer.concat(out);};
test('binary graph splices exactly reconstruct changed payload and outer length, preserving other bytes',()=>{
  const source=model('old'),target=model('a longer replacement');const plan=graphSplices(source,target);
  assert.equal(plan.length,2);assert.deepEqual(apply(source,plan),target);assert.deepEqual(source,model('old'));
  assert.deepEqual(graphSplices(source,source),[]);
});
test('graph splices refuse changed outer data and field order/count',()=>{
  assert.throws(()=>graphSplices(model('old'),model('new','hostile')),/non-graph/);
  assert.throws(()=>graphSplices(model('old'),concatFields([str(2,'stable'),encodeField(7,2,str(1,'new')),str(14,'outside')])),/order/);
  assert.throws(()=>graphSplices(model('old'),Buffer.concat([model('new'),str(19,'extra')])),/count/);
});
test('production plan builder refuses synthetic, corrupt and non-Buffer model carriers',()=>{
  assert.throws(()=>buildBrowserVariantPlan(model('old'),model('new')),/Parent graph SHA/);
  assert.throws(()=>buildBrowserVariantPlan(new Uint8Array(4),Buffer.alloc(4)),/Buffers/);
});
