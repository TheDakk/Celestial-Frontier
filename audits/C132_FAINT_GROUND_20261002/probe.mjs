import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {registerHooks} from 'node:module';
import {resolve} from '../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';registerHooks({resolve});
const {compileBodyCard}=await import('../../port/v2/apps/game/src/motion/body-card.ts');
const {withPaintedContactSupports}=await import('../../port/v2/apps/game/src/motion/painted-supports.ts');
const {buildTimeline,fnv1a}=await import('../../port/v2/apps/game/src/motion/timeline.ts');
const {buildTurnPlan,sampleTurn,sampleClip}=await import('../../port/v2/apps/game/src/battle2/choreography.ts');
const {createPaintPublication}=await import('./paint-publication.mjs');
const dir=import.meta.dirname,repo=path.resolve(dir,'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(repo,p))),sha=b=>createHash('sha256').update(b).digest('hex');
const record=read('audits/C132_FAINT_GROUND_20261002/inputs/fit/record.json'),binding=read('audits/C132_FAINT_GROUND_20261002/inputs/fit/binding.json'),manifest=read('audits/C132_FAINT_GROUND_20261002/input-manifest.json');for(const f of manifest.inputs)assert.equal(sha(fs.readFileSync(path.join(repo,f.path))),f.sha256);
const card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding),original=buildTimeline(card,'faint',card.identity.seed),publication=createPaintPublication(record,binding,card.realm);
function scaled(gain){if(gain===1)return original;const {hash,...body}=original;body.tracks={...original.tracks,...Object.fromEntries(['neck','head'].map(j=>[j,original.tracks[j].map(k=>({...k,value:k.value*gain}))]))};return {...body,hash:fnv1a(JSON.stringify(body))};}
for(const gain of [1,.75,.5,0]){const tl=scaled(gain),pose=sampleClip({source:'timeline',timeline:tl},tl.durationMs),start=performance.now(),out=publication.publish(pose,{actionId:'faint',elapsedMs:tl.durationMs,durationMs:tl.durationMs,weight:1});console.log(JSON.stringify({gain,ms:performance.now()-start,extrema:out.extrema.filter(e=>['head','jaw','neck','spine'].includes(e.part)),joints:{neck:pose.neck,head:pose.head},stance:tl.stanceEnvelope}));}
