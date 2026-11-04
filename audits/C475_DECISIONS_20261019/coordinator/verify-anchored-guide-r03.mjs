/** Pure-module verification: no Vite/HMR/listener; keep the first SSR warning log. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const B='audits/C475_DECISIONS_20261019/coordinator',release='port/v2/apps/game/src/release-content.ts',guide='port/v2/tools/slicesmoke.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
async function rows(source){
 const spec="'./release-identity.js'",identity=fs.readFileSync('port/v2/apps/game/src/release-identity.ts','utf8');
 const jsonImport="from '../../../version.json';";assert.equal(identity.split(jsonImport).length-1,1);
 const jsonUrl=pathToFileURL(path.resolve('port/v2/version.json')).href;
 const identityJs=stripTypeScriptTypes(identity.replace(jsonImport,'from '+JSON.stringify(jsonUrl)+' with {type: \'json\'};'),{mode:'strip'});
 const url='data:text/javascript;base64,'+Buffer.from(identityJs).toString('base64');
 assert.equal(source.split(spec).length-1,2);
 const executable=stripTypeScriptTypes(source.split(spec).join(JSON.stringify(url)),{mode:'strip'});
 const m=await import('data:text/javascript;base64,'+Buffer.from(executable).toString('base64'));
 return m.V2_DRAFT_RELEASE.sections.flatMap(s=>s.bullets);
}
const before=await rows(execFileSync('git',['show','acff88a884f1f9da6f018ef77b7af4432e079a6f:'+release],{encoding:'utf8'}));
const after=await rows(fs.readFileSync(release,'utf8')),g=fs.readFileSync(guide,'utf8');
const matches=[...g.matchAll(/GUIDE_DRAFT_BULLET_AUTHORITY = Object\.freeze\(\{\s+count: 121,\s+sha256: '([a-f0-9]{64})',/g)];assert.equal(matches.length,1);
assert.equal(before.length,121);assert.equal(after.length,121);
const changed=after.map((s,i)=>s===before[i]?-1:i).filter(i=>i>=0);assert.equal(changed.length,1);assert(after[changed[0]].includes('CREATURE MOTION STUDIES'));
const expected=matches[0][1],valid=a=>a.length===121&&sha(JSON.stringify(a))===expected;
assert(valid(after));assert(!valid(before));
const replaced=[...after];replaced[0]+=' MUTANT';assert(!valid(replaced));
const swapped=[...after];[swapped[0],swapped[1]]=[swapped[1],swapped[0]];assert(!valid(swapped));assert(!valid(after.slice(1)));
const out={status:'PASS_PURE_CURRENT_MODULE_AUTHORITY',count:121,changedBullets:1,onlyMotionStudiesChanged:true,beforeSha256:sha(JSON.stringify(before)),afterSha256:expected,releaseSha256:sha(fs.readFileSync(release)),guideSha256:sha(fs.readFileSync(guide)),negativeControls:['old-content','replaced-content','swapped-order','missing-bullet'],firstSSRLogRetained:B+'/anchored-p04-guide-pin-r01.log',firstWarning:'Sandbox HMR listen EPERM; this independent verifier does not start a listener',versionOrSealChanges:false};
fs.writeFileSync(B+'/anchored-p04-guide-verification-r03.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(out));
