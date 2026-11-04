/* D13 stage 2b: the app-owned companion mission transactions (dispatch, claim, recall).

   The same shape as the Arc 5 Rest and feed transactions: one attempt, no retry, and a publishable ownership state only
   after the postcommit fixed point verifies (the committed Arc 5 ownership equals the successor the derive built, and the
   committed missions carrier holds exactly what the derive wrote). Dispatch is the only one that draws: three
   `companion-mission` SessionRNG values, evaluated inside the transaction and sealed with the mission. Claim and recall are
   deterministic receipts. Every boundary is the committed active-play snapshot, never the device clock. */
import { SCENE_OWNERSHIP_ADDRESS_RESOLVER, isOwnershipStateV2, ownershipStateDigestV2, type OwnershipStateV2 } from '@cf/domain-acquisition';
import type { CompanionMissionLengthV1, CompanionMissionTypeV1 } from '@cf/domain-acquisition/missions-internal';
import {
  ARC5_MISSION_CLAIM_OPERATION_V1,
  ARC5_MISSION_CLAIM_RECEIPT_KIND_V1,
  ARC5_MISSION_DISPATCH_DOMAINS_V1,
  ARC5_MISSION_DISPATCH_RECEIPT_KIND_V1,
  ARC5_MISSION_RECALL_OPERATION_V1,
  ARC5_MISSION_RECALL_RECEIPT_KIND_V1,
  deriveArc5MissionClaimV1,
  deriveArc5MissionDispatchV1,
  deriveArc5MissionRecallV1,
  readArc5MissionsV1,
  readArc5OwnershipMigration,
  type Arc5MissionLogRowV1,
  type Arc5MissionRecordV1,
  type SaveStateV2,
} from '@cf/persistence';
import type { F4RuntimeAuthority } from './f4-runtime-authority.js';
import { cloneFeedPlainData } from './arc5-feed-action.js';

export type Arc5MissionActionOutcomeV1<T> =
  | Readonly<{ kind: 'committed'; value: T; ownershipV2: OwnershipStateV2; state: SaveStateV2; revision: number; receiptOrdinal: number }>
  | Readonly<{ kind: 'committed-convergence'; detail: string; revision: number }>
  | Readonly<{ kind: 'refused'; detail: string; convergence: 'none' | 'read-only-reload' }>;

