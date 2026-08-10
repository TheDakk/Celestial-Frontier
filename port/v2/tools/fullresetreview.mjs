/* fullresetreview.mjs - hash-bound comparison and fresh verdict workflow for
   the full 1,250-portrait catalogue reset.

   This is intentionally separate from every GP7/GP7.1 ledger and comparator.
   It consumes a freshly prepared fullresetlayout index, joins two explicit
   portrait-evidence roots by exact (set, species), renders old/current sheets,
   creates blank verdict packets, collects only fresh strict verdicts, and will
   issue the literal certification only when all current rows are PASS.

   Usage:
     node tools/fullresetreview.mjs --compare --layout=<layout-dir> \
       --old=<old-evidence> --current=<current-evidence> --out=<new-dir> \
       --source-commit=<40-hex>
     node tools/fullresetreview.mjs --template --comparison=<comparison-dir> \
       --out=<new-dir> --review-date=YYYY-MM-DD --source-commit=<40-hex>
     node tools/fullresetreview.mjs --collect --comparison=<comparison-dir> \
       --verdicts=<filled-template-dir> --out=<new-dir> \
       --review-date=YYYY-MM-DD --source-commit=<40-hex>
     node tools/fullresetreview.mjs --certify --comparison=<comparison-dir> \
       --verdicts=<filled-template-dir> --results=<collection-dir> \
       --out=<new-dir> --review-date=YYYY-MM-DD --source-commit=<40-hex>
     node tools/fullresetreview.mjs --selftest
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_SETS,
  EXPECTED_PACKET_COUNT,
  INDEX_SCHEMA,
  NATIVE_SIZE,
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
  readJson,
  realDirectory,
  rowKey,
  sha256,
  sourceFile,
  validateMustReadContract,
  writeExclusive,
  writeJsonExclusive,
} from './fullresetlayout.mjs';

const COMPARISON_SCHEMA = 'cf.full-reset.comparison-index.v2';
const TEMPLATE_MANIFEST_SCHEMA = 'cf.full-reset.verdict-template-manifest.v2';
const VERDICT_SCHEMA = 'cf.full-reset.fresh-verdict.v2';
const RESULTS_SCHEMA = 'cf.full-reset.fresh-results.v2';
const CERTIFICATION_SCHEMA = 'cf.full-reset.literal-certification.v2';
const GAMEPLAY_SIZE = 300;
const ACTUAL_THUMB_SIZE = 132;
const RULER = 'CF full-reset fresh anatomical review ruler v1';
const ATTESTATION = 'I reviewed every row fresh at native 440px, at unlabelled 300px gameplay scale, at the unlabelled 132px actual-thumb scale, in the labelled old/current comparison, and against its exact set/species mustRead contract.';
const BAND_ORDER = Object.freeze(['PASS', 'POLISH', 'FAIL']);
const STATUS_FAMILY = /^(?:PASS(?:_WITH_POLISH)?|POLISH|HOLD|FAIL|BLOCKER|TRUE|FALSE|HIGH|LOW|MEDIUM|N\/?A|NONE|UNKNOWN|\d+)$/i;
const REVIEWED_BATS = Object.freeze(['Bat', 'Fruit Bat', 'Vampire Bat', 'Insect-Eating Bat']);

function fail(message) { throw new Error(message); }
function expectedTotal(expectedSets) {
  return Object.values(expectedSets).reduce((sum, count) => sum + count, 0);
}
function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort(cmp).map((key) => [key, stableValue(value[key])]));
}
function stableJson(value) { return JSON.stringify(stableValue(value)); }
function exactKeys(value, expected, where) {
  assert(isObject(value), `${where}: must be an object`);
  const actual = Object.keys(value).sort(cmp);
  const wanted = [...expected].sort(cmp);
  assert(JSON.stringify(actual) === JSON.stringify(wanted),
    `${where}: keys must be exactly ${wanted.join(', ')}; got ${actual.join(', ')}`);
}
function hex(value, length, where) {
  const text = nonempty(value, where).toLowerCase();
  assert(new RegExp(`^[0-9a-f]{${length}}$`).test(text), `${where}: expected ${length} lowercase hex characters`);
  assert(value === text, `${where}: hex must be lowercase`);
  return text;
}
function positiveInteger(value, where) {
  assert(Number.isInteger(value) && value > 0, `${where}: must be a positive integer`);
  return value;
}
function familyLabel(value, where) {
  const family = nonempty(value, where);
  assert(family.length <= 160, `${where}: family is implausibly long`);
  assert(!STATUS_FAMILY.test(family), `${where}: status/value ${JSON.stringify(family)} is not a family`);
  return family;
}
function reviewDate(value, where = '--review-date') {
  const text = nonempty(value, where);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(text), `${where}: use exact YYYY-MM-DD`);
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  assert(date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day,
    `${where}: invalid calendar date`);
  return text;
}
function sourceCommit(value, where = '--source-commit') { return hex(value, 40, where); }
function safeRelativeFile(value, prefix, extension, where) {
  const relative = nonempty(value, where);
  assert(!relative.includes('\\'), `${where}: use portable forward slashes`);
  assert(!path.posix.isAbsolute(relative), `${where}: absolute paths are forbidden`);
  assert(path.posix.normalize(relative) === relative && !relative.split('/').includes('..'),
    `${where}: path traversal is forbidden`);
  assert(relative.startsWith(`${prefix}/`), `${where}: must stay inside ${prefix}/`);
  assert(relative.toLowerCase().endsWith(extension.toLowerCase()), `${where}: expected ${extension}`);
  return relative;
}
function exactSetCounts(value, expectedSets, where) {
  exactKeys(value, Object.keys(expectedSets), where);
  for (const [set, expected] of Object.entries(expectedSets)) {
    assert(value[set] === expected, `${where}.${set}: expected ${expected}, got ${JSON.stringify(value[set])}`);
  }
  return value;
}
function evidenceIdentityDigest(rows) {
  return sha256(rows.slice().sort((a, b) => cmp(rowKey(a.set, a.species), rowKey(b.set, b.species)))
    .map((row) => `${row.set}\u0000${row.species}\u0000${row.image_file}\u0000${row.sha256}\u0000${row.bytes}\n`).join(''));
}
function packetRowsDigest(rows, side) {
  return sha256(rows.map((row) => {
    const item = row[side];
    return `${row.set}\u0000${row.species}\u0000${item.sha256}\n`;
  }).join(''));
}
function packetReviewAssetDigest(rows, asset) {
  return sha256(rows.map((row) =>
    `${row.set}\u0000${row.species}\u0000${row.review_assets[asset].sha256}\n`).join(''));
}
function packetMustReadDigest(rows) {
  return sha256(rows.map((row) =>
    `${row.set}\u0000${row.species}\u0000${row.must_read_contract.sha256}\n`).join(''));
}
function catalogueDigest(rows) {
  return sha256(rows.map((row) =>
    `${row.ordinal}\u0000${row.set}\u0000${row.species}\u0000${row.family}\u0000${row.current.image_file}\u0000${row.current.sha256}\u0000${row.procedural_plan_sha256 ?? ''}\u0000${row.must_read_contract.sha256}\n`).join(''));
}
function safeSlug(value) {
  const stem = value.normalize('NFKD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'family';
  return `${stem.slice(0, 56)}-${sha256(value).slice(0, 8)}`;
}
function deepClone(value) { return JSON.parse(JSON.stringify(value)); }

function validateNewOutput(outValue, sources, label = 'output') {
  const out = path.resolve(nonempty(outValue, `--out (${label})`));
  assert(!fs.existsSync(out), `${label} already exists: ${displayPath(out)}`);
  const parent = realDirectory(path.dirname(out), `${label} parent`);
  assert(normalizedPath(parent) === normalizedPath(path.dirname(out)), `${label} parent resolves through a link`);
  assert(path.basename(out).trim() && !['.', '..'].includes(path.basename(out)), `${label} must name a child directory`);
  for (const sourceValue of sources) {
    const source = path.resolve(sourceValue);
    assert(normalizedPath(out) !== normalizedPath(source)
      && !isWithin(out, source)
      && !isWithin(source, out),
    `${label} must not overlap source ${displayPath(source)}`);
  }
  return out;
}

async function atomicDirectory(out, writer, beforeCommit = null) {
  const stage = fs.mkdtempSync(path.join(path.dirname(out), `.${path.basename(out)}.stage-`));
  try {
    await writer(stage);
    if (beforeCommit) await beforeCommit();
    assert(!fs.existsSync(out), `output appeared while preparing: ${displayPath(out)}`);
    fs.renameSync(stage, out);
  } catch (error) {
    if (fs.existsSync(stage)) fs.rmSync(stage, { recursive: true, force: true });
    throw error;
  }
}

function realChildFile(parent, relative, where) {
  const file = path.resolve(parent, ...relative.split('/'));
  assert(isWithin(file, parent) && normalizedPath(file) !== normalizedPath(parent), `${where}: escaped its root`);
  return sourceFile(file, where);
}

function assertExactFiles(directory, expectedRelativeFiles, where) {
  const actual = [];
  function visit(current, relative) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const nextRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const next = path.join(current, entry.name);
      assert(!entry.isSymbolicLink(), `${where}: links are forbidden (${nextRelative})`);
      if (entry.isDirectory()) visit(next, nextRelative);
      else {
        assert(entry.isFile(), `${where}: unsupported directory entry ${nextRelative}`);
        sourceFile(next, `${where} ${nextRelative}`);
        actual.push(nextRelative);
      }
    }
  }
  visit(directory, '');
  const expected = [...expectedRelativeFiles].sort(cmp);
  actual.sort(cmp);
  assert(JSON.stringify(actual) === JSON.stringify(expected),
    `${where}: files do not exactly match the manifest (expected ${expected.length}, got ${actual.length})`);
}

function layoutSourceRevision(raw, expectedCommit, where) {
  exactKeys(raw, ['repository_root', 'commit', 'worktree_clean_for_capture', 'capture_scope', 'changed_paths'], where);
  nonempty(raw.repository_root, `${where}.repository_root`);
  const commit = sourceCommit(raw.commit, `${where}.commit`);
  assert(commit === expectedCommit, `${where}.commit: expected ${expectedCommit}, got ${commit}`);
  assert(raw.worktree_clean_for_capture === true, `${where}: committed-source capture was not clean`);
  assert(JSON.stringify(raw.capture_scope) === JSON.stringify(['.']),
    `${where}.capture_scope: must be exactly ["."] for the entire repository`);
  assert(Array.isArray(raw.changed_paths) && raw.changed_paths.length === 0,
    `${where}.changed_paths: clean capture must have no changes`);
  return raw;
}

function validateLayoutRow(raw, packet, ordinal, current, where) {
  const procedural = raw.set === 'procedural';
  exactKeys(raw, [
    'ordinal', 'set', 'species', 'render_name', 'family', 'family_source',
    'image_file', 'sha256', 'bytes', 'width', 'height', 'must_read_contract',
    ...(procedural ? ['procedural_plan'] : []),
  ], where);
  assert(raw.ordinal === ordinal, `${where}.ordinal: expected ${ordinal}, got ${JSON.stringify(raw.ordinal)}`);
  const set = nonempty(raw.set, `${where}.set`);
  const species = nonempty(raw.species, `${where}.species`);
  assert(set === packet.set, `${where}: row set differs from packet set`);
  assert(familyLabel(raw.family, `${where}.family`) === packet.family, `${where}: row family differs from packet family`);
  nonempty(raw.render_name, `${where}.render_name`);
  nonempty(raw.family_source, `${where}.family_source`);
  const evidence = current.byKey.get(rowKey(set, species));
  assert(evidence, `${where}: identity absent from current evidence (${set}/${species})`);
  assert(raw.image_file === evidence.imageFile, `${where}: image_file differs from current evidence`);
  assert(hex(raw.sha256, 64, `${where}.sha256`) === evidence.sha256, `${where}: SHA-256 differs from current evidence`);
  assert(raw.bytes === evidence.bytes, `${where}: bytes differ from current evidence`);
  assert(raw.width === evidence.width && raw.height === evidence.height, `${where}: dimensions differ from current evidence`);
  let proceduralPlanSha = null;
  if (procedural) {
    assert(isObject(raw.procedural_plan), `${where}.procedural_plan: must be an object`);
    proceduralPlanSha = hex(raw.procedural_plan.plan_sha256, 64, `${where}.procedural_plan.plan_sha256`);
  }
  const mustReadContract = validateMustReadContract(
    raw.must_read_contract, set, species, `${where}.must_read_contract`,
  );
  return {
    ordinal, set, species, render_name: raw.render_name, family: raw.family,
    image_file: raw.image_file, sha256: raw.sha256, bytes: raw.bytes,
    width: raw.width, height: raw.height, procedural_plan_sha256: proceduralPlanSha,
    must_read_contract: mustReadContract,
  };
}

function loadLayout(layoutValue, current, expectedCommit, config = {}) {
  const expectedSets = config.expectedSets ?? EXPECTED_SETS;
  const expectedPackets = config.expectedPacketCount ?? EXPECTED_PACKET_COUNT;
  const enforceOfficial = config.officialLayout ?? (config.expectedSets === undefined && config.expectedPacketCount === undefined);
  const layoutRoot = realDirectory(layoutValue, 'layout root');
  const indexFile = sourceFile(path.join(layoutRoot, 'index.json'), 'layout index');
  const raw = readJson(indexFile, 'layout index');
  exactKeys(raw, [
    'schema', 'identity_key', 'total_identities', 'sets', 'families', 'packet_size',
    'packet_count', 'catalogue_sha256', 'source_revision', 'packets',
  ], 'layout index');
  assert(raw.schema === INDEX_SCHEMA, `layout index: expected schema ${INDEX_SCHEMA}`);
  assert(JSON.stringify(raw.identity_key) === JSON.stringify(['set', 'species']),
    'layout index: identity_key must be exactly ["set", "species"]');
  const total = expectedTotal(expectedSets);
  assert(raw.total_identities === total, `layout index: expected ${total} identities, got ${raw.total_identities}`);
  exactSetCounts(raw.sets, expectedSets, 'layout index sets');
  positiveInteger(raw.families, 'layout index families');
  positiveInteger(raw.packet_size, 'layout index packet_size');
  if (enforceOfficial) {
    assert(raw.packet_size === 10, `layout index: official reset requires packet_size=10, got ${raw.packet_size}`);
    assert(raw.packet_count === EXPECTED_PACKET_COUNT,
      `layout index: official reset requires exactly ${EXPECTED_PACKET_COUNT} packets, got ${raw.packet_count}`);
  }
  assert(raw.packet_count === expectedPackets,
    `layout index: expected ${expectedPackets} packets, got ${JSON.stringify(raw.packet_count)}`);
  hex(raw.catalogue_sha256, 64, 'layout index catalogue_sha256');
  const revision = layoutSourceRevision(raw.source_revision, expectedCommit, 'layout index source_revision');
  assert(Array.isArray(raw.packets) && raw.packets.length === expectedPackets,
    `layout index: packets[] must contain exactly ${expectedPackets} packets`);

  const rows = [];
  const keys = new Set();
  const packetRows = [];
  let ordinal = 0;
  for (const [packetOffset, packetRaw] of raw.packets.entries()) {
    const where = `layout packet ${packetOffset + 1}`;
    exactKeys(packetRaw, ['packet_id', 'set', 'family', 'family_part', 'family_parts', 'rows'], where);
    const packetId = String(packetOffset + 1).padStart(3, '0');
    assert(packetRaw.packet_id === packetId, `${where}.packet_id: expected ${packetId}`);
    const set = nonempty(packetRaw.set, `${where}.set`);
    assert(Object.hasOwn(expectedSets, set), `${where}.set: unknown set ${JSON.stringify(set)}`);
    const family = familyLabel(packetRaw.family, `${where}.family`);
    positiveInteger(packetRaw.family_part, `${where}.family_part`);
    positiveInteger(packetRaw.family_parts, `${where}.family_parts`);
    assert(packetRaw.family_part <= packetRaw.family_parts, `${where}: family_part exceeds family_parts`);
    assert(Array.isArray(packetRaw.rows) && packetRaw.rows.length > 0 && packetRaw.rows.length <= raw.packet_size,
      `${where}.rows: expected 1..${raw.packet_size} rows`);
    const packet = {
      packet_id: packetId, set, family, family_part: packetRaw.family_part,
      family_parts: packetRaw.family_parts, rows: [],
    };
    for (const [rowOffset, rowRaw] of packetRaw.rows.entries()) {
      const row = validateLayoutRow(rowRaw, packet, ++ordinal, current, `${where} row ${rowOffset + 1}`);
      const key = rowKey(row.set, row.species);
      assert(!keys.has(key), `layout index: duplicate identity ${row.set}/${row.species}`);
      keys.add(key);
      packet.rows.push(row);
      rows.push(row);
    }
    packetRows.push(packet);
  }
  assert(rows.length === total, `layout index: flattened ${rows.length} identities instead of ${total}`);
  assert(keys.size === current.byKey.size, 'layout index: identity set differs from current evidence');
  for (const key of current.byKey.keys()) assert(keys.has(key), `layout index: missing current identity ${key.replace('\u0000', '/')}`);
  const counts = Object.fromEntries(Object.keys(expectedSets).map((set) => [set, 0]));
  for (const row of rows) counts[row.set]++;
  exactSetCounts(counts, expectedSets, 'layout index flattened sets');

  const familyPackets = new Map();
  for (const packet of packetRows) {
    const key = `${packet.set}\u0000${packet.family}`;
    if (!familyPackets.has(key)) familyPackets.set(key, []);
    familyPackets.get(key).push(packet);
  }
  for (const [key, packets] of familyPackets.entries()) {
    assert(packets.every((packet, index) => packet.family_part === index + 1 && packet.family_parts === packets.length),
      `layout index: inconsistent family part sequence for ${key.replace('\u0000', '/')}`);
  }
  if (REVIEWED_BATS.every((species) => current.byKey.has(rowKey('earth-fauna', species)))) {
    const bats = rows.filter((row) => row.set === 'earth-fauna' && REVIEWED_BATS.includes(row.species));
    assert(bats.length === REVIEWED_BATS.length, 'layout index: reviewed bat identities are incomplete');
    assert(bats.every((row) => row.family === 'Bats'), 'layout index: reviewed bats are not all in Bats');
    const batPackets = new Set(packetRows.filter((packet) => packet.rows.some(
      (row) => row.set === 'earth-fauna' && REVIEWED_BATS.includes(row.species),
    )).map((packet) => packet.packet_id));
    assert(batPackets.size === 1, 'layout index: reviewed bats are split across packets');
  }
  const digestRows = rows.map((row) => ({
    ...row,
    current: { image_file: row.image_file, sha256: row.sha256 },
  }));
  assert(catalogueDigest(digestRows) === raw.catalogue_sha256,
    'layout index: catalogue_sha256 does not match ordered rows');
  return {
    root: layoutRoot,
    indexFile,
    indexSha256: hashFile(indexFile),
    catalogueSha256: raw.catalogue_sha256,
    revision,
    rows,
    packets: packetRows,
    packetSize: raw.packet_size,
    counts,
  };
}

function assertExactEvidenceJoin(oldEvidence, currentEvidence) {
  assert(normalizedPath(oldEvidence.root) !== normalizedPath(currentEvidence.root),
    'old and current evidence roots must be distinct');
  assert(!isWithin(oldEvidence.root, currentEvidence.root) && !isWithin(currentEvidence.root, oldEvidence.root),
    'old and current evidence roots must not overlap');
  assert(oldEvidence.byKey.size === currentEvidence.byKey.size,
    'old/current evidence identity counts differ');
  for (const key of currentEvidence.byKey.keys()) {
    assert(oldEvidence.byKey.has(key), `old/current exact join: old evidence missing ${key.replace('\u0000', '/')}`);
  }
  for (const key of oldEvidence.byKey.keys()) {
    assert(currentEvidence.byKey.has(key), `old/current exact join: current evidence missing ${key.replace('\u0000', '/')}`);
  }
}

function evidenceSummary(evidence) {
  return {
    identity_digest: evidence.identityDigest,
    identity_manifest_sha256: evidence.identityManifestSha256,
    portrait_manifest_sha256: evidence.portraitManifestSha256,
    provenance_status: evidence.provenance.status,
    source_commit: evidence.provenance.source_commit,
  };
}

function sourceSnapshot(layout, oldEvidence, currentEvidence) {
  return stableJson({
    layout_index_sha256: hashFile(layout.indexFile),
    old: evidenceSummary(oldEvidence),
    current: evidenceSummary(currentEvidence),
  });
}

async function composeComparisonSheet(
  browser,
  packet,
  gameplaySize = GAMEPLAY_SIZE,
  actualThumbSize = ACTUAL_THUMB_SIZE,
) {
  const items = packet.rows.map((row) => ({
    ordinal: row.ordinal,
    species: row.species,
    set: row.set,
    changed: row.changed,
    oldHash: row.old.sha256.slice(0, 12),
    currentHash: row.current.sha256.slice(0, 12),
    oldUrl: `data:image/png;base64,${fs.readFileSync(row.old.file).toString('base64')}`,
    currentUrl: `data:image/png;base64,${fs.readFileSync(row.current.file).toString('base64')}`,
  }));
  const title = `${packet.set} / ${packet.family}${packet.family_parts > 1 ? ` / ${packet.family_part} of ${packet.family_parts}` : ''}`;
  const payload = JSON.stringify({ packetId: packet.packet_id, title, items, gameplaySize, actualThumbSize });
  const expression = `(()=>new Promise(async(resolve)=>{
    const data=${payload}, IMAGE=190, GAP=10, PAD=14, CELL_W=IMAGE*2+GAP*3, CELL_H=IMAGE+92, COLS=Math.min(2,data.items.length), ROWS=Math.ceil(data.items.length/COLS);
    const W=PAD+COLS*(CELL_W+PAD), H=86+ROWS*(CELL_H+PAD)+PAD;
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;
    const c=cv.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.fillStyle='#060a12';c.fillRect(0,0,W,H);c.textBaseline='middle';c.textAlign='left';
    c.fillStyle='#f2ddb0';c.font='bold 22px Georgia,serif';c.fillText('Packet '+data.packetId+' - '+data.title,PAD,25);
    c.fillStyle='#9eb2ce';c.font='13px system-ui,sans-serif';c.fillText('HASH-BOUND OLD / CURRENT ANATOMY COMPARISON',PAD,55);
    const failed=[],gameplay=[],actualThumb=[];
    function fit(text,max){if(c.measureText(text).width<=max)return text;let s=text;while(s.length>4&&c.measureText(s+'...').width>max)s=s.slice(0,-1);return s+'...';}
    function image(url,label){return new Promise(done=>{const im=new Image();im.onload=()=>done(im);im.onerror=()=>{failed.push(label);done(null)};im.src=url;});}
    function scaled(im,size){const out=document.createElement('canvas');out.width=size;out.height=size;const oc=out.getContext('2d');oc.imageSmoothingEnabled=true;oc.imageSmoothingQuality='high';oc.clearRect(0,0,size,size);oc.drawImage(im,0,0,size,size);return out.toDataURL('image/png');}
    for(let i=0;i<data.items.length;i++){
      const item=data.items[i],col=i%COLS,row=Math.floor(i/COLS),x=PAD+col*(CELL_W+PAD),y=86+row*(CELL_H+PAD);
      c.fillStyle=item.changed?'#16253b':'#111a29';c.fillRect(x,y,CELL_W,CELL_H);c.strokeStyle=item.changed?'#6797ca':'#34465e';c.lineWidth=2;c.strokeRect(x,y,CELL_W,CELL_H);
      const old=await image(item.oldUrl,item.set+'/'+item.species+' old'),cur=await image(item.currentUrl,item.set+'/'+item.species+' current');
      if(old)c.drawImage(old,x+GAP,y+GAP,IMAGE,IMAGE);if(cur){
        c.drawImage(cur,x+IMAGE+GAP*2,y+GAP,IMAGE,IMAGE);
        gameplay.push({ordinal:item.ordinal,url:scaled(cur,data.gameplaySize),width:data.gameplaySize,height:data.gameplaySize});
        actualThumb.push({ordinal:item.ordinal,url:scaled(cur,data.actualThumbSize),width:data.actualThumbSize,height:data.actualThumbSize});
      }
      c.fillStyle='#dce7f5';c.font='bold 14px system-ui,sans-serif';c.fillText('#'+item.ordinal+' '+fit(item.species,CELL_W-116),x+GAP,y+IMAGE+28);
      c.textAlign='right';c.fillStyle=item.changed?'#8fd5ff':'#91a2b8';c.fillText(item.changed?'CHANGED':'IDENTICAL',x+CELL_W-GAP,y+IMAGE+28);c.textAlign='left';
      c.fillStyle='#91a5c0';c.font='12px ui-monospace,monospace';c.fillText('OLD     '+item.oldHash,x+GAP,y+IMAGE+54);c.fillText('CURRENT '+item.currentHash,x+IMAGE+GAP*2,y+IMAGE+54);
      c.fillStyle='#7187a5';c.font='11px system-ui,sans-serif';c.fillText('OLD',x+GAP,y+8);c.fillText('CURRENT',x+IMAGE+GAP*2,y+8);
    }
    resolve({url:cv.toDataURL('image/png'),failed,width:W,height:H,gameplay,actualThumb});
  }))()`;
  const result = await browser.evaluate(expression);
  assert(isObject(result) && typeof result.url === 'string' && result.url.startsWith('data:image/png;base64,'),
    `comparison packet ${packet.packet_id}: canvas did not return a PNG`);
  assert(Array.isArray(result.failed) && result.failed.length === 0,
    `comparison packet ${packet.packet_id}: image decode failed for ${result.failed.join(', ')}`);
  const buffer = Buffer.from(result.url.slice('data:image/png;base64,'.length), 'base64');
  const dimensions = pngDimensions(buffer, `comparison packet ${packet.packet_id}`);
  assert(dimensions.width === result.width && dimensions.height === result.height,
    `comparison packet ${packet.packet_id}: PNG dimensions differ from canvas`);
  const decodeScaled = (records, label, size) => {
    assert(Array.isArray(records) && records.length === packet.rows.length,
      `comparison packet ${packet.packet_id}: ${label} render count differs from rows`);
    const decoded = new Map();
    for (const [offset, rendered] of records.entries()) {
      const expected = packet.rows[offset];
      assert(isObject(rendered) && rendered.ordinal === expected.ordinal,
        `comparison packet ${packet.packet_id}: ${label} render order differs at row ${offset + 1}`);
      assert(typeof rendered.url === 'string' && rendered.url.startsWith('data:image/png;base64,'),
        `comparison packet ${packet.packet_id}: ${label} row ${expected.ordinal} did not return a PNG`);
      const scaledBuffer = Buffer.from(rendered.url.slice('data:image/png;base64,'.length), 'base64');
      const scaledDimensions = pngDimensions(scaledBuffer,
        `comparison packet ${packet.packet_id} ${label} row ${expected.ordinal}`);
      assert(scaledDimensions.width === size && scaledDimensions.height === size
          && rendered.width === size && rendered.height === size,
      `comparison packet ${packet.packet_id}: ${label} row ${expected.ordinal} is not exact ${size}x${size}`);
      decoded.set(expected.ordinal, {
        buffer: scaledBuffer, width: scaledDimensions.width, height: scaledDimensions.height,
      });
    }
    return decoded;
  };
  return {
    buffer,
    width: dimensions.width,
    height: dimensions.height,
    gameplay: decodeScaled(result.gameplay, 'gameplay', gameplaySize),
    actualThumb: decodeScaled(result.actualThumb, 'actual-thumb', actualThumbSize),
  };
}

function comparisonRow(layoutRow, oldPortrait, currentPortrait) {
  return {
    ordinal: layoutRow.ordinal,
    set: layoutRow.set,
    species: layoutRow.species,
    family: layoutRow.family,
    render_name: layoutRow.render_name,
    procedural_plan_sha256: layoutRow.procedural_plan_sha256,
    must_read_contract: layoutRow.must_read_contract,
    old: {
      image_file: oldPortrait.imageFile,
      sha256: oldPortrait.sha256,
      bytes: oldPortrait.bytes,
      width: oldPortrait.width,
      height: oldPortrait.height,
      file: oldPortrait.file,
    },
    current: {
      image_file: currentPortrait.imageFile,
      sha256: currentPortrait.sha256,
      bytes: currentPortrait.bytes,
      width: currentPortrait.width,
      height: currentPortrait.height,
      file: currentPortrait.file,
    },
    changed: oldPortrait.sha256 !== currentPortrait.sha256,
    review_assets: null,
  };
}

function publicComparisonRow(row) {
  const publicSide = (side) => ({
    image_file: side.image_file,
    sha256: side.sha256,
    bytes: side.bytes,
    width: side.width,
    height: side.height,
  });
  return {
    ordinal: row.ordinal,
    set: row.set,
    species: row.species,
    family: row.family,
    render_name: row.render_name,
    procedural_plan_sha256: row.procedural_plan_sha256,
    must_read_contract: row.must_read_contract,
    old: publicSide(row.old),
    current: publicSide(row.current),
    review_assets: row.review_assets,
    changed: row.changed,
  };
}

function buildComparison(layout, oldEvidence, currentEvidence) {
  assertExactEvidenceJoin(oldEvidence, currentEvidence);
  const packets = [];
  for (const layoutPacket of layout.packets) {
    const rows = layoutPacket.rows.map((layoutRow) => {
      const key = rowKey(layoutRow.set, layoutRow.species);
      return comparisonRow(layoutRow, oldEvidence.byKey.get(key), currentEvidence.byKey.get(key));
    });
    packets.push({
      packet_id: layoutPacket.packet_id,
      set: layoutPacket.set,
      family: layoutPacket.family,
      family_part: layoutPacket.family_part,
      family_parts: layoutPacket.family_parts,
      rows,
      old_rows_sha256: packetRowsDigest(rows, 'old'),
      current_rows_sha256: packetRowsDigest(rows, 'current'),
    });
  }
  const rows = packets.flatMap((packet) => packet.rows);
  assert(rows.length === layout.rows.length, 'comparison: layout rows were lost');
  return { packets, rows };
}

async function writeComparisonOutput(stage, layout, comparison, oldEvidence, currentEvidence, config = {}) {
  const gameplaySize = config.gameplaySize ?? GAMEPLAY_SIZE;
  const actualThumbSize = config.actualThumbSize ?? ACTUAL_THUMB_SIZE;
  const sheetsDir = path.join(stage, 'sheets');
  fs.mkdirSync(sheetsDir);
  fs.mkdirSync(path.join(stage, 'native-440'));
  fs.mkdirSync(path.join(stage, 'gameplay-300'));
  fs.mkdirSync(path.join(stage, 'actual-thumb-132'));
  let browser = null;
  try {
    browser = await openCdp();
    const packetRecords = [];
    for (const packet of comparison.packets) {
      const sheet = await composeComparisonSheet(browser, packet, gameplaySize, actualThumbSize);
      const relative = `sheets/${packet.packet_id}-${safeSlug(`${packet.set}-${packet.family}`)}-old-current.png`;
      writeExclusive(path.join(stage, ...relative.split('/')), sheet.buffer);
      for (const row of packet.rows) {
        const nativeBuffer = fs.readFileSync(row.current.file);
        assert(sha256(nativeBuffer) === row.current.sha256 && nativeBuffer.length === row.current.bytes,
          `comparison ${row.set}/${row.species}: native current pixels changed before copy`);
        const nativeRelative = `native-440/${row.current.image_file}`;
        const nativeDisk = path.join(stage, ...nativeRelative.split('/'));
        fs.mkdirSync(path.dirname(nativeDisk), { recursive: true });
        writeExclusive(nativeDisk, nativeBuffer);
        const gameplay = sheet.gameplay.get(row.ordinal);
        assert(gameplay, `comparison ${row.set}/${row.species}: missing unlabelled gameplay render`);
        const gameplayRelative = `gameplay-300/${row.current.image_file}`;
        const gameplayDisk = path.join(stage, ...gameplayRelative.split('/'));
        fs.mkdirSync(path.dirname(gameplayDisk), { recursive: true });
        writeExclusive(gameplayDisk, gameplay.buffer);
        const actualThumb = sheet.actualThumb.get(row.ordinal);
        assert(actualThumb, `comparison ${row.set}/${row.species}: missing unlabelled actual-thumb render`);
        const actualThumbRelative = `actual-thumb-132/${row.current.image_file}`;
        const actualThumbDisk = path.join(stage, ...actualThumbRelative.split('/'));
        fs.mkdirSync(path.dirname(actualThumbDisk), { recursive: true });
        writeExclusive(actualThumbDisk, actualThumb.buffer);
        row.review_assets = {
          native_440: {
            file: nativeRelative,
            sha256: row.current.sha256,
            bytes: nativeBuffer.length,
            width: row.current.width,
            height: row.current.height,
          },
          gameplay_300_unlabelled: {
            file: gameplayRelative,
            sha256: sha256(gameplay.buffer),
            bytes: gameplay.buffer.length,
            width: gameplay.width,
            height: gameplay.height,
          },
          actual_thumb_132_unlabelled: {
            file: actualThumbRelative,
            sha256: sha256(actualThumb.buffer),
            bytes: actualThumb.buffer.length,
            width: actualThumb.width,
            height: actualThumb.height,
          },
        };
      }
      const publicRows = packet.rows.map(publicComparisonRow);
      packetRecords.push({
        packet_id: packet.packet_id,
        set: packet.set,
        family: packet.family,
        family_part: packet.family_part,
        family_parts: packet.family_parts,
        row_count: publicRows.length,
        old_rows_sha256: packet.old_rows_sha256,
        current_rows_sha256: packet.current_rows_sha256,
        native_440_rows_sha256: packetReviewAssetDigest(publicRows, 'native_440'),
        gameplay_300_rows_sha256: packetReviewAssetDigest(publicRows, 'gameplay_300_unlabelled'),
        actual_thumb_132_rows_sha256: packetReviewAssetDigest(publicRows, 'actual_thumb_132_unlabelled'),
        must_read_rows_sha256: packetMustReadDigest(publicRows),
        changed_count: publicRows.filter((row) => row.changed).length,
        sheet: {
          file: relative,
          sha256: sha256(sheet.buffer),
          bytes: sheet.buffer.length,
          width: sheet.width,
          height: sheet.height,
        },
        rows: publicRows,
      });
    }
    const changed = comparison.rows.filter((row) => row.changed).length;
    const index = {
      schema: COMPARISON_SCHEMA,
      purpose: 'Fresh old/current full-catalogue comparison; no historical verdict state is carried.',
      identity_key: ['set', 'species'],
      total_identities: comparison.rows.length,
      sets: layout.counts,
      packet_count: packetRecords.length,
      catalogue_sha256: layout.catalogueSha256,
      layout_index_sha256: layout.indexSha256,
      source_revision: layout.revision,
      old_evidence: evidenceSummary(oldEvidence),
      current_evidence: evidenceSummary(currentEvidence),
      changed_identities: changed,
      unchanged_identities: comparison.rows.length - changed,
      required_review_surfaces: {
        native_current_pixels: `${config.nativeSize ?? NATIVE_SIZE}x${config.nativeSize ?? NATIVE_SIZE}`,
        gameplay_unlabelled_pixels: `${gameplaySize}x${gameplaySize}`,
        actual_thumb_unlabelled_pixels: `${actualThumbSize}x${actualThumbSize}`,
        labelled_comparison: true,
        exact_set_species_must_read: true,
      },
      packets: packetRecords,
    };
    writeJsonExclusive(path.join(stage, 'comparison-index.json'), index);
  } finally {
    if (browser) browser.close();
  }
}

function validateComparisonSide(raw, where) {
  exactKeys(raw, ['image_file', 'sha256', 'bytes', 'width', 'height'], where);
  const imageFile = nonempty(raw.image_file, `${where}.image_file`);
  assert(!imageFile.includes('\\') && !path.posix.isAbsolute(imageFile)
    && path.posix.normalize(imageFile) === imageFile && !imageFile.split('/').includes('..'),
  `${where}.image_file: unsafe portable path`);
  const hash = hex(raw.sha256, 64, `${where}.sha256`);
  assert(Number.isInteger(raw.bytes) && raw.bytes >= 24, `${where}.bytes: invalid byte count`);
  positiveInteger(raw.width, `${where}.width`);
  positiveInteger(raw.height, `${where}.height`);
  return { image_file: imageFile, sha256: hash, bytes: raw.bytes, width: raw.width, height: raw.height };
}

function validateReviewAsset(raw, comparisonRoot, prefix, expectedSize, where) {
  exactKeys(raw, ['file', 'sha256', 'bytes', 'width', 'height'], where);
  const relative = safeRelativeFile(raw.file, prefix, '.png', `${where}.file`);
  const disk = realChildFile(comparisonRoot, relative, where);
  const buffer = fs.readFileSync(disk);
  const dimensions = pngDimensions(buffer, where);
  const hash = hex(raw.sha256, 64, `${where}.sha256`);
  assert(sha256(buffer) === hash, `${where}: disk SHA-256 differs from index`);
  assert(Number.isInteger(raw.bytes) && raw.bytes === buffer.length, `${where}: byte count differs from index`);
  assert(raw.width === expectedSize && raw.height === expectedSize,
    `${where}: expected exact ${expectedSize}x${expectedSize} record`);
  assert(dimensions.width === raw.width && dimensions.height === raw.height,
    `${where}: disk dimensions differ from index`);
  return { file: relative, disk, sha256: hash, bytes: raw.bytes, width: raw.width, height: raw.height };
}

function validateEvidenceSummary(raw, where, role, expectedCommit) {
  exactKeys(raw, [
    'identity_digest', 'identity_manifest_sha256', 'portrait_manifest_sha256',
    'provenance_status', 'source_commit',
  ], where);
  const status = nonempty(raw.provenance_status, `${where}.provenance_status`);
  if (role === 'current') {
    assert(status === 'current_provenanced', `${where}: current evidence must be current_provenanced`);
    assert(sourceCommit(raw.source_commit, `${where}.source_commit`) === expectedCommit,
      `${where}: current evidence commit does not match requested/current commit`);
  } else {
    assert(status === 'historical_unprovenanced' || status === 'historical_provenanced',
      `${where}: old evidence must be explicitly historical`);
    if (status === 'historical_unprovenanced') assert(raw.source_commit === null,
      `${where}: unprovenanced historical evidence must use null source_commit`);
    else sourceCommit(raw.source_commit, `${where}.source_commit`);
  }
  return {
    identity_digest: hex(raw.identity_digest, 64, `${where}.identity_digest`),
    identity_manifest_sha256: hex(raw.identity_manifest_sha256, 64, `${where}.identity_manifest_sha256`),
    portrait_manifest_sha256: hex(raw.portrait_manifest_sha256, 64, `${where}.portrait_manifest_sha256`),
    provenance_status: status,
    source_commit: raw.source_commit,
  };
}

function loadComparison(comparisonValue, expectedCommit, config = {}) {
  const expectedSets = config.expectedSets ?? EXPECTED_SETS;
  const expectedPackets = config.expectedPacketCount ?? EXPECTED_PACKET_COUNT;
  const nativeSize = config.nativeSize ?? NATIVE_SIZE;
  const gameplaySize = config.gameplaySize ?? GAMEPLAY_SIZE;
  const actualThumbSize = config.actualThumbSize ?? ACTUAL_THUMB_SIZE;
  const total = expectedTotal(expectedSets);
  const comparisonRoot = realDirectory(comparisonValue, 'comparison root');
  const indexFile = sourceFile(path.join(comparisonRoot, 'comparison-index.json'), 'comparison index');
  const raw = readJson(indexFile, 'comparison index');
  exactKeys(raw, [
    'schema', 'purpose', 'identity_key', 'total_identities', 'sets', 'packet_count',
    'catalogue_sha256', 'layout_index_sha256', 'source_revision', 'old_evidence',
    'current_evidence', 'changed_identities', 'unchanged_identities',
    'required_review_surfaces', 'packets',
  ], 'comparison index');
  assert(raw.schema === COMPARISON_SCHEMA, `comparison index: expected schema ${COMPARISON_SCHEMA}`);
  nonempty(raw.purpose, 'comparison index purpose');
  assert(JSON.stringify(raw.identity_key) === JSON.stringify(['set', 'species']),
    'comparison index: identity_key must be exactly ["set", "species"]');
  assert(raw.total_identities === total, `comparison index: expected ${total} identities`);
  const counts = exactSetCounts(raw.sets, expectedSets, 'comparison index sets');
  assert(raw.packet_count === expectedPackets, `comparison index: expected ${expectedPackets} packets`);
  const catalogueSha256 = hex(raw.catalogue_sha256, 64, 'comparison index catalogue_sha256');
  const layoutIndexSha256 = hex(raw.layout_index_sha256, 64, 'comparison index layout_index_sha256');
  const revision = layoutSourceRevision(raw.source_revision, expectedCommit, 'comparison index source_revision');
  const oldSummary = validateEvidenceSummary(raw.old_evidence, 'comparison index old_evidence', 'historical', expectedCommit);
  const currentSummary = validateEvidenceSummary(raw.current_evidence, 'comparison index current_evidence', 'current', expectedCommit);
  exactKeys(raw.required_review_surfaces, [
    'native_current_pixels', 'gameplay_unlabelled_pixels', 'labelled_comparison',
    'actual_thumb_unlabelled_pixels', 'exact_set_species_must_read',
  ], 'comparison index required_review_surfaces');
  assert(raw.required_review_surfaces.native_current_pixels === `${nativeSize}x${nativeSize}`,
    'comparison index: native current review size is stale');
  assert(raw.required_review_surfaces.gameplay_unlabelled_pixels === `${gameplaySize}x${gameplaySize}`,
    'comparison index: gameplay unlabelled review size is stale');
  assert(raw.required_review_surfaces.actual_thumb_unlabelled_pixels === `${actualThumbSize}x${actualThumbSize}`,
    'comparison index: actual-thumb unlabelled review size is stale');
  assert(raw.required_review_surfaces.labelled_comparison === true
      && raw.required_review_surfaces.exact_set_species_must_read === true,
  'comparison index: all four review surfaces must be required');
  assert(Number.isInteger(raw.changed_identities) && raw.changed_identities >= 0,
    'comparison index changed_identities: invalid count');
  assert(Number.isInteger(raw.unchanged_identities) && raw.unchanged_identities >= 0,
    'comparison index unchanged_identities: invalid count');
  assert(raw.changed_identities + raw.unchanged_identities === total,
    'comparison index: changed + unchanged does not equal total');
  assert(Array.isArray(raw.packets) && raw.packets.length === expectedPackets,
    'comparison index: packets[] length differs from packet_count');

  const packets = [];
  const rows = [];
  const keys = new Set();
  const sheetFiles = [];
  const assetFiles = [];
  let ordinal = 0;
  let changed = 0;
  for (const [packetOffset, packetRaw] of raw.packets.entries()) {
    const where = `comparison packet ${packetOffset + 1}`;
    exactKeys(packetRaw, [
      'packet_id', 'set', 'family', 'family_part', 'family_parts', 'row_count',
      'old_rows_sha256', 'current_rows_sha256', 'native_440_rows_sha256',
      'gameplay_300_rows_sha256', 'actual_thumb_132_rows_sha256', 'must_read_rows_sha256',
      'changed_count', 'sheet', 'rows',
    ], where);
    const packetId = String(packetOffset + 1).padStart(3, '0');
    assert(packetRaw.packet_id === packetId, `${where}.packet_id: expected ${packetId}`);
    const set = nonempty(packetRaw.set, `${where}.set`);
    assert(Object.hasOwn(expectedSets, set), `${where}.set: unknown set`);
    const family = familyLabel(packetRaw.family, `${where}.family`);
    positiveInteger(packetRaw.family_part, `${where}.family_part`);
    positiveInteger(packetRaw.family_parts, `${where}.family_parts`);
    assert(packetRaw.family_part <= packetRaw.family_parts, `${where}: family_part exceeds family_parts`);
    positiveInteger(packetRaw.row_count, `${where}.row_count`);
    const oldRowsSha256 = hex(packetRaw.old_rows_sha256, 64, `${where}.old_rows_sha256`);
    const currentRowsSha256 = hex(packetRaw.current_rows_sha256, 64, `${where}.current_rows_sha256`);
    const nativeRowsSha256 = hex(packetRaw.native_440_rows_sha256, 64, `${where}.native_440_rows_sha256`);
    const gameplayRowsSha256 = hex(packetRaw.gameplay_300_rows_sha256, 64, `${where}.gameplay_300_rows_sha256`);
    const actualThumbRowsSha256 = hex(
      packetRaw.actual_thumb_132_rows_sha256, 64, `${where}.actual_thumb_132_rows_sha256`,
    );
    const mustReadRowsSha256 = hex(packetRaw.must_read_rows_sha256, 64, `${where}.must_read_rows_sha256`);
    assert(Number.isInteger(packetRaw.changed_count) && packetRaw.changed_count >= 0,
      `${where}.changed_count: invalid count`);
    exactKeys(packetRaw.sheet, ['file', 'sha256', 'bytes', 'width', 'height'], `${where}.sheet`);
    const sheetRelative = safeRelativeFile(packetRaw.sheet.file, 'sheets', '.png', `${where}.sheet.file`);
    const sheetFile = realChildFile(comparisonRoot, sheetRelative, `${where} sheet`);
    const sheetBuffer = fs.readFileSync(sheetFile);
    const sheetDimensions = pngDimensions(sheetBuffer, `${where} sheet`);
    assert(sha256(sheetBuffer) === hex(packetRaw.sheet.sha256, 64, `${where}.sheet.sha256`),
      `${where}.sheet: disk SHA-256 differs from index`);
    assert(sheetBuffer.length === packetRaw.sheet.bytes, `${where}.sheet: byte count differs from index`);
    assert(sheetDimensions.width === packetRaw.sheet.width && sheetDimensions.height === packetRaw.sheet.height,
      `${where}.sheet: dimensions differ from index`);
    sheetFiles.push(sheetRelative);
    assert(Array.isArray(packetRaw.rows) && packetRaw.rows.length === packetRaw.row_count,
      `${where}.rows: length differs from row_count`);
    const packet = {
      packet_id: packetId, set, family, family_part: packetRaw.family_part,
      family_parts: packetRaw.family_parts, old_rows_sha256: oldRowsSha256,
      current_rows_sha256: currentRowsSha256,
      native_440_rows_sha256: nativeRowsSha256,
      gameplay_300_rows_sha256: gameplayRowsSha256,
      actual_thumb_132_rows_sha256: actualThumbRowsSha256,
      must_read_rows_sha256: mustReadRowsSha256,
      sheet: {
        file: sheetRelative, disk: sheetFile, sha256: packetRaw.sheet.sha256,
        bytes: packetRaw.sheet.bytes, width: packetRaw.sheet.width, height: packetRaw.sheet.height,
      },
      rows: [],
    };
    for (const [rowOffset, rowRaw] of packetRaw.rows.entries()) {
      const rowWhere = `${where} row ${rowOffset + 1}`;
      exactKeys(rowRaw, [
        'ordinal', 'set', 'species', 'family', 'render_name', 'procedural_plan_sha256',
        'must_read_contract', 'old', 'current', 'review_assets', 'changed',
      ], rowWhere);
      assert(rowRaw.ordinal === ++ordinal, `${rowWhere}.ordinal: expected ${ordinal}`);
      const rowSet = nonempty(rowRaw.set, `${rowWhere}.set`);
      const species = nonempty(rowRaw.species, `${rowWhere}.species`);
      assert(rowSet === set, `${rowWhere}: set differs from packet`);
      assert(familyLabel(rowRaw.family, `${rowWhere}.family`) === family, `${rowWhere}: family differs from packet`);
      nonempty(rowRaw.render_name, `${rowWhere}.render_name`);
      let proceduralPlanSha256 = null;
      if (rowSet === 'procedural') proceduralPlanSha256 = hex(rowRaw.procedural_plan_sha256, 64, `${rowWhere}.procedural_plan_sha256`);
      else assert(rowRaw.procedural_plan_sha256 === null, `${rowWhere}.procedural_plan_sha256: non-procedural row must use null`);
      const oldSide = validateComparisonSide(rowRaw.old, `${rowWhere}.old`);
      const currentSide = validateComparisonSide(rowRaw.current, `${rowWhere}.current`);
      const mustReadContract = validateMustReadContract(
        rowRaw.must_read_contract, rowSet, species, `${rowWhere}.must_read_contract`,
      );
      exactKeys(rowRaw.review_assets, [
        'native_440', 'gameplay_300_unlabelled', 'actual_thumb_132_unlabelled',
      ], `${rowWhere}.review_assets`);
      const nativeAsset = validateReviewAsset(
        rowRaw.review_assets.native_440, comparisonRoot, 'native-440', nativeSize,
        `${rowWhere}.review_assets.native_440`,
      );
      const gameplayAsset = validateReviewAsset(
        rowRaw.review_assets.gameplay_300_unlabelled, comparisonRoot, 'gameplay-300', gameplaySize,
        `${rowWhere}.review_assets.gameplay_300_unlabelled`,
      );
      const actualThumbAsset = validateReviewAsset(
        rowRaw.review_assets.actual_thumb_132_unlabelled, comparisonRoot, 'actual-thumb-132', actualThumbSize,
        `${rowWhere}.review_assets.actual_thumb_132_unlabelled`,
      );
      assert(nativeAsset.file === `native-440/${currentSide.image_file}`,
        `${rowWhere}: native asset path is not derived from current portrait identity`);
      assert(gameplayAsset.file === `gameplay-300/${currentSide.image_file}`,
        `${rowWhere}: gameplay asset path is not derived from current portrait identity`);
      assert(actualThumbAsset.file === `actual-thumb-132/${currentSide.image_file}`,
        `${rowWhere}: actual-thumb asset path is not derived from current portrait identity`);
      assert(nativeAsset.sha256 === currentSide.sha256 && nativeAsset.bytes === currentSide.bytes
          && nativeAsset.width === currentSide.width && nativeAsset.height === currentSide.height,
      `${rowWhere}: native review asset is not the exact verified current portrait`);
      assetFiles.push(nativeAsset.file, gameplayAsset.file, actualThumbAsset.file);
      const changedValue = oldSide.sha256 !== currentSide.sha256;
      assert(typeof rowRaw.changed === 'boolean' && rowRaw.changed === changedValue,
        `${rowWhere}.changed: does not match portrait hashes`);
      if (changedValue) changed++;
      const key = rowKey(rowSet, species);
      assert(!keys.has(key), `comparison index: duplicate identity ${rowSet}/${species}`);
      keys.add(key);
      const row = {
        ordinal, set: rowSet, species, family, render_name: rowRaw.render_name,
        procedural_plan_sha256: proceduralPlanSha256, old: oldSide, current: currentSide,
        must_read_contract: mustReadContract,
        review_assets: {
          native_440: nativeAsset,
          gameplay_300_unlabelled: gameplayAsset,
          actual_thumb_132_unlabelled: actualThumbAsset,
        },
        changed: changedValue,
      };
      packet.rows.push(row);
      rows.push(row);
    }
    assert(packetRowsDigest(packet.rows, 'old') === oldRowsSha256, `${where}: old_rows_sha256 does not match rows`);
    assert(packetRowsDigest(packet.rows, 'current') === currentRowsSha256, `${where}: current_rows_sha256 does not match rows`);
    assert(packetReviewAssetDigest(packet.rows, 'native_440') === nativeRowsSha256,
      `${where}: native_440_rows_sha256 does not match rows`);
    assert(packetReviewAssetDigest(packet.rows, 'gameplay_300_unlabelled') === gameplayRowsSha256,
      `${where}: gameplay_300_rows_sha256 does not match rows`);
    assert(packetReviewAssetDigest(packet.rows, 'actual_thumb_132_unlabelled') === actualThumbRowsSha256,
      `${where}: actual_thumb_132_rows_sha256 does not match rows`);
    assert(packetMustReadDigest(packet.rows) === mustReadRowsSha256,
      `${where}: must_read_rows_sha256 does not match rows`);
    assert(packet.rows.filter((row) => row.changed).length === packetRaw.changed_count,
      `${where}: changed_count does not match rows`);
    packets.push(packet);
  }
  assert(rows.length === total && keys.size === total, 'comparison index: exact identity cardinality failed');
  assert(changed === raw.changed_identities, 'comparison index: changed_identities does not match rows');
  const flattenedCounts = Object.fromEntries(Object.keys(expectedSets).map((set) => [set, 0]));
  for (const row of rows) flattenedCounts[row.set]++;
  exactSetCounts(flattenedCounts, expectedSets, 'comparison flattened sets');
  assert(catalogueDigest(rows) === catalogueSha256, 'comparison index: catalogue_sha256 does not match rows');
  assert(evidenceIdentityDigest(rows.map((row) => ({ set: row.set, species: row.species, ...row.old }))) === oldSummary.identity_digest,
    'comparison index: old evidence identity digest does not match rows');
  assert(evidenceIdentityDigest(rows.map((row) => ({ set: row.set, species: row.species, ...row.current }))) === currentSummary.identity_digest,
    'comparison index: current evidence identity digest does not match rows');
  if (REVIEWED_BATS.every((species) => keys.has(rowKey('earth-fauna', species)))) {
    const batPackets = packets.filter((packet) => packet.rows.some(
      (row) => row.set === 'earth-fauna' && REVIEWED_BATS.includes(row.species),
    ));
    assert(batPackets.length === 1 && batPackets[0].family === 'Bats',
      'comparison index: reviewed bats are not together in one Bats packet');
  }
  assertExactFiles(comparisonRoot, ['comparison-index.json', ...sheetFiles, ...assetFiles], 'comparison output');
  return {
    root: comparisonRoot,
    indexFile,
    indexSha256: hashFile(indexFile),
    catalogueSha256,
    layoutIndexSha256,
    revision,
    oldSummary,
    currentSummary,
    packets,
    rows,
    counts,
  };
}

async function compare(options, config = {}) {
  const expectedSets = config.expectedSets ?? EXPECTED_SETS;
  const nativeSize = config.nativeSize ?? NATIVE_SIZE;
  const commit = sourceCommit(options.sourceCommit);
  const oldEvidence = loadEvidence(options.old, 'old evidence', expectedSets, nativeSize, { mode: 'historical' });
  const currentEvidence = loadEvidence(options.current, 'current evidence', expectedSets, nativeSize, {
    mode: 'current', expectedCommit: commit,
  });
  assertExactEvidenceJoin(oldEvidence, currentEvidence);
  const layout = loadLayout(options.layout, currentEvidence, commit, config);
  const comparison = buildComparison(layout, oldEvidence, currentEvidence);
  const before = sourceSnapshot(layout, oldEvidence, currentEvidence);
  const out = validateNewOutput(options.out, [layout.root, oldEvidence.root, currentEvidence.root], 'comparison output');
  await atomicDirectory(out, async (stage) => {
    await writeComparisonOutput(stage, layout, comparison, oldEvidence, currentEvidence, config);
  }, async () => {
    const oldAfter = loadEvidence(options.old, 'old evidence postflight', expectedSets, nativeSize, { mode: 'historical' });
    const currentAfter = loadEvidence(options.current, 'current evidence postflight', expectedSets, nativeSize, {
      mode: 'current', expectedCommit: commit,
    });
    const layoutAfter = loadLayout(options.layout, currentAfter, commit, config);
    assert(sourceSnapshot(layoutAfter, oldAfter, currentAfter) === before,
      'comparison inputs changed while sheets were being prepared');
  });
  const loaded = loadComparison(out, commit, config);
  console.log('FULL RESET OLD/CURRENT COMPARISON PASS');
  console.log(`  exact two-root join: ${loaded.rows.length}/${expectedTotal(expectedSets)}`);
  console.log(`  labelled family packets: ${loaded.packets.length}`);
  console.log(`  changed portraits: ${loaded.rows.filter((row) => row.changed).length}`);
  console.log(`  current catalogue digest: ${loaded.catalogueSha256}`);
  console.log(`  source commit: ${loaded.revision.commit}`);
  console.log(`  wrote: ${displayPath(out)}`);
  return loaded;
}

function comparisonSnapshot(comparison) {
  return stableJson({
    index: hashFile(comparison.indexFile),
    sheets: comparison.packets.map((packet) => ({
      file: packet.sheet.file,
      sha256: hashFile(packet.sheet.disk),
      bytes: fs.statSync(packet.sheet.disk).size,
    })),
    review_assets: comparison.rows.map((row) => ({
      ordinal: row.ordinal,
      native_440_sha256: hashFile(row.review_assets.native_440.disk),
      gameplay_300_sha256: hashFile(row.review_assets.gameplay_300_unlabelled.disk),
      actual_thumb_132_sha256: hashFile(row.review_assets.actual_thumb_132_unlabelled.disk),
      must_read_sha256: row.must_read_contract.sha256,
    })),
  });
}

function verdictFileName(packetId) { return `verdicts/packet-${packetId}.json`; }

function templateManifest(comparison, date, commit) {
  return {
    schema: TEMPLATE_MANIFEST_SCHEMA,
    purpose: 'Blank fresh-review templates. Empty rows are invalid until manually reviewed and completed.',
    ruler: RULER,
    review_date: date,
    source_commit: commit,
    comparison_index_sha256: comparison.indexSha256,
    current_catalogue_sha256: comparison.catalogueSha256,
    total_identities: comparison.rows.length,
    packet_count: comparison.packets.length,
    fresh_review_required: true,
    historical_verdicts_permitted: false,
    files: comparison.packets.map((packet) => ({
      packet_id: packet.packet_id,
      file: verdictFileName(packet.packet_id),
      comparison_sheet_sha256: packet.sheet.sha256,
      old_rows_sha256: packet.old_rows_sha256,
      current_rows_sha256: packet.current_rows_sha256,
      native_440_rows_sha256: packet.native_440_rows_sha256,
      gameplay_300_rows_sha256: packet.gameplay_300_rows_sha256,
      actual_thumb_132_rows_sha256: packet.actual_thumb_132_rows_sha256,
      must_read_rows_sha256: packet.must_read_rows_sha256,
    })),
  };
}

function blankVerdict(comparison, packet, date, commit) {
  return {
    schema: VERDICT_SCHEMA,
    ruler: RULER,
    review_date: date,
    source_commit: commit,
    comparison_index_sha256: comparison.indexSha256,
    current_catalogue_sha256: comparison.catalogueSha256,
    packet_id: packet.packet_id,
    set: packet.set,
    family: packet.family,
    family_part: packet.family_part,
    family_parts: packet.family_parts,
    packet_hashes: {
      comparison_sheet_sha256: packet.sheet.sha256,
      old_rows_sha256: packet.old_rows_sha256,
      current_rows_sha256: packet.current_rows_sha256,
      native_440_rows_sha256: packet.native_440_rows_sha256,
      gameplay_300_rows_sha256: packet.gameplay_300_rows_sha256,
      actual_thumb_132_rows_sha256: packet.actual_thumb_132_rows_sha256,
      must_read_rows_sha256: packet.must_read_rows_sha256,
    },
    reviewer: '',
    attestation: '',
    rows: packet.rows.map((row) => ({
      ordinal: row.ordinal,
      set: row.set,
      species: row.species,
      current_portrait_sha256: row.current.sha256,
      native_440_sha256: row.review_assets.native_440.sha256,
      gameplay_300_sha256: row.review_assets.gameplay_300_unlabelled.sha256,
      actual_thumb_132_sha256: row.review_assets.actual_thumb_132_unlabelled.sha256,
      must_read_contract: row.must_read_contract,
      comparison_sheet_sha256: packet.sheet.sha256,
      evidence_reviewed: {
        native_440: false,
        gameplay_300_unlabelled: false,
        actual_thumb_132_unlabelled: false,
        labelled_comparison: false,
        must_read_contract: false,
      },
      fresh_review: false,
      band: '',
      reason: '',
    })),
  };
}

function loadTemplateManifest(workspaceRoot, comparison, date, commit) {
  const manifestFile = sourceFile(path.join(workspaceRoot, 'template-manifest.json'), 'verdict template manifest');
  const raw = readJson(manifestFile, 'verdict template manifest');
  exactKeys(raw, [
    'schema', 'purpose', 'ruler', 'review_date', 'source_commit', 'comparison_index_sha256',
    'current_catalogue_sha256', 'total_identities', 'packet_count', 'fresh_review_required',
    'historical_verdicts_permitted', 'files',
  ], 'verdict template manifest');
  assert(raw.schema === TEMPLATE_MANIFEST_SCHEMA,
    `verdict template manifest: expected schema ${TEMPLATE_MANIFEST_SCHEMA}`);
  nonempty(raw.purpose, 'verdict template manifest purpose');
  assert(raw.ruler === RULER, `verdict template manifest: stale or mixed ruler ${JSON.stringify(raw.ruler)}`);
  assert(reviewDate(raw.review_date, 'verdict template manifest review_date') === date,
    'verdict template manifest: review date differs from requested fresh review date');
  assert(sourceCommit(raw.source_commit, 'verdict template manifest source_commit') === commit,
    'verdict template manifest: source commit differs from requested commit');
  assert(hex(raw.comparison_index_sha256, 64, 'verdict template manifest comparison_index_sha256') === comparison.indexSha256,
    'verdict template manifest: comparison index hash is stale');
  assert(hex(raw.current_catalogue_sha256, 64, 'verdict template manifest current_catalogue_sha256') === comparison.catalogueSha256,
    'verdict template manifest: current catalogue hash is stale');
  assert(raw.total_identities === comparison.rows.length,
    'verdict template manifest: total identity count differs from comparison');
  assert(raw.packet_count === comparison.packets.length,
    'verdict template manifest: packet count differs from comparison');
  assert(raw.fresh_review_required === true, 'verdict template manifest: fresh_review_required must be true');
  assert(raw.historical_verdicts_permitted === false,
    'verdict template manifest: historical verdicts must be explicitly forbidden');
  assert(Array.isArray(raw.files) && raw.files.length === comparison.packets.length,
    'verdict template manifest: files[] length differs from comparison packets');
  const files = [];
  for (const [offset, record] of raw.files.entries()) {
    const packet = comparison.packets[offset];
    const where = `verdict template manifest file ${offset + 1}`;
    exactKeys(record, [
      'packet_id', 'file', 'comparison_sheet_sha256', 'old_rows_sha256', 'current_rows_sha256',
      'native_440_rows_sha256', 'gameplay_300_rows_sha256', 'must_read_rows_sha256',
      'actual_thumb_132_rows_sha256',
    ], where);
    assert(record.packet_id === packet.packet_id, `${where}.packet_id: expected ${packet.packet_id}`);
    const relative = safeRelativeFile(record.file, 'verdicts', '.json', `${where}.file`);
    assert(relative === verdictFileName(packet.packet_id), `${where}.file: unexpected packet filename`);
    assert(hex(record.comparison_sheet_sha256, 64, `${where}.comparison_sheet_sha256`) === packet.sheet.sha256,
      `${where}: comparison sheet hash is stale`);
    assert(hex(record.old_rows_sha256, 64, `${where}.old_rows_sha256`) === packet.old_rows_sha256,
      `${where}: old packet hash is stale`);
    assert(hex(record.current_rows_sha256, 64, `${where}.current_rows_sha256`) === packet.current_rows_sha256,
      `${where}: current packet hash is stale`);
    assert(hex(record.native_440_rows_sha256, 64, `${where}.native_440_rows_sha256`) === packet.native_440_rows_sha256,
      `${where}: native 440 packet hash is stale`);
    assert(hex(record.gameplay_300_rows_sha256, 64, `${where}.gameplay_300_rows_sha256`) === packet.gameplay_300_rows_sha256,
      `${where}: gameplay 300 packet hash is stale`);
    assert(hex(record.actual_thumb_132_rows_sha256, 64, `${where}.actual_thumb_132_rows_sha256`) === packet.actual_thumb_132_rows_sha256,
      `${where}: actual-thumb 132 packet hash is stale`);
    assert(hex(record.must_read_rows_sha256, 64, `${where}.must_read_rows_sha256`) === packet.must_read_rows_sha256,
      `${where}: mustRead packet hash is stale`);
    files.push(relative);
  }
  return { file: manifestFile, raw, files };
}

function concreteReason(value, where) {
  const reason = nonempty(value, where);
  assert(reason.length >= 24 && reason.length <= 1000,
    `${where}: give a concrete 24..1000 character anatomical/visual reason`);
  const words = reason.match(/[A-Za-z][A-Za-z'-]{2,}/g) ?? [];
  assert(words.length >= 4, `${where}: give at least four descriptive words`);
  assert(!/^(?:pass|polish|fail|ok(?:ay)?|looks? good|no issues?|same|unchanged|n\/?a)[\s.!-]*$/i.test(reason),
    `${where}: generic status text is not a concrete reason`);
  assert(!/\b(?:carried|carry[- ]?over|copied|previous verdict|old verdict|autofill(?:ed)?|placeholder|lorem ipsum)\b/i.test(reason),
    `${where}: carried/generated placeholder language is forbidden`);
  return reason;
}

function validateVerdict(raw, packet, comparison, date, commit, where, requireFilled) {
  exactKeys(raw, [
    'schema', 'ruler', 'review_date', 'source_commit', 'comparison_index_sha256',
    'current_catalogue_sha256', 'packet_id', 'set', 'family', 'family_part',
    'family_parts', 'packet_hashes', 'reviewer', 'attestation', 'rows',
  ], where);
  assert(raw.schema === VERDICT_SCHEMA, `${where}: expected schema ${VERDICT_SCHEMA}`);
  assert(raw.ruler === RULER, `${where}: stale or mixed ruler ${JSON.stringify(raw.ruler)}`);
  assert(reviewDate(raw.review_date, `${where}.review_date`) === date, `${where}: stale or mixed review date`);
  assert(sourceCommit(raw.source_commit, `${where}.source_commit`) === commit, `${where}: stale or mixed source commit`);
  assert(hex(raw.comparison_index_sha256, 64, `${where}.comparison_index_sha256`) === comparison.indexSha256,
    `${where}: stale or mixed comparison index hash`);
  assert(hex(raw.current_catalogue_sha256, 64, `${where}.current_catalogue_sha256`) === comparison.catalogueSha256,
    `${where}: stale or mixed catalogue hash`);
  assert(raw.packet_id === packet.packet_id, `${where}.packet_id: expected ${packet.packet_id}`);
  assert(raw.set === packet.set, `${where}.set: expected ${packet.set}`);
  assert(raw.family === packet.family, `${where}.family: expected ${packet.family}`);
  assert(raw.family_part === packet.family_part && raw.family_parts === packet.family_parts,
    `${where}: family part metadata differs from comparison packet`);
  exactKeys(raw.packet_hashes,
    [
      'comparison_sheet_sha256', 'old_rows_sha256', 'current_rows_sha256',
      'native_440_rows_sha256', 'gameplay_300_rows_sha256', 'actual_thumb_132_rows_sha256',
      'must_read_rows_sha256',
    ], `${where}.packet_hashes`);
  assert(hex(raw.packet_hashes.comparison_sheet_sha256, 64, `${where}.packet_hashes.comparison_sheet_sha256`) === packet.sheet.sha256,
    `${where}: stale comparison sheet hash`);
  assert(hex(raw.packet_hashes.old_rows_sha256, 64, `${where}.packet_hashes.old_rows_sha256`) === packet.old_rows_sha256,
    `${where}: stale old packet hash`);
  assert(hex(raw.packet_hashes.current_rows_sha256, 64, `${where}.packet_hashes.current_rows_sha256`) === packet.current_rows_sha256,
    `${where}: stale current packet hash`);
  assert(hex(raw.packet_hashes.native_440_rows_sha256, 64, `${where}.packet_hashes.native_440_rows_sha256`) === packet.native_440_rows_sha256,
    `${where}: stale native 440 packet hash`);
  assert(hex(raw.packet_hashes.gameplay_300_rows_sha256, 64, `${where}.packet_hashes.gameplay_300_rows_sha256`) === packet.gameplay_300_rows_sha256,
    `${where}: stale gameplay 300 packet hash`);
  assert(hex(raw.packet_hashes.actual_thumb_132_rows_sha256, 64, `${where}.packet_hashes.actual_thumb_132_rows_sha256`) === packet.actual_thumb_132_rows_sha256,
    `${where}: stale actual-thumb 132 packet hash`);
  assert(hex(raw.packet_hashes.must_read_rows_sha256, 64, `${where}.packet_hashes.must_read_rows_sha256`) === packet.must_read_rows_sha256,
    `${where}: stale mustRead packet hash`);
  let reviewer = raw.reviewer;
  if (requireFilled) {
    reviewer = nonempty(reviewer, `${where}.reviewer`);
    assert(reviewer.length <= 160, `${where}.reviewer: implausibly long`);
    assert(raw.attestation === ATTESTATION,
      `${where}.attestation: must be the literal fresh-review attestation`);
  } else {
    assert(raw.reviewer === '' && raw.attestation === '', `${where}: blank template reviewer/attestation were prefilled`);
  }
  assert(Array.isArray(raw.rows) && raw.rows.length === packet.rows.length,
    `${where}.rows: expected ${packet.rows.length}, got ${Array.isArray(raw.rows) ? raw.rows.length : 'non-array'}`);
  const rows = [];
  for (const [offset, rowRaw] of raw.rows.entries()) {
    const expected = packet.rows[offset];
    const rowWhere = `${where} row ${offset + 1}`;
    exactKeys(rowRaw, [
      'ordinal', 'set', 'species', 'current_portrait_sha256', 'native_440_sha256',
      'gameplay_300_sha256', 'actual_thumb_132_sha256', 'must_read_contract', 'comparison_sheet_sha256',
      'evidence_reviewed', 'fresh_review', 'band', 'reason',
    ], rowWhere);
    assert(rowRaw.ordinal === expected.ordinal, `${rowWhere}.ordinal: expected ${expected.ordinal}`);
    assert(rowRaw.set === expected.set, `${rowWhere}.set: expected ${expected.set}`);
    assert(rowRaw.species === expected.species, `${rowWhere}.species: expected ${expected.species}`);
    assert(hex(rowRaw.current_portrait_sha256, 64, `${rowWhere}.current_portrait_sha256`) === expected.current.sha256,
      `${rowWhere}: stale current portrait hash`);
    assert(hex(rowRaw.native_440_sha256, 64, `${rowWhere}.native_440_sha256`) === expected.review_assets.native_440.sha256,
      `${rowWhere}: stale native 440 review hash`);
    assert(hex(rowRaw.gameplay_300_sha256, 64, `${rowWhere}.gameplay_300_sha256`) === expected.review_assets.gameplay_300_unlabelled.sha256,
      `${rowWhere}: stale gameplay 300 review hash`);
    assert(hex(rowRaw.actual_thumb_132_sha256, 64, `${rowWhere}.actual_thumb_132_sha256`) === expected.review_assets.actual_thumb_132_unlabelled.sha256,
      `${rowWhere}: stale actual-thumb 132 review hash`);
    const mustRead = validateMustReadContract(
      rowRaw.must_read_contract, expected.set, expected.species, `${rowWhere}.must_read_contract`,
    );
    assert(stableJson(mustRead) === stableJson(expected.must_read_contract),
      `${rowWhere}: mustRead contract differs from the comparison`);
    assert(hex(rowRaw.comparison_sheet_sha256, 64, `${rowWhere}.comparison_sheet_sha256`) === packet.sheet.sha256,
      `${rowWhere}: stale comparison sheet hash`);
    let band = rowRaw.band;
    let reason = rowRaw.reason;
    exactKeys(rowRaw.evidence_reviewed, [
      'native_440', 'gameplay_300_unlabelled', 'actual_thumb_132_unlabelled',
      'labelled_comparison', 'must_read_contract',
    ], `${rowWhere}.evidence_reviewed`);
    if (requireFilled) {
      for (const [surface, reviewed] of Object.entries(rowRaw.evidence_reviewed)) {
        assert(reviewed === true, `${rowWhere}.evidence_reviewed.${surface}: must be literal true`);
      }
      assert(rowRaw.fresh_review === true, `${rowWhere}.fresh_review: must be literal true`);
      assert(BAND_ORDER.includes(band), `${rowWhere}.band: expected PASS, POLISH, or FAIL`);
      reason = concreteReason(reason, `${rowWhere}.reason`);
    } else {
      assert(Object.values(rowRaw.evidence_reviewed).every((reviewed) => reviewed === false),
        `${rowWhere}: blank template evidence_reviewed fields were prefilled`);
      assert(rowRaw.fresh_review === false && band === '' && reason === '',
        `${rowWhere}: blank template verdict fields were prefilled`);
    }
    rows.push({
      ordinal: expected.ordinal,
      set: expected.set,
      species: expected.species,
      current_portrait_sha256: expected.current.sha256,
      native_440_sha256: expected.review_assets.native_440.sha256,
      gameplay_300_sha256: expected.review_assets.gameplay_300_unlabelled.sha256,
      actual_thumb_132_sha256: expected.review_assets.actual_thumb_132_unlabelled.sha256,
      must_read_contract: expected.must_read_contract,
      comparison_sheet_sha256: packet.sheet.sha256,
      evidence_reviewed: { ...rowRaw.evidence_reviewed },
      fresh_review: rowRaw.fresh_review,
      band,
      reason,
    });
  }
  return { reviewer, attestation: raw.attestation, rows };
}

function loadVerdictWorkspace(workspaceValue, comparison, date, commit, requireFilled = true) {
  const workspaceRoot = realDirectory(workspaceValue, 'verdict workspace root');
  const manifest = loadTemplateManifest(workspaceRoot, comparison, date, commit);
  assertExactFiles(workspaceRoot, ['template-manifest.json', ...manifest.files], 'verdict workspace');
  const packets = [];
  const allRows = [];
  const identities = new Set();
  for (const [offset, relative] of manifest.files.entries()) {
    const packet = comparison.packets[offset];
    const file = realChildFile(workspaceRoot, relative, `verdict packet ${packet.packet_id}`);
    const raw = readJson(file, `verdict packet ${packet.packet_id}`);
    const validated = validateVerdict(raw, packet, comparison, date, commit,
      `verdict packet ${packet.packet_id}`, requireFilled);
    for (const row of validated.rows) {
      const key = rowKey(row.set, row.species);
      assert(!identities.has(key), `verdict workspace: duplicate identity ${row.set}/${row.species}`);
      identities.add(key);
      allRows.push(row);
    }
    packets.push({
      packet,
      file,
      relative,
      sha256: hashFile(file),
      reviewer: validated.reviewer,
      rows: validated.rows,
    });
  }
  assert(allRows.length === comparison.rows.length && identities.size === comparison.rows.length,
    'verdict workspace: missing or duplicate identities');
  for (const [offset, expected] of comparison.rows.entries()) {
    const actual = allRows[offset];
    assert(actual.set === expected.set && actual.species === expected.species && actual.ordinal === expected.ordinal,
      `verdict workspace: identity order differs at ordinal ${expected.ordinal}`);
  }
  return { root: workspaceRoot, manifest, packets, rows: allRows };
}

function verdictSnapshot(workspace) {
  return stableJson({
    manifest: hashFile(workspace.manifest.file),
    verdicts: workspace.packets.map((packet) => ({ file: packet.relative, sha256: hashFile(packet.file) })),
  });
}

async function createTemplates(options, config = {}) {
  const commit = sourceCommit(options.sourceCommit);
  const date = reviewDate(options.reviewDate);
  const comparison = loadComparison(options.comparison, commit, config);
  const before = comparisonSnapshot(comparison);
  const out = validateNewOutput(options.out, [comparison.root], 'verdict template output');
  await atomicDirectory(out, async (stage) => {
    fs.mkdirSync(path.join(stage, 'verdicts'));
    writeJsonExclusive(path.join(stage, 'template-manifest.json'), templateManifest(comparison, date, commit));
    for (const packet of comparison.packets) {
      writeJsonExclusive(path.join(stage, ...verdictFileName(packet.packet_id).split('/')),
        blankVerdict(comparison, packet, date, commit));
    }
  }, async () => {
    const after = loadComparison(options.comparison, commit, config);
    assert(comparisonSnapshot(after) === before, 'comparison changed while verdict templates were being prepared');
  });
  const templates = loadVerdictWorkspace(out, comparison, date, commit, false);
  console.log('FULL RESET FRESH VERDICT TEMPLATES PASS');
  console.log(`  blank hash-bound rows: ${templates.rows.length}`);
  console.log(`  packet templates: ${templates.packets.length}`);
  console.log(`  review date: ${date}`);
  console.log(`  source commit: ${commit}`);
  console.log(`  wrote: ${displayPath(out)}`);
  console.log('  templates are intentionally invalid for collection until every row is freshly completed');
  return templates;
}

function bandTallies(rows) {
  const tallies = { PASS: 0, POLISH: 0, FAIL: 0 };
  for (const row of rows) {
    assert(BAND_ORDER.includes(row.band), `tallies: invalid band ${JSON.stringify(row.band)}`);
    tallies[row.band]++;
  }
  return tallies;
}

function buildResults(comparison, workspace, date, commit) {
  const tallies = bandTallies(workspace.rows);
  const rows = [];
  const packets = workspace.packets.map((entry) => {
    const packetTallies = bandTallies(entry.rows);
    for (const row of entry.rows) {
      rows.push({
        ordinal: row.ordinal,
        packet_id: entry.packet.packet_id,
        set: row.set,
        species: row.species,
        current_portrait_sha256: row.current_portrait_sha256,
        native_440_sha256: row.native_440_sha256,
        gameplay_300_sha256: row.gameplay_300_sha256,
        actual_thumb_132_sha256: row.actual_thumb_132_sha256,
        must_read_contract_sha256: row.must_read_contract.sha256,
        comparison_sheet_sha256: row.comparison_sheet_sha256,
        evidence_reviewed: row.evidence_reviewed,
        reviewer: entry.reviewer,
        fresh_review: true,
        band: row.band,
        reason: row.reason,
      });
    }
    return {
      packet_id: entry.packet.packet_id,
      set: entry.packet.set,
      family: entry.packet.family,
      verdict_file: entry.relative,
      verdict_sha256: entry.sha256,
      reviewer: entry.reviewer,
      comparison_sheet_sha256: entry.packet.sheet.sha256,
      current_rows_sha256: entry.packet.current_rows_sha256,
      native_440_rows_sha256: entry.packet.native_440_rows_sha256,
      gameplay_300_rows_sha256: entry.packet.gameplay_300_rows_sha256,
      actual_thumb_132_rows_sha256: entry.packet.actual_thumb_132_rows_sha256,
      must_read_rows_sha256: entry.packet.must_read_rows_sha256,
      tallies: packetTallies,
    };
  });
  const allPass = tallies.PASS === rows.length;
  return {
    schema: RESULTS_SCHEMA,
    purpose: 'Fresh hash-bound full-reset verdict collection; no historical verdict state is accepted.',
    ruler: RULER,
    review_date: date,
    source_commit: commit,
    comparison_index_sha256: comparison.indexSha256,
    current_catalogue_sha256: comparison.catalogueSha256,
    total_identities: rows.length,
    sets: comparison.counts,
    packet_count: packets.length,
    all_rows_fresh: rows.every((row) => row.fresh_review === true),
    all_required_evidence_reviewed: rows.every((row) =>
      Object.values(row.evidence_reviewed).every((reviewed) => reviewed === true)),
    all_rows_literal_pass: allPass,
    literal_certification_eligible: allPass,
    tallies,
    packets,
    rows,
  };
}

async function collect(options, config = {}) {
  const commit = sourceCommit(options.sourceCommit);
  const date = reviewDate(options.reviewDate);
  const comparison = loadComparison(options.comparison, commit, config);
  const workspace = loadVerdictWorkspace(options.verdicts, comparison, date, commit, true);
  const comparisonBefore = comparisonSnapshot(comparison);
  const verdictBefore = verdictSnapshot(workspace);
  const results = buildResults(comparison, workspace, date, commit);
  const out = validateNewOutput(options.out, [comparison.root, workspace.root], 'collection output');
  await atomicDirectory(out, async (stage) => {
    writeJsonExclusive(path.join(stage, 'results.json'), results);
  }, async () => {
    const comparisonAfter = loadComparison(options.comparison, commit, config);
    const workspaceAfter = loadVerdictWorkspace(options.verdicts, comparisonAfter, date, commit, true);
    assert(comparisonSnapshot(comparisonAfter) === comparisonBefore,
      'comparison changed while verdicts were being collected');
    assert(verdictSnapshot(workspaceAfter) === verdictBefore,
      'verdict workspace changed while verdicts were being collected');
  });
  console.log('FULL RESET FRESH VERDICT COLLECTION PASS');
  console.log(`  exact fresh rows: ${results.total_identities}`);
  console.log(`  PASS: ${results.tallies.PASS}`);
  console.log(`  POLISH: ${results.tallies.POLISH}`);
  console.log(`  FAIL: ${results.tallies.FAIL}`);
  console.log(`  literal certification eligible: ${results.literal_certification_eligible}`);
  console.log(`  wrote: ${displayPath(out)}`);
  return { root: out, file: path.join(out, 'results.json'), results };
}

function loadResults(resultsValue, expected, comparison, workspace) {
  const resultsRoot = realDirectory(resultsValue, 'collection results root');
  const resultsFile = sourceFile(path.join(resultsRoot, 'results.json'), 'collection results');
  assertExactFiles(resultsRoot, ['results.json'], 'collection results output');
  const raw = readJson(resultsFile, 'collection results');
  assert(stableJson(raw) === stableJson(expected),
    'collection results: content does not exactly match fresh verdicts and current comparison');
  assert(raw.schema === RESULTS_SCHEMA, `collection results: expected schema ${RESULTS_SCHEMA}`);
  assert(raw.comparison_index_sha256 === comparison.indexSha256,
    'collection results: comparison index hash is stale');
  assert(raw.total_identities === workspace.rows.length,
    'collection results: total differs from validated fresh rows');
  return { root: resultsRoot, file: resultsFile, sha256: hashFile(resultsFile), raw };
}

function resultsSnapshot(results) { return stableJson({ file: hashFile(results.file) }); }

async function certify(options, config = {}) {
  const commit = sourceCommit(options.sourceCommit);
  const date = reviewDate(options.reviewDate);
  const comparison = loadComparison(options.comparison, commit, config);
  const workspace = loadVerdictWorkspace(options.verdicts, comparison, date, commit, true);
  const expected = buildResults(comparison, workspace, date, commit);
  const results = loadResults(options.results, expected, comparison, workspace);
  assert(expected.total_identities === (config.expectedTotal ?? expectedTotal(config.expectedSets ?? EXPECTED_SETS)),
    `literal certification: expected ${(config.expectedTotal ?? expectedTotal(config.expectedSets ?? EXPECTED_SETS))} rows`);
  assert(expected.all_rows_fresh === true && expected.rows.every((row) => row.fresh_review === true),
    'literal certification: every current row must be fresh');
  assert(expected.all_required_evidence_reviewed === true && expected.rows.every((row) =>
    Object.values(row.evidence_reviewed).every((reviewed) => reviewed === true)),
  'literal certification: every row must review native 440, unlabelled 300, unlabelled actual-thumb 132, labelled comparison, and exact mustRead');
  assert(expected.tallies.PASS === expected.total_identities
    && expected.tallies.POLISH === 0
    && expected.tallies.FAIL === 0
    && expected.rows.every((row) => row.band === 'PASS'),
  `literal certification rejected: requires ${expected.total_identities} fresh PASS rows; got PASS=${expected.tallies.PASS}, POLISH=${expected.tallies.POLISH}, FAIL=${expected.tallies.FAIL}`);

  const comparisonBefore = comparisonSnapshot(comparison);
  const verdictBefore = verdictSnapshot(workspace);
  const resultsBefore = resultsSnapshot(results);
  const out = validateNewOutput(options.out, [comparison.root, workspace.root, results.root], 'certification output');
  const certification = {
    schema: CERTIFICATION_SCHEMA,
    purpose: 'Literal full-reset certification; valid only for the exact hashes recorded here.',
    literal_statement: `CERTIFIED: all ${expected.total_identities} current catalogue portraits received a fresh PASS after native 440px, unlabelled 300px, unlabelled actual-thumb 132px, labelled comparison, and exact mustRead review.`,
    ruler: RULER,
    review_date: date,
    source_commit: commit,
    comparison_index_sha256: comparison.indexSha256,
    results_sha256: results.sha256,
    current_catalogue_sha256: comparison.catalogueSha256,
    total_identities: expected.total_identities,
    sets: comparison.counts,
    packet_count: comparison.packets.length,
    tallies: expected.tallies,
    all_rows_fresh: true,
    all_required_evidence_reviewed: true,
    all_rows_literal_pass: true,
  };
  await atomicDirectory(out, async (stage) => {
    writeJsonExclusive(path.join(stage, 'certification.json'), certification);
  }, async () => {
    const comparisonAfter = loadComparison(options.comparison, commit, config);
    const workspaceAfter = loadVerdictWorkspace(options.verdicts, comparisonAfter, date, commit, true);
    const expectedAfter = buildResults(comparisonAfter, workspaceAfter, date, commit);
    const resultsAfter = loadResults(options.results, expectedAfter, comparisonAfter, workspaceAfter);
    assert(comparisonSnapshot(comparisonAfter) === comparisonBefore,
      'comparison changed while certification was being prepared');
    assert(verdictSnapshot(workspaceAfter) === verdictBefore,
      'verdict workspace changed while certification was being prepared');
    assert(resultsSnapshot(resultsAfter) === resultsBefore,
      'collection results changed while certification was being prepared');
  });
  console.log('FULL RESET LITERAL CERTIFICATION PASS');
  console.log(`  fresh literal PASS: ${expected.tallies.PASS}/${expected.total_identities}`);
  console.log(`  source commit: ${commit}`);
  console.log(`  current catalogue digest: ${comparison.catalogueSha256}`);
  console.log(`  wrote: ${displayPath(out)}`);
  return certification;
}

const FIXTURE_SETS = Object.freeze({
  'earth-fauna': 5,
  'earth-flora': 1,
  'earth-fungi': 1,
  'earth-microbe': 1,
  procedural: 2,
});
const FIXTURE_PACKET_COUNT = 6;
const FIXTURE_COMMIT = 'a'.repeat(40);
const FIXTURE_DATE = '2026-08-09';

function fixtureDefinitions() {
  return [
    { set: 'earth-fauna', species: 'Bat', family: 'Bats' },
    { set: 'earth-fauna', species: 'Fruit Bat', family: 'Bats' },
    { set: 'earth-fauna', species: 'Vampire Bat', family: 'Bats' },
    { set: 'earth-fauna', species: 'Insect-Eating Bat', family: 'Bats' },
    { set: 'earth-fauna', species: 'Shared Name', family: 'Fixture fauna family' },
    { set: 'earth-flora', species: 'Shared Name', family: 'Fixture flora family' },
    { set: 'earth-fungi', species: 'Fixture Fungus', family: 'Shelf fungi' },
    { set: 'earth-microbe', species: 'Fixture Microbe', family: 'Coccus colonies' },
    { set: 'procedural', species: 'fauna-h0-s0', family: 'fauna / temperate' },
    { set: 'procedural', species: 'flora-h2-s19', family: 'flora / hot' },
  ];
}

function validFixturePng(tag) {
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  return Buffer.concat([pixel, Buffer.from(tag)]);
}

function writeFixtureEvidence(directory, definitions, version) {
  const rows = [];
  const files = [];
  for (const [offset, definition] of definitions.entries()) {
    const filename = `portrait-${String(offset + 1).padStart(2, '0')}.png`;
    const imageFile = `${definition.set}/${filename}`;
    const common = definition.set === 'earth-microbe';
    const buffer = validFixturePng(`${common ? 'same' : version}/${definition.set}/${definition.species}`);
    const disk = path.join(directory, 'portraits', definition.set, filename);
    fs.mkdirSync(path.dirname(disk), { recursive: true });
    fs.writeFileSync(disk, buffer);
    const hash = sha256(buffer);
    rows.push({
      set: definition.set,
      species: definition.species,
      render_name: definition.species,
      image_file: imageFile,
      sha256: hash,
    });
    files.push({
      set: definition.set,
      file: imageFile,
      sha256: hash,
      bytes: buffer.length,
      width: 1,
      height: 1,
    });
  }
  const captureProvenance = {
    schema: 'cf.capture-provenance.v1',
    repository_root: '.',
    source_commit: FIXTURE_COMMIT,
    capture_scope: 'entire_repository_including_untracked',
    worktree_clean_before: true,
    worktree_clean_after: true,
    status_porcelain_sha256: sha256(''),
  };
  const current = version === 'current';
  fs.mkdirSync(path.join(directory, 'review-info'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'identity-manifest.json'), JSON.stringify({
    schema: current ? 'cf.gp71.identity-manifest.v2' : 'cf.gp71.identity-manifest.v1',
    ...(current ? { capture_provenance: captureProvenance } : {}),
    rows,
  }, null, 2) + '\n');
  fs.writeFileSync(path.join(directory, 'review-info', 'manifest.json'), JSON.stringify({
    schema: current ? 'cf.gp71.portrait-manifest.v2' : 'cf.gp71.portrait-manifest.v1',
    ...(current ? { capture_provenance: captureProvenance } : {}),
    portraits: rows.length,
    sets: FIXTURE_SETS,
    files,
  }, null, 2) + '\n');
}

function fixtureMustReadContract(definition, proceduralPlanSha = null) {
  const payload = {
    set: definition.set,
    species: definition.species,
    source: proceduralPlanSha ? `selftest live plan: ${definition.family}` : 'selftest exact reference',
    source_sha256: proceduralPlanSha ?? sha256('selftest exact reference'),
    must_read: proceduralPlanSha
      ? [`recognizable ${definition.family} plan`, 'connected anatomy at native and gameplay scale']
      : [`recognizable exact ${definition.set}/${definition.species} anatomy`],
    note: 'Selftest exact contract.',
  };
  return { ...payload, sha256: sha256(stableJson(payload)) };
}

function writeFixtureLayout(directory, currentEvidence, definitions = fixtureDefinitions()) {
  const groups = [
    definitions.slice(0, 4),
    [definitions[4]],
    [definitions[5]],
    [definitions[6]],
    [definitions[7]],
    definitions.slice(8),
  ];
  let ordinal = 0;
  const packets = groups.map((group, packetOffset) => {
    const family = group[0].family;
    const set = group[0].set;
    const rows = group.map((definition) => {
      const portrait = currentEvidence.byKey.get(rowKey(definition.set, definition.species));
      const base = {
        ordinal: ++ordinal,
        set: definition.set,
        species: definition.species,
        render_name: definition.species,
        family,
        family_source: definition.family === 'Bats' ? 'explicit reviewed family override' : 'selftest exact family',
        image_file: portrait.imageFile,
        sha256: portrait.sha256,
        bytes: portrait.bytes,
        width: portrait.width,
        height: portrait.height,
      };
      if (definition.set === 'procedural') {
        base.procedural_plan = {
          plan_family: definition.species.startsWith('fauna') ? 'fixture quadruped' : 'fixture branching plant',
          plan_sha256: sha256(`plan/${definition.species}`),
        };
      }
      base.must_read_contract = fixtureMustReadContract(
        definition, base.procedural_plan?.plan_sha256 ?? null,
      );
      return base;
    });
    return {
      packet_id: String(packetOffset + 1).padStart(3, '0'),
      set,
      family,
      family_part: 1,
      family_parts: 1,
      rows,
    };
  });
  const digestRows = packets.flatMap((packet) => packet.rows).map((row) => ({
    ordinal: row.ordinal,
    set: row.set,
    species: row.species,
    family: row.family,
    procedural_plan_sha256: row.procedural_plan?.plan_sha256 ?? null,
    must_read_contract: row.must_read_contract,
    current: { image_file: row.image_file, sha256: row.sha256 },
  }));
  const index = {
    schema: INDEX_SCHEMA,
    identity_key: ['set', 'species'],
    total_identities: definitions.length,
    sets: FIXTURE_SETS,
    families: groups.length,
    packet_size: 4,
    packet_count: groups.length,
    catalogue_sha256: catalogueDigest(digestRows),
    source_revision: {
      repository_root: '.',
      commit: FIXTURE_COMMIT,
      worktree_clean_for_capture: true,
      capture_scope: ['.'],
      changed_paths: [],
    },
    packets,
  };
  fs.mkdirSync(directory);
  fs.writeFileSync(path.join(directory, 'index.json'), JSON.stringify(index, null, 2) + '\n');
  return index;
}

function fixtureConfig() {
  return {
    expectedSets: FIXTURE_SETS,
    expectedPacketCount: FIXTURE_PACKET_COUNT,
    nativeSize: 1,
    gameplaySize: 2,
    actualThumbSize: 3,
    expectedTotal: expectedTotal(FIXTURE_SETS),
  };
}

function fillVerdicts(workspace, options = {}) {
  const bandAt = options.bandAt ?? new Map();
  const files = fs.readdirSync(path.join(workspace, 'verdicts')).sort(cmp);
  for (const name of files) {
    const file = path.join(workspace, 'verdicts', name);
    const verdict = JSON.parse(fs.readFileSync(file, 'utf8'));
    verdict.reviewer = options.reviewer ?? 'Selftest reviewer';
    verdict.attestation = ATTESTATION;
    for (const row of verdict.rows) {
      const band = bandAt.get(row.ordinal) ?? 'PASS';
      row.fresh_review = true;
      row.evidence_reviewed = {
        native_440: true,
        gameplay_300_unlabelled: true,
        actual_thumb_132_unlabelled: true,
        labelled_comparison: true,
        must_read_contract: true,
      };
      row.band = band;
      row.reason = band === 'PASS'
        ? 'Observed silhouette, limb attachment, body proportion, and surface features match the named species.'
        : 'Observed wing attachment needs smoother integration with the torso before this portrait can pass.';
    }
    fs.writeFileSync(file, JSON.stringify(verdict, null, 2) + '\n');
  }
}

function copyFixture(source, destination) {
  assert(!fs.existsSync(destination), `selftest copy target exists: ${destination}`);
  fs.cpSync(source, destination, { recursive: true, errorOnExist: true });
  return destination;
}

function mutateJson(file, mutate) {
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  mutate(value);
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

async function expectReject(label, action, messagePattern = null) {
  let error = null;
  try { await action(); }
  catch (caught) { error = caught; }
  assert(error, `negative control did not reject: ${label}`);
  if (messagePattern) {
    assert(messagePattern.test(error.message),
      `negative control ${label}: unexpected error ${JSON.stringify(error.message)}`);
  }
  return error.message;
}

function treeDigest(directory) {
  const records = [];
  function visit(current, relative) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => cmp(a.name, b.name))) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) visit(child, childRelative);
      else records.push(`${childRelative}\u0000${hashFile(child)}\n`);
    }
  }
  visit(directory, '');
  return sha256(records.join(''));
}

async function runSelftest() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-fullresetreview-'));
  const config = fixtureConfig();
  try {
    const definitions = fixtureDefinitions();
    const oldRoot = path.join(temp, 'old-evidence');
    const currentRoot = path.join(temp, 'current-evidence');
    writeFixtureEvidence(oldRoot, definitions, 'old');
    writeFixtureEvidence(currentRoot, definitions, 'current');
    const currentEvidence = loadEvidence(currentRoot, 'selftest current', FIXTURE_SETS, 1, {
      mode: 'current', expectedCommit: FIXTURE_COMMIT,
    });
    const layoutRoot = path.join(temp, 'layout');
    writeFixtureLayout(layoutRoot, currentEvidence, definitions);
    const compareOptions = {
      layout: layoutRoot,
      old: oldRoot,
      current: currentRoot,
      out: path.join(temp, 'comparison-a'),
      sourceCommit: FIXTURE_COMMIT,
    };
    const comparison = await compare(compareOptions, config);
    assert(comparison.rows.length === 10 && comparison.packets.length === 6,
      'selftest comparator lost rows or packets');
    assert(comparison.rows.filter((row) => row.changed).length === 9,
      'selftest comparator changed/unchanged classification failed');
    const batPacket = comparison.packets.find((packet) => packet.family === 'Bats');
    assert(batPacket && batPacket.rows.length === 4
      && REVIEWED_BATS.every((species) => batPacket.rows.some((row) => row.species === species)),
    'selftest four bats did not remain together');
    const shared = comparison.rows.filter((row) => row.species === 'Shared Name');
    assert(shared.length === 2 && new Set(shared.map((row) => row.set)).size === 2,
      'selftest cross-kingdom same-name identities collapsed');

    const secondCompare = path.join(temp, 'comparison-b');
    await compare({ ...compareOptions, out: secondCompare }, config);
    assert(treeDigest(compareOptions.out) === treeDigest(secondCompare),
      'selftest comparison output is not deterministic');

    const templateOptions = {
      comparison: compareOptions.out,
      out: path.join(temp, 'templates-a'),
      reviewDate: FIXTURE_DATE,
      sourceCommit: FIXTURE_COMMIT,
    };
    await createTemplates(templateOptions, config);
    const secondTemplates = path.join(temp, 'templates-b');
    await createTemplates({ ...templateOptions, out: secondTemplates }, config);
    assert(treeDigest(templateOptions.out) === treeDigest(secondTemplates),
      'selftest template output is not deterministic');

    await expectReject('fabricated blank verdicts', () => collect({
      comparison: compareOptions.out,
      verdicts: templateOptions.out,
      out: path.join(temp, 'blank-results'),
      reviewDate: FIXTURE_DATE,
      sourceCommit: FIXTURE_COMMIT,
    }, config), /reviewer|fresh|blank/i);

    fillVerdicts(templateOptions.out);
    const labelledOnly = copyFixture(templateOptions.out, path.join(temp, 'verdict-labelled-only'));
    mutateJson(path.join(labelledOnly, 'verdicts', 'packet-001.json'), (value) => {
      value.rows[0].evidence_reviewed = {
        native_440: false,
        gameplay_300_unlabelled: false,
        actual_thumb_132_unlabelled: false,
        labelled_comparison: true,
        must_read_contract: false,
      };
    });
    await expectReject('labelled-only verdict', () => collect({
      comparison: compareOptions.out,
      verdicts: labelledOnly,
      out: path.join(temp, 'results-labelled-only'),
      reviewDate: FIXTURE_DATE,
      sourceCommit: FIXTURE_COMMIT,
    }, config), /evidence_reviewed\.(?:native_440|gameplay_300_unlabelled|actual_thumb_132_unlabelled|must_read_contract).*literal true/i);
    const thumbNotReviewed = copyFixture(templateOptions.out, path.join(temp, 'verdict-thumb-not-reviewed'));
    mutateJson(path.join(thumbNotReviewed, 'verdicts', 'packet-001.json'), (value) => {
      value.rows[0].evidence_reviewed.actual_thumb_132_unlabelled = false;
    });
    await expectReject('verdict omits actual-thumb review', () => collect({
      comparison: compareOptions.out,
      verdicts: thumbNotReviewed,
      out: path.join(temp, 'results-thumb-not-reviewed'),
      reviewDate: FIXTURE_DATE,
      sourceCommit: FIXTURE_COMMIT,
    }, config), /actual_thumb_132_unlabelled.*literal true/i);
    const collectionOptions = {
      comparison: compareOptions.out,
      verdicts: templateOptions.out,
      out: path.join(temp, 'results-a'),
      reviewDate: FIXTURE_DATE,
      sourceCommit: FIXTURE_COMMIT,
    };
    const collection = await collect(collectionOptions, config);
    assert(collection.results.tallies.PASS === 10 && collection.results.all_rows_literal_pass,
      'selftest all-PASS collection failed');
    const certificationOptions = {
      comparison: compareOptions.out,
      verdicts: templateOptions.out,
      results: collectionOptions.out,
      out: path.join(temp, 'certification-a'),
      reviewDate: FIXTURE_DATE,
      sourceCommit: FIXTURE_COMMIT,
    };
    const certification = await certify(certificationOptions, config);
    assert(certification.all_rows_literal_pass === true && certification.total_identities === 10,
      'selftest literal certification failed');

    await expectReject('existing comparison output', () => compare(compareOptions, config), /already exists/i);
    await expectReject('overlapping comparison output', () => compare({
      ...compareOptions, out: path.join(currentRoot, 'nested-output'),
    }, config), /overlap/i);
    await expectReject('same old/current root', () => compare({
      ...compareOptions, old: currentRoot, out: path.join(temp, 'same-root-output'),
    }, config), /distinct/i);
    await expectReject('stale source commit', () => compare({
      ...compareOptions, out: path.join(temp, 'stale-source-output'), sourceCommit: 'b'.repeat(40),
    }, config), /commit/i);
    const dirtyCurrent = copyFixture(currentRoot, path.join(temp, 'current-dirty-capture'));
    for (const relative of ['identity-manifest.json', 'review-info/manifest.json']) {
      mutateJson(path.join(dirtyCurrent, ...relative.split('/')), (value) => {
        value.capture_provenance.worktree_clean_after = false;
      });
    }
    await expectReject('dirty current capture provenance', () => compare({
      ...compareOptions, current: dirtyCurrent, out: path.join(temp, 'dirty-capture-output'),
    }, config), /not clean before and after/i);
    const unprovenancedCurrent = copyFixture(currentRoot, path.join(temp, 'current-unprovenanced'));
    mutateJson(path.join(unprovenancedCurrent, 'identity-manifest.json'), (value) => {
      value.schema = 'cf.gp71.identity-manifest.v1';
      delete value.capture_provenance;
    });
    mutateJson(path.join(unprovenancedCurrent, 'review-info', 'manifest.json'), (value) => {
      value.schema = 'cf.gp71.portrait-manifest.v1';
      delete value.capture_provenance;
    });
    await expectReject('unprovenanced current evidence', () => compare({
      ...compareOptions, current: unprovenancedCurrent, out: path.join(temp, 'unprovenanced-current-output'),
    }, config), /historical comparison side/i);
    await expectReject('existing certification output', () => certify(certificationOptions, config), /already exists/i);
    await expectReject('overlapping template output', () => createTemplates({
      ...templateOptions, out: path.join(compareOptions.out, 'nested-template'),
    }, config), /overlap/i);

    const linkedReal = path.join(temp, 'linked-real');
    const linkedParent = path.join(temp, 'linked-parent');
    fs.mkdirSync(linkedReal);
    fs.symlinkSync(linkedReal, linkedParent, process.platform === 'win32' ? 'junction' : 'dir');
    await expectReject('symlink output parent escape', () => Promise.resolve(validateNewOutput(
      path.join(linkedParent, 'escaped'), [compareOptions.out], 'selftest linked output',
    )), /link/i);

    const mutateLayout = async (name, mutate, pattern) => {
      const clone = copyFixture(layoutRoot, path.join(temp, `layout-${name}`));
      mutateJson(path.join(clone, 'index.json'), mutate);
      await expectReject(`layout ${name}`, () => compare({
        ...compareOptions, layout: clone, out: path.join(temp, `compare-${name}`),
      }, config), pattern);
    };
    await mutateLayout('stale-sha', (index) => { index.packets[0].rows[0].sha256 = 'c'.repeat(64); }, /SHA-256 differs/i);
    await mutateLayout('missing-identity', (index) => { index.packets[0].rows.pop(); }, /flattened|identit|ordinal/i);
    await mutateLayout('extra-identity', (index) => { index.packets[0].rows.push(deepClone(index.packets[0].rows[0])); }, /rows|ordinal|duplicate|identit/i);
    await mutateLayout('duplicate-identity', (index) => { index.packets[0].rows[1] = deepClone(index.packets[0].rows[0]); }, /ordinal|duplicate/i);
    await mutateLayout('reordered-identity', (index) => {
      [index.packets[0].rows[0], index.packets[0].rows[1]] = [index.packets[0].rows[1], index.packets[0].rows[0]];
    }, /ordinal/i);
    await mutateLayout('cross-set-identity', (index) => { index.packets[1].rows[0].set = 'earth-flora'; }, /set differs|identity/i);
    await mutateLayout('bat-split', (index) => {
      const moved = index.packets[0].rows.pop();
      index.packets[1].rows.push(moved);
    }, /set differs|bat|ordinal/i);
    await mutateLayout('invalid-family', (index) => { index.packets[1].family = 'PASS'; }, /not a family/i);
    const nonOfficialLayout = copyFixture(layoutRoot, path.join(temp, 'layout-non-233'));
    mutateJson(path.join(nonOfficialLayout, 'index.json'), (index) => { index.packet_size = 10; });
    await expectReject('non-233 official layout', () => compare({
      ...compareOptions, layout: nonOfficialLayout, out: path.join(temp, 'compare-non-233'),
    }, { ...config, officialLayout: true }), /requires exactly 233 packets/i);

    const badComparisonPath = copyFixture(compareOptions.out, path.join(temp, 'comparison-path-escape'));
    mutateJson(path.join(badComparisonPath, 'comparison-index.json'), (index) => {
      index.packets[0].sheet.file = 'sheets/../escape.png';
    });
    await expectReject('comparison path escape', () => Promise.resolve(loadComparison(
      badComparisonPath, FIXTURE_COMMIT, config,
    )), /traversal|stay inside/i);

    const badComparisonHash = copyFixture(compareOptions.out, path.join(temp, 'comparison-stale-sheet'));
    mutateJson(path.join(badComparisonHash, 'comparison-index.json'), (index) => {
      index.packets[0].sheet.sha256 = 'd'.repeat(64);
    });
    await expectReject('comparison stale sheet hash', () => Promise.resolve(loadComparison(
      badComparisonHash, FIXTURE_COMMIT, config,
    )), /disk SHA-256/i);

    const badComparisonDimension = copyFixture(compareOptions.out, path.join(temp, 'comparison-stale-dimension'));
    mutateJson(path.join(badComparisonDimension, 'comparison-index.json'), (index) => {
      index.packets[0].sheet.width++;
    });
    await expectReject('comparison stale sheet dimensions', () => Promise.resolve(loadComparison(
      badComparisonDimension, FIXTURE_COMMIT, config,
    )), /dimensions/i);

    const missingGameplay = copyFixture(compareOptions.out, path.join(temp, 'comparison-missing-gameplay'));
    const missingGameplayIndex = readJson(path.join(missingGameplay, 'comparison-index.json'), 'SELFTEST missing gameplay');
    const missingGameplayRelative = missingGameplayIndex.packets[0].rows[0].review_assets.gameplay_300_unlabelled.file;
    fs.rmSync(path.join(missingGameplay, ...missingGameplayRelative.split('/')));
    await expectReject('comparison missing gameplay 300', () => Promise.resolve(loadComparison(
      missingGameplay, FIXTURE_COMMIT, config,
    )), /does not exist|cannot read/i);

    const alteredGameplay = copyFixture(compareOptions.out, path.join(temp, 'comparison-altered-gameplay'));
    const alteredGameplayIndex = readJson(path.join(alteredGameplay, 'comparison-index.json'), 'SELFTEST altered gameplay');
    const alteredGameplayRelative = alteredGameplayIndex.packets[0].rows[0].review_assets.gameplay_300_unlabelled.file;
    fs.appendFileSync(path.join(alteredGameplay, ...alteredGameplayRelative.split('/')), Buffer.from('tampered'));
    await expectReject('comparison altered gameplay 300', () => Promise.resolve(loadComparison(
      alteredGameplay, FIXTURE_COMMIT, config,
    )), /disk SHA-256 differs/i);

    const missingActualThumb = copyFixture(compareOptions.out, path.join(temp, 'comparison-missing-actual-thumb'));
    const missingActualThumbIndex = readJson(
      path.join(missingActualThumb, 'comparison-index.json'), 'SELFTEST missing actual thumb',
    );
    const missingActualThumbRelative = missingActualThumbIndex.packets[0].rows[0]
      .review_assets.actual_thumb_132_unlabelled.file;
    fs.rmSync(path.join(missingActualThumb, ...missingActualThumbRelative.split('/')));
    await expectReject('comparison missing actual-thumb 132', () => Promise.resolve(loadComparison(
      missingActualThumb, FIXTURE_COMMIT, config,
    )), /does not exist|cannot read/i);

    const alteredActualThumb = copyFixture(compareOptions.out, path.join(temp, 'comparison-altered-actual-thumb'));
    const alteredActualThumbIndex = readJson(
      path.join(alteredActualThumb, 'comparison-index.json'), 'SELFTEST altered actual thumb',
    );
    const alteredActualThumbRelative = alteredActualThumbIndex.packets[0].rows[0]
      .review_assets.actual_thumb_132_unlabelled.file;
    fs.appendFileSync(path.join(alteredActualThumb, ...alteredActualThumbRelative.split('/')), Buffer.from('tampered'));
    await expectReject('comparison altered actual-thumb 132', () => Promise.resolve(loadComparison(
      alteredActualThumb, FIXTURE_COMMIT, config,
    )), /disk SHA-256 differs/i);

    const alteredMustRead = copyFixture(compareOptions.out, path.join(temp, 'comparison-altered-mustread'));
    mutateJson(path.join(alteredMustRead, 'comparison-index.json'), (index) => {
      index.packets[0].rows[0].must_read_contract.must_read[0] = 'altered criterion not bound by the original contract';
    });
    await expectReject('comparison altered mustRead', () => Promise.resolve(loadComparison(
      alteredMustRead, FIXTURE_COMMIT, config,
    )), /contract hash does not match/i);

    const badComparisonOrder = copyFixture(compareOptions.out, path.join(temp, 'comparison-reordered'));
    mutateJson(path.join(badComparisonOrder, 'comparison-index.json'), (index) => {
      [index.packets[0], index.packets[1]] = [index.packets[1], index.packets[0]];
    });
    await expectReject('comparison packet reorder', () => Promise.resolve(loadComparison(
      badComparisonOrder, FIXTURE_COMMIT, config,
    )), /packet_id/i);

    const verdictMutation = async (name, mutate, pattern, collectSuccess = false) => {
      const clone = copyFixture(templateOptions.out, path.join(temp, `verdict-${name}`));
      const first = path.join(clone, 'verdicts', 'packet-001.json');
      mutateJson(first, mutate);
      const out = path.join(temp, `results-${name}`);
      if (collectSuccess) return collect({ ...collectionOptions, verdicts: clone, out }, config);
      await expectReject(`verdict ${name}`, () => collect({ ...collectionOptions, verdicts: clone, out }, config), pattern);
      return null;
    };
    await verdictMutation('stale-ruler', (value) => { value.ruler = 'old ruler'; }, /ruler/i);
    await verdictMutation('stale-date', (value) => { value.review_date = '2026-08-08'; }, /date/i);
    await verdictMutation('stale-source', (value) => { value.source_commit = 'b'.repeat(40); }, /source commit/i);
    await verdictMutation('stale-packet-hash', (value) => {
      value.packet_hashes.current_rows_sha256 = 'c'.repeat(64);
    }, /packet hash|current packet hash/i);
    await verdictMutation('stale-portrait-hash', (value) => {
      value.rows[0].current_portrait_sha256 = 'd'.repeat(64);
    }, /portrait hash/i);
    await verdictMutation('missing-identity', (value) => { value.rows.pop(); }, /expected 4/i);
    await verdictMutation('duplicate-identity', (value) => { value.rows[1] = deepClone(value.rows[0]); }, /ordinal|species/i);
    await verdictMutation('reordered-identity', (value) => {
      [value.rows[0], value.rows[1]] = [value.rows[1], value.rows[0]];
    }, /ordinal/i);
    await verdictMutation('cross-set-identity', (value) => { value.rows[0].set = 'earth-flora'; }, /set/i);
    await verdictMutation('carried-field', (value) => { value.rows[0].carried_band = 'PASS'; }, /keys must be exactly/i);
    await verdictMutation('carried-reason', (value) => { value.rows[0].reason = 'This was copied from the previous verdict without a fresh inspection.'; }, /carried|copied/i);

    const missingVerdict = copyFixture(templateOptions.out, path.join(temp, 'verdict-missing-file'));
    fs.rmSync(path.join(missingVerdict, 'verdicts', 'packet-006.json'));
    await expectReject('missing verdict file', () => collect({
      ...collectionOptions, verdicts: missingVerdict, out: path.join(temp, 'results-missing-file'),
    }, config), /files do not exactly match|does not exist/i);

    const nonPassCollection = await verdictMutation('non-pass', (value) => {
      value.rows[0].band = 'POLISH';
      value.rows[0].reason = 'Observed wing attachment needs smoother integration with the torso before this portrait can pass.';
    }, null, true);
    await expectReject('non-PASS certification', () => certify({
      ...certificationOptions,
      verdicts: path.join(temp, 'verdict-non-pass'),
      results: nonPassCollection.root,
      out: path.join(temp, 'certification-non-pass'),
    }, config), /requires .* fresh PASS/i);

    const fabricatedResults = copyFixture(collectionOptions.out, path.join(temp, 'results-fabricated'));
    mutateJson(path.join(fabricatedResults, 'results.json'), (value) => { value.tallies.PASS = 9; });
    await expectReject('fabricated collection results', () => certify({
      ...certificationOptions,
      results: fabricatedResults,
      out: path.join(temp, 'certification-fabricated'),
    }, config), /does not exactly match/i);

    console.log('FULL RESET REVIEW SELFTEST PASS');
    console.log('  old/current exact two-root join and labelled packet compositor: PASS');
    console.log('  deterministic comparison/template output: PASS');
    console.log('  four reviewed bats remain together under Bats: PASS');
    console.log('  cross-kingdom same names remain set-scoped: PASS');
    console.log('  fresh hash-bound template, collector, and all-PASS certification: PASS');
    console.log('  fabricated/mixed/stale ruler, date, source, portrait, packet, and result hashes: rejected');
    console.log('  stale/wrong/dirty/unprovenanced current capture and non-233 official layout: rejected');
    console.log('  missing/altered gameplay 300 and altered exact mustRead contract: rejected');
    console.log('  missing/altered actual-thumb 132 surface: rejected');
    console.log('  labelled-only and actual-thumb-omitted verdicts: rejected');
    console.log('  missing/duplicate/reordered/cross-set/carried identities: rejected');
    console.log('  non-PASS literal certification: rejected');
    console.log('  existing/overlapping/path/symlink escape targets: rejected');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function parseArgs(args) {
  const options = {
    compare: false,
    template: false,
    collect: false,
    certify: false,
    selftest: false,
    help: false,
    layout: null,
    old: null,
    current: null,
    comparison: null,
    verdicts: null,
    results: null,
    out: null,
    reviewDate: null,
    sourceCommit: null,
  };
  const assign = (key, value, flag) => {
    assert(options[key] === null, `${flag} may be supplied only once`);
    options[key] = value;
  };
  for (const argument of args) {
    if (argument === '--compare') options.compare = true;
    else if (argument === '--template') options.template = true;
    else if (argument === '--collect') options.collect = true;
    else if (argument === '--certify') options.certify = true;
    else if (argument === '--selftest') options.selftest = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument.startsWith('--layout=')) assign('layout', argument.slice('--layout='.length), '--layout');
    else if (argument.startsWith('--old=')) assign('old', argument.slice('--old='.length), '--old/--old-evidence');
    else if (argument.startsWith('--old-evidence=')) assign('old', argument.slice('--old-evidence='.length), '--old/--old-evidence');
    else if (argument.startsWith('--current=')) assign('current', argument.slice('--current='.length), '--current/--current-evidence');
    else if (argument.startsWith('--current-evidence=')) assign('current', argument.slice('--current-evidence='.length), '--current/--current-evidence');
    else if (argument.startsWith('--comparison=')) assign('comparison', argument.slice('--comparison='.length), '--comparison');
    else if (argument.startsWith('--verdicts=')) assign('verdicts', argument.slice('--verdicts='.length), '--verdicts');
    else if (argument.startsWith('--results=')) assign('results', argument.slice('--results='.length), '--results');
    else if (argument.startsWith('--out=')) assign('out', argument.slice('--out='.length), '--out');
    else if (argument.startsWith('--review-date=')) assign('reviewDate', argument.slice('--review-date='.length), '--review-date');
    else if (argument.startsWith('--source-commit=')) assign('sourceCommit', argument.slice('--source-commit='.length), '--source-commit');
    else fail(`unknown argument: ${argument}`);
  }
  if (options.help) return options;
  const modes = [options.compare, options.template, options.collect, options.certify, options.selftest].filter(Boolean).length;
  assert(modes === 1, 'choose exactly one of --compare, --template, --collect, --certify, or --selftest');
  if (options.selftest) {
    assert(Object.entries(options).every(([key, value]) => ['selftest', 'help'].includes(key) || value === null || value === false),
      '--selftest accepts no input/output/provenance options');
    return options;
  }
  sourceCommit(options.sourceCommit);
  assert(typeof options.out === 'string' && options.out.trim(), 'this mode requires explicit --out');
  if (options.compare) {
    assert(options.layout && options.old && options.current,
      '--compare requires --layout, --old, and --current');
    assert(!options.comparison && !options.verdicts && !options.results && !options.reviewDate,
      '--compare received options for another mode');
  } else {
    assert(options.comparison, 'this mode requires --comparison');
    reviewDate(options.reviewDate);
    assert(!options.layout && !options.old && !options.current, 'review modes do not accept layout/evidence options');
    if (options.template) {
      assert(!options.verdicts && !options.results, '--template does not accept --verdicts or --results');
    } else if (options.collect) {
      assert(options.verdicts && !options.results, '--collect requires --verdicts and does not accept --results');
    } else {
      assert(options.verdicts && options.results, '--certify requires --verdicts and --results');
    }
  }
  return options;
}

function usage() {
  console.log('Usage:');
  console.log('  node tools/fullresetreview.mjs --compare --layout=<layout-dir> --old=<old-evidence> --current=<current-evidence> --out=<new-dir> --source-commit=<40-hex>');
  console.log('  node tools/fullresetreview.mjs --template --comparison=<comparison-dir> --out=<new-dir> --review-date=YYYY-MM-DD --source-commit=<40-hex>');
  console.log('  node tools/fullresetreview.mjs --collect --comparison=<comparison-dir> --verdicts=<filled-template-dir> --out=<new-dir> --review-date=YYYY-MM-DD --source-commit=<40-hex>');
  console.log('  node tools/fullresetreview.mjs --certify --comparison=<comparison-dir> --verdicts=<filled-template-dir> --results=<collection-dir> --out=<new-dir> --review-date=YYYY-MM-DD --source-commit=<40-hex>');
  console.log('  node tools/fullresetreview.mjs --selftest');
  console.log('');
  console.log('All output directories must be new, non-overlapping, link-free targets. No mode reads historical verdicts.');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) usage();
  else if (options.selftest) await runSelftest();
  else if (options.compare) await compare(options);
  else if (options.template) await createTemplates(options);
  else if (options.collect) await collect(options);
  else await certify(options);
}

const directInvocation = process.argv[1]
  && normalizedPath(process.argv[1]) === normalizedPath(fileURLToPath(import.meta.url));
if (directInvocation) {
  try {
    await run();
  } catch (error) {
    console.error('FULL RESET REVIEW FAILED');
    console.error(`  ${error.message}`);
    process.exitCode = 1;
  }
}
