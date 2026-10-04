import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),audit=path.join(root,'audits/AV_EARTH_SURFACE_TURN_20260908'),v2=path.join(root,'port/v2');
const steps=[
 ['producer-final','node',[path.join(audit,'producer-final.mjs')],root],
 ['producer-refresh-final','node',[path.join(audit,'refresh-producer-final.mjs')],root],
 ['final-focused','npm',['test','--','apps/game/src/planet-surface-turn-view.test.ts','tests/planet-surface-atlas.test.ts','tests/planet-surface-turn-math.test.ts','tests/current-producer-authorities.test.ts','tests/compendium-budget.test.ts'],v2],
 ['typescript-final','npm',['run','typecheck'],v2],
 ['art-unused-final','npm',['run','artunused'],v2],
 ['art-audit-final','npm',['run','artaudit'],v2],
 ['override-check-final','npm',['run','overridecheck'],v2],
 ['spec-check','node',['tools/speccheck.mjs'],v2],
 ['root-validation','node',['tools/validate.js'],root],
];
const report={status:'RUNNING',continuationOf:'type-corrected-verification.json',steps:[]};
for(const [name,cmd,args,cwd]of steps){
 const log=path.join(audit,name+'.log'),fd=fs.openSync(log,'wx'),start=Date.now();
 const r=spawnSync(cmd,args,{cwd,env:{...process.env,CF_V2_CHECK_PROFILE:'develop'},stdio:['ignore',fd,fd],timeout:300000});fs.closeSync(fd);
 report.steps.push({name,cmd,args,exitCode:r.status,error:r.error?.message??null,seconds:(Date.now()-start)/1000});
 console.log(name,r.status);if(r.status!==0){report.status='FAIL';break;}
}
if(report.status==='RUNNING')report.status='PASS';
fs.writeFileSync(path.join(audit,'final-browser-free.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
process.exitCode=report.status==='PASS'?0:1;
