/** @module effects/painted-theme-registry [domain] — the data-driven routing from an ability theme to its painted
 * effect sequence (Art Kit §4K). One manifest row per painted theme (`painted-themes.json`, schema
 * `cf.painted-theme-manifest/v1`) names the theme's anchors JSON; the anchors name the phase images. A theme
 * with an admitted row plays its painted sequence; every other theme plays the labelled procedural emitter
 * and carries an EXPLICIT reason (no row, anchors refused, theme mismatch, phase image missing or the
 * wrong size). Registering a delivered theme is one manifest row: no code change.
 *
 * Paths: every manifest path is relative to the battle2 asset root (the arena proof directory), the same
 * convention as `BATTLE2_PARTS_FITS`; phase image names inside an anchors JSON are relative to that JSON's
 * own directory. The Wild row (anchors at the root) therefore resolves to exactly the paths it always used.
 *
 * A `required` row fails the whole study when it cannot load (Wild: the behaviour before this registry);
 * any other row falls back to procedural with its reason. Only Wild may carry the grandfathered v4.2
 * contract; every new row is a v4.3 delivery (1024-square phases, validated by `theme-delivery.ts`).
 * No clock, no randomness; the loaders take injected fetchers. */
import { EFFECT_PHASE_NAMES, parseEffectSequenceAnchors, type EffectSequenceAnchors } from './anchors.js';
import { EFFECT_THEMES, NO_PAINTED_ROW_REASON, isEffectTheme, isProceduralSequence, type EffectTheme } from './theme-library.js';
export { NO_PAINTED_ROW_REASON };

export const PAINTED_THEME_MANIFEST_SCHEMA = 'cf.painted-theme-manifest/v1' as const;
export const PAINTED_THEME_CONTRACTS = Object.freeze(['v4.3', 'v4.2-grandfathered'] as const);
export type PaintedThemeContract = (typeof PAINTED_THEME_CONTRACTS)[number];
/** The only theme allowed the grandfathered contract: the accepted Wild sequence the game shipped before the registry. */
export const GRANDFATHERED_THEME: EffectTheme = 'wild';
/** Art Kit §5: an Effects phase master is 1024 square. */
export const PAINTED_PHASE_CANVAS = 1024 as const;

export interface PaintedThemeRow {
  readonly theme: EffectTheme;
  /** The anchors JSON, relative to the battle2 asset root. */
  readonly anchors: string;
  readonly contract: PaintedThemeContract;
  readonly required: boolean;
}

const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const PATH_RE = /^(\.\.\/)*[A-Za-z0-9][A-Za-z0-9._\/-]*$/;

/** Parse the manifest. The manifest is committed repo data, so a malformed one throws (a build/test failure), never a silent fallback. */
export function parsePaintedThemeManifest(input: unknown): readonly PaintedThemeRow[] {
  if (!isRec(input)) throw new TypeError('painted-theme manifest: expected an object');
  if (input.schema !== PAINTED_THEME_MANIFEST_SCHEMA) throw new TypeError(`painted-theme manifest: schema must be ${PAINTED_THEME_MANIFEST_SCHEMA}`);
  if (!Array.isArray(input.rows)) throw new TypeError('painted-theme manifest: rows must be an array');
  const seen = new Set<string>();
  return Object.freeze(input.rows.map((raw: unknown, i: number): PaintedThemeRow => {
    const at = `painted-theme manifest rows[${i}]`;
    if (!isRec(raw)) throw new TypeError(`${at}: expected an object`);
    const { theme, anchors, contract } = raw;
    if (!isEffectTheme(theme)) throw new TypeError(`${at}.theme: "${String(theme)}" is not a kit theme (${EFFECT_THEMES.join(', ')})`);
    if (seen.has(theme)) throw new TypeError(`${at}.theme: "${theme}" already has a row`);
    seen.add(theme);
    if (typeof anchors !== 'string' || !PATH_RE.test(anchors) || !anchors.endsWith('.json') || anchors.split('/').some((s) => s === '.')) throw new TypeError(`${at}.anchors: expected a relative path to an anchors .json`);
    if (!(PAINTED_THEME_CONTRACTS as readonly unknown[]).includes(contract)) throw new TypeError(`${at}.contract: expected one of ${PAINTED_THEME_CONTRACTS.join(', ')}`);
    if (contract === 'v4.2-grandfathered' && theme !== GRANDFATHERED_THEME) throw new TypeError(`${at}.contract: only ${GRANDFATHERED_THEME} is grandfathered; a new theme is a v4.3 delivery`);
    if (raw.required !== undefined && typeof raw.required !== 'boolean') throw new TypeError(`${at}.required: expected a boolean`);
    return Object.freeze({ theme, anchors, contract: contract as PaintedThemeContract, required: raw.required === true });
  }));
}

