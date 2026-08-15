/* @cf/audio — the game's shipped UI stings over a typed seam.

   The verbatim bodies read `ac` and `sfxVol` as app globals (exactly as they
   do in main.js, where the audio section owns the Sound/Volume flags). initAudio
   installs the seam: a lazy AudioContext factory (standard first, legacy
   WebKit fallback), resume-on-suspended, and live getters for the two
   save-backed settings. The public facade stays inert until that seam exists.

   ⚠ SCOPE: navigation/survey stings ONLY. The §15 audio plan (533-voice
   creature synthesis, ambience, the capped mixer — D-AUDIO-CAP) is gated
   behind the human listening test and deliberately absent here. */
import {
  playRaritySting as playRarityStingRaw,
  playSurveyPing as playSurveyPingRaw,
  playWhoosh as playWhooshRaw,
  applySfxGain as applySfxGainRaw,
} from './stings.verbatim.js';

let AC: AudioContext | null = null;
let getSndOn: () => boolean = () => true;
let getSfxVol: () => number = () => 1;
let initialized = false;

type AudioContextConstructor = new () => AudioContext;
type WebKitAudioGlobal = typeof globalThis & {
  webkitAudioContext?: AudioContextConstructor;
};

export function playRaritySting(tier: number): void {
  if (!initialized) return;
  playRarityStingRaw(tier);
}

export function playSurveyPing(): void {
  if (!initialized) return;
  playSurveyPingRaw();
}

export function playWhoosh(): void {
  if (!initialized) return;
  playWhooshRaw();
}

export function applySfxGain(): void {
  if (!initialized) return;
  applySfxGainRaw();
}

/** the game's ac() (main.js ~13556): null when sound is off, lazy-created,
    resumed when the browser suspended it before the first gesture */
function ac(): AudioContext | null {
  if (!getSndOn()) return null;
  if (!AC) {
    const audioGlobal = globalThis as WebKitAudioGlobal;
    const Context = audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;
    if (!Context) return null;
    try { AC = new Context(); } catch { return null; }
  }
  if (AC.state === 'suspended') {
    try { void AC.resume().catch(() => { /* pre-gesture */ }); } catch { /* refused synchronously */ }
  }
  return AC;
}

/** Install the seam. Call once at boot with save-backed getters; call
    applySfxGain() again whenever the volume setting changes. */
export function initAudio(opts: { sndOn: () => boolean; sfxVol: () => number }): void {
  getSndOn = opts.sndOn;
  getSfxVol = opts.sfxVol;
  const g = globalThis as Record<string, unknown>;
  g.ac = ac;
  /* the verbatim bodies read `sfxVol` free (applySfxGain's squared taper);
     `sndOn` gates through ac() above, so only the volume needs the global */
  Object.defineProperty(g, 'sfxVol', { get: getSfxVol, configurable: true });
  initialized = true;
  applySfxGainRaw();
}
