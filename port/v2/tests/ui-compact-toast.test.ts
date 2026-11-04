import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { transformSync } from 'rolldown/utils';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
function owner(start: string, end: string): string {
  expect(main.split(start)).toHaveLength(2); expect(main.split(end)).toHaveLength(2);
  return main.slice(main.indexOf(start), main.indexOf(end));
}
function compile(source: string): string {
  const transformed = transformSync('compact-toast.ts', source);
  expect(transformed.errors).toEqual([]); return transformed.code;
}
function fixture() {
  const dom = new JSDOM('<!doctype html><div id="toast" aria-atomic="true"></div>');
  const toast = dom.window.document.getElementById('toast'), record = vi.fn(), timers: Array<() => void> = [];
  const source = owner('function toastDetailText()', 'function tameToastCounterpartIsCurrent(')
    + owner('function showToast(', 'function toast(title:');
  const fns = runInNewContext(compile(source)
    + ';({showToast,showCompendiumFeedVisualToast,toastDetailText})', {
    toastEl: toast, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node,
    notificationHistory: { record }, invalidateTameToastCounterpart: vi.fn(),
    save: { notifOn: true }, // D16: the pop-up switch (default on); off is covered by d16-notification-popups-outcome
    _toastSerial: 0, _toastHide: 0, _toastT: 0, performance: { now: () => 1 },
    window: { setTimeout: (callback: () => void, ms: number) => { expect(ms).toBe(3600); timers.push(callback); return timers.length; } },
    clearTimeout: vi.fn(), esc: (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  });
  return { dom, toast, record, timers, fns };
}
it('retains escaped complete ordinary and Feed messages, announcement policy, and original expiry across compact presentation', () => {
  const { dom, toast, record, timers, fns } = fixture();
  const title = 'Homecoming <test>', message = 'Full detail & <script> remains plain text';
  fns.showToast(title, message, true);
  const children = [...toast.childNodes];
  for (const compact of [true, false]) {
    toast.classList.toggle('toast-compact', compact);
    expect(fns.toastDetailText()).toBe(message); expect(toast.textContent).toBe(title + message);
    expect([...toast.childNodes].every((node, i) => node === children[i])).toBe(true);
    expect(toast.getAttribute('role')).toBe('status'); expect(toast.getAttribute('aria-live')).toBe('assertive');
    expect(toast.getAttribute('aria-atomic')).toBe('true'); expect(toast.hasAttribute('aria-hidden')).toBe(false);
    expect(toast.querySelector('script')).toBeNull(); expect(toast.style.opacity).toBe('1');
  }
  expect(record).toHaveBeenCalledWith(title, message, expect.any(Number));
  timers[0]!(); expect(toast.style.opacity).toBe('0');
  fns.showCompendiumFeedVisualToast(title, message);
  expect(fns.toastDetailText()).toBe(message); expect(toast.getAttribute('role')).toBe('presentation');
  expect(toast.getAttribute('aria-live')).toBe('off'); expect(toast.getAttribute('aria-hidden')).toBe('true');
  timers[1]!(); expect(toast.style.opacity).toBe('0'); dom.window.close();
});
it('refuses altered message structure and restores the exact accepted detail', () => {
  const { dom, toast, fns } = fixture(); fns.showToast('Title', 'Exact detail', false);
  const message = toast.querySelector('[data-sel="toast-message"]'), original = message.getAttribute('data-sel');
  message.setAttribute('data-sel', 'other'); expect(fns.toastDetailText()).toBeNull();
  message.setAttribute('data-sel', original); expect(fns.toastDetailText()).toBe('Exact detail');
  const extra = dom.window.document.createTextNode('forged'); message.appendChild(extra);
  expect(fns.toastDetailText()).toBeNull(); extra.remove(); expect(fns.toastDetailText()).toBe('Exact detail');
  dom.window.close();
});
it('keeps Survey title and native Close in the sticky header while the unchanged subtitle and badge scroll in the body', () => {
  const dom = new JSDOM('<!doctype html><div id="survey"></div>'), card = dom.window.document.getElementById('survey');
  const begin = "  card.innerHTML =\n    '<div class=\"survey-head\">' +", end = '  const captureMount = card.querySelector';
  const source = owner(begin, end);
  runInNewContext(compile(source), { card, d: { title: 'Earth', sub: 'Long descriptive subtitle', badge: 'Home' },
    esc: (value: string) => value, travelHtml: '', actionsHtml: '<button data-act="landcta">Land</button>',
    approachEcologyHtml: '', combatHtml: '', captureHtml: '', rarity: '', rows: [] });
  const header = card.querySelector('.survey-head'), subtitle = card.querySelector('[data-sel="sub"]');
  expect(header.querySelector('[data-survey-close]').getAttribute('aria-label')).toBe('Close Survey card');
  expect(header.querySelector('[data-sel="title"]').textContent).toBe('Earth');
  expect(subtitle.parentElement).toBe(card); expect(header.contains(subtitle)).toBe(false);
  expect(subtitle.textContent).toBe('Long descriptive subtitle · Home'); expect(card.querySelector('[data-act="landcta"]')).not.toBeNull();
  dom.window.close();
});
