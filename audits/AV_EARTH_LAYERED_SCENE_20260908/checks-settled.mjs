import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),audit=path.join(root,'audits/AV_EARTH_LAYERED_SCENE_20260908'),v2=path.join(root,'port/v2');
const steps=[
 ['producer-final','node',[path.join(audit,'producer-settled.mjs')],root],
 ['producer-refresh-final','node',[path.join(audit,'refresh-producer-settled.mjs')],root],
 ['final-focused','npm',['test','--','tests/earth-layered-recipe.test.ts','tests/earth-layered-shake-settlement.test.ts','tests/visual-policy-main-wiring.test.ts','packages/art/test/earth-resident-layer.test.ts','apps/game/src/earth-layered-load.test.ts','apps/game/src/earth-layered-resources.test.ts','apps/game/src/earth-layered-layout.test.ts','tests/scene-texture-owner.test.ts','apps/game/src/earth-layered-protocol.test.ts','packages/art/test/biome-vista.test.ts','apps/game/src/painted-vista-load.test.ts','tests/painted-mars-binding.test.ts','tests/biome-vista-surface.test.ts','tests/biome-vista-cache.test.ts','tests/biome-vista-protocol.test.ts','tests/biome-vista-worker-error.test.ts','apps/game/src/planet-surface-turn-view.test.ts','tests/pwa-offline.test.ts','tests/current-producer-authorities.test.ts','tests/compendium-budget.test.ts','tests/guide-release.test.ts','tests/slicesmoke-guide-release-scroll-contract.test.ts','tests/slicesmoke-dtrain-release-convergence.test.ts'],v2],
 ['typescript-final','npm',['run','typecheck'],v2],
 ['art-unused-final','npm',['run','artunused'],v2],
 ['art-audit-final','npm',['run','artaudit'],v2],
 ['override-check-final','npm',['run','overridecheck'],v2],
 ['spec-check','node',['tools/speccheck.mjs'],v2],
 ['root-validation','node',['tools/validate.js'],root],
];
const report={status:'RUNNING',scope:'Earth layered scene focused verification; historical full-profile and navigation failures remain open',steps:[]};
for(const [name,cmd,args,cwd]of steps){
 const log=path.join(audit,'settled-'+name+'.log'),fd=fs.openSync(log,'wx'),start=Date.now();
 const r=spawnSync(cmd,args,{cwd,env:{...process.env,CF_V2_CHECK_PROFILE:'develop'},stdio:['ignore',fd,fd],timeout:300000});fs.closeSync(fd);
 report.steps.push({name,cmd,args,exitCode:r.status,error:r.error?.message??null,seconds:(Date.now()-start)/1000});
 console.log(name,r.status);if(r.status!==0){report.status='FAIL';break;}
}
if(report.status==='RUNNING')report.status='PASS';
fs.writeFileSync(path.join(audit,'browser-free-settled.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
process.exitCode=report.status==='PASS'?0:1;
