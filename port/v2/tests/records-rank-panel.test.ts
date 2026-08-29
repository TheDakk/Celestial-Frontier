import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';
import type { Arc9RecordsRankReadModelV1 } from '../apps/game/src/records-rank-model.js';
import {
  ARC9_RECORDS_RANK_PANEL_SCHEMA_V1,
  renderArc9RecordsRankPanelV1,
} from '../apps/game/src/records-rank-panel.js';

interface TestWindow extends Window { close(): void }
interface TestDom { readonly window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const openDoms: TestDom[] = [];
afterEach(() => {
  for (const dom of openDoms.splice(0)) dom.window.close();
});

function parse(html: string): Document {
  const dom = new JSDOM(`<main>${html}</main>`);
  openDoms.push(dom);
  return dom.window.document;
}

function model(): Arc9RecordsRankReadModelV1 {
  const categoryNames = [
    'Cataloguing', 'Breeding', 'Rarity', 'Worlds', 'Stellar', 'Exploration',
    'Engineering', 'Cosmic Events', 'Conquest', 'Survival', 'Husbandry',
    'Duels', 'Legacy',
  ] as const;
  const statuses = ['unlocked', 'eligible', 'locked', 'event-owner-required'] as const;
  let ordinal = 0;
  const categories = categoryNames.map((category, categoryIndex) => {
    const rowCount = categoryIndex < 5 ? 8 : 7;
    const rows = Array.from({ length: rowCount }, () => {
      const index = ordinal++;
      return Object.freeze({
        id: `achievement-${index}`,
        icon: index === 0 ? '<script>' : '✦',
        name: index === 1 ? 'Prospector&#8217;s Luck' : `Milestone ${index}`,
        description: index === 2 ? '<img src=x onerror=alert(1)>' : `Description ${index}`,
        status: statuses[index % statuses.length]!,
      });
    });
    return Object.freeze({
      category,
      total: rows.length,
      unlocked: rows.filter(({ status }) => status === 'unlocked').length,
      eligible: rows.filter(({ status }) => status === 'eligible').length,
      locked: rows.filter(({ status }) => status === 'locked').length,
      eventOwnerRequired: rows.filter(({ status }) => status === 'event-owner-required').length,
      rows: Object.freeze(rows),
    });
  });
  return Object.freeze({
    schema: 'cf-v2-arc9-records-rank-read-model/v1',
    rank: Object.freeze({
      score: 8_911,
      index: 9,
      name: 'Eternal Frontier',
      floor: 8_200,
      nextThreshold: 11_200,
      nextName: 'Eternal Frontier ✦1',
      progress: 711,
      span: 3_000,
      prestigeLevel: 0,
      bestRankIndex: 9,
      nameplateHue: 'irid',
      nameplateIridescent: true,
    }),
    factors: Object.freeze([
      Object.freeze({ id: 'living-worlds-surveyed', label: 'Living worlds surveyed', value: 5, scorePerUnit: 4, scoreContribution: 20 }),
      Object.freeze({ id: 'species-catalogued', label: 'Species catalogued', value: 20, scorePerUnit: 2, scoreContribution: 40 }),
      Object.freeze({ id: 'best-raw-rarity-tier', label: 'Highest raw rarity tier', value: 9, scorePerUnit: 12, scoreContribution: 108 }),
      Object.freeze({ id: 'achievements-unlocked', label: 'Achievements unlocked', value: 5, scorePerUnit: 6, scoreContribution: 30 }),
      Object.freeze({ id: 'hybrids-bred', label: 'Hybrids bred', value: 10, scorePerUnit: 1, scoreContribution: 10 }),
      Object.freeze({ id: 'galaxies-visited', label: 'Galaxies visited', value: 1, scorePerUnit: 3, scoreContribution: 3 }),
    ]),
    achievements: Object.freeze(categories),
    unsupportedUnlockedIds: Object.freeze(['compat:future-proof']),
    durableUnlockedCount: 25,
    eligibleAggregateCount: 24,
    eventOwnerRequiredCount: 24,
    aggregateRefreshAvailable: true,
  });
}

describe('Arc 9 Records/rank panel projection', () => {
  it('renders one bounded rank card, six factors, thirteen native shelves, and all 96 rows', () => {
    const document = parse(renderArc9RecordsRankPanelV1(model()));
    expect(document.querySelector('[data-arc9-records-rank]')?.getAttribute('data-arc9-records-rank'))
      .toBe(ARC9_RECORDS_RANK_PANEL_SCHEMA_V1);
    expect(document.querySelectorAll('[data-rank-factor]')).toHaveLength(6);
    expect(document.querySelectorAll('details[data-achievement-category]')).toHaveLength(13);
    expect(document.querySelectorAll('[data-achievement-id]')).toHaveLength(96);
    expect(document.querySelector('progress')?.getAttribute('aria-label'))
      .toBe('Progress to Eternal Frontier ✦1');
    expect(document.querySelector('progress')?.getAttribute('value')).toBe('711');
    expect(document.querySelector('[data-rank-iridescent="true"]')).not.toBeNull();
    expect(document.querySelector('[data-achievement-compatibility]')?.textContent)
      .toContain('compat:future-proof');
  });

  it('escapes model text, decodes the one frozen legacy apostrophe, and explains every status', () => {
    const html = renderArc9RecordsRankPanelV1(model());
    const document = parse(html);
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
    expect(document.body.textContent).toContain('<script>');
    expect(document.body.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(document.body.textContent).toContain('Prospector’s Luck');
    expect(document.body.textContent).not.toContain('&#8217;');
    expect(document.body.textContent).toContain('Unlocked');
    expect(document.body.textContent).toContain('Awaiting durable record');
    expect(document.body.textContent).toContain('In progress');
    expect(document.body.textContent).toContain('Requires its exact live event');
  });
});
