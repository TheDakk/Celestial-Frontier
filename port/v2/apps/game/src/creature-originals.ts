/* R9: origin-local retention of FINISHED creature textures, a sibling of the
 * landfall originals store with the same discipline: immutable, verified on
 * every read, never overwritten, never deleted, never an art acceptance. The
 * key is the exact finish input (record recipe hash, painter master hash,
 * finisher settings hash, model revision), so a retained finish is served with
 * zero inference and a different input can never be mistaken for it. The
 * painter master is the fallback and is never stored here. Desktop only:
 * phones keep the painter texture (decision D1). Matches code as of 2026-09-19. */
import { LocalModelSha256V1 } from './local-model-sha256.js';
import { hashLandfallBlobV1, LANDFALL_HASH_MAX_BYTES_V1 } from './landfall-content-hash.js';

export const AI_CREATURE_ORIGINAL_MAX_BYTES_V1 = LANDFALL_HASH_MAX_BYTES_V1;
export const AI_CREATURE_ORIGINAL_DATABASE_V1 = 'cf-ai-creature-originals-v1';
const ORIGINALS = 'originals';
const LATEST = 'latest';
const SCHEMA = 'cf.ai-creature-original.v1' as const;
const HEX64 = /^[a-f0-9]{64}$/u;

export interface AiCreatureFinishInputV1 {
  readonly creatureId: string;
  /** Sealed family record recipe hash. */
  readonly recordRecipeHash: string;
  /** Painter master bytes (record.geometry.cutoutAssetHash). */
  readonly cutoutAssetHash: string;
  /** Hash of the admitted creature-finish job JSON (settings, prompt, seed, mask). */
  readonly finishSettingsHash: string;
  readonly modelRevision: string;
}
export interface AiCreatureGeneratedV1 { readonly blob: Blob; readonly width: number; readonly height: number }
export interface AiCreatureOriginalV1 extends AiCreatureGeneratedV1 {
  readonly schema: typeof SCHEMA;
  readonly originalId: string;
  readonly input: AiCreatureFinishInputV1;
  readonly sha256: string;
}
export interface AiCreatureOriginalStoreV1 {
  retain(input: AiCreatureFinishInputV1, generated: AiCreatureGeneratedV1): Promise<AiCreatureOriginalV1>;
  read(input: AiCreatureFinishInputV1, originalId: string): Promise<AiCreatureOriginalV1 | null>;
  find(input: AiCreatureFinishInputV1): Promise<AiCreatureOriginalV1 | null>;
  close(): void;
}

function hex(value: unknown, label: string): string {
  if (typeof value !== 'string' || !HEX64.test(value)) throw new TypeError('Invalid creature finish ' + label);
  return value;
}
export function copyAiCreatureFinishInputV1(input: AiCreatureFinishInputV1): AiCreatureFinishInputV1 {
  if (!input || typeof input !== 'object') throw new TypeError('Missing creature finish identity');
  if (typeof input.creatureId !== 'string' || !/^[a-z0-9-]{1,64}$/u.test(input.creatureId)) throw new TypeError('Invalid creature id');
  if (typeof input.modelRevision !== 'string' || !/^[a-f0-9]{40}$/u.test(input.modelRevision)) throw new TypeError('Invalid creature finish model revision');
  return Object.freeze({
    creatureId: input.creatureId, recordRecipeHash: hex(input.recordRecipeHash, 'record hash'),
    cutoutAssetHash: hex(input.cutoutAssetHash, 'master hash'), finishSettingsHash: hex(input.finishSettingsHash, 'settings hash'),
    modelRevision: input.modelRevision,
  });
}
function inputJson(input: AiCreatureFinishInputV1): string { return JSON.stringify(copyAiCreatureFinishInputV1(input)); }
export function aiCreatureFinishInputKeyV1(input: AiCreatureFinishInputV1): string {
  return new LocalModelSha256V1().update(new TextEncoder().encode(inputJson(input))).digestHex();
}
function generatedShape(value: AiCreatureGeneratedV1): void {
  if (!(value.blob instanceof Blob) || value.blob.size < 1 || value.blob.size > AI_CREATURE_ORIGINAL_MAX_BYTES_V1
    || value.blob.type !== 'image/png'
    || !Number.isSafeInteger(value.width) || !Number.isSafeInteger(value.height)
    || value.width < 16 || value.height < 16 || value.width > 4096 || value.height > 4096) {
    throw new TypeError('Invalid or oversized creature original');
  }
}
async function verifyOriginal(input: AiCreatureFinishInputV1, inputKey: string, originalId: string, candidate: unknown): Promise<AiCreatureOriginalV1> {
  if (!candidate || typeof candidate !== 'object') throw new Error('Missing creature original record');
  const row = candidate as AiCreatureOriginalV1;
  generatedShape(row);
  if (row.schema !== SCHEMA || row.originalId !== originalId || typeof row.sha256 !== 'string' || !HEX64.test(row.sha256)
    || inputJson(row.input) !== inputJson(input) || originalId !== `${inputKey}:${row.sha256}`
    || await hashLandfallBlobV1(row.blob) !== row.sha256) {
    throw new Error('Creature original identity or content verification failed');
  }
  return Object.freeze({ schema: SCHEMA, originalId, input: copyAiCreatureFinishInputV1(input), sha256: row.sha256, blob: row.blob, width: row.width, height: row.height });
}

