import { describe, expect, it, vi } from 'vitest';
import type { Portrait440 } from '@cf/art/species-broker';
import { speciesVisualKey, type SpeciesVisualKey } from '@cf/art/species-identity';
import {
  LivingSpeciesPreviewControllerV1,
  isLivingSpeciesMotionPlanV1,
  projectLivingSpeciesFrameV1,
  projectLivingSpeciesMotionV1,
  type LivingSpeciesMotionFrameV1,
  type LivingSpeciesMotionPlanV1,
  type LivingSpeciesPortraitListenerV1,
  type LivingSpeciesPortraitRequesterV1,
  type LivingSpeciesPreviewEnvironmentV1,
  type LivingSpeciesPreviewRendererV1,
  type LivingSpeciesPreviewTickerV1,
} from '../apps/game/src/living-species-preview.js';

function genome(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    seed: 0x51a7,
    kingdom: 'fauna',
    color: 2,
    form: 3,
    body: 0,
    loco: 0,
    trait: 4,
    size: 2,
    diet: 1,
    head: 3,
    limbs: 2,
    skin: 1,
    tail: 4,
    pattern: 2,
    eyes: 1,
    behavior: 3,
    habitat: 2,
    detail: 4,
    accent: 8,
    temper: 1,
    sense: 4,
    repro: 2,
    life: 3,
    metab: 1,
    lumin: false,
    gen: 0,
    heat: 1,
    ...overrides,
  };
}

function portrait(
  key: SpeciesVisualKey,
  overrides: Partial<Portrait440> = {},
): Portrait440 {
  return Object.freeze({
    key,
    url: 'data:image/png;base64,bGl2aW5nLXByZXZpZXc=',
    width: 440,
    height: 440,
    encodedBytes: 48,
    decodedPixels: 440 * 440,
    ...overrides,
  }) as Portrait440;
}

class FakeEnvironment implements LivingSpeciesPreviewEnvironmentV1 {
  state = { connected: true, visible: true, reducedMotion: false };
  readonly listeners = new Set<() => void>();
  subscriptions = 0;
  releases = 0;

  snapshot = () => ({ ...this.state });

  subscribe = (listener: () => void): (() => void) => {
    this.subscriptions++;
    this.listeners.add(listener);
    let live = true;
    return () => {
      if (!live) return;
      live = false;
      this.releases++;
      this.listeners.delete(listener);
    };
  };

  set(next: Partial<typeof this.state>): void {
    Object.assign(this.state, next);
    for (const listener of [...this.listeners]) listener();
  }
}

class FakeTicker implements LivingSpeciesPreviewTickerV1 {
  readonly entries: Array<{
    listener: (deltaMs: number) => void;
    live: boolean;
  }> = [];
  subscriptions = 0;
  releases = 0;

  subscribe = (listener: (deltaMs: number) => void): (() => void) => {
    this.subscriptions++;
    const entry = { listener, live: true };
    this.entries.push(entry);
    return () => {
      if (!entry.live) return;
      entry.live = false;
      this.releases++;
    };
  };

  tick(deltaMs: number): void {
    for (const entry of [...this.entries]) if (entry.live) entry.listener(deltaMs);
  }

  staleTick(index: number, deltaMs: number): void {
    this.entries[index]?.listener(deltaMs);
  }
}

interface PortraitCall {
  readonly owner: string;
  readonly genome: Record<string, unknown>;
  readonly key: SpeciesVisualKey;
  readonly listener: LivingSpeciesPortraitListenerV1;
  cancelCount: number;
}

class FakePortraitSource {
  readonly calls: PortraitCall[] = [];
  currentFactory: ((key: SpeciesVisualKey) => Portrait440 | null) | null = null;
  synchronous: Array<Readonly<{ asset: Portrait440 | null; error?: unknown }>> = [];

  request: LivingSpeciesPortraitRequesterV1 = (owner, source, listener) => {
    const key = speciesVisualKey(source);
    const call: PortraitCall = {
      owner,
      genome: source,
      key,
      listener,
      cancelCount: 0,
    };
    this.calls.push(call);
    for (const completion of this.synchronous) {
      listener(completion.asset, completion.error);
    }
    const current = this.currentFactory?.(key) ?? null;
    return {
      key,
      current,
      cancel: () => { call.cancelCount++; },
    };
  };

  succeed(index: number, asset = portrait(this.calls[index]!.key)): void {
    this.calls[index]!.listener(asset);
  }

  fail(index: number, error: unknown): void {
    this.calls[index]!.listener(null, error);
  }
}

