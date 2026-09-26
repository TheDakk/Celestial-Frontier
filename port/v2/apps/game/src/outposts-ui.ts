/* Outposts P4 — presentation (D14). Pure HTML builders for the world card's "Build here" section and the Projects board beside the
   Charters, the Museum exhibit rows, and ONE delegated controller that turns presses into requests. iPhone-first: every control is a
   44 px target. Nothing here writes; Main runs the action (runOutpostAction) and re-renders from the committed carrier. */
import type {
  OutpostBoardRowV1,
  OutpostBoardV1,
  OutpostKindV1,
  OutpostProjectsStateV1,
  OutpostStageQuoteV1,
  OutpostWorldOfferV1,
} from '@cf/persistence';
import { outpostDefinitionV1, outpostRefusalTextV1 } from '@cf/persistence';
import { outpostPartNameV1 } from './outposts-action.js';

const esc = (v: unknown): string => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const BTN = 'min-height:44px;padding:8px 14px;border-radius:9px;font:12px system-ui;cursor:pointer;background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e';

function billHtml(q: OutpostStageQuoteV1): string {
  const parts = Object.entries(q.cost.items).map(([id, need]) => {
    const short = q.missingItems.find((m) => m.id === id);
    return `<span data-outpost-cost="${esc(id)}"${short ? ' data-short="1" style="color:#ff9f8a"' : ''}>${need} ${esc(outpostPartNameV1(id))}${short ? ` (have ${short.have})` : ''}</span>`;
  });
  if (q.cost.stardust > 0) parts.push(`<span data-outpost-cost="stardust"${q.missingStardust ? ' data-short="1" style="color:#ff9f8a"' : ''}>${q.cost.stardust} ✦</span>`);
  const deed = q.deed ? `<div class="sub" data-outpost-deed="${q.deed.met ? 'met' : 'open'}">${q.deed.met ? '✓' : '◻'} ${esc(q.deed.text)} (${q.deed.done}/${q.deed.need})</div>` : '';
  return `<div class="sub">Stage ${q.stage} of 3: ${parts.join(' · ')}</div>${deed}`;
}

export interface OutpostCompanionChoiceV1 { readonly id: string; readonly label: string }
function residentsHtml(siteId: string, chosen: readonly string[], companions: readonly OutpostCompanionChoiceV1[]): string {
  if (companions.length === 0) return '<div class="sub">You have no companions to show here yet.</div>';
  const shown = companions.filter((c) => chosen.includes(c.id)).map((c) => esc(c.label));
  return `<div class="sub" data-outpost-resident-list>${shown.length ? `Here: ${shown.join(' · ')}` : 'No companions shown here yet.'}</div>`
    + `<fieldset data-outpost-residents-form="${esc(siteId)}" style="border:0;padding:0;margin:4px 0"><legend class="sub">Choose up to 6</legend>`
    + companions.slice(0, 40).map((c) => `<label style="display:inline-flex;align-items:center;gap:6px;min-height:44px;margin-right:10px"><input type="checkbox" value="${esc(c.id)}"${chosen.includes(c.id) ? ' checked' : ''} style="width:22px;height:22px">${esc(c.label)}</label>`).join('')
    + `</fieldset><button type="button" data-outpost-save-residents="${esc(siteId)}" style="${BTN}">Save residents</button>`;
}

function rowHtml(row: OutpostBoardRowV1, where: 'card' | 'board', companions: readonly OutpostCompanionChoiceV1[] = []): string {
  const d = row.definition, s = row.site;
  const title = `${d.icon} ${esc(d.name)}${where === 'board' ? ` · ${esc(s.world.name)}` : ''}`;
  if (row.status === 'finished') {
    return `<div class="centry" data-outpost-site="${esc(s.id)}" data-outpost-status="finished"><b>${title} ✓</b><div class="sub">${esc(d.reward)}</div>`
      + (s.kind === 'sanctuary' ? (where === 'card' ? residentsHtml(s.id, s.residents, companions)
        : `<div class="sub" data-outpost-residents="${s.residents.length}">${s.residents.length} companion${s.residents.length === 1 ? '' : 's'} here</div>`) : '')
      + `<button type="button" data-outpost-abandon="${esc(s.id)}" style="${BTN}">Abandon (full refund)</button></div>`;
  }
  const q = row.next!;
  return `<div class="centry" data-outpost-site="${esc(s.id)}" data-outpost-status="building"><b>${title}</b> <span class="sub">${s.built}/3 built</span>`
    + billHtml(q)
    + `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" data-outpost-build="${esc(s.id)}"${q.refusal ? ' disabled aria-disabled="true"' : ''} style="${BTN}">Build stage ${q.stage}</button>`
    + `<button type="button" data-outpost-abandon="${esc(s.id)}" style="${BTN}">Abandon (full refund)</button></div></div>`;
}

