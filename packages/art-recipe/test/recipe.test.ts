import { describe, expect, it } from 'vitest';
import { DRAW_ORDER, parseCatalogueText, partId } from '@cf/art-format';
import type { Catalogue, SlotName } from '@cf/art-format';
import { buildRecipe, RENDERER_VERSION } from '../src/recipe';
import { artStream, identityKey, pick } from '../src/streams';

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\ncolour 2 eeeeee\ncolour 3 00ff00\ncolour 4 111111\nramp r 1 2 3 4\noutline 0\neye 1\neyeHighlight 2\nglow 3\n';
const partText = (id: string): string => `part ${id}\nframe rest anchor=0,0\n1\n`;
const SCAFFOLD = 'scaffold quadruped/sturdy/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n';

const catalogueOf = (ids: readonly string[]): Catalogue =>
  parseCatalogueText(HEADER + ids.map(partText).join('\n') + '\n' + SCAFFOLD);

const q = (slot: SlotName, kind: string, variant: number): string => partId('quadruped', slot, kind, 'medium', variant);
// A genome that resolves to quadruped/sturdy, medium, head 3, tail 2.
const base = { kingdom: 'fauna', body: 0, loco: 0, size: 2, head: 3, tail: 2, limbs: 0, eyes: 0, color: 3, accent: 5, pattern: 2, lumin: false };

// Every id the base family can need, all variants, up to 8 limbs and 8 eyes.
const fullIds = (): string[] => {
  const ids: string[] = [];
  for (let v = 0; v < 3; v++) { ids.push(q('torso', 'sturdy', v), q('head', 'h3', v)); }
  for (let v = 0; v < 2; v++) { ids.push(q('tail', 't2', v)); }
  for (let v = 0; v < 2; v++) for (let i = 0; i < 1; i++) { ids.push(q('farLimbs', 'leg', v), q('nearLimbs', 'leg', v)); }
  ids.push(q('eyes', 'eye', 0));
  return ids;
};
const full = catalogueOf(fullIds());
const slots = (r: { parts: readonly { slot: SlotName }[] }): SlotName[] => r.parts.map((p) => p.slot);

