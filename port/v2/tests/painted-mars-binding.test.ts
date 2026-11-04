import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';
import { buildBiomeVistaRenderRequestV1 } from '../apps/game/src/biome-vista-surface.js';
import type { BiomeVistaRenderRequestV1 } from '../apps/game/src/biome-vista-protocol.js';
import {
  PAINTED_MARS_VISTA_ID,
  PAINTED_MARS_VISTA_BINDING_V1,
  isPaintedMarsVistaV1,
} from '../apps/game/src/painted-mars-binding.js';

const galaxy = { seed: 999, x: 90, y: -60 };
const star = { seed: 424242, x: 560, y: 170 };
function canonicalFixture(seed: number) {
  const address = resolveCF1WorldAddress({ galaxy, star, planet: { seed } });
  if (!address.ok) throw new Error(`fixture address: ${address.reason}`);
  const result = canonicalWorldRoster(address.address, 0);
  if (!result.ok) throw new Error(`fixture roster: ${result.message}`);
  const planet = systemScene(star.seed).planets.find(candidate => candidate.seed === seed);
  if (!planet) throw new Error('fixture planet absent');
  const request = buildBiomeVistaRenderRequestV1(planet, star.seed, result.roster.worldKey,
    systemFor(star.seed) as unknown as Record<string, unknown>, result.roster);
  return { request, roster: result.roster };
}
let request: BiomeVistaRenderRequestV1;
beforeAll(() => { installCaptureHooks(); request = canonicalFixture(134).request; });
const copy = (): Record<string, unknown> => JSON.parse(JSON.stringify(request)) as Record<string, unknown>;
const eligible = (value: unknown): boolean => isPaintedMarsVistaV1(value as BiomeVistaRenderRequestV1);

describe('exact painted Mars scene binding', () => {
  it('admits the actual canonical builder and binds every serialized field', () => {
    const actual = canonicalFixture(134);
    expect(actual.roster.biosphereKey).toBe('none');
    expect(actual.roster.view.all).toEqual([]);
    expect(actual.request).toMatchObject({
      worldKey: 'CF1|g:999@90,-60|s:424242@560,170|p:134#3',
      environmentFingerprint: 'cwe1:145:0d97c0f8', biomeKey: 'dunesea',
      options: { seed: 134, pal: 'sand', wx: null, moons: 2, flora: false,
        water: 'none', genes: null, floraGenes: [], herd: 0, aqua: 0, air: 0 },
    });
    expect(PAINTED_MARS_VISTA_ID).toBe('painted-mars-dunesea-v1');
    expect(JSON.stringify(actual.request)).toBe(PAINTED_MARS_VISTA_BINDING_V1);
    expect(isPaintedMarsVistaV1(actual.request)).toBe(true);
    expect(eligible(copy())).toBe(true);
    expect(JSON.stringify(actual.request)).toBe(PAINTED_MARS_VISTA_BINDING_V1);
  });

  it('refuses the real Earth request with its residents', () => {
    const earth = canonicalFixture(133);
    expect(earth.roster.view.total).toBeGreaterThan(0);
    expect(isPaintedMarsVistaV1(earth.request)).toBe(false);
  });

  it.each([
    ['galaxy seed', 'worldKey', 'CF1|g:998@90,-60|s:424242@560,170|p:134#3'],
    ['galaxy coordinates', 'worldKey', 'CF1|g:999@91,-60|s:424242@560,170|p:134#3'],
    ['star coordinates', 'worldKey', 'CF1|g:999@90,-60|s:424242@560,171|p:134#3'],
    ['foreign world', 'worldKey', 'CF1|g:999@90,-60|s:424242@560,170|p:133#2'],
    ['ordinal', 'worldKey', 'CF1|g:999@90,-60|s:424242@560,170|p:134#2'],
    ['environment', 'environmentFingerprint', 'cwe1:145:0d97c0f9'],
    ['profile schema', 'profileSchema', 'cf.domain.biome-profile.v2'],
    ['profile digest', 'profileDigest', 'bpd1-00000000000000000000000000000000'],
    ['biome', 'biomeKey', 'canyon'],
    ['scene', 'scene', 'gas'],
  ])('refuses altered %s', (_label, key, value) => {
    const changed = copy(); changed[key!] = value;
    expect(eligible(changed)).toBe(false);
  });

  it.each([
    ['seed', 135], ['era', 'town'], ['pal', 'dust'], ['biome', 'island'],
    ['wx', 'dust'], ['moons', 1], ['aurora', true], ['nightize', true],
    ['duskize', true], ['flora', true], ['water', 'liquid'],
    ['genes', [{ seed: 134, kingdom: 'fauna' }]],
    ['floraGenes', [{ seed: 134, kingdom: 'flora' }]],
    ['ring', true], ['stc', '#ffffff'], ['herd', 1], ['aqua', 1], ['air', 1],
    ['wb', 'canyon'], ['evt', 'haboob'], ['titan', true], ['salt', 1],
  ] as const)('refuses altered option %s', (key, value) => {
    const changed = copy(); (changed.options as Record<string, unknown>)[key] = value;
    expect(eligible(changed)).toBe(false);
  });

  it.each(['request', 'options', 'array', 'genome'] as const)(
    'rejects a %s getter without invoking it', location => {
      const changed = copy();
      const options = changed.options as Record<string, unknown>;
      const getter = vi.fn(() => { throw new Error('getter must not execute'); });
      let target: object = changed; let key = 'worldKey';
      if (location === 'options') { target = options; key = 'seed'; }
      if (location === 'array') { const rows = new Array(1); options.floraGenes = rows; target = rows; key = '0'; }
      if (location === 'genome') { const genome = {}; options.genes = [genome]; target = genome; key = 'seed'; }
      Object.defineProperty(target, key, { enumerable: true, configurable: true, get: getter });
      expect(eligible(changed)).toBe(false);
      expect(getter).not.toHaveBeenCalled();
    },
  );

  it('rejects inherited and own serialization hooks without executing them', () => {
    const toJSON = vi.fn(() => JSON.parse(PAINTED_MARS_VISTA_BINDING_V1));
    const own = copy(); own.toJSON = toJSON;
    expect(eligible(own)).toBe(false);
    const inherited = Object.assign(Object.create({ toJSON }), copy());
    expect(eligible(inherited)).toBe(false);
    expect(toJSON).not.toHaveBeenCalled();
  });

  it('rejects missing, extra, symbolic, hidden, sparse and non-finite data', () => {
    const missing = copy(); delete missing.environmentFingerprint;
    const extra = copy(); extra.asset = PAINTED_MARS_VISTA_ID;
    const optionExtra = copy(); (optionExtra.options as Record<string, unknown>).painted = true;
    const symbolic = copy(); Object.defineProperty(symbolic, Symbol('extra'), { value: true });
    const hidden = copy(); Object.defineProperty(hidden, 'extra', { value: true });
    const sparse = copy(); (sparse.options as Record<string, unknown>).floraGenes = new Array(1);
    const nonFinite = copy(); (nonFinite.options as Record<string, unknown>).moons = Number.NaN;
    const negativeZero = copy(); (negativeZero.options as Record<string, unknown>).salt = -0;
    const cyclic = copy(); (cyclic.options as Record<string, unknown>).genes = [cyclic];
    for (const changed of [missing, extra, optionExtra, symbolic, hidden, sparse, nonFinite, negativeZero, cyclic,
      null, undefined, [], 134]) expect(eligible(changed)).toBe(false);
  });
});
