/** Primate data-edit isolation only. Does not execute a pose, solver, browser or S2 replay. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';
import {rolldown} from '../../../port/v2/node_modules/rolldown/dist/index.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',packet=path.dirname(fileURLToPath(import.meta.url));
const relativeOwner='port/v2/tools/creature-animation/family-contracts.mjs',owner=path.join(root,relativeOwner),reportFile=path.join(packet,'contact-isolation-02.json');
assert(!fs.existsSync(reportFile),'Fresh output required; no unchanged retry');
const read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const consumed=new Map(),remember=p=>{p=path.resolve(p);const hash=sha(read(p));assert(!consumed.has(p)||consumed.get(p)===hash,'Source drift '+p);consumed.set(p,hash);};
const report={schema:'cf.sentinel-contract-isolation/v1',status:'RUNNING',scope:'Exact primate-only source hunk; six resolved S2 contracts/chains/action stances and twelve protected input files. No solver, static/native measurement, browser or post-change S2 replay.',command:[process.execPath,fileURLToPath(import.meta.url)],cwd:root,node:process.version,startedAt:new Date().toISOString()};
let scratch;
const productionPath=p=>!p.startsWith('audits/')&&!p.endsWith('.md')&&p!=='.DS_Store';
function deltaPaths(reference){
 const tracked=git(['diff','--name-only',reference,'--']).split('\n').filter(p=>p&&productionPath(p));
 const untracked=git(['ls-files','--others','--exclude-standard']).split('\n').filter(p=>p&&productionPath(p));
 return {tracked,untracked};
}
try{
 assert.equal(git(['rev-parse','--show-toplevel']),root);assert.equal(git(['branch','--show-current']),'openai/mac');
 report.referenceHead=git(['rev-parse','2398916e^{commit}']);report.sourceHead=git(['rev-parse','HEAD']);assert.equal(report.sourceHead,report.referenceHead,'Expected signed Frog predecessor');
 report.productionSourceDelta=deltaPaths(report.referenceHead);
 assert.deepEqual(report.productionSourceDelta.tracked,[relativeOwner],'Only tracked production delta may be the primate declaration');
 assert.deepEqual(report.productionSourceDelta.untracked,['port/v2/apps/game/src/creature-rig-contact-primate.test.ts'],'Only the new focused primate test is an untracked production-tree delta');
 for(const file of [...report.productionSourceDelta.tracked,...report.productionSourceDelta.untracked])remember(path.join(root,file));
 const before=execFileSync('git',['show',report.referenceHead+':'+relativeOwner],{cwd:root}),after=read(owner);
 const hunk="// Primate's bilateral leg tuck follows the existing unplanted stage dodge;\n// ordinary stance and faint retain both feet and all numerical limits.\ncontracts.find(t=>t.id==='primate').contactStance={default:'all',actions:{dodge:'none'}};\n";
 assert.equal(after.toString().split(hunk).length,2,'One exact reversible primate hunk required');
 const restored=Buffer.from(after.toString().replace(hunk,''));assert(restored.equals(before),'Removing only the primate hunk must recover signed file bytes');
 report.familyOwner={path:owner,referenceSha256:sha(before),currentSha256:sha(after),recoveredSha256:sha(restored),exactRecoveredBytes:true,onlyDelta:hunk,originalModuleIdPreserved:true};
 const priorPath=path.join(root,'audits/ARCHETYPE_FINISH_20260923/06-hopper/contact-regression/s2-execution.json'),prior=JSON.parse(read(priorPath));remember(priorPath);
 assert.equal(prior.status,'PASS_STATIC_IDENTICAL');assert.equal(prior.subjectCount,6);assert.equal(prior.sampleCount,13286);
 report.priorS2={path:priorPath,sha256:sha(read(priorPath)),status:prior.status,identitySha256:prior.identitySha256,sampleCount:prior.sampleCount,replayed:false};
 // Frog's final signed state includes two separately proved admission guards.
 // Follow that signed source-isolation receipt; do not rebind its earlier S2
 // samples to the later guarded file bytes.
 const isolationPath=path.join(root,'audits/ARCHETYPE_FINISH_20260923/06-hopper/contact-regression/final-admission-isolation01.json');
 const isolationBytes=read(isolationPath),isolation=JSON.parse(isolationBytes);remember(isolationPath);
 assert.equal(sha(isolationBytes),sha(execFileSync('git',['show',report.referenceHead+':'+path.relative(root,isolationPath)],{cwd:root})),'Prior isolation receipt must be the exact signed blob');
 assert.equal(isolation.status,'PASS_SOURCE_ISOLATION');assert.equal(isolation.postGuardS2Run,false);assert.equal(isolation.samplesReplayed,0);
 assert.equal(isolation.priorS2Execution.sha256,sha(read(priorPath)),'Prior isolation must refer to this exact S2 receipt');
 const finalSources=new Map(isolation.s2ConsumedFiles.map(source=>[source.path,source]));assert.equal(finalSources.size,prior.sources.length);
 report.previousFinalIsolation={path:isolationPath,sha256:sha(isolationBytes),signedReferenceHead:report.referenceHead,status:isolation.status,postGuardS2Run:false,scope:isolation.scope};
 const failedPath=path.join(packet,'contact-isolation-01.json');remember(failedPath);
 report.retainedEarlierStop={path:failedPath,sha256:sha(read(failedPath)),reason:JSON.parse(read(failedPath)).error,classification:'Proof01 incorrectly required all final signed Frog source bytes to equal its earlier S2 source snapshot; the signed post-S2 isolation receipt supplies the missing provenance.'};
 report.retainedReadOnlySetupError={command:'git show 2398916e:port/v2/node_modules/gsap/CSSPlugin.js',error:"fatal: path 'port/v2/node_modules/gsap/CSSPlugin.js' exists on disk, but not in '2398916e'",scope:'A read-only follow-up inventory attempted to read an ignored dependency as a Git blob and stopped. Dependency baselines instead use the signed source-isolation receipt hashes. No solver/test/browser was run.'};
 report.priorSourceChecks=prior.sources.map(source=>{
  const baseline=finalSources.get(source.path);assert(baseline,'Every prior S2 source needs a signed final-source baseline');assert.equal(baseline.measuredSha256,source.sha256);
  const hash=sha(read(source.path));
  if(source.path===owner)assert.equal(baseline.currentSha256,sha(before),'Signed family bytes must equal the final isolated family baseline');
  else assert.equal(hash,baseline.currentSha256,'Source changed since signed Frog isolation '+source.path);
  remember(source.path);return {path:source.path,priorMeasuredSha256:source.sha256,signedFinalBaselineSha256:baseline.currentSha256,currentSha256:hash,expectedPrimateOnlyChange:source.path===owner};
 });
 const familyPath=path.join(root,'port/v2/tools/creature-animation/family-record.mjs'),guardProof=isolation.reversibleSourceChanges.find(change=>change.path===familyPath);assert(guardProof?.exactRoundTrip);
 const familyCurrent=read(familyPath);assert.equal(sha(familyCurrent),guardProof.currentSha256);assert.equal(sha(familyCurrent),sha(execFileSync('git',['show',report.referenceHead+':'+path.relative(root,familyPath)],{cwd:root})));
 let reversed=familyCurrent.toString();for(const edit of guardProof.replacements){assert.equal(reversed.split(edit.current).length,2,'Exact signed guard span');reversed=reversed.replace(edit.current,edit.measured);}
 assert.equal(sha(reversed),guardProof.measuredSha256,'Signed guards still reconstruct the prior measured S2 file');
 report.retainedAdmissionGuards={path:familyPath,measuredSha256:guardProof.measuredSha256,signedAndCurrentSha256:sha(familyCurrent),reconstructedMeasuredSha256:sha(reversed),replacements:guardProof.replacements};
 const baselinePath=path.join(root,'audits/BORROWED_ATLAS_20260922/s2/static.json'),baseline=JSON.parse(read(baselinePath));remember(baselinePath);
 assert.equal(baseline.status,'PASS_STATIC');const names=['crab','coconut-crab','freshwater-crab','mud-crab','vent-crab','civet'];
 assert.deepEqual(baseline.subjects.map(subject=>subject.subject),names);assert.equal(baseline.inputs.length,12);
 const priorInputs=new Map(prior.retainedInputs.map(input=>[input.path,input.sha256]));assert.equal(priorInputs.size,12);
 report.protectedInputs=baseline.inputs.map(input=>{const hash=sha(read(input.path));assert.equal(hash,input.sha256,'Original protected input changed '+input.path);assert.equal(hash,priorInputs.get(input.path),'Signed predecessor protected input changed '+input.path);remember(input.path);return {...input,currentSha256:hash,unchanged:true};});
 assert.equal(new Set(report.protectedInputs.map(input=>input.path)).size,12);
 const records=baseline.inputs.filter(input=>input.path.endsWith('/record.json'));assert.equal(records.length,6);
 const subjects=records.map((input,i)=>({subject:names[i],record:JSON.parse(read(input.path)),actions:baseline.subjects[i].rows.map(row=>row.id)}));
 report.admissionGuardPredicates=subjects.map(subject=>{const hasPads=Object.hasOwn(subject.record.geometry??{},'contactPads');assert.equal(hasPads,false,'The signed admission guard condition must remain non-rejecting');return {subject:subject.subject,ownContactPads:hasPads,insertedNeedArgument:!hasPads};});
 const entry=`import {familyContractForRecord,familyContactChains,contactStanceForAction} from ${JSON.stringify(owner)};export function resolveSubjects(subjects){return subjects.map(({subject,record,actions})=>{const contract=familyContractForRecord(record);return {subject,contract,chains:familyContactChains(contract),stances:Object.fromEntries(actions.map(id=>[id,contactStanceForAction(contract,id)]))};});}`;
 report.virtualEntry={source:entry,sha256:sha(entry)};remember(fileURLToPath(import.meta.url));scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-primate-contract-isolation-'));report.bundles=[];
 async function resolve(version){
  let replacements=0;const output=path.join(scratch,version+'.mjs');
  const bundle=await rolldown({input:'contract-isolation',platform:'node',plugins:[{name:'original-module-family-reference',resolveId(id){if(id==='contract-isolation')return '\0contract-entry';},load(id){if(id==='\0contract-entry')return entry;},transform(code,id){
   if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())remember(id);
   if(id===owner){replacements++;if(version==='before')return {code:before.toString(),map:null};}
  }}]});
  try{await bundle.write({file:output,format:'es'});}finally{await bundle.close();}
  assert.equal(replacements,1,'Original family module must be resolved exactly once');
  report.bundles.push({version,sha256:sha(read(output)),ownerModuleId:owner,ownerSha256:version==='before'?sha(before):sha(after),replacement:version==='before'});
  return (await import(pathToFileURL(output).href)).resolveSubjects(subjects);
 }
 const oldResolved=await resolve('before'),currentResolved=await resolve('after');assert.deepEqual(currentResolved,oldResolved,'Actual S2 resolved contracts differ');
 const canonical=value=>JSON.stringify(value,null,2)+'\n',oldBytes=canonical(oldResolved),currentBytes=canonical(currentResolved);assert.equal(currentBytes,oldBytes,'Actual S2 resolved JSON bytes differ');
 const mutant=structuredClone(currentResolved);mutant[0].contract.contactStance={...mutant[0].contract.contactStance,default:'none'};
 assert.throws(()=>assert.deepEqual(mutant,oldResolved));assert.notEqual(canonical(mutant),oldBytes);
 report.negativeControl={mutation:'One resolved default contact stance changed to none',deepComparisonRejected:true,canonicalBytesDiffer:true};
 report.resolvedSha256={before:sha(oldBytes),current:sha(currentBytes)};report.resolvedSubjects=currentResolved;
 report.subjects=currentResolved.map((subject,i)=>({subject:subject.subject,identical:true,resolvedSha256:sha(canonical(subject)),recordSha256:records[i].sha256}));
 report.subjectCount=currentResolved.length;report.status='PASS_CONTRACT_ISOLATION';
}catch(error){report.status='STOP';report.error=String(error.stack??error);process.exitCode=1;}
finally{
 report.finishedAt=new Date().toISOString();report.sources=[...consumed].sort(([a],[b])=>a.localeCompare(b)).map(([file,sha256])=>({path:file,sha256,afterSha256:fs.existsSync(file)?sha(read(file)):null}));
 if(report.sources.some(source=>source.sha256!==source.afterSha256)){report.status='STOP';report.sourceDrift=true;process.exitCode=1;}
 if(report.referenceHead){report.productionSourceDeltaAfter=deltaPaths(report.referenceHead);if(JSON.stringify(report.productionSourceDeltaAfter)!==JSON.stringify(report.productionSourceDelta)){report.status='STOP';report.deltaPathsChanged=true;process.exitCode=1;}}
 fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n',{flag:'wx'});if(scratch)fs.rmSync(scratch,{recursive:true,force:true});
}
console.log(JSON.stringify({status:report.status,referenceHead:report.referenceHead,subjectCount:report.subjectCount,protectedInputs:report.protectedInputs?.length,priorSourceChecks:report.priorSourceChecks?.length,consumedSources:report.sources.length,productionSourceDelta:report.productionSourceDelta,replayed:false,error:report.error??null}));
