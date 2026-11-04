import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
const { JSDOM } = createRequire(import.meta.url)('jsdom') as {
  JSDOM: new (html: string, options: unknown) => { window: Window };
};
import { shipVisualStateOf } from '@cf/scene';
import { mountAudiovisualPilot, type PilotSceneSnapshot } from '../apps/game/src/audiovisual-pilot.js';
import type { TameGreetingAudioOwner } from '../apps/game/src/tame-greeting-audio.js';
import { PILOT_EARTH_VISTA_BINDING } from '../apps/game/src/pilot-earth-binding.js';
import { PILOT_SHIP_IMAGES } from '../apps/game/src/pilot-assets.js';

const sound = vi.hoisted(() => ({ play: vi.fn(async () => true), stop: vi.fn(), dispose: vi.fn(), trace: [] as string[] }));
vi.mock('../apps/game/src/pilot-sound-player.js', () => ({ PilotSoundPlayer: class {
  play = sound.play; stop = sound.stop; dispose = sound.dispose;
} }));
vi.mock('../apps/game/src/pilot-assets.js', async (importOriginal) => ({
  ...await importOriginal<typeof import('../apps/game/src/pilot-assets.js')>(),
  PILOT_VISTA_LAYERS: Object.freeze(['/test/landscape.webp', '/test/residents.webp']),
}));

const starter = shipVisualStateOf({ items: [], ascCh: 0, liverySeed: 0x5111 });
const origin: PilotSceneSnapshot = { mode: 'system', routeKey: 'sol', biomeKey: null, vistaReady: false,
  vistaBinding: null, ship: starter, motion: true, effects: true };
const earth: PilotSceneSnapshot = { ...origin, mode: 'surface', routeKey: 'earth', biomeKey: 'temperate',
  vistaReady: true, vistaBinding: PILOT_EARTH_VISTA_BINDING };

function setup(initial: PilotSceneSnapshot = origin) {
  const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  const document = dom.window.document;
  vi.spyOn(dom.window.performance, 'now').mockImplementation(() => Date.now());
  const tickets: Array<{ accept: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> }> = [];
  const armNativePilotLandingGesture = vi.fn((destination: string) => {
    sound.trace.push('arm:' + destination);
    const ticket = { accept: vi.fn(() => { sound.trace.push('accept'); return true; }), cancel: vi.fn() };
    tickets.push(ticket); return ticket;
  });
  const audio = { armNativePilotLandingGesture, armNativePilotGesture: vi.fn(() => true) } as unknown as TameGreetingAudioOwner;
  // Invoke the actual installed listener with a controlled trusted input. DOM
  // .click() remains untrusted and cannot enable the production audio path.
  const prototype = (dom.window as unknown as { EventTarget: typeof EventTarget }).EventTarget.prototype;
  const add = prototype.addEventListener;
  let listen: ((event: MouseEvent) => Promise<void>) | null = null;
  prototype.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
    if (type === 'click' && (this as unknown as HTMLElement).textContent === 'Play pilot sound') {
      if (typeof listener !== 'function') throw new Error('Expected native Play function listener');
      listen = async event => { await listener.call(this, event); };
    }
    add.call(this, type, listener, options);
  };
  const pilot = mountAudiovisualPilot({ document, initial, audio });
  prototype.addEventListener = add;
  const landscape = [...document.querySelectorAll<HTMLImageElement>('[data-cf-pilot-scene] .p-vista img')];
  const ship = () => document.querySelector<HTMLImageElement>('[data-cf-pilot-ship="landing"]');
  const load = (image: HTMLImageElement, type = 'load', width = 512, height = 256) => {
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: width });
    Object.defineProperty(image, 'naturalHeight', { configurable: true, value: height });
    const event = document.createEvent('Event'); event.initEvent(type, false, false); image.dispatchEvent(event);
  };
  const close = () => { pilot.dispose(); dom.window.close(); };
  return { document, dom, pilot, landscape, ship, load, close, tickets, armNativePilotLandingGesture,
    enableSound: async () => { expect(listen).not.toBeNull(); await listen!({ isTrusted: true } as MouseEvent); sound.trace.length = 0; sound.play.mockClear(); },
    ready: () => { landscape.forEach(image => load(image)); const current = ship(); if (current) load(current); },
    hide: () => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      const event = document.createEvent('Event'); event.initEvent('visibilitychange', false, false); document.dispatchEvent(event);
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers(); sound.play.mockReset().mockResolvedValue(true); sound.stop.mockReset(); sound.dispose.mockReset();
  sound.trace.length = 0; sound.stop.mockImplementation(() => { sound.trace.push('stop'); });
});
afterEach(() => { vi.useRealTimers(); });

