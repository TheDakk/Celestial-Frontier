/** One unchanged S2 execution, with output routing only; no browser or lock. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';import {gunzipSync} from 'node:zlib';import {spawn,execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {rolldown} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/node_modules/rolldown/dist/index.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',packet=path.dirname(fileURLToPath(import.meta.url)),out=path.join(packet,'s2');
const owner=path.join(root,'audits/BORROWED_ATLAS_20260922/s2-controls.ts'),baseline=path.join(root,'audits/BORROWED_ATLAS_20260922/s2');
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p),sources=new Map();
const remember=p=>{p=path.resolve(p);const hash=sha(read(p)),old=sources.get(p);assert(!old||old.sha256===hash,'Source changed during build: '+p);sources.set(p,{path:p,sha256:hash});};
const command=[process.execPath,fileURLToPath(import.meta.url)],executionFile=path.join(packet,'s2-execution.json'),logFile=path.join(packet,'s2-run.log');
for(const p of [out,executionFile,logFile])assert(!fs.existsSync(p),'New output required: '+p);
assert.equal(execFileSync('git',['rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8'}).trim(),root);
assert.equal(execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),'openai/mac');
const historicalSources=JSON.parse(read(path.join(root,'audits/BORROWED_ATLAS_20260922/s2-controls.sources.json')));
for(const p of [owner,path.join(root,'audits/ANATOMY_SINGLE_RUN_20260919/R3-S/offline.ts'),path.join(root,'audits/BEAR_CONTACT_DIAGNOSTICS_20260922/source-join-s2.mjs')]){
  const prior=historicalSources.find(x=>x.path===p);assert(prior,'Retained instrument authority missing: '+p);assert.equal(sha(read(p)),prior.sha256,'Retained instrument changed: '+p);
}
const baselineReport=JSON.parse(read(path.join(baseline,'static.json')));assert.equal(baselineReport.status,'PASS_STATIC');
const retainedInputs=baselineReport.inputs.map(x=>{assert.equal(sha(read(x.path)),x.sha256,'Sentinel input changed: '+x.path);return x;});
const execution={schema:'cf.s2-repair-execution/v1',status:'RUNNING',command,cwd:root,startedAt:new Date().toISOString(),sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceState:execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean),node:process.version,owner,ownerSha256:sha(read(owner)),orchestratorSha256:sha(read(fileURLToPath(import.meta.url))),baseline,retainedInputs,noRetry:true,browser:false,workspaceLock:false,metadataNote:'The retained sentinel embeds historical signedProducer/sourceState prose. This execution measures the actual HEAD plus dirty state above; it does not certify clean or signed current working bytes.'};
const save=()=>fs.writeFileSync(executionFile,JSON.stringify(execution,null,2)+'\n');save();
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-repair-s2-')),bundleFile=path.join(scratch,'s2.mjs');let transforms=0;
try{
  const original="const out='audits/BORROWED_ATLAS_20260922/s2'",replacement="const out='audits/ARCHETYPE_REPAIRS_20260922/01-i5/s2'";
  const bundle=await rolldown({input:owner,platform:'node',plugins:[{name:'s2-unchanged-owner-output-routing',transform(code,id){
    if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())remember(id);
    if(id!==owner)return;assert.equal(code.split(original).length,2,'Exactly one output path span');const routed=code.replace(original,replacement);transforms++;
    execution.transform={owner,original,replacement,sourceSha256:sha(code),executedSourceSha256:sha(routed),sampleLogicChanged:false,thresholdsChanged:false};return {code:routed,map:null};
  }}]});try{await bundle.write({file:bundleFile,format:'es'});}finally{await bundle.close();}
  assert.equal(transforms,1);execution.bundleSha256=sha(read(bundleFile));execution.childCommand=[process.execPath,bundleFile];save();
  const fd=fs.openSync(logFile,'wx');let outcome;
  try{outcome=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[bundleFile],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});
    child.stdout.on('data',b=>{fs.writeSync(fd,b);process.stdout.write(b);});child.stderr.on('data',b=>{fs.writeSync(fd,b);process.stderr.write(b);});child.on('error',reject);child.on('close',(code,signal)=>resolve({code,signal}));});
  }finally{fs.closeSync(fd);}
  execution.childExitCode=outcome.code;execution.childSignal=outcome.signal;
  const report=JSON.parse(read(path.join(out,'static.json')));execution.sentinelStatus=report.status;
  assert.equal(outcome.code,0,'S2 execution refused');assert.equal(report.status,'PASS_STATIC','S2 shared-path red');
  const identities=[];
  for(const row of report.subjects){
    const receipt=read(path.join(out,row.subject+'-static.json')),priorReceipt=read(path.join(baseline,row.subject+'-static.json'));
    const samples=gunzipSync(read(path.join(out,row.subject+'-support-samples.jsonl.gz'))),priorSamples=gunzipSync(read(path.join(baseline,row.subject+'-support-samples.jsonl.gz')));
    identities.push({subject:row.subject,receiptIdentical:receipt.equals(priorReceipt),samplesIdentical:samples.equals(priorSamples),receiptSha256:sha(receipt),baselineReceiptSha256:sha(priorReceipt),samplesSha256:sha(samples),baselineSamplesSha256:sha(priorSamples),sampleCount:samples.toString().trimEnd().split('\n').length});
  }
  fs.writeFileSync(path.join(out,'identity.json'),JSON.stringify(identities,null,2)+'\n',{flag:'wx'});
  assert.deepEqual(report.subjects,baselineReport.subjects,'Complete aggregate subject receipts differ');assert.deepEqual(report.inputs,baselineReport.inputs,'Sentinel input inventory differs');
  assert(identities.every(x=>x.receiptIdentical&&x.samplesIdentical),'S2 complete receipts or support bytes differ');
  for(const s of sources.values())assert.equal(sha(read(s.path)),s.sha256,'Executed source changed: '+s.path);
  for(const s of retainedInputs)assert.equal(sha(read(s.path)),s.sha256,'Sentinel input changed during execution: '+s.path);
  execution.status='PASS_STATIC_IDENTICAL';execution.identitySha256=sha(read(path.join(out,'identity.json')));execution.subjectCount=identities.length;execution.sampleCount=identities.reduce((n,x)=>n+x.sampleCount,0);
}catch(error){execution.status='S2_STOP';execution.error=String(error.stack??error);process.exitCode=1;console.error(execution.error);}
finally{execution.finishedAt=new Date().toISOString();execution.logSha256=fs.existsSync(logFile)?sha(read(logFile)):null;execution.sources=[...sources.values()].sort((a,b)=>a.path.localeCompare(b.path));save();if(fs.existsSync(out))fs.writeFileSync(path.join(out,'sources.json'),JSON.stringify(execution.sources,null,2)+'\n',{flag:'wx'});fs.rmSync(scratch,{recursive:true,force:true});}
console.log(JSON.stringify({status:execution.status,sourceHead:execution.sourceHead,subjectCount:execution.subjectCount,sampleCount:execution.sampleCount,packet:out}));
