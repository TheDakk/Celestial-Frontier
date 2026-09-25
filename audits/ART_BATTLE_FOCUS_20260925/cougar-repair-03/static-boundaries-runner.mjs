/** Bundle only this packet helper; runtime/solver sources stay read-only. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {rolldown} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/node_modules/rolldown/dist/index.mjs';
const [fit,out]=process.argv.slice(2);
if(!fit||!out||process.argv.length!==4)throw Error('Usage: FIT_DIR NEW_REPORT_JSON');
if(fs.existsSync(out)||fs.existsSync(out+'.sources.json'))throw Error('New static report and sources required');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-sprint-static-'));
const sources=new Map(),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let bundle;
try {
  bundle=await rolldown({input:path.join(import.meta.dirname,'static-boundaries.ts'),platform:'node',plugins:[{name:'sources',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));}}]});
  await bundle.write({file:path.join(scratch,'run.mjs'),format:'es'});
  const result=spawnSync(process.execPath,[path.join(scratch,'run.mjs'),path.resolve(fit),path.resolve(out)],{cwd:'/Users/nick/Projects/celestial-frontier-openai-mac',stdio:'inherit',timeout:600000});
  process.exitCode=result.status??1;
  if(result.error)console.error(String(result.error.stack??result.error));
} finally {
  const receipt=[...sources].map(([file,sha256])=>({path:file,sha256,unchanged:sha(fs.readFileSync(file))===sha256}));
  if(receipt.some(source=>!source.unchanged))process.exitCode=1;
  fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out+'.sources.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  await bundle?.close();fs.rmSync(scratch,{recursive:true});
}
