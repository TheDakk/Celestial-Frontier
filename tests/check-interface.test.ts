import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkInterface, formatInterfaceReport } from '../tools/check-interface.mjs';
import { checkPurity } from '../tools/purity-check.mjs';

const TOOL = fileURLToPath(new URL('../tools/check-interface.mjs', import.meta.url));
const PLACEHOLDER_PATH = fileURLToPath(new URL('../packages/art-testparts/src/interface.txt', import.meta.url));
const PLACEHOLDER = readFileSync(PLACEHOLDER_PATH, 'utf8');

/** The placeholder without the drawing whose header line is `header` (the header, its rows and the blank line after). */
function without(header: string): string {
  const lines = PLACEHOLDER.split('\n');
  const at = lines.indexOf(header);
  expect(at).toBeGreaterThan(0);
  const end = lines.indexOf('', at);
  return [...lines.slice(0, at), ...lines.slice(end === -1 ? lines.length : end + 1)].join('\n');
}
const BLOCK_16 = Array.from({ length: 16 }, () => '1'.repeat(16)).join('\n');

describe('checkInterface', () => {
  it('the placeholder sheet checks OK', () => {
    const report = checkInterface(PLACEHOLDER);
    expect(report).toEqual({ ok: true, parseError: null, problems: [], summary: { glyphs: 96, icons: 2, elements: 60, line: 12 } });
    expect(formatInterfaceReport(report)).toBe('check-interface: OK\nsummary: 96 glyphs (line 12), 2 icons, 60 elements\n');
  });
  it('a sheet that does not parse reports the parser\'s line and nothing else', () => {
    const report = checkInterface(PLACEHOLDER.replace('interface 1', 'interface 3'));
    expect(report).toEqual({ ok: false, parseError: 'line 7: expected interface 1', problems: [], summary: null });
    expect(formatInterfaceReport(report)).toBe('check-interface: FAILED\nerror: line 7: expected interface 1\n');
  });
  it.each([
    ['a missing icon', without('icon settings size=16'), ['missing icon settings']],
    ['a missing glyph', without('glyph U+0041'), ['missing glyph U+0041']],
    ['a missing ramp', PLACEHOLDER.replace('ramp accent 5 6 7 8\n', ''), ['missing ramp accent']],
    ['an unknown icon', `${PLACEHOLDER}\nicon rocket size=16\n${BLOCK_16}\n`, ['unknown icon rocket']],
    ['a missing element', without('element quasar anchor=4,4'), ['missing element quasar']],
    ['an unknown element', `${PLACEHOLDER}\nelement star/small anchor=0,0\n1\n`, ['unknown element star/small']],
    ['an icon of another size', PLACEHOLDER.replace(/icon settings size=16\n(?:.{16}\n){16}/, 'icon settings size=2\n11\n11\n'), ['icon settings is 2 by 2, not 16 by 16']],
  ])('reports %s', (_what, text, problems) => {
    const report = checkInterface(text);
    expect(report.parseError).toBeNull();
    expect(report.problems).toEqual(problems);
    expect(report.ok).toBe(false);
    expect(formatInterfaceReport(report).split('\n').slice(0, 2)).toEqual(['check-interface: FAILED', `error: ${problems[0]}`]);
  });
});

describe('the check-interface command', () => {
  const run = (args: string[]) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8' });
  it('check-interface exits 1 on a sheet missing one icon and 0 on the placeholder', () => {
    const good = run([PLACEHOLDER_PATH]);
    expect([good.status, good.stdout.split('\n')[0]]).toEqual([0, 'check-interface: OK']);
    const dir = mkdtempSync(join(tmpdir(), 'check-interface-'));
    try {
      const file = join(dir, 'interface.txt');
      writeFileSync(file, without('icon settings size=16'));
      const bad = run([file]);
      expect([bad.status, bad.stdout.split('\n').slice(0, 2)]).toEqual([1, ['check-interface: FAILED', 'error: missing icon settings']]);
      // It read the file and wrote nothing beside it or into it.
      expect(readFileSync(file, 'utf8')).toBe(without('icon settings size=16'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('exits 2 with the usage line when given no file, two files or a file that cannot be read', () => {
    for (const args of [[], [PLACEHOLDER_PATH, PLACEHOLDER_PATH]]) {
      const r = run(args);
      expect([r.status, r.stderr.trim()]).toEqual([2, 'usage: node tools/check-interface.mjs <interface.txt>']);
    }
    expect(run([join(tmpdir(), 'check-interface-no-such-file.txt')]).status).toBe(2);
  });
});

describe('the purity check and the interface renderer', () => {
  it('the purity check examines packages/art-interface/src', () => {
    const at = (text: string, path = 'packages/art-interface/src/planted.ts') => checkPurity([{ path, text }]);
    expect(at('export const half = 0.5;')).toEqual(['packages/art-interface/src/planted.ts: uses a floating-point literal']);
    expect(at('export const half = (a: number): number => a / 2;')).toEqual(['packages/art-interface/src/planted.ts: uses division']);
    expect(at('export const now = Date.now();')).toEqual(['packages/art-interface/src/planted.ts: uses Date.now']);
    expect(at('export const whole = 5;')).toEqual([]);
    expect(at('export const half = 0.5;', 'packages/art-interface/test/planted.ts')).toEqual([]);
  });
});
