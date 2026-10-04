import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
import {familyContract,familyContractForRecord,familyContactChains} from './family-contracts.mjs';
import {resolveAnatomyInventory} from './anatomy-inventory.mjs';
import {inferHiddenLandmarks,requireVisiblePaintOwner} from './hidden-anatomy.mjs';
import {checkFamilyGeometry,sealFamilyRecord} from './family-record.mjs';
import {cutPainterParts,cutAuthoredParts} from './part-masks.mjs';import {hashJSON} from './quadruped-template.mjs';
const req=createRequire(import.meta.url),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const root=new URL('../../../../audits/ANATOMY_COMPLETION_20260917/crab-masks-05/',import.meta.url),read=n=>JSON.parse(fs.readFileSync(new URL(n,root))),source=read('coconut-crab-record.json');
const anatomy={schema:'cf.anatomy-presence/v2',absent:[],hidden:['leg3Far','leg3Near']};
const draft=()=>{const r=structuredClone(source);r.anatomy=anatomy;r.landmarks=inferHiddenLandmarks(familyContractForRecord(r),r.landmarks);return r;};
const seal=async body=>({...body,declarationHash:await hashJSON(body)});
test('declared hidden pair keeps complete skeleton, flags inferred joints and excludes exactly two contact chains',()=>{
 const plain=familyContract('brachyuran'),r=draft(),t=familyContractForRecord(r);
 assert.deepEqual(t.graph,plain.graph);assert.deepEqual(t.joints,plain.joints);assert.equal(t.hiddenJoints.length,6);
 assert.equal(checkFamilyGeometry(r).hiddenJoints.length,6);assert.equal(familyContactChains(t).length,6);
 assert.equal(familyContactChains(plain).length,8);for(const chain of familyContactChains(t))assert.ok(!anatomy.hidden.includes(chain.id));
 for(const side of ['Far','Near'])for(const [a,b] of [['Root','Knee'],['Knee','Foot']]){const length=id=>Math.hypot(...r.landmarks[id+b].map((v,i)=>v-r.landmarks[id+a][i]));assert.ok(Math.abs(length('leg2'+side)-length('leg3'+side))<1e-12);}
 const changed=draft();changed.landmarks.leg3FarFoot[0]+=.01;assert.throws(()=>checkFamilyGeometry(changed),/inference differs/);
});
test('missing pair is never inferred by admission, declared or undeclared; absent cannot replace hidden',()=>{
 for(const declared of [false,true]){const r=draft();if(!declared)delete r.anatomy;for(const j of ['Root','Knee','Foot'])delete r.landmarks['leg3Far'+j];assert.throws(()=>checkFamilyGeometry(r),/exact landmark inventory/);}
 for(const hidden of [['leg2Far'],['leg3Far','leg3Far'],['root']])assert.throws(()=>resolveAnatomyInventory(familyContract('brachyuran'),{...anatomy,hidden}),/Hidden anatomy/);
 assert.throws(()=>resolveAnatomyInventory(familyContract('brachyuran'),{...anatomy,absent:['leg3Far']}),/not absent/);
 assert.throws(()=>resolveAnatomyInventory(familyContract('brachyuran'),{schema:'cf.anatomy-presence/v1',absent:['leg3Far']}),/mandatory/);
});
test('actual eight-visible painter admits unchanged; same paint assigned to declared hidden joints refuses in both intake routes',async()=>{
 const bytes=fs.readFileSync(new URL('coconut-crab-master.png',root)),decoded=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),labelPng=await sharp(fs.readFileSync(new URL('coconut-crab-labels.png',root))).ensureAlpha().raw().toBuffer();
 const labels=Uint8Array.from({length:decoded.info.width*decoded.info.height},(_,i)=>labelPng[i*4]),original=read('coconut-crab-declaration.json');
 const plain=await cutPainterParts(source,bytes,decoded.data,labels,original);assert.equal(plain.receipt.restDifferentChannels,0);assert.equal(plain.parts.length,original.parts.length);
 const hidden=await sealFamilyRecord(draft()),{declarationHash,...body}=original,d=await seal({...body,recordRecipeHash:hidden.recipeHash});
 await assert.rejects(cutPainterParts(hidden,bytes,decoded.data,labels,d),/paint assigned to hidden joint/);
 const authored=await seal({schema:'cf.authored-part-masks/v1',recordRecipeHash:hidden.recipeHash,cutoutSha256:hidden.geometry.cutoutAssetHash,remainderPart:'bad',parts:[{id:'bad',joint:'leg3FarFoot',layer:'far',polygon:[[0,0],[1,0],[1,1],[0,1]]}]});
 await assert.rejects(cutAuthoredParts(hidden,bytes,decoded.data,authored),/paint assigned to hidden joint/);
 assert.doesNotThrow(()=>requireVisiblePaintOwner(familyContractForRecord(hidden),'leg2FarFoot'));
});
