import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, readdir, readFile, realpath, rm, writeFile, mkdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fetchModel, validateManifest, assertIgnoredCache } from './fetch-model.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
const absent = async path => { await assert.rejects(access(path), { code: 'ENOENT' }); };

async function fixture(t, contents = { 'graph.onnx': Buffer.from('verified graph bytes') }, handler = null) {
  const directory = await mkdtemp(resolve(await realpath(tmpdir()), 'cf-model-download-'));
  const cacheDir = resolve(directory, 'cache');
  const requests = [];
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname.slice(1));
    requests.push({ path, encoding: request.headers['accept-encoding'] });
    if (handler) return handler(request, response, path);
    const bytes = contents[path];
    if (!bytes) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'content-length': bytes.length });
    const mid = Math.max(1, Math.floor(bytes.length / 2));
    response.write(bytes.subarray(0, mid)); response.end(bytes.subarray(mid));
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  const entries = Object.entries(contents).map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha(bytes) }));
  const manifest = { schema: 'cf.local-image-model-manifest.v1', modelId: 'synthetic/control',
    revision: 'a'.repeat(40), sourceBaseUrl: `http://127.0.0.1:${server.address().port}/`,
    files: entries, fileCount: entries.length, totalBytes: entries.reduce((total, entry) => total + entry.bytes, 0) };
  const run = options => fetchModel({ manifest, cacheDir, timeoutMs: 4000, allowLocalHttp: true, ...options });
  return { directory, cacheDir, manifest, entries, requests, run };
}

async function captureFailure(action, code) {
  let error;
  try { await action; } catch (caught) { error = caught; }
  assert.ok(error, 'the negative control must refuse the file');
  assert.equal(error.code, code);
  assert.ok(error.receiptPath, 'refusal retains a readable failure receipt');
  const receipt = JSON.parse(await readFile(error.receiptPath, 'utf8'));
  assert.equal(receipt.failure.code, code);
  return { error, receipt };
}

async function noPartOrLock(cacheDir) {
  const walk = async directory => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      assert.ok(!entry.name.includes('.part-'), `unverified partial survived: ${entry.name}`);
      assert.notEqual(entry.name, '.model-download.lock');
      if (entry.isDirectory()) await walk(resolve(directory, entry.name));
    }
  };
  await walk(cacheDir);
}

test('streams exact files, publishes verified bytes, and reuses only rehashed complete files', async t => {
  const files = { 'graph.onnx': Buffer.from('small graph'), 'tokenizer/vocab.json': Buffer.from('{"cat":1}') };
  const f = await fixture(t, files);
  const first = await f.run();
  assert.equal(first.receipt.status, 'complete'); assert.equal(first.receipt.totalBytes, 20);
  assert.deepEqual(first.receipt.files.map(row => row.disposition), ['downloaded', 'downloaded']);
  for (const [path, bytes] of Object.entries(files)) assert.deepEqual(await readFile(resolve(f.cacheDir, path)), bytes);
  assert.equal(f.requests.length, 2); assert.ok(f.requests.every(row => row.encoding === 'identity'));
  const reused = await f.run();
  assert.deepEqual(reused.receipt.files.map(row => row.disposition), ['verified-reused', 'verified-reused']);
  const verified = await f.run({ verifyOnly: true });
  assert.equal(verified.receipt.status, 'complete'); assert.equal(f.requests.length, 2);
  assert.equal((await readdir(resolve(f.cacheDir, '.receipts'))).length, 3);
  await noPartOrLock(f.cacheDir);
});

test('same-size corrupt download fails SHA verification and never publishes response content', async t => {
  const body = Buffer.from('SECRET_BODY_SENTINEL');
  const f = await fixture(t, { 'graph.onnx': Buffer.alloc(body.length, 1) }, (_request, response) => {
    response.writeHead(200, { 'content-length': body.length }); response.end(body);
  });
  const { receipt } = await captureFailure(f.run(), 'DOWNLOAD_SHA256_MISMATCH');
  assert.equal(receipt.files.length, 0); assert.equal(receipt.failure.actualSha256, sha(body));
  assert.equal(JSON.stringify(receipt).includes(body.toString()), false);
  await absent(resolve(f.cacheDir, 'graph.onnx')); await noPartOrLock(f.cacheDir);
  assert.equal(f.requests.length, 1);
});

test('oversized and truncated streamed bodies fail independently of Content-Length', async t => {
  for (const actual of [Buffer.from('abcd'), Buffer.from('ab')]) {
    await t.test(`actual ${actual.length} versus declared inventory 3`, async child => {
      const f = await fixture(child, { 'graph.onnx': Buffer.from('abc') }, (_request, response) => {
        response.writeHead(200); response.write(actual); response.end();
      });
      const { receipt } = await captureFailure(f.run(), 'DOWNLOAD_SIZE_MISMATCH');
      assert.equal(receipt.failure.actualBytes, actual.length);
      await absent(resolve(f.cacheDir, 'graph.onnx')); await noPartOrLock(f.cacheDir);
      assert.equal(f.requests.length, 1);
    });
  }
});

