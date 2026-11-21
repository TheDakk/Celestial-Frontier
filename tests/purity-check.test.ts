import { describe, it, expect } from 'vitest';
import { checkPurity } from '../tools/purity-check.mjs';

const P = 'packages/domain/x/src/a.ts';
const run = (text: string, path = P) => checkPurity([{ path, text }]);

describe('purity check', () => {
  it('passes a pure file', () => {
    expect(run('export const a = 1;')).toEqual([]);
  });
  it.each([
    ['Math.random()', 'uses Math.random'],
    ['Date.now()', 'uses Date.now'],
    ['performance.now()', 'uses performance.now'],
    ['const d = new Date(0);', 'uses new Date'],
    ["import '@cf/art-compose'", 'imports an art package'],
    ["import { a } from '@cf/art-compose'", 'imports an art package'],
    ["const m = await import('@cf/art-pack')", 'imports an art package'],
    ["import { Sprite } from 'pixi.js'", 'imports pixi.js'],
    ["import 'pixi.js'", 'imports pixi.js'],
    ["const p = await import('pixi.js')", 'imports pixi.js'],
  ])('flags %s', (text, reason) => {
    expect(run(text)).toEqual([`${P}: ${reason}`]);
  });
  it('ignores files outside domain src', () => {
    expect(run('Date.now()', 'apps/game/src/a.ts')).toEqual([]);
    expect(run('Date.now()', 'packages/domain/x/tests/a.ts')).toEqual([]);
  });
  it('passes a mention inside comments but fails the same text outside one', () => {
    expect(run('// never call Math.random() here\n/* Date.now()\n new Date( */\nexport const a = 1;')).toEqual([]);
    expect(run('export const a = Math.random();')).toEqual([`${P}: uses Math.random`]);
  });
  it.each([
    ['single-quoted', "const u = 'http://x'; Math.random()", 'uses Math.random'],
    ['double-quoted', 'const u = "http://x"; Math.random()', 'uses Math.random'],
    ['template', 'const u = `http://${host}`; Math.random()', 'uses Math.random'],
    ['single-quoted', "const g = '/* not a comment'; Date.now(); const h = '*/';", 'uses Date.now'],
  ])('does not treat a comment marker inside a %s string as a comment: %s', (_kind, text, reason) => {
    expect(run(text)).toEqual([`${P}: ${reason}`]);
  });
  it('still strips a comment that contains a quote or follows a string', () => {
    expect(run("const s = 'a'; // don't call Math.random()\n/* it's Date.now() */ export const a = s;")).toEqual([]);
  });
  it('examines files in nested folders under a domain src', () => {
    expect(run('Math.random()', 'packages/domain/x/src/sub/a.ts')).toEqual(['packages/domain/x/src/sub/a.ts: uses Math.random']);
  });
  it('does not strip string literals', () => {
    expect(run("const s = 'Date.now';")).toEqual([`${P}: uses Date.now`]);
  });
  it('reports one message per reason per file', () => {
    expect(run('Math.random(); Math.random(); Date.now();')).toEqual([`${P}: uses Math.random`, `${P}: uses Date.now`]);
  });
  it('allows other imports', () => {
    expect(run("import { a } from '@cf/genome'; import b from './b.js';")).toEqual([]);
  });
});

describe('purity check: renderer packages', () => {
  const A = 'packages/art-compose/src/a.ts';
  const art = (text: string, path = A) => checkPurity([{ path, text }]);

  it.each([
    ['Math.random()', 'uses Math.random'],
    ['Date.now()', 'uses Date.now'],
    ['performance.now()', 'uses performance.now'],
    ['const d = new Date(0);', 'uses new Date'],
    ["const r = await fetch('x');", 'uses fetch'],
    ['const x = new XMLHttpRequest();', 'uses XMLHttpRequest'],
    ["const e = document.getElementById('a');", 'uses document'],
    ['const w = window.innerWidth;', 'uses window'],
    ['const f = 1.5;', 'uses a floating-point literal'],
    ['const h = a / b;', 'uses division'],
    ['const h = (a + 1) / 2;', 'uses division'],
    ['x /= 2;', 'uses division'],
    ['const h = `${a / b}`;', 'uses division'],
    ["import { makeGenome } from '@cf/domain-genome';", 'imports a gameplay package'],
    ["import '@cf/domain-ecology';", 'imports a gameplay package'],
    ["const m = await import('@cf/domain-worldgen');", 'imports a gameplay package'],
  ])('flags %s in each renderer package', (text, reason) => {
    for (const pkg of ['art-format', 'art-recipe', 'art-compose']) {
      const path = `packages/${pkg}/src/sub/a.ts`;
      expect(art(text, path)).toEqual([`${path}: ${reason}`]);
    }
  });
  it.each([
    '// v1.2 of the format',
    '/* 1.5 and a / b and Date.now() */',
    "const s = 'version 1.5';",
    'const s = "Math.random and document. and 2.5";',
    'const t = `1.5 and Date.now()`;',
    'const v = a.b; const n = x.length;',
    'const h = 0x01000193;',
    'const x = a >> 1; const y = a * b;',
    'const f = Math.floor(value * count);',
    'const re = /^-?\\d+$/.test(s); const parts = s.split(/\\s+/);',
    'const re = /[/]x/; const u = s.split("/");',
    'if (a) { return /a.b/.test(x); }',
    "import { rand } from '@cf/domain-rand'; import { t } from '@cf/domain-speciestraits'; import { f } from '@cf/art-format';",
    "import a from './a.js'; import { q } from '@cf/domain-rand/sub';",
  ])('passes %s', (text) => {
    expect(art(text)).toEqual([]);
  });
  it('flags a division after a regular expression literal but not the regular expression', () => {
    expect(art('const a = /x/.source; const b = c / d;')).toEqual([`${A}: uses division`]);
  });
  it('does not examine art-testparts or files outside the renderer src folders', () => {
    expect(art('Date.now(); const f = 1.5; const h = a / b;', 'packages/art-testparts/src/a.ts')).toEqual([]);
    expect(art('Date.now()', 'packages/art-compose/test/a.test.ts')).toEqual([]);
    expect(art("import { g } from '@cf/domain-genome';", 'packages/art-compose/test/a.test.ts')).toEqual([]);
  });
  it('reports one message per reason per file', () => {
    expect(art('Date.now(); Date.now(); const f = 1.5 + 2.5; const h = a / b / c;')).toEqual([
      `${A}: uses Date.now`,
      `${A}: uses a floating-point literal`,
      `${A}: uses division`,
    ]);
  });
});
