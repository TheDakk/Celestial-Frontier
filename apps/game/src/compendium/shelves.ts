/* The Compendium list's filter chips, its order, its heading and its shelves, as the legacy game has them.
 *
 * - Kingdom chips (All, Fauna, Flora, Fungi, Microbes) and the rarity floor (All, Rare+, Legendary+, Mythic+), compared on
 *   the display tier, so raw 9 to 14 all read Transcendent. The chips appear after training, once a species is held.
 * - The list reads rarest first, then hybrids, then kind, then name.
 * - Shelves, always: realms fold onto themed shelves for display only, in the realm order of the genome package. A shelf is
 *   a fold that is closed until opened (nothing opens itself), and a kingdom or rarity filter lays every shelf open.
 * Filters and shelf state are view state, never saved. No clock. */
import { REALM_ORDER } from '@cf/domain-genome';
import { icon, type IconName } from '../ui';
import { projectDisplayRarity } from './rarity';

export type CodexKingdomV1 = 'all' | 'Fauna' | 'Flora' | 'Fungi' | 'Microbe';
export type CodexRarityFloorV1 = 0 | 3 | 5 | 6;
/** Each kingdom chip: the kingdom, its words, and the name of the icon drawn before them. */
export const CODEX_KINGDOM_CHIPS_V1: readonly (readonly [CodexKingdomV1, string, IconName | null])[] = Object.freeze([
  ['all', 'All', null], ['Fauna', 'Fauna', 'paw'], ['Flora', 'Flora', 'flora'], ['Fungi', 'Fungi', 'fungi'], ['Microbe', 'Microbes', 'microbe'],
] as const);
export const CODEX_RARITY_CHIPS_V1: readonly (readonly [CodexRarityFloorV1, string])[] = Object.freeze([
  [0, 'All'], [3, 'Rare+'], [5, 'Legendary+'], [6, 'Mythic+'],
] as const);
const CHIP_BAR_LABEL = 'Compendium filters';

export interface CodexListViewV1 {
  readonly kingdom: CodexKingdomV1;
  readonly rarityFloor: CodexRarityFloorV1;
}
export const DEFAULT_CODEX_LIST_VIEW_V1: CodexListViewV1 = Object.freeze({ kingdom: 'all', rarityFloor: 0 });

export interface CodexEntryLikeV1 { readonly name: string; readonly kind: string; readonly realm: string; readonly tier: number | null; readonly hybrid: boolean }

/** The chips are shown only after training and with at least one species held. */
export const codexChipsShownV1 = (state: Readonly<{ tutDone: boolean; species: number }>): boolean => state.tutDone && state.species > 0;

/** A kingdom or rarity filter is active (it lays every shelf open and changes the heading). */
export const codexChipsFilteringV1 = (view: CodexListViewV1): boolean => view.kingdom !== 'all' || view.rarityFloor > 0;

/** The two chip ladders. */
export function codexEntryMatchesV1(entry: CodexEntryLikeV1, view: CodexListViewV1): boolean {
  if (view.kingdom !== 'all' && entry.kind !== view.kingdom) return false;
  if (view.rarityFloor > 0 && (projectDisplayRarity(entry.tier)?.tier ?? -1) < view.rarityFloor) return false;
  return true;
}

/** The order of the list: rarest first by raw tier (an unrated species counts as 0), then hybrids, then kind, then name. */
export const compareCodexEntriesV1 = (a: CodexEntryLikeV1, b: CodexEntryLikeV1): number =>
  ((b.tier ?? 0) - (a.tier ?? 0)) || (Number(b.hybrid) - Number(a.hybrid)) || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name);

const kingdomWord = (kingdom: CodexKingdomV1): string => kingdom === 'all' ? 'species' : kingdom.toLowerCase();
/** The line above the list: every species and the hybrids bred, or what the filters show. */
export function codexHeadingV1(view: CodexListViewV1, counts: Readonly<{ shown: number; total: number; hybrids: number }>): string {
  if (!codexChipsFilteringV1(view)) return `${counts.total} species · ${counts.hybrids} hybrid${counts.hybrids === 1 ? '' : 's'} bred`;
  return `${counts.shown} ${view.kingdom === 'Microbe' ? 'microbes' : kingdomWord(view.kingdom)} shown · ${counts.total} species in all`;
}
/** What an empty filtered list says; null when it has rows or no filter is on. The rarity floor speaks first. */
export function codexEmptyNoteV1(view: CodexListViewV1, shown: number): string | null {
  if (shown > 0) return null;
  if (view.rarityFloor > 0) return `No ${kingdomWord(view.kingdom)} at ${projectDisplayRarity(view.rarityFloor)?.name ?? ''} or above yet — the rarest finds live farthest out.`;
  if (view.kingdom !== 'all') return `Nothing on this shelf yet — every ${view.kingdom === 'Fauna' ? 'creature you Discover' : `${view.kingdom.toLowerCase()} you catalogue`} will land here.`;
  return null;
}

