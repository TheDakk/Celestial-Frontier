import {
  STORES,
  createMemoryBackend,
  createRevisionedRepository,
  initializeFreshV5,
  importSaveV2,
  prepareV5SaveWrite,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import type { Clocks } from '../src/platform/clock';
import { LEASE_TTL_MS, REGISTRY, bootSave, createSaveRuntime, createWriteGate } from '../src/save/index';

export const NOW = 1_800_000_000_000;
const HOME = { x: 0, y: 0, size: 60, sp: 0, tilt: 0.5, rot: 0, seed: 1, home: true, quasar: false, dwarf: false };
/** Routes in the stored form: each is unchanged by a write and a read. */
export const SOL_ROUTE: Record<string, unknown> = { type: 'star', gal: HOME, star: { x: 0, y: 0, seed: 1 } };
export const GALAXY_ROUTE: Record<string, unknown> = { type: 'galaxy', gal: { ...HOME, x: 40, y: -12, seed: 77, home: false } };

/** Every stored row of every store, read through the backend's own reads. */
export async function dump(backend: StorageBackend): Promise<Record<string, Record<string, string>>> {
  const out: Record<string, Record<string, string>> = {};
  for (const store of STORES) {
    const rows: Record<string, string> = {};
    for (const key of [...await backend.keys(store)].sort()) rows[key] = (await backend.get(store, key)) as string;
    out[store] = rows;
  }
  return out;
}

/** A state as a new game holds it, with the explorer named so a test can tell it from a placeholder. */
export function namedState(explorerName: string): SaveStateV2 {
  const fresh = importSaveV2('{}', REGISTRY, NOW);
  if (!fresh.ok) throw new Error('fresh state failed');
  fresh.state.explorerName = explorerName;
  return fresh.state;
}

/** A save this game wrote: a new expedition, then one ordinary write. It stands at revision 2. */
export async function seedCurrentSave(
  backend: StorageBackend,
  explorerName = 'Vega',
  extensions: V5Extensions = {},
  change: (state: SaveStateV2) => void = () => undefined,
): Promise<void> {
  const state = namedState(explorerName);
  change(state);
  const started = await initializeFreshV5(backend, { state, extensions: {} }, REGISTRY, NOW);
  if (started.kind !== 'initialized') throw new Error(`seed was ${started.kind}`);
  const written = await createRevisionedRepository(backend).mutate({
    expectedRevision: 1,
    writes: prepareV5SaveWrite({ state, extensions }, REGISTRY, NOW).operations,
  });
  if (written.kind !== 'committed') throw new Error(`seed write was ${written.kind}`);
}

/** A clock a test moves by hand. */
export function controlledClock(start = 0): { now: () => number; advance: (amount: number) => void } {
  let value = start;
  return { now: () => value, advance: (amount) => { value += amount; } };
}

/** bootSave, the write gate and the save runtime on one backend, as the page wires them. The page holds the
 *  lease unless the boot put it under a hold, when it touches nothing. */
export async function bootedPage(backend: StorageBackend = createMemoryBackend(), token = 'document-a') {
  const booted = await bootSave({ backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE });
  const time = controlledClock(1_000);
  const gate = createWriteGate(booted.hold);
  const runtime = createSaveRuntime({
    backend, registry: REGISTRY,
    initialRevision: booted.revision, initialExtensions: booted.extensions, initialState: booted.state,
    restoredAuthority: booted.restoredAuthority, freshSessionSeed: 7,
    ownerId: 'tab', token, leaseTtlMs: LEASE_TTL_MS, now: time.now, visible: true, answerable: true,
  });
  if (booted.hold === false && (await runtime.heartbeat()).kind !== 'owned') throw new Error('the page did not get the lease');
  const clocks: Clocks = { wallNow: () => NOW, monotonicNow: time.now };
  return { backend, booted, gate, runtime, time, clocks, live: booted.state };
}

/** Runs `run` with the device's storage replaced by one held in memory; `rows` is everything it holds. */
export async function withDeviceStorage(run: (rows: Map<string, string>) => void | Promise<void>): Promise<void> {
  const rows = new Map<string, string>();
  const storage = {
    getItem: (key: string): string | null => rows.get(key) ?? null,
    setItem: (key: string, value: string): void => { rows.set(key, String(value)); },
    removeItem: (key: string): void => { rows.delete(key); },
    clear: (): void => { rows.clear(); },
  };
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  try {
    await run(rows);
  } finally {
    if (prior === undefined) delete (globalThis as { localStorage?: unknown }).localStorage;
    else Object.defineProperty(globalThis, 'localStorage', prior);
  }
}
