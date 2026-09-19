import {it,expect} from 'vitest';
import fs from 'node:fs';
import {compileBodyCard} from './body-card.js';
import {buildTimeline,sampleTimeline} from './timeline.js';
import {actionsFor} from './family-actions.js';
import {secondaryParams} from './secondary.js';
import {familyContractForRecord} from '../../../../tools/creature-animation/family-contracts.mjs';
import {resolveAnatomyInventory} from '../../../../tools/creature-animation/anatomy-inventory.mjs';
import {resolveTemplate} from './templates.js';
const read=(name:string)=>JSON.parse(fs.readFileSync(new URL('../../../../../../audits/ANATOMY_COMPLETION_20260917/'+name+(name==='persimmon'?'-02':name==='cranberry'?'-04':'-03')+'/record.json',import.meta.url),'utf8'));
it.each(['persimmon','cranberry','devils-club'])('preserves %s observed branches, materials and anchored actions',(id)=>{
 const r=read(id),c=compileBodyCard(r,{skin:0,head:0,loco:4}),contract=familyContractForRecord(r);
 expect(c.parts.map(p=>[p.joint,p.parent])).toEqual(contract.graph);expect(c.weapons).toEqual([]);expect(c.materials.body).toBe('bark');
 const active=new Set<string>();
 for(const part of c.secondaryParts){const ps=secondaryParams(part,c.realm,false);expect(ps.map(p=>p.lagMs)).toEqual([50,100,150]);expect(part.jointMaterials![part.joints[2]!]).toBe('foliage');}
 for(const action of Object.keys(actionsFor(c.template.id,c.anatomy)!)){
  const tl=buildTimeline(c,action,133);expect(buildTimeline(c,action,133)).toEqual(tl);
  for(let i=0;i<=120;i++){const p=sampleTimeline(tl,tl.durationMs*i/120);expect(p.root).toEqual({dx:0,dy:0,rotation:0});for(const[j,v]of Object.entries(p.joints)){expect(Number.isFinite(v)).toBe(true);if(v!==0)active.add(j);}}
 }
 for(let i=0;i<r.anatomy.growth.branches;i++)expect(active.has('leaf'+i)).toBe(true);
 const broken=structuredClone(r);delete broken.landmarks['leaf'+(r.anatomy.growth.branches-1)];expect(()=>compileBodyCard(broken)).toThrow('missing-landmarks');
});
it('unknown declared surface cannot be laundered through animal genome fallback',()=>{const r=read('persimmon');r.materials.surface='unclassified';expect(()=>compileBodyCard(r,{skin:0})).toThrow('unsupported-materials');r.materials.surface='bark';r.materials.joints.leaf0='unclassified';expect(()=>compileBodyCard(r)).toThrow('unknown joint/material');r.materials.joints={imaginaryLeaf:'foliage'};expect(()=>compileBodyCard(r)).toThrow('unknown joint/material');});
it('branch counts are bounded and cannot be supplied to a nonplant',()=>{for(const count of[0,21,1.5,NaN])expect(()=>resolveAnatomyInventory(resolveTemplate('plant-woody'),{schema:'cf.anatomy-presence/v1',absent:[],growth:{branches:count}})).toThrow('Plant anatomy');expect(()=>resolveAnatomyInventory(resolveTemplate('fish'),{schema:'cf.anatomy-presence/v1',absent:[],growth:{branches:3}})).toThrow('Plant anatomy');});
