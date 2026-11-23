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
    expect(report).toEqual({ ok: true, parseError: null, problems: [], summary: { glyphs: 97, icons: 6, elements: 60, tiers: 0, line: 12 } });
    expect(formatInterfaceReport(report)).toBe('check-interface: OK\nsummary: 97 glyphs (line 12), 6 icons, 60 elements, 0 size tiers\n');
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

describe('size tiers in the checker', () => {
  /** A drawing `w` wide and two rows high. */
  const tier = (name: string, w: number): string => `\nelement ${name} anchor=0,0\n${'1'.repeat(w)}\n${'2'.repeat(w)}\n`;
  // The placeholder's black hole is 9 wide; it has no other form, so its tiers answer to no sibling.
  it('any tier of a listed element is accepted when it is drawn at the width its name gives, and is counted apart', () => {
    const report = checkInterface(PLACEHOLDER + tier('black-hole/x32', 32) + tier('black-hole/x64', 64) + tier('deco/neb/x128', 128) + tier('companion/x24', 24));
    expect(report).toEqual({ ok: true, parseError: null, problems: [], summary: { glyphs: 97, icons: 6, elements: 60, tiers: 4, line: 12 } });
    expect(formatInterfaceReport(report)).toBe('check-interface: OK\nsummary: 97 glyphs (line 12), 6 icons, 60 elements, 4 size tiers\n');
  });
  it.each([
    ['a tier drawn at another width than its name gives', tier('black-hole/x32', 31), ['tier black-hole/x32 is 31 wide, not 32']],
    ['a tier of an unknown element', tier('comet/x32', 32), ['tier comet/x32 is of an unknown element comet']],
    ['a tier no wider than the element itself', tier('black-hole/x9', 9), ['tier black-hole/x9 is no wider than its element (9)']],
    ['a tier of a tier', tier('black-hole/x32', 32) + tier('black-hole/x32/x64', 64), ['tier black-hole/x32/x64 is of an unknown element black-hole/x32']],
    ['a tier whose number is not written plainly', tier('quasar/x032', 32), ['unknown element quasar/x032']],
  ])('reports %s', (_what, extra, problems) => {
    const report = checkInterface(PLACEHOLDER + extra);
    expect(report.parseError).toBeNull();
    expect(report.problems).toEqual(problems);
    expect(report.ok).toBe(false);
  });
  it('a tier is no stand-in for its element: the element is still missing', () => {
    expect(checkInterface(without('element black-hole anchor=4,4') + tier('black-hole/x32', 32)).problems).toEqual(['missing element black-hole']);
  });
});

describe('the forms of one element carry the same tiers', () => {
  const tier = (name: string, w: number): string => `\nelement ${name} anchor=0,0\n${'1'.repeat(w)}\n`;
  const ladder = (names: string[], widths: number[]): string => names.flatMap((name) => widths.map((w) => tier(`${name}/x${w}`, w))).join('');
  const SPIRALS = ['v0', 'v1', 'v2', 'v3'].map((v) => `galaxy/spiral/${v}`);
  const WORMHOLES = ['wormhole', 'wormhole/t1', 'wormhole/t2', 'wormhole/t3'];
  it('orientations, frames and a dimmed form that all carry one ladder pass', () => {
    const report = checkInterface(PLACEHOLDER + ladder(SPIRALS, [32, 64]) + ladder(WORMHOLES, [24]) + ladder(['quasar', 'quasar/dim'], [32, 48]));
    expect(report.problems).toEqual([]);
    expect(report.summary?.tiers).toBe(16);
  });
  it('a half-drawn set of orientations is reported, one line for each orientation that differs from the first', () => {
    expect(checkInterface(PLACEHOLDER + ladder(SPIRALS.slice(0, 1), [32, 64]) + ladder(SPIRALS.slice(1, 2), [32])).problems).toEqual([
      'tiers of galaxy/spiral/v1 differ from galaxy/spiral/v0: 32 against 32, 64',
      'tiers of galaxy/spiral/v2 differ from galaxy/spiral/v0: none against 32, 64',
      'tiers of galaxy/spiral/v3 differ from galaxy/spiral/v0: none against 32, 64',
    ]);
  });
  it('a frame without the tier of the first frame is reported, and so is the first frame without a later one\'s', () => {
    expect(checkInterface(PLACEHOLDER + ladder(WORMHOLES.slice(0, 3), [24])).problems).toEqual(['tiers of wormhole/t3 differ from wormhole: none against 24']);
    expect(checkInterface(PLACEHOLDER + ladder(WORMHOLES.slice(1), [24])).problems).toEqual([
      'tiers of wormhole/t1 differ from wormhole: 24 against none',
      'tiers of wormhole/t2 differ from wormhole: 24 against none',
      'tiers of wormhole/t3 differ from wormhole: 24 against none',
    ]);
  });
  it('a dimmed form without the tiers of its element is reported; the same count at other widths is too', () => {
    expect(checkInterface(PLACEHOLDER + tier('quasar/x32', 32)).problems).toEqual(['tiers of quasar/dim differ from quasar: none against 32']);
    expect(checkInterface(PLACEHOLDER + tier('quasar/x32', 32) + tier('quasar/dim/x48', 48)).problems).toEqual(['tiers of quasar/dim differ from quasar: 48 against 32']);
  });
  it('elements that are no forms of one another answer to nothing: other kinds of galaxy, and the two neutron stars', () => {
    expect(checkInterface(PLACEHOLDER + ladder(SPIRALS, [32]) + ladder(['primary/ns', 'primary/ns/t1', 'primary/ns/t2', 'primary/ns/t3'], [40])).problems).toEqual([]);
  });
});

