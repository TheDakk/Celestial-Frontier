/** One Mac text-encoder inference. No image encoder, transformer, decoder or painting. */
import fs from 'node:fs/promises';import {createReadStream} from 'node:fs';import http from 'node:http';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {fetchModel,DEFAULT_CACHE_ROOT} from './fetch-model.mjs';import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),dir=path.join(root,'tools/local-image-generation');
if(process.argv.length!==3)throw Error('Usage: run-kit-text-embedding.mjs NEW_AUDIT_DIRECTORY');
const out=path.resolve(process.argv[2]);await fs.mkdir(out);const sha=b=>createHash('sha256').update(b).digest('hex');
const report={status:'INCOMPLETE',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),requests:[],events:[],paintingRuns:0};let server,cdp,release;
try{
 if(execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim())throw Error('Committed source required');
 release=acquireWorkspaceLock('one accepted recipe text embedding');
 const pin=JSON.parse(await fs.readFile(path.join(dir,'model-manifest.json'))),cache=path.join(DEFAULT_CACHE_ROOT,pin.modelId.replace('/','--'),pin.revision);
 const wanted=pin.files.filter(f=>f.path.startsWith('text_encoder')||f.path.startsWith('tokenizer/'));
 const subset={...pin,files:wanted,fileCount:wanted.length,totalBytes:wanted.reduce((s,f)=>s+f.bytes,0)};report.verified=(await fetchModel({manifest:subset,cacheDir:cache,verifyOnly:true})).receipt;
 const recipe=JSON.parse(await fs.readFile(path.join(root,'audits/ART_KIT_WEATHER_MAT_20260912/prepared/recipe.json')));
 const routes=new Map(wanted.map(f=>['/model/'+f.path,path.join(cache,f.path)]));
 for(const n of ['kit-worker-engine.mjs','kit-worker-expansion.mjs','kit-engine-math.mjs','kit-contact-math.mjs','kit-weather-math.mjs','pipeline-math.mjs'])routes.set('/'+n,path.join(dir,n));
 const dist=path.join(dir,'node_modules/onnxruntime-web/dist');for(const n of await fs.readdir(dist))if(/\.(mjs|wasm)$/.test(n))routes.set('/node_modules/onnxruntime-web/dist/'+n,path.join(dist,n));
 routes.set('/tokenizer.mjs',path.join(dir,'node_modules/@huggingface/tokenizers/dist/tokenizers.mjs'));
 const script=`import * as ort from '/node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs';import {Tokenizer} from '/tokenizer.mjs';import {createKitWorkerEngine} from '/kit-worker-engine.mjs';let engine;window.proof={status:'running',events:[]};try{engine=await createKitWorkerEngine({ort,Tokenizer,progress:e=>proof.events.push(e)});const text=await engine.precomputeText(${JSON.stringify(recipe.finisherPrompt)});proof.text=text;proof.status='complete';}catch(e){proof.status='failed';proof.error=String(e.stack??e);}finally{await engine?.dispose();}`;
 server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');report.requests.push(u.pathname);res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');res.setHeader('Cache-Control','no-store');
 if(u.pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Accepted recipe text embedding</title><script type="module" src="/client.mjs"></script>');return;}if(u.pathname==='/client.mjs'){res.setHeader('Content-Type','text/javascript');res.end(script);return;}
 const p=routes.get(u.pathname);if(!p){res.writeHead(404).end();return;}res.setHeader('Content-Type',p.endsWith('.mjs')?'text/javascript':p.endsWith('.wasm')?'application/wasm':'application/octet-stream');const stream=createReadStream(p);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 cdp=await openChromiumCdp({label:'CF accepted recipe text embedding only',userDataPrefix:'cf-kit-text-',commandTimeoutMs:45000});report.browser=cdp.browser;
 const {targetId}=await cdp.send('Target.createTarget',{url:`http://127.0.0.1:${server.address().port}/`}),{sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});
 const evaluate=async expression=>{const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const deadline=performance.now()+180000;while(true){const state=await evaluate('window.proof?({status:proof.status,error:proof.error,events:proof.events}):null');if(state){report.events=state.events;console.log(JSON.stringify({status:state.status,last:state.events.at(-1)}));if(state.status==='failed')throw Error(state.error);if(state.status==='complete')break;}if(performance.now()>deadline)throw Error('One text inference deadline');await new Promise(r=>setTimeout(r,3000));}
 const meta=await evaluate('(()=>{const {data,...m}=proof.text;return m})()'),binary=Buffer.from(await evaluate("(()=>{const bytes=new Uint8Array(proof.text.data.buffer);let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s)})()"),'base64');
 if(meta.sequence!==416||meta.tokenCount!==402||binary.length!==416*7680*2||meta.promptSha256!==sha(Buffer.from(recipe.finisherPrompt)))throw Error('Accepted embedding geometry/prompt mismatch');
 const manifest={schema:'cf.kit-text-embedding.v1',modelId:pin.modelId,modelRevision:pin.revision,type:'float16',byteOrder:'little-endian',width:7680,...meta,dataSha256:sha(binary),bytes:binary.length,sourceHead:report.head};
 if(report.events.filter(e=>e.phase==='inference-start').length!==1||report.events.some(e=>e.stage&&e.stage!=='text')||report.requests.some(p=>/transformer|vae_/.test(p)))throw Error('Text-only execution boundary violated');
 await fs.writeFile(path.join(out,'embedding.f16'),binary,{flag:'wx'});await fs.writeFile(path.join(out,'embedding.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});report.embedding=manifest;report.status='PASS';
}catch(e){report.status='FAIL';report.error=String(e.stack??e);}
finally{try{await cdp?.close();}catch(e){report.status='FAIL';report.cleanupError=String(e);}if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}release?.();await fs.writeFile(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report.status==='PASS'?report.embedding:report));if(report.status!=='PASS')process.exitCode=1;
