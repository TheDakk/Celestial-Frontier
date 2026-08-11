/* currentreviewpackage.mjs - package current-only combined review evidence.

   This creates a NEW, explicitly non-certifying ZIP from three independently
   prepared evidence roots. It never creates, imports, or implies a verdict.

   Usage:
     node tools/currentreviewpackage.mjs \
       --catalogue=<gp71 --prepare root> \
       --layout=<fullresetlayout --prepare --packets root> \
       --hybrid=<hybridmatrix root> \
       --output=<new .zip>
     node tools/currentreviewpackage.mjs --freshness=<package.zip-or-extracted-root>
     node tools/currentreviewpackage.mjs --selftest
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HYBRID_REVIEW_LINEAGES } from './hybridreviewcontract.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '..');
const REPOSITORY_ROOT = path.resolve(V2, '..', '..');
const PRODUCER_FILE = fileURLToPath(import.meta.url);
const BROWSER_CDP_FILE = path.join(HERE, 'browsercdp.mjs');

const SHA = /^[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40}$/;
const CLEAN_STATUS_SHA256 = crypto.createHash('sha256').update('').digest('hex');

const PACKAGE_SCHEMA = 'cf.current-review.package.v2';
const REVIEW_TEMPLATE_SCHEMA = 'cf.current-review.hybrid-template.v2';
const PREPARATION_SCHEMA = 'cf.gp71.rejudge-preparation.v2';
const IDENTITY_SCHEMA = 'cf.gp71.identity-manifest.v2';
const PORTRAIT_SCHEMA = 'cf.gp71.portrait-manifest.v2';
const CAPTURE_SCHEMA = 'cf.capture-provenance.v1';
const PACKET_SCHEMA = 'cf.gp71.packet.v1';
const PLAN_SCHEMA = 'cf.full-reset.catalogue-plan.v2';
const INDEX_SCHEMA = 'cf.full-reset.catalogue-index.v2';
const PROCEDURAL_INDEX_SCHEMA = 'cf.full-reset.procedural-plan-index.v2';
const PACKET_MANIFEST_SCHEMA = 'cf.full-reset.packet-manifest.v2';
const HYBRID_SCHEMA = 'cf.hybrid-continuity.evidence.v4';

const SETS = Object.freeze({
  'earth-fauna': 631,
  'earth-flora': 332,
  'earth-fungi': 27,
  'earth-microbe': 20,
  procedural: 240,
});
const TOTAL = 1250;
const CATALOGUE_PACKETS = 196;
const LAYOUT_FAMILIES = 181;
const LAYOUT_PACKETS = 233;
const LAYOUT_SHEETS = 466;
const PHYSICAL_PNG_COUNTS = Object.freeze({
  catalogue_portraits: 1250,
  catalogue_packet_strips: 196,
  layout_packet_sheets: 466,
  hybrid_assets: 251,
  total: 2163,
});
const STAGES = Object.freeze(['pure', 'earth-earth', 'earth-alien', 'next-alien', 'floor']);
const ANCHORS = Object.freeze([1, 0.9, 0.73, 0.46, 0.22]);
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
const HYBRID_LINEAGES = Object.freeze(HYBRID_REVIEW_LINEAGES.map((row) => Object.freeze({
  ...row, set: `earth-${row.kingdom}`,
})));
const HYBRID_CACHE_IDS = Object.freeze(['dragonfly', 'eagle', 'elephant', 'fruit-bat', 'great-white-shark', 'wolf']);
const OWNED_FAUNA_LINEAGES = new Set(['Fruit Bat', 'Eagle', 'Wolf', 'Elephant', 'Chameleon', 'Dragonfly', 'Octopus']);
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
const PLATINUM_REVIEW = Object.freeze({
  name: 'Celestial Frontier Current Full Generations Platinum Review',
  file: 'reference/Celestial_Frontier_Current_Full_Generations_Platinum_Review_2026-08-10.md',
  sha256: '5af3a33f0648f96115a421ea64cc70f97846f62e89dc8631deeb310103c708c2',
  baseline_source_commit: '79ce14460998d653ee753e49e8f8016e754c82e4',
  baseline_archive_sha256: '18080276385915e08e12c76a3413f46b5472953a7c8cca161d5be4fd6a699dc5',
  disposition: 'REPAIR_REQUIRED_NOT_PLATINUM',
});
const HYBRID_NEGATIVE_CONTROLS = Object.freeze({
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
const HYBRID_VISUAL_CLAIM = 'No seamlessness or art PASS is awarded by this evidence tool.';
const HYBRID_CLEAN_SOURCE_CLAIM = 'Clean working tree at the recorded commit.';
const HYBRID_RESIDUAL_CONTINUITY_RISKS = Object.freeze([
  'Flora, fungi and microbe hybrids keep the exact named Earth owner; anchor drift reaches that owner only through inherited child genome, seed and palette values that the painter actually reads.',
  'A low-anchor non-fauna hybrid may retain an exact Earth silhouette or ignore some reversed-parent trait differences. This is review evidence, not a seamlessness claim.',
  'Apple remains in the principal 13x5 matrix but is excluded from the cache subset because its same-seed AB/BA expected pixels were identical; using it as a collision control would be vacuous.',
]);
const HYBRID_SOURCE_ROOTS = Object.freeze([
  path.join(V2, 'packages', 'art', 'src'),
  path.join(V2, 'packages', 'domain', 'genetics', 'src'),
  path.join(V2, 'packages', 'domain', 'genome', 'src'),
  path.join(V2, 'packages', 'domain', 'rand', 'src'),
  path.join(V2, 'packages', 'domain', 'descriptors', 'src'),
  path.join(V2, 'packages', 'domain', 'speciestraits', 'src'),
]);
const HYBRID_SOURCE_FILES = Object.freeze([
  path.join(V2, 'apps', 'game', 'hybrid-matrix.html'),
  path.join(V2, 'apps', 'game', 'src', 'hybridmatrixaudit.ts'),
  path.join(V2, 'apps', 'game', 'vite.config.ts'),
  path.join(V2, 'apps', 'game', 'package.json'),
  path.join(V2, 'package.json'),
  path.join(V2, 'package-lock.json'),
  path.join(HERE, 'browsercdp.mjs'),
  path.join(HERE, 'browserpath.mjs'),
  path.join(HERE, 'hybridreviewcontract.mjs'),
  path.join(V2, PLATINUM_REVIEW.file),
  path.join(HERE, 'hybridmatrix.mjs'),
]);
const PACKAGE_SCOPE_CAVEATS = Object.freeze([
  'CURRENT-ONLY: every included source claim is bound to the one recorded clean commit; this package is not historical or longitudinal evidence.',
  'The hybrid matrix contains 13 representative Earth lineages, not every bloodline and not every possible future generation.',
  'Amoeba is the principal microbe five-stage lineage; mixed-owner Green Algae sentinels remain ownership controls, not a substitute for its visual review.',
  'Low-anchor non-fauna hybrids may retain an exact Earth silhouette or ignore some reversed-parent trait differences and require human review.',
  'Apple remains in the principal matrix but is excluded from the cache-collision subset because equal expected pixels would make that negative control vacuous.',
  'Trust boundary: producer code, approved reference inputs, and platform intrinsics at the recorded clean commit are trusted. SHA-256 and FRESH_FOR_CURRENT detect accidental or ordinary source drift; they are integrity checks, not authenticity signatures against coordinated malicious rewriting and resealing.',
]);
const FIXTURE_BROWSER = Object.freeze({
  executable: process.platform === 'win32' ? 'C:/fixture/browser.exe' : '/fixture/browser',
  product: 'FixtureBrowser/1',
  revision: 'fixture-revision',
  user_agent: 'FixtureBrowser/1 selftest',
  js_version: 'fixture-js-1',
  protocol_version: '1.3',
});
const HYBRID_KIND_COUNTS = Object.freeze({
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
const HYBRID_ASSETS = Object.values(HYBRID_KIND_COUNTS).reduce((sum, count) => sum + count, 0);
const FORBIDDEN_INPUT_ARTIFACT = /(?:^|[-_. ])(?:certif(?:y|ied|ication)?|certificate|verdicts?|ledger|results?|approvals?|sign[-_ ]?off)(?:[-_. ]|$)/i;

function expectedHybridLineageRoute(set, species) {
  const owner = set.startsWith('earth-') ? set.slice('earth-'.length) : set;
  return owner === 'fauna' && !OWNED_FAUNA_LINEAGES.has(species)
    ? 'lineage-verbatim'
    : 'lineage-owned';
}
function withoutLineage(genome) {
  const stripped = { ...genome };
  delete stripped._earthName; delete stripped._earthBlend; delete stripped._earthBlendKingdom;
  delete stripped._anchorVal; delete stripped._src;
  return stripped;
}
function hashInt(seed, x, y) {
  let h = seed | 0;
  h = Math.imul(h ^ (x | 0), 374761393);
  h = Math.imul(h ^ (y | 0), 668265263);
  h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13;
  return h >>> 0;
}
function expectedMarkerlessLineageRoute(owner) {
  return owner === 'fauna' ? 'lineage-verbatim' : 'lineage-owned';
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
function expectedMixedInputIds(spec) {
  if (spec.kind === 'single-lineage-owner') {
    return spec.order === 'earth-first' ? ['earth', 'wild'] : ['wild', 'earth'];
  }
  return spec.order === 'flora-first'
    ? ['flora-earth', 'microbe-earth']
    : ['microbe-earth', 'flora-earth'];
}
function validatePackagedMixedInput(input, expected, spec, attempt, where) {
  assert(isObject(input) && isObject(input.genome) && isObject(input.derivation),
    `${where}: input/genome/derivation is missing`);
  exactObjectKeys(input, ['id', 'genome', 'genome_sha256', 'derivation'], where);
  exactObjectKeys(input.derivation, ['kind', 'formula', 'salt', 'attempt', 'seed', 'heat',
    ...(expected.named ? ['exact_name_matches', 'owner_source', 'route_owner'] : []),
    ...(expected.ownerSource === 'deduped-legacy-route' ? ['route_owner_verified'] : [])],
  `${where}.derivation`);
  validateEvidenceGenome(input.genome, `${where}.genome`);
  assert(input.id === expected.id
    && exactSha(input.genome_sha256, `${where}.genome_sha256`) === sha256(stableJson(input.genome)),
  `${where}: wrong input identity or stale full-genome SHA-256`);
  const genome = input.genome; const derivation = input.derivation;
  const expectedSeed = hashInt(expected.base, spec.salt, attempt);
  assert(derivation.salt === spec.salt && derivation.attempt === attempt
    && genome.seed === expectedSeed && derivation.seed === expectedSeed
    && genome.kingdom === expected.kingdom && genome.heat === expected.heat
    && derivation.formula === expected.formula && derivation.heat === expected.heat,
  `${where}: deterministic input provenance changed`);
  if (expected.named) {
    assert(derivation.kind === expected.derivationKind
      && derivation.exact_name_matches === expected.exactNameMatches
      && derivation.owner_source === expected.ownerSource
      && derivation.route_owner === `${expected.kingdom}|${spec.name}`,
    `${where}: named Earth owner provenance is missing`);
    if (expected.ownerSource === 'deduped-legacy-route') {
      assert(derivation.route_owner_verified === true, `${where}: legacy route owner was not verified`);
    }
    assert(genome._earthName === spec.name && genome._earthBlend === undefined
      && genome._earthBlendKingdom === undefined && genome._anchorVal === undefined,
    `${where}: named Earth lineage fields changed`);
  } else {
    assert(derivation.kind === 'alien-seed-search' && genome._earthName === undefined
      && genome._earthBlend === undefined && genome._earthBlendKingdom === undefined
      && genome._anchorVal === undefined, `${where}: alien input carries lineage fields`);
  }
}
function validatePackagedMixedControl(control, expectedGenome, selectedPortraitSha256, where) {
  assert(isObject(control) && isObject(control.genome), `${where}: control/genome is missing`);
  const markerControl = Object.hasOwn(control, 'expected_legacy_owner')
    || Object.hasOwn(control, 'required_to_differ');
  exactObjectKeys(control, ['genome', 'genome_sha256', 'route', 'portrait_sha256',
    'production_matches_fresh', 'repeated_render_stable', 'differs_from_selected_owner',
    ...(markerControl ? ['expected_legacy_owner', 'required_to_differ'] : [])], where);
  validateEvidenceGenome(control.genome, `${where}.genome`);
  assert(exactSha(control.genome_sha256, `${where}.genome_sha256`) === sha256(stableJson(control.genome))
    && stableJson(control.genome) === stableJson(expectedGenome), `${where}: injected genome/hash is stale`);
  assert(/^(?:lineage|procedural)-(?:owned|verbatim)$/.test(control.route)
    && exactSha(control.portrait_sha256, `${where}.portrait_sha256`)
    && control.production_matches_fresh === true && control.repeated_render_stable === true,
  `${where}: route/renderer outcome is incomplete`);
  assert(control.differs_from_selected_owner === (control.portrait_sha256 !== selectedPortraitSha256),
    `${where}: selected-owner pixel-difference flag is stale`);
}

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function hashFile(file) { return sha256(fs.readFileSync(file)); }
function portable(value) { return value.split(path.sep).join('/'); }
function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function currentHybridSourceSnapshot() {
  const files = [...HYBRID_SOURCE_FILES];
  const visit = (directory) => {
    const stat = fs.lstatSync(directory);
    assert(stat.isDirectory() && !stat.isSymbolicLink(),
      `hybrid current source path must be a real directory: ${portable(directory)}`);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      const fileStat = fs.lstatSync(file);
      assert(!fileStat.isSymbolicLink(), `hybrid current source refuses link: ${portable(file)}`);
      if (fileStat.isDirectory()) visit(file);
      else if (fileStat.isFile() && /\.(?:ts|js|json)$/.test(entry.name)) files.push(file);
    }
  };
  HYBRID_SOURCE_ROOTS.forEach(visit);
  const rows = [...new Set(files.map((file) => path.resolve(file)))].sort(cmp).map((file) => {
    const stat = fs.lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink(),
      `hybrid current source must be a real file: ${portable(file)}`);
    return { file: portable(path.relative(V2, file)), bytes: stat.size, sha256: hashFile(file) };
  });
  return { files: rows,
    sha256: sha256(rows.map((row) => `${row.file}\u0000${row.bytes}\u0000${row.sha256}\n`).join('')) };
}
function normalized(value) {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}
function within(childValue, parentValue) {
  const child = normalized(childValue);
  const parent = normalized(parentValue);
  return child === parent || child.startsWith(parent.endsWith(path.sep) ? parent : parent + path.sep);
}
function sameJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (isObject(value)) {
    return Object.fromEntries(Object.keys(value).sort(cmp).map((key) => [key, stableValue(value[key])]));
  }
  return value;
}
function stableJson(value) { return JSON.stringify(stableValue(value)); }
function exactObjectKeys(value, expected, where) {
  assert(isObject(value), `${where}: expected an object`);
  const actual = Object.keys(value).sort(cmp);
  const wanted = [...expected].sort(cmp);
  assert(sameJson(actual, wanted), `${where}: keys are incomplete or unexpected`);
}
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
const FORBIDDEN_VERDICT_KEYS = new Set([
  'approval', 'approved_by', 'band', 'certification', 'certification_status', 'certified',
  'certified_by', 'human_verdict', 'reason', 'review_complete', 'reviewed_at',
  'reviewed_at_utc', 'reviewed_by', 'reviewer', 'reviewer_notes', 'release_signoff', 'signoff',
  'verdict', 'verdicts',
]);
function rejectEmbeddedVerdictFields(value, where, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectEmbeddedVerdictFields(item, where, [...trail, String(index)]));
    return;
  }
  if (!isObject(value)) {
    if (typeof value === 'string') assert(!/^\s*(?:PASS|POLISH|FAIL|CERTIFIED|APPROVED|ACCEPTED)\s*$/i.test(value)
      && !/\b(?:awarded|returned|rated|judged|reviewed as|certified as)\s+(?:a\s+)?(?:PASS|POLISH|FAIL|CERTIFIED|APPROVED)\b/i.test(value)
      && !/\b(?:verdict|band|status|assessment|outcome|judg(?:e)?ment)\s*[:=-]\s*(?:PASS|POLISH|FAIL|CERTIFIED|APPROVED|ACCEPTED)\b/i.test(value)
      && !/\b(?:Platinum\s+approved|approved\s+by|release\s+approved|sign[- ]?off|certification\s+approved)\b/i.test(value),
    `${where}: embedded completed-verdict value is forbidden at ${trail.join('.') || '<root>'}`);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const next = [...trail, key];
    assert(!FORBIDDEN_VERDICT_KEYS.has(key.toLowerCase()),
      `${where}: embedded verdict/certification field is forbidden at ${next.join('.')}`);
    rejectEmbeddedVerdictFields(child, where, next);
  }
}
function expectedHybridReadme(manifest) {
  const identical = manifest.lineages
    .filter((lineage) => lineage.pixel_identity_groups.length > 0)
    .map((lineage) => `${lineage.species} (${lineage.pixel_identity_groups
      .map((group) => group.stage_ids.join('=')).join('; ')})`);
  return [
    '# Hybrid continuity review evidence', '',
    'Status: UNREVIEWED. This package does not claim seamlessness or an art PASS.', '',
    `Repair ruler: ${PLATINUM_REVIEW.name} (${PLATINUM_REVIEW.sha256}); disposition ${PLATINUM_REVIEW.disposition}.`,
    `Reviewed baseline: source ${PLATINUM_REVIEW.baseline_source_commit}; archive SHA-256 ${PLATINUM_REVIEW.baseline_archive_sha256}.`, '',
    `Visual continuity: OPEN. Machine anchor differentiation: ${manifest.machine_anchor_visual_status}.`,
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
function validateUnreviewedHybridReadme(text, manifest) {
  assert(text === expectedHybridReadme(manifest),
    'hybrid README: exact generated UNREVIEWED / OPEN content changed or carries verdict material');
}
function expectedStrictVerdictSchema() {
  return {
    schema: 'cf.gp71.strict-verdict.v1',
    title: 'GP7.1 fresh strict packet verdict',
    no_verdicts_are_generated_by_prepare: true,
    required_packet_fields: {
      schema: 'cf.gp71.strict-verdict.v1',
      packet_id: 'three-digit string matching index.json',
      family: 'exact index.json family string',
      strip_sha256: 'exact SHA-256 from index.json',
      reviewer: 'nonempty human/judge identity',
      rows: 'one ordered row per packet species',
    },
    required_row_fields: {
      set: 'exact index.json set',
      species: 'exact index.json name',
      band: ['FAIL', 'POLISH', 'PASS'],
      why: 'nonempty strict reason, at least 8 characters',
      judged_at: 'YYYY-MM-DD exactly matching preparation.json review_date',
      ruler: 'GP7 fresh strict rejudge',
      freshly_rejudged: true,
      strict: true,
    },
    collector_contract: 'Only a complete 1,250-row exact join yields results and ledger. The ledger remains GP7-conformity compatible but --certify still requires every band to be PASS.',
  };
}
function nonempty(value, where) {
  assert(typeof value === 'string' && value.trim().length > 0, `${where}: expected a nonempty string`);
  const result = value.trim();
  assert(!/[\u0000-\u001f\u007f]/.test(result), `${where}: control characters are forbidden`);
  return result;
}
function exactSha(value, where) {
  const result = nonempty(value, where).toLowerCase();
  assert(SHA.test(result), `${where}: expected lowercase SHA-256`);
  return result;
}
function repositoryBindingSnapshot() {
  const run = (args) => execFileSync('git', args, {
    cwd: V2, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  const status = run(['status', '--porcelain=v1', '--untracked-files=all']);
  const reviewFile = path.join(V2, PLATINUM_REVIEW.file);
  return {
    head: run(['rev-parse', 'HEAD']).toLowerCase(),
    status_lines: status ? status.split(/\r?\n/) : [],
    producer_sha256: hashFile(PRODUCER_FILE),
    platinum_review_sha256: fs.existsSync(reviewFile) ? hashFile(reviewFile) : 'MISSING',
  };
}
function liveBrowserProvenance() {
  try {
    return JSON.parse(execFileSync(process.execPath, [BROWSER_CDP_FILE, '--print-json'], {
      cwd: V2, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim());
  } catch (error) {
    fail(`STALE_FOR_CURRENT: current browser provenance is unavailable (${error.message})`);
  }
}
function liveRepositoryState(readSnapshot = repositoryBindingSnapshot, readBrowser = liveBrowserProvenance) {
  const before = readSnapshot();
  const browser = validateBrowserRecord(readBrowser(), 'current browser provenance');
  const after = readSnapshot();
  if (stableJson(before) !== stableJson(after)) fail(
    'STALE_FOR_CURRENT: checkout binding changed during the browser provenance probe');
  return { ...after, browser_provenance: browser };
}
function validateCurrentBinding(expected, state = liveRepositoryState()) {
  assert(isObject(expected) && COMMIT.test(expected.source_commit),
    'freshness contract: expected a bound 40-hex source commit');
  if (state.head !== expected.source_commit) fail(
    `STALE_FOR_CURRENT: source commit differs (package ${expected.source_commit}; checkout ${state.head || 'UNKNOWN'})`);
  if (!Array.isArray(state.status_lines) || state.status_lines.length > 0) fail(
    `STALE_FOR_CURRENT: checkout is dirty (${Array.isArray(state.status_lines) ? state.status_lines[0] : 'status unavailable'})`);
  if (state.producer_sha256 !== expected.producer_sha256) fail(
    `STALE_FOR_CURRENT: package producer differs (package ${expected.producer_sha256}; checkout ${state.producer_sha256})`);
  if (state.platinum_review_sha256 !== expected.platinum_review_sha256) fail(
    `STALE_FOR_CURRENT: Platinum ruler differs (package ${expected.platinum_review_sha256}; checkout ${state.platinum_review_sha256})`);
  const expectedBrowser = validateBrowserRecord(expected.browser_provenance, 'freshness package browser provenance');
  const currentBrowser = validateBrowserRecord(state.browser_provenance, 'freshness current browser provenance');
  for (const field of ['executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version']) {
    if (currentBrowser[field] !== expectedBrowser[field]) fail(
      `STALE_FOR_CURRENT: browser provenance differs at ${field} (package ${expectedBrowser[field]}; current ${currentBrowser[field]})`);
  }
  return {
    status: 'FRESH_FOR_CURRENT',
    source_commit: expected.source_commit,
    checkout_clean: true,
    checkout_status_sha256: CLEAN_STATUS_SHA256,
    producer_sha256: expected.producer_sha256,
    platinum_review_sha256: expected.platinum_review_sha256,
    browser_provenance: expectedBrowser,
  };
}
function productionAnchor(value, expected, where) {
  assert(typeof value === 'number' && Number.isFinite(value)
    && Math.abs(value - expected) < 1e-9,
  `${where}: production anchor differs from the declared stage contract`);
  return value;
}
function safeRelative(value, where, extension = null) {
  const relative = nonempty(value, where);
  assert(!relative.includes('\\'), `${where}: backslashes are forbidden`);
  assert(!path.posix.isAbsolute(relative), `${where}: absolute paths are forbidden`);
  assert(path.posix.normalize(relative) === relative, `${where}: path is not normalized`);
  const parts = relative.split('/');
  assert(parts.every((part) => part && part !== '.' && part !== '..'), `${where}: path traversal is forbidden`);
  if (extension !== null) assert(relative.toLowerCase().endsWith(extension), `${where}: expected ${extension}`);
  return relative;
}
function resolveInside(root, relative, where) {
  const safe = safeRelative(relative, where);
  const file = path.resolve(root, ...safe.split('/'));
  assert(within(file, root) && normalized(file) !== normalized(root), `${where}: path escaped its root`);
  return file;
}
function rejectLink(stat, where) {
  assert(!stat.isSymbolicLink(), `${where}: symbolic links are forbidden`);
}
function realDirectory(value, where) {
  const directory = path.resolve(value);
  assert(fs.existsSync(directory), `${where}: does not exist: ${portable(directory)}`);
  const stat = fs.lstatSync(directory);
  rejectLink(stat, where);
  assert(stat.isDirectory(), `${where}: must be a directory`);
  assert(normalized(fs.realpathSync(directory)) === normalized(directory), `${where}: resolves through a link`);
  return directory;
}
function realFile(root, relative, where) {
  const file = resolveInside(root, relative, where);
  assert(fs.existsSync(file), `${where}: missing ${relative}`);
  const stat = fs.lstatSync(file);
  rejectLink(stat, where);
  assert(stat.isFile(), `${where}: must be a real file`);
  assert(normalized(fs.realpathSync(file)) === normalized(file), `${where}: resolves through a link`);
  return file;
}
function readJson(root, relative, where = relative) {
  const file = realFile(root, relative, where);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { fail(`${where}: invalid JSON (${error.message})`); }
}
function listFiles(root, where) {
  const files = [];
  const visit = (directory) => {
    const directoryStat = fs.lstatSync(directory);
    rejectLink(directoryStat, `${where} ${portable(path.relative(root, directory) || '.')}`);
    assert(directoryStat.isDirectory(), `${where}: unexpected non-directory ${portable(directory)}`);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => cmp(a.name, b.name))) {
      const file = path.join(directory, entry.name);
      const stat = fs.lstatSync(file);
      rejectLink(stat, `${where} ${portable(path.relative(root, file))}`);
      if (stat.isDirectory()) visit(file);
      else {
        assert(stat.isFile(), `${where}: non-file filesystem entry ${portable(path.relative(root, file))}`);
        files.push(portable(path.relative(root, file)));
      }
    }
  };
  visit(root);
  return files.sort(cmp);
}
function rejectForbiddenArtifacts(files, where, allowed = new Set()) {
  for (const relative of files) {
    if (allowed.has(relative)) continue;
    const parts = relative.split('/');
    assert(!parts.some((part) => FORBIDDEN_INPUT_ARTIFACT.test(part)),
      `${where}: verdict/certification artifact is forbidden: ${relative}`);
  }
}
function assertExactInventory(actual, expected, where) {
  const left = [...actual].sort(cmp);
  const right = [...expected].sort(cmp);
  if (sameJson(left, right)) return;
  const wanted = new Set(right), got = new Set(left);
  const missing = right.filter((item) => !got.has(item));
  const extra = left.filter((item) => !wanted.has(item));
  fail(`${where}: inventory mismatch; missing=${missing.slice(0, 5).join(', ') || 'none'}; extra=${extra.slice(0, 5).join(', ') || 'none'}`);
}
function pngDimensions(buffer, where) {
  assert(Buffer.isBuffer(buffer) && buffer.length >= 24, `${where}: incomplete PNG`);
  assert(buffer.toString('hex', 0, 8) === '89504e470d0a1a0a', `${where}: not a PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
function validateSetCounts(rows, where, nameField = 'species') {
  assert(Array.isArray(rows) && rows.length === TOTAL, `${where}: expected ${TOTAL} rows`);
  const counts = Object.fromEntries(Object.keys(SETS).map((set) => [set, 0]));
  const keys = new Set();
  for (const [offset, row] of rows.entries()) {
    assert(isObject(row), `${where} row ${offset + 1}: expected object`);
    const set = nonempty(row.set, `${where} row ${offset + 1}.set`);
    const species = nonempty(row[nameField], `${where} row ${offset + 1}.${nameField}`);
    assert(set in counts, `${where} row ${offset + 1}: unknown set ${set}`);
    const key = `${set}\u0000${species}`;
    assert(!keys.has(key), `${where}: duplicate identity ${set}/${species}`);
    keys.add(key); counts[set]++;
  }
  assert(sameJson(counts, SETS), `${where}: set counts are ${JSON.stringify(counts)}, expected ${JSON.stringify(SETS)}`);
  return { counts, keys };
}
function validateCapture(raw, where, expectedCommit = null) {
  assert(isObject(raw), `${where}: missing provenance`);
  const keys = ['schema', 'repository_root', 'source_commit', 'capture_scope',
    'worktree_clean_before', 'worktree_clean_after', 'status_porcelain_sha256'].sort(cmp);
  assert(sameJson(Object.keys(raw).sort(cmp), keys), `${where}: provenance keys are incomplete or unexpected`);
  assert(raw.schema === CAPTURE_SCHEMA && raw.repository_root === '.', `${where}: invalid capture schema/root`);
  const commit = nonempty(raw.source_commit, `${where}.source_commit`).toLowerCase();
  assert(COMMIT.test(commit), `${where}: source commit must be exact 40-hex`);
  if (expectedCommit !== null) assert(commit === expectedCommit, `${where}: source commit mismatch`);
  assert(raw.capture_scope === 'entire_repository_including_untracked', `${where}: incomplete capture scope`);
  assert(raw.worktree_clean_before === true && raw.worktree_clean_after === true, `${where}: source was dirty during capture`);
  assert(raw.status_porcelain_sha256 === CLEAN_STATUS_SHA256, `${where}: clean status digest is stale`);
  return commit;
}
function validateSourceRevision(raw, where, expectedCommit) {
  assert(isObject(raw), `${where}: missing source revision`);
  exactObjectKeys(raw, ['repository_root', 'commit', 'worktree_clean_for_capture', 'capture_scope',
    'changed_paths'], where);
  const commit = nonempty(raw.commit, `${where}.commit`).toLowerCase();
  assert(COMMIT.test(commit) && commit === expectedCommit, `${where}: source commit mismatch`);
  assert(raw.worktree_clean_for_capture === true, `${where}: source was not clean for capture`);
  assert(sameJson(raw.capture_scope, ['.']) && sameJson(raw.changed_paths, []), `${where}: source scope/changed paths are not clean and complete`);
  nonempty(raw.repository_root, `${where}.repository_root`);
  return stableJson(raw);
}
function validateBrowserRecord(raw, where) {
  assert(isObject(raw), `${where}: missing browser provenance`);
  const keys = ['executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version'].sort(cmp);
  assert(sameJson(Object.keys(raw).sort(cmp), keys), `${where}: browser provenance keys are incomplete or unexpected`);
  const executable = nonempty(raw.executable, `${where}.executable`);
  assert(!executable.includes('\\') && (path.posix.isAbsolute(executable) || /^[A-Za-z]:\//.test(executable)),
    `${where}.executable: expected canonical portable absolute path`);
  for (const field of ['product', 'revision', 'user_agent', 'js_version', 'protocol_version']) {
    nonempty(raw[field], `${where}.${field}`);
  }
  return stableValue(raw);
}
function validateHybridBrowserRecord(raw, expected, where) {
  assert(isObject(raw), `${where}: missing browser provenance`);
  const fields = ['executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version'];
  assert(sameJson(Object.keys(raw).sort(cmp), [...fields].sort(cmp)),
    `${where}: browser provenance keys are incomplete or unexpected`);
  for (const field of fields) {
    nonempty(raw[field], `${where}.${field}`);
    assert(raw[field] === expected[field], `${where}.${field}: does not match catalogue/layout browser provenance`);
  }
}
function verifyPngFile(root, relative, record, where, expectedDimensions = null) {
  const file = realFile(root, relative, where);
  const buffer = fs.readFileSync(file);
  const dimensions = pngDimensions(buffer, where);
  assert(dimensions.width > 0 && dimensions.height > 0, `${where}: zero-sized PNG`);
  if (expectedDimensions) {
    assert(dimensions.width === expectedDimensions.width && dimensions.height === expectedDimensions.height,
      `${where}: expected ${expectedDimensions.width}x${expectedDimensions.height}`);
  }
  if (record.width !== undefined) assert(record.width === dimensions.width, `${where}: stale width`);
  if (record.height !== undefined) assert(record.height === dimensions.height, `${where}: stale height`);
  if (record.bytes !== undefined) assert(record.bytes === buffer.length, `${where}: stale byte count`);
  assert(exactSha(record.sha256, `${where}.sha256`) === sha256(buffer), `${where}: stale disk SHA-256`);
  return { file, bytes: buffer.length, sha256: sha256(buffer), ...dimensions };
}

function currentCatalogueReferences() {
  const references = new Map();
  for (const source of ['fauna', 'flora', 'other']) {
    const rows = readJson(V2, `reference/${source}.json`, `current reference/${source}.json`);
    assert(Array.isArray(rows), `current reference/${source}.json: expected an array`);
    for (const row of rows) {
      if (!isObject(row) || typeof row.name !== 'string' || !row.name) continue;
      const set = source === 'fauna' ? 'earth-fauna'
        : source === 'flora' ? 'earth-flora'
          : row.kingdom === 'fungi' ? 'earth-fungi'
            : row.kingdom === 'microbe' ? 'earth-microbe' : '';
      assert(set, `current reference/${source}.json: ${row.name} has no valid set identity`);
      const key = `${set}\u0000${row.name}`;
      assert(!references.has(key), `current references: duplicate ${key}`);
      references.set(key, row);
    }
  }
  return references;
}

function expectedCatalogueReadme(preparation, browser) {
  return [
    '# GP7.1 fresh strict rejudge evidence', '',
    `- Current portraits: ${TOTAL} native 440x440 PNGs under portraits/.`,
    `- Fresh review packets: ${CATALOGUE_PACKETS} labelled sheets under packets/.`,
    `- Required ruler: ${preparation.source_ruler}.`,
    `- Required per-row review date: ${preparation.review_date}.`,
    `- Exact clean source commit: ${preparation.capture_provenance.source_commit}.`,
    `- Browser: ${browser.product} (${browser.executable}; revision ${browser.revision}).`,
    '- Capture scope: the entire Git repository, including untracked files.',
    '- `--prepare` generated no verdicts, results, bands, or ledger.',
    '- Judges must add one `verdicts/packet-XXX.json` file per packet following strict-verdict-schema.json.',
    `- Run \`node tools/gp71rejudge.mjs --collect --out=${preparation.output}\` only after all 196 complete verdicts exist.`,
    '- The collector verifies image/strip hashes before writing a results file or ledger for gp7conformity.',
    '',
  ].join('\n');
}
const PACKET_REFERENCE_KEYS = new Set([
  'aspect', 'colour', 'eyes', 'family', 'form', 'harvest', 'headFrac', 'kingdom',
  'leaf', 'leafColour', 'mustRead', 'note', 'posture', 'reference', 'scale',
]);
const STATUS_FAMILY = /^(PASS|POLISH|HOLD|FAIL|TRUE|FALSE|HIGH|LOW|MEDIUM|N\/?A|NONE|UNKNOWN|\d+)$/i;
function currentCataloguePartition() {
  const raw = readJson(V2, 'reference/goldpass7-results.json', 'current GP7 packet authority');
  assert(isObject(raw) && Array.isArray(raw.rows), 'current GP7 packet authority: expected rows[]');
  const identities = raw.rows.map((row, offset) => {
    assert(isObject(row), `current GP7 packet authority row ${offset + 1}: expected an object`);
    const set = nonempty(row.set, `current GP7 packet authority row ${offset + 1}.set`);
    const name = nonempty(row.species ?? row.name, `current GP7 packet authority row ${offset + 1}.species`);
    let family = typeof row.family === 'string' ? row.family.trim() : '';
    if (!family || STATUS_FAMILY.test(family) || /^earth-(fauna|flora|fungi|microbe)(?:\s|$)/i.test(family)) {
      family = `(unfamilied) ${set}`;
    }
    return { set, name, family };
  });
  validateSetCounts(identities.map((row) => ({ set: row.set, species: row.name })),
    'current GP7 packet authority');
  const byFamily = new Map();
  for (const row of identities) {
    if (!byFamily.has(row.family)) byFamily.set(row.family, []);
    byFamily.get(row.family).push(row);
  }
  const packets = [];
  for (const [family, members] of [...byFamily.entries()].sort((left, right) => right[1].length - left[1].length)) {
    members.sort((left, right) => left.name.localeCompare(right.name));
    for (let offset = 0; offset < members.length; offset += 14) packets.push({
      id: String(packets.length + 1).padStart(3, '0'), family,
      species: members.slice(offset, offset + 14).map((row) => ({ set: row.set, name: row.name })),
    });
  }
  assert(packets.length === CATALOGUE_PACKETS,
    `current GP7 packet authority: expected ${CATALOGUE_PACKETS} packets, got ${packets.length}`);
  return packets;
}
function expectedCataloguePacketMarkdown(packet, packetJson, preparation, referenceMap, where) {
  const lines = [
    `# GP7.1 FRESH STRICT REJUDGE — packet ${packet.packet_id}`, '',
    `Family partition: ${packet.family}`,
    `Review date required in every row: ${preparation.review_date}`,
    `Source ruler required in every row: ${preparation.source_ruler}`, '',
    'This packet contains freshly rendered current pixels. Historical GP7 bands,',
    'reasons, and carried status are intentionally excluded. Judge each row strictly',
    'against the current visual and its supplied reference. A missing must-read is FAIL.',
    'Do not infer PASS from a prior score or from the current tool finishing cleanly.', '',
    `strip: ${packet.strip}`,
    `strip_sha256: ${packet.strip_sha256}`, '',
    `Verdict file: \`verdicts/packet-${packet.packet_id}.json\``, '',
  ];
  const references = [];
  for (const [offset, row] of packetJson.species.entries()) {
    lines.push(`## ${offset + 1}. ${row.name} [${row.set}]`, `portrait_sha256: ${row.sha256}`);
    const reference = referenceMap.get(`${row.set}\u0000${row.name}`);
    const values = {};
    if (reference) {
      for (const [key, value] of Object.entries(reference)) {
        if (key === 'name') continue;
        assert(PACKET_REFERENCE_KEYS.has(key), `${where}: current source has unsupported reference key ${key}`);
        const rendered = Array.isArray(value) ? value.join(' · ') : String(value);
        rejectEmbeddedVerdictFields(rendered, `${where} row ${offset + 1} ${key}`);
        values[key] = rendered; lines.push(`${key}: ${rendered}`);
      }
    } else {
      assert(row.set === 'procedural', `${where}: current reference is missing for ${row.set}/${row.name}`);
      values.reference = 'procedural/unlisted — judge coherent, distinct body plan and readable structure.';
      lines.push(`reference: ${values.reference}`);
    }
    assert(row.set === 'procedural' ? Object.keys(values).length === 1 && values.reference
      : typeof values.mustRead === 'string' && values.mustRead,
    `${where}: current reference content is incomplete at row ${offset + 1}`);
    lines.push('');
    references.push(values);
  }
  return { text: lines.join('\n') + '\n', references };
}
function validateCataloguePacketMarkdown(text, packet, packetJson, preparation, referenceMap, where) {
  const expected = expectedCataloguePacketMarkdown(packet, packetJson, preparation, referenceMap, where);
  assert(text === expected.text, `${where}: exact clean-source generated packet content changed`);
  return expected.references;
}

function validateCatalogue(rootValue, referenceMap = currentCatalogueReferences(), expectedOutput = undefined) {
  const root = realDirectory(rootValue, 'catalogue root');
  const diskFiles = listFiles(root, 'catalogue');
  rejectForbiddenArtifacts(diskFiles, 'catalogue', new Set(['strict-verdict-schema.json']));
  const preparation = readJson(root, 'preparation.json');
  const identitiesRaw = readJson(root, 'identity-manifest.json');
  const portraitManifest = readJson(root, 'review-info/manifest.json');
  const index = readJson(root, 'index.json');
  const strictSchema = readJson(root, 'strict-verdict-schema.json');
  const catalogueReadme = fs.readFileSync(realFile(root, 'README.md', 'catalogue README'), 'utf8');

  exactObjectKeys(preparation, ['schema', 'review_date', 'source_ruler', 'output',
    'current_source_identity_sha256', 'frozen_partition_sha256', 'packets', 'portraits',
    'note', 'browser', 'capture_provenance'], 'catalogue preparation');
  exactObjectKeys(identitiesRaw, ['schema', 'capture_provenance', 'rows'], 'catalogue identity manifest');
  exactObjectKeys(portraitManifest, ['schema', 'generated_for', 'capture_provenance', 'portraits',
    'dimensions', 'sets', 'files'], 'catalogue portrait manifest');
  rejectEmbeddedVerdictFields(preparation, 'catalogue preparation');
  rejectEmbeddedVerdictFields(identitiesRaw, 'catalogue identity manifest');
  rejectEmbeddedVerdictFields(portraitManifest, 'catalogue portrait manifest');
  rejectEmbeddedVerdictFields(index, 'catalogue index');

  assert(preparation.schema === PREPARATION_SCHEMA, 'catalogue preparation: wrong schema');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(preparation.review_date), 'catalogue preparation: invalid review date');
  assert(typeof preparation.output === 'string' && /^gp71-[a-z0-9][a-z0-9-]*$/.test(preparation.output),
    'catalogue preparation: output identity is not a safe gp71-* producer name');
  assert(preparation.output === (expectedOutput ?? path.basename(root)),
    'catalogue preparation: output identity differs from the bound producer root');
  assert(preparation.source_ruler === 'GP7 fresh strict rejudge', 'catalogue preparation: wrong source ruler');
  assert(preparation.portraits === TOTAL && preparation.packets === CATALOGUE_PACKETS,
    'catalogue preparation: stale portrait/packet counts');
  assert(preparation.note === 'Prepared from one current audit render. No verdicts, results, or ledger are generated by --prepare.',
    'catalogue preparation: non-verdict boundary is missing');
  assert(strictSchema.schema === 'cf.gp71.strict-verdict.v1'
    && strictSchema.no_verdicts_are_generated_by_prepare === true,
  'catalogue strict verdict schema: preparation boundary is missing');
  assert(stableJson(strictSchema) === stableJson(expectedStrictVerdictSchema()),
    'catalogue strict verdict schema: exact blank schema changed or carries completed verdict data');
  const commit = validateCapture(preparation.capture_provenance, 'catalogue preparation capture');
  const browser = validateBrowserRecord(preparation.browser, 'catalogue preparation browser');
  assert(catalogueReadme === expectedCatalogueReadme(preparation, browser),
    'catalogue README: exact generated non-verdict content changed');
  assert(identitiesRaw.schema === IDENTITY_SCHEMA && Array.isArray(identitiesRaw.rows), 'catalogue identity manifest: wrong schema/rows');
  assert(portraitManifest.schema === PORTRAIT_SCHEMA && Array.isArray(portraitManifest.files), 'catalogue portrait manifest: wrong schema/files');
  assert(portraitManifest.generated_for === 'GP7.1 fresh strict rejudge'
    && portraitManifest.dimensions === '440x440 native PNG',
  'catalogue portrait manifest: exact producer identity/dimensions changed');
  validateCapture(identitiesRaw.capture_provenance, 'catalogue identity capture', commit);
  validateCapture(portraitManifest.capture_provenance, 'catalogue portrait capture', commit);
  assert(stableJson(identitiesRaw.capture_provenance) === stableJson(preparation.capture_provenance)
    && stableJson(portraitManifest.capture_provenance) === stableJson(preparation.capture_provenance),
  'catalogue: manifests do not bind the same capture provenance');

  const roster = validateSetCounts(identitiesRaw.rows, 'catalogue identities');
  assert(preparation.current_source_identity_sha256 === sha256(JSON.stringify(identitiesRaw.rows)),
    'catalogue preparation: stale current identity digest');
  assert(portraitManifest.portraits === TOTAL && portraitManifest.files.length === TOTAL,
    'catalogue portrait manifest: stale total');
  assert(sameJson(portraitManifest.sets, SETS), 'catalogue portrait manifest: stale set counts');

  const portraitByFile = new Map();
  for (const [offset, row] of portraitManifest.files.entries()) {
    const where = `catalogue portrait manifest row ${offset + 1}`;
    assert(isObject(row) && row.set in SETS, `${where}: invalid row/set`);
    exactObjectKeys(row, ['set', 'file', 'sha256', 'bytes', 'width', 'height'], where);
    const relative = safeRelative(row.file, `${where}.file`, '.png');
    assert(relative.startsWith(`${row.set}/`), `${where}: file escaped set`);
    assert(!portraitByFile.has(relative), `${where}: duplicate file`);
    const record = { ...row, sha256: exactSha(row.sha256, `${where}.sha256`) };
    assert(row.width === 440 && row.height === 440 && Number.isInteger(row.bytes) && row.bytes >= 24,
      `${where}: stale native portrait dimensions/bytes`);
    portraitByFile.set(relative, record);
  }
  const identityByKey = new Map();
  const markdownReferenceByKey = new Map();
  const expectedFiles = new Set(['preparation.json', 'identity-manifest.json', 'index.json',
    'strict-verdict-schema.json', 'README.md', 'review-info/manifest.json']);
  for (const [offset, row] of identitiesRaw.rows.entries()) {
    const where = `catalogue identity row ${offset + 1}`;
    exactObjectKeys(row, ['set', 'species', 'render_name', 'image_file', 'sha256'], where);
    const set = nonempty(row.set, `${where}.set`);
    const species = nonempty(row.species, `${where}.species`);
    nonempty(row.render_name, `${where}.render_name`);
    const image = safeRelative(row.image_file, `${where}.image_file`, '.png');
    assert(image.startsWith(`${set}/`), `${where}: image escaped set`);
    const manifestRow = portraitByFile.get(image);
    assert(manifestRow && manifestRow.set === set, `${where}: absent/wrong in portrait manifest`);
    assert(exactSha(row.sha256, `${where}.sha256`) === manifestRow.sha256, `${where}: identity/portrait SHA mismatch`);
    const disk = verifyPngFile(root, `portraits/${image}`, manifestRow, where, { width: 440, height: 440 });
    expectedFiles.add(`portraits/${image}`);
    const key = `${set}\u0000${species}`;
    identityByKey.set(key, { set, species, renderName: row.render_name, imageFile: image, sha256: disk.sha256, bytes: disk.bytes });
  }
  assert(identityByKey.size === roster.keys.size && portraitByFile.size === TOTAL, 'catalogue: portrait/identity map lost rows');

  assert(Array.isArray(index) && index.length === CATALOGUE_PACKETS, 'catalogue index: expected 196 packets');
  const indexedKeys = new Set();
  for (const [offset, packet] of index.entries()) {
    const where = `catalogue packet ${offset + 1}`;
    assert(isObject(packet), `${where}: expected object`);
    const id = String(offset + 1).padStart(3, '0');
    assert(packet.packet_id === id, `${where}: packet id/order mismatch`);
    nonempty(packet.family, `${where}.family`);
    const strip = safeRelative(packet.strip, `${where}.strip`, '.png');
    const markdown = safeRelative(packet.packet, `${where}.packet`);
    const packetJsonPath = safeRelative(packet.packet_json, `${where}.packet_json`);
    assert(strip === `packets/packet-${id}/strip.png`
      && markdown === `packets/packet-${id}/packet.md`
      && packetJsonPath === `packets/packet-${id}/packet.json`, `${where}: unexpected packet paths`);
    const stripHash = exactSha(packet.strip_sha256, `${where}.strip_sha256`);
    verifyPngFile(root, strip, { sha256: stripHash }, `${where} strip`);
    realFile(root, markdown, `${where} markdown`);
    const packetJson = readJson(root, packetJsonPath, `${where} JSON`);
    exactObjectKeys(packet, ['packet_id', 'family', 'strip', 'packet', 'packet_json', 'strip_sha256', 'species'], where);
    exactObjectKeys(packetJson, ['schema', 'packet_id', 'family', 'review_date', 'source_ruler',
      'strip', 'strip_sha256', 'species'], `${where} JSON`);
    rejectEmbeddedVerdictFields(packetJson, `${where} JSON`);
    assert(packetJson.schema === PACKET_SCHEMA && packetJson.packet_id === id && packetJson.family === packet.family,
      `${where}: packet JSON identity/schema mismatch`);
    assert(packetJson.review_date === preparation.review_date
      && packetJson.source_ruler === preparation.source_ruler,
    `${where}: packet JSON review date/ruler mismatch`);
    assert(packetJson.strip === strip && packetJson.strip_sha256 === stripHash, `${where}: packet JSON strip binding mismatch`);
    assert(Array.isArray(packet.species) && packet.species.length >= 1 && packet.species.length <= 14,
      `${where}: expected 1..14 species`);
    assert(Array.isArray(packetJson.species) && packetJson.species.length === packet.species.length,
      `${where}: packet JSON row count mismatch`);
    const markdownReferences = validateCataloguePacketMarkdown(
      fs.readFileSync(realFile(root, markdown, `${where} markdown`), 'utf8'),
      packet, packetJson, preparation, referenceMap, `${where} markdown`);
    for (const [rowIndex, row] of packet.species.entries()) {
      const rowWhere = `${where} row ${rowIndex + 1}`;
      const set = nonempty(row.set, `${rowWhere}.set`);
      const name = nonempty(row.name, `${rowWhere}.name`);
      const identity = identityByKey.get(`${set}\u0000${name}`);
      assert(identity, `${rowWhere}: absent from identity manifest`);
      assert(row.image_file === identity.imageFile && row.sha256 === identity.sha256, `${rowWhere}: stale index portrait binding`);
      const mirror = packetJson.species[rowIndex];
      exactObjectKeys(row, ['set', 'name', 'image_file', 'sha256'], `${rowWhere} index`);
      exactObjectKeys(mirror, ['set', 'name', 'render_name', 'image_file', 'sha256'], `${rowWhere} packet JSON`);
      assert(mirror.set === set && mirror.name === name && mirror.image_file === identity.imageFile
        && mirror.sha256 === identity.sha256, `${rowWhere}: packet JSON binding mismatch`);
      const key = `${set}\u0000${name}`;
      assert(!indexedKeys.has(key), `${rowWhere}: duplicate indexed identity`);
      indexedKeys.add(key); markdownReferenceByKey.set(key, markdownReferences[rowIndex]);
    }
    expectedFiles.add(strip); expectedFiles.add(markdown); expectedFiles.add(packetJsonPath);
  }
  assert(indexedKeys.size === TOTAL && [...roster.keys].every((key) => indexedKeys.has(key)), 'catalogue index: incomplete identity join');
  const frozenPartition = index.map((packet) => ({ id: packet.packet_id, family: packet.family,
    species: packet.species.map((row) => ({ set: row.set, name: row.name })) }));
  const expectedPartition = referenceMap.expectedPartition ?? currentCataloguePartition();
  assert(stableJson(frozenPartition) === stableJson(expectedPartition),
    'catalogue index: packet families/order differ from the exact current GP7 partition authority');
  assert(exactSha(preparation.frozen_partition_sha256, 'catalogue frozen partition SHA-256')
    === sha256(JSON.stringify(frozenPartition)), 'catalogue preparation: stale frozen partition digest');
  assertExactInventory(diskFiles, expectedFiles, 'catalogue');
  return {
    root, files: diskFiles, commit, browser, capture: preparation.capture_provenance,
    preparationOutput: preparation.output,
    identities: [...identityByKey.values()], identityByKey, markdownReferenceByKey,
    identityManifestSha256: hashFile(path.join(root, 'identity-manifest.json')),
    portraitManifestSha256: hashFile(path.join(root, 'review-info', 'manifest.json')),
    preparationSha256: hashFile(path.join(root, 'preparation.json')),
  };
}

function validateMustReadContract(raw, set, species, where) {
  assert(isObject(raw), `${where}: missing must-read contract`);
  const expectedKeys = ['set', 'species', 'source', 'source_sha256', 'must_read', 'note', 'sha256'].sort(cmp);
  assert(sameJson(Object.keys(raw).sort(cmp), expectedKeys), `${where}: unexpected must-read keys`);
  rejectEmbeddedVerdictFields(raw, where);
  assert(raw.set === set && raw.species === species, `${where}: wrong identity`);
  nonempty(raw.source, `${where}.source`); exactSha(raw.source_sha256, `${where}.source_sha256`);
  assert(Array.isArray(raw.must_read) && raw.must_read.length > 0
    && raw.must_read.every((value) => typeof value === 'string' && value.trim()), `${where}: missing criteria`);
  assert(typeof raw.note === 'string', `${where}.note: expected string`);
  const payload = { set: raw.set, species: raw.species, source: raw.source,
    source_sha256: raw.source_sha256, must_read: raw.must_read, note: raw.note };
  assert(exactSha(raw.sha256, `${where}.sha256`) === sha256(stableJson(payload)), `${where}: stale contract SHA-256`);
}
function validateProceduralPlan(raw, where) {
  assert(isObject(raw), `${where}: missing procedural plan`);
  exactObjectKeys(raw, ['seed', 'kingdom', 'heat', 'sample', 'route_kind', 'plan_family',
    'base_plan_family', 'plan_detail', 'genome', 'plan_sha256'], where);
  const hash = exactSha(raw.plan_sha256, `${where}.plan_sha256`);
  const payload = structuredClone(raw); delete payload.plan_sha256;
  assert(hash === sha256(stableJson(payload)), `${where}: stale procedural plan SHA-256`);
  return hash;
}

function validateLayout(rootValue, catalogue) {
  const root = realDirectory(rootValue, 'layout root');
  const diskFiles = listFiles(root, 'layout');
  rejectForbiddenArtifacts(diskFiles, 'layout');
  const plan = readJson(root, 'plan.json');
  const index = readJson(root, 'index.json');
  const proceduralIndex = readJson(root, 'procedural-plan-index.json');
  const packetManifest = readJson(root, 'packet-manifest.json');
  exactObjectKeys(plan, ['schema', 'purpose', 'identity_key', 'total_identities', 'sets', 'families',
    'packets', 'packet_size', 'packet_images_requested', 'catalogue_sha256', 'source_revision',
    'sources', 'family_rules', 'reviewed_family_overrides', 'reviewed_aliases',
    'procedural_plan_families'], 'layout plan');
  exactObjectKeys(index, ['schema', 'identity_key', 'total_identities', 'sets', 'families',
    'packet_count', 'packet_size', 'catalogue_sha256', 'source_revision', 'packets'], 'layout index');
  exactObjectKeys(proceduralIndex, ['schema', 'identity_key', 'total_identities', 'grouping_axis',
    'plan_family_count', 'families', 'catalogue_sha256', 'source_revision'], 'layout procedural index');
  exactObjectKeys(packetManifest, ['schema', 'catalogue_sha256', 'packet_count', 'sheets', 'browser', 'files'],
    'layout packet manifest');
  rejectEmbeddedVerdictFields(plan, 'layout plan');
  rejectEmbeddedVerdictFields(index, 'layout index');
  rejectEmbeddedVerdictFields(proceduralIndex, 'layout procedural index');
  rejectEmbeddedVerdictFields(packetManifest, 'layout packet manifest');
  assert(plan.schema === PLAN_SCHEMA && index.schema === INDEX_SCHEMA,
    'layout: wrong plan/index schema');
  assert(proceduralIndex.schema === PROCEDURAL_INDEX_SCHEMA && packetManifest.schema === PACKET_MANIFEST_SCHEMA,
    'layout: wrong procedural/packet schema');
  const browser = validateBrowserRecord(packetManifest.browser, 'layout packet manifest browser');
  assert(stableJson(browser) === stableJson(catalogue.browser),
    'layout: browser provenance does not exactly match catalogue capture');
  assert(plan.total_identities === TOTAL && index.total_identities === TOTAL
    && sameJson(plan.sets, SETS) && sameJson(index.sets, SETS), 'layout: stale identity/set counts');
  assert(plan.families === LAYOUT_FAMILIES && index.families === LAYOUT_FAMILIES,
    'layout: expected 181 families');
  assert(plan.packets === LAYOUT_PACKETS && index.packet_count === LAYOUT_PACKETS,
    'layout: expected 233 packets');
  assert(plan.packet_size === 10 && index.packet_size === 10,
    'layout: official packet_size must be exactly 10');
  assert(plan.packet_images_requested === true, 'layout: packet images were not requested');
  const catalogueDigest = exactSha(plan.catalogue_sha256, 'layout plan catalogue SHA-256');
  assert(index.catalogue_sha256 === catalogueDigest && proceduralIndex.catalogue_sha256 === catalogueDigest
    && packetManifest.catalogue_sha256 === catalogueDigest, 'layout: catalogue digest mismatch between manifests');
  const revisionProjection = validateSourceRevision(plan.source_revision, 'layout plan source revision', catalogue.commit);
  assert(validateSourceRevision(index.source_revision, 'layout index source revision', catalogue.commit) === revisionProjection
    && validateSourceRevision(proceduralIndex.source_revision, 'layout procedural source revision', catalogue.commit) === revisionProjection,
  'layout: source revision manifests disagree');
  assert(isObject(plan.sources), 'layout plan: source hashes missing');
  assert(plan.sources.identity_manifest?.sha256 === catalogue.identityManifestSha256,
    'layout plan: catalogue identity-manifest SHA mismatch');
  assert(plan.sources.portrait_manifest?.sha256 === catalogue.portraitManifestSha256,
    'layout plan: catalogue portrait-manifest SHA mismatch');
  const evidenceIdentityDigest = sha256(catalogue.identities.slice()
    .sort((a, b) => cmp(`${a.set}\u0000${a.species}`, `${b.set}\u0000${b.species}`))
    .map((row) => `${row.set}\u0000${row.species}\u0000${row.imageFile}\u0000${row.sha256}\u0000${row.bytes}\n`).join(''));
  assert(plan.sources.evidence_identity_digest === evidenceIdentityDigest,
    'layout plan: catalogue evidence identity digest mismatch');
  assert(stableJson(plan.sources.source_revision) === revisionProjection,
    'layout plan: sources.source_revision disagrees with the clean source revision');
  assert(Array.isArray(index.packets) && index.packets.length === LAYOUT_PACKETS,
    'layout index: expected 233 packets');

  const rows = [];
  const rowByKey = new Map();
  const familyKeys = new Set();
  const packetById = new Map();
  for (const [offset, packet] of index.packets.entries()) {
    const where = `layout packet ${offset + 1}`;
    const id = String(offset + 1).padStart(3, '0');
    assert(isObject(packet) && packet.packet_id === id, `${where}: packet id/order mismatch`);
    exactObjectKeys(packet, ['packet_id', 'set', 'family', 'family_part', 'family_parts', 'rows'], where);
    const set = nonempty(packet.set, `${where}.set`);
    const family = nonempty(packet.family, `${where}.family`);
    assert(set in SETS, `${where}: unknown set`);
    assert(Number.isInteger(packet.family_part) && Number.isInteger(packet.family_parts)
      && packet.family_part >= 1 && packet.family_part <= packet.family_parts, `${where}: bad family part`);
    assert(Array.isArray(packet.rows) && packet.rows.length >= 1 && packet.rows.length <= 10,
      `${where}: expected 1..10 rows under the official packet_size=10 contract`);
    familyKeys.add(`${set}\u0000${family}`);
    packetById.set(id, packet);
    for (const [rowOffset, row] of packet.rows.entries()) {
      const rowWhere = `${where} row ${rowOffset + 1}`;
      assert(isObject(row) && row.set === set && row.family === family, `${rowWhere}: set/family mismatch`);
      exactObjectKeys(row, ['ordinal', 'set', 'species', 'render_name', 'family', 'family_source',
        'image_file', 'sha256', 'bytes', 'width', 'height', 'must_read_contract',
        ...(set === 'procedural' ? ['procedural_plan'] : [])], rowWhere);
      const species = nonempty(row.species, `${rowWhere}.species`);
      nonempty(row.render_name, `${rowWhere}.render_name`); nonempty(row.family_source, `${rowWhere}.family_source`);
      assert(Number.isInteger(row.ordinal) && row.ordinal === rows.length + 1, `${rowWhere}: ordinal mismatch`);
      const identity = catalogue.identityByKey.get(`${set}\u0000${species}`);
      assert(identity, `${rowWhere}: absent from catalogue`);
      assert(row.image_file === identity.imageFile && row.sha256 === identity.sha256
        && row.bytes === identity.bytes && row.width === 440 && row.height === 440,
      `${rowWhere}: stale catalogue portrait binding`);
      validateMustReadContract(row.must_read_contract, set, species, `${rowWhere}.must_read_contract`);
      if (set !== 'procedural') {
        const packetReference = catalogue.markdownReferenceByKey.get(`${set}\u0000${species}`);
        assert(packetReference?.mustRead === row.must_read_contract.must_read.join(' · ')
          && (packetReference.note ?? '') === row.must_read_contract.note,
        `${rowWhere}: catalogue packet mustRead/note differs from the hash-bound layout contract`);
      }
      let planHash = '';
      if (set === 'procedural') planHash = validateProceduralPlan(row.procedural_plan, `${rowWhere}.procedural_plan`);
      else assert(row.procedural_plan === undefined, `${rowWhere}: non-procedural row carries procedural plan`);
      const key = `${set}\u0000${species}`;
      assert(!rowByKey.has(key), `${rowWhere}: duplicate identity`);
      const clean = { packetId: id, set, species, family, ordinal: row.ordinal, imageFile: row.image_file,
        sha256: row.sha256, planHash, contractHash: row.must_read_contract.sha256 };
      rows.push(clean); rowByKey.set(key, clean);
    }
  }
  validateSetCounts(rows, 'layout rows');
  assert(familyKeys.size === LAYOUT_FAMILIES, `layout index: expected 181 exact set/family groups, got ${familyKeys.size}`);
  const familyParts = new Map();
  for (const packet of index.packets) {
    const key = `${packet.set}\u0000${packet.family}`;
    const existing = familyParts.get(key) || { total: packet.family_parts, parts: [] };
    assert(existing.total === packet.family_parts, `layout family ${key}: inconsistent family_parts`);
    existing.parts.push(packet.family_part); familyParts.set(key, existing);
  }
  for (const [key, entry] of familyParts) {
    const expected = Array.from({ length: entry.total }, (_, indexValue) => indexValue + 1);
    assert(sameJson(entry.parts, expected), `layout family ${key}: missing/out-of-order parts`);
  }
  const digest = sha256(rows.map((row) => `${row.ordinal}\u0000${row.set}\u0000${row.species}\u0000${row.family}\u0000${row.imageFile}\u0000${row.sha256}\u0000${row.planHash}\u0000${row.contractHash}\n`).join(''));
  assert(digest === catalogueDigest, 'layout: stale catalogue digest');

  assert(proceduralIndex.total_identities === SETS.procedural && Array.isArray(proceduralIndex.families),
    'layout procedural index: stale total/families');
  assert(proceduralIndex.plan_family_count === proceduralIndex.families.length,
    'layout procedural index: stale plan_family_count');
  const proceduralFamilyNames = new Set();
  const proceduralRows = proceduralIndex.families.flatMap((family) => {
    assert(isObject(family) && Number.isInteger(family.count) && Array.isArray(family.identities)
      && family.identities.length === family.count, 'layout procedural index: family count mismatch');
    exactObjectKeys(family, ['plan_family', 'count', 'identities'], 'layout procedural index family');
    const name = nonempty(family.plan_family, 'layout procedural index plan_family');
    assert(!proceduralFamilyNames.has(name), `layout procedural index: duplicate plan family ${name}`);
    proceduralFamilyNames.add(name);
    return family.identities;
  });
  assert(proceduralRows.length === SETS.procedural, 'layout procedural index: expected 240 identities');
  const proceduralKeys = new Set();
  for (const [offset, row] of proceduralRows.entries()) {
    const where = `layout procedural index row ${offset + 1}`;
    exactObjectKeys(row, ['set', 'species', 'packet_id', 'ordinal', 'sha256',
      'procedural_plan_sha256', 'must_read_contract_sha256'], where);
    assert(row.set === 'procedural', `${where}: wrong set`);
    const source = rowByKey.get(`procedural\u0000${row.species}`);
    assert(source && row.packet_id === source.packetId && row.ordinal === source.ordinal
      && row.sha256 === source.sha256 && row.procedural_plan_sha256 === source.planHash
      && row.must_read_contract_sha256 === source.contractHash, `${where}: stale row binding`);
    assert(!proceduralKeys.has(row.species), `${where}: duplicate identity`); proceduralKeys.add(row.species);
  }

  assert(packetManifest.packet_count === LAYOUT_PACKETS && packetManifest.sheets === LAYOUT_SHEETS
    && Array.isArray(packetManifest.files) && packetManifest.files.length === LAYOUT_SHEETS,
  'layout packet manifest: expected 233 packets / 466 sheets');
  const expectedFiles = new Set(['plan.json', 'index.json', 'procedural-plan-index.json', 'packet-manifest.json']);
  const sheetKeys = new Set();
  for (const [offset, row] of packetManifest.files.entries()) {
    const where = `layout sheet ${offset + 1}`;
    assert(isObject(row) && packetById.has(row.packet_id), `${where}: unknown packet`);
    exactObjectKeys(row, ['packet_id', 'variant', 'file', 'sha256', 'bytes', 'width', 'height',
      'source_rows_sha256'], where);
    assert(row.variant === 'labelled' || row.variant === 'unlabelled', `${where}: bad variant`);
    const key = `${row.packet_id}\u0000${row.variant}`;
    assert(!sheetKeys.has(key), `${where}: duplicate packet variant`); sheetKeys.add(key);
    const relative = safeRelative(row.file, `${where}.file`, '.png');
    assert(relative.startsWith(`packets/${row.variant}/`), `${where}: path/variant mismatch`);
    const packet = packetById.get(row.packet_id);
    const sourceDigest = sha256(packet.rows.map((source) => `${source.set}\u0000${source.species}\u0000${source.sha256}\n`).join(''));
    assert(row.source_rows_sha256 === sourceDigest, `${where}: stale source rows digest`);
    verifyPngFile(root, relative, row, where);
    expectedFiles.add(relative);
  }
  for (const id of packetById.keys()) for (const variant of ['labelled', 'unlabelled']) {
    assert(sheetKeys.has(`${id}\u0000${variant}`), `layout packet ${id}: missing ${variant} sheet`);
  }
  assertExactInventory(diskFiles, expectedFiles, 'layout');
  return { root, files: diskFiles, commit: catalogue.commit, browser, catalogueDigest,
    planSha256: hashFile(path.join(root, 'plan.json')), packetManifestSha256: hashFile(path.join(root, 'packet-manifest.json')) };
}

function expectedHybridDimensions(kind) {
  if (['portrait', 'silhouette', 'cache-portrait', 'mixed-portrait'].includes(kind)) return { width: 440, height: 440 };
  if (kind === 'card') return { width: 332, height: 332 };
  if (kind === 'lineage-sheet') return { width: 2200, height: 1180 };
  if (kind === 'join-atlas') return { width: 1290, height: 1048 };
  if (kind === 'cache-sheet') return { width: 680, height: 1534 };
  if (kind === 'mixed-sheet') return { width: 880, height: 1160 };
  fail(`hybrid: unknown asset kind ${kind}`);
}
function validateHybridGit(raw, where, expectedCommit) {
  exactObjectKeys(raw, ['head', 'branch', 'dirty', 'status_lines', 'source_claim'], where);
  const head = nonempty(raw.head, `${where}.head`).toLowerCase();
  assert(head === expectedCommit && COMMIT.test(head), `${where}: source commit mismatch`);
  assert(/^(?:openai|anthropic)\/[a-z0-9][a-z0-9._\/-]*$/.test(nonempty(raw.branch, `${where}.branch`)),
    `${where}: branch is outside the coordinated agent namespace`);
  assert(raw.dirty === false && sameJson(raw.status_lines, []), `${where}: capture was not from a clean worktree`);
  assert(raw.source_claim === HYBRID_CLEAN_SOURCE_CLAIM, `${where}: exact clean source claim missing`);
  return stableJson(raw);
}
function validateHybrid(rootValue, expectedCommit, expectedBrowser) {
  const root = realDirectory(rootValue, 'hybrid root');
  const diskFiles = listFiles(root, 'hybrid');
  rejectForbiddenArtifacts(diskFiles, 'hybrid');
  const manifest = readJson(root, 'manifest.json');
  exactObjectKeys(manifest, [
    'schema', 'review_status', 'visual_continuity_status', 'machine_anchor_visual_status',
    'visual_claim', 'review_contract', 'generated_at_utc', 'contract', 'browser', 'git',
    'source_snapshot', 'reload_check', 'negative_controls', 'residual_continuity_risks',
    'machine_observations', 'summary', 'stage_order', 'anchor_contract', 'lineages',
    'cache_controls', 'mixed_kingdom_sentinels', 'mixed_sentinel_sheet', 'assets',
  ], 'hybrid manifest');
  rejectEmbeddedVerdictFields(manifest, 'hybrid manifest');
  validateUnreviewedHybridReadme(fs.readFileSync(realFile(root, 'README.md', 'hybrid README'), 'utf8'), manifest);
  assert(manifest.schema === HYBRID_SCHEMA, 'hybrid: wrong evidence schema');
  assert(manifest.review_status === 'UNREVIEWED' && manifest.visual_continuity_status === 'OPEN',
    'hybrid: evidence must remain UNREVIEWED with visual continuity OPEN');
  assert(stableJson(manifest.review_contract) === stableJson(PLATINUM_REVIEW),
    'hybrid: exact Platinum review contract is missing or changed');
  assert(manifest.machine_anchor_visual_status === 'OPEN_UNREVIEWED'
    || manifest.machine_anchor_visual_status === 'FAIL_BYTE_IDENTICAL_STAGES',
  'hybrid: machine state must be OPEN_UNREVIEWED or the disclosed byte-identical-stage failure');
  assert(manifest.visual_claim === HYBRID_VISUAL_CLAIM,
    'hybrid: exact no-visual-PASS boundary changed');
  assert(typeof manifest.generated_at_utc === 'string' && !Number.isNaN(Date.parse(manifest.generated_at_utc)),
    'hybrid: generated_at_utc is missing or invalid');
  assert(manifest.contract === 'Fresh production-derived 13-lineage x 5-stage matrix plus 16 mixed-kingdom owner sentinels. Hybrid lineage metadata comes only from crossGenome.',
    'hybrid: exact evidence contract is missing or changed');
  exactObjectKeys(manifest.machine_observations, [
    'byte_identical_anchor_lineages', 'required_human_verdict', 'mixed_owner_sentinels',
  ], 'hybrid machine_observations');
  exactObjectKeys(manifest.machine_observations.mixed_owner_sentinels, [
    'total', 'unique_owner_cases', 'duplicate_name_cases', 'visual_status',
  ], 'hybrid mixed_owner_sentinels');
  assert(manifest.machine_observations.required_human_verdict === true
    && stableJson(manifest.machine_observations.mixed_owner_sentinels) === stableJson({
      total: MIXED_SENTINELS.length,
      unique_owner_cases: MIXED_SENTINELS.filter((row) => row.kind === 'single-lineage-owner').length,
      duplicate_name_cases: MIXED_SENTINELS.filter((row) => row.kind === 'duplicate-name-owner').length,
      visual_status: 'OPEN',
    }), 'hybrid: required human verdict/mixed-owner observation boundary missing');
  validateHybridBrowserRecord(manifest.browser, expectedBrowser, 'hybrid browser');
  assert(isObject(manifest.reload_check) && manifest.reload_check.passes === 2
    && manifest.reload_check.first_order === 'forward (AB first)'
    && manifest.reload_check.second_order === 'reverse (BA first)'
    && manifest.reload_check.identical === true,
  'hybrid: reload check must record two identical forward/reverse passes');
  exactObjectKeys(manifest.reload_check,
    ['passes', 'first_order', 'second_order', 'stable_projection_sha256', 'identical'],
    'hybrid reload check');
  exactSha(manifest.reload_check.stable_projection_sha256, 'hybrid reload stable projection SHA-256');
  assert(stableJson(manifest.negative_controls) === stableJson(HYBRID_NEGATIVE_CONTROLS),
    'hybrid: exact negative-control disclosures are missing or changed');
  assert(stableJson(manifest.residual_continuity_risks) === stableJson(HYBRID_RESIDUAL_CONTINUITY_RISKS),
    'hybrid: exact residual-continuity risk disclosures changed');
  assert(isObject(manifest.summary) && manifest.summary.lineages === 13
    && manifest.summary.principal_portraits === 65 && manifest.summary.cache_controls === 6
    && manifest.summary.cache_portraits === 12 && manifest.summary.mixed_kingdom_sentinels === 16
    && manifest.summary.mixed_portraits === 16 && manifest.summary.assets === HYBRID_ASSETS,
  'hybrid: stale summary counts');
  exactObjectKeys(manifest.summary, ['lineages', 'principal_portraits', 'cache_controls',
    'cache_portraits', 'mixed_kingdom_sentinels', 'mixed_portraits', 'assets',
    'pixel_identical_lineages', 'pixel_identical_lineage_ids'], 'hybrid summary');
  assert(sameJson(manifest.stage_order, STAGES) && sameJson(manifest.anchor_contract, ANCHORS),
    'hybrid: stage/anchor contract changed');
  assert(isObject(manifest.git), 'hybrid: git provenance missing');
  const startGit = validateHybridGit(manifest.git.start, 'hybrid git start', expectedCommit);
  assert(validateHybridGit(manifest.git.end, 'hybrid git end', expectedCommit) === startGit
    && manifest.git.status_changed_during_capture === false, 'hybrid: git state changed during capture');
  assert(isObject(manifest.source_snapshot) && Array.isArray(manifest.source_snapshot.files)
    && manifest.source_snapshot.files.length > 0, 'hybrid: source snapshot missing');
  exactObjectKeys(manifest.source_snapshot, ['files', 'sha256'], 'hybrid source snapshot');
  const snapshotPaths = new Set();
  const snapshotRows = manifest.source_snapshot.files;
  for (const [offset, row] of snapshotRows.entries()) {
    const where = `hybrid source snapshot row ${offset + 1}`;
    exactObjectKeys(row, ['file', 'bytes', 'sha256'], where);
    const relative = safeRelative(row.file, `${where}.file`);
    assert(!snapshotPaths.has(relative), `${where}: duplicate source path`); snapshotPaths.add(relative);
    assert(Number.isInteger(row.bytes) && row.bytes >= 0, `${where}: invalid bytes`);
    exactSha(row.sha256, `${where}.sha256`);
  }
  assert(sameJson(snapshotRows.map((row) => row.file), [...snapshotRows.map((row) => row.file)].sort(cmp)),
    'hybrid: source snapshot paths are not sorted');
  const sourceSnapshotDigest = sha256(snapshotRows.map((row) => `${row.file}\u0000${row.bytes}\u0000${row.sha256}\n`).join(''));
  assert(manifest.source_snapshot.sha256 === sourceSnapshotDigest, 'hybrid: stale source snapshot digest');
  assert(stableJson(manifest.source_snapshot) === stableJson(currentHybridSourceSnapshot()),
    'hybrid: source snapshot does not match the exact current producer inventory/bytes');

  assert(Array.isArray(manifest.assets) && manifest.assets.length === HYBRID_ASSETS,
    `hybrid: expected ${HYBRID_ASSETS} assets`);
  const assetsByPath = new Map();
  const kindCounts = Object.fromEntries(Object.keys(HYBRID_KIND_COUNTS).map((kind) => [kind, 0]));
  const expectedFiles = new Set(['README.md', 'manifest.json']);
  for (const [offset, row] of manifest.assets.entries()) {
    const where = `hybrid asset ${offset + 1}`;
    assert(isObject(row) && row.kind in kindCounts, `${where}: invalid kind`);
    exactObjectKeys(row, ['path', 'kind', 'identity', 'width', 'height', 'bytes', 'sha256'], where);
    const relative = safeRelative(row.path, `${where}.path`, '.png');
    assert(!assetsByPath.has(relative), `${where}: duplicate asset path`);
    nonempty(row.identity, `${where}.identity`);
    const expectedDimensions = expectedHybridDimensions(row.kind);
    const disk = verifyPngFile(root, relative, row, where, expectedDimensions);
    assetsByPath.set(relative, { ...row, sha256: disk.sha256 });
    kindCounts[row.kind]++; expectedFiles.add(relative);
  }
  assert(sameJson(kindCounts, HYBRID_KIND_COUNTS), `hybrid: stale kind counts ${JSON.stringify(kindCounts)}`);
  const cacheSheet = assetsByPath.get('cache-controls/reversed-parent-sheet.png');
  assert(cacheSheet?.kind === 'cache-sheet' && cacheSheet.identity === 'cache-subset',
    'hybrid: reversed-parent cache sheet contract changed');
  const mixedSheet = assetsByPath.get('mixed-kingdom/sentinels-sheet.png');
  assert(mixedSheet?.kind === 'mixed-sheet' && mixedSheet.identity === 'mixed-sentinels',
    'hybrid: mixed sentinel sheet contract changed');

  assert(Array.isArray(manifest.lineages) && manifest.lineages.length === HYBRID_LINEAGES.length,
    `hybrid: expected ${HYBRID_LINEAGES.length} representative lineages`);
  const lineageIds = new Set();
  const stageReviewRows = [];
  const lineageReviewRows = [];
  const cacheReviewRows = [];
  const mixedReviewRows = [];
  const identicalLineages = [];
  const observedIdentical = [];
  for (const [offset, lineage] of manifest.lineages.entries()) {
    const where = `hybrid lineage ${offset + 1}`;
    const expectedLineage = HYBRID_LINEAGES[offset];
    exactObjectKeys(lineage, ['ordinal', 'lineage_id', 'set', 'species', 'challenge',
      'crop_contract', 'stage_pixel_unique_count', 'pixel_identity_groups',
      'anchor_visual_differentiation', 'inputs', 'crosses', 'stages', 'lineage_sheet', 'join_atlas',
      'visual_review_status'], where);
    exactObjectKeys(lineage.crop_contract, ['source_pixels', 'output_pixels', 'scale', 'coordinates'],
      `${where}.crop_contract`);
    assert(Array.isArray(lineage.crop_contract.coordinates) && lineage.crop_contract.coordinates.length === 4,
      `${where}: crop contract must contain four coordinates`);
    lineage.crop_contract.coordinates.forEach((row, index) => exactObjectKeys(row,
      ['x', 'y', 'w', 'h'], `${where} crop ${index + 1}`));
    const expectedCrops = expectedLineage.crops.map(([x, y, w, h]) => ({ x, y, w, h }));
    assert(stableJson(lineage.crop_contract.coordinates) === stableJson(expectedCrops),
      `${where}: anatomy-bound crop coordinates changed`);
    const id = nonempty(lineage.lineage_id, `${where}.lineage_id`);
    assert(id === expectedLineage.id && lineage.species === expectedLineage.species
      && lineage.set === expectedLineage.set && lineage.ordinal === offset + 1
      && lineage.challenge === expectedLineage.challenge,
    `${where}: representative identity/order changed`);
    assert(!lineageIds.has(id), `${where}: duplicate lineage`); lineageIds.add(id);
    nonempty(lineage.species, `${where}.species`);
    assert(lineage.visual_review_status === 'UNREVIEWED', `${where}: carried visual verdict is forbidden`);
    const expectedInputIds = ['pure', 'earth-mate', 'alien-1', 'alien-2', 'alien-3'];
    assert(Array.isArray(lineage.inputs) && lineage.inputs.length === expectedInputIds.length
      && sameJson(lineage.inputs.map((input) => input.id), expectedInputIds),
    `${where}: exact five-input order is missing`);
    const inputById = new Map();
    for (const [inputIndex, input] of lineage.inputs.entries()) {
      const inputWhere = `${where} input ${inputIndex + 1}`;
      assert(isObject(input) && isObject(input.genome) && isObject(input.derivation),
        `${inputWhere}: genome/derivation provenance is missing`);
      exactObjectKeys(input, ['id', 'genome', 'genome_sha256', 'derivation'], inputWhere);
      if (input.id === 'pure') exactObjectKeys(input.derivation,
        ['kind', 'formula', 'kingdom_index', 'catalogue_index', 'heat', 'seed', 'exact_name_matches'],
        `${inputWhere}.derivation`);
      else if (input.id === 'earth-mate') exactObjectKeys(input.derivation,
        ['kind', 'formula', 'row', 'catalogue_index', 'heat', 'seed'], `${inputWhere}.derivation`);
      else exactObjectKeys(input.derivation,
        ['kind', 'formula', 'row', 'slot', 'attempt', 'heat', 'seed', 'predicate'], `${inputWhere}.derivation`);
      validateEvidenceGenome(input.genome, `${inputWhere}.genome`);
      nonempty(input.derivation.kind, `${inputWhere}.derivation.kind`);
      assert(Number.isInteger(input.genome.seed) && input.genome.seed >= 0, `${inputWhere}: invalid genome seed`);
      assert(exactSha(input.genome_sha256, `${inputWhere}.genome_sha256`) === sha256(stableJson(input.genome)),
        `${inputWhere}: stale full-genome SHA-256`);
      if (input.id === 'pure' || input.id === 'earth-mate') {
        assert(input.genome.kingdom === expectedLineage.set.slice('earth-'.length)
          && input.genome._earthName === expectedLineage.species
          && input.genome._earthBlend === undefined && input.genome._earthBlendKingdom === undefined
          && input.genome._anchorVal === undefined,
        `${inputWhere}: exact named Earth input provenance is missing`);
      } else {
        assert(input.genome._earthName === undefined && input.genome._earthBlend === undefined
          && input.genome._earthBlendKingdom === undefined && input.genome._anchorVal === undefined,
        `${inputWhere}: alien input carries handwritten lineage provenance`);
      }
      inputById.set(input.id, input);
    }
    const expectedCrosses = [
      { stage_id: 'earth-earth', parent_a: 'pure', parent_b: 'earth-mate' },
      { stage_id: 'earth-alien', parent_a: 'pure', parent_b: 'alien-1' },
      { stage_id: 'next-alien', parent_a: 'earth-alien', parent_b: 'alien-2' },
      { stage_id: 'floor', parent_a: 'next-alien', parent_b: 'alien-3' },
    ];
    assert(stableJson(lineage.crosses) === stableJson(expectedCrosses),
      `${where}: exact four-cross parent chain is missing or reordered`);
    assert(Array.isArray(lineage.stages) && lineage.stages.length === 5, `${where}: expected five stages`);
    const pixelGroups = new Map();
    for (const [stageIndex, stage] of lineage.stages.entries()) {
      const stageWhere = `${where} stage ${stageIndex + 1}`;
      exactObjectKeys(stage, ['lineage_id', 'identity', 'stage_id', 'stage_index', 'anchor',
        'genome', 'genome_sha256', 'portrait_path', 'card_path', 'silhouette_path', 'route', 'owned',
        'production_matches_fresh', 'repeated_render_stable', 'portrait_sha256',
        'stripped_lineage_control'], stageWhere);
      validateEvidenceGenome(stage.genome, `${stageWhere}.genome`);
      assert(stage.stage_id === STAGES[stageIndex] && stage.stage_index === stageIndex
        && stage.anchor === ANCHORS[stageIndex], `${stageWhere}: stale stage contract`);
      assert(stage.identity === `${id}|${stage.stage_id}`, `${stageWhere}: stale lineage/stage identity`);
      assert(isObject(stage.genome) && exactSha(stage.genome_sha256, `${stageWhere}.genome_sha256`)
        === sha256(stableJson(stage.genome)), `${stageWhere}: stale full-genome SHA-256`);
      assert(Number.isInteger(stage.genome.seed) && stage.genome.seed >= 0, `${stageWhere}: invalid production seed`);
      assert(stage.genome.kingdom === expectedLineage.set.slice('earth-'.length), `${stageWhere}: wrong genome kingdom`);
      if (stageIndex === 0) {
        assert(stage.genome._earthName === expectedLineage.species
          && stage.genome._earthBlend === undefined && stage.genome._earthBlendKingdom === undefined
          && stage.genome._anchorVal === undefined && stage.route === 'named-owned'
          && stage.stripped_lineage_control === null,
        `${stageWhere}: pure named-lineage provenance/route is missing`);
        assert(stage.genome_sha256 === inputById.get('pure').genome_sha256,
          `${stageWhere}: pure stage does not equal the exact pure input`);
      } else {
        const expectedRoute = expectedHybridLineageRoute(expectedLineage.set, expectedLineage.species);
        assert(stage.genome._earthName === undefined && stage.genome._earthBlend === expectedLineage.species
          && stage.genome._earthBlendKingdom === expectedLineage.set.slice('earth-'.length)
          && stage.route === expectedRoute,
        `${stageWhere}: inherited hybrid lineage/anchor/route provenance is missing`);
        productionAnchor(stage.genome._anchorVal, ANCHORS[stageIndex], `${stageWhere}.genome._anchorVal`);
        assert(isObject(stage.stripped_lineage_control)
          && stage.stripped_lineage_control.differs_from_lineage === true
          && /^procedural-(owned|verbatim)$/.test(stage.stripped_lineage_control.route)
          && SHA.test(stage.stripped_lineage_control.portrait_sha256)
          && stage.stripped_lineage_control.portrait_sha256 !== stage.portrait_sha256,
        `${stageWhere}: stripped-lineage negative control is missing`);
        exactObjectKeys(stage.stripped_lineage_control,
          ['route', 'portrait_sha256', 'differs_from_lineage'], `${stageWhere}.stripped_lineage_control`);
        const parents = stageIndex === 1
          ? [inputById.get('pure').genome.seed, inputById.get('earth-mate').genome.seed]
          : stageIndex === 2
            ? [inputById.get('pure').genome.seed, inputById.get('alien-1').genome.seed]
            : stageIndex === 3
              ? [lineage.stages[2].genome.seed, inputById.get('alien-2').genome.seed]
              : [lineage.stages[3].genome.seed, inputById.get('alien-3').genome.seed];
        assert(isObject(stage.genome._src) && sameJson(stage.genome.parents, parents),
          `${stageWhere}: production _src / exact parent seed chain is missing`);
      }
      assert(stage.owned === stage.route.endsWith('-owned'),
        `${stageWhere}: owned flag disagrees with the production route`);
      assert(stage.production_matches_fresh === true && stage.repeated_render_stable === true,
        `${stageWhere}: fresh/repeat renderer outcome is missing`);
      const portraitPath = safeRelative(stage.portrait_path, `${stageWhere}.portrait_path`, '.png');
      const portrait = assetsByPath.get(portraitPath);
      assert(portrait?.kind === 'portrait' && portrait.sha256 === stage.portrait_sha256,
        `${stageWhere}: stale portrait binding`);
      const cardPath = safeRelative(stage.card_path, `${stageWhere}.card_path`, '.png');
      const silhouettePath = safeRelative(stage.silhouette_path, `${stageWhere}.silhouette_path`, '.png');
      const card = assetsByPath.get(cardPath); const silhouette = assetsByPath.get(silhouettePath);
      assert(card?.kind === 'card' && silhouette?.kind === 'silhouette'
        && portrait.identity === stage.identity && card.identity === stage.identity
        && silhouette.identity === stage.identity,
      `${stageWhere}: portrait/card/silhouette asset identity binding is missing`);
      const ids = pixelGroups.get(stage.portrait_sha256) || []; ids.push(stage.stage_id); pixelGroups.set(stage.portrait_sha256, ids);
      stageReviewRows.push({ lineage_id: id, species: lineage.species, stage_id: stage.stage_id,
        anchor: stage.anchor,
        portrait_path: portraitPath, portrait_sha256: portrait.sha256,
        card_path: cardPath, card_sha256: card.sha256,
        silhouette_path: silhouettePath, silhouette_sha256: silhouette.sha256 });
    }
    assert(new Set(lineage.stages.map((stage) => stage.genome_sha256)).size === 5,
      `${where}: stage full-genome identities are not distinct`);
    const duplicates = [...pixelGroups.entries()].filter(([, ids]) => ids.length > 1)
      .sort(([a], [b]) => cmp(a, b)).map(([portrait_sha256, stage_ids]) => ({ portrait_sha256, stage_ids }));
    assert(Array.isArray(lineage.pixel_identity_groups), `${where}: pixel identity groups must be an array`);
    lineage.pixel_identity_groups.forEach((group, index) => exactObjectKeys(group,
      ['portrait_sha256', 'stage_ids'], `${where} pixel group ${index + 1}`));
    assert(stableJson(lineage.pixel_identity_groups) === stableJson(duplicates)
      && lineage.stage_pixel_unique_count === pixelGroups.size,
    `${where}: pixel identity accounting is stale`);
    if (duplicates.length) {
      identicalLineages.push(id);
      observedIdentical.push({ lineage_id: id, species: expectedLineage.species,
        pixel_identity_groups: duplicates, status: 'FAIL_BYTE_IDENTICAL_STAGES' });
    }
    const expectedStatus = duplicates.length ? 'FAIL_BYTE_IDENTICAL_STAGES' : 'OPEN_UNREVIEWED';
    assert(lineage.anchor_visual_differentiation === expectedStatus, `${where}: machine status hides pixel outcome`);
    const lineageSheetPath = safeRelative(lineage.lineage_sheet, `${where}.lineage_sheet`, '.png');
    const joinAtlasPath = safeRelative(lineage.join_atlas, `${where}.join_atlas`, '.png');
    const lineageSheet = assetsByPath.get(lineageSheetPath); const joinAtlas = assetsByPath.get(joinAtlasPath);
    assert(lineageSheet?.kind === 'lineage-sheet' && joinAtlas?.kind === 'join-atlas'
      && lineageSheet.identity === id && joinAtlas.identity === id,
    `${where}: lineage sheet/atlas identity binding missing`);
    lineageReviewRows.push({ lineage_id: id, species: lineage.species,
      lineage_sheet_path: lineageSheetPath, lineage_sheet_sha256: lineageSheet.sha256,
      join_atlas_path: joinAtlasPath, join_atlas_sha256: joinAtlas.sha256 });
  }
  const expectedMachine = identicalLineages.length ? 'FAIL_BYTE_IDENTICAL_STAGES' : 'OPEN_UNREVIEWED';
  assert(manifest.machine_anchor_visual_status === expectedMachine,
    'hybrid: package-level machine state disagrees with byte-identical portraits');
  assert(stableJson(manifest.machine_observations.byte_identical_anchor_lineages) === stableJson(observedIdentical),
    'hybrid: disclosed byte-identical lineage observations are stale');
  assert(Array.isArray(manifest.cache_controls) && manifest.cache_controls.length === 6, 'hybrid: expected six cache controls');
  for (const [offset, row] of manifest.cache_controls.entries()) {
    const where = `hybrid cache control ${offset + 1}`;
    exactObjectKeys(row, ['lineage_id', 'species', 'input_order_first', 'alien', 'same_seed', 'seed',
      'different_full_genomes', 'differing_fields', 'ab_genome', 'ba_genome', 'ab_genome_sha256',
      'ba_genome_sha256', 'ab_portrait_sha256', 'ba_portrait_sha256', 'cache_independent', 'ab_route',
      'ba_route', 'ab_portrait_path', 'ba_portrait_path'], where);
    exactObjectKeys(row.alien, ['id', 'genome', 'derivation'], `${where}.alien`);
    exactObjectKeys(row.alien.derivation, ['kind', 'formula', 'row', 'attempt', 'heat', 'seed'],
      `${where}.alien.derivation`);
    validateEvidenceGenome(row.alien.genome, `${where}.alien.genome`);
    assert(row.alien.id === 'cache-alien', `${where}: wrong cache-alien identity`);
    assert(row.lineage_id === HYBRID_CACHE_IDS[offset], `${where}: identity/order changed`);
    const lineageSpec = HYBRID_LINEAGES.find((lineage) => lineage.id === row.lineage_id);
    assert(row.species === lineageSpec.species && row.same_seed === true
      && row.different_full_genomes === true && row.cache_independent === true,
    `${where}: identity or cache-independence flags are missing`);
    assert(row.input_order_first === 'AB' || row.input_order_first === 'BA', `${where}: render order is missing`);
    assert(isObject(row.ab_genome) && isObject(row.ba_genome), `${where}: full AB/BA genomes are missing`);
    validateEvidenceGenome(row.ab_genome, `${where}.ab_genome`);
    validateEvidenceGenome(row.ba_genome, `${where}.ba_genome`);
    assert(exactSha(row.ab_genome_sha256, `${where}.ab_genome_sha256`) === sha256(stableJson(row.ab_genome))
      && exactSha(row.ba_genome_sha256, `${where}.ba_genome_sha256`) === sha256(stableJson(row.ba_genome)),
    `${where}: stale AB/BA full-genome SHA-256`);
    assert(row.ab_genome_sha256 !== row.ba_genome_sha256
      && row.ab_genome.seed === row.ba_genome.seed && row.seed === row.ab_genome.seed,
    `${where}: same-seed/different-full-genome contract failed`);
    const expectedDifferingFields = CACHE_GENE_KEYS.filter((key) =>
      stableJson(row.ab_genome[key]) !== stableJson(row.ba_genome[key]));
    assert(expectedDifferingFields.length > 0 && sameJson(row.differing_fields, expectedDifferingFields),
      `${where}: differing inherited fields do not match the canonical AB/BA genomes`);
    assert(Array.isArray(row.ab_genome.parents) && Array.isArray(row.ba_genome.parents)
      && row.ab_genome.parents[0] === row.ba_genome.parents[1]
      && row.ab_genome.parents[1] === row.ba_genome.parents[0],
    `${where}: AB/BA parent seed order is not reversed`);
    const owner = lineageSpec.set.slice('earth-'.length);
    assert(row.alien.genome.kingdom === owner, `${where}: cache alien kingdom differs from the lineage owner`);
    assert(row.ab_genome._earthBlend === row.species && row.ba_genome._earthBlend === row.species
      && row.ab_genome._earthBlendKingdom === owner && row.ba_genome._earthBlendKingdom === owner
      && row.ab_route === expectedHybridLineageRoute(lineageSpec.set, lineageSpec.species)
      && row.ba_route === expectedHybridLineageRoute(lineageSpec.set, lineageSpec.species),
    `${where}: AB/BA lineage owner, anchor, or production route is missing`);
    productionAnchor(row.ab_genome._anchorVal, 0.73, `${where}.ab_genome._anchorVal`);
    productionAnchor(row.ba_genome._anchorVal, 0.73, `${where}.ba_genome._anchorVal`);
    const ab = assetsByPath.get(safeRelative(row.ab_portrait_path, `${where}.ab_portrait_path`, '.png'));
    const ba = assetsByPath.get(safeRelative(row.ba_portrait_path, `${where}.ba_portrait_path`, '.png'));
    assert(ab?.kind === 'cache-portrait' && ba?.kind === 'cache-portrait'
      && ab.sha256 === row.ab_portrait_sha256 && ba.sha256 === row.ba_portrait_sha256
      && row.ab_portrait_sha256 !== row.ba_portrait_sha256,
    `${where}: stale cache portrait binding`);
    assert(ab.identity === `${row.lineage_id}|AB` && ba.identity === `${row.lineage_id}|BA`,
      `${where}: cache asset identity binding mismatch`);
    cacheReviewRows.push({ lineage_id: row.lineage_id, species: row.species,
      ab_portrait_path: row.ab_portrait_path, ab_portrait_sha256: ab.sha256,
      ba_portrait_path: row.ba_portrait_path, ba_portrait_sha256: ba.sha256 });
  }
  assert(Array.isArray(manifest.mixed_kingdom_sentinels)
    && manifest.mixed_kingdom_sentinels.length === MIXED_SENTINELS.length,
    'hybrid: expected 16 mixed-kingdom sentinels');
  for (const [offset, row] of manifest.mixed_kingdom_sentinels.entries()) {
    const spec = MIXED_SENTINELS[offset];
    const where = `hybrid mixed sentinel ${offset + 1} (${spec.id})`;
    assert(isObject(row) && row.ordinal === offset + 1 && row.sentinel_id === spec.id,
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
    assert(row.visual_review_status === 'UNREVIEWED', `${where}: carried visual verdict is forbidden`);
    assert(isObject(row.search) && row.search.kind === 'deterministic-seed-search'
      && row.search.salt === spec.salt && row.search.limit === 2048
      && Number.isInteger(row.search.attempt) && row.search.attempt >= 0 && row.search.attempt < 2048,
    `${where}: deterministic search provenance is invalid`);
    exactObjectKeys(row.search, ['kind', 'salt', 'attempt', 'limit'], `${where}.search`);
    const inputContract = mixedInputContract(spec, row.search.attempt);
    assert(Array.isArray(row.inputs) && row.inputs.length === 2
      && sameJson(row.inputs.map((input) => input.id), expectedMixedInputIds(spec)),
    `${where}: exact parent order is missing`);
    row.inputs.forEach((input, inputIndex) => validatePackagedMixedInput(
      input, inputContract[inputIndex], spec, row.search.attempt, `${where} input ${inputIndex + 1}`));
    assert(isObject(row.cross) && row.cross.function === 'crossGenome'
      && row.cross.parent_a === inputContract[0].id && row.cross.parent_b === inputContract[1].id,
    `${where}: production cross order is invalid`);
    exactObjectKeys(row.cross, ['function', 'parent_a', 'parent_b'], `${where}.cross`);
    assert(isObject(row.child_genome)
      && exactSha(row.child_genome_sha256, `${where}.child_genome_sha256`) === sha256(stableJson(row.child_genome)),
    `${where}: stale child full-genome SHA-256`);
    validateEvidenceGenome(row.child_genome, `${where}.child_genome`);
    const child = row.child_genome;
    assert(child._earthName === undefined && child._earthBlend === spec.name
      && child._earthBlendKingdom === spec.owner && child.kingdom === spec.child && isObject(child._src)
      && sameJson(child.parents, row.inputs.map((input) => input.genome.seed))
      && row.lineage === spec.name && row.lineage_kingdom === spec.owner
      && row.child_kingdom === child.kingdom,
    `${where}: selected-owner child lineage provenance is missing`);
    const expectedAnchor = spec.kind === 'duplicate-name-owner' ? 0.9 : 0.73;
    productionAnchor(child._anchorVal, expectedAnchor, `${where}.child_genome._anchorVal`);
    productionAnchor(row.anchor, expectedAnchor, `${where}.anchor`);
    const expectedRoute = expectedHybridLineageRoute(spec.owner, spec.name);
    assert(row.route === expectedRoute && row.expected_route === expectedRoute,
      `${where}: production route does not follow the selected lineage owner`);
    assert(row.production_matches_fresh === true && row.repeated_render_stable === true
      && row.repeated_cross_stable === true && exactSha(row.portrait_sha256, `${where}.portrait_sha256`),
    `${where}: fresh/repeat production outcomes are missing`);
    validatePackagedMixedControl(row.stripped_lineage_control, withoutLineage(child), row.portrait_sha256,
      `${where} stripped-lineage control`);
    assert(/^procedural-(?:owned|verbatim)$/.test(row.stripped_lineage_control.route)
      && row.stripped_lineage_control.differs_from_selected_owner === true,
    `${where}: stripped-lineage bypass control failed`);
    const markerless = { ...child }; delete markerless._earthBlendKingdom;
    validatePackagedMixedControl(row.missing_owner_marker_control, markerless, row.portrait_sha256,
      `${where} missing-owner-marker control`);
    const fallbackOwner = spec.kind === 'duplicate-name-owner' ? spec.child : spec.owner;
    const markerRequired = spec.kind === 'duplicate-name-owner' && spec.child !== spec.owner;
    assert(row.missing_owner_marker_control.expected_legacy_owner === fallbackOwner
      && row.missing_owner_marker_control.route === expectedMarkerlessLineageRoute(fallbackOwner)
      && row.missing_owner_marker_control.required_to_differ === markerRequired,
    `${where}: route-aware legacy fallback contract changed`);
    if (markerRequired) assert(row.missing_owner_marker_control.differs_from_selected_owner === true,
      `${where}: required owner-marker removal did not change pixels`);
    if (spec.kind === 'duplicate-name-owner') {
      const counterfactual = { ...child, _earthBlendKingdom: spec.other };
      validatePackagedMixedControl(row.counterfactual_owner_control, counterfactual, row.portrait_sha256,
        `${where} counterfactual-owner control`);
      assert(row.counterfactual_owner_control.route === expectedHybridLineageRoute(spec.other, spec.name)
        && row.counterfactual_owner_control.differs_from_selected_owner === true,
      `${where}: duplicate-name counterfactual owner did not select distinct pixels`);
    } else assert(row.counterfactual_owner_control === null,
      `${where}: unique-name row carries a fabricated counterfactual owner`);
    const asset = assetsByPath.get(safeRelative(row.portrait_path, `${where}.portrait_path`, '.png'));
    assert(asset?.kind === 'mixed-portrait' && asset.sha256 === row.portrait_sha256,
      `${where}: stale mixed portrait binding`);
    assert(asset.identity === spec.id
      && row.portrait_path === `mixed-kingdom/${String(offset + 1).padStart(2, '0')}-${spec.id}.png`,
    `${where}: mixed asset identity/path binding mismatch`);
    mixedReviewRows.push({ sentinel_id: spec.id, species: spec.name, selected_lineage_owner: spec.owner,
      portrait_path: row.portrait_path, portrait_sha256: asset.sha256 });
  }
  assert(assetsByPath.get(safeRelative(manifest.mixed_sentinel_sheet, 'hybrid mixed sheet', '.png'))?.kind === 'mixed-sheet',
    'hybrid: mixed sentinel sheet binding missing');
  assertExactInventory(diskFiles, expectedFiles, 'hybrid');
  const assetAggregateSha256 = sha256([...assetsByPath.values()].sort((a, b) => cmp(a.path, b.path))
    .map((row) => `${row.path}\u0000${row.bytes}\u0000${row.sha256}\n`).join(''));
  return { root, files: diskFiles, commit: expectedCommit, manifest, assetsByPath,
    stageReviewRows, lineageReviewRows, cacheReviewRows, mixedReviewRows,
    assetAggregateSha256, manifestSha256: hashFile(path.join(root, 'manifest.json')),
    machineStatus: manifest.machine_anchor_visual_status };
}

function validateInputs(catalogueValue, layoutValue, hybridValue, catalogueReferences = undefined) {
  const roots = [realDirectory(catalogueValue, 'catalogue root'), realDirectory(layoutValue, 'layout root'),
    realDirectory(hybridValue, 'hybrid root')];
  for (let left = 0; left < roots.length; left++) for (let right = left + 1; right < roots.length; right++) {
    assert(!within(roots[left], roots[right]) && !within(roots[right], roots[left]),
      `input roots must be distinct and non-overlapping: ${portable(roots[left])} / ${portable(roots[right])}`);
  }
  const catalogue = validateCatalogue(roots[0], catalogueReferences ?? currentCatalogueReferences());
  const layout = validateLayout(roots[1], catalogue);
  const hybrid = validateHybrid(roots[2], catalogue.commit, catalogue.browser);
  return { catalogue, layout, hybrid };
}

function validateOutput(value, roots) {
  const output = path.resolve(value);
  assert(path.extname(output).toLowerCase() === '.zip', '--output must end in .zip');
  const basename = path.basename(output);
  assert(/^[A-Za-z0-9][A-Za-z0-9._-]*\.zip$/i.test(basename), '--output basename must use portable letters, digits, dot, underscore, or hyphen');
  const topName = basename.slice(0, -4);
  assert(topName !== '.' && topName !== '..', '--output has unsafe top-level directory name');
  assert(!fs.existsSync(output), `output already exists: ${portable(output)}`);
  const sidecar = `${output}.sha256`;
  assert(!fs.existsSync(sidecar), `output sidecar already exists: ${portable(sidecar)}`);
  const parent = realDirectory(path.dirname(output), 'output parent');
  assert(normalized(parent) === normalized(path.dirname(output)), 'output parent changed during validation');
  assert(!within(output, REPOSITORY_ROOT),
    '--output must be outside the source repository so publication cannot dirty its own freshness binding');
  for (const root of roots) {
    assert(!within(output, root) && !within(root, output) && !within(sidecar, root) && !within(root, sidecar),
      `output must not overlap input root ${portable(root)}`);
  }
  return { output, sidecar, parent, topName };
}
function writeExclusive(file, value) { fs.writeFileSync(file, value, { flag: 'wx' }); }
function writeJsonExclusive(file, value) { writeExclusive(file, JSON.stringify(value, null, 2) + '\n'); }
function copyExactTree(source, sourceFiles, destination) {
  fs.mkdirSync(destination, { recursive: false });
  for (const relative of sourceFiles) {
    const input = realFile(source, relative, `copy source ${relative}`);
    const output = resolveInside(destination, relative, `copy destination ${relative}`);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.copyFileSync(input, output, fs.constants.COPYFILE_EXCL);
    assert(hashFile(input) === hashFile(output), `copy verification failed: ${relative}`);
  }
}
function buildHybridReviewTemplate(hybrid, sourceCommit) {
  const lineageRows = hybrid.lineageReviewRows.map((row) => ({ ...row, band: '', reason: '',
    required_surfaces_reviewed: {
      five_stage_portraits: false,
      five_stage_cards: false,
      five_stage_silhouettes: false,
      lineage_sheet: false,
      join_atlas: false,
      low_anchor_stage: false,
    },
    reviewer_notes: '', review_complete: false,
  }));
  return {
    schema: REVIEW_TEMPLATE_SCHEMA,
    status: 'BLANK_UNREVIEWED_TEMPLATE',
    non_certifying: true,
    instructions: [
      'Fill only after inspecting the packaged hash-bound hybrid assets.',
      'This template records review notes; it does not certify a release or award an art PASS.',
      'Do not change any bound path or SHA-256. Set review_complete only after every applicable field is completed.',
      'Choose exactly PASS, POLISH, or FAIL for band and supply a nonempty reason; every required-surface flag must be true before review_complete.',
    ],
    verdict_contract: {
      allowed_bands: ['PASS', 'POLISH', 'FAIL'],
      blank_band: '',
      reason_required: true,
      required_surface_flags_must_all_be_true_for_completion: true,
    },
    binding: {
      source_commit: sourceCommit,
      hybrid_manifest_sha256: hybrid.manifestSha256,
      hybrid_asset_aggregate_sha256: hybrid.assetAggregateSha256,
      machine_anchor_visual_status: hybrid.machineStatus,
      review_status_at_packaging: 'UNREVIEWED',
      visual_continuity_status_at_packaging: 'OPEN',
    },
    lineages: lineageRows,
    stages: hybrid.stageReviewRows.map((row) => ({ ...row,
      band: '', reason: '',
      required_surfaces_reviewed: { portrait: false, card: false, silhouette: false },
      reviewer_notes: '', review_complete: false,
    })),
    cache_controls: hybrid.cacheReviewRows.map((row) => ({ ...row, band: '', reason: '',
      required_surfaces_reviewed: { ab_portrait: false, ba_portrait: false },
      reviewer_notes: '', review_complete: false })),
    mixed_kingdom_sentinels: hybrid.mixedReviewRows.map((row) => ({ ...row, band: '', reason: '',
      required_surfaces_reviewed: { portrait: false }, reviewer_notes: '', review_complete: false })),
    overall: { band: '', reason: '', reviewer: '', reviewed_at_utc: '',
      required_surfaces_reviewed: { all_lineages: false, cache_controls: false, mixed_kingdom_sentinels: false },
      reviewer_notes: '', review_complete: false },
  };
}
function buildReadme(inputs, zipName) {
  return [
    '# CURRENT-ONLY — UNREVIEWED — NOT CERTIFIED', '',
    `Archive: ${zipName}`, '',
    'This ZIP combines current-commit catalogue, layout, and representative hybrid evidence for human review. It does not award an art PASS,',
    'certify a release, or replace the source generators and their negative controls.', '',
    `Source commit shared by all three evidence roots: ${inputs.catalogue.commit}`, '',
    `Browser provenance shared by catalogue/layout/hybrid: ${inputs.catalogue.browser.product} (${inputs.catalogue.browser.executable}; revision ${inputs.catalogue.browser.revision}; protocol ${inputs.catalogue.browser.protocol_version}).`, '',
    `Platinum repair ruler (exact title/contract in the manifest): SHA-256 ${PLATINUM_REVIEW.sha256}; prior disposition ${PLATINUM_REVIEW.disposition}.`,
    `Sealed reviewed baseline: source ${PLATINUM_REVIEW.baseline_source_commit}; archive SHA-256 ${PLATINUM_REVIEW.baseline_archive_sha256}.`, '',
    'Included evidence:', '',
    '- `catalogue/`: 1,250 native portraits (631 fauna, 332 flora, 27 fungi, 20 microbe, 240 procedural) and 196 GP7.1 capture packets.',
    '- `layout/`: 181 exact set/family groups, 233 review packets, and 466 labelled/unlabelled packet sheets.',
    `- \`hybrid/\`: ${HYBRID_LINEAGES.length} representative lineages × 5 production stages, cache and mixed-kingdom controls, and ${HYBRID_ASSETS} hash-bound assets. Machine state: ${inputs.hybrid.machineStatus}.`,
    `- Physical PNG inventory: exactly ${PHYSICAL_PNG_COUNTS.total} = 1,250 catalogue portraits + 196 catalogue strips + 466 layout sheets + ${HYBRID_ASSETS} hybrid assets.`,
    '- `hybrid-review-template.json`: blank review fields bound to the packaged hybrid manifest and asset hashes.',
    '- `package-manifest.json`: records and hashes every copied/input payload plus the top README and blank template.',
    '- `SHA256SUMS`: hashes every other extracted file, including `package-manifest.json`; it excludes only itself. The external ZIP SHA-256 sidecar binds the complete archive including `SHA256SUMS`.', '',
    'Review boundary and caveats:', '',
    ...PACKAGE_SCOPE_CAVEATS.map((value) => `- ${value}`),
    '- Hybrid visual continuity remains OPEN and requires a human verdict.',
    '- A disclosed `FAIL_BYTE_IDENTICAL_STAGES` machine state is preserved, never converted into OPEN or PASS.',
    '- Silhouette and crop diagnostics are aids, not authoritative masks or visual verdicts.',
    '- No completed-verdict artifact or completed-status/schema field from an input is accepted under the clean-source producer contract.',
    '- Re-run this packager from new prepared roots for a later source commit; CURRENT-ONLY means this archive must not be treated as proof about other commits.',
    '- Do not edit this ZIP in place.', '',
  ].join('\n');
}
function fileRecords(root, exclude = new Set()) {
  return listFiles(root, 'package staging').filter((relative) => !exclude.has(relative)).map((relative) => {
    const file = realFile(root, relative, `package file ${relative}`);
    const stat = fs.statSync(file);
    return { path: relative, bytes: stat.size, sha256: hashFile(file) };
  });
}
function buildPackageManifest(inputs, topName, files, templateSha256, freshnessAtPackaging) {
  const pngPaths = files.filter((row) => row.path.toLowerCase().endsWith('.png'));
  assert(pngPaths.length === PHYSICAL_PNG_COUNTS.total,
    `package staging: expected ${PHYSICAL_PNG_COUNTS.total} physical PNGs, got ${pngPaths.length}`);
  const fileAggregateSha256 = sha256(files.map((row) => `${row.path}\u0000${row.bytes}\u0000${row.sha256}\n`).join(''));
  return {
    schema: PACKAGE_SCHEMA,
    evidence_scope: 'CURRENT_ONLY',
    scope_label: 'CURRENT-ONLY',
    package_status: 'UNREVIEWED',
    certification_status: 'NOT_CERTIFIED',
    purpose: 'CURRENT-ONLY, non-certifying combined current-state evidence for human review.',
    scope_caveats: PACKAGE_SCOPE_CAVEATS,
    generated_at_utc: new Date().toISOString(),
    top_level_directory: topName,
    source_commit: inputs.catalogue.commit,
    freshness_at_packaging: freshnessAtPackaging,
    counts: {
      catalogue: { portraits: TOTAL, sets: SETS, capture_packets: CATALOGUE_PACKETS },
      layout: { families: LAYOUT_FAMILIES, packets: LAYOUT_PACKETS, sheets: LAYOUT_SHEETS },
      hybrid: { lineages: HYBRID_LINEAGES.length, stages_per_lineage: 5, assets: HYBRID_ASSETS,
        machine_anchor_visual_status: inputs.hybrid.machineStatus, visual_continuity_status: 'OPEN' },
      physical_pngs: PHYSICAL_PNG_COUNTS,
    },
    input_bindings: {
      browser_provenance: inputs.catalogue.browser,
      catalogue_output: inputs.catalogue.preparationOutput,
      catalogue_preparation_sha256: inputs.catalogue.preparationSha256,
      catalogue_identity_manifest_sha256: inputs.catalogue.identityManifestSha256,
      catalogue_portrait_manifest_sha256: inputs.catalogue.portraitManifestSha256,
      layout_plan_sha256: inputs.layout.planSha256,
      layout_packet_manifest_sha256: inputs.layout.packetManifestSha256,
      layout_catalogue_sha256: inputs.layout.catalogueDigest,
      hybrid_manifest_sha256: inputs.hybrid.manifestSha256,
      hybrid_asset_aggregate_sha256: inputs.hybrid.assetAggregateSha256,
      hybrid_review_template_sha256: templateSha256,
      platinum_review_sha256: PLATINUM_REVIEW.sha256,
    },
    hash_contract: {
      algorithm: 'SHA-256',
      files_cover_every_payload_file_except: ['package-manifest.json', 'SHA256SUMS'],
      package_level_sha256sums: 'SHA256SUMS covers every other extracted file, including package-manifest.json, and excludes only itself.',
      external_binding: 'The external ZIP SHA-256 sidecar binds the complete archive, including SHA256SUMS.',
      file_aggregate_format: 'path NUL bytes NUL sha256 LF, sorted by path',
      file_aggregate_sha256: fileAggregateSha256,
    },
    files,
  };
}
function validatePackageManifestSchema(manifest) {
  exactObjectKeys(manifest, [
    'schema', 'evidence_scope', 'scope_label', 'package_status', 'certification_status', 'purpose',
    'scope_caveats', 'generated_at_utc', 'top_level_directory', 'source_commit',
    'freshness_at_packaging', 'counts', 'input_bindings', 'hash_contract', 'files',
  ], 'package manifest');
  exactObjectKeys(manifest.freshness_at_packaging, [
    'status', 'source_commit', 'checkout_clean', 'checkout_status_sha256', 'producer_sha256',
    'platinum_review_sha256', 'browser_provenance',
  ], 'package manifest freshness_at_packaging');
  exactObjectKeys(manifest.counts, ['catalogue', 'layout', 'hybrid', 'physical_pngs'],
    'package manifest counts');
  exactObjectKeys(manifest.counts.catalogue, ['portraits', 'sets', 'capture_packets'],
    'package manifest catalogue counts');
  exactObjectKeys(manifest.counts.layout, ['families', 'packets', 'sheets'],
    'package manifest layout counts');
  exactObjectKeys(manifest.counts.hybrid, [
    'lineages', 'stages_per_lineage', 'assets', 'machine_anchor_visual_status',
    'visual_continuity_status',
  ], 'package manifest hybrid counts');
  exactObjectKeys(manifest.counts.physical_pngs, [
    'catalogue_portraits', 'catalogue_packet_strips', 'layout_packet_sheets', 'hybrid_assets', 'total',
  ], 'package manifest physical PNG counts');
  exactObjectKeys(manifest.input_bindings, [
    'browser_provenance', 'catalogue_output', 'catalogue_preparation_sha256', 'catalogue_identity_manifest_sha256',
    'catalogue_portrait_manifest_sha256', 'layout_plan_sha256', 'layout_packet_manifest_sha256',
    'layout_catalogue_sha256', 'hybrid_manifest_sha256', 'hybrid_asset_aggregate_sha256',
    'hybrid_review_template_sha256', 'platinum_review_sha256',
  ], 'package manifest input_bindings');
  exactObjectKeys(manifest.hash_contract, [
    'algorithm', 'files_cover_every_payload_file_except', 'package_level_sha256sums',
    'external_binding', 'file_aggregate_format', 'file_aggregate_sha256',
  ], 'package manifest hash_contract');
  assert(Array.isArray(manifest.files), 'package manifest files: expected an array');
  manifest.files.forEach((row, offset) => exactObjectKeys(row, ['path', 'bytes', 'sha256'],
    `package manifest file ${offset + 1}`));
  assert(manifest.purpose === 'CURRENT-ONLY, non-certifying combined current-state evidence for human review.',
    'package manifest: purpose changed or carries unreviewed material');
  assert(typeof manifest.generated_at_utc === 'string'
    && !Number.isNaN(Date.parse(manifest.generated_at_utc))
    && new Date(manifest.generated_at_utc).toISOString() === manifest.generated_at_utc,
  'package manifest: generated_at_utc must be an exact ISO instant');
  assert(manifest.hash_contract.algorithm === 'SHA-256'
    && stableJson(manifest.hash_contract.files_cover_every_payload_file_except)
      === stableJson(['package-manifest.json', 'SHA256SUMS'])
    && manifest.hash_contract.package_level_sha256sums
      === 'SHA256SUMS covers every other extracted file, including package-manifest.json, and excludes only itself.'
    && manifest.hash_contract.external_binding
      === 'The external ZIP SHA-256 sidecar binds the complete archive, including SHA256SUMS.'
    && manifest.hash_contract.file_aggregate_format === 'path NUL bytes NUL sha256 LF, sorted by path',
  'package manifest: hash contract changed');
}
function validatePackageScope(manifest, readme) {
  assert(manifest.evidence_scope === 'CURRENT_ONLY' && manifest.scope_label === 'CURRENT-ONLY',
    'package: evidence scope must be literally CURRENT-ONLY');
  assert(manifest.package_status === 'UNREVIEWED' && manifest.certification_status === 'NOT_CERTIFIED',
    'package: status must remain UNREVIEWED / NOT_CERTIFIED');
  assert(typeof manifest.purpose === 'string' && manifest.purpose.includes('CURRENT-ONLY'),
    'package: purpose omitted CURRENT-ONLY');
  assert(stableJson(manifest.scope_caveats) === stableJson(PACKAGE_SCOPE_CAVEATS),
    'package: exact current-only and representative-hybrid caveats are missing');
  assert(typeof readme === 'string' && readme.startsWith('# CURRENT-ONLY — UNREVIEWED — NOT CERTIFIED\n')
    && readme.includes(`${HYBRID_LINEAGES.length} representative lineages`)
    && readme.includes('not every bloodline and not every possible future generation')
    && readme.includes('Amoeba is the principal microbe five-stage lineage')
    && readme.includes(PLATINUM_REVIEW.sha256)
    && readme.includes(PLATINUM_REVIEW.disposition)
    && /Low-anchor non-fauna/i.test(readme) && /Apple.*cache-collision subset/i.test(readme),
  'package README: current-only/status/representative-lineage caveats are incomplete');
  assert(!/full[- ]generations?/i.test(readme) && !/full[- ]generations?/i.test(manifest.purpose),
    'package: unqualified full-generation language is forbidden');
}
function validatePhysicalPngCounts(manifest, files) {
  assert(stableJson(manifest.counts?.physical_pngs) === stableJson(PHYSICAL_PNG_COUNTS),
    `package manifest: physical PNG inventory must be exactly ${PHYSICAL_PNG_COUNTS.total.toLocaleString('en-US')} with the declared breakdown`);
  const pngs = files.map((row) => row.path).filter((relative) => relative.toLowerCase().endsWith('.png'));
  const actual = {
    catalogue_portraits: pngs.filter((relative) => relative.startsWith('catalogue/portraits/')).length,
    catalogue_packet_strips: pngs.filter((relative) => /^catalogue\/packets\/packet-[^/]+\/strip\.png$/i.test(relative)).length,
    layout_packet_sheets: pngs.filter((relative) => relative.startsWith('layout/packets/')).length,
    hybrid_assets: pngs.filter((relative) => relative.startsWith('hybrid/')).length,
    total: pngs.length,
  };
  assert(stableJson(actual) === stableJson(PHYSICAL_PNG_COUNTS),
    `package manifest: physical PNG files are ${JSON.stringify(actual)}, expected ${JSON.stringify(PHYSICAL_PNG_COUNTS)}`);
}
function writeSha256Sums(root) {
  const records = fileRecords(root, new Set(['SHA256SUMS']));
  const lines = records.map((row) => `${row.sha256}  ${row.path}\n`).join('');
  writeExclusive(path.join(root, 'SHA256SUMS'), lines);
  return { records, sha256: sha256(lines) };
}
function verifySha256Sums(root) {
  const sumFile = realFile(root, 'SHA256SUMS', 'package SHA256SUMS');
  const text = fs.readFileSync(sumFile, 'utf8');
  assert(text.length > 0 && text.endsWith('\n'), 'package SHA256SUMS: expected nonempty LF-terminated content');
  const rows = text.slice(0, -1).split('\n').map((line, offset) => {
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line);
    assert(match, `package SHA256SUMS line ${offset + 1}: invalid format`);
    const relative = safeRelative(match[2], `package SHA256SUMS line ${offset + 1} path`);
    assert(relative !== 'SHA256SUMS', 'package SHA256SUMS must exclude only itself');
    return { path: relative, sha256: match[1] };
  });
  const paths = rows.map((row) => row.path);
  assert(sameJson(paths, [...paths].sort(cmp)) && new Set(paths).size === paths.length,
    'package SHA256SUMS: paths must be unique and sorted');
  const expected = listFiles(root, 'package SHA256SUMS inventory').filter((relative) => relative !== 'SHA256SUMS');
  assertExactInventory(paths, expected, 'package SHA256SUMS');
  for (const row of rows) assert(hashFile(realFile(root, row.path, `package SHA256SUMS ${row.path}`)) === row.sha256,
    `package SHA256SUMS: stale hash for ${row.path}`);
  return { rows, sha256: sha256(text) };
}
function verifySealedPackageIntegrity(root, manifest) {
  validatePackageManifestSchema(manifest);
  assert(isObject(manifest) && Array.isArray(manifest.files) && manifest.files.length > 0,
    'package integrity: manifest files are missing');
  const paths = manifest.files.map((row, offset) => safeRelative(row.path,
    `package integrity file ${offset + 1}.path`));
  assert(sameJson(paths, [...paths].sort(cmp)) && new Set(paths).size === paths.length,
    'package integrity: manifest paths must be unique and sorted');
  assertExactInventory(listFiles(root, 'package integrity'),
    [...paths, 'package-manifest.json', 'SHA256SUMS'], 'package integrity');
  for (const [offset, row] of manifest.files.entries()) {
    const file = realFile(root, paths[offset], `package integrity file ${offset + 1}`);
    const stat = fs.statSync(file);
    assert(Number.isInteger(row.bytes) && row.bytes === stat.size
      && exactSha(row.sha256, `package integrity file ${offset + 1}.sha256`) === hashFile(file),
    `package integrity file ${offset + 1}: stale bytes/hash`);
  }
  const aggregate = sha256(manifest.files.map((row) =>
    `${row.path}\u0000${row.bytes}\u0000${row.sha256}\n`).join(''));
  assert(manifest.hash_contract?.file_aggregate_sha256 === aggregate,
    'package integrity: stale file aggregate');
  verifySha256Sums(root);
}
function verifyBlankTemplate(root, manifest, hybridManifestSha256, hybridAssetAggregateSha256) {
  const template = readJson(root, 'hybrid-review-template.json', 'hybrid review template');
  assert(template.schema === REVIEW_TEMPLATE_SCHEMA && template.status === 'BLANK_UNREVIEWED_TEMPLATE'
    && template.non_certifying === true, 'hybrid review template: wrong schema/status');
  assert(template.binding.source_commit === manifest.source_commit
    && template.binding.hybrid_manifest_sha256 === hybridManifestSha256
    && template.binding.hybrid_asset_aggregate_sha256 === hybridAssetAggregateSha256
    && template.binding.review_status_at_packaging === 'UNREVIEWED'
    && template.binding.visual_continuity_status_at_packaging === 'OPEN',
  'hybrid review template: stale evidence binding');
  assert(Array.isArray(template.lineages) && template.lineages.length === HYBRID_LINEAGES.length
    && Array.isArray(template.stages) && template.stages.length === HYBRID_LINEAGES.length * STAGES.length
    && Array.isArray(template.cache_controls) && template.cache_controls.length === 6
    && Array.isArray(template.mixed_kingdom_sentinels) && template.mixed_kingdom_sentinels.length === 16,
  'hybrid review template: stale row counts');
  assert(stableJson(template.verdict_contract) === stableJson({
    allowed_bands: ['PASS', 'POLISH', 'FAIL'], blank_band: '', reason_required: true,
    required_surface_flags_must_all_be_true_for_completion: true,
  }), 'hybrid review template: PASS/POLISH/FAIL + reason contract missing');
  for (const row of template.lineages) assert(row.band === '' && row.reason === '' && row.reviewer_notes === ''
    && row.review_complete === false && stableJson(row.required_surfaces_reviewed) === stableJson({
      five_stage_portraits: false, five_stage_cards: false, five_stage_silhouettes: false,
      lineage_sheet: false, join_atlas: false, low_anchor_stage: false,
    }), 'hybrid review template: lineage row is not blank or required surfaces are missing');
  for (const row of template.stages) assert(row.band === '' && row.reason === ''
    && row.reviewer_notes === '' && row.review_complete === false
    && stableJson(row.required_surfaces_reviewed) === stableJson({ portrait: false, card: false, silhouette: false }),
  'hybrid review template: stage row is not blank or required surfaces are missing');
  for (const row of template.cache_controls) assert(row.band === '' && row.reason === ''
    && row.reviewer_notes === '' && row.review_complete === false
    && stableJson(row.required_surfaces_reviewed) === stableJson({ ab_portrait: false, ba_portrait: false }),
  'hybrid review template: cache row is not blank or required surfaces are missing');
  for (const row of template.mixed_kingdom_sentinels) assert(row.band === '' && row.reason === ''
    && row.reviewer_notes === '' && row.review_complete === false
    && stableJson(row.required_surfaces_reviewed) === stableJson({ portrait: false }),
  'hybrid review template: mixed-sentinel row is not blank or required surfaces are missing');
  assert(template.overall.band === '' && template.overall.reason === '' && template.overall.reviewer === ''
    && template.overall.reviewed_at_utc === '' && template.overall.reviewer_notes === ''
    && template.overall.review_complete === false
    && stableJson(template.overall.required_surfaces_reviewed) === stableJson({
      all_lineages: false, cache_controls: false, mixed_kingdom_sentinels: false,
    }), 'hybrid review template: overall row is not blank or required surfaces are missing');
  return template;
}
function verifyPackagedTree(root, expectedTopName, options = {}) {
  const manifest = readJson(root, 'package-manifest.json', 'package manifest');
  assert(manifest.schema === PACKAGE_SCHEMA, 'package manifest: wrong schema');
  validatePackageManifestSchema(manifest);
  const readme = fs.readFileSync(realFile(root, 'README.md', 'package README'), 'utf8');
  validatePackageScope(manifest, readme);
  assert(manifest.top_level_directory === expectedTopName && COMMIT.test(manifest.source_commit),
    'package manifest: wrong top-level name/source commit');
  assert(isObject(manifest.freshness_at_packaging)
    && manifest.freshness_at_packaging.status === 'FRESH_FOR_CURRENT'
    && manifest.freshness_at_packaging.source_commit === manifest.source_commit
    && manifest.freshness_at_packaging.checkout_clean === true
    && manifest.freshness_at_packaging.checkout_status_sha256 === CLEAN_STATUS_SHA256
    && SHA.test(manifest.freshness_at_packaging.producer_sha256)
    && manifest.freshness_at_packaging.platinum_review_sha256 === PLATINUM_REVIEW.sha256
    && stableJson(validateBrowserRecord(manifest.freshness_at_packaging.browser_provenance,
      'package manifest packaging-time browser provenance'))
      === stableJson(validateBrowserRecord(manifest.input_bindings?.browser_provenance,
        'package manifest input browser provenance')),
  'package manifest: stale or incomplete packaging-time freshness binding');
  assert(isObject(manifest.counts) && manifest.counts.catalogue?.portraits === TOTAL
    && manifest.counts.layout?.families === LAYOUT_FAMILIES && manifest.counts.layout?.packets === LAYOUT_PACKETS
    && manifest.counts.layout?.sheets === LAYOUT_SHEETS && manifest.counts.hybrid?.assets === HYBRID_ASSETS,
  'package manifest: stale counts');
  assert(Array.isArray(manifest.files) && manifest.files.length > 0, 'package manifest: files missing');
  const sortedPaths = manifest.files.map((row) => row.path);
  assert(sameJson(sortedPaths, [...sortedPaths].sort(cmp)) && new Set(sortedPaths).size === sortedPaths.length,
    'package manifest: file paths must be unique and sorted');
  const actualFiles = listFiles(root, 'extracted package');
  assertExactInventory(actualFiles, [...sortedPaths, 'package-manifest.json', 'SHA256SUMS'], 'extracted package');
  for (const [offset, row] of manifest.files.entries()) {
    const where = `package manifest file ${offset + 1}`;
    const relative = safeRelative(row.path, `${where}.path`);
    const file = realFile(root, relative, where);
    const stat = fs.statSync(file);
    assert(row.bytes === stat.size && exactSha(row.sha256, `${where}.sha256`) === hashFile(file),
      `${where}: stale bytes/hash`);
  }
  const aggregate = sha256(manifest.files.map((row) => `${row.path}\u0000${row.bytes}\u0000${row.sha256}\n`).join(''));
  assert(manifest.hash_contract?.file_aggregate_sha256 === aggregate, 'package manifest: stale file aggregate');
  validatePhysicalPngCounts(manifest, manifest.files);
  verifySha256Sums(root);
  assert(manifest.input_bindings?.hybrid_review_template_sha256 === hashFile(path.join(root, 'hybrid-review-template.json')),
    'package manifest: stale hybrid review template hash');
  assert(manifest.input_bindings?.platinum_review_sha256 === PLATINUM_REVIEW.sha256,
    'package manifest: stale Platinum review binding');
  const packageBrowser = validateBrowserRecord(manifest.input_bindings?.browser_provenance,
    'package manifest browser provenance');
  const template = verifyBlankTemplate(root, manifest, manifest.input_bindings.hybrid_manifest_sha256,
    manifest.input_bindings.hybrid_asset_aggregate_sha256);
  if (options.deep !== false) {
    const catalogue = validateCatalogue(path.join(root, 'catalogue'),
      options.catalogueReferences ?? currentCatalogueReferences(), manifest.input_bindings.catalogue_output);
    assert(catalogue.commit === manifest.source_commit, 'extracted catalogue: source commit mismatch');
    assert(stableJson(catalogue.browser) === stableJson(packageBrowser),
      'extracted catalogue: browser provenance mismatch');
    const layout = validateLayout(path.join(root, 'layout'), catalogue);
    const hybrid = validateHybrid(path.join(root, 'hybrid'), catalogue.commit, catalogue.browser);
    assert(stableJson(manifest.counts) === stableJson({
      catalogue: { portraits: TOTAL, sets: SETS, capture_packets: CATALOGUE_PACKETS },
      layout: { families: LAYOUT_FAMILIES, packets: LAYOUT_PACKETS, sheets: LAYOUT_SHEETS },
      hybrid: { lineages: HYBRID_LINEAGES.length, stages_per_lineage: 5, assets: HYBRID_ASSETS,
        machine_anchor_visual_status: hybrid.machineStatus, visual_continuity_status: 'OPEN' },
      physical_pngs: PHYSICAL_PNG_COUNTS,
    }), 'package manifest: exact package counts/status projection differs from validated inputs');
    assert(manifest.input_bindings.catalogue_preparation_sha256 === catalogue.preparationSha256
      && manifest.input_bindings.catalogue_identity_manifest_sha256 === catalogue.identityManifestSha256
      && manifest.input_bindings.catalogue_portrait_manifest_sha256 === catalogue.portraitManifestSha256
      && manifest.input_bindings.layout_plan_sha256 === layout.planSha256
      && manifest.input_bindings.layout_packet_manifest_sha256 === layout.packetManifestSha256
      && manifest.input_bindings.layout_catalogue_sha256 === layout.catalogueDigest
      && manifest.input_bindings.hybrid_manifest_sha256 === hybrid.manifestSha256
      && manifest.input_bindings.hybrid_asset_aggregate_sha256 === hybrid.assetAggregateSha256
      && manifest.input_bindings.platinum_review_sha256 === PLATINUM_REVIEW.sha256,
    'package manifest: extracted input bindings are stale');
    assert(stableJson(template) === stableJson(buildHybridReviewTemplate(hybrid, catalogue.commit)),
      'hybrid review template: hash-bound evidence rows are stale');
    assert(readme === buildReadme({ catalogue, layout, hybrid }, `${expectedTopName}.zip`),
      'package README: exact generated UNREVIEWED / NOT CERTIFIED content changed or carries verdict material');
  }
  return manifest;
}
function zipDirectory(stageParent, topName, output) {
  const top = path.join(stageParent, topName);
  if (process.platform === 'win32') {
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      '& { param($Source,$Destination) Compress-Archive -LiteralPath $Source -DestinationPath $Destination -CompressionLevel Optimal }',
      top, output], { cwd: stageParent, stdio: ['ignore', 'pipe', 'pipe'] });
  } else {
    assert(fs.existsSync('/usr/bin/zip'), 'required archive tool is missing: /usr/bin/zip');
    execFileSync('/usr/bin/zip', ['-X', '-q', '-r', output, topName],
      { cwd: stageParent, stdio: ['ignore', 'pipe', 'pipe'] });
  }
}
function extractZip(zip, destination) {
  if (process.platform === 'win32') {
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      '& { param($Archive,$Destination) Expand-Archive -LiteralPath $Archive -DestinationPath $Destination }',
      zip, destination], { stdio: ['ignore', 'pipe', 'pipe'] });
  } else {
    assert(fs.existsSync('/usr/bin/unzip'), 'required archive tool is missing: /usr/bin/unzip');
    execFileSync('/usr/bin/unzip', ['-q', zip, '-d', destination], { stdio: ['ignore', 'pipe', 'pipe'] });
  }
}
function assertZipHasNoComments(zip, where = 'ZIP') {
  const bytes = fs.readFileSync(zip);
  const minimumEocd = 22;
  assert(bytes.length >= minimumEocd, `${where}: archive is too short`);
  const earliest = Math.max(0, bytes.length - 0xffff - minimumEocd);
  let eocd = -1;
  for (let offset = bytes.length - minimumEocd; offset >= earliest; offset--) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
  }
  assert(eocd >= 0, `${where}: end-of-central-directory record is missing`);
  const disk = bytes.readUInt16LE(eocd + 4), centralDisk = bytes.readUInt16LE(eocd + 6);
  const diskEntries = bytes.readUInt16LE(eocd + 8), totalEntries = bytes.readUInt16LE(eocd + 10);
  const centralSize = bytes.readUInt32LE(eocd + 12), centralOffset = bytes.readUInt32LE(eocd + 16);
  const archiveCommentLength = bytes.readUInt16LE(eocd + 20);
  assert(disk === 0 && centralDisk === 0 && diskEntries === totalEntries,
    `${where}: split/multi-disk archives are forbidden`);
  assert(archiveCommentLength === 0 && eocd + minimumEocd === bytes.length,
    `${where}: archive comments or trailing metadata are forbidden`);
  assert(centralOffset + centralSize === eocd, `${where}: central directory bounds are invalid`);
  let cursor = centralOffset;
  const entries = [];
  for (let index = 0; index < totalEntries; index++) {
    assert(cursor + 46 <= eocd && bytes.readUInt32LE(cursor) === 0x02014b50,
      `${where}: central-directory entry ${index + 1} is malformed`);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const localOffset = bytes.readUInt32LE(cursor + 42);
    const flags = bytes.readUInt16LE(cursor + 8);
    const method = bytes.readUInt16LE(cursor + 10);
    const crc32 = bytes.readUInt32LE(cursor + 16);
    const compressedSize = bytes.readUInt32LE(cursor + 20);
    const uncompressedSize = bytes.readUInt32LE(cursor + 24);
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    assert(extraLength === 0, `${where}: central extra metadata is forbidden at row ${index + 1}`);
    assert(commentLength === 0, `${where}: entry comments are forbidden at central row ${index + 1}`);
    assert(localOffset + 30 <= centralOffset && bytes.readUInt32LE(localOffset) === 0x04034b50,
      `${where}: local entry ${index + 1} is malformed`);
    assert(bytes.readUInt16LE(localOffset + 28) === 0,
      `${where}: local extra metadata is forbidden at row ${index + 1}`);
    entries.push({ index, localOffset, flags, method, crc32, compressedSize, uncompressedSize, name });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  assert(cursor === eocd, `${where}: central-directory inventory is inconsistent`);
  entries.sort((left, right) => left.localOffset - right.localOffset);
  assert(entries.length === 0 || entries[0].localOffset === 0,
    `${where}: executable prefixes or leading metadata are forbidden`);
  for (let offset = 0; offset < entries.length; offset++) {
    const row = entries[offset];
    const local = row.localOffset;
    const localFlags = bytes.readUInt16LE(local + 6);
    const localMethod = bytes.readUInt16LE(local + 8);
    const localCrc32 = bytes.readUInt32LE(local + 14);
    const localCompressedSize = bytes.readUInt32LE(local + 18);
    const localUncompressedSize = bytes.readUInt32LE(local + 22);
    const localNameLength = bytes.readUInt16LE(local + 26);
    const localExtraLength = bytes.readUInt16LE(local + 28);
    const localName = bytes.subarray(local + 30, local + 30 + localNameLength);
    assert(localFlags === row.flags && localMethod === row.method && localExtraLength === 0
      && localName.equals(row.name), `${where}: local/central entry ${row.index + 1} differs`);
    const dataEnd = local + 30 + localNameLength + row.compressedSize;
    const nextOffset = offset + 1 < entries.length ? entries[offset + 1].localOffset : centralOffset;
    assert(dataEnd <= nextOffset, `${where}: local entry ${row.index + 1} overlaps the next record`);
    if ((row.flags & 0x0008) === 0) {
      assert(localCrc32 === row.crc32 && localCompressedSize === row.compressedSize
        && localUncompressedSize === row.uncompressedSize && dataEnd === nextOffset,
      `${where}: local entry ${row.index + 1} has inconsistent sizes or hidden trailing metadata`);
    } else {
      const descriptorLength = nextOffset - dataEnd;
      assert(descriptorLength === 12 || descriptorLength === 16,
        `${where}: data descriptor ${row.index + 1} has hidden or unsupported metadata`);
      const descriptor = descriptorLength === 16 ? dataEnd + 4 : dataEnd;
      if (descriptorLength === 16) assert(bytes.readUInt32LE(dataEnd) === 0x08074b50,
        `${where}: data descriptor ${row.index + 1} has an invalid signature`);
      assert(bytes.readUInt32LE(descriptor) === row.crc32
        && bytes.readUInt32LE(descriptor + 4) === row.compressedSize
        && bytes.readUInt32LE(descriptor + 8) === row.uncompressedSize,
      `${where}: data descriptor ${row.index + 1} differs from the central record`);
    }
  }
}
function safeRemoveOwnedDirectory(directory, parent, prefix) {
  if (!directory || !fs.existsSync(directory)) return;
  const resolved = path.resolve(directory);
  const stat = fs.lstatSync(resolved);
  assert(path.dirname(resolved) === path.resolve(parent) && path.basename(resolved).startsWith(prefix)
    && stat.isDirectory() && !stat.isSymbolicLink(), `refusing unsafe temporary cleanup: ${portable(resolved)}`);
  fs.rmSync(resolved, { recursive: true, force: true });
}
function verifyArchive(output, topName, parent, options = {}) {
  assertZipHasNoComments(output, 'review archive');
  const extraction = fs.mkdtempSync(path.join(parent, '.current-review-extract-'));
  try {
    extractZip(output, extraction);
    const topEntries = fs.readdirSync(extraction, { withFileTypes: true });
    assert(topEntries.length === 1 && topEntries[0].name === topName && topEntries[0].isDirectory()
      && !topEntries[0].isSymbolicLink(), 'archive must contain exactly one expected top-level directory');
    const root = realDirectory(path.join(extraction, topName), 'extracted top-level directory');
    return verifyPackagedTree(root, topName, options);
  } finally { safeRemoveOwnedDirectory(extraction, parent, '.current-review-extract-'); }
}
function verifyCurrentFreshness(value, injectedLiveState = undefined, injectedCatalogueReferences = undefined) {
  const target = path.resolve(value);
  const stat = fs.lstatSync(target);
  assert(!stat.isSymbolicLink(), 'freshness target must not be a symbolic link');
  const readLiveState = typeof injectedLiveState === 'function'
    ? injectedLiveState
    : () => injectedLiveState ?? liveRepositoryState();
  const verifyRoot = (root, topName) => {
    const candidateManifest = readJson(root, 'package-manifest.json', 'freshness package manifest');
    verifySha256Sums(root);
    if (candidateManifest.schema !== PACKAGE_SCHEMA) {
      if (typeof candidateManifest.schema === 'string'
        && /^cf\.current-review\.package\.v\d+$/.test(candidateManifest.schema)) fail(
        `STALE_FOR_CURRENT: package schema/producer differs (package ${candidateManifest.schema}; current ${PACKAGE_SCHEMA})`);
      fail(`freshness package manifest: unrecognized schema ${String(candidateManifest.schema)}`);
    }
    verifySealedPackageIntegrity(root, candidateManifest);
    const expectedCurrentBinding = {
      source_commit: candidateManifest.source_commit,
      producer_sha256: candidateManifest.freshness_at_packaging?.producer_sha256,
      platinum_review_sha256: candidateManifest.freshness_at_packaging?.platinum_review_sha256,
      browser_provenance: candidateManifest.freshness_at_packaging?.browser_provenance,
    };
    const freshnessBeforeVerify = validateCurrentBinding(expectedCurrentBinding, readLiveState());
    const manifest = verifyPackagedTree(root, topName, { catalogueReferences: injectedCatalogueReferences });
    verifySha256Sums(root);
    const freshnessAfterVerify = validateCurrentBinding(expectedCurrentBinding, readLiveState());
    assert(stableJson(freshnessAfterVerify) === stableJson(freshnessBeforeVerify),
      'STALE_FOR_CURRENT: checkout binding changed during package verification');
    return { manifest, freshness: freshnessAfterVerify, expectedCurrentBinding };
  };
  if (stat.isDirectory()) {
    const root = realDirectory(target, 'freshness package root');
    const { expectedCurrentBinding: _expected, ...verified } = verifyRoot(root, path.basename(root));
    return verified;
  }
  assert(stat.isFile() && path.extname(target).toLowerCase() === '.zip',
    '--freshness must name an extracted package root or .zip');
  const sidecar = realFile(path.dirname(target), path.basename(target) + '.sha256', 'freshness ZIP sidecar');
  assertZipHasNoComments(target, 'freshness ZIP');
  const zipSha256 = hashFile(target);
  assert(fs.readFileSync(sidecar, 'utf8') === `${zipSha256}  ${path.basename(target)}\n`,
    'freshness ZIP sidecar does not bind the complete archive');
  const tempParent = fs.realpathSync(os.tmpdir());
  const extraction = fs.mkdtempSync(path.join(tempParent, 'cf-current-review-freshness-'));
  try {
    extractZip(target, extraction);
    const entries = fs.readdirSync(extraction, { withFileTypes: true });
    assert(entries.length === 1 && entries[0].isDirectory() && !entries[0].isSymbolicLink(),
      'freshness ZIP must contain exactly one real top-level directory');
    const root = realDirectory(path.join(extraction, entries[0].name), 'freshness extracted package root');
    const verified = verifyRoot(root, entries[0].name);
    const finalZipSha256 = hashFile(target);
    assert(finalZipSha256 === zipSha256, 'freshness ZIP changed during deep verification');
    assertZipHasNoComments(target, 'freshness ZIP final verification');
    assert(fs.readFileSync(sidecar, 'utf8') === `${finalZipSha256}  ${path.basename(target)}\n`,
      'freshness ZIP sidecar changed during deep verification');
    const finalFreshness = validateCurrentBinding(verified.expectedCurrentBinding, readLiveState());
    assert(stableJson(finalFreshness) === stableJson(verified.freshness),
      'STALE_FOR_CURRENT: checkout binding changed before freshness result publication');
    return { manifest: verified.manifest, freshness: finalFreshness, zip_sha256: finalZipSha256 };
  } finally { safeRemoveOwnedDirectory(extraction, tempParent, 'cf-current-review-freshness-'); }
}
function buildPackage(options, injectedLiveState = undefined, injectedCatalogueReferences = undefined) {
  const catalogueReferences = injectedCatalogueReferences ?? currentCatalogueReferences();
  const inputs = validateInputs(options.catalogue, options.layout, options.hybrid, catalogueReferences);
  const expectedCurrentBinding = {
    source_commit: inputs.catalogue.commit,
    producer_sha256: hashFile(PRODUCER_FILE),
    platinum_review_sha256: PLATINUM_REVIEW.sha256,
    browser_provenance: inputs.catalogue.browser,
  };
  const readLiveState = typeof injectedLiveState === 'function'
    ? injectedLiveState
    : () => injectedLiveState ?? liveRepositoryState();
  const freshnessAtPackaging = validateCurrentBinding(expectedCurrentBinding, readLiveState());
  const target = validateOutput(options.output, [inputs.catalogue.root, inputs.layout.root, inputs.hybrid.root]);
  const stageParent = fs.realpathSync(os.tmpdir());
  const stage = fs.mkdtempSync(path.join(stageParent, 'cf-current-review-stage-'));
  const stagedZip = path.join(stage, '.current-review-package.zip');
  let createdZip = false, createdSidecar = false;
  try {
    const packageRoot = path.join(stage, target.topName);
    fs.mkdirSync(packageRoot, { recursive: false });
    copyExactTree(inputs.catalogue.root, inputs.catalogue.files, path.join(packageRoot, 'catalogue'));
    copyExactTree(inputs.layout.root, inputs.layout.files, path.join(packageRoot, 'layout'));
    copyExactTree(inputs.hybrid.root, inputs.hybrid.files, path.join(packageRoot, 'hybrid'));
    const template = buildHybridReviewTemplate(inputs.hybrid, inputs.catalogue.commit);
    writeJsonExclusive(path.join(packageRoot, 'hybrid-review-template.json'), template);
    writeExclusive(path.join(packageRoot, 'README.md'), buildReadme(inputs, path.basename(target.output)));
    const records = fileRecords(packageRoot, new Set(['package-manifest.json']));
    const manifest = buildPackageManifest(inputs, target.topName, records,
      hashFile(path.join(packageRoot, 'hybrid-review-template.json')), freshnessAtPackaging);
    writeJsonExclusive(path.join(packageRoot, 'package-manifest.json'), manifest);
    writeSha256Sums(packageRoot);
    verifyPackagedTree(packageRoot, target.topName, { catalogueReferences });
    zipDirectory(stage, target.topName, stagedZip);
    verifyArchive(stagedZip, target.topName, stageParent, { catalogueReferences });
    const freshnessBeforePublish = validateCurrentBinding(expectedCurrentBinding, readLiveState());
    assert(stableJson(freshnessBeforePublish) === stableJson(freshnessAtPackaging),
      'STALE_FOR_CURRENT: packaging-time binding changed before publication');
    assert(!fs.existsSync(target.output), 'output appeared during staging');
    fs.copyFileSync(stagedZip, target.output, fs.constants.COPYFILE_EXCL); createdZip = true;
    assert(hashFile(stagedZip) === hashFile(target.output), 'staged/final ZIP copy verification failed');
    const zipHash = hashFile(target.output);
    writeExclusive(target.sidecar, `${zipHash}  ${path.basename(target.output)}\n`); createdSidecar = true;
    assert(fs.readFileSync(target.sidecar, 'utf8') === `${zipHash}  ${path.basename(target.output)}\n`,
      'ZIP SHA-256 sidecar verification failed');
    assert(hashFile(target.output) === zipHash, 'final ZIP changed while its SHA-256 sidecar was written');
    const freshnessAfterPublish = validateCurrentBinding(expectedCurrentBinding, readLiveState());
    assert(stableJson(freshnessAfterPublish) === stableJson(freshnessAtPackaging),
      'STALE_FOR_CURRENT: packaging-time binding changed during final publication');
    return { output: target.output, sidecar: target.sidecar, sha256: zipHash,
      bytes: fs.statSync(target.output).size, sourceCommit: inputs.catalogue.commit };
  } catch (error) {
    if (createdSidecar && fs.existsSync(target.sidecar)) fs.unlinkSync(target.sidecar);
    if (createdZip && fs.existsSync(target.output)) fs.unlinkSync(target.output);
    throw error;
  } finally { safeRemoveOwnedDirectory(stage, stageParent, 'cf-current-review-stage-'); }
}

function fakePng(width, height, tag) {
  const buffer = Buffer.alloc(24 + Buffer.byteLength(tag));
  Buffer.from('89504e470d0a1a0a', 'hex').copy(buffer, 0);
  buffer.writeUInt32BE(width, 16); buffer.writeUInt32BE(height, 20);
  buffer.write(tag, 24); return buffer;
}
function mkdirWrite(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); }
function fixtureCapture(commit) {
  return { schema: CAPTURE_SCHEMA, repository_root: '.', source_commit: commit,
    capture_scope: 'entire_repository_including_untracked', worktree_clean_before: true,
    worktree_clean_after: true, status_porcelain_sha256: CLEAN_STATUS_SHA256 };
}
function fixtureIdentities(root, commit) {
  const capture = fixtureCapture(commit); const identities = []; const files = []; const references = new Map();
  for (const [set, count] of Object.entries(SETS)) for (let index = 1; index <= count; index++) {
    const species = `${set} species ${String(index).padStart(3, '0')}`;
    const image = `${set}/${String(index).padStart(3, '0')}.png`;
    const buffer = fakePng(440, 440, `${set}-${index}`);
    mkdirWrite(path.join(root, 'portraits', ...image.split('/')), buffer);
    const hash = sha256(buffer);
    identities.push({ set, species, render_name: species, image_file: image, sha256: hash });
    files.push({ set, file: image, sha256: hash, bytes: buffer.length, width: 440, height: 440 });
    if (set !== 'procedural') references.set(`${set}\u0000${species}`,
      { name: species, mustRead: ['fixture anatomical criterion'] });
  }
  const packets = Array.from({ length: CATALOGUE_PACKETS }, (_, index) => ({
    packet_id: String(index + 1).padStart(3, '0'), family: `Fixture family ${index + 1}`, species: [],
  }));
  identities.forEach((row, index) => packets[index % packets.length].species.push(row));
  const indexRows = [];
  for (const packet of packets) {
    const directory = path.join(root, 'packets', `packet-${packet.packet_id}`);
    const strip = fakePng(100, 50, `strip-${packet.packet_id}`); mkdirWrite(path.join(directory, 'strip.png'), strip);
    const stripPath = `packets/packet-${packet.packet_id}/strip.png`; const stripHash = sha256(strip);
    const species = packet.species.map((row) => ({ set: row.set, name: row.species,
      image_file: row.image_file, sha256: row.sha256 }));
    indexRows.push({ packet_id: packet.packet_id, family: packet.family, strip: stripPath,
      packet: `packets/packet-${packet.packet_id}/packet.md`,
      packet_json: `packets/packet-${packet.packet_id}/packet.json`, strip_sha256: stripHash, species });
    const packetJson = { schema: PACKET_SCHEMA,
      packet_id: packet.packet_id, family: packet.family, review_date: '2026-08-10',
      source_ruler: 'GP7 fresh strict rejudge', strip: stripPath, strip_sha256: stripHash,
      species: packet.species.map((row) => ({ set: row.set, name: row.species, render_name: row.render_name,
        image_file: row.image_file, sha256: row.sha256 })) };
    mkdirWrite(path.join(directory, 'packet.json'), JSON.stringify(packetJson, null, 2) + '\n');
    const packetMarkdown = [
      `# GP7.1 FRESH STRICT REJUDGE — packet ${packet.packet_id}`, '',
      `Family partition: ${packet.family}`,
      'Review date required in every row: 2026-08-10',
      'Source ruler required in every row: GP7 fresh strict rejudge', '',
      'This packet contains freshly rendered current pixels. Historical GP7 bands,',
      'reasons, and carried status are intentionally excluded. Judge each row strictly',
      'against the current visual and its supplied reference. A missing must-read is FAIL.',
      'Do not infer PASS from a prior score or from the current tool finishing cleanly.', '',
      `strip: ${stripPath}`, `strip_sha256: ${stripHash}`, '',
      `Verdict file: \`verdicts/packet-${packet.packet_id}.json\``, '',
    ];
    packetJson.species.forEach((row, offset) => packetMarkdown.push(
      `## ${offset + 1}. ${row.name} [${row.set}]`, `portrait_sha256: ${row.sha256}`,
      row.set === 'procedural'
        ? 'reference: procedural/unlisted — judge coherent, distinct body plan and readable structure.'
        : 'mustRead: fixture anatomical criterion', '',
    ));
    mkdirWrite(path.join(directory, 'packet.md'), packetMarkdown.join('\n') + '\n');
  }
  const frozenPartition = indexRows.map((packet) => ({ id: packet.packet_id, family: packet.family,
    species: packet.species.map((row) => ({ set: row.set, name: row.name })) }));
  references.expectedPartition = frozenPartition;
  const preparation = { schema: PREPARATION_SCHEMA, review_date: '2026-08-10',
    source_ruler: 'GP7 fresh strict rejudge', output: path.basename(root),
    current_source_identity_sha256: sha256(JSON.stringify(identities)),
    frozen_partition_sha256: sha256(JSON.stringify(frozenPartition)),
    packets: CATALOGUE_PACKETS, portraits: TOTAL,
    note: 'Prepared from one current audit render. No verdicts, results, or ledger are generated by --prepare.',
    browser: FIXTURE_BROWSER, capture_provenance: capture };
  mkdirWrite(path.join(root, 'preparation.json'), JSON.stringify(preparation, null, 2) + '\n');
  mkdirWrite(path.join(root, 'identity-manifest.json'), JSON.stringify({ schema: IDENTITY_SCHEMA,
    capture_provenance: capture, rows: identities }, null, 2) + '\n');
  mkdirWrite(path.join(root, 'review-info', 'manifest.json'), JSON.stringify({ schema: PORTRAIT_SCHEMA,
    generated_for: 'GP7.1 fresh strict rejudge', capture_provenance: capture, portraits: TOTAL,
    dimensions: '440x440 native PNG', sets: SETS, files }, null, 2) + '\n');
  mkdirWrite(path.join(root, 'index.json'), JSON.stringify(indexRows, null, 2) + '\n');
  mkdirWrite(path.join(root, 'strict-verdict-schema.json'), JSON.stringify(expectedStrictVerdictSchema(), null, 2) + '\n');
  mkdirWrite(path.join(root, 'README.md'), expectedCatalogueReadme(preparation, FIXTURE_BROWSER));
  return { identities, files, references };
}
function fixtureLayout(root, catalogueRoot, catalogueRows, commit) {
  const identityManifestSha256 = hashFile(path.join(catalogueRoot, 'identity-manifest.json'));
  const portraitManifestSha256 = hashFile(path.join(catalogueRoot, 'review-info', 'manifest.json'));
  const manifestByFile = new Map(catalogueRows.files.map((row) => [row.file, row]));
  const rows = catalogueRows.identities.map((row) => ({ ...row, ...manifestByFile.get(row.image_file) }));
  const familyCounts = { 'earth-fauna': 91, 'earth-flora': 48, 'earth-fungi': 5, 'earth-microbe': 3, procedural: 34 };
  const groups = [];
  for (const set of Object.keys(SETS)) {
    const setRows = rows.filter((row) => row.set === set);
    const count = familyCounts[set];
    for (let familyIndex = 0; familyIndex < count; familyIndex++) groups.push({ set,
      family: `${set} fixture family ${String(familyIndex + 1).padStart(3, '0')}`, rows: [] });
    const setGroups = groups.slice(groups.length - count);
    setRows.forEach((row, index) => setGroups[index % count].rows.push(row));
  }
  let ordinal = 0; let packetNumber = 0; const packets = [];
  for (const [groupIndex, group] of groups.entries()) {
    const parts = groupIndex < 52 ? [group.rows.slice(0, Math.ceil(group.rows.length / 2)),
      group.rows.slice(Math.ceil(group.rows.length / 2))] : [group.rows];
    for (const [partIndex, partRows] of parts.entries()) {
      packetNumber++;
      packets.push({ packet_id: String(packetNumber).padStart(3, '0'), set: group.set, family: group.family,
        family_part: partIndex + 1, family_parts: parts.length,
        rows: partRows.map((row) => {
          const sourceSha = sha256(`source-${row.set}`);
          const contractPayload = { set: row.set, species: row.species, source: 'selftest reference',
            source_sha256: sourceSha, must_read: ['fixture anatomical criterion'], note: '' };
          const result = { ordinal: ++ordinal, set: row.set, species: row.species, render_name: row.render_name,
            family: group.family, family_source: 'selftest exact family', image_file: row.image_file,
            sha256: row.sha256, bytes: row.bytes, width: 440, height: 440,
            must_read_contract: { ...contractPayload, sha256: sha256(stableJson(contractPayload)) } };
          if (row.set === 'procedural') {
            const planPayload = { seed: ordinal, kingdom: 'fixture', heat: ordinal % 3, sample: ordinal,
              route_kind: 'fixture', plan_family: 'fixture plan', base_plan_family: 'fixture plan',
              plan_detail: { kind: 'fixture' }, genome: { seed: ordinal } };
            result.procedural_plan = { ...planPayload, plan_sha256: sha256(stableJson(planPayload)) };
          }
          return result;
        }) });
    }
  }
  assert(groups.length === LAYOUT_FAMILIES && packets.length === LAYOUT_PACKETS, 'selftest layout allocation failed');
  const digest = sha256(packets.flatMap((packet) => packet.rows).map((row) =>
    `${row.ordinal}\u0000${row.set}\u0000${row.species}\u0000${row.family}\u0000${row.image_file}\u0000${row.sha256}\u0000${row.procedural_plan?.plan_sha256 ?? ''}\u0000${row.must_read_contract.sha256}\n`).join(''));
  const revision = { repository_root: '../..', commit, worktree_clean_for_capture: true,
    capture_scope: ['.'], changed_paths: [] };
  const evidenceDigest = sha256(rows.slice().sort((a, b) => cmp(`${a.set}\u0000${a.species}`, `${b.set}\u0000${b.species}`))
    .map((row) => `${row.set}\u0000${row.species}\u0000${row.image_file}\u0000${row.sha256}\u0000${row.bytes}\n`).join(''));
  const sources = { identity_manifest: { file: 'fixture/identity-manifest.json', sha256: identityManifestSha256 },
    portrait_manifest: { file: 'fixture/review-info/manifest.json', sha256: portraitManifestSha256 },
    evidence_identity_digest: evidenceDigest, source_revision: revision };
  const plan = { schema: PLAN_SCHEMA, purpose: 'Fresh full catalogue fixture; no verdict.',
    identity_key: ['set', 'species'], total_identities: TOTAL, sets: SETS, families: LAYOUT_FAMILIES,
    packet_size: 10, packets: LAYOUT_PACKETS, packet_images_requested: true,
    catalogue_sha256: digest, source_revision: revision, sources,
    procedural_plan_families: 1, family_rules: {}, reviewed_aliases: [], reviewed_family_overrides: [] };
  const index = { schema: INDEX_SCHEMA, identity_key: ['set', 'species'], total_identities: TOTAL,
    sets: SETS, families: LAYOUT_FAMILIES, packet_size: 10, packet_count: LAYOUT_PACKETS,
    catalogue_sha256: digest, source_revision: revision, packets };
  const proceduralIdentities = packets.flatMap((packet) => packet.rows.map((row) => ({ packet, row })))
    .filter(({ row }) => row.set === 'procedural').map(({ packet, row }) => ({ set: row.set, species: row.species,
      packet_id: packet.packet_id, ordinal: row.ordinal, sha256: row.sha256,
      procedural_plan_sha256: row.procedural_plan.plan_sha256,
      must_read_contract_sha256: row.must_read_contract.sha256 }));
  const proceduralIndex = { schema: PROCEDURAL_INDEX_SCHEMA, identity_key: ['set', 'species'],
    catalogue_sha256: digest, total_identities: SETS.procedural, plan_family_count: 1,
    grouping_axis: 'live production plan_family (independent of the primary kingdom + heat packet axis)',
    source_revision: revision, families: [{ plan_family: 'fixture plan', count: proceduralIdentities.length,
      identities: proceduralIdentities }] };
  const sheetFiles = [];
  for (const packet of packets) for (const variant of ['labelled', 'unlabelled']) {
    const relative = `packets/${variant}/${packet.packet_id}-fixture.png`;
    const buffer = fakePng(640, 480, `${packet.packet_id}-${variant}`); mkdirWrite(path.join(root, relative), buffer);
    sheetFiles.push({ packet_id: packet.packet_id, variant, file: relative, sha256: sha256(buffer),
      bytes: buffer.length, width: 640, height: 480,
      source_rows_sha256: sha256(packet.rows.map((row) => `${row.set}\u0000${row.species}\u0000${row.sha256}\n`).join('')) });
  }
  mkdirWrite(path.join(root, 'plan.json'), JSON.stringify(plan, null, 2) + '\n');
  mkdirWrite(path.join(root, 'index.json'), JSON.stringify(index, null, 2) + '\n');
  mkdirWrite(path.join(root, 'procedural-plan-index.json'), JSON.stringify(proceduralIndex, null, 2) + '\n');
  mkdirWrite(path.join(root, 'packet-manifest.json'), JSON.stringify({ schema: PACKET_MANIFEST_SCHEMA,
    browser: FIXTURE_BROWSER, catalogue_sha256: digest, packet_count: LAYOUT_PACKETS,
    sheets: LAYOUT_SHEETS, files: sheetFiles }, null, 2) + '\n');
}
function fixtureHybrid(root, commit) {
  const assets = [];
  const add = (relative, kind, identity, width, height) => {
    const buffer = fakePng(width, height, `${kind}-${identity}`); mkdirWrite(path.join(root, relative), buffer);
    const row = { path: relative, kind, identity, width, height, bytes: buffer.length, sha256: sha256(buffer) };
    assets.push(row); return row;
  };
  const lineages = [];
  for (const [lineageOffset, lineageSpec] of HYBRID_LINEAGES.entries()) {
    const lineageIndex = lineageOffset + 1;
    const id = lineageSpec.id; const stages = [];
    const kingdom = lineageSpec.set.slice('earth-'.length);
    const inputGenomes = [
      { seed: lineageIndex * 100, kingdom, heat: 1, _earthName: lineageSpec.species },
      { seed: lineageIndex * 100 + 50, kingdom, heat: 1, _earthName: lineageSpec.species },
      { seed: lineageIndex * 100 + 61, kingdom: 'fixture-alien-1', heat: 0 },
      { seed: lineageIndex * 100 + 62, kingdom: 'fixture-alien-2', heat: 1 },
      { seed: lineageIndex * 100 + 63, kingdom: 'fixture-alien-3', heat: 2 },
    ];
    const inputIds = ['pure', 'earth-mate', 'alien-1', 'alien-2', 'alien-3'];
    const inputs = inputGenomes.map((genome, inputIndex) => {
      const id = inputIds[inputIndex];
      const derivation = id === 'pure'
        ? { kind: 'catalogue-makeGenome', formula: 'hashInt(0xEA47,catalogueIndex,kingdomIndex)',
          kingdom_index: lineageOffset % 4, catalogue_index: lineageOffset, heat: 1, seed: genome.seed,
          exact_name_matches: 1 }
        : id === 'earth-mate'
          ? { kind: 'named-earth-makeGenome', formula: 'hashInt(0xEA7E,row,catalogueIndex)',
            row: lineageOffset, catalogue_index: lineageOffset, heat: 1, seed: genome.seed }
          : { kind: 'alien-seed-search',
            formula: 'hashInt(0xA11E57,row*10000+slot*1000+attempt,0x4D)',
            row: lineageOffset, slot: inputIndex - 1, attempt: inputIndex, heat: genome.heat,
            seed: genome.seed, predicate: 'fixture' };
      return { id, genome, genome_sha256: sha256(stableJson(genome)), derivation };
    });
    for (let stageIndex = 0; stageIndex < STAGES.length; stageIndex++) {
      const stageId = STAGES[stageIndex]; const base = `${String(stageIndex + 1).padStart(2, '0')}-${stageId}.png`;
      const portrait = add(`portraits/${id}/${base}`, 'portrait', `${id}|${stageId}`, 440, 440);
      const card = add(`cards/${id}/${base}`, 'card', `${id}|${stageId}`, 332, 332);
      const silhouette = add(`silhouettes/${id}/${base}`, 'silhouette', `${id}|${stageId}`, 440, 440);
      const parents = stageIndex === 1 ? [inputGenomes[0].seed, inputGenomes[1].seed]
        : stageIndex === 2 ? [inputGenomes[0].seed, inputGenomes[2].seed]
          : stageIndex === 3 ? [stages[2].genome.seed, inputGenomes[3].seed]
            : stageIndex === 4 ? [stages[3].genome.seed, inputGenomes[4].seed] : null;
      const genome = stageIndex === 0 ? structuredClone(inputGenomes[0])
        : { seed: lineageIndex * 100 + stageIndex, kingdom, _earthBlend: lineageSpec.species,
          _earthBlendKingdom: kingdom,
          _anchorVal: stageIndex === 3 ? 0.45999999999999996 : ANCHORS[stageIndex],
          parents, _src: { color: 0, head: 1 } };
      stages.push({ lineage_id: id, identity: `${id}|${stageId}`, stage_id: stageId, stage_index: stageIndex,
        anchor: ANCHORS[stageIndex], genome, genome_sha256: sha256(stableJson(genome)),
        route: stageIndex === 0 ? 'named-owned' : expectedHybridLineageRoute(lineageSpec.set, lineageSpec.species),
        owned: (stageIndex === 0 ? 'named-owned'
          : expectedHybridLineageRoute(lineageSpec.set, lineageSpec.species)).endsWith('-owned'),
        stripped_lineage_control: stageIndex === 0 ? null : {
          differs_from_lineage: true, route: 'procedural-owned', portrait_sha256: sha256(`control-${id}-${stageId}`),
        },
        production_matches_fresh: true, repeated_render_stable: true,
        portrait_path: portrait.path, portrait_sha256: portrait.sha256, card_path: card.path,
        silhouette_path: silhouette.path });
    }
    const sheet = add(`lineage-sheets/${String(lineageIndex).padStart(2, '0')}-${id}.png`,
      'lineage-sheet', id, 2200, 1180);
    const atlas = add(`join-atlases/${String(lineageIndex).padStart(2, '0')}-${id}.png`,
      'join-atlas', id, 1290, 1048);
    lineages.push({ ordinal: lineageIndex, lineage_id: id, species: lineageSpec.species, set: lineageSpec.set,
      challenge: lineageSpec.challenge,
      crop_contract: { source_pixels: 55, output_pixels: 220, scale: 4,
        coordinates: lineageSpec.crops.map(([x, y, w, h]) => ({ x, y, w, h })) },
      visual_review_status: 'UNREVIEWED', inputs, crosses: [
        { stage_id: 'earth-earth', parent_a: 'pure', parent_b: 'earth-mate' },
        { stage_id: 'earth-alien', parent_a: 'pure', parent_b: 'alien-1' },
        { stage_id: 'next-alien', parent_a: 'earth-alien', parent_b: 'alien-2' },
        { stage_id: 'floor', parent_a: 'next-alien', parent_b: 'alien-3' },
      ], stages, pixel_identity_groups: [],
      stage_pixel_unique_count: 5, anchor_visual_differentiation: 'OPEN_UNREVIEWED',
      lineage_sheet: sheet.path, join_atlas: atlas.path });
  }
  const cacheControls = [];
  for (let index = 1; index <= 6; index++) {
    const lineageId = HYBRID_CACHE_IDS[index - 1];
    const lineageSpec = HYBRID_LINEAGES.find((row) => row.id === lineageId);
    const seed = 5000 + index;
    const abGenome = { seed, kingdom: 'fauna', parents: [100 + index, 200 + index],
      color: 1, _earthBlend: lineageSpec.species, _earthBlendKingdom: 'fauna', _anchorVal: 0.73 };
    const baGenome = { seed, kingdom: 'fauna', parents: [200 + index, 100 + index],
      color: 2, _earthBlend: lineageSpec.species, _earthBlendKingdom: 'fauna', _anchorVal: 0.73 };
    const ab = add(`cache-controls/${lineageId}-AB.png`, 'cache-portrait', `${lineageId}|AB`, 440, 440);
    const ba = add(`cache-controls/${lineageId}-BA.png`, 'cache-portrait', `${lineageId}|BA`, 440, 440);
    cacheControls.push({ lineage_id: lineageId, species: lineageSpec.species, seed,
      same_seed: true, different_full_genomes: true, cache_independent: true, input_order_first: 'AB',
      alien: { id: 'cache-alien', genome: { seed: 9000 + index, kingdom: 'fauna', heat: 1 },
        derivation: { kind: 'makeGenome', formula: 'hashInt(0xCA6E,row,attempt)', row: index,
          attempt: 1, heat: 1, seed: 9000 + index } },
      differing_fields: ['color'], ab_genome: abGenome, ba_genome: baGenome,
      ab_genome_sha256: sha256(stableJson(abGenome)), ba_genome_sha256: sha256(stableJson(baGenome)),
      ab_route: expectedHybridLineageRoute(lineageSpec.set, lineageSpec.species),
      ba_route: expectedHybridLineageRoute(lineageSpec.set, lineageSpec.species),
      ab_portrait_path: ab.path, ab_portrait_sha256: ab.sha256,
      ba_portrait_path: ba.path, ba_portrait_sha256: ba.sha256 });
  }
  add('cache-controls/reversed-parent-sheet.png', 'cache-sheet', 'cache-subset', 680, 1534);
  const mixed = MIXED_SENTINELS.map((spec, offset) => {
    const ordinal = offset + 1; const attempt = offset + 3;
    const contract = mixedInputContract(spec, attempt);
    const inputs = contract.map((expected) => {
      const seed = hashInt(expected.base, spec.salt, attempt);
      const genome = { seed, kingdom: expected.kingdom, heat: expected.heat,
        ...(expected.named ? { _earthName: spec.name } : {}) };
      const derivation = { kind: expected.named ? expected.derivationKind : 'alien-seed-search',
        formula: expected.formula, salt: spec.salt, attempt, seed, heat: expected.heat,
        ...(expected.named ? { exact_name_matches: expected.exactNameMatches,
          owner_source: expected.ownerSource, route_owner: `${expected.kingdom}|${spec.name}`,
          ...(expected.ownerSource === 'deduped-legacy-route' ? { route_owner_verified: true } : {}) } : {}) };
      return { id: expected.id, genome, genome_sha256: sha256(stableJson(genome)), derivation };
    });
    const anchor = spec.kind === 'duplicate-name-owner' ? 0.9 : 0.73;
    const childGenome = { seed: 7000 + ordinal, kingdom: spec.child,
      parents: inputs.map((input) => input.genome.seed), _earthBlend: spec.name,
      _earthBlendKingdom: spec.owner, _anchorVal: anchor, _src: { color: 0, head: 1 } };
    const portrait = add(`mixed-kingdom/${String(ordinal).padStart(2, '0')}-${spec.id}.png`,
      'mixed-portrait', spec.id, 440, 440);
    const control = (genome, route, portraitSha256) => ({ genome,
      genome_sha256: sha256(stableJson(genome)), route, portrait_sha256: portraitSha256,
      production_matches_fresh: true, repeated_render_stable: true,
      differs_from_selected_owner: portraitSha256 !== portrait.sha256 });
    const stripped = control(withoutLineage(childGenome), 'procedural-owned',
      sha256(`mixed-stripped-${spec.id}`));
    const markerlessGenome = { ...childGenome }; delete markerlessGenome._earthBlendKingdom;
    const fallbackOwner = spec.kind === 'duplicate-name-owner' ? spec.child : spec.owner;
    const markerRequired = spec.kind === 'duplicate-name-owner' && spec.child !== spec.owner;
    const markerless = { ...control(markerlessGenome, expectedMarkerlessLineageRoute(fallbackOwner),
      markerRequired ? sha256(`mixed-markerless-${spec.id}`) : portrait.sha256),
      expected_legacy_owner: fallbackOwner, required_to_differ: markerRequired };
    let counterfactual = null;
    if (spec.kind === 'duplicate-name-owner') {
      const genome = { ...childGenome, _earthBlendKingdom: spec.other };
      counterfactual = control(genome, expectedHybridLineageRoute(spec.other, spec.name),
        sha256(`mixed-counterfactual-${spec.id}`));
    }
    const route = expectedHybridLineageRoute(spec.owner, spec.name);
    return { ordinal, sentinel_id: spec.id, sentinel_kind: spec.kind, species: spec.name,
      selected_lineage_owner: spec.owner, other_parent_kingdom: spec.other,
      parent_order: spec.order, expected_child_kingdom: spec.child,
      search: { kind: 'deterministic-seed-search', salt: spec.salt, attempt, limit: 2048 },
      inputs, cross: { function: 'crossGenome', parent_a: inputs[0].id, parent_b: inputs[1].id },
      child_genome: childGenome, child_genome_sha256: sha256(stableJson(childGenome)),
      child_kingdom: childGenome.kingdom, lineage: spec.name, lineage_kingdom: spec.owner,
      anchor, route, expected_route: route, production_matches_fresh: true,
      repeated_render_stable: true, repeated_cross_stable: true,
      portrait_path: portrait.path, portrait_sha256: portrait.sha256,
      stripped_lineage_control: stripped, missing_owner_marker_control: markerless,
      counterfactual_owner_control: counterfactual, visual_review_status: 'UNREVIEWED' };
  });
  const mixedSheet = add('mixed-kingdom/sentinels-sheet.png', 'mixed-sheet', 'mixed-sentinels', 880, 1160);
  const sourceSnapshot = currentHybridSourceSnapshot();
  const gitState = { head: commit, branch: 'openai/selftest', dirty: false, status_lines: [],
    source_claim: HYBRID_CLEAN_SOURCE_CLAIM };
  const manifest = { schema: HYBRID_SCHEMA, review_status: 'UNREVIEWED', visual_continuity_status: 'OPEN',
    machine_anchor_visual_status: 'OPEN_UNREVIEWED',
    visual_claim: HYBRID_VISUAL_CLAIM,
    generated_at_utc: '2026-08-11T00:00:00.000Z',
    contract: 'Fresh production-derived 13-lineage x 5-stage matrix plus 16 mixed-kingdom owner sentinels. Hybrid lineage metadata comes only from crossGenome.',
    browser: { executable: FIXTURE_BROWSER.executable, product: FIXTURE_BROWSER.product,
      revision: FIXTURE_BROWSER.revision, user_agent: FIXTURE_BROWSER.user_agent,
      js_version: FIXTURE_BROWSER.js_version, protocol_version: FIXTURE_BROWSER.protocol_version },
    git: { start: gitState, end: gitState, status_changed_during_capture: false }, source_snapshot: sourceSnapshot,
    reload_check: { passes: 2, first_order: 'forward (AB first)', second_order: 'reverse (BA first)',
      stable_projection_sha256: sha256('stable fixture projection'), identical: true },
    negative_controls: HYBRID_NEGATIVE_CONTROLS,
    residual_continuity_risks: HYBRID_RESIDUAL_CONTINUITY_RISKS,
    review_contract: PLATINUM_REVIEW,
    machine_observations: { byte_identical_anchor_lineages: [], required_human_verdict: true,
      mixed_owner_sentinels: { total: 16, unique_owner_cases: 8,
        duplicate_name_cases: 8, visual_status: 'OPEN' } },
    summary: { lineages: HYBRID_LINEAGES.length, principal_portraits: HYBRID_LINEAGES.length * STAGES.length,
      cache_controls: 6, cache_portraits: 12,
      mixed_kingdom_sentinels: 16, mixed_portraits: 16, assets: HYBRID_ASSETS,
      pixel_identical_lineages: 0, pixel_identical_lineage_ids: [] },
    stage_order: STAGES, anchor_contract: ANCHORS, lineages, cache_controls: cacheControls,
    mixed_kingdom_sentinels: mixed, mixed_sentinel_sheet: mixedSheet.path, assets };
  mkdirWrite(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  mkdirWrite(path.join(root, 'README.md'), expectedHybridReadme(manifest));
}
function expectFailure(label, action, pattern) {
  let error = null;
  try { action(); } catch (caught) { error = caught; }
  assert(error, `selftest ${label}: negative control passed`);
  if (pattern) assert(pattern.test(error.message), `selftest ${label}: wrong diagnostic: ${error.message}`);
  console.log(`  negative control: ${label} - rejected`);
}
function selftest() {
  const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cf-current-review-selftest-')));
  try {
    const commit = 'a'.repeat(40); const catalogue = path.join(temp, 'gp71-fixture');
    const liveState = { head: commit, status_lines: [], producer_sha256: hashFile(PRODUCER_FILE),
      platinum_review_sha256: PLATINUM_REVIEW.sha256, browser_provenance: FIXTURE_BROWSER };
    let snapshotReads = 0;
    expectFailure('mid-browser-probe checkout drift', () => liveRepositoryState(
      () => (++snapshotReads === 1
        ? { head: commit, status_lines: [], producer_sha256: liveState.producer_sha256,
          platinum_review_sha256: PLATINUM_REVIEW.sha256 }
        : { head: commit, status_lines: [' M packages/art/src/speciesoverrides.ts'],
          producer_sha256: liveState.producer_sha256, platinum_review_sha256: PLATINUM_REVIEW.sha256 }),
      () => FIXTURE_BROWSER), /changed during the browser provenance probe/);
    validateCurrentBinding({ source_commit: commit, producer_sha256: liveState.producer_sha256,
      platinum_review_sha256: PLATINUM_REVIEW.sha256, browser_provenance: FIXTURE_BROWSER }, liveState);
    expectFailure('stale current source commit', () => validateCurrentBinding({ source_commit: commit,
      producer_sha256: liveState.producer_sha256, platinum_review_sha256: PLATINUM_REVIEW.sha256,
      browser_provenance: FIXTURE_BROWSER },
    { ...liveState, head: 'b'.repeat(40) }), /STALE_FOR_CURRENT: source commit differs/);
    expectFailure('dirty current checkout', () => validateCurrentBinding({ source_commit: commit,
      producer_sha256: liveState.producer_sha256, platinum_review_sha256: PLATINUM_REVIEW.sha256,
      browser_provenance: FIXTURE_BROWSER },
    { ...liveState, status_lines: [' M packages/art/src/speciesoverrides.ts'] }), /STALE_FOR_CURRENT: checkout is dirty/);
    expectFailure('stale current producer', () => validateCurrentBinding({ source_commit: commit,
      producer_sha256: liveState.producer_sha256, platinum_review_sha256: PLATINUM_REVIEW.sha256,
      browser_provenance: FIXTURE_BROWSER },
    { ...liveState, producer_sha256: 'f'.repeat(64) }), /STALE_FOR_CURRENT: package producer differs/);
    expectFailure('stale current ruler', () => validateCurrentBinding({ source_commit: commit,
      producer_sha256: liveState.producer_sha256, platinum_review_sha256: PLATINUM_REVIEW.sha256,
      browser_provenance: FIXTURE_BROWSER },
    { ...liveState, platinum_review_sha256: 'f'.repeat(64) }), /STALE_FOR_CURRENT: Platinum ruler differs/);
    expectFailure('stale current browser', () => validateCurrentBinding({ source_commit: commit,
      producer_sha256: liveState.producer_sha256, platinum_review_sha256: PLATINUM_REVIEW.sha256,
      browser_provenance: FIXTURE_BROWSER },
    { ...liveState, browser_provenance: { ...FIXTURE_BROWSER, revision: 'fixture-revision-2' } }),
    /STALE_FOR_CURRENT: browser provenance differs at revision/);
    const layout = path.join(temp, 'layout'); const hybrid = path.join(temp, 'hybrid');
    fs.mkdirSync(catalogue); fs.mkdirSync(layout); fs.mkdirSync(hybrid);
    const catalogueRows = fixtureIdentities(catalogue, commit);
    fixtureLayout(layout, catalogue, catalogueRows, commit); fixtureHybrid(hybrid, commit);
    const output = path.join(temp, 'current-review-selftest.zip');
    const fixtureReferences = catalogueRows.references;
    const result = buildPackage({ catalogue, layout, hybrid, output }, liveState, fixtureReferences);
    assert(fs.existsSync(result.output) && fs.existsSync(result.sidecar), 'selftest positive package/sidecar missing');
    verifyCurrentFreshness(output, liveState, fixtureReferences);
    const pristineZip = fs.readFileSync(output);
    let eocd = -1;
    for (let offset = pristineZip.length - 22; offset >= Math.max(0, pristineZip.length - 0xffff - 22); offset--) {
      if (pristineZip.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
    }
    assert(eocd >= 0 && pristineZip.readUInt16LE(eocd + 20) === 0,
      'selftest ZIP fixture has no canonical zero-comment EOCD');
    const zipComment = Buffer.from('Nick endorses this Platinum release', 'utf8');
    const commentedZip = Buffer.concat([pristineZip, zipComment]);
    commentedZip.writeUInt16LE(zipComment.length, eocd + 20);
    fs.writeFileSync(output, commentedZip);
    fs.writeFileSync(`${output}.sha256`, `${sha256(commentedZip)}  ${path.basename(output)}\n`);
    expectFailure('ZIP-carried review comment', () => verifyCurrentFreshness(
      output, liveState, fixtureReferences), /archive comments or trailing metadata are forbidden/);
    const extraZip = Buffer.from(pristineZip);
    const centralOffset = extraZip.readUInt32LE(eocd + 16);
    extraZip.writeUInt16LE(1, centralOffset + 30);
    fs.writeFileSync(output, extraZip);
    fs.writeFileSync(`${output}.sha256`, `${sha256(extraZip)}  ${path.basename(output)}\n`);
    expectFailure('ZIP-carried extra metadata', () => verifyCurrentFreshness(
      output, liveState, fixtureReferences), /central extra metadata is forbidden/);
    const prefix = Buffer.from('Nick endorses this Platinum release', 'utf8');
    const prefixedZip = Buffer.concat([prefix, pristineZip]);
    const prefixedEocd = eocd + prefix.length;
    const entryCount = pristineZip.readUInt16LE(eocd + 10);
    let centralCursor = centralOffset + prefix.length;
    prefixedZip.writeUInt32LE(centralOffset + prefix.length, prefixedEocd + 16);
    for (let index = 0; index < entryCount; index++) {
      assert(prefixedZip.readUInt32LE(centralCursor) === 0x02014b50,
        'selftest prefixed ZIP central directory is malformed');
      prefixedZip.writeUInt32LE(prefixedZip.readUInt32LE(centralCursor + 42) + prefix.length,
        centralCursor + 42);
      centralCursor += 46 + prefixedZip.readUInt16LE(centralCursor + 28)
        + prefixedZip.readUInt16LE(centralCursor + 30) + prefixedZip.readUInt16LE(centralCursor + 32);
    }
    fs.writeFileSync(output, prefixedZip);
    fs.writeFileSync(`${output}.sha256`, `${sha256(prefixedZip)}  ${path.basename(output)}\n`);
    expectFailure('ZIP-carried executable prefix', () => verifyCurrentFreshness(
      output, liveState, fixtureReferences), /executable prefixes or leading metadata are forbidden/);
    fs.writeFileSync(output, pristineZip);
    fs.writeFileSync(`${output}.sha256`, `${sha256(pristineZip)}  ${path.basename(output)}\n`);
    expectFailure('post-hoc stale package', () => verifyCurrentFreshness(output, {
      ...liveState, head: 'b'.repeat(40),
    }, fixtureReferences), /STALE_FOR_CURRENT: source commit differs/);
    expectFailure('post-hoc browser drift', () => verifyCurrentFreshness(output, {
      ...liveState, browser_provenance: { ...FIXTURE_BROWSER, protocol_version: 'fixture-protocol-2' },
    }, fixtureReferences), /STALE_FOR_CURRENT: browser provenance differs at protocol_version/);
    let postHocDeepReads = 0;
    expectFailure('post-hoc deep-verification source drift', () => verifyCurrentFreshness(output,
      () => (++postHocDeepReads === 1 ? liveState : { ...liveState, head: 'b'.repeat(40) }), fixtureReferences),
    /STALE_FOR_CURRENT: source commit differs/);
    let postHocPublishReads = 0;
    expectFailure('post-hoc result-publication source drift', () => verifyCurrentFreshness(output,
      () => (++postHocPublishReads <= 2 ? liveState : { ...liveState, head: 'b'.repeat(40) }), fixtureReferences),
    /STALE_FOR_CURRENT: source commit differs/);
    const driftOutput = path.join(temp, 'current-review-toctou.zip');
    let freshnessReads = 0;
    expectFailure('pre-publication source drift', () => buildPackage({
      catalogue, layout, hybrid, output: driftOutput,
    }, () => (++freshnessReads === 1 ? liveState : { ...liveState, head: 'b'.repeat(40) }), fixtureReferences),
    /STALE_FOR_CURRENT: source commit differs/);
    assert(!fs.existsSync(driftOutput) && !fs.existsSync(`${driftOutput}.sha256`),
      'selftest pre-publication drift: failed package escaped to final output');
    const finalDriftOutput = path.join(temp, 'current-review-final-copy-toctou.zip');
    let finalFreshnessReads = 0;
    expectFailure('final-publication source drift', () => buildPackage({
      catalogue, layout, hybrid, output: finalDriftOutput,
    }, () => (++finalFreshnessReads <= 2 ? liveState : { ...liveState, head: 'b'.repeat(40) }), fixtureReferences),
    /STALE_FOR_CURRENT: source commit differs/);
    assert(!fs.existsSync(finalDriftOutput) && !fs.existsSync(`${finalDriftOutput}.sha256`),
      'selftest final-publication drift: failed package/sidecar escaped cleanup');
    console.log('  positive control: create, extract, deep reverify - PASS');
    const negativeExtract = path.join(temp, 'negative-package-extract'); fs.mkdirSync(negativeExtract);
    extractZip(output, negativeExtract);
    const negativePackageRoot = path.join(negativeExtract, 'current-review-selftest');
    const packageManifest = readJson(negativePackageRoot, 'package-manifest.json', 'selftest package manifest');
    const packageReadme = fs.readFileSync(path.join(negativePackageRoot, 'README.md'), 'utf8');
    const packageManifestPath = path.join(negativePackageRoot, 'package-manifest.json');
    const packageReadmePath = path.join(negativePackageRoot, 'README.md');
    const refreshPackageSums = () => {
      const sums = path.join(negativePackageRoot, 'SHA256SUMS');
      if (fs.existsSync(sums)) fs.unlinkSync(sums);
      writeSha256Sums(negativePackageRoot);
    };
    const rebindPackagePayload = () => {
      const rebound = readJson(negativePackageRoot, 'package-manifest.json', 'selftest rebound manifest');
      for (const row of rebound.files) {
        const file = realFile(negativePackageRoot, row.path, `selftest rebound ${row.path}`);
        row.bytes = fs.statSync(file).size;
        row.sha256 = hashFile(file);
      }
      rebound.input_bindings.hybrid_review_template_sha256 =
        hashFile(path.join(negativePackageRoot, 'hybrid-review-template.json'));
      rebound.hash_contract.file_aggregate_sha256 = sha256(rebound.files.map((row) =>
        `${row.path}\u0000${row.bytes}\u0000${row.sha256}\n`).join(''));
      fs.writeFileSync(packageManifestPath, JSON.stringify(rebound, null, 2) + '\n');
      refreshPackageSums();
    };
    const carriedPackageVerdict = structuredClone(packageManifest);
    carriedPackageVerdict.human_verdict = { band: 'PASS', reviewer: 'fixture' };
    fs.writeFileSync(packageManifestPath, JSON.stringify(carriedPackageVerdict, null, 2) + '\n');
    refreshPackageSums();
    expectFailure('package manifest embedded verdict', () => verifyPackagedTree(
      negativePackageRoot, 'current-review-selftest', { catalogueReferences: fixtureReferences }),
    /package manifest: keys are incomplete or unexpected/);
    fs.writeFileSync(packageManifestPath, JSON.stringify(packageManifest, null, 2) + '\n');
    refreshPackageSums();
    const carriedPackageStatus = structuredClone(packageManifest);
    carriedPackageStatus.counts.hybrid.visual_continuity_status = 'PASS';
    fs.writeFileSync(packageManifestPath, JSON.stringify(carriedPackageStatus, null, 2) + '\n');
    refreshPackageSums();
    expectFailure('package manifest embedded visual PASS', () => verifyPackagedTree(
      negativePackageRoot, 'current-review-selftest', { catalogueReferences: fixtureReferences }),
    /exact package counts\/status projection differs/);
    fs.writeFileSync(packageManifestPath, JSON.stringify(packageManifest, null, 2) + '\n');
    refreshPackageSums();
    fs.writeFileSync(packageReadmePath, `${packageReadme}\nWolf | PASS | reviewed by fixture\n`);
    rebindPackagePayload();
    expectFailure('package README embedded verdict', () => verifyCurrentFreshness(
      negativePackageRoot, liveState, fixtureReferences),
    /package README: exact generated UNREVIEWED \/ NOT CERTIFIED content changed/);
    fs.writeFileSync(packageReadmePath, packageReadme);
    fs.writeFileSync(packageManifestPath, JSON.stringify(packageManifest, null, 2) + '\n');
    refreshPackageSums();
    const corruptBindingManifest = structuredClone(packageManifest);
    corruptBindingManifest.source_commit = 'b'.repeat(40);
    fs.writeFileSync(packageManifestPath, JSON.stringify(corruptBindingManifest, null, 2) + '\n');
    expectFailure('hash-inconsistent freshness binding', () => verifyCurrentFreshness(
      negativePackageRoot, liveState, fixtureReferences), /package SHA256SUMS: stale hash/);
    fs.writeFileSync(packageManifestPath, JSON.stringify(packageManifest, null, 2) + '\n');
    const priorSchemaManifest = structuredClone(packageManifest);
    priorSchemaManifest.schema = 'cf.current-review.package.v1';
    fs.writeFileSync(packageManifestPath, JSON.stringify(priorSchemaManifest, null, 2) + '\n');
    expectFailure('hash-inconsistent prior package schema', () => verifyCurrentFreshness(
      negativePackageRoot, liveState, fixtureReferences), /package SHA256SUMS: stale hash/);
    refreshPackageSums();
    expectFailure('prior package schema freshness', () => verifyCurrentFreshness(
      negativePackageRoot, liveState, fixtureReferences),
      /STALE_FOR_CURRENT: package schema\/producer differs/);
    fs.writeFileSync(packageManifestPath, JSON.stringify(packageManifest, null, 2) + '\n');
    refreshPackageSums();
    const staleScope = structuredClone(packageManifest); staleScope.evidence_scope = 'HISTORICAL_OR_MIXED';
    expectFailure('CURRENT-ONLY scope', () => validatePackageScope(staleScope, packageReadme), /CURRENT-ONLY/);
    const staleStatus = structuredClone(packageManifest); staleStatus.package_status = 'REVIEWED';
    expectFailure('package status', () => validatePackageScope(staleStatus, packageReadme), /UNREVIEWED/);
    const stalePngInventory = structuredClone(packageManifest); stalePngInventory.counts.physical_pngs.total--;
    expectFailure('physical PNG inventory', () => validatePhysicalPngCounts(stalePngInventory, stalePngInventory.files), /2,163/);
    expectFailure('existing output', () => buildPackage(
      { catalogue, layout, hybrid, output }, liveState, fixtureReferences), /already exists/);
    expectFailure('overlapping input roots', () => validateInputs(
      catalogue, catalogue, hybrid, fixtureReferences), /distinct and non-overlapping/);
    expectFailure('input/output overlap', () => validateOutput(path.join(catalogue, 'nested-output.zip'),
      [catalogue, layout, hybrid]), /must not overlap/);
    expectFailure('in-repository output freshness', () => validateOutput(
      path.join(REPOSITORY_ROOT, 'zztmp-current-review-selftest.zip'), [catalogue, layout, hybrid]),
    /outside the source repository/);
    const forbiddenArtifact = path.join(catalogue, 'results.json');
    fs.writeFileSync(forbiddenArtifact, '{}\n');
    expectFailure('verdict/certification artifact', () => validateCatalogue(
      catalogue, fixtureReferences), /artifact is forbidden/);
    fs.unlinkSync(forbiddenArtifact);

    const catalogueReadmePath = path.join(catalogue, 'README.md');
    const catalogueReadmeText = fs.readFileSync(catalogueReadmePath, 'utf8');
    fs.writeFileSync(catalogueReadmePath, `${catalogueReadmeText}\n# CERTIFIED PASS\nReviewer: fixture\n`);
    expectFailure('catalogue README verdict', () => validateCatalogue(
      catalogue, fixtureReferences), /exact generated non-verdict content/);
    fs.writeFileSync(catalogueReadmePath, catalogueReadmeText);
    const cataloguePreparationPath = path.join(catalogue, 'preparation.json');
    const cataloguePreparationText = fs.readFileSync(cataloguePreparationPath, 'utf8');
    const appendedPreparationApproval = JSON.parse(cataloguePreparationText);
    appendedPreparationApproval.note += ' Platinum approved by Nick.';
    fs.writeFileSync(cataloguePreparationPath, JSON.stringify(appendedPreparationApproval, null, 2) + '\n');
    expectFailure('catalogue preparation appended approval', () => validateCatalogue(
      catalogue, fixtureReferences), /embedded completed-verdict value|non-verdict boundary is missing/);
    fs.writeFileSync(cataloguePreparationPath, cataloguePreparationText);
    const alteredPreparationOutput = JSON.parse(cataloguePreparationText);
    alteredPreparationOutput.output = 'gp71-other-fixture';
    fs.writeFileSync(cataloguePreparationPath, JSON.stringify(alteredPreparationOutput, null, 2) + '\n');
    expectFailure('catalogue preparation output identity', () => validateCatalogue(
      catalogue, fixtureReferences), /output identity differs from the bound producer root/);
    fs.writeFileSync(cataloguePreparationPath, cataloguePreparationText);
    const portraitManifestPath = path.join(catalogue, 'review-info', 'manifest.json');
    const portraitManifestText = fs.readFileSync(portraitManifestPath, 'utf8');
    const alteredGeneratedFor = JSON.parse(portraitManifestText);
    alteredGeneratedFor.generated_for = 'Nick endorses this Platinum release';
    fs.writeFileSync(portraitManifestPath, JSON.stringify(alteredGeneratedFor, null, 2) + '\n');
    expectFailure('catalogue portrait producer claim', () => validateCatalogue(
      catalogue, fixtureReferences), /exact producer identity\/dimensions changed/);
    fs.writeFileSync(portraitManifestPath, portraitManifestText);
    const packetMarkdownPath = path.join(catalogue, 'packets', 'packet-001', 'packet.md');
    const packetMarkdownText = fs.readFileSync(packetMarkdownPath, 'utf8');
    fs.writeFileSync(packetMarkdownPath, `${packetMarkdownText}Wolf | PASS | reviewed by fixture\n`);
    expectFailure('catalogue packet verdict', () => validateCatalogue(
      catalogue, fixtureReferences), /exact clean-source generated packet content/);
    fs.writeFileSync(packetMarkdownPath, packetMarkdownText);
    fs.writeFileSync(packetMarkdownPath,
      packetMarkdownText.replace('mustRead: fixture anatomical criterion', 'mustRead: PASS'));
    expectFailure('catalogue mustRead substitution', () => validateCatalogue(
      catalogue, fixtureReferences), /exact clean-source generated packet content/);
    fs.writeFileSync(packetMarkdownPath, packetMarkdownText);
    const packetJsonPath = path.join(catalogue, 'packets', 'packet-001', 'packet.json');
    const packetJsonText = fs.readFileSync(packetJsonPath, 'utf8');
    const carriedPacket = JSON.parse(packetJsonText); carriedPacket.species[0].band = 'PASS';
    fs.writeFileSync(packetJsonPath, JSON.stringify(carriedPacket, null, 2) + '\n');
    expectFailure('catalogue packet JSON verdict', () => validateCatalogue(catalogue, fixtureReferences),
      /embedded verdict\/certification field|keys are incomplete or unexpected/);
    fs.writeFileSync(packetJsonPath, packetJsonText);
    const strictSchemaPath = path.join(catalogue, 'strict-verdict-schema.json');
    const strictSchemaText = fs.readFileSync(strictSchemaPath, 'utf8');
    const carriedStrictSchema = JSON.parse(strictSchemaText);
    carriedStrictSchema.completed_verdicts = [{ band: 'PASS', reviewer: 'fixture' }];
    fs.writeFileSync(strictSchemaPath, JSON.stringify(carriedStrictSchema, null, 2) + '\n');
    expectFailure('strict schema completed verdict', () => validateCatalogue(
      catalogue, fixtureReferences), /exact blank schema/);
    fs.writeFileSync(strictSchemaPath, strictSchemaText);

    const missingFile = path.join(catalogue, 'portraits', catalogueRows.identities[0].image_file);
    const missingBytes = fs.readFileSync(missingFile); fs.unlinkSync(missingFile);
    expectFailure('missing source asset', () => validateCatalogue(catalogue, fixtureReferences), /missing|inventory/i);
    mkdirWrite(missingFile, missingBytes);

    const packetManifestPath = path.join(layout, 'packet-manifest.json');
    const packetManifest = JSON.parse(fs.readFileSync(packetManifestPath, 'utf8'));
    const staleFile = path.join(layout, ...packetManifest.files[0].file.split('/'));
    const staleBytes = fs.readFileSync(staleFile); fs.appendFileSync(staleFile, 'stale');
    expectFailure('stale disk hash', () => validateLayout(
      layout, validateCatalogue(catalogue, fixtureReferences)), /stale|SHA/i);
    fs.writeFileSync(staleFile, staleBytes);

    const layoutPlanPath = path.join(layout, 'plan.json');
    const layoutPlanText = fs.readFileSync(layoutPlanPath, 'utf8');
    const layoutPlan = JSON.parse(layoutPlanText); layoutPlan.packet_size = 11;
    fs.writeFileSync(layoutPlanPath, JSON.stringify(layoutPlan, null, 2) + '\n');
    expectFailure('official layout packet size', () => validateLayout(
      layout, validateCatalogue(catalogue, fixtureReferences)), /packet_size/);
    fs.writeFileSync(layoutPlanPath, layoutPlanText);

    const layoutIndexPath = path.join(layout, 'index.json');
    const layoutIndexText = fs.readFileSync(layoutIndexPath, 'utf8');
    const carriedLayoutDecision = JSON.parse(layoutIndexText);
    carriedLayoutDecision.packets[0].finalDecision = 'Nick endorses this Platinum release';
    fs.writeFileSync(layoutIndexPath, JSON.stringify(carriedLayoutDecision, null, 2) + '\n');
    expectFailure('layout packet unknown decision metadata', () => validateLayout(
      layout, validateCatalogue(catalogue, fixtureReferences)), /layout packet 1: keys are incomplete or unexpected/);
    fs.writeFileSync(layoutIndexPath, layoutIndexText);

    const layoutPacketManifestText = fs.readFileSync(packetManifestPath, 'utf8');
    const staleBrowser = JSON.parse(layoutPacketManifestText); staleBrowser.browser.revision = 'different-browser-revision';
    fs.writeFileSync(packetManifestPath, JSON.stringify(staleBrowser, null, 2) + '\n');
    expectFailure('browser provenance equality', () => validateLayout(
      layout, validateCatalogue(catalogue, fixtureReferences)), /browser provenance/);
    fs.writeFileSync(packetManifestPath, layoutPacketManifestText);

    const linkPath = path.join(hybrid, 'rogue-link');
    let linked = false;
    try { fs.symlinkSync(path.join(hybrid, 'README.md'), linkPath); linked = true; }
    catch { /* Windows may deny symlink creation without Developer Mode. */ }
    if (linked) {
      expectFailure('symlink', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER), /symbolic links are forbidden/);
      fs.unlinkSync(linkPath);
    } else {
      expectFailure('symlink (lstat fallback)', () => rejectLink({ isSymbolicLink: () => true }, 'fixture link'),
        /symbolic links are forbidden/);
    }

    const hybridManifestPath = path.join(hybrid, 'manifest.json');
    const hybridManifestText = fs.readFileSync(hybridManifestPath, 'utf8');
    const staleReload = JSON.parse(hybridManifestText); staleReload.reload_check.identical = false;
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleReload, null, 2) + '\n');
    expectFailure('hybrid reload check', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER), /reload check/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleReviewContract = JSON.parse(hybridManifestText);
    staleReviewContract.review_contract.sha256 = 'f'.repeat(64);
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleReviewContract, null, 2) + '\n');
    expectFailure('Platinum review contract', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /Platinum review contract/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const appendedVisualClaim = JSON.parse(hybridManifestText);
    appendedVisualClaim.visual_claim += ' Platinum approved by Nick.';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(appendedVisualClaim, null, 2) + '\n');
    expectFailure('appended hybrid visual approval', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /embedded completed-verdict value|exact no-visual-PASS boundary changed/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const appendedResidualApproval = JSON.parse(hybridManifestText);
    appendedResidualApproval.residual_continuity_risks.push('Platinum approved by Nick.');
    fs.writeFileSync(hybridManifestPath, JSON.stringify(appendedResidualApproval, null, 2) + '\n');
    expectFailure('appended hybrid residual approval', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /embedded completed-verdict value|exact residual-continuity risk disclosures changed/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const appendedGitApproval = JSON.parse(hybridManifestText);
    appendedGitApproval.git.start.source_claim += ' Platinum approved by Nick.';
    appendedGitApproval.git.end.source_claim += ' Platinum approved by Nick.';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(appendedGitApproval, null, 2) + '\n');
    expectFailure('appended hybrid git approval', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /embedded completed-verdict value|exact clean source claim missing/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const fabricatedSourceSnapshot = JSON.parse(hybridManifestText);
    fabricatedSourceSnapshot.source_snapshot.files = [fabricatedSourceSnapshot.source_snapshot.files[0]];
    fabricatedSourceSnapshot.source_snapshot.sha256 = sha256(fabricatedSourceSnapshot.source_snapshot.files
      .map((row) => `${row.file}\u0000${row.bytes}\u0000${row.sha256}\n`).join(''));
    fs.writeFileSync(hybridManifestPath, JSON.stringify(fabricatedSourceSnapshot, null, 2) + '\n');
    expectFailure('fabricated hybrid source snapshot', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /exact current producer inventory\/bytes/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleHybridBrowser = JSON.parse(hybridManifestText);
    staleHybridBrowser.browser.js_version = 'different-js-version';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleHybridBrowser, null, 2) + '\n');
    expectFailure('hybrid browser provenance equality', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /js_version.*does not match/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleAnchor = JSON.parse(hybridManifestText);
    staleAnchor.lineages[0].stages[3].genome._anchorVal = 0.5;
    staleAnchor.lineages[0].stages[3].genome_sha256 =
      sha256(stableJson(staleAnchor.lineages[0].stages[3].genome));
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleAnchor, null, 2) + '\n');
    expectFailure('hybrid production anchor', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /production anchor differs/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleReviewedFaunaRoute = JSON.parse(hybridManifestText);
    staleReviewedFaunaRoute.lineages[0].stages[1].route = 'lineage-verbatim';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleReviewedFaunaRoute, null, 2) + '\n');
    expectFailure('reviewed fauna route bypass', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /lineage\/anchor\/route provenance/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleProtectedFaunaRoute = JSON.parse(hybridManifestText);
    staleProtectedFaunaRoute.lineages.find((row) => row.lineage_id === 'great-white-shark')
      .stages[1].route = 'lineage-owned';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleProtectedFaunaRoute, null, 2) + '\n');
    expectFailure('protected fauna route drift', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /lineage\/anchor\/route provenance/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleProtectedPureRoute = JSON.parse(hybridManifestText);
    const protectedPure = staleProtectedPureRoute.lineages.find((row) => row.lineage_id === 'sea-turtle').stages[0];
    protectedPure.route = 'named-verbatim'; protectedPure.owned = false;
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleProtectedPureRoute, null, 2) + '\n');
    expectFailure('protected pure named-owner route drift', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /pure named-lineage provenance\/route/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const vacuousStrippedControl = JSON.parse(hybridManifestText);
    vacuousStrippedControl.lineages[0].stages[1].stripped_lineage_control.portrait_sha256 =
      vacuousStrippedControl.lineages[0].stages[1].portrait_sha256;
    fs.writeFileSync(hybridManifestPath, JSON.stringify(vacuousStrippedControl, null, 2) + '\n');
    expectFailure('vacuous stripped-lineage control', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /stripped-lineage negative control/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleCacheRoute = JSON.parse(hybridManifestText);
    staleCacheRoute.cache_controls[0].ab_route = staleCacheRoute.cache_controls[0].ab_route === 'lineage-owned'
      ? 'lineage-verbatim' : 'lineage-owned';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleCacheRoute, null, 2) + '\n');
    expectFailure('cache route policy', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /lineage owner, anchor, or production route/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const cacheCollision = JSON.parse(hybridManifestText);
    const cacheRow = cacheCollision.cache_controls[0];
    const abCacheFile = path.join(hybrid, ...cacheRow.ab_portrait_path.split('/'));
    const baCacheFile = path.join(hybrid, ...cacheRow.ba_portrait_path.split('/'));
    const baCacheOriginal = fs.readFileSync(baCacheFile);
    const abCacheBytes = fs.readFileSync(abCacheFile);
    fs.writeFileSync(baCacheFile, abCacheBytes);
    const collidedHash = sha256(abCacheBytes);
    const collidedAsset = cacheCollision.assets.find((asset) => asset.path === cacheRow.ba_portrait_path);
    collidedAsset.sha256 = collidedHash; collidedAsset.bytes = abCacheBytes.length;
    cacheRow.ba_portrait_sha256 = collidedHash;
    fs.writeFileSync(hybridManifestPath, JSON.stringify(cacheCollision, null, 2) + '\n');
    expectFailure('cache portrait collision', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /stale cache portrait binding/);
    fs.writeFileSync(baCacheFile, baCacheOriginal);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleMixedRoute = JSON.parse(hybridManifestText);
    staleMixedRoute.mixed_kingdom_sentinels[4].route = 'lineage-verbatim';
    staleMixedRoute.mixed_kingdom_sentinels[4].expected_route = 'lineage-verbatim';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleMixedRoute, null, 2) + '\n');
    expectFailure('mixed route policy', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /selected lineage owner/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleParentChain = JSON.parse(hybridManifestText);
    staleParentChain.lineages[0].stages[1].genome.parents.reverse();
    staleParentChain.lineages[0].stages[1].genome_sha256 =
      sha256(stableJson(staleParentChain.lineages[0].stages[1].genome));
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleParentChain, null, 2) + '\n');
    expectFailure('hash-consistent lineage parent chain', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /parent seed chain/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleCache = JSON.parse(hybridManifestText); staleCache.cache_controls[0].cache_independent = false;
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleCache, null, 2) + '\n');
    expectFailure('cache independence flags', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /cache-independence/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const staleMixed = JSON.parse(hybridManifestText); staleMixed.mixed_kingdom_sentinels[0].repeated_cross_stable = false;
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleMixed, null, 2) + '\n');
    expectFailure('mixed fresh/repeat outcome', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /fresh\/repeat/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const missingMixedControls = JSON.parse(hybridManifestText);
    delete missingMixedControls.mixed_kingdom_sentinels[0].stripped_lineage_control;
    delete missingMixedControls.mixed_kingdom_sentinels[0].missing_owner_marker_control;
    fs.writeFileSync(hybridManifestPath, JSON.stringify(missingMixedControls, null, 2) + '\n');
    expectFailure('missing mixed negative controls', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /keys are incomplete or unexpected|control\/genome is missing/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const substitutedMixedIdentity = JSON.parse(hybridManifestText);
    substitutedMixedIdentity.mixed_kingdom_sentinels[4] = structuredClone(
      substitutedMixedIdentity.mixed_kingdom_sentinels[0]);
    substitutedMixedIdentity.mixed_kingdom_sentinels[4].ordinal = 5;
    fs.writeFileSync(hybridManifestPath, JSON.stringify(substitutedMixedIdentity, null, 2) + '\n');
    expectFailure('substituted mixed sentinel identity', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /wrong sentinel identity/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const hybridManifest = JSON.parse(hybridManifestText); hybridManifest.review_status = 'CERTIFIED';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(hybridManifest, null, 2) + '\n');
    expectFailure('certification status', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /UNREVIEWED|OPEN|embedded completed-verdict/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const escapedMachineObservations = JSON.parse(hybridManifestText);
    escapedMachineObservations.machine_observations.release_signoff = 'Nick approved Platinum certification';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(escapedMachineObservations, null, 2) + '\n');
    expectFailure('embedded machine-observation signoff', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /embedded verdict\/certification field|hybrid machine_observations: keys are incomplete or unexpected/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const escapedHybridAsset = JSON.parse(hybridManifestText);
    escapedHybridAsset.assets[0].release_signoff = 'Nick';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(escapedHybridAsset, null, 2) + '\n');
    expectFailure('embedded hybrid asset signoff', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /embedded verdict\/certification field|keys are incomplete or unexpected/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const escapedHybridLineage = JSON.parse(hybridManifestText);
    escapedHybridLineage.lineages[0].platinum_status = 'yes';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(escapedHybridLineage, null, 2) + '\n');
    expectFailure('unknown hybrid lineage metadata', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /hybrid lineage 1: keys are incomplete or unexpected/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const escapedHybridGenome = JSON.parse(hybridManifestText);
    escapedHybridGenome.lineages[0].inputs[0].genome.reviewDecision = 'Nick endorses Platinum';
    escapedHybridGenome.lineages[0].inputs[0].genome_sha256 =
      sha256(stableJson(escapedHybridGenome.lineages[0].inputs[0].genome));
    fs.writeFileSync(hybridManifestPath, JSON.stringify(escapedHybridGenome, null, 2) + '\n');
    expectFailure('unknown hybrid genome metadata', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /unsupported genome field/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const alteredMachineStatus = JSON.parse(hybridManifestText);
    alteredMachineStatus.machine_observations.mixed_owner_sentinels.visual_status = 'PLATINUM APPROVED';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(alteredMachineStatus, null, 2) + '\n');
    expectFailure('altered machine-observation status', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /embedded completed-verdict value|human verdict\/mixed-owner observation boundary/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const embeddedVerdict = JSON.parse(hybridManifestText);
    embeddedVerdict.machine_observations.human_verdict = { band: 'PASS', reviewer: 'fixture' };
    fs.writeFileSync(hybridManifestPath, JSON.stringify(embeddedVerdict, null, 2) + '\n');
    expectFailure('embedded manifest verdict', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /embedded verdict\/certification field/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    const hybridReadmePath = path.join(hybrid, 'README.md');
    const hybridReadmeText = fs.readFileSync(hybridReadmePath, 'utf8');
    fs.writeFileSync(hybridReadmePath, `${hybridReadmeText}\n# CERTIFIED PASS\nReviewer: fixture\n`);
    expectFailure('embedded README verdict', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /exact generated UNREVIEWED \/ OPEN content/);
    fs.writeFileSync(hybridReadmePath, hybridReadmeText);
    console.log('CURRENT REVIEW PACKAGE SELFTEST PASS');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}

function parseArgs(argv) {
  const options = {};
  for (const arg of argv) {
    if (arg === '--selftest') options.selftest = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else {
      const match = /^--(catalogue|layout|hybrid|output|freshness)=(.+)$/.exec(arg);
      assert(match, `unknown/incomplete argument: ${arg}`);
      assert(options[match[1]] === undefined, `duplicate --${match[1]}`);
      options[match[1]] = match[2];
    }
  }
  return options;
}
function usage() {
  console.log('Usage: node tools/currentreviewpackage.mjs --catalogue=<gp71-prepare-root> --layout=<fullresetlayout-root> --hybrid=<hybridmatrix-root> --output=<new.zip>');
  console.log('       node tools/currentreviewpackage.mjs --freshness=<package.zip-or-extracted-root>');
  console.log('       node tools/currentreviewpackage.mjs --selftest');
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) usage();
  else if (options.selftest) {
    assert(Object.keys(options).length === 1, '--selftest cannot be combined with packaging arguments'); selftest();
  } else if (options.freshness) {
    assert(Object.keys(options).length === 1, '--freshness cannot be combined with packaging arguments');
    const result = verifyCurrentFreshness(options.freshness);
    console.log('CURRENT REVIEW PACKAGE FRESHNESS PASS - FRESH_FOR_CURRENT');
    console.log(`  source commit: ${result.manifest.source_commit}`);
    console.log(`  producer SHA-256: ${result.freshness.producer_sha256}`);
    console.log(`  Platinum ruler SHA-256: ${result.freshness.platinum_review_sha256}`);
  } else {
    for (const name of ['catalogue', 'layout', 'hybrid', 'output']) assert(options[name], `missing --${name}=...`);
    const result = buildPackage(options);
    console.log('CURRENT REVIEW PACKAGE READY - CURRENT-ONLY / UNREVIEWED / NOT CERTIFIED');
    console.log(`  source commit: ${result.sourceCommit}`);
    console.log(`  ZIP: ${portable(result.output)}`);
    console.log(`  ZIP bytes: ${result.bytes}`);
    console.log(`  ZIP SHA-256: ${result.sha256}`);
    console.log(`  sidecar: ${portable(result.sidecar)}`);
  }
} catch (error) {
  console.error(`CURRENT REVIEW PACKAGE FAIL: ${error.message}`);
  process.exitCode = 1;
}
