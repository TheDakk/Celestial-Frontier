/* gp7package.mjs — verify and package the complete current catalogue review.

   Prerequisites:
     node tools/speciesexport.mjs
     node tools/rejudgecards.mjs --drift=reference/goldpass3-prechassis.json \
       --out=catalogue-review --full

   The package contains all 1,250 native 440x440 portraits, family-grouped
   contact sheets/packets, a SHA-256 manifest, and the GP7/Nick review record.
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const smoke = path.join(root, 'apps', 'game', 'smoke');
const portraits = path.join(smoke, 'species-fullsize');
const contacts = path.join(smoke, 'catalogue-review');
const info = path.join(portraits, 'review-info');
const zip = path.join(smoke, 'Celestial_Frontier_GP7_Complete_Catalogue_Review_2026-08-09.zip');
const EXPECTED = Object.freeze({
  'earth-fauna': 631,
  'earth-flora': 332,
  'earth-fungi': 27,
  'earth-microbe': 20,
  procedural: 240,
});

function fail(message) { throw new Error(message); }
function portable(file) { return file.split(path.sep).join('/'); }
function portraitFilename(name) {
  return name.replace(/[^A-Za-z0-9 _\-·’']/g, '').replace(/\s+/g, '_').slice(0, 60) + '.png';
}
function pngDimensions(buffer, file) {
  if (buffer.length < 24 || buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    fail(`${file}: not a PNG`);
  }
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function collectPortraits(directory, expectedSets, expectedTotal) {
  const collected = [];
  for (const [set, expected] of Object.entries(expectedSets)) {
    const dir = path.join(directory, set);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) fail(`missing portrait set ${set}`);
    const files = fs.readdirSync(dir).filter((name) => name.toLowerCase().endsWith('.png')).sort();
    if (files.length !== expected) fail(`${set}: expected ${expected} PNGs, got ${files.length}`);
    for (const name of files) {
      const file = path.join(dir, name);
      const buffer = fs.readFileSync(file);
      const [width, height] = pngDimensions(buffer, portable(path.relative(directory, file)));
      if (width !== 440 || height !== 440) fail(`${set}/${name}: expected 440x440, got ${width}x${height}`);
      collected.push({
        set,
        file: portable(path.join(set, name)),
        bytes: buffer.length,
        width,
        height,
        sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
      });
    }
  }
  if (collected.length !== expectedTotal) {
    fail(`catalogue: expected ${expectedTotal} PNGs, got ${collected.length}`);
  }
  return collected;
}

function contactRows(index, expectedSets, expectedTotal) {
  if (!Array.isArray(index)) fail('catalogue-review/index.json must be an array');
  const rows = index.flatMap((packet) => packet.species || []);
  const names = rows.map((row) => row.name);
  if (names.length !== expectedTotal || new Set(names).size !== expectedTotal) {
    fail(`contact-sheet coverage must be ${expectedTotal} unique names; got ${names.length}/${new Set(names).size}`);
  }
  const counts = Object.fromEntries(Object.keys(expectedSets).map((set) => [set, 0]));
  const files = new Set();
  for (const [offset, row] of rows.entries()) {
    if (!row || typeof row.name !== 'string' || !row.name || !(row.set in counts)) {
      fail(`contact-sheet row ${offset + 1} has an invalid name/set`);
    }
    counts[row.set]++;
    const file = portable(path.join(row.set, portraitFilename(row.name)));
    if (files.has(file)) fail(`contact-sheet portrait filename collision: ${file}`);
    files.add(file);
  }
  for (const [set, expected] of Object.entries(expectedSets)) {
    if (counts[set] !== expected) fail(`contact-sheet ${set}: expected ${expected} rows, got ${counts[set]}`);
  }
  return { rows, files };
}

function expectRejected(label, fn, pattern) {
  let error = null;
  try { fn(); } catch (caught) { error = caught; }
  if (!error) fail(`SELFTEST ${label}: injected failure was accepted`);
  if (!pattern.test(error.message)) fail(`SELFTEST ${label}: wrong rejection: ${error.message}`);
}

function runSelftest() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-gp7package-'));
  try {
    const setDir = path.join(temp, 'fixture');
    fs.mkdirSync(setDir);
    const png = Buffer.alloc(24);
    Buffer.from('89504e470d0a1a0a', 'hex').copy(png);
    png.writeUInt32BE(440, 16); png.writeUInt32BE(440, 20);
    const file = path.join(setDir, 'one.png');
    fs.writeFileSync(file, png);
    if (collectPortraits(temp, { fixture: 1 }, 1).length !== 1) fail('SELFTEST positive fixture failed');

    const wrongSize = Buffer.from(png); wrongSize.writeUInt32BE(439, 16);
    fs.writeFileSync(file, wrongSize);
    expectRejected('wrong dimensions', () => collectPortraits(temp, { fixture: 1 }, 1), /expected 440x440/);
    fs.writeFileSync(file, png);
    expectRejected('missing portrait', () => collectPortraits(temp, { fixture: 2 }, 2), /expected 2 PNGs/);

    contactRows([{ species: [{ name: 'A', set: 'fixture' }, { name: 'B', set: 'fixture' }] }],
      { fixture: 2 }, 2);
    expectRejected('duplicate contact identity',
      () => contactRows([{ species: [{ name: 'A', set: 'fixture' }, { name: 'A', set: 'fixture' }] }],
        { fixture: 2 }, 2), /2 unique names/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  console.log('GP7 PACKAGE SELFTEST PASS');
  console.log('  valid portrait/header + contact coverage: PASS');
  console.log('  wrong dimensions: rejected');
  console.log('  missing portrait: rejected');
  console.log('  duplicate contact identity: rejected');
}

if (process.argv.includes('--selftest')) {
  runSelftest();
  process.exit(0);
}

if (!fs.existsSync(portraits)) fail('missing species-fullsize export; run node tools/speciesexport.mjs');
if (!fs.existsSync(path.join(contacts, 'index.json'))) {
  fail('missing catalogue-review contact sheets; run rejudgecards with --full');
}

const rows = collectPortraits(portraits, EXPECTED, 1250);

const contactIndex = JSON.parse(fs.readFileSync(path.join(contacts, 'index.json'), 'utf8'));
const contactsCovered = contactRows(contactIndex, EXPECTED, 1250);
const portraitFiles = new Set(rows.map((row) => row.file));
for (const file of contactsCovered.files) {
  if (!portraitFiles.has(file)) fail(`contact-sheet identity has no matching exported portrait: ${file}`);
}
for (const packet of contactIndex) {
  if (!fs.existsSync(packet.strip) || !fs.existsSync(packet.packet)) {
    fail(`contact packet is incomplete: ${packet.family} ${packet.id}`);
  }
}

fs.mkdirSync(info, { recursive: true });
const manifest = {
  generated: '2026-08-09 GP7 complete catalogue review package',
  portraits: rows.length,
  dimensions: '440x440 native PNG',
  sets: EXPECTED,
  contactSheets: contactIndex.length,
  files: rows,
};
fs.writeFileSync(path.join(info, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');

const notes = [
  '# Celestial Frontier — GP7 Complete Catalogue Review',
  '',
  'This archive contains every current catalogue portrait at the engine\'s native 440x440 PNG size:',
  '',
  '- earth-fauna: 631',
  '- earth-flora: 332',
  '- earth-fungi: 27',
  '- earth-microbe: 20',
  '- procedural: 240',
  '- total: 1,250',
  '',
  '`catalogue-review/` groups the same current pixels into labelled family contact sheets with review packets.',
  '`review-info/manifest.json` records dimensions, byte sizes, and SHA-256 for every portrait.',
  '',
  'GP7 interpretation: unchanged pixels carry their prior one-by-one verdict; changed pixels were rejudged with a family-matched unchanged control. The control judge was materially harsher, so use the control-corrected rates and per-asset reasons rather than treating mixed-ruler band totals as a catalogue score.',
  '',
].join('\n');
fs.writeFileSync(path.join(info, 'README.md'), notes);

const reviewFiles = [
  'goldpass7-results.json',
  'goldpass7-rejudge.json',
  'goldpass7-control.json',
  'NICK_GOLD_AUDIT_2026-08-08.md',
  'NICK_PATCH_REVIEW_2026-08-08.md',
  'GOLD_PASS_7.md',
];
for (const name of reviewFiles) {
  const source = path.join(root, 'reference', name);
  if (!fs.existsSync(source)) fail(`missing required review record: reference/${name}`);
  fs.copyFileSync(source, path.join(info, name));
}

const include = [...Object.keys(EXPECTED).map((set) => path.join(portraits, set)), info, contacts];
const quoted = include.map((file) => `'${file.replaceAll("'", "''")}'`).join(',');
const quotedZip = `'${zip.replaceAll("'", "''")}'`;
execFileSync('powershell.exe', ['-NoProfile', '-Command',
  `Compress-Archive -LiteralPath @(${quoted}) -DestinationPath ${quotedZip} -Force`],
{ stdio: 'inherit' });
if (!fs.existsSync(zip) || fs.statSync(zip).size < 1024) fail('master ZIP was not created');

console.log('GP7 PACKAGE PASS');
console.log(`  portraits: ${rows.length} (all 440x440, SHA-256 manifest written)`);
console.log(`  contact sheets: ${contactIndex.length} (${contactsCovered.rows.length} unique covered names)`);
console.log(`  zip: ${zip} (${(fs.statSync(zip).size / 1e6).toFixed(1)} MB)`);
