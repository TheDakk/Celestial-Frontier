// Viewport-matrix LAYOUT gate (v1.5.2c, Nick's device-pass mandate).
// jsdom runs logic but performs NO layout — the ✕-bleed, z-order and
// training-overlap bugs were invisible to the whole battery by
// construction. This gate drives the REAL game in headless Edge over CDP
// (stdlib only: fetch + native WebSocket) across phone/tablet/desktop
// viewports and asserts the layout laws on every major surface:
//   ✕ CORNER LAW   — the close sits inside its card corner, tappable,
//                    never overlapping header text
//   Z-ORDER LAW    — probing an open panel's pixels hits the panel,
//                    never a chip/pill underneath
//   NO SIDE-SCROLL — the page body never scrolls horizontally
//   NO CLIPPED TEXT— headers don't truncate against their box
// Screenshots land in tools/uisheets/ as proof sheets per viewport.
// Runs ON TOP of the beta round, with the battery. Exit 1 on any FAIL.
//
// Usage: node tools/uilayout.js [--shots]
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const root = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const _urlArg = process.argv.find((a) => a.startsWith('--url='));
const GAME = _urlArg ? _urlArg.slice(6) : 'file:///' + path.join(root, 'celestial-frontier.html').replace(/\\/g, '/');
const _vpArg = process.argv.find((a) => a.startsWith('--vp='));
const SHOTS = process.argv.includes('--shots');
const SHEET_DIR = path.join(__dirname, 'uisheets');

const VIEWPORTS = [
  { id: 'iphone-se',   w: 375,  h: 667,  mobile: true,  dpr: 2 },
  { id: 'iphone',      w: 393,  h: 852,  mobile: true,  dpr: 3 },
  { id: 'iphone-max',  w: 430,  h: 932,  mobile: true,  dpr: 3 },
  { id: 'android',     w: 412,  h: 915,  mobile: true,  dpr: 2.6 },
  { id: 'ipad-port',   w: 768,  h: 1024, mobile: true,  dpr: 2 },
  { id: 'ipad-land',   w: 1024, h: 768,  mobile: true,  dpr: 2 },
  { id: 'laptop',      w: 1366, h: 768,  mobile: false, dpr: 1 },
  { id: 'desktop',     w: 1920, h: 1080, mobile: false, dpr: 1 },
  { id: 'wide',        w: 2560, h: 1440, mobile: false, dpr: 1 },
];
// Each surface: open() drives the UI; panel = the element whose layout we judge.
const SURFACES = [
  { id: 'charters',  btn: 'chbtn',    panel: 'chpanel' },
  { id: 'compendium',btn: 'codexbtn', panel: 'codex' },
  { id: 'atlas',     btn: 'logbtn',   panel: 'log' },
  { id: 'records',   btn: 'recbtn',   panel: 'records' },
  { id: 'sheet',     btn: 'rank',     panel: 'sheetcard' },
  { id: 'shipyard',  btn: 'cargobtn', panel: 'yardcard' },
  { id: 'settings',  btn: 'setbtn',   panel: 'setpanel' },
  { id: 'tray',      btn: 'bell',     panel: 'tray' },
];

