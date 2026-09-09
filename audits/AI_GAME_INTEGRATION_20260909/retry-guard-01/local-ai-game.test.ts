import { createHash } from 'node:crypto';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { buildBiomeVistaRenderRequestV1 } from '../apps/game/src/biome-vista-surface.js';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';
import { buildCanonicalLandfallConditioningV1 } from '../apps/game/src/landfall-conditioning.js';
import { aiLandfallInputKeyV1, type AiLandfallGeneratedV1, type AiLandfallInputV1,
  type AiLandfallOriginalStoreV1, type AiLandfallOriginalV1 } from '../apps/game/src/ai-landfall-originals.js';
import type { LocalModelDeliveryStatusV1, LocalModelDeliveryV1 } from '../apps/game/src/local-model-delivery.js';
import { PINNED_LOCAL_MODEL_MANIFEST_V1 } from '../apps/game/src/local-model-manifest.js';
import type { LocalAiRuntimeConfigV1 } from '../apps/game/src/local-ai-runtime.js';
import { createLocalAiGameV1, type LocalAiGameV1 } from '../apps/game/src/local-ai-game.js';

const mocks = vi.hoisted(() => ({ createStore: vi.fn(), createDelivery: vi.fn(), probe: vi.fn(), generate: vi.fn() }));
vi.mock('../apps/game/src/ai-landfall-originals.js', async importOriginal => ({
  ...await importOriginal<typeof import('../apps/game/src/ai-landfall-originals.js')>(),
  createAiLandfallOriginalStoreV1: mocks.createStore,
}));
vi.mock('../apps/game/src/local-model-delivery.js', async importOriginal => ({
  ...await importOriginal<typeof import('../apps/game/src/local-model-delivery.js')>(),
  createLocalModelDeliveryV1: mocks.createDelivery, probeLocalModelCapabilitiesV1: mocks.probe,
}));
vi.mock('../apps/game/src/local-ai-runtime.js', () => ({ generateLocalLandfallV1: mocks.generate }));

beforeAll(() => installCaptureHooks());
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('location', new URL('http://127.0.0.1:7777/')); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function canonical(seed = 133) {
  const star = { seed: 424242, x: 560, y: 170 };
  const address = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star, planet: { seed } });
  const planet = systemScene(star.seed).planets.find(row => row.seed === seed);
  if (!address.ok || !planet) throw Error('Missing canonical controller fixture');
  const built = canonicalWorldRoster(address.address, 0);
  if (!built.ok) throw Error('Missing canonical controller roster');
  return { roster: built.roster, request: buildBiomeVistaRenderRequestV1(planet, star.seed, built.roster.worldKey,
    systemFor(star.seed) as unknown as Record<string, unknown>, built.roster) };
}
const pixels = (): AiLandfallGeneratedV1 => ({ blob: new Blob(['synthetic unit pixels'], { type: 'image/png' }), width: 1024, height: 576 });
function deliveryStatus(ready: boolean, error: string | null = null): LocalModelDeliveryStatusV1 {
  return { phase: ready ? 'ready' : 'missing', ready, manifestSha256: 'a'.repeat(64),
    totalBytes: PINNED_LOCAL_MODEL_MANIFEST_V1.totalBytes, storedBytes: ready ? 1 : 0, verifiedBytes: ready ? 1 : 0,
    downloadedBytes: 0, verifiedFiles: ready ? PINNED_LOCAL_MODEL_MANIFEST_V1.files.length : 0,
    totalFiles: PINNED_LOCAL_MODEL_MANIFEST_V1.files.length, file: null, error, attemptId: null,
    qualityAccepted: false, deviceQualified: false };
}

/** Actual controller, compiler and queue; explicit unit fakes own inference,
 * transaction settlement and model delivery. This is not native storage/GPU proof. */
