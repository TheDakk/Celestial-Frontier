/* Explicit local-review enhancement over real, already-rendered game routes.
   No navigation, persistence, rewards, species selection or settings writes. */
import { PILOT_EARTH_VISTA_BINDING } from './pilot-earth-binding.js';
import { PILOT_RUNTIME_CSS } from './pilot-runtime-style.js';
import type { ShipVisualState } from '@cf/scene';
import type { TameGreetingAudioOwner } from './tame-greeting-audio.js';
import { PILOT_SHIP_IMAGES, PILOT_VISTA_LAYERS, PILOT_VISTA_PHONE } from './pilot-assets.js';
import { createPilotVista, installPilotStyle, pilotElement } from './pilot-components.js';
import { PilotSoundPlayer } from './pilot-sound-player.js';

export interface PilotSceneSnapshot {
  readonly mode: 'universe' | 'galaxy' | 'system' | 'surface';
  readonly routeKey: string | null;
  readonly biomeKey: string | null;
  readonly vistaReady: boolean;
  readonly vistaBinding?: string | null;
  readonly ship: ShipVisualState;
  readonly motion: boolean;
  readonly effects: boolean;
}
export interface AudiovisualPilot {
  sync(snapshot: PilotSceneSnapshot): void;
  dispose(): void;
}
export function pilotShipEligible(ship: ShipVisualState): boolean {
  return ship.provenance === 'owned-items' && ship.chassisStage === 0 && ship.liverySeed === 0x5111
    && ship.installedSystemIds.length === 0
    && !ship.hardpoints.array && !ship.hardpoints.autoext && !ship.hardpoints.cscoop;
}

