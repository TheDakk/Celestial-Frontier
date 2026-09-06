import { PILOT_COMPONENT_CSS } from './pilot-tokens.js';
import { projectPilotPortraitMotionV1, type PilotPortraitMotionInputV1 } from './pilot-portrait-motion.js';
import { SpeciesArtLoader, type PortraitRequest, type ThumbLease } from './species-art-loader.js';
import type { PilotSpecimenV1, PilotPortraitSizeV1 } from './pilot-specimens.js';

export function pilotElement<K extends keyof HTMLElementTagNameMap>(
  document: Document, tag: K, className = '', text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function installPilotStyle(document: Document): () => void {
  const style = document.createElement('style');
  style.dataset.cfPilotStyle = '';
  style.textContent = PILOT_COMPONENT_CSS;
  document.head.append(style);
  return () => style.remove();
}

export function createPilotVista(document: Document, layers: readonly string[]): HTMLElement {
  const scene = pilotElement(document, 'div', 'p-vista');
  scene.setAttribute('role', 'img');
  scene.setAttribute('aria-label', 'Candidate temperate woodland: distant canopy, open basin and shaded foreground');
  layers.forEach((url, index) => {
    const image = document.createElement('img');
    image.alt = ''; image.decoding = 'async'; image.src = url;
    image.dataset.depth = index === 0 ? 'far' : index === 1 ? 'middle' : 'near';
    scene.append(image);
  });
  return scene;
}

export type PilotPortraitPresentation = Readonly<Partial<Pick<PilotPortraitMotionInputV1,
  'effectsOn' | 'motion' | 'deviceTier'>>>;

/** Uses the same bounded broker as the game. No second painter, modified
 * genome or cached screenshot can substitute for the canonical art input. */
export function mountPilotPortrait(
  loader: SpeciesArtLoader, mount: HTMLElement, specimen: PilotSpecimenV1,
  size: PilotPortraitSizeV1, animated: boolean, presentation: PilotPortraitPresentation = {},
): () => void {
  if (![132, 300, 440].includes(size)) throw new RangeError('Unsupported pilot portrait size');
  const document = mount.ownerDocument;
  const frame = pilotElement(document, 'div', 'p-portrait-wrap');
  const image = pilotElement(document, 'img', 'p-portrait');
  image.width = size; image.height = size; image.alt = specimen.label;
  image.dataset.pilotSpecimen = specimen.id;
  image.dataset.pilotSize = String(size);
  image.dataset.visualKey = specimen.visualKey;
  image.dataset.pilotPortrait = 'loading';
  const status = pilotElement(document, 'p', 'p-muted', 'Loading the protected portrait…');
  const accent = pilotElement(document, 'span', 'p-portrait-accent');
  accent.setAttribute('aria-hidden', 'true');
  frame.append(image, accent); mount.append(frame, status);
  let disposed = false, portrait: PortraitRequest | null = null, lease: ThumbLease | null = null;
  let unsubscribe: (() => void) | null = null;
  const unavailable = (): void => {
    if (disposed) return;
    image.dataset.pilotPortrait = 'error';
    status.textContent = 'Portrait unavailable; this comparison is incomplete.';
  };
  const rendered = (): void => {
    if (disposed || !image.src || image.dataset.pilotPortrait === 'error') return;
    image.dataset.pilotPortrait = 'ready';
    status.textContent = (size === 300 ? '300 px display from the unchanged 440 px portrait.' : `${size} px native portrait.`)
      + ' Anatomical animation incomplete.';
  };
  image.addEventListener('load', rendered);
  image.addEventListener('error', unavailable);
  const publish = (asset: { url: string; key: string } | null, error?: unknown): void => {
    if (disposed || !image.isConnected) return;
    if (error !== undefined) { unavailable(); return; }
    if (asset === null) return;
    if (asset.key !== specimen.visualKey) { unavailable(); return; }
    image.dataset.pilotPortrait = 'loading';
    image.src = asset.url;
  };
  try {
    if (size === 132) {
      lease = loader.leaseThumb(specimen.genome);
      unsubscribe = lease.subscribe(publish);
      publish(lease.current);
    } else {
      portrait = loader.requestPortrait(`pilot:${specimen.id}:${size}:${animated}`, specimen.genome, publish);
      publish(portrait.current);
    }
  } catch {
    unsubscribe?.(); unsubscribe = null; lease?.release(); lease = null;
    portrait?.cancel(); portrait = null; unavailable();
  }
  const reduced = document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
  const refresh = (): void => {
    if (disposed) return;
    const policy = projectPilotPortraitMotionV1({ requestedMode: animated ? 'animated' : 'static',
      effectsOn: presentation.effectsOn ?? true,
      motion: reduced?.matches || presentation.motion === 'reduced' ? 'reduced' : 'full',
      deviceTier: presentation.deviceTier ?? 'low', elapsedMs: 0,
      visible: document.visibilityState === 'visible' });
    accent.style.opacity = String(policy.accentOpacity);
    accent.style.animation = policy.mode === 'animated' ? 'cf-pilot-portrait-accent 12s linear infinite' : 'none';
    accent.dataset.pilotMotion = policy.mode;
  };
  document.addEventListener('visibilitychange', refresh);
  reduced?.addEventListener('change', refresh);
  refresh();
  return () => {
    if (disposed) return;
    disposed = true;
    document.removeEventListener('visibilitychange', refresh); reduced?.removeEventListener('change', refresh);
    image.removeEventListener('load', rendered); image.removeEventListener('error', unavailable);
    accent.style.animation = 'none';
    unsubscribe?.(); lease?.release(); portrait?.cancel(); frame.remove(); status.remove();
  };
}
