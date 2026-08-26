import { displayRarity } from '@cf/domain-speciestraits';

export type RawGradeTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type DisplayRarityTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface DisplayRarityView {
  readonly tier: DisplayRarityTier;
  readonly id: string;
  readonly name: string;
  readonly hex: string;
}

const RAW_GRADE_TIER_MAX = 14;
const DISPLAY_RARITY_TIER_MAX = 9;

const DISPLAY_RARITY_BY_RAW = Object.freeze(Array.from(
  { length: RAW_GRADE_TIER_MAX + 1 },
  (_, raw): DisplayRarityView => {
    const canonical = displayRarity(raw);
    const expectedTier = Math.min(raw, DISPLAY_RARITY_TIER_MAX);
    if (canonical.t !== expectedTier
      || !Number.isInteger(canonical.t)
      || typeof canonical.id !== 'string' || canonical.id.length === 0
      || typeof canonical.name !== 'string' || canonical.name.length === 0
      || typeof canonical.hex !== 'string' || !/^#[0-9A-F]{6}$/u.test(canonical.hex)) {
      throw new Error(`invalid canonical display rarity row for raw tier ${raw}`);
    }
    return Object.freeze({
      tier: canonical.t as DisplayRarityTier,
      id: canonical.id,
      name: canonical.name,
      hex: canonical.hex,
    });
  },
));

/**
 * Strict player-presentation boundary for the deterministic raw 0–14 grade.
 * Missing or malformed values disclose no rarity; they never coerce to Common.
 */
export function projectDisplayRarity(value: unknown): DisplayRarityView | null {
  if (typeof value !== 'number' || !Number.isInteger(value)
    || value < 0 || value > RAW_GRADE_TIER_MAX) return null;
  return DISPLAY_RARITY_BY_RAW[value] ?? null;
}
