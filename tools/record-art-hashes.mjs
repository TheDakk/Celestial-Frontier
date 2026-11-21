// Records the golden hashes of composed test-catalogue creatures into fixtures/art/quadruped-v1.json.
// Usage: node tools/record-art-hashes.mjs   (no arguments; reads and writes only inside this repository)
// Deterministic: running it twice writes a byte-identical file.
import { registerHooks } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
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

const { makeGenome } = await import('@cf/domain-genome');
const { buildRecipe, RENDERER_VERSION } = await import('@cf/art-recipe');
const { compose } = await import('@cf/art-compose');
const { testCatalogue } = await import('@cf/art-testparts');

const POSES = ['rest', 'strike'];

// Stand-ins with the body types of real worlds' creatures: literal gene values written here,
// not copied from the game's generators.
const NAMED = [
  ['kaum quadruped stilt', false, { kingdom: 'fauna', seed: 9001, body: 2, loco: 7, size: 3, head: 4, tail: 2, pattern: 1, skin: 0, limbs: 0, eyes: 0, color: 5, accent: 9, lumin: false }],
  ['kaum quadruped armored A', false, { kingdom: 'fauna', seed: 9002, body: 1, loco: 15, size: 4, head: 6, tail: 3, pattern: 4, skin: 4, limbs: 3, eyes: 2, color: 2, accent: 11, lumin: true }],
  ['kaum quadruped armored B', false, { kingdom: 'fauna', seed: 9003, body: 1, loco: 9, size: 3, head: 1, tail: 5, pattern: 2, skin: 2, limbs: 4, eyes: 4, color: 7, accent: 3, lumin: false }],
  ['guardian quadruped', true, { kingdom: 'fauna', seed: 9004, body: 0, loco: 17, size: 5, head: 3, tail: 6, pattern: 7, skin: 7, limbs: 3, eyes: 1, color: 13, accent: 2, lumin: true }],
];

const specs = [];
for (let seed = 1; seed <= 200; seed++) specs.push([`seed ${seed}`, false, makeGenome(seed, 'fauna', 1)]);
for (const named of NAMED) specs.push(named);
// Medium-tier quadrupeds (size 2, movement 0, torso 0-2), so that many entries compose real parts.
for (let seed = 1; seed <= 60; seed++) specs.push([`medium quadruped ${seed}`, false, { ...makeGenome(seed, 'fauna', 1), size: 2, loco: 0, body: seed % 3 }]);


const catalogue = testCatalogue();
const entries = [];
for (const [label, guardian, genome] of specs) {
  const recipe = buildRecipe(genome, [], catalogue);
  for (const pose of POSES) {
    const { hash, gaps } = compose(recipe, pose, catalogue);
    entries.push({ label, genome, guardian, pose, hash, gaps: [...gaps] });
  }
}

// Stable key order is fixed by the literal order above; one entry per line.
const lines = entries.map((e) => '    ' + JSON.stringify({ label: e.label, genome: sortKeys(e.genome), guardian: e.guardian, pose: e.pose, hash: e.hash, gaps: e.gaps }));
function sortKeys(object) {
  return Object.fromEntries(Object.keys(object).sort().map((k) => [k, object[k]]));
}
const text = `{\n  "rendererVersion": ${RENDERER_VERSION},\n  "catalogue": "art-testparts",\n  "entries": [\n${lines.join(',\n')}\n  ]\n}\n`;
const out = new URL('../fixtures/art/quadruped-v1.json', import.meta.url);
mkdirSync(fileURLToPath(new URL('./', out)), { recursive: true });
writeFileSync(out, text);
const real = entries.filter((e) => !e.gaps.some((g) => g.startsWith('fallback:'))).length;
console.log(`recorded ${entries.length} entries, ${real} compose a real quadruped`);
