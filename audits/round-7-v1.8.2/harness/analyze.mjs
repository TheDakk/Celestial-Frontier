/* Aggregate fleet + responsive data into a findings model.
   Everything here is derived from measured values — nothing is invented. */
import fs from 'fs';
import { DEVICES, PERSONAS } from './bot.mjs';

const OUT = '/root/cf/out';
const sessions = fs.existsSync(`${OUT}/fleet.jsonl`)
  ? fs.readFileSync(`${OUT}/fleet.jsonl`,'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch(_){return null}}).filter(Boolean)
  : [];
const responsive = fs.existsSync(`${OUT}/responsive.json`) ? JSON.parse(fs.readFileSync(`${OUT}/responsive.json`,'utf8')) : [];

const devOf = id => DEVICES.find(d=>d[0]===id) || [];
const classOf = id => (devOf(id)[2]) || 'unknown';
const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : null;
const pct  = (a,p) => { if(!a.length) return null; const s=[...a].sort((x,y)=>x-y);
  return s[Math.min(s.length-1, Math.floor(s.length*p))]; };
const r1 = x => x==null?null:+x.toFixed(1);
const r2 = x => x==null?null:+x.toFixed(2);

/* ---------------- fun factor ----------------
   A transparent 0-10 composite of six measured session properties. This is a
   behavioural proxy, not a human rating — every input is something the bot
   actually did or failed to do. */
function funFactor(s){
  if (!s.ok || !s.actions) return null;
  const acts = s.actions;
  const dead = (s.deadClicks||0) + (s.blockedClicks||0);

  // 1. reward density — share of actions that changed the game state
  const reward = Math.max(0, 1 - dead/Math.max(acts,1));
  // 2. progression — did the session actually move the save forward
  const p = s.progress||{};
  const prog = Math.min(1, ((p.landings||0)*0.30 + (p.codex||0)*0.10 + (p.charters||0)*0.25
                          + (p.log||0)*0.10 + Math.min((p.essence||0),60)/60*0.25));
  // 3. breadth — how much of the game the session touched
  const breadth = Math.min(1, ((s.panelsOpened||[]).length/7)*0.6
                            + Math.min(Object.keys(s.bodiesSeen||{}).length,10)/10*0.4);
  // 4. friction — errors, stuck overlays, failed opens
  const friction = Math.min(1, ((s.errors||[]).length*0.34) + ((s.rejections||[]).length*0.25)
                              + (s.stuckOverlay?0.5:0) + ((s.panelOpenFail||[]).length*0.06)
                              + ((s.consoleErrors||[]).length*0.12));
  // 5. continuity — did it quit early out of frustration
  const quit = s.rageQuit ? 0 : 1;
  // 6. onboarding cost — time from load to the first real game action
  const onb = s.postOnboardMs==null ? 0.5
            : Math.max(0, Math.min(1, 1 - (s.postOnboardMs-6000)/40000));

  const score = 10 * Math.max(0, Math.min(1,
      reward*0.20 + prog*0.24 + breadth*0.18 + (1-friction)*0.15 + quit*0.13 + onb*0.10));
  return { score:+score.toFixed(2),
           parts:{ reward:r2(reward), progression:r2(prog), breadth:r2(breadth),
                   friction:r2(friction), continuity:quit, onboarding:r2(onb) } };
}

for (const s of sessions) s.fun = funFactor(s);

/* ---------------- fleet rollups ---------------- */
const ok = sessions.filter(s=>s.ok);
const funs = ok.map(s=>s.fun?.score).filter(x=>x!=null);

const groupBy = (arr, key) => {
  const m = {};
  for (const s of arr){ const k = typeof key==='function'?key(s):s[key]; (m[k]=m[k]||[]).push(s); }
  return m;
};
const summarise = arr => {
  const f = arr.map(s=>s.fun?.score).filter(x=>x!=null);
  return {
    n: arr.length,
    fun: r2(mean(f)), funP10: r2(pct(f,0.10)), funP90: r2(pct(f,0.90)),
    rageQuit: r2(arr.filter(s=>s.rageQuit).length / Math.max(arr.length,1) * 100),
    withErrors: r2(arr.filter(s=>(s.errors||[]).length||(s.rejections||[]).length).length / Math.max(arr.length,1) * 100),
    deadClickRate: r2(mean(arr.map(s=>s.actions?(s.deadClicks||0)/s.actions*100:null).filter(x=>x!=null))),
    landRate: r2(arr.filter(s=>(s.progress?.landings||0)>0).length / Math.max(arr.length,1) * 100),
    medOnboardMs: pct(arr.map(s=>s.postOnboardMs).filter(x=>x!=null), 0.5),
    stuck: arr.filter(s=>s.stuckOverlay).length,
  };
};

const report = {
  generated: new Date().toISOString(),
  build: JSON.parse(fs.readFileSync('/root/cf/src/celestialfrontier.github.io-main/version.json','utf8')),
  fleet: {
    planned: fs.existsSync(`${OUT}/plan.json`) ? JSON.parse(fs.readFileSync(`${OUT}/plan.json`,'utf8')).length : null,
    completed: sessions.length,
    ok: ok.length,
    failed: sessions.filter(s=>!s.ok).length,
    fatals: Object.entries(groupBy(sessions.filter(s=>!s.ok), s=>s.fatal||'unknown'))
              .map(([k,v])=>({ reason:k, n:v.length })).sort((a,b)=>b.n-a.n),
    fun: { mean:r2(mean(funs)), median:r2(pct(funs,0.5)), p10:r2(pct(funs,0.10)), p90:r2(pct(funs,0.90)),
           histogram: Array.from({length:11},(_,i)=>funs.filter(f=>Math.floor(f)===i||(i===10&&f===10)).length) },
    byPersona: Object.fromEntries(Object.entries(groupBy(ok,'persona')).map(([k,v])=>[k,summarise(v)])),
    byDeviceClass: Object.fromEntries(Object.entries(groupBy(ok, s=>classOf(s.device))).map(([k,v])=>[k,summarise(v)])),
    byDevice: Object.fromEntries(Object.entries(groupBy(ok,'device')).map(([k,v])=>[k,summarise(v)])),
    byTier: Object.fromEntries(Object.entries(groupBy(ok,'tier')).map(([k,v])=>[k,summarise(v)])),
  },
};

/* ---------------- tutorial reach ----------------
   IMPORTANT: only deep-tier sessions get enough wall-clock (95s) to attempt
   Field Training meaningfully. Broad sessions (13s) cannot clear step 2 no
   matter how the game behaves, so mixing them would fabricate a drop-off
   curve out of the session budget. Deep tier only. */
const tutAll = ok.filter(s=>s.tutorial==='took' && s.tutorialSteps!=null);
const tut = tutAll.filter(s=>s.tier==='deep');
report.tutorial = {
  deepOnly: true,
  budgetMs: 95000,
  tookTraining: tut.length,
  tookTrainingAllTiers: tutAll.length,
  skipped: ok.filter(s=>s.tutorial==='skipped').length,
  completed: tut.filter(s=>s.tutorialCompleted).length,
  abandoned: tut.filter(s=>s.tutorialAbandoned).length,
  totalSteps: 21,
  maxStepReached: {
    mean: r1(mean(tut.map(s=>s.tutorialSteps))),
    median: pct(tut.map(s=>s.tutorialSteps),0.5),
    p90: pct(tut.map(s=>s.tutorialSteps),0.90),
    best: tut.length?Math.max(...tut.map(s=>s.tutorialSteps||0)):null,
  },
  funnel: Array.from({length:22},(_,step)=>({
    step, reached: tut.filter(s=>(s.tutorialSteps||0)>=step).length })),
  stalls: Object.entries(groupBy(tut.filter(s=>s.tutorialStall), s=>s.tutorialStall.step))
            .map(([step,v])=>({ step:+step, n:v.length, text:v[0].tutorialStall.text }))
            .sort((a,b)=>b.n-a.n),
  // median wall-clock at which each step was first reached
  timing: (()=>{
    const byStep={};
    for (const s of tut) for (const t of (s.tutTrace||[])) (byStep[t.s]=byStep[t.s]||[]).push(t.t);
    return Object.entries(byStep).map(([step,ts])=>({ step:+step, n:ts.length,
      medianMs: pct(ts,0.5) })).sort((a,b)=>a.step-b.step);
  })(),
};

/* ---------------- corroborations: things the fleet confirmed at scale ---------------- */
const focus = sessions.flatMap(s=>s.focusProbe||[]);
report.corroboration = {
  releaseNotesEscape: {
    tested: sessions.filter(s=>s.releaseEscapeDismisses!=null).length,
    dismissed: sessions.filter(s=>s.releaseEscapeDismisses===true).length,
  },
  nameGateBlocksTopbar: sessions.filter(s=>s.modalFocusProbe?.gateBlocks).length,
  focusIndicator: {
    probes: focus.length,
    noVisibleRing: focus.filter(f=>!f.outline && !f.ring).length,
    outOfView: focus.filter(f=>!f.inView).length,
  },
  search: { probes: sessions.filter(s=>s.searchProbe).length,
            returnedResults: sessions.filter(s=>s.searchProbe?.n>0).length },
  softLocks: sessions.filter(s=>s.stuckOverlay).length,
  rageQuits: sessions.filter(s=>s.rageQuit).length,
  landedByTier: Object.fromEntries(Object.entries(groupBy(ok,'tier')).map(([k,v])=>[k,{
    n:v.length, landed:v.filter(s=>(s.progress?.landings||0)>0).length,
    rate:r2(v.filter(s=>(s.progress?.landings||0)>0).length/Math.max(v.length,1)*100)}])),
  bodiesEncountered: (()=>{ const m={};
    for (const s of sessions) for (const [k,v] of Object.entries(s.bodiesSeen||{})) m[k]=(m[k]||0)+v;
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,14).map(([name,n])=>({name,n})); })(),
};

