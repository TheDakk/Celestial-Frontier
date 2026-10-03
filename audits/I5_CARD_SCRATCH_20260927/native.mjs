/* Compare actual renderer backing stores. Diagnostic only; no I5 budgets touched. */
import fs from 'node:fs';import http from 'node:http';import path from 'node:path';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';import{createRequire}from'node:module';
import{openChromiumCdp}from'../../port/v2/tools/browsercdp.mjs';
const require=createRequire(import.meta.url),v2require=createRequire(path.resolve('port/v2/package.json')), {rolldown}=await import(v2require.resolve('rolldown'));
const {PNG}=createRequire(v2require.resolve('free-tex-packer-core'))('pngjs');
const scratch=fs.mkdtempSync('/private/tmp/cf-card-native-'),out=process.argv[2],root=process.cwd(),oldHead='6bd5b337d1865910b1a5a18d7f82bf3fa06e6fee';if(!out||fs.existsSync(out))throw Error('fresh output required');
const source=path.resolve('port/v2/apps/game/src/morph/morph-card.ts'),old=execFileSync('git',['show',oldHead+':port/v2/apps/game/src/morph/morph-card.ts'],{encoding:'utf8'}),sha=b=>createHash('sha256').update(b).digest('hex');
const entry=`export{renderCardIndividualV1}from'${source}';export{morphParamsV1}from'${root}/port/v2/apps/game/src/morph/morph-params.ts';export{compileBodyCard}from'${root}/port/v2/apps/game/src/motion/body-card.ts';`;
fs.writeFileSync(scratch+'/entry.mjs',entry);
for(const name of ['old','new']){const b=await rolldown({input:scratch+'/entry.mjs',plugins:name==='old'?[{name:'immutable-old-renderer',load(id){if(id===source)return old;}}]:[]});try{await b.write({file:scratch+'/'+name+'.mjs',format:'es'});}finally{await b.close();}}
const dir=root+'/audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/';for(const kind of ['master','labels']){const p=PNG.sync.read(fs.readFileSync(dir+'card/'+kind+'-512.png'));fs.writeFileSync(scratch+'/'+kind+'.rgba',p.data);}
const fixture={receipt:JSON.parse(fs.readFileSync(dir+'card/card.json')),record:JSON.parse(fs.readFileSync(dir+'record.json')),width:512,height:512};
const server=http.createServer((q,r)=>{r.setHeader('Content-Type',q.url==='/'?'text/html':q.url.endsWith('.mjs')?'text/javascript':'application/octet-stream');if(q.url==='/fixture.json')return r.end(JSON.stringify(fixture));if(q.url==='/')return r.end('<!doctype html><title>renderer ownership</title>');const file=path.join(scratch,path.basename(q.url));if(!fs.existsSync(file)){r.writeHead(404);return r.end();}r.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={scope:'Native renderer backing-store diagnosis, not calibration/certification',oldHead,oldSha256:sha(old),newSha256:sha(fs.readFileSync(source)),scratchSha256:sha(fs.readFileSync('port/v2/apps/game/src/morph/raster-scratch.ts')),rows:[]};let browser;
try{browser=await openChromiumCdp({label:'Card scratch ownership',userDataPrefix:'cf-card-scratch',startupTimeoutMs:15000});report.browser=browser.browser;
for(const name of ['old','new']){
const{targetId}=await browser.send('Target.createTarget',{url:'http://127.0.0.1:'+server.address().port+'/'});const{sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});const send=(m,p={})=>browser.send(m,p,sessionId,{timeoutMs:15000});
const evaluate=async(expression,awaitPromise=false)=>{const r=await send('Runtime.evaluate',{expression,awaitPromise,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
await send('Page.enable');await send('Page.bringToFront');
await evaluate(`(async()=>{const api=await import('/${name}.mjs'),f=await(await fetch('/fixture.json')).json(),master=new Uint8Array(await(await fetch('/master.rgba')).arrayBuffer()),labels=new Uint8Array(await(await fetch('/labels.rgba')).arrayBuffer());globalThis.render=()=>api.renderCardIndividualV1({master:{width:f.width,height:f.height,master,labels},receipt:f.receipt,card:api.compileBodyCard(f.record,f.record.genome),params:api.morphParamsV1({seed:3,color:1,accent:4,head:7,tail:6},f.receipt.recordRecipeHash),size:132});globalThis.heldOutput=null;return true})()`,true);
await send('HeapProfiler.collectGarbage');report.rows.push({name,phase:'ready',heap:await send('Runtime.getHeapUsage')});
for(let cycle=1;cycle<=3;cycle++){
await evaluate('globalThis.heldOutput=render();heldOutput.byteLength');report.rows.push({name,phase:'render-'+cycle,heap:await send('Runtime.getHeapUsage')});
await send('HeapProfiler.collectGarbage');report.rows.push({name,phase:'gc-'+cycle,heap:await send('Runtime.getHeapUsage')});
}
const digest=await evaluate(`(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',heldOutput)),b=>b.toString(16).padStart(2,'0')).join(''))()`,true);report.rows.push({name,phase:'output',sha256:digest});await browser.send('Target.closeTarget',{targetId});
}
if(report.rows.filter(r=>r.phase==='output')[0].sha256!==report.rows.filter(r=>r.phase==='output')[1].sha256)throw Error('Native pixel mismatch');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report.rows,null,2));
