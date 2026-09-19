import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {rolldown} from '../../../port/v2/node_modules/rolldown/dist/index.mjs';
const out=path.resolve('audits/ANATOMY_COMPLETION_20260917/review-diagnosis-01'),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-bounded-diagnosis-')),sources=new Map();
const bundle=await rolldown({input:path.join(out,'diagnose.ts'),platform:'node',plugins:[{name:'source-record',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,createHash('sha256').update(fs.readFileSync(id)).digest('hex'));}}]});
try{await bundle.write({file:path.join(scratch,'diagnose.mjs'),format:'es'});}finally{await bundle.close();}
fs.writeFileSync(path.join(out,'diagnostic-source-hashes-02.json'),JSON.stringify([...sources].map(([path,sha256])=>({path,sha256})),null,2)+'\n',{flag:'wx'});
const r=spawnSync(process.execPath,[path.join(scratch,'diagnose.mjs')],{encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});fs.writeFileSync(path.join(out,'diagnosis-02.log'),r.stdout+r.stderr,{flag:'wx'});console.log(r.stdout);console.error(r.stderr);process.exitCode=r.status??1;
fs.rmSync(scratch,{recursive:true});
