/* @cf/audio — shipped UI stings plus the injected Arc 7 runtime foundation.

   The verbatim bodies read `ac` and `sfxVol` as app globals (exactly as they
   do in main.js, where the audio section owns the Sound/Volume flags). initAudio
   installs the seam: a lazy AudioContext factory (standard first, legacy
   WebKit fallback), resume-on-suspended, and live getters for the two
   save-backed settings. The public facade stays inert until that seam exists.

   The new runtime owns typed mixer buses, lifecycle, bounded voice policy,
   and diagnostics only for voice graphs submitted to that runtime. The
   verbatim sting facade below deliberately remains a separate compatibility
   seam and is not counted or lifecycle-controlled by the new runtime yet.
   Sting migration, decoded-byte budgets, authored creature/ambience playback,
   and human listening proof remain open. */
import {
  playRaritySting as playRarityStingRaw,
  playSurveyPing as playSurveyPingRaw,
  playWhoosh as playWhooshRaw,
  applySfxGain as applySfxGainRaw,
} from './stings.verbatim.js';

export {
  AUDIO_RESOLVER_VERSION,
  createAudioIdentityProfile,
  createAudioSignature,
  createCreatureCallPlan,
  deserializeAudioSignature,
  serializeAudioSignature,
} from './identity.js';
export type {
  AudioIdentityInput,
  AudioIdentityProfile,
  AudioOwnerRoute,
  AudioSignature,
  AudioSignatureDecodeResult,
  CanonicalAudioOwner,
  CreatureCallPlan,
  CreaturePhrasePlan,
  CreaturePhrasePurpose,
  ImmutableAudioPhenotype,
  OrderedParentSeeds,
  SerializedAudioSignature,
  SurvivingAudioLineage,
} from './identity.js';
export {
  AUDIO_KINGDOM_ORDER,
  AUDIO_LEGACY_FALLBACK,
  AUDIO_PALETTE_POLICY,
  AUDIO_ROUTE_INVENTORY_DIGEST,
  AUDIO_ROUTE_INVENTORY_RESOLVER_VERSION,
  AUDIO_ROUTE_MANIFEST,
  AUDIO_ROUTE_MANIFEST_AUDIT,
  AUDIO_TAXONOMY,
  assertPinnedAudioRouteInventory,
  audioCatalogueRouteKey,
  audioRouteInventoryDigest,
  audioRouteManifestRow,
  auditAudioRouteManifest,
  isAudioKingdom,
} from './taxonomy.js';
export type {
  AudioCanonicalIdentityKey,
  AudioCatalogueRouteKey,
  AudioKingdom,
  AudioPalettePolicy,
  AudioRouteManifestAudit,
  AudioRouteManifestRow,
  AudioRouteStatus,
  AudioTaxonomyId,
} from './taxonomy.js';
export {
  auditAudioRouteSoundOutputs,
  createAudioSoundOutputWitness,
  serializeAudioSoundOutputWitness,
} from './sound-witness.js';
export type {
  AudioRouteSoundOutputAudit,
  AudioRouteSoundOutputRow,
  AudioSoundOutputWitness,
  SerializedAudioSoundOutputWitness,
} from './sound-witness.js';
export {
  AUDIO_STATIC_PURITY_RULES,
  auditAudioStaticPurity,
  inspectAudioStaticPurity,
} from './purity.js';
export type {
  AudioStaticPurityAudit,
  AudioStaticPurityRule,
  AudioStaticPurityViolation,
  AudioStaticSource,
} from './purity.js';
export { createDistantEcologyHintPlan } from './ecology.js';
export type {
  DistantEcologyHintInput,
  DistantEcologyHintPlan,
  EcologyHintGranularity,
  SurfacedEcologyProjection,
  SurfacedEcologySource,
} from './ecology.js';
export {
  createCreatureExpressionCue,
  creatureExpressionAudioEvent,
  distantEcologyAudioEvent,
} from './events.js';
export type {
  AudioEvent,
  CreatureExpressionCue,
  SettledCreatureAudioEvent,
} from './events.js';
export { AUDIO_CATEGORIES, createAudioRuntime } from './runtime.js';
export type {
  AudioActivationResult,
  AudioActivationState,
  AudioAnalyserNodeLike,
  AudioCategory,
  AudioContextLike,
  AudioCounterpartReceipt,
  AudioGainNodeLike,
  AudioLimiterNodeLike,
  AudioMeter,
  AudioNodeLike,
  AudioParamLike,
  AudioRuntime,
  AudioRuntimeBudgets,
  AudioRuntimeDiagnostics,
  AudioRuntimeFault,
  AudioRuntimeOptions,
  AudioScheduledSourceLike,
  AudioVoiceGraph,
  AudioVoiceMeaning,
  AudioVoiceRequest,
  AudioVoiceReservation,
  AudioVoiceStartResult,
} from './runtime.js';
export {
  AUDIO_RESOURCE_MEASUREMENT_DIAGNOSTICS,
  AUDIO_SETTING_ACCESSIBILITY_DIAGNOSTICS,
  auditAudioLabLifecycleTrace,
  captureAudioLabSample,
} from './lab.js';
export type {
  AudioLabLifecycleAudit,
  AudioLabPhase,
  AudioLabSample,
} from './lab.js';
export {
  AUDIO_ASSET_RIGHTS_MANIFEST,
  AUDIO_ASSET_RIGHTS_MANIFEST_AUDIT,
  AUDIO_ASSET_RIGHTS_MANIFEST_DIGEST,
  AUDIO_ASSET_RIGHTS_MANIFEST_VERSION,
  AUDIO_ASSET_ROLES,
  audioAssetRightsManifestDigest,
  auditAudioAssetRightsManifest,
} from './rights.js';
export type {
  AudioAssetObservation,
  AudioAssetRightsAudit,
  AudioAssetRightsAuditInput,
  AudioAssetRightsBundle,
  AudioAssetRightsRow,
  AudioAssetRole,
  AudioAssetTechnicalPolicy,
  AudioRightsEvidenceObservation,
} from './rights.js';

