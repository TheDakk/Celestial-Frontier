/* AUDIO PROFILES — capture voiceOf() fixtures and re-measure the voice vocabulary.
   Port Phase 0 / Gate A: "capture current audio-profile outputs for representative
   genomes". Feeds §15 and Gate G, and produces evidence for two open §23 decisions.

   USAGE
     node tools/audioprofiles.js --capture            # fixture + full measurement
     node tools/audioprofiles.js --check              # a GATE (fixture only)
     node tools/audioprofiles.js --capture --population=20000    # quick pass

   ⚠ THE MEASUREMENT IS RE-DERIVED, NOT TRANSCRIBED. The claim that the human
   listening test is "now unblocked" rests on an external reviewer's v1.8.6
   numbers. Phase 0's job is to re-measure them against v1.8.9 — a transcribed
   figure is a claim; a measured one is evidence.

   ⚠ --check compares the FIXTURE only. The measurement is a statistic over a
   large population and is reported for the record, not asserted, because a
   population statistic drifting slightly is not the same event as a generator
   changing behaviour. The fixture is what must not move. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootProbe, root } = require('./_probeboot.js');

const OUT = path.join(root, 'port', 'baseline-v1.8.9', 'audio-profiles.json');
const argOf = (n, d) => { const a = process.argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const CAPTURE = process.argv.includes('--capture');
const CHECK = process.argv.includes('--check');
if (!CAPTURE && !CHECK) { console.error('usage: node tools/audioprofiles.js --capture | --check [--population=N]'); process.exit(2); }

const CFG = {
  fixture: parseInt(argOf('fixture', '200'), 10),
  population: parseInt(argOf('population', CHECK ? '2000' : '200000'), 10),
  collection: parseInt(argOf('collection', '50'), 10),
  trials: parseInt(argOf('trials', '400'), 10),
};
/* in --check the fixture size must match what was captured, or every case shifts */
if (CHECK && fs.existsSync(OUT)) {
  try {
    const p = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    if (p && p.fixture && Array.isArray(p.fixture.perCase) && !process.argv.some((a) => a.startsWith('--fixture='))) {
      CFG.fixture = p.fixture.perCase.length;
    }
  } catch (_) { /* reported below */ }
}

/* ⚠ _VOICE / _VOICE_KEYS are NOT exposed on __PROBE_HOOK__, and the family a
   procedural creature gets is picked by
       _VOICE_KEYS[(hashInt(seed,0x5F0C,0x2D)>>>4) % _VOICE_KEYS.length]
   To measure the `legacy` share (an open §23 item) the probe needs that key list.
   READ IT FROM SOURCE rather than hand-typing it — a hand-typed vocabulary that
   drifts out of step with its array is precisely the CF1805-03 defect, and it was
   found in voiceOf itself. If this extraction ever fails, the family measurement
   is skipped rather than silently computed against a wrong list. */
