import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { resolveCF1WorldAddress } from '@cf/scene';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';
import { pilotEarthVistaRequest } from '../apps/game/src/pilot-canonical-vista.js';
import {
  buildEarthLayeredRecipeV1, EARTH_LAYERED_REQUEST_JSON_V1,
  EARTH_LAYERED_ROSTER_JSON_V1, EARTH_LAYERED_SCENE_ID,
  earthResidentFamiliesFitBiomeProfileV1,
} from '../apps/game/src/earth-layered-recipe.js';

function fixture(): { request: any; roster: any } {
  return JSON.parse(readFileSync(fileURLToPath(new URL(
    '../../../audits/AV_EARTH_LAYERED_SCENE_20260908/canonical-earth.json', import.meta.url,
  )), 'utf8'));
}
beforeAll(() => installCaptureHooks());

describe('exact Earth layered-scene recipe', () => {
  it('admits the live canonical builder and complete roster, with the captured source binding', () => {
    const resolved = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 133 } });
    if (!resolved.ok) throw new Error('canonical Earth address unavailable');
    const outcome = canonicalWorldRoster(resolved.address, 0);
    if (!outcome.ok) throw new Error('canonical Earth roster unavailable');
    const request = pilotEarthVistaRequest();
    expect(JSON.stringify(request)).toBe(EARTH_LAYERED_REQUEST_JSON_V1);
    const plan = buildEarthLayeredRecipeV1(request, outcome.roster);
    expect(plan?.sceneId).toBe(EARTH_LAYERED_SCENE_ID);
    const captured = fixture();
    expect(buildEarthLayeredRecipeV1(captured.request, captured.roster)).toEqual(plan);
    const authority = JSON.parse(EARTH_LAYERED_ROSTER_JSON_V1);
    expect(authority.view.all).toEqual(captured.roster.view.all);
    expect(authority.view.total).toBe(19);
    expect(Object.keys(authority.view)).toEqual(['all', 'total']);
  });

  it('keeps full immutable genomes and stable relative contact anchors, including fauna beyond the preview', () => {
    const { request, roster } = fixture();
    const before = JSON.stringify({ request, roster });
    const plan = buildEarthLayeredRecipeV1(request, roster)!;
    expect(plan.residents.map(row => [row.name, row.x, row.groundY, row.width])).toEqual([
      ['Civet', .72, .77, .15], ['Persimmon', .13, .78, .21],
      ['Platypus', .43, .86, .20], ['Frog', .25, .87, .07],
      ["Devil's Club", .87, .88, .16], ['Cranberry', .34, .90, .11],
    ]);
    expect(plan.residents).toHaveLength(6);
    expect(plan.width * plan.height * 4).toBe(1_651_200);
    for (const resident of plan.residents) {
      const source = roster.view.all.find((row: any) => row._earthName === resident.name);
      expect(resident.genome).toEqual(source);
      expect(resident.genome).not.toBe(source);
      expect(Object.isFrozen(resident.genome)).toBe(true);
      expect(Object.isFrozen(resident)).toBe(true);
    }
    expect(roster.view.preview.some((row: any) => row._earthName === 'Platypus')).toBe(false);
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.residents)).toBe(true);
    expect(JSON.stringify({ request, roster })).toBe(before);
    expect(buildEarthLayeredRecipeV1(request, roster)).toEqual(plan);
  });

  it('requires the six named art families to belong to the canonical biome profile', () => {
    const { request, roster } = fixture();
    const plan = buildEarthLayeredRecipeV1(request, roster)!;
    expect(plan.residents.map(row => [row.name, row.kingdom, row.family])).toEqual([
      ['Civet', 'fauna', 'mammal'], ['Persimmon', 'flora', 'tree'],
      ['Platypus', 'fauna', 'mammal'], ['Frog', 'fauna', 'amphibian'],
      ["Devil's Club", 'flora', 'shrub'], ['Cranberry', 'flora', 'shrub'],
    ]);
    expect(earthResidentFamiliesFitBiomeProfileV1(plan.residents, roster.biomeProfile)).toBe(true);
    // This reduced profile deliberately differs from the canonical JSON. It
    // proves a semantic family owner, not a duplicate exact-fixture check.
    const minimum = { fauna: ['mammal', 'amphibian'], flora: ['tree', 'shrub'] };
    expect(earthResidentFamiliesFitBiomeProfileV1(plan.residents, minimum)).toBe(true);
    for (const [kingdom, family] of [['fauna', 'mammal'], ['fauna', 'amphibian'],
      ['flora', 'tree'], ['flora', 'shrub']] as const) {
      const bad = structuredClone(roster.biomeProfile);
      bad[kingdom] = bad[kingdom].filter((value: string) => value !== family);
      expect(earthResidentFamiliesFitBiomeProfileV1(plan.residents, bad), family).toBe(false);
      expect(buildEarthLayeredRecipeV1(request, { ...roster, biomeProfile: bad }), family).toBeNull();
    }
    expect(earthResidentFamiliesFitBiomeProfileV1(plan.residents,
      { fauna: minimum.flora, flora: minimum.fauna })).toBe(false);
    const wrongNamedFamily = structuredClone(plan.residents) as any;
    wrongNamedFamily[0].family = 'amphibian'; // allowed by profile; wrong for Civet
    expect(earthResidentFamiliesFitBiomeProfileV1(wrongNamedFamily, minimum)).toBe(false);
    wrongNamedFamily[0].family = 'fish';
    expect(earthResidentFamiliesFitBiomeProfileV1(wrongNamedFamily, minimum)).toBe(false);
    const duplicate = structuredClone(plan.residents) as any;
    duplicate[0] = duplicate[2];
    expect(earthResidentFamiliesFitBiomeProfileV1(duplicate, minimum)).toBe(false);
    let invoked = 0;
    const hostile = { ...minimum };
    Object.defineProperty(hostile, 'fauna', { enumerable: true, get() { invoked++; return minimum.fauna; } });
    expect(earthResidentFamiliesFitBiomeProfileV1(plan.residents, hostile)).toBe(false);
    expect(invoked).toBe(0);
  });

  it('does not let cosmetic preview truncation remove residents', () => {
    const { request, roster } = fixture();
    const expected = buildEarthLayeredRecipeV1(request, roster);
    for (const limit of [0, 1, 3, 19]) {
      roster.view.preview = roster.view.all.slice(0, limit);
      roster.view.hiddenFromPreview = roster.view.total - roster.view.preview.length;
      expect(buildEarthLayeredRecipeV1(request, roster)).toEqual(expected);
    }
  });

  it('rejects request, same-leaf wrong-world, epoch, full-roster and ordering mutants even with unchanged weak fingerprints', () => {
    const mutations: Array<(request: any, roster: any) => void> = [
      request => { request.worldKey = request.worldKey.replace('g:999', 'g:998'); },
      request => { request.options.wx = null; },
      request => { request.options.genes[0].bulk += .01; },
      request => { request.profileDigest = request.profileDigest + 'wrong'; },
      (_request, roster) => { roster.address.planet.ordinal = 3; },
      (_request, roster) => { roster.ecologyEpoch = 1; },
      (_request, roster) => { roster.fullRosterFingerprint += 'wrong'; },
      (_request, roster) => { roster.view.all[11].color += 1; },
      (_request, roster) => { roster.view.all[18].size += 1; },
      (_request, roster) => { [roster.view.all[0], roster.view.all[1]] = [roster.view.all[1], roster.view.all[0]]; },
      (_request, roster) => { roster.view.all.pop(); },
      (_request, roster) => { roster.view.total -= 1; },
      (_request, roster) => { roster.extra = 'unadmitted'; },
    ];
    for (const mutate of mutations) {
      const { request, roster } = fixture();
      expect(buildEarthLayeredRecipeV1(request, roster)).not.toBeNull();
      mutate(request, roster);
      expect(buildEarthLayeredRecipeV1(request, roster)).toBeNull();
    }
  });

  it('rejects hostile descriptors, hooks, sparse/cyclic data and oversized trees without invoking getters or toJSON', () => {
    let invoked = 0;
    const mutations: Array<(request: any, roster: any) => void> = [
      request => Object.defineProperty(request.options, 'seed', { enumerable: true, get() { invoked++; return 133; } }),
      (_request, roster) => Object.defineProperty(roster.view.all[11], 'color', { enumerable: true, get() { invoked++; return 13; } }),
      (_request, roster) => Object.defineProperty(roster.view, 'preview', { enumerable: true, get() { invoked++; return []; } }),
      request => { request.toJSON = () => { invoked++; return {}; }; },
      (_request, roster) => { roster.view.all.toJSON = () => { invoked++; return []; }; },
      request => Object.setPrototypeOf(request, { get worldKey() { invoked++; return 'wrong'; } }),
      (_request, roster) => { delete roster.view.all[3]; },
      (_request, roster) => { roster.view.all.push(roster); },
      (_request, roster) => { roster.view.all[0][Symbol('extra')] = 1; },
      (_request, roster) => { roster.view.all = Array.from({ length: 200 }, () => ({})); },
    ];
    for (const mutate of mutations) {
      const { request, roster } = fixture(); mutate(request, roster);
      expect(buildEarthLayeredRecipeV1(request, roster)).toBeNull();
    }
    expect(invoked).toBe(0);
  });
});
