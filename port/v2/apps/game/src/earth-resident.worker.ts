import { installSpeciesCanvasFactory } from '@cf/art/species-canvas';
import { renderEarthResidentLayerV1 } from '@cf/art/earth-resident-layer';
import { EARTH_LAYER_RESPONSE, earthResidentRequestV1, type EarthResidentResponseV1 } from './earth-layered-protocol.js';

const scope = self as DedicatedWorkerGlobalScope;
if (typeof OffscreenCanvas === 'function') {
  installSpeciesCanvasFactory((width, height) => new OffscreenCanvas(width, height));
}
scope.addEventListener('message', (event: MessageEvent<unknown>) => {
  const message = earthResidentRequestV1(event.data);
  if (!message) return;
  try {
    if (typeof OffscreenCanvas !== 'function') throw new Error('resident OffscreenCanvas unavailable');
    const canvas = renderEarthResidentLayerV1(message.plan);
    const bitmap = canvas.transferToImageBitmap();
    const response: EarthResidentResponseV1 = {
      schema: EARTH_LAYER_RESPONSE, token: message.token, type: 'result', bitmap,
    };
    try { scope.postMessage(response, [bitmap]); }
    catch (error) { bitmap.close(); throw error; }
  } catch (error) {
    const response: EarthResidentResponseV1 = {
      schema: EARTH_LAYER_RESPONSE, token: message.token, type: 'error',
      message: (error instanceof Error ? error.message : String(error)).slice(0, 512) || 'resident layer failed',
    };
    scope.postMessage(response);
  }
});