async function harness(configPatch: Partial<LocalAiRuntimeConfigV1> = {}) {
  const source = canonical();
  const compiled = buildCanonicalLandfallConditioningV1(source.request, source.roster);
  if (!compiled.ok) throw Error('Controller fixture did not compile');
  const files = Object.fromEntries(PINNED_LOCAL_MODEL_MANIFEST_V1.files.map(file => [file.path, '/__local_ai/model/' + file.path]));
  files['transformer-q8-block32.onnx'] = '/__local_ai/model/transformer-q8-block32.onnx';
  files['repacked-scale-zero.data'] = '/__local_ai/model/repacked-scale-zero.data';
  const config: LocalAiRuntimeConfigV1 = { workerUrl: '/__local_ai/stage-worker.mjs',
    modelRevision: PINNED_LOCAL_MODEL_MANIFEST_V1.revision, modelFiles: files, q8Block32: true,
    reference: { url: '/__local_ai/reference.png', sha256: 'b'.repeat(64), width: 480, height: 320,
      speciesVisualKey: compiled.recipe.referenceRequirements[0]!.subjectIdentityKey }, ...configPatch };
  const fetch = vi.fn(async () => new Response(JSON.stringify(config), { status: 200 })); vi.stubGlobal('fetch', fetch);
  mocks.probe.mockResolvedValue({ supported: true });
  const originals = new Map<string, AiLandfallOriginalV1>();
  const originalFor = (input: AiLandfallInputV1, generated: AiLandfallGeneratedV1): AiLandfallOriginalV1 => Object.freeze({
    ...generated, schema: 'cf.ai-landfall-original.v1', input, originalId: 'original:' + input.recipeKey,
    sha256: 'c'.repeat(64),
  });
  const retain = vi.fn(async (input: AiLandfallInputV1, generated: AiLandfallGeneratedV1) => {
    const row = originalFor(input, generated); originals.set(aiLandfallInputKeyV1(input), row); return row;
  });
  const read = vi.fn(async (input: AiLandfallInputV1, id: string) => {
    const row = originals.get(aiLandfallInputKeyV1(input)); return row?.originalId === id ? row : null;
  });
  const store: AiLandfallOriginalStoreV1 = { retain, read,
    find: vi.fn(async input => originals.get(aiLandfallInputKeyV1(input)) ?? null), close: vi.fn() };
  mocks.createStore.mockReturnValue(store);
  let modelStatus = deliveryStatus(false);
  const install = vi.fn(async () => { modelStatus = deliveryStatus(true); return modelStatus; });
  const verify = vi.fn(async () => { modelStatus = deliveryStatus(true); return modelStatus; });
  const openFile = vi.fn(async () => new Blob(['unit model file']));
  const delivery: LocalModelDeliveryV1 = { manifest: PINNED_LOCAL_MODEL_MANIFEST_V1,
    manifestSha256: 'd'.repeat(64), baseUrl: 'https://huggingface.co/pinned/', status: () => modelStatus, install, verify, openFile };
  mocks.createDelivery.mockReturnValue(delivery);
  mocks.generate.mockResolvedValue(pixels());
  const notice = vi.fn(), view = vi.fn(async (_original: AiLandfallOriginalV1) => true);
  let api: LocalAiGameV1 | null = null;
  const waiters: { predicate: () => boolean; resolve(): void }[] = [];
  const refresh = vi.fn(() => {
    for (let index = waiters.length - 1; index >= 0; index--) if (waiters[index]!.predicate()) {
      waiters.splice(index, 1)[0]!.resolve();
    }
  });
  let viewGeneration = 0;
  const captureView = () => { const captured = viewGeneration; return () => viewGeneration === captured; };
  api = await createLocalAiGameV1({ refresh, notice, view, captureView });
  const waitFor = (predicate: () => boolean): Promise<void> => predicate() ? Promise.resolve()
    : new Promise(resolve => waiters.push({ predicate, resolve }));
  const input = api.prepare(source.request, source.roster);
  return { api, input, source, config, fetch, notice, view, refresh, store, retain, read, originals,
    originalFor, install, verify, openFile, waitFor,
    setModelStatus(value: LocalModelDeliveryStatusV1) { modelStatus = value; },
    changeViewGeneration() { viewGeneration++; } };
}

