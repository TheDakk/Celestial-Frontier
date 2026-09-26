/// <reference types="vite/client" />
/** Ordinary Land presentation owner. Kit compiler/composite/finisher only; no route or save authority. */
import kit from '../../../../../ART_KIT.md?raw';
import assets from './kit-earth-assets.json';
import baseline from './kit-earth-baseline.json';
import { buildCanonicalLandfallConditioningV1, compileEarthKitEngineV4 } from './landfall-conditioning.js';
import { createWarmKitLandfallRuntimeV4 } from './local-ai-kit-runtime.js';
import { AiLandfallJobsV1, type AiLandfallJobV1 } from './ai-landfall-jobs.js';
import { createAiLandfallOriginalStoreV1, type AiLandfallInputV1, type AiLandfallOriginalV1 } from './ai-landfall-originals.js';
import { createLocalModelDeliveryV1, probeLocalModelCapabilitiesV1 } from './local-model-delivery.js';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 } from './local-model-manifest.js';
import { LocalModelSha256V1 } from './local-model-sha256.js';
import {hashLandfallBufferV1} from './landfall-content-hash.js';
import { createLandfallViewerV1, captureLandfallFocusReturnV1, type LandfallViewerV1 } from './landfall-viewer.js';
import type { BiomeVistaRenderRequestV1 } from './biome-vista-protocol.js';
import type { CanonicalWorldRoster } from './world-roster.js';
const digest = (text: string): string => new LocalModelSha256V1().update(new TextEncoder().encode(text)).digestHex();
const esc = (text: string): string => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const button = (action: string, label: string, jobId = ''): string => `<button type="button" data-ai-act="${action}" data-ai-job="${esc(jobId)}" style="min-height:44px;padding:8px 12px;background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:9px;cursor:pointer;font:12px system-ui">${label}</button>`;
export interface LocalAiGameV1 {
  prepare(request: BiomeVistaRenderRequestV1, roster: CanonicalWorldRoster): AiLandfallInputV1 | null;
  composite(input: AiLandfallInputV1): Promise<Blob>;
  enqueue(input: AiLandfallInputV1): string;
  find(input: AiLandfallInputV1): Promise<AiLandfallOriginalV1 | null>;
  html(worldKey?: string): string;
  inspect(input: AiLandfallInputV1, originalId: string): Promise<void>;
  closeInspector(): void;
  action(action: string, jobId: string): Promise<void>;
  snapshot(): readonly AiLandfallJobV1[];
}
export interface LocalAiGameOptionsV1 {
  readonly refresh: () => void;
  readonly notice: (title: string, message: string) => void;
  readonly view: (original: AiLandfallOriginalV1) => Promise<boolean>;
  readonly captureView: () => () => boolean;
}
/** Canonical JSON makes presentation identity independent of property insertion order. */
export function canonicalKitJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalKitJson).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalKitJson((value as Record<string, unknown>)[key])).join(',') + '}';
  const result = JSON.stringify(value); if (result === undefined) throw Error('Unsupported recipe value'); return result;
}
export async function createLocalAiGameV1(options: LocalAiGameOptionsV1): Promise<LocalAiGameV1> {
  const capability = await probeLocalModelCapabilitiesV1();
  const store = createAiLandfallOriginalStoreV1();
  let deliveryBusy: AbortController | null = null, status = '', storageError = '';
  let runtime: ReturnType<typeof createWarmKitLandfallRuntimeV4> | null = null;
  let viewer: LandfallViewerV1 | null = null, inspectionSequence = 0;
  let modelFiles: Readonly<Record<string, string | Blob>> | null = null;
  let compositePromise: Promise<Blob> | null = null;
  const disclosure = { notifications: false, survey: false };
  const delivery = createLocalModelDeliveryV1({ manifest: PINNED_LOCAL_MODEL_MANIFEST_V1,
    onStatus: value => { status = `Model ${value.phase} · ${(value.verifiedBytes / 1e9).toFixed(2)} / 6.69 GB verified`; options.refresh(); } });
  // Optional same-origin developer parent-model transport. No derivatives, downloads or query gate.
  try {
    const response = await fetch('/__local_ai/runtime.json', { cache: 'no-store' });
    if (response.ok) {
      const text = await response.text(); if (text.length > 131072) throw Error('Runtime manifest oversized');
      const config = JSON.parse(text);
      if (config.modelId !== PINNED_LOCAL_MODEL_MANIFEST_V1.modelId || config.modelRevision !== PINNED_LOCAL_MODEL_MANIFEST_V1.revision
        || config.modelSource !== 'verified-installed-developer-cache') throw Error('Unverified developer model source');
      const files: Record<string, string> = {};
      for (const file of PINNED_LOCAL_MODEL_MANIFEST_V1.files) {
        if (typeof config.modelFiles?.[file.path] !== 'string') throw Error('Missing parent model file');
        const url = new URL(config.modelFiles[file.path], location.href);
        if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw Error('Model URL must share game origin');
        files[file.path] = url.href;
      }
      modelFiles = Object.freeze(files);
    }
  } catch (error) { status = 'Local model is not ready. Install or verify your browser copy.'; storageError = String(error).slice(0, 1024); }
  const readComposite = (): Promise<Blob> => {
    compositePromise ??= (async () => {
      const response = await fetch(baseline.composite.url); if (!response.ok) throw Error('Earth composite unavailable');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > 16 * 1024 * 1024 || await hashLandfallBufferV1(bytes) !== baseline.composite.sha256) throw Error('Earth composite changed');
      return new Blob([bytes], { type: 'image/png' });
    })().catch(error => { compositePromise = null; throw error; });
    return compositePromise;
  };
  // Start only the small painter image at boot; never wait for a model to show a landing.
  void readComposite().catch(() => {});
  const isAcceptedRecipe = (input: AiLandfallInputV1): boolean => input.recipeKey === baseline.acceptedPainting.recipeSha256
    && digest(input.recipeJson) === baseline.acceptedPainting.recipeSha256;
  const jobs = new AiLandfallJobsV1({ store,
    generate: async (input, signal, progress) => {
      if (isAcceptedRecipe(input)) {
        const response = await fetch(baseline.acceptedPainting.url, { signal });
        if (!response.ok) throw Error('Accepted Earth painting unavailable');
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > 16 * 1024 * 1024 || await hashLandfallBufferV1(bytes) !== baseline.acceptedPainting.sha256) throw Error('Accepted Earth painting changed');
        return { blob: new Blob([bytes], { type: 'image/png' }), width: baseline.settings.width, height: baseline.settings.height };
      }
      if (!capability.supported || !modelFiles) throw Error('Local finisher is unavailable; the painter stays visible');
      runtime ??= createWarmKitLandfallRuntimeV4('/__local_ai/kit-stage-worker.mjs', modelFiles);
      let completed = 0;
      const recipe = JSON.parse(input.recipeJson) as ReturnType<typeof compileEarthKitEngineV4>;
      const result = await runtime.generate(recipe, signal, event => {
        if (event.type === 'progress') {
          completed = Math.min(95, completed + .1);
          progress({ phase: String(event.phase ?? 'Finishing painting'), completed, total: 100, etaMs: null });
        }
      });
      return { blob: result.painting, width: result.width, height: result.height };
    },
    onChange: () => options.refresh(),
    onReady: (_job, original) => { void options.view(original).catch(() => options.notice('Landfall retained', 'Open View or Inspect to see the retained painting.')); options.refresh(); },
  });
  const api: LocalAiGameV1 = {
    prepare(request, roster) {
      const compiled = buildCanonicalLandfallConditioningV1(request, roster); if (!compiled.ok) return null;
      try {
        const recipe = compileEarthKitEngineV4(compiled.recipe.sourceSnapshot, kit, assets, { ...baseline.settings, compositionProfile: 'weather-mat-v1' });
        const recipeJson = canonicalKitJson(recipe);
        return Object.freeze({ recipeKey: digest(recipeJson), worldKey: request.worldKey,
          environmentId: request.environmentFingerprint, ecologyEpoch: roster.ecologyEpoch,
          snapshotDigest: digest(compiled.snapshotKey), recipeJson });
      } catch { return null; }
    },
    composite: () => readComposite(),
    enqueue(input) {
      if (!isAcceptedRecipe(input) && (!modelFiles || !capability.supported || deliveryBusy)) return '';
      return jobs.enqueue(input);
    },
    find: input => store.find(input), snapshot: () => jobs.snapshot(),
    closeInspector: () => { inspectionSequence++; viewer?.close(); },
    async inspect(input, originalId) {
      const sequence = ++inspectionSequence, stillCurrent = options.captureView();
      const returnFocus = captureLandfallFocusReturnV1(), original = await store.read(input, originalId);
      if (sequence !== inspectionSequence || !stillCurrent()) { options.notice('View changed', 'Open Inspect again to view this retained painting.'); return; }
      if (!original) { options.notice('Painting unavailable', 'The retained original could not be verified.'); return; }
      viewer ??= createLandfallViewerV1(); await viewer.open(original, returnFocus);
    },
    html(worldKey) {
      const scope = worldKey === undefined ? 'notifications' : 'survey';
      const rows = jobs.snapshot().filter(row => worldKey === undefined || row.input.worldKey === worldKey);
      const html = rows.map(job => {
        const active = ['queued', 'generating', 'retaining', 'canceling'].includes(job.status);
        return `<div data-ai-landfall-job="${job.jobId}"><strong>${active ? 'Finishing landfall' : job.status === 'ready' ? 'Landfall ready' : 'Painting ' + esc(job.status)}</strong>`
          + (active ? `<p>${esc(job.progress.phase)}</p><progress aria-label="Painting progress" max="100" value="${job.progress.completed}"></progress>${button('cancel', 'Cancel painting', job.jobId)}`
            : job.status === 'ready' ? button('view', 'View', job.jobId) + button('inspect', 'Inspect', job.jobId)
              : `<p>Your expedition and painter are safe.</p>${button('retry', 'Retry painting', job.jobId)}`) + '</div>';
      }).join('');
      return `<div data-local-ai data-ai-model-selection="kit-tier-2" data-ai-storage-error="${esc(storageError)}" style="flex-basis:100%;min-width:0">${html}<details data-ai-model-storage="${scope}"${disclosure[scope] ? ' open' : ''}><summary style="min-height:44px;cursor:pointer">Local painting engine</summary><p>The painter appears immediately. The local finisher adds detail when ready. Earth is the first supported kit biome.</p><p>6.69 GB model, separate from retained originals. ${esc(status || (modelFiles ? 'Model ready.' : 'Install or verify your browser copy.'))}</p>`
        + (deliveryBusy ? button('stop-download', 'Pause model preparation') : button(delivery.status().phase === 'invalid' ? 'restart-install' : 'install', delivery.status().phase === 'invalid' ? 'Restart damaged model install' : 'Download / resume model') + button('verify', 'Verify browser copy'))
        + '<p>Downloads start only when selected. Retained originals are never automatically deleted.</p></details></div>';
    },
    async action(action, jobId) {
      const job = jobs.snapshot().find(row => row.jobId === jobId);
      if (action === 'cancel') { jobs.cancel(jobId); return; }
      if (action === 'inspect' && job?.status === 'ready' && job.originalId) { await api.inspect(job.input, job.originalId); return; }
      if (action === 'view' && job?.status === 'ready' && job.originalId) {
        const stillCurrent = options.captureView(), original = await store.read(job.input, job.originalId);
        if (!stillCurrent() || !original || !await options.view(original)) options.notice('Landfall retained', 'Land on this world to view its painting, or use Inspect here.');
        return;
      }
      if (action === 'retry' && job && ['failed', 'canceled'].includes(job.status)) { api.enqueue(job.input); return; }
      if (action === 'stop-download') { deliveryBusy?.abort(); return; }
      if (!['install', 'restart-install', 'verify'].includes(action) || deliveryBusy) return;
      if (jobs.snapshot().some(row => ['queued', 'generating', 'retaining', 'canceling'].includes(row.status))) { options.notice('Painting in progress', 'Finish or cancel the painting before changing model storage.'); return; }
      deliveryBusy = new AbortController(); storageError = ''; options.refresh();
      try {
        runtime?.dispose(); runtime = null; modelFiles = null;
        const result = action === 'verify' ? await delivery.verify({ signal: deliveryBusy.signal }) : await delivery.install({ signal: deliveryBusy.signal, restart: action === 'restart-install' });
        if (deliveryBusy.signal.aborted) { status = 'Model preparation paused.'; return; }
        if (result.ready) {
          const files: Record<string, Blob> = {};
          for (const file of delivery.manifest.files) { if (deliveryBusy.signal.aborted) throw new DOMException('Paused', 'AbortError'); files[file.path] = await delivery.openFile(file.path); }
          modelFiles = Object.freeze(files); status = 'Model ready. Land to finish a painting.';
        }
      } catch (error) {
        if (deliveryBusy.signal.aborted || error instanceof DOMException && error.name === 'AbortError') { status = 'Model preparation paused.'; return; }
        storageError = String(error instanceof Error ? error.message : error).slice(0, 1024); throw error;
      } finally { deliveryBusy = null; options.refresh(); }
    },
  };
  document.addEventListener('toggle', event => {
    const target = event.target as HTMLDetailsElement | null, scope = target?.dataset.aiModelStorage;
    if (target?.isConnected && (scope === 'notifications' || scope === 'survey')) disclosure[scope] = target.open;
  }, true);
  globalThis.addEventListener('pagehide', () => {
    deliveryBusy?.abort(); api.closeInspector();
    for (const job of jobs.snapshot()) if (['queued', 'generating', 'retaining', 'canceling'].includes(job.status)) jobs.cancel(job.jobId);
  });
  return Object.freeze(api);
}
