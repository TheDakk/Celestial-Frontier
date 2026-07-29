/* Clean serial responsive + performance pass.
   One device at a time, nothing else running, so FPS/jank and layout geometry
   are trustworthy. Captures a screenshot storyboard at each game state. */
import { launch, DEVICES, AUDIT, SCAN_TARGETS } from './bot.mjs';
import fs from 'fs';

const OUT = process.env.CF_OUT || '../out/responsive';
fs.mkdirSync(OUT, { recursive:true });
const URL = process.env.CF_URL || 'http://127.0.0.1:8899/game.html';

const results = [];
const br = await launch();

for (const [id,label,cls,vw,vh,dpr,touch] of DEVICES){
  const t0=Date.now();
  const rec = { id,label,cls,vw,vh,dpr,touch, states:[], errors:[], fps:null, p95Frame:null, jank:0, bootMs:null };
  let ctx,page;
  try {
    ctx = await br.newContext({ viewport:{width:vw,height:vh}, deviceScaleFactor:Math.min(dpr,2),
      isMobile:touch, hasTouch:touch,
      userAgent: touch ? (cls==='tablet'
        ? 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1') : undefined });
    await ctx.addInitScript(()=>{
      const T={errors:[],frames:[],longTasks:0,longTaskMs:0}; window.__T=T;
      addEventListener('error',e=>T.errors.push(String(e.message).slice(0,200)));
      addEventListener('unhandledrejection',e=>T.errors.push('rej:'+String(e.reason).slice(0,160)));
      try{ new PerformanceObserver(l=>{for(const e of l.getEntries()){T.longTasks++;T.longTaskMs+=e.duration;}})
        .observe({entryTypes:['longtask']}); }catch(_){}
      let prev=performance.now();
      const tick=t=>{const d=t-prev;prev=t;if(d>0&&d<2000)T.frames.push(d);requestAnimationFrame(tick);};
      requestAnimationFrame(tick);
    });
    page = await ctx.newPage();
    page.on('pageerror',e=>rec.errors.push(String(e.message).slice(0,200)));
    page.on('console',m=>{ if(m.type()==='error'){const t=m.text();if(!/version\.json/.test(t))rec.errors.push('con:'+t.slice(0,160));}});

    await page.goto(URL,{waitUntil:'load',timeout:60000});
    rec.bootMs = Date.now()-t0;
    await page.waitForTimeout(2200);

    const cap = async (state) => {
      const file = `${id}__${state}.png`;
      await page.screenshot({ path:`${OUT}/${file}` }).catch(()=>{});
      let a=null; try{ a = await page.evaluate(AUDIT, touch); }catch(_){}
      // where is the safe area / does the game honour env(safe-area-inset)?
      let extra=null;
      try { extra = await page.evaluate(()=>({
        scrollTop: document.scrollingElement? document.scrollingElement.scrollTop:0,
        bodyOverflowY: getComputedStyle(document.body).overflowY,
        canvasH: (document.getElementById('cosmos')||{}).height||0,
        vvH: (window.visualViewport||{}).height||null,
        innerH: window.innerHeight,
        hintVisible: (()=>{const e=document.getElementById('hint');
          if(!e||getComputedStyle(e).display==='none')return false;
          const r=e.getBoundingClientRect(); return r.bottom<=window.innerHeight+1 && r.top>=0;})(),
        topbarH: (()=>{const e=document.getElementById('topbar');return e?Math.round(e.getBoundingClientRect().height):0;})(),
      })); } catch(_){}
      rec.states.push({ state, file, audit:a, extra });
      return a;
    };

    await cap('01-name-gate');
    await page.click('#namein',{timeout:8000}).catch(()=>{});
    await page.keyboard.type('Auditor',{delay:20});
    await page.click('#nameok',{timeout:8000}).catch(()=>{});
    await page.waitForTimeout(1500);
    await cap('02-after-name');
    await page.click('#relok',{timeout:6000}).catch(()=>{});
    await page.waitForTimeout(1400);
    await cap('03-field-training');

    // skip training to reach the live game
    if (await page.locator('#tut-skip').isVisible().catch(()=>false)){
      await page.click('#tut-skip').catch(()=>{}); await page.waitForTimeout(600);
      await cap('04-skip-confirm');
      await page.click('#tut-skip-yes').catch(()=>{}); await page.waitForTimeout(1400);
    }
    await cap('05-system-map');

    /* Clear any blocking overlay the way a player would: press Escape first
       (and record whether that worked), then fall back to the close control. */
    const OVERLAY_IDS = ['vistabox','relbox','primebox','endingbox','guidebox','helppop','sharebox',
                         'duelbox','pickbox','reveal','descbox','deathbox','farewellbox','setpanel','tutbox'];
    const topOverlay = async () => page.evaluate(ids=>{
      for (const id of ids){ const el=document.getElementById(id);
        if(!el) continue; const s=getComputedStyle(el);
        if(s.display==='none'||s.visibility==='hidden'||+s.opacity<0.05) continue;
        const r=el.getBoundingClientRect();
        if(r.width>140&&r.height>110) return {id, w:Math.round(r.width), h:Math.round(r.height)};
      }
      return null;
    }, OVERLAY_IDS).catch(()=>null);
    const clearOverlays = async (probeEscape=true) => {
      for (let i=0;i<6;i++){
        const ov = await topOverlay();
        if (!ov) return;
        if (probeEscape){
          await page.keyboard.press('Escape').catch(()=>{});
          await page.waitForTimeout(450);
          const after = await topOverlay();
          const gone = !after || after.id!==ov.id;
          rec.escapeProbe = rec.escapeProbe||{};
          if (!(ov.id in rec.escapeProbe)) rec.escapeProbe[ov.id] = gone;
          if (gone) continue;
        }
        // close control, else tap the middle (several overlays are tap-to-continue)
        const closed = await page.evaluate(id=>{
          const el=document.getElementById(id); if(!el) return false;
          const btn=[...el.querySelectorAll('button,[role="button"],.pxclose,[aria-label]')]
            .find(e=>{ const r=e.getBoundingClientRect(); if(r.width<6||r.height<6) return false;
              const t=((e.getAttribute('aria-label')||'')+' '+(e.textContent||'')).trim();
              return /^(✕|×|x|close|continue|got it|ok|dismiss)/i.test(t); });
          if(btn){ btn.click(); return true; }
          return false;
        }, ov.id).catch(()=>false);
        if (!closed){
          const c = await page.evaluate(id=>{ const el=document.getElementById(id); if(!el) return null;
            const r=el.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2}; }, ov.id);
          if (c){ if(touch) await page.touchscreen.tap(c.x,c.y).catch(()=>{}); else await page.mouse.click(c.x,c.y).catch(()=>{}); }
        }
        await page.waitForTimeout(700);
      }
      rec.stuckOverlay = (await topOverlay())?.id || null;
    };

    // open a survey card on a real body
    const named = await page.evaluate(SCAN_TARGETS, 3000).catch(()=>[]);
    rec.scanned = named.map(n=>n.name);
    if (named.length){
      const t = named[0];
      if (touch) await page.touchscreen.tap(t.x,t.y); else await page.mouse.click(t.x,t.y);
      await page.waitForTimeout(1200);
      await cap('06-survey-card');
      // try landing
      const land = await page.evaluate(()=>{ const p=document.getElementById('panel'); if(!p) return null;
        const b=[...p.querySelectorAll('button,[role="button"],div')]
          .find(e=>/^\s*land\s*$/i.test((e.textContent||'').trim()));
        if(!b) return null; const r=b.getBoundingClientRect();
        return {x:r.left+r.width/2,y:r.top+r.height/2}; });
      if (land){
        if (touch) await page.touchscreen.tap(land.x,land.y); else await page.mouse.click(land.x,land.y);
        await page.waitForTimeout(2400);
        await cap('07-planetside');
        await clearOverlays();          // records whether Escape dismissed the vista
        await page.waitForTimeout(600);
      }
    }
    await clearOverlays();
    await page.keyboard.press('Escape').catch(()=>{});
    await page.waitForTimeout(400);

    /* every panel, one at a time — from a known-clear starting state */
    const PMAP = {'#logbtn':'log','#codexbtn':'codex','#cargobtn':'yard','#recbtn':'records',
                  '#chbtn':'chpanel','#pcdxbtn':'primebox','#setbtn':'setpanel','#helpbtn':'helppop','#bell':'tray'};
    const PANELS = [['08-atlas','#logbtn'],['09-compendium','#codexbtn'],['10-shipyard','#cargobtn'],
                    ['11-records','#recbtn'],['12-charters','#chbtn'],['13-prime-codex','#pcdxbtn'],
                    ['14-settings','#setbtn'],['15-guide','#helpbtn'],['16-notifications','#bell']];
    rec.panelProbe = {};
    for (const [state,sel] of PANELS){
      await clearOverlays(false);                      // don't let leftovers block the click
      const clicked = await page.click(sel,{timeout:4000}).then(()=>true).catch(()=>false);
      await page.waitForTimeout(1200);
      const shown = await page.evaluate(id=>{ const el=document.getElementById(id);
        if(!el) return null; const s=getComputedStyle(el);
        if(s.display==='none'||s.visibility==='hidden'||+s.opacity<0.05) return false;
        const r=el.getBoundingClientRect(); return r.width>40&&r.height>30; }, PMAP[sel]).catch(()=>null);
      await cap(state);
      const st = rec.states[rec.states.length-1];
      st.clicked = clicked; st.opened = shown;
      if (!clicked || shown===false) st.openFailed = true;

      // does Escape close it? (only meaningful if it actually opened)
      let escClosed = null;
      if (shown){
        await page.keyboard.press('Escape').catch(()=>{});
        await page.waitForTimeout(600);
        const still = await page.evaluate(id=>{ const el=document.getElementById(id);
          if(!el) return false; const s=getComputedStyle(el);
          if(s.display==='none'||s.visibility==='hidden'||+s.opacity<0.05) return false;
          const r=el.getBoundingClientRect(); return r.width>40&&r.height>30; }, PMAP[sel]).catch(()=>false);
        escClosed = !still;
        if (still){
          /* force it shut so the next panel starts clean: the panel's own close
             control first, then the rail button, then verify. */
          for (let k=0;k<3;k++){
            const gone = await page.evaluate(id=>{
              const el=document.getElementById(id); if(!el) return true;
              const s=getComputedStyle(el);
              if(s.display==='none'||s.visibility==='hidden') return true;
              const btn=[...el.querySelectorAll('button,[role="button"],.pxclose,[aria-label],div,span')]
                .find(e=>{ const r=e.getBoundingClientRect(); if(r.width<8||r.height<8) return false;
                  const t=((e.getAttribute('aria-label')||'')+' '+(e.textContent||'')).trim();
                  return /^(✕|×|✖|x|close|done|back)$/i.test(t); });
              if(btn){ btn.click(); return false; }
              return false;
            }, PMAP[sel]).catch(()=>false);
            await page.waitForTimeout(450);
            const open = await page.evaluate(id=>{ const el=document.getElementById(id);
              if(!el) return false; const s=getComputedStyle(el);
              if(s.display==='none'||s.visibility==='hidden') return false;
              const r=el.getBoundingClientRect(); return r.width>40&&r.height>30; }, PMAP[sel]).catch(()=>false);
            if (!open) break;
            if (k===0) await page.click(sel,{timeout:2000}).catch(()=>{});
            else await page.evaluate(id=>{ const el=document.getElementById(id);
              if(el) el.style.display='none'; }, PMAP[sel]).catch(()=>{});   // last resort so the run stays valid
            await page.waitForTimeout(400);
          }
        }
      }
      st.escapeClosed = escClosed;
      rec.panelProbe[sel] = { opened:shown, escapeClosed:escClosed };
      await clearOverlays(false);
    }

    const T = await page.evaluate(()=>({...window.__T, frames:window.__T.frames.slice(-2400)})).catch(()=>null);
    if (T){
      const f=T.frames.filter(x=>x>0.5).sort((a,b)=>a-b);
      if(f.length>40){
        rec.fps=+(1000/(f.reduce((a,b)=>a+b,0)/f.length)).toFixed(1);
        rec.p95Frame=+f[Math.floor(f.length*0.95)].toFixed(1);
        rec.jank=+(f.filter(x=>x>50).length/f.length*100).toFixed(2);
      }
      rec.longTasks=T.longTasks; rec.longTaskMs=Math.round(T.longTaskMs);
      rec.errors.push(...T.errors.slice(0,6));
    }
  } catch(e){ rec.fatal=String(e.message).slice(0,200); }
  finally { try{ await ctx?.close(); }catch(_){} }
  rec.wallMs = Date.now()-t0;
  results.push(rec);
  console.log(`${id.padEnd(18)} ${String(vw).padStart(4)}x${String(vh).padEnd(4)} fps=${String(rec.fps).padStart(5)} jank=${String(rec.jank).padStart(5)}% states=${rec.states.length} err=${rec.errors.length} ${rec.fatal||''}`);
  fs.writeFileSync(process.env.CF_JSON || '../out/responsive.json', JSON.stringify(results,null,1));
}
await br.close();
console.log('DONE', results.length, 'devices');
