// D30 runtime switch (Claude, 2026-10-02). Run from the repo root AFTER `node port/v2/tools/morph/arena-webp.mjs` wrote the WebP copies:
//   node audits/ARENA_WEBP_D30_20261002/switch-runtimes.mjs
// 1. Switches every already-registered delivery manifest's runtime plates to the WebP copies (runtimeSource = the PNG it was encoded from).
// 2. For each of the 36 pending C132 D29 candidates (every inventory row not registered): writes `<id>/d29/delivery.webp.pending.json`
//    (WebP runtimes, the pending acceptance record). It registers nothing: acceptance is Dakk's. The PNG pending files stay byte-unchanged.
// Idempotent: re-running rewrites the same bytes.
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto';

const R = path.resolve(import.meta.dirname, '../..'), sha = (rel) => createHash('sha256').update(fs.readFileSync(path.join(R, rel))).digest('hex');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(R, rel), 'utf8')), write = (rel, v, indent = 2) => fs.writeFileSync(path.join(R, rel), JSON.stringify(v, null, indent) + '\n');
const webp = (png) => png.replace(/\.png$/, '.webp');
const DELIVERIES = 'port/v2/tools/morph/arena-deliveries.json', INVENTORY = 'audits/C132_ARENAS_20261001/complete-candidate-inventory.json';
const RECEIPT = 'audits/ARENA_WEBP_D30_20261002/receipt.json';
const AIR_NOTE = 'Recipe medium "air" (a gas-giant cloud deck): to be registered as a GROUND set, the fighters standing on the cloud layer. There is no air routing medium. Pending Dakk\'s acceptance.';

/** A plate whose runtime is a PNG → the same plate with its WebP copy as runtime. Already-switched plates are returned unchanged. */
function toWebp(plate) {
  if (plate.runtime.endsWith('.webp')) return plate;
  const out = webp(plate.runtime); if (!fs.existsSync(path.join(R, out))) throw Error(`missing WebP copy ${out}: run arena-webp.mjs first`);
  if (sha(plate.runtime) !== plate.runtimeSha256) throw Error(`PNG runtime ${plate.runtime} drifted from its manifest hash`);
  return { master: plate.master, runtime: out, runtimeSha256: sha(out), runtimeSource: { path: plate.runtime, sha256: plate.runtimeSha256 } };
}
const withPlates = (m) => ({ ...m, plates: { far: toWebp(m.plates.far), mid: toWebp(m.plates.mid), near: toWebp(m.plates.near) }, runtimeEncoding: `D30 WebP runtime copies (Dakk 2026-10-02); encoder port/v2/tools/morph/arena-webp.mjs, receipt ${RECEIPT}` });

const list = read(DELIVERIES), registered = new Set(list.deliveries);
// 1. the registered sets switch to WebP (their manifests keep every other field)
for (const rel of list.deliveries) { const m = read(rel); write(rel, withPlates(m), rel.includes('ARENA_ROUTING') ? 1 : 2); }
const registeredIds = new Set(list.deliveries.map((rel) => read(rel).id));
// 2. the pending candidates (every inventory row not registered): a sibling `d29/delivery.webp.pending.json` naming the WebP runtimes, its
//    acceptance still the PENDING record. Nothing is registered and no acceptance is written here: acceptance is Dakk's, recorded by him.
const pendingWritten = [];
for (const row of read(INVENTORY).rows) {
  if (registeredIds.has(row.id)) continue;
  const dir = path.posix.dirname(row.manifest), pending = read(row.manifest), recipe = read(pending.recipe);
  const medium = recipe.medium === 'air' ? 'ground' : (recipe.medium ?? 'ground');
  write(dir + '/delivery.webp.pending.json', withPlates({ schema: pending.schema, id: pending.id, biome: pending.biome, medium, ...(recipe.medium === 'air' ? { mediumNote: AIR_NOTE } : {}), recipe: pending.recipe, acceptance: pending.acceptance, plates: pending.plates }));
  pendingWritten.push(row.id);
}
write(DELIVERIES, list, 1);
console.log(JSON.stringify({ switchedToWebp: [...registeredIds], pendingWebpManifests: pendingWritten.length, registered: list.deliveries.length }));
