/** Compile a continuous faint excursion from observed leg geometry.
 * This is motion authoring, not contact admission: one fixed torso gain covers
 * the entire clip. The ordinary contact/skin guards still judge every frame.
 * No species lookup, per-creature clip, changed foot target or relaxed limit. */
import type {BodyCard} from './body-card.js';
import type {MotionPose,MotionTimeline} from './timeline.js';
import type {ContactStanceEnvelope} from './contact-envelope.js';
import {familyContract,familyContactChains} from '../../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../../tools/creature-animation/skeleton-pose.mjs';
import {createTwoBoneChain,transformPoint,type Point2} from '../../../../tools/creature-animation/kinematics.js';

const TORSO = new Set(['root','pelvis','spine','chest','thorax']);
/** Author below the contact ceiling to leave room for the painted-foot offset.
 * This is a smaller motion target, never a substitute for the real support gate. */
const ANGLE_RESERVE = .9;
const SAMPLES = 128;
const point = ([x,y]:readonly number[]):Point2 => ({x:x!,y:y!});
const angle = (a:Point2,b:Point2):number => Math.atan2(b.y-a.y,b.x-a.x);
const wrapped = (v:number):number => Math.atan2(Math.sin(v),Math.cos(v));
export interface StanceEnvelope {
 readonly schema:'cf.motion.stance-envelope/v1';
 readonly torsoGain:number; readonly angleReserve:number; readonly samples:number;
}
export function faintStanceEnvelope(card:BodyCard,tl:MotionTimeline,sample:(ms:number)=>MotionPose):StanceEnvelope|null {
 if(!['quadruped','insect','biped-bird'].includes(card.template.id)||tl.actionId!=='faint'||(card.realm!=='land'&&card.realm!=='amphibious'))return null;
 const base=familyContract(card.template.id),parents=new Map(base.graph),contactChains=familyContactChains(base);
 // Hidden ears/tails do not remove a planted leg. A different leg graph keeps
 // its existing motion and must pass its own unchanged runtime guards.
 if(card.parts.some(p=>parents.get(p.joint)!==p.parent)||contactChains.some(c=>[c.hip,c.knee,c.end,...c.terminal?[c.terminal]:[]].some(j=>!card.landmarks[j])))return null;
 const definition={...base,graph:card.parts.map(p=>[p.joint,p.parent] as const)};
 const program=createSkeletonPoseProgram(definition,card.landmarks),limits=definition.contactLimitsDeg??definition.limitsDeg;
 const observed=contactChains.map(c=>{
  const root=point(card.landmarks[c.hip]!),joint=point(card.landmarks[c.knee]!),end=point(card.landmarks[c.end]!);
  const cross=(end.x-root.x)*(joint.y-root.y)-(end.y-root.y)*(joint.x-root.x);
  return {...c,root,joint,endPoint:end,cross};
 });
 // A straight source has no declared bend side. Preserve its existing preview
 // timeline; the unchanged contact admission still refuses that source.
 if(observed.some(c=>Math.abs(c.cross)<1e-12))return null;
 const chains=observed.map(c=>({...c,chain:createTwoBoneChain({root:c.root,joint:c.joint,end:c.endPoint,bend:c.cross<0?-1:1})}));
 const poses=Array.from({length:SAMPLES+1},(_,i)=>sample(tl.durationMs*i/SAMPLES));
 const fits=(gain:number):boolean=>{
  for(const p of poses){
   const pose:Record<string,{rotation:number;dx?:number;dy?:number}>={};
   for(const j of TORSO)if(card.landmarks[j])pose[j]={rotation:(p.joints[j]??0)*gain};
   pose.root={rotation:(p.joints.root??0)*gain,dx:p.root.dx*gain,dy:p.root.dy*gain};
   const matrices=program.evaluate(pose);
   for(const c of chains){
    const parent=matrices[c.hip]!,root=transformPoint(parent,c.root),distance=Math.hypot(c.endPoint.x-root.x,c.endPoint.y-root.y);
    if(distance<Math.abs(c.chain.lengths.upper-c.chain.lengths.lower)||distance>c.chain.lengths.upper+c.chain.lengths.lower||distance<.000001)return false;
    const solved=c.chain.solve(root,c.endPoint),upper=wrapped(angle(solved.root,solved.joint)-angle(c.root,c.joint)),lower=wrapped(angle(solved.joint,solved.end)-angle(c.joint,c.endPoint));
    const rotations:[string,number][]=[[c.knee,wrapped(upper-Math.atan2(parent[1],parent[0]))],[c.end,wrapped(lower-upper)]];
    if(c.terminal)rotations.push([c.terminal,wrapped(-lower)]);
    for(const[j,value]of rotations){const bound=limits[j]!,degrees=value*180/Math.PI;if(degrees<bound.min*ANGLE_RESERVE||degrees>bound.max*ANGLE_RESERVE)return false;}
   }
  }
  return true;
 };
 // Preserve accepted motion bit-for-bit when the complete original excursion
 // fits. Do not clamp individual frames or move any declared support point.
 if(fits(1))return null;
 if(!fits(0))throw Error('Motion envelope: rest geometry has no planted faint envelope');
 let low=0,high=1;
 for(let i=0;i<12;i++){const middle=(low+high)/2;if(fits(middle))low=middle;else high=middle;}
 if(low===0)throw Error('Motion envelope: no nonzero planted faint excursion');
 return Object.freeze({schema:'cf.motion.stance-envelope/v1',torsoGain:low,angleReserve:ANGLE_RESERVE,samples:SAMPLES+1});
}
/** Scaling a complete curve preserves its timing/easing and continuity. */
export function applyStanceEnvelope(tl:MotionTimeline,envelope:StanceEnvelope|ContactStanceEnvelope):Omit<MotionTimeline,'hash'> {
 const {hash:_,...body}=tl,gain=envelope.torsoGain;
 return {...body,stanceEnvelope:envelope,
  tracks:Object.fromEntries(Object.entries(tl.tracks).map(([j,keys])=>[j,TORSO.has(j)?keys.map(k=>({...k,value:k.value*gain})):keys])),
  root:{dx:tl.root.dx.map(k=>({...k,value:k.value*gain})),dy:tl.root.dy.map(k=>({...k,value:k.value*gain}))}};
}
