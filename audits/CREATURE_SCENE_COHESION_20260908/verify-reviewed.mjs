import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const base = path.dirname(new URL(import.meta.url).pathname);
const reportPath = path.join(base, 'static-reviewed.json');
if (fs.existsSync(reportPath)) throw Error('Immutable report exists; do not rerun unchanged input');
const sources = ['study-harness.ts', 'study.tsconfig.json', 'study-runner.mjs', 'serve-study.mjs', 'cohesion-owner.ts', 'asset.json'];
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report = { schema: 'cf-earth-scene-cohesion-static/v1', status: 'RUNNING', startedAt: new Date().toISOString(), sourceCommit: spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(), sources: Object.fromEntries(sources.map(file=>[file,sha(path.join(base,file))])), stages: [] };
const stages = [
 ['study-typecheck', 'port/v2/node_modules/.bin/tsc', ['--noEmit','-p','audits/CREATURE_SCENE_COHESION_20260908/study.tsconfig.json']],
 ['runner-syntax', 'node', ['--check','audits/CREATURE_SCENE_COHESION_20260908/study-runner.mjs']],
 ['server-syntax', 'node', ['--check','audits/CREATURE_SCENE_COHESION_20260908/serve-study.mjs']],
 ['root-validate', 'node', ['tools/validate.js']]
];
for (const [name, command, args] of stages) {
 const result=spawnSync(command,args,{encoding:'utf8',maxBuffer:32*1024*1024});
 fs.writeFileSync(path.join(base,name+'-reviewed.log'),(result.stdout||'')+(result.stderr||''),{flag:'wx'});
 report.stages.push({name,command,args,exitCode:result.status,error:result.error?.message,log:name+'-reviewed.log'});
 console.log(name+': '+result.status);
 if(result.status!==0){report.status='FAIL';process.exitCode=1;break;}
}
if(report.status==='RUNNING')report.status='PASS';
report.finishedAt=new Date().toISOString();
for(const [file,hash] of Object.entries(report.sources))if(sha(path.join(base,file))!==hash){report.status='FAIL';report.sourceChanged=file;process.exitCode=1;}
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report));
