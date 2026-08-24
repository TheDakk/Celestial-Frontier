import { describe, expect, it } from 'vitest';
import { createMemoryBackend, createRevisionedRepository } from '@cf/persistence';

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
});

async function repositoryValue(
  backend: ReturnType<typeof createMemoryBackend>,
  store: 'inventory',
  key: string,
): Promise<string | undefined> {
  return backend.get(store, key);
}
