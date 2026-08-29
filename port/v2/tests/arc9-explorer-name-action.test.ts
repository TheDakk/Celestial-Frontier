import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  V4_PRIMARY_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  ARC9_EXPLORER_NAME_MAX_CHARS_V1,
  ARC9_EXPLORER_NAME_OPERATION_V1,
  ARC9_EXPLORER_NAME_RECEIPT_KIND_V1,
  commitArc9ExplorerNameChangeV1,
  prepareArc9ExplorerNameChangeV1,
} from '../apps/game/src/arc9-explorer-name-action.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Arc 9 explorer-name base save failed: ${imported.reason}`);
  imported.state.explorerName = 'Nova';
  return imported.state;
}

async function fixture(options: Readonly<{ failStorage?: boolean }> = {}) {
  const state = baseState();
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xA9000003).state(),
  );
  const base = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: f4.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') {
    throw new Error(`Arc 9 explorer-name fixture was ${migration.kind}`);
  }
  await base.apply(initial.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failStorage === true) throw new Error('forced explorer-name storage failure');
      }
      return base.compareAndApply(checks, operations, clearStores);
    },
  };
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend,
    repository,
    registry: REGISTRY,
    initialRevision: 0,
    initialExtensions: f4.extensions,
    restoredAuthority: f4.authority,
    freshSessionSeed: 0,
    ownerId: 'arc9-explorer-name-tab',
    token: 'arc9-explorer-name-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Arc 9 explorer-name lease was ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state: initial.canonicalState,
    receiptCas: () => receiptCas,
  };
}

