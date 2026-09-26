/** @module creature-finish-app [app] — G5 in the game (audits/G5_ROUTING_20260926/README.md), behind `?finish=1` until Nick's quality
 * review. Composes, without new authority of its own:
 * - Codex's engine (creature-finish-engine.ts) and store (creature-originals.ts);
 * - the route (creature-finish-route.ts): tier, source, identity, store-only lookup, desktop enqueue;
 * - a desktop inference ADAPTER over the same-origin developer model transport local-ai-game already uses
 *   (`/__local_ai/runtime.json` + `/__local_ai/kit-stage-worker.mjs`), speaking the worker's `creature-finish-v1` job with
 *   transferred ArrayBuffers (Codex C43(b)); the worker pads 1254² sources to 16 itself (C43(a));
 * - `fitFor`: the painting that draws the creature (G4), its pinned record/binding over the stage's asset source, and its master and
 *   labels from the pinned on-demand library (`library/creature-finish-source/<creatureId>/`, tools/morph/build-finish-sources.mjs).
 * Phones never construct a model (the engine's phone tier); they read delivered originals (Codex's createCreatureFinishDeliveryV1). */
import { speciesVisualKey } from '@cf/art/species-identity';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { gunzipTransportBytes } from './battle2-master-pin-admission.js';
import { getBattle2MasterPin } from './battle2-master-pins.generated.js';
import type { Battle2AssetSource } from './battle2-wiring.js';
import { fetchArtLibraryBytesV1, type ArtLibraryOptionsV1 } from './art-library.js';
import { admitCreatureFinishedAtlasV1, createCreatureFinishDeliveryV1 } from './creature-finish-admission.js';
import type { Battle2PinnedBytesV1 } from './battle2-master-pin-admission.js';
import { creatureFinishIdentityV1, type CreatureFinishInferV1 } from './creature-finish-engine.js';
import { createCreatureFinishRouteV1, finishTierV1, type FinishFitBytesV1 } from './creature-finish-route.js';
import { createAiCreatureOriginalStoreV1, type AiCreatureInputV1 } from './creature-originals.js';
import { compileCreatureFinishV1 } from './landfall-conditioning.js';
import { probeLocalModelCapabilitiesV1 } from './local-model-delivery.js';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 } from './local-model-manifest.js';
import { LocalModelSha256V1 } from './local-model-sha256.js';
import { paintedArtV2 } from './morph/painted-variants.js';

const sha = (b: Uint8Array): string => new LocalModelSha256V1().update(b).digestHex();
/** The model identity every finish binds: the pinned local model manifest, canonically serialised. */
export const creatureFinishModelHashV1 = (): string => sha(new TextEncoder().encode(JSON.stringify(PINNED_LOCAL_MODEL_MANIFEST_V1)));

/** The same-origin developer model transport (the checks local-ai-game applies), or null when this origin has none. */
export async function developerFinishRuntimeV1(fetchImpl: typeof fetch = fetch, origin: string = location.origin): Promise<{ workerUrl: string; modelFiles: Readonly<Record<string, string>> } | null> {
  try {
    const r = await fetchImpl('/__local_ai/runtime.json', { cache: 'no-store' }); if (!r.ok) return null;
    const text = await r.text(); if (text.length > 131072) return null;
    const c = JSON.parse(text) as { modelId?: string; modelRevision?: string; modelSource?: string; modelFiles?: Record<string, unknown> };
    if (c.modelId !== PINNED_LOCAL_MODEL_MANIFEST_V1.modelId || c.modelRevision !== PINNED_LOCAL_MODEL_MANIFEST_V1.revision || c.modelSource !== 'verified-installed-developer-cache') return null;
    const files: Record<string, string> = {};
    for (const f of PINNED_LOCAL_MODEL_MANIFEST_V1.files) { const v = c.modelFiles?.[f.path]; if (typeof v !== 'string') return null;
      const url = new URL(v, origin + '/'); if (url.origin !== origin || url.username || url.password) return null; files[f.path] = url.href; }
    return { workerUrl: '/__local_ai/kit-stage-worker.mjs', modelFiles: Object.freeze(files) };
  } catch { return null; }
}

