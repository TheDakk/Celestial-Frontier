// Card masters (Nick 2026-09-22: the painted individual is the creature EVERYWHERE, phone included — D1 amended for
// the card): a sealed ≤512² downscale of each archetype's master + its labels (nearest), derived once, deterministic,
// so a phone renders the individual's card without the full master. Run from port/v2:
//   node tools/morph/build-card-masters.mjs
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto';
import { readPng, writePng } from '../anatomy-verify/png.mjs';
import { repoRelativeSource } from '../creature-animation/record-source.mjs';
import { familyContractForRecord } from '../creature-animation/family-contracts.mjs';
import { validateFixedPivots } from '../creature-animation/fixed-attachments.mjs';
export const CARD_MASTER_SIDE = 512;
const R = path.resolve(import.meta.dirname, '../../../..');
/** Shipped copies live INSIDE port/v2 (the preview producer archives only the v2 subtree; the app never imports evidence
 * folders): `port/v2/apps/game/assets/painted-cards/<key>/` mirrors each fit's card + record + markings. */
export const SHIPPED_ROOT = 'port/v2/apps/game/assets/painted-cards/';
/** One entry per painted archetype. `key` is its shipped folder; `markings` (optional) is the folder whose `markings.json` binds
 * the archetype's painted masks when they live outside the fit (the Salmon's six masks are their own packet). The build tool
 * GENERATES the app registry (`apps/game/src/morph/card-archetypes.ts`) and the explicit asset map
 * (`apps/game/src/painted-cards.assets.ts`) from this list — one source, so the app can never ship a card without its masks
 * (found 2026-09-23: the hand-kept asset map had no markings entries and every in-app card rendered plain). */
export const CARD_ARCHETYPES = Object.freeze([
  { earthName: 'Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/', key: 'crab' },
  { earthName: 'Coconut Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/coconut-crab/', key: 'coconut-crab' },
  { earthName: 'Freshwater Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/freshwater-crab/', key: 'freshwater-crab' },
  { earthName: 'Mud Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/mud-crab/', key: 'mud-crab' },
  { earthName: 'Vent Crab', dir: 'audits/ANATOMY_COMPLETION_20260917/crab-fits-03/vent-crab/', key: 'vent-crab' },
  { earthName: 'Civet', dir: 'audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/', key: 'civet-sentinel-input-01' },
  // the archetype sprint (Codex, signed 2026-09-22/23; Nick accepted the art 2026-09-23) — one per body plan
  { earthName: 'Salmon', dir: 'audits/ARCHETYPE_SPRINT_20260922/02-fish/fit-01/', key: 'salmon', markings: 'audits/ARCHETYPE_SPRINT_20260922/13-fish-markings/' },
  { earthName: 'Eagle', dir: 'audits/ARCHETYPE_REPAIRS_20260922/03-biped-bird/fit-12/', key: 'eagle' },
  { earthName: 'Beetle', dir: 'audits/ARCHETYPE_FINISH_20260923/04-insect/fit-04/', key: 'beetle' },
  { earthName: 'Python', dir: 'audits/PYTHON_OPEN_POSE_20260923/candidate-02/fit-01/', key: 'python' },
  { earthName: 'Tree Frog', dir: 'audits/ARCHETYPE_FINISH_20260923/06-hopper/fit-05/', key: 'tree-frog' },
  { earthName: 'Chimpanzee', dir: 'audits/ARCHETYPE_FINISH_20260923/07-primate/fit-02/', key: 'chimpanzee' },
  { earthName: 'Starfish', dir: 'audits/ARCHETYPE_REPAIRS_20260922/08-radial/fit-02/', key: 'starfish' },
  { earthName: 'Tarantula', dir: 'audits/ARCHETYPE_FINISH_20260923/09-arachnid/fit-03/', key: 'tarantula' },
  { earthName: 'Octopus', dir: 'audits/ARCHETYPE_REPAIRS_20260922/10-cephalopod/fit-02/', key: 'octopus' },
  { earthName: 'Fruit Bat', dir: 'audits/ARCHETYPE_FINISH_20260923/11-flyer-membrane/fit-02/', key: 'fruit-bat' },
  { earthName: 'Centipede', dir: 'audits/ARCHETYPE_FINISH_20260923/12-myriapod/fit-11/', key: 'centipede' },
  // C15 (Codex, signed 2026-09-25; D1 standing order): candidates Codex marked READY — only the named fits, masks bound to the
  // same recipe at the packet root. `weapons` is a hash-bound painter weapon declaration the arena passes to compileAnatomyAttack.
  { earthName: 'Bass', dir: 'audits/ART_BATTLE_FOCUS_20260925/08-bass/fit-05/', key: 'bass', markings: 'audits/ART_BATTLE_FOCUS_20260925/08-bass/' },
  { earthName: 'Tang', dir: 'audits/ART_BATTLE_FOCUS_20260925/10-tang/fit-06/', key: 'tang', markings: 'audits/ART_BATTLE_FOCUS_20260925/10-tang/' },
  { earthName: 'Dragonfly', dir: 'audits/ART_BATTLE_FOCUS_20260925/dragonfly-repair-03/fit-03/', key: 'dragonfly', markings: 'audits/ART_BATTLE_FOCUS_20260925/dragonfly-repair-03/' },
  { earthName: 'Jellyfish', dir: 'audits/ART_BATTLE_FOCUS_20260925/jellyfish-repair-03/fit-06/', key: 'jellyfish', markings: 'audits/ART_BATTLE_FOCUS_20260925/jellyfish-repair-03/', weapons: 'audits/ART_BATTLE_FOCUS_20260925/jellyfish-repair-03/weapon-declaration.json' },
]);
const sha = (b) => createHash('sha256').update(b).digest('hex');
const box = (img, dw, dh) => { const o = new Uint8Array(dw * dh * 4), sx = img.width / dw, sy = img.height / dh;
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx)), y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy)); let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const i = (yy * img.width + xx) * 4, al = img.data[i + 3]; r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al; a += al; n++; }
    const j = (y * dw + x) * 4; if (a > 0) { o[j] = Math.round(r / a); o[j + 1] = Math.round(g / a); o[j + 2] = Math.round(b / a); o[j + 3] = Math.round(a / n); } } return o; };
