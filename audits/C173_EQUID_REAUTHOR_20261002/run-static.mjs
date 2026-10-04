import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const base='audits/C173_EQUID_REAUTHOR_20261002',inputs=JSON.parse(fs.readFileSync(base+'/inputs.json')),rows=[];
for(const input of inputs.rows){
 const result=spawnSync(process.execPath,['audits/C163_REFERENCE_REPAIR_20261002/static-runner.mjs',input.fit,base+'/'+input.id+'/static.json'],{encoding:'utf8',maxBuffer:16*1024*1024});
 const log=(String(result.stdout??'')+String(result.stderr??'')).replaceAll(/\/Users\/[^/\s"\\]+/g,'~');
 fs.writeFileSync(base+'/'+input.id+'/static.log',log,{flag:'wx'});
 rows.push({id:input.id,exitCode:result.status,error:result.error?.message??null,log:base+'/'+input.id+'/static.log'});console.log(JSON.stringify(rows.at(-1)));
}
fs.writeFileSync(base+'/static-terminal.json',JSON.stringify({schema:'cf.c173-equid-static-terminal/v1',rows,retries:0,nativeRun:false},null,2)+'\n',{flag:'wx'});
if(rows.some(r=>r.exitCode!==0))process.exitCode=1;
