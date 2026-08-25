/* Legacy Field Training checkpoint restoration.
 *
 * v1.8.9 did not store a whole save in `tsnap`. It stored exactly eleven
 * checkpoint-owned surfaces (stats, player stats, achievements, essence,
 * Compendium, cargo, exceptional counts, items, equipment, affixes and the
 * Earth Atlas row). Everything else belongs to the surrounding v4 save and
 * must survive unchanged. This helper builds a replacement candidate only;
 * its caller owns source proof, the single repository write and publication.
 */
import {
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  arc4OwnershipLegacyMirrorMatches,
  arc2LootLegacyMirrorMatches,
  importSaveV2,
  migrateLegacyOwnership,
  prepareArc4OwnershipLegacyMigration,
  prepareArc2LootLegacyRestore,
  readArc4Ownership,
  readArc2Loot,
  type Arc4OwnershipLegacyMigrationPreparation,
  type Arc2LootStateV1,
  type Arc2LootWritePreparation,
  type ContentRegistry,
  type ImportTrainingSnapshotIngressV2,
  type LegacyTrainingCheckpointV1,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import { MAX_GEAR_CAPACITY } from '@cf/domain-loot';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalJson,
  ownershipStateDigestV1,
  type OwnershipStateV1,
} from '@cf/domain-acquisition';

const DIRECT_STAT_KEYS = [
  'shares', 'jumps', 'anomalies', 'events', 'duels', 'duelwins',
  'breeds', 'breedwins', 'feeds', 'feedfails', 'harvests',
  'essenceEarned', 'guardians', 'paragons', 'mines', 'crafts',
  'minedout', 'skims', 'cosmics', 'landings', 'charters',
] as const;

export interface LegacyTrainingRestoreInput {
  /** A detached, already-sanitized copy of the current surrounding save. */
  readonly current: SaveStateV2;
  readonly checkpoint: LegacyTrainingCheckpointV1;
  readonly registry: ContentRegistry;
  readonly now: number;
  readonly epoch: number;
  /** Source-proven public compatibility view for Earth; never checkpoint data. */
  readonly canonicalEarthView: Record<string, unknown>;
  /** Source-proven view to publish after Training completes. */
  readonly completionView: Record<string, unknown> | null;
}

export type LegacyTrainingRestoreResult =
  | {
      readonly ok: true;
      readonly state: SaveStateV2;
      readonly earthEntry: Record<string, unknown>;
    }
  | { readonly ok: false };

export type PreparedTrainingArc2Restore = Extract<
  Arc2LootWritePreparation,
  { readonly kind: 'prepared' }
>;

export type PreparedTrainingArc4Restore = Extract<
  Arc4OwnershipLegacyMigrationPreparation,
  { readonly kind: 'prepared' }
>;

export type TrainingArc4RestorePreparation =
  | PreparedTrainingArc4Restore
  | Extract<Arc4OwnershipLegacyMigrationPreparation, { readonly kind: 'protected' }>
  | {
      readonly kind: 'protected';
      readonly reason: 'target-loaded';
      readonly mode: OwnershipStateV1['mode'];
      readonly actualRevision: number;
    };

/** Derive Training's coupled Arc 2 namespace from the candidate's restored
 * compatibility fields. This is preparation only; the caller must land its
 * one write with the candidate state in the same durable transaction. */
export function prepareTrainingArc2Restore(
  checkpointKind: ImportTrainingSnapshotIngressV2['kind'],
  legacyFieldsRestored: boolean,
  state: SaveStateV2,
  extensions: V5Extensions,
): Arc2LootWritePreparation | null {
  /* Current-v2 route checkpoints never own inventory. Rebuilding their
     carrier from the compatibility mirror could erase exact-instance flags,
     revision or pending rewards. Only the eleven-field legacy checkpoint
     owns `it`/`eq`/`ea` and therefore requires a replacement carrier. */
  if (checkpointKind !== 'legacy-v1' || legacyFieldsRestored !== true) return null;
  return prepareArc2LootLegacyRestore({
    extensions,
    legacy: state,
    capacity: MAX_GEAR_CAPACITY,
  });
}

/** Read the post-commit carrier only after durability and prove it is the
 * exact prepared carrier and the exact compatibility mirror being published.
 * A null result is convergence-by-reload, never permission to retry. */
export function committedTrainingArc2State(
  state: SaveStateV2,
  prepared: PreparedTrainingArc2Restore,
  extensions: V5Extensions,
): Arc2LootStateV1 | null {
  const carrier = extensions[prepared.write.segment]?.[prepared.write.namespace];
  const loaded = readArc2Loot(extensions);
  if (loaded.kind !== 'loaded'
    || JSON.stringify(loaded.state) !== JSON.stringify(prepared.state)
    || carrier === undefined
    || carrier.version !== prepared.write.carrier.version
    || carrier.json !== prepared.write.carrier.json
    || !arc2LootLegacyMirrorMatches(loaded.state, state)) return null;
  return loaded.state;
}

