/** @module worldlife/spec [domain] — A5 world-life layer (MOTION_KIT §7 LANDFALL / ARENA plate life).
 * Compiles deterministic layer parameters from a system card + recipe seed. Pure: no clock, no
 * Math.random; every seeded value comes from mulberry32(seed ^ layer salt). Unknown card values
 * are refused with a named reason (never guessed). Coordinates are normalized to the reference
 * frame (1024×576, ground line .78) so an adapter scales them to any viewport. */
import { BIOME_PROFILES_V1, type BiomeProfileKeyV1, type BiomeProfileWeatherV1 } from '@cf/domain-biome-profile';
import { mulberry32 } from '@cf/domain-rand';

export const WORLD_LIFE_SPEC_SCHEMA_V1 = 'cf.worldlife.spec/v1' as const;
export type WorldLifeWeatherV1 = 'rain' | 'snow' | 'dust' | 'ash' | 'haze' | null;
export type WorldLifeWaterV1 = 'liquid' | 'frozen' | 'none';
export type WorldLifeTimeOfDayV1 = 'day' | 'twilight' | 'night';
export type WorldLifeStrengthV1 = 'still' | 'mild' | 'wind' | 'storm';
export type WorldLifeSurfaceV1 = 'landfall' | 'arena';
export type WorldLifeTierV1 = 'desktop' | 'phone';
export type WorldLifePrecipKindV1 = 'rain' | 'snow' | 'dust' | 'ash';

export interface WorldLifeCardV1 {
  readonly biome: string;
  readonly weather: WorldLifeWeatherV1;
  readonly water: WorldLifeWaterV1;
  readonly timeOfDay: WorldLifeTimeOfDayV1;
  readonly luminous?: boolean;
  /** Explicit override; otherwise derived from the biome profile weather word and the vista weather. */
  readonly strength?: WorldLifeStrengthV1;
}

export interface WorldLifePrecipitationV1 {
  readonly kind: WorldLifePrecipKindV1;
  /** Whole-frame density in streaks per reference pixel² before the streak scale and cap. */
  readonly density: number;
  readonly requestedCount: number;
  readonly count: number;
  readonly overBudget: boolean;
  /** Radians from vertical, positive = leaning right (wind direction is seeded). */
  readonly angle: number;
  /** Normalized frame heights per second. */
  readonly speed: number;
  readonly length: readonly [number, number];
  readonly opacity: number;
  readonly color: number;
  /** Flat [x0, y0, lengthFraction, phaseSeed] per streak, normalized. */
  readonly field: readonly number[];
}
export interface WorldLifeDriftV1 {
  readonly count: number; readonly speedX: number; readonly speedY: number;
  readonly opacity: number; readonly color: number;
  /** Per blob: [x0, y0, radius, phase], normalized. */
  readonly blobs: readonly (readonly [number, number, number, number])[];
}
export interface WorldLifeShimmerV1 { readonly rippleFrequencyHz: number; readonly amplitude: number; readonly phases: readonly number[]; }
export interface WorldLifeSwayBandV1 { readonly band: 0 | 1 | 2; readonly frequencyHz: number; readonly phase: number; readonly amplitude: number; }
export interface WorldLifeFlierPathV1 {
  readonly x0: number; readonly y0: number; readonly direction: 1 | -1; readonly speed: number;
  readonly bob: number; readonly bobHz: number; readonly phase: number;
}
export interface WorldLifeFliersV1 { readonly kind: 'bird' | 'swimmer'; readonly count: number; readonly paths: readonly WorldLifeFlierPathV1[]; }
export interface WorldLifeFlickerV1 { readonly base: number; readonly lights: readonly (readonly [number, number, number, number])[]; }

export interface WorldLifeSpecV1 {
  readonly schema: typeof WORLD_LIFE_SPEC_SCHEMA_V1;
  readonly seed: number;
  readonly surface: WorldLifeSurfaceV1;
  readonly tier: WorldLifeTierV1;
  readonly card: Readonly<Required<WorldLifeCardV1>>;
  readonly illumination: number;
  readonly frame: Readonly<{ width: number; height: number; groundLine: number }>;
  readonly precipitation: WorldLifePrecipitationV1 | null;
  readonly drift: WorldLifeDriftV1;
  readonly shimmer: WorldLifeShimmerV1 | null;
  readonly sway: Readonly<{ amplitude: number; frequencyBand: readonly [number, number]; bands: readonly WorldLifeSwayBandV1[] }>;
  readonly fliers: WorldLifeFliersV1 | null;
  readonly flicker: WorldLifeFlickerV1 | null;
  readonly budget: Readonly<{ streakCap: number }>;
}

