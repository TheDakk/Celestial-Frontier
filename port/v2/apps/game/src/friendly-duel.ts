/* Friendly duel (v1.8.9 parity; §20 order item 2; D16 "CFB share + friendly duels (+8 XP)").

   The Compendium detail of a species you own gets a Friendly duel control: pick one of your companions of that species, paste a
   friend's `CFB-` creature code, press Duel. One deterministic F4 receipt settles it (persistence `friendly-duel.ts`): every duel is
   counted; a win pays +8 XP and a duel win, a loss or draw pays 2 (3 when taken to the wire) participation XP, each on its own 30 s
   ACTIVE-PLAY window (v1's wall-clock throttle moved off the device clock). Nothing is lost and nobody is wounded.

   This file owns the pure read model, the app action (plan → commit → exact read-back) and one small DOM controller. Main owns the
   guards, the write barrier and publication. */
import {
  FRIENDLY_DUEL_BOUT_XP_V1,
  FRIENDLY_DUEL_CLOSE_XP_V1,
  FRIENDLY_DUEL_WIN_XP_V1,
  planFriendlyDuelV1,
  type FriendlyDuelPlanV1,
} from '@cf/domain-combatcore';
import { projectCompanionAvailabilityV1 } from '@cf/domain-acquisition/companion-availability';
import type { OwnershipStateV2 } from '@cf/domain-acquisition';
import type { Genome } from '@cf/domain-genome';
import {
  FRIENDLY_DUEL_OPERATION_V1,
  combatOpenEncounterMemberIdsV1,
  deriveFriendlyDuelV1,
  readFriendlyDuelLedgerV1,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import type { F4RuntimeActionCommitOutcome, F4RuntimeAuthority } from './f4-runtime-authority.js';

export const FRIENDLY_DUEL_READ_MODEL_SCHEMA_V1 = 'cf-v2-friendly-duel-read-model/v1' as const;

export interface FriendlyDuelCompanionOptionV1 {
  readonly id: string;
  readonly label: string;
  readonly disabled: boolean;
  readonly reason: string | null;
}
export interface FriendlyDuelReadModelV1 {
  readonly schema: typeof FRIENDLY_DUEL_READ_MODEL_SCHEMA_V1;
  readonly speciesId: string;
  readonly companions: readonly FriendlyDuelCompanionOptionV1[];
}

const companionLabel = (row: OwnershipStateV2['creatures'][number]): string =>
  `${row.nickname ?? 'Companion'} · ${row.xp ?? 0} XP`;

/** The duel control for one species detail: every owned companion of that species (exhibits excluded), each disabled with its reason
 *  while it recovers, is away, or is held by an open Command fight. Null = you own none of this species. */
export function projectFriendlyDuelV1(input: Readonly<{
  ownershipV2: OwnershipStateV2;
  extensions: V5Extensions;
  speciesId: string;
  observedActivePlayMs: number;
}>): FriendlyDuelReadModelV1 | null {
  const held = combatOpenEncounterMemberIdsV1(input.extensions) ?? [];
  const rows = input.ownershipV2.creatures.filter((row) => row.speciesId === input.speciesId && row.genome.exhibit !== true);
  if (rows.length === 0) return null;
  const companions = rows.map((row): FriendlyDuelCompanionOptionV1 => {
    let reason: string | null = null;
    try {
      const availability = projectCompanionAvailabilityV1(row, input.observedActivePlayMs);
      if (availability.assignment?.kind === 'mission') reason = 'Away on a companion mission.';
      else if (availability.blocks.combat) reason = 'Recovering; it can duel again once Recovery ends.';
    } catch { reason = 'Its availability could not be verified.'; }
    if (reason === null && held.includes(row.creatureId)) reason = 'Held by your open Command fight.';
    return Object.freeze({ id: row.creatureId, label: companionLabel(row), disabled: reason !== null, reason });
  });
  return Object.freeze({ schema: FRIENDLY_DUEL_READ_MODEL_SCHEMA_V1, speciesId: input.speciesId, companions: Object.freeze(companions) });
}

export type FriendlyDuelActionOutcomeV1 =
  | Readonly<{ kind: 'committed'; plan: FriendlyDuelPlanV1; credit: string; xp: number; revision: number; state: SaveStateV2;
      extensions: V5Extensions }>
  | Readonly<{ kind: 'refused'; detail: string; convergence: 'none' | 'read-only-reload' }>;

/** Plan the duel (v1's decoder + runDuel), then commit one receipt; the credit is decided at the COMMITTED active-play clock. */
export async function commitFriendlyDuelActionV1(input: Readonly<{
  runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  state: SaveStateV2;
  extensions: V5Extensions;
  ownershipV2: OwnershipStateV2;
  creatureId: string;
  code: string;
  codecNow: number;
}>): Promise<FriendlyDuelActionOutcomeV1> {
  const refused = (detail: string, convergence: 'none' | 'read-only-reload' = 'none'): FriendlyDuelActionOutcomeV1 =>
    Object.freeze({ kind: 'refused', detail, convergence });
  const row = input.ownershipV2.creatures.find((c) => c.creatureId === input.creatureId);
  if (row === undefined || row.genome.exhibit === true) return refused('companion:not-owned');
  const genome = { ...row.genome, xp: row.xp ?? 0, hurt: row.hurt ?? 0 } as unknown as Genome;
  const plan = planFriendlyDuelV1({ mine: { creatureId: row.creatureId, name: row.nickname ?? 'Companion', genome }, code: input.code });
  if ('status' in plan) return refused(plan.reason === 'code-invalid' ? 'code:invalid' : 'companion:invalid');
  if (readFriendlyDuelLedgerV1(input.extensions).kind !== 'loaded') return refused('ledger:protected', 'read-only-reload');
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await input.runtime.commitAction({
      state: input.state, operation: FRIENDLY_DUEL_OPERATION_V1, receiptKind: FRIENDLY_DUEL_OPERATION_V1, codecNow: input.codecNow,
      derive: ({ draft, extensions, receiptOrdinal, activePlayMs }) => deriveFriendlyDuelV1({
        draft, extensions, receiptOrdinal, activePlayMs, plan, ownershipV2: input.ownershipV2 }),
    });
  } catch (error) {
    return refused(`transaction:threw:${error instanceof Error ? error.message : String(error)}`, 'read-only-reload');
  }
  if (transaction.kind !== 'committed') {
    const reload = transaction.kind === 'stale' || transaction.kind === 'lost' || transaction.kind === 'duplicate-receipt'
      || transaction.kind === 'revision-exhausted' || transaction.kind === 'storage-error' || transaction.kind === 'protected';
    return refused(transaction.kind === 'rejected' ? `rejected:${transaction.message}` : `transaction:${transaction.kind}`, reload ? 'read-only-reload' : 'none');
  }
  let credit = 'unknown', xp = 0;
  try {
    const witness = JSON.parse(transaction.receipt.witness) as { credit: string; xp: number };
    credit = witness.credit; xp = witness.xp;
  } catch { return refused('verification:witness-unreadable', 'read-only-reload'); }
  return Object.freeze({ kind: 'committed', plan, credit, xp, revision: transaction.revision, state: transaction.state,
    extensions: transaction.saved.extensions });
}

