/* F3 real-browser persistence proof.
   This module is deliberately inert at import time. A diagnostic tool calls
   `runF3PersistenceBrowserProbe` with a unique, disposable database prefix
   and an authentic supported v4 fixture. Node tests may inspect this
   contract, but they must never install an IndexedDB shim and call the result
   browser evidence. */
import {
  F3_REVISION_KEY,
  STORES,
  V4_PRIMARY_KEY,
  createIndexedDBBackend,
  createRevisionedRepository,
  migrateStoredV4ToV5,
  readSaveV5,
  type ContentRegistry,
} from '@cf/persistence';

const DATABASE_SUFFIX = '-persistence';
const PREFIX_PATTERN = /^cf-f3-probe-[a-z0-9](?:[a-z0-9_-]{0,47})$/;
const DEFAULT_TIMEOUT_MS = 5_000;
const MIN_TIMEOUT_MS = 250;
const MAX_TIMEOUT_MS = 15_000;
const WINNER_RECEIPT_ORDINALS = [4_294_967_000, 4_294_967_001] as const;

export const F3_PERSISTENCE_BROWSER_PROBE_STAGE_ORDER = Object.freeze([
  'legacy-v1-created',
  'repository-v2-upgrade',
  'v4-to-v5-migration',
  'two-backend-cas',
  'checked-transaction-rollback',
  'external-v3-versionchange',
  'cleanup-delete',
] as const);

export interface F3PersistenceBrowserProbeInput {
  /** A caller-owned unique namespace. Only the derived disposable database
   * is created or deleted; an already-existing name is refused untouched. */
  readonly dbPrefix: string;
  readonly legacyV4Raw: string;
  readonly registry: ContentRegistry;
  readonly now: number;
  readonly timeoutMs?: number;
}

export type F3PersistenceBrowserProbeStages = readonly [
  Readonly<{
    stage: 'legacy-v1-created';
    databaseVersionOne: true;
    receiptsStoreAbsent: true;
    legacySaveExact: true;
  }>,
  Readonly<{
    stage: 'repository-v2-upgrade';
    databaseVersionTwo: true;
    receiptsStorePresent: true;
    legacySaveExact: true;
  }>,
  Readonly<{
    stage: 'v4-to-v5-migration';
    migrated: true;
    splitSaveReadable: true;
    legacySaveExact: true;
  }>,
  Readonly<{
    stage: 'two-backend-cas';
    contendersTwo: true;
    committedExactlyOne: true;
    revisionAdvancedOnce: true;
    losingWritesAbsent: true;
  }>,
  Readonly<{
    stage: 'checked-transaction-rollback';
    rejected: true;
    authoritativeValueUnchanged: true;
    speculativeWritesAbsent: true;
  }>,
  Readonly<{
    stage: 'external-v3-versionchange';
    blockedEventObserved: false;
    upgradedFromVersionTwo: true;
    upgradedToVersionThree: true;
  }>,
  Readonly<{
    stage: 'cleanup-delete';
    blockedEventObserved: false;
    deleted: true;
  }>,
];

export interface F3PersistenceBrowserProbeOutcome {
  readonly kind: 'f3-persistence-browser-probe';
  readonly ok: true;
  readonly databaseName: string;
  readonly stages: F3PersistenceBrowserProbeStages;
}

interface VersionInspection {
  readonly version: number;
  readonly stores: readonly string[];
}

interface ExternalUpgradeResult {
  readonly blocked: boolean;
  readonly oldVersion: number;
  readonly newVersion: number;
}

interface DeleteResult {
  readonly blocked: boolean;
  readonly deleted: boolean;
}

/** Convert an explicitly disposable prefix to the one database name owned by
 * this probe. Restricting the alphabet and namespace prevents a typo from
 * turning cleanup into a request against an application database. */
export function f3PersistenceProbeDatabaseName(dbPrefix: string): string {
  if (typeof dbPrefix !== 'string' || !PREFIX_PATTERN.test(dbPrefix)) {
    throw new RangeError('F3 probe prefix must match cf-f3-probe-[a-z0-9_-]{1,48}');
  }
  return `${dbPrefix}${DATABASE_SUFFIX}`;
}

