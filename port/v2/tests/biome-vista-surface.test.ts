import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  BIOME_PROFILE_AUTHORITY_V1,
  type BiomeProfileKeyV1,
} from '@cf/domain-biome-profile';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene, type PlanetNode } from '@cf/scene';
import {
  canonicalWorldRoster,
  type CanonicalWorldRoster,
} from '../apps/game/src/world-roster.js';
import {
  biomeVistaMountLayoutV1,
  buildBiomeVistaRenderRequestV1,
  hasCanonicalEarthMagneticFieldV1,
} from '../apps/game/src/biome-vista-surface.js';
import {
  BIOME_VISTA_WORKER_REQUEST_SCHEMA,
  validBiomeVistaWorkerRenderMessageV1,
} from '../apps/game/src/biome-vista-protocol.js';

const HOME_GALAXY = Object.freeze({ seed: 999, x: 90, y: -60 });
type StarRoute = Readonly<{ seed: number; x: number; y: number }>;
const STARS = Object.freeze({
  sol: Object.freeze({ seed: 424242, x: 560, y: 170 }),
  temperateTerran: Object.freeze({
    seed: 833203739, x: -904.6798150045797, y: -391.44599365862086,
  }),
  coldTerran: Object.freeze({
    seed: 1106282818, x: -897.8339749993756, y: -258.4198963288218,
  }),
  hotTerran: Object.freeze({
    seed: 525337233, x: -661.6450853082351, y: 304.20011023571715,
  }),
  abyssal: Object.freeze({
    seed: 3124441480, x: -547.7556110015139, y: -815.9304478545673,
  }),
  coral: Object.freeze({
    seed: 1536847039, x: -473.2731472165324, y: -767.7138085188344,
  }),
} satisfies Readonly<Record<string, StarRoute>>);

const WORLD_SEEDS = Object.freeze({
  earth: 133,
  solDesert: 134,
  banded: 135,
  temperateTerran: 3400127692,
  coldTerran: 1366692831,
  hotTerran: 2772537421,
  abyssal: 295794072,
  coral: 3436171708,
});

interface VistaFixture {
  readonly planet: PlanetNode;
  readonly system: Record<string, unknown>;
  readonly roster: CanonicalWorldRoster;
}

const fixtureCache = new Map<string, VistaFixture>();

beforeAll(() => installCaptureHooks());

function canonicalFixture(star: StarRoute, planetSeed: number): VistaFixture {
  const cacheKey = `${star.seed}:${planetSeed}`;
  const cached = fixtureCache.get(cacheKey);
  if (cached) return cached;
  const planet = systemScene(star.seed).planets.find((candidate) => candidate.seed === planetSeed);
  if (!planet) throw new Error(`canonical fixture planet ${planetSeed} is missing from ${star.seed}`);
  const resolved = resolveCF1WorldAddress({
    galaxy: HOME_GALAXY,
    star,
    planet: { seed: planetSeed },
  });
  if (!resolved.ok) throw new Error(`canonical fixture address failed: ${resolved.reason}`);
  const rosterResult = canonicalWorldRoster(resolved.address, 0);
  if (!rosterResult.ok) throw new Error(`canonical fixture roster failed: ${rosterResult.message}`);
  const fixture = Object.freeze({
    planet,
    system: systemFor(star.seed) as unknown as Record<string, unknown>,
    roster: rosterResult.roster,
  });
  fixtureCache.set(cacheKey, fixture);
  return fixture;
}

