/** @module effects/theme-delivery [domain] — the delivery validator for one painted ability-theme sequence (Art Kit §4K
 * Effects, §5 cut-out output, Motion Kit §8 budget). Pure: it reads the anchors JSON as delivered and the decoded keyed
 * phase images (straight-alpha RGBA plus the SHA-256 of the file bytes, both supplied by the caller) and returns every
 * finding with a named check and a reason, plus the measurements behind them. It never reads files, clocks or randomness.
 *
 * What it checks (only what is mechanically checkable; the painted look stays Dakk's visual call):
 *   anchors       parses as cf.effect-sequence-anchors/v1 (anchors.ts), theme = the delivered theme, painted (not procedural)
 *   phases        exactly launch, travel, impact; each named image delivered
 *   budget        ≤ 3 phase textures and Σ emitter maxParticles ≤ 200 (Motion Kit §8)
 *   size          sequence and phase canvases and every decoded image are 1024 square (Art Kit §5)
 *   alpha         a real alpha channel; the one-pixel frame border fully transparent (shape kept inside the frame); not empty
 *   hash          each phase's imageSha256 is the delivered keyed file's SHA-256
 *   bounds        alphaBoundsPixels equals the measured alpha box within ±2 px
 *   registration  every phase's origin/contact anchor equals the sequence's within 0.02 (shared registration, §4K)
 *   fringe        key-tinted edge pixels ≤ 0.375 % of edge pixels (threshold derived from the accepted Wild v4.3 set, below)
 *   material      the game hex is an accent only: pixels near it ≤ 25 % of the painted area; no pure key colour inside the shape
 *
 * FRINGE THRESHOLD, derived (2026-10-01) from the accepted Wild v4.3 set (audits/WILD_V43_PROOF_20260913/wild-anchors.json):
 * key-tinted edge pixels launch 23/9289 (0.248 %), travel 53/28907 (0.183 %), impact 23/11791 (0.195 %); 0.375 % is ~1.5x the
 * worst accepted phase. The same metric on the earlier registered copies the Wild review refused (before the second despill
 * pass) reads travel 0.595 % and impact 0.630 %, so the threshold refuses exactly the copies the review refused. The material accent ceiling and the key-in-shape
 * count are documented in audits/THEME_EFFECTS_ROUTING_20261001/README.md with the Wild measurements. */
import { EFFECT_PHASE_NAMES, parseEffectSequenceAnchors, type EffectPhaseName, type EffectSequenceAnchors, type PixelBounds } from './anchors.js';
import { EMITTER_PARTICLE_CAP, type EmitterConfig } from './emitter.js';
import { THEME_EMITTERS, THEME_MATERIALS, isEffectTheme, isProceduralSequence } from './theme-library.js';

export const THEME_DELIVERY_REPORT_SCHEMA = 'cf.theme-delivery-report/v1' as const;
export const DELIVERY_RULES = Object.freeze({
  canvas: 1024,
  maxTextures: 3,
  maxParticles: EMITTER_PARTICLE_CAP,
  boundsTolerancePx: 2,
  registrationTolerance: 0.02,
  /** A key-tinted pixel: min(r,b) ≥ 96, g ≤ 0.6·min(r,b), |r−b| ≤ 0.4·max(r,b) — magenta hue, any brightness the keyer left. */
  fringe: Object.freeze({ minRB: 96, maxGreenOverRB: 0.6, maxRBSkew: 0.4, maxEdgeRatio: 0.00375 }),
  /** Accent only: pixels (alpha ≥ 128) within RGB distance 40 of the game hex stay ≤ 25 % of the painted area. */
  accent: Object.freeze({ radius: 40, maxShare: 0.25 }),
  /** Pure key inside the shape: fully opaque, non-edge pixels within RGB distance 64 of #FF00FF. */
  keyInShape: Object.freeze({ radius: 64, max: 0 }),
});

