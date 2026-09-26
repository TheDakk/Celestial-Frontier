/* D13 stage 2c: the companion mission board (iPhone first, 44 px targets).

   It shows the field slots, every mission away (an Away badge with its minutes of PLAY left, or Ready), the disclosure before
   dispatch (length, minutes of play, the wound chance, what it brings back, and that recall returns nothing), the return
   reveal as a live status line (the text counterpart of the return), and the mission Chronicle (the latest returns). Nothing
   sealed is shown before a companion returns. The controller owns only its own mount; Main owns every transaction and the
   wording after it. No timers, no polling, no notifications: the board updates when Main re-projects it. */
import { COMPANION_MISSION_LORE_V1, type CompanionMissionLengthV1, type CompanionMissionTypeV1 } from '@cf/domain-acquisition/missions-internal';
import type { Arc5MissionBoardV1, Arc5MissionClaimRefusalV1, Arc5MissionDispatchRefusalV1, Arc5MissionLogRowV1 } from '@cf/persistence';

export const MISSION_TYPE_NAMES_V1: Readonly<Record<CompanionMissionTypeV1, string>> = Object.freeze({ prospect: 'Prospect', survey: 'Survey' });
export const MISSION_LENGTH_NAMES_V1: Readonly<Record<CompanionMissionLengthV1, string>> = Object.freeze({ short: 'Short', standard: 'Standard', long: 'Long' });

const DISPATCH_WHY: Readonly<Record<Arc5MissionDispatchRefusalV1, string>> = Object.freeze({
  'input-invalid': 'Choose a companion, a mission and a world.', 'missions-protected': 'Missions are unavailable until the save is repaired.',
  'slots-full': 'Both field slots are in use. Claim or recall one first.', 'world-not-landed': 'Land on a world first — missions go only where you have been.',
  'world-has-no-deposits': 'This world has no deposits to prospect. Try a Survey.', 'held-by-command-fight': 'It is in an open Command fight.',
  'creature-not-found': 'Choose one of your companions.', 'creature-exhibit': 'An exhibit stays home.', 'creature-assigned': 'Busy — it can go once it is free.',
  'creature-injured': 'Injured — let it Rest first.', 'bond-too-low': 'Long missions need a Trusted bond (level 2).', 'clock-exhausted': 'The expedition clock cannot hold a mission this long.',
});
const CLAIM_WHY: Readonly<Record<Arc5MissionClaimRefusalV1, string>> = Object.freeze({
  'missions-protected': 'Missions are unavailable until the save is repaired.', 'mission-not-active': 'Already claimed.',
  'mission-not-ready': 'Still away.', 'cargo-full': 'The hold is full — make room, then claim. Nothing is lost.', 'stardust-capacity': 'Stardust is at its limit.',
});
export const missionDispatchReasonV1 = (reason: Arc5MissionDispatchRefusalV1): string => DISPATCH_WHY[reason];
export const missionClaimReasonV1 = (reason: Arc5MissionClaimRefusalV1): string => CLAIM_WHY[reason];

/** The Chronicle / reveal line for one return (the text counterpart of the return expression). */
export function missionReturnTextV1(row: Arc5MissionLogRowV1, companion: string): string {
  const what = `${MISSION_TYPE_NAMES_V1[row.type]}, ${MISSION_LENGTH_NAMES_V1[row.length]}`;
  if (row.outcome === 'recalled') return `${companion} was recalled from ${row.worldName} (${what}) and came home with nothing.`;
  const gains: string[] = row.materials.map(([id, n]) => `${n} ${id}`);
  if (row.stardust > 0) gains.push(`${row.stardust} ✦`);
  if (row.xp > 0) gains.push(`+${row.xp} XP`);
  const parts = [`${companion} returned from ${row.worldName} (${what})${gains.length ? `: ${gains.join(', ')}` : ''}.`];
  if (row.hurt > 0) parts.push(row.hurt >= 0.3 ? 'It came back Injured.' : 'It came back Bruised.');
  if (row.loreIndex !== null) parts.push(`“${COMPANION_MISSION_LORE_V1[row.loreIndex]}”`);
  if (row.memento !== null) parts.push('It kept a memento of the place.');
  return parts.join(' ');
}

