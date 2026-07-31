/* GOLDEN SEEDS probe — runs as a classic script in the game's realm (same
   mechanism as tools/probe.js, so it can see the game's top-level bindings via
   __PROBE_HOOK__).

   Port Phase 0 / Gate A: "add 10,000 cross-language-ready golden seed cases".

   WHAT THIS PRODUCES, and why it is shaped this way:
     · an EXPLICIT seed list — the port does not have to reimplement a seed
       generator to use the fixture. Reproducing a PRNG just to get test inputs
       is a second source of divergence; listing the seeds removes it.
     · a per-seed HASH per generator — so a TS implementation that diverges can
       be pinpointed to the exact seed, not just told "the set differs".
     · a ROLLUP hash per generator — the cheap check.
     · full canonical SAMPLES for the first few seeds — so a failing hash can
       actually be debugged without re-running this tool.

   CANONICAL FORM (the port must match this exactly before hashing):
     · numbers: non-finite -> String(v); else Math.round(v * 1e9) / 1e9
       (the SAME 1e-9 rounding tools/probe.js uses for the 50-probe fingerprint —
       deliberately reused so the two fixtures agree on what "equal" means)
     · objects: keys sorted, then JSON.stringify
     · arrays: element-wise, order preserved
     · undefined -> null (JSON.stringify would drop it)

   HASH: FNV-1a 32-bit, run twice with different offset bases and concatenated to
   16 hex chars. Chosen over sha256 because it is ~10 lines in any language and
   needs no crypto import — the fixture stays genuinely cross-language. */
