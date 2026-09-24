/** Separate projected surfaces, welding only independently observed source joins.
 * Supports every family graph. Preserves all face provenance and source UVs. */
import {hashJSON} from "file:///Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/quadruped-template.mjs";
import {smoothSkinWeights} from "file:///Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/smooth-skin-weights.mjs";
const need=(ok,msg)=>{if(!ok)throw Error('Observed surfaces: '+msg);};
function observedContactPins(input,record,skin,contactEndpoints){
 const {parts,vertices}=skin,contactPins=[];
 for(const joint of contactEndpoints){
  const owner=input.parts.find(p=>p.joint===joint),part=parts.find(p=>p.id===owner?.id),end=record.landmarks[joint];need(part&&record.geometry,'missing contact surface');
  let best=null;part.vertices.forEach((v,index)=>{const xy=[0,0];for(let k=0;k<3;k++){const p=vertices[v.triangle[k]];xy[0]+=p.x*v.barycentric[k];xy[1]+=p.y*v.barycentric[k];}const distance=Math.hypot(xy[0]-end[0]*record.geometry.width,xy[1]-end[1]*record.geometry.height);if(!best||distance<best.distance)best={index,distance,v};});
  need(best,'empty contact surface');const supports=best.v.triangle.filter((_,k)=>best.v.barycentric[k]>1e-10);
  contactPins.push({joint,part:part.id,vertex:best.index,distancePx:best.distance,supports});
 }return contactPins;
}
export async function splitObservedSurfaces(input,record,probe,{fixedJoints=['root'],shapeJoints=[],preservePaintBoundaries=false,contactEndpoints=[],preserveExistingWeights=false,releaseContactConflicts=false}={}){
 const {recipeHash,...recipe}=record;need(await hashJSON(recipe)===recipeHash,'record hash');
 const {bindingHash,...body}=input;need(await hashJSON(body)===bindingHash,'binding hash');
 need(input.recordRecipeHash===recipeHash,'record binding');
 need(probe.recordRecipeHash===record.recipeHash&&probe.bindingHash===bindingHash,'probe binding');
 const skin=input.paintSkin,source=skin.vertices,owners=new Map(input.parts.map(p=>[p.id,p])),fields=new Map(skin.parts.map(p=>[p.id,p]));
 need(source.length<=40000&&owners.size===input.parts.length&&fields.size===skin.parts.length&&owners.size===fields.size,'source inventory');
 need(input.parts.every(p=>Object.hasOwn(record.landmarks,p.joint))&&[...fixedJoints,...shapeJoints,...contactEndpoints].every(j=>Object.hasOwn(record.landmarks,j)),'unknown joint');
 // A previously split certified field can receive the current shared contact
 // locks without remeshing or re-diffusing its unrelated authored weights.
 if(preserveExistingWeights){
  need(fixedJoints.length===0&&shapeJoints.length===0&&!preservePaintBoundaries,'contact-only preservation cannot change other owners');
  need(skin.parts.every(p=>p.fieldTriangles?.length===p.indices.length),'part/face provenance');
  const result=structuredClone(skin),contactPins=observedContactPins(input,record,result,contactEndpoints),locks=new Map(),pins=new Set(result.solver.pins);
  for(const {joint,supports}of contactPins)for(const i of supports){need(!locks.has(i)||locks.get(i)===joint,'conflicting contact owners');locks.set(i,joint);result.vertices[i].weights=[[joint,1]];pins.add(i);}
  const releasedContactPins=[];
  if(releaseContactConflicts){const conflicts=new Map();for(let k=0;k<result.triangles.length;k+=3){const triangle=result.triangles.slice(k,k+3),contactOwners=new Set(triangle.filter(i=>locks.has(i)).map(i=>locks.get(i)));if(!contactOwners.size)continue;for(const i of triangle)if(pins.has(i)&&!locks.has(i)&&result.vertices[i].weights.some(([j])=>!contactOwners.has(j)))conflicts.set(i,{vertex:i,contactOwners:[...contactOwners],weights:result.vertices[i].weights});}for(const [i,reason]of conflicts){pins.delete(i);releasedContactPins.push(reason);}}
  result.solver={...result.solver,pins:[...pins].sort((a,b)=>a-b)};
  const output={...body,paintSkin:result};return {binding:{...output,bindingHash:await hashJSON(output)},receipt:{schema:'cf.observed-surface-split/v1',mode:'preserve-existing-field-contact-locks',releasedContactPins,contactPins,sourceBindingHash:bindingHash,sourceVertices:source.length,vertices:result.vertices.length,pins:pins.size,sourceCoordinateChanges:0,topologyChanges:0,nonContactWeightChanges:0}};
 }
 need(!releaseContactConflicts,'contact conflict release requires existing-field preservation');
 const ids=new Map(),keys=[],parent=[],rawOwners=[];
 function index(part,old){need(Number.isInteger(old)&&source[old],'field reference');const key=part+':'+old;if(!ids.has(key)){ids.set(key,keys.length);keys.push({part,old});parent.push(parent.length);rawOwners.push(owners.get(part).joint);}return ids.get(key);}
 for(const p of skin.parts){need(owners.has(p.id)&&p.fieldTriangles?.length===p.indices.length,'part/face provenance');for(const v of p.vertices)for(const i of v.triangle)index(p.id,i);for(const i of p.fieldTriangles)index(p.id,i);}
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[Math.max(a,b)]=Math.min(a,b);};
 const jointSupports=new Set();
 // A flat master has no hidden paint behind a cut. Preserve every observed ink
 // boundary when explicitly requested; this never invents a reverse surface.
 const joins=preservePaintBoundaries?[...probe.joins,...probe.excluded]:probe.joins;
 for(const join of joins)for(const s of join.samples){
  const supports=(id,p)=>{const field=fields.get(id);need(field&&p.triangle?.length===3&&p.triangle.every(i=>Number.isInteger(i)&&field.vertices[i]),'probe surface');return new Set(p.triangle.flatMap(i=>field.vertices[i].triangle));};
  const a=supports(join.ancestorPart,s.ancestor),b=supports(join.descendantPart,s.descendant);
  for(const old of a)if(b.has(old)){const ai=index(join.ancestorPart,old),bi=index(join.descendantPart,old);union(ai,bi);jointSupports.add(ai);jointSupports.add(bi);}
 }
 const groups=new Map();for(let i=0;i<keys.length;i++){const p=find(i);if(!groups.has(p))groups.set(p,[]);groups.get(p).push(i);}
 need(groups.size<=40000,'vertex budget');
 const remap=new Map(),vertices=[],locked=new Map(),boundary=new Set(),shape=new Map();
 for(const [leader,members]of groups){const i=vertices.length,old=source[keys[leader].old],joints=[...new Set(members.map(m=>rawOwners[m]))];
  need(members.every(m=>keys[m].old===keys[leader].old),'changed source coordinates');members.forEach(m=>remap.set(m,i));
  const fixed=joints.filter(j=>fixedJoints.includes(j));need(fixed.length<=1,'conflicting fixed owners');
  const weights=fixed.length?[[fixed[0],1]]:joints.map(j=>[j,1/joints.length]);vertices.push({...old,weights});
  if(fixed.length)locked.set(i,fixed[0]);if(members.some(m=>jointSupports.has(m)))boundary.add(i);
  if(joints.length===1&&shapeJoints.includes(joints[0]))shape.set(i,joints[0]);
 }
 const triangles=[],seen=new Set(),map=(id,i)=>{const value=remap.get(ids.get(id+':'+i));need(value!==undefined,'unmapped source reference');return value;},add=tri=>{const key=tri.slice().sort((a,b)=>a-b).join(',');if(!seen.has(key)){seen.add(key);triangles.push(...tri);}};
 const parts=skin.parts.map(p=>{const vertices=p.vertices.map(v=>{const triangle=v.triangle.map(i=>map(p.id,i));add(triangle);return {...v,triangle};}),fieldTriangles=p.fieldTriangles.map(i=>map(p.id,i));for(let k=0;k<fieldTriangles.length;k+=3)add(fieldTriangles.slice(k,k+3));return {...p,vertices,fieldTriangles};});
 const near=vertices.map(()=>new Set());for(let k=0;k<triangles.length;k+=3)for(let j=0;j<3;j++){const a=triangles[k+j],b=triangles[k+(j+1)%3];near[a].add(b);near[b].add(a);}
 // Three mesh rings form a flexible collar; interior source foliage keeps its shape.
 let collar=new Set(boundary);for(let i=0;i<3;i++)collar=new Set([...collar,...[...collar].flatMap(j=>[...near[j]])]);
 for(const [i,j]of shape)if(!collar.has(i))locked.set(i,j);
 const contactPins=observedContactPins(input,record,{parts,vertices},contactEndpoints);
 const metadata=Array(vertices.length);
 for(const [,members]of groups){const i=remap.get(members[0]);metadata[i]={splitVertex:i,originalVertex:keys[members[0]].old,source:[vertices[i].x,vertices[i].y],parts:[...new Set(members.map(m=>keys[m].part))],ownerJoints:[...new Set(members.map(m=>rawOwners[m]))]};}
 const contacts=contactPins.map(pin=>{const p=parts.find(p=>p.id===pin.part),v=p.vertices[pin.vertex],xy=[0,0];for(let k=0;k<3;k++){xy[0]+=vertices[v.triangle[k]].x*v.barycentric[k];xy[1]+=vertices[v.triangle[k]].y*v.barycentric[k];}return{...pin,landmark:record.landmarks[pin.joint].map((v,i)=>v*(i?record.geometry.height:record.geometry.width)),selectedSource:xy,interpolation:v,supportDetails:pin.supports.map(i=>({...metadata[i],initialLock:locked.get(i)??null}))};});
 const conflicts=[];
 for(const pin of contacts)for(const i of pin.supports){const owner=locked.get(i);if(owner!==undefined&&owner!==pin.joint)conflicts.push({joint:pin.joint,part:pin.part,lockedOwner:owner,support:metadata[i]});else locked.set(i,pin.joint);}
 return {diagnosticOnly:true,contacts,conflicts,firstRefusal:conflicts[0]??null,sourceVertices:source.length,splitVertices:vertices.length,observedJoinCount:probe.joins.length};
 const result=smoothSkinWeights({...skin,vertices,parts,triangles});for(const[i,j]of locked)result.vertices[i].weights=[[j,1]];
 result.solver={iterations:4,globalIterations:4,targetWeight:.35,pins:[...locked.keys()].sort((a,b)=>a-b)};
 need(result.vertices.length<=40000,'vertex budget');
 const output={...body,paintSkin:result};return {binding:{...output,bindingHash:await hashJSON(output)},receipt:{schema:'cf.observed-surface-split/v1',contactPins,sourceBindingHash:bindingHash,sourceVertices:source.length,vertices:vertices.length,sharedSupports:boundary.size,pins:locked.size,independentSurfaceParts:parts.length,sourceJoins:probe.joins.length,excludedOverlaps:probe.excluded.length,observedExcludedBoundaries:probe.excluded.length,weldedExcludedBoundaries:preservePaintBoundaries?probe.excluded.length:0,independentExcludedBoundaries:preservePaintBoundaries?0:probe.excluded.length,preservePaintBoundaries,sourceCoordinateChanges:0}};
}
