/* One picture of the defect: training step 5 with Earth's card open. Outlines
   where the dock buttons are so the burial is visible, and labels reachability. */
import { chromium } from 'playwright';
import { SCAN_TARGETS, FIND_TARGETS, TUT_STATE } from './bot.mjs';
const URL='http://127.0.0.1:8906/game.html';
const DEV=[{id:'iphone-14-pro',w:393,h:852,dpr:3},{id:'desktop-1440',w:1440,h:900,dpr:1}];
const OUTLINE=()=>{
  const reach=(e)=>{ const r=e.getBoundingClientRect();
    let hit=0,tot=0; for(let i=1;i<=7;i++)for(let j=1;j<=7;j++){
      const x=r.left+r.width*i/8,y=r.top+r.height*j/8;
      const t=document.elementFromPoint(x,y); tot++; if(t&&(t===e||e.contains(t))) hit++; }
    return Math.round(hit/tot*100); };
  for(const [sel,col] of [['#codexbtn','#ff4d4d'],['#logbtn','#ffb020'],['#panel','#4da3ff']]){
    const e=document.querySelector(sel); if(!e) continue;
    const cs=getComputedStyle(e); if(cs.display==='none') continue;
    const r=e.getBoundingClientRect(); const pc=reach(e);
    const d=document.createElement('div');
    d.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;
      border:3px solid ${col};box-sizing:border-box;z-index:99999;pointer-events:none;border-radius:8px`;
    const lab=document.createElement('div');
    lab.textContent=`${sel} z=${cs.zIndex} · ${pc}% reachable`;
    lab.style.cssText=`position:fixed;left:${Math.max(2,Math.min(r.left,innerWidth-190))}px;top:${Math.max(2,r.top-20)}px;
      background:${col};color:#000;font:700 11px/16px system-ui;padding:1px 6px;border-radius:5px;z-index:99999;pointer-events:none;white-space:nowrap`;
    document.body.appendChild(d); document.body.appendChild(lab);
  }
};
const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
const pick=a=>a[(Math.random()*a.length)|0];
for(const d of DEV){
  const ctx=await br.newContext({viewport:{width:d.w,height:d.h},deviceScaleFactor:d.dpr,isMobile:d.w<900,hasTouch:d.w<900});
  const p=await ctx.newPage();
  const tap=async(x,y)=>{try{if(d.w<900)await p.touchscreen.tap(x,y);else await p.mouse.click(x,y);}catch(_){}};
  await p.goto(URL,{waitUntil:'load',timeout:60000});await p.waitForTimeout(2600);
  try{await p.fill('#namein','Dakk',{timeout:6000});await p.click('#nameok',{timeout:6000});}catch(_){}
  await p.waitForTimeout(2000);
  let guard=0;
  while(guard++<40){
    const ts=await p.evaluate(TUT_STATE).catch(()=>null); if(!ts) break;
    if(ts.step>=5) break;
    if(ts.actBtn){try{await p.click('#tut-act',{timeout:2500});}catch(_){}}
    else if(ts.spot){await tap(ts.spot.x,ts.spot.y);}
    else{ const want=/\b(earth|home)\b/i.test(ts.text||'')?'earth':null;
      const named=await p.evaluate(SCAN_TARGETS,2600).catch(()=>[]);
      let t=null; if(want)t=named.find(n=>/^earth/i.test(n.name));
      if(!t&&named.length)t=pick(named);
      if(!t){const tg=await p.evaluate(FIND_TARGETS).catch(()=>[]); if(tg.length)t=pick(tg);}
      if(t){await tap(t.x,t.y);await p.waitForTimeout(500);
        const hit=await p.evaluate(()=>{const st=document.getElementById('tutspot');
          if(st&&getComputedStyle(st).display!=='none'){const r=st.getBoundingClientRect();
            if(r.width>2)return{x:r.left+r.width/2,y:r.top+r.height/2};}return null;}).catch(()=>null);
        if(hit)await tap(hit.x,hit.y);}}
    await p.waitForTimeout(800);
  }
  await p.waitForTimeout(900);
  const step=(await p.evaluate(TUT_STATE).catch(()=>({})))?.step;
  await p.evaluate(OUTLINE); await p.waitForTimeout(300);
  await p.screenshot({path:`/root/cf/out/dock_${d.id}.png`});
  console.log(`${d.id}: shot at step ${step}`);
  await ctx.close();
}
await br.close();
