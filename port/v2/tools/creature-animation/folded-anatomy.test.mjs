import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {familyContract,familyContractForRecord,familyContactChains} from './family-contracts.mjs';
import {resolveAnatomyInventory} from './anatomy-inventory.mjs';
import {requireVisiblePaintOwner} from './hidden-anatomy.mjs';
import {checkFamilyGeometry} from './family-record.mjs';
const plain={schema:'cf.anatomy-presence/v2',absent:[],hidden:[]};
test('v2 folded is optional, declared, painted and does not change the rig or contact inventory',()=>{
 const t=familyContract('brachyuran');
 for(const anatomy of [plain,{...plain,folded:[]},{...plain,folded:['leg0Far']},{schema:plain.schema,absent:[],folded:['leg0Near']}]){
  assert.equal(resolveAnatomyInventory(t,anatomy),t);
  assert.equal(familyContactChains(resolveAnatomyInventory(t,anatomy)).length,8);
  assert.doesNotThrow(()=>requireVisiblePaintOwner(t,'leg0FarFoot'));
 }
 const q=familyContract('quadruped');
 assert.equal(resolveAnatomyInventory(q,{...plain,folded:[q.legs[0]]}),q);
});
test('folded malformed, unknown, duplicate and overlapping declarations refuse',()=>{
 for(const folded of [null,'leg0Far',[0],['root'],['leg0Far','leg0Far']])assert.throws(()=>resolveAnatomyInventory(familyContract('brachyuran'),{...plain,folded}),/invalid folded/);
 for(const extra of [{hidden:['leg3Far']},{absent:['leg3Far']}])assert.throws(()=>resolveAnatomyInventory(familyContract('brachyuran'),{...plain,...extra,folded:['leg3Far']}),/neither hidden nor absent/);
 assert.throws(()=>resolveAnatomyInventory(familyContract('brachyuran'),{schema:'cf.anatomy-presence/v1',absent:[],folded:[]}),/invalid presence/);
});
test('three applied presence inputs preserve accepted geometry, hidden sets and contact chains',()=>{
 const base=new URL('../../../../audits/VISION_P1_FOUR_CRABS_20260920/',import.meta.url);
 for(const [fit,id]of [['intake-02/crab-fit-01','leg0Far'],['intake-02/mud-crab-fit-01','leg0Far'],['intake-01/vent-crab-fit-01','leg0Near']]){
  const read=name=>JSON.parse(fs.readFileSync(new URL(fit+'/'+name,base)));
  const r=read('record.json'),presence=read('presence.json'),draft={...r,anatomy:presence};
  assert.deepEqual(presence,{...(r.anatomy??plain),folded:[id]});
  assert.deepEqual(familyContractForRecord(draft),familyContractForRecord(r));
  assert.deepEqual(checkFamilyGeometry(draft),r.boundsCheck);
  assert.deepEqual(familyContactChains(familyContractForRecord(draft)),familyContactChains(familyContractForRecord(r)));
  const missing=structuredClone(draft);delete missing.landmarks[id+'Foot'];
  assert.throws(()=>checkFamilyGeometry(missing),/exact landmark inventory/);
 }
});
