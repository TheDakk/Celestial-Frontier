import { describe, expect, it } from 'vitest';
import { createMemoryBackend, type StorageBackend } from '@cf/persistence';
import { createBus } from '../src/bus';
import type { GameEvents } from '../src/events';
import { LEASE_TTL_MS, REGISTRY, bootSave, createSaveLoop, createSaveRuntime, createWriteGate } from '../src/save/index';
import { NOW, SOL_ROUTE, controlledClock, dump } from './save-support';

/** One page on the backend, as the shell wires it, after its first heartbeat. `minted` is the entropy it drew. */
async function page(backend: StorageBackend, minted: number, token: string) {
  const booted = await bootSave({ backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE });
  const time = controlledClock(1_000);
  const gate = createWriteGate(booted.hold);
  const runtime = createSaveRuntime({
    backend, registry: REGISTRY,
    initialRevision: booted.revision, initialExtensions: booted.extensions, initialState: booted.state,
    restoredAuthority: booted.restoredAuthority, freshSessionSeed: minted,
    ownerId: 'tab', token, leaseTtlMs: LEASE_TTL_MS, now: time.now, visible: true, answerable: true,
  });
  const bus = createBus<GameEvents>();
  const reloads: string[] = [];
  bus.on('save:reload-required', ({ reason }) => { reloads.push(reason); });
  const loop = createSaveLoop({
    runtime, gate, bus, backend, clocks: { wallNow: () => NOW, monotonicNow: time.now },
    live: () => booted.state, route: () => booted.state.savedView,
  });
  await loop.beat();
  return { booted, gate, runtime, loop, reloads };
}

describe('save loop: the session seed', () => {
  it('a newly minted seed is stored by the first heartbeat, so the next boot restores it and mints none of its own', async () => {
    const backend = createMemoryBackend();
    const first = await page(backend, 7, 'document-a');
    expect(first.booted.restoredAuthority).toBeNull();
    expect(first.runtime.diagnostics().sessionSeed).toBe(7);
    await first.runtime.release();

    const second = await page(backend, 99, 'document-b');
    expect(second.booted.restoredAuthority?.sessionRng.seed).toBe(7);
    expect(second.runtime.diagnostics().sessionSeed).toBe(7);
    // A seed already stored is not stored again.
    expect(second.runtime.revision).toBe(first.runtime.revision);
    expect([first.reloads, second.reloads]).toEqual([[], []]);
  });

  it('a seed that storage will not take at boot holds the page, to be tried again, and asks for no reload', async () => {
    const base = createMemoryBackend();
    let full = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (full && operations.some((operation) => operation.store === 'player')) throw new Error('the disk is full');
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    await bootSave({ backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE });
    const before = await dump(base);
    full = true;
    const held = await page(backend, 7, 'document-a');
    expect([held.gate.hold, held.loop.status, held.reloads]).toEqual(['transient-read', 'held', []]);
    expect(held.runtime.diagnostics().leaseOwned).toBe(false);
    expect((await dump(base)).player).toEqual(before.player);
  });
});