const refusedInput = Object.freeze({ kind: 'refused', detail: 'input:invalid-or-unregistered', convergence: 'none' } as const);
function detached(state: SaveStateV2): SaveStateV2 | null {
  try { return cloneFeedPlainData(state, new Set<object>(), { count: 0 }, 0) as SaveStateV2; } catch { return null; }
}
/** A derive's own refusal keeps its reason (`mission dispatch refused slots-full` → `refused:slots-full`). */
function refusal(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  const m = /^mission (?:dispatch|claim|recall) refused ([a-z-]+)$/u.exec(text);
  return m ? `refused:${m[1]}` : `transaction:${text}`;
}
function verified(extensionsValue: unknown, successor: OwnershipStateV2): OwnershipStateV2 | null {
  const loaded = readArc5OwnershipMigration(extensionsValue as never, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  return loaded.kind === 'loaded' && ownershipStateDigestV2(loaded.state) === ownershipStateDigestV2(successor) ? loaded.state : null;
}

export async function commitArc5MissionDispatchV1(input: Readonly<{
  runtime: Pick<F4RuntimeAuthority, 'commitOutcomes'>; ownershipV2: OwnershipStateV2; state: SaveStateV2; codecNow: number;
  creatureId: string; type: CompanionMissionTypeV1; length: CompanionMissionLengthV1; worldKey: string;
}>): Promise<Arc5MissionActionOutcomeV1<Arc5MissionRecordV1>> {
  if (!input || typeof input.runtime?.commitOutcomes !== 'function' || !isOwnershipStateV2(input.ownershipV2) || !Number.isFinite(input.codecNow)) return refusedInput;
  const state = detached(input.state); if (state === null) return refusedInput;
  let picked: Readonly<{ mission: Arc5MissionRecordV1; successor: OwnershipStateV2 }> | null = null;
  let transaction: Awaited<ReturnType<F4RuntimeAuthority['commitOutcomes']>>;
  try {
    transaction = await input.runtime.commitOutcomes({ state, domains: ARC5_MISSION_DISPATCH_DOMAINS_V1, receiptKind: ARC5_MISSION_DISPATCH_RECEIPT_KIND_V1, codecNow: input.codecNow,
      derive: ({ draws, receiptOrdinal, activePlayMs, draft, extensions }) => {
        const d = deriveArc5MissionDispatchV1({ draft, extensions, receiptOrdinal, activePlayMs, draws: draws.map((row) => row.value), ownershipV2: input.ownershipV2,
          creatureId: input.creatureId, type: input.type, length: input.length, worldKey: input.worldKey });
        picked = Object.freeze({ mission: d.mission, successor: d.ownershipSuccessor });
        return Object.freeze({ state: d.state, ...(d.extensionWrites ? { extensionWrites: d.extensionWrites } : {}), witness: d.witness });
      } });
  } catch (error) { return Object.freeze({ kind: 'refused', detail: refusal(error), convergence: 'none' }); }
  if (transaction.kind !== 'committed') return Object.freeze({ kind: 'refused', detail: transaction.kind === 'rejected' ? refusal(transaction.message) : `transaction:${transaction.kind}`, convergence: transaction.kind === 'rejected' ? 'none' : 'read-only-reload' });
  const p = picked as Readonly<{ mission: Arc5MissionRecordV1; successor: OwnershipStateV2 }> | null;
  const committed = p === null ? null : verified(transaction.saved.extensions, p.successor);
  const carrier = readArc5MissionsV1(transaction.saved.extensions);
  if (p === null || committed === null || carrier.kind !== 'loaded' || !carrier.state.active.some((m) => m.missionId === p.mission.missionId)
    || transaction.receipt.kind !== ARC5_MISSION_DISPATCH_RECEIPT_KIND_V1) return Object.freeze({ kind: 'committed-convergence', detail: 'committed-mission-dispatch-fixed-point-mismatch', revision: transaction.revision });
  return Object.freeze({ kind: 'committed', value: p.mission, ownershipV2: committed, state: transaction.state, revision: transaction.revision, receiptOrdinal: transaction.receipt.ordinal });
}

async function commitDeterministic(input: Readonly<{
  runtime: Pick<F4RuntimeAuthority, 'commitAction'>; ownershipV2: OwnershipStateV2; state: SaveStateV2; codecNow: number; missionId: string;
}>, operation: string, receiptKind: string, derive: typeof deriveArc5MissionClaimV1): Promise<Arc5MissionActionOutcomeV1<Arc5MissionLogRowV1>> {
  if (!input || typeof input.runtime?.commitAction !== 'function' || !isOwnershipStateV2(input.ownershipV2) || !Number.isFinite(input.codecNow) || typeof input.missionId !== 'string') return refusedInput;
  const state = detached(input.state); if (state === null) return refusedInput;
  let picked: Readonly<{ row: Arc5MissionLogRowV1; successor: OwnershipStateV2 }> | null = null;
  let transaction: Awaited<ReturnType<F4RuntimeAuthority['commitAction']>>;
  try {
    transaction = await input.runtime.commitAction({ state, operation, receiptKind, codecNow: input.codecNow,
      derive: ({ receiptOrdinal, activePlayMs, draft, extensions }) => {
        const d = derive({ draft, extensions, receiptOrdinal, activePlayMs, ownershipV2: input.ownershipV2, missionId: input.missionId });
        picked = Object.freeze({ row: d.row, successor: d.ownershipSuccessor });
        return Object.freeze({ state: d.state, ...(d.extensionWrites ? { extensionWrites: d.extensionWrites } : {}), witness: d.witness });
      } });
  } catch (error) { return Object.freeze({ kind: 'refused', detail: refusal(error), convergence: 'none' }); }
  if (transaction.kind !== 'committed') return Object.freeze({ kind: 'refused', detail: transaction.kind === 'rejected' ? refusal(transaction.message) : `transaction:${transaction.kind}`, convergence: transaction.kind === 'rejected' ? 'none' : 'read-only-reload' });
  const p = picked as Readonly<{ row: Arc5MissionLogRowV1; successor: OwnershipStateV2 }> | null;
  const committed = p === null ? null : verified(transaction.saved.extensions, p.successor);
  const carrier = readArc5MissionsV1(transaction.saved.extensions);
  if (p === null || committed === null || carrier.kind !== 'loaded' || carrier.state.active.some((m) => m.missionId === input.missionId)
    || carrier.state.log[0]?.missionId !== input.missionId || transaction.receipt.kind !== receiptKind) {
    return Object.freeze({ kind: 'committed-convergence', detail: `committed-${operation}-fixed-point-mismatch`, revision: transaction.revision });
  }
  return Object.freeze({ kind: 'committed', value: p.row, ownershipV2: committed, state: transaction.state, revision: transaction.revision, receiptOrdinal: transaction.receipt.ordinal });
}

export function commitArc5MissionClaimV1(input: Parameters<typeof commitDeterministic>[0]): Promise<Arc5MissionActionOutcomeV1<Arc5MissionLogRowV1>> {
  return commitDeterministic(input, ARC5_MISSION_CLAIM_OPERATION_V1, ARC5_MISSION_CLAIM_RECEIPT_KIND_V1, deriveArc5MissionClaimV1);
}
export function commitArc5MissionRecallV1(input: Parameters<typeof commitDeterministic>[0]): Promise<Arc5MissionActionOutcomeV1<Arc5MissionLogRowV1>> {
  return commitDeterministic(input, ARC5_MISSION_RECALL_OPERATION_V1, ARC5_MISSION_RECALL_RECEIPT_KIND_V1, deriveArc5MissionRecallV1);
}
