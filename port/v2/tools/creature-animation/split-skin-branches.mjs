/** Split projected overlaps into anatomical surfaces before weight diffusion.
 * A near/far foot can share image coordinates without sharing physical skin.
 * Source coordinates, atlas UVs, part order and the record remain unchanged. */
import {GRAPH,LEGS,hashJSON}from'./quadruped-template.mjs';
import {compilePawContactPins}from'./paw-contact-pins.mjs';
const need=(ok,why)=>{if(!ok)throw Error('Skin branches: '+why);};
const parents=new Map(GRAPH),inventory=['root',...GRAPH.map(([j])=>j)];
const legOf=joint=>LEGS.find(id=>joint===id+'Root'||joint===id+'Knee'||joint===id+'Ankle'||joint===id+'Paw')??null;
export async function splitSkinBranches(input,record,{diffusionIterations=32,contactContours=[],attachmentEdges=null}={}){
 need(input?.schema==='cf.creature-parts/v1','binding schema');
 const {bindingHash:inputHash,...inputBody}=input;need(/^[a-f0-9]{64}$/.test(inputHash)&&await hashJSON(inputBody)===inputHash,'corrupted source binding');
 const {recipeHash,...recordBody}=record??{};need(/^[a-f0-9]{64}$/.test(recipeHash)&&await hashJSON(recordBody)===recipeHash,'corrupted source record');
 need(record.template?.id==='quadruped'&&record.template.version===1,'unsupported anatomy');
 const binding=structuredClone(input),skin=binding.paintSkin,w=record.geometry.width,h=record.geometry.height;
 need(Number.isInteger(w)&&Number.isInteger(h)&&w>0&&h>0&&w<=2048&&h<=2048,'source dimensions');
 need(skin?.schema==='cf.paint-skin/v1'&&Array.isArray(skin.triangles),'conforming field required');
 need(Number.isInteger(diffusionIterations)&&diffusionIterations>=0&&diffusionIterations<=128,'diffusion budget');
 need(binding.recordRecipeHash===record.recipeHash,'record binding');
 const originals=skin.vertices,sourceParts=new Map(binding.parts.map(p=>[p.id,p])),vertices=[],keys=new Map(),sources=[],surfaces=[],pins=[],triangles=[],triangleKeys=new Set();
 need(sourceParts.size===binding.parts.length&&binding.parts.every(p=>inventory.includes(p.joint)),'part ownership');
 need(Array.isArray(originals)&&originals.length>=3&&originals.length<=40000,'source vertex budget');
 for(const v of originals){need(Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x>=0&&v.x<=w&&v.y>=0&&v.y<=h&&Array.isArray(v.weights)&&v.weights.length>0,'source vertex');let sum=0;for(const[j,q]of v.weights){need(inventory.includes(j)&&Number.isFinite(q)&&q>0&&q<=1,'source weight');sum+=q;}need(Math.abs(sum-1)<1e-8,'source weight sum');}
 // A painted body/upper-leg boundary is a physical socket, even when it lies
 // below the skeleton root plane or joins sibling bone owners. Weld every
 // supporting field face on that admitted axial/upper cut. Merely coincident sibling/foot pixels stay separate.
 const sockets=new Map(LEGS.map(id=>[id,new Set()])),socketEdges=new Map(LEGS.map(id=>[id,0])),adjacencyClasses={'axial-continuous':0,'same-limb-continuous':0,'axial-upper-socket':0,'independent-limbs':0,'axial-distal-crossing':0},socketPairs=new Map();
 if(attachmentEdges!==null){
  need(Array.isArray(attachmentEdges),'attachment edge inventory');
  const faces=[];
  for(let i=0;i<skin.triangles.length;i+=3){const ids=skin.triangles.slice(i,i+3);need(ids.length===3&&ids.every(k=>Number.isInteger(k)&&k>=0&&k<originals.length),'field face');const points=ids.map(k=>[originals[k].x,originals[k].y]);faces.push({ids,points,minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minY:Math.min(...points.map(p=>p[1])),maxY:Math.max(...points.map(p=>p[1]))});}
  const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
  const contains=(p,t)=>{const a=t.map((v,i)=>cross(v,t[(i+1)%3],p));return a.every(v=>v>=-1e-8)||a.every(v=>v<=1e-8);};
  const intersects=(a,b,c,d)=>{const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);return abC*abD<=0&&cdA*cdB<=0&&Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))<=Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))&&Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))<=Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1]));};
  for(const e of attachmentEdges){let [ancestor,descendant]=(e.ownerParts??[e.ancestorPart,e.sourcePart]).map(id=>sourceParts.get(id));need(ancestor&&descendant&&Array.isArray(e.edge)&&e.edge.length===2&&e.edge.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)),'attachment edge');let aLeg=legOf(ancestor.joint),leg=legOf(descendant.joint);
   if(!aLeg&&!leg){adjacencyClasses['axial-continuous']++;continue;}if(aLeg&&leg){adjacencyClasses[aLeg===leg?'same-limb-continuous':'independent-limbs']++;continue;}if(aLeg){[ancestor,descendant]=[descendant,ancestor];leg=aLeg;}
   if(![leg+'Root',leg+'Knee'].includes(descendant.joint)){adjacencyClasses['axial-distal-crossing']++;continue;}
   adjacencyClasses['axial-upper-socket']++;const pair=ancestor.id+'|'+descendant.id;socketPairs.set(pair,(socketPairs.get(pair)??0)+1);
   const [a,b]=e.edge;let found=false;for(const f of faces){if(Math.max(a[0],b[0])<f.minX||Math.min(a[0],b[0])>f.maxX||Math.max(a[1],b[1])<f.minY||Math.min(a[1],b[1])>f.maxY)continue;if(contains(a,f.points)||contains(b,f.points)||f.points.some((p,i)=>intersects(a,b,p,f.points[(i+1)%3]))){f.ids.forEach(k=>sockets.get(leg).add(k));found=true;}}
   need(found,'attachment outside field');socketEdges.set(leg,socketEdges.get(leg)+1);
  }
 }
 // Shared shoulder/hip skin responds to proximal limb motion. Distal ankle
 // and paw transforms remain branch-exclusive; sharing paint must not freeze
 // the whole socket to the torso and squeeze motion into one narrow strip.
 const commonInfluences=new Set(inventory.filter(j=>!legOf(j)||j.endsWith('Root')||j.endsWith('Knee'))),allowed=new Map([['axial',commonInfluences],...LEGS.map(id=>[id,new Set(inventory.filter(j=>commonInfluences.has(j)||legOf(j)===id))])]);
 const surfaceFor=(part,index)=>{const branch=legOf(part.joint);if(!branch)return 'axial';
  if(attachmentEdges!==null)return sockets.get(branch).has(index)?'axial':branch;
  // An articulated distal limb can curl behind its root plane. Its painted
  // ankle/paw ownership still belongs to that limb, never the axial surface.
  if(part.joint===branch+'Ankle'||part.joint===branch+'Paw')return branch;
  const p=originals[index],root=record.landmarks[branch+'Root'],knee=record.landmarks[branch+'Knee'];need([root,knee].every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1))&&Math.hypot(knee[0]-root[0],knee[1]-root[1])>0,'root attachment landmarks');
  // Skin behind the anatomical root plane remains the axial socket. Distal
  // chains get separate indices even when their projected pixels touch.
  return (p.x/w-root[0])*(knee[0]-root[0])+(p.y/h-root[1])*(knee[1]-root[1])>0?branch:'axial';};
 const remapWeights=(weights,surface)=>{const permitted=allowed.get(surface),out=new Map();for(const[j,weight]of weights){let mapped=j;const branch=legOf(j);if(surface!=='axial'&&branch&&branch!==surface&&!commonInfluences.has(j))mapped=surface+j.slice(branch.length);while(!permitted.has(mapped)&&mapped)mapped=parents.get(mapped);need(mapped,'weight without an anatomical ancestor');out.set(mapped,(out.get(mapped)??0)+weight);}const total=[...out.values()].reduce((n,x)=>n+x,0);return [...out].map(([j,n])=>[j,n/total]);};
 const mapVertex=(part,index)=>{need(Number.isInteger(index)&&index>=0&&index<originals.length,'field reference');const surface=surfaceFor(part,index),key=surface+':'+index;if(keys.has(key))return keys.get(key);const old=originals[index],i=vertices.length,weights=remapWeights(old.weights,surface);need(i<40000,'field vertex budget');
  const paw=surface==='axial'?null:weights.find(([j,n])=>j===surface+'Paw'&&n>=.8);vertices.push({...old,weights:paw?[[paw[0],1]]:weights});keys.set(key,i);sources.push(index);surfaces.push(surface);if(paw)pins.push(i);return i;};
 const addTriangle=triangle=>{const key=triangle.slice().sort((a,b)=>a-b).join(',');if(!triangleKeys.has(key)){triangleKeys.add(key);triangles.push(...triangle);}};
 let explicitFaces=0;
 const parts=skin.parts.map(p=>{const source=sourceParts.get(p.id);need(source?.kind==='part','missing part owner');const mapped={...p,vertices:p.vertices.map(v=>{const triangle=v.triangle.map(i=>mapVertex(source,i));addTriangle(triangle);return {...v,triangle};})};
  if(p.fieldTriangles!==undefined){need(Array.isArray(p.fieldTriangles)&&p.fieldTriangles.length===p.indices.length,'part face provenance');mapped.fieldTriangles=p.fieldTriangles.map(i=>mapVertex(source,i));for(let i=0;i<mapped.fieldTriangles.length;i+=3){addTriangle(mapped.fieldTriangles.slice(i,i+3));explicitFaces++;}}
  return mapped;});
 const contacts=compilePawContactPins({vertices,parts},binding.parts,contactContours),existingPins=new Set(pins);
 for(const[index,joint]of contacts.constraints){need(surfaces[index]===legOf(joint),'contact reached another anatomical surface');if(existingPins.has(index))need(vertices[index].weights.length===1&&vertices[index].weights[0][0]===joint,'conflicting contact pin');else{pins.push(index);existingPins.add(index);}vertices[index].weights=[[joint,1]];}
 pins.sort((a,b)=>a-b);
 const neighbours=vertices.map(()=>new Map());for(let k=0;k<triangles.length;k+=3)for(const[a,b]of[[triangles[k],triangles[k+1]],[triangles[k+1],triangles[k+2]],[triangles[k+2],triangles[k]]]){const d=Math.hypot(vertices[a].x-vertices[b].x,vertices[a].y-vertices[b].y);need(d>0,'degenerate edge');neighbours[a].set(b,1/d);neighbours[b].set(a,1/d);}
 const jointIndex=new Map(inventory.map((j,i)=>[j,i])),count=inventory.length,locked=new Set(pins);let weights=new Float64Array(vertices.length*count);
 vertices.forEach((v,i)=>v.weights.forEach(([j,n])=>weights[i*count+jointIndex.get(j)]=n));
 for(let iteration=0;iteration<diffusionIterations;iteration++){const next=weights.slice();for(let i=0;i<vertices.length;i++){if(locked.has(i))continue;const adjacent=neighbours[i],total=[...adjacent.values()].reduce((n,v)=>n+v,0),permitted=allowed.get(surfaces[i]);need(total>0,'isolated field vertex');let sum=0;for(let j=0;j<count;j++){if(!permitted.has(inventory[j])){next[i*count+j]=0;continue;}let averaged=0;for(const [n,q]of adjacent)averaged+=weights[n*count+j]*q;const value=weights[i*count+j]*.5+averaged/total*.5;next[i*count+j]=value;sum+=value;}need(sum>0,'empty diffused influence');for(let j=0;j<count;j++)next[i*count+j]/=sum;}weights=next;}
 let maxDiscardedWeight=0;vertices.forEach((v,i)=>{const all=inventory.map((j,k)=>[j,weights[i*count+k]]).filter(([,q])=>q>1e-12).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:a[0]>b[0]?1:0)),kept=all.slice(0,8),sum=kept.reduce((n,[,q])=>n+q,0);maxDiscardedWeight=Math.max(maxDiscardedWeight,1-sum);v.weights=kept.map(([j,q])=>[j,q/sum]);});
 // Reindexing is proved against the source interpolation, including clipped
 // edge vertices. No guessed UV, recolour, hidden patch or source image write.
 let differentCoordinates=0;for(let k=0;k<parts.length;k++)for(let v=0;v<parts[k].vertices.length;v++){const a=skin.parts[k].vertices[v],b=parts[k].vertices[v];for(const axis of ['x','y']){const before=a.triangle.reduce((n,i,q)=>n+originals[i][axis]*a.barycentric[q],0),after=b.triangle.reduce((n,i,q)=>n+vertices[i][axis]*b.barycentric[q],0);if(before!==after)differentCoordinates++;}}
 need(differentCoordinates===0,'source interpolation changed');
 binding.paintSkin={...skin,vertices,parts,triangles,solver:{iterations:4,globalIterations:4,targetWeight:.35,pins}};
 const {bindingHash,...body}=binding;binding.bindingHash=await hashJSON(body);
 return{binding,receipt:{schema:'cf.anatomical-surface-intake/v1',sourceBindingHash:input.bindingHash,recordRecipeHash:record.recipeHash,atlasSha256:binding.atlasSha256,sourceVertices:originals.length,vertices:vertices.length,triangles:triangles.length/3,surfaces:Object.fromEntries(['axial',...LEGS].map(s=>[s,surfaces.filter(x=>x===s).length])),pins:pins.length,contacts:contacts.receipt,physicalSkinAdjacency:{axialInfluences:'all surfaces share axial plus proximal Root/Knee influence space; distal Ankle/Paw remain branch-exclusive',rule:'all axial/upper-leg source cuts share field support; independent limbs and distal crossings remain split',classes:adjacencyClasses,socketPairs:Object.fromEntries(socketPairs)},explicitPartFaces:explicitFaces,attachmentSockets:Object.fromEntries(LEGS.map(id=>[id,{edges:socketEdges.get(id),fieldSupports:sockets.get(id).size}])),diffusionIterations,maxDiscardedWeight,sourceInterpolationDifferentCoordinates:differentCoordinates,unchangedPartCount:binding.parts.length,nativeAcceptance:false},vertexSources:sources,vertexSurfaces:surfaces};
}