(function () {
  'use strict';
  const H = window.__PROBE_HOOK__;
  if (!H) { window.__GOLDEN__ = { error: 'no __PROBE_HOOK__' }; return; }

  const CFG = window.__GOLDEN_CFG__ || { count: 10000, heavy: 1000, samples: 5 };

  const {
    hashInt, mulberry32, cellRng, rarityRoll, climateBand, starClass,
    makeGenome, crossGenome, speciesGrade, colorGrade, spectral, sapienceTier,
    classifyRealm, realmBiome, describeSpecies, battleStats, hdGenesFor,
    guardianFor, planetParams, planetDescriptor, systemFor, starDescriptor, biomeFor,
  } = H;

  /* ---------- canonical form (mirrors tools/probe.js san()) ----------
     ⚠ `seen` MUST be per-canon-call, not module-level. tools/probe.js keeps one
     WeakSet for the whole run, which is safe there because each probe canonicalises
     freshly-built values exactly once. Here the same object can legitimately be
     canonicalised more than once (caches, shared sub-objects across seeds), and a
     shared WeakSet would emit "«cycle»" for the SECOND and later sightings —
     silently baking a placeholder into the corpus instead of the real value.
     Found by inspecting a captured fixture and noticing a field had vanished. */
  function san(v, d, seen) {
    d = d || 0;
    seen = seen || new WeakSet();
    if (d > 8) return '«deep»';
    if (v === undefined) return null;
    if (v === null) return null;
    const t = typeof v;
    if (t === 'number') return Number.isFinite(v) ? Math.round(v * 1e9) / 1e9 : String(v);
    if (t === 'string' || t === 'boolean') return v;
    if (t === 'function') return '«fn»';
    if (t === 'object') {
      if (Array.isArray(v)) return v.map(function (e) { return san(e, d + 1, seen); });
      if (seen.has(v)) return '«cycle»';
      seen.add(v);
      const o = {};
      const ks = Object.keys(v).sort();
      for (let i = 0; i < ks.length; i++) o[ks[i]] = san(v[ks[i]], d + 1, seen);
      return o;
    }
    return String(v);
  }
  const canon = function (v) { try { return JSON.stringify(san(v, 0, new WeakSet())); } catch (e) { return 'ERR:' + (e && e.message); } };

  /* ---------- FNV-1a 32, doubled -> 16 hex chars ---------- */
  function fnv(s, base) {
    let h = base >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }
  const hx = function (n) { return ('0000000' + n.toString(16)).slice(-8); };
  const hash = function (s) { return hx(fnv(s, 0x811c9dc5)) + hx(fnv(s, 0x9e3779b9)); };

  /* ---------- the seed list ----------
     Generated once from the game's OWN hashInt so the values are in-domain, then
     written into the fixture explicitly. Reproducible here, but the port reads
     the list rather than regenerating it. */
  const seeds = [];
  for (let i = 0; i < CFG.count; i++) seeds.push(hashInt(i, 0x60D5EED, 0x5A17) >>> 0);

  /* ---------- generators ----------
     `all`   — cheap and pure; run on every seed.
     `heavy` — allocate whole systems/species; run on the first CFG.heavy seeds.
     Each returns a value; canon+hash happens in the driver loop below. */
  const ALL = {
    hashInt:      function (s) { return [hashInt(s, 1, 2), hashInt(s, 0, 0), hashInt(s, 0xFFFF, 7)]; },
    mulberry32:   function (s) { const r = mulberry32(s >>> 0); return [r(), r(), r(), r(), r()]; },
    cellRng:      function (s) { const r = cellRng(s & 0xFFFF, (s >>> 16) & 0xFFFF, 3); return [r(), r(), r()]; },
    rarityRoll:   function (s) { return [rarityRoll(s, 1), rarityRoll(s, 3), rarityRoll(s, 0x10F)]; },
    starClass:    function (s) { return starClass(s); },
    planetParams: function (s) { return planetParams(s); },
    makeGenome_fauna:   function (s) { return makeGenome(s, 'fauna', 0.5); },
    makeGenome_flora:   function (s) { return makeGenome(s, 'flora', 0.3); },
    makeGenome_fungi:   function (s) { return makeGenome(s, 'fungi', 0.7); },
    makeGenome_microbe: function (s) { return makeGenome(s, 'microbe', 0.1); },
    speciesGrade: function (s) { return speciesGrade(makeGenome(s, 'fauna', 0.5)); },
    colorGrade:   function (s) { return colorGrade(s % 360, s, null); },
    spectral:     function (s) { return spectral('nebula', s, null); },
    sapienceTier: function (s) { return sapienceTier(makeGenome(s, 'fauna', 0.5)); },
    classifyRealm:function (s) { return [classifyRealm(makeGenome(s, 'fauna', 0.5)), realmBiome(makeGenome(s, 'fauna', 0.5))]; },
    guardianFor:  function (s) { return guardianFor(s); },
    crossGenome:  function (s) { return crossGenome(makeGenome(s, 'fauna', 0.4), makeGenome(s + 1, 'fauna', 0.6)); },
  };

  const HEAVY = {
    describeSpecies: function (s) { return describeSpecies(makeGenome(s, 'fauna', 0.5)); },
    battleStats:     function (s) { return battleStats(makeGenome(s, 'fauna', 0.5)); },
    hdGenesFor:      function (s) { return hdGenesFor(makeGenome(s, 'fauna', 0.5)); },
    starDescriptor:  function (s) { return starDescriptor(s); },
    systemFor:       function (s) { const sys = systemFor(s); return { n: (sys.planets || []).length, p: (sys.planets || []).slice(0, 3).map(function (q) { return q.P; }) }; },
    planetDescriptor:function (s) {
      const sys = systemFor(s); const pl = (sys.planets || [])[0];
      if (!pl) return 'no-planet';
      return planetDescriptor(pl.P, sys, pl);
    },
    climateBand:     function (s) {
      const sys = systemFor(s); const pl = (sys.planets || [])[0];
      if (!pl) return 'no-planet';
      return climateBand(pl.P, sys, pl.orb !== undefined ? pl.orb : 2);
    },
    biomeFor:        function (s) {
      const sys = systemFor(s); const pl = (sys.planets || [])[0];
      if (!pl) return 'no-planet';
      const b = climateBand(pl.P, sys, pl.orb !== undefined ? pl.orb : 2);
      const r = biomeFor(pl.P, b);
      return r ? (r.k || r) : null;
    },
  };

  /* ---------- run ---------- */
  const generators = {};
  const samples = [];
  const run = function (table, limit, tier) {
    const names = Object.keys(table).sort();
    for (let gi = 0; gi < names.length; gi++) {
      const name = names[gi], fn = table[name];
      const per = new Array(limit);
      let roll = '';
      for (let i = 0; i < limit; i++) {
        let c;
        try { c = canon(fn(seeds[i])); } catch (e) { c = 'THROW:' + (e && e.message); }
        per[i] = hash(c);
        roll = hash(roll + per[i]);
        if (i < CFG.samples) samples.push({ gen: name, i: i, seed: seeds[i], canonical: c.length > 4000 ? c.slice(0, 4000) + '…«truncated»' : c });
      }
      generators[name] = { tier: tier, cases: limit, rollup: roll, perSeed: per };
    }
  };

  try {
    run(ALL, CFG.count, 'all');
    run(HEAVY, Math.min(CFG.heavy, CFG.count), 'heavy');
    window.__GOLDEN__ = { seeds: seeds, generators: generators, samples: samples };
  } catch (e) {
    window.__GOLDEN__ = { error: String((e && e.stack) || e) };
  }
}());
