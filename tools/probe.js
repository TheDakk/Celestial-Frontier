// Determinism probe — runs as a classic script in the game's realm, so it can
// see the game script's top-level let/const/function bindings. Every probe is
// wrapped: an exception becomes part of the fingerprint (identical behavior,
// including identical failures, is what we compare).
(function () {
  'use strict';
  const H = window.__PROBE_HOOK__;
  if (!H) { window.__FINGERPRINT__ = { hookError: window.__PROBE_HOOK_ERR__ || 'ERR:no hook' }; return; }
  const {
    mulberry32, hashInt, cellRng, makeNoise,
    properName, galaxyName, starName, speciesName, roman,
    planetParams, starClass, galaxiesInCell, slimGal, galaxyProfile,
    galaxyWormhole, starsInCell, fineStarsInCell, systemFor, supernovaSites,
    starDescriptor, planetDescriptor, moonDescriptor, galaxyDescriptor,
    wormholeDescriptor, cmbDescriptor, oortDescriptor, kuiperDescriptor,
    visitorDescriptor, beltDescriptor, climateBand,
    makeGenome, crossGenome, evolveGenome, describeSpecies, faunaDesc,
    speciesGrade, rarityRoll, colorGrade, spectral, sapienceTier, guardianFor,
    realmBiome, classifyRealm, ecologyRole, planetSpecies, speciesPortrait,
    battleStats, abilityOf, abilityTheme, floraStat, runDuel, winEstimate,
    encodeWhere, decodeWhere, encodeCreature, decodeCreature, cleanName, normGenome,
    RANKS, REGIONS, SIGS, GRADE_TIERS,
    UCELL, OBS_R, GR, SYS_R, HOME_GAL_SEED, HOME_POS, SOL_SEED,
    PLAYER_SEED, HARVEST_CD, SAVE_KEY,
  } = H;
  const FP = {};
  const seen = new WeakSet();
  function san(v, depth) {
    if (depth > 8) return '«deep»';
    if (v === null || v === undefined) return v;
    const t = typeof v;
    if (t === 'number') return Number.isFinite(v) ? Math.round(v * 1e9) / 1e9 : String(v);
    if (t === 'string' || t === 'boolean') return v;
    if (t === 'function') return '«fn»';
    if (t === 'object') {
      if (typeof HTMLElement !== 'undefined' && v instanceof HTMLElement) return '«el»';
      if (v instanceof Map) return Array.from(v.entries()).map((e) => san(e, depth + 1));
      if (v instanceof Set) return Array.from(v).map((e) => san(e, depth + 1));
      if (Array.isArray(v)) return v.map((e) => san(e, depth + 1));
      if (seen.has(v)) return '«cycle»';
      seen.add(v);
      const o = {};
      for (const k of Object.keys(v).sort()) o[k] = san(v[k], depth + 1);
      return o;
    }
    return String(v);
  }
  function probe(name, fn) {
    try { FP[name] = JSON.stringify(san(fn(), 0)); }
    catch (e) { FP[name] = 'ERR:' + e.message; }
  }

  // --- PRNG core ---
  probe('mulberry32', () => { const r = mulberry32(12345); return [r(), r(), r(), r(), r()]; });
  probe('hashInt', () => [hashInt(1, 2, 3), hashInt(999, -4, 17), hashInt(0x50A1E5, 0, 0)]);
  probe('cellRng', () => { const r = cellRng(7, -3, 11); return [r(), r(), r()]; });
  probe('noise', () => { const n = makeNoise(8181); return [n(0.3, 0.7), n(12.5, -4.2), n(100, 100)]; });

  // --- naming ---
  probe('names', () => {
    const out = [];
    for (const s of [1, 7, 133, 999, 424242, 31337, 270549077]) {
      out.push(properName(s, 3), galaxyName(s), starName(s), speciesName(s));
    }
    return out;
  });
  probe('roman', () => [roman(1), roman(4), roman(9), roman(14), roman(16)]);

  // --- planet/world generation ---
  const SEEDS = [133, 1, 2, 3, 42, 1000, 31337, 99999, 123456, 7777777];
  probe('planetParams', () => SEEDS.map((s) => planetParams(s)));
  probe('starClass', () => SEEDS.map((s) => starClass(s)));
  probe('galaxiesInCell', () => [galaxiesInCell(0, 0), galaxiesInCell(1, -2), galaxiesInCell(-3, 5)]
    .map((arr) => (arr || []).map((g) => slimGal(g))));
  probe('galaxyProfile', () => [999, 31337, 12].map((s) => galaxyProfile(s)));
  probe('galaxyWormhole', () => [999, 31337, 12].map((s) => galaxyWormhole(s)));
  probe('starsInCell', () => {
    const prof = galaxyProfile(999);
    return [starsInCell(999, prof, 0, 0), starsInCell(999, prof, 2, -1)];
  });
  probe('fineStarsInCell', () => {
    const prof = galaxyProfile(999);
    return fineStarsInCell(999, prof, 1, 1);
  });
  probe('systemSol', () => systemFor(424242));
  probe('systemOther', () => [systemFor(1), systemFor(31337)].map((s) => s));
  probe('supernovaSites', () => supernovaSites(999, 3));

  // --- descriptors (text generation) ---
  probe('starDescriptor', () => SEEDS.map((s) => starDescriptor(s)));
  probe('planetDescriptor', () => {
    const out = [];
    for (const ss of [424242, 1, 31337]) {
      const sys = systemFor(ss);
      for (const pl of (sys.planets || []).slice(0, 4)) out.push(planetDescriptor(pl.P, sys, pl));
    }
    return out;
  });
  probe('moonDescriptor', () => {
    const sys = systemFor(424242);
    const out = [];
    for (const pl of (sys.planets || [])) {
      for (const m of (pl.moons || []).slice(0, 2)) out.push(moonDescriptor(pl, m));
    }
    return out;
  });
  probe('galaxyDescriptor', () => galaxiesInCell(0, 0).slice(0, 3).map((g) => galaxyDescriptor(g)));
  probe('miscDescriptors', () => [wormholeDescriptor(), cmbDescriptor(), oortDescriptor(31337),
    kuiperDescriptor(systemFor(31337), 31337), visitorDescriptor(31337), beltDescriptor(systemFor(424242), 424242)]);

  // --- species / genome ---
  const G1 = () => makeGenome(1234, 'fauna', 0.5);
  const G2 = () => makeGenome(5678, 'fauna', 0.2);
  probe('makeGenome', () => ['fauna', 'flora', 'fungi', 'microbe'].map((k, i) => makeGenome(1000 + i, k, 0.3 * i)));
  probe('crossGenome', () => crossGenome(G1(), G2()));
  probe('evolveGenome', () => evolveGenome(G1(), 4));
  probe('describeSpecies', () => [G1(), G2(), makeGenome(9, 'flora', 0.8)].map((g) => describeSpecies(g)));
  probe('faunaDesc', () => faunaDesc(G1()));
  probe('speciesGrade', () => [G1(), G2()].map((g) => speciesGrade(g)));
  probe('rarityRoll', () => SEEDS.map((s) => rarityRoll(s, 3)));
  probe('colorGrade', () => [colorGrade(120, 999, null), colorGrade(300, 31337, null)]);
  probe('spectral', () => [spectral('aurora', 12, null), spectral('nebula', 99, null)]);
  probe('sapience', () => [G1(), G2()].map((g) => sapienceTier(g)));
  probe('realm', () => [G1(), G2()].map((g) => [realmBiome(g), classifyRealm(g), ecologyRole(g)]));
  probe('planetSpecies', () => {
    const sys = systemFor(424242);
    const pl = (sys.planets || [])[2];
    return pl ? planetSpecies(pl.P, sys, climateBand(pl.P, sys, pl.orb !== undefined ? pl.orb : 2), 2) : 'no-planet';
  });
  probe('speciesPortrait', () => [G1(), G2(), makeGenome(9, 'flora', 0.8), makeGenome(10, 'fungi', 0.1),
    makeGenome(11, 'microbe', 0.6)].map((g) => speciesPortrait(g)));

  // --- combat ---
  probe('battleStats', () => [G1(), G2()].map((g) => battleStats(g)));
  probe('abilityOf', () => [G1(), G2()].map((g) => abilityOf(g)));
  probe('abilityTheme', () => [G1(), G2()].map((g) => abilityTheme(g)));
  probe('floraStat', () => [makeGenome(9, 'flora', 0.8), makeGenome(21, 'flora', 0.4)].map((g) => floraStat(g)));
  probe('runDuel', () => {
    const a = { name: 'A', genome: G1(), stats: battleStats(G1()) };
    const b = { name: 'B', genome: G2(), stats: battleStats(G2()) };
    return runDuel(a, b);
  });
  probe('winEstimate', () => winEstimate(
    { name: 'A', genome: G1(), stats: battleStats(G1()) },
    { name: 'B', genome: G2(), stats: battleStats(G2()) }));

  // --- codecs ---
  probe('whereCodec', () => {
    const w = {
      type: 'planet',
      gal: { x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, seed: 999, home: true },
      star: { x: 560, y: 170, seed: 424242 },
      pseed: 133,
    };
    const code = encodeWhere(w, 'Test Place');
    return [code, decodeWhere(code)];
  });
  probe('creatureCodec', () => {
    const entry = { name: 'Testling', genome: G1() };
    const code = encodeCreature(entry);
    return [code, decodeCreature(code)];
  });
  probe('cleanName', () => [cleanName('<b>Evil&"Name\'</b> with a very long tail beyond cap'), cleanName('  ok  ')]);
  probe('normGenome', () => normGenome(G1()));

  // --- progression rules (pure) ---
  probe('rankTable', () => RANKS);
  probe('regions', () => REGIONS);
  probe('sigs', () => SIGS.map((s) => [s.id, s.name || s.label || '', s.verb || '']));
  probe('gradeTiers', () => GRADE_TIERS);
  probe('guardians', () => {
    // which of the first 2000 world seeds are guarded, and the first few rulers in full
    const ruled = [];
    for (let s = 1; s <= 2000; s++) { const g = guardianFor(s); if (g) ruled.push([s, g.tier, g.name]); }
    return { count: ruled.length, first: ruled.slice(0, 8) };
  });
  probe('constants', () => [UCELL, OBS_R, GR, SYS_R, HOME_GAL_SEED, HOME_POS, SOL_SEED, PLAYER_SEED, HARVEST_CD, SAVE_KEY]);

  window.__FINGERPRINT__ = FP;
})();
