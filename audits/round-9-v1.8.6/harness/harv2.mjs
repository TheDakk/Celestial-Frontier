/* CF1805-05 end to end. Earth is settled from the first frame, so its card
   carries Harvest as soon as the card is locked. Stay inside training (step 6
   allows #panel) so the card is reliably reachable, and reload between cycles —
   _hvMono is in-memory, so a reload empties the only gate meant to stop this. */
import { chromium } from 'playwright';
import { SCAN_TARGETS, FIND_TARGETS, TUT_STATE } from './bot9.mjs';
const CLOCK = () => { const R=Date;
  const now=()=>R.now()+(+(localStorage.getItem('__clk')||0));
  const D=function(...a){ return a.length?new R(...a):new R(now()); };
  D.now=now; D.parse=R.parse; D.UTC=R.UTC; D.prototype=R.prototype; window.Date=D; };
const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
const ctx=await br.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
await p.addInitScript(CLOCK);
const pick=a=>a[(Math.random()*a.length)|0];
const hasHarv=()=>p.evaluate(()=>{const e=document.getElementById('panel');
  return !!e&&getComputedStyle(e).display!=='none'&&!!e.querySelector('[data-act="harv"]');});
const ess=()=>p.evaluate(()=>{try{const d=JSON.parse(localStorage.getItem('cfcc_save_v2')||'{}');
  return {e:d.essence|0,h:d.harvests|0};}catch(_){return{e:-1,h:-1};}});

async function reachEarth(){
  if(await hasHarv()) return true;
  let g=0;
  while(g++<40){
    const ts=await p.evaluate(TUT_STATE).catch(()=>null);
    if(!ts) break;
    if(ts.step>=6){ if(await hasHarv()) return true; }
    if(ts.actBtn){ try{ await p.click('#tut-act',{timeout:2500}); }catch(_){} }
    else if(ts.spot){ await p.mouse.click(ts.spot.x,ts.spot.y); }
    else { const named=await p.evaluate(SCAN_TARGETS,2600).catch(()=>[]);
      let t=named.find(n=>/^earth/i.test(n.name))||(named.length?pick(named):null);
      if(!t){const tg=await p.evaluate(FIND_TARGETS).catch(()=>[]); if(tg.length) t=pick(tg);}
      if(t){ await p.mouse.click(t.x,t.y); await p.waitForTimeout(500);
        const hit=await p.evaluate(()=>{const s=document.getElementById('tutspot');
          if(s&&getComputedStyle(s).display!=='none'){const r=s.getBoundingClientRect();
            if(r.width>2)return{x:r.left+r.width/2,y:r.top+r.height/2};}return null;}).catch(()=>null);
        if(hit) await p.mouse.click(hit.x,hit.y);} }
    await p.waitForTimeout(700);
    if(await hasHarv()) return true;
  }
  // training over: travel to Earth via the Star Atlas first, then scan
  for(let k=0;k<3;k++){
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await p.evaluate(()=>{const e=document.getElementById('log');
      if(!e||getComputedStyle(e).display==='none') document.getElementById('logbtn')?.click();});
    await p.waitForTimeout(900);
    const it=await p.evaluate(()=>{const rows=[...document.querySelectorAll('#log .item')];
      const e=rows.find(x=>/earth/i.test(x.innerText||''))||rows[0];
      if(!e) return null; e.scrollIntoView({block:'center'});
      const r=e.getBoundingClientRect(); if(r.height<3) return null;
      return {x:Math.round(r.left+r.width*0.4),y:Math.round(r.top+r.height/2)};});
    if(it){ await p.mouse.click(it.x,it.y); await p.waitForTimeout(2200); }
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    if(await hasHarv()) return true;
    const named=await p.evaluate(SCAN_TARGETS,3500).catch(()=>[]);
    for(const t of named.filter(n=>/^earth/i.test(n.name)).concat(named).slice(0,10)){
      await p.mouse.move(t.x,t.y); await p.waitForTimeout(150);
      await p.mouse.click(t.x,t.y); await p.waitForTimeout(800);
      if(await hasHarv()) return true; }
  }
  for(let k=0;k<1;k++){
    const named=await p.evaluate(SCAN_TARGETS,3000).catch(()=>[]);
    for(const t of named.filter(n=>/^earth/i.test(n.name)).concat(named).slice(0,8)){
      await p.mouse.move(t.x,t.y); await p.waitForTimeout(150);
      await p.mouse.click(t.x,t.y); await p.waitForTimeout(800);
      if(await hasHarv()) return true; } }
  return false;
}
async function press(){
  const b=await p.evaluate(()=>{const e=document.querySelector('#panel [data-act="harv"]');
    if(!e) return null; e.scrollIntoView({block:'center'});
    const r=e.getBoundingClientRect(); if(r.height<3) return null;
    return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),
            t:(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,32)};});
  if(!b) return {pressed:false};
  await p.mouse.click(b.x,b.y); await p.waitForTimeout(1600);
  const toast=await p.evaluate(()=>{const t=document.getElementById('toast');
    return t&&getComputedStyle(t).display!=='none'?(t.innerText||'').replace(/\s+/g,' ').slice(0,64):null;});
  return {pressed:true,label:b.t,toast};
}
await p.goto('http://127.0.0.1:8910/game.html',{waitUntil:'load',timeout:60000});
await p.waitForTimeout(3000);
try{ await p.fill('#namein','Harv',{timeout:6000}); await p.click('#nameok',{timeout:6000}); }catch(_){}
await p.waitForTimeout(1400);
console.log('Earth card with Harvest (in training):', await reachEarth());
/* v1.8.6 refuses card verbs during Field Training (_tutRefuse) — leave training
   first, then re-lock Earth's card, or the press is a designed no-op. */
