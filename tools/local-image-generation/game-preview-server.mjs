#!/usr/bin/env node
/** Local game/AI integration preview. No downloads, model execution, game saves,
 * hosted publication, or qualification claims. Verify installed immutable inputs
 * before listening; Vite owns only the development app routes. */
import http from 'node:http';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertIgnoredCache, DEFAULT_CACHE_ROOT, DEFAULT_MANIFEST, validateManifest } from './fetch-model.mjs';
import { BLOCK32_DIRECTORY, openBlock32Derivative, verifyPinnedFile } from './q8-block32.mjs';
import { loadSpeciesReferenceSet, SPECIES_REFERENCE_SET } from './species-references.mjs';
import { createFrozenGameViteServer } from './frozen-preview-client.mjs';
import { BROWSER_VARIANT_SOURCE, assertBrowserVariantPlan } from './browser-variant-source.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const PREFIX = '/__local_ai/';
const HELPERS = ['stage-worker.mjs', 'pipeline-math.mjs', 'gpu-profile.mjs', 'denoiser-shapes.mjs'];
const PINNED_RUNTIME = Object.freeze({ 'onnxruntime-web': '1.29.0', '@huggingface/tokenizers': '0.2.0' });
const sha = value => createHash('sha256').update(value).digest('hex');
const mime = file => ({ '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json',
  '.wasm': 'application/wasm', '.png': 'image/png', '.webp': 'image/webp', '.html': 'text/html' })[path.extname(file)] ?? 'application/octet-stream';
const sameStat = (a, b) => a.dev === b.dev && a.ino === b.ino && a.size === b.size
  && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;

async function fileStat(file) {
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || await fs.realpath(file) !== path.resolve(file)) {
    throw Error('Preview source must be a regular file without symlink traversal');
  }
  return stat;
}
async function capturedFile(file, pin = null) {
  const stat = await fileStat(file);
  if (pin) await verifyPinnedFile(file, pin);
  const hash = pin?.sha256 ?? sha(await fs.readFile(file));
  if (!sameStat(stat, await fileStat(file))) throw Error('Preview source changed during capture');
  return Object.freeze({ file, bytes: stat.size, sha256: hash, stat });
}

/** Single HTTP byte range; malformed, empty and multi-range requests fail closed. */
export function gamePreviewRange(header, size) {
  if (header === undefined) return null;
  if (typeof header !== 'string' || !Number.isSafeInteger(size) || size < 1) throw Error('Invalid byte range');
  const match = /^bytes=(\d*)-(\d*)$/u.exec(header);
  if (!match || (!match[1] && !match[2])) throw Error('Invalid byte range');
  const left = match[1] ? Number(match[1]) : null;
  const right = match[2] ? Number(match[2]) : null;
  if ([left, right].some(value => value !== null && (!Number.isSafeInteger(value) || value < 0))) throw Error('Invalid byte range');
  const start = left === null ? Math.max(0, size - right) : left;
  const end = left === null || right === null ? size - 1 : Math.min(right, size - 1);
  if ((left === null && right === 0) || start >= size || end < start) throw Error('Unsatisfiable byte range');
  return { start, end };
}
function requestPath(url) {
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) throw Error('Invalid request path');
  const raw = url.split('?')[0];
  const decoded = decodeURIComponent(raw);
  if (decoded.includes('\\') || decoded.includes('\0') || decoded.includes('%')
    || decoded.split('/').some(part => part === '.' || part === '..')) throw Error('Path traversal refused');
  return decoded;
}

