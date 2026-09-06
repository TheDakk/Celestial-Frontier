import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  hiddenPanelOpenerFocusOutcome,
  hiddenPanelOpenerSetupOutcome,
} from '../tools/glassmatrix.mjs';

const nativeInput = (id, pointerType = 'mouse') => ({
  ok: true, inputDispatched: true,
  target: { ok: true, id, visible: true, rect: [100, 100, 144, 144] },
  receipt: { buttonId: id, trusted: true, pointerType },
});
const visibleAtlas = () => ({
  panel: 'atlas', cardOpen: false, railRendered: true, railDisplay: 'flex',
  railVisibility: 'visible', railRootDisplay: 'flex', closeFocused: true,
});
const hiddenAtlas = () => ({
  ...visibleAtlas(), cardOpen: true, railRendered: false, railRootDisplay: 'none',
  closeFocused: false, surveyRendered: true, focus: 'docksurvey',
});
const journey = (pointerType = 'mouse') => ({
  pointerType, opening: nativeInput('railatlas', pointerType), baseline: visibleAtlas(),
  hiding: nativeInput('docksurvey', pointerType), hidden: hiddenAtlas(),
});
const closed = () => ({ ...hiddenAtlas(), panel: null });
const focusJourney = (pointerType = 'mouse') => ({
  setup: hiddenPanelOpenerSetupOutcome(journey(pointerType)),
  closing: nativeInput(null, pointerType), fallback: closed(), pointerType,
});

describe('Glass visible-to-hidden native panel opener proof', () => {
  it.each(['mouse', 'touch'])('accepts the full Atlas/Survey/Close %s journey', (pointerType) => {
    expect(hiddenPanelOpenerSetupOutcome(journey(pointerType)).ok).toBe(true);
    expect(hiddenPanelOpenerFocusOutcome(focusJourney(pointerType)).ok).toBe(true);
  });

  it.each([
    ['hidden from the start', (row) => { row.baseline.railRendered = false; row.baseline.railRootDisplay = 'none'; }],
    ['legacy Records opener', (row) => { row.opening = nativeInput('railrecords'); }],
    ['missing visible target', (row) => { row.opening.target.visible = false; }],
    ['zero-size target', (row) => { row.opening.target.rect = [100, 100, 100, 100]; }],
    ['undersized target', (row) => { row.opening.target.rect[2] = 143; }],
    ['non-finite target', (row) => { row.opening.target.rect[0] = NaN; }],
    ['programmatic opener', (row) => { row.opening.inputDispatched = false; }],
    ['untrusted opener receipt', (row) => { row.opening.receipt.trusted = false; }],
    ['wrong native pointer', (row) => { row.opening.receipt.pointerType = 'touch'; }],
    ['wrong receipt owner', (row) => { row.opening.receipt.buttonId = 'railrecords'; }],
    ['missing baseline Close focus', (row) => { row.baseline.closeFocused = false; }],
    ['already-open Survey', (row) => { row.baseline.cardOpen = true; }],
    ['wrong initial panel', (row) => { row.baseline.panel = 'rec'; }],
    ['CSS-hidden baseline', (row) => { row.baseline.railVisibility = 'hidden'; }],
    ['untrusted Survey transition', (row) => { row.hiding.receipt.trusted = false; }],
    ['panel dismissed by Survey', (row) => { row.hidden.panel = null; }],
    ['Survey did not open', (row) => { row.hidden.cardOpen = false; }],
    ['rail did not hide', (row) => { row.hidden.railRendered = true; }],
    ['wrong hiding cause', (row) => { row.hidden.railRootDisplay = 'flex'; }],
  ])('rejects %s before judging fallback focus', (_label, mutate) => {
    const row = journey();
    mutate(row);
    expect(hiddenPanelOpenerSetupOutcome(row).ok).toBe(false);
  });

  it.each([
    ['unproved setup', (row) => { row.setup.ok = false; }],
    ['programmatic Close', (row) => { row.closing.inputDispatched = false; }],
    ['untrusted Close', (row) => { row.closing.receipt.trusted = false; }],
    ['other close owner', (row) => { row.closing.receipt.buttonId = 'dockrecords'; }],
    ['panel still open', (row) => { row.fallback.panel = 'atlas'; }],
    ['rail rendered again', (row) => { row.fallback.railRendered = true; }],
    ['hidden Survey', (row) => { row.fallback.surveyRendered = false; }],
    ['wrong fallback focus', (row) => { row.fallback.focus = null; }],
    ['Survey lost', (row) => { row.fallback.cardOpen = false; }],
  ])('rejects %s in the final outcome', (_label, mutate) => {
    const row = focusJourney();
    mutate(row);
    expect(hiddenPanelOpenerFocusOutcome(row).ok).toBe(false);
  });

  it('rejects a deliberately moved focus and requires restoration to pass again', () => {
    const row = focusJourney();
    expect(hiddenPanelOpenerFocusOutcome(row).ok).toBe(true);
    row.fallback.focus = null;
    expect(hiddenPanelOpenerFocusOutcome(row).ok).toBe(false);
    row.fallback.focus = 'docksurvey';
    expect(hiddenPanelOpenerFocusOutcome(row).ok).toBe(true);
  });

  it('wires native transitions, baseline and restoration evidence into the unchanged lifecycle outcome', () => {
    const source = fs.readFileSync(new URL('../tools/glassmatrix.mjs', import.meta.url), 'utf8');
    const start = source.indexOf('        if (vp.width > 900 && !hiddenOpenerControlRun) {');
    const end = source.indexOf('        /* With the card closed,', start);
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
    const block = source.slice(start, end);
    expect(block).not.toContain('.click()');
    expect(block).not.toContain('railrecords');
    for (const marker of [
      "activateRealControl('#railatlas'",
      'const baseline = await evalIn(hiddenOpenerSnapshot);',
      "activateRealControl('#docksurvey', 'hidden-opener Survey transition')",
      'const hidden = await evalIn(hiddenOpenerSnapshot);',
      'hiddenPanelOpenerSetupOutcome({ opening, baseline, hiding, hidden, pointerType })',
      'if (!setup.ok) stopInstrumentControl(',
      `activateRealControl('#atlaspanel [data-pnx="atlas"]'`,
      'hiddenPanelOpenerFocusOutcome({ setup, closing, fallback, pointerType })',
      "'hidden-panel-opener-focus', 'PANEL_HIDDEN_OPENER_FOCUS_LOST', '#docksurvey'",
      "if (wrongFocus.focus === 'docksurvey' || fallbackControl.ok)",
      'if (!restoredOutcome.ok) stopInstrumentControl(',
      "recordControls('hidden-panel-opener-focus-fallback')",
    ]) expect(block, marker).toContain(marker);
    expect(block.indexOf('const baseline =')).toBeLessThan(block.indexOf('const hiding ='));
    expect(block.indexOf('if (!setup.ok)')).toBeLessThan(block.indexOf('const closing ='));
    expect(block.indexOf('if (!restoredOutcome.ok)')).toBeLessThan(block.indexOf('recordControls('));
  });
});
