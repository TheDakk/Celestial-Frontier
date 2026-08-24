/* MAIN-2/3 — one canonical world roster, one bounded presentation window.

   The eight-row Planetside strip is a UI budget, never a data authority.
   Capture, biosphere yield, distant ecology, and future ownership actions must
   target `all`; only the current thumbnail strip consumes `preview`. */
import { biosphere, planetSpecies } from '@cf/domain-ecology';
import { _earthNamePass } from '@cf/domain-descriptors';
import { mulberry32 } from '@cf/domain-rand';
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import {
  getProvenPlanetKey,
  isCanonicalCF1Address,
  systemScene,
  type CanonicalCF1WorldAddress,
  type CF1WorldKey,
} from '@cf/scene';

export const PLANETSIDE_PREVIEW_LIMIT = 8;
export const CANONICAL_BIOSPHERE_KEYS = Object.freeze([
  'earth',
  'none',
  'complex',
  'flora',
  'aquatic',
  'sparse',
  'microbial',
  'subsurface',
  'aerial',
  'xfauna',
] as const);
export type CanonicalBiosphereKey = (typeof CANONICAL_BIOSPHERE_KEYS)[number];

const CANONICAL_BIOSPHERE_KEY_SET: ReadonlySet<string> = new Set(CANONICAL_BIOSPHERE_KEYS);

export interface WorldRosterView<T> {
  readonly all: readonly T[];
  readonly preview: readonly T[];
  readonly total: number;
  readonly hiddenFromPreview: number;
}

export interface CanonicalWorldRoster {
  readonly address: CanonicalCF1WorldAddress;
  readonly worldKey: CF1WorldKey;
  readonly starSeed: number;
  readonly planetSeed: number;
  readonly planetOrdinal: number;
  readonly biosphereKey: CanonicalBiosphereKey;
  readonly view: WorldRosterView<Readonly<Record<string, unknown>>>;
}

export type CanonicalWorldRosterResult =
  | { readonly ok: true; readonly roster: CanonicalWorldRoster }
  | {
      readonly ok: false;
      readonly reason: 'unproven-address' | 'address-mismatch' | 'source-error';
      readonly message: string;
    };

export interface WorldRosterSources {
  readonly systemFor: (starSeed: number) => Record<string, unknown>;
  readonly climateBand: (
    planet: Record<string, unknown>,
    system: Record<string, unknown>,
    orbit: number,
  ) => string;
  readonly biosphere: (
    planet: { seed: number; type?: string },
    system: { sol?: boolean } | null | undefined,
    band: string,
    random: () => number,
  ) => { key: string };
  readonly planetSpecies: (
    planet: { seed: number },
    system: unknown,
    band: string,
    level: string | number,
  ) => Array<Record<string, unknown>>;
  readonly nameEarth: (rows: Array<Record<string, unknown>>) => void;
}

const SOURCES: WorldRosterSources = Object.freeze({
  systemFor: systemFor as unknown as WorldRosterSources['systemFor'],
  climateBand: climateBand as unknown as WorldRosterSources['climateBand'],
  biosphere: biosphere as unknown as WorldRosterSources['biosphere'],
  planetSpecies: planetSpecies as unknown as WorldRosterSources['planetSpecies'],
  nameEarth: _earthNamePass,
});

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function rosterFailure(
  reason: 'unproven-address' | 'address-mismatch' | 'source-error',
  message: string,
): CanonicalWorldRosterResult {
  return Object.freeze({ ok: false, reason, message });
}

function canonicalBiosphereKey(key: string, planetSeed: number): CanonicalBiosphereKey {
  if (!CANONICAL_BIOSPHERE_KEY_SET.has(key)) {
    throw new TypeError(`biosphere source returned unsupported key ${JSON.stringify(key)}`);
  }
  if (planetSeed === 133 && key !== 'earth') {
    throw new TypeError('planet seed 133 requires biosphere key "earth"');
  }
  if (planetSeed !== 133 && key === 'earth') {
    throw new TypeError('biosphere key "earth" is only valid for planet seed 133');
  }
  return key as CanonicalBiosphereKey;
}

