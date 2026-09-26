import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkFamilyGeometry,sealFamilyRecord,admitFamilyRecord} from './family-record.mjs';
import {checkGeometry,hashJSON} from './quadruped-template.mjs';

const root=new URL('../../../../',import.meta.url);
// The unchanged historical fixture used by quadruped-template.test.mjs.
const recordBytes=fs.readFileSync(new URL('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json',root));
const record=JSON.parse(recordBytes),master=fs.readFileSync(new URL(record.source,root));
const refusal=/terminal pads require family anatomy admission/;
const validLooking={schema:'cf.terminal-pad-support/v1',kind:'adhesive',points:Object.fromEntries(['hindFar','foreFar','hindNear','foreNear'].map(id=>[id+'Ankle',record.landmarks[id+'Paw']]))};

test('legacy quadruped without a pad declaration retains its original bounds, seal and source admission',async()=>{
 assert.equal(Object.hasOwn(record,'anatomy'),false);
 assert.equal(Object.hasOwn(record.geometry,'contactPads'),false);
 assert.deepEqual(checkFamilyGeometry(record),record.boundsCheck);
 assert.deepEqual(checkFamilyGeometry(record),checkGeometry(record));
 assert.deepEqual(await sealFamilyRecord(record),record);
 assert.equal((await admitFamilyRecord(record,master)).id,'quadruped');
 assert.deepEqual(record,JSON.parse(recordBytes),'no mutation of accepted historical source');
});

for(const [name,value]of [['present undefined',undefined],['null',null],['malformed',{schema:'wrong'}],['complete valid-looking',validLooking]]){
 test('legacy quadruped refuses '+name+' pads in geometry, sealing and runtime admission',async()=>{
  const changed=structuredClone(record);changed.geometry.contactPads=structuredClone(value);
  const before=structuredClone(changed);
  assert.throws(()=>checkFamilyGeometry(changed),refusal);
  await assert.rejects(sealFamilyRecord(changed),refusal);
  assert.deepEqual(changed,before,'rejected geometry and sealing must not mutate input');
  // A fresh valid recipe hash prevents a generic corruption rejection from
  // hiding the legacy dispatch gap this control is intended to guard.
  const {recipeHash:ignored,...body}=changed;void ignored;
  changed.recipeHash=await hashJSON(body);
  await assert.rejects(admitFamilyRecord(changed,master),refusal);
 }
 );
}
