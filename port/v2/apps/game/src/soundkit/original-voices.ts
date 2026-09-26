/* @module soundkit/original-voices [domain] — the ORIGINAL creature source library (D15, Claude 2026-09-26): one source set per voice
   archetype in the kit's shape (call ×2 takes, alert, attack-vocal, hurt, faint, victory, breath-idle, land-thud, footfall, tame-settle,
   feed-chew), the ten footfall sets and the nine material textures shared by every archetype. Every source is rendered by
   `organic.ts` from a fixed seed; `deriveCue` turns them into each creature's own voice through its voice card, exactly as it did the
   placeholder masters. Provenance: generator `cf-soundkit-original-v1`, seed per source (`sourceSeedV1`), output hash in the manifest
   (`originalSourceManifestV1`) and in AUDIO_LICENSES.md. Lazy: an archetype's set is rendered on first use and kept (a battle needs two). */
import { hashInt } from '@cf/domain-rand';
import { sha256Hex, type SourceLibrary, type SourceSet } from './derive.js';
import { FOOTFALL_SETS, VOICE_ARCHETYPES, VOICE_MATERIALS } from './voice-card.js';
import {
  breathing, bubbles, clicks, curve, drumming, glottal, hiss, len, lowpass, highpass, mix, mixInto, modal, mulCurve, normalize, pink,
  purr, resonate, shape, stridulate, syrinx, thud, whoosh, white, brown, type Formant,
} from './organic.js';
import { synthesizePlaceholderLibrary } from './placeholder-archetype.js';

export const ORIGINAL_SOURCE_GENERATOR = 'cf-soundkit-original-v1' as const;
export const ORIGINAL_SOURCE_RIGHTS = 'original, CC0 by the project (procedural generator in this repository)' as const;
const BASE_SEED = 0x5ca1ab1e;
/** The seed of one source: deterministic from its archetype and key (stable across releases; a key's seed never depends on order). */
export function sourceSeedV1(archetype: string, key: string): number { let h = BASE_SEED; for (const ch of `${archetype}/${key}`) h = hashInt(h, ch.charCodeAt(0), 0x9e37) >>> 0; return h >>> 0; }

type Src = Float32Array | readonly Float32Array[];
type Builder = (seed: (key: string) => number) => Readonly<Record<string, Src>>;
const F = (f: number, bw: number, g: number): Formant => Object.freeze({ f, bw, g });