const nearest = (img, dw, dh) => { const o = new Uint8Array(dw * dh * 4), sx = img.width / dw, sy = img.height / dh; for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const i = (Math.floor((y + 0.5) * sy) * img.width + Math.floor((x + 0.5) * sx)) * 4, j = (y * dw + x) * 4; o[j] = img.data[i]; o[j + 1] = img.data[i + 1]; o[j + 2] = img.data[i + 2]; o[j + 3] = img.data[i + 3]; } return o; };
/** The stage's source-fixed joint sockets (Codex's compact myriapod) — baked into the card receipt so the card pivots those joints
 * exactly where the stage's skeleton program does (2026-09-24 review finding). Absent when the family declares none. */
function fixedPivotsOf(record) { const fp = validateFixedPivots(familyContractForRecord(record)); return fp && Object.keys(fp).length ? { fixedPivots: fp } : {}; }
const SHIPPED_FILES = ['card/card.json', 'record.json', 'card/master-512.png', 'card/labels-512.png'];
/** The generated app registry and explicit `?url` asset map (text only — deterministic from the list and the shipped markings). */
/** `name: 'value'` — built by a helper so this file's text holds exactly ONE `earthName` literal per archetype (the registry test counts them). */
const field = (name, value) => `${name}: '${value}'`;
export function generatedSources(archetypes, markingsFilesOf) {
  const head = '// GENERATED by tools/morph/build-card-masters.mjs from its CARD_ARCHETYPES list — do not edit by hand; re-run the tool.\n';
  const registry = head + "import type { PaintedCardArchetype } from './painted-card-source.js';\nexport const CARD_ARCHETYPES: readonly PaintedCardArchetype[] = Object.freeze([\n"
    + archetypes.map((a) => `  { ${field('earthName', a.earthName)}, ${field('dir', SHIPPED_ROOT + a.key + '/')} },\n`).join('') + ']);\n';
  const imports = [], rows = [];
  archetypes.forEach((a, n) => { const files = [...SHIPPED_FILES, ...markingsFilesOf(a)], entries = [];
    files.forEach((f, m) => { const id = `a${n}_${m}`; imports.push(`import ${id} from '../assets/painted-cards/${a.key}/${f}?url';`); entries.push(`'${f}': ${id}`); });
    rows.push(`  ['${SHIPPED_ROOT}${a.key}/', { ${entries.join(', ')} }],`); });
  const assets = head + imports.join('\n') + '\n/** Repo-relative shipped archetype dir → its shipped asset URLs by file (card, record, and the painted masks when it has them). */\n'
    + 'export const CARD_ASSET_URLS: ReadonlyMap<string, Readonly<Record<string, string>>> = new Map([\n' + rows.join('\n') + '\n]);\n';
  // the ARENA's parts-fit list (battle2-wiring.ts): fit dirs relative to the arena proof directory, the markings dir when the
  // masks live outside the fit (the Salmon) — the same archetypes, so a creature on the card can always fight
  const rel = (repo) => '../' + repo.slice('audits/'.length);
  const arena = head + "/** One entry per painted archetype that can FIGHT: its source paint-skin fit (and its painted masks' folder when they\n * live outside the fit), relative to the arena proof directory the battle2 wiring resolves against. */\n"
    + 'export interface Battle2PartsFit { readonly earthName: string; readonly dir: string; readonly markingsDir?: string; readonly weaponDeclaration?: string; }\n'
    + 'export const BATTLE2_PARTS_FITS: readonly Battle2PartsFit[] = Object.freeze([\n'
    + archetypes.map((a) => `  Object.freeze({ ${field('earthName', a.earthName)}, ${field('dir', rel(a.dir))}${a.markings ? ', ' + field('markingsDir', rel(a.markings)) : ''}${a.weapons ? ', ' + field('weaponDeclaration', rel(a.weapons)) : ''} }),\n`).join('') + ']);\n';
  return { registry, assets, arena };
}
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const shippedMarkings = new Map();
  for (const a of CARD_ARCHETYPES) {
    const dir = path.join(R, a.dir), record = JSON.parse(fs.readFileSync(path.join(dir, 'record.json'))), masterBytes = fs.readFileSync(path.join(R, repoRelativeSource(record.source))), binding = JSON.parse(fs.readFileSync(path.join(dir, 'binding.json')));
    if (binding.recordRecipeHash !== record.recipeHash) throw Error(a.earthName + ': binding sealed for another record');
    const master = readPng(masterBytes);
    // the cut-out's alpha is `parts/keyed.png` (record.geometry space) — a master may be an opaque keyed painting (the Civet)
    const keyedBytes = fs.readFileSync(path.join(dir, 'parts/keyed.png')), keyed = readPng(keyedBytes); if (keyed.width !== master.width || keyed.height !== master.height) throw Error(a.earthName + ': keyed size');
    for (let i = 0; i < master.width * master.height; i++) master.data[i * 4 + 3] = keyed.data[i * 4 + 3];
    let labels, labelList, labelSource, labelsSha256;
    if (fs.existsSync(path.join(dir, 'labels.png'))) { // the compiler/hand-fit label map + declaration order (value = index + 1)
      const labelsBytes = fs.readFileSync(path.join(dir, 'labels.png')); labels = readPng(labelsBytes); labelsSha256 = sha(labelsBytes); labelSource = 'labels.png + declaration.json';
      const decl = JSON.parse(fs.readFileSync(path.join(dir, 'declaration.json'))); labelList = decl.parts.map((p, i) => ({ label: i + 1, id: p.id, joint: p.joint, layer: p.layer }));
    } else { // derived from the binding: each part's atlas frame alpha painted into its cut-out box, far layer first, value = part index + 1
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'parts/manifest.json'))), atlas = readPng(fs.readFileSync(path.join(dir, 'parts/atlas/' + manifest.creatureId + '.png')));
      const parts = binding.parts.filter((p) => p.kind === 'part'); labelList = parts.map((p, i) => ({ label: i + 1, id: p.id, joint: p.joint, layer: p.layer }));
      const data = new Uint8Array(master.width * master.height * 4); const order = [...parts.entries()].sort((x, y) => (x[1].layer === y[1].layer ? 0 : x[1].layer === 'far' ? -1 : 1));
      for (const [i, p] of order) for (let y = 0; y < p.frame.height; y++) for (let x = 0; x < p.frame.width; x++) { const al = atlas.data[((p.frame.y + y) * atlas.width + p.frame.x + x) * 4 + 3]; if (!al) continue; const mx = p.cutout.x + x, my = p.cutout.y + y; if (mx < 0 || my < 0 || mx >= master.width || my >= master.height) continue; const j = (my * master.width + mx) * 4; data[j] = i + 1; data[j + 3] = 255; }
      labels = { width: master.width, height: master.height, data }; labelsSha256 = sha(writePng(master.width, master.height, data)); labelSource = 'binding parts (atlas frames → cut-out boxes, far then near)';
    }
    if (labels.width !== master.width || labels.height !== master.height) throw Error(a.earthName + ': labels size');
    const s = Math.min(1, CARD_MASTER_SIDE / Math.max(master.width, master.height)), dw = Math.round(master.width * s), dh = Math.round(master.height * s);
    // written ONLY into the shipped mirror inside port/v2 — never into the fit's evidence folder (another owner's signed packet)
    const ship = path.join(R, SHIPPED_ROOT, a.key); fs.mkdirSync(path.join(ship, 'card'), { recursive: true });
    const m = writePng(dw, dh, box(master, dw, dh)), l = writePng(dw, dh, nearest(labels, dw, dh));
    fs.writeFileSync(path.join(ship, 'card/master-512.png'), m); fs.writeFileSync(path.join(ship, 'card/labels-512.png'), l);
    const receipt = { schema: 'cf.card-master/v1', earthName: a.earthName, recordRecipeHash: record.recipeHash, source: { master: repoRelativeSource(record.source), masterSha256: sha(masterBytes), keyedSha256: sha(keyedBytes), alpha: 'parts/keyed.png', labelsSha256, labelSource, width: master.width, height: master.height }, labels: labelList, landmarks: record.landmarks, ...fixedPivotsOf(record), card: { width: dw, height: dh, scale: s, masterSha256: sha(m), labelsSha256: sha(l), filter: 'alpha-weighted box; labels nearest' } };
    fs.writeFileSync(path.join(ship, 'card/card.json'), JSON.stringify(receipt, null, 1) + '\n');
    fs.copyFileSync(path.join(dir, 'record.json'), path.join(ship, 'record.json'));
    // the painted masks: bound to THIS record (a mask set painted for another fit is refused), json + every pattern file
    const mdir = path.join(R, a.markings ?? a.dir), files = [];
    if (fs.existsSync(path.join(mdir, 'markings.json'))) { const mj = JSON.parse(fs.readFileSync(path.join(mdir, 'markings.json')));
      if (mj.recordRecipeHash !== record.recipeHash) throw Error(a.earthName + ': markings sealed for another record (' + mj.recordRecipeHash + ')');
      fs.copyFileSync(path.join(mdir, 'markings.json'), path.join(ship, 'markings.json')); fs.mkdirSync(path.join(ship, 'markings'), { recursive: true }); files.push('markings.json');
      for (const v of Object.values(mj.patterns ?? {})) if (v?.file) { fs.copyFileSync(path.join(mdir, v.file), path.join(ship, v.file)); files.push(v.file); } }
    shippedMarkings.set(a.key, files);
    fs.writeFileSync(path.join(ship, 'SOURCE.json'), JSON.stringify({ schema: 'cf.shipped-card-archetype/v1', earthName: a.earthName, fitDir: a.dir, ...(a.markings ? { markingsDir: a.markings } : {}), mirroredBy: 'tools/morph/build-card-masters.mjs', recordRecipeHash: record.recipeHash }, null, 1) + '\n');
    console.log(JSON.stringify({ earthName: a.earthName, from: [master.width, master.height], to: [dw, dh], masterSha256: receipt.card.masterSha256.slice(0, 12), masks: Math.max(0, files.length - 1), shipped: SHIPPED_ROOT + a.key + '/' }));
  }
  const gen = generatedSources(CARD_ARCHETYPES, (a) => shippedMarkings.get(a.key) ?? []);
  fs.writeFileSync(path.join(R, 'port/v2/apps/game/src/morph/card-archetypes.ts'), gen.registry);
  fs.writeFileSync(path.join(R, 'port/v2/apps/game/src/painted-cards.assets.ts'), gen.assets);
  fs.writeFileSync(path.join(R, 'port/v2/apps/game/src/battle2-archetypes.ts'), gen.arena);
}
