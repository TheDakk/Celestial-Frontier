/* gp7conformity.mjs — fail-closed GP7 ledger conformity audit.

   This tool audits a complete, extracted GP7 recheck ledger.  It deliberately
   does not treat a 1,250-row spreadsheet, a green process exit, or a mixed
   set of historical bands as a 100% certification.

   Usage:
     node tools/gp7conformity.mjs --input <extracted-package-directory>
     node tools/gp7conformity.mjs --input <ledger.json|ledger.csv> \
       --manifest <manifest.json> --results <goldpass7-results.json> \
       --index <catalogue-review-index.json>
     node tools/gp7conformity.mjs --input <...> --certify
     node tools/gp7conformity.mjs --selftest

   --certify fails unless every one of the exact 1,250 catalogue identities is
   a current GP7 fresh-strict PASS.  A carried verdict is useful work-queue
   evidence, but is never sufficient to certify a literal 100% PASS.
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

const EXPECTED_SETS = Object.freeze({
  'earth-fauna': 631,
  'earth-flora': 332,
  'earth-fungi': 27,
  'earth-microbe': 20,
  procedural: 240,
});
const LEGAL_BANDS = new Set(['FAIL', 'POLISH', 'PASS']);
const FRESH_RULER = 'GP7 fresh strict rejudge';
const CARRIED_RULER = 'Byte-unchanged carried one-by-one verdict';
const ACTION_BY_STATE = Object.freeze({
  fresh: Object.freeze({
    FAIL: 'FIX_TO_PASS',
    POLISH: 'POLISH_TO_PASS',
    PASS: 'FREEZE',
  }),
  carried: Object.freeze({
    FAIL: 'REVALIDATE_STRICT_THEN_FIX_IF_CONFIRMED',
    POLISH: 'REVALIDATE_STRICT_THEN_POLISH_IF_CONFIRMED',
    PASS: 'REVALIDATE_STRICT_THEN_FREEZE',
  }),
});

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function expectedTotal(expectedSets) {
  return Object.values(expectedSets).reduce((sum, count) => sum + count, 0);
}

function displayPath(file) {
  const relative = path.relative(root, file);
  return relative && !relative.startsWith('..') ? relative.split(path.sep).join('/') : file;
}

function readText(file, label) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    fail(`${label}: cannot read ${displayPath(file)} (${error.message})`);
  }
}

function readJson(file, label) {
  let parsed;
  try {
    parsed = JSON.parse(readText(file, label));
  } catch (error) {
    fail(`${label}: invalid JSON in ${displayPath(file)} (${error.message})`);
  }
  return parsed;
}

/* The recheck CSV deliberately contains multiline verification notes.  Do not
   split on newlines: parse RFC-4180-style quoted fields and fail on malformed
   quoting instead. */
function parseCsv(text, label) {
  const input = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const records = [];
  let record = [];
  let field = '';
  let inQuotes = false;
  let afterQuote = false;

  function finishField() {
    record.push(field);
    field = '';
    afterQuote = false;
  }

  function finishRecord() {
    finishField();
    if (record.some((value) => value.length > 0)) records.push(record);
    record = [];
  }

  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (inQuotes) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (afterQuote) {
      if (char === ',') {
        finishField();
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && input[index + 1] === '\n') index++;
        finishRecord();
      } else {
        fail(`${label}: unexpected ${JSON.stringify(char)} after closing quote at character ${index + 1}`);
      }
      continue;
    }

    if (char === '"') {
      assert(field.length === 0,
        `${label}: quote inside an unquoted field at character ${index + 1}`);
      inQuotes = true;
    } else if (char === ',') {
      finishField();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[index + 1] === '\n') index++;
      finishRecord();
    } else {
      field += char;
    }
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

  return records.map((record, rowOffset) => {
    assert(record.length === headers.length,
      `${label}: row ${rowOffset + 2} has ${record.length} columns; expected ${headers.length}`);
    return Object.fromEntries(headers.map((header, index) => [header, record[index]]));
  });
}

function readLedger(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === '.json') {
    const parsed = readJson(file, 'ledger');
    if (Array.isArray(parsed)) return parsed;
    assert(isPlainObject(parsed) && Array.isArray(parsed.rows),
      `ledger: ${displayPath(file)} must be an array or an object with a rows array`);
    return parsed.rows;
  }
  if (extension === '.csv') return parseCsv(readText(file, 'ledger'), `ledger ${displayPath(file)}`);
  fail(`ledger: unsupported input extension ${JSON.stringify(extension)}; use .json or .csv`);
}

