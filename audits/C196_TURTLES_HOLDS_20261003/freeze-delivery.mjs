import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const B='audits/C196_TURTLES_HOLDS_20261003',sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),J=p=>JSON.parse(read(p));
const walk=p=>fs.readdirSync(p).sort().flatMap(n=>{const q=p+'/'+n,s=fs.lstatSync(q);assert(!s.isSymbolicLink(),'no symlinks');return s.isDirectory()?walk(q):[q];});
const write=(name,value)=>fs.writeFileSync(B+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
assert(!fs.existsSync(B+'/delivery.json'));
let closureEntries=0;
for(const name of ['review-bundle-receipt.json','review-near-shin-bundle-receipt.json']){
 const r=J(B+'/'+name);for(const e of [...r.inputs,r.bundle]){assert.equal(sha(read(e.path)),e.sha256,'bound review source drift');closureEntries++;}
}
for(const s of J(B+'/selected.json').selected){assert.equal(sha(read(s.fit+'/record.json')),s.recordFileSha256);assert.equal(sha(read(s.fit+'/binding.json')),s.bindingFileSha256);assert.equal(sha(read(s.source)),s.sourceSha256);assert.equal(J(s.static).status,'PASS_STATIC');assert.equal(s.qualityAccepted,false);}
for(const r of J(B+'/visual-review.json').images)assert.equal(sha(read(r.path)),r.sha256);
const prior=J(B+'/source-verification.json'),last=J(B+'/near-shin-verification.json');assert.equal(prior.status,'PASS');assert.equal(last.status,'PASS');
for(const p of walk(B))if(['.mjs','.json','.md','.log'].includes(path.extname(p)))assert(!read(p).includes(Buffer.from(process.env.HOME)),'private home in text');
const toolchain=['audits/C196_PROGRAM_20261003/toolchain-check.json','audits/C196_PROGRAM_20261003/toolchain-verify.json'];
write('freeze-checks.json',{schema:'cf.c196-source-freeze-checks/v1',status:'PASS',boundReviewClosureEntries:closureEntries,selectedStaticPassing:2,partialNotFit:4,retainedOriginalRedActions:13,retainedFarShinRedActions:1,exactMasterBytesPreserved:true,privateHomeOccurrences:0,symlinks:0,qualityAccepted:false,native:false,productChanges:false,nodeVersion:process.version,toolchain:toolchain.map(path=>({path,sha256:sha(read(path))})),batchEndMailboxRead:{path:'~/Projects/celestial-frontier-anthropic-mac/audits/MAILBOX/TO_CODEX.md',lastRow:'C196'},cpuStatus:'TERMINAL; no active local jobs'});
const files=walk(B).map(path=>({path,bytes:fs.statSync(path).size,sha256:sha(read(path))}));
write('delivery.json',{schema:'cf.c196-turtles-holds-delivery/v1',status:'FROZEN_AUDIT_ONLY_VISUAL_HOLDS',owner:'Dakk',sourceRoot:'~/Projects/celestial-frontier-openai-mac',files,fileCount:files.length,totalBytes:files.reduce((n,p)=>n+p.bytes,0),selected:'selected.json',attempts:'attempts.json',visualReview:'visual-review.json',verification:['source-verification.json','near-shin-verification.json','freeze-checks.json'],qualityAccepted:false,native:false,productChanges:false,limitsChanged:false,cpuStatus:'TERMINAL'});
console.log(JSON.stringify({status:'FROZEN',fileCount:files.length,totalBytes:files.reduce((n,p)=>n+p.bytes,0),delivery:B+'/delivery.json',sha256:sha(read(B+'/delivery.json'))}));
