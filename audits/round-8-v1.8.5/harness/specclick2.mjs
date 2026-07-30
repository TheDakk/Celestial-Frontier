/* Same question, but with REAL pointer input at real coordinates — removing the
   synthetic-click variable entirely before anything gets reported. */
import { chromium } from 'playwright';
import { SCAN_TARGETS, FIND_TARGETS, TUT_STATE } from './bot.mjs';
const URL='http://127.0.0.1:8906/game.html';
const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
const pick=a=>a[(Math.random()*a.length)|0];
const ctx=await br.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
const openShelves=async()=>{ const n=await p.evaluate(()=>document.querySelectorAll('#codex .cgh').length);
  for(let k=0;k<n;k++){ const b=await p.evaluate(k=>{const h=[...document.querySelectorAll('#codex .cgh')][k];
      const g=h&&h.closest('.cgrp'); if(!h||!g||g.classList.contains('open')) return null;
      const r=h.getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};},k);
    if(b){ await p.mouse.click(b.x,b.y); await p.waitForTimeout(420);} } };
const revState=()=>p.evaluate(()=>{const r=document.getElementById('reveal');
  const open=!!r&&getComputedStyle(r).display!=='none';
  const img=document.getElementById('rev-img'); let h=0; const u=(img&&img.src)||'';
  for(let k=0;k<u.length;k++) h=(h*31+u.charCodeAt(k))>>>0;
  const nm=r?(r.querySelector('.nm')||r.querySelector('.card')):null;
  return {open,portrait:h.toString(16),shows:(nm?nm.textContent:'').replace(/\s+/g,' ').trim().slice(0,34)};});
await p.goto(URL,{waitUntil:'load',timeout:60000}); await p.waitForTimeout(2600);
try{ await p.fill('#namein','Spec',{timeout:6000}); await p.click('#nameok',{timeout:6000}); }catch(_){}
await p.waitForTimeout(1800);
let g=0;
while(g++<55){ const ts=await p.evaluate(TUT_STATE).catch(()=>null); if(!ts||ts.step>=8) break;
  const v=await p.evaluate(()=>{const e=document.getElementById('vistabox');
    if(!e||getComputedStyle(e).display==='none')return null;const r=e.getBoundingClientRect();
    return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height*0.30)};});
  if(v){ await p.mouse.click(v.x,v.y); await p.waitForTimeout(1200); }
  else if(ts.actBtn){ try{ await p.click('#tut-act',{timeout:2500}); }catch(_){} }
  else if(ts.spot){ await p.mouse.click(ts.spot.x,ts.spot.y); }
  else { const want=/\b(earth|home)\b/i.test(ts.text||'')?'earth':null;
    const named=await p.evaluate(SCAN_TARGETS,2600).catch(()=>[]);
    let t=null; if(want) t=named.find(n=>/^earth/i.test(n.name));
    if(!t&&named.length) t=pick(named);
    if(!t){const tg=await p.evaluate(FIND_TARGETS).catch(()=>[]); if(tg.length) t=pick(tg);}
    if(t){ await p.mouse.click(t.x,t.y); await p.waitForTimeout(500);
      const hit=await p.evaluate(()=>{const s=document.getElementById('tutspot');
        if(s&&getComputedStyle(s).display!=='none'){const r=s.getBoundingClientRect();
          if(r.width>2)return{x:r.left+r.width/2,y:r.top+r.height/2};}return null;}).catch(()=>null);
      if(hit) await p.mouse.click(hit.x,hit.y);} }
  await p.waitForTimeout(800); }
await p.evaluate(()=>{const e=document.getElementById('codex');
  if(!e||getComputedStyle(e).display==='none') document.getElementById('codexbtn')?.click();});
await p.waitForTimeout(900); await openShelves();
const names=await p.evaluate(()=>[...document.querySelectorAll('#codex .sp')]
  .map(s=>(s.innerText||'').split('\n')[0].replace(/^\S+\s*/,'').trim()));
console.log('specimens:', names.join(', '));
const shown=new Set();
for(let i=0;i<names.length;i++){
  await p.evaluate(()=>{const e=document.getElementById('codex');
    if(!e||getComputedStyle(e).display==='none') document.getElementById('codexbtn')?.click();});
  await p.waitForTimeout(650); await openShelves();
  const box=await p.evaluate(nm=>{const s=[...document.querySelectorAll('#codex .sp')]
      .find(x=>(x.innerText||'').includes(nm)); if(!s) return null;
    s.scrollIntoView({block:'center'}); const r=s.getBoundingClientRect();
    return {x:Math.round(r.left+r.width*0.4),y:Math.round(r.top+r.height/2),
      w:Math.round(r.width),h:Math.round(r.height),
      top:document.elementFromPoint(Math.round(r.left+r.width*0.4),Math.round(r.top+r.height/2))?.className||''};}, names[i]);
  if(!box){ console.log(`  ${i+1}. "${names[i]}" — row not found`); continue; }
  await p.mouse.move(box.x,box.y); await p.waitForTimeout(150);
  await p.mouse.click(box.x,box.y);          // a genuine pointerdown/up/click
  await p.waitForTimeout(1500);
  const st=await revState();
  if(st.open) shown.add(st.portrait);
  console.log(`  ${String(i+1).padStart(2)}. real click at (${box.x},${box.y}) on "${names[i].padEnd(13)}" [hit=${box.top.slice(0,18)}] → card: ${st.open?'YES  '+st.shows:'NO'}`);
  for(let k=0;k<5;k++){ const s=await revState(); if(!s.open) break;
    const b=await p.evaluate(()=>{const r=document.getElementById('reveal').getBoundingClientRect();
      return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+16)};});
    await p.mouse.click(b.x,b.y); await p.waitForTimeout(500); }
}
console.log(`distinct cards shown: ${shown.size} of ${names.length}`);
await br.close();
