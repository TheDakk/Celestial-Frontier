import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RENDERER_VERSION } from '@cf/art-recipe';
import { testCatalogue } from '@cf/art-testparts';
import { buildReport, type ArtFixture } from '../src/report';

const fixture: ArtFixture = JSON.parse(readFileSync(new URL('../../../fixtures/art/quadruped-v1.json', import.meta.url), 'utf8'));
const catalogue = testCatalogue();
const copy = (): ArtFixture => structuredClone(fixture);

describe('diagnostics report', () => {
  it('matches every one of the 528 recorded entries', () => {
    const report = buildReport(catalogue, fixture);
    expect(report.total).toBe(528);
    expect(report.matched).toBe(528);
    expect(report.mismatches).toEqual([]);
    expect(report.rendererVersion).toBe(RENDERER_VERSION);
  });

  it('reports exactly one mismatch, with the same gaps, when one hash is altered', () => {
    const altered = copy();
    const original = altered.entries[7]!.hash;
    altered.entries[7]!.hash = original === '00000000' ? '00000001' : '00000000';
    const report = buildReport(catalogue, altered);
    expect(report.matched).toBe(527);
    expect(report.mismatches).toEqual([
      { index: 7, label: altered.entries[7]!.label, expected: altered.entries[7]!.hash, actual: original, gapsDiffer: false },
    ]);
  });

  it('reports exactly one mismatch, flagged as a gaps difference, when one gaps array is altered', () => {
    const altered = copy();
    altered.entries[11]!.gaps = [...altered.entries[11]!.gaps, 'invented-gap'];
    const report = buildReport(catalogue, altered);
    expect(report.matched).toBe(527);
    expect(report.mismatches).toHaveLength(1);
    expect(report.mismatches[0]!.index).toBe(11);
    expect(report.mismatches[0]!.gapsDiffer).toBe(true);
    expect(report.mismatches[0]!.expected).toBe(report.mismatches[0]!.actual);
  });

  it('does not mutate the fixture it is given', () => {
    const before = JSON.stringify(fixture);
    buildReport(catalogue, fixture);
    expect(JSON.stringify(fixture)).toBe(before);
  });

  it('reports every entry when every recorded hash is wrong, and nothing for an empty fixture', () => {
    const wrong = copy();
    wrong.entries = wrong.entries.slice(0, 3).map((e) => ({ ...e, hash: 'ffffffff' }));
    const report = buildReport(catalogue, wrong);
    expect(report.total).toBe(3);
    expect(report.matched).toBe(0);
    expect(report.mismatches.map((m) => m.index)).toEqual([0, 1, 2]);

    const empty = buildReport(catalogue, { ...copy(), entries: [] });
    expect(empty).toEqual({ rendererVersion: RENDERER_VERSION, total: 0, matched: 0, mismatches: [] });
  });
});
