import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { acquireWorkspaceLock } from '../workspacelock.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=fs.realpathSync(path.resolve(here,'../../../..'));
if(process.argv.length!==3)throw Error('Usage: chain.mjs /absolute/new-packet-directory');
const out=path.resolve(process.argv[2]);if(fs.existsSync(out))throw Error('Packet must be new');fs.mkdirSync(out,{recursive:false});
const report={schema:'cf-native-audio-mix-chain/v1',status:'RUNNING',startedAt:new Date().toISOString(),steps:[]};
const persist=()=>fs.writeFileSync(path.join(out,'chain.json'),JSON.stringify(report,null,2)+'\n');persist();
let release;
try{
  release=acquireWorkspaceLock('isolated native audio waveform build and browser');
  const steps=[...['build','runner','chain'].map(name=>['syntax-'+name,['--check',path.join(here,name+'.mjs')]]),
    ['typecheck',[path.join(repo,'port/v2/node_modules/typescript/bin/tsc'),'-p',path.join(here,'tsconfig.json')]],
    ['build',[path.join(here,'build.mjs'),path.join(out,'build')]],['native',[path.join(here,'runner.mjs'),path.join(out,'build'),path.join(out,'native')]]];
  for(const [name,args] of steps){
    const step={name,args,startedAt:new Date().toISOString(),status:'RUNNING'};report.steps.push(step);persist();
    const result=spawnSync(process.execPath,args,{cwd:repo,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
    fs.writeFileSync(path.join(out,name+'.log'),(result.stdout??'')+(result.stderr??''),{flag:'wx'});
    Object.assign(step,{status:result.status===0&&!result.error?'PASS':'FAIL',exitCode:result.status,signal:result.signal,error:result.error?.message??null,finishedAt:new Date().toISOString()});persist();
    if(step.status!=='PASS')throw Error(`${name} failed; no successor attempted`);
  }
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;}
finally{
  try{release?.();report.workspaceReleased=Boolean(release);}
  catch(error){report.status='FAIL';report.workspaceReleased=false;report.workspaceCleanupError=String(error.stack??error);process.exitCode=1;}
  report.finishedAt=new Date().toISOString();persist();
}
console.log(JSON.stringify({status:report.status,report:path.join(out,'chain.json')}));
