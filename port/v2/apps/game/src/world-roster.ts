/* MAIN-2/3 — one canonical world roster, one bounded presentation window.

   The eight-row Planetside strip is a UI budget, never a data authority.
   Capture, biosphere yield, distant ecology, and future ownership actions must
   target `all`; only the current thumbnail strip consumes `preview`. */
import { biosphere, planetSpecies } from '@cf/domain-ecology';
import { _earthNamePass } from '@cf/domain-descriptors';
import { mulberry32 } from '@cf/domain-rand';
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import type { PlanetNode } from '@cf/scene';

export const PLANETSIDE_PREVIEW_LIMIT = 8;

export interface WorldRosterView<T> {
  readonly all: readonly T[];
  readonly preview: readonly T[];
  readonly total: number;
  readonly hiddenFromPreview: number;
}

export interface CanonicalWorldRoster {
  readonly starSeed: number;
  readonly planetSeed: number;
  readonly planetOrdinal: number;
  readonly biosphereKey: string;
  readonly view: WorldRosterView<Readonly<Record<string, unknown>>>;
}

export type CanonicalWorldRosterResult =
  | { readonly ok: true; readonly roster: CanonicalWorldRoster }
  | { readonly ok: false; readonly reason: 'source-error'; readonly message: string };

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
  planet: PlanetNode,
  starSeed: number,
  sources: WorldRosterSources,
): CanonicalWorldRosterResult {
  try {
    if (!Number.isSafeInteger(starSeed) || starSeed < 0 || starSeed > 0xffff_ffff) {
      throw new RangeError('star seed must be a uint32');
    }
    if (!planet || !planet.P || !Number.isSafeInteger(planet.seed)
      || planet.seed < 0 || planet.seed > 0xffff_ffff
      || !Number.isSafeInteger(planet.ordinal) || planet.ordinal < 0) {
      throw new TypeError('planet node identity is malformed');
    }
    const system = sources.systemFor(starSeed);
    if (!system || typeof system !== 'object' || Array.isArray(system)) {
      throw new TypeError('system source returned a malformed system');
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
    let rows: Array<Record<string, unknown>> = [];
    if (planet.seed === 133) {
      rows = sources.planetSpecies(planet.P as { seed: number }, system, band, 'complex')
        .map((row) => structuredClone(row));
      sources.nameEarth(rows);
    } else if (bio.key !== 'none') {
      rows = sources.planetSpecies(planet.P as { seed: number }, system, band, bio.key)
        .map((row) => structuredClone(row));
    }
    const frozenRows = rows.map(freezeDetachedRow);
    return Object.freeze({
      ok: true,
      roster: Object.freeze({
        starSeed,
        planetSeed: planet.seed,
        planetOrdinal: planet.ordinal,
        biosphereKey: bio.key,
        view: worldRosterView(frozenRows),
      }),
    });
  } catch (error) {
    return Object.freeze({ ok: false, reason: 'source-error', message: messageOf(error) });
  }
}

export function canonicalWorldRoster(
  planet: PlanetNode,
  starSeed: number,
): CanonicalWorldRosterResult {
  return buildRoster(planet, starSeed, SOURCES);
}

/** Diagnostic seam used only to prove source failure and roster ownership. */
export function canonicalWorldRosterForDiagnostics(
  planet: PlanetNode,
  starSeed: number,
  sources: WorldRosterSources,
): CanonicalWorldRosterResult {
  return buildRoster(planet, starSeed, sources);
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
