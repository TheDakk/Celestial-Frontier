/* Outposts P3 (app side) — plan → one F4 receipt → exact read-back (D14). Main owns the guards, the write barrier and publication;
   this module owns the action and the words for its result. The persistence derive (`deriveOutpostActionV1`) re-reads every fact. */
import {
  OUTPOST_OPERATION_V1,
  deriveOutpostActionV1,
  outpostDefinitionV1,
  outpostRefusalTextV1,
  readOutpostProjectsV1,
  type OutpostProjectsStateV1,
  type OutpostRequestV1,
  type OutpostStartRefusalV1,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import type { F4RuntimeActionCommitOutcome, F4RuntimeAuthority } from './f4-runtime-authority.js';

export type OutpostActionOutcomeV1 =
  | Readonly<{ kind: 'committed'; request: OutpostRequestV1; state: SaveStateV2; extensions: V5Extensions; projects: OutpostProjectsStateV1; revision: number; witness: string }>
  | Readonly<{ kind: 'refused'; detail: string; convergence: 'none' | 'read-only-reload' }>;

export async function commitOutpostActionV1(input: Readonly<{
  runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  state: SaveStateV2;
  request: OutpostRequestV1;
  codecNow: number;
}>): Promise<OutpostActionOutcomeV1> {
  const refused = (detail: string, convergence: 'none' | 'read-only-reload' = 'none'): OutpostActionOutcomeV1 => Object.freeze({ kind: 'refused', detail, convergence });
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await input.runtime.commitAction({
      state: input.state, operation: OUTPOST_OPERATION_V1, receiptKind: OUTPOST_OPERATION_V1, codecNow: input.codecNow,
      derive: ({ draft, extensions, receiptOrdinal, activePlayMs }) => deriveOutpostActionV1({ draft, extensions, receiptOrdinal, activePlayMs, request: input.request }),
    });
  } catch (error) {
    return refused(`transaction:threw:${error instanceof Error ? error.message : String(error)}`, 'read-only-reload');
  }
  if (transaction.kind !== 'committed') {
    const reload = transaction.kind === 'stale' || transaction.kind === 'lost' || transaction.kind === 'duplicate-receipt'
      || transaction.kind === 'revision-exhausted' || transaction.kind === 'storage-error' || transaction.kind === 'protected';
    return refused(transaction.kind === 'rejected' ? `rejected:${transaction.message}` : `transaction:${transaction.kind}`, reload ? 'read-only-reload' : 'none');
  }
  // exact read-back: the committed carrier must parse, and the site the request named must be where the action put it
  const read = readOutpostProjectsV1(transaction.saved.extensions);
  if (read.kind !== 'loaded') return refused(`verification:carrier-${read.reason}`, 'read-only-reload');
  const id = input.request.kind === 'start' ? `${input.request.outpost}@${input.request.context.world.planetSeed >>> 0}` : input.request.siteId;
  const present = read.state.sites.some((s) => s.id === id);
  if (present === (input.request.kind === 'abandon')) return refused('verification:site-mismatch', 'read-only-reload');
  return Object.freeze({ kind: 'committed', request: input.request, state: transaction.state, extensions: transaction.saved.extensions,
    projects: read.state, revision: transaction.revision, witness: transaction.receipt.witness });
}

const partName: Readonly<Record<string, string>> = Object.freeze({ frame: 'Steel Frame', plate: 'Iron Plate', navcore: 'Nav Core', lens: 'Optic Lens',
  coil: 'Drive Coil', cell: 'Power Cell', hullseg: 'Hull Segment', cryocap: 'Cryo Capsule', servo: 'Servo Rig', fuelcell: 'Fuel Cell', weave: 'Carbon Weave', cryogel: 'Cryo Gel' });
export const outpostPartNameV1 = (id: string): string => partName[id] ?? id;

/** Plain words for a refused derive (`outposts refused: <reason>` inside the transaction's rejection message). */
export function outpostRefusalCopyV1(detail: string): string {
  const reason = /outposts refused: ([a-z-]+)/.exec(detail)?.[1] ?? '';
  const stage: Record<string, string> = { 'missing-items': 'Some parts are missing for this stage.', 'missing-stardust': 'Not enough Stardust for this stage.',
    'deed-unmet': 'This stage\'s deed is not done yet.', finished: 'This outpost is already finished.', 'no-site': 'That outpost no longer exists.' };
  if (stage[reason]) return stage[reason]!;
  try { return outpostRefusalTextV1(reason as OutpostStartRefusalV1) ?? 'The outpost could not be changed.'; } catch { return 'The outpost could not be changed.'; }
}

export function outpostResultCopyV1(outcome: Extract<OutpostActionOutcomeV1, { kind: 'committed' }>): Readonly<{ title: string; detail: string }> {
  const r = outcome.request;
  if (r.kind === 'abandon') return Object.freeze({ title: 'Outpost abandoned', detail: 'Every built stage was refunded in full.' });
  if (r.kind === 'residents') return Object.freeze({ title: 'Sanctuary updated', detail: 'Your chosen companions now appear here.' });
  const id = r.kind === 'start' ? `${r.outpost}@${r.context.world.planetSeed >>> 0}` : r.siteId;
  const site = outcome.projects.sites.find((s) => s.id === id)!;
  const def = outpostDefinitionV1(site.kind);
  if (r.kind === 'start') return Object.freeze({ title: `${def.icon} ${def.name} site opened`, detail: `On ${site.world.name}. Stage 1 of 3 is ready to build.` });
  return site.built >= 3
    ? Object.freeze({ title: `${def.icon} ${def.name} finished`, detail: def.reward })
    : Object.freeze({ title: `${def.icon} ${def.name}: stage ${site.built} built`, detail: `Stage ${site.built + 1} of 3 is open.` });
}
