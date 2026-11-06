/** Canonical painted primate walking, approach and punch excursions. A constant torso gain changes the authored
 * curve only after the original contact probe refuses. Runtime paint/contact
 * guards and the reviewed editor constructor remain unchanged. */
import type {BodyCard} from './body-card.js';
import type {MotionAction} from './actions.js';
import type {MotionTimeline,MotionPose} from './timeline.js';
import type {CreatureRigRecordV1,CreaturePoseV1} from '../creature-rig-types.js';
import {createFamilyContactSolver} from '../creature-rig-contact.js';
const TORSO=new Set(['root','pelvis','spine','chest']);
const cache=new WeakMap<BodyCard,Map<string,{key:string;action:MotionAction;note:string|null}>>();
export function groundedPrimateAction(card:BodyCard,action:MotionAction,base:MotionTimeline,sample:(tl:MotionTimeline,ms:number)=>MotionPose,compile:(a:MotionAction)=>MotionTimeline):{action:MotionAction;note:string|null} {
 const unchanged={action,note:null};
 if(card.template.id!=='primate'||!['approach:walk','tame','melee:punch'].includes(action.id)||!card.paintedContactSupports||!['land','amphibious'].includes(card.realm)||!card.contactGeometry||!card.recipeHash)return unchanged;
 const key=JSON.stringify({card,action,timeline:{...base,seed:0,hash:''}}),entries=cache.get(card)??new Map(),prior=entries.get(action.id);
 if(prior?.key===key)return prior;
 const finish=(a:MotionAction,note:string|null)=>{const result={key,action:a,note};entries.set(action.id,result);cache.set(card,entries);return result;};
 const record:CreatureRigRecordV1={template:card.template,recipeHash:card.recipeHash,geometry:card.contactGeometry,landmarks:card.landmarks,...card.anatomy?{anatomy:card.anatomy}:{}};
 let solver:ReturnType<typeof createFamilyContactSolver>;
 try{solver=createFamilyContactSolver(record,card.paintedContactSupports.supports);}catch{return finish(action,null);}
 const fits=(tl:MotionTimeline)=>{
  for(let i=0;i<=128;i++){const ms=tl.durationMs*i/128,p=sample(tl,ms),pose:Record<string,CreaturePoseV1[string]>={};
   for(const[j,rotation]of Object.entries(p.joints))pose[j]={rotation};pose.root={rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy};
   try{for(const travel of ['solver','stage'] as const)solver.resolve(pose,{actionId:action.id,elapsedMs:ms,durationMs:tl.durationMs,weight:1,realm:card.realm,travel});}catch{return false;}
  }return true;
 };
 if(fits(base))return finish(action,null);
 const scaled=(gain:number):MotionAction=>({...action,poses:action.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,v*(TORSO.has(j)||/^leg(?:Near|Far)/.test(j)?gain:1)])),root:{dx:p.root.dx*gain,dy:p.root.dy*gain}}))});
 const raisedGait=()=>{
  if(action.id!=='approach:walk')return finish(action,null);
  const half=scaled(.5),raised={...half,poses:half.poses.map(p=>({...p,root:{...p.root,dy:p.root.dy-(p.t===1?0:.04)}}))};
  if(!fits(compile(raised)))return finish(action,null);
  return finish(Object.freeze({...raised,poses:Object.freeze(raised.poses.map(p=>Object.freeze({...p,joints:Object.freeze({...p.joints}),root:Object.freeze({...p.root})})))}),'grounded-primate:raised-half-stride');
 };
 if(!fits(compile(scaled(0))))return raisedGait();
 let low=0,high=1;
 for(let i=0;i<12;i++){const mid=(low+high)/2;if(fits(compile(scaled(mid))))low=mid;else high=mid;}
 // Reserve excursion, never increase a contact/skin allowance. The complete
 // neck/head/arm expression, secondary curves and timing stay intact. Torso and
 // leg excursion share one constant gain; reject gains below a quarter stride.
 const gain=low*.9,candidate=scaled(gain);
 if(gain<.25||!fits(compile(candidate)))return raisedGait();
 const frozen=Object.freeze({...candidate,poses:Object.freeze(candidate.poses.map(p=>Object.freeze({...p,joints:Object.freeze({...p.joints}),root:Object.freeze({...p.root})})))});
 return finish(frozen,'grounded-primate:painted-torso-gain='+gain);
}
