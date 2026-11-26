// A new type draws only from streams of its own: declared once, never one the legacy game draws from, and its
// file can take a value from no module but the declared streams, by any way of importing. It is shown copies it
// cannot write to. What is not held here: a type that works a hash out by hand, with no import and none of the
// refused names, is not seen by a reading of its file.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseAst } from 'rolldown/parseAst';
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

  /** The one module a type file may take values from. */
  const GATE = '../streams.js';
  /** Names that reach beyond a file with no import, or draw a number that is no declared stream's. */
  const REFUSED = ['require', 'globalThis', 'global', 'process', 'eval', 'Function', 'crypto', 'WebAssembly', 'constructor', 'getBuiltinModule', 'random', 'imul'];

  /** What a type file says is wrong with it; empty when the only values it can reach are the declared streams'.
      The file is parsed, not searched: every way a module can take a value from another (an import of either quote,
      a re-export, an import while running, a require) is a node of its syntax tree, whatever it is spelled like. */
  function faults(text: string): string[] {
    const found = new Set<string>();
    const visit = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (typeof node !== 'object' || node === null) return;
      const n = node as { type?: string; importKind?: string; exportKind?: string; source?: { value?: unknown } | null; specifiers?: { importKind?: string }[]; name?: unknown; value?: unknown };
      const from = String(n.source?.value);
      if (n.type === 'ImportDeclaration') {
        // Types are erased before the game runs: an import of types alone hands a file no value.
        const typesOnly = n.importKind === 'type' || ((n.specifiers?.length ?? 0) > 0 && n.specifiers!.every((s) => s.importKind === 'type'));
        if (!typesOnly && from !== GATE) found.add(`takes values from ${from}`);
        return;
      }
      if ((n.type === 'ExportNamedDeclaration' || n.type === 'ExportAllDeclaration') && n.source && n.exportKind !== 'type') found.add(`passes on ${from}`);
      if (n.type === 'TSImportEqualsDeclaration') found.add('imports by require');
      if (n.type === 'ImportExpression') found.add('imports while it runs');
      if (n.type === 'MetaProperty') found.add('reads import.meta');
      if (n.type === 'Identifier' && REFUSED.includes(String(n.name))) found.add(`uses ${String(n.name)}`);
      if ((n.type === 'Literal' || n.type === 'TemplateElement') && REFUSED.some((name) => JSON.stringify(n.value ?? '').includes(name))) found.add('spells a refused name in a string');
      for (const value of Object.values(n)) visit(value);
    };
    visit(parseAst(text, { lang: 'ts' }, 'type.ts'));
    return [...found];
  }

  it('can take values from the declared streams and from nowhere else', () => {
    for (const name of typeFiles) expect(faults(readFileSync(TYPES_DIR + name, 'utf8')), name).toEqual([]);
  });

  it('and the declared streams hand out six things, none of them a generator of the legacy game', async () => {
    // What a type file can reach: declaring a stream (refused when the legacy game draws there, above), drawing
    // from a declared one, and three readings of what is declared. A seventh export would be a new way out.
    expect(Object.keys(await import('../src/streams.js')).sort()).toEqual(['LEGACY_FIRST_SALTS', 'declareStream', 'declaredStreams', 'isLegacyStream', 'ownDraw', 'ownStream']);
  });

  it('proved both ways: each way round the old check is named', () => {
    // A double-quoted import of the legacy game's rarity roll.
    expect(faults('import { rarityRoll } from "@cf/domain-speciestraits";\nexport const roll = (seed: number) => rarityRoll(seed, 3);')).toEqual(['takes values from @cf/domain-speciestraits']);
    // A roll on the census's own hash, which no stream declares.
    expect(faults("import { censusDigest } from '../census.js';\nexport const roll = (seed: number) => parseInt(censusDigest(String(seed)), 16);")).toEqual(['takes values from ../census.js']);
    // Any other system the legacy game makes, through the census's readers.
    expect(faults("import { gameCensusSources } from '../sources.js';\nexport const other = (seed: number) => gameCensusSources(() => ({ percent: 0, damageMin: 0, damageMax: 0 })).system(seed);")).toEqual(['takes values from ../sources.js']);
  });

  it('proved both ways: every other way to a value is named, and types alone are let through', () => {
    expect(faults("import { mulberry32 } from '@cf/domain-rand';\nconst r = mulberry32(1);")).toEqual(['takes values from @cf/domain-rand']);
    expect(faults('import * as rand from "../../../rand/src/index.js";')).toEqual(['takes values from ../../../rand/src/index.js']);
    expect(faults("import { type TypeStream, hashInt } from '@cf/domain-rand';")).toEqual(['takes values from @cf/domain-rand']);
    expect(faults("import '@cf/domain-worldgen';")).toEqual(['takes values from @cf/domain-worldgen']);
    expect(faults("export { systemFor } from '@cf/domain-worldgen';")).toEqual(['passes on @cf/domain-worldgen']);
    expect(faults("export * from '../sources.js';")).toEqual(['passes on ../sources.js']);
    expect(faults("const r = (await import('@cf/domain-worldgen')).systemFor(1);")).toEqual(['imports while it runs']);
    expect(faults('const name = "@cf/domain-" + "rand"; const r = await import(name);')).toEqual(['imports while it runs']);
    expect(faults("import rand = require('@cf/domain-rand');")).toEqual(['imports by require']);
    expect(faults("const rand = require('@cf/domain-rand');")).toEqual(['uses require']);
    expect(faults("const rand = globalThis.process.getBuiltinModule('node:module');")).toEqual(['uses globalThis', 'uses process', 'uses getBuiltinModule']);
    expect(faults('const here = import.meta.url;')).toEqual(['reads import.meta']);
    expect(faults('let a = seed; a = Math.imul(a ^ a >>> 15, 1 | a);')).toEqual(['uses imul']);
    expect(faults("const draw = Math['random']();")).toEqual(['spells a refused name in a string']);
    // A string that looks like the start of a comment hides nothing from a parser.
    expect(faults('const s = "//"; import("@cf/domain-rand");')).toEqual(['imports while it runs']);
    // Types alone, from anywhere, and the declared streams: nothing is wrong.
    expect(faults("import type { CensusSystem } from '../census.js';\nimport { type TypeStream, declareStream, ownDraw } from \"../streams.js\";\nimport type { Rng } from '@cf/domain-rand';\n// mulberry32 and hashInt are the legacy game's.\nexport const x = 1;")).toEqual([]);
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
