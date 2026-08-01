/* SAVE FIXTURES — capture and verify the LOAD PATH's observable outcome over
   curated cfcc_save_v2 inputs. Port Phase 2, Gate C's parity harness.

   WHY: the TS importer (port/v2 @cf/persistence importSaveV2) is the first
   REWRITTEN (not lifted) surface — every loadSave clamp is a shipped-defect
   lesson, and the importer must be tested against the REAL loadSave's
   behavior, never against itself. Each fixture below is seeded into
   localStorage BEFORE the game script runs (bootProbe beforeBoot), so the
   game's own boot-time loadSaveWithRecovery loads it — the player-device
   flow, including the recovery path.

   USAGE
     node tools/savefixtures.js --capture
     node tools/savefixtures.js --check      # a GATE

   ⚠ DETERMINISM: loadSave clamps stamps against Date.now(). Every fixture
   keeps timestamps in the PAST and valid so the captured value cannot encode
   capture time; the driver double-boots the richest fixture and fails if the
   two snapshots differ. Future-t clamp behavior (t -> "now") is deliberately
   NOT fixture-pinned — the TS importer tests it with an injected clock.
   ⚠ NEVER re-capture to make a failing --check pass. Same rule as
   baseline.json / golden-seeds.json. */
'use strict';
const fs = require('fs');
const path = require('path');
const { bootProbe, root } = require('./_probeboot.js');

const OUT = path.join(root, 'port', 'baseline-v1.8.9', 'save-fixtures.json');
const CAPTURE = process.argv.includes('--capture');
const CHECK = process.argv.includes('--check');
if (!CAPTURE && !CHECK) { console.error('usage: node tools/savefixtures.js --capture | --check'); process.exit(2); }

const SAVE_KEY = 'cfcc_save_v2';
/* a FIXED past wall-clock anchor (2026-07-30ish) — every stamp derives from it */
const AT = 1753900000000;

/* real makeGenome outputs (generated from the ported verbatim makeGenome —
   byte-identical to the game's) + one honestly-drifted bred child (size 9:
   the sizedrift law's protected case) and hostile shapes */
const G_FAUNA = { seed: 1234, kingdom: 'fauna', color: 9, form: 13, body: 5, loco: 11, trait: 7, size: 4, diet: 1, head: 0, limbs: 1, skin: 6, tail: 2, pattern: 3, eyes: 0, behavior: 10, habitat: 13, detail: 9, accent: 9, temper: 1, sense: 7, repro: 6, life: 0, metab: 2, lumin: false, gen: 0, heat: 0.5 };
const G_FLORA = { seed: 777, kingdom: 'flora', color: 7, form: 4, body: 7, loco: 11, trait: 2, size: 4, diet: 3, head: 2, limbs: 5, skin: 8, tail: 4, pattern: 1, eyes: 2, behavior: 6, habitat: 10, detail: 4, accent: 12, temper: 8, sense: 4, repro: 0, life: 4, metab: 3, lumin: false, gen: 0, heat: 0.3 };
const G_DRIFT = { seed: 4242, kingdom: 'fauna', color: 14, form: 7, body: 14, loco: 17, trait: 2, size: 9, diet: 3, head: 9, limbs: 2, skin: 3, tail: 1, pattern: 2, eyes: 3, behavior: 6, habitat: 6, detail: 2, accent: 13, temper: 6, sense: 0, repro: 3, life: 2, metab: 3, lumin: true, gen: 3, heat: 0.6, parents: [1, 2] };
const G_HOSTILE = { seed: 99, kingdom: 'fauna', size: 1e6, gen: '2', color: 3, form: 1, body: 1, loco: 1, trait: 1, diet: 1, head: 1, limbs: 1, skin: 1, tail: 1, pattern: 1, eyes: 1, behavior: 1, habitat: 1, detail: 1, accent: 1, temper: 1, sense: 1, repro: 1, life: 1, metab: 1, lumin: false, heat: 1, apex: 3, fed: 99999 };