class FakeRenderer implements LivingSpeciesPreviewRendererV1 {
  readonly frames: LivingSpeciesMotionFrameV1[] = [];
  attachCount = 0;
  destroyCount = 0;
  drawError: Error | null = null;

  constructor(
    readonly identityKey: SpeciesVisualKey,
    readonly resourceKind: LivingSpeciesPreviewRendererV1['resourceKind'],
    private readonly factory: FakeRendererFactory,
  ) {}

  attach(): void {
    this.attachCount++;
    this.factory.onAttach?.(this);
  }

  draw(frame: LivingSpeciesMotionFrameV1): void {
    if (this.drawError) throw this.drawError;
    this.frames.push(frame);
  }

  destroy(): void {
    this.destroyCount++;
    if (this.resourceKind === 'image') this.factory.activeImages--;
    if (this.resourceKind === 'texture') this.factory.activeTextures--;
    if (this.resourceKind === 'canvas') this.factory.activeCanvases--;
  }
}

class FakeRendererFactory {
  readonly handles: FakeRenderer[] = [];
  activeImages = 0;
  activeTextures = 0;
  activeCanvases = 0;
  peakImages = 0;
  peakTextures = 0;
  peakCanvases = 0;
  resourceKind: LivingSpeciesPreviewRendererV1['resourceKind'] = 'image';
  onAfterCreate: ((handle: FakeRenderer) => void) | null = null;
  onAttach: ((handle: FakeRenderer) => void) | null = null;

  create = (
    asset: Portrait440,
    plan: LivingSpeciesMotionPlanV1,
    _generation: number,
  ): LivingSpeciesPreviewRendererV1 => {
    expect(String(asset.key)).toBe(String(plan.identityKey));
    const handle = new FakeRenderer(plan.identityKey, this.resourceKind, this);
    this.handles.push(handle);
    if (this.resourceKind === 'image') this.activeImages++;
    if (this.resourceKind === 'texture') this.activeTextures++;
    if (this.resourceKind === 'canvas') this.activeCanvases++;
    this.peakImages = Math.max(this.peakImages, this.activeImages);
    this.peakTextures = Math.max(this.peakTextures, this.activeTextures);
    this.peakCanvases = Math.max(this.peakCanvases, this.activeCanvases);
    this.onAfterCreate?.(handle);
    return handle;
  };
}

function harness(environment = new FakeEnvironment()): {
  environment: FakeEnvironment;
  ticker: FakeTicker;
  portraits: FakePortraitSource;
  renderers: FakeRendererFactory;
  faults: Error[];
  controller: LivingSpeciesPreviewControllerV1;
} {
  const ticker = new FakeTicker();
  const portraits = new FakePortraitSource();
  const renderers = new FakeRendererFactory();
  const faults: Error[] = [];
  const controller = new LivingSpeciesPreviewControllerV1({
    owner: 'compendium-living-detail',
    requestPortrait: portraits.request,
    createRenderer: renderers.create,
    ticker,
    environment,
    onFault: (error) => { faults.push(error); },
  });
  return { environment, ticker, portraits, renderers, faults, controller };
}

