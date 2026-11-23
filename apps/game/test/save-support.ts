import {
  STORES,
  createRevisionedRepository,
  initializeFreshV5,
  importSaveV2,
  prepareV5SaveWrite,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import { REGISTRY } from '../src/save/registry';

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
): Promise<void> {
  const state = namedState(explorerName);
  const started = await initializeFreshV5(backend, { state, extensions: {} }, REGISTRY, NOW);
  if (started.kind !== 'initialized') throw new Error(`seed was ${started.kind}`);
  const written = await createRevisionedRepository(backend).mutate({
    expectedRevision: 1,
    writes: prepareV5SaveWrite({ state, extensions }, REGISTRY, NOW).operations,
  });
  if (written.kind !== 'committed') throw new Error(`seed write was ${written.kind}`);
}
