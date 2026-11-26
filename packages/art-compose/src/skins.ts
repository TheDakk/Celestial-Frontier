import type { SizeTier, SkinName } from '@cf/art-format';

// Every tunable number and shape of the skin painter, fixed per renderer version. Tuning changes this file only.
// A texture is drawn as solid clusters of whole pixels, each one shade darker or lighter than the hide under it;
// no rule lays a dot or a line on every cell of a grid (skin.ts keeps the clusters apart and drops any lone pixel).

/** A cluster's drawing, rows top to bottom: `D` one shade darker, `L` one shade lighter, `.` the hide as it is. */
export type Stamp = readonly string[];
/** No stamp is wider or taller than this. */
export const STAMP_MOST = 8;

/**
 * Clusters scattered over the hide: a staggered grid of cells, and for `keep` of 100 of them one cluster, placed in or
 * beside its cell where the hide lets it lie whole and clear of the others (skin.ts).
 */
export interface Scatter {
  across: number; down: number;             // cell size in frame pixels
  stagger: number;                          // columns every other row of cells moves by
  keep: number;                             // percent of cells that try for a cluster
  loose: boolean;                           // true: a cluster may cross from one shade of the hide to the next (a broad facet)
  stamps: readonly Stamp[];                 // a cell's roll picks the one tried first
}
/** Lines across a part's short side, `gap` to `gap + jitter` pixels apart. */
export interface Spacing { gap: number; jitter: number }

export type SkinRule =
  | { untuned: boolean; mode: 'none' }                                    // nothing is painted without a drawn layer
  | { untuned: boolean; mode: 'edge' }                                    // a pixel under an empty one is one shade lighter
  | { untuned: boolean; mode: 'scatter'; tiers: Readonly<Record<SizeTier, Scatter>> }
  | { untuned: boolean; mode: 'seams'; tiers: Readonly<Record<SizeTier, Spacing>> }   // a dark seam with a lit edge beside it
  | { untuned: boolean; mode: 'plates'; tiers: Readonly<Record<SizeTier, Spacing>> }; // a lit top, a dark side and a dark lower rim

/** The table and everything in it, frozen: a picture changes only through a change to this file. */
function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
/** One rule for each tier; a Guardian is drawn with the large tier's. */
const tiers = <T>(small: T, medium: T, large: T): Record<SizeTier, T> => ({ small, medium, large, guardian: large });

// `untuned: true` is a first version Dakk has not seen on stills.
export const SKIN_TABLE: Readonly<Record<SkinName, SkinRule>> = deepFreeze<Record<SkinName, SkinRule>>({
  // Scales: crescents, the dark lower edge of each scale, in staggered rows; short dashes where a crescent has no room.
  scaled: { untuned: true, mode: 'scatter', tiers: tiers<Scatter>(
    { across: 4, down: 3, stagger: 2, keep: 100, loose: false, stamps: [['DDD'], ['DD']] },
    { across: 6, down: 5, stagger: 3, keep: 100, loose: false, stamps: [['D..D', 'DDDD'], ['DDD'], ['DD']] },
    { across: 7, down: 5, stagger: 3, keep: 100, loose: false, stamps: [['D...D', 'DDDDD'], ['D..D', 'DDDD'], ['DDD']] },
  ) },
  // Fur: short tufts leaning back and down, dark and light.
  furred: { untuned: true, mode: 'scatter', tiers: tiers<Scatter>(
    { across: 3, down: 4, stagger: 1, keep: 100, loose: false, stamps: [['D', 'D'], ['L', 'L'], ['D', 'D']] },
    { across: 4, down: 4, stagger: 2, keep: 100, loose: false, stamps: [['.D', 'DD', 'D.'], ['.L', 'LL'], ['.D', 'DD'], ['D', 'D']] },
    { across: 5, down: 5, stagger: 2, keep: 100, loose: false, stamps: [['..D', '.DD', 'DD.'], ['.L', 'LL', 'L.'], ['.D', '.D', 'DD', 'D.'], ['.D', 'DD', 'D.'], ['D', 'D']] },
  ) },
  // Chitin: the seams between hard segments.
  chitinous: { untuned: true, mode: 'seams', tiers: tiers<Spacing>({ gap: 5, jitter: 2 }, { gap: 7, jitter: 3 }, { gap: 10, jitter: 4 }) },
  slick: { untuned: true, mode: 'edge' },
  // Plates: a few broad armour sections.
  plated: { untuned: true, mode: 'plates', tiers: tiers<Spacing>({ gap: 7, jitter: 2 }, { gap: 11, jitter: 4 }, { gap: 16, jitter: 6 }) },
  // Warts: raised bumps scattered unevenly, lit above and shaded below.
  warty: { untuned: true, mode: 'scatter', tiers: tiers<Scatter>(
    { across: 6, down: 5, stagger: 3, keep: 80, loose: false, stamps: [['LL', 'DD'], ['LL']] },
    { across: 7, down: 6, stagger: 3, keep: 80, loose: false, stamps: [['LL', 'LL', 'DD'], ['LL', 'DD']] },
    { across: 9, down: 8, stagger: 4, keep: 80, loose: false, stamps: [['LLL.', 'LLLD', '.DDD'], ['LL.', 'LLD', '.DD'], ['LL', 'DD']] },
  ) },
  // Feathers: slanted two-tone vanes in staggered rows, the pale shaft above the dark trailing edge.
  feathered: { untuned: true, mode: 'scatter', tiers: tiers<Scatter>(
    { across: 5, down: 4, stagger: 2, keep: 100, loose: false, stamps: [['.LL', 'DD.'], ['DD']] },
    { across: 6, down: 5, stagger: 3, keep: 100, loose: false, stamps: [['.LLL', 'DDD.'], ['..LL', 'DDD.'], ['.LL', 'DD.']] },
    { across: 8, down: 6, stagger: 4, keep: 100, loose: false, stamps: [['...LLL', '.LLLDD', 'DDDDD.'], ['..LLL', 'DDDD.'], ['.LLL', 'DDD.']] },
  ) },
  translucent: { untuned: true, mode: 'none' },
  // Crystal: broad facets, a lit plane with a shaded lower edge.
  crystalline: { untuned: true, mode: 'scatter', tiers: tiers<Scatter>(
    { across: 6, down: 6, stagger: 3, keep: 90, loose: true, stamps: [['.LL', 'LLD', '.DD'], ['LL', 'DD']] },
    { across: 9, down: 8, stagger: 4, keep: 90, loose: true, stamps: [['..LL.', '.LLL.', 'LLLD.', 'LLDD.', '.DD..'], ['.LL.', 'LLLD', '.LDD'], ['.LL', 'LLD', '.DD']] },
    { across: 13, down: 10, stagger: 6, keep: 90, loose: true, stamps: [['...LL..', '..LLLL.', '.LLLLD.', 'LLLLDD.', 'LLLDDD.', '.LDDD..', '..DD...'], ['..LL.', '.LLL.', 'LLLD.', 'LLDD.', '.DD..'], ['.LL.', 'LLLD', '.LDD']] },
  ) },
});
