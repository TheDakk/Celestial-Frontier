import { describe, expect, it } from 'vitest';
import {
  F3_MAX_REVISION,
  createMemoryBackend,
  createRevisionedRepository,
} from '@cf/persistence';

const captureReceipt = Object.freeze({ ordinal: 17, kind: 'capture-settlement', witness: 'planet:133/species:beacon' });

describe('@cf/persistence — F3 revision/CAS and immutable receipts', () => {
  it('commits split-store writes, receipt, and next revision in one atomic outcome', async () => {
    const backend = createMemoryBackend();
    const repository = createRevisionedRepository(backend);
    const result = await repository.mutate({
      expectedRevision: 0,
      writes: [
        { store: 'player', key: 'progression', value: '{"essence":9}' },
        { store: 'inventory', key: 'cargo', value: '{"stardust":1}' },
      ],
      receipt: captureReceipt,
    });

    expect(result).toEqual({ kind: 'committed', revision: 1, receiptKey: 'receipt:17' });
    expect(await repository.revision()).toBe(1);
    expect(await backend.get('player', 'progression')).toBe('{"essence":9}');
    expect(await backend.get('inventory', 'cargo')).toBe('{"stardust":1}');
    expect(await repository.readReceipt(17)).toEqual(captureReceipt);
  });

  it('makes two same-parent tabs produce one commit and one explicit stale-writer outcome', async () => {
    const backend = createMemoryBackend();
    const left = createRevisionedRepository(backend);
    const right = createRevisionedRepository(backend);
    const [a, b] = await Promise.all([
      left.mutate({ expectedRevision: 0, writes: [{ store: 'player', key: 'essence', value: '1' }] }),
      right.mutate({ expectedRevision: 0, writes: [{ store: 'player', key: 'essence', value: '2' }] }),
    ]);

    expect([a.kind, b.kind].sort()).toEqual(['committed', 'stale']);
    expect(await left.revision()).toBe(1);
    expect(['1', '2']).toContain(await backend.get('player', 'essence'));
  });

  it('rejects a duplicate SessionRNG ordinal without rewriting any mutation record', async () => {
    const backend = createMemoryBackend();
    const repository = createRevisionedRepository(backend);
    await expect(repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'creatures', key: 'capture:one', value: 'owned' }],
      receipt: captureReceipt,
    })).resolves.toMatchObject({ kind: 'committed', revision: 1 });

    await expect(repository.mutate({
      expectedRevision: 1,
      writes: [{ store: 'creatures', key: 'capture:two', value: 'must-not-land' }],
      receipt: captureReceipt,
    })).resolves.toEqual({ kind: 'duplicate-receipt', receiptKey: 'receipt:17', existing: captureReceipt });
    expect(await backend.get('creatures', 'capture:two')).toBeUndefined();
    expect(await repository.revision()).toBe(1);
  });

  it('does not let a receipt race partially land the losing capture spend', async () => {
    const backend = createMemoryBackend();
    const a = createRevisionedRepository(backend);
    const b = createRevisionedRepository(backend);
    const [first, second] = await Promise.all([
      a.mutate({ expectedRevision: 0, writes: [{ store: 'inventory', key: 'bait', value: '4' }], receipt: captureReceipt }),
      b.mutate({ expectedRevision: 0, writes: [{ store: 'inventory', key: 'bait', value: '3' }], receipt: captureReceipt }),
    ]);

    expect([first.kind, second.kind].sort()).toEqual(['committed', 'duplicate-receipt']);
    expect(await repositoryValue(backend, 'inventory', 'bait')).toMatch(/^[34]$/);
    expect(await a.revision()).toBe(1);
  });

  it('rejects malformed parent revisions and mutation attempts to forge its reserved stores', async () => {
    const backend = createMemoryBackend();
    const repository = createRevisionedRepository(backend);
    await backend.apply([{ store: 'meta', key: 'f3:revision', value: 'not-a-number' }]);
    await expect(repository.revision()).rejects.toThrow('stored F3 revision is corrupt');

    const fresh = createRevisionedRepository(createMemoryBackend());
    await expect(fresh.mutate({ expectedRevision: 0, writes: [{ store: 'receipts', key: 'receipt:0', value: '{}' }] }))
      .rejects.toThrow('reserve meta revision and receipts stores');
    await expect(fresh.mutate({ expectedRevision: 0, writes: [{ store: 'meta', key: 'f3:revision', value: '99' }] }))
      .rejects.toThrow('reserve meta revision and receipts stores');
  });

  it('keeps the maximum durable revision readable and refuses another mutation before its product or receipt writes', async () => {
    const base = createMemoryBackend();
    await base.apply([{
      store: 'meta', key: 'f3:revision', value: String(F3_MAX_REVISION - 1),
    }]);
    let compareAndApplyCalls = 0;
    const backend = {
      ...base,
      compareAndApply(
        checks: Parameters<typeof base.compareAndApply>[0],
        operations: Parameters<typeof base.compareAndApply>[1],
        clearStores?: Parameters<typeof base.compareAndApply>[2],
      ) {
        compareAndApplyCalls++;
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const repository = createRevisionedRepository(backend);

    await expect(repository.mutate({
      expectedRevision: F3_MAX_REVISION - 1,
      writes: [{ store: 'player', key: 'last-durable', value: 'preserved' }],
    })).resolves.toEqual({
      kind: 'committed', revision: F3_MAX_REVISION, receiptKey: null,
    });
    expect(await repository.revision()).toBe(F3_MAX_REVISION);
    expect(compareAndApplyCalls).toBe(1);

    await expect(repository.mutate({
      expectedRevision: F3_MAX_REVISION,
      writes: [{ store: 'player', key: 'must-not-land', value: 'mutated' }],
      receipt: { ordinal: 18, kind: 'exhausted-mutation', witness: 'must-not-land' },
    })).resolves.toEqual({
      kind: 'revision-exhausted', revision: F3_MAX_REVISION,
    });
    expect(compareAndApplyCalls).toBe(1);
    expect(await repository.revision()).toBe(F3_MAX_REVISION);
    expect(await base.get('player', 'last-durable')).toBe('preserved');
    expect(await base.get('player', 'must-not-land')).toBeUndefined();
    expect(await repository.readReceipt(18)).toBeUndefined();
  });

  it('refuses an exhausted replacement without clearing receipts or replacing product rows', async () => {
    const base = createMemoryBackend();
    const priorReceipt = { ordinal: 4, kind: 'prior-outcome', witness: 'preserve-me' };
    await base.apply([
      { store: 'meta', key: 'f3:revision', value: String(F3_MAX_REVISION) },
      { store: 'player', key: 'expedition', value: 'preserved' },
      { store: 'receipts', key: 'receipt:4', value: JSON.stringify(priorReceipt) },
    ]);
    let compareAndApplyCalls = 0;
    const backend = {
      ...base,
      compareAndApply(
        checks: Parameters<typeof base.compareAndApply>[0],
        operations: Parameters<typeof base.compareAndApply>[1],
        clearStores?: Parameters<typeof base.compareAndApply>[2],
      ) {
        compareAndApplyCalls++;
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const repository = createRevisionedRepository(backend);

    await expect(repository.replace({
      expectedRevision: F3_MAX_REVISION,
      writes: [{ store: 'player', key: 'expedition', value: 'must-not-replace' }],
    })).resolves.toEqual({
      kind: 'revision-exhausted', revision: F3_MAX_REVISION,
    });
    expect(compareAndApplyCalls).toBe(0);
    expect(await repository.revision()).toBe(F3_MAX_REVISION);
    expect(await base.get('player', 'expedition')).toBe('preserved');
    expect(await repository.readReceipt(4)).toEqual(priorReceipt);
  });

  it('commits caller authority fences in the same checked transaction and reports their loss', async () => {
    const backend = createMemoryBackend();
    const repository = createRevisionedRepository(backend);
    const authority = Object.freeze({ store: 'meta' as const, key: 'authority', value: 'owned' });
    await backend.apply([{ store: 'meta', key: 'authority', value: 'owned' }]);

    await expect(repository.mutate({
      expectedRevision: 0,
      fences: [authority],
      writes: [{ store: 'player', key: 'first', value: 'landed' }],
    })).resolves.toEqual({ kind: 'committed', revision: 1, receiptKey: null });

    await backend.apply([{ store: 'meta', key: 'authority', value: 'successor' }]);
    await expect(repository.mutate({
      expectedRevision: 1,
      fences: [authority],
      writes: [{ store: 'player', key: 'second', value: 'must-not-land' }],
    })).resolves.toEqual({
      kind: 'fence-lost',
      fence: authority,
      actual: 'successor',
    });
    expect(await backend.get('player', 'second')).toBeUndefined();
    expect(await repository.revision()).toBe(1);
  });

  it('does not let caller fences bypass or duplicate repository-owned checks', async () => {
    const repository = createRevisionedRepository(createMemoryBackend());
    const mutation = { expectedRevision: 0, writes: [] } as const;
    await expect(repository.mutate({
      ...mutation,
      fences: [{ store: 'meta', key: 'f3:revision', value: undefined }],
    })).rejects.toThrow('reserve revision and receipt checks');
    await expect(repository.mutate({
      ...mutation,
      fences: [{ store: 'receipts', key: 'receipt:9', value: undefined }],
    })).rejects.toThrow('reserve revision and receipt checks');
    await expect(repository.mutate({
      ...mutation,
      fences: [
        { store: 'meta', key: 'authority', value: 'a' },
        { store: 'meta', key: 'authority', value: 'b' },
      ],
    })).rejects.toThrow('duplicate mutation fence for meta/authority');
  });

  it('resets receipts only inside a successful whole-expedition replacement transaction', async () => {
    const base = createMemoryBackend();
    const repository = createRevisionedRepository(base);
    await repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'expedition', value: 'old' }],
      receipt: { ordinal: 0, kind: 'old-outcome', witness: 'old:0' },
    });
    const oldReceipt = await repository.readReceipt(0);
    expect(oldReceipt).toBeDefined();

    await expect(repository.replace({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'expedition', value: 'stale-must-not-land' }],
    })).resolves.toEqual({ kind: 'stale', expectedRevision: 0, actualRevision: 1 });
    expect(await repository.readReceipt(0)).toEqual(oldReceipt);
    expect(await base.get('player', 'expedition')).toBe('old');

    const failingBackend = {
      ...base,
      async compareAndApply(
        checks: Parameters<typeof base.compareAndApply>[0],
        operations: Parameters<typeof base.compareAndApply>[1],
        clearStores?: Parameters<typeof base.compareAndApply>[2],
      ) {
        if (clearStores?.includes('receipts')) throw new Error('injected replacement abort');
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    await expect(createRevisionedRepository(failingBackend).replace({
      expectedRevision: 1,
      writes: [{ store: 'player', key: 'expedition', value: 'aborted-must-not-land' }],
    })).rejects.toThrow('injected replacement abort');
    expect(await repository.readReceipt(0)).toEqual(oldReceipt);
    expect(await base.get('player', 'expedition')).toBe('old');
    expect(await repository.revision()).toBe(1);

    await expect(repository.replace({
      expectedRevision: 1,
      writes: [{ store: 'player', key: 'expedition', value: 'new' }],
    })).resolves.toEqual({ kind: 'committed', revision: 2, receiptKey: null });
    expect(await base.keys('receipts')).toEqual([]);
    expect(await base.get('player', 'expedition')).toBe('new');
    expect(await repository.revision()).toBe(2);
  });
});

async function repositoryValue(
  backend: ReturnType<typeof createMemoryBackend>,
  store: 'inventory',
  key: string,
): Promise<string | undefined> {
  return backend.get(store, key);
}
