import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import crypto from 'node:crypto';import {spawnSync,execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {requireTenSecondMedia} from './capture-contract.mjs';
import {openChromiumCdp} from '../browsercdp.mjs';import {acquireWorkspaceLock} from '../workspacelock.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../../..'),out=path.resolve(process.argv[2]);
if(fs.existsSync(out))throw Error('Evidence directory must be new');
const status=execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd:repo,encoding:'utf8'}).trim().split('\n').filter(x=>x&&x!=='?? .DS_Store');if(status.length)throw Error('Commit scoped source before native proof: '+status.join('\n'));
fs.mkdirSync(out);const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),report={status:'RUNNING',source:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),errors:[],captures:[]};
const persist=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');persist();let browser,server,release;
try{
 release=acquireWorkspaceLock('bounded quadruped 2D proof');
 const built=spawnSync(process.execPath,[path.join(here,'build.mjs'),path.join(out,'build')],{cwd:repo,encoding:'utf8',timeout:60000});fs.writeFileSync(path.join(out,'build.log'),(built.stdout??'')+(built.stderr??''));if(built.status!==0)throw Error('Build failed; no browser successor');
 const build=path.join(out,'build'),manifest=JSON.parse(fs.readFileSync(path.join(build,'manifest.json'))),files=new Map(manifest.files.map(r=>[r.path,r]));
 const verify=()=>{for(const row of manifest.sources){const b=fs.readFileSync(path.join(repo,row.path));if(sha(b)!==row.sha256)throw Error('Source changed: '+row.path);}};verify();
 server=http.createServer((req,res)=>{try{const name=new URL(req.url,'http://127.0.0.1').pathname.slice(1)||'index.html',row=files.get(name);if(!row)throw Error('not listed');const b=fs.readFileSync(path.join(build,name));if(sha(b)!==row.sha256)throw Error('hash');res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html':name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'image/png','Cache-Control':'no-store'});res.end(b);}catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));report.origin='http://127.0.0.1:'+server.address().port;
 browser=await openChromiumCdp({label:'quadruped ten-second 2D proof',userDataPrefix:'cf-quad-proof',commandTimeoutMs:60000,onEvent:event=>{if(event.method==='Runtime.exceptionThrown')report.errors.push(event.params.exceptionDetails);}});report.browser=browser.browser;
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'}),{sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});
 const send=(method,params={})=>browser.send(method,params,sessionId),evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1536,height:850,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:report.origin});
 const deadline=performance.now()+60000;for(;;){const status=await evaluate('window.cfQuad?.state.status');if(status==='FAIL'){report.observation=await evaluate('window.cfQuad.state');throw Error('Entry refused: '+JSON.stringify(report.observation.errors));}if(status==='READY')break;if(performance.now()>deadline)throw Error('Readiness deadline');await new Promise(resolve=>setTimeout(resolve,100));}
 const observation=await evaluate('window.cfQuad.report()');
 for(const row of observation.specimens){fs.writeFileSync(path.join(out,row.id+'-cutout.png'),Buffer.from(row.cutoutPNG,'base64'));delete row.cutoutPNG;fs.writeFileSync(path.join(out,row.id+'-resolved-anatomy.json'),JSON.stringify(row.record,null,2)+'\n');}
 report.observation=observation;persist();
 for(const id of ['civet','fox','procedural']){
  await evaluate(`window.cfQuad.select(${JSON.stringify(id)})`);
  // Real trusted input owns the audio gesture, as in the ordinary game.
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:105,y:32,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:105,y:32,button:'left',clickCount:1});
  const result=await evaluate('window.cfQuad.capturePromise');fs.writeFileSync(path.join(out,id+'-10s.webm'),Buffer.from(result.video,'base64'));delete result.video;
  const media=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,codec_type','-of','json',path.join(out,id+'-10s.webm')],{encoding:'utf8'}));
  result.encodedMedia=media;report.captures.push(result);persist();requireTenSecondMedia(Number(media.format.duration));
  for(const [label,time]of [['rest',0],['anticipation',3484],['strike',4276],['hit',5525]]){await evaluate(`window.cfQuad.frame(${time})`);const {data}=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:58,width:1536,height:740,scale:1}});fs.writeFileSync(path.join(out,id+'-'+label+'.png'),Buffer.from(data,'base64'));}
 }
 verify();report.status=report.observation.specimens.some(s=>s.mode!=='DEFORMABLE MESH')?'REVIEW_FALLBACK':'REVIEW';
 if(report.errors.length)throw Error('Browser errors');
}catch(error){report.status='FAIL';report.error=String(error.stack??error);process.exitCode=1;}
finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));release?.();report.closed=true;persist();}
console.log(JSON.stringify({status:report.status,source:report.source,out,captures:report.captures.map(({id,mode,fps,updateP95Ms})=>({id,mode,fps,updateP95Ms})),error:report.error}));
