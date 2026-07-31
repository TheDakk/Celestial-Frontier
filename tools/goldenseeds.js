/* GOLDEN SEEDS — capture and verify 10,000 cross-language golden seed cases.
   Port Phase 0 / Gate A deliverable: "add 10,000 cross-language-ready golden
   seed cases".

   WHY: the 50-probe fingerprint (tools/baseline.json) proves THIS build still
   behaves like v1.0. It does NOT give a TypeScript re-implementation enough to
   check itself against — 50 hand-picked cases is a smoke test, not a parity
   corpus, and it says nothing about WHICH input diverged. This produces a corpus
   with per-seed granularity, so a failing port can be pinpointed to one seed.

   USAGE
     node tools/goldenseeds.js --capture          # write the fixture
     node tools/goldenseeds.js --check            # re-run and compare (a GATE)
     node tools/goldenseeds.js --capture --count=500 --heavy=100    # quick pass

   EXIT 0 = match / captured. EXIT 1 = divergence or boot failure.

   ⚠ THE FIXTURE IS NOT A BASELINE TO REGENERATE ON FAILURE. Same rule as
   tools/baseline.json: a --check mismatch means observable generator behavior
   changed. Re-capture only when the change is intended and recorded. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootProbe, root } = require('./_probeboot.js');

const OUT = path.join(root, 'port', 'baseline-v1.8.9', 'golden-seeds.json');

const argOf = (n, d) => {
  const a = process.argv.find((x) => x.startsWith('--' + n + '='));
  return a ? a.slice(n.length + 3) : d;
};
const CAPTURE = process.argv.includes('--capture');
const CHECK = process.argv.includes('--check');
if (!CAPTURE && !CHECK) { console.error('usage: node tools/goldenseeds.js --capture | --check  [--count=N] [--heavy=N]'); process.exit(2); }

const CFG = {
  count: parseInt(argOf('count', '10000'), 10),
  heavy: parseInt(argOf('heavy', '1000'), 10),
  samples: parseInt(argOf('samples', '5'), 10),
};

/* ⚠ IN --check, THE FIXTURE DEFINES THE CORPUS SIZE, not this tool's defaults.
   The first version took counts from the CLI in both modes, so checking a fixture
   captured at --count=50 re-ran 10,000 cases and reported "26 generators diverged".
   That is a FALSE ALARM, and a check that cries wolf gets ignored — the same
   failure mode simrun's `dead` adjudication was built to avoid. Explicit --count
   on the command line still wins, so a deliberate partial check stays possible. */
if (CHECK && fs.existsSync(OUT)) {
  try {
    const prev = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    if (prev && prev.counts) {
      if (!process.argv.some((a) => a.startsWith('--count='))) CFG.count = prev.counts.allTier;
      if (!process.argv.some((a) => a.startsWith('--heavy='))) CFG.heavy = prev.counts.heavyTier;
    }
  } catch (_) { /* a corrupt fixture is caught below with a clearer message */ }
}

const started = Date.now();

/* jsdom boot lives in _probeboot.js — shared with codefixtures.js so the two
   fixtures are guaranteed to describe the SAME realm. */
