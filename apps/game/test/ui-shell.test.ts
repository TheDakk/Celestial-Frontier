// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyMotion, motionReduced } from '../src/ui/motion';
import { capturePanelRefillFocus } from '../src/ui/panel-refill-focus';
import { TOAST_DEDUP_MS, TOAST_SHOW_MS, createToast } from '../src/ui/toast';
import { UI_TOKENS } from '../src/ui/tokens';

beforeEach(() => { vi.useFakeTimers(); document.body.innerHTML = '<div id="toast"></div><div id="panel"></div>'; });
afterEach(() => { vi.useRealTimers(); });

describe('toast', () => {
  const make = (popUps = true) => {
    let now = 10_000;
    const el = document.getElementById('toast')!;
    const toast = createToast({ el, now: () => now, popUps: () => popUps });
    return { el, toast, advance: (ms: number) => { now += ms; } };
  };

  it('shows a title and a message as text, announces them, and fades after its time', () => {
    const { el, toast } = make();
    expect([el.getAttribute('role'), el.style.opacity]).toEqual(['status', '0']);
    toast.show('Save <b>protected</b>', 'It remains unchanged.');
    expect(el.querySelector('b')!.textContent).toBe('Save <b>protected</b>');
    expect(el.querySelectorAll('b')).toHaveLength(1);
    expect(el.querySelector('span')!.textContent).toBe('It remains unchanged.');
    expect([el.style.opacity, el.getAttribute('aria-live')]).toEqual(['1', 'polite']);
    vi.advanceTimersByTime(TOAST_SHOW_MS - 1);
    expect(el.style.opacity).toBe('1');
    vi.advanceTimersByTime(1);
    expect(el.style.opacity).toBe('0');
  });

  it('drops a second toast that follows at once, unless it is forced', () => {
    const { el, toast, advance } = make();
    toast.show('First', 'one');
    advance(TOAST_DEDUP_MS - 1);
    toast.show('Second', 'two');
    expect(el.querySelector('b')!.textContent).toBe('First');
    toast.show('Forced', 'three', true);
    expect([el.querySelector('b')!.textContent, el.getAttribute('aria-live')]).toEqual(['Forced', 'assertive']);
    advance(TOAST_DEDUP_MS);
    toast.show('Later', 'four');
    expect(el.querySelector('b')!.textContent).toBe('Later');
  });

  it('with pop-ups off the text is still there for a reader but is not painted', () => {
    const { el, toast } = make(false);
    toast.show('Quiet', 'kept for a reader');
    expect([el.textContent, el.style.opacity, el.dataset.quiet]).toEqual(['Quietkept for a reader', '0', 'true']);
  });
});

describe('motion', () => {
  it('auto follows the device, full and reduced do not', () => {
    expect([motionReduced(-1, true), motionReduced(-1, false)]).toEqual([true, false]);
    expect([motionReduced(0, true), motionReduced(1, false)]).toEqual([false, true]);
    applyMotion(document.documentElement, true);
    expect(document.documentElement.dataset.motion).toBe('reduced');
    applyMotion(document.documentElement, false);
    expect(document.documentElement.dataset.motion).toBe('full');
  });
});

describe('focus across a panel refill', () => {
  const panel = (): HTMLElement => document.getElementById('panel')!;
  const fill = (): void => { panel().innerHTML = '<button data-pnx="p">x</button><button data-set="sound">Sound</button><button data-set="tips">Tips</button>'; };

  it('returns the focus to the rebuilt control with the same identity', () => {
    fill();
    panel().querySelector<HTMLElement>('[data-set="tips"]')!.focus();
    const restore = capturePanelRefillFocus(panel(), ['data-set']);
    fill();
    restore();
    expect(document.activeElement).toBe(panel().querySelector('[data-set="tips"]'));
  });

  it('falls back to the close control when the control is gone or disabled, and leaves a focus outside the panel alone', () => {
    fill();
    panel().querySelector<HTMLElement>('[data-set="tips"]')!.focus();
    const restore = capturePanelRefillFocus(panel(), ['data-set']);
    fill();
    panel().querySelector<HTMLButtonElement>('[data-set="tips"]')!.disabled = true;
    restore();
    expect(document.activeElement).toBe(panel().querySelector('[data-pnx]'));

    (document.activeElement as HTMLElement).blur();
    const none = capturePanelRefillFocus(panel(), ['data-set']);
    fill();
    none();
    expect(document.activeElement).toBe(document.body);
  });
});

describe('interface colours', () => {
  it('the surface of a sheet and of a raised control lets nothing behind it show: no colour has an alpha', () => {
    expect([UI_TOKENS['color-surface'], UI_TOKENS['color-elevated']]).toEqual(['#0a101e', '#101828']);
    for (const [name, value] of Object.entries(UI_TOKENS)) {
      if (name.startsWith('color-')) expect(value, name).toMatch(/^(#[0-9a-f]{6}|var\(--[a-z]+\))$/);
    }
  });
});