describe('planet drawings in the checker', () => {
  const drawing = (name: string, w: number): string => `\nelement ${name} anchor=0,0\n${'1'.repeat(w)}\n`;
  it('a planet type may have a drawing, and tiers of it, or none: none is required', () => {
    const report = checkInterface(PLACEHOLDER + drawing('planet/gas', 8) + drawing('planet/gas/x16', 16) + drawing('planet/lava', 8));
    expect(report).toEqual({ ok: true, parseError: null, problems: [], summary: { glyphs: 97, icons: 6, elements: 62, tiers: 1, line: 12 } });
  });
  it('a planet of no type the game makes is unknown, and a tier of a planet the sheet does not draw is reported', () => {
    expect(checkInterface(PLACEHOLDER + drawing('planet/mud', 8)).problems).toEqual(['unknown element planet/mud']);
    expect(checkInterface(PLACEHOLDER + drawing('planet/gas/x16', 16)).problems).toEqual(['tier planet/gas/x16 has no element planet/gas']);
  });
});

describe('the clouds of a planet in the checker', () => {
  const drawing = (name: string, w: number): string => `\nelement ${name} anchor=0,0\n${'1'.repeat(w)}\n`;
  const terran = drawing('planet/terran', 8) + drawing('planet/terran/x16', 16);
  it('a planet may have clouds or none; with the planet\'s own size and tiers they pass', () => {
    expect(checkInterface(PLACEHOLDER + terran).problems).toEqual([]);
    const report = checkInterface(PLACEHOLDER + terran + drawing('planet/terran/clouds', 8) + drawing('planet/terran/clouds/x16', 16));
    expect(report).toEqual({ ok: true, parseError: null, problems: [], summary: { glyphs: 97, icons: 6, elements: 62, tiers: 2, line: 12 } });
  });
  it('clouds without the tiers of their planet, or with tiers it has not, are reported: they would not sit on the globe', () => {
    expect(checkInterface(PLACEHOLDER + terran + drawing('planet/terran/clouds', 8)).problems).toEqual(['tiers of planet/terran/clouds differ from planet/terran: none against 16']);
    expect(checkInterface(PLACEHOLDER + drawing('planet/terran', 8) + drawing('planet/terran/clouds', 8) + drawing('planet/terran/clouds/x16', 16)).problems)
      .toEqual(['tiers of planet/terran/clouds differ from planet/terran: 16 against none']);
  });
  it('clouds drawn at another size than their planet, clouds of a planet the sheet does not draw, and clouds of no planet are reported', () => {
    expect(checkInterface(PLACEHOLDER + drawing('planet/terran', 8) + drawing('planet/terran/clouds', 7)).problems).toEqual(['planet/terran/clouds is 7 by 1, not the 8 by 1 of planet/terran']);
    expect(checkInterface(PLACEHOLDER + drawing('planet/ocean/clouds', 8)).problems).toEqual(['planet/ocean/clouds has no element planet/ocean']);
    expect(checkInterface(PLACEHOLDER + drawing('planet/mud/clouds', 8)).problems).toEqual(['unknown element planet/mud/clouds']);
    expect(checkInterface(PLACEHOLDER + drawing('quasar/clouds', 8)).problems).toEqual(['unknown element quasar/clouds']);
    // Only a living world and an ocean world wear a deck in the game: clouds of another type would never be shown.
    expect(checkInterface(PLACEHOLDER + drawing('planet/gas', 8) + drawing('planet/gas/clouds', 8)).problems).toEqual(['unknown element planet/gas/clouds']);
  });
});

describe('colours a map can show', () => {
  it('a colour numbered past 255 is reported: a map picture holds one byte a pixel', () => {
    expect(checkInterface(PLACEHOLDER.replace('ramp ink', 'colour 255 ffffff\nramp ink')).problems).toEqual([]);
    expect(checkInterface(PLACEHOLDER.replace('ramp ink', 'colour 256 ffffff\ncolour 5000 ffffff\nramp ink')).problems)
      .toEqual(['the palette runs to colour 5000: a map picture holds one byte a pixel, so colour numbers stop at 255']);
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
