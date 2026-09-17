/** Record-driven planted contact constraint, separate from clip authoring.
 * Preserves each authored paw's perspective offset. No creature names/genes,
 * clocks, curve edits, or nearest-bone fitting. Flight passes through unchanged. */
import type {CreaturePoseV1,CreatureRigRecordV1} from './creature-rig.js';
import {familyContractForRecord,familyContactChains} from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
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

export interface ContactPhase {readonly actionId:string;readonly elapsedMs:number;readonly durationMs:number;readonly realm?:string;readonly weight?:number;}
/** Source graph contacts for stance and alternating support. Elapsed phase is
 * explicit and replayable; rendering cadence is not solver state. */
export function createFamilyContactSolver(record:CreatureRigRecordV1){
 const template=familyContractForRecord(record),program=createSkeletonPoseProgram(template,record.landmarks);
 const chains=familyContactChains(template).map(c=>{
  const root=point(record.landmarks[c.hip]!),joint=point(record.landmarks[c.knee]!),end=point(record.landmarks[c.end]!);
  const cross=(end.x-root.x)*(joint.y-root.y)-(end.y-root.y)*(joint.x-root.x);
  if(Math.abs(cross)<1e-12)throw Error('Contact: source bend direction missing '+c.id);
  return {...c,root,joint,endPoint:end,chain:createTwoBoneChain({root,joint,end,bend:cross<0?-1:1})};
 });
 return {chains,resolve(input:CreaturePoseV1,phase:ContactPhase){
  if(!Number.isFinite(phase.elapsedMs)||phase.elapsedMs<0||!Number.isFinite(phase.durationMs)||phase.durationMs<=0)throw Error('Contact: invalid phase');
  const free=/:(flight|fly|swim|jet|hop|leap|climb)$/.test(phase.actionId)||phase.actionId==='melee:kick'||phase.realm==='aquatic'||phase.realm==='aerial'||phase.realm==='gas-giant';
  if(!chains.length||free)return {pose:input,contacts:[],maxError:0};
  const gait=/^approach:(walk|trot|gallop|crawl|scuttle)$/.test(phase.actionId),weight=phase.weight??1;
  if(!Number.isFinite(weight)||weight<0||weight>1)throw Error('Contact: invalid blend weight');
  const pose:Record<string,{rotation:number;dx?:number;dy?:number}>=Object.fromEntries(Object.entries(input).map(([j,k])=>[j,{...k}]));
  // The contact owner drives leg pivots; incidental raw gait rotations must not
  // change the base of an otherwise identical support chain.
  for(const c of chains)if(template.legs.some(id=>c.hip===id+'Root'))pose[c.hip]={rotation:0};
  const matrices=program.evaluate(pose),contacts=[];
  for(const c of chains){
   const cycle=((phase.elapsedMs/phase.durationMs+c.group*.5)%1+1)%1;
   const swing=gait&&cycle>=.5,at=swing?(cycle-.5)*2:0;
   // Lift follows available leg slack, bounded by source leg length. Stance
   // stays at the source's perspective ground point, never an arbitrary Y.
   const reach=c.chain.lengths.upper+c.chain.lengths.lower;
   const lift=Math.min(program.bodyLength*.035,reach*.025)*weight;
   const target={x:c.endPoint.x+(swing?Math.sin(2*Math.PI*at)*program.bodyLength*.015*weight:0),y:c.endPoint.y-(swing?Math.sin(Math.PI*at)**2*lift:0)};
   const parent=matrices[c.hip]!,root=transformPoint(parent,c.root);
   let solved;try{solved=c.chain.solve(root,target);}catch(error){throw Error('Contact: '+phase.actionId+'@'+phase.elapsedMs+' '+c.id+' '+String(error));}
   const upper=wrapped(angle(solved.root,solved.joint)-angle(c.root,c.joint));
   const lower=wrapped(angle(solved.joint,solved.end)-angle(c.joint,c.endPoint));
   pose[c.knee]={rotation:wrapped(upper-Math.atan2(parent[1],parent[0]))};
   pose[c.end]={rotation:wrapped(lower-upper)};
   if(c.terminal)pose[c.terminal]={rotation:wrapped(-lower)};
   for(const j of [c.knee,c.end,...c.terminal?[c.terminal]:[]]){
    const l=template.limitsDeg[j]!,deg=pose[j]!.rotation*180/Math.PI;
    if(deg<l.min-1e-7||deg>l.max+1e-7)throw Error('Contact: joint limit '+j+' '+phase.actionId+'@'+phase.elapsedMs+': '+deg);
   }
   contacts.push({joint:c.end,target,stance:!swing});
  }
  const final=program.evaluate(pose);let maxError=0;
  for(const c of contacts){const p=transformPoint(final[c.joint]!,point(record.landmarks[c.joint]!));maxError=Math.max(maxError,Math.hypot(p.x-c.target.x,p.y-c.target.y));}
  if(maxError>1e-8)throw Error('Contact: unresolved endpoint');
  return {pose,contacts,maxError};
 }};
}

/** Independent rendered support sample: positions are normalized source pixels.
 * A real footprint may be offset from the endpoint; preserve that rest offset. */
export function contactPaintDriftPx(current:readonly number[],source:readonly number[],target:readonly number[],rest:readonly number[],size:readonly number[]):number{
 if([current,source,target,rest,size].some(p=>p.length!==2||p.some(v=>!Number.isFinite(v)))||size.some(v=>v<=0))throw Error('Contact paint: invalid sample');
 return Math.hypot((current[0]!-source[0]!-(target[0]!-rest[0]!))*size[0]!, (current[1]!-source[1]!-(target[1]!-rest[1]!))*size[1]!);
}
