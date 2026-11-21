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
    ['x = a[i]! / 2', 'uses division'],
    ['x = a.b! / 2', 'uses division'],
    ['x = a++ / 2', 'uses division'],
    ['x = a-- / 2', 'uses division'],
    ['const f = .5;', 'uses a floating-point literal'],
    ['const f = 5.;', 'uses a floating-point literal'],
    ['const f = 1e-3;', 'uses a floating-point literal'],
    ['const f = 2E5;', 'uses a floating-point literal'],
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
    'ok = !/re/.test(s)',
    'x = y! >> 1',
    'x = a != /re/.source',
    'x = ++a; y = --b; z = !c;',
    'const a = arr[1].x;',
    'const s = 1..toString();',
    'const o = obj.e5;',
    'const h = 0xe5;',
    'const a = [...x];',
    'const a = v2.x;',
    'const a = f(1).x;',
    '// 1e-3 and .5 and 5.\nconst n = 1;',
    "const s = '1e-3 .5 5.';",
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
  it.each([
    ['const p = 2 ** 3;', 'uses exponentiation'],
    ['x **= 2;', 'uses exponentiation'],
    ['const l = navigator.language;', 'uses navigator'],
    ["const s = localStorage.getItem('a');", 'uses localStorage'],
    ['const s = sessionStorage;', 'uses sessionStorage'],
    ['setTimeout(f, 0);', 'uses setTimeout'],
    ['const t = setInterval(f, 1);', 'uses setInterval'],
    ['const u = crypto.getRandomValues(b);', 'uses crypto'],
    ['const f = new Intl.NumberFormat();', 'uses Intl'],
    ['keys.sort((a, b) => a.localeCompare(b));', 'uses localeCompare'],
    ['const s = n.toLocaleString();', 'uses toLocale'],
    ['const s = d.toLocaleUpperCase();', 'uses toLocale'],
    ["const t = Date.parse('2026');", 'uses Date.parse'],
    ['const e = process.env;', 'uses process'],
    ['const r = Math.round(x);', 'uses Math.round'],
    ['const r = Math.sqrt(x);', 'uses Math.sqrt'],
    ['const r = Math.pow(x, 2);', 'uses Math.pow'],
    ['const r = Math.PI;', 'uses Math.PI'],
    ['const r = Math . ceil(x);', 'uses Math.ceil'],
    ["import { readFileSync } from 'node:fs';", 'imports outside the renderer'],
    ["import fs from 'fs';", 'imports outside the renderer'],
    ["import { Sprite } from 'pixi.js';", 'imports outside the renderer'],
    ["import { t } from '@cf/art-testparts';", 'imports outside the renderer'],
    ["import { g } from '@cf/game';", 'imports outside the renderer'],
    ["import { a } from '../../../other/src/a';", 'imports outside the renderer'],
    ["import { a } from '../../test/helper';", 'imports outside the renderer'],
    ["export * from '../../../domain/genome/src/index';", 'imports outside the renderer'],
    ["const m = await import('node:path');", 'imports outside the renderer'],
  ])('flags %s in each renderer package (stricter rules)', (text, reason) => {
    for (const pkg of ['art-format', 'art-recipe', 'art-compose']) {
      const path = `packages/${pkg}/src/sub/a.ts`;
      expect(art(text, path)).toEqual([`${path}: ${reason}`]);
    }
  });
  it.each([
    'const a = Math.floor(x) + Math.imul(a, b) + Math.max(a, b) + Math.min(a, b) + Math.abs(a) + Math.trunc(a);',
    "import a from './a'; import b from './sub/b'; export * from './types';",
    "import { a } from '@cf/art-recipe'; import { b } from '@cf/art-compose'; import type { C } from '@cf/art-format';",
    'const s = a * b; /* x ** 2 */ const t = `2 ** 3`;',
    'const proc = processed.x; const n = myIntl; const k = toLocal;',
  ])('passes %s', (text) => {
    expect(art(text)).toEqual([]);
  });
  it('reports both an allowed-list miss and a gameplay import, each once, and Math.random once', () => {
    expect(art("import { g } from '@cf/domain-genome'; import 'node:fs'; Math.random(); Math.random();")).toEqual([
      `${A}: uses Math.random`,
      `${A}: imports a gameplay package`,
      `${A}: imports outside the renderer`,
    ]);
  });
  it('reports each distinct disallowed Math name', () => {
    expect(art('Math.round(a); Math.ceil(b); Math.round(c);')).toEqual([`${A}: uses Math.round`, `${A}: uses Math.ceil`]);
  });
  it('covers every packages/art-*/src folder at any depth, except art-testparts', () => {
    for (const path of ['packages/art-pack/src/a.ts', 'packages/art-scene/src/deep/er/a.ts', 'packages/art-format/src/a.ts']) {
      expect(art('Math.sqrt(2)', path)).toEqual([`${path}: uses Math.sqrt`]);
    }
    expect(art('Math.sqrt(2)', 'packages/art-testparts/src/a.ts')).toEqual([]);
    expect(art('Math.sqrt(2)', 'packages/art-pack/test/a.ts')).toEqual([]);
  });
  it('allows a ../ import only while it resolves inside the same package src', () => {
    expect(art("import a from '../a';", 'packages/art-compose/src/sub/b.ts')).toEqual([]);
    expect(art("import a from '../a';", 'packages/art-compose/src/b.ts')).toEqual(['packages/art-compose/src/b.ts: imports outside the renderer']);
    expect(art("import a from './../a';", 'packages/art-compose/src/b.ts')).toEqual(['packages/art-compose/src/b.ts: imports outside the renderer']);
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