(function readVoiceKeys() {
  try {
    const src = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
    const i = src.indexOf('const _VOICE=');
    if (i < 0) return;
    const blk = src.slice(i, src.indexOf('const _VOICE_KEYS', i));
    const keys = [...blk.matchAll(/^\s*(\w+)\s*:\s*\{/gm)].map((m) => m[1]);
    if (keys.length) CFG.voiceKeys = keys;
  } catch (_) { /* leave unset; the probe reports familySource:'unavailable' */ }
}());

const started = Date.now();
bootProbe({ probe: 'audioprofiles-probe.js', global: '__AUDIO__', pre: (w) => { w.__AUDIO_CFG__ = CFG; } })
  .then(({ value: A, errors, window }) => {
    if (!A || A.error) {
      console.error('AUDIO PROFILES: probe failed —', (A && A.error) || 'no result');
      if (errors.length) console.error(errors.slice(0, 5).join('\n'));
      process.exit(1);
    }
    const m = A.measurement;
    const secs = ((Date.now() - started) / 1000).toFixed(1);

    if (CAPTURE) {
      const fixture = {
        _comment: [
          'AUDIO PROFILE FIXTURE + VOICE VOCABULARY MEASUREMENT — Phase 0 / Gate A.',
          '',
          'voiceOf(g) -> {kind, f0, rich, nz, vib, vibD, dur, sweep}. Deterministic',
          'per genome; no audio is synthesised here. Canonical form and FNV-1a hash',
          'match golden-seeds.json, so all three fixtures agree on "equal".',
          '',
          '`fixture` is the parity corpus and MUST NOT MOVE — --check asserts it.',
          '`measurement` is a population statistic, reported for the record and NOT',
          'asserted, because a statistic drifting is not the same event as a',
          'generator changing behaviour.',
          '',
          'TWO OPEN §23 DECISIONS ARE EVIDENCED HERE (both Nick’s):',
          '  · the `legacy` voice family — _VOICE_KEYS is Object.keys(_VOICE) and',
          '    _VOICE includes `legacy`, so procedural creatures are assigned it as',
          '    a first-class family. `families` below shows how often.',
          '  · the f0 ceiling — voiceOf clamps f0 to [60, 6000]. `pinnedAtCeiling`',
          '    counts creatures whose voice stops varying at the top of that range.',
        ],
        capturedAt: '2026-07-31',
        capturedAgainst: 'v1.8.9 (tag v1.8.9, commit 92098e9)',
        config: CFG,
        fixture: A.fixture,
        samples: A.samples,
        measurement: m,
      };
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify(fixture, null, 1));

      console.log('AUDIO PROFILES captured in ' + secs + 's');
      console.log('  fixture cases            : ' + A.fixture.perCase.length + '  (rollup ' + A.fixture.rollup + ')');
      console.log('');
      console.log('  === VOICE VOCABULARY, re-measured against v1.8.9 ===');
      console.log('  population               : ' + m.population.toLocaleString());
      console.log('  distinct voices          : ' + m.distinctVoices.toLocaleString() + '  (' + m.distinctPct + '%)');
      console.log('  share a voice with another: ' + m.creaturesSharingAVoice.toLocaleString() + '  (' + m.creaturesSharingAVoicePct + '%)');
      console.log('  duplicate in a ' + m.collectionSize + '-collection: ' + m.collectionsWithDuplicate + ' of ' + m.collectionsTested + '  (' + m.collectionsWithDuplicatePct + '%)');
      console.log('');
      console.log('  === f0, and the ceiling that is an open decision ===');
      console.log('  clamp                    : [' + m.f0.clampLow + ', ' + m.f0.clampHigh + '] Hz');
      console.log('  observed                 : ' + m.f0.observedMin + ' .. ' + m.f0.observedMax + ' Hz  (mean ' + m.f0.mean + ')');
      console.log('  pinned AT the ceiling    : ' + m.f0.pinnedAtCeiling.toLocaleString() + '  (' + m.f0.pinnedAtCeilingPct + '%)');
      console.log('  pinned AT the floor      : ' + m.f0.pinnedAtFloor.toLocaleString() + '  (' + m.f0.pinnedAtFloorPct + '%)');
      console.log('');
      console.log('  === VOICE FAMILIES (' + m.familyCount + ') — `legacy` is an open §23 decision ===');
      console.log('  source: ' + m.familySource);
      for (const f of m.families.slice().sort((a, b) => b.count - a.count)) {
        console.log('    ' + f.family.padEnd(12) + String(f.count).padStart(8) + '  ' + String(f.pct).padStart(7) + '%' + (f.family === 'legacy' ? '   <-- §23 OPEN ITEM' : ''));
      }
      console.log('');
      console.log('  === sound archetypes (' + m.kindCount + ' `kind` values — a DIFFERENT vocabulary) ===');
      console.log('    ' + m.kinds.slice().sort((a, b) => b.count - a.count).map((k) => k.kind + ' ' + k.pct + '%').join(' · '));
      console.log('');
      console.log('  written                  : ' + path.relative(root, OUT) + ' (' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB)');
      window.close();
      process.exit(errors.length ? 1 : 0);
    }

    /* ---------- --check: the fixture only ---------- */
    if (!fs.existsSync(OUT)) { console.error('AUDIO PROFILES: no fixture at ' + OUT + ' — run --capture first'); process.exit(1); }
    const base = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    let bad = 0;
    if (base.fixture.rollup !== A.fixture.rollup) {
      bad++;
      console.error('  ROLLUP MISMATCH: ' + base.fixture.rollup + ' -> ' + A.fixture.rollup);
      const bp = base.fixture.perCase, gp = A.fixture.perCase;
      let shown = 0;
      for (let i = 0; i < Math.min(bp.length, gp.length) && shown < 5; i++) {
        if (bp[i].h !== gp[i].h) { console.error('      case[' + i + '] seed ' + gp[i].seed + ' (' + gp[i].kingdom + '): ' + bp[i].h + ' -> ' + gp[i].h); shown++; }
      }
    }
    console.log('');
    if (bad) console.log('AUDIO PROFILES: FAIL — voiceOf output changed. Do NOT re-capture to make it pass.');
    else console.log('AUDIO PROFILES: PASS — ' + base.fixture.perCase.length + ' voice profiles identical (' + secs + 's)');
    window.close();
    process.exit(bad ? 1 : 0);
  })
  .catch((e) => { console.error('AUDIO PROFILES: ' + ((e && e.stack) || e)); process.exit(1); });
