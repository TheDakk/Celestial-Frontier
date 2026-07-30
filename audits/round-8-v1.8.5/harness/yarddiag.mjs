import { chromium } from 'playwright';
import fs from 'fs';
const SAVE=JSON.parse(fs.readFileSync('/root/cf/v8out/veteran-save.json','utf8'));
const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
const p=await (await br.newContext({viewport:{width:1440,height:960}})).newPage();
await p.addInitScript(s=>localStorage.setItem('cfcc_save_v2',JSON.stringify(s)),SAVE);
await p.goto('http://127.0.0.1:8909/game.html',{waitUntil:'load',timeout:60000});
await p.waitForTimeout(3200); await p.keyboard.press('Escape'); await p.waitForTimeout(600);
await p.evaluate(()=>document.getElementById('cargobtn')?.click()); await p.waitForTimeout(1400);
console.log(JSON.stringify(await p.evaluate(()=>{
  const e=document.querySelector('#yard [data-craft]');
  if(!e) return {none:true};
  const chain=[]; let n=e;
  while(n && n.id!=='yard'){ const cs=getComputedStyle(n);
    chain.push({tag:n.tagName, cls:(n.className||'').toString().slice(0,26), disp:cs.display,
      vis:cs.visibility, h:Math.round(n.getBoundingClientRect().height)});
    n=n.parentElement; }
  const y=document.getElementById('yard'); const cy=getComputedStyle(y);
  return { chain, yard:{disp:cy.display, h:Math.round(y.getBoundingClientRect().height),
    scrollH:y.scrollHeight, tabs:[...document.querySelectorAll('#yard .ctab')].map(t=>t.innerText+(t.classList.contains('on')?'*':''))} };
}),null,1));
await br.close();
