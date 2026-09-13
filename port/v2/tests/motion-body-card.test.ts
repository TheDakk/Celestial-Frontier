import { afterEach, describe, expect, it, vi } from 'vitest';
import { FA_LOCO, FA_SIZE, FA_SKIN } from '@cf/domain-speciestraits';
// @ts-expect-error Codex-owned untyped .mjs; imported here only for the GRAPH contract.
import { GRAPH, TEMPLATE } from '../tools/creature-animation/quadruped-template.mjs';
import { compileBodyCard, compileBodyCardOrFallback, LOCO_GAIT, MASS_BY_SIZE_INDEX, materialFromSkinName, MotionCompileError,
  QUADRUPED_GRAPH, QUADRUPED_TEMPLATE, resolveTemplate, isMotionFallback, type ResolvedAnatomyRecord } from '../apps/game/src/motion/index.js';
import { civetRecord, foxRecord, proceduralGenome, proceduralRecord } from '../tools/motion-proof/fixtures.js';

const refusal = (fn: () => unknown): MotionCompileError => {
  try { fn(); } catch (e) { if (e instanceof MotionCompileError) return e; throw e; }
  throw new Error('expected a MotionCompileError');
};
const withLandmark = (r: ResolvedAnatomyRecord, joint: string, xy: [number, number] | null): ResolvedAnatomyRecord => {
  const landmarks: Record<string, readonly number[]> = { ...r.landmarks };
  if (xy) landmarks[joint] = xy; else delete landmarks[joint];
  return { ...r, landmarks };
};

describe('motion templates: contracts with Codex-owned vocabularies', () => {
  it('reproduces the quadruped GRAPH and clip set of quadruped-template.mjs exactly', () => {
    expect(JSON.stringify(QUADRUPED_GRAPH)).toBe(JSON.stringify(GRAPH));
    expect(QUADRUPED_TEMPLATE.clipSetId).toBe(TEMPLATE.clipSetId);
    expect(QUADRUPED_TEMPLATE.joints).toHaveLength(31);
    expect(Object.keys(QUADRUPED_TEMPLATE.limitsDeg).sort()).toEqual([...QUADRUPED_TEMPLATE.joints].sort());
  });
  it('covers every FA_LOCO, FA_SKIN and FA_SIZE entry from the speciestraits package', () => {
    for (const loco of FA_LOCO) expect(LOCO_GAIT[loco], loco).toBeDefined();
    for (const skin of FA_SKIN) expect(materialFromSkinName(skin), skin).not.toBeNull();
    expect(MASS_BY_SIZE_INDEX).toHaveLength(FA_SIZE.length);
  });
  it('labels unknown templates as the whole-portrait fallback', () => {
    // A11/B3: every kit §4 name now has a library; a non-kit name still falls to the labelled fallback.
    const f = resolveTemplate('gastropod');
    expect(isMotionFallback(f) && f.reason).toMatch(/gastropod/);
    expect(isMotionFallback(resolveTemplate('quadruped', 2))).toBe(true);
    expect(isMotionFallback(resolveTemplate('quadruped'))).toBe(false);
  });
});

