import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const start = source.indexOf('async function landWithPilotPresentation(');
const end = source.indexOf("\ncard.addEventListener('click', async (e) => {", start);
if (start < 0 || end < start) throw new Error('Native landing presentation owner not found');
const transformed = transformSync('pilot-landing-action.ts', source.slice(start, end));
if (transformed.errors.length) throw new Error(JSON.stringify(transformed.errors));
const executable = transformed.code;

function setup() {
  const surface = { mode: 'surface', gal: 'g', star: 's', planet: 'p' };
  const destination = { key: 'CF1|g:999@90,-60|s:424242@560,170|p:133#2' };
  const finish = vi.fn(), cancel = vi.fn(), sync = vi.fn();
  const beginLanding = vi.fn(() => ({ finish, cancel }));
  const pilot = { beginLanding, sync };
  const runtime = { revision: 10 };
  const snapshot = { mode: 'surface', routeKey: destination.key };
  let resolve!: (result: boolean) => void, reject!: (error: Error) => void;
  const action = new Promise<boolean>((yes, no) => { resolve = yes; reject = no; });
  const doLand = vi.fn(() => action);
  const state = {
    audiovisualPilot: pilot as typeof pilot | null,
    nav: { mode: 'system' },
    activeCardPlanetState: vi.fn(() => surface),
    canonicalWorldAddressForNav: vi.fn(() => destination),
    f4Runtime: runtime as typeof runtime | null,
    renderedSceneReceipt: { serial: 4, mode: 'system', ecologyEpoch: 8, galaxyKey: 'g', starKey: 's', worldKey: null as string | null },
    trainingActive: vi.fn(() => false), trainingCheckpointWriteHeld: false,
    doLand, pilotSceneSnapshot: vi.fn(() => snapshot),
    lastArc0LandingOutcome: null as string | null,
    f4RuntimeMayMutate: vi.fn(() => true),
    replacementTransaction: null as object | null, replacementReloadPending: false,
    importWriteInFlight: false, worldIdentityProtection: null as string | null, savedRouteWriteHeld: false,
    currentEcologyEpoch: vi.fn(() => 8),
    getProvenGalaxyKey: (value: string) => value,
    getProvenStarKey: (value: string) => value,
    getProvenPlanetKey: (value: string) => value,
    tameGreetingAudioOwner: { syncRoute: vi.fn() },
  };
  const run = runInNewContext(`${executable}\nlandWithPilotPresentation;`, state) as (trusted: boolean) => Promise<boolean>;
  const publish = (): void => {
    runtime.revision = 11;
    state.lastArc0LandingOutcome = 'committed:11';
    state.nav = surface;
    state.renderedSceneReceipt = { serial: 5, mode: 'surface', ecologyEpoch: 8, galaxyKey: 'g', starKey: 's', worldKey: 'p' };
  };
  return { state, snapshot, pilot, runtime, finish, cancel, sync, beginLanding, doLand, resolve, reject, run, publish, destination };
}

