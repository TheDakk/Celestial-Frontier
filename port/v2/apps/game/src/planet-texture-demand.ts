/**
 * Resolve the backing-pixel demand for a planet sprite from the size that is
 * actually displayed. The 64px floor preserves the existing distant-world
 * placeholder policy without speculatively selecting an HD tier.
 */
export function displayedPlanetTextureDemandPx(
  diameterCssPx: number,
  sceneScale: number,
  devicePixelRatio: number,
): number {
  const displayedBackingPx = diameterCssPx * sceneScale * devicePixelRatio;
  if (!Number.isFinite(displayedBackingPx) || displayedBackingPx <= 0) return 64;
  return Math.max(64, Math.ceil(displayedBackingPx));
}

export type PlanetTextureTierPx = 512 | 768 | 1024;

/** A displayed tier is real only when the attached square TextureSource has
 * that exact backing size. Placeholders and malformed/non-square sources are
 * deliberately reported as tier 0. */
export function planetTextureTierForBackingPx(
  width: number,
  height: number,
): PlanetTextureTierPx | 0 {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width !== height) return 0;
  return width === 512 || width === 768 || width === 1024 ? width : 0;
}

/** Keep this threshold map identical to ThumbArt#getPlanetSprite. */
export function planetTextureTierForDemandPx(demandPx: number): PlanetTextureTierPx {
  const requestedPx = Number.isFinite(demandPx) ? Math.trunc(demandPx) : 0;
  if (requestedPx >= 900) return 1024;
  if (requestedPx > 640) return 768;
  return 512;
}

export function nextPlanetTextureTierPx(
  requestedTierPx: number,
  demandPx: number,
): PlanetTextureTierPx | null {
  const nextTierPx = planetTextureTierForDemandPx(demandPx);
  return nextTierPx > requestedTierPx ? nextTierPx : null;
}

export interface SurfacePlanetTextureIdentity {
  readonly generation: number;
  readonly planetSeed: number;
  readonly planetOrdinal: number;
}

export function sameSurfacePlanetTextureIdentity(
  expected: SurfacePlanetTextureIdentity,
  current: SurfacePlanetTextureIdentity | null,
): boolean {
  return current !== null
    && current.generation === expected.generation
    && current.planetSeed === expected.planetSeed
    && current.planetOrdinal === expected.planetOrdinal;
}
