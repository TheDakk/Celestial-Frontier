/** Optional real-game adapter. Owns presentation jobs, never landing transactions,
 * routes, inventories or species grants. Successful local inference is not art acceptance. */
import { buildCanonicalLandfallConditioningV1, buildCanonicalLandfallConditioningV2, buildLandfallConditioningV1, buildLandfallConditioningV2, type LandfallConditioningResultV1, type LandfallConditioningResultV2 } from './landfall-conditioning.js';
import { AiLandfallJobsV1, type AiLandfallJobV1 } from './ai-landfall-jobs.js';
import { createAiLandfallOriginalStoreV1, type AiLandfallInputV1, type AiLandfallOriginalV1 } from './ai-landfall-originals.js';
import { createLocalModelDeliveryV1, probeLocalModelCapabilitiesV1 } from './local-model-delivery.js';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 } from './local-model-manifest.js';
import { LocalModelSha256V1 } from './local-model-sha256.js';
import { deriveLocalModelVariantV1, LOCAL_MODEL_VARIANT_PLAN_SHA256_V1, LOCAL_MODEL_VARIANT_FILES_V1 } from './local-model-variant.js';
import { createLocalModelVariantStorageV1 } from './local-model-variant-storage.js';
import { createLandfallViewerV1, captureLandfallFocusReturnV1, type LandfallViewerV1 } from './landfall-viewer.js';
import { generateLocalLandfallV1, validateLocalAiReferencesV2, localAiReferenceBindingV2, type LocalAiRuntimeConfigV1 } from './local-ai-runtime.js';
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
  inspect(input: AiLandfallInputV1, originalId: string): Promise<void>;
  closeInspector(): void;
  action(action: string, jobId: string): Promise<void>;
  snapshot(): readonly AiLandfallJobV1[];
}
export interface LocalAiGameRuntimeManifestV1 extends LocalAiRuntimeConfigV1 {
  readonly schema: 'cf.local-ai-game-preview.v1' | 'cf.local-ai-runtime-pack.v1';
  readonly modelSource: 'verified-installed-developer-cache' | 'synthetic-fixture' | 'verified-opfs-only';
  readonly modelId: string;
  readonly fixture?: boolean;
  readonly sourceManifestSha256?: string;
  readonly autoDownload?: boolean;
  readonly variantPlan?: { readonly url: string; readonly sha256: string; readonly bytes: number; readonly payloadBytes: number };
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
  const config = JSON.parse(raw) as LocalAiGameRuntimeManifestV1;
  const installedOnly = config.schema === 'cf.local-ai-runtime-pack.v1';
  if (config.modelId !== PINNED_LOCAL_MODEL_MANIFEST_V1.modelId
    || (installedOnly ? config.modelSource !== 'verified-opfs-only' || config.q8Block32 !== false
      || config.autoDownload !== false || config.sourceManifestSha256 !== PINNED_LOCAL_MODEL_MANIFEST_V1.sourceManifestSha256
      || !config.modelFiles || Object.keys(config.modelFiles).length !== 0
      : config.schema !== 'cf.local-ai-game-preview.v1'
        || !['verified-installed-developer-cache', 'synthetic-fixture'].includes(config.modelSource)
        || (config.modelSource === 'synthetic-fixture' && config.fixture !== true)))
    throw new Error('Unpinned model delivery source');
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
  if (config.references !== undefined) validateLocalAiReferencesV2(config.references);
  let variantPlan: LocalAiGameRuntimeManifestV1['variantPlan'];
  if (config.variantPlan !== undefined) {
    const plan = config.variantPlan;
    if (!plan || Object.keys(plan).sort().join(',') !== 'bytes,payloadBytes,sha256,url'
      || plan.sha256 !== LOCAL_MODEL_VARIANT_PLAN_SHA256_V1 || plan.bytes !== 142918 || plan.payloadBytes !== 352323881)
      throw new Error('Unpinned browser variant plan');
    variantPlan = Object.freeze({ ...plan, url: ownUrl(plan.url) });
  }
  const modelFiles: Record<string, string> = {};
  if (!installedOnly) for (const file of PINNED_LOCAL_MODEL_MANIFEST_V1.files) modelFiles[file.path] = ownUrl(config.modelFiles?.[file.path]);
  if (config.q8Block32) for (const path of ['transformer-q8-block32.onnx', 'repacked-scale-zero.data']) modelFiles[path] = ownUrl(config.modelFiles?.[path]);
  const runtime: LocalAiRuntimeConfigV1 = Object.freeze({ ...config, workerUrl: ownUrl(config.workerUrl),
    modelFiles: Object.freeze(modelFiles), reference: Object.freeze({ ...config.reference, url: ownUrl(config.reference.url) }),
    ...(config.references === undefined ? {} : { references: Object.freeze(config.references.map(row =>
      Object.freeze({ ...row, url: ownUrl(row.url) }))) }) });
  const capability = await probeLocalModelCapabilitiesV1();
  const store = createAiLandfallOriginalStoreV1();
  let deliveryBusy: AbortController | null = null, useInstalled = installedOnly, useVariant = false, status = '';
  let variantBusy = false, storageError = '';
  let viewer: LandfallViewerV1 | null = null, inspectionSequence = 0;
  const disclosure = { notifications: false, survey: false };
  const disclosureDocument = globalThis.document;
  // Refilled panels retain the player's native disclosure choice, independently
  // per surface. Observe toggle without refilling or taking focus/scroll ownership.
  const onStorageToggle = (event: Event): void => {
    const target = event.target as HTMLDetailsElement | null;
    if (!target?.isConnected || target.tagName !== 'DETAILS') return;
    const scope = target.dataset.aiModelStorage;
    if ((scope !== 'notifications' && scope !== 'survey')
      || !target.closest(scope === 'notifications' ? '#notificationpanel' : '#survey')) return;
    disclosure[scope] = target.open;
  };
  const delivery = createLocalModelDeliveryV1({ manifest: PINNED_LOCAL_MODEL_MANIFEST_V1,
    onStatus: value => { status = `Model ${value.phase} · ${(value.verifiedBytes / 1e9).toFixed(2)} / 6.69 GB verified`; options.refresh(); } });
  const variant = createLocalModelVariantStorageV1();
  const parentManifestSha256 = digest(JSON.stringify(PINNED_LOCAL_MODEL_MANIFEST_V1));
  const parentAttempt = (): string | null => {
    const current = delivery.status(), model = PINNED_LOCAL_MODEL_MANIFEST_V1;
    return delivery.manifestSha256 === parentManifestSha256 && current.manifestSha256 === parentManifestSha256
      && current.phase === 'ready' && current.ready && current.error === null
      && current.verifiedBytes === model.totalBytes && current.storedBytes === model.totalBytes
      && current.totalBytes === model.totalBytes && current.verifiedFiles === model.files.length && current.totalFiles === model.files.length
      && typeof current.attemptId === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(current.attemptId) ? current.attemptId : null;
  };
  const variantReady = (attempt: string): boolean => {
    const current = variant.status(), marker = current.marker;
    return current.phase === 'ready' && current.ready && current.error === null && current.verifiedBytes === 352323881
      && marker !== null && marker.schema === 'cf.local-model-variant-ready.v1' && marker.variant === 'q8-block32-repacked-v1'
      && marker.planSha256 === LOCAL_MODEL_VARIANT_PLAN_SHA256_V1 && marker.parentManifestSha256 === parentManifestSha256
      && marker.parentAttemptId === attempt && marker.sourceManifestSha256 === PINNED_LOCAL_MODEL_MANIFEST_V1.sourceManifestSha256
      && marker.payloadBytes === 352323881 && JSON.stringify(marker.files) === JSON.stringify(LOCAL_MODEL_VARIANT_FILES_V1)
      && marker.qualityAccepted === false && marker.deviceQualified === false;
  };
  // Selection is explicit. Lost readiness blocks the selected recipe instead of
  // silently changing it to another representation while a job is running.
  const selectedQ8 = (): boolean => useInstalled ? useVariant : runtime.q8Block32;
  const checkInstalled = (q8: boolean, attempt: string, signal?: AbortSignal): void => {
    if (signal?.aborted) throw new DOMException('Canceled', 'AbortError');
    if (parentAttempt() !== attempt || (q8 && !variantReady(attempt)))
      throw new Error('Selected browser model has not been verified for this parent');
  };
  const fetchVariantPlan = async (signal: AbortSignal, attempt: string): Promise<string> => {
    if (!variantPlan) throw new Error('Browser variant preparation is unavailable');
    checkInstalled(false, attempt, signal);
    const response = await fetch(variantPlan.url, { signal, cache: 'no-store' });
    try { checkInstalled(false, attempt, signal); }
    catch (error) { await response.body?.cancel().catch(() => {}); throw error; }
    const declared = response.headers.get('content-length');
    if (!response.ok || !response.body || (declared !== null && Number(declared) !== variantPlan.bytes)) {
      await response.body?.cancel().catch(() => {}); throw new Error('Browser variant plan is unavailable or oversized');
    }
    const reader = response.body.getReader(), chunks: Uint8Array<ArrayBuffer>[] = []; let length = 0;
    const hash = new LocalModelSha256V1();
    try {
      while (true) {
        checkInstalled(false, attempt, signal); const next = await reader.read(); checkInstalled(false, attempt, signal);
        if (next.done) break;
        length += next.value.byteLength;
        if (length > variantPlan.bytes) throw new Error('Browser variant plan is oversized');
        const chunk = new Uint8Array(next.value); hash.update(chunk); chunks.push(chunk);
      }
    } catch (error) { await reader.cancel().catch(() => {}); throw error; }
    finally { reader.releaseLock(); }
    if (length !== variantPlan.bytes || hash.digestHex() !== variantPlan.sha256) throw new Error('Browser variant plan SHA or size changed');
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  };
  const jobs = new AiLandfallJobsV1({ store,
    generate: async (input, signal, progress) => {
      if (!capability.supported) throw new Error('Required local model capabilities are unavailable');
      const urls: string[] = [];
      try {
        let source = runtime;
        const q8 = selectedQ8();
        if ((JSON.parse(input.recipeJson) as { q8Block32: unknown }).q8Block32 !== q8)
          throw new Error('Painting recipe no longer matches the selected model');
        let attempt: string | null = null;
        if (useInstalled) {
          attempt = parentAttempt();
          if (attempt === null) throw new Error('Installed model has not been verified');
          checkInstalled(q8, attempt, signal);
          const files: Record<string, string> = {};
          for (const file of delivery.manifest.files) {
            checkInstalled(q8, attempt, signal);
            const blob = await delivery.openFile(file.path); checkInstalled(q8, attempt, signal);
            const url = URL.createObjectURL(blob); urls.push(url); files[file.path] = url;
          }
          if (q8) for (const file of LOCAL_MODEL_VARIANT_FILES_V1) {
            checkInstalled(true, attempt, signal);
            const blob = await variant.openFile(file.path); checkInstalled(true, attempt, signal);
            if (blob.size !== file.bytes) throw new Error('Verified browser variant file size changed');
            const url = URL.createObjectURL(blob); urls.push(url); files[file.path] = url;
          }
          source = { ...runtime, modelFiles: files, q8Block32: q8 };
        }
        const generated = await generateLocalLandfallV1(input, signal, progress, source);
        if (attempt !== null) checkInstalled(q8, attempt, signal);
        return generated;
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
        : job.status === 'ready' ? button('view', 'View landfall', job.jobId) + button('inspect', 'Inspect painting', job.jobId)
          : `<p>The painting ${job.status === 'canceled' ? 'was canceled' : 'could not finish'}. Your expedition is safe.</p>${button('retry', 'Retry painting', job.jobId)}`) + '</div>';
  };
  type Compiled = Extract<LandfallConditioningResultV1 | LandfallConditioningResultV2, { ok: true }>;
  const renderInput = (compiled: Compiled, q8Block32: boolean): AiLandfallInputV1 => {
    const multi = compiled.recipe.schema === 'cf.art.landfall-conditioning.v2';
    const recipeJson = JSON.stringify({ schema: multi ? 'cf.ai-landfall-render.v2' : 'cf.ai-landfall-render.v1', conditioning: compiled.recipe,
      width: 1024, height: 576, steps: 4, seed: 133, modelRevision: runtime.modelRevision,
      runtimeVersion: 'cf.local-ai-worker.v1', modelManifestSha256: PINNED_LOCAL_MODEL_MANIFEST_V1.sourceManifestSha256,
      q8Block32,
      ...(multi ? { references: runtime.references!.map(localAiReferenceBindingV2) }
        : { reference: { sha256: runtime.reference.sha256, width: 480, height: 320, speciesVisualKey: runtime.reference.speciesVisualKey } }),
      negativePromptHandling: 'metadata-only-not-consumed-by-klein', qualityAccepted: false });
    return Object.freeze({ recipeKey: digest(recipeJson), worldKey: compiled.recipe.sourceSnapshot.request.worldKey,
      environmentId: compiled.recipe.sourceSnapshot.request.environmentFingerprint,
      ecologyEpoch: compiled.recipe.sourceSnapshot.roster.ecologyEpoch,
      snapshotDigest: digest(compiled.snapshotKey), recipeJson });
  };
  /** Read only bounded, independently rebuilt canonical identities. Earlier
   * portable/block32 and V1 paintings retain their original recipe and key. */
  const originalInputs = (input: AiLandfallInputV1): readonly AiLandfallInputV1[] => {
    try {
      const candidate = JSON.parse(input.recipeJson) as { schema: string; q8Block32: boolean; conditioning: { sourceSnapshot: unknown } };
      if (typeof candidate.q8Block32 !== 'boolean') return [input];
      const current = candidate.schema === 'cf.ai-landfall-render.v2' && runtime.references
        ? buildLandfallConditioningV2(candidate.conditioning.sourceSnapshot)
        : candidate.schema === 'cf.ai-landfall-render.v1' ? buildLandfallConditioningV1(candidate.conditioning.sourceSnapshot) : null;
      if (!current?.ok || JSON.stringify(renderInput(current, candidate.q8Block32)) !== JSON.stringify(input)) return [input];
      const compiled: Compiled[] = [current];
      if (candidate.schema === 'cf.ai-landfall-render.v2') {
        const previous = buildLandfallConditioningV1(candidate.conditioning.sourceSnapshot);
        if (previous.ok && previous.recipe.referenceRequirements[0]?.subjectIdentityKey === runtime.reference.speciesVisualKey) compiled.push(previous);
      }
      const candidates = [input];
      for (const q8 of [candidate.q8Block32, !candidate.q8Block32]) for (const recipe of compiled) {
        const rebuilt = renderInput(recipe, q8);
        if (!candidates.some(row => row.recipeKey === rebuilt.recipeKey)) candidates.push(rebuilt);
      }
      return candidates;
    } catch { return [input]; }
  };
  const readOriginal = async (input: AiLandfallInputV1, originalId: string): Promise<AiLandfallOriginalV1 | null> => {
    for (const candidate of originalInputs(input)) {
      const original = await store.read(candidate, originalId); if (original) return original;
    }
    return null;
  };
  const api: LocalAiGameV1 = {
    prepare(request, roster) {
      const compiled = runtime.references ? buildCanonicalLandfallConditioningV2(request, roster)
        : buildCanonicalLandfallConditioningV1(request, roster);
      if (!compiled.ok) return null;
      if (runtime.references ? compiled.recipe.referenceRequirements.some((row, index) =>
        row.subjectIdentityKey !== runtime.references![index]?.speciesVisualKey)
        : compiled.recipe.referenceRequirements[0]?.subjectIdentityKey !== runtime.reference.speciesVisualKey) return null;
      return renderInput(compiled, selectedQ8());
    },
    enqueue: input => {
      if (deliveryBusy) throw new Error('Finish model storage before queuing a painting');
      if (useInstalled) {
        const attempt = parentAttempt();
        if (attempt === null) throw new Error('Install or verify the browser model before queuing a painting');
        checkInstalled(selectedQ8(), attempt);
      }
      if ((JSON.parse(input.recipeJson) as { q8Block32: unknown }).q8Block32 !== selectedQ8())
        throw new Error('Painting recipe no longer matches the selected model');
      return jobs.enqueue(input);
    }, async find(input) {
      for (const candidate of originalInputs(input)) {
        const original = await store.find(candidate); if (original) return original;
      }
      return null;
    }, snapshot: () => jobs.snapshot(),
    closeInspector: () => { inspectionSequence++; viewer?.close(); },
    async inspect(input, originalId) {
      const sequence = ++inspectionSequence, stillCurrent = options.captureView();
      const returnFocus = captureLandfallFocusReturnV1();
      const original = await readOriginal(input, originalId);
      if (sequence !== inspectionSequence || !stillCurrent()) return;
      if (!original) { options.notice('Painting unavailable', 'The retained original could not be verified.'); return; }
      viewer ??= createLandfallViewerV1();
      await viewer.open(original, returnFocus);
    },
    html(worldKey) {
      const storageScope = worldKey === undefined ? 'notifications' : 'survey';
      const rows = jobs.snapshot().filter(row => worldKey === undefined || row.input.worldKey === worldKey);
      const attempt = parentAttempt();
      return `<div data-local-ai data-ai-model-selection="${useInstalled ? 'browser' : 'developer'}-${selectedQ8() ? 'block32' : 'portable'}" data-ai-variant-ready="${attempt !== null && variantReady(attempt)}" data-ai-storage-error="${esc(storageError)}" style="flex-basis:100%;min-width:0"><p style="font-size:12px">Local AI preview · Earth anatomy study · art and phone quality under review.</p>${rows.map(rowHtml).join('')}`
        + (worldKey !== undefined && rows.length === 0 ? '<p style="font-size:12px">Supported Earth landings queue a painting while you keep exploring.</p>' : '')
        + `<details data-ai-model-storage="${storageScope}"${disclosure[storageScope] ? ' open' : ''}><summary style="min-height:44px;cursor:pointer">Local model storage</summary><p>6.69 GB model, separate from your artwork cache. ${capability.supported ? 'Required browser features detected; device performance is unqualified.' : 'This browser lacks required local model features.'}</p><p>${esc(status || (installedOnly ? 'Install or verify your browser copy before drawing. No model is downloaded automatically.' : 'Using this preview’s verified local developer cache.'))}</p>`
        + (deliveryBusy ? button('stop-download', variantBusy ? 'Stop model preparation' : 'Pause download')
          : button('install', 'Download / resume 6.69 GB') + button('verify', 'Use verified browser copy')
            + (variantPlan ? button('prepare-variant', 'Prepare faster drawing (+336 MiB)') + button('verify-variant', 'Verify faster drawing') : ''))
        + (variantPlan ? '<p>Faster drawing is prepared locally from your verified browser copy and uses about 336 MiB more storage. Preparation starts only when selected; speed and art quality remain under review.</p>' : '')
        + '<p>Downloads start only when selected. Pausing retains verified chunks. Originals are retained separately; no automatic original deletion.</p></details></div>';
    },
    async action(action, jobId) {
      if (action === 'cancel') { jobs.cancel(jobId); return; }
      const job = jobs.snapshot().find(row => row.jobId === jobId);
      if (action === 'inspect' && job?.status === 'ready' && job.originalId) {
        await api.inspect(job.input, job.originalId);
      } else if (action === 'view' && job?.status === 'ready' && job.originalId) {
        const stillCurrent = options.captureView();
        const original = await store.read(job.input, job.originalId);
        if (!stillCurrent()) return;
        if (!original || !await options.view(original)) options.notice('Landfall retained', 'Return to this Earth landing to view its painting. Its original remains stored.');
      } else if (action === 'retry' && job && ['failed', 'canceled'].includes(job.status)) {
        const priorModel = (JSON.parse(job.input.recipeJson) as { q8Block32: unknown }).q8Block32;
        if (priorModel !== selectedQ8()) {
          options.notice('Model selection changed', 'Land on this world again to create a new painting with your selected model.');
          return;
        }
        // Retry preserves the failed/canceled recipe; a new model needs a new landing input.
        api.enqueue(job.input);
      } else if (action === 'stop-download') deliveryBusy?.abort();
      else if (['install', 'verify', 'prepare-variant', 'verify-variant'].includes(action) && !deliveryBusy) {
        if (jobs.snapshot().some(row => ['generating', 'retaining', 'queued', 'canceling'].includes(row.status))) { options.notice('Painting in progress', 'Finish or cancel the painting before changing model storage.'); return; }
        const variantAction = action === 'prepare-variant' || action === 'verify-variant';
        const attempt = parentAttempt();
        if (variantAction && (!variantPlan || attempt === null)) {
          options.notice('Browser model required', 'Install or verify your browser copy before preparing or verifying faster drawing.'); return;
        }
        storageError = ''; deliveryBusy = new AbortController(); variantBusy = variantAction; options.refresh();
        try {
          if (variantAction) {
            const signal = deliveryBusy.signal;
            checkInstalled(false, attempt!, signal);
            if (action === 'prepare-variant') {
              const planJson = await fetchVariantPlan(signal, attempt!); checkInstalled(false, attempt!, signal);
              await deriveLocalModelVariantV1({ planJson, parent: delivery, storage: variant, signal,
                onProgress: value => { status = `Preparing faster drawing · ${(value.writtenPayloadBytes / 1048576).toFixed(1)} / 336 MiB written · ${(value.verifiedPayloadBytes / 1048576).toFixed(1)} MiB verified`; options.refresh(); } });
            } else await variant.verify(parentManifestSha256, attempt!, signal);
            checkInstalled(true, attempt!, signal); useInstalled = true; useVariant = true;
            status = 'Faster drawing ready. Its additional browser storage is separate from retained paintings.';
          } else {
            const result = action === 'install' ? await delivery.install({ signal: deliveryBusy.signal }) : await delivery.verify({ signal: deliveryBusy.signal });
            if (result.ready && parentAttempt() !== null) { useInstalled = true; useVariant = false; }
            if (!result.ready) status += ' · ' + (result.error ?? 'Not ready');
          }
        } catch (error) {
          storageError = String(error instanceof Error ? error.message : error).slice(0, 1024);
          if (variantAction) status = deliveryBusy.signal.aborted ? 'Model preparation canceled. Retained paintings are unchanged.' : 'Faster drawing is not verified. Retained paintings are unchanged.';
          throw error;
        } finally { deliveryBusy = null; variantBusy = false; options.refresh(); }
      }
    },
  };
  disclosureDocument?.addEventListener('toggle', onStorageToggle, true);
  globalThis.addEventListener?.('pagehide', () => {
    disclosureDocument?.removeEventListener('toggle', onStorageToggle, true);
    deliveryBusy?.abort(); api.closeInspector();
  }, { once: true });
  return Object.freeze(api);
}
