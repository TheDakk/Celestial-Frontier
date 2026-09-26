/** @module creature-finish-route [app] — G5 ROUTING (Generated Creature Pipeline, audits/G5_ROUTING_20260926/README.md): which device
 * finishes, which painting a creature's finish starts from, and how a retained finished original reaches the Compendium card.
 * Codex owns the engine (creature-finish-engine.ts: identity, bounded serial queue, conservation, retention); this module only
 * routes admitted sources into it and its retained originals out of it.
 *
 * - Tier: a DESKTOP-class device whose probe reports the full local-model capability set finishes on the device; every other device
 *   is `phone` and only ever reads retained/delivered originals (the engine never constructs a model there).
 * - Source: the painting that draws the creature (G4 `paintedArtV2`) — its fit's admitted master (hash = the record's
 *   `cutoutAssetHash`), its ownership labels and its binding, fetched through the caller's trusted (G3-pinned) asset source.
 * - Identity: one finish per Compendium identity (the species visual key: PROGRAM.md G5, "a discovered creature's texture gets the
 *   masked finisher once"), seeded from that identity, so two creatures of one painting finish differently.
 * - Card: `lookup` reads ONLY the retained store (never inference, never a queue slot) and box-downscales the finished original into
 *   the archetype's card-master space with the card builder's own kernel, so the morph applies on top exactly as it does today.
 *   A master whose own alpha is not the card's keyed alpha (an opaque keyed painting such as the Civet) is not card-eligible. */
import { compileCreatureFinishV1 } from './landfall-conditioning.js';
import { createCreatureFinishEngineV1, type CreatureFinishInferV1, type CreatureFinishSourceV1 } from './creature-finish-engine.js';
import type { AiCreatureInputV1, AiCreatureOriginalStoreV1, AiCreatureOriginalV1 } from './creature-originals.js';
import type { LocalModelCapabilityV1 } from './local-model-delivery.js';
import { LocalModelSha256V1 } from './local-model-sha256.js';
import { decodePng } from './morph/png-decode.js';
import type { FinishedCardMasterV1 } from './morph/painted-card-source.js';

export const CARD_MASTER_SIDE_V1 = 512;
const sha = (b: Uint8Array): string => new LocalModelSha256V1().update(b).digestHex();

/** Desktop finishes on the device only with the probe's complete capability set; everything else reads delivered originals. */
export function finishTierV1(capability: Pick<LocalModelCapabilityV1, 'supported'> | null, deviceClass: 'phone' | 'desktop'): 'desktop' | 'phone' {
  return deviceClass === 'desktop' && capability?.supported === true ? 'desktop' : 'phone';
}

/** The card builder's size rule (tools/morph/build-card-masters.mjs): at most 512 on the long side, never upscaled. */
export function cardDimsV1(width: number, height: number): { width: number; height: number } {
  const s = Math.min(1, CARD_MASTER_SIDE_V1 / Math.max(width, height)); return { width: Math.round(width * s), height: Math.round(height * s) };
}
/** The card builder's alpha-weighted BOX kernel, verbatim in behaviour (the test proves byte equality with the shipped card masters). */
export function boxDownscaleV1(rgba: Uint8Array, width: number, height: number, dw: number, dh: number): Uint8Array {
  const o = new Uint8Array(dw * dh * 4), sx = width / dw, sy = height / dh;
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx)), y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy)); let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const i = (yy * width + xx) * 4, al = rgba[i + 3]!; r += rgba[i]! * al; g += rgba[i + 1]! * al; b += rgba[i + 2]! * al; a += al; n++; }
    const j = (y * dw + x) * 4; if (a > 0) { o[j] = Math.round(r / a); o[j + 1] = Math.round(g / a); o[j + 2] = Math.round(b / a); o[j + 3] = Math.round(a / n); }
  }
  return o;
}