function hasIndependentBiomeSelection(source: string): boolean {
  const code = source.replace(/\/\*[\s\S]*?\*\//gu, ' ').replace(/(^|[^:\\])\/\/.*$/gmu, '$1');
  const importsSelector = [...code.matchAll(/import\s*\{([^}]*)\}\s*from/gu)]
    .some((match) => /\b(?:biomeFor|climateBand)\b/u.test(match[1] ?? ''));
  return importsSelector || /\b(?:biomeFor|climateBand)\s*\(/u.test(code);
}

function hasCanonicalProfileAuthorityBoundary(source: string): boolean {
  const start = source.indexOf('export function buildBiomeVistaRenderRequestV1(');
  const end = source.indexOf('\n  const identity = Object.freeze({', start);
  const section = source.slice(start, end < 0 ? undefined : end);
  return start >= 0 && end > start
    && section.includes('const key = roster.biomeProfileKey;')
    && section.includes('const band = roster.climateBand;')
    && section.includes('roster.biomeProfileSchema !== BIOME_PROFILE_AUTHORITY_V1.schema')
    && section.includes('roster.biomeProfileDigest !== BIOME_PROFILE_AUTHORITY_V1.digest')
    && section.includes('roster.biomeProfile !== BIOME_PROFILE_AUTHORITY_V1.profiles[key]');
}

function hasFailSoftWorkerBoundary(source: string): boolean {
  const start = source.indexOf('function requestSurfaceVista(');
  const end = source.indexOf('\n/* ---- renderer', start);
  const section = source.slice(start, end < 0 ? undefined : end);
  return start >= 0
    && /try\s*\{\s*worker = new Worker\(/u.test(section)
    && section.includes("worker.addEventListener('messageerror'")
    && section.includes('surfaceVistaDeadline = setTimeout(')
    && section.includes('}, SURFACE_VISTA_DEADLINE_MS);')
    && section.includes('if (!validBiomeVistaWorkerRenderMessageV1(message)) {')
    && section.includes('response.scene !== request.scene || response.biomeKey !== request.biomeKey')
    && /try\s*\{\s*worker\.postMessage\(/u.test(section);
}

function hasEnvironmentBoundWorkerBoundary(source: string): boolean {
  const start = source.indexOf('function requestSurfaceVista(');
  const end = source.indexOf('\n/* ---- renderer', start);
  const section = source.slice(start, end < 0 ? undefined : end);
  return start >= 0
    && section.includes('request.environmentFingerprint}|${roster.fullRosterFingerprint}')
    && section.includes('surfaceVistaEnvironmentFingerprint = request.environmentFingerprint;')
    && section.includes('surfaceVistaEnvironmentFingerprint !== request.environmentFingerprint')
    && section.includes('biomeVistaWorkerResponseIdentityMatchesV1(response, {')
    && section.includes('environmentFingerprint: request.environmentFingerprint,')
    && section.includes('profileSchema: request.profileSchema,')
    && section.includes('profileDigest: request.profileDigest,');
}

function hasWorkerPolishBoundary(source: string): boolean {
  const render = source.indexOf('const canvas = renderBiomeVistaV1({');
  const polish = source.indexOf('polishBiomeCanvasV1(canvas);');
  const dimensions = source.indexOf('if (canvas.width !== 960 || canvas.height !== 430', polish);
  const transfer = source.indexOf('const bitmap = (canvas as ArtCanvas).transferToImageBitmap();', polish);
  return render >= 0
    && polish > render
    && dimensions > polish
    && transfer > dimensions
    && source.indexOf('polishBiomeCanvasV1(canvas);', polish + 1) < 0;
}

describe('surface biome-vista projection', () => {
  it('keeps the complete authored vista visible above the globe on the primary portrait phone', () => {
    const layout = biomeVistaMountLayoutV1(390, 844);
    expect(layout.portraitBand).toBe(true);
    expect(layout.displayWidth).toBeLessThanOrEqual(390);
    expect(layout.displayHeight / layout.displayWidth).toBeCloseTo(430 / 960, 12);
    expect(layout.displayWidth / layout.scale).toBeCloseTo(960, 12);
    const fittedGlobeTop = 844 / 2 - (390 * 0.78) / 2;
    expect(layout.centerY + layout.displayHeight / 2).toBeLessThan(fittedGlobeTop);
  });

  it('contains and centers the complete authored vista on landscape and desktop viewports', () => {
    for (const [width, height] of [[844, 390], [1440, 900]] as const) {
      const layout = biomeVistaMountLayoutV1(width, height);
      expect(layout.portraitBand).toBe(false);
      expect(layout.centerX).toBe(width / 2);
      expect(layout.centerY).toBe(height / 2);
      expect(layout.displayWidth).toBeLessThanOrEqual(width);
      expect(layout.displayHeight).toBeLessThanOrEqual(height);
      expect(layout.displayWidth / layout.scale).toBeCloseTo(960, 12);
    }
  });

  it('fails closed for impossible mount geometry', () => {
    expect(() => biomeVistaMountLayoutV1(0, 844)).toThrow(/viewportWidth/u);
    expect(() => biomeVistaMountLayoutV1(390, Number.NaN)).toThrow(/viewportHeight/u);
  });

  it('routes Earth to a stable preserved temperate scene without a Sol-only visual fork', () => {
    const earth = canonicalFixture(STARS.sol, WORLD_SEEDS.earth);
    const { planet, roster, system } = earth;
    const first = buildBiomeVistaRenderRequestV1(
      planet, STARS.sol.seed, roster.worldKey, system, roster,
    );
    const second = buildBiomeVistaRenderRequestV1(
      planet, STARS.sol.seed, roster.worldKey, system, roster,
    );
    expect(second).toEqual(first);
    expect(first).toMatchObject({ scene: 'generic', biomeKey: roster.biomeProfileKey });
    if (first.scene !== 'generic') throw new Error('Earth fixture routed outside generic vista');
    expect(first.options).toMatchObject({
      wb: roster.biomeProfileKey,
      biome: 'land',
      salt: 0,
      evt: null,
    });
    expect(hasCanonicalEarthMagneticFieldV1(roster)).toBe(true);
    expect(first.options.wx).toBe('rain');
    expect(first.options.aurora).toBe(false);
    const foreignFixture = canonicalFixture(
      STARS.temperateTerran,
      WORLD_SEEDS.temperateTerran,
    );
    const foreign = buildBiomeVistaRenderRequestV1(
      foreignFixture.planet,
      STARS.temperateTerran.seed,
      foreignFixture.roster.worldKey,
      foreignFixture.system,
      foreignFixture.roster,
    );
    if (foreign.scene !== 'generic') throw new Error('foreign terran fixture routed outside generic vista');
    expect(hasCanonicalEarthMagneticFieldV1(foreignFixture.roster)).toBe(false);
    expect(foreign.biomeKey).toBe(foreignFixture.roster.biomeProfileKey);
  });

  it('proves the real canonical Earth projection satisfies the exact worker envelope', () => {
    const fixture = canonicalFixture(STARS.sol, WORLD_SEEDS.earth);
    const request = buildBiomeVistaRenderRequestV1(
      fixture.planet,
      STARS.sol.seed,
      fixture.roster.worldKey,
      fixture.system,
      fixture.roster,
    );
    const envelope = {
      schema: BIOME_VISTA_WORKER_REQUEST_SCHEMA,
      type: 'render',
      documentToken: 'canonical-earth-document',
      generation: 1,
      request,
    };
    expect(validBiomeVistaWorkerRenderMessageV1(envelope)).toBe(true);
    expect(validBiomeVistaWorkerRenderMessageV1({
      ...envelope,
      request: { ...request, environmentFingerprint: 'cwe1:149:DEADBEEF' },
    })).toBe(false);
  });

  it('routes gas, abyssal and reef identities through their dedicated preserved compositors', () => {
    const cases = [
      [canonicalFixture(STARS.sol, WORLD_SEEDS.banded), 'gas', 'banded'],
      [canonicalFixture(STARS.abyssal, WORLD_SEEDS.abyssal), 'abyss', 'abyssal'],
      [canonicalFixture(STARS.coral, WORLD_SEEDS.coral), 'reef', 'coral'],
    ] as const;
    for (const [fixture, scene, biomeKey] of cases) {
      const { planet, roster, system } = fixture;
      const request = buildBiomeVistaRenderRequestV1(
        planet, roster.starSeed, roster.worldKey, system, roster,
      );
      expect(request.scene).toBe(scene);
      expect(request.biomeKey).toBe(biomeKey);
      expect(roster.biomeProfileSchema).toBe(BIOME_PROFILE_AUTHORITY_V1.schema);
      expect(roster.biomeProfileDigest).toBe(BIOME_PROFILE_AUTHORITY_V1.digest);
      expect(roster.biomeProfile).toBe(BIOME_PROFILE_AUTHORITY_V1.profiles[biomeKey]);
      expect(request).toMatchObject({
        environmentFingerprint: roster.environmentFingerprint,
        profileSchema: BIOME_PROFILE_AUTHORITY_V1.schema,
        profileDigest: BIOME_PROFILE_AUTHORITY_V1.digest,
      });
      expect(request.options.seed).toBe(planet.seed);
      expect(JSON.stringify(request)).not.toMatch(/NaN|Infinity/u);
      expect(validBiomeVistaWorkerRenderMessageV1({
        schema: BIOME_VISTA_WORKER_REQUEST_SCHEMA,
        type: 'render',
        documentToken: `canonical-${scene}-document`,
        generation: 1,
        request,
      }), `${scene} real projection violates the Worker envelope`).toBe(true);
    }
  });

  it('fails closed when the prepared canonical roster belongs to another world', () => {
    const current = canonicalFixture(STARS.sol, WORLD_SEEDS.earth);
    const other = canonicalFixture(STARS.sol, WORLD_SEEDS.solDesert);
    expect(() => buildBiomeVistaRenderRequestV1(
      current.planet, STARS.sol.seed, current.roster.worldKey, current.system, other.roster,
    ))
      .toThrow(/world and roster must match/u);
    expect(() => buildBiomeVistaRenderRequestV1(
      current.planet, 7, current.roster.worldKey, current.system, current.roster,
    ))
      .toThrow(/world and roster must match/u);
    expect(() => buildBiomeVistaRenderRequestV1(
      current.planet, STARS.sol.seed, 'wrong-parent', current.system, current.roster,
    ))
      .toThrow(/world and roster must match/u);
  });

  it('fails closed for each stale canonical biome-profile authority field', () => {
    const current = canonicalFixture(STARS.sol, WORLD_SEEDS.earth);
    const { planet, roster, system } = current;
    const alternateKey: BiomeProfileKeyV1 = roster.biomeProfileKey === 'temperate'
      ? 'savanna'
      : 'temperate';
    const mutations = [
      ['schema', { biomeProfileSchema: 'cf.domain.biome-profile.stale' }],
      ['digest', { biomeProfileDigest: 'bpd1-00000000000000000000000000000000' }],
      ['profile', {
        biomeProfile: Object.freeze({ ...roster.biomeProfile, sig: '#000000' }),
      }],
      ['key', { biomeProfileKey: alternateKey }],
    ] as const;

    expect(buildBiomeVistaRenderRequestV1(
      planet, STARS.sol.seed, roster.worldKey, system, roster,
    ).biomeKey).toBe(roster.biomeProfileKey);
    for (const [label, mutation] of mutations) {
      const stale = { ...roster, ...mutation } as unknown as CanonicalWorldRoster;
      expect(
        () => buildBiomeVistaRenderRequestV1(
          planet, STARS.sol.seed, stale.worldKey, system, stale,
        ),
        label,
      ).toThrow(/proven world and roster must match/u);
    }
    expect(buildBiomeVistaRenderRequestV1(
      planet, STARS.sol.seed, roster.worldKey, system, roster,
    ).biomeKey).toBe(roster.biomeProfileKey);
  });

  it('does not invent ground plants when the canonical flora is only aquatic or aerial', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../apps/game/src/biome-vista-surface.ts', import.meta.url)),
      'utf8',
    );
    const hasGroundFloraBoundary = (candidate: string): boolean =>
      candidate.includes("const flora = rows.filter((row) => row.kingdom === 'flora');")
      && candidate.includes('const groundFlora = flora.filter((row) => !row.aq && !row.af);')
      && candidate.includes('flora: groundFlora.length > 0,')
      && candidate.includes('floraGenes: groundFlora.slice(0, 2),');
    expect(hasGroundFloraBoundary(source)).toBe(true);
    expect(hasGroundFloraBoundary(source.replace('!row.aq && !row.af', '!row.aq'))).toBe(false);
    expect(hasGroundFloraBoundary(source.replace('flora: groundFlora.length > 0,', 'flora: flora.length > 0,')))
      .toBe(false);
  });

  it('preserves hot, cold and temperate terran water while cold ground stays snow-covered between falls', () => {
    const project = (fixture: VistaFixture) => {
      const { planet, roster, system } = fixture;
      const request = buildBiomeVistaRenderRequestV1(
        planet, roster.starSeed, roster.worldKey, system, roster,
      );
      if (request.scene !== 'generic') throw new Error('terran fixture routed outside generic vista');
      return { band: roster.climateBand, options: request.options };
    };
    const hot = project(canonicalFixture(STARS.hotTerran, WORLD_SEEDS.hotTerran));
    const temperate = project(canonicalFixture(
      STARS.temperateTerran,
      WORLD_SEEDS.temperateTerran,
    ));
    const cold = project(canonicalFixture(STARS.coldTerran, WORLD_SEEDS.coldTerran));
    expect(hot).toMatchObject({ band: 'hot', options: { water: 'none' } });
    expect(temperate).toMatchObject({ band: 'temperate', options: { water: 'liquid' } });
    expect(cold).toMatchObject({
      band: 'cold',
      options: { wx: null, pal: 'snow', water: 'frozen' },
    });
  });

  it('consumes the roster-resolved profile without independently selecting climate or biome', () => {
    const source = readFileSync(fileURLToPath(new URL('../apps/game/src/biome-vista-surface.ts', import.meta.url)), 'utf8');
    const code = source.replace(/\/\*[\s\S]*?\*\//gu, ' ').replace(/(^|[^:\\])\/\/.*$/gmu, '$1');
    expect(code).not.toMatch(/\b(?:Date|performance|document|window|globalThis|localStorage|sessionStorage)\b|Math\.random\s*\(/u);
    expect(code).toContain('const key = roster.biomeProfileKey;');
    expect(code).toContain('const band = roster.climateBand;');
    expect(hasIndependentBiomeSelection(source)).toBe(false);
    expect(hasIndependentBiomeSelection(`${source}\nbiomeFor({ seed: 1 }, 'temperate');`)).toBe(true);
    expect(hasIndependentBiomeSelection(`${source}\nclimateBand({}, {}, 1);`)).toBe(true);
    expect(hasCanonicalProfileAuthorityBoundary(source)).toBe(true);
    for (const token of [
      'const key = roster.biomeProfileKey;',
      'roster.biomeProfileSchema !== BIOME_PROFILE_AUTHORITY_V1.schema',
      'roster.biomeProfileDigest !== BIOME_PROFILE_AUTHORITY_V1.digest',
      'roster.biomeProfile !== BIOME_PROFILE_AUTHORITY_V1.profiles[key]',
    ]) {
      expect(hasCanonicalProfileAuthorityBoundary(
        source.replace(token, 'false /* removed profile authority field */'),
      ), token).toBe(false);
    }
    const projection = code.slice(code.indexOf('export function buildBiomeVistaRenderRequestV1('));
    expect(projection).not.toMatch(/\bplanet\.seed\s*===\s*133/u);
    expect(code).toMatch(/mulberry32/u);
  });

  it('binds pilot presentation before a cached native mount and reapplies visibility at existing lifecycle boundaries', () => {
    const source = readFileSync(fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)), 'utf8');
    const bindingBeforeCache = (input: string): boolean => {
      const start = input.indexOf('function requestSurfaceVista(');
      const end = input.indexOf('\nfunction clearWorld(', start);
      const owner = input.slice(start, end);
      const binding = owner.indexOf('audiovisualPilotVistaBinding = JSON.stringify(request);');
      const cache = owner.indexOf('const cachedOutcome = mountCachedBiomeVistaV1(');
      return start >= 0 && end > start && binding >= 0 && cache > binding;
    };
    expect(bindingBeforeCache(source)).toBe(true);
    const withoutBinding = source.replace('audiovisualPilotVistaBinding = JSON.stringify(request);', '/* removed binding */');
    expect(bindingBeforeCache(withoutBinding)).toBe(false);
    expect(bindingBeforeCache(withoutBinding.replace('  if (cachedOutcome !== \'miss\') {',
      '  audiovisualPilotVistaBinding = JSON.stringify(request);\n  if (cachedOutcome !== \'miss\') {'))).toBe(false);
    const clear = source.slice(source.indexOf('function clearWorld('), source.indexOf('/* ---- draw passes ---- */'));
    expect(clear).toContain('releaseSurfaceVistaOwner();\n  applyAudiovisualPilotSceneVisibility();');
    const mount = source.slice(source.indexOf('function mountSurfaceVistaCanvas('), source.indexOf('function requestSurfaceVista('));
    expect(mount).toContain('surfaceVistaSprite = sprite;\n  audiovisualPilotVistaReady = true; syncAudiovisualPilot();');
    const sync = source.slice(source.indexOf('function syncAudiovisualPilot('), source.indexOf('function startAudiovisualPilot('));
    expect(sync).toContain('audiovisualPilot?.sync(pilotSceneSnapshot());\n  applyAudiovisualPilotSceneVisibility();');
  });

  it('wires the roster resolved during ordinary landing into the live vista request', () => {
    const source = readFileSync(fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)), 'utf8');
    expect(source).toContain('const currentSurfaceRoster = fillPlanetside(state, preparedRoster);');
    expect(source).toContain('requestSurfaceVista(p, state, currentSurfaceRoster);');
    expect(source).not.toContain('requestSurfaceVista(p, state, preparedRoster);');
  });

  it('seals one universe-wide canvas polish pass before worker validation and transfer', () => {
    const source = readFileSync(fileURLToPath(new URL('../apps/game/src/biome-vista.worker.ts', import.meta.url)), 'utf8');
    expect(hasWorkerPolishBoundary(source)).toBe(true);
    expect(hasWorkerPolishBoundary(source.replace(
      'polishBiomeCanvasV1(canvas);',
      '/* removed universe-wide canvas polish */',
    ))).toBe(false);
    expect(hasWorkerPolishBoundary(source.replace(
      'polishBiomeCanvasV1(canvas);',
      'polishBiomeCanvasV1(canvas);\n      polishBiomeCanvasV1(canvas);',
    ))).toBe(false);
  });

  it('keeps constructor, post, malformed-message, wrong-scene and silent-worker failures fail-soft', () => {
    const source = readFileSync(fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)), 'utf8');
    expect(hasFailSoftWorkerBoundary(source)).toBe(true);
    for (const token of [
      "worker.addEventListener('messageerror'",
      'surfaceVistaDeadline = setTimeout(',
      'if (!validBiomeVistaWorkerRenderMessageV1(message)) {',
      'response.scene !== request.scene || response.biomeKey !== request.biomeKey',
      'try {\n    worker.postMessage(',
    ]) {
      expect(hasFailSoftWorkerBoundary(source.replace(token, '/* removed boundary */')), token).toBe(false);
    }
  });

  it('binds cache, stale-work, and worker publication to one canonical environment profile', () => {
    const source = readFileSync(fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)), 'utf8');
    expect(hasEnvironmentBoundWorkerBoundary(source)).toBe(true);
    for (const token of [
      'request.environmentFingerprint}|${roster.fullRosterFingerprint}',
      'surfaceVistaEnvironmentFingerprint = request.environmentFingerprint;',
      'surfaceVistaEnvironmentFingerprint !== request.environmentFingerprint',
      'biomeVistaWorkerResponseIdentityMatchesV1(response, {',
      'environmentFingerprint: request.environmentFingerprint,',
      'profileSchema: request.profileSchema,',
      'profileDigest: request.profileDigest,',
    ]) {
      expect(hasEnvironmentBoundWorkerBoundary(source.replace(token, '/* removed binding */')), token)
        .toBe(false);
    }
  });
});
