/* The two shipped stings: the whoosh of travel and the ping of a survey. This is the only place that calls the
   audio package for them, so no whoosh can be played without its noise source. */
import { applySfxGain, initAudio, playSurveyPing, playWhoosh, prepareStingAudioForGesture } from '@cf/audio';
import type { SaveStateV2 } from '@cf/persistence';

export {
  AUDIO_ACCESSIBILITY_OFF, AUDIO_ACCESSIBILITY_PREFERENCE, readAudioAccessibilityPrefs, writeAudioAccessibilityPrefs,
} from './prefs';
export type { AudioAccessibilityModes } from '@cf/audio';

export interface ShellSound {
  /** Call inside a player gesture: readies sound so a later sting can play. Makes no sound. */
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
  return {
    unlock: () => prepareStingAudioForGesture(),
    whoosh: () => playWhoosh(deps.random),
    ping: () => playSurveyPing(),
    applyVolume: () => applySfxGain(),
  };
}
