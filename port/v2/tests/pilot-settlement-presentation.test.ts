import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
const { JSDOM } = createRequire(import.meta.url)('jsdom') as {
  JSDOM: new (html: string, options: unknown) => { window: Window };
};
import { shipVisualStateOf } from '@cf/scene';
import { mountAudiovisualPilot, type PilotSceneSnapshot } from '../apps/game/src/audiovisual-pilot.js';
import type { TameGreetingAudioOwner } from '../apps/game/src/tame-greeting-audio.js';

const sound = vi.hoisted(() => ({ play: vi.fn(async () => true), stop: vi.fn(), dispose: vi.fn(), trace: [] as string[] }));
vi.mock('../apps/game/src/pilot-sound-player.js', () => ({ PilotSoundPlayer: class {
  play = sound.play; stop = sound.stop; dispose = sound.dispose;
} }));
const initial: PilotSceneSnapshot = { mode: 'system', routeKey: 'cf-system-sol', biomeKey: null,
  vistaReady: false, ship: shipVisualStateOf({ items: [], ascCh: 0, liverySeed: 0x5111 }), motion: true, effects: true };

function setup() {
  const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  const document = dom.window.document;
  vi.spyOn(dom.window.performance, 'now').mockImplementation(() => Date.now());
  const tickets: Array<{ accept: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> }> = [];
  const arm = vi.fn(() => {
    sound.trace.push('arm');
    const ticket = { accept: vi.fn(() => true), cancel: vi.fn() };
    tickets.push(ticket); return ticket;
  });
  const ordinaryArm = vi.fn(() => true);
  const audio = { armNativePilotSettlementGesture: arm, armNativePilotGesture: ordinaryArm,
    armNativePilotLandingGesture: vi.fn(() => null) } as unknown as TameGreetingAudioOwner;
  // Capture the installed native listener, then call it with a controlled
  // trusted event. Programmatic DOM clicks themselves remain untrusted.
  const prototype = (dom.window as unknown as { EventTarget: typeof EventTarget }).EventTarget.prototype;
  const add = prototype.addEventListener;
  let listen: ((event: MouseEvent) => Promise<void>) | null = null;
  prototype.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
    if (type === 'click' && (this as unknown as HTMLElement).textContent === 'Play pilot sound') {
      if (typeof listener !== 'function') throw new Error('Expected native Play listener');
      listen = async event => { await listener.call(this, event); };
    }
    add.call(this, type, listener, options);
  };
  const pilot = mountAudiovisualPilot({ document, initial, audio });
  prototype.addEventListener = add;
  const click = (label: string) => [...document.querySelectorAll('button')].find(button => button.textContent === label)!.click();
  const enable = async () => {
    expect(listen).not.toBeNull(); await listen!({ isTrusted: true } as MouseEvent);
    sound.trace.length = 0; sound.play.mockClear(); ordinaryArm.mockClear();
  };
  return { pilot, document, dom, tickets, arm, ordinaryArm, click, enable,
    hide: () => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      const event = document.createEvent('Event'); event.initEvent('visibilitychange', false, false); document.dispatchEvent(event);
    },
    close: () => { pilot.dispose(); dom.window.close(); },
  };
}

beforeEach(() => {
  vi.useFakeTimers(); sound.play.mockReset().mockResolvedValue(true); sound.stop.mockReset(); sound.dispose.mockReset();
  sound.trace.length = 0; sound.stop.mockImplementation(() => { sound.trace.push('stop'); });
});
afterEach(() => { vi.useRealTimers(); });

