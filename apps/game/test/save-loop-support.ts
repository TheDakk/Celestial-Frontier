import { createMemoryBackend, type StorageBackend } from '@cf/persistence';
import { createBus } from '../src/bus';
import type { GameEvents } from '../src/events';
import { LEASE_TTL_MS, REGISTRY, bootSave, createSaveLoop, createSaveRuntime, createWriteGate } from '../src/save/index';
import { NOW, SOL_ROUTE, controlledClock } from './save-support';

export const boot = (backend: StorageBackend) => bootSave({ backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE });

/** bootSave, createSaveRuntime and createSaveLoop on one backend, as the page wires them, after the first heartbeat. */
export async function bootedHarness(backend: StorageBackend = createMemoryBackend(), token = 'document-a', time = controlledClock(1_000)) {
  const booted = await boot(backend);
  const gate = createWriteGate(booted.hold);
  const runtime = createSaveRuntime({
    backend, registry: REGISTRY,
    initialRevision: booted.revision, initialExtensions: booted.extensions, initialState: booted.state,
    restoredAuthority: booted.restoredAuthority, freshSessionSeed: 7,
    ownerId: 'tab', token, leaseTtlMs: LEASE_TTL_MS, now: time.now, visible: true, answerable: true,
  });
  const bus = createBus<GameEvents>();
  const committed: number[] = [];
  const reloads: string[] = [];
  bus.on('save:committed', ({ revision }) => { committed.push(revision); });
  bus.on('save:reload-required', ({ reason }) => { reloads.push(reason); });
  const held: string[] = [];
  bus.on('save:held', ({ detail }) => { held.push(detail); });
  let route = booted.state.savedView;
  const live = booted.state;
  const loop = createSaveLoop({
    runtime, gate, bus, backend,
    clocks: { wallNow: () => NOW, monotonicNow: time.now },
    live: () => live, route: () => route,
  });
  await loop.beat();
  return { backend, booted, gate, runtime, loop, bus, live, time, committed, reloads, held, setRoute: (next: Record<string, unknown> | null) => { route = next; } };
}

/** A backend whose next write of save rows waits until `release` is called. */
export function pausable(): { backend: StorageBackend; pauseNext: () => Promise<void>; release: () => void } {
  const base = createMemoryBackend();
  let armed = false;
  let entered: () => void = () => undefined;
  let release: () => void = () => undefined;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (armed && operations.some((operation) => operation.store === 'player')) {
        armed = false;
        entered();
        await new Promise<void>((resolve) => { release = resolve; });
      }
      return base.compareAndApply(checks, operations, clearStores);
    },
  };
  return {
    backend,
    pauseNext: () => { armed = true; return new Promise<void>((resolve) => { entered = resolve; }); },
    release: () => release(),
  };
}
