// Synthetic playthrough harness (v1.4 "Report Pack").
//
// Tiers:
//   ui    — full-fidelity jsdom sessions driving the real 20-step Field
//           Training through the DOM (seeded random choices; a slice takes
//           the Skip path), then a short live expedition.
//   chaos — the ui tier with an adversary at the controls: random clicks on
//           every surface, Escape spam, panel storms, double-activations
//           between every legitimate step — hunting stuck states, stacked
//           panels, and lessons that stop advancing. Post-training it storms
//           the panel manager and the vista and asserts the close rules.
//   fast  — jsdom boot + skip-training, then a persona-driven expedition of
//           direct API calls (land/mine/craft/equip/scan/feed/breed/heal/
//           harvest/beacon/jump) with invariants checked per action.
//   deep  — the fast tier grown up: longer sessions, a bill-of-materials
//           planner that chases the whole drive ladder (Jump → Array → IG),
//           real conquests (through the picker + duel UI), friendly duels,
//           equipment timelines, a notable-event log and a fun-index — the
//           matrix a design review wants.
//
// Usage:
//   node tools/simrun.js chaos 300
//   node tools/simrun.js deep 700
//   node tools/simrun.js fast 1000 | ui 60
//   node tools/simrun.js --child <mode> <n> <seed>   (internal)
//
// Output: aggregated to tools/simreport-<mode>.json
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawn } = require('child_process');
const root = path.join(__dirname, '..');

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

// ---------------- the ship-plan (bill-of-materials) ----------------
// what a player who reads the recipes actually does: what to craft next, or
// which ELEMENT to go mine, for the next rung of the drive ladder
const SHIP_LADDER = [
  { id: 'jumpdrive', sd: 30, comps: { coil: 2, navcore: 1, fuelcell: 1 } },
  { id: 'array',     sd: 60, comps: { navcore: 2, lens: 1, cell: 1 } },
  { id: 'igdrive',   sd: 150, comps: { coil: 3, fuelcell: 2, navcore: 1 }, elems: { Pt: 2 } },
];
function planFor(H) {
  const target = SHIP_LADDER.find((t) => (H.items.get(t.id) || 0) < 1);
  if (!target) return null;
  const missComp = {};
  for (const k in target.comps) { const m = Math.max(0, target.comps[k] - (H.items.get(k) || 0)); if (m) missComp[k] = m; }
  for (const e in (target.elems || {})) if ((H.cargo.get(e) || 0) < target.elems[e]) return { mine: e, target: target.id };
  if (!Object.keys(missComp).length) {
    if (H.essence < target.sd) return { income: true, target: target.id };
    return H._canCraft(H.ITEM_BY.get(target.id)) ? { craft: target.id } : { income: true, target: target.id };
  }
  for (const k in missComp) if (H._canCraft(H.ITEM_BY.get(k))) return { craft: k };
  const t1 = {};
  for (const k in missComp) {
    const it = H.ITEM_BY.get(k);
    for (const p in (it.parts || {})) t1[p] = (t1[p] || 0) + it.parts[p] * missComp[k];
  }
  for (const k in t1) {
    const m = Math.max(0, t1[k] - (H.items.get(k) || 0));
    if (!m) continue;
    if (H._canCraft(H.ITEM_BY.get(k))) return { craft: k };
    const it = H.ITEM_BY.get(k);
    for (const e in (it.cost || {})) if ((H.cargo.get(e) || 0) < it.cost[e]) return { mine: e, target: target.id };
  }
  return null;
}
// gear a progressing player wants next, in rough priority order
const GEAR_WISHLIST = ['rig1', 'gripgloves', 'magboots', 'fieldsuit', 'struts', 'headlamp', 'fieldlegs',
  'earpiece', 'rig2', 'stabil', 'visor', 'hazmat', 'surgeon', 'greaves', 'resonator', 'compass',
  'diplobeacon', 'rig3', 'anchor', 'thermal', 'presshull', 'cryoline', 'gravboots', 'voidhelm', 'prismpendant', 'autoext'];

// ---------------- expeditions (fast + deep) ----------------
const PERSONAS = ['miner', 'sprinter', 'explorer', 'rancher', 'chaotic'];
function personaWeights(p, deep) {
  const base = (() => {
    switch (p) {
      /* v1.5: the beacon is HIDDEN for rework — bots stop using it (weight 0
         kept explicit for the record); `sheet` drives the NEW character
         screen through the real DOM (Nick's sheet-focus round) */
      case 'miner':    return { land: 2, mine: 8, craft: 3, equip: 1, scan: 1, feed: 0.5, breed: 0.3, heal: 0.5, harvest: 1, jump: 1, conquer: 0.6, duel: 0.4, sheet: 0.8 };
      case 'sprinter': return { land: 2, mine: 4, craft: 6, equip: 2, scan: 0.7, feed: 0.2, breed: 0.2, heal: 0.5, harvest: 2, jump: 3, conquer: 1.2, duel: 0.3, sheet: 0.8 };
      case 'explorer': return { land: 6, mine: 2, craft: 2, equip: 1, scan: 4, feed: 0.5, breed: 0.3, heal: 1, harvest: 1, jump: 3, conquer: 1, duel: 0.5, sheet: 0.6 };
      case 'rancher':  return { land: 2, mine: 2, craft: 1, equip: 1, scan: 4, feed: 4, breed: 3, heal: 2, harvest: 1, jump: 1.5, conquer: 1.2, duel: 2, sheet: 1 };
      default:         return { land: 3, mine: 3, craft: 3, equip: 2, scan: 2, feed: 2, breed: 2, heal: 2, harvest: 1, jump: 2, conquer: 1, duel: 1, sheet: 1 };
    }
  })();
  if (!deep) { delete base.conquer; delete base.duel; }
  return base;
}
function weightedPick(r, weights) {
  let tot = 0; for (const k in weights) tot += weights[k];
  let x = r() * tot;
  for (const k in weights) { x -= weights[k]; if (x <= 0) return k; }
  return 'mine';
}

