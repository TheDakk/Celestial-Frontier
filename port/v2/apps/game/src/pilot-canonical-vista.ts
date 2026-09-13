import { installCaptureHooks } from '@cf/domain-descriptors';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { canonicalWorldRoster } from './world-roster.js';
import { buildBiomeVistaRenderRequestV1 } from './biome-vista-surface.js';
import { BIOME_VISTA_WORKER_REQUEST_SCHEMA, validBiomeVistaWorkerResponseV1 } from './biome-vista-protocol.js';

/** Source-proven Earth, using the existing canonical roster/projection/painter.
 * This is a review fixture only; it grants no route or save entry. */
export function pilotEarthVistaRequest() {
  installCaptureHooks();
  const star = { seed: 424242, x: 560, y: 170 };
  const resolved = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star, planet: { seed: 133 } });
  if (!resolved.ok) throw new Error('Canonical pilot Earth address unavailable');
  const roster = canonicalWorldRoster(resolved.address, 0);
  const planet = systemScene(star.seed).planets.find((entry) => entry.seed === 133);
  if (!roster.ok || !planet) throw new Error('Canonical pilot Earth roster unavailable');
  const request = buildBiomeVistaRenderRequestV1(planet, star.seed, roster.roster.worldKey,
    systemFor(star.seed) as unknown as Record<string, unknown>, roster.roster);
  if (request.biomeKey !== 'temperate') throw new Error('Pilot Earth biome identity changed');
  return request;
}

export function mountPilotEarthVista(canvases: readonly HTMLCanvasElement[], status: HTMLElement): () => void {
  let live = true, settled = false;
  let worker: Worker | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const finish = (): void => {
    if (settled) return;
    settled = true;
    if (timeout !== null) clearTimeout(timeout);
    worker?.terminate();
  };
  const unavailable = (): void => {
    if (!live) return;
    for (const canvas of canvases) canvas.dataset.canonicalVista = 'error';
    status.textContent = 'Vista unavailable; comparison incomplete.';
  };
  const release = (): void => {
    if (!live) return;
    live = false; finish();
    for (const canvas of canvases) { canvas.width = 1; canvas.height = 1; }
  };
  try {
    if (canvases.length < 1 || canvases.length > 2) throw new RangeError('Pilot vista requires one comparison pair');
    const request = pilotEarthVistaRequest();
    const documentToken = 'cf-pilot-canonical-earth-v1';
    worker = new Worker(new URL('./biome-vista.worker.ts', import.meta.url), { type: 'module', name: 'cf-pilot-vista' });
    timeout = setTimeout(() => { finish(); unavailable(); }, 12000);
    worker.onmessage = (event: MessageEvent<unknown>) => {
      const response = event.data;
      // Even stale/malformed deliveries may own a transferred native bitmap.
      // Every received bitmap is closed; only the exact request may paint.
      const candidate = response !== null && typeof response === 'object'
        ? (response as { bitmap?: { close?: () => void } }).bitmap : undefined;
      try {
        if (!live || settled || !validBiomeVistaWorkerResponseV1(response)
          || response.documentToken !== documentToken || response.generation !== 1
          || response.worldKey !== request.worldKey || response.environmentFingerprint !== request.environmentFingerprint
          || response.profileSchema !== request.profileSchema || response.profileDigest !== request.profileDigest
          || (response.type === 'result' && (response.biomeKey !== request.biomeKey || response.scene !== request.scene))) return;
        finish();
        if (response.type === 'error') { unavailable(); return; }
        const contexts = canvases.map((canvas) => canvas.getContext('2d'));
        if (contexts.some((context) => context === null)) throw new Error('Pilot vista context unavailable');
        for (let index = 0; index < canvases.length; index++) {
          const canvas = canvases[index]!;
          canvas.width = response.width; canvas.height = response.height;
          contexts[index]!.drawImage(response.bitmap, 0, 0);
        }
        for (const canvas of canvases) canvas.dataset.canonicalVista = 'ready';
        status.textContent = 'Earth · Sol 424242 · world 133 · canonical temperate roster.';
      } catch { finish(); unavailable(); }
      finally { try { candidate?.close?.(); } catch { /* Native cleanup must not publish success or throw into the page. */ } }
    };
    worker.onerror = () => { if (!settled) { finish(); unavailable(); } };
    worker.postMessage({ schema: BIOME_VISTA_WORKER_REQUEST_SCHEMA, type: 'render', documentToken, generation: 1, request });
  } catch { finish(); unavailable(); }
  return release;
}
