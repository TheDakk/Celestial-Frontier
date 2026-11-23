import { describe, expect, it } from 'vitest';
import { F3_ACTIVE_PLAY_LEASE_KEY, createMemoryBackend } from '@cf/persistence';
import { bootedHarness } from './save-loop-support';
import { dump, seedCurrentSave } from './save-support';

describe('save loop: a lease storage cannot answer for', () => {
  it('a lease that storage cannot take on the first heartbeat is a hold that can be tried again, not a reload', async () => {
    const base = createMemoryBackend();
    await seedCurrentSave(base, 'Vega');
    const before = await dump(base);
    const h = await bootedHarness({
      ...base,
      async get(store, key) {
        if (key === F3_ACTIVE_PLAY_LEASE_KEY) throw new Error('lease read failed');
        return base.get(store, key);
      },
    });
    expect([h.gate.hold, h.loop.status, h.reloads]).toEqual(['transient-read', 'held', []]);
    expect(h.gate.detail).toBe('lease acquire storage failure (lease read failed)');
    expect(h.held).toEqual(['lease acquire storage failure (lease read failed)']);
    expect(h.runtime.diagnostics()).toMatchObject({ leaseOwned: false, answerable: false });
    await h.loop.beat();
    expect(await h.loop.request('settings')).toBe(false);
    expect([h.reloads, await dump(base)]).toEqual([[], before]);
  });

  it('a lease that storage cannot renew makes the page read-only', async () => {
    const base = createMemoryBackend();
    let failing = false;
    const h = await bootedHarness({
      ...base,
      async get(store, key) {
        if (failing && key === F3_ACTIVE_PLAY_LEASE_KEY) throw new Error('lease read failed');
        return base.get(store, key);
      },
    });
    failing = true;
    await h.loop.beat();
    expect(h.loop.status).toBe('reload-required');
    expect(h.reloads).toEqual(['lease renew storage failure (lease read failed)']);
    expect(await h.loop.request('settings')).toBe(false);
  });
});