export function createAiCreatureOriginalStoreV1(options: { readonly indexedDB?: IDBFactory; readonly databaseName?: string } = {}): AiCreatureOriginalStoreV1 {
  const factory = options.indexedDB ?? globalThis.indexedDB;
  const name = options.databaseName ?? AI_CREATURE_ORIGINAL_DATABASE_V1;
  if (!factory || !/^cf-ai-creature-originals-v1(?:-[A-Za-z0-9_-]+)?$/u.test(name)) throw new Error('Separate creature original storage is unavailable');
  let closed = false;
  let database: IDBDatabase | null = null;
  let opening: Promise<IDBDatabase> | null = null;
  const open = (): Promise<IDBDatabase> => {
    if (closed) return Promise.reject(new Error('Creature original store is closed'));
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
      request.onblocked = () => { refused = true; reject(new Error('Creature original database opening is blocked')); };
      request.onerror = () => reject(request.error ?? new Error('Creature original database open failed'));
      request.onsuccess = () => {
        const result = request.result;
        if (refused || closed) { result.close(); reject(new Error('Creature original database opening was canceled')); return; }
        database = result;
        result.onversionchange = () => { result.close(); if (database === result) { database = null; opening = null; } };
        resolve(result);
      };
    });
    opening = opening.catch(error => { opening = null; throw error; });
    return opening;
  };
  const fetchRecord = async (input: AiCreatureFinishInputV1, id: string | null, retainedInputKey?: string): Promise<AiCreatureOriginalV1 | null> => {
    const identity = copyAiCreatureFinishInputV1(input);
    const inputKey = retainedInputKey ?? aiCreatureFinishInputKeyV1(identity);
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
        const request = transaction.objectStore(LATEST).get(inputKey);
        request.onsuccess = () => {
          if (request.result !== undefined) {
            if (typeof request.result !== 'string') { transaction.abort(); return; }
            indexedOriginal = true;
            getOriginal(request.result);
          }
        };
      }
      transaction.oncomplete = () => { if (indexedOriginal && found === null) reject(new Error('Indexed creature original is missing')); else resolve(found); };
      transaction.onerror = () => reject(transaction.error ?? new Error('Creature original read failed'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Creature original read aborted'));
    });
    return result === null ? null : verifyOriginal(identity, inputKey, result.id, result.row);
  };
  return Object.freeze({
    async retain(input: AiCreatureFinishInputV1, generated: AiCreatureGeneratedV1): Promise<AiCreatureOriginalV1> {
      const identity = copyAiCreatureFinishInputV1(input);
      const rendered = Object.freeze({ blob: generated.blob, width: generated.width, height: generated.height });
      generatedShape(rendered);
      const sha256 = await hashLandfallBlobV1(rendered.blob);
      const inputKey = aiCreatureFinishInputKeyV1(identity);
      const originalId = `${inputKey}:${sha256}`;
      const existing = await fetchRecord(identity, null, inputKey);
      // Regeneration of an existing key is refused: one finish per exact input.
      if (existing !== null && existing.originalId !== originalId) throw new Error('Creature original already retained for this input');
      const candidate: AiCreatureOriginalV1 = Object.freeze({ schema: SCHEMA, originalId, input: identity, sha256, blob: rendered.blob, width: rendered.width, height: rendered.height });
      const db = await open();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([ORIGINALS, LATEST], 'readwrite', { durability: 'strict' });
        const request = transaction.objectStore(ORIGINALS).get(originalId);
        request.onsuccess = () => {
          if (request.result === undefined) transaction.objectStore(ORIGINALS).add(candidate, originalId);
          transaction.objectStore(LATEST).put(originalId, inputKey);
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('Creature original retention failed'));
        transaction.onabort = () => reject(transaction.error ?? new Error('Creature original retention aborted'));
      });
      const retained = await fetchRecord(identity, originalId, inputKey);
      if (retained === null) throw new Error('Committed creature original is missing');
      return retained;
    },
    read: (input: AiCreatureFinishInputV1, originalId: string) => {
      if (typeof originalId !== 'string' || originalId.length !== 129) throw new TypeError('Invalid creature original id');
      return fetchRecord(input, originalId);
    },
    find: (input: AiCreatureFinishInputV1) => fetchRecord(input, null),
    close: () => { closed = true; database?.close(); },
  });
}
