/* Arc 7/8's shared player-live audio owner: deterministic, synthesized
   expressions for exact durable creature outcomes plus source-authored combat
   impacts from one verified settlement session. The original Tame API is
   retained for compatibility; Feed, audition, ecology, and combat share this
   same AudioContext/runtime. Gameplay authority, accessible counterparts, and
   browser gesture ownership stay with Main. */
import {
  createAudioRuntime,
  createCombatGameplayVoiceRequest,
  createCreatureExpressionCue,
  createCreatureExpressionVoiceRequest,
  createDistantEcologyVoiceRequest,
  isCombatCuePlanV1,
  type AudioActivationResult,
  type AudioContextLike,
  type AudioCounterpartReceipt,
  type AudioRuntime,
  type AudioRuntimeDiagnostics,
  type AudioVoiceStartResult,
  type CombatCuePlanV1,
  type CombatCueV1,
  type DistantEcologyHintPlan,
} from '@cf/audio';
import {
  isCombatSettlementPlanV1,
  type CombatSettlementPlanV1,
} from '@cf/domain-combatcore';
import {
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  projectOwnedCreatureAudioIdentity,
  type OwnedCreatureAudioIdentityProjection,
} from './audio-identity-projector.js';
import type { CompendiumAuditionActionRequestV1 } from './compendium-audition.js';
import {
  isCurrentWorldDistantEcologyPlaybackV1,
  type CurrentWorldDistantEcologyPlaybackV1,
} from './biome-ecology-audio.js';
import type { Arc6CombatActionOutcomeV1 } from './arc6-combat-action.js';

export const TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA =
  'cf-v2-tame-greeting-audio/v1' as const;

export interface TameGreetingAudioPolicy {
  readonly soundOn: boolean;
  readonly creatureVoicesOn: boolean;
  readonly visible: boolean;
  readonly answerable: boolean;
  readonly masterGain: number;
  /** Stable app route key; Tame retains the exact canonical surface-world key. */
  readonly routeKey: string | null;
}

export interface TameGreetingCaptureResult {
  readonly hit: boolean;
  readonly speciesId: string;
  readonly kingdom: 'microbe' | 'flora' | 'fungi' | 'fauna';
  readonly worldKey: string;
  readonly ownedRowId: string | null;
  /** Global F3 transaction revision for the durable capture result. */
  readonly revision: number;
  /** Arc 4/5 ownership successor revision that owns `ownedRowId`. */
  readonly ownershipRevision: number;
}

export interface TameGreetingCaptureOutcome {
  readonly kind: 'committed' | 'unavailable' | 'refused';
  readonly durability: 'none' | 'committed';
  readonly convergence: 'none' | 'read-only-reload';
  readonly verb: 'tame' | 'scavenge' | 'sample' | null;
  readonly result: TameGreetingCaptureResult | null;
}

export interface TameGreetingClaim {
  readonly eventKey: string;
  readonly worldKey: string;
}

export interface FeedExpressionResult {
  readonly creatureId: string;
  readonly fedBefore: number;
  readonly fedAfter: number;
  readonly receiptOrdinal: number;
  /** Global F3 transaction revision for the durable Feed result. */
  readonly revision: number;
  /** Arc 5 ownership successor revision that owns `creatureId`. */
  readonly ownershipRevision: number;
}

export interface FeedExpressionOutcome {
  readonly kind: 'committed' | 'unavailable' | 'refused';
  readonly durability: 'none' | 'committed';
  readonly convergence: 'none' | 'read-only-reload';
  readonly result: FeedExpressionResult | null;
}

export interface FeedExpressionClaim {
  readonly eventKey: string;
  readonly routeKey: string;
}

export interface CompendiumAuditionClaim {
  readonly eventKey: string;
  readonly routeKey: string;
}

export interface DistantEcologyPlaybackClaim {
  readonly eventKey: string;
  readonly worldKey: string;
  /** Exact app route that armed this playback. Orbital approach may target a
   * world while the owning route remains its parent system. */
  readonly routeKey: string;
}

export interface CombatAudioSessionClaim {
  readonly eventKey: string;
  readonly routeKey: string;
  readonly battleId: string;
  readonly revision: number;
}

export type TameGreetingPlayResult =
  | Readonly<{ readonly kind: 'started'; readonly voiceId: string }>
  | Readonly<{ readonly kind: 'silent'; readonly reason: string }>;

export interface TameGreetingAudioDiagnostics {
  readonly schema: typeof TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA;
  readonly disposed: boolean;
  readonly armed: 0 | 1;
  readonly claimedEvents: number;
  readonly activeVoiceId: string | null;
  /** Exact live IDs owned by the current combat session; bounded by the
   * registered combat request's max-concurrency policy. */
  readonly activeCombatVoiceIds: readonly string[];
  readonly lastEventKey: string | null;
  readonly lastEventKind:
    | 'taming-succeeded'
    | 'feed-completed'
    | 'selected'
    | 'distant-ecology'
    | 'combat-impact'
    | 'combat-cue'
    | null;
  readonly lastDisposition: string;
  readonly counterpart: Readonly<{
    readonly key: string | null;
    readonly generation: number | null;
    readonly status: 'none' | 'claimed' | 'live' | 'lost' | 'rejected';
  }>;
  readonly runtime: AudioRuntimeDiagnostics;
}

