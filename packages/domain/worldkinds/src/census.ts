/* The census: every world's numbers as one line of text, and a fingerprint of many lines.

   One formatter, any reader. The game's readers (sources.ts for seeded worlds; the production snapshot, roster,
   descent policy and card for addressed worlds) and the legacy game's own functions (tools/census.mjs runs LEGACY
   celestial-frontier.html, 1.8.9) are all read through `CensusSources`, so two fingerprints are equal exactly
   when every field of every world is equal.

   A line holds: every key of the planet's parameters but the renderer's caches (LEGACY planetParams 2666-2702, Sol
   3683-3692), its name
   and orbit (4033-4037), climate band (4140-4152), life and civilisation (4944-4977, 5002-5028), biome
   (13282-13292), the mix of landing regions (13294-13322), the odds and damage rung of a first landing
   (13357-13359, 13376-13379, 13421-13434), the raw rarity roll (4240-4260), the designation's tier before and
   after the ring cap (5158-5163, 14685-14747), the deposits, the three veins and the reserve (21260-21275, 21285,
   21308-21316, 21335-21341, 21407-21411), each moon's type and name (5320-5338), whatever more its reader gives,
   and a digest of everything else the system holds: star kind, companions, belt, comets, outer ring, dwarf
   planets, visitor and habitable zone (4018-4075). */
import { hashInt } from '@cf/domain-rand';

export interface CensusPlanet {
  readonly name?: string;
  readonly orb: number;
  readonly P: Readonly<Record<string, unknown>> & { readonly seed: number; readonly type: string };
}

export interface CensusSystem {
  readonly planets: readonly CensusPlanet[];
  readonly [field: string]: unknown;
}

export interface CensusSurvey {
  readonly band: string;
  readonly life: { readonly level: string; readonly key: string };
  readonly civ: {
    readonly civ: boolean;
    readonly wild?: boolean;
    readonly name?: string;
    readonly era?: { readonly key: string };
    readonly year?: number;
    readonly pop?: string;
  };
}

export interface CensusDescent {
  readonly percent: number;
  readonly damageMin: number;
  readonly damageMax: number;
}

export interface CensusVeins {
  /** The designation's tier before the ring cap. */
  readonly rawTier: number;
  /** The tier the veins and the reserve are worked out at. */
  readonly tier: number;
  readonly deposits: readonly string[];
  readonly biomeVein: string | null;
  readonly cosmicVein: string | null;
  readonly exceptionalVein: string | null;
  readonly reserve: number;
}

export interface CensusMoon {
  readonly type: string;
  readonly name: string;
}

/** One landing region and its share of landings. */
export type CensusMixEntry = readonly [key: string, share: number];

/** The readers a census is taken through. Each answers for one world. */
export interface CensusSources {
  system(starSeed: number): CensusSystem;
  survey(planet: CensusPlanet, system: CensusSystem): CensusSurvey;
  /** The biome's key; null when the world has none. */
  biome(planet: CensusPlanet, band: string): string | null;
  /** The landing regions, largest first; null when the type has no biome set. */
  mix(planet: CensusPlanet, band: string): readonly CensusMixEntry[] | null;
  /** A first landing with no storm, no wave-off and no gear. */
  descent(planet: CensusPlanet, system: CensusSystem, band: string): CensusDescent;
  /** The designation's rarity roll, before life, depth and the ring cap. */
  rarity(planet: CensusPlanet): number;
  veins(planet: CensusPlanet, system: CensusSystem, survey: CensusSurvey, biomeKey: string | null): CensusVeins;
  moon(planet: CensusPlanet, index: number): CensusMoon;
  /** More facts of the world, each a name and its value, for a census that reads them. */
  extras?(planet: CensusPlanet, system: CensusSystem, survey: CensusSurvey): readonly (readonly [string, unknown])[];
}

/** One world as the census read it. */
export interface CensusWorld {
  readonly starSeed: number;
  readonly ordinal: number;
  readonly planet: CensusPlanet;
  readonly survey: CensusSurvey;
  readonly biomeKey: string | null;
  readonly mix: readonly CensusMixEntry[] | null;
  readonly descent: CensusDescent;
  readonly rarity: number;
  readonly veins: CensusVeins;
  readonly moons: readonly CensusMoon[];
  readonly row: string;
}

export interface CensusSystemEntry {
  readonly starSeed: number;
  readonly system: CensusSystem;
  /** The line of the system itself: everything it holds beside its planets. */
  readonly row: string;
  /** The worlds counted, in orbit order: all of them, except in the last system of a counted census. */
  readonly worlds: readonly CensusWorld[];
}

