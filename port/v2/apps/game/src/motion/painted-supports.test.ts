import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileBodyCard, type ResolvedAnatomyRecord } from './body-card.js';
import { withPaintedContactSupports } from './painted-supports.js';
import { observedContactSupports, createFamilyContactSolver } from '../creature-rig-contact.js';
import type { CreatureRigRecordV1, CreaturePartsBindingV1 } from '../creature-rig-types.js';

/* The shipped Gull fit (battle2-archetypes: contactSupports 'observed'). */
const DIR = new URL('../../../../../../audits/ART_BATTLE_FOCUS_20260925/12-gull/fit-03/', import.meta.url);
const read = <T,>(n: string): T => JSON.parse(readFileSync(new URL(n, DIR), 'utf8')) as T;
const record = read<CreatureRigRecordV1 & ResolvedAnatomyRecord>('record.json'), binding = read<CreaturePartsBindingV1>('binding.json');

describe('withPaintedContactSupports (C71)', () => {
  it('attaches exactly the runtime observed supports, bound to recipe and binding identity', () => {
    const card = compileBodyCard(record), next = withPaintedContactSupports(card, record, binding);
    expect(card.paintedContactSupports).toBeUndefined();
    expect(next.paintedContactSupports?.recipeHash).toBe(record.recipeHash);
    expect(next.paintedContactSupports?.bindingHash).toBe(binding.bindingHash);
    expect(next.paintedContactSupports?.supports).toEqual(observedContactSupports(record, binding));
    /* mixed per-vertex weights are preserved (not collapsed to one rest point) */
    const first = Object.values(next.paintedContactSupports!.supports)[0]!;
    expect(first.vertices.length).toBeGreaterThan(0);
    /* nothing else on the card changes */
    const { paintedContactSupports: _p, ...rest } = next; expect(rest).toEqual(card);
    expect(Object.isFrozen(next)).toBe(true);
  });
  it('the supports construct the same family contact solver the runtime uses', () => {
    const next = withPaintedContactSupports(compileBodyCard(record), record, binding);
    expect(() => createFamilyContactSolver(record, next.paintedContactSupports!.supports)).not.toThrow();
  });
  it('refuses any identity disagreement', () => {
    const card = compileBodyCard(record);
    expect(() => withPaintedContactSupports(card, { ...record, recipeHash: 'x' }, binding)).toThrow(/record recipe/);
    expect(() => withPaintedContactSupports(card, record, { ...binding, recordRecipeHash: 'x' })).toThrow(/binding recipe/);
    expect(() => withPaintedContactSupports({ ...card, recipeHash: null }, record, binding)).toThrow(/no recipe hash/);
    expect(() => withPaintedContactSupports(card, record, { ...binding, bindingHash: '' })).toThrow(/binding identity/);
    const { paintSkin: _s, ...noSkin } = binding;
    expect(() => withPaintedContactSupports(card, record, noSkin as CreaturePartsBindingV1)).toThrow(/painted skin/);
  });
});
