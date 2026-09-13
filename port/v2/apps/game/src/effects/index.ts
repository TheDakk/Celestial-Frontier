/* Effects module (work package A2): seeded emitter + effects sequencer on Pixi 8. */
export {
  ARENA_GROUND_LINE_Y, DEFAULT_PLACEMENT, EFFECT_ANCHORS_SCHEMA, EFFECT_PHASE_NAMES, EFFECT_PLACEMENT_SCHEMA,
  parseEffectSequenceAnchors, placeEffectSequence,
  type CanvasSize, type EffectAnchorsParse, type EffectPhaseAnchors, type EffectPhaseName, type EffectSequenceAnchors,
  type NormalizedPoint, type PhasePlacement, type PixelBounds, type PlacementOptions, type SequencePlacement, type StandPoints,
} from './anchors.js';
export {
  EMITTER_PARTICLE_CAP, EMITTER_PRESETS, alphaAt, createEmitterState, normalizeEmitterConfig, stepEmitter,
  type AlphaCurve, type EmitterConfig, type EmitterState, type Particle, type Range,
} from './emitter.js';
export {
  EFFECT_SCHEDULE_SCHEMA, MOTION_KIT_TIMING, buildEffectSchedule, clampMassClass, hitstopFor, sampleSchedule,
  type EffectDelivery, type EffectSample, type EffectSchedule, type EffectTiming, type EffectTransform, type PhaseTrack, type TrackSample,
} from './sequencer.js';
export {
  EFFECT_THEMES, EffectThemeLibrary, PAINTED_EFFECT_LABEL, PROCEDURAL_EFFECT_LABEL, PROCEDURAL_SEQUENCE_PREFIX, THEME_EMITTERS, THEME_MATERIALS,
  isEffectTheme, isProceduralImage, isProceduralSequence, proceduralAnchorsFor, type EffectTheme, type ThemeEffect, type ThemeMaterial,
} from './theme-library.js';
export { PARTICLE_DISC_SIZE, PARTICLE_RIM, particleDiscRgba } from './particle-texture.js';
export {
  EFFECT_FIXED_STEP_MS, EffectSequencePlayer, createPixiEffectHost, mirrorDirection,
  type EffectParticleContainerLike, type EffectParticleLike, type EffectPixiHost, type EffectPlayerFrame,
  type EffectSequencePlayerOptions, type EffectSpriteLike, type EffectTextureLike,
} from './pixi-adapter.js';
