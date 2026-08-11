/* gp71rejudge.mjs — GP7.1 full fresh-strict review preparation and collector.

   This is deliberately separate from the frozen GP7 tools and verdicts.
   `--prepare` renders the current catalogue through audit.html, captures every
   native PNG, and rebuilds the existing 196-packet review partition under a
   new gp71-only output folder.  It never copies a historical band.

   `--collect` is deliberately fail-closed.  It creates a GP7-conformity-ready
   results file and ledger only after every packet has a dated strict verdict
   whose rows, order, source ruler, and current strip hash agree with the
   prepared evidence.

   Usage:
     node tools/gp71rejudge.mjs --prepare [--out=gp71-rejudge] [--date=2026-08-09]
     node tools/gp71rejudge.mjs --collect [--out=gp71-rejudge]
     node tools/gp71rejudge.mjs --selftest

   The legacy catalogue-review index is used only as a frozen 196-packet
   partition.  It is not a source of pixels, scores, reasons, or freshness.
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { loadProceduralNameBridge } from './proceduralnames.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const repositoryRoot = path.resolve(root, '..', '..');
const appDir = path.join(root, 'apps', 'game');
const smokeDir = path.join(appDir, 'smoke');
const distDir = path.join(appDir, 'dist');
const FRESH_RULER = 'GP7 fresh strict rejudge';
const SCHEMA = 'cf.gp71.strict-verdict.v1';
const PREPARATION_SCHEMA = 'cf.gp71.rejudge-preparation.v2';
const IDENTITY_SCHEMA = 'cf.gp71.identity-manifest.v2';
const PORTRAIT_SCHEMA = 'cf.gp71.portrait-manifest.v2';
const CAPTURE_PROVENANCE_SCHEMA = 'cf.capture-provenance.v1';
const EXPECTED_SETS = Object.freeze({
  'earth-fauna': 631,
  'earth-flora': 332,
  'earth-fungi': 27,
  'earth-microbe': 20,
  procedural: 240,
});
const EXPECTED_TOTAL = 1250;
const EXPECTED_PACKETS = 196;
const LEGAL_BANDS = new Set(['FAIL', 'POLISH', 'PASS']);
const STATUS_FAMILY = /^(PASS|POLISH|HOLD|FAIL|TRUE|FALSE|HIGH|LOW|MEDIUM|N\/?A|NONE|UNKNOWN|\d+)$/i;
const DEFAULT_LAYOUT = path.join(root, 'reference', 'goldpass7-results.json');
const ACTION_BY_BAND = Object.freeze({
  FAIL: 'FIX_TO_PASS',
  POLISH: 'POLISH_TO_PASS',
  PASS: 'FREEZE',
});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function portable(value) { return value.split(path.sep).join('/'); }
function rowKey(set, species) { return `${set}\u0000${species}`; }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function dateString(value, where) {
  assert(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value),
    `${where}: expected YYYY-MM-DD`);
  return value;
}
function string(value, where) {
  assert(typeof value === 'string' && value.trim().length > 0, `${where}: must be a nonempty string`);
  return value.trim();
}
function bool(value, where) {
  assert(value === true || value === false, `${where}: must be boolean true/false`);
  return value;
}
function readJson(file, label) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); }
  catch (error) { fail(`${label}: cannot read ${portable(file)} (${error.message})`); }
  try { return JSON.parse(text); }
  catch (error) { fail(`${label}: invalid JSON (${error.message})`); }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}
function hashFile(file) { return sha256(fs.readFileSync(file)); }
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}
function canonicalJson(value) { return JSON.stringify(canonical(value)); }

function gitOutput(args, label) {
  try {
    return execFileSync('git', args, {
      cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const detail = String(error.stderr || error.message || '').trim();
    fail(`${label}: git command failed${detail ? ` (${detail.slice(0, 300)})` : ''}`);
  }
}
function validateRepositorySnapshot(raw, where = 'capture source') {
  assert(isObject(raw), `${where}: expected a repository snapshot`);
  const repository = path.resolve(string(raw.repository_root, `${where}.repository_root`));
  assert(process.platform === 'win32'
    ? repository.toLowerCase() === repositoryRoot.toLowerCase()
    : repository === repositoryRoot,
  `${where}: unexpected repository root ${repository}`);
  const commit = string(raw.commit, `${where}.commit`).toLowerCase();
  assert(/^[0-9a-f]{40}$/.test(commit), `${where}: expected an exact 40-hex HEAD`);
  const status = typeof raw.status === 'string' ? raw.status : '';
  assert(status === '', `${where}: entire repository must be clean (tracked and untracked); got ${status || 'unknown changes'}`);
  return { repository_root: repository, commit, status };
}
function inspectCleanRepository() {
  const repository = path.resolve(gitOutput(['rev-parse', '--show-toplevel'], 'capture source root'));
  const commit = gitOutput(['rev-parse', 'HEAD'], 'capture source HEAD').toLowerCase();
  const status = gitOutput(['status', '--porcelain=v1', '--untracked-files=all'], 'capture source status');
  return validateRepositorySnapshot({ repository_root: repository, commit, status });
}
function captureProvenance(before, after) {
  const first = validateRepositorySnapshot(before, 'capture source before render');
  const last = validateRepositorySnapshot(after, 'capture source after render');
  assert(first.commit === last.commit,
    `capture source changed commits during render (${first.commit} -> ${last.commit})`);
  return {
    schema: CAPTURE_PROVENANCE_SCHEMA,
    repository_root: '.',
    source_commit: first.commit,
    capture_scope: 'entire_repository_including_untracked',
    worktree_clean_before: true,
    worktree_clean_after: true,
    status_porcelain_sha256: sha256(''),
  };
}
function validateCaptureProvenance(raw, where, expectedCommit = null) {
  assert(isObject(raw), `${where}: missing capture provenance`);
  const expectedKeys = [
    'schema', 'repository_root', 'source_commit', 'capture_scope',
    'worktree_clean_before', 'worktree_clean_after', 'status_porcelain_sha256',
  ].sort();
  assert(JSON.stringify(Object.keys(raw).sort()) === JSON.stringify(expectedKeys),
    `${where}: capture provenance keys are incomplete or unexpected`);
  assert(raw.schema === CAPTURE_PROVENANCE_SCHEMA, `${where}: wrong capture provenance schema`);
  assert(raw.repository_root === '.', `${where}: repository_root must be portable '.'`);
  const commit = string(raw.source_commit, `${where}.source_commit`).toLowerCase();
  assert(/^[0-9a-f]{40}$/.test(commit), `${where}: source_commit must be exact 40-hex`);
  if (expectedCommit !== null) assert(commit === expectedCommit, `${where}: source commit mismatch`);
  assert(raw.capture_scope === 'entire_repository_including_untracked', `${where}: capture scope is not the entire repository`);
  assert(raw.worktree_clean_before === true && raw.worktree_clean_after === true,
    `${where}: capture was not clean before and after rendering`);
  assert(raw.status_porcelain_sha256 === sha256(''), `${where}: clean-status digest is invalid`);
  return { ...raw, source_commit: commit };
}
function validateBrowserProvenance(raw, where) {
  assert(isObject(raw), `${where}: missing browser provenance`);
  const expectedKeys = ['executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version'].sort();
  assert(JSON.stringify(Object.keys(raw).sort()) === JSON.stringify(expectedKeys),
    `${where}: browser provenance keys are incomplete or unexpected`);
  const executable = string(raw.executable, `${where}.executable`).replaceAll('\\', '/');
  assert(executable.startsWith('/') || /^[A-Za-z]:\//.test(executable), `${where}.executable must be absolute`);
  for (const key of ['product', 'revision', 'user_agent', 'js_version', 'protocol_version']) {
    string(raw[key], `${where}.${key}`);
  }
  return { ...raw, executable };
}
function pngDimensions(buffer, where) {
  assert(Buffer.isBuffer(buffer) && buffer.length >= 24, `${where}: not a complete PNG`);
  assert(buffer.toString('hex', 0, 8) === '89504e470d0a1a0a', `${where}: not a PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
function safePortraitName(name) {
  return name.replace(/[^A-Za-z0-9 _\-Â·â€™']/g, '').replace(/\s+/g, '_').slice(0, 60) + '.png';
}
function outputDirectory(raw) {
  const name = raw || 'gp71-rejudge';
  assert(typeof name === 'string' && /^gp71-[a-z0-9][a-z0-9-]*$/.test(name),
    '--out must be one safe gp71-* directory name (no path segments)');
  return { name, dir: path.join(smokeDir, name) };
}
function setCounts(rows, label) {
  assert(Array.isArray(rows), `${label}: rows must be an array`);
  assert(rows.length === EXPECTED_TOTAL, `${label}: expected ${EXPECTED_TOTAL} rows, got ${rows.length}`);
  const counts = Object.fromEntries(Object.keys(EXPECTED_SETS).map((set) => [set, 0]));
  const seen = new Set();
  for (const [offset, row] of rows.entries()) {
    assert(isObject(row), `${label} row ${offset + 1}: must be an object`);
    const set = string(row.set, `${label} row ${offset + 1}.set`);
    const species = string(row.species ?? row.name, `${label} row ${offset + 1}.species`);
    assert(set in counts, `${label} row ${offset + 1}: unknown set ${JSON.stringify(set)}`);
    const key = rowKey(set, species);
    assert(!seen.has(key), `${label}: duplicate identity ${JSON.stringify(key)}`);
    seen.add(key);
    counts[set]++;
  }
  for (const [set, expected] of Object.entries(EXPECTED_SETS)) {
    assert(counts[set] === expected, `${label}: ${set} expected ${expected}, got ${counts[set]}`);
  }
  return { counts, keys: seen };
}

/* The historical GP7 result file supplies only a deterministic packet
   partition: set/name/family membership.  Bands, reasons, verified flags, and
   every other judgement field are intentionally discarded.  One historical
   fungi row carried an implementation-shaped family string; fold that back to
   the standard fungi packet so the partition remains the established 196
   packets rather than manufacturing a 197th singleton. */