export const CENSUS_SOL_SEED = 424242;
export const CENSUS_STREAM = 0xCE5;

/** Sol first, then the seeded systems `hashInt(0xCE5, i, 0)`. */
export function censusStarSeed(index: number): number {
  return index === 0 ? CENSUS_SOL_SEED : hashInt(CENSUS_STREAM, index - 1, 0);
}

/** A value as text, the same for equal values whatever order their keys were written in. Null, a missing value
    and minus zero are each written apart. */
export function stableText(value: unknown): string {
  if (value === null) return '~';
  if (value === undefined) return '?';
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableText).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${key}:${stableText(record[key])}`).join(',')}}`;
  }
  throw new TypeError(`the census cannot write a ${typeof value}`);
}

/** A running 64-bit digest of text, as 16 hex digits. It tells lines apart; it is no secret. */
export class CensusDigest {
  private a = 0x811C9DC5 | 0;
  private b = 0x9E3779B1 | 0;
  private length = 0;

  add(text: string): this {
    let a = this.a;
    let b = this.b;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      a = Math.imul(a ^ c, 0x01000193);
      b = (Math.imul((b << 5 | b >>> 27) ^ c, 0x85EBCA6B) + 0x52DCE729) | 0;
    }
    // A line ends here: "ab" then "c" and "a" then "bc" differ.
    this.a = Math.imul(a ^ 0x1F, 0x01000193);
    this.b = (Math.imul((b << 5 | b >>> 27) ^ 0x1F, 0x85EBCA6B) + 0x52DCE729) | 0;
    this.length += text.length + 1;
    return this;
  }

  hex(): string {
    const mix = (h: number, other: number): string => {
      let x = h ^ Math.imul(other, 0x9E3779B1) ^ this.length;
      x = Math.imul(x ^ x >>> 16, 0x85EBCA6B);
      x = Math.imul(x ^ x >>> 13, 0xC2B2AE35);
      return ((x ^ x >>> 16) >>> 0).toString(16).padStart(8, '0');
    };
    return mix(this.a, this.b) + mix(this.b, this.a);
  }
}

export function censusDigest(text: string): string {
  return new CensusDigest().add(text).hex();
}

function systemRow(starSeed: number, system: CensusSystem): string {
  const { planets, ...rest } = system;
  const list = (field: unknown): number => (Array.isArray(field) ? field.length : 0);
  return [
    `star=${starSeed}`,
    `kind=${stableText(system.kind)}`,
    `planets=${planets.length}`,
    `belt=${system.belt ? stableText((system.belt as { r?: unknown }).r) : '~'}`,
    `dwarfs=${list(system.dwarfs)}`,
    `comets=${list(system.comets)}`,
    `visitor=${system.visitor ? 1 : 0}`,
    `sys=${censusDigest(stableText(rest))}`,
  ].join('|');
}

/** A planet's numbers without what the renderer keeps on them: a key that starts with an underscore is a cache
    (the gas palette `_pal`, LEGACY 2720), written when a world is first drawn and no part of what the world is. */
function numbersOf(P: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(P).filter(([key]) => !key.startsWith('_')));
}

/** A share as text: nine decimals, so the last bit of a power is not in the line. */
const share = (value: number): string => value.toFixed(9);

function worldRow(systemLine: string, world: Omit<CensusWorld, 'row'>, extras: readonly (readonly [string, unknown])[]): string {
  const { planet, survey, descent, veins } = world;
  const civ = survey.civ;
  return [
    `#${world.ordinal}`,
    `P=${stableText(numbersOf(planet.P))}`,
    `name=${stableText(planet.name)}`,
    `orb=${stableText(planet.orb)}`,
    `band=${survey.band}`,
    `life=${survey.life.key}/${stableText(survey.life.level)}`,
    `civ=${stableText([civ.civ, civ.wild, civ.name, civ.era?.key, civ.year, civ.pop])}`,
    `biome=${stableText(world.biomeKey)}`,
    `mix=${world.mix === null ? '~' : world.mix.map(([key, part]) => `${key}:${share(part)}`).join(',')}`,
    `land=${descent.percent}`,
    `damage=${descent.damageMin}-${descent.damageMax}`,
    `roll=${world.rarity}`,
    `tier=${veins.rawTier}/${veins.tier}`,
    `deposits=${veins.deposits.join(',')}`,
    `veins=${stableText([veins.biomeVein, veins.cosmicVein, veins.exceptionalVein])}`,
    `reserve=${veins.reserve}`,
    `moons=${stableText(world.moons.map((moon) => [moon.type, moon.name]))}`,
    ...extras.map(([name, value]) => `${name}=${stableText(value)}`),
    systemLine,
  ].join('|');
}

