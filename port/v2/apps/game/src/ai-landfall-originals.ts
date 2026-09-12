/* Origin-local exact originals, separate from game persistence and disposable
 * image variants. IDB retention is not an outside-origin backup or art acceptance.
 * No delete/evict/overwrite-original API exists. Inputs are detached recipe data,
 * never navigation or gameplay authority. Matches code as of 2026-09-09. */
import { LocalModelSha256V1 } from './local-model-sha256.js';

export const AI_LANDFALL_ORIGINAL_MAX_BYTES_V1 = 16 * 1024 * 1024;
export const AI_LANDFALL_ORIGINAL_DATABASE_V1 = 'cf-ai-landfall-originals-v1';
const ORIGINALS = 'originals';
const LATEST = 'latest';
const SCHEMA = 'cf.ai-landfall-original.v1' as const;

export interface AiLandfallInputV1 {
  readonly recipeKey: string;
  readonly worldKey: string;
  readonly environmentId: string;
  readonly ecologyEpoch: number;
  readonly snapshotDigest: string;
  /** Complete admitted canonical recipe; this owner does not infer missing fields. */
  readonly recipeJson: string;
}
export interface AiLandfallGeneratedV1 {
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
}
export interface AiLandfallOriginalV1 extends AiLandfallGeneratedV1 {
  readonly schema: typeof SCHEMA;
  readonly originalId: string;
  readonly input: AiLandfallInputV1;
  readonly sha256: string;
}
export interface AiLandfallOriginalStoreV1 {
  retain(input: AiLandfallInputV1, generated: AiLandfallGeneratedV1): Promise<AiLandfallOriginalV1>;
  read(input: AiLandfallInputV1, originalId: string): Promise<AiLandfallOriginalV1 | null>;
  find(input: AiLandfallInputV1): Promise<AiLandfallOriginalV1 | null>;
  close(): void;
}

function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > max) {
    throw new TypeError('Invalid landfall identity text');
  }
  return value;
}
export function copyAiLandfallInputV1(input: AiLandfallInputV1): AiLandfallInputV1 {
  if (!input || typeof input !== 'object') throw new TypeError('Missing landfall identity');
  const epoch = input.ecologyEpoch;
  if (!Number.isSafeInteger(epoch) || epoch < 0 || Object.is(epoch, -0)) {
    throw new TypeError('Invalid landfall ecology epoch');
  }
  return Object.freeze({
    recipeKey: text(input.recipeKey, 512), worldKey: text(input.worldKey, 512),
    environmentId: text(input.environmentId, 512), ecologyEpoch: epoch,
    snapshotDigest: text(input.snapshotDigest, 256), recipeJson: text(input.recipeJson, 1_048_576),
  });
}
function inputJson(input: AiLandfallInputV1): string {
  return JSON.stringify(copyAiLandfallInputV1(input));
}
export function aiLandfallInputKeyV1(input: AiLandfallInputV1): string {
  return new LocalModelSha256V1().update(new TextEncoder().encode(inputJson(input))).digestHex();
}
function generatedShape(value: AiLandfallGeneratedV1): void {
  if (!(value.blob instanceof Blob) || value.blob.size < 1
    || value.blob.size > AI_LANDFALL_ORIGINAL_MAX_BYTES_V1
    || !['image/png', 'image/jpeg', 'image/webp'].includes(value.blob.type)
    || !Number.isSafeInteger(value.width) || !Number.isSafeInteger(value.height)
    || value.width < 1 || value.height < 1 || value.width > 8192 || value.height > 8192
    || value.width * value.height > 16_777_216) {
    throw new TypeError('Invalid or oversized landfall original');
  }
}
async function blobDigest(blob: Blob): Promise<string> {
  const hasher = new LocalModelSha256V1();
  const reader = blob.stream().getReader();
  let bytes = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > blob.size || bytes > AI_LANDFALL_ORIGINAL_MAX_BYTES_V1) {
        throw new Error('Landfall original stream exceeded its declared size');
      }
      hasher.update(next.value);
    }
  } finally { reader.releaseLock(); }
  if (bytes !== blob.size) throw new Error('Landfall original stream was truncated');
  return hasher.digestHex();
}
async function verifyOriginal(
  input: AiLandfallInputV1, originalId: string, candidate: unknown,
): Promise<AiLandfallOriginalV1> {
  if (!candidate || typeof candidate !== 'object') throw new Error('Missing landfall original record');
  const row = candidate as AiLandfallOriginalV1;
  generatedShape(row);
  if (row.schema !== SCHEMA || row.originalId !== originalId
    || typeof row.sha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(row.sha256)
    || inputJson(row.input) !== inputJson(input)
    || originalId !== `${aiLandfallInputKeyV1(input)}:${row.sha256}`
    || await blobDigest(row.blob) !== row.sha256) {
    throw new Error('Landfall original identity or content verification failed');
  }
  return Object.freeze({ schema: SCHEMA, originalId, input: copyAiLandfallInputV1(input),
    sha256: row.sha256, blob: row.blob, width: row.width, height: row.height });
}

