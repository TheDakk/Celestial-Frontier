import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  displayedPlanetTextureDemandPx,
  nextPlanetTextureTierPx,
  planetTextureTierForDemandPx,
  sameSurfacePlanetTextureIdentity,
} from '../apps/game/src/planet-texture-demand.js';

const mainSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)),
  'utf8',
);
const thumbArtSource = readFileSync(
  fileURLToPath(new URL('../packages/art/src/thumbart.verbatim.js', import.meta.url)),
  'utf8',
);

function surfaceDemandBindingErrors(source: string): string[] {
  const errors: string[] = [];
  const demandCalls = source.match(
    /displayedPlanetTextureDemandPx\(R \* 2, fitZ, DPR\)/g,
  ) ?? [];
  const surfaceBindings = source.match(
    /getPlanetSprite\(p\.P, initialTextureDemandPx\)/g,
  ) ?? [];
  if (demandCalls.length !== 1) errors.push(`surface demand calls: ${demandCalls.length}`);
  if (surfaceBindings.length !== 1) errors.push(`surface demand bindings: ${surfaceBindings.length}`);
  if (source.includes('getPlanetSprite(p.P, 1024)')) {
    errors.push('surface queues fixed 1024px texture');
  }
  return errors;
}

function surfaceTextureLifecycleBindingErrors(
  source: string,
  thumbSource = thumbArtSource,
): string[] {
  const errors: string[] = [];
  const exactBindings: ReadonlyArray<readonly [string, string]> = [
    [
      'scheduleSurfacePlanetTextureRefresh(surfacePlanetTextureOwner, initialTextureDemandPx);',
      'initial fitted tier has no post-bake refresh',
    ],
    [
      'owner.requestedTierPx = nextTierPx;',
      'requested tier is not committed before the refresh',
    ],
    [
      'if (surfacePlanetTextureOwner?.refreshTimer != null) {\n    clearTimeout(surfacePlanetTextureOwner.refreshTimer);',
      'surface teardown does not cancel its current refresh',
    ],
    [
      'publishSurfacePlanetTexture(owner, getPlanetSprite(owner.planet.P, demandPx));',
      'post-bake refresh does not re-read and publish the requested tier',
    ],
    [
      'const nextTierPx = nextPlanetTextureTierPx(owner.requestedTierPx, demandPx);',
      'live demand does not compare against the owned tier',
    ],
    [
      'if (nextTierPx === null) return;',
      'same-tier demand is not suppressed',
    ],
    [
      'requestSurfacePlanetTextureDemand(displayedPlanetTextureDemandPx(\n    owner.diameterCssPx,\n    camT.z,\n    DPR,\n  ));',
      'live zoom and DPR do not drive displayed backing demand',
    ],
  ];
  for (const [binding, error] of exactBindings) {
    if (source.split(binding).length - 1 !== 1) errors.push(error);
  }
  const refreshDelay = Number(
    /const SURFACE_PLANET_TEXTURE_REFRESH_MS = (\d+);/.exec(source)?.[1] ?? Number.NaN,
  );
  const bakeDelay = Number(
    /_hdLater\(\(\)=>\{[\s\S]*?renderPlanetSprite\(P, hdPx\|\|P_PX\)[\s\S]*?\},\s*(\d+)\);/
      .exec(thumbSource)?.[1] ?? Number.NaN,
  );
  if (!Number.isFinite(refreshDelay) || !Number.isFinite(bakeDelay)
    || refreshDelay <= bakeDelay) {
    errors.push(`refresh delay ${String(refreshDelay)} does not follow bake delay ${String(bakeDelay)}`);
  }
  return errors;
}

