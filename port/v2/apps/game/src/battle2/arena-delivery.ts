/** @module battle2/arena-delivery [app] — the mechanical delivery check for a painted arena plate set (2026-10-01). Pure: it
 * reads a recipe object, three decoded plates (straight RGBA) and the acceptance record, and returns EVERY failure with its
 * own diagnosis (never a bare "invalid"). The contract is ART_KIT §Arena scene profile + the accepted Earth temperate set:
 * - recipe: the accepted `cf.arena.authoring-proof/v1` shape (biomeFamily one of the 43 live biomes, ground line 0.78,
 *   stands at 1/3 and 2/3, three plates far/mid/near with master SHA-256);
 * - canvas: every plate 1672 × 941 — the image generator's native arena size, the delivery size since Dakk's decision of
 *   2026-10-02 (the kit's 2560 × 1440 cannot be generated natively and upscaling adds no detail; the battle stage draws at
 *   1024 × 576) — or the kit's 2560 × 1440 if a route ever produces it natively; any other size is refused;
 * - FAR: opaque scene (every alpha 255, no key field);
 * - MID: on the key (magenta field or alpha 0 above the terrain), terrain across the fighting path on the ground line;
 * - NEAR: on the key, a ground edge at the bottom, the stands clear above the ground line;
 * - acceptance: `cf.arena-template-acceptance/v1`, qualityAccepted true, its plate hashes equal to the recipe's. */
import { BIOME_PROFILE_KEYS_V1 } from '@cf/domain-biome-profile';

export const ARENA_KIT_CANVAS = Object.freeze({ width: 2560, height: 1440 });
/** Admitted delivery canvases: the generator's native 1672 × 941 (Dakk, 2026-10-02) and the kit's 2560 × 1440. */
export const ARENA_DELIVERY_CANVASES = Object.freeze([Object.freeze({ width: 1672, height: 941 }), ARENA_KIT_CANVAS]);
export const ARENA_GROUND_LINE = 0.78;
export const ARENA_STANDS_X = Object.freeze([1 / 3, 2 / 3] as const);
/** The accepted Earth temperate template v1 (audits/ARENA_V1_ACCEPTANCE_20260912/acceptance.json): accepted before the kit's
 * 2560 × 1440 canvas was enforced, so its own size is admitted for exactly these master bytes. */
export const ARENA_CANVAS_EXEMPTIONS = Object.freeze([Object.freeze({ id: 'earth-temperate-arena v1', width: 1672, height: 941,
  far: 'c0738eb03f60aa43e367d93ba03e79153c281d4ac5e9acfb7e655573b37807e2', mid: '189d0fc31a81330249fbce3cf03c8c3a0319cce47b9480f8623d8779dec96391', near: '8fc1191f88eaae7561316c1c43d84b1d907ce459852b13935228e3b23e7559c4' })]);
/** Pixel thresholds, measured on the accepted set (MID key 0.56, NEAR key 0.82; MID terrain top at the stands 0.59; NEAR top at the stands 0.82). */
export const ARENA_PLATE_LIMITS = Object.freeze({
  /** a MID/NEAR plate must be at least this share key (an opaque MID is a scene, not a keyed terrain layer) */
  minKeyShare: 0.10,
  /** the top row of MID/NEAR is the key field (no painted sky) */
  minTopRowKey: 0.95,
  /** MID terrain covers the fighting path (x 0.2–0.8) on the ground line */
  minPathGround: 0.98,
  /** MID and NEAR reach the frame bottom (parallax must not reveal gaps) */
  minBottomContent: 0.90,
  /** NEAR content may start no higher than this at the stands (it must not cover the stands or paws) */
  nearTopAtStandsMin: 0.76,
  /** a FAR plate is a scene: at most this share of key magenta */
  maxFarKeyShare: 0.005,
});

