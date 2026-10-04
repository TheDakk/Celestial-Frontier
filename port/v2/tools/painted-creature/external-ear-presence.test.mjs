import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {admitReviewedPresence} from './reviewed-presence.mjs';
import {familyContract} from '../creature-animation/family-contracts.mjs';
import {resolveAnatomyInventory} from '../creature-animation/anatomy-inventory.mjs';
const root=new URL('../../../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root)),sha=b=>createHash('sha256').update(b).digest('hex');
const fixture=(id='15-iguana')=>({masterBytes:read('audits/G2_C132_QUADRUPEDS_20261001/'+id+'/master.png'),subjectBytes:read('audits/G2_C132_QUADRUPEDS_20261001/'+id+'/subject-source.json'),promptBytes:read('audits/G2_C132_QUADRUPEDS_20261001/'+id+'/prompt.txt'),review:JSON.parse(read('audits/C136_SPRAWLER_REFERENCES_20261002/reviews/'+id+'.json'))});
for(const row of JSON.parse(read('audits/C136_SPRAWLER_REFERENCES_20261002/reviewed-presence.json')))test('exact reviewed external-pinna absence: '+row.id,()=>{
 const input=fixture(row.id),before=[sha(input.masterBytes),sha(input.subjectBytes),sha(input.promptBytes)],presence=admitReviewedPresence(input);
 assert.deepEqual(presence,{schema:'cf.anatomy-presence/v2',absent:['external-ears'],hidden:[],folded:[]});
 const original=familyContract('quadruped'),actual=resolveAnatomyInventory(original,presence),ears=new Set(['earFarRoot','earFarTip','earNearRoot','earNearTip']);
 assert.deepEqual(actual.joints,original.joints.filter(j=>!ears.has(j)));assert.deepEqual(actual.graph,original.graph.filter(([j])=>!ears.has(j)));
 for(const key of ['legs','bounds','proportions'])assert.deepEqual(actual[key],original[key]);
 for(const [j,limit] of Object.entries(original.limitsDeg))if(!ears.has(j))assert.deepEqual(actual.limitsDeg[j],limit);
 assert.deepEqual([sha(input.masterBytes),sha(input.subjectBytes),sha(input.promptBytes)],before);
});
for(const [name,mutate,reason] of [
 ['changed master',x=>x.masterBytes=Buffer.concat([x.masterBytes,Buffer.from(' ')]),/master hash/],
 ['changed subject',x=>x.subjectBytes=Buffer.concat([x.subjectBytes,Buffer.from(' ')]),/subject hash/],
 ['changed prompt',x=>x.promptBytes=Buffer.concat([x.promptBytes,Buffer.from(' ')]),/prompt hash/],
 ['canonical name changed',x=>x.review.name='Cat',/canonical named subject/],
 ['profile assertion changed',x=>x.review.profileId='felid',/pinned Earth profile/],
 ['profile hash changed',x=>x.review.profileSha256='0'.repeat(64),/pinned Earth profile/],
 ['rebound but altered canonical anatomy',x=>{const s=JSON.parse(x.subjectBytes);s.species.mustRead.push('invented ear rule');x.subjectBytes=Buffer.from(JSON.stringify(s));x.review.subjectSha256=sha(x.subjectBytes);},/unchanged canonical species/],
 ['rebound but altered profile',x=>{const s=JSON.parse(x.subjectBytes);s.profile.notes='invented policy';x.subjectBytes=Buffer.from(JSON.stringify(s));x.review.subjectSha256=sha(x.subjectBytes);x.review.profileSha256=sha(JSON.stringify(s.profile));},/pinned Earth profile/],
 ['juvenile context',x=>x.review.context.lifeStage='juvenile',/adult sprawl context/],
 ['swimming context',x=>x.review.context.pose='swimming',/adult sprawl context/],
 ['wrong family',x=>x.review.family='hopper',/supported quadruped route/],
 ['mandatory limb removal',x=>x.review.review.decisions[0].group='foreNear',/external pinnae only/],
 ['extra tail absence',x=>x.review.review.decisions.push({group:'tail',decision:'ABSENT'}),/one explicit absence/],
 ['hidden is not absent',x=>x.review.review.decisions[0].decision='HIDDEN',/external pinnae only/],
 ['ear canal removal',x=>x.review.review.decisions[0].anatomicalMeaning='all-ear-anatomy',/external pinnae only/],
 ['missing visual observation',x=>x.review.review.observation='',/explicit visual review/],
 ['blank reviewer',x=>x.review.review.reviewer='',/explicit visual review/],
 ['missing painting observation',x=>x.review.review.decisions[0].paintingObservation='',/external pinnae only/],
 ['blanket profile scope',x=>x.review.scope='all-reptiles',/bounded review scope/],
])test('external-pinna review refuses '+name,()=>{const x=fixture();mutate(x);assert.throws(()=>admitReviewedPresence(x),reason);});
test('a fully consistent mammal cannot inherit a reptile absence decision',()=>{
 const x=fixture(),packet='audits/C132_REFERENCES_20261001/04-cat/candidate-02';x.masterBytes=read(packet+'/master.png');x.subjectBytes=read(packet+'/subject-source.json');x.promptBytes=read(packet+'/prompt.txt');const s=JSON.parse(x.subjectBytes);
 Object.assign(x.review,{name:s.name,masterSha256:sha(x.masterBytes),subjectSha256:sha(x.subjectBytes),promptSha256:sha(x.promptBytes),profileId:s.profile.id,profileSha256:sha(JSON.stringify(s.profile))});
 assert.throws(()=>admitReviewedPresence(x),/independent reviewed biological class/);
});
