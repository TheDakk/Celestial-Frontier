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
export interface PilotLandingPresentation {
  finish(snapshot: PilotSceneSnapshot | null): void;
  cancel(): void;
}
export interface PilotSettlementPresentation {
  finish(success: boolean): void;
  cancel(): void;
}
export interface AudiovisualPilot {
  beginSettlement(trusted: boolean): PilotSettlementPresentation | null;
  beginLanding(destinationRouteKey: string, trusted: boolean): PilotLandingPresentation | null;
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
  const selectComposition = (): boolean => {
    const image = landscapeImages[0];
    if (!image) return false;
    const url = (document.defaultView?.innerWidth ?? 1024) <= 600 ? PILOT_VISTA_PHONE : PILOT_VISTA_LAYERS[0]!;
    if (image.dataset.presentationSrc === url) return false;
    image.dataset.presentationSrc = url; image.dataset.ready = 'false'; image.src = url;
    return true;
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
  // A native Land gesture owns one decorative arrival, never a second landing
  // simulation. Admission expires silently; it cannot delay gameplay or retry.
  const view = document.defaultView;
  type Landing = {
    readonly origin: string;
    readonly destination: string;
    readonly ship: HTMLImageElement;
    readonly audio: { accept(): boolean; cancel(): void } | null;
    readonly loaded: (event: Event) => void;
    timer: number;
    expiresAt: number;
    arrived: boolean;
    finished: boolean;
    shown: boolean;
    ready: boolean;
    observer: MutationObserver | null;
  };
  type Settlement = {
    readonly routeKey: string;
    readonly audio: NonNullable<ReturnType<TameGreetingAudioOwner['armNativePilotSettlementGesture']>>;
    timer: number;
    expiresAt: number;
    finished: boolean;
  };
  let settlement: Settlement | null = null;
  const settlementEligible = (): boolean => !disposed && enhanced && snapshot.effects && pilotSoundEnabled
    && typeof snapshot.routeKey === 'string' && !!snapshot.routeKey.trim() && snapshot.routeKey.length <= 512
    && document.visibilityState === 'visible';
  const cancelSettlement = (stopPlayback = true): void => {
    const current = settlement;
    if (!current) return;
    settlement = null;
    view?.clearTimeout(current.timer);
    current.audio.cancel();
    if (stopPlayback) sound.stop();
  };
  const settlementCurrent = (current: Settlement): boolean => settlement === current && settlementEligible()
    && snapshot.routeKey === current.routeKey && view!.performance.now() < current.expiresAt;
  let landing: Landing | null = null;
  const cancelLanding = (stopPlayback = true): void => {
    const current = landing;
    if (!current) return;
    landing = null;
    view?.clearTimeout(current.timer); current.observer?.disconnect();
    current.ship.removeEventListener('load', current.loaded);
    current.ship.removeEventListener('error', current.loaded);
    current.ship.removeAttribute('src'); current.ship.remove();
    current.audio?.cancel();
    if (stopPlayback && current.audio !== null) sound.stop();
  };
  const compatibleLandingRoute = (next: PilotSceneSnapshot, current: Landing): boolean => next.mode === 'surface'
    && next.routeKey === current.destination && next.effects && pilotShipEligible(next.ship)
    && (next.biomeKey === null || next.biomeKey === 'temperate')
    && (next.vistaBinding == null || next.vistaBinding === PILOT_EARTH_VISTA_BINDING);
  const exactLandingSurface = (next: PilotSceneSnapshot, current: Landing): boolean => next.mode === 'surface'
    && next.routeKey === current.destination && next.biomeKey === 'temperate'
    && next.vistaBinding === PILOT_EARTH_VISTA_BINDING && next.vistaReady
    && next.effects && pilotShipEligible(next.ship);
  const paintLanding = (compositionChanged: boolean): void => {
    const current = landing;
    if (!current) return;
    const atOrigin = snapshot.mode === 'system' && snapshot.routeKey === current.origin && !current.arrived;
    const atDestination = snapshot.mode === 'surface' && snapshot.routeKey === current.destination;
    if (disposed || !enhanced || !snapshot.effects || !pilotShipEligible(snapshot.ship)
      || document.visibilityState !== 'visible' || compositionChanged || view!.performance.now() >= current.expiresAt
      || (!atOrigin && !atDestination)
      || (atDestination && ((snapshot.biomeKey !== null && snapshot.biomeKey !== 'temperate')
        || (snapshot.vistaBinding != null && snapshot.vistaBinding !== PILOT_EARTH_VISTA_BINDING)))) {
      cancelLanding(); return;
    }
    if (atDestination) current.arrived = true;
    if (current.shown) {
      if (!exactLandingSurface(snapshot, current) || scene.hidden) cancelLanding();
      else if (!snapshot.motion) current.ship.dataset.motion = 'static';
      return;
    }
    if (!current.finished || !current.ready || scene.hidden || !exactLandingSurface(snapshot, current)) return;
    // A phone Survey covers most of the scene. Its existing 44px header row
    // can carry this brief decorative arrival without obscuring its actions.
    const survey = document.querySelector<HTMLElement>('#survey[aria-hidden="false"]');
    const header = (view?.innerWidth ?? 1024) <= 700 && survey?.querySelector('[data-act="leaveworld"]')
      ? survey.querySelector<HTMLElement>('.survey-head') : null;
    const close = header?.querySelector('[data-survey-close]');
    if (header && close) {
      current.ship.dataset.placement = 'survey-header';
      header.insertBefore(current.ship, close);
      current.observer = new view!.MutationObserver(() => {
        if (landing === current && (!header.contains(current.ship)
          || !header.isConnected || survey?.getAttribute('aria-hidden') !== 'false')) cancelLanding();
      });
      current.observer.observe(header, { childList: true });
      current.observer.observe(survey!, { attributes: true, attributeFilter: ['aria-hidden'], childList: true });
    }
    current.shown = true;
    current.expiresAt = view!.performance.now() + 1800;
    current.ship.dataset.motion = snapshot.motion ? 'animated' : 'static';
    current.ship.hidden = false;
    view!.clearTimeout(current.timer);
    current.timer = view!.setTimeout(() => { if (landing === current) cancelLanding(); }, 1800);
    // Accept only the authority armed synchronously before the durable action.
    // A rejected ticket leaves the visual silent; no post-await reactivation.
    if (pilotSoundEnabled && current.audio?.accept()) void sound.play('cf-pilot-scout-landing', audioOptions());
  };
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
    const compositionChanged = selectComposition();
    if (settlement !== null && !settlementCurrent(settlement)) cancelSettlement();
    // Static scene: anatomical motion is not implemented by this candidate.
    root.dataset.motion = 'static';
    if (enhanced) document.body.dataset.cfPilotLook = '';
    else delete document.body.dataset.cfPilotLook;
    const imagesReady = landscapeImages.length > 0 && landscapeImages.every(image => image.dataset.ready === 'true');
    scene.hidden = !enhanced || !snapshot.effects || !snapshot.vistaReady || snapshot.mode !== 'surface'
      || snapshot.biomeKey !== 'temperate' || snapshot.vistaBinding !== PILOT_EARTH_VISTA_BINDING || !imagesReady;
    publish(!scene.hidden);
    paintLanding(compositionChanged);
  };
  const loaded = (event: Event): void => {
    const image = event.currentTarget as HTMLImageElement;
    image.dataset.ready = String(event.type === 'load' && image.naturalWidth > 0);
    if (image.dataset.ready !== 'true') cancelLanding();
    paint();
  };
  landscapeImages.forEach(image => {
    image.addEventListener('load', loaded); image.addEventListener('error', loaded);
    image.dataset.ready = String(image.complete && image.naturalWidth > 0);
  });
  const play = async (event: MouseEvent): Promise<void> => {
    if (!event.isTrusted || disposed) return;
    cancelLanding(false); cancelSettlement(false); sound.stop();
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
  const stopSound = (): void => { generation++; cancelLanding(false); cancelSettlement(false); sound.stop(); status.textContent = 'Pilot sound stopped.'; };
  const disableSound = (): void => { pilotSoundEnabled = false; stopSound(); };
  // Existing navigation controls own their actions. A trusted completed click
  // may add only a short decorative navigation cue after the pilot is enabled.
  const navigationCue = (event: MouseEvent): void => {
    if (!event.isTrusted || disposed || !pilotSoundEnabled || landing !== null) return;
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('#dockshipyard,#railshipyard,#dockinventory,#railinventory,#dockcodex,#railcodex')) return;
    cancelSettlement(false); sound.stop();
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
    beginSettlement(trusted) {
      cancelSettlement();
      if (trusted !== true || !view || !settlementEligible()) return null;
      cancelLanding(false); sound.stop();
      const audioTicket = audio.armNativePilotSettlementGesture();
      if (audioTicket === null) return null;
      const current: Settlement = { routeKey: snapshot.routeKey!, audio: audioTicket,
        timer: 0, expiresAt: view.performance.now() + 10_000, finished: false };
      settlement = current;
      current.timer = view.setTimeout(() => { if (settlement === current) cancelSettlement(); }, 10_000);
      return Object.freeze({
        finish(success: boolean) {
          if (settlement !== current || current.finished) return;
          if (success !== true || !settlementCurrent(current)) { cancelSettlement(); return; }
          current.finished = true;
          if (!current.audio.accept()) { cancelSettlement(); return; }
          // Decode and the captured activation retain the original admission
          // deadline. The finite cue lifetime starts only when a source starts.
          void sound.play('cf-pilot-ui-settlement', audioOptions()).then(started => {
            if (settlement !== current) return;
            if (!started || !settlementCurrent(current)) { cancelSettlement(); return; }
            current.expiresAt = view.performance.now() + 700;
            view.clearTimeout(current.timer);
            current.timer = view.setTimeout(() => { if (settlement === current) cancelSettlement(); }, 700);
          });
        },
        cancel() { if (settlement === current) cancelSettlement(); },
      });
    },
    beginLanding(destinationRouteKey, trusted) {
      cancelSettlement(); cancelLanding();
      if (trusted !== true || disposed || !view || !enhanced || !snapshot.effects
        || !pilotShipEligible(snapshot.ship) || snapshot.mode !== 'system'
        || typeof snapshot.routeKey !== 'string' || !snapshot.routeKey.trim()
        || typeof destinationRouteKey !== 'string' || !destinationRouteKey.trim()
        || destinationRouteKey === snapshot.routeKey || document.visibilityState !== 'visible') return null;
      let audioTicket: Landing['audio'] = null;
      if (pilotSoundEnabled) {
        sound.stop();
        audioTicket = audio.armNativePilotLandingGesture(destinationRouteKey);
      }
      const ship = document.createElement('img');
      ship.dataset.cfPilotShip = 'landing'; ship.alt = ''; ship.setAttribute('aria-hidden', 'true');
      ship.hidden = true; ship.decoding = 'async'; ship.draggable = false;
      const current: Landing = { origin: snapshot.routeKey, destination: destinationRouteKey, ship, audio: audioTicket,
        timer: 0, expiresAt: view.performance.now() + 10_000, arrived: false, finished: false, shown: false, ready: false, observer: null,
        loaded: (event) => {
          if (landing !== current) return;
          current.ready = event.type === 'load' && ship.naturalWidth > 0 && ship.naturalHeight > 0;
          if (!current.ready) cancelLanding(); else paint();
        } };
      landing = current;
      ship.addEventListener('load', current.loaded); ship.addEventListener('error', current.loaded);
      scene.append(ship); ship.src = PILOT_SHIP_IMAGES[512];
      current.ready = ship.complete && ship.naturalWidth > 0 && ship.naturalHeight > 0;
      current.timer = view.setTimeout(() => { if (landing === current) cancelLanding(); }, 10_000);
      return Object.freeze({
        finish(next: PilotSceneSnapshot | null) {
          if (landing !== current || current.finished) return;
          if (next === null || !compatibleLandingRoute(next, current) || !compatibleLandingRoute(snapshot, current)) {
            cancelLanding(); return;
          }
          current.finished = true; paint();
        },
        cancel() { if (landing === current) cancelLanding(); },
      });
    },
    sync(next) {
      if (disposed) return;
      const expectedLandingArrival = landing !== null && !landing.arrived
        && snapshot.mode === 'system' && snapshot.routeKey === landing.origin
        && next.mode === 'surface' && next.routeKey === landing.destination;
      if (next.routeKey !== snapshot.routeKey && !expectedLandingArrival) stopSound();
      snapshot = next; paint();
    },
    dispose() {
      if (disposed) return; disposed = true; generation++; cancelLanding(false); cancelSettlement(false); sound.dispose();
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
