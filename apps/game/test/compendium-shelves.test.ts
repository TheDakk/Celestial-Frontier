// @vitest-environment jsdom
// The Compendium's kingdom and rarity filters, its order, its heading and its shelves, as the legacy game has them
// (LEGACY celestial-frontier.html, renderCodex 15221-15307, the chips 15436-15449). Lines cited below are that file's.
import { REALM_ICON, REALM_ORDER } from '@cf/domain-genome';
import { describe, expect, it } from 'vitest';
import {
  CODEX_KINGDOM_CHIPS_V1, CODEX_RARITY_CHIPS_V1, CODEX_SHELF_OF_V1, CODEX_SHELF_ORDER_V1, DEFAULT_CODEX_LIST_VIEW_V1,
  codexChipBarV1, codexChipPressV1, codexChipsFilteringV1, codexChipsShownV1, codexEmptyNoteV1, codexEntryMatchesV1, codexHeadingV1,
  codexShelfLabelV1, codexShelfOfV1, compareCodexEntriesV1, shelveCodexRowsV1, type CodexEntryLikeV1, type CodexListViewV1,
} from '../src/compendium';
import { recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();

const entry = (name: string, kind: string, realm: string, tier: number | null, hybrid = false): CodexEntryLikeV1 => ({ name, kind, realm, tier, hybrid });
const CODEX: readonly CodexEntryLikeV1[] = [
  entry('Civet', 'Fauna', 'Land Fauna', 1),
  entry('Salmon', 'Fauna', 'Aquatic Fauna', 5),
  entry('Fern', 'Flora', 'Flora', 0),
  entry('Morel', 'Fungi', 'Fungi', 3),
  entry('Newt', 'Fauna', 'Amphibious Life', 12, true),
  entry('Diatom', 'Microbe', 'Microbial Life', null),
];
const view = (over: Partial<CodexListViewV1> = {}): CodexListViewV1 => ({ ...DEFAULT_CODEX_LIST_VIEW_V1, ...over });
const shown = (v: CodexListViewV1): string[] => CODEX.filter((e) => codexEntryMatchesV1(e, v)).map((e) => e.name).sort();
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|️|⃣/u;

describe('Compendium filters', () => {
  it('the two chip ladders are the legacy game\'s (15440, 15443), with an icon name where it drew an emoji; there is no Shelves chip and no text search', () => {
    expect(CODEX_KINGDOM_CHIPS_V1).toEqual([
      ['all', 'All', null], ['Fauna', 'Fauna', 'paw'], ['Flora', 'Flora', 'flora'], ['Fungi', 'Fungi', 'fungi'], ['Microbe', 'Microbes', 'microbe'],
    ]);
    expect(CODEX_RARITY_CHIPS_V1).toEqual([[0, 'All'], [3, 'Rare+'], [5, 'Legendary+'], [6, 'Mythic+']]);
    // LEGACY 15323-15324: the view is a kingdom and a rarity floor, nothing else; shelves are always on (15284-15306).
    expect(DEFAULT_CODEX_LIST_VIEW_V1).toEqual({ kingdom: 'all', rarityFloor: 0 });
  });

  it('the kingdom chip filters by kind, and All restores', () => {
    expect(shown(view())).toEqual(['Civet', 'Diatom', 'Fern', 'Morel', 'Newt', 'Salmon']);
    expect(shown(view({ kingdom: 'Fauna' }))).toEqual(['Civet', 'Newt', 'Salmon']);
    expect(shown(view({ kingdom: 'Microbe' }))).toEqual(['Diatom']);
    expect(codexChipsFilteringV1(view())).toBe(false);
    expect(codexChipsFilteringV1(view({ kingdom: 'Fauna' }))).toBe(true);
    expect(codexChipsFilteringV1(view({ rarityFloor: 3 }))).toBe(true);
  });

  it('the rarity floor compares the display tier: raw 12 passes Mythic+, and an unrated species passes no floor', () => {
    expect(shown(view({ rarityFloor: 3 }))).toEqual(['Morel', 'Newt', 'Salmon']);
    expect(shown(view({ rarityFloor: 5 }))).toEqual(['Newt', 'Salmon']);
    expect(shown(view({ rarityFloor: 6 }))).toEqual(['Newt']);
    expect(shown(view({ rarityFloor: 6, kingdom: 'Flora' }))).toEqual([]);
    // each floor admits its own tier and refuses the one below
    for (const [floor] of CODEX_RARITY_CHIPS_V1) {
      if (floor === 0) continue;
      expect(codexEntryMatchesV1(entry('x', 'Fauna', 'Land Fauna', floor), view({ rarityFloor: floor })), `tier ${floor} at floor ${floor}`).toBe(true);
      expect(codexEntryMatchesV1(entry('x', 'Fauna', 'Land Fauna', floor - 1), view({ rarityFloor: floor })), `tier ${floor - 1} at floor ${floor}`).toBe(false);
    }
    expect(codexEntryMatchesV1(entry('x', 'Fauna', 'Land Fauna', null), view({ rarityFloor: 3 }))).toBe(false);
    expect(codexEntryMatchesV1(entry('x', 'Fauna', 'Land Fauna', 14), view({ rarityFloor: 6 }))).toBe(true);
  });

  it('LEGACY 15439: the chips are shown only after training and with at least one species', () => {
    expect(codexChipsShownV1({ tutDone: true, species: 1 })).toBe(true);
    expect(codexChipsShownV1({ tutDone: false, species: 9 })).toBe(false);
    expect(codexChipsShownV1({ tutDone: true, species: 0 })).toBe(false);
  });

  it('LEGACY 15232: the list reads rarest first by raw tier, then hybrids, then kind, then name', () => {
    const list = [
      entry('Bee', 'Fauna', 'Land Fauna', 3), entry('Ant', 'Fauna', 'Land Fauna', 3), entry('Moss', 'Flora', 'Flora', 3),
      entry('Cross', 'Fungi', 'Fungi', 3, true), entry('Top', 'Microbe', 'Microbial Life', 12), entry('High', 'Fauna', 'Land Fauna', 9),
      entry('None', 'Fauna', 'Land Fauna', null), entry('Zero', 'Fauna', 'Land Fauna', 0),
    ];
    expect([...list].sort(compareCodexEntriesV1).map((e) => e.name)).toEqual(['Top', 'High', 'Cross', 'Ant', 'Bee', 'Moss', 'None', 'Zero']);
  });

  it('LEGACY 15242-15244: the heading counts all species and hybrids, or what a filter shows', () => {
    expect(codexHeadingV1(view(), { shown: 6, total: 6, hybrids: 1 })).toBe('6 species · 1 hybrid bred');
    expect(codexHeadingV1(view(), { shown: 6, total: 6, hybrids: 2 })).toBe('6 species · 2 hybrids bred');
    expect(codexHeadingV1(view({ kingdom: 'Fauna' }), { shown: 3, total: 6, hybrids: 1 })).toBe('3 fauna shown · 6 species in all');
    expect(codexHeadingV1(view({ kingdom: 'Microbe' }), { shown: 1, total: 6, hybrids: 1 })).toBe('1 microbes shown · 6 species in all');
    expect(codexHeadingV1(view({ rarityFloor: 5 }), { shown: 2, total: 6, hybrids: 1 })).toBe('2 species shown · 6 species in all');
  });

  it('LEGACY 15245-15248: an empty filtered list says why, the rarity floor first', () => {
    expect(codexEmptyNoteV1(view(), 0)).toBeNull();
    expect(codexEmptyNoteV1(view({ rarityFloor: 3 }), 2)).toBeNull();
    expect(codexEmptyNoteV1(view({ rarityFloor: 3 }), 0)).toBe('No species at Rare or above yet — the rarest finds live farthest out.');
    expect(codexEmptyNoteV1(view({ rarityFloor: 6, kingdom: 'Flora' }), 0)).toBe('No flora at Mythic or above yet — the rarest finds live farthest out.');
    expect(codexEmptyNoteV1(view({ kingdom: 'Fauna' }), 0)).toBe('Nothing on this shelf yet — every creature you Discover will land here.');
    expect(codexEmptyNoteV1(view({ kingdom: 'Fungi' }), 0)).toBe('Nothing on this shelf yet — every fungi you catalogue will land here.');
  });

  it('a chip press changes only its own part of the view; anything else is not a chip', () => {
    const base = view();
    expect(codexChipPressV1(base, { ck: 'Fauna' })).toEqual({ kingdom: 'Fauna', rarityFloor: 0 });
    expect(codexChipPressV1(base, { cr: '5' })).toEqual({ kingdom: 'all', rarityFloor: 5 });
    expect(codexChipPressV1(base, {})).toBeNull();
    expect(codexChipPressV1(base, { ck: 'Animal' })).toBeNull();
    expect(codexChipPressV1(base, { cr: '4' })).toBeNull();
    expect(codexChipPressV1(base, { cshelves: 'on' } as never)).toBeNull();
  });

  it('the chip bar is a toolbar of real buttons, each saying whether it is pressed, with icons and no emoji', () => {
    const bar = codexChipBarV1(view({ kingdom: 'Fauna', rarityFloor: 5 }));
    expect([bar.className, bar.dataset.sel, bar.getAttribute('role'), bar.getAttribute('aria-label')]).toEqual(['codex-chips', 'codex-chips', 'toolbar', 'Compendium filters']);
    expect([...bar.children].map((row) => row.className)).toEqual(['codex-chip-row', 'codex-chip-row']);
    const chips = [...bar.querySelectorAll('button')];
    expect(chips.every((chip) => chip.type === 'button' && chip.classList.contains('codex-chip'))).toBe(true);
    const read = (chip: HTMLButtonElement): string => `${chip.dataset.ck ?? chip.dataset.cr}=${chip.textContent}${chip.getAttribute('aria-pressed') === 'true' ? '*' : ''}`;
    expect(chips.map(read)).toEqual(['all=All', 'Fauna=Fauna*', 'Flora=Flora', 'Fungi=Fungi', 'Microbe=Microbes',
      '0=All', '3=Rare+', '5=Legendary+*', '6=Mythic+']);
    expect(chips.map((chip) => chip.classList.contains('on'))).toEqual([false, true, false, false, false, false, false, true, false]);
    // a floor chip wears the colour of its rarity (LEGACY 15446, the hex of 4190, 4192, 4193); All does not
    expect(chips.slice(5, 9).map((chip) => chip.style.color)).toEqual(['', 'rgb(61, 139, 255)', 'rgb(244, 166, 42)', 'rgb(229, 75, 141)']);
    // the icon is decoration: the words are the name
    expect(chips.map((chip) => chip.querySelectorAll('.icon[aria-hidden="true"]').length)).toEqual([0, 1, 1, 1, 1, 0, 0, 0, 0]);
    expect(EMOJI.test(bar.textContent ?? '')).toBe(false);
    expect(bar.querySelector('[data-cshelves]')).toBeNull();
  });
});

describe('Compendium shelves', () => {
  const rows = CODEX.map((value, sourceIndex) => ({ value, sourceIndex }));
  const read = (open: readonly string[], forceOpen = false): string[] => shelveCodexRowsV1(rows, new Set(open), forceOpen)
    .map((item) => item.type === 'shelf' ? `[${item.header.shelf}${item.header.open ? '+' : ''} ${item.header.count}/${item.header.hybrids} ${item.header.kingdom}]` : item.row.value.name);

  it('realms fold onto the legacy game\'s shelves (15311-15319), in realm order (15322)', () => {
    expect(CODEX_SHELF_OF_V1).toEqual({
      'Gas Giant Life': 'Aerial Fauna', 'Amphibious Life': 'Amphibious Fauna', 'Subterranean Life': 'Cave Fauna',
      'Extreme-World Life': 'Extremophile Fauna', 'Exotic Biochemistry': 'Extremophile Fauna',
      'Intelligent Natural Life': 'Sapient Fauna', 'Collective / Hive Life': 'Hive Fauna',
    });
    expect(CODEX_SHELF_ORDER_V1).toEqual(['Microbial Life', 'Colonial Life', 'Flora', 'Fungi', 'Land Fauna', 'Aquatic Fauna', 'Aerial Fauna',
      'Amphibious Fauna', 'Cave Fauna', 'Extremophile Fauna', 'Megafauna', 'Sapient Fauna', 'Hive Fauna', 'Anomalous Life']);
    // the order is the realm order with each realm replaced by its shelf
    const fromRealms: string[] = [];
    for (const realm of REALM_ORDER) { const shelf = CODEX_SHELF_OF_V1[realm] ?? realm; if (!fromRealms.includes(shelf)) fromRealms.push(shelf); }
    expect(CODEX_SHELF_ORDER_V1).toEqual(fromRealms);
    expect(codexShelfOfV1({ realm: 'Gas Giant Life', kind: 'Fauna' })).toBe('Aerial Fauna');
    expect(codexShelfOfV1({ realm: 'Flora', kind: 'Flora' })).toBe('Flora');
    expect(codexShelfOfV1({ realm: '', kind: 'Fauna' })).toBe('Fauna');
  });

  it('LEGACY 15297, 15308: nothing opens itself: closed shelves show only their headers, with counts', () => {
    expect(read([])).toEqual(['[Microbial Life 1/0 microbe]', '[Flora 1/0 flora]', '[Fungi 1/0 fungi]', '[Land Fauna 1/0 fauna]', '[Aquatic Fauna 1/0 fauna]', '[Amphibious Fauna 1/1 fauna]']);
  });

  it('LEGACY 15297: an opened shelf shows its rows, and a chip filter lays every shelf open', () => {
    expect(read(['Land Fauna'])).toEqual(['[Microbial Life 1/0 microbe]', '[Flora 1/0 flora]', '[Fungi 1/0 fungi]', '[Land Fauna+ 1/0 fauna]', 'Civet', '[Aquatic Fauna 1/0 fauna]', '[Amphibious Fauna 1/1 fauna]']);
    expect(read([], true).filter((line) => !line.startsWith('['))).toEqual(['Diatom', 'Fern', 'Morel', 'Civet', 'Salmon', 'Newt']);
    expect(read([], true).filter((line) => line.startsWith('[')).every((line) => line.includes('+'))).toBe(true);
  });

  it('a shelf the order does not know comes after the known ones, and rows keep their order within a shelf', () => {
    const odd = [{ value: entry('Zed', 'Fauna', 'Plasma Life', 0) }, { value: entry('B', 'Fauna', 'Land Fauna', 0) }, { value: entry('A', 'Fauna', 'Land Fauna', 0) }];
    expect(shelveCodexRowsV1(odd, new Set(), true).map((item) => item.type === 'shelf' ? `[${item.header.shelf}]` : item.row.value.name))
      .toEqual(['[Land Fauna]', 'B', 'A', '[Plasma Life]', 'Zed']);
  });

  it('a shelf label is an icon name and words, never an emoji', () => {
    expect(codexShelfLabelV1('Megafauna')).toEqual({ icon: 'mammoth', text: 'Mega Fauna' });
    expect(codexShelfLabelV1('Amphibious Fauna')).toEqual({ icon: 'frog', text: 'Amphibious Fauna' });
    expect(codexShelfLabelV1('Aerial Fauna')).toEqual({ icon: 'bird', text: 'Aerial Fauna' });
    expect(codexShelfLabelV1('Plasma Life')).toEqual({ icon: null, text: 'Plasma Life' });
    for (const shelf of CODEX_SHELF_ORDER_V1) {
      const label = codexShelfLabelV1(shelf);
      expect(label.icon, shelf).toMatch(/^[a-z][a-z-]*$/);
      expect(EMOJI.test(label.text), shelf).toBe(false);
    }
    // wherever the current game drew an emoji beside a realm, there is an icon name
    for (const realm of Object.keys(REALM_ICON)) expect(codexShelfLabelV1(realm).icon, realm).not.toBeNull();
    // the instrument sees an emoji when there is one
    expect(EMOJI.test(REALM_ICON['Fungi'] ?? '')).toBe(true);
  });
});
