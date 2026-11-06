import type {MotionAction} from './actions.js';
import type {BodyCard} from './body-card.js';

/** A serpent's skeleton hangs its trunk TAIL-WARD from a neck root: head->root, seg0->root, seg1->seg0 ... seg9 (the
 * serpent template graph; every painted record puts `root` just behind the head). Each seg rotates about its PARENT's
 * landmark, so the authored family victory (seg0 -35, seg1 -30, seg2 -18, seg3 -6) swings the whole trailing body DOWN
 * about the neck (cumulative -89 deg): the C243 Boa/Mountain Viper films hang ~0.9 body lengths of trunk below the
 * ground line, under the opaque near plate and past the frame bottom (C262 axial-foreground proof).
 *
 * The rear and authored root lift are kept; victory head/jaw turns are bounded below for dry and aquatic serpents.
 * The trunk now LANDS: seg0 slopes the
 * body from the lifted neck back down to its rest line and seg(m+1) counter-rotates by the same angle, so seg(m+1)..
 * seg9 lie where they rested. m and the angle are solved from this card's own landmarks so the descent equals the
 * authored lift (root dy x body axis). Victories and aquatic hits/faints cap projected head/jaw turns at 12/4 deg so an
 * already-open painted gape does not curl upright or hang vertically. Limits, timing, easing, other actions and families are untouched. */
export const SERPENT_VICTORY_NOTE = 'serpent:landing-victory-v1';
const SEGS = Array.from({length:10},(_,k)=>'seg'+k);
const MAX_DEG = 38; // inside the template's +-45 seg limit with the idle layer (+-4 deg) on top
export function serpentVictoryAction(card:BodyCard,action:MotionAction):MotionAction{
 const landed=serpentLandingAction(card,action);
 // Dry Cobra's victory inverted its already-painted head. Bound only these
 // nominal head/jaw keys after the existing landing, including unchanged poses.
 if(card.template.id!=='serpent'||card.realm==='aquatic'||action.id!=='victory')return landed;
 return {...landed,poses:landed.poses.map(p=>{
  const joints:Record<string,number>={...p.joints};
  for(const [joint,cap]of [['head',12],['jaw',4]]as const){
   const g=(card.amplitudeProfile?.scales[joint]??1)*(card.projectionScales?.[joint]??1)*(card.projectionSigns?.[joint]??1);
   if(g!==0&&joints[joint]!==undefined)joints[joint]=Math.max(-cap,Math.min(cap,joints[joint]!*g))/g;
  }
  return {...p,joints};
 })};
}
function serpentLandingAction(card:BodyCard,action:MotionAction):MotionAction{
 // Reactions do not have a victory landing/root lift. Bound their painted gape
 // independently so the losing eel's held faint cannot leave its lower lip vertical.
 if(card.template.id==='serpent'&&card.realm==='aquatic'&&['hit','faint'].includes(action.id))return {...action,poses:action.poses.map(p=>{
  const joints:Record<string,number>={...p.joints};
  for(const [joint,cap]of [['head',12],['jaw',4]]as const){
   const g=(card.amplitudeProfile?.scales[joint]??1)*(card.projectionScales?.[joint]??1)*(card.projectionSigns?.[joint]??1);
   if(g!==0&&joints[joint]!==undefined)joints[joint]=Math.max(-cap,Math.min(cap,joints[joint]!*g))/g;
  }
  return {...p,joints};
 })};
 if(action.id!=='victory'||card.template.id!=='serpent')return action;
 const L=card.landmarks as Readonly<Record<string,readonly [number,number]>>,r=L.root,a=L.seg0,b=L.seg9;
 if(!r||!a||!b||SEGS.some(j=>!L[j]))return action;
 const axis=Math.hypot(b[0]-a[0],b[1]-a[1]),unit=action.rootUnit==='motion-scale'?card.scaleLength/card.bodyLength:1;
 // effective on-screen rotation = authored deg x amplitude x projection scale x projection sign (buildActionTimeline)
 const gain=(j:string)=>(card.amplitudeProfile?.scales[j]??1)*(card.projectionScales?.[j]??1)*(card.projectionSigns?.[j]??1);
 // the vertical drop of seg_k's landmark when seg0 turns the trunk by -deg about the root (screen y down)
 const drop=(k:number,deg:number)=>{const p=L['seg'+k]!,t=-deg*Math.PI/180,x=p[0]-r[0],y=p[1]-r[1];return x*Math.sin(t)+y*Math.cos(t)-y;};
 const solve=(lift:number)=>{
  for(let m=0;m<8;m++){
   if(drop(m,MAX_DEG)<lift)continue;
   let lo=0,hi=MAX_DEG;for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(drop(m,mid)<lift)lo=mid;else hi=mid;}
   return {m,deg:(lo+hi)/2};
  }
  return null;
 };
 if(gain('seg0')===0)return action;
 const poses=action.poses.map(p=>{
  const lift=-p.root.dy*unit*axis;if(!(lift>0))return p;
  const s=solve(lift);if(!s)return p;
  const joints:Record<string,number>={...p.joints};for(const j of SEGS)delete joints[j];
  const after='seg'+(s.m+1),g0=gain('seg0'),g1=gain(after);if(g1===0)return p;
  joints.seg0=-s.deg/g0;joints[after]=s.deg/g1;
  // Aquatic axial paintings already author an open gape. Preserve the rear without
  // curling the rostrum or throwing the lower jaw through another large rotation.
  if(card.realm==='aquatic')for(const [joint,cap]of [['head',12],['jaw',4]]as const){
   const g=gain(joint);if(g!==0&&joints[joint]!==undefined)joints[joint]=Math.max(-cap,Math.min(cap,joints[joint]!*g))/g;
  }
  return {...p,joints};
 });
 return {...action,poses};
}
