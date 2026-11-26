/* One press of Tame, Scavenge or Sample, committed: the attempt spent, and on a hit the species' page, in one
   receipt of two draws, or nothing at all.

   LEGACY celestial-frontier.html, v1.8.9:
   - the buttons stand only on a grounded world (Earth, landed on or conquered: 13798) whose roster the biosphere
     scan has opened (13734, 13946-13983), and no lesson of training lets one be pressed (14236-14243);
   - the pool is the kind's species the Compendium does not hold; an empty pool says so and spends nothing, then a
     spent world says so and spends nothing (`tryCapture` 14866-14872);
   - the species is picked first, then the roll is made (14873, 14878); every attempt spends one of the world's
     Yield, hit or miss (14875); a hit puts the species in the Compendium (14879, `discoverSpecies` 14924-14946,
     `_storeSpecies` 14771-14800);
   - a first-ever species of tier 5 or more pays its tier less 3 in Stardust, counted as earned (14936-14939);
   - a new page looks at every achievement and the rank (`onSpeciesStored` 16474-16480).
   The odds, the pool and the Yield are `@cf/domain-acquisition`'s rules; the Yield refills by 1,200,000 ms of
   active play where the legacy game counted its epoch from the page's load (the plan's named change).

   The shape is the landing's: gates before storage, then one receipt whose two draws (pick, then success) decide
   the outcome on the receipt's own draft. The painted port (`arc4-capture-action.ts`, `arc4-capture-capacity.ts`)
   prepared every possible outcome as a whole save before the draws and proved the stored bytes three times over;
   none of that is carried. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  capturePresentationFenceV1,
  planCaptureV1,
  preflightCaptureV1,
  type AcquisitionSnapshotV1,
  type AcquisitionVerbV1,
  type CaptureAttemptPlanV1,
} from '@cf/domain-acquisition';
import { registerCaptureDrawBundleV1 } from '@cf/domain-acquisition/snapshot-internal';
import { classifyRealm, describeSpecies, sapienceTier, type Genome } from '@cf/domain-genome';
import { isCanonicalEarthWorldAddress } from '@cf/domain-opportunity';
import { DOMAINS, planSessionRNGDraws } from '@cf/domain-sessionrng';
import {
  prepareArc4OwnershipWrite,
  prepareArc9ProgressionRefreshV1,
  projectLegacyOwnershipMirror,
  readF4Authority,
  readWorldIdentity,
  worldIdentityRecord,
  type CodexEntry,
  type F4MultiOutcomeDeriveInput,
  type F4MultiOutcomeTransactionOutcome,
  type F4OutcomeDerivation,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import type { CanonicalCF1WorldAddress } from '@cf/scene';
import { captureSnapshotV1, type CaptureRosterSource, type CaptureWorldRoster } from './snapshot';

export const CAPTURE_RECEIPT_KIND_V1 = 'arc4-capture' as const;
export const CAPTURE_DOMAINS_V1 = Object.freeze([DOMAINS.captureCandidate, DOMAINS.captureSuccess] as const);
/** The tier from which a first-ever species pays Stardust, and what is taken off the tier. */
export const RARE_FIND_TIER_MIN = 5;
export const RARE_FIND_TIER_LESS = 3;
/** The Stardust a newly catalogued species pays: its tier less 3 from tier 5, nothing below (14936-14939). */
export function rareFindStardustV1(tier: number, firstForSpecies: boolean): number {
  return firstForSpecies && tier >= RARE_FIND_TIER_MIN ? tier - RARE_FIND_TIER_LESS : 0;
}
/** The name the save loop and the bus know a press by: `capture.tame`, `capture.scavenge`, `capture.sample`. */
export const captureActionName = (verb: AcquisitionVerbV1): string => `capture.${verb}`;

/** Why a press may not be made at all, in the legacy game's order. */
export type CaptureGateV1 = 'training' | 'not-landed' | 'not-scanned';

/** The gate a press on this world meets first, or null when it may be made. */
export function captureGateV1(state: SaveStateV2, extensions: V5Extensions, address: CanonicalCF1WorldAddress): CaptureGateV1 | null {
  if (!state.tutDone) return 'training';
  const seed = address.planet.seed;
  const identity = readWorldIdentity(extensions);
  const landed = identity.kind === 'loaded' && (worldIdentityRecord(identity.state, address)?.landed === true
    || identity.state.unresolved.some((row) => row.seed === seed && row.landed));
  const grounded = isCanonicalEarthWorldAddress(address) || landed || state.conquered.some(([world]) => Number(world) === seed);
  if (!grounded) return 'not-landed';
  return state.surveyedSet.some((world) => Number(world) === seed) ? null : 'not-scanned';
}

