/** Audit-only narrow faint support author: keep upper-arm/head coherence and
 * rotate the observed lower arm around its real elbow. Hands may retract along
 * their source floor; no invented stationary hand contact, bone stretch or IK. */
import assert from 'node:assert/strict';
import{createSkeletonPoseProgram}from'../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import{transformPoint}from'../../port/v2/tools/creature-animation/kinematics.ts';
import{convexHull}from'./forehand-support.ts';
export function createForehandHinge(record:any,definition:any,hands:any[]){
 assert.equal(definition.id,'primate');assert.equal(hands.length,2);
 const program=createSkeletonPoseProgram(definition,record.landmarks),chains=hands.map(({joint,hull}:any)=>{
  const elbow=joint.replace('Hand','Elbow'),shoulder=joint.replace('Hand','Shoulder'),point=(j:string)=>({x:record.landmarks[j][0],y:record.landmarks[j][1]}),root=point(shoulder),pivot=point(elbow),end=point(joint);
  const cross=(end.x-root.x)*(pivot.y-root.y)-(end.y-root.y)*(pivot.x-root.x);assert(cross!==0);
  const upperAngle=Math.atan2(pivot.y-root.y,pivot.x-root.x),lowerAngle=Math.atan2(end.y-pivot.y,end.x-pivot.x);
  const bend=Math.atan2(Math.sin(upperAngle-lowerAngle),Math.cos(upperAngle-lowerAngle));assert(Math.sign(bend)===Math.sign(cross));
  assert(Array.isArray(hull)&&hull.length>=3&&hull.every((p:any)=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)),'observed hand contour required');
  const points=convexHull(hull).map(([x,y])=>({x:x/record.geometry.width,y:y/record.geometry.height}));assert(points.length>=3,'nondegenerate observed hand contour');
  return {joint,elbow,shoulder,pivot,points,floor:Math.max(...points.map(p=>p.y)),bend,limit:definition.limitsDeg[joint]};
 });
 return {chains,resolve(input:any,phase:any){
  if(phase.actionId!=='faint')return {pose:input,contacts:[],changed:false};
  const pose=structuredClone(input),before=program.evaluate(input),contacts=[];
  for(const c of chains){
   const parent=before[c.elbow],pivot=transformPoint(parent,c.pivot),parentRotation=Math.atan2(parent[1],parent[0]);
   const maxY=(rotation:number)=>Math.max(...c.points.map(p=>pivot.y+Math.sin(parentRotation+rotation)*(p.x-c.pivot.x)+Math.cos(parentRotation+rotation)*(p.y-c.pivot.y)));
   // Remain on the observed anatomical flexion side. The source bend angle is
   // measured, not a species-name direction guess. No joint-limit clamp hides
   // an unreachable floor: both original bounds are checked before selection.
   const sign=Math.sign(c.bend),flex=(sign>0?c.limit.min:c.limit.max)*Math.PI/180;
   const neutral=0,raw=input[c.joint]?.rotation??0;
   if(raw<c.limit.min*Math.PI/180-1e-7||raw>c.limit.max*Math.PI/180+1e-7)throw Error('Forehand hinge: original raw joint limit '+c.joint);
   if(maxY(neutral)<=c.floor+1e-12){pose[c.joint]={rotation:neutral};contacts.push({joint:c.joint,mode:'clear-neutral',rotation:neutral,targetY:c.floor,predictedY:maxY(neutral)});continue;}
   if(maxY(flex)>c.floor+1e-12)throw Error('Forehand hinge: '+c.joint+' original flexion limit cannot clear painted source floor '+JSON.stringify({limit:c.limit,atLimitY:maxY(flex),floor:c.floor}));
   // Bounded monotone interval on the observed flexion side. The tiny source
   // contour scan is setup geometry; the original paint/ARAP guards still own
   // publication. A non-monotone support shape is refused, never guessed.
   let previous=maxY(flex);for(let i=1;i<=32;i++){const y=maxY(flex*(1-i/32));if(y<previous-1e-12)throw Error('Forehand hinge: non-monotone contour interval '+c.joint);previous=y;}
   let safe=flex,unsafe=neutral;for(let i=0;i<48;i++){const mid=(safe+unsafe)/2;if(maxY(mid)<=c.floor)safe=mid;else unsafe=mid;}
   assert(safe>=c.limit.min*Math.PI/180-1e-10&&safe<=c.limit.max*Math.PI/180+1e-10);
   assert(Math.sign(c.bend-safe)===sign,'actual elbow bend preserved');pose[c.joint]={rotation:safe};
   contacts.push({joint:c.joint,mode:'source-floor-retraction',rotation:safe,targetY:c.floor,predictedY:maxY(safe)});
  }
  const after=program.evaluate(pose);for(const j of Object.keys(before))if(!/^arm(Near|Far)Hand$/.test(j))assert.deepEqual(after[j],before[j],'unrelated matrix changed '+j);
  return {pose,contacts,changed:true};
 }};
}
