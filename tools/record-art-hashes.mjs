// Records the golden hashes of composed test-catalogue creatures into fixtures/art/quadruped-v1.json.
// Usage: node tools/record-art-hashes.mjs   (no arguments; reads and writes only inside this repository)
// Re-record only on Dakk's word: the file is the promise that every device draws each creature the same.
// Deterministic: running it twice writes a byte-identical file.
import { registerHooks } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The art packages import sibling .ts files without an extension: retry a failed specifier with .ts and /index.ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.startsWith('.')) throw error;
      const base = specifier.endsWith('.js') ? specifier.slice(0, -3) : specifier;
      for (const candidate of [base + '.ts', base + '/index.ts']) {
        try {
          return nextResolve(candidate, context);
        } catch {
          // try the next candidate
        }
      }
      throw error;
    }
  },
});

const { guardianFor, makeGenome } = await import('@cf/domain-genome');
const { crossGenome } = await import('@cf/domain-genetics');
const { buildRecipe, RENDERER_VERSION } = await import('@cf/art-recipe');
const { compose } = await import('@cf/art-compose');
const { testCatalogue } = await import('@cf/art-testparts');

const BOTH = ['rest', 'strike'];
const REST = ['rest'];
const rosters = JSON.parse(readFileSync(new URL('../fixtures/current/rosters.json', import.meta.url), 'utf8'));
// fixtures/current/rosters.json holds each world's roster at ecology epochs 0, 1, 2, 3, 6 and 12, in that order.
const EPOCH_INDEX = { 0: 0, 12: 5 };
const PLANET_SEEDS = { kaum: 1757105165, osum: 51464061 };