describe('native Charter settlement presentation ownership', () => {
  it('captures during the native gesture and plays one 700 ms cue only after delayed successful publication', async () => {
    const s = setup();
    try {
      await s.enable(); const presentation = s.pilot.beginSettlement(true)!;
      expect(Object.isFrozen(presentation)).toBe(true); expect(sound.trace).toEqual(['stop', 'arm']);
      expect(s.tickets[0]!.accept).not.toHaveBeenCalled(); expect(sound.play).not.toHaveBeenCalled();
      vi.advanceTimersByTime(4000); s.pilot.sync(initial); presentation.finish(true); presentation.finish(true);
      expect(s.tickets[0]!.accept).toHaveBeenCalledOnce(); expect(s.ordinaryArm).not.toHaveBeenCalled();
      expect(sound.play).toHaveBeenCalledExactlyOnceWith('cf-pilot-ui-settlement', { mono: false, reducedIntensity: true });
      await Promise.resolve(); vi.advanceTimersByTime(699); expect(s.tickets[0]!.cancel).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1); expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
      presentation.cancel(); presentation.finish(true); expect(sound.play).toHaveBeenCalledOnce();
    } finally { s.close(); }
  });

  it('admits immediate success without requiring an Earth vista, Scout load or animation', async () => {
    const s = setup();
    try {
      await s.enable(); s.pilot.sync({ ...initial, mode: 'galaxy', motion: false });
      s.pilot.beginSettlement(true)!.finish(true); await Promise.resolve();
      expect(sound.play).toHaveBeenCalledOnce(); expect(s.document.querySelector('[data-cf-pilot-ship]')).toBeNull();
      vi.advanceTimersByTime(700); expect(vi.getTimerCount()).toBe(0);
    } finally { s.close(); }
  });

  it.each(['not-opted-in', 'untrusted', 'effects-off', 'look-off', 'hidden', 'empty-route', 'long-route', 'disposed'] as const)(
    'refuses %s before arming or creating a timer', async fault => {
      const s = setup();
      try {
        if (fault !== 'not-opted-in') await s.enable(); else s.click('Play pilot sound');
        if (fault === 'effects-off') s.pilot.sync({ ...initial, effects: false });
        if (fault === 'look-off') s.click('Show current look');
        if (fault === 'hidden') s.hide();
        if (fault === 'empty-route') s.pilot.sync({ ...initial, routeKey: '' });
        if (fault === 'long-route') s.pilot.sync({ ...initial, routeKey: 'x'.repeat(513) });
        if (fault === 'disposed') s.pilot.dispose();
        expect(s.pilot.beginSettlement(fault !== 'untrusted')).toBeNull();
        expect(s.arm).not.toHaveBeenCalled(); expect(sound.play).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
      } finally { s.close(); }
    });

  it.each(['refused', 'cancel', 'route', 'hide', 'effects-off', 'look-off', 'stop', 'dispose'] as const)(
    'invalidates a pending or active cue on %s and ignores retained completion', async fault => {
      for (const admitted of [false, true]) {
        const s = setup();
        try {
          await s.enable(); const presentation = s.pilot.beginSettlement(true)!;
          if (admitted) { presentation.finish(true); await Promise.resolve(); }
          if (fault === 'refused') { if (admitted) presentation.cancel(); else presentation.finish(false); }
          if (fault === 'cancel') presentation.cancel();
          if (fault === 'route') { s.pilot.sync({ ...initial, routeKey: 'cf-other' }); s.pilot.sync(initial); }
          if (fault === 'hide') s.hide();
          if (fault === 'effects-off') { s.pilot.sync({ ...initial, effects: false }); s.pilot.sync(initial); }
          if (fault === 'look-off') { s.click('Show current look'); s.click('Show pilot look'); }
          if (fault === 'stop') s.click('Stop sound');
          if (fault === 'dispose') s.pilot.dispose();
          presentation.finish(true); presentation.cancel(); vi.runAllTimers();
          expect(sound.play).toHaveBeenCalledTimes(admitted ? 1 : 0);
          expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
        } finally { s.close(); sound.play.mockClear(); }
      }
    });

  it('expires pending success at ten seconds even if the native timeout has not fired', async () => {
    const s = setup();
    try {
      await s.enable(); const presentation = s.pilot.beginSettlement(true)!;
      vi.setSystemTime(Date.now() + 10_000); presentation.finish(true);
      expect(sound.play).not.toHaveBeenCalled(); expect(s.tickets[0]!.accept).not.toHaveBeenCalled();
      expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
    } finally { s.close(); }
  });

  it('bounds deferred decode/activation by the original deadline and cannot revive a late source result', async () => {
    const s = setup();
    try {
      await s.enable(); let release!: (started: boolean) => void;
      sound.play.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
      const presentation = s.pilot.beginSettlement(true)!;
      vi.advanceTimersByTime(9900); presentation.finish(true); vi.advanceTimersByTime(100);
      expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
      release(true); await Promise.resolve(); presentation.finish(true); expect(vi.getTimerCount()).toBe(0);
      expect(sound.play).toHaveBeenCalledOnce();
    } finally { s.close(); }
  });

  it('keeps replacement settlement ownership safe from stale completion, cancellation and decode', async () => {
    const s = setup();
    try {
      await s.enable(); let release!: (started: boolean) => void;
      sound.play.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
      const old = s.pilot.beginSettlement(true)!; old.finish(true);
      const current = s.pilot.beginSettlement(true)!;
      old.cancel(); old.finish(true); release(true); await Promise.resolve();
      expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce(); expect(s.tickets[1]!.cancel).not.toHaveBeenCalled();
      current.finish(true); await Promise.resolve(); expect(sound.play).toHaveBeenCalledTimes(2);
      vi.advanceTimersByTime(700); expect(s.tickets[1]!.cancel).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
    } finally { s.close(); }
  });

  it.each(['Play', 'Land'] as const)('retires settlement ownership before a newer %s gesture', async gesture => {
    const s = setup();
    try {
      await s.enable(); const old = s.pilot.beginSettlement(true)!;
      if (gesture === 'Play') await s.enable(); else s.pilot.beginLanding('cf-earth', true);
      expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce();
      const stops = sound.stop.mock.calls.length; old.cancel(); old.finish(true);
      expect(sound.stop).toHaveBeenCalledTimes(stops); expect(sound.play).not.toHaveBeenCalled();
    } finally { s.close(); }
  });

  it.each(['arm', 'accept', 'play'] as const)('stays silent and clears timers when %s is refused', async phase => {
    const s = setup();
    try {
      await s.enable();
      if (phase === 'arm') s.arm.mockReturnValueOnce(null as unknown as ReturnType<typeof s.arm>);
      const presentation = s.pilot.beginSettlement(true);
      if (phase === 'arm') expect(presentation).toBeNull();
      else {
        if (phase === 'accept') s.tickets[0]!.accept.mockReturnValueOnce(false);
        if (phase === 'play') sound.play.mockResolvedValueOnce(false);
        presentation!.finish(true); await Promise.resolve();
        expect(s.tickets[0]!.cancel).toHaveBeenCalledOnce();
      }
      expect(sound.play).toHaveBeenCalledTimes(phase === 'play' ? 1 : 0); expect(vi.getTimerCount()).toBe(0);
    } finally { s.close(); }
  });
});
