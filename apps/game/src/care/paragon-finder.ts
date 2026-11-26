/* The home worlds of the Fifty Paragons.

   LEGACY celestial-frontier.html, v1.8.9: each Paragon has one home world, fixed for ever: a walk over the
   universe from the Paragon's own random stream to the first galaxy that is no quasar, dwarf or radio galaxy and
   larger than 30, then to the first star in it with a terran or ocean planet (`paragonWhere` 15380-15404). A
   scan finds a Paragon by the world's planet seed (`_parSites` 15407-15413, `autoScanWorld` 14905-14906).

   The legacy game filled its table of sites in the background, one walk every 150 ms from 4 s after the page
   opened, so a scan in the first seconds of a session missed a Paragon that was there. Here the table is whole
   from the first asking (the fifty walks take a few milliseconds).

   Ported from the painted port's `paragon-finder.ts` (its walk, 190-300). Not carried: its catalogue projection
   (the Compendium screen's), and its rule that a Paragon is found only at the complete address of its home: the
   legacy game asks the planet seed alone. */
import { ARC9_PARAGON_COUNT_V1 } from '@cf/domain-acquisition/paragon-internal';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { GCELL, GR } from '@cf/domain-worldconfig';
import { galaxiesInCell, galaxyProfile, starsInCell, systemFor } from '@cf/domain-worldgen';

const PARAGON_ANCHOR = 0x9A7A60;
const WHERE_SALT = 64;
const GALAXY_TRIES = 400;
const STAR_TRIES = 700;
const GALAXY_REACH = 2200;
const GALAXY_SIZE_MIN = 30;
const HOME_TYPES: ReadonlySet<unknown> = new Set(['terran', 'ocean']);

export interface ParagonSite {
  /** The galaxy as the legacy game keeps a place's galaxy (`slimGal` 5472-5475). */
  readonly galaxy: Readonly<{ x: number; y: number; size: number; sp: number; tilt: number; rot: number; seed: number; home: boolean; quasar: boolean; dwarf: boolean }>;
  readonly star: Readonly<{ x: number; y: number; seed: number }>;
  readonly planetSeed: number;
}

const SITES = new Map<number, ParagonSite | null>();

/** The home world of Paragon `index` (0 to 49); null when the walk finds none. */
export function paragonSite(index: number): ParagonSite | null {
  if (!Number.isInteger(index) || index < 0 || index >= ARC9_PARAGON_COUNT_V1) throw new RangeError('a Paragon is one of the Fifty');
  const known = SITES.get(index);
  if (known !== undefined) return known;
  const r = mulberry32(hashInt(PARAGON_ANCHOR, index | 0, WHERE_SALT) >>> 0);
  let site: ParagonSite | null = null;
  let galaxy: ReturnType<typeof galaxiesInCell>[number] | null = null;
  for (let k = 0; k < GALAXY_TRIES && galaxy === null; k++) {
    const cx = Math.floor((r() * 2 - 1) * GALAXY_REACH), cy = Math.floor((r() * 2 - 1) * GALAXY_REACH);
    for (const g of galaxiesInCell(cx, cy)) {
      if (!g.quasar && !g.dwarf && !g.radio && g.size > GALAXY_SIZE_MIN) { galaxy = g; break; }
    }
  }
  if (galaxy !== null) {
    const profile = galaxyProfile(galaxy.seed);
    const cells = Math.floor(GR / GCELL);
    for (let k = 0; k < STAR_TRIES && site === null; k++) {
      const cx = Math.floor((r() * 2 - 1) * cells * 0.6), cy = Math.floor((r() * 2 - 1) * cells * 0.6);
      for (const star of starsInCell(galaxy.seed, profile, cx, cy).stars) {
        const planets = (systemFor(star.seed).planets ?? []) as unknown as ReadonlyArray<{ P: { type?: unknown; seed: number } }>;
        const home = planets.find((planet) => HOME_TYPES.has(planet.P.type));
        if (home !== undefined) {
          site = Object.freeze({
            galaxy: Object.freeze({
              x: galaxy.x, y: galaxy.y, size: galaxy.size, sp: galaxy.sp, tilt: galaxy.tilt, rot: galaxy.rot, seed: galaxy.seed,
              home: galaxy.home || false, quasar: galaxy.quasar || false, dwarf: galaxy.dwarf || false,
            }),
            star: Object.freeze({ x: star.x, y: star.y, seed: star.seed }),
            planetSeed: home.P.seed,
          });
          break;
        }
      }
    }
  }
  SITES.set(index, site);
  return site;
}

let byPlanetSeed: ReadonlyMap<number, number> | null = null;
/** The Paragon whose home world has this planet seed, or null. Of two Paragons at one seed the later is kept, as
    the legacy table kept it. */
export function paragonIndexAt(planetSeed: number): number | null {
  if (byPlanetSeed === null) {
    const table = new Map<number, number>();
    for (let index = 0; index < ARC9_PARAGON_COUNT_V1; index++) {
      const site = paragonSite(index);
      if (site !== null) table.set(site.planetSeed, index);
    }
    byPlanetSeed = table;
  }
  return byPlanetSeed.get(planetSeed) ?? null;
}
