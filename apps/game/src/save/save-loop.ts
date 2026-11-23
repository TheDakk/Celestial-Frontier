/* The save loop: the one writer of ordinary checkpoints.

   A checkpoint is the last stored state with the route, the settings and the epoch laid over it. The epoch is
   a candidate until the checkpoint that carries it is stored; drawing reads only the published one. A commit
   that is refused, or a lease or revision this page can no longer prove, makes the page read-only until it
   reloads. Storage that fails the lease before it has once answered is a hold instead: a reload would only
   meet the same failure. Under a write hold nothing here touches storage, the lease row included. */
import { createRevisionedRepository, type SaveStateV2, type StorageBackend, type V5ExtensionWrite } from '@cf/persistence';
import type { Bus } from '../bus';
import type { GameEvents } from '../events';
import type { Clocks } from '../platform/clock';
import { projectCheckpointState } from './checkpoint';
import { createEcologyEpochEdgeAuthority, type EcologyEpochCheckpointIntent, type EcologyEpochStage } from './epoch';
import type { WriteGate } from './hold';
import type { SaveRuntime } from './runtime';

/** A page holding the lease stores a checkpoint at least this often. */
export const CHECKPOINT_MS = 30_000;

export type SaveReason = 'route' | 'settings' | 'epoch-edge' | 'lifecycle';

export interface SaveLoop {
  /** Resolves true when this request's state is stored. `extensionWrites` are stored in the same checkpoint. */
  request(reason: SaveReason, extensionWrites?: readonly V5ExtensionWrite[]): Promise<boolean>;
  /** Resolves when no write is running or waiting. */
  flush(): Promise<void>;
  /** One heartbeat: acquire or renew the lease, confirm the stored revision is this page's, and store a
   *  checkpoint when one is due by time or by an epoch tick. The page calls it once at boot and then every
   *  HEARTBEAT_MS. */
  beat(): Promise<void>;
  /** The page was hidden: stop accrual, store a `lifecycle` checkpoint, give up the lease. */
  hide(): Promise<void>;
  /** The page is visible again: take the lease back and resume accrual. */
  show(): Promise<void>;
  readonly status: 'idle' | 'writing' | 'held' | 'reload-required';
  /** True while a change made on this page would be stored: no hold, no reload owed, and the lease is this
   *  page's over the revision it knows. */
  mayWrite(): boolean;
  /** The epoch every drawing and descriptor reads: only ever a committed one. */
  publishedEpoch(): number;
}

const message = (error: unknown): string => error instanceof Error ? error.message : String(error);

