/* fullresetlayout.mjs - fail-closed catalogue layout for the full art reset.

   This tool does not render game art and does not read or mutate any historical
   GP7/GP7.1 verdict. It accepts one explicit, immutable portrait-evidence root,
   verifies all 1,250 current identities and source pixels, then organizes those
   exact identities into deterministic family packets for a new review.

   Usage:
     node tools/fullresetlayout.mjs --verify --evidence=<evidence-root>
     node tools/fullresetlayout.mjs --prepare --evidence=<evidence-root> \
       --out=<new-output-directory> [--per=10] [--packets]
     node tools/fullresetlayout.mjs --selftest

   `--prepare` writes only to a new output directory. `--packets` additionally
   creates labelled and unlabelled PNG contact sheets from the already-verified
   source portraits. Neither mode creates verdicts or changes its inputs.
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const repositoryRoot = path.resolve(root, '..', '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const IDENTITY_SCHEMA = 'cf.gp71.identity-manifest.v2';
const PORTRAIT_SCHEMA = 'cf.gp71.portrait-manifest.v2';
const LEGACY_IDENTITY_SCHEMA = 'cf.gp71.identity-manifest.v1';
const LEGACY_PORTRAIT_SCHEMA = 'cf.gp71.portrait-manifest.v1';
const CAPTURE_PROVENANCE_SCHEMA = 'cf.capture-provenance.v1';
const PLAN_SCHEMA = 'cf.full-reset.catalogue-plan.v2';
const INDEX_SCHEMA = 'cf.full-reset.catalogue-index.v2';
const PROCEDURAL_PLAN_INDEX_SCHEMA = 'cf.full-reset.procedural-plan-index.v2';
const PACKET_MANIFEST_SCHEMA = 'cf.full-reset.packet-manifest.v2';
const EXPECTED_SETS = Object.freeze({
  'earth-fauna': 631,
  'earth-flora': 332,
  'earth-fungi': 27,
  'earth-microbe': 20,
  procedural: 240,
});
const SET_ORDER = Object.freeze(Object.keys(EXPECTED_SETS));
const EXPECTED_TOTAL = Object.values(EXPECTED_SETS).reduce((sum, count) => sum + count, 0);
const NATIVE_SIZE = 440;
const DEFAULT_PER_PACKET = 10;
const EXPECTED_PACKET_COUNT = 233;
const DEFAULT_METADATA = path.join(root, 'reference', 'nick-onebyone', 'engine_data', 'all_1250_current_one_by_one_audit.csv');
const DEFAULT_FAUNA = path.join(root, 'reference', 'fauna.json');
const DEFAULT_FLORA = path.join(root, 'reference', 'flora.json');
const DEFAULT_OTHER = path.join(root, 'reference', 'other.json');
const PROCEDURAL_ROUTER_SOURCE = path.join(root, 'packages', 'art', 'src', 'proceduraloverrides.ts');
const PROCEDURAL_FAMILY_SOURCE = path.join(root, 'packages', 'art', 'src', 'proceduralfamilies.ts');
const PROCEDURAL_RESOLVER_SOURCE = path.join(root, 'packages', 'art', 'src', 'speciesoverrides.ts');
const STATUS_FAMILY = /^(?:PASS(?:_WITH_POLISH)?|POLISH|HOLD|FAIL|BLOCKER|TRUE|FALSE|HIGH|LOW|MEDIUM|N\/?A|NONE|UNKNOWN|\d+)$/i;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SOURCE_CAPTURE_PATHS = Object.freeze(['.']);

/* These are the only accepted spellings that differ between the historical
   one-by-one CSV and the current catalogue. They are deliberately set-scoped:
   normalization, punctuation folding, and fuzzy matching are forbidden. */
const REVIEWED_ALIASES = Object.freeze([
  { set: 'earth-fauna', source: 'Aye Aye', target: 'Aye-Aye' },
  { set: 'earth-fauna', source: 'Cold Adapted Insect', target: 'Cold-Adapted Insect' },
  { set: 'earth-fauna', source: 'Cold Water Coral', target: 'Cold-Water Coral' },
  { set: 'earth-fauna', source: 'Cold Water Fish', target: 'Cold-Water Fish' },
  { set: 'earth-fauna', source: 'Deep Sea Fish', target: 'Deep-Sea Fish' },
  { set: 'earth-fauna', source: 'Deep Sea Octopus', target: 'Deep-Sea Octopus' },
  { set: 'earth-fauna', source: 'Deep Water Coral', target: 'Deep-Water Coral' },
  { set: 'earth-fauna', source: 'Insect Eating Bat', target: 'Insect-Eating Bat' },
  { set: 'earth-fauna', source: 'Mahi Mahi', target: 'Mahi-Mahi' },
  { set: 'earth-fauna', source: 'Portuguese Man of War', target: 'Portuguese Man-of-War' },
  { set: 'earth-flora', source: 'Black Eyed Susan', target: 'Black-Eyed Susan' },
  { set: 'earth-fungi', source: 'Chicken of the Woods', target: 'Chicken-of-the-Woods' },
  { set: 'earth-microbe', source: 'Iron Oxidizing Bacteria', target: 'Iron-Oxidizing Bacteria' },
  { set: 'earth-microbe', source: 'Nitrogen Fixing Bacteria', target: 'Nitrogen-Fixing Bacteria' },
  { set: 'earth-microbe', source: 'Radiation Resistant Microbe', target: 'Radiation-Resistant Microbe' },
  { set: 'earth-microbe', source: 'Red Tide Algae', target: 'Red-Tide Algae' },
  { set: 'earth-microbe', source: 'Sulfur Oxidizing Bacteria', target: 'Sulfur-Oxidizing Bacteria' },
]);

/* The bat reset is a reviewed taxonomy correction. The historical CSV split
   these four identities between Bats and Flying mammals. */
const REVIEWED_FAMILY_OVERRIDES = Object.freeze([
  { set: 'earth-fauna', species: 'Bat', family: 'Bats' },
  { set: 'earth-fauna', species: 'Fruit Bat', family: 'Bats' },
  { set: 'earth-fauna', species: 'Vampire Bat', family: 'Bats' },
  { set: 'earth-fauna', species: 'Insect-Eating Bat', family: 'Bats' },
]);

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function portable(value) { return value.split(path.sep).join('/'); }
function rowKey(set, species) { return `${set}\u0000${species}`; }
function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function hashFile(file) { return sha256(fs.readFileSync(file)); }
function expectedTotal(expectedSets) { return Object.values(expectedSets).reduce((sum, count) => sum + count, 0); }
function normalizedPath(value) {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}
function isWithin(childValue, parentValue) {
  const child = normalizedPath(childValue);
  const parent = normalizedPath(parentValue);
  return child === parent || child.startsWith(parent.endsWith(path.sep) ? parent : parent + path.sep);
}
function displayPath(file) {
  const relative = path.relative(root, file);
  return relative && !relative.startsWith(`..${path.sep}`) && relative !== '..'
    ? portable(relative)
    : portable(file);
}

function gitOutput(args, label) {
  try {
    return execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    const detail = String(error.stderr || error.message || '').trim();
    fail(`${label}: git command failed${detail ? ` (${detail.slice(0, 300)})` : ''}`);
  }
}

function inspectSourceRevision(requestedCommit = null) {
  const gitRoot = path.resolve(gitOutput(['rev-parse', '--show-toplevel'], 'source revision'));
  assert(normalizedPath(gitRoot) === normalizedPath(repositoryRoot),
    `source revision: unexpected repository root ${gitRoot}`);
  const commit = gitOutput(['rev-parse', 'HEAD'], 'source revision').toLowerCase();
  assert(/^[0-9a-f]{40}$/.test(commit), `source revision: invalid HEAD ${JSON.stringify(commit)}`);
  if (requestedCommit !== null) {
    const requested = nonempty(requestedCommit, '--source-commit').toLowerCase();
    assert(/^[0-9a-f]{40}$/.test(requested), '--source-commit must be the complete 40-character commit');
    assert(requested === commit,
      `--source-commit ${requested} does not equal current HEAD ${commit}`);
  }
  const status = gitOutput([
    'status', '--porcelain=v1', '--untracked-files=all',
  ], 'source revision status');
  const changedPaths = status ? status.split(/\r?\n/).filter(Boolean) : [];
  return {
    repository_root: displayPath(gitRoot),
    commit,
    worktree_clean_for_capture: changedPaths.length === 0,
    capture_scope: SOURCE_CAPTURE_PATHS,
    changed_paths: changedPaths,
  };
}

function requireCleanSourceRevision(revision) {
  assert(isObject(revision) && /^[0-9a-f]{40}$/.test(String(revision.commit)),
    'source revision: missing exact commit');
  assert(revision.worktree_clean_for_capture === true,
    `source revision: entire repository is dirty (${revision.changed_paths.join('; ') || 'unknown changes'})`);
}
function validateCaptureProvenance(raw, where, expectedCommit = null) {
  assert(isObject(raw), `${where}: missing capture provenance`);
  const expectedKeys = [
    'schema', 'repository_root', 'source_commit', 'capture_scope',
    'worktree_clean_before', 'worktree_clean_after', 'status_porcelain_sha256',
  ].sort(cmp);
  assert(JSON.stringify(Object.keys(raw).sort(cmp)) === JSON.stringify(expectedKeys),
    `${where}: capture provenance keys are incomplete or unexpected`);
  assert(raw.schema === CAPTURE_PROVENANCE_SCHEMA,
    `${where}: expected schema ${CAPTURE_PROVENANCE_SCHEMA}`);
  assert(raw.repository_root === '.', `${where}.repository_root: expected portable '.'`);
  const commit = nonempty(raw.source_commit, `${where}.source_commit`).toLowerCase();
  assert(/^[0-9a-f]{40}$/.test(commit), `${where}.source_commit: expected exact 40-hex`);
  if (expectedCommit !== null) {
    const expected = nonempty(expectedCommit, `${where} expected commit`).toLowerCase();
    assert(/^[0-9a-f]{40}$/.test(expected), `${where}: expected commit must be exact 40-hex`);
    assert(commit === expected, `${where}: capture commit ${commit} does not match requested/current commit ${expected}`);
  }
  assert(raw.capture_scope === 'entire_repository_including_untracked',
    `${where}: capture scope is not the entire repository`);
  assert(raw.worktree_clean_before === true && raw.worktree_clean_after === true,
    `${where}: source was not clean before and after capture`);
  assert(raw.status_porcelain_sha256 === sha256(''), `${where}: clean status digest is invalid`);
  return { ...raw, source_commit: commit };
}

