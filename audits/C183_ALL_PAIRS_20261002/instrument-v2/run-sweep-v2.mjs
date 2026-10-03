/** Prepared native driver. Never invoked by preparation or instrument controls. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import{spawnSync}from'node:child_process';
import{sha,validateManifest,sealCaptureFiles,validatePairFiles,validateSweep}from'./validate-v2.mjs';
const [manifestFile,out]=process.argv.slice(2);if(!manifestFile||!out)throw Error('Usage: run-sweep.mjs manifest.json NEW_OUTPUT_DIRECTORY (native reservation required)');
const manifest=JSON.parse(fs.readFileSync(manifestFile));validateManifest(manifest);if(fs.existsSync(out))throw Error('New output required');
for(const s of manifest.sources)if(sha(fs.readFileSync(s.path))!==s.sha256)throw Error('Prepared source changed; make a separately named preparation: '+s.path);
fs.mkdirSync(out,{recursive:true});const results=[];let failure=null;
for(const original of manifest.pairs){
 const disk=fs.statfsSync('.');if(disk.bavail*disk.bsize<60*1024**3){failure={id:original.id,error:'Disk free below 60 GiB; no new pair started'};break;}
 try{for(const input of manifest.sources)if(sha(fs.readFileSync(input.path))!==input.sha256)throw Error('Prepared source changed during sweep: '+input.path);}catch(e){failure={id:original.id,error:String(e.message)};break;}
 const pairStarted=Date.now();console.log(JSON.stringify({event:'PAIR_START',id:original.id,completed:results.length,total:1444,freeGiB:disk.bavail*disk.bsize/1024**3}));
 const inputs=new Map([...manifest.sources,...original.inputs].map(s=>[s.path,s]));const p={...original,inputs:[...inputs.values()]};
 const inputDir=path.join(out,p.id+'-input');fs.mkdirSync(inputDir);for(const [name,value]of [['case',p],['script',p.script],['arena',p.arena]])fs.writeFileSync(inputDir+'/'+name+'.json',JSON.stringify(value,null,2)+'\n',{flag:'wx'});
 const dest=path.join(out,p.id),env={...process.env,CF_CPU_THROTTLE:'4',CF_ALL_PAIRS_CASE:path.resolve(inputDir+'/case.json'),CF_ARENA_MANIFEST:path.resolve(inputDir+'/arena.json'),CF_EFFECT_ANCHORS:path.resolve(p.effectAnchors)};delete env.CF_CPU_PROFILE;delete env.CF_PROOF_SOURCE_OVERRIDES;
 const result=spawnSync(process.execPath,[path.join(import.meta.dirname,'native-runner.mjs'),p.fitConfig.left.dir,p.fitConfig.right.dir,dest,inputDir+'/script.json'],{env,encoding:'utf8',maxBuffer:4*1024*1024});
 fs.writeFileSync(inputDir+'/runner.log',((result.stdout??'')+(result.stderr??'')).replaceAll(os.homedir(),'~'),{flag:'wx'});
 try{if(result.status!==0)throw Error('Native runner exit '+result.status);sealCaptureFiles(dest);results.push(validatePairFiles(p,dest));}catch(e){failure={id:p.id,error:String(e.message),runnerStatus:result.status};break;}
 const latest=results.at(-1);console.log(JSON.stringify({event:'PAIR_TERMINAL',id:latest.id,status:latest.status,overBudgetFrames:latest.overBudgetFrames.length,maxCpuMs:latest.maxCpuMs,elapsedMs:Date.now()-pairStarted,completed:results.length,total:1444}));
 fs.writeFileSync(out+'/progress.json',JSON.stringify({status:'RUNNING',completed:results.length,results},null,2)+'\n');
}
let complete=null;if(!failure)complete=validateSweep(manifest,results);fs.writeFileSync(out+'/summary.json',JSON.stringify({status:failure?'STOPPED_INSTRUMENT_OR_RESOURCE':complete.status,qualification:complete,manifestSha256:sha(fs.readFileSync(manifestFile)),completed:results.length,total:1444,failure,results,scope:manifest.scope},null,2)+'\n',{flag:'wx'});if(failure||complete?.status==='RED')process.exitCode=1;
