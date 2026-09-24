/** One changed-source pass over twelve retained poses; diagnostic Node costs only. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
const base=import.meta.dirname,root=path.resolve(base,'../../..'),owner=path.join(root,'port/v2/tools/creature-animation'),out=path.join(base,'node-cost-breakdown-01.json');
assert(!fs.existsSync(out),'Fresh diagnostic output required');
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=new Map(),sources=new Map();
const read=file=>{const absolute=path.resolve(base,file),bytes=fs.readFileSync(absolute);inputs.set(absolute,sha(bytes));return bytes;},json=file=>JSON.parse(read(file));
read(import.meta.filename);
// Capture owner sources before any runtime module import, and verify them after
// the single pose sequence. The broader animation directory includes every
// transitive JS/TS leaf and its compiled C/Wasm producer artifacts.
for(const name of fs.readdirSync(owner))if(!name.includes('.test.')&&/\.(?:mjs|ts|c|wasm)$|-(?:build)\.json$/.test(name)){const file=path.join(owner,name);if(fs.statSync(file).isFile())sources.set(file,sha(fs.readFileSync(file)));}
const retained=json('cpu-diagnosis-02.json'),baseline=json('sparse-fit-comparison-08.json'),record=json('fit-08/record.json'),binding=json('fit-08/binding.json');
assert.equal(retained.planParity,'EXACT');assert.equal(baseline.semanticsParity,'EXACT');
assert.equal(record.recipeHash,baseline.candidate.recordRecipeHash);assert.equal(binding.bindingHash,baseline.candidate.bindingHash);assert.equal(binding.recordRecipeHash,record.recipeHash);
const requested=[0,1206,2333.2,4466.666666666666,8583,8783];
assert.deepEqual(retained.findings.map(f=>[f.ms,f.side]),requested.flatMap(ms=>[[ms,'left'],[ms,'right']]));
assert.deepEqual(baseline.findings.map(f=>[f.ms,f.side]),retained.findings.map(f=>[f.ms,f.side]));
assert(!binding.seamBridges?.groups?.length,'Unsupported seam bridges');
const [{familyContractForRecord},{createSkeletonPoseProgram},{createCompiledSkinField,applyCompiledSkinField},{createArapScratch,solveArapSkin},{applyPaintPart,paintPartAreas,assertPaintPartShape},{compileRigidParentFrames,applyRigidParentFrames}]=await Promise.all([
 import('../../../port/v2/tools/creature-animation/family-contracts.mjs'),import('../../../port/v2/tools/creature-animation/skeleton-pose.mjs'),import('../../../port/v2/tools/creature-animation/compiled-skin-field.mjs'),import('../../../port/v2/tools/creature-animation/arap-skin.mjs'),import('../../../port/v2/tools/creature-animation/paint-skin.mjs'),import('../../../port/v2/tools/creature-animation/rigid-parent-frame.mjs'),
]);
const skin=binding.paintSkin,w=record.geometry.width,h=record.geometry.height,definition=familyContractForRecord(record),actors={},setup=[];
for(const side of ['left','right']){
 const start=performance.now(),program=createSkeletonPoseProgram(definition,record.landmarks),compiled=createCompiledSkinField(skin,w,h),scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),field=new Float32Array(skin.vertices.length*2),target=field.slice(),rigid=compileRigidParentFrames(skin,binding.parts,definition,w,h),surfaces=skin.parts.map(part=>({part,pending:new Float32Array(part.vertices.length*2),positions:new Float32Array(part.vertices.length*2),areas:paintPartAreas(part,skin)}));
 const originalForward=scratch.orientationKernel,originalActive=scratch.orientationActiveKernel;assert.equal(originalForward?.kind,'wasm');assert.equal(originalActive?.kind,'wasm');
 const actor={program,compiled,scratch,field,target,rigid,surfaces,measurement:null};
 const forwardWrapper=Object.freeze({kind:originalForward.kind,byteLength:originalForward.byteLength,get stalled(){return originalForward.stalled;},run(...args){const begin=performance.now();try{return originalForward.run(...args);}finally{actor.measurement.forwardMs+=performance.now()-begin;actor.measurement.forwardCalls++;}}});
 const activeWrapper=Object.freeze({kind:originalActive.kind,byteLength:originalActive.byteLength,run(...args){const begin=performance.now();try{return originalActive.run(...args);}finally{actor.measurement.activeMs+=performance.now()-begin;actor.measurement.activeCalls++;}}});
 scratch.orientationKernel=forwardWrapper;scratch.orientationActiveKernel=activeWrapper;actor.forwardWrapper=forwardWrapper;actor.activeWrapper=activeWrapper;actors[side]=actor;setup.push({side,milliseconds:performance.now()-start});
}
const timed=fn=>{const start=performance.now(),value=fn();return{value,ms:performance.now()-start};},bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength),findings=[];
for(let index=0;index<retained.findings.length;index++){
 const f=retained.findings[index],old=baseline.findings[index],a=actors[f.side],pose=structuredClone(f.resolvedPose);assert.equal(sha(JSON.stringify(pose)),old.resolvedPoseSha256);
 a.measurement={forwardMs:0,forwardCalls:0,activeMs:0,activeCalls:0};
 const begin=performance.now(),poseStage=timed(()=>a.program.evaluate(pose)),matrices=poseStage.value;
 const fieldStage=timed(()=>applyCompiledSkinField(a.compiled,matrices,a.target));
 const arapStage=timed(()=>solveArapSkin(a.scratch,a.target,a.field));
 const partStage=timed(()=>{for(const e of a.surfaces)applyPaintPart(e.part,a.field,e.pending);});
 const rigidStage=timed(()=>{if(a.rigid.length)applyRigidParentFrames(a.rigid,matrices,Object.fromEntries(a.surfaces.map(e=>[e.part.id,e.pending])));});
 const assertionStage=timed(()=>{for(const e of a.surfaces)assertPaintPartShape(e.part,skin,e.pending,w,h,e.areas);});
 const publicationStage=timed(()=>{for(const e of a.surfaces)e.positions.set(e.pending);});
 const completePoseMs=performance.now()-begin,stats={...a.scratch.stats},fieldSha256=sha(bytes(a.field));
 assert.deepEqual(stats,old.candidate.stats,f.ms+'/'+f.side+' stats');assert.equal(fieldSha256,old.candidate.fieldSha256,f.ms+'/'+f.side+' field bytes');
 assert.equal(a.scratch.orientationKernel,a.forwardWrapper,'Forward backend fell back');assert.equal(a.scratch.orientationActiveKernel,a.activeWrapper,'Active backend fell back');
 if(a.scratch.orientationQueue.visits>0)assert.equal(a.measurement.activeCalls,1,'Actual active work must be timed');
 assert.equal(a.measurement.forwardCalls,stats.rigid?0:1);
 const timing={poseMs:poseStage.ms,fieldMs:fieldStage.ms,arapMs:arapStage.ms,...a.measurement,arapOtherMs:arapStage.ms-a.measurement.forwardMs-a.measurement.activeMs,paintPartsMs:partStage.ms,rigidParentMs:rigidStage.ms,shapeAssertionsMs:assertionStage.ms,publicationMs:publicationStage.ms,paintTotalMs:partStage.ms+rigidStage.ms+assertionStage.ms+publicationStage.ms,completePoseMs};
 findings.push({ms:f.ms,side:f.side,phase:f.phase,status:'EXACT',resolvedPoseSha256:old.resolvedPoseSha256,fieldSha256,stats,queue:{visits:a.scratch.orientationQueue.visits,projections:a.scratch.orientationQueue.projections,stalled:a.scratch.orientationQueue.stalled,size:a.scratch.orientationQueue.size},timing,publishedParts:a.surfaces.map(e=>({id:e.part.id,sha256:sha(bytes(e.positions))}))});
}
const identities=map=>[...map].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));
const result={schema:'cf.node-single-pose-cost-diagnosis/v1',scope:'Node cold single-pose diagnostic: each of the twelve retained resolved poses executes once, in retained order, using two persistent actual rigs. No warmup loop, repeated pose loop, native film, or CPU certificate. Actual kernel construction retains its existing admission probes. Wrapper clocks contribute small instrumentation overhead. Field hashes and full ARAP stats must equal the saved fit-08 results.',status:'PASS',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,setup,findings,inputs:identities(inputs),sources:identities(sources)};
assert([...result.inputs,...result.sources].every(x=>x.unchanged),'Source/input changed during diagnosis');
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:out,status:result.status,sourceFiles:result.sources.length,findings:findings.map(({ms,side,timing,queue})=>({ms,side,timing,queue}))},null,2));
