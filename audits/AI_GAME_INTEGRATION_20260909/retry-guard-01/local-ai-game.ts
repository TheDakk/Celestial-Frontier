/** Optional real-game adapter. Owns presentation jobs, never landing transactions,
 * routes, inventories or species grants. Successful local inference is not art acceptance. */
import { buildCanonicalLandfallConditioningV1 } from './landfall-conditioning.js';
import { AiLandfallJobsV1, type AiLandfallJobV1 } from './ai-landfall-jobs.js';
import { createAiLandfallOriginalStoreV1, type AiLandfallInputV1, type AiLandfallOriginalV1 } from './ai-landfall-originals.js';
import { createLocalModelDeliveryV1, probeLocalModelCapabilitiesV1 } from './local-model-delivery.js';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 } from './local-model-manifest.js';
import { LocalModelSha256V1 } from './local-model-sha256.js';
import { generateLocalLandfallV1, type LocalAiRuntimeConfigV1 } from './local-ai-runtime.js';
import type { BiomeVistaRenderRequestV1 } from './biome-vista-protocol.js';
import type { CanonicalWorldRoster } from './world-roster.js';

const digest = (text: string): string => new LocalModelSha256V1().update(new TextEncoder().encode(text)).digestHex();
const esc = (text: string): string => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const button = (action: string, label: string, jobId = ''): string => `<button type="button" data-ai-act="${action}" data-ai-job="${esc(jobId)}" style="min-height:44px;padding:8px 12px;background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:9px;cursor:pointer;font:12px system-ui">${label}</button>`;
export interface LocalAiGameV1 {
  prepare(request: BiomeVistaRenderRequestV1, roster: CanonicalWorldRoster): AiLandfallInputV1 | null;
  enqueue(input: AiLandfallInputV1): string;
  find(input: AiLandfallInputV1): Promise<AiLandfallOriginalV1 | null>;
  html(worldKey?: string): string;
  action(action: string, jobId: string): Promise<void>;
  snapshot(): readonly AiLandfallJobV1[];
}
export interface LocalAiGameOptionsV1 {
  readonly refresh: () => void;
  readonly notice: (title: string, message: string) => void;
  readonly view: (original: AiLandfallOriginalV1) => Promise<boolean>;
  readonly captureView: () => () => boolean;
}

/** An explicit development entry point loads a small same-origin runtime manifest.
 * Default gameplay never imports this module or requests model/runtime assets. */
