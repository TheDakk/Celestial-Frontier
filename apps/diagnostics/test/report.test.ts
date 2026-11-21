import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildRecipe, RENDERER_VERSION } from '@cf/art-recipe';
import { testCatalogue } from '@cf/art-testparts';
import { buildReport, verdict, type ArtFixture, type Report } from '../src/report';

const fixture: ArtFixture = JSON.parse(readFileSync(new URL('../../../fixtures/art/quadruped-v1.json', import.meta.url), 'utf8'));
const catalogue = testCatalogue();
const copy = (): ArtFixture => structuredClone(fixture);

describe('diagnostics report', () => {
  it('matches every one of the 614 recorded entries', () => {
    const report = buildReport(catalogue, fixture);
    expect(report.total).toBe(614);
    expect(report.matched).toBe(614);
    expect(report.mismatches).toEqual([]);
    expect(report.rendererVersion).toBe(RENDERER_VERSION);
    expect(report.fixtureVersion).toBe(fixture.rendererVersion);
  });

  it('reports exactly one mismatch, with the same gaps, when one hash is altered', () => {
    const altered = copy();
    const original = altered.entries[7]!.hash;
    altered.entries[7]!.hash = original === '00000000' ? '00000001' : '00000000';
    const report = buildReport(catalogue, altered);
    expect(report.matched).toBe(613);
    expect(report.mismatches).toEqual([
      { index: 7, label: altered.entries[7]!.label, expected: altered.entries[7]!.hash, actual: original, gapsDiffer: false },
    ]);
  });

  it('reports exactly one mismatch, flagged as a gaps difference, when one gaps array is altered', () => {
    const altered = copy();
    altered.entries[11]!.gaps = [...altered.entries[11]!.gaps, 'invented-gap'];
    const report = buildReport(catalogue, altered);
    expect(report.matched).toBe(613);
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
    expect(empty).toEqual({ rendererVersion: RENDERER_VERSION, fixtureVersion: fixture.rendererVersion, total: 0, matched: 0, mismatches: [] });
  });

  it('counts an entry that throws as one mismatch and still reports the others', () => {
    // Entry 0 needs the quadruped fallback; the two entries after it that do not need any fallback are kept.
    const sub = copy();
    const plain = sub.entries.filter((e) => !e.gaps.some((g) => g.startsWith('fallback:'))).slice(0, 2);
    sub.entries = [sub.entries[0]!, ...plain];
    expect(sub.entries[0]!.gaps).toContain('fallback:quadruped');
    expect(sub.entries[1]!.gaps.some((g) => g.startsWith('fallback:'))).toBe(false);
    const tier = buildRecipe(sub.entries[0]!.genome, [], catalogue).tier;
    const without = { ...catalogue, fallbacks: new Map([...catalogue.fallbacks].filter(([key]) => key !== `quadruped/${tier}`)) };
    const report = buildReport(without, sub);
    expect(report.total).toBe(3);
    expect(report.matched).toBe(2);
    expect(report.mismatches).toEqual([
      { index: 0, label: sub.entries[0]!.label, expected: sub.entries[0]!.hash, actual: `error: no fallback for family quadruped at ${tier}`, gapsDiffer: false },
    ]);
    expect(catalogue.fallbacks.has(`quadruped/${tier}`)).toBe(true);
  });
});

describe('diagnostics verdict', () => {
  const good: Report = { rendererVersion: 3, fixtureVersion: 3, total: 5, matched: 5, mismatches: [] };

  it('passes only when something was checked, all matched and the versions agree', () => {
    expect(verdict(good)).toEqual({ ok: true, text: 'PASS 5 / 5' });
  });

  it('fails an empty report instead of passing it', () => {
    expect(verdict({ ...good, total: 0, matched: 0 })).toEqual({ ok: false, text: 'FAIL: nothing to check (0 entries)' });
  });

  it('fails when the fixture was recorded by a different renderer version', () => {
    expect(verdict({ ...good, fixtureVersion: 2 })).toEqual({ ok: false, text: 'FAIL: fixture is renderer version 2, code is version 3' });
  });

  it('fails with the counts when some entries do not match', () => {
    expect(verdict({ ...good, matched: 4 })).toEqual({ ok: false, text: 'FAIL 4 / 5' });
  });

  it('judges the real report as a pass', () => {
    expect(verdict(buildReport(catalogue, fixture))).toEqual({ ok: true, text: 'PASS 614 / 614' });
  });
});
