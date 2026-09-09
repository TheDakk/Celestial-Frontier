import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {acquireToolchainLock} from '../../tools/with-toolchain-lock.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
const root=fs.realpathSync(process.cwd()),audit=path.join(root,'audits/STATIC_LANDING_PORTRAIT_20260908');
const dist=path.join(root,'port/v2/apps/game/smoke/earth-civet-landing-evidence-dist-20260908');
const out=path.join(audit,'native-v2'),result=path.join(audit,'integration-build-native-results.json');
assert.equal(process.argv.length,2);assert(!fs.existsSync(result)&&!fs.existsSync(dist)&&!fs.existsSync(out),'Fresh outputs required');
const report={schema:'cf-static-earth-landing-build-native/v1',certification:false,status:'RUNNING',startedAt:new Date().toISOString(),steps:[],cleanupErrors:[],locksReleased:false};
let foreground,release;
const hash=b=>createHash('sha256').update(b).digest('hex');
function step(id,args,cwd,timeout){
 const log=path.join(audit,id+'.log'),fd=fs.openSync(log,'wx');let r;
 const item={id,args,cwd,startedAt:new Date().toISOString()};report.steps.push(item);
 try{r=spawnSync(process.execPath,args,{cwd,stdio:['ignore',fd,fd],timeout});}finally{fs.closeSync(fd);}
 const b=fs.readFileSync(log);Object.assign(item,{endedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,log:{path:path.relative(root,log),bytes:b.length,sha256:hash(b)}});
 assert(!r.error&&r.status===0&&r.signal===null,id+' stopped; retained log');console.log(id+': PASS');
}
try{
 assert.equal(root,'/Users/nick/Projects/celestial-frontier-openai-mac');
 foreground=acquireToolchainLock('static Earth landing build and native v2');release=acquireWorkspaceLock('static Earth landing build and native v2');
 const staticBytes=fs.readFileSync(path.join(audit,'integration-static-corrected-results.json')),prior=JSON.parse(staticBytes);
 assert.equal(prior.status,'PASS');report.staticReceiptSha256=hash(staticBytes);
 for(const entry of prior.sources)assert.equal(hash(fs.readFileSync(path.join(root,entry.path))),entry.sha256,'Static source drift: '+entry.path);
 step('evidence-build-v2',['../../node_modules/vite/bin/vite.js','build','--mode','evidence','--outDir',dist],path.join(root,'port/v2/apps/game'),180000);
 step('native-v2-chain',[path.join(audit,'native-landing-still-v2-chain.mjs'),dist,out],root,650000);
 const nativeBytes=fs.readFileSync(path.join(out,'chain-report.json'));assert.equal(JSON.parse(nativeBytes).status,'PASS');
 report.chainReportSha256=hash(nativeBytes);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=String(e.stack??e);process.exitCode=1;}
finally{
 try{release?.();}catch(e){report.cleanupErrors.push(String(e));}try{foreground?.release();}catch(e){report.cleanupErrors.push(String(e));}
 report.locksReleased=!!(foreground&&release)&&report.cleanupErrors.length===0;
 if(report.cleanupErrors.length){report.status='FAIL';process.exitCode=1;}
 report.endedAt=new Date().toISOString();fs.writeFileSync(result,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
}
