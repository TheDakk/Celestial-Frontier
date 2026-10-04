import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
const B='audits/C203_PRIMATE_REFERENCES_20261004',sha=b=>createHash('sha256').update(b).digest('hex'),safe=s=>s.split(os.homedir()).join('~');
const [id,stage]=process.argv.slice(2);if(!id||!['intake','static'].includes(stage)||process.argv.length!==4)throw Error('Usage ID intake|static');
const p=B+'/'+id;if(!fs.existsSync(p+'/authoring.json'))throw Error('missing packet');
const args=stage==='intake'?['audits/C163_REFERENCE_REPAIR_20261002/intake-v2.mjs',p,p+'/fit01']:['audits/C163_REFERENCE_REPAIR_20261002/static-runner.mjs',p+'/fit01',p+'/static-01.json'];
const receipt=p+'/'+stage+'-execution.json';if(fs.existsSync(receipt))throw Error('immutable stage');
const release=acquireWorkspaceLock('C203 primate '+id+' '+stage);let r;const start=performance.now();
try{r=spawnSync(process.execPath,args,{encoding:'utf8',timeout:900000,maxBuffer:32*1024*1024});}finally{release();}
fs.writeFileSync(p+'/'+stage+'-01.log',safe((r.stdout||'')+(r.stderr||'')),{flag:'wx'});
const report={schema:'cf.c203-primate-stage/v1',args,status:r.status===0?'PASS':'REFUSED',exitCode:r.status,elapsedMs:performance.now()-start,error:r.error?safe(r.error.message):null,node:process.version,helperSha256:sha(fs.readFileSync(args[0])),native:false};
fs.writeFileSync(receipt,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));process.exitCode=r.status??1;