export interface ArenaPlateImage { readonly width: number; readonly height: number; /** straight RGBA, row-major */ readonly rgba: Uint8Array | Uint8ClampedArray; }
export type ArenaPlateName = 'far' | 'mid' | 'near';
export interface ArenaDeliveryInput {
  readonly recipe: unknown;
  readonly plates: Readonly<Partial<Record<ArenaPlateName, ArenaPlateImage | null>>>;
  /** The acceptance record; omit only to check a candidate before Dakk's acceptance (registration requires it). */
  readonly acceptance?: unknown;
}
export type ArenaDeliveryVerdict = Readonly<{ ok: boolean; failures: readonly string[]; canvas: Readonly<{ width: number; height: number }> | null; biome: string | null }>;

const isKeyPx = (p: ArenaPlateImage, i: number): boolean => { const d = p.rgba; return d[i + 3]! < 8 || (d[i]! >= 230 && d[i + 1]! <= 40 && d[i + 2]! >= 230); };
const keyShare = (p: ArenaPlateImage): number => { let k = 0; for (let i = 0; i < p.rgba.length; i += 4) if (isKeyPx(p, i)) k++; return k / (p.width * p.height); };
/** Share of NON-key pixels on the row at `fy` (fraction of height) between x0 and x1 (fractions of width). */
const rowContent = (p: ArenaPlateImage, fy: number, x0 = 0, x1 = 1): number => {
  const y = Math.min(p.height - 1, Math.max(0, Math.round(fy * (p.height - 1)))), a = Math.round(x0 * (p.width - 1)), b = Math.round(x1 * (p.width - 1)); let c = 0;
  for (let x = a; x <= b; x++) if (!isKeyPx(p, (y * p.width + x) * 4)) c++;
  return c / (b - a + 1);
};
/** First non-key row (fraction of height) in a 5-px column band around x (fraction of width); 1 when the band is all key. */
const contentTopAt = (p: ArenaPlateImage, fx: number): number => {
  const cx = Math.round(fx * (p.width - 1));
  for (let y = 0; y < p.height; y++) for (let x = Math.max(0, cx - 2); x <= Math.min(p.width - 1, cx + 2); x++) if (!isKeyPx(p, (y * p.width + x) * 4)) return y / p.height;
  return 1;
};
const near = (a: unknown, b: number): boolean => typeof a === 'number' && Math.abs(a - b) < 1e-9;
const HEX64 = /^[0-9a-f]{64}$/;
const PLATE_ROWS = Object.freeze([['far', 'arena-far.png', 'scene'], ['mid', 'arena-mid.png', 'key-painted terrain'], ['near', 'arena-near.png', 'key-painted terrain']] as const);

