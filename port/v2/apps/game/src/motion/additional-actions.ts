/** Additional physical actions. Anatomy admission selects them; no species-specific keys.
 * Degrees and body-length displacement, using the existing Motion Kit phase timings. */
import type {KeyPose,MotionAction} from './actions.js';
import {tAt} from './timing.js';
type J=Record<string,number>;
const pose=(t:number,joints:J,dx:number,dy:number,ease:KeyPose['ease']):KeyPose=>({t,joints,root:{dx,dy},ease});
const attack=(verb:string,anticipation:J,launch:J,contact:J,recovery:J,dx:readonly number[],dy:readonly number[]):MotionAction=>Object.freeze({id:'melee:'+verb,family:'melee',loop:false,poses:[
 pose(tAt('melee','anticipation'),anticipation,dx[0]!,dy[0]!,'ease-in'),
 pose(tAt('melee','strike'),launch,dx[1]!,dy[1]!,'ease-out'),
 pose(tAt('melee','smear'),contact,dx[2]!,dy[2]!,'ease-out'),
 pose(tAt('melee','recovery',.55),recovery,dx[3]!,dy[3]!,'back-out'),pose(1,{},0,0,'ease-out')
]});
const forward=[-.025,.18,.20,.04],level=[.005,-.01,0,.003];
export const ADDITIONAL_ACTIONS:Readonly<Record<string,Readonly<Record<string,MotionAction>>>>=Object.freeze({
 quadruped:Object.freeze({
  // Lift and fold the foreleg, extend the hoof, then fold before planting.
  'melee:kick':attack('kick',{spine:-3,chest:-4,foreNearKnee:22,foreNearAnkle:-34,foreNearPaw:12},
   {chest:-5,neck:5,foreNearKnee:-44,foreNearAnkle:30,foreNearPaw:-8,hindNearKnee:8},
   {chest:-4,foreNearKnee:-52,foreNearAnkle:38,foreNearPaw:-12,tail0:8},
   {foreNearKnee:8,foreNearAnkle:-20,foreNearPaw:7},forward,level),
 }),
 'biped-bird':Object.freeze({
  // A planted leg and counterbalancing neck, not the wing-driven aerial rake.
  'melee:kick':attack('kick',{pelvis:4,spine:-5,legNearKnee:25,legNearAnkle:-35,legNearFoot:12,neck0:-6},
   {pelvis:-4,spine:-8,legNearKnee:-45,legNearAnkle:50,legNearFoot:-15,neck0:8,tailFan:8},
   {spine:-6,legNearKnee:-58,legNearAnkle:65,legNearFoot:-22,neck0:10,tailFan:10},
   {legNearKnee:12,legNearAnkle:-22,neck0:-3},forward,level),
 }),
 fish:Object.freeze({
  'melee:body':attack('body',{spine0:5,spine1:8,spine2:4,spine4:-8,caudal:-12},
   {head:-4,spine0:-4,spine1:-6,spine3:5,spine4:10,caudal:18,pectoralNear:10},
   {head:6,spine0:6,spine1:3,spine4:8,caudal:14},
   {head:-2,spine0:-3,spine3:-5,caudal:-10},[-.04,.28,.31,.06],[0,-.015,-.005,0]),
  // Tail motion travels down the spine; no fabricated jaw movement.
  'melee:tail':attack('tail',{spine2:-8,spine3:-12,spine4:-16,spine5:-18,caudal:-22},
   {spine1:3,spine2:8,spine3:12,spine4:18,spine5:22,caudal:28},
   {spine3:16,spine4:20,spine5:26,caudal:34,pectoralNear:-12},
   {spine3:-5,spine4:-8,spine5:-10,caudal:-14},[-.02,.10,.12,.02],[0,0,0,0]),
 }),
 insect:Object.freeze({'melee:body':attack('body',{thorax:-6,abdomen:10,head:-4},
  {thorax:8,abdomen:-10,head:5,legFrontNearKnee:-15},{thorax:12,abdomen:-6,head:8},
  {thorax:-3,abdomen:4},forward,level)}),
 arachnid:Object.freeze({'melee:body':attack('body',{cephalothorax:-5,abdomen:6,leg1NearKnee:15},
  {cephalothorax:8,abdomen:-8,leg1NearKnee:-20},{cephalothorax:10,abdomen:-6,leg1NearKnee:-25},
  {cephalothorax:-3,abdomen:3},forward,level)}),
 myriapod:Object.freeze({'melee:body':attack('body',{head:-4,seg0:-6,seg1:-10,seg2:-12,seg3:-8,seg4:6},
  {head:4,seg0:6,seg1:10,seg2:12,seg3:10,seg4:-6},{head:6,seg0:8,seg1:12,seg2:16,seg3:12},
  {seg0:-3,seg1:-4,seg2:-5,seg3:-3},forward,[0,0,0,0])}),
 radial:Object.freeze({'melee:body':attack('body',{centre:-5,bell:-10,arm0Seg0:8,arm3Seg0:-8},
  {centre:5,bell:12,arm0Seg0:-12,arm3Seg0:12},{centre:8,bell:15,arm0Seg0:-15,arm3Seg0:15},
  {centre:-2,bell:-4,arm0Seg0:4,arm3Seg0:-4},[-.02,.14,.16,.03],[0,-.025,0,.008])}),
});