/** A phase image name resolved against its anchors JSON's directory (posix, `..` kept only as a leading climb). */
export function paintedAssetPath(anchorsPath: string, image: string): string {
  const slash = anchorsPath.lastIndexOf('/');
  const joined = (slash >= 0 ? anchorsPath.slice(0, slash + 1) : '') + image;
  const out: string[] = [];
  for (const seg of joined.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..' && out.length > 0 && out[out.length - 1] !== '..') out.pop(); else out.push(seg);
  }
  return out.join('/');
}

export interface PaintedThemeAnchorsStage {
  readonly rows: readonly PaintedThemeRow[];
  /** Admitted anchors per theme, with each phase's resolved asset path (phase order). */
  readonly admitted: ReadonlyMap<EffectTheme, Readonly<{ row: PaintedThemeRow; anchors: EffectSequenceAnchors; phasePaths: readonly string[] }>>;
  readonly refused: ReadonlyMap<EffectTheme, string>;
}

/** The anchors-level admission of one row (no pixels): parse, theme agreement, painted not procedural, and for a v4.3
 * row exactly launch/travel/impact on a 1024-square canvas (the ≤3-texture budget). Returns a reason or null. */
export function admitRowAnchors(row: PaintedThemeRow, raw: unknown): { ok: true; anchors: EffectSequenceAnchors } | { ok: false; reason: string; parserReason?: string } {
  const parsed = parseEffectSequenceAnchors(raw);
  if (!parsed.ok) return { ok: false, reason: `anchors ${row.anchors} refused: ${parsed.reason}`, parserReason: parsed.reason };
  const a = parsed.anchors;
  if (a.theme !== row.theme) return { ok: false, reason: `anchors ${row.anchors} are for theme "${a.theme}", not "${row.theme}"` };
  if (isProceduralSequence(a)) return { ok: false, reason: `anchors ${row.anchors} are a procedural record, not a painted sequence` };
  if (row.contract === 'v4.3') {
    if (a.phases.length !== EFFECT_PHASE_NAMES.length) return { ok: false, reason: `anchors ${row.anchors}: a v4.3 delivery has exactly ${EFFECT_PHASE_NAMES.length} phases (launch, travel, impact; at most 3 textures), got ${a.phases.length}` };
    for (const c of [a.canvasSize, ...a.phases.map((p) => p.canvasSize)]) if (c.width !== PAINTED_PHASE_CANVAS || c.height !== PAINTED_PHASE_CANVAS) return { ok: false, reason: `anchors ${row.anchors}: canvas ${c.width}x${c.height}, a v4.3 delivery is ${PAINTED_PHASE_CANVAS} square` };
  }
  return { ok: true, anchors: a };
}

/** Stage 1a: fetch every row's anchors JSON in parallel; never rejects (admission decides what a failure means). */
export function fetchPaintedThemeAnchors(rows: readonly PaintedThemeRow[], json: (path: string) => Promise<unknown>): Promise<readonly PromiseSettledResult<unknown>[]> {
  return Promise.allSettled(rows.map((r) => json(r.anchors)));
}
/** Stage 1: fetch and admit every row's anchors. A required row's failure throws (the study fails, as before). */
export async function loadPaintedThemeAnchors(rows: readonly PaintedThemeRow[], json: (path: string) => Promise<unknown>): Promise<PaintedThemeAnchorsStage> {
  return admitPaintedThemeAnchors(rows, await fetchPaintedThemeAnchors(rows, json));
}
/** Stage 1b: admit the fetched anchors (synchronous). A required row's failure throws: its fetch error as is, or
 * `battle2 anchors refused: <parser reason>` (the exact message the study failed with before the registry). */
