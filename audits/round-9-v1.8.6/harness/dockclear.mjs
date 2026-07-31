/* The new body.training .tutpri rule reserves 24px at the bottom; the sibling
   #panel rule reserves 126px + safe-area for the dock, and says why. Does a
   content-filled raised board actually reach the dock on a short phone? */
import { chromium } from 'playwright';
import fs from 'fs';
const SAVE=JSON.parse(fs.readFileSync('/root/cf/v9out/veteran-save.json','utf8'));
const DEV=[{id:'iphone-se',w:375,h:667},{id:'galaxy-s8',w:360,h:740},
           {id:'iphone-14-pro',w:393,h:852},{id:'ipad-mini',w:744,h:1133}];
const REACH=(sel)=>{const e=document.querySelector(sel); if(!e) return null;
  const cs=getComputedStyle(e); if(cs.display==='none') return {z:cs.zIndex,reach:null};
  const r=e.getBoundingClientRect(); if(r.height<3) return {z:cs.zIndex,reach:null};
  const x0=Math.max(2,r.left),x1=Math.min(innerWidth-2,r.right),y0=Math.max(2,r.top),y1=Math.min(innerHeight-2,r.bottom);
  if(x1<=x0||y1<=y0) return {z:cs.zIndex,reach:0,bl:['offscreen']};
  let hit=0,tot=0;const bl={};
  for(let i=1;i<=7;i++)for(let j=1;j<=9;j++){const x=x0+(x1-x0)*i/8,y=y0+(y1-y0)*j/10;
    const t=document.elementFromPoint(x,y);tot++;
    if(t&&(t===e||e.contains(t)))hit++;
    else if(t){let b=t;while(b&&!b.id&&b.parentElement)b=b.parentElement;
      const nm=b&&b.id?'#'+b.id:(t.tagName||'?').toLowerCase();bl[nm]=(bl[nm]||0)+1;}}
  return {z:cs.zIndex,rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)],
    reach:+(hit/tot*100).toFixed(0),bl:Object.entries(bl).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${k}(${v})`)};};
const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
console.log(`${'device'.padEnd(14)} ${'vh'.padStart(5)}  surface     rect(x,y,w,h)          reach   blockers`);
for(const d of DEV){
  const ctx=await br.newContext({viewport:{width:d.w,height:d.h},deviceScaleFactor:2,isMobile:d.w<900,hasTouch:d.w<900});
  const p=await ctx.newPage();
  await p.addInitScript(s=>localStorage.setItem('cfcc_save_v2',JSON.stringify(s)),SAVE);
  await p.goto('http://127.0.0.1:8910/game.html',{waitUntil:'load',timeout:60000});
  await p.waitForTimeout(3000); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  // put the page in the exact state the rule targets: training on, a raised board
  await p.evaluate(()=>{ document.getElementById('chbtn')?.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(()=>{
    document.body.classList.add('training');
    const de=document.documentElement;
    /* the values _tutSpot publishes for a card pinned at the top of a phone */
    de.style.setProperty('--tut-bot','210px');
    de.style.setProperty('--tut-cap', Math.max(140, innerHeight-210-24)+'px');
    document.getElementById('chpanel')?.classList.add('tutpri');
  });
  await p.waitForTimeout(500);
  for(const s of ['#chpanel','#codexbtn','#logbtn','#cargobtn','#chbtn','#setbtn','#helpbtn']){
    const v=await p.evaluate(REACH,s);
    if(!v){ console.log(`${d.id.padEnd(14)} ${String(d.h).padStart(5)}  ${s.padEnd(11)} absent`); continue; }
    const flag=v.reach===0?'  <-- FULLY BURIED':(v.reach!==null&&v.reach<60?'  <-- mostly buried':'');
    console.log(`${d.id.padEnd(14)} ${String(d.h).padStart(5)}  ${s.padEnd(11)} ${String((v.rect||[]).join(',')).padEnd(22)} ${String(v.reach===null?'closed':v.reach+'%').padStart(6)}  ${(v.bl||[]).join(' ')}${flag}`);
  }
  console.log('');
  await ctx.close();
}
await br.close();
