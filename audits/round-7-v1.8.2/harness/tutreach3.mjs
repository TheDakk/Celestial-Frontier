/* Push past step 7 (the vista) to reach the Compendium steps, and measure +
   photograph what the player actually sees there. */
import { chromium } from 'playwright';
import { SCAN_TARGETS, FIND_TARGETS, TUT_STATE } from './bot.mjs';
const URL='http://127.0.0.1:8906/game.html';
const DEV=[{id:'iphone-14-pro',w:393,h:852,dpr:3},{id:'galaxy-s8',w:360,h:740,dpr:3},
           {id:'iphone-se',w:375,h:667,dpr:2},{id:'desktop-1440',w:1440,h:900,dpr:1}];
const SURF=['#panel','#log','#codex','#vistabox','#reveal','#tutbox','#codexbtn','#logbtn','#cargobtn','#chbtn'];
const MEASURE=(sel)=>{ const o={};
  for(const s of sel){ const e=document.querySelector(s); if(!e){o[s]=null;continue;}
    const cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden'){o[s]=null;continue;}
    const r=e.getBoundingClientRect(); if(r.width<4||r.height<4){o[s]=null;continue;}
    const x0=Math.max(2,r.left),x1=Math.min(innerWidth-2,r.right),y0=Math.max(2,r.top),y1=Math.min(innerHeight-2,r.bottom);
    if(x1<=x0||y1<=y0){o[s]={z:cs.zIndex,reach:0,bl:['offscreen']};continue;}
    let hit=0,tot=0;const bl={};
    for(let i=1;i<=7;i++)for(let j=1;j<=9;j++){const x=x0+(x1-x0)*i/8,y=y0+(y1-y0)*j/10;
      const t=document.elementFromPoint(x,y);tot++;
      if(t&&(t===e||e.contains(t)))hit++;
      else if(t){let b=t;while(b&&!b.id&&b.parentElement)b=b.parentElement;
        const nm=b&&b.id?'#'+b.id:(t.tagName||'?').toLowerCase();bl[nm]=(bl[nm]||0)+1;}}
    o[s]={z:cs.zIndex,rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)],
      reach:+(hit/tot*100).toFixed(0),bl:Object.entries(bl).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${k}(${v})`)};}
  return o;};
const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
const pick=a=>a[(Math.random()*a.length)|0];
for(const d of DEV){
  const ctx=await br.newContext({viewport:{width:d.w,height:d.h},deviceScaleFactor:d.dpr,isMobile:d.w<900,hasTouch:d.w<900});
  const p=await ctx.newPage();
  const tap=async(x,y)=>{try{ if(d.w<900) await p.touchscreen.tap(x,y); else await p.mouse.click(x,y);}catch(_){}};
  console.log(`\n######## ${d.id} ${d.w}x${d.h} ########`);
  try{
    await p.goto(URL,{waitUntil:'load',timeout:60000}); await p.waitForTimeout(2600);
    try{ await p.fill('#namein','Dakk',{timeout:6000}); await p.click('#nameok',{timeout:6000}); }catch(_){}
    await p.waitForTimeout(2000);
    const seen=new Set(); let guard=0, stall=0;
    while(guard++<120){
      const ts=await p.evaluate(TUT_STATE).catch(()=>null); if(!ts) break;
      if(!seen.has(ts.step)){ seen.add(ts.step); stall=0;
        await p.waitForTimeout(700);
        const m=await p.evaluate(MEASURE,SURF);
        console.log(`  --- step ${ts.step}: ${(ts.text||'').replace(/\s+/g,' ').slice(0,74)}`);
        for(const [k,v] of Object.entries(m)){ if(!v) continue;
          const fl=v.reach===0?'  ✗✗ FULLY BURIED':(v.reach<60?'  ✗ mostly buried':'');
          console.log(`      ${k.padEnd(10)} z=${String(v.z).padEnd(4)} rect=${String(v.rect.join(',')).padEnd(20)} reachable=${String(v.reach).padStart(3)}% ${v.bl.join(' ')}${fl}`); }
        if(ts.step>=7 && ts.step<=9) await p.screenshot({path:`/root/cf/out/tr_${d.id}_step${ts.step}.png`});
      } else stall++;
      // --- advance
      const vista=await p.evaluate(()=>{const e=document.getElementById('vistabox');
        if(!e||getComputedStyle(e).display==='none')return null; const r=e.getBoundingClientRect();
        return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height*0.30)};});
      if(vista){ await tap(vista.x,vista.y); await p.waitForTimeout(1200); }
      else if(ts.actBtn){ try{ await p.click('#tut-act',{timeout:2500}); }catch(_){} }
      else if(ts.spot){ await tap(ts.spot.x,ts.spot.y); }
      else if(/compendium/i.test(ts.text||'')){
        await p.evaluate(()=>document.getElementById('codexbtn')?.click()); }
      else if(/shelf|specimen/i.test(ts.text||'')){
        await p.evaluate(()=>{ const h=document.querySelector('#codex .cgh'); if(h) h.click(); });
        await p.waitForTimeout(700);
        await p.evaluate(()=>{ const s=document.querySelector('#codex .sp'); if(s) s.click(); }); }
      else {
        const want=/\b(earth|home)\b/i.test(ts.text||'')?'earth':null;
        const named=await p.evaluate(SCAN_TARGETS,2600).catch(()=>[]);
        let t=null; if(want) t=named.find(n=>new RegExp('^'+want,'i').test(n.name));
        if(!t&&named.length) t=pick(named);
        if(!t){const tg=await p.evaluate(FIND_TARGETS).catch(()=>[]); if(tg.length) t=pick(tg);}
        if(t){ await tap(t.x,t.y); await p.waitForTimeout(500);
          const hit=await p.evaluate(()=>{const st=document.getElementById('tutspot');
            if(st&&getComputedStyle(st).display!=='none'){const r=st.getBoundingClientRect();
              if(r.width>2)return{x:r.left+r.width/2,y:r.top+r.height/2};}return null;}).catch(()=>null);
          if(hit) await tap(hit.x,hit.y); } }
      await p.waitForTimeout(800);
      if(stall>=10){ console.log(`  *** WALLED UP at step ${ts.step} ***`); break; }
      if(ts.step>=10) break;
    }
  }catch(e){ console.log('  ERROR',String(e).slice(0,140)); }
  await ctx.close();
}
await br.close();
