import { expect } from 'vitest';
import { planetSpecies } from '@cf/domain-ecology';
import { _earthNamePass } from '@cf/domain-descriptors';
import { makeGenome } from '@cf/domain-genome';
import { evolveGenome } from '@cf/domain-genetics';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene, type CanonicalCF1WorldAddress } from '@cf/scene';

// Shared by the world roster tests. Ported from SOURCE tests/world-roster.test.ts:32-127.
export const HOME_GALAXY = { seed: 999, x: 90, y: -60 };
export const SOL = { seed: 424242, x: 560, y: 170 };
export const FOREIGN_GALAXY = { seed: 394332036, x: -300.95, y: 175.47 };
export const FOREIGN_STAR = { seed: 676840317, x: 27.3, y: -24.6 };

export function addressOf(
  galaxy: { seed: number; x: number; y: number },
  star: { seed: number; x: number; y: number },
  planetSeed: number,
): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress({ galaxy, star, planet: { seed: planetSeed } });
  expect(resolved.ok).toBe(true);
  if (!resolved.ok) throw new Error(`world fixture did not prove: ${resolved.reason}`);
  return resolved.address;
}

export const AMBIENT_EPOCH_KEY = 'COSMIC_EPOCH';

function withLegacyEpoch<T>(epoch: number, action: () => T): T {
  const previous = Reflect.getOwnPropertyDescriptor(globalThis, AMBIENT_EPOCH_KEY);
  if (!Reflect.defineProperty(globalThis, AMBIENT_EPOCH_KEY, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: epoch,
  })) throw new Error('could not install legacy Earth-roster oracle');
  try {
    return action();
  } finally {
    if (previous) Reflect.defineProperty(globalThis, AMBIENT_EPOCH_KEY, previous);
    else Reflect.deleteProperty(globalThis, AMBIENT_EPOCH_KEY);
  }
}

function legacyEarthVagrants(ecologyEpoch: number): Array<Record<string, unknown>> {
  const random = mulberry32(hashInt(133, ecologyEpoch, 0x7A9E) >>> 0);
  const count = ecologyEpoch > 0 ? 1 + (random() < 0.5 ? 1 : 0) : 0;
  const vagrants: Array<Record<string, unknown>> = [];
  for (let index = 0; index < count; index++) {
    const kingdom = random() < 0.7 ? 'fauna' : 'flora';
    const genome = evolveGenome(makeGenome(
      hashInt(133, ecologyEpoch * 163 + index + 1, 0xEA271) >>> 0,
      kingdom,
      1,
    ), 0);
    genome._cradle = 1;
    genome._rare = 1;
    vagrants.push(genome);
  }
  _earthNamePass(vagrants);
  return vagrants;
}

export function legacyEarthRosterOracle(ecologyEpoch: number): Array<Record<string, unknown>> {
  const system = systemFor(SOL.seed);
  const earth = systemScene(SOL.seed).planets.find((planet) => planet.seed === 133);
  if (!earth) throw new Error('legacy Earth oracle could not find Earth');
  const band = climateBand(earth.P, system, earth.orb);
  const starters = withLegacyEpoch(ecologyEpoch, () => structuredClone(
    planetSpecies(earth.P as { seed: number }, system, band, 'complex'),
  )) as Array<Record<string, unknown>>;
  _earthNamePass(starters);
  const rows = starters.concat(legacyEarthVagrants(ecologyEpoch));
  for (const row of rows) row._cradle = 1;
  return rows;
}

function canonicalFingerprintValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (Array.isArray(value)) return `[${value.map(canonicalFingerprintValue).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalFingerprintValue(record[key])}`).join(',')}}`;
}

export function independentFullRosterFingerprint(
  worldKey: string,
  ecologyEpoch: number,
  rows: readonly Readonly<Record<string, unknown>>[],
): string {
  const canonical = canonicalFingerprintValue([worldKey, ecologyEpoch, rows]);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index++) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `cwr1:${rows.length}:${canonical.length}:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
