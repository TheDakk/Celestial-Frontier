/** @module device-probe-performance [app] — the H1 iPhone probe's PERFORMANCE, HEAT and MEMORY sections (`?deviceProbe=1`; loaded only
 * through the probe's own flag-gated dynamic import). Everything is measured INSIDE the page with `performance.now` and rAF, on the real
 * painted battle2 stage (the matchup picker's scripted bout), fully offline: no network beyond the package's own files, no telemetry.
 *
 * - PERFORMANCE: per pair (the heaviest shipped pair Centipede vs Chimpanzee, and an ordinary pair), rAF frame intervals and the battle2
 *   ticker's own work per frame (the stage's ticker callbacks are wrapped and timed). Frames while the study loads, or between bouts, are
 *   excluded from the pacing numbers and counted separately.
 * - HEAT / THROTTLE: a sustained run of the heaviest pair, replayed bout after bout, split into windows. iOS exposes NO temperature to a
 *   web page, so this is a PROXY: a phone that throttles as it heats shows its later windows' frame p95 drifting up.
 * - MEMORY: `performance.memory` where the browser has it (iOS Safari does not: reported as unavailable, never guessed), plus the painted
 *   card residency and the morph atlas cache counters from the game's own diagnostics.
 *
 * Budgets are READ, never set here: the 60 Hz pacing budget is `inspectFramePacing` in tools/quadruped-proof/motion-proof-contract.mjs
 * (fps ≥ 57, interval p95 ≤ 25 ms, interval max ≤ 100 ms; a test proves this table agrees with it at the boundaries), the long-interval
 * and busy-frame counts are the ones Codex's native summaries report (intervals ≥ 25 ms; CPU frames > 1000/60 ms), and the residency
 * bounds are the caches' own constants. The heat section adds no threshold of its own: each window is judged by the same pacing budget
 * and the drift is reported as a number. */
import { ARCHETYPE_RESIDENT_DEFAULT } from './morph/painted-card-source.js';

export const PROBE_PACING_BUDGET_V1 = Object.freeze({
  fpsMin: 57, intervalP95MaxMs: 25, intervalMaxMs: 100, minFrames: 570,
  longIntervalMs: 25, busyFrameMs: 1000 / 60,
  source: 'motion-proof-contract.mjs inspectFramePacing (60 Hz pacing budget); long intervals ≥ 25 ms and CPU frames > 1000/60 ms as in Codex’s native summaries',
});
export const PROBE_MORPH_CACHE_LIMITS_V1 = Object.freeze({ maxEntries: 8, maxBytes: 96 * 1024 * 1024 });
export const PROBE_PAIRS_V1 = Object.freeze([
  Object.freeze({ id: 'heaviest', vs: 'Centipede,Chimpanzee', note: 'the heaviest shipped pair (C3/C12: the Centipede skin)' }),
  Object.freeze({ id: 'ordinary', vs: 'Civet,Wolf', note: 'an ordinary pair' }),
]);
export const PROBE_RUN_MS_V1 = Object.freeze({ perPair: 20_000, heatTotal: 180_000, heatWindow: 30_000 });

/** The contract's percentile (floor(n·f) of the sorted values), so the probe reads numbers exactly as the budget owner does. */
export const probePercentile = (values: readonly number[], fraction: number): number => { if (!values.length) return 0; const a = values.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(a.length * fraction))]!; };

export interface FrameSampleV1 { readonly intervalMs: number; readonly busyMs: number; readonly active: boolean; }
export type ProbeVerdictV1 = 'pass' | 'fail' | 'insufficient';
export interface FrameAnalysisV1 {
  readonly frames: number; readonly excludedFrames: number; readonly fps: number;
  readonly intervalP50Ms: number; readonly intervalP95Ms: number; readonly intervalMaxMs: number; readonly longIntervals: number;
  readonly busyP50Ms: number; readonly busyP95Ms: number; readonly busyMaxMs: number; readonly busyFrames: number;
  readonly verdict: ProbeVerdictV1; readonly failures: readonly string[];
}
const r2 = (n: number): number => Math.round(n * 100) / 100;

