/* Celestial Frontier — synthetic tester harness
   One exported runSession(cfg) that drives the real game in Chromium and
   returns a telemetry record. Designed to be safe to run 1000x unattended. */
import { chromium } from 'playwright';

export const URL = process.env.CF_URL || 'http://127.0.0.1:8899/game.html';

/* ---------- device profiles ---------- */
export const DEVICES = [
  // id, label, class, width, height, dpr, touch, ua-mobile
  ['iphone-se',    'iPhone SE (2nd/3rd)',    'phone',  375,  667, 2, true],
  ['iphone-13-mini','iPhone 13 mini',        'phone',  375,  812, 3, true],
  ['iphone-14',    'iPhone 14 / 13 / 12',    'phone',  390,  844, 3, true],
  ['iphone-15-pro','iPhone 15/16 Pro',       'phone',  393,  852, 3, true],
  ['iphone-14-plus','iPhone 14 Plus/Pro Max','phone',  428,  926, 3, true],
  ['iphone-16-pro-max','iPhone 16 Pro Max',  'phone',  440,  956, 3, true],
  ['pixel-7',      'Pixel 7',                'phone',  412,  915, 2.6, true],
  ['galaxy-s21',   'Galaxy S21',             'phone',  360,  800, 3, true],
  ['galaxy-fold',  'Galaxy Z Fold (folded)', 'phone',  344,  882, 3, true],
  ['ipad-mini',    'iPad mini',              'tablet', 744, 1133, 2, true],
  ['ipad-10',      'iPad (10th gen)',        'tablet', 820, 1180, 2, true],
  ['ipad-air',     'iPad Air / Pro 11"',     'tablet', 834, 1194, 2, true],
  ['ipad-pro-13',  'iPad Pro 13"',           'tablet',1024, 1366, 2, true],
  ['ipad-land',    'iPad Air (landscape)',   'tablet',1180,  820, 2, true],
  ['surface-pro',  'Surface Pro',            'tablet', 912, 1368, 2, true],
  ['laptop-720',   'Small laptop 1280x720',  'desktop',1280, 720, 1, false],
  ['laptop-768',   'Laptop 1366x768',        'desktop',1366, 768, 1, false],
  ['laptop-mbp14', 'MacBook Pro 14"',        'desktop',1512, 982, 2, false],
  ['desktop-1080', 'Desktop 1920x1080',      'desktop',1920,1080, 1, false],
  ['desktop-1440', 'Desktop 2560x1440',      'desktop',2560,1440, 1, false],
  ['ultrawide',    'Ultrawide 3440x1440',    'desktop',3440,1440, 1, false],
];

/* ---------- personas ---------- */
/* weights: how the bot spends its turns. patience: tolerance for no-reward
   streaks. tutorial: probability of doing field training rather than skipping. */
export const PERSONAS = [
  { id:'completionist', label:'Completionist',
    w:{survey:3,land:3,panel:4,inspect:4,pan:1,zoom:2,keyboard:1,search:1}, patience:0.95, tutorial:0.95, readMs:[900,2200] },
  { id:'speedrunner', label:'Speedrunner',
    w:{survey:5,land:5,panel:1,inspect:1,pan:2,zoom:4,keyboard:0,search:0}, patience:0.45, tutorial:0.05, readMs:[120,400] },
  { id:'explorer', label:'Wandering explorer',
    w:{survey:4,land:3,panel:2,inspect:2,pan:4,zoom:4,keyboard:0,search:1}, patience:0.8,  tutorial:0.5,  readMs:[500,1400] },
  { id:'lore-reader', label:'Lore reader',
    w:{survey:2,land:1,panel:5,inspect:5,pan:1,zoom:1,keyboard:1,search:2}, patience:0.9,  tutorial:0.9,  readMs:[1500,3500] },
  { id:'button-masher', label:'Button masher',
    w:{survey:4,land:2,panel:5,inspect:5,pan:3,zoom:3,keyboard:2,search:1}, patience:0.3,  tutorial:0.1,  readMs:[80,250] },
  { id:'cautious-newbie', label:'Cautious first-timer',
    w:{survey:2,land:1,panel:3,inspect:2,pan:2,zoom:2,keyboard:0,search:0}, patience:0.6,  tutorial:0.85, readMs:[1400,3200] },
  { id:'min-maxer', label:'Min-maxer',
    w:{survey:3,land:4,panel:4,inspect:4,pan:1,zoom:3,keyboard:1,search:2}, patience:0.85, tutorial:0.6,  readMs:[600,1600] },
  { id:'accessibility', label:'Keyboard / a11y user',
    w:{survey:1,land:1,panel:3,inspect:2,pan:0,zoom:1,keyboard:8,search:2}, patience:0.75, tutorial:0.7,  readMs:[1000,2400] },
  { id:'skimmer', label:'Impatient skimmer',
    w:{survey:3,land:2,panel:4,inspect:2,pan:2,zoom:2,keyboard:0,search:1}, patience:0.25, tutorial:0.02, readMs:[100,300] },
  { id:'stress-tester', label:'Chaos / stress tester',
    w:{survey:3,land:2,panel:4,inspect:6,pan:4,zoom:5,keyboard:3,search:2}, patience:0.5,  tutorial:0.1,  readMs:[60,200] },
];

