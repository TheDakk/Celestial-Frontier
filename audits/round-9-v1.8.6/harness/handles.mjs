/* Two verbs came back with low reach: sheet 37% (noopen x46) and charter with
   noboard x51. Is that the game or my handles? */
import { chromium } from 'playwright';
import fs from 'fs';
const SAVE=JSON.parse(fs.readFileSync('/root/cf/v8out/veteran-save.json','utf8'));
const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
for (const dev of [{id:'desktop-1440',w:1440,h:900,dpr:1},{id:'iphone-14-pro',w:393,h:852,dpr:3}]){
  const ctx=await br.newContext({viewport:{width:dev.w,height:dev.h},deviceScaleFactor:dev.dpr,
    isMobile:dev.w<900,hasTouch:dev.w<900});
  const p=await ctx.newPage();
  await p.addInitScript(s=>localStorage.setItem('cfcc_save_v2',JSON.stringify(s)),SAVE);
  await p.goto('http://127.0.0.1:8909/game.html',{waitUntil:'load',timeout:60000});
  await p.waitForTimeout(3000); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  console.log(`\n### ${dev.id} ###`);
  for (const [label,sel,panel] of [['rank chip','#rank','sheet'],['records btn','#recbtn','sheet'],
                                    ['charters btn','#chbtn','chpanel'],['prime codex','#pcdxbtn','records']]){
    const info=await p.evaluate(s=>{const e=document.querySelector(s);
      if(!e) return {missing:true};
      const cs=getComputedStyle(e), r=e.getBoundingClientRect();
      const cx=Math.round(r.left+r.width/2), cy=Math.round(r.top+r.height/2);
      const t=document.elementFromPoint(cx,cy);
      let b=t; while(b&&!b.id&&b.parentElement) b=b.parentElement;
      return {disp:cs.display, w:Math.round(r.width), h:Math.round(r.height),
        x:cx, y:cy, hit:(b&&b.id?'#'+b.id:(t?t.tagName:'(none)')),
        pe:cs.pointerEvents};}, sel);
    if(info.missing){ console.log(`  ${label.padEnd(13)} ${sel.padEnd(11)} MISSING`); continue; }
    // close everything first
    await p.keyboard.press('Escape'); await p.waitForTimeout(350);
    const before=await p.evaluate(id=>{const e=document.getElementById(id);
      return !!e&&getComputedStyle(e).display!=='none';}, panel);
    if(info.h>2){ await p.mouse.click(info.x,info.y); await p.waitForTimeout(900); }
    const after=await p.evaluate(id=>{const e=document.getElementById(id);
      return !!e&&getComputedStyle(e).display!=='none';}, panel);
    console.log(`  ${label.padEnd(13)} ${sel.padEnd(11)} ${info.w}x${info.h} disp=${info.disp} pe=${info.pe} topmost=${info.hit}  → #${panel}: ${before?'was open':'closed'} → ${after?'OPEN ✓':'still closed ✗'}`);
  }
  await ctx.close();
}
await br.close();
