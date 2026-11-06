import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(),audit=path.join(root,'audits/AV_EARTH_LAYERED_SCENE_20260908'),v2=path.join(root,'port/v2');
const sourcePaths = JSON.parse(fs.readFileSync(path.join(audit,'source-freeze-audit.json'),'utf8'));
const hashFile = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
for(const entry of sourcePaths) if(hashFile(entry.path)!==entry.sha256) throw Error('Pre-check source changed: '+entry.path);
const steps=[
 ['route-controls','npm',['run','overridecontrol'],v2],
 ['route-audit','npm',['run','overridecheck'],v2],
 ['spec-check','node',['tools/speccheck.mjs'],v2],
 ['root-validation','node',['tools/validate.js'],root],
];
const report={status:'RUNNING',scope:'Earth layered scene focused verification; historical full-profile and navigation failures remain open',steps:[]};
for(const [name,cmd,args,cwd]of steps){
 const log=path.join(audit,'audit-'+name+'.log'),fd=fs.openSync(log,'wx'),start=Date.now();
 const r=spawnSync(cmd,args,{cwd,env:{...process.env,CF_V2_CHECK_PROFILE:'develop'},stdio:['ignore',fd,fd],timeout:300000});fs.closeSync(fd);
 report.steps.push({name,cmd,args,exitCode:r.status,error:r.error?.message??null,seconds:(Date.now()-start)/1000});
 console.log(name,r.status);if(r.status!==0){report.status='FAIL';break;}
}
for(const entry of sourcePaths) if(hashFile(entry.path)!==entry.sha256) {
 report.status='FAIL'; report.sourceMutation=entry.path; break;
}
report.sourceFreeze=sourcePaths.length;
if(report.status==='RUNNING')report.status='PASS';
fs.writeFileSync(path.join(audit,'browser-free-audit.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
process.exitCode=report.status==='PASS'?0:1;
