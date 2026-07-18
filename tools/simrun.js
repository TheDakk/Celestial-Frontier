// Synthetic playthrough harness (v1.4 "Report Pack").
//
// Two tiers:
//   ui   — full-fidelity jsdom sessions that DRIVE the real 18-step Field
//          Training through the DOM (with seeded random choices, and a
//          random slice of runs taking the Skip path), then a short live
//          expedition. Catches wiring/flow bugs the way a human hits them.
//   fast — jsdom boot + skip-training, then a persona-driven expedition of
//          direct API calls through the probe hook (land/mine/craft/equip/
//          scan/feed/breed/heal/harvest/beacon/jump), with invariants
//          checked after every action. Catches logic/economy/progression
//          bugs at scale.
//
// Usage:
//   node tools/simrun.js fast 1000          (parallel workers)
//   node tools/simrun.js ui 60
//   node tools/simrun.js --child <mode> <n> <seed>   (internal)
//
// Output: JSON lines per run (children), aggregated to tools/simreport-<mode>.json
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawn } = require('child_process');
const root = path.join(__dirname, '..');

// ---------------- deterministic per-run rng ----------------
function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------- jsdom boot (smoke.js pattern) ----------------
function bootGame() {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const { makeFake2D } = require('./fake2d.js');
  const html = fs.readFileSync(path.join(__dirname, 'probe-build.html'), 'utf8');
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e && e.message)));
  vc.on('error', (...a) => errors.push('console.error: ' + a.map(String).join(' ')));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'https://game.local/celestial-frontier.html', virtualConsole: vc,
    beforeParse(window) {
      const proto = window.HTMLCanvasElement.prototype;
      proto.getContext = function (kind) {
        if (kind !== '2d') return null;
        if (!this.__fake2d) this.__fake2d = makeFake2D(this);
        return this.__fake2d;
      };
      proto.toDataURL = function () { return 'data:image/png;base64,'; };
      window.addEventListener('error', (ev) => errors.push('window.onerror: ' + (ev.message || String(ev.error))));
    },
  });
  return { w: dom.window, doc: dom.window.document, errors };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { if (fn()) return true; } catch (_) {} await sleep(80); }
  return false;
}

// ---------------- shared helpers over the probe hook ----------------
const HOME_GAL = { x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5, seed: 999, home: true };
const SOL = { x: 560, y: 170, seed: 424242 };
function pickOf(H, sys, pl) { return { kind: 'planet', data: { P: pl.P, sys, pl } }; }

function mkInvariants(run) {
  return function inv(H, doc, label) {
    try {
      if (!(H.hp >= 0 && H.hp <= H.HP_MAX)) run.violations.push(label + ': hp out of bounds ' + H.hp + '/' + H.HP_MAX);
      if (!(Number.isFinite(H.essence) && H.essence >= 0)) run.violations.push(label + ': essence bad ' + H.essence);
      for (const [k, v] of H.cargo) if (!(Number.isFinite(v) && v >= 0)) run.violations.push(label + ': cargo ' + k + '=' + v);
      for (const [k, v] of H.items) if (!(Number.isFinite(v) && v >= 0)) run.violations.push(label + ': item ' + k + '=' + v);
    } catch (e) { run.violations.push(label + ': invariant check threw ' + e.message); }
  };
}

// ---------------- the FAST expedition (direct API persona) ----------------
const PERSONAS = ['miner', 'sprinter', 'explorer', 'rancher', 'chaotic'];
function personaWeights(p) {
  //          land mine craft equip scan feed breed heal harvest beacon jump
  switch (p) {
    case 'miner':    return { land: 2, mine: 8, craft: 3, equip: 1, scan: 1, feed: 0.5, breed: 0.3, heal: 0.5, harvest: 1, beacon: 0.5, jump: 1 };
    case 'sprinter': return { land: 2, mine: 4, craft: 6, equip: 2, scan: 0.5, feed: 0.2, breed: 0.2, heal: 0.5, harvest: 2, beacon: 0.3, jump: 3 };
    case 'explorer': return { land: 6, mine: 2, craft: 2, equip: 1, scan: 4, feed: 0.5, breed: 0.3, heal: 1, harvest: 1, beacon: 2, jump: 3 };
    case 'rancher':  return { land: 2, mine: 2, craft: 1, equip: 1, scan: 4, feed: 4, breed: 3, heal: 2, harvest: 1, beacon: 0.5, jump: 1 };
    default:         return { land: 3, mine: 3, craft: 3, equip: 2, scan: 2, feed: 2, breed: 2, heal: 2, harvest: 1, beacon: 1, jump: 2 };
  }
}
function weightedPick(r, weights) {
  let tot = 0; for (const k in weights) tot += weights[k];
  let x = r() * tot;
  for (const k in weights) { x -= weights[k]; if (x <= 0) return k; }
  return 'mine';
}

