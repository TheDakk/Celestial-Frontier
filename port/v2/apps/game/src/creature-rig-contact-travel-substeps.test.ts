import fs from 'node:fs';
import {expect,it,vi} from 'vitest';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {transformPoint} from '../../../tools/creature-animation/kinematics.js';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport} from './creature-rig-contact.js';
import {createContactTravel} from './creature-contact-travel.js';
import {compileBodyCard} from './motion/body-card.js';
import {buildTimeline,sampleTimeline,sampleKeys} from './motion/timeline.js';
const root=new URL('../../../../../',import.meta.url),packet=new URL('audits/ARCHETYPE_FINISH_20260923/12-myriapod/',root),read=(p:string)=>JSON.parse(fs.readFileSync(new URL(p,packet),'utf8'));
const records=JSON.parse(fs.readFileSync(new URL('port/v2/tools/creature-animation/test-fixtures/family-records.json',root),'utf8')).records;
function fixture(){
 const r=structuredClone(records.myriapod);r.anatomy={schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],appendages:{walkingLegPairs:2,ultimateLegPairs:1}};
 r.landmarks={root:[.2,.5],head:[.8,.5],mandible:[.84,.51],antennaFar:[.86,.43],antennaNear:[.86,.47],ultimateFar:[.10,.46],ultimateNear:[.10,.54]};r.geometry.fixedAttachments={head:[.76,.5],ultimateFar:[.2,.47],ultimateNear:[.2,.53]};
 for(let i=0;i<2;i++)for(const side of['Far','Near']){const id='leg'+i+side,x=.38+i*.20,y=side==='Far'?.45:.55,d=side==='Far'?-1:1;r.geometry.fixedAttachments[id+'Knee']=[x,y];r.landmarks[id+'Knee']=[x+.07,y+d*.10];r.landmarks[id+'Foot']=[x,y+d*.20];}return r;
}
function at(r:any,id:string,ms:number,weight=1){const card=compileBodyCard(r,r.genome),timeline=buildTimeline(card,id,r.identity.seed),p=sampleTimeline(timeline,ms),pose=Object.fromEntries(Object.entries(p.joints).map(([joint,rotation])=>[joint,{rotation:rotation*weight,...joint==='root'?{dx:p.root.dx*weight,dy:p.root.dy*weight}:{}}]));return{card,timeline,pose,phase:{actionId:id,elapsedMs:ms,durationMs:timeline.durationMs,realm:card.realm,weight}};}
function withoutCadence(r:any,supports:Parameters<typeof createFamilyContactSolver>[1]={}){const t=contracts.familyContractForRecord(r),{travelSubsteps,...stance}=t.contactStance!,spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...t,contactStance:stance});try{return createFamilyContactSolver(r,supports);}finally{spy.mockRestore();}}
function physical(r:any,solver:ReturnType<typeof createFamilyContactSolver>,result:ReturnType<typeof solver.resolve>){const t=contracts.familyContractForRecord(r),m=createSkeletonPoseProgram(t,r.landmarks).evaluate(result.pose);expect(result.contacts).toHaveLength(solver.chains.length);expect(result.maxError).toBeLessThanOrEqual(1e-8);expect(result.compression??0).toBeLessThanOrEqual(solver.scaleLength*.08);expect(result.maxPaintTargetErrorPx).toBeLessThanOrEqual(.25);
 for(const c of solver.chains){const contact=result.contacts.find(p=>p.joint===c.end)!,h=transformPoint(m[c.hip]!,c.root),k=transformPoint(m[c.knee]!,c.joint),e=transformPoint(m[c.end]!,c.endPoint),p=predictContactSupport(c.model,m);expect(Math.hypot(k.x-h.x,k.y-h.y)).toBeCloseTo(c.chain.lengths.upper,13);expect(Math.hypot(e.x-k.x,e.y-k.y)).toBeCloseTo(c.chain.lengths.lower,13);expect(Math.hypot(e.x-contact.endpointTarget.x,e.y-contact.endpointTarget.y)).toBeLessThanOrEqual(1e-8);expect(Math.hypot((p.x-contact.paintedTarget.x)*r.geometry.width,(p.y-contact.paintedTarget.y)*r.geometry.height)).toBeLessThanOrEqual(.25);for(const joint of[c.knee,c.end]){const deg=result.pose[joint]!.rotation*180/Math.PI,l=(t.contactLimitsDeg??t.limitsDeg)[joint]!;expect(deg).toBeGreaterThanOrEqual(l.min-1e-7);expect(deg).toBeLessThanOrEqual(l.max+1e-7);}}
}
it('retains exact root arithmetic at source waypoints, substep midpoints and endpoints in all declared actions',()=>{
 const r=fixture(),solver=createFamilyContactSolver(r),old=withoutCadence(r);
 for(const id of['hit','dodge','tame']){const{card,timeline}=at(r,id,0),travel=createContactTravel(timeline.root.dx,card.bodyLength),times=new Set([0,timeline.durationMs,timeline.durationMs+100]);for(let i=1;i<timeline.root.dx.length;i++){const a=timeline.root.dx[i-1]!.ms,b=timeline.root.dx[i]!.ms;for(const t of[.25,.5,.75,1])times.add(a+(b-a)*t);}
  for(const ms of times){const s=at(r,id,ms),step=travel.sample(ms),expected=(step.base+step.stride*step.progress)/card.bodyLength+s.pose.root!.dx!-sampleKeys(timeline.root.dx,ms),result=solver.resolve(s.pose,s.phase),before=old.resolve(s.pose,s.phase);expect(result.pose.root!.dx).toBe(expected);expect(Object.is(result.pose.root!.dx,before.pose.root!.dx)).toBe(true);physical(r,solver,result);}
 }
});
it('uses two complete alternating steps with signed travel and unchanged lift/retraction amplitudes',()=>{
 const r=fixture(),solver=createFamilyContactSolver(r),{card,timeline}=at(r,'hit',0),travel=createContactTravel(timeline.root.dx,card.bodyLength),smooth=(v:number)=>v*v*(3-2*v);
 for(const interval of[1,timeline.root.dx.length-1]){const a=timeline.root.dx[interval-1]!.ms,b=timeline.root.dx[interval]!.ms;for(const p of[.125,.375,.625,.875]){const s=at(r,'hit',a+(b-a)*p),original=travel.sample(s.phase.elapsedMs),subindex=p<.5?0:1,progress=p*2-subindex,base=original.base+original.stride/2*subindex,stride=original.stride/2,result=solver.resolve(s.pose,s.phase);expect(Math.sign(stride)).toBe(interval===1?-1:1);
  for(const contact of result.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,swing=c.group===(progress<.5?1:0),local=swing?(c.group===1?progress*2:(progress-.5)*2):0,step=c.group===1?(progress<.5?smooth(progress*2):1):(progress<.5?0:smooth((progress-.5)*2)),wave=Math.sin(Math.PI*local)**2;expect(contact.stance).toBe(!swing);expect(contact.target.x).toBeCloseTo(c.endPoint.x+base+stride*step-(swing?Math.sign(c.endPoint.x-c.root.x)*c.chain.lengths.lower*.10*wave:0),14);expect(contact.target.y).toBeCloseTo(c.endPoint.y+Math.sign(c.root.y-c.endPoint.y)*(swing?c.chain.lengths.lower*.15*wave:0),14);}
 }}
});
it('keeps contact positions continuous at the internal half and authored segment boundary',()=>{
 const r=fixture(),solver=createFamilyContactSolver(r),{timeline}=at(r,'dodge',0);for(const ms of[timeline.root.dx[1]!.ms/2,timeline.root.dx[1]!.ms,(timeline.root.dx[1]!.ms+timeline.root.dx[2]!.ms)/2]){const samples=[ms-1e-7,ms,ms+1e-7].map(t=>{const s=at(r,'dodge',t);return solver.resolve(s.pose,s.phase);});for(let j=0;j<solver.chains.length;j++){const a=samples[0]!.contacts[j]!,b=samples[1]!.contacts[j]!,c=samples[2]!.contacts[j]!;expect(a.target.x).toBeCloseTo(b.target.x,8);expect(c.target.x).toBeCloseTo(b.target.x,8);expect(a.target.y).toBeCloseTo(b.target.y,8);expect(c.target.y).toBeCloseTo(b.target.y,8);}}
});
it('other actions, stationary holds, after-end poses and stage-owned travel keep old complete results',()=>{
 const r=fixture(),solver=createFamilyContactSolver(r),old=withoutCadence(r);expect(contracts.familyContractForRecord(r).contactStance!.travelSubsteps).toEqual({hit:2,dodge:2,tame:2});
 for(const [id,ms]of[['alert',50],['tame',400],['tame',640],['hit',450],['dodge',280]]as const){const s=at(r,id,ms);expect(JSON.stringify(solver.resolve(s.pose,s.phase))).toBe(JSON.stringify(old.resolve(s.pose,s.phase)));}
 for(const id of['hit','dodge','tame']){const s=at(r,id,50),phase={...s.phase,travel:'stage' as const};expect(JSON.stringify(solver.resolve(s.pose,phase))).toBe(JSON.stringify(old.resolve(s.pose,phase)));}
});
it.each([null,{},[],{hit:1},{hit:3},{hit:2.5},{hit:'2'},{feed:2},{other:2},Object.create({hit:2}),{[Symbol('hit')]:2}])('rejects malformed or out-of-scope subdivision declarations (%j)',travelSubsteps=>{
 const r=fixture(),t=contracts.familyContractForRecord(r),spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...t,contactStance:{...t.contactStance!,travelSubsteps}as any});try{expect(()=>createFamilyContactSolver(r)).toThrow('invalid travel substeps declaration');}finally{spy.mockRestore();}
});
it('requires a compact model and an explicitly declared source-step reaction',()=>{
 const r=fixture(),t=contracts.familyContractForRecord(r);for(const changed of[{...t,anatomyModel:undefined},{...t,contactStance:{...t.contactStance!,travel:{dodge:'source-steps'}}}]){const spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue(changed as any);try{expect(()=>createFamilyContactSolver(r)).toThrow(/Fixed attachments:|invalid swing lift declaration|invalid travel substeps declaration/);}finally{spy.mockRestore();}}
 for(const t of contracts.FAMILY_CONTRACTS)expect(Object.hasOwn(t.contactStance??{},'travelSubsteps')).toBe(false);
});
it('repairs both retained fit07 first/maximum dodge poses under every original full-ensemble guard',()=>{
 const r=read('fit-07/record.json'),b=read('fit-07/binding.json'),e=read('static-contact-diagnosis03.json'),supports=observedContactSupports(r,b),solver=createFamilyContactSolver(r,supports),old=withoutCadence(r,supports);expect(r.recipeHash).toBe(e.recordRecipeHash);expect(b.bindingHash).toBe(e.bindingHash);expect(solver.chains).toHaveLength(28);
 for(const row of e.results){let error='';try{old.resolve(row.attemptedPose,row.phase);}catch(e){error=String(e);}expect(error).toBe(row.error);const before=JSON.stringify(row.attemptedPose),result=solver.resolve(row.attemptedPose,row.phase);physical(r,solver,result);expect(JSON.stringify(row.attemptedPose)).toBe(before);}
});
it('preserves impossible input offsets and local joint-limit refusals',()=>{
 const r=fixture(),s=at(r,'hit',15),solver=createFamilyContactSolver(r);expect(()=>solver.resolve({...s.pose,root:{...s.pose.root!,dx:99}},s.phase)).toThrow('reach');const t=contracts.familyContractForRecord(r),spy=vi.spyOn(contracts,'familyContractForRecord').mockReturnValue({...t,contactLimitsDeg:{...t.limitsDeg,leg1FarFoot:{min:0,max:0}}});try{expect(()=>createFamilyContactSolver(r).resolve(s.pose,s.phase)).toThrow('joint limit');}finally{spy.mockRestore();}
});
it('tame return uses two continuous backward steps while keeping the exact blended root and end targets',()=>{
 const r=fixture(),solver=createFamilyContactSolver(r),old=withoutCadence(r),{card,timeline}=at(r,'tame',0),base=sampleKeys(timeline.root.dx,timeline.durationMs)*card.bodyLength,smooth=(v:number)=>v*v*(3-2*v);
 for(const weight of[1,.875,.625,.5,.375,.125,0]){
  const s=at(r,'tame',timeline.durationMs+80,weight),result=solver.resolve(s.pose,s.phase),prior=old.resolve(s.pose,s.phase),originalProgress=1-weight,half=-base/2,index=originalProgress*2<1?0:1,progress=originalProgress*2-index;
  expect(Object.is(result.pose.root!.dx,prior.pose.root!.dx)).toBe(true);physical(r,solver,result);
  for(const contact of result.contacts){const c=solver.chains.find(c=>c.end===contact.joint)!,swing=weight>0&&weight<1&&c.group===(progress<.5?1:0),local=swing?(c.group===1?progress*2:(progress-.5)*2):0,step=c.group===1?(progress<.5?smooth(progress*2):1):(progress<.5?0:smooth((progress-.5)*2)),wave=Math.sin(Math.PI*local)**2;
   expect(contact.stance).toBe(!swing);
   const expected=weight===1?c.endPoint.x+base:c.endPoint.x+base+half*index+half*step-(swing?Math.sign(c.endPoint.x-c.root.x)*c.chain.lengths.lower*.10*wave*weight:0);
   expect(contact.target.x).toBeCloseTo(expected,14);expect(contact.target.y).toBeCloseTo(c.endPoint.y+Math.sign(c.root.y-c.endPoint.y)*(swing?c.chain.lengths.lower*.15*wave*weight:0),14);
  }
 }
 for(const weight of[.75,.5,.25]){const results=[weight-1e-8,weight,weight+1e-8].map(w=>{const s=at(r,'tame',timeline.durationMs+80,w);return solver.resolve(s.pose,s.phase);});for(let i=0;i<solver.chains.length;i++)for(const side of[0,2]){expect(results[side]!.contacts[i]!.target.x).toBeCloseTo(results[1]!.contacts[i]!.target.x,7);expect(results[side]!.contacts[i]!.target.y).toBeCloseTo(results[1]!.contacts[i]!.target.y,7);}}
});
