import type { TameGreetingAudioOwner } from './tame-greeting-audio.js';
import { PILOT_PCM_FILE_LIMIT, parsePilotPcm, pilotPcmVoice, type PilotPcm } from './pilot-pcm.js';
import { PILOT_CUES } from './pilot-assets.js';

/** Two 24s stereo cues plus the six authored mono cues at 48kHz Float32. */
export const PILOT_PCM_CACHE_LIMIT = 19_503_360;

async function readPilotBytes(response: Response, signal: AbortSignal): Promise<ArrayBuffer> {
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/u.test(declared) || Number(declared) > PILOT_PCM_FILE_LIMIT)) {
    void response.body?.cancel().catch(() => {});
    throw new RangeError('Pilot PCM byte limit');
  }
  if (!response.body) throw new Error('Pilot audio has no body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let complete = false;
  try {
    for (;;) {
      signal.throwIfAborted();
      const next = await reader.read();
      signal.throwIfAborted();
      if (next.done) { complete = true; break; }
      size += next.value.byteLength;
      if (size > PILOT_PCM_FILE_LIMIT) throw new RangeError('Pilot PCM byte limit');
      chunks.push(next.value);
    }
  } finally {
    if (!complete) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes.buffer;
}

/** Per-surface decoded data owner, with no AudioContext or mixer of its own.
 * At most two long cues and six tiny cues; all fetches abort at invalidation. */
export class PilotSoundPlayer {
  private generation = 0;
  private readonly cache = new Map<string, PilotPcm>();
  private readonly pending = new Map<string, Promise<PilotPcm>>();
  private abort = new AbortController();
  private disposed = false;
  constructor(private readonly owner: TameGreetingAudioOwner) {}

  async play(id: string, options: Readonly<{ mono: boolean; reducedIntensity: boolean }>): Promise<boolean> {
    const cue = PILOT_CUES.find((entry) => entry.id === id);
    if (!cue || this.disposed) return false;
    const generation = this.generation;
    try {
      let pcm = this.cache.get(id);
      if (!pcm) {
        let promise = this.pending.get(id);
        if (!promise) {
          const signal = this.abort.signal;
          promise = (async () => {
            const response = await fetch(cue.url, { signal, credentials: 'omit' });
            if (!response.ok) throw new Error('Pilot audio is unavailable');
            const bytes = await readPilotBytes(response, signal);
            if (signal.aborted || this.disposed || generation !== this.generation) throw new Error('Pilot audio was cancelled');
            const data = parsePilotPcm(bytes, PILOT_PCM_CACHE_LIMIT - this.diagnostics().decodedBytes);
            if (data.durationMs !== cue.durationMs) throw new Error('Pilot duration does not match its content identity');
            this.cache.set(id, data);
            return data;
          })();
          this.pending.set(id, promise);
        }
        try { pcm = await promise; } finally { if (generation === this.generation) this.pending.delete(id); }
        if (this.disposed || generation !== this.generation) return false;
      }
      if (this.disposed || generation !== this.generation) return false;
      const result = await this.owner.playPilotVoice(pilotPcmVoice(id, cue.category, pcm, { ...options, gain: cue.gain }));
      return generation === this.generation && result.kind === 'started';
    } catch { return false; }
  }

  stop(): void {
    this.generation++;
    this.abort.abort(); this.abort = new AbortController(); this.pending.clear();
    this.owner.cancelPilotPlayback();
  }
  diagnostics(): Readonly<{ entries: number; decodedBytes: number; pending: number }> {
    let bytes = 0;
    for (const pcm of this.cache.values()) bytes += pcm.decodedBytes;
    return { entries: this.cache.size, decodedBytes: bytes, pending: this.pending.size };
  }
  dispose(): void { this.stop(); this.disposed = true; this.cache.clear(); }
}
