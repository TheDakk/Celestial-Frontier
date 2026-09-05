import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EngineeringCapabilitySnapshot } from '@cf/domain-loot';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  migrateLegacyEngineeringState,
  type EngineeringStateV2,
  type ResearchId,
} from '@cf/domain-opportunity';
import {
  prepareArc2LootLegacyMigration,
  readArc2EngineeringLoadout,
} from '@cf/persistence';
import {
  createTravelPresentationOwner,
  planTravelPresentation,
  researchTravelSpeedMultiplier,
  travelDestinationSeed,
} from '../apps/game/src/travel-presentation.js';
import { resolveVisualEffectPolicyV1 } from '../apps/game/src/visual-effect-policy.js';
import { readTrackedV1Source } from '../test-support/tracked-v1-source.js';

interface TestWindow extends Window {
  close(): void;
  Event: typeof Event;
  KeyboardEvent: typeof KeyboardEvent;
  HTMLCanvasElement: typeof HTMLCanvasElement;
}
interface TestDom { readonly window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const LEGACY_SOURCE = readTrackedV1Source().script;

const openDoms: TestDom[] = [];
afterEach(() => {
  for (const dom of openDoms.splice(0)) dom.window.close();
});

function engineeringState(research: readonly ResearchId[]): EngineeringStateV2 {
  return migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: 0,
    worlds: [],
    stars: [],
    research,
  }, {
    resolveWorldSeed: () => [],
    resolveStarSeed: () => [],
  });
}

function gearCapabilities(
  items: readonly (readonly [string, number])[],
  equip: Readonly<Record<string, string>>,
): EngineeringCapabilitySnapshot {
  const prepared = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: {
      items: items.map(([id, count]) => [id, count]),
      equip,
      equipAff: {},
    },
    capacity: 4,
  });
  if (prepared.kind !== 'prepared') throw new Error(`gear fixture was ${prepared.kind}`);
  const read = readArc2EngineeringLoadout(prepared.extensions);
  if (read.kind !== 'loaded') throw new Error(`capability fixture was ${read.kind}`);
  return read.capabilities;
}

const emptyCapabilities = (): EngineeringCapabilitySnapshot => gearCapabilities([], {});
const compassCapabilities = (): EngineeringCapabilitySnapshot => gearCapabilities(
  [['compass', 1]], { necklace: 'compass' },
);

interface FakeCanvasContext {
  readonly strokes: Array<readonly [number, number, number, number]>;
  readonly gradients: Array<{ readonly stops: Array<readonly [number, string]> }>;
  setTransform(): void;
  clearRect(): void;
  save(): void;
  restore(): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  createRadialGradient(): CanvasGradient;
  fillRect(): void;
  globalCompositeOperation: string;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
  lineWidth: number;
  fillStyle: string | CanvasGradient | CanvasPattern;
}

function fakeContext(): FakeCanvasContext {
  let from: readonly [number, number] = [0, 0];
  let to: readonly [number, number] = [0, 0];
  const context: FakeCanvasContext = {
    strokes: [],
    gradients: [],
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn((x: number, y: number) => { from = [x, y]; }),
    lineTo: vi.fn((x: number, y: number) => { to = [x, y]; }),
    stroke: vi.fn(() => { context.strokes.push([...from, ...to]); }),
    createRadialGradient: vi.fn(() => {
      const gradient = {
        stops: [] as Array<readonly [number, string]>,
        addColorStop(offset: number, color: string) { this.stops.push([offset, color]); },
      };
      context.gradients.push(gradient);
      return gradient as unknown as CanvasGradient;
    }),
    fillRect: vi.fn(),
    globalCompositeOperation: 'source-over',
    strokeStyle: '#000',
    globalAlpha: 1,
    lineWidth: 1,
    fillStyle: '#000',
  };
  return context;
}

