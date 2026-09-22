/** Twelve retained resolved native poses, changed-fit diagnosis only; no CPU certificate. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=import.meta.dirname,root=path.resolve(base,'../../..'),out=path.join(base,'sparse-fit-comparison-07.json');
assert(!fs.existsSync(out),'A new comparison output is required');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),inputs=new Map();
const read=file=>{const p=path.resolve(base,file),bytes=fs.readFileSync(p);inputs.set(p,sha(bytes));return bytes;};
const json=file=>JSON.parse(read(file));
read(import.meta.filename);
const retained=json('cpu-diagnosis-02.json'),priorSources=json('cpu-diagnosis-02.sources.json');
assert.equal(retained.planParity,'EXACT');
assert.deepEqual(retained.requestedMs,[0,1206,2333.2,4466.666666666666,8583,8783]);
assert.deepEqual(retained.findings.map(f=>[f.ms,f.side]),retained.requestedMs.flatMap(ms=>[[ms,'left'],[ms,'right']]));
for(const s of priorSources.filter(s=>s.file.startsWith(path.join(root,'port/v2/'))))assert.equal(sha(read(s.file)),s.sha256,'Diagnostic owner changed: '+s.file);
const oldRecord=json('fit-05/record.json'),oldBinding=json('fit-05/binding.json'),record=json('fit-07/record.json'),binding=json('fit-07/binding.json');
for(const file of ['fit-05/record.json','fit-05/binding.json']){
  const prior=retained.inputs.find(i=>i.file===path.join(base,file));assert(prior,'Missing prior input '+file);assert.equal(inputs.get(prior.file),prior.sha256);
}
assert.equal(retained.recordRecipeHash,oldRecord.recipeHash);assert.equal(retained.bindingHash,oldBinding.bindingHash);
assert.equal(binding.recordRecipeHash,record.recipeHash);
// Only painter source/provenance and their recipe hash may differ. This also seals
// geometry, identity, anatomy, landmarks, genome, materials and the family template.
const semantics=r=>Object.fromEntries(Object.entries(r).filter(([key])=>!['source','provenance','recipeHash'].includes(key)));
assert.deepEqual(semantics(record),semantics(oldRecord),'Changed resolved-pose/body semantics');
const partSemantics=b=>b.parts.map(({id,joint,layer,kind})=>({id,joint,layer,kind}));
assert.deepEqual(partSemantics(binding),partSemantics(oldBinding),'Part joint/layer/kind semantics changed');
const solverOptions=b=>Object.fromEntries(Object.entries(b.paintSkin.solver).filter(([key])=>key!=='pins'));
assert.deepEqual(solverOptions(binding),solverOptions(oldBinding),'Solver options changed');
assert(!binding.seamBridges?.groups?.length&&!oldBinding.seamBridges?.groups?.length,'Unsupported seam bridges');
const [{familyContractForRecord},{createSkeletonPoseProgram},{createCompiledSkinField,applyCompiledSkinField},{createArapScratch,solveArapSkin},{applyPaintPart,paintPartAreas,assertPaintPartShape},{compileRigidParentFrames,applyRigidParentFrames}]=await Promise.all([
  import('../../../port/v2/tools/creature-animation/family-contracts.mjs'),
  import('../../../port/v2/tools/creature-animation/skeleton-pose.mjs'),
  import('../../../port/v2/tools/creature-animation/compiled-skin-field.mjs'),
  import('../../../port/v2/tools/creature-animation/arap-skin.mjs'),
  import('../../../port/v2/tools/creature-animation/paint-skin.mjs'),
  import('../../../port/v2/tools/creature-animation/rigid-parent-frame.mjs'),
]);
assert.deepEqual(familyContractForRecord(record),familyContractForRecord(oldRecord));
const skin=binding.paintSkin,w=record.geometry.width,h=record.geometry.height,definition=familyContractForRecord(record);
const actors=Object.fromEntries(['left','right'].map(side=>{
  const program=createSkeletonPoseProgram(definition,record.landmarks),compiled=createCompiledSkinField(skin,w,h),scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),field=new Float32Array(skin.vertices.length*2),target=field.slice(),rigid=compileRigidParentFrames(skin,binding.parts,definition,w,h);
  const surfaces=skin.parts.map(part=>({part,pending:new Float32Array(part.vertices.length*2),positions:new Float32Array(part.vertices.length*2),areas:paintPartAreas(part,skin)}));
  return [side,{program,compiled,scratch,field,target,rigid,surfaces}];
}));
const triKey=t=>[...t].sort((a,b)=>a-b).join(','),owners=new Map();
for(const p of skin.parts)for(let k=0;k<p.fieldTriangles.length;k+=3){const key=triKey(p.fieldTriangles.slice(k,k+3));if(!owners.has(key))owners.set(key,new Set());owners.get(key).add(p.id);}
const area=(p,a,b,c)=>(p[b*2]-p[a*2])*(p[c*2+1]-p[a*2+1])-(p[b*2+1]-p[a*2+1])*(p[c*2]-p[a*2]);
const counts=(scratch)=>{
  const partCounts={},faces=[];
  if(!scratch.stats.rigid)for(let k=0;k<skin.triangles.length;k+=3){const t=skin.triangles.slice(k,k+3),ratio=area(scratch.rhs,...t)/scratch.areas[k/3];if(ratio>=scratch.minimumAreaRatio)continue;const parts=[...(owners.get(triKey(t))??[])];for(const id of parts)partCounts[id]=(partCounts[id]??0)+1;faces.push({triangle:k/3,parts,preRatio:ratio});}
  return {preOrientationViolatingFaceCount:faces.length,partCounts,preOrientationFaces:faces};
};
const findings=[];
for(const f of retained.findings){
  const a=actors[f.side],pose=structuredClone(f.resolvedPose);let refusal=null,phase='pose',solved=false;
  try{
    const matrices=a.program.evaluate(pose);phase='compiled-field';applyCompiledSkinField(a.compiled,matrices,a.target);
    phase='arap';solveArapSkin(a.scratch,a.target,a.field);solved=true;
    phase='paint-parts';for(const e of a.surfaces)applyPaintPart(e.part,a.field,e.pending);
    phase='rigid-parent';if(a.rigid.length)applyRigidParentFrames(a.rigid,matrices,Object.fromEntries(a.surfaces.map(e=>[e.part.id,e.pending])));
    phase='shape-assertion';for(const e of a.surfaces)assertPaintPartShape(e.part,skin,e.pending,w,h,e.areas);
    phase='float32-publication';for(const e of a.surfaces)e.positions.set(e.pending);
  }catch(error){refusal={phase,name:error.name,message:error.message,code:error.code??null};}
  const stats=solved?{...a.scratch.stats}:null,queue=solved&&!stats.rigid?{visits:a.scratch.orientationQueue.visits,projections:a.scratch.orientationQueue.projections,stalled:a.scratch.orientationQueue.stalled,remaining:a.scratch.orientationQueue.size}:null;
  findings.push({ms:f.ms,side:f.side,turn:f.turn,phase:f.phase,resolvedPoseSha256:sha(JSON.stringify(pose)),baseline:{stats:f.stats,orientationQueue:f.orientationQueue,preOrientationViolatingFaceCount:f.preOrientationViolatingFaceCount,partCounts:f.partCounts,fieldSha256:f.fieldSha256},candidate:{stats,orientationQueue:queue,...(solved?counts(a.scratch):{}),fieldSha256:solved?sha(Buffer.from(a.field.buffer)):null,published:!refusal,refusal},delta:stats?{orientationPasses:stats.orientationPasses-f.stats.orientationPasses,visits:(queue?.visits??0)-(f.orientationQueue?.visits??0),projections:(queue?.projections??0)-(f.orientationQueue?.projections??0)}:null});
}
const receipt={schema:'cf.sparse-changed-fit-comparison/v1',scope:'Fit-07 only: replay the twelve retained native resolved poses against the unchanged pose/ARAP/publication owners. Fit-05 numbers are historical recorded diagnosis, not rerun. No stage battery, film, or CPU certificate.',semanticsParity:'EXACT',baseline:{recordRecipeHash:oldRecord.recipeHash,bindingHash:oldBinding.bindingHash},candidate:{recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,vertices:skin.vertices.length,triangles:skin.triangles.length/3,pins:skin.solver.pins.length},findings,refusals:findings.filter(f=>f.candidate.refusal).map(f=>({ms:f.ms,side:f.side,...f.candidate.refusal})),inputs:[...inputs].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}))};
assert(receipt.inputs.every(i=>i.unchanged),'Inputs changed during comparison');
fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:out,semanticsParity:receipt.semanticsParity,candidate:receipt.candidate,refusals:receipt.refusals,findings:findings.map(f=>({ms:f.ms,side:f.side,old:{passes:f.baseline.stats.orientationPasses,visits:f.baseline.orientationQueue?.visits??0,projections:f.baseline.orientationQueue?.projections??0,preFloor:f.baseline.preOrientationViolatingFaceCount},candidate:{passes:f.candidate.stats?.orientationPasses,visits:f.candidate.orientationQueue?.visits,projections:f.candidate.orientationQueue?.projections,preFloor:f.candidate.preOrientationViolatingFaceCount,partCounts:f.candidate.partCounts,refusal:f.candidate.refusal}}))},null,2));
if(receipt.refusals.length)process.exitCode=1;