export function validateArenaDelivery(input: ArenaDeliveryInput): ArenaDeliveryVerdict {
  const f: string[] = [], r = input.recipe as Record<string, unknown> | null;
  let canvas: { width: number; height: number } | null = null, biome: string | null = null;
  const sha: Partial<Record<ArenaPlateName, string>> = {};
  /* ---- recipe shape (the accepted temperate recipe's shape) ---- */
  if (!r || typeof r !== 'object') f.push('recipe: not a JSON object');
  else {
    if (r.schema !== 'cf.arena.authoring-proof/v1') f.push(`recipe.schema: "${String(r.schema)}" ≠ "cf.arena.authoring-proof/v1"`);
    const bc = r.battleContext as Record<string, unknown> | undefined;
    if (!bc || typeof bc !== 'object') f.push('recipe.battleContext: missing');
    else if (typeof bc.biomeFamily !== 'string' || !(BIOME_PROFILE_KEYS_V1 as readonly string[]).includes(bc.biomeFamily)) f.push(`recipe.battleContext.biomeFamily: "${String(bc.biomeFamily)}" is not one of the 43 live biomes`);
    else biome = bc.biomeFamily;
    if (!Number.isInteger(r.seed) || (r.seed as number) < 0 || (r.seed as number) > 0xffffffff) f.push(`recipe.seed: ${String(r.seed)} is not a uint32`);
    if (!near(r.groundLineNormalized, ARENA_GROUND_LINE)) f.push(`recipe.groundLineNormalized: ${String(r.groundLineNormalized)} ≠ ${ARENA_GROUND_LINE} (stands, paws and impact anchors register to y = 0.78)`);
    if (!(typeof r.horizonBandNormalized === 'number' && r.horizonBandNormalized > 0 && r.horizonBandNormalized < ARENA_GROUND_LINE)) f.push(`recipe.horizonBandNormalized: ${String(r.horizonBandNormalized)} must lie above the ground line (0, 0.78)`);
    const st = r.standsNormalizedX; if (!Array.isArray(st) || st.length !== 2 || !near(st[0], ARENA_STANDS_X[0]) || !near(st[1], ARENA_STANDS_X[1])) f.push(`recipe.standsNormalizedX: ${JSON.stringify(st)} ≠ [1/3, 2/3]`);
    if (typeof r.systemCard !== 'string' || !r.systemCard.trim()) f.push('recipe.systemCard: missing (world life and the arena seed read it)');
    const ly = r.layers as Record<string, unknown> | undefined;
    if (!ly || ly.far !== 'opaque scene' || ly.mid !== 'magenta-keyed terrain' || ly.near !== 'magenta-keyed terrain') f.push(`recipe.layers: ${JSON.stringify(ly)} ≠ {far: "opaque scene", mid/near: "magenta-keyed terrain"}`);
    if (r.extractedMasks !== false) f.push('recipe.extractedMasks: must be false (MID/NEAR are key-painted, never masks extracted from a scene)');
    const cs = r.canvasSize as Record<string, unknown> | undefined;
    if (!cs || !Number.isInteger(cs.width) || !Number.isInteger(cs.height) || (cs.width as number) <= 0 || (cs.height as number) <= 0) f.push(`recipe.canvasSize: ${JSON.stringify(cs)} is not a positive integer size`);
    else canvas = { width: cs.width as number, height: cs.height as number };
    const pl = r.plates;
    if (!Array.isArray(pl) || pl.length !== 3) f.push(`recipe.plates: ${Array.isArray(pl) ? pl.length : 'no'} plates; exactly three (far, mid, near) required`);
    else PLATE_ROWS.forEach(([name, image, kind], i) => {
      const p = pl[i] as Record<string, unknown> | undefined;
      if (!p || p.image !== image) { f.push(`recipe.plates[${i}].image: "${String(p?.image)}" ≠ "${image}"`); return; }
      if (p.kind !== kind) f.push(`recipe.plates[${i}].kind: "${String(p.kind)}" ≠ "${kind}"`);
      if (!near(p.groundLineNormalized, ARENA_GROUND_LINE)) f.push(`recipe.plates[${i}] (${name}).groundLineNormalized: ${String(p.groundLineNormalized)} ≠ ${ARENA_GROUND_LINE} (one shared ground registration)`);
      if (typeof p.sha256 !== 'string' || !HEX64.test(p.sha256)) f.push(`recipe.plates[${i}] (${name}).sha256: not a lowercase SHA-256 of the master`); else sha[name] = p.sha256;
    });
  }
  /* ---- canvas size ---- */
  if (canvas && !ARENA_DELIVERY_CANVASES.some((c) => c.width === canvas!.width && c.height === canvas!.height)) {
    const ex = ARENA_CANVAS_EXEMPTIONS.find((e) => e.width === canvas!.width && e.height === canvas!.height && e.far === sha.far && e.mid === sha.mid && e.near === sha.near);
    if (!ex) f.push(`canvas: ${canvas.width}×${canvas.height} is not a delivery size (${ARENA_DELIVERY_CANVASES.map((c) => `${c.width}×${c.height}`).join(' or ')})`);
  }
  /* ---- plates ---- */
  const L = ARENA_PLATE_LIMITS;
  for (const [name] of PLATE_ROWS) {
    const p = input.plates[name];
    if (!p) { f.push(`plate ${name}: missing (three plates required: far, mid, near)`); continue; }
    if (!(p.width > 0) || !(p.height > 0) || p.rgba.length !== p.width * p.height * 4) { f.push(`plate ${name}: ${p.width}×${p.height} with ${p.rgba.length} bytes is not straight RGBA`); continue; }
    if (canvas && (p.width !== canvas.width || p.height !== canvas.height)) { f.push(`plate ${name}: ${p.width}×${p.height} ≠ recipe canvas ${canvas.width}×${canvas.height} (never crop, resize or recentre a plate)`); continue; }
    if (name === 'far') {
      let translucent = 0; for (let i = 3; i < p.rgba.length; i += 4) if (p.rgba[i] !== 255) translucent++;
      if (translucent) f.push(`plate far: ${translucent} pixels are not opaque (FAR is the full-bleed opaque scene)`);
      const k = keyShare(p); if (k > L.maxFarKeyShare) f.push(`plate far: ${(k * 100).toFixed(2)} % key magenta (> ${L.maxFarKeyShare * 100} %): FAR is a scene, not a keyed layer`);
      continue;
    }
    const k = keyShare(p), top = rowContent(p, 0), bottom = rowContent(p, 0.99);
    if (k < L.minKeyShare) f.push(`plate ${name}: only ${(k * 100).toFixed(1)} % key (< ${L.minKeyShare * 100} %): ${name.toUpperCase()} must be key-painted terrain (magenta field / alpha 0), not an opaque scene`);
    if (1 - top < L.minTopRowKey) f.push(`plate ${name}: top row ${((1 - top) * 100).toFixed(1)} % key (< ${L.minTopRowKey * 100} %): no painted sky in the key field`);
    if (bottom < L.minBottomContent) f.push(`plate ${name}: bottom row ${(bottom * 100).toFixed(1)} % terrain (< ${L.minBottomContent * 100} %): the layer must reach the frame bottom`);
    if (name === 'mid') {
      const path = rowContent(p, ARENA_GROUND_LINE, 0.2, 0.8);
      if (path < L.minPathGround) f.push(`plate mid: ${(path * 100).toFixed(1)} % terrain on the ground line y = 0.78 across the fighting path (< ${L.minPathGround * 100} %): the fighting ground is not registered at 0.78`);
      for (const x of ARENA_STANDS_X) { const t = contentTopAt(p, x); if (!(t < ARENA_GROUND_LINE)) f.push(`plate mid: terrain at the ${x < 0.5 ? 'left' : 'right'} stand starts at y = ${t.toFixed(3)}, not above the ground line 0.78`); }
    } else {
      for (const x of ARENA_STANDS_X) { const t = contentTopAt(p, x); if (t < L.nearTopAtStandsMin) f.push(`plate near: content at the ${x < 0.5 ? 'left' : 'right'} stand starts at y = ${t.toFixed(3)} (< ${L.nearTopAtStandsMin}): NEAR covers the stand/paws`); }
    }
  }
  /* ---- acceptance ---- */
  if (input.acceptance !== undefined) {
    const a = input.acceptance as Record<string, unknown> | null;
    if (!a || a.schema !== 'cf.arena-template-acceptance/v1') f.push(`acceptance.schema: "${String(a?.schema)}" ≠ "cf.arena-template-acceptance/v1"`);
    else {
      if (a.qualityAccepted !== true) f.push('acceptance.qualityAccepted: not true (only Dakk-accepted sets are registered)');
      if (typeof a.acceptanceAuthority !== 'string' || !a.acceptanceAuthority.trim()) f.push('acceptance.acceptanceAuthority: missing');
      if (!near(a.groundLineNormalized, ARENA_GROUND_LINE)) f.push(`acceptance.groundLineNormalized: ${String(a.groundLineNormalized)} ≠ ${ARENA_GROUND_LINE}`);
      const ap = Array.isArray(a.plates) ? (a.plates as Record<string, unknown>[]) : [];
      for (const [name] of PLATE_ROWS) {
        const row = ap.find((x) => x?.name === 'arena-' + name);
        if (!row) f.push(`acceptance.plates: no arena-${name} row`);
        else { if (row.qualityAccepted !== true) f.push(`acceptance arena-${name}: qualityAccepted not true`); if (sha[name] && row.masterSha256 !== sha[name]) f.push(`acceptance arena-${name}: masterSha256 ${String(row.masterSha256).slice(0, 12)}… ≠ recipe ${sha[name]!.slice(0, 12)}… (accepted bytes differ from the delivered recipe)`); }
      }
    }
  }
  return Object.freeze({ ok: f.length === 0, failures: Object.freeze(f), canvas: canvas ? Object.freeze(canvas) : null, biome });
}
