/* Does an opened Compendium shelf survive viewing one of its specimens? */
import { chromium } from 'playwright';
import { SCAN_TARGETS, FIND_TARGETS, TUT_STATE } from './bot.mjs';
const URL='http://127.0.0.1:8906/game.html';
const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
const pick=a=>a[(Math.random()*a.length)|0];
const ctx=await br.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
const snap=()=>p.evaluate(()=>({
  codexOpen:(()=>{const c=document.getElementById('codex');return !!c&&getComputedStyle(c).display!=='none';})(),
  shelves:[...document.querySelectorAll('#codex .cgrp')].map(g=>({
    label:(g.querySelector('.cgh')||{}).innerText?.split('\n')[0]||'?',
    openClass:g.classList.contains('open'),
    bodyShown:(()=>{const b=g.querySelector('.cgb');
      return !!b&&getComputedStyle(b).display!=='none';})(),
    rowsWithSize:[...g.querySelectorAll('.sp')].filter(s=>s.getBoundingClientRect().height>2).length,
    rowsTotal:g.querySelectorAll('.sp').length })),
  laidOut:[...document.querySelectorAll('#codex .sp')].filter(s=>s.getBoundingClientRect().height>2).length,
  total:document.querySelectorAll('#codex .sp').length }));
await p.goto(URL,{waitUntil:'load',timeout:60000}); await p.waitForTimeout(2600);
try{ await p.fill('#namein','Shelf',{timeout:6000}); await p.click('#nameok',{timeout:6000}); }catch(_){}
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
await p.waitForTimeout(900);
console.log('1. Compendium just opened (v1.8.1: nothing auto-opens):');
console.log('  ', JSON.stringify(await snap()));
// open every shelf with real clicks
const n=await p.evaluate(()=>document.querySelectorAll('#codex .cgh').length);
for(let k=0;k<n;k++){ const b=await p.evaluate(k=>{const h=[...document.querySelectorAll('#codex .cgh')][k];
    if(!h) return null; const r=h.getBoundingClientRect();
    return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};},k);
  if(b){ await p.mouse.click(b.x,b.y); await p.waitForTimeout(450);} }
console.log('\n2. after opening every shelf by hand:');
console.log('  ', JSON.stringify(await snap()));
// view ONE specimen, then close its card
const box=await p.evaluate(()=>{const s=[...document.querySelectorAll('#codex .sp')].find(x=>x.getBoundingClientRect().height>2);
  if(!s) return null; const r=s.getBoundingClientRect();
  return {x:Math.round(r.left+r.width*0.4),y:Math.round(r.top+r.height/2),nm:(s.innerText||'').split('\n')[0]};});
console.log('\n3. viewing specimen:', box&&box.nm);
if(box){ await p.mouse.click(box.x,box.y); await p.waitForTimeout(1500);
  for(let k=0;k<5;k++){ const o=await p.evaluate(()=>{const r=document.getElementById('reveal');
      return !!r&&getComputedStyle(r).display!=='none';}); if(!o) break;
    const b=await p.evaluate(()=>{const r=document.getElementById('reveal').getBoundingClientRect();
      return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+16)};});
    await p.mouse.click(b.x,b.y); await p.waitForTimeout(500);} }
await p.waitForTimeout(700);
console.log('\n4. after closing that specimen card:');
console.log('  ', JSON.stringify(await snap()));
await br.close();
