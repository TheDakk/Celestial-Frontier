/* gp71package-2026-08-09.mjs — build a dated, image-inclusive GP7.1 package.

   This is deliberately separate from gp7package.mjs.  It never changes the
   legacy GP7 archive, it requires brand-new evidence/output targets, and it
   will only package a complete catalogue after gp7conformity --certify has
   established a literal 1,250/1,250 fresh-strict PASS ledger.

   Usage:
     node tools/gp71package-2026-08-09.mjs \
       --portraits apps/game/smoke/gp71-rejudge/portraits \
       --contacts apps/game/smoke/gp71-rejudge \
       --ledger apps/game/smoke/gp71-rejudge/review-info/gp71-strict-ledger.json \
       --manifest apps/game/smoke/gp71-rejudge/review-info/manifest.json \
       --results apps/game/smoke/gp71-rejudge/review-info/gp71-strict-results.json \
       --evidence apps/game/smoke/GP7_1_Strict_Evidence_2026-08-09 \
       --output apps/game/smoke/Celestial_Frontier_GP7_1_Strict_Evidence_2026-08-09.zip

   The evidence and output targets MUST be new.  This is intentional: a
   rejected rerun cannot overwrite a previous package, and the tool cannot
   silently replace the historical GP7 archive.
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const conformityTool = path.join(here, 'gp7conformity.mjs');
const PACKAGE_DATE = '2026-08-09';
const PACKAGE_SCHEMA = 'celestial-frontier.gp7.1.strict-evidence.v1';
const EXPECTED_SETS = Object.freeze({
  'earth-fauna': 631,
  'earth-flora': 332,
  'earth-fungi': 27,
  'earth-microbe': 20,
  procedural: 240,
});
const EXPECTED_TOTAL = Object.values(EXPECTED_SETS).reduce((sum, count) => sum + count, 0);

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function portable(file) {
  return file.split(path.sep).join('/');
}

function displayPath(file) {
  const relative = path.relative(root, file);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    ? portable(relative)
    : file;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sha256File(file) {
  return sha256(fs.readFileSync(file));
}

function readJson(file, label) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    fail(`${label}: cannot read ${displayPath(file)} (${error.message})`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${label}: invalid JSON in ${displayPath(file)} (${error.message})`);
  }
}

function requireDirectory(file, label) {
  assert(fs.existsSync(file), `${label}: does not exist: ${file}`);
  const stat = fs.lstatSync(file);
  assert(!stat.isSymbolicLink() && stat.isDirectory(), `${label}: expected a real directory: ${file}`);
  return file;
}

function requireFile(file, label) {
  assert(fs.existsSync(file), `${label}: does not exist: ${file}`);
  const stat = fs.lstatSync(file);
  assert(!stat.isSymbolicLink() && stat.isFile(), `${label}: expected a real file: ${file}`);
  return file;
}

function pathInside(base, candidate, label) {
  const basePath = path.resolve(base);
  const target = path.resolve(candidate);
  const relative = path.relative(basePath, target);
  assert(relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `${label}: expected a path inside ${basePath}, got ${target}`);
  return { absolute: target, relative };
}

function resolveContactFile(contacts, raw, label) {
  assert(typeof raw === 'string' && raw.trim(), `${label}: expected a nonempty path string`);
  const target = path.isAbsolute(raw) ? raw : path.join(contacts, raw);
  return pathInside(contacts, target, label).absolute;
}

function pngDimensions(buffer, label) {
  assert(buffer.length >= 24 && buffer.toString('hex', 0, 8) === '89504e470d0a1a0a',
    `${label}: not a PNG`);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  assert(width > 0 && height > 0, `${label}: invalid PNG dimensions ${width}x${height}`);
  return { width, height };
}

function normaliseRelativeFile(value, label) {
  assert(typeof value === 'string' && value.trim(), `${label}: expected a nonempty relative path`);
  const normalised = value.trim().replaceAll('\\', '/');
  assert(!normalised.startsWith('/') && !/^[A-Za-z]:\//.test(normalised),
    `${label}: must be relative, not absolute`);
  const parts = normalised.split('/');
  assert(parts.every((part) => part && part !== '.' && part !== '..'),
    `${label}: may not contain empty, . or .. segments`);
  return normalised;
}

function normaliseManifest(manifest, expectedSets = EXPECTED_SETS) {
  const expected = Object.values(expectedSets).reduce((sum, count) => sum + count, 0);
  assert(isPlainObject(manifest), 'manifest: expected an object');
  assert(manifest.portraits === expected,
    `manifest.portraits: expected ${expected}, got ${JSON.stringify(manifest.portraits)}`);
  assert(Array.isArray(manifest.files), 'manifest.files: expected an array');
  assert(manifest.files.length === expected,
    `manifest.files: expected ${expected} files, got ${manifest.files.length}`);

  const counts = Object.fromEntries(Object.keys(expectedSets).map((set) => [set, 0]));
  const byFile = new Map();
  for (let offset = 0; offset < manifest.files.length; offset++) {
    const row = manifest.files[offset];
    const where = `manifest.files row ${offset + 1}`;
    assert(isPlainObject(row), `${where}: expected an object`);
    assert(typeof row.set === 'string' && row.set in counts, `${where}.set: unknown set ${JSON.stringify(row.set)}`);
    const file = normaliseRelativeFile(row.file, `${where}.file`);
    assert(file.startsWith(`${row.set}/`), `${where}.file: expected a ${row.set}/ path, got ${JSON.stringify(file)}`);
    assert(typeof row.sha256 === 'string' && /^[0-9a-f]{64}$/i.test(row.sha256),
      `${where}.sha256: expected 64 hex characters`);
    assert(!byFile.has(file), `${where}: duplicate manifest file ${JSON.stringify(file)}`);
    counts[row.set]++;
    byFile.set(file, { set: row.set, file, sha256: row.sha256.toLowerCase() });
  }
  for (const [set, expectedCount] of Object.entries(expectedSets)) {
    assert(counts[set] === expectedCount,
      `manifest.files: ${set} expected ${expectedCount} files, got ${counts[set]}`);
  }
  return byFile;
}

function collectPortraits(portraits, manifestByFile, expectedSets = EXPECTED_SETS) {
  requireDirectory(portraits, '--portraits');
  const expected = Object.values(expectedSets).reduce((sum, count) => sum + count, 0);
  const rows = [];
  const seen = new Set();

  for (const [set, expectedCount] of Object.entries(expectedSets)) {
    const setDirectory = path.join(portraits, set);
    requireDirectory(setDirectory, `portrait set ${set}`);
    const files = fs.readdirSync(setDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.png'))
      .sort((left, right) => left.name.localeCompare(right.name));
    assert(files.length === expectedCount,
      `portrait set ${set}: expected ${expectedCount} PNGs, got ${files.length}`);

    for (const entry of files) {
      const file = path.join(setDirectory, entry.name);
      requireFile(file, `portrait ${set}/${entry.name}`);
      const relative = `${set}/${entry.name}`;
      const manifestRow = manifestByFile.get(relative);
      assert(manifestRow, `portrait ${relative}: missing from manifest.files`);
      const bytes = fs.readFileSync(file);
      const dimensions = pngDimensions(bytes, `portrait ${relative}`);
      assert(dimensions.width === 440 && dimensions.height === 440,
        `portrait ${relative}: expected 440x440, got ${dimensions.width}x${dimensions.height}`);
      const digest = sha256(bytes);
      assert(digest === manifestRow.sha256,
        `portrait ${relative}: SHA-256 differs from manifest.files`);
      assert(!seen.has(relative), `portrait ${relative}: duplicate filename`);
      seen.add(relative);
      rows.push({
        set,
        source: file,
        relative,
        sha256: digest,
        bytes: bytes.length,
        width: dimensions.width,
        height: dimensions.height,
      });
    }
  }

  assert(rows.length === expected, `portraits: expected ${expected}, got ${rows.length}`);
  assert(seen.size === manifestByFile.size,
    `portraits: only ${seen.size}/${manifestByFile.size} manifest files have current native pixels`);
  return rows;
}

function collectContactEvidence(contacts, manifestByFile, expectedSets = EXPECTED_SETS) {
  requireDirectory(contacts, '--contacts');
  const indexFile = path.join(contacts, 'index.json');
  requireFile(indexFile, 'contacts/index.json');
  const index = readJson(indexFile, 'contacts/index.json');
  assert(Array.isArray(index) && index.length > 0, 'contacts/index.json: expected a nonempty array');

  const expected = Object.values(expectedSets).reduce((sum, count) => sum + count, 0);
  const setCounts = Object.fromEntries(Object.keys(expectedSets).map((set) => [set, 0]));
  const identities = new Set();
  const stripFiles = new Set();
  const packetFiles = new Set();
  const packets = [];

  for (let packetOffset = 0; packetOffset < index.length; packetOffset++) {
    const packet = index[packetOffset];
    const where = `contacts/index packet ${packetOffset + 1}`;
    assert(isPlainObject(packet), `${where}: expected an object`);
    assert(Array.isArray(packet.species) && packet.species.length > 0,
      `${where}.species: expected a nonempty array`);
    const strip = resolveContactFile(contacts, packet.strip, `${where}.strip`);
    const reviewPacket = resolveContactFile(contacts, packet.packet, `${where}.packet`);
    const packetJson = resolveContactFile(contacts, packet.packet_json, `${where}.packet_json`);
    assert(path.extname(strip).toLowerCase() === '.png', `${where}.strip: expected a PNG contact sheet`);
    assert(path.extname(reviewPacket).toLowerCase() === '.md', `${where}.packet: expected a Markdown review packet`);
    assert(path.extname(packetJson).toLowerCase() === '.json', `${where}.packet_json: expected a JSON review packet`);
    requireFile(strip, `${where}.strip`);
    requireFile(reviewPacket, `${where}.packet`);
    requireFile(packetJson, `${where}.packet_json`);
    assert(!stripFiles.has(strip), `${where}.strip: duplicate contact sheet ${strip}`);
    assert(!packetFiles.has(reviewPacket), `${where}.packet: duplicate review packet ${reviewPacket}`);
    stripFiles.add(strip);
    packetFiles.add(reviewPacket);

    const stripBytes = fs.readFileSync(strip);
    const dimensions = pngDimensions(stripBytes, `${where}.strip`);
    assert(typeof packet.strip_sha256 === 'string' && /^[0-9a-f]{64}$/i.test(packet.strip_sha256),
      `${where}.strip_sha256: expected 64 hex characters`);
    const stripDigest = sha256(stripBytes);
    assert(stripDigest === packet.strip_sha256.toLowerCase(),
      `${where}.strip: SHA-256 differs from index.json`);
    const packetBytes = fs.readFileSync(reviewPacket);
    assert(packetBytes.length > 0, `${where}.packet: review packet is empty`);
    const packetJsonBytes = fs.readFileSync(packetJson);
    assert(packetJsonBytes.length > 0, `${where}.packet_json: review packet is empty`);

    const rows = [];
    for (let speciesOffset = 0; speciesOffset < packet.species.length; speciesOffset++) {
      const species = packet.species[speciesOffset];
      const rowWhere = `${where}.species ${speciesOffset + 1}`;
      assert(isPlainObject(species), `${rowWhere}: expected an object`);
      assert(typeof species.set === 'string' && species.set in setCounts,
        `${rowWhere}.set: unknown set ${JSON.stringify(species.set)}`);
      assert(typeof species.name === 'string' && species.name.trim(), `${rowWhere}.name: expected a nonempty string`);
      const imageFile = normaliseRelativeFile(species.image_file, `${rowWhere}.image_file`);
      assert(imageFile.startsWith(`${species.set}/`),
        `${rowWhere}.image_file: expected a ${species.set}/ path, got ${JSON.stringify(imageFile)}`);
      assert(typeof species.sha256 === 'string' && /^[0-9a-f]{64}$/i.test(species.sha256),
        `${rowWhere}.sha256: expected 64 hex characters`);
      const manifestRow = manifestByFile.get(imageFile);
      assert(manifestRow, `${rowWhere}.image_file: absent from manifest.files`);
      assert(manifestRow.sha256 === species.sha256.toLowerCase(),
        `${rowWhere}: image SHA-256 differs from manifest.files`);
      const identity = `${species.set}\u0000${species.name.trim()}`;
      assert(!identities.has(identity), `${rowWhere}: duplicate contact identity ${JSON.stringify(identity)}`);
      identities.add(identity);
      setCounts[species.set]++;
      rows.push({ set: species.set, name: species.name.trim() });
    }

    packets.push({
      strip,
      packet: reviewPacket,
      packetJson,
      stripRelative: portable(pathInside(contacts, strip, `${where}.strip`).relative),
      packetRelative: portable(pathInside(contacts, reviewPacket, `${where}.packet`).relative),
      packetJsonRelative: portable(pathInside(contacts, packetJson, `${where}.packet_json`).relative),
      stripSha256: stripDigest,
      packetSha256: sha256(packetBytes),
      packetJsonSha256: sha256(packetJsonBytes),
      stripWidth: dimensions.width,
      stripHeight: dimensions.height,
      rows,
    });
  }

  assert(identities.size === expected,
    `contacts/index.json: expected ${expected} unique contact identities, got ${identities.size}`);
  for (const [set, expectedCount] of Object.entries(expectedSets)) {
    assert(setCounts[set] === expectedCount,
      `contacts/index.json: ${set} expected ${expectedCount} rows, got ${setCounts[set]}`);
  }
  return {
    indexFile,
    indexSha256: sha256File(indexFile),
    packets,
    identities: identities.size,
  };
}

function inputFingerprint(paths) {
  return Object.fromEntries(Object.entries(paths).map(([label, file]) => [label, sha256File(file)]));
}

function sameFingerprints(before, after, label) {
  for (const key of Object.keys(before)) {
    assert(before[key] === after[key], `${label}: ${key} changed while it was being certified`);
  }
}

function transcript(error) {
  const pieces = [error.stdout, error.stderr].filter((value) => value !== undefined && value !== null)
    .map((value) => Buffer.isBuffer(value) ? value.toString('utf8') : String(value));
  return pieces.join('\n').trim();
}

function runConformity(paths) {
  requireFile(conformityTool, 'gp7conformity tool');
  const args = [
    conformityTool,
    '--input', paths.ledger,
    '--manifest', paths.manifest,
    '--results', paths.results,
    '--index', paths.index,
    '--certify',
  ];
  try {
    return execFileSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const detail = transcript(error);
    fail(`gp7conformity --certify rejected the supplied ledger${detail ? `:\n${detail}` : ''}`);
  }
}

function requireNewNamedTarget(target, label, extension) {
  assert(typeof target === 'string' && target.trim(), `${label}: path is required`);
  const absolute = path.resolve(process.cwd(), target);
  const basename = path.basename(absolute);
  const marker = /GP7[_.-]?1/i;
  assert(marker.test(basename) && basename.includes(PACKAGE_DATE),
    `${label}: basename must identify dated GP7.1 evidence (include GP7_1 and ${PACKAGE_DATE})`);
  if (extension) assert(basename.toLowerCase().endsWith(extension), `${label}: expected a ${extension} target`);
  assert(!fs.existsSync(absolute), `${label}: target already exists and will not be overwritten: ${absolute}`);
  const parent = path.dirname(absolute);
  requireDirectory(parent, `${label} parent`);
  assert(path.parse(absolute).root !== absolute, `${label}: may not target a filesystem root`);
  return absolute;
}

function validateTargets(options) {
  const evidence = requireNewNamedTarget(options.evidence, '--evidence');
  const output = requireNewNamedTarget(options.output, '--output', '.zip');
  assert(evidence !== output, 'package targets: --evidence and --output must differ');
  return { evidence, output };
}

function targetContains(target, source) {
  const relative = path.relative(target, source);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function assertTargetsDoNotContainSources(paths, targets) {
  for (const [label, source] of Object.entries(paths)) {
    assert(!targetContains(targets.evidence, source) && !targetContains(source, targets.evidence),
      `--${label}: source and new evidence target may not overlap`);
    assert(!targetContains(targets.output, source) && !targetContains(source, targets.output),
      `--${label}: source and new ZIP target may not overlap`);
  }
}

function copyVerified(source, sourceRoot, targetRoot, expectedSha256, label) {
  const relative = pathInside(sourceRoot, source, label).relative;
  const target = path.join(targetRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  assert(sha256File(target) === expectedSha256,
    `${label}: copied evidence SHA-256 differs from the validated source`);
  return portable(relative);
}

function copyInto(source, target, expectedSha256, label) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  assert(sha256File(target) === expectedSha256,
    `${label}: copied evidence SHA-256 differs from the validated source`);
}

function powershellLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function createZip(evidence, output) {
  assert(!fs.existsSync(output), `--output: target appeared during packaging: ${output}`);
  const command = "$ErrorActionPreference = 'Stop'; "
    + `Compress-Archive -LiteralPath @(${powershellLiteral(evidence)}) -DestinationPath ${powershellLiteral(output)} -CompressionLevel Optimal`;
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const detail = transcript(error);
    fail(`ZIP creation failed; the validated evidence directory remains at ${evidence}${detail ? `:\n${detail}` : ''}`);
  }
  requireFile(output, 'new GP7.1 ZIP');
  assert(fs.statSync(output).size > 1024, `new GP7.1 ZIP is unexpectedly small: ${output}`);
}

function writeReadme(stage, summary) {
  const lines = [
    '# Celestial Frontier — GP7.1 Strict Evidence Package',
    '',
    `Evidence date: ${PACKAGE_DATE}.`,
    '',
    'This package was built only after `gp7conformity --certify` accepted a literal',
    `fresh-strict ${EXPECTED_TOTAL}/${EXPECTED_TOTAL} PASS ledger. It contains the exact native`,
    '440x440 portrait bytes matched against that ledger/manifest, plus every indexed contact',
    'sheet and review packet.',
    '',
    'Contents:',
    '',
    '- `portraits/` — exact 1,250 current native 440x440 PNG portraits.',
    '- `contact-sheets/` — the complete index, all indexed contact sheets, and their packets.',
    '- `certification/` — immutable copies of the certified ledger, manifest, results, and',
    '  the gp7conformity transcript.',
    `- \`GP7_1_PACKAGE_REPORT_${PACKAGE_DATE}.json\` — input, pixel, contact, and package hashes.`,
    '',
    `Validated portrait total: ${summary.portraits.length}.`,
    `Validated contact coverage: ${summary.contacts.identities}.`,
    `Validated contact sheets: ${summary.contacts.packets.length}.`,
    '',
  ];
  fs.writeFileSync(path.join(stage, 'README.md'), lines.join('\n'));
}

function buildReport({ sources, sourceHashes, portraits, contacts, transcriptText }) {
  const setCounts = Object.fromEntries(Object.entries(EXPECTED_SETS));
  return {
    schema: PACKAGE_SCHEMA,
    evidenceDate: PACKAGE_DATE,
    certification: {
      command: 'node tools/gp7conformity.mjs --input <ledger> --manifest <manifest> --results <results> --index <contacts/index.json> --certify',
      result: 'PASS',
      transcriptSha256: sha256(Buffer.from(transcriptText, 'utf8')),
      literalFreshStrictPasses: EXPECTED_TOTAL,
    },
    portraitEvidence: {
      count: portraits.length,
      dimensions: '440x440 PNG',
      sets: setCounts,
      files: portraits.map((row) => ({
        set: row.set,
        file: row.relative,
        bytes: row.bytes,
        sha256: row.sha256,
      })),
    },
    contactEvidence: {
      identities: contacts.identities,
      indexSha256: contacts.indexSha256,
      sheets: contacts.packets.map((packet) => ({
        strip: packet.stripRelative,
        packet: packet.packetRelative,
        packetJson: packet.packetJsonRelative,
        dimensions: `${packet.stripWidth}x${packet.stripHeight} PNG`,
        species: packet.rows.length,
        stripSha256: packet.stripSha256,
        packetSha256: packet.packetSha256,
        packetJsonSha256: packet.packetJsonSha256,
      })),
    },
    certifiedInputs: Object.fromEntries(Object.entries(sourceHashes).map(([label, digest]) => [label, {
      source: displayPath(sources[label]),
      sha256: digest,
    }])),
    artifactRoots: {
      portraits: displayPath(sources.portraits),
      contacts: displayPath(sources.contacts),
    },
  };
}

function buildPackage(options, { quiet = false } = {}) {
  const sources = {
    portraits: requireDirectory(path.resolve(process.cwd(), options.portraits), '--portraits'),
    contacts: requireDirectory(path.resolve(process.cwd(), options.contacts), '--contacts'),
    ledger: requireFile(path.resolve(process.cwd(), options.ledger), '--ledger'),
    manifest: requireFile(path.resolve(process.cwd(), options.manifest), '--manifest'),
    results: requireFile(path.resolve(process.cwd(), options.results), '--results'),
  };
  const index = requireFile(path.join(sources.contacts, 'index.json'), 'contacts/index.json');
  const targets = validateTargets(options);
  assertTargetsDoNotContainSources({ ...sources, index }, targets);

  const beforeConformity = inputFingerprint({ ledger: sources.ledger, manifest: sources.manifest, results: sources.results, index });
  const conformityTranscript = runConformity({ ...sources, index });
  const afterConformity = inputFingerprint({ ledger: sources.ledger, manifest: sources.manifest, results: sources.results, index });
  sameFingerprints(beforeConformity, afterConformity, 'certification inputs');

  const manifestByFile = normaliseManifest(readJson(sources.manifest, 'manifest'));
  const portraits = collectPortraits(sources.portraits, manifestByFile);
  const contacts = collectContactEvidence(sources.contacts, manifestByFile);
  const report = buildReport({
    sources: { ...sources, index },
    sourceHashes: afterConformity,
    portraits,
    contacts,
    transcriptText: conformityTranscript,
  });

  const stage = `${targets.evidence}.tmp-${process.pid}-${crypto.randomBytes(6).toString('hex')}`;
  assert(!fs.existsSync(stage), `internal staging target unexpectedly exists: ${stage}`);
  try {
    fs.mkdirSync(stage);
    for (const portrait of portraits) {
      copyVerified(portrait.source, sources.portraits, path.join(stage, 'portraits'), portrait.sha256,
        `portrait ${portrait.relative}`);
    }
    copyInto(index, path.join(stage, 'contact-sheets', 'index.json'), contacts.indexSha256, 'contacts/index.json');
    for (const packet of contacts.packets) {
      copyVerified(packet.strip, sources.contacts, path.join(stage, 'contact-sheets'), packet.stripSha256,
        `contact sheet ${packet.stripRelative}`);
      copyVerified(packet.packet, sources.contacts, path.join(stage, 'contact-sheets'), packet.packetSha256,
        `review packet ${packet.packetRelative}`);
      copyVerified(packet.packetJson, sources.contacts, path.join(stage, 'contact-sheets'), packet.packetJsonSha256,
        `review packet JSON ${packet.packetJsonRelative}`);
    }
    const certification = path.join(stage, 'certification');
    copyInto(sources.ledger, path.join(certification, `ledger${path.extname(sources.ledger).toLowerCase()}`),
      afterConformity.ledger, 'certified ledger');
    copyInto(sources.manifest, path.join(certification, 'manifest.json'), afterConformity.manifest, 'certified manifest');
    copyInto(sources.results, path.join(certification, 'results.json'), afterConformity.results, 'certified results');
    fs.writeFileSync(path.join(certification, 'gp7conformity-certify.txt'), `${conformityTranscript}\n`);
    fs.writeFileSync(path.join(stage, `GP7_1_PACKAGE_REPORT_${PACKAGE_DATE}.json`), JSON.stringify(report, null, 2) + '\n');
    writeReadme(stage, { portraits, contacts });
    fs.renameSync(stage, targets.evidence);
  } catch (error) {
    if (fs.existsSync(stage)) fs.rmSync(stage, { recursive: true, force: true });
    throw error;
  }

  createZip(targets.evidence, targets.output);
  const outputSha256 = sha256File(targets.output);
  if (!quiet) {
    console.log('GP7.1 STRICT EVIDENCE PACKAGE PASS');
    console.log(`  certificate: gp7conformity --certify accepted ${EXPECTED_TOTAL}/${EXPECTED_TOTAL} fresh-strict PASS`);
    console.log(`  portraits: ${portraits.length}/${EXPECTED_TOTAL} current native 440x440 PNGs (ledger/manifest SHA-256 matched)`);
    console.log(`  contacts: ${contacts.identities}/${EXPECTED_TOTAL} indexed identities across ${contacts.packets.length} labelled contact sheets`);
    console.log(`  evidence: ${targets.evidence}`);
    console.log(`  zip: ${targets.output} (${(fs.statSync(targets.output).size / 1e6).toFixed(1)} MB)`);
    console.log(`  zip SHA-256: ${outputSha256}`);
  }
  return { ...targets, report, outputSha256 };
}

function parseArgs(args) {
  const options = {
    portraits: null,
    contacts: null,
    ledger: null,
    manifest: null,
    results: null,
    evidence: null,
    output: null,
    selftest: false,
  };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--selftest') {
      assert(!options.selftest, 'duplicate --selftest');
      options.selftest = true;
    } else if (argument === '--help' || argument === '-h') {
      return { help: true };
    } else if (['--portraits', '--contacts', '--ledger', '--manifest', '--results', '--evidence', '--output'].includes(argument)) {
      const property = argument.slice(2);
      assert(index + 1 < args.length, `${argument}: path is required`);
      assert(!options[property], `duplicate ${argument}`);
      options[property] = args[++index];
    } else {
      fail(`unknown argument: ${argument}`);
    }
  }
  if (options.selftest) {
    assert(!options.portraits && !options.contacts && !options.ledger && !options.manifest
      && !options.results && !options.evidence && !options.output,
    '--selftest cannot be combined with packaging arguments');
  } else {
    for (const key of ['portraits', 'contacts', 'ledger', 'manifest', 'results', 'evidence', 'output']) {
      assert(options[key], `--${key} is required (use --help for usage)`);
    }
  }
  return options;
}

function usage() {
  console.log('Usage:');
  console.log('  node tools/gp71package-2026-08-09.mjs --portraits <dir> --contacts <dir>');
  console.log('    --ledger <fresh-ledger.json|csv> --manifest <manifest.json> --results <results.json>');
  console.log('    --evidence <new-dated-GP7_1-directory> --output <new-dated-GP7_1.zip>');
  console.log('  node tools/gp71package-2026-08-09.mjs --selftest');
  console.log('');
  console.log('The tool always invokes gp7conformity --certify and refuses existing or legacy targets.');
}

function makePng(width = 440, height = 440) {
  const bytes = Buffer.alloc(24);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function createFullFixture(directory) {
  const portraits = path.join(directory, 'portraits');
  const contacts = path.join(directory, 'contacts');
  const review = path.join(directory, 'review-info');
  fs.mkdirSync(portraits, { recursive: true });
  fs.mkdirSync(contacts, { recursive: true });
  fs.mkdirSync(review, { recursive: true });

  const files = [];
  const ledgerRows = [];
  const resultRows = [];
  const index = [];
  for (const [set, count] of Object.entries(EXPECTED_SETS)) {
    const portraitSet = path.join(portraits, set);
    const contactSet = path.join(contacts, set);
    fs.mkdirSync(portraitSet, { recursive: true });
    fs.mkdirSync(contactSet, { recursive: true });
    const species = [];
    for (let number = 1; number <= count; number++) {
      const name = `Fixture ${set} ${number}`;
      const filename = `Fixture_${String(number).padStart(4, '0')}.png`;
      const relative = `${set}/${filename}`;
      const file = path.join(portraitSet, filename);
      const png = makePng();
      fs.writeFileSync(file, png);
      const digest = sha256(png);
      files.push({ set, file: relative, sha256: digest });
      ledgerRows.push({
        set,
        species: name,
        image_file: relative,
        sha256: digest,
        current_recorded_band: 'PASS',
        freshly_rejudged: true,
        source_ruler: 'GP7 fresh strict rejudge',
        action_to_100_percent: 'FREEZE',
      });
      resultRows.push({ set, species: name, band: 'PASS', rejudged: true });
      species.push({ set, name, image_file: relative, sha256: digest });
    }
    const strip = path.join(contactSet, 'strip.png');
    const packet = path.join(contactSet, 'packet.md');
    const packetJson = path.join(contactSet, 'packet.json');
    fs.writeFileSync(strip, makePng(1000, 200));
    fs.writeFileSync(packet, `# ${set} fixture review packet\n`);
    fs.writeFileSync(packetJson, JSON.stringify({ set, species: species.length }, null, 2));
    index.push({
      family: `${set} fixture`,
      strip: portable(path.relative(contacts, strip)),
      packet: portable(path.relative(contacts, packet)),
      packet_json: portable(path.relative(contacts, packetJson)),
      strip_sha256: sha256File(strip),
      species,
    });
  }
  const manifest = { portraits: EXPECTED_TOTAL, files };
  const results = { rows: resultRows };
  const ledger = path.join(review, 'gp71-strict-ledger.json');
  const manifestFile = path.join(review, 'manifest.json');
  const resultsFile = path.join(review, 'gp71-strict-results.json');
  fs.writeFileSync(ledger, JSON.stringify({ rows: ledgerRows }, null, 2));
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(contacts, 'index.json'), JSON.stringify(index, null, 2));
  return { portraits, contacts, ledger, manifest: manifestFile, results: resultsFile };
}

function expectRejected(label, work, expected) {
  let caught = null;
  try {
    work();
  } catch (error) {
    caught = error;
  }
  assert(caught, `SELFTEST ${label}: injected failure was accepted`);
  assert(expected.test(caught.message),
    `SELFTEST ${label}: rejected for the wrong reason: ${caught.message}`);
}

function runSelftest() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-gp71package-'));
  try {
    const fixture = createFullFixture(temporary);
    const first = buildPackage({
      ...fixture,
      evidence: path.join(temporary, `GP7_1_Strict_Evidence_${PACKAGE_DATE}`),
      output: path.join(temporary, `Celestial_Frontier_GP7_1_Strict_Evidence_${PACKAGE_DATE}.zip`),
    }, { quiet: true });
    requireDirectory(first.evidence, 'SELFTEST evidence directory');
    requireFile(first.output, 'SELFTEST ZIP');
    requireFile(path.join(first.evidence, `GP7_1_PACKAGE_REPORT_${PACKAGE_DATE}.json`), 'SELFTEST package report');

    expectRejected('existing target', () => buildPackage({
      ...fixture,
      evidence: first.evidence,
      output: first.output,
    }, { quiet: true }), /will not be overwritten/);

    const manifest = readJson(fixture.manifest, 'SELFTEST manifest');
    const firstPortrait = path.join(fixture.portraits, manifest.files[0].file);
    const wrongSize = makePng(439, 440);
    fs.writeFileSync(firstPortrait, wrongSize);
    manifest.files[0].sha256 = sha256(wrongSize);
    fs.writeFileSync(fixture.manifest, JSON.stringify(manifest, null, 2));
    const ledger = readJson(fixture.ledger, 'SELFTEST ledger');
    ledger.rows[0].sha256 = sha256(wrongSize);
    fs.writeFileSync(fixture.ledger, JSON.stringify(ledger, null, 2));
    expectRejected('wrong portrait dimensions', () => collectPortraits(fixture.portraits,
      normaliseManifest(readJson(fixture.manifest, 'SELFTEST manifest'))), /expected 440x440/);

    const indexFile = path.join(fixture.contacts, 'index.json');
    const index = readJson(indexFile, 'SELFTEST contact index');
    index[0].species[0].sha256 = manifest.files[0].sha256;
    index[0].strip_sha256 = sha256('stale contact sheet');
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
    expectRejected('stale contact sheet hash', () => collectContactEvidence(fixture.contacts,
      normaliseManifest(readJson(fixture.manifest, 'SELFTEST manifest'))), /SHA-256 differs from index\.json/);
    index[0].strip_sha256 = sha256File(path.join(fixture.contacts, index[0].strip));
    index[0].species.pop();
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
    expectRejected('missing contact identity', () => collectContactEvidence(fixture.contacts,
      normaliseManifest(readJson(fixture.manifest, 'SELFTEST manifest'))),
      /expected 1250 unique contact identities/);
    index[0].species.push({
      set: 'earth-fauna',
      name: 'Fixture earth-fauna 631',
      image_file: 'earth-fauna/Fixture_0631.png',
      sha256: normaliseManifest(readJson(fixture.manifest, 'SELFTEST manifest')).get('earth-fauna/Fixture_0631.png').sha256,
    });
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));

    const carried = readJson(fixture.ledger, 'SELFTEST ledger');
    carried.rows[1].freshly_rejudged = false;
    carried.rows[1].source_ruler = 'Byte-unchanged carried one-by-one verdict';
    carried.rows[1].action_to_100_percent = 'REVALIDATE_STRICT_THEN_FREEZE';
    fs.writeFileSync(fixture.ledger, JSON.stringify(carried, null, 2));
    const results = readJson(fixture.results, 'SELFTEST results');
    results.rows[1].rejudged = false;
    fs.writeFileSync(fixture.results, JSON.stringify(results, null, 2));
    expectRejected('carried ledger certification', () => runConformity({
      ...fixture,
      index: indexFile,
    }), /carried rows are not fresh strict verdicts/);

    expectRejected('legacy-looking output', () => requireNewNamedTarget(
      path.join(temporary, 'Celestial_Frontier_GP7_Complete_Catalogue_Review_2026-08-09.zip'),
      'SELFTEST legacy output', '.zip'), /dated GP7\.1 evidence/);

    console.log('GP7.1 PACKAGE SELFTEST PASS');
    console.log('  1,250 current 440x440 portrait + contact-sheet package: PASS');
    console.log('  gp7conformity --certify all-fresh strict ledger: PASS');
    console.log('  existing output/evidence target: rejected');
    console.log('  non-440 portrait: rejected');
    console.log('  stale contact-sheet hash: rejected');
    console.log('  missing contact identity: rejected');
    console.log('  carried ledger cannot certify: rejected');
    console.log('  legacy GP7-style output name: rejected');
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }
  if (options.selftest) {
    runSelftest();
    return;
  }
  buildPackage(options);
}

try {
  run();
} catch (error) {
  console.error('GP7.1 STRICT EVIDENCE PACKAGE FAILED');
  console.error(`  ${error.message}`);
  process.exitCode = 1;
}
