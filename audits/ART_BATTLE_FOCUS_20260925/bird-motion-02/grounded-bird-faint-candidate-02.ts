/** Author canonical grounded bird reactions to the observed leg span. This does
 * not admit a pose: the actual painted contact and skin guards still run. The
 * editor/override constructor does not call this canonical-action selector. */
import type {BodyCard} from './body-card.js';
import type {MotionAction} from './actions.js';
import type {MotionTimeline,MotionPose} from './timeline.js';
import type {CreatureRigRecordV1,CreaturePoseV1} from '../creature-rig.js';
import {createFamilyContactSolver} from '../creature-rig-contact.js';
import {familyContract,familyContactChains} from '../../../../tools/creature-animation/family-contracts.mjs';
const cache=new WeakMap<BodyCard,Map<string,{key:string;action:MotionAction;note:string|null}>>();
const freezeAction=(a:MotionAction):MotionAction=>Object.freeze({...a,poses:Object.freeze(a.poses.map(p=>Object.freeze({...p,joints:Object.freeze({...p.joints}),root:Object.freeze({...p.root})})))});
export function groundedBirdAction(card:BodyCard,action:MotionAction,base:MotionTimeline,sample:(tl:MotionTimeline,ms:number)=>MotionPose,compile:(a:MotionAction)=>MotionTimeline):{action:MotionAction;note:string|null} {
 const unchanged={action,note:null};
 if(card.template.id!=='biped-bird'||!['dodge','hit','tame','faint'].includes(action.id)||!['land','amphibious'].includes(card.realm)||!card.contactGeometry||!card.recipeHash)return unchanged;
 const key=JSON.stringify({card,action,timeline:{...base,seed:0,hash:''}}),entries=cache.get(card)??new Map(),prior=entries.get(action.id);
 if(prior?.key===key)return prior;
 const finish=(a:MotionAction,note:string|null)=>{const value={key,action:a,note};entries.set(action.id,value);cache.set(card,entries);return value;};
 const definition=familyContract('biped-bird');if(definition.contactStance?.travel?.[action.id])return finish(action,null);
 const record:CreatureRigRecordV1={template:card.template,recipeHash:card.recipeHash,geometry:card.contactGeometry,landmarks:card.landmarks,...card.anatomy?{anatomy:card.anatomy}:{}};
 let solver:ReturnType<typeof createFamilyContactSolver>;
 try{solver=createFamilyContactSolver(record);}catch{return finish(action,null);}
 const fits=(tl:MotionTimeline)=>{
  for(let i=0;i<=128;i++){const ms=tl.durationMs*i/128,p=sample(tl,ms),pose:Record<string,CreaturePoseV1[string]>={};
   for(const[j,rotation]of Object.entries(p.joints))pose[j]={rotation};pose.root={rotation:p.root.rotation,dx:p.root.dx,dy:p.root.dy};
   try{
    const phase={actionId:action.id,elapsedMs:ms,durationMs:tl.durationMs,weight:1,realm:card.realm};solver.resolve(pose,phase);
    // The stage owns horizontal travel and removes authored root dx. Faint
    // must hold a valid pose under that explicit protocol as well as alone.
    if(action.id==='faint')solver.resolve(pose,{...phase,travel:'stage'});
   }catch{return false;}
  }return true;
 };
 if(fits(base))return finish(action,null);
 if(action.id==='faint'){
  const torso=new Set(['root','pelvis','spine','chest']);
  const withGain=(gain:number)=>freezeAction({...action,poses:action.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,torso.has(j)?v*gain:v])),root:{dx:0,dy:p.root.dy*gain}}))});
  // One complete authored curve, including a neutral horizontal root, must
  // fit both solo and stage ownership. Keep the original if no repair exists.
  if(!fits(compile(withGain(0))))return finish(action,null);
  let low=0,high=1;for(let i=0;i<12;i++){const middle=(low+high)/2;if(fits(compile(withGain(middle))))low=middle;else high=middle;}
  const gain=low*.99,candidate=withGain(gain);
  return gain>0&&fits(compile(candidate))?finish(candidate,'grounded-bird:planted-faint:'+gain):finish(action,null);
 }
 const distance=(a:string,b:string)=>{const p=card.landmarks[a],q=card.landmarks[b];return p&&q?Math.hypot(p[0]-q[0],p[1]-q[1]):NaN;};
 const length=Math.min(...familyContactChains(definition).map((c:{hip:string;knee:string;end:string})=>distance(c.hip,c.knee)+distance(c.knee,c.end))),ratio=length/card.bodyLength;
 if(!Number.isFinite(ratio)||ratio<=0)return finish(action,null);
 const candidate=freezeAction({...action,rootUnit:'body',poses:action.poses.map((p,i)=>action.id==='dodge'?{
  ...p,joints:i===0?{neck0:15,neck1:10,head:5}:{},root:i===0?{dx:-.12*ratio,dy:.06*ratio}:{dx:0,dy:0},
 }:{...p,root:{dx:p.root.dx*ratio,dy:p.root.dy*ratio}})});
 if(fits(compile(candidate)))return finish(candidate,action.id==='dodge'?'grounded-bird:neck-duck':'grounded-bird:leg-span-translation');
 // A short-legged recoil remains readable in its neck/head/tail while the
 // torso stays neutral. This is one authored complete curve, never a per-frame
 // clamp, shifted foot target or suppression of a publication refusal.
 if(action.id==='hit'){
  const recoil=freezeAction({...candidate,poses:candidate.poses.map(p=>({...p,joints:{...p.joints,root:0,pelvis:0,spine:0,chest:0},root:{dx:0,dy:0}}))});
  if(fits(compile(recoil)))return finish(recoil,'grounded-bird:neck-recoil');
 }
 return finish(action,null);
}
