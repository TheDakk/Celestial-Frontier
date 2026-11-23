import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { devicePreferences } from '../src/platform/preferences';
import {
  AUDIO_ACCESSIBILITY_OFF, AUDIO_ACCESSIBILITY_PREFERENCE, readAudioAccessibilityPrefs, writeAudioAccessibilityPrefs,
} from '../src/sound/prefs';

/** A sound device that records what was made on it: each context, each filled noise buffer, each started source. */
interface Heard { contexts: number; buffers: Float32Array[]; starts: number }
function fakeAudioContext(heard: Heard): unknown {
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const node = () => ({
    connect() {}, disconnect() {}, start() { heard.starts += 1; }, stop() {}, type: '', buffer: null,
    gain: param(), frequency: param(), Q: param(), detune: param(),
    threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(),
  });
  return class {
    state = 'running';
    currentTime = 0;
    sampleRate = 8000;
    destination = node();
    constructor() { heard.contexts += 1; }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
    createGain() { return node(); }
    createOscillator() { return node(); }
    createBiquadFilter() { return node(); }
    createDynamicsCompressor() { return node(); }
    createBufferSource() { return node(); }
    createBuffer(_channels: number, length: number) {
      const data = new Float32Array(length);
      heard.buffers.push(data);
      return { getChannelData: () => data };
    }
  };
}

const GLOBALS = ['AudioContext', 'webkitAudioContext', 'ac', 'sfxVol'] as const;
let saved: Array<PropertyDescriptor | undefined>;
beforeEach(() => {
  vi.resetModules();
  saved = GLOBALS.map((key) => Object.getOwnPropertyDescriptor(globalThis, key));
});
afterEach(() => {
  GLOBALS.forEach((key, i) => {
    if (saved[i] === undefined) Reflect.deleteProperty(globalThis, key);
    else Object.defineProperty(globalThis, key, saved[i]!);
  });
});

async function shell(settings: { sndOn: boolean; sfxVol: number }, heard: Heard | null) {
  if (heard !== null) Object.defineProperty(globalThis, 'AudioContext', { configurable: true, writable: true, value: fakeAudioContext(heard) });
  const { createShellSound } = await import('../src/sound/index');
  let draws = 0;
  // 0.75 becomes a sample of 0.5: a buffer of 0.5 can only have come from this source.
  const sound = createShellSound({ settings: () => settings, random: () => { draws += 1; return 0.75; } });
  return { sound, draws: () => draws };
}

describe('the two stings', () => {
  it('with Sound off a whoosh creates no sound; with it on the noise comes from the injected source and nothing throws', async () => {
    const heard: Heard = { contexts: 0, buffers: [], starts: 0 };
    const settings = { sndOn: false, sfxVol: 0.8 };
    const { sound, draws } = await shell(settings, heard);
    sound.unlock();
    sound.whoosh();
    sound.ping();
    expect([heard.contexts, heard.buffers.length, heard.starts, draws()]).toEqual([0, 0, 0, 0]);

    settings.sndOn = true;
    sound.applyVolume();
    sound.whoosh();
    expect(heard.contexts).toBe(1);
    expect(heard.buffers).toHaveLength(1);
    expect(draws()).toBe(heard.buffers[0]!.length);
    expect(draws()).toBeGreaterThan(1000);
    expect(heard.buffers[0]!.every((sample) => sample === 0.5)).toBe(true);
    expect(heard.starts).toBe(1);

    sound.ping();
    expect([heard.starts, heard.buffers.length, heard.contexts]).toEqual([2, 1, 1]);
  });

  it('on a device with no sound, every call is quiet and nothing throws', async () => {
    Reflect.deleteProperty(globalThis, 'AudioContext');
    Reflect.deleteProperty(globalThis, 'webkitAudioContext');
    const { sound, draws } = await shell({ sndOn: true, sfxVol: 1 }, null);
    expect(() => { sound.unlock(); sound.whoosh(); sound.ping(); sound.applyVolume(); }).not.toThrow();
    expect(draws()).toBe(0);
  });
});

describe('listening preferences of the device', () => {
  const memory = () => {
    const rows = new Map<string, string>();
    return { rows, preferences: devicePreferences({ getItem: (key) => rows.get(key) ?? null, setItem: (key, value) => { rows.set(key, value); } }) };
  };

  it('both modes are kept on the device under the game\'s own key', () => {
    const { rows, preferences } = memory();
    expect(writeAudioAccessibilityPrefs(preferences, { mono: true, reducedIntensity: false })).toBe(true);
    expect(readAudioAccessibilityPrefs(preferences)).toEqual({ mono: true, reducedIntensity: false });
    expect([...rows.keys()]).toEqual(['cf-v2-pixel/audio-accessibility/v1']);
    expect(JSON.parse(rows.get('cf-v2-pixel/audio-accessibility/v1')!)).toEqual({ mono: true, reducedIntensity: false });
  });

  it('an absent, malformed, oversized or non-boolean value reads as off', () => {
    const { rows, preferences } = memory();
    expect(readAudioAccessibilityPrefs(preferences)).toEqual(AUDIO_ACCESSIBILITY_OFF);
    for (const raw of ['{', '[true,true]', 'null', '"on"', JSON.stringify({ mono: 'yes', reducedIntensity: 1 }), 'x'.repeat(300)]) {
      rows.set(`cf-v2-pixel/${AUDIO_ACCESSIBILITY_PREFERENCE}`, raw);
      expect(readAudioAccessibilityPrefs(preferences), raw.slice(0, 20)).toEqual(AUDIO_ACCESSIBILITY_OFF);
    }
  });

  it('storage that is missing or throws is survived in both directions', () => {
    const hostile = devicePreferences({ getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceededError'); } });
    expect(readAudioAccessibilityPrefs(hostile)).toEqual(AUDIO_ACCESSIBILITY_OFF);
    expect(readAudioAccessibilityPrefs(devicePreferences(null))).toEqual(AUDIO_ACCESSIBILITY_OFF);
    expect(writeAudioAccessibilityPrefs(hostile, { mono: true, reducedIntensity: true })).toBe(false);
    expect(writeAudioAccessibilityPrefs(devicePreferences(null), { mono: true, reducedIntensity: true })).toBe(false);
  });
});
