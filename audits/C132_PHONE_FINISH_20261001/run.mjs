/** One bounded Mac WebGPU evaluation; unchanged conservation imported from its owner. */
import fs from 'node:fs/promises';import {createReadStream}from'node:fs';import http from'node:http';import path from'node:path';import {createHash}from'node:crypto';import {createRequire}from'node:module';import {execFileSync}from'node:child_process';
import {openChromiumCdp}from'../../port/v2/tools/browsercdp.mjs';import {acquireWorkspaceLock}from'../../port/v2/tools/workspacelock.mjs';import {finishConservation}from'../../port/v2/tools/painted-creature/finish-conservation.mjs';import {padCreatureFinishCanvas,creatureFinishMask,cropCreatureFinishCanvas}from'../../tools/local-image-generation/creature-finish-math.mjs';
import {conservationTerminal}from'./proof-contract.mjs';
import {verifyInputPins}from'./verify-pins.mjs';
const dir=import.meta.dirname,root=path.resolve(dir,'../..'),output=path.resolve(process.argv[2]??'');if(process.argv.length!==3||!output.startsWith(dir+'/'))throw Error('Supply a new output below this audit');await fs.mkdir(output);
const require=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp'),sha=b=>createHash('sha256').update(b).digest('hex'),sanitize=s=>String(s).replaceAll(root,'~/Projects/celestial-frontier-openai-mac').replace(/\/Users\/[^/\s]+/g,'~');
const receipt={status:'FAIL',head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),qualityAccepted:false,mode:'mac',phoneProbe:false,rows:[],requests:[]};let release,server,cdp,verifyPins;
try{
 release=acquireWorkspaceLock('C132 small finisher native candidate');
 const pin=JSON.parse(await fs.readFile(path.join(dir,'prepared-manifest.json'))),inputs=JSON.parse(await fs.readFile(path.join(dir,'prepared/inputs.json')));
 if(pin.mode!=='mac'||inputs.mode!=='mac'||!Array.isArray(pin.runtimeFiles)||!pin.runtimeFiles.length)throw Error('Mac proof mode/runtime inventory required; phone probe is separate');
 receipt.pinSha256=sha(await fs.readFile(path.join(dir,'prepared-manifest.json')));receipt.phoneModelBytes=pin.phoneModelBytes;
 verifyPins=async(phase)=>{
  await verifyInputPins({root,dir,pin,manifestSha256:receipt.pinSha256,phase,head:receipt.head,readHead:()=>execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()});
  receipt[phase+'Integrity']='PASS';
 };
 await verifyPins('start');
 const routes=new Map([['/client.mjs',path.join(dir,'prepared/client.mjs')],['/inputs.json',path.join(dir,'prepared/inputs.json')]]);
 for(const m of pin.models){const route='/models/'+m.route;if(routes.has(route))throw Error('Duplicate model route');routes.set(route,path.join(dir,'model-cache',m.file));}
 for(const p of pin.runtimeFiles){if(routes.has(p.route))throw Error('Duplicate runtime route');routes.set(p.route,path.join(root,p.file));}
 for(const s of inputs.subjects)for(const kind of['master','labels'])routes.set(s[kind].url,path.join(dir,'prepared',s.id+'-'+kind+'.rgba'));
 receipt.routes=[...routes.keys()].sort();
 const allowed=new Set(['embedding.f32',...inputs.subjects.flatMap(s=>[s.id+'-finished.png',s.id+'-reconstruction.png'])]);
 server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1'),u=url.pathname;receipt.requests.push({method:req.method,path:u,search:url.search});for(const[k,v]of Object.entries({'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'no-store'}))res.setHeader(k,v);
  if(url.search||url.hash){res.writeHead(403).end();return;}
  if(req.method==='POST'){const name=u.slice('/output/'.length);if(!u.startsWith('/output/')||!allowed.has(name)){res.writeHead(403).end();return;}const chunks=[];let n=0;for await(const b of req){n+=b.length;if(n>20*1024*1024)throw Error('Output too large');chunks.push(b);}await fs.writeFile(path.join(output,name),Buffer.concat(chunks),{flag:'wx'});res.end('OK');return;}
  if(req.method!=='GET'){res.writeHead(405).end();return;}if(u==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>C132 phone finisher candidate</title><script type="module" src="/client.mjs"></script>');return;}const file=routes.get(u);if(!file){res.writeHead(404).end();return;}const stat=await fs.stat(file);res.setHeader('Content-Length',stat.size);res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.wasm')?'application/wasm':file.endsWith('.json')?'application/json':'application/octet-stream');const stream=createReadStream(file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch(e){receipt.serverError??=sanitize(e);res.writeHead(500).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));cdp=await openChromiumCdp({label:'C132 small finisher native candidate',userDataPrefix:'cf-c132-phone-',commandTimeoutMs:45000});receipt.browser=cdp.browser;
 const {targetId}=await cdp.send('Target.createTarget',{url:`http://127.0.0.1:${server.address().port}/`}),{sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});const evaluate=async expression=>{const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const ready=performance.now()+20000;while(!await evaluate('!!window.phoneFinish')){if(performance.now()>ready)throw Error('Client initialization');await new Promise(r=>setTimeout(r,100));}await evaluate('void phoneFinish.start()');
 const deadline=performance.now()+600000;let previous='';while(true){const state=await evaluate('phoneFinish.snapshot()'),brief=JSON.stringify({status:state.status,stage:state.stage,rows:state.rows.length,error:state.error});if(brief!==previous){console.log(brief);previous=brief;await fs.writeFile(path.join(output,'progress.json'),JSON.stringify(state,null,2)+'\n');}if(['complete','failed'].includes(state.status)){Object.assign(receipt,state);break;}if(performance.now()>deadline)throw Error('Native deadline');await new Promise(r=>setTimeout(r,1000));}
 if(receipt.status==='complete'){const embedding=await fs.readFile(path.join(output,'embedding.f32'));if(embedding.length!==77*768*4||sha(embedding)!==receipt.embedding?.sha256||receipt.embedding.promptSha256!==receipt.promptSha256)throw Error('Precomputed embedding output identity');}
 for(const row of receipt.rows){const s=inputs.subjects.find(s=>s.id===row.id);if(!s)throw Error('Unknown output subject');const a=await fs.readFile(path.join(dir,'prepared',row.id+'-master.rgba')),l=await fs.readFile(path.join(dir,'prepared',row.id+'-labels.rgba')),b=await fs.readFile(path.join(output,row.id+'-finished.png')),reconstruction=await fs.readFile(path.join(output,row.id+'-reconstruction.png'));if(sha(b)!==row.sha256||sha(reconstruction)!==row.reconstructionSha256)throw Error('Artifact hash');const {data:rgba,info}=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});if(info.width!==s.width||info.height!==s.height)throw Error('Output canvas drift');const work=padCreatureFinishCanvas(a,l,s.width,s.height),mask=creatureFinishMask(work.master,work.labels,work.width,work.height);let protectedChanges=0,changedPixels=0;
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const k=(y*s.width+x)*4,changed=[0,1,2].some(c=>a[k+c]!==rgba[k+c]);if(changed)changedPixels++;if(!mask.editable[y*work.width+x]&&changed)protectedChanges++;}
  row.conservation=finishConservation(a,rgba,l,s.width,s.height);row.protectedChanges=protectedChanges;row.changedPixels=changedPixels;row.status=row.conservation.status==='PASS'&&!protectedChanges?'PASS':'FAIL';await fs.writeFile(path.join(output,row.id+'-receipt.json'),JSON.stringify(row,null,2)+'\n',{flag:'wx'});
 }
 receipt.status=conservationTerminal(receipt.status,receipt.rows,inputs.subjects.map(s=>s.id),[receipt.serverError,...(receipt.cleanupErrors??[])].filter(Boolean));
}catch(e){receipt.status='LEAF_RED';receipt.error=sanitize(e.stack??e);console.error(receipt.error);}finally{
 try{await cdp?.close();}catch(e){receipt.cleanupError=sanitize(e);}
 try{if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}}catch(e){receipt.serverError??=sanitize(e);}
 try{await verifyPins?.('end');}catch(e){receipt.integrityError=sanitize(e);}
 try{release?.();}catch(e){receipt.cleanupError??=sanitize(e);}
 if(receipt.cleanupError||receipt.serverError||receipt.integrityError)receipt.status='LEAF_RED';
 await fs.writeFile(path.join(output,'result.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({status:receipt.status,error:receipt.error,rows:receipt.rows.length,qualityAccepted:false}));if(receipt.status!=='CONSERVATION_PASS')process.exitCode=1;