describe('actual Earth landing presentation', () => {
  it('owns one native landing, preserves its pre-armed ticket across arrival, and plays once only after exact finish and ready images', async () => {
    const s = setup();
    try {
      await s.enableSound();
      const request = s.pilot.beginLanding('earth', true)!;
      expect(sound.trace).toEqual(['stop', 'arm:earth']);
      expect(s.ship()?.getAttribute('src')).toBe(PILOT_SHIP_IMAGES[512]); expect(s.ship()?.hidden).toBe(true);
      s.ready(); expect(s.ship()?.hidden).toBe(true); expect(s.tickets[0]!.accept).not.toHaveBeenCalled();
      s.pilot.sync(earth); expect(sound.trace).toEqual(['stop', 'arm:earth']); expect(s.ship()?.hidden).toBe(true);
      request.finish(earth);
      expect(s.ship()?.hidden).toBe(false); expect(s.ship()?.dataset.motion).toBe('animated');
      expect(s.tickets[0]!.accept).toHaveBeenCalledOnce();
      expect(sound.play).toHaveBeenCalledExactlyOnceWith('cf-pilot-scout-landing', { mono: false, reducedIntensity: true });
      request.finish(earth); s.pilot.sync(earth); s.ready(); expect(sound.play).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(1799); expect(s.ship()).not.toBeNull();
      vi.advanceTimersByTime(1); expect(s.ship()).toBeNull(); expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce();
      expect(sound.trace.at(-1)).toBe('stop'); expect(vi.getTimerCount()).toBe(0);
    } finally { s.close(); }
  });

  it('cannot show success while awaiting canonical publication or any landscape/ship image, then admits exactly once', async () => {
    const s = setup();
    try {
      await s.enableSound(); const request = s.pilot.beginLanding('earth', true)!;
      s.pilot.sync({ ...earth, vistaReady: false }); s.load(s.landscape[0]!);
      expect(s.ship()?.hidden).toBe(true); expect(s.tickets[0]!.accept).not.toHaveBeenCalled();
      s.pilot.sync(earth); request.finish(earth);
      s.load(s.ship()!); expect(s.ship()?.hidden).toBe(true);
      s.load(s.landscape[1]!); expect(s.ship()?.hidden).toBe(false); expect(sound.play).toHaveBeenCalledTimes(1);
    } finally { s.close(); }
  });

  it.each(['close', 'replace'] as const)('keeps phone arrival visible in the current Survey header and cancels on %s', async (change) => {
    const s = setup();
    try {
      Object.defineProperty(s.dom.window, 'innerWidth', { configurable: true, value: 390 });
      s.pilot.sync(origin); // Select the phone composition before owning Land.
      s.document.body.insertAdjacentHTML('beforeend', '<aside id="survey" aria-hidden="false"><div class="survey-head"><h2>Earth</h2><button data-survey-close>Close</button></div><button data-act="leaveworld">Leave world</button></aside>');
      const survey = s.document.getElementById('survey')!, header = survey.querySelector('.survey-head')!;
      await s.enableSound(); const request = s.pilot.beginLanding('earth', true)!;
      s.pilot.sync(earth); request.finish(earth); s.ready();
      const ship = s.ship()!;
      expect(ship.dataset.placement).toBe('survey-header'); expect(header.contains(ship)).toBe(true);
      expect(ship.nextElementSibling?.hasAttribute('data-survey-close')).toBe(true);
      expect(ship.hidden).toBe(false); expect(sound.play).toHaveBeenCalledOnce();
      if (change === 'close') survey.setAttribute('aria-hidden', 'true');
      else header.replaceChildren(s.document.createElement('h2'));
      await Promise.resolve();
      expect(s.ship()).toBeNull(); expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce();
      expect(s.document.querySelector('[data-act="leaveworld"]')).not.toBeNull();
    } finally { s.close(); }
  });

  it.each(['ready', 'wrong-world', 'cancel'] as const)('settles the durable route before its asynchronous vista is %s', async (outcome) => {
    const s = setup();
    try {
      await s.enableSound(); const request = s.pilot.beginLanding('earth', true)!;
      const pending = { ...earth, biomeKey: null, vistaReady: false, vistaBinding: null };
      s.pilot.sync(pending); request.finish(pending); s.ready();
      expect(s.ship()?.hidden).toBe(true); expect(sound.play).not.toHaveBeenCalled();
      if (outcome === 'cancel') request.cancel();
      s.pilot.sync(outcome === 'wrong-world' ? { ...earth, routeKey: 'mars' } : earth);
      if (outcome === 'ready') {
        expect(s.ship()?.hidden).toBe(false); expect(sound.play).toHaveBeenCalledOnce();
      } else {
        expect(s.ship()).toBeNull(); expect(sound.play).not.toHaveBeenCalled();
      }
    } finally { s.close(); }
  });

  it('expires deferred assets without extending the original admission deadline or reviving on late loads', () => {
    const s = setup();
    try {
      const request = s.pilot.beginLanding('earth', true)!, staleShip = s.ship()!;
      vi.advanceTimersByTime(9999); s.pilot.sync(earth); request.finish(earth);
      vi.advanceTimersByTime(1); expect(s.ship()).toBeNull();
      s.load(staleShip); s.landscape.forEach(image => s.load(image)); request.finish(earth);
      expect(s.ship()).toBeNull(); expect(sound.play).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
    } finally { s.close(); }
  });

  it('rejects a load at the exact admission deadline even if the native timeout callback has not run yet', () => {
    const s = setup();
    try {
      const request = s.pilot.beginLanding('earth', true)!;
      s.pilot.sync(earth); request.finish(earth);
      vi.setSystemTime(Date.now() + 10_000); s.ready();
      expect(s.ship()).toBeNull(); expect(sound.play).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
    } finally { s.close(); }
  });

  it.each(['untrusted', 'wrong-mode', 'effects-off', 'wrong-ship', 'hidden', 'look-off', 'empty-route'])('rejects %s before any landing timer or audio ticket', (fault) => {
    const s = setup();
    try {
      if (fault === 'wrong-mode') s.pilot.sync(earth);
      if (fault === 'effects-off') s.pilot.sync({ ...origin, effects: false });
      if (fault === 'wrong-ship') s.pilot.sync({ ...origin, ship: { ...starter, chassisStage: 1 } });
      if (fault === 'hidden') s.hide();
      if (fault === 'look-off') s.document.querySelector<HTMLButtonElement>('[aria-pressed]')!.click();
      expect(s.pilot.beginLanding(fault === 'empty-route' ? '' : 'earth', fault !== 'untrusted')).toBeNull();
      expect(s.ship()).toBeNull(); expect(s.armNativePilotLandingGesture).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
    } finally { s.close(); }
  });

  it.each(['failed', 'cancel', 'wrong-route', 'wrong-binding', 'wave-off', 'ship-error', 'landscape-error'])('cancels %s and rejects every retained completion', async (fault) => {
    const s = setup();
    try {
      await s.enableSound(); const request = s.pilot.beginLanding('earth', true)!, staleShip = s.ship()!;
      if (fault === 'failed' || fault === 'wave-off') request.finish(null);
      if (fault === 'cancel') request.cancel();
      if (fault === 'wrong-route') s.pilot.sync({ ...earth, routeKey: 'mars' });
      if (fault === 'wrong-binding') s.pilot.sync({ ...earth, vistaBinding: 'different-roster' });
      if (fault === 'ship-error') s.load(staleShip, 'error');
      if (fault === 'landscape-error') s.load(s.landscape[0]!, 'error');
      s.pilot.sync(earth); request.finish(earth); s.load(staleShip); s.ready(); vi.runAllTimers();
      expect(s.ship()).toBeNull(); expect(sound.play).not.toHaveBeenCalled();
      expect(s.tickets[0]!.accept).not.toHaveBeenCalled(); expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
    } finally { s.close(); }
  });

  it('generation replacement prevents the previous finish, cancel and image load from affecting the successor', async () => {
    const s = setup();
    try {
      await s.enableSound(); const first = s.pilot.beginLanding('earth', true)!, oldShip = s.ship()!;
      const second = s.pilot.beginLanding('earth', true)!, newShip = s.ship()!;
      expect(oldShip).not.toBe(newShip); expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce();
      first.cancel(); first.finish(earth); s.load(oldShip);
      expect(s.ship()).toBe(newShip); expect(s.tickets[1]!.cancel).not.toHaveBeenCalled();
      s.pilot.sync(earth); second.finish(earth); s.ready();
      expect(s.tickets[0]!.accept).not.toHaveBeenCalled(); expect(s.tickets[1]!.accept).toHaveBeenCalledOnce(); expect(sound.play).toHaveBeenCalledOnce();
    } finally { s.close(); }
  });

  it('uses an immediate static settled image under reduced motion and removes it at the same finite lifetime', () => {
    const s = setup({ ...origin, motion: false });
    try {
      const request = s.pilot.beginLanding('earth', true)!; s.pilot.sync({ ...earth, motion: false });
      request.finish({ ...earth, motion: false }); s.ready();
      expect(s.ship()?.hidden).toBe(false); expect(s.ship()?.dataset.motion).toBe('static');
      expect(s.dom.window.getComputedStyle(s.ship()!).animation).toBe('none');
      expect(s.armNativePilotLandingGesture).not.toHaveBeenCalled(); expect(sound.play).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1800); expect(s.ship()).toBeNull(); expect(vi.getTimerCount()).toBe(0);
    } finally { s.close(); }
  });

  it.each(['hide', 'effects-off', 'look-off', 'resize', 'dispose', 'stop-sound'])('releases an admitted reveal and its playback when %s invalidates ownership', async (fault) => {
    const s = setup();
    try {
      await s.enableSound(); const request = s.pilot.beginLanding('earth', true)!;
      s.pilot.sync(earth); request.finish(earth); s.ready(); const staleShip = s.ship()!;
      expect(staleShip.hidden).toBe(false); expect(sound.play).toHaveBeenCalledOnce();
      if (fault === 'hide') s.hide();
      if (fault === 'effects-off') s.pilot.sync({ ...earth, effects: false });
      if (fault === 'look-off') s.document.querySelector<HTMLButtonElement>('[aria-pressed]')!.click();
      if (fault === 'dispose') s.pilot.dispose();
      if (fault === 'stop-sound') [...s.document.querySelectorAll('button')].find(button => button.textContent === 'Stop sound')!.click();
      if (fault === 'resize') {
        Object.defineProperty(s.dom.window, 'innerWidth', { configurable: true, value: 390 });
        const event = s.document.createEvent('Event'); event.initEvent('resize', false, false); s.dom.window.dispatchEvent(event);
      }
      expect(s.ship()).toBeNull(); expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
      expect(fault === 'dispose' ? sound.dispose : sound.stop).toHaveBeenCalled();
      request.finish(earth); s.load(staleShip); vi.runAllTimers(); expect(sound.play).toHaveBeenCalledTimes(1);
    } finally { s.close(); }
  });

  it('keeps a refused audio ticket silent while presenting a valid visual once', async () => {
    const s = setup();
    try {
      await s.enableSound(); const request = s.pilot.beginLanding('earth', true)!;
      s.tickets[0]!.accept.mockReturnValue(false); s.pilot.sync(earth); request.finish(earth); s.ready();
      expect(s.ship()?.hidden).toBe(false); expect(s.tickets[0]!.accept).toHaveBeenCalledOnce(); expect(sound.play).not.toHaveBeenCalled();
    } finally { s.close(); }
  });
});