export type DeliveryCheck = 'anchors' | 'phases' | 'budget' | 'size' | 'alpha' | 'hash' | 'bounds' | 'registration' | 'fringe' | 'material';
export interface DeliveryFinding { readonly check: DeliveryCheck; readonly phase?: EffectPhaseName; readonly reason: string; }
export interface DeliveryImage {
  readonly width: number; readonly height: number;
  /** Straight-alpha RGBA, width*height*4 bytes. */
  readonly rgba: Uint8Array | Uint8ClampedArray;
  /** False for a PNG without an alpha channel (colour type 2/0): a cut-out must carry real alpha. */
  readonly hasAlphaChannel: boolean;
  /** SHA-256 (lowercase hex) of the delivered file bytes. */
  readonly sha256: string;
}
export interface PhaseMeasurement {
  readonly painted: number; readonly edge: number; readonly fringe: number; readonly fringeRatio: number;
  readonly accentShare: number; readonly keyInShape: number; readonly borderOpaque: number; readonly alphaBounds: PixelBounds | null;
}
export interface ThemeDeliveryInput {
  readonly theme: string;
  /** The anchors JSON exactly as delivered (raw, so the hash fields the parser drops are still visible). */
  readonly anchors: unknown;
  /** Decoded keyed phase images by the anchors' `keyedImage` name. */
  readonly images: ReadonlyMap<string, DeliveryImage>;
  /** The emitters the theme will play with; absent = the theme library's own (THEME_EMITTERS). */
  readonly emitters?: Readonly<Record<EffectPhaseName, EmitterConfig>>;
}
export interface ThemeDeliveryReport {
  readonly schema: typeof THEME_DELIVERY_REPORT_SCHEMA;
  readonly ok: boolean;
  readonly theme: string;
  readonly sequenceId: string | null;
  readonly findings: readonly DeliveryFinding[];
  readonly textures: number;
  readonly particles: number;
  readonly phases: Readonly<Partial<Record<EffectPhaseName, PhaseMeasurement>>>;
}

const KEY = [255, 0, 255] as const;
const isKeyTinted = (r: number, g: number, b: number): boolean => {
  const f = DELIVERY_RULES.fringe, lo = Math.min(r, b), hi = Math.max(r, b);
  return lo >= f.minRB && g <= f.maxGreenOverRB * lo && hi - lo <= f.maxRBSkew * hi;
};
export { isKeyTinted };
const dist2 = (r: number, g: number, b: number, c: readonly [number, number, number]): number => (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
const rgbOf = (hex: number): [number, number, number] => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];

/** Measure one keyed phase image against the theme accent. Edge pixel: alpha > 0 and (alpha < 255 or a 4-neighbour is transparent or off-canvas). */
export function measurePhaseImage(img: DeliveryImage, accentHex: number): PhaseMeasurement {
  const { width: w, height: h, rgba } = img;
  if (rgba.length !== w * h * 4) throw new TypeError(`measurePhaseImage: rgba is ${rgba.length} bytes, expected ${w * h * 4}`);
  const accent = rgbOf(accentHex), aR2 = DELIVERY_RULES.accent.radius ** 2, kR2 = DELIVERY_RULES.keyInShape.radius ** 2;
  let painted = 0, edge = 0, fringe = 0, solid = 0, nearAccent = 0, keyInShape = 0, borderOpaque = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
  const alphaAt = (x: number, y: number): number => (x < 0 || y < 0 || x >= w || y >= h ? 0 : rgba[(y * w + x) * 4 + 3]!);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, a = rgba[i + 3]!;
    if (a === 0) continue;
    painted++;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) borderOpaque++;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    const r = rgba[i]!, g = rgba[i + 1]!, b = rgba[i + 2]!;
    const isEdge = a < 255 || alphaAt(x + 1, y) === 0 || alphaAt(x - 1, y) === 0 || alphaAt(x, y + 1) === 0 || alphaAt(x, y - 1) === 0;
    if (isEdge) { edge++; if (isKeyTinted(r, g, b)) fringe++; }
    else if (dist2(r, g, b, KEY) <= kR2) keyInShape++;
    if (a >= 128) { solid++; if (dist2(r, g, b, accent) <= aR2) nearAccent++; }
  }
  return Object.freeze({ painted, edge, fringe, fringeRatio: edge > 0 ? fringe / edge : 0, accentShare: solid > 0 ? nearAccent / solid : 0, keyInShape, borderOpaque,
    alphaBounds: x1 < 0 ? null : Object.freeze({ x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }) });
}

