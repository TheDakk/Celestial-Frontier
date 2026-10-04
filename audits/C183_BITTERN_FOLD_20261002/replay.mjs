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
const reportSampleTimes=Object.fromEntries(Object.entries(reports).map(([name,r])=>[name,r.capture.frameSamples.filter(f=>f.turn===e.turn&&f.phase==='approach').map(f=>f.localMs)]));
const sampleTimes=[...new Set([local,...reportSampleTimes.painter,...reportSampleTimes.finished])].sort((a,b)=>a-b);
const results=[];
for(const [name,binding] of Object.entries(bindings)){
 const pub=createPaintPublication(record,binding,card.realm);
 for(const [order,times] of [['forward',sampleTimes],['reverse',[...sampleTimes].reverse()],['repeat',[local,local,local]]])for(const ms of times){
  const input=at(ms);let row={name,order,ms,context:input.context};
  try{const frame=pub.publish(input.pose,input.context);row={...row,status:'PASS',posedSha256:sha(Buffer.concat(Object.values(frame.positions).map(p=>Buffer.from(p.buffer,p.byteOffset,p.byteLength))))};}
  catch(error){row={...row,status:'REFUSE',code:error.code??null,error:error.message};}
  results.push(row);
 }
}
const ref=results.filter(r=>r.ms===local);assert(ref.every(r=>r.status==='REFUSE'&&r.error==='ARAP skin: unresolved folded triangles: 3'),'Exact native refusal must reproduce');
for(const ms of sampleTimes){const rows=results.filter(r=>r.ms===ms);assert.equal(new Set(rows.map(r=>JSON.stringify([r.status,r.posedSha256,r.error]))).size,1,'Texture/order changed pose outcome '+ms);}
const selected=Object.fromEntries(Object.entries(reportSampleTimes).map(([name,times])=>[name,{samples:times.length,refused:times.filter(ms=>results.find(r=>r.name==='painter'&&r.order==='forward'&&r.ms===ms).status==='REFUSE')}]))
const output={schema:'cf.c183-bittern-determinism/v1',status:'DIAGNOSED',geometryIdentical:true,paintSkinIdentical:true,exactRecordedRefusal:e,derivedCadence:plan.cadence,textureAndOrderParity:true,selectedNativeTimes:selected,results,inputs:[painterReport,finishedReport,...Object.values(fitPaths).flatMap(p=>[p+'/record.json',p+'/binding.json'])].map(path=>({path,sha256:sha(fs.readFileSync(path))})),scope:'Browser-free exact pose/publication replay; no native retry, no allowance or source change. Passing film may miss a narrow deterministic refusal interval.'};
fs.writeFileSync(base+'/replay.json',JSON.stringify(output,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:output.status,rows:results.length,selectedNativeTimes:selected,textureAndOrderParity:true}));
