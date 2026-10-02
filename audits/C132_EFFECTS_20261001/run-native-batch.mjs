/** One sequential changed-asset proof batch. A red leaf ends the batch. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),base=path.relative(root,import.meta.dirname);
const output=process.argv[2];
if(!output||path.isAbsolute(output)||output.split(/[\\/]/).some(p=>p==='..')||fs.existsSync(path.join(root,output)))throw Error('New repository-relative batch output required');
if(process.env.CF_CPU_THROTTLE!=='4')throw Error('This batch requires the declared 4x CPU tier');
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const head=()=>execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),source=head();
if(execFileSync('git',['log','-1','--format=%G?'],{cwd:root,encoding:'utf8'}).trim()!=='G')throw Error('Signed G source required');
const unchanged=()=>{if(head()!==source)throw Error('Source HEAD changed');execFileSync('git',['diff','--quiet','HEAD'],{cwd:root});};
unchanged();
const rows=read(base+'/delivery.json').rows;
const jobs=rows.map(row=>{
 const inputs=read(base+'/'+row.theme+'/native-input/inputs.json'),script=base+'/'+row.theme+'/native-input/script.json';
 if(inputs.theme!==row.theme||sha(fs.readFileSync(path.join(root,script)))!==inputs.scriptSha256)throw Error('Theme/script identity');
 if(inputs.effectAnchors!==base+'/'+row.anchors||sha(fs.readFileSync(path.join(root,inputs.effectAnchors)))!==inputs.effectAnchorsSha256)throw Error('Effect anchor identity');
 for(const r of inputs.recordSha256)if(sha(fs.readFileSync(path.join(root,r.fit,'record.json')))!==r.sha256)throw Error('Fit identity');
 const settings=read(script);
 if(settings.themes.A!==row.theme||settings.themes.B!==row.theme||settings.supports!=='observed')throw Error('Exact theme and painted supports required');
 return {theme:row.theme,script,...inputs};
});
fs.mkdirSync(path.join(root,output),{recursive:true});
const receipt={schema:'cf.c132-theme-native-batch/v1',source,status:'RUNNING',cpuThrottle:4,scope:'Painted-theme integration on the accepted temperate control arena; not habitat, visual, phone or all-pair admission.',rows:[]};
const save=()=>fs.writeFileSync(path.join(root,output,'batch.json'),JSON.stringify(receipt,null,2)+'\n');
save();
try{
 for(const job of jobs){
  unchanged();
  const out=output+'/'+job.theme,env={...process.env,CF_EFFECT_ANCHORS:job.effectAnchors};
  delete env.CF_PROOF_SOURCE_OVERRIDES;delete env.CF_ARENA_MANIFEST;
  const result=spawnSync(process.execPath,[base+'/native-runner.mjs',job.left,job.right,out,job.script],{cwd:root,env,encoding:'utf8',maxBuffer:64*1024*1024});
  const log=((result.stdout??'')+(result.stderr??'')).replaceAll(os.homedir(),'~').replace(/\/Users\/[^/\s]+/g,'~');
  fs.writeFileSync(path.join(root,output,job.theme+'.log'),log);
  const reportPath=out+'/report.json',report=fs.existsSync(path.join(root,reportPath))?read(reportPath):null;
  receipt.rows.push({theme:job.theme,exitCode:result.status,error:result.error?String(result.error).replaceAll(os.homedir(),'~'):null,status:report?.status??'MISSING',report:reportPath,reportSha256:report?sha(fs.readFileSync(path.join(root,reportPath))):null,cpuP95Ms:report?.capture?.cpuP95Ms??null,frameDeltaP95Ms:report?.capture?.frameDeltaP95Ms??null,refusals:report?.capture?.refusalsAtEnd??null});
  save();console.log(JSON.stringify(receipt.rows.at(-1)));
  if(result.status!==0||report?.status!=='DIAGNOSTIC_PASS')throw Error('Terminal red at '+job.theme+'; remaining themes not run');
 }
 unchanged();
 receipt.status='DIAGNOSTIC_PASS';
}catch(error){receipt.status='FAIL';receipt.error=String(error).replaceAll(os.homedir(),'~');process.exitCode=1;}
finally{save();}
console.log(JSON.stringify({status:receipt.status,completed:receipt.rows.length,planned:jobs.length,error:receipt.error}));