describe('buildRecipe', () => {
  it('is deeply equal and JSON-plain on repeat calls', () => {
    const a = buildRecipe(base, ['x', 'y'], full);
    const b = buildRecipe(base, ['x', 'y'], full);
    expect(a).toEqual(b);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(a.version).toBe(RENDERER_VERSION);
    expect(a.identity).toBe(identityKey(base, ['x', 'y']));
  });

  it('changing the eyes gene changes only the number of eye parts, never the slots filled elsewhere', () => {
    // The identity covers every gene, so a changed gene reseeds every stream: variant picks may differ.
    // What must hold is that the eye count follows the gene and nothing else about the layout moves.
    const one = buildRecipe({ ...base, eyes: 4 }, [], full);
    const two = buildRecipe({ ...base, eyes: 0 }, [], full);
    expect(one.parts.filter((p) => p.slot === 'eyes')).toHaveLength(1);
    expect(two.parts.filter((p) => p.slot === 'eyes')).toHaveLength(2);
    expect(slots(one).filter((s) => s !== 'eyes')).toEqual(slots(two).filter((s) => s !== 'eyes'));
  });

  it('draws every stream whether or not it is used: removing eye parts from the catalogue leaves all else equal', () => {
    const noEyes = catalogueOf(fullIds().filter((id) => !id.includes('/eyes/')));
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const g = { ...base, seed, eyes: 0 };
      const a = buildRecipe(g, [], full);
      const b = buildRecipe(g, [], noEyes);
      expect(b.parts).toEqual(a.parts.filter((p) => p.slot !== 'eyes'));
      expect(b.shift).toEqual(a.shift);
      expect(b.marking).toEqual(a.marking);
    }
  });

  it('carries the leg count', () => {
    expect(buildRecipe({ ...base, limbs: 0 }, [], full).legs).toBe(2);
    expect(buildRecipe({ ...base, limbs: 3 }, [], full).legs).toBe(8);
    expect(buildRecipe({ ...base, limbs: 5 }, [], full).legs).toBe(0);
    expect(buildRecipe({ kingdom: 'flora', size: 2 }, [], full).legs).toBe(0);
  });

  it('three limbs give one far and two near; none give no limb parts', () => {
    const three = buildRecipe({ ...base, limbs: 4 }, [], full);
    expect(three.parts.filter((p) => p.slot === 'farLimbs').map((p) => p.index)).toEqual([0]);
    expect(three.parts.filter((p) => p.slot === 'nearLimbs').map((p) => p.index)).toEqual([0, 1]);
    const none = buildRecipe({ ...base, limbs: 5 }, [], full);
    expect(slots(none).filter((s) => s === 'farLimbs' || s === 'nearLimbs')).toEqual([]);
  });

  it('shares one limb style across all limbs', () => {
    const r = buildRecipe({ ...base, limbs: 3 }, [], full);
    const variants = new Set(r.parts.filter((p) => p.slot.endsWith('Limbs')).map((p) => p.partId.slice(-2)));
    expect(variants.size).toBe(1);
  });

  it('asks for no eye part and records no eye gap for the eyeless head, whatever the eyes gene', () => {
    for (const eyes of [0, 1, 2, 3, 4]) {
      const r = buildRecipe({ ...base, head: 2, eyes }, [], catalogueOf([]));
      expect(r.gaps.filter((gap) => gap.includes('/eyes/')), `eyes ${eyes}`).toEqual([]);
      expect(slots(buildRecipe({ ...base, head: 2, eyes }, [], full)), `eyes ${eyes}`).not.toContain('eyes');
    }
    expect(slots(buildRecipe({ ...base, head: 3, eyes: 3 }, [], full)).filter((s) => s === 'eyes')).toHaveLength(8);
  });

  it('adds no tail for tail gene 0', () => {
    expect(slots(buildRecipe({ ...base, tail: 0 }, [], full))).not.toContain('tail');
    expect(slots(buildRecipe({ ...base, tail: 7 }, [], full))).not.toContain('tail');
    expect(slots(buildRecipe(base, [], full))).toContain('tail');
  });

  it('orders parts by DRAW_ORDER then index', () => {
    const r = buildRecipe({ ...base, limbs: 3, eyes: 0 }, [], full);
    const keys = r.parts.map((p) => DRAW_ORDER.indexOf(p.slot) * 100 + p.index);
    expect(keys).toEqual([...keys].sort((x, y) => x - y));
    expect(r.parts.every((p) => p.source === 'own')).toBe(true);
  });

  it('falls back to variant 0 with a gap when the picked head variant is missing', () => {
    const ids = fullIds().filter((id) => !id.includes('/head/') || id.endsWith('/v0'));
    const cat = catalogueOf(ids);
    let hit = 0;
    for (let seed = 0; seed < 60 && hit < 2; seed++) {
      const g = { ...base, seed };
      const picked = pick(artStream(identityKey(g, []), 'head-variant', RENDERER_VERSION), 3);
      const r = buildRecipe(g, [], cat);
      const head = r.parts.find((p) => p.slot === 'head')!;
      expect(head.partId).toBe(q('head', 'h3', 0));
      if (picked === 0) expect(r.gaps).toEqual([]);
      else { expect(r.gaps).toEqual([`variant:${q('head', 'h3', picked)}`]); hit++; }
    }
    expect(hit).toBe(2);
  });

  it('omits every part of an empty catalogue with one missing gap per slot', () => {
    const r = buildRecipe({ ...base, limbs: 4, eyes: 4 }, [], catalogueOf([]));
    expect(r.parts).toEqual([]);
    // far0, tail, torso, near0, near1, head, eye0
    expect(r.gaps).toEqual([
      `missing:${q('farLimbs', 'leg', 0)}`, `missing:${q('tail', 't2', 0)}`, `missing:${q('torso', 'sturdy', 0)}`,
      `missing:${q('nearLimbs', 'leg', 0)}`, `missing:${q('nearLimbs', 'leg', 0)}`,
      `missing:${q('head', 'h3', 0)}`, `missing:${q('eyes', 'eye', 0)}`,
    ]);
  });

  it('picks an iris ramp from its own stream', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const g = { ...base, seed };
      const r = buildRecipe(g, [], catalogueOf(fullIds()));
      expect(r.ramps.iris).toBe('iris' + pick(artStream(identityKey(g, []), 'iris', RENDERER_VERSION), 8));
      seen.add(r.ramps.iris);
    }
    expect([...seen].sort()).toEqual(['iris0', 'iris1', 'iris2', 'iris3', 'iris4', 'iris5', 'iris6', 'iris7']);
  });

  it('names scaffold, ramps, marking and glow', () => {
    const g = { ...base, lumin: true };
    const r = buildRecipe(g, [], full);
    expect(r.scaffoldId).toBe('quadruped/sturdy/medium');
    expect(r.ramps).toEqual({ primary: 'c3', accent: 'c5', underside: 'c3-under', iris: `iris${pick(artStream(identityKey(g, []), 'iris', RENDERER_VERSION), 8)}` });
    expect(r.marking.pattern).toBe(2);
    expect(r.glow).toBe(true);
    for (const n of [r.marking.dx, r.marking.dy, ...r.shift.head, ...r.shift.tail]) expect([-1, 0, 1]).toContain(n);
  });

  it('uses the kind body and a body scaffold for a family with no torso type', () => {
    const r = buildRecipe({ ...base, body: 3 }, [], full);
    expect(r.scaffoldId).toBe('tentacled/body/medium');
    expect(r.gaps).toContain(`missing:${partId('tentacled', 'torso', 'body', 'medium', 0)}`);
  });

  it('builds a Guardian or Titan (marked by apex) at the guardian tier, with a guardian scaffold', () => {
    const r = buildRecipe({ ...base, apex: 12 }, [], full);
    expect([r.tier, r.scaffoldId]).toEqual(['guardian', 'quadruped/sturdy/guardian']);
    expect(buildRecipe(base, [], full).tier).toBe('medium');
  });

  it('returns a frozen recipe; mutation cannot reach the next build', () => {
    const r = buildRecipe(base, [], full);
    expect(() => { (r.parts as unknown as { slot: SlotName }[])[0]!.slot = 'glow'; }).toThrow();
    expect(() => { (r.shift.head as unknown as number[])[0] = 9; }).toThrow();
    expect(Object.isFrozen(r) && Object.isFrozen(r.parts) && Object.isFrozen(r.gaps)).toBe(true);
    expect(buildRecipe(base, [], full)).toEqual(r);
  });
});
