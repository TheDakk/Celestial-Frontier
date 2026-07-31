/* CODE + HARDENING FIXTURES probe — runs in the game's realm via __PROBE_HOOK__.
   Port Phase 0 / Gate A: "capture representative saves, share codes, champion
   codes, and migration fixtures". Feeds Gate C ("real current save imports
   successfully · size round-trips unchanged · corrupt primary restores from
   backup").

   WHY CURATED CASES, NOT 10,000 RANDOM ONES: golden-seeds.json already covers
   volume. What a codec and a load-path hardener need is the OPPOSITE — named
   adversarial edges, each with a stated expectation. A random corpus will never
   contain `size: 1e6` or a `__proto__` key.

   WHAT IS PINNED HERE
     · encodeCreature / decodeCreature   — share codes AND champion codes
       (same function; `champ` is the second arg and carries xp)
     · encodeWhere / decodeWhere         — location codes
     · normGenome                        — hardening of UNTRUSTED IMPORTS
     · _sanitizeSavedGenome              — hardening of the LOAD PATH
     · cleanName                         — name sanitisation

   ⚠ THE `size` CASES ARE THE POINT. v1.8.6 shipped a load-path clamp that
   permanently rewrote ~12% of bred creatures into titanic ones, because
   crossGenome mutates `size` without wrapping. v1.8.7 reverted it. The port MUST
   reproduce this exactly: an honestly-bred size>5 genome survives the load path
   UNCHANGED. The `size_*_drifted` cases below are the executable statement of
   that rule — the doc version is SAVE_SYSTEM.md, and tools/sizedrift-check.js
   guards the live build. */