/** Bootstrap Arc 4 only when a genuine legacy checkpoint actually replaced
 * the ownership-bearing compatibility fields in the final candidate. Route-
 * only, source-deferred and no-checkpoint outcomes preserve current authority.
 * Any existing carrier is explicit protection: Training never rewinds it. */
export function prepareTrainingArc4Restore(
  checkpointKind: ImportTrainingSnapshotIngressV2['kind'] | 'source-deferred',
  legacyFieldsRestored: boolean,
  state: SaveStateV2,
  extensions: V5Extensions,
): TrainingArc4RestorePreparation | null {
  if (checkpointKind !== 'legacy-v1' || legacyFieldsRestored !== true) return null;
  const prepared = prepareArc4OwnershipLegacyMigration({
    extensions,
    legacy: state,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (prepared.kind !== 'already-loaded') return prepared;
  return Object.freeze({
    kind: 'protected',
    reason: 'target-loaded',
    mode: prepared.state.mode,
    actualRevision: prepared.state.revision,
  });
}

/** Verify only after Training's single replacement transaction is durable.
 * All 18 prepared carrier bytes and the registered state digest must agree.
 * Current state also requires its complete v4 mirror; lossless legacy-
 * protected state instead retains its exact registered evidence. Null means
 * read-only convergence by reload, never retry. */
export function committedTrainingArc4State(
  state: SaveStateV2,
  prepared: PreparedTrainingArc4Restore,
  extensions: V5Extensions,
): OwnershipStateV1 | null {
  try {
    if (prepared.writes.length !== ARC4_OWNERSHIP_EXTENSION_TARGETS.length) return null;
    for (let index = 0; index < ARC4_OWNERSHIP_EXTENSION_TARGETS.length; index++) {
      const target = ARC4_OWNERSHIP_EXTENSION_TARGETS[index]!;
      const write = prepared.writes[index]!;
      const carrier = extensions[target.segment]?.[target.namespace];
      if (write.segment !== target.segment || write.namespace !== target.namespace
        || carrier === undefined
        || carrier.version !== write.carrier.version
        || carrier.json !== write.carrier.json) return null;
    }
    const loaded = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    if (loaded.kind !== 'loaded'
      || ownershipStateDigestV1(loaded.state) !== ownershipStateDigestV1(prepared.state)) return null;
    const evidenceDescriptor = Reflect.getOwnPropertyDescriptor(
      prepared,
      'migrationSourceEvidence',
    );
    if (!evidenceDescriptor || !('value' in evidenceDescriptor)
      || evidenceDescriptor.get !== undefined || evidenceDescriptor.set !== undefined
      || evidenceDescriptor.enumerable !== true) return null;
    const migrated = migrateLegacyOwnership(state);
    if (loaded.state.mode === 'current') {
      if (prepared.migration !== 'migrated'
        || migrated.kind !== 'migrated'
        || ownershipStateDigestV1(migrated.state) !== ownershipStateDigestV1(prepared.state)
        || canonicalJson(migrated.sourceEvidence) !== canonicalJson(evidenceDescriptor.value)
        || !arc4OwnershipLegacyMirrorMatches(loaded.state, state)) return null;
    } else {
      if (prepared.migration !== 'legacy-protected') return null;
      if (migrated.kind !== 'legacy-protected'
        || ownershipStateDigestV1(migrated.state) !== ownershipStateDigestV1(prepared.state)
        || canonicalJson(migrated.sourceEvidence) !== canonicalJson(evidenceDescriptor.value)
        || JSON.stringify(migrated.sourceEvidence)
          !== JSON.stringify(prepared.state.legacyProtection)
        || JSON.stringify(migrated.sourceEvidence)
          !== JSON.stringify(loaded.state.legacyProtection)) return null;
    }
    return loaded.state;
  } catch {
    return null;
  }
}

function checkpointRaw(
  current: SaveStateV2,
  checkpoint: LegacyTrainingCheckpointV1,
  now: number,
): Record<string, unknown> {
  const raw: Record<string, unknown> = {
    v: 4,
    epoch: current.EPOCH_BASE,
    at: now,
    me: current.explorerName,
    names: current.customNames,
    pstats: checkpoint.ps,
    hp: current.hp,
    essence: checkpoint.es,
    ach: checkpoint.ac,
    codex: checkpoint.c,
    cargo: checkpoint.ca,
    cgx: checkpoint.cx,
    items: checkpoint.it,
    eq: checkpoint.eq,
    ea: checkpoint.ea,
    /* These are cumulative "ever" records. The corresponding record holder
       can have been consumed before Training, so the surviving checkpoint
       Compendium is not sufficient to reconstruct them. */
    ever: {
      v: 1,
      hybrids: checkpoint.st.hybrids,
      best: checkpoint.st.best,
      maxGen: checkpoint.st.maxGen,
      scanhits: checkpoint.st.scanhits,
    },
    surveyed: current.surveyedSet,
    log: checkpoint.e === null ? [] : [checkpoint.e],
    home: checkpoint.e === null ? null : 'p133',
  };
  for (const key of DIRECT_STAT_KEYS) raw[key] = checkpoint.st[key];
  raw.br = checkpoint.st.bestRank;
  return raw;
}

function checkpointEarthHistory(
  checkpoint: LegacyTrainingCheckpointV1,
  sanitized: Record<string, unknown> | undefined,
): Readonly<Record<string, unknown>> {
  if (!checkpoint.e) return Object.freeze({});
  return Object.freeze({
    /* Consume the current importer's one sanitized row instead of growing a
       second near-copy of Atlas coercion here. In particular legacy numeric
       strings for `t` follow the same bounded `num` contract as normal load. */
    fav: !!sanitized?.fav,
    t: typeof sanitized?.t === 'number' && Number.isFinite(sanitized.t)
      ? sanitized.t : 0,
    badge: typeof sanitized?.badge === 'string' ? sanitized.badge : '',
    sub: typeof sanitized?.sub === 'string' ? sanitized.sub : '',
    star: typeof sanitized?.star === 'string' ? sanitized.star : '',
    title: sanitized?.title,
  });
}

/**
 * Restore only the fields that v1.8.9 actually placed in its Training
 * checkpoint. The checkpoint's stale `e.where` is intentionally ignored:
 * the caller must pass an independently source-proven Earth view.
 */
export function buildLegacyTrainingRestoreCandidate(
  input: LegacyTrainingRestoreInput,
): LegacyTrainingRestoreResult {
  const imported = importSaveV2(
    JSON.stringify(checkpointRaw(input.current, input.checkpoint, input.now)),
    input.registry,
    input.now,
  );
  if (!imported.ok) return { ok: false };

  const sanitizedEarth = imported.state.logMap.find(([id]) => id === 'p133')?.[1];
  const history = checkpointEarthHistory(input.checkpoint, sanitizedEarth);
  const oldEarthIndex = input.current.logMap.findIndex(([id]) => id === 'p133');
  const liveEarth = oldEarthIndex >= 0 ? input.current.logMap[oldEarthIndex]![1] : undefined;
  const earthEntry: Record<string, unknown> = {
    ...(liveEarth || sanitizedEarth || {
      id: 'p133', title: 'Earth', sub: 'Terran World', thumb: null,
      sq: false, badge: 'Home', fav: false, t: input.now,
    }),
    id: 'p133',
    title: (liveEarth?.title || sanitizedEarth?.title || history.title || 'Earth'),
    sub: history.sub || liveEarth?.sub || sanitizedEarth?.sub || 'Terran World',
    badge: history.badge || liveEarth?.badge || sanitizedEarth?.badge || 'Home',
    star: history.star || liveEarth?.star || '',
    fav: input.checkpoint.e === null ? !!liveEarth?.fav : history.fav,
    t: input.checkpoint.e === null
      ? (typeof liveEarth?.t === 'number' ? liveEarth.t : input.now)
      : history.t,
    where: input.canonicalEarthView,
  };
  const logMap = input.current.logMap.slice();
  if (oldEarthIndex >= 0) logMap[oldEarthIndex] = ['p133', earthEntry];
  else logMap.push(['p133', earthEntry]);
  if (logMap.length > 120) {
    /* The ordinary exporter keeps the 120 newest rows. A veteran's genuine
       Earth history can be older than 120 later discoveries, yet D-TRAIN's
       checkpoint explicitly owns that home row. Reserve one slot for p133
       without changing its historical timestamp, then keep the newest 119. */
    const newestOtherRows = logMap
      .filter(([id]) => id !== 'p133')
      .sort(([, left], [, right]) => Number(right.t || 0) - Number(left.t || 0))
      .slice(0, 119);
    logMap.length = 0;
    logMap.push(...newestOtherRows, ['p133', earthEntry]);
  }

  const state: SaveStateV2 = {
    ...input.current,
    EPOCH_BASE: input.epoch,
    stats: {
      ...imported.state.stats,
      /* The checkpoint stores a count but not the identities. The retained
         surrounding survey ledger remains authority for this derived count. */
      surveys: input.current.surveyedSet.length,
      /* First-arrival identity lives in the surrounding system ledger, which
         Training never snapshots and must not replace with a free counter. */
      arrivals: input.current.sysSeen.length,
    },
    pstats: imported.state.pstats,
    HP_MAX: imported.state.HP_MAX,
    /* A restore is not a heal. Clamp the surrounding live HP to the restored
       Vitality-derived ceiling instead of copying the importer's full-health default. */
    hp: Math.max(1, Math.min(input.current.hp, imported.state.HP_MAX)),
    unlocked: imported.state.unlocked,
    essence: imported.state.essence,
    codex: imported.state.codex,
    cargo: imported.state.cargo,
    cgx: imported.state.cgx,
    items: imported.state.items,
    equip: imported.state.equip,
    equipAff: imported.state.equipAff,
    logMap,
    homeId: 'p133',
    savedView: input.completionView,
    tutDone: true,
    tutSnapPending: null,
  };
  return { ok: true, state, earthEntry };
}
