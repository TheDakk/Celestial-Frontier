/** Virtual candidate only: unchanged full static assertions; production source is never edited. */
/** G1 re-rooted copy of audits/ARCHETYPE_SPRINT_20260922/static-runner.mjs: identical gate logic (static.ts differs only in its
 * import paths and ROOT, which is this worktree, passed as cwd). Usage from the worktree root: node <this> FIT_DIR NEW_REPORT_JSON */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT=process.cwd();
const {rolldown}=await import(path.join(ROOT,'port/v2/node_modules/rolldown/dist/index.mjs'));
const [fit,out]=process.argv.slice(2);
if(!fit||!out||process.argv.length!==4)throw Error('Usage: FIT_DIR NEW_REPORT_JSON');
if(fs.existsSync(out)||fs.existsSync(out+'.sources.json'))throw Error('New static report and sources required');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-g1-static-'));
const sources=new Map(),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let bundle;
try {
  bundle=await rolldown({input:path.join(ROOT,'audits/G1_AUTO_AUTHOR_20260926/harness/static.ts'),platform:'node',plugins:[{name:'sources',transform(code,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));
 if(id.endsWith('/motion/grounded-bird.ts')){
  const replace=(a,b)=>{if(code.split(a).length!==2)throw Error('Unique faint author anchor');code=code.replace(a,b);};
  replace("['dodge','hit','tame','melee:claw'].includes(action.id)","['dodge','hit','tame','melee:claw','faint'].includes(action.id)");
  replace(' const key=JSON.stringify'," if(action.id==='faint'&&!card.paintedContactSupports)return unchanged;\n const key=JSON.stringify");
  const anchor=' if(fits(base))return finish(action,null);';
  replace(anchor,anchor+`
 if(action.id==='faint'){
  const torso=new Set(['root','pelvis','spine','chest']);
  const scaled=(gain:number)=>freezeAction({...action,poses:action.poses.map(p=>({...p,joints:Object.fromEntries(Object.entries(p.joints).map(([j,v])=>[j,v*(torso.has(j)?gain:1)])),root:{dx:p.root.dx*gain,dy:p.root.dy*gain}}))});
  if(!fits(compile(scaled(0))))return finish(action,null);
  let low=0,high=1;for(let i=0;i<12;i++){const m=(low+high)/2;if(fits(compile(scaled(m))))low=m;else high=m;}
  const gain=low*.9,candidate=scaled(gain);
  return gain>0&&fits(compile(candidate))?finish(candidate,'grounded-bird:painted-faint-gain='+gain):finish(action,null);
 }`);
  return{code,map:null};
 }
return null;}}]});
  await bundle.write({file:path.join(scratch,'run.mjs'),format:'es'});
  const result=spawnSync(process.execPath,[path.join(scratch,'run.mjs'),path.resolve(fit),path.resolve(out)],{cwd:ROOT,stdio:'inherit',timeout:900000});
  process.exitCode=result.status??1;
  if(result.error)console.error(String(result.error.stack??result.error));
} finally {
  const receipt=[...sources].map(([file,sha256])=>({path:file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));
  if(receipt.some(source=>!source.unchanged))process.exitCode=1;
  fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out+'.sources.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  await bundle?.close();fs.rmSync(scratch,{recursive:true});
}