function packetsFromHistoricalPartition(raw) {
  assert(isObject(raw) && Array.isArray(raw.rows),
    'historical partition: expected an object with rows[]');
  const identities = raw.rows.map((row, offset) => {
    const where = `historical partition row ${offset + 1}`;
    assert(isObject(row), `${where}: must be an object`);
    const set = string(row.set, `${where}.set`);
    const name = string(row.species ?? row.name, `${where}.species`);
    let family = typeof row.family === 'string' ? row.family.trim() : '';
    if (!family || STATUS_FAMILY.test(family) || /^earth-(fauna|flora|fungi|microbe)(?:\s|$)/i.test(family)) {
      family = `(unfamilied) ${set}`;
    }
    return { set, name, family };
  });
  setCounts(identities.map((row) => ({ set: row.set, species: row.name })), 'historical partition');
  const byFamily = new Map();
  for (const row of identities) {
    if (!byFamily.has(row.family)) byFamily.set(row.family, []);
    byFamily.get(row.family).push(row);
  }
  const packets = [];
  for (const [family, members] of [...byFamily.entries()].sort((a, b) => b[1].length - a[1].length)) {
    members.sort((a, b) => a.name.localeCompare(b.name));
    for (let offset = 0; offset < members.length; offset += 14) {
      packets.push({ family, species: members.slice(offset, offset + 14).map((row) => ({ set: row.set, name: row.name })) });
    }
  }
  assert(packets.length === EXPECTED_PACKETS,
    `historical partition: expected ${EXPECTED_PACKETS} packets after normalization, got ${packets.length}`);
  return packets;
}

/* The established 196 contact-sheet order is a review *partition*, not a
   score. It is intentionally revalidated against the fresh audit before any
   rendering starts, so a source roster change cannot be silently judged as an
   old name. A checked-in historical-results input is preferred because smoke/
   outputs are intentionally ignored; an existing index array is accepted for
   backwards-compatible reconstruction. */
function loadFrozenLayout(layoutFile) {
  const raw = readJson(layoutFile, 'frozen 196-packet layout');
  const rawPackets = Array.isArray(raw) ? raw : packetsFromHistoricalPartition(raw);
  assert(rawPackets.length === EXPECTED_PACKETS,
    `frozen 196-packet layout: expected ${EXPECTED_PACKETS} packets, got ${rawPackets.length}`);
  const rows = [];
  const packets = rawPackets.map((packet, offset) => {
    const where = `frozen layout packet ${offset + 1}`;
    assert(isObject(packet), `${where}: must be an object`);
    const family = string(packet.family, `${where}.family`);
    assert(Array.isArray(packet.species) && packet.species.length > 0,
      `${where}.species: must be a nonempty array`);
    assert(packet.species.length <= 14, `${where}: has ${packet.species.length} rows; maximum is 14`);
    const species = packet.species.map((row, memberOffset) => {
      const memberWhere = `${where} row ${memberOffset + 1}`;
      assert(isObject(row), `${memberWhere}: must be an object`);
      const set = string(row.set, `${memberWhere}.set`);
      const name = string(row.name ?? row.species, `${memberWhere}.name`);
      rows.push({ set, species: name });
      return { set, name };
    });
    return Object.freeze({
      id: String(offset + 1).padStart(3, '0'),
      family,
      species: Object.freeze(species),
    });
  });
  setCounts(rows, 'frozen 196-packet layout');
  return Object.freeze(packets);
}

function verifyPartition(layout, sourceRows) {
  const layoutRows = layout.flatMap((packet) => packet.species.map((row) => ({ set: row.set, species: row.name })));
  const source = setCounts(sourceRows, 'fresh current audit identity');
  const partition = setCounts(layoutRows, 'frozen 196-packet layout');
  for (const key of source.keys) {
    assert(partition.keys.has(key), `current audit identity is absent from frozen 196-packet layout: ${JSON.stringify(key)}`);
  }
  for (const key of partition.keys) {
    assert(source.keys.has(key), `frozen 196-packet layout contains an identity absent from the current audit: ${JSON.stringify(key)}`);
  }
}

