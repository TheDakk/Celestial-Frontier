import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import {
  abilityOf,
  battleStats,
  decodeLineageCreature,
  encodeLineageCreature,
  normalizeParentSeedTuple,
  normGenome,
  runDuel,
} from '@cf/domain-combatcore';

function child(parents: readonly [number, number] = [11, 22]) {
  return { ...makeGenome(33, 'fauna', 0.5), gen: 2, parents: [...parents], xp: 400, fed: 9, brood: 7, hurt: 2 };
}

describe('D-CFB-1 — ordered parent continuity', () => {
  it('round-trips one normalized ordered parent tuple while stripping mutable state', () => {
    const code = encodeLineageCreature({ name: '  Nova  ', genome: child() });
    const decoded = decodeLineageCreature(code);
    expect(decoded?.name).toBe('Nova');
    expect(decoded?.genome.parents).toEqual([11, 22]);
    expect(decoded?.genome.seed).toBe(33);
    expect(decoded?.genome).not.toHaveProperty('xp');
    expect(decoded?.genome).not.toHaveProperty('fed');
    expect(decoded?.genome).not.toHaveProperty('brood');
    expect(decoded?.genome).not.toHaveProperty('hurt');
  });

  it('keeps reverse-parent identity distinct and stable through repeated encoding', () => {
    const forward = encodeLineageCreature({ name: 'Nova', genome: child([11, 22]) });
    const reverse = encodeLineageCreature({ name: 'Nova', genome: child([22, 11]) });
    expect(reverse).not.toBe(forward);
    expect(decodeLineageCreature(forward)?.genome.parents).toEqual([11, 22]);
    expect(decodeLineageCreature(reverse)?.genome.parents).toEqual([22, 11]);
    expect(encodeLineageCreature(decodeLineageCreature(forward)!)).toBe(forward);
  });

  it('preserves battle stats, ability, and deterministic matchup through each ordered CFB2 round trip', () => {
    const opponent = { name: 'Sentinel', genome: makeGenome(88, 'fauna', 0.72) };
    for (const parents of [[11, 22], [22, 11]] as const) {
      const source = child(parents);
      const normalized = normGenome(source);
      delete normalized.fed;
      delete normalized.brood;
      delete (normalized as Record<string, unknown>).hurt;
      normalized.parents = [...parents];
      const decoded = decodeLineageCreature(encodeLineageCreature({ name: 'Nova', genome: source }));
      expect(decoded).not.toBeNull();
      if (!decoded) continue;
      expect(battleStats(decoded.genome)).toEqual(battleStats(normalized));
      expect(abilityOf(decoded.genome)).toEqual(abilityOf(normalized));
      expect(runDuel({ name: 'Nova', genome: decoded.genome }, opponent))
        .toEqual(runDuel({ name: 'Nova', genome: normalized }, opponent));
    }
  });

  it('keeps ordered lineage identity distinct without inventing a combat-stat difference', () => {
    const forward = decodeLineageCreature(encodeLineageCreature({ name: 'Nova', genome: child([11, 22]) }))!;
    const reverse = decodeLineageCreature(encodeLineageCreature({ name: 'Nova', genome: child([22, 11]) }))!;
    expect(forward.genome.parents).toEqual([11, 22]);
    expect(reverse.genome.parents).toEqual([22, 11]);
    expect(battleStats(forward.genome)).toEqual(battleStats(reverse.genome));
    expect(abilityOf(forward.genome)).toEqual(abilityOf(reverse.genome));
  });

  it('rejects malformed tuples rather than silently inventing lineage', () => {
    for (const value of [[], [1], [1, 2, 3], [-1, 2], [1.5, 2], [1, 0x1_0000_0000], ['1', 2], null]) {
      expect(normalizeParentSeedTuple(value), JSON.stringify(value)).toBeNull();
    }
  });

  it('supports a pure/non-bred creature with an explicit null lineage', () => {
    const genome = makeGenome(44, 'fauna', 0.25);
    const decoded = decodeLineageCreature(encodeLineageCreature({ name: 'Scout', genome }));
    expect(decoded?.genome.parents).toBeUndefined();
  });

  it('rejects legacy, oversized, future-version, and body/witness mismatch carriers', () => {
    expect(decodeLineageCreature('CFB-not-v2')).toBeNull();
    expect(decodeLineageCreature(`CFB2-${'a'.repeat(8_193)}`)).toBeNull();
    const valid = encodeLineageCreature({ name: 'Nova', genome: child() });
    const encoded = valid.slice(5).replace(/-/g, '+').replace(/_/g, '/');
    const raw = Buffer.from(encoded, 'base64').toString('utf8');
    const future = Buffer.from(raw.replace('"v":2', '"v":3')).toString('base64url');
    expect(decodeLineageCreature(`CFB2-${future}`)).toBeNull();
    const mismatch = Buffer.from(raw.replace('"p":[11,22]', '"p":[22,11]')).toString('base64url');
    expect(decodeLineageCreature(`CFB2-${mismatch}`)).toBeNull();
  });
});
