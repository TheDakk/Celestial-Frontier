/** Component-relative candidate curves; no species-name or seed branches.
 * These do not grant an animal a physical weapon or prove a painted fit. */
import {specializedTemplate} from '../../../../tools/creature-animation/specialized-templates.mjs';
import {tAt} from './timing.js';
import {type KeyPose,type MotionAction} from './actions.js';
const P=(t:number,joints:Record<string,number>,dx=0,dy=0):KeyPose=>({t,ease:'sine-in-out',joints,root:{dx,dy}});
export function specializedActions(id:string):Readonly<Record<string,MotionAction>>|undefined{
 const spec=specializedTemplate(id);if(!spec)return undefined;
 const pose=(wave:number,effort:number,locomote=false)=>{
  const j:Record<string,number>={};
  for(const [role,names]of Object.entries(spec.roles))for(const[name,index]of names.map((n,i)=>[n,i]as const)){
   j[name]=role==='legs'?(locomote?Math.sin(index*.9+wave)*effort*.25:0):role==='valves'?(index%2?-1:1)*effort:
    role==='claws'?-effort:role==='reach'?effort*.5:role==='wave'?Math.sin(index*.65+wave)*effort:
    role==='sensors'?Math.sin(wave+index)*effort*.65:Math.sin(wave)*effort*.3;
  }
  for(const rigid of spec.rigid)j[rigid]=0;
  return j;
 };
 const action=(id:string,family:string,effort:number,loop=false,travel=0):MotionAction=>{
  const times=family==='melee'?[tAt('melee','anticipation'),tAt('melee','strike'),tAt('melee','smear')]:family==='cast'?[tAt('cast','rise'),tAt('cast','hold'),tAt('cast','release')]:family==='hit'?[tAt('hit','recoil'),tAt('hit','stagger'),tAt('hit','settle',.5)]:[.25,.5,.75];
  const loaded=(wave:number,gain:number)=>({...pose(wave,gain,family==='approach'),...(!spec.anchored&&spec.legs.length&&['hit','faint'].includes(family)?{root:family==='faint'?0:-Math.sin(wave)*3}:{})});
  return {id,family,loop,poses:[P(times[0]!,loaded(0,effort*.6)),P(times[1]!,loaded(Math.PI/2,effort),spec.anchored?0:travel,(!spec.anchored&&spec.legs.length&&family==='faint')?.015:0),P(times[2]!,loaded(Math.PI,effort),spec.anchored?0:travel*.35),P(1,{})]};
 };
 const actions=[action('idle','idle',3,true),action('alert','alert',7),...spec.gaits.map(g=>action('approach:'+g,'approach',g==='anchored'?4:12,true)),action('cast','cast',14,false),action('hit','hit',10),action('dodge','dodge',8,false,spec.anchored?0:-.08),action('faint','faint',5),action('victory','victory',12),action('tame','tame',5),action('feed','feed',6)];
 // Physical contacts require source-observed parts/capabilities in the selector.
 if(id==='crustacean-clawed')actions.push(action('melee:pinch','melee',25,false,.08));
 if(id==='brachyuran'){
  const pincerJoints=spec.roles.claws;if(!pincerJoints?.length)throw Error('Missing pincer contract');
  const claws=(closure:number)=>Object.fromEntries(pincerJoints.map(j=>[j,closure]));
  actions.push({id:'melee:pinch',family:'melee',loop:false,poses:[P(tAt('melee','anticipation'),claws(8)),P(tAt('melee','strike'),claws(-25)),P(tAt('melee','smear'),claws(-25)),P(1,{})]});
 }
 return Object.freeze(Object.fromEntries(actions.map(a=>[a.id,a])));
}
