/* D13 stage 1d: the companion care panel in the Compendium detail (iPhone first).

   For each owned companion of this species: its condition (v1 `creatureCondition` labels) or "Resting — N min of
   play left", a Rest button that states its active-play length, its tastes (♥ Favors / ⊘ Dislikes; a flavour it has
   not tasted shows as "?"), and its bond meter with the next unlock. The projection is pure; the controller owns
   only its own mount and reports a trusted Rest press to Main, which owns the transaction and the wording after it. */
import { canonicalGenomeIdentityV1, isOwnershipStateV2, type CreatureInstanceId, type OwnershipStateV2 } from '@cf/domain-acquisition';
import { projectCompanionBondV1, projectCompanionTastesV1, companionRestDurationMsV1 } from '@cf/domain-acquisition/companion-care';
import { projectCompanionAvailabilityV1 } from '@cf/domain-acquisition/companion-availability';

export const COMPANION_CARE_READ_MODEL_SCHEMA = 'cf-v2-companion-care-read-model/v1' as const;

export interface CompanionCareRowV1 {
  readonly creatureId: CreatureInstanceId;
  readonly label: string;
  readonly condition: string;
  readonly resting: boolean;
  readonly restRemainingMinutes: number;
  /** null = nothing to rest (healthy) or not available now; otherwise the Rest length in active minutes. */
  readonly restMinutes: number | null;
  readonly restDisabledReason: string | null;
  readonly favors: readonly (string | null)[];
  readonly dislikes: readonly (string | null)[];
  readonly bond: Readonly<{ level: number; name: string; memories: number; nextName: string | null; nextAt: number | null; nextUnlock: string | null }>;
}
export interface CompanionCareReadModelV1 {
  readonly schema: typeof COMPANION_CARE_READ_MODEL_SCHEMA;
  readonly rows: readonly CompanionCareRowV1[];
  readonly writable: boolean;
}

/** v1 `creatureCondition` labels (0.05 / 0.3 / 0.6 bands). */
export function companionConditionLabelV1(hurt: number | null): string {
  const h = hurt ?? 0;
  return h < 0.05 ? 'Healthy' : h < 0.3 ? 'Bruised' : h < 0.6 ? 'Injured' : 'Critical';
}

export function projectCompanionCareV1(input: Readonly<{ record: Readonly<{ name: string; g: Readonly<Record<string, unknown>> }>; ownership: OwnershipStateV2 | null; activePlayMs: number; writable: boolean }>): CompanionCareReadModelV1 | null {
  if (input.ownership === null || !isOwnershipStateV2(input.ownership) || input.ownership.mode !== 'current') return null;
  let identity: ReturnType<typeof canonicalGenomeIdentityV1>;
  try { identity = canonicalGenomeIdentityV1(input.record.g); } catch { return null; }
  if (identity.kingdom !== 'fauna') return null;
  const rows = input.ownership.creatures.filter((row) => row.speciesId === identity.speciesId && row.genomeIdentity === identity.genomeIdentity).map((row): CompanionCareRowV1 => {
    const availability = projectCompanionAvailabilityV1(row, input.activePlayMs);
    const resting = availability.restReadyAtActivePlayMs !== null && !availability.rested;
    const duration = companionRestDurationMsV1(row.hurt);
    const busy = availability.assignment !== null;
    const tastes = projectCompanionTastesV1(row), bond = projectCompanionBondV1(row.bond);
    return Object.freeze({
      creatureId: row.creatureId,
      label: row.nickname ?? input.record.name,
      condition: resting ? 'Resting' : companionConditionLabelV1(row.hurt),
      resting,
      restRemainingMinutes: resting ? Math.ceil(availability.restRemainingActivePlayMs / 60_000) : 0,
      restMinutes: duration > 0 && !busy && input.writable ? duration / 60_000 : null,
      restDisabledReason: resting ? null : duration === 0 ? 'Healthy — nothing to rest.' : busy ? 'Busy — it can rest once it is free.' : !input.writable ? 'Unavailable while the expedition save settles.' : null,
      favors: Object.freeze(tastes.likes.map((s) => s.name)),
      dislikes: Object.freeze(tastes.dislikes.map((s) => s.name)),
      bond: Object.freeze({ level: bond.level, name: bond.name, memories: bond.memories, nextName: bond.next?.name ?? null, nextAt: bond.next?.memories ?? null, nextUnlock: bond.next?.unlock ?? null }),
    });
  });
  if (rows.length === 0) return null;
  return Object.freeze({ schema: COMPANION_CARE_READ_MODEL_SCHEMA, rows: Object.freeze(rows), writable: input.writable });
}

