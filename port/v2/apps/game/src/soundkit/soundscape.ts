/* @module soundkit/soundscape [app] — the ONE owner of continuous sound (D15 Stage 3, Claude 2026-09-26): the living bed under a world
   (one bed + its weather layer; phones half the layers, kit §5) and the sparse score (N5: "a calm piece plays once, then 2–5 minutes follow
   with only ambience"; battle loops only in battle; stings one-shot). Everything goes through the injected decorative voice port (the
   accessible audio owner's), so it can never sound where the owner would not (hidden tab, muted, not answerable): the runtime's
   admission, categories, ducking and budgets rule every request. Kit lifecycle: the bed never outlives its reason (setAmbience(null)
   stops it at once), a hidden tab stops everything, and visibility RESTARTS the bed and the loop. Renders are JOBS run in ≤ `sliceMs`
   slices on injected timers (never a long frame); buffers live in a byte-bounded LRU (≤ 24 MiB decoded). The gap before the next calm
   piece comes from a PRESENTATION stream seeded by the caller — never gameplay RNG, never the wall clock. */
import { mulberry32 } from '@cf/domain-rand';
import type { AudioContextLike, AudioGainNodeLike, AudioNodeLike, AudioVoiceGraph, AudioVoiceRequest, AudioVoiceReservation, AudioVoiceStartResult } from '@cf/audio';
import type { BiomeProfileKeyV1 } from '@cf/domain-biome-profile';
import { ambiencePlanV1, bedBytesV1, bedJobV1, weatherJobV1, type StereoBufferV1 } from './ambience.js';
import type { BufferContextLike } from './browser-adapter.js';
import { mixPolicyFor } from './mix.js';
import { MUSIC_RATE, musicJobV1, musicPieceV1, type MusicStateV1 } from './music.js';

export const DECODED_CEILING_BYTES = 24 * 1024 * 1024;
export const CALM_GAP_MS = Object.freeze({ min: 120_000, max: 300_000 });
export const RETRY_MS = 4_000;
export interface SoundscapePortV1 { playVoice(request: AudioVoiceRequest): AudioVoiceStartResult; stopVoice?(voiceId: string): boolean }
export interface SoundscapeOptionsV1 {
  readonly port: SoundscapePortV1;
  /** Injected timer: run `fn` after `ms`; returns a cancel. */
  readonly schedule: (fn: () => void, ms: number) => () => void;
  /** Monotonic ms (performance.now in the app) — only for slicing render work, never for musical choices. */
  readonly nowMs: () => number;
  /** The presentation stream seed (per session; never gameplay RNG). */
  readonly presentationSeed: number;
  readonly phone?: boolean;
  readonly sliceMs?: number;
}
export type StingV1 = 'victory' | 'discovery' | 'defeat' | 'triumph';
export interface AmbienceTargetV1 { readonly biome: BiomeProfileKeyV1; readonly timeOfDay?: 'day' | 'twilight' | 'night' }
export interface SoundscapeStatusV1 {
  readonly hidden: boolean; readonly ambienceKey: string | null; readonly ambienceVoices: readonly string[]; readonly musicState: MusicStateV1 | 'none';
  readonly musicPiece: string | null; readonly musicVoice: string | null; readonly nextPieceInMs: number | null; readonly residentBytes: number; readonly log: readonly string[];
}
export interface SoundscapeV1 {
  setAmbience(target: AmbienceTargetV1 | null): void;
  setMusicState(state: MusicStateV1 | 'none'): void;
  sting(which: StingV1): void;
  /** A settled fight on screen: the battle loop (major for a Guardian/Titan), then the outcome's sting after `durationMs`. */
  combatScene(major: boolean, result: 'win' | 'loss' | 'draw', durationMs: number): void;
  setHidden(hidden: boolean): void;
  status(): SoundscapeStatusV1;
  dispose(): void;
}

