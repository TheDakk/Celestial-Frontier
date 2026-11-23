/* The passes of the game's map beyond its bodies, joined into one picture in the game's own order. */
import type { SpaceItem } from '@cf/art-interface';
import type { PassView } from './draw';
import type { MapBody } from './model';
import { hazeItems, stirGalaxyBody } from './passes-galaxy';
import { cometItems, dressPlanet, systemCaptions, turnBeams, visitorItems, zoneItems } from './passes-system';
import { bridgeItems, charterShown, edgeItems, fogItems, turnGalaxy, veilItems, webCaptions, webItems } from './passes-universe';

/** Words anchored at a world point. With `stand` the game stands them on that point, their foot on it, this many
 *  world units above the thing they name; without it they lie centred on the point. */
export interface Caption { text: string; wx: number; wy: number; stand?: number }

/**
 * Everything a map paints, from the back. The universe: the star field, the cosmic web, the bridges, the charter's
 * ring, the galaxies, then the veil and the fog beyond the charter and the edge of the observable universe. A galaxy:
 * its haze under its scenery and bodies. A system: the habitable zone under its scenery, each planet with its clouds
 * and its night, then the comets and the visitor. `scenery` and each body's `items` are what the map paints without
 * the passes.
 */
export function withPasses(v: PassView, backdrop: readonly SpaceItem[], scenery: readonly SpaceItem[],
  bodies: readonly { body: MapBody; items: readonly SpaceItem[] }[]): SpaceItem[] {
  const drawn = bodies.flatMap(({ body, items }) => {
    if (body.kind === 'galaxy') return turnGalaxy(body.ref, items, v);
    if (body.kind === 'planet') return dressPlanet(body.ref, items, v);
    return stirGalaxyBody(body, items, v);
  });
  if (v.nav.mode === 'universe') {
    const charter = charterShown(v);
    return [...backdrop, ...webItems(v), ...bridgeItems(v), ...(charter ? scenery : []), ...drawn, ...(charter ? [...veilItems(v), ...fogItems(v)] : []), ...edgeItems(v)];
  }
  if (v.nav.mode === 'galaxy') return [...backdrop, ...hazeItems(v), ...scenery, ...drawn];
  if (v.nav.mode === 'system') return [...backdrop, ...zoneItems(v), ...turnBeams(scenery, v), ...drawn, ...cometItems(v), ...visitorItems(v)];
  return [...backdrop, ...scenery, ...drawn];
}

/** The captions that belong to the passes, for the map screen to letter: the far zoom's clusters and voids, and in a
 *  system the habitable zone, the comets and the visitor. */
export function passCaptions(v: PassView): Caption[] {
  return v.nav.mode === 'universe' ? webCaptions(v) : systemCaptions(v);
}