let seq = 0, ws, pend = new Map();
function send(method, params, sessionId) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
  return new Promise((res, rej) => pend.set(id, { res, rej }));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evalIn(sess, expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
  if (r.exceptionDetails) throw new Error('page eval: ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text).slice(0, 300));
  return r.result && r.result.value;
}

async function main() {
  if (!fs.existsSync(EDGE)) { console.error('Edge not found at ' + EDGE); process.exit(2); }
  if (SHOTS && !fs.existsSync(SHEET_DIR)) fs.mkdirSync(SHEET_DIR);
  const udd = path.join(require('os').tmpdir(), 'cf-uilayout-' + Date.now());
  const port = 9223 + (process.pid % 500);
  const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--remote-debugging-port=' + port, '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
  let browserWs = null;
  for (let t = 0; t < 60 && !browserWs; t++) {
    await sleep(400);
    try { const v = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); browserWs = v.webSocketDebuggerUrl; } catch (_) {}
  }
  if (!browserWs) { console.error('CDP endpoint never came up'); edge.kill(); process.exit(2); }
  ws = new WebSocket(browserWs);
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  };
  await new Promise((r) => { ws.onopen = r; });

  const results = [];
  const check = (vp, surf, name, ok, detail) => {
    results.push({ vp: vp.id, surf, name, ok, detail: detail || '' });
    if (!ok) console.log('FAIL  [' + vp.id + '] ' + surf + ' — ' + name + (detail ? '  (' + detail + ')' : ''));
  };

  for (const vp of VIEWPORTS.filter((v) => !_vpArg || _vpArg.slice(5).split(',').includes(v.id))) {
    const t = await send('Target.createTarget', { url: 'about:blank' });
    const at = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
    const sess = at.sessionId;
    await send('Runtime.enable', {}, sess);
    await send('Page.enable', {}, sess);
    await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, mobile: vp.mobile }, sess);
    if (vp.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sess);
    // every viewport gets a FRESH expedition: clear storage BEFORE the game
    // script ever runs (a post-boot clear races the live game's save flush,
    // which resurrects the old expedition for the next viewport)
    await send('Page.addScriptToEvaluateOnNewDocument', { source: 'try{localStorage.clear()}catch(_){}' }, sess);
    await send('Page.navigate', { url: GAME }, sess);
    await sleep(2500);
    const coarse = await evalIn(sess, `matchMedia('(pointer:coarse)').matches`);
    if (vp.mobile) check(vp, 'boot', 'coarse-pointer emulation active', !!coarse, 'pnx touch sizing rules ' + (coarse ? 'apply' : 'DO NOT apply'));
    const booted = await evalIn(sess, `(async()=>{
      const click=(el)=>{ if(!el) return false; for(const t of ['pointerdown','pointerup','click']) el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); return true; };
      const vis=(el)=>el&&el.style.display!=='none'&&el.offsetParent!==null||el&&getComputedStyle(el).display!=='none';
      const until=async(f,ms)=>{ const t0=Date.now(); while(Date.now()-t0<ms){ try{ if(f()) return true; }catch(_){} await new Promise(r=>setTimeout(r,120)); } return false; };
      /* the FRESH-EXPEDITION sequence: name → bulletin → training. Handle
         each gate as it appears, in order, with patience for cold boots. */
      if(await until(()=>vis(document.getElementById('namebox')),12000)){
        const inp=document.getElementById('namein');
        if(inp){ inp.value='Layout Gate'; inp.dispatchEvent(new Event('input',{bubbles:true})); }
        await new Promise(r=>setTimeout(r,150));
        click(document.getElementById('nameok'));
        await until(()=>!vis(document.getElementById('namebox')),4000);
      }
      for(let a=0;a<4 && !vis(document.getElementById('tutbox'));a++){
        if(document.getElementById('relok')) click(document.getElementById('relok'));
        await until(()=>vis(document.getElementById('tutbox')),5000);
      }
      if(!vis(document.getElementById('tutbox'))) return false;   /* training never began — a half-boot is a FAIL, not a pass */
      click(document.getElementById('tut-skip'));
      await until(()=>document.getElementById('tut-skip-yes'),3000);
      click(document.getElementById('tut-skip-yes'));
      await until(()=>!vis(document.getElementById('tutbox')),5000);
      /* POSITIVE completion proof — the save itself must say training is
         done; absence of the tutbox alone proved nothing (the half-boot
         lesson: two viewports passed vacuously and every law after lied).
         The save is debounced — wait for the flush before judging. */
      const saved=await until(()=>/"tut":(true|1)/.test(localStorage.getItem('cfcc_save_v2')||''),8000);
      const sv=localStorage.getItem('cfcc_save_v2')||'';
      return { ok: !vis(document.getElementById('tutbox')) && !vis(document.getElementById('namebox')) && saved,
        tb: vis(document.getElementById('tutbox')), nb: vis(document.getElementById('namebox')), saved, svLen: sv.length,
        tutAt: sv.indexOf('tut'), tutCtx: sv.indexOf('tut')>=0 ? sv.slice(Math.max(0,sv.indexOf('tut')-12), sv.indexOf('tut')+28) : '(no tut key at all)' };
    })()`);
    check(vp, 'boot', 'boots and training skips', !!(booted && booted.ok), booted && !booted.ok ? JSON.stringify(booted) : '');
    if (!booted || !booted.ok) {
      try {
        if (!fs.existsSync(SHEET_DIR)) fs.mkdirSync(SHEET_DIR);
        const shot = await send('Page.captureScreenshot', { format: 'png' }, sess);
        fs.writeFileSync(path.join(SHEET_DIR, 'BOOT-FAIL-' + vp.id + '.png'), Buffer.from(shot.data, 'base64'));
      } catch (_) {}
      await send('Target.closeTarget', { targetId: t.targetId }); continue;
    }

    /* THE OVERLAY-EATER HUNT (Nick's field report: Charters dead + a stuck
       HP tooltip): every rail button's own pixels must belong to it —
       probed cold, then after the bell tray opens/closes, then after the
       search box is used and left. An invisible right-anchored layer
       (tray, searchres) that eats clicks fails here by name. */
    for (const phase of ['cold', 'after-tray', 'after-search']) {
      const rh = await evalIn(sess, `(async()=>{
        const click=(el)=>{ if(!el) return false; for(const t of ['pointerdown','pointerup','click']) el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); return true; };
        const S=(ms)=>new Promise(r=>setTimeout(r,ms));
        if(${JSON.stringify(phase)}==='after-tray'){ click(document.getElementById('bell')); await S(250); click(document.getElementById('bell')); await S(250); }
        if(${JSON.stringify(phase)}==='after-search'){
          const si=document.getElementById('search')||document.querySelector('#searchwrap input');
          if(si){ si.focus(); si.value='xy'; si.dispatchEvent(new Event('input',{bubbles:true})); await S(300);
                  si.value=''; si.dispatchEvent(new Event('input',{bubbles:true}));
                  si.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); si.blur(); await S(300); }
        }
        const out={};
        for(const id of ['chbtn','codexbtn','logbtn','recbtn','bell','cargobtn']){
          const b=document.getElementById(id);
          if(!b || getComputedStyle(b).display==='none'){ out[id]='(hidden)'; continue; }
          const r=b.getBoundingClientRect(), hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
          out[id]=(hit&&(hit===b||b.contains(hit)||hit.contains(b)))?'ok':((hit&&(hit.id||hit.className||hit.tagName))||'null')+'';
        }
        return out;
      })()`);
      for (const id in rh) {
        if (rh[id] !== 'ok' && rh[id] !== '(hidden)') check(vp, 'rail-' + phase, id + ' pixels belong to it', false, 'eaten by ' + rh[id]);
      }
      check(vp, 'rail-' + phase, 'rail buttons all reachable', Object.values(rh).every((v) => v === 'ok' || v === '(hidden)'));
    }
    for (const s of SURFACES) {
      const r = await evalIn(sess, `(async()=>{
        const click=(el)=>{ if(!el) return false; for(const t of ['pointerdown','pointerup','click']) el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); return true; };
        const until=async(f,ms)=>{ const t0=Date.now(); while(Date.now()-t0<ms){ try{ if(f()) return true; }catch(_){} await new Promise(r=>setTimeout(r,120)); } return false; };
        const R=(el)=>{ const b=el.getBoundingClientRect(); return {l:b.left,t:b.top,r:b.right,b:b.bottom,w:b.width,h:b.height}; };
        const sect=(a,b)=>Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.t,b.t));
        const out={open:false, xIn:null, xOverText:null, xHit:null, zTop:null, sideScroll:null, clipped:[]};
        const btn=document.getElementById(${JSON.stringify(s.btn)});
        if(!btn) return out;
        click(btn);
        const panel=()=>document.getElementById(${JSON.stringify(s.panel)});
        out.open=await until(()=>{ const p=panel(); return p&&getComputedStyle(p).display!=='none'&&p.getBoundingClientRect().width>10; },4000);
        if(!out.open) return out;
        await new Promise(r=>setTimeout(r,220));   /* let layout settle before measuring */
        const p=panel(), pr=R(p);
        /* ✕ corner law */
        const x=p.querySelector('[data-pnx]')||p.querySelector('.vxc')||(p.closest('div')&&p.parentElement.querySelector('[data-pnx]'));
        if(x){
          const xr=R(x);
          out.xr=xr; out.pr=pr; out.xTag=(x.className||'')+'#'+(x.dataset&&x.dataset.pnx||'');
          /* the LAW is upper-right WITH AIR — not merely "inside": a ✕
             auto-placed into a grid's bottom row passed the old check
             (Nick's sheet screenshot). Corner region = top 70px, right 70px. */
          out.xIn = xr.l>=pr.l-2 && xr.r<=pr.r+2 && xr.t>=pr.t-2 && xr.t<=pr.t+70 && xr.r>=pr.r-70;
          out.xOverText=0;
          /* measure GLYPHS, not boxes: floated ✕ makes text wrap around it,
             so a header's border-box may intersect while its text is clear —
             range client-rects follow the actual rendered lines */
          for(const h of p.querySelectorAll('.ehead,.chead,.shead,h3,.tt,.gh,.vh')){
            if(h.contains(x)||x.contains(h)) continue;
            try{
              const rg=document.createRange(); rg.selectNodeContents(h);
              for(const cr of rg.getClientRects()){
                if(cr.width<2) continue;
                if(sect(xr,{l:cr.left,t:cr.top,r:cr.right,b:cr.bottom})>30){ out.xOverText+=1; break; }
              }
            }catch(_){ }
          }
          try{ x.scrollIntoView({block:'nearest'}); }catch(_){ }
          const xr2=R(x), cx=(xr2.l+xr2.r)/2, cy=(xr2.t+xr2.b)/2;
          const hit=document.elementFromPoint(cx,cy);
          out.xHit = !!(hit && (hit===x||x.contains(hit)||hit.contains(x)));
          if(!out.xHit) out.xHitBy=(hit?(hit.id||hit.className||hit.tagName):'null@'+Math.round(cx)+','+Math.round(cy))+'';
        }
        /* z-order law: the open panel's top corners belong to the panel */
        out.zTop=true;
        /* sample the top corners AND the left/right edge columns — chips
           overlap panel EDGES rows below the top (Nick's screenshot) */
        const zpts=[[pr.l+6,pr.t+6],[pr.r-6,pr.t+6],[(pr.l+pr.r)/2,pr.t+4]];
        for(const dy of [40,80,130,190]){ if(pr.t+dy<pr.b-6){ zpts.push([pr.l+6,pr.t+dy],[pr.r-6,pr.t+dy]); } }
        for(const pt of zpts){
          if(pt[0]<0||pt[1]<0||pt[0]>innerWidth||pt[1]>innerHeight) continue;
          const e=document.elementFromPoint(pt[0],pt[1]);
          if(e && !p.contains(e) && !e.contains(p)){ out.zTop=false; out.zHit=(e.id||e.className||e.tagName)+''; break; }
        }
        /* no sideways scroll */
        out.sideScroll=(document.scrollingElement.scrollWidth>innerWidth+2);
        /* clipped headers */
        for(const h of p.querySelectorAll('.ehead,.chead,.shead,h3')){
          if(h.scrollWidth>h.clientWidth+3) out.clipped.push((h.textContent||'').slice(0,30));
        }
        click(btn);   /* fold it back */
        return out;
      })()`);
      if (!r || !r.open) { check(vp, s.id, 'opens', false, 'panel never became visible'); continue; }
      check(vp, s.id, 'opens', true);
      if (r.xIn !== null) {
        check(vp, s.id, '✕ sits inside the corner', !!r.xIn, r.xIn ? '' : 'x=' + JSON.stringify(r.xr) + ' panel=' + JSON.stringify(r.pr) + ' ' + r.xTag);
        check(vp, s.id, '✕ clear of header text', r.xOverText === 0, r.xOverText ? r.xOverText + ' header(s) under it' : '');
        check(vp, s.id, '✕ is hittable (top of stack)', !!r.xHit, r.xHit ? '' : 'hit by ' + (r.xHitBy || '?'));
      }
      check(vp, s.id, 'panel is top of stack (z-order law)', !!r.zTop, r.zHit ? 'covered by ' + r.zHit : '');
      check(vp, s.id, 'no horizontal page scroll', !r.sideScroll);
      check(vp, s.id, 'no clipped headers', r.clipped.length === 0, r.clipped.join('|'));
      if (SHOTS) {
        try {
          await evalIn(sess, `(()=>{ const b=document.getElementById(${JSON.stringify(s.btn)}); for(const t of ['pointerdown','pointerup','click']) b.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); })()`);
          await sleep(250);
          const shot = await send('Page.captureScreenshot', { format: 'png' }, sess);
          fs.writeFileSync(path.join(SHEET_DIR, vp.id + '-' + s.id + '.png'), Buffer.from(shot.data, 'base64'));
          await evalIn(sess, `(()=>{ const b=document.getElementById(${JSON.stringify(s.btn)}); for(const t of ['pointerdown','pointerup','click']) b.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); })()`);
        } catch (_) {}
      }
    }
    await send('Target.closeTarget', { targetId: t.targetId });
  }

  const fails = results.filter((r) => !r.ok);
  const byVp = {};
  for (const r of results) { byVp[r.vp] = byVp[r.vp] || { pass: 0, fail: 0 }; byVp[r.vp][r.ok ? 'pass' : 'fail']++; }
  console.log('\n=== UI LAYOUT GATE ===');
  for (const k in byVp) console.log('  ' + k.padEnd(11) + ' ' + byVp[k].pass + ' pass' + (byVp[k].fail ? '  ' + byVp[k].fail + ' FAIL' : ''));
  console.log(fails.length ? 'GATE: FAIL (' + fails.length + ')' : 'GATE: PASS (' + results.length + ' checks, ' + VIEWPORTS.length + ' viewports)');
  fs.writeFileSync(path.join(__dirname, 'uilayout-report.json'), JSON.stringify({ results }, null, 1));
  try { ws.close(); } catch (_) {}
  edge.kill();
  process.exit(fails.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
