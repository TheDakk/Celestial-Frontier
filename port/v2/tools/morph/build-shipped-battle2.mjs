// Ships the battle2 runtime assets INSIDE the app (`apps/game/public/battle2/audits/…`, served at `/battle2/…`): the arena
// proof (recipe, anchors, plates, keyed phase images), the six accepted fits' runtime files (record, binding, keyed
// cut-out, manifest, atlas, markings) and their painter masters at their `record.source` paths — the same relative layout
// `battle2-wiring.ts` resolves against the recipe URL, so the wiring is unchanged. The app never fetches evidence folders;
// the preview producer's exact-commit snapshot (port/v2 only) carries everything the playtest needs. Deterministic copy.
// Run from port/v2: node tools/morph/build-shipped-battle2.mjs
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto';
const R = path.resolve(import.meta.dirname, '../../../..'), OUT = path.join(R, 'port/v2/apps/game/public/battle2');
const ARENA = 'audits/ARENA_EFFECTS_V42_PROOF_20260912/';
const FITS = ['audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/', 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/', 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/coconut-crab/', 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/', 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/mud-crab/', 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/vent-crab/'];
const files = new Set([ARENA + 'arena-recipe.json', ARENA + 'wild-anchors.json', ARENA + 'arena-far.png', ARENA + 'keyed/arena-mid.png', ARENA + 'keyed/arena-near.png', 'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json', 'audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png']);
const anchors = JSON.parse(fs.readFileSync(path.join(R, ARENA, 'wild-anchors.json'), 'utf8')); for (const p of anchors.phases ?? []) if (p.keyedImage && !/^procedural:/.test(p.keyedImage)) files.add(ARENA + p.keyedImage);
for (const dir of FITS) { const record = JSON.parse(fs.readFileSync(path.join(R, dir, 'record.json'), 'utf8')), manifest = JSON.parse(fs.readFileSync(path.join(R, dir, 'parts/manifest.json'), 'utf8'));
  for (const f of ['record.json', 'binding.json', 'parts/keyed.png', 'parts/manifest.json', 'parts/atlas/' + manifest.creatureId + '.png']) files.add(dir + f);
  if (typeof record.source === 'string') files.add(record.source);
  if (fs.existsSync(path.join(R, dir, 'markings.json'))) { files.add(dir + 'markings.json'); const mj = JSON.parse(fs.readFileSync(path.join(R, dir, 'markings.json'), 'utf8')); for (const v of Object.values(mj.patterns ?? {})) if (v?.file) files.add(dir + v.file); } }
fs.rmSync(OUT, { recursive: true, force: true });
const manifest = []; let bytes = 0;
for (const rel of [...files].sort()) { const src = path.join(R, rel), dst = path.join(OUT, rel); if (!fs.existsSync(src)) throw Error('missing ' + rel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); const b = fs.readFileSync(src); bytes += b.length; manifest.push({ path: rel, bytes: b.length, sha256: createHash('sha256').update(b).digest('hex') }); }
fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify({ schema: 'cf.shipped-battle2/v1', mirroredBy: 'tools/morph/build-shipped-battle2.mjs', recipe: '/battle2/' + ARENA + 'arena-recipe.json', files: manifest }, null, 1) + '\n');
console.log(JSON.stringify({ files: manifest.length, mb: +(bytes / 1048576).toFixed(1) }));
