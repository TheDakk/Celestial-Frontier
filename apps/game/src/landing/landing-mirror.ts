/* What a descent writes: the staging of one resolved landing, or one wave-off, on the receipt's own draft.

   LEGACY celestial-frontier.html, v1.8.9, in the order the legacy game does it:
   - a rolled landing forgets the world's wave-offs: `_descRoll` 13442;
   - the world joins the landed set, unless this is training away from Earth, and only a world joining it is the
     landfall deed: `noteLanding` 13192-13206 (training: 13197; the deed: 13200);
   - the deed moves the accepted Charters and the Ascent, after training only: `gameEvent` 25358-25363,
     `charterEvent` 24907-24918, `ascEvent` 25284-25322 (chapters are completed only when the deed banked
     something: 25310);
   - standing on Earth unlocks Homecoming, at every landing there: `_performLanding` 13473;
   - the world joins the stood-on set, after training or on Earth, and the achievements are looked at: 13474;
   - the landing view is composed: its counter rises, the region is rolled from the landings counted so far, and
     the journal takes its line, kept to 24, the name to 28 characters and the region to 16:
     `openLandingVista` 13505-13507, 13558, 13562-13566 (training included: 13476 has no such test);
   - a first landing after training, away from Earth, pays field samples and counts one landing:
     `grantFieldSamples` 13681-13695 (they ride the next card render, 13766, so the region's salt is read
     before them);
   - a wave-off costs its damage, never the last point of health, and is remembered: `_descRoll` 13448-13460.

   Ported from the painted port's `stageSuccessfulLanding` and `stageWaveOff` (`arc0-landing-action.ts`
   869-1164). Differences from it, all the legacy game's: the stood-on set and the journal line are written (the
   painted port wrote neither); a training landing on Earth counts (it wrote only the route); a world landed on
   before moves no Charter (it staged the deed at every landing); a world the save knows as landed by its seed
   alone is not rolled for; the Ascent's chapters are looked at only when the deed banked something. The route is
   not written here: it is the checkpoint's. */
