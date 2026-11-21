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
