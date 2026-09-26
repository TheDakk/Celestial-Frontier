/** One stored fit09 kick refusal only. No changed source, fit, battery or film. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {rolldown} from '../../../port/v2/node_modules/rolldown/dist/index.mjs';
const base=import.meta.dirname,out=path.join(base,'fold-diagnosis-09.sources.json'),log=path.join(base,'fold-diagnosis-09.log');
for(const file of[out,log,path.join(base,'fold-diagnosis-09.json')])assert(!fs.existsSync(file),'New diagnosis output required: '+file);
const prior=JSON.parse(fs.readFileSync(path.join(base,'static-10.json.sources.json'))),pins=new Map(prior.map(s=>[s.path,s.sha256]));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cf-eagle-fold09-')),sources=new Map(),sha=b=>createHash('sha256').update(b).digest('hex');let bundle;
try{
 bundle=await rolldown({input:path.join(base,'diagnose-folds-09.ts'),platform:'node',plugins:[{name:'retained-static-source-pins',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile()){const hash=sha(fs.readFileSync(id));if(pins.has(id))assert.equal(hash,pins.get(id),'Recorded static source changed: '+id);assert(!sources.has(id)||sources.get(id)===hash,'Source changed during bundle: '+id);sources.set(id,hash);}}}]});
 await bundle.write({file:path.join(temp,'run.mjs'),format:'es'});
 const fd=fs.openSync(log,'wx');let result;try{result=spawnSync(process.execPath,[path.join(temp,'run.mjs')],{cwd:'/Users/nick/Projects/celestial-frontier-openai-mac',stdio:['ignore',fd,fd],timeout:120000});}finally{fs.closeSync(fd);}
 process.stdout.write(fs.readFileSync(log));process.exitCode=result.status??1;if(result.error)console.error(result.error);
}finally{
 const receipt=[...sources].map(([file,sha256])=>({file,sha256,unchanged:sha(fs.readFileSync(file))===sha256,comparedWithStatic10:pins.has(file)}));
 fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});if(receipt.some(x=>!x.unchanged))process.exitCode=1;await bundle?.close();fs.rmSync(temp,{recursive:true});
}
