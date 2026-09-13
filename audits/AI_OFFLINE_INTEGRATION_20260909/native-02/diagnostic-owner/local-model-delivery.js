/** Opt-in browser model delivery, not a model/phone/painting qualification.
 * OPFS chunks are immutable; only tiny active/ready markers are atomically replaced.
 * Existing model attempts, game builds, saves and scene images are never deleted.
 * Quota estimates include all origin usage; Web Locks serialize this owner only.
 * Actual quota/write errors still stop installation without publishing readiness.
 */
import { LocalModelSha256V1 } from './local-model-sha256.js';
export const LOCAL_MODEL_CHUNK_BYTES_V1 = 1_048_576;
const MAX_NETWORK_CHUNK = 8 * LOCAL_MODEL_CHUNK_BYTES_V1;
const MARKER_MARGIN = 131_072;
const NAMESPACE = 'cf-local-model-delivery-v1';
class DeliveryError extends Error {
    code;
    constructor(code, message = code) {
        super(message);
        this.code = code;
    }
}
const requireValue = (condition, code) => { if (!condition)
    throw new DeliveryError(code); };
const count = (value) => Number.isSafeInteger(value) && value >= 0;
const digest = (value) => new LocalModelSha256V1().update(new TextEncoder().encode(value)).digestHex();
const notFound = (error) => error instanceof Error && error.name === 'NotFoundError';
const canceled = (signal) => { if (signal.aborted)
    throw new DeliveryError('canceled'); };
