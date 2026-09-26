/** @module compendium-shelves [app] — the Compendium list's filter chips and category shelves (D16 parity; v1.8.9 `_codexTabs`,
 * `codexKing`, `codexRare`, `_SHELF_OF`, `_cdxOpen` — INVENTORY rows #36/#37).
 *
 * - **Kingdom chips** (All · 🐾 Fauna · 🌿 Flora · 🍄 Fungi · 🦠 Microbes) and the **rarity floor** (All · Rare+ · Legendary+ · Mythic+,
 *   compared on the DISPLAY tier, so raw 9–14 all read Transcendent), exactly v1's two ladders.
 * - **Shelves**: realms fold onto themed shelves for display only (v1 v1.3.11), in the domain's `REALM_ORDER`; a shelf is a fold
 *   that is closed until opened (v1: "nothing opens itself"), and a kingdom or rarity filter lays every shelf open (v1).
 * v2 parity call (2026-09-26, reversible): shelves are an opt-in "▦ Shelves" chip, OFF by default, so the default Compendium stays the
 * flat virtual list that the I5 memory instrument and Glass measure. Filters and shelf state are session view state (v1: never saved;
 * a fresh expedition opens on "All"). Pure: no DOM, no clock. */
import { REALM_ICON, REALM_ORDER } from '@cf/domain-genome';
import { projectDisplayRarity } from './rarity-presentation.js';

export type CodexKingdomV1 = 'all' | 'Fauna' | 'Flora' | 'Fungi' | 'Microbe';
export type CodexRarityFloorV1 = 0 | 3 | 5 | 6;
export const CODEX_KINGDOM_CHIPS_V1: readonly (readonly [CodexKingdomV1, string])[] = Object.freeze([
  ['all', 'All'], ['Fauna', '🐾 Fauna'], ['Flora', '🌿 Flora'], ['Fungi', '🍄 Fungi'], ['Microbe', '🦠 Microbes'],
] as const);
export const CODEX_RARITY_CHIPS_V1: readonly (readonly [CodexRarityFloorV1, string])[] = Object.freeze([
  [0, 'All'], [3, 'Rare+'], [5, 'Legendary+'], [6, 'Mythic+'],
] as const);

export interface CodexListViewV1 {
  readonly query: string;
  readonly kingdom: CodexKingdomV1;
  readonly rarityFloor: CodexRarityFloorV1;
  /** "▦ Shelves" chip: group the list onto category shelves (opt-in). */
  readonly shelves: boolean;
}
export const DEFAULT_CODEX_LIST_VIEW_V1: CodexListViewV1 = Object.freeze({ query: '', kingdom: 'all', rarityFloor: 0, shelves: false });

export interface CodexEntryLikeV1 { readonly name: string; readonly kind: string; readonly realm: string; readonly tier: number | null; readonly hybrid: boolean }

/** A kingdom or rarity filter is active (v1: it lays every shelf open and changes the heading). The text query is not a chip. */
export const codexChipsFilteringV1 = (view: CodexListViewV1): boolean => view.kingdom !== 'all' || view.rarityFloor > 0;

/** The v2 text query (name · kind · realm, case-insensitive — unchanged) AND the two chip ladders. */
export function codexEntryMatchesV1(entry: CodexEntryLikeV1, view: CodexListViewV1): boolean {
  const f = view.query.toLowerCase();
  if (f && !(entry.name + ' ' + entry.kind + ' ' + entry.realm).toLowerCase().includes(f)) return false;
  if (view.kingdom !== 'all' && entry.kind !== view.kingdom) return false;
  if (view.rarityFloor > 0 && (projectDisplayRarity(entry.tier)?.tier ?? -1) < view.rarityFloor) return false;
  return true;
}

