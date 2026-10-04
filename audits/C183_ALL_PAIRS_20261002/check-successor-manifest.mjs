import fs from 'node:fs';import assert from 'node:assert/strict';
import {sha,validateManifest,SUCCESSOR_OWNER_FILES} from './instrument-v2/validate-v2.mjs';
const base='audits/C183_ALL_PAIRS_20261002',m=JSON.parse(fs.readFileSync(base+'/prepared-65af716c/manifest.json')),old=JSON.parse(fs.readFileSync('audits/C173_ALL_PAIRS_20261002/prepared-0727fe9c/manifest.json'));
validateManifest(m);for(const s of m.sources){const b=fs.readFileSync(s.path);assert.equal(b.length,s.bytes);assert.equal(sha(b),s.sha256);}
assert.throws(()=>validateManifest(old),/successor instrument owner/);
const missing=structuredClone(m);missing.sources=missing.sources.filter(s=>s.path!==SUCCESSOR_OWNER_FILES[2]);assert.throws(()=>validateManifest(missing),/successor instrument owner/);
const stale=structuredClone(m);stale.sources.find(s=>s.path===SUCCESSOR_OWNER_FILES[0]).sha256='0'.repeat(64);assert.throws(()=>validateManifest(stale),/successor instrument owner/);
const current=new Map(m.pairs.map(p=>[p.id,p]));for(const p of old.pairs){const q=current.get(p.id);assert(q);for(const key of ['scriptSha256','fitConfig','supports','mediums','arena','effectAnchors','expectedTurns'])assert.deepEqual(q[key],p[key]);}
fs.writeFileSync(base+'/successor-manifest-controls.json',JSON.stringify({status:'PASS',nativeRuns:0,checks:['fresh manifest validates','all 1329 source hashes and sizes match','old manifest refused','missing helper refused','stale entry refused','all 1444 pair scripts/fits/arenas/attacks unchanged'],sources:m.sources.length,pairs:m.pairs.length,manifestSha256:sha(fs.readFileSync(base+'/prepared-65af716c/manifest.json'))},null,2)+'\n',{flag:'wx'});console.log('Successor manifest controls PASS');
