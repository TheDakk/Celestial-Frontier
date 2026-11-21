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