/** Pacing numbers over the ACTIVE frames (the stage playing), judged by the contract's 60 Hz budget. */
export function analyzeFrameTraceV1(samples: readonly FrameSampleV1[]): FrameAnalysisV1 {
  const active = samples.filter((s) => s.active && Number.isFinite(s.intervalMs) && s.intervalMs > 0), B = PROBE_PACING_BUDGET_V1;
  const iv = active.map((s) => s.intervalMs), busy = active.map((s) => Math.max(0, s.busyMs)), elapsed = iv.reduce((a, b) => a + b, 0);
  const fps = elapsed > 0 ? (iv.length * 1000) / elapsed : 0, failures: string[] = [];
  const out = { frames: active.length, excludedFrames: samples.length - active.length, fps: r2(fps),
    intervalP50Ms: r2(probePercentile(iv, 0.5)), intervalP95Ms: r2(probePercentile(iv, 0.95)), intervalMaxMs: r2(iv.length ? Math.max(...iv) : 0),
    longIntervals: iv.filter((v) => v >= B.longIntervalMs).length,
    busyP50Ms: r2(probePercentile(busy, 0.5)), busyP95Ms: r2(probePercentile(busy, 0.95)), busyMaxMs: r2(busy.length ? Math.max(...busy) : 0),
    busyFrames: busy.filter((v) => v > B.busyFrameMs).length };
  if (active.length < B.minFrames) return Object.freeze({ ...out, verdict: 'insufficient' as const, failures: Object.freeze([`only ${active.length} playing frames (the budget needs ≥ ${B.minFrames})`]) });
  if (fps < B.fpsMin) failures.push(`${r2(fps)} fps < ${B.fpsMin}`);
  if (probePercentile(iv, 0.95) > B.intervalP95MaxMs) failures.push(`interval p95 ${out.intervalP95Ms} ms > ${B.intervalP95MaxMs}`);
  if (iv.length && Math.max(...iv) > B.intervalMaxMs) failures.push(`interval max ${out.intervalMaxMs} ms > ${B.intervalMaxMs}`);
  return Object.freeze({ ...out, verdict: failures.length ? 'fail' as const : 'pass' as const, failures: Object.freeze(failures) });
}

/** Heat proxy: the same analysis per consecutive window; drift = the last judged window's interval p95 minus the first's (a number, no new threshold). */
export interface HeatAnalysisV1 { readonly windows: readonly (FrameAnalysisV1 & { readonly fromMs: number })[]; readonly p95DriftMs: number; readonly busyP95DriftMs: number; readonly verdict: ProbeVerdictV1; }
export function analyzeHeatTraceV1(samples: readonly (FrameSampleV1 & { readonly atMs: number })[], windowMs: number): HeatAnalysisV1 {
  const windows: (FrameAnalysisV1 & { fromMs: number })[] = [];
  if (samples.length) { const t0 = samples[0]!.atMs, last = samples[samples.length - 1]!.atMs;
    for (let from = t0; from <= last; from += windowMs) { const w = samples.filter((s) => s.atMs >= from && s.atMs < from + windowMs); if (w.length) windows.push({ ...analyzeFrameTraceV1(w), fromMs: r2(from - t0) }); } }
  const judged = windows.filter((w) => w.verdict !== 'insufficient');
  // drift between the first and last JUDGED windows (a trailing partial window with too few frames is shown but never compared)
  const drift = (k: 'intervalP95Ms' | 'busyP95Ms') => (judged.length >= 2 ? r2(judged[judged.length - 1]![k] - judged[0]![k]) : 0);
  const verdict: ProbeVerdictV1 = !judged.length ? 'insufficient' : judged.some((w) => w.verdict === 'fail') ? 'fail' : 'pass';
  return Object.freeze({ windows: Object.freeze(windows.map((w) => Object.freeze(w))), p95DriftMs: drift('intervalP95Ms'), busyP95DriftMs: drift('busyP95Ms'), verdict });
}

