/** Scoped dirty-worktree development diagnosis; never admission or listening approval. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {openChromiumCdp} from '../browsercdp.mjs';
const root=path.resolve(import.meta.dirname,'../../../..'), out=path.resolve(process.argv[2]??'');
if(process.argv.length!==3||fs.existsSync(out))throw Error('Supply a new diagnostic output directory');
fs.mkdirSync(out,{recursive:true});
const report={schema:'cf.audio-review-native/v1',scope:'DIRTY LOCAL DEVELOPMENT DIAGNOSTIC; not admission or listening approval',
  head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),status:'RUNNING',errors:[],checks:[]};
const files=['port/v2/apps/game/src/main.ts','port/v2/apps/game/src/audio-production-review.ts','port/v2/apps/game/audio-production-assets.ts','audio-production/audition/catalog.json','audio-production/audition/plans.json','port/v2/apps/game/src/audio-production-plan.ts','port/v2/apps/game/src/audio-production-mix.ts'];
const hashes=()=>Object.fromEntries(files.map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
report.sourceBefore=hashes();let server,browser,send;
const persist=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');persist();
try{
  server=await createServer({mode:'evidence',root:path.join(root,'port/v2/apps/game'),configFile:path.join(root,'port/v2/apps/game/vite.config.ts'),server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'});
  await server.listen();const origin=server.resolvedUrls.local[0];report.origin=origin;
  browser=await openChromiumCdp({label:'audio production developer review',userDataPrefix:'cf-audio-production-review',commandTimeoutMs:60000,
    onEvent:e=>{if(e.method==='Runtime.exceptionThrown')report.errors.push(e.params.exceptionDetails);}});
  report.browser=browser.browser;
  const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});send=(m,p={})=>browser.send(m,p,sessionId);
  await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin+'?audioReview=1'});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const deadline=Date.now()+60000;
  while(!await evaluate(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Sound review')`)){
    if(Date.now()>deadline)throw Error('Game review entry did not mount');await new Promise(r=>setTimeout(r,250));
  }
  const click=async text=>{
    const p=await evaluate(`(()=>{const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(text)});if(!b)return null;b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;return {x,y,visible:document.elementFromPoint(x,y)===b}})()`);
    if(!p?.visible)throw Error('Button is not exposed: '+text);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
  };
  await click('Sound review');
  const ready=Date.now()+15000;
  while(!await evaluate(`document.querySelector('dialog[open] select')?.options.length>0`)){
    if(Date.now()>ready)throw Error(await evaluate(`document.querySelector('dialog[open]')?.textContent`));await new Promise(r=>setTimeout(r,100));
  }
  report.checks.push({name:'actual game dialog and catalogue',value:await evaluate(`document.querySelector('dialog[open] select').options.length`)});
  await evaluate(`(()=>{const s=document.querySelector('dialog[open] select');s.value='music.original.calm';s.dispatchEvent(new Event('change'));})()`);
  await click('Play selected');await new Promise(r=>setTimeout(r,500));
  report.activeBeforeStop=await evaluate(`window.__CF_SLICE__.api.state().audio.runtime.voices.active`);
  if(report.activeBeforeStop!==1)throw Error('Long audition voice did not become active');
  report.playStatus=await evaluate(`document.querySelector('dialog[open] [role=status]').textContent`);
  report.checks.push({name:'explicit gesture playback or enforced game policy',value:report.playStatus});
  const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'desktop.png'),Buffer.from(screenshot.data,'base64'));
  // Negative control: a green-looking status alone must not pass the stop gate.
  await evaluate(`(()=>{const b=Array.from(document.querySelectorAll('dialog[open] button')).find(b=>b.textContent==='Stop all review audio');window.cfRestoreReviewStop=()=>{b.onclick=window.cfSavedReviewStop;delete window.cfSavedReviewStop;delete window.cfRestoreReviewStop;};window.cfSavedReviewStop=b.onclick;b.onclick=()=>{document.querySelector('dialog[open] [role=status]').textContent='Stopped.';};})()`);
  await click('Stop all review audio');
  report.staleStatusControl=await evaluate(`({status:document.querySelector('dialog[open] [role=status]').textContent,active:window.__CF_SLICE__.api.state().audio.runtime.voices.active})`);
  await evaluate(`window.cfRestoreReviewStop()`);
  if(report.staleStatusControl.status!=='Stopped.'||report.staleStatusControl.active!==1)throw Error('False-green stop control did not reproduce');
  await click('Stop all review audio');await new Promise(r=>setTimeout(r,350));
  report.activeAfterStop=await evaluate(`window.__CF_SLICE__.api.state().audio.runtime.voices.active`);
  if(report.activeAfterStop!==0)throw Error('Stop did not release the active voice');
  if(await evaluate(`document.querySelector('dialog[open] [role=status]').textContent`)!=='Stopped.')throw Error('Stop control failed');
  await evaluate(`(()=>{const s=document.querySelector('select[aria-label="Layered sound recipe"]');s.value='weather.rain';s.dispatchEvent(new Event('change'));})()`);
  await click('Play layered recipe');
  for(let i=0;i<80;i++){
    if(await evaluate(`document.querySelector('dialog[open] [role=status]').textContent==='Playing layered recipe.'`))break;
    await new Promise(r=>setTimeout(r,100));
  }
  report.layered=await evaluate(`({status:document.querySelector('dialog[open] [role=status]').textContent,active:window.__CF_SLICE__.api.state().audio.runtime.voices.active})`);
  if(report.layered.status!=='Playing layered recipe.'||report.layered.active!==1)throw Error('Layered recipe did not play through the existing owner');
  await click('Stop all review audio');await new Promise(r=>setTimeout(r,300));
  report.layered.afterStop=await evaluate(`window.__CF_SLICE__.api.state().audio.runtime.voices.active`);
  if(report.layered.afterStop!==0)throw Error('Layered Stop left audio active');
  await evaluate(`(()=>{const s=document.querySelector('select[aria-label="Layered sound recipe"]');s.value='music-transition.calm';s.dispatchEvent(new Event('change'));})()`);
  await click('Play layered recipe');
  for(let i=0;i<80;i++){if(await evaluate(`document.querySelector('dialog[open] [role=status]').textContent==='Playing layered recipe.'`))break;await new Promise(r=>setTimeout(r,100));}
  report.musicTransition=await evaluate(`({status:document.querySelector('dialog[open] [role=status]').textContent,active:window.__CF_SLICE__.api.state().audio.runtime.voices.active})`);
  if(report.musicTransition.status!=='Playing layered recipe.'||report.musicTransition.active!==1)throw Error('Music transition did not start');
  await click('Stop all review audio');await new Promise(r=>setTimeout(r,300));
  if(await evaluate(`window.__CF_SLICE__.api.state().audio.runtime.voices.active`)!==0)throw Error('Music stop did not release');
  const ecologyPresent=await evaluate(`Array.from(document.querySelector('dialog[open] select').options).some(o=>o.value==='v4.environment.pressure')`);
  if(ecologyPresent){
    await evaluate(`(()=>{const s=document.querySelector('select[aria-label="Layered sound recipe"]');s.value='biome.banded';s.dispatchEvent(new Event('change'));})()`);
    await click('Play layered recipe');
    for(let i=0;i<80;i++){if(await evaluate(`document.querySelector('dialog[open] [role=status]').textContent==='Playing layered recipe.'`))break;await new Promise(r=>setTimeout(r,100));}
    report.ecology=await evaluate(`({status:document.querySelector('dialog[open] [role=status]').textContent,active:window.__CF_SLICE__.api.state().audio.runtime.voices.active})`);
    if(report.ecology.status!=='Playing layered recipe.'||report.ecology.active!==1)throw Error('Gas-world recipe did not play');
    await click('Stop all review audio');await new Promise(r=>setTimeout(r,300));
    report.ecology.afterStop=await evaluate(`window.__CF_SLICE__.api.state().audio.runtime.voices.active`);
    if(report.ecology.afterStop!==0)throw Error('Gas-world stop did not release');
  }
  const layeredImage=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'layered.png'),Buffer.from(layeredImage.data,'base64'));
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  report.mobile=await evaluate(`(()=>{const d=document.querySelector('dialog[open]'),r=d.getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth,scrollWidth:d.scrollWidth,clientWidth:d.clientWidth}})()`);
  if(report.mobile.left<0||report.mobile.right>report.mobile.width||report.mobile.scrollWidth>report.mobile.clientWidth)throw Error('Review dialog overflows narrow viewport');
  const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'narrow.png'),Buffer.from(mobile.data,'base64'));
  const currentCatalog=JSON.parse(fs.readFileSync(path.join(root,'audio-production/audition/catalog.json')));
  const attributed=currentCatalog.outputs.find(c=>c.id.startsWith('v5.reference.jaguar.'));
  if(attributed){
    await evaluate(`(()=>{const s=document.querySelector('dialog[open] select');s.value=${JSON.stringify(attributed.id)};s.dispatchEvent(new Event('change'));})()`);
    const text=await evaluate(`document.querySelector('dialog[open]').textContent`);
    const credit=attributed.sourceCredits[0];
    report.attribution={id:attributed.id,creatorVisible:text.includes(credit.creator),licenseVisible:text.includes(credit.license),sourceVisible:text.includes(credit.url),changesVisible:text.includes('Modifications:')};
    if(!report.attribution.creatorVisible||!report.attribution.licenseVisible||!report.attribution.sourceVisible||!report.attribution.changesVisible)throw Error('Attributed derivative lost visible source credit');
    await click('Play selected');await new Promise(r=>setTimeout(r,500));
    report.attribution.active=await evaluate(`window.__CF_SLICE__.api.state().audio.runtime.voices.active`);
    if(report.attribution.active!==1)throw Error('Attributed recording did not play');
    await click('Stop all review audio');await new Promise(r=>setTimeout(r,300));
    report.attribution.afterStop=await evaluate(`window.__CF_SLICE__.api.state().audio.runtime.voices.active`);
    if(report.attribution.afterStop!==0)throw Error('Attributed recording did not release');
  }
  await click('Close');if(await evaluate(`Boolean(document.querySelector('dialog[open]'))`))throw Error('Close did not close');
  // Decode both delivery containers with the real browser. This offline decoder
  // is diagnostic only; runtime playback still uses the game's single owner.
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'audio-production/audition/catalog.json')));
  const selections=['civet-fictional','biome.temperate','music.original.calm','v3.music.calm'].map(id=>catalog.outputs.find(c=>c.id===id));
  if(ecologyPresent){
    const wildlife=catalog.outputs.find(c=>c.id.startsWith('v4.reference.lion.'));
    if(!wildlife)throw Error('Ecology lion reference missing');
    selections.push(wildlife,catalog.outputs.find(c=>c.id==='v4.environment.pressure'));
  }
  if(attributed)selections.push(attributed);
  report.codecs=await evaluate(`(async()=>{
    const samples=${JSON.stringify(selections.map(c=>({id:c.id,wav:c.previewUrl,opus:'/@fs'+path.join(root,'audio-production',c.opus)})))};
    const context=new OfflineAudioContext(2,1,48000),rows=[];
    for(const sample of samples){
      const wav=await context.decodeAudioData(await (await fetch(sample.wav)).arrayBuffer());
      const opus=await context.decodeAudioData(await (await fetch(sample.opus)).arrayBuffer());
      rows.push({id:sample.id,wavFrames:wav.length,opusFrames:opus.length,channels:opus.numberOfChannels,rate:opus.sampleRate});
    }
    let corruptRejected=false;try{await context.decodeAudioData(new Uint8Array([1,2,3,4]).buffer);}catch{corruptRejected=true;}
    return {rows,corruptRejected};
  })()`);
  if(!report.codecs.corruptRejected || report.codecs.rows.some(r=>r.wavFrames!==r.opusFrames||r.rate!==48000))throw Error('Native codec decode/length control failed');
  report.sourceAfter=hashes();if(JSON.stringify(report.sourceBefore)!==JSON.stringify(report.sourceAfter))throw Error('Source changed during diagnosis');
  if(report.errors.length)throw Error('Uncaught game errors');
  report.status='PASS';report.listeningAccepted=false;
}catch(e){report.status='FAIL';report.error=String(e.stack??e);process.exitCode=1;}
finally{
  try{await browser?.close();report.browserClosed=true;}catch(e){report.status='FAIL';report.cleanupError=String(e);process.exitCode=1;}
  try{await server?.close();report.serverClosed=true;}catch(e){report.status='FAIL';report.serverCleanupError=String(e);process.exitCode=1;}
  persist();
}
console.log(JSON.stringify({status:report.status,play:report.playStatus,out}));
