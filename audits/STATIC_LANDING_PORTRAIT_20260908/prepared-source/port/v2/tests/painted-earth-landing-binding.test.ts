import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { resolveCF1WorldAddress } from '@cf/scene';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';
import { pilotEarthVistaRequest } from '../apps/game/src/pilot-canonical-vista.js';
import { buildEarthLayeredRecipeV1 } from '../apps/game/src/earth-layered-recipe.js';
import {
  buildPaintedEarthLandingRecipeV1, PAINTED_EARTH_LANDING_ID,
} from '../apps/game/src/painted-earth-landing-recipe.js';

beforeAll(() => installCaptureHooks());
type Mutable<T> = { -readonly [Key in keyof T]: Mutable<T[Key]> };
function fixture() {
  const address = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 133 } });
  if (!address.ok) throw new Error('Canonical Earth address unavailable');
  const outcome = canonicalWorldRoster(address.address, 0);
  if (!outcome.ok) throw new Error('Canonical Earth roster unavailable');
  return { request: structuredClone(pilotEarthVistaRequest()) as Mutable<ReturnType<typeof pilotEarthVistaRequest>>,
    roster: structuredClone(outcome.roster) as Mutable<typeof outcome.roster> };
}

describe('canonical Earth still-painting admission', () => {
  it('admits the actual builders while preserving all 19 genomes and the earlier layered recipe', () => {
    const { request, roster } = fixture();
    const before = JSON.stringify({ request, roster });
    const layered = buildEarthLayeredRecipeV1(request, roster);
    const still = buildPaintedEarthLandingRecipeV1(request, roster);
    expect(still).toMatchObject({ sceneId: PAINTED_EARTH_LANDING_ID, width: 960, height: 430 });
    expect(Object.isFrozen(still)).toBe(true);
    expect(roster.view.all).toHaveLength(19);
    expect(roster.view.all.find(row => row._earthName === 'Civet')?.seed).toBe(3212817920);
    expect(JSON.stringify({ request, roster })).toBe(before);
    expect(buildEarthLayeredRecipeV1(request, roster)).toBe(layered);
    expect(buildPaintedEarthLandingRecipeV1(request, roster)).toBe(still);
  });

  it('rejects changes to every resident, including ones omitted by the painted composition', () => {
    const original = fixture();
    expect(buildPaintedEarthLandingRecipeV1(original.request, original.roster)).not.toBeNull();
    for (let index = 0; index < original.roster.view.all.length; index++) {
      const { request, roster } = fixture();
      const beforeFingerprint = roster.fullRosterFingerprint;
      const row = roster.view.all[index]!;
      row.color = (Number(row.color) + 1) % 17;
      expect(roster.fullRosterFingerprint).toBe(beforeFingerprint);
      expect(buildPaintedEarthLandingRecipeV1(request, roster), `ordered resident ${index}`).toBeNull();
    }
  });

  it('rejects a changed environment, epoch, address or roster total despite unchanged leaf seed', () => {
    const environment = fixture();
    if (environment.request.scene !== 'generic') throw new Error('Canonical Earth scene changed');
    environment.request.options.wx = null;
    const epoch = fixture(); epoch.roster.ecologyEpoch = 1;
    const address = fixture(); address.roster.address.galaxy.x++;
    const total = fixture(); total.roster.view.total--;
    for (const { request, roster } of [environment, epoch, address, total]) {
      expect(roster.planetSeed).toBe(133);
      expect(buildPaintedEarthLandingRecipeV1(request, roster)).toBeNull();
    }
  });

  it('keeps cosmetic preview size independent of the full-roster authority', () => {
    const { request, roster } = fixture();
    const expected = buildPaintedEarthLandingRecipeV1(request, roster);
    for (const count of [0, 1, 19]) {
      const altered = { ...roster, view: { ...roster.view,
        preview: roster.view.all.slice(0, count), hiddenFromPreview: roster.view.total - count } };
      expect(buildPaintedEarthLandingRecipeV1(request, altered)).toBe(expected);
    }
  });

  it('rejects accessors and serialization hooks without executing caller code', () => {
    const accessor = fixture(), hooked = fixture();
    const get = vi.fn(() => 3212817920), toJSON = vi.fn(() => ({}));
    Object.defineProperty(accessor.roster.view.all[12], 'seed', { enumerable: true, get });
    Object.defineProperty(hooked.request, 'toJSON', { enumerable: true, value: toJSON });
    expect(buildPaintedEarthLandingRecipeV1(accessor.request, accessor.roster)).toBeNull();
    expect(buildPaintedEarthLandingRecipeV1(hooked.request, hooked.roster)).toBeNull();
    expect(get).not.toHaveBeenCalled(); expect(toJSON).not.toHaveBeenCalled();
  });
});
