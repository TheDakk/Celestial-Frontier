/* Pure projection from the current proven world + canonical ecology roster to
   the preserved vista compositor's finite input. This selects presentation;
   it never mutates generation, save state, anatomy, or landing outcomes. */
import { type BiomeVisualKeyV1 } from '@cf/art/biome-visual-profile';
import { BIOME_PROFILE_AUTHORITY_V1 } from '@cf/domain-biome-profile';
import { hdGenesFor } from '@cf/domain-strays';
import { habOf, locoOf } from '@cf/domain-speciestraits';
import { mulberry32 } from '@cf/domain-rand';
import { HOME_GAL_SEED, HOME_POS, SOL_POS, SOL_SEED } from '@cf/domain-worldconfig';
import type { PlanetNode } from '@cf/scene';
import {
  isCanonicalWorldRoster,
  type CanonicalWorldRoster,
} from './world-roster.js';
import type { BiomeVistaRenderRequestV1 } from './biome-vista-protocol.js';

const PLANET_TYPES = Object.freeze([
  'terran', 'ocean', 'ice', 'desert', 'rocky', 'venus', 'lava', 'gas',
] as const);
type PlanetType = typeof PLANET_TYPES[number];

const SEA_KEYS = new Set<BiomeVisualKeyV1>([
  'opensea', 'archipelago', 'stormsea', 'volcisle', 'milksea',
]);

export interface BiomeVistaMountLayoutV1 {
  readonly scale: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly displayWidth: number;
  readonly displayHeight: number;
  readonly portraitBand: boolean;
}

/** Preserve the compositor's entire authored horizontal composition. A
 * cover crop hid roughly four fifths of the source on portrait phones, which
 * made most resident flora/fauna unreachable even though they were rendered.
 * Portrait viewports therefore present the vista as a full-width horizon band
 * immediately above the fitted globe; wider viewports keep it centered. */
export function biomeVistaMountLayoutV1(
  viewportWidth: number,
  viewportHeight: number,
  sourceWidth = 960,
  sourceHeight = 430,
): BiomeVistaMountLayoutV1 {
  for (const [name, value] of Object.entries({
    viewportWidth, viewportHeight, sourceWidth, sourceHeight,
  })) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new TypeError(`biome vista layout: ${name} must be positive and finite`);
    }
  }
  const gutter = Math.min(24, Math.max(8, viewportWidth * 0.03));
  const scale = Math.min(
    (viewportWidth - gutter * 2) / sourceWidth,
    (viewportHeight - gutter * 2) / sourceHeight,
  );
  if (!(scale > 0)) throw new TypeError('biome vista layout: viewport is too small');
  const displayWidth = sourceWidth * scale;
  const displayHeight = sourceHeight * scale;
  const portraitBand = viewportHeight / viewportWidth >= 1.25;
  const fittedGlobeDiameter = Math.min(420, Math.min(viewportWidth, viewportHeight) * 0.78);
  const globeTop = viewportHeight / 2 - fittedGlobeDiameter / 2;
  const centeredY = viewportHeight / 2;
  const bandY = Math.max(
    gutter + displayHeight / 2,
    globeTop - gutter - displayHeight / 2,
  );
  return Object.freeze({
    scale,
    centerX: viewportWidth / 2,
    centerY: portraitBand ? bandY : centeredY,
    displayWidth,
    displayHeight,
    portraitBand,
  });
}

function planetType(value: unknown): PlanetType {
  if (typeof value !== 'string' || !PLANET_TYPES.includes(value as PlanetType)) {
    throw new TypeError('biome vista projection: unsupported planet type');
  }
  return value as PlanetType;
}

export function hasCanonicalEarthMagneticFieldV1(roster: CanonicalWorldRoster): boolean {
  const address = roster.address;
  return address.galaxy.seed === HOME_GAL_SEED
    && address.galaxy.x === HOME_POS.x && address.galaxy.y === HOME_POS.y
    && address.star.seed === SOL_SEED
    && address.star.x === SOL_POS.x && address.star.y === SOL_POS.y
    && address.planet.seed === 133 && address.planet.ordinal === 2;
}