bootProbe({
  probe: 'goldenseeds-probe.js',
  global: '__GOLDEN__',
  pre: (w) => { w.__GOLDEN_CFG__ = CFG; },
}).then(({ value: G, errors, window }) => {
  {
    if (!G || G.error) {
      console.error('GOLDEN SEEDS: probe failed —', (G && G.error) || 'no result');
      if (errors.length) console.error(errors.slice(0, 5).join('\n'));
      process.exit(1);
    }
    const gnames = Object.keys(G.generators).sort();
    const secs = ((Date.now() - started) / 1000).toFixed(1);

    if (CAPTURE) {
      const fixture = {
        _comment: [
          'GOLDEN SEED CORPUS — port Phase 0 / Gate A.',
          'A TypeScript re-implementation must reproduce every perSeed hash below.',
          '',
          'CANONICAL FORM before hashing (must match exactly):',
          '  numbers  -> non-finite: String(v); else Math.round(v*1e9)/1e9',
          '  objects  -> keys sorted, then JSON.stringify',
          '  arrays   -> element-wise, order preserved',
          '  undefined-> null',
          'This is the same 1e-9 rounding tools/probe.js uses for the 50-probe',
          'fingerprint, reused deliberately so both fixtures agree on "equal".',
          '',
          'HASH: FNV-1a 32-bit run twice (offset bases 0x811c9dc5 and 0x9e3779b9),',
          'each printed as 8 hex chars and concatenated -> 16 chars. No crypto',
          'import needed in any language.',
          '',
          'ROLLUP: fold over the per-seed hashes, roll = hash(roll + perSeed[i]),',
          'starting from the empty string. Check the rollup first; fall back to',
          'perSeed to find WHICH seed diverged.',
          '',
          'SEEDS ARE LISTED EXPLICITLY on purpose — a port must not have to',
          'reimplement a seed generator to use this corpus. Reproducing a PRNG',
          'just to obtain test inputs is a second source of divergence.',
          '',
          '⚠ DO NOT REGENERATE THIS TO MAKE A FAILING --check PASS. Same rule as',
          'tools/baseline.json: a mismatch means observable behavior changed.',
        ],
        capturedAt: new Date(0).toISOString().slice(0, 10) === '1970-01-01' ? '2026-07-31' : '2026-07-31',
        capturedAgainst: 'v1.8.9 (tag v1.8.9, commit 92098e9)',
        canonicalisation: { numberRounding: '1e-9', objectKeys: 'sorted', undefinedAs: 'null' },
        hash: { algorithm: 'FNV-1a-32 x2', bases: ['0x811c9dc5', '0x9e3779b9'], prime: '0x01000193', output: '16 hex chars' },
        counts: { seeds: G.seeds.length, generators: gnames.length, allTier: CFG.count, heavyTier: Math.min(CFG.heavy, CFG.count) },
        seeds: G.seeds,
        generators: G.generators,
        samples: G.samples,
      };
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify(fixture, null, 1));
      const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
      console.log('GOLDEN SEEDS captured in ' + secs + 's');
      console.log('  seeds      : ' + G.seeds.length);
      console.log('  generators : ' + gnames.length + ' (' + gnames.filter((n) => G.generators[n].tier === 'all').length + ' all-tier, ' + gnames.filter((n) => G.generators[n].tier === 'heavy').length + ' heavy-tier)');
      console.log('  cases      : ' + gnames.reduce((a, n) => a + G.generators[n].cases, 0).toLocaleString());
      console.log('  written    : ' + path.relative(root, OUT) + ' (' + kb + ' KB)');
      window.close();
      process.exit(errors.length ? 1 : 0);
    }

    /* ---------- --check ---------- */
    if (!fs.existsSync(OUT)) { console.error('GOLDEN SEEDS: no fixture at ' + OUT + ' — run --capture first'); process.exit(1); }
    const base = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    let bad = 0;
    if (JSON.stringify(base.seeds) !== JSON.stringify(G.seeds)) {
      console.error('SEED LIST DIVERGED — the corpus inputs themselves changed.');
      bad++;
    }
    for (const n of gnames) {
      const b = base.generators[n];
      if (!b) { console.error('  NEW generator not in fixture: ' + n); bad++; continue; }
      if (b.rollup === G.generators[n].rollup) continue;
      bad++;
      const bp = b.perSeed || [], gp = G.generators[n].perSeed || [];
      const diffs = [];
      for (let i = 0; i < Math.min(bp.length, gp.length) && diffs.length < 5; i++) if (bp[i] !== gp[i]) diffs.push(i);
      console.error('  MISMATCH ' + n + ' — rollup ' + b.rollup + ' -> ' + G.generators[n].rollup);
      for (const i of diffs) console.error('      seed[' + i + '] = ' + G.seeds[i] + ' : ' + bp[i] + ' -> ' + gp[i]);
      if (!diffs.length) console.error('      (per-seed hashes match; the rollup or case count moved — check `cases`)');
    }
    for (const n of Object.keys(base.generators)) if (!G.generators[n]) { console.error('  MISSING generator, present in fixture: ' + n); bad++; }

    console.log('');
    if (bad) console.log('GOLDEN SEEDS: FAIL — ' + bad + ' generator(s) diverged. This means observable behavior changed. Do NOT re-capture to make it pass.');
    else console.log('GOLDEN SEEDS: PASS — ' + gnames.length + ' generators, ' + gnames.reduce((a, n) => a + G.generators[n].cases, 0).toLocaleString() + ' cases, all rollups identical (' + secs + 's)');
    window.close();
    process.exit(bad ? 1 : 0);
  }
}).catch((e) => { console.error('GOLDEN SEEDS: ' + ((e && e.stack) || e)); process.exit(1); });
