import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildInventoryActionOffscreenRestoreSource,
  prepareInventoryActionOffscreen,
  restoreInventoryActionOffscreen,
  runInventoryOffscreenProbe,
} from '../tools/glassmatrix.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const glassPath = path.join(here, '..', 'tools', 'glassmatrix.mjs');
const viewport = { width: 1280, height: 720 };
type Rect = readonly [number, number, number, number];

function inventoryActionInstrumentBlock(source: string): string | null {
  const start = source.indexOf('const offscreenPrior = await evalIn(');
  const end = source.indexOf('const settledAction = await waitFor(', start);
  return start >= 0 && end > start ? source.slice(start, end) : null;
}

function makeHarness({
  saved,
  scrollRect,
  translatedRect,
  priorStyle = 'color: rgb(1, 2, 3); transform: scale(1)',
  priorTransform = 'scale(1)',
  priorTransformPriority = '',
  hit = null,
  stickyEmptyAfterFirstRemove = false,
}: {
  saved: number;
  scrollRect: Rect;
  translatedRect: Rect;
  priorStyle?: string | null;
  priorTransform?: string;
  priorTransformPriority?: string;
  hit?: object | null;
  stickyEmptyAfterFirstRemove?: boolean;
}) {
  let styleAttribute: string | null = priorStyle;
  let transform = priorTransform;
  let transformPriority = priorTransformPriority;
  let translated = false;
  let transformWrites = 0;
  let styleRemovals = 0;
  const style = {
    setProperty(name: string, value: string, priority = '') {
      if (name !== 'transform') throw new Error(`unexpected property ${name}`);
      transform = value;
      transformPriority = priority;
      translated = true;
      transformWrites += 1;
      styleAttribute = `transform: ${value}${priority ? ` !${priority}` : ''};`;
    },
    getPropertyValue(name: string) {
      return name === 'transform' ? transform : '';
    },
    getPropertyPriority(name: string) {
      return name === 'transform' ? transformPriority : '';
    },
  };
  const button = {
    isConnected: true,
    style,
    getBoundingClientRect() {
      const [left, top, right, bottom] = translated ? translatedRect : scrollRect;
      return { left, top, right, bottom };
    },
    getAttribute(name: string) {
      return name === 'style' ? styleAttribute : null;
    },
    setAttribute(name: string, value: string) {
      if (name !== 'style') throw new Error(`unexpected attribute ${name}`);
      styleAttribute = value;
      transform = priorTransform;
      transformPriority = priorTransformPriority;
      translated = false;
    },
    removeAttribute(name: string) {
      if (name !== 'style') throw new Error(`unexpected attribute ${name}`);
      styleRemovals += 1;
      styleAttribute = stickyEmptyAfterFirstRemove && styleRemovals === 1 ? '' : null;
      transform = '';
      transformPriority = '';
      translated = false;
    },
  };
  const card = {
    isConnected: true,
    scrollTop: saved,
    contains(node: unknown) { return node === button; },
  };
  const prior = {
    ok: true,
    saved,
    styleAttribute: priorStyle,
    transform: priorTransform,
    transformPriority: priorTransformPriority,
  };
  return {
    button,
    card,
    prior,
    hitTest: () => hit,
    transformWriteCount: () => transformWrites,
    styleRemovalCount: () => styleRemovals,
  };
}

async function exerciseHarness(
  harness: ReturnType<typeof makeHarness>,
  activate: () => unknown | Promise<unknown>,
) {
  return runInventoryOffscreenProbe({
    setup: () => prepareInventoryActionOffscreen(
      harness.button, harness.card, harness.prior, viewport, harness.hitTest,
    ),
    activate,
    restore: (setup: { mutationApplied?: boolean } | null, setupError: string | null) => (
      restoreInventoryActionOffscreen(
        harness.button, harness.card, harness.prior,
        setupError !== null || setup?.mutationApplied === true,
      )
    ),
  });
}

