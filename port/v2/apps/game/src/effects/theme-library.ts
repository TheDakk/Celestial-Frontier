/** @module effects/theme-library [domain] — one effect per ability theme (Art Kit §4K theme material
 * table, eleven closed keys). A theme with an accepted painted sequence (anchors JSON + registered
 * phase images) plays that sequence; every other theme plays a LABELLED procedural emitter effect
 * whose particles carry the theme's material colour, so no attack is ever silent on screen. The
 * procedural anchors are a real `cf.effect-sequence-anchors/v1` record (they pass the same parser)
 * with image names under `procedural/`, so the sequencer and the turn choreography treat both kinds
 * identically; only the stage knows a procedural phase has no sprite. No clock, no randomness. */
import { EFFECT_ANCHORS_SCHEMA, parseEffectSequenceAnchors, type EffectPhaseName, type EffectSequenceAnchors } from './anchors.js';
import { EMITTER_PRESETS, PHONE_PARTICLE_SCALE, normalizeEmitterConfig, scaleEmitterBudget, type EmitterConfig } from './emitter.js';

export type EffectTier = 'desktop' | 'phone';

export const EFFECT_THEMES = Object.freeze(['fire', 'frost', 'storm', 'tide', 'stone', 'venom', 'void', 'sand', 'chem', 'psionic', 'wild'] as const);
export type EffectTheme = (typeof EFFECT_THEMES)[number];
export const isEffectTheme = (v: unknown): v is EffectTheme => typeof v === 'string' && (EFFECT_THEMES as readonly string[]).includes(v);
export const PROCEDURAL_SEQUENCE_PREFIX = 'procedural-' as const;
export const PROCEDURAL_EFFECT_LABEL = 'procedural emitter effect (labelled; no painted sequence for this theme yet)' as const;
export const PAINTED_EFFECT_LABEL = 'painted sequence' as const;

/** Art Kit §4K: material carries the identity (body tint of the particles); the game hex is an accent only. */
export interface ThemeMaterial { readonly tint: number; readonly accent: number; readonly vocabulary: string; }
export const THEME_MATERIALS: Readonly<Record<EffectTheme, ThemeMaterial>> = Object.freeze({
  fire: { tint: 0xf2a060, accent: 0xff7a4a, vocabulary: 'flame tongues, embers, char, heat shimmer as shape' },
  frost: { tint: 0xdff3ff, accent: 0x8fd6ff, vocabulary: 'ice shards, rime, frozen mist, crystal shatter' },
  storm: { tint: 0xf4f0d8, accent: 0xffe06a, vocabulary: 'forked arcs, charged dust, cloud rupture' },
  tide: { tint: 0xd8f4f0, accent: 0x5fd0c8, vocabulary: 'water sheets, spray, foam crest' },
  stone: { tint: 0xb89a74, accent: 0xcaa06a, vocabulary: 'rock shards, grit, cracked ground' },
  venom: { tint: 0xb8e28c, accent: 0x9fe06a, vocabulary: 'droplets, spatter, corroding film' },
  void: { tint: 0x2a2038, accent: 0xb58cff, vocabulary: 'torn dark, inhaled debris, collapse ring' },
  sand: { tint: 0xe0c48a, accent: 0xe8c878, vocabulary: 'grain streams, scour, dune spill' },
  chem: { tint: 0xdcffb0, accent: 0xc0ff5a, vocabulary: 'fizzing foam, reactive spray, etched surface' },
  psionic: { tint: 0xf6dcf0, accent: 0xff9fe0, vocabulary: 'concentric ripples, warped air, snap ring' },
  wild: { tint: 0x8a6a42, accent: 0x9fb6d6, vocabulary: 'claw rake, fur tufts, torn leaves, kicked earth, wind streaks; warm ochre and earth tones' },
});

type Phases = Readonly<Record<EffectPhaseName, EmitterConfig>>;
const UP = -Math.PI / 2;
const ph = (over: Readonly<{ launch?: Partial<EmitterConfig>; travel?: Partial<EmitterConfig>; impact?: Partial<EmitterConfig> }>): Phases => Object.freeze({
  launch: normalizeEmitterConfig({ ...EMITTER_PRESETS.launch, ...over.launch, phase: 'launch' }),
  travel: normalizeEmitterConfig({ ...EMITTER_PRESETS.travel, ...over.travel, phase: 'travel' }),
  impact: normalizeEmitterConfig({ ...EMITTER_PRESETS.impact, ...over.impact, phase: 'impact' }),
});
/** Motion Kit §7 phase shapes per theme material: what the particles DO (rise, fall, scour, collapse, ripple). Speeds per arena width.
 * Sizes are pixels at the 1024 arena: the ten procedural themes carry the whole effect in their particles until their sequences are painted, so they run about 2.5x the Wild grit. */
