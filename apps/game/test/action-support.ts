// A page ready for a product action: a stored expedition past training, its lease held, its session seed stored
// and its four carriers made, with the save loop the page settles actions through.
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  createMemoryBackend, createRevisionedRepository, prepareF4AuthorityUpdate, readRevisionedSaveV5WithRecovery,
  type SaveStateV2, type StorageBackend, type V5Extensions,
} from '@cf/persistence';
import { REGISTRY, startCarriers } from '../src/save/index';
import { bootedHarness } from './save-loop-support';
import { NOW, seedCurrentSave } from './save-support';

export interface ActionPageOptions {
  /** Changes the stored state before the page boots. Training is over unless this says otherwise. */
  readonly change?: (state: SaveStateV2) => void;
  /** The active play the expedition already holds, in milliseconds. */
  readonly activePlayMs?: number;
  /** The seed of the session's random streams; the page's own when left out. */
  readonly sessionSeed?: number;
  readonly backend?: StorageBackend;
}

export async function actionPage(options: ActionPageOptions = {}) {
  const backend = options.backend ?? createMemoryBackend();
  const extensions: V5Extensions = options.activePlayMs === undefined && options.sessionSeed === undefined ? {}
    : prepareF4AuthorityUpdate({}, { activePlayMs: options.activePlayMs ?? 0 }, createSessionRNG(options.sessionSeed ?? 0xC4A7_0002).state()).extensions;
  await seedCurrentSave(backend, 'Vega', extensions, (state) => {
    state.tutDone = true;
    options.change?.(state);
  });
  const page = await bootedHarness(backend);
  const carriers = await startCarriers({ runtime: page.runtime, loop: page.loop });
  if (carriers.kind !== 'created' && carriers.kind !== 'ready') throw new Error(`carriers were ${carriers.kind}`);
  const refused: Array<{ kind: string; reason: string }> = [];
  const committed: Array<{ kind: string; receiptOrdinal: number }> = [];
  page.bus.on('outcome:refused', (event) => { refused.push(event); });
  page.bus.on('outcome:committed', (event) => { committed.push(event); });
  const repository = createRevisionedRepository(backend);
  return {
    ...page,
    repository,
    outcomes: { refused, committed },
    /** The state the last stored revision holds. */
    durable: (): SaveStateV2 => {
      const parent = page.runtime.checkpointParent();
      if (parent === null) throw new Error('the page holds no stored state');
      return parent;
    },
    /** What storage itself holds, read back. */
    stored: async () => {
      const read = await readRevisionedSaveV5WithRecovery(backend, REGISTRY, NOW);
      if (read.kind !== 'loaded') throw new Error(`stored save was ${read.kind}`);
      return read;
    },
    receipts: async (): Promise<string[]> => [...await backend.keys('receipts')].sort(),
  };
}
export type ActionPage = Awaited<ReturnType<typeof actionPage>>;
