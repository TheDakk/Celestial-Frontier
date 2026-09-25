import { describe, expect, it } from 'vitest';
import { BUDGET, buildTimeline, checkBudget, compileBodyCard, type BodyCard, type BodyPart } from '../apps/game/src/motion/index.js';
import { civetRecord } from '../tools/motion-proof/fixtures.js';

const civet = (): BodyCard => compileBodyCard(civetRecord());
describe('budget guard (kit §8)', () => {
  it('passes a quadruped card and records its counts', () => {
    expect(checkBudget(civet())).toEqual({ ok: true, parts: 31, bones: 30, atlas: 2048 });
    expect(checkBudget(civet(), { tier: 'phone', effect: { phaseTextures: 3, particles: 200 } })).toMatchObject({ ok: true, atlas: 1024 });
    expect(BUDGET.parts).toBe(40); expect(BUDGET.bones).toBe(32);
  });
  it('compiles the reduced variant when over budget: secondary parts drop tip-first, emitter drops, and the card still animates', () => {
    const base = civet();
    const extra: BodyPart[] = Array.from({ length: 6 }, (_, i) => ({ joint: 'plate' + i, parent: 'spine', group: 'body', pivot: [0.5, 0.5], tip: [0.55, 0.5], boneLength: 0.05 }));
    const heavy: BodyCard = { ...base, parts: [...base.parts, ...extra] };
    const r = checkBudget(heavy, { tier: 'phone', effect: { phaseTextures: 5, particles: 900 }, atlasSize: 2048 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.dropped).toEqual(['tail3', 'tail2', 'tail1', 'earFarTip', 'emitter', 'phase-textures>3', 'atlas 2048>1024']);
    expect(r.bones).toBeLessThanOrEqual(BUDGET.bones); expect(r.parts).toBeLessThanOrEqual(BUDGET.parts);
    expect(r.effect).toEqual({ phaseTextures: 3, particles: 0 });
    expect(r.card.secondaryParts.map((s) => [s.id, s.joints.length])).toEqual([['tail', 1], ['earFar', 1], ['earNear', 2]]);
    expect(r.card.notes.at(-1)).toMatch(/^budget: reduced variant/);
    const tl = buildTimeline(r.card, 'melee', 1);
    expect(tl.tracks.tail3).toBeUndefined(); expect(tl.secondary.filter((s) => s.partId === 'tail')).toHaveLength(1);
  });
});