function manifestFromSource(sourceRows, provenance) {
  const capture = validateCaptureProvenance(provenance, 'portrait manifest capture provenance');
  const files = sourceRows.map((row) => ({
    set: row.set,
    file: row.file,
    sha256: row.sha256,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
  }));
  setCounts(sourceRows, 'fresh current audit identity');
  const seenFiles = new Set();
  for (const [offset, file] of files.entries()) {
    assert(file.file.startsWith(`${file.set}/`), `manifest row ${offset + 1}: image file escapes its set`);
    assert(!seenFiles.has(file.file), `manifest: duplicate image file ${JSON.stringify(file.file)}`);
    seenFiles.add(file.file);
    assert(/^[0-9a-f]{64}$/.test(file.sha256), `manifest row ${offset + 1}: invalid SHA-256`);
    assert(file.width === 440 && file.height === 440,
      `manifest row ${offset + 1}: expected native 440x440, got ${file.width}x${file.height}`);
  }
  return {
    schema: PORTRAIT_SCHEMA,
    generated_for: 'GP7.1 fresh strict rejudge',
    capture_provenance: capture,
    portraits: files.length,
    dimensions: '440x440 native PNG',
    sets: EXPECTED_SETS,
    files,
  };
}

function packetMarkdown(packet, packetRows, relativeStrip, stripHash, reviewDate) {
  const lines = [
    `# GP7.1 FRESH STRICT REJUDGE — packet ${packet.id}`,
    '',
    `Family partition: ${packet.family}`,
    `Review date required in every row: ${reviewDate}`,
    `Source ruler required in every row: ${FRESH_RULER}`,
    '',
    'This packet contains freshly rendered current pixels. Historical GP7 bands,',
    'reasons, and carried status are intentionally excluded. Judge each row strictly',
    'against the current visual and its supplied reference. A missing must-read is FAIL.',
    'Do not infer PASS from a prior score or from the current tool finishing cleanly.',
    '',
    `strip: ${relativeStrip}`,
    `strip_sha256: ${stripHash}`,
    '',
    'Verdict file: `verdicts/packet-' + packet.id + '.json`',
    '',
  ];
  for (const [offset, row] of packetRows.entries()) {
    lines.push(`## ${offset + 1}. ${row.name} [${row.set}]`);
    lines.push(`portrait_sha256: ${row.sha256}`);
    if (row.reference) {
      for (const [key, value] of Object.entries(row.reference)) {
        if (key === 'name') continue;
        lines.push(`${key}: ${Array.isArray(value) ? value.join(' · ') : String(value)}`);
      }
    } else {
      lines.push('reference: procedural/unlisted — judge coherent, distinct body plan and readable structure.');
    }
    lines.push('');
  }
  return lines.join('\n') + '\n';
}

function verdictSchema() {
  return {
    schema: SCHEMA,
    title: 'GP7.1 fresh strict packet verdict',
    no_verdicts_are_generated_by_prepare: true,
    required_packet_fields: {
      schema: SCHEMA,
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
      ruler: FRESH_RULER,
      freshly_rejudged: true,
      strict: true,
    },
    collector_contract: 'Only a complete 1,250-row exact join yields results and ledger. The ledger remains GP7-conformity compatible but --certify still requires every band to be PASS.',
  };
}

function references() {
  const out = new Map();
  for (const source of ['fauna', 'flora', 'other']) {
    const file = path.join(root, 'reference', `${source}.json`);
    if (!fs.existsSync(file)) continue;
    const raw = readJson(file, `reference/${source}.json`);
    assert(Array.isArray(raw), `reference/${source}.json: expected an array`);
    for (const row of raw) {
      if (!isObject(row) || typeof row.name !== 'string' || !row.name) continue;
      const set = source === 'fauna' ? 'earth-fauna'
        : source === 'flora' ? 'earth-flora'
          : row.kingdom === 'fungi' ? 'earth-fungi'
            : row.kingdom === 'microbe' ? 'earth-microbe' : '';
      assert(set, `reference/${source}.json: ${row.name} has no valid set identity`);
      const key = rowKey(set, row.name);
      assert(!out.has(key), `reference/${source}.json: duplicate set/species identity ${JSON.stringify(key)}`);
      out.set(key, row);
    }
  }
  return out;
}

function manifestByIdentity(manifest) {
  assert(isObject(manifest) && Array.isArray(manifest.files), 'manifest: expected files[]');
  assert(manifest.portraits === EXPECTED_TOTAL, `manifest: expected ${EXPECTED_TOTAL} portraits`);
  const map = new Map();
  for (const [offset, raw] of manifest.files.entries()) {
    const where = `manifest file ${offset + 1}`;
    assert(isObject(raw), `${where}: must be an object`);
    const set = string(raw.set, `${where}.set`);
    const file = string(raw.file, `${where}.file`).replaceAll('\\', '/');
    const sha = string(raw.sha256, `${where}.sha256`).toLowerCase();
    assert(file.startsWith(`${set}/`), `${where}: file must remain inside its set`);
    assert(/^[0-9a-f]{64}$/.test(sha), `${where}: invalid SHA-256`);
    const key = rowKey(set, file.slice(set.length + 1).replace(/\.png$/i, ''));
    /* Keying by filename is unsafe for curly apostrophes, so the identity map
       is completed from identity-manifest.json below. */
    assert(!map.has(file), `manifest: duplicate file ${JSON.stringify(file)}`);
    map.set(file, { set, file, sha256: sha });
  }
  return map;
}

function buildPreparation({ date, layout, sourceRows, outputName, outputDir, stripRows, provenance, browser }) {
  const capture = validateCaptureProvenance(provenance, 'preparation capture provenance');
  const manifest = manifestFromSource(sourceRows, capture);
  const identityRows = sourceRows.map((row) => ({
    set: row.set,
    species: row.species,
    render_name: row.renderName,
    image_file: row.file,
    sha256: row.sha256,
  }));
  const identityByKey = new Map(identityRows.map((row) => [rowKey(row.set, row.species), row]));
  const index = layout.map((packet) => {
    const strip = stripRows.get(packet.id);
    assert(strip, `prepared strip is missing for packet ${packet.id}`);
    return {
      packet_id: packet.id,
      family: packet.family,
      strip: `packets/packet-${packet.id}/strip.png`,
      packet: `packets/packet-${packet.id}/packet.md`,
      packet_json: `packets/packet-${packet.id}/packet.json`,
      strip_sha256: strip.sha256,
      species: packet.species.map((row) => {
        const identity = identityByKey.get(rowKey(row.set, row.name));
        assert(identity, `packet ${packet.id}: identity disappeared before index build`);
        return { set: row.set, name: row.name, image_file: identity.image_file, sha256: identity.sha256 };
      }),
    };
  });
  setCounts(index.flatMap((packet) => packet.species.map((row) => ({ set: row.set, species: row.name }))),
    'prepared GP7.1 index');
  assert(index.length === EXPECTED_PACKETS, `prepared GP7.1 index: expected ${EXPECTED_PACKETS} packets`);
  return {
    preparation: {
      schema: PREPARATION_SCHEMA,
      review_date: date,
      source_ruler: FRESH_RULER,
      output: outputName,
      current_source_identity_sha256: sha256(JSON.stringify(identityRows)),
      frozen_partition_sha256: sha256(JSON.stringify(layout)),
      packets: index.length,
      portraits: identityRows.length,
      note: 'Prepared from one current audit render. No verdicts, results, or ledger are generated by --prepare.',
      browser,
      capture_provenance: capture,
    },
    manifest,
    identities: { schema: IDENTITY_SCHEMA, capture_provenance: capture, rows: identityRows },
    index,
  };
}

