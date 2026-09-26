/* Audio accessibility preferences (Arc 7/8 close-out, 2026-09-25): Mono audio and Reduced intensity.
   These describe the LISTENER'S DEVICE (one earbud, a phone speaker, sensitivity to loud or sudden sound), not the expedition, so they
   live in this device's storage and never in the save: no save-shape change, no migration, no v5 settings segment, and a shared or
   imported save never changes how another device sounds. Storage can be absent or throw (private mode, blocked site data), so every
   read and write is guarded and the modes fall back to off. */
import type { AudioAccessibilityModes } from '@cf/audio';

export const AUDIO_ACCESSIBILITY_PREFS_KEY = 'cf-v2-audio-accessibility/v1';
export const AUDIO_ACCESSIBILITY_OFF: AudioAccessibilityModes = Object.freeze({ mono: false, reducedIntensity: false });

export interface AudioAccessibilityStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Only an exact `{ mono: boolean, reducedIntensity: boolean }` record is honoured; anything else reads as off. */
export function readAudioAccessibilityPrefsV1(storage: AudioAccessibilityStorage | null | undefined): AudioAccessibilityModes {
  try {
    const raw = storage?.getItem(AUDIO_ACCESSIBILITY_PREFS_KEY);
    if (typeof raw !== 'string' || raw.length > 256) return AUDIO_ACCESSIBILITY_OFF;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return AUDIO_ACCESSIBILITY_OFF;
    const { mono, reducedIntensity } = value as Record<string, unknown>;
    return Object.freeze({ mono: mono === true, reducedIntensity: reducedIntensity === true });
  } catch {
    return AUDIO_ACCESSIBILITY_OFF;
  }
}

/** Returns whether the device kept the choice; the live mix follows the choice either way for this session. */
export function writeAudioAccessibilityPrefsV1(
  storage: AudioAccessibilityStorage | null | undefined,
  modes: AudioAccessibilityModes,
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(AUDIO_ACCESSIBILITY_PREFS_KEY, JSON.stringify({ mono: modes.mono === true, reducedIntensity: modes.reducedIntensity === true }));
    return true;
  } catch {
    return false;
  }
}

/** The device's storage, or null when the accessor itself throws. */
export function deviceAudioAccessibilityStorage(): AudioAccessibilityStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
