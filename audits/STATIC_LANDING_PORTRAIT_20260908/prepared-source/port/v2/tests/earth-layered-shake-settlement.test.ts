import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';

const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const START = 'function triggerCameraShake(): void {';
const END = '\nfunction applyGlass(): void {';
if (main.split(START).length !== 2 || main.split(END).length !== 2) {
  throw new Error('Expected one exact native camera-shake owner and successor');
}
const begin = main.indexOf(START), end = main.indexOf(END);
if (end <= begin) throw new Error('Camera-shake source boundaries are reversed');
const owner = main.slice(begin, end);
const EARTH = 'painted-earth-riverbank-v1';
const STILL = 'painted-earth-civet-landing-v1';
const REST_Y = 475.75;
const TRANSIENT_TOP = 0.01222168374807;
type Outcome = 'completed' | 'rejected';
function controlledAnimation() {
  let resolve!: () => void, reject!: (reason: unknown) => void;
  const finished = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { finished, resolve, reject };
}
function fixture(source = owner) {
  const compiled = transformSync('earth-layered-shake-owner.ts', source);
  if (compiled.errors.length) throw new Error(JSON.stringify(compiled.errors));
  const animations: ReturnType<typeof controlledAnimation>[] = [];
  const policy = { shake: { mode: 'standard', maximumConcurrentImpulses: 2 } };
  const activeCameraShakes = new Set<ReturnType<typeof controlledAnimation>>();
  // This models the measured canvas translation and the pair's existing
  // placement. It tests the actual owner's settlement call, not browser layout.
  const geometry = { canvasTop: TRANSIENT_TOP, pairY: REST_Y - TRANSIENT_TOP };
  const syncStates: Array<{ active: number; canvasTop: number; variant: string | null }> = [];
  const animate = vi.fn((_keyframes: unknown, _options: unknown) => {
    const animation = controlledAnimation(); animations.push(animation); return animation;
  });
  const canvas: { animate?: typeof animate } = { animate };
  const state = {
    activeCameraShakes, app: { canvas }, currentCameraShakePolicy: () => policy,
    surfaceVistaArtVariant: EARTH as string | null, EARTH_LAYERED_SCENE_ID: EARTH,
    PAINTED_EARTH_LANDING_ID: STILL,
    syncSurfaceVistaPresentation: vi.fn((): void => {
      syncStates.push({ active: activeCameraShakes.size, canvasTop: geometry.canvasTop,
        variant: state.surfaceVistaArtVariant });
      geometry.pairY = REST_Y - geometry.canvasTop;
    }),
  };
  const trigger = runInNewContext(compiled.code + '\ntriggerCameraShake;', state) as () => void;
  const settle = async (index: number, outcome: Outcome, canvasTop = 0): Promise<void> => {
    const animation = animations[index];
    if (!animation) throw new Error('Requested animation was not created');
    geometry.canvasTop = canvasTop;
    if (outcome === 'completed') animation.resolve(); else animation.reject(new Error('animation cancelled'));
    await animation.finished.catch(() => undefined);
    await Promise.resolve();
  };
  return { state, policy, animate, animations, geometry, syncStates, trigger, settle };
}
function assertRestingPair(f: ReturnType<typeof fixture>): void {
  if (f.state.activeCameraShakes.size !== 0 || f.geometry.canvasTop !== 0) {
    throw new Error('Animation has not reached its resting input state');
  }
  if (Math.abs(f.geometry.pairY - REST_Y) > 1e-9) {
    throw new Error('Earth pair retained a transient canvas offset after camera shake');
  }
}

