/** Record-driven planted contact constraint, separate from clip authoring.
 * Preserves each authored paw's perspective offset. No creature names/genes,
 * clocks, curve edits, or nearest-bone fitting. Flight passes through unchanged. */
import type {CreaturePoseV1,CreatureRigRecordV1} from './creature-rig.js';
import {GRAPH} from '../../../tools/creature-animation/quadruped-template.mjs';
import {composeAffine,rotationAround,transformPoint,IDENTITY_AFFINE,createTwoBoneChain,type Affine2} from '../../../tools/creature-animation/kinematics.js';
const point=(p:readonly [number,number])=>({x:p[0],y:p[1]});
const legs=['hindFar','foreFar','hindNear','foreNear'];
const angle=(a:{x:number;y:number},b:{x:number;y:number})=>Math.atan2(b.y-a.y,b.x-a.x);
const wrapped=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
export function poseMatrices(record:CreatureRigRecordV1,pose:CreaturePoseV1):Record<string,Affine2>{
 const matrices:Record<string,Affine2>={},length=Math.hypot(record.landmarks.chest![0]-record.landmarks.pelvis![0],record.landmarks.chest![1]-record.landmarks.pelvis![1]);
 for(const [name,parent]of [['root',null],...GRAPH] as Array<[string,string|null]>){
  const key=pose[name],pivot=point(record.landmarks[parent??'root']!);
  const local=key?rotationAround(pivot,key.rotation,{x:(key.dx??0)*length,y:(key.dy??0)*length}):IDENTITY_AFFINE;
  matrices[name]=parent?composeAffine(matrices[parent]!,local):local;
 }return matrices;
}
export function createQuadrupedContactSolver(record:CreatureRigRecordV1){
 if(record.template.id!=='quadruped')throw Error('Contact solver requires quadruped');
 const length=Math.hypot(record.landmarks.chest![0]-record.landmarks.pelvis![0],record.landmarks.chest![1]-record.landmarks.pelvis![1]);
 const chains=legs.map(id=>{
  const root=point(record.landmarks[id+'Root']!),joint=point(record.landmarks[id+'Knee']!),end=point(record.landmarks[id+'Ankle']!);
  const cross=(end.x-root.x)*(joint.y-root.y)-(end.y-root.y)*(joint.x-root.x),chain=createTwoBoneChain({root,joint,end,bend:cross<0?-1:1});
  return {id,root,joint,end,chain};
 });
 return {resolve(input:CreaturePoseV1,planted:boolean){
  if(!planted)return {pose:input,compression:0};
  const pose:Record<string,{rotation:number;dx?:number;dy?:number}>=Object.fromEntries(Object.entries(input).map(([j,k])=>[j,{...k}]));
  let matrices=poseMatrices(record,pose),compression=0;
  for(const c of chains){
   const root=transformPoint(matrices[c.id+'Root']!,c.root),dx=c.end.x-root.x,max=c.chain.lengths.upper+c.chain.lengths.lower;
   if(Math.abs(dx)>=max)throw Error('Planted contact outside horizontal reach');
   compression=Math.max(compression,c.end.y-Math.sqrt(max*max-dx*dx)+1e-10-root.y);
  }
  if(compression>length*.08)throw Error('Planted contact exceeds quadruped compression bound');
  if(compression>0){pose.root={rotation:0,...pose.root,dy:(pose.root?.dy??0)+compression/length};matrices=poseMatrices(record,pose);}
  for(const c of chains){
   const parent=matrices[c.id+'Root']!,root=transformPoint(parent,c.root),solved=c.chain.solve(root,c.end);
   const upper=wrapped(angle(solved.root,solved.joint)-angle(c.root,c.joint));
   const lower=wrapped(angle(solved.joint,solved.end)-angle(c.joint,c.end));
   pose[c.id+'Knee']={rotation:wrapped(upper-Math.atan2(parent[1],parent[0]))};
   pose[c.id+'Ankle']={rotation:wrapped(lower-upper)};pose[c.id+'Paw']={rotation:wrapped(-lower)};
  }
  return {pose,compression};
 }};
}
