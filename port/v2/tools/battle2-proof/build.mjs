/* Vite-free bundle of entry.mjs (rolldown, like quadruped-proof/build.mjs) plus the proof assets, with a
 * sha256 manifest of every source and output. Usage: node tools/battle2-proof/build.mjs <newOutDir> */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url'; import { rolldown } from 'rolldown';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..'), out = path.resolve(process.argv[2]);
if (!process.argv[2] || fs.existsSync(out)) throw Error('Build must be a new directory');
fs.mkdirSync(out, { recursive: true });
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex'), sources = new Map();
const record = (p) => { const b = fs.readFileSync(p); return { path: path.relative(repo, p), bytes: b.length, sha256: sha(b) }; };
const add = (p) => sources.set(p, record(p));
for (const name of ['entry.mjs', 'index.html', 'build.mjs', 'runner.mjs']) add(path.join(here, name));
const bundle = await rolldown({ input: path.join(here, 'entry.mjs'), platform: 'browser', plugins: [{ name: 'source-receipt', transform(_, id) { if (path.isAbsolute(id) && fs.existsSync(id) && fs.statSync(id).isFile()) add(id); } }] });
try { await bundle.write({ dir: out, format: 'es', entryFileNames: 'bundle.js', chunkFileNames: 'chunk-[hash].js' }); } finally { await bundle.close(); }
const A = 'audits/ARENA_EFFECTS_V42_PROOF_20260912/';
const assets = {
  'index.html': 'port/v2/tools/battle2-proof/index.html', 'arena-recipe.json': A + 'arena-recipe.json', 'wild-anchors.json': A + 'wild-anchors.json',
  'arena-far.png': A + 'arena-far.png', 'arena-mid.png': A + 'keyed/arena-mid.png', 'arena-near.png': A + 'keyed/arena-near.png',
  'keyed-wild-launch.png': A + 'keyed/wild-launch.png', 'keyed-wild-travel.png': A + 'keyed/wild-travel.png', 'keyed-wild-impact.png': A + 'keyed/wild-impact.png',
  'civet.landmarks.json': 'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json', 'civet.png': 'audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png', 'platypus.png': 'audits/ART_KIT_ENGINE_FIRST_20260912/masters/platypus.png',
};
for (const [name, rel] of Object.entries(assets)) { const p = path.join(repo, rel); add(p); fs.copyFileSync(p, path.join(out, name), fs.constants.COPYFILE_EXCL); }
const files = fs.readdirSync(out).map((name) => { const b = fs.readFileSync(path.join(out, name)); return { path: name, bytes: b.length, sha256: sha(b) }; });
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ sources: [...sources.values()], files }, null, 2) + '\n');
console.log(JSON.stringify({ build: out, files: files.length, sources: sources.size }));
