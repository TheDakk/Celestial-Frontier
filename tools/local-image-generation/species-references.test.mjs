import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadSpeciesReferenceSet, referenceImageDimensions, SPECIES_REFERENCE_SET } from './species-references.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ORDER = ['Civet', 'Persimmon', 'Platypus', 'Frog', "Devil's Club", 'Cranberry'];
const HASHES = [
  '186d76da888a4d6a1393eef85b0c47dfc3fd4f9653258dad3bdc027c4e400365',
  '36aec0bc09432255b4351b22a2b99bde55f85a0f7eab309bb62dab46b88164d9',
  '0b4584f76ce18f42e38e0c28e9a42758280d0c0de390d45371422a7e4c91fe57',
  '53d4edb530e4691dffb6000b58be6ed2076302a544deec04217d64a03ef08b17',
  'c2474e48a1a38fb2419fe01008a3906d5727b7e520f8867f954b6d8ed7ac94fc',
  '31be9a75a0bdea51580435c6bf1f4a03b44d3f7fd6e80aa6537893f92a8f6b93',
];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
let temporary, sourceRoot, originalManifest, manifestBytes, releaseWorkspace;
const load = () => loadSpeciesReferenceSet({ sourceRoot });
before(async () => {
  temporary = await fs.mkdtemp('/private/tmp/cf-species-reference-controls-');
  sourceRoot = path.join(temporary, 'source');
  manifestBytes = await fs.readFile(path.join(ROOT, SPECIES_REFERENCE_SET));
  originalManifest = JSON.parse(manifestBytes);
  for (const source of [SPECIES_REFERENCE_SET, ...new Set(originalManifest.references.map(row => row.source))]) {
    const target = path.join(sourceRoot, source);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(ROOT, source), target);
  }
  console.log('Test-owned source copies: ' + temporary);
});
after(async () => {
  try {
    assert.deepEqual(await fs.readFile(path.join(ROOT, SPECIES_REFERENCE_SET)), manifestBytes);
    for (const row of originalManifest.references) {
      assert.equal(sha(await fs.readFile(path.join(ROOT, row.source))), row.sha256);
    }
    if (temporary) await fs.rm(temporary, { recursive: true, force: true });
  } finally { releaseWorkspace?.(); }
});
async function manifestMutation(mutate, expected = /Anatomical|anatomical|Invalid/, verifyRestoration = true) {
  const changed = structuredClone(originalManifest);
  mutate(changed);
  const file = path.join(sourceRoot, SPECIES_REFERENCE_SET);
  try {
    await fs.writeFile(file, JSON.stringify(changed));
    await assert.rejects(load(), expected);
  } finally { await fs.writeFile(file, manifestBytes); }
  if (verifyRestoration) assert.equal((await load()).manifestSha256, sha(manifestBytes));
}
async function assetMutation(index, mutate, expected) {
  const file = path.join(sourceRoot, originalManifest.references[index].source);
  const original = await fs.readFile(file);
  try {
    await mutate(file, Buffer.from(original));
    await assert.rejects(load(), expected);
  } finally {
    await fs.rm(file, { force: true });
    await fs.writeFile(file, original, { flag: 'wx' });
  }
  assert.equal((await load()).references[index].sha256, sha(original));
}