function requireOutputFile(outputDir, relative, label) {
  const file = path.resolve(outputDir, ...relative.split('/'));
  const boundary = outputDir.endsWith(path.sep) ? outputDir : outputDir + path.sep;
  assert(file === outputDir || file.startsWith(boundary), `${label}: output path escaped its root`);
  assert(fs.existsSync(file) && fs.statSync(file).isFile(), `${label}: missing ${relative}`);
  return file;
}

function loadPrepared(outputDir) {
  assert(fs.existsSync(outputDir) && fs.statSync(outputDir).isDirectory(),
    `GP7.1 output does not exist: ${outputDir} (run --prepare first)`);
  const preparation = readJson(requireOutputFile(outputDir, 'preparation.json', 'preparation'), 'preparation.json');
  assert(isObject(preparation) && preparation.schema === PREPARATION_SCHEMA,
    'preparation.json: wrong or missing GP7.1 preparation schema');
  const reviewDate = dateString(preparation.review_date, 'preparation.json.review_date');
  assert(preparation.source_ruler === FRESH_RULER, 'preparation.json.source_ruler: unexpected source ruler');
  const preparationBrowser = validateBrowserProvenance(preparation.browser, 'preparation.json.browser');
  const preparationCapture = validateCaptureProvenance(
    preparation.capture_provenance, 'preparation.json.capture_provenance',
  );
  const manifest = readJson(requireOutputFile(outputDir, 'review-info/manifest.json', 'manifest'), 'manifest');
  const identitiesRaw = readJson(requireOutputFile(outputDir, 'identity-manifest.json', 'identity manifest'), 'identity manifest');
  assert(isObject(manifest) && manifest.schema === PORTRAIT_SCHEMA,
    `manifest: expected provenance-bound schema ${PORTRAIT_SCHEMA}`);
  assert(isObject(identitiesRaw) && identitiesRaw.schema === IDENTITY_SCHEMA && Array.isArray(identitiesRaw.rows),
    `identity-manifest.json: expected provenance-bound schema ${IDENTITY_SCHEMA} with rows[]`);
  const manifestCapture = validateCaptureProvenance(
    manifest.capture_provenance, 'manifest.capture_provenance', preparationCapture.source_commit,
  );
  const identityCapture = validateCaptureProvenance(
    identitiesRaw.capture_provenance, 'identity-manifest.json.capture_provenance', preparationCapture.source_commit,
  );
  assert(canonicalJson(manifestCapture) === canonicalJson(preparationCapture)
      && canonicalJson(identityCapture) === canonicalJson(preparationCapture),
  'prepared evidence: preparation, identity, and portrait manifests do not bind the same capture provenance');
  const identities = identitiesRaw.rows.map((raw, offset) => {
    const where = `identity row ${offset + 1}`;
    assert(isObject(raw), `${where}: must be an object`);
    const set = string(raw.set, `${where}.set`);
    const species = string(raw.species, `${where}.species`);
    const renderName = string(raw.render_name, `${where}.render_name`);
    const imageFile = string(raw.image_file, `${where}.image_file`).replaceAll('\\', '/');
    const sha = string(raw.sha256, `${where}.sha256`).toLowerCase();
    assert(imageFile.startsWith(`${set}/`), `${where}: image file leaves its set`);
    assert(/^[0-9a-f]{64}$/.test(sha), `${where}: invalid SHA-256`);
    return { set, species, renderName, imageFile, sha256: sha };
  });
  setCounts(identities, 'identity manifest');
  const identityMap = new Map();
  for (const row of identities) {
    const key = rowKey(row.set, row.species);
    assert(!identityMap.has(key), `identity manifest: duplicate ${JSON.stringify(key)}`);
    identityMap.set(key, row);
  }
  const index = readJson(requireOutputFile(outputDir, 'index.json', 'index'), 'index.json');
  assert(Array.isArray(index) && index.length === EXPECTED_PACKETS,
    `index.json: expected ${EXPECTED_PACKETS} packets`);
  const indexRows = [];
  const packets = index.map((raw, offset) => {
    const where = `index packet ${offset + 1}`;
    assert(isObject(raw), `${where}: must be an object`);
    const packetId = string(raw.packet_id, `${where}.packet_id`);
    assert(packetId === String(offset + 1).padStart(3, '0'), `${where}: unexpected packet_id ${packetId}`);
    const family = string(raw.family, `${where}.family`);
    const strip = string(raw.strip, `${where}.strip`).replaceAll('\\', '/');
    const stripSha = string(raw.strip_sha256, `${where}.strip_sha256`).toLowerCase();
    assert(/^[0-9a-f]{64}$/.test(stripSha), `${where}: invalid strip SHA-256`);
    assert(Array.isArray(raw.species) && raw.species.length > 0 && raw.species.length <= 14,
      `${where}.species: expected one to fourteen rows`);
    const species = raw.species.map((item, itemOffset) => {
      const itemWhere = `${where} row ${itemOffset + 1}`;
      assert(isObject(item), `${itemWhere}: must be an object`);
      const set = string(item.set, `${itemWhere}.set`);
      const name = string(item.name, `${itemWhere}.name`);
      const identity = identityMap.get(rowKey(set, name));
      assert(identity, `${itemWhere}: absent from identity manifest`);
      indexRows.push({ set, species: name });
      return { set, name, identity };
    });
    return { packetId, family, strip, stripSha, species };
  });
  setCounts(indexRows, 'prepared GP7.1 index');
  const manifestRows = manifestByIdentity(manifest);
  assert(manifestRows.size === EXPECTED_TOTAL, `manifest: expected ${EXPECTED_TOTAL} unique files`);
  for (const row of identities) {
    const manifestRow = manifestRows.get(row.imageFile);
    assert(manifestRow, `identity manifest ${row.set}/${row.species}: absent from portrait manifest`);
    assert(manifestRow.sha256 === row.sha256,
      `identity manifest ${row.set}/${row.species}: SHA differs from portrait manifest`);
  }
  return {
    preparation, reviewDate, manifest, identities, identityMap, packets,
    captureProvenance: preparationCapture, browser: preparationBrowser,
  };
}

function validateEvidenceFiles(outputDir, prepared) {
  for (const identity of prepared.identities) {
    const file = requireOutputFile(outputDir, `portraits/${identity.imageFile}`, `portrait ${identity.set}/${identity.species}`);
    const buffer = fs.readFileSync(file);
    const dimensions = pngDimensions(buffer, `portrait ${identity.set}/${identity.species}`);
    assert(dimensions.width === 440 && dimensions.height === 440,
      `portrait ${identity.set}/${identity.species}: expected native 440x440`);
    assert(sha256(buffer) === identity.sha256,
      `portrait ${identity.set}/${identity.species}: bytes changed since preparation`);
  }
  for (const packet of prepared.packets) {
    const strip = requireOutputFile(outputDir, packet.strip, `packet ${packet.packetId} strip`);
    const buffer = fs.readFileSync(strip);
    pngDimensions(buffer, `packet ${packet.packetId} strip`);
    assert(sha256(buffer) === packet.stripSha,
      `packet ${packet.packetId}: strip bytes changed since preparation`);
  }
}

