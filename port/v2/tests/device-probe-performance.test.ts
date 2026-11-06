/** H1 device probe — PERFORMANCE / HEAT / MEMORY sections. The page logic against fakes for every outcome; a CONTROL that a fake long-frame
 * trace is reported as a FAILURE (never a pass); parity of the probe's budget table with the budget owner (`inspectFramePacing`) at its
 * boundaries; the recorder on a fake stage (the stage's ticker work is timed, a finished bout replays, the matchup is disposed); honest
 * memory reporting when the browser has no heap API; and the page's Copy text. */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { analyzeFrameTraceV1, analyzeHeatTraceV1, formatDeviceProbeSectionsV1, PROBE_PACING_BUDGET_V1, readMemoryProbeV1, recordStageFramesV1, runPerformanceProbeV1,
  timedTicker, type FrameSampleV1, type PerformanceProbePortV1, type ProbeTickerLike } from '../apps/game/src/device-probe-performance.js';
import { mountDeviceProbeV1 } from '../apps/game/src/device-probe.js';
// the budget OWNER (Codex's tool; loaded by URL so its untyped .mjs needs no declaration file in its folder): the probe's table must agree with it
const { inspectFramePacing } = await import(/* @vite-ignore */ new URL('../tools/quadruped-proof/motion-proof-contract.mjs', import.meta.url).href) as { inspectFramePacing: (deltas: number[], updates: number[], cpu: number[]) => unknown };

const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };
const trace = (intervals: readonly number[], busy = 3): FrameSampleV1[] => intervals.map((intervalMs) => ({ intervalMs, busyMs: busy, active: true }));
const sixty = (n = 600): number[] => Array(n).fill(1000 / 60);
const contractAccepts = (intervals: number[]): boolean => { try { inspectFramePacing(intervals, Array(intervals.length + 1).fill(0.8), Array(intervals.length + 1).fill(3)); return true; } catch { return false; } };

describe('frame analysis (PERFORMANCE)', () => {
  it('a steady 60 Hz trace passes with exact numbers', () => {
    const a = analyzeFrameTraceV1(trace(sixty(), 4));
    expect(a).toMatchObject({ verdict: 'pass', frames: 600, excludedFrames: 0, fps: 60, intervalP95Ms: 16.67, intervalMaxMs: 16.67, longIntervals: 0, busyP95Ms: 4, busyFrames: 0 });
  });
  it('CONTROL — a fake LONG-FRAME trace is reported as a FAILURE, never a pass', () => {
    const stall = sixty(); stall[300] = 120;
    const a = analyzeFrameTraceV1(trace(stall)); expect(a.verdict).toBe('fail'); expect(a.failures.join(' ')).toMatch(/interval max 120 ms > 100/); expect(a.longIntervals).toBe(1);
    const thirty = analyzeFrameTraceV1(trace(Array(600).fill(1000 / 30))); expect(thirty.verdict).toBe('fail'); expect(thirty.failures.join(' ')).toMatch(/fps/);
    const heavy = analyzeFrameTraceV1(trace(sixty(), 20)); expect(heavy.busyFrames).toBe(600); // stage work over the frame budget is counted, and printed
  });
  it('too few playing frames is INSUFFICIENT (not a pass); loading frames are excluded and counted', () => {
    expect(analyzeFrameTraceV1(trace(sixty(100))).verdict).toBe('insufficient');
    const mixed = [...trace(sixty(600)), ...Array.from({ length: 50 }, () => ({ intervalMs: 400, busyMs: 300, active: false }))];
    expect(analyzeFrameTraceV1(mixed)).toMatchObject({ verdict: 'pass', frames: 600, excludedFrames: 50, intervalMaxMs: 16.67 });
  });
  it('the probe\'s budget agrees with the budget owner (inspectFramePacing) at its boundaries', () => {
    const p95At = (v: number) => { const t = sixty(); for (let i = 0; i < 40; i++) t[i] = v; return t; }; // 40/600 = 6.7 % of frames at v → the p95
    const cases: [string, number[]][] = [['60 Hz', sixty()], ['p95 = 25', p95At(25)], ['p95 = 26', p95At(26)], ['max 100', (() => { const t = sixty(); t[5] = 100; return t; })()],
      ['max 101', (() => { const t = sixty(); t[5] = 101; return t; })()], ['30 Hz', Array(600).fill(1000 / 30)], ['56 fps', Array(600).fill(1000 / 56)]];
    for (const [name, t] of cases) expect(analyzeFrameTraceV1(trace(t)).verdict === 'pass', name).toBe(contractAccepts(t));
    expect(PROBE_PACING_BUDGET_V1).toMatchObject({ fpsMin: 57, intervalP95MaxMs: 25, intervalMaxMs: 100, minFrames: 570 });
  });
});