for(let k=0;k<5;k++){ try{ await p.click('#tut-skip',{timeout:2000}); await p.waitForTimeout(400);
  await p.click('#tut-skip-yes',{timeout:1500}); }catch(_){} await p.waitForTimeout(700);
  const still=await p.evaluate(()=>{const t=document.getElementById('tutbox');
    return !!t&&getComputedStyle(t).display!=='none';});
  if(!still) break; }
console.log('training still running:', await p.evaluate(()=>{const t=document.getElementById('tutbox');
  return !!t&&getComputedStyle(t).display!=='none';}));
console.log('Earth card with Harvest (after skip):', await reachEarth());

let b=await ess(); let r=await press(); await p.waitForTimeout(900); let a=await ess();
console.log(`\n1. legitimate harvest      "${r.label||''}"  ☄ ${b.e}→${a.e}  harvests ${b.h}→${a.h}`);
console.log(`   toast: ${r.toast||'(none)'}`);

b=a; r=await press(); await p.waitForTimeout(700); a=await ess();
console.log(`2. immediate retry         ☄ ${b.e}→${a.e}  → ${a.e>b.e?'PAID ✗':'refused ✓'}   ${r.toast||''}`);

await p.evaluate(()=>localStorage.setItem('__clk',String(3660e3)));
await p.waitForTimeout(300);
b=a; r=await press(); await p.waitForTimeout(700); a=await ess();
console.log(`3. clock +1h, NO reload    ☄ ${b.e}→${a.e}  → ${a.e>b.e?'PAID ✗ (in-session gate failed)':'refused ✓ (_hvMono held)'}`);
console.log(`   toast: ${r.toast||'(none)'}`);

console.log('\n--- now the same clock, but reload first ---');
for(let cycle=1;cycle<=3;cycle++){
  await p.evaluate(c=>localStorage.setItem('__clk',String(3660e3*c)),cycle);
  await p.reload({waitUntil:'load',timeout:60000});
  await p.waitForTimeout(3000);
  const ok=await reachEarth();
  b=await ess(); r=await press(); await p.waitForTimeout(900); a=await ess();
  console.log(`   cycle ${cycle}: card=${ok}  ☄ ${b.e}→${a.e} (+${a.e-b.e})  harvests ${b.h}→${a.h}   ${r.toast?('· '+r.toast.slice(0,42)):''}`);
}
const fin=await ess();
console.log(`\nVERDICT: ${fin.h>1
  ? 'CF1805-05 STILL OPEN ✗ — '+fin.h+' harvests, ☄ '+fin.e+', from one hour of real time'
  : 'CF1805-05 closed ✓ — the reload path is guarded'}`);
await br.close();