const VIEW = { type: 'planet', gal: { x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, seed: 999, home: true }, star: { x: 560, y: 170, seed: 424242 }, pseed: 133 };

const FIXTURES = {
  /* {} — every absent-safe default at once (tut absent ⇒ done, tips on, vol 1…) */
  empty_object: {},

  /* the representative rich save — most fields populated with valid values */
  veteran_rich: {
    epoch: 12, at: AT, me: 'Dakk', essence: 5000,
    shares: 3, jumps: 41, anomalies: 2, anomKey: 'k1', events: 5, duels: 7, duelwins: 4,
    breeds: 2, breedwins: 1, feeds: 9, feedfails: 1, harvests: 6, essenceEarned: 9000,
    guardians: 1, paragons: 0, mines: 14, crafts: 3, minedout: 1, skims: 2, cosmics: 1,
    landings: 12, charters: 2, surveys: 0,
    names: [['p133', 'Homeworld'], ['c1234', '<b>Rex</b>'], ['s424242', 'Sol Prime']],
    conq: [[101, { t: AT - 3600e3, tier: 4, e: 5 }], [102, { t: AT - 7200e3, tier: 2 }], [103, { t: AT - 60e3, tier: 9, e: 1e9 }]],
    cargo: [['Fe', 40], ['Si', 12]], cgx: [['Fe', 5], ['Si', 99]],
    items: [['plate', 3], ['lens', 1], ['cell', 2], ['headlamp', 1]],
    eq: { helmet: 'headlamp' }, ea: { helmet: { k: 'strike', v: 0.05, forId: 'headlamp' } },
    pin: 'plate', ctb: 'craft',
    seen: ['f1234'], jrn: [{ s: 1, n: 'Testling', w: 'Earth', t: AT - 1e6 }, { s: 2, n: 'Verdant', w: 'Mars', t: AT - 2e6 }],
    minedw: [[201, AT - 2 * 6e5]], mx: [[201, 4]], skx: [[424242, 2]], bx: [[301, [3, 2]]],
    tech: ['scan1', 'hull1', 'nope'], setsc: ['kingdoms', 'bogus'],
    asc: 2, ascp: { land: 3, scan: 12 },
    nh: 2, br: 3, view: VIEW,
    pstats: { vit: 80, fer: 60, res: 70, agi: 50, ins: 40 }, hp: 55,
    fs: 'fs-lg', tone: 'tone-bright', font: 'font-mono',
    snd: 0, fx: 1, chart: 1, shake: 0, sv: 1, notif: 1, tips: 0, vol: 37, gt: 55, rm: 1, cx: 21,
    vce: 0, cbx: 1,
    notifs: [{ id: 1, tt: 'Hello', ms: 'World', t: AT - 5e5, read: true }, { id: 4, tt: 'Second', ms: '', t: AT - 4e5, read: false }],
    surveyed: ['a1', 'a2'], gals: [999], surf: [11, 12], xpf: ['land:first'], sysv: [424242, 31337],
    starK: ['G', 'M'], ptypes: ['terran', 'gas'], evts: ['e1'], evann: ['e1'],
    ach: ['first', 'field10', 'fake'],
    codex: [{ g: G_FAUNA, f: 'Earth', w: VIEW }, { g: G_FLORA, f: 'Mars' }, { g: G_DRIFT, f: 'Kepler' }],
    scout: 'nonexistent-id',
    chs: ['st-land'], chw: 5, chp: { 'st-mine': 2 }, chacc: ['st-mine'],
    log: [{ id: 'p133', title: 'Earth', sub: 'The cradle', badge: 'Home', where: VIEW, fav: true, t: AT - 9e5, thumb: 'data:image/png;base64,AAAA' }],
    home: 'p133',
    land: [133, 134], cont: [55], wvo: [[901, 3], [902, 9]],
    prime: { stone: { title: 'First Stone', sub: 'stub', tier: 3, hex: '#a0b0c0', where: VIEW }, bogus: { title: 'x' } },
    frontier: 1, ending: 'dawn', guide: 1, tut: 1, rn: '1.8.9',
  },

  /* CF-RR-002: {} where arrays belong, junk scalars — must not throw, rest survives */
  hostile_shapes: {
    epoch: 'x', at: 'y', me: 42, essence: -5,
    names: {}, conq: {}, cargo: 'x', cgx: 9, items: 4, eq: 7, ea: 'z',
    seen: 3, jrn: {}, minedw: {}, mx: 'n', skx: {}, bx: 'b', tech: {}, setsc: 0,
    ascp: [], view: { gal: { x: 'NaN', size: 'huge' } },
    pstats: { vit: '9', fer: 1e9 }, hp: 'x',
    notifs: 'y', surveyed: {}, codex: {}, log: 5, prime: 3, chp: [],
    tut: 0, tsnap: { not: 'an-expedition' },
  },

  /* markup + over-cap arrays: sanitizers and CF-CR-009 bounds */
  hostile_markup_caps: {
    at: AT, me: '<img onerror=x>Evil', epoch: 2,
    names: Array.from({ length: 12 }, (_, i) => ['k' + i, i === 0 ? '<b>Bad</b>' : 'Name' + i]),
    jrn: Array.from({ length: 30 }, (_, i) => ({ s: i, n: 'N<i>' + i, w: 'W' + i, t: AT - i * 1000 })),
    notifs: Array.from({ length: 70 }, (_, i) => ({ id: i, tt: 'T' + i, ms: 'M' + i, t: AT - i * 1000, read: false })),
    log: [
      { id: '<b>x</b>1', title: 'T<script>', sub: 'S&"', badge: 'VeryLongBadgeName!', where: VIEW, t: AT - 1e5, thumb: 'data:image/png;base64,x" onerror="alert(1)' },
      { id: '<>&"\'', title: 'AllStripped', t: AT - 1e5 },
    ],
    codex: [{ g: G_HOSTILE, f: '<b>Bad</b>Place' }],
  },

  /* pre-v1.7 veteran: no `seen` field ⇒ every catalogued species backfills
     as viewed; conq rows without `e` ⇒ the one-time READY migration */
  pre_v17_veteran: {
    epoch: 8, at: AT, essence: 100,
    conq: [[501, { t: AT - 5e6, tier: 1 }], [502, { t: AT - 6e6, tier: 3 }]],
    codex: [{ g: G_FAUNA, f: 'Old' }, { g: G_FLORA, f: 'Old' }],
  },

  /* mid-training save: tut false + tsnap ⇒ snapshot pending */
  tut_midtraining: {
    epoch: 0, at: AT, tut: 0,
    tsnap: { codex: [], essence: 10, marker: 'pre-training-expedition' },
  },

  /* settings edge spread: whitelists, clamps, absent-vs-explicit */
  settings_spread: {
    at: AT, fs: 'fs-xl', tone: 'tone-nope', font: 'font-sys',
    snd: 1, fx: 0, chart: 0, shake: 1, sv: 0, notif: 0, tips: 1,
    vol: 200, gt: 900, rm: 0, cx: 99, nh: 99, hd: 0,
  },

  /* equip integrity: gear not owned ⇒ not equipped; affix for wrong item ⇒ dropped */
  equip_integrity: {
    at: AT, items: [['visor', 0], ['headlamp', 1]],
    eq: { helmet: 'visor', suit: 'fieldsuit' },
    ea: { helmet: { k: 'strike', v: 99, forId: 'visor' } },
  },
};