describe('Earth layer settlement in the native camera-shake owner', () => {
  it.each(['completed', 'rejected'] as const)('re-measures live Earth after the final animation is %s', async outcome => {
    const f = fixture(); f.trigger();
    expect(f.animate).toHaveBeenCalledOnce(); expect(f.state.activeCameraShakes.has(f.animations[0]!)).toBe(true);
    expect(f.state.syncSurfaceVistaPresentation).not.toHaveBeenCalled();
    expect(f.geometry.pairY).not.toBe(REST_Y);
    await f.settle(0, outcome);
    expect(f.state.syncSurfaceVistaPresentation).toHaveBeenCalledOnce();
    expect(f.syncStates).toEqual([{ active: 0, canvasTop: 0, variant: EARTH }]);
    expect(() => assertRestingPair(f)).not.toThrow();
  });

  it.each(['completed', 'rejected'] as const)('re-measures the static Earth painting after the last impulse is %s', async outcome => {
    const f = fixture(); f.state.surfaceVistaArtVariant = STILL; f.trigger();
    expect(f.geometry.pairY).not.toBe(REST_Y);
    await f.settle(0, outcome);
    expect(f.state.syncSurfaceVistaPresentation).toHaveBeenCalledOnce();
    expect(f.syncStates).toEqual([{ active: 0, canvasTop: 0, variant: STILL }]);
    expect(() => assertRestingPair(f)).not.toThrow();
  });

  it.each(['completed', 'rejected'] as const)('waits for all concurrent impulses before %s final settlement', async outcome => {
    const f = fixture(); f.trigger(); f.trigger(); f.trigger();
    expect(f.animate).toHaveBeenCalledTimes(2); expect(f.state.activeCameraShakes.size).toBe(2);
    await f.settle(0, 'completed', 0.5);
    expect(f.state.activeCameraShakes.size).toBe(1);
    expect(f.state.activeCameraShakes.has(f.animations[1]!)).toBe(true);
    expect(f.state.syncSurfaceVistaPresentation).not.toHaveBeenCalled();
    await f.settle(1, outcome);
    expect(f.state.syncSurfaceVistaPresentation).toHaveBeenCalledOnce();
    expect(f.syncStates).toEqual([{ active: 0, canvasTop: 0, variant: EARTH }]);
    expect(() => assertRestingPair(f)).not.toThrow();
  });

  it.each(['canonical-v1', 'painted-mars-dunesea-v1', null])('does not re-measure a different live art owner (%s)', async variant => {
    const f = fixture(); f.trigger(); f.state.surfaceVistaArtVariant = variant;
    const originalY = f.geometry.pairY;
    await f.settle(0, 'completed');
    expect(f.state.activeCameraShakes.size).toBe(0);
    expect(f.state.syncSurfaceVistaPresentation).not.toHaveBeenCalled();
    expect(f.geometry.pairY).toBe(originalY);
  });

  it('uses the live Earth owner at completion rather than the scene that started the impulse', async () => {
    const f = fixture(); f.state.surfaceVistaArtVariant = 'canonical-v1'; f.trigger();
    f.state.surfaceVistaArtVariant = EARTH;
    await f.settle(0, 'completed');
    expect(f.state.syncSurfaceVistaPresentation).toHaveBeenCalledOnce();
    expect(() => assertRestingPair(f)).not.toThrow();
  });

  it.each(['disabled', 'unavailable', 'constructor failure'] as const)('keeps the %s animation fallback quiet', fallback => {
    const f = fixture();
    if (fallback === 'disabled') f.policy.shake.mode = 'off';
    if (fallback === 'unavailable') delete f.state.app.canvas.animate;
    if (fallback === 'constructor failure') f.animate.mockImplementation(() => { throw new Error('animation unavailable'); });
    expect(() => f.trigger()).not.toThrow();
    expect(f.state.activeCameraShakes.size).toBe(0); expect(f.animations).toHaveLength(0);
    expect(f.state.syncSurfaceVistaPresentation).not.toHaveBeenCalled();
    expect(f.animate).toHaveBeenCalledTimes(fallback === 'constructor failure' ? 1 : 0);
  });

  it('rejects the stale resting placement when the actual completion sync is removed', async () => {
    const seam = '      syncSurfaceVistaPresentation();';
    expect(owner.split(seam)).toHaveLength(2);
    const good = fixture(); good.trigger(); await good.settle(0, 'completed');
    expect(() => assertRestingPair(good)).not.toThrow();
    // Alter only the extracted test copy. The same outcome guard must reject
    // a finished animation whose pair still carries the transient translation.
    const mutant = fixture(owner.replace(seam, '      /* settlement sync removed by negative control */'));
    mutant.trigger(); await mutant.settle(0, 'completed');
    expect(mutant.state.activeCameraShakes.size).toBe(0); expect(mutant.geometry.canvasTop).toBe(0);
    expect(mutant.state.syncSurfaceVistaPresentation).not.toHaveBeenCalled();
    expect(() => assertRestingPair(mutant)).toThrow('Earth pair retained a transient canvas offset');
  });
});