/** [label, genome, poses] in recording order. */
const specs = [];
for (let seed = 1; seed <= 200; seed++) specs.push([`seed ${seed}`, makeGenome(seed, 'fauna', 1), BOTH]);
// Medium-tier quadrupeds (size 2, movement 0, torso 0-2), so that many entries compose real parts.
for (let seed = 1; seed <= 60; seed++) specs.push([`medium quadruped ${seed}`, { ...makeGenome(seed, 'fauna', 1), size: 2, loco: 0, body: seed % 3 }, BOTH]);
// The real rosters of Kaum and Osum: every fauna genome at epochs 0 and 12, every other kingdom at epoch 0 (stand-ins).
for (const world of ['kaum', 'osum']) {
  for (const epoch of [0, 12]) {
    rosters[world][EPOCH_INDEX[epoch]].forEach((genome, i) => {
      if (genome.kingdom === 'fauna') specs.push([`${world} e${epoch} #${i}`, genome, BOTH]);
    });
  }
  rosters[world][EPOCH_INDEX[0]].forEach((genome, i) => {
    if (genome.kingdom !== 'fauna') specs.push([`${world} e0 #${i}`, genome, REST]);
  });
}
// Both real Guardians, as the game makes them for these worlds.
for (const world of ['kaum', 'osum']) specs.push([`guardian ${world}`, guardianFor(PLANET_SEEDS[world]).genome, BOTH]);
// Bred: two crosses of Kaum fauna (epoch 0), and the same two with the parents swapped.
const kaumFauna = rosters.kaum[EPOCH_INDEX[0]].map((genome, i) => [i, genome]).filter(([, g]) => g.kingdom === 'fauna');
for (const [[i, a], [j, b]] of [[kaumFauna[0], kaumFauna[1]], [kaumFauna[2], kaumFauna[3]]]) {
  specs.push([`bred kaum e0 #${i} x #${j}`, crossGenome(a, b), REST]);
  specs.push([`bred kaum e0 #${j} x #${i}`, crossGenome(b, a), REST]);
}
// Extremophiles: a medium quadruped with the marker set, movement genes reaching both swimming entries (1, 2; 10.6 and
// 10 drift to 1) and land entries (0, 4; -1 wraps to 8).
const extremeBase = { ...makeGenome(61, 'fauna', 1), size: 2, body: 0, x: 1 };
for (const loco of [0, 1, 2, 4, 10.6, -1]) specs.push([`extremophile loco ${loco}`, { ...extremeBase, loco }, BOTH]);
// Aerial flora: a flora genome with the game's air-flora marker (af), whose form reads the aerial table.
specs.push(['aerial flora', { ...makeGenome(62, 'flora', 1), af: 1 }, REST]);
// Body routing: what the design adds, each at rest and strike, with literal genomes. A medium creature on land (grazers,
// the deep forest canopy), four legs, four eyes, spotted, slick skin (no back part); airborne is gliders, aquatic
// swimmers. A fish that keeps something is fusiform on an even seed (seedShape), so each of the four is given seed 2.
const routed = { kingdom: 'fauna', size: 2, loco: 0, habitat: 0, body: 0, head: 0, tail: 1, limbs: 1, eyes: 1, pattern: 2, skin: 3, color: 3, accent: 5, lumin: false, trait: 0, seed: 1 };
const AIRBORNE = { loco: 3 };
const AQUATIC = { loco: 4 };
for (const [label, genes] of [
  ['membranous land', { body: 7 }],
  ['membranous airborne', { body: 7, ...AIRBORNE }],
  ['membranous aquatic', { body: 7, ...AQUATIC }],
  ['fourwinged aquatic', { body: 14, ...AQUATIC }],
  ['sturdy airborne (sails)', { body: 0, ...AIRBORNE }],
  ['shelled land', { body: 6 }],
  ['crystalline land', { body: 8 }],
  ['spindly land', { body: 12 }],
  ['fusiform fish keeping its shell', { body: 6, ...AQUATIC, tail: 2, seed: 2 }],
  ['fusiform fish keeping its crystals', { body: 8, ...AQUATIC, tail: 2, seed: 2 }],
  ['fusiform fish keeping its tusks', { body: 10, ...AQUATIC, tail: 2, seed: 2 }],
  ['fusiform fish keeping its horn', { body: 11, ...AQUATIC, tail: 2, seed: 2 }],
  ['sturdy with tail 0 (t0)', { body: 0, tail: 0 }],
  ['sturdy with eyes gene 5 (pits)', { body: 0, eyes: 5 }],
  ['sturdy with the eyeless head (pits)', { body: 0, head: 2 }],
  ['translucent sturdy', { body: 0, skin: 7 }],
  ['luminous crystalline', { body: 8, lumin: true }],
  ['tusked with head 8 (hornlet)', { body: 10, head: 8 }],
  ['sturdy with head 3 (horn)', { body: 0, head: 3 }],
  ['sturdy with trait 11 (horn)', { body: 0, trait: 11 }],
]) specs.push([`routed ${label}`, { ...routed, ...genes }, BOTH]);

const catalogue = testCatalogue();
const entries = [];
for (const [label, genome, poses] of specs) {
  const recipe = buildRecipe(genome, [], catalogue);
  for (const pose of poses) {
    const { hash, gaps, contact } = compose(recipe, pose, catalogue);
    entries.push({ label, genome, pose, hash, gaps: [...gaps], contact: contact === null ? null : [...contact] });
  }
}

// Stable key order is fixed by the literal order above; one entry per line.
const lines = entries.map((e) => '    ' + JSON.stringify({ label: e.label, genome: sortKeys(e.genome), pose: e.pose, hash: e.hash, gaps: e.gaps, contact: e.contact }));
function sortKeys(object) {
  return Object.fromEntries(Object.keys(object).sort().map((k) => [k, object[k]]));
}
const text = `{\n  "rendererVersion": ${RENDERER_VERSION},\n  "catalogue": "art-testparts",\n  "entries": [\n${lines.join(',\n')}\n  ]\n}\n`;
const out = new URL('../fixtures/art/quadruped-v1.json', import.meta.url);
mkdirSync(fileURLToPath(new URL('./', out)), { recursive: true });
writeFileSync(out, text);
const real = entries.filter((e) => !e.gaps.some((g) => g.startsWith('fallback:'))).length;
console.log(`recorded ${entries.length} entries, ${real} compose a real creature (any family), ${entries.length - real} record a stand-in`);
