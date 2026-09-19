#!/usr/bin/env node
/** Reproducible source-preserving C2 surface preparation; no browser/inference. */
import fs from'node:fs';import path from'node:path';import{pathToFileURL}from'node:url';
import{createRequire}from'node:module';import{verifyPartsDirectory}from'./verify-parts.mjs';import{lowerPawContour}from'./paw-contact-pins.mjs';
import{createSourceJoinProbe,assessSourceJoinContinuity}from'../quadruped-proof/source-join-continuity.mjs';
import{buildPaintSkin}from'./build-paint-skin.mjs';import{splitSkinBranches}from'./split-skin-branches.mjs';
import{GRAPH,hashBytes,hashJSON}from'./quadruped-template.mjs';import{applyPaintSkin,applyPaintPart,assertPaintPartShape}from'./paint-skin.mjs';
import{createArapScratch,solveArapSkin}from'./arap-skin.mjs';import{composeAffine,rotationAround,IDENTITY_AFFINE}from'./kinematics.ts';
const root=path.resolve(import.meta.dirname,'../../../..');
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
function matrices(record,pose){const out={},length=Math.hypot(record.landmarks.chest[0]-record.landmarks.pelvis[0],record.landmarks.chest[1]-record.landmarks.pelvis[1]);for(const[j,parent]of[['root',null],...GRAPH]){const pivot=record.landmarks[parent??'root'],key=pose[j],local=key?rotationAround({x:pivot[0],y:pivot[1]},key.rotation,{x:(key.dx??0)*length,y:(key.dy??0)*length}):IDENTITY_AFFINE;out[j]=parent?composeAffine(out[parent],local):local;}return out;}
export async function prepareContinuousSkin(destination,producer){
 const out=path.resolve(destination);if(fs.existsSync(out))throw Error('New output directory required');
 const sourceDirectory=path.join(root,'audits/C2_DEFORMING_SEAMS_20260914/candidate-02'),sourceManifest=JSON.parse(fs.readFileSync(path.join(sourceDirectory,'manifest.json'))),native=JSON.parse(fs.readFileSync(path.join(root,'audits/C2_DEFORMING_SEAMS_20260914/native-hinges-03/report.json')));
 const regressionReport='audits/C2_CONTINUOUS_SKIN_20260916/native-04/report.json',regression=JSON.parse(fs.readFileSync(path.join(root,regressionReport)));
 const producerFile=path.resolve(producer,'motion/gsap-adapter.ts'),producerReference={directory:path.resolve(producer),readOnly:true,gsapAdapterSha256:await hashBytes(fs.readFileSync(producerFile))};
 fs.mkdirSync(out,{recursive:true});const write=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'}),results=[],diagnostics=[],joinDiagnostics=[];
 for(const spec of sourceManifest.results){const recordBytes=fs.readFileSync(path.join(root,spec.record)),record=JSON.parse(recordBytes),source=JSON.parse(fs.readFileSync(path.join(sourceDirectory,spec.id+'.binding.json'))),{bindingHash,...sourceBody}=source;if(await hashJSON(sourceBody)!==bindingHash)throw Error('Corrupted source seam binding: '+spec.id);
  const coarse=await buildPaintSkin(path.join(root,spec.base),source,record,{boundaryStep:24,interiorStep:64,includeTopology:true}),verified=await verifyPartsDirectory(path.join(root,spec.base)),contactContours=[];
  for(const part of coarse.binding.parts.filter(p=>p.joint.endsWith('Paw'))){const bytes=verified.sources.get(part.id),png=PNG.sync.read(bytes);contactContours.push(lowerPawContour(part,png.data,png.width,png.height,await hashBytes(bytes)));}
  const expectedPaws=Object.keys(record.landmarks).filter(j=>j.endsWith('Paw')).sort();if(JSON.stringify(contactContours.map(c=>c.joint).sort())!==JSON.stringify(expectedPaws))throw Error('Source contact inventory mismatch');
  const split=await splitSkinBranches(coarse.binding,record,{diffusionIterations:32,contactContours,attachmentEdges:coarse.ownershipEdges});
  write(spec.id+'.binding.json',split.binding);write(spec.id+'.receipt.json',{...split.receipt,sourceRecordSha256:await hashBytes(recordBytes),sourceMasterSha256:record.geometry.cutoutAssetHash,producerReference,coarse:coarse.receipt,profile:{boundaryStep:24,interiorStep:64,diffusionIterations:32,solver:split.binding.paintSkin.solver}});
  results.push({...spec,bindingHash:split.binding.bindingHash,vertices:split.receipt.vertices,parts:split.binding.parts.length,recordSha256:await hashBytes(recordBytes),sourceInterpolationDifferentCoordinates:0});
  const skin=split.binding.paintSkin,{width:w,height:h}=record.geometry,scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver),targets=new Float32Array(skin.vertices.length*2),positions=targets.slice(),frames=[];
  const atlas=PNG.sync.read(fs.readFileSync(path.join(root,spec.base,'atlas',spec.id+'.png'))),joinProbe=createSourceJoinProbe({record,binding:split.binding,atlas:{rgba:atlas.data,width:atlas.width,height:atlas.height}});
  const poses={...native.seamGates.rows.find(r=>r.id===spec.id).poses,...regression.skinGates.rows.find(r=>r.id===spec.id)?.poses};
  for(const[name,frame]of Object.entries(poses)){let error=null,sourceJoin=null;try{applyPaintSkin(skin,matrices(record,frame.pose),w,h,targets);solveArapSkin(scratch,targets,positions);const published={};for(const part of skin.parts){const p=new Float32Array(part.vertices.length*2);applyPaintPart(part,positions,p);assertPaintPartShape(part,skin,p,w,h);published[part.id]=p;}sourceJoin=assessSourceJoinContinuity(joinProbe,published);joinDiagnostics.push({id:spec.id,name,atMs:frame.atMs,...sourceJoin});if(sourceJoin.status!=='PASS')throw Error('Source cut detached: '+sourceJoin.maxGapPx+'px');}catch(e){error=String(e);}
   frames.push({name,atMs:frame.atMs,status:error?'FAIL':'PASS',error,sourceJoin:sourceJoin?{status:sourceJoin.status,maxGapPx:sourceJoin.maxGapPx,epsilonNativePx:sourceJoin.epsilonNativePx}:null,...scratch.stats});
  }diagnostics.push({id:spec.id,frames});
 }
 const status=diagnostics.every(r=>r.frames.every(f=>f.status==='PASS'))?'OFFLINE_PASS_NATIVE_PENDING':'OFFLINE_FAIL';
 write('source-joins.json',{schema:'cf.continuous-skin-source-joins/v1',status:joinDiagnostics.length&&joinDiagnostics.every(r=>r.status==='PASS')?'PASS':'FAIL',sourcePoseReport:regressionReport,rows:joinDiagnostics});
 write('manifest.json',{schema:'cf.continuous-skin-proof/v1',status,producerReference,method:'separate distal anatomical surfaces; shared physical axial/upper ownership cut sockets; pinned paw cores; inverse-length topology diffusion; bounded ARAP and orientation projection',results});
 write('offline-poses.json',{status,sourcePoseReports:['audits/C2_DEFORMING_SEAMS_20260914/native-hinges-03/report.json',regressionReport],scope:'retained actual poses plus native04 complete named-pose regressions; this does not establish native rest parity, dense temporal shape, frame time or visual acceptance',diagnostics});return{status,results:results.map(({id,vertices,parts})=>({id,vertices,parts})),diagnostics};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const[out,producer]=process.argv.slice(2);if(!out||!producer)throw Error('Usage: NEW_OUTPUT READ_ONLY_PRODUCER_SRC');const result=await prepareContinuousSkin(out,producer);console.log(JSON.stringify(result,null,2));if(result.status==='OFFLINE_FAIL')process.exitCode=1;}