export class WorldLifeRefusal extends Error {
  readonly reason: string;
  constructor(reason: string, detail: string) { super(`world life refused: ${reason} (${detail})`); this.name = 'WorldLifeRefusal'; this.reason = reason; }
}

export const WORLD_LIFE_FRAME = Object.freeze({ width: 1024, height: 576, groundLine: 0.78 });
export const WORLD_LIFE_STREAK_CAP: Readonly<Record<WorldLifeTierV1, number>> = Object.freeze({ desktop: 400, phone: 200 });
export const WORLD_LIFE_ARENA_DENSITY = 0.6;
const STRENGTHS: readonly WorldLifeStrengthV1[] = ['still', 'mild', 'wind', 'storm'];
const SWAY_AMPLITUDE: Readonly<Record<WorldLifeStrengthV1, number>> = { still: 0.2, mild: 0.5, wind: 1.0, storm: 1.4 };
const SWAY_BAND: Readonly<Record<WorldLifeStrengthV1, readonly [number, number]>> = { still: [0.12, 0.22], mild: [0.2, 0.4], wind: [0.35, 0.7], storm: [0.6, 1.1] };
const DENSITY_FACTOR: Readonly<Record<WorldLifeStrengthV1, number>> = { still: 0.5, mild: 1, wind: 1.35, storm: 1.8 };
const DRIFT_SPEED_FACTOR: Readonly<Record<WorldLifeStrengthV1, number>> = { still: 0.5, mild: 1, wind: 2.2, storm: 3.4 };
const RAIN_ANGLE: Readonly<Record<WorldLifeStrengthV1, number>> = { still: 0.04, mild: 0.12, wind: 0.32, storm: 0.5 };
const ILLUMINATION: Readonly<Record<WorldLifeTimeOfDayV1, number>> = { day: 1, twilight: 0.66, night: 0.36 };
/** Base whole-frame stroke densities follow kit-weather-math (Codex) so both stages share one vocabulary. */
const PRECIP: Readonly<Record<WorldLifePrecipKindV1, Readonly<{ density: number; speed: number; length: readonly [number, number]; opacity: number; color: number }>>> = {
  rain: { density: 0.0018, speed: 1.25, length: [10, 22], opacity: 0.12, color: 0xc0d3e1 },
  snow: { density: 0.0013, speed: 0.1, length: [2, 4], opacity: 0.26, color: 0xc0d3e1 },
  dust: { density: 0.0015, speed: 0.45, length: [4, 12], opacity: 0.1, color: 0xa99778 },
  ash: { density: 0.0011, speed: 0.07, length: [2, 5], opacity: 0.18, color: 0x787674 },
};
const STREAK_SCALE = 0.35; // moving streaks are longer-lived than painted strokes
const PROFILE_STRENGTH: Readonly<Record<BiomeProfileWeatherV1, WorldLifeStrengthV1>> = {
  'still': 'still', 'calm': 'still', 'glow-calm': 'still', 'still-cold': 'still', 'lightless': 'still', 'airless': 'still', 'still-heat': 'still', 'pastel-cloud': 'still',
  'mild': 'mild', 'humid': 'mild', 'mist': 'mild', 'dry': 'mild', 'dry-heat': 'mild', 'mirage-heat': 'mild', 'steam-cold': 'mild', 'heat-shimmer': 'mild', 'greenhouse': 'mild', 'acid-haze': 'mild', 'ash': 'mild', 'ember-cloud': 'mild',
  'wind': 'wind', 'wind-cold': 'wind', 'swell': 'wind', 'trade-wind': 'wind', 'band-wind': 'wind', 'ember-wind': 'wind',
  'squall': 'storm', 'cyclone': 'storm', 'sulfur-storm': 'storm',
};
const WEATHER_FLOOR: Readonly<Record<Exclude<WorldLifeWeatherV1, null>, WorldLifeStrengthV1>> = { rain: 'mild', snow: 'mild', dust: 'wind', ash: 'mild', haze: 'still' };
const LUMINOUS_BIOMES: ReadonlySet<string> = new Set(['fungal', 'milksea', 'geode']);
const MISTY_PROFILE: ReadonlySet<string> = new Set(['mist', 'humid', 'steam-cold', 'acid-haze', 'glow-calm']);

function isBiomeKey(key: string): key is BiomeProfileKeyV1 { return Object.prototype.hasOwnProperty.call(BIOME_PROFILES_V1, key); }

