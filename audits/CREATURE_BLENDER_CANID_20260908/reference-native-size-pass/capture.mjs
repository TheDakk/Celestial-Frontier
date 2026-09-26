import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {openChromiumCdp} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/browsercdp.mjs';
const root=new URL('.',import.meta.url), errors=[], rows=[]; let browser;
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={kind:'canonical-wolf-reference-extraction',certification:false,packageContentSha256:'5d1da7777da722ccb04b4dfc7b258c1b85f98fb1c3e0ae47fa5286217ac292d2',rows,errors};
try {
 browser=await openChromiumCdp({label:'canonical Wolf reference',userDataPrefix:'cf-creature-reference',onEvent:e=>{if(e.method==='Runtime.exceptionThrown')errors.push(e.params.exceptionDetails.text);}});
 report.browser=browser.browser;
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});
 const send=(method,params={})=>browser.send(method,params,sessionId);
 await send('Runtime.enable');await send('Page.enable');
 const evaluate=async expression=>{const answer=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!answer.exceptionDetails,JSON.stringify(answer.exceptionDetails));return answer.result.value;};
 const wait=async condition=>{const end=performance.now()+12000;while(performance.now()<end){if(await evaluate(condition))return;await new Promise(r=>setTimeout(r,100));}throw new Error('canonical reference readiness timeout');};
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:50689/audiovisual-pilot.html'});
 await wait('document.querySelector("#pilot-review")?.dataset.pilotReview==="ready"');
 for(const size of [132,300,440]){
  await evaluate(`(()=>{const f=document.querySelector('#pilot-specimens select[aria-label="Body plan specimen"]'),s=document.querySelector('#pilot-specimens select[aria-label="Actual portrait size"]');f.value='wolf';s.value='${size}';f.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await wait(`[...document.querySelectorAll('.p-native-pair img')].length===2 && [...document.querySelectorAll('.p-native-pair img')].every(i=>i.dataset.pilotSpecimen==='wolf'&&i.dataset.pilotSize==='${size}'&&i.complete&&i.naturalWidth===${size===132?132:440} && i.width===${size})`);
  const state=await evaluate(`(async()=>{const i=document.querySelector('.p-native-pair img'),c=document.createElement('canvas');c.width=${size};c.height=${size};const ctx=c.getContext('2d');ctx.drawImage(i,0,0,c.width,c.height);const bytes=ctx.getImageData(0,0,c.width,c.height).data;const hash=await crypto.subtle.digest('SHA-256',bytes);return {visualKey:i.dataset.visualKey,width:c.width,height:c.height,naturalWidth:i.naturalWidth,displayWidth:i.width,derivation:i.naturalWidth===c.width?'native unchanged':'browser 440-to-300 display resample',pixelsSha256:[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join(''),png:c.toDataURL('image/png').split(',')[1]};})()`);
  const bytes=Buffer.from(state.png,'base64');delete state.png; const file=`wolf-canonical-${size}.png`;fs.writeFileSync(new URL(file,root),bytes);rows.push({file,...state,bytes:bytes.length,sha256:digest(bytes)});
 }
 assert.equal(errors.length,0);report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error.stack||error);process.exitCode=1;}
finally{if(browser)try{await browser.close();}catch(error){report.status='FAIL';errors.push(String(error));process.exitCode=1;}fs.writeFileSync(new URL('reference.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,rows:rows.map(r=>({file:r.file,width:r.width,sha256:r.sha256})),errors,failure:report.failure}));}