function testDom(): Readonly<{
  dom: TestDom;
  document: Document;
  context: FakeCanvasContext;
}> {
  const dom = new JSDOM('<!doctype html><html><body><button id="route">Travel</button></body></html>', {
    url: 'https://example.test/',
  });
  openDoms.push(dom);
  const context = fakeContext();
  const document = dom.window.document;
  Object.defineProperty(dom.window.HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: vi.fn(() => context),
  });
  return { dom, document, context };
}

const request = (
  state: EngineeringStateV2,
  capabilities: EngineeringCapabilitySnapshot = emptyCapabilities(),
) => ({
  distance: 600,
  destinationKey: 'CF1-canonical-destination',
  destinationColor: '#8fd6ff',
  engineeringState: state,
  capabilities,
});

describe('travel presentation', () => {
  it('matches the legacy 1/2/4/8 precedence and adds only registered worn speed', () => {
    expect(researchTravelSpeedMultiplier(engineeringState([]))).toBe(1);
    expect(researchTravelSpeedMultiplier(engineeringState(['drive1']))).toBe(2);
    expect(researchTravelSpeedMultiplier(engineeringState(['drive2']))).toBe(4);
    expect(researchTravelSpeedMultiplier(engineeringState(['drive3']))).toBe(8);
    expect(researchTravelSpeedMultiplier(engineeringState(['drive1', 'drive3']))).toBe(8);

    const capability = compassCapabilities();
    expect(capability.travelSpeedBonus).toBe(1);
    const plan = planTravelPresentation(request(engineeringState(['drive3']), capability));
    expect(plan).toMatchObject({
      distance: 600,
      researchSpeedMultiplier: 8,
      equippedSpeedBonus: 1,
      speedMultiplier: 9,
      durationMs: 1_000,
      longBurn: false,
    });
    expect(() => planTravelPresentation({
      ...request(engineeringState(['drive3']), capability),
      capabilities: { ...capability },
    })).toThrow(/registered engineering capability/);
  });

  it('retains the exact legacy duration, upper cap, floor, long-burn and seed laws', () => {
    const base = engineeringState([]);
    const drive2 = engineeringState(['drive2']);
    expect(planTravelPresentation({ ...request(base), distance: 0 }).durationMs).toBe(800);
    expect(planTravelPresentation({ ...request(base), distance: 10_000 }).durationMs).toBe(8_000);
    expect(planTravelPresentation({ ...request(base), distance: 1_401 }).longBurn).toBe(true);
    expect(planTravelPresentation({ ...request(drive2), distance: 10_000 }).durationMs).toBe(2_000);
    expect(planTravelPresentation({ ...request(engineeringState(['drive3'])), distance: 10_000 }).durationMs)
      .toBe(1_200);
    expect(travelDestinationSeed('CF1-canonical-destination')).toBe(
      travelDestinationSeed('CF1-canonical-destination'),
    );
    expect(travelDestinationSeed('CF1-canonical-destination')).not.toBe(
      travelDestinationSeed('CF1-canonical-destination-2'),
    );

    expect(LEGACY_SOURCE).toContain(
      'const base=techOwned.has(\'drive3\')?8:(techOwned.has(\'drive2\')?4:(techOwned.has(\'drive1\')?2:1));',
    );
    expect(LEGACY_SOURCE).toContain("try{ return base+_equipBonus('speed'); }catch(_){ return base; }");
    expect(LEGACY_SOURCE).toContain(
      'const dur=clamp(800+(dist*3)/mult, 800, Math.max(1200, 8000/mult));',
    );
  });

  it('paints a deterministic bounded animated lane and expires on the app ticker', () => {
    const { document, context } = testDom();
    let now = 100;
    const owner = createTravelPresentationOwner({
      document,
      now: () => now,
      currentVisualEffectPolicy: () => resolveVisualEffectPolicyV1({
        effectsOn: true, motion: 'full', deviceTier: 'high',
      }),
      viewport: () => ({ width: 320, height: 568, dpr: 2 }),
    });
    const plan = owner.start(request(engineeringState(['drive1'])));
    expect(plan?.durationMs).toBe(1_700);
    expect(owner.status()).toMatchObject({
      active: true, particleMode: 'animated', particleCount: 24,
    });
    const canvas = document.querySelector<HTMLCanvasElement>('[data-cf-travel-presentation="v1"]');
    expect(canvas).not.toBeNull();
    expect(canvas?.width).toBe(640);
    expect(canvas?.style.pointerEvents).toBe('none');

    now = 700;
    expect(owner.tick()).toBe(true);
    expect(context.strokes).toHaveLength(24);
    const firstFrame = structuredClone(context.strokes);
    owner.cancel();
    now = 100;
    owner.start(request(engineeringState(['drive1'])));
    now = 700;
    owner.tick();
    expect(context.strokes.slice(24)).toEqual(firstFrame);

    now = 1_800;
    expect(owner.tick()).toBe(false);
    expect(owner.status().active).toBe(false);
    expect(document.querySelector('[data-cf-travel-presentation="v1"]')).toBeNull();
    owner.dispose();
  });

  it('uses the existing low-tier static ceiling and skips reduced-motion or disabled FX', () => {
    const { document, context } = testDom();
    let motion: 'full' | 'reduced' = 'full';
    let effectsOn = true;
    let now = 10;
    const owner = createTravelPresentationOwner({
      document,
      now: () => now,
      currentVisualEffectPolicy: () => resolveVisualEffectPolicyV1({
        effectsOn, motion, deviceTier: 'low',
      }),
      viewport: () => ({ width: 390, height: 844, dpr: 2 }),
    });
    expect(owner.start(request(engineeringState([])))).not.toBeNull();
    expect(owner.status()).toMatchObject({
      active: true, particleMode: 'static', particleCount: 4,
    });
    expect(context.strokes).toHaveLength(4);
    const fixed = structuredClone(context.strokes);
    now = 500;
    expect(owner.tick()).toBe(true);
    expect(context.strokes).toEqual(fixed);

    motion = 'reduced';
    expect(owner.tick()).toBe(false);
    expect(owner.start(request(engineeringState([])))).toBeNull();
    effectsOn = false;
    motion = 'full';
    expect(owner.start(request(engineeringState([])))).toBeNull();
    owner.dispose();
  });

  it('skips without consuming the pointer, cancels on Escape/visibility, and disposes cleanly', () => {
    const { dom, document } = testDom();
    let now = 10;
    const owner = createTravelPresentationOwner({
      document,
      now: () => now,
      currentVisualEffectPolicy: () => resolveVisualEffectPolicyV1({
        effectsOn: true, motion: 'full', deviceTier: 'medium',
      }),
      viewport: () => ({ width: 800, height: 600, dpr: 1 }),
    });
    owner.start(request(engineeringState([])));
    let landed = 0;
    document.body.addEventListener('pointerdown', () => { landed += 1; });
    document.body.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
    expect(landed).toBe(1);
    expect(owner.status().active).toBe(false);

    owner.start(request(engineeringState([])));
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(owner.status().active).toBe(false);
    owner.start(request(engineeringState([])));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new dom.window.Event('visibilitychange'));
    expect(owner.status().active).toBe(false);

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    owner.start(request(engineeringState([])));
    owner.dispose();
    expect(owner.status().active).toBe(false);
    expect(document.querySelector('[data-cf-travel-presentation="v1"]')).toBeNull();
    now = 20;
    expect(owner.start(request(engineeringState([])))).toBeNull();
  });

  it('has no scheduler, route publisher, persistence writer, or random ambient dependency', () => {
    const source = fs.readFileSync(fileURLToPath(
      new URL('../apps/game/src/travel-presentation.ts', import.meta.url),
    ), 'utf8');
    const executable = source
      .replace(/\/\*[\s\S]*?\*\//gu, ' ')
      .replace(/(^|[^:\\])\/\/.*$/gmu, '$1');
    expect(executable).not.toMatch(/\b(?:setTimeout|setInterval|requestAnimationFrame|Math\.random)\b/u);
    expect(executable).not.toMatch(/\b(?:persist|repository|publishNavigation|rerender|goTo)\s*\(/u);
  });
});