/* ---------------- error catalogue ---------------- */
const errCat = {};
for (const s of sessions){
  for (const e of (s.errors||[])){
    const k = String(e.m||e).replace(/\d+/g,'N').slice(0,120);
    errCat[k] = errCat[k] || { message:String(e.m||e).slice(0,200), n:0, devices:new Set(), personas:new Set() };
    errCat[k].n++; errCat[k].devices.add(s.device); errCat[k].personas.add(s.persona);
  }
  for (const e of (s.rejections||[])){
    const k = 'REJECTION '+String(e).replace(/\d+/g,'N').slice(0,110);
    errCat[k] = errCat[k] || { message:'Unhandled promise rejection: '+String(e).slice(0,180), n:0, devices:new Set(), personas:new Set() };
    errCat[k].n++; errCat[k].devices.add(s.device); errCat[k].personas.add(s.persona);
  }
  for (const e of (s.consoleErrors||[])){
    const k = 'CONSOLE '+String(e).replace(/\d+/g,'N').slice(0,110);
    errCat[k] = errCat[k] || { message:'console.error: '+String(e).slice(0,180), n:0, devices:new Set(), personas:new Set() };
    errCat[k].n++; errCat[k].devices.add(s.device); errCat[k].personas.add(s.persona);
  }
}
report.errors = Object.values(errCat).map(e=>({ message:e.message, n:e.n,
  devices:[...e.devices].slice(0,8), personas:[...e.personas].slice(0,8) })).sort((a,b)=>b.n-a.n);