export async function createLocalAiGameV1(options: LocalAiGameOptionsV1): Promise<LocalAiGameV1> {
  const response = await fetch('/__local_ai/runtime.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Local AI preview runtime is unavailable');
  const raw = await response.text();
  if (raw.length > 131072) throw new Error('Local AI runtime manifest is oversized');
  const config = JSON.parse(raw) as LocalAiRuntimeConfigV1;
  const ownUrl = (value: unknown): string => {
    if (typeof value !== 'string') throw new Error('Invalid local runtime URL');
    const url = new URL(value, location.href);
    if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      throw new Error('Local runtime must belong to this game origin');
    return url.href;
  };
  if (config.modelRevision !== PINNED_LOCAL_MODEL_MANIFEST_V1.revision || typeof config.q8Block32 !== 'boolean'
    || !config.reference || !/^[a-f0-9]{64}$/.test(config.reference.sha256)
    || config.reference.width !== 480 || config.reference.height !== 320
    || typeof config.reference.speciesVisualKey !== 'string' || config.reference.speciesVisualKey.length > 16384)
    throw new Error('Unpinned local runtime');
  const modelFiles: Record<string, string> = {};
  for (const file of PINNED_LOCAL_MODEL_MANIFEST_V1.files) modelFiles[file.path] = ownUrl(config.modelFiles?.[file.path]);
  if (config.q8Block32) for (const path of ['transformer-q8-block32.onnx', 'repacked-scale-zero.data']) modelFiles[path] = ownUrl(config.modelFiles?.[path]);
  const runtime: LocalAiRuntimeConfigV1 = Object.freeze({ ...config, workerUrl: ownUrl(config.workerUrl),
    modelFiles: Object.freeze(modelFiles), reference: Object.freeze({ ...config.reference, url: ownUrl(config.reference.url) }) });
  const capability = await probeLocalModelCapabilitiesV1();
  const store = createAiLandfallOriginalStoreV1();
  let deliveryBusy: AbortController | null = null, useInstalled = false, status = '';
  const delivery = createLocalModelDeliveryV1({ manifest: PINNED_LOCAL_MODEL_MANIFEST_V1,
    onStatus: value => { status = `Model ${value.phase} · ${(value.verifiedBytes / 1e9).toFixed(2)} / 6.69 GB verified`; options.refresh(); } });
  const jobs = new AiLandfallJobsV1({ store,
    generate: async (input, signal, progress) => {
      if (!capability.supported) throw new Error('Required local model capabilities are unavailable');
      const urls: string[] = [];
      try {
        let source = runtime;
        if (useInstalled) {
          if (!delivery.status().ready) throw new Error('Installed model has not been verified');
          const files: Record<string, string> = {};
          for (const file of delivery.manifest.files) {
            if (signal.aborted) throw new DOMException('Canceled', 'AbortError');
            const url = URL.createObjectURL(await delivery.openFile(file.path)); urls.push(url); files[file.path] = url;
          }
          // The optional desktop derivative is not part of the pinned portable install.
          source = { ...runtime, modelFiles: files, q8Block32: false };
        }
        return await generateLocalLandfallV1(input, signal, progress, source);
      } finally { for (const url of urls) URL.revokeObjectURL(url); }
    },
    onChange: () => options.refresh(),
    onReady: () => options.notice('Landfall painting ready', 'Your Earth painting is stored. Open Notifications or Earth’s Survey card to view it.'),
  });
  const rowHtml = (job: AiLandfallJobV1): string => {
    const active = ['queued', 'generating', 'retaining', 'canceling'].includes(job.status);
    const eta = job.progress.etaMs === null ? 'ETA estimating' : `About ${Math.max(1, Math.ceil(job.progress.etaMs / 1000))}s drawing + final processing`;
    return `<div data-ai-landfall-job="${job.jobId}" style="flex-basis:100%;min-width:0;padding:8px 0"><strong>${active ? 'Landing' : job.status === 'ready' ? 'Landfall ready' : 'Landfall ' + esc(job.status)}</strong>`
      + (active ? `<div>${esc(job.progress.phase)} · ${eta}</div><progress aria-label="Landing work completed" max="100" value="${job.progress.completed}" style="width:100%;accent-color:#dfbc74"></progress>${job.status !== 'canceling' ? button('cancel', 'Cancel painting', job.jobId) : ''}`
        : job.status === 'ready' ? button('view', 'View landfall', job.jobId)
          : `<p>The painting ${job.status === 'canceled' ? 'was canceled' : 'could not finish'}. Your expedition is safe.</p>${button('retry', 'Retry painting', job.jobId)}`) + '</div>';
  };
  const api: LocalAiGameV1 = {
    prepare(request, roster) {
      const compiled = buildCanonicalLandfallConditioningV1(request, roster);
      if (!compiled.ok || compiled.recipe.referenceRequirements[0]?.subjectIdentityKey !== runtime.reference.speciesVisualKey) return null;
      const recipeJson = JSON.stringify({ schema: 'cf.ai-landfall-render.v1', conditioning: compiled.recipe,
        width: 1024, height: 576, steps: 4, seed: 133, modelRevision: runtime.modelRevision,
        runtimeVersion: 'cf.local-ai-worker.v1', modelManifestSha256: PINNED_LOCAL_MODEL_MANIFEST_V1.sourceManifestSha256,
        q8Block32: useInstalled ? false : runtime.q8Block32,
        reference: { sha256: runtime.reference.sha256, width: 480, height: 320, speciesVisualKey: runtime.reference.speciesVisualKey },
        negativePromptHandling: 'metadata-only-not-consumed-by-klein', qualityAccepted: false });
      return Object.freeze({ recipeKey: digest(recipeJson), worldKey: request.worldKey,
        environmentId: request.environmentFingerprint, ecologyEpoch: roster.ecologyEpoch,
        snapshotDigest: digest(compiled.snapshotKey), recipeJson });
    },
    enqueue: input => {
      if (deliveryBusy) throw new Error('Finish model storage before queuing a painting');
      return jobs.enqueue(input);
    }, find: input => store.find(input), snapshot: () => jobs.snapshot(),
    html(worldKey) {
      const rows = jobs.snapshot().filter(row => worldKey === undefined || row.input.worldKey === worldKey);
      return `<div data-local-ai style="flex-basis:100%;min-width:0"><p style="font-size:12px">Local AI preview · Earth anatomy study · art and phone quality under review.</p>${rows.map(rowHtml).join('')}`
        + (worldKey !== undefined && rows.length === 0 ? '<p style="font-size:12px">Supported Earth landings queue a painting while you keep exploring.</p>' : '')
        + `<details><summary style="min-height:44px;cursor:pointer">Local model storage</summary><p>6.69 GB model, separate from your artwork cache. ${capability.supported ? 'Required browser features detected; device performance is unqualified.' : 'This browser lacks required local model features.'}</p><p>${esc(status || 'Using this preview’s verified local developer cache.')}</p>`
        + (deliveryBusy ? button('stop-download', 'Pause download') : button('install', 'Download / resume 6.69 GB') + button('verify', 'Use verified browser copy'))
        + '<p>Downloads start only when selected. Pausing retains verified chunks. Originals are retained separately; no automatic original deletion.</p></details></div>';
    },
    async action(action, jobId) {
      if (action === 'cancel') { jobs.cancel(jobId); return; }
      const job = jobs.snapshot().find(row => row.jobId === jobId);
      if (action === 'view' && job?.status === 'ready' && job.originalId) {
        const stillCurrent = options.captureView();
        const original = await store.read(job.input, job.originalId);
        if (!stillCurrent()) return;
        if (!original || !await options.view(original)) options.notice('Landfall retained', 'Return to this Earth landing to view its painting. Its original remains stored.');
      } else if (action === 'retry' && job && ['failed', 'canceled'].includes(job.status)) {
        const priorModel = (JSON.parse(job.input.recipeJson) as { q8Block32: unknown }).q8Block32;
        if (priorModel !== (useInstalled ? false : runtime.q8Block32)) {
          options.notice('Model selection changed', 'Land on this world again to create a new painting with your selected model.');
          return;
        }
        // Retry preserves the failed/canceled recipe; a new model needs a new landing input.
        api.enqueue(job.input);
      } else if (action === 'stop-download') deliveryBusy?.abort();
      else if ((action === 'install' || action === 'verify') && !deliveryBusy) {
        if (jobs.snapshot().some(row => ['generating', 'retaining', 'queued', 'canceling'].includes(row.status))) { options.notice('Painting in progress', 'Finish or cancel the painting before changing model storage.'); return; }
        deliveryBusy = new AbortController(); options.refresh();
        try {
          const result = action === 'install' ? await delivery.install({ signal: deliveryBusy.signal }) : await delivery.verify({ signal: deliveryBusy.signal });
          useInstalled = result.ready;
          if (!result.ready) status += ' · ' + (result.error ?? 'Not ready');
        } finally { deliveryBusy = null; options.refresh(); }
      }
    },
  };
  return Object.freeze(api);
}
