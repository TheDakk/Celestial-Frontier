import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {cutAuthoredParts,assertRestCoverage} from './part-masks.mjs';
import {hashJSON} from './quadruped-template.mjs';
const root=new URL('../../../../',import.meta.url);
const record=JSON.parse(fs.readFileSync(new URL('audits/CIVET_2D_PROOF_20260912/civet.landmarks.json',root)));
const bytes=fs.readFileSync(new URL('audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png',root));
const raw=new Uint8ClampedArray(record.geometry.width*record.geometry.height*4);for(let i=0;i<raw.length;i+=4)raw.set([90,60,20,255],i);
const base={schema:'cf.authored-part-masks/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,remainderPart:'torso',parts:[{id:'left',joint:'tail1',layer:'far',polygon:[[0,0],[.25,0],[.25,1],[0,1]]},{id:'torso',joint:'spine',layer:'near',polygon:[[.25,0],[1,0],[1,1],[.25,1]]}]};
const seal=async b=>({...b,declarationHash:await hashJSON(b)});
test('authored mask ownership reconstructs visible pixels; drops, duplicates and changed colours fail',async()=>{
 const input=raw.slice(),out=await cutAuthoredParts(record,bytes,raw,await seal(base));assert.deepEqual(raw,input);assert.equal(out.receipt.restDifferentChannels,0);
 assert.throws(()=>assertRestCoverage(raw,1254,1254,out.parts.slice(1)),/missing/);
 assert.throws(()=>assertRestCoverage(raw,1254,1254,[...out.parts,out.parts[0]]),/overlapping/);
 const changed=structuredClone(out.parts);changed[0].rgba[0]++;assert.throws(()=>assertRestCoverage(raw,1254,1254,changed),/colour/);
});
test('corruption, wrong master, wrong record and unknown joint refuse before output',async()=>{
 const d=await seal(base);d.parts[0].polygon[0][0]=.1;await assert.rejects(cutAuthoredParts(record,bytes,raw,d),/corrupted/);
 await assert.rejects(cutAuthoredParts(record,new Uint8Array([0]),raw,await seal(base)),/mismatched cut-out/);
 await assert.rejects(cutAuthoredParts(record,bytes,raw,await seal({...base,recordRecipeHash:'0'.repeat(64)})),/record binding/);
 const bad=structuredClone(base);bad.parts[0].joint='serpent';await assert.rejects(cutAuthoredParts(record,bytes,raw,await seal(bad)),/unknown joint/);
});