function readWorld(sources: CensusSources, starSeed: number, system: CensusSystem, ordinal: number, systemLine: string): CensusWorld {
  const planet = system.planets[ordinal];
  if (planet === undefined) throw new RangeError(`star ${starSeed} has no planet ${ordinal}`);
  const survey = sources.survey(planet, system);
  const biomeKey = sources.biome(planet, survey.band);
  const mix = sources.mix(planet, survey.band);
  const descent = sources.descent(planet, system, survey.band);
  const rarity = sources.rarity(planet);
  const veins = sources.veins(planet, system, survey, biomeKey);
  const count = typeof planet.P.moons === 'number' ? planet.P.moons : 0;
  const moons: CensusMoon[] = [];
  for (let m = 0; m < count; m++) moons.push(sources.moon(planet, m));
  const world = { starSeed, ordinal, planet, survey, biomeKey, mix, descent, rarity, veins, moons };
  return { ...world, row: worldRow(systemLine, world, sources.extras?.(planet, system, survey) ?? []) };
}

/** One world of one system, as the census reads it. */
export function censusWorld(sources: CensusSources, starSeed: number, ordinal: number): CensusWorld {
  const system = sources.system(starSeed);
  return readWorld(sources, starSeed, system, ordinal, systemRow(starSeed, system));
}

/** The line of one world: every field the census holds, as text. */
export function censusRow(sources: CensusSources, starSeed: number, ordinal: number): string {
  return censusWorld(sources, starSeed, ordinal).row;
}

/** One system and every world of it. */
export function censusSystem(sources: CensusSources, starSeed: number): CensusSystemEntry {
  const system = sources.system(starSeed);
  const row = systemRow(starSeed, system);
  return { starSeed, system, row, worlds: system.planets.map((_planet, ordinal) => readWorld(sources, starSeed, system, ordinal, row)) };
}

/** The digest of one system: its own line and the line of each of its worlds. */
export function censusSystemDigest(entry: CensusSystemEntry): string {
  const digest = new CensusDigest().add(entry.row);
  for (const world of entry.worlds) digest.add(world.row);
  return digest.hex();
}

/** The census's systems in order, until exactly `planets` worlds are read. A system with no planet is still visited. */
export function* censusSystems(sources: CensusSources, planets: number): Generator<CensusSystemEntry> {
  if (!Number.isInteger(planets) || planets < 1) throw new RangeError('a census counts a whole number of planets, 1 or more');
  let left = planets;
  for (let index = 0; left > 0; index++) {
    const starSeed = censusStarSeed(index);
    const system = sources.system(starSeed);
    const row = systemRow(starSeed, system);
    const worlds: CensusWorld[] = [];
    for (let ordinal = 0; ordinal < system.planets.length && left > 0; ordinal++, left--) {
      worlds.push(readWorld(sources, starSeed, system, ordinal, row));
    }
    yield { starSeed, system, row, worlds };
  }
}

export interface CensusShares {
  readonly systems: number;
  readonly planets: number;
  readonly moons: number;
  readonly ringed: number;
  readonly types: Readonly<Record<string, number>>;
  readonly bands: Readonly<Record<string, number>>;
  readonly starKinds: Readonly<Record<string, number>>;
  readonly systemsWithPlanets: number;
  readonly systemsWithBelt: number;
  readonly systemsWithOuterRing: number;
  readonly systemsWithDwarfs: number;
  readonly dwarfs: number;
  readonly systemsWithComets: number;
  readonly comets: number;
  readonly systemsWithVisitor: number;
}

/** How many of the worlds read hit each entry of each table the census touches. */
export type CensusHits = Readonly<Record<string, Readonly<Record<string, number>>>>;

export interface CensusFingerprint {
  readonly planets: number;
  /** One digest for each thousand worlds, in order; the last may cover fewer. */
  readonly perThousand: readonly string[];
  readonly total: string;
  readonly shares: CensusShares;
  readonly hits: CensusHits;
}

const bump = (counts: Record<string, number>, key: string): void => { counts[key] = (counts[key] ?? 0) + 1; };
const sorted = (counts: Record<string, number>): Record<string, number> =>
  Object.fromEntries(Object.keys(counts).sort().map((key) => [key, counts[key]!]));

/** Counts, table by table, what each world read hit. */
export class CensusHitCounter {
  private readonly tables: Record<string, Record<string, number>> = {};