function checkedTimeout(value: number | undefined): number {
  const timeoutMs = value ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < MIN_TIMEOUT_MS || timeoutMs > MAX_TIMEOUT_MS) {
    throw new RangeError(`F3 probe timeout must be an integer from ${MIN_TIMEOUT_MS} to ${MAX_TIMEOUT_MS} ms`);
  }
  return timeoutMs;
}

function realBrowserIndexedDB(): IDBFactory {
  if (typeof window === 'undefined' || window !== globalThis
    || typeof globalThis.indexedDB === 'undefined'
    || window.indexedDB !== globalThis.indexedDB) {
    throw new Error('F3 persistence evidence requires a real browser IndexedDB context');
  }
  return globalThis.indexedDB;
}

function failure(stage: string, detail: string): Error {
  return new Error(`F3 persistence browser probe failed at ${stage}: ${detail}`);
}

function assertProof(value: boolean, stage: string, detail: string): asserts value {
  if (!value) throw failure(stage, detail);
}

function transactionString(
  database: IDBDatabase,
  store: string,
  key: string,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, 'readonly');
    const request = transaction.objectStore(store).get(key);
    let value: string | undefined;
    request.onsuccess = () => { value = request.result === undefined ? undefined : String(request.result); };
    transaction.oncomplete = () => resolve(value);
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB read transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB read transaction aborted'));
  });
}

async function createRawLegacyV1(
  factory: IDBFactory,
  databaseName: string,
  legacyV4Raw: string,
  timeoutMs: number,
  markOwned: () => void,
): Promise<{ readonly inspection: VersionInspection; readonly legacySave: string | undefined }> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let created = false;
    const timer = setTimeout(() => {
      settled = true;
      reject(failure('legacy-v1-created', `open exceeded ${timeoutMs} ms`));
    }, timeoutMs);
    const finish = (
      result: { readonly inspection: VersionInspection; readonly legacySave: string | undefined },
    ): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const fail = (error: unknown): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error instanceof Error ? error : new Error(String(error)));
    };
    const request = factory.open(databaseName, 1);
    request.onblocked = () => fail(failure('legacy-v1-created', 'database creation was blocked'));
    request.onerror = () => fail(request.error ?? failure('legacy-v1-created', 'database creation failed'));
    request.onupgradeneeded = (event) => {
      if ((event as IDBVersionChangeEvent).oldVersion !== 0) {
        try { request.transaction?.abort(); } catch { /* request.onerror owns the failure */ }
        return;
      }
      created = true;
      markOwned();
      const database = request.result;
      for (const store of STORES) {
        if (store !== 'receipts') database.createObjectStore(store);
      }
      request.transaction!.objectStore('meta').put(legacyV4Raw, V4_PRIMARY_KEY);
    };
    request.onsuccess = () => {
      const database = request.result;
      if (settled) { database.close(); return; }
      if (!created) {
        database.close();
        fail(failure('legacy-v1-created', 'derived database name already exists; supply a unique prefix'));
        return;
      }
      const inspection: VersionInspection = Object.freeze({
        version: database.version,
        stores: Object.freeze(Array.from(database.objectStoreNames)),
      });
      void transactionString(database, 'meta', V4_PRIMARY_KEY).then((legacySave) => {
        database.close();
        finish({ inspection, legacySave });
      }, (error) => {
        database.close();
        fail(error);
      });
    };
  });
}

function inspectCurrentVersion(
  factory: IDBFactory,
  databaseName: string,
  timeoutMs: number,
): Promise<VersionInspection> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      reject(failure('repository-v2-upgrade', `inspection exceeded ${timeoutMs} ms`));
    }, timeoutMs);
    const request = factory.open(databaseName);
    request.onblocked = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(failure('repository-v2-upgrade', 'version inspection was blocked'));
    };
    request.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(request.error ?? failure('repository-v2-upgrade', 'version inspection failed'));
    };
    request.onsuccess = () => {
      const database = request.result;
      if (settled) { database.close(); return; }
      settled = true;
      clearTimeout(timer);
      const inspection: VersionInspection = Object.freeze({
        version: database.version,
        stores: Object.freeze(Array.from(database.objectStoreNames)),
      });
      database.close();
      resolve(inspection);
    };
  });
}

