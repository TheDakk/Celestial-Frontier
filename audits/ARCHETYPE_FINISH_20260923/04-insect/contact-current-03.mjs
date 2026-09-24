/** Current-source contact qualification: no source substitution or solver instrumentation. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {rolldown} from '../../../port/v2/node_modules/rolldown/dist/index.mjs';
const base=import.meta.dirname,root='/Users/nick/Projects/celestial-frontier-openai-mac',name='contact-current-03';
const out=path.join(base,name+'.sources.json'),log=path.join(base,name+'.log');
for(const p of [out,log,path.join(base,name+'.json')])if(fs.existsSync(p))throw Error('New diagnostic outputs required '+p);
const prior=new Map(JSON.parse(fs.readFileSync(path.join(base,'static-01.json.sources.json'))).map(x=>[x.path,x.sha256]));
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-beetle-current-contact-'));
sources.set(import.meta.filename,sha(fs.readFileSync(import.meta.filename)));
let bundle;
try{
 bundle=await rolldown({input:path.join(base,name+'.ts'),platform:'node',plugins:[{name:'source-receipt-only',transform(_code,id){
  if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));
 }}]});
 await bundle.write({file:path.join(scratch,'run.mjs'),format:'es'});
 const r=spawnSync(process.execPath,[path.join(scratch,'run.mjs')],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024});
 const text='Command: node '+path.relative(root,import.meta.filename)+'\nScope: current-source contact only; no transforms, bypasses, browser, ARAP or film.\n'+(r.stdout??'')+(r.stderr??'')+'\nExit: '+String(r.status)+'\n'+(r.error?String(r.error)+'\n':'');
 fs.writeFileSync(log,text,{flag:'wx'});process.stdout.write(text);process.exitCode=r.status??1;
}finally{
 const receipt=[...sources].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256,comparedWithStatic01:prior.has(file),exactStaticBytes:prior.has(file)?prior.get(file)===sha256:null}));
 fs.writeFileSync(out,JSON.stringify({scope:'Current physical source files; transform hook only records hashes and returns no code. No historical owner, substitutions, trace hooks or direct-block bypass.',sources:receipt},null,2)+'\n',{flag:'wx'});
 if(receipt.some(x=>!x.unchanged))process.exitCode=1;await bundle?.close();fs.rmSync(scratch,{recursive:true});
}
