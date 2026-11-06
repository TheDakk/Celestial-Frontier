import fs from 'node:fs';import assert from 'node:assert/strict';
import {record as originalRecord,bindings,card as originalCard,at,local,plan,reports} from './context.mjs';
const {compileBodyCard}=await import('../../port/v2/apps/game/src/motion/body-card.ts');const {withPaintedContactSupports}=await import('../../port/v2/apps/game/src/motion/painted-supports.ts');
const {createPaintPublication}=await import('../C132_FAINT_GROUND_20261002/paint-publication.mjs');
const base='audits/C186_BITTERN_REPAIR_20261002',record=JSON.parse(fs.readFileSync(base+'/fit02/record.json')),binding=JSON.parse(fs.readFileSync(base+'/fit02/binding.json')),card=withPaintedContactSupports(compileBodyCard(record,record.genome),record,binding);
const cases=[['original',originalRecord,bindings.painter,originalCard],['candidate02',record,binding,card]],rows=[];
const start=plan.beats.commandEnd,end=plan.beats.actionStart;assert(Number.isFinite(start)&&Number.isFinite(end)&&end>start);const times=[local,...Array.from({length:613},(_,i)=>start+(end-start)*i/612)];assert.equal(times.length,614);
for(const [name,r,b,c]of cases){const pub=createPaintPublication(r,b,c.realm);for(const ms of times){const sample=at(ms);try{pub.publish(sample.pose,sample.context);rows.push({name,ms,status:'PASS'});}catch(error){rows.push({name,ms,status:'REFUSE',error:error.message});}}}
assert.equal(rows.find(r=>r.name==='original'&&r.ms===local).error,'ARAP skin: unresolved folded triangles: 3');
fs.writeFileSync(base+'/candidate02-dense-replay.json',JSON.stringify({scope:'Original retained native turn pose/context replay against original and source-repaired record; new-native timing is a separate qualification',rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows.filter(r=>r.status!=='PASS')));console.log('samples '+rows.length);
