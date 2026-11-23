// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InputMode } from '../src/events';
import { TOOLTIP_HOVER_MS, TOOLTIP_PRESS_MS, TooltipOwner } from '../src/ui/tooltips';

let owner: TooltipOwner | null = null;
afterEach(() => { owner?.dispose(); owner = null; document.body.replaceChildren(); });

function harness(mode: InputMode, state: { tipsOn: boolean; training?: boolean } = { tipsOn: true }) {
  document.body.innerHTML = `<button id="hint" data-tip="Opens your ship">Ship</button>
    <button id="native" title="Salvage exact item">S</button><button id="plain">x</button>`;
  const timers = new Map<number, { fn: () => void; ms: number }>();
  let seq = 0;
  const current = { mode };
  owner = new TooltipOwner({
    document, mode: () => current.mode, enabled: () => state.tipsOn, blocked: () => state.training === true,
    setTimeout: (fn, ms) => { timers.set(++seq, { fn, ms }); return seq; },
    clearTimeout: (id) => { timers.delete(id); },
  });
  const flush = (): number[] => { const all = [...timers.values()]; timers.clear(); all.forEach((t) => t.fn()); return all.map((t) => t.ms); };
  const $ = (id: string): HTMLElement => document.getElementById(id)!;
  const pointer = (type: string, el: Element, x = 10, y = 10, pointerType = 'touch'): void => {
    el.dispatchEvent(Object.assign(new Event(type, { bubbles: true, cancelable: true }), { clientX: x, clientY: y, pointerType }));
  };
  const key = (name: string): void => { document.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true })); };
  return { owner, $, flush, pointer, key, current, bubble: () => owner!.bubble };
}

describe('tooltips', () => {
  it('mouse: hovering a [data-tip] shows the hint after the delay; leaving hides it; a native title is left to the browser', () => {
    expect(TOOLTIP_HOVER_MS).toBe(650);
    const h = harness('mouse');
    h.$('hint').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(h.bubble().hidden).toBe(true);
    expect(h.flush()).toEqual([650]);
    expect(h.bubble().hidden).toBe(false);
    expect(h.bubble().textContent).toBe('Opens your ship');
    expect(h.bubble().getAttribute('role')).toBe('tooltip');
    h.$('hint').dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: h.$('plain') }));
    expect(h.bubble().hidden).toBe(true);
    h.$('native').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    h.flush();
    expect(h.bubble().hidden).toBe(true);
  });
  it('touch: a long-press reads a native title, and the click that ends it is swallowed; a drag cancels; a tap acts', () => {
    expect(TOOLTIP_PRESS_MS).toBe(600);
    const h = harness('touch');
    const clicked = vi.fn();
    h.$('native').addEventListener('click', clicked);
    h.pointer('pointerdown', h.$('native'));
    expect(h.flush()).toEqual([600]);
    expect(h.bubble().textContent).toBe('Salvage exact item');
    h.pointer('pointerup', h.$('native'));
    h.$('native').click();
    expect(clicked).not.toHaveBeenCalled();
    h.pointer('pointerdown', h.$('plain')); // a press elsewhere hides it
    expect(h.bubble().hidden).toBe(true);
    h.pointer('pointerdown', h.$('native'));
    h.pointer('pointermove', h.$('native'), 40, 10);
    h.flush();
    expect(h.bubble().hidden).toBe(true);
    h.$('native').click();
    expect(clicked).toHaveBeenCalledTimes(1);
  });
  it('a tip opens on keyboard focus and on a long press, not only on hover', () => {
    // Keyboard, on a mouse device: focus alone opens it, with no wait.
    const h = harness('mouse');
    h.key('Tab');
    h.$('hint').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(h.bubble().hidden).toBe(false);
    expect(h.bubble().textContent).toBe('Opens your ship');
    h.$('hint').dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(h.bubble().hidden).toBe(true);
    // Keyboard, on a touch device with a keyboard attached.
    h.current.mode = 'touch';
    h.key('Tab');
    h.$('hint').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(h.bubble().hidden).toBe(false);
    h.key('Escape');
    expect(h.bubble().hidden).toBe(true);
    // Touch: a long press opens it on a [data-tip] too.
    h.pointer('pointerdown', h.$('hint'));
    h.flush();
    expect(h.bubble().textContent).toBe('Opens your ship');
    expect(h.bubble().hidden).toBe(false);
  });
  it('touch: the focus a tap gives, and the hover a tap fakes, open nothing', () => {
    const h = harness('touch');
    h.pointer('pointerdown', h.$('hint'));
    h.pointer('pointerup', h.$('hint'));
    h.$('hint').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    h.$('hint').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    h.flush();
    expect(h.bubble().hidden).toBe(true);
  });
  it('mouse: a long press with the mouse opens nothing and swallows no click', () => {
    const h = harness('mouse');
    const clicked = vi.fn();
    h.$('hint').addEventListener('click', clicked);
    h.pointer('pointerdown', h.$('hint'), 10, 10, 'mouse');
    expect(h.flush()).toEqual([]);
    h.$('hint').click();
    expect(clicked).toHaveBeenCalledTimes(1);
  });
  it('the switch off and Field Training silence it', () => {
    const off = harness('mouse', { tipsOn: false });
    off.$('hint').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    off.flush();
    expect(off.bubble().hidden).toBe(true);
    off.owner!.dispose();
    const drill = harness('mouse', { tipsOn: true, training: true });
    drill.$('hint').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(drill.bubble().hidden).toBe(true);
  });
  it('the bubble never takes a press, and is gone after dispose', () => {
    const h = harness('mouse');
    expect(h.bubble().style.pointerEvents).toBe('none');
    expect(h.bubble().isConnected).toBe(true);
    h.owner!.dispose();
    expect(h.bubble().isConnected).toBe(false);
    h.$('hint').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(h.flush()).toEqual([]);
  });
});
