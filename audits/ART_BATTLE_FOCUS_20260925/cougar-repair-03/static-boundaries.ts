/** Packet-only generalization of the P1 static owner; no source, limits or gate edits.
 * Executed by cf-sprint-static-runner.mjs FIT_DIR NEW_REPORT_JSON.
 * 121 samples/action; full-row presentation at the established 60 Hz native cadence.
 * Exact rest is static published-geometry restoration plus source-pixel reconstruction.
 * It is NOT a native rendered-RGBA or CPU certificate.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {compileBodyCard,buildTimeline,createGsapPlayer,actionsFor} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion/index.ts';
import {createCreatureRigPerformance} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-performance.ts';
import {createFamilyContactSolver,observedContactSupports,contactPaintDriftPx} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/creature-rig-contact.ts';
import {blendCreaturePoses,closedLoopPose} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/src/motion-pose-blend.ts';
import {familyContractForRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/skeleton-pose.mjs';
import {createCompiledSkinField,applyCompiledSkinField} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/compiled-skin-field.mjs';
import {createArapScratch,solveArapSkin} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/arap-skin.mjs';
import {applyPaintPart,assertPaintPartShape} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/paint-skin.mjs';
import {assertRestCoverage} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/part-masks.mjs';
import {createSourceJoinProbe,assessSourceJoinContinuity} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import {createFullRowSchedule} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/animation-completion/review-schedule.mjs';

const ROOT='/Users/nick/Projects/celestial-frontier-openai-mac';
const [fitArg,outArg]=process.argv.slice(2);
if(!fitArg||!outArg||process.argv.length!==4)throw Error('Usage: FIT_DIR NEW_REPORT_JSON');
const fit=path.resolve(fitArg),out=path.resolve(outArg);
if(!fit.startsWith(ROOT+'/audits/')||!out.startsWith(ROOT+'/audits/'))throw Error('Codex audit paths required');
if(fs.existsSync(out))throw Error('New static report required; no unchanged retry');
const req=createRequire(path.join(ROOT,'port/v2/package.json'));
const {PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs');
const sha=b=>createHash('sha256').update(b).digest('hex');
const inputs=new Map(),read=p=>{const b=fs.readFileSync(p);inputs.set(p,sha(b));return b;};
const readJSON=p=>JSON.parse(read(p).toString());
const report:any={schema:'cf.sprint-static/v1',status:'RUNNING',
  sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),
  scope:'Actual GSAP/performance/contact/compiled-field/ARAP published Float32 geometry and exact source-pixel reconstruction; no GPU-rendered rest, native film, CPU or visual acceptance.',
  settings:{samplesPerAction:121,presentationHz:60,paintContactTolerancePx:0.25,endpointTolerance:1e-8},
  rows:[],exactRest:false,sourcePixelRest:null,cpuP95Ms:null};
let stage='input',players:any={},lastContact:any=null,lastPose:any=null;
try {
  const record=readJSON(path.join(fit,'record.json')),binding=readJSON(path.join(fit,'binding.json'));
  report.recordRecipeHash=record.recipeHash;report.bindingHash=binding.bindingHash;report.family=record.template.id;
  const manifest=readJSON(path.join(fit,'parts/manifest.json'));
  const atlas=PNG.sync.read(read(path.join(fit,'parts/atlas',manifest.creatureId+'.png')));
  const keyed=PNG.sync.read(read(path.join(fit,'parts/keyed.png')));
  const w=record.geometry.width,h=record.geometry.height;
  assert.equal(keyed.width,w,'keyed width');assert.equal(keyed.height,h,'keyed height');
  stage='source-pixel-rest';
  const sourceParts=binding.parts.filter(p=>p.kind==='part').map(p=>{
    const b=p.cutout,f=p.frame,rgba=new Uint8ClampedArray(b.width*b.height*4);
    assert.equal(f.width,b.width,'atlas/cutout width');assert.equal(f.height,b.height,'atlas/cutout height');
    for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++)rgba.set(atlas.data.subarray(((f.y+y)*atlas.width+f.x+x)*4,((f.y+y)*atlas.width+f.x+x)*4+4),(y*b.width+x)*4);
    return {id:p.id,box:b,rgba};
  });
  assertRestCoverage(keyed.data,w,h,sourceParts);
  report.sourcePixelRest={status:'PASS',changedVisibleRgbaChannels:0,scope:'Exact independent atlas-part reconstruction of keyed source at authored cutout rectangles; not GPU rendering'};
  stage='fixture';
  const skin=binding.paintSkin,card=compileBodyCard(record,record.genome);
  const program=createSkeletonPoseProgram(familyContractForRecord(record),record.landmarks);
  const compiled=createCompiledSkinField(skin,w,h),scratch=createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver);
  const target=new Float32Array(skin.vertices.length*2),field=target.slice(),positions:any={};
  const rig:any={recipeHash:record.recipeHash,templateId:record.template.id,applyPose(pose){
    lastPose=pose;applyCompiledSkinField(compiled,program.evaluate(pose),target);solveArapSkin(scratch,target,field);
    for(const p of skin.parts){const buf=new Float32Array(p.vertices.length*2);applyPaintPart(p,field,buf);assertPaintPartShape(p,skin,buf,w,h);positions[p.id]=buf;}
  }};
  const contact=createFamilyContactSolver(record,observedContactSupports(record,binding));
  report.contacts=contact.chains.map(c=>c.end);report.realm=card.realm;
  const sourceProbe=createSourceJoinProbe({record,binding,atlas:{width:atlas.width,height:atlas.height,rgba:atlas.data}});
  let probe=sourceProbe;
  const continuityFile=path.join(fit,'paint-boundary-continuity.json');
  if(fs.existsSync(continuityFile)){
    const continuity=readJSON(continuityFile);assert.equal(continuity.schema,'cf.authored-paint-boundary-continuity/v1');assert.equal(continuity.recordRecipeHash,record.recipeHash);assert.equal(continuity.bindingHash,binding.bindingHash);
    assert(Array.isArray(continuity.pairs)&&continuity.pairs.length>0);const seen=new Set();
    const extra=continuity.pairs.map(pair=>{assert(Array.isArray(pair)&&pair.length===2&&pair.every(x=>typeof x==='string'));const key=pair.slice().sort().join('\0');assert(!seen.has(key));seen.add(key);const found=sourceProbe.excluded.filter(j=>[j.ancestorPart,j.descendantPart].sort().join('\0')===key);assert.equal(found.length,1,'one observed declared paint adjacency');return found[0];});
    probe={...sourceProbe,joins:[...sourceProbe.joins,...extra]};report.declaredPaintBoundaries=continuity;
  }
  const marks=contact.chains.map(chain=>{
    const owner=binding.parts.find(p=>p.joint===chain.end),part=skin.parts.find(p=>p.id===owner?.id);
    assert(part,'Contact paint: missing endpoint surface '+chain.end);let best:any=null;
    part.vertices.forEach((v,index)=>{const xy=[0,0];for(let k=0;k<3;k++){const p=skin.vertices[v.triangle[k]];xy[0]+=p.x*v.barycentric[k]/w;xy[1]+=p.y*v.barycentric[k]/h;}
      const end=record.landmarks[chain.end],distance=Math.hypot(xy[0]-end[0],xy[1]-end[1]);if(!best||distance<best.distance)best={joint:chain.end,part:part.id,index,xy,distance};});
    assert(best,'Contact paint: empty endpoint surface');return best;
  });
  const resolve=(pose,phase)=>{
    lastContact=null;
    lastContact=contact.resolve(pose,{...phase,realm:card.realm,...phase.actionId.startsWith('melee:')?{travel:'stage'}:{}});
    return lastContact.pose;
  };
  const library=actionsFor(card.template.id,card.anatomy);
  assert(library&&Object.keys(library).length,'family action library');
  const ids=Object.keys(library),timelines:any={},owners:any={};report.actionInventory=ids;
  for(const id of ids){
    const tl=buildTimeline(card,id,record.identity.seed);timelines[id]=tl;let pose:any={};
    const gsap=createGsapPlayer(tl,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});
    players[id]={sample(ms){pose={};gsap.seek(ms);return pose;},stop(){gsap.stop();}};
    const owner=createCreatureRigPerformance(record,rig,[{id,durationMs:tl.durationMs,loop:tl.loop,dispose(){},seek(ms,t){for(const[j,k]of Object.entries(players[id].sample(ms)) as any)t.setJoint(j,k.rotation,k.dx,k.dy);}}]);
    owner.play(id,0,0);owners[id]=owner;
  }
  const check=row=>{
    const seams=assessSourceJoinContinuity(probe,positions);
    row.maxGapPx=Math.max(row.maxGapPx,seams.maxGapPx);
    if(seams.status!=='PASS')throw Error('Source join gap '+seams.maxGapPx);
    row.maxEndpointError=Math.max(row.maxEndpointError,lastContact?.maxError??0);
    assert(row.maxEndpointError<=1e-8,'endpoint gate');
    for(const c of lastContact?.contacts??[]){if(!c.stance)continue;const mark=marks.find(m=>m.joint===c.joint),p=positions[mark.part];
      const drift=contactPaintDriftPx([p[mark.index*2],p[mark.index*2+1]],mark.xy,[c.target.x,c.target.y],record.landmarks[c.joint],[w,h]);
      row.maxPaintDriftPx=Math.max(row.maxPaintDriftPx,drift);if(drift>.25)throw Error('Contact paint drift '+c.joint+': '+drift);
    }
  };
  rig.applyPose({});const rest=structuredClone(positions);
  const restore=row=>{try{rig.applyPose({});assert.deepEqual(positions,rest,'exact rest geometry');row.exactRest=true;}catch(error){row.exactRest=false;row.restFailure=String(error.stack??error);row.status='RED';}};
  const rowFor=id=>({id,samples:0,attemptedSamples:0,status:'PASS',maxPaintDriftPx:0,maxGapPx:0,maxEndpointError:0,exactRest:false});
  const refuse=(row,ms,index,error)=>{
    row.status='RED';row.firstRefusal={sampleIndex:index,sampleNumber:index+1,ms,error:String(error.stack??error),contact:lastContact,pose:lastPose,arapStats:{...scratch.stats}};
  };
  stage='action-rows';
  for(const id of ids){const row:any=rowFor(id);report.rows.push(row);
    for(let i=0;i<=120;i++){const ms=timelines[id].durationMs*i/120;row.attemptedSamples++;try{
      owners[id].update(ms,(pose,phase)=>resolve(pose,{...phase,actionId:timelines[id].actionId}));check(row);row.samples++;
    }catch(error){refuse(row,ms,i,error);break;}}
    restore(row);console.log(JSON.stringify({id,status:row.status,samples:row.samples,drift:row.maxPaintDriftPx,gap:row.maxGapPx,exactRest:row.exactRest,firstRefusal:row.firstRefusal?{ms:row.firstRefusal.ms,sampleNumber:row.firstRefusal.sampleNumber,error:row.firstRefusal.error.split('\n')[0]}:null}));
  }
  stage='presentation';
  const schedule=createFullRowSchedule(timelines),idleId=card.template.id.startsWith('plant-')?'sway':'idle';
  assert(players[idleId],'family idle action');
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  const isGait=id=>/^approach(?::(?:walk|trot|gallop|crawl|scuttle))?$/.test(id);
  const presented=ms=>{let pose=closedLoopPose(players[idleId].sample,ms,timelines[idleId].durationMs),name=idleId,phase:any={actionId:timelines[idleId].actionId,elapsedMs:ms,durationMs:timelines[idleId].durationMs,weight:1};
    for(const {id,startMs,endMs}of schedule.rows)if(ms>=startMs&&ms<endMs){const age=ms-startMs,weight=Math.min(smooth(age/120),smooth((endMs-ms)/160));
      const q=isGait(id)?closedLoopPose(players[id].sample,age,timelines[id].durationMs):players[id].sample(Math.min(Math.max(0,age-120),timelines[id].durationMs));
      pose=blendCreaturePoses(pose,q,weight);name=id;phase={actionId:timelines[id].actionId,elapsedMs:isGait(id)?age:Math.max(0,age-120),durationMs:timelines[id].durationMs,weight};}
    return {pose,name,phase};};
  const presentationOwner=createCreatureRigPerformance(record,rig,[{id:'presentation',durationMs:schedule.durationMs,loop:false,dispose(){},seek(ms,t){for(const[j,k]of Object.entries(presented(ms).pose) as any)t.setJoint(j,k.rotation,k.dx,k.dy);}}]);
  presentationOwner.play('presentation',0,0);const pr:any=rowFor('presentation');report.presentation=pr;report.schedule=schedule;
  for(let i=0;i<=Math.ceil(schedule.durationMs*60/1000);i++){const ms=Math.min(schedule.durationMs,i*1000/60);pr.attemptedSamples++;try{
    presentationOwner.update(ms,pose=>resolve(pose,presented(ms).phase));check(pr);pr.samples++;
  }catch(error){refuse(pr,ms,i,error);pr.firstRefusal.action=presented(ms).name;break;}}
  restore(pr);report.exactRest=report.rows.every(row=>row.exactRest)&&pr.exactRest;
  report.status=report.rows.every(row=>row.status==='PASS')&&pr.status==='PASS'&&report.exactRest?'PASS_STATIC':'RED';
} catch(error) {
  report.status='REFUSED';report.refusal={stage,error:String(error.stack??error),contact:lastContact,pose:lastPose};
} finally {
  for(const player of Object.values(players) as any[])player.stop();
  report.inputs=[...inputs].map(([file,sha256])=>({path:file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));
  if(report.inputs.some(input=>!input.unchanged)){report.status='INPUT_CHANGED';}
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:report.status,rows:report.rows.length,exactRest:report.exactRest,sourcePixelRest:report.sourcePixelRest,refusal:report.refusal}));
  if(report.status!=='PASS_STATIC')process.exitCode=1;
}
