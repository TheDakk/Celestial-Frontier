// A new type draws only from streams of its own: declared once, never one the legacy game draws from, and its
// file has no other way to a random value. It is shown copies it cannot write to.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CENSUS_SOL_SEED, SWITCHES_ON, WORLD_TYPES, WORLD_TYPE_KEYS,
  declareStream, declaredStreams, extraBodies, gameCensusSources, isLegacyStream, ownDraw, ownStream, sliceOf,
  type TypeStream, type WorldTypeDefinition,
} from '../src/index.js';

const game = gameCensusSources(() => ({ percent: 0, damageMin: 0, damageMax: 0 }));
const TYPES_DIR = fileURLToPath(new URL('../src/types/', import.meta.url));
const typeFiles = readdirSync(TYPES_DIR).filter((name) => name.endsWith('.ts')).sort();

describe('a type\'s own stream', () => {
  it('cannot be one the legacy game draws from', () => {
    // The biome, the deposits, the reserve, the cosmic and exceptional veins, a pull, the landing mix, the epithet.
    for (const [a, b] of [[0xB10E, 7], [0xE1E, 9], [0x2E5, 3], [0xC05, 7], [0xE8C, 5], [0xE1F, 1], [0xE1F, 300], [0xC0FF, 3], [0xE917, 0x2B], [0x1A2D, 1]] as const) {
      expect(isLegacyStream(a, b), `${a.toString(16)}/${b}`).toBe(true);
      expect(() => declareStream('test', a, b), `${a.toString(16)}/${b}`).toThrow(/legacy game/);
    }
    // A planet's seed (4036), a dwarf's (4066), a moon's (5321), a comet's (5340), a civilisation's name (5024),
    // a star's name (3617), the rarity roll with any salt (4244).
    for (const [a, b] of [[7, 3], [108, 56], [613, 321], [400, 9], [401, 9], [5, 91], [260, 91], [31, 17], [3, 9], [7, 7], [3, 0x9A], [0x4C3A, 0x9A]] as const) {
      expect(isLegacyStream(a, b), `${a}/${b}`).toBe(true);
      expect(() => declareStream('test', a, b), `${a}/${b}`).toThrow(/legacy game/);
    }
    expect(() => declareStream('test', 1.5, 1)).toThrow(RangeError);
    expect(() => declareStream('test', 0x5000, -1)).toThrow(RangeError);
  });

  it('is declared once: a second type cannot take the same stream', () => {
    const first = declareStream('test one', 0x7E50, 1);
    expect(() => declareStream('test two', 0x7E50, 1)).toThrow(/already test one's/);
    expect(declaredStreams().filter((s) => s.a === 0x7E50)).toEqual([{ owner: 'test one', a: 0x7E50, b: 1 }]);
    expect(ownDraw(77, first)).toBe(ownStream(77, first)());
    expect(ownDraw(77, first)).not.toBe(ownDraw(78, first));
    expect(ownDraw(77, first)).not.toBe(ownDraw(77, declareStream('test three', 0x7E50, 2)));
  });

  it('cannot be drawn from without being declared: a pair of numbers is refused', () => {
    const forged = { owner: 'forged', a: 0xB10E, b: 7 } as unknown as TypeStream;
    expect(() => ownStream(133, forged)).toThrow(/declared/);
    expect(() => ownDraw(133, forged)).toThrow(/declared/);
    expect(() => ownStream(133, { owner: 'forged', a: 0x7E50, b: 1 } as unknown as TypeStream)).toThrow(/declared/);
  });

  it('every stream of the thirteen types is its own, and none is the legacy game\'s', () => {
    const streams = declaredStreams().filter((s) => (WORLD_TYPE_KEYS as readonly string[]).includes(s.owner));
    expect(streams.map((s) => `${s.owner} ${s.a.toString(16)}/${s.b}`).sort()).toEqual([
      'artefact a27/1', 'eccentric ecc/1', 'hycean 4c3a/13', 'megaEarth 3e6a/17', 'protoplanet 9b0/1',
      'shattered 5a7/1', 'smallBody a57/1', 'trojan 7a0/1',
    ]);
    expect(new Set(streams.map((s) => `${s.a}/${s.b}`)).size).toBe(streams.length);
    expect(new Set(streams.map((s) => s.a)).size).toBe(streams.length);
    for (const s of streams) expect(isLegacyStream(s.a, s.b)).toBe(false);
  });
});

describe('a type\'s file', () => {
  it('there is one for each type', () => {
    expect(typeFiles).toEqual([...WORLD_TYPE_KEYS].sort().map((key) => `${key}.ts`));
  });

  /** What a type file says is wrong with it; empty when it keeps to its own streams. */
  function faults(text: string): string[] {
    const found: string[] = [];
    const code = text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    for (const match of code.matchAll(/\bfrom\s+'([^']+)'|\bimport\s*\(\s*'([^']+)'|\brequire\s*\(\s*'([^']+)'/g)) {
      const spec = match[1] ?? match[2] ?? match[3]!;
      if (!['../rules.js', '../census.js', '../sources.js', '../streams.js'].includes(spec)) found.push(`imports ${spec}`);
    }
    for (const word of ['mulberry32', 'hashInt', 'cellRng', 'makeNoise', 'Math.random', 'systemFor', 'planetParams', 'Math.imul']) {
      if (code.includes(word)) found.push(`uses ${word}`);
    }
    return found;
  }

  it('reaches no generator but its own declared streams', () => {
    for (const name of typeFiles) expect(faults(readFileSync(TYPES_DIR + name, 'utf8')), name).toEqual([]);
  });

  it('proved both ways: a type file that reads a legacy stream is named', () => {
    expect(faults("import { mulberry32 } from '@cf/domain-rand';\nconst r = mulberry32(starSeed);")).toEqual(['imports @cf/domain-rand', 'uses mulberry32']);
    expect(faults("import { hashInt } from '../../../rand/src/index.js';")).toEqual(['imports ../../../rand/src/index.js', 'uses hashInt']);
    expect(faults("const r = (await import('@cf/domain-worldgen')).systemFor(1);")).toEqual(['imports @cf/domain-worldgen', 'uses systemFor']);
    expect(faults('let a = seed; a = Math.imul(a ^ a >>> 15, 1 | a);')).toEqual(['uses Math.imul']);
  });
});

describe('what a type is shown', () => {
  const writer: WorldTypeDefinition = {
    key: 'trojan', label: 'Writer', slice: null, source: null, rogue: null, rules: null,
    bodies: (_starSeed, system) => { (system as { belt?: unknown }).belt = null; return []; },
  };
  const deepWriter: WorldTypeDefinition = { ...writer, bodies: (_starSeed, system) => { (system.planets[0]!.P as { hue?: number }).hue = 1; return []; } };
  const pusher: WorldTypeDefinition = { ...writer, bodies: (_starSeed, system) => { (system.planets as unknown[]).push({}); return []; } };
  const sliceWriter: WorldTypeDefinition = { ...writer, bodies: null, slice: [{ name: 'writes', test: (P) => { (P as { hue?: number }).hue = 200; return false; } }] };

  it('cannot be written: a type that writes to its system or its planet is refused, and Sol is as it was', () => {
    const before = JSON.stringify(game.system(CENSUS_SOL_SEED));
    for (const type of [writer, deepWriter, pusher]) {
      expect(() => extraBodies(CENSUS_SOL_SEED, game.system(CENSUS_SOL_SEED), SWITCHES_ON, [type])).toThrow(TypeError);
    }
    const neptune = game.system(CENSUS_SOL_SEED).planets[7]!;
    expect(() => sliceOf(neptune.P, 'cold', true, SWITCHES_ON, [sliceWriter])).toThrow(TypeError);
    expect(JSON.stringify(game.system(CENSUS_SOL_SEED))).toBe(before);
  });

  it('is what the legacy game made: the copy reads the same', () => {
    let seen = '';
    const reader: WorldTypeDefinition = { ...writer, bodies: (_starSeed, system) => { seen = JSON.stringify(system); return []; } };
    extraBodies(CENSUS_SOL_SEED, game.system(CENSUS_SOL_SEED), SWITCHES_ON, [reader]);
    expect(seen).toBe(JSON.stringify(game.system(CENSUS_SOL_SEED)));
    expect(WORLD_TYPES.every((type) => type.bodies === null)).toBe(true);
  });
});