describe('living-species motion plan', () => {
  it('uses complete stable genome identity rather than seed or property order', () => {
    const source = genome({ parents: [11, 22], _anchorVal: 0.71, _earthBlend: 'Wolf' });
    const reordered = Object.fromEntries(Object.entries(source).reverse());
    const first = projectLivingSpeciesMotionV1(source);
    const repeat = projectLivingSpeciesMotionV1(reordered);
    const otherLineage = projectLivingSpeciesMotionV1({
      ...source,
      parents: [22, 11],
    });

    expect(first).toEqual(repeat);
    expect(first.identityKey).toBe(speciesVisualKey(source));
    expect(first.identityKey).not.toBe(otherLineage.identityKey);
    expect(first.channels).not.toEqual(otherLineage.channels);
    expect(isLivingSpeciesMotionPlanV1(first)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.channels.drift)).toBe(true);
  });

  it('selects subtle kingdom/body-aware breathe, sway, pulse, and drift vocabularies', () => {
    const cases = [
      [genome({ kingdom: 'fauna', body: 0, loco: 0 }), 'breathe', 'sturdy-limbed'],
      [genome({ kingdom: 'fauna', body: 4, loco: 0 }), 'sway', 'serpentine'],
      [genome({ kingdom: 'fauna', body: 0, loco: 4 }), 'drift', 'sturdy-limbed'],
      [genome({ kingdom: 'fauna', body: 9, loco: 0 }), 'pulse', 'gelatinous'],
      [genome({ kingdom: 'flora', form: 3 }), 'sway', 'reed thickets'],
      [genome({ kingdom: 'fungi', form: 2 }), 'pulse', 'puffball fields'],
      [genome({ kingdom: 'microbe', form: 8 }), 'drift', 'magnetotactic swarms'],
    ] as const;

    for (const [source, primaryMotion, cue] of cases) {
      const plan = projectLivingSpeciesMotionV1(source);
      expect(plan.primaryMotion).toBe(primaryMotion);
      expect(plan.anatomyCue).toBe(cue);
      expect(plan.channels.breathe.scaleY).toBeGreaterThan(0);
      expect(plan.channels.sway.degrees).toBeGreaterThan(0);
      expect(plan.channels.pulse.scale).toBeGreaterThan(0);
      expect(plan.channels.drift.translateXPx).toBeGreaterThan(0);
    }
  });

  it('never calls ambient randomness and keeps every frame inside the pilot envelope', () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('ambient randomness must not be called');
    });
    try {
      for (const kingdom of ['fauna', 'flora', 'fungi', 'microbe'] as const) {
        const plan = projectLivingSpeciesMotionV1(genome({ kingdom }));
        for (let elapsed = 0; elapsed <= 60_000; elapsed += 137) {
          const frame = projectLivingSpeciesFrameV1(plan, elapsed);
          expect(frame.mode).toBe('animated');
          expect(Math.abs(frame.translateX)).toBeLessThanOrEqual(3);
          expect(Math.abs(frame.translateY)).toBeLessThanOrEqual(2.6);
          expect(Math.abs(frame.rotationDegrees)).toBeLessThanOrEqual(1);
          expect(frame.scaleX).toBeGreaterThanOrEqual(0.98);
          expect(frame.scaleX).toBeLessThanOrEqual(1.02);
          expect(frame.scaleY).toBeGreaterThanOrEqual(0.98);
          expect(frame.scaleY).toBeLessThanOrEqual(1.02);
          expect(frame.opacity).toBeGreaterThanOrEqual(0.99);
          expect(frame.opacity).toBeLessThanOrEqual(1);
        }
      }
    } finally {
      random.mockRestore();
    }
  });

  it('makes Reduced Motion the exact static outcome and refuses malformed identities', () => {
    const plan = projectLivingSpeciesMotionV1(genome());
    expect(projectLivingSpeciesFrameV1(plan, 0, true)).toEqual({
      mode: 'static',
      translateX: 0,
      translateY: 0,
      rotationDegrees: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
    });
    expect(projectLivingSpeciesFrameV1(plan, Number.NaN, true))
      .toBe(projectLivingSpeciesFrameV1(plan, 99_999, true));
    expect(() => projectLivingSpeciesMotionV1(genome({ kingdom: 'mineral' }))).toThrow(/four|fauna/iu);
    expect(() => projectLivingSpeciesMotionV1(genome({ body: Number.NaN }))).toThrow(/body/iu);
    const cyclic = genome();
    cyclic.parents = cyclic;
    expect(() => projectLivingSpeciesMotionV1(cyclic)).toThrow(/cyclic/iu);
    expect(() => projectLivingSpeciesFrameV1({ ...plan }, 0)).toThrow(/registered/iu);
  });
});