function upgradeExternally(
  factory: IDBFactory,
  databaseName: string,
  version: number,
  timeoutMs: number,
): Promise<ExternalUpgradeResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let blocked = false;
    let oldVersion = -1;
    const timer = setTimeout(() => {
      settled = true;
      reject(failure('external-v3-versionchange', `upgrade exceeded ${timeoutMs} ms (blocked=${blocked})`));
    }, timeoutMs);
    const request = factory.open(databaseName, version);
    request.onblocked = () => { blocked = true; };
    request.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(request.error ?? failure('external-v3-versionchange', 'external upgrade failed'));
    };
    request.onupgradeneeded = (event) => { oldVersion = (event as IDBVersionChangeEvent).oldVersion; };
    request.onsuccess = () => {
      const database = request.result;
      if (settled) { database.close(); return; }
      settled = true;
      clearTimeout(timer);
      const result = Object.freeze({ blocked, oldVersion, newVersion: database.version });
      database.close();
      resolve(result);
    };
  });
}

function deleteOwnedDatabase(
  factory: IDBFactory,
  databaseName: string,
  timeoutMs: number,
): Promise<DeleteResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let blocked = false;
    const timer = setTimeout(() => {
      settled = true;
      reject(failure('cleanup-delete', `delete exceeded ${timeoutMs} ms (blocked=${blocked})`));
    }, timeoutMs);
    const request = factory.deleteDatabase(databaseName);
    request.onblocked = () => { blocked = true; };
    request.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(request.error ?? failure('cleanup-delete', 'delete failed'));
    };
    request.onsuccess = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(Object.freeze({ blocked, deleted: true }));
    };
  });
}

async function bestEffortCleanup(
  factory: IDBFactory,
  databaseName: string,
  timeoutMs: number,
  repositoryOpened: boolean,
): Promise<string> {
  const notes: string[] = [];
  if (repositoryOpened) {
    try { await upgradeExternally(factory, databaseName, 4, timeoutMs); }
    catch (error) { notes.push(`close-upgrade: ${error instanceof Error ? error.message : String(error)}`); }
  }
  try {
    const deleted = await deleteOwnedDatabase(factory, databaseName, timeoutMs);
    if (deleted.blocked) notes.push('delete observed blocked');
  } catch (error) {
    notes.push(`delete: ${error instanceof Error ? error.message : String(error)}`);
  }
  return notes.length === 0 ? 'cleanup completed' : notes.join('; ');
}

function frozenStages(stages: unknown[]): F3PersistenceBrowserProbeStages {
  for (const stage of stages) Object.freeze(stage);
  return Object.freeze(stages) as F3PersistenceBrowserProbeStages;
}

/** Run the browser evidence once. This function never retries a logical
 * mutation and never falls back to memory or a Node IndexedDB shim. */
