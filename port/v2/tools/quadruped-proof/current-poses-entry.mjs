/** Offline sampler of the same current producer and contact owner as the native proof.
 * Planning and pixel bounds are extracted verbatim from parts-motion-entry.mjs
 * by export-current-poses; no saved pose is an input. */
import {compileBodyCard,createGsapPlayer} from 'cf-proof/motion/index.ts';
import {sampleTurn} from 'cf-proof/battle2/choreography.ts';
import {parseEffectSequenceAnchors} from 'cf-proof/effects/anchors.ts';
import {createTurnPoseSampler,turnPoseTimes} from './turn-performance.mjs';
import {createTurnContactSampler} from './turn-contact-transition.mjs';
import {createQuadrupedContactSolver} from '../../apps/game/src/creature-rig-contact.ts';
import {keyAndDespill} from '../../../../tools/local-image-generation/kit-contact-math.mjs';
import {bounds,createMakePlan,W,H} from 'current-native-plan';

export function exportCurrentSubject({id,record,paint,platypus,genome,arena,anchorDocument}){
 const parsed=parseEffectSequenceAnchors(anchorDocument);if(!parsed.ok)throw Error('Effect anchors: '+parsed.reason);
 const card=compileBodyCard(record,id==='procedural'?genome:undefined),box=bounds(paint.rgba,paint.width,paint.height);
 if(!(box.width>0&&box.height>0))throw Error('Empty subject keyed alpha');
 const s={id,record,card,box,scale:H*.42/box.height};
 const keyed=keyAndDespill(platypus.rgba,platypus.width,platypus.height),pb=bounds(keyed.rgba,platypus.width,platypus.height);
 if(!(pb.width>0&&pb.height>0))throw Error('Empty opponent keyed alpha');
 const pl={canvas:{width:platypus.width,height:platypus.height}},ps=H*.252/(pb.height*pl.canvas.height);
 const makePlan=createMakePlan({arena,anchors:parsed.anchors,pb,pl,ps}),plans=[makePlan(s,false),makePlan(s,true)];
 const sampler=createTurnPoseSampler(createGsapPlayer),solver=createQuadrupedContactSolver(record),contact=createTurnContactSampler({plans,motionSampler:sampler,solver});
 const resolve=atMs=>{
  if(atMs===null)return {atMs,pose:{},role:'rest',planted:true,compression:0};
  if(!Number.isFinite(atMs)||atMs<0||atMs>10000)throw Error('Invalid proof sample time');
  const reverse=atMs>=5000,t=reverse?atMs-5000:atMs,plan=plans[reverse?1:0];
  const solved=contact.resolve(atMs),pose=structuredClone(solved.pose),planted=solved.planted;
  for(const[name,key]of Object.entries(pose)){
   if(!Object.hasOwn(record.landmarks,name))throw Error('Unknown pose joint '+name);
   if(![key.rotation,key.dx??0,key.dy??0].every(Number.isFinite))throw Error('Nonfinite pose joint '+name);
  }
  return {atMs,role:reverse?'target':'attacker',phase:sampleTurn(plan,t).phase,planted,supportWeight:solved.supportWeight,compression:solved.compression,pose};
 };
 try{
  // Preserve the native gate's named-observation then dense-seek order.
  const namedPoses=Object.fromEntries(Object.entries(turnPoseTimes(plans)).map(([name,ms])=>[name,resolve(ms)]));
  const dense=Array.from({length:1201},(_,index)=>({index,...resolve(index*10000/1200)}));
  return {schema:'cf.current-resolved-poses/v1',id,recordRecipeHash:record.recipeHash,card,geometry:{width:W,height:H,subjectBounds:box,subjectScale:s.scale,opponentBounds:pb,opponentScale:ps},plans,namedPoses,dense};
 }finally{sampler.dispose();}
}
