import { readFileSync } from 'node:fs';
import { minifySync, transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';

const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const bindings = [
  '__CF_SLICE__', '__cfF4StartHidden', '__cfF4AuthorityConvergenceWitness',
  '__cfRejectArc2ProductBootstrap', '__cfRejectArc3EngineeringBootstrap',
  '__cfBootPhaseWitness', '__cfReloadReleaseWitness', '__cfImportPhaseWitness',
  '__cfTrainingRestoreWitness', '__cfF4FreshInitRaceGate', '__cfSliceReadyWitness',
] as const;

function compile(source: string, evidence: boolean): string {
  const transformed = transformSync('main.ts', source, {
    define: { __CF_EVIDENCE_BUILD__: String(evidence) },
  });
  if (transformed.errors.length) throw new Error(JSON.stringify(transformed.errors));
  return transformed.code;
}

// Execute exact shipped declarations with injected dependencies, not a copied
// behavioral model. This is a single-file transform, not another app build.
function appSection<T>(start: string, end: string, result: string, evidence: boolean,
  env: Record<string, unknown> = {}): T {
  const left = main.indexOf(start);
  const right = main.indexOf(end, left);
  if (left < 0 || right <= left || main.indexOf(start, left + 1) !== -1) {
    throw new Error(`Missing or nonunique source section: ${start}`);
  }
  return new Function('env', `with (env) { ${compile(main.slice(left, right), evidence)}; return ${result}; }`)(env);
}

async function awaitTrace(operation: () => Promise<void>): Promise<string[]> {
  const trace = ['before'];
  const result = (async () => { await operation(); trace.push('resumed'); })();
  trace.push('caller');
  await result;
  return trace;
}

describe('explicit evidence-build runtime isolation', () => {
  it('eliminates external hooks and destructive implementations only from ordinary output', () => {
    const ordinary = minifySync('main.js', compile(main, false)).code;
    const evidence = minifySync('main.js', compile(main, true)).code;
    // Evidence is the positive control: absence must not mean dead source or a
    // vacuous search. The full artifact is independently inspected at build time.
    for (const marker of [...bindings, 'slice-smoke injected',
      'slice-smoke Arc 0 landing stale injection became',
      'cf-v2-f4-smoke-outcome/v1', 'cf_slice_f4_fresh_race_release']) {
      expect(ordinary, marker).not.toContain(marker);
      expect(evidence, marker).toContain(marker);
    }
    expect(ordinary).toContain('__CF_DEV_PREVIEW__');
    expect(evidence).toContain('__CF_DEV_PREVIEW__');
  });

  it('uses the native backend and its exact promises in ordinary mode; evidence faults remain one-shot', async () => {
    const read = Promise.resolve('stored');
    const written = Promise.resolve({ applied: true });
    const native = {
      get: vi.fn(() => read), compareAndApply: vi.fn(() => written),
      apply: vi.fn(), keys: vi.fn(), clear: vi.fn(),
    };
    const env = {
      indexedDBPersistenceBackend: native, F3_ACTIVE_PLAY_LEASE_KEY: 'lease',
      smokeF4LeaseReadCount: 0, smokeRejectNextF4HeartbeatStorage: true,
      smokeRejectArc0LandingStorageBoundary: false, smokeRejectArc3StorageBoundary: true,
      smokeRejectArc4StorageBoundary: false, smokeRejectArc5FeedStorageBoundary: false,
    };
    type Backend = { get(store: string, key: string): Promise<unknown>;
      compareAndApply(checks: unknown[], operations: unknown[], clear?: unknown[]): Promise<unknown> };
    const load = (mode: boolean) => appSection<Backend>(
      'const persistenceBackend: StorageBackend =',
      '\nconst repo = createSaveRepository(persistenceBackend);', 'persistenceBackend', mode, env);
    const ordinary = load(false);
    expect(ordinary).toBe(native);
    expect(ordinary.get('meta', 'lease')).toBe(read);
    expect(ordinary.compareAndApply([], [])).toBe(written);
    expect(env.smokeF4LeaseReadCount).toBe(0);
    expect(env.smokeRejectNextF4HeartbeatStorage).toBe(true);
    const evidence = load(true);
    await expect(evidence.get('meta', 'lease')).rejects.toThrow('heartbeat lease storage failure');
    expect(evidence.get('meta', 'lease')).toBe(read);
    expect(env.smokeF4LeaseReadCount).toBe(2);
    await expect(evidence.compareAndApply([], [])).rejects.toThrow('Arc 3 action storage failure');
    expect(evidence.compareAndApply([], [])).toBe(written);
  });

  it('keeps the unarmed async boundary without constructing an armable owner in ordinary mode', async () => {
    const factory = vi.fn(createProductActionDiagnosticHold);
    const load = (mode: boolean) => appSection<ReturnType<typeof createProductActionDiagnosticHold>>(
      'const inactiveEvidenceHold:', '\nlet lastF4HeartbeatStorageFault:',
      'smokeF4ConvergenceReloadHold', mode, { createProductActionDiagnosticHold: factory });
    const ordinary = load(false);
    expect(factory).not.toHaveBeenCalled();
    expect(ordinary.arm()).toBe(false);
    expect(ordinary.release()).toBe(false);
    const evidence = load(true);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(await awaitTrace(() => ordinary.holdIfArmed('landing')))
      .toEqual(await awaitTrace(() => evidence.holdIfArmed('landing')));
    expect(evidence.arm()).toBe(true);
    let settled = false;
    const held = evidence.holdIfArmed('landing').then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(evidence.release()).toBe(true);
    await held;
    expect(settled).toBe(true);
    expect(ordinary.diagnostics().phase).toBe('idle');
  });

  it('ignores fresh-initialization race bindings in ordinary mode while retaining its awaited turn', async () => {
    const getter = vi.fn(() => undefined);
    const window = Object.defineProperty({}, '__cfF4FreshInitRaceGate', { get: getter });
    const load = (mode: boolean) => appSection<() => Promise<void>>(
      'async function awaitSmokeFreshInitializationRaceGate()', '\nfunction bootRouteProjection(',
      'awaitSmokeFreshInitializationRaceGate', mode, { window });
    const ordinaryTrace = await awaitTrace(load(false));
    expect(getter).not.toHaveBeenCalled();
    expect(await awaitTrace(load(true))).toEqual(ordinaryTrace);
    expect(ordinaryTrace).toEqual(['before', 'caller', 'resumed']);
    expect(getter).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('retains frame → task → answerability → art → pilot activation (evidence=%s)', (mode) => {
    const trace: string[] = [];
    const frames: Array<() => void> = [];
    const tasks: Array<() => void> = [];
    const getter = vi.fn(() => undefined);
    const ready = appSection<() => void>('  const emitBootReady = (): void => {',
      "\n  if (document.readyState === 'complete')", 'emitBootReady', mode, {
        tickerTicks: 1, requestAnimationFrame: (callback: () => void) => { frames.push(callback); },
        setTimeout: (callback: () => void) => { tasks.push(callback); }, emitBootPhase: () => {},
        f4Runtime: { setAnswerable: () => { trace.push('answerable'); } }, f4RuntimeMayAnswer: () => true,
        speciesArtLoader: { activate: () => { trace.push('art'); } },
        startAudiovisualPilot: () => { trace.push('pilot'); },
        window: Object.defineProperty({}, '__cfSliceReadyWitness', { get: getter }),
      });
    ready();
    expect(trace).toEqual([]);
    expect(tasks).toHaveLength(0);
    expect(frames).toHaveLength(1);
    frames.shift()!();
    expect(trace).toEqual([]);
    expect(tasks).toHaveLength(1);
    tasks.shift()!();
    expect(trace).toEqual(['answerable', 'art', 'pilot']);
    expect(getter).toHaveBeenCalledTimes(mode ? 1 : 0);
  });
});