/* ---------- shared: footfalls and material textures (the same bytes in every archetype's set) ---------- */
const SHARED = 'shared';
const s = (key: string): number => sourceSeedV1(SHARED, key);
function footfallSet(set: string): Float32Array {
  const seed = s(`footfall:${set}`);
  switch (set) {
    case 'pad': return normalize(mix(len(0.12), [[thud(0.12, 0.5, seed), 0.8], [shape(lowpass(pink(len(0.08), seed ^ 1), 1400), 0.002, 0.06), 0.35]]), 0.8);
    case 'hoof': return normalize(mix(len(0.16), [[modal(0.16, 340, [{ ratio: 1, decay: 0.04, amp: 1 }, { ratio: 2.7, decay: 0.02, amp: 0.4 }], 0.9, seed), 1], [thud(0.14, 1.2, seed ^ 2), 0.6]]), 0.85);
    case 'claw': return normalize(mix(len(0.08), [[clicks(0.05, 2, 2600, seed), 0.8], [thud(0.08, 0.4, seed ^ 3), 0.35]]), 0.8);
    case 'hop': return normalize(mix(len(0.2), [[thud(0.2, 0.7, seed), 1], [shape(lowpass(white(len(0.06), seed ^ 4), 900), 0.004, 0.05), 0.3, len(0.02)]]), 0.8);
    case 'slither': return normalize(shape(resonate(white(len(0.3), seed), 1500, 1400), 0.08, 0.14), 0.75);
    case 'scuttle': return normalize(clicks(0.12, 5, 3100, seed), 0.75);
    case 'splash': return normalize(mix(len(0.22), [[shape(lowpass(white(len(0.18), seed), 2600), 0.002, 0.14), 0.8], [bubbles(0.22, 30, 1.2, 4, seed ^ 5), 0.35]]), 0.8);
    case 'wingbeat': return normalize(whoosh(0.14, 350, 180, 300, seed), 0.75);
    case 'jet': return normalize(mix(len(0.3), [[whoosh(0.3, 500, 220, 500, seed), 0.8], [bubbles(0.3, 25, 1, 3, seed ^ 6), 0.3]]), 0.8);
    case 'roll': return normalize(shape(lowpass(brown(len(0.35), seed), 260), 0.05, 0.12), 0.8);
    default: throw new RangeError(`no footfall set ${set}`);
  }
}
function texture(material: string): Float32Array {
  const seed = s(`texture:${material}`), n = len(0.6);
  switch (material) {
    case 'furred': return normalize(lowpass(pink(n, seed), 1300), 0.7);
    case 'feathered': return normalize(mulCurve(highpass(white(n, seed), 1800), Float32Array.from({ length: n }, (_, i) => 0.5 + 0.5 * Math.sin(i / 480) ** 2)), 0.6);
    case 'scaled': return normalize(resonate(white(n, seed), 2600, 1800), 0.6);
    case 'slick': return normalize(mix(n, [[lowpass(white(n, seed), 1600), 0.5], [bubbles(0.6, 22, 0.8, 2.5, seed ^ 7), 0.6]]), 0.65);
    case 'chitinous': return normalize(clicks(0.6, 12, 3600, seed), 0.6);
    case 'plated': return normalize(modal(0.6, 610, [{ ratio: 1, decay: 0.3, amp: 1 }, { ratio: 2.76, decay: 0.22, amp: 0.6 }, { ratio: 5.4, decay: 0.12, amp: 0.35 }, { ratio: 8.93, decay: 0.08, amp: 0.2 }], 0.3, seed), 0.6);
    case 'crystalline': return normalize(modal(0.6, 1840, [{ ratio: 1, decay: 0.35, amp: 1 }, { ratio: 2.32, decay: 0.3, amp: 0.7 }, { ratio: 4.25, decay: 0.2, amp: 0.4 }, { ratio: 6.63, decay: 0.12, amp: 0.25 }], 0.1, seed), 0.55);
    case 'translucent': return normalize(mix(n, [[lowpass(brown(n, seed), 500), 0.7], [bubbles(0.6, 8, 3, 7, seed ^ 8), 0.5]]), 0.6);
    case 'warty': return normalize(mix(n, [[bubbles(0.6, 14, 2, 6, seed), 0.7], [lowpass(white(n, seed ^ 9), 800), 0.3]]), 0.6);
    default: throw new RangeError(`no texture ${material}`);
  }
}
let sharedCache: Readonly<Record<string, Float32Array>> | null = null;
function shared(): Readonly<Record<string, Float32Array>> {
  if (sharedCache) return sharedCache;
  const out: Record<string, Float32Array> = {};
  for (const set of FOOTFALL_SETS) out[`footfall:${set}`] = footfallSet(set);
  for (const m of VOICE_MATERIALS) out[`texture:${m}`] = texture(m);
  return (sharedCache = Object.freeze(out));
}

/* ---------- a crunching mouthful, shared shape ---------- */
function chew(seconds: number, bite: number, seed: number): Float32Array {
  const n = len(seconds), y = new Float32Array(n), chews = Math.max(2, Math.round(seconds * 3.2));
  for (let c = 0; c < chews; c++) { const at = Math.round((c / chews) * n), grit = shape(resonate(white(len(0.09), seed + c), bite, bite * 0.9), 0.003, 0.06); mixInto(y, grit, 0.8, at); mixInto(y, clicks(0.06, 3, bite * 1.4, (seed ^ 0x40) + c), 0.4, at); }
  return normalize(y, 0.85);
}

