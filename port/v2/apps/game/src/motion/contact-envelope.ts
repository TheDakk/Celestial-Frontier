/** Retarget an otherwise refused stationary torso excursion. Successful clips
 * stay byte-identical. One constant gain scales complete curves; all limb,
 * head and secondary motion stays authored. Actual publication still runs the
 * unchanged contact and skin guards with the actual painted supports. */
import type {BodyCard} from './body-card.js';
import type {MotionPose,MotionTimeline} from './timeline.js';
import type {CreaturePoseV1,CreatureRigRecordV1} from '../creature-rig-types.js';
import {createFamilyContactSolver} from '../creature-rig-contact.js';
import {familyContract} from '../../../../tools/creature-animation/family-contracts.mjs';

const TORSO=new Set(['root','pelvis','spine','chest']),STEPS=128,GAIN_RESERVE=.9;
export interface ContactStanceEnvelope {
 readonly schema:'cf.motion.contact-envelope/v1';
 readonly torsoGain:number;readonly gainReserve:number;readonly samples:number;
}
export function stationaryContactEnvelope(card:BodyCard,tl:MotionTimeline,sample:(ms:number)=>MotionPose):ContactStanceEnvelope|null {
 if(card.template.id!=='quadruped'||!['hit','tame'].includes(tl.actionId)||!['land','amphibious'].includes(card.realm)||!card.contactGeometry||!card.recipeHash)return null;
 // Source-step compilation calls back into the timeline owner. This instrument
 // is deliberately restricted to the quadruped's fixed-support action contract.
 if(familyContract('quadruped').contactStance?.travel?.[tl.actionId])throw Error('Stationary envelope requires a fixed-support action');
 const record:CreatureRigRecordV1={template:card.template,recipeHash:card.recipeHash,geometry:card.contactGeometry,landmarks:card.landmarks,...card.anatomy?{anatomy:card.anatomy}:{}};
 let solver:ReturnType<typeof createFamilyContactSolver>;
 try{solver=createFamilyContactSolver(record);}catch{return null;} // retain invalid-source preview; runtime admission still refuses
 const poses=Array.from({length:STEPS+1},(_,i)=>{const ms=tl.durationMs*i/STEPS;return{ms,p:sample(ms)};});
 const fits=(gain:number):boolean=>{
  for(const {ms,p} of poses){
   const pose:Record<string,CreaturePoseV1[string]>={};
   for(const[j,rotation]of Object.entries(p.joints))if(j!=='root')pose[j]={rotation:rotation*(TORSO.has(j)?gain:1)};
   pose.root={rotation:p.root.rotation*gain,dx:p.root.dx*gain,dy:p.root.dy*gain};
   try{solver.resolve(pose,{actionId:tl.actionId,elapsedMs:ms,durationMs:tl.durationMs,weight:1,realm:card.realm});}catch{return false;}
  }return true;
 };
 if(fits(1))return null;
 if(!fits(0))return null; // no valid torso-only repair; do not manufacture a pose
 let low=0,high=1;
 for(let i=0;i<12;i++){const middle=(low+high)/2;if(fits(middle))low=middle;else high=middle;}
 const torsoGain=low*GAIN_RESERVE;
 if(!(torsoGain>0)||!fits(torsoGain))return null;
 return Object.freeze({schema:'cf.motion.contact-envelope/v1',torsoGain,gainReserve:GAIN_RESERVE,samples:STEPS+1});
}
