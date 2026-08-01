/* @cf/audio — the game's shipped UI stings over a typed seam.

   The verbatim bodies read `ac`, `sndOn`, `sfxVol` as app globals (exactly
   as they do in main.js, where the audio section owns those flags). initAudio
   installs the seam: a gesture-safe AudioContext factory mirroring the game's
   ac() (lazy create, resume-on-suspended, gated by sndOn), and live getters
   for the two save-backed settings.

   ⚠ SCOPE: navigation/survey stings ONLY. The §15 audio plan (533-voice
   creature synthesis, ambience, the capped mixer — D-AUDIO-CAP) is gated
   behind the human listening test and deliberately absent here. */
export { playRaritySting, playSurveyPing, playWhoosh, applySfxGain } from './stings.verbatim.js';
import { applySfxGain } from './stings.verbatim.js';

let AC: AudioContext | null = null;
let getSndOn: () => boolean = () => true;
let getSfxVol: () => number = () => 1;

/** the game's ac() (main.js ~13556): null when sound is off, lazy-created,
    resumed when the browser suspended it before the first gesture */
function ac(): AudioContext | null {
  if (!getSndOn()) return null;
  if (!AC) { try { AC = new AudioContext(); } catch { return null; } }
  if (AC && AC.state === 'suspended') { AC.resume().catch(() => { /* pre-gesture */ }); }
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
  applySfxGain();
}
