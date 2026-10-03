import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const dir='audits/C132_LIBRARY_SCALE_ATTACK_20261002',sha=b=>createHash('sha256').update(b).digest('hex'),receipt=JSON.parse(fs.readFileSync(dir+'/source-change.json')),source='port/v2/apps/game/src/battle2/library-arena.test.ts';
if(fs.existsSync(dir+'/execution.json')||fs.existsSync(dir+'/library-owner.log'))throw Error('One owner execution only');
if(sha(fs.readFileSync(source))!==receipt.afterSha256)throw Error('Source changed before run');
for(const r of receipt.protectedInputs)if(sha(fs.readFileSync(r.path))!==r.sha256)throw Error('Protected source changed');
const args=['node_modules/vitest/vitest.mjs','run','apps/game/src/battle2/library-arena.test.ts','--reporter=verbose'],start=performance.now(),r=spawnSync(process.execPath,args,{cwd:path.resolve('port/v2'),encoding:'utf8',maxBuffer:16*1024*1024,env:{...process.env,NO_COLOR:'1',FORCE_COLOR:'0'}}),durationMs=performance.now()-start;
const normalize=s=>s.split(os.homedir()).join('~'),log=normalize((r.stdout||'')+'\n'+(r.stderr||''));
fs.writeFileSync(dir+'/library-owner.log',log,{flag:'wx'});
const retained={schema:'cf.c132-library-scale-owner-execution/v1',command:'node node_modules/vitest/vitest.mjs run apps/game/src/battle2/library-arena.test.ts --reporter=verbose',workingDirectory:'~/Projects/celestial-frontier-openai-mac/port/v2',exitCode:r.status,signal:r.signal,error:r.error?normalize(String(r.error)):null,durationMs,sourceSha256:sha(fs.readFileSync(source)),sourceUnchanged:sha(fs.readFileSync(source))===receipt.afterSha256,protectedInputsUnchanged:receipt.protectedInputs.every(p=>sha(fs.readFileSync(p.path))===p.sha256),log:{path:dir+'/library-owner.log',sha256:sha(log)},retries:0,nativeRun:false};
fs.writeFileSync(dir+'/execution.json',JSON.stringify(retained,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(retained));console.log(log.split('\n').slice(-35).join('\n'));process.exitCode=r.status??1;