/* ---------- the page's runtime port (main.ts builds it lazily, only when a Run is pressed) ---------- */
export interface ProbeTickerLike { add(fn: () => void): unknown; remove(fn: () => void): unknown; }
export interface ProbeMatchupLike { readonly root: HTMLElement; play(): Promise<unknown>; dispose(): void; }
export interface PerformanceProbePortV1 {
  now(): number;
  raf(cb: (t: number) => void): number;
  cancelRaf(id: number): void;
  /** The app's ticker; the probe hands the matchup a timed wrapper of it. */
  readonly ticker: ProbeTickerLike;
  /** Mounts the real matchup picker (`?battle2=1&vs=…` scripted bout) on the given ticker. */
  mountMatchup(search: string, ticker: ProbeTickerLike): Promise<ProbeMatchupLike>;
  /** `performance.memory` when the browser has it; null otherwise (iOS Safari). */
  jsHeap(): Readonly<{ usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }> | null;
  /** The game's painted-card ownership diagnostics (`speciesArtLoader.paintedDiagnostics()`), or null. */
  paintedArt(): unknown;
  /** The shared morph atlas cache counters (main.ts reads `morphAtlasCache.stats()` through a dynamic import — the same module instance the
   * stage uses — so this module never pulls the renderer's types into the strict root program). */
  morphCache(): Promise<Readonly<{ entries: number; borrowed: number; bytes: number; produces: number; evictions: number }>> | Readonly<{ entries: number; borrowed: number; bytes: number; produces: number; evictions: number }>;
}

/** Wraps a ticker so every callback the stage registers is timed; `take()` returns (and resets) the work since the last take. */
export function timedTicker(inner: ProbeTickerLike, now: () => number): ProbeTickerLike & { take(): number } {
  const wrapped = new Map<() => void, () => void>(); let busy = 0;
  return {
    add(fn) { const w = () => { const t0 = now(); try { fn(); } finally { busy += now() - t0; } }; wrapped.set(fn, w); return inner.add(w); },
    remove(fn) { const w = wrapped.get(fn); wrapped.delete(fn); return inner.remove(w ?? fn); },
    take() { const b = busy; busy = 0; return b; },
  };
}
const studyPhase = (root: HTMLElement): string | null => root.querySelector<HTMLElement>('[data-battle2-status]')?.dataset.battle2Status ?? null;

/** Plays `vs` on the real stage for `durationMs` of wall time, replaying the bout whenever it finishes; returns every rAF frame. */
export async function recordStageFramesV1(port: PerformanceProbePortV1, vs: string, durationMs: number, onProgress?: (text: string) => void): Promise<{ samples: (FrameSampleV1 & { atMs: number })[]; loadError: string | null }> {
  const ticker = timedTicker(port.ticker, () => port.now());
  const matchup = await port.mountMatchup(`?battle2=1&vs=${encodeURIComponent(vs).replace(/%2C/g, ',')}`, ticker);
  const samples: (FrameSampleV1 & { atMs: number })[] = []; let loadError: string | null = null;
  try {
    await new Promise<void>((resolve) => {
      const start = port.now(); let last = start, replaying = false, lastNote = -1;
      const frame = (): void => {
        const t = port.now(), phase = studyPhase(matchup.root), interval = t - last; last = t;
        const busy = ticker.take();
        if (phase === 'failed') { loadError = matchup.root.textContent?.slice(0, 200) ?? 'study failed'; resolve(); return; }
        samples.push({ atMs: t - start, intervalMs: interval, busyMs: busy, active: phase === 'playing' && !replaying && samples.length > 0 });
        if (phase === 'finished' && !replaying) { replaying = true; void matchup.play().catch(() => undefined).finally(() => { replaying = false; }); }
        const s = Math.floor((t - start) / 1000); if (onProgress && s !== lastNote) { lastNote = s; onProgress(`${vs}: ${s} / ${Math.round(durationMs / 1000)} s`); }
        if (t - start >= durationMs) { resolve(); return; }
        port.raf(frame);
      };
      port.raf(frame);
    });
  } finally { matchup.dispose(); }
  return { samples, loadError };
}