let AC: AudioContext | null = null;
let getSndOn: () => boolean = () => true;
let getSfxVol: () => number = () => 1;
let initialized = false;

type AudioContextConstructor = new () => AudioContext;
type WebKitAudioGlobal = typeof globalThis & {
  webkitAudioContext?: AudioContextConstructor;
};

export function playRaritySting(tier: number): void {
  if (!initialized) return;
  playRarityStingRaw(tier);
}

export function playSurveyPing(): void {
  if (!initialized) return;
  playSurveyPingRaw();
}

export function playWhoosh(): void {
  if (!initialized) return;
  playWhooshRaw();
}

export function applySfxGain(): void {
  if (!initialized) return;
  applySfxGainRaw();
}

/** the game's ac() (main.js ~13556): null when sound is off, lazy-created,
    resumed when the browser suspended it before the first gesture */
function ac(): AudioContext | null {
  if (!getSndOn()) return null;
  if (!AC) {
    const audioGlobal = globalThis as WebKitAudioGlobal;
    const Context = audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;
    if (!Context) return null;
    try { AC = new Context(); } catch { return null; }
  }
  if (AC.state === 'suspended') {
    try { void AC.resume().catch(() => { /* pre-gesture */ }); } catch { /* refused synchronously */ }
  }
  return AC;
}

/** Install the seam. Call once at boot with save-backed getters; call
    applySfxGain() again whenever the volume setting changes. */
export function initAudio(opts: { sndOn: () => boolean; sfxVol: () => number }): void {
  getSndOn = opts.sndOn;
  getSfxVol = opts.sfxVol;
  const g = globalThis as Record<string, unknown>;
  g.ac = ac;
  /* the verbatim bodies read `sfxVol` free (applySfxGain's squared taper);
     `sndOn` gates through ac() above, so only the volume needs the global */
  Object.defineProperty(g, 'sfxVol', { get: getSfxVol, configurable: true });
  initialized = true;
  applySfxGainRaw();
}