function validatePacketVerdict(raw, packet, reviewDate, file) {
  const where = portable(file);
  assert(isObject(raw), `${where}: verdict must be an object`);
  assert(raw.schema === SCHEMA, `${where}: wrong schema`);
  assert(string(raw.packet_id, `${where}.packet_id`) === packet.packetId,
    `${where}: packet_id mismatch`);
  assert(string(raw.family, `${where}.family`) === packet.family, `${where}: family mismatch`);
  assert(string(raw.strip_sha256, `${where}.strip_sha256`).toLowerCase() === packet.stripSha,
    `${where}: strip SHA-256 mismatch`);
  const reviewer = string(raw.reviewer, `${where}.reviewer`);
  assert(Array.isArray(raw.rows) && raw.rows.length === packet.species.length,
    `${where}: expected ${packet.species.length} rows, got ${Array.isArray(raw.rows) ? raw.rows.length : 'non-array'}`);
  const rows = raw.rows.map((item, offset) => {
    const expected = packet.species[offset];
    const itemWhere = `${where} row ${offset + 1}`;
    assert(isObject(item), `${itemWhere}: must be an object`);
    assert(string(item.set, `${itemWhere}.set`) === expected.set, `${itemWhere}: set mismatch`);
    assert(string(item.species, `${itemWhere}.species`) === expected.name, `${itemWhere}: species order/name mismatch`);
    const band = string(item.band, `${itemWhere}.band`);
    assert(LEGAL_BANDS.has(band), `${itemWhere}: invalid band ${JSON.stringify(band)}`);
    const why = string(item.why, `${itemWhere}.why`);
    assert(why.length >= 8, `${itemWhere}: why must be at least 8 characters`);
    assert(dateString(item.judged_at, `${itemWhere}.judged_at`) === reviewDate,
      `${itemWhere}: judged_at must match preparation review_date ${reviewDate}`);
    assert(string(item.ruler, `${itemWhere}.ruler`) === FRESH_RULER,
      `${itemWhere}: must name the fresh strict ruler`);
    assert(bool(item.freshly_rejudged, `${itemWhere}.freshly_rejudged`) === true,
      `${itemWhere}: freshly_rejudged must be true`);
    assert(bool(item.strict, `${itemWhere}.strict`) === true, `${itemWhere}: strict must be true`);
    return { set: expected.set, species: expected.name, band, why, reviewer, judged_at: reviewDate };
  });
  return rows;
}

function collectVerdicts(outputDir) {
  const prepared = loadPrepared(outputDir);
  validateEvidenceFiles(outputDir, prepared);
  const rows = [];
  const seen = new Set();
  for (const packet of prepared.packets) {
    const relative = `verdicts/packet-${packet.packetId}.json`;
    const file = requireOutputFile(outputDir, relative, `packet ${packet.packetId} verdict`);
    const verdict = readJson(file, relative);
    for (const row of validatePacketVerdict(verdict, packet, prepared.reviewDate, file)) {
      const key = rowKey(row.set, row.species);
      assert(!seen.has(key), `verdict collection: duplicate identity ${JSON.stringify(key)}`);
      seen.add(key);
      rows.push(row);
    }
  }
  setCounts(rows, 'collected fresh strict verdicts');
  const results = {
    schema: 'cf.gp71.strict-results.v1',
    review_date: prepared.reviewDate,
    source_ruler: FRESH_RULER,
    rows: rows.map((row) => ({ set: row.set, species: row.species, band: row.band, rejudged: true })),
  };
  const ledger = {
    schema: 'cf.gp71.strict-ledger.v1',
    review_date: prepared.reviewDate,
    source_ruler: FRESH_RULER,
    rows: rows.map((row) => {
      const identity = prepared.identityMap.get(rowKey(row.set, row.species));
      assert(identity, `ledger: missing prepared identity ${row.set}/${row.species}`);
      return {
        set: row.set,
        species: row.species,
        image_file: identity.imageFile,
        sha256: identity.sha256,
        current_recorded_band: row.band,
        freshly_rejudged: true,
        source_ruler: FRESH_RULER,
        action_to_100_percent: ACTION_BY_BAND[row.band],
        judged_at: row.judged_at,
        reviewer: row.reviewer,
        why: row.why,
      };
    }),
  };
  return { prepared, rows, results, ledger };
}

function nearestExisting(dir) {
  return fs.existsSync(dir) ? 'already exists' : 'does not exist';
}

function makeServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };
  return http.createServer((request, response) => {
    const relative = request.url === '/' ? 'index.html' : request.url.split('?')[0];
    const file = path.join(distDir, relative);
    try {
      const buffer = fs.readFileSync(file);
      response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
      response.end(buffer);
    } catch {
      response.writeHead(404); response.end();
    }
  });
}

async function closeServer(server) {
  if (!server?.listening) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function commitPreparedEvidence({ stage, target, browser, server, beforeRename }) {
  const browserRecord = browser.browser;
  await browser.close();
  await closeServer(server);
  if (beforeRename) await beforeRename();
  assert(!fs.existsSync(target), `GP7.1 output appeared while preparing: ${target}`);
  fs.renameSync(stage, target);
  return browserRecord;
}

async function openCdp(serverUrl) {
  const connection = await openChromiumCdp({ label: 'GP7.1 rejudge', userDataPrefix: 'cf-gp71' });
  try {
    const target = await connection.send('Target.createTarget', { url: 'about:blank' });
    const attached = await connection.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sessionId = attached.sessionId;
    await connection.send('Runtime.enable', {}, sessionId);
    const evaluate = async (expression) => {
      const response = await connection.send('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise: true,
      }, sessionId);
      if (response.exceptionDetails) fail(`GP7.1 browser evaluation failed: ${String(response.exceptionDetails.exception?.description || response.exceptionDetails.text).slice(0, 320)}`);
      return response.result.value;
    };
    const navigate = async (url) => {
      const result = await connection.send('Page.navigate', { url }, sessionId);
      assert(!result.errorText, `GP7.1 browser navigation failed: ${result.errorText || url}`);
    };
    return { url: serverUrl, browser: connection.browser, navigate, evaluate, close: connection.close };
  } catch (error) {
    await connection.close();
    throw error;
  }
}

function buildCurrentAudit() {
  /* Rebuild unconditionally: a preparation tool that reads yesterday's bundle
     would produce a beautifully complete packet set for code no longer in the
     repository. */
  execSync('npx vite build', { cwd: appDir, stdio: 'inherit' });
  assert(fs.existsSync(path.join(distDir, 'audit.html')), 'GP7.1 rejudge: Vite build did not create audit.html');
}