/** Realm to shelf: Fauna shelves all read "<Habitat> Fauna"; the other realms stand as their own shelves. */
export const CODEX_SHELF_OF_V1: Readonly<Record<string, string>> = Object.freeze({
  'Gas Giant Life': 'Aerial Fauna', 'Amphibious Life': 'Amphibious Fauna', 'Subterranean Life': 'Cave Fauna',
  'Extreme-World Life': 'Extremophile Fauna', 'Exotic Biochemistry': 'Extremophile Fauna',
  'Intelligent Natural Life': 'Sapient Fauna', 'Collective / Hive Life': 'Hive Fauna',
});
/** The icon of a shelf, and of a realm, by name. */
const SHELF_ICON: Readonly<Record<string, IconName>> = Object.freeze({
  'Amphibious Fauna': 'frog', 'Cave Fauna': 'cave', 'Extremophile Fauna': 'volcano', 'Sapient Fauna': 'mind', 'Hive Fauna': 'hive',
  'Microbial Life': 'microbe', 'Colonial Life': 'colony', 'Flora': 'flora', 'Fungi': 'fungi', 'Land Fauna': 'paw', 'Aquatic Fauna': 'fish',
  'Aerial Fauna': 'bird', 'Amphibious Life': 'frog', 'Subterranean Life': 'cave', 'Extreme-World Life': 'volcano', 'Gas Giant Life': 'gas-giant',
  'Megafauna': 'mammoth', 'Collective / Hive Life': 'hive', 'Exotic Biochemistry': 'crystal', 'Anomalous Life': 'anomaly',
  'Intelligent Natural Life': 'mind',
});
export const CODEX_SHELF_ORDER_V1: readonly string[] = Object.freeze((() => { const out: string[] = []; for (const r of REALM_ORDER) { const s = CODEX_SHELF_OF_V1[r] ?? r; if (!out.includes(s)) out.push(s); } return out; })());
export const codexShelfOfV1 = (entry: Pick<CodexEntryLikeV1, 'realm' | 'kind'>): string => CODEX_SHELF_OF_V1[entry.realm] ?? (entry.realm || entry.kind);
/** The label of a shelf: the name of its icon, if it has one, and its words ("Megafauna" reads "Mega Fauna"). */
export const codexShelfLabelV1 = (shelf: string): Readonly<{ icon: IconName | null; text: string }> =>
  Object.freeze({ icon: SHELF_ICON[shelf] ?? null, text: shelf === 'Megafauna' ? 'Mega Fauna' : shelf });

export interface CodexShelfHeaderV1 { readonly shelf: string; readonly count: number; readonly hybrids: number; readonly open: boolean; readonly kingdom: string }
export type CodexListItemV1<R> = Readonly<{ type: 'shelf'; header: CodexShelfHeaderV1 }> | Readonly<{ type: 'entry'; row: R }>;

/** The shelved list: one header per shelf in shelf order (a shelf the order does not know after, in first-seen order), and each
 * open shelf's rows in their existing order. `forceOpen`: a chip filter is active, which lays every shelf open. */
export function shelveCodexRowsV1<R extends { readonly value: CodexEntryLikeV1 }>(rows: readonly R[], open: ReadonlySet<string>, forceOpen: boolean): readonly CodexListItemV1<R>[] {
  const groups = new Map<string, R[]>();
  for (const row of rows) { const s = codexShelfOfV1(row.value); const g = groups.get(s); if (g) g.push(row); else groups.set(s, [row]); }
  const order = CODEX_SHELF_ORDER_V1.filter((s) => groups.has(s));
  for (const s of groups.keys()) if (!order.includes(s)) order.push(s);
  const out: CodexListItemV1<R>[] = [];
  for (const shelf of order) {
    const group = groups.get(shelf)!, isOpen = forceOpen || open.has(shelf);
    out.push(Object.freeze({ type: 'shelf', header: Object.freeze({ shelf, count: group.length, hybrids: group.filter((r) => r.value.hybrid).length, open: isOpen, kingdom: (group[0]?.value.kind ?? '').toLowerCase() }) }));
    if (isOpen) for (const row of group) out.push(Object.freeze({ type: 'entry', row }));
  }
  return Object.freeze(out);
}

/** The chip bar: every chip is a real button that says whether it is pressed. */
export function codexChipBarV1(view: CodexListViewV1): HTMLElement {
  const chip = (attr: 'ck' | 'cr', value: string, label: string, on: boolean, iconName: IconName | null = null, colour = ''): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = on ? 'codex-chip on' : 'codex-chip';
    button.dataset[attr] = value;
    button.setAttribute('aria-pressed', String(on));
    if (colour) button.style.color = colour;
    if (iconName !== null) button.append(icon(iconName, { decorative: true }));
    button.append(label);
    return button;
  };
  const row = (...chips: HTMLButtonElement[]): HTMLDivElement => {
    const div = document.createElement('div');
    div.className = 'codex-chip-row';
    div.append(...chips);
    return div;
  };
  const bar = document.createElement('div');
  bar.className = 'codex-chips';
  bar.dataset.sel = 'codex-chips';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', CHIP_BAR_LABEL);
  bar.append(
    row(...CODEX_KINGDOM_CHIPS_V1.map(([k, label, iconName]) => chip('ck', k, label, view.kingdom === k, iconName))),
    row(...CODEX_RARITY_CHIPS_V1.map(([r, label]) => chip('cr', String(r), label, view.rarityFloor === r, null, r > 0 ? projectDisplayRarity(r)?.hex ?? '' : ''))),
  );
  return bar;
}

/** Apply one chip press to the view; null when the target is not a chip. */
export function codexChipPressV1(view: CodexListViewV1, target: Readonly<{ ck?: string | undefined; cr?: string | undefined }>): CodexListViewV1 | null {
  if (target.ck !== undefined && CODEX_KINGDOM_CHIPS_V1.some(([k]) => k === target.ck)) return Object.freeze({ ...view, kingdom: target.ck as CodexKingdomV1 });
  if (target.cr !== undefined && CODEX_RARITY_CHIPS_V1.some(([r]) => String(r) === target.cr)) return Object.freeze({ ...view, rarityFloor: Number(target.cr) as CodexRarityFloorV1 });
  return null;
}
