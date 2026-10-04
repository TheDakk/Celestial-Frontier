// C13 (2026-09-25): the build-time GENERATOR of the battle2 master pins (Claude's C4 proposal as amended by Codex's review,
// `audits/ART_BATTLE_FOCUS_20260925/master-pin-review-01/README.md`). For every painted archetype that can fight it runs the
// EXISTING full byte admission of the retained original master (`admitFamilyRecord`: recipe hash, cut-out hash, identity,
// materials, bounds against the keyed alpha) plus the binding/atlas linkage, and only then emits a pin. A master that fails
// admission gets no pin and fails the build. The output is a checked-in TypeScript module whose authority is a PRIVATE
// WeakSet of its own frozen entries: it exports lookup + identity validation only, never a Map, register function or factory.
// Masters stay shipped (C4 §5) until Codex's narrow pin loader and Claude's cold/worker/offline/picker checks are green.
// Run from port/v2: node tools/morph/battle2-master-pins.mjs   (build-shipped-battle2.mjs also calls writeBattle2MasterPins)
import fs from 'node:fs'; import path from 'node:path';
import { PNG } from 'pngjs';
import { readPng } from '../anatomy-verify/png.mjs';
import { repoRelativeSource } from '../creature-animation/record-source.mjs';
import { admitFamilyRecord } from '../creature-animation/family-record.mjs';
import { hashBytes, hashJSON } from '../creature-animation/quadruped-template.mjs';
import { BATTLE2_MASTER_PINS_SCHEMA, BATTLE2_PIN_HASH_CONVENTION, SHA256_PATTERN, canonicalRepoPath, pinRecordSha256, pngHeaderSize, requireCanonicalRepoPath } from './battle2-pin-contract.mjs';

const R = path.resolve(import.meta.dirname, '../../../..');
export const PINS_MODULE = 'port/v2/apps/game/src/battle2-master-pins.generated.ts';
export const PIN_FIELDS = Object.freeze(['creatureId', 'masterPath', 'masterSha256', 'masterWidth', 'masterHeight', 'recordPath', 'recordSha256', 'recipeHash',
  'alphaPath', 'alphaSha256', 'alphaWidth', 'alphaHeight', 'bindingSha256', 'atlasPath', 'atlasSha256', 'admittedBy']);

/** The shipped cut-out: RGB zero, alpha byte-identical to `parts/keyed.png` (the arena reads only the alpha). ONE copy — the
 * shipped-asset builder imports it, so the pinned alpha bytes are exactly the served ones. */
export const alphaOnlyPng = (bytes) => { const src = PNG.sync.read(bytes), out = new PNG({ width: src.width, height: src.height });
  for (let i = 0; i < src.width * src.height; i++) out.data[i * 4 + 3] = src.data[i * 4 + 3]; // RGB stays 0
  return PNG.sync.write(out, { deflateLevel: 9, colorType: 6 }); };

const need = (ok, why) => { if (!ok) throw Error('battle2 pin: ' + why); };

