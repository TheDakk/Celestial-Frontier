import fs from 'node:fs';
import {it,expect} from 'vitest';
import {compileBodyCard} from './body-card.js';
import {withPaintedContactSupports} from './painted-supports.js';
import {actionsFor} from './family-actions.js';
import {buildTimeline,buildActionTimeline,sampleTimeline,type MotionTimeline} from './timeline.js';
import {createSkeletonPoseProgram} from '../../../../tools/creature-animation/skeleton-pose.mjs';
import {familyContractForRecord} from '../../../../tools/creature-animation/family-contracts.mjs';
import {groundedPrimateVictoryAction} from './grounded-primate-victory.js';
const root=new URL('../../../../../../',import.meta.url),fit='audits/C215_PROGRAM_20261009/phase4/marmoset-reference/fit01/',read=(n:string)=>JSON.parse(fs.readFileSync(new URL(fit+n,root),'utf8'));
const record=read('record.json'),binding=read('binding.json'),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding);
const action=actionsFor('primate',card.anatomy)!.victory!;
it('keeps the actual Marmoset head upright through the complete celebration, with a visible head gesture and supported arms',()=>{
 const before=buildActionTimeline(card,action,card.identity.seed),after=buildTimeline(card,'victory',card.identity.seed),program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks);
 const maxHeadAngle=(t:MotionTimeline)=>Math.max(...Array.from({length:121},(_,i)=>{const p=sampleTimeline(t,t.durationMs*i/120);const pose={...Object.fromEntries(Object.entries(p.joints).map(([j,rotation])=>[j,{rotation}])),root:{rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy}};const m=program.evaluate(pose).head!;return Math.abs(Math.atan2(m[1],m[0])*180/Math.PI);}));
 expect(maxHeadAngle(before)).toBeGreaterThan(45);expect(maxHeadAngle(after)).toBeLessThan(15);
 expect(after.tracks.armNearShoulder!.every(k=>k.value===0)).toBe(true);expect(after.tracks.head!.some(k=>Math.abs(k.value)>.001)).toBe(true);
 expect(after.phases).toEqual(before.phases);expect(after.limitsRad).toEqual(before.limitsRad);expect(after.durationMs).toBe(before.durationMs);
});
it('preserves unpainted, airborne, other-family and non-victory motion without mutating source poses',()=>{
 const snapshot=structuredClone(action),{paintedContactSupports:_,...unpainted}=card;
 expect(groundedPrimateVictoryAction(unpainted,action)).toBe(action);
 expect(groundedPrimateVictoryAction({...card,realm:'aerial'},action)).toBe(action);
 expect(groundedPrimateVictoryAction({...card,template:{...card.template,id:'quadruped'}},action)).toBe(action);
 for(const a of Object.values(actionsFor('primate',card.anatomy)!))if(a.id!=='victory')expect(groundedPrimateVictoryAction(card,a)).toBe(a);
 groundedPrimateVictoryAction(card,action);expect(action).toEqual(snapshot);
});