describe('heat proxy', () => {
  it('windows are judged by the same budget; a phone that throttles later shows a late FAIL window and a positive drift', () => {
    const s: (FrameSampleV1 & { atMs: number })[] = []; let t = 0;
    for (let i = 0; i < 1800; i++) { const iv = i < 900 ? 1000 / 60 : 1000 / 40; t += iv; s.push({ atMs: t, intervalMs: iv, busyMs: i < 900 ? 4 : 12, active: true }); }
    const h = analyzeHeatTraceV1(s, 15_000);
    const judged = h.windows.filter((w) => w.verdict !== 'insufficient'); expect(judged.length).toBeGreaterThanOrEqual(2); expect(judged[0]!.verdict).toBe('pass'); expect(judged[judged.length - 1]!.verdict).toBe('fail');
    expect(h.verdict).toBe('fail'); expect(h.p95DriftMs).toBeCloseTo(25 - 16.67, 1); expect(h.busyP95DriftMs).toBe(8);
    const steady = analyzeHeatTraceV1(Array.from({ length: 1800 }, (_, i) => ({ atMs: (i + 1) * 1000 / 60, intervalMs: 1000 / 60, busyMs: 4, active: true })), 15_000);
    expect(steady).toMatchObject({ verdict: 'pass', p95DriftMs: 0 });
  });
});

/** A fake stage: a microtask rAF on a fake clock; the matchup registers one ticker callback costing `stageMs`; its status plays, then finishes. */
function fakePort(opts: { intervalMs?: number; stageMs?: number; boutMs?: number; failWith?: string; heap?: boolean } = {}): PerformanceProbePortV1 & { log: string[] } {
  let t = 0; const fns = new Set<() => void>(), log: string[] = [];
  const ticker: ProbeTickerLike = { add: (fn) => fns.add(fn), remove: (fn) => fns.delete(fn) };
  return { log, now: () => t, cancelRaf: () => {},
    raf: (cb) => { void Promise.resolve().then(() => { t += opts.intervalMs ?? 1000 / 60; for (const fn of fns) fn(); cb(t); }); return 1; },
    ticker,
    mountMatchup: async (search, wrapped) => {
      const dom = new JSDOM('<!doctype html><body></body>'), root = dom.window.document.createElement('div'), sec = dom.window.document.createElement('section');
      root.append(sec); log.push(`mount ${search}`); let boutStart = t;
      const setPhase = (p: string) => { sec.dataset.battle2Status = p; };
      setPhase(opts.failWith ? 'failed' : 'playing'); if (opts.failWith) root.append(opts.failWith);
      const stage = () => { t += opts.stageMs ?? 3; if (t - boutStart > (opts.boutMs ?? 1e9) && sec.dataset.battle2Status === 'playing') setPhase('finished'); };
      wrapped.add(stage);
      return { root, play: async () => { log.push('replay'); setPhase('playing'); boutStart = t; }, dispose: () => { wrapped.remove(stage); log.push('dispose'); } };
    },
    jsHeap: () => (opts.heap ? { usedJSHeapSize: 50 * 1048576, totalJSHeapSize: 80 * 1048576, jsHeapSizeLimit: 4096 * 1048576 } : null),
    paintedArt: () => ({ residentArchetypes: { count: 2, bytes: 4 * 1048576 } }),
    morphCache: async () => ({ entries: 3, borrowed: 2, bytes: 12 * 1048576, produces: 5, evictions: 1 }) };
}