/** Full byte admission of one archetype's retained master + its binding/atlas, then its pin (or a throw — never a warning). */
export async function admitAndPinArchetype(entry, root = R) {
  const dir = requireCanonicalRepoPath(entry.dir.replace(/\/$/, ''), 'fit dir') + '/';
  const read = (rel) => fs.readFileSync(path.join(root, rel));
  const recordPath = requireCanonicalRepoPath(dir + 'record.json', 'record'), record = JSON.parse(read(recordPath).toString('utf8'));
  const masterPath = requireCanonicalRepoPath(repoRelativeSource(record.source), 'master');
  const masterBytes = new Uint8Array(read(masterPath)), keyedBytes = read(dir + 'parts/keyed.png'), keyed = readPng(keyedBytes);
  const alpha = new Uint8Array(keyed.width * keyed.height); for (let i = 0; i < alpha.length; i++) alpha[i] = keyed.data[i * 4 + 3];
  await admitFamilyRecord(structuredClone(record), masterBytes, alpha); // the EXISTING byte admission; throws on any failure
  const masterSize = pngHeaderSize(masterBytes); need(masterSize, `${entry.earthName}: master is not a PNG`);
  need(masterSize.width === record.geometry.width && masterSize.height === record.geometry.height, `${entry.earthName}: master size disagrees with record geometry`);
  need(keyed.width === masterSize.width && keyed.height === masterSize.height, `${entry.earthName}: keyed cut-out size disagrees with the master`);
  const masterSha256 = await hashBytes(masterBytes); need(masterSha256 === record.geometry.cutoutAssetHash, `${entry.earthName}: master hash is not the record's cut-out hash`);
  const bindingBytes = new Uint8Array(read(dir + 'binding.json')), binding = JSON.parse(new TextDecoder().decode(bindingBytes));
  need(binding.schema === 'cf.creature-parts/v1', `${entry.earthName}: unsupported parts schema`);
  const { bindingHash, ...body } = binding; need(SHA256_PATTERN.test(bindingHash) && await hashJSON(body) === bindingHash, `${entry.earthName}: corrupted part binding`);
  need(binding.recordRecipeHash === record.recipeHash, `${entry.earthName}: binding belongs to another record`);
  const manifest = JSON.parse(read(dir + 'parts/manifest.json').toString('utf8')); need(typeof manifest.creatureId === 'string' && manifest.creatureId.length > 0, `${entry.earthName}: parts manifest lacks creatureId`);
  const atlasPath = requireCanonicalRepoPath(dir + 'parts/atlas/' + manifest.creatureId + '.png', 'atlas'), atlasBytes = new Uint8Array(read(atlasPath));
  const atlasSha256 = await hashBytes(atlasBytes); need(atlasSha256 === binding.atlasSha256, `${entry.earthName}: atlas hash disagrees with the binding`);
  const alphaBytes = new Uint8Array(alphaOnlyPng(keyedBytes)), alphaSize = pngHeaderSize(alphaBytes);
  return Object.freeze({ creatureId: manifest.creatureId, masterPath, masterSha256, masterWidth: masterSize.width, masterHeight: masterSize.height,
    recordPath, recordSha256: await pinRecordSha256(record), recipeHash: record.recipeHash,
    alphaPath: requireCanonicalRepoPath(dir + 'parts/alpha.png', 'alpha'), alphaSha256: await hashBytes(alphaBytes), alphaWidth: alphaSize.width, alphaHeight: alphaSize.height,
    bindingSha256: await hashBytes(bindingBytes), atlasPath, atlasSha256, admittedBy: 'byte-admission@build' });
}

/** Refuses malformed or duplicate pins instead of silently overwriting one (review amendment 1/3). */
export function validatePins(pins) {
  need(Array.isArray(pins) && pins.length > 0, 'empty pin table');
  const ids = new Set();
  for (const p of pins) {
    need(p && typeof p === 'object' && Object.keys(p).length === PIN_FIELDS.length && PIN_FIELDS.every((k) => Object.hasOwn(p, k)), 'pin fields must be exactly ' + PIN_FIELDS.join(','));
    need(typeof p.creatureId === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(p.creatureId), 'malformed creatureId ' + JSON.stringify(p.creatureId));
    need(!ids.has(p.creatureId), 'duplicate creatureId ' + p.creatureId); ids.add(p.creatureId);
    for (const k of ['masterSha256', 'recordSha256', 'recipeHash', 'alphaSha256', 'bindingSha256', 'atlasSha256']) need(typeof p[k] === 'string' && SHA256_PATTERN.test(p[k]), `${p.creatureId}: malformed ${k}`);
    for (const k of ['masterWidth', 'masterHeight', 'alphaWidth', 'alphaHeight']) need(Number.isInteger(p[k]) && p[k] > 0 && p[k] <= 8192, `${p.creatureId}: malformed ${k}`);
    need(p.alphaWidth === p.masterWidth && p.alphaHeight === p.masterHeight, `${p.creatureId}: alpha dimensions differ from the master`);
    for (const k of ['masterPath', 'recordPath', 'alphaPath', 'atlasPath']) need(canonicalRepoPath(p[k]) === p[k], `${p.creatureId}: non-canonical ${k} ${JSON.stringify(p[k])}`);
    need(p.admittedBy === 'byte-admission@build', `${p.creatureId}: admittedBy`);
  }
  return pins;
}

