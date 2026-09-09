import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { createGamePreviewServer, gamePreviewRange } from './game-preview-server.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'cf-game-preview-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const cacheDir = path.join(directory, 'cache'); await fs.mkdir(cacheDir);
  const graph = Buffer.from('verified synthetic graph bytes');
  await fs.writeFile(path.join(cacheDir, 'graph.onnx'), graph);
  const manifest = { schema: 'cf.local-image-model-manifest.v1', modelId: 'synthetic/control',
    revision: 'a'.repeat(40), sourceBaseUrl: 'https://huggingface.co/synthetic/control/resolve/' + 'a'.repeat(40) + '/',
    fileCount: 1, totalBytes: graph.length, files: [{ path: 'graph.onnx', bytes: graph.length, sha256: sha(graph) }] };
  const runtimeDirectory = path.join(directory, 'runtime');
  const ort = path.join(runtimeDirectory, 'node_modules/onnxruntime-web');
  const tokenizer = path.join(runtimeDirectory, 'node_modules/@huggingface/tokenizers');
  for (const folder of [ort, tokenizer]) await fs.mkdir(path.join(folder, 'dist'), { recursive: true });
  await fs.writeFile(path.join(ort, 'package.json'), JSON.stringify({ version: '1.29.0' }));
  await fs.writeFile(path.join(tokenizer, 'package.json'), JSON.stringify({ version: '0.2.0' }));
  await fs.writeFile(path.join(ort, 'dist/ort.webgpu.min.mjs'), 'export const fixture = true;');
  await fs.writeFile(path.join(ort, 'dist/runtime.wasm'), Buffer.from('fixture wasm bytes'));
  await fs.writeFile(path.join(tokenizer, 'dist/tokenizers.mjs'), 'export class Tokenizer {}');
  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
  png.writeUInt32BE(13, 8); png.write('IHDR', 12); png.writeUInt32BE(480, 16); png.writeUInt32BE(320, 20);
  const reference = path.join(directory, 'reference.png'); await fs.writeFile(reference, png);
  const lifecycle = { created: 0, closed: 0 };
  const createViteServer = async options => {
    lifecycle.created++;
    assert.equal(options.server.middlewareMode, true); assert.equal(options.server.hmr, false);
    return { middlewares(_req, res) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<title>fixture game</title>'); },
      async close() { lifecycle.closed++; } };
  };
  const options = { reference, referenceIdentity: 'platypus-exact-identity', q8Block32: false,
    fixture: { manifest, cacheDir, runtimeDirectory, createViteServer } };
  return { directory, graph, cacheDir, runtimeDirectory, png, reference, lifecycle, options };
}
async function start(t, options) {
  const server = await createGamePreviewServer(options);
  t.after(() => server.close()); return server;
}
function rawRequest(url, pathname, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const base = new URL(url);
    const request = http.request({ hostname: base.hostname, port: base.port, path: pathname, method, headers }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    request.on('error', reject); request.end();
  });
}

test('single byte ranges cover bounded/open/suffix forms and reject malformed or impossible ranges', () => {
  assert.equal(gamePreviewRange(undefined, 10), null);
  for (const [header, expected] of [['bytes=0-0', { start: 0, end: 0 }], ['bytes=3-', { start: 3, end: 9 }],
    ['bytes=-4', { start: 6, end: 9 }], ['bytes=8-100', { start: 8, end: 9 }], ['bytes=-20', { start: 0, end: 9 }]]) {
    assert.deepEqual(gamePreviewRange(header, 10), expected);
  }
  for (const header of ['bytes=-0', 'bytes=-', 'bytes=10-', 'bytes=5-4', 'bytes=0-1,3-4', 'items=0-1',
    'bytes=9007199254740993-', 'bytes=1.5-2']) assert.throws(() => gamePreviewRange(header, 10));
});