type Buf = { readonly kind: 'stereo'; readonly b: StereoBufferV1 } | { readonly kind: 'mono'; readonly samples: Float32Array; readonly rate: number };
const bytesOf = (x: Buf): number => (x.kind === 'stereo' ? bedBytesV1(x.b) : x.samples.byteLength);
const MUSIC_CUE: Readonly<Record<string, string>> = Object.freeze({ menu: 'music:title', calm: 'music:exploration-bed', wonder: 'music:landfall-theme:wonder', tension: 'music:landfall-theme:tension',
  battle: 'music:battle-theme', 'major-battle': 'music:battle-theme', 'sting-victory': 'music:victory-fanfare', 'sting-defeat': 'music:defeat', 'sting-discovery': 'music:landfall-theme:discovery', 'sting-triumph': 'music:landfall-theme:triumph' });

/** A looping (or one-shot) buffer voice through the kit's mix policy for its cue id. */
export function soundscapeVoiceRequestV1(cueId: string, buf: Buf, loop: boolean, gainDb: number, phone = false): AudioVoiceRequest {
  const p = mixPolicyFor(cueId, { phone }), seconds = buf.kind === 'stereo' ? buf.b.seconds : buf.samples.length / buf.rate;
  return Object.freeze({
    key: `soundscape:${cueId}`, category: p.category, priority: p.priority, cooldownGroup: `soundscape:${cueId}`, cooldownMs: 0,
    concurrencyGroup: p.concurrencyGroup, maxConcurrent: p.maxConcurrent, nodeCount: 2, mixIntent: p.mixIntent, meaning: Object.freeze({ kind: 'decorative' as const }),
    ...(loop ? {} : { maxDurationMs: Math.ceil(seconds * 1000) + 250 }),
    create: (context: AudioContextLike, reservation: AudioVoiceReservation): AudioVoiceGraph => {
      const ctx = context as BufferContextLike, source = ctx.createBufferSource();
      const audio = buf.kind === 'stereo' ? ctx.createBuffer(2, buf.b.left.length, buf.b.sampleRate) : ctx.createBuffer(1, buf.samples.length, buf.rate);
      if (buf.kind === 'stereo') { audio.copyToChannel(buf.b.left, 0); audio.copyToChannel(buf.b.right, 1); } else audio.copyToChannel(buf.samples, 0);
      source.buffer = audio; (source as { loop?: boolean }).loop = loop;
      const out: AudioGainNodeLike = ctx.createGain(); out.gain.setValueAtTime(Math.pow(10, gainDb / 20), ctx.currentTime); source.connect(out);
      const nodes: readonly AudioNodeLike[] = Object.freeze([source, out]);
      return Object.freeze({ source, sources: Object.freeze([source]), output: out, nodes, reservation });
    },
  });
}