export async function createGamePreviewServer(options = {}) {
  const { port = 0, reference = path.join(ROOT, 'audits/AI_GAME_INTEGRATION_20260909/platypus-reference.png'),
    referenceIdentity, q8Block32 = 'auto', mode = 'development', fixture = null, speciesReferences = false } = options;
  if (!Number.isInteger(port) || port < 0 || port > 65535 || ![true, false, 'auto'].includes(q8Block32)
    || typeof speciesReferences !== 'boolean' || (fixture !== null && speciesReferences)
    || !['development', 'evidence'].includes(mode) || typeof referenceIdentity !== 'string'
    || !referenceIdentity.length || referenceIdentity.length > 1024) throw Error('Invalid game preview options');
  // Tiny synthetic fixtures exercise transport/verification without reading GiB
  // or inventing a real model receipt. This seam is unavailable from the CLI.
  if (fixture !== null && (fixture.manifest?.modelId !== 'synthetic/control'
    || q8Block32 !== false || typeof fixture.createViteServer !== 'function')) throw Error('Invalid explicit preview fixture');
  const rawManifest = fixture?.manifest ?? JSON.parse(await fs.readFile(DEFAULT_MANIFEST, 'utf8'));
  const manifest = validateManifest(rawManifest);
  const cacheDir = path.resolve(fixture?.cacheDir ?? options.cacheDir
    ?? path.join(DEFAULT_CACHE_ROOT, manifest.modelId.replaceAll('/', '--'), manifest.revision));
  if (!fixture) await assertIgnoredCache(cacheDir);
  if (await fs.realpath(cacheDir) !== cacheDir) throw Error('Model cache symlink refused');
  const routes = new Map();
  const modelFiles = Object.create(null);
  const modelRows = [];
  for (const entry of manifest.files) {
    const file = path.join(cacheDir, ...entry.path.split('/'));
    const captured = await capturedFile(file, entry);
    const url = PREFIX + 'model/' + entry.path;
    routes.set(url, captured); modelFiles[entry.path] = url;
    modelRows.push(Object.freeze({ path: entry.path, bytes: entry.bytes, sha256: entry.sha256, url }));
  }
  let derivative = null;
  if (q8Block32 !== false) {
    let exists = true;
    try { await fs.lstat(BLOCK32_DIRECTORY); } catch (error) { if (error.code === 'ENOENT') exists = false; else throw error; }
    if (q8Block32 === true || exists) derivative = await openBlock32Derivative(manifest);
  }
  if (derivative) for (const entry of derivative.files) {
    // openBlock32Derivative already hashed and bound these reviewed bytes.
    const captured = Object.freeze({ file: entry.file, bytes: entry.bytes, sha256: entry.sha256, stat: await fileStat(entry.file) });
    const url = PREFIX + 'model/' + entry.path;
    routes.set(url, captured); modelFiles[entry.path] = url;
    modelRows.push(Object.freeze({ path: entry.path, bytes: entry.bytes, sha256: entry.sha256, url }));
  }
  for (const helper of HELPERS) routes.set(PREFIX + helper, await capturedFile(path.join(HERE, helper)));
  const runtimeDirectory = fixture?.runtimeDirectory ?? HERE;
  const lock = JSON.parse(await fs.readFile(path.join(HERE, 'package-lock.json'), 'utf8'));
  for (const [name, version] of Object.entries(PINNED_RUNTIME)) {
    const installed = JSON.parse(await fs.readFile(path.join(runtimeDirectory, 'node_modules', name, 'package.json'), 'utf8'));
    if (installed.version !== version || lock.packages[`node_modules/${name}`]?.version !== version) {
      throw Error('Installed local AI runtime differs from its dependency lock');
    }
  }
  const dist = path.join(runtimeDirectory, 'node_modules/onnxruntime-web/dist');
  for (const filename of await fs.readdir(dist)) {
    if (/\.(mjs|wasm)$/u.test(filename)) routes.set(PREFIX + 'node_modules/onnxruntime-web/dist/' + filename,
      await capturedFile(path.join(dist, filename)));
  }
  const tokenizer = 'node_modules/@huggingface/tokenizers/dist/tokenizers.mjs';
  routes.set(PREFIX + tokenizer, await capturedFile(path.join(runtimeDirectory, tokenizer)));
  if (!routes.has(PREFIX + 'node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs')) throw Error('Local WebGPU runtime is missing');
  const referenceFile = await capturedFile(path.resolve(reference));
  if (referenceFile.bytes < 24 || referenceFile.bytes > 16 * 1024 * 1024) throw Error('Reference PNG size is outside the preview bound');
  const png = await fs.readFile(referenceFile.file);
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    || png.toString('ascii', 12, 16) !== 'IHDR' || png.readUInt32BE(16) < 1 || png.readUInt32BE(20) < 1
    || png.readUInt32BE(16) > 8192 || png.readUInt32BE(20) > 8192) throw Error('Invalid reference PNG header');
  routes.set(PREFIX + 'reference.png', referenceFile);
  const species = speciesReferences ? await loadSpeciesReferenceSet({ manifestPath: SPECIES_REFERENCE_SET }) : null;
  if (species) for (const row of species.files) {
    const captured = await capturedFile(row.file, row);
    const url = '/' + row.target;
    if (routes.has(url) && (routes.get(url).sha256 !== row.sha256 || routes.get(url).bytes !== row.bytes)) throw Error('Anatomical runtime route collision');
    routes.set(url, captured);
  }
  const variantSource = await capturedFile(path.join(ROOT, BROWSER_VARIANT_SOURCE.source), BROWSER_VARIANT_SOURCE);
  const variantPlan = assertBrowserVariantPlan(await fs.readFile(variantSource.file));
  routes.set(variantPlan.url, variantSource);
  const runtimeFiles = Object.freeze([...routes].filter(([url]) => !url.startsWith(PREFIX + 'model/'))
    .map(([url, row]) => Object.freeze({ url, bytes: row.bytes, sha256: row.sha256 })));
  const config = Object.freeze({ schema: 'cf.local-ai-game-preview.v1', fixture: fixture !== null,
    workerUrl: PREFIX + 'stage-worker.mjs', modelRevision: manifest.revision, modelId: manifest.modelId,
    modelFiles: Object.freeze(modelFiles), q8Block32: derivative !== null, variantPlan,
    reference: Object.freeze({ url: PREFIX + 'reference.png', sha256: referenceFile.sha256,
      width: 480, height: 320, speciesVisualKey: referenceIdentity }),
    ...(species ? { references: species.references } : {}),
    qualityAccepted: false, modelSource: fixture ? 'synthetic-fixture' : 'verified-installed-developer-cache' });
  for (const source of routes.values()) {
    if (!sameStat(source.stat, await fileStat(source.file))) throw Error('Preview source changed before readiness');
  }
  const configBytes = Buffer.from(JSON.stringify(config));
  let vite = null, server = null;
  const requests = [];
  const appendRequest = row => { requests.push(row); if (requests.length > 4096) requests.shift(); };
  try {
    vite = await createFrozenGameViteServer({ mode, createViteServer: fixture?.createViteServer });
    server = http.createServer(async (req, res) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
      const record = { method: req.method, path: req.url, status: null };
      res.once('finish', () => { record.status = res.statusCode; appendRequest(record); });
      const refuse = (status, message) => { res.writeHead(status, { 'Content-Type': 'text/plain' }); res.end(message); };
      try {
        const boundPort = server.address().port;
        if (![ `127.0.0.1:${boundPort}`, `localhost:${boundPort}` ].includes(req.headers.host)
          || (req.headers.origin && ![`http://127.0.0.1:${boundPort}`, `http://localhost:${boundPort}`].includes(req.headers.origin))) {
          refuse(403, 'Local preview origin required'); return;
        }
        if (!['GET', 'HEAD'].includes(req.method)) { refuse(405, 'Read-only preview'); return; }
        let pathname;
        try { pathname = requestPath(req.url); } catch { refuse(400, 'Invalid or traversing path'); return; }
        if (pathname === PREFIX + 'runtime.json') {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': configBytes.length });
          res.end(req.method === 'HEAD' ? undefined : configBytes); return;
        }
        const source = routes.get(pathname);
        if (!source) {
          if (pathname.startsWith(PREFIX)) { refuse(404, 'Unknown local AI source'); return; }
          vite.middlewares(req, res, () => refuse(404, 'Game route not found')); return;
        }
        if (!sameStat(source.stat, await fileStat(source.file))) { refuse(409, 'Verified preview source changed'); return; }
        let range;
        try { range = gamePreviewRange(req.headers.range, source.bytes); }
        catch { res.setHeader('Content-Range', `bytes */${source.bytes}`); refuse(416, 'Invalid byte range'); return; }
        const start = range?.start ?? 0, end = range?.end ?? source.bytes - 1;
        res.setHeader('Content-Type', mime(source.file)); res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', range ? end - start + 1 : source.bytes);
        res.setHeader('ETag', `"${source.sha256}"`);
        if (range) res.setHeader('Content-Range', `bytes ${start}-${end}/${source.bytes}`);
        res.statusCode = range ? 206 : 200;
        if (req.method === 'HEAD' || source.bytes === 0) { res.end(); return; }
        const stream = createReadStream(source.file, { start, end });
        stream.on('error', () => res.destroy()); res.on('close', () => stream.destroy()); stream.pipe(res);
      } catch { if (!res.headersSent) refuse(500, 'Local preview source unavailable'); else res.destroy(); }
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject); server.listen(port, '127.0.0.1', resolve);
    });
    let closing = null;
    return Object.freeze({ url: `http://127.0.0.1:${server.address().port}/`, config,
      modelFiles: Object.freeze(modelRows), runtimeFiles, requests,
      close() {
        if (!closing) closing = (async () => {
          server.closeAllConnections();
          const results = await Promise.allSettled([
            new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())), vite.close(),
          ]);
          const failure = results.find(result => result.status === 'rejected');
          if (failure) throw failure.reason;
        })();
        return closing;
      },
    });
  } catch (error) {
    server?.closeAllConnections();
    const cleanup = await Promise.allSettled([
      server?.listening ? new Promise((resolve, reject) => server.close(failure => failure ? reject(failure) : resolve())) : Promise.resolve(),
      vite?.close(),
    ]);
    const failures = cleanup.filter(result => result.status === 'rejected').map(result => result.reason);
    if (failures.length) throw new AggregateError([error, ...failures], 'Preview startup and cleanup failed');
    throw error;
  }
}

