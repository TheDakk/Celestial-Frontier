/* The survey card: what a selected body is, in the game's own words. Its title, subtitle and rows come from the
   body's descriptor; a galaxy or a star adds the one action that travels into it. */
import type { Descriptor } from '@cf/domain-descriptors';
import { displayRarity } from '@cf/domain-speciestraits';
import { icon } from '../ui';
import { el } from './dom';

export interface CardAction { label: 'Enter galaxy' | 'Enter system'; run(): void }

export interface SelectionCard {
  readonly el: HTMLElement;
  readonly open: boolean;
  /** Shows the card of a descriptor. `opener` takes the focus back when the card is closed by its own controls. */
  show(descriptor: Descriptor, action: CardAction | null, opener: HTMLElement | null): void;
  hide(restoreFocus?: boolean): void;
  /** Gives the focus to the card's action, or to its close control when it has none. */
  focusPrimary(): void;
}

const GRADE_TIER_MAX = 14;
/** The rarity a grade is shown as; a missing or malformed grade shows none. */
function rarityName(designation: Descriptor['designation']): string | null {
  const tier = designation?.tier;
  if (typeof designation?.name !== 'string' || typeof tier !== 'number' || !Number.isInteger(tier) || tier < 0 || tier > GRADE_TIER_MAX) return null;
  return displayRarity(tier).name;
}

const surveyRow = (key: string, value: string, cls = ''): HTMLElement =>
  el('div', { class: 'survey-row', 'data-row': key, 'data-cls': cls }, el('span', {}, key), el('br'), value);

export function createSelectionCard(host: HTMLElement, onChange: () => void = () => undefined): SelectionCard {
  const card = el('aside', { class: 'card', 'aria-label': 'Survey card', 'aria-hidden': 'true', 'data-panel-boundary': true, hidden: true });
  host.append(card);
  let opener: HTMLElement | null = null;
  let action: CardAction | null = null;

  const hide = (restoreFocus = false): void => {
    if (card.hidden) return;
    card.hidden = true;
    card.setAttribute('aria-hidden', 'true');
    card.replaceChildren();
    action = null;
    const back = opener;
    opener = null;
    if (restoreFocus && back?.isConnected) back.focus();
    onChange();
  };
  card.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-survey-close]')) hide(true);
    else if (target?.closest('[data-act="travel"]')) action?.run();
  });

  return {
    el: card,
    get open() { return !card.hidden; },
    show(d, travel, from) {
      action = travel;
      opener = from;
      // A planet's rarity is shown only once it has been landed on, which arrives with landing.
      const rarity = typeof d.planetSeed === 'number' ? null : rarityName(d.designation);
      const close = el('button', { type: 'button', class: 'panel-close', 'data-survey-close': true, 'aria-label': 'Close Survey card' }, icon('close', { decorative: true }));
      const sub = el('div', { 'data-sel': 'sub' }, d.sub ?? '');
      if (d.badge) sub.append(' · ', el('b', { 'data-sel': 'badge' }, d.badge));
      card.replaceChildren(
        el('div', { class: 'survey-head' }, el('h2', { 'data-sel': 'title' }, d.title), close),
        sub,
        ...(travel === null ? [] : [el('div', { class: 'card-actions' }, el('button', { type: 'button', 'data-act': 'travel', class: 'primary' }, travel.label))]),
        ...(rarity === null ? [] : [surveyRow('Rarity', rarity)]),
        ...d.rows.filter(([key]) => key !== 'Spectral class').map(([key, value, cls]) => surveyRow(key, value, cls)),
      );
      card.hidden = false;
      card.setAttribute('aria-hidden', 'false');
      onChange();
    },
    hide,
    focusPrimary() {
      (card.querySelector<HTMLElement>('[data-act="travel"]') ?? card.querySelector<HTMLElement>('[data-survey-close]'))?.focus();
    },
  };
}