  private hit(table: string, entry: string): void {
    bump(this.tables[table] ??= {}, entry);
  }

  system(system: CensusSystem): void {
    this.hit('star kind', String(system.kind));
  }

  world(world: CensusWorld): void {
    const { planet, survey, veins } = world;
    const type = planet.P.type;
    this.hit('planet type', type);
    this.hit('climate band', survey.band);
    this.hit('life', survey.life.key);
    this.hit('life of a type in a band', `${type} ${survey.band}: ${survey.life.key}`);
    if (survey.civ.era) this.hit('civilisation era', survey.civ.era.key);
    if (survey.civ.pop !== undefined) this.hit('civilisation population', survey.civ.pop);
    this.hit('biome', `${type}: ${world.biomeKey ?? 'none'}`);
    this.hit('first-landing odds', String(world.descent.percent));
    this.hit('damage rung', `${world.descent.damageMin}-${world.descent.damageMax}`);
    this.hit('rarity roll', String(world.rarity));
    this.hit('tier before the ring cap', String(veins.rawTier));
    this.hit('tier', String(veins.tier));
    // The ring's cap is the tier a cut world is left with (LEGACY 14733-14747).
    if (veins.tier < veins.rawTier) this.hit('a tier the ring cut', `to ${veins.tier}`);
    this.hit('deposit count', String(veins.deposits.length));
    for (const symbol of veins.deposits) this.hit('deposit of a type', `${type}: ${symbol}`);
    if (veins.biomeVein !== null) this.hit('biome vein', veins.biomeVein);
    if (veins.cosmicVein !== null) this.hit('cosmic vein', veins.cosmicVein);
    this.hit('exceptional vein', veins.exceptionalVein === null ? 'none' : 'held');
    for (const moon of world.moons) this.hit('moon type', moon.type);
  }

  hits(): CensusHits {
    return Object.fromEntries(Object.keys(this.tables).sort().map((table) => [table, sorted(this.tables[table]!)]));
  }
}

/** The fingerprint of the first `planets` worlds. The digests of a smaller census are the first digests of a larger
    one, up to its last whole thousand. `visit` sees every system as it is read. */
export function censusFingerprint(
  sources: CensusSources,
  planets: number,
  visit?: (entry: CensusSystemEntry) => void,
): CensusFingerprint {
  const perThousand: string[] = [];
  const types: Record<string, number> = {};
  const bands: Record<string, number> = {};
  const starKinds: Record<string, number> = {};
  const hits = new CensusHitCounter();
  const counts = {
    systems: 0, planets: 0, moons: 0, ringed: 0, systemsWithPlanets: 0, systemsWithBelt: 0, systemsWithOuterRing: 0,
    systemsWithDwarfs: 0, dwarfs: 0, systemsWithComets: 0, comets: 0, systemsWithVisitor: 0,
  };
  let chunk = new CensusDigest();
  let inChunk = 0;
  for (const entry of censusSystems(sources, planets)) {
    const { system } = entry;
    counts.systems++;
    hits.system(system);
    bump(starKinds, String(system.kind));
    if (system.planets.length > 0) counts.systemsWithPlanets++;
    if (system.belt) counts.systemsWithBelt++;
    if (system.kuiper) counts.systemsWithOuterRing++;
    const dwarfs = Array.isArray(system.dwarfs) ? system.dwarfs.length : 0;
    if (dwarfs > 0) counts.systemsWithDwarfs++;
    counts.dwarfs += dwarfs;
    const comets = Array.isArray(system.comets) ? system.comets.length : 0;
    if (comets > 0) counts.systemsWithComets++;
    counts.comets += comets;
    if (system.visitor) counts.systemsWithVisitor++;
    chunk.add(entry.row);
    for (const world of entry.worlds) {
      counts.planets++;
      counts.moons += world.moons.length;
      if (world.planet.P.ring === true) counts.ringed++;
      bump(types, world.planet.P.type);
      bump(bands, world.survey.band);
      hits.world(world);
      chunk.add(world.row);
      if (++inChunk === 1000) {
        perThousand.push(chunk.hex());
        chunk = new CensusDigest();
        inChunk = 0;
      }
    }
    visit?.(entry);
  }
  if (inChunk > 0) perThousand.push(chunk.hex());
  return {
    planets: counts.planets,
    perThousand,
    total: censusDigest(`${counts.planets}:${perThousand.join(',')}`),
    shares: { ...counts, types: sorted(types), bands: sorted(bands), starKinds: sorted(starKinds) },
    hits: hits.hits(),
  };
}
