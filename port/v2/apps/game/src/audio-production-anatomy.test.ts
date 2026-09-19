import fs from 'node:fs';import path from 'node:path';import {describe,it,expect} from 'vitest';
import {hashJSON} from '../../../tools/creature-animation/quadruped-template.mjs';
import {soundBodyFromResolvedRecord} from './audio-production-anatomy.js';
import {compileProductionContact,compileProductionVoice} from './audio-production-plan.js';
const root=path.resolve(import.meta.dirname,'../../../../..');
const inputs=['audits/CIVET_2D_PROOF_20260912/civet.landmarks.json',
 'audits/C2_BOUNDED_REPAIR_20260913/candidate-01/fox.landmarks.json',
 'audits/C2_PARTS_ATLAS_20260913/native-painter-parts-03/record.json'];
describe('actual painter record sound projection',()=>{
 it('reads accepted record material, refuses the historical fur default and reports required context',async()=>{
  const rows=[];
  for(const file of inputs){
   const record=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
   const before=JSON.stringify(record);
   const body=await soundBodyFromResolvedRecord(record,{kingdom:'fauna',size:'medium',medium:'air'});
   rows.push(body);expect(JSON.stringify(record)).toBe(before);
   expect(compileProductionContact(body,'grass','step').layers[2]?.requirement).toBe('material.'+body.material);
   if(body.earthName)expect(compileProductionVoice(body,'call').authenticity).toBe('species_source_required');
   await expect(soundBodyFromResolvedRecord({...record,materials:{surface:'wrong'}}, {kingdom:'fauna',size:'medium',medium:'air'})).rejects.toThrow('hash');
  }
  expect(rows.map(r=>r.material)).toEqual(['furred','furred','translucent']);
  const record=JSON.parse(fs.readFileSync(path.join(root,inputs[2]!), 'utf8'));
  await expect(soundBodyFromResolvedRecord(record,{} as never)).rejects.toThrow();
  const {recipeHash,...bad}=record;bad.materials={surface:'unmapped'};
  await expect(soundBodyFromResolvedRecord({...bad,recipeHash:await hashJSON(bad)},{kingdom:'fauna',size:'medium',medium:'air'})).rejects.toThrow('material');
 });
});
