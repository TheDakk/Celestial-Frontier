import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {EARTH_FAUNA_PROFILES} from '../../port/v2/apps/game/src/earth-fauna-profiles.ts';
const before=fs.readFileSync(new URL('run-auto-before.mjs.txt',import.meta.url),'utf8');
const after=fs.readFileSync('audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs','utf8');
assert.equal(after.replace("'millipede', 'springtail'","'millipede'"),before);
function classifier(source){
 const a='const SPECIES_MATERIAL =',z='// habitat =';
 assert.equal(source.split(a).length,2);assert.equal(source.split(z).length,2);
 return vm.runInNewContext(source.slice(source.indexOf(a),source.indexOf(z))+'\nmaterialForProfile;');
}
const old=classifier(before),current=classifier(after),unchanged=[];
for(const p of EARTH_FAUNA_PROFILES){
 if(p.id==='springtail'){assert.equal(old(p.id),null);assert.equal(current(p.id),'chitin');continue;}
 assert.equal(current(p.id),old(p.id),p.id);unchanged.push(p.id);
}
for(const id of ['unknown-profile','Springtail','springtail-extra','__proto__',null,undefined])assert.equal(current(id),null);
const result={onlySpringtailChanged:true,otherProfilesUnchanged:unchanged,unknownAndNonExactProfilesRefuse:true};
fs.writeFileSync(new URL('profile-parity.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log('All '+unchanged.length+' other pinned profile outcomes exact; unknown/nonexact profiles still refuse');
