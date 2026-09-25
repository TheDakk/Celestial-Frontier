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
