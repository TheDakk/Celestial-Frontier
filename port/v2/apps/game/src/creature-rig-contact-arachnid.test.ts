import fs from 'node:fs';
import {expect,it,vi} from 'vitest';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {createFamilyContactSolver} from './creature-rig-contact.js';
import {compileBodyCard} from './motion/body-card.js';
import {buildTimeline,sampleTimeline,sampleKeys} from './motion/timeline.js';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
const root=new URL('../../../../../',import.meta.url);
const {records}=JSON.parse(fs.readFileSync(new URL('port/v2/tools/creature-animation/test-fixtures/family-records.json',root),'utf8'));
// Synthetic canonical geometry tests policy/solver semantics, never paint intake.
const record=records.arachnid,template=contracts.familyContractForRecord(record),card=compileBodyCard(record);
const posterior=['leg3FarFoot','leg3NearFoot','leg4FarFoot','leg4NearFoot'];
const anterior=['leg1Far','leg1Near','leg2Far','leg2Near'].flatMap(id=>[id+'Knee',id+'Foot']);
const timelines=Object.fromEntries(['cast','victory','dodge','hit','tame','faint'].map(id=>[id,buildTimeline(card,id,record.identity.seed)]));
const sample=(id:string,ms:number)=>{const s=sampleTimeline(timelines[id]!,ms);return Object.fromEntries(Object.entries(s.joints).map(([j,rotation])=>[j,{rotation,...j==='root'?{dx:s.root.dx,dy:s.root.dy}:{}}]));};
const phase=(id:string,ms:number)=>({actionId:id,elapsedMs:ms,durationMs:timelines[id]!.durationMs,realm:card.realm});
const keys=(id:string)=>[...new Set(timelines[id]!.root.dy.map(k=>k.ms))];
function physical(solver:ReturnType<typeof createFamilyContactSolver>,solved:ReturnType<typeof solver.resolve>,sourceRecord=record){
 const matrices=createSkeletonPoseProgram(contracts.familyContractForRecord(sourceRecord),sourceRecord.landmarks).evaluate(solved.pose);
 expect(solved.maxError).toBeLessThanOrEqual(1e-8);expect(solved.compression??0).toBeLessThanOrEqual(solver.scaleLength*.08);
 for(const contact of solved.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,p=transformPoint(matrices[c.end]!,c.endPoint);
  expect(Math.hypot(p.x-contact.endpointTarget.x,p.y-contact.endpointTarget.y)).toBeLessThanOrEqual(1e-8);
  for(const j of [c.knee,c.end]){const limit=template.limitsDeg[j]!,degrees=solved.pose[j]!.rotation*180/Math.PI;expect(degrees).toBeGreaterThanOrEqual(limit.min-1e-7);expect(degrees).toBeLessThanOrEqual(limit.max+1e-7);}
 }
}
it.each(['cast','victory'])('%s constrains the four explicit posterior feet and preserves the raised anterior keys',id=>{
 const solver=createFamilyContactSolver(record);let moving=false;
 for(const ms of keys(id)){const input=sample(id,ms),before=JSON.stringify(input),solved=solver.resolve(input,phase(id,ms));
  expect(solved.contacts.map(c=>c.joint).sort()).toEqual(posterior);expect(solved.contacts.every(c=>c.stance)).toBe(true);physical(solver,solved);
  for(const j of anterior){expect(solved.pose[j]).toEqual(input[j]);moving||=input[j]!.rotation!==0;}
  expect(JSON.stringify(input)).toBe(before);
 }expect(moving).toBe(true);
});
it('dodge releases every foot but preserves every original released knee/foot bound',()=>{
 const solver=createFamilyContactSolver(record);
 for(const ms of keys('dodge')){const input=sample('dodge',ms),solved=solver.resolve(input,phase('dodge',ms));expect(solved.contacts).toEqual([]);expect(solved.pose).toBe(input);}
 for(const c of solver.chains)for(const joint of [c.knee,c.end])for(const deg of [template.limitsDeg[joint]!.min-1,template.limitsDeg[joint]!.max+1])expect(()=>solver.resolve({[joint]:{rotation:deg*Math.PI/180}},phase('dodge',0))).toThrow('raw clip joint limit '+joint);
});
it('faint remains all-eight grounded and impossible translations still refuse',()=>{
 const solver=createFamilyContactSolver(record),solved=solver.resolve(sample('faint',0),phase('faint',0));
 expect(solved.contacts).toHaveLength(8);expect(solved.contacts.every(c=>c.stance)).toBe(true);physical(solver,solved);
 expect(()=>solver.resolve({root:{rotation:0,dx:99}},phase('faint',100))).toThrow('reach');
});
it.each([undefined,null,[],['leg3Far','leg3Far'],['leg5Far'],['leg3FarFoot'],['leg3Far',7]])('refuses an invalid explicit support inventory (%j)',hind=>{
 const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...template,contactStance:{...template.contactStance!,hind} as any});
 try{expect(()=>createFamilyContactSolver(record)).toThrow('invalid declared hind support group');}finally{spy.mockRestore();}
});
it('refuses a declared leg lacking a resolved contact chain',()=>{
 const chains=contracts.familyContactChains(template),spy=vi.spyOn(contracts,'familyContactChains').mockReturnValue(chains.filter(c=>c.id!=='leg4Near'));
 try{expect(()=>createFamilyContactSolver(record)).toThrow('invalid declared hind support group');}finally{spy.mockRestore();}
});
it('former all-foot policy cannot pass the posterior-only or released inventories',()=>{
 const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...template,contactStance:{default:'all',actions:{}}});
 try{const solver=createFamilyContactSolver(record);for(const id of ['cast','victory','dodge'])expect(solver.resolve({},phase(id,0)).contacts).toHaveLength(8);}finally{spy.mockRestore();}
});
it.each(['hit','tame'])('retains the canonical fixture lower-leg compression refusal during %s swing',id=>{
 const tl=timelines[id]!,ms=tl.root.dx[1]!.ms*.25;
 expect(()=>createFamilyContactSolver(record).resolve(sample(id,ms),phase(id,ms))).toThrow('leg2Far RangeError: target outside two-bone reach');
});
// Equal-length synthetic chains isolate planner semantics from the canonical
// fixture's short-upper/long-lower inner-reach failure. Preserve its bend side,
// endpoints and body; no painted input, contract limit or solver changes.
function balancedTravelFixture(){
 const r=structuredClone(record);for(const c of contracts.familyContactChains(template)){const h=r.landmarks[c.hip],k=r.landmarks[c.knee],e=r.landmarks[c.end],dx=e[0]-h[0],dy=e[1]-h[1],sign=Math.sign(dx*(k[1]-h[1])-dy*(k[0]-h[0]));r.landmarks[c.knee]=[(h[0]+e[0])/2-sign*dy*.3,(h[1]+e[1])/2+sign*dx*.3];}return r;
}
it.each(['hit','tame'])('%s uses the existing signed planner with two honest alternating tetrapods',id=>{
 const travelRecord=balancedTravelFixture(),solver=createFamilyContactSolver(travelRecord),travelCard=compileBodyCard(travelRecord),tl=buildTimeline(travelCard,id,travelRecord.identity.seed),a=tl.root.dx[0]!,b=tl.root.dx[1]!;
 const inputAt=(ms:number)=>{const s=sampleTimeline(tl,ms);return Object.fromEntries(Object.entries(s.joints).map(([j,rotation])=>[j,{rotation,...j==='root'?{dx:s.root.dx,dy:s.root.dy}:{}}]));};
 const at=(ms:number)=>({actionId:id,elapsedMs:ms,durationMs:tl.durationMs,realm:travelCard.realm});
 const groups=[['leg1Far','leg2Near','leg3Far','leg4Near'],['leg1Near','leg2Far','leg3Near','leg4Far']];
 for(let g=0;g<2;g++)expect(solver.chains.filter(c=>c.group===g).map(c=>c.id).sort()).toEqual(groups[g]!.slice().sort());
 expect(Math.sign(b.value)).toBe(id==='hit'?-1:1);
 for(const progress of [.25,.75]){const ms=a.ms+(b.ms-a.ms)*progress,input=inputAt(ms),solved=solver.resolve(input,at(ms));physical(solver,solved,travelRecord);expect(solved.contacts).toHaveLength(8);
  const swingGroup=progress<.5?1:0;
  expect(solved.contacts.filter(c=>!c.stance).map(c=>c.joint).sort()).toEqual(groups[swingGroup]!.map(id=>id+'Foot').sort());
  for(const c of solved.contacts.filter(c=>!c.stance))expect(c.target.y).toBeLessThan(record.landmarks[c.joint][1]);
  const linear=a.value+(b.value-a.value)*progress+(input.root?.dx??0)-sampleKeys(tl.root.dx,ms);expect(solved.pose.root!.dx).toBeCloseTo(linear,12);
 }
 const ms=b.ms/2,input=inputAt(ms),stage=solver.resolve(input,{...at(ms),travel:'stage'});
 expect(stage.pose.root!.dx).toBe(0);expect(stage.contacts.every(c=>c.stance)).toBe(true);physical(solver,stage,travelRecord);
 expect(()=>solver.resolve({...input,root:{...input.root!,dx:99}},at(ms))).toThrow('reach');
 const end=solver.resolve(inputAt(tl.durationMs),at(tl.durationMs));expect(end.contacts.every(c=>c.stance)).toBe(true);physical(solver,end,travelRecord);
});
it.each(['quadruped','insect','hopper'])('an absent named group retains the historical %s hind-name selection',id=>{
 const r=id==='hopper'?JSON.parse(fs.readFileSync(new URL('audits/ARCHETYPE_FINISH_20260923/06-hopper/fit-01/record.json',root),'utf8')):records[id];
 const base=contracts.familyContractForRecord(r),hind=base.legs.filter(name=>name.startsWith('hind')||name.startsWith('legHind')),ordinary=createFamilyContactSolver(r);
 expect(Object.hasOwn(base.contactStance!,'hind')).toBe(false);expect(hind.length).toBeGreaterThan(0);
 const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...base,contactStance:{...base.contactStance!,hind}});
 try{const explicit=createFamilyContactSolver(r);for(const actionId of ['idle','cast','dodge']){const p={actionId,elapsedMs:0,durationMs:1000,realm:'land'},normal=ordinary.resolve({},p),named=explicit.resolve({},p);expect(named).toEqual(normal);if(actionId==='cast')expect(named.contacts.map(c=>c.joint).sort()).toEqual(hind.map(name=>name+(id==='insect'?'Foot':'Ankle')).sort());}}finally{spy.mockRestore();}
});

it('keeps the separate collinear canonical Hopper refusal with either support-group declaration',()=>{
 const r=records.hopper,base=contracts.familyContractForRecord(r),hind=base.legs.filter(name=>name.startsWith('hind'));
 expect(()=>createFamilyContactSolver(r)).toThrow('Contact: source bend direction missing foreFar');
 const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...base,contactStance:{...base.contactStance!,hind}});
 try{expect(()=>createFamilyContactSolver(r)).toThrow('Contact: source bend direction missing foreFar');}finally{spy.mockRestore();}
});
