import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const base = path.dirname(new URL(import.meta.url).pathname);
const reportPath = path.join(base, 'runner-final-static.json');
if (fs.existsSync(reportPath)) throw Error('Immutable report exists; do not rerun unchanged input');
const sources = ['study-harness.ts', 'study.tsconfig.json', 'study-runner.mjs', 'serve-study.mjs', '../../port/v2/tools/painted-creature/civet-rig.ts', '../../port/v2/tests/painted-civet-rig.test.ts'];
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report = { schema: 'cf-civet-study-static/v1', status: 'RUNNING', startedAt: new Date().toISOString(), sourceCommit: spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(), sources: Object.fromEntries(sources.map(file=>[file,sha(path.join(base,file))])), stages: [] };
const stages = [
 ['runner-syntax', 'node', ['--check','audits/CREATURE_PAINTED_CIVET_20260908/study-runner.mjs']],
 ['root-validate', 'node', ['tools/validate.js']]
];
for (const [name, command, args] of stages) {
 const result=spawnSync(command,args,{encoding:'utf8',maxBuffer:32*1024*1024});
 fs.writeFileSync(path.join(base,name+'-runner-final.log'),(result.stdout||'')+(result.stderr||''),{flag:'wx'});
 report.stages.push({name,command,args,exitCode:result.status,error:result.error?.message,log:name+'-runner-final.log'});
 console.log(name+': '+result.status);
 if(result.status!==0){report.status='FAIL';process.exitCode=1;break;}
}
if(report.status==='RUNNING')report.status='PASS';
report.finishedAt=new Date().toISOString();
for(const [file,hash] of Object.entries(report.sources))if(sha(path.join(base,file))!==hash){report.status='FAIL';report.sourceChanged=file;process.exitCode=1;}
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report));
