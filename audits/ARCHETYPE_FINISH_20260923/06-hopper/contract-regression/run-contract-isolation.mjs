/** One contract-isolation proof only: no S2 pose/contact/ARAP replay. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath,pathToFileURL} from 'node:url';
import {rolldown} from '../../../../port/v2/node_modules/rolldown/dist/index.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',packet=path.dirname(fileURLToPath(import.meta.url)),entry=path.join(packet,'contract-entry.mjs');
const owner=path.join(root,'port/v2/tools/creature-animation/family-contracts.mjs'),relativeOwner=path.relative(root,owner),reportFile=path.join(packet,'contract-isolation-01.json');
assert(!fs.existsSync(reportFile),'Fresh isolation output required');
const read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex'),git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const consumed=new Map(),remember=p=>{p=path.resolve(p);const hash=sha(read(p)),prior=consumed.get(p);assert(!prior||prior.sha256===hash,'Source drift while bundling '+p);consumed.set(p,{path:p,sha256:hash});};
const report={schema:'cf.sentinel-contract-isolation/v1',status:'RUNNING',scope:'Resolved contracts/chains/action stance equality only; retained earlier S2 result is not a new S2 measurement',command:[process.execPath,fileURLToPath(import.meta.url)],cwd:root,node:process.version,startedAt:new Date().toISOString()};
let scratch;
try{
 assert.equal(git(['rev-parse','--show-toplevel']),root);assert.equal(git(['branch','--show-current']),'openai/mac');
 report.sourceHead=git(['rev-parse','HEAD']);report.referenceHead=git(['rev-parse','1dfeec2a^{commit}']);
 report.sourceState=git(['status','--porcelain','--untracked-files=all']).split('\n').filter(Boolean);
 const old=execFileSync('git',['show',report.referenceHead+':'+relativeOwner],{cwd:root}),current=read(owner);
 const delta="// Hopper bite/cast/victory raise the forelegs; dodge is an aerial recoil.\n// Faint and ordinary stance retain all contacts and the existing limits.\ncontracts.find(t=>t.id==='hopper').contactStance={default:'all',actions:{'melee:bite':'hind',cast:'hind',victory:'hind',dodge:'none'}};\n";
 const currentText=current.toString();assert.equal(currentText.split(delta).length,2,'Exact single hopper declaration span');assert.equal(currentText.replace(delta,''),old.toString(),'Only hopper declaration may differ from signed source');
 report.familyOwner={path:owner,referenceSha256:sha(old),currentSha256:sha(current),originalModuleIdPreserved:true,onlyDelta:delta};
 fs.writeFileSync(path.join(packet,'family-contracts-before.mjs'),old,{flag:'wx'});
 const s2Receipt=path.join(root,'audits/ARCHETYPE_FINISH_20260923/04-insect/contact-regression/s2-execution.json'),prior=JSON.parse(read(s2Receipt));remember(s2Receipt);
 assert.equal(prior.status,'PASS_STATIC_IDENTICAL');assert.equal(prior.subjectCount,6);assert.equal(prior.sampleCount,13286);
 report.priorS2={path:s2Receipt,sha256:sha(read(s2Receipt)),status:prior.status,identitySha256:prior.identitySha256,sampleCount:prior.sampleCount,replayed:false};
 report.priorSourceChecks=prior.sources.map(s=>{const hash=sha(read(s.path));if(s.path===owner){assert.equal(s.sha256,sha(old),'Signed family source must be previous measured S2 family');}else assert.equal(hash,s.sha256,'Previously measured S2 source changed '+s.path);remember(s.path);return {path:s.path,priorSha256:s.sha256,currentSha256:hash,expectedHopperOnlyChange:s.path===owner};});
 const baselineFile=path.join(root,'audits/BORROWED_ATLAS_20260922/s2/static.json'),baseline=JSON.parse(read(baselineFile));remember(baselineFile);assert.equal(baseline.status,'PASS_STATIC');
 const names=['crab','coconut-crab','freshwater-crab','mud-crab','vent-crab','civet'];assert.deepEqual(baseline.subjects.map(s=>s.subject),names);assert.equal(baseline.inputs.length,12);
 report.protectedInputs=baseline.inputs.map(s=>{assert.equal(sha(read(s.path)),s.sha256,'Protected input changed '+s.path);remember(s.path);return s;});assert.equal(new Set(report.protectedInputs.map(s=>s.path)).size,12);
 const records=baseline.inputs.filter(s=>s.path.endsWith('/record.json'));assert.equal(records.length,6);
 const subjects=records.map((s,i)=>({subject:names[i],record:JSON.parse(read(s.path)),actions:baseline.subjects[i].rows.map(r=>r.id)}));
 remember(fileURLToPath(import.meta.url));remember(entry);
 scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-hopper-contract-isolation-'));report.bundles=[];
 async function resolve(version){let replacements=0;const output=path.join(scratch,version+'.mjs');
  const bundle=await rolldown({input:entry,platform:'node',plugins:[{name:'original-module-family-reference',transform(code,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())remember(id);if(id===owner){replacements++;if(version==='before')return{code:old.toString(),map:null};}}}]});
  try{await bundle.write({file:output,format:'es'});}finally{await bundle.close();}assert.equal(replacements,1,'Original family module resolved exactly once');
  report.bundles.push({version,sha256:sha(read(output)),ownerModuleId:owner,ownerSha256:version==='before'?sha(old):sha(current),replacement:version==='before'});
  return (await import(pathToFileURL(output).href)).resolveSubjects(subjects);
 }
 const before=await resolve('before'),after=await resolve('after');assert.deepEqual(after,before,'Resolved S2 contracts/chains/stances differ');
 const mutant=structuredClone(after);mutant[0].contract.contactStance={...mutant[0].contract.contactStance,default:'none'};assert.throws(()=>assert.deepEqual(mutant,before));report.negativeControl='Changed one resolved stance is detected';
 const beforeBytes=JSON.stringify(before,null,2)+'\n',afterBytes=JSON.stringify(after,null,2)+'\n';assert.equal(afterBytes,beforeBytes,'Exact resolved JSON bytes');
 fs.writeFileSync(path.join(packet,'resolved-before.json'),beforeBytes,{flag:'wx'});fs.writeFileSync(path.join(packet,'resolved-current.json'),afterBytes,{flag:'wx'});
 report.subjects=after.map((s,i)=>({subject:s.subject,identical:true,resolvedSha256:sha(JSON.stringify(s)),recordSha256:records[i].sha256}));report.resolvedSha256=sha(afterBytes);report.subjectCount=after.length;report.status='PASS_CONTRACT_ISOLATION';
}catch(error){report.status='STOP';report.error=String(error.stack??error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();report.sources=[...consumed.values()].sort((a,b)=>a.path.localeCompare(b.path)).map(s=>({...s,afterSha256:fs.existsSync(s.path)?sha(read(s.path)):null}));if(report.sources.some(s=>s.sha256!==s.afterSha256)){report.status='STOP';report.sourceDrift=true;process.exitCode=1;}fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n',{flag:'wx'});if(scratch)fs.rmSync(scratch,{recursive:true,force:true});}
console.log(JSON.stringify({status:report.status,referenceHead:report.referenceHead,subjectCount:report.subjectCount,protectedInputCount:report.protectedInputs?.length,sourceCount:report.sources.length,priorS2Replayed:false,error:report.error??null,packet}));
