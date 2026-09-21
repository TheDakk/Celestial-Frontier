// The morph system, step 1 (MORPH_SYSTEM_DESIGN.md §1–§2): genome → MorphParamsV1, a pure function of the genome's
// integers and the archetype's recipe hash. No clock, no Math.random, no device state (rule 1). An absent or empty
// genome yields IDENTITY params — the archetype exactly as painted.
import { hashInt } from '@cf/domain-rand';

/** v1 `SP_COLOR` order (main.js) → hue (degrees) and chroma multiplier. Low-chroma names keep the painting's hue and
 * desaturate instead; `glass-clear` is chroma 0.35 at the painting's hue. Hue jitter ±12° comes from the seed. */
export const COLOR_TABLE: ReadonlyArray<Readonly<{ name: string; hue: number | null; chroma: number }>> = Object.freeze([
  { name: 'emerald', hue: 145, chroma: 1.05 }, { name: 'crimson', hue: 350, chroma: 1.1 }, { name: 'violet', hue: 275, chroma: 1.0 }, { name: 'golden', hue: 45, chroma: 1.1 },
  { name: 'turquoise', hue: 175, chroma: 1.0 }, { name: 'indigo', hue: 245, chroma: 0.95 }, { name: 'amber', hue: 38, chroma: 1.05 }, { name: 'rust-red', hue: 15, chroma: 0.95 },
  { name: 'silver-blue', hue: 210, chroma: 0.45 }, { name: 'obsidian-black', hue: null, chroma: 0.3 }, { name: 'bone-white', hue: null, chroma: 0.25 }, { name: 'magenta', hue: 315, chroma: 1.1 },
  { name: 'teal', hue: 185, chroma: 0.9 }, { name: 'ochre', hue: 35, chroma: 0.8 }, { name: 'jade', hue: 150, chroma: 0.85 }, { name: 'bruise-purple', hue: 290, chroma: 0.7 }, { name: 'glass-clear', hue: null, chroma: 0.35 },
]);
/** Proportion envelope (M1) — scale bounds per non-contact sub-tree; a value outside is clamped and the clamp recorded. */
export const PROPORTION_ENVELOPE = Object.freeze({ head: [0.85, 1.2] as const, tail: [0.7, 1.35] as const, ears: [0.8, 1.3] as const, antennae: [0.8, 1.3] as const });
export const HUE_JITTER_DEG = 12;
export type MorphGenome = Readonly<{ seed?: number; color?: number; accent?: number; pattern?: number; head?: number; tail?: number; lumin?: boolean; [k: string]: unknown }>;
export interface PaletteParamsV1 { readonly hue: number | null; readonly chroma: number; }
export interface MorphParamsV1 {
  readonly schema: 'cf.morph-params/v1';
  readonly identity: boolean;
  readonly archetype: string;
  readonly base: PaletteParamsV1; readonly accent: PaletteParamsV1;
  readonly lumin: boolean;
  readonly proportion: Readonly<Record<'head' | 'tail' | 'ears' | 'antennae', number>>;
  readonly clamped: ReadonlyArray<Readonly<{ id: string; measured: number; clamped: number }>>;
  readonly pattern: number | null;
}
export const IDENTITY_PALETTE: PaletteParamsV1 = Object.freeze({ hue: null, chroma: 1 });
const int = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null);
const seedOf = (archetype: string, genome: MorphGenome): number => { let h = 0x811c9dc5; for (let i = 0; i < archetype.length; i++) { h ^= archetype.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return (h ^ ((int(genome.seed) ?? 0) >>> 0)) >>> 0; };
const paletteOf = (index: number | null, seed: number, lane: number): PaletteParamsV1 => {
  if (index === null) return IDENTITY_PALETTE;
  const c = COLOR_TABLE[index % COLOR_TABLE.length]!;
  if (c.hue === null) return Object.freeze({ hue: null, chroma: c.chroma });
  const jitter = ((hashInt(seed, lane, index) % 2001) / 1000 - 1) * HUE_JITTER_DEG; // deterministic in [-12, 12]
  return Object.freeze({ hue: ((c.hue + jitter) % 360 + 360) % 360, chroma: c.chroma });
};
/** A gene index (0..n-1 of its v1 table) → a scale inside the envelope, linear over the table, centred on 1 at the middle. */
const scaleOf = (index: number | null, tableLength: number, bounds: readonly [number, number]): number => {
  if (index === null) return 1;
  const u = tableLength <= 1 ? 0.5 : Math.min(1, Math.max(0, index / (tableLength - 1)));
  return bounds[0] + (bounds[1] - bounds[0]) * u;
};
export const V1_TABLE_LENGTHS = Object.freeze({ head: 8, tail: 7, pattern: 8 });
/** The painting IS its own genome: a gene equal to the archetype's own gene is the identity for that channel (the
 * crab archetype's genome says `color 12 teal` and its accepted painting is orange — the painting wins for its own
 * genome; other genomes morph RELATIVE to it). Pass the archetype record's genome as `archetypeGenome`. */
export function morphParamsV1(genome: MorphGenome | null | undefined, archetypeRecipeHash: string, archetypeGenome?: MorphGenome | null): MorphParamsV1 {
  if (typeof archetypeRecipeHash !== 'string' || !archetypeRecipeHash) throw new TypeError('morph: archetype recipe hash required');
  const g = genome ?? {}; const seed = seedOf(archetypeRecipeHash, g); const a = archetypeGenome ?? {};
  const own = (k: 'color' | 'accent' | 'head' | 'tail' | 'pattern'): number | null => { const v = int(g[k]); return v !== null && v === int(a[k]) ? null : v; };
  const color = own('color'), accent = own('accent'), head = own('head'), tail = own('tail'), pattern = own('pattern');
  const clamped: Array<{ id: string; measured: number; clamped: number }> = [];
  const clamp = (id: keyof typeof PROPORTION_ENVELOPE, v: number): number => { const [lo, hi] = PROPORTION_ENVELOPE[id]; const c = Math.min(hi, Math.max(lo, v)); if (c !== v) clamped.push({ id, measured: v, clamped: c }); return c; };
  const proportion = Object.freeze({
    head: clamp('head', scaleOf(head, V1_TABLE_LENGTHS.head, PROPORTION_ENVELOPE.head)),
    tail: clamp('tail', scaleOf(tail, V1_TABLE_LENGTHS.tail, PROPORTION_ENVELOPE.tail)),
    // ears and antennae follow the head gene (no v1 gene of their own), at a gentler slope
    ears: clamp('ears', 1 + (scaleOf(head, V1_TABLE_LENGTHS.head, PROPORTION_ENVELOPE.ears) - 1) * 0.6),
    antennae: clamp('antennae', 1 + (scaleOf(head, V1_TABLE_LENGTHS.head, PROPORTION_ENVELOPE.antennae) - 1) * 0.6),
  });
  const base = paletteOf(color, seed, 1), acc = paletteOf(accent, seed, 2), lumin = g.lumin === true && a.lumin !== true;
  const identity = base === IDENTITY_PALETTE && acc === IDENTITY_PALETTE && !lumin && pattern === null && Object.values(proportion).every((v) => v === 1);
  return Object.freeze({ schema: 'cf.morph-params/v1', identity, archetype: archetypeRecipeHash, base, accent: acc, lumin, proportion, clamped: Object.freeze(clamped), pattern: pattern === null ? null : pattern % V1_TABLE_LENGTHS.pattern });
}

/** The archetype's OWN genome for identity comparison: the fit record's `genome` block carries only motion genes
 * (size/loco/skin/head/tail/lumin…), so the visual genes come from `identity.speciesVisualKey` — the canonical
 * serialization `["object",[[key,[type,value]],…]]` of the full genome (found 2026-09-23: `color 12` read as a morph
 * because `record.genome.color` was undefined, and the striped crab filmed teal). */
export function genomeFromVisualKey(key: string): MorphGenome {
  const out: Record<string, unknown> = {};
  try { const parsed = JSON.parse(key) as unknown; if (!Array.isArray(parsed) || parsed[0] !== 'object' || !Array.isArray(parsed[1])) return Object.freeze(out);
    for (const entry of parsed[1] as unknown[]) { if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !Array.isArray(entry[1])) continue; const [type, value] = entry[1] as [string, unknown];
      if (type === 'number') out[entry[0]] = Number(value); else if (type === 'boolean') out[entry[0]] = value === true || value === 'true'; else if (type === 'string') out[entry[0]] = String(value); } } catch { /* not a visual key */ }
  return Object.freeze(out);
}
export function archetypeGenomeV1(record: { readonly genome?: MorphGenome | null; readonly identity?: { readonly speciesVisualKey?: string } }): MorphGenome {
  const fromKey = record.identity?.speciesVisualKey ? genomeFromVisualKey(record.identity.speciesVisualKey) : {};
  return Object.freeze({ ...fromKey, ...(record.genome ?? {}) });
}