export function mountAudiovisualPilot(options: Readonly<{
  document: Document;
  initial: PilotSceneSnapshot;
  audio: TameGreetingAudioOwner;
  onPresentationChange?: (state: { enhanced: boolean; surfaceVisible: boolean; starterScoutImageUrl: string | null }) => void;
}>): AudiovisualPilot {
  const { document, audio } = options;
  const removeStyle = installPilotStyle(document);
  const root = pilotElement(document, 'div', 'cf-pilot');
  root.dataset.cfAudiovisualPilot = 'v1';
  const style = document.createElement('style');
  style.textContent = PILOT_RUNTIME_CSS;
  const scene = pilotElement(document, 'div'); scene.dataset.cfPilotScene = '';
  const vista = createPilotVista(document, PILOT_VISTA_LAYERS);
  vista.setAttribute('aria-label', 'Earth: a candidate rainy landscape with the unchanged canonical vista residents');
  scene.append(vista);
  const landscapeImages = [...vista.querySelectorAll('img')];
  // Two authored compositions preserve the residents; neither is cover-cropped.
  const selectComposition = (): void => {
    const image = landscapeImages[0];
    if (!image) return;
    const url = (document.defaultView?.innerWidth ?? 1024) <= 600 ? PILOT_VISTA_PHONE : PILOT_VISTA_LAYERS[0]!;
    if (image.dataset.presentationSrc === url) return;
    image.dataset.presentationSrc = url; image.dataset.ready = 'false'; image.src = url;
  };
  selectComposition();
  const controls = pilotElement(document, 'details'); controls.dataset.cfPilotControls = '';
  controls.dataset.panelBoundary = '';
  const summary = pilotElement(document, 'summary', '', 'Pilot controls');
  const compare = pilotElement(document, 'button', '', 'Show current look');
  compare.setAttribute('aria-pressed', 'false');
  const listen = pilotElement(document, 'button', '', 'Play pilot sound');
  const stop = pilotElement(document, 'button', '', 'Stop sound');
  const note = pilotElement(document, 'p', '', 'Earth landscape, Scout materials and shared UI styling. Other worlds and creature portraits retain their current art.');
  const status = pilotElement(document, 'p', '', 'Sound starts only after you choose Play.');
  status.setAttribute('role', 'status');
  const mono = document.createElement('input'); mono.type = 'checkbox';
  const soft = document.createElement('input'); soft.type = 'checkbox'; soft.checked = true;
  for (const [input, text] of [[mono, 'Mono'], [soft, 'Reduced intensity']] as const) {
    const label = pilotElement(document, 'label', '', text); label.prepend(input); controls.append(label);
  }
  controls.prepend(summary, note, compare, listen, stop); controls.append(status);
  root.append(style, scene, controls); document.body.append(root);
  const sound = new PilotSoundPlayer(audio);
  let snapshot = options.initial, enhanced = true, generation = 0, disposed = false, pilotSoundEnabled = false;
  const audioOptions = (): { mono: boolean; reducedIntensity: boolean } => ({ mono: mono.checked, reducedIntensity: soft.checked });
  let lastPresentation = '';
  const publish = (surfaceVisible: boolean): void => {
    const state = { enhanced: enhanced && !disposed, surfaceVisible,
      starterScoutImageUrl: !disposed && enhanced && snapshot.effects && pilotShipEligible(snapshot.ship) ? PILOT_SHIP_IMAGES[300] : null };
    const key = JSON.stringify(state);
    if (key === lastPresentation) return;
    lastPresentation = key;
    options.onPresentationChange?.(state);
  };
  const paint = (): void => {
    if (disposed) return;
    selectComposition();
    // Static scene: anatomical motion is not implemented by this candidate.
    root.dataset.motion = 'static';
    if (enhanced) document.body.dataset.cfPilotLook = '';
    else delete document.body.dataset.cfPilotLook;
    const imagesReady = landscapeImages.length > 0 && landscapeImages.every(image => image.dataset.ready === 'true');
    scene.hidden = !enhanced || !snapshot.effects || !snapshot.vistaReady || snapshot.mode !== 'surface'
      || snapshot.biomeKey !== 'temperate' || snapshot.vistaBinding !== PILOT_EARTH_VISTA_BINDING || !imagesReady;
    publish(!scene.hidden);
  };
  const loaded = (event: Event): void => {
    const image = event.currentTarget as HTMLImageElement;
    image.dataset.ready = String(event.type === 'load' && image.naturalWidth > 0);
    paint();
  };
  landscapeImages.forEach(image => {
    image.addEventListener('load', loaded); image.addEventListener('error', loaded);
    image.dataset.ready = String(image.complete && image.naturalWidth > 0);
  });
  const play = async (event: MouseEvent): Promise<void> => {
    if (!event.isTrusted || disposed) return;
    sound.stop();
    if (!audio.armNativePilotGesture()) { status.textContent = 'Sound is off, or the expedition is not ready. Use the existing Sound setting first.'; return; }
    pilotSoundEnabled = true;
    const request = ++generation;
    status.textContent = 'Loading the pilot sound…';
    const ids = snapshot.mode === 'surface' && snapshot.biomeKey === 'temperate'
      ? ['cf-pilot-exploration-music', 'cf-pilot-temperate-bed'] : ['cf-pilot-exploration-music'];
    const results = await Promise.all(ids.map((id) => sound.play(id, audioOptions())));
    if (disposed || request !== generation) return;
    status.textContent = results.every(Boolean) ? 'Exploration phrase playing. It returns to silence after 24 seconds.' : 'Pilot sound unavailable; normal game audio remains available.';
  };
  const stopSound = (): void => { generation++; sound.stop(); status.textContent = 'Pilot sound stopped.'; };
  const disableSound = (): void => { pilotSoundEnabled = false; stopSound(); };
  // Existing navigation controls own their actions. A trusted completed click
  // may add only a short decorative navigation cue after the pilot is enabled.
  const navigationCue = (event: MouseEvent): void => {
    if (!event.isTrusted || disposed || !pilotSoundEnabled) return;
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('#dockshipyard,#railshipyard,#dockinventory,#railinventory,#dockcodex,#railcodex')) return;
    if (!audio.armNativePilotGesture()) return;
    void sound.play('cf-pilot-ui-nav', audioOptions());
  };
  const toggle = (): void => { enhanced = !enhanced; compare.textContent = enhanced ? 'Show current look' : 'Show pilot look'; compare.setAttribute('aria-pressed', String(!enhanced)); paint(); };
  const visibility = (): void => { if (document.visibilityState !== 'visible') stopSound(); paint(); };
  listen.addEventListener('click', play); stop.addEventListener('click', disableSound); compare.addEventListener('click', toggle);
  mono.addEventListener('change', stopSound); soft.addEventListener('change', stopSound);
  document.addEventListener('visibilitychange', visibility);
  document.addEventListener('click', navigationCue);
  document.defaultView?.addEventListener('resize', paint);
  paint();
  return {
    sync(next) {
      if (disposed) return;
      if (next.routeKey !== snapshot.routeKey) stopSound();
      snapshot = next; paint();
    },
    dispose() {
      if (disposed) return; disposed = true; generation++; sound.dispose();
      listen.removeEventListener('click', play); stop.removeEventListener('click', disableSound); compare.removeEventListener('click', toggle);
      mono.removeEventListener('change', stopSound); soft.removeEventListener('change', stopSound);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('click', navigationCue);
      document.defaultView?.removeEventListener('resize', paint);
      landscapeImages.forEach(image => { image.removeEventListener('load', loaded); image.removeEventListener('error', loaded); image.removeAttribute('src'); });
      delete document.body.dataset.cfPilotLook; publish(false); root.remove(); removeStyle();
    },
  };
}
