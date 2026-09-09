import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { acquireToolchainLock } from '../../tools/with-toolchain-lock.mjs';
import { acquireWorkspaceLock } from '../../port/v2/tools/workspacelock.mjs';

const root=fs.realpathSync(process.cwd()), audit=path.join(root,'audits/STATIC_LANDING_PORTRAIT_20260908');
const resultFile=path.join(audit,'integration-static-corrected-results.json');
assert.equal(process.argv.length,2); assert(!fs.existsSync(resultFile),'Fresh result required');
const tests=['tests/painted-earth-landing-binding.test.ts'];
const read=relative=>{const b=fs.readFileSync(path.join(root,relative));return {path:relative,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};};
const observer=fs.readFileSync(path.join(audit,'native-landing-still-v2-runner.mjs'),'utf8');
const block=observer.match(/const sourceNames = \[([\s\S]*?)\n\];/u); assert(block);
const names=[...new Set([
  ...[...block[1].matchAll(/'([^']+)'/gu)].map(m=>m[1]), ...tests.map(t=>'port/v2/'+t),
  'port/v2/apps/game/src/release-content.ts', 'port/v2/apps/game/vite.config.ts',
  'port/v2/tsconfig.json','port/v2/apps/game/tsconfig.json','port/v2/apps/game/tsconfig.worker.json',
  'port/v2/package.json','port/v2/package-lock.json','package.json','package-lock.json',
  'tools/validate.js','tools/build.js','tools/baseline.json',
  'audits/STATIC_LANDING_PORTRAIT_20260908/integration-static-corrected-runner.mjs',
])];
const report={schema:'cf-painted-earth-landing-static/v1',certification:false,status:'RUNNING',startedAt:new Date().toISOString(),
  startingCommit:null,sources:[],steps:[],pending:null,cleanupErrors:[],locksReleased:false,
  scope:'One focused/static fail-stop chain. No repeated kinematics, full profile or browser certification.'};
let foreground, release;
const unchanged=()=>{for(const entry of report.sources)assert.deepEqual(read(entry.path),entry,'Source drift: '+entry.path);};
function step(id,cmd,args,cwd=root){
  unchanged(); const log=path.join(audit,'integration-static-corrected-'+id+'.log'),fd=fs.openSync(log,'wx');
  const item={id,cmd,args,cwd,startedAt:new Date().toISOString(),status:'RUNNING'};
  report.steps.push(item);report.pending=id;let r;
  try{r=spawnSync(cmd,args,{cwd,stdio:['ignore',fd,fd],timeout:180000});}finally{fs.closeSync(fd);}
  Object.assign(item,{endedAt:new Date().toISOString(),exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,
    log:read(path.relative(root,log))});
  assert(!r.error&&r.status===0&&r.signal===null,id+' stopped; retained log'); unchanged();
  item.status='PASS';report.pending=null;console.log(id+': PASS');
}
try{
  assert.equal(process.platform,'darwin');assert.equal(root,'/Users/nick/Projects/celestial-frontier-openai-mac');
  assert.equal(execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim(),root);
  assert.equal(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'openai/mac');
  report.startingCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const prior=JSON.parse(fs.readFileSync(path.join(audit,'integration-static-results.json'),'utf8'));
  assert.equal(prior.pending,'typecheck');assert.equal(prior.steps.find(s=>s.id==='focused')?.status,'PASS');
  for(const entry of prior.sources)if(entry.path!=='port/v2/tests/painted-earth-landing-binding.test.ts')
    assert.deepEqual(read(entry.path),entry,'Unchanged predecessor source drift: '+entry.path);
  report.prior=read('audits/STATIC_LANDING_PORTRAIT_20260908/integration-static-results.json');
  report.fix='TS2352 in mutable adversarial deep-clone fixture: explicitly bridge readonly clone through unknown; no runtime behavior or assertion changes. Original146 focused passes retained; rerun only changed5-test file.';
  foreground=acquireToolchainLock('static Earth landing focused and static');release=acquireWorkspaceLock('static Earth landing focused and static');
  report.sources=names.map(read);report.legacyBefore=read('celestial-frontier.html');
  for(const id of ['runner','chain']) step('native-syntax-'+id,process.execPath,['--check',path.join(audit,'native-landing-still-v2-'+id+'.mjs')]);
  step('focused',process.execPath,['node_modules/vitest/vitest.mjs','run',...tests],path.join(root,'port/v2'));
  step('typecheck','/opt/homebrew/bin/npm',['--prefix','port/v2','run','typecheck']);
  step('validate',process.execPath,['tools/validate.js']);
  report.legacyAfter=read('celestial-frontier.html');assert.deepEqual(report.legacyAfter,report.legacyBefore);
  unchanged();report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;
  if(report.steps.at(-1)?.status==='RUNNING')report.steps.at(-1).status='FAIL';
}finally{
  try{release?.();}catch(e){report.cleanupErrors.push(String(e));}
  try{foreground?.release();}catch(e){report.cleanupErrors.push(String(e));}
  report.locksReleased=!!(release&&foreground)&&!report.cleanupErrors.length;
  if(report.cleanupErrors.length){report.status='FAIL';process.exitCode=1;}
  report.endedAt=new Date().toISOString();fs.writeFileSync(resultFile,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:report.status,pending:report.pending,report:resultFile,locksReleased:report.locksReleased}));
}
