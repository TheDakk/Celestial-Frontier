#!/usr/bin/env node
/** Explicit local development download; no inference, dependency install or hosted write. */
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, open, readFile, realpath, rename, unlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPOSITORY = resolve(HERE, '../..');
export const DEFAULT_MANIFEST = resolve(HERE, 'model-manifest.json');
export const DEFAULT_CACHE_ROOT = resolve(REPOSITORY, 'port/v2/apps/game/smoke/local-image-generation');
export const DEFAULT_TIMEOUT_MS = 600_000;
const SCHEMA = 'cf.local-image-model-manifest.v1';
const SHA256 = /^[0-9a-f]{64}$/;
const SAFE_COMPONENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export class ModelDownloadError extends Error {
  constructor(code, file = null, details = {}) {
    super(code); this.name = 'ModelDownloadError'; this.code = code; this.file = file; this.details = details;
  }
}
const fault = (code, file, details) => new ModelDownloadError(code, file, details);
const knownFailure = (error, file) => error instanceof ModelDownloadError ? error : fault('IO_OR_NETWORK_FAILURE', file);
const safePath = value => typeof value === 'string' && value.length <= 240
  && value.split('/').every(part => SAFE_COMPONENT.test(part) && part !== '.' && part !== '..');
const contained = (root, target) => {
  const part = relative(root, target);
  return part !== '' && !isAbsolute(part) && part !== '..' && !part.startsWith('..' + sep);
};

