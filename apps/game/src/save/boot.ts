import {
  F3_MAX_REVISION,
  createIndexedDBBackend,
  importSaveV2,
  initializeFreshV5,
  migrateStoredV4ToV5,
  readF4Authority,
  readRevisionedSaveV5WithRecovery,
  type ContentRegistry,
  type F4AuthorityV1,
  type ImportRouteIngressV2,
  type RevisionedV5ReadOutcome,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import type { BootKind, WriteHold } from '../events';
import type { WriteGate } from './hold';

/** The one database this game opens. The stores of the older games are never opened. */
export const SAVE_DATABASE = 'cf-v2-pixel';

export function openSaveBackend(): StorageBackend {
  return createIndexedDBBackend(SAVE_DATABASE);
}

export interface BootResult {
  readonly kind: BootKind;
  readonly hold: WriteHold;
  readonly detail: string | null;
  /** What the player sees. Under a hold with no readable save this is a fresh state that is never stored. */
  readonly state: SaveStateV2;
  readonly ingress: ImportRouteIngressV2;
  readonly extensions: V5Extensions;
  readonly revision: number;
  readonly restoredAuthority: F4AuthorityV1 | null;
}

const NO_EXTENSIONS: V5Extensions = Object.freeze({});

type Loaded = Extract<RevisionedV5ReadOutcome, { kind: 'loaded' }>;
type ProtectedKind = Exclude<BootKind, 'fresh' | 'current'>;

/** Classifies the stored save and decides whether this page may write. Only an empty store is written
 *  (a new expedition at revision 1); a future, corrupt or unreadable save is left byte for byte as it is. */
export async function bootSave(input: {
  backend: StorageBackend;
  registry: ContentRegistry;
  wallNow: number;
  /** The Sol route a new expedition is parked at. */
  freshRoute: Record<string, unknown> | null;
}): Promise<BootResult> {
  const { backend, registry, wallNow, freshRoute } = input;
  const fresh = importSaveV2('{}', registry, wallNow);
  if (!fresh.ok) throw new Error('fresh save construction failed');

  const held = (kind: ProtectedKind, detail: string): BootResult => ({
    kind,
    hold: kind === 'transient-protected' ? 'transient-read' : 'protected-payload',
    detail,
    state: fresh.state,
    ingress: fresh.ingress,
    extensions: NO_EXTENSIONS,
    revision: 0,
    restoredAuthority: null,
  });
  const accept = (current: Loaded): BootResult => {
    const base = { state: current.state, ingress: current.ingress, extensions: current.extensions, revision: current.revision };
    const authority = readF4Authority(current.extensions);
    if (authority.kind === 'future-version' || authority.kind === 'corrupt') {
      return {
        ...base,
        kind: authority.kind === 'future-version' ? 'future-protected' : 'corrupt-protected',
        hold: 'protected-payload',
        detail: `F4 authority ${authority.kind}`,
        restoredAuthority: null,
      };
    }
    const restoredAuthority = authority.kind === 'loaded' ? authority.authority : null;
    if (current.revision === F3_MAX_REVISION) {
      return {
        ...base,
        kind: 'revision-exhausted-protected',
        hold: 'protected-payload',
        detail: `F3 revision ${current.revision} is exhausted`,
        restoredAuthority,
      };
    }
    return { ...base, kind: 'current', hold: false, detail: null, restoredAuthority };
  };

  let current = await readRevisionedSaveV5WithRecovery(backend, registry, wallNow);
  if (current.kind === 'not-migrated') {
    const stored = await migrateStoredV4ToV5(backend, registry, wallNow);
    if (stored.kind === 'fresh') return initializeFresh();
    if (stored.kind === 'protected') {
      return held(
        stored.reason === 'future-version' ? 'future-protected' : 'corrupt-protected',
        `stored v4 source ${stored.reason}`,
      );
    }
    if (stored.kind === 'storage-error') return held('transient-protected', stored.message);
    // Another page stored a save between the two reads. Read once more; never treat a miss as an empty store.
    current = await readRevisionedSaveV5WithRecovery(backend, registry, wallNow);
  }
  switch (current.kind) {
    case 'loaded': return accept(current);
    case 'recovered-v4': return {
      kind: 'recovered-protected',
      hold: 'protected-payload',
      detail: 'current v5 rows failed validation; the recovery snapshot is loaded read-only',
      state: current.state,
      ingress: current.ingress,
      extensions: current.extensions,
      revision: 0,
      restoredAuthority: null,
    };
    case 'future-version': return held('future-protected', `future v5 ${current.scope}`);
    case 'corrupt': return held('corrupt-protected', `corrupt v5 ${current.scope}`);
    case 'storage-error': return held('transient-protected', current.message);
    case 'changed':
    case 'not-migrated': return held('transient-protected', 'the save changed during the boot read');
  }

  async function initializeFresh(): Promise<BootResult> {
    if (!fresh.ok) throw new Error('fresh save construction failed');
    const state = fresh.state;
    state.tutDone = false;
    if (freshRoute !== null) state.savedView = freshRoute;
    const initialized = await initializeFreshV5(backend, { state, extensions: NO_EXTENSIONS }, registry, wallNow);
    if (initialized.kind === 'initialized') {
      return {
        kind: 'fresh',
        hold: false,
        detail: null,
        state,
        ingress: fresh.ingress,
        extensions: NO_EXTENSIONS,
        revision: initialized.revision,
        restoredAuthority: null,
      };
    }
    if (initialized.kind === 'storage-error') return held('transient-protected', initialized.message);
    // Another page on the same empty store won. Adopt its save, not this page's unsaved one.
    let winner = await readRevisionedSaveV5WithRecovery(backend, registry, wallNow);
    if (winner.kind === 'changed') winner = await readRevisionedSaveV5WithRecovery(backend, registry, wallNow);
    if (winner.kind === 'loaded') return accept(winner);
    return held(
      'transient-protected',
      `fresh initialization winner was not stably readable (${winner.kind}); reload required`,
    );
  }
}

/** "Try again" under a transient hold. `reload`: the store reads again, and only a reload may classify it.
 *  `protected`: the store holds a save this page must not change; the hold is tightened.
 *  `unavailable`: storage still cannot be read. A hold that is not transient is left as it is. */
export async function retryHeldRead(input: {
  backend: StorageBackend;
  registry: ContentRegistry;
  wallNow: number;
  gate: WriteGate;
}): Promise<'reload' | 'protected' | 'unavailable'> {
  const { gate } = input;
  if (gate.hold !== 'transient-read') return gate.hold === false ? 'reload' : 'protected';
  const read = await readRevisionedSaveV5WithRecovery(input.backend, input.registry, input.wallNow);
  if (gate.hold !== 'transient-read') return 'protected';
  switch (read.kind) {
    case 'loaded':
    case 'not-migrated':
    case 'changed': return 'reload';
    case 'future-version':
      gate.protect('this expedition was written by a newer build');
      return 'protected';
    case 'corrupt':
    case 'recovered-v4':
      gate.protect('the stored expedition did not prove writable');
      return 'protected';
    case 'storage-error': return 'unavailable';
  }
}