/** The words for a settled duel (v1.8.9's result line + its ledger toast). */
export function friendlyDuelResultCopyV1(outcome: Extract<FriendlyDuelActionOutcomeV1, { kind: 'committed' }>): Readonly<{ title: string; detail: string }> {
  const { plan } = outcome;
  const title = plan.winner === 'A' ? `🏆 ${plan.mine.name} wins!` : plan.winner === 'B' ? `🏆 ${plan.challenger.name} wins!` : 'A draw — both champions stand.';
  const detail = outcome.credit === 'win' ? `+${FRIENDLY_DUEL_WIN_XP_V1} XP and a duel win for ${plan.mine.name}.`
    : outcome.credit === 'participation' ? `+${outcome.xp} XP for ${plan.mine.name} — ${outcome.xp === FRIENDLY_DUEL_CLOSE_XP_V1 ? 'a fight taken to the wire' : 'a bout survived'}.`
      : outcome.credit === 'win-cooldown' ? 'A win this soon after the last pays no ledger credit or XP — give it 30 seconds of play between counted bouts.'
        : 'This bout came too soon after the last counted one to teach anything — give it 30 seconds of play.';
  return Object.freeze({ title, detail });
}
void FRIENDLY_DUEL_BOUT_XP_V1;

export type FriendlyDuelRequestV1 = Readonly<{ creatureId: string; code: string }>;

