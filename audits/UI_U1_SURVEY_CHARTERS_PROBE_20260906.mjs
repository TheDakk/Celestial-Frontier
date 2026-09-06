/* Bounded Survey/Charters placement and native interaction probe.
 * node audits/UI_U1_SURVEY_CHARTERS_PROBE_20260906.mjs DIST NEW_OUTPUT
 * Six fresh contexts; no navigation normalization, debugger or viewport restoration.
 * Neither prior U1 blocker is closed by this probe. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { openChromiumCdp } from '../port/v2/tools/browsercdp.mjs';
import { readU1PhoneShell, installNativeReviewTrace, assessNativeReviewDelivery } from '../port/v2/tools/ui-shell-review.mjs';

function readProbeState(readPhone) {
  const errors = [], compact = innerWidth <= 700 || (innerWidth <= 900 && innerWidth > innerHeight);
  const box = node => {
    if (!node) return null;
    const r = node.getBoundingClientRect(), s = getComputedStyle(node);
    return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height,
      visible:s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0 };
  };
  const available = node => {
    const r=box(node), hit=r?.visible?document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2):null;
    return {id:node?.id??null,parent:node?.parentElement?.id??null,rect:r,
      native:node?.tagName==='BUTTON'&&node.type==='button'&&!node.disabled&&!node.closest('[inert],[aria-hidden="true"]'),
      name:node?.getAttribute('aria-label')??'',text:node?.textContent?.trim()??'',
      hit:!!hit&&(hit===node||node.contains(hit)),expanded:node?.getAttribute('aria-expanded')??null,
      controls:node?.getAttribute('aria-controls')??null};
  };
  const usable = value => value.native&&value.hit&&value.rect?.visible&&value.rect.width>=44&&value.rect.height>=44;
  const objective=available(document.getElementById('objchip')), survey=available(document.getElementById('docksurvey')),
    compendium=available(document.getElementById('railcodex')), charterPanel=document.getElementById('chpanel'),
    panelRect=box(charterPanel), openers=[...document.querySelectorAll('[aria-controls="chpanel"]')].map(n=>n.id),
    overlay=document.body.matches('.panel-open,.card-open');
  if(document.querySelector('#dockcharters,#railcharters')||JSON.stringify(openers)!==JSON.stringify(['objchip']))
    errors.push('objective is not the sole Charters opener');
  if(objective.parent!=='topbar'||!objective.name.includes('Charters')||!objective.text
    ||(!overlay&&!usable(objective)))errors.push('objective is not a named reachable44px native Charters control');
  const phone=compact?readPhone(false):null, textPills=[];
  if(compact)errors.push(...phone.errors);
  else {
    const rail=document.getElementById('raillft'), r=box(rail), topbar=box(document.getElementById('topbar')),
      safeLeft=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-left'))||0,
      children=rail?[...rail.children].map(n=>n.id):[];
    if(!r?.visible||JSON.stringify(children)!==JSON.stringify(['docksurvey','railcodex'])
      ||survey.parent!=='raillft'||!usable(survey)||!usable(compendium)
      ||Math.abs(r.left-safeLeft-18)>1||Math.abs(r.top-topbar.bottom-8)>1
      ||Math.abs(survey.rect.left-r.left)>1||Math.abs(survey.rect.top-r.top)>1
      ||Math.abs(compendium.rect.left-r.left)>1||Math.abs(compendium.rect.top-survey.rect.bottom-8)>1)
      errors.push('wide Survey/Compendium are not the two reachable left-rail pills with8px gap');
    for(const id of ['docksurvey','railcodex']){
      const n=document.getElementById(id), range=document.createRange();range.selectNodeContents(n);
      const content=range.getBoundingClientRect(), s=getComputedStyle(n), expectedWidth=Math.max(44,content.width
        +['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth'].reduce((sum,k)=>sum+(parseFloat(s[k])||0),0)),
        actual=box(n);textPills.push({id,actual,contentWidth:content.width,expectedWidth});
      if(!actual?.visible||Math.abs(actual.width-expectedWidth)>1)errors.push(id+' text-fit width differs from visible content');
    }
  }
  return {ok:errors.length===0,errors,compact,viewport:{width:innerWidth,height:innerHeight},objective,survey,compendium,
    phone,textPills,openers,bodyClasses:document.body.className,focusId:document.activeElement?.id??null,
    panel:{visible:!!panelRect?.visible,ariaHidden:charterPanel?.getAttribute('aria-hidden'),
      closeFocused:document.activeElement===charterPanel?.querySelector('[data-pnx="ch"]'),
      closeCount:charterPanel?.querySelectorAll('[data-pnx="ch"]').length??0,
      chapterCount:charterPanel?.querySelectorAll('[data-sel="charter-ch"]').length??0,
      text:charterPanel?.textContent?.trim()??'',html:charterPanel?.innerHTML??''},
    trail:[...document.querySelectorAll('#trail .seg')].map(n=>n.textContent),
    horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
}
function installKeyboardTrace() {
  const trace={events:[],overflow:false};
  const capture=event=>{
    if(trace.events.length>=200){trace.overflow=true;return;}
    trace.events.push({type:event.type,key:event.key??null,code:event.code??null,trusted:event.isTrusted,
      time:performance.now(),eventTime:event.timeStamp,targetId:event.target?.id??null,
      pathIds:event.composedPath().filter(n=>n instanceof Element).map(n=>n.id).filter(Boolean),
      close:event.target instanceof Element?event.target.closest('[data-pnx]')?.getAttribute('data-pnx')??null:null,
      focusId:document.activeElement?.id??null,expanded:document.getElementById('objchip')?.getAttribute('aria-expanded')});
  };
  for(const type of ['keydown','keyup','click'])document.addEventListener(type,capture,{capture:true,passive:true});
  window.__cfU1SurveyCharterKeys=trace;
  return true;
}
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim(),source=git(['rev-parse','HEAD']),
  build=fs.realpathSync(process.argv[2]),out=path.resolve(process.argv[3]),
  sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(git(['diff','--name-only','HEAD']),'');assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const index=fs.readFileSync(path.join(build,'index.html')),worker=fs.readFileSync(path.join(build,'service-worker.js'));
assert(/name="cf-build-mode" content="distributable"/.test(index.toString()));
const assets=JSON.parse(/const ASSETS=Object\.freeze\((\[[^\n]+\])\);/u.exec(worker.toString())[1]);
for(const a of assets){const file=path.resolve(build,'.'+a.path);assert(file.startsWith(build+path.sep));assert.equal(sha(fs.readFileSync(file)),a.sha256);}
const report={schema:'cf-u1-survey-charters-probe/v1',source,certification:false,status:'RUNNING',startedAt:new Date().toISOString(),
  build:{indexSha256:sha(index),serviceWorkerSha256:sha(worker),assets},rows:[],errors:[],
  limitations:['Fresh isolated contexts at each size; native startup Skip only. No navigation normalization, debugger or viewport-restoration run.',
    'Prior unsolicited-navigation and Runtime.evaluate viewport-restoration blockers remain OPEN regardless of this result.',
    'Scoped Survey/Charters geometry and native interaction only; no full U1, Slice, Glass, Safari, physical-device or human visual-acceptance claim.',
    'Keyboard evidence records browser-generated trusted key and click delivery; it does not constitute assistive-technology testing.']};
const write=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),
  file=path.resolve(build,'.'+(name==='/'?'/index.html':name));assert(file.startsWith(build+path.sep)&&fs.statSync(file).isFile());
  res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}catch{res.writeHead(404);res.end();}});
let browser;
try {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  browser=await openChromiumCdp({label:'U1 Survey and objective Charters scoped probe',userDataPrefix:'cf-u1-survey-charters',
    onEvent:e=>{if(e.method==='Runtime.exceptionThrown')report.errors.push({sessionId:e.sessionId,
      message:e.params.exceptionDetails.exception?.description??e.params.exceptionDetails.text});}});
  report.browser=browser.browser;
  for(const [width,height,settings] of [[390,844,false],[320,740,false],[430,932,false],[667,375,true],[834,1112,false],[1440,900,false]]) {
    const mobile=width<=700, row={width,height,settings,phase:'new-context',inputs:[],keyboard:[],controls:[],images:[]};
    report.rows.push(row);write();
    const {browserContextId}=await browser.send('Target.createBrowserContext');
    let evaluate,read,saveTrace;
    try {
      const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId}),
        {sessionId}=await browser.send('Target.attachToTarget',{targetId,flatten:true});
      row.targetId=targetId;row.sessionId=sessionId;
      const send=(method,params={})=>browser.send(method,params,sessionId);
      evaluate=async(label,expression)=>{row.phase=label;write();const a=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
        assert(!a.exceptionDetails,a.exceptionDetails?.exception?.description??a.exceptionDetails?.text);return a.result?.value;};
      const waitFor=async(label,expression)=>{const end=performance.now()+10000;while(performance.now()<end){
        if(await evaluate(label,expression))return;await new Promise(resolve=>setTimeout(resolve,25));}throw Error(label+' readiness expired');};
      const frames=()=>evaluate('fonts and two frames',`(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return true;})()`);
      const observation=`(${readProbeState.toString()})(${readU1PhoneShell.toString()})`;
      read=label=>evaluate(label,observation);
      saveTrace=async()=>{row.trace=await evaluate('retain public input traces',`(()=>{const t=window.__cfU1ReviewNativeTrace,k=window.__cfU1SurveyCharterKeys;
        return{native:t?{events:t.events,changes:t.changes,overflow:t.overflow,final:t.snapshot()}:null,keyboard:k};})()`);write();};
      const capture=async label=>{const image=Buffer.from((await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})).data,'base64'),
        file=`survey-charters-${width}x${height}-${label}.png`;fs.writeFileSync(path.join(out,file),image);
        row.images.push({file,bytes:image.length,sha256:sha(image)});write();};
      const press=async selector=>{
        const p=await evaluate('prepare native '+selector,`(()=>{const t=window.__cfU1ReviewNativeTrace,e=document.querySelector(${JSON.stringify(selector)}),r=e?.getBoundingClientRect();
          if(!e||e.disabled||e.closest('[inert]')||!r||r.width<1||r.height<1)throw Error('unavailable native control');
          const x=r.left+r.width/2,y=r.top+r.height/2,h=document.elementFromPoint(x,y);if(h!==e&&!e.contains(h))throw Error('covered native control');
          const id=++t.nextId;t.active={id,selector:${JSON.stringify(selector)},node:e};
          return{id,selector:${JSON.stringify(selector)},point:{x,y},eventStart:t.events.length,beforePress:t.snapshot()};})()`);
        p.inputMethod=mobile?'touch':'mouse';row.inputs.push(p);write();
        if(mobile){
          await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p.point,id:1,radiusX:1,radiusY:1,force:1}]});
          await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          await waitFor('native touch click '+selector,`window.__cfU1ReviewNativeTrace.events.some(e=>e.pressId===${p.id}&&e.type==='click')`);
        }else{
          await send('Input.dispatchMouseEvent',{type:'mousePressed',...p.point,button:'left',clickCount:1});
          await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p.point,button:'left',clickCount:1});
        }
        Object.assign(p,await evaluate('native receipt '+selector,`(()=>{const t=window.__cfU1ReviewNativeTrace;t.active=null;
          return{events:t.events.slice(${p.eventStart}),overflow:t.overflow,after:t.snapshot()};})()`));
        p.delivery=assessNativeReviewDelivery(p);write();assert(p.delivery.pass,JSON.stringify(p.delivery));
      };
      const checkOpen=async label=>{
        await waitFor(label+' real Charters content',`(()=>{const p=document.getElementById('chpanel');return getComputedStyle(p).display!=='none'
          &&p.getAttribute('aria-hidden')==='false'&&p.querySelector('[data-pnx="ch"]')
          &&p.querySelector('[data-sel="charter-ch"]')&&p.textContent.includes('Charters — Current Expedition');})()`);
        await frames();const state=await read(label+' open outcome');
        assert(state.panel.visible&&state.panel.ariaHidden==='false'&&state.panel.closeCount===1&&state.panel.closeFocused
          &&state.objective.expanded==='true'&&state.panel.chapterCount===1&&state.panel.text.includes('Charters — Current Expedition'));
        assert.deepEqual(state.trail,row.baseline.trail,'Charters changed canonical navigation');return state;
      };
      const checkClosed=async label=>{
        await waitFor(label+' closed',`getComputedStyle(document.getElementById('chpanel')).display==='none'`);
        await frames();const state=await read(label+' closed outcome');
        assert(state.ok&&!state.panel.visible&&state.panel.ariaHidden==='true'&&state.objective.expanded==='false'
          &&state.focusId==='objchip'&&!state.horizontalOverflow,JSON.stringify(state.errors));
        assert.deepEqual(state.trail,row.baseline.trail,'Charters Close changed canonical navigation');return state;
      };
      const key=async(keyValue,code,virtualKey,expectedFocus)=>{
        const receipt=await evaluate('prepare native '+code,`(()=>{const k=window.__cfU1SurveyCharterKeys,active=document.activeElement;
          return{key:${JSON.stringify(keyValue)},code:${JSON.stringify(code)},start:k.events.length,focusId:active?.id??null,
            close:active?.getAttribute('data-pnx')??null};})()`);
        assert(expectedFocus==='objchip'?receipt.focusId==='objchip':receipt.close==='ch','wrong native keyboard origin');
        row.keyboard.push(receipt);write();
        const params={key:keyValue,code,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey};
        await send('Input.dispatchKeyEvent',{type:'keyDown',...params,...(code==='Enter'?{text:'\r',unmodifiedText:'\r'}:code==='Space'?{text:' ',unmodifiedText:' '}:{})});
        await send('Input.dispatchKeyEvent',{type:'keyUp',...params});
        Object.assign(receipt,await evaluate('native keyboard receipt '+code,`(()=>{const k=window.__cfU1SurveyCharterKeys;return{events:k.events.slice(${receipt.start}),overflow:k.overflow};})()`));
        const downs=receipt.events.filter(e=>e.type==='keydown'&&e.key===keyValue&&e.code===code&&e.trusted),
          ups=receipt.events.filter(e=>e.type==='keyup'&&e.key===keyValue&&e.code===code&&e.trusted),
          clicks=receipt.events.filter(e=>e.type==='click'&&e.trusted&&e.pathIds.includes('objchip'));
        receipt.delivery={pass:!receipt.overflow&&downs.length===1&&ups.length===1
          &&(expectedFocus==='objchip'?downs[0].targetId==='objchip'&&clicks.length===1:downs[0].close==='ch'&&clicks.length===0),
          keydowns:downs.length,keyups:ups.length,objectiveClicks:clicks.length};
        write();assert(receipt.delivery.pass,JSON.stringify(receipt));return receipt;
      };
      await send('Runtime.enable');await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
      await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:5});
      await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
      await waitFor('game ready',`!!document.querySelector('canvas')&&document.getElementById('primechip')?.textContent.includes('/9')`);
      await evaluate('install pointer trace',`(${installNativeReviewTrace.toString()})(${JSON.stringify(width+'x'+height)})`);
      await evaluate('install keyboard trace',`(${installKeyboardTrace.toString()})()`);
      if(await evaluate('Training state',`!!document.querySelector('[data-sel=tutskip]')`))await press('[data-sel=tutskip]');
      await waitFor('Training closed',`!document.body.classList.contains('training')&&!document.querySelector('[data-sel=tutskip]')`);
      await frames();row.baseline=await read('baseline Survey and objective geometry');
      assert(row.baseline.ok&&!row.baseline.horizontalOverflow,JSON.stringify(row.baseline.errors));await capture('baseline');
      await press('#objchip');row.pointerOpen=await checkOpen('pointer');await capture('charters');
      await press('#chpanel [data-pnx="ch"]');row.pointerClosed=await checkClosed('pointer');
      await key('Enter','Enter',13,'objchip');row.enterOpen=await checkOpen('Enter');
      await key('Escape','Escape',27,'close');row.escapeClosed=await checkClosed('Escape');
      await key(' ','Space',32,'objchip');row.spaceOpen=await checkOpen('Space');
      await press('#chpanel [data-pnx="ch"]');row.spaceClosed=await checkClosed('Space');
      // Mutants observe availability/geometry without dispatching a product action.
      const mutations=[['#objchip','pointer-events','none'],['#docksurvey','transform','translateX(18px)'],
        ...(row.baseline.compact?[['#docksurvey','grid-row','2'],['#dockcharts','display','flex']]:
          [['#railcodex','transform','translateY(10px)'],['#docksurvey','width','236px']])];
      for(const [selector,property,value]of mutations){
        const proof=await evaluate('geometry negative '+selector+'/'+property,`(()=>{const n=document.querySelector(${JSON.stringify(selector)}),
          prior={present:n.hasAttribute('style'),value:n.getAttribute('style')};let broken;
          try{n.style.setProperty(${JSON.stringify(property)},${JSON.stringify(value)},'important');broken=${observation};}
          finally{n.setAttribute('style','');n.removeAttribute('style');if(prior.present)n.setAttribute('style',prior.value);}
          return{broken,restored:${observation},styleBefore:prior,styleAfter:{present:n.hasAttribute('style'),value:n.getAttribute('style')},
            styleRestored:n.hasAttribute('style')===prior.present&&n.getAttribute('style')===prior.value};})()`);
        row.controls.push({selector,property,value,...proof});write();assert(!proof.broken.ok&&proof.restored.ok&&proof.styleRestored);
      }
      for(const mutation of ['disabled','absent']){
        const proof=await evaluate('objective negative '+mutation,`(()=>{const n=document.getElementById('objchip'),parent=n.parentNode,next=n.nextSibling,
          prior={present:n.hasAttribute('disabled'),value:n.getAttribute('disabled')};let broken;
          try{if(${JSON.stringify(mutation)}==='absent')n.remove();else n.setAttribute('disabled','');broken=${observation};}
          finally{if(n.parentNode!==parent)parent.insertBefore(n,next&&next.parentNode===parent?next:null);
            n.removeAttribute('disabled');if(prior.present)n.setAttribute('disabled',prior.value);}
          return{broken,restored:${observation},domRestored:n.parentNode===parent&&n.nextSibling===next,
            attributeRestored:n.hasAttribute('disabled')===prior.present&&n.getAttribute('disabled')===prior.value};})()`);
        row.controls.push({mutation,...proof});write();assert(!proof.broken.ok&&proof.restored.ok&&proof.domRestored&&proof.attributeRestored);
      }
      if(!settings){
        const priorClass=await evaluate('set large text',`(()=>{const n=document.body,prior={present:n.hasAttribute('class'),value:n.getAttribute('class')};
          n.classList.remove('fs-lg');n.classList.add('fs-xl');return prior;})()`);
        row.largeText={priorClass};
        try{await frames();row.largeText.large=await read('settled large-text geometry');}
        finally{row.largeText.classRestored=await evaluate('exact class restoration',`(()=>{const n=document.body,prior=${JSON.stringify(priorClass)};
          n.setAttribute('class','');n.removeAttribute('class');if(prior.present)n.setAttribute('class',prior.value);
          return n.hasAttribute('class')===prior.present&&n.getAttribute('class')===prior.value;})()`);}
        await frames();row.largeText.restored=await read('settled restored text geometry');
        write();assert(row.largeText.large.ok&&!row.largeText.large.horizontalOverflow&&row.largeText.restored.ok&&row.largeText.classRestored);
      }else{
        await press('#docksets');await waitFor('Settings open',`getComputedStyle(document.getElementById('setpanel')).display!=='none'`);
        await frames();row.settingsState=await read('Settings compact safe-column geometry');
        assert(row.settingsState.ok&&row.settingsState.phone.rect.left>=width/2,JSON.stringify(row.settingsState.errors));await capture('settings');
        await press('#setpanel [data-pnx]');await waitFor('Settings closed',`getComputedStyle(document.getElementById('setpanel')).display==='none'`);
        await frames();row.settingsClosed=await read('Settings restored in same viewport');
        assert(row.settingsClosed.ok&&row.settingsClosed.focusId==='docksets');assert.deepEqual(row.settingsClosed.trail,row.baseline.trail);
      }
      await saveTrace();assert(!row.trace.native.overflow&&!row.trace.keyboard.overflow);
      row.phase='complete';row.pass=true;write();
    }catch(error){
      row.failurePhase=row.phase;row.failure=String(error);row.pass=false;write();
      if(saveTrace)try{await saveTrace();}catch(traceError){row.traceCollectionError=String(traceError);write();}
      throw error;
    }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});}
  }
  assert.equal(report.errors.length,0);assert.equal(git(['rev-parse','HEAD']),source);assert.equal(git(['diff','--name-only','HEAD']),'');
  report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error);throw error;}
finally{
  try{await browser?.close();}catch(error){report.cleanupError=String(error);report.status='FAIL';}
  if(server.listening)await new Promise(resolve=>server.close(resolve));
  report.endedAt=new Date().toISOString();write();
}
assert.equal(report.status,'PASS',report.cleanupError??report.failure);
