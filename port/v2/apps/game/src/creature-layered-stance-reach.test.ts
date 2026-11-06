import fs from 'node:fs';
import path from 'node:path';
import {expect,it} from 'vitest';
import {measureLayeredStanceReach} from './creature-layered-stance-reach.js';
import {createFamilyContactSolver} from './creature-rig-contact.js';
import {compileBodyCard} from './motion/body-card.js';
import {buildTimeline} from './motion/timeline.js';
import {addPose,sampleClip} from './battle2/choreography.js';

const root=path.resolve(import.meta.dirname,'../../../../..');
const read=(fit:string)=>JSON.parse(fs.readFileSync(path.join(root,'audits/ART_BATTLE_FOCUS_20260925',fit,'record.json'),'utf8'));
it('reproduces the Cougar refusal that an isolated gait reach falsely admits',()=>{
 const r=read('cougar-repair-03/fit-03'),card=compileBodyCard(r,r.genome),solver=createFamilyContactSolver(r);
 const gait=buildTimeline(card,'approach',5),idle=buildTimeline(card,'idle',5),ms=gait.durationMs*37/120;
 const raw=sampleClip({source:'timeline',timeline:gait},ms),composite=addPose(sampleClip({source:'timeline',timeline:idle},idle.durationMs/2),raw);
 const phase={actionId:gait.actionId,elapsedMs:ms,durationMs:gait.durationMs,weight:1,realm:card.realm,travel:'stage' as const,stageDisplacement:.08563476562500001};
 expect(()=>solver.resolve(raw,phase)).not.toThrow();
 expect(()=>solver.resolve(composite,{...phase,stageDisplacement:0})).not.toThrow();
 expect(()=>solver.resolve(composite,phase)).toThrow('compression bound');
 const m=measureLayeredStanceReach(r,{},.5,card);
 expect(m.admitted).toBeGreaterThan(0);
 expect(()=>solver.resolve(composite,{...phase,stageDisplacement:m.admitted*.9*2*37/120})).not.toThrow();
 // The old displacement still refuses: this repair does not relax contact admission.
 expect(()=>solver.resolve(composite,phase)).toThrow('compression bound');
});

it.each(['18-ibex/fit-02','11-wolf/fit-03'])('admits independently phased composite walks for %s',(fit)=>{
 const r=read(fit),card=compileBodyCard(r,r.genome),solver=createFamilyContactSolver(r),m=measureLayeredStanceReach(r,{},.5,card);
 expect(m.admitted).toBeGreaterThan(0);expect(m.admitted).toBeLessThanOrEqual(.5);
 const gait=buildTimeline(card,'approach',91),idle=buildTimeline(card,'idle',91);
 // Shifted phases and a different idle period from the measurement lattice.
 for(let i=0;i<37;i++)for(let k=0;k<11;k++){
  const fraction=(i+.5)/37,ms=gait.durationMs*fraction;
  const pose=addPose(sampleClip({source:'timeline',timeline:idle},idle.durationMs*(k+.5)/11),sampleClip({source:'timeline',timeline:gait},ms));
  expect(()=>solver.resolve(pose,{actionId:gait.actionId,elapsedMs:ms,durationMs:gait.durationMs,weight:1,realm:card.realm,travel:'stage',stageDisplacement:2*m.admitted*.9*(fraction%0.5)})).not.toThrow();
 }
 // A caller cannot use this instrument to raise the stage's existing cap or use a different card.
 expect(()=>measureLayeredStanceReach(r,{},.51,card)).toThrow('existing stage cap');
 expect(()=>measureLayeredStanceReach(r,{},.5,{...card,recipeHash:'other'})).toThrow('identity mismatch');
});

import {measureCommonSampleGrid} from './creature-layered-stance-reach.js';
it('rechecks earlier poses and invalidates the suffix after another restriction',()=>{
 const seen=new Map<number,Set<number>>();
 const check=(row:number,d:number)=>{
  (seen.get(row)??(seen.set(row,new Set()),seen.get(row)!)).add(d);
  return (row===0?(d===8||d<=2):row===1?(d===8||d===4||d<=1):d<=4)?null:{row,d};
 };
 // row2 reduces8 to4; row0 refuses4 and reduces to2; row1 refuses2.
 const m=measureCommonSampleGrid([0,1,2],8,check);
 expect(m.gridIndex).toBe(1);
 for(const r of[0,1,2])expect(seen.get(r)?.has(1)).toBe(true);
});
it('does one candidate pass when all samples accept the cap',()=>{
 let calls=0;const m=measureCommonSampleGrid([0,1,2],256,()=>{calls++;return null;});
 expect(m.gridIndex).toBe(256);expect(calls).toBe(3);expect(m.firstRefusal).toBeNull();
});
it('refuses a zero-only lattice and malformed/empty grids',()=>{
 expect(()=>measureCommonSampleGrid([0],8,(_r,d)=>d>0?'refusal':null)).toThrow('no positive');
 expect(()=>measureCommonSampleGrid([],8,()=>null)).toThrow('invalid sample grid');
 expect(()=>measureCommonSampleGrid([0],1.5,()=>null)).toThrow('invalid sample grid');
});
