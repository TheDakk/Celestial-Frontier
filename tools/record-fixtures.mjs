// Records fixtures from the unmodified current game.
// Usage: node tools/record-fixtures.mjs --source <path to the current game's v2 folder> --only <name>
// The source path is used only to import modules; it is never written to any output.
import { registerHooks } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Source modules import some .ts files with .js specifiers: retry a failed .js specifier as .ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.endsWith('.js')) return nextResolve(specifier.slice(0, -3) + '.ts', context);
      throw error;
    }
  },
});

const RANGE = 8;
const EPOCHS = [0, 1, 2, 3, 6, 12];

// Inputs for the combat recorder. They are written into the fixture beside the outputs, so a test
// rebuilds every genome from the recorded input alone: makeGenome(seed, kingdom, heat) + { xp } + extra.
const KINGDOMS = ['fauna', 'flora', 'fungi', 'microbe'];
const WORLD_FIELDS = ['lava', 'ice', 'gas', 'ocean', 'desert'];
const CODE_NAMES = ['Specimen', 'Moss Walker', '<i>Tag</i> & "quote"', 'Zoë — Ω', '', '   padded   ', 'x'.repeat(60)];
const seedAt = (i, salt) => (Math.imul(i + 1, 2654435761) ^ salt) >>> 0;
function genomeInput(i, salt, kingdom) {
  const extra = {};
  if (i % 10 === 3) Object.assign(extra, { brood: (i * 7) % 260, fed: (i * 11) % 260 });
  if (i % 10 === 7) extra.hurt = ((i % 5) + 1) / 5;
  if (i % 25 === 0) extra._cradle = true;
  if (i % 12 === 5) Object.assign(extra, { _mult: 1 + (i % 6) * 0.14, _wf: WORLD_FIELDS[i % 5] });
  if (i % 17 === 0) extra.size = 6 + (i % 7);
  if (i % 31 === 0) Object.assign(extra, { apex: 12 + (i % 3), lumin: true, wild: 1 });
  if (i % 9 === 4) extra.parents = [seedAt(i, 1), seedAt(i, 2)];
  return { seed: seedAt(i, salt), kingdom, heat: (i % 11) / 10, xp: (i * 97) % 487, extra };
}

