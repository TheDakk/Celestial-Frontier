// Probe-realm sampler for the TypeSafe procedural/universe second opinions. Runs as a classic script
// in the game's realm (window.__PROBE_HOOK__), samples N seeded species and star systems through the
// SAME deterministic generators the game runs, and hands the plain records out on window.__PROC__.
// Reads nothing else, writes nothing; seeds come from window.__PROC_CFG__ (deterministic).
(function () {
  'use strict';
  const H = window.__PROBE_HOOK__;
  const cfg = window.__PROC_CFG__ || {};
  if (!H) { window.__PROC__ = { error: window.__PROBE_HOOK_ERR__ || 'no hook' }; return; }
  const out = { species: [], systems: [], errors: [] };
  const wrap = (label, fn) => { try { return fn(); } catch (e) { out.errors.push(label + ': ' + (e && e.message || e)); return null; } };
  const nSpecies = cfg.species || 60, nSystems = cfg.systems || 12, base = cfg.seed || 7331;
  const kingdoms = ['fauna', 'fauna', 'fauna', 'flora', 'fungi', 'microbe'];
  for (let i = 0; i < nSpecies; i++) {
    const seed = H.hashInt ? H.hashInt(base + i * 7919) : base + i * 7919, kingdom = kingdoms[i % kingdoms.length], grade = ((i * 37) % 100) / 100;
    wrap('species ' + i, () => {
      const g = H.makeGenome(seed, kingdom, grade);
      const rec = { seed, kingdom, genome: {} };
      for (const [k, v] of Object.entries(g)) if (typeof v !== 'object' && typeof v !== 'function') rec.genome[k] = v;
      rec.name = g._name || g.name || (H.cleanName ? H.cleanName(g) : null);
      rec.description = H.describeSpecies(g);
      rec.faunaDesc = kingdom === 'fauna' && H.faunaDesc ? H.faunaDesc(g) : null;
      rec.realmBiome = H.realmBiome ? H.realmBiome(g) : null;
      rec.classifyRealm = H.classifyRealm ? H.classifyRealm(g) : null;
      rec.ecologyRole = H.ecologyRole ? H.ecologyRole(g) : null;
      rec.grade = H.speciesGrade ? H.speciesGrade(g) : null;
      rec.earthArt = kingdom === 'fauna' && H.hdGenesFor ? (function () { const a = H.hdGenesFor(g); return a ? { rig: a.rig || null } : null; })() : null;
      out.species.push(rec);
    });
  }
  const sysSeeds = [424242, 1, 31337, 12, 999, 4242, 8675309, 2718, 3141, 1618, 5551212, 77];
  for (let i = 0; i < Math.min(nSystems, sysSeeds.length); i++) {
    wrap('system ' + sysSeeds[i], () => {
      const s = sysSeeds[i], sys = H.systemFor(s);
      const rec = { seed: s, star: { descriptor: H.starDescriptor(s), starClass: H.starClass ? H.starClass(s) : null }, planets: [] };
      for (const pl of (sys.planets || []).slice(0, 4)) {
        const P = pl.P || {}, params = {};
        for (const [k, v] of Object.entries(P)) if (typeof v !== 'object' && typeof v !== 'function') params[k] = v;
        const band = H.climateBand ? H.climateBand(P, sys, pl.orb !== undefined ? pl.orb : 2) : null;
        rec.planets.push({ params, orb: pl.orb, climateBand: band, descriptor: H.planetDescriptor(P, sys, pl), moons: (pl.moons || []).slice(0, 2).map((m) => H.moonDescriptor(pl, m)) });
      }
      out.systems.push(rec);
    });
  }
  window.__PROC__ = out;
})();