function evidenceProvenance(identityRaw, manifestRaw, label, mode, expectedCommit) {
  assert(mode === 'current' || mode === 'historical', `${label}: provenance mode must be current or historical`);
  const currentSchemas = identityRaw.schema === IDENTITY_SCHEMA && manifestRaw.schema === PORTRAIT_SCHEMA;
  const legacySchemas = identityRaw.schema === LEGACY_IDENTITY_SCHEMA && manifestRaw.schema === LEGACY_PORTRAIT_SCHEMA;
  if (legacySchemas) {
    assert(mode === 'historical',
      `${label}: unprovenanced legacy evidence may be used only as the explicit historical comparison side`);
    return { status: 'historical_unprovenanced', source_commit: null, capture: null };
  }
  assert(currentSchemas,
    `${label}: identity/portrait schemas must be the matching provenance-bound v2 pair`);
  assert(mode !== 'current' || expectedCommit !== null,
    `${label}: current evidence requires an explicit requested/current source commit`);
  const identityCapture = validateCaptureProvenance(
    identityRaw.capture_provenance, `${label} identity capture provenance`, mode === 'current' ? expectedCommit : null,
  );
  const portraitCapture = validateCaptureProvenance(
    manifestRaw.capture_provenance, `${label} portrait capture provenance`, identityCapture.source_commit,
  );
  assert(JSON.stringify(stableValue(identityCapture)) === JSON.stringify(stableValue(portraitCapture)),
    `${label}: identity and portrait manifests bind different capture provenance`);
  return {
    status: mode === 'current' ? 'current_provenanced' : 'historical_provenanced',
    source_commit: identityCapture.source_commit,
    capture: identityCapture,
  };
}
function nonempty(value, where) {
  assert(typeof value === 'string' && value.trim().length > 0, `${where}: must be a nonempty string`);
  const trimmed = value.trim();
  assert(!/[\u0000-\u001f\u007f]/.test(trimmed), `${where}: control characters are forbidden`);
  return trimmed;
}
function familyLabel(value, where) {
  const family = nonempty(value, where);
  assert(family.length <= 160, `${where}: family is implausibly long`);
  assert(!STATUS_FAMILY.test(family), `${where}: status/value ${JSON.stringify(family)} is not a family`);
  return family;
}
function readJson(file, label) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); }
  catch (error) { fail(`${label}: cannot read ${displayPath(file)} (${error.message})`); }
  try { return JSON.parse(text); }
  catch (error) { fail(`${label}: invalid JSON (${error.message})`); }
}
function sourceFile(fileValue, label) {
  const file = path.resolve(fileValue);
  assert(fs.existsSync(file), `${label}: does not exist: ${displayPath(file)}`);
  const stat = fs.lstatSync(file);
  assert(stat.isFile() && !stat.isSymbolicLink(), `${label}: must be a real file, not a link`);
  assert(normalizedPath(fs.realpathSync(file)) === normalizedPath(file),
    `${label}: path resolves through a link or escape`);
  return file;
}
function realDirectory(directoryValue, label) {
  const directory = path.resolve(directoryValue);
  assert(fs.existsSync(directory), `${label}: does not exist: ${displayPath(directory)}`);
  const stat = fs.lstatSync(directory);
  assert(stat.isDirectory() && !stat.isSymbolicLink(), `${label}: must be a real directory, not a link`);
  assert(normalizedPath(fs.realpathSync(directory)) === normalizedPath(directory),
    `${label}: path resolves through a link or escape`);
  return directory;
}
function writeExclusive(file, value) {
  fs.writeFileSync(file, value, { flag: 'wx' });
}
function writeJsonExclusive(file, value) {
  writeExclusive(file, JSON.stringify(value, null, 2) + '\n');
}
function pngDimensions(buffer, where) {
  assert(Buffer.isBuffer(buffer) && buffer.length >= 24, `${where}: not a complete PNG`);
  assert(buffer.toString('hex', 0, 8) === '89504e470d0a1a0a', `${where}: not a PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
function safeRelativeImage(value, set, where) {
  const relative = nonempty(value, where);
  assert(!relative.includes('\\'), `${where}: use portable forward slashes`);
  assert(!path.posix.isAbsolute(relative), `${where}: absolute paths are forbidden`);
  assert(path.posix.normalize(relative) === relative && !relative.split('/').includes('..'),
    `${where}: path traversal is forbidden`);
  assert(relative.startsWith(`${set}/`), `${where}: must stay inside ${set}/`);
  assert(/\.png$/i.test(relative), `${where}: expected a PNG path`);
  return relative;
}
function absolutePortrait(portraitRoot, relative, where) {
  const file = path.resolve(portraitRoot, ...relative.split('/'));
  assert(isWithin(file, portraitRoot) && normalizedPath(file) !== normalizedPath(portraitRoot),
    `${where}: resolved outside portrait root`);
  return file;
}

function validateRoster(rows, label, expectedSets) {
  const total = expectedTotal(expectedSets);
  assert(Array.isArray(rows), `${label}: rows must be an array`);
  assert(rows.length === total, `${label}: expected ${total} rows, got ${rows.length}`);
  const counts = Object.fromEntries(Object.keys(expectedSets).map((set) => [set, 0]));
  const keys = new Set();
  for (const [offset, row] of rows.entries()) {
    const where = `${label} row ${offset + 1}`;
    assert(isObject(row), `${where}: must be an object`);
    const set = nonempty(row.set, `${where}.set`);
    const species = nonempty(row.species ?? row.name, `${where}.species`);
    assert(set in counts, `${where}: unknown set ${JSON.stringify(set)}`);
    const key = rowKey(set, species);
    assert(!keys.has(key), `${label}: duplicate identity ${JSON.stringify(`${set}/${species}`)}`);
    keys.add(key);
    counts[set]++;
  }
  for (const [set, expected] of Object.entries(expectedSets)) {
    assert(counts[set] === expected, `${label}: ${set} expected ${expected}, got ${counts[set]}`);
  }
  return { counts, keys };
}

function listExactPortraitFiles(portraitRoot, expectedSets, label) {
  const expectedDirectories = Object.keys(expectedSets).sort(cmp);
  const top = fs.readdirSync(portraitRoot, { withFileTypes: true });
  const actualDirectories = top.map((entry) => entry.name).sort(cmp);
  assert(JSON.stringify(actualDirectories) === JSON.stringify(expectedDirectories),
    `${label}: portraits/ entries must be exactly ${expectedDirectories.join(', ')}; got ${actualDirectories.join(', ')}`);
  const files = [];
  for (const set of expectedDirectories) {
    const setDir = realDirectory(path.join(portraitRoot, set), `${label} ${set}/`);
    for (const entry of fs.readdirSync(setDir, { withFileTypes: true })) {
      assert(entry.isFile() && !entry.isSymbolicLink(),
        `${label}: unexpected non-file or link in ${set}/: ${entry.name}`);
      assert(/\.png$/i.test(entry.name), `${label}: unexpected non-PNG in ${set}/: ${entry.name}`);
      const file = sourceFile(path.join(setDir, entry.name), `${label} ${set}/${entry.name}`);
      assert(isWithin(file, portraitRoot), `${label}: portrait escaped its root: ${entry.name}`);
      files.push(`${set}/${entry.name}`);
    }
  }
  return files.sort(cmp);
}

function loadEvidence(
  rootValue,
  label,
  expectedSets = EXPECTED_SETS,
  nativeSize = NATIVE_SIZE,
  provenanceOptions = {},
) {
  const evidenceRoot = realDirectory(rootValue, `${label} root`);
  const portraitRoot = realDirectory(path.join(evidenceRoot, 'portraits'), `${label} portraits/`);
  assert(isWithin(portraitRoot, evidenceRoot), `${label}: portraits/ escaped the evidence root`);
  const identityFile = sourceFile(path.join(evidenceRoot, 'identity-manifest.json'), `${label} identity manifest`);
  const portraitManifestFile = sourceFile(path.join(evidenceRoot, 'review-info', 'manifest.json'), `${label} portrait manifest`);
  const identityRaw = readJson(identityFile, `${label} identity manifest`);
  const manifestRaw = readJson(portraitManifestFile, `${label} portrait manifest`);
  assert(isObject(identityRaw) && Array.isArray(identityRaw.rows),
    `${label} identity manifest: expected an object with rows[]`);
  assert(isObject(manifestRaw) && Array.isArray(manifestRaw.files),
    `${label} portrait manifest: expected an object with files[]`);
  const provenance = evidenceProvenance(
    identityRaw,
    manifestRaw,
    label,
    provenanceOptions.mode ?? 'current',
    provenanceOptions.expectedCommit ?? null,
  );
  const roster = validateRoster(identityRaw.rows, `${label} identity manifest`, expectedSets);
  const total = expectedTotal(expectedSets);
  assert(manifestRaw.portraits === total,
    `${label} portrait manifest: expected portraits=${total}, got ${JSON.stringify(manifestRaw.portraits)}`);
  assert(manifestRaw.files.length === total,
    `${label} portrait manifest: expected ${total} files, got ${manifestRaw.files.length}`);
  if (manifestRaw.sets !== undefined) {
    assert(isObject(manifestRaw.sets), `${label} portrait manifest: sets must be an object`);
    for (const [set, count] of Object.entries(expectedSets)) {
      assert(manifestRaw.sets[set] === count,
        `${label} portrait manifest: ${set} count must be ${count}`);
    }
    assert(Object.keys(manifestRaw.sets).length === Object.keys(expectedSets).length,
      `${label} portrait manifest: unexpected set count entries`);
  }

  const manifestByFile = new Map();
  for (const [offset, raw] of manifestRaw.files.entries()) {
    const where = `${label} portrait manifest row ${offset + 1}`;
    assert(isObject(raw), `${where}: must be an object`);
    const set = nonempty(raw.set, `${where}.set`);
    assert(set in expectedSets, `${where}: unknown set ${JSON.stringify(set)}`);
    const imageFile = safeRelativeImage(raw.file, set, `${where}.file`);
    const recordedHash = nonempty(raw.sha256, `${where}.sha256`).toLowerCase();
    assert(/^[0-9a-f]{64}$/.test(recordedHash), `${where}: invalid SHA-256`);
    assert(Number.isInteger(raw.bytes) && raw.bytes >= 24, `${where}: invalid byte count`);
    assert(raw.width === nativeSize && raw.height === nativeSize,
      `${where}: expected ${nativeSize}x${nativeSize}, got ${raw.width}x${raw.height}`);
    assert(!manifestByFile.has(imageFile), `${label} portrait manifest: duplicate file ${JSON.stringify(imageFile)}`);
    manifestByFile.set(imageFile, {
      set, imageFile, sha256: recordedHash, bytes: raw.bytes, width: raw.width, height: raw.height,
    });
  }

  const byKey = new Map();
  const seenFiles = new Set();
  for (const [offset, raw] of identityRaw.rows.entries()) {
    const where = `${label} identity row ${offset + 1}`;
    const set = nonempty(raw.set, `${where}.set`);
    const species = nonempty(raw.species, `${where}.species`);
    const renderName = nonempty(raw.render_name ?? species, `${where}.render_name`);
    const imageFile = safeRelativeImage(raw.image_file, set, `${where}.image_file`);
    const recordedHash = nonempty(raw.sha256, `${where}.sha256`).toLowerCase();
    assert(/^[0-9a-f]{64}$/.test(recordedHash), `${where}: invalid SHA-256`);
    assert(!seenFiles.has(imageFile), `${label} identity manifest: duplicate image file ${JSON.stringify(imageFile)}`);
    seenFiles.add(imageFile);
    const manifestRow = manifestByFile.get(imageFile);
    assert(manifestRow, `${where}: absent from portrait manifest (${imageFile})`);
    assert(manifestRow.set === set, `${where}: set differs from portrait manifest`);
    assert(manifestRow.sha256 === recordedHash, `${where}: SHA-256 differs from portrait manifest`);
    const file = absolutePortrait(portraitRoot, imageFile, where);
    assert(fs.existsSync(file), `${where}: missing portrait ${imageFile}`);
    const fileStat = fs.lstatSync(file);
    assert(fileStat.isFile() && !fileStat.isSymbolicLink(), `${where}: portrait must be a real file`);
    assert(normalizedPath(fs.realpathSync(file)) === normalizedPath(file), `${where}: portrait resolves through a link`);
    const buffer = fs.readFileSync(file);
    const dimensions = pngDimensions(buffer, `${label} ${set}/${species}`);
    assert(dimensions.width === nativeSize && dimensions.height === nativeSize,
      `${label} ${set}/${species}: expected native ${nativeSize}x${nativeSize}, got ${dimensions.width}x${dimensions.height}`);
    assert(buffer.length === manifestRow.bytes,
      `${label} ${set}/${species}: byte count differs from portrait manifest`);
    const diskHash = sha256(buffer);
    assert(diskHash === recordedHash, `${label} ${set}/${species}: disk SHA-256 differs from manifests`);
    byKey.set(rowKey(set, species), {
      set, species, renderName, imageFile, file, sha256: diskHash, bytes: buffer.length,
      width: dimensions.width, height: dimensions.height,
    });
  }
  assert(byKey.size === roster.keys.size, `${label}: identity map lost rows`);
  for (const imageFile of manifestByFile.keys()) {
    assert(seenFiles.has(imageFile), `${label}: portrait manifest file has no identity: ${imageFile}`);
  }
  const diskFiles = listExactPortraitFiles(portraitRoot, expectedSets, label);
  const recordedFiles = [...seenFiles].sort(cmp);
  assert(JSON.stringify(diskFiles) === JSON.stringify(recordedFiles),
    `${label}: disk portrait files do not exactly match the manifests`);
  const rows = [...byKey.values()];
  const identityDigest = sha256(rows.slice().sort((a, b) => cmp(rowKey(a.set, a.species), rowKey(b.set, b.species)))
    .map((row) => `${row.set}\u0000${row.species}\u0000${row.imageFile}\u0000${row.sha256}\u0000${row.bytes}\n`).join(''));
  return {
    root: evidenceRoot,
    portraitRoot,
    identityFile,
    portraitManifestFile,
    rows,
    byKey,
    counts: roster.counts,
    identityDigest,
    identityManifestSha256: hashFile(identityFile),
    portraitManifestSha256: hashFile(portraitManifestFile),
    provenance,
  };
}

/* RFC-4180-style parser. Multiline quoted review notes are present in the
   source file, so newline splitting would corrupt row alignment. */
function parseCsv(text, label) {
  const input = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const records = [];
  let record = [];
  let field = '';
  let inQuotes = false;
  let afterQuote = false;
  const finishField = () => { record.push(field); field = ''; afterQuote = false; };
  const finishRecord = () => {
    finishField();
    if (record.some((value) => value.length > 0)) records.push(record);
    record = [];
  };
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (inQuotes) {
      if (char === '"') {
        if (input[index + 1] === '"') { field += '"'; index++; }
        else { inQuotes = false; afterQuote = true; }
      } else field += char;
      continue;
    }
    if (afterQuote) {
      if (char === ',') finishField();
      else if (char === '\n' || char === '\r') {
        if (char === '\r' && input[index + 1] === '\n') index++;
        finishRecord();
      } else fail(`${label}: unexpected ${JSON.stringify(char)} after closing quote at character ${index + 1}`);
      continue;
    }
    if (char === '"') {
      assert(field.length === 0, `${label}: quote inside an unquoted field at character ${index + 1}`);
      inQuotes = true;
    } else if (char === ',') finishField();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[index + 1] === '\n') index++;
      finishRecord();
    } else field += char;
  }
  assert(!inQuotes, `${label}: unterminated quoted field`);
  if (record.length > 0 || field.length > 0 || afterQuote) finishRecord();
  assert(records.length >= 2, `${label}: expected a header and at least one data row`);
  const headers = records.shift().map((header, index) => {
    const value = header.trim();
    assert(value.length > 0, `${label}: header ${index + 1} is empty`);
    return value;
  });
  assert(new Set(headers).size === headers.length, `${label}: duplicate CSV header`);
  const rows = records.map((values, rowOffset) => {
    assert(values.length === headers.length,
      `${label}: row ${rowOffset + 2} has ${values.length} columns; expected ${headers.length}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
  return { headers, rows };
}

function categorySet(category, where) {
  const mapping = {
    fauna: 'earth-fauna', flora: 'earth-flora', fungi: 'earth-fungi',
    microbe: 'earth-microbe', procedural: 'procedural',
  };
  const set = mapping[nonempty(category, where)];
  assert(set, `${where}: unknown category ${JSON.stringify(category)}`);
  return set;
}

function compileAliases(aliasEntries, evidenceKeys, label = 'reviewed aliases') {
  assert(Array.isArray(aliasEntries), `${label}: expected an array`);
  const bySource = new Map();
  const targets = new Set();
  for (const [offset, raw] of aliasEntries.entries()) {
    const where = `${label} row ${offset + 1}`;
    assert(isObject(raw), `${where}: must be an object`);
    const set = nonempty(raw.set, `${where}.set`);
    const source = nonempty(raw.source, `${where}.source`);
    const target = nonempty(raw.target, `${where}.target`);
    const sourceKey = rowKey(set, source);
    const targetKey = rowKey(set, target);
    assert(sourceKey !== targetKey, `${where}: source and target must differ`);
    assert(!bySource.has(sourceKey), `${label}: duplicate alias source ${set}/${source}`);
    assert(!targets.has(targetKey), `${label}: duplicate alias target ${set}/${target}`);
    assert(!evidenceKeys.has(sourceKey), `${where}: alias source is already a current identity`);
    assert(evidenceKeys.has(targetKey), `${where}: alias target is not a current identity (${set}/${target})`);
    const entry = { set, source, target, sourceKey, targetKey, uses: 0 };
    bySource.set(sourceKey, entry);
    targets.add(targetKey);
  }
  return { bySource, entries: [...bySource.values()] };
}

function proceduralGrouping(species, kindValue, where) {
  const match = /^(fauna|flora|fungi|microbe)-h([0-2])-s(\d+)$/.exec(species);
  assert(match, `${where}: procedural identity must match kingdom-h0..2-sN`);
  const [, kingdom, heatText, seedText] = match;
  const kind = nonempty(kindValue, `${where}.procedural_kind`);
  assert(kind === kingdom,
    `${where}: procedural_kind ${JSON.stringify(kind)} disagrees with identity kingdom ${JSON.stringify(kingdom)}`);
  const seed = Number(seedText);
  assert(Number.isInteger(seed) && seed >= 0 && seed <= 19,
    `${where}: procedural seed index must be 0..19`);
  const heat = Number(heatText);
  const kingdomOrder = { fauna: 0, flora: 1, fungi: 2, microbe: 3 }[kingdom];
  return {
    family: `Procedural ${kingdom} - heat ${heat}`,
    familySort: `${kingdomOrder}-${heat}`,
    rowSort: String(seed).padStart(2, '0'),
    kingdom,
    heat,
    sample: seed,
  };
}

const PROCEDURAL_PAINTER_LABELS = Object.freeze({
  fungiBracket: 'bracket',
  fungiCup: 'cup',
  fungiCupAnchored: 'anchored cup',
  fungiCoral: 'coral',
  fungiMorel: 'morel',
  fungiJelly: 'jelly',
  fungiTooth: 'tooth',
  fungiTruffle: 'truffle',
  fungiClub: 'club',
  fungiCordyceps: 'parasitic club',
  lichenMat: 'lichen mat',
  tardigrade: 'tardigrade',
  microbeDiatom: 'diatom',
  microbeCiliate: 'ciliate',
  microbeFlagellate: 'flagellate',
  microbeForam: 'foraminifer',
  microbeRods: 'rods',
  microbeSpiral: 'spiral',
  microbeFilament: 'filament',
  microbeChain: 'chain',
  microbePlates: 'plates',
  microbeMat: 'biofilm mat',
  microbeStructuredColony: 'structured colony',
});

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (isObject(value)) {
    return Object.fromEntries(Object.keys(value).sort(cmp).map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function oneSourceMatch(source, expression, label) {
  const matches = [...source.matchAll(expression)];
  assert(matches.length === 1, `${label}: expected one source match, got ${matches.length}`);
  return matches[0][1];
}

function parseIdentifierArray(body, label) {
  const identifiers = body.split(',').map((value) => value.trim()).filter(Boolean);
  assert(identifiers.length > 0, `${label}: table is empty`);
  for (const identifier of identifiers) {
    assert(/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(identifier),
      `${label}: unexpected table entry ${JSON.stringify(identifier)}`);
    assert(PROCEDURAL_PAINTER_LABELS[identifier],
      `${label}: painter ${identifier} has no audited plan-family label`);
  }
  return identifiers;
}

function parseRepairObject(body, label) {
  const repairs = new Map();
  const entry = /(\d+)\s*:\s*'(coral|club|jelly|cup)'\s*,?/g;
  for (const match of body.matchAll(entry)) {
    const seed = Number(match[1]);
    assert(!repairs.has(seed), `${label}: duplicate seed ${seed}`);
    repairs.set(seed, match[2]);
  }
  const residue = body.replace(entry, '').replace(/[\s,]/g, '');
  assert(residue.length === 0 && repairs.size > 0, `${label}: could not parse every repair entry (${residue})`);
  return repairs;
}

function parseRepairSet(body, label) {
  const seeds = new Set();
  for (const token of body.split(',').map((value) => value.trim()).filter(Boolean)) {
    assert(/^\d+$/.test(token), `${label}: unexpected seed ${JSON.stringify(token)}`);
    const seed = Number(token);
    assert(!seeds.has(seed), `${label}: duplicate seed ${seed}`);
    seeds.add(seed);
  }
  assert(seeds.size > 0, `${label}: set is empty`);
  return seeds;
}

function parseProceduralRoutingSource(fileValue = PROCEDURAL_RESOLVER_SOURCE) {
  const file = sourceFile(fileValue, 'procedural resolver source');
  const source = fs.readFileSync(file, 'utf8');
  const fungiTable = parseIdentifierArray(oneSourceMatch(source,
    /const FUNGI_FAM\s*=\s*\[([\s\S]*?)\];/g, 'procedural fungi family table'),
  'procedural fungi family table');
  const microbeTable = parseIdentifierArray(oneSourceMatch(source,
    /const MICROBE_FAM\s*=\s*\[([\s\S]*?)\];/g, 'procedural microbe family table'),
  'procedural microbe family table');
  const fungiRepairs = parseRepairObject(oneSourceMatch(source,
    /const R2_FUNGI_TOPOLOGY:[^=]+?=\s*\{([\s\S]*?)\};/g, 'procedural fungi repair table'),
  'procedural fungi repair table');
  const microbeRepairs = parseRepairSet(oneSourceMatch(source,
    /const R2_MICROBE_COLONY_SEEDS:[^=]+?=\s*new Set\(\[([\s\S]*?)\]\);/g,
    'procedural microbe repair set'), 'procedural microbe repair set');
  return {
    file,
    sha256: hashFile(file),
    fungiTable,
    microbeTable,
    fungiRepairs,
    microbeRepairs,
  };
}

function planFamilyForOwned(plan) {
  assert(isObject(plan) && typeof plan.kind === 'string', 'procedural plan: invalid owned plan');
  if (plan.kind === 'plant') {
    const habit = isObject(plan.spec) && typeof plan.spec.habit === 'string' ? plan.spec.habit : 'plant';
    return `owned plant / ${habit}`;
  }
  return `owned fauna / ${plan.kind}`;
}

function fallbackPlanFamily(kingdom, genome, traits) {
  if (kingdom === 'fauna') {
    const index = ((Number(genome.body) || 0) % traits.FA_BODY.length + traits.FA_BODY.length) % traits.FA_BODY.length;
    return `verbatim fauna / ${traits.FA_BODY[index]}`;
  }
  if (kingdom === 'flora') {
    const index = ((Number(genome.form) || 0) % traits.FLORA_FORM.length + traits.FLORA_FORM.length) % traits.FLORA_FORM.length;
    return `verbatim flora / ${traits.FLORA_FORM[index]}`;
  }
  fail(`procedural fallback plan: unsupported kingdom ${kingdom}`);
}

function genomePlanFields(genome) {
  return Object.fromEntries(['seed', 'kingdom', 'heat', 'form', 'body', 'loco', 'size', 'head', 'tail', 'pattern', 'skin', 'lumin']
    .map((key) => [key, genome[key]]));
}

async function deriveCurrentProceduralPlans(metadataRows) {
  const proceduralRows = metadataRows.filter((row) => row.set === 'procedural');
  assert(proceduralRows.length > 0, 'procedural plan derivation: no procedural rows');
  const routing = parseProceduralRoutingSource();
  const routerFile = sourceFile(PROCEDURAL_ROUTER_SOURCE, 'procedural plan router source');
  const familyFile = sourceFile(PROCEDURAL_FAMILY_SOURCE, 'procedural family selector source');
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-full-reset-vite-'));
  let vite = null;
  try {
    const { createServer } = await import('vite');
    const appDir = path.join(root, 'apps', 'game');
    vite = await createServer({
      root: appDir,
      configFile: path.join(appDir, 'vite.config.ts'),
      cacheDir,
      appType: 'custom',
      logLevel: 'silent',
      server: { middlewareMode: true },
    });
    const moduleUrl = (file) => `/@fs/${portable(path.resolve(file))}`;
    const rand = await vite.ssrLoadModule(moduleUrl(path.join(root, 'packages', 'domain', 'rand', 'src', 'index.ts')));
    const genomeModule = await vite.ssrLoadModule(moduleUrl(path.join(root, 'packages', 'domain', 'genome', 'src', 'index.ts')));
    const descriptorModule = await vite.ssrLoadModule(moduleUrl(path.join(root, 'packages', 'domain', 'descriptors', 'src', 'index.ts')));
    const traits = await vite.ssrLoadModule(moduleUrl(path.join(root, 'packages', 'domain', 'speciestraits', 'src', 'index.ts')));
    const plans = await vite.ssrLoadModule(moduleUrl(routerFile));
    const families = await vite.ssrLoadModule(moduleUrl(familyFile));
    assert(typeof rand.hashInt === 'function' && typeof genomeModule.makeGenome === 'function'
      && typeof plans.planFor === 'function' && typeof families.procFamilyIndex === 'function',
    'procedural plan derivation: live runtime exports are incomplete');
    const kingdomOrder = Object.keys(descriptorModule._EARTH_NAMES ?? {});
    assert(JSON.stringify(kingdomOrder) === JSON.stringify(['fauna', 'flora', 'fungi', 'microbe']),
      `procedural plan derivation: unexpected live kingdom order ${kingdomOrder.join(', ')}`);
    assert(families.FAMILY_COUNT?.fungi === routing.fungiTable.length
      && families.FAMILY_COUNT?.microbe === routing.microbeTable.length,
    'procedural plan derivation: live selector counts disagree with resolver tables');
    assert(Array.isArray(traits.FA_BODY) && traits.FA_BODY.length > 0
      && Array.isArray(traits.FLORA_FORM) && traits.FLORA_FORM.length > 0,
    'procedural plan derivation: live fallback vocabularies are unavailable');

    const byKey = new Map();
    for (const row of proceduralRows) {
      const { kingdom, heat, sample } = row.procedural;
      const kingdomIndex = kingdomOrder.indexOf(kingdom);
      assert(kingdomIndex >= 0, `procedural plan derivation: unknown kingdom ${kingdom}`);
      const seed = rand.hashInt(0xF00D, kingdomIndex * 100 + heat * 25 + sample, 7) >>> 0;
      const genome = genomeModule.makeGenome(seed, kingdom, heat);
      assert((genome.seed >>> 0) === seed && genome.kingdom === kingdom && Number(genome.heat) === heat,
        `procedural plan derivation: live genome disagrees for ${row.species}`);
      let routeKind;
      let planFamily;
      let basePlanFamily;
      let planDetail;
      if (kingdom === 'fungi' || kingdom === 'microbe') {
        const table = kingdom === 'fungi' ? routing.fungiTable : routing.microbeTable;
        const familyIndex = families.procFamilyIndex(genome, kingdom);
        assert(Number.isInteger(familyIndex) && familyIndex >= 0 && familyIndex < table.length,
          `procedural plan derivation: invalid ${kingdom} family index ${familyIndex}`);
        const basePainter = table[familyIndex];
        let effectivePainter = basePainter;
        let repair = null;
        if (kingdom === 'fungi' && routing.fungiRepairs.has(seed)) {
          const topology = routing.fungiRepairs.get(seed);
          effectivePainter = { coral: 'fungiCoral', club: 'fungiClub', jelly: 'fungiJelly', cup: 'fungiCupAnchored' }[topology];
          repair = `r2-${topology}`;
        } else if (kingdom === 'microbe' && routing.microbeRepairs.has(seed)) {
          effectivePainter = 'microbeStructuredColony';
          repair = 'r2-structured-colony';
        }
        basePlanFamily = `owned ${kingdom} / ${PROCEDURAL_PAINTER_LABELS[basePainter]}`;
        planFamily = `owned ${kingdom} / ${PROCEDURAL_PAINTER_LABELS[effectivePainter]}`;
        routeKind = 'owned';
        planDetail = {
          family_index: familyIndex,
          base_painter: basePainter,
          effective_painter: effectivePainter,
          repair,
        };
      } else {
        const plan = plans.planFor(genome);
        routeKind = plan ? 'owned' : 'verbatim';
        planFamily = plan ? planFamilyForOwned(plan) : fallbackPlanFamily(kingdom, genome, traits);
        basePlanFamily = planFamily;
        planDetail = plan ? stableValue(plan) : null;
      }
      const result = {
        seed,
        kingdom,
        heat,
        sample,
        route_kind: routeKind,
        plan_family: planFamily,
        base_plan_family: basePlanFamily,
        plan_detail: planDetail,
        genome: genomePlanFields(genome),
      };
      result.plan_sha256 = sha256(JSON.stringify(stableValue(result)));
      byKey.set(rowKey(row.set, row.species), result);
    }
    assert(byKey.size === proceduralRows.length, 'procedural plan derivation: duplicate identity');
    return {
      byKey,
      source: {
        live_runtime: 'Vite SSR loaded the production hashInt, makeGenome, planFor, and procFamilyIndex exports.',
        procedural_router: { file: displayPath(routerFile), sha256: hashFile(routerFile) },
        procedural_family_selector: { file: displayPath(familyFile), sha256: hashFile(familyFile) },
        procedural_resolver: { file: displayPath(routing.file), sha256: routing.sha256 },
      },
    };
  } finally {
    if (vite) await vite.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

function loadMetadata(fileValue, evidence, aliasEntries = REVIEWED_ALIASES, expectedSets = EXPECTED_SETS) {
  const file = sourceFile(fileValue, 'catalogue metadata CSV');
  const parsed = parseCsv(fs.readFileSync(file, 'utf8'), 'catalogue metadata CSV');
  const requiredHeaders = [
    'category', 'display_name', 'expected_body_family', 'expected_growth_family', 'procedural_kind',
  ];
  for (const header of requiredHeaders) {
    assert(parsed.headers.includes(header), `catalogue metadata CSV: missing required header ${header}`);
  }
  const total = expectedTotal(expectedSets);
  assert(parsed.rows.length === total,
    `catalogue metadata CSV: expected ${total} rows, got ${parsed.rows.length}`);
  const aliases = compileAliases(aliasEntries, new Set(evidence.byKey.keys()));
  const originalKeys = new Set();
  const canonicalKeys = new Set();
  const rows = [];
  for (const [offset, raw] of parsed.rows.entries()) {
    const where = `catalogue metadata CSV row ${offset + 2}`;
    const set = categorySet(raw.category, `${where}.category`);
    assert(set in expectedSets, `${where}: category maps to unexpected set ${set}`);
    const sourceSpecies = nonempty(raw.display_name, `${where}.display_name`);
    const sourceKey = rowKey(set, sourceSpecies);
    assert(!originalKeys.has(sourceKey), `${where}: duplicate source identity ${set}/${sourceSpecies}`);
    originalKeys.add(sourceKey);
    const alias = aliases.bySource.get(sourceKey);
    if (alias) alias.uses++;
    const species = alias ? alias.target : sourceSpecies;
    const key = rowKey(set, species);
    assert(!canonicalKeys.has(key), `${where}: duplicate canonical identity ${set}/${species}`);
    canonicalKeys.add(key);
    assert(evidence.byKey.has(key), `${where}: identity absent from current evidence (${set}/${species})`);
    let csvFamily = null;
    let procedural = null;
    if (set === 'earth-fauna') csvFamily = familyLabel(raw.expected_body_family, `${where}.expected_body_family`);
    else if (set === 'earth-flora') csvFamily = familyLabel(raw.expected_growth_family, `${where}.expected_growth_family`);
    else if (set === 'procedural') procedural = proceduralGrouping(species, raw.procedural_kind, where);
    rows.push({ set, species, sourceSpecies, csvFamily, procedural });
  }
  for (const alias of aliases.entries) {
    assert(alias.uses === 1,
      `reviewed aliases: ${alias.set}/${alias.source} -> ${alias.target} must be used exactly once; got ${alias.uses}`);
  }
  validateRoster(rows, 'catalogue metadata CSV canonical join', expectedSets);
  for (const key of evidence.byKey.keys()) {
    assert(canonicalKeys.has(key),
      `catalogue metadata CSV: current identity is missing (${key.replace('\u0000', '/')})`);
  }
  return {
    file,
    sha256: hashFile(file),
    rows,
    byKey: new Map(rows.map((row) => [rowKey(row.set, row.species), row])),
    aliases: aliases.entries.map(({ set, source, target }) => ({ set, source, target })),
  };
}

function loadOtherReferences(fileValue, evidence) {
  const file = sourceFile(fileValue, 'fungi/microbe reference');
  const raw = readJson(file, 'fungi/microbe reference');
  assert(Array.isArray(raw), 'fungi/microbe reference: expected an array');
  const byKey = new Map();
  for (const [offset, row] of raw.entries()) {
    const where = `fungi/microbe reference row ${offset + 1}`;
    assert(isObject(row), `${where}: must be an object`);
    const kingdom = nonempty(row.kingdom, `${where}.kingdom`);
    assert(kingdom === 'fungi' || kingdom === 'microbe', `${where}: unsupported kingdom ${JSON.stringify(kingdom)}`);
    const set = `earth-${kingdom}`;
    const species = nonempty(row.name, `${where}.name`);
    const family = familyLabel(row.family, `${where}.family`);
    const key = rowKey(set, species);
    assert(!byKey.has(key), `fungi/microbe reference: duplicate identity ${set}/${species}`);
    byKey.set(key, { set, species, family });
  }
  for (const row of evidence.rows.filter((entry) => entry.set === 'earth-fungi' || entry.set === 'earth-microbe')) {
    assert(byKey.has(rowKey(row.set, row.species)),
      `fungi/microbe reference: current identity is missing (${row.set}/${row.species})`);
  }
  return { file, sha256: hashFile(file), byKey, rows: [...byKey.values()] };
}

function mustReadContract({ set, species, source, sourceSha256, mustRead, note = '' }, where) {
  const cleanSet = nonempty(set, `${where}.set`);
  const cleanSpecies = nonempty(species, `${where}.species`);
  const cleanSource = nonempty(source, `${where}.source`);
  const cleanSourceSha = nonempty(sourceSha256, `${where}.source_sha256`).toLowerCase();
  assert(/^[0-9a-f]{64}$/.test(cleanSourceSha), `${where}.source_sha256: invalid SHA-256`);
  assert(Array.isArray(mustRead) && mustRead.length > 0, `${where}.must_read: expected at least one criterion`);
  const cleanMustRead = mustRead.map((value, offset) => nonempty(value, `${where}.must_read[${offset}]`));
  const cleanNote = note === undefined || note === null ? '' : String(note).trim();
  assert(!/[\u0000-\u001f\u007f]/.test(cleanNote), `${where}.note: control characters are forbidden`);
  const payload = {
    set: cleanSet,
    species: cleanSpecies,
    source: cleanSource,
    source_sha256: cleanSourceSha,
    must_read: cleanMustRead,
    note: cleanNote,
  };
  return { ...payload, sha256: sha256(JSON.stringify(stableValue(payload))) };
}

function validateMustReadContract(raw, set, species, where) {
  assert(isObject(raw), `${where}: must be an object`);
  const expectedKeys = ['set', 'species', 'source', 'source_sha256', 'must_read', 'note', 'sha256'].sort(cmp);
  assert(JSON.stringify(Object.keys(raw).sort(cmp)) === JSON.stringify(expectedKeys),
    `${where}: keys must be exactly ${expectedKeys.join(', ')}`);
  const rebuilt = mustReadContract({
    set: raw.set,
    species: raw.species,
    source: raw.source,
    sourceSha256: raw.source_sha256,
    mustRead: raw.must_read,
    note: raw.note,
  }, where);
  assert(rebuilt.set === set && rebuilt.species === species,
    `${where}: contract identity must be exactly ${set}/${species}`);
  assert(typeof raw.sha256 === 'string' && raw.sha256 === raw.sha256.toLowerCase()
      && /^[0-9a-f]{64}$/.test(raw.sha256), `${where}.sha256: invalid SHA-256`);
  assert(raw.sha256 === rebuilt.sha256, `${where}.sha256: contract hash does not match exact set/species mustRead payload`);
  return rebuilt;
}

function loadMustReadContracts(evidence, proceduralPlans, referenceFiles = {}) {
  const references = [
    { file: referenceFiles.fauna ?? DEFAULT_FAUNA, label: 'reference/fauna.json', setFor: () => 'earth-fauna' },
    { file: referenceFiles.flora ?? DEFAULT_FLORA, label: 'reference/flora.json', setFor: () => 'earth-flora' },
    {
      file: referenceFiles.other ?? DEFAULT_OTHER,
      label: 'reference/other.json',
      setFor: (row, where) => {
        const kingdom = nonempty(row.kingdom, `${where}.kingdom`);
        assert(kingdom === 'fungi' || kingdom === 'microbe', `${where}.kingdom: unsupported ${JSON.stringify(kingdom)}`);
        return `earth-${kingdom}`;
      },
    },
  ];
  const byKey = new Map();
  const sources = [];
  for (const reference of references) {
    const file = sourceFile(reference.file, `${reference.label} mustRead reference`);
    const sourceSha256 = hashFile(file);
    const raw = readJson(file, `${reference.label} mustRead reference`);
    assert(Array.isArray(raw), `${reference.label}: expected an array`);
    sources.push({ file: displayPath(file), sha256: sourceSha256 });
    for (const [offset, row] of raw.entries()) {
      const where = `${reference.label} row ${offset + 1}`;
      assert(isObject(row), `${where}: must be an object`);
      const set = reference.setFor(row, where);
      const species = nonempty(row.name, `${where}.name`);
      const key = rowKey(set, species);
      assert(!byKey.has(key), `${where}: duplicate exact set/species mustRead identity ${set}/${species}`);
      byKey.set(key, mustReadContract({
        set,
        species,
        source: reference.label,
        sourceSha256,
        mustRead: row.mustRead,
        note: row.note,
      }, `${where} mustRead contract`));
    }
  }
  for (const portrait of evidence.rows.filter((row) => row.set !== 'procedural')) {
    assert(byKey.has(rowKey(portrait.set, portrait.species)),
      `mustRead contracts: current identity is missing (${portrait.set}/${portrait.species})`);
  }
  for (const portrait of evidence.rows.filter((row) => row.set === 'procedural')) {
    const key = rowKey(portrait.set, portrait.species);
    const plan = proceduralPlans.byKey.get(key);
    assert(isObject(plan), `mustRead contracts: live procedural plan missing ${portrait.species}`);
    const planFamily = nonempty(plan.plan_family, `mustRead contracts ${portrait.species}.plan_family`);
    const planSha256 = nonempty(plan.plan_sha256, `mustRead contracts ${portrait.species}.plan_sha256`).toLowerCase();
    byKey.set(key, mustReadContract({
      set: portrait.set,
      species: portrait.species,
      source: `live procedural plan: ${planFamily}`,
      sourceSha256: planSha256,
      mustRead: [
        `a coherent and distinct ${planFamily} body or growth plan`,
        'connected appendages, roots, and terminal structures with no pasted-on seams',
        'a readable silhouette and material response at actual-thumb, gameplay, and native scales',
      ],
      note: `Exact procedural identity ${portrait.species}; judge against plan ${planSha256}.`,
    }, `mustRead contracts procedural/${portrait.species}`));
  }
  const exact = new Map();
  for (const portrait of evidence.rows) {
    const key = rowKey(portrait.set, portrait.species);
    const contract = byKey.get(key);
    assert(contract, `mustRead contracts: missing ${portrait.set}/${portrait.species}`);
    exact.set(key, validateMustReadContract(contract, portrait.set, portrait.species,
      `mustRead contracts ${portrait.set}/${portrait.species}`));
  }
  assert(exact.size === evidence.rows.length, 'mustRead contracts: exact current roster cardinality failed');
  return { byKey: exact, sources };
}

function compileFamilyOverrides(entries, evidenceKeys, label = 'reviewed family overrides') {
  assert(Array.isArray(entries), `${label}: expected an array`);
  const byKey = new Map();
  for (const [offset, raw] of entries.entries()) {
    const where = `${label} row ${offset + 1}`;
    assert(isObject(raw), `${where}: must be an object`);
    const set = nonempty(raw.set, `${where}.set`);
    const species = nonempty(raw.species, `${where}.species`);
    const family = familyLabel(raw.family, `${where}.family`);
    const key = rowKey(set, species);
    assert(!byKey.has(key), `${label}: duplicate identity ${set}/${species}`);
    assert(evidenceKeys.has(key), `${where}: identity is absent from current evidence (${set}/${species})`);
    byKey.set(key, { set, species, family, uses: 0 });
  }
  return { byKey, entries: [...byKey.values()] };
}

function publicRow(row) {
  return {
    ordinal: row.ordinal,
    set: row.set,
    species: row.species,
    render_name: row.renderName,
    family: row.family,
    family_source: row.familySource,
    image_file: row.imageFile,
    sha256: row.sha256,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    must_read_contract: row.mustReadContract,
    ...(row.proceduralPlan ? { procedural_plan: row.proceduralPlan } : {}),
  };
}

function sourceSummary(evidence, metadata, other, mustReadContracts) {
  return {
    evidence_root: displayPath(evidence.root),
    identity_manifest: {
      file: displayPath(evidence.identityFile),
      sha256: evidence.identityManifestSha256,
    },
    portrait_manifest: {
      file: displayPath(evidence.portraitManifestFile),
      sha256: evidence.portraitManifestSha256,
    },
    evidence_identity_digest: evidence.identityDigest,
    family_metadata_csv: { file: displayPath(metadata.file), sha256: metadata.sha256 },
    fungi_microbe_reference: { file: displayPath(other.file), sha256: other.sha256 },
    must_read_references: mustReadContracts.sources,
    procedural_plan_derivation: metadata.proceduralPlanSource,
    source_revision: metadata.sourceRevision,
  };
}

function buildLayout({
  evidence,
  metadata,
  other,
  mustReadContracts,
  perPacket = DEFAULT_PER_PACKET,
  expectedSets = EXPECTED_SETS,
  familyOverrides = REVIEWED_FAMILY_OVERRIDES,
  includePackets = false,
}) {
  assert(Number.isInteger(perPacket) && perPacket >= 4 && perPacket <= 14,
    'packet size must be an integer from 4 through 14');
  const setOrder = Object.keys(expectedSets);
  const setRank = new Map(setOrder.map((set, index) => [set, index]));
  const overrides = compileFamilyOverrides(familyOverrides, new Set(evidence.byKey.keys()));
  const resolved = [];
  for (const portrait of evidence.rows) {
    const key = rowKey(portrait.set, portrait.species);
    const meta = metadata.byKey.get(key);
    assert(meta, `layout: missing metadata for ${portrait.set}/${portrait.species}`);
    const contract = mustReadContracts.byKey.get(key);
    assert(contract, `layout: missing exact mustRead contract for ${portrait.set}/${portrait.species}`);
    let family;
    let familySort;
    let rowSort = portrait.species;
    let familySource;
    if (portrait.set === 'earth-fauna') {
      family = meta.csvFamily;
      familySort = family;
      familySource = 'nick-onebyone CSV expected_body_family';
    } else if (portrait.set === 'earth-flora') {
      family = meta.csvFamily;
      familySort = family;
      familySource = 'nick-onebyone CSV expected_growth_family';
    } else if (portrait.set === 'earth-fungi' || portrait.set === 'earth-microbe') {
      const reference = other.byKey.get(key);
      assert(reference, `layout: missing set-specific reference for ${portrait.set}/${portrait.species}`);
      family = reference.family;
      familySort = family;
      familySource = 'reference/other.json set-specific family';
    } else if (portrait.set === 'procedural') {
      assert(meta.procedural, `layout: missing procedural grouping for ${portrait.species}`);
      assert(isObject(meta.proceduralPlan), `layout: missing live procedural plan for ${portrait.species}`);
      family = meta.procedural.family;
      familySort = meta.procedural.familySort;
      rowSort = meta.procedural.rowSort;
      familySource = 'identity-derived procedural kingdom + heat bucket';
    } else fail(`layout: unsupported set ${portrait.set}`);
    const override = overrides.byKey.get(key);
    if (override) {
      override.uses++;
      family = override.family;
      familySort = family;
      familySource = 'explicit reviewed family override';
    }
    family = familyLabel(family, `layout ${portrait.set}/${portrait.species} family`);
    resolved.push({
      ...portrait, family, familySort, rowSort, familySource,
      mustReadContract: validateMustReadContract(
        contract, portrait.set, portrait.species, `layout ${portrait.set}/${portrait.species} mustRead contract`,
      ),
      proceduralPlan: portrait.set === 'procedural' ? meta.proceduralPlan : null,
    });
  }
  for (const override of overrides.entries) {
    assert(override.uses === 1,
      `reviewed family overrides: ${override.set}/${override.species} must be used exactly once; got ${override.uses}`);
  }
  validateRoster(resolved, 'resolved full-reset layout', expectedSets);

  const groups = new Map();
  for (const row of resolved) {
    const key = `${row.set}\u0000${row.familySort}\u0000${row.family}`;
    if (!groups.has(key)) groups.set(key, { set: row.set, family: row.family, familySort: row.familySort, rows: [] });
    groups.get(key).rows.push(row);
  }
  const orderedGroups = [...groups.values()].sort((a, b) => {
    const setDifference = setRank.get(a.set) - setRank.get(b.set);
    return setDifference || cmp(a.familySort, b.familySort) || cmp(a.family, b.family);
  });
  let ordinal = 0;
  for (const group of orderedGroups) {
    group.rows.sort((a, b) => cmp(a.rowSort, b.rowSort) || cmp(a.species, b.species));
    for (const row of group.rows) row.ordinal = ++ordinal;
  }
  assert(ordinal === expectedTotal(expectedSets), `layout: ordered ${ordinal} rows instead of ${expectedTotal(expectedSets)}`);

  const internalPackets = [];
  for (const group of orderedGroups) {
    const parts = Math.ceil(group.rows.length / perPacket);
    for (let offset = 0; offset < group.rows.length; offset += perPacket) {
      const part = Math.floor(offset / perPacket) + 1;
      internalPackets.push({
        packetId: String(internalPackets.length + 1).padStart(3, '0'),
        set: group.set,
        family: group.family,
        familyPart: part,
        familyParts: parts,
        rows: group.rows.slice(offset, offset + perPacket),
      });
    }
  }
  const bats = resolved.filter((row) => REVIEWED_FAMILY_OVERRIDES.some(
    (bat) => bat.set === row.set && bat.species === row.species,
  ));
  if (bats.length > 0) {
    assert(bats.length === REVIEWED_FAMILY_OVERRIDES.length,
      `layout: expected ${REVIEWED_FAMILY_OVERRIDES.length} reviewed bats, got ${bats.length}`);
    assert(bats.every((row) => row.family === 'Bats'), 'layout: reviewed bat family is split');
  }

  const publicPackets = internalPackets.map((packet) => ({
    packet_id: packet.packetId,
    set: packet.set,
    family: packet.family,
    family_part: packet.familyPart,
    family_parts: packet.familyParts,
    rows: packet.rows.map(publicRow),
  }));
  const packetByIdentity = new Map();
  for (const packet of internalPackets) {
    for (const row of packet.rows) packetByIdentity.set(rowKey(row.set, row.species), packet.packetId);
  }
  const digestRows = internalPackets.flatMap((packet) => packet.rows).map((row) =>
    `${row.ordinal}\u0000${row.set}\u0000${row.species}\u0000${row.family}\u0000${row.imageFile}\u0000${row.sha256}\u0000${row.proceduralPlan?.plan_sha256 ?? ''}\u0000${row.mustReadContract.sha256}\n`);
  const catalogueDigest = sha256(digestRows.join(''));
  const counts = Object.fromEntries(setOrder.map((set) => [set, resolved.filter((row) => row.set === set).length]));
  const sources = sourceSummary(evidence, metadata, other, mustReadContracts);
  const proceduralGroups = new Map();
  for (const row of resolved.filter((entry) => entry.set === 'procedural')) {
    const family = row.proceduralPlan.plan_family;
    if (!proceduralGroups.has(family)) proceduralGroups.set(family, []);
    proceduralGroups.get(family).push(row);
  }
  const proceduralPlanFamilies = [...proceduralGroups.entries()].sort(([a], [b]) => cmp(a, b)).map(([family, rows]) => ({
    plan_family: family,
    count: rows.length,
    identities: rows.slice().sort((a, b) => cmp(a.species, b.species)).map((row) => ({
      set: row.set,
      species: row.species,
      packet_id: packetByIdentity.get(rowKey(row.set, row.species)),
      ordinal: row.ordinal,
      sha256: row.sha256,
      procedural_plan_sha256: row.proceduralPlan.plan_sha256,
      must_read_contract_sha256: row.mustReadContract.sha256,
    })),
  }));
  assert(proceduralPlanFamilies.reduce((sum, group) => sum + group.count, 0) === expectedSets.procedural,
    'layout: procedural plan-family summary lost identities');
  const plan = {
    schema: PLAN_SCHEMA,
    purpose: 'Fresh full-catalogue art reset; this plan carries no historical verdict or PASS state.',
    identity_key: ['set', 'species'],
    total_identities: resolved.length,
    sets: counts,
    families: orderedGroups.length,
    packet_size: perPacket,
    packets: publicPackets.length,
    procedural_plan_families: proceduralPlanFamilies.length,
    packet_images_requested: includePackets,
    catalogue_sha256: catalogueDigest,
    family_rules: {
      'earth-fauna': 'nick-onebyone CSV expected_body_family',
      'earth-flora': 'nick-onebyone CSV expected_growth_family',
      'earth-fungi': 'reference/other.json family keyed by set + species',
      'earth-microbe': 'reference/other.json family keyed by set + species',
      procedural: 'procedural identity kingdom + heat bucket; seed index orders rows',
      reviewed_override: 'Bat, Fruit Bat, Vampire Bat, and Insect-Eating Bat are Bats',
    },
    reviewed_aliases: metadata.aliases,
    reviewed_family_overrides: familyOverrides.map(({ set, species, family }) => ({ set, species, family })),
    source_revision: metadata.sourceRevision,
    sources,
  };
  const index = {
    schema: INDEX_SCHEMA,
    identity_key: ['set', 'species'],
    total_identities: resolved.length,
    sets: counts,
    families: orderedGroups.length,
    packet_size: perPacket,
    packet_count: publicPackets.length,
    catalogue_sha256: catalogueDigest,
    source_revision: metadata.sourceRevision,
    packets: publicPackets,
  };
  const proceduralPlanIndex = {
    schema: PROCEDURAL_PLAN_INDEX_SCHEMA,
    identity_key: ['set', 'species'],
    catalogue_sha256: catalogueDigest,
    grouping_axis: 'live production plan_family (independent of the primary kingdom + heat packet axis)',
    total_identities: expectedSets.procedural,
    plan_family_count: proceduralPlanFamilies.length,
    source_revision: metadata.sourceRevision,
    families: proceduralPlanFamilies,
  };
  return { plan, index, proceduralPlanIndex, internalPackets, resolved };
}

function sourceSnapshot(evidence, metadata, other, mustReadContracts) {
  return JSON.stringify(sourceSummary(evidence, metadata, other, mustReadContracts));
}

function validateOutputTarget(outValue, evidence, sourceFiles) {
  const out = path.resolve(outValue);
  assert(!fs.existsSync(out), `output already exists: ${displayPath(out)}`);
  assert(!isWithin(out, evidence.root) && !isWithin(evidence.root, out),
    'output must not overlap the evidence root');
  for (const source of sourceFiles) {
    assert(normalizedPath(out) !== normalizedPath(source) && !isWithin(source, out),
      `output must not contain or replace source file ${displayPath(source)}`);
  }
  const parent = realDirectory(path.dirname(out), 'output parent');
  assert(normalizedPath(path.dirname(out)) === normalizedPath(parent), 'output parent changed during validation');
  assert(path.basename(out) !== '.' && path.basename(out) !== '..' && path.basename(out).trim(),
    'output must name a child directory');
  return out;
}

function safeSlug(value) {
  const stem = value.normalize('NFKD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'family';
  return `${stem.slice(0, 56)}-${sha256(value).slice(0, 8)}`;
}

async function openCdp() {
  assert(fs.existsSync(EDGE), `packet sheets require Edge at ${EDGE}`);
  const userData = path.join(os.tmpdir(), `cf-full-reset-layout-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
  const edge = spawn(EDGE, [
    '--headless=new', '--no-sandbox', '--no-first-run', '--disable-background-networking',
    '--disable-component-update', '--disable-component-extensions-with-background-pages',
    '--remote-debugging-port=0', `--user-data-dir=${userData}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  edge.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  let debuggerUrl = null;
  for (let attempt = 0; attempt < 75 && !debuggerUrl; attempt++) {
    await sleep(100);
    const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (match) debuggerUrl = match[1];
    if (edge.exitCode !== null) break;
  }
  if (!debuggerUrl) {
    edge.kill();
    fail(`packet sheets: Edge CDP did not start${stderr ? ` (${stderr.trim().slice(-240)})` : ''}`);
  }
  const ws = new WebSocket(debuggerUrl);
  let messageId = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const waiter = pending.get(message.id);
      pending.delete(message.id);
      message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
    }
  };
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++messageId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
  });
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  await send('Runtime.enable', {}, sessionId);
  return {
    async evaluate(expression) {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
      if (result.exceptionDetails) {
        fail(`packet canvas failed: ${String(result.exceptionDetails.exception?.description || result.exceptionDetails.text).slice(0, 400)}`);
      }
      return result.result.value;
    },
    close() {
      try { ws.close(); } finally { edge.kill(); }
    },
  };
}

async function composePacket(browser, packet, labelled) {
  const items = packet.rows.map((row) => ({
    ordinal: row.ordinal,
    set: row.set,
    species: row.species,
    hash: row.sha256.slice(0, 12),
    url: `data:image/png;base64,${fs.readFileSync(row.file).toString('base64')}`,
  }));
  const title = `${packet.set} / ${packet.family}${packet.familyParts > 1 ? ` / ${packet.familyPart} of ${packet.familyParts}` : ''}`;
  const payload = JSON.stringify({ packetId: packet.packetId, title, labelled, items });
  const expression = `(()=>new Promise(async(resolve)=>{
    const data=${payload}, C=280, LABEL=64, PAD=14, COLS=Math.min(4,data.items.length), ROWS=Math.ceil(data.items.length/COLS);
    const W=COLS*(C+PAD)+PAD, H=82+ROWS*(C+LABEL+PAD)+PAD;
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const c=cv.getContext('2d'); c.fillStyle='#070b12'; c.fillRect(0,0,W,H);
    c.textBaseline='middle'; c.textAlign='left'; c.fillStyle='#eadab7'; c.font='bold 22px Georgia,serif';
    c.fillText('Packet '+data.packetId+' - '+data.title,PAD,26);
    c.fillStyle='#8fa8c9'; c.font='13px system-ui,sans-serif';
    c.fillText(data.labelled?'LABELLED IDENTITY SHEET':'UNLABELLED SILHOUETTE / ANATOMY SHEET',PAD,56);
    const failed=[];
    function fit(text,max){if(c.measureText(text).width<=max)return text;let s=text;while(s.length>4&&c.measureText(s+'...').width>max)s=s.slice(0,-1);return s+'...';}
    async function image(url,label){return await new Promise(done=>{const im=new Image();im.onload=()=>done(im);im.onerror=()=>{failed.push(label);done(null)};im.src=url;});}
    for(let i=0;i<data.items.length;i++){
      const item=data.items[i], col=i%COLS, row=Math.floor(i/COLS), x=PAD+col*(C+PAD), y=82+row*(C+LABEL+PAD);
      c.fillStyle='#111b2b'; c.fillRect(x,y,C,C+LABEL); c.strokeStyle='#314866'; c.lineWidth=2; c.strokeRect(x,y,C,C+LABEL);
      const im=await image(item.url,item.set+'/'+item.species); if(im)c.drawImage(im,x,y,C,C);
      c.fillStyle='#d9e3ef'; c.textAlign='left'; c.font='bold 14px system-ui,sans-serif';
      c.fillText(data.labelled?fit(item.species,C-20):('#'+item.ordinal),x+10,y+C+20);
      c.fillStyle='#8298b5'; c.font='12px ui-monospace,monospace';
      c.fillText(data.labelled?fit(item.set+' '+item.hash,C-20):item.hash,x+10,y+C+44);
    }
    resolve({url:cv.toDataURL('image/png'),failed,width:W,height:H});
  }))()`;
  const result = await browser.evaluate(expression);
  assert(isObject(result) && typeof result.url === 'string' && result.url.startsWith('data:image/png;base64,'),
    `packet ${packet.packetId}: canvas did not return a PNG`);
  assert(Array.isArray(result.failed) && result.failed.length === 0,
    `packet ${packet.packetId}: image decode failed for ${result.failed.join(', ')}`);
  const buffer = Buffer.from(result.url.slice('data:image/png;base64,'.length), 'base64');
  const dimensions = pngDimensions(buffer, `packet ${packet.packetId}`);
  assert(dimensions.width === result.width && dimensions.height === result.height,
    `packet ${packet.packetId}: PNG dimensions differ from canvas`);
  return { buffer, width: dimensions.width, height: dimensions.height };
}

function packetSourceDigest(packet) {
  return sha256(packet.rows.map((row) => `${row.set}\u0000${row.species}\u0000${row.sha256}\n`).join(''));
}

async function writePreparedOutput(out, layout, includePackets) {
  const parent = path.dirname(out);
  const stage = fs.mkdtempSync(path.join(parent, `.${path.basename(out)}.stage-`));
  let browser = null;
  try {
    writeJsonExclusive(path.join(stage, 'plan.json'), layout.plan);
    writeJsonExclusive(path.join(stage, 'index.json'), layout.index);
    writeJsonExclusive(path.join(stage, 'procedural-plan-index.json'), layout.proceduralPlanIndex);
    if (includePackets) {
      const labelledDir = path.join(stage, 'packets', 'labelled');
      const unlabelledDir = path.join(stage, 'packets', 'unlabelled');
      fs.mkdirSync(labelledDir, { recursive: true });
      fs.mkdirSync(unlabelledDir, { recursive: true });
      browser = await openCdp();
      const files = [];
      for (const packet of layout.internalPackets) {
        const basename = `${packet.packetId}-${safeSlug(`${packet.set}-${packet.family}`)}.png`;
        for (const variant of ['labelled', 'unlabelled']) {
          const sheet = await composePacket(browser, packet, variant === 'labelled');
          const relative = `packets/${variant}/${basename}`;
          writeExclusive(path.join(stage, ...relative.split('/')), sheet.buffer);
          files.push({
            packet_id: packet.packetId,
            variant,
            file: relative,
            sha256: sha256(sheet.buffer),
            bytes: sheet.buffer.length,
            width: sheet.width,
            height: sheet.height,
            source_rows_sha256: packetSourceDigest(packet),
          });
        }
      }
      writeJsonExclusive(path.join(stage, 'packet-manifest.json'), {
        schema: PACKET_MANIFEST_SCHEMA,
        catalogue_sha256: layout.plan.catalogue_sha256,
        packet_count: layout.internalPackets.length,
        sheets: files.length,
        files,
      });
    }
    assert(!fs.existsSync(out), `output appeared while preparing: ${displayPath(out)}`);
    fs.renameSync(stage, out);
  } catch (error) {
    if (fs.existsSync(stage)) fs.rmSync(stage, { recursive: true, force: true });
    throw error;
  } finally {
    if (browser) browser.close();
  }
}

function fixtureProceduralPlans(metadataRows) {
  const byKey = new Map();
  for (const row of metadataRows.filter((entry) => entry.set === 'procedural')) {
    const { kingdom, heat, sample } = row.procedural;
    const result = {
      seed: sample + heat * 100,
      kingdom,
      heat,
      sample,
      route_kind: 'fixture',
      plan_family: `fixture ${kingdom} / plan ${sample}`,
      base_plan_family: `fixture ${kingdom} / plan ${sample}`,
      plan_detail: { kind: 'fixture' },
      genome: { seed: sample + heat * 100, kingdom, heat },
    };
    result.plan_sha256 = sha256(JSON.stringify(stableValue(result)));
    byKey.set(rowKey(row.set, row.species), result);
  }
  return { byKey, source: { live_runtime: 'selftest fixture resolver' } };
}

async function loadInputs(options, config = {}) {
  const expectedSets = config.expectedSets ?? EXPECTED_SETS;
  const nativeSize = config.nativeSize ?? NATIVE_SIZE;
  const aliases = config.aliases ?? REVIEWED_ALIASES;
  const familyOverrides = config.familyOverrides ?? REVIEWED_FAMILY_OVERRIDES;
  const sourceRevision = config.sourceRevision ?? inspectSourceRevision(options.sourceCommit);
  if (options.requireCleanSource) requireCleanSourceRevision(sourceRevision);
  const evidence = loadEvidence(options.evidence, 'current evidence', expectedSets, nativeSize, {
    mode: 'current', expectedCommit: sourceRevision.commit,
  });
  const metadata = loadMetadata(options.metadata, evidence, aliases, expectedSets);
  const other = loadOtherReferences(options.other, evidence);
  metadata.sourceRevision = sourceRevision;
  const proceduralPlans = config.proceduralPlans
    ? config.proceduralPlans(metadata.rows)
    : await deriveCurrentProceduralPlans(metadata.rows);
  assert(isObject(proceduralPlans) && proceduralPlans.byKey instanceof Map,
    'procedural plan derivation: resolver returned an invalid result');
  for (const row of metadata.rows.filter((entry) => entry.set === 'procedural')) {
    const plan = proceduralPlans.byKey.get(rowKey(row.set, row.species));
    assert(plan, `procedural plan derivation: missing ${row.species}`);
    row.proceduralPlan = plan;
  }
  assert(proceduralPlans.byKey.size === expectedSets.procedural,
    `procedural plan derivation: expected ${expectedSets.procedural} rows, got ${proceduralPlans.byKey.size}`);
  metadata.proceduralPlanSource = proceduralPlans.source;
  const mustReadContracts = config.mustReadContracts
    ? config.mustReadContracts(evidence, proceduralPlans)
    : loadMustReadContracts(evidence, proceduralPlans, { other: options.other });
  assert(isObject(mustReadContracts) && mustReadContracts.byKey instanceof Map
      && Array.isArray(mustReadContracts.sources),
  'mustRead contracts: resolver returned an invalid result');
  const layout = buildLayout({
    evidence, metadata, other, mustReadContracts, perPacket: options.perPacket, expectedSets,
    familyOverrides, includePackets: options.packets,
  });
  const expectedPackets = config.expectedPacketCount ?? EXPECTED_PACKET_COUNT;
  assert(layout.plan.packets === expectedPackets,
    `official packet contract: expected exactly ${expectedPackets} packets, got ${layout.plan.packets}`);
  return { evidence, metadata, other, mustReadContracts, layout, expectedSets, nativeSize };
}

async function verify(options) {
  const { evidence, metadata, other, layout } = await loadInputs(options);
  console.log('FULL RESET LAYOUT INPUTS PASS');
  console.log(`  exact set+species identities: ${layout.plan.total_identities}/${EXPECTED_TOTAL}`);
  for (const set of SET_ORDER) console.log(`  ${set}: ${layout.plan.sets[set]}/${EXPECTED_SETS[set]}`);
  console.log(`  family groups: ${layout.plan.families}`);
  console.log(`  procedural plan families: ${layout.plan.procedural_plan_families}`);
  console.log(`  review packets: ${layout.plan.packets} at <=${layout.plan.packet_size} identities each`);
  console.log(`  explicit aliases used once: ${metadata.aliases.length}/${REVIEWED_ALIASES.length}`);
  console.log(`  set-specific fungi/microbe reference rows available: ${other.rows.length}`);
  console.log(`  catalogue digest: ${layout.plan.catalogue_sha256}`);
  console.log(`  evidence digest: ${evidence.identityDigest}`);
  console.log(`  source revision: ${layout.plan.source_revision.commit}`);
  console.log(`  capture scope clean: ${layout.plan.source_revision.worktree_clean_for_capture}`);
  console.log('  no output written');
}

async function prepare(options) {
  options.requireCleanSource = true;
  const loaded = await loadInputs(options);
  const before = sourceSnapshot(loaded.evidence, loaded.metadata, loaded.other, loaded.mustReadContracts);
  const out = validateOutputTarget(options.out, loaded.evidence, [loaded.metadata.file, loaded.other.file]);
  await writePreparedOutput(out, loaded.layout, options.packets);
  const afterLoaded = await loadInputs(options);
  const after = sourceSnapshot(
    afterLoaded.evidence, afterLoaded.metadata, afterLoaded.other, afterLoaded.mustReadContracts,
  );
  assert(after === before, 'source evidence or family metadata changed while preparing output');
  console.log('FULL RESET LAYOUT PREPARATION PASS');
  console.log(`  wrote: ${displayPath(out)}`);
  console.log(`  exact identities: ${loaded.layout.plan.total_identities}`);
  console.log(`  family groups: ${loaded.layout.plan.families}`);
  console.log(`  procedural plan families: ${loaded.layout.plan.procedural_plan_families}`);
  console.log(`  review packets: ${loaded.layout.plan.packets}`);
  console.log(`  PNG sheets: ${options.packets ? loaded.layout.plan.packets * 2 : 0}`);
  console.log(`  catalogue digest: ${loaded.layout.plan.catalogue_sha256}`);
  console.log('  no verdicts or historical PASS state were generated');
}

function validFixturePng(tag) {
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  return Buffer.concat([pixel, Buffer.from(tag)]);
}

function fixtureDefinitions() {
  return [
    { set: 'earth-fauna', species: 'Bat' },
    { set: 'earth-fauna', species: 'Fruit Bat' },
    { set: 'earth-fauna', species: 'Vampire Bat' },
    { set: 'earth-fauna', species: 'Insect-Eating Bat' },
    { set: 'earth-fauna', species: 'Shared Name' },
    { set: 'earth-flora', species: 'Shared Name' },
    { set: 'earth-fungi', species: 'Chicken-of-the-Woods' },
    { set: 'earth-microbe', species: 'Fixture Microbe' },
    { set: 'procedural', species: 'fauna-h0-s0' },
    { set: 'procedural', species: 'flora-h2-s19' },
  ];
}

function writeFixtureEvidence(directory, definitions) {
  const rows = [];
  const files = [];
  for (const [index, definition] of definitions.entries()) {
    const filename = `portrait-${String(index + 1).padStart(2, '0')}.png`;
    const imageFile = `${definition.set}/${filename}`;
    const buffer = validFixturePng(`${definition.set}/${definition.species}`);
    const disk = path.join(directory, 'portraits', definition.set, filename);
    fs.mkdirSync(path.dirname(disk), { recursive: true });
    fs.writeFileSync(disk, buffer);
    const hash = sha256(buffer);
    rows.push({
      set: definition.set, species: definition.species, render_name: definition.species,
      image_file: imageFile, sha256: hash,
    });
    files.push({ set: definition.set, file: imageFile, sha256: hash, bytes: buffer.length, width: 1, height: 1 });
  }
  const counts = {};
  for (const definition of definitions) counts[definition.set] = (counts[definition.set] ?? 0) + 1;
  const captureProvenance = {
    schema: CAPTURE_PROVENANCE_SCHEMA,
    repository_root: '.',
    source_commit: FIXTURE_COMMIT,
    capture_scope: 'entire_repository_including_untracked',
    worktree_clean_before: true,
    worktree_clean_after: true,
    status_porcelain_sha256: sha256(''),
  };
  fs.mkdirSync(path.join(directory, 'review-info'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'identity-manifest.json'), JSON.stringify({
    schema: IDENTITY_SCHEMA, capture_provenance: captureProvenance, rows,
  }, null, 2) + '\n');
  fs.writeFileSync(path.join(directory, 'review-info', 'manifest.json'), JSON.stringify({
    schema: PORTRAIT_SCHEMA, capture_provenance: captureProvenance, portraits: rows.length, sets: counts, files,
  }, null, 2) + '\n');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function fixtureMetadataRows() {
  return [
    { category: 'fauna', display_name: 'Bat', expected_body_family: 'Flying mammals' },
    { category: 'fauna', display_name: 'Fruit Bat', expected_body_family: 'Bats' },
    { category: 'fauna', display_name: 'Vampire Bat', expected_body_family: 'Bats' },
    { category: 'fauna', display_name: 'Insect Eating Bat', expected_body_family: 'Flying mammals' },
    { category: 'fauna', display_name: 'Shared Name', expected_body_family: 'Fixture fauna, family' },
    { category: 'flora', display_name: 'Shared Name', expected_growth_family: 'Fixture flora family' },
    { category: 'fungi', display_name: 'Chicken of the Woods' },
    { category: 'microbe', display_name: 'Fixture Microbe' },
    { category: 'procedural', display_name: 'fauna-h0-s0', procedural_kind: 'fauna' },
    { category: 'procedural', display_name: 'flora-h2-s19', procedural_kind: 'flora' },
  ];
}

function writeFixtureMetadata(file, rows = fixtureMetadataRows()) {
  const headers = ['category', 'display_name', 'expected_body_family', 'expected_growth_family', 'procedural_kind', 'review_note'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(header === 'review_note' ? 'quoted, multiline\nfixture' : row[header])).join(','));
  }
  fs.writeFileSync(file, lines.join('\r\n') + '\r\n');
}

function writeFixtureOther(file, rows = [
  { name: 'Chicken-of-the-Woods', kingdom: 'fungi', family: 'shelf fungus' },
  { name: 'Fixture Microbe', kingdom: 'microbe', family: 'coccus colony' },
]) {
  fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n');
}

const FIXTURE_SETS = Object.freeze({
  'earth-fauna': 5,
  'earth-flora': 1,
  'earth-fungi': 1,
  'earth-microbe': 1,
  procedural: 2,
});
const FIXTURE_COMMIT = 'a'.repeat(40);
const FIXTURE_ALIASES = Object.freeze([
  { set: 'earth-fauna', source: 'Insect Eating Bat', target: 'Insect-Eating Bat' },
  { set: 'earth-fungi', source: 'Chicken of the Woods', target: 'Chicken-of-the-Woods' },
]);
const FIXTURE_OVERRIDES = Object.freeze(REVIEWED_FAMILY_OVERRIDES.map((row) => ({ ...row })));

function fixtureMustReadContracts(evidence, proceduralPlans) {
  const byKey = new Map();
  for (const portrait of evidence.rows) {
    const key = rowKey(portrait.set, portrait.species);
    const plan = proceduralPlans.byKey.get(key);
    byKey.set(key, mustReadContract({
      set: portrait.set,
      species: portrait.species,
      source: plan ? `selftest live plan: ${plan.plan_family}` : 'selftest exact reference',
      sourceSha256: plan?.plan_sha256 ?? sha256('selftest exact reference'),
      mustRead: plan
        ? [`recognizable ${plan.plan_family}`, 'connected procedural anatomy at both review scales']
        : [`recognizable exact ${portrait.set}/${portrait.species} anatomy`],
      note: 'Selftest contract.',
    }, `SELFTEST mustRead ${portrait.set}/${portrait.species}`));
  }
  return { byKey, sources: [{ file: 'selftest exact references', sha256: sha256('selftest exact reference') }] };
}

function makeFixture(parent, name) {
  const directory = path.join(parent, name);
  fs.mkdirSync(directory);
  const evidence = path.join(directory, 'evidence');
  const metadata = path.join(directory, 'metadata.csv');
  const other = path.join(directory, 'other.json');
  writeFixtureEvidence(evidence, fixtureDefinitions());
  writeFixtureMetadata(metadata);
  writeFixtureOther(other);
  return { directory, evidence, metadata, other };
}

async function loadFixture(fixture, overrides = {}) {
  const options = {
    evidence: fixture.evidence,
    metadata: fixture.metadata,
    other: fixture.other,
    perPacket: overrides.perPacket ?? 4,
    packets: overrides.packets ?? false,
  };
  return await loadInputs(options, {
    expectedSets: FIXTURE_SETS,
    nativeSize: 1,
    aliases: overrides.aliases ?? FIXTURE_ALIASES,
    familyOverrides: overrides.familyOverrides ?? FIXTURE_OVERRIDES,
    proceduralPlans: fixtureProceduralPlans,
    mustReadContracts: overrides.mustReadContracts ?? fixtureMustReadContracts,
    expectedPacketCount: 7,
    sourceRevision: overrides.sourceRevision ?? {
      repository_root: 'selftest',
      commit: FIXTURE_COMMIT,
      worktree_clean_for_capture: true,
      capture_scope: ['.'],
      changed_paths: [],
    },
  });
}

function expectRejected(label, work, pattern) {
  let caught = null;
  try { work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected defect was accepted`);
  assert(pattern.test(caught.message), `SELFTEST ${label}: wrong rejection (${caught.message})`);
}

async function expectRejectedAsync(label, work, pattern) {
  let caught = null;
  try { await work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected defect was accepted`);
  assert(pattern.test(caught.message), `SELFTEST ${label}: wrong rejection (${caught.message})`);
}

async function runSelftest() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-full-reset-layout-selftest-'));
  try {
    const goodFixture = makeFixture(temp, 'good');
    const good = await loadFixture(goodFixture);
    assert(good.layout.plan.total_identities === 10, 'SELFTEST positive layout lost identities');
    assert(good.layout.plan.reviewed_aliases.length === 2, 'SELFTEST positive layout lost aliases');
    const sharedRows = good.layout.resolved.filter((row) => row.species === 'Shared Name');
    assert(sharedRows.length === 2 && sharedRows[0].set !== sharedRows[1].set,
      'SELFTEST set+species identity collapsed cross-kingdom names');
    const bats = good.layout.resolved.filter((row) => ['Bat', 'Fruit Bat', 'Vampire Bat', 'Insect-Eating Bat'].includes(row.species));
    assert(bats.length === 4 && bats.every((row) => row.family === 'Bats'),
      'SELFTEST reviewed bats are not one Bats family');
    const repeated = await loadFixture(goodFixture);
    assert(JSON.stringify(good.layout.plan) === JSON.stringify(repeated.layout.plan)
      && JSON.stringify(good.layout.index) === JSON.stringify(repeated.layout.index),
    'SELFTEST deterministic repeat changed plan/index bytes');

    let browser = null;
    try {
      browser = await openCdp();
      const batPacket = good.layout.internalPackets.find((packet) => packet.family === 'Bats');
      const labelled = await composePacket(browser, batPacket, true);
      const unlabelled = await composePacket(browser, batPacket, false);
      assert(labelled.buffer.length > 100 && unlabelled.buffer.length > 100,
        'SELFTEST packet compositor returned thin PNGs');
      assert(sha256(labelled.buffer) !== sha256(unlabelled.buffer),
        'SELFTEST labelled/unlabelled packet controls produced identical output');
    } finally {
      if (browser) browser.close();
    }

    const preparedOut = path.join(temp, 'prepared');
    validateOutputTarget(preparedOut, good.evidence, [good.metadata.file, good.other.file]);
    await writePreparedOutput(preparedOut, good.layout, false);
    assert(fs.existsSync(path.join(preparedOut, 'plan.json')) && fs.existsSync(path.join(preparedOut, 'index.json'))
      && fs.existsSync(path.join(preparedOut, 'procedural-plan-index.json')),
    'SELFTEST plan-only preparation did not write all three manifests');
    expectRejected('existing target',
      () => validateOutputTarget(preparedOut, good.evidence, [good.metadata.file, good.other.file]), /already exists/);
    expectRejected('overlapping evidence target',
      () => validateOutputTarget(path.join(good.evidence.root, 'new-layout'), good.evidence, [good.metadata.file, good.other.file]),
      /must not overlap the evidence root/);
    expectRejected('dirty committed-source provenance', () => requireCleanSourceRevision({
      commit: 'b'.repeat(40), worktree_clean_for_capture: false, changed_paths: ['M port/v2/packages/art/src/example.ts'],
    }), /entire repository is dirty/);
    expectRejected('non-ten official packet size', () => parseArgs([
      '--verify', '--evidence=selftest', '--per=9',
    ]), /requires --per=10/);

    const wrongCommit = makeFixture(temp, 'wrong-commit');
    await expectRejectedAsync('wrong current evidence commit', () => loadFixture(wrongCommit, {
      sourceRevision: {
        repository_root: 'selftest', commit: 'b'.repeat(40), worktree_clean_for_capture: true,
        capture_scope: ['.'], changed_paths: [],
      },
    }), /capture commit .* does not match/i);

    const dirtyCapture = makeFixture(temp, 'dirty-capture');
    for (const file of [
      path.join(dirtyCapture.evidence, 'identity-manifest.json'),
      path.join(dirtyCapture.evidence, 'review-info', 'manifest.json'),
    ]) {
      const raw = readJson(file, 'SELFTEST dirty capture');
      raw.capture_provenance.worktree_clean_after = false;
      fs.writeFileSync(file, JSON.stringify(raw, null, 2) + '\n');
    }
    await expectRejectedAsync('dirty current capture provenance', () => loadFixture(dirtyCapture), /not clean before and after/i);

    const mismatchedCapture = makeFixture(temp, 'mismatched-capture');
    const mismatchedManifest = path.join(mismatchedCapture.evidence, 'review-info', 'manifest.json');
    const mismatchedRaw = readJson(mismatchedManifest, 'SELFTEST mismatched capture');
    mismatchedRaw.capture_provenance.source_commit = 'b'.repeat(40);
    fs.writeFileSync(mismatchedManifest, JSON.stringify(mismatchedRaw, null, 2) + '\n');
    await expectRejectedAsync('identity/portrait capture mismatch', () => loadFixture(mismatchedCapture), /capture commit .* does not match/i);

    const legacyCurrent = makeFixture(temp, 'legacy-current');
    const legacyIdentityFile = path.join(legacyCurrent.evidence, 'identity-manifest.json');
    const legacyPortraitFile = path.join(legacyCurrent.evidence, 'review-info', 'manifest.json');
    const legacyIdentity = readJson(legacyIdentityFile, 'SELFTEST legacy identity');
    const legacyPortrait = readJson(legacyPortraitFile, 'SELFTEST legacy portrait');
    legacyIdentity.schema = LEGACY_IDENTITY_SCHEMA;
    legacyPortrait.schema = LEGACY_PORTRAIT_SCHEMA;
    delete legacyIdentity.capture_provenance;
    delete legacyPortrait.capture_provenance;
    fs.writeFileSync(legacyIdentityFile, JSON.stringify(legacyIdentity, null, 2) + '\n');
    fs.writeFileSync(legacyPortraitFile, JSON.stringify(legacyPortrait, null, 2) + '\n');
    await expectRejectedAsync('unprovenanced current evidence', () => loadFixture(legacyCurrent), /historical comparison side/i);

    const emptyProceduralContract = makeFixture(temp, 'empty-procedural-contract');
    await expectRejectedAsync('empty procedural mustRead contract', () => loadFixture(emptyProceduralContract, {
      mustReadContracts: (evidence, plans) => {
        const result = fixtureMustReadContracts(evidence, plans);
        const key = rowKey('procedural', 'fauna-h0-s0');
        result.byKey.set(key, { ...result.byKey.get(key), must_read: [] });
        return result;
      },
    }), /must_read: expected at least one criterion/i);

    const wrongName = makeFixture(temp, 'wrong-name');
    const wrongNameRows = fixtureMetadataRows();
    wrongNameRows[4].display_name = 'Wrong Name';
    writeFixtureMetadata(wrongName.metadata, wrongNameRows);
    await expectRejectedAsync('wrong set/name', () => loadFixture(wrongName), /identity absent from current evidence/);

    const missingMetadata = makeFixture(temp, 'missing-metadata');
    writeFixtureMetadata(missingMetadata.metadata, fixtureMetadataRows().slice(0, -1));
    await expectRejectedAsync('missing identity', () => loadFixture(missingMetadata), /expected 10 rows, got 9/);

    const extraMetadata = makeFixture(temp, 'extra-metadata');
    const extraRows = fixtureMetadataRows();
    extraRows.push({ category: 'flora', display_name: 'Extra', expected_growth_family: 'Extra family' });
    writeFixtureMetadata(extraMetadata.metadata, extraRows);
    await expectRejectedAsync('extra identity', () => loadFixture(extraMetadata), /expected 10 rows, got 11/);

    const duplicateIdentity = makeFixture(temp, 'duplicate-identity');
    const duplicateFile = path.join(duplicateIdentity.evidence, 'identity-manifest.json');
    const duplicateRaw = readJson(duplicateFile, 'SELFTEST duplicate identity');
    duplicateRaw.rows[4].species = duplicateRaw.rows[0].species;
    fs.writeFileSync(duplicateFile, JSON.stringify(duplicateRaw, null, 2) + '\n');
    await expectRejectedAsync('duplicate identity', () => loadFixture(duplicateIdentity), /duplicate identity/);

    const staleHash = makeFixture(temp, 'stale-hash');
    const staleFile = path.join(staleHash.evidence, 'identity-manifest.json');
    const staleRaw = readJson(staleFile, 'SELFTEST stale hash');
    staleRaw.rows[0].sha256 = '0'.repeat(64);
    fs.writeFileSync(staleFile, JSON.stringify(staleRaw, null, 2) + '\n');
    await expectRejectedAsync('stale SHA', () => loadFixture(staleHash), /differs from portrait manifest/);

    const staleDimension = makeFixture(temp, 'stale-dimension');
    const dimensionFile = path.join(staleDimension.evidence, 'review-info', 'manifest.json');
    const dimensionRaw = readJson(dimensionFile, 'SELFTEST stale dimension');
    dimensionRaw.files[0].width = 2;
    fs.writeFileSync(dimensionFile, JSON.stringify(dimensionRaw, null, 2) + '\n');
    await expectRejectedAsync('stale dimensions', () => loadFixture(staleDimension), /expected 1x1/);

    const traversal = makeFixture(temp, 'path-traversal');
    const traversalFile = path.join(traversal.evidence, 'identity-manifest.json');
    const traversalRaw = readJson(traversalFile, 'SELFTEST traversal');
    traversalRaw.rows[0].image_file = 'earth-fauna/../earth-flora/portrait-06.png';
    fs.writeFileSync(traversalFile, JSON.stringify(traversalRaw, null, 2) + '\n');
    await expectRejectedAsync('path escape', () => loadFixture(traversal), /path traversal is forbidden/);

    const linkTarget = makeFixture(temp, 'link-target');
    const linkPath = path.join(temp, 'evidence-link');
    fs.symlinkSync(linkTarget.evidence, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
    expectRejected('symlink evidence root', () => loadEvidence(linkPath, 'SELFTEST link', FIXTURE_SETS, 1), /not a link/);

    const aliasDrift = makeFixture(temp, 'alias-drift');
    const driftAliases = [...FIXTURE_ALIASES, { set: 'earth-fauna', source: 'Unknown Alias', target: 'Shared Name' }];
    await expectRejectedAsync('unknown alias', () => loadFixture(aliasDrift, { aliases: driftAliases }), /duplicate alias target|must be used exactly once/);
    const duplicateAliases = [FIXTURE_ALIASES[0], { ...FIXTURE_ALIASES[0] }, FIXTURE_ALIASES[1]];
    await expectRejectedAsync('duplicate alias', () => loadFixture(aliasDrift, { aliases: duplicateAliases }), /duplicate alias source/);

    const invalidFamily = makeFixture(temp, 'invalid-family');
    const invalidRows = fixtureMetadataRows();
    invalidRows[4].expected_body_family = 'PASS';
    writeFixtureMetadata(invalidFamily.metadata, invalidRows);
    await expectRejectedAsync('invalid status family', () => loadFixture(invalidFamily), /is not a family/);

    const wrongOtherSet = makeFixture(temp, 'wrong-other-set');
    writeFixtureOther(wrongOtherSet.other, [
      { name: 'Chicken-of-the-Woods', kingdom: 'microbe', family: 'shelf fungus' },
      { name: 'Fixture Microbe', kingdom: 'microbe', family: 'coccus colony' },
    ]);
    await expectRejectedAsync('set-specific other reference', () => loadFixture(wrongOtherSet), /current identity is missing/);

    const splitBats = makeFixture(temp, 'split-bats');
    const incompleteOverrides = FIXTURE_OVERRIDES.filter((row) => row.species !== 'Bat');
    await expectRejectedAsync('bat split', () => loadFixture(splitBats, { familyOverrides: incompleteOverrides }), /reviewed bat family is split/);

    const extraPortrait = makeFixture(temp, 'extra-portrait');
    fs.writeFileSync(path.join(extraPortrait.evidence, 'portraits', 'earth-fauna', 'extra.png'), validFixturePng('extra'));
    await expectRejectedAsync('extra portrait file', () => loadFixture(extraPortrait), /do not exactly match/);

    console.log('FULL RESET LAYOUT SELFTEST PASS');
    console.log('  exact set+species join + cross-kingdom duplicate names: PASS');
    console.log('  explicit aliases each used once: PASS');
    console.log('  four reviewed bats grouped under Bats: PASS');
    console.log('  deterministic plan/index repeat: PASS');
    console.log('  labelled + unlabelled real-browser packet compositor: PASS');
    console.log('  plan-only atomic output: PASS');
    console.log('  wrong set/name, missing, extra, and duplicate identities: rejected');
    console.log('  stale SHA and dimensions: rejected');
    console.log('  path and symlink escape: rejected');
    console.log('  existing and overlapping targets: rejected');
    console.log('  dirty committed-source provenance: rejected');
    console.log('  stale/wrong/dirty/unprovenanced current capture: rejected');
    console.log('  non-10 official layout and empty procedural mustRead contract: rejected');
    console.log('  unknown/duplicate alias and alias drift: rejected');
    console.log('  invalid family, set-specific reference error, and bat split: rejected');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function parseArgs(args) {
  const options = {
    verify: false,
    prepare: false,
    selftest: false,
    help: false,
    packets: false,
    evidence: null,
    out: null,
    metadata: DEFAULT_METADATA,
    other: DEFAULT_OTHER,
    perPacket: DEFAULT_PER_PACKET,
    sourceCommit: null,
    requireCleanSource: false,
  };
  for (const argument of args) {
    if (argument === '--verify') options.verify = true;
    else if (argument === '--prepare') options.prepare = true;
    else if (argument === '--selftest') options.selftest = true;
    else if (argument === '--packets') options.packets = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument.startsWith('--evidence=')) options.evidence = argument.slice('--evidence='.length);
    else if (argument.startsWith('--out=')) options.out = argument.slice('--out='.length);
    else if (argument.startsWith('--metadata=')) options.metadata = argument.slice('--metadata='.length);
    else if (argument.startsWith('--other=')) options.other = argument.slice('--other='.length);
    else if (argument.startsWith('--per=')) options.perPacket = Number(argument.slice('--per='.length));
    else if (argument.startsWith('--source-commit=')) options.sourceCommit = argument.slice('--source-commit='.length);
    else fail(`unknown argument: ${argument}`);
  }
  if (!options.help) {
    const modes = [options.verify, options.prepare, options.selftest].filter(Boolean).length;
    assert(modes === 1, 'choose exactly one of --verify, --prepare, or --selftest');
    assert(!options.selftest || (!options.evidence && !options.out && !options.packets && !options.sourceCommit),
      '--selftest does not accept evidence/output/packet options');
    if (!options.selftest) {
      assert(typeof options.evidence === 'string' && options.evidence.trim(), '--evidence is required and must be explicit');
      assert(options.perPacket === DEFAULT_PER_PACKET,
        `official full-reset layout requires --per=${DEFAULT_PER_PACKET}`);
    }
    if (options.prepare) assert(typeof options.out === 'string' && options.out.trim(), '--prepare requires explicit --out');
    else assert(!options.out, '--out is valid only with --prepare');
    assert(!options.packets || options.prepare, '--packets is valid only with --prepare');
  }
  return options;
}

function usage() {
  console.log('Usage:');
  console.log('  node tools/fullresetlayout.mjs --verify --evidence=<evidence-root> [--per=10]');
  console.log('  node tools/fullresetlayout.mjs --prepare --evidence=<evidence-root> --out=<new-dir> [--per=10] [--packets] [--source-commit=<40-hex>]');
  console.log('  node tools/fullresetlayout.mjs --selftest');
  console.log('');
  console.log('The evidence root must contain identity-manifest.json, review-info/manifest.json, and portraits/.');
  console.log('Preparation requires the entire repository clean, refuses existing/overlapping outputs, and never creates verdicts.');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { usage(); return; }
  if (options.selftest) await runSelftest();
  else if (options.verify) await verify(options);
  else await prepare(options);
}

const directInvocation = process.argv[1]
  && normalizedPath(process.argv[1]) === normalizedPath(fileURLToPath(import.meta.url));

if (directInvocation) {
  try {
    await run();
  } catch (error) {
    console.error('FULL RESET LAYOUT FAILED');
    console.error(`  ${error.message}`);
    process.exitCode = 1;
  }
}

/* The fresh-review companion imports only these fail-closed primitives. Keeping
   the exports here avoids a second, subtly different evidence validator while
   preserving this command's standalone behavior and historical-tool isolation. */
export {
  EXPECTED_SETS,
  EXPECTED_TOTAL,
  EXPECTED_PACKET_COUNT,
  INDEX_SCHEMA,
  NATIVE_SIZE,
  PACKET_MANIFEST_SCHEMA,
  assert,
  cmp,
  displayPath,
  hashFile,
  isObject,
  isWithin,
  loadEvidence,
  nonempty,
  normalizedPath,
  openCdp,
  pngDimensions,
  portable,
  readJson,
  realDirectory,
  rowKey,
  sha256,
  sourceFile,
  validateMustReadContract,
  writeExclusive,
  writeJsonExclusive,
};
