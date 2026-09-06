import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  hiddenPanelOpenerFocusOutcome,
  hiddenPanelOpenerSetupOutcome,
  hiddenPanelOpenerRestorationOutcome,
} from '../tools/glassmatrix.mjs';

const nativeInput = (id, pointerType = 'mouse') => ({
  ok: true, inputDispatched: true,
  target: { ok: true, id, visible: true, rect: [100, 100, 144, 144] },
  receipt: { buttonId: id, trusted: true, pointerType },
});
const visibleAtlas = () => ({
  panel: 'atlas', cardOpen: false, openerId: 'railatlas', openerRendered: true, openerDisplay: 'flex',
  openerVisibility: 'visible', dockRendered: true, railRendered: true, railDisplay: 'flex', closeFocused: true,
  openerSameNode: true, style: { present: false, value: null },
});
const hiddenAtlas = () => ({
  ...visibleAtlas(), cardOpen: true, openerRendered: false, railRendered: false, railDisplay: 'none',
  closeFocused: false, surveyRendered: true, focus: 'docksurvey',
});
const journey = (pointerType = 'mouse') => ({
  pointerType, opening: nativeInput('railatlas', pointerType), baseline: visibleAtlas(),
  hiding: nativeInput('docksurvey', pointerType),
  hidden: hiddenAtlas(),
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
    ['hidden from the start', (row) => { row.baseline.openerRendered = false; row.baseline.openerDisplay = 'none'; }],
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
    ['CSS-hidden baseline', (row) => { row.baseline.openerVisibility = 'hidden'; }],
    ['untrusted Survey transition', (row) => { row.hiding.receipt.trusted = false; }],
    ['panel dismissed by Survey', (row) => { row.hidden.panel = null; }],
    ['Survey did not open', (row) => { row.hidden.cardOpen = false; }],
    ['opener did not hide', (row) => { row.hidden.openerRendered = true; }],
    ['launcher was hidden', (row) => { row.hidden.dockRendered = false; }],
    ['Survey left the rail visible', (row) => { row.hidden.railRendered = true; }],
    ['rail was not CSS-yielded', (row) => { row.hidden.railDisplay = 'flex'; }],
    ['missing native owner identity', (row) => { row.baseline.openerSameNode = false; }],
    ['replaced hidden owner', (row) => { row.hidden.openerSameNode = false; }],
    ['injected hiding declaration', (row) => { row.hidden.style = { present: true, value: 'display:none!important' }; }],
    ['lost prior style bytes', (row) => { row.baseline.style = { present: true, value: 'color:gold' }; }],
    ['unknown prior style presence', (row) => { row.baseline.style = {}; }],
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
    ['opener rendered again', (row) => { row.fallback.openerRendered = true; }],
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

  it('requires exact style presence/bytes, native target identity and focus preservation after native Survey Close restores the rail', () => {
    const restored = (prior) => ({ ...visibleAtlas(), panel: null, cardOpen: false, focus: 'docksurvey',
      sameNode: true, centreOwned: true, focusUnchanged: true, ...prior });
    for (const prior of [{ present: false, value: null }, { present: true, value: '' },
      { present: true, value: 'color: gold !important;' }]) {
      expect(hiddenPanelOpenerRestorationOutcome(prior, restored(prior)).ok).toBe(true);
      for (const mutate of [
        row => { row.present = !prior.present; },
        row => { row.value = prior.value === null ? '' : null; },
        row => { row.sameNode = false; },
        row => { row.openerRendered = false; },
        row => { row.openerDisplay = 'none'; },
        row => { row.centreOwned = false; },
        row => { row.focusUnchanged = false; },
      ]) {
        const row = restored(prior); mutate(row);
        expect(hiddenPanelOpenerRestorationOutcome(prior, row).ok).toBe(false);
      }
    }
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
      "openerSameNode:opener===window.__cfGlassHiddenNativeOpener",
      "activateRealControl('#docksurvey', 'hidden-opener native Survey close restores rail')",
      'hiddenPanelOpenerRestorationOutcome(baseline.style, restored)',
      "delete window.__cfGlassHiddenNativeOpener",
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


describe('Glass responsive native control ownership', () => {
  const source = fs.readFileSync(new URL('../tools/glassmatrix.mjs', import.meta.url), 'utf8');
  it('selects visible rails or compact dock while retaining planned historical compositions', () => {
    const ordinary = source.slice(source.indexOf('        const ordinaryPanels = ['),
      source.indexOf('          const cardBeforePanel ='));
    expect(ordinary).toContain('const opener = wideChrome && item.rail ? item.rail : item.dock;');
    for(const id of ['codex','atlas','charters','shipyard'])expect(ordinary).toContain("rail: '#rail"+id+"'");
    expect(ordinary).toContain('vp.width > 700 && !(vp.width <= 900 && vp.width > vp.height)');
    expect(ordinary).toContain("vp.width > 900 && (item.id === 'rec' || item.id === 'inventory')");
    expect(ordinary).toContain("vp.width > 700 && (item.id === 'atlas' || item.id === 'shipyard')");
    const nonmodal = source.slice(source.indexOf('              const nonModalChrome ='),
      source.indexOf('              const revealHostileRow ='));
    expect(nonmodal).toContain("dockButton=document.getElementById('dockcodex')");
    expect(nonmodal).not.toContain("innerWidth>700?");
    expect(nonmodal).not.toContain("innerWidth>700\n");
    expect(nonmodal).toContain("expectedIds=['dockcharters','dockcodex','primechip','dockshipyard','dockatlas','dockrecords','docknotifications','dockguide','docksets']");
    expect(nonmodal).toContain('hiddenShelfRejected');
    expect(nonmodal).toContain("shelfActions=['dockinventory']");
    expect(nonmodal).toContain("shelf.getAttribute('style')===shelfStyle");
    expect(source).toContain("preferenceOutcome('#raillft','#railcharters','var(--ink)')");
  });

  it('judges the transparent header by visibility and dimensions, with genuine hiding controls', () => {
    const start=source.indexOf('shelfVisible=()=>');
    const end=source.indexOf(',positiveVisibility=',start);
    expect(start).toBeGreaterThan(0);expect(end).toBeGreaterThan(start);
    const expression=source.slice(start+'shelfVisible='.length,end);
    const style={display:'grid',visibility:'visible',pointerEvents:'none'};
    const rect={width:404,height:94};
    const shelf={getBoundingClientRect:()=>rect};
    const assess=()=>Function('shelf','getComputedStyle','return ('+expression+')()')(shelf,()=>style);
    expect(assess()).toBe(true);
    for(const [owner,key,value] of [[style,'display','none'],[style,'visibility','hidden'],[rect,'width',0],[rect,'height',0]]){
      const prior=owner[key];owner[key]=value;expect(assess()).toBe(false);owner[key]=prior;expect(assess()).toBe(true);
    }
    expect(source).toContain('hiddenShelfRejected=!shelfVisible()');
    expect(source).toContain('rendered(search)&&rendered(dock)&&shelfVisible()');
  });

  it('anchors above the measured right-bottom utility tray and rejects displaced or matching off-anchor trays', () => {
    const owner = source.slice(source.indexOf('  const rightBottomAnchorOutcome ='),
      source.indexOf('  const panelCloseOutcome ='));
    const box = (left, top, right, bottom) => ({ left, top, right, bottom, width: right-left, height: bottom-top });
    const observe = (width, height, dockBox, panelBox) => {
      const nodes = new Map([['#dock', { getBoundingClientRect: () => dockBox }],
        ['#panel', { getBoundingClientRect: () => panelBox }]]);
      const document = { documentElement: {}, querySelector: selector => nodes.get(selector) ?? null };
      // Deliberately stale dock-h: this anchor must read the current rectangle.
      const style = { getPropertyValue: name => name === '--dock-h' ? '999' : '0' };
      const outcome = Function('document','getComputedStyle','innerWidth','innerHeight','visible','round',
        owner + "\nreturn rightBottomAnchorOutcome('#panel');");
      return outcome(document, () => style, width, height, () => true, number => Math.round(number*100)/100);
    };
    const dock = box(1224, 844, 1424, 888), panel = box(1124, 400, 1424, 832);
    expect(observe(1440, 900, dock, panel).ok).toBe(true);
    expect(observe(1024, 768, box(808, 712, 1008, 756), box(708, 300, 1008, 700)).ok).toBe(true);
    expect(observe(1440, 900, dock, box(1128, 400, 1428, 832)).ok).toBe(false);
    expect(observe(1440, 900, dock, box(1124, 400, 1424, 844)).ok).toBe(false);
    expect(observe(1440, 900, box(1124, 844, 1324, 888), box(1024, 400, 1324, 832)).ok).toBe(false);
    expect(observe(1440, 900, dock, box(12, 400, 312, 832)).ok).toBe(false);

  });
});
