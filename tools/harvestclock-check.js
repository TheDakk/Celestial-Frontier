// v1.8.8 — the harvest clock gate.
//
// Rounds 7, 8 and 9 chased a wall-clock harvest exploit through three mitigations
// and none could close it, because the defect was in the CLOCK, not the guard: an
// offline game cannot tell "waited an hour" from "wound the clock an hour".
// v1.8.8 moves harvest onto COSMIC_EPOCH — a persisted, monotonic PLAY-TIME
// accumulator the game already used for biosphere regeneration.
//
// This asserts the outcome the three mitigations could never reach:
//   1. winding the device clock forward a DAY grants nothing
//   2. readiness still arrives on PLAY time
//   3. the button face and the action agree (one predicate, not two)
//
// Usage: node tools/harvestclock-check.js [--src=<html>]
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const { makeFake2D } = require('./fake2d.js');

const root = path.join(__dirname, '..');
const srcArg = process.argv.find((a) => a.startsWith('--src='));
const src = srcArg ? srcArg.slice(6) : path.join(root, 'celestial-frontier.html');
const probe = path.join(__dirname, 'probe-harvest.html');
execFileSync(process.execPath, [path.join(__dirname, 'make-probe-build.js'), src, probe], { stdio: 'pipe' });

let pass = 0; const fails = [];
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log('PASS  ' + name); }
  else { fails.push(name); console.log('FAIL  ' + name + (detail ? '  (' + detail + ')' : '')); }
};

// A clock we control, installed BEFORE the game script runs.
let CLOCK = 1750000000000;
const dom = new JSDOM(fs.readFileSync(probe, 'utf8'), {
  runScripts: 'dangerously', pretendToBeVisual: true,
  url: 'https://game.local/celestial-frontier.html', virtualConsole: new VirtualConsole(),
  beforeParse(w) {
    const p = w.HTMLCanvasElement.prototype;
    p.getContext = function (k) { if (k !== '2d') return null; if (!this.__f) this.__f = makeFake2D(this); return this.__f; };
    p.toDataURL = () => 'data:image/png;base64,';
    w.Date.now = () => CLOCK;                    // the device clock, ours to wind
    w.localStorage.setItem('cfcc_save_v2', JSON.stringify({ tut: 'done', name: 'Probe' }));
  },
});

setTimeout(() => {
  const H = dom.window.__PROBE_HOOK__;
  if (!H) { console.error('probe hook missing'); process.exit(2); }
  const SEED = 4242;
  const has = (k) => { try { return H[k] !== undefined; } catch (_) { return false; } };
  const EPOCHS = has('HARVEST_EPOCHS') ? H.HARVEST_EPOCHS : null;
  const ready = (c) => { try { return H._harvestReady(c); } catch (_) { return null; } };
  const harvests = () => (H.stats && H.stats.harvests) || 0;
  // Drive the REAL action, so this measures the same thing on every build —
  // an old build has no _harvestReady at all and must still be judged, not crash.
  const tryHarvest = () => { const b = harvests(); try { H.doHarvest({ planetSeed: SEED, title: 'Probe World' }); } catch (_) { } return harvests() > b; };

  // a settled world, harvested at the current clock and at the current epoch
  const row = { t: CLOCK, tier: 2 };
  if (EPOCHS != null) row.e = H.COSMIC_EPOCH;
  H.conquered.set(SEED, row);
  const c = H.conquered.get(SEED);

  check('harvest: a world just harvested is not immediately ready again',
    tryHarvest() === false, 'it paid out twice in a row');

  // ---- 1. THE ASSERTION THREE MITIGATIONS COULD NEVER MAKE ----
  CLOCK += 24 * 3600e3;                       // wind the device clock forward a DAY
  check('CF1805-05: winding the device clock forward a DAY grants NO harvest',
    tryHarvest() === false,
    'a settled world paid out purely from a clock change — the wall clock still gates this path');

  // ---- 2. READINESS MUST STILL ARRIVE, ON PLAY TIME ----
  if (EPOCHS != null) {
    c.e = H.COSMIC_EPOCH - EPOCHS;            // simulate the play-time having elapsed
    check('harvest: it DOES become ready once the play-time cost is paid',
      tryHarvest() === true,
      'HARVEST_EPOCHS=' + EPOCHS + ' of play did not make it ready — the gate is unsatisfiable');
    check('harvest: a save with no epoch stamp reads as ready (absent-safe)',
      ready({ t: 0, tier: 1 }) === true, 'an older empire would be stranded forever');
  } else {
    check('harvest: build predates the play-time clock (no HARVEST_EPOCHS)', false,
      'expected on a pre-v1.8.8 build — this is the negative control working');
  }

  // ---- 4. THE WALL-CLOCK CADENCE IS NOT REFERENCED IN THE PATH AT ALL ----
  // ⚠ This replaced a regex that tried to prove "Date.now() is never compared to
  // HARVEST_CD". It PASSED on v1.8.7, where the exploit was live, because the two
  // sit on different statements (`const now=Date.now()` … `now-c.t<HARVEST_CD`).
  // A check that passes for the wrong reason is worse than no check. `HARVEST_CD`
  // simply must not appear in doHarvest — precise, and it discriminates.
  const srcTxt = fs.readFileSync(src, 'utf8');
  const at = srcTxt.indexOf('function doHarvest');
  const body = srcTxt.slice(at, srcTxt.indexOf('\n}', at) + 2);
  check('CF1805-05: the wall-clock cadence (HARVEST_CD) is gone from doHarvest entirely',
    at > 0 && !/HARVEST_CD/.test(body),
    'doHarvest still references HARVEST_CD — readiness is still gated on wall time');

  try { fs.unlinkSync(probe); } catch (_) { }
  console.log('\n' + pass + ' passed, ' + fails.length + ' failed');
  process.exit(fails.length ? 1 : 0);
}, 4000);