async function drainCurrentAudit(browser, stage) {
  await browser.navigate(`${browser.url}/audit.html?full=1`);
  const byIdentity = new Map();
  const byFile = new Set();
  let complete = false;
  const deadline = Date.now() + 30 * 60 * 1000;
  let lastProgress = Date.now();
  for (let spins = 0; spins < 36000; spins++) {
    assert(Date.now() < deadline, 'current audit: exceeded the 30-minute capture deadline');
    const item = await browser.evaluate(`(()=>{ const full=window.__CF_FULL__; if(!full) return null; if(full.q.length) return full.q.shift(); return full.done ? 'DONE' : 'WAIT'; })()`);
    if (item === 'DONE') { complete = true; break; }
    if (item === 'WAIT' || item === null) {
      assert(Date.now() - lastProgress < 2 * 60 * 1000,
        'current audit: browser queue made no progress for two minutes');
      await sleep(100); continue;
    }
    assert(isObject(item), 'current audit queue: item must be an object');
    const set = string(item.k, 'current audit queue set');
    const species = string(item.name, 'current audit queue name');
    assert(set in EXPECTED_SETS, `current audit queue: unknown set ${JSON.stringify(set)}`);
    const identity = rowKey(set, species);
    assert(!byIdentity.has(identity), `current audit queue: duplicate identity ${JSON.stringify(identity)}`);
    const renderName = set === 'procedural'
      ? loadProceduralNameBridge(root).renderName(set, species)
      : species;
    assert(typeof item.url === 'string' && item.url.startsWith('data:image/png;base64,'),
      `current audit ${set}/${species}: missing native PNG data URL`);
    const buffer = Buffer.from(item.url.slice('data:image/png;base64,'.length), 'base64');
    const dimensions = pngDimensions(buffer, `current audit ${set}/${species}`);
    assert(dimensions.width === 440 && dimensions.height === 440,
      `current audit ${set}/${species}: expected 440x440 native PNG`);
    const file = `${set}/${safePortraitName(species)}`;
    assert(!byFile.has(file), `current audit: portrait filename collision ${JSON.stringify(file)}`);
    byFile.add(file);
    const disk = path.join(stage, 'portraits', ...file.split('/'));
    fs.mkdirSync(path.dirname(disk), { recursive: true });
    fs.writeFileSync(disk, buffer);
    byIdentity.set(identity, {
      set, species, renderName, file, sha256: sha256(buffer), bytes: buffer.length,
      width: dimensions.width, height: dimensions.height,
    });
    lastProgress = Date.now();
    if (byIdentity.size % 100 === 0) console.log(`  … ${byIdentity.size} current portraits captured`);
  }
  assert(complete, 'current audit: timed out before reporting DONE');
  const rows = [...byIdentity.values()];
  setCounts(rows, 'fresh current audit identity');
  return rows;
}

async function composeContact(browser, packet, packetRows) {
  const images = packetRows.map((row) => ({
    label: row.set === 'procedural' ? row.renderName.replace(/^proc:/, '').replace(/:h/, '·h').replace(/:s/, '·s') : row.name,
    url: 'data:image/png;base64,' + fs.readFileSync(row.disk).toString('base64'),
  }));
  const expression = `(()=>new Promise(async(resolve)=>{const cells=${JSON.stringify(images)};const C=300,LAB=30,cols=Math.min(cells.length,5),rows=Math.ceil(cells.length/cols);const cv=document.createElement('canvas');cv.width=cols*C;cv.height=rows*(C+LAB);const c=cv.getContext('2d');c.fillStyle='#07090d';c.fillRect(0,0,cv.width,cv.height);const failed=[];await Promise.all(cells.map((cell,i)=>new Promise(done=>{const x=(i%cols)*C,y=Math.floor(i/cols)*(C+LAB);c.fillStyle='#8ea6c8';c.font='15px system-ui,sans-serif';c.textAlign='center';c.fillText(cell.label,x+C/2,y+C+20);const im=new Image();im.onload=()=>{c.drawImage(im,x+6,y+6,C-12,C-12);done()};im.onerror=()=>{failed.push(cell.label);done()};im.src=cell.url;})));resolve({url:cv.toDataURL('image/png'),failed});}))()`;
  const result = await browser.evaluate(expression);
  assert(isObject(result) && typeof result.url === 'string' && result.url.startsWith('data:image/png;base64,'),
    `packet ${packet.id}: canvas contact sheet did not render`);
  assert(Array.isArray(result.failed) && result.failed.length === 0,
    `packet ${packet.id}: failed contact cells ${JSON.stringify(result.failed)}`);
  return Buffer.from(result.url.slice('data:image/png;base64,'.length), 'base64');
}

async function prepare({ out, date, layoutFile }) {
  /* A current portrait root is certifiable only when every tracked and
     untracked repository path is clean before capture. Ignored build/evidence
     outputs remain outside Git's porcelain contract. */
  const sourceBefore = inspectCleanRepository();
  const target = outputDirectory(out);
  assert(!fs.existsSync(target.dir),
    `GP7.1 output ${target.dir} ${nearestExisting(target.dir)}; choose a new --out rather than overwriting evidence`);
  assert(fs.existsSync(layoutFile), `frozen 196-packet layout is missing: ${layoutFile}`);
  const layout = loadFrozenLayout(layoutFile);
  const stage = fs.mkdtempSync(path.join(smokeDir, `.gp71-stage-${target.name}-`));
  let server = null;
  let browser = null;
  try {
    buildCurrentAudit();
    server = makeServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    browser = await openCdp(`http://127.0.0.1:${server.address().port}`);
    const sourceRows = await drainCurrentAudit(browser, stage);
    verifyPartition(layout, sourceRows);
    const identityByKey = new Map(sourceRows.map((row) => [rowKey(row.set, row.species), row]));
    const referenceByIdentity = references();
    const stripRows = new Map();
    console.log(`  composing ${layout.length} labelled GP7.1 contact sheets from current captured pixels…`);
    for (const [offset, packet] of layout.entries()) {
      const packetRows = packet.species.map((item) => {
        const source = identityByKey.get(rowKey(item.set, item.name));
        assert(source, `packet ${packet.id}: source identity missing after partition join`);
        return {
          ...source,
          name: item.name,
          disk: path.join(stage, 'portraits', ...source.file.split('/')),
          reference: referenceByIdentity.get(rowKey(item.set, item.name)) || null,
        };
      });
      const strip = await composeContact(browser, packet, packetRows);
      const dimensions = pngDimensions(strip, `packet ${packet.id} strip`);
      assert(dimensions.width > 0 && dimensions.height > 0, `packet ${packet.id}: zero-sized contact sheet`);
      const packetDir = path.join(stage, 'packets', `packet-${packet.id}`);
      fs.mkdirSync(packetDir, { recursive: true });
      const stripFile = path.join(packetDir, 'strip.png');
      fs.writeFileSync(stripFile, strip);
      const stripHash = sha256(strip);
      const relativeStrip = `packets/packet-${packet.id}/strip.png`;
      const packetJson = {
        schema: 'cf.gp71.packet.v1',
        packet_id: packet.id,
        family: packet.family,
        review_date: date,
        source_ruler: FRESH_RULER,
        strip: relativeStrip,
        strip_sha256: stripHash,
        species: packetRows.map((row) => ({
          set: row.set, name: row.name, render_name: row.renderName,
          image_file: row.file, sha256: row.sha256,
        })),
      };
      writeJson(path.join(packetDir, 'packet.json'), packetJson);
      fs.writeFileSync(path.join(packetDir, 'packet.md'), packetMarkdown(packet, packetRows, relativeStrip, stripHash, date));
      stripRows.set(packet.id, { sha256: stripHash });
      if ((offset + 1) % 20 === 0 || offset + 1 === layout.length) {
        console.log(`  … ${offset + 1}/${layout.length} contact sheets prepared`);
      }
    }
    const sourceAfterCapture = inspectCleanRepository();
    const provenance = captureProvenance(sourceBefore, sourceAfterCapture);
    const prepared = buildPreparation({
      date, layout, sourceRows, outputName: target.name, outputDir: target.dir, stripRows, provenance,
      browser: browser.browser,
    });
    writeJson(path.join(stage, 'preparation.json'), prepared.preparation);
    writeJson(path.join(stage, 'review-info', 'manifest.json'), prepared.manifest);
    writeJson(path.join(stage, 'identity-manifest.json'), prepared.identities);
    writeJson(path.join(stage, 'index.json'), prepared.index);
    writeJson(path.join(stage, 'strict-verdict-schema.json'), verdictSchema());
    fs.writeFileSync(path.join(stage, 'README.md'), [
      '# GP7.1 fresh strict rejudge evidence',
      '',
      `- Current portraits: ${EXPECTED_TOTAL} native 440x440 PNGs under portraits/.`,
      `- Fresh review packets: ${EXPECTED_PACKETS} labelled sheets under packets/.`,
      `- Required ruler: ${FRESH_RULER}.`,
      `- Required per-row review date: ${date}.`,
      `- Exact clean source commit: ${provenance.source_commit}.`,
      `- Browser: ${browser.browser.product} (${browser.browser.executable}; revision ${browser.browser.revision}).`,
      '- Capture scope: the entire Git repository, including untracked files.',
      '- `--prepare` generated no verdicts, results, bands, or ledger.',
      '- Judges must add one `verdicts/packet-XXX.json` file per packet following strict-verdict-schema.json.',
      '- Run `node tools/gp71rejudge.mjs --collect --out=' + target.name + '` only after all 196 complete verdicts exist.',
      '- The collector verifies image/strip hashes before writing a results file or ledger for gp7conformity.',
      '',
    ].join('\n'));
    const browserRecord = await commitPreparedEvidence({
      stage, target: target.dir, browser, server,
      beforeRename() {
        const sourceBeforeCommit = inspectCleanRepository();
        assert(canonicalJson(captureProvenance(sourceBefore, sourceBeforeCommit)) === canonicalJson(provenance),
          'capture source provenance changed while evidence manifests were being prepared');
      },
    });
    browser = null;
    server = null;
    console.log('GP7.1 REJUDGE PREPARATION PASS');
    console.log(`  current portraits: ${EXPECTED_TOTAL} native 440x440 PNGs`);
    console.log(`  contact packets:   ${EXPECTED_PACKETS} labelled sheets`);
    console.log(`  output: ${target.dir}`);
    console.log(`  source commit: ${provenance.source_commit} (entire repository clean before/after)`);
    console.log(`  browser: ${browserRecord.product} (${browserRecord.executable})`);
    console.log('  verdicts/results/ledger: intentionally not written');
  } finally {
    let cleanupError = null;
    if (browser) {
      try { await browser.close(); } catch (error) { cleanupError = error; }
    }
    if (server) {
      try { await closeServer(server); } catch (error) { cleanupError ||= error; }
    }
    if (fs.existsSync(stage)) {
      try { fs.rmSync(stage, { recursive: true, force: true }); }
      catch (error) { cleanupError ||= error; }
    }
    if (cleanupError) throw cleanupError;
  }
}

