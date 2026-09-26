import { describe, expect, it } from 'vitest';
import {
  AUDIO_ACCESSIBILITY_OFF,
  AUDIO_ACCESSIBILITY_PREFS_KEY,
  readAudioAccessibilityPrefsV1,
  writeAudioAccessibilityPrefsV1,
  type AudioAccessibilityStorage,
} from '../apps/game/src/audio-accessibility-prefs.js';

function memory(): AudioAccessibilityStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); } };
}

describe('audio accessibility device preferences (never the save)', () => {
  it('round-trips both modes on this device', () => {
    const storage = memory();
    expect(writeAudioAccessibilityPrefsV1(storage, { mono: true, reducedIntensity: false })).toBe(true);
    expect(readAudioAccessibilityPrefsV1(storage)).toEqual({ mono: true, reducedIntensity: false });
    expect(JSON.parse(storage.data.get(AUDIO_ACCESSIBILITY_PREFS_KEY)!)).toEqual({ mono: true, reducedIntensity: false });
  });

  it('absent, malformed, oversized or non-boolean values read as off', () => {
    const storage = memory();
    expect(readAudioAccessibilityPrefsV1(storage)).toEqual(AUDIO_ACCESSIBILITY_OFF);
    for (const raw of ['{', '[true,true]', 'null', '"on"', JSON.stringify({ mono: 'yes', reducedIntensity: 1 }), 'x'.repeat(300)]) {
      storage.data.set(AUDIO_ACCESSIBILITY_PREFS_KEY, raw);
      expect(readAudioAccessibilityPrefsV1(storage), raw.slice(0, 20)).toEqual(AUDIO_ACCESSIBILITY_OFF);
    }
  });

  it('missing or throwing storage (private mode, blocked site data) is survivable in both directions', () => {
    const hostile: AudioAccessibilityStorage = {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('QuotaExceededError'); },
    };
    expect(readAudioAccessibilityPrefsV1(hostile)).toEqual(AUDIO_ACCESSIBILITY_OFF);
    expect(readAudioAccessibilityPrefsV1(null)).toEqual(AUDIO_ACCESSIBILITY_OFF);
    expect(writeAudioAccessibilityPrefsV1(hostile, { mono: true, reducedIntensity: true })).toBe(false);
    expect(writeAudioAccessibilityPrefsV1(null, { mono: true, reducedIntensity: true })).toBe(false);
  });
});
