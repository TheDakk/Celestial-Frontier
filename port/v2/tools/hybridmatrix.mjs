/* hybridmatrix.mjs - production-derived Earth-lineage continuity evidence.

   Builds a fresh browser bundle, drives hybrid-matrix.html twice (forward
   output order, then reverse cache order after a real navigation), validates
   the 13 x 5 production crossGenome matrix, and writes a NEW ignored evidence
   directory. It never awards a visual PASS or "seamless" verdict.

   Usage:
     node tools/hybridmatrix.mjs --out=<new-name-under-apps/game/smoke>
     node tools/hybridmatrix.mjs --selftest
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { HYBRID_REVIEW_LINEAGES } from './hybridreviewcontract.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '..');
const APP = path.join(V2, 'apps', 'game');
const DIST = path.join(APP, 'dist');
const SMOKE = path.join(APP, 'smoke');
const BROWSER_SCHEMA = 'cf.hybrid-continuity.browser-report.v4';
const EVIDENCE_SCHEMA = 'cf.hybrid-continuity.evidence.v4';
const NATIVE = 440;
const CARD = 332;
const STAGES = Object.freeze(['pure', 'earth-earth', 'earth-alien', 'next-alien', 'floor']);
const ANCHORS = Object.freeze([1, 0.9, 0.73, 0.46, 0.22]);
const LINEAGES = HYBRID_REVIEW_LINEAGES;
const CACHE_IDS = Object.freeze(['dragonfly', 'eagle', 'elephant', 'fruit-bat', 'great-white-shark', 'wolf']);
const OWNED_FAUNA_LINEAGES = new Set(['Fruit Bat', 'Eagle', 'Wolf', 'Elephant', 'Chameleon', 'Dragonfly', 'Octopus']);
const PLATINUM_REVIEW = Object.freeze({
  name: 'Celestial Frontier Current Full Generations Platinum Review',
  file: 'reference/Celestial_Frontier_Current_Full_Generations_Platinum_Review_2026-08-10.md',
  sha256: '5af3a33f0648f96115a421ea64cc70f97846f62e89dc8631deeb310103c708c2',
  baseline_source_commit: '79ce14460998d653ee753e49e8f8016e754c82e4',
  baseline_archive_sha256: '18080276385915e08e12c76a3413f46b5472953a7c8cca161d5be4fd6a699dc5',
  disposition: 'REPAIR_REQUIRED_NOT_PLATINUM',
});
const PLATINUM_REVIEW_FILE = path.join(V2, PLATINUM_REVIEW.file);
const BROWSER_CDP_FILE = path.join(HERE, 'browsercdp.mjs');
const BROWSER_PATH_FILE = path.join(HERE, 'browserpath.mjs');
const HYBRID_REVIEW_CONTRACT_FILE = path.join(HERE, 'hybridreviewcontract.mjs');
const VISUAL_CLAIM = 'No seamlessness or art PASS is awarded by this evidence tool.';
const CLEAN_SOURCE_CLAIM = 'Clean working tree at the recorded commit.';
const DIRTY_SOURCE_CLAIM = 'UNCOMMITTED WORKING TREE - file and pixel hashes identify this capture; rerun from the clean committed tree before certification.';
const RESIDUAL_CONTINUITY_RISKS = Object.freeze([
  'Flora, fungi and microbe hybrids keep the exact named Earth owner; anchor drift reaches that owner only through inherited child genome, seed and palette values that the painter actually reads.',
  'A low-anchor non-fauna hybrid may retain an exact Earth silhouette or ignore some reversed-parent trait differences. This is review evidence, not a seamlessness claim.',
  'Apple remains in the principal 13x5 matrix but is excluded from the cache subset because its same-seed AB/BA expected pixels were identical; using it as a collision control would be vacuous.',
]);
const NEGATIVE_CONTROLS = Object.freeze({
  stripped_lineage_bypass: 'rejected for every hybrid stage',
  reviewed_fauna_owner_bypass: 'rejected for the seven Platinum-reviewed fauna lineages',
  protected_fauna_route_drift: 'rejected for Sea Turtle and Great White Shark',
  principal_microbe_omission: 'rejected by the exact Amoeba lineage identity/count contract',
  seed_only_cache_key: 'rejected by six same-seed/different-trait AB/BA pairs',
  carried_or_handwritten_lineage: 'rejected by exact input provenance and repeated production crosses',
  mixed_owner_marker_loss: 'rejected by exact _earthBlendKingdom lineage-owner checks',
  mixed_child_kingdom_route_bypass: 'rejected by owner-derived route checks in both parent orders and both child kingdoms',
  duplicate_name_owner_bypass: 'rejected by Green Algae markerless and counterfactual-owner pixel controls',
  visual_boundary: 'machine output remains UNREVIEWED',
});
const BROWSER_FIELDS = Object.freeze([
  'executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version',
]);
const MIXED_SENTINELS = Object.freeze([
  { id: 'apple-earth-first-child-flora', kind: 'single-lineage-owner', name: 'Apple', owner: 'flora', other: 'fauna', order: 'earth-first', child: 'flora', salt: 1 },
  { id: 'apple-earth-first-child-fauna', kind: 'single-lineage-owner', name: 'Apple', owner: 'flora', other: 'fauna', order: 'earth-first', child: 'fauna', salt: 2 },
  { id: 'apple-earth-second-child-flora', kind: 'single-lineage-owner', name: 'Apple', owner: 'flora', other: 'fauna', order: 'earth-second', child: 'flora', salt: 3 },
  { id: 'apple-earth-second-child-fauna', kind: 'single-lineage-owner', name: 'Apple', owner: 'flora', other: 'fauna', order: 'earth-second', child: 'fauna', salt: 4 },
  { id: 'wolf-earth-first-child-fauna', kind: 'single-lineage-owner', name: 'Wolf', owner: 'fauna', other: 'flora', order: 'earth-first', child: 'fauna', salt: 5 },
  { id: 'wolf-earth-first-child-flora', kind: 'single-lineage-owner', name: 'Wolf', owner: 'fauna', other: 'flora', order: 'earth-first', child: 'flora', salt: 6 },
  { id: 'wolf-earth-second-child-fauna', kind: 'single-lineage-owner', name: 'Wolf', owner: 'fauna', other: 'flora', order: 'earth-second', child: 'fauna', salt: 7 },
  { id: 'wolf-earth-second-child-flora', kind: 'single-lineage-owner', name: 'Wolf', owner: 'fauna', other: 'flora', order: 'earth-second', child: 'flora', salt: 8 },
  ...['flora-first', 'microbe-first'].flatMap((order, orderIndex) =>
    ['flora', 'microbe'].flatMap((owner, ownerIndex) =>
      ['flora', 'microbe'].map((child, childIndex) => ({
        id: `green-algae-${order}-owner-${owner}-child-${child}`,
        kind: 'duplicate-name-owner', name: 'Green Algae', owner,
        other: owner === 'flora' ? 'microbe' : 'flora', order, child,
        salt: 20 + orderIndex * 4 + ownerIndex * 2 + childIndex,
      })))),
]);
const ASSET_COUNTS = Object.freeze({
  portrait: 65,
  card: 65,
  silhouette: 65,
  'lineage-sheet': 13,
  'join-atlas': 13,
  'cache-portrait': 12,
  'cache-sheet': 1,
  'mixed-portrait': 16,
  'mixed-sheet': 1,
});
const SOURCE_ROOTS = Object.freeze([
  path.join(V2, 'packages', 'art', 'src'),
  path.join(V2, 'packages', 'domain', 'genetics', 'src'),
  path.join(V2, 'packages', 'domain', 'genome', 'src'),
  path.join(V2, 'packages', 'domain', 'rand', 'src'),
  path.join(V2, 'packages', 'domain', 'descriptors', 'src'),
  path.join(V2, 'packages', 'domain', 'speciestraits', 'src'),
]);
const SOURCE_FILES = Object.freeze([
  path.join(APP, 'hybrid-matrix.html'),
  path.join(APP, 'src', 'hybridmatrixaudit.ts'),
  path.join(APP, 'vite.config.ts'),
  path.join(APP, 'package.json'),
  path.join(V2, 'package.json'),
  path.join(V2, 'package-lock.json'),
  BROWSER_CDP_FILE,
  BROWSER_PATH_FILE,
  HYBRID_REVIEW_CONTRACT_FILE,
  PLATINUM_REVIEW_FILE,
  fileURLToPath(import.meta.url),
]);
const SHA = /^[0-9a-f]{64}$/;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function exactObjectKeys(value, expected, where) {
  assert(isObject(value), `${where}: expected an object`);
  assert(canonical(Object.keys(value).sort()) === canonical([...expected].sort()),
    `${where}: keys are incomplete or unexpected`);
}
const FORBIDDEN_COMPLETED_REVIEW_KEYS = new Set([
  'approval', 'approved_by', 'band', 'certification', 'certification_status', 'certified',
  'certified_by', 'human_verdict', 'reason', 'review_complete', 'reviewed_at',
  'reviewed_at_utc', 'reviewed_by', 'reviewer', 'reviewer_notes', 'release_signoff', 'signoff',
  'verdict', 'verdicts',
]);
function rejectEmbeddedCompletedReview(value, where, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectEmbeddedCompletedReview(item, where, [...trail, String(index)]));
    return;
  }
  if (!isObject(value)) {
    if (typeof value === 'string') assert(!/^\s*(?:PASS|POLISH|FAIL|CERTIFIED|APPROVED|ACCEPTED)\s*$/i.test(value)
      && !/\b(?:awarded|returned|rated|judged|reviewed as|certified as)\s+(?:a\s+)?(?:PASS|POLISH|FAIL|CERTIFIED|APPROVED)\b/i.test(value)
      && !/\b(?:verdict|band|status|assessment|outcome|judg(?:e)?ment)\s*[:=-]\s*(?:PASS|POLISH|FAIL|CERTIFIED|APPROVED|ACCEPTED)\b/i.test(value)
      && !/\b(?:Platinum\s+approved|approved\s+by|release\s+approved|sign[- ]?off|certification\s+approved)\b/i.test(value),
    `${where}: embedded completed-review value is forbidden at ${trail.join('.') || '<root>'}`);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const next = [...trail, key];
    assert(!FORBIDDEN_COMPLETED_REVIEW_KEYS.has(key.toLowerCase()),
      `${where}: embedded completed-review field is forbidden at ${next.join('.')}`);
    rejectEmbeddedCompletedReview(child, where, next);
  }
}
function portable(value) { return value.split(path.sep).join('/'); }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function canonical(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (typeof value === 'object') {
    return '{' + Object.keys(value).sort()
      .map((key) => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  }
  if (value === undefined) return 'undefined';
  return JSON.stringify(value);
}
function genomeHash(genome) { return sha256(canonical(genome)); }
function validatePlatinumReview(value = PLATINUM_REVIEW) {
  assert(canonical(value) === canonical(PLATINUM_REVIEW),
    'Platinum review contract changed or is incomplete');
  assert(fs.existsSync(PLATINUM_REVIEW_FILE)
    && sha256(fs.readFileSync(PLATINUM_REVIEW_FILE)) === PLATINUM_REVIEW.sha256,
    'Platinum review file is missing or differs from its frozen SHA-256');
}
function validateBrowserProvenance(raw) {
  assert(isObject(raw) && canonical(Object.keys(raw).sort()) === canonical([...BROWSER_FIELDS].sort()),
    'browser provenance keys are incomplete or unexpected');
  for (const field of BROWSER_FIELDS) nonempty(raw[field], `browser.${field}`);
  const executable = String(raw.executable);
  assert(!executable.includes('\\')
    && (path.posix.isAbsolute(executable) || /^[A-Za-z]:\//.test(executable)),
  'browser.executable must be a canonical portable absolute path');
}
function derivePixelIdentityGroups(stages) {
  const byHash = new Map();
  for (const stage of stages) {
    const ids = byHash.get(stage.portrait_sha256) || [];
    ids.push(stage.stage_id);
    byHash.set(stage.portrait_sha256, ids);
  }
  return [...byHash.entries()].filter(([, ids]) => ids.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([portraitSha256, stageIds]) => ({ portrait_sha256: portraitSha256, stage_ids: stageIds }));
}
function hashInt(seed, x, y) {
  let h = seed | 0;
  h = Math.imul(h ^ (x | 0), 374761393);
  h = Math.imul(h ^ (y | 0), 668265263);
  h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13;
  return h >>> 0;
}
function rowKey(lineage, stage) { return `${lineage}\u0000${stage}`; }
function nonempty(value, where) {
  assert(typeof value === 'string' && value.trim().length > 0, `${where}: must be a nonempty string`);
  const result = value.trim();
  assert(!/[\u0000-\u001f\u007f]/.test(result), `${where}: control characters are forbidden`);
  return result;
}
function pngDimensions(buffer, where) {
  assert(Buffer.isBuffer(buffer) && buffer.length >= 24, `${where}: incomplete PNG`);
  assert(buffer.toString('hex', 0, 8) === '89504e470d0a1a0a', `${where}: not a PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
function safeRelativePng(value, where) {
  const relative = nonempty(value, where);
  assert(!relative.includes('\\'), `${where}: backslashes are forbidden`);
  assert(!path.posix.isAbsolute(relative), `${where}: absolute path is forbidden`);
  assert(path.posix.normalize(relative) === relative && !relative.split('/').includes('..'),
    `${where}: path traversal is forbidden`);
  assert(/^[A-Za-z0-9._/-]+\.png$/.test(relative), `${where}: expected a portable PNG path`);
  return relative;
}
function expectedAssetDimensions(kind) {
  if (kind === 'portrait' || kind === 'silhouette' || kind === 'cache-portrait'
    || kind === 'mixed-portrait') return { width: NATIVE, height: NATIVE };
  if (kind === 'card') return { width: CARD, height: CARD };
  if (kind === 'lineage-sheet') return { width: NATIVE * 5, height: 1180 };
  if (kind === 'join-atlas') return { width: 1290, height: 1048 };
  if (kind === 'cache-sheet') return { width: 680, height: 1534 };
  if (kind === 'mixed-sheet') return { width: 880, height: 1160 };
  fail(`unknown asset kind ${JSON.stringify(kind)}`);
}
const EVIDENCE_GENOME_KEYS = new Set([
  'seed', 'kingdom', 'color', 'form', 'body', 'loco', 'trait', 'size', 'diet', 'head', 'limbs',
  'skin', 'tail', 'pattern', 'eyes', 'behavior', 'habitat', 'detail', 'accent', 'temper', 'sense',
  'repro', 'life', 'metab', 'lumin', 'gen', 'heat', 'x', 'aq', 'af', 'wild', 'apex', 'par', 'ep',
  'evolved', 'parents', '_earthName', '_earthBlend', '_earthBlendKingdom', '_anchorVal', '_src',
]);
const SOURCE_ATTR_KEYS = new Set([
  'kingdom', 'color', 'form', 'body', 'loco', 'trait', 'size', 'diet', 'head', 'limbs', 'skin',
  'tail', 'pattern', 'eyes', 'behavior', 'habitat', 'detail', 'accent', 'heat',
]);
const CACHE_GENE_KEYS = Object.freeze(['kingdom', 'color', 'form', 'body', 'loco', 'trait', 'size',
  'diet', 'head', 'limbs', 'skin', 'tail', 'pattern', 'eyes', 'behavior', 'habitat',
  'detail', 'accent', 'lumin', 'heat']);
function validateEvidenceGenome(genome, where) {
  assert(isObject(genome), `${where}: expected an object`);
  for (const key of Object.keys(genome)) assert(EVIDENCE_GENOME_KEYS.has(key),
    `${where}: unsupported genome field ${JSON.stringify(key)}`);
  for (const key of ['seed', 'color', 'form', 'body', 'loco', 'trait', 'size', 'diet', 'head', 'limbs',
    'skin', 'tail', 'pattern', 'eyes', 'behavior', 'habitat', 'detail', 'accent', 'temper', 'sense',
    'repro', 'life', 'metab', 'gen', 'heat']) if (Object.hasOwn(genome, key)) assert(
    typeof genome[key] === 'number' && Number.isFinite(genome[key]), `${where}.${key}: expected finite number`);
  assert(typeof genome.kingdom === 'string' && genome.kingdom.length > 0,
    `${where}.kingdom: expected nonempty string`);
  if (Object.hasOwn(genome, 'lumin')) assert(typeof genome.lumin === 'boolean', `${where}.lumin: expected boolean`);
  for (const key of ['x', 'aq', 'af', 'wild', 'apex', 'par', 'ep']) if (Object.hasOwn(genome, key)) assert(
    typeof genome[key] === 'number' || typeof genome[key] === 'boolean', `${where}.${key}: invalid marker`);
  if (Object.hasOwn(genome, 'evolved')) assert(typeof genome.evolved === 'boolean', `${where}.evolved: expected boolean`);
  if (Object.hasOwn(genome, 'parents')) assert(Array.isArray(genome.parents)
    && genome.parents.every((seed) => Number.isInteger(seed)), `${where}.parents: expected integer seeds`);
  for (const key of ['_earthName', '_earthBlend', '_earthBlendKingdom']) if (Object.hasOwn(genome, key)) assert(
    typeof genome[key] === 'string' && genome[key].length > 0, `${where}.${key}: expected nonempty string`);
  if (Object.hasOwn(genome, '_anchorVal')) assert(typeof genome._anchorVal === 'number'
    && Number.isFinite(genome._anchorVal), `${where}._anchorVal: expected finite number`);
  if (Object.hasOwn(genome, '_src')) {
    assert(isObject(genome._src), `${where}._src: expected an object`);
    for (const [key, value] of Object.entries(genome._src)) assert(SOURCE_ATTR_KEYS.has(key)
      && (value === 0 || value === 1), `${where}._src: unsupported ancestry field ${JSON.stringify(key)}`);
  }
}
function checkGenomeHash(record, where) {
  assert(isObject(record), `${where}: expected an object`);
  assert(isObject(record.genome), `${where}.genome: expected an object`);
  validateEvidenceGenome(record.genome, `${where}.genome`);
  assert(SHA.test(record.genome_sha256), `${where}.genome_sha256: invalid SHA-256`);
  assert(record.genome_sha256 === genomeHash(record.genome), `${where}: stale full-genome SHA-256`);
}
function validateInput(input, spec, row, where) {
  exactObjectKeys(input, ['id', 'genome', 'genome_sha256', 'derivation'], where);
  checkGenomeHash(input, where);
  const id = nonempty(input.id, `${where}.id`);
  assert(isObject(input.derivation), `${where}.derivation: expected an object`);
  const derivation = input.derivation;
  const genome = input.genome;
  assert(Number.isInteger(genome.seed) && genome.seed >= 0, `${where}: invalid genome seed`);
  assert(genome.kingdom === spec.kingdom, `${where}: wrong kingdom`);
  assert(Number.isInteger(genome.heat) && genome.heat >= 0 && genome.heat <= 2, `${where}: invalid heat`);
  assert(genome.seed === derivation.seed, `${where}: derivation seed differs from genome`);
  if (id === 'pure') {
    exactObjectKeys(derivation, ['kind', 'formula', 'kingdom_index', 'catalogue_index', 'heat', 'seed',
      'exact_name_matches'], `${where}.derivation`);
    assert(derivation.kind === 'catalogue-makeGenome', `${where}: wrong pure derivation`);
    assert(derivation.formula === 'hashInt(0xEA47,catalogueIndex,kingdomIndex)',
      `${where}: wrong pure seed formula`);
    assert(Number.isInteger(derivation.catalogue_index) && derivation.catalogue_index >= 0,
      `${where}: invalid catalogue index`);
    assert(Number.isInteger(derivation.kingdom_index) && derivation.kingdom_index >= 0,
      `${where}: invalid kingdom index`);
    const expected = hashInt(0xEA47, derivation.catalogue_index, derivation.kingdom_index);
    assert(genome.seed === expected, `${where}: catalogue seed formula mismatch`);
    assert(genome._earthName === spec.species && genome._earthBlend === undefined
      && genome._earthBlendKingdom === undefined && genome._anchorVal === undefined,
      `${where}: pure Earth lineage fields are invalid`);
    assert(derivation.exact_name_matches === 1, `${where}: catalogue identity was not exact and unique`);
  } else if (id === 'earth-mate') {
    exactObjectKeys(derivation, ['kind', 'formula', 'row', 'catalogue_index', 'heat', 'seed'],
      `${where}.derivation`);
    assert(derivation.kind === 'named-earth-makeGenome', `${where}: wrong Earth-mate derivation`);
    assert(derivation.formula === 'hashInt(0xEA7E,row,catalogueIndex)' && derivation.row === row,
      `${where}: wrong Earth-mate seed formula`);
    const expected = hashInt(0xEA7E, row, derivation.catalogue_index);
    assert(genome.seed === expected, `${where}: Earth-mate seed formula mismatch`);
    assert(genome._earthName === spec.species && genome._earthBlend === undefined
      && genome._earthBlendKingdom === undefined && genome._anchorVal === undefined,
      `${where}: Earth-mate lineage fields are invalid`);
  } else if (/^alien-[123]$/.test(id)) {
    exactObjectKeys(derivation, ['kind', 'formula', 'row', 'slot', 'attempt', 'heat', 'seed', 'predicate'],
      `${where}.derivation`);
    const slot = Number(id.slice(-1));
    assert(derivation.kind === 'alien-seed-search' && derivation.row === row && derivation.slot === slot,
      `${where}: wrong alien search provenance`);
    assert(derivation.formula === 'hashInt(0xA11E57,row*10000+slot*1000+attempt,0x4D)',
      `${where}: wrong alien seed formula`);
    assert(Number.isInteger(derivation.attempt) && derivation.attempt >= 0 && derivation.attempt < 512,
      `${where}: invalid search attempt`);
    const expected = hashInt(0xA11E57, row * 10000 + slot * 1000 + derivation.attempt, 0x4D);
    assert(genome.seed === expected, `${where}: alien seed formula mismatch`);
    assert(derivation.heat === genome.heat && derivation.predicate === spec.challenge,
      `${where}: alien search metadata mismatch`);
    assert(genome._earthName === undefined && genome._earthBlend === undefined
      && genome._earthBlendKingdom === undefined && genome._anchorVal === undefined,
      `${where}: alien input carries handwritten lineage fields`);
  } else fail(`${where}: unexpected input id ${JSON.stringify(id)}`);
  return input;
}
function parentSeeds(stageId, stages, inputs) {
  const byStage = new Map(stages.map((stage) => [stage.stage_id, stage]));
  const byInput = new Map(inputs.map((input) => [input.id, input]));
  if (stageId === 'earth-earth') return [byInput.get('pure').genome.seed, byInput.get('earth-mate').genome.seed];
  if (stageId === 'earth-alien') return [byInput.get('pure').genome.seed, byInput.get('alien-1').genome.seed];
  if (stageId === 'next-alien') return [byStage.get('earth-alien').genome.seed, byInput.get('alien-2').genome.seed];
  if (stageId === 'floor') return [byStage.get('next-alien').genome.seed, byInput.get('alien-3').genome.seed];
  return [];
}
function validateStage(stage, spec, stageIndex, stages, inputs, where) {
  exactObjectKeys(stage, ['lineage_id', 'identity', 'stage_id', 'stage_index', 'anchor',
    'genome', 'genome_sha256', 'portrait_path', 'card_path', 'silhouette_path', 'route', 'owned',
    'production_matches_fresh', 'repeated_render_stable', 'portrait_sha256', 'stripped_lineage_control'], where);
  checkGenomeHash(stage, where);
  const stageId = STAGES[stageIndex];
  assert(stage.stage_id === stageId && stage.stage_index === stageIndex,
    `${where}: bad stage order or index`);
  assert(stage.identity === `${spec.id}|${stageId}`, `${where}: wrong identity`);
  assert(typeof stage.anchor === 'number' && Math.abs(stage.anchor - ANCHORS[stageIndex]) < 1e-9,
    `${where}: wrong declared anchor`);
  const genome = stage.genome;
  assert(genome.kingdom === spec.kingdom, `${where}: wrong kingdom`);
  assert(Number.isInteger(genome.seed) && genome.seed >= 0, `${where}: invalid seed`);
  if (stageIndex === 0) {
    assert(genome._earthName === spec.species && genome._earthBlend === undefined
      && genome._earthBlendKingdom === undefined && genome._anchorVal === undefined,
      `${where}: pure stage lineage fields invalid`);
    assert(stage.genome_sha256 === inputs[0].genome_sha256, `${where}: pure stage is not the exact catalogue input`);
    assert(stage.route === 'named-owned', `${where}: pure stage must use the exact named owner route`);
    assert(stage.stripped_lineage_control === null, `${where}: pure stage has a hybrid bypass control`);
  } else {
    assert(genome._earthName === undefined && genome._earthBlend === spec.species
      && genome._earthBlendKingdom === spec.kingdom,
      `${where}: hybrid stage has handwritten/lost lineage identity`);
    assert(typeof genome._anchorVal === 'number' && Math.abs(genome._anchorVal - ANCHORS[stageIndex]) < 1e-9,
      `${where}: production anchor differs from stage contract`);
    assert(isObject(genome._src), `${where}: production ancestry attribution is missing`);
    const expectedParents = parentSeeds(stageId, stages, inputs);
    assert(Array.isArray(genome.parents) && canonical(genome.parents) === canonical(expectedParents),
      `${where}: production parent seed chain is invalid`);
    assert(stage.route === expectedLineageRoute(spec.kingdom, spec.species),
      `${where}: hybrid used the wrong reviewed lineage route`);
    assert(isObject(stage.stripped_lineage_control)
      && stage.stripped_lineage_control.differs_from_lineage === true
      && /^procedural-(owned|verbatim)$/.test(stage.stripped_lineage_control.route)
      && SHA.test(stage.stripped_lineage_control.portrait_sha256)
      && stage.stripped_lineage_control.portrait_sha256 !== stage.portrait_sha256,
    `${where}: injected hybrid-bypass negative control was accepted`);
    exactObjectKeys(stage.stripped_lineage_control,
      ['route', 'portrait_sha256', 'differs_from_lineage'], `${where}.stripped_lineage_control`);
  }
  assert(stage.production_matches_fresh === true && stage.repeated_render_stable === true,
    `${where}: production/fresh or repeat-render check failed`);
  assert(stage.owned === stage.route.endsWith('-owned'), `${where}: owned flag disagrees with the production route`);
  assert(SHA.test(stage.portrait_sha256), `${where}: invalid portrait SHA-256`);
  assert(safeRelativePng(stage.portrait_path, `${where}.portrait_path`)
    === `portraits/${spec.id}/${String(stageIndex + 1).padStart(2, '0')}-${stageId}.png`,
  `${where}: unexpected portrait path`);
  assert(safeRelativePng(stage.card_path, `${where}.card_path`)
    === `cards/${spec.id}/${String(stageIndex + 1).padStart(2, '0')}-${stageId}.png`,
  `${where}: unexpected card path`);
  assert(safeRelativePng(stage.silhouette_path, `${where}.silhouette_path`)
    === `silhouettes/${spec.id}/${String(stageIndex + 1).padStart(2, '0')}-${stageId}.png`,
  `${where}: unexpected silhouette path`);
}
function validateLineage(row, spec, index) {
  const where = `lineage ${index + 1} (${spec.id})`;
  assert(isObject(row), `${where}: expected an object`);
  exactObjectKeys(row, ['ordinal', 'lineage_id', 'set', 'species', 'challenge',
    'crop_contract', 'stage_pixel_unique_count', 'pixel_identity_groups',
    'anchor_visual_differentiation', 'inputs', 'crosses', 'stages', 'lineage_sheet', 'join_atlas',
    'visual_review_status'], where);
  assert(row.ordinal === index + 1 && row.lineage_id === spec.id && row.species === spec.species,
    `${where}: missing, duplicate, or wrong catalogue identity`);
  assert(row.set === `earth-${spec.kingdom}` && row.challenge === spec.challenge,
    `${where}: set/challenge mismatch`);
  assert(row.visual_review_status === 'UNREVIEWED', `${where}: carried visual verdict is forbidden`);
  assert(isObject(row.crop_contract) && row.crop_contract.source_pixels === 55
    && row.crop_contract.output_pixels === 220 && row.crop_contract.scale === 4,
  `${where}: 4x crop contract missing`);
  exactObjectKeys(row.crop_contract, ['source_pixels', 'output_pixels', 'scale', 'coordinates'],
    `${where}.crop_contract`);
  assert(Array.isArray(row.crop_contract.coordinates) && row.crop_contract.coordinates.length === 4,
    `${where}: expected four machine-readable join coordinates`);
  const expectedCrops = spec.crops.map(([x, y, w, h]) => ({ x, y, w, h }));
  assert(canonical(row.crop_contract.coordinates) === canonical(expectedCrops),
    `${where}: anatomy-bound crop coordinates changed`);
  const cropIds = new Set();
  for (const [cropIndex, crop] of row.crop_contract.coordinates.entries()) {
    assert(isObject(crop), `${where} crop ${cropIndex + 1}: expected an object`);
    exactObjectKeys(crop, ['x', 'y', 'w', 'h'], `${where} crop ${cropIndex + 1}`);
    const cropId = `${crop.x},${crop.y},${crop.w},${crop.h}`;
    assert(!cropIds.has(cropId), `${where}: duplicate crop coordinates ${cropId}`);
    cropIds.add(cropId);
    assert(Number.isInteger(crop.x) && Number.isInteger(crop.y) && crop.w === 55 && crop.h === 55,
      `${where} crop ${cropIndex + 1}: invalid coordinates`);
    assert(crop.x >= 0 && crop.y >= 0 && crop.x + crop.w <= NATIVE && crop.y + crop.h <= NATIVE,
      `${where} crop ${cropIndex + 1}: outside the 440px portrait`);
  }
  assert(Array.isArray(row.inputs) && row.inputs.length === 5, `${where}: expected five exact inputs`);
  const expectedInputIds = ['pure', 'earth-mate', 'alien-1', 'alien-2', 'alien-3'];
  assert(canonical(row.inputs.map((input) => input.id)) === canonical(expectedInputIds), `${where}: input order/identity mismatch`);
  row.inputs.forEach((input, inputIndex) => validateInput(input, spec, index, `${where} input ${inputIndex + 1}`));
  assert(Array.isArray(row.crosses) && row.crosses.length === 4, `${where}: missing cross chain`);
  row.crosses.forEach((cross, crossIndex) => exactObjectKeys(cross,
    ['stage_id', 'parent_a', 'parent_b'], `${where} cross ${crossIndex + 1}`));
  assert(canonical(row.crosses.map((cross) => cross.stage_id)) === canonical(STAGES.slice(1)),
    `${where}: cross chain order mismatch`);
  assert(Array.isArray(row.stages) && row.stages.length === 5, `${where}: expected five stages`);
  row.stages.forEach((stage, stageIndex) => validateStage(stage, spec, stageIndex, row.stages, row.inputs,
    `${where} stage ${stageIndex + 1}`));
  assert(new Set(row.stages.map((stage) => stage.identity)).size === 5, `${where}: duplicate stage identity`);
  assert(new Set(row.stages.map((stage) => stage.genome_sha256)).size === 5,
    `${where}: duplicate production genome identity`);
  const pixelGroups = derivePixelIdentityGroups(row.stages);
  assert(Array.isArray(row.pixel_identity_groups), `${where}: pixel identity groups must be an array`);
  row.pixel_identity_groups.forEach((group, groupIndex) => exactObjectKeys(group,
    ['portrait_sha256', 'stage_ids'], `${where} pixel group ${groupIndex + 1}`));
  assert(canonical(row.pixel_identity_groups) === canonical(pixelGroups),
  `${where}: pixel identity groups are stale or incomplete`);
  assert(row.stage_pixel_unique_count === new Set(row.stages.map((stage) => stage.portrait_sha256)).size,
    `${where}: wrong unique-pixel count`);
  const expectedVisualState = pixelGroups.length ? 'FAIL_BYTE_IDENTICAL_STAGES' : 'OPEN_UNREVIEWED';
  assert(row.anchor_visual_differentiation === expectedVisualState,
    `${where}: anchor visual differentiation status hides the pixel outcome`);
  assert(row.lineage_sheet === `lineage-sheets/${String(index + 1).padStart(2, '0')}-${spec.id}.png`,
    `${where}: wrong lineage-sheet path`);
  assert(row.join_atlas === `join-atlases/${String(index + 1).padStart(2, '0')}-${spec.id}.png`,
    `${where}: wrong join-atlas path`);
}
function validateCacheControl(row, expectedId, where) {
  assert(isObject(row) && row.lineage_id === expectedId, `${where}: wrong cache-control identity`);
  exactObjectKeys(row, ['lineage_id', 'species', 'input_order_first', 'alien', 'same_seed', 'seed',
    'different_full_genomes', 'differing_fields', 'ab_genome', 'ba_genome', 'ab_genome_sha256',
    'ba_genome_sha256', 'ab_portrait_sha256', 'ba_portrait_sha256', 'cache_independent', 'ab_route',
    'ba_route', 'ab_portrait_path', 'ba_portrait_path'], where);
  assert(row.species === LINEAGES.find((lineage) => lineage.id === expectedId).species, `${where}: wrong species`);
  assert(row.same_seed === true && row.different_full_genomes === true && row.cache_independent === true,
    `${where}: cache independence flags failed`);
  assert(row.input_order_first === 'AB' || row.input_order_first === 'BA', `${where}: missing render order`);
  assert(isObject(row.alien) && isObject(row.alien.genome) && isObject(row.alien.derivation),
    `${where}: missing exact alien input`);
  exactObjectKeys(row.alien, ['id', 'genome', 'derivation'], `${where}.alien`);
  exactObjectKeys(row.alien.derivation, ['kind', 'formula', 'row', 'attempt', 'heat', 'seed'],
    `${where}.alien.derivation`);
  validateEvidenceGenome(row.alien.genome, `${where}.alien.genome`);
  assert(row.alien.id === 'cache-alien', `${where}: wrong cache-alien identity`);
  assert(row.alien.derivation.kind === 'makeGenome'
    && row.alien.derivation.formula === 'hashInt(0xCA6E,row,attempt)', `${where}: wrong cache seed formula`);
  assert(Number.isInteger(row.alien.derivation.row) && Number.isInteger(row.alien.derivation.attempt)
    && row.alien.derivation.attempt >= 0 && row.alien.derivation.attempt < 256, `${where}: invalid cache search provenance`);
  const expectedSeed = hashInt(0xCA6E, row.alien.derivation.row, row.alien.derivation.attempt);
  assert(row.alien.genome.seed === expectedSeed && row.alien.derivation.seed === expectedSeed,
    `${where}: cache alien seed mismatch`);
  assert(row.alien.genome._earthName === undefined && row.alien.genome._earthBlend === undefined
    && row.alien.genome._earthBlendKingdom === undefined,
    `${where}: cache alien carries lineage metadata`);
  assert(isObject(row.ab_genome) && isObject(row.ba_genome), `${where}: missing AB/BA genomes`);
  validateEvidenceGenome(row.ab_genome, `${where}.ab_genome`);
  validateEvidenceGenome(row.ba_genome, `${where}.ba_genome`);
  assert(row.ab_genome.seed === row.ba_genome.seed && row.seed === row.ab_genome.seed,
    `${where}: reversed parents did not share a seed`);
  assert(genomeHash(row.ab_genome) === row.ab_genome_sha256 && genomeHash(row.ba_genome) === row.ba_genome_sha256,
    `${where}: stale AB/BA full-genome hash`);
  assert(row.ab_genome_sha256 !== row.ba_genome_sha256, `${where}: AB/BA full genomes collapsed`);
  const expectedDifferingFields = CACHE_GENE_KEYS.filter((key) =>
    canonical(row.ab_genome[key]) !== canonical(row.ba_genome[key]));
  assert(expectedDifferingFields.length > 0
    && canonical(row.differing_fields) === canonical(expectedDifferingFields),
    `${where}: differing inherited fields do not match the canonical AB/BA genomes`);
  assert(Array.isArray(row.ab_genome.parents) && Array.isArray(row.ba_genome.parents)
    && row.ab_genome.parents[0] === row.ba_genome.parents[1]
    && row.ab_genome.parents[1] === row.ba_genome.parents[0],
  `${where}: AB/BA parent order is not reversed`);
  const owner = LINEAGES.find((lineage) => lineage.id === expectedId).kingdom;
  assert(row.alien.genome.kingdom === owner, `${where}: cache alien kingdom differs from the lineage owner`);
  assert(row.ab_genome._earthBlend === row.species && row.ba_genome._earthBlend === row.species
    && row.ab_genome._earthBlendKingdom === owner && row.ba_genome._earthBlendKingdom === owner,
    `${where}: cache controls lost Earth lineage`);
  assert(Math.abs(row.ab_genome._anchorVal - 0.73) < 1e-9 && Math.abs(row.ba_genome._anchorVal - 0.73) < 1e-9,
    `${where}: cache controls have wrong anchor`);
  const expectedRoute = expectedLineageRoute(owner, row.species);
  assert(row.ab_route === expectedRoute && row.ba_route === expectedRoute,
    `${where}: cache control used the wrong lineage route`);
  assert(SHA.test(row.ab_portrait_sha256) && SHA.test(row.ba_portrait_sha256)
    && row.ab_portrait_sha256 !== row.ba_portrait_sha256, `${where}: cache portrait collision`);
  assert(row.ab_portrait_path === `cache-controls/${expectedId}-AB.png`
    && row.ba_portrait_path === `cache-controls/${expectedId}-BA.png`, `${where}: wrong cache portrait paths`);
}
function expectedLineageRoute(owner, name) {
  return owner === 'fauna' && !OWNED_FAUNA_LINEAGES.has(name) ? 'lineage-verbatim' : 'lineage-owned';
}
function expectedMarkerlessLineageRoute(owner) {
  return owner === 'fauna' ? 'lineage-verbatim' : 'lineage-owned';
}
function withoutLineage(genome) {
  const stripped = { ...genome };
  delete stripped._earthName; delete stripped._earthBlend; delete stripped._earthBlendKingdom;
  delete stripped._anchorVal; delete stripped._src;
  return stripped;
}
function validateMixedInput(input, expected, spec, attempt, where) {
  exactObjectKeys(input, ['id', 'genome', 'genome_sha256', 'derivation'], where);
  checkGenomeHash(input, where);
  assert(input.id === expected.id && isObject(input.derivation), `${where}: wrong input identity/derivation`);
  const genome = input.genome, derivation = input.derivation;
  assert(derivation.salt === spec.salt && derivation.attempt === attempt
    && Number.isInteger(attempt) && attempt >= 0 && attempt < 2048,
  `${where}: wrong deterministic search coordinates`);
  const expectedSeed = hashInt(expected.base, spec.salt, attempt);
  assert(genome.seed === expectedSeed && derivation.seed === expectedSeed,
    `${where}: mixed input seed formula mismatch`);
  assert(genome.kingdom === expected.kingdom && genome.heat === expected.heat,
    `${where}: mixed input kingdom/heat mismatch`);
  assert(derivation.formula === expected.formula && derivation.heat === expected.heat,
    `${where}: mixed input derivation formula mismatch`);
  if (expected.named) {
    exactObjectKeys(derivation, ['kind', 'formula', 'salt', 'attempt', 'seed', 'heat',
      'exact_name_matches', 'owner_source', 'route_owner',
      ...(expected.ownerSource === 'deduped-legacy-route' ? ['route_owner_verified'] : [])],
    `${where}.derivation`);
    assert(derivation.kind === expected.derivationKind
      && derivation.exact_name_matches === expected.exactNameMatches
      && derivation.owner_source === expected.ownerSource
      && derivation.route_owner === `${expected.kingdom}|${spec.name}`,
    `${where}: named Earth owner provenance missing`);
    if (expected.ownerSource === 'deduped-legacy-route') {
      assert(derivation.route_owner_verified === true && derivation.exact_name_matches === 0,
        `${where}: deduped legacy route owner was not verified`);
    }
    assert(genome._earthName === spec.name && genome._earthBlend === undefined
      && genome._earthBlendKingdom === undefined && genome._anchorVal === undefined,
    `${where}: named Earth lineage fields invalid`);
  } else {
    exactObjectKeys(derivation, ['kind', 'formula', 'salt', 'attempt', 'seed', 'heat'],
      `${where}.derivation`);
    assert(derivation.kind === 'alien-seed-search', `${where}: alien provenance missing`);
    assert(genome._earthName === undefined && genome._earthBlend === undefined
      && genome._earthBlendKingdom === undefined && genome._anchorVal === undefined,
    `${where}: alien input carries lineage fields`);
  }
}
function mixedInputContract(spec, attempt) {
  if (spec.kind === 'single-lineage-owner') {
    const earth = { id: 'earth', kingdom: spec.owner, named: true, heat: 1,
      base: 0xC2055, formula: 'hashInt(0xC2055,salt,attempt)',
      derivationKind: 'named-earth-seed-search', exactNameMatches: 1,
      ownerSource: 'current-catalogue' };
    const wild = { id: 'wild', kingdom: spec.other, named: false, heat: attempt % 3,
      base: 0xA11E7, formula: 'hashInt(0xA11E7,salt,attempt)' };
    return spec.order === 'earth-first' ? [earth, wild] : [wild, earth];
  }
  const flora = { id: 'flora-earth', kingdom: 'flora', named: true, heat: 1,
    base: 0x6A1A, formula: 'hashInt(0x6A1A,salt,attempt)',
    derivationKind: 'named-earth-seed-search', exactNameMatches: 1,
    ownerSource: 'current-catalogue' };
  const microbe = { id: 'microbe-earth', kingdom: 'microbe', named: true, heat: 1,
    base: 0x6A1B, formula: 'hashInt(0x6A1B,salt,attempt)',
    derivationKind: 'legacy-named-route-seed-search', exactNameMatches: 0,
    ownerSource: 'deduped-legacy-route' };
  return spec.order === 'flora-first' ? [flora, microbe] : [microbe, flora];
}
function validateMixedControl(control, expectedGenome, selectedPortraitHash, where) {
  const markerControl = isObject(control)
    && (Object.hasOwn(control, 'expected_legacy_owner') || Object.hasOwn(control, 'required_to_differ'));
  exactObjectKeys(control, ['genome', 'genome_sha256', 'route', 'portrait_sha256',
    'production_matches_fresh', 'repeated_render_stable', 'differs_from_selected_owner',
    ...(markerControl ? ['expected_legacy_owner', 'required_to_differ'] : [])], where);
  checkGenomeHash(control, where);
  assert(canonical(control.genome) === canonical(expectedGenome), `${where}: injected genome mutation is not exact`);
  assert(/^lineage-(owned|verbatim)$|^procedural-(owned|verbatim)$/.test(control.route),
    `${where}: invalid route`);
  assert(SHA.test(control.portrait_sha256) && control.production_matches_fresh === true
    && control.repeated_render_stable === true, `${where}: renderer outcome is incomplete`);
  assert(control.differs_from_selected_owner === (control.portrait_sha256 !== selectedPortraitHash),
    `${where}: pixel-difference flag is stale`);
}
function validateMixedSentinel(row, spec, index) {
  const where = `mixed sentinel ${index + 1} (${spec.id})`;
  assert(isObject(row) && row.ordinal === index + 1 && row.sentinel_id === spec.id,
    `${where}: missing, duplicate, or wrong sentinel identity`);
  exactObjectKeys(row, ['ordinal', 'sentinel_id', 'sentinel_kind', 'species', 'selected_lineage_owner',
    'other_parent_kingdom', 'parent_order', 'expected_child_kingdom', 'search', 'inputs', 'cross',
    'child_genome', 'child_genome_sha256', 'child_kingdom', 'lineage', 'lineage_kingdom', 'anchor',
    'route', 'expected_route', 'production_matches_fresh', 'repeated_render_stable',
    'repeated_cross_stable', 'portrait_sha256', 'portrait_path', 'stripped_lineage_control',
    'missing_owner_marker_control', 'counterfactual_owner_control', 'visual_review_status'], where);
  assert(row.sentinel_kind === spec.kind && row.species === spec.name
    && row.selected_lineage_owner === spec.owner && row.other_parent_kingdom === spec.other
    && row.parent_order === spec.order && row.expected_child_kingdom === spec.child,
  `${where}: declared mixed-owner contract changed`);
  assert(isObject(row.search) && row.search.kind === 'deterministic-seed-search'
    && row.search.salt === spec.salt && row.search.limit === 2048
    && Number.isInteger(row.search.attempt) && row.search.attempt >= 0 && row.search.attempt < 2048,
  `${where}: deterministic search provenance invalid`);
  exactObjectKeys(row.search, ['kind', 'salt', 'attempt', 'limit'], `${where}.search`);
  const inputContract = mixedInputContract(spec, row.search.attempt);
  assert(Array.isArray(row.inputs) && row.inputs.length === 2
    && canonical(row.inputs.map((input) => input.id)) === canonical(inputContract.map((input) => input.id)),
  `${where}: exact parent order is missing`);
  row.inputs.forEach((input, inputIndex) => validateMixedInput(input, inputContract[inputIndex], spec,
    row.search.attempt, `${where} input ${inputIndex + 1}`));
  assert(isObject(row.cross) && row.cross.function === 'crossGenome'
    && row.cross.parent_a === inputContract[0].id && row.cross.parent_b === inputContract[1].id,
  `${where}: production cross order is invalid`);
  exactObjectKeys(row.cross, ['function', 'parent_a', 'parent_b'], `${where}.cross`);
  assert(isObject(row.child_genome) && SHA.test(row.child_genome_sha256)
    && row.child_genome_sha256 === genomeHash(row.child_genome), `${where}: stale child full-genome SHA-256`);
  validateEvidenceGenome(row.child_genome, `${where}.child_genome`);
  const child = row.child_genome;
  assert(child._earthName === undefined && child._earthBlend === spec.name
    && child._earthBlendKingdom === spec.owner && child.kingdom === spec.child,
  `${where}: _earthBlendKingdom did not follow the selected lineage owner`);
  assert(row.child_kingdom === child.kingdom && row.lineage === child._earthBlend
    && row.lineage_kingdom === child._earthBlendKingdom,
  `${where}: duplicated lineage/kingdom fields are stale`);
  const expectedAnchor = spec.kind === 'duplicate-name-owner' ? 0.9 : 0.73;
  assert(typeof child._anchorVal === 'number' && Math.abs(child._anchorVal - expectedAnchor) < 1e-9
    && Math.abs(row.anchor - expectedAnchor) < 1e-9, `${where}: wrong production anchor`);
  assert(isObject(child._src) && Array.isArray(child.parents)
    && canonical(child.parents) === canonical(row.inputs.map((input) => input.genome.seed)),
  `${where}: production ancestry/parent seed order invalid`);
  const expectedRoute = expectedLineageRoute(spec.owner, spec.name);
  assert(row.route === expectedRoute && row.expected_route === expectedRoute,
    `${where}: production route followed child kingdom instead of lineage owner`);
  assert(row.production_matches_fresh === true && row.repeated_render_stable === true
    && row.repeated_cross_stable === true && SHA.test(row.portrait_sha256),
  `${where}: production/repeat outcome invalid`);
  assert(row.visual_review_status === 'UNREVIEWED', `${where}: carried visual verdict is forbidden`);
  assert(row.portrait_path === `mixed-kingdom/${String(index + 1).padStart(2, '0')}-${spec.id}.png`,
    `${where}: wrong mixed portrait path`);

  const stripped = withoutLineage(child);
  validateMixedControl(row.stripped_lineage_control, stripped, row.portrait_sha256,
    `${where} stripped-lineage control`);
  assert(/^procedural-(owned|verbatim)$/.test(row.stripped_lineage_control.route)
    && row.stripped_lineage_control.differs_from_selected_owner === true,
  `${where}: injected stripped-lineage bypass was accepted`);
  const markerless = { ...child }; delete markerless._earthBlendKingdom;
  validateMixedControl(row.missing_owner_marker_control, markerless, row.portrait_sha256,
    `${where} missing-owner-marker control`);
  const fallbackOwner = spec.kind === 'duplicate-name-owner' ? spec.child : spec.owner;
  const markerRequired = spec.kind === 'duplicate-name-owner' && spec.child !== spec.owner;
  assert(row.missing_owner_marker_control.expected_legacy_owner === fallbackOwner
    && row.missing_owner_marker_control.route === expectedMarkerlessLineageRoute(fallbackOwner)
    && row.missing_owner_marker_control.required_to_differ === markerRequired,
  `${where}: route-aware legacy fallback contract changed`);
  if (markerRequired) assert(row.missing_owner_marker_control.differs_from_selected_owner === true,
    `${where}: removing a required duplicate owner marker did not change pixels`);

  if (spec.kind === 'duplicate-name-owner') {
    assert(isObject(row.counterfactual_owner_control), `${where}: missing duplicate-owner negative control`);
    const counterfactual = { ...child, _earthBlendKingdom: spec.other };
    validateMixedControl(row.counterfactual_owner_control, counterfactual, row.portrait_sha256,
      `${where} counterfactual-owner control`);
    assert(row.counterfactual_owner_control.route === expectedLineageRoute(spec.other, spec.name)
      && row.counterfactual_owner_control.differs_from_selected_owner === true,
    `${where}: duplicate-name lineage owner did not select set-specific pixels`);
  } else assert(row.counterfactual_owner_control === null,
    `${where}: unique-name row has a fabricated counterfactual owner`);
}
function validateAssets(assets, report) {
  assert(Array.isArray(assets), 'browser report assets must be an array');
  const total = Object.values(ASSET_COUNTS).reduce((sum, value) => sum + value, 0);
  assert(assets.length === total, `expected ${total} asset descriptors, got ${assets.length}`);
  const paths = new Set(), identities = new Set();
  const counts = Object.fromEntries(Object.keys(ASSET_COUNTS).map((kind) => [kind, 0]));
  const stageByPath = new Map();
  for (const lineage of report.lineages) for (const stage of lineage.stages) {
    stageByPath.set(stage.portrait_path, stage);
  }
  const cacheByPath = new Map();
  for (const cache of report.cache_controls) {
    cacheByPath.set(cache.ab_portrait_path, cache.ab_portrait_sha256);
    cacheByPath.set(cache.ba_portrait_path, cache.ba_portrait_sha256);
  }
  const mixedByPath = new Map(report.mixed_kingdom_sentinels
    .map((row) => [row.portrait_path, row.sentinel_id]));
  for (const [index, asset] of assets.entries()) {
    const where = `asset ${index + 1}`;
    assert(isObject(asset), `${where}: expected an object`);
    const finalRecord = Object.hasOwn(asset, 'bytes') || Object.hasOwn(asset, 'sha256');
    exactObjectKeys(asset, finalRecord
      ? ['path', 'kind', 'identity', 'width', 'height', 'bytes', 'sha256']
      : ['path', 'kind', 'identity', 'width', 'height'], where);
    const relative = safeRelativePng(asset.path, `${where}.path`);
    const kind = nonempty(asset.kind, `${where}.kind`);
    assert(kind in ASSET_COUNTS, `${where}: unknown kind ${JSON.stringify(kind)}`);
    const identity = nonempty(asset.identity, `${where}.identity`);
    assert(!paths.has(relative), `${where}: duplicate path ${relative}`); paths.add(relative);
    const identityKey = `${kind}\u0000${identity}`;
    assert(!identities.has(identityKey), `${where}: duplicate kind/identity ${identityKey}`); identities.add(identityKey);
    const dimensions = expectedAssetDimensions(kind);
    assert(asset.width === dimensions.width && asset.height === dimensions.height,
      `${where}: expected ${dimensions.width}x${dimensions.height}, got ${asset.width}x${asset.height}`);
    counts[kind]++;
    if (kind === 'portrait') assert(stageByPath.has(relative), `${where}: portrait has no principal stage`);
    if (kind === 'cache-portrait') assert(cacheByPath.has(relative), `${where}: cache portrait has no control row`);
    if (kind === 'mixed-portrait') assert(mixedByPath.get(relative) === identity,
      `${where}: mixed portrait has no matching sentinel`);
    if (kind === 'cache-sheet') assert(relative === 'cache-controls/reversed-parent-sheet.png'
      && identity === 'cache-subset', `${where}: reversed-parent cache sheet contract changed`);
    if (kind === 'mixed-sheet') assert(relative === report.mixed_sentinel_sheet
      && relative === 'mixed-kingdom/sentinels-sheet.png' && identity === 'mixed-sentinels',
    `${where}: mixed sentinel sheet is not bound to the report`);
  }
  for (const [kind, expected] of Object.entries(ASSET_COUNTS)) {
    assert(counts[kind] === expected, `asset count ${kind}: expected ${expected}, got ${counts[kind]}`);
  }
  return new Map(assets.map((asset) => [asset.path, asset]));
}
function validateBrowserReport(report, options = {}) {
  assert(isObject(report) && report.schema === BROWSER_SCHEMA && report.done === true,
    'browser did not return a completed hybrid-matrix report');
  exactObjectKeys(report, ['schema', 'done', 'review_status', 'visual_continuity_status',
    'machine_anchor_visual_status', 'visual_claim', 'production_path', 'stage_order', 'anchor_contract',
    'emit', 'render_order', 'summary', 'checks', 'lineages', 'cache_controls',
    'mixed_kingdom_sentinels', 'mixed_sentinel_sheet', 'assets'], 'browser report');
  rejectEmbeddedCompletedReview(report, 'browser report');
  assert(!report.error, `browser report failed: ${report.error || 'unknown error'}`);
  assert(report.review_status === 'UNREVIEWED', 'browser report must remain UNREVIEWED');
  assert(report.visual_continuity_status === 'OPEN', 'visual continuity must remain OPEN for human review');
  assert(report.visual_claim === VISUAL_CLAIM,
    'browser report changed its exact no-visual-PASS boundary');
  assert(canonical(report.stage_order) === canonical(STAGES), 'browser report has bad stage order');
  assert(canonical(report.anchor_contract) === canonical(ANCHORS), 'browser report has bad anchor contract');
  assert(report.production_path === 'makeGenome -> crossGenome -> speciesPortrait', 'browser report used the wrong production path');
  assert(isObject(report.summary) && report.summary.lineages === 13 && report.summary.principal_portraits === 65
    && report.summary.cache_controls === 6 && report.summary.cache_portraits === 12
    && report.summary.mixed_kingdom_sentinels === 16 && report.summary.mixed_portraits === 16,
  'browser report summary is incomplete');
  exactObjectKeys(report.summary, ['lineages', 'principal_portraits', 'cache_controls', 'cache_portraits',
    'mixed_kingdom_sentinels', 'mixed_portraits', 'assets', 'pixel_identical_lineages',
    'pixel_identical_lineage_ids'], 'browser report summary');
  assert(isObject(report.checks), 'browser report omitted checks');
  const requiredChecks = ['earth_owner_sources_verified', 'no_handwritten_lineage_fields', 'cross_genome_provenance',
    'anchor_values_exact', 'production_matches_fresh_route', 'repeated_fresh_render_stable',
    'stripped_lineage_bypass_differs', 'stage_genome_identities_distinct',
    'pixel_identity_groups_accounted', 'cache_permutation_independent',
    'mixed_parent_order_child_kingdom_coverage', 'mixed_lineage_owner_preserved',
    'mixed_production_route_follows_owner', 'duplicate_name_owner_pixels_set_specific',
    'mixed_stripped_lineage_bypass_differs', 'mixed_repeated_cross_stable'];
  exactObjectKeys(report.checks, requiredChecks, 'browser report checks');
  for (const check of requiredChecks) assert(report.checks[check] === true, `browser check failed: ${check}`);
  assert(Array.isArray(report.lineages) && report.lineages.length === LINEAGES.length,
    `expected ${LINEAGES.length} lineages`);
  report.lineages.forEach((lineage, index) => validateLineage(lineage, LINEAGES[index], index));
  assert(new Set(report.lineages.map((lineage) => lineage.lineage_id)).size === LINEAGES.length,
    'duplicate lineage identity');
  const pixelIdenticalIds = report.lineages
    .filter((lineage) => lineage.pixel_identity_groups.length > 0)
    .map((lineage) => lineage.lineage_id);
  assert(report.summary.pixel_identical_lineages === pixelIdenticalIds.length
    && canonical(report.summary.pixel_identical_lineage_ids) === canonical(pixelIdenticalIds),
  'browser summary hides or miscounts byte-identical anchor lineages');
  const expectedMachineStatus = pixelIdenticalIds.length
    ? 'FAIL_BYTE_IDENTICAL_STAGES' : 'OPEN_UNREVIEWED';
  assert(report.machine_anchor_visual_status === expectedMachineStatus,
    'machine anchor visual status hides the pixel outcome');
  assert(Array.isArray(report.cache_controls) && report.cache_controls.length === CACHE_IDS.length,
    `expected ${CACHE_IDS.length} cache controls`);
  report.cache_controls.forEach((cache, index) => validateCacheControl(cache, CACHE_IDS[index], `cache control ${index + 1}`));
  assert(Array.isArray(report.mixed_kingdom_sentinels)
    && report.mixed_kingdom_sentinels.length === MIXED_SENTINELS.length,
  `expected ${MIXED_SENTINELS.length} mixed-kingdom sentinels`);
  report.mixed_kingdom_sentinels.forEach((row, index) =>
    validateMixedSentinel(row, MIXED_SENTINELS[index], index));
  assert(new Set(report.mixed_kingdom_sentinels.map((row) => row.sentinel_id)).size === MIXED_SENTINELS.length,
    'duplicate mixed-sentinel identity');
  assert(report.mixed_sentinel_sheet === 'mixed-kingdom/sentinels-sheet.png',
    'mixed-sentinel sheet path missing');
  const assets = validateAssets(report.assets, report);
  assert(report.summary.assets === assets.size, 'browser summary asset count differs from descriptors');
  if (options.expectEmit !== undefined) assert(report.emit === options.expectEmit, 'browser emit mode mismatch');
  if (options.expectOrder !== undefined) assert(report.render_order === options.expectOrder, 'browser render order mismatch');
  return { assets };
}
function stableReportProjection(report) {
  const copy = structuredClone(report);
  delete copy.emit;
  delete copy.render_order;
  for (const cache of copy.cache_controls) delete cache.input_order_first;
  return copy;
}
function validateReload(first, second) {
  validateBrowserReport(first, { expectEmit: true, expectOrder: 'forward' });
  validateBrowserReport(second, { expectEmit: false, expectOrder: 'reverse' });
  assert(canonical(stableReportProjection(first)) === canonical(stableReportProjection(second)),
    'browser reload/reverse-order report changed genomes, routes, hashes, or assets');
  for (const cache of first.cache_controls) assert(cache.input_order_first === 'AB', 'forward pass did not render AB first');
  for (const cache of second.cache_controls) assert(cache.input_order_first === 'BA', 'reverse pass did not render BA first');
}
function validateOutputTarget(value, allowedRoot = SMOKE) {
  const name = nonempty(value, '--out');
  assert(!name.includes('/') && !name.includes('\\') && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name),
    '--out must be one safe new directory name directly under apps/game/smoke');
  assert(fs.existsSync(allowedRoot), `output parent does not exist: ${allowedRoot}`);
  const rootStat = fs.lstatSync(allowedRoot);
  assert(rootStat.isDirectory() && !rootStat.isSymbolicLink(), 'output parent must be a real directory, not a link');
  const realRoot = fs.realpathSync(allowedRoot);
  const output = path.join(realRoot, name);
  assert(path.dirname(output) === realRoot, 'output escaped the allowed parent');
  assert(!fs.existsSync(output), `output already exists; evidence is immutable: ${output}`);
  return output;
}
function walkFiles(root) {
  const files = [];
  const visit = (directory) => {
    const stat = fs.lstatSync(directory);
    assert(stat.isDirectory() && !stat.isSymbolicLink(), `source path must be a real directory: ${directory}`);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      const fileStat = fs.lstatSync(file);
      assert(!fileStat.isSymbolicLink(), `source snapshot refuses link: ${file}`);
      if (fileStat.isDirectory()) visit(file);
      else if (fileStat.isFile() && /\.(?:ts|js|json)$/.test(entry.name)) files.push(file);
    }
  };
  visit(root);
  return files;
}
function sourceSnapshot() {
  const files = [...SOURCE_FILES];
  for (const root of SOURCE_ROOTS) files.push(...walkFiles(root));
  const unique = [...new Set(files.map((file) => path.resolve(file)))].sort();
  const rows = unique.map((file) => {
    const stat = fs.lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink(), `source snapshot refuses non-file: ${file}`);
    const bytes = fs.readFileSync(file);
    return { file: portable(path.relative(V2, file)), bytes: bytes.length, sha256: sha256(bytes) };
  });
  return { files: rows, sha256: sha256(rows.map((row) => `${row.file}\u0000${row.bytes}\u0000${row.sha256}\n`).join('')) };
}
function sourceUnchanged(before, after) {
  if (before.sha256 === after.sha256 && canonical(before.files) === canonical(after.files)) return;
  const beforeByFile = new Map(before.files.map((row) => [row.file, row]));
  const afterByFile = new Map(after.files.map((row) => [row.file, row]));
  const changed = [...new Set([...beforeByFile.keys(), ...afterByFile.keys()])]
    .filter((file) => canonical(beforeByFile.get(file)) !== canonical(afterByFile.get(file)))
    .sort();
  fail(`renderer/tool source changed while evidence was being generated: ${changed.join(', ') || 'snapshot digest changed'}`);
}
function gitState() {
  const run = (args) => execFileSync('git', args, { cwd: V2, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const statusText = run(['status', '--porcelain=v1', '--untracked-files=all']);
  const statusLines = statusText ? statusText.split(/\r?\n/) : [];
  return {
    head: run(['rev-parse', 'HEAD']),
    branch: run(['branch', '--show-current']),
    dirty: statusLines.length > 0,
    status_lines: statusLines,
    source_claim: statusLines.length ? DIRTY_SOURCE_CLAIM : CLEAN_SOURCE_CLAIM,
  };
}
function startStaticServer() {
  const root = fs.realpathSync(DIST);
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.map': 'application/json' };
  const server = http.createServer((request, response) => {
    try {
      assert(request.method === 'GET', 'only GET is allowed');
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      assert(!relative.includes('\\') && !relative.split('/').includes('..'), 'invalid request path');
      const file = path.resolve(root, ...relative.split('/'));
      assert(file.startsWith(root + path.sep), 'request escaped dist');
      const stat = fs.lstatSync(file);
      assert(stat.isFile() && !stat.isSymbolicLink(), 'request target is not a real file');
      const bytes = fs.readFileSync(file);
      response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      response.end(bytes);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain' }); response.end('not found');
    }
  });
  return server;
}
async function openBrowser() {
  const cdp = await openChromiumCdp({
    label: 'hybrid matrix', userDataPrefix: 'cf-hybrid-matrix-browser',
    commandTimeoutMs: 15000, startupTimeoutMs: 15000, shutdownTimeoutMs: 5000,
  });
  try {
    const target = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const attached = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sessionId = attached.sessionId;
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Page.enable', {}, sessionId);
    const evaluate = async (expression) => {
      const result = await cdp.send('Runtime.evaluate',
        { expression, returnByValue: true, awaitPromise: true }, sessionId);
      if (result.exceptionDetails) fail(`browser evaluation failed: ${result.exceptionDetails.text}`);
      return result.result.value;
    };
    return { send: cdp.send, sessionId, evaluate, browser: cdp.browser, close: cdp.close };
  } catch (error) {
    await cdp.close();
    throw error;
  }
}
async function drainPass(browser, pageUrl, stage, emit) {
  await browser.send('Page.navigate', { url: pageUrl }, browser.sessionId);
  const written = new Map();
  let report = null;
  for (let spin = 0; spin < 18000; spin++) {
    const result = await browser.evaluate(`(()=>{const S=window.__CF_HYBRID_MATRIX__;if(!S)return {kind:'WAIT'};
      if(S.error)return {kind:'ERROR',error:S.error,report:S.report};
      if(S.q.length)return {kind:'ITEM',item:S.q.shift()};
      if(S.done)return {kind:'DONE',report:S.report};return {kind:'WAIT'};})()`);
    if (!result || result.kind === 'WAIT') { await sleep(75); continue; }
    if (result.kind === 'ERROR') fail(`browser matrix failed: ${result.error}`);
    if (result.kind === 'ITEM') {
      assert(emit, 'verification pass unexpectedly emitted an asset');
      const item = result.item;
      assert(isObject(item), 'browser emitted a malformed asset');
      const relative = safeRelativePng(item.path, 'browser queue path');
      assert(!written.has(relative), `browser emitted duplicate path ${relative}`);
      assert(typeof item.url === 'string' && item.url.startsWith('data:image/png;base64,'),
        `browser emitted non-PNG data for ${relative}`);
      const buffer = Buffer.from(item.url.slice('data:image/png;base64,'.length), 'base64');
      const dimensions = pngDimensions(buffer, relative);
      assert(dimensions.width === item.width && dimensions.height === item.height,
        `${relative}: queue dimensions differ from PNG`);
      const file = path.join(stage, ...relative.split('/'));
      assert(file.startsWith(stage + path.sep), `${relative}: resolved outside staging root`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, buffer);
      written.set(relative, {
        path: relative, kind: item.kind, identity: item.identity,
        width: dimensions.width, height: dimensions.height,
        bytes: buffer.length, sha256: sha256(buffer),
      });
      if (written.size % 40 === 0) console.log(`  ... ${written.size} review artefacts written`);
      continue;
    }
    if (result.kind === 'DONE') { report = result.report; break; }
    fail(`unknown browser drain state ${JSON.stringify(result.kind)}`);
  }
  assert(report, 'browser matrix timed out before completion');
  if (!emit) assert(written.size === 0, 'verification pass wrote assets');
  return { report, written };
}
function joinWrittenAssets(report, written) {
  const { assets: expected } = validateBrowserReport(report, { expectEmit: true, expectOrder: 'forward' });
  assert(written.size === expected.size, `expected ${expected.size} written assets, got ${written.size}`);
  const stageHashes = new Map();
  for (const lineage of report.lineages) for (const stage of lineage.stages) stageHashes.set(stage.portrait_path, stage.portrait_sha256);
  const cacheHashes = new Map();
  for (const cache of report.cache_controls) {
    cacheHashes.set(cache.ab_portrait_path, cache.ab_portrait_sha256);
    cacheHashes.set(cache.ba_portrait_path, cache.ba_portrait_sha256);
  }
  const mixedHashes = new Map(report.mixed_kingdom_sentinels
    .map((row) => [row.portrait_path, row.portrait_sha256]));
  const rows = [];
  for (const [relative, descriptor] of expected) {
    const disk = written.get(relative);
    assert(disk, `browser descriptor was not written: ${relative}`);
    assert(disk.kind === descriptor.kind && disk.identity === descriptor.identity
      && disk.width === descriptor.width && disk.height === descriptor.height,
    `${relative}: queue descriptor differs from completed report`);
    if (stageHashes.has(relative)) assert(disk.sha256 === stageHashes.get(relative), `${relative}: stale browser portrait hash`);
    if (cacheHashes.has(relative)) assert(disk.sha256 === cacheHashes.get(relative), `${relative}: stale cache portrait hash`);
    if (mixedHashes.has(relative)) assert(disk.sha256 === mixedHashes.get(relative), `${relative}: stale mixed-sentinel portrait hash`);
    rows.push(disk);
  }
  rows.sort((a, b) => a.path.localeCompare(b.path));
  return rows;
}
function verifyAssetRecord(root, asset, where) {
  const relative = safeRelativePng(asset.path, `${where}.path`);
  const file = path.join(root, ...relative.split('/'));
  assert(file.startsWith(root + path.sep), `${where}: resolved outside evidence root`);
  assert(fs.existsSync(file), `${where}: missing file ${relative}`);
  const stat = fs.lstatSync(file);
  assert(stat.isFile() && !stat.isSymbolicLink(), `${where}: asset must be a real file`);
  const buffer = fs.readFileSync(file);
  const dimensions = pngDimensions(buffer, where);
  assert(dimensions.width === asset.width && dimensions.height === asset.height,
    `${where}: stale dimensions (manifest ${asset.width}x${asset.height}, disk ${dimensions.width}x${dimensions.height})`);
  assert(buffer.length === asset.bytes, `${where}: stale byte count`);
  assert(sha256(buffer) === asset.sha256, `${where}: stale SHA-256`);
}
function listFiles(root) {
  const rows = [];
  const visit = (directory) => {
    const stat = fs.lstatSync(directory);
    assert(stat.isDirectory() && !stat.isSymbolicLink(), `evidence directory must not be a link: ${directory}`);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      const fileStat = fs.lstatSync(file);
      assert(!fileStat.isSymbolicLink(), `evidence contains a link: ${file}`);
      if (fileStat.isDirectory()) visit(file);
      else { assert(fileStat.isFile(), `evidence contains a non-file: ${file}`); rows.push(portable(path.relative(root, file))); }
    }
  };
  visit(root);
  return rows.sort();
}
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n'); }
function expectedEvidenceReadme(report) {
  const identical = report.lineages
    .filter((lineage) => lineage.pixel_identity_groups.length > 0)
    .map((lineage) => `${lineage.species} (${lineage.pixel_identity_groups
      .map((group) => group.stage_ids.join('=')).join('; ')})`);
  return [
    '# Hybrid continuity review evidence', '',
    'Status: UNREVIEWED. This package does not claim seamlessness or an art PASS.', '',
    `Repair ruler: ${PLATINUM_REVIEW.name} (${PLATINUM_REVIEW.sha256}); disposition ${PLATINUM_REVIEW.disposition}.`,
    `Reviewed baseline: source ${PLATINUM_REVIEW.baseline_source_commit}; archive SHA-256 ${PLATINUM_REVIEW.baseline_archive_sha256}.`, '',
    `Visual continuity: OPEN. Machine anchor differentiation: ${report.machine_anchor_visual_status}.`,
    `Byte-identical anchor groups: ${identical.length ? identical.join(', ') : 'none observed; human verdict still required'}.`, '',
    'Each of the 13 lineage sheets shows five genomes produced by the real game path:',
    'pure Earth, Earth x Earth (0.90), Earth x alien (0.73), next alien (0.46), and the 0.22 floor.', '',
    'mixed-kingdom/ adds 16 real crossGenome sentinels: Apple and Wolf in both parent orders',
    'and both child kingdoms, plus Green Algae in both parent orders, both the current flora catalogue',
    'owner and retained legacy microbe route owner, and both child kingdoms. These bind `_earthBlendKingdom` and production route',
    'to the selected lineage owner; stripped, missing-marker, and counterfactual-owner controls are',
    'recorded with exact genomes and hashes in manifest.json.', '',
    'Use lineage-sheets/ at normal size, join-atlases/ for declared 4x attachment crops,',
    'cards/ for unlabelled 332px detail-card views, and silhouettes/ as contrast diagnostics.',
    'Silhouettes are derived from final opaque portraits and are not authoritative subject masks.', '',
    'manifest.json binds every PNG, exact input/full genome, renderer route, source snapshot,',
    'repeat render, reload, reversed-parent cache control, and mixed-owner negative controls.', '',
    'Residual continuity risk: flora, fungi and microbe hybrids use the exact Earth named owner',
    'with the inherited child genome. The current owner can retain an exact Earth silhouette at',
    'low anchors or ignore some reversed-parent trait differences. Apple is therefore kept in the',
    'principal matrix but excluded from the cache-collision subset, where equal expected pixels',
    'would make the negative control vacuous. Judge those low-anchor sheets by eye.', '',
  ].join('\n');
}
function writeReadme(file, report) { fs.writeFileSync(file, expectedEvidenceReadme(report)); }
function validateFinalEvidenceRows(manifest) {
  assert(canonical(manifest.stage_order) === canonical(STAGES),
    'evidence manifest: stage order changed');
  assert(canonical(manifest.anchor_contract) === canonical(ANCHORS),
    'evidence manifest: anchor contract changed');
  assert(Array.isArray(manifest.lineages) && manifest.lineages.length === LINEAGES.length,
    `evidence manifest: expected ${LINEAGES.length} lineages`);
  manifest.lineages.forEach((lineage, index) => validateLineage(lineage, LINEAGES[index], index));
  assert(new Set(manifest.lineages.map((lineage) => lineage.lineage_id)).size === LINEAGES.length,
    'evidence manifest: duplicate lineage identity');
  assert(Array.isArray(manifest.cache_controls) && manifest.cache_controls.length === CACHE_IDS.length,
    `evidence manifest: expected ${CACHE_IDS.length} cache controls`);
  manifest.cache_controls.forEach((cache, index) =>
    validateCacheControl(cache, CACHE_IDS[index], `evidence cache control ${index + 1}`));
  assert(Array.isArray(manifest.mixed_kingdom_sentinels)
    && manifest.mixed_kingdom_sentinels.length === MIXED_SENTINELS.length,
  'evidence manifest mixed-sentinel coverage is incomplete');
  manifest.mixed_kingdom_sentinels.forEach((row, index) =>
    validateMixedSentinel(row, MIXED_SENTINELS[index], index));
  validateAssets(manifest.assets, manifest);
  const pixelIdenticalLineageIds = manifest.lineages
    .filter((lineage) => lineage.pixel_identity_groups.length > 0)
    .map((lineage) => lineage.lineage_id);
  assert(canonical(manifest.summary) === canonical({
    lineages: LINEAGES.length,
    principal_portraits: LINEAGES.length * STAGES.length,
    cache_controls: CACHE_IDS.length,
    cache_portraits: CACHE_IDS.length * 2,
    mixed_kingdom_sentinels: MIXED_SENTINELS.length,
    mixed_portraits: MIXED_SENTINELS.length,
    assets: Object.values(ASSET_COUNTS).reduce((sum, value) => sum + value, 0),
    pixel_identical_lineages: pixelIdenticalLineageIds.length,
    pixel_identical_lineage_ids: pixelIdenticalLineageIds,
  }), 'evidence manifest: exact arithmetic/pixel summary differs from validated rows');
}
function validateEvidenceMachineObservations(manifest) {
  exactObjectKeys(manifest.machine_observations, [
    'byte_identical_anchor_lineages', 'required_human_verdict', 'mixed_owner_sentinels',
  ], 'evidence manifest machine_observations');
  exactObjectKeys(manifest.machine_observations.mixed_owner_sentinels, [
    'total', 'unique_owner_cases', 'duplicate_name_cases', 'visual_status',
  ], 'evidence manifest mixed_owner_sentinels');
  const observed = manifest.lineages
    .filter((lineage) => lineage.pixel_identity_groups.length > 0)
    .map((lineage) => ({
      lineage_id: lineage.lineage_id,
      species: lineage.species,
      pixel_identity_groups: lineage.pixel_identity_groups,
      status: lineage.anchor_visual_differentiation,
    }));
  assert(manifest.machine_observations.required_human_verdict === true
    && canonical(manifest.machine_observations.byte_identical_anchor_lineages) === canonical(observed)
    && canonical(manifest.machine_observations.mixed_owner_sentinels) === canonical({
      total: MIXED_SENTINELS.length,
      unique_owner_cases: MIXED_SENTINELS.filter((row) => row.kind === 'single-lineage-owner').length,
      duplicate_name_cases: MIXED_SENTINELS.filter((row) => row.kind === 'duplicate-name-owner').length,
      visual_status: 'OPEN',
    }), 'evidence manifest omits or alters machine observations');
  return observed;
}
function validateEvidenceProvenance(manifest) {
  assert(manifest.visual_claim === VISUAL_CLAIM,
    'evidence manifest changed its exact no-visual-PASS boundary');
  assert(canonical(manifest.residual_continuity_risks) === canonical(RESIDUAL_CONTINUITY_RISKS),
    'evidence manifest changed its exact residual-continuity disclosures');
  exactObjectKeys(manifest.git, ['start', 'end', 'status_changed_during_capture'], 'evidence manifest git');
  const validateState = (state, where) => {
    exactObjectKeys(state, ['head', 'branch', 'dirty', 'status_lines', 'source_claim'], where);
    assert(/^[0-9a-f]{40}$/.test(state.head) && typeof state.branch === 'string' && state.branch.length > 0,
      `${where}: invalid commit/branch`);
    assert(Array.isArray(state.status_lines) && state.dirty === (state.status_lines.length > 0),
      `${where}: dirty/status lines disagree`);
    assert(state.source_claim === (state.dirty ? DIRTY_SOURCE_CLAIM : CLEAN_SOURCE_CLAIM),
      `${where}: exact source claim changed`);
    return state;
  };
  const start = validateState(manifest.git.start, 'evidence manifest git start');
  const end = validateState(manifest.git.end, 'evidence manifest git end');
  assert(canonical(start) === canonical(end) && manifest.git.status_changed_during_capture === false,
    'evidence manifest git state changed during capture');
  assert(canonical(end) === canonical(gitState()),
    'evidence manifest git state differs from the current checkout');
  exactObjectKeys(manifest.source_snapshot, ['files', 'sha256'], 'evidence manifest source snapshot');
  assert(Array.isArray(manifest.source_snapshot.files),
    'evidence manifest source snapshot files must be an array');
  manifest.source_snapshot.files.forEach((row, index) => exactObjectKeys(row,
    ['file', 'bytes', 'sha256'], `evidence manifest source snapshot row ${index + 1}`));
  assert(canonical(manifest.source_snapshot) === canonical(sourceSnapshot()),
    'evidence manifest source snapshot differs from the exact current producer inventory/bytes');
}
function verifyEvidence(root, manifest) {
  const manifestPath = path.join(root, 'manifest.json');
  assert(fs.existsSync(manifestPath), 'evidence disk manifest is missing');
  const manifestStat = fs.lstatSync(manifestPath);
  assert(manifestStat.isFile() && !manifestStat.isSymbolicLink(),
    'evidence disk manifest must be a real file');
  let diskManifest;
  try { diskManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
  catch (error) { fail(`evidence disk manifest is invalid JSON: ${error.message}`); }
  assert(canonical(diskManifest) === canonical(manifest),
    'evidence disk manifest differs from the validated in-memory contract');
  manifest = diskManifest;
  const readmePath = path.join(root, 'README.md');
  assert(fs.existsSync(readmePath), 'evidence README is missing');
  const readmeStat = fs.lstatSync(readmePath);
  assert(readmeStat.isFile() && !readmeStat.isSymbolicLink(), 'evidence README must be a real file');
  assert(fs.readFileSync(readmePath, 'utf8') === expectedEvidenceReadme(manifest),
    'evidence README differs from the exact UNREVIEWED / OPEN contract');
  exactObjectKeys(manifest, ['schema', 'review_status', 'visual_continuity_status',
    'machine_anchor_visual_status', 'visual_claim', 'review_contract', 'generated_at_utc', 'contract',
    'browser', 'git', 'source_snapshot', 'reload_check', 'negative_controls',
    'residual_continuity_risks', 'machine_observations', 'summary', 'stage_order', 'anchor_contract',
    'lineages', 'cache_controls', 'mixed_kingdom_sentinels', 'mixed_sentinel_sheet', 'assets'],
  'evidence manifest');
  assert(manifest.schema === EVIDENCE_SCHEMA && manifest.review_status === 'UNREVIEWED',
    'evidence manifest schema/status invalid');
  rejectEmbeddedCompletedReview(manifest, 'evidence manifest');
  assert(manifest.visual_continuity_status === 'OPEN'
    && (manifest.machine_anchor_visual_status === 'FAIL_BYTE_IDENTICAL_STAGES'
      || manifest.machine_anchor_visual_status === 'OPEN_UNREVIEWED'),
  'evidence manifest hides its open visual-continuity boundary');
  validateEvidenceProvenance(manifest);
  validatePlatinumReview(manifest.review_contract);
  validateBrowserProvenance(manifest.browser);
  assert(typeof manifest.generated_at_utc === 'string' && !Number.isNaN(Date.parse(manifest.generated_at_utc)),
    'evidence manifest generated_at_utc is invalid');
  assert(manifest.contract === 'Fresh production-derived 13-lineage x 5-stage matrix plus 16 mixed-kingdom owner sentinels. Hybrid lineage metadata comes only from crossGenome.',
    'evidence manifest exact production contract changed');
  exactObjectKeys(manifest.reload_check,
    ['passes', 'first_order', 'second_order', 'stable_projection_sha256', 'identical'],
    'evidence manifest reload check');
  assert(manifest.reload_check.passes === 2
    && manifest.reload_check.first_order === 'forward (AB first)'
    && manifest.reload_check.second_order === 'reverse (BA first)'
    && SHA.test(manifest.reload_check.stable_projection_sha256)
    && manifest.reload_check.identical === true, 'evidence manifest reload contract changed');
  assert(canonical(manifest.negative_controls) === canonical(NEGATIVE_CONTROLS),
    'evidence manifest exact negative-control disclosures changed');
  validateFinalEvidenceRows(manifest);
  const observed = validateEvidenceMachineObservations(manifest);
  const expectedMachineStatus = observed.length ? 'FAIL_BYTE_IDENTICAL_STAGES' : 'OPEN_UNREVIEWED';
  assert(manifest.machine_anchor_visual_status === expectedMachineStatus,
    'evidence manifest machine status disagrees with pixel identity groups');
  assert(manifest.mixed_sentinel_sheet === 'mixed-kingdom/sentinels-sheet.png',
    'evidence manifest mixed-sentinel sheet is missing');
  assert(Array.isArray(manifest.assets) && manifest.assets.length === Object.values(ASSET_COUNTS).reduce((a, b) => a + b, 0),
    'evidence manifest asset count invalid');
  manifest.assets.forEach((asset, index) => verifyAssetRecord(root, asset, `manifest asset ${index + 1}`));
  const expected = [...manifest.assets.map((asset) => asset.path), 'README.md', 'manifest.json'].sort();
  assert(canonical(listFiles(root)) === canonical(expected), 'evidence disk files do not exactly match the manifest');
}
function safeRemoveStage(stage) {
  if (!stage || !fs.existsSync(stage)) return;
  const realSmoke = fs.realpathSync(SMOKE);
  const resolved = path.resolve(stage);
  const stat = fs.lstatSync(resolved);
  assert(path.dirname(resolved) === realSmoke && path.basename(resolved).startsWith('.hybrid-matrix-stage-')
    && stat.isDirectory() && !stat.isSymbolicLink(), `refusing unsafe staging cleanup: ${resolved}`);
  fs.rmSync(resolved, { recursive: true, force: true });
}
async function generate(options) {
  const output = validateOutputTarget(options.out);
  validatePlatinumReview();
  const gitAtStart = gitState();
  const sourceBefore = sourceSnapshot();
  /* ALWAYS REBUILD before reading dist. `execSync` uses the platform shell,
     so the project-standard `npx vite build` invocation also works on Windows
     without asking spawnSync to execute an npm `.cmd` shim directly. */
  execSync('npx vite build', { cwd: APP, stdio: 'inherit' });
  assert(fs.existsSync(path.join(DIST, 'hybrid-matrix.html')), 'Vite build omitted hybrid-matrix.html');
  const server = startStaticServer();
  let browser = null, stage = null;
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject); server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    assert(address && typeof address === 'object', 'static server returned no port');
    browser = await openBrowser();
    stage = fs.mkdtempSync(path.join(fs.realpathSync(SMOKE), '.hybrid-matrix-stage-'));
    const base = `http://127.0.0.1:${address.port}/hybrid-matrix.html`;
    const first = await drainPass(browser, `${base}?emit=1&order=forward`, stage, true);
    const firstValidated = validateBrowserReport(first.report, { expectEmit: true, expectOrder: 'forward' });
    assert(first.written.size === firstValidated.assets.size, 'browser completed before every declared asset was drained');
    console.log('  first browser pass complete; starting reverse-order reload');
    const second = await drainPass(browser, `${base}?emit=0&order=reverse&reload=1`, stage, false);
    validateReload(first.report, second.report);
    const assets = joinWrittenAssets(first.report, first.written);
    const sourceAfter = sourceSnapshot();
    sourceUnchanged(sourceBefore, sourceAfter);
    const gitAtEnd = gitState();
    const browserProvenance = browser.browser;
    await browser.close(); browser = null;
    const manifest = {
      schema: EVIDENCE_SCHEMA,
      review_status: 'UNREVIEWED',
      visual_continuity_status: first.report.visual_continuity_status,
      machine_anchor_visual_status: first.report.machine_anchor_visual_status,
      visual_claim: VISUAL_CLAIM,
      review_contract: PLATINUM_REVIEW,
      generated_at_utc: new Date().toISOString(),
      contract: 'Fresh production-derived 13-lineage x 5-stage matrix plus 16 mixed-kingdom owner sentinels. Hybrid lineage metadata comes only from crossGenome.',
      browser: browserProvenance,
      git: {
        start: gitAtStart,
        end: gitAtEnd,
        status_changed_during_capture: canonical(gitAtStart) !== canonical(gitAtEnd),
      },
      source_snapshot: sourceBefore,
      reload_check: {
        passes: 2,
        first_order: 'forward (AB first)',
        second_order: 'reverse (BA first)',
        stable_projection_sha256: sha256(canonical(stableReportProjection(first.report))),
        identical: true,
      },
      negative_controls: NEGATIVE_CONTROLS,
      residual_continuity_risks: RESIDUAL_CONTINUITY_RISKS,
      machine_observations: {
        byte_identical_anchor_lineages: first.report.lineages
          .filter((lineage) => lineage.pixel_identity_groups.length > 0)
          .map((lineage) => ({
            lineage_id: lineage.lineage_id,
            species: lineage.species,
            pixel_identity_groups: lineage.pixel_identity_groups,
            status: lineage.anchor_visual_differentiation,
          })),
        required_human_verdict: true,
        mixed_owner_sentinels: {
          total: first.report.mixed_kingdom_sentinels.length,
          unique_owner_cases: first.report.mixed_kingdom_sentinels
            .filter((row) => row.sentinel_kind === 'single-lineage-owner').length,
          duplicate_name_cases: first.report.mixed_kingdom_sentinels
            .filter((row) => row.sentinel_kind === 'duplicate-name-owner').length,
          visual_status: 'OPEN',
        },
      },
      summary: first.report.summary,
      stage_order: first.report.stage_order,
      anchor_contract: first.report.anchor_contract,
      lineages: first.report.lineages,
      cache_controls: first.report.cache_controls,
      mixed_kingdom_sentinels: first.report.mixed_kingdom_sentinels,
      mixed_sentinel_sheet: first.report.mixed_sentinel_sheet,
      assets,
    };
    writeReadme(path.join(stage, 'README.md'), first.report);
    writeJson(path.join(stage, 'manifest.json'), manifest);
    verifyEvidence(stage, manifest);
    fs.renameSync(stage, output); stage = null;
    verifyEvidence(output, manifest);
    console.log('HYBRID CONTINUITY MATRIX EVIDENCE READY - UNREVIEWED');
    console.log('  principal matrix: 13 lineages x 5 stages = 65 portraits');
    console.log('  reversed-parent cache subset: 6 pairs / 12 portraits');
    console.log('  mixed-kingdom owner sentinels: 16 portraits (both orders/child kingdoms; current + legacy route owners included)');
    console.log(`  review artefacts: ${assets.length}`);
    console.log(`  output: ${output}`);
    console.log(`  machine anchor differentiation: ${first.report.machine_anchor_visual_status}`);
    console.log('  visual continuity/seam verdict: OPEN; human review required');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
    if (stage && fs.existsSync(stage)) safeRemoveStage(stage);
  }
}