/** Reads the compiled system card text (the `Light:` and `Atmosphere:` lines the game compiles). */
export function parseWorldLifeCard(card: string): WorldLifeCardV1 {
  if (typeof card !== 'string') throw new WorldLifeRefusal('card-missing', 'system card must be a string');
  const light = [...card.matchAll(/^  Light: (.+)$/gm)], air = [...card.matchAll(/^  Atmosphere: (.+)$/gm)];
  if (light.length !== 1 || air.length !== 1) throw new WorldLifeRefusal('card-ambiguous', `light=${light.length} atmosphere=${air.length}`);
  const tod = (light[0]![1] as string).split(';')[0]!.trim();
  const timeOfDay: WorldLifeTimeOfDayV1 | null = tod === 'day' ? 'day' : tod === 'night' ? 'night' : tod === 'dusk' || tod === 'twilight' ? 'twilight' : null;
  if (!timeOfDay) throw new WorldLifeRefusal('time-of-day-unknown', tod);
  const m = /climate ([^,;]+), weather ([^,;]+), water ([^,;]+)/.exec(air[0]![1] as string);
  if (!m) throw new WorldLifeRefusal('atmosphere-unreadable', air[0]![1] as string);
  const weather = m[2] === 'none' || m[2] === 'null' ? null : (m[2] as string);
  return {
    biome: m[1] as string, weather: weather as WorldLifeWeatherV1, water: m[3] as WorldLifeWaterV1,
    timeOfDay, luminous: /luminous/i.test(card),
  };
}

function checkCard(card: WorldLifeCardV1): Readonly<Required<WorldLifeCardV1>> {
  if (!(card.weather === null || card.weather === 'rain' || card.weather === 'snow' || card.weather === 'dust' || card.weather === 'ash' || card.weather === 'haze')) throw new WorldLifeRefusal('weather-unknown', String(card.weather));
  if (!(card.water === 'liquid' || card.water === 'frozen' || card.water === 'none')) throw new WorldLifeRefusal('water-unknown', String(card.water));
  if (!(card.timeOfDay in ILLUMINATION)) throw new WorldLifeRefusal('time-of-day-unknown', String(card.timeOfDay));
  if (!isBiomeKey(card.biome)) throw new WorldLifeRefusal('biome-unknown', String(card.biome));
  const profile = BIOME_PROFILES_V1[card.biome];
  let strength: WorldLifeStrengthV1 | undefined = card.strength;
  if (strength === undefined) {
    const base = PROFILE_STRENGTH[profile.weather];
    if (!base) throw new WorldLifeRefusal('profile-weather-unmapped', profile.weather);
    const floor = card.weather === null ? 'still' : WEATHER_FLOOR[card.weather];
    strength = STRENGTHS[Math.max(STRENGTHS.indexOf(base), STRENGTHS.indexOf(floor))]!;
  } else if (!STRENGTHS.includes(strength)) throw new WorldLifeRefusal('strength-unknown', String(strength));
  return { biome: card.biome, weather: card.weather, water: card.water, timeOfDay: card.timeOfDay, luminous: card.luminous === true, strength };
}

