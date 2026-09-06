import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
const { JSDOM } = createRequire(import.meta.url)('jsdom') as {
  JSDOM: new (html: string, options: unknown) => { window: Window };
};
import { shipVisualStateOf } from '@cf/scene';
import { mountAudiovisualPilot, pilotShipEligible, type PilotSceneSnapshot } from '../apps/game/src/audiovisual-pilot.js';
import type { TameGreetingAudioOwner } from '../apps/game/src/tame-greeting-audio.js';

const starter = shipVisualStateOf({ items: [], ascCh: 0, liverySeed: 0x5111 });
function setup() {
  const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  const document = dom.window.document;
  const cancelPilotPlayback = vi.fn(), armNativePilotGesture = vi.fn(() => true);
  const audio = { cancelPilotPlayback, armNativePilotGesture, playPilotVoice: vi.fn() } as unknown as TameGreetingAudioOwner;
  const initial: PilotSceneSnapshot = { mode: 'surface', routeKey: 'earth', biomeKey: 'temperate', vistaReady: true, ship: starter, motion: true, effects: true };
  const pilot = mountAudiovisualPilot({ document, initial, audio });
  const scene = document.querySelector<HTMLElement>('[data-cf-pilot-scene]')!;
  const ship = document.querySelector<HTMLImageElement>('[data-cf-pilot-ship]')!;
  return { dom, document, initial, pilot, scene, ship, cancelPilotPlayback, armNativePilotGesture };
}
describe('opt-in audiovisual presentation', () => {
  it('uses the starter hull only for its exact unmodified visual loadout', () => {
    expect(pilotShipEligible(starter)).toBe(true);
    expect(pilotShipEligible({ ...starter, liverySeed: 123 })).toBe(false);
    expect(pilotShipEligible({ ...starter, chassisStage: 1 })).toBe(false);
    expect(pilotShipEligible({ ...starter, installedSystemIds: ['array'] })).toBe(false);
    expect(pilotShipEligible({ ...starter, hardpoints: { ...starter.hardpoints, array: true } })).toBe(false);
  });
  it('cannot substitute atmosphere for an absent or different canonical vista', () => {
    const s = setup();
    try {
      expect(s.scene.hidden).toBe(false);
      for (const change of [{ vistaReady: false }, { biomeKey: 'desert' }, { effects: false }, { mode: 'system' as const }]) {
        s.pilot.sync({ ...s.initial, ...change }); expect(s.scene.hidden).toBe(true);
      }
      s.pilot.sync(s.initial); expect(s.scene.hidden).toBe(false);
    } finally { s.pilot.dispose(); s.dom.window.close(); }
  });
  it('keeps comparison local and restores the same candidate without changing its route input', () => {
    const s = setup();
    try {
      const compare = s.document.querySelector<HTMLButtonElement>('[aria-pressed]')!;
      compare.click(); expect(s.scene.hidden).toBe(true); expect(s.ship.hidden).toBe(true);
      compare.click(); expect(s.scene.hidden).toBe(false); expect(s.ship.hidden).toBe(false);
      expect(s.initial.routeKey).toBe('earth'); expect(s.armNativePilotGesture).not.toHaveBeenCalled();
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
