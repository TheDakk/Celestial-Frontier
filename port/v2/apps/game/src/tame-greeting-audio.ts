/* Arc 7/8's first player-live audio owner: one deterministic, synthesized
   greeting for an exact durable wild-fauna Tame result. Gameplay authority,
   the accessible toast counterpart, and browser gesture ownership stay with
   Main; this owner only fences the armed runtime lifecycle and translates a
   registered Arc 5 individual through the pure audio identity projector. */
import {
  createAudioRuntime,
  createCreatureExpressionCue,
  createCreatureExpressionVoiceRequest,
  type AudioActivationResult,
  type AudioContextLike,
  type AudioCounterpartReceipt,
  type AudioRuntime,
  type AudioRuntimeDiagnostics,
  type AudioVoiceStartResult,
} from '@cf/audio';
import {
  isOwnershipStateV2,
  type CreatureInstanceId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  projectOwnedCreatureAudioIdentity,
  type OwnedCreatureAudioIdentityProjection,
} from './audio-identity-projector.js';

export const TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA =
  'cf-v2-tame-greeting-audio/v1' as const;

export interface TameGreetingAudioPolicy {
  readonly soundOn: boolean;
  readonly creatureVoicesOn: boolean;
  readonly visible: boolean;
  readonly answerable: boolean;
  readonly masterGain: number;
  /** Exact canonical world key while the player remains on one surface. */
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

export type TameGreetingPlayResult =
  | Readonly<{ readonly kind: 'started'; readonly voiceId: string }>
  | Readonly<{ readonly kind: 'silent'; readonly reason: string }>;

export interface TameGreetingAudioDiagnostics {
  readonly schema: typeof TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA;
  readonly disposed: boolean;
  readonly armed: 0 | 1;
  readonly claimedEvents: number;
  readonly activeVoiceId: string | null;
  readonly lastEventKey: string | null;
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
  /** Synchronously validates and claims the stable event before any await. */
  claimCommittedTameGreeting(
    outcome: TameGreetingCaptureOutcome,
    ownership: OwnershipStateV2 | null,
  ): TameGreetingClaim | null;
  playClaimedTameGreeting(
    claim: TameGreetingClaim,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult>;
  cancelTameAttempt(reason: string): void;
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
  readonly routeKey: string;
  readonly activation: Promise<AudioActivationResult>;
}

interface ClaimedGreeting {
  readonly arm: ArmedGesture;
  readonly identity: ProjectedIdentity;
  readonly eventKey: string;
  readonly worldKey: string;
  consumed: boolean;
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
  readonly #claims = new WeakMap<object, ClaimedGreeting>();
  readonly #claimedEventKeys = new Set<string>();
  #arm: ArmedGesture | null = null;
  #armSerial = 0;
  #disposed = false;
  #answerable = true;
  #hidden = false;
  #activeVoiceId: string | null = null;
  #activeWorldKey: string | null = null;
  #lastEventKey: string | null = null;
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
    if (this.#disposed) return false;
    const policy = safePolicy(this.#readPolicy);
    if (!enabledPolicy(policy) || !this.#answerable || this.#hidden) {
      this.#lastDisposition = 'arm-ineligible';
      return false;
    }
    if (this.#arm !== null) this.cancelTameAttempt('arm-replaced');
    if (this.#activeVoiceId !== null) {
      this.#runtime.stopVoice(this.#activeVoiceId);
      this.#activeVoiceId = null;
      this.#activeWorldKey = null;
    }
    this.#runtime.setMasterGain(policy.masterGain);
    void this.#runtime.setMuted(false);
    const activation = this.#runtime.activate();
    this.#arm = Object.freeze({
      serial: ++this.#armSerial,
      routeKey: policy.routeKey,
      activation,
    });
    this.#lastDisposition = 'armed';
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
    if (this.#claimedEventKeys.has(eventKey)) return silent('event-already-claimed');

    /* This is the replay fence: the stable gameplay identity and single-use
       gesture are both claimed synchronously, before play awaits activation. */
    this.#claimedEventKeys.add(eventKey);
    const claim = Object.freeze({ eventKey, worldKey: acquisition.worldKey });
    this.#claims.set(claim, {
      arm,
      identity,
      eventKey,
      worldKey: acquisition.worldKey,
      consumed: false,
    });
    this.#lastEventKey = eventKey;
    this.#lastDisposition = 'event-claimed';
    this.#counterpartStatus = 'claimed';
    return claim;
  }

