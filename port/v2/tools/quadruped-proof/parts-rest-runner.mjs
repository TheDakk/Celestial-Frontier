import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import http from 'node:http';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';import {rolldown} from 'rolldown';
import {openChromiumCdp} from '../browsercdp.mjs';import {acquireWorkspaceLock} from '../workspacelock.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../../..'),output=path.resolve(process.argv[2]);
if(!process.argv[2]||fs.existsSync(output))throw Error('New output directory required');
const dirty=execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(s=>s&&s!=='?? .DS_Store');if(dirty.length)throw Error('Commit scoped source before native rest proof');
fs.mkdirSync(output);const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-parts-rest-')),sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),report={source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),status:'RUNNING',errors:[]};
let server,browser,release;
const remember=p=>{const b=fs.readFileSync(p);sources.set(p,{path:path.relative(root,p),sha256:sha(b)});};
try{
 release=acquireWorkspaceLock('C2 native parts rest proof');
 const bundle=await rolldown({input:path.join(here,'parts-rest-entry.mjs'),platform:'browser',plugins:[{name:'source-hashes',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())remember(id);}}]});try{await bundle.write({dir:scratch,entryFileNames:'bundle.js',chunkFileNames:'chunk-[hash].js',format:'es'});}finally{await bundle.close();}
 const assets={'record.json':'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json','master.png':'audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png','keyed.png':'audits/C2_PARTS_ATLAS_20260913/civet-v2/keyed.png','binding.json':'audits/C2_PARTS_ATLAS_20260913/civet-patched/binding.json','atlas.png':'audits/C2_PARTS_ATLAS_20260913/civet-patched/atlas/civet.png'};
 for(const [name,relative]of Object.entries(assets)){const p=path.join(root,relative);remember(p);fs.copyFileSync(p,path.join(scratch,name));}remember(path.join(here,'parts-rest-runner.mjs'));
 fs.writeFileSync(path.join(scratch,'index.html'),'<html><head><style>html,body{margin:0;background:#24282b}</style></head><body><script type="module" src="bundle.js"></script></body></html>');
 const files=new Map(fs.readdirSync(scratch).map(n=>[n,fs.readFileSync(path.join(scratch,n))]));
 server=http.createServer((req,res)=>{const n=new URL(req.url,'http://127.0.0.1').pathname.slice(1)||'index.html',b=files.get(n);if(!b){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':n.endsWith('.js')?'text/javascript':n.endsWith('.html')?'text/html':n.endsWith('.json')?'application/json':'image/png'});res.end(b);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await openChromiumCdp({label:'C2 native parts rest comparison',userDataPrefix:'cf-parts-rest',commandTimeoutMs:60000,onEvent:e=>{if(e.method==='Runtime.exceptionThrown')report.errors.push(e.params.exceptionDetails);}});report.browser=browser.browser;
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'}),{sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true}),send=(m,p={})=>browser.send(m,p,sessionId);
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1254,height:1254,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port});
 const deadline=performance.now()+60000;for(;;){const r=await send('Runtime.evaluate',{expression:'window.cfPartsRest',returnByValue:true});const state=r.result?.value;if(state?.status==='PASS'||state?.status==='FAIL'){report.observation=state;break;}if(performance.now()>deadline)throw Error('Readiness timeout');await new Promise(r=>setTimeout(r,100));}
 const image=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,'native-rest.png'),Buffer.from(image.data,'base64'));report.status=report.observation.status;if(report.status!=='PASS'||report.errors.length)process.exitCode=1;
 for(const[p,r]of sources)if(sha(fs.readFileSync(p))!==r.sha256)throw Error('Source changed: '+r.path);
}catch(e){report.status='FAIL';report.error=String(e.stack??e);process.exitCode=1;}
finally{await browser?.close();if(server)await new Promise(r=>server.close(r));release?.();report.sources=[...sources.values()];fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');fs.rmSync(scratch,{recursive:true,force:true});}
console.log(JSON.stringify({status:report.status,observation:report.observation,error:report.error}));
