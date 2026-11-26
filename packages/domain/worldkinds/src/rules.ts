/* What a new world type is made of: where it comes from (a slice of the legacy game's planets, or a body of its
   own), and the rule set that replaces the legacy rules for it. A type file fills these in; nothing else changes. */
import type { WeatherToken } from '@cf/domain-landing';
import type { LandingFamily } from '@cf/domain-loot';
import type { CensusMoon, CensusSystem } from './census.js';
import type { TypeStream } from './streams.js';
import type { WorldTypeKey } from './switches.js';

/** The legacy game's eight planet types (planetParams, LEGACY 2669-2677). */
export type LegacyType = 'gas' | 'rocky' | 'desert' | 'ice' | 'terran' | 'ocean' | 'venus' | 'lava';

/** A planet's numbers as the legacy game made them. A type is shown a copy it cannot write to. */
export type PlanetNumbers = Readonly<Record<string, unknown>> & {
  readonly seed: number;
  readonly type: string;
  readonly sizeMul?: number;
  readonly hue?: number;
  readonly moons?: number;
};

/** A body that is not one of a system's planets. Its numbers come from streams on its own seed. */
export interface BodyRecord {
  readonly cls: 'dwarf' | 'rogue' | 'moon' | 'partner' | 'trojan' | 'protoplanet' | 'shattered'
    | 'comet' | 'visitor' | 'asteroid' | 'artefact' | 'eccentric';
  readonly seed: number;
  /** The seed of what it belongs to: its star, its planet, or its galaxy. */
  readonly parent: number;
  readonly index: number;
  readonly name: string;
  readonly orb: number | null;
  readonly P: { readonly type: LegacyType; readonly seed: number; readonly sizeMul: number; readonly ring: boolean; readonly moons: number };
}

/** One biome of a type's own set, in the shape of the legacy game's (LEGACY 13221-13281). */
export interface RuleBiome {
  readonly k: string;
  readonly n: string;
  readonly w: number;
  readonly land: number;
  readonly f: string;
}

/** A card row: its label and its text. */
export type RuleCardRow = readonly [label: string, text: string];

/** The rules of a type, where they differ from its parent's. `rulesFor` gives null for the legacy path, untouched. */
export interface WorldRules {
  readonly key: WorldTypeKey;
  readonly label: string;
  /** The type's own biome set, rolled on `biomeStream`; 'parent' keeps the legacy biome; null is no biome. */
  readonly biomes: readonly RuleBiome[] | 'parent' | null;
  readonly biomeStream?: TypeStream;
  readonly landing: {
    readonly delta?: number;
    readonly floor?: number;
    readonly fixed?: { readonly p: number; readonly lo: number; readonly hi: number };
  } | null;
  readonly weather: 'parent' | 'none' | WeatherToken;
  readonly landFamily: LandingFamily;
  readonly hazard: LegacyType;
  readonly life: 'parent' | 'none' | ((v: number, band: string) => string);
  readonly deposits: readonly string[] | 'parent';
  readonly depositCount?: number;
  readonly trickle?: { readonly material: string | 'core'; readonly chance: number; readonly ownsStrike: boolean };
  readonly reserveMul: number;
  readonly tierFixed?: 0;
  readonly card: { readonly rows: readonly RuleCardRow[]; readonly replace: readonly string[] };
}

/** One step of a slice: a planet is of the type when every step passes. */
export interface SliceStep {
  readonly name: string;
  readonly test: (P: PlanetNumbers, band: string, sol: boolean) => boolean;
}

/** What the legacy game made of a system beside its record, handed to a type as facts. A type is given no reader:
    it can ask nothing of a seed of its own choosing. */
export interface SystemFacts {
  /** Each planet's moons, planet by planet in the system's order, as their cards name them (LEGACY 5320-5338). */
  readonly moons: readonly (readonly CensusMoon[])[];
}

/** One count of a type's source rule in a system. */
export interface SourceStep {
  readonly name: string;
  readonly count: (starSeed: number, system: CensusSystem, facts: SystemFacts) => number;
}

export interface WorldTypeDefinition {
  readonly key: WorldTypeKey;
  readonly label: string;
  /** The planets that are of this type, as steps in order; null when the type is not a slice of planets. */
  readonly slice: readonly SliceStep[] | null;
  /** What the design's source rule counts in a system; null when the design gives no rule a system census can count. */
  readonly source: readonly SourceStep[] | null;
  /** The type's bodies in a system, from its own declared streams only; it is shown a copy of the system that
      cannot be written to. null until the type's record is built. */
  readonly bodies: ((starSeed: number, system: CensusSystem) => readonly BodyRecord[]) | null;
  /** The world of a starless sight of the galaxy map; null for every type but the one that makes them. */
  readonly rogue: ((galaxySeed: number, deco: Readonly<Record<string, unknown>>) => BodyRecord | null) | null;
  /** null until the type's rules are built: its worlds play by the legacy rules. */
  readonly rules: WorldRules | null;
}
