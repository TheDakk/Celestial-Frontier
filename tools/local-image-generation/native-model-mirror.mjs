/** Local native-proof transport for the already-installed, exact model only.
 * No download, cache mutation, model copy, public listener or application route.
 * The caller owns shared toolchain/checkout locks and the measured front origin.
 * CDP may rewrite the twenty pinned upstream URLs to these local byte routes;
 * the real browser delivery owner must still stream/hash every installed file.
 */
import fs from 'node:fs/promises';
import { constants, createReadStream } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { assertIgnoredCache, DEFAULT_CACHE_ROOT, DEFAULT_MANIFEST, validateManifest } from './fetch-model.mjs';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 as PIN } from '../../port/v2/apps/game/src/local-model-manifest.ts';

const ROUTE = '/__cf_pinned_model/';
const MAX_REQUESTS = 4096;
const need = (value, message) => { if (!value) throw Error(message); };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (a, b) => a.dev === b.dev && a.ino === b.ino && a.size === b.size
  && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;

export function nativeModelMirrorRange(header, size) {
  need(Number.isSafeInteger(size) && size > 0, 'Invalid pinned model size');
  if (header === undefined) return null;
  need(typeof header === 'string' && /^bytes=(0|[1-9][0-9]*)-$/.test(header), 'Invalid pinned model range');
  const start = Number(header.slice(6, -1));
  need(Number.isSafeInteger(start) && start < size, 'Pinned model range exceeds file');
  return Object.freeze({ start, end: size - 1 });
}
export function nativeModelMirrorFrontOrigin(value) {
  need(typeof value === 'string', 'Measured front origin required');
  const origin = new URL(value);
  need(origin.protocol === 'http:' && origin.hostname === '127.0.0.1'
    && origin.port && Number(origin.port) > 0 && Number(origin.port) <= 65535
    && origin.origin === value && !origin.username && !origin.password && !origin.search && !origin.hash,
  'Only the exact measured loopback front origin is allowed');
  return origin.origin;
}
async function regular(file) {
  const stat = await fs.lstat(file);
  need(stat.isFile() && !stat.isSymbolicLink() && await fs.realpath(file) === path.resolve(file), 'Unsafe pinned model file');
  return stat;
}
async function verifySource(file, pin) {
  const before = await regular(file);
  need(before.size === pin.bytes, 'Pinned model source size changed: ' + pin.path);
  const digest = createHash('sha256'); let bytes = 0, head = Buffer.alloc(0), tail = Buffer.alloc(0);
  for await (const chunk of createReadStream(file, { highWaterMark: 1024 * 1024 })) {
    bytes += chunk.length; need(bytes <= pin.bytes, 'Pinned model source grew: ' + pin.path); digest.update(chunk);
    if (head.length < 512) head = Buffer.concat([head, chunk.subarray(0, 512 - head.length)]);
    tail = chunk.length >= 512 ? Buffer.from(chunk.subarray(-512)) : Buffer.concat([tail, chunk]).subarray(-512);
  }
  need(bytes === pin.bytes && digest.digest('hex') === pin.sha256, 'Pinned model source digest changed: ' + pin.path);
  need(same(before, await regular(file)), 'Pinned model source changed while hashing: ' + pin.path);
  return { stat: before, sampleBytes: Math.min(512, bytes), headSha256: sha(head), tailSha256: sha(tail) };
}