describe('living-species preview lifecycle', () => {
  it('attaches one exact 440px asset and advances only through the injected ticker', () => {
    const h = harness();
    const source = genome();
    const selected = h.controller.select(source);
    expect(h.portraits.calls).toHaveLength(1);
    expect(h.controller.diagnostics()).toMatchObject({
      state: 'loading',
      generation: 1,
      identityKey: selected.identityKey,
      live: { portraitRequestCount: 1, rendererCount: 0, tickerCount: 0 },
    });

    h.portraits.succeed(0);
    const renderer = h.renderers.handles[0]!;
    expect(renderer.attachCount).toBe(1);
    expect(renderer.frames).toHaveLength(1);
    expect(renderer.frames[0]?.mode).toBe('animated');
    expect(h.ticker.subscriptions).toBe(1);
    expect(h.controller.diagnostics()).toMatchObject({
      state: 'animating',
      live: {
        portraitRequestCount: 1,
        acceptedAssetCount: 1,
        rendererCount: 1,
        imageCount: 1,
        textureCount: 0,
        canvasCount: 0,
        tickerCount: 1,
      },
      peaks: {
        rendererCount: 1, imageCount: 1, textureCount: 0, canvasCount: 0, tickerCount: 1,
      },
    });

    const before = renderer.frames[0];
    h.ticker.tick(16);
    expect(renderer.frames).toHaveLength(2);
    expect(renderer.frames[1]).not.toEqual(before);
    expect(h.portraits.calls[0]?.genome).not.toBe(source);
  });

  it('rejects duplicate producer publication without allocating or attaching twice', () => {
    const h = harness();
    h.controller.select(genome({ kingdom: 'microbe', form: 8 }));
    h.portraits.succeed(0);

    const renderer = h.renderers.handles[0]!;
    const framesAfterFirstPublication = renderer.frames.length;
    h.portraits.succeed(0);

    expect(h.renderers.handles).toHaveLength(1);
    expect(renderer.attachCount).toBe(1);
    expect(renderer.frames).toHaveLength(framesAfterFirstPublication);
    expect(h.ticker.subscriptions).toBe(1);
    expect(h.controller.diagnostics()).toMatchObject({
      state: 'animating',
      live: {
        acceptedAssetCount: 1,
        rendererCount: 1,
        imageCount: 1,
        textureCount: 0,
        canvasCount: 0,
        tickerCount: 1,
      },
      totals: {
        rendererCreates: 1,
        rendererAttaches: 1,
        invalidCompletions: 1,
      },
    });

    h.controller.close();
    expect(renderer.destroyCount).toBe(1);
    expect(h.portraits.calls[0]?.cancelCount).toBe(1);
    expect(h.ticker.releases).toBe(1);
  });

  it('replaces before allocation, rejects stale completions, and preserves the full snapshot', () => {
    const h = harness();
    const firstGenome = genome({ form: 1, parents: [11, 22] });
    h.controller.select(firstGenome);
    const secondGenome = genome({ form: 2, parents: [22, 11] });
    const second = h.controller.select(secondGenome);
    secondGenome.form = 99;

    expect(h.portraits.calls[0]?.cancelCount).toBe(1);
    expect(h.portraits.calls[1]?.key).toBe(second.identityKey);
    expect(h.portraits.calls[1]?.genome.form).toBe(2);
    h.portraits.succeed(0);
    expect(h.renderers.handles).toHaveLength(0);
    expect(h.controller.diagnostics().totals.staleCompletionDrops).toBe(1);

    h.portraits.succeed(1);
    const secondRenderer = h.renderers.handles[0]!;
    expect(secondRenderer.destroyCount).toBe(0);
    h.controller.select(genome({ form: 7 }));
    expect(secondRenderer.destroyCount).toBe(1);
    expect(h.ticker.releases).toBe(1);
    expect(h.renderers.activeImages).toBe(0);
    expect(h.renderers.activeTextures).toBe(0);
    expect(h.renderers.activeCanvases).toBe(0);
    h.portraits.succeed(2);
    expect(h.renderers.peakImages).toBe(1);
    expect(h.renderers.peakTextures).toBe(0);
    expect(h.renderers.peakCanvases).toBe(0);
    expect(h.controller.diagnostics().totals.rendererCreates).toBe(2);
  });

  it('renders one static frame under Reduced Motion and switches without hidden draws', () => {
    const environment = new FakeEnvironment();
    environment.state.reducedMotion = true;
    const h = harness(environment);
    h.controller.select(genome({ kingdom: 'fungi' }));
    h.portraits.succeed(0);
    const renderer = h.renderers.handles[0]!;

    expect(renderer.frames).toHaveLength(1);
    expect(renderer.frames[0]?.mode).toBe('static');
    expect(h.ticker.subscriptions).toBe(0);
    expect(h.controller.diagnostics().state).toBe('static');

    environment.set({ reducedMotion: false });
    expect(renderer.frames.at(-1)?.mode).toBe('animated');
    expect(h.ticker.subscriptions).toBe(1);
    h.ticker.tick(25);
    const beforeReduction = renderer.frames.length;
    environment.set({ reducedMotion: true });
    expect(h.ticker.releases).toBe(1);
    expect(renderer.frames).toHaveLength(beforeReduction + 1);
    expect(renderer.frames.at(-1)?.mode).toBe('static');
    h.ticker.staleTick(0, 25);
    expect(renderer.frames).toHaveLength(beforeReduction + 1);
  });

  it('defers hidden work, cancels an in-flight hide, resumes, and releases on detach', () => {
    const environment = new FakeEnvironment();
    environment.state.visible = false;
    const h = harness(environment);
    h.controller.select(genome({ kingdom: 'microbe', form: 8 }));
    expect(h.portraits.calls).toHaveLength(0);
    expect(h.controller.diagnostics().state).toBe('paused');

    environment.set({ visible: true });
    expect(h.portraits.calls).toHaveLength(1);
    environment.set({ visible: false });
    expect(h.portraits.calls[0]?.cancelCount).toBe(1);
    h.portraits.succeed(0);
    expect(h.renderers.handles).toHaveLength(0);

    environment.set({ visible: true });
    expect(h.portraits.calls).toHaveLength(2);
    h.portraits.succeed(1);
    const renderer = h.renderers.handles[0]!;
    expect(h.controller.diagnostics().state).toBe('animating');
    environment.set({ visible: false });
    expect(h.ticker.releases).toBe(1);
    expect(renderer.destroyCount).toBe(0);
    const hiddenFrameCount = renderer.frames.length;
    h.ticker.staleTick(0, 50);
    expect(renderer.frames).toHaveLength(hiddenFrameCount);

    environment.set({ visible: true });
    expect(h.ticker.subscriptions).toBe(2);
    environment.set({ connected: false, visible: false });
    expect(renderer.destroyCount).toBe(1);
    expect(h.portraits.calls[1]?.cancelCount).toBe(1);
    expect(h.controller.diagnostics()).toMatchObject({
      state: 'idle',
      identityKey: null,
      live: { rendererCount: 0, textureCount: 0, canvasCount: 0, tickerCount: 0 },
      totals: { detachedStops: 1 },
    });
  });

  it('destroys a renderer candidate whose synchronous completion becomes stale', () => {
    const h = harness();
    h.renderers.onAfterCreate = () => {
      h.environment.set({ connected: false, visible: false });
    };
    h.controller.select(genome({ kingdom: 'flora', form: 3 }));
    h.portraits.succeed(0);

    const candidate = h.renderers.handles[0]!;
    expect(candidate.attachCount).toBe(0);
    expect(candidate.destroyCount).toBe(1);
    expect(h.renderers.activeImages).toBe(0);
    expect(h.renderers.activeTextures).toBe(0);
    expect(h.renderers.activeCanvases).toBe(0);
    expect(h.controller.diagnostics()).toMatchObject({
      state: 'idle',
      live: { rendererCount: 0, tickerCount: 0 },
      totals: { rendererCreates: 1, rendererDestroys: 1, staleCompletionDrops: 1 },
    });
  });

  it('fails closed on a wrong asset or undeclared visual resource without publishing either', () => {
    const wrongAsset = harness();
    wrongAsset.controller.select(genome());
    const otherKey = speciesVisualKey(genome({ form: 15 }));
    wrongAsset.portraits.succeed(0, portrait(otherKey));
    expect(wrongAsset.renderers.handles).toHaveLength(0);
    expect(wrongAsset.controller.diagnostics()).toMatchObject({
      state: 'error',
      live: { acceptedAssetCount: 0, rendererCount: 0, tickerCount: 0 },
      totals: { invalidCompletions: 1, faults: 1 },
    });

    const unbounded = harness();
    (unbounded.renderers as unknown as { resourceKind: string }).resourceKind = 'sprite-pair';
    unbounded.controller.select(genome({ form: 4 }));
    unbounded.portraits.succeed(0);
    expect(unbounded.renderers.handles[0]?.attachCount).toBe(0);
    expect(unbounded.renderers.handles[0]?.destroyCount).toBe(1);
    expect(unbounded.controller.diagnostics()).toMatchObject({
      state: 'error',
      live: { rendererCount: 0, tickerCount: 0 },
      totals: { rendererCreates: 1, rendererDestroys: 1, faults: 1 },
    });
  });

  it('supports the cached portrait path and cleans every owner exactly once', () => {
    const h = harness();
    h.portraits.currentFactory = (key) => portrait(key);
    h.controller.select(genome({ kingdom: 'flora', form: 10 }));
    expect(h.renderers.handles).toHaveLength(1);
    const renderer = h.renderers.handles[0]!;
    expect(renderer.attachCount).toBe(1);

    h.controller.dispose();
    h.controller.dispose();
    expect(renderer.destroyCount).toBe(1);
    expect(h.portraits.calls[0]?.cancelCount).toBe(1);
    expect(h.ticker.releases).toBe(1);
    expect(h.environment.releases).toBe(1);
    expect(h.controller.diagnostics()).toMatchObject({
      state: 'disposed',
      live: {
        portraitRequestCount: 0,
        acceptedAssetCount: 0,
        rendererCount: 0,
        imageCount: 0,
        textureCount: 0,
        canvasCount: 0,
        tickerCount: 0,
      },
      totals: {
        selections: 1,
        portraitRequests: 1,
        portraitCancellations: 1,
        rendererCreates: 1,
        rendererAttaches: 1,
        rendererDestroys: 1,
        tickerStarts: 1,
        tickerStops: 1,
      },
    });
    expect(() => h.controller.select(genome())).toThrow(/disposed/iu);
  });
});