describe('displayed planet texture demand', () => {
  it('requests only the backing pixels displayed by standard phone and desktop surfaces', () => {
    const phoneFit = (390 * 0.78) / 420;
    expect(displayedPlanetTextureDemandPx(420, phoneFit, 2)).toBe(609);
    expect(displayedPlanetTextureDemandPx(420, 1, 1)).toBe(420);
  });

  it('retains the minimum placeholder demand and permits a genuinely high-density surface', () => {
    expect(displayedPlanetTextureDemandPx(16, 0.5, 1)).toBe(64);
    expect(displayedPlanetTextureDemandPx(420, 1, 3)).toBe(1_260);
    expect(displayedPlanetTextureDemandPx(420, Number.NaN, 2)).toBe(64);
  });

  it('preserves the exact 512/768/1024 painter-tier boundaries', () => {
    expect(planetTextureTierForDemandPx(640)).toBe(512);
    expect(planetTextureTierForDemandPx(641)).toBe(768);
    expect(planetTextureTierForDemandPx(899)).toBe(768);
    expect(planetTextureTierForDemandPx(900)).toBe(1024);
    expect(thumbArtSource).toContain(
      "const hdPx=(wantPx|0)>=900 ? 1024 : ((wantPx|0)>640 ? 768 : 0);",
    );
  });

  it('upgrades genuine phone and desktop zoom demand without rescheduling an owned tier', () => {
    expect(planetTextureTierForDemandPx(1_248)).toBe(1024);
    expect(planetTextureTierForDemandPx(1_280)).toBe(1024);
    expect(nextPlanetTextureTierPx(0, 609)).toBe(512);
    expect(nextPlanetTextureTierPx(512, 609)).toBeNull();
    expect(nextPlanetTextureTierPx(512, 641)).toBe(768);
    expect(nextPlanetTextureTierPx(768, 900)).toBe(1024);
    expect(nextPlanetTextureTierPx(1024, 1_280)).toBeNull();
  });

  it('accepts completion only for the exact current surface generation and world', () => {
    const expected = { generation: 7, planetSeed: 133, planetOrdinal: 3 };
    expect(sameSurfacePlanetTextureIdentity(expected, { ...expected })).toBe(true);
    expect(sameSurfacePlanetTextureIdentity(expected, { ...expected, generation: 8 })).toBe(false);
    expect(sameSurfacePlanetTextureIdentity(expected, { ...expected, planetSeed: 134 })).toBe(false);
    expect(sameSurfacePlanetTextureIdentity(expected, { ...expected, planetOrdinal: 4 })).toBe(false);
    expect(sameSurfacePlanetTextureIdentity(expected, null)).toBe(false);
  });

  it('binds the live Planetside surface to computed demand exactly once', () => {
    expect(surfaceDemandBindingErrors(mainSource)).toEqual([]);
  });

  it('negative control: a restored fixed 1024px surface request is rejected', () => {
    const regressed = mainSource.replace(
      'getPlanetSprite(p.P, initialTextureDemandPx)',
      'getPlanetSprite(p.P, 1024)',
    );
    expect(regressed).not.toBe(mainSource);
    expect(surfaceDemandBindingErrors(regressed)).toEqual([
      'surface demand bindings: 0',
      'surface queues fixed 1024px texture',
    ]);
  });

  it('negative control: disconnecting the computed demand from the surface is rejected', () => {
    const disconnected = mainSource.replace(
      'getPlanetSprite(p.P, initialTextureDemandPx)',
      'getPlanetSprite(p.P)',
    );
    expect(disconnected).not.toBe(mainSource);
    expect(surfaceDemandBindingErrors(disconnected)).toEqual([
      'surface demand bindings: 0',
    ]);
  });

  it('binds zoom refresh and stale-owner cancellation into the live surface lifecycle', () => {
    expect(surfaceTextureLifecycleBindingErrors(mainSource)).toEqual([]);
    expect(mainSource).toContain('updateSurfacePlanetTextureDemand();');
    expect(mainSource).toContain('releaseSurfacePlanetTextureOwner();');
    expect(mainSource).toContain('sameSurfacePlanetTextureIdentity(owner, currentSurfacePlanetTextureIdentity())');
  });

  it('negative control: removing the initial post-bake refresh is rejected', () => {
    const broken = mainSource.replace(
      'scheduleSurfacePlanetTextureRefresh(surfacePlanetTextureOwner, initialTextureDemandPx);',
      '',
    );
    expect(broken).not.toBe(mainSource);
    expect(surfaceTextureLifecycleBindingErrors(broken)).toContain(
      'initial fitted tier has no post-bake refresh',
    );
  });

  it('negative control: a tier that is not committed before refresh is rejected', () => {
    const broken = mainSource.replace('owner.requestedTierPx = nextTierPx;', '');
    expect(broken).not.toBe(mainSource);
    expect(surfaceTextureLifecycleBindingErrors(broken)).toContain(
      'requested tier is not committed before the refresh',
    );
  });

  it('negative control: hard-coding the live zoom path back to 1024 is rejected', () => {
    const broken = mainSource.replace(
      'requestSurfacePlanetTextureDemand(displayedPlanetTextureDemandPx(\n    owner.diameterCssPx,\n    camT.z,\n    DPR,\n  ));',
      'requestSurfacePlanetTextureDemand(1024);',
    );
    expect(broken).not.toBe(mainSource);
    expect(surfaceTextureLifecycleBindingErrors(broken)).toContain(
      'live zoom and DPR do not drive displayed backing demand',
    );
  });

  it('negative control: removing duplicate-tier suppression is rejected', () => {
    const broken = mainSource.replace('if (nextTierPx === null) return;', '');
    expect(broken).not.toBe(mainSource);
    expect(surfaceTextureLifecycleBindingErrors(broken)).toContain(
      'same-tier demand is not suppressed',
    );
  });

  it('negative control: disconnecting the owned tier from live demand is rejected', () => {
    const broken = mainSource.replace(
      'const nextTierPx = nextPlanetTextureTierPx(owner.requestedTierPx, demandPx);',
      'const nextTierPx = planetTextureTierForDemandPx(demandPx);',
    );
    expect(broken).not.toBe(mainSource);
    expect(surfaceTextureLifecycleBindingErrors(broken)).toContain(
      'live demand does not compare against the owned tier',
    );
  });

  it('negative control: a refresh at or before the painter timer is rejected', () => {
    const exactBoundary = mainSource.replace(
      'const SURFACE_PLANET_TEXTURE_REFRESH_MS = 31;',
      'const SURFACE_PLANET_TEXTURE_REFRESH_MS = 30;',
    );
    expect(exactBoundary).not.toBe(mainSource);
    expect(surfaceTextureLifecycleBindingErrors(exactBoundary)).toContain(
      'refresh delay 30 does not follow bake delay 30',
    );
    const tooEarly = mainSource.replace(
      'const SURFACE_PLANET_TEXTURE_REFRESH_MS = 31;',
      'const SURFACE_PLANET_TEXTURE_REFRESH_MS = 29;',
    );
    expect(surfaceTextureLifecycleBindingErrors(tooEarly)).toContain(
      'refresh delay 29 does not follow bake delay 30',
    );
  });

  it('negative control: removing teardown cancellation is rejected', () => {
    const broken = mainSource.replace(
      'if (surfacePlanetTextureOwner?.refreshTimer != null) {\n    clearTimeout(surfacePlanetTextureOwner.refreshTimer);',
      'if (surfacePlanetTextureOwner?.refreshTimer != null) {',
    );
    expect(broken).not.toBe(mainSource);
    expect(surfaceTextureLifecycleBindingErrors(broken)).toContain(
      'surface teardown does not cancel its current refresh',
    );
  });
});