const recorders = {
  galaxies: async (source) => {
    // The current game's galaxy sprite seed list has 16 entries; the file reads this free global.
    globalThis.GAL_SPRITES = new Array(16);
    const url = pathToFileURL(join(source, 'packages/domain/worldgen/src/worldgen.verbatim.js')).href;
    const { galaxiesInCell } = await import(url);
    const cells = [];
    for (let cy = -RANGE; cy <= RANGE; cy++) {
      for (let cx = -RANGE; cx <= RANGE; cx++) {
        const galaxies = galaxiesInCell(cx, cy).map(({ seed, x, y, size, sp }) => ({ seed, x, y, size, sp }));
        cells.push({ cx, cy, galaxies });
      }
    }
    return cells;
  },
  rosters: async (source) => {
    const load = (rel) => import(pathToFileURL(join(source, rel)).href);
    const { systemFor } = await load('packages/domain/worldgen/src/index.ts');
    const { climateBand } = await load('packages/domain/surveyphrases/src/index.ts');
    const { mulberry32 } = await load('packages/domain/rand/src/index.ts');
    const { biosphere } = await load('packages/domain/ecology/src/ecology.verbatim.js');
    const { planetSpeciesAtEcologyEpoch } = await load('packages/domain/ecology/src/explicit-epoch.ts');
    const worlds = {
      earth: { planet: 133, star: 424242 },
      kaum: { planet: 1757105165, star: 2737406570 },
      osum: { planet: 51464061, star: 1074947061 },
    };
    const out = {};
    for (const [name, { planet, star }] of Object.entries(worlds)) {
      const sys = systemFor(star);
      const found = sys.planets.find((entry) => entry.P.seed === planet);
      if (!found) throw new Error(`${name}: planet ${planet} not found in system ${star}`);
      const { P, orb } = found;
      const band = climateBand(P, sys, orb);
      const key = biosphere(P, sys, band, mulberry32((P.seed ^ 0x1234567) >>> 0)).key;
      const level = key === 'earth' ? 'complex' : key;
      out[name] = EPOCHS.map((epoch) => JSON.parse(JSON.stringify(planetSpeciesAtEcologyEpoch(P, sys, band, level, epoch))));
    }
    return out;
  },
  // Pure gameplay outputs of the combat package (no drawing): the surface its art cut must not move.
  combat: async (source) => {
    const load = (rel) => import(pathToFileURL(join(source, rel)).href);
    const combat = await load('packages/domain/combatcore/src/index.ts');
    const { makeGenome } = await load('packages/domain/genome/src/index.ts');
    const { systemFor } = await load('packages/domain/worldgen/src/index.ts');
    const genomeOf = (input) => Object.assign(makeGenome(input.seed, input.kingdom, input.heat), { xp: input.xp }, input.extra);
    const attempt = (fn) => { try { return fn(); } catch (error) { return { throws: String(error.message) }; } };

    const stats = Array.from({ length: 200 }, (_, i) => {
      const input = genomeInput(i, 0, KINGDOMS[i % 4]);
      const g = genomeOf(input);
      return {
        input,
        battleStats: combat.battleStats(g),
        abilityOf: combat.abilityOf(g),
        abilityTheme: combat.abilityTheme(g),
        levelOf: combat.levelOf(g),
        innateArts: attempt(() => combat.projectCreatureInnateArts(g)),
      };
    });

    const duels = Array.from({ length: 200 }, (_, i) => {
      const a = genomeInput(i, 0xa, KINGDOMS[i % 4]);
      const b = i % 20 === 0 ? { ...a, extra: { ...a.extra } } : genomeInput(i + 1, 0xb, KINGDOMS[(i >> 2) % 4]);
      if (i % 3 === 0) b.extra._mult = 1 + (i % 6) * 0.14;
      if (i % 5 === 0) b.extra._wf = WORLD_FIELDS[(i / 5) % 5];
      const withStats = i % 2 === 0;
      const ga = genomeOf(a);
      const gb = genomeOf(b);
      const r = combat.runDuel(
        { name: 'A', genome: ga, ...(withStats ? { stats: combat.battleStats(ga) } : {}) },
        { name: 'B', genome: gb, ...(withStats ? { stats: combat.battleStats(gb) } : {}) },
      );
      return { a, b, withStats, result: { winner: r.winner, hpA: r.hpA, hpB: r.hpB, maxA: r.maxA, maxB: r.maxB, turnA0: r.turnA0, log: r.log } };
    });

    const codes = Array.from({ length: 100 }, (_, i) => {
      const input = genomeInput(i, 0xc, KINGDOMS[i % 4]);
      if (i % 7 === 0) Object.assign(input.extra, { _mult: 1.3, _wf: 'ice', hurt: 0.4, brood: 250 });
      const name = CODE_NAMES[i % CODE_NAMES.length];
      const champ = i % 2 === 1;
      const g = genomeOf(input);
      const code = combat.encodeCreature({ name, genome: g }, champ);
      return { input, name, champ, code, decoded: combat.decodeCreature(code), normalized: combat.normGenome(g) };
    });
    const badCodes = ['', 'nonsense', 'CFB-', 'CFB-e30', 'CFB-eyJnIjp7fX0', 'CFB-' + 'A'.repeat(8200)]
      .map((code) => ({ code, decoded: combat.decodeCreature(code) }));

    const guardians = {};
    for (const [name, { planet, star }] of Object.entries({
      kaum: { planet: 1757105165, star: 2737406570 },
      osum: { planet: 51464061, star: 1074947061 },
    })) {
      const found = systemFor(star).planets.find((entry) => entry.P.seed === planet);
      if (!found) throw new Error(`${name}: planet ${planet} not found in system ${star}`);
      const worldType = found.P.type;
      const ordinary = combat.projectOrdinaryGuardianV1(planet);
      const regions = [0, 1, 2, 3, 4, 5];
      guardians[name] = {
        planetSeed: planet,
        worldType,
        ordinary,
        titanPlacement: regions.map((regionIndex) => combat.projectTitanPlacementFactsV1({ planetSeed: planet, worldType, regionIndex, claimedSignatureIds: [] })),
        // battleStats of the Guardian's genome at each region's multiplier (1 + region * 0.14 above region 0).
        regionBattleStats: regions.map((r) => combat.battleStats(r > 0 ? { ...ordinary.genome, _mult: 1 + r * 0.14 } : { ...ordinary.genome })),
      };
    }

    return {
      constants: { STAT_NAMES: combat.STAT_NAMES, STAT_HUES: combat.STAT_HUES, ABILITY_THEMES: combat.ABILITY_THEMES, PLAYER_SEED: combat.PLAYER_SEED },
      levels: Array.from({ length: 487 }, (_, xp) => combat.levelOf({ xp })),
      stats,
      duels,
      codes,
      badCodes,
      guardians,
    };
  },
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  return args;
}

const { source, only } = parseArgs(process.argv.slice(2));
if (!source || !only || !recorders[only]) {
  console.error(`usage: node tools/record-fixtures.mjs --source <path> --only <${Object.keys(recorders).join('|')}>`);
  process.exit(2);
}
const outDir = fileURLToPath(new URL('../fixtures/current/', import.meta.url));
mkdirSync(outDir, { recursive: true });
const data = await recorders[only](resolve(source));
writeFileSync(join(outDir, `${only}.json`), JSON.stringify(data, null, 1) + '\n');
console.log(`recorded ${only}: ${Array.isArray(data) ? data.length : Object.keys(data).length} entries`);
