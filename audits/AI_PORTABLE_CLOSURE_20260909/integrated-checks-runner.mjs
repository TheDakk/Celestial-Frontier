import fs from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {acquireWorkspaceLock} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/workspacelock.mjs';
const root=process.cwd(),out=root+'/audits/AI_PORTABLE_CLOSURE_20260909/integrated-controls-01';
await fs.mkdir(out,{recursive:false});
let release=null;
const names=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(n=> /^(tools\/|port\/v2\/|main.js$|celestial-frontier.html$)/.test(n)&&/\.(?:[cm]?js|ts|json|html)$/.test(n)))].sort();
const snapshot=async()=>Promise.all(names.map(async path=>{const bytes=await fs.readFile(root+'/'+path);return {path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}));
const result={schema:'cf.portable-combined-controls.v1',status:'FAIL',checks:[]};
try{
result.sources=await snapshot();await fs.writeFile(out+'/source-before.json',JSON.stringify(result.sources,null,2)+'\n');
const steps=[
['focused',root+'/port/v2',['node_modules/vitest/vitest.mjs','run','tests/local-model-variant.test.ts','tests/local-model-variant-storage.test.ts','tests/local-ai-game.test.ts','tests/local-ai-runtime.test.ts']],
['runtime-pack',root,['--test','tools/local-image-generation/runtime-pack.test.mjs']],
['transport-and-native-controls',root,['--test','tools/local-image-generation/game-preview-server.test.mjs','tools/local-image-generation/run-mobile-model-delivery.test.mjs','tools/local-image-generation/offline-variant-proof.test.mjs','tools/local-image-generation/offline-landfall-proof.test.mjs']],
['typecheck',root+'/port/v2',['node_modules/typescript/bin/tsc','--noEmit']],
['typecheck-game',root+'/port/v2',['node_modules/typescript/bin/tsc','--noEmit','-p','apps/game/tsconfig.json']],
['typecheck-worker',root+'/port/v2',['node_modules/typescript/bin/tsc','--noEmit','-p','apps/game/tsconfig.worker.json']],
['validate',root,['tools/validate.js']]];
for(const [label,cwd,args] of steps){if(label!=='runtime-pack')release=acquireWorkspaceLock('portable focused '+label);const r=spawnSync(process.execPath,args,{cwd,encoding:'utf8',maxBuffer:20*1024*1024});await fs.writeFile(out+'/'+label+'.log',(r.stdout??'')+(r.stderr??''));result.checks.push({label,command:['node',...args],exitCode:r.status,error:r.error?.message??null});console.log(label+': '+r.status);release?.();release=null;if(r.status!==0)throw Error(label+' failed');}
result.status='PASS';
}catch(e){result.error=String(e.stack??e);process.exitCode=1;}
finally{const after=await snapshot();result.sourcesUnchanged=JSON.stringify(result.sources)===JSON.stringify(after);if(!result.sourcesUnchanged){result.status='FAIL';process.exitCode=1;}delete result.sources;release?.();result.scope='Changed browser variant storage/controller/pack/observer integration; runtime pack owns its own checkout lock. No full battery, model execution or phone qualification.';await fs.writeFile(out+'/result.json',JSON.stringify(result,null,2)+'\n');console.log(result.status+' '+out);}
