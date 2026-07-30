/* My fleet's new craft verb reports the affordance present and the press doing
   nothing, 30 times. Is that the game or my detector? Press it and read the
   save, not the pixels. */
import { chromium } from 'playwright';
import fs from 'fs';
const URL='http://127.0.0.1:8909/game.html';
const SAVE=JSON.parse(fs.readFileSync('/root/cf/v8out/veteran-save.json','utf8'));
const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
const ctx=await br.newContext({viewport:{width:1440,height:960}});
const p=await ctx.newPage();
await p.addInitScript(s=>localStorage.setItem('cfcc_save_v2',JSON.stringify(s)),SAVE);
await p.goto(URL,{waitUntil:'load',timeout:60000}); await p.waitForTimeout(3200);
await p.keyboard.press('Escape'); await p.waitForTimeout(600);
const st=()=>p.evaluate(()=>{ try{ const raw=localStorage.getItem('cfcc_save_v2'); if(!raw) return null;
  const d=JSON.parse(raw);
  return {crafts:d.crafts|0, items:(d.items||[]).length, cargo:(d.cargo||[]).reduce((a,c)=>a+(c[1]|0),0),
    essence:d.essence|0, cgx:(d.cgx||[]).length}; }catch(_){ return null; } });
await p.evaluate(()=>document.getElementById('cargobtn')?.click()); await p.waitForTimeout(1400);
const open=await p.evaluate(()=>{const e=document.getElementById('yard');return !!e&&getComputedStyle(e).display!=='none';});
console.log('Shipyard open:', open);
// unfold every category (v1.8.1: nothing auto-opens)
for(let k=0;k<10;k++){
  const b=await p.evaluate(()=>{const g=[...document.querySelectorAll('#yard .cgrp,#yard .bgrp,#yard .ygrp')]
      .find(x=>!x.classList.contains('open'));
    if(!g) return null; const h=g.querySelector('.cgh,.bgh,.ygh,[role=button]'); if(!h) return null;
    h.scrollIntoView({block:'center'}); const r=h.getBoundingClientRect(); if(r.height<3) return null;
    return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),lab:(h.innerText||'').slice(0,22)};});
  if(!b) break; await p.mouse.click(b.x,b.y); await p.waitForTimeout(400);
}
const inv=await p.evaluate(()=>({
  craftable:[...document.querySelectorAll('#yard [data-craft]')].map(e=>({
    id:e.dataset.craft, t:(e.innerText||'').trim().slice(0,16),
    h:Math.round(e.getBoundingClientRect().height),
    top:(()=>{const r=e.getBoundingClientRect();
      const el=document.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+r.height/2));
      if(!el) return '(none)'; let b=el; while(b&&!b.id&&b.parentElement) b=b.parentElement;
      return (b&&b.id?'#'+b.id:'') + '/' + (el.className||el.tagName); })() })),
  gated:[...document.querySelectorAll('#yard .bclaim.need')].length }));
console.log('craftable recipes:', inv.craftable.length, ' gated:', inv.gated);
for(const c of inv.craftable.slice(0,8)) console.log('   ', c.id.padEnd(14), 'h='+c.h, 'hit='+c.top, '"'+c.t+'"');
if(!inv.craftable.length){ console.log('nothing craftable — cannot test'); await br.close(); process.exit(0); }
for (let i=0;i<Math.min(4,inv.craftable.length);i++){
  const before=await st();
  const target=inv.craftable[i];
  const box=await p.evaluate(id=>{const e=document.querySelector('#yard [data-craft="'+id+'"]');
    if(!e) return null; e.scrollIntoView({block:'center'});
    const r=e.getBoundingClientRect(); if(r.height<3) return null;
    return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)};}, target.id);
  if(!box){ console.log(`  ${target.id}: no rect`); continue; }
  const textBefore=await p.evaluate(()=>document.body.innerText.length);
  await p.mouse.click(box.x,box.y);
  await p.waitForTimeout(1600);
  const textAfter=await p.evaluate(()=>document.body.innerText.length);
  const after=await st();
  const toast=await p.evaluate(()=>{const t=document.getElementById('toast');
    return t&&getComputedStyle(t).display!=='none'?(t.innerText||'').replace(/\s+/g,' ').slice(0,60):null;});
  console.log(`\n  press "${target.id}" at (${box.x},${box.y})`);
  console.log(`    save  before ${JSON.stringify(before)}`);
  console.log(`    save  after  ${JSON.stringify(after)}`);
  console.log(`    innerText ${textBefore} -> ${textAfter}  (${textBefore===textAfter?'UNCHANGED':'changed'})`);
  console.log(`    toast: ${toast||'(none)'}`);
  const crafted = after && before && (after.crafts>before.crafts || after.items>before.items || after.cgx>before.cgx);
  console.log(`    → ${crafted?'CRAFTED ✓ (my innerText detector is what missed it)':'NOTHING HAPPENED ✗'}`);
}
await br.close();