/* ---------------- responsive rollups ---------------- */
const uniq = a => [...new Set(a)];
report.responsive = responsive.map(r=>{
  const agg = { tiny:{}, overlap:{}, offscreen:{}, clipped:{}, lowContrast:{}, notch:{}, overflowX:0 };
  for (const st of r.states||[]){
    const a = st.audit; if(!a) continue;
    agg.overflowX = Math.max(agg.overflowX, a.overflowX||0);
    for (const t of a.tiny||[])       agg.tiny[t.id] = Math.min(agg.tiny[t.id] ?? 1e9, Math.min(t.w,t.h));
    for (const o of a.overlap||[])    { const k=`${o.a} ∩ ${o.b}`; agg.overlap[k] = Math.max(agg.overlap[k]||0, o.pct); }
    for (const o of a.offscreen||[])  agg.offscreen[o.id] = o;
    for (const c of a.clipped||[])    agg.clipped[c.id] = c;
    for (const c of a.lowContrast||[])agg.lowContrast[c.id] = Math.min(agg.lowContrast[c.id] ?? 99, c.ratio);
    for (const n of a.underNotch||[]) agg.notch[n.id] = n.t;
  }
  return {
    id:r.id, label:r.label, cls:r.cls, vw:r.vw, vh:r.vh, dpr:r.dpr, touch:r.touch,
    fps:r.fps, p95Frame:r.p95Frame, jank:r.jank, bootMs:r.bootMs,
    longTasks:r.longTasks, longTaskMs:r.longTaskMs,
    errors:uniq(r.errors||[]).slice(0,6),
    escapeProbe:r.escapeProbe||{}, panelProbe:r.panelProbe||{}, stuckOverlay:r.stuckOverlay||null,
    scanned:(r.scanned||[]).length,
    states:(r.states||[]).map(s=>({ state:s.state, file:s.file, opened:s.opened,
      openFailed:!!s.openFailed, escapeClosed:s.escapeClosed })),
    issues: {
      overflowX: agg.overflowX,
      tiny: Object.entries(agg.tiny).map(([id,px])=>({id,px})).sort((a,b)=>a.px-b.px),
      overlap: Object.entries(agg.overlap).map(([k,pct])=>({pair:k,pct})).sort((a,b)=>b.pct-a.pct),
      offscreen: Object.values(agg.offscreen),
      clipped: Object.values(agg.clipped),
      lowContrast: Object.entries(agg.lowContrast).map(([id,ratio])=>({id,ratio})).sort((a,b)=>a.ratio-b.ratio),
      notch: Object.entries(agg.notch).map(([id,t])=>({id,t})),
    },
  };
});