function normalizeManifest(source) {
    requireValue(source?.schema === 'cf.local-model-delivery-manifest.v1'
        && /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/u.test(source.modelId)
        && /^[a-f0-9]{40}$/u.test(source.revision) && /^[a-f0-9]{64}$/u.test(source.sourceManifestSha256)
        && Array.isArray(source.files) && source.files.length > 0 && source.files.length <= 128, 'invalid-manifest');
    const paths = new Set();
    const files = source.files.map(file => {
        requireValue(typeof file.path === 'string' && file.path.length <= 240
            && file.path.split('/').every(segment => /^[A-Za-z0-9_.-]+$/u.test(segment) && segment !== '.' && segment !== '..')
            && !paths.has(file.path) && count(file.bytes) && file.bytes > 0 && file.bytes <= 4_294_967_296
            && /^[a-f0-9]{64}$/u.test(file.sha256), 'invalid-manifest-file');
        paths.add(file.path);
        return Object.freeze({ path: file.path, bytes: file.bytes, sha256: file.sha256 });
    });
    const totalBytes = files.reduce((total, file) => total + file.bytes, 0);
    requireValue(count(totalBytes) && totalBytes === source.totalBytes && totalBytes <= 34_359_738_368, 'invalid-manifest-total');
    return Object.freeze({ schema: source.schema, modelId: source.modelId, revision: source.revision,
        sourceManifestSha256: source.sourceManifestSha256, totalBytes, files: Object.freeze(files) });
}
function nativeStorage() {
    requireValue(typeof navigator !== 'undefined' && typeof navigator.storage?.getDirectory === 'function', 'opfs-unavailable');
    return { getDirectory: () => navigator.storage.getDirectory(), estimate: () => navigator.storage.estimate() };
}
function nativeLocks() {
    requireValue(typeof navigator !== 'undefined' && typeof navigator.locks?.request === 'function', 'web-locks-unavailable');
    return { run: (name, signal, action) => navigator.locks.request(name, { mode: 'exclusive', signal }, action) };
}
async function maybeFile(directory, name) {
    try {
        return await (await directory.getFileHandle(name)).getFile();
    }
    catch (error) {
        if (notFound(error))
            return null;
        throw error;
    }
}
async function readMarker(directory, name) {
    const file = await maybeFile(directory, name);
    if (!file)
        return null;
    requireValue(file.size > 0 && file.size <= 65_536, 'invalid-marker');
    try {
        return JSON.parse(await file.text());
    }
    catch {
        throw new DeliveryError('invalid-marker');
    }
}
async function atomicWrite(directory, name, data, signal) {
    canceled(signal);
    const writer = await (await directory.getFileHandle(name, { create: true })).createWritable();
    let closed = false;
    try {
        await writer.write(data);
        canceled(signal);
        await writer.close();
        closed = true;
    }
    finally {
        if (!closed)
            await writer.abort();
    }
}
function markerAttempt(value, manifestSha256) {
    requireValue(value !== null && typeof value === 'object', 'invalid-marker');
    const row = value;
    requireValue(row.schema === 'cf.local-model-attempt.v1' && row.manifestSha256 === manifestSha256
        && typeof row.attemptId === 'string' && /^[A-Za-z0-9_-]{1,80}$/u.test(row.attemptId), 'invalid-marker');
    return { schema: row.schema, manifestSha256, attemptId: row.attemptId };
}
export function createLocalModelDeliveryV1(options) {
    const manifest = normalizeManifest(options.manifest), manifestSha256 = digest(JSON.stringify(manifest));
    const address = new URL(options.baseUrl ?? `https://huggingface.co/${manifest.modelId}/resolve/${manifest.revision}/`);
    requireValue((address.protocol === 'https:' || address.protocol === 'http:'
        && ['localhost', '127.0.0.1', '[::1]'].includes(address.hostname))
        && !address.username && !address.password && !address.search && !address.hash && address.pathname.endsWith('/'), 'invalid-base-url');
    const headroom = options.headroomBytes ?? 64 * LOCAL_MODEL_CHUNK_BYTES_V1;
    const timeout = options.fileTimeoutMs ?? 600_000;
    requireValue(count(headroom) && Number.isInteger(timeout) && timeout >= 100 && timeout <= 1_800_000, 'invalid-delivery-budget');
    const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
    let readyAttempt = null, busy = false;
    let current = Object.freeze({ phase: 'unknown', ready: false, manifestSha256,
        totalBytes: manifest.totalBytes, storedBytes: 0, verifiedBytes: 0, downloadedBytes: 0,
        verifiedFiles: 0, totalFiles: manifest.files.length, file: null, error: null, attemptId: null,
        qualityAccepted: false, deviceQualified: false });
    const publish = (patch) => {
        current = Object.freeze({ ...current, ...patch });
        options.onStatus?.(current);
        return current;
    };
    const chunkName = (fileIndex, chunkIndex) => `f${fileIndex}-c${chunkIndex}`;
    const activeName = `active-${manifestSha256}.json`, readyName = `ready-${manifestSha256}.json`;
    const getNamespace = async (storage) => (await storage.getDirectory()).getDirectoryHandle(NAMESPACE, { create: true });
    const getAttempt = (directory, marker, create = false) => directory.getDirectoryHandle(marker.attemptId, { create });
    async function quota(storage, additional) {
        const { usage, quota: capacity } = await storage.estimate();
        requireValue(usage !== undefined && capacity !== undefined && count(usage) && count(capacity), 'storage-estimate-unavailable');
        requireValue(usage + additional + headroom + MARKER_MARGIN <= capacity, 'insufficient-storage');
    }
    async function scan(directory, signal, full) {
        let stored = 0, verified = 0, verifiedFiles = 0;
        for (let index = 0; index < manifest.files.length; index++) {
            const file = manifest.files[index], hash = new LocalModelSha256V1();
            let bytes = 0;
            for (let part = 0; bytes < file.bytes; part++) {
                canceled(signal);
                const blob = await maybeFile(directory, chunkName(index, part));
                if (!blob || blob.size === 0)
                    break;
                const expected = Math.min(LOCAL_MODEL_CHUNK_BYTES_V1, file.bytes - bytes);
                requireValue(blob.size === expected, 'invalid-chunk-length');
                hash.update(new Uint8Array(await blob.arrayBuffer()));
                bytes += expected;
                stored += expected;
            }
            if (bytes === file.bytes) {
                requireValue(hash.digestHex() === file.sha256, 'hash-mismatch');
                verified += bytes;
                verifiedFiles++;
            }
            else if (full)
                throw new DeliveryError('missing-ready-chunk');
            publish({ storedBytes: stored, verifiedBytes: verified, verifiedFiles, file: file.path });
        }
        return stored;
    }
    async function verifyReady(directory, value, signal) {
        if (value === null)
            return false;
        const marker = markerAttempt(value, manifestSha256), attempt = await getAttempt(directory, marker);
        requireValue(await readMarker(attempt, 'failed.json') === null, 'failed-attempt');
        publish({ phase: 'verifying', attemptId: marker.attemptId });
        await scan(attempt, signal, true);
        canceled(signal);
        readyAttempt = marker;
        publish({ phase: 'ready', ready: true, file: null, error: null });
        return true;
    }
    async function downloadFile(attempt, index, storage, signal) {
        const file = manifest.files[index], hash = new LocalModelSha256V1();
        let offset = 0, part = 0;
        // Rehash every persisted prefix, never trust a journal's byte count or hash.
        while (offset < file.bytes) {
            canceled(signal);
            const blob = await maybeFile(attempt, chunkName(index, part));
            if (!blob || blob.size === 0)
                break;
            requireValue(blob.size === Math.min(LOCAL_MODEL_CHUNK_BYTES_V1, file.bytes - offset), 'invalid-chunk-length');
            hash.update(new Uint8Array(await blob.arrayBuffer()));
            offset += blob.size;
            part++;
        }
        if (offset < file.bytes) {
            await quota(storage, file.bytes - offset + LOCAL_MODEL_CHUNK_BYTES_V1);
            const controller = new AbortController(), abort = () => controller.abort();
            signal.addEventListener('abort', abort, { once: true });
            if (signal.aborted)
                abort();
            const timer = setTimeout(abort, timeout);
            let reader = null;
            try {
                const headers = offset ? { Range: `bytes=${offset}-` } : {};
                const response = await fetcher(new URL(file.path.split('/').map(encodeURIComponent).join('/'), address), { method: 'GET', headers, signal: controller.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
                canceled(signal);
                if (offset)
                    requireValue(response.status === 206
                        && response.headers.get('content-range') === `bytes ${offset}-${file.bytes - 1}/${file.bytes}`, 'invalid-range-response');
                else
                    requireValue(response.status === 200 && !response.headers.has('content-range'), 'invalid-http-response');
                requireValue(response.body !== null, 'missing-response-body');
                reader = response.body.getReader();
                let chunk = new Uint8Array(Math.min(LOCAL_MODEL_CHUNK_BYTES_V1, file.bytes - offset)), used = 0;
                publish({ phase: 'downloading', file: file.path });
                while (true) {
                    canceled(signal);
                    const next = await reader.read();
                    canceled(signal);
                    if (next.done)
                        break;
                    const value = next.value;
                    requireValue(value instanceof Uint8Array && value.byteLength <= MAX_NETWORK_CHUNK, 'network-chunk-limit');
                    requireValue(offset + used + value.byteLength <= file.bytes, 'excess-file-bytes');
                    publish({ downloadedBytes: current.downloadedBytes + value.byteLength });
                    for (let at = 0; at < value.byteLength;) {
                        const take = Math.min(chunk.length - used, value.byteLength - at);
                        chunk.set(value.subarray(at, at + take), used);
                        used += take;
                        at += take;
                        if (used === chunk.length) {
                            await quota(storage, chunk.length + LOCAL_MODEL_CHUNK_BYTES_V1);
                            const name = chunkName(index, part), existing = await maybeFile(attempt, name);
                            requireValue(existing === null || existing.size === 0, 'immutable-chunk-conflict');
                            await atomicWrite(attempt, name, chunk, signal);
                            const committed = await maybeFile(attempt, name);
                            requireValue(committed !== null && committed.size === chunk.length, 'invalid-chunk-length');
                            hash.update(new Uint8Array(await committed.arrayBuffer()));
                            offset += chunk.length;
                            part++;
                            used = 0;
                            publish({ storedBytes: current.storedBytes + chunk.length });
                            chunk = new Uint8Array(Math.min(LOCAL_MODEL_CHUNK_BYTES_V1, file.bytes - offset));
                        }
                    }
                }
                requireValue(offset === file.bytes && used === 0, 'truncated-file');
            }
            finally {
                controller.abort();
                clearTimeout(timer);
                signal.removeEventListener('abort', abort);
                if (reader) {
                    try {
                        await reader.cancel();
                    }
                    finally {
                        reader.releaseLock();
                    }
                }
            }
        }
        canceled(signal);
        requireValue(hash.digestHex() === file.sha256, 'hash-mismatch');
        publish({ verifiedBytes: current.verifiedBytes + file.bytes, verifiedFiles: current.verifiedFiles + 1, file: file.path });
    }
    async function run(mode, signal, restart) {
        if (busy)
            throw new DeliveryError('delivery-busy');
        busy = true;
        readyAttempt = null;
        publish({ phase: 'verifying', ready: false, storedBytes: 0, verifiedBytes: 0,
            verifiedFiles: 0, downloadedBytes: 0, error: null, file: null, attemptId: null });
        try {
            const storage = options.storage ?? nativeStorage(), locks = options.locks ?? nativeLocks();
            return await locks.run(NAMESPACE, signal, async () => {
                canceled(signal);
                const directory = await getNamespace(storage);
                if (!restart && await verifyReady(directory, await readMarker(directory, readyName), signal))
                    return current;
                const active = restart ? null : await readMarker(directory, activeName);
                let marker = active === null ? null : markerAttempt(active, manifestSha256);
                let attempt = marker ? await getAttempt(directory, marker) : null;
                const failed = attempt ? await readMarker(attempt, 'failed.json') : null;
                if (mode === 'verify') {
                    if (!attempt)
                        return publish({ phase: 'missing', file: null });
                    publish({ attemptId: marker.attemptId });
                    if (failed !== null)
                        return publish({ phase: 'failed', error: 'failed-attempt', file: null });
                    await scan(attempt, signal, false);
                    return publish({ phase: 'partial', file: null });
                }
                if (restart || !attempt || failed !== null) {
                    await quota(storage, manifest.totalBytes + LOCAL_MODEL_CHUNK_BYTES_V1);
                    const attemptId = (options.createAttemptId ?? (() => crypto.randomUUID()))();
                    marker = markerAttempt({ schema: 'cf.local-model-attempt.v1', manifestSha256, attemptId }, manifestSha256);
                    try {
                        await directory.getDirectoryHandle(attemptId);
                        throw new DeliveryError('attempt-id-collision');
                    }
                    catch (error) {
                        if (!notFound(error))
                            throw error;
                    }
                    attempt = await getAttempt(directory, marker, true);
                    await atomicWrite(directory, activeName, JSON.stringify(marker), signal);
                }
                publish({ attemptId: marker.attemptId });
                // Count/validate persisted chunks first for truthful reopened progress.
                await scan(attempt, signal, false);
                publish({ verifiedBytes: 0, verifiedFiles: 0 });
                try {
                    for (let index = 0; index < manifest.files.length; index++)
                        await downloadFile(attempt, index, storage, signal);
                    canceled(signal);
                    await quota(storage, MARKER_MARGIN);
                    await atomicWrite(directory, readyName, JSON.stringify(marker), signal);
                    // Marker replacement is the publication boundary; never call it ready before close.
                    readyAttempt = marker;
                    return publish({ phase: 'ready', ready: true, error: null, file: null });
                }
                catch (error) {
                    if (error instanceof DeliveryError && ['hash-mismatch', 'invalid-chunk-length'].includes(error.code))
                        await atomicWrite(attempt, 'failed.json', JSON.stringify({ code: error.code, manifestSha256 }), new AbortController().signal);
                    throw error;
                }
            });
        }
        catch (error) {
            const code = signal.aborted ? 'canceled' : error instanceof DeliveryError ? error.code
                : error instanceof Error ? error.name === 'QuotaExceededError' ? 'insufficient-storage' : error.message : 'delivery-failed';
            const phase = code === 'canceled' ? 'canceled'
                : ['insufficient-storage', 'storage-estimate-unavailable'].includes(code) ? 'paused'
                    : ['hash-mismatch', 'invalid-chunk-length', 'invalid-marker', 'missing-ready-chunk', 'failed-attempt'].includes(code) ? 'invalid' : 'failed';
            readyAttempt = null;
            return publish({ phase, ready: false, error: code });
        }
        finally {
            busy = false;
        }
    }
    return Object.freeze({ manifest, manifestSha256, baseUrl: address.href, status: () => current,
        install: (args = {}) => run('install', args.signal ?? new AbortController().signal, args.restart === true),
        verify: (args = {}) => run('verify', args.signal ?? new AbortController().signal, false),
        async openFile(filePath) {
            requireValue(readyAttempt !== null && current.ready, 'model-not-verified-ready');
            const index = manifest.files.findIndex(file => file.path === filePath);
            requireValue(index >= 0, 'unknown-model-file');
            const file = manifest.files[index], directory = await getNamespace(options.storage ?? nativeStorage());
            const attempt = await getAttempt(directory, readyAttempt);
            const parts = [];
            for (let offset = 0, part = 0; offset < file.bytes; part++) {
                const blob = await maybeFile(attempt, chunkName(index, part));
                requireValue(blob !== null && blob.size === Math.min(LOCAL_MODEL_CHUNK_BYTES_V1, file.bytes - offset), 'missing-ready-chunk');
                parts.push(blob);
                offset += blob.size;
            }
            return new Blob(parts, { type: 'application/octet-stream' });
        },
    });
}
/** Read capabilities/estimates only. No model bytes, inference, benchmark or UA/RAM guesses. */
export async function probeLocalModelCapabilitiesV1(host = navigator, secureContext = globalThis.isSecureContext === true) {
    const errors = [];
    let usageBytes = null, quotaBytes = null, persisted = null;
    try {
        const estimate = await host.storage?.estimate();
        usageBytes = estimate?.usage !== undefined && count(estimate.usage) ? estimate.usage : null;
        quotaBytes = estimate?.quota !== undefined && count(estimate.quota) ? estimate.quota : null;
        persisted = typeof host.storage?.persisted === 'function' ? await host.storage.persisted() : null;
    }
    catch (error) {
        errors.push(String(error));
    }
    let webgpu = false, shaderF16 = false, fallbackAdapter = null, limits = null;
    try {
        const adapter = await host.gpu?.requestAdapter({ powerPreference: 'high-performance' });
        if (adapter) {
            webgpu = true;
            shaderF16 = adapter.features.has('shader-f16');
            fallbackAdapter = adapter.info.isFallbackAdapter;
            limits = { maxBufferSize: adapter.limits.maxBufferSize, maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
                maxStorageBuffersPerShaderStage: adapter.limits.maxStorageBuffersPerShaderStage };
        }
    }
    catch (error) {
        errors.push(String(error));
    }
    const opfs = typeof host.storage?.getDirectory === 'function', webLocks = typeof host.locks?.request === 'function';
    return Object.freeze({ secureContext, opfs, webLocks, webgpu, shaderF16, fallbackAdapter, limits,
        storage: { usageBytes, quotaBytes, persisted }, supported: secureContext && opfs && webLocks && webgpu && shaderF16 && fallbackAdapter === false
            && usageBytes !== null && quotaBytes !== null, deviceQualified: false, errors: Object.freeze(errors) });
}
