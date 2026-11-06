import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {requireCutInventory} from './cut-seam.mjs';
const root=new URL('../../../../audits/C2_DEFORMING_SEAMS_20260914/',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
for(const[id,n]of [['civet',29],['fox',32],['procedural',26]])test(id+' complete contact inventory passes; formerly green missing pairs refuse',()=>{
 const cuts=read('candidate-02/'+id+'-ink/declaration.json').cuts,groups=read('candidate-06/'+id+'.binding.json').seamBridges.groups;
 assert.deepEqual(requireCutInventory(groups,cuts),{declaredCuts:n,compiledCuts:n,missing:0,unexpected:0});
 assert.throws(()=>requireCutInventory(read('candidate-05/'+id+'.binding.json').seamBridges.groups,cuts),/Cut inventory mismatch/);
 const extra=structuredClone(groups);extra[0].edges.push({...extra[0].edges[0],ancestorPart:'independent-limb'});assert.throws(()=>requireCutInventory(extra,cuts),/unexpected/);
 assert.throws(()=>requireCutInventory(groups,[...cuts,cuts[0]]),/Duplicate/);
});
