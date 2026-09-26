import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',base=path.join(root,'audits/ART_BATTLE_FOCUS_20260925'),p=import.meta.dirname,rows=[];
for(const [name,fit] of [['impala','quadruped-repair-04/impala-fit-02'],['marmot','quadruped-repair-04/marmot-fit-02'],['cattle','quadruped-repair-04/cattle-fit-02'],['lizard','quadruped-repair-04/lizard-fit-03'],['bear','14-brown-bear/fit-02']]){
 const out=path.join(p,'native-'+name+'-03'),log=out+'.log';if(fs.existsSync(out)||fs.existsSync(log))throw Error('New output required');
 const command=[path.join(base,'approach-envelope-01/native-proposal-runner.mjs'),path.join(base,fit),path.join(base,fit),out,path.join(p,name+'-script.json')],fd=fs.openSync(log,'wx');
 const run=spawnSync(process.execPath,command,{cwd:root,env:{...process.env,CF_CPU_THROTTLE:'4',CF_BROWSER:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'},stdio:['ignore',fd,fd],timeout:300000});fs.closeSync(fd);
 const report=fs.existsSync(out+'/report.json')?JSON.parse(fs.readFileSync(out+'/report.json')):null;rows.push({name,command,exit:run.status,error:run.error?String(run.error):null,status:report?.status,refusals:report?.capture?.refusalsAtEnd,frames:report?.capture?.frames,cpuP95Ms:report?.capture?.cpuP95Ms});console.log(JSON.stringify(rows.at(-1)));fs.writeFileSync(path.join(p,'native-batch-03-results.json'),JSON.stringify(rows,null,2)+'\n');
 if(!report||run.error)break;
}
