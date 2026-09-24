// Ships the battle2 runtime assets INSIDE the app (`apps/game/public/battle2/audits/…`, served at `/battle2/…`): the arena
// proof (recipe, anchors, plates, keyed phase images), every painted archetype's runtime files (record, binding, alpha-only
// cut-out, manifest, atlas, markings) and their painter masters at their `record.source` paths — the same relative layout
// `battle2-wiring.ts` resolves against the recipe URL, so the wiring is unchanged. The app never fetches evidence folders;
// the preview producer's exact-commit snapshot (port/v2 only) carries everything the playtest needs. Deterministic copy.
// Run from port/v2: node tools/morph/build-shipped-battle2.mjs
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto';
import { CARD_ARCHETYPES } from './build-card-masters.mjs';
import { repoRelativeSource } from '../creature-animation/record-source.mjs';
import { PNG } from 'pngjs';
const R = path.resolve(import.meta.dirname, '../../../..'), OUT = path.join(R, 'port/v2/apps/game/public/battle2');
const ARENA = 'audits/ARENA_EFFECTS_V42_PROOF_20260912/';
// every painted archetype — the card builder's list is the one source (the card, the arena and these shipped files agree)
// The arena reads ONLY the alpha of each keyed cut-out (the rig's alpha + alpha box; its colour comes from the part atlas), so
// each ships as `parts/alpha.png`: RGB zero, alpha byte-identical to the keyed cut-out, decoded by the same path. 18 MB -> 2 MB
// (2026-09-24). battle2-archetypes.test.ts proves the alpha equal to the source for every archetype.
const alphaOnly = new Set();
const alphaOnlyPng = (bytes) => { const src = PNG.sync.read(bytes), out = new PNG({ width: src.width, height: src.height });
  for (let i = 0; i < src.width * src.height; i++) out.data[i * 4 + 3] = src.data[i * 4 + 3]; // RGB stays 0
  return PNG.sync.write(out, { deflateLevel: 9, colorType: 6 }); };
const FITS = CARD_ARCHETYPES.map((a) => a.dir), MARKINGS = CARD_ARCHETYPES.map((a) => a.markings ?? a.dir);
const files = new Set([ARENA + 'arena-recipe.json', ARENA + 'wild-anchors.json', ARENA + 'arena-far.png', ARENA + 'keyed/arena-mid.png', ARENA + 'keyed/arena-near.png', 'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json', 'audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png']);
const anchors = JSON.parse(fs.readFileSync(path.join(R, ARENA, 'wild-anchors.json'), 'utf8')); for (const p of anchors.phases ?? []) if (p.keyedImage && !/^procedural:/.test(p.keyedImage)) files.add(ARENA + p.keyedImage);
for (const dir of FITS) { const record = JSON.parse(fs.readFileSync(path.join(R, dir, 'record.json'), 'utf8')), manifest = JSON.parse(fs.readFileSync(path.join(R, dir, 'parts/manifest.json'), 'utf8'));
  for (const f of ['record.json', 'binding.json', 'parts/manifest.json', 'parts/atlas/' + manifest.creatureId + '.png']) files.add(dir + f);
  alphaOnly.add(dir + 'parts/keyed.png');
  if (typeof record.source === 'string') files.add(repoRelativeSource(record.source));
  const mdir = MARKINGS[FITS.indexOf(dir)]; if (fs.existsSync(path.join(R, mdir, 'markings.json'))) { files.add(mdir + 'markings.json'); const mj = JSON.parse(fs.readFileSync(path.join(R, mdir, 'markings.json'), 'utf8')); for (const v of Object.values(mj.patterns ?? {})) if (v?.file) files.add(mdir + v.file); } }
fs.rmSync(OUT, { recursive: true, force: true });
const manifest = []; let bytes = 0;
for (const rel of [...files].sort()) { const src = path.join(R, rel), dst = path.join(OUT, rel); if (!fs.existsSync(src)) throw Error('missing ' + rel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); const b = fs.readFileSync(src); bytes += b.length; manifest.push({ path: rel, bytes: b.length, sha256: createHash('sha256').update(b).digest('hex') }); }
for (const rel of [...alphaOnly].sort()) { const src = fs.readFileSync(path.join(R, rel)), out = alphaOnlyPng(src), dstRel = rel.replace(/keyed\.png$/, 'alpha.png'), dst = path.join(OUT, dstRel);
  fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, out); bytes += out.length;
  manifest.push({ path: dstRel, bytes: out.length, sha256: createHash('sha256').update(out).digest('hex'), derivedFrom: { path: rel, sha256: createHash('sha256').update(src).digest('hex'), keep: 'alpha' } }); }
manifest.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
fs.writeFileSync(path.join(OUT, 'MANIFEST.json'), JSON.stringify({ schema: 'cf.shipped-battle2/v1', mirroredBy: 'tools/morph/build-shipped-battle2.mjs', recipe: '/battle2/' + ARENA + 'arena-recipe.json', files: manifest }, null, 1) + '\n');
console.log(JSON.stringify({ files: manifest.length, mb: +(bytes / 1048576).toFixed(1) }));
