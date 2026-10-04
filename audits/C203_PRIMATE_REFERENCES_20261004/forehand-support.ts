/** Audit prototype only. The existing hind-foot solve is the input.
 * A planted forehand is selected from the exact positive-alpha hand contour.
 * No new joint, reach clamp, root shift, source warp, or limit expansion. */
import assert from 'node:assert/strict';
import {createTwoBoneChain, transformPoint, rotationAround} from '../../port/v2/tools/creature-animation/kinematics.ts';
import {createSkeletonPoseProgram} from '../../port/v2/tools/creature-animation/skeleton-pose.mjs';
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
const angle=(a:any,b:any)=>Math.atan2(b.y-a.y,b.x-a.x);
export function convexHull(points:number[][]){
 const sorted=[...new Map(points.map(p=>[p.join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(o:number[],a:number[],b:number[])=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const half=(pts:number[][])=>{const h:number[][]=[];for(const p of pts){while(h.length>1&&cross(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}return h;};
 return [...half(sorted).slice(0,-1),...half(sorted.slice().reverse()).slice(0,-1)];
}
export function createForehandSupport(record:any,definition:any,hands:any[]){
 assert.equal(definition.id,'primate');assert.equal(hands.length,2);
 const program=createSkeletonPoseProgram(definition,record.landmarks);
 const chains=hands.map(({joint,hull}:any)=>{
  assert(['armNearHand','armFarHand'].includes(joint));
  const shoulder=joint.replace('Hand','Shoulder'),elbow=joint.replace('Hand','Elbow');
  const pt=(j:string)=>({x:record.landmarks[j][0],y:record.landmarks[j][1]});
  const root=pt(shoulder),mid=pt(elbow),end=pt(joint);
  const lowerHull=convexHull(hull).map(([x,y])=>({x:x/record.geometry.width,y:y/record.geometry.height}));
  const y=Math.max(...lowerHull.map((p:any)=>p.y)),anchor=lowerHull.filter((p:any)=>p.y===y).sort((a:any,b:any)=>Math.abs(a.x-end.x)-Math.abs(b.x-end.x))[0];
  const bend=Math.sign((end.x-root.x)*(mid.y-root.y)-(end.y-root.y)*(mid.x-root.x));assert(bend);
  return {joint,shoulder,elbow,root,mid,end,hull:lowerHull,anchor,bend};
 });
 return {chains,resolve(input:any,phase:any){
  if(phase.actionId!=='faint')return {pose:input,contacts:[],changed:false};
  const pose=structuredClone(input),original=program.evaluate(input),contacts=[];
  for(const c of chains){
   const matrix=original[c.shoulder],root=transformPoint(matrix,c.root),parentRotation=Math.atan2(matrix[1],matrix[0]),candidates=[],refusals=[];
   for(let index=0;index<c.hull.length;index++){
    const support=c.hull[index];
    try{
     const cross=(support.x-c.root.x)*(c.mid.y-c.root.y)-(support.y-c.root.y)*(c.mid.x-c.root.x);
     // A paint offset can lie across the anatomical bone axis. Its IK branch
     // is not itself the anatomical elbow bend. Try the two exact solutions,
     // then reject any that reverse the actual Shoulder-Elbow-Hand chain.
     const chain=createTwoBoneChain({root:c.root,joint:c.mid,end:support,bend:(cross<0?-1:1)});
     const target={x:support.x,y:c.anchor.y};
     const solved=chain.solve(root,target),dx=target.x-root.x,dy=target.y-root.y,dd=dx*dx+dy*dy,t=((solved.joint.x-root.x)*dx+(solved.joint.y-root.y)*dy)/dd;
     const branches=[solved.joint,{x:2*(root.x+t*dx)-solved.joint.x,y:2*(root.y+t*dy)-solved.joint.y}];
     for(const mid of branches){try{
     const upper=wrap(angle(root,mid)-angle(c.root,c.mid)),lower=wrap(angle(mid,target)-angle(c.mid,support));
     const lowerMatrix=rotationAround(c.mid,lower,{x:mid.x-c.mid.x,y:mid.y-c.mid.y}),end=transformPoint(lowerMatrix,c.end);
     const anatomicalCross=(end.x-root.x)*(mid.y-root.y)-(end.y-root.y)*(mid.x-root.x);
     if(Math.sign(anatomicalCross)!==c.bend)throw Error('reverses actual anatomical elbow');
     const rotations={[c.elbow]:wrap(upper-parentRotation),[c.joint]:wrap(lower-upper)};
     for(const [j,r] of Object.entries(rotations)){const lim=definition.limitsDeg[j],deg=r*180/Math.PI;if(deg<lim.min-1e-7||deg>lim.max+1e-7)throw Error('original joint limit '+j+' '+deg);}
     const maxY=Math.max(...c.hull.map((p:any)=>transformPoint(lowerMatrix,p).y));
     if(maxY>c.anchor.y+1e-10)throw Error('other painted hand contour below support');
     const score=Math.abs(rotations[c.elbow]) + Math.abs(rotations[c.joint]);
     candidates.push({index,support,target,rotations,maxY,score});
     }catch(e:any){refusals.push({index,error:e.message});}}
    }catch(e:any){refusals.push({index,error:e.message});}
   }
   if(!candidates.length)throw Error('Forehand support: '+c.joint+' no unchanged-limit candidate '+JSON.stringify(refusals));
   candidates.sort((a,b)=>a.score-b.score||a.index-b.index);const best=candidates[0];
   for(const [j,rotation] of Object.entries(best.rotations))pose[j]={rotation};
   contacts.push({joint:c.joint,sourceSupport:best.support,target:best.target,sourceHullPoints:c.hull.length,rotations:best.rotations,selectedHullIndex:best.index,maxPredictedY:best.maxY});
  }
  const after=program.evaluate(pose);
  for(const name of Object.keys(original))if(!/^arm(Near|Far)(Elbow|Hand)$/.test(name))assert.deepEqual(after[name],original[name],'unrelated matrix changed '+name);
  return {pose,contacts,changed:true};
 }};
}