/** The generated module's exact text (deterministic: the drift test regenerates it byte for byte). */
export function renderBattle2MasterPinsModule(pins) {
  validatePins(pins);
  const q = (v) => (typeof v === 'string' ? `'${v}'` : String(v));
  const rows = [...pins].sort((a, b) => (a.creatureId < b.creatureId ? -1 : a.creatureId > b.creatureId ? 1 : 0))
    .map((p) => `  Object.freeze({ ${PIN_FIELDS.map((k) => `${k}: ${q(p[k])}`).join(', ')} }),`);
  return `// GENERATED by tools/morph/battle2-master-pins.mjs — do not edit by hand; re-run the tool (build-shipped-battle2.mjs runs it).
// Schema ${BATTLE2_MASTER_PINS_SCHEMA}. Each pin exists only because full byte admission of the retained original master passed at build.
// Hash convention (shared with the runtime preflight through tools/morph/battle2-pin-contract.mjs):
${Object.entries(BATTLE2_PIN_HASH_CONVENTION).map(([k, v]) => `//   ${k}: ${v}`).join('\n')}
// AUTHORITY IS IDENTITY, NOT SHAPE: only the exact frozen objects below are pins. A spread clone, a JSON round trip or an
// identical-looking object built anywhere else fails isBattle2MasterPin. There is no exported table, registration or factory.
export const BATTLE2_MASTER_PINS_SCHEMA = '${BATTLE2_MASTER_PINS_SCHEMA}' as const;
export interface Battle2MasterPinV1 {
${PIN_FIELDS.map((k) => `  readonly ${k}: ${k === 'admittedBy' ? "'byte-admission@build'" : /Width|Height/.test(k) ? 'number' : 'string'};`).join('\n')}
}
const PINS: readonly Battle2MasterPinV1[] = Object.freeze([
${rows.join('\n')}
]);
const AUTHORITY = new WeakSet<object>(PINS);
const BY_ID = new Map<string, Battle2MasterPinV1>(PINS.map((p) => [p.creatureId, p]));
/** The bundled pin for a parts-manifest creatureId, or undefined (a missing pin is a named refusal, never a master fallback). */
export function getBattle2MasterPin(creatureId: string): Battle2MasterPinV1 | undefined { return typeof creatureId === 'string' ? BY_ID.get(creatureId) : undefined; }
/** True only for the exact generated entries (private identity), never for a structurally equal object. */
export function isBattle2MasterPin(value: unknown): value is Battle2MasterPinV1 { return typeof value === 'object' && value !== null && AUTHORITY.has(value); }
`;
}

/** Admit + pin every archetype, in list order, then the module text. */
export async function buildBattle2MasterPins(archetypes, root = R) {
  const pins = []; for (const a of archetypes) pins.push(await admitAndPinArchetype(a, root));
  return { pins, source: renderBattle2MasterPinsModule(pins) };
}
export async function writeBattle2MasterPins(archetypes, root = R) {
  const { pins, source } = await buildBattle2MasterPins(archetypes, root);
  fs.writeFileSync(path.join(root, PINS_MODULE), source); return pins;
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const { CARD_ARCHETYPES } = await import('./build-card-masters.mjs');
  const pins = await writeBattle2MasterPins(CARD_ARCHETYPES);
  console.log(JSON.stringify({ pins: pins.length, module: PINS_MODULE }));
}
