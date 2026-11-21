import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadFixture, checkGenerator } from './parity.js';
import { loadBaseline, probeRaw } from './baseline.js';
describe('parity helpers', () => {
  it('loads the golden fixture with its generators', () => {
    expect(Object.keys(loadFixture().generators)).toContain('makeGenome_fauna');
  });
  it('reports a mismatch when the generator is wrong (negative control)', () => {
    const r = checkGenerator(loadFixture(), 'makeGenome_fauna', () => ({ wrong: true }));
    expect(r.mismatches.length).toBeGreaterThan(0);
    expect(r.rollupOk).toBe(false);
  });
  it('throws naming the generator when it is absent', () => {
    expect(() => checkGenerator(loadFixture(), 'no_such_generator', () => 0)).toThrow('fixture has no generator no_such_generator');
  });
  it('keeps the baseline fingerprint: exactly 50 probes with unchanged content', () => {
    const fingerprint = loadBaseline();
    expect(Object.keys(fingerprint)).toHaveLength(50);
    expect(createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex')).toBe(
      'c4bac0bc7815d6a64e096708b653e965f08db637993f177e636ef74698362afb',
    );
  });
  it('throws naming the probe when it is absent', () => {
    expect(() => probeRaw('no_such_probe')).toThrow('baseline.json has no probe no_such_probe');
  });
  it('throws naming the file when the fixture is missing or truncated', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-'));
    try {
      const missing = path.join(dir, 'missing-seeds.json');
      expect(() => loadFixture(missing)).toThrow('missing-seeds.json');
      const truncated = path.join(dir, 'truncated-seeds.json');
      const real = fs.readFileSync(new URL('../../fixtures/v1/golden-seeds.json', import.meta.url), 'utf8');
      fs.writeFileSync(truncated, real.slice(0, 1000));
      expect(() => loadFixture(truncated)).toThrow('truncated-seeds.json');
      const empty = path.join(dir, 'empty-seeds.json');
      fs.writeFileSync(empty, '{}');
      expect(() => loadFixture(empty)).toThrow('empty-seeds.json');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  it('throws naming the baseline file when it is missing, truncated or has no fingerprint', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-'));
    try {
      const missing = path.join(dir, 'missing-baseline.json');
      expect(() => loadBaseline(missing)).toThrow(/^cannot load fixture missing-baseline\.json: /);
      const truncated = path.join(dir, 'truncated-baseline.json');
      const real = fs.readFileSync(new URL('../../fixtures/v1/baseline.json', import.meta.url), 'utf8');
      fs.writeFileSync(truncated, real.slice(0, 1000));
      expect(() => loadBaseline(truncated)).toThrow(/^cannot load fixture truncated-baseline\.json: /);
      const empty = path.join(dir, 'empty-baseline.json');
      fs.writeFileSync(empty, '{}');
      expect(() => loadBaseline(empty)).toThrow('fixture empty-baseline.json has no fingerprint');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  it('throws naming the generator when it is emptied or inconsistent with the seeds', () => {
    const fx = loadFixture();
    const g = fx.generators['makeGenome_fauna']!;
    const withGen = (gen: typeof g, seeds = fx.seeds) => ({ ...fx, seeds, generators: { ...fx.generators, makeGenome_fauna: gen } });
    expect(() => checkGenerator(withGen({ ...g, cases: 0, perSeed: [] }), 'makeGenome_fauna', () => 0))
      .toThrow('fixture generator makeGenome_fauna records no cases');
    expect(() => checkGenerator(withGen({ ...g, perSeed: g.perSeed.slice(1) }), 'makeGenome_fauna', () => 0))
      .toThrow(`fixture generator makeGenome_fauna has ${g.cases - 1} per-seed hashes for ${g.cases} cases`);
    expect(() => checkGenerator(withGen(g, fx.seeds.slice(0, g.cases - 1)), 'makeGenome_fauna', () => 0))
      .toThrow(`fixture has ${g.cases - 1} seeds, fewer than the ${g.cases} cases of generator makeGenome_fauna`);
  });
});