function collect({ out }) {
  const target = outputDirectory(out);
  const collected = collectVerdicts(target.dir);
  writeJson(path.join(target.dir, 'review-info', 'gp71-strict-results.json'), collected.results);
  writeJson(path.join(target.dir, 'review-info', 'gp71-strict-ledger.json'), collected.ledger);
  const bands = Object.fromEntries([...LEGAL_BANDS].map((band) => [band, collected.rows.filter((row) => row.band === band).length]));
  console.log('GP7.1 STRICT VERDICT COLLECTION PASS');
  console.log(`  exact fresh strict rows: ${collected.rows.length}/${EXPECTED_TOTAL}`);
  console.log(`  bands: FAIL ${bands.FAIL} · POLISH ${bands.POLISH} · PASS ${bands.PASS}`);
  console.log('  results: review-info/gp71-strict-results.json');
  console.log('  ledger:  review-info/gp71-strict-ledger.json');
  console.log('  next: run gp7conformity with manifest + results + ledger; --certify is expected to reject until all 1,250 bands are PASS.');
}

function describeLayout(layoutFile) {
  const layout = loadFrozenLayout(layoutFile);
  const rows = layout.flatMap((packet) => packet.species.map((row) => ({ set: row.set, species: row.name })));
  const summary = setCounts(rows, 'frozen 196-packet layout');
  console.log('GP7.1 FROZEN PARTITION PASS');
  console.log(`  packets: ${layout.length}/${EXPECTED_PACKETS}`);
  console.log(`  identities: ${rows.length}/${EXPECTED_TOTAL}`);
  console.log(`  sets: ${Object.entries(summary.counts).map(([set, count]) => `${set} ${count}`).join(' · ')}`);
  console.log(`  layout: ${layoutFile}`);
}

