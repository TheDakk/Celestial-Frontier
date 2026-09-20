import fs from 'node:fs';
import {openGapeCandidate} from '../painted-creature/q1-open-gape.mjs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {rolldown} from 'rolldown';
import {openChromiumCdp} from '../browsercdp.mjs';
import {acquireWorkspaceLock} from '../workspacelock.mjs';
const root=path.resolve(import.meta.dirname,'../../../..'),arg=process.argv[2];
const mode='parts';if(!arg||process.argv.length!==3)throw Error('Usage: q1-runner.mjs NEW_OUTPUT_DIRECTORY');
const out=path.resolve(arg);if(fs.existsSync(out))throw Error('New output required');
fs.mkdirSync(out,{recursive:true});
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-painter-census-')),sources=new Map(),sha=b=>createHash('sha256').update(b).digest('hex');
const report={candidateOnly:true,originalsChanged:false,projection:'Q1 eCrab dactyl control y=.32cw, endpoint y=.26cw; observation and paint agree',status:'RUNNING',diagnostic:true,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),dirtyDiagnostic:execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).trim().length>0};
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
let release,server,browser;
try{
 release=acquireWorkspaceLock('full painter observation census');
 const bundle=await rolldown({input:path.join(import.meta.dirname,mode==='parts'?'parts-entry.mjs':'native-entry.mjs'),platform:'browser',plugins:[{name:'q1-candidate',transform(source,id){if(id.endsWith('/invertoverrides.ts'))return openGapeCandidate(source);if(id.endsWith('/fauna-coverage/parts-entry.mjs')){const old="const names=['Crab','Coconut Crab','Freshwater Crab','Mud Crab','Vent Crab','Fiddler Crab'];";if(source.split(old).length!==2)throw Error('Q1 inventory source changed');return source.replace(old,"const names=['Crab','Coconut Crab'];");}}},{name:'source-hashes',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())sources.set(id,sha(fs.readFileSync(id)));}}]});
 try{await bundle.write({dir:scratch,format:'es',entryFileNames:'bundle.js'});}finally{await bundle.close();}
 fs.writeFileSync(path.join(scratch,'index.html'),'<body><script type="module" src="bundle.js"></script></body>');
 server=http.createServer((req,res)=>{const n=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!['index.html','bundle.js'].includes(n)){res.writeHead(404).end();return;}res.setHeader('Content-Type',n.endsWith('.js')?'text/javascript':'text/html');res.end(fs.readFileSync(path.join(scratch,n)));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await openChromiumCdp({label:'Full Earth and procedural painter census',userDataPrefix:'cf-fauna-census',commandTimeoutMs:60000});report.browser=browser.browser;
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'}),{sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});
 const evaluate=async expression=>{const r=await browser.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await browser.send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port},sessionId);
 const deadline=performance.now()+900000;let printed=-1;
 for(;;){
  const state=await evaluate('window.cfFaunaCensus?.state');
  if(state?.status==='FAIL')throw Error(state.error);
  if(state?.status==='DONE')break;
  const group=Math.floor((state?.completed??0)/100);
  if(group!==printed){printed=group;console.log(JSON.stringify(state??{status:'BOOTING'}));}
  if(performance.now()>deadline)throw Error('Painter census timeout');
  await new Promise(r=>setTimeout(r,1000));
 }
 Object.assign(report,await evaluate('window.cfFaunaCensus.report'));
 const artifacts=await evaluate('window.cfFaunaCensus.artifacts');report.artifacts=[];
 for(const[name,base64]of Object.entries(artifacts)){
  if(!/^[a-z-]+\.(png|json)$/.test(name))throw Error('Invalid census artifact');
  const bytes=Buffer.from(base64,'base64');fs.writeFileSync(path.join(out,name),bytes);report.artifacts.push({path:name,sha256:sha(bytes),bytes:bytes.length});
 }
 if(report.status!=='DIAGNOSTIC_PASS')process.exitCode=1;
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;}
finally{
 report.sources=[...sources].map(([p,sha256])=>({path:path.relative(root,p),sha256}));
 for(const[p,hash]of sources)if(sha(fs.readFileSync(p))!==hash){report.status='FAIL';report.error='Source changed during census: '+p;process.exitCode=1;}
 await browser?.close();if(server)await new Promise(r=>server.close(r));release?.();save();fs.rmSync(scratch,{recursive:true,force:true});
}
console.log(JSON.stringify({status:report.status,counts:report.counts,error:report.error}));