describe('compileBodyCard', () => {
  afterEach(() => vi.restoreAllMocks());
  it('is deterministic: identical inputs give identical JSON', () => {
    const a = compileBodyCard(civetRecord()), b = compileBodyCard(structuredClone(civetRecord()));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const p = compileBodyCard(proceduralRecord(), proceduralGenome()), q = compileBodyCard(proceduralRecord(), proceduralGenome());
    expect(JSON.stringify(p)).toBe(JSON.stringify(q));
  });
  it('never reads the clock (negative control: the spies throw)', () => {
    const d = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock read'); });
    const p = vi.spyOn(performance, 'now').mockImplementation(() => { throw new Error('clock read'); });
    expect(() => Date.now()).toThrow('clock read'); // the control bites
    expect(() => compileBodyCard(civetRecord())).not.toThrow();
    expect(() => compileBodyCard(proceduralRecord(), proceduralGenome())).not.toThrow();
    expect(d).toHaveBeenCalledTimes(1); expect(p).not.toHaveBeenCalled();
  });
  it('reads the Civet record: small mass, walk/climbers, furred, bite+claw, tail chain lag order', () => {
    const c = compileBodyCard(civetRecord());
    expect(c.template).toEqual({ id: 'quadruped', version: 1, clipSetId: 'quadruped-land-v1' });
    expect(c.massClass).toEqual({ name: 'small', multiplier: 0.85 });
    expect(c.locomotion).toEqual({ loco: 'climbers', gait: 'walk', templateGait: 'walk' });
    expect(c.materials.tail).toBe('furred');
    expect(c.weapons).toEqual(['bite', 'claw']);
    expect(c.parts).toHaveLength(30);
    expect(c.secondaryParts.map((s) => [s.id, s.driver, s.lagOrder])).toEqual([['tail', 'pelvis', [0, 1, 2, 3]], ['earFar', 'head', [0, 1]], ['earNear', 'head', [0, 1]]]);
    expect(c.bounds).toMatchObject({ inside: true, clamped: [] });
    expect(c.luminous).toBe(false); expect(c.realm).toBe('land');
    expect(c.recipeHash).toBe(civetRecord().recipeHash);
    const tail1 = c.parts.find((p) => p.joint === 'tail1');
    expect(tail1?.boneLength).toBeCloseTo(civetRecord().boundsCheck!.boneLengths.tail1!, 12);
  });
  it('reads the fox record from the named table: trot/runners, medium', () => {
    const f = compileBodyCard(foxRecord());
    expect(f.locomotion).toEqual({ loco: 'runners', gait: 'trot', templateGait: 'trot' });
    expect(f.massClass.name).toBe('medium');
  });
  it('reads a procedural genome: size→mass, loco→gait, record material first (genome disagreement noted), head/tail→weapons, lumin', () => {
    const c = compileBodyCard(proceduralRecord(), proceduralGenome());
    expect(c.massClass).toEqual({ name: 'huge', multiplier: 1.40 });
    expect(c.locomotion).toEqual({ loco: 'ambush predators', gait: 'walk', templateGait: 'walk' });
    // CONTRACTS §5: the painter record owns materials; the genome's translucent skin is only a note.
    expect(proceduralRecord().materials?.surface).toBe('fur');
    expect(c.materials.body).toBe('furred');
    expect(c.notes.some((n) => /record surface "fur" wins over genome skin "translucent"/.test(n))).toBe(true);
    expect(c.notes.some((n) => /overrides record surface/.test(n))).toBe(false);
    expect(c.weapons).toEqual(['gore', 'bite', 'sting', 'claw']);
    expect(c.luminous).toBe(true); expect(c.realm).toBe('land');
  });
  it('material owner controls: the genome fills in only when the record omits surface, and says so; agreement leaves no note', () => {
    const { materials: _omit, ...withoutMaterials } = proceduralRecord();
    const fallback = compileBodyCard(withoutMaterials as ResolvedAnatomyRecord, proceduralGenome());
    expect(fallback.materials.body).toBe('translucent');
    expect(fallback.notes.some((n) => /record omits surface; genome skin "translucent" used as fallback/.test(n))).toBe(true);
    // Negative control: without record and without a genome skin the compiler refuses rather than guessing fur.
    expect(refusal(() => compileBodyCard(withoutMaterials as ResolvedAnatomyRecord)).reason).toBe('unsupported-materials');
    // Agreement control: a record whose surface matches the genome's skin carries no materials note at all.
    const agreeing = compileBodyCard({ ...proceduralRecord(), materials: { surface: 'translucent' } }, proceduralGenome());
    expect(agreeing.materials.body).toBe('translucent');
    expect(agreeing.notes.some((n) => /^materials:/.test(n))).toBe(false);
    // Named-species control: the Civet record's fur wins even when a genome skin is supplied.
    const civet = compileBodyCard(civetRecord(), { skin: FA_SKIN.indexOf('translucent') });
    expect(civet.materials.body).toBe('furred');
    expect(civet.notes.some((n) => /record surface .* wins over genome skin "translucent"/.test(n))).toBe(true);
  });
  it('refuses an unsupported template with a labelled fallback', () => {
    const r = { ...civetRecord(), kind: 'gastropod', template: { id: 'gastropod', version: 1 } };
    const e = refusal(() => compileBodyCard(r));
    expect(e.reason).toBe('unsupported-template');
    expect(e.fallback).toMatchObject({ kind: 'whole-portrait', templateId: 'gastropod' });
    expect(compileBodyCardOrFallback(r)).toMatchObject({ kind: 'whole-portrait' });
    expect(refusal(() => compileBodyCard({ ...civetRecord(), kind: 'monotreme' })).reason).toBe('unsupported-template');
  });
  it('refuses missing or malformed landmarks by name', () => {
    expect(refusal(() => compileBodyCard(withLandmark(civetRecord(), 'hindNearPaw', null)))).toMatchObject({ reason: 'missing-landmarks', message: /hindNearPaw/ });
    expect(refusal(() => compileBodyCard(withLandmark(civetRecord(), 'head', [1.4, 0.3]))).reason).toBe('missing-landmarks');
    expect(refusal(() => compileBodyCard({ ...civetRecord(), landmarks: undefined as never })).reason).toBe('missing-landmarks');
  });
  it('clamps and flags a proportion within 15% of its bound, refuses beyond', () => {
    // tail2→tail3 bone: 0.843 is 12.4% over the 0.75 bone cap; 1.088 is 45% over.
    const clamped = compileBodyCard(withLandmark(civetRecord(), 'tail3', [0.95, 0.95]));
    expect(clamped.bounds.inside).toBe(false);
    expect(clamped.bounds.clamped).toEqual([{ id: 'bone-max', measured: expect.closeTo(0.843, 2), clamped: 0.75 }]);
    const e = refusal(() => compileBodyCard(withLandmark(civetRecord(), 'tail3', [1, 0])));
    expect(e.reason).toBe('out-of-bounds'); expect(e.message).toMatch(/bone-max/);
    // Degenerate bone: 0.0009 is 10% under the 0.001 floor (clamped); a zero bone is refused.
    const [x, y] = civetRecord().landmarks.tail2 as [number, number];
    expect(compileBodyCard(withLandmark(civetRecord(), 'tail3', [x + 0.0009, y])).bounds.clamped[0]?.id).toBe('bone-min');
    expect(refusal(() => compileBodyCard(withLandmark(civetRecord(), 'tail3', [x, y]))).reason).toBe('out-of-bounds');
  });
  it('refuses a surface that maps to no kit material', () => {
    expect(refusal(() => compileBodyCard({ ...civetRecord(), materials: { surface: 'plasma' } })).reason).toBe('unsupported-materials');
  });
});
