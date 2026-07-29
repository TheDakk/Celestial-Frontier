/* Fingerprint the voices the game ACTUALLY plays, for the Earth cache the
   training hands you — then check each against what the extracted source model
   predicts. Agreement means the model can be trusted for the 200k-genome runs. */
import { chromium } from 'playwright';
import { SCAN_TARGETS, FIND_TARGETS, TUT_STATE } from './bot.mjs';
const URL='http://127.0.0.1:8906/game.html';
const INST=()=>{
 window.__A={n:[],mark:0};
 const wrap=C=>C&&new Proxy(C,{construct(T,a){const c=new T(...a);
  const w=(node,kind)=>{const i={kind,p:{}}; window.__A.n.push(i);
   try{ if(node.type!==undefined) i.type=node.type; }catch(_){}
   // biquad/oscillator .type is often assigned AFTER creation — capture the final value lazily
   try{ let _t=node.type; Object.defineProperty(node,'type',{get(){return _t;},set(v){_t=v;i.type=v;},configurable:true}); }catch(_){}
   for(const k of ['frequency','gain','Q','detune','playbackRate']){ try{ const v=node[k];
     if(v&&typeof v.setValueAtTime==='function'){ i.p[k]=+(+v.value).toFixed(2);
       let _v=v.value;
       try{ Object.defineProperty(v,'value',{get(){return _v;},set(x){_v=x;i.p[k]=+(+x).toFixed(2);},configurable:true}); }catch(_){}
       const s=v.setValueAtTime.bind(v);
       v.setValueAtTime=(x,t)=>{(i.p[k+'S']=i.p[k+'S']||[]).push(+(+x).toFixed(1));return s(x,t);};
       for(const rm of ['exponentialRampToValueAtTime','linearRampToValueAtTime']){ if(typeof v[rm]==='function'){const o=v[rm].bind(v);
         v[rm]=(x,t)=>{(i.p[k+'R']=i.p[k+'R']||[]).push(+(+x).toFixed(1));return o(x,t);};}}}}catch(_){}}
   return node;};
  for(const m of ['createOscillator','createGain','createBiquadFilter','createBufferSource']){
   if(typeof c[m]==='function'){const o=c[m].bind(c); c[m]=(...z)=>w(o(...z),m.slice(6));}}
  return c;}});
 window.AudioContext=wrap(window.AudioContext);
 if(window.webkitAudioContext) window.webkitAudioContext=wrap(window.webkitAudioContext);};

const VOICE=(mark)=>{ const ns=window.__A.n.slice(mark);
  const osc=ns.filter(n=>n.kind==='Oscillator');
  const buf=ns.filter(n=>n.kind==='BufferSource');
  const bq =ns.filter(n=>n.kind==='BiquadFilter');
  // the voice's carrier is the FIRST oscillator with a frequency ramp (playVoice
  // ramps f0 -> f0*(1+sweep) over the utterance); the LFO has no ramp.
  const carrier=osc.find(o=>o.p.frequencyS&&o.p.frequencyR);
  const lfo=osc.find(o=>o!==carrier);
  return { nodes:ns.length, osc:osc.length, buf:buf.length, bq:bq.length,
    wave: carrier?carrier.type:null,
    f0: carrier&&carrier.p.frequencyS?carrier.p.frequencyS[0]:null,
    fEnd: carrier&&carrier.p.frequencyR?carrier.p.frequencyR[0]:null,
    vib: lfo?lfo.p.frequency:null, vibDepth: lfo?null:null,
    filters: bq.map(b=>`${b.type}@${b.p.frequency}${b.p.Q!=null?'/Q'+b.p.Q:''}`).join(' '),
    noise: buf.length>0 };
};

const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const ctx=await br.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage(); const pick=a=>a[(Math.random()*a.length)|0];
await p.addInitScript(INST);
await p.goto(URL,{waitUntil:'load',timeout:60000}); await p.waitForTimeout(2600);
try{ await p.fill('#namein','Vox',{timeout:6000}); await p.click('#nameok',{timeout:6000}); }catch(_){}
await p.waitForTimeout(1800);
// walk until the Compendium holds the training cache
let guard=0, got=0;
while(guard++<55){
  got=await p.evaluate(()=>{ try{ return document.querySelectorAll('#codex .sp').length; }catch(_){ return 0; } });
  const ts=await p.evaluate(TUT_STATE).catch(()=>null);
  if(!ts) break;
  if(ts.step>=8) break;
  const vista=await p.evaluate(()=>{const e=document.getElementById('vistabox');
    if(!e||getComputedStyle(e).display==='none')return null; const r=e.getBoundingClientRect();
    return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height*0.30)};});
  if(vista){ await p.mouse.click(vista.x,vista.y); await p.waitForTimeout(1200); }
  else if(ts.actBtn){ try{ await p.click('#tut-act',{timeout:2500}); }catch(_){} }
  else if(ts.spot){ await p.mouse.click(ts.spot.x,ts.spot.y); }
  else { const want=/\b(earth|home)\b/i.test(ts.text||'')?'earth':null;
    const named=await p.evaluate(SCAN_TARGETS,2600).catch(()=>[]);
    let t=null; if(want) t=named.find(n=>/^earth/i.test(n.name));
    if(!t&&named.length) t=pick(named);
    if(!t){ const tg=await p.evaluate(FIND_TARGETS).catch(()=>[]); if(tg.length) t=pick(tg); }
    if(t){ await p.mouse.click(t.x,t.y); await p.waitForTimeout(500);
      const hit=await p.evaluate(()=>{const s=document.getElementById('tutspot');
        if(s&&getComputedStyle(s).display!=='none'){const r=s.getBoundingClientRect();
          if(r.width>2) return {x:r.left+r.width/2,y:r.top+r.height/2};} return null;}).catch(()=>null);
      if(hit) await p.mouse.click(hit.x,hit.y); } }
  await p.waitForTimeout(800);
}
// make sure the Compendium is open, then open every shelf ONE AT A TIME
await p.evaluate(()=>{ const e=document.getElementById('codex');
  if(!e||getComputedStyle(e).display==='none') document.getElementById('codexbtn')?.click(); });
