import {
  installSpeciesCanvasFactory,
  type ArtCanvas,
} from '@cf/art/species-canvas';
import { renderBiomeVistaV1 } from '@cf/art/biome-vista';
import { BIOME_VISUAL_PROFILES_V1 } from '@cf/art/biome-visual-profile';
import { createVisualTreatmentV1 } from '@cf/art/visual-treatment';
import { polishBiomeCanvasV1 } from '@cf/art/surface-polish';
import {
  BIOME_VISTA_WORKER_RESPONSE_SCHEMA,
  validBiomeVistaWorkerRenderMessageV1,
  type BiomeVistaWorkerErrorV1,
  type BiomeVistaWorkerResultV1,
} from './biome-vista-protocol.js';

const scope = self as DedicatedWorkerGlobalScope;

if (typeof OffscreenCanvas === 'function') {
  installSpeciesCanvasFactory((width, height) => new OffscreenCanvas(width, height));
}

const boundedMessage = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).slice(0, 512) || 'biome vista worker failed';

scope.addEventListener('message', (event: MessageEvent<unknown>) => {
  const message = event.data;
  if (!validBiomeVistaWorkerRenderMessageV1(message)) return;
  void (async () => {
    try {
      if (typeof OffscreenCanvas !== 'function') throw new Error('worker OffscreenCanvas unavailable');
      const canvas = renderBiomeVistaV1({
        scene: message.request.scene,
        biomeKey: message.request.biomeKey,
        profile: BIOME_VISUAL_PROFILES_V1[message.request.biomeKey],
        treatment: createVisualTreatmentV1({
          scope: 'biome', key: message.request.biomeKey,
        }),
        options: message.request.options,
      } as Parameters<typeof renderBiomeVistaV1>[0]);
      polishBiomeCanvasV1(canvas);
      if (canvas.width !== 960 || canvas.height !== 430
        || typeof (canvas as ArtCanvas).transferToImageBitmap !== 'function') {
        throw new Error(`biome vista returned ${canvas.width}x${canvas.height} without transferable output`);
      }
      const bitmap = (canvas as ArtCanvas).transferToImageBitmap();
      const result: BiomeVistaWorkerResultV1 = {
        schema: BIOME_VISTA_WORKER_RESPONSE_SCHEMA,
        type: 'result', documentToken: message.documentToken,
        generation: message.generation, worldKey: message.request.worldKey,
        environmentFingerprint: message.request.environmentFingerprint,
        profileSchema: message.request.profileSchema,
        profileDigest: message.request.profileDigest,
        biomeKey: message.request.biomeKey, scene: message.request.scene,
        width: 960, height: 430, bitmap,
      };
      scope.postMessage(result, [bitmap]);
    } catch (error) {
      const failure: BiomeVistaWorkerErrorV1 = {
        schema: BIOME_VISTA_WORKER_RESPONSE_SCHEMA,
        type: 'error', documentToken: message.documentToken,
        generation: message.generation, worldKey: message.request.worldKey,
        environmentFingerprint: message.request.environmentFingerprint,
        profileSchema: message.request.profileSchema,
        profileDigest: message.request.profileDigest,
        message: boundedMessage(error),
      };
      scope.postMessage(failure);
    }
  })();
});