export const THEME_EMITTERS: Readonly<Record<EffectTheme, Phases>> = Object.freeze({
  fire: ph({ launch: { gravity: -0.4, speed: [0.1, 0.35], drag: 2, lifeMs: [220, 380], size: [5, 12] }, travel: { rate: 360, gravity: -0.3, lifeMs: [150, 260], size: [4, 10] }, impact: { gravity: -0.25, drag: 1.6, speed: [0.25, 0.9], lifeMs: [260, 520], size: [5, 17] } }),
  frost: ph({ launch: { burst: 30, gravity: 0.9, speed: [0.1, 0.3], size: [5, 15] }, travel: { rate: 240, gravity: 0.4, size: [4, 10] }, impact: { gravity: 2.2, drag: 0.8, speed: [0.3, 1.0], size: [5, 20] } }),
  storm: ph({ launch: { speed: [0.4, 0.9], spreadRad: 1.2, gravity: 0, drag: 4, lifeMs: [80, 160], size: [5, 12] }, travel: { rate: 420, speed: [0.1, 0.3], lifeMs: [60, 120], gravity: 0, size: [4, 10] }, impact: { speed: [0.6, 1.4], gravity: 0.5, drag: 2, lifeMs: [120, 260], size: [5, 17] } }),
  tide: ph({ launch: { gravity: 1.2, speed: [0.2, 0.5], size: [5, 12] }, travel: { rate: 320, gravity: 0.8, size: [4, 10] }, impact: { directionRad: UP, spreadRad: 1.2, speed: [0.3, 0.9], gravity: 2.6, lifeMs: [240, 480], alphaCurve: 'ease-out', size: [5, 15] } }),
  stone: ph({ launch: { burst: 28, speed: [0.1, 0.3], gravity: 1.8, size: [5, 15] }, travel: { rate: 200, gravity: 1.2, size: [5, 12.5] }, impact: { speed: [0.2, 0.7], gravity: 2.4, drag: 1, lifeMs: [300, 600], size: [7.5, 22.5] } }),
  venom: ph({ launch: { burst: 24, gravity: 1.0, size: [5, 10] }, travel: { rate: 260, gravity: 0.9, lifeMs: [160, 280], size: [4, 10] }, impact: { maxParticles: 90, burst: 90, spreadRad: 1.1, gravity: 2.0, lifeMs: [260, 520], alphaCurve: 'ease-out', size: [5, 15] } }),
  void: ph({ launch: { directionRad: Math.PI, speed: [0.2, 0.5], drag: 5, gravity: 0, lifeMs: [200, 360], size: [5, 12] }, travel: { rate: 200, speed: [0.02, 0.06], gravity: -0.1, size: [4, 10] }, impact: { directionRad: 0, spreadRad: Math.PI, speed: [0.5, 0.9], gravity: 0, drag: 6, lifeMs: [200, 400], size: [5, 12.5] } }),
  sand: ph({ launch: { speed: [0.2, 0.5], spreadRad: 0.4, gravity: 0.9, size: [3.75, 8.75] }, travel: { rate: 400, lifeMs: [100, 180], spreadRad: 0.3, size: [2.5, 7.5] }, impact: { directionRad: 0, spreadRad: 0.9, speed: [0.3, 0.9], gravity: 1.2, drag: 1.5, lifeMs: [220, 420], alphaCurve: 'linear', size: [3.75, 10] } }),
  chem: ph({ launch: { burst: 32, gravity: -0.6, speed: [0.05, 0.2], size: [3.75, 10], lifeMs: [200, 400] }, travel: { rate: 300, gravity: -0.4, size: [4, 10] }, impact: { gravity: -0.5, spreadRad: 1.4, speed: [0.15, 0.5], lifeMs: [300, 600], alphaCurve: 'ease-out', size: [5, 15] } }),
  psionic: ph({ launch: { burst: 24, speed: [0.05, 0.15], drag: 4, gravity: 0, spreadRad: Math.PI, size: [7.5, 20], lifeMs: [260, 420] }, travel: { rate: 120, speed: [0.01, 0.04], gravity: 0, size: [10, 25] }, impact: { maxParticles: 60, burst: 60, directionRad: 0, spreadRad: Math.PI, speed: [0.3, 0.5], drag: 3, gravity: 0, lifeMs: [200, 340], size: [10, 30] } }),
  wild: ph({}),
});

