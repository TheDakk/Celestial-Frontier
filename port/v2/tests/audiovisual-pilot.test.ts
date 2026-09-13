import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
const { JSDOM } = createRequire(import.meta.url)('jsdom') as {
  JSDOM: new (html: string, options: unknown) => { window: Window };
};
import { shipVisualStateOf } from '@cf/scene';
import { mountAudiovisualPilot, pilotShipEligible, type PilotSceneSnapshot } from '../apps/game/src/audiovisual-pilot.js';
import type { TameGreetingAudioOwner } from '../apps/game/src/tame-greeting-audio.js';
import { PILOT_EARTH_VISTA_BINDING } from '../apps/game/src/pilot-earth-binding.js';
import { PILOT_SHIP_IMAGES } from '../apps/game/src/pilot-assets.js';

// Two independent layers keep the all-loaded condition non-vacuous even when
// the current asset pack happens to contain a single flattened image.
vi.mock('../apps/game/src/pilot-assets.js', async (importOriginal) => ({
  ...await importOriginal<typeof import('../apps/game/src/pilot-assets.js')>(),
  PILOT_VISTA_LAYERS: Object.freeze(['/test/candidate-landscape.webp', '/test/candidate-residents.webp']),
}));

const starter = shipVisualStateOf({ items: [], ascCh: 0, liverySeed: 0x5111 });
function setup() {
  const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  const document = dom.window.document;
  const cancelPilotPlayback = vi.fn(), armNativePilotGesture = vi.fn(() => true);
  const audio = { cancelPilotPlayback, armNativePilotGesture, playPilotVoice: vi.fn() } as unknown as TameGreetingAudioOwner;
  const initial: PilotSceneSnapshot = { mode: 'surface', routeKey: 'earth', biomeKey: 'temperate', vistaReady: true,
    vistaBinding: PILOT_EARTH_VISTA_BINDING, ship: starter, motion: true, effects: true };
  const onPresentationChange = vi.fn();
  const pilot = mountAudiovisualPilot({ document, initial, audio, onPresentationChange });
  const scene = document.querySelector<HTMLElement>('[data-cf-pilot-scene]')!;
  const images = [...scene.querySelectorAll('img')];
  const load = (image: HTMLImageElement, width = 960, type = 'load'): void => {
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: width });
    const event = document.createEvent('Event'); event.initEvent(type, false, false);
    image.dispatchEvent(event);
  };
  return { dom, document, initial, pilot, scene, images, load, onPresentationChange, cancelPilotPlayback, armNativePilotGesture };
}
describe('opt-in audiovisual presentation', () => {
  it('uses the starter hull only for its exact unmodified visual loadout', () => {
    expect(pilotShipEligible(starter)).toBe(true);
    expect(pilotShipEligible({ ...starter, liverySeed: 123 })).toBe(false);
    expect(pilotShipEligible({ ...starter, provenance: 'legacy-charter-refit' })).toBe(false);
    expect(pilotShipEligible({ ...starter, chassisStage: 1 })).toBe(false);
    expect(pilotShipEligible({ ...starter, installedSystemIds: ['array'] })).toBe(false);
    expect(pilotShipEligible({ ...starter, hardpoints: { ...starter.hardpoints, array: true } })).toBe(false);
  });
  it('publishes the eligible Shipyard image without a floating ship and waits for every decoded landscape layer', () => {
    const s = setup();
    try {
      expect(s.document.querySelector('[data-cf-pilot-ship]')).toBeNull();
      expect(s.images).toHaveLength(2);
      expect(s.scene.hidden).toBe(true);
      expect(s.onPresentationChange).toHaveBeenCalledExactlyOnceWith({
        enhanced: true, surfaceVisible: false, starterScoutImageUrl: PILOT_SHIP_IMAGES[300],
      });
      s.load(s.images[0]!, 0);
      expect(s.scene.hidden).toBe(true);
      expect(s.onPresentationChange).toHaveBeenCalledTimes(1);
      s.load(s.images[0]!);
      expect(s.scene.hidden).toBe(true);
      expect(s.onPresentationChange).toHaveBeenCalledTimes(1);
      s.load(s.images[1]!);
      expect(s.scene.hidden).toBe(false);
      expect(s.onPresentationChange).toHaveBeenLastCalledWith({
        enhanced: true, surfaceVisible: true, starterScoutImageUrl: PILOT_SHIP_IMAGES[300],
      });
      expect(s.onPresentationChange).toHaveBeenCalledTimes(2);
      s.pilot.sync({ ...s.initial }); s.load(s.images[0]!); s.load(s.images[1]!);
      expect(s.onPresentationChange).toHaveBeenCalledTimes(2);
      s.load(s.images[1]!, 960, 'error');
      expect(s.scene.hidden).toBe(true);
      expect(s.onPresentationChange).toHaveBeenLastCalledWith({
        enhanced: true, surfaceVisible: false, starterScoutImageUrl: PILOT_SHIP_IMAGES[300],
      });
      expect(s.onPresentationChange).toHaveBeenCalledTimes(3);
      s.load(s.images[1]!, 960, 'error');
      expect(s.onPresentationChange).toHaveBeenCalledTimes(3);
      s.load(s.images[1]!);
      expect(s.scene.hidden).toBe(false);
      expect(s.onPresentationChange).toHaveBeenCalledTimes(4);
      s.pilot.sync({ ...s.initial, ship: { ...starter, provenance: 'legacy-charter-refit' } });
      expect(s.onPresentationChange).toHaveBeenLastCalledWith({ enhanced: true, surfaceVisible: true, starterScoutImageUrl: null });
      expect(s.armNativePilotGesture).not.toHaveBeenCalled();
    } finally { s.pilot.dispose(); s.dom.window.close(); }
  });

  it('restores native art while a newly selected phone composition loads after resize', () => {
    const s = setup();
    try {
      s.images.forEach(image => s.load(image)); expect(s.scene.hidden).toBe(false);
      const wide = s.images[0]!.src;
      Object.defineProperty(s.dom.window, 'innerWidth', { configurable: true, value: 390 });
      const resize = s.document.createEvent('Event'); resize.initEvent('resize', false, false);
      s.dom.window.dispatchEvent(resize);
      expect(s.images[0]!.src).not.toBe(wide); expect(s.scene.hidden).toBe(true);
      expect(s.onPresentationChange).toHaveBeenLastCalledWith(expect.objectContaining({ surfaceVisible: false }));
      s.load(s.images[0]!); expect(s.scene.hidden).toBe(false);
    } finally { s.pilot.dispose(); s.dom.window.close(); }
  });
  it('cannot substitute a loaded candidate for an absent or changed canonical world, weather, roster or profile request', () => {
    const s = setup();
    try {
      s.images.forEach(image => s.load(image));
      expect(s.scene.hidden).toBe(false);
      const binding = JSON.parse(PILOT_EARTH_VISTA_BINDING) as {
        worldKey: string; environmentFingerprint: string; profileDigest: string;
        options: { wx: string; genes: unknown[] };
      };
      const absentBinding: PilotSceneSnapshot = { ...s.initial };
      delete (absentBinding as { vistaBinding?: string | null }).vistaBinding;
      s.pilot.sync(absentBinding);
      expect(s.scene.hidden).toBe(true);
      expect(s.onPresentationChange).toHaveBeenLastCalledWith(expect.objectContaining({ surfaceVisible: false }));
      s.pilot.sync(s.initial); expect(s.scene.hidden).toBe(false);
      const changedWeather = JSON.stringify({ ...binding, options: { ...binding.options, wx: 'clear' } });
      const changedRoster = JSON.stringify({ ...binding, options: { ...binding.options, genes: binding.options.genes.slice(1) } });
      expect(changedWeather).not.toBe(PILOT_EARTH_VISTA_BINDING);
      expect(changedRoster).not.toBe(PILOT_EARTH_VISTA_BINDING);
      for (const change of [
        { vistaReady: false }, { biomeKey: 'desert' }, { effects: false }, { mode: 'system' as const },
        { vistaBinding: null },
        { vistaBinding: changedWeather }, { vistaBinding: changedRoster },
        { vistaBinding: JSON.stringify({ ...binding, worldKey: 'different-world' }) },
        { vistaBinding: JSON.stringify({ ...binding, environmentFingerprint: 'different-environment' }) },
        { vistaBinding: JSON.stringify({ ...binding, profileDigest: 'different-profile' }) },
      ]) {
        s.pilot.sync({ ...s.initial, ...change });
        expect(s.scene.hidden, JSON.stringify(change)).toBe(true);
        expect(s.onPresentationChange).toHaveBeenLastCalledWith(expect.objectContaining({ surfaceVisible: false }));
        s.pilot.sync(s.initial);
        expect(s.scene.hidden).toBe(false);
        expect(s.onPresentationChange).toHaveBeenLastCalledWith(expect.objectContaining({ surfaceVisible: true }));
      }
    } finally { s.pilot.dispose(); s.dom.window.close(); }
  });

  it('keeps comparison local and restores the same candidate and shared styling without changing route inputs', () => {
    const s = setup();
    try {
      s.images.forEach(image => s.load(image));
      const compare = s.document.querySelector<HTMLButtonElement>('[aria-pressed]')!;
      expect(s.document.body.dataset.cfPilotLook).toBe('');
      compare.click();
      expect(s.scene.hidden).toBe(true);
      expect(s.document.body.dataset.cfPilotLook).toBeUndefined();
      expect(compare.getAttribute('aria-pressed')).toBe('true');
      expect(compare.textContent).toBe('Show pilot look');
      expect(s.onPresentationChange).toHaveBeenLastCalledWith({ enhanced: false, surfaceVisible: false, starterScoutImageUrl: null });
      compare.click();
      expect(s.scene.hidden).toBe(false);
      expect(s.document.body.dataset.cfPilotLook).toBe('');
      expect(compare.getAttribute('aria-pressed')).toBe('false');
      expect(compare.textContent).toBe('Show current look');
      expect(s.onPresentationChange).toHaveBeenLastCalledWith({ enhanced: true, surfaceVisible: true, starterScoutImageUrl: PILOT_SHIP_IMAGES[300] });
      expect(s.initial.routeKey).toBe('earth');
      expect(s.initial.vistaBinding).toBe(PILOT_EARTH_VISTA_BINDING);
      expect(s.armNativePilotGesture).not.toHaveBeenCalled();
    } finally { s.pilot.dispose(); s.dom.window.close(); }
  });

  it('restores presentation and removes media/style ownership once on disposal, rejecting retained load/sync events', () => {
    const s = setup();
    try {
      s.images.forEach(image => s.load(image));
      const before = s.onPresentationChange.mock.calls.length;
      s.pilot.dispose();
      expect(s.onPresentationChange).toHaveBeenCalledTimes(before + 1);
      expect(s.onPresentationChange).toHaveBeenLastCalledWith({ enhanced: false, surfaceVisible: false, starterScoutImageUrl: null });
      expect(s.document.body.dataset.cfPilotLook).toBeUndefined();
      expect(s.document.querySelector('[data-cf-audiovisual-pilot]')).toBeNull();
      expect(s.document.querySelector('[data-cf-pilot-style]')).toBeNull();
      expect(s.images.every(image => !image.hasAttribute('src'))).toBe(true);
      s.pilot.dispose(); s.pilot.sync(s.initial);
      s.images.forEach(image => s.load(image));
      expect(s.onPresentationChange).toHaveBeenCalledTimes(before + 1);
      expect(s.cancelPilotPlayback).toHaveBeenCalledOnce();
      expect(s.document.body.dataset.cfPilotLook).toBeUndefined();
    } finally { s.pilot.dispose(); s.dom.window.close(); }
  });
  it.each(['card-open', 'panel-open', 'training'])('removes expanded pilot controls from hit testing under %s ownership', (state) => {
    const s = setup();
    try {
      const controls = s.document.querySelector<HTMLDetailsElement>('[data-cf-pilot-controls]')!;
      controls.open = true;
      expect(s.dom.window.getComputedStyle(controls).display).not.toBe('none');
      s.document.body.classList.add(state);
      expect(s.dom.window.getComputedStyle(controls).display).toBe('none');
      expect(s.dom.window.getComputedStyle(controls).pointerEvents).toBe('none');
      expect(s.armNativePilotGesture).not.toHaveBeenCalled();
      s.document.body.classList.remove(state);
      expect(s.dom.window.getComputedStyle(controls).display).not.toBe('none');
      expect(s.dom.window.getComputedStyle(controls).pointerEvents).toBe('auto');
    } finally { s.pilot.dispose(); s.dom.window.close(); }
  });
  it.each(['tutcard', 'importsheet', 'inventorysheet'])('honors the actual visible %s owner and restores controls after hide/removal', (id) => {
    const s = setup();
    try {
      const controls = s.document.querySelector<HTMLDetailsElement>('[data-cf-pilot-controls]')!;
      controls.open = true;
      const owned = s.document.createElement('div'); owned.id = id;
      owned.style.display = 'none'; s.document.body.append(owned);
      expect(s.dom.window.getComputedStyle(controls).display).not.toBe('none');
      owned.style.display = id === 'importsheet' ? 'flex' : 'block';
      expect(s.dom.window.getComputedStyle(controls).display).toBe('none');
      expect(s.dom.window.getComputedStyle(controls).pointerEvents).toBe('none');
      owned.hidden = true;
      expect(s.dom.window.getComputedStyle(controls).display).not.toBe('none');
      owned.hidden = false; owned.setAttribute('aria-hidden', 'true');
      expect(s.dom.window.getComputedStyle(controls).display).not.toBe('none');
      owned.removeAttribute('aria-hidden');
      expect(s.dom.window.getComputedStyle(controls).display).toBe('none');
      owned.remove(); expect(s.dom.window.getComputedStyle(controls).display).not.toBe('none');
    } finally { s.pilot.dispose(); s.dom.window.close(); }
  });
  it('rejects scripted sound activation and releases route/disposal work', () => {
    const s = setup();
    const play = [...s.document.querySelectorAll('button')].find(b => b.textContent === 'Play pilot sound')!;
    play.click(); expect(s.armNativePilotGesture).not.toHaveBeenCalled();
    s.pilot.sync({ ...s.initial, routeKey: 'mars' }); expect(s.cancelPilotPlayback).toHaveBeenCalledOnce();
    s.pilot.dispose(); s.pilot.dispose();
    expect(s.cancelPilotPlayback).toHaveBeenCalledTimes(2);
    expect(s.document.querySelector('[data-cf-audiovisual-pilot]')).toBeNull();
    expect(s.document.querySelector('[data-cf-pilot-style]')).toBeNull();
    s.dom.window.close();
  });
});
