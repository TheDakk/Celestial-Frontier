/** Component-relative candidate curves; no species-name or seed branches.
 * These do not grant an animal a physical weapon or prove a painted fit. */
import {specializedTemplate} from '../../../../tools/creature-animation/specialized-templates.mjs';
import {tAt} from './timing.js';
import {type KeyPose,type MotionAction} from './actions.js';
const P=(t:number,joints:Record<string,number>,dx=0,dy=0):KeyPose=>({t,ease:'sine-in-out',joints,root:{dx,dy}});
export function specializedActions(id:string):Readonly<Record<string,MotionAction>>|undefined{
 const spec=specializedTemplate(id);if(!spec)return undefined;
 const pose=(wave:number,effort:number)=>{
  const j:Record<string,number>={};
  for(const [role,names]of Object.entries(spec.roles))for(const[name,index]of names.map((n,i)=>[n,i]as const)){
   j[name]=role==='legs'?Math.sin(index*.9+wave)*effort:role==='valves'?(index%2?-1:1)*effort:
    role==='claws'?-effort:role==='reach'?effort*.5:role==='wave'?Math.sin(index*.65+wave)*effort:
    role==='sensors'?Math.sin(wave+index)*effort*.65:Math.sin(wave)*effort*.3;
  }
  for(const rigid of spec.rigid)j[rigid]=0;
  return j;
 };
 const action=(id:string,family:string,effort:number,loop=false,travel=0):MotionAction=>{
  const times=family==='melee'?[tAt('melee','anticipation'),tAt('melee','strike'),tAt('melee','smear')]:family==='cast'?[tAt('cast','rise'),tAt('cast','hold'),tAt('cast','release')]:family==='hit'?[tAt('hit','recoil'),tAt('hit','stagger'),tAt('hit','settle',.5)]:[.25,.5,.75];
  return {id,family,loop,poses:[P(times[0]!,pose(0,effort*.6)),P(times[1]!,pose(Math.PI/2,effort),spec.anchored?0:travel),P(times[2]!,pose(Math.PI,effort),spec.anchored?0:travel*.35),P(1,{})]};
 };
 const actions=[action('idle','idle',3,true),action('alert','alert',7),...spec.gaits.map(g=>action('approach:'+g,'approach',g==='anchored'?4:12,true)),action('cast','cast',14,false),action('hit','hit',10),action('dodge','dodge',8,false,spec.anchored?0:-.08),action('faint','faint',5),action('victory','victory',12),action('tame','tame',5),action('feed','feed',6)];
 // Physical contacts require source-observed parts/capabilities in the selector.
 if(id==='crustacean-clawed'||id==='brachyuran')actions.push(action('melee:pinch','melee',25,false,.08));
 return Object.freeze(Object.fromEntries(actions.map(a=>[a.id,a])));
}