/** The desktop inference adapter (Codex's native client, generalised): one worker, one job at a time (the engine is serial), fresh
 * transferred copies of the source RGBA and labels, the recipe re-derived and pin-checked against the source's settings hash. */
export function createFinishInferV1(o: { readonly workerUrl: string; readonly modelFiles: Readonly<Record<string, string | Blob>>; readonly modelHash: string;
  readonly cutoutOf: (individualId: string, settingsHash: string) => string | null; readonly WorkerCtor?: typeof Worker; readonly timeoutMs?: number }): () => Promise<CreatureFinishInferV1> {
  return async () => {
    const W = o.WorkerCtor ?? Worker; let worker: Worker | null = null, sequence = 0;
    return async (s) => {
      if (s.modelHash !== o.modelHash) throw Error('finish adapter: model pin');
      const cutout = o.cutoutOf(s.individualId, s.settingsHash); if (!cutout) throw Error('finish adapter: unknown source');
      const inputSeed = (s.seed ^ Number.parseInt(s.recordRecipeHash.slice(0, 8), 16)) >>> 0;
      const ref = (b: Uint8Array) => ({ width: s.width, height: s.height, sha256: sha(b), buffer: b.slice().buffer as ArrayBuffer });
      const recipe = compileCreatureFinishV1({ recordRecipeHash: s.recordRecipeHash, cutoutAssetHash: cutout, seed: inputSeed, width: s.width, height: s.height, master: ref(s.rgba), labels: ref(s.labels) });
      if (recipe.seed !== s.seed || sha(new TextEncoder().encode(JSON.stringify({ settings: recipe.settings, prompt: recipe.prompt, seed: recipe.seed }))) !== s.settingsHash) throw Error('finish adapter: settings pin');
      worker ??= new W(o.workerUrl, { type: 'module', name: 'cf-creature-finish-v1' });
      const w = worker, requestId = ++sequence, master = recipe.master as { buffer: ArrayBuffer }, labels = recipe.labels as { buffer: ArrayBuffer };
      const rgba = await new Promise<Uint8Array>((resolve, reject) => {
        const timer = setTimeout(() => { worker?.terminate(); worker = null; reject(Error('finish adapter: deadline')); }, o.timeoutMs ?? 600_000);
        w.onmessage = ({ data }: MessageEvent<Record<string, unknown>>) => {
          if (data.type === 'progress') return; if (data.requestId !== requestId) return; clearTimeout(timer);
          if (data.type === 'error') { reject(Error(String(data.message))); return; }
          const out = data.rgba instanceof Uint8Array || data.rgba instanceof Uint8ClampedArray ? new Uint8Array(data.rgba) : data.rgba instanceof ArrayBuffer ? new Uint8Array(data.rgba).slice() : null;
          if (data.type !== 'complete' || !out || out.length !== s.width * s.height * 4) { reject(Error('finish adapter: result contract')); return; }
          resolve(out); };
        w.onerror = (e) => { clearTimeout(timer); worker?.terminate(); worker = null; reject(Error(e.message || 'finish worker failed')); };
        w.postMessage({ stage: 'creature-finish-v1', requestId, recipe, modelFiles: o.modelFiles }, [master.buffer, labels.buffer]);
      });
      return { rgba, labels: s.labels.slice(), binding: s.binding.slice() };
    };
  };
}

/** Which painted archetype's fit a creature's finish starts from, with its pinned bytes; null when none is finishable. */
/** `assets`: the stage's pinned asset source. Loaded lazily (never on the boot path; battle2 code stays behind its own gate until a
 * finish lookup first needs a fit, and only under `?finish=1`). */