export async function runF3PersistenceBrowserProbe(
  input: F3PersistenceBrowserProbeInput,
): Promise<F3PersistenceBrowserProbeOutcome> {
  const databaseName = f3PersistenceProbeDatabaseName(input.dbPrefix);
  const timeoutMs = checkedTimeout(input.timeoutMs);
  if (typeof input.legacyV4Raw !== 'string' || input.legacyV4Raw.length === 0
    || input.legacyV4Raw.length > 4 * 1_024 * 1_024) {
    throw new RangeError('F3 probe legacy v4 fixture must be 1 byte to 4 MiB');
  }
  if (!Number.isSafeInteger(input.now) || input.now < 0) {
    throw new RangeError('F3 probe now must be a non-negative safe integer');
  }
  const factory = realBrowserIndexedDB();
  const stages: unknown[] = [];
  let databaseOwned = false;
  let repositoryOpened = false;
  let databaseDeleted = false;

  try {
    const legacy = await createRawLegacyV1(
      factory,
      databaseName,
      input.legacyV4Raw,
      timeoutMs,
      () => { databaseOwned = true; },
    );
    const legacyVersionOne = legacy.inspection.version === 1;
    const legacyReceiptsAbsent = !legacy.inspection.stores.includes('receipts');
    const legacySaveExact = legacy.legacySave === input.legacyV4Raw;
    assertProof(legacyVersionOne, 'legacy-v1-created', 'raw database did not settle at version 1');
    assertProof(legacyReceiptsAbsent, 'legacy-v1-created', 'legacy database unexpectedly contained receipts');
    assertProof(legacySaveExact, 'legacy-v1-created', 'raw meta/save bytes changed');
    stages.push({
      stage: 'legacy-v1-created',
      databaseVersionOne: true,
      receiptsStoreAbsent: true,
      legacySaveExact: true,
    });

    const backendA = createIndexedDBBackend(databaseName);
    repositoryOpened = true;
    const upgradedSave = await backendA.get('meta', V4_PRIMARY_KEY);
    const receiptKeys = await backendA.keys('receipts');
    const versionTwo = await inspectCurrentVersion(factory, databaseName, timeoutMs);
    assertProof(versionTwo.version === 2, 'repository-v2-upgrade', 'repository did not upgrade to schema version 2');
    assertProof(versionTwo.stores.includes('receipts'), 'repository-v2-upgrade', 'repository onupgradeneeded omitted receipts');
    assertProof(receiptKeys.length === 0, 'repository-v2-upgrade', 'new receipts store was not empty');
    assertProof(upgradedSave === input.legacyV4Raw, 'repository-v2-upgrade', 'legacy meta/save was lost during upgrade');
    stages.push({
      stage: 'repository-v2-upgrade',
      databaseVersionTwo: true,
      receiptsStorePresent: true,
      legacySaveExact: true,
    });

    const migration = await migrateStoredV4ToV5(backendA, input.registry, input.now);
    const split = await readSaveV5(backendA, input.registry, input.now);
    const postMigrationSave = await backendA.get('meta', V4_PRIMARY_KEY);
    assertProof(migration.kind === 'migrated', 'v4-to-v5-migration', `migration returned ${migration.kind}`);
    assertProof(split.kind === 'loaded', 'v4-to-v5-migration', `split read returned ${split.kind}`);
    assertProof(postMigrationSave === input.legacyV4Raw, 'v4-to-v5-migration', 'migration rewrote the exact v4 source');
    stages.push({
      stage: 'v4-to-v5-migration',
      migrated: true,
      splitSaveReadable: true,
      legacySaveExact: true,
    });

    const backendB = createIndexedDBBackend(databaseName);
    const revisionA = createRevisionedRepository(backendA);
    const revisionB = createRevisionedRepository(backendB);
    const [outcomeA, outcomeB] = await Promise.all([
      revisionA.mutate({
        expectedRevision: 0,
        writes: [{ store: 'player', key: 'f3-probe:cas-winner', value: 'alpha' }],
        receipt: { ordinal: WINNER_RECEIPT_ORDINALS[0], kind: 'f3-browser-cas', witness: 'alpha' },
      }),
      revisionB.mutate({
        expectedRevision: 0,
        writes: [{ store: 'player', key: 'f3-probe:cas-winner', value: 'beta' }],
        receipt: { ordinal: WINNER_RECEIPT_ORDINALS[1], kind: 'f3-browser-cas', witness: 'beta' },
      }),
    ]);
    const outcomes = [outcomeA, outcomeB] as const;
    const committedIndexes = outcomes.flatMap((outcome, index) => outcome.kind === 'committed' ? [index] : []);
    const committedExactlyOne = committedIndexes.length === 1
      && outcomes.filter((outcome) => outcome.kind === 'stale').length === 1;
    assertProof(committedExactlyOne, 'two-backend-cas', `expected committed+stale; got ${outcomeA.kind}+${outcomeB.kind}`);
    const winnerIndex = committedIndexes[0]!;
    const loserIndex = winnerIndex === 0 ? 1 : 0;
    const winnerValue = winnerIndex === 0 ? 'alpha' : 'beta';
    const revisionAfterRace = await revisionA.revision();
    const durableWinner = await backendA.get('player', 'f3-probe:cas-winner');
    const winnerReceipt = await revisionA.readReceipt(WINNER_RECEIPT_ORDINALS[winnerIndex]!);
    const loserReceipt = await revisionA.readReceipt(WINNER_RECEIPT_ORDINALS[loserIndex]!);
    const revisionAdvancedOnce = revisionAfterRace === 1;
    const losingWritesAbsent = durableWinner === winnerValue
      && winnerReceipt?.witness === winnerValue
      && loserReceipt === undefined;
    assertProof(revisionAdvancedOnce, 'two-backend-cas', `revision advanced to ${revisionAfterRace}, not 1`);
    assertProof(losingWritesAbsent, 'two-backend-cas', 'losing value or receipt leaked into storage');
    stages.push({
      stage: 'two-backend-cas',
      contendersTwo: true,
      committedExactlyOne: true,
      revisionAdvancedOnce: true,
      losingWritesAbsent: true,
    });

    const authoritativeBefore = await backendA.get('player', 'f3-probe:cas-winner');
    const rollbackReceiptKey = 'receipt:4294967002';
    const transactionCommitted = await backendB.compareAndApply(
      [{ store: 'meta', key: F3_REVISION_KEY, value: '0' }],
      [
        { store: 'player', key: 'f3-probe:cas-winner', value: 'forbidden-overwrite' },
        { store: 'settings', key: 'f3-probe:rollback', value: 'forbidden-setting' },
        { store: 'receipts', key: rollbackReceiptKey, value: '{"forbidden":true}' },
        { store: 'meta', key: F3_REVISION_KEY, value: '999' },
      ],
    );
    const authoritativeAfter = await backendA.get('player', 'f3-probe:cas-winner');
    const revisionAfterRollback = await backendA.get('meta', F3_REVISION_KEY);
    const speculativeSetting = await backendA.get('settings', 'f3-probe:rollback');
    const speculativeReceipt = await backendA.get('receipts', rollbackReceiptKey);
    const rejected = transactionCommitted === false;
    const authoritativeValueUnchanged = authoritativeAfter === authoritativeBefore && revisionAfterRollback === '1';
    const speculativeWritesAbsent = speculativeSetting === undefined && speculativeReceipt === undefined;
    assertProof(rejected, 'checked-transaction-rollback', 'stale checked transaction reported committed');
    assertProof(authoritativeValueUnchanged, 'checked-transaction-rollback', 'stale transaction changed authority');
    assertProof(speculativeWritesAbsent, 'checked-transaction-rollback', 'stale transaction partially wrote data');
    stages.push({
      stage: 'checked-transaction-rollback',
      rejected: true,
      authoritativeValueUnchanged: true,
      speculativeWritesAbsent: true,
    });

    const externalUpgrade = await upgradeExternally(factory, databaseName, 3, timeoutMs);
    assertProof(!externalUpgrade.blocked, 'external-v3-versionchange', 'repository connection blocked an external upgrade');
    assertProof(externalUpgrade.oldVersion === 2, 'external-v3-versionchange', `upgrade began at ${externalUpgrade.oldVersion}, not 2`);
    assertProof(externalUpgrade.newVersion === 3, 'external-v3-versionchange', `upgrade ended at ${externalUpgrade.newVersion}, not 3`);
    stages.push({
      stage: 'external-v3-versionchange',
      blockedEventObserved: false,
      upgradedFromVersionTwo: true,
      upgradedToVersionThree: true,
    });

    const cleanup = await deleteOwnedDatabase(factory, databaseName, timeoutMs);
    databaseDeleted = cleanup.deleted;
    assertProof(!cleanup.blocked, 'cleanup-delete', 'delete completed only after a blocked event');
    assertProof(cleanup.deleted, 'cleanup-delete', 'delete did not complete');
    stages.push({ stage: 'cleanup-delete', blockedEventObserved: false, deleted: true });

    return Object.freeze({
      kind: 'f3-persistence-browser-probe',
      ok: true,
      databaseName,
      stages: frozenStages(stages),
    });
  } catch (error) {
    let cleanup = 'no database was created';
    if (databaseOwned && !databaseDeleted) {
      cleanup = await bestEffortCleanup(factory, databaseName, timeoutMs, repositoryOpened);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message}; ${cleanup}`, { cause: error });
  }
}
