/** One native authoring proof on the production stage worker and app-owned warm
 * client. No pack, old --landfall/--variant run, OPFS engineering or GitHub. */
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {fetchModel,DEFAULT_CACHE_ROOT} from './fetch-model.mjs';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../..');
if(![4,5].includes(process.argv.length)||(process.argv.length===5&&process.argv[4]!=='--landings=2'))throw Error('Usage: run-kit-engine-proof.mjs PREPARED_DIRECTORY NEW_RESULT_DIRECTORY [--landings=2]');
const landingCount=process.argv[4]==='--landings=2'?2:1;
const prepared=path.resolve(process.argv[2]),output=path.resolve(process.argv[3]);await fs.mkdir(output);
const sha=b=>createHash('sha256').update(b).digest('hex');
const receipt={schema:'cf.kit-engine-native-proof.v4',status:'FAIL',startedAt:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),events:[],sources:[],requests:[],memory:[],qualityAccepted:false};
let release,server,cdp,sessionId;
try{
  const dirty=execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'});if(dirty.trim())throw Error('Native proof requires committed unchanged tracked source');
  release=acquireWorkspaceLock('one native Art Kit v4 engine painting');
  const pin=JSON.parse(await fs.readFile(path.join(dir,'model-manifest.json'),'utf8')),cacheDir=path.join(DEFAULT_CACHE_ROOT,pin.modelId.replace('/','--'),pin.revision);
  receipt.modelVerification=(await fetchModel({manifest:pin,cacheDir,verifyOnly:true})).receipt;
  const manifest=JSON.parse(await fs.readFile(path.join(prepared,'prepared-manifest.json'),'utf8'));
  const recipeBytes=await fs.readFile(path.join(prepared,'recipe.json'));if(sha(recipeBytes)!==manifest.recipeSha256)throw Error('Prepared recipe SHA mismatch');
  receipt.recipeSha256=manifest.recipeSha256;
  const routes=new Map([['/recipe.json',path.join(prepared,'recipe.json')],['/kit-client.mjs',path.join(prepared,'kit-client.mjs')]]);
  for(const name of ['kit-proof-client.mjs','stage-worker.mjs','kit-worker-engine.mjs','kit-worker-expansion.mjs','kit-engine-math.mjs','kit-contact-math.mjs','pipeline-math.mjs','gpu-profile.mjs','denoiser-shapes.mjs','browser-variant-plan.json'])routes.set('/'+name,path.join(dir,name));
  if(landingCount===2)routes.set('/stage-worker.mjs',path.join(dir,'kit-stage-worker.mjs'));
  for(const row of manifest.files){const file=path.join(prepared,'inputs',path.basename(row.url));if(sha(await fs.readFile(file))!==row.sha256)throw Error('Prepared RGBA changed');routes.set(row.url,file);}
  for(const row of pin.files)routes.set('/model/'+row.path,path.join(cacheDir,row.path));
  const dist=path.join(dir,'node_modules/onnxruntime-web/dist');for(const name of await fs.readdir(dist))if(/\.(mjs|wasm)$/.test(name))routes.set('/node_modules/onnxruntime-web/dist/'+name,path.join(dist,name));
  routes.set('/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs',path.join(dir,'node_modules/@huggingface/tokenizers/dist/tokenizers.mjs'));
  routes.set('/triptych.png',path.join(root,'audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png'));
  for(const [url,file]of routes)if(!url.startsWith('/model/')){const bytes=await fs.readFile(file);receipt.sources.push({url,file:path.relative(root,file),bytes:bytes.length,sha256:sha(bytes)});}
  const html='<!doctype html><meta charset="utf-8"><title>Celestial Frontier — first kit engine painting</title><style>body{background:#121918;color:#eef1ec;font:16px system-ui;margin:24px}img{display:block;max-width:none;margin:16px 0}#reference{width:1024px}</style><h1>First Art Kit v4 engine painting</h1><p id="status">Prepared</p><img id="painting" hidden alt="Native local engine painting"><img id="reference" src="/triptych.png" alt="Approved Living Worlds triptych"><script type="module" src="/kit-proof-client.mjs"></script>';
  server=http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');if(receipt.requests.length<2000)receipt.requests.push({method:req.method,path:url.pathname,range:req.headers.range??null});
    for(const [k,v]of Object.entries({'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; worker-src 'self' blob:; img-src 'self' blob:; connect-src 'self'; object-src 'none'"}))res.setHeader(k,v);
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
    if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}
    const file=routes.get(url.pathname);if(!file){res.writeHead(404).end();return;}
    try{
      const stat=await fs.stat(file);if(!stat.isFile())throw Error('Not a file');const types={'.mjs':'text/javascript','.json':'application/json','.wasm':'application/wasm','.png':'image/png'};res.setHeader('Content-Type',types[path.extname(file)]??'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
      let start=0,end=stat.size-1;
      if(req.headers.range){const match=/^bytes=(\d+)-(\d+)$/.exec(req.headers.range);if(!match)throw Error('Range shape');start=Number(match[1]);end=Number(match[2]);if(start>end||end>=stat.size)throw Error('Range bounds');res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
      res.setHeader('Content-Length',end-start+1);if(req.method==='HEAD'){res.end();return;}
      const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
    }catch{if(!res.headersSent)res.writeHead(416);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  cdp=await openChromiumCdp({label:'CF kit v4 first engine painting',userDataPrefix:'cf-kit-engine-',commandTimeoutMs:45000});receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
  const {targetId}=await cdp.send('Target.createTarget',{url:`http://127.0.0.1:${server.address().port}/?landings=${landingCount}`});({sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));await cdp.send('Runtime.enable',{},sessionId);
  const evaluate=async(expression,awaitPromise=true)=>{const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise,returnByValue:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
  const ready=performance.now()+15000;while(!await evaluate('!!window.kitProof')){if(performance.now()>ready)throw Error('Proof page did not initialize');await new Promise(r=>setTimeout(r,100));}
  await evaluate('void window.kitProof.start()',false);
  const deadline=performance.now()+1_810_000;let lastSequence=-1,state;
  while(true){
    state=await evaluate('window.kitProof.snapshot()');
    if(state.last?.sequence!==lastSequence){lastSequence=state.last?.sequence;console.log(JSON.stringify(state));await fs.writeFile(path.join(output,'progress.json'),JSON.stringify(state,null,2)+'\n');}
    if(['complete','failed'].includes(state.status))break;if(performance.now()>deadline)throw Error('Native proof deadline');
    if(receipt.memory.length<200){const heap=await cdp.send('Runtime.getHeapUsage',{},sessionId);receipt.memory.push({at:new Date().toISOString(),rendererHeap:heap});}
    await new Promise(r=>setTimeout(r,5000));
  }
  const report=await evaluate('window.kitProof.report()');Object.assign(receipt,report);receipt.status=state.status==='complete'?'PASS':'FAIL';
  const capture=async(kind,file,index=0)=>{const encoded=await evaluate(`window.kitProof.artifact(${JSON.stringify(kind)},${index})`);const bytes=Buffer.from(encoded,'base64');await fs.writeFile(path.join(output,file),bytes,{flag:'wx'});return {file,bytes:bytes.length,sha256:sha(bytes)};};
  receipt.artifacts=[];for(let i=0;i<state.partialCount;i++)receipt.artifacts.push(await capture('partial',`partial-${String(i+1).padStart(2,'0')}-${report.partial[i].toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`,i));
  if(receipt.status==='PASS'){receipt.artifacts.push(await capture('painting','painting.png'));receipt.artifacts.push(await capture('composite','composite-before-finisher.png'));for(let i=0;i<6;i++){receipt.artifacts.push(await capture('cutout',`organism-${String(i+1).padStart(2,'0')}.png`,i));receipt.artifacts.push(await capture('mask',`organism-${String(i+1).padStart(2,'0')}-mask.png`,i));}receipt.artifacts.push(await capture('protection','protected-interiors.png'));}
  if(receipt.status==='PASS'&&landingCount===2){if(receipt.landings?.length!==2||receipt.landings.some(row=>Object.values(row.sessionCreates).some(n=>n!==1)))throw Error('Two warm landings did not reuse all four sessions');for(let i=0;i<2;i++)receipt.artifacts.push(await capture('landing',`landing-${i+1}-painting.png`,i));receipt.secondLandingWarmMs=receipt.landings[1].elapsedMs;}
  for(const row of receipt.sources)if(sha(await fs.readFile(path.join(root,row.file)))!==row.sha256)throw Error('Runtime source changed: '+row.file);
}catch(error){receipt.status='FAIL';receipt.error=String(error.stack??error);console.error(receipt.error);}
finally{
  try{if(cdp&&sessionId)await cdp.send('Runtime.evaluate',{expression:'window.kitProof?.dispose()'},sessionId);}catch{}
  try{await cdp?.close();}catch(error){receipt.status='FAIL';receipt.cleanupError=String(error);}
  if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  release?.();receipt.finishedAt=new Date().toISOString();await fs.writeFile(path.join(output,'result.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({status:receipt.status,output,elapsedMs:receipt.details?.elapsedMs,error:receipt.error??null}));if(receipt.status!=='PASS')process.exitCode=1;