export async function createNativeModelMirror({ frontOrigin, cacheDir, onVerified } = {}) {
  const origin = nativeModelMirrorFrontOrigin(frontOrigin);
  need(onVerified === undefined || typeof onVerified === 'function', 'Invalid mirror verification observer');
  const manifestBytes = await fs.readFile(DEFAULT_MANIFEST);
  need(sha(manifestBytes) === PIN.sourceManifestSha256, 'Model source manifest differs from runtime pin');
  const source = validateManifest(JSON.parse(manifestBytes));
  const selected = source.files.filter(row => row.path !== 'README.md');
  need(source.modelId === PIN.modelId && source.revision === PIN.revision
    && selected.length === 20 && JSON.stringify(selected) === JSON.stringify(PIN.files)
    && selected.reduce((n, row) => n + row.bytes, 0) === PIN.totalBytes, 'Incomplete pinned model mirror inventory');
  const directory = path.resolve(cacheDir ?? path.join(DEFAULT_CACHE_ROOT, PIN.modelId.replaceAll('/', '--'), PIN.revision));
  await assertIgnoredCache(directory);
  need(await fs.realpath(directory) === directory, 'Pinned model cache root symlink refused');
  const routes = new Map(), verifiedFiles = [];
  let total = 0;
  for (const entry of selected) {
    const file = path.join(directory, ...entry.path.split('/'));
    const { stat, sampleBytes, headSha256, tailSha256 } = await verifySource(file, entry);
    const route = ROUTE + entry.path;
    routes.set(route, Object.freeze({ ...entry, file, stat, sampleBytes, headSha256, tailSha256 }));
    total += entry.bytes;
    verifiedFiles.push(Object.freeze({ ...entry, sampleBytes, headSha256, tailSha256 }));
    onVerified?.(Object.freeze({ path: entry.path, verifiedFiles: verifiedFiles.length, verifiedBytes: total,
      totalFiles: 20, totalBytes: PIN.totalBytes }));
  }
  for (const row of routes.values()) need(same(row.stat, await regular(row.file)), 'Pinned model source changed before listening');
  const verification = Object.freeze({ schema: 'cf.native-model-mirror-verification.v1',
    sourceManifestSha256: PIN.sourceManifestSha256, modelId: PIN.modelId, revision: PIN.revision,
    fileCount: verifiedFiles.length, totalBytes: total, files: Object.freeze(verifiedFiles),
    localOnly: true, remoteModelDownloaded: false, sourceCopied: false, modelOrDeviceQualified: false });
  const requests = [], streams = new Set(), pending = new Set();
  const status = { requestCount: 0, requestOverflow: false, servedBytes: 0, closing: false };
  let expectedHost = '', closePromise = null;
  const server = http.createServer((request, response) => {
    const operation = (async () => {
      let handle = null;
      const receipt = { id: ++status.requestCount, method: request.method, path: request.url,
        origin: request.headers.origin ?? null, range: request.headers.range ?? null,
        status: null, bytes: 0, complete: false, closed: false, error: null };
      if (requests.length >= MAX_REQUESTS) { status.requestOverflow = true; response.writeHead(429); response.end(); return; }
      requests.push(receipt);
      response.once('finish', () => { receipt.status = response.statusCode; receipt.complete = true; });
      response.once('close', () => { receipt.closed = true; receipt.status ??= response.statusCode; });
      try {
        response.setHeader('Cache-Control', 'no-store'); response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); response.setHeader('Vary', 'Origin');
        if (status.closing || request.headers.host !== expectedHost) { response.writeHead(503); response.end(); return; }
        if (request.headers.origin !== origin) { response.writeHead(403); response.end(); return; }
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Length, Content-Range, ETag');
        const row = routes.get(request.url);
        if (!row) { response.writeHead(404); response.end(); return; }
        if (request.method === 'OPTIONS') {
          const method = request.headers['access-control-request-method'];
          const headers = String(request.headers['access-control-request-headers'] ?? '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
          if (!['GET', 'HEAD'].includes(method) || headers.some(name => name !== 'range')) { response.writeHead(403); response.end(); return; }
          response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD'); response.setHeader('Access-Control-Allow-Headers', 'Range');
          if (request.headers['access-control-request-private-network'] === 'true') response.setHeader('Access-Control-Allow-Private-Network', 'true');
          response.writeHead(204); response.end(); return;
        }
        if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
        let range;
        try { range = nativeModelMirrorRange(request.headers.range, row.bytes); }
        catch (error) { receipt.error = error.message; response.setHeader('Content-Range', 'bytes */' + row.bytes); response.writeHead(416); response.end(); return; }
        handle = await fs.open(row.file, constants.O_RDONLY | constants.O_NOFOLLOW);
        need(same(row.stat, await handle.stat()) && same(row.stat, await regular(row.file)), 'Pinned model source changed before response');
        if (status.closing || response.destroyed) return;
        const start = range?.start ?? 0, end = range?.end ?? row.bytes - 1;
        response.setHeader('Content-Type', row.path.endsWith('.json') ? 'application/json' : 'application/octet-stream');
        response.setHeader('Content-Length', end - start + 1); response.setHeader('Accept-Ranges', 'bytes');
        response.setHeader('ETag', '"' + row.sha256 + '"');
        if (range) response.setHeader('Content-Range', 'bytes ' + start + '-' + end + '/' + row.bytes);
        response.writeHead(range ? 206 : 200);
        if (request.method === 'HEAD') { response.end(); return; }
        const stream = handle.createReadStream({ start, end, highWaterMark: 1024 * 1024, autoClose: true });
        handle = null; streams.add(stream);
        stream.on('data', chunk => { receipt.bytes += chunk.length; status.servedBytes += chunk.length; });
        stream.once('error', error => { receipt.error = error.message; response.destroy(); });
        stream.once('close', () => streams.delete(stream)); response.once('close', () => stream.destroy());
        stream.pipe(response);
      } catch (error) {
        receipt.error = String(error.message);
        if (!response.headersSent) response.writeHead(500);
        response.end('Pinned local model source verification refused.');
      } finally { await handle?.close(); }
    })();
    pending.add(operation); operation.finally(() => pending.delete(operation)).catch(() => { response.destroy(); });
  });
  server.on('clientError', (_error, socket) => socket.destroy());
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  expectedHost = '127.0.0.1:' + server.address().port;
  const url = 'http://' + expectedHost + '/';
  const files = Object.freeze([...routes].map(([route, row]) => Object.freeze({ path: row.path, bytes: row.bytes,
    sha256: row.sha256, sampleBytes: row.sampleBytes, headSha256: row.headSha256, tailSha256: row.tailSha256,
    upstreamUrl: source.sourceBaseUrl + row.path, mirrorUrl: new URL(route, url).href })));
  return Object.freeze({ url, files, requests, verification, status,
    close() {
      if (closePromise) return closePromise;
      status.closing = true;
      closePromise = (async () => {
        const streamClosed = [...streams].map(stream => new Promise(resolve => {
          if (stream.closed) resolve(); else stream.once('close', resolve);
        }));
        for (const stream of streams) stream.destroy();
        await new Promise((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); server.closeAllConnections(); });
        await Promise.allSettled([...pending]);
        await Promise.all(streamClosed); // FileHandle auto-close has completed before the cleanup receipt.
        for (const row of routes.values()) need(same(row.stat, await regular(row.file)), 'Pinned model source changed during mirror lifetime');
        return Object.freeze({ closed: true, sourceStatsUnchanged: true, requestOverflow: status.requestOverflow,
          requestCount: status.requestCount, streamedBytes: status.servedBytes });
      })();
      return closePromise;
    },
  });
}