import { descentWaveOffCountV1, isCanonicalEarthWorldAddress, type DescentWaveOffStateV1, type FieldSampleLandingAuthority, type WorldOpportunitySnapshot } from '@cf/domain-opportunity';
import {
  encodeWorldIdentityExtensionWrites,
  prepareArc9EventAchievementJoinV1,
  prepareArc9ProgressionRefreshV1,
  prepareDescentWaveOffMutationV1,
  recordCanonicalWorldLanding,
  worldIdentityRecord,
  type CanonicalWorldIdentityStateV1,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';
import { ascStageOf, bankLandfall, reconcileV2Chapters, type CanonicalCF1WorldAddress } from '@cf/scene';
import type { DescentApproachPolicyV1, DescentAttemptOutcomeV1 } from './descent-policy';
import { deriveFieldSamples } from './field-samples';
import { LANDING_WITNESS_SCHEMA_V1, type LandedFactV1, type LandingDescentFactV1, type StagedLandingV1 } from './landing-receipt';
import { landingRegion } from './region';

/** The journal keeps this many landings, a name of this length and a region key of this one. */
export const JOURNAL_MAX_ROWS = 24;
export const JOURNAL_NAME_MAX = 28;
export const JOURNAL_REGION_MAX = 16;

/** A refusal of the landing's own, raised inside the receipt's derivation: nothing is written. */
export class LandingRefusal extends Error {
  constructor(readonly detail: string) { super(detail); }
}
const refuse = (detail: string): never => { throw new LandingRefusal(detail); };

/** What the guidance system's Charter staging answers, as far as a landing reads it. */
export type LandingCharterStageV1 =
  | Readonly<{ kind: 'refused'; reason: string }>
  | Readonly<{
    kind: 'ready' | 'current';
    facts: Readonly<{
      progressIds: readonly string[];
      completions: ReadonlyArray<Readonly<{ id: string }>>;
      extensionWrites: readonly V5ExtensionWrite[];
    }>;
  }>;
/** Stages the landfall deed on the draft against the Charters accepted: the guidance system's own function. */
export type LandingCharterStagerV1 = (input: {
  draft: SaveStateV2;
  extensions: V5Extensions;
  event: { kind: 'landfall'; address: CanonicalCF1WorldAddress };
  receiptOrdinal: number;
  activePlayMs?: number;
}) => LandingCharterStageV1;

export interface LandingStageInputV1 {
  readonly address: CanonicalCF1WorldAddress;
  readonly opportunity: WorldOpportunitySnapshot;
  /** The name the world is shown by, for the journal. */
  readonly worldName: string;
  /** The session's count of landing views, this one included. */
  readonly view: number;
  readonly codecNow: number;
  readonly charters: LandingCharterStagerV1;
  readonly draft: SaveStateV2;
  readonly extensions: V5Extensions;
  readonly receiptOrdinal: number;
  readonly activePlayMs: number;
  readonly identity: CanonicalWorldIdentityStateV1;
  readonly landing: FieldSampleLandingAuthority;
  readonly waveOffs: DescentWaveOffStateV1;
  readonly policy: DescentApproachPolicyV1;
}

function descentFact(descent: DescentAttemptOutcomeV1): LandingDescentFactV1 {
  return {
    kind: descent.kind,
    safeReason: descent.policy.safeReason,
    stormActive: descent.policy.stormActive,
    successPercent: descent.policy.successPercent,
    draws: descent.drawsConsumed,
    hpBefore: descent.hpBefore,
    hpAfter: descent.hpAfter,
    damage: descent.damage,
    waveOffsBefore: descent.waveOffCountBefore,
    waveOffsAfter: descent.waveOffCountAfter,
    throughTheFire: descent.kind === 'landed' && descent.throughTheFire,
    nextSuccessPercent: descent.kind === 'wave-off' ? descent.nextSuccessPercent : null,
  };
}

/** Writes the world's wave-off count after this outcome into the draft and returns the carrier's rows. */
function stageWaveOffCount(input: LandingStageInputV1, outcome: 'success' | 'failure', expectedAfter: number): readonly V5ExtensionWrite[] {
  const mutation = prepareDescentWaveOffMutationV1({
    extensions: input.extensions, legacyWaveOffs: input.draft.waveOffs, address: input.address, outcome,
  });
  if (mutation.kind !== 'prepared') return refuse(`wave-offs:${mutation.reason}`);
  if (mutation.countAfter !== expectedAfter) return refuse('descent:outcome-impossible');
  input.draft.waveOffs = mutation.legacyWaveOffs.map(([seed, count]) => [seed, count]);
  return mutation.writes;
}

const common = (input: LandingStageInputV1) => ({
  schema: LANDING_WITNESS_SCHEMA_V1,
  receiptOrdinal: input.receiptOrdinal,
  worldKey: input.address.key,
  planetSeed: input.address.planet.seed,
  training: !input.draft.tutDone,
  landing: input.landing,
});

export function stageWaveOff(
  input: LandingStageInputV1,
  descent: Extract<DescentAttemptOutcomeV1, { readonly kind: 'wave-off' }>,
): StagedLandingV1 {
  const { draft } = input;
  if (descent.hpAfter < 1 || descent.hpAfter > descent.hpBefore) return refuse('descent:outcome-impossible');
  const facts = { ...common(input), descent: descentFact(descent), landed: null };
  const extensionWrites = stageWaveOffCount(input, 'failure', descent.waveOffCountAfter);
  draft.hp = descent.hpAfter;
  return {
    state: draft,
    extensionWrites,
    facts,
    expect: {
      hp: descent.hpAfter,
      waveOffCount: descent.waveOffCountAfter,
      identityLanded: worldIdentityRecord(input.identity, input.address)?.landed === true,
      landed: null,
    },
  };
}

export function stageLanded(
  input: LandingStageInputV1,
  descent: Extract<DescentAttemptOutcomeV1, { readonly kind: 'landed' }>,
): StagedLandingV1 {
  const { draft, address, extensions } = input;
  const seed = address.planet.seed;
  const training = !draft.tutDone;
  const earth = isCanonicalEarthWorldAddress(address);
  const permanent = !training || earth;
  const deed = !training && input.landing === 'first';
  const unlockedBefore = new Set(draft.unlocked);
  const writes: V5ExtensionWrite[] = [];

  // A landing that counts forgets the wave-offs; a world with none remembered has nothing to forget.
  let waveOffCount = descentWaveOffCountV1(input.waveOffs, address);
  if (descent.persistenceOutcome === 'success' && waveOffCount > 0) {
    writes.push(...stageWaveOffCount(input, 'success', 0));
    waveOffCount = 0;
  }

  let identity = input.identity;
  if (permanent) {
    const recorded = recordCanonicalWorldLanding(identity, address, extensions);
    if (recorded.capacityProtected) return refuse('world-identity:capacity');
    if (recorded.firstLanding !== (input.landing === 'first')) return refuse('world-identity:projection-mismatch');
    if (recorded.firstLanding || recorded.claimedLegacy) {
      identity = recorded.state;
      writes.push(...encodeWorldIdentityExtensionWrites(identity));
    }
    if (!draft.landed.includes(seed)) draft.landed = [...draft.landed, seed];
  }

  let charters: LandedFactV1['charters'] = { progressIds: [], completedIds: [] };
  const ascent = { banked: false, chapterBefore: draft.ascCh, chapterAfter: draft.ascCh };
  if (deed) {
    const staged = input.charters({
      draft, extensions, event: { kind: 'landfall', address }, receiptOrdinal: input.receiptOrdinal, activePlayMs: input.activePlayMs,
    });
    if (staged.kind === 'refused') return refuse(`charter:${staged.reason}`);
    charters = { progressIds: [...staged.facts.progressIds], completedIds: staged.facts.completions.map(({ id }) => id) };
    writes.push(...staged.facts.extensionWrites);

    const progress = { ...draft.ascProg };
    if (bankLandfall(draft.ascCh, progress, address)) {
      const reconciled = reconcileV2Chapters(draft.ascCh, progress, ascStageOf(draft.items, draft.ascCh));
      if (reconciled === null) return refuse('ascent:invalid');
      draft.ascProg = progress;
      draft.ascCh = reconciled.nextChapter;
      ascent.banked = true;
      ascent.chapterAfter = reconciled.nextChapter;
    }
  }

  if (earth) {
    const home = prepareArc9EventAchievementJoinV1(draft, 'home');
    if (home.kind !== 'prepared') return refuse(`achievement:${home.reason}`);
    draft.unlocked = [...home.nextUnlockedIds];
  }
  if (permanent && !draft.surfSeen.includes(seed)) draft.surfSeen = [...draft.surfSeen, seed];

  // The view: the region is rolled from the landings counted before this landing's own samples.
  const region = landingRegion({
    address, band: input.opportunity.source.climateBand, epoch: draft.EPOCH_BASE, landings: draft.stats.landings ?? 0, view: input.view,
  });
  const journalRow = {
    s: seed, n: (input.worldName || 'A world').slice(0, JOURNAL_NAME_MAX), w: (region.key ?? '').slice(0, JOURNAL_REGION_MAX), t: input.codecNow,
  };
  draft.journal = [...draft.journal, journalRow].slice(-JOURNAL_MAX_ROWS);

  const sample = deriveFieldSamples({
    source: draft, address, opportunity: input.opportunity, landing: input.landing, training,
  });
  if (sample.kind === 'ready') {
    draft.cargo = sample.fields.cargo;
    draft.essence = sample.fields.essence;
    draft.stats = sample.fields.stats;
  }

  // Every achievement the landing has now earned, and the rank it leaves (the legacy `checkAch` and `renderRank`).
  const refresh = prepareArc9ProgressionRefreshV1(draft);
  if (refresh.kind === 'protected') return refuse(`progression:${refresh.reason}`);
  if (refresh.kind === 'ready') {
    draft.unlocked = [...refresh.successorState.unlocked];
    draft.stats = { ...refresh.successorState.stats };
  }

  const cargo = new Map(draft.cargo);
  const landed: LandedFactV1 = {
    permanent,
    deed,
    region: { key: region.key, route: region.route, salt: region.salt },
    sample: sample.kind === 'ready' ? { stardust: sample.reward.stardust, materials: sample.reward.materials.map(({ id }) => id) } : null,
    charters,
    ascent,
    achievementIds: draft.unlocked.filter((id) => !unlockedBefore.has(id)),
  };
  return {
    state: draft,
    extensionWrites: writes,
    facts: { ...common(input), descent: descentFact(descent), landed },
    expect: {
      hp: descent.hpAfter,
      waveOffCount,
      identityLanded: worldIdentityRecord(identity, address)?.landed === true,
      landed: {
        permanent,
        journalRow,
        essence: draft.essence,
        essenceEarned: draft.stats.essenceEarned ?? 0,
        landings: draft.stats.landings ?? 0,
        cargo: sample.kind === 'ready' ? [...new Set(sample.reward.materials.map(({ id }) => id))].map((id) => [id, cargo.get(id) ?? 0] as const) : [],
        ascCh: draft.ascCh,
        ascProg: { ...draft.ascProg },
        chDone: charters.completedIds,
        unlocked: landed.achievementIds,
      },
    },
  };
}