describe('optional real-game local AI controller with explicit unit inference/storage fakes', () => {
  it('prepares the actual full canonical recipe without downloading or generating anything', async () => {
    const h = await harness(); expect(h.input).not.toBeNull();
    const prepared = h.input!; const recipe = JSON.parse(prepared.recipeJson);
    expect(recipe.conditioning.sourceSnapshot.roster.view.all).toHaveLength(19);
    expect(recipe.conditioning.residents).toHaveLength(6);
    expect(recipe.reference.speciesVisualKey).toBe(h.config.reference.speciesVisualKey);
    expect(prepared.recipeKey).toBe(createHash('sha256').update(prepared.recipeJson).digest('hex'));
    expect(Object.isFrozen(prepared)).toBe(true);
    expect(h.fetch).toHaveBeenCalledExactlyOnceWith('/__local_ai/runtime.json', { cache: 'no-store' });
    expect(h.install).not.toHaveBeenCalled(); expect(h.verify).not.toHaveBeenCalled(); expect(h.openFile).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled(); expect(h.retain).not.toHaveBeenCalled();
    const mars = canonical(134); expect(h.api.prepare(mars.request, mars.roster)).toBeNull();
  });

  it('requires exact reference identity and same-origin pinned runtime routes', async () => {
    await expect(harness({ workerUrl: 'https://foreign.example/worker.mjs' })).rejects.toThrow(/this game origin/);
    await expect(harness({ modelRevision: 'a'.repeat(40) })).rejects.toThrow(/Unpinned/);
    const valid = await harness();
    const mismatch = await harness({ reference: { ...valid.config.reference, speciesVisualKey: 'another individual' } });
    expect(mismatch.input).toBeNull(); expect(mocks.generate).not.toHaveBeenCalled();
  });

  it('runs prepare → enqueue → committed original → explicit View without automatically returning', async () => {
    const h = await harness(); const retained = deferred<AiLandfallOriginalV1>();
    h.retain.mockImplementationOnce(() => retained.promise);
    const jobId = h.api.enqueue(h.input!);
    await h.waitFor(() => h.api.snapshot()[0]?.status === 'retaining');
    expect(h.notice).not.toHaveBeenCalled(); expect(h.view).not.toHaveBeenCalled();
    expect(h.api.html()).toContain('Retaining original'); expect(h.api.html()).not.toContain('View landfall');
    const original = h.originalFor(h.input!, pixels());
    h.originals.set(aiLandfallInputKeyV1(h.input!), original); retained.resolve(original);
    await h.waitFor(() => h.api.snapshot()[0]?.status === 'ready');
    expect(h.notice).toHaveBeenCalledTimes(1); expect(h.view).not.toHaveBeenCalled();
    expect(h.api.html()).toContain('View landfall');
    await h.api.action('view', jobId);
    expect(h.read).toHaveBeenCalledExactlyOnceWith(h.input, original.originalId);
    expect(h.view).toHaveBeenCalledExactlyOnceWith(original);
  });

  it('retains the original when the view owner refuses a changed route', async () => {
    const h = await harness(); const id = h.api.enqueue(h.input!);
    await h.waitFor(() => h.api.snapshot()[0]?.status === 'ready');
    h.view.mockResolvedValue(false); await h.api.action('view', id);
    expect(h.notice).toHaveBeenLastCalledWith('Landfall retained', expect.stringContaining('original remains stored'));
    expect(h.originals.size).toBe(1); expect(h.api.snapshot()[0]!.status).toBe('ready');
  });

  it('does not invoke an old View intent after navigation changes during original read', async () => {
    const h = await harness(); const id = h.api.enqueue(h.input!);
    await h.waitFor(() => h.api.snapshot()[0]?.status === 'ready');
    const original = [...h.originals.values()][0]!; const held = deferred<AiLandfallOriginalV1>();
    h.read.mockImplementationOnce(() => held.promise);
    const viewing = h.api.action('view', id); h.changeViewGeneration(); held.resolve(original);
    await viewing; expect(h.view).not.toHaveBeenCalled();
    expect(h.originals.size).toBe(1); expect(h.api.snapshot()[0]!.status).toBe('ready');
  });

  it('keeps failures out of ready and allows an explicit retry with the same recipe', async () => {
    const h = await harness(); h.retain.mockRejectedValueOnce(new Error('QuotaExceededError'));
    const first = h.api.enqueue(h.input!); await h.waitFor(() => h.api.snapshot()[0]?.status === 'failed');
    expect(h.notice).not.toHaveBeenCalled(); expect(h.originals.size).toBe(0);
    expect(h.api.html()).toContain('Your expedition is safe'); expect(h.api.html()).not.toContain('View landfall');
    await h.api.action('retry', first);
    await h.waitFor(() => h.api.snapshot().some(row => row.status === 'ready'));
    expect(mocks.generate).toHaveBeenCalledTimes(2);
    expect(mocks.generate.mock.calls[1]![0]).toEqual(h.input);
    expect(mocks.generate.mock.calls[1]![0].recipeJson).toBe(h.input!.recipeJson);
    expect(mocks.generate.mock.calls[1]![0].recipeKey).toBe(h.input!.recipeKey);
    expect(h.retain).toHaveBeenCalledTimes(2);
    expect(h.notice).not.toHaveBeenCalledWith('Model selection changed', expect.any(String));
    expect(h.originals.size).toBe(1);
  });

  it.each(['failed', 'canceled'] as const)('refuses a %s Q8 Retry after selecting the browser model without rewriting or starting work', async terminal => {
    const h = await harness();
    const pending = deferred<AiLandfallGeneratedV1>(), started = deferred<void>();
    if (terminal === 'failed') mocks.generate.mockRejectedValueOnce(new Error('Synthetic generation failure'));
    else mocks.generate.mockImplementationOnce(() => { started.resolve(); return pending.promise; });
    const first = h.api.enqueue(h.input!);
    if (terminal === 'canceled') { await started.promise; await h.api.action('cancel', first); pending.resolve(pixels()); }
    await h.waitFor(() => h.api.snapshot()[0]?.status === terminal);
    const before = h.api.snapshot();
    const beforeInput = JSON.stringify(before[0]!.input);
    expect(JSON.parse(before[0]!.input.recipeJson).q8Block32).toBe(true);
    await h.api.action('verify', '');
    expect(h.verify).toHaveBeenCalledTimes(1); expect(h.install).not.toHaveBeenCalled();
    const selected = h.api.prepare(h.source.request, h.source.roster)!;
    expect(JSON.parse(selected.recipeJson).q8Block32).toBe(false);
    expect(selected.recipeKey).not.toBe(before[0]!.input.recipeKey);
    const generationCount = mocks.generate.mock.calls.length;
    const findCount = vi.mocked(h.store.find).mock.calls.length;
    await h.api.action('retry', first);
    expect(h.api.snapshot()).toEqual(before);
    expect(JSON.stringify(h.api.snapshot()[0]!.input)).toBe(beforeInput);
    expect(mocks.generate).toHaveBeenCalledTimes(generationCount);
    expect(h.store.find).toHaveBeenCalledTimes(findCount);
    expect(h.openFile).not.toHaveBeenCalled(); expect(h.retain).not.toHaveBeenCalled();
    expect(h.originals.size).toBe(0); expect(h.view).not.toHaveBeenCalled();
    expect(h.notice).toHaveBeenCalledExactlyOnceWith('Model selection changed',
      'Land on this world again to create a new painting with your selected model.');
  });

  it('uses browser model files only after explicit verification and releases every object URL on failure', async () => {
    const h = await harness(); let url = 0;
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:http://127.0.0.1:7777/unit-${++url}`);
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    await h.api.action('verify', '');
    expect(h.verify).toHaveBeenCalledTimes(1); expect(h.install).not.toHaveBeenCalled();
    const installedInput = h.api.prepare(h.source.request, h.source.roster)!;
    expect(JSON.parse(installedInput.recipeJson).q8Block32).toBe(false);
    expect(installedInput.recipeKey).not.toBe(h.input!.recipeKey);
    mocks.generate.mockRejectedValueOnce(new Error('synthetic GPU failure'));
    h.api.enqueue(installedInput); await h.waitFor(() => h.api.snapshot()[0]?.status === 'failed');
    expect(h.openFile).toHaveBeenCalledTimes(PINNED_LOCAL_MODEL_MANIFEST_V1.files.length);
    expect(createUrl).toHaveBeenCalledTimes(PINNED_LOCAL_MODEL_MANIFEST_V1.files.length);
    expect(revoke).toHaveBeenCalledTimes(createUrl.mock.calls.length);
    const runtime = mocks.generate.mock.calls[0]![3] as LocalAiRuntimeConfigV1;
    expect(runtime.q8Block32).toBe(false);
    expect(Object.values(runtime.modelFiles).every(value => value.startsWith('blob:'))).toBe(true);
    expect(h.retain).not.toHaveBeenCalled(); expect(h.notice).not.toHaveBeenCalled();
  });

  it('blocks storage changes while a painting is active without starting installation', async () => {
    const h = await harness(); const pending = deferred<AiLandfallGeneratedV1>(); mocks.generate.mockReturnValueOnce(pending.promise);
    h.api.enqueue(h.input!);
    await h.api.action('install', ''); await h.api.action('verify', '');
    expect(h.install).not.toHaveBeenCalled(); expect(h.verify).not.toHaveBeenCalled();
    expect(h.notice).toHaveBeenCalledWith('Painting in progress', expect.any(String));
    await h.api.action('cancel', h.api.snapshot()[0]!.jobId); pending.resolve(pixels());
    await h.waitFor(() => h.api.snapshot()[0]?.status === 'canceled');
  });

  it('refuses enqueue while model verification owns its await', async () => {
    const h = await harness(); const held = deferred<LocalModelDeliveryStatusV1>(); h.verify.mockImplementationOnce(() => held.promise);
    const verifying = h.api.action('verify', '');
    expect(h.verify).toHaveBeenCalledTimes(1);
    try {
      expect(() => h.api.enqueue(h.input!)).toThrow(/model|storage|verif|busy/i);
      expect(mocks.generate).not.toHaveBeenCalled(); expect(h.api.snapshot()).toHaveLength(0);
    } finally { held.resolve(deliveryStatus(false)); await verifying; }
  });
});
