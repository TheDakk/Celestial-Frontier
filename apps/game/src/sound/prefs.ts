/* Mono audio and Reduced intensity describe the listener's device (one earbud, a phone speaker, a dislike of
   sudden loud sound), not the expedition. They are kept on the device and never in the save, so a restored
   save never changes how another device sounds. */
import type { AudioAccessibilityModes } from '@cf/audio';
import type { DevicePreferences } from '../platform/preferences';

/** The name of the device preference; it is stored under the game's prefix. */
export const AUDIO_ACCESSIBILITY_PREFERENCE = 'audio-accessibility/v1';
export const AUDIO_ACCESSIBILITY_OFF: AudioAccessibilityModes = Object.freeze({ mono: false, reducedIntensity: false });

/** Only an exact `{ mono: boolean, reducedIntensity: boolean }` record is honoured; anything else reads as off. */
export function readAudioAccessibilityPrefs(preferences: DevicePreferences): AudioAccessibilityModes {
  try {
    const raw = preferences.read(AUDIO_ACCESSIBILITY_PREFERENCE);
    if (raw === null || raw.length > 256) return AUDIO_ACCESSIBILITY_OFF;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return AUDIO_ACCESSIBILITY_OFF;
    const { mono, reducedIntensity } = value as Record<string, unknown>;
    return Object.freeze({ mono: mono === true, reducedIntensity: reducedIntensity === true });
  } catch {
    return AUDIO_ACCESSIBILITY_OFF;
  }
}

/** Whether the device kept the choice. */
export function writeAudioAccessibilityPrefs(preferences: DevicePreferences, modes: AudioAccessibilityModes): boolean {
  return preferences.write(AUDIO_ACCESSIBILITY_PREFERENCE,
    JSON.stringify({ mono: modes.mono === true, reducedIntensity: modes.reducedIntensity === true }));
}