// a real player's Jump-Drive plan: what to craft next, or which ELEMENT to
// go mine — accounting for parts already in the hold (the naive version
// looped forever: wire-crafting ate aluminium faster than mining refilled it)
function jumpPlan(H) {
  const need = { coil: 2, navcore: 1, fuelcell: 1 };
  const missComp = {};
  for (const k in need) { const m = Math.max(0, need[k] - (H.items.get(k) || 0)); if (m) missComp[k] = m; }
  if (!Object.keys(missComp).length) {
    return H._canCraft(H.ITEM_BY.get('jumpdrive')) ? { craft: 'jumpdrive' } : { wait: 'stardust' };
  }
  for (const k in missComp) if (H._canCraft(H.ITEM_BY.get(k))) return { craft: k };
  const t1 = {};
  for (const k in missComp) {
    const it = H.ITEM_BY.get(k);
    for (const p in (it.parts || {})) t1[p] = (t1[p] || 0) + it.parts[p] * missComp[k];
  }
  const missT1 = {};
  for (const k in t1) { const m = Math.max(0, t1[k] - (H.items.get(k) || 0)); if (m) missT1[k] = m; }
  for (const k in missT1) if (H._canCraft(H.ITEM_BY.get(k))) return { craft: k };
  for (const k in missT1) {
    const it = H.ITEM_BY.get(k);
    for (const e in (it.cost || {})) if ((H.cargo.get(e) || 0) < it.cost[e]) return { mine: e };
  }
  return null;
}

