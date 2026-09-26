/* D13 stage 1c: the app-owned companion Rest transaction.

   The same shape as the Arc 5 feed transaction: one owner-minted Rest successor bound to the generic F4 deterministic
   receipt plan and the compact Arc 5 ownership bridge, one repository attempt, no retry, and a publishable ownership
   state only after the postcommit fixed point verifies. The Rest boundary is the committed active-play snapshot plus
   the duration — never the device clock. */
import { SCENE_OWNERSHIP_ADDRESS_RESOLVER, isOwnershipStateV2, ownershipStateDigestV2, type CreatureInstanceId, type OwnershipStateV2 } from '@cf/domain-acquisition';
import { ARC5_REST_ACTION_KIND_V1, ARC5_REST_RECEIPT_KIND_V1, preflightArc5RestV1, settleArc5RestV1, type Arc5RestRefusalReasonV1, type Arc5RestSettlementV1 } from '@cf/domain-acquisition/rest-internal';
import { committedArc5OwnershipState, prepareArc5OwnershipV2Successor, type PreparedArc5OwnershipMigrationSuccessorV2, type SaveStateV2 } from '@cf/persistence';
import type { F4RuntimeActionCommitOutcome, F4RuntimeAuthority } from './f4-runtime-authority.js';
import { cloneFeedPlainData } from './arc5-feed-action.js';

export interface Arc5RestActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly creatureId: CreatureInstanceId;
  readonly codecNow: number;
  /** The current active-play clock (the preflight's availability check). The boundary uses the committed snapshot. */
  readonly activePlayMs: number;
}

type Committed = Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
export type Arc5RestActionOutcomeV1 =
  | Readonly<{ kind: 'committed'; settlement: Arc5RestSettlementV1; ownershipV2: OwnershipStateV2; transaction: Committed }>
  | Readonly<{ kind: 'committed-convergence'; detail: string; transaction: Committed }>
  | Readonly<{ kind: 'refused'; detail: `preflight:${Arc5RestRefusalReasonV1}` | `transaction:${string}` | 'input:invalid-or-unregistered'; convergence: 'none' | 'read-only-reload' }>;

const sameJson = (a: unknown, b: unknown): boolean => { try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; } };
type Selected = Readonly<{ settlement: Arc5RestSettlementV1; prepared: PreparedArc5OwnershipMigrationSuccessorV2 }>;

export async function commitArc5RestActionV1(input: Arc5RestActionInputV1): Promise<Arc5RestActionOutcomeV1> {
  let state: SaveStateV2;
  try {
    if (!input || typeof input.runtime?.commitAction !== 'function' || !isOwnershipStateV2(input.ownershipV2)
      || typeof input.codecNow !== 'number' || !Number.isFinite(input.codecNow) || !Number.isSafeInteger(input.activePlayMs) || input.activePlayMs < 0) throw new TypeError('rest input');
    state = cloneFeedPlainData(input.state, new Set<object>(), { count: 0 }, 0) as SaveStateV2;
  } catch { return Object.freeze({ kind: 'refused', detail: 'input:invalid-or-unregistered', convergence: 'none' }); }
  const parent = input.ownershipV2, commit = input.runtime.commitAction.bind(input.runtime);
  const preflight = preflightArc5RestV1(parent, { creatureId: input.creatureId }, input.activePlayMs);
  if (preflight.kind !== 'ready') return Object.freeze({ kind: 'refused', detail: `preflight:${preflight.reason}`, convergence: preflight.reason === 'ownership-revision-exhausted' ? 'read-only-reload' : 'none' });
  let selected: Selected | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await commit({
      state, operation: ARC5_REST_ACTION_KIND_V1, receiptKind: ARC5_REST_RECEIPT_KIND_V1, codecNow: input.codecNow,
      derive: ({ receiptOrdinal, draft, extensions, activePlayMs }) => {
        const settlement = settleArc5RestV1(preflight.preflight, receiptOrdinal, activePlayMs);
        const prepared = prepareArc5OwnershipV2Successor({ baseExtensions: extensions, parent, successor: settlement.successor, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
        if (prepared.kind !== 'prepared') throw new Error(`Arc 5 rest ownership carrier refused ${prepared.reason}`);
        selected = Object.freeze({ settlement, prepared });
        return Object.freeze({ state: draft, extensionWrites: prepared.writes, witness: settlement.witness });
      },
    });
  } catch (error) { return Object.freeze({ kind: 'refused', detail: `transaction:${error instanceof Error ? error.message : String(error)}`, convergence: 'read-only-reload' }); }
  if (transaction.kind !== 'committed') return Object.freeze({ kind: 'refused', detail: `transaction:${transaction.kind}`, convergence: transaction.kind === 'rejected' ? 'none' : 'read-only-reload' });
  const picked = selected as Selected | null;
  if (picked === null) return Object.freeze({ kind: 'committed-convergence', detail: 'committed-rest-evidence-missing', transaction });
  const committed = committedArc5OwnershipState(picked.prepared, transaction.saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (committed === null || transaction.plan.operation !== ARC5_REST_ACTION_KIND_V1 || transaction.receipt.kind !== ARC5_REST_RECEIPT_KIND_V1
    || transaction.receipt.ordinal !== picked.settlement.receiptEvidence.ordinal || transaction.receipt.witness !== picked.settlement.witness
    || !sameJson(transaction.state, transaction.saved.canonicalState) || ownershipStateDigestV2(committed.state) !== ownershipStateDigestV2(picked.settlement.successor)) {
    return Object.freeze({ kind: 'committed-convergence', detail: 'committed-rest-fixed-point-mismatch', transaction });
  }
  return Object.freeze({ kind: 'committed', settlement: picked.settlement, ownershipV2: committed.state, transaction });
}
