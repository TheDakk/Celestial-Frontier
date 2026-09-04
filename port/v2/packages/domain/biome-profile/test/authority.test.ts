import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BIOME_SETS } from '@cf/domain-strays';
import {
  BIOME_PROFILE_AUTHORITY_V1,
  BIOME_PROFILE_KEYS_V1,
  BIOME_PROFILE_SCHEMA_V1,
  BIOME_PROFILES_V1,
  biomeProfileDigestV1,
  createBiomeProfileAuthorityV1,
  createBiomeProfileSetV1,
  type BiomeProfileV1,
} from '@cf/domain-biome-profile';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..');
const v2Root = path.resolve(packageRoot, '../../..');

function entries(): Array<readonly [string, BiomeProfileV1]> {
  return Object.entries(BIOME_PROFILES_V1);
}

function recursivelyFrozen(value: unknown, seen = new Set<object>()): boolean {
  if (value === null || typeof value !== 'object' || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value)
    && Object.values(value as Record<string, unknown>).every((child) => recursivelyFrozen(child, seen));
}

function liveBiomeKeys(): string[] {
  return Object.values(BIOME_SETS)
    .flatMap((set) => set.map((row) => String(row.k)))
    .sort();
}

function forbiddenBoundaryFindings(source: string): string[] {
  const rules = [
    ['art', /@cf\/art|packages\/art|apps\/game/u],
    ['audio', /@cf\/audio|\b(?:AudioContext|AudioNode|AudioBuffer)\b/u],
    ['DOM', /\b(?:document|window|HTMLElement|HTMLCanvasElement|OffscreenCanvas|navigator)\b/u],
    ['ambient-global', /\b(?:globalThis|process)\b/u],
    ['nondeterminism', /\b(?:Date|performance)\b|Math\.random\s*\(|crypto\.(?:randomUUID|getRandomValues)/u],
  ] as const;
  return rules.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
}

function isThinArtCompatibilitySurface(source: string): boolean {
  return source.match(/from '@cf\/domain-biome-profile'/gu)?.length === 2
    && !/const BIOME_(?:VISUAL_)?PROFILES|AUTHORED_BIOME/u.test(source);
}

describe('canonical BiomeProfileV1 authority', () => {
  it('binds the exact 43 live biome keys to one pinned schema and content digest', () => {
    const live = liveBiomeKeys();
    expect(live).toHaveLength(43);
    expect(new Set(live).size).toBe(43);
    expect([...BIOME_PROFILE_KEYS_V1].sort()).toEqual(live);
    expect(Object.keys(BIOME_PROFILES_V1).sort()).toEqual(live);
    expect(BIOME_PROFILE_AUTHORITY_V1).toEqual({
      schema: BIOME_PROFILE_SCHEMA_V1,
      digest: 'bpd1-6fce883d4d70e3b6bde0fb184b416e8e',
      keys: BIOME_PROFILE_KEYS_V1,
      profiles: BIOME_PROFILES_V1,
    });
    expect(biomeProfileDigestV1(BIOME_PROFILES_V1))
      .toBe(BIOME_PROFILE_AUTHORITY_V1.digest);
  });

  it('changes the digest for a same-key/same-count content substitution and detects stale binding', () => {
    const changedEntries = entries().map(([key, profile]) => key === 'temperate'
      ? [key, { ...profile, sig: '#6f9a53' as const }] as const
      : [key, profile] as const);
    const changed = createBiomeProfileAuthorityV1(changedEntries);

    expect(changed.keys).toEqual(BIOME_PROFILE_KEYS_V1);
    expect(Object.keys(changed.profiles)).toHaveLength(43);
    expect(changed.digest).toMatch(/^bpd1-[0-9a-f]{32}$/u);
    expect(changed.digest).not.toBe(BIOME_PROFILE_AUTHORITY_V1.digest);
    expect(biomeProfileDigestV1(changed.profiles)).toBe(changed.digest);

    const staleBinding = {
      ...BIOME_PROFILE_AUTHORITY_V1,
      profiles: changed.profiles,
    };
    expect(biomeProfileDigestV1(staleBinding.profiles)).not.toBe(staleBinding.digest);

    const reordered = createBiomeProfileAuthorityV1([...entries()].reverse());
    expect(reordered).toEqual(BIOME_PROFILE_AUTHORITY_V1);
    expect(reordered.digest).toBe(BIOME_PROFILE_AUTHORITY_V1.digest);
  });

  it('rejects exact-set mutations instead of accepting count-only coverage', () => {
    const canonical = entries();
    expect(() => createBiomeProfileSetV1([...canonical, canonical[0]!]))
      .toThrow(/duplicate key temperate/u);
    expect(() => createBiomeProfileSetV1(canonical.slice(1)))
      .toThrow(/missing keys temperate/u);
    expect(() => createBiomeProfileSetV1([
      ['replacement', canonical[0]![1]], ...canonical.slice(1),
    ])).toThrow(/unexpected key replacement/u);
    expect(() => createBiomeProfileSetV1([
      ['temperate', { ...canonical[0]![1], audioOnly: true }], ...canonical.slice(1),
    ])).toThrow(/wrong fields/u);
  });

  it('detaches and recursively freezes authority data against source and consumer mutation', () => {
    const mutableEntries = entries().map(([key, profile]) => [key, {
      ...profile,
      fauna: [...profile.fauna],
      flora: [...profile.flora],
    }] as const);
    const built = createBiomeProfileAuthorityV1(mutableEntries);
    (mutableEntries[0]![1].fauna as string[]).push('mutant');
    (mutableEntries[0]![1] as { sig: `#${string}` }).sig = '#000000';

    expect(recursivelyFrozen(built)).toBe(true);
    expect(built.profiles.temperate.sig).toBe('#6f9a52');
    expect(built.profiles.temperate.fauna).toEqual([
      'mammal', 'bird', 'insect', 'amphibian',
    ]);
    expect(() => {
      (built.profiles.temperate.fauna as string[]).push('mutant');
    }).toThrow();
    expect(() => {
      (built.profiles as Record<string, unknown>).temperate = null;
    }).toThrow();
    expect(() => {
      (built.keys as string[]).pop();
    }).toThrow();
  });
});

describe('BiomeProfileV1 package boundaries', () => {
  it('keeps the canonical owner dependency-, browser-, audio-, app-, and RNG-free', () => {
    const source = readFileSync(path.join(packageRoot, 'src', 'index.ts'), 'utf8');
    const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
      name: string;
      dependencies?: Record<string, string>;
    };
    expect(manifest.name).toBe('@cf/domain-biome-profile');
    expect(manifest.dependencies).toBeUndefined();
    expect(source).not.toMatch(/^import\s/mu);
    expect(forbiddenBoundaryFindings(source)).toEqual([]);

    expect(forbiddenBoundaryFindings("import '@cf/art'; new AudioContext()"))
      .toEqual(['art', 'audio']);
    expect(forbiddenBoundaryFindings('document.body; globalThis.state; Math.random()'))
      .toEqual(['DOM', 'ambient-global', 'nondeterminism']);
  });

  it('makes the art subpath a one-way compatibility re-export from the domain owner', () => {
    const artRoot = path.join(v2Root, 'packages', 'art');
    const compatibility = readFileSync(
      path.join(artRoot, 'src', 'biome-visual-profile.ts'),
      'utf8',
    );
    const artManifest = JSON.parse(readFileSync(path.join(artRoot, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
      exports: Record<string, string>;
    };
    expect(artManifest.dependencies['@cf/domain-biome-profile']).toBe('*');
    expect(artManifest.exports['./biome-visual-profile'])
      .toBe('./src/biome-visual-profile.ts');
    expect(isThinArtCompatibilitySurface(compatibility)).toBe(true);

    const disconnected = compatibility.replace(
      "from '@cf/domain-biome-profile'",
      "from './local-biome-table.js'",
    );
    expect(isThinArtCompatibilitySurface(disconnected)).toBe(false);
    const forked = `${compatibility}\nconst BIOME_VISUAL_PROFILES_V1 = {};`;
    expect(isThinArtCompatibilitySurface(forked)).toBe(false);
  });
});
