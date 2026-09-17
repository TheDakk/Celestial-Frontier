import fs from 'node:fs';import {it,expect}from'vitest';
import {createFamilyContactSolver,contactPaintDriftPx}from'./creature-rig-contact.js';
import {familyContractForRecord,familyContactChains}from'../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram}from'../../../tools/creature-animation/skeleton-pose.mjs';
import {transformPoint}from'../../../tools/creature-animation/kinematics.js';
import {compileBodyCard}from'./motion/body-card.js';import{buildTimeline,sampleTimeline}from'./motion/timeline.js';
const root=new URL('../../../../../',import.meta.url),read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const records=read('port/v2/tools/creature-animation/test-fixtures/family-records.json').records;
const at=(r:any,p:any,j:string)=>{const m=createSkeletonPoseProgram(familyContractForRecord(r),r.landmarks).evaluate(p);return transformPoint(m[j]!,{x:r.landmarks[j][0],y:r.landmarks[j][1]});};
it.each(['quadruped','biped-bird','insect','arachnid','myriapod'])('holds actual declared %s stance endpoints under root travel and frees aerial motion',(id)=>{
 const r=structuredClone(records[id]),t=familyContractForRecord(r);
 // Explicit synthetic bend fixtures, never claimed as painted source evidence.
 for(const c of familyContactChains(t)){const a=r.landmarks[c.hip],b=r.landmarks[c.end];r.landmarks[c.knee]=[(a[0]+b[0])/2+.025,(a[1]+b[1])/2-.02];}
 const s=createFamilyContactSolver(r),p={root:{rotation:0,dx:.001,dy:.001}},ctx={actionId:'dodge',elapsedMs:200,durationMs:1000};
 const solved=s.resolve(p,ctx);
 expect(solved.contacts.length).toBe(t.legs.length);expect(solved.maxError).toBeLessThan(1e-8);
 for(const c of solved.contacts){const point=at(r,solved.pose,c.joint);expect(point.x).toBeCloseTo(c.target.x,9);expect(point.y).toBeCloseTo(c.target.y,9);}
 const first=solved.contacts[0]!;expect(at(r,p,first.joint)).not.toEqual(first.target);
 expect(s.resolve(p,{...ctx,actionId:'approach:flight'}).pose).toBe(p);
 expect(()=>s.resolve({root:{rotation:0,dx:99}},ctx)).toThrow('reach');
});
it.each(['crab','coconut-crab','freshwater-crab','mud-crab','vent-crab'])('keeps %s grounded through dodge, scuttle and mirrored replay without freezing swings',(id)=>{
 const source=read('audits/ANATOMY_COMPLETION_20260917/crab-fits-02/'+id+'/record.json');
 for(const mirror of[false,true]){
  const r={...source,landmarks:Object.fromEntries(Object.entries(source.landmarks as Record<string,number[]>).map(([j,p])=>[j,[mirror?1-p[0]!:p[0],p[1]]]))},s=createFamilyContactSolver(r),card=compileBodyCard(r);
  for(const action of['dodge','approach:scuttle','hit','faint','melee:pinch']){
   const tl=buildTimeline(card,action,133);let lifted=0;
   for(let i=0;i<=120;i++){const ms=tl.durationMs*i/120,p=sampleTimeline(tl,ms),pose=Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation,...j==='root'?{dx:p.root.dx,dy:p.root.dy}:{}}])),context={actionId:action,elapsedMs:ms,durationMs:tl.durationMs};
    const resolved=s.resolve(pose,context);expect(resolved.maxError).toBeLessThan(1e-8);
    for(const c of resolved.contacts)if(!c.stance&&c.target.y<r.landmarks[c.joint]![1]!-1e-6)lifted++;
    if(i===45)expect(s.resolve(pose,context)).toEqual(s.resolve(pose,context));
   }
   if(action==='approach:scuttle')expect(lifted).toBeGreaterThan(0);else expect(lifted).toBe(0);
  }
 }
});
it('zero-leg and aquatic bodies do not acquire a ground constraint',()=>{const fish=records.fish,s=createFamilyContactSolver(fish),pose={root:{rotation:.1}};expect(s.resolve(pose,{actionId:'approach:swim',elapsedMs:200,durationMs:1000,realm:'aquatic'})).toEqual({pose,contacts:[],maxError:0});});

it('measures rendered support drift independently of a fixed skeleton and preserves footprint offsets',()=>{
 expect(contactPaintDriftPx([.51,.62],[.5,.6],[.41,.52],[.4,.5],[1000,1000])).toBeLessThan(1e-9);
 expect(contactPaintDriftPx([.503,.6],[.5,.6],[.4,.5],[.4,.5],[1000,1000])).toBeGreaterThan(.25);
 expect(contactPaintDriftPx([.5,.6],[.5,.6],[.4,.5],[.4,.5],[1000,1000])).toBe(0);
 expect(()=>contactPaintDriftPx([NaN,0],[0,0],[0,0],[0,0],[1000,1000])).toThrow('invalid');
});
it('contact phase is independent of render cadence and keeps a real swing while stance remains fixed',()=>{
 const r=read('audits/ANATOMY_COMPLETION_20260917/crab-fits-02/crab/record.json'),s=createFamilyContactSolver(r);
 const sample=(fps:number)=>{for(let ms=0;ms<625;ms+=1000/fps)s.resolve({}, {actionId:'approach:scuttle',elapsedMs:ms,durationMs:1000});return s.resolve({}, {actionId:'approach:scuttle',elapsedMs:625,durationMs:1000});};
 expect(sample(30)).toEqual(sample(60));expect(sample(60)).toEqual(sample(120));
 expect(sample(30).contacts.some(c=>!c.stance&&c.target.y<r.landmarks[c.joint][1])).toBe(true);
 expect(sample(30).contacts.some(c=>c.stance&&c.target.y===r.landmarks[c.joint][1])).toBe(true);
});