(function () {
  'use strict';
  const H = window.__PROBE_HOOK__;
  if (!H) { window.__CODEFX__ = { error: 'no __PROBE_HOOK__' }; return; }

  const { encodeCreature, decodeCreature, encodeWhere, decodeWhere,
          normGenome, cleanName, _sanitizeSavedGenome, makeGenome } = H;

  /* canonical form — identical rules to goldenseeds-probe.js.
     ⚠ `seen` is PER-CALL, not module-level. A shared WeakSet reports every object
     it has already visited as "«cycle»", so the SECOND canonicalisation of the same
     genome silently loses fields. That is exactly how this was found: the recorded
     `input` for size_negative came back without its `size` at all, while the
     hardener bucket — which read the field directly — showed -3. */
  function san(v, d, seen) {
    d = d || 0;
    seen = seen || new WeakSet();
    if (d > 8) return '«deep»';
    if (v === undefined || v === null) return null;
    const t = typeof v;
    if (t === 'number') return Number.isFinite(v) ? Math.round(v * 1e9) / 1e9 : String(v);
    if (t === 'string' || t === 'boolean') return v;
    if (t === 'function') return '«fn»';
    if (t === 'object') {
      if (Array.isArray(v)) return v.map(function (e) { return san(e, d + 1, seen); });
      if (seen.has(v)) return '«cycle»';
      seen.add(v);
      const o = {}; const ks = Object.keys(v).sort();
      for (let i = 0; i < ks.length; i++) o[ks[i]] = san(v[ks[i]], d + 1, seen);
      return o;
    }
    return String(v);
  }
  const canon = function (v) { try { return JSON.stringify(san(v, 0, new WeakSet())); } catch (e) { return 'ERR:' + (e && e.message); } };
  const clone = function (o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return o; } };
  const call = function (fn, a, b) { try { return fn(a, b); } catch (e) { return 'THROW:' + (e && e.message); } };

  /* ---------- the genome corpus ---------- */
  const base = function (k, t) { return makeGenome(1234, k || 'fauna', t === undefined ? 0.5 : t); };
  const withF = function (extra) { const g = clone(base()); for (const k in extra) g[k] = extra[k]; return g; };

  const GENOMES = {
    fauna_basic:   base('fauna', 0.5),
    flora_basic:   base('flora', 0.3),
    fungi_basic:   base('fungi', 0.7),
    microbe_basic: base('microbe', 0.1),

    /* legitimate size bounds */
    size_0: withF({ size: 0 }),
    size_5: withF({ size: 5 }),

    /* ⚠ THE DRIFT CASES — crossGenome produces these honestly. They MUST survive
       _sanitizeSavedGenome unchanged. A port that "tidies" size here reproduces
       the v1.8.6 save-corruption bug. */
    size_6_drifted:  withF({ size: 6, gen: 3 }),
    size_12_drifted: withF({ size: 12, gen: 5 }),

    /* hostile size — the exploit input the v1.8.6 clamp was written for. The
       WRAP at the readers closes it; the load path must still not rewrite. */
    size_huge:     withF({ size: 1e6 }),
    size_negative: withF({ size: -3 }),

    /* forced grades — validated on load (apex 12..TIER_MAX, par 8..11) */
    apex_12:      withF({ apex: 12, lumin: true, wild: 1 }),
    apex_invalid: withF({ apex: 3 }),
    par_8:        withF({ par: 8 }),
    par_invalid:  withF({ par: 99 }),

    /* champion-code inputs */
    xp_leveled: withF({ xp: 4200 }),
    xp_zero:    withF({ xp: 0 }),

    gen5_hybrid: withF({ gen: 5, lumin: true, wild: 1, size: 4 }),

    /* hostile / malformed — a hand-edited share code must not produce NaN stats */
    hostile_nan:        withF({ size: NaN, fer: NaN, xp: NaN }),
    hostile_infinity:   withF({ size: Infinity, xp: -Infinity }),
    hostile_strings:    withF({ size: '4', gen: '2', xp: '999' }),
    hostile_extrakeys:  withF({ _mult: 99, _wf: 1, __evil: 'x', fed: 99999, brood: 99999 }),
    hostile_missing:    { seed: 7 },
    hostile_empty:      {},
  };

  const NAMES = {
    plain:     'Testling',
    html:      '<b>Evil&"Name\'</b> with a very long tail beyond the cap',
    unicode:   'Zoë — Ω星 🜏',
    very_long: new Array(400).join('x'),
    empty:     '',
    spaces:    '   padded   ',
  };

  const WHERES = {
    home_planet: { type: 'planet', gal: { x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, seed: 999, home: true }, star: { x: 560, y: 170, seed: 424242 }, pseed: 133 },
    deep_region: { type: 'planet', gal: { x: 8100, y: -4200, size: 9.25, sp: 1, tilt: 0.1, rot: 2.9, seed: 31337 }, star: { x: -12, y: 44, seed: 7 }, pseed: 4242 },
    star_only:   { type: 'star', gal: { x: 0, y: 0, size: 10, sp: 0, tilt: 0, rot: 0, seed: 1 }, star: { x: 1, y: 2, seed: 99 } },
    minimal:     { type: 'planet' },
  };

  const out = { creatureCodes: {}, championCodes: {}, whereCodes: {}, normGenome: {}, sanitizeSavedGenome: {}, cleanName: {} };

  /* share + champion codes, with an explicit round-trip verdict per case */
  for (const gk of Object.keys(GENOMES).sort()) {
    const entry = { name: 'Testling', genome: GENOMES[gk] };
    for (const [bucket, champ] of [['creatureCodes', false], ['championCodes', true]]) {
      const code = call(encodeCreature, clone(entry), champ);
      const back = (typeof code === 'string' && code.indexOf('THROW:') !== 0) ? call(decodeCreature, code) : null;
      out[bucket][gk] = {
        code: code,
        decoded: canon(back),
        /* roundTrip compares the GENOME only — decode may legitimately add or drop
           envelope fields. A `false` here is not automatically a bug; it is a
           behaviour the port must reproduce, so it is recorded either way. */
        roundTripGenome: canon((back && back.genome) || null) === canon(GENOMES[gk]),
      };
    }
  }

  /* names through the codec + cleanName */
  for (const nk of Object.keys(NAMES).sort()) {
    out.cleanName[nk] = canon(call(cleanName, NAMES[nk]));
    const code = call(encodeCreature, { name: NAMES[nk], genome: GENOMES.fauna_basic }, false);
    const back = (typeof code === 'string' && code.indexOf('THROW:') !== 0) ? call(decodeCreature, code) : null;
    out.creatureCodes['name_' + nk] = { code: code, decoded: canon(back), roundTripGenome: canon((back && back.genome) || null) === canon(GENOMES.fauna_basic) };
  }

  /* where codes */
  for (const wk of Object.keys(WHERES).sort()) {
    const code = call(encodeWhere, clone(WHERES[wk]), 'Test Place');
    const back = (typeof code === 'string' && code.indexOf('THROW:') !== 0) ? call(decodeWhere, code) : null;
    out.whereCodes[wk] = { code: code, decoded: canon(back) };
  }

  /* the two hardeners — the migration-critical surface */
  for (const gk of Object.keys(GENOMES).sort()) {
    const inC = canon(GENOMES[gk]);

    const n = call(normGenome, clone(GENOMES[gk]));
    out.normGenome[gk] = { input: inC, output: canon(n), changed: canon(n) !== inC };

    const s = call(_sanitizeSavedGenome, clone(GENOMES[gk]));
    const outC = canon(s);
    out.sanitizeSavedGenome[gk] = {
      input: inC,
      output: outC,
      changed: outC !== inC,
      /* ⚠ sizePreserved is the v1.8.7 invariant, stated executably. For every
         honestly-bred genome this MUST be true — see the header note. */
      sizeIn: (GENOMES[gk] && GENOMES[gk].size !== undefined) ? String(GENOMES[gk].size) : null,
      sizeOut: (s && typeof s === 'object' && s.size !== undefined) ? String(s.size) : null,
      sizePreserved: !!(s && typeof s === 'object') && String(s.size) === String(GENOMES[gk].size),
    };
  }

  window.__CODEFX__ = out;
}());