export function admitPaintedThemeAnchors(rows: readonly PaintedThemeRow[], settled: readonly PromiseSettledResult<unknown>[]): PaintedThemeAnchorsStage {
  if (settled.length !== rows.length) throw new TypeError('painted themes: one fetch result per row');
  const admitted = new Map<EffectTheme, Readonly<{ row: PaintedThemeRow; anchors: EffectSequenceAnchors; phasePaths: readonly string[] }>>(), refused = new Map<EffectTheme, string>(), ids = new Set<string>();
  rows.forEach((row, i) => {
    const s = settled[i]!;
    if (s.status === 'rejected') { if (row.required) throw s.reason; refused.set(row.theme, `anchors ${row.anchors} unavailable (${s.reason instanceof Error ? s.reason.message : String(s.reason)})`); return; }
    const r = admitRowAnchors(row, s.value);
    // the required row keeps the exact message the study always failed with
    if (!r.ok) { if (row.required) throw new Error(`battle2 anchors refused: ${r.parserReason ?? r.reason}`); refused.set(row.theme, r.reason); return; }
    if (ids.has(r.anchors.sequenceId)) { if (row.required) throw new Error(`battle2 anchors refused: duplicate sequenceId ${r.anchors.sequenceId}`); refused.set(row.theme, `anchors ${row.anchors}: sequenceId ${r.anchors.sequenceId} is already registered by another theme`); return; }
    ids.add(r.anchors.sequenceId);
    admitted.set(row.theme, Object.freeze({ row, anchors: r.anchors, phasePaths: Object.freeze(r.anchors.phases.map((p) => paintedAssetPath(row.anchors, p.keyedImage))) }));
  });
  return Object.freeze({ rows, admitted, refused });
}

export interface PaintedThemesLoaded<T> {
  readonly painted: readonly EffectSequenceAnchors[];
  /** Phase textures per painted sequenceId, in phase order. */
  readonly textures: ReadonlyMap<string, readonly T[]>;
  /** Every theme that plays procedural, with the reason (all eleven themes are covered: painted ∪ fallback). */
  readonly fallbackReasons: ReadonlyMap<EffectTheme, string>;
}

/** Stage 2: load each admitted sequence's phase textures. A v4.3 phase texture must be its anchors' canvas size. A required
 * row's failure rethrows; any other row falls back to procedural with the reason. */
export async function loadPaintedThemeTextures<T extends { readonly width: number; readonly height: number }>(stage: PaintedThemeAnchorsStage, texture: (path: string) => Promise<T>): Promise<PaintedThemesLoaded<T>> {
  const entries = [...stage.admitted.values()];
  const loaded = await Promise.all(entries.map((e) => Promise.allSettled(e.phasePaths.map((p) => texture(p)))));
  const painted: EffectSequenceAnchors[] = [], textures = new Map<string, readonly T[]>(), fallbackReasons = new Map<EffectTheme, string>(stage.refused);
  entries.forEach((e, i) => {
    const results = loaded[i]!, out: T[] = [];
    for (let k = 0; k < results.length; k++) {
      const r = results[k]!, phase = e.anchors.phases[k]!;
      if (r.status === 'rejected') { if (e.row.required) throw r.reason; fallbackReasons.set(e.row.theme, `phase image ${e.phasePaths[k]} unavailable (${r.reason instanceof Error ? r.reason.message : String(r.reason)})`); return; }
      if (e.row.contract === 'v4.3' && (r.value.width !== phase.canvasSize.width || r.value.height !== phase.canvasSize.height)) {
        fallbackReasons.set(e.row.theme, `phase image ${e.phasePaths[k]} is ${r.value.width}x${r.value.height}, its anchors say ${phase.canvasSize.width}x${phase.canvasSize.height}`); return;
      }
      out.push(r.value);
    }
    painted.push(e.anchors); textures.set(e.anchors.sequenceId, Object.freeze(out));
  });
  for (const t of EFFECT_THEMES) if (!stage.admitted.has(t) && !fallbackReasons.has(t)) fallbackReasons.set(t, NO_PAINTED_ROW_REASON);
  return Object.freeze({ painted: Object.freeze(painted), textures, fallbackReasons });
}