const pct = (v: number): string => `${(v * 100).toFixed(3)}%`;
const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Validate one delivered painted theme sequence. Every failing check is reported (not just the first). */
export function validateThemeDelivery(input: ThemeDeliveryInput): ThemeDeliveryReport {
  const findings: DeliveryFinding[] = [], phases: Partial<Record<EffectPhaseName, PhaseMeasurement>> = {};
  const add = (check: DeliveryCheck, reason: string, phase?: EffectPhaseName): void => { findings.push(Object.freeze(phase ? { check, phase, reason } : { check, reason })); };
  const R = DELIVERY_RULES;
  const theme = input.theme;
  if (!isEffectTheme(theme)) add('anchors', `theme "${theme}" is not a kit theme`);
  const emitters = input.emitters ?? (isEffectTheme(theme) ? THEME_EMITTERS[theme] : null);
  const particles = emitters ? EFFECT_PHASE_NAMES.reduce((n, p) => n + emitters[p].maxParticles, 0) : 0;
  if (particles > R.maxParticles) add('budget', `emitters total ${particles} particles, the budget is ${R.maxParticles}`);
  const parsed = parseEffectSequenceAnchors(input.anchors);
  if (!parsed.ok) { add('anchors', `anchors refused: ${parsed.reason}`); return report(theme, null, findings, 0, particles, phases); }
  const a: EffectSequenceAnchors = parsed.anchors;
  if (a.theme !== theme) add('anchors', `anchors theme "${a.theme}" is not the delivered theme "${theme}"`);
  if (isProceduralSequence(a)) add('anchors', `sequenceId ${a.sequenceId} is a procedural record`);
  const textures = a.phases.length;
  if (textures > R.maxTextures) add('budget', `${textures} phase textures, the budget is ${R.maxTextures}`);
  if (a.phaseOrder.join(',') !== EFFECT_PHASE_NAMES.join(',')) add('phases', `phaseOrder is ${a.phaseOrder.join(', ')}; a delivery is exactly ${EFFECT_PHASE_NAMES.join(', ')}`);
  if (a.canvasSize.width !== R.canvas || a.canvasSize.height !== R.canvas) add('size', `sequence canvas ${a.canvasSize.width}x${a.canvasSize.height}, expected ${R.canvas} square`);
  const rawPhases = isRec(input.anchors) && Array.isArray(input.anchors.phases) ? (input.anchors.phases as unknown[]) : [];
  const accentHex = isEffectTheme(theme) ? THEME_MATERIALS[theme].accent : 0;
  a.phases.forEach((p, i) => {
    const ph = p.phase;
    if (p.canvasSize.width !== R.canvas || p.canvasSize.height !== R.canvas) add('size', `phase canvas ${p.canvasSize.width}x${p.canvasSize.height}, expected ${R.canvas} square`, ph);
    const near = (u: { x: number; y: number }, v: { x: number; y: number }): boolean => Math.abs(u.x - v.x) <= R.registrationTolerance && Math.abs(u.y - v.y) <= R.registrationTolerance;
    if (!near(p.originAnchor, a.originAnchor)) add('registration', `originAnchor (${p.originAnchor.x}, ${p.originAnchor.y}) is off the sequence origin (${a.originAnchor.x}, ${a.originAnchor.y}) by more than ${R.registrationTolerance}`, ph);
    if (!near(p.contactAnchor, a.contactAnchor)) add('registration', `contactAnchor (${p.contactAnchor.x}, ${p.contactAnchor.y}) is off the sequence contact (${a.contactAnchor.x}, ${a.contactAnchor.y}) by more than ${R.registrationTolerance}`, ph);
    const img = input.images.get(p.keyedImage);
    if (!img) { add('phases', `keyed image ${p.keyedImage} was not delivered`, ph); return; }
    if (img.width !== R.canvas || img.height !== R.canvas) add('size', `${p.keyedImage} is ${img.width}x${img.height}, expected ${R.canvas} square`, ph);
    if (img.width !== p.canvasSize.width || img.height !== p.canvasSize.height) add('size', `${p.keyedImage} is ${img.width}x${img.height}, its anchors say ${p.canvasSize.width}x${p.canvasSize.height}`, ph);
    const raw = isRec(rawPhases[i]) ? rawPhases[i] as Record<string, unknown> : {};
    const sha = raw.imageSha256;
    if (typeof sha !== 'string' || !/^[0-9a-f]{64}$/.test(sha)) add('hash', 'imageSha256 is missing or not 64 lowercase hex', ph);
    else if (sha !== img.sha256) add('hash', `imageSha256 ${sha.slice(0, 12)}… is not the delivered ${p.keyedImage} (${img.sha256.slice(0, 12)}…)`, ph);
    if (!img.hasAlphaChannel) { add('alpha', `${p.keyedImage} has no alpha channel (a cut-out is keyed RGBA)`, ph); return; }
    const m = measurePhaseImage(img, accentHex); phases[ph] = m;
    if (m.painted === 0 || !m.alphaBounds) { add('alpha', `${p.keyedImage} is fully transparent`, ph); return; }
    if (m.painted === img.width * img.height) add('alpha', `${p.keyedImage} has no transparent pixel (the key was not removed)`, ph);
    if (m.borderOpaque > 0) add('alpha', `${m.borderOpaque} painted pixels on the frame border; the shape must sit inside the frame`, ph);
    const b = p.alphaBoundsPixels, mb = m.alphaBounds, t = R.boundsTolerancePx;
    if (Math.abs(b.x - mb.x) > t || Math.abs(b.y - mb.y) > t || Math.abs(b.x + b.width - (mb.x + mb.width)) > t || Math.abs(b.y + b.height - (mb.y + mb.height)) > t) {
      add('bounds', `alphaBoundsPixels {${b.x},${b.y},${b.width},${b.height}} disagree with the measured alpha box {${mb.x},${mb.y},${mb.width},${mb.height}} by more than ${t}px`, ph);
    }
    if (m.fringeRatio > R.fringe.maxEdgeRatio) add('fringe', `${m.fringe} of ${m.edge} edge pixels are key-tinted (${pct(m.fringeRatio)} > ${pct(R.fringe.maxEdgeRatio)}): despill the edge`, ph);
    if (m.accentShare > R.accent.maxShare) add('material', `${pct(m.accentShare)} of the painted area is the game hex #${accentHex.toString(16).padStart(6, '0')} (> ${pct(R.accent.maxShare)}): the hex is an accent, the material carries the theme`, ph);
    if (m.keyInShape > R.keyInShape.max) add('material', `${m.keyInShape} opaque interior pixels are the magenta key colour: no magenta or pink inside the effect`, ph);
  });
  return report(theme, a.sequenceId, findings, textures, particles, phases);
}

function report(theme: string, sequenceId: string | null, findings: DeliveryFinding[], textures: number, particles: number, phases: Partial<Record<EffectPhaseName, PhaseMeasurement>>): ThemeDeliveryReport {
  return Object.freeze({ schema: THEME_DELIVERY_REPORT_SCHEMA, ok: findings.length === 0, theme, sequenceId, findings: Object.freeze(findings), textures, particles, phases: Object.freeze(phases) });
}
