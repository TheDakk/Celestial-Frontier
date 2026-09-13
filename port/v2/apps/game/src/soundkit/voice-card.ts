/* Sound Kit section 3: the voice card compiler. Emitted, never typed.
   Reads the resolved-anatomy record (template, materials), the genome (size,
   skin, temper, metab, loco, lumin, realm) and an optional system card. Pure:
   same inputs, same card. Out-of-bounds values clamp and flag; unknown
   archetypes are refused with a named reason; plants have no voice. */
import { hashInt } from '@cf/domain-rand';
import { classifyRealm, type Genome } from '@cf/domain-genome';
import { FA_LOCO, FA_SIZE, FA_SIZE_M, FA_SKIN } from '@cf/domain-speciestraits';

export const VOICE_ARCHETYPES = Object.freeze([
  'quadruped', 'hopper', 'biped-bird', 'fish', 'insect', 'arachnid', 'serpent', 'myriapod',
  'radial', 'cephalopod', 'flyer-membrane', 'primate',
] as const);
export type VoiceArchetype = typeof VOICE_ARCHETYPES[number];
export const VOICE_MATERIALS = Object.freeze([
  'furred', 'feathered', 'scaled', 'slick', 'chitinous', 'plated', 'crystalline', 'translucent', 'warty',
] as const);
export type VoiceMaterial = typeof VOICE_MATERIALS[number];
export const FOOTFALL_SETS = Object.freeze([
  'pad', 'hoof', 'claw', 'hop', 'slither', 'scuttle', 'splash', 'wingbeat', 'jet', 'roll',
] as const);
export type FootfallSet = typeof FOOTFALL_SETS[number];
export type VoiceMedium = 'none' | 'aquatic' | 'aerial' | 'gas-giant';

export const VOICE_BOUNDS = Object.freeze({
  pitchSemitones: [-12, 12], formantPercent: [-30, 30], timePercent: [70, 140],
} as const);

/** FA_SIZE order: tiny, small, dog-sized (medium), large, massive (huge), titanic. */
const SIZE_PITCH = Object.freeze([9, 5, 0, -4, -8, -12]);
const SIZE_FORMANT = Object.freeze([25, 14, 0, -10, -20, -30]);
/** FA_TEMPER order, aggression 0..1. */
const TEMPER_AGGRESSION = Object.freeze([0.2, 0.35, 1, 0.1, 0.4, 0.85, 0.3, 0.45, 0.9, 0.25]);
/** FA_METAB order, idle breaths per second. */
const METAB_BREATH_HZ = Object.freeze([0.55, 0.3, 0.22, 0.26, 0.28, 0.16]);
/** FA_LOCO order (18 entries), see speciestraits.verbatim.js. */
const LOCO_FOOTFALL: readonly FootfallSet[] = Object.freeze([
  'hoof', 'claw', 'pad', 'wingbeat', 'splash', 'jet', 'pad', 'claw', 'hoof', 'splash', 'hop', 'jet',
  'hoof', 'jet', 'slither', 'roll', 'claw', 'splash',
]);
const SURFACE_MATERIAL: Readonly<Record<string, VoiceMaterial>> = Object.freeze({
  fur: 'furred', furred: 'furred', feather: 'feathered', feathered: 'feathered', scale: 'scaled',
  scaled: 'scaled', slick: 'slick', 'slick and wet': 'slick', wet: 'slick', chitin: 'chitinous',
  chitinous: 'chitinous', plate: 'plated', plated: 'plated', crystal: 'crystalline',
  crystalline: 'crystalline', translucent: 'translucent', warty: 'warty',
});
const TEMPLATE_ARCHETYPE: Readonly<Record<string, VoiceArchetype | 'plant'>> = Object.freeze({
  quadruped: 'quadruped', 'quadruped-land': 'quadruped', hopper: 'hopper', 'biped-bird': 'biped-bird',
  bird: 'biped-bird', fish: 'fish', insect: 'insect', arachnid: 'arachnid', serpent: 'serpent',
  myriapod: 'myriapod', radial: 'radial', cephalopod: 'cephalopod', 'flyer-membrane': 'flyer-membrane',
  primate: 'primate', plant: 'plant', flora: 'plant', fungi: 'plant',
});

export interface AnatomyRecordLike {
  readonly template?: { readonly id?: unknown };
  readonly identity?: { readonly seed?: unknown; readonly speciesVisualKey?: unknown; readonly earthName?: unknown };
  readonly materials?: { readonly surface?: unknown };
}
export interface SystemCardLike {
  readonly starKind?: string;
  readonly biome?: string;
  readonly weather?: string;
  readonly water?: 'liquid' | 'frozen' | 'none';
  /** Overrides the genome-derived medium (e.g. a gas-giant arena). */
  readonly medium?: VoiceMedium;
}
/** Optional pushes (ability theme, later kit tables). Bounded by VOICE_BOUNDS. */
export interface VoiceCardOverrides {
  readonly pitchSemitones?: number;
  readonly formantPercent?: number;
  readonly timePercent?: number;
}

