import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AudioVoiceRequest } from '@cf/audio';
import type { TameGreetingAudioOwner, TameGreetingPlayResult } from '../apps/game/src/tame-greeting-audio.js';
import { PILOT_CUES } from '../apps/game/src/pilot-assets.js';
import { PILOT_PCM_FILE_LIMIT } from '../apps/game/src/pilot-pcm.js';
import { PilotSoundPlayer, PILOT_PCM_CACHE_LIMIT } from '../apps/game/src/pilot-sound-player.js';

function wav(durationMs = 280, channels = 1): ArrayBuffer {
  const length = durationMs * 48 * channels * 2;
  const bytes = new ArrayBuffer(44 + length); const v = new DataView(bytes);
  const tag = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  tag(0, 'RIFF'); v.setUint32(4, bytes.byteLength - 8, true); tag(8, 'WAVE'); tag(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, channels, true);
  v.setUint32(24, 48000, true); v.setUint32(28, 48000 * channels * 2, true);
  v.setUint16(32, channels * 2, true); v.setUint16(34, 16, true); tag(36, 'data'); v.setUint32(40, length, true);
  return bytes;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; }); return { promise, resolve };
}
function harness() {
  const play = vi.fn<(request: AudioVoiceRequest) => Promise<TameGreetingPlayResult>>()
    .mockResolvedValue({ kind: 'started', voiceId: 'voice-fixture' });
  const cancel = vi.fn();
  const owner = { playPilotVoice: play, cancelPilotPlayback: cancel } as unknown as TameGreetingAudioOwner;
  return { player: new PilotSoundPlayer(owner), play, cancel };
}
const options = Object.freeze({ mono: false, reducedIntensity: false });
const navigation = 'cf-pilot-ui-nav';
afterEach(() => vi.unstubAllGlobals());

describe('bounded pilot source loading and shared-owner playback', () => {
  it('coalesces same-cue loads, recognizes started, and reuses only its decoded data', async () => {
    const response = deferred<Response>(); const fetcher = vi.fn().mockReturnValue(response.promise);
    vi.stubGlobal('fetch', fetcher); const h = harness();
    const first = h.player.play(navigation, options); const second = h.player.play(navigation, options);
    expect(fetcher).toHaveBeenCalledTimes(1); expect(h.player.diagnostics()).toEqual({ entries: 0, decodedBytes: 0, pending: 1 });
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe(PILOT_CUES.find((cue) => cue.id === navigation)!.url);
    expect(init.credentials).toBe('omit'); expect(init.signal).toBeInstanceOf(AbortSignal);
    response.resolve(new Response(wav()));
    await expect(first).resolves.toBe(true); await expect(second).resolves.toBe(true);
    expect(h.play).toHaveBeenCalledTimes(2);
    expect(h.play.mock.calls[0]![0]).toMatchObject({ key: navigation, category: 'ui', maxDurationMs: 380,
      meaning: { kind: 'decorative' }, nodeCount: 2 });
    expect(h.player.diagnostics()).toEqual({ entries: 1, decodedBytes: 53_760, pending: 0 });
    await expect(h.player.play(navigation, { mono: true, reducedIntensity: true })).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    h.player.dispose(); expect(h.player.diagnostics()).toEqual({ entries: 0, decodedBytes: 0, pending: 0 });
    await expect(h.player.play(navigation, options)).resolves.toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('caps the eight exact known cues at the authored 19,503,360-byte decoded pack', async () => {
    const fetcher = vi.fn(async (url: string) => {
      const cue = PILOT_CUES.find((entry) => entry.url === url)!;
      return new Response(wav(cue.durationMs, cue.category === 'music' || cue.category === 'ambience' ? 2 : 1));
    });
    vi.stubGlobal('fetch', fetcher); const h = harness();
    expect(PILOT_CUES.map((cue) => cue.id)).toEqual([
      'cf-pilot-exploration-music', 'cf-pilot-temperate-bed', 'cf-pilot-ui-nav', 'cf-pilot-ui-refusal',
      'cf-pilot-ui-settlement', 'cf-pilot-scout-approach', 'cf-pilot-scout-landing', 'cf-pilot-combat-contact',
    ]);
    expect(await Promise.all(PILOT_CUES.map((cue) => h.player.play(cue.id, options)))).toEqual(Array(8).fill(true));
    expect(PILOT_PCM_CACHE_LIMIT).toBe(19_503_360);
    expect(h.player.diagnostics()).toEqual({ entries: 8, decodedBytes: 19_503_360, pending: 0 });
    await expect(h.player.play('cf-pilot-unknown', options)).resolves.toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(8);
    h.player.stop(); expect(h.player.diagnostics().entries).toBe(8);
    h.player.dispose(); expect(h.player.diagnostics().decodedBytes).toBe(0);
  });
  it('rejects a changed source that would exceed the decoded ceiling before retaining it', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const cue = PILOT_CUES.find((entry) => entry.url === url)!;
      return new Response(wav(cue.durationMs, 2));
    }));
    const h = harness(); const results = [];
    for (const cue of PILOT_CUES) results.push(await h.player.play(cue.id, options));
    expect(results.some((value) => value === false)).toBe(true);
    expect(h.player.diagnostics().decodedBytes).toBeLessThanOrEqual(PILOT_PCM_CACHE_LIMIT);
    expect(h.player.diagnostics().entries).toBeLessThan(8);
    expect(h.player.diagnostics().pending).toBe(0); h.player.dispose();
  });
  it.each(['HTTP', 'network', 'format', 'duration', 'declared size', 'stream size'] as const)(
    'falls back to false without a voice/cache or automatic retry on %s failure', async (failure) => {
      const cancelled = vi.fn();
      const fetcher = vi.fn(async () => {
        if (failure === 'network') throw new Error('offline');
        if (failure === 'HTTP') return new Response('not available', { status: 404 });
        if (failure === 'format') return new Response('this is not a waveform');
        if (failure === 'duration') return new Response(wav(281));
        if (failure === 'declared size') return new Response(wav(), { headers: { 'content-length': String(PILOT_PCM_FILE_LIMIT + 1) } });
        return new Response(new ReadableStream({
          start(controller) { controller.enqueue(new Uint8Array(PILOT_PCM_FILE_LIMIT)); controller.enqueue(new Uint8Array(1)); },
          cancel: cancelled,
        }));
      });
      vi.stubGlobal('fetch', fetcher); const h = harness();
      await expect(h.player.play(navigation, options)).resolves.toBe(false);
      expect(fetcher).toHaveBeenCalledTimes(1); expect(h.play).not.toHaveBeenCalled();
      expect(h.player.diagnostics()).toEqual({ entries: 0, decodedBytes: 0, pending: 0 });
      if (failure === 'stream size') expect(cancelled).toHaveBeenCalledTimes(1);
      fetcher.mockImplementation(async () => new Response(wav()));
      await expect(h.player.play(navigation, options)).resolves.toBe(true);
      expect(fetcher).toHaveBeenCalledTimes(2); h.player.dispose();
    });
  it('returns false for the shared owner silent result without fabricating playback', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(wav()))); const h = harness();
    h.play.mockResolvedValue({ kind: 'silent', reason: 'pilot-unarmed' });
    await expect(h.player.play(navigation, options)).resolves.toBe(false);
    expect(h.play).toHaveBeenCalledTimes(1); h.player.dispose();
  });
});