describe('Arc 9 explorer self-rename preparation', () => {
  it('uses the exact mature sanitizer/cap and changes only explorerName', () => {
    const state = baseState();
    const before = JSON.stringify(state);
    const prepared = prepareArc9ExplorerNameChangeV1(
      state,
      '  <Sol>&"\' Pathfinder  ',
    );
    expect(prepared).toMatchObject({
      kind: 'ready', previousName: 'Nova', explorerName: 'Sol Pathfinder',
      successorState: { explorerName: 'Sol Pathfinder' },
    });
    if (prepared.kind === 'ready') {
      expect({ ...prepared.successorState, explorerName: 'Nova' }).toEqual(state);
    }
    const capped = prepareArc9ExplorerNameChangeV1(
      state,
      '1234567890123456789012345',
    );
    expect(capped).toMatchObject({
      kind: 'ready', explorerName: '123456789012345678901234',
    });
    expect(ARC9_EXPLORER_NAME_MAX_CHARS_V1).toBe(24);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('makes cleaned-empty and unchanged names receipt-free no-ops', () => {
    const state = baseState();
    expect(prepareArc9ExplorerNameChangeV1(state, ' <>&"\' ')).toEqual({
      kind: 'noop', reason: 'cleaned-empty', previousName: 'Nova', cleanedName: '',
    });
    expect(prepareArc9ExplorerNameChangeV1(state, '  Nova  ')).toEqual({
      kind: 'noop', reason: 'unchanged', previousName: 'Nova', cleanedName: 'Nova',
    });
    expect(prepareArc9ExplorerNameChangeV1(state, 42)).toEqual({
      kind: 'protected', reason: 'raw-name-shape',
    });
  });
});

describe('Arc 9 explorer self-rename transaction', () => {
  it('commits one receipt/CAS, changes no other field, and unlocks no discovery achievement', async () => {
    const test = await fixture();
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
        commitCalls++;
        return test.runtime.commitAction(input);
      },
    };
    const callerBefore = JSON.stringify(test.state);
    const unlockedBefore = [...test.state.unlocked];
    const outcome = await commitArc9ExplorerNameChangeV1({
      runtime,
      state: test.state,
      rawName: 'Nova Prime',
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      previousName: 'Nova', explorerName: 'Nova Prime',
      transaction: {
        revision: 1,
        plan: { operation: ARC9_EXPLORER_NAME_OPERATION_V1, receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC9_EXPLORER_NAME_RECEIPT_KIND_V1 },
        state: { explorerName: 'Nova Prime', unlocked: unlockedBefore },
      },
    });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    expect(JSON.stringify(test.state)).toBe(callerBefore);
    if (outcome.kind !== 'committed') return;
    expect({ ...outcome.transaction.state, explorerName: 'Nova' }).toEqual(test.state);
    expect(outcome.transaction.state.unlocked).toEqual(unlockedBefore);
    expect(outcome.transaction.state.unlocked).not.toContain('namer');
    expect(await test.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    const loaded = await readSaveV5(test.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.state.explorerName).toBe('Nova Prime');
      expect(loaded.state.unlocked).toEqual(unlockedBefore);
    }
    const second = await commitArc9ExplorerNameChangeV1({
      runtime,
      state: outcome.transaction.state,
      rawName: ' Nova Prime ',
      codecNow: NOW,
    });
    expect(second).toMatchObject({
      kind: 'noop', durability: 'none', reason: 'unchanged', transaction: null,
    });
    expect(commitCalls).toBe(1);
    expect(await test.repository.readReceipt(1)).toBeUndefined();
    await test.runtime.release();
  });

  it('never invokes the writer for cleaned-empty, unchanged, protected, or hostile input', async () => {
    let commitCalls = 0;
    const runtime = {
      async commitAction() {
        commitCalls++;
        return { kind: 'lease-unavailable' as const };
      },
    };
    const state = baseState();
    await expect(commitArc9ExplorerNameChangeV1({
      runtime, state, rawName: '<>&"\'', codecNow: NOW,
    })).resolves.toMatchObject({ kind: 'noop', reason: 'cleaned-empty', transaction: null });
    await expect(commitArc9ExplorerNameChangeV1({
      runtime, state, rawName: ' Nova ', codecNow: NOW,
    })).resolves.toMatchObject({ kind: 'noop', reason: 'unchanged', transaction: null });

    const malformed = baseState();
    malformed.explorerName = '<bad>';
    await expect(commitArc9ExplorerNameChangeV1({
      runtime, state: malformed, rawName: 'Valid', codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:state-name-shape', transaction: null,
    });

    let getterTouched = false;
    const hostile = baseState() as SaveStateV2 & { hostile?: unknown };
    Object.defineProperty(hostile, 'hostile', {
      enumerable: true,
      get() { getterTouched = true; return 'no'; },
    });
    await expect(commitArc9ExplorerNameChangeV1({
      runtime, state: hostile, rawName: 'Valid', codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'input:invalid-or-unregistered', transaction: null,
    });
    expect(getterTouched).toBe(false);
    expect(commitCalls).toBe(0);
  });

  it('fails one stale CAS without retry, receipt, or caller mutation', async () => {
    const test = await fixture();
    const before = JSON.stringify(test.state);
    await test.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'arc9-explorer-name-race', value: 'other-tab' }],
    });
    const outcome = await commitArc9ExplorerNameChangeV1({
      runtime: test.runtime,
      state: test.state,
      rawName: 'Stale Nova',
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(test.receiptCas()).toBe(0);
    expect(await test.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(test.state)).toBe(before);
  });

  it('reload-converges protected/storage failure and mutation-controlled postcommit ambiguity', async () => {
    await expect(commitArc9ExplorerNameChangeV1({
      runtime: {
        async commitAction() {
          return { kind: 'protected' as const, reason: 'authority-corrupt' as const };
        },
      },
      state: baseState(),
      rawName: 'Protected Nova',
      codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:protected:authority-corrupt',
    });

    const failed = await fixture({ failStorage: true });
    await expect(commitArc9ExplorerNameChangeV1({
      runtime: failed.runtime,
      state: failed.state,
      rawName: 'Storage Nova',
      codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:forced explorer-name storage failure',
    });
    expect(await failed.repository.revision()).toBe(0);
    expect(await failed.repository.readReceipt(0)).toBeUndefined();

    const altered = await fixture();
    const outcome = await commitArc9ExplorerNameChangeV1({
      runtime: {
        async commitAction(input) {
          const committed = await altered.runtime.commitAction(input);
          if (committed.kind !== 'committed') return committed;
          return Object.freeze({
            ...committed,
            state: { ...committed.state, essence: committed.state.essence + 1 },
          });
        },
      },
      state: altered.state,
      rawName: 'Mutation Nova',
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-explorer-name-fixed-point-mismatch',
    });
    expect(altered.state.explorerName).toBe('Nova');
  });
});