function fixtureRows() {
  return [
    { set: 'fixture-a', species: 'Alpha', renderName: 'Alpha', file: 'fixture-a/Alpha.png', sha256: sha256('alpha'), bytes: 24, width: 440, height: 440 },
    { set: 'fixture-b', species: 'Beta', renderName: 'Beta', file: 'fixture-b/Beta.png', sha256: sha256('beta'), bytes: 24, width: 440, height: 440 },
  ];
}
function expectRejected(label, work, pattern) {
  let caught = null;
  try { work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected failure was accepted`);
  assert(pattern.test(caught.message), `SELFTEST ${label}: wrong rejection ${caught.message}`);
}
async function expectRejectedAsync(label, work, pattern) {
  let caught = null;
  try { await work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected failure was accepted`);
  assert(pattern.test(caught.message), `SELFTEST ${label}: wrong rejection ${caught.message}`);
}
function validateFixtureVerdict(raw, packet) {
  return validatePacketVerdict(raw, packet, '2026-08-09', 'memory/packet-001.json');
}
async function runSelftest() {
  const fixtureCommit = 'a'.repeat(40);
  const cleanSnapshot = { repository_root: repositoryRoot, commit: fixtureCommit, status: '' };
  const provenance = captureProvenance(cleanSnapshot, structuredClone(cleanSnapshot));
  assert(validateCaptureProvenance(provenance, 'SELFTEST provenance', fixtureCommit).source_commit === fixtureCommit,
    'SELFTEST clean exact-commit provenance did not validate');
  expectRejected('dirty capture source', () => captureProvenance(
    { ...cleanSnapshot, status: ' M port/v2/packages/art/src/speciesart.ts' }, cleanSnapshot,
  ), /entire repository must be clean/i);
  expectRejected('source commit changed during capture', () => captureProvenance(
    cleanSnapshot, { ...cleanSnapshot, commit: 'b'.repeat(40) },
  ), /changed commits/i);
  expectRejected('wrong requested capture commit', () => validateCaptureProvenance(
    provenance, 'SELFTEST wrong commit', 'b'.repeat(40),
  ), /commit mismatch/i);
  expectRejected('partial capture scope', () => validateCaptureProvenance(
    { ...provenance, capture_scope: 'port/v2/packages/art' }, 'SELFTEST partial scope', fixtureCommit,
  ), /entire repository/i);
  const packet = {
    packetId: '001', family: 'Fixture family', stripSha: sha256('fixture-strip'),
    species: [
      { set: 'fixture-a', name: 'Alpha' },
      { set: 'fixture-b', name: 'Beta' },
    ],
  };
  const good = {
    schema: SCHEMA, packet_id: '001', family: 'Fixture family', strip_sha256: sha256('fixture-strip'), reviewer: 'fixture judge',
    rows: [
      { set: 'fixture-a', species: 'Alpha', band: 'PASS', why: 'Readable Alpha.', judged_at: '2026-08-09', ruler: FRESH_RULER, freshly_rejudged: true, strict: true },
      { set: 'fixture-b', species: 'Beta', band: 'FAIL', why: 'Missing Beta form.', judged_at: '2026-08-09', ruler: FRESH_RULER, freshly_rejudged: true, strict: true },
    ],
  };
  const collected = validateFixtureVerdict(good, packet);
  assert(collected.length === 2 && collected[1].band === 'FAIL', 'SELFTEST positive verdict did not collect');
  expectRejected('swapped identity', () => {
    const bad = structuredClone(good); bad.rows.reverse(); validateFixtureVerdict(bad, packet);
  }, /set mismatch|species order\/name mismatch/);
  expectRejected('stale strip hash', () => {
    const bad = structuredClone(good); bad.strip_sha256 = sha256('stale'); validateFixtureVerdict(bad, packet);
  }, /strip SHA-256 mismatch/);
  expectRejected('carried freshness', () => {
    const bad = structuredClone(good); bad.rows[0].freshly_rejudged = false; validateFixtureVerdict(bad, packet);
  }, /freshly_rejudged must be true/);
  expectRejected('wrong review date', () => {
    const bad = structuredClone(good); bad.rows[0].judged_at = '2026-08-08'; validateFixtureVerdict(bad, packet);
  }, /judged_at must match/);
  expectRejected('too-short reason', () => {
    const bad = structuredClone(good); bad.rows[0].why = 'yes'; validateFixtureVerdict(bad, packet);
  }, /at least 8 characters/);
  expectRejected('unsafe output name', () => outputDirectory('../gp71-nope'), /safe gp71/);
  const atomicTemp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'cf-gp71-close-control-'));
  try {
    const atomicStage = path.join(atomicTemp, 'stage');
    const atomicTarget = path.join(atomicTemp, 'target');
    fs.mkdirSync(atomicStage);
    fs.writeFileSync(path.join(atomicStage, 'sentinel'), 'staged');
    await expectRejectedAsync('browser close before evidence commit', () => commitPreparedEvidence({
      stage: atomicStage,
      target: atomicTarget,
      browser: {
        browser: { product: 'fixture' },
        async close() { throw new Error('injected browser close failure'); },
      },
      server: null,
    }), /injected browser close failure/);
    assert(!fs.existsSync(atomicTarget),
      'SELFTEST browser close failure left a success-shaped GP7.1 evidence directory');
  } finally {
    fs.rmSync(atomicTemp, { recursive: true, force: true });
  }
  const schema = verdictSchema();
  assert(schema.required_row_fields.ruler === FRESH_RULER && schema.no_verdicts_are_generated_by_prepare,
    'SELFTEST schema contract was not fresh-only');
  const referenceByIdentity = references();
  assert(referenceByIdentity.size === 1014,
    `SELFTEST expected 1014 set-specific Earth references, got ${referenceByIdentity.size}`);
  const collisions = [
    ['Green Algae', 'earth-flora', 'earth-microbe'],
    ['Reindeer Lichen', 'earth-flora', 'earth-fungi'],
    ['Snow Algae', 'earth-flora', 'earth-microbe'],
    ['Tardigrade', 'earth-fauna', 'earth-microbe'],
  ];
  for (const [species, firstSet, secondSet] of collisions) {
    const first = referenceByIdentity.get(rowKey(firstSet, species));
    const second = referenceByIdentity.get(rowKey(secondSet, species));
    assert(first && second && first !== second,
      `SELFTEST duplicate-name references collapsed ${firstSet}/${secondSet} ${species}`);
  }
  const bareNameControl = new Map();
  for (const row of referenceByIdentity.values()) bareNameControl.set(row.name, row);
  assert(bareNameControl.size === 1010,
    'SELFTEST negative control no longer reproduces four bare-name collisions');
  assert(bareNameControl.get('Snow Algae')
      !== referenceByIdentity.get(rowKey('earth-flora', 'Snow Algae')),
    'SELFTEST negative control no longer overwrites Earth-flora Snow Algae');
  const browser = await openCdp('about:blank');
  try {
    assert(await browser.evaluate('6 * 7') === 42, 'SELFTEST raw-CDP browser evaluation failed');
    validateBrowserProvenance(browser.browser, 'SELFTEST browser provenance');
  } finally { await browser.close(); }
  console.log('GP7.1 REJUDGE SELFTEST PASS');
  console.log('  fresh strict dated packet verdict: PASS');
  console.log('  swapped identity: rejected');
  console.log('  stale strip hash: rejected');
  console.log('  carried freshness: rejected');
  console.log('  wrong review date: rejected');
  console.log('  short reason: rejected');
  console.log('  unsafe output directory: rejected');
  console.log('  browser close failure before atomic commit: rejected; no output left');
  console.log('  four duplicate names remain set-specific: PASS');
  console.log('  intentional bare-name join collapses four identities: rejected');
  console.log('  dirty/changed/wrong-commit/partial-scope capture provenance: rejected');
  console.log('  portable browser resolver + owned CDP + version provenance: PASS');
}

function parseArgs(args) {
  const options = {
    prepare: false,
    collect: false,
    plan: false,
    selftest: false,
    out: 'gp71-rejudge',
    date: '2026-08-09',
    layout: DEFAULT_LAYOUT,
    help: false,
  };
  for (const argument of args) {
    if (argument === '--prepare') options.prepare = true;
    else if (argument === '--collect') options.collect = true;
    else if (argument === '--plan') options.plan = true;
    else if (argument === '--selftest') options.selftest = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument.startsWith('--out=')) options.out = argument.slice('--out='.length);
    else if (argument.startsWith('--date=')) options.date = argument.slice('--date='.length);
    else if (argument.startsWith('--layout=')) options.layout = path.resolve(process.cwd(), argument.slice('--layout='.length));
    else fail(`unknown argument: ${argument}`);
  }
  if (!options.help) {
    const modes = [options.prepare, options.collect, options.plan, options.selftest].filter(Boolean).length;
    assert(modes === 1, 'choose exactly one of --prepare, --collect, --plan, or --selftest');
    dateString(options.date, '--date');
  }
  return options;
}
function usage() {
  console.log('Usage:');
  console.log('  node tools/gp71rejudge.mjs --prepare [--out=gp71-rejudge] [--date=2026-08-09]');
  console.log('  node tools/gp71rejudge.mjs --collect [--out=gp71-rejudge]');
  console.log('  node tools/gp71rejudge.mjs --plan [--layout=reference/goldpass7-results.json]');
  console.log('  node tools/gp71rejudge.mjs --selftest');
  console.log('');
  console.log('Prepare writes only a new gp71-* output folder. It renders 1,250 current native portraits and 196 contact sheets, but no verdicts/results/ledger.');
  console.log('Collect refuses partial/misaligned/undated/stale evidence and writes conformity-ready results + ledger only after 196 strict packet verdicts exist.');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { usage(); return; }
  if (options.selftest) { await runSelftest(); return; }
  if (options.prepare) await prepare({ out: options.out, date: options.date, layoutFile: options.layout });
  else if (options.collect) collect({ out: options.out });
  else describeLayout(options.layout);
}

try {
  await run();
} catch (error) {
  console.error('GP7.1 REJUDGE FAILED');
  console.error(`  ${error.message}`);
  process.exitCode = 1;
}