/** The world card's section. Empty string while projects are locked (they appear in no Guide or objective before the unlock). */
export function renderOutpostCardSectionV1(offer: OutpostWorldOfferV1, companions: readonly OutpostCompanionChoiceV1[] = []): string {
  if (!offer.open) return '';
  const here = offer.here.map((row) => rowHtml(row, 'card', companions)).join('');
  const start = offer.startable.map(({ definition: d, refusal }) => refusal === null
    ? `<button type="button" data-outpost-start="${d.kind}" style="${BTN}" title="${esc(d.site)}">🏗 Build ${esc(d.name)} here</button>`
    : (refusal === 'not-landed' || refusal === 'not-conquered' || refusal === 'no-fauna' || refusal === 'conquered' || refusal === 'needs-deep-scanners'
      ? '' : `<span class="sub" data-outpost-refused="${d.kind}">${esc(d.name)}: ${esc(outpostRefusalTextV1(refusal))}</span>`)).join('');
  if (here === '' && start === '') return '';
  return `<section data-outpost-card style="flex-basis:100%;margin-top:6px"><div class="sub"><b>Outposts</b></div>${here}`
    + (start ? `<div style="display:flex;gap:6px;flex-wrap:wrap">${start}</div>` : '') + '</section>';
}

/** The Projects board beside the Charters (its own two slots). */
export function renderOutpostBoardV1(board: OutpostBoardV1, status: string | null): string {
  if (!board.open) return '';
  const rows = [...board.building, ...board.finished].map((row) => rowHtml(row, 'board')).join('');
  return `<section data-outpost-board><h3>Projects <span class="sub">${board.slots.used} / ${board.slots.max} under construction · ${board.total.used} / ${board.total.max} built</span></h3>`
    + (rows || '<div class="empty">No outposts yet. Open a world you have landed on and choose "Build here".</div>')
    + (status ? `<p class="sub" role="status" aria-live="polite" data-outpost-status-line>${esc(status)}</p>` : '') + '</section>';
}

/** The portrait mark on a world card title: one icon per FINISHED outpost on this world. */
export function outpostPortraitMarksV1(state: OutpostProjectsStateV1, planetSeed: number): string {
  return state.sites.filter((s) => s.built >= 3 && s.world.planetSeed === planetSeed).map((s) => outpostDefinitionV1(s.kind).icon).join('');
}

/** The Museum's fifth gallery: one exhibit per finished outpost (world name and the active play at which it was finished). */
export function outpostExhibitsV1(state: OutpostProjectsStateV1): readonly Readonly<{ id: string; title: string; detail: string }>[] {
  const hours = (ms: number) => { const m = Math.floor(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
  return Object.freeze(state.sites.filter((s) => s.built >= 3).sort((a, b) => (a.finishedAtMs ?? 0) - (b.finishedAtMs ?? 0)).map((s) => {
    const d = outpostDefinitionV1(s.kind);
    return Object.freeze({ id: `outpost:${s.id}`, title: `${d.icon} ${d.name} — ${s.world.name}`,
      detail: `Finished after ${hours(s.finishedAtMs ?? 0)} of play.${s.kind === 'sanctuary' && s.residents.length ? ` ${s.residents.length} companion${s.residents.length === 1 ? '' : 's'} live here.` : ''}` });
  }));
}

export type OutpostUiRequestV1 =
  | Readonly<{ kind: 'start'; outpost: OutpostKindV1 }>
  | Readonly<{ kind: 'build'; siteId: string }>
  | Readonly<{ kind: 'abandon'; siteId: string; confirmed: boolean }>
  | Readonly<{ kind: 'residents'; siteId: string; residents: readonly string[] }>;

/** One delegated listener for every outpost control (card and board). Abandon takes a second, confirming press (armed per site). */
export class OutpostsControllerV1 {
  readonly #onAction: (request: OutpostUiRequestV1) => void;
  #pending = false;
  #armed: string | null = null;
  constructor(onAction: (request: OutpostUiRequestV1) => void) { this.#onAction = onAction; }
  get pending(): boolean { return this.#pending; }
  settle(): void { this.#pending = false; }
  handle(target: Element | null): boolean {
    const el = target?.closest?.('[data-outpost-start],[data-outpost-build],[data-outpost-abandon],[data-outpost-save-residents]') as HTMLButtonElement | null;
    if (!el || el.disabled) return false;
    if (this.#pending) return true;
    if (el.dataset.outpostSaveResidents !== undefined) {
      const id = el.dataset.outpostSaveResidents, form = el.parentElement?.querySelector(`[data-outpost-residents-form="${id.replace(/[^a-z0-9@]/g, '')}"]`);
      const residents = [...(form?.querySelectorAll<HTMLInputElement>('input[type=checkbox]') ?? [])].filter((b) => b.checked).map((b) => b.value);
      this.#armed = null; this.#pending = true; this.#onAction(Object.freeze({ kind: 'residents', siteId: id, residents: Object.freeze(residents) })); return true;
    }
    if (el.dataset.outpostAbandon !== undefined) {
      const id = el.dataset.outpostAbandon;
      if (this.#armed !== id) { this.#armed = id; el.textContent = 'Confirm abandon'; el.setAttribute('data-outpost-armed', '1'); return true; }
      this.#armed = null; this.#pending = true; this.#onAction(Object.freeze({ kind: 'abandon', siteId: id, confirmed: true })); return true;
    }
    this.#armed = null; this.#pending = true;
    if (el.dataset.outpostStart !== undefined) this.#onAction(Object.freeze({ kind: 'start', outpost: el.dataset.outpostStart as OutpostKindV1 }));
    else this.#onAction(Object.freeze({ kind: 'build', siteId: el.dataset.outpostBuild! }));
    return true;
  }
}
