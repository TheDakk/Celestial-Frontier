// Painted arena registration (2026-10-01): registering an accepted plate set = ONE line in arena-deliveries.json naming its delivery
// manifest (cf.arena-delivery/v1). This module reads every manifest, checks its paths and runtime hashes, and generates
// apps/game/src/battle2/arena-sets.generated.json — the rows battle2/arena-registry.ts routes by. The runtime paths are the
// manifest's own (e.g. the approved despilled MID), never hard-coded here. build-shipped-battle2.mjs calls writeArenaSets and
// ships each set's runtime files; arena-registry.test.ts holds the drift gate (generated file = this module's output) and runs
// the pixel/recipe delivery contract (battle2/arena-delivery.ts) on every registered set.
// Run alone from port/v2: node tools/morph/arena-sets.mjs
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto'; import { fileURLToPath } from 'node:url';
export const ARENA_DELIVERIES_FILE = 'port/v2/tools/morph/arena-deliveries.json';
export const ARENA_SETS_GENERATED = 'port/v2/apps/game/src/battle2/arena-sets.generated.json';
/** The physical media a painted arena set can show (a dry stage, or the inside of a body of water). */
export const ARENA_MEDIA = Object.freeze(['ground', 'water']);
const SAFE = /^audits\/(?!.*\.\.)[A-Za-z0-9_./-]+$/, HEX64 = /^[0-9a-f]{64}$/;
const sha = (b) => createHash('sha256').update(b).digest('hex');
const readJson = (R, rel) => JSON.parse(fs.readFileSync(path.join(R, rel), 'utf8'));

/** One delivery manifest, checked: every path repo-relative under audits/, every file present, every runtime hash equal to its bytes. */
export function readArenaDelivery(R, rel) {
  if (typeof rel !== 'string' || !SAFE.test(rel)) throw new Error(`arena delivery ${rel}: path must be repo-relative under audits/`);
  return checkArenaDelivery(R, rel, readJson(R, rel));
}
/** The same check on an already-parsed manifest `m` (named `rel` in every message). */
export function checkArenaDelivery(R, rel, m) {
  const at = `arena delivery ${rel}`;
  if (m?.schema !== 'cf.arena-delivery/v1') throw new Error(`${at}: schema "${m?.schema}" ≠ "cf.arena-delivery/v1"`);
  if (typeof m.id !== 'string' || !/^[a-z0-9-]+$/.test(m.id)) throw new Error(`${at}: id must be kebab-case`);
  if (typeof m.biome !== 'string' || !/^[a-z]+$/.test(m.biome)) throw new Error(`${at}: biome must be a live biome key`);
  const file = (what, p) => { if (typeof p !== 'string' || !SAFE.test(p)) throw new Error(`${at}: ${what} must be repo-relative under audits/`); if (!fs.existsSync(path.join(R, p))) throw new Error(`${at}: ${what} ${p} is missing`); return p; };
  const recipe = file('recipe', m.recipe), acceptance = file('acceptance', m.acceptance), plates = {}, masters = {};
  for (const id of ['far', 'mid', 'near']) {
    const p = m.plates?.[id]; if (!p) throw new Error(`${at}: plates.${id} missing (three plates: far, mid, near)`);
    masters[id] = file(`plates.${id}.master`, p.master); plates[id] = file(`plates.${id}.runtime`, p.runtime);
    if (typeof p.runtimeSha256 !== 'string' || !HEX64.test(p.runtimeSha256)) throw new Error(`${at}: plates.${id}.runtimeSha256 must be a lowercase SHA-256`);
    const actual = sha(fs.readFileSync(path.join(R, p.runtime))); if (actual !== p.runtimeSha256) throw new Error(`${at}: plates.${id}.runtime ${p.runtime} hashes ${actual.slice(0, 12)}…, the manifest says ${p.runtimeSha256.slice(0, 12)}…`);
  }
  // 2026-10-02: the set's physical MEDIUM is the recipe's own `medium` ('ground' when absent — the accepted temperate recipe predates the
  // field); a manifest may restate it, and must then agree. A 'water' set is drawn only for a water fight (battle2/arena-registry.ts).
  const recipeMedium = readJson(R, recipe).medium ?? 'ground';
  if (!ARENA_MEDIA.includes(recipeMedium)) throw new Error(`${at}: recipe ${recipe} medium "${recipeMedium}" is not one of ${ARENA_MEDIA.join(', ')}`);
  if (m.medium !== undefined && m.medium !== recipeMedium) throw new Error(`${at}: medium "${m.medium}" disagrees with its recipe's "${recipeMedium}"`);
  return Object.freeze({ id: m.id, biome: m.biome, medium: recipeMedium, delivery: rel, recipe, acceptance, far: plates.far, mid: plates.mid, near: plates.near, masters: Object.freeze(masters) });
}
export function arenaSetsFromDeliveries(R) {
  const list = readJson(R, ARENA_DELIVERIES_FILE);
  if (list?.schema !== 'cf.arena-deliveries/v1' || !Array.isArray(list.deliveries)) throw new Error(`${ARENA_DELIVERIES_FILE}: schema cf.arena-deliveries/v1 with a deliveries array required`);
  const sets = list.deliveries.map((rel) => readArenaDelivery(R, rel)), ids = new Set();
  for (const s of sets) { if (ids.has(s.id)) throw new Error(`arena deliveries: duplicate id ${s.id}`); ids.add(s.id); }
  return { schema: 'cf.arena-sets/v1', generatedBy: 'port/v2/tools/morph/arena-sets.mjs from ' + ARENA_DELIVERIES_FILE, sets };
}
export const arenaSetsSource = (R) => JSON.stringify(arenaSetsFromDeliveries(R), null, 1) + '\n';
/** Writes the generated rows; returns the sets (build-shipped-battle2.mjs ships their runtime files). */
export function writeArenaSets(R) { const text = arenaSetsSource(R); fs.writeFileSync(path.join(R, ARENA_SETS_GENERATED), text); return JSON.parse(text).sets; }
/** Every runtime file a registered set needs served (repo-relative). */
export const arenaRuntimeFiles = (sets) => sets.flatMap((s) => [s.recipe, s.far, s.mid, s.near]);

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const R = path.resolve(import.meta.dirname, '../../../..'); const sets = writeArenaSets(R);
  console.log(JSON.stringify({ wrote: ARENA_SETS_GENERATED, sets: sets.map((s) => `${s.id} (${s.biome})`) }));
}
