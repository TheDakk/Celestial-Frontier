import fs from 'node:fs';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {familyContract} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
const base=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex'),rows=JSON.parse(fs.readFileSync(base+'/pilot.json')),verified=[];
for(const row of rows){
 const master=fs.readFileSync(row.master),request=JSON.parse(fs.readFileSync(row.packet+'/request.json')),generation=JSON.parse(fs.readFileSync(row.packet+'/generation.json'));
 const original=row.originalPacket??row.packet,prior=fs.readFileSync(row.sourcePacket+'/master.png');
 assert.ok(prior.equals(fs.readFileSync(original+'/master.png')),'Source original changed');
 assert.equal(sha(master),generation.masterSha256);assert.equal(sha(fs.readFileSync(row.packet+'/prompt.txt')),request.promptSha256);
 if(row.originalPacket){const source=generation.sourcePath.startsWith('~/')?os.homedir()+'/'+generation.sourcePath.slice(2):generation.sourcePath;assert.ok(master.equals(fs.readFileSync(source)),'Generated edit changed');assert.equal(request.editSourceSha256,sha(prior));}
 const a=JSON.parse(fs.readFileSync(row.packet+'/authoring.json')),p=JSON.parse(fs.readFileSync(row.packet+'/presence.json')),o=JSON.parse(fs.readFileSync(row.packet+'/priority-observation.json')),v=JSON.parse(fs.readFileSync(row.packet+'/manual-provenance.json'));
 assert.deepEqual(p,{schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[]});
 assert.equal(v.authoringSha256,sha(fs.readFileSync(row.packet+'/authoring.json')));assert.equal(v.masterSha256,sha(master));assert.equal(o.masterSha256,sha(master));assert.equal(o.authoringSha256,v.authoringSha256);assert.deepEqual(o.empty,[]);
 const expected=familyContract(row.family).joints,actual=Object.keys(a.landmarksPx),missing=expected.filter(j=>!actual.includes(j));
 assert.deepEqual(missing,a.coverage.unresolvedJoints);assert.ok(actual.every(j=>expected.includes(j)));assert.equal(new Set(a.parts.map(p=>p.joint)).size,a.parts.length);assert.deepEqual([...a.parts.map(p=>p.joint)].sort(),[...actual].sort());
 for(const point of [...Object.values(a.landmarksPx),...a.parts.flatMap(p=>p.polygonPx)])assert.ok(point.length===2&&point.every(n=>Number.isFinite(n)&&n>=0&&n<1254));
 verified.push({id:row.id,masterSha256:sha(master),bytes:master.length,authoringSha256:v.authoringSha256,completeInventory:missing.length===0,unresolved:missing,owners:a.parts.length,minimumOwnerPixels:Math.min(...o.parts.map(p=>p.pixels)),sourceOriginalUnchanged:true,generatedEdit:!!row.originalPacket,admission:missing.length?'INCOMPLETE_HOLD':'UNMEASURED'});
}
fs.writeFileSync(base+'/verification.json',JSON.stringify({schema:'cf.c136-reference-integrity/v1',scope:'Exact bytes, prompt/provenance hashes, declared inventory and painted owner occupancy only. No anatomy, intake, skin, contact, native or reference-pool admission.',completeCandidates:verified.filter(x=>x.completeInventory).length,incompleteHolds:verified.filter(x=>!x.completeInventory).length,verified},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({completeCandidates:3,incompleteHolds:1,owners:verified.reduce((n,x)=>n+x.owners,0),minimumOwnerPixels:Math.min(...verified.map(x=>x.minimumOwnerPixels))}));
