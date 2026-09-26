/** @module recipe-pin [app] — the Fabricator's 📌 pinned recipe and its tracking chip (v1.8.9 parity, D16; v1 `data-pin`,
 * `_pinChip`, save field `pin`). One recipe at a time; the chip names up to three missing costs and flips to READY when the
 * Fabricator could forge it; tapping it opens the Shipyard. The pin is VIEW state: it is saved (`save.pinnedRecipe`, v1 key
 * `pin`, validated against the catalogue on load; absent/unknown ⇒ none) but never authorizes anything — every fabrication is
 * re-derived inside F4. The chip quotes the canonical fixed recipe (`quoteFixedRecipe`) against the live save, so it tracks
 * materials from ANY source (mining, loot, salvage), not only the Shipyard. */
import { LOOT_CATALOGUE_V1, getFixedRecipePlan, quoteFixedRecipe } from '@cf/domain-loot';
import { engineeringLabelV1, engineeringSignatureLabelV1 } from './engineering-panel-model.js';

export interface RecipePinEconomyV1 {
  readonly cargo: readonly (readonly [string, number])[];
  readonly items: readonly (readonly [string, number])[];
  readonly stardust: number;
  readonly signatureIds: readonly string[];
}

export interface RecipePinChipModelV1 {
  readonly baseId: string;
  readonly name: string;
  readonly ready: boolean;
  /** Every missing cost, in v1 order (materials, parts, Stardust, prerequisite, Signature). */
  readonly missing: readonly string[];
  readonly text: string;
}

const PINNABLE = new Set(LOOT_CATALOGUE_V1.map((definition) => definition.id));

/** v1 load rule: a pin survives only when it names a real recipe. */
export function sanitizeRecipePinV1(value: unknown): string | null {
  if (typeof value !== 'string' || !PINNABLE.has(value)) return null;
  try { getFixedRecipePlan(value); return value; } catch { return null; }
}

/** The chip, or null (no pin, an unknown recipe, or a permanent system already built — v1 hid the chip then). */
export function projectRecipePinChipV1(pinned: string | null, economy: RecipePinEconomyV1): RecipePinChipModelV1 | null {
  const baseId = sanitizeRecipePinV1(pinned);
  if (baseId === null) return null;
  const counts = (rows: readonly (readonly [string, number])[]): Record<string, number> => {
    const result: Record<string, number> = {};
    for (const [id, n] of rows) if (typeof id === 'string' && Number.isFinite(n) && n > 0) result[id] = (result[id] ?? 0) + Math.floor(n);
    return result;
  };
  const quote = quoteFixedRecipe(baseId, {
    materials: counts(economy.cargo), itemCounts: counts(economy.items),
    stardust: Math.max(0, Math.floor(economy.stardust)), signatureIds: [...economy.signatureIds],
  });
  if (quote.alreadyBuilt) return null;
  const missing = [
    ...quote.missingMaterials.map((row) => `${row.missing}× ${engineeringLabelV1(row.id)}`),
    ...quote.missingParts.map((row) => `${row.missing}× ${engineeringLabelV1(row.id)}`),
    ...(quote.missingStardust > 0 ? [`☄${quote.missingStardust}`] : []),
    ...(quote.missingPrerequisiteId !== null ? [engineeringLabelV1(quote.missingPrerequisiteId)] : []),
    ...(quote.missingSignatureId !== null ? [engineeringSignatureLabelV1(quote.missingSignatureId)] : []),
  ];
  const name = engineeringLabelV1(baseId);
  const text = missing.length === 0
    ? `📌 ${name} — READY to forge ✦`
    : `📌 ${name} — need ${missing.slice(0, 3).join(' · ')}${missing.length > 3 ? ' …' : ''}`;
  return Object.freeze({ baseId, name, ready: missing.length === 0, missing: Object.freeze(missing), text });
}

/** The one chip element (created on first use, reused after). Tapping it calls `open` (Main opens the Shipyard). */
export class RecipePinChipV1 {
  readonly #document: Document;
  readonly #open: () => void;
  #element: HTMLButtonElement | null = null;

  constructor(document: Document, open: () => void) {
    this.#document = document;
    this.#open = open;
  }

  render(model: RecipePinChipModelV1 | null): void {
    if (model === null) {
      if (this.#element !== null) this.#element.hidden = true;
      return;
    }
    if (this.#element === null) {
      const element = this.#document.createElement('button');
      element.type = 'button';
      element.id = 'pinchip';
      element.addEventListener('click', () => this.#open());
      this.#document.body.appendChild(element);
      this.#element = element;
    }
    const element = this.#element;
    element.hidden = false;
    element.classList.toggle('ready', model.ready);
    element.dataset.recipePinChip = model.baseId;
    element.textContent = model.text;
    element.setAttribute('aria-label', `${model.text}. Open the Shipyard.`);
  }
}