export function createAiLandfallOriginalStoreV1(options: {
  readonly indexedDB?: IDBFactory;
  readonly databaseName?: string;
} = {}): AiLandfallOriginalStoreV1 {
  const factory = options.indexedDB ?? globalThis.indexedDB;
  const name = options.databaseName ?? AI_LANDFALL_ORIGINAL_DATABASE_V1;
  if (!factory || !/^cf-ai-landfall-originals-v1(?:-[A-Za-z0-9_-]+)?$/u.test(name)) {
    throw new Error('Separate landfall original storage is unavailable');
  }
  let closed = false;
  let database: IDBDatabase | null = null;
  let opening: Promise<IDBDatabase> | null = null;
  const open = (): Promise<IDBDatabase> => {
    if (closed) return Promise.reject(new Error('Landfall original store is closed'));
    if (database) return Promise.resolve(database);
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      const request = factory.open(name, 1);
      let refused = false;
      request.onupgradeneeded = () => {
        if (refused || closed) { request.transaction?.abort(); return; }
        request.result.createObjectStore(ORIGINALS);
        request.result.createObjectStore(LATEST);
      };
      request.onblocked = () => {
        refused = true;
        reject(new Error('Landfall original database opening is blocked'));
      };
      request.onerror = () => reject(request.error ?? new Error('Landfall original database open failed'));
      request.onsuccess = () => {
        const result = request.result;
        if (refused || closed) {
          result.close(); reject(new Error('Landfall original database opening was canceled')); return;
        }
        database = result;
        result.onversionchange = () => { result.close(); if (database === result) { database = null; opening = null; } };
        resolve(result);
      };
    });
    opening = opening.catch(error => { opening = null; throw error; });
    return opening;
  };
  const fetchRecord = async (input: AiLandfallInputV1, id: string | null): Promise<AiLandfallOriginalV1 | null> => {
    const identity = copyAiLandfallInputV1(input);
    const db = await open();
    const result = await new Promise<{ id: string; row: unknown } | null>((resolve, reject) => {
      const transaction = db.transaction([ORIGINALS, LATEST], 'readonly');
      let found: { id: string; row: unknown } | null = null;
      let indexedOriginal = false;
      const getOriginal = (key: string): void => {
        const request = transaction.objectStore(ORIGINALS).get(key);
        request.onsuccess = () => { if (request.result !== undefined) found = { id: key, row: request.result }; };
      };
      if (id !== null) getOriginal(id);
      else {
        const request = transaction.objectStore(LATEST).get(aiLandfallInputKeyV1(identity));
        request.onsuccess = () => {
          if (request.result !== undefined) {
            if (typeof request.result !== 'string') { transaction.abort(); return; }
            indexedOriginal = true;
            getOriginal(request.result);
          }
        };
      }
      transaction.oncomplete = () => {
        if (indexedOriginal && found === null) reject(new Error('Indexed landfall original is missing'));
        else resolve(found);
      };
      transaction.onerror = () => reject(transaction.error ?? new Error('Landfall original read failed'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Landfall original read aborted'));
    });
    return result === null ? null : verifyOriginal(identity, result.id, result.row);
  };
  return Object.freeze({
    async retain(input: AiLandfallInputV1, generated: AiLandfallGeneratedV1): Promise<AiLandfallOriginalV1> {
      const identity = copyAiLandfallInputV1(input);
      const rendered = Object.freeze({ blob: generated.blob, width: generated.width, height: generated.height });
      generatedShape(rendered);
      const sha256 = await blobDigest(rendered.blob);
      const inputKey = aiLandfallInputKeyV1(identity);
      const originalId = `${inputKey}:${sha256}`;
      const candidate: AiLandfallOriginalV1 = Object.freeze({ schema: SCHEMA, originalId,
        input: identity, sha256, blob: rendered.blob, width: rendered.width, height: rendered.height });
      const db = await open();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([ORIGINALS, LATEST], 'readwrite', { durability: 'strict' });
        const request = transaction.objectStore(ORIGINALS).get(originalId);
        request.onsuccess = () => {
          if (request.result === undefined) transaction.objectStore(ORIGINALS).add(candidate, originalId);
          transaction.objectStore(LATEST).put(originalId, inputKey);
        };
        // Request success only stages data. An abort/quota failure still refuses ready.
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('Landfall original retention failed'));
        transaction.onabort = () => reject(transaction.error ?? new Error('Landfall original retention aborted'));
      });
      const retained = await fetchRecord(identity, originalId);
      if (retained === null) throw new Error('Committed landfall original is missing');
      return retained;
    },
    read: (input: AiLandfallInputV1, originalId: string) => fetchRecord(input, text(originalId, 129)),
    find: (input: AiLandfallInputV1) => fetchRecord(input, null),
    close: () => { closed = true; database?.close(); },
  });
}
