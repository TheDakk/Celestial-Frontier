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
    expect(run('Date.now()', 'tools/a.ts')).toEqual([]);
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
  it.each([
    ['single-quoted', "const s = 'Date.now';", 'Date.now;'],
    ['double-quoted', 'const s = "x = Math.random() * 3";', 'x = Math.random() * 3;'],
    ['template', 'const s = `performance.now()`;', 'performance.now();'],
    ['quoted', "const rows = [{ sourceLine: 'const d = new Date(0);' }];", 'const d = new Date(0);'],
  ])('passes a forbidden name inside a %s string but fails the same text as code: %s', (_kind, inString, asCode) => {
    expect(run(inString)).toEqual([]);
    expect(run(asCode)).toHaveLength(1);
  });
  it('still flags a forbidden use inside a template substitution', () => {
    expect(run('const s = `${Date.now()}`;')).toEqual([`${P}: uses Date.now`]);
  });
  it('still finds imports, whose specifiers are string literals', () => {
    expect(run("const s = 'Math.random'; import { a } from '@cf/art-compose';")).toEqual([`${P}: imports an art package`]);
  });
  it('reports one message per reason per file', () => {
    expect(run('Math.random(); Math.random(); Date.now();')).toEqual([`${P}: uses Math.random`, `${P}: uses Date.now`]);
  });
  it('allows other imports', () => {
    expect(run("import { a } from '@cf/genome'; import b from './b.js';")).toEqual([]);
  });
  it.each([
    ["const cv = document.createElement('canvas');", 'uses document'],
    ['const w = window.innerWidth;', 'uses window'],
    ["const c2 = cv.getContext('2d');", 'uses a canvas'],
    ["const c2 = cv.getContext ('2d');", 'uses a canvas'],
  ])('flags the host use %s', (text, reason) => {
    expect(run(text)).toEqual([`${P}: ${reason}`]);
  });
  it.each([
    ['a comment', "// document.title, window.x and cv.getContext('2d')\nexport const a = 1;"],
    ['a block comment', "/* document.body; window.open(); cv.getContext('2d') */ export const a = 1;"],
    ['a string', "const s = \"document.x window.y getContext(\";"],
    ['a template', 'const t = `document.x window.y getContext(`;'],
    ['another name', 'const a = mydocument.x + subwindow.y + getContextual(1);'],
  ])('passes a host name inside %s', (_kind, text) => {
    expect(run(text)).toEqual([]);
  });
  it.each([
    ['const x = window?.innerWidth;', 'uses window'],
    ["const x = window['innerWidth'];", 'uses window'],
    ['const x = window .innerWidth;', 'uses window'],
    ['const t = document?.title;', 'uses document'],
    ["const t = document['title'];", 'uses document'],
    ['const t = globalThis.document.title;', 'uses document'],
    ["const c2 = cv.getContext?.('2d');", 'uses a canvas'],
    ['const cv = new OffscreenCanvas(8, 8);', 'uses a canvas'],
    ['const ok = typeof OffscreenCanvas;', 'uses a canvas'],
  ])('flags the host use %s, through optional chaining, brackets or a canvas constructor', (text, reason) => {
    expect(run(text)).toEqual([`${P}: ${reason}`]);
  });
  it.each([
    'const x = globalThis.window.x;',
    'const x = self.window.x;',
    'const x = globalThis?.window;',
    'const w = globalThis.window',
  ])('flags the page window reached through the global object: %s, in domain and scene src', (text) => {
    for (const path of [P, 'packages/scene/src/a.ts']) expect(run(text, path)).toEqual([`${path}: uses window`]);
  });
  it.each([
    'const x = state.window.x;',
    'const x = this.window[0];',
    'const x = myself.window.x;',
    'const x = globalThis.windowSize;',
  ])('passes %s, which is not the page window', (text) => {
    for (const path of [P, 'packages/scene/src/a.ts']) expect(run(text, path)).toEqual([]);
  });
  it('passes a field that is merely named window', () => {
    expect(run('const w = state.window.start; const v = row?.window; const u = this.window[0];')).toEqual([]);
    expect(run('const w = window.start;')).toEqual([`${P}: uses window`]);
  });
  it('reports each host use once alongside the other rules', () => {
    expect(run("document.a; document.b; window.c; x.getContext('2d'); Date.now();")).toEqual([
      `${P}: uses Date.now`, `${P}: uses document`, `${P}: uses window`, `${P}: uses a canvas`,
    ]);
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

describe('purity check: scene, persistence and audio', () => {
  const SCENE = 'packages/scene/src/sub/a.ts';
  const SAVE = 'packages/persistence/src/a.ts';
  const AUDIO = 'packages/audio/src/a.js';
  it.each([
    ['Math.random()', 'uses Math.random'],
    ['Date.now()', 'uses Date.now'],
    ['performance.now()', 'uses performance.now'],
    ['const d = new Date(0);', 'uses new Date'],
    ["import { a } from '@cf/art-compose';", 'imports an art package'],
    ["const p = await import('pixi.js');", 'imports pixi.js'],
  ])('flags %s in scene, in persistence and in audio', (text, reason) => {
    expect(run(text, SCENE)).toEqual([`${SCENE}: ${reason}`]);
    expect(run(text, SAVE)).toEqual([`${SAVE}: ${reason}`]);
    expect(run(text, AUDIO)).toEqual([`${AUDIO}: ${reason}`]);
  });
  it.each([
    ["const cv = document.createElement('canvas');", 'uses document'],
    ['const w = window.innerWidth;', 'uses window'],
    ["const c2 = cv.getContext('2d');", 'uses a canvas'],
    ['const cv = new OffscreenCanvas(8, 8);', 'uses a canvas'],
  ])('flags the host use %s in scene only: persistence owns the browser save, audio the browser sound', (text, reason) => {
    expect(run(text, SCENE)).toEqual([`${SCENE}: ${reason}`]);
    expect(run(text, SAVE)).toEqual([]);
    expect(run(text, AUDIO)).toEqual([]);
  });
  it('passes the same text in comments and strings', () => {
    for (const path of [SCENE, SAVE, AUDIO]) expect(run("// Date.now() and document.x\nconst s = 'Math.random()';", path)).toEqual([]);
  });
  it('reports a NUL byte in any examined src file, and not outside them', () => {
    for (const path of [SCENE, SAVE, AUDIO, P, 'packages/art-compose/src/a.ts']) expect(run('const a = 1;\0', path)).toEqual([`${path}: contains a NUL byte`]);
    expect(run('const a = 1;\0', 'packages/scene/test/a.test.ts')).toEqual([]);
  });
  it('leaves the scene, persistence and audio tests outside the check', () => {
    for (const path of ['packages/scene/test/a.test.ts', 'packages/persistence/test/a.test.ts', 'packages/audio/test/a.test.ts']) {
      expect(run('Math.random(); Date.now(); window.x;', path)).toEqual([]);
    }
  });
});

describe('purity check: the game app', () => {
  const SAVE = 'apps/game/src/save/x.ts';
  const ROOT = 'apps/game/src/main.ts';
  const CLOCK = 'apps/game/src/platform/clock.ts';
  const ENTROPY = 'apps/game/src/platform/sub/entropy.ts';
  it.each([
    ['Date.now()', 'uses Date.now'],
    ['performance.now()', 'uses performance.now'],
    ['const d = new Date(0);', 'uses new Date'],
    ['crypto.getRandomValues(new Uint32Array(1));', 'uses crypto.getRandomValues'],
    ['globalThis.crypto?.getRandomValues(buffer);', 'uses crypto.getRandomValues'],
    ['const id = crypto.randomUUID();', 'uses crypto.randomUUID'],
    ['const { randomUUID } = crypto;', 'uses crypto.randomUUID'],
  ])('flags %s under apps/game/src and passes it in the platform folder', (text, reason) => {
    expect(run(text, SAVE)).toEqual([`${SAVE}: ${reason}`]);
    expect(run(text, ROOT)).toEqual([`${ROOT}: ${reason}`]);
    expect(run(text, CLOCK)).toEqual([]);
    expect(run(text, ENTROPY)).toEqual([]);
  });
  it('flags Math.random anywhere under apps/game/src, platform included', () => {
    for (const path of [SAVE, ROOT, CLOCK, ENTROPY]) expect(run('const r = Math.random();', path)).toEqual([`${path}: uses Math.random`]);
  });
  it('a folder merely named like platform inside a system is not the platform folder', () => {
    const path = 'apps/game/src/save/platform/x.ts';
    expect(run('Date.now()', path)).toEqual([`${path}: uses Date.now`]);
  });
  it('passes the same text in comments and strings, and reports one message per reason', () => {
    expect(run("// Date.now() and Math.random()\nconst s = 'crypto.randomUUID()';", SAVE)).toEqual([]);
    expect(run('Date.now(); Date.now(); Math.random();', SAVE)).toEqual([`${SAVE}: uses Math.random`, `${SAVE}: uses Date.now`]);
  });
  it('the app may import the art packages and touch the page', () => {
    expect(run("import { compose } from '@cf/art-compose';\nconst w = window.innerWidth; document.title = 'x';", SAVE)).toEqual([]);
  });
  it('reports a NUL byte in an app src file', () => {
    expect(run('const a = 1;\0', CLOCK)).toEqual([`${CLOCK}: contains a NUL byte`]);
  });
  it('the app tests and files beside src are not examined', () => {
    for (const path of ['apps/game/test/x.test.ts', 'apps/game/vite.config.ts']) {
      expect(run('Math.random(); Date.now(); crypto.randomUUID();', path)).toEqual([]);
    }
  });
  it.each(['sin', 'cos', 'tan', 'atan', 'atan2', 'pow', 'exp', 'log', 'hypot'])('flags Math.%s under apps/game/src/space and nowhere else in the app', (name) => {
    const text = `const v = Math.${name}(1);`;
    for (const path of ['apps/game/src/space/project.ts', 'apps/game/src/space/deep/x.ts']) expect(run(text, path)).toEqual([`${path}: uses Math.${name}`]);
    for (const path of [SAVE, ROOT, CLOCK, 'apps/game/src/spacesuit/x.ts', 'apps/game/test/space-project.test.ts']) expect(run(text, path)).toEqual([]);
  });
  it('the space folder may use the exact maths functions, and keeps the app rules', () => {
    const path = 'apps/game/src/space/project.ts';
    expect(run('const v = Math.round(Math.sqrt(2) * Math.floor(3)) + Math.min(1, Math.max(2, Math.abs(-3))) + Math.ceil(1);', path)).toEqual([]);
    expect(run('// Math.sin(1)\nconst s = "Math.cos(1)";', path)).toEqual([]);
    expect(run('Math . sin(1); Math.sin(2); Math.cos(3); Date.now();', path)).toEqual([`${path}: uses Date.now`, `${path}: uses Math.sin`, `${path}: uses Math.cos`]);
    expect(run('const sine = 1; const o = { cos: 2 }; o.cos;', path)).toEqual([]);
  });
  it.each(['cbrt', 'tanh', 'sinh', 'cosh', 'asin', 'acos', 'log2', 'log10', 'log1p', 'expm1', 'fround', 'PI'])('flags Math.%s under apps/game/src/space: only the listed exact functions pass', (name) => {
    const path = 'apps/game/src/space/project.ts';
    expect(run(`const v = Math.${name};`, path)).toEqual([`${path}: uses Math.${name}`]);
    expect(run(`const v = Math.${name};`, SAVE)).toEqual([]);
  });
  it.each(['abs', 'floor', 'ceil', 'round', 'trunc', 'min', 'max', 'sqrt', 'imul', 'sign'])('passes Math.%s under apps/game/src/space', (name) => {
    expect(run(`const v = Math.${name}(4);`, 'apps/game/src/space/project.ts')).toEqual([]);
  });
  it.each([
    ['const d = (a - b) ** 2;', 'uses exponentiation'],
    ['let d = 3; d **= 2;', 'uses exponentiation'],
    ['const { sin, cos } = Math;', 'uses Math other than by a listed function'],
    ['const M = Math; M.sin(1);', 'uses Math other than by a listed function'],
    ["const s = Math['sin'](1);", 'uses Math other than by a listed function'],
    ['const s = Math?.sin(1);', 'uses Math other than by a listed function'],
  ])('flags %s under apps/game/src/space and nowhere else in the app', (text, reason) => {
    const path = 'apps/game/src/space/label-place.ts';
    expect(run(text, path)).toEqual([`${path}: ${reason}`]);
    expect(run(text, SAVE)).toEqual([]);
    expect(run(`/** ${text} */\nconst s = '${text.replaceAll("'", '"')}'; const d = (a - b) * (a - b);`, path)).toEqual([]);
  });
  it.each([
    ['const d = new Date;', 'uses new Date'],
    ['const d = new Date ();', 'uses new Date'],
    ['const now = Date();', 'calls Date for the time'],
    ['const start = performance.timeOrigin;', 'uses performance.timeOrigin'],
    ['const at = event.timeStamp;', 'uses an event time stamp'],
    ['const at = event?.timeStamp;', 'uses an event time stamp'],
  ])('flags %s under apps/game/src and passes it in the platform folder', (text, reason) => {
    expect(run(text, SAVE)).toEqual([`${SAVE}: ${reason}`]);
    expect(run(text, CLOCK)).toEqual([]);
    expect(run(`// ${text}\nconst validDate = 1; const updated = { Date: 1 }; const timeStampless = 2;`, SAVE)).toEqual([]);
  });
  it('apps/diagnostics is not examined', () => {
    expect(run('Math.random(); performance.now(); new Date(0);', 'apps/diagnostics/src/main.ts')).toEqual([]);
  });
});
