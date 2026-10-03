import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {rolldown} from 'rolldown';
import {libraryFamily,controlledLibraryLayout,compileLibraryMaster} from './compile-library-master.mjs';
const root=fileURLToPath(new URL('../../../../',import.meta.url)),fauna=JSON.parse(fs.readFileSync(path.join(root,'port/v2/reference/fauna.json'))),byName=new Map(fauna.map(s=>[s.name,s])),sha=b=>createHash('sha256').update(b).digest('hex');
const bundle=await rolldown({input:path.join(root,'port/v2/apps/game/src/earth-fauna-profiles.ts'),platform:'node'});let profiles;
try{const {output}=await bundle.generate({format:'es'});assert.equal(output.length,1);profiles=await import('data:text/javascript;base64,'+Buffer.from(output[0].code).toString('base64'));}finally{await bundle.close();}
const extended=['primate','myriapod','cephalopod','flyer-membrane'];
for(const profile of profiles.EARTH_FAUNA_PROFILES)if(profile.candidateTemplates.some(f=>extended.includes(f)))for(const name of profile.names)test('canonical controlled route '+name,()=>{
 const family=libraryFamily(profile,byName.get(name));assert.equal(family,profile.candidateTemplates[0]);const layout=controlledLibraryLayout(family,name);assert.ok(layout.layout.includes(name));assert.ok(layout.accuracy);assert.equal(typeof layout.layout,'string');
});
const locked={quadruped:'4954fee85d1d3e4fae8036fa7568e6d7660162daae707b37f704aa019541bd7b','biped-bird':'5a1f4ff02b446253a9c47306e8ca5029e5c339049e9be0b39c96db6ff6c6bb27',serpent:'fb5f49a520c996e33c2aa0752facdce76c52262a494370d909c358da8e6a7a3a',fish:'ca4738a13c70631b7927eae625095159e4f8d9810271c816acddfa82ca00a1d6',insect:'e8caf5514040e424e623125340eeef62717dbeeec382904b4dc8068588d3ef26'};
for(const [family,hash] of Object.entries(locked))test('existing '+family+' request is byte-for-byte unchanged',()=>assert.equal(sha(JSON.stringify(controlledLibraryLayout(family))),hash));
test('ambiguous, mixed and unknown families refuse',()=>{
 for(const candidateTemplates of [['primate','cephalopod'],['primate','quadruped'],['cephalopod','unknown'],['unknown']])assert.throws(()=>libraryFamily({candidateTemplates},byName.get('Chimpanzee')),/Ambiguous|Unsupported/);
 for(const family of extended){assert.throws(()=>controlledLibraryLayout(family),/Named species/);assert.throws(()=>controlledLibraryLayout(family,'Cat'),/Named species/);}
 assert.throws(()=>controlledLibraryLayout('unknown','Cat'),/Unsupported/);
});
test('species-dependent cephalopod counts and structures stay distinct',()=>{
 for(const name of ['Squid','Giant Squid','Cuttlefish'])assert.match(controlledLibraryLayout('cephalopod',name).accuracy,/eight.*two longer feeding tentacles/);
 for(const name of ['Octopus','Giant Octopus'])assert.match(controlledLibraryLayout('cephalopod',name).accuracy,/eight.*no added feeding tentacles/);
 assert.match(controlledLibraryLayout('cephalopod','Nautilus').accuracy,/numerous unsuckered tentacles/);
 assert.match(controlledLibraryLayout('cephalopod','Deep-Sea Octopus').accuracy,/eight.*two ear-like fins/);
 assert.match(controlledLibraryLayout('cephalopod','Vampire Squid').accuracy,/eight webbed arms plus two retractile sensory filaments/);
});
test('millipede, centipede, primate and bat painting requests retain real anatomy',()=>{
 assert.match(controlledLibraryLayout('myriapod','Millipede').layout,/two pairs of short legs/);
 assert.match(controlledLibraryLayout('myriapod','Centipede').layout,/One pair of walking legs per leg-bearing segment/);
 assert.equal(controlledLibraryLayout('myriapod','Centipede').legs,null);
 assert.match(controlledLibraryLayout('primate','Chimpanzee').layout,/Chimpanzee, Gorilla, Orangutan and Gibbon are tailless/);
 assert.match(controlledLibraryLayout('flyer-membrane','Fruit Bat').layout,/The wing is the forelimb, not an extra appendage/);
});
test('all four new routes compile complete canonical requests with hashes and source provenance',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cf-controlled-test-'));
 try{for(const [name,family] of [['Chimpanzee','primate'],['Centipede','myriapod'],['Octopus','cephalopod'],['Fruit Bat','flyer-membrane']]){
  const packet=path.join(temp,name),result=await compileLibraryMaster(name,packet),request=JSON.parse(fs.readFileSync(packet+'/request.json')),subject=JSON.parse(fs.readFileSync(packet+'/subject-source.json')),prompt=fs.readFileSync(packet+'/prompt.txt','utf8');
  assert.equal(result.family,family);assert.equal(subject.family,family);assert.equal(request.family,family);assert.equal(request.promptSha256,sha(prompt));assert.equal(request.compilerSha256,sha(fs.readFileSync(new URL('./compile-library-master.mjs',import.meta.url))));
  assert.equal(request.kitSha256,sha(fs.readFileSync(path.join(root,'ART_KIT.md'))));assert.equal(request.referenceSha256,'c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62');assert.deepEqual(request.requestedSize,[1254,1254]);assert.equal(request.observedVisibleLegs,null);assert.equal(request.authoringCreated,false);assert.match(request.sourceHead,/^[0-9a-f]{40}$/);
  for(const feature of subject.species.mustRead)assert.ok(prompt.includes(feature));assert.ok(prompt.includes(controlledLibraryLayout(family,name).layout));
  await assert.rejects(compileLibraryMaster(name,packet),/New packet directory/);
 }}finally{fs.rmSync(temp,{recursive:true,force:true});}
});

// Retained canonical-note and upright-route outcome controls.
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
 assert.throws(()=>libraryFamily({candidateTemplates:['primate','quadruped']},{posture:'quadruped'}),/Ambiguous/);
});