/* ---------- the archetypes ---------- */
/** Mammal throat (civet/fox/dog-sized carnivore): a four-formant tract; bark, growl, yelp, sigh, howl, purr. */
const quadruped: Builder = (sd) => {
  const tract = [F(620, 90, 1), F(1320, 110, 0.7), F(2650, 180, 0.35), F(3600, 260, 0.15)];
  return {
    call: [glottal({ seconds: 0.9, f0: [[0, 180], [0.35, 265], [1, 170]], formants: tract, tract: [[0, 0.95], [0.4, 1.15], [1, 0.9]], breath: 0.25, seed: sd('call#1') }),
      glottal({ seconds: 1.0, f0: [[0, 170], [0.5, 245], [1, 160]], formants: tract, tract: [[0, 0.9], [0.5, 1.1], [1, 0.88]], breath: 0.3, jitter: 0.018, seed: sd('call#2') })],
    alert: glottal({ seconds: 0.32, f0: [[0, 310], [0.3, 330], [1, 240]], formants: tract, tract: [[0, 1.2], [1, 1]], open: 0.4, breath: 0.3, attack: 0.004, release: 0.12, seed: sd('alert') }),
    'attack-vocal': glottal({ seconds: 0.7, f0: [[0, 95], [0.4, 135], [1, 88]], formants: tract, tract: [[0, 0.85], [0.5, 1.05], [1, 0.9]], open: 0.45, sub: 0.8, rough: 0.6, breath: 0.35, attack: 0.01, seed: sd('attack-vocal') }),
    hurt: glottal({ seconds: 0.45, f0: [[0, 430], [0.25, 660], [1, 300]], formants: tract, tract: [[0, 1.2], [1, 1]], open: 0.45, breath: 0.3, attack: 0.004, seed: sd('hurt') }),
    faint: glottal({ seconds: 1.4, f0: [[0, 250], [0.4, 210], [1, 130]], formants: tract, tract: [[0, 1], [1, 0.78]], breath: 0.55, jitter: 0.03, seed: sd('faint') }),
    victory: glottal({ seconds: 1.1, f0: [[0, 200], [0.6, 330], [1, 300]], formants: tract, tract: [[0, 0.9], [0.5, 1.2], [1, 1.1]], breath: 0.2, seed: sd('victory') }),
    'breath-idle': breathing(1.6, 0.9, tract, sd('breath-idle')),
    'land-thud': thud(0.3, 1, sd('land-thud')),
    footfall: footfallSet('pad'),
    'tame-settle': purr(0.9, 25, tract, sd('tame-settle')),
    'feed-chew': chew(0.35, 2100, sd('feed-chew')),
  };
};

const BUILDERS: Readonly<Record<string, Builder>> = Object.freeze({ quadruped });
/** Archetypes that have ORIGINAL sources today; the rest still draw from the labelled placeholder until their set lands. */
export const ORIGINAL_ARCHETYPES: readonly string[] = Object.freeze(Object.keys(BUILDERS));

function buildSet(archetype: string): SourceSet {
  const b = BUILDERS[archetype]; if (!b) throw new RangeError(`no original source set for ${archetype}`);
  return Object.freeze({ ...shared(), ...b((key) => sourceSeedV1(archetype, key)) });
}

export interface OriginalSourceLibrary { readonly generator: typeof ORIGINAL_SOURCE_GENERATOR; readonly rights: typeof ORIGINAL_SOURCE_RIGHTS; readonly original: readonly string[]; readonly sources: SourceLibrary }
/** The library the player hears: an ORIGINAL set for every archetype in ORIGINAL_ARCHETYPES and, until the rest land, the labelled
 *  placeholder set for the others (listed in `original` so the Listening page and tests can tell them apart). Lazy per archetype. */
export function originalSourceLibraryV1(): OriginalSourceLibrary {
  const sources: Record<string, SourceSet> = {}, cache = new Map<string, SourceSet>(); let placeholder: SourceLibrary | null = null;
  for (const a of VOICE_ARCHETYPES) Object.defineProperty(sources, a, { enumerable: true, get: () => {
    let v = cache.get(a); if (v) return v;
    v = BUILDERS[a] ? buildSet(a) : (placeholder ??= synthesizePlaceholderLibrary().sources)[a]!; cache.set(a, v); return v; } });
  return Object.freeze({ generator: ORIGINAL_SOURCE_GENERATOR, rights: ORIGINAL_SOURCE_RIGHTS, original: ORIGINAL_ARCHETYPES, sources: Object.freeze(sources) });
}
const bytes = (x: Float32Array): Uint8Array => new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
export interface SourceManifestRowV1 { readonly archetype: string; readonly key: string; readonly take: number; readonly seed: number; readonly samples: number; readonly sha256: string }
/** Provenance: every original source's seed and output hash (the AUDIO_LICENSES.md rows are generated from this). */
export function originalSourceManifestV1(archetypes: readonly string[] = ORIGINAL_ARCHETYPES): readonly SourceManifestRowV1[] {
  const rows: SourceManifestRowV1[] = [];
  for (const a of archetypes) { const set = buildSet(a);
    for (const key of Object.keys(set).sort()) { const v = set[key]!, takes = v instanceof Float32Array ? [v] : v, owner = key.startsWith('footfall:') || key.startsWith('texture:') ? SHARED : a;
      takes.forEach((x, i) => rows.push(Object.freeze({ archetype: owner, key, take: i, seed: sourceSeedV1(owner, key), samples: x.length, sha256: sha256Hex(bytes(x)) }))); } }
  const seen = new Set<string>(); return Object.freeze(rows.filter((r) => { const k = `${r.archetype}/${r.key}/${r.take}`; if (seen.has(k)) return false; seen.add(k); return true; }));
}
void drumming; void syrinx; void stridulate; void hiss; void curve;