/** What the card showed, to hold a press to: the pool, the odds and the attempts of this snapshot. */
export function captureFenceV1(snapshot: AcquisitionSnapshotV1): string | null {
  return capturePresentationFenceV1(snapshot, { observedActivePlayMs: snapshot.activePlayMs });
}

/** What the save runtime's two-draw path answers; the stored state rides on a committed outcome. */
export type CaptureTransactionV1 =
  | Exclude<F4MultiOutcomeTransactionOutcome, { readonly kind: 'committed' }>
  | (Extract<F4MultiOutcomeTransactionOutcome, { readonly kind: 'committed' }> & { readonly state: SaveStateV2 })
  | { readonly kind: 'lease-unavailable' };
type Committed = Extract<CaptureTransactionV1, { readonly kind: 'committed' }>;
/** The one path of the save runtime a press needs, the extensions it holds and its clock of active play. */
export interface CaptureAuthorityV1 {
  readonly extensions: V5Extensions;
  activePlayMs(): number;
  commitMultiOutcome(input: {
    readonly state: SaveStateV2; readonly domains: readonly string[]; readonly receiptKind: string; readonly codecNow: number;
    readonly derive: (input: F4MultiOutcomeDeriveInput) => F4OutcomeDerivation;
  }): Promise<CaptureTransactionV1>;
}

export interface CaptureFactsV1 {
  readonly verb: AcquisitionVerbV1;
  readonly worldKey: string;
  readonly hit: boolean;
  /** The species picked: its place in the world's roster, its Compendium id, its name, its tier and its odds. */
  readonly sourceOrdinal: number;
  readonly speciesId: string;
  readonly name: string;
  readonly tier: number;
  readonly chance: number;
  /** Attempts left on this world after this one. */
  readonly left: number;
  /** Stardust a rare first find paid; 0 otherwise. */
  readonly stardust: number;
  /** The Stardust held after the press. */
  readonly essence: number;
  readonly achievementIds: readonly string[];
}

export type CaptureActionOutcomeV1 =
  | Readonly<{ kind: 'committed'; state: SaveStateV2; facts: CaptureFactsV1; transaction: Committed }>
  /** Stored, but what was stored is not what this press staged: the page should stop writing and reload. */
  | Readonly<{ kind: 'committed-convergence'; detail: string; transaction: Committed }>
  /** Nothing was written and no attempt was spent. `transaction` is storage's own answer when the press got that far. */
  | Readonly<{ kind: 'refused'; detail: string; transaction: Exclude<CaptureTransactionV1, { readonly kind: 'committed' }> | null }>;

export interface CaptureActionInputV1 {
  readonly runtime: CaptureAuthorityV1;
  /** The last stored state. */
  readonly state: SaveStateV2;
  readonly address: CanonicalCF1WorldAddress;
  readonly verb: AcquisitionVerbV1;
  /** The fence of the card the player pressed on (`captureFenceV1`). */
  readonly shown: string;
  readonly codecNow: number;
  readonly rosterFor: CaptureRosterSource;
}

class CaptureRefusal extends Error {
  constructor(readonly detail: string) { super(detail); }
}

interface Ready { readonly snapshot: AcquisitionSnapshotV1; readonly roster: CaptureWorldRoster; readonly preflight: Extract<ReturnType<typeof preflightCaptureV1>, { readonly kind: 'ready' }> }

/** Everything a press must pass before a value is drawn. Raises a `CaptureRefusal` naming the first thing in its way. */
function ready(input: CaptureActionInputV1, state: SaveStateV2, extensions: V5Extensions, activePlayMs: number): Ready {
  const gate = captureGateV1(state, extensions, input.address);
  if (gate !== null) throw new CaptureRefusal(gate);
  const composed = captureSnapshotV1({ address: input.address, epoch: state.EPOCH_BASE, activePlayMs, extensions, rosterFor: input.rosterFor });
  if (composed.kind !== 'ready') throw new CaptureRefusal(composed.reason);
  if (captureFenceV1(composed.snapshot) !== input.shown) throw new CaptureRefusal('presentation:changed');
  const preflight = preflightCaptureV1(composed.snapshot, input.verb);
  if (preflight.kind !== 'ready') throw new CaptureRefusal(preflight.reason);
  return { snapshot: composed.snapshot, roster: composed.roster, preflight };
}