export interface TameGreetingAudioOwner {
  /** Called only inside the trusted native Tame click stack. */
  armNativeTameGesture(): boolean;
  /** Called only inside the trusted native Feed click stack. */
  armNativeFeedGesture(): boolean;
  /** Synchronously validates and claims the stable event before any await. */
  claimCommittedTameGreeting(
    outcome: TameGreetingCaptureOutcome,
    ownership: OwnershipStateV2 | null,
  ): TameGreetingClaim | null;
  playClaimedTameGreeting(
    claim: TameGreetingClaim,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult>;
  /** Claims only an exact, current Arc 5 Feed successor. */
  claimCommittedFeedExpression(
    outcome: FeedExpressionOutcome,
    ownership: OwnershipStateV2 | null,
  ): FeedExpressionClaim | null;
  playClaimedFeedExpression(
    claim: FeedExpressionClaim,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult>;
  /** Called only inside a trusted Compendium detail audition click. */
  armNativeCompendiumAuditionGesture(): boolean;
  /** Claims one exact current owned-fauna identity; it never writes care. */
  claimCompendiumAudition(
    request: CompendiumAuditionActionRequestV1,
    ownership: OwnershipStateV2 | null,
  ): CompendiumAuditionClaim | null;
  playClaimedCompendiumAudition(
    claim: CompendiumAuditionClaim,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult>;
  /** Called only inside a trusted current-world ecology Listen click. */
  armNativeDistantEcologyGesture(): boolean;
  claimCurrentWorldDistantEcology(
    playback: CurrentWorldDistantEcologyPlaybackV1,
  ): DistantEcologyPlaybackClaim | null;
  playClaimedDistantEcology(
    claim: DistantEcologyPlaybackClaim,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult>;
  /** Called only inside the trusted native Challenge click stack. Combat is
   * governed by master Sound and deliberately ignores Creature Voices. */
  armNativeCombatGesture(): boolean;
  /** Claims one exact verified Arc 6 settlement and its registered cue plan. */
  claimCommittedCombatSession(
    outcome: Arc6CombatActionOutcomeV1,
    cuePlan: CombatCuePlanV1,
  ): CombatAudioSessionClaim | null;
  /** Plays one canonical, not-yet-emitted cue from that session. */
  playClaimedCombatCue(
    claim: CombatAudioSessionClaim,
    cue: CombatCueV1,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult>;
  /** Chronicle Skip/Close/replace owns this synchronous stop seam. */
  cancelCombatPlayback(reason: string): void;
  cancelTameAttempt(reason: string): void;
  cancelFeedAttempt(reason: string): void;
  cancelCompendiumAudition(reason: string): void;
  cancelDistantEcology(reason: string): void;
  syncSettings(): void;
  setHidden(hidden: boolean): void;
  setAnswerable(answerable: boolean): void;
  syncRoute(routeKey: string | null): void;
  counterpartLost(): void;
  diagnostics(): TameGreetingAudioDiagnostics;
  dispose(): Promise<void>;
}

export interface TameGreetingAudioOwnerOptions {
  readonly createContext: () => AudioContextLike;
  readonly nowMs: () => number;
  readonly readPolicy: () => TameGreetingAudioPolicy;
  readonly verifyCounterpart: (receipt: AudioCounterpartReceipt) => boolean;
  /** Test seam only; production uses the registered current Arc 5 projector. */
  readonly projectIdentity?: (
    state: OwnershipStateV2,
    creatureId: CreatureInstanceId,
  ) => OwnedCreatureAudioIdentityProjection;
}

type ProjectedIdentity = Extract<
  OwnedCreatureAudioIdentityProjection,
  { readonly kind: 'projected' }
>;

interface ArmedGesture {
  readonly serial: number;
  readonly kind: 'tame' | 'feed' | 'audition' | 'distant-ecology' | 'combat';
  readonly routeKey: string;
  readonly activation: Promise<AudioActivationResult>;
}

type ExpressionKind = 'taming-succeeded' | 'feed-completed' | 'selected';
type ActiveAudioKind = ExpressionKind | 'distant-ecology';

interface ClaimedExpression {
  readonly kind: 'expression';
  readonly arm: ArmedGesture;
  readonly identity: ProjectedIdentity;
  readonly expressionKind: ExpressionKind;
  readonly eventKey: string;
  readonly worldKey: string;
  consumed: boolean;
}

interface ClaimedEcology {
  readonly kind: 'distant-ecology';
  readonly arm: ArmedGesture;
  readonly plan: DistantEcologyHintPlan;
  readonly counterpart: AudioCounterpartReceipt;
  readonly eventKey: string;
  readonly worldKey: string;
  readonly routeKey: string;
  consumed: boolean;
}

type ClaimedAudio = ClaimedExpression | ClaimedEcology;

interface ClaimedFeedOwnership {
  readonly eventKey: string;
  readonly ownershipRevision: number;
}

interface ClaimedCombatSession {
  readonly arm: ArmedGesture;
  readonly settlement: CombatSettlementPlanV1;
  readonly cuePlan: CombatCuePlanV1;
  readonly eventKey: string;
  readonly routeKey: string;
  readonly revision: number;
  readonly playedCueIds: Set<string>;
  counterpartGeneration: number | null;
  lastCueOrdinal: number;
}

function safeGain(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 0;
}

function safePolicy(readPolicy: () => TameGreetingAudioPolicy): TameGreetingAudioPolicy | null {
  try {
    const value = readPolicy();
    if (!value || typeof value !== 'object'
      || typeof value.soundOn !== 'boolean'
      || typeof value.creatureVoicesOn !== 'boolean'
      || typeof value.visible !== 'boolean'
      || typeof value.answerable !== 'boolean'
      || (value.routeKey !== null && (typeof value.routeKey !== 'string'
        || value.routeKey.length === 0 || value.routeKey.length > 512))) return null;
    return Object.freeze({ ...value, masterGain: safeGain(value.masterGain) });
  } catch {
    return null;
  }
}

type EnabledTameGreetingAudioPolicy = TameGreetingAudioPolicy & { readonly routeKey: string };

function enabledPolicy(
  policy: TameGreetingAudioPolicy | null,
): policy is EnabledTameGreetingAudioPolicy {
  return policy !== null && policy.soundOn && policy.creatureVoicesOn
    && policy.visible && policy.answerable && policy.routeKey !== null;
}

function enabledMasterPolicy(
  policy: TameGreetingAudioPolicy | null,
): policy is EnabledTameGreetingAudioPolicy {
  return policy !== null && policy.soundOn
    && policy.visible && policy.answerable && policy.routeKey !== null;
}

function tameAcquisitionFor(
  state: OwnershipStateV2,
  creatureId: CreatureInstanceId,
): Readonly<{ readonly recordId: string; readonly worldKey: string }> | null {
  const creature = state.creatures.find((row) => row.creatureId === creatureId);
  if (!creature || creature.origin !== 'wild') return null;
  const acquisition = state.acquisitions.find(
    (row) => row.recordId === creature.acquisitionRecordId,
  );
  if (!acquisition || acquisition.speciesId !== creature.speciesId
    || acquisition.acquisition !== 'tame'
    || acquisition.provenance.kind !== 'world'
    || acquisition.provenance.verb !== 'tame') return null;
  return Object.freeze({
    recordId: acquisition.recordId,
    worldKey: acquisition.provenance.worldKey,
  });
}

class BrowserTameGreetingAudioOwner implements TameGreetingAudioOwner {
  readonly #runtime: AudioRuntime;
  readonly #readPolicy: () => TameGreetingAudioPolicy;
  readonly #projectIdentity: NonNullable<TameGreetingAudioOwnerOptions['projectIdentity']>;
  readonly #claims = new WeakMap<object, ClaimedAudio>();
  readonly #combatClaims = new WeakMap<object, ClaimedCombatSession>();
  readonly #claimedTameEventKeys = new Set<string>();
  #claimedFeedOwnership: ClaimedFeedOwnership | null = null;
  #activeCombatClaim: CombatAudioSessionClaim | null = null;
  #latestCombatRevision: number | null = null;
  readonly #activeCombatVoiceIds = new Set<string>();
  #ephemeralClaimCount = 0;
  #arm: ArmedGesture | null = null;
  #pendingClaim:
    | TameGreetingClaim
    | FeedExpressionClaim
    | CompendiumAuditionClaim
    | DistantEcologyPlaybackClaim
    | null = null;
  #armSerial = 0;
  #disposed = false;
  #answerable = true;
  #hidden = false;
  #activeVoiceId: string | null = null;
  #activeWorldKey: string | null = null;
  #activeExpressionKind: ActiveAudioKind | null = null;
  #lastEventKey: string | null = null;
  #lastEventKind: TameGreetingAudioDiagnostics['lastEventKind'] = null;
  #lastDisposition = 'idle';
  #counterpartKey: string | null = null;
  #counterpartGeneration: number | null = null;
  #counterpartStatus: TameGreetingAudioDiagnostics['counterpart']['status'] = 'none';

  constructor(options: TameGreetingAudioOwnerOptions) {
    this.#readPolicy = options.readPolicy;
    this.#projectIdentity = options.projectIdentity ?? projectOwnedCreatureAudioIdentity;
    this.#runtime = createAudioRuntime({
      createContext: options.createContext,
      nowMs: options.nowMs,
      initialMuted: true,
      verifyCounterpart: options.verifyCounterpart,
    });
  }

  armNativeTameGesture(): boolean {
    return this.#armNativeGesture('tame');
  }

  armNativeFeedGesture(): boolean {
    return this.#armNativeGesture('feed');
  }

  armNativeCompendiumAuditionGesture(): boolean {
    return this.#armNativeGesture('audition');
  }

  armNativeDistantEcologyGesture(): boolean {
    return this.#armNativeGesture('distant-ecology');
  }

  armNativeCombatGesture(): boolean {
    return this.#armNativeGesture('combat');
  }

  #armNativeGesture(kind: ArmedGesture['kind']): boolean {
    if (this.#disposed) return false;
    const policy = safePolicy(this.#readPolicy);
    if (!enabledMasterPolicy(policy)
      || (kind !== 'distant-ecology' && kind !== 'combat' && !policy.creatureVoicesOn)
      || !this.#answerable || this.#hidden) {
      this.#lastDisposition = 'arm-ineligible';
      return false;
    }
    if (this.#arm !== null || this.#pendingClaim !== null) {
      this.cancelTameAttempt('arm-replaced');
    }
    if (this.#activeCombatClaim !== null) this.#endCombatSession('arm-replaced', false);
    if (this.#activeVoiceId !== null) this.#stopActiveVoice();
    this.#runtime.setMasterGain(policy.masterGain);
    this.#runtime.setCategoryGain('creature', policy.creatureVoicesOn ? 1 : 0);
    this.#runtime.setCategoryGain('combat-gameplay', 1);
    void this.#runtime.setMuted(false);
    const activation = this.#runtime.activate();
    this.#arm = Object.freeze({
      serial: ++this.#armSerial,
      kind,
      routeKey: policy.routeKey,
      activation,
    });
    this.#lastDisposition = kind === 'tame' ? 'armed'
      : kind === 'feed' ? 'feed-armed'
        : kind === 'audition' ? 'audition-armed'
          : kind === 'distant-ecology' ? 'distant-ecology-armed' : 'combat-armed';
    return true;
  }

  claimCommittedTameGreeting(
    outcome: TameGreetingCaptureOutcome,
    ownership: OwnershipStateV2 | null,
  ): TameGreetingClaim | null {
    const arm = this.#arm;
    this.#arm = null;
    const silent = (reason: string): null => {
      this.#lastDisposition = reason;
      if (arm !== null) void this.#runtime.setMuted(true);
      return null;
    };
    if (this.#disposed) return silent('disposed');
    if (arm === null) return silent('unarmed');
    if (arm.kind !== 'tame') return silent('arm-kind-mismatch');
    if (outcome.kind !== 'committed' || outcome.durability !== 'committed'
      || outcome.convergence !== 'none' || outcome.verb !== 'tame'
      || outcome.result === null || !outcome.result.hit
      || outcome.result.kingdom !== 'fauna' || outcome.result.ownedRowId === null) {
      return silent('ineligible-outcome');
    }
    const policy = safePolicy(this.#readPolicy);
    if (!enabledPolicy(policy) || !this.#answerable || this.#hidden
      || policy.routeKey !== arm.routeKey || policy.routeKey !== outcome.result.worldKey) {
      return silent('policy-changed');
    }
    const state = ownership;
    if (state === null || !isOwnershipStateV2(state) || state.mode !== 'current'
      || state.revision !== outcome.result.ownershipRevision) return silent('ownership-stale');
    const creature = state.creatures.find((row) => row.creatureId === outcome.result!.ownedRowId);
    if (!creature) return silent('owned-row-missing');
    if (creature.speciesId !== outcome.result.speciesId) return silent('result-species-mismatch');
    const acquisition = tameAcquisitionFor(state, creature.creatureId);
    if (acquisition === null || acquisition.worldKey !== outcome.result.worldKey) {
      return silent('acquisition-mismatch');
    }
    const identity = this.#projectIdentity(state, creature.creatureId);
    if (identity.kind !== 'projected' || identity.profile.kingdom !== 'fauna') {
      return silent('identity-unavailable');
    }
    const eventKey = `arc4:taming-succeeded:${acquisition.recordId}`;
    if (this.#claimedTameEventKeys.has(eventKey)) return silent('event-already-claimed');

    /* This is the replay fence: the stable gameplay identity and single-use
       gesture are both claimed synchronously, before play awaits activation. */
    this.#claimedTameEventKeys.add(eventKey);
    const claim = Object.freeze({ eventKey, worldKey: acquisition.worldKey });
    this.#claims.set(claim, {
      kind: 'expression',
      arm,
      identity,
      expressionKind: 'taming-succeeded',
      eventKey,
      worldKey: acquisition.worldKey,
      consumed: false,
    });
    this.#pendingClaim = claim;
    this.#lastEventKey = eventKey;
    this.#lastEventKind = 'taming-succeeded';
    this.#lastDisposition = 'event-claimed';
    this.#counterpartStatus = 'claimed';
    return claim;
  }

  async playClaimedTameGreeting(
    claim: TameGreetingClaim,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult> {
    return this.#playClaimedExpression(claim, counterpart, 'taming-succeeded');
  }

  claimCommittedFeedExpression(
    outcome: FeedExpressionOutcome,
    ownership: OwnershipStateV2 | null,
  ): FeedExpressionClaim | null {
    const arm = this.#arm;
    this.#arm = null;
    const silent = (reason: string): null => {
      this.#lastDisposition = reason;
      if (arm !== null) void this.#runtime.setMuted(true);
      return null;
    };
    if (this.#disposed) return silent('disposed');
    if (arm === null) return silent('unarmed');
    if (arm.kind !== 'feed') return silent('arm-kind-mismatch');
    const result = outcome.result;
    if (outcome.kind !== 'committed' || outcome.durability !== 'committed'
      || outcome.convergence !== 'none' || result === null
      || typeof result.creatureId !== 'string' || result.creatureId.length < 1
      || result.creatureId.length > 128
      || !Number.isSafeInteger(result.fedBefore) || result.fedBefore < 0
      || !Number.isSafeInteger(result.fedAfter) || result.fedAfter !== result.fedBefore + 1
      || !Number.isSafeInteger(result.receiptOrdinal) || result.receiptOrdinal < 0
      || !Number.isSafeInteger(result.revision) || result.revision < 1
      || !Number.isSafeInteger(result.ownershipRevision) || result.ownershipRevision < 1) {
      return silent('ineligible-feed-outcome');
    }
    const policy = safePolicy(this.#readPolicy);
    if (!enabledPolicy(policy) || !this.#answerable || this.#hidden
      || policy.routeKey !== arm.routeKey) return silent('policy-changed');
    const state = ownership;
    if (state === null || !isOwnershipStateV2(state) || state.mode !== 'current'
      || state.revision !== result.ownershipRevision) return silent('ownership-stale');
    const creature = state.creatures.find((row) => row.creatureId === result.creatureId);
    if (!creature || creature.fed !== result.fedAfter) return silent('feed-successor-mismatch');
    const identity = this.#projectIdentity(state, creature.creatureId);
    if (identity.kind !== 'projected' || identity.profile.kingdom !== 'fauna') {
      return silent('identity-unavailable');
    }
    const eventKey = `arc5:feed-completed:${result.revision}:${result.receiptOrdinal}:${creature.creatureId}`;
    if (eventKey.length > 192) return silent('feed-event-key-invalid');
    if (this.#claimedFeedOwnership?.eventKey === eventKey) {
      return silent('event-already-claimed');
    }
    if (this.#claimedFeedOwnership !== null
      && result.ownershipRevision <= this.#claimedFeedOwnership.ownershipRevision) {
      return silent('feed-ownership-not-advanced');
    }

    /* Main supplies the exact current Arc 5 successor and its revision. Once
       a newer Feed successor is current, every older outcome is stale by that
       same equality check, so retaining one latest revision/key is the full
       replay fence rather than an unbounded document-lifetime key set. */
    this.#claimedFeedOwnership = Object.freeze({
      eventKey,
      ownershipRevision: result.ownershipRevision,
    });
    const claim = Object.freeze({ eventKey, routeKey: arm.routeKey });
    this.#claims.set(claim, {
      kind: 'expression',
      arm,
      identity,
      expressionKind: 'feed-completed',
      eventKey,
      worldKey: arm.routeKey,
      consumed: false,
    });
    this.#pendingClaim = claim;
    this.#lastEventKey = eventKey;
    this.#lastEventKind = 'feed-completed';
    this.#lastDisposition = 'feed-event-claimed';
    this.#counterpartStatus = 'claimed';
    return claim;
  }

  async playClaimedFeedExpression(
    claim: FeedExpressionClaim,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult> {
    return this.#playClaimedExpression(claim, counterpart, 'feed-completed');
  }

  claimCompendiumAudition(
    request: CompendiumAuditionActionRequestV1,
    ownership: OwnershipStateV2 | null,
  ): CompendiumAuditionClaim | null {
    const arm = this.#arm;
    this.#arm = null;
    const silent = (reason: string): null => {
      this.#lastDisposition = reason;
      if (arm !== null) void this.#runtime.setMuted(true);
      return null;
    };
    if (this.#disposed) return silent('disposed');
    if (arm === null) return silent('unarmed');
    if (arm.kind !== 'audition') return silent('arm-kind-mismatch');
    if (!request || typeof request !== 'object'
      || typeof request.creatureId !== 'string' || request.creatureId.length < 1
      || request.creatureId.length > 128
      || request.eventKey !== `arc7:compendium-audition:${request.creatureId}`
      || !Number.isSafeInteger(request.ownershipRevision) || request.ownershipRevision < 1
      || typeof request.ownershipDigest !== 'string'
      || request.surface?.speciesId === null
      || !Number.isSafeInteger(request.surface?.generation) || request.surface.generation < 1) {
      return silent('audition-request-invalid');
    }
    const policy = safePolicy(this.#readPolicy);
    if (!enabledPolicy(policy) || !this.#answerable || this.#hidden
      || policy.routeKey !== arm.routeKey) return silent('policy-changed');
    const state = ownership;
    if (state === null || !isOwnershipStateV2(state) || state.mode !== 'current'
      || state.revision !== request.ownershipRevision
      || ownershipStateDigestV2(state) !== request.ownershipDigest) {
      return silent('ownership-stale');
    }
    const creature = state.creatures.find((row) => row.creatureId === request.creatureId);
    if (!creature || creature.speciesId !== request.surface.speciesId) {
      return silent('audition-creature-mismatch');
    }
    const identity = this.#projectIdentity(state, creature.creatureId);
    if (identity.kind !== 'projected' || identity.profile.kingdom !== 'fauna') {
      return silent('identity-unavailable');
    }
    const claim = Object.freeze({ eventKey: request.eventKey, routeKey: arm.routeKey });
    this.#claims.set(claim, {
      kind: 'expression',
      arm,
      identity,
      expressionKind: 'selected',
      eventKey: request.eventKey,
      worldKey: arm.routeKey,
      consumed: false,
    });
    this.#pendingClaim = claim;
    this.#ephemeralClaimCount++;
    this.#lastEventKey = request.eventKey;
    this.#lastEventKind = 'selected';
    this.#lastDisposition = 'audition-event-claimed';
    this.#counterpartStatus = 'claimed';
    return claim;
  }

  async playClaimedCompendiumAudition(
    claim: CompendiumAuditionClaim,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult> {
    return this.#playClaimedExpression(claim, counterpart, 'selected');
  }

  claimCurrentWorldDistantEcology(
    playback: CurrentWorldDistantEcologyPlaybackV1,
  ): DistantEcologyPlaybackClaim | null {
    const arm = this.#arm;
    this.#arm = null;
    const silent = (reason: string): null => {
      this.#lastDisposition = reason;
      if (arm !== null) void this.#runtime.setMuted(true);
      return null;
    };
    if (this.#disposed) return silent('disposed');
    if (arm === null) return silent('unarmed');
    if (arm.kind !== 'distant-ecology') return silent('arm-kind-mismatch');
    if (!isCurrentWorldDistantEcologyPlaybackV1(playback)
      || playback.eventKey !== playback.plan.planId
      || playback.worldKey !== playback.plan.canonicalWorldKey
      || playback.counterpart.eventKey !== playback.eventKey
      || playback.counterpart.generation !== playback.generation) {
      return silent('distant-ecology-request-invalid');
    }
    const policy = safePolicy(this.#readPolicy);
    if (!enabledMasterPolicy(policy) || !this.#answerable || this.#hidden
      || policy.routeKey !== arm.routeKey) {
      return silent('policy-changed');
    }
    const claim = Object.freeze({
      eventKey: playback.eventKey,
      worldKey: playback.worldKey,
      routeKey: arm.routeKey,
    });
    this.#claims.set(claim, {
      kind: 'distant-ecology',
      arm,
      plan: playback.plan,
      counterpart: playback.counterpart,
      eventKey: playback.eventKey,
      worldKey: playback.worldKey,
      routeKey: arm.routeKey,
      consumed: false,
    });
    this.#pendingClaim = claim;
    this.#ephemeralClaimCount++;
    this.#lastEventKey = playback.eventKey;
    this.#lastEventKind = 'distant-ecology';
    this.#lastDisposition = 'distant-ecology-event-claimed';
    this.#counterpartStatus = 'claimed';
    return claim;
  }

  async playClaimedDistantEcology(
    claim: DistantEcologyPlaybackClaim,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult> {
    const record = claim && typeof claim === 'object' ? this.#claims.get(claim) : undefined;
    if (!record || record.kind !== 'distant-ecology' || record.consumed) {
      return Object.freeze({ kind: 'silent', reason: 'claim-invalid' });
    }
    record.consumed = true;
    this.#claims.delete(claim);
    if (this.#pendingClaim === claim) this.#pendingClaim = null;
    if (counterpart.counterpartKey !== record.counterpart.counterpartKey
      || counterpart.eventKey !== record.counterpart.eventKey
      || counterpart.generation !== record.counterpart.generation) {
      return this.#rejectPlay('counterpart-mismatch');
    }
    this.#counterpartKey = counterpart.counterpartKey;
    this.#counterpartGeneration = counterpart.generation;

    let activation: AudioActivationResult;
    try { activation = await record.arm.activation; }
    catch { return this.#rejectPlay('activation-fault'); }
    if (activation.kind !== 'running') return this.#rejectPlay(`activation-${activation.kind}`);
    const policy = safePolicy(this.#readPolicy);
    if (!enabledMasterPolicy(policy) || !this.#answerable || this.#hidden
      || policy.routeKey !== record.routeKey) return this.#rejectPlay('policy-changed');

    let started: AudioVoiceStartResult;
    try {
      started = this.#runtime.playVoice(createDistantEcologyVoiceRequest({
        plan: record.plan,
        counterpart,
      }));
    } catch {
      return this.#rejectPlay('request-fault');
    }
    if (started.kind !== 'started') {
      return this.#rejectPlay(started.kind === 'fault'
        ? `runtime-fault:${started.reason}`
        : `runtime-rejected:${started.reason}`);
    }
    this.#activeVoiceId = started.voiceId;
    this.#activeWorldKey = record.routeKey;
    this.#activeExpressionKind = 'distant-ecology';
    this.#counterpartStatus = 'live';
    this.#lastDisposition = 'voice-started';
    return Object.freeze({ kind: 'started', voiceId: started.voiceId });
  }

  claimCommittedCombatSession(
    outcome: Arc6CombatActionOutcomeV1,
    cuePlan: CombatCuePlanV1,
  ): CombatAudioSessionClaim | null {
    const arm = this.#arm;
    this.#arm = null;
    const silent = (reason: string): null => {
      this.#lastDisposition = reason;
      if (arm !== null) void this.#runtime.setMuted(true);
      return null;
    };
    if (this.#disposed) return silent('disposed');
    if (arm === null) return silent('unarmed');
    if (arm.kind !== 'combat') return silent('arm-kind-mismatch');
    try {
      if (outcome.kind !== 'committed' || outcome.durability !== 'committed'
        || outcome.convergence !== 'none' || outcome.verification.kind !== 'verified'
        || outcome.verification.convergence !== 'none'
        || outcome.transaction.kind !== 'committed'
        || outcome.transaction.durability !== 'committed'
        || outcome.transaction.convergence !== 'verification-required'
        || !isCombatSettlementPlanV1(outcome.verification.plan)
        || outcome.transaction.plan !== outcome.verification.plan
        || outcome.transaction.revision !== outcome.verification.revision
        || outcome.transaction.transaction.revision !== outcome.verification.revision
        || outcome.transaction.transaction.saved.canonicalState !== outcome.verification.state
        || outcome.transaction.transaction.receipt.ordinal
          !== outcome.verification.plan.receiptOrdinal
        || outcome.transaction.transaction.receipt.kind
          !== outcome.verification.plan.receipt.kind
        || outcome.transaction.transaction.receipt.witness
          !== outcome.verification.plan.receipt.witness
        || !isCombatCuePlanV1(cuePlan)
        || cuePlan.battleId !== outcome.verification.plan.battleId
        || cuePlan.transcriptFingerprint !== outcome.verification.plan.transcriptFingerprint) {
        return silent('combat-session-unverified');
      }
      const policy = safePolicy(this.#readPolicy);
      const routeKey = outcome.verification.plan.encounter.identity.world.key;
      if (!enabledMasterPolicy(policy) || !this.#answerable || this.#hidden
        || policy.routeKey !== arm.routeKey || policy.routeKey !== routeKey) {
        return silent('policy-changed');
      }
      const revision = outcome.verification.revision;
      if (this.#latestCombatRevision !== null && revision <= this.#latestCombatRevision) {
        return silent('combat-session-not-current');
      }
      if (this.#activeCombatClaim !== null) this.#endCombatSession('combat-replaced', false);
      const claim = Object.freeze({
        eventKey: cuePlan.planId,
        routeKey,
        battleId: outcome.verification.plan.battleId,
        revision,
      });
      this.#combatClaims.set(claim, {
        arm,
        settlement: outcome.verification.plan,
        cuePlan,
        eventKey: cuePlan.planId,
        routeKey,
        revision,
        playedCueIds: new Set<string>(),
        counterpartGeneration: null,
        lastCueOrdinal: -1,
      });
      this.#activeCombatClaim = claim;
      this.#latestCombatRevision = revision;
      this.#lastEventKey = cuePlan.planId;
      this.#lastDisposition = 'combat-session-claimed';
      this.#counterpartStatus = 'claimed';
      return claim;
    } catch {
      return silent('combat-session-unverified');
    }
  }

  async playClaimedCombatCue(
    claim: CombatAudioSessionClaim,
    cue: CombatCueV1,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult> {
    const record = claim && typeof claim === 'object' ? this.#combatClaims.get(claim) : undefined;
    if (!record || this.#activeCombatClaim !== claim) {
      return Object.freeze({ kind: 'silent', reason: 'claim-invalid' });
    }
    this.#reconcileActiveCombatVoices();
    let request: ReturnType<typeof createCombatGameplayVoiceRequest>;
    try {
      if (!record.cuePlan.cues.includes(cue)
        || cue.ordinal <= record.lastCueOrdinal
        || record.playedCueIds.has(cue.cueId)
        || (record.counterpartGeneration !== null
          && counterpart.generation !== record.counterpartGeneration)) {
        throw new TypeError('combat cue is not the next canonical session cue');
      }
      request = createCombatGameplayVoiceRequest({ plan: record.cuePlan, cue, counterpart });
    } catch {
      return this.#rejectCombatPlayback('combat-cue-or-counterpart-invalid');
    }
    /* Fence this cue synchronously before activation can yield. A rejected
       budget/concurrency result remains one attempted Chronicle emission and
       is never replayed from presentation state. */
    record.playedCueIds.add(cue.cueId);
    record.lastCueOrdinal = cue.ordinal;
    record.counterpartGeneration ??= counterpart.generation;
    this.#counterpartKey = counterpart.counterpartKey;
    this.#counterpartGeneration = counterpart.generation;

    let activation: AudioActivationResult;
    try { activation = await record.arm.activation; }
    catch { return this.#rejectCombatPlayback('activation-fault'); }
    if (this.#activeCombatClaim !== claim) {
      return Object.freeze({ kind: 'silent', reason: 'combat-session-lost' });
    }
    if (activation.kind !== 'running') {
      return this.#rejectCombatPlayback(`activation-${activation.kind}`);
    }
    const policy = safePolicy(this.#readPolicy);
    if (!enabledMasterPolicy(policy) || !this.#answerable || this.#hidden
      || policy.routeKey !== record.routeKey) {
      return this.#rejectCombatPlayback('policy-changed');
    }

    let started: AudioVoiceStartResult;
    try { started = this.#runtime.playVoice(request); }
    catch { return this.#rejectCombatPlayback('request-fault'); }
    if (started.kind !== 'started') {
      const reason = started.kind === 'fault'
        ? `runtime-fault:${started.reason}` : `runtime-rejected:${started.reason}`;
      if (started.kind === 'fault'
        || started.reason === 'disposed' || started.reason === 'muted'
        || started.reason === 'not-running' || started.reason === 'missing-counterpart') {
        return this.#rejectCombatPlayback(reason);
      }
      this.#lastDisposition = reason;
      return Object.freeze({ kind: 'silent', reason });
    }
    this.#activeCombatVoiceIds.add(started.voiceId);
    this.#reconcileActiveCombatVoices();
    if (this.#activeCombatVoiceIds.size > 2) {
      return this.#rejectCombatPlayback('combat-concurrency-bound-breached');
    }
    this.#lastEventKey = cue.cueId;
    this.#lastEventKind = 'combat-cue';
    this.#counterpartStatus = 'live';
    this.#lastDisposition = 'combat-voice-started';
    return Object.freeze({ kind: 'started', voiceId: started.voiceId });
  }

  cancelCombatPlayback(reason: string): void {
    if (this.#disposed) return;
    const ownsArm = this.#arm?.kind === 'combat';
    if (!ownsArm && this.#activeCombatClaim === null
      && this.#activeCombatVoiceIds.size === 0) return;
    if (ownsArm) this.#arm = null;
    this.#endCombatSession(`combat-cancelled:${reason.slice(0, 96)}`, true);
  }

  async #playClaimedExpression(
    claim: TameGreetingClaim | FeedExpressionClaim | CompendiumAuditionClaim,
    counterpart: AudioCounterpartReceipt,
    expectedKind: ExpressionKind,
  ): Promise<TameGreetingPlayResult> {
    const record = claim && typeof claim === 'object' ? this.#claims.get(claim) : undefined;
    if (!record || record.kind !== 'expression' || record.consumed
      || record.expressionKind !== expectedKind) {
      return Object.freeze({ kind: 'silent', reason: 'claim-invalid' });
    }
    record.consumed = true;
    this.#claims.delete(claim);
    if (this.#pendingClaim === claim) this.#pendingClaim = null;
    if (counterpart.eventKey !== record.eventKey) return this.#rejectPlay('counterpart-mismatch');
    this.#counterpartKey = counterpart.counterpartKey;
    this.#counterpartGeneration = counterpart.generation;

    let activation: AudioActivationResult;
    try { activation = await record.arm.activation; }
    catch { return this.#rejectPlay('activation-fault'); }
    if (activation.kind !== 'running') return this.#rejectPlay(`activation-${activation.kind}`);
    const policy = safePolicy(this.#readPolicy);
    if (!enabledPolicy(policy) || !this.#answerable || this.#hidden
      || policy.routeKey !== record.worldKey) return this.#rejectPlay('policy-changed');

    let started: AudioVoiceStartResult;
    try {
      const cue = createCreatureExpressionCue(record.identity.callPlan, Object.freeze({
        ...(record.expressionKind === 'taming-succeeded'
          ? { kind: 'taming-succeeded' as const }
          : record.expressionKind === 'feed-completed'
            ? { kind: 'feed-completed' as const, outcome: 'accepted' as const }
            : { kind: 'selected' as const }),
        eventKey: record.eventKey,
        captionKey: counterpart.counterpartKey,
      }));
      const request = createCreatureExpressionVoiceRequest({
        profile: record.identity.profile,
        callPlan: record.identity.callPlan,
        cue,
        counterpart,
      });
      started = this.#runtime.playVoice(request);
    } catch {
      return this.#rejectPlay('request-fault');
    }
    if (started.kind !== 'started') {
      return this.#rejectPlay(started.kind === 'fault'
        ? `runtime-fault:${started.reason}`
        : `runtime-rejected:${started.reason}`);
    }
    this.#activeVoiceId = started.voiceId;
    this.#activeWorldKey = record.worldKey;
    this.#activeExpressionKind = record.expressionKind;
    this.#counterpartStatus = 'live';
    this.#lastDisposition = 'voice-started';
    return Object.freeze({ kind: 'started', voiceId: started.voiceId });
  }

  cancelTameAttempt(reason: string): void {
    if (this.#disposed) return;
    this.#arm = null;
    this.#discardPendingClaim();
    this.#stopActiveVoice();
    this.#endCombatSession(`cancelled:${reason.slice(0, 96)}`, false);
    this.#lastDisposition = `cancelled:${reason.slice(0, 96)}`;
    void this.#runtime.setMuted(true);
  }

  cancelFeedAttempt(reason: string): void {
    if (this.#disposed) return;
    const ownsArm = this.#arm?.kind === 'feed';
    const pending = this.#pendingClaim === null ? undefined : this.#claims.get(this.#pendingClaim);
    const ownsClaim = pending?.kind === 'expression'
      && pending.expressionKind === 'feed-completed';
    const ownsVoice = this.#activeExpressionKind === 'feed-completed';
    if (!ownsArm && !ownsClaim && !ownsVoice) return;
    if (ownsArm) this.#arm = null;
    if (ownsClaim) {
      this.#discardPendingClaim('feed-completed');
      this.#counterpartStatus = 'rejected';
    }
    if (ownsVoice) this.#stopActiveVoice();
    this.#lastDisposition = `feed-cancelled:${reason.slice(0, 96)}`;
    void this.#runtime.setMuted(true);
  }

  cancelCompendiumAudition(reason: string): void {
    if (this.#disposed) return;
    const ownsArm = this.#arm?.kind === 'audition';
    const pending = this.#pendingClaim === null ? undefined : this.#claims.get(this.#pendingClaim);
    const ownsClaim = pending?.kind === 'expression'
      && pending.expressionKind === 'selected';
    const ownsVoice = this.#activeExpressionKind === 'selected';
    if (!ownsArm && !ownsClaim && !ownsVoice) return;
    if (ownsArm) this.#arm = null;
    if (ownsClaim) {
      this.#discardPendingClaim('selected');
      this.#counterpartStatus = 'rejected';
    }
    if (ownsVoice) this.#stopActiveVoice();
    this.#lastDisposition = `audition-cancelled:${reason.slice(0, 96)}`;
    void this.#runtime.setMuted(true);
  }

  cancelDistantEcology(reason: string): void {
    if (this.#disposed) return;
    const ownsArm = this.#arm?.kind === 'distant-ecology';
    const pending = this.#pendingClaim === null ? undefined : this.#claims.get(this.#pendingClaim);
    const ownsClaim = pending?.kind === 'distant-ecology';
    const ownsVoice = this.#activeExpressionKind === 'distant-ecology';
    if (!ownsArm && !ownsClaim && !ownsVoice) return;
    if (ownsArm) this.#arm = null;
    if (ownsClaim) {
      this.#discardPendingClaim('distant-ecology');
      this.#counterpartStatus = 'rejected';
    }
    if (ownsVoice) this.#stopActiveVoice();
    this.#lastDisposition = `distant-ecology-cancelled:${reason.slice(0, 96)}`;
    void this.#runtime.setMuted(true);
  }

  syncSettings(): void {
    if (this.#disposed) return;
    const policy = safePolicy(this.#readPolicy);
    this.#runtime.setMasterGain(policy?.masterGain ?? 0);
    this.#runtime.setCategoryGain('creature', policy?.creatureVoicesOn ? 1 : 0);
    this.#runtime.setCategoryGain('combat-gameplay', 1);
    if (!enabledMasterPolicy(policy) || !this.#answerable || this.#hidden) {
      this.#arm = null;
      this.#discardPendingClaim();
      this.#stopActiveVoice();
      this.#endCombatSession('settings-ineligible', false);
      this.#lastDisposition = 'settings-ineligible';
      void this.#runtime.setMuted(true);
      return;
    }
    if (!policy.creatureVoicesOn) {
      if (this.#arm?.kind !== 'distant-ecology' && this.#arm?.kind !== 'combat') this.#arm = null;
      const pending = this.#pendingClaim === null ? undefined : this.#claims.get(this.#pendingClaim);
      if (pending?.kind === 'expression') this.#discardPendingClaim();
      if (this.#activeExpressionKind !== null
        && this.#activeExpressionKind !== 'distant-ecology') this.#stopActiveVoice();
      this.#lastDisposition = 'creature-voices-ineligible';
    }
    void this.#runtime.setMuted(false);
  }

  setHidden(hidden: boolean): void {
    if (this.#disposed) return;
    this.#hidden = hidden === true;
    if (this.#hidden) {
      this.#arm = null;
      this.#discardPendingClaim();
      this.#stopActiveVoice();
      this.#endCombatSession('hidden', false);
      this.#lastDisposition = 'hidden';
    }
    void this.#runtime.setHidden(this.#hidden);
    if (!this.#hidden) this.syncSettings();
  }

  setAnswerable(answerable: boolean): void {
    if (this.#disposed) return;
    this.#answerable = answerable === true;
    if (!this.#answerable) {
      this.#arm = null;
      this.#discardPendingClaim();
      this.#stopActiveVoice();
      this.#endCombatSession('unanswerable', false);
      this.#lastDisposition = 'unanswerable';
      void this.#runtime.setMuted(true);
    } else this.syncSettings();
  }

  syncRoute(routeKey: string | null): void {
    if (this.#disposed) return;
    const armMismatch = this.#arm !== null && this.#arm.routeKey !== routeKey;
    const pending = this.#pendingClaim === null ? undefined : this.#claims.get(this.#pendingClaim);
    const claimMismatch = pending !== undefined && pending.worldKey !== routeKey;
    const voiceMismatch = this.#activeWorldKey !== null && this.#activeWorldKey !== routeKey;
    const combat = this.#activeCombatClaim === null
      ? undefined : this.#combatClaims.get(this.#activeCombatClaim);
    const combatMismatch = combat !== undefined && combat.routeKey !== routeKey;
    if (armMismatch || claimMismatch || voiceMismatch || combatMismatch) {
      this.cancelTameAttempt('route-changed');
    }
  }

  counterpartLost(): void {
    if (this.#disposed || this.#counterpartStatus === 'none') return;
    this.#stopActiveVoice();
    this.#endCombatSession('counterpart-lost', false);
    this.#counterpartStatus = 'lost';
    this.#lastDisposition = 'counterpart-lost';
  }

  diagnostics(): TameGreetingAudioDiagnostics {
    const runtime = this.#runtime.diagnostics();
    if (this.#activeVoiceId !== null && !runtime.voices.ids.includes(this.#activeVoiceId)) {
      this.#activeVoiceId = null;
      this.#activeWorldKey = null;
      this.#activeExpressionKind = null;
    }
    const hadCombatVoices = this.#activeCombatVoiceIds.size > 0;
    this.#reconcileActiveCombatVoices(runtime);
    if (hadCombatVoices && this.#activeCombatVoiceIds.size === 0
      && runtime.state !== 'running' && this.#activeCombatClaim !== null) {
      this.#endCombatSession('combat-context-lost', false);
      this.#counterpartStatus = 'lost';
    }
    return Object.freeze({
      schema: TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA,
      disposed: this.#disposed,
      armed: this.#arm === null ? 0 : 1,
      claimedEvents: this.#claimedTameEventKeys.size
        + (this.#claimedFeedOwnership === null ? 0 : 1)
        + this.#ephemeralClaimCount
        + (this.#latestCombatRevision === null ? 0 : 1),
      activeVoiceId: this.#activeVoiceId,
      activeCombatVoiceIds: Object.freeze([...this.#activeCombatVoiceIds]),
      lastEventKey: this.#lastEventKey,
      lastEventKind: this.#lastEventKind,
      lastDisposition: this.#lastDisposition,
      counterpart: Object.freeze({
        key: this.#counterpartKey,
        generation: this.#counterpartGeneration,
        status: this.#counterpartStatus,
      }),
      runtime,
    });
  }

  dispose(): Promise<void> {
    if (!this.#disposed) {
      this.#disposed = true;
      this.#arm = null;
      this.#discardPendingClaim();
      this.#stopActiveVoice();
      this.#endCombatSession('disposed', false);
      this.#counterpartStatus = this.#counterpartStatus === 'none' ? 'none' : 'lost';
      this.#lastDisposition = 'disposed';
    }
    return this.#runtime.dispose();
  }

  #stopActiveVoice(): void {
    if (this.#activeVoiceId !== null) this.#runtime.stopVoice(this.#activeVoiceId);
    this.#activeVoiceId = null;
    this.#activeWorldKey = null;
    this.#activeExpressionKind = null;
  }

  #stopActiveCombatVoices(): void {
    for (const voiceId of this.#activeCombatVoiceIds) this.#runtime.stopVoice(voiceId);
    this.#activeCombatVoiceIds.clear();
  }

  #reconcileActiveCombatVoices(runtime = this.#runtime.diagnostics()): void {
    const live = new Set(runtime.voices.ids);
    for (const voiceId of this.#activeCombatVoiceIds) {
      if (!live.has(voiceId)) this.#activeCombatVoiceIds.delete(voiceId);
    }
  }

  #endCombatSession(disposition: string, mute: boolean): void {
    this.#stopActiveCombatVoices();
    const claim = this.#activeCombatClaim;
    if (claim !== null) this.#combatClaims.delete(claim);
    this.#activeCombatClaim = null;
    if (this.#arm?.kind === 'combat') this.#arm = null;
    this.#lastDisposition = disposition;
    if (mute) void this.#runtime.setMuted(true);
  }

  #discardPendingClaim(kind?: ActiveAudioKind): boolean {
    const claim = this.#pendingClaim;
    if (claim === null) return false;
    const record = this.#claims.get(claim);
    const recordKind = record?.kind === 'expression'
      ? record.expressionKind
      : record?.kind;
    if (record === undefined || (kind !== undefined && recordKind !== kind)) {
      return false;
    }
    record.consumed = true;
    this.#claims.delete(claim);
    this.#pendingClaim = null;
    return true;
  }

  #rejectPlay(reason: string): TameGreetingPlayResult {
    this.#stopActiveVoice();
    this.#counterpartStatus = 'rejected';
    this.#lastDisposition = reason;
    void this.#runtime.setMuted(true);
    return Object.freeze({ kind: 'silent', reason });
  }

  #rejectCombatPlayback(reason: string): TameGreetingPlayResult {
    this.#endCombatSession(reason, true);
    this.#counterpartStatus = 'rejected';
    return Object.freeze({ kind: 'silent', reason });
  }
}

export function createTameGreetingAudioOwner(
  options: TameGreetingAudioOwnerOptions,
): TameGreetingAudioOwner {
  if (!options || typeof options !== 'object'
    || typeof options.createContext !== 'function'
    || typeof options.nowMs !== 'function'
    || typeof options.readPolicy !== 'function'
    || typeof options.verifyCounterpart !== 'function') {
    throw new TypeError('tame greeting audio owner requires injected runtime and policy owners');
  }
  return new BrowserTameGreetingAudioOwner(options);
}
