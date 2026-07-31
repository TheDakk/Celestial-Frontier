/* Reach the planetfall vista the reliable way — through training, which lands
   on Earth at step 6 — then test the three exits the reviewer claims for the
   biome ambience bed: close, hidden tab, sound-off. */
import { chromium } from 'playwright';
import { SCAN_TARGETS, FIND_TARGETS, TUT_STATE } from './bot.mjs';
const URL='http://127.0.0.1:8906/game.html';
const INST=()=>{
 window.__A={nodes:[],log:[]};
 const wrap=C=>C&&new Proxy(C,{construct(T,a){const c=new T(...a); window.__A.ctx=c;
  const w=(node,kind)=>{ const i={kind,loop:false,started:null,stopped:null,id:window.__A.nodes.length};
   window.__A.nodes.push(i);
   if(kind==='BufferSource'){ let _l=false;
     try{ Object.defineProperty(node,'loop',{set(v){_l=!!v;i.loop=!!v;},get(){return _l;},configurable:true}); }catch(_){}}
   if(typeof node.start==='function'){const s=node.start.bind(node);
     node.start=(...x)=>{i.started=Math.round(performance.now()); window.__A.log.push(`start ${kind}#${i.id}${i.loop?' LOOP':''}`); return s(...x);};}
   if(typeof node.stop==='function'){const s=node.stop.bind(node);
     node.stop=(...x)=>{i.stopped=Math.round(performance.now()); window.__A.log.push(`stop  ${kind}#${i.id}`); return s(...x);};}
   return node;};
  for(const m of ['createOscillator','createGain','createBiquadFilter','createBufferSource']){
   if(typeof c[m]==='function'){const o=c[m].bind(c); c[m]=(...z)=>w(o(...z),m.slice(6));}}
  return c;}});
 window.AudioContext=wrap(window.AudioContext);
 if(window.webkitAudioContext) window.webkitAudioContext=wrap(window.webkitAudioContext);};
const st=p=>p.evaluate(()=>{ const L=window.__A.nodes.filter(n=>n.loop);
  return { ctx:window.__A.ctx?window.__A.ctx.state:'none', total:window.__A.nodes.length,
    loops:L.length, live:L.filter(n=>n.started!=null&&n.stopped==null).length,
    detail:L.map(n=>`loop#${n.id} started@${n.started} stopped=${n.stopped==null?'NEVER':'@'+n.stopped}`) };});
const br=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const ctx=await br.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage(); const pick=a=>a[(Math.random()*a.length)|0];
await p.addInitScript(INST);
await p.goto(URL,{waitUntil:'load',timeout:60000}); await p.waitForTimeout(2600);
try{ await p.fill('#namein','Amb',{timeout:6000}); await p.click('#nameok',{timeout:6000}); }catch(_){}
await p.waitForTimeout(1800);
let guard=0;
while(guard++<45){
  const ts=await p.evaluate(TUT_STATE).catch(()=>null); if(!ts) break;
  const vista=await p.evaluate(()=>{const e=document.getElementById('vistabox');
    return !!e&&getComputedStyle(e).display!=='none';});
  if(vista) break;
  if(ts.actBtn){ try{ await p.click('#tut-act',{timeout:2500}); }catch(_){} }
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
await p.waitForTimeout(1500);
console.log('vista open:', await p.evaluate(()=>{const e=document.getElementById('vistabox');
  return !!e&&getComputedStyle(e).display!=='none';}));
const A=await st(p);
console.log('A. planetfall      :', JSON.stringify(A));
if(!A.loops){ console.log('   no looped source found; log:\n'+(await p.evaluate(()=>window.__A.log)).join('\n')); await br.close(); process.exit(0); }

await p.evaluate(()=>document.getElementById('setbtn')?.click()); await p.waitForTimeout(1100);
const setOpen=await p.evaluate(()=>{const e=document.getElementById('setpanel');return !!e&&getComputedStyle(e).display!=='none';});
console.log('   settings reachable during the vista:', setOpen);
const b4=await p.evaluate(()=>document.getElementById('sndopt')?.textContent.trim());
await p.evaluate(()=>document.getElementById('sndopt')?.click()); await p.waitForTimeout(2000);
const af=await p.evaluate(()=>document.getElementById('sndopt')?.textContent.trim());
const B=await st(p);
console.log(`\nB. Sound toggle ${b4} -> ${af}`);
console.log('   after sound OFF :', JSON.stringify(B));
console.log(`   → ${B.live>0?'✗ THE BED IS STILL PLAYING after the player switched Sound off':'✓ stopped'}`);
await p.waitForTimeout(3000);
const B2=await st(p);
console.log(`   +3s later       : live loops = ${B2.live}  ${B2.live>0?'(still running)':''}`);

await p.evaluate(()=>{ Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});
  Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});
  document.dispatchEvent(new Event('visibilitychange')); });
await p.waitForTimeout(1600);
const C=await st(p);
console.log('\nC. tab hidden      :', JSON.stringify(C));
console.log(`   → ${C.live===0?'✓ stops on hidden tab':'✗ still running on a hidden tab'}`);
console.log('\nnode log (tail):\n'+(await p.evaluate(()=>window.__A.log)).slice(-24).join('\n'));
await br.close();
