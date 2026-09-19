import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {FAMILY_CONTRACTS,familyContract} from './family-contracts.mjs';
import {checkFamilyGeometry,sealFamilyRecord,admitFamilyRecord} from './family-record.mjs';
import {hashBytes,hashJSON} from './quadruped-template.mjs';
const {records}=JSON.parse(fs.readFileSync(new URL('./test-fixtures/family-records.json',import.meta.url)));
const bytes=new Uint8Array([1,2,3]);
for(const template of FAMILY_CONTRACTS)test(template.id+': exact family anatomy, immutable contract and hostile-record controls',async()=>{
 const input=structuredClone(records[template.id]);input.geometry.cutoutAssetHash=await hashBytes(bytes);input.clipSetId=template.clipSetId;
 const record=await sealFamilyRecord(input),alpha=new Uint8Array(record.geometry.width*record.geometry.height).fill(255);
 assert.equal((await admitFamilyRecord(record,bytes,alpha)).id,template.id);
 assert.deepEqual(await sealFamilyRecord(record),record,'resealing must not hash the previous recipe hash');
 assert.throws(()=>{template.graph[0][0]='other';},TypeError);
 const corrupt=structuredClone(record);corrupt.landmarks.root[0]+=.01;
 await assert.rejects(admitFamilyRecord(corrupt,bytes,alpha),/corrupted landmark/);
 await assert.rejects(admitFamilyRecord(record,new Uint8Array([2]),alpha),/mismatched cut-out/);
 await assert.rejects(admitFamilyRecord(record,bytes,new Uint8Array(alpha.length)),/outside painted alpha/);
 for(const mutate of [r=>delete r.landmarks[template.joints.at(-1)],r=>r.landmarks.foreign=[.4,.4],r=>r.landmarks[template.bodyAxis[1]]=r.landmarks[template.bodyAxis[0]],r=>r.clipOverrides={},r=>r.template.version=2]){
  const r=structuredClone(record);mutate(r);assert.throws(()=>checkFamilyGeometry(r),undefined,'invalid anatomy must not fit');
 }
 const stale=structuredClone(record);stale.boundsCheck.boneLengths[template.joints[1]]+=.001;
 const {recipeHash,...body}=stale;stale.recipeHash=await hashJSON(body);
 await assert.rejects(admitFamilyRecord(stale,bytes,alpha),/stale bounds/);
});
test('unknown template never defaults to quadruped and all contracted inventories are closed',()=>{
 assert.equal(FAMILY_CONTRACTS.length,14);assert.throws(()=>familyContract('fungus'),/unknown template/);
 for(const t of FAMILY_CONTRACTS)assert.deepEqual(t.joints,['root',...t.graph.map(([n])=>n)]);
});
test('old hopper and fish fixture clip-set names are rejected instead of silently using different motion',()=>{
 for(const id of ['hopper','fish']){assert.notEqual(records[id].clipSetId,familyContract(id).clipSetId);assert.throws(()=>checkFamilyGeometry(records[id]),/shared clip set/);}
});