function surfaceWater(type: PlanetType, band: string): 'liquid' | 'frozen' | 'none' {
  if (type === 'ocean') return 'liquid';
  if (type === 'ice') return 'frozen';
  if (type !== 'terran') return 'none';
  if (band === 'hot') return 'none';
  if (band === 'cold' || band === 'frozen') return 'frozen';
  return 'liquid';
}

type ResidentClass = 'land' | 'aqua' | 'air';
function residentClass(genome: Readonly<Record<string, unknown>>): ResidentClass {
  const locomotion = locoOf(genome as Record<string, unknown>);
  const habitat = habOf(genome as Record<string, unknown>);
  if (/swim|filter|current/u.test(locomotion)
    || /open ocean|sea shallows|vent fields/u.test(habitat)) return 'aqua';
  if (/glider|floater|drift/u.test(locomotion) || /cloud decks/u.test(habitat)) return 'air';
  return 'land';
}

function staticWeather(type: PlanetType, band: string, seed: number): string | null {
  const candidate = type === 'terran'
    ? (band === 'temperate' ? 'rain' : band === 'hot' ? 'haze' : 'snow')
    : type === 'ocean' ? 'rain'
      : type === 'ice' ? 'snow'
        : type === 'desert' ? 'dust'
          : type === 'lava' ? 'ash'
            : type === 'venus' ? 'haze' : null;
  if (!candidate) return null;
  const odds: Readonly<Record<string, number>> = Object.freeze({
    rain: 0.42, snow: 0.58, dust: 0.48, ash: 0.68, haze: 0.88,
  });
  return mulberry32((seed ^ 0x77EA) >>> 0)() < (odds[candidate] ?? 1) ? candidate : null;
}

function timeOfDay(seed: number): 'day' | 'twilight' | 'night' {
  const phase = mulberry32((seed ^ 0xD4A7) >>> 0)();
  return phase < 0.62 ? 'day' : phase < 0.82 ? 'twilight' : 'night';
}