async function fastExpedition(sess, seed, nActions) {
  const { w, doc, errors } = sess;
  const H = w.__PROBE_HOOK__;
  const r = mulberry(seed);
  const persona = PERSONAS[seed % PERSONAS.length];   /* seed stride is ≡1 mod 5, so this cycles all five */
  const weights = personaWeights(persona);
  const run = {
    mode: 'fast', seed, persona, actions: 0, errors: [], violations: [],
    landings: 0, waveoffs: 0, mines: 0, crafts: 0, scans: 0, scanHits: 0,
    feeds: 0, poisons: 0, breeds: 0, heals: 0, healPoisons: 0, deaths: 0,
    minedOut: 0, jumpAt: -1, arrayAt: -1, igAt: -1, ascChEnd: 0, stageEnd: 0,
    hpMin: 999, essenceEnd: 0, saveOk: false, softlock: null,
  };
  const inv = mkInvariants(run);
  const act = (label, fn) => {
    try { fn(); } catch (e) { run.errors.push(label + ': ' + (e && e.message)); }
    inv(H, doc, label);
    if (H.hp <= 1 && r() < 0.5) { /* stay near-death sometimes: the flows must survive it */ }
  };

  // world book-keeping
  const solSys = H.systemFor(SOL.seed);
  let farStars = [];        // stars discovered beyond Sol (stage>=1)
  let curStar = null, curSys = solSys;

  const gotoStar = (star) => {
    H.goTo({ type: 'star', gal: HOME_GAL, star });
    curStar = star; curSys = H.systemFor(star.seed);
  };
  const findRingStars = () => {
    const prof = H.galaxyProfile(999);
    const R = H.ascStage() >= 2 ? 1080 : 300; // whole galaxy vs Neighborhood
    for (let t = 0; t < 40 && farStars.length < 8; t++) {
      const a = r() * 6.283, dd = Math.sqrt(r()) * R;
      const cx = Math.floor((SOL.x + Math.cos(a) * dd) / 42), cy = Math.floor((SOL.y + Math.sin(a) * dd) / 42);
      try {
        for (const s of H.starsInCell(999, prof, cx, cy).stars) {
          if (s.seed === SOL.seed) continue;
          if (Math.hypot(s.x - SOL.x, s.y - SOL.y) > R) continue;
          const sys = H.systemFor(s.seed);
          if (sys.planets && sys.planets.length) { farStars.push(s); break; }
        }
      } catch (_) {}
    }
  };
  const landOn = (sys, pl) => {
    const d = H.describePick(pickOf(H, sys, pl));
    let tries = 0;
    while (tries++ < 12) {
      let ok = false;
      try { ok = H._descRoll(pl); } catch (e) { run.errors.push('descRoll: ' + e.message); return null; }
      if (ok) break;
      run.waveoffs++;
      if (H.hp <= 2) return null;             // don't dive to death forever
    }
    if (tries > 12) return null;
    try { H._performLanding(pl); } catch (e) { run.errors.push('performLanding: ' + e.message); }
    // dismiss the vista like a player tap
    try { const vb = doc.getElementById('vistabox'); if (vb) vb.click(); } catch (_) {}
    run.landings++;
    return d;
  };

  for (let i = 0; i < nActions; i++) {
    if (doc.getElementById('deathbox') && doc.getElementById('deathbox').style.display === 'flex') { run.deaths++; break; }
    const stage = H.ascStage();
    const a = weightedPick(r, weights);
    run.actions++;
    if (a === 'jump' && stage >= 1) {
      act('jump', () => { if (!farStars.length) findRingStars(); if (farStars.length) gotoStar(farStars[(r() * farStars.length) | 0]); });
    } else if (a === 'land') {
      act('land', () => {
        const sys = (stage >= 1 && curSys !== solSys && r() < 0.7) ? curSys : (gotoStar(SOL), solSys);
        const pls = sys.planets.filter((p) => p.P.seed !== 133);
        if (pls.length) landOn(sys, pls[(r() * pls.length) | 0]);
      });
    } else if (a === 'mine') {
      act('mine', () => {
        const sys = curSys;
        let pls = sys.planets.filter((p) => p.P.seed !== 133 && H.landed.has(p.P.seed));
        if (!pls.length) { const p2 = sys.planets.filter((p) => p.P.seed !== 133); if (p2.length) { const pl = p2[(r() * p2.length) | 0]; const d = landOn(sys, pl); if (d) H.mineWorld(d); } return; }
        // sprinters mine WHERE THE MISSING ELEMENT IS (a real player reads
        // the recipe, then reads the veins)
        if (persona === 'sprinter' || r() < 0.3) {
          const plan = H.ascStage() === 0 ? jumpPlan(H) : null;
          const want = plan && plan.mine ? plan.mine : null;
          if (want) {
            const src = sys.planets.filter((p) => p.P.seed !== 133 &&
              H.depositsFor(p.P.seed, p.P.type, 0).includes(want));
            if (src.length) {
              const pl2 = src[(r() * src.length) | 0];
              const d2 = H.landed.has(pl2.P.seed) ? H.describePick(pickOf(H, sys, pl2)) : landOn(sys, pl2);
              if (d2) H.mineWorld(d2);
              return;
            }
          }
        }
        const pl = pls[(r() * pls.length) | 0];
        const d = H.describePick(pickOf(H, sys, pl));
        const before = H.mineX.get(pl.P.seed) || 0;
        const R2 = H.reserveFor(pl.P.seed, d.designation ? d.designation.tier : 0);
        H.mineWorld(d);
        const after = H.mineX.get(pl.P.seed) || 0;
        if (after > R2) run.violations.push('mine: pulls exceed reserve ' + after + '>' + R2);
        if (after > before) run.mines += after - before;
        if (after >= R2) run.minedOut++;
      });
    } else if (a === 'craft') {
      act('craft', () => {
        const ids = H.ITEMS.map((it) => it.id).filter((id) => { try { return H._canCraft(H.ITEM_BY.get(id)); } catch (_) { return false; } });
        if (!ids.length) return;
        // real players chase the chapter capstone: the BoM planner names
        // the next chain craft (sprinters always, everyone else often)
        let id = null;
        if (persona === 'sprinter' || r() < 0.45) {
          const plan = H.ascStage() === 0 ? jumpPlan(H) : null;
          if (plan && plan.craft && ids.includes(plan.craft)) id = plan.craft;
        }
        if (!id) id = ids[(r() * ids.length) | 0];
        H.craftItem(id);
        run.crafts++;
        if (id === 'jumpdrive' && run.jumpAt < 0) run.jumpAt = run.actions;
        if (id === 'array' && run.arrayAt < 0) run.arrayAt = run.actions;
        if (id === 'igdrive' && run.igAt < 0) run.igAt = run.actions;
      });
    } else if (a === 'equip') {
      act('equip', () => {
        const owned = H.ITEMS.filter((it) => it.slot && (H.items.get(it.id) || 0) > 0);
        if (owned.length) { const it = owned[(r() * owned.length) | 0]; H.equipItem(it.slot, it.id); }
      });
    } else if (a === 'scan') {
      act('scan', () => {
        const sys = curSys;
        const hpBefore = H.hp;
        for (const pl of sys.planets) {
          const d = H.describePick(pickOf(H, sys, pl));
          if (d.species && d.species.length) { H.autoScanWorld(d); run.scans++; if (H.hp < hpBefore) run.scanHits++; break; }
        }
      });
    } else if (a === 'feed' || a === 'breed' || a === 'heal') {
      act(a, () => {
        const all = [...H.codex.values()];
        const fauna = all.filter((e) => e.kind === 'Fauna');
        const flora = all.filter((e) => e.kind === 'Flora');
        if (a === 'heal' && flora.length) {
          const res = H.healExplorer(flora[(r() * flora.length) | 0], Math.random());
          run.heals++; if (res && !res.ok) run.healPoisons++;
        } else if (a === 'feed' && fauna.length && flora.length) {
          const res = H.feedPair(fauna[(r() * fauna.length) | 0], flora[(r() * flora.length) | 0], Math.random());
          run.feeds++; if (res && !res.ok) run.poisons++;
        } else if (a === 'breed' && all.length >= 2) {
          const a1 = all[(r() * all.length) | 0]; let a2 = all[(r() * all.length) | 0];
          if (a1 !== a2) { H.breedPair(a1, a2, Math.random()); run.breeds++; }
        }
      });
    } else if (a === 'harvest') {
      act('harvest', () => {
        const earthPl = solSys.planets.find((p) => p.P.seed === 133);
        if (earthPl) H.doHarvest(H.describePick(pickOf(H, solSys, earthPl)));
      });
    } else if (a === 'beacon') {
      act('beacon', () => {
        const res = H.dailyWhere();
        if (res && res.where && H.ascAllows(res.where)) H.goTo(res.where);
        else if (res && res.where && !H.ascAllows(res.where)) run.violations.push('beacon: pointed outside the charter at stage ' + stage);
      });
    }
    if (H.hp < run.hpMin) run.hpMin = H.hp;
  }

  // softlock probe: at stage 0, can the player still make progress?
  if (H.ascStage() === 0) {
    const anyCraft = H.ITEMS.some((it) => { try { return H._canCraft(H.ITEM_BY.get(it)) || H._canCraft(H.ITEM_BY.get(it.id)); } catch (_) { return false; } });
    const anyReserve = solSys.planets.some((p) => p.P.seed !== 133 && (H.mineX.get(p.P.seed) || 0) < H.reserveFor(p.P.seed, 0));
    if (!anyCraft && !anyReserve && H.essence < 30) run.softlock = 'stage0: no crafts, Sol mined out, essence ' + H.essence;
  }

  // save roundtrip
  await sleep(1200);
  try {
    const raw = w.localStorage.getItem('cfcc_save_v1');
    const data = raw ? JSON.parse(raw) : null;
    run.saveOk = !!(data && typeof data === 'object' && data.v === 4);
  } catch (e) { run.errors.push('save parse: ' + e.message); }

  run.ascChEnd = H.ascCh; run.stageEnd = H.ascStage();
  run.essenceEnd = H.essence;
  /* the game's own ledgers are the truth (manual counters missed branches) */
  try {
    run.mines = H.stats.mines || 0;
    run.crafts = H.stats.crafts || 0;
    run.cargoEnd = Object.fromEntries([...H.cargo].filter((e) => e[1] > 0));
    run.itemsEnd = Object.fromEntries([...H.items]);
  } catch (_) {}
  run.bootErrors = errors.slice(0, 6);
  return run;
}

