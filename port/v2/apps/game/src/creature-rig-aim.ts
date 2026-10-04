import type {CreaturePoseV1,CreatureRigRecordV1} from './creature-rig-types.js';
import {composeAffine,rotationAround,transformPoint,IDENTITY_AFFINE,type Affine2} from '../../../tools/creature-animation/kinematics.js';
/** Geometry must be emitted by the painter or declared against an authored
 * master. No head direction, eye point, turn coverage or chain is guessed. */
export interface CreatureAimGeometry {
 readonly recordRecipeHash:string;
 readonly graph:ReadonlyArray<readonly [string,string]>;
 readonly chain:ReadonlyArray<string>; // proximal -> distal, e.g. neck -> head
 readonly origin:readonly [number,number];readonly forward:readonly [number,number];
 readonly bodyLength:number;
 readonly limits:Readonly<Record<string,{readonly min:number;readonly max:number}>>;
 readonly yaw:{readonly centre:number;readonly halfRange:number};
}
const need=(v:unknown,s:string):void=>{if(!v)throw Error('Creature aim: '+s);};
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
/** Solve in the available view plane, preserving root/limb/action motion. A yaw
 * outside the actual view coverage requests another view; it never mirrors or
 * stretches the portrait to pretend that hidden anatomy exists. */
export function createCreatureRigAim(record:CreatureRigRecordV1,input:CreatureAimGeometry){
 const geometry=structuredClone(input),landmarks=structuredClone(record.landmarks),known=new Set(Object.keys(landmarks));
 need(geometry.recordRecipeHash===record.recipeHash,'record binding mismatch');
 need(known.has('root')&&known.size<=256&&Object.values(landmarks).every(p=>p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=1)),'record landmarks');
 need(Number.isFinite(geometry.bodyLength)&&geometry.bodyLength>0,'body length');
 need(geometry.chain.length>0&&geometry.chain.length<=16&&new Set(geometry.chain).size===geometry.chain.length,'aim chain');
 const parent=new Map<string,string>(),seen=new Set(['root']);
 for(const[c,p]of geometry.graph){need(known.has(c)&&known.has(p)&&!seen.has(c)&&seen.has(p),'ordered complete graph');parent.set(c,p);seen.add(c);}
 need(known.size===seen.size&&[...known].every(j=>seen.has(j)),'graph inventory');
 for(const[j,i]of geometry.chain.map((j,i)=>[j,i] as const)){
  const limit=geometry.limits[j];need(j!=='root'&&known.has(j)&&limit&&Number.isFinite(limit.min)&&Number.isFinite(limit.max)&&limit.min<=limit.max&&limit.min>=-Math.PI&&limit.max<=Math.PI,'chain limit');
  if(i){let found=false;for(let p=parent.get(j);p;p=parent.get(p))if(p===geometry.chain[i-1])found=true;need(found,'chain must follow actual ancestry');}
 }
 for(const p of [geometry.origin,geometry.forward])need(p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=1),'painted gaze landmarks');
 need(Math.hypot(geometry.forward[0]-geometry.origin[0],geometry.forward[1]-geometry.origin[1])>1e-5,'gaze axis');
 need(Number.isFinite(geometry.yaw.centre)&&Number.isFinite(geometry.yaw.halfRange)&&geometry.yaw.halfRange>=0&&geometry.yaw.halfRange<=Math.PI,'view coverage');
 const matrices=(pose:CreaturePoseV1)=>{
  const result:Record<string,Affine2>={};
  for(const[j,p]of [['root',null],...geometry.graph] as Array<[string,string|null]>){const key=pose[j],pivot=landmarks[p??'root']!;
   const local=key?rotationAround({x:pivot[0],y:pivot[1]},key.rotation,{x:(key.dx??0)*geometry.bodyLength,y:(key.dy??0)*geometry.bodyLength}):IDENTITY_AFFINE;
   result[j]=p?composeAffine(result[p]!,local):local;
  }return result;
 };
 return {resolve(inputPose:CreaturePoseV1,target:{readonly x:number;readonly y:number;readonly yawRadians:number}){
  need([target.x,target.y,target.yawRadians].every(Number.isFinite),'target');
  for(const[j,k]of Object.entries(inputPose))need(known.has(j)&&k&&[k.rotation,k.dx??0,k.dy??0].every(Number.isFinite),'input pose');
  for(const j of geometry.chain){const angle=inputPose[j]?.rotation??0,limit=geometry.limits[j]!;need(angle>=limit.min&&angle<=limit.max,'input joint limit '+j);}
  if(Math.abs(wrap(target.yawRadians-geometry.yaw.centre))>geometry.yaw.halfRange+1e-10)
   return {status:'needs-view' as const,pose:inputPose,residualRadians:null,limitedJoints:[] as string[]};
  const pose:Record<string,{rotation:number;dx?:number;dy?:number}>=Object.fromEntries(Object.entries(inputPose).map(([j,k])=>[j,{...k}])),limited=new Set<string>(),tip=geometry.chain.at(-1)!;
  const error=()=>{const m=matrices(pose)[tip]!,a=transformPoint(m,{x:geometry.origin[0],y:geometry.origin[1]}),b=transformPoint(m,{x:geometry.forward[0],y:geometry.forward[1]});
   need(Math.hypot(target.x-a.x,target.y-a.y)>1e-8,'target at gaze origin');return wrap(Math.atan2(target.y-a.y,target.x-a.x)-Math.atan2(b.y-a.y,b.x-a.x));};
  // Distal aim leads; remaining angle is taken up by the actual ancestor chain.
  // Fixed iteration budget and explicit target make results frame-rate independent.
  for(let pass=0;pass<8;pass++){
   if(Math.abs(error())<1e-6)break;
   for(const j of [...geometry.chain].reverse()){
    const ms=matrices(pose),m=ms[tip]!,a=transformPoint(m,{x:geometry.origin[0],y:geometry.origin[1]}),b=transformPoint(m,{x:geometry.forward[0],y:geometry.forward[1]}),localPivot=landmarks[parent.get(j)!]!,pivot=transformPoint(ms[j]!,{x:localPivot[0],y:localPivot[1]});
    const vx=b.x-a.x,vy=b.y-a.y,vlen=Math.hypot(vx,vy),tx=target.x-pivot.x,ty=target.y-pivot.y,r=Math.hypot(tx,ty);
    // Solve the rotated gaze R(d) against T - R(origin), including eye motion
    // about the joint pivot. Treating the eye as the pivot overshoots near targets.
    const cross=(vx*(a.y-pivot.y)-vy*(a.x-pivot.x))/vlen;
    const delta=r>1e-8&&Math.abs(cross)<=r?wrap(Math.atan2(ty,tx)-Math.atan2(vy,vx)-Math.asin(cross/r)):error();
    const key=pose[j]??{rotation:0},limit=geometry.limits[j]!,requested=key.rotation+delta,angle=Math.max(limit.min,Math.min(limit.max,requested));
    if(angle!==requested)limited.add(j);pose[j]={...key,rotation:angle};
   }
  }
  const residual=error();return {status:Math.abs(residual)<1e-4?'aimed' as const:'needs-body-turn' as const,pose,residualRadians:residual,limitedJoints:[...limited]};
 }};
}