function freezeDetachedRow(row: Record<string, unknown>): Readonly<Record<string, unknown>> {
  const freeze = (value: unknown): void => {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return;
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
    Object.freeze(value);
  };
  freeze(row);
  return row;
}

function buildRoster(
  candidate: unknown,
  sources: WorldRosterSources,
): CanonicalWorldRosterResult {
  if (!isCanonicalCF1Address(candidate) || !('planet' in candidate)
    || candidate.key !== getProvenPlanetKey(candidate.planet)) {
    return rosterFailure('unproven-address', 'world roster requires a proven canonical CF1 world address');
  }
  const address: CanonicalCF1WorldAddress = candidate;
  try {
    const system = sources.systemFor(address.star.seed);
    if (!system || typeof system !== 'object' || Array.isArray(system)
      || !Array.isArray(system.planets)) {
      throw new TypeError('system source returned a malformed system');
    }
    const scene = systemScene(address.star.seed, () => system);
    const planet = scene.planets.find((node) => node.ordinal === address.planet.ordinal);
    if (!planet || planet.seed !== address.planet.seed) {
      return rosterFailure(
        'address-mismatch',
        `canonical world ${address.key} does not match its source planet ordinal`,
      );
    }
    const random = mulberry32((planet.seed ^ 0x1234567) >>> 0);
    const band = sources.climateBand(planet.P, system, planet.orb);
    const bio = sources.biosphere(
      planet.P as { seed: number; type?: string },
      system as { sol?: boolean },
      band,
      random,
    );
    if (!bio || typeof bio.key !== 'string' || !bio.key) {
      throw new TypeError('biosphere source returned a malformed key');
    }
    const biosphereKey = canonicalBiosphereKey(bio.key, planet.seed);
    let rows: Array<Record<string, unknown>> = [];
    if (biosphereKey !== 'none') {
      const speciesLevel = biosphereKey === 'earth' ? 'complex' : biosphereKey;
      const produced = sources.planetSpecies(planet.P as { seed: number }, system, band, speciesLevel);
      if (!Array.isArray(produced)) {
        throw new TypeError(`species source returned a malformed roster for biosphere key "${biosphereKey}"`);
      }
      if (produced.length === 0) {
        throw new TypeError(`biosphere key "${biosphereKey}" returned an empty inhabited roster`);
      }
      rows = produced.map((row) => structuredClone(row));
      if (biosphereKey === 'earth') sources.nameEarth(rows);
    }
    const frozenRows = rows.map(freezeDetachedRow);
    return Object.freeze({
      ok: true,
      roster: Object.freeze({
        address,
        worldKey: address.key,
        starSeed: address.star.seed,
        planetSeed: planet.seed,
        planetOrdinal: planet.ordinal,
        biosphereKey,
        view: worldRosterView(frozenRows),
      }),
    });
  } catch (error) {
    return rosterFailure('source-error', messageOf(error));
  }
}

export function canonicalWorldRoster(
  address: CanonicalCF1WorldAddress,
): CanonicalWorldRosterResult {
  return buildRoster(address, SOURCES);
}

/** Diagnostic seam used only to prove source failure and roster ownership. */
export function canonicalWorldRosterForDiagnostics(
  address: unknown,
  sources: WorldRosterSources,
): CanonicalWorldRosterResult {
  return buildRoster(address, sources);
}

export function worldRosterView<T>(rows: readonly T[]): WorldRosterView<T> {
  if (!Array.isArray(rows)) throw new TypeError('world roster must be an array');
  const all = Object.freeze([...rows]);
  const preview = Object.freeze(all.slice(0, PLANETSIDE_PREVIEW_LIMIT));
  return Object.freeze({
    all,
    preview,
    total: all.length,
    hiddenFromPreview: Math.max(0, all.length - preview.length),
  });
}