/* ---------- deterministic RNG ---------- */
function mulberry(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/* ---------- in-page instrumentation (installed before any game code) ---------- */
const INSTRUMENT = () => {
  const T = { errors:[], rejections:[], consoleErrors:[], longTasks:0, longTaskMs:0,
              frames:[], lastFrame:0, storageFail:0 };
  window.__T = T;
  window.addEventListener('error', e=>{
    T.errors.push({ m:String(e.message).slice(0,240), src:String(e.filename||'').slice(-40), ln:e.lineno });
  });
  window.addEventListener('unhandledrejection', e=>{
    T.rejections.push(String((e.reason&&(e.reason.stack||e.reason.message))||e.reason).slice(0,240));
  });
  try {
    new PerformanceObserver(list=>{ for(const e of list.getEntries()){ T.longTasks++; T.longTaskMs+=e.duration; } })
      .observe({ entryTypes:['longtask'] });
  } catch(_){}
  // frame pacing
  let prev = performance.now();
  const tick = t => { const d=t-prev; prev=t; if(d>0&&d<2000) T.frames.push(d); if(T.frames.length>4000) T.frames.splice(0,2000); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  // catch save failures (quota etc.)
  const _set = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k,v){ try{ return _set.apply(this,arguments); }
    catch(err){ T.storageFail++; throw err; } };
};

/* ---------- layout / a11y audit, evaluated in page ---------- */
export const AUDIT = (isTouch) => {
  const out = { overflowX:0, docW:0, winW:0, offscreen:[], tiny:[], overlap:[], clipped:[],
                lowContrast:[], underNotch:[], fixedBottom:[], zeroSizeInteractive:0 };
  const de = document.documentElement;
  out.docW = Math.max(de.scrollWidth, document.body.scrollWidth);
  out.winW = window.innerWidth;
  out.overflowX = Math.max(0, out.docW - out.winW);

  const visible = el => { const r=el.getBoundingClientRect(), s=getComputedStyle(el);
    return r.width>0 && r.height>0 && s.visibility!=='hidden' && s.display!=='none' && +s.opacity>0.05; };
  const interactiveSel = 'button,[role="button"],a[href],input,select,textarea,[onclick],[tabindex]:not([tabindex="-1"])';
  const els = [...document.querySelectorAll(interactiveSel)];
  const vis = els.filter(visible);
  const label = el => (el.id ? '#'+el.id : (el.getAttribute('aria-label')||(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,26)||el.tagName.toLowerCase()));

  const MIN = isTouch ? 44 : 24;   // Apple HIG 44pt / WCAG 2.2 target-size minimum
  for (const el of vis) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) { out.zeroSizeInteractive++; continue; }
    if (r.width < MIN || r.height < MIN)
      out.tiny.push({ id:label(el), w:Math.round(r.width), h:Math.round(r.height) });
    if (r.right > window.innerWidth + 1 || r.left < -1 || r.bottom > window.innerHeight + 1 || r.top < -1)
      out.offscreen.push({ id:label(el), l:Math.round(r.left), t:Math.round(r.top),
                           r:Math.round(r.right), b:Math.round(r.bottom) });
    if (r.top < 47 && r.left < window.innerWidth && isTouch)   // iOS status bar / dynamic island band
      out.underNotch.push({ id:label(el), t:Math.round(r.top) });
  }
  // overlapping interactive elements (excluding ancestor/descendant pairs)
  for (let i=0;i<vis.length;i++) for (let j=i+1;j<vis.length;j++){
    const a=vis[i], b=vis[j];
    if (a.contains(b)||b.contains(a)) continue;
    const ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect();
    const ox=Math.min(ra.right,rb.right)-Math.max(ra.left,rb.left);
    const oy=Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top);
    if (ox>4 && oy>4){
      const area=ox*oy, sm=Math.min(ra.width*ra.height, rb.width*rb.height);
      if (sm>0 && area/sm > 0.30) out.overlap.push({ a:label(a), b:label(b), pct:Math.round(area/sm*100) });
    }
  }
  // clipped text: overflow hidden but content taller/wider than the box
  for (const el of [...document.querySelectorAll('div,span,p,h1,h2,h3,li,td,button')].filter(visible)){
    const s=getComputedStyle(el);
    if ((s.overflow==='hidden'||s.overflowY==='hidden'||s.overflowX==='hidden')){
      if (el.scrollHeight - el.clientHeight > 6 && el.clientHeight > 8 && el.children.length < 3
          && (el.textContent||'').trim().length > 12)
        out.clipped.push({ id:label(el), over:el.scrollHeight-el.clientHeight,
                           txt:(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,44) });
      if (el.scrollWidth - el.clientWidth > 6 && s.textOverflow!=='ellipsis' && el.children.length===0
          && (el.textContent||'').trim().length > 8)
        out.clipped.push({ id:label(el), overX:el.scrollWidth-el.clientWidth,
                           txt:(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,44) });
    }
  }
  // crude contrast probe on small text
  const parseRGB = c => { const m=/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?/.exec(c);
    return m?[+m[1],+m[2],+m[3], m[4]===undefined?1:+m[4]]:null; };
  const relLum = ([r,g,b]) => { const f=v=>{v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const bgOf = el => { let n=el; while(n && n!==document.documentElement){ const c=parseRGB(getComputedStyle(n).backgroundColor);
      if(c && c[3]>0.55) return c; n=n.parentElement; } return [8,10,18,1]; };
  const textEls = [...document.querySelectorAll('div,span,p,button,a,li')].filter(visible)
    .filter(el=>el.children.length===0 && (el.textContent||'').trim().length>3).slice(0,220);
  for (const el of textEls){
    const s=getComputedStyle(el); const fg=parseRGB(s.color); if(!fg) continue;
    const bg=bgOf(el);
    const a=fg[3]===undefined?1:fg[3];
    const mix=[0,1,2].map(i=>fg[i]*a + bg[i]*(1-a));
    const L1=relLum(mix), L2=relLum(bg);
    const ratio=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const fs=parseFloat(s.fontSize)||16, bold=(+s.fontWeight)>=700;
    const large = fs>=24 || (fs>=18.66 && bold);
    const need = large?3:4.5;
    if (ratio < need)
      out.lowContrast.push({ id:label(el), ratio:+ratio.toFixed(2), need, fs:Math.round(fs),
                             txt:(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,40) });
  }
  const trim = (a,n)=>a.slice(0,n);
  out.offscreen=trim(out.offscreen,12); out.tiny=trim(out.tiny,20); out.overlap=trim(out.overlap,12);
  out.clipped=trim(out.clipped,12); out.lowContrast=trim(out.lowContrast,12); out.underNotch=trim(out.underNotch,8);
  return out;
};

/* ---------- planet/target detection from the canvas ---------- */
export const FIND_TARGETS = () => {
  const cv = document.getElementById('cosmos'); if(!cv) return [];
  let ctx; try { ctx = cv.getContext('2d'); } catch(_) { return []; }
  if(!ctx) return [];
  const W=cv.width, H=cv.height, dpr=W/window.innerWidth || 1;
  let d; try { d = ctx.getImageData(0,0,W,H).data; } catch(_) { return []; }
  const lum=i=>0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
  const pts=[]; const step=Math.max(3, Math.round(4*dpr));
  for(let y=step;y<H-step;y+=step) for(let x=step;x<W-step;x+=step){
    const i=(y*W+x)*4; if(lum(i)>58) pts.push([x,y]);
  }
  const cl=[], R=24*dpr;
  for(const [x,y] of pts){ let f=null;
    for(const c of cl){ if(Math.abs(c.x-x)<R && Math.abs(c.y-y)<R){ f=c; break; } }
    const i=(y*W+x)*4;
    if(f){ f.n++; f.sx+=x; f.sy+=y; f.x=f.sx/f.n; f.y=f.sy/f.n; f.r+=d[i]; f.g+=d[i+1]; f.b+=d[i+2]; }
    else cl.push({x,y,sx:x,sy:y,n:1,r:d[i],g:d[i+1],b:d[i+2]});
  }
  return cl.filter(c=>c.n>=2 && c.n<220)
    .map(c=>({ x:Math.round(c.x/dpr), y:Math.round(c.y/dpr), n:c.n,
               // mean colour + "blueness" so a bot can follow colour-coded instructions
               R:Math.round(c.r/c.n), G:Math.round(c.g/c.n), B:Math.round(c.b/c.n),
               blue:+((c.b/c.n) - Math.max(c.r,c.g)/c.n).toFixed(1) }))
    .filter(c=>c.y > 105 && c.y < window.innerHeight-95)   // stay clear of topbar / hint rail
    .sort((a,b)=>b.n-a.n).slice(0,16);
};

/* ---------- named-target scan ----------
   The game opens the DOM survey panel on hover and puts the body's name in it,
   so a synthetic pointermove sweep over orbital rings yields real, named targets
   (x, y, name) instead of guessing at bright pixels. Bounded by budgetMs. */
export const SCAN_TARGETS = async (budgetMs) => {
  const t0 = performance.now();
  const panelTxt = () => { const e=document.getElementById('panel');
    if(!e || getComputedStyle(e).display==='none') return null;
    const s=(e.innerText||'').trim(); return s || null; };
  /* first line of the card is the body's name — split BEFORE collapsing space */
  const nameOf = s => ((s||'').split('\n')[0] || '').trim().slice(0,34);
  const frame = () => new Promise(r=>requestAnimationFrame(r));
  const W=innerWidth, H=innerHeight, cx=W/2, cy=H/2;
  const found=[], seen=new Set();
  const probe = async (x,y) => {
    if(x<4||y<112||x>W-4||y>H-104) return;
    window.dispatchEvent(new PointerEvent('pointermove',{clientX:x,clientY:y,pointerType:'mouse',bubbles:true}));
    await frame();
    const t=panelTxt(); if(!t) return;
    const n=nameOf(t);
    if(n && !seen.has(n)){ seen.add(n); found.push({x,y,name:n,
      raw:t.replace(/\s+/g,' ').slice(0,44)}); }
  };
  const maxR = Math.hypot(W,H)*0.52;
  outer:
  for(let rad=44; rad<maxR; rad+=30){
    const stepA = Math.max(0.09, 30/rad);
    for(let a=0; a<Math.PI*2; a+=stepA){
      await probe(Math.round(cx+Math.cos(a)*rad), Math.round(cy+Math.sin(a)*rad*0.94));
      if(performance.now()-t0 > budgetMs || found.length>=14) break outer;
    }
  }
  // clear hover so a stale card doesn't sit over the map
  window.dispatchEvent(new PointerEvent('pointermove',{clientX:2,clientY:2,pointerType:'mouse',bubbles:true}));
  return found;
};

/* ---------- tutorial state, read straight off the guidance card ---------- */
export const TUT_STATE = () => {
  const tb = document.getElementById('tutbox');
  if(!tb || getComputedStyle(tb).display==='none') return null;
  const hdr = (tb.querySelector('.tt')||{}).innerText || '';
  const m = /(\d+)\s*\/\s*(\d+)/.exec(hdr);
  const act = tb.querySelector('#tut-act');
  const sp = document.getElementById('tutspot');
  let spot = null;
  if (sp && getComputedStyle(sp).display!=='none'){
    const r = sp.getBoundingClientRect();
    if (r.width>2 && r.height>2) spot = { x:r.left+r.width/2, y:r.top+r.height/2,
                                          w:Math.round(r.width), h:Math.round(r.height) };
  }
  const rt = tb.getBoundingClientRect();
  return { step: m?+m[1]:null, total: m?+m[2]:null,
           text: ((tb.querySelector('.tx')||{}).innerText||'').replace(/\s+/g,' ').slice(0,160),
           actBtn: act ? ((act.textContent||'').trim().slice(0,28)) : null,
           spot,
           card: { x:Math.round(rt.left), y:Math.round(rt.top), w:Math.round(rt.width), h:Math.round(rt.height),
                   offscreen: rt.bottom > window.innerHeight+1 || rt.top < -1 ||
                              rt.right > window.innerWidth+1 || rt.left < -1 } };
};

/* ---------- read progression out of the game's own save ---------- */
const READ_SAVE = () => {
  try {
    const raw = localStorage.getItem('cfcc_save_v2'); if(!raw) return null;
    const o = JSON.parse(raw);
    return { bytes: raw.length, landings:o.landings|0, harvests:o.harvests|0, breeds:o.breeds|0,
             feeds:o.feeds|0, charters:o.charters|0, guardians:o.guardians|0, essence:o.essence|0,
             codex:(o.codex||[]).length, log:(o.log||[]).length, land:(o.land||[]).length,
             conq:(o.conq||[]).length, bestRank:o.br|0, notifs:(o.notifs||[]).length };
  } catch(e){ return { parseError:String(e).slice(0,80) }; }
};

/* ---------- visible overlay / blocking-panel detection ---------- */
const VISIBLE_PANELS = () => {
  const v = el => { const r=el.getBoundingClientRect(), s=getComputedStyle(el);
    return r.width>1&&r.height>1&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05; };
  const out=[];
  for (const el of document.querySelectorAll('div[id],button[id]')){
    if(!v(el)) continue;
    const r=el.getBoundingClientRect();
    const coversMost = r.width > window.innerWidth*0.6 && r.height > window.innerHeight*0.5;
    if (coversMost || (r.width>220 && r.height>160))
      out.push({ id:el.id, w:Math.round(r.width), h:Math.round(r.height), blocking:coversMost,
                 z:+getComputedStyle(el).zIndex||0 });
  }
  return out;
};

/* ---------- the session ---------- */
export async function runSession(cfg, browser){
  const rnd = mulberry(cfg.seed);
  const pick = arr => arr[Math.floor(rnd()*arr.length)];
  const persona = PERSONAS.find(p=>p.id===cfg.persona);
  const dev = DEVICES.find(d=>d[0]===cfg.device);
  const [devId, devLabel, devClass, vw, vh, dpr, touch] = dev;

  const rec = {
    id: cfg.id, seed: cfg.seed, persona: persona.id, personaLabel: persona.label,
    device: devId, deviceLabel: devLabel, deviceClass: devClass, vw, vh, dpr, touch,
    tier: cfg.tier, budgetMs: cfg.budgetMs,
    ok:false, fatal:null,
    errors:[], rejections:[], consoleErrors:[], storageFail:0,
    longTasks:0, longTaskMs:0, fps:null, p95Frame:null, jank:0,
    bootMs:null, ttfaMs:null, firstLandMs:null,
    actions:0, actionLog:[], deadClicks:0, blockedClicks:0,
    audits:[], save:null, progress:{},
    tutorial:null, tutorialSteps:0, tutorialAbandoned:false,
    stuckOverlay:null, rageQuit:false, quitReason:null,
    panelsOpened:[], panelOpenFail:[],
    frictionEvents:[],
  };

  let ctx, page;
  const t0 = Date.now();
  try {
    ctx = await browser.newContext({
      viewport:{width:vw, height:vh}, deviceScaleFactor:dpr,
      isMobile: touch, hasTouch: touch,
      userAgent: touch
        ? (devClass==='tablet'
            ? 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
            : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')
        : undefined,
      reducedMotion: cfg.reducedMotion ? 'reduce' : 'no-preference',
      locale:'en-US',
    });
    await ctx.addInitScript(INSTRUMENT);
    page = await ctx.newPage();
    page.on('pageerror', e => rec.errors.push({ m:String(e.message).slice(0,240), from:'pageerror' }));
    page.on('console', m => { if(m.type()==='error'){ const t=m.text().slice(0,200);
      if(!/version\.json/.test(t)) rec.consoleErrors.push(t); } });
    page.on('requestfailed', r => { if(!/version\.json/.test(r.url())) rec.frictionEvents.push('requestfailed:'+r.url().slice(-40)); });

    const deadline = Date.now() + cfg.budgetMs;
    const left = () => deadline - Date.now();
    const wait = async ms => { if(left()<=0) return; await page.waitForTimeout(Math.max(10, Math.min(ms, left()))); };
    const think = async () => wait(persona.readMs[0] + rnd()*(persona.readMs[1]-persona.readMs[0]));

    await page.goto(cfg.url || URL, { waitUntil:'load', timeout:45000 });
    rec.bootMs = Date.now()-t0;
    await wait(900 + rnd()*600);

    const audit = async tag => {
      try { const a = await page.evaluate(AUDIT, touch); a.tag=tag; rec.audits.push(a); } catch(_){}
    };
    const panels = async () => { try { return await page.evaluate(VISIBLE_PANELS); } catch(_) { return []; } };
    const saveNow = async () => { try { return await page.evaluate(READ_SAVE); } catch(_) { return null; } };
    const clickSel = async (sel, ms=2500) => {
      try { await page.click(sel, { timeout:ms }); return true; } catch(_) { return false; }
    };

    /* --- gate 1: name entry --- */
    await audit('name-gate');
    const nameVisible = await page.locator('#namebox').isVisible().catch(()=>false);
    if (nameVisible){
      // does the topbar behind the gate respond? (modal-focus check)
      try {
        const trapped = await page.evaluate(()=>{
          const b=document.getElementById('logbtn'); if(!b) return null;
          const r=b.getBoundingClientRect();
          const top=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
          return { hit: top? (top.id||top.tagName) : null, gateBlocks: !!(top&&top.closest&&top.closest('#namebox')) };
        });
        rec.modalFocusProbe = trapped;
      } catch(_){}
      await page.click('#namein', { timeout:5000 }).catch(()=>{});
      const name = cfg.playerName || ('Bot'+cfg.id);
      await page.keyboard.type(name, { delay: touch? 45 : 25 });
      await wait(200);
      if (!await clickSel('#nameok', 6000)) { rec.fatal='name-gate-stuck'; throw new Error('name gate'); }
      rec.ttfaMs = Date.now()-t0;
      await wait(1100);
    }

    /* --- gate 2: release notes --- */
    if (await page.locator('#relbox').isVisible().catch(()=>false)){
      await audit('release-notes');
      // is Escape enough? (players expect it)
      await page.keyboard.press('Escape'); await wait(400);
      const stillThere = await page.locator('#relbox').isVisible().catch(()=>false);
      rec.releaseEscapeDismisses = !stillThere;
      if (stillThere && !await clickSel('#relok', 5000)) { rec.stuckOverlay='relbox'; }
      await wait(900);
    }

    /* --- gate 3: field training --- */
    const doTut = rnd() < persona.tutorial;
    rec.tutorial = doTut ? 'took' : 'skipped';
    if (await page.locator('#tutbox').isVisible().catch(()=>false)){
      await audit('tutorial-start');
      if (doTut){
        /* Field Training is action-gated: only some steps have a button, the rest
           wait on a real in-world event. Follow it the way a guided player does —
           press the button if there is one, otherwise tap the spotlight ring,
           otherwise try to satisfy the instruction from the canvas. */
        let attempts = 0, maxStep = 0, stallAt = null, stallTries = 0, lastStep = -1;
        const tutBudget = () => left() > cfg.budgetMs*0.30;
        rec.tutTrace = [];
        while (tutBudget() && attempts < (cfg.tier==='deep' ? 90 : 34)){
          const ts = await page.evaluate(TUT_STATE);
          if (!ts) break;                                   // training finished or dismissed
          if (ts.step != null){
            if (ts.step > maxStep){ maxStep = ts.step; stallTries = 0;
              rec.tutTrace.push({ s:ts.step, t:Date.now()-t0, act:ts.actBtn||null, spot:!!ts.spot }); }
            if (ts.step === lastStep) stallTries++; else stallTries = 0;
            lastStep = ts.step;
            if (ts.card && ts.card.offscreen) rec.frictionEvents.push('tutcard-offscreen@'+ts.step);
          }
          attempts++;
          await think();

          let did = false;
          if (ts.actBtn){ did = await clickSel('#tut-act', 2000); }
          else if (ts.spot){                                  // the ring is the instruction
            try {
              if (touch) await page.touchscreen.tap(ts.spot.x, ts.spot.y);
              else await page.mouse.click(ts.spot.x, ts.spot.y);
              did = true;
            } catch(_){}
          }
          else {
            // no button, no ring: satisfy the instruction from the map itself.
            // The step names the body it wants ("find Earth") — scan for it by name.
            const want = /\b(earth|home)\b/i.test(ts.text) ? 'earth' : null;
            const named = await page.evaluate(SCAN_TARGETS, 2600).catch(()=>[]);
            if (named.length) rec.scanSeen = (rec.scanSeen||0) + named.length;
            let t = null;
            if (want) t = named.find(n=>new RegExp('^'+want,'i').test(n.name));
            if (!t && named.length) t = pick(named);
            if (!t){
              const targets = await page.evaluate(FIND_TARGETS);
              const cx=vw/2, cy=vh/2;
              const away = targets.filter(q=>Math.hypot(q.x-cx,q.y-cy) > Math.min(vw,vh)*0.10);
              t = away.length?pick(away):(targets.length?pick(targets):null);
            }
            if (t){
              if (touch) await page.touchscreen.tap(t.x,t.y); else await page.mouse.click(t.x,t.y);
              did = true;
              await wait(500);
              // if a survey card opened, the step may want a control on it
              const hit = await page.evaluate(()=>{
                const p=document.getElementById('panel'); if(!p) return null;
                const st=document.getElementById('tutspot');
                if(st && getComputedStyle(st).display!=='none'){
                  const r=st.getBoundingClientRect();
                  if(r.width>2) return {x:r.left+r.width/2,y:r.top+r.height/2};
                }
                return null;
              });
              if (hit){ if(touch) await page.touchscreen.tap(hit.x,hit.y); else await page.mouse.click(hit.x,hit.y); }
            }
          }
          if (!did) rec.deadClicks++;
          await wait(650);

          // a step the bot cannot satisfy — record where training walls up
          if (stallTries >= (cfg.tier==='deep' ? 9 : 5)){
            stallAt = { step: ts.step, text: ts.text.slice(0,120), hasBtn: !!ts.actBtn, hasSpot: !!ts.spot };
            break;
          }
        }
        rec.tutorialSteps = maxStep;
        rec.tutorialTotal = (await page.evaluate(TUT_STATE).catch(()=>null))?.total || 21;
        rec.tutorialStall = stallAt;
        rec.tutorialCompleted = !(await page.locator('#tutbox').isVisible().catch(()=>false));
        if (!rec.tutorialCompleted){
          rec.tutorialAbandoned = true;
          if (await clickSel('#tut-skip',1500)) { await wait(400); await clickSel('#tut-skip-yes',1500); }
        }
      } else {
        if (await clickSel('#tut-skip', 3000)){
          await wait(500);
          await audit('skip-confirm');
          if (!await clickSel('#tut-skip-yes', 3000)) rec.stuckOverlay='tut-skip-confirm';
        } else rec.stuckOverlay='tutbox';
      }
      await wait(900);
    }
    await audit('post-onboarding');
    rec.postOnboardMs = Date.now()-t0;

    /* --- main play loop --- */
    const wkeys=[], wt=persona.w;
    for (const k in wt) for (let i=0;i<wt[k];i++) wkeys.push(k);
    let noRewardStreak = 0;
    let lastSave = await saveNow();
    rec.save0 = lastSave;
    let auditCountdown = 3;

    while (left() > 1500 && rec.actions < (cfg.maxActions||400)){
      const act = pick(wkeys);
      let rewarded = false;
      rec.actions++;
      try {
        if (act==='survey' || act==='land'){
          /* deep-tier bots hover-scan for named bodies (reliable, and records what
             was actually visited); broad-tier bots use the cheap pixel pass */
          let targets = [];
          if (cfg.tier==='deep' && !touch){
            const named = await page.evaluate(SCAN_TARGETS, 2200).catch(()=>[]);
            if (named.length){
              targets = named;
              for (const n of named){ rec.bodiesSeen = rec.bodiesSeen||{};
                rec.bodiesSeen[n.name] = (rec.bodiesSeen[n.name]||0)+1; }
            }
          }
          if (!targets.length) targets = await page.evaluate(FIND_TARGETS);
          if (targets.length){
            // avoid the central star: prefer targets away from viewport centre
            const cx=vw/2, cy=vh/2;
            const cand = targets.filter(t=>Math.hypot(t.x-cx,t.y-cy) > Math.min(vw,vh)*0.10);
            const t = (cand.length?pick(cand):pick(targets));
            if (touch) await page.touchscreen.tap(t.x, t.y);
            else { await page.mouse.move(t.x,t.y); await wait(160); await page.mouse.click(t.x,t.y); }
            await wait(500);
            const p1 = await panels();
            const hasPanel = p1.some(x=>x.id==='panel');
            if (hasPanel){
              rewarded = true;
              rec.actionLog.push('survey:hit');
              if (act==='land'){
                await think();
                const landed = await page.evaluate(()=>{
                  const p=document.getElementById('panel'); if(!p) return null;
                  const b=[...p.querySelectorAll('button,[role="button"],div')]
                    .find(e=>/^\s*land\s*$/i.test((e.textContent||'').trim()));
                  if(!b) return null;
                  const r=b.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2};
                });
                if (landed){
                  if (touch) await page.touchscreen.tap(landed.x, landed.y);
                  else await page.mouse.click(landed.x, landed.y);
                  await wait(1400);
                  // some flows ask "Begin descent?" — confirm it
                  const conf = await page.evaluate(()=>{
                    const cands=[...document.querySelectorAll('button,[role="button"]')]
                      .filter(e=>{const r=e.getBoundingClientRect();return r.width>1&&r.height>1;})
                      .find(e=>/descend|begin descent|confirm|land|yes/i.test((e.textContent||'').trim())
                                && !/stay in orbit|cancel/i.test((e.textContent||'')));
                    if(!cands) return null;
                    const r=cands.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,
                      t:(cands.textContent||'').trim().slice(0,24)};
                  });
                  if (conf){ if(touch) await page.touchscreen.tap(conf.x,conf.y); else await page.mouse.click(conf.x,conf.y); await wait(1600); }
                  rec.actionLog.push('land:attempt');
                }
              }
            } else { rec.deadClicks++; rec.actionLog.push('survey:miss');
              (rec.deadDetail=rec.deadDetail||[]).length<40 && rec.deadDetail.push({k:'survey:miss'}); }
          } else { rec.deadClicks++; (rec.deadDetail=rec.deadDetail||[]).length<40 && rec.deadDetail.push({k:'survey:noscan'}); }
        }
        else if (act==='zoom'){
          const cx=vw/2 + (rnd()-0.5)*vw*0.4, cy=vh/2 + (rnd()-0.5)*vh*0.4;
          if (touch){
            // double-tap zoom is the documented touch gesture
            await page.touchscreen.tap(cx,cy); await wait(90); await page.touchscreen.tap(cx,cy);
          } else {
            await page.mouse.move(cx,cy);
            const dir = rnd()<0.75 ? -1 : 1;
            for(let i=0;i<3+Math.floor(rnd()*5);i++){ await page.mouse.wheel(0, dir*240); await wait(90); }
          }
          await wait(400); rewarded = true;
        }
        else if (act==='pan'){
          const sx=vw*0.5, sy=vh*0.5;
          await page.mouse.move(sx,sy); await page.mouse.down();
          for(let i=0;i<4;i++){ await page.mouse.move(sx+(rnd()-0.5)*vw*0.5, sy+(rnd()-0.5)*vh*0.5); await wait(60); }
          await page.mouse.up(); await wait(300); rewarded = true;
        }
        else if (act==='panel'){
          const btn = pick(['#logbtn','#codexbtn','#cargobtn','#recbtn','#chbtn','#pcdxbtn','#setbtn','#helpbtn','#bell']);
          const before = (await panels()).map(p=>p.id).join(',');
          const okc = await clickSel(btn, 2200);
          await wait(700);
          const after = await panels();
          if (!okc){ rec.blockedClicks++; rec.panelOpenFail.push(btn); }
          else if (after.map(p=>p.id).join(',') === before){ rec.deadClicks++; rec.panelOpenFail.push(btn+':nochange');
            (rec.deadDetail=rec.deadDetail||[]).length<40 && rec.deadDetail.push({k:'panel',t:btn}); }
          else { rewarded = true; for(const p of after) if(!rec.panelsOpened.includes(p.id)) rec.panelsOpened.push(p.id); }
          await think();
          if (auditCountdown-- <= 0){ await audit('panel:'+btn.slice(1)); auditCountdown = 4 + Math.floor(rnd()*4); }
        }
        else if (act==='inspect'){
          // click something inside whatever is open
          const hit = await page.evaluate(()=>{
            const v = el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);
              return r.width>6&&r.height>6&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05;};
            const open=[...document.querySelectorAll('div[id]')].filter(e=>v(e)&&
              e.getBoundingClientRect().width>200 && e.getBoundingClientRect().height>140);
            if(!open.length) return null;
            const host=open[open.length-1];
            const kids=[...host.querySelectorAll('button,[role="button"],a,li,[onclick],.row,.card,.tab')].filter(v)
              .filter(e=>!/close|✕|×/i.test((e.getAttribute('aria-label')||'')+(e.textContent||'').slice(0,3)));
            if(!kids.length) return null;
            const e=kids[Math.floor(Math.random()*kids.length)];
            const r=e.getBoundingClientRect();
            return { x:r.left+r.width/2, y:r.top+r.height/2, host:host.id,
                     t:(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,26) };
          });
          if (hit){
            const sig0 = await page.evaluate(()=>document.body.innerText.length);
            if (touch) await page.touchscreen.tap(hit.x,hit.y); else await page.mouse.click(hit.x,hit.y);
            await wait(650);
            const sig1 = await page.evaluate(()=>document.body.innerText.length);
            if (sig0===sig1){ rec.deadClicks++;
              (rec.deadDetail=rec.deadDetail||[]).length<40 && rec.deadDetail.push({k:'inspect',host:hit.host,t:hit.t});
            } else rewarded = true;
          } else { rec.deadClicks++; (rec.deadDetail=rec.deadDetail||[]).length<40 && rec.deadDetail.push({k:'inspect:notarget'}); }
          await think();
        }
        else if (act==='keyboard'){
          const k = pick(['Tab','Tab','Tab','Enter','Escape','ArrowDown','ArrowUp',' ']);
          await page.keyboard.press(k==='Tab'?'Tab':k); await wait(220);
          if (k==='Tab'){
            const foc = await page.evaluate(()=>{ const a=document.activeElement;
              if(!a||a===document.body) return null;
              const r=a.getBoundingClientRect(); const s=getComputedStyle(a);
              return { id:a.id||a.tagName, w:Math.round(r.width), h:Math.round(r.height),
                       inView: r.top>=0&&r.bottom<=window.innerHeight&&r.left>=0&&r.right<=window.innerWidth,
                       outline: s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0,
                       ring: s.boxShadow!=='none' };
            });
            if (foc){ rewarded = true; rec.focusProbe = rec.focusProbe||[]; if(rec.focusProbe.length<14) rec.focusProbe.push(foc); }
            else { rec.deadClicks++; (rec.deadDetail=rec.deadDetail||[]).length<40 && rec.deadDetail.push({k:'tab:nofocus'}); }
          } else rewarded = true;
        }
        else if (act==='search'){
          if (await clickSel('#searchin', 1800)){
            await page.keyboard.type(pick(['earth','titan','iron','xx','   ','<script>','水星']), {delay:35});
            await wait(700);
            const res = await page.evaluate(()=>{const r=document.getElementById('searchres');
              return r?{vis:getComputedStyle(r).display!=='none', n:r.children.length}:null;});
            rec.searchProbe = res; rewarded = !!res;
            await page.keyboard.press('Escape'); await wait(200);
            // clear the field so it doesn't poison later actions
            await page.evaluate(()=>{const i=document.getElementById('searchin'); if(i){i.value='';i.blur();}});
          } else rec.blockedClicks++;
        }
      } catch(e){
        rec.frictionEvents.push('action-throw:'+act+':'+String(e.message).slice(0,70));
      }

      // reward / frustration model
      if (rewarded) noRewardStreak = 0; else noRewardStreak++;
      const tol = 3 + Math.round(persona.patience*9);
      if (noRewardStreak > tol){
        rec.rageQuit = true; rec.quitReason = 'no-progress-streak:'+noRewardStreak; break;
      }
      // stuck-overlay watchdog: an overlay covering the screen with nothing clickable
      if (rec.actions % 12 === 0){
        const ps = await panels();
        const blocker = ps.find(p=>p.blocking && !['fxlayer','cosmos'].includes(p.id));
        if (blocker){
          const escapable = await page.evaluate(id=>{
            const el=document.getElementById(id); if(!el) return true;
            return [...el.querySelectorAll('button,[role="button"],input')].some(e=>{
              const r=e.getBoundingClientRect(); return r.width>2&&r.height>2; });
          }, blocker.id);
          if (!escapable){ rec.stuckOverlay = blocker.id; rec.quitReason='stuck-overlay:'+blocker.id; break; }
        }
      }
      // close whatever is open now and then so the bot returns to the map
      if (rnd() < 0.16){ await page.keyboard.press('Escape'); await wait(260); }
    }

    /* --- wrap up --- */
    await audit('final');
    rec.save = await saveNow();
    const s0 = rec.save0||{}, s1 = rec.save||{};
    rec.progress = {
      landings:(s1.landings|0)-(s0.landings|0), harvests:(s1.harvests|0)-(s0.harvests|0),
      codex:(s1.codex|0)-(s0.codex|0), log:(s1.log|0)-(s0.log|0),
      essence:(s1.essence|0)-(s0.essence|0), charters:(s1.charters|0)-(s0.charters|0),
      saveBytes: s1.bytes|0,
    };
    const T = await page.evaluate(()=>({ ...window.__T, frames: window.__T.frames.slice(-1800) })).catch(()=>null);
    if (T){
      rec.longTasks=T.longTasks; rec.longTaskMs=Math.round(T.longTaskMs); rec.storageFail=T.storageFail;
      for(const e of T.errors) rec.errors.push({m:e.m, ln:e.ln, from:'window'});
      rec.rejections = T.rejections.slice(0,8);
      const f=T.frames.filter(x=>x>0.5).sort((a,b)=>a-b);
      if (f.length>30){
        rec.fps = +(1000/(f.reduce((a,b)=>a+b,0)/f.length)).toFixed(1);
        rec.p95Frame = +f[Math.floor(f.length*0.95)].toFixed(1);
        rec.jank = +(f.filter(x=>x>50).length/f.length*100).toFixed(2);
      }
    }
    if (cfg.screenshot){
      await page.screenshot({ path: cfg.screenshot, fullPage:false }).catch(()=>{});
    }
    rec.ok = true;
  } catch(e){
    rec.fatal = rec.fatal || String(e.message).slice(0,200);
  } finally {
    rec.durationMs = Date.now()-t0;
    rec.errors = rec.errors.slice(0,12);
    rec.consoleErrors = rec.consoleErrors.slice(0,8);
    rec.actionLog = rec.actionLog.slice(0,40);
    rec.frictionEvents = rec.frictionEvents.slice(0,12);
    try { await ctx?.close(); } catch(_){}
  }
  return rec;
}

export async function launch(){
  return chromium.launch({ args:[
    '--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
    '--js-flags=--max-old-space-size=512','--mute-audio',
  ]});
}