/* the recovery path: primary corrupt, backup valid ⇒ boot restores the backup */
const RECOVERY = {
  primary: '###corrupted-not-json###',
  backup: JSON.stringify({ epoch: 4, at: AT, essence: 777, me: 'Recovered' }),
};

function bootWith(seed) {
  return bootProbe({
    probe: 'savefixtures-probe.js', global: '__SAVEFX__', quiet: true,
    /* ⚠ non-opaque origin REQUIRED: under the default file:// realm,
       localStorage throws ("opaque origins") — the seed silently fails and
       every fixture captures a FRESH boot. Found on the very first run when
       beforeBoot reported exactly that. Same origin smoke.js uses. */
    url: 'https://game.local/celestial-frontier.html',
    beforeBoot: (w) => { w.__SAVEFX_ANCHOR__ = AT; for (const [k, v] of Object.entries(seed)) w.localStorage.setItem(k, v); },
  });
}

(async () => {
  const results = {};
  const order = Object.keys(FIXTURES);
  for (const name of order) {
    const seed = { [SAVE_KEY]: JSON.stringify(FIXTURES[name]) };
    const { value, errors } = await bootWith(seed);
    if (!value || value.error) { console.error(name + ': probe failed — ' + JSON.stringify(value || errors.slice(0, 3))); process.exit(1); }
    results[name] = value.fields;
    console.log('  ' + name + ' ✓');
  }
  /* recovery fixture: corrupt primary + valid backup */
  {
    const { value } = await bootWith({ [SAVE_KEY]: RECOVERY.primary, [SAVE_KEY + '_bak']: RECOVERY.backup });
    if (!value || value.error) { console.error('recovery probe failed'); process.exit(1); }
    results.recovery_from_backup = value.fields;
    console.log('  recovery_from_backup ✓');
  }
  /* determinism self-check: the richest fixture AND the recovery path (which
     mints a boot-time notification — the probe must have normalized it),
     each booted twice, byte-equal */
  for (const [nm, seed] of [
    ['veteran_rich', { [SAVE_KEY]: JSON.stringify(FIXTURES.veteran_rich) }],
    ['recovery_from_backup', { [SAVE_KEY]: RECOVERY.primary, [SAVE_KEY + '_bak']: RECOVERY.backup }],
  ]) {
    const { value } = await bootWith(seed);
    const a = JSON.stringify(results[nm]), b = JSON.stringify(value.fields);
    if (a !== b) {
      const ka = Object.keys(results[nm]).filter((k) => results[nm][k] !== value.fields[k]);
      console.error('DETERMINISM SELF-CHECK FAILED (' + nm + ') — fields differing between two boots: ' + ka.join(', '));
      console.error('(a wall-clock leak in a fixture or the probe — fix the INPUT, do not capture)');
      process.exit(1);
    }
    console.log('  determinism self-check (' + nm + ', double boot) ✓');
  }

  if (CAPTURE) {
    const out = {
      _comment: 'LOAD-PATH fixtures: curated cfcc_save_v2 inputs (inputs{}) and the observable post-boot state the REAL loadSaveWithRecovery produced (results{}). The TS importer must reproduce results from inputs. Canonical form + FNV rules match codefixtures. NEVER re-capture to make a failing --check pass.',
      capturedAt: new Date().toISOString(),
      capturedAgainst: 'v1.8.9',
      inputs: { ...Object.fromEntries(order.map((n) => [n, FIXTURES[n]])), recovery_from_backup: RECOVERY },
      results,
    };
    fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
    console.log('SAVE FIXTURES captured: ' + (order.length + 1) + ' fixtures -> ' + path.relative(root, OUT));
    process.exit(0);   /* jsdom raf timers keep node alive forever otherwise */
  } else {
    const want = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    let bad = 0;
    for (const name of Object.keys(want.results)) {
      const w = want.results[name], g = results[name];
      if (!g) { console.error('MISSING fixture run: ' + name); bad++; continue; }
      for (const f of Object.keys(w)) {
        if (w[f] !== g[f]) { console.error('MISMATCH ' + name + '.' + f); bad++; }
      }
    }
    if (bad) { console.error('SAVE FIXTURES: FAIL — ' + bad + ' mismatches'); process.exit(1); }
    console.log('SAVE FIXTURES: PASS — ' + Object.keys(want.results).length + ' fixtures, all fields identical');
    process.exit(0);
  }
})();
