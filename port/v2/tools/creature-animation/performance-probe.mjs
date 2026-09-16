/** Actual read-only Motion compiler/GSAP -> complete-pose runtime adapter.
 * This is interop evidence, not a rendered or accepted creature. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash}from'node:crypto';import{pathToFileURL}from'node:url';import{rolldown}from'rolldown';
const [producerArg,outArg]=process.argv.slice(2);if(!producerArg||!outArg||process.argv.length!==4)throw Error('Usage: performance-probe.mjs MOTION_DIRECTORY NEW_OUTPUT');
const producer=path.resolve(producerArg),output=path.resolve(outArg),root=path.resolve(import.meta.dirname,'../../../..'),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-performance-'));
if(fs.existsSync(output))throw Error('New output required');
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),report={status:'RUNNING',subjects:[],scope:'Actual compiler and GSAP action samples through the new performance owner; no view, skin, native motion or game acceptance'};
fs.mkdirSync(output,{recursive:true});
sources.set(import.meta.filename,sha(fs.readFileSync(import.meta.filename)));
function comparePose(pose,expected,joints){
 if(Object.keys(pose).length!==joints.length||joints.some(j=>!Object.hasOwn(pose,j))||Object.keys(expected).some(j=>!joints.includes(j)))throw Error('Pose inventory mismatch');
 let max=0;
 for(const j of joints)for(const field of ['rotation','dx','dy']){
  const value=pose[j]?.[field]??0,target=expected[j]?.[field]??0;
  if(!Number.isFinite(value)||!Number.isFinite(target))throw Error('Nonfinite pose');
  max=Math.max(max,Math.abs(value-target));
 }
 if(max>1e-12)throw Error('Pose mismatch '+max);return max;
}
function rejectedControl(pose,expected,joints){try{comparePose(pose,expected,joints);}catch{return true;}throw Error('Changed-output negative control was accepted');}

async function load(file,name){const bundle=await rolldown({input:file,platform:'node',plugins:[{name:'source-bind',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));}}]});try{await bundle.write({dir:scratch,entryFileNames:name+'.mjs',chunkFileNames:name+'-[hash].mjs',format:'es'});}finally{await bundle.close();}return import(pathToFileURL(path.join(scratch,name+'.mjs')));}
try{
 const producerHash=sha(fs.readFileSync(path.join(producer,'gsap-adapter.ts')));if(producerHash!=='6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74')throw Error('Producer changed; review it before requalification');
 const motion=await load(path.join(producer,'index.ts'),'producer'),{createCreatureRigPerformance}=await load(path.join(root,'port/v2/apps/game/src/creature-rig-performance.ts'),'consumer');
 const rows=[['civet','audits/CIVET_2D_PROOF_20260912/civet.landmarks.json'],['fox','audits/C2_BOUNDED_REPAIR_20260913/candidate-01/fox.landmarks.json'],['procedural','audits/C2_PARTS_ATLAS_20260913/native-painter-parts-03/record.json']];
 for(const[id,file]of rows){
  const bytes=fs.readFileSync(path.join(root,file));sources.set(path.join(root,file),sha(bytes));const record=JSON.parse(bytes),genomePath=path.join(root,'audits/CIVET_2D_PROOF_20260912/procedural-genome.json'),genome=id==='procedural'?JSON.parse(fs.readFileSync(genomePath)):undefined;if(genome)sources.set(genomePath,sha(fs.readFileSync(genomePath)));
  const card=motion.compileBodyCard(record,genome),results=[];
  for(const action of ['idle','melee','hit']){
   const timeline=motion.buildTimeline(card,action,record.identity.seed);let sink=null,published=0;
   const gsap=motion.createGsapPlayer(timeline,{setJoint(...args){if(!sink)throw Error('Producer wrote outside a sample');sink.setJoint(...args);}},{now:()=>{throw Error('Unexpected clock read');}});
   const adapter={id:action,durationMs:timeline.loop?timeline.bodyMs:timeline.durationMs,loop:timeline.loop,seek(ms,target){sink=target;try{gsap.seek(ms);}finally{sink=null;}},dispose(){gsap.stop();}};
   const rig={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(){published++;}},player=createCreatureRigPerformance(record,rig,[adapter]);player.play(action,0,0);let maxError=0,pureSamplerMaxError=0;const samples=[];
   for(const fraction of [0,.25,.5,.75,1,1.5]){const ms=adapter.durationMs*fraction,pose=player.update(ms),expected=motion.sampleTimeline(timeline,ms);
    const direct={};adapter.seek(timeline.loop?ms%adapter.durationMs:Math.min(ms,adapter.durationMs),{setJoint(j,rotation,dx=0,dy=0){direct[j]={rotation,dx,dy};}});
    for(const[j,k]of Object.entries(pose)){
     const d=direct[j]??{rotation:0,dx:0,dy:0};maxError=Math.max(maxError,Math.abs(k.rotation-d.rotation),Math.abs((k.dx??0)-d.dx),Math.abs((k.dy??0)-d.dy));
     pureSamplerMaxError=Math.max(pureSamplerMaxError,Math.abs(k.rotation-(expected.joints[j]??0)),Math.abs((k.dx??0)-(j==='root'?expected.root.dx:0)),Math.abs((k.dy??0)-(j==='root'?expected.root.dy:0)));
     if(j!=='root'&&(k.dx||k.dy))throw Error('Root translation broadcast');
    }
    comparePose(pose,direct,Object.keys(record.landmarks));
    samples.push({ms,pose,direct});
   }
   if(maxError>1e-12||published!==samples.length){report.failedAction={id,action,maxError,published,samples:samples.map(s=>({...s,expected:motion.sampleTimeline(timeline,s.ms)}))};player.dispose();throw Error('Pose parity/frame count failed '+id+'/'+action);}
   const changed=[...new Set(samples.flatMap(s=>Object.entries(s.pose).filter(([,p])=>p.rotation||p.dx||p.dy).map(([j])=>j)))];
   if(!changed.length)throw Error('Action observation was empty');
   const mutant=structuredClone(samples[1].pose);mutant.head.rotation+=.01;
   const missing=structuredClone(samples[1].pose);delete missing.root;
   const controls={changedHead:rejectedControl(mutant,samples[1].direct,Object.keys(record.landmarks)),missingRoot:rejectedControl(missing,samples[1].direct,Object.keys(record.landmarks))};
   results.push({controls,action,bodyMs:timeline.bodyMs,durationMs:timeline.durationMs,playbackPeriodMs:adapter.durationMs,maxError,pureSamplerMaxError,comparison:'Exact direct GSAP producer (1e-12); pure sampler quantization difference reported separately',negativeControl:controls.changedHead&&controls.missingRoot,published,changedJoints:changed,timelineHash:timeline.hash});player.dispose();
  }
  report.subjects.push({id,recordRecipeHash:record.recipeHash,material:record.materials?.surface,actions:results,missingLookFields:['painted gaze origin/forward axis','view yaw coverage and alternate-view rigs'],visualAccepted:false});
 }
 for(const[file,hash]of sources)if(sha(fs.readFileSync(file))!==hash)throw Error('Source changed during proof');report.status='PASS';
}catch(e){report.status='FAIL';report.error=String(e.stack??e);process.exitCode=1;}
finally{report.sources=[...sources].map(([path,sha256])=>({path,sha256}));fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');fs.rmSync(scratch,{recursive:true,force:true});}
console.log(JSON.stringify({status:report.status,error:report.error,subjects:report.subjects},null,2));
