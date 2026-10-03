import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='audits/C213_CREATURE_SUPPLY_20261002',sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p));
const transform=read(base+'/transform-receipt.json'),selection=read(base+'/selection.json'),rows=read(base+'/pilot.json'),notes=read(base+'/visual-notes.json'),controls=read(base+'/controls.json');
assert.equal(sha(fs.readFileSync(transform.source)),transform.sourceSha256);
assert.equal(sha(fs.readFileSync(transform.output)),transform.outputSha256);
assert.equal(controls.controls.length,26);assert(controls.controls.every(r=>r.status==='PASS'));
assert.equal(controls.sourceSha256,transform.sourceSha256);assert.equal(controls.auditCompilerSha256,transform.outputSha256);
const kitSha256=sha(fs.readFileSync('ART_KIT.md')),batchSha256=sha(fs.readFileSync(base+'/compile.mjs')),entries=[];
for(const r of rows){
 const q=read(r.packet+'/request.json'),g=read(r.packet+'/generation.json'),canonical=fs.readFileSync(r.packet+'/prompt.canonical.txt','utf8'),prompt=fs.readFileSync(r.packet+'/prompt.txt','utf8'),pattern=read(r.packet+'/pattern-check.json'),review=read(r.packet+'/visual-review.json');
 assert.equal(q.name,r.name);assert.equal(q.purpose,r.purpose);assert.equal(q.basePromptSha256,sha(canonical));assert.equal(q.promptSha256,sha(prompt));
 assert.equal(prompt,q.compositionCheck+'\n'+q.sourceCorrection+'\n\n'+canonical+'\n\n'+q.sourceCorrection+'\n'+q.compositionCheck+'\n');
 assert.equal(q.compilerSha256,q.auditCompilerExtension?transform.outputSha256:transform.sourceSha256);assert.equal(q.batchCompilerSha256,batchSha256);assert.equal(q.kitSha256,kitSha256);
 assert.equal(q.referenceSha256,sha(fs.readFileSync(q.reference)));assert.equal(g.masterSha256,sha(fs.readFileSync(r.master)));assert.equal(g.promptSha256,q.promptSha256);assert.equal(review.masterSha256,g.masterSha256);assert.equal(review.observation,notes[r.name]);assert.equal(pattern.masterSha256,g.masterSha256);
 assert.equal(q.auditCompilerExtension,selection.specialists.includes(r.name));
 if(r.purpose==='TARGETED_SOURCE_REPAINT'){assert(q.repairReason?.reasons.length);assert(q.priorPilotPaths.length);assert.equal(q.repairReason.previousMaster,r.repairReason.previousMaster);}else{assert.equal(q.repairReason,null);assert.equal(q.priorPilotPaths.length,0);}
 entries.push({name:r.name,purpose:r.purpose,compiler:q.auditCompilerExtension?'AUDIT_SPECIALIZED_LAYOUT_EXTENSION':'UNCHANGED_PRODUCTION_CANONICAL_COMPILER',canonicalPromptSha256:q.basePromptSha256,finalPromptSha256:q.promptSha256,masterSha256:g.masterSha256,patternStatus:pattern.status,framingStatus:review.framing.status,sourceDisposition:r.name==='Impala'?'REFUSE_EXTRA_FORELEG':'SOURCE_CANDIDATE_WITH_VISUAL_HOLDS',visualHolds:notes[r.name]});
}
assert.equal(entries.filter(r=>r.purpose==='TARGETED_SOURCE_REPAINT').length,18);assert.equal(entries.filter(r=>r.purpose==='NEW_SOURCE_IDENTITY').length,6);assert.equal(entries.filter(r=>r.compiler==='AUDIT_SPECIALIZED_LAYOUT_EXTENSION').length,5);
const proof={schema:'cf.g2-source-pipeline-proof/v1',scope:'Nineteen unchanged canonical compiler routes; five explicitly audited named layout extensions. All retain exact canonical prompt, ART_KIT and DiscoveryAtlas style input, with recorded composition/source-visibility additions. Painting requests are not observed anatomy. No runtime, registered pack, reference pool or native qualification.',sourceCompiler:{path:transform.source,sha256:transform.sourceSha256},auditCompiler:{path:transform.output,sha256:transform.outputSha256},kitSha256,batchCompilerSha256:batchSha256,controls:26,entries};
fs.writeFileSync(base+'/pipeline-proof.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({entries:entries.length,canonicalRoutes:19,auditRoutes:5,explicitAnatomyRefusals:['Impala'],pipelineProofSha256:sha(fs.readFileSync(base+'/pipeline-proof.json'))}));