export function compileWorldLife(
  input: string | WorldLifeCardV1, seed: number, surface: WorldLifeSurfaceV1, options: Readonly<{ tier?: WorldLifeTierV1 }> = {},
): WorldLifeSpecV1 {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new WorldLifeRefusal('seed-invalid', String(seed));
  if (surface !== 'landfall' && surface !== 'arena') throw new WorldLifeRefusal('surface-unknown', String(surface));
  const tier = options.tier ?? 'desktop';
  if (tier !== 'desktop' && tier !== 'phone') throw new WorldLifeRefusal('tier-unknown', String(tier));
  const card = checkCard(typeof input === 'string' ? parseWorldLifeCard(input) : input);
  const profile = BIOME_PROFILES_V1[card.biome as BiomeProfileKeyV1];
  const { strength } = card;
  const surfaceFactor = surface === 'arena' ? WORLD_LIFE_ARENA_DENSITY : 1;
  const illumination = ILLUMINATION[card.timeOfDay];
  const frame = WORLD_LIFE_FRAME, area = frame.width * frame.height;
  const streakCap = WORLD_LIFE_STREAK_CAP[tier];
  const rng = (salt: number) => mulberry32((seed ^ salt) >>> 0);

  let precipitation: WorldLifePrecipitationV1 | null = null;
  if (card.weather !== null && card.weather !== 'haze') {
    const kind = card.weather, base = PRECIP[kind], r = rng(0x57585452);
    const density = base.density * DENSITY_FACTOR[strength] * surfaceFactor;
    const requestedCount = Math.round(area * density * STREAK_SCALE);
    const count = Math.min(requestedCount, streakCap);
    const lean = r() < 0.5 ? -1 : 1;
    const angle = lean * (kind === 'rain' ? RAIN_ANGLE[strength] : kind === 'dust' ? 1.1 : kind === 'snow' ? 0.5 * RAIN_ANGLE[strength] : 0.05);
    const field: number[] = [];
    for (let i = 0; i < count; i++) field.push(r(), r(), r(), r());
    precipitation = {
      kind, density, requestedCount, count, overBudget: requestedCount > count, angle,
      speed: base.speed * (kind === 'rain' ? 1 + 0.25 * STRENGTHS.indexOf(strength) : 1),
      length: [base.length[0] / frame.height, base.length[1] / frame.height], opacity: base.opacity * illumination, color: base.color, field,
    };
  }

  const dr = rng(0x44524946);
  const driftBase = card.weather === 'haze' ? 14 : card.weather === 'dust' ? 10 : card.weather === 'ash' ? 9 : card.weather === 'rain' ? 8
    : card.weather === 'snow' ? 6 : MISTY_PROFILE.has(profile.weather) ? 6 : 3;
  const driftCount = Math.round(driftBase * surfaceFactor);
  const driftSide = (card.weather === 'dust' || card.weather === 'ash' ? 0.03 : 0.012) * DRIFT_SPEED_FACTOR[strength] * (dr() < 0.5 ? -1 : 1);
  const blobs: (readonly [number, number, number, number])[] = [];
  for (let i = 0; i < driftCount; i++) blobs.push([dr(), 0.45 + dr() * 0.5, 0.12 + dr() * 0.14, dr()]);
  const drift: WorldLifeDriftV1 = {
    count: driftCount, speedX: driftSide, speedY: card.weather === 'ash' ? 0.004 : -0.002,
    opacity: (card.weather === 'haze' ? 0.22 : card.weather === 'dust' ? 0.18 : card.weather === 'ash' ? 0.16 : 0.12) * (0.7 + 0.3 * illumination),
    color: card.weather === 'dust' ? 0xa99778 : card.weather === 'ash' ? 0x787674 : 0xc8d4de, blobs,
  };

  let shimmer: WorldLifeShimmerV1 | null = null;
  if (card.water === 'liquid') {
    const sr = rng(0x53484d52);
    shimmer = { rippleFrequencyHz: [0.35, 0.55, 0.9, 1.3][STRENGTHS.indexOf(strength)]!, amplitude: [0.04, 0.07, 0.12, 0.18][STRENGTHS.indexOf(strength)]!, phases: [sr(), sr(), sr()] };
  }

  const wr = rng(0x53574159), band = SWAY_BAND[strength], bands: WorldLifeSwayBandV1[] = [];
  if (profile.flora.length > 0) for (const b of [0, 1, 2] as const) {
    bands.push({ band: b, frequencyHz: band[0] + wr() * (band[1] - band[0]), phase: wr(), amplitude: SWAY_AMPLITUDE[strength] * [1, 0.8, 0.5][b]! });
  }

  let fliers: WorldLifeFliersV1 | null = null;
  const bird = profile.fauna.includes('bird'), swim = (profile.fauna.includes('marine') || profile.fauna.includes('fish')) && card.water === 'liquid';
  if (bird || swim) {
    const fr = rng(0x464c4945), kind = bird ? 'bird' : 'swimmer', count = Math.floor(fr() * 4), paths: WorldLifeFlierPathV1[] = [];
    for (let i = 0; i < count; i++) {
      paths.push({
        x0: fr(), y0: kind === 'bird' ? 0.12 + fr() * 0.33 : frame.groundLine + 0.03 + fr() * 0.12, direction: fr() < 0.5 ? -1 : 1,
        speed: kind === 'bird' ? 0.018 + fr() * 0.022 : 0.008 + fr() * 0.01, bob: 0.005 + fr() * 0.009, bobHz: 0.4 + fr() * 0.5, phase: fr(),
      });
    }
    fliers = { kind, count, paths };
  }

  let flicker: WorldLifeFlickerV1 | null = null;
  if (LUMINOUS_BIOMES.has(card.biome) || card.luminous) {
    const lr = rng(0x464c4b52), lights: (readonly [number, number, number, number])[] = [];
    for (let i = 0, n = surface === 'arena' ? 4 : 6; i < n; i++) lights.push([lr(), 0.55 + lr() * 0.4, 0.8 + lr() * 1.4, lr()]);
    flicker = { base: 0.55, lights };
  }

  return Object.freeze({
    schema: WORLD_LIFE_SPEC_SCHEMA_V1, seed, surface, tier, card, illumination, frame, precipitation, drift, shimmer,
    sway: { amplitude: SWAY_AMPLITUDE[strength], frequencyBand: band, bands }, fliers, flicker, budget: { streakCap },
  });
}