describe('pilot load and playback generation cancellation', () => {
  it('blocks a cancelled late fetch and preserves a new same-cue pending generation', async () => {
    const old = deferred<Response>(); const fresh = deferred<Response>();
    const fetcher = vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
    vi.stubGlobal('fetch', fetcher); const h = harness();
    const oldPlay = h.player.play(navigation, options);
    const oldSignal = fetcher.mock.calls[0]![1].signal as AbortSignal;
    h.player.stop(); expect(oldSignal.aborted).toBe(true); expect(h.cancel).toHaveBeenCalledTimes(1);
    const freshPlay = h.player.play(navigation, options);
    const freshSignal = fetcher.mock.calls[1]![1].signal as AbortSignal;
    old.resolve(new Response(wav())); await expect(oldPlay).resolves.toBe(false);
    expect(h.play).not.toHaveBeenCalled();
    expect(h.player.diagnostics()).toEqual({ entries: 0, decodedBytes: 0, pending: 1 });
    expect(freshSignal.aborted).toBe(false);
    fresh.resolve(new Response(wav())); await expect(freshPlay).resolves.toBe(true);
    expect(h.play).toHaveBeenCalledTimes(1); expect(h.player.diagnostics().pending).toBe(0); h.player.dispose();
  });
  it('discards a load whose body arrives after hide/stop without creating a stale voice', async () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start(value) { controller = value; } });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body))); const h = harness();
    const playing = h.player.play(navigation, options); await Promise.resolve();
    h.player.stop(); controller.enqueue(new Uint8Array(wav())); controller.close();
    await expect(playing).resolves.toBe(false);
    expect(h.play).not.toHaveBeenCalled(); expect(h.cancel).toHaveBeenCalledTimes(1);
    expect(h.player.diagnostics()).toEqual({ entries: 0, decodedBytes: 0, pending: 0 }); h.player.dispose();
  });
  it('does not report success after stop while shared-owner activation is pending', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(wav()))); const h = harness();
    const settled = deferred<TameGreetingPlayResult>(); const entered = deferred<void>();
    h.play.mockImplementation(() => { entered.resolve(); return settled.promise; });
    const playing = h.player.play(navigation, options); await entered.promise;
    h.player.stop(); settled.resolve({ kind: 'started', voiceId: 'old-generation' });
    await expect(playing).resolves.toBe(false);
    expect(h.cancel).toHaveBeenCalledTimes(1); expect(h.play).toHaveBeenCalledTimes(1);
    h.player.dispose();
  });
  it('clears decoded data and refuses all late work after disposal', async () => {
    const response = deferred<Response>(); vi.stubGlobal('fetch', vi.fn().mockReturnValue(response.promise)); const h = harness();
    const pending = h.player.play(navigation, options); h.player.dispose(); response.resolve(new Response(wav()));
    await expect(pending).resolves.toBe(false); expect(h.play).not.toHaveBeenCalled();
    expect(h.player.diagnostics()).toEqual({ entries: 0, decodedBytes: 0, pending: 0 });
    await expect(h.player.play(navigation, options)).resolves.toBe(false);
  });
});