function stringField(value, where) {
  assert(typeof value === 'string' && value.trim().length > 0, `${where}: must be a nonempty string`);
  return value.trim();
}

function booleanField(value, where) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  fail(`${where}: must be boolean true/false (CSV uses lowercase true/false)`);
}

function normaliseRelativeFile(value, where) {
  const normalised = stringField(value, where).replaceAll('\\', '/');
  assert(!normalised.startsWith('/') && !/^[A-Za-z]:\//.test(normalised),
    `${where}: must be relative, not absolute`);
  const segments = normalised.split('/');
  assert(segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..'),
    `${where}: may not contain empty, . or .. path segments`);
  return normalised;
}

function rowKey(set, species) {
  return `${set}\u0000${species}`;
}

function countBy(rows, getter) {
  const counts = new Map();
  for (const row of rows) {
    const key = getter(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function formatBandCounts(counts) {
  return ['FAIL', 'POLISH', 'PASS'].map((band) => `${band} ${counts.get(band) || 0}`).join(' · ');
}

function validateSetCounts(rows, getter, label, expectedSets) {
  const expected = expectedTotal(expectedSets);
  assert(rows.length === expected, `${label}: expected ${expected} rows, got ${rows.length}`);
  const counts = Object.fromEntries(Object.keys(expectedSets).map((set) => [set, 0]));
  for (let offset = 0; offset < rows.length; offset++) {
    const set = getter(rows[offset], offset);
    assert(set in counts, `${label}: row ${offset + 1} has unknown set ${JSON.stringify(set)}`);
    counts[set]++;
  }
  for (const [set, expectedCount] of Object.entries(expectedSets)) {
    assert(counts[set] === expectedCount,
      `${label}: ${set} expected ${expectedCount} rows, got ${counts[set]}`);
  }
  return counts;
}

function mapUnique(rows, keyFor, label) {
  const mapped = new Map();
  for (let offset = 0; offset < rows.length; offset++) {
    const row = rows[offset];
    const key = keyFor(row, offset);
    assert(!mapped.has(key), `${label}: duplicate identity ${JSON.stringify(key)}`);
    mapped.set(key, row);
  }
  return mapped;
}

function normaliseLedgerRows(rawRows, expectedSets) {
  assert(Array.isArray(rawRows), 'ledger: rows must be an array');
  const rows = rawRows.map((raw, offset) => {
    const where = `ledger row ${offset + 1}`;
    assert(isPlainObject(raw), `${where}: must be an object`);
    const set = stringField(raw.set, `${where}.set`);
    assert(set in expectedSets, `${where}.set: unknown set ${JSON.stringify(set)}`);
    const species = stringField(raw.species, `${where}.species`);
    const imageFile = normaliseRelativeFile(raw.image_file, `${where}.image_file`);
    assert(imageFile.startsWith(`${set}/`),
      `${where}.image_file: expected a ${set}/ path, got ${JSON.stringify(imageFile)}`);
    const sha256 = stringField(raw.sha256, `${where}.sha256`).toLowerCase();
    assert(/^[0-9a-f]{64}$/.test(sha256), `${where}.sha256: expected 64 lowercase hex characters`);
    const band = stringField(raw.current_recorded_band, `${where}.current_recorded_band`);
    assert(LEGAL_BANDS.has(band), `${where}.current_recorded_band: invalid band ${JSON.stringify(band)}`);
    const freshlyRejudged = booleanField(raw.freshly_rejudged, `${where}.freshly_rejudged`);
    const sourceRuler = stringField(raw.source_ruler, `${where}.source_ruler`);
    const expectedRuler = freshlyRejudged ? FRESH_RULER : CARRIED_RULER;
    assert(sourceRuler === expectedRuler,
      `${where}.source_ruler: ${freshlyRejudged ? 'fresh strict' : 'carried'} row must be ${JSON.stringify(expectedRuler)}, got ${JSON.stringify(sourceRuler)}`);
    const action = stringField(raw.action_to_100_percent, `${where}.action_to_100_percent`);
    const expectedAction = ACTION_BY_STATE[freshlyRejudged ? 'fresh' : 'carried'][band];
    assert(action === expectedAction,
      `${where}.action_to_100_percent: expected ${JSON.stringify(expectedAction)} for ${freshlyRejudged ? 'fresh' : 'carried'} ${band}, got ${JSON.stringify(action)}`);
    return { set, species, imageFile, sha256, band, freshlyRejudged, sourceRuler, action };
  });
  validateSetCounts(rows, (row) => row.set, 'ledger', expectedSets);
  mapUnique(rows, (row) => rowKey(row.set, row.species), 'ledger');
  mapUnique(rows, (row) => row.imageFile, 'ledger image file');
  return rows;
}

function normaliseManifest(manifest, expectedSets) {
  const expected = expectedTotal(expectedSets);
  assert(isPlainObject(manifest), 'manifest: must be an object');
  assert(manifest.portraits === expected,
    `manifest.portraits: expected ${expected}, got ${JSON.stringify(manifest.portraits)}`);
  assert(Array.isArray(manifest.files), 'manifest.files: must be an array');
  const files = manifest.files.map((raw, offset) => {
    const where = `manifest.files row ${offset + 1}`;
    assert(isPlainObject(raw), `${where}: must be an object`);
    const set = stringField(raw.set, `${where}.set`);
    assert(set in expectedSets, `${where}.set: unknown set ${JSON.stringify(set)}`);
    const file = normaliseRelativeFile(raw.file, `${where}.file`);
    assert(file.startsWith(`${set}/`), `${where}.file: expected a ${set}/ path, got ${JSON.stringify(file)}`);
    const sha256 = stringField(raw.sha256, `${where}.sha256`).toLowerCase();
    assert(/^[0-9a-f]{64}$/.test(sha256), `${where}.sha256: expected 64 lowercase hex characters`);
    return { set, file, sha256 };
  });
  validateSetCounts(files, (file) => file.set, 'manifest.files', expectedSets);
  mapUnique(files, (file) => file.file, 'manifest.files');
  return files;
}

function normaliseResults(results, expectedSets) {
  assert(isPlainObject(results) && Array.isArray(results.rows), 'results.rows: must be an array');
  const rows = results.rows.map((raw, offset) => {
    const where = `results row ${offset + 1}`;
    assert(isPlainObject(raw), `${where}: must be an object`);
    const set = stringField(raw.set, `${where}.set`);
    assert(set in expectedSets, `${where}.set: unknown set ${JSON.stringify(set)}`);
    const species = stringField(raw.species, `${where}.species`);
    const band = stringField(raw.band, `${where}.band`);
    assert(LEGAL_BANDS.has(band), `${where}.band: invalid band ${JSON.stringify(band)}`);
    const rejudged = booleanField(raw.rejudged, `${where}.rejudged`);
    return { set, species, band, rejudged };
  });
  validateSetCounts(rows, (row) => row.set, 'results.rows', expectedSets);
  mapUnique(rows, (row) => rowKey(row.set, row.species), 'results.rows');
  return rows;
}

function normaliseIndex(index, expectedSets) {
  assert(Array.isArray(index), 'catalogue index: must be an array');
  const rows = [];
  for (let packetOffset = 0; packetOffset < index.length; packetOffset++) {
    const packet = index[packetOffset];
    const packetWhere = `catalogue index packet ${packetOffset + 1}`;
    assert(isPlainObject(packet), `${packetWhere}: must be an object`);
    assert(Array.isArray(packet.species) && packet.species.length > 0,
      `${packetWhere}.species: must be a nonempty array`);
    for (let speciesOffset = 0; speciesOffset < packet.species.length; speciesOffset++) {
      const raw = packet.species[speciesOffset];
      const where = `${packetWhere}.species ${speciesOffset + 1}`;
      assert(isPlainObject(raw), `${where}: must be an object`);
      const set = stringField(raw.set, `${where}.set`);
      assert(set in expectedSets, `${where}.set: unknown set ${JSON.stringify(set)}`);
      rows.push({ set, species: stringField(raw.name, `${where}.name`) });
    }
  }
  validateSetCounts(rows, (row) => row.set, 'catalogue index', expectedSets);
  mapUnique(rows, (row) => rowKey(row.set, row.species), 'catalogue index');
  return rows;
}

function auditBundle(bundle, expectedSets = EXPECTED_SETS) {
  const expected = expectedTotal(expectedSets);
  assert(isPlainObject(bundle), 'audit bundle: must be an object');
  const ledger = normaliseLedgerRows(bundle.ledgerRows, expectedSets);
  const manifest = normaliseManifest(bundle.manifest, expectedSets);
  const results = normaliseResults(bundle.results, expectedSets);
  const index = normaliseIndex(bundle.index, expectedSets);

  const ledgerByIdentity = mapUnique(ledger, (row) => rowKey(row.set, row.species), 'ledger');
  const ledgerByImageFile = mapUnique(ledger, (row) => row.imageFile, 'ledger image file');
  const manifestByFile = mapUnique(manifest, (row) => row.file, 'manifest.files');
  const resultByIdentity = mapUnique(results, (row) => rowKey(row.set, row.species), 'results.rows');
  const indexByIdentity = mapUnique(index, (row) => rowKey(row.set, row.species), 'catalogue index');

  for (const [identity, row] of ledgerByIdentity) {
    const manifestRow = manifestByFile.get(row.imageFile);
    assert(manifestRow, `join: ${identity} has no manifest row for ${JSON.stringify(row.imageFile)}`);
    assert(manifestRow.sha256 === row.sha256,
      `join: ${identity} SHA-256 differs between ledger and manifest for ${JSON.stringify(row.imageFile)}`);
    const resultRow = resultByIdentity.get(identity);
    assert(resultRow, `join: ledger ${identity} has no results row`);
    assert(resultRow.band === row.band,
      `join: ${identity} band differs between ledger (${row.band}) and results (${resultRow.band})`);
    assert(resultRow.rejudged === row.freshlyRejudged,
      `join: ${identity} freshness differs between ledger (${row.freshlyRejudged}) and results (${resultRow.rejudged})`);
    assert(indexByIdentity.has(identity), `join: ledger ${identity} has no catalogue-index row`);
  }

  for (const identity of resultByIdentity.keys()) {
    assert(ledgerByIdentity.has(identity), `join: results ${identity} has no ledger row`);
  }
  for (const identity of indexByIdentity.keys()) {
    assert(ledgerByIdentity.has(identity), `join: catalogue index ${identity} has no ledger row`);
  }
  for (const file of manifestByFile.keys()) {
    assert(ledgerByImageFile.has(file), `join: manifest file ${JSON.stringify(file)} has no ledger row`);
  }

  assert(ledgerByIdentity.size === expected && resultByIdentity.size === expected
    && indexByIdentity.size === expected && manifestByFile.size === expected,
  `join: expected ${expected} exact ledger/manifest/result/index rows`);

  const fresh = ledger.filter((row) => row.freshlyRejudged);
  const carried = ledger.filter((row) => !row.freshlyRejudged);
  const actions = countBy(ledger, (row) => row.action);
  const freshBands = countBy(fresh, (row) => row.band);
  const carriedBands = countBy(carried, (row) => row.band);
  const totalBands = countBy(ledger, (row) => row.band);

  return {
    expected,
    joined: ledgerByIdentity.size,
    fresh: { rows: fresh.length, bands: freshBands },
    carried: { rows: carried.length, bands: carriedBands },
    totalBands,
    actions,
    literalCertificationReady: carried.length === 0 && fresh.length === expected
      && (freshBands.get('PASS') || 0) === expected,
  };
}

function certifyLiteral100(summary) {
  assert(summary.joined === summary.expected,
    `cannot certify literal 100%: only ${summary.joined}/${summary.expected} exact joins validated`);
  assert(summary.carried.rows === 0,
    `cannot certify literal 100%: ${summary.carried.rows} carried rows are not fresh strict verdicts`);
  assert(summary.fresh.rows === summary.expected,
    `cannot certify literal 100%: expected ${summary.expected} fresh strict rows, got ${summary.fresh.rows}`);
  assert((summary.fresh.bands.get('PASS') || 0) === summary.expected,
    `cannot certify literal 100%: fresh strict bands are ${formatBandCounts(summary.fresh.bands)}, not ${summary.expected} PASS`);
}

function resolveExistingPath(rawPath, label) {
  assert(typeof rawPath === 'string' && rawPath.trim(), `${label}: path is required`);
  const resolved = path.resolve(process.cwd(), rawPath);
  assert(fs.existsSync(resolved), `${label}: does not exist: ${resolved}`);
  return resolved;
}

function isBundleDirectory(directory) {
  return fs.existsSync(path.join(directory, 'engine_data'))
    && fs.existsSync(path.join(directory, 'source_reference'));
}

function resolveExtractedBundleDirectory(input) {
  if (isBundleDirectory(input)) return input;
  const candidates = fs.readdirSync(input, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(input, entry.name))
    .filter(isBundleDirectory);
  assert(candidates.length === 1,
    `--input directory: expected one extracted GP7 bundle with engine_data/ and source_reference/, found ${candidates.length}`);
  return candidates[0];
}

function requireFile(file, label) {
  assert(fs.existsSync(file) && fs.statSync(file).isFile(), `${label}: expected file ${file}`);
  return file;
}

function loadBundle(options) {
  const input = resolveExistingPath(options.input, '--input');
  const stat = fs.statSync(input);
  let ledgerFile;
  let manifestFile;
  let resultsFile;
  let indexFile;

  if (stat.isDirectory()) {
    assert(!options.manifest && !options.results && !options.index,
      'directory --input already defines companion files; do not also pass --manifest, --results, or --index');
    const directory = resolveExtractedBundleDirectory(input);
    const jsonLedger = path.join(directory, 'engine_data', '01_all_1250_one_by_one_spec_conformity.json');
    const csvLedger = path.join(directory, 'engine_data', '01_all_1250_one_by_one_spec_conformity.csv');
    ledgerFile = fs.existsSync(jsonLedger) ? jsonLedger : requireFile(csvLedger, 'ledger');
    manifestFile = requireFile(path.join(directory, 'source_reference', 'manifest.json'), 'manifest');
    resultsFile = requireFile(path.join(directory, 'source_reference', 'goldpass7-results.json'), 'results');
    indexFile = requireFile(path.join(directory, 'source_reference', 'catalogue-review-index.json'), 'catalogue index');
  } else {
    assert(stat.isFile(), `--input: expected a file or directory, got ${input}`);
    assert(options.manifest && options.results && options.index,
      'file --input requires explicit --manifest, --results, and --index paths');
    ledgerFile = input;
    manifestFile = resolveExistingPath(options.manifest, '--manifest');
    resultsFile = resolveExistingPath(options.results, '--results');
    indexFile = resolveExistingPath(options.index, '--index');
  }

  return {
    ledgerRows: readLedger(ledgerFile),
    manifest: readJson(manifestFile, 'manifest'),
    results: readJson(resultsFile, 'results'),
    index: readJson(indexFile, 'catalogue index'),
    sources: { ledgerFile, manifestFile, resultsFile, indexFile },
  };
}

function printSummary(summary, sources) {
  console.log('GP7 CONFORMITY AUDIT PASS');
  console.log(`  exact joins: ${summary.joined}/${summary.expected} ledger · manifest · results · index`);
  console.log(`  fresh strict: ${summary.fresh.rows} (${formatBandCounts(summary.fresh.bands)})`);
  console.log(`  carried:      ${summary.carried.rows} (${formatBandCounts(summary.carried.bands)})`);
  console.log(`  work queue: FIX_TO_PASS ${summary.actions.get('FIX_TO_PASS') || 0} · `
    + `POLISH_TO_PASS ${summary.actions.get('POLISH_TO_PASS') || 0} · FREEZE ${summary.actions.get('FREEZE') || 0} · `
    + `REVALIDATE_FIX ${summary.actions.get('REVALIDATE_STRICT_THEN_FIX_IF_CONFIRMED') || 0} · `
    + `REVALIDATE_POLISH ${summary.actions.get('REVALIDATE_STRICT_THEN_POLISH_IF_CONFIRMED') || 0} · `
    + `REVALIDATE_FREEZE ${summary.actions.get('REVALIDATE_STRICT_THEN_FREEZE') || 0}`);
  console.log(`  ledger bands (mixed-ruler queue): ${formatBandCounts(summary.totalBands)}`);
  if (summary.literalCertificationReady) {
    console.log('  literal 100% certification: READY — all 1,250 rows are fresh strict PASS');
  } else {
    console.log('  literal 100% certification: BLOCKED — revalidate carried rows and close every fresh non-PASS');
  }
  console.log(`  input: ${displayPath(sources.ledgerFile)}`);
}

function parseArgs(args) {
  const options = { input: null, manifest: null, results: null, index: null, certify: false, selftest: false };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--certify') {
      assert(!options.certify, 'duplicate --certify');
      options.certify = true;
    } else if (argument === '--selftest') {
      assert(!options.selftest, 'duplicate --selftest');
      options.selftest = true;
    } else if (argument === '--help' || argument === '-h') {
      return { help: true };
    } else if (['--input', '--manifest', '--results', '--index'].includes(argument)) {
      const property = argument.slice(2);
      assert(index + 1 < args.length, `${argument}: path is required`);
      assert(!options[property], `duplicate ${argument}`);
      options[property] = args[++index];
    } else {
      fail(`unknown argument: ${argument}`);
    }
  }
  if (options.selftest) {
    assert(!options.input && !options.manifest && !options.results && !options.index && !options.certify,
      '--selftest cannot be combined with other arguments');
  } else {
    assert(options.input, '--input is required (use --help for usage)');
  }
  return options;
}

function usage() {
  console.log('Usage:');
  console.log('  node tools/gp7conformity.mjs --input <extracted-package-directory> [--certify]');
  console.log('  node tools/gp7conformity.mjs --input <ledger.json|ledger.csv> --manifest <manifest.json>');
  console.log('    --results <goldpass7-results.json> --index <catalogue-review-index.json> [--certify]');
  console.log('  node tools/gp7conformity.mjs --selftest');
}

function sha(number) {
  return number.toString(16).padStart(64, '0');
}

function csvEscape(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function fixture({ allFreshPass = false } = {}) {
  const states = allFreshPass
    ? [ ['Alpha', true, 'PASS'], ['Beta', true, 'PASS'], ['Gamma', true, 'PASS'] ]
    : [ ['Alpha', true, 'FAIL'], ['Beta', false, 'POLISH'], ['Gamma', true, 'PASS'] ];
  const ledgerRows = states.map(([species, freshlyRejudged, band], index) => ({
    set: 'fixture',
    species,
    image_file: `fixture/${species}.png`,
    sha256: sha(index + 1),
    current_recorded_band: band,
    freshly_rejudged: freshlyRejudged,
    source_ruler: freshlyRejudged ? FRESH_RULER : CARRIED_RULER,
    action_to_100_percent: ACTION_BY_STATE[freshlyRejudged ? 'fresh' : 'carried'][band],
  }));
  return {
    ledgerRows,
    manifest: {
      portraits: ledgerRows.length,
      files: ledgerRows.map((row) => ({ set: row.set, file: row.image_file, sha256: row.sha256 })),
    },
    results: {
      rows: ledgerRows.map((row) => ({
        set: row.set, species: row.species, band: row.current_recorded_band, rejudged: row.freshly_rejudged,
      })),
    },
    index: [ {
      family: 'Fixture family',
      species: ledgerRows.map((row) => ({ name: row.species, set: row.set })),
    } ],
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
  const fixtureSets = { fixture: 3 };
  const mixed = fixture();
  const mixedSummary = auditBundle(mixed, fixtureSets);
  assert(mixedSummary.joined === 3, 'SELFTEST positive: expected three exact joins');
  assert(mixedSummary.fresh.rows === 2 && mixedSummary.carried.rows === 1,
    'SELFTEST positive: fresh/carried distinction was wrong');
  assert((mixedSummary.actions.get('FIX_TO_PASS') || 0) === 1
    && (mixedSummary.actions.get('REVALIDATE_STRICT_THEN_POLISH_IF_CONFIRMED') || 0) === 1,
  'SELFTEST positive: actionable counts were wrong');

  expectRejected('duplicate ledger identity', () => {
    const broken = clone(mixed);
    broken.ledgerRows[1].species = 'Alpha';
    auditBundle(broken, fixtureSets);
  }, /duplicate identity/);

  expectRejected('manifest SHA mismatch', () => {
    const broken = clone(mixed);
    broken.manifest.files[0].sha256 = sha(99);
    auditBundle(broken, fixtureSets);
  }, /SHA-256 differs/);

  expectRejected('wrong fresh source ruler', () => {
    const broken = clone(mixed);
    broken.ledgerRows[0].source_ruler = CARRIED_RULER;
    auditBundle(broken, fixtureSets);
  }, /fresh strict row must be/);

  expectRejected('mixed ledger cannot certify', () => certifyLiteral100(mixedSummary),
    /carried rows are not fresh strict verdicts/);

  const allFresh = auditBundle(fixture({ allFreshPass: true }), fixtureSets);
  certifyLiteral100(allFresh);
  assert(allFresh.literalCertificationReady, 'SELFTEST all-fresh PASS fixture did not certify');

  const csvRows = mixed.ledgerRows.map((row, index) => ({
    ...row,
    verify_why: index === 0 ? 'comma, escaped "quote", and a\r\nsecond line' : '',
  }));
  const csvHeaders = Object.keys(csvRows[0]);
  const csv = [
    csvHeaders.join(','),
    ...csvRows.map((row) => csvHeaders.map((header) => csvEscape(row[header])).join(',')),
  ].join('\r\n') + '\r\n';
  const parsedCsv = parseCsv(csv, 'SELFTEST CSV');
  assert(parsedCsv[0].verify_why === csvRows[0].verify_why,
    'SELFTEST CSV: quoted comma/quote/multiline field changed during parsing');
  const csvSummary = auditBundle({ ...mixed, ledgerRows: parsedCsv }, fixtureSets);
  assert(csvSummary.joined === 3, 'SELFTEST CSV fixture did not rejoin');
  expectRejected('unterminated CSV quote', () => parseCsv('a,b\r\n"unterminated,x', 'SELFTEST broken CSV'),
    /unterminated quoted field/);

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-gp7conformity-'));
  try {
    const engine = path.join(temporary, 'engine_data');
    const reference = path.join(temporary, 'source_reference');
    fs.mkdirSync(engine); fs.mkdirSync(reference);
    fs.writeFileSync(path.join(engine, '01_all_1250_one_by_one_spec_conformity.json'), JSON.stringify(mixed.ledgerRows));
    fs.writeFileSync(path.join(reference, 'manifest.json'), JSON.stringify(mixed.manifest));
    fs.writeFileSync(path.join(reference, 'goldpass7-results.json'), JSON.stringify(mixed.results));
    fs.writeFileSync(path.join(reference, 'catalogue-review-index.json'), JSON.stringify(mixed.index));
    const loaded = loadBundle({ input: temporary, manifest: null, results: null, index: null });
    assert(loaded.ledgerRows.length === 3 && loaded.manifest.files.length === 3,
      'SELFTEST extracted-directory loader did not read the fixture');
    const csvFile = path.join(temporary, 'fixture-ledger.csv');
    fs.writeFileSync(csvFile, csv);
    const directCsv = loadBundle({
      input: csvFile,
      manifest: path.join(reference, 'manifest.json'),
      results: path.join(reference, 'goldpass7-results.json'),
      index: path.join(reference, 'catalogue-review-index.json'),
    });
    assert(auditBundle(directCsv, fixtureSets).joined === 3,
      'SELFTEST direct CSV loader did not rejoin the fixture');
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }

  console.log('GP7 CONFORMITY SELFTEST PASS');
  console.log('  positive exact joins + actionable counts: PASS');
  console.log('  duplicate identity: rejected');
  console.log('  manifest SHA mismatch: rejected');
  console.log('  ruler/freshness mismatch: rejected');
  console.log('  mixed ledger literal certification: rejected');
  console.log('  all-fresh strict PASS literal certification: PASS');
  console.log('  CSV quoted parsing + malformed CSV control: PASS');
  console.log('  extracted-directory JSON + direct CSV loaders: PASS');
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
  const bundle = loadBundle(options);
  const summary = auditBundle(bundle);
  /* Print actionable counts before the optional certification gate throws, so
     a blocked certification still gives the reviewer its exact next queue. */
  printSummary(summary, bundle.sources);
  if (options.certify) {
    certifyLiteral100(summary);
    console.log('  --certify: PASS');
  }
}

try {
  run();
} catch (error) {
  console.error('GP7 CONFORMITY AUDIT FAILED');
  console.error(`  ${error.message}`);
  process.exitCode = 1;
}
