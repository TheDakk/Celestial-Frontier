/* currentreviewpackage.mjs - package current-only combined review evidence.

   This creates a NEW, explicitly non-certifying ZIP from three independently
   prepared evidence roots. It never creates, imports, or implies a verdict.

   Usage:
     node tools/currentreviewpackage.mjs \
       --catalogue=<gp71 --prepare root> \
       --layout=<fullresetlayout --prepare --packets root> \
       --hybrid=<hybridmatrix root> \
       --output=<new .zip>
     node tools/currentreviewpackage.mjs --selftest
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SHA = /^[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40}$/;
const CLEAN_STATUS_SHA256 = crypto.createHash('sha256').update('').digest('hex');

const PACKAGE_SCHEMA = 'cf.current-review.package.v1';
const REVIEW_TEMPLATE_SCHEMA = 'cf.current-review.hybrid-template.v1';
const PREPARATION_SCHEMA = 'cf.gp71.rejudge-preparation.v2';
const IDENTITY_SCHEMA = 'cf.gp71.identity-manifest.v2';
const PORTRAIT_SCHEMA = 'cf.gp71.portrait-manifest.v2';
const CAPTURE_SCHEMA = 'cf.capture-provenance.v1';
const PACKET_SCHEMA = 'cf.gp71.packet.v1';
const PLAN_SCHEMA = 'cf.full-reset.catalogue-plan.v2';
const INDEX_SCHEMA = 'cf.full-reset.catalogue-index.v2';
const PROCEDURAL_INDEX_SCHEMA = 'cf.full-reset.procedural-plan-index.v2';
const PACKET_MANIFEST_SCHEMA = 'cf.full-reset.packet-manifest.v2';
const HYBRID_SCHEMA = 'cf.hybrid-continuity.evidence.v3';

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
  hybrid_assets: 234,
  total: 2146,
});
const STAGES = Object.freeze(['pure', 'earth-earth', 'earth-alien', 'next-alien', 'floor']);
const ANCHORS = Object.freeze([1, 0.9, 0.73, 0.46, 0.22]);
const HYBRID_LINEAGES = Object.freeze([
  { id: 'fruit-bat', species: 'Fruit Bat', set: 'earth-fauna' },
  { id: 'eagle', species: 'Eagle', set: 'earth-fauna' },
  { id: 'wolf', species: 'Wolf', set: 'earth-fauna' },
  { id: 'elephant', species: 'Elephant', set: 'earth-fauna' },
  { id: 'sea-turtle', species: 'Sea Turtle', set: 'earth-fauna' },
  { id: 'great-white-shark', species: 'Great White Shark', set: 'earth-fauna' },
  { id: 'chameleon', species: 'Chameleon', set: 'earth-fauna' },
  { id: 'dragonfly', species: 'Dragonfly', set: 'earth-fauna' },
  { id: 'octopus', species: 'Octopus', set: 'earth-fauna' },
  { id: 'apple', species: 'Apple', set: 'earth-flora' },
  { id: 'vanilla-orchid', species: 'Vanilla Orchid', set: 'earth-flora' },
  { id: 'oyster-mushroom', species: 'Oyster Mushroom', set: 'earth-fungi' },
]);
const HYBRID_CACHE_IDS = Object.freeze(['dragonfly', 'eagle', 'elephant', 'fruit-bat', 'great-white-shark', 'wolf']);
const HYBRID_NEGATIVE_CONTROLS = Object.freeze({
  stripped_lineage_bypass: 'rejected for every hybrid stage',
  seed_only_cache_key: 'rejected by six same-seed/different-trait AB/BA pairs',
  carried_or_handwritten_lineage: 'rejected by exact input provenance and repeated production crosses',
  mixed_owner_marker_loss: 'rejected by exact _earthBlendKingdom lineage-owner checks',
  mixed_child_kingdom_route_bypass: 'rejected by owner-derived route checks in both parent orders and both child kingdoms',
  duplicate_name_owner_bypass: 'rejected by Green Algae markerless and counterfactual-owner pixel controls',
  visual_boundary: 'machine output remains UNREVIEWED',
});
const PACKAGE_SCOPE_CAVEATS = Object.freeze([
  'CURRENT-ONLY: every included source claim is bound to the one recorded clean commit; this package is not historical or longitudinal evidence.',
  'The hybrid matrix contains 12 representative Earth lineages, not every bloodline and not every possible future generation.',
  'There is no principal microbe five-stage lineage row in the representative hybrid matrix; mixed-owner Green Algae sentinels are controls, not a substitute.',
  'Low-anchor non-fauna hybrids may retain an exact Earth silhouette or ignore some reversed-parent trait differences and require human review.',
  'Apple remains in the principal matrix but is excluded from the cache-collision subset because equal expected pixels would make that negative control vacuous.',
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
  portrait: 60,
  card: 60,
  silhouette: 60,
  'lineage-sheet': 12,
  'join-atlas': 12,
  'cache-portrait': 12,
  'cache-sheet': 1,
  'mixed-portrait': 16,
  'mixed-sheet': 1,
});
const HYBRID_ASSETS = Object.values(HYBRID_KIND_COUNTS).reduce((sum, count) => sum + count, 0);
const FORBIDDEN_INPUT_ARTIFACT = /(?:^|[-_. ])(?:certif(?:y|ied|ication)?|certificate|verdicts?|ledger|results?|approvals?|sign[-_ ]?off)(?:[-_. ]|$)/i;

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function hashFile(file) { return sha256(fs.readFileSync(file)); }
function portable(value) { return value.split(path.sep).join('/'); }
function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
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
  for (const field of ['executable', 'product', 'revision', 'user_agent']) {
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

function validateCatalogue(rootValue) {
  const root = realDirectory(rootValue, 'catalogue root');
  const diskFiles = listFiles(root, 'catalogue');
  rejectForbiddenArtifacts(diskFiles, 'catalogue', new Set(['strict-verdict-schema.json']));
  const preparation = readJson(root, 'preparation.json');
  const identitiesRaw = readJson(root, 'identity-manifest.json');
  const portraitManifest = readJson(root, 'review-info/manifest.json');
  const index = readJson(root, 'index.json');
  const strictSchema = readJson(root, 'strict-verdict-schema.json');
  realFile(root, 'README.md', 'catalogue README');

  assert(preparation.schema === PREPARATION_SCHEMA, 'catalogue preparation: wrong schema');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(preparation.review_date), 'catalogue preparation: invalid review date');
  nonempty(preparation.output, 'catalogue preparation output');
  assert(preparation.source_ruler === 'GP7 fresh strict rejudge', 'catalogue preparation: wrong source ruler');
  assert(preparation.portraits === TOTAL && preparation.packets === CATALOGUE_PACKETS,
    'catalogue preparation: stale portrait/packet counts');
  assert(typeof preparation.note === 'string' && /No verdicts, results, or ledger are generated/.test(preparation.note),
    'catalogue preparation: non-verdict boundary is missing');
  assert(strictSchema.schema === 'cf.gp71.strict-verdict.v1'
    && strictSchema.no_verdicts_are_generated_by_prepare === true,
  'catalogue strict verdict schema: preparation boundary is missing');
  const commit = validateCapture(preparation.capture_provenance, 'catalogue preparation capture');
  const browser = validateBrowserRecord(preparation.browser, 'catalogue preparation browser');
  assert(identitiesRaw.schema === IDENTITY_SCHEMA && Array.isArray(identitiesRaw.rows), 'catalogue identity manifest: wrong schema/rows');
  assert(portraitManifest.schema === PORTRAIT_SCHEMA && Array.isArray(portraitManifest.files), 'catalogue portrait manifest: wrong schema/files');
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
    const relative = safeRelative(row.file, `${where}.file`, '.png');
    assert(relative.startsWith(`${row.set}/`), `${where}: file escaped set`);
    assert(!portraitByFile.has(relative), `${where}: duplicate file`);
    const record = { ...row, sha256: exactSha(row.sha256, `${where}.sha256`) };
    assert(row.width === 440 && row.height === 440 && Number.isInteger(row.bytes) && row.bytes >= 24,
      `${where}: stale native portrait dimensions/bytes`);
    portraitByFile.set(relative, record);
  }
  const identityByKey = new Map();
  const expectedFiles = new Set(['preparation.json', 'identity-manifest.json', 'index.json',
    'strict-verdict-schema.json', 'README.md', 'review-info/manifest.json']);
  for (const [offset, row] of identitiesRaw.rows.entries()) {
    const where = `catalogue identity row ${offset + 1}`;
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
    for (const [rowIndex, row] of packet.species.entries()) {
      const rowWhere = `${where} row ${rowIndex + 1}`;
      const set = nonempty(row.set, `${rowWhere}.set`);
      const name = nonempty(row.name, `${rowWhere}.name`);
      const identity = identityByKey.get(`${set}\u0000${name}`);
      assert(identity, `${rowWhere}: absent from identity manifest`);
      assert(row.image_file === identity.imageFile && row.sha256 === identity.sha256, `${rowWhere}: stale index portrait binding`);
      const mirror = packetJson.species[rowIndex];
      assert(mirror.set === set && mirror.name === name && mirror.image_file === identity.imageFile
        && mirror.sha256 === identity.sha256, `${rowWhere}: packet JSON binding mismatch`);
      const key = `${set}\u0000${name}`;
      assert(!indexedKeys.has(key), `${rowWhere}: duplicate indexed identity`);
      indexedKeys.add(key);
    }
    expectedFiles.add(strip); expectedFiles.add(markdown); expectedFiles.add(packetJsonPath);
  }
  assert(indexedKeys.size === TOTAL && [...roster.keys].every((key) => indexedKeys.has(key)), 'catalogue index: incomplete identity join');
  const frozenPartition = index.map((packet) => ({ id: packet.packet_id, family: packet.family,
    species: packet.species.map((row) => ({ set: row.set, name: row.name })) }));
  assert(exactSha(preparation.frozen_partition_sha256, 'catalogue frozen partition SHA-256')
    === sha256(JSON.stringify(frozenPartition)), 'catalogue preparation: stale frozen partition digest');
  assertExactInventory(diskFiles, expectedFiles, 'catalogue');
  return {
    root, files: diskFiles, commit, browser, capture: preparation.capture_provenance,
    identities: [...identityByKey.values()], identityByKey,
    identityManifestSha256: hashFile(path.join(root, 'identity-manifest.json')),
    portraitManifestSha256: hashFile(path.join(root, 'review-info', 'manifest.json')),
    preparationSha256: hashFile(path.join(root, 'preparation.json')),
  };
}

function validateMustReadContract(raw, set, species, where) {
  assert(isObject(raw), `${where}: missing must-read contract`);
  const expectedKeys = ['set', 'species', 'source', 'source_sha256', 'must_read', 'note', 'sha256'].sort(cmp);
  assert(sameJson(Object.keys(raw).sort(cmp), expectedKeys), `${where}: unexpected must-read keys`);
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
      const species = nonempty(row.species, `${rowWhere}.species`);
      nonempty(row.render_name, `${rowWhere}.render_name`); nonempty(row.family_source, `${rowWhere}.family_source`);
      assert(Number.isInteger(row.ordinal) && row.ordinal === rows.length + 1, `${rowWhere}: ordinal mismatch`);
      const identity = catalogue.identityByKey.get(`${set}\u0000${species}`);
      assert(identity, `${rowWhere}: absent from catalogue`);
      assert(row.image_file === identity.imageFile && row.sha256 === identity.sha256
        && row.bytes === identity.bytes && row.width === 440 && row.height === 440,
      `${rowWhere}: stale catalogue portrait binding`);
      validateMustReadContract(row.must_read_contract, set, species, `${rowWhere}.must_read_contract`);
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
    const name = nonempty(family.plan_family, 'layout procedural index plan_family');
    assert(!proceduralFamilyNames.has(name), `layout procedural index: duplicate plan family ${name}`);
    proceduralFamilyNames.add(name);
    return family.identities;
  });
  assert(proceduralRows.length === SETS.procedural, 'layout procedural index: expected 240 identities');
  const proceduralKeys = new Set();
  for (const [offset, row] of proceduralRows.entries()) {
    const where = `layout procedural index row ${offset + 1}`;
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
  assert(isObject(raw), `${where}: missing git provenance`);
  const head = nonempty(raw.head, `${where}.head`).toLowerCase();
  assert(head === expectedCommit && COMMIT.test(head), `${where}: source commit mismatch`);
  nonempty(raw.branch, `${where}.branch`);
  assert(raw.dirty === false && sameJson(raw.status_lines, []), `${where}: capture was not from a clean worktree`);
  assert(typeof raw.source_claim === 'string' && /Clean working tree/.test(raw.source_claim), `${where}: clean source claim missing`);
  return stableJson(raw);
}
function validateHybrid(rootValue, expectedCommit, expectedBrowser) {
  const root = realDirectory(rootValue, 'hybrid root');
  const diskFiles = listFiles(root, 'hybrid');
  rejectForbiddenArtifacts(diskFiles, 'hybrid');
  const manifest = readJson(root, 'manifest.json');
  realFile(root, 'README.md', 'hybrid README');
  assert(manifest.schema === HYBRID_SCHEMA, 'hybrid: wrong evidence schema');
  assert(manifest.review_status === 'UNREVIEWED' && manifest.visual_continuity_status === 'OPEN',
    'hybrid: evidence must remain UNREVIEWED with visual continuity OPEN');
  assert(manifest.machine_anchor_visual_status === 'OPEN_UNREVIEWED'
    || manifest.machine_anchor_visual_status === 'FAIL_BYTE_IDENTICAL_STAGES',
  'hybrid: machine state must be OPEN_UNREVIEWED or the disclosed byte-identical-stage failure');
  assert(typeof manifest.visual_claim === 'string' && /No seamlessness or art PASS/.test(manifest.visual_claim),
    'hybrid: no-visual-PASS boundary missing');
  assert(isObject(manifest.machine_observations) && manifest.machine_observations.required_human_verdict === true,
    'hybrid: required human verdict boundary missing');
  validateHybridBrowserRecord(manifest.browser, expectedBrowser, 'hybrid browser');
  assert(isObject(manifest.reload_check) && manifest.reload_check.passes === 2
    && manifest.reload_check.first_order === 'forward (AB first)'
    && manifest.reload_check.second_order === 'reverse (BA first)'
    && manifest.reload_check.identical === true,
  'hybrid: reload check must record two identical forward/reverse passes');
  exactSha(manifest.reload_check.stable_projection_sha256, 'hybrid reload stable projection SHA-256');
  assert(stableJson(manifest.negative_controls) === stableJson(HYBRID_NEGATIVE_CONTROLS),
    'hybrid: exact negative-control disclosures are missing or changed');
  assert(Array.isArray(manifest.residual_continuity_risks)
    && manifest.residual_continuity_risks.some((value) => /low-anchor|low anchors/i.test(value))
    && manifest.residual_continuity_risks.some((value) => /Apple.*cache/i.test(value)),
  'hybrid: low-anchor non-fauna / Apple cache residual-risk disclosures are missing');
  assert(isObject(manifest.summary) && manifest.summary.lineages === 12
    && manifest.summary.principal_portraits === 60 && manifest.summary.cache_controls === 6
    && manifest.summary.cache_portraits === 12 && manifest.summary.mixed_kingdom_sentinels === 16
    && manifest.summary.mixed_portraits === 16 && manifest.summary.assets === HYBRID_ASSETS,
  'hybrid: stale summary counts');
  assert(sameJson(manifest.stage_order, STAGES) && sameJson(manifest.anchor_contract, ANCHORS),
    'hybrid: stage/anchor contract changed');
  assert(isObject(manifest.git), 'hybrid: git provenance missing');
  const startGit = validateHybridGit(manifest.git.start, 'hybrid git start', expectedCommit);
  assert(validateHybridGit(manifest.git.end, 'hybrid git end', expectedCommit) === startGit
    && manifest.git.status_changed_during_capture === false, 'hybrid: git state changed during capture');
  assert(isObject(manifest.source_snapshot) && Array.isArray(manifest.source_snapshot.files)
    && manifest.source_snapshot.files.length > 0, 'hybrid: source snapshot missing');
  const snapshotPaths = new Set();
  const snapshotRows = manifest.source_snapshot.files;
  for (const [offset, row] of snapshotRows.entries()) {
    const where = `hybrid source snapshot row ${offset + 1}`;
    const relative = safeRelative(row.file, `${where}.file`);
    assert(!snapshotPaths.has(relative), `${where}: duplicate source path`); snapshotPaths.add(relative);
    assert(Number.isInteger(row.bytes) && row.bytes >= 0, `${where}: invalid bytes`);
    exactSha(row.sha256, `${where}.sha256`);
  }
  assert(sameJson(snapshotRows.map((row) => row.file), [...snapshotRows.map((row) => row.file)].sort(cmp)),
    'hybrid: source snapshot paths are not sorted');
  const sourceSnapshotDigest = sha256(snapshotRows.map((row) => `${row.file}\u0000${row.bytes}\u0000${row.sha256}\n`).join(''));
  assert(manifest.source_snapshot.sha256 === sourceSnapshotDigest, 'hybrid: stale source snapshot digest');

  assert(Array.isArray(manifest.assets) && manifest.assets.length === HYBRID_ASSETS,
    'hybrid: expected 234 assets');
  const assetsByPath = new Map();
  const kindCounts = Object.fromEntries(Object.keys(HYBRID_KIND_COUNTS).map((kind) => [kind, 0]));
  const expectedFiles = new Set(['README.md', 'manifest.json']);
  for (const [offset, row] of manifest.assets.entries()) {
    const where = `hybrid asset ${offset + 1}`;
    assert(isObject(row) && row.kind in kindCounts, `${where}: invalid kind`);
    const relative = safeRelative(row.path, `${where}.path`, '.png');
    assert(!assetsByPath.has(relative), `${where}: duplicate asset path`);
    nonempty(row.identity, `${where}.identity`);
    const expectedDimensions = expectedHybridDimensions(row.kind);
    const disk = verifyPngFile(root, relative, row, where, expectedDimensions);
    assetsByPath.set(relative, { ...row, sha256: disk.sha256 });
    kindCounts[row.kind]++; expectedFiles.add(relative);
  }
  assert(sameJson(kindCounts, HYBRID_KIND_COUNTS), `hybrid: stale kind counts ${JSON.stringify(kindCounts)}`);

  assert(Array.isArray(manifest.lineages) && manifest.lineages.length === HYBRID_LINEAGES.length,
    'hybrid: expected 12 representative lineages');
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
    const id = nonempty(lineage.lineage_id, `${where}.lineage_id`);
    assert(id === expectedLineage.id && lineage.species === expectedLineage.species
      && lineage.set === expectedLineage.set && lineage.ordinal === offset + 1,
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
          && stage.genome._anchorVal === undefined && /^named-(owned|verbatim)$/.test(stage.route)
          && stage.stripped_lineage_control === null,
        `${stageWhere}: pure named-lineage provenance/route is missing`);
        assert(stage.genome_sha256 === inputById.get('pure').genome_sha256,
          `${stageWhere}: pure stage does not equal the exact pure input`);
      } else {
        assert(stage.genome._earthName === undefined && stage.genome._earthBlend === expectedLineage.species
          && stage.genome._earthBlendKingdom === expectedLineage.set.slice('earth-'.length)
          && /^lineage-(owned|verbatim)$/.test(stage.route),
        `${stageWhere}: inherited hybrid lineage/anchor/route provenance is missing`);
        productionAnchor(stage.genome._anchorVal, ANCHORS[stageIndex], `${stageWhere}.genome._anchorVal`);
        assert(isObject(stage.stripped_lineage_control)
          && stage.stripped_lineage_control.differs_from_lineage === true
          && /^procedural-(owned|verbatim)$/.test(stage.stripped_lineage_control.route)
          && SHA.test(stage.stripped_lineage_control.portrait_sha256),
        `${stageWhere}: stripped-lineage negative control is missing`);
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
    assert(row.lineage_id === HYBRID_CACHE_IDS[offset], `${where}: identity/order changed`);
    const lineageSpec = HYBRID_LINEAGES.find((lineage) => lineage.id === row.lineage_id);
    assert(row.species === lineageSpec.species && row.same_seed === true
      && row.different_full_genomes === true && row.cache_independent === true,
    `${where}: identity or cache-independence flags are missing`);
    assert(row.input_order_first === 'AB' || row.input_order_first === 'BA', `${where}: render order is missing`);
    assert(isObject(row.ab_genome) && isObject(row.ba_genome), `${where}: full AB/BA genomes are missing`);
    assert(exactSha(row.ab_genome_sha256, `${where}.ab_genome_sha256`) === sha256(stableJson(row.ab_genome))
      && exactSha(row.ba_genome_sha256, `${where}.ba_genome_sha256`) === sha256(stableJson(row.ba_genome)),
    `${where}: stale AB/BA full-genome SHA-256`);
    assert(row.ab_genome_sha256 !== row.ba_genome_sha256
      && row.ab_genome.seed === row.ba_genome.seed && row.seed === row.ab_genome.seed,
    `${where}: same-seed/different-full-genome contract failed`);
    assert(Array.isArray(row.differing_fields) && row.differing_fields.length > 0,
      `${where}: differing inherited fields are missing`);
    assert(Array.isArray(row.ab_genome.parents) && Array.isArray(row.ba_genome.parents)
      && row.ab_genome.parents[0] === row.ba_genome.parents[1]
      && row.ab_genome.parents[1] === row.ba_genome.parents[0],
    `${where}: AB/BA parent seed order is not reversed`);
    const owner = lineageSpec.set.slice('earth-'.length);
    assert(row.ab_genome._earthBlend === row.species && row.ba_genome._earthBlend === row.species
      && row.ab_genome._earthBlendKingdom === owner && row.ba_genome._earthBlendKingdom === owner
      && /^lineage-(owned|verbatim)$/.test(row.ab_route)
      && /^lineage-(owned|verbatim)$/.test(row.ba_route),
    `${where}: AB/BA lineage owner, anchor, or production route is missing`);
    productionAnchor(row.ab_genome._anchorVal, 0.73, `${where}.ab_genome._anchorVal`);
    productionAnchor(row.ba_genome._anchorVal, 0.73, `${where}.ba_genome._anchorVal`);
    const ab = assetsByPath.get(safeRelative(row.ab_portrait_path, `${where}.ab_portrait_path`, '.png'));
    const ba = assetsByPath.get(safeRelative(row.ba_portrait_path, `${where}.ba_portrait_path`, '.png'));
    assert(ab?.kind === 'cache-portrait' && ba?.kind === 'cache-portrait'
      && ab.sha256 === row.ab_portrait_sha256 && ba.sha256 === row.ba_portrait_sha256,
    `${where}: stale cache portrait binding`);
    assert(ab.identity === `${row.lineage_id}|AB` && ba.identity === `${row.lineage_id}|BA`,
      `${where}: cache asset identity binding mismatch`);
    cacheReviewRows.push({ lineage_id: row.lineage_id, species: row.species,
      ab_portrait_path: row.ab_portrait_path, ab_portrait_sha256: ab.sha256,
      ba_portrait_path: row.ba_portrait_path, ba_portrait_sha256: ba.sha256 });
  }
  assert(Array.isArray(manifest.mixed_kingdom_sentinels) && manifest.mixed_kingdom_sentinels.length === 16,
    'hybrid: expected 16 mixed-kingdom sentinels');
  for (const [offset, row] of manifest.mixed_kingdom_sentinels.entries()) {
    const where = `hybrid mixed sentinel ${offset + 1}`;
    assert(row.visual_review_status === 'UNREVIEWED', `${where}: carried visual verdict is forbidden`);
    const sentinelId = nonempty(row.sentinel_id, `${where}.sentinel_id`);
    const species = nonempty(row.species, `${where}.species`);
    const owner = nonempty(row.selected_lineage_owner, `${where}.selected_lineage_owner`);
    assert(['fauna', 'flora', 'fungi', 'microbe'].includes(owner), `${where}: invalid selected lineage owner`);
    assert(isObject(row.child_genome)
      && exactSha(row.child_genome_sha256, `${where}.child_genome_sha256`) === sha256(stableJson(row.child_genome)),
    `${where}: stale child full-genome SHA-256`);
    assert(row.child_genome._earthName === undefined && row.child_genome._earthBlend === species
      && row.child_genome._earthBlendKingdom === owner && isObject(row.child_genome._src)
      && row.lineage === species && row.lineage_kingdom === owner
      && row.child_kingdom === row.child_genome.kingdom,
    `${where}: selected-owner child lineage provenance is missing`);
    const expectedRoute = owner === 'fauna' ? 'lineage-verbatim' : 'lineage-owned';
    assert(row.route === expectedRoute && row.expected_route === expectedRoute,
      `${where}: production route does not follow the selected lineage owner`);
    assert(row.production_matches_fresh === true && row.repeated_render_stable === true
      && row.repeated_cross_stable === true,
    `${where}: fresh/repeat production outcomes are missing`);
    const asset = assetsByPath.get(safeRelative(row.portrait_path, `${where}.portrait_path`, '.png'));
    assert(asset?.kind === 'mixed-portrait' && asset.sha256 === row.portrait_sha256,
      `${where}: stale mixed portrait binding`);
    assert(asset.identity === sentinelId, `${where}: mixed asset identity binding mismatch`);
    mixedReviewRows.push({ sentinel_id: sentinelId, species, selected_lineage_owner: owner,
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

function validateInputs(catalogueValue, layoutValue, hybridValue) {
  const roots = [realDirectory(catalogueValue, 'catalogue root'), realDirectory(layoutValue, 'layout root'),
    realDirectory(hybridValue, 'hybrid root')];
  for (let left = 0; left < roots.length; left++) for (let right = left + 1; right < roots.length; right++) {
    assert(!within(roots[left], roots[right]) && !within(roots[right], roots[left]),
      `input roots must be distinct and non-overlapping: ${portable(roots[left])} / ${portable(roots[right])}`);
  }
  const catalogue = validateCatalogue(roots[0]);
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
    'Included evidence:', '',
    '- `catalogue/`: 1,250 native portraits (631 fauna, 332 flora, 27 fungi, 20 microbe, 240 procedural) and 196 GP7.1 capture packets.',
    '- `layout/`: 181 exact set/family groups, 233 review packets, and 466 labelled/unlabelled packet sheets.',
    `- \`hybrid/\`: 12 representative lineages × 5 production stages, cache and mixed-kingdom controls, and 234 hash-bound assets. Machine state: ${inputs.hybrid.machineStatus}.`,
    `- Physical PNG inventory: exactly ${PHYSICAL_PNG_COUNTS.total} = 1,250 catalogue portraits + 196 catalogue strips + 466 layout sheets + 234 hybrid assets.`,
    '- `hybrid-review-template.json`: blank review fields bound to the packaged hybrid manifest and asset hashes.',
    '- `package-manifest.json`: records and hashes every copied/input payload plus the top README and blank template.',
    '- `SHA256SUMS`: hashes every other extracted file, including `package-manifest.json`; it excludes only itself. The external ZIP SHA-256 sidecar binds the complete archive including `SHA256SUMS`.', '',
    'Review boundary and caveats:', '',
    ...PACKAGE_SCOPE_CAVEATS.map((value) => `- ${value}`),
    '- Hybrid visual continuity remains OPEN and requires a human verdict.',
    '- A disclosed `FAIL_BYTE_IDENTICAL_STAGES` machine state is preserved, never converted into OPEN or PASS.',
    '- Silhouette and crop diagnostics are aids, not authoritative masks or visual verdicts.',
    '- No verdict, result, ledger, certificate, approval, or sign-off artifact from an input is accepted into this package.',
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
function buildPackageManifest(inputs, topName, files, templateSha256) {
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
    counts: {
      catalogue: { portraits: TOTAL, sets: SETS, capture_packets: CATALOGUE_PACKETS },
      layout: { families: LAYOUT_FAMILIES, packets: LAYOUT_PACKETS, sheets: LAYOUT_SHEETS },
      hybrid: { lineages: 12, stages_per_lineage: 5, assets: HYBRID_ASSETS,
        machine_anchor_visual_status: inputs.hybrid.machineStatus, visual_continuity_status: 'OPEN' },
      physical_pngs: PHYSICAL_PNG_COUNTS,
    },
    input_bindings: {
      browser_provenance: inputs.catalogue.browser,
      catalogue_preparation_sha256: inputs.catalogue.preparationSha256,
      catalogue_identity_manifest_sha256: inputs.catalogue.identityManifestSha256,
      catalogue_portrait_manifest_sha256: inputs.catalogue.portraitManifestSha256,
      layout_plan_sha256: inputs.layout.planSha256,
      layout_packet_manifest_sha256: inputs.layout.packetManifestSha256,
      layout_catalogue_sha256: inputs.layout.catalogueDigest,
      hybrid_manifest_sha256: inputs.hybrid.manifestSha256,
      hybrid_asset_aggregate_sha256: inputs.hybrid.assetAggregateSha256,
      hybrid_review_template_sha256: templateSha256,
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
    && readme.includes('12 representative lineages')
    && readme.includes('not every bloodline and not every possible future generation')
    && readme.includes('no principal microbe five-stage lineage row')
    && /Low-anchor non-fauna/i.test(readme) && /Apple.*cache-collision subset/i.test(readme),
  'package README: current-only/status/representative-lineage caveats are incomplete');
  assert(!/full[- ]generations?/i.test(readme) && !/full[- ]generations?/i.test(manifest.purpose),
    'package: unqualified full-generation language is forbidden');
}
function validatePhysicalPngCounts(manifest, files) {
  assert(stableJson(manifest.counts?.physical_pngs) === stableJson(PHYSICAL_PNG_COUNTS),
    'package manifest: physical PNG inventory must be exactly 2,146 with the declared breakdown');
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
  assert(Array.isArray(template.lineages) && template.lineages.length === 12
    && Array.isArray(template.stages) && template.stages.length === 60
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
  const readme = fs.readFileSync(realFile(root, 'README.md', 'package README'), 'utf8');
  validatePackageScope(manifest, readme);
  assert(manifest.top_level_directory === expectedTopName && COMMIT.test(manifest.source_commit),
    'package manifest: wrong top-level name/source commit');
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
  const packageBrowser = validateBrowserRecord(manifest.input_bindings?.browser_provenance,
    'package manifest browser provenance');
  const template = verifyBlankTemplate(root, manifest, manifest.input_bindings.hybrid_manifest_sha256,
    manifest.input_bindings.hybrid_asset_aggregate_sha256);
  if (options.deep !== false) {
    const catalogue = validateCatalogue(path.join(root, 'catalogue'));
    assert(catalogue.commit === manifest.source_commit, 'extracted catalogue: source commit mismatch');
    assert(stableJson(catalogue.browser) === stableJson(packageBrowser),
      'extracted catalogue: browser provenance mismatch');
    const layout = validateLayout(path.join(root, 'layout'), catalogue);
    const hybrid = validateHybrid(path.join(root, 'hybrid'), catalogue.commit, catalogue.browser);
    assert(manifest.input_bindings.catalogue_preparation_sha256 === catalogue.preparationSha256
      && manifest.input_bindings.catalogue_identity_manifest_sha256 === catalogue.identityManifestSha256
      && manifest.input_bindings.catalogue_portrait_manifest_sha256 === catalogue.portraitManifestSha256
      && manifest.input_bindings.layout_plan_sha256 === layout.planSha256
      && manifest.input_bindings.layout_packet_manifest_sha256 === layout.packetManifestSha256
      && manifest.input_bindings.layout_catalogue_sha256 === layout.catalogueDigest
      && manifest.input_bindings.hybrid_manifest_sha256 === hybrid.manifestSha256
      && manifest.input_bindings.hybrid_asset_aggregate_sha256 === hybrid.assetAggregateSha256,
    'package manifest: extracted input bindings are stale');
    assert(stableJson(template) === stableJson(buildHybridReviewTemplate(hybrid, catalogue.commit)),
      'hybrid review template: hash-bound evidence rows are stale');
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
function safeRemoveOwnedDirectory(directory, parent, prefix) {
  if (!directory || !fs.existsSync(directory)) return;
  const resolved = path.resolve(directory);
  const stat = fs.lstatSync(resolved);
  assert(path.dirname(resolved) === path.resolve(parent) && path.basename(resolved).startsWith(prefix)
    && stat.isDirectory() && !stat.isSymbolicLink(), `refusing unsafe temporary cleanup: ${portable(resolved)}`);
  fs.rmSync(resolved, { recursive: true, force: true });
}
function verifyArchive(output, topName, parent) {
  const extraction = fs.mkdtempSync(path.join(parent, '.current-review-extract-'));
  try {
    extractZip(output, extraction);
    const topEntries = fs.readdirSync(extraction, { withFileTypes: true });
    assert(topEntries.length === 1 && topEntries[0].name === topName && topEntries[0].isDirectory()
      && !topEntries[0].isSymbolicLink(), 'archive must contain exactly one expected top-level directory');
    const root = realDirectory(path.join(extraction, topName), 'extracted top-level directory');
    return verifyPackagedTree(root, topName);
  } finally { safeRemoveOwnedDirectory(extraction, parent, '.current-review-extract-'); }
}
function buildPackage(options) {
  const inputs = validateInputs(options.catalogue, options.layout, options.hybrid);
  const target = validateOutput(options.output, [inputs.catalogue.root, inputs.layout.root, inputs.hybrid.root]);
  const stage = fs.mkdtempSync(path.join(target.parent, '.current-review-stage-'));
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
      hashFile(path.join(packageRoot, 'hybrid-review-template.json')));
    writeJsonExclusive(path.join(packageRoot, 'package-manifest.json'), manifest);
    writeSha256Sums(packageRoot);
    verifyPackagedTree(packageRoot, target.topName);
    zipDirectory(stage, target.topName, stagedZip);
    verifyArchive(stagedZip, target.topName, target.parent);
    assert(!fs.existsSync(target.output), 'output appeared during staging');
    fs.copyFileSync(stagedZip, target.output, fs.constants.COPYFILE_EXCL); createdZip = true;
    assert(hashFile(stagedZip) === hashFile(target.output), 'staged/final ZIP copy verification failed');
    const zipHash = hashFile(target.output);
    writeExclusive(target.sidecar, `${zipHash}  ${path.basename(target.output)}\n`); createdSidecar = true;
    assert(fs.readFileSync(target.sidecar, 'utf8') === `${zipHash}  ${path.basename(target.output)}\n`,
      'ZIP SHA-256 sidecar verification failed');
    assert(hashFile(target.output) === zipHash, 'final ZIP changed while its SHA-256 sidecar was written');
    return { output: target.output, sidecar: target.sidecar, sha256: zipHash,
      bytes: fs.statSync(target.output).size, sourceCommit: inputs.catalogue.commit };
  } catch (error) {
    if (createdSidecar && fs.existsSync(target.sidecar)) fs.unlinkSync(target.sidecar);
    if (createdZip && fs.existsSync(target.output)) fs.unlinkSync(target.output);
    throw error;
  } finally { safeRemoveOwnedDirectory(stage, target.parent, '.current-review-stage-'); }
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
  const capture = fixtureCapture(commit); const identities = []; const files = [];
  for (const [set, count] of Object.entries(SETS)) for (let index = 1; index <= count; index++) {
    const species = `${set} species ${String(index).padStart(3, '0')}`;
    const image = `${set}/${String(index).padStart(3, '0')}.png`;
    const buffer = fakePng(440, 440, `${set}-${index}`);
    mkdirWrite(path.join(root, 'portraits', ...image.split('/')), buffer);
    const hash = sha256(buffer);
    identities.push({ set, species, render_name: species, image_file: image, sha256: hash });
    files.push({ set, file: image, sha256: hash, bytes: buffer.length, width: 440, height: 440 });
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
    mkdirWrite(path.join(directory, 'packet.md'), `# Fixture packet ${packet.packet_id}\n`);
    mkdirWrite(path.join(directory, 'packet.json'), JSON.stringify({ schema: PACKET_SCHEMA,
      packet_id: packet.packet_id, family: packet.family, review_date: '2026-08-10',
      source_ruler: 'GP7 fresh strict rejudge', strip: stripPath, strip_sha256: stripHash,
      species: packet.species.map((row) => ({ set: row.set, name: row.species, render_name: row.render_name,
        image_file: row.image_file, sha256: row.sha256 })) }, null, 2) + '\n');
  }
  const frozenPartition = indexRows.map((packet) => ({ id: packet.packet_id, family: packet.family,
    species: packet.species.map((row) => ({ set: row.set, name: row.name })) }));
  const preparation = { schema: PREPARATION_SCHEMA, review_date: '2026-08-10',
    source_ruler: 'GP7 fresh strict rejudge', output: 'selftest',
    current_source_identity_sha256: sha256(JSON.stringify(identities)),
    frozen_partition_sha256: sha256(JSON.stringify(frozenPartition)),
    packets: CATALOGUE_PACKETS, portraits: TOTAL,
    note: 'Prepared from one current audit render. No verdicts, results, or ledger are generated by --prepare.',
    browser: FIXTURE_BROWSER, capture_provenance: capture };
  mkdirWrite(path.join(root, 'preparation.json'), JSON.stringify(preparation, null, 2) + '\n');
  mkdirWrite(path.join(root, 'identity-manifest.json'), JSON.stringify({ schema: IDENTITY_SCHEMA,
    capture_provenance: capture, rows: identities }, null, 2) + '\n');
  mkdirWrite(path.join(root, 'review-info', 'manifest.json'), JSON.stringify({ schema: PORTRAIT_SCHEMA,
    capture_provenance: capture, portraits: TOTAL, sets: SETS, files }, null, 2) + '\n');
  mkdirWrite(path.join(root, 'index.json'), JSON.stringify(indexRows, null, 2) + '\n');
  mkdirWrite(path.join(root, 'strict-verdict-schema.json'), JSON.stringify({ schema: 'cf.gp71.strict-verdict.v1',
    no_verdicts_are_generated_by_prepare: true }, null, 2) + '\n');
  mkdirWrite(path.join(root, 'README.md'), '# UNREVIEWED fixture catalogue\n');
  return { identities, files };
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
            source_sha256: sourceSha, must_read: ['Inspect exact structure.'], note: '' };
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
    catalogue_sha256: digest, source_revision: revision, sources };
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
      { seed: lineageIndex * 100, kingdom, _earthName: lineageSpec.species },
      { seed: lineageIndex * 100 + 50, kingdom, _earthName: lineageSpec.species },
      { seed: lineageIndex * 100 + 61, kingdom: 'fixture-alien-1' },
      { seed: lineageIndex * 100 + 62, kingdom: 'fixture-alien-2' },
      { seed: lineageIndex * 100 + 63, kingdom: 'fixture-alien-3' },
    ];
    const inputIds = ['pure', 'earth-mate', 'alien-1', 'alien-2', 'alien-3'];
    const inputs = inputGenomes.map((genome, inputIndex) => ({ id: inputIds[inputIndex], genome,
      genome_sha256: sha256(stableJson(genome)), derivation: { kind: `fixture-${inputIds[inputIndex]}` } }));
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
          parents, _src: { fixture: true } };
      stages.push({ identity: `${id}|${stageId}`, stage_id: stageId, stage_index: stageIndex,
        anchor: ANCHORS[stageIndex], genome, genome_sha256: sha256(stableJson(genome)),
        route: stageIndex === 0 ? 'named-owned' : 'lineage-owned',
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
      inherited_trait: 'AB', _earthBlend: lineageSpec.species, _earthBlendKingdom: 'fauna', _anchorVal: 0.73 };
    const baGenome = { seed, kingdom: 'fauna', parents: [200 + index, 100 + index],
      inherited_trait: 'BA', _earthBlend: lineageSpec.species, _earthBlendKingdom: 'fauna', _anchorVal: 0.73 };
    const ab = add(`cache-controls/${lineageId}-AB.png`, 'cache-portrait', `${lineageId}|AB`, 440, 440);
    const ba = add(`cache-controls/${lineageId}-BA.png`, 'cache-portrait', `${lineageId}|BA`, 440, 440);
    cacheControls.push({ lineage_id: lineageId, species: lineageSpec.species, seed,
      same_seed: true, different_full_genomes: true, cache_independent: true, input_order_first: 'AB',
      differing_fields: ['inherited_trait', 'parents'], ab_genome: abGenome, ba_genome: baGenome,
      ab_genome_sha256: sha256(stableJson(abGenome)), ba_genome_sha256: sha256(stableJson(baGenome)),
      ab_route: 'lineage-verbatim', ba_route: 'lineage-verbatim',
      ab_portrait_path: ab.path, ab_portrait_sha256: ab.sha256,
      ba_portrait_path: ba.path, ba_portrait_sha256: ba.sha256 });
  }
  add('cache-controls/cache-sheet.png', 'cache-sheet', 'cache-controls', 680, 1534);
  const mixed = [];
  for (let index = 1; index <= 16; index++) {
    const id = `sentinel-${String(index).padStart(2, '0')}`;
    const species = `Fixture sentinel species ${index}`;
    const owner = index % 2 ? 'fauna' : 'flora';
    const childGenome = { seed: 7000 + index, kingdom: index % 3 ? 'fauna' : 'flora',
      parents: [8000 + index, 9000 + index], _earthBlend: species, _earthBlendKingdom: owner,
      _anchorVal: owner === 'fauna' ? 0.73 : 0.9, _src: { fixture: true } };
    const portrait = add(`mixed-kingdom/${String(index).padStart(2, '0')}-${id}.png`, 'mixed-portrait', id, 440, 440);
    const route = owner === 'fauna' ? 'lineage-verbatim' : 'lineage-owned';
    mixed.push({ ordinal: index, sentinel_id: id, species, selected_lineage_owner: owner,
      child_genome: childGenome, child_genome_sha256: sha256(stableJson(childGenome)),
      lineage: species, lineage_kingdom: owner, child_kingdom: childGenome.kingdom,
      route, expected_route: route, production_matches_fresh: true, repeated_render_stable: true,
      repeated_cross_stable: true, portrait_path: portrait.path,
      portrait_sha256: portrait.sha256, visual_review_status: 'UNREVIEWED' });
  }
  const mixedSheet = add('mixed-kingdom/sentinels-sheet.png', 'mixed-sheet', 'mixed-sentinels', 880, 1160);
  const snapshotFiles = [{ file: 'package.json', bytes: 10, sha256: sha256('package') },
    { file: 'tools/hybridmatrix.mjs', bytes: 20, sha256: sha256('tool') }];
  const sourceSnapshot = { files: snapshotFiles,
    sha256: sha256(snapshotFiles.map((row) => `${row.file}\u0000${row.bytes}\u0000${row.sha256}\n`).join('')) };
  const gitState = { head: commit, branch: 'openai/selftest', dirty: false, status_lines: [],
    source_claim: 'Clean working tree at the recorded commit.' };
  const manifest = { schema: HYBRID_SCHEMA, review_status: 'UNREVIEWED', visual_continuity_status: 'OPEN',
    machine_anchor_visual_status: 'OPEN_UNREVIEWED',
    visual_claim: 'No seamlessness or art PASS is awarded by this evidence tool.',
    browser: { executable: FIXTURE_BROWSER.executable, product: FIXTURE_BROWSER.product,
      revision: FIXTURE_BROWSER.revision, user_agent: FIXTURE_BROWSER.user_agent },
    git: { start: gitState, end: gitState, status_changed_during_capture: false }, source_snapshot: sourceSnapshot,
    reload_check: { passes: 2, first_order: 'forward (AB first)', second_order: 'reverse (BA first)',
      stable_projection_sha256: sha256('stable fixture projection'), identical: true },
    negative_controls: HYBRID_NEGATIVE_CONTROLS,
    residual_continuity_risks: [
      'A low-anchor non-fauna hybrid may retain an exact Earth silhouette or ignore reversed-parent traits.',
      'Apple is excluded from the cache subset because equal expected pixels would make the control vacuous.',
    ],
    machine_observations: { byte_identical_anchor_lineages: [], required_human_verdict: true },
    summary: { lineages: 12, principal_portraits: 60, cache_controls: 6, cache_portraits: 12,
      mixed_kingdom_sentinels: 16, mixed_portraits: 16, assets: HYBRID_ASSETS },
    stage_order: STAGES, anchor_contract: ANCHORS, lineages, cache_controls: cacheControls,
    mixed_kingdom_sentinels: mixed, mixed_sentinel_sheet: mixedSheet.path, assets };
  mkdirWrite(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  mkdirWrite(path.join(root, 'README.md'), '# UNREVIEWED hybrid fixture\n');
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
    const commit = 'a'.repeat(40); const catalogue = path.join(temp, 'catalogue');
    const layout = path.join(temp, 'layout'); const hybrid = path.join(temp, 'hybrid');
    fs.mkdirSync(catalogue); fs.mkdirSync(layout); fs.mkdirSync(hybrid);
    const catalogueRows = fixtureIdentities(catalogue, commit);
    fixtureLayout(layout, catalogue, catalogueRows, commit); fixtureHybrid(hybrid, commit);
    const output = path.join(temp, 'current-review-selftest.zip');
    const result = buildPackage({ catalogue, layout, hybrid, output });
    assert(fs.existsSync(result.output) && fs.existsSync(result.sidecar), 'selftest positive package/sidecar missing');
    console.log('  positive control: create, extract, deep reverify - PASS');
    const negativeExtract = path.join(temp, 'negative-package-extract'); fs.mkdirSync(negativeExtract);
    extractZip(output, negativeExtract);
    const negativePackageRoot = path.join(negativeExtract, 'current-review-selftest');
    const packageManifest = readJson(negativePackageRoot, 'package-manifest.json', 'selftest package manifest');
    const packageReadme = fs.readFileSync(path.join(negativePackageRoot, 'README.md'), 'utf8');
    const staleScope = structuredClone(packageManifest); staleScope.evidence_scope = 'HISTORICAL_OR_MIXED';
    expectFailure('CURRENT-ONLY scope', () => validatePackageScope(staleScope, packageReadme), /CURRENT-ONLY/);
    const staleStatus = structuredClone(packageManifest); staleStatus.package_status = 'REVIEWED';
    expectFailure('package status', () => validatePackageScope(staleStatus, packageReadme), /UNREVIEWED/);
    const stalePngInventory = structuredClone(packageManifest); stalePngInventory.counts.physical_pngs.total--;
    expectFailure('physical PNG inventory', () => validatePhysicalPngCounts(stalePngInventory, stalePngInventory.files), /2,146/);
    expectFailure('existing output', () => buildPackage({ catalogue, layout, hybrid, output }), /already exists/);
    expectFailure('overlapping input roots', () => validateInputs(catalogue, catalogue, hybrid), /distinct and non-overlapping/);
    expectFailure('input/output overlap', () => validateOutput(path.join(catalogue, 'nested-output.zip'),
      [catalogue, layout, hybrid]), /must not overlap/);
    const forbiddenArtifact = path.join(catalogue, 'results.json');
    fs.writeFileSync(forbiddenArtifact, '{}\n');
    expectFailure('verdict/certification artifact', () => validateCatalogue(catalogue), /artifact is forbidden/);
    fs.unlinkSync(forbiddenArtifact);

    const missingFile = path.join(catalogue, 'portraits', catalogueRows.identities[0].image_file);
    const missingBytes = fs.readFileSync(missingFile); fs.unlinkSync(missingFile);
    expectFailure('missing source asset', () => validateCatalogue(catalogue), /missing|inventory/i);
    mkdirWrite(missingFile, missingBytes);

    const packetManifestPath = path.join(layout, 'packet-manifest.json');
    const packetManifest = JSON.parse(fs.readFileSync(packetManifestPath, 'utf8'));
    const staleFile = path.join(layout, ...packetManifest.files[0].file.split('/'));
    const staleBytes = fs.readFileSync(staleFile); fs.appendFileSync(staleFile, 'stale');
    expectFailure('stale disk hash', () => validateLayout(layout, validateCatalogue(catalogue)), /stale|SHA/i);
    fs.writeFileSync(staleFile, staleBytes);

    const layoutPlanPath = path.join(layout, 'plan.json');
    const layoutPlanText = fs.readFileSync(layoutPlanPath, 'utf8');
    const layoutPlan = JSON.parse(layoutPlanText); layoutPlan.packet_size = 11;
    fs.writeFileSync(layoutPlanPath, JSON.stringify(layoutPlan, null, 2) + '\n');
    expectFailure('official layout packet size', () => validateLayout(layout, validateCatalogue(catalogue)), /packet_size/);
    fs.writeFileSync(layoutPlanPath, layoutPlanText);

    const layoutPacketManifestText = fs.readFileSync(packetManifestPath, 'utf8');
    const staleBrowser = JSON.parse(layoutPacketManifestText); staleBrowser.browser.revision = 'different-browser-revision';
    fs.writeFileSync(packetManifestPath, JSON.stringify(staleBrowser, null, 2) + '\n');
    expectFailure('browser provenance equality', () => validateLayout(layout, validateCatalogue(catalogue)), /browser provenance/);
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
    const staleAnchor = JSON.parse(hybridManifestText);
    staleAnchor.lineages[0].stages[3].genome._anchorVal = 0.5;
    staleAnchor.lineages[0].stages[3].genome_sha256 =
      sha256(stableJson(staleAnchor.lineages[0].stages[3].genome));
    fs.writeFileSync(hybridManifestPath, JSON.stringify(staleAnchor, null, 2) + '\n');
    expectFailure('hybrid production anchor', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER),
      /production anchor differs/);
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
    const hybridManifest = JSON.parse(hybridManifestText); hybridManifest.review_status = 'CERTIFIED';
    fs.writeFileSync(hybridManifestPath, JSON.stringify(hybridManifest, null, 2) + '\n');
    expectFailure('certification status', () => validateHybrid(hybrid, commit, FIXTURE_BROWSER), /UNREVIEWED|OPEN/);
    fs.writeFileSync(hybridManifestPath, hybridManifestText);
    console.log('CURRENT REVIEW PACKAGE SELFTEST PASS');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}

function parseArgs(argv) {
  const options = {};
  for (const arg of argv) {
    if (arg === '--selftest') options.selftest = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else {
      const match = /^--(catalogue|layout|hybrid|output)=(.+)$/.exec(arg);
      assert(match, `unknown/incomplete argument: ${arg}`);
      assert(options[match[1]] === undefined, `duplicate --${match[1]}`);
      options[match[1]] = match[2];
    }
  }
  return options;
}
function usage() {
  console.log('Usage: node tools/currentreviewpackage.mjs --catalogue=<gp71-prepare-root> --layout=<fullresetlayout-root> --hybrid=<hybridmatrix-root> --output=<new.zip>');
  console.log('       node tools/currentreviewpackage.mjs --selftest');
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) usage();
  else if (options.selftest) {
    assert(Object.keys(options).length === 1, '--selftest cannot be combined with packaging arguments'); selftest();
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
