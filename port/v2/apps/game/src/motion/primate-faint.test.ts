import fs from 'node:fs';import{it,expect}from'vitest';
import{compileBodyCard}from'./body-card.js';import{withPaintedContactSupports}from'./painted-supports.js';import{actionsFor}from'./family-actions.js';import{paintedGroundedMotion}from'./painted-grounded-motion.js';import{buildActionTimeline,buildTimeline,sampleTimeline}from'./timeline.js';import{createFamilyContactSolver,observedContactSupports}from'../creature-rig-contact.js';
const root=new URL('../../../../../../',import.meta.url);
function fixture(id:string){const dir='audits/G1_AUTO_AUTHOR_20260926/auto-c221p1-clean/'+id+'/fit/',read=(n:string)=>JSON.parse(fs.readFileSync(new URL(dir+n,root),'utf8')),record=read('record.json'),binding=read('binding.json'),base=compileBodyCard(record,record.genome);return{record,binding,base,card:withPaintedContactSupports(base,record,binding)};}
for(const id of ['g2c163familyoriginals-09-spider-monkey','g2c163familyoriginals-10-macaque'])it(id+' settles without collapsing the supported painted legs; original collapse remains refused',()=>{
 const f=fixture(id),action=actionsFor('primate',f.card.anatomy)!.faint!,raw=buildActionTimeline(f.card,action,f.card.identity.seed),next=buildTimeline(f.card,'faint',f.card.identity.seed),solver=createFamilyContactSolver(f.record,observedContactSupports(f.record,f.binding));
 const failures=(tl:typeof raw)=>{let n=0;for(let i=0;i<=240;i++){const ms=tl.durationMs*i/240,p=sampleTimeline(tl,ms),pose={...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:p.root};try{solver.resolve(pose,{actionId:'faint',elapsedMs:ms,durationMs:tl.durationMs,weight:1,realm:f.card.realm});}catch{n++;}}return n;};
 expect(failures(raw)).toBeGreaterThan(0);expect(failures(next)).toBe(0);expect(next.phases).toEqual(raw.phases);expect(next.durationMs).toBe(raw.durationMs);expect(next.limitsRad).toEqual(raw.limitsRad);
 expect(paintedGroundedMotion(f.base,action)).toBe(action);expect(paintedGroundedMotion({...f.card,realm:'aquatic'},action)).toBe(action);
 for(const a of Object.values(actionsFor('primate',f.card.anatomy)!))if(a.id!=='faint')expect(paintedGroundedMotion(f.card,a)).toBe(a);
 expect(()=>solver.resolve({root:{rotation:1,dy:2}},{actionId:'faint',elapsedMs:100,durationMs:next.durationMs,realm:f.card.realm})).toThrow();
});

it('held faint retains measurable supported body lowering with a neutral local head chain',()=>{
 const f=fixture('g2c163familyoriginals-10-macaque'),raw=actionsFor('primate',f.card.anatomy)!.faint!,adapted=paintedGroundedMotion(f.card,raw),last=adapted.poses.at(-1)!;
 const actual=buildTimeline(f.card,'faint',f.card.identity.seed),held=sampleTimeline(actual,actual.durationMs);expect(held.root.rotation).toBeGreaterThan(.1);expect(held.root.dy).toBeGreaterThanOrEqual(.05);expect(Math.abs(held.joints.neck??0)).toBeLessThan(1e-9);expect(Math.abs(held.joints.head??0)).toBeLessThan(1e-9);expect(last.joints.spine??0).toBe(0);expect(last.joints.legNearHip??0).toBe(0);expect(last.joints.legFarHip??0).toBe(0);expect(last.joints.pelvis??0).toBe(0);expect(last.root).toEqual({dx:0,dy:0});
 const before=structuredClone(raw);paintedGroundedMotion(f.card,raw);expect(raw).toEqual(before);
});