  async playClaimedTameGreeting(
    claim: TameGreetingClaim,
    counterpart: AudioCounterpartReceipt,
  ): Promise<TameGreetingPlayResult> {
    const record = claim && typeof claim === 'object' ? this.#claims.get(claim) : undefined;
    if (!record || record.consumed) return Object.freeze({ kind: 'silent', reason: 'claim-invalid' });
    record.consumed = true;
    this.#claims.delete(claim);
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
        kind: 'taming-succeeded',
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
    this.#counterpartStatus = 'live';
    this.#lastDisposition = 'voice-started';
    return Object.freeze({ kind: 'started', voiceId: started.voiceId });
  }

  cancelTameAttempt(reason: string): void {
    if (this.#disposed) return;
    this.#arm = null;
    this.#stopActiveVoice();
    this.#lastDisposition = `cancelled:${reason.slice(0, 96)}`;
    void this.#runtime.setMuted(true);
  }

  syncSettings(): void {
    if (this.#disposed) return;
    const policy = safePolicy(this.#readPolicy);
    this.#runtime.setMasterGain(policy?.masterGain ?? 0);
    if (!enabledPolicy(policy) || !this.#answerable || this.#hidden) {
      this.#arm = null;
      this.#stopActiveVoice();
      this.#lastDisposition = 'settings-ineligible';
      void this.#runtime.setMuted(true);
      return;
    }
    void this.#runtime.setMuted(false);
  }

  setHidden(hidden: boolean): void {
    if (this.#disposed) return;
    this.#hidden = hidden === true;
    if (this.#hidden) {
      this.#arm = null;
      this.#stopActiveVoice();
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
      this.#stopActiveVoice();
      this.#lastDisposition = 'unanswerable';
      void this.#runtime.setMuted(true);
    } else this.syncSettings();
  }

  syncRoute(routeKey: string | null): void {
    if (this.#disposed) return;
    const armMismatch = this.#arm !== null && this.#arm.routeKey !== routeKey;
    const voiceMismatch = this.#activeWorldKey !== null && this.#activeWorldKey !== routeKey;
    if (armMismatch || voiceMismatch) this.cancelTameAttempt('route-changed');
  }

  counterpartLost(): void {
    if (this.#disposed || this.#counterpartStatus === 'none') return;
    this.#stopActiveVoice();
    this.#counterpartStatus = 'lost';
    this.#lastDisposition = 'counterpart-lost';
  }

  diagnostics(): TameGreetingAudioDiagnostics {
    const runtime = this.#runtime.diagnostics();
    if (this.#activeVoiceId !== null && !runtime.voices.ids.includes(this.#activeVoiceId)) {
      this.#activeVoiceId = null;
      this.#activeWorldKey = null;
    }
    return Object.freeze({
      schema: TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA,
      disposed: this.#disposed,
      armed: this.#arm === null ? 0 : 1,
      claimedEvents: this.#claimedEventKeys.size,
      activeVoiceId: this.#activeVoiceId,
      lastEventKey: this.#lastEventKey,
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
      this.#stopActiveVoice();
      this.#counterpartStatus = this.#counterpartStatus === 'none' ? 'none' : 'lost';
      this.#lastDisposition = 'disposed';
    }
    return this.#runtime.dispose();
  }

  #stopActiveVoice(): void {
    if (this.#activeVoiceId !== null) this.#runtime.stopVoice(this.#activeVoiceId);
    this.#activeVoiceId = null;
    this.#activeWorldKey = null;
  }

  #rejectPlay(reason: string): TameGreetingPlayResult {
    this.#stopActiveVoice();
    this.#counterpartStatus = 'rejected';
    this.#lastDisposition = reason;
    void this.#runtime.setMuted(true);
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
