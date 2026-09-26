/** G1 control: the HAND-authored packets through the same unchanged intake + the re-rooted static harness — the ceiling the automatic
 * author is scored against. Run from the worktree root: node audits/G1_AUTO_AUTHOR_20260926/run-control.mjs [id ...]
 * Writes control/<id>/{fit/, static.json, intake.log} and control/summary.json. Never touches the source packets. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const HERE=import.meta.dirname, ROOT=path.resolve(HERE,'../..');
const corpus=JSON.parse(fs.readFileSync(path.join(HERE,'corpus.json'),'utf8')).subjects;
const only=process.argv.slice(2), rows=[];
for(const s of corpus){
  if(only.length&&!only.includes(s.id))continue;
  const dir=path.join(HERE,'control',s.id); fs.mkdirSync(dir,{recursive:true});
  const missing=['master.png','authoring.json','subject-source.json','presence.json'].filter(f=>!fs.existsSync(path.join(ROOT,s.packet,f)));
  if(missing.length){rows.push({id:s.id,status:'NO_INPUT',missing});continue;}
  const fit=path.join(dir,'fit');
  if(!fs.existsSync(fit)){
    const r=spawnSync(process.execPath,['port/v2/tools/creature-animation/intake-authored.mjs',path.join(ROOT,s.packet),fit],{cwd:ROOT,encoding:'utf8',timeout:900000});
    fs.writeFileSync(path.join(dir,'intake.log'),(r.stdout||'')+(r.stderr||''));
  }
  if(!fs.existsSync(path.join(fit,'binding.json'))){rows.push({id:s.id,status:'INTAKE_REFUSED'});continue;}
  const report=path.join(dir,'static.json');
  if(!fs.existsSync(report)){
    const r=spawnSync(process.execPath,[path.join(HERE,'harness/static-runner.mjs'),fit,report],{cwd:ROOT,encoding:'utf8',timeout:1800000});
    fs.writeFileSync(path.join(dir,'static.log'),(r.stdout||'')+(r.stderr||''));
  }
  let st=null; try{st=JSON.parse(fs.readFileSync(report,'utf8'));}catch{}
  rows.push({id:s.id,family:s.family,status:st?st.status:'STATIC_ERROR',rows:st?.rows?.length??null,fails:st?.rows?.filter(r=>r.status!=='PASS').map(r=>r.id)??null,exactRest:st?.exactRest??null});
  console.log(JSON.stringify(rows.at(-1)));
}
fs.writeFileSync(path.join(HERE,'control','summary'+(only.length?'-partial':'')+'.json'),JSON.stringify(rows,null,1)+'\n');
