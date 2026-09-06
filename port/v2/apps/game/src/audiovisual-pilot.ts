/* Explicit local-review enhancement over real, already-rendered game routes.
   No navigation, persistence, rewards, species selection or settings writes. */
import { biomeVistaMountLayoutV1 } from './biome-vista-surface.js';
import type { ShipVisualState } from '@cf/scene';
import type { TameGreetingAudioOwner } from './tame-greeting-audio.js';
import { PILOT_SHIP_IMAGES, PILOT_VISTA_ATMOSPHERE } from './pilot-assets.js';
import { createPilotVista, installPilotStyle, pilotElement } from './pilot-components.js';
import { PilotSoundPlayer } from './pilot-sound-player.js';

export interface PilotSceneSnapshot {
  readonly mode: 'universe' | 'galaxy' | 'system' | 'surface';
  readonly routeKey: string | null;
  readonly biomeKey: string | null;
  readonly vistaReady: boolean;
  readonly ship: ShipVisualState;
  readonly motion: boolean;
  readonly effects: boolean;
}
export interface AudiovisualPilot {
  sync(snapshot: PilotSceneSnapshot): void;
  dispose(): void;
}
export function pilotShipEligible(ship: ShipVisualState): boolean {
  return ship.chassisStage === 0 && ship.liverySeed === 0x5111
    && ship.installedSystemIds.length === 0
    && !ship.hardpoints.array && !ship.hardpoints.autoext && !ship.hardpoints.cscoop;
}

export function mountAudiovisualPilot(options: Readonly<{
  document: Document;
  initial: PilotSceneSnapshot;
  audio: TameGreetingAudioOwner;
}>): AudiovisualPilot {
  const { document, audio } = options;
  const removeStyle = installPilotStyle(document);
  const root = pilotElement(document, 'div', 'cf-pilot');
  root.dataset.cfAudiovisualPilot = 'v1';
  const style = document.createElement('style');
  style.textContent = `
    [data-cf-audiovisual-pilot]{pointer-events:none}
    [data-cf-pilot-scene]{position:fixed;z-index:1;pointer-events:none;overflow:hidden;opacity:.5}
    [data-cf-pilot-scene] .p-vista{width:100%;height:100%;aspect-ratio:auto}
    [data-cf-pilot-scene] .p-vista img{object-fit:fill}
    [data-cf-pilot-ship]{position:fixed;left:18px;bottom:calc(var(--dock-h,68px) + 16px);width:100px;height:100px;object-fit:contain;z-index:2;pointer-events:none}
    [data-cf-pilot-controls]{position:fixed;right:12px;bottom:calc(var(--dock-h,68px) + 16px);z-index:80;pointer-events:auto;max-width:min(290px,calc(100vw - 24px));background:#10252bf5;border:1px solid #617e7e;border-radius:12px;padding:8px 12px}
    [data-cf-pilot-controls] summary{min-height:44px;display:flex;align-items:center;cursor:pointer;color:#dcc38d}
    [data-cf-pilot-controls] p{font-size:12px;margin:8px 0}
    [data-cf-pilot-controls] label{min-height:44px;display:flex;gap:8px;align-items:center}
    body.card-open [data-cf-pilot-scene]{opacity:.3}
    body.card-open [data-cf-pilot-controls],body.panel-open [data-cf-pilot-controls],body.training [data-cf-pilot-controls],
    body:has(#tutcard:not([hidden]):not([aria-hidden="true"]):not([style*="display:none"]):not([style*="display: none"])) [data-cf-pilot-controls],
    body:has(#importsheet:not([hidden]):not([aria-hidden="true"]):not([style*="display:none"]):not([style*="display: none"])) [data-cf-pilot-controls],
    body:has(#inventorysheet:not([hidden]):not([aria-hidden="true"]):not([style*="display:none"]):not([style*="display: none"])) [data-cf-pilot-controls]{display:none!important;pointer-events:none!important}
    @media(max-width:600px){[data-cf-pilot-ship]{width:72px;height:72px}}
  `;
  const scene = pilotElement(document, 'div'); scene.dataset.cfPilotScene = '';
  const vista = createPilotVista(document, [PILOT_VISTA_ATMOSPHERE]);
  vista.style.background = 'transparent';
  vista.setAttribute('aria-label', 'Candidate atmospheric light over the existing temperate vista');
  scene.append(vista);
  const shipImage = document.createElement('img');
  shipImage.dataset.cfPilotShip = ''; shipImage.src = PILOT_SHIP_IMAGES[132];
  shipImage.alt = ''; shipImage.setAttribute('aria-hidden', 'true');
  const controls = pilotElement(document, 'details'); controls.dataset.cfPilotControls = '';
  controls.dataset.panelBoundary = '';
  const summary = pilotElement(document, 'summary', '', 'Audiovisual pilot');
  const compare = pilotElement(document, 'button', '', 'Show current look');
  compare.setAttribute('aria-pressed', 'false');
  const listen = pilotElement(document, 'button', '', 'Play pilot sound');
  const stop = pilotElement(document, 'button', '', 'Stop sound');
  const note = pilotElement(document, 'p', '', 'Candidate art and sound. Game controls and creature voices retain their existing behavior.');
  const status = pilotElement(document, 'p', '', 'Sound starts only after you choose Play.');
  status.setAttribute('role', 'status');
  const mono = document.createElement('input'); mono.type = 'checkbox';
  const soft = document.createElement('input'); soft.type = 'checkbox'; soft.checked = true;
  for (const [input, text] of [[mono, 'Mono'], [soft, 'Reduced intensity']] as const) {
    const label = pilotElement(document, 'label', '', text); label.prepend(input); controls.append(label);
  }
  controls.prepend(summary, note, compare, listen, stop); controls.append(status);
  root.append(style, scene, shipImage, controls); document.body.append(root);
  const sound = new PilotSoundPlayer(audio);
  let snapshot = options.initial, enhanced = true, generation = 0, disposed = false, pilotSoundEnabled = false;
  const audioOptions = (): { mono: boolean; reducedIntensity: boolean } => ({ mono: mono.checked, reducedIntensity: soft.checked });
  const paint = (): void => {
    root.dataset.motion = snapshot.motion && snapshot.effects && document.visibilityState === 'visible' ? 'animated' : 'static';
    scene.hidden = !enhanced || !snapshot.effects || !snapshot.vistaReady || snapshot.mode !== 'surface' || snapshot.biomeKey !== 'temperate';
    if (!scene.hidden) {
      const view = document.defaultView!;
      const layout = biomeVistaMountLayoutV1(view.innerWidth, view.innerHeight);
      scene.style.left = `${layout.centerX - layout.displayWidth / 2}px`;
      scene.style.top = `${layout.centerY - layout.displayHeight / 2}px`;
      scene.style.width = `${layout.displayWidth}px`; scene.style.height = `${layout.displayHeight}px`;
    }
    shipImage.hidden = !enhanced || !snapshot.effects || snapshot.mode === 'universe' || !pilotShipEligible(snapshot.ship);
  };
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
      document.defaultView?.removeEventListener('resize', paint); root.remove(); removeStyle();
    },
  };
}
