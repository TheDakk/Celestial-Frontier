/* Native codec retention diagnostic. No I5 budget or certification output. */
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
const scratch=fs.mkdtempSync('/private/tmp/cf-png-native-'),out=process.argv[2];if(!out||fs.existsSync(out))throw Error('fresh output');
for(const name of ['png-encode.ts','png-decode.ts'])fs.writeFileSync(path.join(scratch,name),execFileSync('git',['show','HEAD:port/v2/apps/game/src/morph/'+name]));
const entry=dir=>`export {encodePng} from '${dir}/png-encode.ts';export {decodePng} from '${dir}/png-decode.ts';`;
for(const name of ['old','new'])fs.writeFileSync(path.join(scratch,name+'-entry.mjs'),entry(name==='old'?scratch:path.resolve('port/v2/apps/game/src/morph')));
execFileSync('node',['--input-type=module','-e',`import{rolldown}from'rolldown';for(const name of ['old','new']){const b=await rolldown({input:${JSON.stringify(scratch)}+'/'+name+'-entry.mjs'});await b.write({file:${JSON.stringify(scratch)}+'/'+name+'.mjs',format:'es'});await b.close();}`],{cwd:'port/v2'});
const server=http.createServer((q,r)=>{r.setHeader('Content-Type',q.url.endsWith('.mjs')?'text/javascript':'text/html');r.end(q.url.endsWith('.mjs')?fs.readFileSync(path.join(scratch,path.basename(q.url))):'<!doctype html><title>codec ownership</title>')});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={scope:'Native codec resource diagnostic, not certification',rows:[]};let browser;
try{
 browser=await openChromiumCdp({label:'PNG native stream ownership',userDataPrefix:'cf-png-stream',startupTimeoutMs:15000});report.browser=browser.browser;
 for(const name of ['old','new']){
  const {targetId}=await browser.send('Target.createTarget',{url:'http://127.0.0.1:'+server.address().port+'/'});const {sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});const send=(m,p={})=>browser.send(m,p,sessionId,{timeoutMs:15000});
  await send('Page.enable');await send('Page.bringToFront');
  for(const count of [1,16,32]){
   const r=await send('Runtime.evaluate',{expression:`(async()=>{const {encodePng,decodePng}=await import('/${name}.mjs');for(let j=0;j<${count};j++){const rgba=Uint8Array.from({length:512*512*4},(_,i)=>(i*37+j*13)&255);const png=await encodePng(rgba,512,512);const back=await decodePng(png);if(back.rgba.some((v,i)=>v!==rgba[i]))throw Error('pixel mismatch')}return true})()`,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));
   await send('HeapProfiler.collectGarbage');const heap=await send('Runtime.getHeapUsage');report.rows.push({name,count,heap});console.log(name,count,JSON.stringify(heap));
  }
  await browser.send('Target.closeTarget',{targetId});
 }
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
