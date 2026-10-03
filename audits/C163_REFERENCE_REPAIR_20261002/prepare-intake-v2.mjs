import fs from 'node:fs';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const base='audits/C163_REFERENCE_REPAIR_20261002',src=base+'/intake.mjs',out=base+'/intake-v2.mjs',before=fs.readFileSync(src,'utf8');
const from="new URL('./authored-region-owners.mjs',import.meta.url)",to="new URL('../../port/v2/tools/creature-animation/authored-region-owners.mjs',import.meta.url)";
assert.equal(before.split(from).length-1,1);const after=before.replace(from,to);fs.writeFileSync(out,after,{flag:'wx'});
const sha=b=>createHash('sha256').update(b).digest('hex');
fs.writeFileSync(base+'/intake-v2-derivation.json',JSON.stringify({schema:'cf.c163-audit-harness-derivation/v1',source:src,sourceSha256:sha(before),target:out,targetSha256:sha(after),from,to,reason:'The first relocation missed a source-receipt URL. It refused before producing any fit files; this corrects only that receipt path.',failedOutput:base+'/16-lark/fit',failedOutputFiles:fs.readdirSync(base+'/16-lark/fit'),checksChanged:false},null,2)+'\n',{flag:'wx'});
