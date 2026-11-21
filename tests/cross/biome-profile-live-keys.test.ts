/* Moved from packages/domain/biome-profile/test/authority.test.ts: it ties the profile keys to the
   live biome sets of @cf/domain-strays, a later package that biome-profile does not depend on.
   biome-profile keeps its own half ('binds the exact 43 profile keys ...'). */
import { describe, expect, it } from 'vitest';
import { BIOME_SETS } from '@cf/domain-strays';
import {
  BIOME_PROFILE_AUTHORITY_V1,
  BIOME_PROFILE_KEYS_V1,
  BIOME_PROFILE_SCHEMA_V1,
  BIOME_PROFILES_V1,
  biomeProfileDigestV1,
} from '@cf/domain-biome-profile';

function liveBiomeKeys(): string[] {
  return Object.values(BIOME_SETS)
    .flatMap((set) => set.map((row) => String(row.k)))
    .sort();
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
});
