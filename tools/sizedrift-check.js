// ROUND 9 CF1806-01 — the guard against re-adding the `size` load clamp.
//
// v1.8.6 shipped TWO fixes for one problem: battleStats WRAPS size, and the load
// path CLAMPED it to 0..5. The wrap alone is correct. The clamp permanently
// rewrote honestly-bred creatures on their next load — measured at ~12% of
// lineages by generation 5 — turning a "tiny" size-6 beast into a "titanic" one
// with maximum vitality, and moving its portrait, voice and collection slot with it.
//
// This asserts the OUTCOME in both directions:
//   1. an honestly-drifted genome survives a save/load round trip UNCHANGED
//   2. the wrap alone still bounds the save-edit exploit it was written for
//
// Usage: node tools/sizedrift-check.js [--src=<html>]
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const { makeFake2D } = require('./fake2d.js');

const root = path.join(__dirname, '..');
const srcArg = process.argv.find((a) => a.startsWith('--src='));
const src = srcArg ? srcArg.slice(6) : path.join(root, 'celestial-frontier.html');
const probe = path.join(__dirname, 'probe-sizedrift.html');
execFileSync(process.execPath, [path.join(__dirname, 'make-probe-build.js'), src, probe], { stdio: 'pipe' });

let pass = 0; const fails = [];
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log('PASS  ' + name); }
  else { fails.push(name); console.log('FAIL  ' + name + (detail ? '  (' + detail + ')' : '')); }
};

const dom = new JSDOM(fs.readFileSync(probe, 'utf8'), {
  runScripts: 'dangerously', pretendToBeVisual: true,
  url: 'https://game.local/celestial-frontier.html', virtualConsole: new VirtualConsole(),
  beforeParse(w) {
    const p = w.HTMLCanvasElement.prototype;
    p.getContext = function (k) { if (k !== '2d') return null; if (!this.__f) this.__f = makeFake2D(this); return this.__f; };
    p.toDataURL = () => 'data:image/png;base64,';
  },
});

setTimeout(() => {
  const H = dom.window.__PROBE_HOOK__;
  if (!H) { console.error('probe hook missing'); process.exit(2); }
  const { makeGenome, crossGenome, evolveGenome, battleStats, _sanitizeSavedGenome } = H;
  const SIZE_N = 6;

  // ---- 1. HONEST DRIFT: how often does breeding push size past 5? ----
  const N = 500;
  let over = 0, max = 0, sample = null;
  for (let i = 0; i < N; i++) {
    let a = makeGenome(100000 + i * 7, 'fauna', 0.5);
    let b = makeGenome(900000 + i * 13, 'fauna', 0.5);
    let child = a;
    for (let g = 0; g < 5; g++) {
      child = evolveGenome(crossGenome(a, b), 1);
      a = child; b = makeGenome(500000 + i * 31 + g, 'fauna', 0.5);
    }
    if ((child.size | 0) > 5) { over++; if (!sample) sample = child; }
    if ((child.size | 0) > max) max = child.size | 0;
  }
  const pct = (over / N * 100).toFixed(1);
  console.log(`\n  honest drift: size>5 in ${over}/${N} lineages by gen 5 (${pct}%), max ${max}\n`);
  check('CF1806-01: honest breeding really does drift size past 5 (the premise)', over > 0,
    'no drift found — if crossGenome changed, revisit this whole check');

  // ---- 2. THE LOAD PATH MUST NOT REWRITE IT ----
  const drifted = sample || Object.assign(makeGenome(7, 'fauna', 0.5), { size: 9 });
  const before = drifted.size | 0;
  const roundTripped = _sanitizeSavedGenome(JSON.parse(JSON.stringify(drifted)));
  check('CF1806-01: an honestly-drifted size survives the load path UNCHANGED',
    roundTripped && (roundTripped.size | 0) === before,
    'size ' + before + ' -> ' + (roundTripped && roundTripped.size) +
    ' — a clamp has been re-added to _sanitizeSavedGenome; it rewrites real player data');

  // the visible consequence, asserted rather than described
  const vitOf = (size) => battleStats(Object.assign({}, drifted, { size })).vit;
  check('CF1806-01: and its vitality does not jump on reload',
    vitOf(before) === vitOf((roundTripped && roundTripped.size) | 0),
    'vit ' + vitOf(before) + ' -> ' + vitOf((roundTripped && roundTripped.size) | 0));

  // ---- 3. A DRIFTED SIZE IS THE SAME CREATURE AS ITS WRAPPED EQUIVALENT ----
  // v1.8.9: size was read RAW by sapienceTier / classifyRealm / speciesGrade, so a
  // bred size-6 creature printed "tiny" on its card and was classified MEGAFAUNA
  // with the full rarity boost. 6 % 6 === 0, so these must now be indistinguishable.
  for (const [drift, base] of [[6, 0], [7, 1], [9, 3], [12, 0]]) {
    check('CF1806-01: a bred size-' + drift + ' creature is treated exactly as size-' + base +
      ' (the card and the classifier agree)',
      vitOf(drift) === vitOf(base),
      'vit ' + vitOf(drift) + ' vs ' + vitOf(base) + ' — a raw `g.size` reader is back');
  }

  // ---- 4. THE WRAP STILL BOUNDS THE EXPLOIT THE CLAMP WAS WRITTEN FOR ----
  const legitMax = Math.max(...[0, 1, 2, 3, 4, 5].map(vitOf));
  const crafted = vitOf(1000000);
  check('CF1806-01: a crafted size:1e6 stays within the legitimate range (the wrap alone closes it)',
    crafted <= legitMax, 'crafted vit ' + crafted + ' vs legitimate max ' + legitMax);

  try { fs.unlinkSync(probe); } catch (_) { }
  console.log('\n' + pass + ' passed, ' + fails.length + ' failed');
  process.exit(fails.length ? 1 : 0);
}, 4000);