async function main() {
  const options = {};
  for (const argument of process.argv.slice(2)) {
    if (argument.startsWith('--port=')) options.port = Number(argument.slice(7));
    else if (argument.startsWith('--reference=')) options.reference = path.resolve(argument.slice(12));
    else if (argument.startsWith('--reference-identity=')) options.referenceIdentity = argument.slice(21);
    else if (argument.startsWith('--cache-dir=')) options.cacheDir = path.resolve(argument.slice(12));
    else if (argument === '--q8-block32') options.q8Block32 = true;
    else if (argument === '--no-q8-block32') options.q8Block32 = false;
    else if (argument === '--evidence') options.mode = 'evidence';
    else throw Error(`Unknown game preview argument: ${argument}`);
  }
  const preview = await createGamePreviewServer(options);
  process.stdout.write(JSON.stringify({ url: preview.url, config: preview.config,
    modelFileCount: preview.modelFiles.length, runtimeFileCount: preview.runtimeFiles.length }) + '\n');
  let closing = false;
  const stop = () => {
    if (closing) return; closing = true;
    preview.close().catch(error => { process.stderr.write(String(error.message) + '\n'); process.exitCode = 1; });
  };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { process.stderr.write(String(error.stack ?? error) + '\n'); process.exitCode = 1; });
}
