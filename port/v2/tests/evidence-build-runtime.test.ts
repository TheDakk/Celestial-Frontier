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
  it('applies the real pilot callback only to presentation, restores native layers on route/fallback and keeps ordinary sync lazy', () => {
    const setPresentation = vi.fn();
    const currentShipVisualState = vi.fn(() => ({ chassisStage: 0 }));
    const env = {
      nav: { mode: 'surface' }, world: { visible: true },
      surfaceVistaSprite: { visible: true } as { visible: boolean } | null,
      engineeringPanelReleased: false, engineeringPanelController: { setPresentation },
      currentShipVisualState, currentTameGreetingRouteKey: () => 'earth',
      motionOK: () => true, save: { fxOn: true },
    };
    type Presentation = { enhanced: boolean; surfaceVisible: boolean; starterScoutImageUrl: string | null };
    type Api = { present(state: Presentation): void; apply(): void; sync(): void; reset(): void };
    const api = appSection<Api>('let audiovisualPilot: AudiovisualPilot | null = null;', '\nconst cam =',
      '{ present: applyAudiovisualPilotPresentation, apply: applyAudiovisualPilotSceneVisibility, sync: syncAudiovisualPilot, reset: resetAudiovisualPilotPresentation }', false, env);
    api.sync();
    expect(currentShipVisualState).not.toHaveBeenCalled();
    expect(setPresentation).not.toHaveBeenCalled();
    const candidate = { enhanced: true, surfaceVisible: true, starterScoutImageUrl: '/assets/scout.webp' };
    api.present(candidate);
    expect(env.world.visible).toBe(false); expect(env.surfaceVistaSprite!.visible).toBe(false);
    expect(setPresentation).toHaveBeenLastCalledWith({ mode: 'audiovisual-pilot', starterScoutImageUrl: '/assets/scout.webp' });
    env.surfaceVistaSprite = { visible: true }; api.apply();
    expect(env.surfaceVistaSprite.visible).toBe(false);
    for (const mode of ['system', 'galaxy', 'universe']) {
      env.nav.mode = mode; api.apply();
      expect(env.world.visible, mode).toBe(true); expect(env.surfaceVistaSprite.visible, mode).toBe(true);
    }
    env.nav.mode = 'surface'; api.apply();
    expect(env.world.visible).toBe(false);
    for (const fallback of [
      { ...candidate, surfaceVisible: false },
      { ...candidate, enhanced: false },
      { enhanced: false, surfaceVisible: false, starterScoutImageUrl: null },
    ]) {
      api.present(fallback);
      expect(env.world.visible).toBe(true); expect(env.surfaceVistaSprite.visible).toBe(true);
      api.present(candidate);
    }
    api.present({ ...candidate, starterScoutImageUrl: null });
    expect(setPresentation).toHaveBeenLastCalledWith({ mode: 'audiovisual-pilot' });
    expect(setPresentation.mock.lastCall![0]).not.toHaveProperty('starterScoutImageUrl');
    api.reset();
    expect(env.world.visible).toBe(true); expect(env.surfaceVistaSprite.visible).toBe(true);
    expect(setPresentation).toHaveBeenLastCalledWith(null);
    const calls = setPresentation.mock.calls.length;
    env.engineeringPanelReleased = true; env.surfaceVistaSprite = null;
    api.reset();
    expect(setPresentation).toHaveBeenCalledTimes(calls);
    expect(env.world.visible).toBe(true);
  });

  it('resets the exact vista request binding at the real rendered-scene boundary', () => {
    const env = {
      nav: { mode: 'surface', gal: {}, star: {}, planet: {} }, world: { visible: true },
      surfaceVistaSprite: null,
      currentShipVisualState: () => ({ chassisStage: 0 }), currentTameGreetingRouteKey: () => 'earth',
      motionOK: () => true, save: { fxOn: true },
      renderedSceneReceipt: { serial: 8 }, currentEcologyEpoch: () => 2,
      getProvenGalaxyKey: () => 'galaxy', getProvenStarKey: () => 'star', getProvenPlanetKey: () => 'earth',
    };
    type Api = { bind(binding: string): void; snapshot(): { vistaBinding: string | null; vistaReady: boolean; biomeKey: string | null }; record(state: unknown): void };
    const api = appSection<Api>('let audiovisualPilot: AudiovisualPilot | null = null;', '\nconst cam =',
      '{ bind(binding) { audiovisualPilotVistaBinding = binding; audiovisualPilotVistaReady = true; audiovisualPilotBiomeKey = "temperate"; }, snapshot: pilotSceneSnapshot, record: recordRenderedScene }', false, env);
    const binding = JSON.stringify({ worldKey: 'earth', environmentFingerprint: 'environment', profileDigest: 'profile', scene: 'biome', options: { water: 'liquid' } });
    api.bind(binding);
    expect(api.snapshot()).toMatchObject({ vistaBinding: binding, vistaReady: true, biomeKey: 'temperate' });
    api.record(env.nav);
    expect(api.snapshot()).toMatchObject({ vistaBinding: null, vistaReady: false, biomeKey: null });
    expect(env.renderedSceneReceipt).toMatchObject({ serial: 9, mode: 'surface', worldKey: 'earth', ecologyEpoch: 2 });
  });


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
