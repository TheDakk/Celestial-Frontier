import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import{createHash}from'node:crypto';import{spawnSync}from'node:child_process';
import{rolldown}from'../../port/v2/node_modules/rolldown/dist/index.mjs';import{acquireWorkspaceLock}from'../../port/v2/tools/workspacelock.mjs';
const B='audits/C203_PRIMATE_REFERENCES_20261004',sha=b=>createHash('sha256').update(b).digest('hex'),release=acquireWorkspaceLock('C203 audit-only forehand pilot'),sources=new Map(),[candidate,old,mode,out,gain='1']=process.argv.slice(2);assert(candidate&&old&&mode&&out);
try{const bundleFile=B+'/'+candidate+'/'+out+'.bundle.mjs';assert(!fs.existsSync(bundleFile));const b=await rolldown({input:B+'/dense.ts',platform:'node',plugins:[{name:'bind',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));return null;}}]});
 try{await b.write({file:bundleFile,format:'es',codeSplitting:false});}finally{await b.close();}
 const r=spawnSync(process.execPath,[bundleFile,candidate,old,mode,out,gain],{encoding:'utf8',maxBuffer:8*1024*1024});
 const inputs=[...sources].map(([p,hash])=>({path:path.relative(process.cwd(),p),sha256:hash,unchanged:sha(fs.readFileSync(p))===hash}));assert(inputs.every(i=>i.unchanged));
 fs.writeFileSync(B+'/'+candidate+'/'+out+'-execution.json',JSON.stringify({schema:'cf.c203-audit-probe-execution/v1',exitCode:r.status,log:(r.stdout+r.stderr).split(os.homedir()).join('~'),inputs,bundle:{path:bundleFile,sha256:sha(fs.readFileSync(bundleFile))},native:false},null,2)+'\n',{flag:'wx'});console.log((r.stdout+r.stderr).split(os.homedir()).join('~'));process.exitCode=r.status;
}finally{release();}
