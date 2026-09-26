import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=fs.realpathSync(process.cwd()),audit=path.join(root,'audits/STATIC_LANDING_PORTRAIT_20260908');
const output=path.join(root,'port/v2/apps/game/smoke/dev-preview-static-earth-local-20260908');
const result=path.join(audit,'preview-package-results.json');
assert(!fs.existsSync(output)&&!fs.existsSync(result),'Fresh preview required');
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={schema:'cf-static-earth-local-preview/v1',certification:false,publishable:false,status:'RUNNING',startedAt:new Date().toISOString(),output,steps:[]};
function step(id,args){
 const log=path.join(audit,'preview-'+id+'.log'),fd=fs.openSync(log,'wx');let r;
 try{r=spawnSync(process.execPath,args,{cwd:root,stdio:['ignore',fd,fd],timeout:180000});}finally{fs.closeSync(fd);}
 const b=fs.readFileSync(log);report.steps.push({id,args,exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,log:{path:path.relative(root,log),bytes:b.length,sha256:hash(b)}});
 assert(!r.error&&r.status===0&&r.signal===null,'Preview '+id+' stopped');console.log(id+': PASS');
}
try{
 // The caller holds the foreground lock. Each established preview command owns
 // and releases its own checkout lease; never nest that lease here.
 const prior=JSON.parse(fs.readFileSync(path.join(audit,'integration-static-corrected-results.json'),'utf8'));
 assert.equal(prior.status,'PASS');
 for(const s of prior.sources)assert.equal(hash(fs.readFileSync(path.join(root,s.path))),s.sha256,'Source drift: '+s.path);
 step('package',['port/v2/tools/devpreview.mjs','--allow-dirty','--origin=https://dev-celestialfrontier.github.io','--output='+output]);
 step('browser-check',['port/v2/tools/devpreviewcheck.mjs','--root='+output]);
 const b=fs.readFileSync(path.join(output,'preview.json'));report.manifest={bytes:b.length,sha256:hash(b),source:JSON.parse(b).source};
 report.status='PASS';
}catch(e){report.status='FAIL';report.failure=String(e.stack??e);process.exitCode=1;}
finally{report.endedAt=new Date().toISOString();fs.writeFileSync(result,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));}
