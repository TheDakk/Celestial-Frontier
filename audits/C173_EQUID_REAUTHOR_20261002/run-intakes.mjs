import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const base='audits/C173_EQUID_REAUTHOR_20261002',inputs=JSON.parse(fs.readFileSync(base+'/inputs.json'));
const rows=[];
for(const input of inputs.rows){
 const result=spawnSync(process.execPath,[base+'/intake.mjs',input.packet,input.fit],{encoding:'utf8',maxBuffer:16*1024*1024});
 const log=(String(result.stdout??'')+String(result.stderr??'')).replaceAll(/\/Users\/[^/\s"\\]+/g,'~');
 fs.writeFileSync(base+'/'+input.id+'/intake.log',log,{flag:'wx'});
 rows.push({id:input.id,exitCode:result.status,error:result.error?.message??null,log:base+'/'+input.id+'/intake.log'});
 console.log(JSON.stringify(rows.at(-1)));
}
fs.writeFileSync(base+'/intake-terminal.json',JSON.stringify({schema:'cf.c173-equid-intake-terminal/v1',rows,retries:0,nativeRun:false},null,2)+'\n',{flag:'wx'});
if(rows.some(r=>r.exitCode!==0))process.exitCode=1;
