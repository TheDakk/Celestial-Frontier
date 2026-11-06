/** Opt-in post-author diagnostic. No shared default or admission changes.
 * node audits/G1_AUTO_AUTHOR_20260926/fish-seams-batch.mjs <pilot.json> <author-root> <fresh-output> [--native]
 * Run from this worktree root. --native owns the real browser: run outside the sandbox.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {admitFishSeamSource,sha256} from './fish-seams-source.mjs';
const [pilotArg,authorArg,outArg,...flags]=process.argv.slice(2),root=path.resolve(import.meta.dirname,'../..');
if(!pilotArg||!authorArg||!outArg||flags.some(x=>x!=='--native'))throw Error('usage: fish-seams-batch.mjs <pilot.json> <author-root> <fresh-output> [--native]');
const pilot=JSON.parse(fs.readFileSync(path.resolve(pilotArg))),author=path.resolve(authorArg),out=path.resolve(outArg),rel=path.relative(root,out);
if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel)||fs.existsSync(out))throw Error('Fresh output inside this worktree required');
if(!Array.isArray(pilot)||new Set(pilot.map(p=>p.id)).size!==pilot.length||pilot.some(p=>!/^[a-z0-9][a-z0-9-]*$/.test(p.id)))throw Error('Unique safe pilot ids required');
fs.mkdirSync(out,{recursive:true});const rows=[],read=f=>JSON.parse(fs.readFileSync(f));
const save=()=>fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({schema:'cf.fish-seams-batch/v1',pilot:path.resolve(pilotArg),author,rows,scope:'Opt-in diagnostic candidates, no visual or library admission'},null,2)+'\n');
const run=(args,log,cwd=root,env=process.env)=>{const r=spawnSync(process.execPath,args,{cwd,env,encoding:'utf8',maxBuffer:1<<28,timeout:1800000});fs.writeFileSync(log,(r.stdout??'')+(r.stderr??'')+(r.error?'\n'+String(r.error):''));return r.status;};
for(const item of pilot){
 const row={id:item.id,status:'PENDING'},subjectDir=path.resolve(root,item.packet);rows.push(row);
 try{
  const subjectBytes=fs.readFileSync(path.join(subjectDir,'subject-source.json')),subject=JSON.parse(subjectBytes);row.name=subject.name;
  if(subject.family!=='fish'){row.status='SKIPPED_NONFISH';save();continue;}
  const initial=read(path.join(author,item.id,'score.json')),wins=(initial.candidates??[]).filter(c=>c.static==='PASS_STATIC');
  if(initial.fallbackFrom && wins.length!==1)throw Error('Unique passing fallback required');
  const sourceDir=initial.fallbackFrom&&wins[0].rank>0?path.join(author,item.id,'fallback-'+wins[0].rank):path.join(author,item.id);
  const score=read(path.join(sourceDir,'score.json')),report=read(path.join(sourceDir,'static.json')),provenance=read(path.join(sourceDir,'provenance.json'));
  const master=fs.readFileSync(path.join(subjectDir,'master.png')),patternFile=['pattern-check.json','pattern-review.json'].map(n=>path.join(subjectDir,n)).find(fs.existsSync);
  if(!patternFile)throw Error('Pattern evidence missing');
  const admitted=admitFishSeamSource({id:item.id,score,report,provenance,subject,subjectBytes,master,pattern:read(patternFile),autoRoot:author});
  const masterFile=path.resolve(root,admitted.record.source),masterRel=path.relative(root,masterFile);
  if(!masterRel||masterRel.startsWith('..'+path.sep)||path.isAbsolute(masterRel))throw Error('Record master must stay inside this worktree');
  if(fs.existsSync(masterFile)){if(sha256(fs.readFileSync(masterFile))!==admitted.masterHash)throw Error('Existing master differs');}
  else{fs.mkdirSync(path.dirname(masterFile),{recursive:true});fs.writeFileSync(masterFile,master,{flag:'wx'});}
  const dest=path.join(out,item.id);row.sourceFit=admitted.fit;row.sourceMasterSha256=admitted.masterHash;row.sourceStaticSha256=sha256(fs.readFileSync(path.join(sourceDir,'static.json')));row.candidate=path.relative(root,path.join(dest,'fit'));
  const built=run([path.join(import.meta.dirname,'fish-seams-fit.mjs'),item.id,admitted.fit,dest],path.join(out,item.id+'-build.log'));
  if(built!==0){row.status='REPAIR_REFUSED';row.exitCode=built;save();continue;}
  const stFile=path.join(dest,'static.json'),code=run([path.join(import.meta.dirname,'harness/static-runner.mjs'),path.join(dest,'fit'),stFile],path.join(out,item.id+'-static.log'));
  const st=fs.existsSync(stFile)?read(stFile):null;row.static=st?.status??'NO_REPORT';row.staticExitCode=code;
  if(code!==0||st?.status!=='PASS_STATIC'){row.status='STATIC_REFUSED';save();continue;}
  row.status='STATIC_PASS_NOT_NATIVE';save();
  if(flags.includes('--native')){
   const ps=spawnSync('ps',['-Ao','pid,command'],{encoding:'utf8'});if(ps.status!==0)throw Error('Cannot establish quiet native start');
   const competing=ps.stdout.split('\n').filter(s=>s.includes('/celestial-frontier-anthropic-mac/')&&/native-runner\.mjs|vitest|check-profile\.mjs/.test(s));
   if(competing.length){row.status='NATIVE_DEFERRED_BUSY';row.competing=competing;save();continue;}
   const script=read(path.join(root,'audits/FISH_FOLD_C80_20260927/grayling-script.json'));script.supports='observed';for(const turn of script.rows)for(const key of ['an','dn'])if(key in turn)turn[key]=subject.name;
   const scriptFile=path.join(dest,'native-script.json'),native=path.join(dest,'native');fs.writeFileSync(scriptFile,JSON.stringify(script,null,2)+'\n');
   const nr=run(['tools/battle2-proof/native-runner.mjs',path.join(dest,'fit'),path.join(dest,'fit'),native,scriptFile],path.join(out,item.id+'-native.log'),path.join(root,'port/v2'),{...process.env,CF_CPU_THROTTLE:'4'});
   const result=fs.existsSync(path.join(native,'report.json'))?read(path.join(native,'report.json')):null;
   row.native=result?.status??'NO_REPORT';row.nativeExitCode=nr;row.status=nr===0&&result?.status==='DIAGNOSTIC_PASS'?'NATIVE_PASS_NOT_VISUALLY_ADMITTED':'NATIVE_REFUSED';row.nativeDir=path.relative(root,native);
  }
 }catch(e){row.status='SOURCE_OR_INSTRUMENT_REFUSED';row.error=String(e.message);}
 save();console.log(JSON.stringify(row));
}
save();
