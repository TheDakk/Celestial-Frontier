import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ShipVisualState } from '@cf/scene';
import {
  ShipyardPreviewOwner,
  shipPreviewAriaLabel,
  shipVisualStateKey,
} from '../apps/game/src/shipyard-preview.js';

interface TestWindow extends Window { close(): void }
interface TestDom { window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
let dom: TestDom;
let mount: HTMLElement;

function state(
  chassisStage: ShipVisualState['chassisStage'],
  hardpoints: ShipVisualState['hardpoints'] = { array: false, autoext: false, cscoop: false },
  provenance: ShipVisualState['provenance'] = 'owned-items',
): ShipVisualState {
  return {
    chassisStage,
    hardpoints,
    installedSystemIds: [
      ...(hardpoints.array ? ['array' as const] : []),
      ...(hardpoints.autoext ? ['autoext' as const] : []),
      ...(hardpoints.cscoop ? ['cscoop' as const] : []),
    ],
    provenance,
    liverySeed: 0x5111,
  };
}

beforeEach(() => {
  dom = new JSDOM('<!doctype html><html><body><div id="mount"></div></body></html>');
  mount = dom.window.document.getElementById('mount') as HTMLElement;
});

afterEach(() => dom.window.close());

describe('Shipyard SVG preview', () => {
  it('renders four distinct, honestly labelled chassis through one img role', () => {
    const owner = new ShipyardPreviewOwner(mount);
    const expected = [
      ['scout-chemical', 'Scout', 'chemical-system reach'],
      ['jump-interstellar', 'Jump', 'interstellar reach'],
      ['survey-cruiser-array', 'Survey Cruiser', 'survey-array reach'],
      ['frontier-intergalactic', 'Frontier', 'intergalactic reach'],
    ] as const;
    const hullPaths = new Set<string>();

    expected.forEach(([silhouette, name, reach], chassisStage) => {
      const preview = owner.open(state(chassisStage as ShipVisualState['chassisStage']));
      expect(mount.querySelectorAll('svg[role="img"]')).toHaveLength(1);
      expect(mount.querySelectorAll('[role="img"]')).toHaveLength(1);
      expect(preview.querySelector('[data-layer="chassis"]')?.getAttribute('data-silhouette'))
        .toBe(silhouette);
      const hull = preview.querySelector('[data-layer="chassis"] > path')?.getAttribute('d');
      expect(hull).toBeTruthy();
      hullPaths.add(hull!);
      expect(preview.getAttribute('aria-label')).toContain(name);
      expect(preview.getAttribute('aria-label')).toContain(reach);
      expect(preview.getAttribute('aria-label')).toContain('No mounted hardpoints');
      expect(preview.getAttribute('data-state-key')).toBe(shipVisualStateKey(state(
        chassisStage as ShipVisualState['chassisStage'],
      )));
    });

    expect(hullPaths.size).toBe(4);
    expect(owner.diagnostics()).toMatchObject({
      activePreviewCount: 1,
      createdPreviewCount: 4,
      disposedPreviewCount: 3,
      peakActivePreviewCount: 1,
      domPreviewCount: 1,
      retainedPreviewCount: 0,
      faultCount: 0,
    });
  });

  it('mounts exactly the truthful hardpoint layers for all eight permutations', () => {
    const owner = new ShipyardPreviewOwner(mount);
    for (let mask = 0; mask < 8; mask++) {
      const hardpoints = {
        array: !!(mask & 1),
        autoext: !!(mask & 2),
        cscoop: !!(mask & 4),
      };
      const preview = owner.replace(state(3, hardpoints));
      const actual = Array.from(preview.querySelectorAll('[data-hardpoint]'))
        .map((element) => element.getAttribute('data-hardpoint'))
        .sort();
      const wanted = [
        ...(hardpoints.array ? ['array'] : []),
        ...(hardpoints.autoext ? ['autoext'] : []),
        ...(hardpoints.cscoop ? ['cscoop'] : []),
      ].sort();
      expect(actual).toEqual(wanted);
      const label = preview.getAttribute('aria-label')!;
      expect(label.includes('Long-Range Array')).toBe(hardpoints.array);
      expect(label.includes('Auto-Extractor')).toBe(hardpoints.autoext);
      expect(label.includes('Corona Scoop')).toBe(hardpoints.cscoop);
    }
    expect(owner.diagnostics()).toMatchObject({
      activePreviewCount: 1,
      createdPreviewCount: 8,
      disposedPreviewCount: 7,
      peakActivePreviewCount: 1,
      domPreviewCount: 1,
    });
  });

  it('adds one deterministic static material treatment without changing capability layers', () => {
    const owner = new ShipyardPreviewOwner(mount);
    const source = state(2, { array: true, autoext: false, cscoop: true });
    const first = owner.open(source);
    const firstMarkup = first.outerHTML;

    expect(first.getAttribute('data-visual-treatment')).toBe('polished-v1');
    expect(first.querySelectorAll('defs linearGradient')).toHaveLength(2);
    expect(first.querySelectorAll('defs radialGradient')).toHaveLength(2);
    expect(first.querySelectorAll('defs clipPath')).toHaveLength(1);
    expect(first.querySelectorAll('[data-layer="backdrop"] > circle')).toHaveLength(18);
    expect(first.querySelector('[data-layer="material-light"]')).not.toBeNull();
    expect(first.querySelectorAll('filter, animate, animateTransform')).toHaveLength(0);
    expect(Array.from(first.querySelectorAll('[data-hardpoint]'))
      .map((element) => element.getAttribute('data-hardpoint')))
      .toEqual(['array', 'cscoop']);

    const second = owner.replace(source);
    expect(second.outerHTML).toBe(firstMarkup);
    expect(owner.diagnostics()).toMatchObject({
      activePreviewCount: 1,
      createdPreviewCount: 2,
      disposedPreviewCount: 1,
      domPreviewCount: 1,
      retainedPreviewCount: 0,
      faultCount: 0,
    });
  });

  it('shows a generic veteran-refit marking without claiming missing equipment', () => {
    const owner = new ShipyardPreviewOwner(mount);
    const fallback = state(
      3,
      { array: false, autoext: true, cscoop: false },
      'legacy-charter-refit',
    );
    const preview = owner.open(fallback);
    const label = preview.getAttribute('aria-label')!;

    expect(preview.querySelector('[data-marking="legacy-charter-refit"]')).not.toBeNull();
    expect(label).toBe(shipPreviewAriaLabel(fallback));
    expect(label).toContain('Generic legacy charter refit markings');
    expect(label).toContain('Auto-Extractor');
    expect(label).not.toMatch(/intergalactic drive|jump drive|long-range array/i);
    expect(preview.textContent).not.toMatch(/drive|array|extractor|scoop/i);

    const owned = owner.replace(state(3));
    expect(owned.querySelector('[data-marking]')).toBeNull();
  });

  it('keeps open idempotent, makes replace explicit, and disposes exactly once', () => {
    const owner = new ShipyardPreviewOwner(mount);
    const source = state(1, { array: false, autoext: false, cscoop: true });
    const first = owner.open(source);
    expect(owner.open(source)).toBe(first);
    expect(owner.diagnostics()).toMatchObject({
      activePreviewCount: 1,
      createdPreviewCount: 1,
      disposedPreviewCount: 0,
      peakActivePreviewCount: 1,
      stateKey: shipVisualStateKey(source),
    });

    const replacement = owner.replace(source);
    expect(replacement).not.toBe(first);
    expect(first.isConnected).toBe(false);
    expect(mount.querySelectorAll('svg[role="img"]')).toHaveLength(1);
    expect(owner.diagnostics()).toMatchObject({
      activePreviewCount: 1,
      createdPreviewCount: 2,
      disposedPreviewCount: 1,
      peakActivePreviewCount: 1,
    });

    owner.dispose();
    expect(replacement.isConnected).toBe(false);
    expect(mount.querySelectorAll('svg')).toHaveLength(0);
    expect(owner.diagnostics()).toMatchObject({
      activePreviewCount: 0,
      createdPreviewCount: 2,
      disposedPreviewCount: 2,
      peakActivePreviewCount: 1,
      domPreviewCount: 0,
      retainedPreviewCount: 0,
      faultCount: 0,
      stateKey: null,
    });
    owner.dispose();
    expect(owner.diagnostics().disposedPreviewCount).toBe(2);
  });

  it('exposes duplicate retention before the next operation repairs it fail-closed', () => {
    const owner = new ShipyardPreviewOwner(mount);
    const source = state(2, { array: true, autoext: true, cscoop: true });
    const active = owner.open(source);
    mount.append(active.cloneNode(true));

    expect(owner.diagnostics()).toMatchObject({
      activePreviewCount: 1,
      domPreviewCount: 2,
      retainedPreviewCount: 1,
      faultCount: 1,
      peakActivePreviewCount: 1,
    });

    expect(owner.open(source)).toBe(active);
    expect(mount.querySelectorAll('svg[data-cf-shipyard-preview="v1"]')).toHaveLength(1);
    expect(owner.diagnostics()).toMatchObject({
      activePreviewCount: 1,
      createdPreviewCount: 1,
      disposedPreviewCount: 0,
      domPreviewCount: 1,
      retainedPreviewCount: 0,
      faultCount: 1,
    });
  });

  it('detects external removal without mutating diagnostics, then accounts and recovers once', () => {
    const owner = new ShipyardPreviewOwner(mount);
    const source = state(0);
    const removed = owner.open(source);
    removed.remove();

    const firstDiagnostic = owner.diagnostics();
    const secondDiagnostic = owner.diagnostics();
    expect(firstDiagnostic).toEqual(secondDiagnostic);
    expect(firstDiagnostic).toMatchObject({
      activePreviewCount: 0,
      createdPreviewCount: 1,
      disposedPreviewCount: 0,
      domPreviewCount: 0,
      retainedPreviewCount: 0,
      faultCount: 1,
      stateKey: null,
    });

    const recovered = owner.open(source);
    expect(recovered).not.toBe(removed);
    expect(owner.diagnostics()).toMatchObject({
      activePreviewCount: 1,
      createdPreviewCount: 2,
      disposedPreviewCount: 1,
      domPreviewCount: 1,
      retainedPreviewCount: 0,
      faultCount: 1,
      peakActivePreviewCount: 1,
    });
  });
});
