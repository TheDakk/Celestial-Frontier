import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {admitReviewedRepresentation,applyReviewedRepresentation,validateRepresentationAuthor,validateRepresentationPixels} from './reviewed-representation.mjs';import {admitReviewedPresence} from './reviewed-presence.mjs';import {familyContract} from '../creature-animation/family-contracts.mjs';import {resolveAnatomyInventory} from '../creature-animation/anatomy-inventory.mjs';import {representedPose} from '../creature-animation/source-representation.mjs';
const ROOT=new URL('../../../../',import.meta.url),B='audits/C210_BACKLOG_UNLOCKS_20261004/',read=p=>fs.readFileSync(new URL(p,ROOT)),sha=b=>createHash('sha256').update(b).digest('hex'),index=JSON.parse(read(B+'review-index.json'));
function fixture(i=0){const r=index[i];return{masterBytes:read(r.packet+'/master.png'),subjectBytes:read(r.packet+'/subject-source.json'),promptBytes:read(r.packet+'/prompt.txt'),review:JSON.parse(read(r.review))};}
const rehash=x=>{x.review.declarationSha256=sha(JSON.stringify(x.review.evidence));};
test('five exact-source reviews admitted; unchanged mandatory body/leg limits',()=>{for(let i=0;i<index.length;i++){const input=fixture(i),a=admitReviewedPresence(input),base=familyContract('quadruped'),next=resolveAnatomyInventory(base,a);assert.deepEqual(next.bounds,base.bounds);for(const j of base.joints.filter(j=>!/^tail|^ear/.test(j)))assert(next.joints.includes(j));assert.deepEqual(a.absent,[]);assert.deepEqual(a.hidden,[]);}});
for(const key of ['master','subject','prompt'])test('stale '+key+' refuses',()=>{const x=fixture();x[key+'Bytes']=Buffer.concat([x[key+'Bytes'],Buffer.from(' ')]);assert.throws(()=>admitReviewedRepresentation(x),/exact .* hash/);});
for(const[name,mutate,reason]of[
 ['stale declaration',x=>x.review.evidence.compactTail.landmarksPx.tail1[0]++,/declaration hash/],
 ['wrong family',x=>x.review.family='primate',/quadruped only/],
 ['no review',x=>x.review.review.reviewer='',/visual review/],
 ['hidden terminal',x=>{x.review.evidence.compactTail.visibility='hidden';rehash(x);},/fully observed/],
 ['cropped terminal',x=>{x.review.evidence.compactTail.landmarksPx.tail1=[0,0];rehash(x);},/root and terminal/],
 ['omitted middle',x=>{x.review.evidence.compactTail.terminal='tail2';rehash(x);},/root and terminal/],
 ['degenerate tip',x=>{x.review.evidence.compactTail.landmarksPx.tail1=x.review.evidence.compactTail.landmarksPx.tail0;rehash(x);},/distinct observed/],
 ['mandatory leg exemption',x=>{x.review.evidence.compactTail.terminal='foreNearPaw';rehash(x);},/contiguous tail/],
 ['lost tail region',x=>{x.review.evidence.compactTail.regions.pop();rehash(x);},/complete observed/],
 ['unknown evidence',x=>{x.review.evidence.allMissingAllowed=true;rehash(x);},/evidence inventory/],
])test(name,()=>{const x=fixture();mutate(x);assert.throws(()=>admitReviewedRepresentation(x),reason);});
for(const[name,mutate,reason]of[
 ['swapped ear side',x=>x.review.evidence.occludedEars[0].side='far',/declaration hash/],
 ['no antler',x=>{x.review.evidence.occludedEars[0].occluder='none';rehash(x);},/actual antler/],
 ['invented hidden coordinates',x=>{x.review.evidence.occludedEars[0].landmarksPx={earNearTip:[20,20]};rehash(x);},/ear fields/],
 ['biologically absent',x=>{x.review.evidence.occludedEars[0].decision='absent';rehash(x);},/actual antler/],
 ['changed occluder',x=>x.review.evidence.occludedEars[0].occluderPolygonPx[0][0]++,/declaration hash/],
])test(name,()=>{const x=fixture(4);mutate(x);assert.throws(()=>admitReviewedRepresentation(x),reason);});
test('represented tail keeps distal contribution and legacy object identity',()=>{const j={tail0:2,tail1:3,tail2:4,tail3:5,head:9},a=admitReviewedRepresentation(fixture());assert.deepEqual(representedPose(j,a),{tail0:2,tail1:12,head:9});assert.equal(representedPose(j,undefined),j);assert.equal(resolveAnatomyInventory(familyContract('quadruped'),undefined),familyContract('quadruped'));});
test('absence conflict refuses; mandatory anatomy cannot be hidden',()=>{const a=admitReviewedRepresentation(fixture());a.absent=['tail'];assert.throws(()=>resolveAnatomyInventory(familyContract('quadruped'),a),/not absent/);a.absent=[];a.representation.occludedEars=['foreNear'];assert.throws(()=>resolveAnatomyInventory(familyContract('quadruped'),a),/ear side/);});
test('visible ear pixels survive on head; invented actuator and erased sliver refuse',()=>{const x=fixture(4),author={parts:[{id:'body',joint:'root'},{id:'head',joint:'head'},{id:'ear',joint:'earNearTip'}],landmarksPx:{head:[890,490],earNearRoot:[800,450],earNearTip:[750,440]}};const a=applyReviewedRepresentation({...author,review:x.review,remainderPart:'body'});validateRepresentationAuthor(a,x.review);assert(a.parts.some(p=>p.id==='reviewed-ear-near-0'&&p.joint==='head'));assert(!('earNearTip'in a.landmarksPx));const erased=structuredClone(a);erased.parts=erased.parts.filter(p=>p.id!=='reviewed-ear-near-0');assert.throws(()=>validateRepresentationAuthor(erased,x.review),/sliver retained/);a.landmarksPx.earNearTip=[1,1];assert.throws(()=>validateRepresentationAuthor(a,x.review),/invented/);});
test('off-paint invented tip refuses independently of metadata',()=>{assert.throws(()=>validateRepresentationPixels(new Uint8Array(1254*1254*4),1254,1254,fixture().review),/source alpha/);});
