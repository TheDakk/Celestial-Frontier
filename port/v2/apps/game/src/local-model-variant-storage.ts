/** Explicit local derivation storage. No downloads, eviction or model selection.
 * The parent delivery lock protects immutable attempt chunks through publication,
 * final readback and explicit lease release. Failed attempts remain diagnostic data. */
import { LOCAL_MODEL_CHUNK_BYTES_V1 as CHUNK, type LocalModelDirectoryV1,
  type LocalModelStorageV1, type LocalModelLockV1, type LocalModelFileV1 } from './local-model-delivery.js';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 as MODEL } from './local-model-manifest.js';
import { LocalModelSha256V1 } from './local-model-sha256.js';
import { LOCAL_MODEL_VARIANT_FILES_V1, LOCAL_MODEL_VARIANT_PLAN_SHA256_V1,
  verifyVariantBlobV1, type LocalModelVariantReadyV1, type LocalModelVariantStorageV1,
  type LocalModelVariantTransactionV1 } from './local-model-variant.js';

const NAMESPACE = 'cf-local-model-variants-v1', LOCK = 'cf-local-model-delivery-v1';
const MARKER_BUDGET = 65_536, HEADROOM = 64 * CHUNK;
const encoder = new TextEncoder();
const hash = (bytes: Uint8Array): string => new LocalModelSha256V1().update(bytes).digestHex();
const same = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);
function requireValue(value: unknown, message: string): asserts value { if (!value) throw Error(message); }
const safeId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/u.test(value);
const digest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const missing = (error: unknown): boolean => error instanceof Error && error.name === 'NotFoundError';
const checkSignal = (signal: AbortSignal): void => {
  if (signal.aborted) throw new DOMException('Variant storage canceled', 'AbortError');
};
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { for (const entry of Object.values(value)) freeze(entry); Object.freeze(value); }
  return value;
}
export interface LocalModelVariantStorageStatusV1 {
  readonly phase: 'unknown' | 'deriving' | 'verifying' | 'ready' | 'missing' | 'invalid' | 'failed';
  readonly ready: boolean; readonly marker: LocalModelVariantReadyV1 | null;
  readonly error: string | null; readonly verifiedBytes: number;
}
export interface LocalModelVariantStorageOwnerV1 extends LocalModelVariantStorageV1 {
  status(): LocalModelVariantStorageStatusV1;
  verify(parentManifestSha256: string, parentAttemptId: string, signal?: AbortSignal): Promise<LocalModelVariantStorageStatusV1>;
  openFile(path: string): Promise<Blob>;
}
export interface LocalModelVariantStorageOptionsV1 {
  readonly storage?: LocalModelStorageV1; readonly locks?: LocalModelLockV1;
  readonly createAttemptId?: () => string;
}
/** Lower-level exact-byte contract for storage outcome controls. The public model
 * factory below never accepts caller-supplied pins, budgets or a different variant. */
export interface VariantStorageContractV1 {
  readonly planSha256: string; readonly parentManifestSha256: string;
  readonly sourceManifestSha256: string; readonly files: readonly LocalModelFileV1[];
}
interface Attempt {
  readonly schema: 'cf.local-model-variant-attempt.v1'; readonly attemptId: string;
  readonly planSha256: string; readonly parentManifestSha256: string; readonly parentAttemptId: string;
}
interface Pointer {
  readonly schema: 'cf.local-model-variant-pointer.v1'; readonly attemptId: string;
  readonly marker: LocalModelVariantReadyV1;
}
const revokedValue = (attempt: Attempt): object => ({ schema: 'cf.local-model-variant-revoked.v1',
  attemptId: attempt.attemptId, planSha256: attempt.planSha256 });
