// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Descriptor } from '@cf/domain-descriptors';
import { createSearchBox } from '../src/screens/search-box';
import { createSelectionCard } from '../src/screens/selection-card';
import { recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
beforeEach(() => { document.body.innerHTML = '<button id="opener">map</button><div id="host"></div>'; });

const host = (): HTMLElement => document.getElementById('host')!;
const GALAXY: Descriptor = {
  title: 'Kaaeper <Galaxy>', sub: 'Spiral galaxy', badge: 'Home',
  rows: [['Spectral class', 'Royal Blue — Exotic', 'grade'], ['Stars', '~200 billion stars'], ['Note', 'Our home galaxy', 'note']],
  designation: { tier: 4, name: 'Exotic' },
};

describe('the survey card', () => {
  it('shows the title, the subtitle with its badge, the rarity and the rows, as text', () => {
    const changes = vi.fn();
    const card = createSelectionCard(host(), changes);
    expect([card.open, card.el.hidden, card.el.getAttribute('aria-hidden')]).toEqual([false, true, 'true']);
    card.show(GALAXY, null, null);
    expect([card.open, card.el.hidden, card.el.getAttribute('aria-hidden'), changes.mock.calls.length]).toEqual([true, false, 'false', 1]);
    expect(card.el.querySelector('h2')!.textContent).toBe('Kaaeper <Galaxy>');
    expect(card.el.querySelector('[data-sel="sub"]')!.textContent).toBe('Spiral galaxy · Home');
    expect([...card.el.querySelectorAll<HTMLElement>('.survey-row')].map((row) => [row.dataset.row, row.dataset.cls, row.lastChild!.textContent]))
      .toEqual([['Rarity', '', 'Exotic'], ['Stars', '', '~200 billion stars'], ['Note', 'note', 'Our home galaxy']]);
    expect(card.el.querySelector('[data-act="travel"]')).toBeNull();
  });

  it('a card whose rows run below its foot shows that it scrolls', async () => {
    const card = createSelectionCard(host());
    // jsdom lays nothing out: the card's window is 200 pixels over 500 of rows once it is drawn.
    Object.defineProperty(card.el, 'clientHeight', { configurable: true, get: () => 200 });
    Object.defineProperty(card.el, 'scrollHeight', { configurable: true, get: () => (card.el.childElementCount === 0 ? 200 : 500) });
    card.show(GALAXY, null, null);
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(card.el.hasAttribute('data-more-below')).toBe(true);
    card.hide();
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(card.el.hasAttribute('data-more-below')).toBe(false);
  });

  it('shows no rarity for a world, nor for a grade that is missing or malformed', () => {
    const card = createSelectionCard(host());
    const rarity = (d: Descriptor): boolean => { card.show(d, null, null); return card.el.querySelector('[data-row="Rarity"]') !== null; };
    expect(rarity({ ...GALAXY, planetSeed: 133 })).toBe(false);
    expect(rarity({ title: 'x', rows: [] })).toBe(false);
    expect(rarity({ ...GALAXY, designation: { tier: 99, name: 'Exotic' } })).toBe(false);
    expect(rarity({ ...GALAXY, designation: { tier: 4 } })).toBe(false);
    expect(rarity(GALAXY)).toBe(true);
  });

  it('its action travels; its close control hides it and gives the focus back to what opened it', () => {
    const card = createSelectionCard(host());
    const opener = document.getElementById('opener')!;
    const run = vi.fn();
    card.show(GALAXY, { label: 'Enter galaxy', run }, opener);
    card.focusPrimary();
    const travel = card.el.querySelector<HTMLButtonElement>('[data-act="travel"]')!;
    expect([travel.textContent, document.activeElement === travel]).toEqual(['Enter galaxy', true]);
    travel.click();
    expect(run).toHaveBeenCalledOnce();
    const close = card.el.querySelector<HTMLButtonElement>('[data-survey-close]')!;
    expect(close.getAttribute('aria-label')).toBe('Close Survey card');
    close.click();
    expect([card.open, card.el.childElementCount, document.activeElement === opener]).toEqual([false, 0, true]);
    // With no action the close control is the card's first stop; a hidden card runs nothing.
    card.show(GALAXY, null, null);
    card.focusPrimary();
    expect(document.activeElement).toBe(card.el.querySelector('[data-survey-close]'));
    card.hide();
    expect([card.open, run.mock.calls.length]).toEqual([false, 1]);
  });
});

describe('the search field', () => {
  it('hands its text over on Enter, and clears and lets go only when that travelled', () => {
    const asked: string[] = [];
    let travels = false;
    const search = createSearchBox(host(), (text) => { asked.push(text); return travels; });
    expect(search.el.getAttribute('aria-label')).toBe('search or paste a code');
    search.el.focus();
    search.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    search.el.value = 'CF1-abc';
    search.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    search.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect([asked, search.el.value, document.activeElement === search.el]).toEqual([['CF1-abc'], 'CF1-abc', true]);
    travels = true;
    search.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect([asked.length, search.el.value, document.activeElement === search.el, search.blurIfFocused()]).toEqual([2, '', false, false]);
    search.el.focus();
    expect([search.blurIfFocused(), document.activeElement === search.el]).toEqual([true, false]);
  });
});
