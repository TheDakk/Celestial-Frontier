import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compatibleReferenceInventory as select} from './reference-inventory.mjs';
const candidate=(id,joints,cost)=>({cost,ref:{subjectId:id,authoring:{landmarksPx:Object.fromEntries(joints.map(j=>[j,[1,2]]))}}});
test('tailed target cannot inherit missing tail from cheaper tailless reference; contour judge stays unchanged',()=>{
 const ape=candidate('ape',['root','body'],1),monkey=candidate('monkey',['root','body','tail0'],2),ranked=[ape,monkey],before=JSON.stringify(ranked);
 const r=select(ranked,['root','body','tail0']);assert.deepEqual(r.eligible,[monkey]);assert.equal(r.judge,ape);assert.deepEqual(r.rejected,[{reference:'ape',missing:['tail0'],extra:[]}]);assert.equal(JSON.stringify(ranked),before);
});
test('explicit admitted absence permits earless reference but never removes a required ear implicitly',()=>{
 const r=candidate('reptile',['root','body'],1),full=candidate('mammal',['root','body','earNearTip'],2);
 assert.deepEqual(select([r,full],['root','body','earNearTip']).eligible,[full]);
 assert.deepEqual(select([r,full],['root','body'],['earNearTip']).eligible,[r,full]);
});
test('no compatible reference stays empty; no joint is synthesized',()=>{
 const r=candidate('ant',['root','body'],1);assert.deepEqual(select([r],['root','body','wingNear']).eligible,[]);assert.equal(Object.hasOwn(r.ref.authoring.landmarksPx,'wingNear'),false);
});
test('undeclared extra joints refuse rather than silently discard',()=>{
 assert.equal(select([candidate('extra',['root','body','invented'],1)],['root','body']).eligible.length,0);
});
test('unchanged compatible order and legacy callers are preserved',()=>{
 const r=[candidate('one',['root','body'],1),candidate('two',['root','body'],2)];assert.deepEqual(select(r,['root','body']).eligible,r);assert.equal(select(r,null).eligible,r);
});
test('contradictory and malformed inventories refuse',()=>{
 assert.throws(()=>select([],['root','root']),/unique/);assert.throws(()=>select([],['root'],['root']),/excluded/);assert.throws(()=>select([],[]),/unique/);
});
test('retained Gorilla counterexample demonstrates tail inventory mismatch without borrowing absence',()=>{
 const a=JSON.parse(fs.readFileSync(new URL('../../../../audits/BACKLOG447_20261009/gorilla-landmark-fixture.json',import.meta.url)));
 const r={ref:{subjectId:'transferred-gorilla',authoring:a},cost:1},present=Object.keys(a.landmarksPx);
 assert.deepEqual(select([r],[...present,'tail0','tail1','tail2']).rejected[0].missing,['tail0','tail1','tail2']);assert.deepEqual(select([r],present,['tail0','tail1','tail2']).eligible,[r]);
});