test('rejected headers cancel a response that keeps streaming', async t => {
  const closed = deferred();
  const f = await fixture(t, { 'graph.onnx': Buffer.from('abc') }, (_request, response) => {
    response.on('close', closed.resolve);
    response.writeHead(200, { 'content-length': '1000000' }); response.write('x');
    // Intentionally no response.end(); rejection must close the actual server connection.
  });
  await captureFailure(f.run(), 'RESPONSE_SIZE_MISMATCH');
  await Promise.race([closed.promise, new Promise((_, reject) => {
    const timer = setTimeout(() => reject(new Error('rejected response remained open')), 1000); timer.unref();
  })]);
  await absent(resolve(f.cacheDir, 'graph.onnx')); await noPartOrLock(f.cacheDir);
  assert.equal(f.requests.length, 1);
});

test('cached corruption is preserved as failed evidence and never silently redownloaded', async t => {
  for (const body of [Buffer.from('wrong size'), Buffer.from('BAD')]) {
    await t.test(`cached ${body.length} bytes`, async child => {
      const f = await fixture(child, { 'graph.onnx': Buffer.from('abc') });
      await mkdir(f.cacheDir); await writeFile(resolve(f.cacheDir, 'graph.onnx'), body);
      await captureFailure(f.run(), body.length === 3 ? 'CACHE_SHA256_MISMATCH' : 'CACHE_SIZE_MISMATCH');
      assert.deepEqual(await readFile(resolve(f.cacheDir, 'graph.onnx')), body);
      assert.equal(f.requests.length, 0); await noPartOrLock(f.cacheDir);
    });
  }
});

test('explicit cancellation stops one active stream and does not request the next file', async t => {
  const started = deferred(), closed = deferred(), controller = new AbortController();
  const f = await fixture(t, { 'graph.onnx': Buffer.from('abcdef'), 'next.data': Buffer.from('123') }, (_request, response) => {
    response.on('close', closed.resolve); response.writeHead(200); response.write('a'); started.resolve();
  });
  const promise = f.run({ signal: controller.signal });
  await started.promise; controller.abort();
  const { receipt } = await captureFailure(promise, 'CANCELLED');
  assert.equal(receipt.status, 'cancelled'); assert.equal(receipt.files.length, 0);
  await closed.promise;
  await absent(resolve(f.cacheDir, 'graph.onnx')); await absent(resolve(f.cacheDir, 'next.data'));
  await noPartOrLock(f.cacheDir); assert.equal(f.requests.length, 1);
});

test('per-file timeout refuses an unfinished response and retains its failure once', async t => {
  const f = await fixture(t, { 'graph.onnx': Buffer.from('abc') }, (_request, response) => {
    response.writeHead(200); response.write('a');
  });
  const { receipt } = await captureFailure(f.run({ timeoutMs: 100 }), 'FILE_TIMEOUT');
  assert.equal(receipt.status, 'failed'); assert.equal(receipt.files.length, 0);
  await absent(resolve(f.cacheDir, 'graph.onnx')); await noPartOrLock(f.cacheDir);
  assert.equal((await readdir(resolve(f.cacheDir, '.receipts'))).length, 1);
});

test('verify-only refuses missing files without network access', async t => {
  const f = await fixture(t);
  await captureFailure(f.run({ verifyOnly: true }), 'MISSING_CACHED_FILE');
  assert.equal(f.requests.length, 0); await noPartOrLock(f.cacheDir);
});

test('inventory tampering and path escapes fail before download or cache writes', async t => {
  const f = await fixture(t);
  for (const mutate of [
    value => { value.files[0].path = '../escape.data'; },
    value => { value.files[0].path = '/escape.data'; },
    value => { value.files[0].sha256 = '0'; },
    value => { value.files.push({ ...value.files[0] }); value.fileCount++; value.totalBytes *= 2; },
    value => { value.totalBytes++; },
    value => { value.sourceBaseUrl = 'https://example.com/unpinned/'; },
  ]) {
    const manifest = structuredClone(f.manifest); mutate(manifest);
    await assert.rejects(f.run({ manifest }));
  }
  assert.throws(() => validateManifest(f.manifest)); // Local HTTP is a test-only explicit option.
  assert.equal(f.requests.length, 0); await absent(f.cacheDir);
});

test('CLI has an explicit-download boundary and rejects a non-ignored cache', async t => {
  const f = await fixture(t);
  await assert.rejects(assertIgnoredCache(f.cacheDir), { code: 'CACHE_OUTSIDE_IGNORED_MODEL_ROOT' });
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./fetch-model.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.mode, 'plan'); assert.equal(plan.fileCount, 21); assert.equal(plan.totalBytes, 6691028208);
  assert.equal(f.requests.length, 0);
});