/* cross-device: which issues are universal vs device-specific */
const across = {};
for (const r of report.responsive){
  const add = (kind, key, detail) => {
    const k = kind+'::'+key;
    across[k] = across[k] || { kind, key, detail, devices:[], classes:new Set() };
    across[k].devices.push(r.id); across[k].classes.add(r.cls);
  };
  for (const t of r.issues.tiny)        add('tiny-target', t.id, `${t.px}px`);
  for (const o of r.issues.overlap)     add('overlap', o.pair, `${o.pct}%`);
  for (const o of r.issues.offscreen)   add('offscreen', o.id, '');
  for (const c of r.issues.clipped)     add('clipped', c.id, c.txt||'');
  for (const c of r.issues.lowContrast) add('low-contrast', c.id, `${c.ratio}:1`);
  for (const n of r.issues.notch)       add('under-notch', n.id, `top ${n.t}px`);
  if (r.issues.overflowX>0)             add('h-overflow', 'document', `${r.issues.overflowX}px`);
}
report.crossDevice = Object.values(across)
  .map(v=>({ kind:v.kind, key:v.key, detail:v.detail, nDevices:v.devices.length,
             devices:v.devices, classes:[...v.classes] }))
  .sort((a,b)=>b.nDevices-a.nDevices);

/* perf table */
report.performance = report.responsive.map(r=>({
  id:r.id, label:r.label, cls:r.cls, w:r.vw, h:r.vh, dpr:r.dpr,
  fps:r.fps, p95Frame:r.p95Frame, jank:r.jank, bootMs:r.bootMs, longTasks:r.longTasks,
})).sort((a,b)=>(a.fps??999)-(b.fps??999));

/* ---------------- onboarding cost ---------------- */
const withOnb = ok.filter(s=>s.postOnboardMs && s.ttfaMs);
const floorPath = `${OUT}/onboarding_floor.json`;
report.onboarding = {
  medianToPlayableMs: pct(withOnb.map(s=>s.postOnboardMs),0.5),
  medianToNameSubmitMs: pct(withOnb.map(s=>s.ttfaMs),0.5),
  medianBootMs: pct(ok.map(s=>s.bootMs).filter(Boolean),0.5),
  tookTraining: pct(withOnb.filter(s=>s.tutorial==='took').map(s=>s.postOnboardMs),0.5),
  skipped: pct(withOnb.filter(s=>s.tutorial==='skipped').map(s=>s.postOnboardMs),0.5),
  reachedGameplay: {
    broad: { n: ok.filter(s=>s.tier==='broad').length,
             acted: ok.filter(s=>s.tier==='broad' && (s.actions||0)>0).length },
    deep:  { n: ok.filter(s=>s.tier==='deep').length,
             acted: ok.filter(s=>s.tier==='deep' && (s.actions||0)>0).length },
  },
  openedAPanel: ok.filter(s=>(s.panelsOpened||[]).length).length,
  floor: fs.existsSync(floorPath) ? JSON.parse(fs.readFileSync(floorPath,'utf8')).summary : null,
};

fs.writeFileSync(`${OUT}/findings.json`, JSON.stringify(report,null,1));

console.log(`sessions ${sessions.length} (ok ${ok.length})  fun mean ${report.fleet.fun.mean}  median ${report.fleet.fun.median}`);
console.log('devices audited:', report.responsive.length);
console.log('distinct errors:', report.errors.length);
console.log('cross-device issues:', report.crossDevice.length);
console.log('top issues:');
for (const c of report.crossDevice.slice(0,12))
  console.log(`  [${c.kind}] ${c.key} ${c.detail} — ${c.nDevices} devices (${c.classes.join(',')})`);