async function expedition(sess, seed, nActions, deep) {
  const { w, doc, errors } = sess;
  const H = w.__PROBE_HOOK__;
  const r = mulberry(seed);
  const persona = PERSONAS[seed % PERSONAS.length];
  const weights = personaWeights(persona, deep);
  const clickEl = (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
  const run = {
    mode: deep ? 'deep' : 'fast', seed, persona, actions: 0, errors: [], violations: [],
    landings: 0, waveoffs: 0, crafts: 0, scans: 0, scanHits: 0,
    feeds: 0, poisons: 0, breeds: 0, hybrids: 0, heals: 0, healPoisons: 0, deaths: 0,
    conquests: 0, conquestsLost: 0, duelsW: 0, duelsL: 0, richStrikes: 0, biomeVeinLoads: 0,
    hostileGroundings: 0, gateBlocks: 0, noops: 0,
    minedOut: 0, jumpAt: -1, arrayAt: -1, igAt: -1, ascChEnd: 0, stageEnd: 0,
    hpMin: 999, essenceEnd: 0, saveOk: false, softlock: null,
    gearTimeline: [], log: [],
    // v1.5 leveling tier: XP curves, time-to-level, art-unlock pacing
    lvl3At: -1, lvl6At: -1, lvl9At: -1, xpTop: 0, lvlTop: 0, xpDuels: 0, xpConq: 0,
    // v1.5 sheet-focus round: how bots actually use the character screen
    sheetOpens: 0, socketTaps: 0, uiEquips: 0, cargoTabs: 0,
  };
  const note = (s) => { if (run.log.length < 150) run.log.push('[' + run.actions + '] ' + s); };
  // v1.5 leveling telemetry: scan the stable for level crossings after any
  // XP-bearing act (duel wins here, conquest/guardian XP via the real flow)
  const lvlCheck = () => {
    try {
      for (const e of H.codex.values()) {
        if (e.kind !== 'Fauna' || !e.genome) continue;
        const xp = (+e.genome.xp) || 0;
        if (xp > run.xpTop) run.xpTop = xp;
        const lv = H.levelOf(e.genome);
        if (lv > run.lvlTop) run.lvlTop = lv;
        if (lv >= 3 && run.lvl3At < 0) { run.lvl3At = run.actions; note('LEVEL 3 — ' + e.name + ' wakes its second innate art'); }
        if (lv >= 6 && run.lvl6At < 0) { run.lvl6At = run.actions; note('LEVEL 6 — ' + e.name + ' wakes its third innate art'); }
        if (lv >= 9 && run.lvl9At < 0) { run.lvl9At = run.actions; note('LEVEL 9 — ' + e.name + ' is at MAX'); }
      }
    } catch (_) {}
  };
  const inv = mkInvariants(run);
  const act = (label, fn) => {
    try { fn(); } catch (e) { run.errors.push(label + ': ' + (e && e.message)); }
    inv(H, doc, label);
  };

  const solSys = H.systemFor(SOL.seed);
  let farStars = [];
  let curStar = { x: SOL.x, y: SOL.y, seed: SOL.seed }, curSys = solSys;
  const gotoStar = (star) => {
    H.goTo({ type: 'star', gal: HOME_GAL, star });
    curStar = star; curSys = H.systemFor(star.seed);
  };
  const findRingStars = () => {
    const prof = H.galaxyProfile(999);
    const R = H.ascStage() >= 2 ? 1080 : 300;
    for (let t = 0; t < 60 && farStars.length < 10; t++) {
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
    const pct0 = (() => { try { return H.descentFor(pl).pct; } catch (_) { return 100; } })();
    let tries = 0;
    while (tries++ < 12) {
      let ok = false;
      try { ok = H._descRoll(pl); } catch (e) { run.errors.push('descRoll: ' + e.message); return null; }
      if (ok) break;
      run.waveoffs++;
      if (H.hp <= 2) { note('abandoned descent at ' + (d.title || pl.P.seed) + ' (hp ' + H.hp + ')'); return null; }
    }
    if (tries > 12) return null;
    try { H._performLanding(pl); } catch (e) { run.errors.push('performLanding: ' + e.message); }
    try { const vb = doc.getElementById('vistabox'); if (vb) vb.click(); } catch (_) {}
    run.landings++;
    if (pct0 <= 35) { run.hostileGroundings++; note('grounded a hostile world (' + pct0 + '%): ' + (d.title || '')); }
    return d;
  };
  const RARE_SET = new Set(['Ag', 'Au', 'Pt', 'Ir', 'U', 'Nd', 'Pm', 'Vg', 'Pz']);
  const mineAt = (sys, pl) => {
    const d = H.landed.has(pl.P.seed) ? H.describePick(pickOf(H, sys, pl)) : landOn(sys, pl);
    if (!d) return;
    const before = H.stats.mines || 0;
    const bv = (() => { try { return H.biomeVeinFor(pl.P.seed); } catch (_) { return null; } })();
    const cargoBv = bv ? (H.cargo.get(bv) || 0) : 0;
    // rich strikes land RARE_VEIN elements — snapshot them to actually count
    // (the first batch's counter never incremented; critics chased a ghost)
    let rareBefore = 0; for (const s of RARE_SET) rareBefore += H.cargo.get(s) || 0;
    H.mineWorld(d);
    if ((H.stats.mines || 0) === before) run.noops++;
    let rareAfter = 0; for (const s of RARE_SET) rareAfter += H.cargo.get(s) || 0;
    const bvGain = bv ? (H.cargo.get(bv) || 0) - cargoBv : 0;
    if (bvGain > 0) { run.biomeVeinLoads += bvGain; note('biome vein paid ' + bv + ' at ' + (d.title || '')); }
    if (rareAfter - rareBefore - Math.max(0, bvGain) > 0) { run.richStrikes++; if (run.richStrikes <= 4) note('RICH STRIKE at ' + (d.title || '')); }
  };
  const bestCreature = () => {
    let best = null;
    for (const e of H.codex.values()) {
      if (!e.grade) continue;
      if (!best || e.grade.tier > best.grade.tier) best = e;
    }
    return best;
  };

  for (let i = 0; i < nActions; i++) {
    if (doc.getElementById('deathbox') && doc.getElementById('deathbox').style.display === 'flex') {
      run.deaths++; note('DIED — expedition over'); break;
    }
    const stage = H.ascStage();
    let a = weightedPick(r, weights);
    // the deep tier plays with intent: follow the ship plan often
    if (deep && r() < 0.5) {
      const plan = planFor(H);
      if (plan) {
        if (plan.craft) a = 'craft';
        else if (plan.mine) a = 'mine';
        else if (plan.income) a = (H.codex.size ? 'conquer' : (stage >= 1 ? 'scan' : 'harvest'));
      } else if (r() < 0.4) a = 'craft';   // ladder done — gear up
    }
    run.actions++;
    if (a === 'jump' && stage >= 1) {
      act('jump', () => { if (!farStars.length) findRingStars(); if (farStars.length) { gotoStar(farStars[(r() * farStars.length) | 0]); note('jumped to a new system (stage ' + stage + ')'); } });
    } else if (a === 'land') {
      act('land', () => {
        const sys = (stage >= 1 && curSys !== solSys && r() < 0.7) ? curSys : (gotoStar(SOL), solSys);
        const pls = sys.planets.filter((p) => p.P.seed !== 133);
        if (pls.length) landOn(sys, pls[(r() * pls.length) | 0]);
      });
    } else if (a === 'mine') {
      act('mine', () => {
        const plan = deep ? planFor(H) : null;
        const want = plan && plan.mine ? plan.mine : ((persona === 'sprinter' || r() < 0.3) && planFor(H) && planFor(H).mine) || null;
        if (want) {
          // mine where the missing element lives — current system first, then Sol
          for (const sys of [curSys, solSys]) {
            const src = sys.planets.filter((p) => p.P.seed !== 133 && H.depositsFor(p.P.seed, p.P.type, 0).includes(want));
            if (src.length) { if (sys !== curSys) gotoStar(sys === solSys ? { x: SOL.x, y: SOL.y, seed: SOL.seed } : curStar); mineAt(sys, src[(r() * src.length) | 0]); return; }
          }
          if (stage >= 1) { findRingStars(); if (farStars.length) gotoStar(farStars[(r() * farStars.length) | 0]); }
          return;
        }
        const pls = curSys.planets.filter((p) => p.P.seed !== 133);
        if (pls.length) mineAt(curSys, pls[(r() * pls.length) | 0]);
      });
    } else if (a === 'craft') {
      act('craft', () => {
        const ids = H.ITEMS.map((it) => it.id).filter((id) => { try { return H._canCraft(H.ITEM_BY.get(id)); } catch (_) { return false; } });
        if (!ids.length) { run.noops++; return; }
        let id = null;
        const plan = planFor(H);
        if ((deep || persona === 'sprinter' || r() < 0.45) && plan && plan.craft && ids.includes(plan.craft)) id = plan.craft;
        if (!id && deep) id = GEAR_WISHLIST.find((g) => ids.includes(g) && (H.items.get(g) || 0) < 1) || null;
        if (!id) id = ids[(r() * ids.length) | 0];
        const before = H.stats.crafts || 0;
        H.craftItem(id);
        if ((H.stats.crafts || 0) > before) {
          run.crafts++;
          const it = H.ITEM_BY.get(id);
          if (it.cat === 'sys' || it.cat === 'gear') { run.gearTimeline.push({ at: run.actions, id, name: it.name }); note('crafted ' + it.name); }
          if (id === 'jumpdrive' && run.jumpAt < 0) run.jumpAt = run.actions;
          if (id === 'array' && run.arrayAt < 0) run.arrayAt = run.actions;
          if (id === 'igdrive' && run.igAt < 0) run.igAt = run.actions;
        }
      });
    } else if (a === 'equip') {
      act('equip', () => {
        const owned = H.ITEMS.filter((it) => it.slot && (H.items.get(it.id) || 0) > 0);
        if (owned.length) { const it = owned[(r() * owned.length) | 0]; H.equipItem(it.slot, it.id); }
        else run.noops++;
      });
    } else if (a === 'scan') {
      act('scan', () => {
        const hpBefore = H.hp;
        let done = false;
        for (const pl of curSys.planets) {
          const d = H.describePick(pickOf(H, curSys, pl));
          if (d.species && d.species.length && !H.surveyedSet.has(pl.P.seed)) {
            const sizeBefore = H.codex.size;
            const bestBefore = (bestCreature() || { grade: { tier: -1 } }).grade.tier;
            H.autoScanWorld(d); run.scans++; done = true;
            if (H.hp < hpBefore) { run.scanHits++; note('bioscan turned hostile (−' + (hpBefore - H.hp) + ' hp)'); }
            // log a rare find ONLY when it's genuinely new AND a new personal
            // best (the first batch re-logged the same best every scan — the
            // collector critic rightly called the noise a cardinal sin, but
            // it was the diary's sin, not the game's: the game chimes once)
            const b = bestCreature();
            if (H.codex.size > sizeBefore && b && b.grade.tier >= 5 && b.grade.tier > bestBefore) note('RARE FIND: ' + b.grade.name + ' ' + b.name);
            break;
          }
        }
        if (!done) run.noops++;
      });
    } else if (a === 'conquer' && deep) {
      await (async () => {
        try {
          let target = null;
          for (const pl of curSys.planets) {
            if (H.conquered.has(pl.P.seed)) continue;
            const d = H.describePick(pickOf(H, curSys, pl));
            if (d.species && d.species.some((g) => g.kingdom === 'fauna')) { target = d; break; }
          }
          if (!target) { run.noops++; return; }
          H.conquerPlanet(target);
          const pickList = doc.getElementById('pick-list');
          if (!(await until(() => pickList.querySelector('[data-pk]'), 2500))) { run.noops++; return; }
          const cands = pickList.querySelectorAll('[data-pk]');
          clickEl(cands[(r() * cands.length) | 0]);
          await until(() => doc.getElementById('duelbox').style.display === 'flex', 2500);
          await sleep(350);
          clickEl(doc.getElementById('duelskip'));
          await until(() => (doc.getElementById('duel-result') || {}).textContent, 6000);
          await sleep(150);
          clickEl(doc.getElementById('duelclose'));
          clickEl(doc.getElementById('pickclose'));
          if (H.conquered.has(target.planetSeed)) { run.conquests++; run.xpConq += 20; note('CONQUERED ' + target.title + ' (spoils! essence now ' + H.essence + ')'); }
          else { run.conquestsLost++; note('conquest of ' + target.title + ' FAILED'); }
          lvlCheck();
        } catch (e) { run.errors.push('conquer: ' + (e && e.message)); }
        inv(H, doc, 'conquer');
      })();
    } else if (a === 'duel' && deep) {
      act('duel', () => {
        const mine = [...H.codex.values()].filter((e) => e.kind === 'Fauna');
        if (!mine.length) { run.noops++; return; }
        // champion loyalty (v1.5 leveling tier): players level ONE champion —
        // 70% of duels field the highest-XP (then best-grade) creature
        let me;
        if (r() < 0.7) {
          me = mine.reduce((b, e) => {
            const xe = (+e.genome.xp) || 0, xb = (+b.genome.xp) || 0;
            return (xe > xb || (xe === xb && (e.grade ? e.grade.tier : 0) > (b.grade ? b.grade.tier : 0))) ? e : b;
          }, mine[0]);
        } else me = mine[(r() * mine.length) | 0];
        const foeG = H.makeGenome((r() * 0xFFFFFFFF) >>> 0, 'fauna', 0.4 + r() * 0.4);
        const res = H.runDuel({ name: me.name, genome: me.genome }, { name: 'Wild challenger', genome: foeG });
        if (res.winner === 'A') {
          run.duelsW++; if (run.duelsW <= 3) note('duel won by ' + me.name);
          H.awardXP(me.id, 8); run.xpDuels += 8;   // the duel UI's own award, mirrored
          lvlCheck();
        }
        else if (res.winner === 'B') run.duelsL++;
      });
    } else if (a === 'feed' || a === 'breed' || a === 'heal') {
      act(a, () => {
        const all = [...H.codex.values()];
        const fauna = all.filter((e) => e.kind === 'Fauna');
        const flora = all.filter((e) => e.kind === 'Flora');
        if (a === 'heal' && flora.length) {
          const res = H.healExplorer(flora[(r() * flora.length) | 0], Math.random());
          run.heals++; if (res && !res.ok) { run.healPoisons++; note('toxic meal — poisoned (hp ' + H.hp + ')'); }
        } else if (a === 'feed' && fauna.length && flora.length) {
          const res = H.feedPair(fauna[(r() * fauna.length) | 0], flora[(r() * flora.length) | 0], Math.random());
          run.feeds++; if (res && !res.ok) run.poisons++;
        } else if (a === 'breed' && all.length >= 2) {
          const a1 = all[(r() * all.length) | 0]; let a2 = all[(r() * all.length) | 0];
          if (a1 !== a2) {
            const res = H.breedPair(a1, a2, Math.random());
            run.breeds++;
            if (res && res.ok && res.born) { run.hybrids++; note('HYBRID BORN: ' + res.born.name + (res.born.grade ? ' (' + res.born.grade.name + ')' : '')); }
          }
        } else run.noops++;
      });
    } else if (a === 'sheet') {
      // v1.5 THE CHARACTER SCREEN through the real DOM: open from the
      // nameplate, tap a socket on the paperdoll, use the picker, visit a
      // cargo tab, close by ✕ or toggle — every step asserted
      await (async () => {
        try {
          const rank = doc.getElementById('rank');
          const shEl = doc.getElementById('sheet');
          if (shEl.style.display === 'flex') clickEl(rank);   // ensure a clean open
          clickEl(rank);
          if (!(await until(() => shEl.style.display === 'flex', 1500))) { run.violations.push('sheet: nameplate did not open the screen'); return; }
          run.sheetOpens++;
          const doll = doc.getElementById('doll');
          const socks = doll.querySelectorAll('[data-eqslot]');
          if (socks.length !== 9) run.violations.push('sheet: expected 9 sockets, saw ' + socks.length);
          if (!doll.querySelector('.dollimg')) run.violations.push('sheet: no paperdoll figure');
          const sk2 = socks[(r() * socks.length) | 0];
          const skId = sk2 && sk2.dataset.eqslot;
          clickEl(sk2); run.socketTaps++;
          await sleep(30);
          const pick = doc.querySelector('#doll .eqpick');
          if (!pick) run.violations.push('sheet: socket tap opened no picker');
          else {
            const cand = pick.querySelectorAll('[data-eqpick]');
            if (cand.length && r() < 0.8) {
              const before = H.equip[skId];
              clickEl(cand[(r() * cand.length) | 0]); run.uiEquips++;
              await sleep(20);
              if (H.equip[skId] === before && cand.length > 1) { /* picked the worn one or unequip — fine */ }
            } else clickEl(doc.querySelector('#doll [data-eqslot="' + skId + '"]'));   // fold the picker back
          }
          if (r() < 0.5) {
            // v1.5.2b: the ship is OFF the doll — the 🛠 Shipyard rail button
            // is the one door to the bench (visible once anything is held)
            const yardBtn = doc.getElementById('cargobtn');
            if (yardBtn && yardBtn.style.display !== 'none') {
              clickEl(yardBtn);
              if (await until(() => doc.getElementById('yard').style.display === 'flex', 1200)) {
                run.cargoTabs++;
                const tabs = doc.querySelectorAll('#yardbench [data-yt]');
                if (tabs.length) clickEl(tabs[(r() * tabs.length) | 0]);
                const fg = doc.querySelectorAll('#yardbench .fghead');
                if (fg.length && r() < 0.6) clickEl(fg[(r() * fg.length) | 0]);
                clickEl(doc.getElementById('rank'));   // the sheet replaces the yard (one-panel law)
                await sleep(20);
                if (doc.getElementById('yard').style.display === 'flex') run.violations.push('sheet: yard did not yield to the sheet');
              } else run.violations.push('sheet: the Shipyard rail button did not open the yard');
            }
          }
          const x = doc.querySelector('#sheetcard [data-pnx]');
          if (x && r() < 0.5) clickEl(x); else clickEl(rank);
          await sleep(20);
          if (shEl.style.display === 'flex') run.violations.push('sheet: did not close');
        } catch (e) { run.errors.push('sheet: ' + (e && e.message)); }
        inv(H, doc, 'sheet');
      })();
    } else if (a === 'harvest') {
      act('harvest', () => {
        const targets = [...H.conquered.keys()];
        const seedH = targets.length && r() < 0.5 ? targets[(r() * targets.length) | 0] : 133;
        const sys = seedH === 133 || solSys.planets.some((p) => p.P.seed === seedH) ? solSys : curSys;
        const pl = sys.planets.find((p) => p.P.seed === seedH);
        if (pl) H.doHarvest(H.describePick(pickOf(H, sys, pl))); else run.noops++;
      });
    } else if (a === 'beacon') {
      act('beacon', () => {
        const res = H.dailyWhere();
        if (res && res.where && H.ascAllows(res.where)) H.goTo(res.where);
        else if (res && res.where) { run.gateBlocks++; run.violations.push('beacon: pointed outside the charter at stage ' + stage); }
      });
    } else run.noops++;
    if (H.hp < run.hpMin) run.hpMin = H.hp;
  }

  await sleep(1200);
  try {
    const raw = w.localStorage.getItem('cfcc_save_v2');
    const data = raw ? JSON.parse(raw) : null;
    run.saveOk = !!(data && typeof data === 'object' && data.v === 4);
  } catch (e) { run.errors.push('save parse: ' + e.message); }

  run.ascChEnd = H.ascCh; run.stageEnd = H.ascStage();
  run.essenceEnd = H.essence;
  try {
    run.mines = H.stats.mines || 0;
    run.crafts = H.stats.crafts || 0;
    run.speciesCount = H.codex.size;
    const b = bestCreature();
    run.bestCreature = b ? { name: b.name, tier: b.grade.tier, grade: b.grade.name, kind: b.kind } : null;
    run.finalEquip = {};
    for (const s in H.equip) { const it = H.ITEM_BY.get(H.equip[s]); if (it) run.finalEquip[s] = it.name; }
    run.systemsBuilt = ['jumpdrive', 'array', 'igdrive', 'autoext'].filter((id) => (H.items.get(id) || 0) > 0);
  } catch (_) {}
  // the fun-index: joys over joys+frictions (0-10). A proxy the critics interpret.
  const joys = 2 * run.richStrikes + 4 * run.conquests + 2.5 * run.duelsW + 3 * run.hybrids +
    (run.bestCreature ? Math.max(0, run.bestCreature.tier - 2) * 2 : 0) +
    3 * (run.jumpAt > 0 ? 1 : 0) + 4 * (run.arrayAt > 0 ? 1 : 0) + 5 * (run.igAt > 0 ? 1 : 0) +
    2 * run.hostileGroundings + 0.5 * run.speciesCount + 0.3 * run.crafts + 0.15 * run.landings + run.biomeVeinLoads * 0.5;
  const frictions = 0.4 * run.waveoffs + 1.5 * run.poisons + 1.5 * run.healPoisons + 5 * run.deaths +
    1 * run.gateBlocks + 0.15 * run.noops + 2 * run.conquestsLost;
  run.funIndex = +(10 * joys / (joys + frictions + 25)).toFixed(2);
  run.bootErrors = errors.slice(0, 6);
  return run;
}

// ---------------- the UI training playthrough (plain + chaos) ----------------
async function uiTraining(seed, chaos) {
  const sess = bootGame();
  const { w, doc, errors } = sess;
  const r = mulberry(seed ^ 0x77);
  const click = (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
  const type = (el, text) => { el.value = text; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
  const visible = (el) => !!(el && el.style.display && el.style.display !== 'none');
  const run = { mode: chaos ? 'chaos' : 'ui', seed, errors: [], stalls: [], breaks: [], skipped: false, completed: false, postOk: false };
  const stall = async (fn, ms, label) => {
    const ok = await until(fn, ms);
    if (!ok) {
      // diagnose the stuck state: which overlays are up?
      const open = ['tutbox', 'pickbox', 'reveal', 'duelbox', 'namebox', 'relbox', 'guidebox', 'setpanel', 'codex', 'log', 'sheet', 'chpanel', 'events', 'tray', 'helppop', 'vistabox']
        .filter((id) => visible(doc.getElementById(id)));
      run.stalls.push(label + ' [open: ' + open.join(',') + ']');
    }
    return ok;
  };
  const CHAOS_BTNS = ['logbtn', 'codexbtn', 'cargobtn', 'chbtn', 'eventsbtn', 'setbtn', 'helpbtn', 'bell', 'rank', 'pcdxbtn', 'dailybtn', 'tut-act'];
  const cv = () => doc.getElementById('cosmos');
  const chaosBurst = () => {
    if (!chaos) return;
    const n = 2 + ((r() * 5) | 0);
    for (let i = 0; i < n; i++) {
      const roll = r();
      if (roll < 0.35) click(doc.getElementById(CHAOS_BTNS[(r() * CHAOS_BTNS.length) | 0]));
      else if (roll < 0.6) {
        const o = { bubbles: true, cancelable: true, view: w, clientX: (r() * 1200) | 0, clientY: (r() * 800) | 0, button: 0 };
        cv().dispatchEvent(new w.MouseEvent('pointerdown', o));
        cv().dispatchEvent(new w.MouseEvent('pointerup', o));
        cv().dispatchEvent(new w.MouseEvent('click', o));
      } else if (roll < 0.75) doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      else if (roll < 0.9) {
        const acts = doc.querySelectorAll('#panel [data-act], #codex .cgh, [data-pnx], .pxc, .vxc');
        if (acts.length) click(acts[(r() * acts.length) | 0]);
      } else {
        // a wild double-activation
        const b = doc.getElementById(CHAOS_BTNS[(r() * CHAOS_BTNS.length) | 0]);
        click(b); click(b);
      }
    }
  };
  const tutAt = (n) => { const t = doc.getElementById('tutbox'); return visible(t) && t.textContent.includes(n + ' / 20'); };
  const tutAct = () => click(doc.getElementById('tut-act'));
  const guard = (label) => {
    // during training the lesson card must never vanish and panels must not stack
    if (!visible(doc.getElementById('tutbox'))) run.breaks.push(label + ': tutbox vanished');
  };

  await sleep(900);
  const H = w.__PROBE_HOOK__;
  if (!H) { run.errors.push('no probe hook'); return run; }
  try {
    type(doc.getElementById('namein'), 'Sim' + (seed % 9999));
    click(doc.getElementById('nameok'));
    await stall(() => visible(doc.getElementById('relbox')), 5000, 'fresh bulletin');
    chaosBurst();
    click(doc.getElementById('relok'));
    await stall(() => tutAt(1), 5000, 'step 1');

    if (!chaos && r() < 0.25) {
      run.skipped = true;
      tutAct(); await stall(() => tutAt(2), 4000, 'step 2 (pre-skip)');
      click(doc.getElementById('tut-skip'));
      await stall(() => !!doc.getElementById('tut-skip-yes'), 3000, 'skip confirm');
      click(doc.getElementById('tut-skip-yes'));
      await stall(() => H.tutDone === true, 4000, 'skip completes');
    } else {
      chaosBurst(); tutAct();
      await stall(() => tutAt(2), 4000, 'step 2'); guard('step2');
      chaosBurst();
      const okE = await stall(() => H.picks.some((p) => p.data && p.data.P && p.data.P.seed === 133), 6000, 'earth pick');
      if (okE) {
        const dp = H.picks.find((p) => p.data && p.data.P && p.data.P.seed === 133);
        const o = { bubbles: true, cancelable: true, view: w, clientX: dp.sx, clientY: dp.sy, button: 0 };
        cv().dispatchEvent(new w.MouseEvent('pointerdown', o));
        cv().dispatchEvent(new w.MouseEvent('pointerup', o));
        cv().dispatchEvent(new w.MouseEvent('click', o));
      }
      await stall(() => tutAt(3), 5000, 'step 3'); guard('step3'); chaosBurst(); tutAct();
      await stall(() => tutAt(4), 4000, 'step 4'); chaosBurst();
      click(doc.querySelector('#panel [data-act="add"]'));
      await stall(() => tutAt(5), 4000, 'step 5'); chaosBurst();
      click(doc.getElementById('logbtn'));
      // v1.5.2 landing lesson: Land on Earth from the card
      await stall(() => tutAt(6), 4000, 'step 6 (land lesson up)'); chaosBurst();
      click(doc.querySelector('#panel [data-act="landcta"]'));
      await stall(() => tutAt(7), 4000, 'step 7 (landed home)'); chaosBurst();
      click(doc.getElementById('codexbtn'));
      await stall(() => tutAt(8), 4000, 'step 7'); guard('step7'); chaosBurst();
      const openRandom = (kind) => {
        const all = [...H.codex.values()].filter((e) => !kind || e.kind === kind);
        if (!all.length) return null;
        const e = all[(r() * all.length) | 0];
        let guard2 = 0;
        while (!doc.querySelector('[data-pick="' + e.id + '"]') && guard2++ < 20) {
          const grp = [...doc.querySelectorAll('#codex .cgrp')].find((g) => !g.classList.contains('open'));
          if (!grp) break;
          click(grp.querySelector('.cgh'));
        }
        click(doc.querySelector('[data-pick="' + e.id + '"]'));
        return e;
      };
      openRandom('Fauna');
      await stall(() => tutAt(9), 4000, 'step 8'); chaosBurst();
      if (r() < 0.5) click(doc.getElementById('rev-scout'));
      tutAct();
      await stall(() => tutAt(10), 4000, 'step 9'); chaosBurst();
      openRandom('Fauna');
      await stall(() => !!doc.getElementById('rev-feed'), 3000, 'feed button');
      click(doc.getElementById('rev-feed'));
      await stall(() => !!doc.querySelector('#pick-list [data-pk]'), 3000, 'feed picker');
      chaosBurst();   // chaos while the picker is open — the modal must hold
      if (!doc.querySelector('#pick-list [data-pk]')) {
        // chaos may have legitimately closed the picker via its close button — reopen
        openRandom('Fauna'); click(doc.getElementById('rev-feed'));
        await stall(() => !!doc.querySelector('#pick-list [data-pk]'), 3000, 'feed picker (reopen)');
      }
      const cands = doc.querySelectorAll('#pick-list [data-pk]');
      if (cands.length) click(cands[(r() * cands.length) | 0]);
      const fedOk = await stall(() => tutAt(11), 5000, 'step 10 (feed succeeded)');
      if (fedOk && doc.getElementById('pick-result').textContent.includes('poisoned')) run.breaks.push('TRAINING FEED POISONED (rig broken)');
      click(doc.getElementById('pickclose'));
      chaosBurst();
      openRandom('Fauna');
      await stall(() => !!doc.getElementById('rev-breed'), 3000, 'breed button');
      click(doc.getElementById('rev-breed'));
      await stall(() => !!doc.querySelector('#pick-list [data-pk]'), 3000, 'breed picker');
      let mates = doc.querySelectorAll('#pick-list [data-pk]');
      if (!mates.length) { openRandom('Fauna'); click(doc.getElementById('rev-breed')); await stall(() => !!doc.querySelector('#pick-list [data-pk]'), 3000, 'breed picker (reopen)'); mates = doc.querySelectorAll('#pick-list [data-pk]'); }
      if (mates.length) click(mates[(r() * mates.length) | 0]);
      await stall(() => tutAt(12), 6000, 'step 11 (breed succeeded)');
      click(doc.getElementById('pickclose'));
      chaosBurst(); tutAct();
      await stall(() => visible(doc.getElementById('duelbox')), 6000, 'duel opens');
      chaosBurst();   // chaos DURING the duel — the modal must not die
      if (!visible(doc.getElementById('duelbox'))) run.breaks.push('duelbox closed by stray input during training duel');
      if (r() < 0.6) { await sleep(350); click(doc.getElementById('duelskip')); }
      await stall(() => tutAt(13), 30000, 'step 12 (duel done)');
      tutAct();
      await stall(() => tutAt(14), 5000, 'step 13'); chaosBurst();
      click(doc.getElementById('hpheart'));
      await stall(() => !!doc.querySelector('#pick-list [data-pk]'), 3000, 'heal picker');
      let meds = doc.querySelectorAll('#pick-list [data-pk]');
      if (!meds.length) { click(doc.getElementById('hpheart')); await stall(() => !!doc.querySelector('#pick-list [data-pk]'), 3000, 'heal picker (reopen)'); meds = doc.querySelectorAll('#pick-list [data-pk]'); }
      if (meds.length) click(meds[(r() * meds.length) | 0]);
      await stall(() => tutAt(15), 4000, 'step 14 (heal succeeded)');
      click(doc.getElementById('pickclose'));
      chaosBurst();
      click(doc.getElementById('bell'));
      await stall(() => tutAt(16), 4000, 'step 15'); chaosBurst();
      type(doc.getElementById('searchin'), 'earth');
      await stall(() => tutAt(17), 4000, 'step 16'); chaosBurst();
      click(doc.getElementById('rank'));
      await stall(() => tutAt(18), 4000, 'step 17 (sheet open)'); chaosBurst();
      // v1.5.2b THE FORGE LESSON: the 🛠 Shipyard rail button opens the
      // yard; the Fabricator's T1 fold is open by default — craft the plate
      click(doc.getElementById('cargobtn'));
      await stall(() => !!doc.querySelector('#yardbench [data-craft="plate"]'), 3000, 'forge: yard fab');
      click(doc.querySelector('#yardbench [data-craft="plate"]'));
      await stall(() => tutAt(19), 4000, 'step 18 (plate forged)'); chaosBurst(); tutAct();
      await stall(() => tutAt(20), 4000, 'step 19'); chaosBurst(); tutAct();
      await stall(() => H.tutDone === true, 5000, 'finale');
    }
    run.completed = H.tutDone === true;

    if (run.completed && chaos) {
      // ---- POST-TRAINING PANEL STORM: the one-panel rule under fire ----
      // v1.5: stats + cargo merged into the one #sheet character screen
      const PANEL_IDS = ['codex', 'log', 'sheet', 'chpanel', 'events', 'tray', 'setpanel', 'guidebox', 'primebox'];
      for (let round = 0; round < 6; round++) {
        for (const b of ['logbtn', 'codexbtn', 'cargobtn', 'chbtn', 'eventsbtn', 'setbtn', 'bell', 'rank', 'pcdxbtn']) click(doc.getElementById(b));
        await sleep(60);
      }
      await sleep(200);
      const openPanels = PANEL_IDS.filter((id) => visible(doc.getElementById(id)));
      if (openPanels.length > 1) run.breaks.push('PANEL STACKING after storm: ' + openPanels.join(','));
      // outside tap must clear the last one
      const o2 = { bubbles: true, cancelable: true, view: w, clientX: 400, clientY: 500, button: 0 };
      cv().dispatchEvent(new w.MouseEvent('pointerdown', o2));
      await sleep(150);
      const still = PANEL_IDS.filter((id) => visible(doc.getElementById(id)));
      if (still.length) run.breaks.push('outside tap left panels open: ' + still.join(','));
      // helppop closes on outside tap
      click(doc.getElementById('helpbtn'));
      await sleep(100);
      if (visible(doc.getElementById('helppop'))) {
        cv().dispatchEvent(new w.MouseEvent('pointerdown', o2));
        await sleep(120);
        if (visible(doc.getElementById('helppop'))) run.breaks.push('helppop survived outside tap');
      }
      // the vista opens as a windowed card and closes on tap
      const solSys = H.systemFor(SOL.seed);
      H.goTo({ type: 'star', gal: HOME_GAL, star: { x: SOL.x, y: SOL.y, seed: SOL.seed } });
      const pl = solSys.planets.find((p) => p.P.seed === 131);
      let okL = false;
      for (let t = 0; t < 12 && !okL; t++) okL = H._descRoll(pl);
      if (okL) {
        H._performLanding(pl);
        await sleep(150);
        const vb = doc.getElementById('vistabox');
        if (visible(vb)) {
          if (!vb.querySelector('.vcard .vxc')) run.breaks.push('vista lost its windowed card frame');
          vb.click();
          const closed = await until(() => !visible(doc.getElementById('vistabox')), 3000);
          if (!closed) run.breaks.push('vista would not close on tap');
        }
      }
      run.postOk = run.breaks.length === 0;
    } else if (run.completed) {
      const mini = await expedition(sess, seed ^ 0xBEEF, 40, false);
      run.postOk = mini.errors.length === 0 && mini.violations.length === 0;
      run.post = { errors: mini.errors.slice(0, 4), violations: mini.violations.slice(0, 4) };
    }
  } catch (e) { run.errors.push('driver: ' + (e && e.message)); }
  run.bootErrors = errors.slice(0, 6);
  try { w.close(); } catch (_) {}
  return run;
}

// ---------------- child / parent orchestration ----------------
async function bootToSandbox() {
  const sess = bootGame();
  await sleep(900);
  const { w, doc } = sess;
  const clickEl = (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
  const nameEl = doc.getElementById('namein');
  if (nameEl) { nameEl.value = 'Sim'; nameEl.dispatchEvent(new w.Event('input', { bubbles: true })); }
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
  return sess;
}
async function childMain(mode, n, seed0) {
  for (let i = 0; i < n; i++) {
    const seed = (seed0 + i * 2654435761) >>> 0;
    let out;
    try {
      if (mode === 'ui' || mode === 'chaos') out = await uiTraining(seed, mode === 'chaos');
      else {
        const sess = await bootToSandbox();
        /* v1.5.1 (Nick): 'medium' — the intermittent player. Deep-tier
           behaviors (conquests, duels, the sheet through the DOM) at a
           between-sessions length. */
        const nActs = mode === 'deep' ? 450 + ((seed >>> 4) % 450)
                    : mode === 'medium' ? 220 + ((seed >>> 4) % 200)
                    : 120 + ((seed >>> 4) % 300);
        out = await expedition(sess, seed, nActs, mode === 'deep' || mode === 'medium');
        try { sess.w.close(); } catch (_) {}
      }
    } catch (e) { out = { mode, seed, fatal: String(e && e.message) }; }
    process.stdout.write(JSON.stringify(out) + '\n');
  }
}

function num(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: arr.length, mean: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2), p50: q(0.5), p90: q(0.9), min: s[0], max: s[s.length - 1] };
}
function aggregate(mode, runs) {
  const errTable = {};
  for (const r of runs) for (const e of (r.errors || []).concat(r.violations || [], r.breaks || [], r.fatal ? [r.fatal] : [], r.bootErrors || [], (r.post && r.post.errors) || [])) {
    const k = String(e).slice(0, 140); errTable[k] = (errTable[k] || 0) + 1;
  }
  const rep = { mode, runs: runs.length, generatedFrom: 'tools/simrun.js', errorTable: errTable };
  if (mode === 'fast' || mode === 'deep' || mode === 'medium') {
    rep.deaths = runs.filter((r) => r.deaths > 0).length;
    /* v1.5.1 death-curve audit: deaths must ramp with depth, not sit flat */
    rep.deathsByStage = {};
    for (const r of runs) if (r.deaths > 0) rep.deathsByStage['s' + (r.stageEnd || 0)] = (rep.deathsByStage['s' + (r.stageEnd || 0)] || 0) + 1;
    rep.softlocks = runs.filter((r) => r.softlock).map((r) => r.softlock);
    rep.savesOk = runs.filter((r) => r.saveOk).length;
    rep.reachedStage = { s0: 0, s1: 0, s2: 0, s3: 0 };
    for (const r of runs) rep.reachedStage['s' + (r.stageEnd || 0)]++;
    rep.jumpDriveActions = num(runs.filter((r) => r.jumpAt > 0).map((r) => r.jumpAt));
    rep.arrayActions = num(runs.filter((r) => r.arrayAt > 0).map((r) => r.arrayAt));
    rep.igActions = num(runs.filter((r) => r.igAt > 0).map((r) => r.igAt));
    rep.funIndex = num(runs.map((r) => r.funIndex || 0));
    // v1.5 leveling tier: XP curves + time-to-level + art-unlock pacing
    rep.leveling = {
      lvlTop: num(runs.map((r) => r.lvlTop || 0)),
      xpTop: num(runs.map((r) => r.xpTop || 0)),
      reachedL3: runs.filter((r) => r.lvl3At > 0).length,
      reachedL6: runs.filter((r) => r.lvl6At > 0).length,
      reachedL9: runs.filter((r) => r.lvl9At > 0).length,
      actionsToL3: num(runs.filter((r) => r.lvl3At > 0).map((r) => r.lvl3At)),
      actionsToL6: num(runs.filter((r) => r.lvl6At > 0).map((r) => r.lvl6At)),
      xpFromDuels: runs.reduce((a, r) => a + (r.xpDuels || 0), 0),
      xpFromConquest: runs.reduce((a, r) => a + (r.xpConq || 0), 0),
    };
    // v1.5 sheet-focus round: usage + assertion totals for the new screen
    rep.sheet = {
      opens: runs.reduce((a, r) => a + (r.sheetOpens || 0), 0),
      socketTaps: runs.reduce((a, r) => a + (r.socketTaps || 0), 0),
      uiEquips: runs.reduce((a, r) => a + (r.uiEquips || 0), 0),
      cargoTabs: runs.reduce((a, r) => a + (r.cargoTabs || 0), 0),
    };
    // equipment matrix: how often each piece was worn at session end
    const eqCount = {}, sysCount = {};
    for (const r of runs) {
      for (const s in (r.finalEquip || {})) eqCount[r.finalEquip[s]] = (eqCount[r.finalEquip[s]] || 0) + 1;
      for (const id of (r.systemsBuilt || [])) sysCount[id] = (sysCount[id] || 0) + 1;
    }
    rep.equipWorn = eqCount; rep.systemsBuilt = sysCount;
    const tiers = runs.filter((r) => r.bestCreature).map((r) => r.bestCreature.tier);
    rep.bestCreatureTier = num(tiers);
    rep.bestCreatureSamples = runs.filter((r) => r.bestCreature && r.bestCreature.tier >= 5)
      .slice(0, 12).map((r) => r.bestCreature.grade + ' ' + r.bestCreature.name + ' (' + r.persona + ')');
    rep.byPersona = {};
    for (const p of PERSONAS) {
      const rs = runs.filter((r) => r.persona === p);
      if (!rs.length) continue;
      rep.byPersona[p] = {
        runs: rs.length,
        funIndex: num(rs.map((r) => r.funIndex || 0)),
        gotJump: rs.filter((r) => r.jumpAt > 0).length,
        gotArray: rs.filter((r) => r.arrayAt > 0).length,
        gotIG: rs.filter((r) => r.igAt > 0).length,
        conquests: num(rs.map((r) => r.conquests || 0)),
        duelsW: rs.reduce((a, r) => a + (r.duelsW || 0), 0), duelsL: rs.reduce((a, r) => a + (r.duelsL || 0), 0),
        bestTier: num(rs.filter((r) => r.bestCreature).map((r) => r.bestCreature.tier)),
        species: num(rs.map((r) => r.speciesCount || 0)),
        crafts: num(rs.map((r) => r.crafts || 0)),
        deaths: rs.filter((r) => r.deaths > 0).length,
        hostileGroundings: rs.reduce((a, r) => a + (r.hostileGroundings || 0), 0),
        richStrikes: rs.reduce((a, r) => a + (r.richStrikes || 0), 0),
      };
    }
    // a few full sample logs for the critics
    rep.sampleLogs = runs.filter((r) => (r.log || []).length > 20).slice(0, 6)
      .map((r) => ({ persona: r.persona, funIndex: r.funIndex, actions: r.actions, finalEquip: r.finalEquip, best: r.bestCreature, log: r.log.slice(0, 60) }));
  } else {
    rep.completed = runs.filter((r) => r.completed).length;
    rep.skipPath = runs.filter((r) => r.skipped).length;
    rep.postClean = runs.filter((r) => r.postOk).length;
    const stallTable = {}, breakTable = {};
    for (const r of runs) {
      for (const s of (r.stalls || [])) stallTable[String(s).slice(0, 120)] = (stallTable[String(s).slice(0, 120)] || 0) + 1;
      for (const b of (r.breaks || [])) breakTable[String(b).slice(0, 120)] = (breakTable[String(b).slice(0, 120)] || 0) + 1;
    }
    rep.stallTable = stallTable; rep.breakTable = breakTable;
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
  console.log(JSON.stringify(rep, null, 2).slice(0, 6000));
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
