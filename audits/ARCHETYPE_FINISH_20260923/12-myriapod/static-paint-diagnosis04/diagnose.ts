/** Three exact attempted canonical poses only; no row replay or acceptance. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compileBodyCard,buildTimeline,createGsapPlayer} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports,predictContactSupport,contactPaintDriftPx} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/arap-skin.mjs';
import {applyPaintPart,assertPaintPartShape} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/paint-skin.mjs';
const base='/Users/nick/Projects/celestial-frontier-openai-mac/audits/ARCHETYPE_FINISH_20260923/12-myriapod',out=path.join(base,'static-paint-diagnosis04/report.json');
assert(!fs.existsSync(out),'New diagnostic output required');
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map();
const read=rel=>{const file=path.join(base,rel),bytes=fs.readFileSync(file);inputs.set(file,sha(bytes));return JSON.parse(bytes.toString());};
const record=read('fit-07/record.json'),binding=read('fit-07/binding.json'),original=read('static-04.json'),pre=read('fit-07/pre-regional-binding.json'),regions=read('fit-07/regional-authoring-receipt.json');
assert.equal(record.recipeHash,original.recordRecipeHash);assert.equal(binding.bindingHash,original.bindingHash);
const skin=binding.paintSkin,w=record.geometry.width,h=record.geometry.height,pins=new Set(skin.solver.pins),prePins=new Set(pre.paintSkin.solver.pins);
const card=compileBodyCard(record,record.genome),program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks),compiled=createCompiledSkinField(skin,w,h),supports=observedContactSupports(record,binding);
const triKey=tri=>tri.slice().sort((a,b)=>a-b).join(','),triangleOwners=new Map(),vertexOwners=new Map();
for(const part of skin.parts){for(let k=0;k<part.fieldTriangles.length;k+=3){const key=triKey(part.fieldTriangles.slice(k,k+3));if(!triangleOwners.has(key))triangleOwners.set(key,new Set());triangleOwners.get(key).add(part.id);}for(const v of part.vertices)for(const i of v.triangle){if(!vertexOwners.has(i))vertexOwners.set(i,new Set());vertexOwners.get(i).add(part.id);}}
const area=(xy,tri)=>(xy[tri[1]*2]-xy[tri[0]*2])*(xy[tri[2]*2+1]-xy[tri[0]*2+1])-(xy[tri[1]*2+1]-xy[tri[0]*2+1])*(xy[tri[2]*2]-xy[tri[0]*2]);
const findings=[];
for(const [action,expectedMs]of [['hit',26.25],['dodge',23.333333333333332]]){
 const row=original.rows.find(r=>r.id===action),firstRefusal=row.firstRefusal,tl=buildTimeline(card,action,record.identity.seed),sampleT=tl.durationMs*firstRefusal.sampleIndex/120;
 assert.equal(sampleT,expectedMs);assert.equal(firstRefusal.ms,sampleT);
 const scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),target=new Float32Array(skin.vertices.length*2),field=new Float32Array(target.length).fill(123),positions={};
 let rawPose,attemptedPose,lastContact,phase,matrices,stage='sampling',error=null,gsapPose={};
 const contact=createFamilyContactSolver(record,supports),gsap=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){gsapPose[j]={rotation,dx,dy};}},{now:()=>0});
 const rig={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(pose){attemptedPose=structuredClone(pose);matrices=program.evaluate(pose);applyCompiledSkinField(compiled,matrices,target);stage='arap';solveArapSkin(scratch,target,field);stage='part-publication';for(const p of skin.parts){const buf=new Float32Array(p.vertices.length*2);applyPaintPart(p,field,buf);assertPaintPartShape(p,skin,buf,w,h);positions[p.id]=buf;}}};
 const owner=createCreatureRigPerformance(record,rig,[{id:action,durationMs:tl.durationMs,loop:tl.loop,dispose(){},seek(ms,t){gsapPose={};gsap.seek(ms);for(const[j,k]of Object.entries(gsapPose))t.setJoint(j,k.rotation,k.dx,k.dy);}}]);
 const marks=contact.chains.map(chain=>{const p=skin.parts.find(p=>p.id===binding.parts.find(p=>p.joint===chain.end)?.id);let best=null;p.vertices.forEach((v,index)=>{const xy=[0,0];for(let k=0;k<3;k++){xy[0]+=skin.vertices[v.triangle[k]].x*v.barycentric[k]/w;xy[1]+=skin.vertices[v.triangle[k]].y*v.barycentric[k]/h;}const end=record.landmarks[chain.end],distance=Math.hypot(xy[0]-end[0],xy[1]-end[1]);if(!best||distance<best.distance)best={joint:chain.end,part:p.id,index,xy,distance};});return best;});
 let painted=[];
 try{owner.play(action,0,0);owner.update(sampleT,(pose,context)=>{rawPose=structuredClone(pose);phase={...context,actionId:tl.actionId,realm:card.realm,...tl.actionId.startsWith('melee:')?{travel:'stage'}:{}};stage='contact';lastContact=contact.resolve(pose,phase);return lastContact.pose;});stage='painted-contact';
  painted=lastContact.contacts.filter(c=>c.stance).map(c=>{const mark=marks.find(m=>m.joint===c.joint),p=positions[mark.part],current=[p[mark.index*2],p[mark.index*2+1]],drift=contactPaintDriftPx(current,mark.xy,[c.target.x,c.target.y],record.landmarks[c.joint],[w,h]);return {joint:c.joint,drift,mark,current,contact:c};});
  const failed=painted.find(p=>p.drift>.25);if(failed)throw Error('Contact paint drift '+failed.joint+': '+failed.drift);
 }catch(e){error=String(e);}finally{gsap.stop();owner.dispose();}
 const vertex=i=>({index:i,restPx:[skin.vertices[i].x,skin.vertices[i].y],targetPx:[target[i*2]*w,target[i*2+1]*h],privateSolvedPx:[scratch.position[i*2],scratch.position[i*2+1]],publishedPx:field[0]===123?null:[field[i*2]*w,field[i*2+1]*h],pinned:pins.has(i),inheritedPin:prePins.has(i),weights:skin.vertices[i].weights,preRegionalWeights:pre.paintSkin.vertices[i].weights,regionalSelections:(regions.regions??[]).filter(r=>r.vertexIndices.includes(i)).map(r=>({id:r.id,joint:r.joint,pin:r.pin})),parts:[...(vertexOwners.get(i)??[])]});
 const nearbyPins=ids=>{let ns=new Set(ids);for(let round=0;round<2;round++){const next=new Set(ns);for(const i of ns)for(let j=scratch.starts[i];j<scratch.starts[i+1];j++)next.add(scratch.neighbours[j]);ns=next;}return [...ns].filter(i=>pins.has(i)).sort((a,b)=>a-b).map(vertex);};
 const folded=[];for(let k=0;k<skin.triangles.length;k+=3){const tri=skin.triangles.slice(k,k+3),ratio=area(scratch.position,tri)/scratch.areas[k/3];if(Number.isFinite(ratio)&&ratio>0)continue;folded.push({triangle:k/3,indices:tri,parts:[...(triangleOwners.get(triKey(tri))??[])],ratio,targetRatio:area(scratch.target,tri)/scratch.areas[k/3],vertices:tri.map(vertex),nearbyPins:nearbyPins(tri)});}
 const failedSupport=painted.filter(p=>p.drift>.25).map(p=>{const model=supports[p.joint],part=skin.parts.find(part=>part.id===p.mark.part),v=part.vertices[p.mark.index],predicted=predictContactSupport(model,matrices),fromTarget=[0,0];for(let k=0;k<3;k++){fromTarget[0]+=target[v.triangle[k]*2]*v.barycentric[k];fromTarget[1]+=target[v.triangle[k]*2+1]*v.barycentric[k];}const projectedFloat32=[Math.fround(fromTarget[0]),Math.fround(fromTarget[1])];return {...p,model,staticAndSolverSameVertex:model.surface.partId===p.mark.part&&model.surface.vertexIndex===p.mark.index,predicted,projectedFloat32,lbsPredictedDrift:contactPaintDriftPx([predicted.x,predicted.y],p.mark.xy,[p.contact.target.x,p.contact.target.y],record.landmarks[p.joint],[w,h]),float32TargetDrift:contactPaintDriftPx(projectedFloat32,p.mark.xy,[p.contact.target.x,p.contact.target.y],record.landmarks[p.joint],[w,h]),arapDisplacementPx:[(p.current[0]-projectedFloat32[0])*w,(p.current[1]-projectedFloat32[1])*h],partVertex:v,contributingField:v.triangle.map((i,k)=>({barycentric:v.barycentric[k],...vertex(i)})),nearbyPins:nearbyPins(v.triangle)};});
 const parts={};for(const f of folded)for(const p of f.parts)parts[p]=(parts[p]??0)+1;
 const ps=folded.flatMap(f=>f.vertices.map(v=>v.restPx)),bounds=ps.length?[Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>p[1])),Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))]:null;
 const reproduced=error===firstRefusal.error.split('\n')[0]&&JSON.stringify(scratch.stats)===JSON.stringify(firstRefusal.arapStats);
 findings.push({action,sampleT,durationMs:tl.durationMs,phase,firstRefusal,rawPose,attemptedPose,recordedPoseEqualsAttempt:JSON.stringify(attemptedPose)===JSON.stringify(firstRefusal.pose),reconstructedContactEqualsRecorded:JSON.stringify(lastContact)===JSON.stringify(firstRefusal.contact),replayedError:error,reproduced,stage,stats:{...scratch.stats},outputUnpublished:field.every(v=>v===123),foldParts:parts,foldBounds:bounds,folded,paintedContacts:painted,failedSupport});
}
// Additional bounded diagnostic: canonical targets only, never ARAP/publication.
const targetScan={scope:'121 canonical target samples for each of hit/dodge only; no ARAP solve, row acceptance or published geometry',samplesPerAction:121,rows:[],triangles:[]};
const union=new Map(),restPixels=new Float64Array(skin.vertices.flatMap(v=>[v.x,v.y])),fullyPinned=[];
for(let k=0;k<skin.triangles.length;k+=3){const ids=skin.triangles.slice(k,k+3);if(ids.every(i=>pins.has(i)))fullyPinned.push({triangle:k/3,indices:ids,restArea:area(restPixels,ids)});}
for(const action of ['hit','dodge']){
 const tl=buildTimeline(card,action,record.identity.seed);let sampled={},raw,phase,lastContact,matrices;
 const gsap=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){sampled[j]={rotation,dx,dy};}},{now:()=>0});
 const target=new Float32Array(skin.vertices.length*2),pixelTargets=new Float64Array(target.length),contact=createFamilyContactSolver(record,supports);
 const rig={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(pose){matrices=program.evaluate(pose);applyCompiledSkinField(compiled,matrices,target);for(let i=0;i<skin.vertices.length;i++){pixelTargets[i*2]=target[i*2]*w;pixelTargets[i*2+1]=target[i*2+1]*h;}}};
 const owner=createCreatureRigPerformance(record,rig,[{id:action,durationMs:tl.durationMs,loop:tl.loop,dispose(){},seek(ms,t){sampled={};gsap.seek(ms);for(const[j,k]of Object.entries(sampled))t.setJoint(j,k.rotation,k.dx,k.dy);}}]);
 owner.play(action,0,0);const row={action,durationMs:tl.durationMs,attemptedSamples:0,targetSamples:0,fullyPinnedTriangles:fullyPinned.length,invertedSampleCount:0,events:[],errors:[]};
 try{for(let sampleIndex=0;sampleIndex<=120;sampleIndex++){
  const ms=tl.durationMs*sampleIndex/120;row.attemptedSamples++;raw=null;lastContact=null;phase=null;
  try{owner.update(ms,(pose,context)=>{raw=structuredClone(pose);phase={...context,actionId:tl.actionId,realm:card.realm,...tl.actionId.startsWith('melee:')?{travel:'stage'}:{}};lastContact=contact.resolve(pose,phase);return lastContact.pose;});row.targetSamples++;
   const inversions=[];for(const tri of fullyPinned){const ratio=area(pixelTargets,tri.indices)/tri.restArea;if(Number.isFinite(ratio)&&ratio>0)continue;
    if(!union.has(tri.triangle))union.set(tri.triangle,{...tri,parts:[...(triangleOwners.get(triKey(tri.indices))??[])],vertices:tri.indices.map(index=>({index,restPx:[skin.vertices[index].x,skin.vertices[index].y],weights:skin.vertices[index].weights,pinned:true,inheritedPin:prePins.has(index),regionalSelections:(regions.regions??[]).filter(r=>r.vertexIndices.includes(index)).map(r=>({id:r.id,joint:r.joint,pin:r.pin})),parts:[...(vertexOwners.get(index)??[])]})),events:[]});
    const entry={action,sampleIndex,ms,ratio,targetPx:tri.indices.map(i=>[pixelTargets[i*2],pixelTargets[i*2+1]])};union.get(tri.triangle).events.push(entry);inversions.push({triangle:tri.triangle,...entry});
   }if(inversions.length){row.invertedSampleCount++;row.events.push({sampleIndex,ms,phase,rawPose:raw,resolvedPose:structuredClone(lastContact.pose),inversions});}
  }catch(error){row.errors.push({sampleIndex,ms,phase,rawPose:raw,contact:lastContact,error:String(error.stack??error),name:error.name,code:error.code??null,cause:error.cause?String(error.cause.stack??error.cause):null});}
 }}finally{gsap.stop();owner.dispose();}targetScan.rows.push(row);
}
targetScan.triangles=[...union.values()].sort((a,b)=>a.triangle-b.triangle);
const receipt={schema:'cf.attempted-static-paint-diagnosis/v1',scope:'Exactly hit 26.25 ms and dodge 23.333333333333332 ms reconstructed through canonical timeline/GSAP/performance/contact; no report-pose input, row replay, changed fit or acceptance',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,findings,targetScan,inputs:[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}))};
assert(receipt.inputs.every(x=>x.unchanged));fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:out,findings:findings.map(f=>({action:f.action,reproduced:f.reproduced,error:f.replayedError,foldParts:f.foldParts,foldBounds:f.foldBounds,drifts:f.failedSupport.map(s=>({joint:s.joint,drift:s.drift,sameVertex:s.staticAndSolverSameVertex,lbs:s.lbsPredictedDrift,float32:s.float32TargetDrift,arapDisplacement:s.arapDisplacementPx}))}))},null,2));
if(findings.some(f=>!f.reproduced))process.exitCode=1;

console.log(JSON.stringify({firstFailureClasses:findings.map(f=>({action:f.action,folds:f.folded.length,allPinned:f.folded.filter(t=>t.vertices.every(v=>v.pinned)).length,targetAlreadyFolded:f.folded.filter(t=>t.targetRatio<=0).length,parts:[...new Set(f.folded.flatMap(t=>t.parts))]})),targetScan:targetScan.rows.map(r=>({action:r.action,attempted:r.attemptedSamples,targets:r.targetSamples,invertedSamples:r.invertedSampleCount,errors:r.errors.length})),unionCount:targetScan.triangles.length,unionParts:[...new Set(targetScan.triangles.flatMap(t=>t.parts))]},null,2));
