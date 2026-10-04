import fs from 'node:fs';
import {expect,it,vi,beforeEach,afterEach} from 'vitest';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from './creature-rig-contact.js';
import {compileBodyCard} from './motion/body-card.js';
import {buildTimeline,sampleTimeline} from './motion/timeline.js';
// Keep this direction/amplitude owner's original cadence explicit. The separate
// reaction-substep owner tests the new optional timing without moving limits.
const resolveContract=contracts.familyContractForRecord;
beforeEach(()=>{vi.spyOn(contracts,'familyContractForRecord').mockImplementation(record=>{const t=resolveContract(record);if(!t.contactStance?.travelSubsteps)return t;const{travelSubsteps,...stance}=t.contactStance;return{...t,contactStance:stance};});});
afterEach(()=>{vi.restoreAllMocks();});
const root=new URL('../../../../../',import.meta.url),packet=new URL('audits/ARCHETYPE_FINISH_20260923/12-myriapod/',root);
const read=(name:string)=>JSON.parse(fs.readFileSync(new URL(name,packet),'utf8'));
const {records}=JSON.parse(fs.readFileSync(new URL('port/v2/tools/creature-animation/test-fixtures/family-records.json',root),'utf8'));
// Balanced synthetic spans isolate direction ownership; they are not painted intake.
function fixture(){
 const r=structuredClone(records.myriapod);r.anatomy={schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],appendages:{walkingLegPairs:2,ultimateLegPairs:1}};
 r.landmarks={root:[.2,.5],head:[.8,.5],mandible:[.84,.51],antennaFar:[.86,.43],antennaNear:[.86,.47],ultimateFar:[.10,.46],ultimateNear:[.10,.54]};r.geometry.fixedAttachments={head:[.76,.5],ultimateFar:[.2,.47],ultimateNear:[.2,.53]};
 for(let i=0;i<2;i++)for(const side of ['Far','Near']){const id='leg'+i+side,x=.38+i*.20,y=side==='Far'?.45:.55,d=side==='Far'?-1:1;r.geometry.fixedAttachments[id+'Knee']=[x,y];r.landmarks[id+'Knee']=[x+.07,y+d*.10];r.landmarks[id+'Foot']=[x,y+d*.20];}return r;
}
function setup(r=fixture()){
 const card=compileBodyCard(r,r.genome),tl=buildTimeline(card,'hit',r.identity.seed),solver=createFamilyContactSolver(r),at=(progress:number,weight=1)=>{const ms=tl.root.dx[1]!.ms*progress,p=sampleTimeline(tl,ms),pose=Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation:rotation*weight,...j==='root'?{dx:p.root.dx*weight,dy:p.root.dy*weight}:{}}]));return{pose,phase:{actionId:'hit',elapsedMs:ms,durationMs:tl.durationMs,realm:card.realm,weight}};};return{r,card,tl,solver,at};
}
function physical(r:any,solver:ReturnType<typeof createFamilyContactSolver>,solved:ReturnType<typeof solver.resolve>){
 const template=contracts.familyContractForRecord(r),m=createSkeletonPoseProgram(template,r.landmarks).evaluate(solved.pose);
 expect(solved.contacts).toHaveLength(solver.chains.length);expect(solved.maxError).toBeLessThanOrEqual(1e-8);expect(solved.compression??0).toBeLessThanOrEqual(solver.scaleLength*.08);
 for(const contact of solved.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,h=transformPoint(m[c.hip]!,c.root),k=transformPoint(m[c.knee]!,c.joint),e=transformPoint(m[c.end]!,c.endPoint),p=predictContactSupport(c.model,m);
  expect(Math.hypot(k.x-h.x,k.y-h.y)).toBeCloseTo(c.chain.lengths.upper,13);expect(Math.hypot(e.x-k.x,e.y-k.y)).toBeCloseTo(c.chain.lengths.lower,13);expect(Math.hypot(e.x-contact.endpointTarget.x,e.y-contact.endpointTarget.y)).toBeLessThanOrEqual(1e-8);expect(Math.hypot((p.x-contact.paintedTarget.x)*r.geometry.width,(p.y-contact.paintedTarget.y)*r.geometry.height)).toBeLessThanOrEqual(.25);
  for(const j of[c.knee,c.end]){const l=(template.contactLimitsDeg??template.limitsDeg)[j]!,degrees=solved.pose[j]!.rotation*180/Math.PI;expect(degrees).toBeGreaterThanOrEqual(l.min-1e-7);expect(degrees).toBeLessThanOrEqual(l.max+1e-7);}
 }
}
it('explicit compact mode retracts both mirrored swing groups toward their sockets at the original amplitude',()=>{
 const{r,solver,at}=setup();expect(contracts.familyContractForRecord(r).contactStance?.swingLift).toBe('toward-socket');
 for(const progress of[.25,.75])for(const weight of[1,.65]){const{pose,phase}=at(progress,weight),before=JSON.stringify(pose),solved=solver.resolve(pose,phase);physical(r,solver,solved);expect(JSON.stringify(pose)).toBe(before);
  for(const contact of solved.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,swing=c.group===(progress<.5?1:0),local=progress<.5?progress*2:(progress-.5)*2,amplitude=swing?Math.sin(Math.PI*local)**2*c.chain.lengths.lower*.15*weight:0,direction=Math.sign(c.root.y-c.endPoint.y);
   expect(contact.stance).toBe(!swing);expect(contact.target.y).toBeCloseTo(c.endPoint.y+direction*amplitude,15);if(swing)expect(Math.abs(contact.target.y-c.root.y)).toBeLessThan(Math.abs(c.endPoint.y-c.root.y));else expect(contact.target.y).toBe(c.endPoint.y);
  }
 }
});
it('stance, zero-displacement endpoints and the stage-owned path retain their existing target ownership',()=>{
 const{r,solver,at,tl}=setup();
 for(const progress of[0,.5,1]){const{pose,phase}=at(progress),solved=solver.resolve(pose,phase);physical(r,solver,solved);for(const c of solved.contacts)expect(c.target.y).toBeCloseTo(r.landmarks[c.joint][1],15);}
 const sample=sampleTimeline(tl,tl.durationMs),pose=Object.fromEntries(Object.entries(sample.joints).map(([j,rotation])=>[j,{rotation,...j==='root'?{dx:sample.root.dx,dy:sample.root.dy}:{}}]));
 const end=solver.resolve(pose,{actionId:'hit',elapsedMs:tl.durationMs,durationMs:tl.durationMs,realm:'land'});expect(end.contacts.every(c=>c.stance)).toBe(true);for(const c of end.contacts)expect(c.target).toEqual({x:r.landmarks[c.joint][0],y:r.landmarks[c.joint][1]});
 const{pose:mid,phase}=at(.25),stage=solver.resolve(mid,{...phase,travel:'stage'});expect(stage.pose.root!.dx).toBe(0);expect(stage.contacts.every(c=>c.stance)).toBe(true);for(const c of stage.contacts)expect(c.target).toEqual({x:r.landmarks[c.joint][0],y:r.landmarks[c.joint][1]});physical(r,solver,stage);
});
it('a horizontal source span has zero vertical projection without inventing a side',()=>{
 const r=fixture();r.landmarks.leg0FarKnee=[.45,.37];r.landmarks.leg0FarFoot=[.55,.45];const{solver,at}=setup(r),{pose,phase}=at(.75),solved=solver.resolve(pose,phase),c=solved.contacts.find(c=>c.joint==='leg0FarFoot')!;expect(c.stance).toBe(false);expect(c.target.y).toBe(.45);physical(r,solver,solved);
});
it('omitting the declaration preserves exact former compact refusals and the ordinary screen-up target',()=>{
 const r=fixture(),template=contracts.familyContractForRecord(r),{swingLift,...stance}=template.contactStance!;expect(swingLift).toBe('toward-socket');const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...template,contactStance:stance});
 try{const{solver,at}=setup(r),{pose,phase}=at(.25),solved=solver.resolve(pose,phase);for(const contact of solved.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,amplitude=contact.stance?0:c.chain.lengths.lower*.15;expect(contact.target.y).toBe(c.endPoint.y-amplitude);}expect(solved.contacts.find(c=>c.joint==='leg1FarFoot')!.target.y).toBeLessThan(r.landmarks.leg1FarFoot[1]);}finally{spy.mockRestore();}
 const real=read('fit-04/record.json'),binding=read('fit-04/binding.json'),actual=contracts.familyContractForRecord(real),{swingLift:removed,...oldStance}=actual.contactStance!;expect(removed).toBe('toward-socket');const old=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...actual,contactStance:oldStance});
 try{const solver=createFamilyContactSolver(real,observedContactSupports(real,binding));for(const row of read('static-contact-diagnosis01.json').results){let message='';try{solver.resolve(row.attemptedPose,row.phase);}catch(e){message=String(e);}expect(message).toBe(row.error);}}finally{old.mockRestore();}
 for(const base of contracts.FAMILY_CONTRACTS)expect(Object.hasOwn(base.contactStance??{},'swingLift')).toBe(false);
});
it.each([undefined,null,'screen-up','away-from-socket',true])('refuses an explicitly invalid swing declaration (%j)',swingLift=>{
 const r=fixture(),t=contracts.familyContractForRecord(r),spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...t,contactStance:{...t.contactStance!,swingLift}as any});try{expect(()=>createFamilyContactSolver(r)).toThrow('invalid swing lift declaration');}finally{spy.mockRestore();}
});
it('foreign families/models and unbound fixed sockets cannot opt in',()=>{
 const r=fixture(),t=contracts.familyContractForRecord(r);
 for(const changed of[{...t,id:'insect'},{...t,anatomyModel:undefined},{...t,fixedPivots:undefined}]){const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue(changed as any);try{expect(()=>createFamilyContactSolver(r)).toThrow(/Fixed attachments:|invalid swing lift declaration/);}finally{spy.mockRestore();}}
});
it('original reach and local joint limits still refuse; input offsets are never erased',()=>{
 const{r,solver,at}=setup(),{pose,phase}=at(.25);expect(()=>solver.resolve({...pose,root:{...pose.root!,dx:99}},phase)).toThrow('reach');const t=contracts.familyContractForRecord(r),spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...t,contactLimitsDeg:{...t.limitsDeg,leg1FarFoot:{min:0,max:0}}});try{expect(()=>createFamilyContactSolver(r).resolve(pose,phase)).toThrow('joint limit leg1FarFoot');}finally{spy.mockRestore();}
});
it('actual retained hit/dodge first poses satisfy every contact and original physical guard under the explicit model',()=>{
 const r=read('fit-04/record.json'),binding=read('fit-04/binding.json'),solver=createFamilyContactSolver(r,observedContactSupports(r,binding)),diagnosis=read('static-contact-diagnosis01.json');expect(r.recipeHash).toBe(diagnosis.recordRecipeHash);expect(binding.bindingHash).toBe(diagnosis.bindingHash);expect(solver.chains).toHaveLength(28);
 for(const row of diagnosis.results){const before=JSON.stringify(row.attemptedPose),solved=solver.resolve(row.attemptedPose,row.phase);physical(r,solver,solved);expect(JSON.stringify(row.attemptedPose)).toBe(before);const c=solved.contacts.find(c=>c.joint==='leg3FarFoot')!;expect(c.stance).toBe(false);expect(c.target.y).toBeGreaterThan(r.landmarks.leg3FarFoot[1]);}
});