function esc(value: unknown): string {
  return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/** One delegated control inside the Compendium detail. It owns only the companion choice, the pasted code and its press latch. */
export class FriendlyDuelController {
  readonly #onAction: (request: FriendlyDuelRequestV1) => void;
  #mount: HTMLElement | null = null;
  #model: FriendlyDuelReadModelV1 | null = null;
  #selected: string | null = null;
  #code = '';
  #pending = false;
  #status: Readonly<{ title: string; detail: string }> | null = null;
  #onClick = (event: Event): void => {
    const target = event.target as Element | null;
    const button = target?.closest?.('[data-friendly-duel-fight]') as HTMLButtonElement | null;
    if (!button || this.#pending || this.#model === null || button.disabled) return;
    const choice = this.#model.companions.find((c) => c.id === this.#selected && !c.disabled);
    if (!choice || this.#code.trim().length === 0) return;
    this.#pending = true;
    this.#status = null;
    this.#render();
    this.#onAction(Object.freeze({ creatureId: choice.id, code: this.#code }));
  };
  #onInput = (event: Event): void => {
    const target = event.target as HTMLInputElement | HTMLSelectElement | null;
    if (!target || this.#pending) return;
    if (target.matches('[data-friendly-duel-companion]')) { this.#selected = target.value; this.#render(); return; }
    if (target.matches('[data-friendly-duel-code]')) {
      this.#code = target.value;
      const fight = this.#mount?.querySelector<HTMLButtonElement>('[data-friendly-duel-fight]');
      if (fight) fight.disabled = !this.#ready();   // keep the caret: no re-render while typing
    }
  };

  constructor(options: Readonly<{ onAction: (request: FriendlyDuelRequestV1) => void }>) { this.#onAction = options.onAction; }

  attach(mount: HTMLElement): void {
    this.#mount?.removeEventListener('click', this.#onClick);
    this.#mount?.removeEventListener('input', this.#onInput);
    this.#mount?.removeEventListener('change', this.#onInput);
    this.#mount = mount;
    mount.addEventListener('click', this.#onClick);
    mount.addEventListener('input', this.#onInput);
    mount.addEventListener('change', this.#onInput);
    this.#render();
  }

  setState(model: FriendlyDuelReadModelV1 | null): void {
    if (model !== null && model.speciesId !== this.#model?.speciesId) { this.#status = null; this.#code = ''; }
    this.#model = model;
    if (model !== null && !model.companions.some((c) => c.id === this.#selected && !c.disabled)) {
      this.#selected = model.companions.find((c) => !c.disabled)?.id ?? null;
    }
    this.#render();
  }

  settle(status: Readonly<{ title: string; detail: string }>): void {
    this.#pending = false;
    this.#status = status;
    this.#render();
  }

  diagnostics(): Readonly<{ pending: boolean; selected: string | null }> { return Object.freeze({ pending: this.#pending, selected: this.#selected }); }

  #ready(): boolean {
    return !this.#pending && this.#code.trim().length > 0 && (this.#model?.companions.some((c) => c.id === this.#selected && !c.disabled) ?? false);
  }

  #render(): void {
    if (this.#mount === null) return;
    const model = this.#model;
    if (model === null) { this.#mount.replaceChildren(); return; }
    const lock = this.#pending ? ' disabled' : '';
    const options = model.companions.map((c) => `<option value="${esc(c.id)}"${c.id === this.#selected ? ' selected' : ''}${c.disabled ? ' disabled' : ''}>${esc(c.label)}${c.reason ? ` — ${esc(c.reason)}` : ''}</option>`).join('');
    this.#mount.innerHTML = '<h4 class="compendium-feed-title">⚔ Friendly duel</h4>' +
      '<p class="compendium-feed-note">Sport only — nothing is lost. A win pays 8 XP; a hard bout still teaches. Paste a friend’s CFB- creature code.</p>' +
      `<select data-friendly-duel-companion aria-label="Your companion"${lock}>${options}</select>` +
      `<input data-friendly-duel-code type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="CFB-…" aria-label="Challenger code" value="${esc(this.#code)}"${lock}>` +
      `<button type="button" data-friendly-duel-fight${this.#ready() ? '' : ' disabled'}>${this.#pending ? 'Settling duel…' : 'Duel'}</button>` +
      `<p class="compendium-feed-status" data-friendly-duel-status role="status" aria-live="polite">${this.#status ? `${esc(this.#status.title)} ${esc(this.#status.detail)}` : ''}</p>`;
    this.#mount.setAttribute('aria-busy', this.#pending ? 'true' : 'false');
  }
}
