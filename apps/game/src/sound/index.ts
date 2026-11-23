/* The two shipped stings: the whoosh of travel and the ping of a survey. This is the only place that calls the
   audio package for them, so no whoosh can be played without its noise source. */
import { applySfxGain, initAudio, playSurveyPing, playWhoosh, prepareStingAudioForGesture } from '@cf/audio';
import type { SaveStateV2 } from '@cf/persistence';

export {
  AUDIO_ACCESSIBILITY_OFF, AUDIO_ACCESSIBILITY_PREFERENCE, readAudioAccessibilityPrefs, writeAudioAccessibilityPrefs,
} from './prefs';
export type { AudioAccessibilityModes } from '@cf/audio';

/** The events that can be a gesture the browser counts as the player's own, after which sound may start. */
export const GESTURE_EVENTS = ['pointerup', 'click', 'keydown'] as const;
const NOT_COUNTED_KEYS: readonly string[] = ['Escape', 'Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock', 'Fn'];
/** True for a lifted pointer, a click, and a key pressed that is neither Escape nor a modifier alone: a press, a
 *  wheel and those keys are not counted, and sound started on them is refused with a warning. */
export function countsAsGesture(event: { type: string; key?: string }): boolean {
  if (event.type === 'keydown') return event.key !== undefined && !NOT_COUNTED_KEYS.includes(event.key);
  return event.type === 'pointerup' || event.type === 'click';
}

export interface ShellSound {
  /** Call inside a gesture the browser counts: readies sound so a sting can play. Makes no sound. Until it has
   *  been called no sting sounds and no sound device is started. */
  unlock(): void;
  whoosh(): void;
  ping(): void;
  /** Call after Sound or Volume changes. */
  applyVolume(): void;
}

/** `random` gives the whoosh its noise: presentation only, never a gameplay source. */
export function createShellSound(deps: {
  settings(): Pick<SaveStateV2, 'sndOn' | 'sfxVol'>;
  random: () => number;
}): ShellSound {
  initAudio({ sndOn: () => deps.settings().sndOn, sfxVol: () => deps.settings().sfxVol });
  let ready = false;
  return {
    unlock: () => { ready = true; prepareStingAudioForGesture(); },
    whoosh: () => { if (ready) playWhoosh(deps.random); },
    ping: () => { if (ready) playSurveyPing(); },
    applyVolume: () => { if (ready) applySfxGain(); },
  };
}