describe('the recorder on the (fake) real-stage path', () => {
  it('times the stage\'s own ticker work per frame, replays a finished bout, excludes non-playing frames, and disposes the matchup', async () => {
    const port = fakePort({ stageMs: 5, boutMs: 4000 });
    const r = await recordStageFramesV1(port, 'Centipede,Chimpanzee', 12_000);
    expect(r.loadError).toBeNull(); expect(port.log[0]).toBe('mount ?battle2=1&vs=Centipede,Chimpanzee'); expect(port.log).toContain('replay'); expect(port.log.at(-1)).toBe('dispose');
    const a = analyzeFrameTraceV1(r.samples); expect(a.busyP50Ms).toBe(5); expect(a.excludedFrames).toBeGreaterThan(0);
  });
  it('the timed ticker measures ONLY the wrapped callbacks and forwards removal', () => {
    let t = 0; const inner = new Set<() => void>(); const tt = timedTicker({ add: (f) => inner.add(f), remove: (f) => inner.delete(f) }, () => t);
    const fn = () => { t += 7; }; tt.add(fn); for (const f of inner) f(); t += 100; expect(tt.take()).toBe(7); expect(tt.take()).toBe(0); tt.remove(fn); expect(inner.size).toBe(0);
  });
  it('a study that fails to stage is reported with its reason, and the performance section still completes', async () => {
    const s = await runPerformanceProbeV1(fakePort({ failWith: 'could not stage: pinned parts rig unavailable' }), 2000);
    expect(s.pairs.map((p) => p.vs)).toEqual(['Centipede,Chimpanzee', 'Civet,Wolf']);
    expect(s.pairs[0]!.loadError).toMatch(/pinned parts rig unavailable/); expect(s.pairs[0]!.analysis.verdict).toBe('insufficient');
  });
});

describe('memory (honest where the browser has no heap API)', () => {
  it('iOS-like: the JS heap is UNAVAILABLE (not estimated); residency and cache counters print beside their limits', async () => {
    const m = await readMemoryProbeV1(fakePort());
    expect(m.jsHeap).toBeNull(); expect(m.jsHeapNote).toMatch(/unavailable.*iOS Safari/);
    expect(m.paintedResident).toEqual({ count: 2, bytes: 4 * 1048576, limit: 2 }); expect(m.morphCache).toMatchObject({ entries: 3, maxEntries: 8, maxBytes: 96 * 1048576 });
    const withHeap = await readMemoryProbeV1(fakePort({ heap: true })); expect(withHeap.jsHeap).toEqual({ usedMiB: 50, totalMiB: 80, limitMiB: 4096 });
  });
});

describe('the probe page with the new sections', () => {
  it('Run performance / Read memory then Copy give one block with identity and every number beside its budget', async () => {
    const dom = new JSDOM('<!doctype html><body></body>'); let copied = '';
    const page = mountDeviceProbeV1({ doc: dom.window.document, commit: 'abc123', ua: 'iPhone test', createContext: () => { throw new Error('none'); }, copyText: async (t) => { copied = t; },
      performance: () => fakePort({ stageMs: 4 }), readPackDigest: async () => 'pack-digest-1', dpr: 3, viewport: '390×844' });
    expect(page.root.querySelector('[data-probe-perf]')).not.toBeNull();
    await page.runPerformance(); await page.readMemory();
    (page.root.querySelector('[data-probe-copy]') as HTMLButtonElement).click(); await new Promise((r) => setTimeout(r, 0));
    expect(copied).toBe(page.text());
    for (const want of ['commit: abc123', 'pack: pack-digest-1', 'device: iPhone test', 'dpr: 3 · viewport: 390×844', 'PERFORMANCE heaviest (Centipede,Chimpanzee', 'PERFORMANCE ordinary (Civet,Wolf',
      '(budget ≥ 57)', '(budget p95 ≤ 25, max ≤ 100)', 'frame budget 16.67 ms', 'MEMORY', 'JS heap: unavailable', 'limit 8']) expect(copied).toContain(want);
    expect(copied).toBe(formatDeviceProbeSectionsV1({ commit: 'abc123', packDigest: 'pack-digest-1', ua: 'iPhone test', dpr: 3, viewport: '390×844' }, { performance: (await runPerformanceProbeV1(fakePort({ stageMs: 4 }))), memory: await readMemoryProbeV1(fakePort()) }));
    page.dispose(); dom.window.close();
  }, 60_000);
  it('without a performance port the page shows only the codec section (the sections are optional)', () => {
    const dom = new JSDOM('<!doctype html><body></body>');
    const page = mountDeviceProbeV1({ doc: dom.window.document, commit: 'x', ua: 'y', createContext: () => { throw new Error('none'); } });
    expect(page.root.querySelector('[data-probe-perf]')).toBeNull(); page.dispose(); dom.window.close();
  });
  it('the sections stay off the default path: main.ts never imports them statically (only the flag-gated probe does)', () => {
    const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
    expect(/from\s+['"]\.\/device-probe-performance\.js['"]/u.test(main)).toBe(false);
    expect(/import\(\s*['"]\.\/device-probe-performance\.js['"]\s*\)/u.test(main)).toBe(false);
    const probe = readFileSync(new URL('../apps/game/src/device-probe.ts', import.meta.url), 'utf8');
    expect(/from '\.\/device-probe-performance\.js'/u.test(probe)).toBe(true);
  });
});
