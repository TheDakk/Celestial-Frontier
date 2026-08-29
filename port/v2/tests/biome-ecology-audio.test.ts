import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { biosphere, planetSpeciesAtEcologyEpoch } from '@cf/domain-ecology';
import { BIOME_PROFILE_AUTHORITY_V1 } from '@cf/domain-biome-profile';
import { _earthNamePass, installCaptureHooks } from '@cf/domain-descriptors';
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress } from '@cf/scene';
import { createCurrentWorldDistantEcologyHintPlan } from '../apps/game/src/biome-ecology-audio.js';
import {
  canonicalWorldRoster,
  canonicalWorldRosterForDiagnostics,
  type WorldRosterSources,
} from '../apps/game/src/world-roster.js';

beforeAll(() => installCaptureHooks());

const HOME = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL = Object.freeze({ seed: 424242, x: 560, y: 170 });

function earthAddress() {
  const result = resolveCF1WorldAddress({ galaxy: HOME, star: SOL, planet: { seed: 133 } });
  if (!result.ok) throw new Error(`Earth address fixture failed: ${result.reason}`);
  return result.address;
}

const SOURCES: WorldRosterSources = Object.freeze({
  systemFor: systemFor as unknown as WorldRosterSources['systemFor'],
  climateBand: climateBand as unknown as WorldRosterSources['climateBand'],
  biosphere: biosphere as unknown as WorldRosterSources['biosphere'],
  planetSpecies: planetSpeciesAtEcologyEpoch as unknown as WorldRosterSources['planetSpecies'],
  nameEarth: _earthNamePass,
});

describe('current-world biome/audio join', () => {
  it('binds deterministic surfaced ecology to the exact canonical environment without mutation', () => {
    const result = canonicalWorldRoster(earthAddress(), 0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const before = JSON.stringify(result.roster);
    const first = createCurrentWorldDistantEcologyHintPlan(result.roster);
    expect(createCurrentWorldDistantEcologyHintPlan(result.roster)).toEqual(first);
    expect(first).toMatchObject({
      canonicalWorldKey: result.roster.worldKey,
      biomeProfileSchema: BIOME_PROFILE_AUTHORITY_V1.schema,
      biomeProfileDigest: BIOME_PROFILE_AUTHORITY_V1.digest,
      biomeProfileKey: result.roster.biomeProfileKey,
      biomeWeather: result.roster.biomeProfile.weather,
      biomeHazard: result.roster.biomeProfile.hazard,
      source: 'survey-roster',
      granularity: 'biosphere',
    });
    expect(first.evidenceKey).toBe(
      `survey-roster:${result.roster.environmentFingerprint}:biosphere:${result.roster.biosphereKey}`,
    );
    expect(JSON.stringify(result.roster)).toBe(before);
    expect(result.roster.view.all).toHaveLength(result.roster.view.total);
  });

  it('rejects alternate-classifier diagnostics and stale structural profile bypasses', () => {
    const address = earthAddress();
    const diagnostic = canonicalWorldRosterForDiagnostics(address, 0, {
      ...SOURCES,
      biomeFor: () => ({ k: 'jungle' }),
    });
    expect(diagnostic.ok).toBe(true);
    if (!diagnostic.ok) return;
    expect(diagnostic.roster.biomeProfileKey).toBe('jungle');
    expect(() => createCurrentWorldDistantEcologyHintPlan(
      diagnostic.roster as never,
    )).toThrow('canonical current-world roster');

    const canonical = canonicalWorldRoster(address, 0);
    expect(canonical.ok).toBe(true);
    if (!canonical.ok) return;
    const staleClone = {
      ...canonical.roster,
      biomeProfileDigest: 'bpd1-stale',
    };
    expect(() => createCurrentWorldDistantEcologyHintPlan(
      staleClone as never,
    )).toThrow('canonical current-world roster');
  });

  it('keeps the raw builder internal and refuses a lifeless world', () => {
    const publicFacade = readFileSync(fileURLToPath(
      new URL('../packages/audio/src/index.ts', import.meta.url),
    ), 'utf8');
    const adapter = readFileSync(fileURLToPath(
      new URL('../apps/game/src/biome-ecology-audio.ts', import.meta.url),
    ), 'utf8');
    const main = readFileSync(fileURLToPath(
      new URL('../apps/game/src/main.ts', import.meta.url),
    ), 'utf8');
    expect(publicFacade).not.toContain('export { createDistantEcologyHintPlan }');
    expect(adapter).toContain("from '@cf/audio/internal/ecology'");
    expect(main).not.toContain('createCurrentWorldDistantEcologyHintPlan');

    const result = resolveCF1WorldAddress({ galaxy: HOME, star: SOL, planet: { seed: 134 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const roster = canonicalWorldRoster(result.address, 0);
    expect(roster.ok).toBe(true);
    if (!roster.ok) return;
    expect(roster.roster.biosphereKey).toBe('none');
    expect(() => createCurrentWorldDistantEcologyHintPlan(roster.roster))
      .toThrow('already-surfaced inhabited biosphere');
  });
});