function nativeStorage(): LocalModelStorageV1 {
  requireValue(typeof navigator !== 'undefined' && typeof navigator.storage?.getDirectory === 'function', 'Variant OPFS unavailable');
  return { getDirectory: () => navigator.storage.getDirectory(), estimate: () => navigator.storage.estimate() };
}
function nativeLocks(): LocalModelLockV1 {
  requireValue(typeof navigator !== 'undefined' && typeof navigator.locks?.request === 'function', 'Variant Web Locks unavailable');
  return { run: (name, signal, action) => navigator.locks.request(name, { mode: 'exclusive', signal }, action) };
}
async function maybeFile(directory: LocalModelDirectoryV1, name: string): Promise<Blob | null> {
  try { return await (await directory.getFileHandle(name)).getFile(); } catch (error) { if (missing(error)) return null; throw error; }
}
async function readJson(directory: LocalModelDirectoryV1, name: string): Promise<unknown> {
  const blob = await maybeFile(directory, name); if (!blob) return null;
  requireValue(blob.size > 0 && blob.size <= MARKER_BUDGET, 'Variant invalid marker size');
  const value = JSON.parse(await blob.text()) as unknown;
  requireValue(value !== null && typeof value === 'object', 'Variant invalid marker JSON'); return value;
}
async function atomicWrite(directory: LocalModelDirectoryV1, name: string,
  data: Uint8Array<ArrayBuffer> | string, signal: AbortSignal): Promise<void> {
  checkSignal(signal); const writer = await (await directory.getFileHandle(name, { create: true })).createWritable();
  let closed = false;
  try { await writer.write(data); checkSignal(signal); await writer.close(); closed = true; }
  catch (error) {
    if (!closed) { try { await writer.abort(); } catch (cleanup) { throw new AggregateError([error, cleanup], 'Variant atomic write and abort failed'); } }
    throw error;
  }
}

