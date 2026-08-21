import {
  createSpeciesCanvas,
  installSpeciesCanvasFactory,
  type ArtCanvas,
} from '@cf/art/species-canvas';
import { SpeciesArtWorkerCore, type SpeciesArtEncodedCanvas } from './species-art-worker-core.js';
import type { SpeciesArtWorkerResponse } from './species-art-protocol.js';

const scope = self as DedicatedWorkerGlobalScope;

if (typeof OffscreenCanvas === 'function') {
  installSpeciesCanvasFactory((width, height) => new OffscreenCanvas(width, height));
}

const post = (response: SpeciesArtWorkerResponse): void => { scope.postMessage(response); };

const checkCapabilities = (): void => {
  if (typeof OffscreenCanvas !== 'function'
    || typeof FileReaderSync !== 'function'
    || typeof TextEncoder !== 'function') {
    throw new Error('dedicated worker lacks OffscreenCanvas, FileReaderSync, or TextEncoder');
  }
  const sentinel = createSpeciesCanvas(1, 1);
  if (!sentinel.getContext('2d')) throw new Error('worker 2D canvas context unavailable');
  if (typeof sentinel.convertToBlob !== 'function') {
    throw new Error('worker canvas lacks convertToBlob');
  }
};

const encodeCanvas = async (portable: { readonly width: number; readonly height: number }): Promise<SpeciesArtEncodedCanvas> => {
  const canvas = portable as ArtCanvas;
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  if (blob.type !== 'image/png' || blob.size <= 0) throw new Error('worker PNG encoder returned an empty payload');
  const url = new FileReaderSync().readAsDataURL(blob);
  if (typeof url !== 'string') throw new Error('worker PNG encoder did not return a data URL');
  return { url, encodedBytes: new TextEncoder().encode(url).byteLength, pngBytes: blob.size };
};

const core = new SpeciesArtWorkerCore({
  checkCapabilities,
  loadPainter: async () => {
    /* The heavy painter stays a worker-local lazy chunk. The canvas factory is
       installed above before this import evaluates any generated painter. */
    return await import('@cf/art/species-painter');
  },
  encodeCanvas,
  emit: post,
  now: () => performance.now(),
});

scope.addEventListener('message', (event: MessageEvent<unknown>) => {
  void core.handle(event.data);
});
