import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {registerHooks} from 'node:module';
import {resolve} from '../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';registerHooks({resolve});
const {compileBodyCard}=await import('../../port/v2/apps/game/src/motion/body-card.ts');
const {withPaintedContactSupports}=await import('../../port/v2/apps/game/src/motion/painted-supports.ts');
const {buildTimeline}=await import('../../port/v2/apps/game/src/motion/timeline.ts');
const {buildTurnPlan,sampleTurn,sampleClip}=await import('../../port/v2/apps/game/src/battle2/choreography.ts');
const {createPaintPublication}=await import('../C132_FAINT_GROUND_20261002/paint-publication.mjs');
const {rasterPaint}=await import('../C132_FAINT_GROUND_20261002/render-mesh.mjs');
const {createRequire}=await import('node:module');const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{PNG}=require('pngjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),prefix='audits/C132_FAINT_GROUND_20261002',sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=read(prefix+'/input-manifest.json');for(const f of manifest.inputs)assert.equal(sha(fs.readFileSync(f.path)),f.sha256);
const captureBytes=fs.readFileSync(path.join(os.homedir(),'Projects/celestial-frontier-anthropic-mac/audits/G1_AUTO_AUTHOR_20260926/native-g2c136/03-alligator/report.json'));assert.equal(sha(captureBytes),manifest.captureSha256);const capture=JSON.parse(captureBytes),capturedTurn=capture.gates.turns[3];
const record=read(prefix+'/inputs/fit/record.json'),binding=read(prefix+'/inputs/fit/binding.json'),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),timeline=buildTimeline(card,'faint',card.identity.seed),original=read(prefix+'/original-faint.json');
const publication=createPaintPublication(record,binding,card.realm),seed=read('audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json').seed;
const plans=['left','right'].map(side=>{const actor=s=>({side:s,mass:card.massClass.multiplier,card,seed:s==='left'?1:2,label:'sprawler ground replay'});const p=buildTurnPlan({seed,attacker:actor(side==='left'?'right':'left'),target:actor(side),delivery:'melee',theme:'wild',outcome:'hit',damage:21,targetFaints:true,effect:null,readyMs:600,commandMs:300,arena:{groundLineY:.78,stands:capture.gates.stands}});return {...p,beats:capturedTurn.beats};});
const rows=[];
for(const [name,t]of [['retained-original',original],['sprawler',timeline]]){
 const clip={source:'timeline',timeline:t};const modes=new Map();
 for(const ms of [...Array.from({length:Math.ceil(t.durationMs)+1},(_,i)=>Math.min(i,t.durationMs)),t.durationMs-.001,t.durationMs+.001,1500]){
  const samples=[{mode:'standalone',pose:sampleClip(clip,ms),context:{actionId:'faint',elapsedMs:ms,durationMs:t.durationMs,weight:1}},...plans.map(p=>{const q={...p,clips:{...p.clips,target:{...p.clips.target,reaction:clip}}};return {mode:p.target.side,...sampleTurn(q,q.beats.reactionStart+ms).target};})];
  for(const s of samples){const o=publication.publish(s.pose,s.context),r=modes.get(s.mode)??{mode:s.mode,samples:0,headClearancePx:Infinity,allClearancePx:Infinity,maxContactDriftPx:0};r.samples++;r.headClearancePx=Math.min(r.headClearancePx,...o.extrema.filter(e=>['head','jaw','neck'].includes(e.part)).map(e=>e.clearancePx));const w=o.extrema.reduce((a,b)=>a.clearancePx<b.clearancePx?a:b);if(w.clearancePx<r.allClearancePx){r.allClearancePx=w.clearancePx;r.worst={ms,part:w.part};}r.maxContactDriftPx=Math.max(r.maxContactDriftPx,...o.publishedContacts.map(p=>p.driftPx));modes.set(s.mode,r);}
 }
 rows.push({name,modes:[...modes.values()]});
}
assert(rows[0].modes.every(r=>r.headClearancePx< -100));assert(rows[1].modes.every(r=>r.headClearancePx>=2));
const held=publication.publish(sampleClip({source:'timeline',timeline},1500),{actionId:'faint',elapsedMs:1500,durationMs:timeline.durationMs,weight:1});
const atlas=PNG.sync.read(fs.readFileSync(prefix+'/inputs/fit/parts/atlas/03-alligator.png'));fs.writeFileSync(new URL('alligator-held.png',import.meta.url),PNG.sync.write(rasterPaint(record,binding,atlas,held.positions,1)));
const report={schema:'cf.c163-sprawler-ground/v1',scope:'actual published mesh, recorded target beats, two facings; no native or visual acceptance',rows,unchangedInputs:manifest.inputs.map(f=>({path:f.path,sha256:f.sha256,unchanged:sha(fs.readFileSync(f.path))===f.sha256}))};assert(report.unchangedInputs.every(f=>f.unchanged));fs.writeFileSync(new URL('alligator-ground.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(rows));
