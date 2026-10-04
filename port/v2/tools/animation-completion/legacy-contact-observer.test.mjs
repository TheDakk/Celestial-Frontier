import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {assertLegacyContactObserver} from './legacy-contact-observer.mjs';
const {records}=JSON.parse(fs.readFileSync(new URL('../creature-animation/test-fixtures/family-records.json',import.meta.url)));

test('all retained ordinary family fixtures preserve record identity and bytes',()=>{
 assert(Object.keys(records).length>0);
 for(const record of Object.values(records)){
  const before=JSON.stringify(record);Object.freeze(record.geometry);Object.freeze(record);
  assert.equal(assertLegacyContactObserver(record),record);
  assert.equal(JSON.stringify(record),before);
 }
});

test('explicit adhesive pads are refused before an ankle-only consumer can produce evidence',()=>{
 const record={geometry:{contactPads:{schema:'cf.terminal-pad-support/v1',kind:'adhesive',points:{hindFarAnkle:[.2,.8]}}}};
 let observations=0;
 const legacyReview=value=>{const admitted=assertLegacyContactObserver(value);observations++;return admitted;};
 assert.throws(()=>legacyReview(record),/Legacy contact observer: terminal contact pads are unsupported/);
 assert.equal(observations,0);
 const oldRecord={geometry:{groundLineY:.8}};
 assert.equal(legacyReview(oldRecord),oldRecord);assert.equal(observations,1);
});

test('malformed, falsey and future declarations cannot silently fall back to ankle marks',()=>{
 for(const contactPads of [undefined,null,false,0,'',[],{}, {schema:'future'}])
  assert.throws(()=>assertLegacyContactObserver({geometry:{contactPads}}),/terminal contact pads are unsupported/);
 const geometry={};Object.defineProperty(geometry,'contactPads',{get(){throw Error('Declaration content must not be read');}});
 assert.throws(()=>assertLegacyContactObserver({geometry}),/terminal contact pads are unsupported/);
});

test('absence introduces no replacement validation of the old record path',()=>{
 for(const record of [undefined,null,{}, {geometry:null}, {geometry:{}}, {geometry:{width:NaN}}])
  assert.equal(assertLegacyContactObserver(record),record);
});
