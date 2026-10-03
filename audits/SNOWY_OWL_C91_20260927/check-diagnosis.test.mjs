import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{checkDiagnosis}from'./check-diagnosis.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL(n,import.meta.url))),native=read('original-native-report.json'),good=read('exact-pose-owner-corrected.json'),binding=read('original-fit/binding.json');
test('actual native composition reproduces two folds while rest and same-time standalone pass',()=>assert.equal(checkDiagnosis(native,good,binding),true));
test('standalone substituted for stage cannot pass the outcome check',()=>{const r=structuredClone(good);r.rows[2]={...r.rows.at(-1),label:'stage 0'};assert.throws(()=>checkDiagnosis(native,r,binding));});
test('old triangle-index owner lookup is rejected',()=>{const old=read('exact-pose.json');assert.throws(()=>checkDiagnosis(native,old,binding));});
test('missing target time refuses instead of choosing nearest sample',()=>{const r=structuredClone(good);r.rows[2].context.elapsedMs+=.05;assert.throws(()=>checkDiagnosis(native,r,binding));});
