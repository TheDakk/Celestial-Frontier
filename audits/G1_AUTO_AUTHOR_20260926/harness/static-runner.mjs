/** G1 re-rooted copy of audits/ARCHETYPE_SPRINT_20260922/static-runner.mjs: identical gate logic (static.ts differs only in its
 * import paths and ROOT, which is this worktree, passed as cwd). Usage from the worktree root: node <this> FIT_DIR NEW_REPORT_JSON */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const {rolldown}=await import(path.join(ROOT,'port/v2/node_modules/rolldown/dist/index.mjs'));
const [fit,out]=process.argv.slice(2);
if(!fit||!out||process.argv.length!==4)throw Error('Usage: FIT_DIR NEW_REPORT_JSON');
if(fs.existsSync(out)||fs.existsSync(out+'.sources.json'))throw Error('New static report and sources required');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-g1-static-'));
const sources=new Map(),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let bundle;
try {
  bundle=await rolldown({input:path.join(import.meta.dirname,'static.ts'),platform:'node',plugins:[{name:'sources',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));return null;}}]});
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
