/** R9 — finished textures for painted creatures. One native run of the accepted
 * masked finisher (strength 0.35, one step, creature interior editable) over the
 * five crab painter masters, on the pinned local model served from the ignored
 * cache; Node then restores/verifies alpha and key, writes each `<id>-finished.png`
 * with a receipt, and runs the conservation gates. Desktop only; nothing is
 * written into the game or the painter masters. A dirty tree is a diagnostic.
 *
 *   node port/v2/tools/painted-creature/finish-master.mjs NEW_OUTPUT_DIR [--subjects=crab,mud-crab] [--allow-dirty] [--prepare-only] [--no-triptych]
 */
import fs from 'node:fs/promises';
import {createReadStream,existsSync} from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {fetchModel,DEFAULT_CACHE_ROOT} from '../../../../tools/local-image-generation/fetch-model.mjs';
import {prepareKitTextTokens} from '../../../../tools/local-image-generation/kit-engine-math.mjs';
import {openChromiumCdp} from '../browsercdp.mjs';
import {acquireWorkspaceLock} from '../workspacelock.mjs';
import {readPng,writePng,alphaConservation,conservationReport,loadLabels} from './finish-conservation.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../../..'),image=path.join(root,'tools/local-image-generation');
const require=createRequire(import.meta.url),{Tokenizer}=await import(pathToFileURL(path.join(image,'node_modules/@huggingface/tokenizers/dist/tokenizers.mjs')).href);
const sha=b=>createHash('sha256').update(b).digest('hex'),pause=ms=>new Promise(r=>setTimeout(r,ms));
const args=process.argv.slice(2),output=path.resolve(args.find(a=>!a.startsWith('--'))??''),flag=name=>args.some(a=>a==='--'+name),option=name=>args.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3)??null;
if(!args.find(a=>!a.startsWith('--'))||args.some(a=>a.startsWith('--')&&!/^--(subjects=.+|allow-dirty|prepare-only|no-triptych)$/.test(a)))throw Error('Usage: finish-master.mjs NEW_OUTPUT_DIR [--subjects=a,b] [--allow-dirty] [--prepare-only] [--no-triptych]');
await fs.mkdir(output);
// Subject table: every field a human can check against the record and the painted master.
const CRABS={crab:{name:'Crab',materials:'hard chitin carapace and jointed legs with a matte mineral sheen'},'coconut-crab':{name:'Coconut Crab',materials:'heavy dark chitin plates, thick jointed legs and massive claws with a dull sheen'},'freshwater-crab':{name:'Freshwater Crab',materials:'smooth olive-brown chitin carapace and slender jointed legs with a soft wet sheen'},'mud-crab':{name:'Mud Crab',materials:'broad mottled chitin carapace, stout legs and heavy claws with a muddy matte finish'},'vent-crab':{name:'Vent Crab',materials:'pale bristled chitin carapace and long hairy legs with a chalky matte finish'}};
const CRAB_COUNTS='one carapace, exactly one carapace; eight walking legs, four near and four far, exactly eight legs; two claws, exactly two claws; two stalked eyes, exactly two eyes';
const subjects=(option('subjects')?.split(',')??Object.keys(CRABS)).map(id=>{if(!CRABS[id])throw Error('Unknown subject '+id);const fit=path.join(root,'audits/ANATOMY_COMPLETION_20260917/crab-fits-03',id);return {id,fit,...CRABS[id],family:'brachyuran crab',realm:'land',counts:CRAB_COUNTS};});
const receipt={schema:'cf.creature-finish-run.v1',status:'FAIL',startedAt:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),dirtyDiagnostic:false,subjects:[],sources:[],requests:[],events:[],qualityAccepted:false};
let release,server,cdp,sessionId,compilerDir;
try{
  const dirty=execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).trim();
  if(dirty){if(!flag('allow-dirty'))throw Error('Native finish requires committed unchanged tracked source (or --allow-dirty for a diagnostic)');receipt.dirtyDiagnostic=true;receipt.dirtyFiles=dirty.split('\n');}
  // Compiler: the same bundled kit compiler the landfall proofs use, built fresh into this output (it takes the workspace lease itself, so it runs before ours).
  compilerDir=path.join(output,'compiler');try{execFileSync(process.execPath,[path.join(root,'port/v2/tools/landfall-snapshot/kit-export.mjs'),compilerDir],{cwd:root,stdio:['ignore','pipe','pipe']});}catch(error){throw Error('kit-export failed: '+String(error.stderr??error.stdout??error));}
  release=acquireWorkspaceLock('R9 creature finish');
  const pin=JSON.parse(await fs.readFile(path.join(image,'model-manifest.json'),'utf8')),cacheDir=path.join(DEFAULT_CACHE_ROOT,pin.modelId.replace('/','--'),pin.revision);
  receipt.model={modelId:pin.modelId,revision:pin.revision,manifestSha256:sha(await fs.readFile(path.join(image,'model-manifest.json')))};
  const compiler=await import(pathToFileURL(path.join(compilerDir,'kit-compiler.mjs')).href),kit=await fs.readFile(path.join(root,'ART_KIT.md'),'utf8');
  receipt.kitSha256=sha(kit);
  const tokenizer=new Tokenizer(JSON.parse(await fs.readFile(path.join(cacheDir,'tokenizer/tokenizer.json'),'utf8')),JSON.parse(await fs.readFile(path.join(cacheDir,'tokenizer/tokenizer_config.json'),'utf8')));
  await fs.mkdir(path.join(output,'inputs'));
  const triptychFile=path.join(root,'audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png');let triptych=null;
  if(!flag('no-triptych')){const png=readPng(await fs.readFile(triptychFile));const w=png.width-png.width%16,h=png.height-png.height%16;const rgba=new Uint8Array(w*h*4);for(let y=0;y<h;y++)rgba.set(png.data.subarray(y*png.width*4,(y*png.width+w)*4),y*w*4);await fs.writeFile(path.join(output,'inputs/triptych.rgba'),rgba);triptych={url:'/inputs/triptych.rgba',sha256:sha(rgba),width:w,height:h};receipt.triptych={file:path.relative(root,triptychFile),...triptych};}
  const recipes=[];
  for(const s of subjects){
    const record=JSON.parse(await fs.readFile(path.join(s.fit,'record.json'),'utf8')),masterFile=path.join(root,record.source),masterBytes=await fs.readFile(masterFile);
    if(sha(masterBytes)!==record.geometry.cutoutAssetHash)throw Error('Painter master hash mismatch for '+s.id);
    const master=readPng(masterBytes);if(master.width!==record.geometry.width||master.height!==record.geometry.height)throw Error('Master dimensions differ from record for '+s.id);
    const W=Math.ceil(master.width/16)*16,H=Math.ceil(master.height/16)*16,rgba=new Uint8Array(W*H*4);
    for(let y=0;y<master.height;y++)rgba.set(master.data.subarray(y*master.width*4,(y+1)*master.width*4),y*W*4);
    await fs.writeFile(path.join(output,'inputs',s.id+'.rgba'),rgba);
    const job=compiler.compileCreatureFinishV1(kit,{creatureId:s.id,name:s.name,family:s.family,realm:s.realm,materials:s.materials,counts:s.counts,recordRecipeHash:record.recipeHash,cutoutAssetHash:record.geometry.cutoutAssetHash,identitySeed:record.identity.seed},{url:'/inputs/'+s.id+'.rgba',sha256:sha(rgba),width:W,height:H},{width:W,height:H},triptych??undefined);
    const tokens=prepareKitTextTokens(tokenizer,job.finisherPrompt);
    await fs.writeFile(path.join(output,s.id+'-prompt.txt'),job.finisherPrompt);
    recipes.push(job);
    receipt.subjects.push({id:s.id,fit:path.relative(root,s.fit),master:path.relative(root,masterFile),masterSha256:sha(masterBytes),width:master.width,height:master.height,padded:{width:W,height:H},recordRecipeHash:record.recipeHash,seed:job.seed,promptSha256:sha(job.finisherPrompt),promptTokens:tokens.tokenCount,status:'PREPARED'});
  }
  await fs.writeFile(path.join(output,'recipes.json'),JSON.stringify(recipes,null,2)+'\n');
  if(flag('prepare-only'))throw Object.assign(Error('prepare-only'),{prepared:true});
  receipt.modelVerification=(await fetchModel({manifest:pin,cacheDir,verifyOnly:true})).receipt;
  const routes=new Map([['/recipes.json',path.join(output,'recipes.json')],['/creature-finish-client.mjs',path.join(image,'creature-finish-client.mjs')],['/stage-worker.mjs',path.join(image,'creature-stage-worker.mjs')]]);
  for(const name of ['kit-worker-engine.mjs','kit-worker-expansion.mjs','kit-engine-math.mjs','kit-contact-math.mjs','kit-weather-math.mjs','pipeline-math.mjs','gpu-profile.mjs','denoiser-shapes.mjs','browser-variant-plan.json'])routes.set('/'+name,path.join(image,name));
  for(const name of await fs.readdir(path.join(output,'inputs')))routes.set('/inputs/'+name,path.join(output,'inputs',name));
  for(const row of pin.files)routes.set('/model/'+row.path,path.join(cacheDir,row.path));
  const dist=path.join(image,'node_modules/onnxruntime-web/dist');for(const name of await fs.readdir(dist))if(/\.(mjs|wasm)$/.test(name))routes.set('/node_modules/onnxruntime-web/dist/'+name,path.join(dist,name));
  routes.set('/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs',path.join(image,'node_modules/@huggingface/tokenizers/dist/tokenizers.mjs'));
  for(const [url,file]of routes)if(!url.startsWith('/model/')&&!url.startsWith('/node_modules/')){const bytes=await fs.readFile(file);receipt.sources.push({url,file:path.relative(root,file),bytes:bytes.length,sha256:sha(bytes)});}
  const html='<!doctype html><meta charset="utf-8"><title>Celestial Frontier — R9 creature finish</title><style>body{background:#121918;color:#eef1ec;font:16px system-ui;margin:24px}</style><h1>R9 creature finish</h1><p id="status">Preparing</p><script type="module" src="/creature-finish-client.mjs"></script>';
  server=http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');if(receipt.requests.length<4000)receipt.requests.push({method:req.method,path:url.pathname,range:req.headers.range??null});
    for(const [k,v]of Object.entries({'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; worker-src 'self'; img-src 'self' blob:; connect-src 'self'"}))res.setHeader(k,v);
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
  cdp=await openChromiumCdp({label:'R9 creature finish',userDataPrefix:'cf-creature-finish-',commandTimeoutMs:45000,onEvent:e=>{if(['Runtime.exceptionThrown','Inspector.targetCrashed'].includes(e.method)&&receipt.events.length<200)receipt.events.push(e);}});
  receipt.browser=cdp.browser;receipt.browserPid=cdp.pid;
  const {targetId}=await cdp.send('Target.createTarget',{url:`http://127.0.0.1:${server.address().port}/`});({sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true}));await cdp.send('Runtime.enable',{},sessionId);
  const evaluate=async(expression,awaitPromise=true)=>{const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise,returnByValue:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
  const ready=performance.now()+15000;while(!await evaluate('!!window.creatureFinish')){if(performance.now()>ready)throw Error('Finish page did not initialize');await pause(100);}
  await evaluate('void window.creatureFinish.start()',false);
  const deadline=performance.now()+1_810_000;let lastSequence=-1,state;
  while(true){
    state=await evaluate('window.creatureFinish.snapshot()');
    if(state.last?.sequence!==lastSequence){lastSequence=state.last?.sequence;console.log(JSON.stringify(state.last));await fs.writeFile(path.join(output,'progress.json'),JSON.stringify(state,null,2)+'\n');}
    if(['complete','failed'].includes(state.status))break;if(performance.now()>deadline)throw Error('Native finish deadline');
    await pause(3000);
  }
  const report=await evaluate('window.creatureFinish.report()');receipt.page={status:report.status,error:report.error,events:report.events.slice(-40),results:report.results};
  if(state.status!=='complete')throw Error('Finish page failed: '+report.error);
  // Node-side verification and evidence per subject: crop the padding, re-check alpha/key against the painter master, gate.
  for(const [index,s] of subjects.entries()){
    const row=receipt.subjects[index],result=report.results[index];if(result?.creatureId!==s.id)throw Error('Result order mismatch for '+s.id);
    const grab=async kind=>Buffer.from(await evaluate(`window.creatureFinish.artifact(${index},${JSON.stringify(kind)})`),'base64');
    const finishedPadded=readPng(await grab('finished')),master=readPng(await fs.readFile(path.join(root,row.master)));
    const cropped=new Uint8Array(master.width*master.height*4);for(let y=0;y<master.height;y++)cropped.set(finishedPadded.data.subarray(y*finishedPadded.width*4,(y*finishedPadded.width+master.width)*4),y*master.width*4);
    const finished={width:master.width,height:master.height,data:cropped},alpha=alphaConservation(master,finished);
    if(alpha.status!=='PASS')throw Error('Worker output broke silhouette/key for '+s.id+': '+JSON.stringify(alpha));
    const finishedBytes=writePng(master.width,master.height,cropped);
    await fs.writeFile(path.join(output,s.id+'-finished.png'),finishedBytes,{flag:'wx'});
    for(const [kind,name] of [['raw','finished-raw'],['composite','composite'],['protectionMask','protection']])await fs.writeFile(path.join(output,s.id+'-'+name+'.png'),await grab(kind),{flag:'wx'});
    const labels=loadLabels(path.join(s.fit,'labels.png')),conservation=conservationReport({master,finished,labels});
    await fs.writeFile(path.join(output,s.id+'-conservation.json'),JSON.stringify(conservation,null,2)+'\n');
    Object.assign(row,{status:conservation.status,finishedSha256:sha(finishedBytes),alpha,masking:result.masking,measurements:result.measurements,elapsedMs:result.elapsedMs,gates:{alpha:conservation.gates.alpha.status,counts:conservation.gates.counts.status,gradient:conservation.gates.gradient.status,gradientRatio:conservation.gates.gradient.ratio},ssim:conservation.reported.ssim});
    const finishedReceipt={schema:'cf.creature-finished-original.v1',creatureId:s.id,recordRecipeHash:row.recordRecipeHash,cutoutAssetHash:row.masterSha256,finishedSha256:row.finishedSha256,seed:row.seed,finisherStrength:.35,finisherSteps:1,interiorErosionPixels:recipes[index].interiorErosionPixels,backgroundGrey:recipes[index].backgroundGrey,promptSha256:row.promptSha256,model:receipt.model,kitSha256:receipt.kitSha256,triptych:receipt.triptych?.sha256??null,head:receipt.head,dirtyDiagnostic:receipt.dirtyDiagnostic,conservation:row.gates,qualityAccepted:false};
    await fs.writeFile(path.join(output,s.id+'-finished.json'),JSON.stringify(finishedReceipt,null,2)+'\n');
    console.log(JSON.stringify({id:s.id,status:row.status,gates:row.gates,ssim:row.ssim,elapsedMs:row.elapsedMs}));
  }
  for(const row of receipt.sources)if(sha(await fs.readFile(path.join(root,row.file)))!==row.sha256)throw Error('Runtime source changed: '+row.file);
  receipt.status=receipt.subjects.every(r=>r.status==='PASS')?'PASS':'FAIL';
}catch(error){if(error?.prepared)receipt.status='PREPARED';else{receipt.status='FAIL';receipt.error=String(error.stack??error);console.error(receipt.error);}}
finally{
  try{if(cdp&&sessionId)await cdp.send('Runtime.evaluate',{expression:'window.creatureFinish?.dispose()'},sessionId);}catch{}
  try{await cdp?.close();}catch(error){receipt.status='FAIL';receipt.cleanupError=String(error);}
  if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  release?.();receipt.finishedAt=new Date().toISOString();await fs.writeFile(path.join(output,'result.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({status:receipt.status,output,error:receipt.error??null}));if(!['PASS','PREPARED'].includes(receipt.status))process.exitCode=1;
