/* Standalone review-art renderer; no game or personal browser content. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from '../../port/v2/tools/browsercdp.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),html=fs.readFileSync(path.join(here,'index.html'));
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={schema:'cf-u3-icon-study-browser-export/v1',status:'RUNNING',scope:'Standalone review HTML only; original SVG comparison; no game/product/browser profile',htmlSha256:digest(html),startedAt:new Date().toISOString(),errors:[],fallback:'Inkscape is unusable this session after a failed version check; no further Inkscape launch attempted.'};
const output=path.join(here,'study-browser.png'),receipt=path.join(here,'browser-export-receipt.json');
assert(!fs.existsSync(output)&&!fs.existsSync(receipt),'Never overwrite retained export');
const write=()=>fs.writeFileSync(receipt,JSON.stringify(report,null,2)+'\n');
const server=http.createServer((req,res)=>{if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);}else{res.writeHead(404);res.end();}});
let browser;
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));write();
  browser=await openChromiumCdp({label:'U3 standalone icon study export',userDataPrefix:'cf-u3-icon-study',onEvent:e=>{if(e.method==='Runtime.exceptionThrown')report.errors.push(e.params.exceptionDetails.exception?.description??e.params.exceptionDetails.text);}});
  report.browser=browser.browser;
  const {browserContextId}=await browser.send('Target.createBrowserContext');
  try{
    const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId}),{sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});
    const send=(method,params={})=>browser.send(method,params,sessionId);
    const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
    await send('Runtime.enable');await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride',{width:1240,height:1600,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/'});
    const until=Date.now()+10000;
    while(!await evaluate("document.readyState==='complete'&&document.querySelectorAll('.card').length===10")){assert(Date.now()<until,'standalone document readiness expired');await new Promise(r=>setTimeout(r,25));}
    await evaluate('(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return true;})()');
    report.observation=await evaluate("(()=>({title:document.title,cards:document.querySelectorAll('.card').length,current:[...document.querySelectorAll('.emoji')].map(n=>n.textContent),svg:document.querySelectorAll('svg').length,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,size:document.getElementById('size').value,selected:document.getElementById('selected').checked,height:document.documentElement.scrollHeight}))()");
    assert.equal(report.observation.cards,10);assert.equal(report.observation.svg,19);assert(!report.observation.horizontalOverflow);assert.equal(report.observation.size,'24');
    assert.deepEqual(report.observation.current,['🔭','📖','✦','🛠','🌍','🏆','🔔','?','⚙','⬆ / 📜']);
    const image=Buffer.from((await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:1240,height:report.observation.height,scale:1}})).data,'base64');
    fs.writeFileSync(output,image,{flag:'wx'});report.image={file:path.basename(output),bytes:image.length,sha256:digest(image),width:image.readUInt32BE(16),height:image.readUInt32BE(20)};
    assert.equal(report.errors.length,0);assert.equal(digest(fs.readFileSync(path.join(here,'index.html'))),report.htmlSha256);report.status='PASS';
  }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});}
}catch(error){report.status='FAIL';report.failure=String(error);throw error;}
finally{try{await browser?.close();}catch(error){report.status='FAIL';report.cleanupError=String(error);}if(server.listening)await new Promise(resolve=>server.close(resolve));report.endedAt=new Date().toISOString();write();}
assert.equal(report.status,'PASS',report.cleanupError??report.failure);console.log(JSON.stringify({status:report.status,image:report.image,observation:report.observation}));
