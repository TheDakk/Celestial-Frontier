/** Candidate: one spatially continuous axial influence field, instead of root-owned
 * leftover stalk pixels beside a separately rotating caudal surface. Original
 * pixels/UVs/landmarks and every motion/ARAP/contact gate remain unchanged. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {splitObservedSurfaces} from '../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import {createSourceJoinProbe} from '../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import {hashJSON} from '../../port/v2/tools/creature-animation/quadruped-template.mjs';
const root=process.cwd(),req=createRequire(root+'/port/v2/package.json'),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const [id,variant='axial-01']=process.argv.slice(2);
if(!['07-perch','08-cod','09-carp'].includes(id))throw Error('Named durable fish required');
const src=path.join(root,'audits/G1_FISH_PACKETS_20260926',id,'fit'),out=path.join(import.meta.dirname,id,variant);
if(fs.existsSync(out))throw Error('New output required');
const read=n=>JSON.parse(fs.readFileSync(path.join(src,n))),record=read('record.json'),input=read('pre-split-binding.json'),manifest=read('parts/manifest.json');
const atlas=await sharp(path.join(src,'parts/atlas',manifest.creatureId+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const probe=createSourceJoinProbe({record,binding:input,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}});
const chain=['root','spine0','spine1','spine2','spine3','spine4','spine5','caudal'];
const axialParts=new Set(input.parts.filter(p=>chain.includes(p.joint)).map(p=>p.id));
const pairs=probe.excluded.filter(j=>axialParts.has(j.ancestorPart)&&axialParts.has(j.descendantPart)).map(j=>[j.ancestorPart,j.descendantPart]);
if(['axial-05','axial-06','axial-07'].includes(variant)){const prior=JSON.parse(fs.readFileSync(path.join(src,'../evidence/weld-receipt.json'))).pairs;pairs.splice(0,pairs.length,...prior,['body','caudal']);}
const split=await splitObservedSurfaces(input,record,probe,{fixedJoints:['root'],shapeJoints:input.parts.filter(p=>p.joint!=='root').map(p=>p.joint),paintBoundaryPairs:pairs});
const binding=split.binding,skin=binding.paintSkin,w=record.geometry.width,h=record.geometry.height;
const points=chain.map(j=>record.landmarks[j].map((v,k)=>v*(k?h:w)));
const supports=new Set(skin.parts.filter(p=>axialParts.has(p.id)).flatMap(p=>[...p.fieldTriangles,...p.vertices.flatMap(v=>v.triangle)]));
const axis=[points.at(-1)[0]-points[0][0],points.at(-1)[1]-points[0][1]],axisLength=Math.hypot(...axis);
const station=p=>((p[0]-points[0][0])*axis[0]+(p[1]-points[0][1])*axis[1])/axisLength;
const stations=points.map(station);
if(stations.some((s,i)=>i&&s<=stations[i-1]))throw Error('Axial stations must advance monotonically');
const weights=(v)=>{
 if(['axial-03','axial-04','axial-05','axial-06','axial-07'].includes(variant)){
  const u=station([v.x,v.y]);
  // Caudal rotates about spine5: finish its blend at that observed hinge,
  // before the fin flares. Blending across the fan itself folds its wide rim.
  const names=['axial-04','axial-05','axial-06','axial-07'].includes(variant)?[...chain.slice(0,-2),'caudal']:chain;
  const knots=['axial-04','axial-05','axial-06','axial-07'].includes(variant)?stations.slice(0,-1):stations;
  let i=0;while(i<names.length-2&&u>knots[i+1])i++;
  const t=Math.max(0,Math.min(1,(u-knots[i])/(knots[i+1]-knots[i]))),s=t*t*(3-2*t);
  return [[names[i],1-s],[names[i+1],s]].filter(([,v])=>v>1e-12);
 }
 let best=null;
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy;
  if(l2<1e-8)throw Error('Degenerate observed axial chain');
  const t=Math.max(0,Math.min(1,((v.x-a[0])*dx+(v.y-a[1])*dy)/l2));
  const d2=(v.x-a[0]-t*dx)**2+(v.y-a[1]-t*dy)**2;
  if(!best||d2<best.d2)best={i,t,d2};
 }
 const {i,t}=best;
 // Smooth interpolation at each observed chain station, never invented bones.
 const s=t*t*(3-2*t);
 return [[chain[i],1-s],[chain[i+1],s]].filter(([,v])=>v>1e-12);
};
const near=new Map([...supports].map(i=>[i,new Set()]));
for(const part of skin.parts.filter(p=>axialParts.has(p.id)))for(let k=0;k<part.fieldTriangles.length;k+=3){const tri=part.fieldTriangles.slice(k,k+3);for(const a of tri)for(const b of tri)near.get(a).add(b);}
const unseen=new Set(supports),components=[];
while(unseen.size){const seed=unseen.values().next().value,queue=[seed],component=[];unseen.delete(seed);while(queue.length){const i=queue.pop();component.push(i);for(const j of near.get(i))if(unseen.delete(j))queue.push(j);}components.push(component);}
components.sort((a,b)=>b.length-a.length);
// Disconnected source specks keep their original field; they are neither erased
// nor made into anatomical tail tissue by their projection onto a distant bone.
const tissue=new Set(components[0]);
if(variant==='axial-01')for(const i of supports)skin.vertices[i].weights=weights(skin.vertices[i]);
else for(const i of tissue){
 const vertex=skin.vertices[i],u=station([vertex.x,vertex.y]);
 if(['axial-05','axial-06','axial-07'].includes(variant)){
  if(u<=stations[4])continue;
  const t=Math.min(1,(u-stations[4])/(stations[5]-stations[4]));
  const normal=Math.abs((vertex.x-points[5][0])*(-axis[1]/axisLength)+(vertex.y-points[5][1])*(axis[0]/axisLength));
  // Bound the stalk collar in both dimensions; anal/dorsal foliage is not stalk.
  const radius=(stations[6]-stations[5])/2;
  const radial=variant==='axial-06'&&u<stations[6]?Math.max(0,Math.min(1,(2*radius-normal)/radius)):1;
  const blend=t*t*(3-2*t)*radial*radial*(3-2*radial),sum=new Map();
  for(const [j,v] of vertex.weights)sum.set(j,v*(1-blend));
  for(const [j,v] of weights(vertex))sum.set(j,(sum.get(j)??0)+v*blend);
  vertex.weights=[...sum].filter(([,v])=>v>1e-12);const total=vertex.weights.reduce((s,[,v])=>s+v,0);vertex.weights=vertex.weights.map(([j,v])=>[j,v/total]);
 }else vertex.weights=weights(vertex);
}


// Exact analytic axial target; other surfaces retain their existing solver locks.
if(variant!=='axial-07')skin.solver.pins=[...new Set([...skin.solver.pins,...(variant==='axial-01'?supports:['axial-05','axial-06','axial-07'].includes(variant)?[...tissue].filter(i=>station([skin.vertices[i].x,skin.vertices[i].y])>=stations[5]):tissue)])].sort((a,b)=>a-b);
const {bindingHash,...body}=binding;binding.bindingHash=await hashJSON(body);
fs.mkdirSync(out,{recursive:true});fs.cpSync(src,path.join(out,'fit'),{recursive:true});
fs.writeFileSync(path.join(out,'fit/binding.json'),JSON.stringify(binding,null,2)+'\n');
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({schema:'cf.tail-stalk-candidate/v1',id,chain,pairs,axialParts:[...axialParts],supports:supports.size,components:components.map(c=>c.length),sourceCoordinateChanges:0,split:split.receipt,sourceBindingHash:input.bindingHash,bindingHash:binding.bindingHash},null,2)+'\n');
console.log(out);
