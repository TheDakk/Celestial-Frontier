import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  ApproachEcologyController,
  projectApproachEcologyAudioV1,
} from '../apps/game/src/approach-ecology-audio.js';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';

vi.mock('@cf/domain-sessionrng', () => {
  throw new Error('approach ecology imported gameplay SessionRNG');
});

beforeAll(() => installCaptureHooks());

interface TestWindow extends Window {
  readonly Event: typeof Event;
  close(): void;
}
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string) => TestDom;
};

const HOME = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL = Object.freeze({ seed: 424242, x: 560, y: 170 });

function roster(planetSeed = 133) {
  const address = resolveCF1WorldAddress({
    galaxy: HOME,
    star: SOL,
    planet: { seed: planetSeed },
  });
  if (!address.ok) throw new Error(`approach address fixture failed: ${address.reason}`);
  const result = canonicalWorldRoster(address.address, 0);
  if (!result.ok) throw new Error(`approach roster fixture failed: ${result.reason}`);
  return result.roster;
}

let dom: TestDom | null = null;
let controller: ApproachEcologyController | null = null;

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
});

describe('orbital approach ecology join', () => {
  it('projects deterministic generic biosphere evidence without touching the canonical roster', () => {
    const canonical = roster();
    const before = JSON.stringify(canonical);
    const first = projectApproachEcologyAudioV1({
      generation: 7,
      ecologyEpoch: 0,
      roster: canonical,
    });
    const second = projectApproachEcologyAudioV1({
      generation: 7,
      ecologyEpoch: 0,
      roster: canonical,
    });
    expect(second).toEqual(first);
    expect(first).toMatchObject({
      availability: 'ready',
      detail: 'Orbital approach instruments detect a living biosphere.',
      surface: {
        generation: 7,
        worldKey: canonical.worldKey,
        environmentFingerprint: canonical.environmentFingerprint,
        biosphereKey: canonical.biosphereKey,
        ecologyEpoch: 0,
        surface: 'approach',
      },
    });
    expect(Object.keys(first)).toEqual(['schema', 'surface', 'availability', 'detail']);
    expect(JSON.stringify(first)).not.toContain('view');
    expect(JSON.stringify(first)).not.toContain('species');
    expect(JSON.stringify(canonical)).toBe(before);
  });

  it('fails closed for lifeless, stale, absent, and structurally forged roster authority', () => {
    expect(projectApproachEcologyAudioV1({
      generation: 2,
      ecologyEpoch: 0,
      roster: roster(134),
    }).availability).toBe('silent-world');
    const current = roster();
    expect(projectApproachEcologyAudioV1({
      generation: 2,
      ecologyEpoch: 1,
      roster: current,
    }).availability).toBe('protected');
    expect(projectApproachEcologyAudioV1({
      generation: 2,
      ecologyEpoch: 0,
      roster: null,
    }).availability).toBe('protected');
    expect(projectApproachEcologyAudioV1({
      generation: 2,
      ecologyEpoch: 0,
      roster: { ...current } as never,
    }).availability).toBe('protected');
  });

  it('renders lifeless/protected telemetry without a playback control or dispatch', () => {
    dom = new JSDOM('<!doctype html><body><aside id="card"><div id="mount"></div></aside></body>');
    const document = dom.window.document;
    const root = document.getElementById('card') as HTMLElement;
    const mount = document.getElementById('mount') as HTMLElement;
    const onListen = vi.fn();
    controller = new ApproachEcologyController({ root, isCurrent: () => true, onListen });
    controller.setState(projectApproachEcologyAudioV1({
      generation: 3,
      ecologyEpoch: 0,
      roster: roster(134),
    }));
    controller.attach(mount);
    expect(mount.querySelector('[data-arc8-approach-ecology-state]')?.textContent)
      .toContain('no living biosphere');
    expect(mount.querySelector('[data-arc8-approach-ecology-listen]')).toBeNull();
    controller.setState(projectApproachEcologyAudioV1({
      generation: 4,
      ecologyEpoch: 0,
      roster: null,
    }));
    expect(mount.querySelector('[data-arc8-approach-ecology-state]')?.textContent)
      .toContain('protected');
    expect(mount.querySelector('[data-arc8-approach-ecology-listen]')).toBeNull();
    expect(onListen).not.toHaveBeenCalled();
  });

  it('renders an explicit replayable control and creates approach playback only on its live click', () => {
    const canonical = roster();
    const state = projectApproachEcologyAudioV1({
      generation: 11,
      ecologyEpoch: 0,
      roster: canonical,
    });
    dom = new JSDOM('<!doctype html><body><aside id="card"><div id="mount"></div></aside></body>');
    const document = dom.window.document;
    const root = document.getElementById('card') as HTMLElement;
    const mount = document.getElementById('mount') as HTMLElement;
    const onNative = vi.fn();
    const onListen = vi.fn();
    controller = new ApproachEcologyController({
      root,
      isCurrent: (surface) => surface.surfaceKey === state.surface.surfaceKey,
      onNativeListenGesture: onNative,
      onListen,
    });
    controller.setState(state);
    controller.attach(mount);
    controller.refresh();
    expect(onListen).not.toHaveBeenCalled();
    expect(onNative).not.toHaveBeenCalled();
    const button = mount.querySelector<HTMLButtonElement>(
      'button[data-arc8-approach-ecology-listen]',
    )!;
    expect(button.textContent).toBe('Listen to biosphere');
    expect(button.style.minHeight).toBe('44px');

    button.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    expect(onNative).not.toHaveBeenCalled();
    expect(onListen).toHaveBeenCalledTimes(1);
    const [playback, counterpart] = onListen.mock.calls[0]!;
    expect(playback).toMatchObject({
      generation: 11,
      worldKey: canonical.worldKey,
      plan: {
        source: 'approach-lead',
        granularity: 'biosphere',
        kingdom: null,
        familyKey: null,
        identityKey: null,
        route: 'ambience',
      },
    });
    expect(controller.counterpartIsCurrent(counterpart)).toBe(true);
    const status = mount.querySelector('[data-arc8-approach-ecology-status]');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.getAttribute('aria-atomic')).toBe('true');
  });

  it('owns exactly one delegated listener only while attached and reattaches it once', () => {
    const state = projectApproachEcologyAudioV1({
      generation: 11,
      ecologyEpoch: 0,
      roster: roster(),
    });
    dom = new JSDOM('<!doctype html><body><aside id="card"><div id="mount"></div></aside></body>');
    const document = dom.window.document;
    const root = document.getElementById('card') as HTMLElement;
    const mount = document.getElementById('mount') as HTMLElement;
    const add = vi.spyOn(root, 'addEventListener');
    const remove = vi.spyOn(root, 'removeEventListener');
    controller = new ApproachEcologyController({
      root,
      isCurrent: () => true,
      onListen: vi.fn(),
    });

    controller.setState(state);
    expect(add).not.toHaveBeenCalled();
    controller.attach(mount);
    controller.attach(mount);
    expect(add.mock.calls.map(([type]) => type)).toEqual(['click']);

    controller.detach();
    controller.detach();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(['click']);
    controller.attach(mount);
    expect(add.mock.calls.map(([type]) => type)).toEqual(['click', 'click']);

    controller.dispose();
    controller.detach();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(['click', 'click']);
  });

  it('rejects stale surfaces, model clones, and counterpart loss without dispatch', () => {
    const canonical = roster();
    const state = projectApproachEcologyAudioV1({
      generation: 13,
      ecologyEpoch: 0,
      roster: canonical,
    });
    dom = new JSDOM('<!doctype html><body><aside id="card"><div id="mount"></div></aside></body>');
    const document = dom.window.document;
    const root = document.getElementById('card') as HTMLElement;
    const mount = document.getElementById('mount') as HTMLElement;
    let current = false;
    const onListen = vi.fn();
    controller = new ApproachEcologyController({ root, isCurrent: () => current, onListen });
    expect(() => controller!.setState({ ...state } as never)).toThrow(/projector/u);
    controller.setState(state);
    controller.attach(mount);
    expect(mount.querySelector<HTMLButtonElement>(
      'button[data-arc8-approach-ecology-listen]',
    )?.disabled).toBe(true);
    current = true;
    controller.refresh();
    mount.querySelector<HTMLButtonElement>(
      'button[data-arc8-approach-ecology-listen]',
    )!.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    expect(onListen).toHaveBeenCalledTimes(1);
    const counterpart = onListen.mock.calls[0]![1];
    expect(controller.counterpartIsCurrent(counterpart)).toBe(true);
    current = false;
    expect(controller.counterpartIsCurrent(counterpart)).toBe(false);
    current = true;
    mount.querySelector('[data-arc8-approach-ecology-status]')?.remove();
    expect(controller.counterpartIsCurrent(counterpart)).toBe(false);
    controller.refresh();
    root.style.display = 'none';
    expect(controller.counterpartIsCurrent(counterpart)).toBe(false);
  });

  it('keeps plan creation after visible proof and carries no gameplay/save authority', () => {
    const source = readFileSync(fileURLToPath(
      new URL('../apps/game/src/approach-ecology-audio.ts', import.meta.url),
    ), 'utf8');
    const click = source.slice(source.indexOf('readonly #onClick'), source.indexOf('  #render():'));
    expect(click.indexOf('this.#leadIsCurrent(button)')).toBeGreaterThan(0);
    expect(click.indexOf('createCurrentWorldApproachDistantEcologyPlaybackV1'))
      .toBeGreaterThan(click.indexOf('this.#leadIsCurrent(button)'));
    expect(click.indexOf('this.#render();')).toBeLessThan(
      click.indexOf('this.counterpartIsCurrent(counterpart)'),
    );
    expect(click.indexOf('if (event.isTrusted) this.#onNativeListenGesture?.();'))
      .toBeGreaterThan(click.indexOf('this.counterpartIsCurrent(counterpart)'));
    expect(click.indexOf('this.#onListen?.(playback, counterpart);'))
      .toBeGreaterThan(click.indexOf('if (event.isTrusted) this.#onNativeListenGesture?.();'));
    expect(source).not.toMatch(/\b(?:gameEvent|SessionRNG|saveV2|SaveWriter|Math\.random|Date\.now)\b/u);
  });
});