/** realm → display shelf (v1 `_SHELF_OF`): Fauna shelves all read "<Habitat> Fauna"; showcase realms stand as their own shelves. */
export const CODEX_SHELF_OF_V1: Readonly<Record<string, string>> = Object.freeze({
  'Gas Giant Life': 'Aerial Fauna', 'Amphibious Life': 'Amphibious Fauna', 'Subterranean Life': 'Cave Fauna',
  'Extreme-World Life': 'Extremophile Fauna', 'Exotic Biochemistry': 'Extremophile Fauna',
  'Intelligent Natural Life': 'Sapient Fauna', 'Collective / Hive Life': 'Hive Fauna',
});
const SHELF_ICON: Readonly<Record<string, string>> = Object.freeze({ 'Amphibious Fauna': '🐸', 'Cave Fauna': '🕳️',
  'Extremophile Fauna': '🌋', 'Sapient Fauna': '🧠', 'Hive Fauna': '🐝' });
export const CODEX_SHELF_ORDER_V1: readonly string[] = Object.freeze((() => { const out: string[] = []; for (const r of REALM_ORDER) { const s = CODEX_SHELF_OF_V1[r] ?? r; if (!out.includes(s)) out.push(s); } return out; })());
export const codexShelfOfV1 = (entry: Pick<CodexEntryLikeV1, 'realm' | 'kind'>): string => CODEX_SHELF_OF_V1[entry.realm] ?? (entry.realm || entry.kind);
/** One naming shape per shelf (v1: "Megafauna" reads "Mega Fauna"). */
export const codexShelfLabelV1 = (shelf: string): string => `${SHELF_ICON[shelf] ?? REALM_ICON[shelf] ?? ''} ${shelf === 'Megafauna' ? 'Mega Fauna' : shelf}`.trim();

export interface CodexShelfHeaderV1 { readonly shelf: string; readonly count: number; readonly hybrids: number; readonly open: boolean; readonly kingdom: string }
export type CodexListItemV1<R> = Readonly<{ type: 'shelf'; header: CodexShelfHeaderV1 }> | Readonly<{ type: 'entry'; row: R }>;

/** The shelved list: one header per shelf in shelf order (unknown future shelves after, in first-seen order), and each OPEN shelf's
 * rows in their existing order. `forceOpen` = a chip filter is active (v1 lays every shelf open). */
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

/** The chip bar markup (44 px targets via .codex-chip; every chip is a real button with aria-pressed). */
export function codexChipBarHtmlV1(view: CodexListViewV1): string {
  const chip = (attr: string, value: string, label: string, on: boolean, style = '') =>
    `<button type="button" class="codex-chip${on ? ' on' : ''}" ${attr}="${value}" aria-pressed="${on}"${style ? ` style="${style}"` : ''}>${label}</button>`;
  return '<div class="codex-chips" data-sel="codex-chips" role="toolbar" aria-label="Compendium filters">'
    + '<div class="codex-chip-row">' + CODEX_KINGDOM_CHIPS_V1.map(([k, label]) => chip('data-ck', k, label, view.kingdom === k)).join('') + '</div>'
    + '<div class="codex-chip-row">' + CODEX_RARITY_CHIPS_V1.map(([r, label]) => chip('data-cr', String(r), label, view.rarityFloor === r, r > 0 ? `color:${projectDisplayRarity(r)?.hex ?? ''}` : '')).join('')
    + chip('data-cshelves', view.shelves ? 'off' : 'on', '▦ Shelves', view.shelves) + '</div></div>';
}

/** Apply one chip press to the view; null = not a chip. */
export function codexChipPressV1(view: CodexListViewV1, target: Readonly<{ ck?: string | undefined; cr?: string | undefined; cshelves?: string | undefined }>): CodexListViewV1 | null {
  if (target.ck !== undefined && CODEX_KINGDOM_CHIPS_V1.some(([k]) => k === target.ck)) return Object.freeze({ ...view, kingdom: target.ck as CodexKingdomV1 });
  if (target.cr !== undefined && CODEX_RARITY_CHIPS_V1.some(([r]) => String(r) === target.cr)) return Object.freeze({ ...view, rarityFloor: Number(target.cr) as CodexRarityFloorV1 });
  if (target.cshelves === 'on' || target.cshelves === 'off') return Object.freeze({ ...view, shelves: target.cshelves === 'on' });
  return null;
}
