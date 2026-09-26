import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const [repoArg, buildArg, outArg] = process.argv.slice(2);
const repo = fs.realpathSync(repoArg), build = fs.realpathSync(buildArg), out = path.resolve(outArg);
assert(!fs.existsSync(out), 'immutable output already exists'); fs.mkdirSync(out, { recursive: true });
const { openChromiumCdp } = await import(pathToFileURL(path.join(repo, 'port/v2/tools/browsercdp.mjs')));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.wav':'audio/wav','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server = http.createServer((request, response) => {
  try {
    const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(build, '.' + (name === '/' ? '/index.html' : name));
    assert(file.startsWith(build + path.sep) && fs.statSync(file).isFile());
    response.writeHead(200, {'Content-Type': types[path.extname(file)] ?? 'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(file).pipe(response);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const report = { schema:'cf-local-av-landing-battle-diagnostic/v1', certification:false, status:'RUNNING',
  startedAt:new Date().toISOString(), source:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),
  workingPatchSha256:hash(execFileSync('git',['diff','HEAD','--','port/v2'],{cwd:repo})),
  serviceWorkerSha256:hash(fs.readFileSync(path.join(build,'service-worker.js'))), origin, steps:[], screenshots:[], errors:[],
  limitations:['Scope: one native Earth landing and shared Shipyard presentation. Not Slice/Glass certification.','Headless Chromium is not physical iPhone/Safari/PWA UAT.','Audio graph start observation is not human listening or speaker-output verification.','Scout motion is decorative arrival, not completed anatomical animation.'] };
const persist = () => fs.writeFileSync(path.join(out,'review.json'), JSON.stringify(report,null,2)+'\n');
try {
  browser = await openChromiumCdp({ label:'native playable landing review', userDataPrefix:'cf-av-landing-20260907',
    onEvent:event=>{if(event.method==='Runtime.exceptionThrown')report.errors.push(event.params.exceptionDetails);}});
  report.browser = browser.browser;
  const {targetId} = await browser.send('Target.createTarget',{url:'about:blank'});
  const {sessionId} = await browser.send('Target.attachToTarget',{targetId,flatten:true});
  const send = (method,params={}) => browser.send(method,params,sessionId);
  await send('Runtime.enable'); await send('Page.enable');
  const evaluate = async expression => {
    const answer = await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    assert(!answer.exceptionDetails, JSON.stringify(answer.exceptionDetails)); return answer.result.value;
  };
  const waitFor = async (name, condition) => {
    report.steps.push({name,status:'waiting',at:new Date().toISOString()});persist();
    await evaluate(`new Promise((resolve,reject)=>{const end=performance.now()+25000;function tick(){if(${condition})resolve(true);else if(performance.now()>end)reject(Error(${JSON.stringify(name)}));else setTimeout(tick,25)}tick()})`);
    report.steps.at(-1).status='pass';persist();
  };
  const click = async selector => {
    const point = await evaluate(`(async()=>{const all=document.querySelectorAll(${JSON.stringify(selector)});if(all.length!==1)throw Error('nonunique '+${JSON.stringify(selector)});const e=all[0];e.scrollIntoView({block:'center',inline:'nearest'});await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);if(e.disabled||e.closest('[inert]')||r.width<=0||r.height<=0||!(h===e||e.contains(h)))throw Error('occluded '+${JSON.stringify(selector)}+JSON.stringify({x,y,hit:h?.outerHTML?.slice(0,200)}));return{x,y}})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
    report.steps.push({name:'native click',selector,point});persist();
  };
  const key = async (name, code, vk) => {
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:name,code,windowsVirtualKeyCode:vk});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:name,code,windowsVirtualKeyCode:vk});
  };
  const screenshot = async name => {
    const {data} = await send('Page.captureScreenshot',{format:'png'});
    const bytes=Buffer.from(data,'base64');fs.writeFileSync(path.join(out,name+'.png'),bytes);
    report.screenshots.push({path:name+'.png',sha256:hash(bytes),bytes:bytes.length});persist();
  };
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const trace={sources:[],inputs:[],frames:[]};Object.defineProperty(window,'__cfLandingReview',{value:trace});document.addEventListener('click',e=>{if(trace.inputs.length<80)trace.inputs.push({trusted:e.isTrusted,tag:e.target.tagName,act:e.target.closest?.('[data-act]')?.dataset.act,challenge:!!e.target.closest?.('[data-combat-challenge]'),at:performance.now()})},true);const p=AudioContext.prototype,create=p.createBufferSource;p.createBufferSource=function(){const node=create.call(this),start=node.start,stop=node.stop;let item;node.start=function(...args){item={duration:node.buffer?.duration,channels:node.buffer?.numberOfChannels,at:performance.now(),state:node.context.state};if(trace.sources.length<80)trace.sources.push(item);return start.apply(this,args)};node.stop=function(...args){if(item)item.stopRequested=performance.now();return stop.apply(this,args)};node.addEventListener('ended',()=>{if(item)item.ended=performance.now()});return node};let frames=0;function frame(){const e=document.querySelector('[data-cf-pilot-ship="landing"]');if(e&&!e.hidden&&frames++<180){const s=getComputedStyle(e),r=e.getBoundingClientRect();trace.frames.push({at:performance.now(),motion:e.dataset.motion,animation:s.animationName,transform:s.transform,opacity:Number(s.opacity),width:r.width,height:r.height,top:r.top,left:r.left,naturalWidth:e.naturalWidth,placement:e.dataset.placement,headerRect:e.closest('.survey-head')?(()=>{const h=e.closest('.survey-head').getBoundingClientRect();return{left:h.left,right:h.right,top:h.top,bottom:h.bottom}})():null,centerOwner:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.className,vistaVisible:document.querySelector('[data-cf-pilot-scene]')?.hidden===false})}requestAnimationFrame(frame)}requestAnimationFrame(frame)})()`});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const trace={frames:[]};Object.defineProperty(window,'__cfBattleReview',{value:trace});function frame(){const scene=document.querySelector('[data-combat-battle-scene]');if(scene&&trace.frames.length<1000){const r=scene.getBoundingClientRect();trace.frames.push({at:performance.now(),cue:scene.dataset.battleCueId,caption:scene.querySelector('[data-battle-cue]')?.textContent,rect:{top:r.top,left:r.left,width:r.width,height:r.height},actors:[...scene.querySelectorAll('[data-battle-actor]')].map(e=>({side:e.dataset.battleActor,transform:getComputedStyle(e).transform,action:e.dataset.battleAction,portraitReady:!e.querySelector('img')||e.querySelector('img').naturalWidth>0}))})}requestAnimationFrame(frame)}requestAnimationFrame(frame)})()`});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await send('Page.navigate',{url:origin+'/?avpilot=1'});
  await waitFor('answerable Training and pilot',`document.querySelector('[data-sel=tutskip]') && document.querySelector('[data-cf-audiovisual-pilot]')`);
  await click('[data-sel=tutskip]');
  await waitFor('Training closed',`!document.querySelector('[data-sel=tutskip]')`);
  await click('[data-cf-pilot-controls] summary');
  await click('[data-cf-pilot-controls] button:nth-of-type(2)');
  await waitFor('native pilot sound opt-in',`document.querySelector('[data-cf-pilot-controls] [role=status]').textContent.includes('Exploration phrase playing')`);
  await click('[data-cf-pilot-controls] summary');
  for(let i=0;i<40 && !await evaluate(`document.activeElement?.tagName==='CANVAS'`);i++)await key('Tab','Tab',9);
  assert(await evaluate(`document.activeElement?.tagName==='CANVAS'`),'native Tab did not focus canvas');
  await key('Enter','Enter',13);
  await waitFor('exact Earth approach',`document.querySelector('[data-act=landcta]')?.getAttribute('data-landing-world')==='CF1|g:999@90,-60|s:424242@560,170|p:133#2'`);
  await screenshot('earth-approach-phone');
  await click('[data-act=landcta]');
  await waitFor('Scout arrival visible',`window.__cfLandingReview.frames.length>8`);
  await screenshot('scout-arrival-phone');
  await waitFor('finite Scout removed',`!document.querySelector('[data-cf-pilot-ship="landing"]')`);
  report.landing = await evaluate(`({trace:window.__cfLandingReview,landed:document.body.classList.contains('surface-mode'),vista:document.querySelector('[data-cf-pilot-scene]')?.hidden===false,leave:!!document.querySelector('[data-act=leaveworld]')})`);
  const motionValid = frames => frames.length>8 && frames.every(f=>f.vistaVisible&&f.naturalWidth>0&&f.width>0&&f.height>0)
    && frames.some(f=>f.opacity>0.5) && new Set(frames.map(f=>f.transform)).size>3;
  assert(report.landing.landed&&report.landing.vista&&report.landing.leave,'landing publication absent');
  assert(motionValid(report.landing.trace.frames),'native Scout frames did not prove movement');
  const headerFrames = report.landing.trace.frames.filter(f=>f.opacity>0.5);
  assert(headerFrames.length>3 && headerFrames.every(f=>f.placement==='survey-header' && f.headerRect && f.left>=f.headerRect.left && f.left+f.width<=f.headerRect.right && f.top>=f.headerRect.top-1 && f.top+f.height<=f.headerRect.bottom+1 && f.centerOwner==='survey-head'),'phone ship must paint in the reachable header, not behind the card');
  const staticFrames=report.landing.trace.frames.map(f=>({...f,transform:'none'}));
  assert(!motionValid(staticFrames),'static-frame negative control was accepted');
  assert(report.landing.trace.inputs.some(e=>e.trusted&&e.act==='landcta'),'native Land receipt absent');
  assert(report.landing.trace.sources.some(s=>Math.abs(s.duration-1.4)<0.001&&s.state==='running'),'landing PCM source never started');
  await waitFor('native Earth challenge available',`document.querySelector('[data-combat-challenge]') && !document.querySelector('[data-combat-challenge]').disabled`);
  await click('[data-combat-challenge]');
  await waitFor('actual battle paints moving participants',`window.__cfBattleReview.frames.some(f=>f.cue&&f.actors.length===2&&f.actors.every(a=>a.portraitReady)&&f.actors.some(a=>a.transform!=='none'&&a.transform!=='matrix(1, 0, 0, 1, 0, 0)'))`);
  await screenshot('combat-attack-phone');
  report.battle = await evaluate(`({frames:window.__cfBattleReview.frames,scene:document.querySelector('[data-combat-battle-scene]')?.outerHTML,inputs:window.__cfLandingReview.inputs})`);
  const battleMovement = frames => frames.some(f=>f.cue&&f.actors.length===2&&f.actors.every(a=>a.portraitReady)&&f.actors.some(a=>a.transform!=='none'&&a.transform!=='matrix(1, 0, 0, 1, 0, 0)'));
  assert(battleMovement(report.battle.frames),'committed battle did not move its actual actors');
  assert(!battleMovement(report.battle.frames.map(f=>({...f,actors:f.actors.map(a=>({...a,transform:'none'}))}))),'static battle negative control accepted');
  assert(report.battle.inputs.some(i=>i.trusted&&i.challenge===true),'native battle input absent');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate(`document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))`);
  await screenshot('combat-desktop');
  await waitFor('native Chronicle reaches result',`!document.querySelector('[data-combat-chronicle-skip]') && document.querySelector('[data-combat-chronicle-result]')`);
  await screenshot('combat-result-desktop');
  report.battle.result = await evaluate(`({text:document.querySelector('[data-combat-chronicle-result]')?.textContent,scene:!!document.querySelector('[data-combat-battle-scene]'),liveAnimations:document.querySelector('[data-combat-battle-scene]')?.getAnimations({subtree:true}).length})`);
  assert.equal(report.battle.result.liveAnimations,0,'finished battle retained motion');
  assert.equal(report.errors.length,0,'browser runtime exceptions');
  report.status='PASS';

} catch(error) {
  report.status='FAIL';report.failure=String(error);process.exitCode=1;
} finally {
  try{await browser?.close()}catch(error){report.cleanupFailure=String(error);report.status='FAIL';process.exitCode=1}
  await new Promise(resolve=>server.close(resolve));
  report.endedAt=new Date().toISOString();persist();
}
console.log(JSON.stringify({status:report.status,failure:report.failure,output:out}));
