/** CARD = STAGE tint decisions (one per archetype recipe hash and palette role), read from the generated compact table.
 * FINISH F4 (2026-11-04): the table is two strings — the sorted recipe hashes (64 hex each, concatenated) and one digit per hash,
 * 3·base + accent with 0 = rotate the hue (false), 1 = tint (true), 2 = no decision for that role — because a frozen object per
 * archetype held 137 KB on the phone Compendium path at 420 archetypes (the strings hold ~28 KB). Lookup is a binary search. */
import { CARD_TINT_CODES, CARD_TINT_HASHES } from './card-tint.generated.js';

export type CardTintV1 = Readonly<{ base?: boolean; accent?: boolean }>;
const DECODED: readonly CardTintV1[] = Array.from({ length: 9 }, (_, code) => {
  const base = Math.floor(code / 3), accent = code % 3, out: { base?: boolean; accent?: boolean } = {};
  if (base < 2) out.base = base === 1; if (accent < 2) out.accent = accent === 1; return Object.freeze(out);
});
/** Encodes one decision (the generator's side of the same rule). */
export function cardTintCodeV1(t: CardTintV1): string {
  const d = (v: boolean | undefined) => (v === undefined ? 2 : v ? 1 : 0); return String(3 * d(t.base) + d(t.accent));
}
/** The tint decision for a recipe hash, or undefined when the table has none. */
export function cardTintV1(recipeHash: string, hashes = CARD_TINT_HASHES, codes = CARD_TINT_CODES): CardTintV1 | undefined {
  if (recipeHash.length !== 64) return undefined;
  let lo = 0, hi = codes.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1, key = hashes.slice(mid * 64, mid * 64 + 64);
    if (key === recipeHash) return DECODED[Number(codes[mid])];
    if (key < recipeHash) lo = mid + 1; else hi = mid - 1;
  }
  return undefined;
}