export function appFinishFitForV1(assetsOf: () => Promise<Battle2AssetSource> = async () => (await import('./battle2-wiring.js')).devAssetSource(), library: ArtLibraryOptionsV1 = {}) {
  let assetsP: Promise<Battle2AssetSource> | null = null;
  const painted = new Set(BATTLE2_PARTS_FITS.map((f) => f.earthName));
  return async (genome: Readonly<Record<string, unknown>>): Promise<(FinishFitBytesV1 & { creatureId: string }) | null> => {
    const art = paintedArtV2(genome, painted); if (!art) return null;
    const fit = BATTLE2_PARTS_FITS.find((f) => f.earthName === art.earthName); const assets = await (assetsP ??= assetsOf()); if (!fit || !assets.bytes) return null;
    const manifest = await assets.json(fit.dir + 'parts/manifest.json') as { creatureId?: string }; const id = manifest.creatureId;
    if (typeof id !== 'string' || !getBattle2MasterPin(id)) return null;
    const [record, bindingGz, masterPng, labelsPng] = await Promise.all([assets.json(fit.dir + 'record.json') as Promise<FinishFitBytesV1['record']>, assets.bytes(fit.dir + 'binding.json.gz'),
      fetchArtLibraryBytesV1(`library/creature-finish-source/${id}/master.png`, library), fetchArtLibraryBytesV1(`library/creature-finish-source/${id}/labels.png`, library)]);
    return { creatureId: id, record, binding: await gunzipTransportBytes(bindingGz), masterPng, labelsPng };
  };
}

/** STAGE (CARD = STAGE, Codex C45(a)): the creature's retained finish, admitted by Codex's admitCreatureFinishedAtlasV1 against the
 * rig's own pinned bytes, as the loader's `finishedAtlas` capability; the loader composes the individual's morph on top. null = none. */
export function stageFinishV1(route: { retained: (g: Readonly<Record<string, unknown>>) => Promise<{ fit: FinishFitBytesV1; source: Parameters<typeof creatureFinishIdentityV1>[0]; original: Parameters<typeof admitCreatureFinishedAtlasV1>[2] } | null> }) {
  return async (genome: Readonly<Record<string, unknown>>, pinned: Battle2PinnedBytesV1): Promise<{ token: unknown; identity: AiCreatureInputV1 } | null> => {
    const r = await route.retained(genome); if (!r) return null;
    const token = await admitCreatureFinishedAtlasV1(pinned, r.source, r.original, r.fit.labelsPng);
    return { token, identity: creatureFinishIdentityV1(r.source) };
  };
}

/** The in-game route, or null. Desktop inference only over the developer transport; otherwise delivered/retained originals only. */
export async function createAppFinishRouteV1(o: { readonly fetchImpl?: typeof fetch } = {}) {
  const fetchImpl = o.fetchImpl ?? fetch, touch = navigator.maxTouchPoints > 0 || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  const tier = finishTierV1(await probeLocalModelCapabilitiesV1().catch(() => null), touch ? 'phone' : 'desktop'), modelHash = creatureFinishModelHashV1();
  const runtime = tier === 'desktop' ? await developerFinishRuntimeV1(fetchImpl) : null, cutouts = new Map<string, string>();
  const fitFor = appFinishFitForV1(undefined, { fetchImpl });
  const route = createCreatureFinishRouteV1({ tier: runtime ? 'desktop' : 'phone', store: createAiCreatureOriginalStoreV1(), modelHash,
    identityOf: (g) => ({ visualKey: speciesVisualKey(g as Record<string, unknown>), seed: Number(g.seed) >>> 0 }),
    fitFor,
    delivered: createCreatureFinishDeliveryV1({ fetchImpl }),
    onSource: (src) => cutouts.set(src.individualId + '|' + src.settingsHash, src.cutoutAssetHash),
    ...(runtime ? { createInfer: createFinishInferV1({ ...runtime, modelHash, cutoutOf: (id, settings) => cutouts.get(id + '|' + settings) ?? null }) } : {}) });
  return Object.freeze({ ...route, stage: stageFinishV1(route) });
}