export function validateManifest(input, { allowLocalHttp = false } = {}) {
  if (!input || input.schema !== SCHEMA || !/^[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(input.modelId)
    || !/^[0-9a-f]{40}$/.test(input.revision) || !Array.isArray(input.files) || !input.files.length) {
    throw fault('INVALID_MANIFEST');
  }
  let source;
  try { source = new URL(input.sourceBaseUrl); } catch { throw fault('INVALID_SOURCE'); }
  const local = allowLocalHttp && source.protocol === 'http:'
    && ['127.0.0.1', '[::1]', 'localhost'].includes(source.hostname);
  if (source.username || source.password || source.search || source.hash || !source.pathname.endsWith('/')
    || (!local && (source.protocol !== 'https:' || source.hostname !== 'huggingface.co'
      || source.port || source.pathname !== `/${input.modelId}/resolve/${input.revision}/`))) {
    throw fault('INVALID_SOURCE');
  }
  const seen = new Set(), files = [];
  let totalBytes = 0;
  for (const entry of input.files) {
    if (!entry || !safePath(entry.path) || seen.has(entry.path)
      || !Number.isSafeInteger(entry.bytes) || entry.bytes < 1 || !SHA256.test(entry.sha256)) {
      throw fault('INVALID_FILE_INVENTORY');
    }
    seen.add(entry.path); totalBytes += entry.bytes;
    if (!Number.isSafeInteger(totalBytes)) throw fault('INVALID_TOTAL_BYTES');
    files.push(Object.freeze({ path: entry.path, bytes: entry.bytes, sha256: entry.sha256 }));
  }
  if (input.fileCount !== files.length || input.totalBytes !== totalBytes) throw fault('INVENTORY_TOTAL_MISMATCH');
  return Object.freeze({ modelId: input.modelId, revision: input.revision,
    sourceBaseUrl: source.href, files: Object.freeze(files), fileCount: files.length, totalBytes });
}

async function statOrNull(path) {
  try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function ensureDirectory(path) {
  await mkdir(path, { recursive: true });
  if (await realpath(path) !== resolve(path)) throw fault('SYMLINK_CACHE_REFUSED');
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw fault('UNSAFE_CACHE_DIRECTORY');
}

/** The production CLI only writes inside the repository's existing ignored model cache. */
export async function assertIgnoredCache(cacheDir) {
  const target = resolve(cacheDir);
  if (!contained(DEFAULT_CACHE_ROOT, target)) throw fault('CACHE_OUTSIDE_IGNORED_MODEL_ROOT');
  const check = spawnSync('git', ['-C', REPOSITORY, 'check-ignore', '--no-index', '--quiet', '--',
    resolve(target, 'cache-membership-probe.bin')], { encoding: 'utf8' });
  if (check.status !== 0) throw fault('CACHE_NOT_GIT_IGNORED');
  // Detect existing symlinks before recursive mkdir could follow them.
  let parent = target;
  while (contained(REPOSITORY, parent)) {
    const stat = await statOrNull(parent);
    if (stat?.isSymbolicLink() || (stat && !stat.isDirectory())) throw fault('UNSAFE_CACHE_DIRECTORY');
    parent = dirname(parent);
  }
  return target;
}

function fileDeadline(timeoutMs, outerSignal, file) {
  const controller = new AbortController(), expiresAt = performance.now() + timeoutMs;
  const cancel = () => controller.abort(fault('CANCELLED', file));
  if (outerSignal?.aborted) cancel(); else outerSignal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => controller.abort(fault('FILE_TIMEOUT', file)), timeoutMs);
  const check = () => {
    if (performance.now() >= expiresAt && !controller.signal.aborted) controller.abort(fault('FILE_TIMEOUT', file));
    if (controller.signal.aborted) throw controller.signal.reason;
  };
  return { signal: controller.signal, check,
    close() {
      clearTimeout(timer); outerSignal?.removeEventListener('abort', cancel);
      if (!controller.signal.aborted) controller.abort(fault('REQUEST_CLOSED', file));
    } };
}

async function verifyExisting(path, entry, deadline) {
  const stat = await statOrNull(path); deadline.check();
  if (!stat) return false;
  if (!stat.isFile() || stat.isSymbolicLink()) throw fault('UNSAFE_CACHED_FILE', entry.path);
  if (stat.size !== entry.bytes) throw fault('CACHE_SIZE_MISMATCH', entry.path, { actualBytes: stat.size });
  const hash = createHash('sha256'); let bytes = 0;
  const stream = createReadStream(path, { signal: deadline.signal });
  try {
    for await (const chunk of stream) {
      deadline.check(); bytes += chunk.byteLength;
      if (bytes > entry.bytes) throw fault('CACHE_SIZE_MISMATCH', entry.path, { actualBytes: bytes });
      hash.update(chunk);
    }
    deadline.check();
  } catch (error) { deadline.check(); throw error; }
  const actualSha256 = hash.digest('hex');
  if (bytes !== entry.bytes) throw fault('CACHE_SIZE_MISMATCH', entry.path, { actualBytes: bytes });
  if (actualSha256 !== entry.sha256) throw fault('CACHE_SHA256_MISMATCH', entry.path, { actualSha256 });
  return true;
}

async function acquireFile(manifest, entry, cacheDir, deadline, verifyOnly) {
  const destination = resolve(cacheDir, ...entry.path.split('/'));
  if (!contained(cacheDir, destination)) throw fault('UNSAFE_DESTINATION', entry.path);
  // Check parents before creating or opening any model path.
  let parent = dirname(destination);
  while (contained(cacheDir, parent)) {
    const stat = await statOrNull(parent);
    if (stat?.isSymbolicLink() || (stat && !stat.isDirectory())) throw fault('UNSAFE_CACHE_DIRECTORY', entry.path);
    parent = dirname(parent);
  }
  if (await verifyExisting(destination, entry, deadline)) return 'verified-reused';
  if (verifyOnly) throw fault('MISSING_CACHED_FILE', entry.path);
  await ensureDirectory(dirname(destination)); deadline.check();
  const partial = `${destination}.part-${randomUUID()}`;
  let handle = null, reader = null;
  try {
    handle = await open(partial, 'wx', 0o600); deadline.check();
    const url = new URL(entry.path.split('/').map(encodeURIComponent).join('/'), manifest.sourceBaseUrl);
    const response = await fetch(url, { signal: deadline.signal, credentials: 'omit', redirect: 'follow',
      headers: { 'accept-encoding': 'identity' } });
    // Retain the body before rejecting headers, so every streaming response closes.
    reader = response.body?.getReader() ?? null;
    deadline.check();
    if (!response.ok) throw fault('HTTP_FAILURE', entry.path, { status: response.status });
    const declared = response.headers.get('content-length');
    if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) !== entry.bytes)) {
      throw fault('RESPONSE_SIZE_MISMATCH', entry.path);
    }
    if (!reader) throw fault('EMPTY_RESPONSE_BODY', entry.path);
    const encoding = response.headers.get('content-encoding');
    if (encoding !== null && encoding !== 'identity') throw fault('UNEXPECTED_CONTENT_ENCODING', entry.path);
    const hash = createHash('sha256'); let bytes = 0;
    while (true) {
      const chunk = await reader.read(); deadline.check();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > entry.bytes) throw fault('DOWNLOAD_SIZE_MISMATCH', entry.path, { actualBytes: bytes });
      hash.update(chunk.value);
      // FileHandle.write may complete partially; never assume one write consumed a chunk.
      let offset = 0;
      while (offset < chunk.value.byteLength) {
        const result = await handle.write(chunk.value, offset, chunk.value.byteLength - offset);
        deadline.check();
        if (result.bytesWritten < 1) throw fault('WRITE_MADE_NO_PROGRESS', entry.path);
        offset += result.bytesWritten;
      }
    }
    reader.releaseLock(); reader = null;
    if (bytes !== entry.bytes) throw fault('DOWNLOAD_SIZE_MISMATCH', entry.path, { actualBytes: bytes });
    const actualSha256 = hash.digest('hex');
    if (actualSha256 !== entry.sha256) throw fault('DOWNLOAD_SHA256_MISMATCH', entry.path, { actualSha256 });
    await handle.sync(); deadline.check(); await handle.close(); handle = null; deadline.check();
    if (await statOrNull(destination)) throw fault('DESTINATION_APPEARED', entry.path);
    deadline.check(); await rename(partial, destination);
    return 'downloaded';
  } catch (error) {
    deadline.check(); throw knownFailure(error, entry.path);
  } finally {
    if (reader) { try { await reader.cancel(); } catch {} try { reader.releaseLock(); } catch {} }
    if (handle) { try { await handle.close(); } catch {} }
    try { await unlink(partial); } catch (error) { if (error.code !== 'ENOENT') throw fault('PARTIAL_CLEANUP_FAILED', entry.path); }
  }
}