export interface PerformanceSectionV1 { readonly pairs: readonly { readonly id: string; readonly vs: string; readonly note: string; readonly loadError: string | null; readonly analysis: FrameAnalysisV1 }[]; }
export async function runPerformanceProbeV1(port: PerformanceProbePortV1, durationMs: number = PROBE_RUN_MS_V1.perPair, onProgress?: (t: string) => void): Promise<PerformanceSectionV1> {
  const pairs = [];
  for (const p of PROBE_PAIRS_V1) { const r = await recordStageFramesV1(port, p.vs, durationMs, onProgress); pairs.push(Object.freeze({ id: p.id, vs: p.vs, note: p.note, loadError: r.loadError, analysis: analyzeFrameTraceV1(r.samples) })); }
  return Object.freeze({ pairs: Object.freeze(pairs) });
}
export async function runHeatProbeV1(port: PerformanceProbePortV1, totalMs: number = PROBE_RUN_MS_V1.heatTotal, windowMs: number = PROBE_RUN_MS_V1.heatWindow, onProgress?: (t: string) => void): Promise<HeatAnalysisV1 & { readonly vs: string; readonly loadError: string | null }> {
  const vs = PROBE_PAIRS_V1[0]!.vs, r = await recordStageFramesV1(port, vs, totalMs, onProgress);
  return Object.freeze({ ...analyzeHeatTraceV1(r.samples, windowMs), vs, loadError: r.loadError });
}

export interface MemorySectionV1 {
  readonly jsHeap: Readonly<{ usedMiB: number; totalMiB: number; limitMiB: number }> | null; readonly jsHeapNote: string;
  readonly paintedResident: Readonly<{ count: number; bytes: number; limit: number }> | null;
  readonly morphCache: Readonly<{ entries: number; borrowed: number; bytes: number; produces: number; evictions: number; maxEntries: number; maxBytes: number }>;
}
const mib = (b: number): number => r2(b / 1048576);
export async function readMemoryProbeV1(port: PerformanceProbePortV1): Promise<MemorySectionV1> {
  let heap: MemorySectionV1['jsHeap'] = null; try { const h = port.jsHeap(); if (h && Number.isFinite(h.usedJSHeapSize)) heap = Object.freeze({ usedMiB: mib(h.usedJSHeapSize), totalMiB: mib(h.totalJSHeapSize), limitMiB: mib(h.jsHeapSizeLimit) }); } catch { heap = null; }
  let painted: MemorySectionV1['paintedResident'] = null;
  try { const d = port.paintedArt() as { residentArchetypes?: { count?: unknown; bytes?: unknown } } | null; const ra = d?.residentArchetypes;
    if (ra && typeof ra.count === 'number' && typeof ra.bytes === 'number') painted = Object.freeze({ count: ra.count, bytes: ra.bytes, limit: ARCHETYPE_RESIDENT_DEFAULT }); } catch { painted = null; }
  const m = await port.morphCache();
  return Object.freeze({ jsHeap: heap, jsHeapNote: heap ? 'performance.memory (this browser)' : 'unavailable — this browser exposes no JS heap API (iOS Safari has none); not estimated',
    paintedResident: painted, morphCache: Object.freeze({ ...m, maxEntries: PROBE_MORPH_CACHE_LIMITS_V1.maxEntries, maxBytes: PROBE_MORPH_CACHE_LIMITS_V1.maxBytes }) });
}