export function createVariantStorageOwnerV1(input: VariantStorageContractV1,
  options: LocalModelVariantStorageOptionsV1 = {}): LocalModelVariantStorageOwnerV1 {
  const contract = freeze(JSON.parse(JSON.stringify(input)) as VariantStorageContractV1);
  requireValue(digest(contract.planSha256) && digest(contract.parentManifestSha256) && digest(contract.sourceManifestSha256)
    && Array.isArray(contract.files) && contract.files.length === 2
    && contract.files.every(file => /^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/u.test(file.path)
      && integer(file.bytes) && file.bytes > 0 && digest(file.sha256))
    && new Set(contract.files.map(file => file.path)).size === 2, 'Variant storage contract');
  const total = contract.files.reduce((sum, file) => sum + file.bytes, 0);
  requireValue(integer(total) && total <= 352_323_881, 'Variant storage total');
  const pointerName = `ready-${contract.planSha256}.json`;
  const storage = (): LocalModelStorageV1 => options.storage ?? nativeStorage();
  const locks = (): LocalModelLockV1 => options.locks ?? nativeLocks();
  let busy = false, retained: Pointer | null = null;
  let current: LocalModelVariantStorageStatusV1 = freeze({ phase: 'unknown', ready: false, marker: null, error: null, verifiedBytes: 0 });
  const state = (phase: LocalModelVariantStorageStatusV1['phase'], marker: LocalModelVariantReadyV1 | null = null,
    error: string | null = null, verifiedBytes = 0): LocalModelVariantStorageStatusV1 => {
    current = freeze({ phase, ready: phase === 'ready', marker, error, verifiedBytes }); return current;
  };
  const markerFor = (parentAttemptId: string): LocalModelVariantReadyV1 => freeze({ schema: 'cf.local-model-variant-ready.v1',
    variant: 'q8-block32-repacked-v1', planSha256: contract.planSha256, parentManifestSha256: contract.parentManifestSha256,
    parentAttemptId, sourceManifestSha256: contract.sourceManifestSha256, files: contract.files,
    payloadBytes: total, qualityAccepted: false, deviceQualified: false });
  const admitMarker = (value: unknown): LocalModelVariantReadyV1 => {
    requireValue(value && typeof value === 'object', 'Variant invalid ready marker');
    const row = value as LocalModelVariantReadyV1;
    requireValue(safeId(row.parentAttemptId) && same(row, markerFor(row.parentAttemptId)), 'Variant ready marker identity');
    return markerFor(row.parentAttemptId);
  };
  const attemptFor = (attemptId: string, parentAttemptId: string): Attempt => ({ schema: 'cf.local-model-variant-attempt.v1',
    attemptId, planSha256: contract.planSha256, parentManifestSha256: contract.parentManifestSha256, parentAttemptId });
  const readPointer = async (namespace: LocalModelDirectoryV1): Promise<{
    pointer: Pointer; directory: LocalModelDirectoryV1; attempt: Attempt; revoked: boolean;
  } | null> => {
    const raw = await readJson(namespace, pointerName); if (raw === null) return null;
    requireValue(raw && typeof raw === 'object', 'Variant invalid pointer');
    const row = raw as Pointer, marker = admitMarker(row.marker);
    requireValue(safeId(row.attemptId) && same(raw, { schema: 'cf.local-model-variant-pointer.v1', attemptId: row.attemptId, marker }), 'Variant pointer identity');
    const directory = await namespace.getDirectoryHandle(`attempt-${row.attemptId}`);
    const attempt = attemptFor(row.attemptId, marker.parentAttemptId);
    requireValue(same(await readJson(directory, 'attempt.json'), attempt), 'Variant attempt identity');
    requireValue(same(await readJson(directory, 'ready.json'), marker), 'Variant local readiness mismatch');
    const revoked = await readJson(directory, 'revoked.json');
    requireValue(revoked === null || same(revoked, revokedValue(attempt)), 'Variant invalid revocation');
    return { pointer: freeze({ schema: 'cf.local-model-variant-pointer.v1', attemptId: row.attemptId, marker }),
      directory, attempt, revoked: revoked !== null };
  };
  const compose = async (directory: LocalModelDirectoryV1, index: number, signal: AbortSignal): Promise<Blob> => {
    const expected = contract.files[index]!; const chunks: Blob[] = [];
    for (let offset = 0, part = 0; offset < expected.bytes; offset += CHUNK, part++) {
      checkSignal(signal); const blob = await maybeFile(directory, `f${index}-c${part}`); checkSignal(signal);
      requireValue(blob && blob.size === Math.min(CHUNK, expected.bytes - offset), 'Variant chunk size'); chunks.push(blob);
    }
    requireValue(await maybeFile(directory, `f${index}-c${chunks.length}`) === null, 'Variant excess chunk');
    checkSignal(signal); return new Blob(chunks);
  };
  const reserve = async (persisted: number, signal: AbortSignal): Promise<void> => {
    checkSignal(signal); const estimate = await storage().estimate(); checkSignal(signal);
    requireValue(integer(estimate.usage) && integer(estimate.quota) && estimate.quota >= estimate.usage,
      'Variant quota estimate unavailable');
    requireValue(estimate.quota - estimate.usage >= total - persisted + MARKER_BUDGET + HEADROOM + CHUNK,
      'Variant insufficient storage');
  };
  const owner: LocalModelVariantStorageOwnerV1 = {
    status: () => current,
    async begin(request, signal) {
      requireValue(!busy, 'Variant storage busy'); checkSignal(signal);
      requireValue(same(request, { payloadBytes: total, markerBudgetBytes: MARKER_BUDGET,
        planSha256: contract.planSha256, parentManifestSha256: contract.parentManifestSha256,
        parentAttemptId: request.parentAttemptId }) && safeId(request.parentAttemptId), 'Variant begin identity');
      busy = true; retained = null; state('deriving');
      let acquire!: (transaction: LocalModelVariantTransactionV1) => void, reject!: (error: unknown) => void;
      const acquired = new Promise<LocalModelVariantTransactionV1>((resolve, fail) => { acquire = resolve; reject = fail; });
      let release!: () => void; const completion = new Promise<void>(resolve => { release = resolve; });
      let admitted = false;
      const task = Promise.resolve().then(() => locks().run(LOCK, signal, async () => {
        checkSignal(signal); await reserve(0, signal);
        const namespace = await (await storage().getDirectory()).getDirectoryHandle(NAMESPACE, { create: true });
        const previous = await readPointer(namespace); checkSignal(signal);
        requireValue(!previous || previous.revoked, 'Variant already committed; verify existing files');
        const attemptId = (options.createAttemptId ?? (() => crypto.randomUUID()))();
        requireValue(safeId(attemptId), 'Variant attempt ID');
        let collision = false;
        try { await namespace.getDirectoryHandle(`attempt-${attemptId}`); collision = true; }
        catch (error) { if (!missing(error)) throw error; }
        requireValue(!collision, 'Variant attempt already exists');
        const directory = await namespace.getDirectoryHandle(`attempt-${attemptId}`, { create: true });
        const attempt = attemptFor(attemptId, request.parentAttemptId), marker = markerFor(request.parentAttemptId);
        await atomicWrite(directory, 'attempt.json', JSON.stringify(attempt), signal);
        requireValue(same(await readJson(directory, 'attempt.json'), attempt), 'Variant attempt write mismatch'); checkSignal(signal);
        let live = true, operation = false, committed = false, readBack = false, releaseStarted = false;
        let persisted = 0, index = 0, offset = 0, chunkIndex = 0, buffered = 0;
        let buffer = new Uint8Array(CHUNK), writeHash = new LocalModelSha256V1();
        const sealed = new Set<number>();
        const check = (): void => { requireValue(live, 'Variant lease retired'); checkSignal(signal); };
        const action = async <T>(body: () => Promise<T>): Promise<T> => {
          requireValue(!operation, 'Variant concurrent lease operation'); check(); operation = true;
          try { return await body(); } finally { operation = false; }
        };
        const flush = async (): Promise<void> => {
          if (!buffered) return; check(); await reserve(persisted, signal);
          const name = `f${index}-c${chunkIndex}`;
          requireValue(await maybeFile(directory, name) === null, 'Variant immutable chunk exists');
          const bytes = buffer.slice(0, buffered); await atomicWrite(directory, name, bytes, signal); check();
          const actual = await maybeFile(directory, name);
          requireValue(actual && actual.size === bytes.length && hash(new Uint8Array(await actual.arrayBuffer())) === hash(bytes), 'Variant chunk write mismatch');
          check(); persisted += bytes.length; chunkIndex++; buffered = 0;
        };
        const ownReady = async (): Promise<LocalModelVariantReadyV1> => {
          const row = await readPointer(namespace); check();
          requireValue(row && !row.revoked && row.pointer.attemptId === attemptId && same(row.pointer.marker, marker), 'Variant owned readiness changed');
          return row.pointer.marker;
        };
        const transaction: LocalModelVariantTransactionV1 = {
          write: (path, at, bytes) => action(async () => {
            const expected = contract.files[index];
            requireValue(!committed && expected && expected.path === path && at === offset
              && bytes instanceof Uint8Array && bytes.length > 0 && bytes.length <= CHUNK / 4
              && offset + bytes.length <= expected.bytes, 'Variant append geometry');
            writeHash.update(bytes); let from = 0;
            while (from < bytes.length) {
              const count = Math.min(CHUNK - buffered, bytes.length - from);
              buffer.set(bytes.subarray(from, from + count), buffered); buffered += count; from += count;
              if (buffered === CHUNK) await flush();
            }
            offset += bytes.length;
          }),
          seal: path => action(async () => {
            const expected = contract.files[index];
            requireValue(expected && path === expected.path && offset === expected.bytes
              && writeHash.digestHex() === expected.sha256, 'Variant seal identity');
            await flush(); const blob = await compose(directory, index, signal);
            await verifyVariantBlobV1(blob, expected, signal); check(); sealed.add(index);
            index++; offset = 0; chunkIndex = 0; buffered = 0; writeHash = new LocalModelSha256V1();
          }),
          open: path => action(async () => {
            const fileIndex = contract.files.findIndex(file => file.path === path);
            requireValue(sealed.has(fileIndex), 'Variant file not sealed'); return compose(directory, fileIndex, signal);
          }),
          commit: value => action(async () => {
            requireValue(!committed && sealed.size === contract.files.length && persisted === total
              && same(admitMarker(value), marker), 'Variant commit identity');
            const now = await readPointer(namespace); check();
            requireValue(same(now?.pointer ?? null, previous?.pointer ?? null) && (!now || now.revoked), 'Variant previous pointer changed');
            await reserve(persisted, signal);
            requireValue(await maybeFile(directory, 'ready.json') === null, 'Variant local marker exists');
            await atomicWrite(directory, 'ready.json', JSON.stringify(marker), signal); check();
            requireValue(same(await readJson(directory, 'ready.json'), marker), 'Variant ready write mismatch');
            const pointer: Pointer = { schema: 'cf.local-model-variant-pointer.v1', attemptId, marker };
            await atomicWrite(namespace, pointerName, JSON.stringify(pointer), signal); check(); committed = true;
          }),
          readReady: () => action(async () => {
            requireValue(committed, 'Variant not committed'); const value = await ownReady(); readBack = true; return value;
          }),
          async finish() {
            requireValue(!operation, 'Variant concurrent lease operation'); check();
            requireValue(committed && readBack, 'Variant readiness not read back');
            operation = true;
            try { await ownReady(); check(); } finally { operation = false; }
            buffer = new Uint8Array(0); releaseStarted = true; release();
            try { await task; } catch (error) { state('failed', null, String(error)); throw error; }
            live = false;
            retained = freeze({ schema: 'cf.local-model-variant-pointer.v1', attemptId, marker }); state('ready', marker, null, total);
          },
          async abort() {
            requireValue(!operation && live, 'Variant lease retired or busy');
            retained = null; state('failed', null, 'Variant derivation failed');
            const cleanupSignal = new AbortController().signal;
            const revoke = async (): Promise<void> => {
              const existing = await readJson(directory, 'revoked.json');
              requireValue(existing === null || same(existing, revokedValue(attempt)), 'Variant foreign revocation');
              if (existing === null) await atomicWrite(directory, 'revoked.json', JSON.stringify(revokedValue(attempt)), cleanupSignal);
              requireValue(same(await readJson(directory, 'revoked.json'), revokedValue(attempt)), 'Variant revocation readback');
            };
            const failures: unknown[] = [];
            try {
              // A failed success-release may already have dropped its native lock.
              // Reacquire before revoking this immutable attempt, never another one.
              if (releaseStarted) await locks().run(LOCK, cleanupSignal, revoke); else await revoke();
            } catch (error) { failures.push(error); }
            finally {
              buffer = new Uint8Array(0); live = false; releaseStarted = true; release();
              try { await task; } catch (error) { failures.push(error); }
            }
            if (failures.length > 1) throw new AggregateError(failures, 'Variant revocation and lease release failed');
            if (failures.length === 1) throw failures[0];
          },
        };
        admitted = true; acquire(transaction); await completion;
      })).finally(() => { busy = false; });
      void task.catch(error => { if (!admitted) { state('failed', null, String(error)); reject(error); } });
      return acquired;
    },
    async verify(parentManifestSha256, parentAttemptId, signal = new AbortController().signal) {
      requireValue(!busy, 'Variant storage busy'); busy = true; retained = null; state('verifying');
      try {
        requireValue(parentManifestSha256 === contract.parentManifestSha256 && safeId(parentAttemptId), 'Variant verify parent identity');
        return await locks().run(LOCK, signal, async () => {
          checkSignal(signal); let namespace: LocalModelDirectoryV1;
          try { namespace = await (await storage().getDirectory()).getDirectoryHandle(NAMESPACE); }
          catch (error) { if (missing(error)) return state('missing'); throw error; }
          const row = await readPointer(namespace); checkSignal(signal);
          if (!row || row.revoked) return state('missing');
          requireValue(row.pointer.marker.parentAttemptId === parentAttemptId, 'Variant different parent attempt');
          let verifiedBytes = 0;
          for (let index = 0; index < contract.files.length; index++) {
            await verifyVariantBlobV1(await compose(row.directory, index, signal), contract.files[index]!, signal,
              bytes => { verifiedBytes += bytes; state('verifying', null, null, verifiedBytes); });
          }
          const final = await readPointer(namespace); checkSignal(signal);
          requireValue(final && !final.revoked && same(final.pointer, row.pointer), 'Variant changed during verification');
          retained = row.pointer; return state('ready', row.pointer.marker, null, verifiedBytes);
        });
      } catch (error) { return state(signal.aborted ? 'failed' : 'invalid', null, String(error)); }
      finally { busy = false; }
    },
    async openFile(path) {
      requireValue(!busy && current.ready && retained, 'Variant requires explicit verification');
      const captured = retained, index = contract.files.findIndex(file => file.path === path);
      requireValue(index >= 0, 'Variant unknown file'); busy = true;
      try {
        const signal = new AbortController().signal;
        return await locks().run(LOCK, signal, async () => {
          const namespace = await (await storage().getDirectory()).getDirectoryHandle(NAMESPACE);
          const row = await readPointer(namespace);
          requireValue(row && !row.revoked && same(row.pointer, captured), 'Variant readiness changed');
          return compose(row.directory, index, signal);
        });
      } catch (error) { retained = null; state('invalid', null, String(error)); throw error; }
      finally { busy = false; }
    },
  };
  return Object.freeze(owner);
}

/** Construction is inert even on unsupported browsers; capabilities are touched
 * only by explicit begin/verify/openFile actions. Pins cannot be supplied by UI. */
export function createLocalModelVariantStorageV1(options: LocalModelVariantStorageOptionsV1 = {}): LocalModelVariantStorageOwnerV1 {
  return createVariantStorageOwnerV1({ planSha256: LOCAL_MODEL_VARIANT_PLAN_SHA256_V1,
    parentManifestSha256: hash(encoder.encode(JSON.stringify(MODEL))), sourceManifestSha256: MODEL.sourceManifestSha256,
    files: LOCAL_MODEL_VARIANT_FILES_V1 }, options);
}
