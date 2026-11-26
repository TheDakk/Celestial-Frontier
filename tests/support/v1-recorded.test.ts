import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadRecorded } from './v1-recorded.js';

const NAMES = [
  'sessionrng',
  'loot-catalogue',
  'acquisition-companion-care',
  'progression-achievements',
  'persistence-training-checkpoint',
  'landing-region',
  'landing-weather',
  'landing-weather-events',
] as const;

/** Runs `check` with a temporary folder holding `files` (name -> text), then removes the folder. */
function withFixtureDir(files: Record<string, string>, check: (dir: string) => void): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v1-recorded-'));
  try {
    for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, `${name}.json`), text);
    check(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('recorded v1 answers', () => {
  it('loads every recorded fixture with its kind, source and cases', () => {
    const kinds = Object.fromEntries(NAMES.map((name) => [name, loadRecorded(name).kind]));
    expect(kinds).toEqual({
      sessionrng: 'outputs',
      'loot-catalogue': 'outputs',
      'acquisition-companion-care': 'outputs',
      'progression-achievements': 'outputs',
      'persistence-training-checkpoint': 'hash',
      'landing-region': 'outputs',
      'landing-weather': 'outputs',
      'landing-weather-events': 'outputs',
    });
    const counts = Object.fromEntries(NAMES.map((name) => [name, loadRecorded(name).cases.length]));
    expect(counts).toEqual({
      sessionrng: 24,
      'loot-catalogue': 62,
      'acquisition-companion-care': 5000,
      'progression-achievements': 96,
      'persistence-training-checkpoint': 3,
      'landing-region': 1646,
      'landing-weather': 258,
      'landing-weather-events': 80,
    });
    for (const name of NAMES) expect(loadRecorded(name).source).toMatch(/^celestial-frontier\.html/);
  });

  it('throws naming the fixture when the file is missing', () => {
    expect(() => loadRecorded('no-such-fixture')).toThrow(/^cannot load recorded v1 fixture no-such-fixture: /);
  });

  it('throws naming the fixture when the file is truncated', () => {
    const real = fs.readFileSync(new URL('../../fixtures/v1/recorded/sessionrng.json', import.meta.url), 'utf8');
    withFixtureDir({ truncated: real.slice(0, 200) }, (dir) => {
      expect(() => loadRecorded('truncated', dir)).toThrow(/^cannot load recorded v1 fixture truncated: /);
    });
  });

  it('throws naming the fixture and the field when a field is missing or of the wrong kind', () => {
    const good = { kind: 'outputs', source: 'celestial-frontier.html', cases: [1] };
    withFixtureDir({
      'no-kind': JSON.stringify({ ...good, kind: undefined }),
      'bad-kind': JSON.stringify({ ...good, kind: 'guess' }),
      'no-source': JSON.stringify({ ...good, source: '' }),
      'no-cases': JSON.stringify({ ...good, cases: undefined }),
      'not-object': '[1]',
      good: JSON.stringify(good),
    }, (dir) => {
      expect(() => loadRecorded('no-kind', dir)).toThrow('cannot load recorded v1 fixture no-kind: kind');
      expect(() => loadRecorded('bad-kind', dir)).toThrow('cannot load recorded v1 fixture bad-kind: kind');
      expect(() => loadRecorded('no-source', dir)).toThrow('cannot load recorded v1 fixture no-source: source');
      expect(() => loadRecorded('no-cases', dir)).toThrow('cannot load recorded v1 fixture no-cases: cases');
      expect(() => loadRecorded('not-object', dir)).toThrow(/^cannot load recorded v1 fixture not-object: /);
      expect(loadRecorded('good', dir)).toEqual(good);
    });
  });

  it('throws when the fixture has no cases', () => {
    withFixtureDir({ empty: JSON.stringify({ kind: 'hash', source: 'celestial-frontier.html', cases: [] }) }, (dir) => {
      expect(() => loadRecorded('empty', dir)).toThrow('recorded v1 fixture empty has no cases');
    });
  });

  it('refuses a name that is not a plain fixture name', () => {
    expect(() => loadRecorded('../v1/baseline')).toThrow(/^cannot load recorded v1 fixture \.\.\/v1\/baseline: /);
  });
});