export interface MissionBoardRequestV1 { readonly creatureId: string; readonly type: CompanionMissionTypeV1; readonly length: CompanionMissionLengthV1; readonly worldKey: string; }
export interface MissionBoardControllerOptions {
  readonly onDispatch?: (request: MissionBoardRequestV1) => void;
  readonly onClaim?: (missionId: string) => void;
  readonly onRecall?: (missionId: string) => void;
  /** The chosen world changed (Main re-projects the disclosure for it). */
  readonly onTarget?: (worldKey: string) => void;
}

export class MissionBoardController {
  #mount: HTMLElement | null = null;
  #state: Arc5MissionBoardV1 | null = null;
  #pending = false;
  #message: string | null = null;
  #armedRecall: string | null = null;
  #pick: { creatureId: string | null; type: CompanionMissionTypeV1; length: CompanionMissionLengthV1; worldKey: string | null } = { creatureId: null, type: 'prospect', length: 'short', worldKey: null };
  readonly #options: MissionBoardControllerOptions;
  readonly #nameOf: (creatureId: string) => string;
  constructor(options: MissionBoardControllerOptions = {}, nameOf: (creatureId: string) => string = () => 'Companion') { this.#options = options; this.#nameOf = nameOf; }
  setState(state: Arc5MissionBoardV1 | null, worldKey: string | null = null): void { this.#state = state; if (worldKey !== null) this.#pick.worldKey = worldKey; this.#render(); }
  attach(mount: HTMLElement): void { this.#mount = mount; this.#render(); }
  /** Main reports the terminal outcome of a press; `reveal` is the return's live status line. */
  settle(message: string): void { this.#pending = false; this.#armedRecall = null; this.#message = message; this.#render(); }
  get pending(): boolean { return this.#pending; }
  get selection(): Readonly<{ creatureId: string | null; type: CompanionMissionTypeV1; length: CompanionMissionLengthV1; worldKey: string | null }> { return Object.freeze({ ...this.#pick }); }

  #render(): void {
    const mount = this.#mount; if (mount === null || !mount.isConnected) return;
    const doc = mount.ownerDocument;
    const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', cls = ''): HTMLElementTagNameMap[K] => { const n = doc.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
    const button = (text: string, onPress: () => void, disabled: boolean, why: string | null): HTMLButtonElement => {
      const b = el('button', text); b.type = 'button'; b.style.minHeight = '44px'; b.style.minWidth = '44px'; b.disabled = disabled || this.#pending;
      if (why !== null) b.title = why;
      b.addEventListener('click', () => { if (b.disabled || this.#pending) return; onPress(); });
      return b;
    };
    mount.replaceChildren();
    const state = this.#state; if (state === null) return;
    mount.dataset.missionBoard = 'true';
    mount.append(el('h4', 'Missions'));
    const slots = el('p', `Field slots: ${state.slotsUsed} of ${state.slots} in use`); slots.dataset.missionSlots = String(state.slotsUsed); mount.append(slots);

    for (const m of state.active) {
      const card = el('div', '', 'mission-row'); card.dataset.missionRow = m.missionId;
      const badge = el('span', m.status === 'ready' ? 'Ready' : `Away — ${m.remainingMinutes} min of play left`); badge.dataset.missionBadge = m.status;
      card.append(el('p', `${m.companion} · ${MISSION_TYPE_NAMES_V1[m.type]} (${MISSION_LENGTH_NAMES_V1[m.length]}) · ${m.worldName} — `), badge);
      const claimWhy = m.claimRefusal === null ? null : missionClaimReasonV1(m.claimRefusal);
      const claim = button('Claim', () => { this.#pending = true; this.#message = null; this.#render(); this.#options.onClaim?.(m.missionId); }, m.claimRefusal !== null, claimWhy);
      claim.dataset.missionClaim = m.missionId;
      const armed = this.#armedRecall === m.missionId;
      const recall = button(armed ? 'Recall — it comes home with nothing' : 'Recall', () => {
        if (!armed) { this.#armedRecall = m.missionId; this.#render(); return; }
        this.#pending = true; this.#message = null; this.#armedRecall = null; this.#render(); this.#options.onRecall?.(m.missionId);
      }, false, 'Recall any time: it comes home unhurt, with nothing.');
      recall.dataset.missionRecall = m.missionId; recall.dataset.missionRecallArmed = armed ? 'true' : 'false';
      card.append(claim, recall);
      if (m.claimRefusal === 'cargo-full') { const w = el('p', claimWhy ?? ''); w.dataset.missionClaimWhy = m.claimRefusal; card.append(w); }
      mount.append(card);
    }

    // dispatch: the disclosure before anything leaves
    const form = el('div', '', 'mission-dispatch'); form.dataset.missionDispatch = 'true';
    const companions = state.companions;
    if (this.#pick.creatureId === null || !companions.some((c) => c.creatureId === this.#pick.creatureId)) this.#pick.creatureId = companions[0]?.creatureId ?? null;
    if (this.#pick.worldKey === null || !state.worlds.some((w) => w.worldKey === this.#pick.worldKey)) this.#pick.worldKey = state.worlds[0]?.worldKey ?? null;
    const select = (name: string, options: readonly (readonly [string, string])[], value: string | null, onChange: (v: string) => void): HTMLSelectElement => {
      const s = el('select'); s.dataset.missionPick = name; s.style.minHeight = '44px'; s.setAttribute('aria-label', name);
      for (const [v, label] of options) { const o = el('option', label); o.value = v; if (v === value) o.selected = true; s.append(o); }
      s.addEventListener('change', () => onChange(s.value)); return s;
    };
    form.append(
      select('companion', companions.map((c) => [c.creatureId, c.companion] as const), this.#pick.creatureId, (v) => { this.#pick.creatureId = v; this.#render(); }),
      select('mission', (['prospect', 'survey'] as const).map((t) => [t, MISSION_TYPE_NAMES_V1[t]] as const), this.#pick.type, (v) => { this.#pick.type = v as CompanionMissionTypeV1; this.#render(); }),
      select('length', (['short', 'standard', 'long'] as const).map((l) => [l, MISSION_LENGTH_NAMES_V1[l]] as const), this.#pick.length, (v) => { this.#pick.length = v as CompanionMissionLengthV1; this.#render(); }),
      select('world', state.worlds.map((w) => [w.worldKey, w.worldName] as const), this.#pick.worldKey, (v) => { this.#pick.worldKey = v; this.#options.onTarget?.(v); this.#render(); }),
    );
    const companion = companions.find((c) => c.creatureId === this.#pick.creatureId) ?? null;
    const offer = companion?.offers.find((o) => o.type === this.#pick.type && o.length === this.#pick.length) ?? null;
    const world = state.worlds.find((w) => w.worldKey === this.#pick.worldKey) ?? null;
    const refusal: Arc5MissionDispatchRefusalV1 | null = companion === null || world === null ? 'input-invalid'
      : this.#pick.type === 'prospect' && !world.hasDeposits ? 'world-has-no-deposits' : offer === null ? 'input-invalid' : offer.refusal;
    if (offer !== null) {
      const brings = this.#pick.type === 'prospect' ? `brings materials from ${world?.worldName ?? 'this world'}’s deposits` : 'brings a little Stardust and a story';
      const disclosure = el('p', `${MISSION_LENGTH_NAMES_V1[offer.length]} · ${offer.activeMinutes} min of play · ${Math.round(offer.woundChance * 100)}% chance of a wound · ${brings}. Recall any time: it comes home with nothing.`);
      disclosure.dataset.missionDisclosure = `${offer.type}:${offer.length}`; form.append(disclosure);
    }
    const send = button('Send', () => {
      if (companion === null || world === null) return;
      this.#pending = true; this.#message = null; this.#render();
      this.#options.onDispatch?.({ creatureId: companion.creatureId, type: this.#pick.type, length: this.#pick.length, worldKey: world.worldKey });
    }, refusal !== null, refusal === null ? null : missionDispatchReasonV1(refusal));
    send.dataset.missionSend = 'true'; form.append(send);
    if (refusal !== null) { const why = el('p', missionDispatchReasonV1(refusal)); why.dataset.missionSendWhy = refusal; form.append(why); }
    mount.append(form);

    if (this.#message !== null) { const m = el('p', this.#message); m.dataset.missionMessage = 'true'; m.setAttribute('role', 'status'); m.setAttribute('aria-live', 'polite'); mount.append(m); }
    if (state.log.length > 0) {
      const chronicle = el('div', '', 'mission-chronicle'); chronicle.dataset.missionChronicle = 'true';
      chronicle.append(el('h5', 'Mission Chronicle'));
      for (const row of state.log.slice(0, 5)) { const p = el('p', missionReturnTextV1(row, this.#nameOf(row.creatureId))); p.dataset.missionLog = row.missionId; chronicle.append(p); }
      mount.append(chronicle);
    }
  }
}
