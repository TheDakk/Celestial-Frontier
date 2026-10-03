// One authorized build-only product comparison. No native execution or gate retry.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {acquireWorkspaceLock} from '../../../port/v2/tools/workspacelock.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../..'),dist=path.join(root,'port/v2/apps/game/dist');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const safe=s=>s.split(os.homedir()).join('~');
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);
const snapshot=()=>Object.fromEntries(files(dist).filter(p=>!p.endsWith('.map')).sort().map(p=>[path.relative(dist,p).split(path.sep).join('/'),{sha256:sha(fs.readFileSync(p)),bytes:fs.statSync(p).size}]));
const write=(name,value)=>fs.writeFileSync(path.join(here,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const release=acquireWorkspaceLock('C198 pending-map build-only comparison');
const runtime=path.join(root,'tools/local-image-generation/node_modules'),aside=runtime+'.c198-map-build-aside';
let moved=false,report;
try{
 if(fs.existsSync(aside))throw Error('pre-existing runtime aside');
 const before=snapshot();write('dist-before.json',before);
 if(fs.existsSync(runtime)){fs.renameSync(runtime,aside);moved=true;}
 const result=spawnSync('npm',['run','build','--','--mode','evidence'],{cwd:path.join(root,'port/v2/apps/game'),encoding:'utf8',maxBuffer:20*1024*1024});
 fs.writeFileSync(path.join(here,'build-01.log'),safe((result.stdout||'')+(result.stderr||'')),{flag:'wx'});
 report={scope:'Single authorized build-only repair comparison, not a gate or native epoch',exitCode:result.status,signal:result.signal,optionalRuntimeMovedAside:moved};
 if(result.error)report.error=safe(result.error.message);
 if(result.status!==0){write('build-comparison.json',report);throw Error('Build-only verification failed; no retry');}
 const after=snapshot();write('dist-after.json',after);
 const keys=[...new Set([...Object.keys(before),...Object.keys(after)])].sort();
 const changes=keys.filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]));
 report={...report,status:changes.length?'DIFFERENT':'PASS',fileCountBefore:Object.keys(before).length,fileCountAfter:Object.keys(after).length,excluded:['*.map'],changes};
}finally{
 if(moved){if(fs.existsSync(runtime))throw Error('refusing overwrite while restoring optional runtime');fs.renameSync(aside,runtime);}
 release();
}
report.optionalRuntimeRestored=!moved||fs.existsSync(runtime)&&!fs.existsSync(aside);
write('build-comparison.json',report);
console.log(JSON.stringify(report));
if(report.status!=='PASS'||!report.optionalRuntimeRestored)process.exitCode=1;
