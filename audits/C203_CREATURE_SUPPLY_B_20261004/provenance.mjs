import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {assessPatternObservation} from '../../port/v2/tools/painted-creature/pattern-observation.mjs';
import {observeFraming} from './framing.mjs';
const base=path.relative(process.cwd(),import.meta.dirname),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p));
const rows=read(base+'/pilot.json'),coverage=read(base+'/coverage-at-selection.json'),notes=read(base+'/visual-notes.json'),observations=read(base+'/observations.json'),manual=read(base+'/manual-framing.json');
const compiler='port/v2/tools/painted-creature/compile-library-master.mjs',compilerSha256=sha(fs.readFileSync(compiler)),kitSha256=sha(fs.readFileSync('ART_KIT.md')),batchCompilerSha256=sha(fs.readFileSync(base+'/compile.mjs'));
const accepted=new Set(coverage.families.flatMap(f=>f.names));
const excluded=new Set(read(base+'/excluded-recent.json'));
function rosterCheck(rr){assert.equal(rr.length,24);assert.equal(new Set(rr.map(r=>r.name)).size,24);assert.equal(new Set(rr.map(r=>r.id)).size,24);assert(rr.every(r=>!accepted.has(r.name)&&!excluded.has(r.name)&&r.purpose==='TARGETED_SOURCE_REPAINT'&&r.repairReason.priorSources.length>0));}
function packet(r){const dir=r.packet;return{r,q:read(dir+'/request.json'),g:read(dir+'/generation.json'),canonical:fs.readFileSync(dir+'/prompt.canonical.txt','utf8'),prompt:fs.readFileSync(dir+'/prompt.txt','utf8'),bytes:fs.readFileSync(dir+'/master.png'),review:read(dir+'/visual-review.json'),pattern:read(dir+'/pattern-check.json'),subject:read(dir+'/subject-source.json'),o:observations.find(x=>x.id===r.id)};}
function verify(p){
 const {r,q,g,canonical,prompt,bytes,review,pattern,subject,o}=p;
 assert.equal(q.name,r.name);assert.equal(subject.name,r.name);assert.equal(subject.species.name,r.name);assert.equal(q.family,r.family);assert.equal(q.auditCompilerExtension,false);assert.equal(q.authoringCreated,false);
 assert.equal(q.compilerSha256,compilerSha256);assert.equal(q.kitSha256,kitSha256);assert.equal(q.batchCompilerSha256,batchCompilerSha256);assert.equal(q.basePromptSha256,sha(canonical));assert.equal(q.promptSha256,sha(prompt));
 assert.equal(prompt,q.compositionCheck+'\n'+q.sourceCorrection+'\n\n'+canonical+'\n\n'+q.sourceCorrection+'\n'+q.compositionCheck+'\n');
 assert.equal(q.reference,'audits/MIDGAME_ART_DIRECTION_20260908/01-discovery-atlas.png');assert.equal(q.referenceSha256,sha(fs.readFileSync(q.reference)));assert.equal(q.referenceSha256,'c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62');
 assert.equal(g.masterSha256,sha(bytes));assert.equal(g.bytes,bytes.length);assert.equal(g.promptSha256,q.promptSha256);assert.equal(g.styleReferenceSha256,q.referenceSha256);assert.equal(g.outputModified,false);assert.equal(g.sourceOriginalRetained,true);assert.equal(g.tool,'image_gen.imagegen');
 const source=g.sourcePath.startsWith('~/')?path.join(os.homedir(),g.sourcePath.slice(2)):g.sourcePath;assert(bytes.equals(fs.readFileSync(source)));
 assert.deepEqual(q.repairReason,r.repairReason);assert(q.priorPilotPaths.length);assert.equal(q.requestedSize[0],1254);assert.equal(q.requestedSize[1],1254);assert.equal(q.observedVisibleLegs,null);
 assert.equal(o.masterSha256,g.masterSha256);assert.equal(o.width,1254);assert.equal(o.height,1254);assert.equal(review.masterSha256,g.masterSha256);assert.equal(review.observation,notes[r.name]);assert(notes[r.name]?.length>20);assert.equal(pattern.masterSha256,g.masterSha256);
}
rosterCheck(rows);const packets=rows.map(packet);for(const p of packets)verify(p);
const controls=[];function check(name,fn){fn();controls.push({name,status:'PASS'});}
check('all24 exact original/prompt/style/canonical/review positives',()=>assert.equal(packets.length,24));
const p=packets[0];
for(const[name,mutate]of [
 ['altered submitted prompt refused',q=>{q.prompt+=' altered';}],
 ['altered master byte refused',q=>{q.bytes=Buffer.concat([q.bytes,Buffer.from([0])]);}],
 ['wrong style reference refused',q=>{q.q.referenceSha256='0'.repeat(64);}],
 ['stale canonical prompt refused',q=>{q.canonical+=' altered';}],
 ['missing review refused',q=>{q.review=null;}],
 ['missing generation receipt refused',q=>{q.g=null;}],
 ['stale pattern observation refused',q=>{q.pattern.masterSha256='0'.repeat(64);}],
 ['invented measured limb count refused',q=>{q.q.observedVisibleLegs=4;}],
])check(name,()=>{const q={...p,q:{...p.q},g:{...p.g},pattern:{...p.pattern},review:{...p.review}};mutate(q);assert.throws(()=>verify(q));});
check('missing original row refused',()=>assert.throws(()=>rosterCheck(rows.slice(1))));
check('same-count duplicate identity refused',()=>assert.throws(()=>rosterCheck([rows[0],rows[0],...rows.slice(2)])));
check('accepted identity refused',()=>assert.throws(()=>rosterCheck([{...rows[0],name:[...accepted][0]},...rows.slice(1)])));
check('previous C202 delivery identity refused',()=>assert.throws(()=>rosterCheck([{...rows[0],name:[...excluded][0]},...rows.slice(1)])));
check('unchanged pattern instrument stale/absent controls',()=>{const species={name:'synthetic patterned control',mustRead:['dark stripes']},b=Buffer.from('control');const obs={name:species.name,masterSha256:sha(b),status:'PRESENT',features:[{requirement:'dark stripes',status:'PRESENT',observed:'Synthetic positive only'}]};assert.equal(assessPatternObservation(species,b,obs).status,'PASS');assert.equal(assessPatternObservation(species,b,{...obs,masterSha256:'0'.repeat(64)}).status,'REFUSE');assert.equal(assessPatternObservation(species,b,{...obs,status:'ABSENT'}).status,'REFUSE');assert.equal(assessPatternObservation(species,b,{...obs,features:[]}).status,'REFUSE');});
check('unchanged framing empty/edge/central controls',()=>{const m=new Uint8Array(100);assert.equal(observeFraming(m,10,10).status,'REFUSE');m[55]=1;assert.equal(observeFraming(m,10,10).status,'PASS_FRAMING_ONLY');m[50]=1;assert.equal(observeFraming(m,10,10).status,'REFUSE');});
function manualCheck(row){assert.equal(row.status,'REFUSE');assert.equal(row.requiredMargin,101);assert.equal(row.masterSha256,sha(fs.readFileSync(row.master)));assert(row.observation.length>20);assert(rows.some(r=>r.name===row.name&&r.master===row.master));}
for(const m of manual.rows){manualCheck(m);check(m.name+' stale/manual false-pass refusals',()=>{assert.throws(()=>manualCheck({...m,masterSha256:'0'.repeat(64)}));assert.throws(()=>manualCheck({...m,status:'PASS'}));});}
const entries=packets.map(p=>({name:p.r.name,id:p.r.id,purpose:p.r.purpose,family:p.r.family,compiler:'UNCHANGED_PRODUCTION_CANONICAL_COMPILER',canonicalPromptSha256:p.q.basePromptSha256,finalPromptSha256:p.q.promptSha256,masterSha256:p.g.masterSha256,nativeDimensions:[p.o.width,p.o.height],patternStatus:p.pattern.status,automaticFraming:p.o.framing.status,wholeOriginalFraming:manual.rows.some(m=>m.name===p.r.name)?'REFUSE':p.o.framing.status,sourceDisposition:'SOURCE_CANDIDATE_WITH_EXPLICIT_VISUAL_HOLDS',visualHolds:p.review.observation}));
const proof={schema:'cf.g2-source-pipeline-proof/v1',scope:'24 unchanged canonical compiler routes with disclosed source-visibility/composition additions. Native generator bytes retained. No authoring, native, reference-pool, runtime or gallery admission.',sourceCompiler:{path:compiler,sha256:compilerSha256},kitSha256,batchCompilerSha256,coveredAtSelection:coverage.covered,entries};
fs.writeFileSync(base+'/controls.json',JSON.stringify({schema:'cf.g2-source-controls/v1',scope:'In-memory mutations only; masters/prompts and product unchanged',controls},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(base+'/pipeline-proof.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({entries:entries.length,controls:controls.length,allControls:'PASS',canonicalRoutes:24,sourceMastersUnmodified:true}));

