/** Full source-size software stills from actual loaded-rig-verified publications.
 * Nearest-sampled software images are diagnosis, not GPU/native visual admission. */
import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createRequire}from'node:module';import{createHash}from'node:crypto';
import{compileBodyCard,buildTimeline,createGsapPlayer}from'../../port/v2/apps/game/src/motion/index.ts';
import{withPaintedContactSupports}from'../../port/v2/apps/game/src/motion/painted-supports.ts';
import{loadCreatureRigV1}from'../../port/v2/apps/game/src/creature-rig.ts';
import{createFamilyContactSolver,observedContactSupports}from'../../port/v2/apps/game/src/creature-rig-contact.ts';
import{createPaintPublication}from'../C132_FAINT_GROUND_20261002/paint-publication.mjs';
import{rasterPaint}from'../C132_FAINT_GROUND_20261002/render-mesh.mjs';
const [fit,masterFile,out]=process.argv.slice(2);assert(fit&&masterFile&&out&&process.argv.length===5);assert(out.startsWith('audits/C203_NATIVE_HOLDS_20261004/'));assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs'),{Texture,BufferImageSource}=require('pixi.js'),sha=b=>createHash('sha256').update(b).digest('hex'),J=p=>JSON.parse(fs.readFileSync(p));
const record=J(fit+'/record.json'),binding=J(fit+'/binding.json'),key=PNG.sync.read(fs.readFileSync(fit+'/parts/keyed.png')),manifest=J(fit+'/parts/manifest.json'),atlasFile=fit+'/parts/atlas/'+manifest.creatureId+'.png',atlasBytes=fs.readFileSync(atlasFile),atlas=PNG.sync.read(atlasBytes),master=fs.readFileSync(masterFile),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),pub=createPaintPublication(record,binding,card.realm),solver=createFamilyContactSolver(record,observedContactSupports(record,binding));
assert.equal(sha(master),record.geometry.cutoutAssetHash);const tex=new Texture({source:new BufferImageSource({resource:new Uint8Array(atlas.data),width:atlas.width,height:atlas.height})}),alpha=Uint8Array.from({length:key.width*key.height},(_,i)=>key.data[i*4+3]),rig=await loadCreatureRigV1(record,binding,master,alpha,atlasBytes,async()=>tex),rows=[],players=[];
try{
 for(const action of ['idle','faint','approach:walk','hit']){
  const timeline=buildTimeline(card,action,record.identity.seed);let pose={};const player=createGsapPlayer(timeline,{setJoint(j,rotation,dx,dy){pose[j]={rotation,dx,dy};}},{now:()=>0});players.push(player);
  for(const fraction of [0,.2,.9,1,.2]){
   const ms=timeline.durationMs*fraction;pose={};player.seek(ms);const phase={actionId:timeline.actionId,elapsedMs:ms,durationMs:timeline.durationMs,weight:1,realm:card.realm,travel:'stage'};
   let error=null;try{const r=solver.resolve(pose,phase);rig.applyPose(r.pose);const expected=pub.publish(pose,phase);for(const part of rig.parts)assert.deepEqual(part.display.children[0].geometry.getBuffer('aPosition').data,expected.positions[part.id]);
    const name=action.replace(':','-')+'-'+String(fraction).replace('.','p')+'.png';if(!fs.existsSync(out+'/'+name))fs.writeFileSync(out+'/'+name,PNG.sync.write(rasterPaint(record,binding,atlas,expected.positions,1)),{flag:'wx'});
    rows.push({action,ms,fraction,status:'PASS',parts:rig.parts.length,image:name,publishedPartParity:'byte-exact'});
   }catch(e){error=e.message;rows.push({action,ms,fraction,status:'REFUSED',error});}
  }
 }
 const inputs=[fit+'/record.json',fit+'/binding.json',atlasFile,masterFile,'audits/C203_NATIVE_HOLDS_20261004/review-rig.mjs','audits/C132_FAINT_GROUND_20261002/paint-publication.mjs','audits/C132_FAINT_GROUND_20261002/render-mesh.mjs'];
 fs.writeFileSync(out+'/review.json',JSON.stringify({schema:'cf.c198-actual-rig-software-review/v1',status:rows.every(r=>r.status==='PASS')?'PASS_OFFLINE':'RETAINED_REFUSALS',scope:'Actual loaded CreatureRig positions equal independent publication; source-size software rendering only, no native or GPU acceptance',rows,inputs:inputs.map(p=>({path:p,sha256:sha(fs.readFileSync(p))})),qualityAccepted:false,native:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,rows:rows.length,refusals:rows.filter(r=>r.status==='REFUSED').length}));
}finally{for(const player of players)player.stop();rig.dispose();}
