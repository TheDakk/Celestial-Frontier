import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLOR_TABLE, HUE_JITTER_DEG, IDENTITY_PALETTE, PROPORTION_ENVELOPE, archetypeGenomeV1, genomeFromVisualKey, morphParamsV1 } from './morph-params.js';
const A = 'e493cfa99fa1b658c927b8cf6face727b619f19a5e9e26ce8cfd93875e684a53', B = '7b86007b758640b5caaf149a423b532fcc1941cc1aa8a096a44c8792b99dcedc';
const golden = JSON.parse(readFileSync(new URL('./morph-params.golden.json', import.meta.url), 'utf8')) as { archetypes: string[]; seeds: number; params: unknown[] };
const genomeOf = (seed: number) => ({ seed, color: seed % 17, accent: (seed * 7) % 17, pattern: seed % 8, head: seed % 8, tail: (seed * 3) % 7, lumin: seed % 4 === 0 });
describe('morph params — a pure function of genome + archetype (rule 1)', () => {
  it('no genome, or a genome without visual genes, is the IDENTITY (the archetype exactly as painted)', () => {
    for (const g of [null, undefined, {}, { seed: 9, size: 3, loco: 2 }]) { const p = morphParamsV1(g, A); expect(p.identity).toBe(true); expect(p.base).toBe(IDENTITY_PALETTE); expect(p.accent).toBe(IDENTITY_PALETTE); expect(Object.values(p.proportion).every((v) => v === 1)).toBe(true); expect(p.pattern).toBeNull(); expect(p.clamped).toEqual([]); }
  });
  it('64 seeds × 2 archetypes match the sealed golden fixture byte for byte; the same call twice is identical', () => {
    expect(golden.archetypes).toEqual([A, B]); expect(golden.seeds).toBe(64);
    const out: unknown[] = []; for (const arch of [A, B]) for (let s = 0; s < 64; s++) out.push(morphParamsV1(genomeOf(s), arch));
    expect(JSON.parse(JSON.stringify(out))).toEqual(golden.params);
    expect(JSON.stringify(morphParamsV1(genomeOf(5), A))).toBe(JSON.stringify(morphParamsV1(genomeOf(5), A)));
  });
  it('hue lands inside the colour\'s band (±12°) and chroma follows the table; low-chroma names keep the painting\'s hue (null) and desaturate', () => {
    for (let c = 0; c < COLOR_TABLE.length; c++) for (let s = 0; s < 8; s++) { const p = morphParamsV1({ seed: s, color: c }, A); const t = COLOR_TABLE[c]!;
      if (t.hue === null) { expect(p.base.hue).toBeNull(); expect(p.base.chroma).toBe(t.chroma); } else { const d = Math.abs((((p.base.hue! - t.hue) % 360) + 540) % 360 - 180); expect(d).toBeLessThanOrEqual(HUE_JITTER_DEG + 1e-9); expect(p.base.chroma).toBe(t.chroma); } }
  });
  it('NEGATIVE CONTROL: the same genome on another archetype gives another jitter; a different seed gives another jitter', () => {
    const a = morphParamsV1({ seed: 3, color: 0 }, A), b = morphParamsV1({ seed: 3, color: 0 }, B), c = morphParamsV1({ seed: 4, color: 0 }, A);
    expect(a.base.hue).not.toBe(b.base.hue); expect(a.base.hue).not.toBe(c.base.hue);
  });
  it('proportion stays inside the envelope for every gene value; out-of-table genes are clamped and recorded', () => {
    for (let h = 0; h < 8; h++) for (let t = 0; t < 7; t++) { const p = morphParamsV1({ head: h, tail: t }, A); for (const k of ['head', 'tail', 'ears', 'antennae'] as const) { expect(p.proportion[k]).toBeGreaterThanOrEqual(PROPORTION_ENVELOPE[k][0]); expect(p.proportion[k]).toBeLessThanOrEqual(PROPORTION_ENVELOPE[k][1]); } expect(p.clamped).toEqual([]); }
    const wild = morphParamsV1({ head: 40 }, A); expect(wild.proportion.head).toBe(PROPORTION_ENVELOPE.head[1]); expect(wild.clamped).toEqual([]); // 40 saturates the table at its top: inside the envelope, no clamp
  });
  it('the painting is its own genome: the archetype\'s own genes are the identity; a gene that differs morphs relative to it', () => {
    const arch = { color: 12, accent: 3, head: 0, tail: 1, pattern: 0, lumin: true };
    const same = morphParamsV1({ seed: 5, ...arch }, A, arch); expect(same.identity).toBe(true);
    const col = morphParamsV1({ seed: 5, ...arch, color: 1 }, A, arch); expect(col.identity).toBe(false); expect(col.base.hue).not.toBeNull(); expect(col.accent).toBe(IDENTITY_PALETTE); expect(col.proportion.head).toBe(1); expect(col.lumin).toBe(false);
    expect(morphParamsV1({ seed: 5, ...arch }, A).identity).toBe(false); // without the archetype genome the same genes are a morph (the golden fixture's mode)
  });
  it('the archetype\'s own genome comes from its visual key (the record\'s genome block has no colour genes): the crab is colour 12 / accent 3, and colour 12 on it is the identity', () => {
    const record = JSON.parse(readFileSync(new URL('../../../../../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/record.json', import.meta.url), 'utf8')) as { genome?: Record<string, unknown>; identity: { speciesVisualKey: string } };
    expect(record.genome?.color).toBeUndefined(); const own = archetypeGenomeV1(record); expect(own.color).toBe(12); expect(own.accent).toBe(3); expect(own.pattern).toBe(0); expect(own.lumin).toBe(true);
    expect(morphParamsV1({ seed: 21, color: 12, accent: 4, pattern: 1 }, A, own).base).toBe(IDENTITY_PALETTE); expect(morphParamsV1({ seed: 21, color: 1 }, A, own).base.hue).not.toBeNull();
    expect(genomeFromVisualKey('not json')).toEqual({}); expect(genomeFromVisualKey('["object",[["color",["number","4"]],["lumin",["boolean",true]],["kingdom",["string","fauna"]]]]')).toEqual({ color: 4, lumin: true, kingdom: 'fauna' });
  });
  it('refuses a missing archetype hash', () => { expect(() => morphParamsV1({}, '')).toThrow(/archetype/); });
});
