/* Classic-script capture recipe for the two descriptor paths that the sealed
   v1.8.9 50-probe fingerprint sampled vacuously. This file is injected into
   the immutable legacy page by v189-descriptor-evidence.mjs; it deliberately
   has no imports and executes inside that page's realm. */
(function () {
  'use strict';

  const H = window.__V189_DESCRIPTOR_HOOK__;
  if (!H) {
    window.__V189_DESCRIPTOR_CAPTURE__ = {
      error: window.__V189_DESCRIPTOR_HOOK_ERROR__ || 'descriptor hook unavailable',
    };
    return;
  }

  function fail(message) { throw new Error(message); }

  function san(value, depth, seen) {
    if (depth > 8) return '«deep»';
    if (value === undefined || value === null) return null;
    const type = typeof value;
    if (type === 'number') return Number.isFinite(value) ? Math.round(value * 1e9) / 1e9 : String(value);
    if (type === 'string' || type === 'boolean') return value;
    if (type === 'function') return '«fn»';
    if (type === 'object') {
      if (Array.isArray(value)) return value.map((entry) => san(entry, depth + 1, seen));
      if (seen.has(value)) return '«cycle»';
      seen.add(value);
      const out = {};
      Object.keys(value).sort().forEach((key) => { out[key] = san(value[key], depth + 1, seen); });
      return out;
    }
    return String(value);
  }

  function canonical(value) {
    return JSON.stringify(san(value, 0, new WeakSet()));
  }

  function capturedCase(id, recipe, value) {
    const canonicalJson = canonical(value);
    return { id, recipe, raw: JSON.parse(canonicalJson), canonicalJson };
  }

  try {
    const sol = H.systemFor(424242);
    const earth = (sol.planets || []).find((planet) => planet.P && planet.P.seed === 133);
    if (!earth) fail('Sol did not contain Earth seed 133');

    const proceduralSystem = H.systemFor(1);
    const proceduralPlanet = (proceduralSystem.planets || [])[0];
    if (!proceduralPlanet) fail('system seed 1 did not contain a first planet');

    const galaxies = H.galaxiesInCell(-6, 4) || [];
    const galaxy = galaxies[0];
    if (!galaxy) fail('galaxy cell (-6,4) was empty');
    if (galaxy.seed !== 2024882063) fail('galaxy cell (-6,4) first seed changed: ' + galaxy.seed);

    window.__V189_DESCRIPTOR_CAPTURE__ = {
      guards: {
        solSeed: 424242,
        earthPlanetSeed: earth.P.seed,
        proceduralSystemSeed: 1,
        proceduralPlanetSeed: proceduralPlanet.P.seed,
        galaxyCell: [-6, 4],
        galaxySeed: galaxy.seed,
        galaxyKindCount: H.GAL_KIND.length,
      },
      cases: [
        capturedCase(
          'sol-earth-moon-0',
          { descriptor: 'moonDescriptor', systemSeed: 424242, planetSeed: 133, moonIndex: 0 },
          H.moonDescriptor(earth, 0),
        ),
        capturedCase(
          'system-1-planet-0-moon-0',
          { descriptor: 'moonDescriptor', systemSeed: 1, planetIndex: 0, moonIndex: 0 },
          H.moonDescriptor(proceduralPlanet, 0),
        ),
        capturedCase(
          'cell--6-4-galaxy-0',
          { descriptor: 'galaxyDescriptor', cell: [-6, 4], galaxyIndex: 0, galaxySeed: 2024882063 },
          H.galaxyDescriptor(galaxy),
        ),
      ],
    };
  } catch (error) {
    window.__V189_DESCRIPTOR_CAPTURE__ = {
      error: String(error && error.stack ? error.stack : error),
    };
  }
}());
