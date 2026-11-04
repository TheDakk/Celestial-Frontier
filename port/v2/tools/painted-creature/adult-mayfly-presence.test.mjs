import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {admitReviewedPresence} from './reviewed-presence.mjs';
const dir=new URL('../../../../audits/G2_C118_20260927/19-mayfly/',import.meta.url),read=f=>fs.readFileSync(new URL(f,dir)),input=()=>({masterBytes:read('master.png'),subjectBytes:read('subject-source.json'),promptBytes:read('prompt.txt'),review:JSON.parse(read('reviewed-presence.json'))}),sha=b=>createHash('sha256').update(b).digest('hex');
test('exact adult Mayfly review removes only functional chewing mandible',()=>assert.deepEqual(admitReviewedPresence(input()),{schema:'cf.anatomy-presence/v2',absent:['mandible'],hidden:[],folded:[]}));
for(const[key,mutate]of Object.entries({
 'naiad':x=>x.review.context.lifeStage='naiad',
 'no positive wing evidence':x=>x.review.review.observedWingSurfaces=0,
 'visible jaws':x=>x.review.review.visibleChewingJaws=true,
 'missing antenna':x=>x.review.absent.push('antennae'),
 'missing leg':x=>x.review.absent.push('legNear'),
 'unreviewed':x=>x.review.review.reviewer='',
 'tampered master':x=>x.review.masterSha256='0'.repeat(64),
 'chewing beetle':x=>{const s=JSON.parse(x.subjectBytes);s.name='Beetle';x.subjectBytes=Buffer.from(JSON.stringify(s));x.review.subjectSha256=sha(x.subjectBytes);x.review.name='Beetle';},
 'another soft-mouth insect':x=>{const s=JSON.parse(x.subjectBytes);s.name='Mosquito';x.subjectBytes=Buffer.from(JSON.stringify(s));x.review.subjectSha256=sha(x.subjectBytes);x.review.name='Mosquito';}
}))test('rejects '+key,()=>{const x=input();mutate(x);assert.throws(()=>admitReviewedPresence(x));});