test('real six-image set returns exact reviewed source hashes in canonical full-identity order', async () => {
  const value = await loadSpeciesReferenceSet();
  assert.deepEqual(originalManifest.references.map(row => row.name), ORDER);
  assert.deepEqual(value.references.map(row => row.sha256), HASHES);
  assert.deepEqual(value.references.map(row => row.imageIndex), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(value.references.map(row => row.speciesVisualKey), originalManifest.references.map(row => row.speciesVisualKey));
  assert.equal(value.sourceSnapshotDigest, '36e850b41c3b5f4ae7b1edc9f23319e8af58a36a6bf903e3960e94596fcd793a');
  assert.equal(value.totalBytes, 11018214);
  assert.equal(value.manifestSha256, sha(manifestBytes));
  assert.ok(Object.isFrozen(value) && Object.isFrozen(value.references) && value.references.every(Object.isFrozen));
  assert.ok(value.references.every(row => row.width === 480 && row.height === 320 && row.url.startsWith('/__local_ai/')));
  assert.deepEqual(referenceImageDimensions(await fs.readFile(value.files[0].file)), { width: 768, height: 512 });
  assert.deepEqual(referenceImageDimensions(await fs.readFile(value.files[3].file)), { width: 1536, height: 1024 });
});

test('same-size altered PNG bytes are refused and restoring exact bytes reopens the set', async () => {
  await assetMutation(3, (file, bytes) => { bytes[bytes.length - 20] ^= 1; return fs.writeFile(file, bytes); }, /source hash changed/);
});

test('a missing source refuses readiness instead of silently dropping a species', async () => {
  await assetMutation(4, file => fs.rm(file), { code: 'ENOENT' });
});

test('missing, extra, reordered, repeated or renumbered references cannot masquerade as the six residents', async () => {
  for (const mutate of [
    value => value.references.pop(),
    value => value.references.push(structuredClone(value.references[0])),
    value => [value.references[0], value.references[1]] = [value.references[1], value.references[0]],
    value => value.references[1] = structuredClone(value.references[0]),
    value => value.references[2].imageIndex = 4,
  ]) await manifestMutation(mutate);
});

test('changing one full genome field cannot retain the old canonical identity key', async () => {
  await manifestMutation(value => value.references[0].fullGenome.accent += 1);
});

test('a shortened or substituted identity key cannot stand in for the full canonical genome', async () => {
  await manifestMutation(value => value.references[0].speciesVisualKey = 'Civet:' + value.references[0].fullGenome.seed);
  await manifestMutation(value => value.references[1].speciesVisualKey = value.references[0].speciesVisualKey);
});

test('snapshot bytes and schema remain bound to the declared snapshot digest', async () => {
  await manifestMutation(value => value.sourceSnapshot.request.options.seed = 134);
  await manifestMutation(value => value.sourceSnapshot.schema = 'cf.art.landfall-appearance-snapshot.v1');
  await manifestMutation(value => value.sourceSnapshotDigest = '0'.repeat(64));
});

test('preparation and conditioning-only status cannot silently claim a different product contract', async () => {
  for (const mutate of [
    value => value.qualityAccepted = true,
    value => value.referenceStatus = 'accepted',
    value => value.preparation.width = 768,
    value => value.preparation.opaqueMatte = '#000000',
    value => value.preparation.sourcePixelsUnedited = false,
  ]) await manifestMutation(mutate);
});

test('source path traversal, absolute paths and alternate separators are refused', async () => {
  for (const source of ['../outside.png', '/private/tmp/outside.png', 'images/%2e%2e/outside.png', 'images//frog.png', 'images\\frog.png']) {
    await manifestMutation(value => value.references[3].source = source, /Unsafe anatomical source path/);
  }
  await assert.rejects(loadSpeciesReferenceSet({ sourceRoot, manifestPath: '../escape.json' }), /Unsafe anatomical source path/);
});

test('runtime target collisions and paths outside the fixed local AI subtree refuse', async () => {
  for (const target of ['../outside.png', '__local_ai/../outside.png', 'unowned/frog.png', '__local_ai/model.onnx']) {
    await manifestMutation(value => value.references[3].target = target, /target\/geometry changed/);
  }
  await manifestMutation(value => value.references[3].target = value.references[0].target, /target\/geometry changed/);
});

test('declared source geometry and prepared geometry cannot disagree with the exact source header', async () => {
  for (const mutate of [
    value => value.references[3].sourceWidth = 1024,
    value => { value.references[3].sourceWidth = 768; value.references[3].sourceHeight = 512; },
    value => value.references[3].width = 320,
    value => value.references[3].sourceHeight = 0,
    value => value.references[3].sourceWidth = 9000,
  ]) await manifestMutation(mutate, /geometry changed/);
});

test('unsupported or truncated PNG/WebP headers are refused without calling a decoder', () => {
  assert.throws(() => referenceImageDimensions(Buffer.from('not an image')), /Unsupported/);
  const png = Buffer.alloc(24); Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
  assert.throws(() => referenceImageDimensions(png), /Unsupported/);
  const webp = Buffer.alloc(25); webp.write('RIFF'); webp.write('WEBP', 8); webp.write('VP8L', 12); webp[20] = 0x2f;
  assert.throws(() => referenceImageDimensions(webp), /Unsupported/);
});

test('a repinned malformed image signature still refuses and original source restores', async () => {
  const index = 3, file = path.join(sourceRoot, originalManifest.references[index].source);
  const bytes = await fs.readFile(file), changed = Buffer.from(bytes); changed[0] ^= 1;
  try {
    await fs.writeFile(file, changed);
    await manifestMutation(value => value.references[index].sha256 = sha(changed), /Unsupported anatomical source image header/, false);
  } finally { await fs.writeFile(file, bytes); }
  assert.equal((await load()).references[index].sha256, HASHES[index]);
});

test('copying another resident image under a new target is not an independent identity reference', async () => {
  await manifestMutation(value => {
    const first = value.references[0], other = value.references[3];
    for (const field of ['source', 'bytes', 'sha256', 'sourceWidth', 'sourceHeight']) other[field] = first[field];
  });
});

test('symlink files and root aliases cannot escape the declared source ownership', async () => {
  await assetMutation(3, async file => {
    await fs.rm(file); await fs.symlink(path.join(ROOT, originalManifest.references[3].source), file);
  }, /Unsafe anatomical source file/);
  const alias = path.join(temporary, 'root-alias'); await fs.symlink(sourceRoot, alias);
  await assert.rejects(loadSpeciesReferenceSet({ sourceRoot: alias }), /source root symlink refused/);
});

test('unbounded or inconsistent declared image pins refuse before readiness', async () => {
  for (const mutate of [
    value => value.references[3].bytes = 0,
    value => value.references[3].bytes = 17 * 1024 * 1024,
    value => value.references[3].sha256 = 'not-a-sha',
    value => value.references[3].bytes += 1,
  ]) await manifestMutation(mutate, /source pin|source hash changed/);
});