/** A parseable anchors record for a theme with no painted sequence. Image names live under `procedural/` and never resolve to a texture. */
export function proceduralAnchorsFor(theme: EffectTheme): EffectSequenceAnchors {
  const size = { width: 1024, height: 1024 }, origin = [0.2, 0.55] as const, contact = [0.8, 0.55] as const;
  const phase = (name: EffectPhaseName, bounds: { x: number; y: number; width: number; height: number }) => ({
    phase: name, image: `procedural/${theme}/${name}.none`, keyedImage: `procedural/${theme}/${name}.none`, canvasSize: size, originAnchor: origin, contactAnchor: contact, alphaBoundsPixels: bounds,
  });
  const raw = {
    schema: EFFECT_ANCHORS_SCHEMA, sequenceId: `${PROCEDURAL_SEQUENCE_PREFIX}${theme}-v1`, theme, phaseOrder: ['launch', 'travel', 'impact'], canvasSize: size, originAnchor: origin, contactAnchor: contact,
    phases: [phase('launch', { x: 150, y: 400, width: 240, height: 240 }), phase('travel', { x: 130, y: 340, width: 700, height: 380 }), phase('impact', { x: 560, y: 380, width: 320, height: 300 })],
  };
  const parsed = parseEffectSequenceAnchors(raw);
  if (!parsed.ok) throw new Error(`procedural anchors for ${theme} refused: ${parsed.reason}`);
  return parsed.anchors;
}
export const isProceduralSequence = (anchors: Pick<EffectSequenceAnchors, 'sequenceId'>): boolean => anchors.sequenceId.startsWith(PROCEDURAL_SEQUENCE_PREFIX);
export const isProceduralImage = (name: string): boolean => name.startsWith('procedural/');

export interface ThemeEffect {
  readonly theme: EffectTheme;
  /** The accepted painted sequence, or null when the theme plays the procedural effect. */
  readonly painted: EffectSequenceAnchors | null;
  /** What the choreography schedules: painted anchors when present, procedural otherwise. */
  readonly anchors: EffectSequenceAnchors;
  readonly emitters: Phases;
  readonly material: ThemeMaterial;
  readonly label: typeof PAINTED_EFFECT_LABEL | typeof PROCEDURAL_EFFECT_LABEL;
}

/** Painted sequences by theme (at most one per theme, theme must be a kit key); everything else is procedural. */
export class EffectThemeLibrary {
  readonly #painted = new Map<EffectTheme, EffectSequenceAnchors>();
  constructor(painted: Iterable<EffectSequenceAnchors> = []) {
    for (const a of painted) {
      if (!isEffectTheme(a.theme)) throw new TypeError(`theme library: "${a.theme}" is not a kit theme (${EFFECT_THEMES.join(', ')})`);
      if (isProceduralSequence(a)) throw new TypeError(`theme library: "${a.sequenceId}" is a procedural record, not a painted sequence`);
      if (this.#painted.has(a.theme)) throw new TypeError(`theme library: theme "${a.theme}" already has a painted sequence (${this.#painted.get(a.theme)!.sequenceId})`);
      this.#painted.set(a.theme, a);
    }
  }
  paintedThemes(): readonly EffectTheme[] { return Object.freeze([...this.#painted.keys()]); }
  resolve(theme: string): ThemeEffect {
    if (!isEffectTheme(theme)) throw new TypeError(`theme library: unknown theme "${String(theme)}"`);
    const painted = this.#painted.get(theme) ?? null;
    return Object.freeze({ theme, painted, anchors: painted ?? proceduralAnchorsFor(theme), emitters: THEME_EMITTERS[theme], material: THEME_MATERIALS[theme], label: painted ? PAINTED_EFFECT_LABEL : PROCEDURAL_EFFECT_LABEL });
  }
  anchorsFor(theme: string): EffectSequenceAnchors { return this.resolve(theme).anchors; }
  /** Phase emitters for the theme; the phone tier runs the same shapes at half the particle budget (kit §8). */
  emittersFor(theme: string, tier: EffectTier = 'desktop'): Phases {
    const base = this.resolve(theme).emitters;
    if (tier === 'desktop') return base;
    if (tier !== 'phone') throw new TypeError(`theme library: unknown tier "${String(tier)}"`);
    return Object.freeze({ launch: scaleEmitterBudget(base.launch, PHONE_PARTICLE_SCALE), travel: scaleEmitterBudget(base.travel, PHONE_PARTICLE_SCALE), impact: scaleEmitterBudget(base.impact, PHONE_PARTICLE_SCALE) });
  }
  tintFor(theme: string): number { return this.resolve(theme).material.tint; }
}
