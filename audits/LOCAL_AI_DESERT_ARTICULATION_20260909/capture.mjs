import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {openChromiumCdp} from '../../port/v2/tools/browsercdp.mjs';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
const run=promisify(execFile),out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..');
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,m)=>{if(!v)throw Error(m);};
const receipt={schema:'cf.articulated-motion-preview.v1',status:'FAIL',startedAt:new Date().toISOString(),width:1024,height:576,fps:24,frames:288,durationSeconds:12,scope:'Scene-specific painted cutout rigs: walking grazer, flying bat, running lizard, rooted plants. Image-tool repaired background; no automatic local video generation or game integration',sources:[],browserEvents:[],frameHashes:[],cleanup:{}};
await fs.writeFile(path.join(out,'start.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
let release,server,cdp,encoder,encoderDone,log='';
function assessLoop(a,b,end){need(a!==b,'Animation has no visible pixel change');need(a===end,'Loop endpoint differs');}
try{
release=acquireWorkspaceLock('local desert articulated motion capture');
const imagePath=path.join(root,'audits/LOCAL_AI_DESERT_TEST_20260909/raw-output.png'),htmlPath=path.join(out,'index.html');
for(const file of [fileURLToPath(import.meta.url),htmlPath,imagePath,...['background-clean.png','puppet.mjs','plants.mjs','stage.mjs','grazer.mjs','small-creatures.mjs'].map(name=>path.join(out,name))]){const b=await fs.readFile(file);receipt.sources.push({path:path.relative(root,file),bytes:b.length,sha256:sha(b)});}
need(receipt.sources[2].sha256==='4a2acc4a36809347e1948a46d5d839cfc60989b9245c682e102da7c0b0a52a65','Source painting changed');
const routes=new Map([['/',{bytes:await fs.readFile(htmlPath),type:'text/html'}],['/LOCAL_AI_DESERT_TEST_20260909/raw-output.png',{bytes:await fs.readFile(imagePath),type:'image/png'}]]);
for(const name of ['background-clean.png','puppet.mjs','plants.mjs','stage.mjs','grazer.mjs','small-creatures.mjs'])routes.set('/'+name,{bytes:await fs.readFile(path.join(out,name)),type:name.endsWith('.png')?'image/png':'text/javascript'});
server=http.createServer((req,res)=>{const found=routes.get(new URL(req.url,'http://127.0.0.1').pathname);if(req.method!=='GET'||!found){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',found.type);res.setHeader('Cache-Control','no-store');res.end(found.bytes);});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
cdp=await openChromiumCdp({label:'CF articulated living desert',userDataPrefix:'cf-desert-articulated-',commandTimeoutMs:30000,onEvent:e=>{if(['Runtime.exceptionThrown','Inspector.targetCrashed'].includes(e.method))receipt.browserEvents.push(e);}});receipt.browser=cdp.browser;
const {targetId}=await cdp.send('Target.createTarget',{url:`http://127.0.0.1:${server.address().port}/`});const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});await cdp.send('Runtime.enable',{},sessionId);
const evaluate=async expression=>{const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
for(let i=0;!await evaluate('!!window.desertMotion?.ready');i++){if(i>150)throw Error('Motion page did not initialize');await new Promise(r=>setTimeout(r,100));}
const frame=async time=>{const value=await evaluate(`(()=>{window.desertMotion.draw(${time});return document.getElementById('scene').toDataURL('image/png');})()`);need(value.startsWith('data:image/png;base64,'),'PNG missing');return Buffer.from(value.slice(value.indexOf(',')+1),'base64');};
const first=await frame(0),quarter=await frame(1.5),end=await frame(12);assessLoop(sha(first),sha(quarter),sha(end));
const controls=[];for(const [name,args]of [['frozen',[sha(first),sha(first),sha(end)]],['broken-loop',[sha(first),sha(quarter),sha(quarter)]]]){let refused=false;try{assessLoop(...args);}catch{refused=true;}need(refused,'Loop control missed '+name);controls.push({name,refused});}assessLoop(sha(first),sha(quarter),sha(end));receipt.loop={first:sha(first),quarter:sha(quarter),end:sha(end),exactEndpointMatch:true,controls,restored:true};
await fs.writeFile(path.join(out,'frame-000.png'),first,{flag:'wx'});await fs.writeFile(path.join(out,'frame-036.png'),quarter,{flag:'wx'});
receipt.articulationSamples=[];for(const time of [0,.25,.5,1,1.5,2.5,3,4.5,6,8,9,11.5])receipt.articulationSamples.push({time,pose:await evaluate(`window.articulation.diagnostics(${time})`)});
for(const [name,time]of [['frame-012.png',.5],['frame-060.png',2.5],['frame-108.png',4.5],['frame-192.png',8]])await fs.writeFile(path.join(out,name),await frame(time),{flag:'wx'});
await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},sessionId);
await new Promise(r=>setTimeout(r,100));need(await evaluate('window.desertMotion.playing===false'),'Reduced motion did not pause');
await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},sessionId);
receipt.mobileLayout=await evaluate(`(()=>{const b=document.getElementById('toggle'),r=b.getBoundingClientRect(),c=document.getElementById('scene').getBoundingClientRect();return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,button:{x:r.x,y:r.y,width:r.width,height:r.height},canvas:{width:c.width,height:c.height},paused:!window.desertMotion.playing};})()`);
need(receipt.mobileLayout.scrollWidth<=receipt.mobileLayout.width&&receipt.mobileLayout.button.height>=44,'Preview small viewport geometry');
const click=async()=>{const r=await evaluate('(()=>{const r=document.getElementById("toggle").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...r},sessionId);await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...r},sessionId);};
await click();need(await evaluate('window.desertMotion.playing===true'),'Play click did not start');await click();need(await evaluate('window.desertMotion.playing===false'),'Pause click did not stop');receipt.previewControls={reducedMotionPauses:true,trustedPlayPause:true};
const shot=await cdp.send('Page.captureScreenshot',{format:'png'},sessionId);await fs.writeFile(path.join(out,'phone-preview.png'),Buffer.from(shot.data,'base64'),{flag:'wx'});
const args=['-hide_banner','-loglevel','warning','-f','image2pipe','-framerate','24','-vcodec','png','-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'desert-articulated.mp4')];
encoder=spawn('/opt/homebrew/bin/ffmpeg',args,{stdio:['pipe','ignore','pipe']});encoder.stderr.on('data',b=>log+=b.toString());encoder.stdin.on('error',()=>{});encoderDone=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('exit',(code,signal)=>code===0?resolve():reject(Error('Encoder exit '+code+' '+signal)));});encoderDone.catch(()=>{});
for(let i=0;i<288;i++){const png=await frame(i/24);receipt.frameHashes.push({frame:i,seconds:i/24,sha256:sha(png)});if(!encoder.stdin.write(png))await once(encoder.stdin,'drain');if(i%72===0)console.log('Captured '+i+'/288 frames');}
encoder.stdin.end();await encoderDone;receipt.encoderComplete=true;
const video=path.join(out,'desert-articulated.mp4');
const probe=JSON.parse((await run('/opt/homebrew/bin/ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height,nb_frames,r_frame_rate,duration','-of','json',video])).stdout);receipt.videoProbe=probe;const stream=probe.streams[0];need(stream.width===1024&&stream.height===576&&stream.nb_frames==='288'&&stream.r_frame_rate==='24/1'&&Number(stream.duration)===12,'Encoded video contract');
await run('/opt/homebrew/bin/ffmpeg',['-hide_banner','-loglevel','warning','-i',video,'-filter_complex','fps=15,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',path.join(out,'preview.gif')],{maxBuffer:2*1024*1024});
receipt.outputs=[];for(const name of ['desert-articulated.mp4','preview.gif']){const b=await fs.readFile(path.join(out,name));receipt.outputs.push({path:name,bytes:b.length,sha256:sha(b)});}
need(receipt.browserEvents.length===0,'Observed browser error');receipt.status='PREVIEW_RENDERED';
}catch(e){receipt.error=String(e.stack??e);process.exitCode=1;}
finally{
const fail=(key,e)=>{receipt[key]=String(e.stack??e);receipt.status='FAIL';process.exitCode=1;};
if(encoder&&!receipt.encoderComplete){encoder.kill('SIGTERM');try{await encoderDone;}catch(e){receipt.encoderStop=String(e);}}
try{await cdp?.close();receipt.cleanup.browserClosed=true;}catch(e){fail('browserCleanupError',e);}
try{if(server){server.closeAllConnections();await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}receipt.cleanup.serverClosed=true;}catch(e){fail('serverCleanupError',e);}
receipt.sourcesUnchanged=true;for(const row of receipt.sources){try{const b=await fs.readFile(path.join(root,row.path));if(sha(b)!==row.sha256)receipt.sourcesUnchanged=false;}catch(e){receipt.sourcesUnchanged=false;fail('sourceReadbackError',e);}}
if(!receipt.sourcesUnchanged)fail('sourceChanged',Error('Measured input changed'));
try{release?.();receipt.cleanup.workspaceReleased=true;}catch(e){fail('workspaceCleanupError',e);}
await fs.writeFile(path.join(out,'ffmpeg.log'),log);receipt.finishedAt=new Date().toISOString();await fs.writeFile(path.join(out,'result.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:receipt.status,error:receipt.error,outputs:receipt.outputs}));
}