/* ---------- the Copy results block ---------- */
const B = PROBE_PACING_BUDGET_V1;
const frameLines = (a: FrameAnalysisV1): string[] => [
  `  verdict: ${a.verdict}${a.failures.length ? ` (${a.failures.join('; ')})` : ''}`,
  `  frames: ${a.frames} playing, ${a.excludedFrames} excluded (loading / between bouts)`,
  `  fps: ${a.fps} (budget ≥ ${B.fpsMin})`,
  `  frame interval p50/p95/max: ${a.intervalP50Ms} / ${a.intervalP95Ms} / ${a.intervalMaxMs} ms (budget p95 ≤ ${B.intervalP95MaxMs}, max ≤ ${B.intervalMaxMs})`,
  `  long intervals (≥ ${B.longIntervalMs} ms): ${a.longIntervals}`,
  `  battle2 stage work per frame p50/p95/max: ${a.busyP50Ms} / ${a.busyP95Ms} / ${a.busyMaxMs} ms (frame budget ${r2(B.busyFrameMs)} ms; frames over it: ${a.busyFrames})`,
];
export interface DeviceProbeIdentityV1 { readonly commit: string; readonly packDigest: string; readonly ua: string; readonly dpr: number; readonly viewport: string; }
export function formatDeviceProbeSectionsV1(identity: DeviceProbeIdentityV1, s: Readonly<{ performance?: PerformanceSectionV1; heat?: HeatAnalysisV1 & { vs: string; loadError: string | null }; memory?: MemorySectionV1 }>): string {
  const lines = ['Celestial Frontier — H1 device probe · performance / heat / memory', `commit: ${identity.commit}`, `pack: ${identity.packDigest}`, `device: ${identity.ua}`,
    `dpr: ${identity.dpr} · viewport: ${identity.viewport}`, `budget source: ${B.source}`];
  if (s.performance) for (const p of s.performance.pairs) lines.push(`PERFORMANCE ${p.id} (${p.vs}; ${p.note})${p.loadError ? ` — study failed: ${p.loadError}` : ''}`, ...frameLines(p.analysis));
  if (s.heat) { lines.push(`HEAT / THROTTLE (${s.heat.vs}, sustained; iOS exposes no temperature — this is a frame-time PROXY)${s.heat.loadError ? ` — study failed: ${s.heat.loadError}` : ''}`,
    `  verdict: ${s.heat.verdict} · interval p95 drift first→last window: ${s.heat.p95DriftMs >= 0 ? '+' : ''}${s.heat.p95DriftMs} ms · stage work p95 drift: ${s.heat.busyP95DriftMs >= 0 ? '+' : ''}${s.heat.busyP95DriftMs} ms`);
    for (const w of s.heat.windows) lines.push(`  window ${Math.round(w.fromMs / 1000)} s: ${w.verdict} · fps ${w.fps} · interval p95 ${w.intervalP95Ms} ms · stage p95 ${w.busyP95Ms} ms · long ${w.longIntervals}`); }
  if (s.memory) { const m = s.memory; lines.push('MEMORY',
    `  JS heap: ${m.jsHeap ? `${m.jsHeap.usedMiB} MiB used / ${m.jsHeap.totalMiB} total / ${m.jsHeap.limitMiB} limit` : m.jsHeapNote}`,
    `  painted card archetypes resident: ${m.paintedResident ? `${m.paintedResident.count} (${mib(m.paintedResident.bytes)} MiB; limit ${m.paintedResident.limit})` : 'unavailable'}`,
    `  morph atlas cache: ${m.morphCache.entries} entries (limit ${m.morphCache.maxEntries}), ${mib(m.morphCache.bytes)} MiB (limit ${mib(m.morphCache.maxBytes)}), ${m.morphCache.borrowed} borrowed, ${m.morphCache.produces} produced, ${m.morphCache.evictions} evicted`); }
  return lines.join('\n');
}
