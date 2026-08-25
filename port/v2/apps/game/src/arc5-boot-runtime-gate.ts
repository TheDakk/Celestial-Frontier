/* Arc 5 is the final authority check before Main may create the one F4 boot
   runtime. Persistence classification stays with its existing owner; this
   synchronous gate only selects the detached live projection and either
   invokes the supplied Main-owned runtime constructor once or not at all. */
import type {
  Arc5OwnershipMigrationReadOutcome,
  Arc5OwnershipMigrationPreparation,
  SaveStateV2,
} from '@cf/persistence';

export type Arc5BootGateClassification =
  | Arc5OwnershipMigrationPreparation
  | Readonly<{ kind: 'deferred' }>
  | Readonly<{ kind: 'held'; reason: string }>;

export type Arc5BootLiveProjection = Readonly<{
  savedView: SaveStateV2['savedView'];
  atlas: readonly (readonly [id: string, where: unknown])[];
  items: SaveStateV2['items'];
  equip: SaveStateV2['equip'];
  equipAff: SaveStateV2['equipAff'];
}>;

export type Arc5BootRuntimeGateOutcome<Runtime> =
  | Readonly<{
    kind: 'ready';
    classification: Exclude<Arc5BootGateClassification, { readonly kind: 'protected' | 'held' }>;
    live: Arc5BootLiveProjection;
    runtime: Runtime;
  }>
  | Readonly<{
    kind: 'protected';
    classification: Extract<Arc5BootGateClassification, { readonly kind: 'protected' | 'held' }>;
    live: Arc5BootLiveProjection;
    runtime: null;
  }>;

/** Legacy/unknown Training may defer only a genuinely absent Arc 5 carrier.
 * Any present carrier is conflicting checkpoint evidence and must hold Main
 * behind the same zero-runtime rollback gate as an ordinary protected read. */
export function classifyArc5TrainingBootGate(
  outcome: Arc5OwnershipMigrationReadOutcome,
): Readonly<{ kind: 'deferred' }> | Readonly<{ kind: 'held'; reason: string }> {
  return outcome.kind === 'absent'
    ? Object.freeze({ kind: 'deferred' })
    : Object.freeze({ kind: 'held', reason: `training-carrier-anomaly:${outcome.kind}` });
}

function detachedProjection(value: Arc5BootLiveProjection): Arc5BootLiveProjection {
  return Object.freeze(structuredClone(value));
}

export function captureArc5BootLiveProjection(state: SaveStateV2): Arc5BootLiveProjection {
  return detachedProjection({
    savedView: state.savedView,
    atlas: state.logMap.map(([id, entry]) => [id, entry.where] as const),
    items: state.items,
    equip: state.equip,
    equipAff: state.equipAff,
  });
}

/** Restore only the five compatibility surfaces that can be staged before
 * Arc 5's final authority decision. Atlas row identity/order must still be
 * exact; this helper never repairs a structurally different save. */
export function applyArc5BootLiveProjection(
  state: SaveStateV2,
  projection: Arc5BootLiveProjection,
): void {
  if (state.logMap.length !== projection.atlas.length
    || state.logMap.some(([id], index) => id !== projection.atlas[index]?.[0])) {
    throw new Error('Arc 5 boot rollback Atlas identity changed');
  }
  const detached = detachedProjection(projection);
  state.savedView = detached.savedView;
  for (let index = 0; index < state.logMap.length; index++) {
    state.logMap[index]![1].where = detached.atlas[index]![1];
  }
  state.items = detached.items;
  state.equip = detached.equip;
  state.equipAff = detached.equipAff;
}

/** Gate Main's sole runtime constructor. A protected/held decision returns
 * the durable projection and cannot create a runtime, reach a CAS, or retry.
 * Ready/deferred decisions preserve the staged projection and invoke the
 * supplied constructor exactly once. */
export function runArc5BootRuntimeGate<Runtime>(input: Readonly<{
  classification: Arc5BootGateClassification;
  durable: Arc5BootLiveProjection;
  staged: Arc5BootLiveProjection;
  createRuntime: () => Runtime;
}>): Arc5BootRuntimeGateOutcome<Runtime> {
  if (input.classification.kind === 'protected'
    || input.classification.kind === 'held') {
    return Object.freeze({
      kind: 'protected',
      classification: input.classification,
      live: detachedProjection(input.durable),
      runtime: null,
    });
  }
  const runtime = input.createRuntime();
  return Object.freeze({
    kind: 'ready',
    classification: input.classification,
    live: detachedProjection(input.staged),
    runtime,
  });
}