/** The fit files a finish starts from (all verified by the caller's trusted asset source before they arrive here). */
export interface FinishFitBytesV1 {
  readonly record: { readonly recipeHash: string; readonly geometry: { readonly cutoutAssetHash: string } };
  readonly masterPng: Uint8Array; readonly labelsPng: Uint8Array; readonly binding: Uint8Array;
}
/** The creature's finish settings, exactly as Codex's native proof derives them (recipe settings + prompt + seed). */
export function finishSettingsV1(recordRecipeHash: string, cutoutAssetHash: string, identitySeed: number, width: number, height: number) {
  const image = { url: 'about:blank', sha256: '0'.repeat(64), width, height };
  const recipe = compileCreatureFinishV1({ recordRecipeHash, cutoutAssetHash, seed: identitySeed >>> 0, width, height, master: image, labels: image });
  return { recipe, settingsHash: sha(new TextEncoder().encode(JSON.stringify({ settings: recipe.settings, prompt: recipe.prompt, seed: recipe.seed }))) };
}
/** Build the engine's source for one Compendium identity. Throws on any pin/size disagreement (the caller falls back). */
export async function finishSourceV1(o: { readonly fit: FinishFitBytesV1; readonly visualKey: string; readonly identitySeed: number; readonly modelHash: string }): Promise<CreatureFinishSourceV1> {
  const master = await decodePng(o.fit.masterPng), labels = await decodePng(o.fit.labelsPng);
  if (sha(o.fit.masterPng) !== o.fit.record.geometry.cutoutAssetHash) throw Error('finish source: master is not the record\'s admitted cut-out');
  if (labels.width !== master.width || labels.height !== master.height) throw Error('finish source: labels size');
  const { recipe, settingsHash } = finishSettingsV1(o.fit.record.recipeHash, o.fit.record.geometry.cutoutAssetHash, o.identitySeed, master.width, master.height);
  const labelRgba = new Uint8Array(labels.rgba);
  return Object.freeze({ individualId: o.visualKey, visualKey: o.visualKey, recordRecipeHash: o.fit.record.recipeHash, modelHash: o.modelHash, settingsHash, seed: recipe.seed,
    width: master.width, height: master.height, masterPng: o.fit.masterPng, labels: labelRgba, binding: o.fit.binding,
    cutoutAssetHash: o.fit.record.geometry.cutoutAssetHash, labelsHash: sha(labelRgba), bindingHash: sha(o.fit.binding) });
}
/** A retained finished original → the individual's finished card master in the archetype's card-master space. */
export async function finishedCardMasterV1(png: Uint8Array, recordRecipeHash: string, sha256: string): Promise<FinishedCardMasterV1> {
  const img = await decodePng(png), d = cardDimsV1(img.width, img.height);
  return Object.freeze({ sha256, recordRecipeHash, width: d.width, height: d.height, rgba: boxDownscaleV1(img.rgba, img.width, img.height, d.width, d.height) });
}
/** Card eligibility: the finished original keeps the source master's alpha (conservation), so the card master it yields matches the
 * shipped one's alpha only when the master's own alpha IS the keyed cut-out alpha. */
export function cardEligibleV1(masterRgba: Uint8Array, keyedRgba: Uint8Array): boolean {
  if (masterRgba.length !== keyedRgba.length) return false; for (let i = 3; i < masterRgba.length; i += 4) if (masterRgba[i] !== keyedRgba[i]) return false; return true;
}

/** One route per session. `fitFor` resolves the painting that draws a genome and returns its fit bytes (null = no painting or not
 * card-eligible); `identityOf` gives the Compendium identity (visual key + seed). */