export function createSaveLoop(deps: {
  runtime: SaveRuntime;
  gate: WriteGate;
  bus: Bus<GameEvents>;
  clocks: Clocks;
  /** Read only, for the stored revision. Every write goes through the runtime. */
  backend: StorageBackend;
  /** The state the player sees. A stored checkpoint writes its route and epoch back into it. */
  live(): SaveStateV2;
  route(): Record<string, unknown> | null;
}): SaveLoop {
  const { runtime, gate, bus, clocks } = deps;
  const repository = createRevisionedRepository(deps.backend);
  const epoch = createEcologyEpochEdgeAuthority({
    restoredEpoch: deps.live().EPOCH_BASE,
    activePlayAtBootMs: runtime.activePlayMs(),
  });
  let reloadRequired = false;
  let lastCheckpointAt = clocks.monotonicNow();
  let active: Promise<boolean> | null = null;
  let queued: { run: Promise<boolean>; edgeOnly: boolean; extensionWrites: V5ExtensionWrite[] } | null = null;
  /** The lease and revision part of a heartbeat or a show; a write waits for it. */
  let proving: Promise<void> | null = null;
  let hiding: Promise<void> | null = null;
  /** True once storage has answered for the lease, whoever holds it. */
  let leaseAnswered = false;

  const closed = (): boolean => !gate.mayWrite() || reloadRequired;
  const mayWrite = (): boolean => {
    if (closed()) return false;
    const diagnostics = runtime.diagnostics();
    return diagnostics.leaseOwned && !diagnostics.staleBlocked;
  };

  let announced = false;
  /** Says so when what `mayWrite` answers has changed. */
  const announce = (): void => {
    const writable = mayWrite();
    if (writable === announced) return;
    announced = writable;
    bus.emit('save:authority', { writable });
  };

  /** Makes the page read-only and asks, once, for a reload. */
  const requireReload = (reason: string): void => {
    if (reloadRequired) return;
    reloadRequired = true;
    runtime.setAnswerable(false);
    void runtime.release().catch(() => undefined);
    bus.emit('save:reload-required', { reason });
    announce();
  };

  /** Holds the page, with no reload: the player may try storage again. */
  const holdTransient = (detail: string): void => {
    gate.holdTransient(detail);
    runtime.setAnswerable(false);
    void runtime.release().catch(() => undefined);
    bus.emit('save:held', { detail });
    announce();
  };

  const write = async (intent: EcologyEpochCheckpointIntent, extensionWrites: readonly V5ExtensionWrite[]): Promise<boolean> => {
    if (proving !== null) await proving.catch(() => undefined);
    if (!mayWrite()) return false;
    const staged = epoch.stage(runtime.activePlayMs(), intent);
    if (staged.kind !== 'staged') return false;
    let stage: EcologyEpochStage | null = staged.stage;
    let durable = false;
    try {
      const parent = runtime.checkpointParent();
      if (parent === null) throw new Error('checkpoint has no stored parent');
      const projection = projectCheckpointState({
        durable: parent,
        live: deps.live(),
        savedView: deps.route(),
        epoch: stage.epoch,
        trainingReplacement: false,
      });
      if (projection.kind !== 'projected') throw new Error(`checkpoint projection refused (${projection.detail})`);
      const outcome = await runtime.commit(projection.state, clocks.wallNow(), extensionWrites);
      if (outcome.kind === 'committed') {
        durable = true;
        if (epoch.commit(stage, outcome.revision).kind === 'invalid-stage') {
          throw new Error('committed checkpoint lost its epoch stage');
        }
        const live = deps.live();
        live.savedView = outcome.saved.canonicalState.savedView;
        live.EPOCH_BASE = outcome.saved.canonicalState.EPOCH_BASE;
        lastCheckpointAt = clocks.monotonicNow();
        bus.emit('save:committed', { revision: outcome.revision });
        return true;
      }
      epoch.reject(stage);
      stage = null;
      requireReload(outcome.kind === 'stale'
        ? `stale revision ${outcome.expectedRevision}/${outcome.actualRevision}`
        : `save authority ${outcome.kind}`);
      return false;
    } catch (error) {
      if (durable) {
        requireReload(`checkpoint committed; publication ${message(error)}`);
        return true;
      }
      if (stage !== null) epoch.reject(stage);
      requireReload(`save attempt rejected (${message(error)})`);
      return false;
    }
  };

  /** One write at a time. Requests made during a write share the one write that follows it. */
  const start = (edgeOnly: boolean, extensionWrites: readonly V5ExtensionWrite[]): Promise<boolean> => {
    const run: Promise<boolean> = write(edgeOnly ? 'ecology-edge' : 'ordinary', extensionWrites)
      .finally(() => { if (active === run) active = null; });
    active = run;
    return run;
  };
  const request = (reason: SaveReason, extensionWrites: readonly V5ExtensionWrite[] = []): Promise<boolean> => {
    if (closed()) return Promise.resolve(false);
    const edgeOnly = reason === 'epoch-edge';
    if (queued !== null) {
      if (!edgeOnly) queued.edgeOnly = false;
      queued.extensionWrites.push(...extensionWrites);
      return queued.run;
    }
    if (active === null) return start(edgeOnly, extensionWrites);
    const waiting = { edgeOnly, extensionWrites: [...extensionWrites], run: Promise.resolve(false) };
    waiting.run = active.then(() => false, () => false).then(() => {
      queued = null;
      return start(waiting.edgeOnly, waiting.extensionWrites);
    });
    queued = waiting;
    return waiting.run;
  };

  const revisionIsCurrent = async (): Promise<boolean> => {
    try {
      const stored = await repository.revision();
      if (stored === runtime.revision) return true;
      requireReload(`lease acquisition observed revision ${runtime.revision}/${stored}`);
    } catch (error) {
      requireReload(`revision read failed (${message(error)})`);
    }
    return false;
  };
  /** Takes or renews the lease; true when this page holds it over the revision it knows. */
  const prove = async (acquire: () => ReturnType<SaveRuntime['heartbeat']>): Promise<boolean> => {
    let owned = false;
    const run = (async () => {
      const outcome = await acquire();
      if (outcome.kind === 'storage-error') {
        const detail = `lease ${outcome.operation} storage failure (${outcome.message})`;
        if (leaseAnswered) requireReload(detail); else holdTransient(detail);
        return;
      }
      if (outcome.kind !== 'lost') leaseAnswered = true;
      if (outcome.kind === 'owned' && await revisionIsCurrent()) owned = true;
    })();
    proving = run;
    try { await run; } finally { if (proving === run) proving = null; }
    announce();
    return owned;
  };
  return {
    request,
    async flush() {
      while (active !== null || queued !== null) await (queued?.run ?? active)?.catch(() => false);
    },
    async beat() {
      if (closed()) return;
      if (!await prove(() => runtime.heartbeat())) return;
      runtime.setAnswerable(true);
      if (active !== null) return;
      if (clocks.monotonicNow() - lastCheckpointAt >= CHECKPOINT_MS) await request('lifecycle');
      else if (epoch.autoCheckpointDue(runtime.activePlayMs())) await request('epoch-edge');
    },
    hide() {
      if (hiding !== null) return hiding;
      if (closed()) return Promise.resolve();
      runtime.setAnswerable(false);
      const run: Promise<void> = (async () => {
        try {
          await request('lifecycle');
        } finally {
          try { await runtime.setVisible(false); } catch { await runtime.release(); }
          announce();
        }
      })().finally(() => { if (hiding === run) hiding = null; });
      hiding = run;
      return run;
    },
    async show() {
      if (hiding !== null) await hiding.catch(() => undefined);
      if (closed()) return;
      runtime.setAnswerable(await prove(() => runtime.setVisible(true)));
    },
    get status() {
      if (reloadRequired) return 'reload-required';
      if (!gate.mayWrite()) return 'held';
      return active !== null || queued !== null ? 'writing' : 'idle';
    },
    mayWrite,
    publishedEpoch: () => epoch.published(),
  };
}
