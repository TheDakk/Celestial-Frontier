import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadFixture, checkGenerator } from './parity.js';
import { probeRaw } from './baseline.js';
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
});