function fakeGenome(seed, kingdom, heat, extras = {}) {
  return { seed, kingdom, color: seed % 12, form: seed % 18, body: seed % 9, loco: seed % 8,
    trait: seed % 11, size: seed % 6, diet: seed % 7, head: seed % 10, limbs: seed % 6,
    skin: seed % 9, tail: seed % 7, pattern: seed % 8, eyes: seed % 6,
    behavior: seed % 9, habitat: seed % 19, detail: seed % 7, accent: seed % 12,
    lumin: false, gen: 0, heat, ...extras };
}
function fakeCross(a, b, species, anchor, salt, owner = a._earthBlendKingdom || a.kingdom) {
  return { ...fakeGenome(hashInt((a.seed ^ 0xA5A5) >>> 0, b.seed | 0, 7), a.kingdom, a.heat),
    color: (a.color + salt) % 12, head: (b.head + salt) % 10, gen: Math.max(a.gen || 0, b.gen || 0) + 1,
    parents: [a.seed, b.seed], _earthBlend: species, _earthBlendKingdom: owner, _anchorVal: anchor,
    _src: { color: 0, head: 1, size: 0, body: 1 } };
}
function fakeAsset(pathValue, kind, width, height, identity) { return { path: pathValue, kind, width, height, identity }; }
function fakeMixedControl(genome, route, portraitSha256, selectedPortraitSha256) {
  return { genome, genome_sha256: genomeHash(genome), route, portrait_sha256: portraitSha256,
    production_matches_fresh: true, repeated_render_stable: true,
    differs_from_selected_owner: portraitSha256 !== selectedPortraitSha256 };
}
function makeFixtureMixedSentinels(assets) {
  const rows = MIXED_SENTINELS.map((spec, index) => {
    const attempt = index + 3;
    const contract = mixedInputContract(spec, attempt);
    const inputs = contract.map((expected) => {
      const seed = hashInt(expected.base, spec.salt, attempt);
      const extras = expected.named ? { _earthName: spec.name } : {};
      const genome = fakeGenome(seed, expected.kingdom, expected.heat, extras);
      const derivation = { kind: expected.named ? expected.derivationKind : 'alien-seed-search',
        formula: expected.formula, salt: spec.salt, attempt, seed, heat: expected.heat,
        ...(expected.named ? {
          exact_name_matches: expected.exactNameMatches,
          owner_source: expected.ownerSource,
          route_owner: `${expected.kingdom}|${spec.name}`,
          ...(expected.ownerSource === 'deduped-legacy-route' ? { route_owner_verified: true } : {}),
        } : {}) };
      return { id: expected.id, genome, genome_sha256: genomeHash(genome), derivation };
    });
    const anchor = spec.kind === 'duplicate-name-owner' ? 0.9 : 0.73;
    const child = fakeCross(inputs[0].genome, inputs[1].genome, spec.name, anchor, index + 11, spec.owner);
    child.kingdom = spec.child;
    child.parents = inputs.map((input) => input.genome.seed);
    const portraitSha256 = sha256(`mixed-selected-${spec.id}`);
    const portraitPath = `mixed-kingdom/${String(index + 1).padStart(2, '0')}-${spec.id}.png`;
    assets.push(fakeAsset(portraitPath, 'mixed-portrait', NATIVE, NATIVE, spec.id));
    const stripped = withoutLineage(child);
    const strippedControl = fakeMixedControl(stripped, 'procedural-owned',
      sha256(`mixed-stripped-${spec.id}`), portraitSha256);
    const markerless = { ...child }; delete markerless._earthBlendKingdom;
    const fallbackOwner = spec.kind === 'duplicate-name-owner' ? spec.child : spec.owner;
    const markerRequired = spec.kind === 'duplicate-name-owner' && spec.child !== spec.owner;
    const markerlessHash = markerRequired ? sha256(`mixed-markerless-${spec.id}`) : portraitSha256;
    const markerlessControl = {
      ...fakeMixedControl(markerless, expectedMarkerlessLineageRoute(fallbackOwner), markerlessHash, portraitSha256),
      expected_legacy_owner: fallbackOwner,
      required_to_differ: markerRequired,
    };
    let counterfactualOwnerControl = null;
    if (spec.kind === 'duplicate-name-owner') {
      const counterfactual = { ...child, _earthBlendKingdom: spec.other };
      counterfactualOwnerControl = fakeMixedControl(counterfactual, expectedLineageRoute(spec.other, spec.name),
        sha256(`mixed-counterfactual-${spec.id}`), portraitSha256);
    }
    return {
      ordinal: index + 1, sentinel_id: spec.id, sentinel_kind: spec.kind, species: spec.name,
      selected_lineage_owner: spec.owner, other_parent_kingdom: spec.other,
      parent_order: spec.order, expected_child_kingdom: spec.child,
      search: { kind: 'deterministic-seed-search', salt: spec.salt, attempt, limit: 2048 },
      inputs, cross: { function: 'crossGenome', parent_a: inputs[0].id, parent_b: inputs[1].id },
      child_genome: child, child_genome_sha256: genomeHash(child), child_kingdom: child.kingdom,
      lineage: child._earthBlend, lineage_kingdom: child._earthBlendKingdom, anchor,
      route: expectedLineageRoute(spec.owner, spec.name), expected_route: expectedLineageRoute(spec.owner, spec.name),
      production_matches_fresh: true, repeated_render_stable: true, repeated_cross_stable: true,
      portrait_sha256: portraitSha256, portrait_path: portraitPath,
      stripped_lineage_control: strippedControl,
      missing_owner_marker_control: markerlessControl,
      counterfactual_owner_control: counterfactualOwnerControl,
      visual_review_status: 'UNREVIEWED',
    };
  });
  assets.push(fakeAsset('mixed-kingdom/sentinels-sheet.png', 'mixed-sheet', 880, 1160, 'mixed-sentinels'));
  return rows;
}
function makeFixtureReport() {
  const lineages = [], assets = [], cacheControls = [];
  for (const [row, spec] of LINEAGES.entries()) {
    const catalogueIndex = row + 10, kingdomIndex = spec.kingdom === 'fauna' ? 0 : (spec.kingdom === 'flora' ? 1 : 2);
    const pureSeed = hashInt(0xEA47, catalogueIndex, kingdomIndex);
    const pure = fakeGenome(pureSeed, spec.kingdom, 1, { _earthName: spec.species });
    const mateSeed = hashInt(0xEA7E, row, catalogueIndex);
    const earthMate = fakeGenome(mateSeed, spec.kingdom, 1, { _earthName: spec.species });
    const aliens = [1, 2, 3].map((slot) => {
      const attempt = slot + row;
      const heat = (row + slot + attempt) % 3;
      return fakeGenome(hashInt(0xA11E57, row * 10000 + slot * 1000 + attempt, 0x4D), spec.kingdom, heat);
    });
    const ee = fakeCross(pure, earthMate, spec.species, 0.9, 1);
    const ea = fakeCross(pure, aliens[0], spec.species, 0.73, 2);
    const next = fakeCross(ea, aliens[1], spec.species, 0.46, 3);
    const floor = fakeCross(next, aliens[2], spec.species, 0.22, 4);
    const genomes = [pure, ee, ea, next, floor];
    const stages = genomes.map((genome, stageIndex) => {
      const stageId = STAGES[stageIndex], identity = `${spec.id}|${stageId}`;
      const portraitPath = `portraits/${spec.id}/${String(stageIndex + 1).padStart(2, '0')}-${stageId}.png`;
      const cardPath = `cards/${spec.id}/${String(stageIndex + 1).padStart(2, '0')}-${stageId}.png`;
      const silhouettePath = `silhouettes/${spec.id}/${String(stageIndex + 1).padStart(2, '0')}-${stageId}.png`;
      assets.push(fakeAsset(portraitPath, 'portrait', NATIVE, NATIVE, identity));
      assets.push(fakeAsset(cardPath, 'card', CARD, CARD, identity));
      assets.push(fakeAsset(silhouettePath, 'silhouette', NATIVE, NATIVE, identity));
      const portraitHash = sha256(`fixture-portrait-${row}-${stageIndex}`);
      return { lineage_id: spec.id, identity, stage_id: stageId, stage_index: stageIndex,
        anchor: ANCHORS[stageIndex], genome, genome_sha256: genomeHash(genome),
        portrait_path: portraitPath, card_path: cardPath, silhouette_path: silhouettePath,
        route: stageIndex ? expectedLineageRoute(spec.kingdom, spec.species) : 'named-owned',
        owned: stageIndex === 0 || expectedLineageRoute(spec.kingdom, spec.species) === 'lineage-owned',
        production_matches_fresh: true, repeated_render_stable: true, portrait_sha256: portraitHash,
        stripped_lineage_control: stageIndex ? { route: 'procedural-owned', portrait_sha256: sha256(`stripped-${row}-${stageIndex}`), differs_from_lineage: true } : null };
    });
    const inputs = [
      { id: 'pure', genome: pure, genome_sha256: genomeHash(pure), derivation: {
        kind: 'catalogue-makeGenome', formula: 'hashInt(0xEA47,catalogueIndex,kingdomIndex)',
        seed: pureSeed, catalogue_index: catalogueIndex, kingdom_index: kingdomIndex, heat: 1,
        exact_name_matches: 1,
      } },
      { id: 'earth-mate', genome: earthMate, genome_sha256: genomeHash(earthMate), derivation: {
        kind: 'named-earth-makeGenome', formula: 'hashInt(0xEA7E,row,catalogueIndex)',
        seed: mateSeed, row, catalogue_index: catalogueIndex, heat: 1,
      } },
      ...aliens.map((alien, index) => ({ id: `alien-${index + 1}`, genome: alien, genome_sha256: genomeHash(alien), derivation: {
        kind: 'alien-seed-search', formula: 'hashInt(0xA11E57,row*10000+slot*1000+attempt,0x4D)',
        seed: alien.seed, row, slot: index + 1, attempt: index + 1 + row,
        heat: alien.heat, predicate: spec.challenge,
      } })),
    ];
    const lineageSheet = `lineage-sheets/${String(row + 1).padStart(2, '0')}-${spec.id}.png`;
    const joinAtlas = `join-atlases/${String(row + 1).padStart(2, '0')}-${spec.id}.png`;
    assets.push(fakeAsset(lineageSheet, 'lineage-sheet', 2200, 1180, spec.id));
    assets.push(fakeAsset(joinAtlas, 'join-atlas', 1290, 1048, spec.id));
    lineages.push({ ordinal: row + 1, lineage_id: spec.id, set: `earth-${spec.kingdom}`,
      species: spec.species, challenge: spec.challenge,
      crop_contract: { source_pixels: 55, output_pixels: 220, scale: 4,
        coordinates: spec.crops.map(([x, y, w, h]) => ({ x, y, w, h })) },
      stage_pixel_unique_count: 5,
      pixel_identity_groups: [], anchor_visual_differentiation: 'OPEN_UNREVIEWED', inputs,
      crosses: [
        { stage_id: 'earth-earth', parent_a: 'pure', parent_b: 'earth-mate' },
        { stage_id: 'earth-alien', parent_a: 'pure', parent_b: 'alien-1' },
        { stage_id: 'next-alien', parent_a: 'earth-alien', parent_b: 'alien-2' },
        { stage_id: 'floor', parent_a: 'next-alien', parent_b: 'alien-3' },
      ], stages, lineage_sheet: lineageSheet, join_atlas: joinAtlas, visual_review_status: 'UNREVIEWED' });
    if (CACHE_IDS.includes(spec.id)) {
      const attempt = 1, alienSeedValue = hashInt(0xCA6E, row, attempt);
      const alien = fakeGenome(alienSeedValue, spec.kingdom, 1);
      const sharedSeed = hashInt((pure.seed ^ 0xA5A5) >>> 0, alien.seed | 0, 7);
      const ab = { ...fakeCross(pure, alien, spec.species, 0.73, 5), seed: sharedSeed };
      const ba = { ...fakeCross(alien, pure, spec.species, 0.73, 6), seed: sharedSeed,
        kingdom: spec.kingdom, parents: [alien.seed, pure.seed] };
      const abPath = `cache-controls/${spec.id}-AB.png`, baPath = `cache-controls/${spec.id}-BA.png`;
      assets.push(fakeAsset(abPath, 'cache-portrait', NATIVE, NATIVE, `${spec.id}|AB`));
      assets.push(fakeAsset(baPath, 'cache-portrait', NATIVE, NATIVE, `${spec.id}|BA`));
      cacheControls.push({ lineage_id: spec.id, species: spec.species, input_order_first: 'AB',
        alien: { id: 'cache-alien', genome: alien, derivation: { kind: 'makeGenome', formula: 'hashInt(0xCA6E,row,attempt)', row, attempt, heat: 1, seed: alien.seed } },
        same_seed: true, seed: sharedSeed, different_full_genomes: true, differing_fields: ['color', 'head'],
        ab_genome: ab, ba_genome: ba, ab_genome_sha256: genomeHash(ab), ba_genome_sha256: genomeHash(ba),
        ab_portrait_sha256: sha256(`cache-ab-${spec.id}`), ba_portrait_sha256: sha256(`cache-ba-${spec.id}`),
        cache_independent: true,
        ab_route: expectedLineageRoute(spec.kingdom, spec.species),
        ba_route: expectedLineageRoute(spec.kingdom, spec.species),
        ab_portrait_path: abPath, ba_portrait_path: baPath });
    }
  }
  cacheControls.sort((a, b) => a.lineage_id.localeCompare(b.lineage_id));
  assets.push(fakeAsset('cache-controls/reversed-parent-sheet.png', 'cache-sheet', 680, 1534, 'cache-subset'));
  const mixedSentinels = makeFixtureMixedSentinels(assets);
  return { schema: BROWSER_SCHEMA, done: true, review_status: 'UNREVIEWED',
    visual_continuity_status: 'OPEN', machine_anchor_visual_status: 'OPEN_UNREVIEWED',
    visual_claim: VISUAL_CLAIM,
    production_path: 'makeGenome -> crossGenome -> speciesPortrait', stage_order: STAGES, anchor_contract: ANCHORS,
    emit: true, render_order: 'forward',
    summary: { lineages: 13, principal_portraits: 65, cache_controls: 6, cache_portraits: 12,
      mixed_kingdom_sentinels: 16, mixed_portraits: 16,
      assets: assets.length, pixel_identical_lineages: 0, pixel_identical_lineage_ids: [] },
    checks: { earth_owner_sources_verified: true, no_handwritten_lineage_fields: true, cross_genome_provenance: true,
      anchor_values_exact: true, production_matches_fresh_route: true, repeated_fresh_render_stable: true,
      stripped_lineage_bypass_differs: true, stage_genome_identities_distinct: true,
      pixel_identity_groups_accounted: true, cache_permutation_independent: true,
      mixed_parent_order_child_kingdom_coverage: true, mixed_lineage_owner_preserved: true,
      mixed_production_route_follows_owner: true, duplicate_name_owner_pixels_set_specific: true,
      mixed_stripped_lineage_bypass_differs: true, mixed_repeated_cross_stable: true },
    lineages, cache_controls: cacheControls, mixed_kingdom_sentinels: mixedSentinels,
    mixed_sentinel_sheet: 'mixed-kingdom/sentinels-sheet.png', assets };
}
function expectRejected(label, work, pattern) {
  let caught = null;
  try { work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected defect was accepted`);
  assert(pattern.test(caught.message), `SELFTEST ${label}: wrong rejection (${caught.message})`);
}
function fakePng(width, height, tag = 0x41) {
  const buffer = Buffer.alloc(32, tag); Buffer.from('89504e470d0a1a0a', 'hex').copy(buffer, 0);
  buffer.writeUInt32BE(width, 16); buffer.writeUInt32BE(height, 20); return buffer;
}
function runSelftest() {
  validatePlatinumReview();
  expectRejected('Platinum review contract drift', () => validatePlatinumReview({
    ...PLATINUM_REVIEW, baseline_archive_sha256: 'f'.repeat(64),
  }), /review contract changed/);
  const fixtureBrowser = { executable: '/fixture/browser', product: 'Fixture/1', revision: '@fixture',
    user_agent: 'Fixture UA', js_version: '1', protocol_version: '1.3' };
  validateBrowserProvenance(fixtureBrowser);
  expectRejected('browser provenance omission', () => validateBrowserProvenance({
    ...fixtureBrowser, protocol_version: undefined,
  }), /browser\.protocol_version/);
  const report = makeFixtureReport();
  validateBrowserReport(report, { expectEmit: true, expectOrder: 'forward' });
  const machineEnvelope = {
    lineages: report.lineages,
    machine_observations: {
      byte_identical_anchor_lineages: [], required_human_verdict: true,
      mixed_owner_sentinels: { total: 16, unique_owner_cases: 8,
        duplicate_name_cases: 8, visual_status: 'OPEN' },
    },
  };
  validateEvidenceMachineObservations(machineEnvelope);
  const escapedMachineEnvelope = structuredClone(machineEnvelope);
  escapedMachineEnvelope.machine_observations.release_signoff = 'Nick approved Platinum certification';
  expectRejected('embedded machine-observation signoff',
    () => validateEvidenceMachineObservations(escapedMachineEnvelope), /keys are incomplete or unexpected/);
  const reverse = structuredClone(report); reverse.emit = false; reverse.render_order = 'reverse';
  for (const cache of reverse.cache_controls) cache.input_order_first = 'BA';
  validateReload(report, reverse);
  /* Byte-identical pixels are an accepted evidence finding only when every
     exact stage genome remains distinct and the FAIL/OPEN observation is
     complete. This positive control prevents the integrity gate from turning
     a real visual failure into an evidence-generation failure. */
  const identicalPixels = structuredClone(report);
  const observedLineage = identicalPixels.lineages[10];
  observedLineage.stages[1].portrait_sha256 = observedLineage.stages[0].portrait_sha256;
  observedLineage.stage_pixel_unique_count = 4;
  observedLineage.pixel_identity_groups = derivePixelIdentityGroups(observedLineage.stages);
  observedLineage.anchor_visual_differentiation = 'FAIL_BYTE_IDENTICAL_STAGES';
  identicalPixels.summary.pixel_identical_lineages = 1;
  identicalPixels.summary.pixel_identical_lineage_ids = [observedLineage.lineage_id];
  identicalPixels.machine_anchor_visual_status = 'FAIL_BYTE_IDENTICAL_STAGES';
  validateBrowserReport(identicalPixels, { expectEmit: true, expectOrder: 'forward' });

  const missing = structuredClone(report); missing.lineages.pop();
  expectRejected('missing species', () => validateBrowserReport(missing), /expected 13 lineages/);
  const duplicate = structuredClone(report); duplicate.lineages[1].lineage_id = duplicate.lineages[0].lineage_id;
  expectRejected('duplicate identity', () => validateBrowserReport(duplicate), /missing, duplicate, or wrong catalogue identity/);
  const handwritten = structuredClone(report); handwritten.lineages[0].stages[2].genome._anchorVal = 0.91;
  expectRejected('handwritten genome', () => validateBrowserReport(handwritten), /stale full-genome SHA-256/);
  const nondeterministic = structuredClone(report); nondeterministic.lineages[0].stages[0].repeated_render_stable = false;
  expectRejected('nondeterminism', () => validateBrowserReport(nondeterministic), /repeat-render check failed/);
  const badOrder = structuredClone(report); [badOrder.lineages[0].stages[1], badOrder.lineages[0].stages[2]] = [badOrder.lineages[0].stages[2], badOrder.lineages[0].stages[1]];
  expectRejected('bad stage order', () => validateBrowserReport(badOrder), /bad stage order/);
  const bypass = structuredClone(report); bypass.lineages[0].stages[2].route = 'procedural-owned';
  expectRejected('hybrid bypass', () => validateBrowserReport(bypass), /wrong reviewed lineage route/);
  const ownedFaunaBypass = structuredClone(report); ownedFaunaBypass.lineages[0].stages[2].route = 'lineage-verbatim';
  expectRejected('reviewed fauna owner bypass', () => validateBrowserReport(ownedFaunaBypass), /wrong reviewed lineage route/);
  const protectedFaunaDrift = structuredClone(report); protectedFaunaDrift.lineages[5].stages[2].route = 'lineage-owned';
  expectRejected('protected fauna route drift', () => validateBrowserReport(protectedFaunaDrift), /wrong reviewed lineage route/);
  const protectedPureRouteDrift = structuredClone(report);
  protectedPureRouteDrift.lineages[4].stages[0].route = 'named-verbatim';
  protectedPureRouteDrift.lineages[4].stages[0].owned = false;
  expectRejected('protected pure named-owner route drift', () => validateBrowserReport(protectedPureRouteDrift),
    /pure stage must use the exact named owner route/);
  const finalManifestRouteDrift = structuredClone(report);
  finalManifestRouteDrift.lineages[0].stages[2].route = 'lineage-verbatim';
  finalManifestRouteDrift.lineages[0].stages[2].owned = false;
  expectRejected('final evidence route drift', () => validateFinalEvidenceRows(finalManifestRouteDrift),
    /wrong reviewed lineage route/);
  const finalManifestSummaryDrift = structuredClone(report);
  finalManifestSummaryDrift.summary.lineages = 12;
  expectRejected('final evidence summary drift', () => validateFinalEvidenceRows(finalManifestSummaryDrift),
    /exact arithmetic\/pixel summary differs/);
  const embeddedCompletedReview = structuredClone(report);
  embeddedCompletedReview.lineages[0].human_verdict = { band: 'PASS', reviewer: 'fixture' };
  expectRejected('embedded completed review', () => validateBrowserReport(embeddedCompletedReview),
    /embedded completed-review field/);
  const embeddedCompletedAssessment = structuredClone(report);
  embeddedCompletedAssessment.lineages[0].assessment = 'Verdict: PASS';
  expectRejected('embedded completed-review value', () => validateBrowserReport(embeddedCompletedAssessment),
    /embedded completed-review value/);
  const unknownLineageMetadata = structuredClone(report);
  unknownLineageMetadata.lineages[0].platinum_status = 'yes';
  expectRejected('unknown lineage metadata', () => validateBrowserReport(unknownLineageMetadata),
    /keys are incomplete or unexpected/);
  const unknownGenomeMetadata = structuredClone(report);
  unknownGenomeMetadata.lineages[0].inputs[0].genome.reviewDecision = 'Nick endorses Platinum';
  unknownGenomeMetadata.lineages[0].inputs[0].genome_sha256 =
    genomeHash(unknownGenomeMetadata.lineages[0].inputs[0].genome);
  expectRejected('unknown genome metadata', () => validateBrowserReport(unknownGenomeMetadata),
    /unsupported genome field/);
  const embeddedAssetSignoff = structuredClone(report);
  embeddedAssetSignoff.assets[0].release_signoff = 'Nick';
  expectRejected('embedded asset signoff', () => validateBrowserReport(embeddedAssetSignoff),
    /embedded completed-review field/);
  const appendedVisualApproval = structuredClone(report);
  appendedVisualApproval.visual_claim += ' Platinum approved by Nick.';
  expectRejected('appended visual approval', () => validateBrowserReport(appendedVisualApproval),
    /embedded completed-review value|exact no-visual-PASS boundary/);
  const missingMixed = structuredClone(report); missingMixed.mixed_kingdom_sentinels.pop();
  expectRejected('missing mixed sentinel', () => validateBrowserReport(missingMixed), /expected 16 mixed-kingdom sentinels/);
  const legacyClaimedAsCatalogue = structuredClone(report);
  const legacyInput = legacyClaimedAsCatalogue.mixed_kingdom_sentinels[8].inputs
    .find((input) => input.id === 'microbe-earth');
  legacyInput.derivation.kind = 'named-earth-seed-search';
  legacyInput.derivation.owner_source = 'current-catalogue';
  expectRejected('deduped legacy owner claimed as current catalogue',
    () => validateBrowserReport(legacyClaimedAsCatalogue), /named Earth owner provenance missing/);
  const mixedOwnerLoss = structuredClone(report);
  mixedOwnerLoss.mixed_kingdom_sentinels[0].child_genome._earthBlendKingdom = 'fauna';
  mixedOwnerLoss.mixed_kingdom_sentinels[0].child_genome_sha256 =
    genomeHash(mixedOwnerLoss.mixed_kingdom_sentinels[0].child_genome);
  mixedOwnerLoss.mixed_kingdom_sentinels[0].lineage_kingdom = 'fauna';
  expectRejected('mixed owner loss', () => validateBrowserReport(mixedOwnerLoss),
    /_earthBlendKingdom did not follow/);
  const mixedRouteBypass = structuredClone(report);
  mixedRouteBypass.mixed_kingdom_sentinels[4].route = 'lineage-verbatim';
  expectRejected('mixed route bypass', () => validateBrowserReport(mixedRouteBypass),
    /production route followed child kingdom/);
  const mixedChildCoverage = structuredClone(report);
  mixedChildCoverage.mixed_kingdom_sentinels[1].child_genome.kingdom = 'flora';
  mixedChildCoverage.mixed_kingdom_sentinels[1].child_kingdom = 'flora';
  mixedChildCoverage.mixed_kingdom_sentinels[1].child_genome_sha256 =
    genomeHash(mixedChildCoverage.mixed_kingdom_sentinels[1].child_genome);
  expectRejected('mixed child coverage collapse', () => validateBrowserReport(mixedChildCoverage),
    /did not follow the selected lineage owner/);
  const duplicateOwnerCollapse = structuredClone(report);
  duplicateOwnerCollapse.mixed_kingdom_sentinels[8].counterfactual_owner_control.portrait_sha256 =
    duplicateOwnerCollapse.mixed_kingdom_sentinels[8].portrait_sha256;
  duplicateOwnerCollapse.mixed_kingdom_sentinels[8].counterfactual_owner_control.differs_from_selected_owner = false;
  expectRejected('duplicate-name owner collapse', () => validateBrowserReport(duplicateOwnerCollapse),
    /did not select set-specific pixels/);
  const markerBypass = structuredClone(report);
  markerBypass.mixed_kingdom_sentinels[9].missing_owner_marker_control.portrait_sha256 =
    markerBypass.mixed_kingdom_sentinels[9].portrait_sha256;
  markerBypass.mixed_kingdom_sentinels[9].missing_owner_marker_control.differs_from_selected_owner = false;
  expectRejected('duplicate marker bypass', () => validateBrowserReport(markerBypass),
    /removing a required duplicate owner marker did not change pixels/);
  const mixedParentOrder = structuredClone(report);
  mixedParentOrder.mixed_kingdom_sentinels[2].inputs.reverse();
  expectRejected('mixed parent order', () => validateBrowserReport(mixedParentOrder), /exact parent order is missing/);
  const mixedFreshBypass = structuredClone(report);
  mixedFreshBypass.mixed_kingdom_sentinels[3].production_matches_fresh = false;
  expectRejected('mixed production bypass', () => validateBrowserReport(mixedFreshBypass),
    /production\/repeat outcome invalid/);
  const collapsed = structuredClone(report); collapsed.cache_controls[0].ba_portrait_sha256 = collapsed.cache_controls[0].ab_portrait_sha256;
  expectRejected('seed-only cache collision', () => validateBrowserReport(collapsed), /cache portrait collision/);
  const hiddenPixelIdentity = structuredClone(identicalPixels);
  hiddenPixelIdentity.lineages[10].pixel_identity_groups = [];
  expectRejected('hidden pixel identity', () => validateBrowserReport(hiddenPixelIdentity), /pixel identity groups are stale or incomplete/);
  const staleGenome = structuredClone(report); staleGenome.lineages[0].inputs[0].genome_sha256 = '0'.repeat(64);
  expectRejected('stale genome hash', () => validateBrowserReport(staleGenome), /stale full-genome SHA-256/);
  const traversal = structuredClone(report); traversal.assets[0].path = '../outside.png';
  expectRejected('path traversal', () => validateBrowserReport(traversal), /path traversal/);

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-hybrid-matrix-selftest-'));
  try {
    const allowed = path.join(temp, 'allowed'); fs.mkdirSync(allowed);
    assert(validateOutputTarget('new-evidence', allowed) === path.join(fs.realpathSync(allowed), 'new-evidence'),
      'SELFTEST valid output target failed');
    const existing = path.join(allowed, 'existing'); fs.mkdirSync(existing);
    expectRejected('existing output', () => validateOutputTarget('existing', allowed), /already exists/);
    expectRejected('overlapping output path', () => validateOutputTarget('../allowed', allowed), /safe new directory name/);
    try {
      const link = path.join(temp, 'allowed-link'); fs.symlinkSync(allowed, link, 'junction');
      expectRejected('symlink output parent', () => validateOutputTarget('new-evidence', link), /real directory, not a link/);
    } catch (error) {
      if (!/EPERM|operation not permitted/i.test(String(error))) throw error;
    }
    const file = path.join(temp, 'asset.png');
    const good = fakePng(440, 440); fs.writeFileSync(file, good);
    const asset = { path: 'asset.png', width: 440, height: 440, bytes: good.length, sha256: sha256(good) };
    verifyAssetRecord(temp, asset, 'fixture asset');
    expectRejected('stale output hash', () => verifyAssetRecord(temp, { ...asset, sha256: 'f'.repeat(64) }, 'fixture stale hash'), /stale SHA-256/);
    expectRejected('stale output dimensions', () => verifyAssetRecord(temp, { ...asset, width: 441 }, 'fixture stale dimensions'), /stale dimensions/);
    const diskContract = path.join(temp, 'disk-contract'); fs.mkdirSync(diskContract);
    writeJson(path.join(diskContract, 'manifest.json'), { ...report, review_status: 'REVIEWED' });
    fs.writeFileSync(path.join(diskContract, 'README.md'), expectedEvidenceReadme(report));
    expectRejected('disk manifest mutation', () => verifyEvidence(diskContract, report),
      /disk manifest differs from the validated in-memory contract/);
    writeJson(path.join(diskContract, 'manifest.json'), report);
    fs.writeFileSync(path.join(diskContract, 'README.md'), `${expectedEvidenceReadme(report)}\nOverall: PASS\n`);
    expectRejected('disk README mutation', () => verifyEvidence(diskContract, report),
      /README differs from the exact UNREVIEWED \/ OPEN contract/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  console.log('HYBRID CONTINUITY MATRIX SELFTEST PASS');
  console.log('  valid 13x5 report + forward/reverse reload: accepted');
  console.log('  exact-genome stages with disclosed byte-identical pixels: accepted as OPEN/FAIL evidence');
  console.log('  missing/duplicate/handwritten/nondeterministic/stage-order defects: rejected');
  console.log('  hybrid/owned-fauna/protected-fauna bypasses + seed-only cache collision: rejected');
  console.log('  current/legacy owner provenance + mixed route/child/order/marker bypasses: rejected');
  console.log('  stale genome/output hashes + dimensions: rejected');
  console.log('  traversal/existing/overlap/symlink targets: rejected');
}
function parseArgs(args) {
  const options = { selftest: false, help: false, out: null };
  for (const argument of args) {
    if (argument === '--selftest') options.selftest = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument.startsWith('--out=')) options.out = argument.slice('--out='.length);
    else fail(`unknown argument: ${argument}`);
  }
  assert(!(options.selftest && options.out), '--selftest does not accept --out');
  if (!options.selftest && !options.help) assert(options.out, 'missing required --out=<new-name-under-apps/game/smoke>');
  return options;
}
function usage() {
  console.log('Usage:');
  console.log('  node tools/hybridmatrix.mjs --out=<new-name-under-apps/game/smoke>');
  console.log('  node tools/hybridmatrix.mjs --selftest');
  console.log('');
  console.log('The output must be a new direct child of apps/game/smoke. Existing evidence is never overwritten.');
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) usage();
  else if (options.selftest) runSelftest();
  else await generate(options);
} catch (error) {
  console.error('HYBRID CONTINUITY MATRIX FAILED');
  console.error(`  ${error.message}`);
  process.exitCode = 1;
}