test('serves exact config, locked relative worker imports, range bytes, HEAD and same-origin Vite', async t => {
  const f = await fixture(t); const server = await start(t, f.options);
  const response = await rawRequest(server.url, '/__local_ai/runtime.json');
  assert.equal(response.status, 200);
  for (const [name, value] of [['cross-origin-opener-policy', 'same-origin'], ['cross-origin-embedder-policy', 'require-corp'],
    ['cross-origin-resource-policy', 'same-origin'], ['cache-control', 'no-store']]) assert.equal(response.headers[name], value);
  const config = JSON.parse(response.body);
  assert.equal(config.fixture, true); assert.equal(config.modelSource, 'synthetic-fixture');
  assert.equal(config.reference.sha256, sha(f.png)); assert.equal(config.reference.speciesVisualKey, 'platypus-exact-identity');
  assert.deepEqual([config.reference.width, config.reference.height], [480, 320]);
  assert.equal(config.q8Block32, false); assert.equal(config.modelRevision, 'a'.repeat(40));
  const modelUrl = config.modelFiles['graph.onnx'];
  assert.deepEqual((await rawRequest(server.url, modelUrl)).body, f.graph);
  const range = await rawRequest(server.url, modelUrl, { Range: 'bytes=3-8' });
  assert.equal(range.status, 206); assert.deepEqual(range.body, f.graph.subarray(3, 9));
  assert.equal(range.headers['content-range'], `bytes 3-8/${f.graph.length}`);
  const head = await rawRequest(server.url, modelUrl, {}, 'HEAD');
  assert.equal(head.status, 200); assert.equal(head.body.length, 0); assert.equal(Number(head.headers['content-length']), f.graph.length);
  const invalid = await rawRequest(server.url, modelUrl, { Range: 'bytes=99999-' });
  assert.equal(invalid.status, 416); assert.equal(invalid.headers['content-range'], `bytes */${f.graph.length}`);
  const worker = await rawRequest(server.url, config.workerUrl);
  assert.equal(worker.status, 200); assert.match(worker.body.toString(), /\.\/node_modules\/onnxruntime-web/);
  for (const source of ['/__local_ai/pipeline-math.mjs', '/__local_ai/gpu-profile.mjs', '/__local_ai/denoiser-shapes.mjs',
    '/__local_ai/node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs', '/__local_ai/node_modules/onnxruntime-web/dist/runtime.wasm',
    '/__local_ai/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs']) assert.equal((await rawRequest(server.url, source)).status, 200);
  assert.match((await rawRequest(server.url, '/')).body.toString(), /fixture game/);
  assert.ok(server.modelFiles.every(row => /^[a-f0-9]{64}$/u.test(row.sha256)));
});

test('rejects raw/encoded traversal, external origins, unknown AI files and write methods', async t => {
  const f = await fixture(t); const server = await start(t, f.options);
  for (const route of ['/__local_ai/../package.json', '/__local_ai/%2e%2e/package.json',
    '/__local_ai/%252e%252e/package.json', '/__local_ai/%5c..%5cpackage.json', '/__local_ai/%00file']) {
    assert.equal((await rawRequest(server.url, route)).status, 400, route);
  }
  assert.equal((await rawRequest(server.url, '/__local_ai/package.json')).status, 404);
  assert.equal((await rawRequest(server.url, '/', { Host: 'outside.example' })).status, 403);
  assert.equal((await rawRequest(server.url, '/__local_ai/runtime.json', { Origin: 'https://outside.example' })).status, 403);
  assert.equal((await rawRequest(server.url, '/__local_ai/runtime.json', {}, 'POST')).status, 405);
});

test('hash/size corruption blocks readiness before Vite or HTTP start and exact restoration passes', async t => {
  const f = await fixture(t); const graph = path.join(f.cacheDir, 'graph.onnx');
  await fs.writeFile(graph, Buffer.alloc(f.graph.length, 0));
  await assert.rejects(createGamePreviewServer(f.options), /SHA mismatch/);
  assert.equal(f.lifecycle.created, 0);
  await fs.writeFile(graph, f.graph.subarray(1));
  await assert.rejects(createGamePreviewServer(f.options), /type\/size mismatch/);
  assert.equal(f.lifecycle.created, 0);
  await fs.writeFile(graph, f.graph);
  await start(t, f.options); assert.equal(f.lifecycle.created, 1);
});

test('refuses locked runtime version changes before opening the game', async t => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.runtimeDirectory, 'node_modules/onnxruntime-web/package.json'), JSON.stringify({ version: '99.0.0' }));
  await assert.rejects(createGamePreviewServer(f.options), /dependency lock/);
  assert.equal(f.lifecycle.created, 0);
});

test('refuses a verified file replaced after startup instead of serving stale declared hashes', async t => {
  const f = await fixture(t); const server = await start(t, f.options);
  await fs.writeFile(path.join(f.cacheDir, 'graph.onnx'), Buffer.alloc(f.graph.length, 0));
  assert.equal((await rawRequest(server.url, '/__local_ai/model/graph.onnx')).status, 409);
  await fs.writeFile(f.reference, Buffer.alloc(f.png.length, 0));
  assert.equal((await rawRequest(server.url, '/__local_ai/reference.png')).status, 409);
});

test('startup failure closes Vite and preserves a cleanup failure beside the bind error', async t => {
  const f = await fixture(t); const first = await start(t, f.options);
  const port = Number(new URL(first.url).port);
  await assert.rejects(createGamePreviewServer({ ...f.options, port }), { code: 'EADDRINUSE' });
  assert.equal(f.lifecycle.closed, 1);
  const failing = { ...f.options.fixture, createViteServer: async () => ({ middlewares() {},
    async close() { throw Error('synthetic cleanup failure'); } }) };
  await assert.rejects(createGamePreviewServer({ ...f.options, port, fixture: failing }), error => {
    assert.ok(error instanceof AggregateError);
    assert.equal(error.errors[0].code, 'EADDRINUSE');
    assert.match(error.errors[1].message, /synthetic cleanup failure/); return true;
  });
});

test('close is idempotent and closes both the HTTP owner and Vite', async t => {
  const f = await fixture(t); const server = await createGamePreviewServer(f.options);
  await server.close(); await server.close();
  assert.equal(f.lifecycle.closed, 1);
  await assert.rejects(rawRequest(server.url, '/'));
});