export function buildBiomeVistaRenderRequestV1(
  planet: PlanetNode,
  starSeed: number,
  expectedWorldKey: string,
  system: Record<string, unknown>,
  roster: CanonicalWorldRoster,
): BiomeVistaRenderRequestV1 {
  if (!isCanonicalWorldRoster(roster)
    || !Number.isInteger(planet.seed) || planet.seed < 0 || planet.seed > 0xffff_ffff
    || !Number.isInteger(starSeed) || starSeed < 0 || starSeed > 0xffff_ffff
    || roster.starSeed !== starSeed
    || typeof expectedWorldKey !== 'string' || expectedWorldKey.length === 0
    || roster.worldKey !== expectedWorldKey
    || roster.planetSeed !== planet.seed || roster.planetOrdinal !== planet.ordinal) {
    throw new TypeError('biome vista projection: proven world and roster must match');
  }
  const type = planetType(planet.P.type ?? planet.type);
  const key = roster.biomeProfileKey;
  const band = roster.climateBand;
  if (roster.biomeProfileSchema !== BIOME_PROFILE_AUTHORITY_V1.schema
    || roster.biomeProfileDigest !== BIOME_PROFILE_AUTHORITY_V1.digest
    || roster.biomeProfile !== BIOME_PROFILE_AUTHORITY_V1.profiles[key]) {
    throw new TypeError('biome vista projection: canonical profile authority changed');
  }
  const identity = Object.freeze({
    worldKey: roster.worldKey,
    environmentFingerprint: roster.environmentFingerprint,
    profileSchema: roster.biomeProfileSchema,
    profileDigest: roster.biomeProfileDigest,
    biomeKey: key,
  });
  const tod = timeOfDay(planet.seed);
  const wx = staticWeather(type, band, planet.seed);
  const rows = roster.view.all;
  const fauna = rows.filter((row) => row.kingdom === 'fauna');
  const land = fauna.filter((row) => residentClass(row) === 'land');
  const aqua = fauna.filter((row) => residentClass(row) === 'aqua');
  const air = fauna.filter((row) => residentClass(row) === 'air');
  const flora = rows.filter((row) => row.kingdom === 'flora');
  const groundFlora = flora.filter((row) => !row.aq && !row.af);
  const faunaGenes = (items: readonly Readonly<Record<string, unknown>>[]) =>
    items.slice(0, 3).map((row) => hdGenesFor(row as Record<string, unknown>));

  if (type === 'gas') {
    const hue = Number.isFinite(planet.P.hue) ? Number(planet.P.hue) : 30;
    const spotHue = Number.isFinite(planet.P.spotHue) ? Number(planet.P.spotHue) : undefined;
    return Object.freeze({
      ...identity, scene: 'gas' as const,
      options: Object.freeze({
        seed: planet.seed, hue, spot: !!planet.P.spot,
        ...(spotHue === undefined ? {} : { spotHue }),
        ring: planet.ring, moons: planet.moons, tod,
        aurora: true, air: air.length, wb: key,
        airGenes: air.length ? faunaGenes(air).slice(0, 2) : null,
        aerFlora: flora.filter((row) => !!row.af).slice(0, 1),
        evt: null, titan: false,
      }),
    });
  }
  if (key === 'abyssal') {
    return Object.freeze({
      ...identity, scene: 'abyss' as const,
      options: Object.freeze({ seed: planet.seed, aqua: aqua.length, genes: faunaGenes(aqua) }),
    });
  }
  if (key === 'coral') {
    return Object.freeze({
      ...identity, scene: 'reef' as const,
      options: Object.freeze({ seed: planet.seed, genes: faunaGenes(aqua) }),
    });
  }

  let pal: 'day' | 'night' | 'rain' | 'dust' | 'sand' | 'ice' | 'grey' | 'haze' | 'ember' | 'snow' | 'twilight' = 'day';
  if (type === 'ice') pal = 'ice';
  else if (type === 'rocky') pal = 'grey';
  else if (type === 'venus') pal = 'haze';
  else if (type === 'desert') pal = wx === 'dust' ? 'dust' : 'sand';
  else if (type === 'lava') pal = 'ember';
  else if (type === 'terran' || type === 'ocean') {
    if (tod === 'night') pal = 'night';
    else if (tod === 'twilight') pal = 'twilight';
    else if (wx === 'rain') pal = 'rain';
    else if (wx === 'snow' || band === 'cold' || band === 'frozen') pal = 'snow';
  }
  const hasField = hasCanonicalEarthMagneticFieldV1(roster) || ((type === 'terran' || type === 'ocean')
    && mulberry32((planet.seed ^ 0xBEEF) >>> 0)() < 0.8);
  const clockGrade = type !== 'terran' && type !== 'ocean' && type !== 'lava';
  const starColor = typeof system.starCol === 'string' ? system.starCol : null;
  return Object.freeze({
    ...identity, scene: 'generic' as const,
    options: Object.freeze({
      seed: planet.seed, era: 'none', pal,
      biome: type === 'ocean' || (type === 'terran' && SEA_KEYS.has(key)) ? 'island' : 'land',
      wx, moons: planet.moons, aurora: hasField && wx !== 'rain' && wx !== 'snow',
      nightize: clockGrade && tod === 'night', duskize: clockGrade && tod === 'twilight',
      flora: groundFlora.length > 0,
      water: surfaceWater(type, band),
      genes: land.length ? faunaGenes(land) : null,
      floraGenes: groundFlora.slice(0, 2),
      ring: planet.ring, stc: starColor, herd: land.length,
      aqua: aqua.length, air: air.length, wb: key, evt: null, titan: false, salt: 0,
    }),
  });
}