describe('Glass Inventory offscreen action instrument', () => {
  it('uses natural scroll only after it independently proves a full offscreen/null-hit target', async () => {
    const harness = makeHarness({
      saved: 240,
      scrollRect: [40, -96, 100, -40],
      translatedRect: [40, 848, 100, 904],
    });
    let activations = 0;
    const result = await exerciseHarness(harness, () => {
      activations += 1;
      return { ok: false, inputDispatched: false, receipt: null };
    });

    expect(result.offscreenSetup).toMatchObject({ ok: true, mode: 'scroll', translated: false });
    expect(result.offscreenSetup?.target).toMatchObject({ fullyOutside: true, hit: null });
    expect(result.probeAttempted).toBe(true);
    expect(activations).toBe(1);
    expect(harness.transformWriteCount()).toBe(0);
    expect(result.restored).toMatchObject({ ok: true, scrollTop: 240, styleRestored: true });
    expect(harness.button.getAttribute('style')).toBe(harness.prior.styleAttribute);
  });

  it('falls back to an important translation when natural scrolling is insufficient', async () => {
    const harness = makeHarness({
      saved: 240,
      scrollRect: [40, 120, 100, 176],
      translatedRect: [40, 848, 100, 904],
    });
    let activations = 0;
    const result = await exerciseHarness(harness, () => {
      activations += 1;
      return { ok: false, inputDispatched: false, receipt: null };
    });

    expect(result.offscreenSetup).toMatchObject({
      ok: true,
      mode: 'translated',
      translated: true,
      appliedTransformPriority: 'important',
    });
    expect(result.offscreenSetup?.scrollTarget).toMatchObject({ fullyOutside: false });
    expect(result.offscreenSetup?.target).toMatchObject({ fullyOutside: true, hit: null });
    expect(activations).toBe(1);
    expect(harness.transformWriteCount()).toBe(1);
    expect(result.restored).toMatchObject({ ok: true, scrollTop: 240, styleRestored: true });
    expect(harness.button.getAttribute('style')).toBe(harness.prior.styleAttribute);
  });

  it.each([
    { label: 'absent', priorStyle: null, stickyEmptyAfterFirstRemove: true },
    { label: 'empty', priorStyle: '', stickyEmptyAfterFirstRemove: false },
  ])('uses the translated zero-scroll path and restores an $label style exactly', async ({
    priorStyle, stickyEmptyAfterFirstRemove,
  }) => {
    const harness = makeHarness({
      saved: 0,
      scrollRect: [40, 120, 100, 176],
      translatedRect: [40, 848, 100, 904],
      priorStyle,
      priorTransform: '',
      stickyEmptyAfterFirstRemove,
    });
    let activations = 0;
    const result = await exerciseHarness(harness, () => {
      activations += 1;
      return { ok: false, inputDispatched: false, receipt: null };
    });

    expect(result.offscreenSetup).toMatchObject({ ok: true, mode: 'translated', translated: true });
    expect(activations).toBe(1);
    expect(result.restored).toMatchObject({ ok: true, scrollTop: 0, styleAttribute: priorStyle });
    expect(harness.button.getAttribute('style')).toBe(priorStyle);
    expect(harness.styleRemovalCount()).toBe(priorStyle === null ? 2 : 0);
  });

  it('attempts zero activation and still restores when translated geometry stays reachable', async () => {
    const harness = makeHarness({
      saved: 0,
      scrollRect: [40, 120, 100, 176],
      translatedRect: [40, 120, 100, 176],
      hit: { tagName: 'BUTTON' },
    });
    let activations = 0;
    const result = await exerciseHarness(harness, () => {
      activations += 1;
      return { ok: true, inputDispatched: true };
    });

    expect(result.offscreenSetup).toMatchObject({ ok: false, mode: 'translated' });
    expect(result.probeAttempted).toBe(false);
    expect(result.offscreenProbe).toBeNull();
    expect(activations).toBe(0);
    expect(result.restored).toMatchObject({ ok: true, scrollTop: 0, styleRestored: true });
  });

  it('rejects stale ownership before mutation or activation', async () => {
    const harness = makeHarness({
      saved: 80,
      scrollRect: [40, -96, 100, -40],
      translatedRect: [40, 848, 100, 904],
    });
    harness.card.scrollTop = 79;
    let activations = 0;
    const result = await exerciseHarness(harness, () => { activations += 1; });

    expect(result.offscreenSetup).toMatchObject({ ok: false, why: 'invalid offscreen setup owner' });
    expect(result.probeAttempted).toBe(false);
    expect(activations).toBe(0);
    expect(harness.transformWriteCount()).toBe(0);
    expect(result.restored).toMatchObject({
      ok: false, mutationApplied: false, scrollTop: 79, styleRestored: true,
    });
    expect(harness.card.scrollTop).toBe(79);
  });

  it('restores exact state after an activation error and retains the causal error', async () => {
    const harness = makeHarness({
      saved: 80,
      scrollRect: [40, -96, 100, -40],
      translatedRect: [40, 848, 100, 904],
    });
    const result = await exerciseHarness(harness, () => {
      throw new Error('activation exploded');
    });

    expect(result.probeAttempted).toBe(true);
    expect(result.probeError).toBe('activation exploded');
    expect(result.restored).toMatchObject({ ok: true, scrollTop: 80, styleRestored: true });
    expect(harness.button.getAttribute('style')).toBe(harness.prior.styleAttribute);
  });

  it('builds executable browser restoration source and restores the retained exact owner', () => {
    const harness = makeHarness({
      saved: 80,
      scrollRect: [40, -96, 100, -40],
      translatedRect: [40, 848, 100, 904],
    });
    harness.card.scrollTop = 0;
    harness.button.style.setProperty('transform', 'translateY(calc(100vh + 128px))', 'important');
    const pageWindow: Record<string, unknown> = {
      __cfInventoryOffscreenOwner: { button: harness.button, card: harness.card },
    };
    const source = buildInventoryActionOffscreenRestoreSource(harness.prior, true);
    const execute = new Function('window', `return ${source};`);
    const result = execute(pageWindow);

    expect(result).toMatchObject({ ok: true, mutationApplied: true, scrollTop: 80 });
    expect(harness.button.getAttribute('style')).toBe(harness.prior.styleAttribute);
    expect('__cfInventoryOffscreenOwner' in pageWindow).toBe(false);
  });

  it('keeps setup, refusal-only input assessment, restoration, and classification before product input', () => {
    const source = fs.readFileSync(glassPath, 'utf8');
    const block = inventoryActionInstrumentBlock(source);
    expect(block).not.toBeNull();
    expect(block).toContain('const offscreenRun = await runInventoryOffscreenProbe({');
    expect(block).toContain('prepare=${PREPARE_INVENTORY_ACTION_OFFSCREEN_SOURCE}');
    expect(block).toContain('{ dispatch: false }');
    expect(block).toContain('evalIn(buildInventoryActionOffscreenRestoreSource(');
    expect(block).not.toContain("${'${JSON.stringify(");
    expect(block).toContain('offscreenRun.probeAttempted === true');
    expect(block).toContain('offscreenRun.offscreenProbe?.inputDispatched === false');
    expect(block).toContain('offscreenRun.offscreenProbe?.target?.receiptListenerArmed === false');
    expect(block).toContain('offscreenRun.restored.styleRestored === true');
    expect(block?.indexOf('Inventory action setup/offscreen control failed')).toBeLessThan(
      block?.indexOf('const realAction = await activateRealControl(') ?? -1,
    );
  });
});
