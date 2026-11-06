/** Canonical supported primate faint. Lower onto bent supports within the actual painted support reach. Runtime paint/contact
 * guards and the reviewed editor constructor remain unchanged. */
import type {BodyCard} from './body-card.js';
import type {MotionAction} from './actions.js';
import type {MotionTimeline,MotionPose} from './timeline.js';
import type {CreatureRigRecordV1,CreaturePoseV1} from '../creature-rig-types.js';
import {createFamilyContactSolver} from '../creature-rig-contact.js';

const cache=new WeakMap<BodyCard,Map<string,{key:string;action:MotionAction;note:string|null}>>();
export function groundedPrimateFaintAction(card:BodyCard,action:MotionAction,base:MotionTimeline,sample:(tl:MotionTimeline,ms:number)=>MotionPose,compile:(a:MotionAction)=>MotionTimeline):{action:MotionAction;note:string|null} {
 const unchanged={action,note:null};
 if(card.template.id!=='primate'||action.id!=='faint'||!card.paintedContactSupports||!['land','amphibious'].includes(card.realm)||!card.contactGeometry||!card.recipeHash)return unchanged;
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
 // Lower the body onto its existing supports together with a coherent forward
 // lean. The contact solver bends those supports; both travel modes retain
 // their original reach, compression and joint-angle limits.
 if(!fits(base))return finish(action,null);
 const lowered=(gain:number):MotionAction=>({...action,poses:action.poses.map(p=>({...p,joints:{...p.joints,root:35*gain*p.t},root:{dx:0,dy:.20*gain*p.t}}))});
 let low=0,high=1;
 if(fits(compile(lowered(high))))low=high;
 else for(let i=0;i<12;i++){const mid=(low+high)/2;if(fits(compile(lowered(mid))))low=mid;else high=mid;}
 const gain=low===1?low:low*.9,drop=.20*gain,candidate=lowered(gain);
 if(drop<.05||!fits(compile(candidate)))return finish(action,null);
 const frozen=Object.freeze({...candidate,poses:Object.freeze(candidate.poses.map(p=>Object.freeze({...p,joints:Object.freeze({...p.joints}),root:Object.freeze({...p.root})})))});
 return finish(frozen,'grounded-primate:supported-faint-drop='+drop);
}