describe('native Landing audiovisual publication', () => {
  it('uses the native event through the actual card handler and keeps the keyboard outcome', () => {
    expect(source).toContain("} else if (a === 'landcta') {\n    const landed = await landWithPilotPresentation(e.isTrusted);");
    expect(source).toContain("if (landed && keyboard) card.querySelector<HTMLElement>('[data-act=\"leaveworld\"]')?.focus();");
  });
  it('captures before persistence, then finishes exactly once only after durable scene publication', async () => {
    const s = setup(); const result = s.run(true);
    expect(s.beginLanding).toHaveBeenCalledExactlyOnceWith(s.destination.key, true);
    expect(s.beginLanding.mock.invocationCallOrder[0]).toBeLessThan(s.doLand.mock.invocationCallOrder[0]!);
    expect(s.finish).not.toHaveBeenCalled();
    s.publish(); s.resolve(true);
    expect(await result).toBe(true);
    expect(s.state.tameGreetingAudioOwner.syncRoute).toHaveBeenCalledExactlyOnceWith(s.destination.key);
    expect(s.sync).toHaveBeenCalledExactlyOnceWith(s.snapshot);
    expect(s.sync.mock.invocationCallOrder[0]).toBeLessThan(s.finish.mock.invocationCallOrder[0]!);
    expect(s.finish).toHaveBeenCalledExactlyOnceWith(s.snapshot);
    expect(s.cancel).not.toHaveBeenCalled();
  });
  it.each([
    'wave-off', 'training-route-only', 'committed-publication-reload', 'committed-convergence:reload', 'refused:storage',
  ])('cannot turn %s into a successful audiovisual landing even when action returns true', async (outcome) => {
    const s = setup(); const result = s.run(true); s.publish();
    s.state.lastArc0LandingOutcome = outcome; s.resolve(true);
    expect(await result).toBe(true); expect(s.finish).toHaveBeenCalledExactlyOnceWith(null);
    expect(s.state.tameGreetingAudioOwner.syncRoute).not.toHaveBeenCalled();
  });
  it.each([
    ['old scene', (s: ReturnType<typeof setup>) => { s.state.renderedSceneReceipt.serial = 4; }],
    ['wrong rendered world', (s: ReturnType<typeof setup>) => { s.state.renderedSceneReceipt.worldKey = 'other'; }],
    ['wrong rendered star', (s: ReturnType<typeof setup>) => { s.state.renderedSceneReceipt.starKey = 'other'; }],
    ['wrong rendered galaxy', (s: ReturnType<typeof setup>) => { s.state.renderedSceneReceipt.galaxyKey = 'other'; }],
    ['wrong rendered mode', (s: ReturnType<typeof setup>) => { s.state.renderedSceneReceipt.mode = 'system'; }],
    ['stale ecology', (s: ReturnType<typeof setup>) => { s.state.renderedSceneReceipt.ecologyEpoch = 7; }],
    ['wrong route', (s: ReturnType<typeof setup>) => { s.snapshot.routeKey = 'other'; }],
    ['wrong snapshot mode', (s: ReturnType<typeof setup>) => { s.snapshot.mode = 'system'; }],
    ['old durable revision', (s: ReturnType<typeof setup>) => { s.runtime.revision = 10; s.state.lastArc0LandingOutcome = 'committed:10'; }],
    ['replaced runtime', (s: ReturnType<typeof setup>) => { s.state.f4Runtime = { revision: 11 }; }],
    ['closed pilot', (s: ReturnType<typeof setup>) => { s.state.audiovisualPilot = null; }],
    ['training', (s: ReturnType<typeof setup>) => { s.state.trainingActive.mockReturnValue(true); }],
    ['held training', (s: ReturnType<typeof setup>) => { s.state.trainingCheckpointWriteHeld = true; }],
    ['reload', (s: ReturnType<typeof setup>) => { s.state.replacementReloadPending = true; }],
    ['replacement', (s: ReturnType<typeof setup>) => { s.state.replacementTransaction = {}; }],
    ['import', (s: ReturnType<typeof setup>) => { s.state.importWriteInFlight = true; }],
    ['read-only', (s: ReturnType<typeof setup>) => { s.state.f4RuntimeMayMutate.mockReturnValue(false); }],
    ['unpublished identity', (s: ReturnType<typeof setup>) => { s.state.worldIdentityProtection = 'committed-publication-reload'; }],
    ['held route', (s: ReturnType<typeof setup>) => { s.state.savedRouteWriteHeld = true; }],
  ])('rejects %s after the await without changing the gameplay result', async (_name, mutate) => {
    const s = setup(); const result = s.run(true); s.publish(); mutate(s); s.resolve(true);
    expect(await result).toBe(true); expect(s.finish).toHaveBeenCalledExactlyOnceWith(null);
  });
  it('keeps refused and untrusted actions quiet', async () => {
    for (const [trusted, landed] of [[true, false], [false, true]] as const) {
      const s = setup(); const result = s.run(trusted); s.publish(); s.resolve(landed);
      expect(await result).toBe(landed); expect(s.finish).toHaveBeenCalledExactlyOnceWith(null);
    }
  });
  it('never arms pilot presentation for Training or an absent pilot', async () => {
    for (const training of [true, false]) {
      const s = setup(); s.state.trainingActive.mockReturnValue(training);
      if (!training) s.state.audiovisualPilot = null;
      const result = s.run(true); s.resolve(true);
      expect(await result).toBe(true); expect(s.beginLanding).not.toHaveBeenCalled();
      expect(s.finish).not.toHaveBeenCalled(); expect(s.doLand).toHaveBeenCalledOnce();
    }
  });
  it('cancels on thrown gameplay failure while preserving the original error', async () => {
    const s = setup(); const result = s.run(true); const error = new Error('durable action failed');
    s.reject(error); await expect(result).rejects.toBe(error);
    expect(s.cancel).toHaveBeenCalledOnce(); expect(s.finish).not.toHaveBeenCalled();
  });
  it('keeps optional media faults from changing a landed result', async () => {
    const s = setup(); s.sync.mockImplementation(() => { throw new Error('media failed'); });
    const result = s.run(true); s.publish(); s.resolve(true);
    expect(await result).toBe(true); expect(s.cancel).toHaveBeenCalledOnce();
    expect(s.finish).not.toHaveBeenCalled();
  });
});
