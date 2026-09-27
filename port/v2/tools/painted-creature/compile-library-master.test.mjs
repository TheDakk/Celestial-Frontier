import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{createHash}from'node:crypto';import{compileLibraryMaster,libraryFamily}from'./compile-library-master.mjs';
for(const name of ['Angelfish','Roadrunner'])test('actual compiled prompt preserves canonical identity note: '+name,async()=>{
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-library-note-'));
 try{const out=path.join(scratch,'packet');await compileLibraryMaster(name,out);const subject=JSON.parse(fs.readFileSync(out+'/subject-source.json')),request=JSON.parse(fs.readFileSync(out+'/request.json')),prompt=fs.readFileSync(out+'/prompt.txt','utf8');
  assert.equal(createHash('sha256').update(prompt).digest('hex'),request.promptSha256);for(const feature of subject.species.mustRead)assert.ok(prompt.includes(feature),'identity feature preserved');
  if(name==='Angelfish'){assert.match(subject.species.note,/marine angelfish.*not the freshwater/);assert.ok(prompt.includes('Canonical identity note: '+subject.species.note));}
  else{assert.equal(subject.species.note,undefined);assert.ok(!prompt.includes('Canonical identity note:'));assert.ok(!prompt.includes('undefined'));}
 }finally{fs.rmSync(scratch,{recursive:true});}
});
test('actual upright Meerkat uses its sole canonical quadruped anatomy route',async()=>{
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-meerkat-route-'));
 try{const out=path.join(scratch,'packet');await compileLibraryMaster('Meerkat',out);const subject=JSON.parse(fs.readFileSync(out+'/subject-source.json')),request=JSON.parse(fs.readFileSync(out+'/request.json')),prompt=fs.readFileSync(out+'/prompt.txt','utf8');
  assert.deepEqual(subject.profile.candidateTemplates,['quadruped']);assert.notEqual(subject.species.posture,'quadruped');assert.equal(request.family,'quadruped');assert.equal(request.requestedVisibleLegs,4);
  for(const feature of subject.species.mustRead)assert.ok(prompt.includes(feature));assert.ok(prompt.includes(subject.species.note));assert.equal(createHash('sha256').update(prompt).digest('hex'),request.promptSha256);
 }finally{fs.rmSync(scratch,{recursive:true});}
});
test('upright posture cannot invent a missing or ambiguous quadruped route',()=>{
 assert.throws(()=>libraryFamily({candidateTemplates:[]},{name:'Meerkat',posture:'upright'}),/Unsupported/);
 assert.throws(()=>libraryFamily({candidateTemplates:['hopper','quadruped']},{posture:'upright'}),/Unsupported/);
 assert.throws(()=>libraryFamily({candidateTemplates:['primate']},{posture:'quadruped'}),/Unsupported/);
});
