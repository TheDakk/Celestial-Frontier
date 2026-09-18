import {it,expect} from 'vitest';
import fs from 'node:fs';
import {compileAmplitudeProfile} from './amplitude-profile.js';
import {compileBodyCard,type BodyPart} from './body-card.js';
import {buildTimeline,sampleTimeline} from './timeline.js';
import {buildActionTimeline} from './overlay.js';
import {actionsFor} from './family-actions.js';
const fixtures=JSON.parse(fs.readFileSync(new URL('../../../../tools/creature-animation/test-fixtures/family-records.json',import.meta.url),'utf8')).records;
it('normalizes geometry, reduces long/deep woody swing, preserves measured closure and rejects invalid input',()=>{
 const parts:BodyPart[]=[{joint:'trunk',parent:'root',group:'body',pivot:[0,0],tip:[0,1],boneLength:1},{joint:'branch',parent:'trunk',group:'body',pivot:[0,1],tip:[2,1],boneLength:2}];
 const material={trunk:'bark',branch:'foliage'},p=compileAmplitudeProfile(parts,1,material);
 expect(p.scales.branch).toBeLessThan(p.scales.trunk!);expect(p.scales.branch).toBeGreaterThan(0);
 expect(compileAmplitudeProfile(parts.map(p=>({...p,boneLength:p.boneLength*3})),3,material)).toEqual(p);
 expect(compileAmplitudeProfile(parts,1,material,{branch:1}).scales.branch).toBe(1);
 expect(()=>compileAmplitudeProfile(parts,0,material)).toThrow('body length');
 expect(()=>compileAmplitudeProfile([...parts].reverse(),1,material)).toThrow('source chain');
 const long=compileAmplitudeProfile([{...parts[1]!,parent:'root'}],1,material);
 expect(14*long.scales.branch!).toBeLessThan(14); // fixed-angle negative control
});
it('uses one constructor for every family/action, including sway, mirroring and source-pincer projection',()=>{
 for(const record of Object.values(fixtures) as any[]){
  const card=compileBodyCard({...record,identity:{...record.identity,earthName:null}});
  for(const action of Object.values(actionsFor(card.template.id)!)){
   const j=card.parts[0]!.joint,c={...card,projectionSigns:{[j]:-1},projectionScales:{[j]:.31}};
   expect(buildActionTimeline(c,action,133)).toEqual(buildTimeline(c,action.id,133));
   if(action.poses.some(p=>p.joints[j]))expect(buildActionTimeline(c,action,133).hash).not.toBe(buildTimeline({...c,projectionScales:{}},action.id,133).hash);
  }
 }
});
it.each(['plant-woody','plant-herb'])('keeps %s rooted with live above-root grow/recoil and foliage secondary-only',(id)=>{
 const r=fixtures[id],c=compileBodyCard({...r,identity:{...r.identity,earthName:null},materials:{surface:'bark'}});
 for(const [name,action]of Object.entries(actionsFor(id)!)){
  expect(action.poses.every(p=>p.root.dx===0&&p.root.dy===0)).toBe(true);
  expect(action.poses.every(p=>Object.keys(p.joints).every(j=>!j.startsWith('leaf')&&!j.startsWith('frond')))).toBe(true);
  const tl=buildTimeline(c,name,133),poses=Array.from({length:121},(_,i)=>sampleTimeline(tl,i*tl.durationMs/120));
  expect(poses.every(p=>p.root.dx===0&&p.root.dy===0&&p.root.rotation===0)).toBe(true);
  expect(Math.max(...poses.flatMap(p=>Object.values(p.joints).map(Math.abs)))).toBeGreaterThan(.001);
  expect(poses.some(p=>Object.entries(p.joints).some(([j,v])=>/^(leaf|frond)/.test(j)&&Math.abs(v)>.001))).toBe(true);
  const zero={...tl,tracks:Object.fromEntries(Object.entries(tl.tracks).map(([j,k])=>[j,k.map(v=>({...v,value:0}))])),secondary:[]};
  expect(Object.values(sampleTimeline(zero,tl.durationMs*.25).joints).every(v=>v===0)).toBe(true); // fails required motion outcome
 }
});

it('declares anatomical motion scale separately from body-axis units for crabs and plants',async()=>{
 const {measureMotionScale}=await import('../../../../tools/creature-animation/motion-scale.mjs');
 const root=new URL('../../../../../../',import.meta.url),r=JSON.parse(fs.readFileSync(new URL('audits/ANATOMY_COMPLETION_20260917/crab-fits-02/crab/record.json',root),'utf8')),c=compileBodyCard(r);
 expect(c.bodyLength).toBeCloseTo(.041573320050624196,12);expect(c.scaleLength).toBeCloseTo(.09374540429634415,12);
 expect(c.scaleLength).toBeGreaterThan(c.bodyLength*2);expect(c.scaleReference).toEqual({kind:'span',axis:['leg0FarRoot','leg0NearRoot']});
 for(const id of['plant-woody','plant-herb']){const p=compileBodyCard({...fixtures[id],identity:{...fixtures[id].identity,earthName:null},materials:{surface:'bark'}});expect(p.scaleLength).toBeGreaterThan(p.bodyLength);expect(p.scaleReference.kind).toBe('longest-chain');}
 const def={id:'brachyuran',graph:[],bodyAxis:['root','carapace']as const};expect(measureMotionScale(def,Object.fromEntries(Object.entries(r.landmarks as Record<string,number[]>).map(([j,p])=>[j,[1-p[0]!,p[1]!]]))).length).toBeCloseTo(c.scaleLength,12);
 expect(()=>measureMotionScale(def,{})).toThrow('missing observed');
});

it('independent motion-scale admission refuses undersized/oversized references without changing body pivots',async()=>{
 const {measureMotionScale}=await import('../../../../tools/creature-animation/motion-scale.mjs');
 const {checkFamilyGeometry}=await import('../../../../tools/creature-animation/family-record.mjs');
 const root=new URL('../../../../../../',import.meta.url),r=JSON.parse(fs.readFileSync(new URL('audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/record.json',root),'utf8'));
 expect(()=>checkFamilyGeometry(r)).not.toThrow();const axis=structuredClone([r.landmarks.root,r.landmarks.carapace]);
 for(const span of [.041573,.079,.901]){const bad={...r,landmarks:{...r.landmarks,leg0FarRoot:[.5-span/2,.5],leg0NearRoot:[.5+span/2,.5]}};expect(()=>measureMotionScale({id:'brachyuran',graph:[]},bad.landmarks)).toThrow('outside');expect(()=>checkFamilyGeometry(bad)).toThrow('outside');expect([bad.landmarks.root,bad.landmarks.carapace]).toEqual(axis);}
 for(const span of [.08,.9])expect(measureMotionScale({id:'brachyuran',graph:[]},{leg0FarRoot:[0,.5],leg0NearRoot:[span,.5]}).length).toBe(span);
});