export interface CreatureFinishRouteOptionsV1 {
  readonly tier: 'desktop' | 'phone'; readonly store: AiCreatureOriginalStoreV1; readonly modelHash: string;
  readonly fitFor: (genome: Readonly<Record<string, unknown>>) => Promise<FinishFitBytesV1 | null>;
  readonly identityOf: (genome: Readonly<Record<string, unknown>>) => { visualKey: string; seed: number };
  readonly createInfer?: () => Promise<CreatureFinishInferV1>;
  readonly maxPending?: number;
  /** Delivered originals (Codex's createCreatureFinishDeliveryV1, pinned by the bundled G3 manifest), for every tier. */
  readonly delivered?: (identity: AiCreatureInputV1) => Promise<AiCreatureOriginalV1 | null>;
  /** Observes each built source (the desktop adapter needs its cut-out hash). */
  readonly onSource?: (source: CreatureFinishSourceV1) => void;
}
export function createCreatureFinishRouteV1(o: CreatureFinishRouteOptionsV1) {
  // lookups use a phone-tier engine over the same store: cache (or delivered) only, never a model, never inference
  const delivered = o.delivered ? { delivered: o.delivered } : {};
  const reader = createCreatureFinishEngineV1({ tier: 'phone', store: o.store, maxPending: 8, ...delivered });
  const finisher = o.tier === 'desktop' && o.createInfer ? createCreatureFinishEngineV1({ tier: 'desktop', store: o.store, createInfer: o.createInfer, maxPending: o.maxPending ?? 4, ...delivered }) : null;
  const sourceOf = async (genome: Readonly<Record<string, unknown>>) => { const fit = await o.fitFor(genome); if (!fit) return null; const id = o.identityOf(genome);
    const source = await finishSourceV1({ fit, visualKey: id.visualKey, identitySeed: id.seed, modelHash: o.modelHash }); o.onSource?.(source); return { fit, source }; };
  // bounded memo per identity: a verified lookup decodes the whole source and re-runs conservation, so it runs once per identity;
  // only definitive answers are kept (a retained original, or no painting) — a busy reader queue is retried next time
  const memo = new Map<string, Promise<FinishedCardMasterV1 | null>>(), MEMO = 64;
  const remember = (k: string, p: Promise<FinishedCardMasterV1 | null>) => { memo.set(k, p); while (memo.size > MEMO) memo.delete(memo.keys().next().value!); };
  return Object.freeze({
    tier: o.tier,
    /** The retained finished card master for this creature, or null. Reads the store only (never inference). */
    lookup(genome: Readonly<Record<string, unknown>>): Promise<FinishedCardMasterV1 | null> {
      const k = o.identityOf(genome).visualKey, hit = memo.get(k); if (hit) return hit;
      let definitive = false;
      const p = (async () => {
        const s = await sourceOf(genome).catch(() => null); if (!s) { definitive = true; return null; }
        const r = await reader.request(s.source); if (r.status !== 'original') return null;
        definitive = true; return finishedCardMasterV1(new Uint8Array(await r.original.blob.arrayBuffer()), s.fit.record.recipeHash, r.original.sha256);
      })();
      void p.then(() => { if (definitive) remember(k, p); }, () => {});
      return p;
    },
    /** The creature's retained (or delivered) original with the source and fit it was made from, or null. Store only, never inference.
     * The stage hands these to Codex's admitCreatureFinishedAtlasV1, which re-verifies everything against the rig's own pins. */
    async retained(genome: Readonly<Record<string, unknown>>): Promise<{ fit: FinishFitBytesV1; source: CreatureFinishSourceV1; original: AiCreatureOriginalV1 } | null> {
      const s = await sourceOf(genome).catch(() => null); if (!s) return null;
      const r = await reader.request(s.source); return r.status === 'original' ? { fit: s.fit, source: s.source, original: r.original } : null;
    },
    /** Desktop only: enqueue this creature's finish (bounded, deduplicated, serial; a full queue falls back). Phones: a no-op. */
    async enqueue(genome: Readonly<Record<string, unknown>>): Promise<'retained' | 'fallback' | 'not-desktop' | 'no-source'> {
      if (!finisher) return 'not-desktop'; const s = await sourceOf(genome).catch(() => null); if (!s) return 'no-source';
      const r = await finisher.request(s.source); if (r.status === 'original') memo.delete(o.identityOf(genome).visualKey); return r.status === 'original' ? 'retained' : 'fallback';
    },
    close(): void { reader.close(); finisher?.close(); },
  });
}

/** STAGE projection (Codex C40(c): the engine returns a full original-coordinate PNG, never an atlas). The deterministic runtime
 * generalisation of `tools/painted-creature/rebind-finished.mjs`: for every bound part, every atlas-frame pixel the part owns (atlas
 * alpha > 0) takes the finished RGB at the same place in the part's cut-out box; alpha is never touched, nothing outside a frame
 * changes, and the binding (frames, cut-outs, paint skin) stays byte-identical, so only the texture hash moves. Unrotated frames of
 * the cut-out's own size only; anything else refuses. */
export interface ProjectionPartV1 { readonly id: string; readonly frame: { x: number; y: number; width: number; height: number; rotated?: boolean }; readonly cutout: { x: number; y: number; width: number; height: number } }
export function projectFinishedToAtlasV1(o: { readonly atlas: Uint8Array; readonly atlasWidth: number; readonly atlasHeight: number; readonly finished: Uint8Array; readonly finishedWidth: number; readonly finishedHeight: number; readonly parts: readonly ProjectionPartV1[] }): Uint8Array {
  if (o.atlas.length !== o.atlasWidth * o.atlasHeight * 4 || o.finished.length !== o.finishedWidth * o.finishedHeight * 4) throw Error('projection: buffer sizes');
  const out = new Uint8Array(o.atlas);
  for (const p of o.parts) {
    const f = p.frame, c = p.cutout;
    if (f.rotated || f.width !== c.width || f.height !== c.height) throw Error(`projection: part ${p.id} frame is not its cut-out's own size`);
    if (f.x < 0 || f.y < 0 || f.x + f.width > o.atlasWidth || f.y + f.height > o.atlasHeight || c.x < 0 || c.y < 0 || c.x + c.width > o.finishedWidth || c.y + c.height > o.finishedHeight) throw Error(`projection: part ${p.id} out of bounds`);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const a = ((y + f.y) * o.atlasWidth + x + f.x) * 4; if (!o.atlas[a + 3]) continue;
      const s = ((y + c.y) * o.finishedWidth + x + c.x) * 4; out[a] = o.finished[s]!; out[a + 1] = o.finished[s + 1]!; out[a + 2] = o.finished[s + 2]!;
    }
  }
  return out;
}