export interface CompanionCareControllerOptions { readonly onRest?: (creatureId: CreatureInstanceId) => void; }

export class CompanionCareController {
  #mount: HTMLElement | null = null;
  #state: CompanionCareReadModelV1 | null = null;
  #pending: CreatureInstanceId | null = null;
  #message: string | null = null;
  readonly #options: CompanionCareControllerOptions;
  constructor(options: CompanionCareControllerOptions = {}) { this.#options = options; }
  setState(state: CompanionCareReadModelV1 | null): void { this.#state = state; this.#render(); }
  attach(mount: HTMLElement): void { this.#mount = mount; this.#render(); }
  /** Main reports the terminal outcome of a Rest press. */
  settle(message: string): void { this.#pending = null; this.#message = message; this.#render(); }
  get pending(): CreatureInstanceId | null { return this.#pending; }
  #render(): void {
    const mount = this.#mount; if (mount === null || !mount.isConnected) return;
    const doc = mount.ownerDocument, el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', cls = ''): HTMLElementTagNameMap[K] => { const n = doc.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
    mount.replaceChildren();
    const state = this.#state; if (state === null) return;
    mount.dataset.companionCare = 'true';
    mount.append(el('h4', 'Care & bond'));
    for (const row of state.rows) {
      const card = el('div', '', 'companion-care-row'); card.dataset.companionCareRow = row.creatureId;
      const cond = el('p', `${row.label} · ${row.condition}${row.resting ? ` — ${row.restRemainingMinutes} min of play left` : ''}`); cond.dataset.companionCareCondition = row.condition; card.append(cond);
      const rest = el('button', row.restMinutes !== null ? `Rest (${row.restMinutes} min of play)` : row.resting ? 'Resting…' : 'Rest');
      rest.type = 'button'; rest.dataset.companionCareRest = row.creatureId; rest.style.minHeight = '44px';
      rest.disabled = row.restMinutes === null || this.#pending !== null;
      if (row.restDisabledReason !== null) rest.title = row.restDisabledReason;
      rest.addEventListener('click', () => {
        if (rest.disabled || this.#pending !== null) return;
        this.#pending = row.creatureId; this.#message = null; this.#render(); this.#options.onRest?.(row.creatureId);
      });
      card.append(rest);
      const known = (names: readonly (string | null)[]) => names.map((n) => n ?? '?').join(', ');
      const tastes = el('p', `♥ Favors ${known(row.favors)} · ⊘ Dislikes ${known(row.dislikes)}`); tastes.dataset.companionCareTastes = 'true'; card.append(tastes);
      const bond = el('p', `Bond: ${row.bond.name} (level ${row.bond.level}) · ${row.bond.memories} ${row.bond.memories === 1 ? 'memory' : 'memories'}${row.bond.nextName !== null ? ` · next: ${row.bond.nextName} at ${row.bond.nextAt} — ${row.bond.nextUnlock}` : ' · fully bonded'}`);
      bond.dataset.companionCareBond = String(row.bond.level);
      const meter = doc.createElement('meter'); meter.min = 0; meter.max = row.bond.nextAt ?? row.bond.memories; meter.value = row.bond.memories; meter.setAttribute('aria-label', `Bond ${row.bond.name}`);
      card.append(bond, meter);
      mount.append(card);
    }
    if (this.#message !== null) { const m = el('p', this.#message); m.dataset.companionCareMessage = 'true'; m.setAttribute('role', 'status'); mount.append(m); }
  }
}
