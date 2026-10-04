/** Full source-size software stills from actual loaded-rig-verified publications.
 * Nearest-sampled software images are diagnosis, not GPU/native visual admission. */
import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createRequire}from'node:module';import{createHash}from'node:crypto';
import{compileBodyCard,buildTimeline,createGsapPlayer}from'../../port/v2/apps/game/src/motion/index.ts';
import{withPaintedContactSupports}from'../../port/v2/apps/game/src/motion/painted-supports.ts';
import{loadCreatureRigV1}from'../../port/v2/apps/game/src/creature-rig.ts';
import{createFamilyContactSolver,observedContactSupports}from'../../port/v2/apps/game/src/creature-rig-contact.ts';
import{createPaintPublication}from'../C132_FAINT_GROUND_20261002/paint-publication.mjs';
import{rasterPaint}from'../C132_FAINT_GROUND_20261002/render-mesh.mjs';
const [fit,masterFile,out]=process.argv.slice(2);assert(fit&&masterFile&&out&&process.argv.length===5);assert(out.startsWith('audits/C202_NATIVE_HOLDS_20261004/'));assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs'),{Texture,BufferImageSource}=require('pixi.js'),sha=b=>createHash('sha256').update(b).digest('hex'),J=p=>JSON.parse(fs.readFileSync(p));
const record=J(fit+'/record.json'),binding=J(fit+'/binding.json'),key=PNG.sync.read(fs.readFileSync(fit+'/parts/keyed.png')),manifest=J(fit+'/parts/manifest.json'),atlasFile=fit+'/parts/atlas/'+manifest.creatureId+'.png',atlasBytes=fs.readFileSync(atlasFile),atlas=PNG.sync.read(atlasBytes),master=fs.readFileSync(masterFile),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),pub=createPaintPublication(record,binding,card.realm),solver=createFamilyContactSolver(record,observedContactSupports(record,binding));
assert.equal(sha(master),record.geometry.cutoutAssetHash);const tex=new Texture({source:new BufferImageSource({resource:new Uint8Array(atlas.data),width:atlas.width,height:atlas.height})}),alpha=Uint8Array.from({length:key.width*key.height},(_,i)=>key.data[i*4+3]),rig=await loadCreatureRigV1(record,binding,master,alpha,atlasBytes,async()=>tex),rows=[],players=[];
try{
 const timeline=buildTimeline(card,'approach:walk',1);let pose={};
 const player=createGsapPlayer(timeline,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});players.push(player);
 const retained=J('audits/FILMS_C261_20261003/tortoise/report.json');
 for(const [i,row] of retained.capture.refusalLog.entries()){
  const phase={...row.context,realm:card.realm};const turn=retained.gates.turns[row.turn];const {sampleClip,addPose}=await import('../../port/v2/apps/game/src/battle2/choreography.ts');pose=addPose(sampleClip({source:'timeline',timeline:buildTimeline(card,'idle',1)},row.ms-turn.offsetMs),sampleClip({source:'timeline',timeline:buildTimeline(card,'approach',1)},phase.elapsedMs));let solved;
  try{solved=solver.resolve(pose,phase);rig.applyPose(solved.pose);rows.push({i,status:'PASS',phase,pose,solved});}
  catch(e){rows.push({i,status:'REFUSED',error:e.message,phase,pose,solved});}
 }
 const inputs=[fit+'/record.json',fit+'/binding.json',atlasFile,masterFile,'audits/C202_NATIVE_HOLDS_20261004/replay.mjs','audits/C132_FAINT_GROUND_20261002/paint-publication.mjs','audits/C132_FAINT_GROUND_20261002/render-mesh.mjs'];
 fs.writeFileSync(out+'/review.json',JSON.stringify({schema:'cf.c196-actual-rig-software-review/v1',status:rows.every(r=>r.status==='PASS')?'PASS_OFFLINE':'RETAINED_REFUSALS',scope:'Exact retained native context through loaded CreatureRig; no raster, native or visual acceptance',rows,inputs:inputs.map(p=>({path:p,sha256:sha(fs.readFileSync(p))})),qualityAccepted:false,native:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,rows:rows.length,refusals:rows.filter(r=>r.status==='REFUSED').length}));
}finally{for(const player of players)player.stop();rig.dispose();}
