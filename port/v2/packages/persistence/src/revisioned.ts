/* F3 persistence authority — revisioned, exact-once mutations.

   The old repository deliberately owns only recovery of one v4 payload. It
   cannot safely author a reward: two tabs can read the same state and the
   later write silently wins. This small layer is the shared mutation boundary
   for Arc 2 onward. It owns no game policy and never serializes product
   objects; callers provide already-validated DTO strings for the split stores.

   A successful mutation atomically:
   1. proves the parent save revision is still the one the caller observed;
   2. proves its optional save-lifetime RNG receipt ordinal is unused;
   3. writes every product record, the immutable receipt, and the next
      revision together.

   A lost race returns an explicit result. It never retries or changes the
   caller's expected parent, because that would turn one player action into a
   different action. */
import type { StorageBackend, StorageOperation } from './repository.js';

export const F3_REVISION_KEY = 'f3:revision';
const RECEIPT_PREFIX = 'receipt:';
const MAX_ORDINAL = 0xFFFF_FFFF;

export interface MutationReceipt {
  /** Save-lifetime SessionRNG ordinal, never a timestamp or UI retry count. */
  readonly ordinal: number;
  /** Stable semantic verb such as `capture-settlement`, not display copy. */
  readonly kind: string;
  /** A bounded caller-owned DTO fingerprint/witness; no render or audio data. */
  readonly witness: string;
}

export interface RevisionedMutation {
  readonly expectedRevision: number;
  readonly writes: readonly StorageOperation[];
  readonly receipt?: MutationReceipt;
}

export type RevisionedMutationOutcome =
  | { readonly kind: 'committed'; readonly revision: number; readonly receiptKey: string | null }
  | { readonly kind: 'stale'; readonly expectedRevision: number; readonly actualRevision: number }
  | { readonly kind: 'duplicate-receipt'; readonly receiptKey: string; readonly existing: MutationReceipt };

function checkedRevision(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`${label} must be a non-negative safe integer below MAX_SAFE_INTEGER`);
  }
  return value as number;
}

function receiptKey(ordinal: number): string {
  if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal > MAX_ORDINAL) {
    throw new RangeError('receipt ordinal must be a uint32');
  }
  return `${RECEIPT_PREFIX}${ordinal}`;
}

function checkedReceipt(receipt: MutationReceipt): MutationReceipt {
  const key = receiptKey(receipt.ordinal);
  void key;
  if (typeof receipt.kind !== 'string' || receipt.kind.length < 1 || receipt.kind.length > 96
    || /[\u0000-\u001f\u007f]/.test(receipt.kind)) {
    throw new RangeError('receipt kind must be 1–96 printable characters');
  }
  if (typeof receipt.witness !== 'string' || receipt.witness.length > 4_096) {
    throw new RangeError('receipt witness must be a string of at most 4096 characters');
  }
  return Object.freeze({ ordinal: receipt.ordinal, kind: receipt.kind, witness: receipt.witness });
}

function decodeReceipt(raw: string, key: string): MutationReceipt {
  try {
    const candidate = JSON.parse(raw) as MutationReceipt;
    if (!candidate || typeof candidate !== 'object') throw new Error('not an object');
    const checked = checkedReceipt(candidate);
    if (receiptKey(checked.ordinal) !== key) throw new Error('ordinal/key mismatch');
    return checked;
  } catch (error) {
    throw new Error(`stored immutable receipt ${JSON.stringify(key)} is corrupt: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateWrites(writes: readonly StorageOperation[]): readonly StorageOperation[] {
  const seen = new Set<string>();
  return writes.map((write) => {
    if (write.store === 'receipts' || (write.store === 'meta' && write.key === F3_REVISION_KEY)) {
      throw new Error('revisioned mutations reserve meta revision and receipts stores');
    }
    if (typeof write.key !== 'string' || write.key.length === 0) throw new RangeError('mutation write key must be nonempty');
    if (write.value !== undefined && typeof write.value !== 'string') throw new TypeError('mutation values must be strings');
    const identity = `${write.store}\u0000${write.key}`;
    if (seen.has(identity)) throw new Error(`duplicate mutation write for ${write.store}/${write.key}`);
    seen.add(identity);
    return Object.freeze({ store: write.store, key: write.key, ...(write.value === undefined ? {} : { value: write.value }) });
  });
}

/** A thin, policy-free CAS repository. One instance may safely be used by
 * several app subsystems and several tabs that point at the same backend. */
export interface RevisionedRepository {
  revision(): Promise<number>;
  mutate(mutation: RevisionedMutation): Promise<RevisionedMutationOutcome>;
  readReceipt(ordinal: number): Promise<MutationReceipt | undefined>;
}

export function createRevisionedRepository(backend: StorageBackend): RevisionedRepository {
  const readRevision = async (): Promise<{ raw: string | undefined; revision: number }> => {
    const raw = await backend.get('meta', F3_REVISION_KEY);
    if (raw === undefined) return { raw, revision: 0 };
    if (!/^(0|[1-9]\d*)$/.test(raw)) throw new Error('stored F3 revision is corrupt');
    return { raw, revision: checkedRevision(Number(raw), 'stored F3 revision') };
  };

  return {
    async revision(): Promise<number> {
      return (await readRevision()).revision;
    },
    async readReceipt(ordinal: number): Promise<MutationReceipt | undefined> {
      const key = receiptKey(ordinal);
      const raw = await backend.get('receipts', key);
      return raw === undefined ? undefined : decodeReceipt(raw, key);
    },
    async mutate(mutation: RevisionedMutation): Promise<RevisionedMutationOutcome> {
      const expectedRevision = checkedRevision(mutation.expectedRevision, 'expected revision');
      const writes = validateWrites(mutation.writes);
      const receipt = mutation.receipt === undefined ? undefined : checkedReceipt(mutation.receipt);
      const receiptKeyValue = receipt === undefined ? null : receiptKey(receipt.ordinal);
      const before = await readRevision();
      if (before.revision !== expectedRevision) {
        return { kind: 'stale', expectedRevision, actualRevision: before.revision };
      }
      if (receiptKeyValue !== null) {
        const existing = await backend.get('receipts', receiptKeyValue);
        if (existing !== undefined) return { kind: 'duplicate-receipt', receiptKey: receiptKeyValue, existing: decodeReceipt(existing, receiptKeyValue) };
      }
      const revision = expectedRevision + 1;
      const committed = await backend.compareAndApply([
        { store: 'meta', key: F3_REVISION_KEY, value: before.raw },
        ...(receiptKeyValue === null ? [] : [{ store: 'receipts' as const, key: receiptKeyValue, value: undefined }]),
      ], [
        ...writes,
        ...(receipt === undefined ? [] : [{ store: 'receipts' as const, key: receiptKeyValue!, value: JSON.stringify(receipt) }]),
        { store: 'meta' as const, key: F3_REVISION_KEY, value: String(revision) },
      ]);
      if (committed) return { kind: 'committed', revision, receiptKey: receiptKeyValue };

      /* One competing transaction may have committed our receipt. Report that
         distinct durable fact rather than calling it a generic stale write. */
      if (receiptKeyValue !== null) {
        const existing = await backend.get('receipts', receiptKeyValue);
        if (existing !== undefined) return { kind: 'duplicate-receipt', receiptKey: receiptKeyValue, existing: decodeReceipt(existing, receiptKeyValue) };
      }
      return { kind: 'stale', expectedRevision, actualRevision: (await readRevision()).revision };
    },
  };
}
