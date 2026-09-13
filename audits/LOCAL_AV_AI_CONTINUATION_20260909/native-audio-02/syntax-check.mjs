import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const repo=fs.realpathSync(path.resolve(out,'../../..'));
const receipt=path.join(out,'syntax-correction.json');
if(fs.existsSync(receipt))throw Error('Syntax correction receipt must be new');
const report={schema:'cf-native-audio-syntax-correction/v1',status:'RUNNING',scope:'Node syntax only; no TypeScript, build or browser',node:{executable:process.execPath,version:process.version},startedAt:new Date().toISOString(),steps:[]};
const save=()=>fs.writeFileSync(receipt,JSON.stringify(report,null,2)+'\n');save();
try{
  for(const name of ['build','runner','chain']){
    const relative=`port/v2/tools/audio-native-mix/${name}.mjs`,source=fs.readFileSync(path.join(repo,relative));
    const args=['--check',relative];
    const step={name,args,source:{path:relative,bytes:source.length,sha256:crypto.createHash('sha256').update(source).digest('hex')},startedAt:new Date().toISOString()};
    const result=spawnSync(process.execPath,args,{cwd:repo,timeout:10000,maxBuffer:1024*1024});
    for(const stream of ['stdout','stderr']){
      const file=`syntax-${name}.${stream}.log`,bytes=result[stream]??Buffer.alloc(0);fs.writeFileSync(path.join(out,file),bytes,{flag:'wx'});
      step[stream]={path:file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
    }
    Object.assign(step,{status:result.status===0&&!result.error?'PASS':'FAIL',exitCode:result.status,signal:result.signal,error:result.error?.message??null,finishedAt:new Date().toISOString()});
    report.steps.push(step);save();
    if(step.status!=='PASS')throw Error(name+' syntax failed; no successor attempted');
  }
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();save();}
console.log(JSON.stringify({status:report.status,receipt,steps:report.steps.length}));
