import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
import {resolve} from '../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';
registerHooks({resolve});
const {compileBodyCard}=await import('../../port/v2/apps/game/src/motion/body-card.ts');
const {withPaintedContactSupports}=await import('../../port/v2/apps/game/src/motion/painted-supports.ts');
const {buildTurnPlan,sampleTurn}=await import('../../port/v2/apps/game/src/battle2/choreography.ts');
const {createPaintPublication}=await import('../C132_FAINT_GROUND_20261002/paint-publication.mjs');
const json=p=>JSON.parse(fs.readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const base='audits/C183_BITTERN_FOLD_20261002',finishedReport='audits/AI_FINISH_C211_20261002/native-01/07-bittern/report.json',painterReport='audits/G1_AUTO_AUTHOR_20260926/native-g2c211/07-bittern/report.json';
const reports={painter:json(painterReport),finished:json(finishedReport)},e=reports.finished.capture.refusalLog[0],native=reports.finished.gates.turns[e.turn];
const fitPaths={painter:'audits/C183_BITTERN_FOLD_20261002/painter-input',finished:'audits/AI_FINISH_C211_20261002/rebound-01/07-bittern'};
const records=Object.fromEntries(Object.entries(fitPaths).map(([k,p])=>[k,json(p+'/record.json')])),bindings=Object.fromEntries(Object.entries(fitPaths).map(([k,p])=>[k,json(p+'/binding.json')]));
assert.deepEqual(records.painter,records.finished);assert.deepEqual(bindings.painter.paintSkin,bindings.finished.paintSkin);
const record=records.painter,card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,bindings.painter);
const local=e.ms-native.offsetMs,perCycle=e.context.stageDisplacement/(e.context.elapsedMs/e.context.durationMs-.5),seed=json('audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json').seed;
const actor=side=>({side,mass:card.massClass.multiplier,card,seed:side==='left'?1:2,label:'Bittern replay'});
const raw=buildTurnPlan({seed,attacker:actor('left'),target:actor('right'),delivery:'melee',theme:'wild',outcome:'hit',damage:21,targetFaints:true,effect:null,readyMs:600,commandMs:300,arena:{groundLineY:.78,stands:reports.finished.gates.stands}});
const plan={...raw,beats:native.beats,runUp:native.runUp,cadence:{cycles:1,gaitMs:e.context.durationMs,perCycle,walked:native.runUp,bodyLength:native.runUp/perCycle}};
const at=ms=>sampleTurn(plan,ms).attacker;
assert.deepEqual(at(local).context,e.context);

const {createRequire}=await import('node:module');const os=await import('node:os');const path=await import('node:path');
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs'),{Texture,BufferImageSource}=require('pixi.js');
const {loadCreatureRigV1}=await import('../../port/v2/apps/game/src/creature-rig.ts');
const {createFamilyContactSolver,observedContactSupports}=await import('../../port/v2/apps/game/src/creature-rig-contact.ts');
const sibling=path.join(os.homedir(),'Projects/celestial-frontier-anthropic-mac');
const assetFits={painter:'audits/G1_AUTO_AUTHOR_20260926/auto-g2c211/07-bittern/fit',finished:'audits/AI_FINISH_C211_20261002/rebound-01/07-bittern'};
const painterTimes=reports.painter.capture.frameSamples.filter(f=>f.turn===3&&f.phase==='approach').map(f=>f.localMs).sort((a,b)=>Math.abs(a-local)-Math.abs(b-local)).slice(0,2);
const rows=[],inputs=[];
const bytes=p=>{const b=fs.readFileSync(p);inputs.push({path:p.replace(os.homedir(),'~'),sha256:sha(b)});return b;};
const geometryHash=rig=>sha(Buffer.concat(rig.parts.map(part=>{const a=part.display.children[0].geometry.getBuffer('aPosition').data;return Buffer.from(a.buffer,a.byteOffset,a.byteLength);}))); 
for(const [name,relative] of Object.entries(assetFits)){
 const fit=path.join(sibling,relative),binding=bindings[name],keyed=PNG.sync.read(bytes(fit+'/parts/keyed.png')),atlasBytes=bytes(fit+'/parts/atlas/07-bittern.png'),atlas=PNG.sync.read(atlasBytes),alpha=Uint8Array.from({length:keyed.width*keyed.height},(_,i)=>keyed.data[i*4+3]),master=bytes(path.join(sibling,record.source));
 const texture=new Texture({source:new BufferImageSource({resource:new Uint8Array(atlas.data),width:atlas.width,height:atlas.height})});
 const rig=await loadCreatureRigV1(record,binding,master,alpha,atlasBytes,async()=>texture),solver=createFamilyContactSolver(record,observedContactSupports(record,binding));
 try{for(const ms of [...painterTimes,local,...painterTimes.slice().reverse(),local,local]){
  const sample=at(ms),resolved=solver.resolve(sample.pose,{...sample.context,realm:card.realm,travel:'stage'}),before=geometryHash(rig);let row={name,ms};
  try{rig.applyPose(resolved.pose);row={...row,status:'PASS',posedSha256:geometryHash(rig)};}catch(error){row={...row,status:'REFUSE',error:error.message,previousPublicationUnchanged:before===geometryHash(rig)};}
  rows.push(row);
 }}finally{rig.dispose();}
}
for(const ms of [...painterTimes,local]){const r=rows.filter(r=>r.ms===ms);assert.equal(new Set(r.map(v=>JSON.stringify([v.status,v.error,v.posedSha256]))).size,1);}
assert(rows.filter(r=>r.ms===local).every(r=>r.error==='ARAP skin: unresolved folded triangles: 3'&&r.previousPublicationUnchanged));assert(rows.filter(r=>r.ms!==local).every(r=>r.status==='PASS'));
fs.writeFileSync(base+'/runtime-parity.json',JSON.stringify({schema:'cf.c183-bittern-runtime-parity/v1',status:'PASS_DIAGNOSIS',scope:'Actual loaded CreatureRig using painter and finished atlas RGBA; CPU publication, no browser/native retry.',textureIndependent:true,refusalAtomic:true,rows,inputs},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS_DIAGNOSIS',rows:rows.length,textureIndependent:true,refusalAtomic:true}));