/** The Compendium's own row for a species, as the save's reader makes it. */
function codexEntry(id: string, g: Record<string, unknown>, from: string, where: Record<string, unknown> | null, tier: number, name: string): CodexEntry {
  const genome = g as unknown as Genome;
  return {
    id, name, kind: describeSpecies(genome).kind, tier, realm: classifyRealm(genome), sapient: sapienceTier(genome),
    from, hybrid: false, g, where,
  };
}

interface Staged { readonly plan: CaptureAttemptPlanV1; readonly facts: CaptureFactsV1; readonly essence: number }

function stage(input: CaptureActionInputV1, receipt: F4MultiOutcomeDeriveInput): { derivation: F4OutcomeDerivation; staged: Staged } {
  const { draft, extensions, activePlayMs } = receipt;
  const { snapshot, roster, preflight } = ready(input, draft, extensions, activePlayMs);
  const authority = readF4Authority(extensions);
  if (authority.kind !== 'loaded') throw new CaptureRefusal(`session:${authority.kind}`);
  const sessionPlan = planSessionRNGDraws(authority.authority.sessionRng, CAPTURE_DOMAINS_V1);
  // The two values are the receipt's own, pick then success.
  if (sessionPlan.receiptOrdinal !== receipt.receiptOrdinal || receipt.draws.length !== 2
    || receipt.draws.some((draw, index) => draw.domain !== CAPTURE_DOMAINS_V1[index] || draw.value !== sessionPlan.draws[index]!.value)) {
    throw new CaptureRefusal('draws:not-the-receipts');
  }
  const bundle = registerCaptureDrawBundleV1({
    snapshot,
    plan: {
      draws: sessionPlan.draws.map(({ domain, value }) => ({ domain, value })),
      receiptOrdinal: sessionPlan.receiptOrdinal,
      currentAuthority: { activePlayMs, sessionRng: authority.authority.sessionRng },
      nextSessionRng: sessionPlan.nextState,
      sessionPlan,
    },
  });
  const planned = planCaptureV1(preflight, bundle);
  if (planned.kind !== 'planned') throw new CaptureRefusal(`plan:${planned.reason}`);
  const { plan } = planned;
  const write = prepareArc4OwnershipWrite({ extensions, state: plan.successor, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (write.kind !== 'prepared') throw new CaptureRefusal(`ownership:${write.reason}`);
  const mirror = projectLegacyOwnershipMirror(plan.successor);
  if (mirror.kind !== 'projected') throw new CaptureRefusal(`ownership:${mirror.kind}`);

  const row = roster.view.all[plan.candidate.sourceOrdinal] as { _earthName?: unknown } | undefined;
  const genome = plan.candidate.identity.genome as unknown as Genome;
  // An Earth species keeps its Earth name (14874).
  const name = typeof row?._earthName === 'string' && row._earthName.length > 0 ? row._earthName : describeSpecies(genome).name;
  const unlockedBefore = new Set(draft.unlocked);
  let stardust = 0;
  draft.bioX = mirror.bioX.map(([seed, [used, stamp]]) => [seed, [used, stamp]]);
  if (plan.hit) {
    const held = new Map(draft.codex);
    draft.codex = mirror.codex.map((entry) => [entry.legacyCodexId, held.get(entry.legacyCodexId)
      ?? codexEntry(entry.legacyCodexId, entry.g as Record<string, unknown>, entry.f, entry.w as Record<string, unknown> | null, plan.tier, name)]);
    stardust = rareFindStardustV1(plan.tier, plan.firstForSpecies);
    if (stardust > 0) {
      draft.essence += stardust;
      draft.stats = { ...draft.stats, essenceEarned: (draft.stats.essenceEarned ?? 0) + stardust };
    }
    const refresh = prepareArc9ProgressionRefreshV1(draft);
    if (refresh.kind === 'protected') throw new CaptureRefusal(`progression:${refresh.reason}`);
    if (refresh.kind === 'ready') {
      draft.unlocked = [...refresh.successorState.unlocked];
      draft.stats = { ...refresh.successorState.stats };
    }
  }
  const facts: CaptureFactsV1 = Object.freeze({
    verb: input.verb, worldKey: input.address.key, hit: plan.hit,
    sourceOrdinal: plan.candidate.sourceOrdinal, speciesId: plan.candidate.legacyCatalogueId, name,
    tier: plan.tier, chance: plan.chance, left: plan.remainingAfter, stardust, essence: draft.essence,
    achievementIds: Object.freeze(draft.unlocked.filter((id) => !unlockedBefore.has(id))),
  });
  return {
    derivation: { state: draft, extensionWrites: write.writes, witness: plan.witness },
    staged: { plan, facts, essence: draft.essence },
  };
}

/** Commits one press. Everything is decided on the receipt's own draft; the caller's state is not touched. */
export async function commitCaptureV1(input: CaptureActionInputV1): Promise<CaptureActionOutcomeV1> {
  const refused = (detail: string, transaction: Exclude<CaptureTransactionV1, { readonly kind: 'committed' }> | null = null): CaptureActionOutcomeV1 =>
    Object.freeze({ kind: 'refused', detail, transaction });
  const detailOf = (error: unknown): string => error instanceof CaptureRefusal ? error.detail : `staging:${error instanceof Error ? error.message : String(error)}`;
  try {
    ready(input, input.state, input.runtime.extensions, input.runtime.activePlayMs());
  } catch (error) {
    return refused(detailOf(error));
  }
  let staged: Staged | null = null;
  let ownRefusal: string | null = null;
  const transaction = await input.runtime.commitMultiOutcome({
    state: input.state, domains: CAPTURE_DOMAINS_V1, receiptKind: CAPTURE_RECEIPT_KIND_V1, codecNow: input.codecNow,
    derive: (receipt) => {
      try {
        const result = stage(input, receipt);
        staged = result.staged;
        return result.derivation;
      } catch (error) {
        ownRefusal = detailOf(error);
        throw error;
      }
    },
  });
  if (transaction.kind !== 'committed') return refused(ownRefusal ?? transaction.kind, transaction);
  const done = staged as Staged | null;
  if (done === null) return Object.freeze({ kind: 'committed-convergence', detail: 'missing-plan', transaction });
  const { state } = transaction;
  const seed = input.address.planet.seed;
  const used = state.bioX.find(([world]) => world === seed)?.[1][0];
  const mismatch = transaction.receipt.kind !== CAPTURE_RECEIPT_KIND_V1 || transaction.receipt.witness !== done.plan.witness
    || transaction.receipt.ordinal !== done.plan.receiptOrdinal ? 'receipt'
    : JSON.stringify(state) !== JSON.stringify(transaction.saved.canonicalState) ? 'state-not-stored'
      : used !== done.plan.successor.biosphereProgress.find((row) => row.worldKey === input.address.key)?.used ? 'yield'
        : state.codex.some(([id]) => id === done.facts.speciesId) !== (done.plan.hit || input.state.codex.some(([id]) => id === done.facts.speciesId)) ? 'compendium'
          : state.essence !== done.essence ? 'stardust'
            : done.facts.achievementIds.some((id) => !state.unlocked.includes(id)) ? 'achievements' : null;
  if (mismatch !== null) return Object.freeze({ kind: 'committed-convergence', detail: `postcommit:${mismatch}`, transaction });
  return Object.freeze({ kind: 'committed', state, facts: done.facts, transaction });
}

/** The save loop's door for a product action, as far as a press uses it. */
export interface CaptureDoorV1 {
  settle(
    kind: string,
    commit: (runtime: CaptureAuthorityV1, durable: SaveStateV2) => Promise<CaptureTransactionV1 | { readonly kind: 'declined'; readonly reason: string }>,
  ): Promise<CaptureTransactionV1 | { readonly kind: 'declined'; readonly reason: string } | { readonly kind: 'refused'; readonly reason: string }>;
}

/** One press as the page makes it: one product action at a time, never under a write hold, from the last stored
    state. A committed press is in the live state, and said on the bus, when this resolves. */
export async function settleCaptureV1(
  door: CaptureDoorV1,
  input: Omit<CaptureActionInputV1, 'runtime' | 'state'>,
): Promise<CaptureActionOutcomeV1> {
  let own: CaptureActionOutcomeV1 | null = null;
  const answer = await door.settle(captureActionName(input.verb), async (runtime, durable) => {
    const outcome = await commitCaptureV1({ ...input, runtime, state: durable });
    own = outcome;
    return outcome.kind !== 'refused' ? outcome.transaction : outcome.transaction ?? { kind: 'declined', reason: outcome.detail };
  });
  return own ?? Object.freeze({ kind: 'refused', detail: answer.kind === 'refused' ? answer.reason : answer.kind, transaction: null });
}
