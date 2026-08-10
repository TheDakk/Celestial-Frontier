/* gp71compare.mjs - fail-closed old-vs-current GP7.1 portrait comparison.

   The inputs are two immutable GP7.1 evidence roots produced by
   gp71rejudge.mjs plus one explicit family index from the current root. The
   tool validates all 1,250 identities, portrait-manifest joins, disk hashes,
   byte counts, and native dimensions before it writes anything. It then
   creates family-organized, labelled old/current PNG sheets and a
   machine-readable index in a NEW output directory.

   Usage:
     node tools/gp71compare.mjs --verify-only \
       --old-root=<gp71-evidence-root> \
       --current-root=<gp71-evidence-root> \
       --catalogue=<current-root/index.json>
     node tools/gp71compare.mjs \
       --old-root=<gp71-evidence-root> \
       --current-root=<gp71-evidence-root> \
       --catalogue=<current-root/index.json> \
       --out=<new-output-directory> \
       [--old-label=<label>] [--current-label=<label>]
     node tools/gp71compare.mjs --selftest

   Neither evidence root is ever written. The output must not exist and may
   not overlap either input root.
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const IDENTITY_SCHEMA = 'cf.gp71.identity-manifest.v1';
const PORTRAIT_SCHEMA = 'cf.gp71.portrait-manifest.v1';
const OUTPUT_SCHEMA = 'cf.gp71.portrait-comparison.v1';
const EXPECTED_SETS = Object.freeze({
  'earth-fauna': 631,
  'earth-flora': 332,
  'earth-fungi': 27,
  'earth-microbe': 20,
  procedural: 240,
});
const EXPECTED_PACKETS = 196;
const NATIVE_SIZE = 440;
const SPECIES_PER_SHEET = 8;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function portable(value) { return value.split(path.sep).join('/'); }
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function hashFile(file) { return sha256(fs.readFileSync(file)); }
function rowKey(set, species) { return `${set}\u0000${species}`; }
function nonempty(value, where) {
  assert(typeof value === 'string' && value.trim().length > 0, `${where}: must be a nonempty string`);
  const trimmed = value.trim();
  assert(!/[\u0000-\u001f\u007f]/.test(trimmed), `${where}: control characters are forbidden`);
  return trimmed;
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
function pngDimensions(buffer, where) {
  assert(Buffer.isBuffer(buffer) && buffer.length >= 24, `${where}: not a complete PNG`);
  assert(buffer.toString('hex', 0, 8) === '89504e470d0a1a0a', `${where}: not a PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
function expectedTotal(expectedSets) {
  return Object.values(expectedSets).reduce((sum, count) => sum + count, 0);
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
  const boundary = portraitRoot.endsWith(path.sep) ? portraitRoot : portraitRoot + path.sep;
  assert(file.startsWith(boundary), `${where}: resolved outside portrait root`);
  return file;
}
function listExactPortraitFiles(portraitRoot, expectedSets, label) {
  const top = fs.readdirSync(portraitRoot, { withFileTypes: true });
  const expectedNames = Object.keys(expectedSets).sort();
  const actualNames = top.map((entry) => entry.name).sort();
  assert(JSON.stringify(actualNames) === JSON.stringify(expectedNames),
    `${label}: portrait-root entries must be exactly ${expectedNames.join(', ')}; got ${actualNames.join(', ')}`);
  const files = [];
  for (const set of expectedNames) {
    const setDir = path.join(portraitRoot, set);
    const setStat = fs.lstatSync(setDir);
    assert(setStat.isDirectory() && !setStat.isSymbolicLink(), `${label}: ${set}/ must be a real directory`);
    for (const entry of fs.readdirSync(setDir, { withFileTypes: true })) {
      assert(entry.isFile() && !entry.isSymbolicLink(),
        `${label}: unexpected non-file or link in ${set}/: ${entry.name}`);
      assert(/\.png$/i.test(entry.name), `${label}: unexpected non-PNG in ${set}/: ${entry.name}`);
      files.push(`${set}/${entry.name}`);
    }
  }
  return files.sort();
}
function loadEvidence(rootValue, label, expectedSets = EXPECTED_SETS, nativeSize = NATIVE_SIZE) {
  const requestedRoot = path.resolve(rootValue);
  assert(fs.existsSync(requestedRoot), `${label}: evidence root does not exist: ${requestedRoot}`);
  const requestedStat = fs.lstatSync(requestedRoot);
  assert(requestedStat.isDirectory() && !requestedStat.isSymbolicLink(),
    `${label}: evidence root must be a real directory: ${requestedRoot}`);
  const root = fs.realpathSync(requestedRoot);
  const portraitRoot = path.join(root, 'portraits');
  assert(fs.existsSync(portraitRoot), `${label}: missing portraits/`);
  const portraitRootStat = fs.lstatSync(portraitRoot);
  assert(portraitRootStat.isDirectory() && !portraitRootStat.isSymbolicLink(),
    `${label}: portraits/ must be a real directory`);
  const identityFile = path.join(root, 'identity-manifest.json');
  const portraitManifestFile = path.join(root, 'review-info', 'manifest.json');
  const identitiesRaw = readJson(identityFile, `${label} identity manifest`);
  const manifestRaw = readJson(portraitManifestFile, `${label} portrait manifest`);
  assert(isObject(identitiesRaw) && identitiesRaw.schema === IDENTITY_SCHEMA && Array.isArray(identitiesRaw.rows),
    `${label} identity manifest: expected schema ${IDENTITY_SCHEMA} with rows[]`);
  assert(isObject(manifestRaw) && manifestRaw.schema === PORTRAIT_SCHEMA && Array.isArray(manifestRaw.files),
    `${label} portrait manifest: expected schema ${PORTRAIT_SCHEMA} with files[]`);
  validateRoster(identitiesRaw.rows, `${label} identity manifest`, expectedSets);
  assert(manifestRaw.portraits === expectedTotal(expectedSets),
    `${label} portrait manifest: expected portraits=${expectedTotal(expectedSets)}`);
  assert(manifestRaw.files.length === expectedTotal(expectedSets),
    `${label} portrait manifest: expected ${expectedTotal(expectedSets)} files, got ${manifestRaw.files.length}`);

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
  for (const [offset, raw] of identitiesRaw.rows.entries()) {
    const where = `${label} identity row ${offset + 1}`;
    const set = nonempty(raw.set, `${where}.set`);
    const species = nonempty(raw.species, `${where}.species`);
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
    const buffer = fs.readFileSync(file);
    const dimensions = pngDimensions(buffer, `${label} ${set}/${species}`);
    assert(dimensions.width === nativeSize && dimensions.height === nativeSize,
      `${label} ${set}/${species}: expected native ${nativeSize}x${nativeSize}, got ${dimensions.width}x${dimensions.height}`);
    assert(buffer.length === manifestRow.bytes,
      `${label} ${set}/${species}: byte count differs from portrait manifest`);
    const diskHash = sha256(buffer);
    assert(diskHash === recordedHash, `${label} ${set}/${species}: disk SHA-256 differs from manifests`);
    byKey.set(rowKey(set, species), {
      set, species, renderName: typeof raw.render_name === 'string' ? raw.render_name : species,
      imageFile, file, sha256: diskHash, bytes: buffer.length,
      width: dimensions.width, height: dimensions.height,
    });
  }
  assert(manifestByFile.size === seenFiles.size,
    `${label}: portrait manifest and identity manifest file counts differ`);
  for (const file of manifestByFile.keys()) {
    assert(seenFiles.has(file), `${label}: portrait manifest file has no identity: ${file}`);
  }
  const diskFiles = listExactPortraitFiles(portraitRoot, expectedSets, label);
  const recordedFiles = [...seenFiles].sort();
  assert(JSON.stringify(diskFiles) === JSON.stringify(recordedFiles),
    `${label}: disk portrait files do not exactly match the manifests`);

  const identityDigest = sha256([...byKey.values()]
    .sort((a, b) => rowKey(a.set, a.species).localeCompare(rowKey(b.set, b.species)))
    .map((row) => `${row.set}\u0000${row.species}\u0000${row.imageFile}\u0000${row.sha256}\n`).join(''));
  return {
    root, portraitRoot, byKey, rows: [...byKey.values()], identityDigest,
    identityManifestSha256: hashFile(identityFile),
    portraitManifestSha256: hashFile(portraitManifestFile),
  };
}

function loadCatalogue(fileValue, current, expectedSets = EXPECTED_SETS, expectedPackets = EXPECTED_PACKETS) {
  const file = path.resolve(fileValue);
  const raw = readJson(file, 'catalogue/family metadata');
  assert(Array.isArray(raw), 'catalogue/family metadata: expected a GP7.1 index array');
  assert(raw.length === expectedPackets,
    `catalogue/family metadata: expected ${expectedPackets} packets, got ${raw.length}`);
  const rows = [];
  for (const [offset, packet] of raw.entries()) {
    const where = `catalogue packet ${offset + 1}`;
    assert(isObject(packet), `${where}: must be an object`);
    const packetId = nonempty(packet.packet_id, `${where}.packet_id`);
    assert(packetId === String(offset + 1).padStart(3, '0'), `${where}: unexpected packet_id ${packetId}`);
    const family = nonempty(packet.family, `${where}.family`);
    assert(Array.isArray(packet.species) && packet.species.length > 0 && packet.species.length <= 14,
      `${where}.species: expected 1-14 rows`);
    for (const [memberOffset, member] of packet.species.entries()) {
      const memberWhere = `${where} row ${memberOffset + 1}`;
      assert(isObject(member), `${memberWhere}: must be an object`);
      const set = nonempty(member.set, `${memberWhere}.set`);
      const species = nonempty(member.name ?? member.species, `${memberWhere}.name`);
      const currentRow = current.byKey.get(rowKey(set, species));
      assert(currentRow, `${memberWhere}: identity absent from current evidence (${set}/${species})`);
      const imageFile = safeRelativeImage(member.image_file, set, `${memberWhere}.image_file`);
      const recordedHash = nonempty(member.sha256, `${memberWhere}.sha256`).toLowerCase();
      assert(imageFile === currentRow.imageFile,
        `${memberWhere}: image file differs from current identity manifest`);
      assert(recordedHash === currentRow.sha256,
        `${memberWhere}: SHA-256 differs from current evidence`);
      rows.push({ packetId, family, set, species });
    }
  }
  validateRoster(rows, 'catalogue/family metadata', expectedSets);
  for (const key of current.byKey.keys()) {
    assert(rows.some((row) => rowKey(row.set, row.species) === key),
      `catalogue/family metadata: current identity is missing (${key.replace('\u0000', '/')})`);
  }
  return { file, rows, sha256: hashFile(file) };
}

function joinComparison(oldEvidence, currentEvidence, catalogue, expectedSets = EXPECTED_SETS) {
  assert(oldEvidence.byKey.size === currentEvidence.byKey.size,
    'old/current evidence: identity counts differ');
  for (const key of oldEvidence.byKey.keys()) {
    assert(currentEvidence.byKey.has(key),
      `old/current evidence: current root is missing ${key.replace('\u0000', '/')}`);
  }
  for (const key of currentEvidence.byKey.keys()) {
    assert(oldEvidence.byKey.has(key),
      `old/current evidence: old root is missing ${key.replace('\u0000', '/')}`);
  }
  validateRoster(catalogue.rows, 'comparison catalogue', expectedSets);
  return catalogue.rows.map((metadata, ordinal) => {
    const key = rowKey(metadata.set, metadata.species);
    const oldRow = oldEvidence.byKey.get(key);
    const currentRow = currentEvidence.byKey.get(key);
    assert(oldRow && currentRow, `comparison join: missing ${metadata.set}/${metadata.species}`);
    assert(oldRow.imageFile === currentRow.imageFile,
      `comparison join: old/current image-file mapping differs for ${metadata.set}/${metadata.species}`);
    return {
      ordinal: ordinal + 1,
      packetId: metadata.packetId,
      family: metadata.family,
      set: metadata.set,
      species: metadata.species,
      changed: oldRow.sha256 !== currentRow.sha256,
      old: oldRow,
      current: currentRow,
    };
  });
}

function normalizedPath(value) {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}
function isWithin(childValue, parentValue) {
  const child = normalizedPath(childValue);
  const parent = normalizedPath(parentValue);
  return child === parent || child.startsWith(parent.endsWith(path.sep) ? parent : parent + path.sep);
}
function validateOutputTarget(outValue, oldRoot, currentRoot) {
  const out = path.resolve(outValue);
  assert(!fs.existsSync(out), `output already exists: ${out}`);
  assert(!isWithin(out, oldRoot) && !isWithin(oldRoot, out),
    'output must not overlap the old evidence root');
  assert(!isWithin(out, currentRoot) && !isWithin(currentRoot, out),
    'output must not overlap the current evidence root');
  const parent = path.dirname(out);
  assert(fs.existsSync(parent) && fs.statSync(parent).isDirectory(),
    `output parent must already exist: ${parent}`);
  return out;
}
function safeSlug(value) {
  const stem = value.normalize('NFKD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'family';
  return `${stem.slice(0, 64)}-${sha256(value).slice(0, 8)}`;
}
function publicPortrait(row) {
  return {
    image_file: row.imageFile,
    sha256: row.sha256,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
  };
}

async function openCdp() {
  assert(fs.existsSync(EDGE), `comparison sheets require Edge at ${EDGE}`);
  const userData = path.join(os.tmpdir(), `cf-gp71-compare-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
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
    fail(`comparison sheets: Edge CDP did not start${stderr ? ` (${stderr.trim().slice(-240)})` : ''}`);
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
        fail(`comparison canvas failed: ${String(result.exceptionDetails.exception?.description || result.exceptionDetails.text).slice(0, 400)}`);
      }
      return result.result.value;
    },
    close() {
      try { ws.close(); } finally { edge.kill(); }
    },
  };
}

async function composeSheet(browser, family, page, pageCount, rows, labels) {
  const items = rows.map((row) => ({
    set: row.set,
    species: row.species,
    changed: row.changed,
    oldHash: row.old.sha256.slice(0, 10),
    currentHash: row.current.sha256.slice(0, 10),
    oldUrl: `data:image/png;base64,${fs.readFileSync(row.old.file).toString('base64')}`,
    currentUrl: `data:image/png;base64,${fs.readFileSync(row.current.file).toString('base64')}`,
  }));
  const payload = JSON.stringify({ family, page, pageCount, items, labels });
  const expression = `(()=>new Promise(async(resolve)=>{
    const data=${payload}, IW=250, IH=250, PAD=20, GAP=12, PAIR=IW*2+GAP, BLOCK_W=PAIR+PAD*2;
    const BLOCK_H=IH+76, COLS=2, ROWS=Math.ceil(data.items.length/COLS), W=BLOCK_W*COLS, H=84+ROWS*BLOCK_H+20;
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const c=cv.getContext('2d'); c.fillStyle='#070b12'; c.fillRect(0,0,W,H);
    c.textBaseline='middle'; c.fillStyle='#e9d7af'; c.font='bold 24px Georgia,serif'; c.textAlign='left';
    c.fillText(data.family+' - '+data.page+'/'+data.pageCount,20,28);
    c.fillStyle='#93a9c7'; c.font='14px system-ui,sans-serif';
    c.fillText(data.labels.old+'  vs  '+data.labels.current,20,58);
    const failed=[];
    function fit(text,max){ if(c.measureText(text).width<=max)return text; let s=text; while(s.length>4&&c.measureText(s+'...').width>max)s=s.slice(0,-1); return s+'...'; }
    async function image(url,label){ return await new Promise(done=>{ const im=new Image(); im.onload=()=>done(im); im.onerror=()=>{failed.push(label);done(null)}; im.src=url; }); }
    for(let i=0;i<data.items.length;i++){
      const item=data.items[i], col=i%COLS, row=Math.floor(i/COLS), x=col*BLOCK_W+PAD, y=84+row*BLOCK_H;
      c.fillStyle=item.changed?'#3b2b12':'#14251e'; c.fillRect(x-8,y-8,PAIR+16,IH+68);
      c.strokeStyle=item.changed?'#c8953f':'#43866c'; c.lineWidth=2; c.strokeRect(x-8,y-8,PAIR+16,IH+68);
      c.fillStyle='#eef3fb'; c.font='bold 16px system-ui,sans-serif'; c.textAlign='left';
      c.fillText(fit(item.species+' ['+item.set+']',PAIR-116),x,y+12);
      c.textAlign='right'; c.fillStyle=item.changed?'#f1ba60':'#72c69d'; c.font='bold 13px system-ui,sans-serif';
      c.fillText(item.changed?'CHANGED':'BYTE-IDENTICAL',x+PAIR,y+12);
      c.textAlign='center'; c.fillStyle='#9fb2cd'; c.font='12px system-ui,sans-serif';
      c.fillText(data.labels.old+' '+item.oldHash,x+IW/2,y+36); c.fillText(data.labels.current+' '+item.currentHash,x+IW+GAP+IW/2,y+36);
      const oldIm=await image(item.oldUrl,item.species+' old'), currentIm=await image(item.currentUrl,item.species+' current');
      if(oldIm)c.drawImage(oldIm,x,y+50,IW,IH); if(currentIm)c.drawImage(currentIm,x+IW+GAP,y+50,IW,IH);
    }
    resolve({url:cv.toDataURL('image/png'),failed,width:W,height:H});
  }))()`;
  const result = await browser.evaluate(expression);
  assert(isObject(result) && typeof result.url === 'string' && result.url.startsWith('data:image/png;base64,'),
    `family ${family} page ${page}: canvas did not return a PNG`);
  assert(Array.isArray(result.failed) && result.failed.length === 0,
    `family ${family} page ${page}: image decode failed for ${result.failed.join(', ')}`);
  const buffer = Buffer.from(result.url.slice('data:image/png;base64,'.length), 'base64');
  const dimensions = pngDimensions(buffer, `family ${family} page ${page}`);
  assert(dimensions.width === result.width && dimensions.height === result.height,
    `family ${family} page ${page}: PNG dimensions differ from canvas`);
  return { buffer, width: dimensions.width, height: dimensions.height };
}

function evidenceUnchanged(before, after, label) {
  assert(before.identityDigest === after.identityDigest, `${label}: portrait identity/hash digest changed during comparison`);
  assert(before.identityManifestSha256 === after.identityManifestSha256, `${label}: identity manifest changed during comparison`);
  assert(before.portraitManifestSha256 === after.portraitManifestSha256, `${label}: portrait manifest changed during comparison`);
}

async function generate(options) {
  const oldEvidence = loadEvidence(options.oldRoot, 'old evidence');
  const currentEvidence = loadEvidence(options.currentRoot, 'current evidence');
  assert(normalizedPath(oldEvidence.root) !== normalizedPath(currentEvidence.root),
    'old and current evidence roots must be distinct');
  const catalogue = loadCatalogue(options.catalogue, currentEvidence);
  const rows = joinComparison(oldEvidence, currentEvidence, catalogue);
  const out = validateOutputTarget(options.out, oldEvidence.root, currentEvidence.root);
  const stage = fs.mkdtempSync(path.join(path.dirname(out), '.gp71-compare-stage-'));
  const labels = {
    old: options.oldLabel || path.basename(oldEvidence.root),
    current: options.currentLabel || path.basename(currentEvidence.root),
  };
  let browser = null;
  try {
    browser = await openCdp();
    const byFamily = new Map();
    for (const row of rows) {
      if (!byFamily.has(row.family)) byFamily.set(row.family, []);
      byFamily.get(row.family).push(row);
    }
    const sheetRecords = [];
    const rowRecords = [];
    let completedSheets = 0;
    const totalSheets = [...byFamily.values()].reduce((sum, members) => sum + Math.ceil(members.length / SPECIES_PER_SHEET), 0);
    for (const [family, members] of byFamily.entries()) {
      const familyDir = safeSlug(family);
      const pageCount = Math.ceil(members.length / SPECIES_PER_SHEET);
      for (let pageOffset = 0; pageOffset < pageCount; pageOffset++) {
        const page = pageOffset + 1;
        const pageRows = members.slice(pageOffset * SPECIES_PER_SHEET, page * SPECIES_PER_SHEET);
        const composed = await composeSheet(browser, family, page, pageCount, pageRows, labels);
        const relative = `sheets/${familyDir}/sheet-${String(page).padStart(3, '0')}.png`;
        const disk = path.join(stage, ...relative.split('/'));
        fs.mkdirSync(path.dirname(disk), { recursive: true });
        fs.writeFileSync(disk, composed.buffer);
        const sheetHash = sha256(composed.buffer);
        sheetRecords.push({
          family, page, pages: pageCount, file: relative, sha256: sheetHash,
          width: composed.width, height: composed.height, species: pageRows.length,
        });
        for (const [slot, row] of pageRows.entries()) {
          rowRecords.push({
            ordinal: row.ordinal,
            source_packet_id: row.packetId,
            family: row.family,
            set: row.set,
            species: row.species,
            changed: row.changed,
            old: publicPortrait(row.old),
            current: publicPortrait(row.current),
            sheet: relative,
            sheet_sha256: sheetHash,
            slot: { index: slot, column: slot % 2, row: Math.floor(slot / 2) },
          });
        }
        completedSheets++;
        if (completedSheets % 25 === 0 || completedSheets === totalSheets) {
          console.log(`  ... ${completedSheets}/${totalSheets} comparison sheets`);
        }
      }
    }
    rowRecords.sort((a, b) => a.ordinal - b.ordinal);
    const setSummary = {};
    for (const set of Object.keys(EXPECTED_SETS)) {
      const setRows = rows.filter((row) => row.set === set);
      setSummary[set] = {
        total: setRows.length,
        changed: setRows.filter((row) => row.changed).length,
        byte_identical: setRows.filter((row) => !row.changed).length,
      };
    }
    const familySummary = [...byFamily.entries()].map(([family, members]) => ({
      family,
      total: members.length,
      changed: members.filter((row) => row.changed).length,
      byte_identical: members.filter((row) => !row.changed).length,
      sheets: Math.ceil(members.length / SPECIES_PER_SHEET),
    }));
    const output = {
      schema: OUTPUT_SCHEMA,
      contract: 'Two immutable, exact 1,250-portrait evidence roots joined by set/species and grouped by the explicit current family index.',
      labels,
      inputs: {
        old: {
          identity_sha256: oldEvidence.identityDigest,
          identity_manifest_sha256: oldEvidence.identityManifestSha256,
          portrait_manifest_sha256: oldEvidence.portraitManifestSha256,
        },
        current: {
          identity_sha256: currentEvidence.identityDigest,
          identity_manifest_sha256: currentEvidence.identityManifestSha256,
          portrait_manifest_sha256: currentEvidence.portraitManifestSha256,
        },
        catalogue_sha256: catalogue.sha256,
      },
      summary: {
        portraits: rows.length,
        changed: rows.filter((row) => row.changed).length,
        byte_identical: rows.filter((row) => !row.changed).length,
        families: byFamily.size,
        sheets: sheetRecords.length,
        sets: setSummary,
        family_rows: familySummary,
      },
      sheets: sheetRecords,
      rows: rowRecords,
    };
    writeJson(path.join(stage, 'comparison-index.json'), output);

    const oldAfter = loadEvidence(options.oldRoot, 'old evidence postflight');
    const currentAfter = loadEvidence(options.currentRoot, 'current evidence postflight');
    evidenceUnchanged(oldEvidence, oldAfter, 'old evidence');
    evidenceUnchanged(currentEvidence, currentAfter, 'current evidence');
    assert(hashFile(catalogue.file) === catalogue.sha256, 'catalogue/family metadata changed during comparison');
    fs.renameSync(stage, out);
    console.log('GP7.1 PORTRAIT COMPARISON PASS');
    console.log(`  exact identities: ${rows.length}`);
    console.log(`  changed: ${output.summary.changed}; byte-identical: ${output.summary.byte_identical}`);
    console.log(`  family sheets: ${sheetRecords.length}`);
    console.log(`  index: ${path.join(out, 'comparison-index.json')}`);
    console.log('  input evidence roots: hash-verified before and after; never written');
  } finally {
    if (browser) browser.close();
    if (fs.existsSync(stage)) fs.rmSync(stage, { recursive: true, force: true });
  }
}

function verifyOnly(options) {
  const oldEvidence = loadEvidence(options.oldRoot, 'old evidence');
  const currentEvidence = loadEvidence(options.currentRoot, 'current evidence');
  assert(normalizedPath(oldEvidence.root) !== normalizedPath(currentEvidence.root),
    'old and current evidence roots must be distinct');
  const catalogue = loadCatalogue(options.catalogue, currentEvidence);
  const rows = joinComparison(oldEvidence, currentEvidence, catalogue);
  console.log('GP7.1 PORTRAIT COMPARISON INPUTS PASS');
  console.log(`  exact identities: ${rows.length}`);
  console.log(`  changed: ${rows.filter((row) => row.changed).length}; byte-identical: ${rows.filter((row) => !row.changed).length}`);
  for (const set of Object.keys(EXPECTED_SETS)) {
    const setRows = rows.filter((row) => row.set === set);
    console.log(`  ${set}: ${setRows.filter((row) => row.changed).length} changed / ${setRows.length}`);
  }
  console.log('  no output written');
}

function fakePng(width, height, tag) {
  const buffer = Buffer.alloc(32, tag.charCodeAt(0));
  Buffer.from('89504e470d0a1a0a', 'hex').copy(buffer, 0);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}
function validFixturePng(tag) {
  const onePixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  return Buffer.concat([onePixel, Buffer.from(tag)]);
}
function writeFixtureEvidence(root, definitions, size = 1) {
  const rows = [];
  const files = [];
  for (const definition of definitions) {
    const imageFile = `${definition.set}/${definition.species}.png`;
    const width = definition.width ?? size;
    const height = definition.height ?? size;
    const buffer = width === 1 && height === 1
      ? validFixturePng(definition.tag)
      : fakePng(width, height, definition.tag);
    const hash = sha256(buffer);
    const disk = path.join(root, 'portraits', ...imageFile.split('/'));
    fs.mkdirSync(path.dirname(disk), { recursive: true });
    fs.writeFileSync(disk, buffer);
    rows.push({ set: definition.set, species: definition.species, render_name: definition.species, image_file: imageFile, sha256: hash });
    files.push({ set: definition.set, file: imageFile, sha256: hash, bytes: buffer.length, width: definition.width ?? size, height: definition.height ?? size });
  }
  writeJson(path.join(root, 'identity-manifest.json'), { schema: IDENTITY_SCHEMA, rows });
  writeJson(path.join(root, 'review-info', 'manifest.json'), {
    schema: PORTRAIT_SCHEMA, portraits: rows.length, files,
  });
  return { rows, files };
}
function writeFixtureCatalogue(file, evidence, family = 'Fixture family') {
  writeJson(file, [{
    packet_id: '001', family,
    species: evidence.rows.map((row) => ({
      set: row.set, name: row.species, image_file: row.image_file, sha256: row.sha256,
    })),
  }]);
}
function expectRejected(label, work, pattern) {
  let caught = null;
  try { work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected defect was accepted`);
  assert(pattern.test(caught.message), `SELFTEST ${label}: wrong rejection (${caught.message})`);
}
async function runSelftest() {
  const fixtureSets = Object.freeze({ fixture: 2 });
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-gp71-compare-selftest-'));
  try {
    const oldRoot = path.join(temp, 'old');
    const currentRoot = path.join(temp, 'current');
    writeFixtureEvidence(oldRoot, [
      { set: 'fixture', species: 'Alpha', tag: 'A' },
      { set: 'fixture', species: 'Beta', tag: 'B' },
    ]);
    const currentFixture = writeFixtureEvidence(currentRoot, [
      { set: 'fixture', species: 'Alpha', tag: 'C' },
      { set: 'fixture', species: 'Beta', tag: 'B' },
    ]);
    const catalogueFile = path.join(temp, 'catalogue.json');
    writeFixtureCatalogue(catalogueFile, currentFixture);
    const oldEvidence = loadEvidence(oldRoot, 'fixture old', fixtureSets, 1);
    const currentEvidence = loadEvidence(currentRoot, 'fixture current', fixtureSets, 1);
    const catalogue = loadCatalogue(catalogueFile, currentEvidence, fixtureSets, 1);
    const joined = joinComparison(oldEvidence, currentEvidence, catalogue, fixtureSets);
    assert(joined.length === 2 && joined[0].changed === true && joined[1].changed === false,
      'SELFTEST positive comparison did not distinguish changed and byte-identical portraits');
    let browser = null;
    try {
      browser = await openCdp();
      const sheet = await composeSheet(browser, 'Fixture family', 1, 1, joined, { old: 'OLD', current: 'CURRENT' });
      const dimensions = pngDimensions(sheet.buffer, 'SELFTEST comparison sheet');
      assert(dimensions.width === sheet.width && dimensions.height === sheet.height && sheet.buffer.length > 100,
        'SELFTEST comparison compositor did not produce a complete PNG');
    } finally {
      if (browser) browser.close();
    }

    const staleRoot = path.join(temp, 'stale');
    writeFixtureEvidence(staleRoot, [
      { set: 'fixture', species: 'Alpha', tag: 'A' },
      { set: 'fixture', species: 'Beta', tag: 'B' },
    ]);
    const staleIdentityFile = path.join(staleRoot, 'identity-manifest.json');
    const staleIdentity = readJson(staleIdentityFile, 'fixture stale identity');
    staleIdentity.rows[0].sha256 = '0'.repeat(64);
    writeJson(staleIdentityFile, staleIdentity);
    expectRejected('stale identity hash', () => loadEvidence(staleRoot, 'fixture stale', fixtureSets, 1), /differs from portrait manifest/);

    const missingRoot = path.join(temp, 'missing');
    writeFixtureEvidence(missingRoot, [
      { set: 'fixture', species: 'Alpha', tag: 'A' },
      { set: 'fixture', species: 'Beta', tag: 'B' },
    ]);
    fs.rmSync(path.join(missingRoot, 'portraits', 'fixture', 'Beta.png'));
    expectRejected('missing portrait', () => loadEvidence(missingRoot, 'fixture missing', fixtureSets, 1), /missing portrait/);

    const dimensionRoot = path.join(temp, 'dimension');
    writeFixtureEvidence(dimensionRoot, [
      { set: 'fixture', species: 'Alpha', tag: 'A', width: 2, height: 1 },
      { set: 'fixture', species: 'Beta', tag: 'B' },
    ]);
    expectRejected('wrong native dimensions', () => loadEvidence(dimensionRoot, 'fixture dimension', fixtureSets, 1), /expected 1x1/);

    const extraRoot = path.join(temp, 'extra');
    writeFixtureEvidence(extraRoot, [
      { set: 'fixture', species: 'Alpha', tag: 'A' },
      { set: 'fixture', species: 'Beta', tag: 'B' },
    ]);
    fs.writeFileSync(path.join(extraRoot, 'portraits', 'fixture', 'Extra.png'), fakePng(1, 1, 'X'));
    expectRejected('extra portrait', () => loadEvidence(extraRoot, 'fixture extra', fixtureSets, 1), /do not exactly match/);

    const misjoinFile = path.join(temp, 'misjoin.json');
    writeFixtureCatalogue(misjoinFile, currentFixture);
    const misjoin = readJson(misjoinFile, 'fixture misjoin');
    misjoin[0].species[0].image_file = misjoin[0].species[1].image_file;
    writeJson(misjoinFile, misjoin);
    expectRejected('catalogue identity misjoin', () => loadCatalogue(misjoinFile, currentEvidence, fixtureSets, 1), /image file differs/);

    const rootMisjoin = path.join(temp, 'root-misjoin');
    writeFixtureEvidence(rootMisjoin, [
      { set: 'fixture', species: 'Alpha', tag: 'A' },
      { set: 'fixture', species: 'Beta', tag: 'B' },
    ]);
    const rootMisjoinFile = path.join(rootMisjoin, 'identity-manifest.json');
    const rootMisjoinIdentity = readJson(rootMisjoinFile, 'fixture root misjoin');
    const firstFile = rootMisjoinIdentity.rows[0].image_file;
    const firstHash = rootMisjoinIdentity.rows[0].sha256;
    rootMisjoinIdentity.rows[0].image_file = rootMisjoinIdentity.rows[1].image_file;
    rootMisjoinIdentity.rows[0].sha256 = rootMisjoinIdentity.rows[1].sha256;
    rootMisjoinIdentity.rows[1].image_file = firstFile;
    rootMisjoinIdentity.rows[1].sha256 = firstHash;
    writeJson(rootMisjoinFile, rootMisjoinIdentity);
    const misjoinedEvidence = loadEvidence(rootMisjoin, 'fixture root misjoin', fixtureSets, 1);
    expectRejected('cross-root identity misjoin',
      () => joinComparison(misjoinedEvidence, currentEvidence, catalogue, fixtureSets), /image-file mapping differs/);

    const wrongHashFile = path.join(temp, 'wrong-hash.json');
    writeFixtureCatalogue(wrongHashFile, currentFixture);
    const wrongHash = readJson(wrongHashFile, 'fixture wrong hash');
    wrongHash[0].species[0].sha256 = 'f'.repeat(64);
    writeJson(wrongHashFile, wrongHash);
    expectRejected('catalogue stale hash', () => loadCatalogue(wrongHashFile, currentEvidence, fixtureSets, 1), /SHA-256 differs/);

    expectRejected('overlapping output',
      () => validateOutputTarget(path.join(oldRoot, 'comparison'), oldRoot, currentRoot), /must not overlap/);
    console.log('GP7.1 PORTRAIT COMPARISON SELFTEST PASS');
    console.log('  valid exact join + changed/identical classification: PASS');
    console.log('  labelled old/current PNG compositor: PASS');
    console.log('  stale identity hash: rejected');
    console.log('  missing portrait: rejected');
    console.log('  wrong native dimensions: rejected');
    console.log('  extra portrait: rejected');
    console.log('  catalogue identity misjoin: rejected');
    console.log('  cross-root identity misjoin: rejected');
    console.log('  catalogue stale hash: rejected');
    console.log('  overlapping output: rejected');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function parseArgs(args) {
  const options = { selftest: false, verifyOnly: false, help: false };
  for (const argument of args) {
    if (argument === '--selftest') options.selftest = true;
    else if (argument === '--verify-only') options.verifyOnly = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument.startsWith('--old-root=')) options.oldRoot = argument.slice('--old-root='.length);
    else if (argument.startsWith('--current-root=')) options.currentRoot = argument.slice('--current-root='.length);
    else if (argument.startsWith('--catalogue=')) options.catalogue = argument.slice('--catalogue='.length);
    else if (argument.startsWith('--out=')) options.out = argument.slice('--out='.length);
    else if (argument.startsWith('--old-label=')) options.oldLabel = argument.slice('--old-label='.length);
    else if (argument.startsWith('--current-label=')) options.currentLabel = argument.slice('--current-label='.length);
    else fail(`unknown argument: ${argument}`);
  }
  if (!options.help && !options.selftest) {
    for (const key of ['oldRoot', 'currentRoot', 'catalogue']) {
      assert(typeof options[key] === 'string' && options[key].length > 0, `missing required --${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`);
    }
    if (!options.verifyOnly) {
      assert(typeof options.out === 'string' && options.out.length > 0, 'missing required --out');
    }
    if (options.oldLabel !== undefined) nonempty(options.oldLabel, '--old-label');
    if (options.currentLabel !== undefined) nonempty(options.currentLabel, '--current-label');
  }
  assert(!(options.selftest && options.verifyOnly), '--selftest and --verify-only are mutually exclusive');
  if (options.selftest) {
    assert(options.oldRoot === undefined && options.currentRoot === undefined && options.catalogue === undefined
      && options.out === undefined && options.oldLabel === undefined && options.currentLabel === undefined,
    '--selftest does not accept comparison inputs');
  }
  if (options.verifyOnly) {
    assert(options.out === undefined && options.oldLabel === undefined && options.currentLabel === undefined,
      '--verify-only does not accept output or display-label options');
  }
  return options;
}
function usage() {
  console.log('Usage:');
  console.log('  node tools/gp71compare.mjs --verify-only --old-root=<gp71-root> --current-root=<gp71-root> --catalogue=<current-index.json>');
  console.log('  node tools/gp71compare.mjs --old-root=<gp71-root> --current-root=<gp71-root> --catalogue=<current-index.json> --out=<new-dir> [--old-label=<label>] [--current-label=<label>]');
  console.log('  node tools/gp71compare.mjs --selftest');
  console.log('');
  console.log('Each evidence root must contain portraits/, identity-manifest.json, and review-info/manifest.json.');
  console.log('The catalogue must be the hash-bound 196-packet index.json belonging to the current root.');
  console.log('The output must be new and disjoint from both immutable evidence roots.');
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) usage();
  else if (options.selftest) await runSelftest();
  else if (options.verifyOnly) verifyOnly(options);
  else await generate(options);
} catch (error) {
  console.error('GP7.1 PORTRAIT COMPARISON FAILED');
  console.error(`  ${error.message}`);
  process.exitCode = 1;
}
