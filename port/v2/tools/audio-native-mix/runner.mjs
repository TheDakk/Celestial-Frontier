import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from '../browsercdp.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=fs.realpathSync(path.resolve(here,'../../../..'));
assert.equal(process.argv.length,4,'Usage: node port/v2/tools/audio-native-mix/runner.mjs /absolute/build /absolute/new-evidence');
const build=fs.realpathSync(process.argv[2]),out=path.resolve(process.argv[3]);assert(!fs.existsSync(out),'Evidence directory must be new');
fs.mkdirSync(out,{recursive:false});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),manifestBytes=fs.readFileSync(path.join(build,'manifest.json'));
const manifest=JSON.parse(manifestBytes),report={schema:'cf-native-audio-mix-report/v1',status:'RUNNING',certification:false,
  startedAt:new Date().toISOString(),buildManifest:{bytes:manifestBytes.length,sha256:sha(manifestBytes)},sources:manifest.sources,
  served:[],artifacts:[],errors:[],limitations:[
    'Native OfflineAudioContext DSP through actual runtime and registered combat requests; scheduling state/close use an explicit audit adapter.',
    'Calibration DC sources and observer taps are audit-only. They prove gain waveforms, not authored music quality or a native game interaction.',
    'Explicit owner stops test overlap/restoration. No natural onended, watchdog timing, gesture, device, speaker, HUMAN listening or whole-Gate acceptance.'
  ]};
const persist=()=>fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2)+'\n');persist();
let browser,server;
const verify=(root,row)=>{const file=path.resolve(root,row.path);assert(file.startsWith(root+path.sep),'Path escaped evidence root');const bytes=fs.readFileSync(file);assert.equal(bytes.length,row.bytes,row.path+' bytes');assert.equal(sha(bytes),row.sha256,row.path+' hash');return bytes;};
const storeState=state=>{
  if(!state)return;
  report.observation={...state,cases:state.cases.map((item,index)=>{
    const {pcm,...details}=item;const samples=[];
    for(const [channel,base64] of pcm.entries()){
      const bytes=Buffer.from(base64,'base64');assert.equal(bytes.length,item.frames*4,'Exact planar f32 PCM length');
      const name=`case-${index+1}-${item.kind}-${item.fault}-channel-${channel}.f32le`;
      fs.writeFileSync(path.join(out,name),bytes,{flag:'wx'});const artifact={path:name,bytes:bytes.length,sha256:sha(bytes),rate:item.rate,frames:item.frames,channel};
      report.artifacts.push(artifact);samples.push(artifact);
    }
    return{...details,pcm:samples};
  })};
};
try{
  assert.equal(manifest.status,'PASS','Isolated build must have passed');
  for(const row of manifest.sources)verify(repo,row);
  const files=new Map(manifest.files.map(row=>[row.path,row]));for(const row of files.values())verify(build,row);
  server=http.createServer((req,res)=>{try{
    assert(req.method==='GET'||req.method==='HEAD');const url=new URL(req.url,'http://127.0.0.1'),name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
    const row=files.get(name);assert(row,'Unlisted path');const bytes=verify(build,row);report.served.push({path:name,sha256:row.sha256});
    res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html':name.endsWith('.js')?'text/javascript':'application/json','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404);res.end('Not found');}});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});report.origin=`http://127.0.0.1:${server.address().port}`;
  browser=await openChromiumCdp({label:'native audio mixer waveform',userDataPrefix:'cf-native-audio-mix',commandTimeoutMs:30000,
    onEvent:event=>{if(event.method==='Runtime.exceptionThrown')report.errors.push(event.params.exceptionDetails);}});report.browser=browser.browser;persist();
  const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});
  const send=(method,params={})=>browser.send(method,params,sessionId);
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.navigate',{url:report.origin+'/'});
  const end=Date.now()+15000;
  for(;;){const read=await send('Runtime.evaluate',{expression:'Boolean(window.cfNativeAudioMix)',returnByValue:true});if(read.result.value)break;assert(Date.now()<end,'Audit entry not ready');await new Promise(resolve=>setTimeout(resolve,50));}
  const result=await send('Runtime.evaluate',{expression:'window.cfNativeAudioMix.run()',awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails){
    const partial=await send('Runtime.evaluate',{expression:'window.cfNativeAudioMix.state',returnByValue:true});storeState(partial.result.value);
    throw Error(JSON.stringify(result.exceptionDetails));
  }
  storeState(result.result.value);assert.equal(report.observation.status,'PASS');assert.equal(report.observation.cases.length,6,'Exact two cases, three controls, restored positive');
  assert.equal(report.errors.length,0,'Uncaught browser exception');
  for(const row of manifest.sources)verify(repo,row);for(const row of files.values())verify(build,row);
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;}
finally{
  try{if(browser){await browser.close();report.browserClosed=true;}else report.browserClosed=null;}catch(error){report.status='FAIL';report.browserCleanupError=String(error.stack??error);process.exitCode=1;}
  try{
    if(server){await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));report.serverClosed=true;}
    else report.serverClosed=null;
  }catch(error){report.status='FAIL';report.serverClosed=false;report.serverCleanupError=String(error.stack??error);process.exitCode=1;}
  report.finishedAt=new Date().toISOString();persist();
}
console.log(JSON.stringify({status:report.status,report:path.join(out,'review.json'),artifacts:report.artifacts.length}));