// ---------------- the UI training playthrough ----------------
async function uiTraining(seed) {
  const sess = bootGame();
  const { w, doc, errors } = sess;
  const r = mulberry(seed ^ 0x77);
  const click = (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
  const type = (el, text) => { el.value = text; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
  const visible = (el) => !!(el && el.style.display && el.style.display !== 'none');
  const run = { mode: 'ui', seed, errors: [], stalls: [], skipped: false, completed: false, postOk: false };
  const stall = async (fn, ms, label) => { const ok = await until(fn, ms); if (!ok) run.stalls.push(label); return ok; };

  await sleep(900);
  const H = w.__PROBE_HOOK__;
  if (!H) { run.errors.push('no probe hook'); return run; }
  const tutAt = (n) => { const t = doc.getElementById('tutbox'); return visible(t) && t.textContent.includes(n + ' / 18'); };
  const tutAct = () => click(doc.getElementById('tut-act'));

  try {
    type(doc.getElementById('namein'), 'Sim' + (seed % 9999));
    click(doc.getElementById('nameok'));
    await stall(() => visible(doc.getElementById('relbox')), 5000, 'fresh bulletin');
    click(doc.getElementById('relok'));
    await stall(() => tutAt(1), 5000, 'step 1');

    // a random slice takes the skip path — it must land in a sane sandbox
    if (r() < 0.25) {
      run.skipped = true;
      tutAct(); await stall(() => tutAt(2), 4000, 'step 2 (pre-skip)');
      click(doc.getElementById('tut-skip'));
      await stall(() => !!doc.getElementById('tut-skip-yes'), 3000, 'skip confirm');
      click(doc.getElementById('tut-skip-yes'));
      await stall(() => H.tutDone === true, 4000, 'skip completes');
    } else {
      tutAct();                                     // 1 → 2
      await stall(() => tutAt(2), 4000, 'step 2');
      // find Earth: tap its live pick on the canvas
      const cv = doc.getElementById('cosmos');
      const okE = await stall(() => H.picks.some((p) => p.data && p.data.P && p.data.P.seed === 133), 6000, 'earth pick');
      if (okE) {
        const dp = H.picks.find((p) => p.data && p.data.P && p.data.P.seed === 133);
        const o = { bubbles: true, cancelable: true, view: w, clientX: dp.sx, clientY: dp.sy, button: 0 };
        cv.dispatchEvent(new w.MouseEvent('pointerdown', o));
        cv.dispatchEvent(new w.MouseEvent('pointerup', o));
        cv.dispatchEvent(new w.MouseEvent('click', o));
      }
      await stall(() => tutAt(3), 5000, 'step 3'); tutAct();
      await stall(() => tutAt(4), 4000, 'step 4');
      click(doc.querySelector('#panel [data-act="add"]'));
      await stall(() => tutAt(5), 4000, 'step 5');
      click(doc.getElementById('logbtn'));
      await stall(() => tutAt(6), 4000, 'step 6');
      click(doc.getElementById('codexbtn'));
      await stall(() => tutAt(7), 4000, 'step 7');
      // open a random specimen (shelves re-render per toggle — re-query)
      const openRandom = (kind) => {
        const all = [...H.codex.values()].filter((e) => !kind || e.kind === kind);
        if (!all.length) return null;
        const e = all[(r() * all.length) | 0];
        let guard = 0;
        while (!doc.querySelector('[data-pick="' + e.id + '"]') && guard++ < 20) {
          const grp = [...doc.querySelectorAll('#codex .cgrp')].find((g) => !g.classList.contains('open'));
          if (!grp) break;
          click(grp.querySelector('.cgh'));
        }
        click(doc.querySelector('[data-pick="' + e.id + '"]'));
        return e;
      };
      openRandom('Fauna');
      await stall(() => tutAt(8), 4000, 'step 8');
      if (r() < 0.5) click(doc.getElementById('rev-scout'));   // the tour's one live verb
      tutAct();
      await stall(() => tutAt(9), 4000, 'step 9');
      openRandom('Fauna');
      await stall(() => !!doc.getElementById('rev-feed'), 3000, 'feed button');
      click(doc.getElementById('rev-feed'));
      await stall(() => !!doc.querySelector('#pick-list [data-pk]'), 3000, 'feed picker');
      const cands = doc.querySelectorAll('#pick-list [data-pk]');
      click(cands[(r() * cands.length) | 0]);
      const fedOk = await stall(() => tutAt(10), 4000, 'step 10 (feed succeeded)');
      if (fedOk && doc.getElementById('pick-result').textContent.includes('poisoned')) run.errors.push('TRAINING FEED POISONED (rig broken)');
      click(doc.getElementById('pickclose'));
      openRandom('Fauna');
      await stall(() => !!doc.getElementById('rev-breed'), 3000, 'breed button');
      click(doc.getElementById('rev-breed'));
      await stall(() => !!doc.querySelector('#pick-list [data-pk]'), 3000, 'breed picker');
      const mates = doc.querySelectorAll('#pick-list [data-pk]');
      click(mates[(r() * mates.length) | 0]);
      await stall(() => tutAt(11), 6000, 'step 11 (breed succeeded)');
      click(doc.getElementById('pickclose'));
      tutAct();                                     // begin duel
      await stall(() => visible(doc.getElementById('duelbox')), 6000, 'duel opens');
      if (r() < 0.6) { await sleep(400); click(doc.getElementById('duelskip')); }  // some players skip
      await stall(() => tutAt(12), 30000, 'step 12 (duel done)');
      tutAct();
      await stall(() => tutAt(13), 5000, 'step 13');
      click(doc.getElementById('hpheart'));
      await stall(() => !!doc.querySelector('#pick-list [data-pk]'), 3000, 'heal picker');
      const meds = doc.querySelectorAll('#pick-list [data-pk]');
      click(meds[(r() * meds.length) | 0]);
      await stall(() => tutAt(14), 4000, 'step 14 (heal succeeded)');
      click(doc.getElementById('pickclose'));
      click(doc.getElementById('bell'));
      await stall(() => tutAt(15), 4000, 'step 15');
      type(doc.getElementById('searchin'), 'earth');
      await stall(() => tutAt(16), 4000, 'step 16');
      click(doc.getElementById('rank'));
      await stall(() => tutAt(17), 4000, 'step 17');
      tutAct();
      await stall(() => tutAt(18), 4000, 'step 18');
      tutAct();
      await stall(() => H.tutDone === true, 5000, 'finale');
    }
    run.completed = H.tutDone === true;
    // brief live expedition through the same fast driver
    if (run.completed) {
      const mini = await fastExpedition(sess, seed ^ 0xBEEF, 40);
      run.postOk = mini.errors.length === 0 && mini.violations.length === 0;
      run.post = { errors: mini.errors.slice(0, 4), violations: mini.violations.slice(0, 4) };
    }
  } catch (e) { run.errors.push('driver: ' + (e && e.message)); }
  run.bootErrors = errors.slice(0, 6);
  try { w.close(); } catch (_) {}
  return run;
}

// ---------------- child / parent orchestration ----------------
async function childMain(mode, n, seed0) {
  for (let i = 0; i < n; i++) {
    const seed = (seed0 + i * 2654435761) >>> 0;
    let out;
    try {
      if (mode === 'ui') out = await uiTraining(seed);
      else {
        const sess = bootGame();
        await sleep(900);
        const { w, doc } = sess;
        const clickEl = (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
        // name + bulletin + skip training → the live sandbox
        const nameEl = doc.getElementById('namein');
        if (nameEl) { nameEl.value = 'Sim' + (seed % 9999); nameEl.dispatchEvent(new w.Event('input', { bubbles: true })); }
        clickEl(doc.getElementById('nameok'));
        await until(() => { const rb = doc.getElementById('relbox'); return rb && rb.style.display && rb.style.display !== 'none'; }, 5000);
        clickEl(doc.getElementById('relok'));
        await until(() => { const tb = doc.getElementById('tutbox'); return tb && tb.style.display && tb.style.display !== 'none'; }, 5000);
        clickEl(doc.getElementById('tut-act'));
        await sleep(150);
        clickEl(doc.getElementById('tut-skip'));
        await until(() => !!doc.getElementById('tut-skip-yes'), 3000);
        clickEl(doc.getElementById('tut-skip-yes'));
        await until(() => sess.w.__PROBE_HOOK__ && sess.w.__PROBE_HOOK__.tutDone === true, 5000);
        out = await fastExpedition(sess, seed, 120 + ((seed >>> 4) % 300));
        try { w.close(); } catch (_) {}
      }
    } catch (e) { out = { mode, seed, fatal: String(e && e.message) }; }
    process.stdout.write(JSON.stringify(out) + '\n');
  }
}

function aggregate(mode, runs) {
  const num = (arr) => {
    if (!arr.length) return null;
    const s = arr.slice().sort((a, b) => a - b);
    const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    return { n: arr.length, mean: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2), p50: q(0.5), p90: q(0.9), min: s[0], max: s[s.length - 1] };
  };
  const errTable = {};
  for (const r of runs) for (const e of (r.errors || []).concat(r.violations || [], r.fatal ? [r.fatal] : [], r.bootErrors || [], (r.post && r.post.errors) || [])) {
    const k = String(e).slice(0, 140); errTable[k] = (errTable[k] || 0) + 1;
  }
  const rep = { mode, runs: runs.length, generatedFrom: 'tools/simrun.js', errorTable: errTable };
  if (mode === 'fast') {
    rep.deaths = runs.filter((r) => r.deaths > 0).length;
    rep.softlocks = runs.filter((r) => r.softlock).map((r) => r.softlock);
    rep.savesOk = runs.filter((r) => r.saveOk).length;
    rep.reachedStage = { s0: 0, s1: 0, s2: 0, s3: 0 };
    for (const r of runs) rep.reachedStage['s' + (r.stageEnd || 0)]++;
    rep.jumpDriveActions = num(runs.filter((r) => r.jumpAt > 0).map((r) => r.jumpAt));
    rep.byPersona = {};
    for (const p of PERSONAS) {
      const rs = runs.filter((r) => r.persona === p);
      if (!rs.length) continue;
      rep.byPersona[p] = {
        runs: rs.length,
        gotJump: rs.filter((r) => r.jumpAt > 0).length,
        landings: num(rs.map((r) => r.landings)), waveoffs: num(rs.map((r) => r.waveoffs)),
        mines: num(rs.map((r) => r.mines)), crafts: num(rs.map((r) => r.crafts)),
        hpMin: num(rs.map((r) => r.hpMin)), deaths: rs.filter((r) => r.deaths > 0).length,
        poisonRate: +(rs.reduce((a, r) => a + r.poisons, 0) / Math.max(1, rs.reduce((a, r) => a + r.feeds, 0))).toFixed(3),
        healPoisonRate: +(rs.reduce((a, r) => a + r.healPoisons, 0) / Math.max(1, rs.reduce((a, r) => a + r.heals, 0))).toFixed(3),
        scanHitRate: +(rs.reduce((a, r) => a + r.scanHits, 0) / Math.max(1, rs.reduce((a, r) => a + r.scans, 0))).toFixed(3),
      };
    }
  } else {
    rep.completed = runs.filter((r) => r.completed).length;
    rep.skipPath = runs.filter((r) => r.skipped).length;
    rep.postClean = runs.filter((r) => r.postOk).length;
    const stallTable = {};
    for (const r of runs) for (const s of (r.stalls || [])) stallTable[s] = (stallTable[s] || 0) + 1;
    rep.stallTable = stallTable;
  }
  return rep;
}

async function parentMain(mode, total) {
  execFileSync(process.execPath, [path.join(__dirname, 'make-probe-build.js'),
    path.join(root, 'celestial-frontier.html'), path.join(__dirname, 'probe-build.html')], { stdio: 'pipe' });
  const workers = Math.max(2, Math.min(8, os.cpus().length - 2));
  const per = Math.ceil(total / workers);
  const runs = [];
  let done = 0;
  await Promise.all(Array.from({ length: workers }, (_, wi) => new Promise((resolve) => {
    const n = Math.min(per, total - wi * per);
    if (n <= 0) return resolve();
    const ch = spawn(process.execPath, [__filename, '--child', mode, String(n), String((wi * 7919 + 13) >>> 0)], { stdio: ['ignore', 'pipe', 'inherit'] });
    let buf = '';
    ch.stdout.on('data', (d) => {
      buf += d;
      let ix;
      while ((ix = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, ix); buf = buf.slice(ix + 1);
        if (line.trim()) { try { runs.push(JSON.parse(line)); done++; if (done % 50 === 0) console.log('  …' + done + '/' + total); } catch (_) {} }
      }
    });
    ch.on('exit', resolve);
  })));
  const rep = aggregate(mode, runs);
  const out = path.join(__dirname, 'simreport-' + mode + '.json');
  fs.writeFileSync(out, JSON.stringify({ report: rep, runs }, null, 1));
  console.log('=== ' + mode.toUpperCase() + ' REPORT (' + runs.length + ' runs) ===');
  console.log(JSON.stringify(rep, null, 2));
  console.log('full data: ' + out);
}

(async () => {
  const [, , a, b, c, d] = process.argv;
  if (a === '--child') { await childMain(b, +c, +d); process.exit(0); }
  const mode = a || 'fast';
  const total = +(b || 100);
  await parentMain(mode, total);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
