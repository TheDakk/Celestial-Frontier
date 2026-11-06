import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {admitReviewedPresence} from './reviewed-presence.mjs';
import {familyContract} from '../creature-animation/family-contracts.mjs';
import {resolveAnatomyInventory} from '../creature-animation/anatomy-inventory.mjs';
const root = new URL('../../../../',import.meta.url);
const read = path => fs.readFileSync(new URL(path,root));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fixture = () => ({masterBytes:read('audits/G2_C87_20260927/24-hyrax/master.png'),subjectBytes:read('audits/G2_C87_20260927/24-hyrax/subject-source.json'),promptBytes:read('audits/G2_C87_20260927/24-hyrax/prompt.txt'),review:JSON.parse(read('audits/PRESENCE_C89_20260927/hyrax-review.json'))});

test('exact reviewed Hyrax removes only the optional tail inventory',()=>{
 const input=fixture(),before=[sha(input.masterBytes),sha(input.subjectBytes),sha(input.promptBytes)],presence=admitReviewedPresence(input);
 assert.deepEqual(presence,{schema:'cf.anatomy-presence/v2',absent:['tail'],hidden:[],folded:[]});
 const original=familyContract('quadruped'),actual=resolveAnatomyInventory(original,presence),tails=new Set(['tail0','tail1','tail2','tail3']);
 assert.deepEqual(actual.joints,original.joints.filter(j=>!tails.has(j)));
 assert.deepEqual(actual.graph,original.graph.filter(([j])=>!tails.has(j)));
 assert.deepEqual(actual.legs,original.legs);assert.deepEqual(actual.bounds,original.bounds);
 for(const [j,limit] of Object.entries(original.limitsDeg))if(!tails.has(j))assert.deepEqual(actual.limitsDeg[j],limit);
 assert.deepEqual([sha(input.masterBytes),sha(input.subjectBytes),sha(input.promptBytes)],before);
});
for(const [name,mutate,reason] of [
 ['different master',i=>{i.masterBytes=Buffer.from(i.masterBytes);i.masterBytes[0]^=1;},/master hash/],
 ['different subject',i=>{i.subjectBytes=Buffer.concat([i.subjectBytes,Buffer.from(' ')]);},/subject hash/],
 ['different request',i=>{i.promptBytes=Buffer.concat([i.promptBytes,Buffer.from(' ')]);},/prompt hash/],
 ['species mismatch',i=>{i.review.name='Wildcat';},/canonical named subject/],
 ['missing life stage',i=>{delete i.review.context.lifeStage;},/adult stride context/],
 ['different pose',i=>{i.review.context.pose='crouching';},/adult stride context/],
 ['unreviewed',i=>{i.review.review.reviewer='';},/explicit visual review/],
 ['invented evidence',i=>{i.review.review.decisions[0].canonicalFeature='tailless by failed fit';},/canonical tailless evidence/],
 ['mandatory leg absence',i=>{i.review.review.decisions[0].group='foreNear';},/optional tail only/],
 ['duplicate declaration',i=>{i.review.review.decisions.push({...i.review.review.decisions[0]});},/one explicit absence/],
 ['reference-only absence on a tailed species',i=>{i.masterBytes=read('audits/G2_C87_20260927/21-wildcat/master.png');i.subjectBytes=read('audits/G2_C87_20260927/21-wildcat/subject-source.json');i.promptBytes=read('audits/G2_C87_20260927/21-wildcat/prompt.txt');i.review.name='Wildcat';i.review.masterSha256=sha(i.masterBytes);i.review.subjectSha256=sha(i.subjectBytes);i.review.promptSha256=sha(i.promptBytes);i.review.review.decisions[0].canonicalFeature=JSON.parse(i.subjectBytes).species.mustRead[0];},/canonical tailless evidence/],
])test('refuses '+name,()=>{const input=fixture();mutate(input);assert.throws(()=>admitReviewedPresence(input),reason);});
