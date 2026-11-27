/* One press of Land, committed: the descent and everything it leads to in one receipt, or nothing at all.

   LEGACY celestial-frontier.html, v1.8.9: the press lands at once on Earth, in training and on a world already
   landed on, and otherwise rolls the descent first (`flyDown` 13664-13679, `descentSafe` 13435-13437); the roll
   asks the weather of that moment (`_descRoll` 13439, `descentFor` 13428-13430); a failed roll is a wave-off and
   ends the press (13669); a landing runs the rites (`_performLanding` 13465-13498).

   Here the unrolled descent is an action receipt (no random value) and the rolled one a receipt of two draws,
   success then damage, from the session's own streams. Either way the state, the carriers and the receipt are one
   revision. The storm is the scene's, at the receipt's own active play (`descentStormActive`: the deep-winter
   repair, a named improvement). The Reinforced Hull is the state's research (13451).

   Ported from the painted port's `commitArc0LandingAction` (`arc0-landing-action.ts` 1532-1727). It certified
   every possible outcome before the draws; here the two draws are taken by the receipt and the outcome derived
   from them, which stores the same thing with one staging. What a landing writes is in `landing-mirror.ts`; what
   its receipt says, and the check after storage, in `landing-receipt.ts`. */
import { sha256Hex } from '@cf/domain-acquisition';
import { projectWorldOpportunity, type FieldSampleLandingAuthority, type WorldOpportunityRules, type WorldOpportunitySnapshot } from '@cf/domain-opportunity';
import {
  arc2LootLegacyMirrorMatches,
  loadDescentWaveOffAuthorityV1,
  readArc2EngineeringLoadout,
  readArc2Loot,
  readWorldIdentity,
  worldIdentityRecord,
  type F4DeterministicProductDeriveInput,
  type F4MultiOutcomeDeriveInput,
  type F4OutcomeDerivation,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import type { CanonicalCF1WorldAddress } from '@cf/scene';
import type { Bus } from '../bus';
import type { GameEvents } from '../events';
import { DESCENT_OUTCOME_DOMAINS_V1, projectDescentApproachV1, resolveDescentAttemptV1, type DescentOutcomeDrawV1 } from './descent-policy';
import { descentStormActive, type WeatherRules } from './descent-weather';
import { LandingRefusal, stageLanded, stageWaveOff, type LandingCharterStagerV1, type LandingStageInputV1 } from './landing-mirror';
import {
  LANDING_RECEIPT_KIND_V1,
  landingWitness,
  verifyLandingPostcommit,
  type LandingCommittedV1,
  type LandingFactsV1,
  type LandingMismatchV1,
  type LandingTransactionV1,
  type StagedLandingV1,
} from './landing-receipt';
import type { LandingViews } from './region';

/** The name the save loop and the bus know this action by. */
export const LANDING_ACTION = 'landing' as const;
/** The Reinforced Hull research. */
const REINFORCED_HULL = 'hull1';

/** The two paths of the save runtime a landing needs, and the extensions it holds. */
export interface LandingAuthorityV1 {
  readonly extensions: V5Extensions;
  commitAction(input: {
    readonly state: SaveStateV2; readonly operation: string; readonly receiptKind: string; readonly codecNow: number;
    readonly derive: (input: F4DeterministicProductDeriveInput) => F4OutcomeDerivation;
  }): Promise<LandingTransactionV1>;
  commitMultiOutcome(input: {
    readonly state: SaveStateV2; readonly domains: readonly string[]; readonly receiptKind: string; readonly codecNow: number;
    readonly derive: (input: F4MultiOutcomeDeriveInput) => F4OutcomeDerivation;
  }): Promise<LandingTransactionV1>;
}

export interface LandingActionInputV1 {
  readonly runtime: LandingAuthorityV1;
  /** The last stored state. */
  readonly state: SaveStateV2;
  readonly address: CanonicalCF1WorldAddress;
  /** The name the world is shown by; the journal keeps it. */
  readonly worldName: string;
  /** The session's count of landing views if this press lands: the views composed so far, and one. */
  readonly view: number;
  readonly codecNow: number;
  /** The guidance system's staging of a deed against the accepted Charters. */
  readonly charters: LandingCharterStagerV1;
  /** The world system's rules for a world. */
  readonly rules: LandingWorldRulesV1;
}

/** The rules a world plays by, as the world system gives them (`worldRulesAt`): a new world type's, or null for the
    legacy rules. */
export type LandingWorldRulesV1 = (address: CanonicalCF1WorldAddress) => (WorldOpportunityRules & WeatherRules) | null;

export type LandingActionOutcomeV1 =
  | Readonly<{ kind: 'committed'; state: SaveStateV2; facts: LandingFactsV1; transaction: LandingCommittedV1 }>
  /** Stored, but what was stored is not what this landing staged: the page should stop writing and reload. */
  | Readonly<{ kind: 'committed-convergence'; detail: `postcommit:${LandingMismatchV1}` | 'missing-plan'; result: 'landed' | 'wave-off' | 'unknown'; transaction: LandingCommittedV1 }>
  /** Nothing was written. `transaction` is storage's own answer when the press got that far. */
  | Readonly<{ kind: 'refused'; detail: string; transaction: Exclude<LandingTransactionV1, { readonly kind: 'committed' }> | null }>;

export function operationForLandingV1(address: CanonicalCF1WorldAddress): string {
  return `arc0.land:${sha256Hex(address.key)}`;
}

interface Approach {
  readonly opportunity: WorldOpportunitySnapshot;
  readonly stage: Omit<LandingStageInputV1, 'draft' | 'extensions' | 'receiptOrdinal' | 'activePlayMs' | 'address' | 'worldName' | 'view' | 'codecNow' | 'charters' | 'opportunity'>;
}

/** The carriers a descent reads, and the approach they give at this moment of active play. Raises a
    `LandingRefusal` when one of them cannot be read. */
function approach(address: CanonicalCF1WorldAddress, rulesOf: LandingWorldRulesV1, state: SaveStateV2, extensions: V5Extensions, activePlayMs: number): Approach {
  const identity = readWorldIdentity(extensions);
  if (identity.kind !== 'loaded') throw new LandingRefusal(`world-identity:${identity.kind}`);
  const loadout = readArc2EngineeringLoadout(extensions);
  if (loadout.kind !== 'loaded') throw new LandingRefusal(`gear:${loadout.kind}`);
  const loot = readArc2Loot(extensions);
  if (loot.kind !== 'loaded' || !arc2LootLegacyMirrorMatches(loot.state, state)) throw new LandingRefusal('gear:mirror-diverged');
  const waveOffs = loadDescentWaveOffAuthorityV1({ extensions, legacyWaveOffs: state.waveOffs });
  if (waveOffs.kind !== 'loaded') throw new LandingRefusal(`wave-offs:${waveOffs.reason}`);
  // Landed already, exactly or by the seed alone as an imported save holds it (the legacy set is by seed).
  const landing: FieldSampleLandingAuthority = worldIdentityRecord(identity.state, address)?.landed === true ? 'repeat'
    : identity.state.unresolved.some((row) => row.seed === address.planet.seed && row.landed) ? 'unresolved-already-landed' : 'first';
  const rules = rulesOf(address);
  const opportunity = projectWorldOpportunity(address, rules);
  const { planetType, climateBand } = opportunity.source;
  const policy = projectDescentApproachV1({
    address,
    opportunity,
    capabilities: loadout.capabilities,
    waveOffs: waveOffs.state,
    stormActive: descentStormActive({ seed: address.planet.seed, type: planetType }, climateBand, activePlayMs / 1000, rules),
    reinforcedHull: state.techOwned.includes(REINFORCED_HULL),
    trainingActive: !state.tutDone,
    alreadyLanded: landing !== 'first',
  });
  return { opportunity, stage: { identity: identity.state, landing, waveOffs: waveOffs.state, policy } };
}

/** Commits one press of Land. Everything is decided on the receipt's own draft; the caller's state is not touched. */
export async function commitLandingActionV1(input: LandingActionInputV1): Promise<LandingActionOutcomeV1> {
  const { address } = input;
  const refused = (detail: string, transaction: Exclude<LandingTransactionV1, { readonly kind: 'committed' }> | null = null): LandingActionOutcomeV1 =>
    Object.freeze({ kind: 'refused', detail, transaction });
  let rolled: boolean;
  try {
    rolled = approach(address, input.rules, input.state, input.runtime.extensions, 0).stage.policy.safeReason === null;
  } catch (error) {
    return refused(error instanceof LandingRefusal ? error.detail : `input:${error instanceof Error ? error.message : String(error)}`);
  }

  let staged: StagedLandingV1 | null = null;
  let ownRefusal: string | null = null;
  const derive = (
    receipt: { readonly draft: SaveStateV2; readonly extensions: V5Extensions; readonly receiptOrdinal: number; readonly activePlayMs: number },
    draws: readonly DescentOutcomeDrawV1[],
  ): F4OutcomeDerivation => {
    try {
      const { draft, extensions, receiptOrdinal, activePlayMs } = receipt;
      const current = approach(address, input.rules, draft, extensions, activePlayMs);
      if ((current.stage.policy.safeReason === null) !== rolled) throw new LandingRefusal('descent:route-changed');
      const descent = resolveDescentAttemptV1(current.stage.policy, draws, draft.hp);
      const stageInput: LandingStageInputV1 = {
        ...current.stage, opportunity: current.opportunity, address, worldName: input.worldName, view: input.view,
        codecNow: input.codecNow, charters: input.charters, draft, extensions, receiptOrdinal, activePlayMs,
      };
      const result = descent.kind === 'landed' ? stageLanded(stageInput, descent) : stageWaveOff(stageInput, descent);
      staged = result;
      return { state: result.state, extensionWrites: result.extensionWrites, witness: landingWitness(result.facts) };
    } catch (error) {
      ownRefusal = error instanceof LandingRefusal ? error.detail : `staging:${error instanceof Error ? error.message : String(error)}`;
      throw error;
    }
  };

  const base = { state: input.state, receiptKind: LANDING_RECEIPT_KIND_V1, codecNow: input.codecNow };
  const transaction: LandingTransactionV1 = rolled
    ? await input.runtime.commitMultiOutcome({
      ...base, domains: DESCENT_OUTCOME_DOMAINS_V1,
      derive: (receipt) => derive(receipt, receipt.draws.map(({ domain, value }) => ({ domain, value }))),
    })
    : await input.runtime.commitAction({ ...base, operation: operationForLandingV1(address), derive: (receipt) => derive(receipt, []) });

  if (transaction.kind !== 'committed') return refused(ownRefusal ?? transaction.kind, transaction);
  const plan = staged as StagedLandingV1 | null;
  if (plan === null) return Object.freeze({ kind: 'committed-convergence', detail: 'missing-plan', result: 'unknown', transaction });
  const mismatch = verifyLandingPostcommit({ transaction, address, staged: plan });
  if (mismatch !== null) {
    return Object.freeze({ kind: 'committed-convergence', detail: `postcommit:${mismatch}`, result: plan.facts.descent.kind, transaction });
  }
  return Object.freeze({ kind: 'committed', state: transaction.state, facts: plan.facts, transaction });
}

/** The save loop's door for a product action, as far as a landing uses it. */
export interface LandingDoorV1 {
  settle(
    kind: string,
    commit: (runtime: LandingAuthorityV1, durable: SaveStateV2) => Promise<LandingTransactionV1 | { readonly kind: 'declined'; readonly reason: string }>,
  ): Promise<LandingTransactionV1 | { readonly kind: 'declined'; readonly reason: string } | { readonly kind: 'refused'; readonly reason: string }>;
}

export interface LandingSettleDepsV1 {
  readonly door: LandingDoorV1;
  readonly bus: Bus<GameEvents>;
  /** The session's landing views: a landing composes one. */
  readonly views: LandingViews;
  readonly charters: LandingCharterStagerV1;
  readonly rules: LandingWorldRulesV1;
}

/** One press of Land as the page makes it: one product action at a time, never under a write hold, from the last
    stored state. A committed landing is in the live state when this resolves, the session's view count has
    risen, and `landing:arrived` has been said; a wave-off raises no count and says no arrival. */
export async function settleLandingV1(
  deps: LandingSettleDepsV1,
  input: Pick<LandingActionInputV1, 'address' | 'worldName' | 'codecNow'>,
): Promise<LandingActionOutcomeV1> {
  let own: LandingActionOutcomeV1 | null = null;
  const answer = await deps.door.settle(LANDING_ACTION, async (runtime, durable) => {
    const outcome = await commitLandingActionV1({ ...input, runtime, state: durable, view: deps.views.count + 1, charters: deps.charters, rules: deps.rules });
    own = outcome;
    return outcome.kind !== 'refused' ? outcome.transaction : outcome.transaction ?? { kind: 'declined', reason: outcome.detail };
  });
  const outcome = own as LandingActionOutcomeV1 | null;
  if (outcome === null) return Object.freeze({ kind: 'refused', detail: answer.kind === 'refused' ? answer.reason : answer.kind, transaction: null });
  const landed = outcome.kind === 'committed' ? outcome.facts.landed : null;
  if (outcome.kind === 'committed' && landed !== null) {
    deps.views.next();
    try {
      deps.bus.emit('landing:arrived', {
        address: input.address, regionKey: landed.region.key, route: landed.region.route,
        firstLanding: landed.permanent && outcome.facts.landing === 'first',
      });
    } catch { /* the listener's own fault: the landing is stored */ }
  }
  return outcome;
}
