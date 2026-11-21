import { describe, expect, it } from 'vitest';
import { EYE_COUNTS, LIMB_COUNTS } from '@cf/art-format';
import { resolveAnatomy, wrap } from '../src/resolve';

const base = { kingdom: 'fauna', body: 0, loco: 0, head: 3, tail: 6, pattern: 7, skin: 7, limbs: 3, eyes: 1, size: 5, color: 13, accent: 2, lumin: true };

describe('resolveAnatomy', () => {
  it('resolves a full fauna genome at Guardian size', () => {
    expect(resolveAnatomy(base, { guardian: true })).toEqual({ kingdom: 'fauna', family: 'quadruped', torso: 'sturdy', tier: 'guardian', head: 3, tail: 6, pattern: 7, skin: 7, limbs: 8, eyes: 4, colour: 13, accent: 2, glow: true, swimmer: false, form: 0 });
  });
  it.each([[0, 'quadruped', 'sturdy'], [1, 'quadruped', 'armored'], [2, 'quadruped', 'stilt'], [3, 'tentacled', ''], [4, 'serpent', ''], [5, 'myriapod', ''], [6, 'gastropod', ''], [7, 'membranous', ''], [8, 'crystalline', ''], [9, 'gelatinous', ''], [10, 'quadruped', 'tusked'], [11, 'quadruped', 'horned'], [12, 'arachnid', ''], [13, 'quadruped', 'squat'], [14, 'insect', ''], [15, 'radial', '']])('body %i is %s %s', (body, family, torso) => {
    const a = resolveAnatomy({ ...base, body }); expect([a.family, a.torso]).toEqual([family, torso]);
  });
  it.each([4, 13])('movement %i makes a fish whatever the body', (loco) => {
    for (let body = 0; body < 16; body++) { const a = resolveAnatomy({ ...base, body, loco }); expect([a.family, a.torso, a.swimmer]).toEqual(['fish', '', true]); }
  });
  it('reads limb and eye counts from their tables', () => {
    expect([0, 1, 2, 3, 4, 5].map((v) => resolveAnatomy({ ...base, limbs: v, eyes: v })).map((a) => [a.limbs, a.eyes])).toEqual([[2, 2], [4, 4], [6, 6], [8, 8], [3, 1], [0, 0]]);
  });
  it('maps size genes to tiers unless Guardian is asked for', () => {
    expect([0, 2, 4].map((size) => resolveAnatomy({ ...base, size }).tier)).toEqual(['small', 'medium', 'large']);
  });
  it('glow is true only for lumin true', () => {
    expect([true, 1, 'true', undefined].map((lumin) => resolveAnatomy({ ...base, lumin }).glow)).toEqual([true, false, false, false]);
  });
  it('wraps drifted genes', () => { expect([wrap(-1, 7), wrap(1007, 10), wrap(2.9, 6), wrap('x', 6), wrap(undefined, 6)]).toEqual([6, 7, 2, 0, 0]); });
  it('wraps floor-first, and non-finite numbers give 0', () => {
    expect([wrap(-2, 6), wrap(NaN, 6), wrap(Infinity, 6), wrap(-Infinity, 6), wrap(null, 6)]).toEqual([4, 0, 0, 0, 0]);
  });
  it('never throws on an empty genome', () => { expect(resolveAnatomy({}).family).toBe('quadruped'); });
  it('treats a missing or unknown kingdom as fauna', () => {
    expect(resolveAnatomy({ ...base, kingdom: 'plasma' }).family).toBe('quadruped');
    expect(resolveAnatomy({ ...base, kingdom: undefined }).kingdom).toBe('fauna');
  });
  it.each([['flora', 18], ['fungi', 9], ['microbe', 12]])('%s resolves its own family with form wrapped to %i', (kingdom, size) => {
    const a = resolveAnatomy({ ...base, kingdom, form: size + 2, loco: 4 });
    expect(a).toEqual({ kingdom, family: kingdom, torso: '', tier: 'large', head: 0, tail: 0, pattern: 0, skin: 0, limbs: 0, eyes: 0, colour: 13, accent: 2, glow: true, swimmer: false, form: 2 });
  });
  it('wraps wild genes into range and never throws', () => {
    const wild: unknown[] = [0, 1, 17, 1000003, -1, -999, 2, -7, 3, 2 ** 40, -(2 ** 40), 1e300, -1e300, 2.5, -2.5, 7.9, 'x', '3', undefined, null, NaN, Infinity, -Infinity, true, {}, []];
    const genes = ['kingdom', 'body', 'loco', 'head', 'tail', 'pattern', 'skin', 'limbs', 'eyes', 'size', 'color', 'accent', 'lumin', 'form'];
    const kingdoms = ['fauna', 'flora', 'fungi', 'microbe', 'other', undefined, 3];
    for (let n = 0; n < 200; n++) {
      const genome: Record<string, unknown> = {};
      genes.forEach((gene, i) => { genome[gene] = wild[(n * 7 + i * 11 + (n >> 3)) % wild.length]; });
      genome['kingdom'] = kingdoms[n % kingdoms.length];
      const a = resolveAnatomy(genome, { guardian: n % 5 === 0 });
      const inRange = (v: number, length: number): boolean => Number.isInteger(v) && v >= 0 && v < length;
      expect(['fauna', 'flora', 'fungi', 'microbe']).toContain(a.kingdom);
      expect(['small', 'medium', 'large', 'guardian']).toContain(a.tier);
      expect(typeof a.family).toBe('string');
      expect(typeof a.torso).toBe('string');
      expect(typeof a.glow).toBe('boolean');
      expect(typeof a.swimmer).toBe('boolean');
      expect(inRange(a.head, 10) && inRange(a.tail, 7) && inRange(a.pattern, 8) && inRange(a.skin, 9)).toBe(true);
      expect(inRange(a.colour, 17) && inRange(a.accent, 17) && inRange(a.form, 18)).toBe(true);
      expect(LIMB_COUNTS as readonly number[]).toContain(a.limbs);
      expect(EYE_COUNTS as readonly number[]).toContain(a.eyes);
    }
  });
});
