/** Browser-local inference orchestration. No gameplay state or route authority.
 * Uses the same pinned graph worker as the isolated proof; one worker at a time.
 * Availability, installation and successful inference never certify art quality. */
import type { AiLandfallProgressV1 } from './ai-landfall-jobs.js';
import type { AiLandfallInputV1 } from './ai-landfall-originals.js';

export interface LocalAiReferenceV1 {
  readonly url: string; readonly sha256: string;
  readonly width: number; readonly height: number;
  readonly speciesVisualKey: string;
}
export interface LocalAiRuntimeConfigV1 {
  readonly workerUrl: string;
  readonly modelRevision: string;
  readonly modelFiles: Readonly<Record<string, string>>;
  readonly q8Block32: boolean;
  readonly reference: LocalAiReferenceV1;
}
const hex = (bytes: ArrayBuffer): string => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
const check = (signal: AbortSignal): void => { if (signal.aborted) throw new DOMException('Landing canceled', 'AbortError'); };

export async function generateLocalLandfallV1(
  input: AiLandfallInputV1, signal: AbortSignal,
  onProgress: (progress: AiLandfallProgressV1) => void,
  config: LocalAiRuntimeConfigV1,
): Promise<{ blob: Blob; width: number; height: number }> {
  check(signal);
  const recipe = JSON.parse(input.recipeJson) as {
    conditioning: { prompt: string; referenceRequirements: readonly { subjectIdentityKey: string }[] };
    reference: Omit<LocalAiReferenceV1, 'url'>;
    width: number; height: number; steps: number; seed: number; modelRevision: string; q8Block32: boolean;
  };
  const { width, height, steps } = recipe;
  if (width !== 1024 || height !== 576 || steps !== 4 || recipe.modelRevision !== config.modelRevision
    || recipe.q8Block32 !== config.q8Block32
    || !Number.isSafeInteger(recipe.seed) || recipe.seed < 0 || recipe.seed > 0xffffffff
    || typeof recipe.conditioning?.prompt !== 'string' || recipe.conditioning.prompt.length > 6000
    || recipe.conditioning.referenceRequirements?.length !== 1
    || recipe.conditioning.referenceRequirements[0]?.subjectIdentityKey !== config.reference.speciesVisualKey)
    throw new Error('Local AI recipe/reference is unavailable for this identity');
  if (!recipe.reference || recipe.reference.sha256 !== config.reference.sha256
    || recipe.reference.width !== config.reference.width || recipe.reference.height !== config.reference.height
    || recipe.reference.speciesVisualKey !== config.reference.speciesVisualKey)
    throw new Error('Recipe anatomical reference changed');
  if (!/^[a-f0-9]{64}$/.test(config.reference.sha256)
    || config.reference.width !== 480 || config.reference.height !== 320)
    throw new Error('Unreviewed anatomical reference');
  const total = 1 + 1 + steps + 1; // text, reference encoding, denoising, decode; retention is the job owner's final unit.
  let completed = 0;
  const stepTimes: number[] = [];
  const report = (phase: string, etaMs: number | null = null): void => onProgress({ phase, completed, total, etaMs });
  const stage = (name: string, job: Record<string, unknown>, transfers: Transferable[] = []): Promise<Float32Array | Uint16Array> => new Promise((resolve, reject) => {
    check(signal);
    const worker = new Worker(config.workerUrl, { type: 'module', name: `cf-local-ai-${name}` });
    let settled = false, loaded = false, loading = false, step = 0;
    const finish = (error: unknown, data?: Float32Array | Uint16Array): void => {
      if (settled) return; settled = true;
      clearTimeout(timer); signal.removeEventListener('abort', abort); worker.terminate();
      if (error) reject(error); else resolve(data!);
    };
    const abort = (): void => finish(new DOMException('Landing canceled', 'AbortError'));
    const timer = setTimeout(() => finish(new Error('Local AI stage timed out')), 600_000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = event => finish(new Error(event.message || 'Local AI worker failed'));
    worker.onmessageerror = () => finish(new Error('Local AI worker result could not be read'));
    worker.onmessage = ({ data }: MessageEvent<Record<string, unknown>>) => {
      if (settled) return;
      try {
        check(signal);
        if (data.type === 'error' || data.phase === 'gpu-error') throw new Error(String(data.message ?? 'Local AI device error'));
        if (data.type === 'progress') {
          if (data.phase === 'loading') { if (loading) throw new Error('Duplicate model loading'); loading = true; report('Loading local model'); }
          else if (data.phase === 'loaded') { if (!loading || loaded) throw new Error('Unordered model loading'); loaded = true; report(name === 'denoise' ? 'Drawing the landfall' : 'Preparing the painting'); }
          else if (data.phase === 'step') {
            if (name !== 'denoise' || !loaded || data.step !== step + 1 || data.steps !== steps || step >= steps) throw new Error('Unordered drawing progress');
            step++; completed++; stepTimes.push(performance.now());
            const interval = stepTimes.length >= 2 ? (stepTimes.at(-1)! - stepTimes[0]!) / (stepTimes.length - 1) : null;
            report(`Drawing ${step} of ${steps}`, interval === null ? null : Math.max(0, (steps - step) * interval));
          }
          return;
        }
        if (data.type !== 'complete' || !loaded || (name === 'denoise' && step !== steps)
          || !(data.data instanceof Float32Array || data.data instanceof Uint16Array)) throw new Error('Incomplete local model result');
        if (name !== 'denoise') completed++;
        report(name === 'decode' ? 'Finishing the painting' : 'Preparing the painting');
        finish(null, data.data);
      } catch (error) { finish(error); }
    };
    try { worker.postMessage({ stage: name, profile: false, modelFiles: config.modelFiles, ...job }, transfers); }
    catch (error) { finish(error); }
    if (signal.aborted) abort();
  });
  const chatPrompt = '<|im_start|>user\n' + recipe.conditioning.prompt + '<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n';
  const embedding = await stage('text', { chatPrompt }); check(signal);
  if (!(embedding instanceof Uint16Array) || embedding.length !== 512 * 7680) throw new Error('Text embedding shape mismatch');
  const response = await fetch(config.reference.url, { signal }); check(signal);
  if (!response.ok || Number(response.headers.get('content-length') ?? 0) > 16 * 1024 * 1024 || !response.body) {
    await response.body?.cancel().catch(() => {});
    throw new Error(!response.ok ? 'Anatomical reference unavailable' : 'Anatomical reference is oversized');
  }
  const reader = response.body.getReader();
  const parts: Uint8Array<ArrayBuffer>[] = []; let length = 0;
  try {
    while (true) {
      check(signal); const next = await reader.read(); if (next.done) break;
      length += next.value.byteLength;
      if (length > 16 * 1024 * 1024) throw new Error('Anatomical reference is oversized');
      parts.push(new Uint8Array(next.value));
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  const bytes = await new Blob(parts).arrayBuffer(); check(signal);
  if (bytes.byteLength > 16 * 1024 * 1024 || hex(await crypto.subtle.digest('SHA-256', bytes)) !== config.reference.sha256) throw new Error('Anatomical reference changed');
  check(signal);
  let bitmap: ImageBitmap | null = null, scratch: OffscreenCanvas | null = null;
  let pixels: Float32Array;
  try {
    bitmap = await createImageBitmap(new Blob([bytes])); check(signal);
    scratch = new OffscreenCanvas(480, 320);
    const ctx = scratch.getContext('2d', { willReadFrequently: true }); if (!ctx) throw new Error('Reference canvas unavailable');
    ctx.fillStyle = '#72786e'; ctx.fillRect(0, 0, 480, 320); ctx.drawImage(bitmap, 0, 0, 480, 320);
    const rgba = ctx.getImageData(0, 0, 480, 320).data, count = 480 * 320;
    pixels = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) for (let c = 0; c < 3; c++) pixels[c * count + i] = rgba[i * 4 + c]! / 127.5 - 1;
  } finally { try { bitmap?.close(); } finally { if (scratch) { scratch.width = 1; scratch.height = 1; } } }
  const encoded = await stage('encode', { pixels, width: 480, height: 320 }, [pixels.buffer]); check(signal);
  if (!(encoded instanceof Float32Array) || encoded.length !== 30 * 20 * 128) throw new Error('Reference encoding shape mismatch');
  const latents = await stage('denoise', { width, height, steps, seed: recipe.seed, q8Block32: config.q8Block32,
    embedding, references: [{ data: encoded, width: 480, height: 320 }] }, [embedding.buffer, encoded.buffer]); check(signal);
  if (!(latents instanceof Float32Array) || latents.length !== 64 * 36 * 128) throw new Error('Drawing output shape mismatch');
  const decoded = await stage('decode', { width, height, latents }, [latents.buffer]); check(signal);
  if (!(decoded instanceof Float32Array) || decoded.length !== width * height * 3) throw new Error('Decoded painting shape mismatch');
  const canvas = new OffscreenCanvas(width, height);
  try {
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Painting canvas unavailable');
    const image = ctx.createImageData(width, height), count = width * height;
    for (let i = 0; i < count; i++) {
      for (let c = 0; c < 3; c++) { const value = decoded[c * count + i]!; if (!Number.isFinite(value)) throw new Error('Invalid painting pixels'); image.data[i * 4 + c] = Math.round(Math.max(0, Math.min(1, value / 2 + .5)) * 255); }
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/png' }); check(signal);
    if (blob.type !== 'image/png' || !blob.size || blob.size > 16 * 1024 * 1024) throw new Error('Painting could not be encoded safely');
    return { blob, width, height };
  } finally { canvas.width = 1; canvas.height = 1; }
}