export function createSoundscapeV1(o: SoundscapeOptionsV1): SoundscapeV1 {
  const slice = o.sliceMs ?? 8, rng = mulberry32((o.presentationSeed ^ 0x5c0d) >>> 0), log: string[] = [];
  const note = (m: string): void => { log.push(m); if (log.length > 40) log.shift(); };
  const cache = new Map<string, Buf>(); let resident = 0;
  const remember = (key: string, b: Buf, pinned: ReadonlySet<string>): void => {
    cache.delete(key); cache.set(key, b); resident += bytesOf(b);
    for (const [k, v] of cache) { if (resident <= DECODED_CEILING_BYTES) break; if (pinned.has(k) || k === key) continue; cache.delete(k); resident -= bytesOf(v); note(`evicted ${k}`); }
  };
  let hidden = false, disposed = false;
  // ---- the job runner: one job at a time, sliced ----
  const queue: { key: string; job: Generator<void, Buf | null>; done: (b: Buf | null) => void }[] = []; let running = false, cancelRun: (() => void) | null = null;
  const pump = (): void => {
    cancelRun = null; if (disposed) return; const head = queue[0]; if (!head) { running = false; return; }
    const until = o.nowMs() + slice;
    for (;;) { const s = head.job.next(); if (s.done) { queue.shift(); head.done(s.value); break; } if (o.nowMs() >= until) break; }
    cancelRun = o.schedule(pump, 0);
  };
  const render = (key: string, job: () => Generator<void, Buf | null>, done: (b: Buf | null) => void): void => {
    const hit = cache.get(key); if (hit) { cache.delete(key); cache.set(key, hit); done(hit); return; }
    const pending = queue.find((q) => q.key === key); if (pending) { const prev = pending.done; pending.done = (b) => { prev(b); done(b); }; return; }
    queue.push({ key, job: job(), done: (b) => { if (b) remember(key, b, pinnedKeys()); done(b); } });
    if (!running) { running = true; cancelRun = o.schedule(pump, 0); }
  };
  // ---- ambience ----
  let ambTarget: AmbienceTargetV1 | null = null, ambKey: string | null = null, ambVoices: string[] = [], ambRetry: (() => void) | null = null;
  const pinnedKeys = (): ReadonlySet<string> => new Set([...(ambKey ? [`bed:${ambTarget?.biome}`] : []), ...(ambTarget ? [`weather:${ambiencePlanV1(ambTarget.biome).weather}`] : []), ...(musicPiece ? [`music:${musicPiece}`] : [])]);
  const stopAmbience = (): void => { for (const id of ambVoices) o.port.stopVoice?.(id); ambVoices = []; ambRetry?.(); ambRetry = null; };
  const startAmbience = (): void => {
    if (!ambTarget || hidden || disposed) return;
    const plan = ambiencePlanV1(ambTarget.biome, ambTarget.timeOfDay ?? 'day'), key = `${plan.biome}:${ambTarget.timeOfDay ?? 'day'}`; ambKey = key;
    if (plan.family === 'silence') { note(`ambience ${plan.biome}: airless — silence`); return; }
    const play = (cueId: string, b: Buf | null): void => { if (!b || hidden || disposed || ambKey !== key) return;
      const r = o.port.playVoice(soundscapeVoiceRequestV1(cueId, b, true, plan.timeOfDayDb, o.phone === true));
      if (r.kind === 'started') { ambVoices.push(r.voiceId); note(`${cueId} started`); } else { note(`${cueId} ${r.kind}:${'reason' in r ? r.reason : ''}`); scheduleAmbienceRetry(); } };
    render(`bed:${plan.biome}`, () => (function* () { const b: StereoBufferV1 | null = yield* bedJobV1(plan); return b ? ({ kind: 'stereo', b } as Buf) : null; })(), (b) => play(`ambience:bed:${plan.family}`, b));
    if (plan.weather && o.phone !== true) { const w = plan.weather;
      render(`weather:${w}`, () => (function* () { const b = yield* weatherJobV1(w, plan.seed); return { kind: 'stereo', b } as Buf; })(), (b) => play(`ambience:weather:${w}`, b)); }
  };
  const scheduleAmbienceRetry = (): void => { if (ambRetry || hidden || disposed) return; ambRetry = o.schedule(() => { ambRetry = null; if (ambVoices.length === 0) startAmbience(); }, RETRY_MS); };
  // ---- music ----
  let musicState: MusicStateV1 | 'none' = 'none', musicPiece: string | null = null, musicVoice: string | null = null, musicTimer: (() => void) | null = null, nextAt: number | null = null;
  const clearMusicTimer = (): void => { musicTimer?.(); musicTimer = null; nextAt = null; };
  const stopMusic = (): void => { if (musicVoice) o.port.stopVoice?.(musicVoice); musicVoice = null; musicPiece = null; };
  const playPiece = (id: string, loop: boolean, then: (() => void) | null): void => {
    musicPiece = id;
    render(`music:${id}`, () => (function* () { const s = yield* musicJobV1(musicPieceV1(id)); return { kind: 'mono', samples: s, rate: MUSIC_RATE } as Buf; })(), (b) => {
      if (!b || hidden || disposed || musicPiece !== id) return;
      const r = o.port.playVoice(soundscapeVoiceRequestV1(MUSIC_CUE[id.startsWith('sting') ? id : musicPieceV1(id).state === 'calm' ? 'calm' : id] ?? 'music:title', b, loop, 0, o.phone === true));
      if (r.kind !== 'started') { note(`music ${id} ${r.kind}:${'reason' in r ? r.reason : ''}`); musicPiece = null; clearMusicTimer(); musicTimer = o.schedule(() => { musicTimer = null; resumeMusic(); }, RETRY_MS); return; }
      musicVoice = r.voiceId; note(`music ${id} started${loop ? ' (loop)' : ''}`);
      if (!loop && then) { const ms = Math.ceil(((b.kind === 'mono' ? b.samples.length / b.rate : b.b.seconds)) * 1000); clearMusicTimer(); musicTimer = o.schedule(() => { musicTimer = null; musicVoice = null; musicPiece = null; then(); }, ms); }
    });
  };
  const calmGap = (): number => CALM_GAP_MS.min + Math.floor(rng() * (CALM_GAP_MS.max - CALM_GAP_MS.min));
  const scheduleCalm = (delayMs: number): void => { clearMusicTimer(); nextAt = o.nowMs() + delayMs; musicTimer = o.schedule(() => { musicTimer = null; nextAt = null; if (musicState === 'calm') playPiece(rng() < 0.5 ? 'calm-a' : 'calm-b', false, () => scheduleCalm(calmGap())); }, delayMs); };
  const resumeMusic = (): void => {
    if (hidden || disposed) return;
    switch (musicState) {
      case 'none': return;
      case 'calm': scheduleCalm(8_000); return;
      case 'battle': case 'major-battle': playPiece(musicState, true, null); return;
      case 'victory-discovery': return;
      default: playPiece(musicState, false, () => { musicState = 'calm'; scheduleCalm(calmGap()); });
    }
  };
  let combatTimer: (() => void) | null = null;
  const api: SoundscapeV1 = {
    combatScene(major, result, durationMs) {
      combatTimer?.(); api.setMusicState(major ? 'major-battle' : 'battle');
      combatTimer = o.schedule(() => { combatTimer = null; api.sting(result === 'win' ? 'victory' : result === 'loss' ? 'defeat' : 'discovery'); }, Math.max(1500, durationMs));
    },
    setAmbience(target) {
      const key = target ? `${target.biome}:${target.timeOfDay ?? 'day'}` : null;
      if (key === ambKey && (ambVoices.length > 0 || target === null)) return;
      stopAmbience(); ambTarget = target; ambKey = null;
      if (target) startAmbience(); else note('ambience stopped');
    },
    setMusicState(state) {
      if (state === musicState && (musicVoice || musicTimer)) return;
      clearMusicTimer(); stopMusic(); musicState = state; resumeMusic();
    },
    sting(which) {
      if (hidden || disposed) return; clearMusicTimer(); stopMusic(); const before = musicState;
      playPiece(`sting-${which}`, false, () => { musicState = before === 'battle' || before === 'major-battle' ? 'calm' : before; resumeMusic(); });
    },
    setHidden(h) {
      if (h === hidden) return; hidden = h;
      if (h) { combatTimer?.(); combatTimer = null; stopAmbience(); clearMusicTimer(); stopMusic(); note('hidden: all continuous sound stopped'); return; }
      note('visible: restart'); const t = ambTarget; ambKey = null; if (t) { ambTarget = t; startAmbience(); } resumeMusic();
    },
    status: () => Object.freeze({ hidden, ambienceKey: ambKey, ambienceVoices: Object.freeze([...ambVoices]), musicState, musicPiece, musicVoice, nextPieceInMs: nextAt === null ? null : Math.max(0, nextAt - o.nowMs()), residentBytes: resident, log: Object.freeze([...log]) }),
    dispose() { if (disposed) return; combatTimer?.(); stopAmbience(); clearMusicTimer(); stopMusic(); cancelRun?.(); queue.length = 0; cache.clear(); resident = 0; disposed = true; },
  };
  return api;
}