await p.waitForTimeout(1100);
const shelves=await p.evaluate(()=>document.querySelectorAll('#codex .cgh').length);
for(let i=0;i<shelves;i++){
  await p.evaluate(i=>{ const h=[...document.querySelectorAll('#codex .cgh')][i];
    if(h && !h.closest('.cgrp')?.classList.contains('open')) h.click(); }, i);
  await p.waitForTimeout(450);
}
const rows=await p.evaluate(()=>[...document.querySelectorAll('#codex .sp')].map(s=>({
  name:(s.innerText||'').split('\n')[0].trim().slice(0,26),
  sub:(s.innerText||'').split('\n')[1]||'' })));
console.log(`shelves=${shelves}  specimens=${rows.length}`);
console.log(rows.map((r,i)=>`  [${i}] ${r.name}`).join('\n'));

const out=[];
const openShelves=async()=>{
  const n=await p.evaluate(()=>document.querySelectorAll('#codex .cgh').length);
  for(let k=0;k<n;k++){
    await p.evaluate(k=>{ const h=[...document.querySelectorAll('#codex .cgh')][k];
      const grp=h&&h.closest('.cgrp');
      if(h && grp && !grp.classList.contains('open')) h.click(); }, k);
    await p.waitForTimeout(380); } };
for(let i=0;i<rows.length;i++){
  await p.evaluate(()=>{ const e=document.getElementById('codex');
    if(!e||getComputedStyle(e).display==='none') document.getElementById('codexbtn')?.click(); });
  await p.waitForTimeout(700);
  await openShelves();
  const avail=await p.evaluate(()=>document.querySelectorAll('#codex .sp').length);
  const mark=await p.evaluate(()=>window.__A.n.length);
  const clicked=await p.evaluate(nm=>{ const s=[...document.querySelectorAll('#codex .sp')]
      .find(x=>(x.innerText||'').includes(nm)); if(!s) return null; s.click(); return nm; }, rows[i].name.replace(/^\S+\s*/,''));
  console.log(`      [rows visible: ${avail}]  clicked: ${clicked}`);
  await p.waitForTimeout(1500);
  const diag=await p.evaluate(()=>{ const r=document.getElementById('reveal');
    const open=!!r&&getComputedStyle(r).display!=='none';
    const t=document.getElementById('rev-t');
    const img=document.getElementById('rev-img');
    let h=0; const u=(img&&img.src)||''; for(let k=0;k<u.length;k++){h=(h*31+u.charCodeAt(k))>>>0;}
    const nm=(r&&(r.querySelector('.nm')||r.querySelector('h2')||r.querySelector('.card')))||null;
    return {revealOpen:open, title:t?t.textContent.trim():null,
      portrait:h.toString(16), name:(nm?nm.textContent:'').replace(/\s+/g,' ').trim().slice(0,34),
      xtext:(document.getElementById('rev-x')||{}).textContent||'',
      codexOpen:(()=>{const c=document.getElementById('codex');
        return !!c&&getComputedStyle(c).display!=='none';})()}; });
  const v=await p.evaluate(VOICE, mark);
  out.push({name:rows[i].name, v, diag});
  console.log(`      reveal=${diag.revealOpen} portraitHash=${diag.portrait} shows="${diag.name}" x="${diag.xtext}"`);
  console.log(`  ${rows[i].name.padEnd(24)} nodes=${String(v.nodes).padStart(2)} osc=${v.osc} noise=${v.noise?'y':'n'} wave=${String(v.wave).padEnd(9)} f0=${String(v.f0).padStart(7)}Hz →${String(v.fEnd).padStart(7)}Hz  lfo=${String(v.vib).padStart(5)}Hz  ${v.filters}`);
  // close the reveal — it says "tap to continue", and Escape does NOT close it
  for(let k=0;k<4;k++){
    const open=await p.evaluate(()=>{const r=document.getElementById('reveal');
      return !!r&&getComputedStyle(r).display!=='none';});
    if(!open) break;
    const box=await p.evaluate(()=>{const r=document.getElementById('reveal');const b=r.getBoundingClientRect();
      return {x:Math.round(b.left+b.width/2),y:Math.round(b.top+18)};});
    await p.mouse.click(box.x,box.y); await p.waitForTimeout(500); }
  await p.evaluate(()=>{ const e=document.getElementById('codex');
    if(!e||getComputedStyle(e).display==='none') document.getElementById('codexbtn')?.click(); });
  await p.waitForTimeout(600);
}
const fs=await import('fs'); fs.writeFileSync('/root/cf/out/voices.json',JSON.stringify(out,null,1));
console.log('\ndistinct fingerprints:', new Set(out.map(o=>JSON.stringify(o.v))).size, 'of', out.length);
await br.close();