export interface VoiceCard {
  readonly schema: 'cf.soundkit.voice-card/v1';
  readonly speciesVisualKey: string;
  readonly archetype: VoiceArchetype;
  readonly sizeClass: string;
  readonly pitchSemitones: number;
  readonly formantPercent: number;
  readonly timePercent: number;
  readonly thudGain: number;
  readonly material: VoiceMaterial;
  readonly aggression: number;
  readonly breathHz: number;
  readonly footfall: FootfallSet;
  readonly medium: VoiceMedium;
  readonly luminous: boolean;
  readonly seed: number;
  readonly flags: readonly string[];
}
export type VoiceCardResult =
  | Readonly<{ ok: true; card: VoiceCard }>
  | Readonly<{ ok: false; reason: string }>;

function clampFlag(value: number, [lo, hi]: readonly [number, number], name: string, flags: string[]): number {
  if (!Number.isFinite(value)) { flags.push(`${name}-invalid`); return lo <= 0 && hi >= 0 ? 0 : lo; }
  if (value < lo) { flags.push(`${name}-clamped`); return lo; }
  if (value > hi) { flags.push(`${name}-clamped`); return hi; }
  return value;
}
const idx = (v: unknown, n: number): number => (typeof v === 'number' && Number.isFinite(v) ? ((Math.trunc(v) % n) + n) % n : 0);

export function compileVoiceCard(
  record: AnatomyRecordLike,
  genome?: Genome | null,
  systemCard?: SystemCardLike | null,
  overrides?: VoiceCardOverrides | null,
): VoiceCardResult {
  const templateId = record?.template?.id;
  if (typeof templateId !== 'string' || templateId.length === 0) return { ok: false, reason: 'missing-template-id' };
  const archetype = TEMPLATE_ARCHETYPE[templateId];
  if (archetype === undefined) return { ok: false, reason: `unknown-archetype:${templateId}` };
  if (archetype === 'plant') return { ok: false, reason: 'no-voice:plants' };
  const flags: string[] = [];
  const g = genome ?? null;
  if (g !== null && g.kingdom !== 'fauna') return { ok: false, reason: `no-voice:${String(g.kingdom)}` };

  const sizeIndex = g === null ? 2 : idx(g.size, FA_SIZE.length);
  if (g === null) flags.push('size-defaulted-medium');
  const surface = record.materials?.surface;
  let material: VoiceMaterial | undefined = typeof surface === 'string' ? SURFACE_MATERIAL[surface.toLowerCase()] : undefined;
  if (material === undefined && g !== null) material = SURFACE_MATERIAL[FA_SKIN[idx(g.skin, FA_SKIN.length)] ?? ''];
  if (material === undefined) { material = 'furred'; flags.push('material-defaulted-furred'); }
  const aggression = g === null ? 0.4 : TEMPER_AGGRESSION[idx(g.temper, TEMPER_AGGRESSION.length)] ?? 0.4;
  const breathHz = g === null ? 0.3 : METAB_BREATH_HZ[idx(g.metab, METAB_BREATH_HZ.length)] ?? 0.3;
  let footfall: FootfallSet = LOCO_FOOTFALL[g === null ? 2 : idx(g.loco, FA_LOCO.length)] ?? 'pad';
  if (g !== null && g.x) footfall = 'scuttle';
  let medium: VoiceMedium = 'none';
  if (g !== null) {
    const realm = classifyRealm(g);
    medium = realm === 'Aquatic Fauna' ? 'aquatic' : realm === 'Aerial Fauna' ? 'aerial' : realm === 'Gas Giant Life' ? 'gas-giant' : 'none';
  }
  if (systemCard?.medium !== undefined) medium = systemCard.medium;

  const pitch = clampFlag((SIZE_PITCH[sizeIndex] ?? 0) + (overrides?.pitchSemitones ?? 0), VOICE_BOUNDS.pitchSemitones, 'pitch', flags);
  const formant = clampFlag((SIZE_FORMANT[sizeIndex] ?? 0) + (overrides?.formantPercent ?? 0), VOICE_BOUNDS.formantPercent, 'formant', flags);
  /* aggressive individuals deliver shorter, sharper cues: 90..110 percent */
  const timeBase = Math.round(100 + (0.5 - aggression) * 20);
  const time = clampFlag(timeBase + (overrides?.timePercent ?? 0), VOICE_BOUNDS.timePercent, 'time', flags);

  const identitySeed = typeof record.identity?.seed === 'number' ? record.identity.seed : 0;
  const baseSeed = g !== null && typeof g.seed === 'number' ? g.seed : identitySeed;
  const seed = hashInt(baseSeed >>> 0, VOICE_ARCHETYPES.indexOf(archetype), 0xA4);
  const key = typeof record.identity?.speciesVisualKey === 'string' ? record.identity.speciesVisualKey
    : `genome:${baseSeed >>> 0}`;
  return {
    ok: true,
    card: Object.freeze({
      schema: 'cf.soundkit.voice-card/v1', speciesVisualKey: key, archetype,
      sizeClass: FA_SIZE[sizeIndex] ?? 'dog-sized', pitchSemitones: pitch, formantPercent: formant,
      timePercent: time, thudGain: FA_SIZE_M[sizeIndex] ?? 0.62, material, aggression, breathHz, footfall,
      medium, luminous: g !== null && g.lumin === true, seed, flags: Object.freeze(flags.slice()),
    }),
  };
}