/** Importable for local-server controls. The CLI additionally enforces ignored-cache membership. */
export async function fetchModel({ manifest: input, cacheDir, timeoutMs = DEFAULT_TIMEOUT_MS,
  signal, verifyOnly = false, allowLocalHttp = false, onProgress = () => {} }) {
  const manifest = validateManifest(input, { allowLocalHttp });
  if (typeof cacheDir !== 'string' || !isAbsolute(cacheDir)) throw fault('EXPLICIT_ABSOLUTE_CACHE_REQUIRED');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 1_800_000) throw fault('INVALID_TIMEOUT');
  await ensureDirectory(cacheDir);
  const lockPath = resolve(cacheDir, '.model-download.lock');
  let lock;
  try { lock = await open(lockPath, 'wx', 0o600); }
  catch (error) { throw error.code === 'EEXIST' ? fault('CACHE_BUSY') : knownFailure(error); }
  const receipt = { schema: 'cf.local-image-download-receipt.v1', modelId: manifest.modelId,
    revision: manifest.revision, manifestSha256: createHash('sha256').update(JSON.stringify(input)).digest('hex'),
    startedAt: new Date().toISOString(), finishedAt: null, status: 'running',
    fileCount: manifest.fileCount, totalBytes: manifest.totalBytes, timeoutMs, verifyOnly, files: [], failure: null };
  let failure = null, active = null, receiptPath = null;
  try {
    for (const entry of manifest.files) {
      active = entry.path;
      const deadline = fileDeadline(timeoutMs, signal, active);
      try {
        deadline.check();
        const disposition = await acquireFile(manifest, entry, cacheDir, deadline, verifyOnly);
        receipt.files.push({ ...entry, disposition });
        onProgress(Object.freeze({ path: entry.path, disposition, bytes: entry.bytes }));
      } finally { deadline.close(); }
    }
    receipt.status = 'complete';
  } catch (error) {
    failure = knownFailure(error, active);
    receipt.status = failure.code === 'CANCELLED' ? 'cancelled' : 'failed';
    receipt.failure = { code: failure.code, file: failure.file, ...failure.details };
  } finally {
    receipt.finishedAt = new Date().toISOString();
    try {
      const receipts = resolve(cacheDir, '.receipts'); await ensureDirectory(receipts);
      receiptPath = resolve(receipts, `${receipt.finishedAt.replace(/[:.]/g, '-')}-${randomUUID()}.json`);
      await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    } finally { await lock.close(); await unlink(lockPath); }
  }
  if (failure) { failure.receiptPath = receiptPath; throw failure; }
  return Object.freeze({ receiptPath, receipt });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    process.stdout.write('Usage: node tools/local-image-generation/fetch-model.mjs [--download | --verify-only] [--cache-dir=ABSOLUTE_IGNORED_PATH] [--timeout-ms=600000]\nWithout a mode, print the pinned inventory; no network or cache writes. Downloads stop on the first failure; no automatic retry.\n');
    return;
  }
  const manifest = JSON.parse(await readFile(DEFAULT_MANIFEST, 'utf8'));
  let mode = 'plan', cacheDir = resolve(DEFAULT_CACHE_ROOT, manifest.modelId.replaceAll('/', '--'), manifest.revision);
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  for (const arg of args) {
    if (arg === '--download' || arg === '--verify-only') {
      if (mode !== 'plan') throw fault('ONE_MODE_REQUIRED');
      mode = arg === '--download' ? 'download' : 'verify';
    } else if (arg.startsWith('--cache-dir=')) cacheDir = resolve(arg.slice('--cache-dir='.length));
    else if (arg.startsWith('--timeout-ms=')) timeoutMs = Number(arg.slice('--timeout-ms='.length));
    else throw fault('UNKNOWN_ARGUMENT');
  }
  const validated = validateManifest(manifest);
  const target = await assertIgnoredCache(cacheDir);
  if (mode === 'plan') {
    process.stdout.write(JSON.stringify({ mode, modelId: validated.modelId, revision: validated.revision,
      fileCount: validated.fileCount, totalBytes: validated.totalBytes, cacheDir: target }, null, 2) + '\n');
    return;
  }
  const controller = new AbortController(), cancel = () => controller.abort();
  process.once('SIGINT', cancel); process.once('SIGTERM', cancel);
  try {
    const result = await fetchModel({ manifest, cacheDir: target, timeoutMs, signal: controller.signal,
      verifyOnly: mode === 'verify', onProgress: row => process.stdout.write(JSON.stringify(row) + '\n') });
    process.stdout.write(JSON.stringify({ status: 'complete', receiptPath: result.receiptPath,
      fileCount: validated.fileCount, totalBytes: validated.totalBytes }) + '\n');
  } finally { process.removeListener('SIGINT', cancel); process.removeListener('SIGTERM', cancel); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const failure = knownFailure(error);
    process.stderr.write(JSON.stringify({ status: 'failed', code: failure.code,
      file: failure.file, receiptPath: failure.receiptPath ?? null }) + '\n');
    process.exitCode = failure.code === 'CANCELLED' ? 130 : 1;
  });
}
