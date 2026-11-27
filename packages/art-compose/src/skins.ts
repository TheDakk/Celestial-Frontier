import type { SizeTier, SkinName } from '@cf/art-format';

// Every tunable number and shape of the skin painter, fixed per renderer version. Tuning changes this file only.
// A texture is drawn as solid clusters of whole pixels: scattered ones each one shade darker or lighter than the hide
// under it, armour (plates, chitin) as whole pieces with a lit edge, a face, a shadow and a dark rim. No rule lays a
// dot or a line on every cell of a grid (skin.ts keeps the clusters apart and drops any lone pixel).

/** A cluster's drawing, rows top to bottom: `D` one shade darker, `L` one shade lighter, `.` the hide as it is. */
export type Stamp = readonly string[];

/**
 * Clusters thrown over the hide with no fixed pitch: one throw for every `room` pixels of the hide's box, each at a
 * place rolled from the seed, drawn where the hide lets it lie whole and clear of the others (skin.ts).
 */
export interface Scatter {
  room: number;                             // pixels of the hide's box for each throw: the larger, the fewer clusters
  loose: boolean;                           // true: a cluster may cross from one shade of the hide to the next (a broad facet)
  stamps: readonly Stamp[];                 // a throw's roll picks the one tried first
  spare: readonly Stamp[];                  // smaller ones, tried where none of `stamps` fits (a leg, a narrow band of shade)
}
/** Lines across a part's short side, `gap` to `gap + jitter` pixels apart: how a small or medium creature's plates and chitin are drawn, and a large body that is mostly arms. */
export interface Spacing { gap: number; jitter: number }
/** Armour plates on a large creature: shields `wide` by `tall` pixels in overlapping rows, on a body and down a leg (skin.ts). */
export interface Plates { wide: number; tall: number }
/** Chitin segments on a large creature: `gap` to `gap + jitter` columns wide along a body; on a leg, joints `band` to `band + 2` rows apart (skin.ts). */
export interface Segments { gap: number; jitter: number; band: number }

export type SkinRule =
  | { untuned: boolean; mode: 'none' }                                    // nothing is painted without a drawn layer
  | { untuned: boolean; mode: 'edge' }                                    // a pixel under an empty one is one shade lighter
  | { untuned: boolean; mode: 'scatter'; tiers: Readonly<Record<SizeTier, Scatter>> }
  | { untuned: boolean; mode: 'seams'; lines: Readonly<Record<'small' | 'medium' | 'large', Spacing>>; armour: Segments } // segments, each lit above and in front, dark below and at its seam
  | { untuned: boolean; mode: 'plates'; lines: Readonly<Record<'small' | 'medium' | 'large', Spacing>>; armour: Plates };  // shields in overlapping rows, each lit above, shaded behind, dark below

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
  // Scales: crescents, the dark lower edge of each scale; short dashes where a crescent has no room.
  scaled: { untuned: true, mode: 'scatter', tiers: tiers<Scatter>(
    { room: 24, loose: false, stamps: [['DDD'], ['DD']], spare: [['D', 'D']] },
    { room: 26, loose: false, stamps: [['D..D', 'DDDD'], ['D..D', 'DDDD'], ['DDD']], spare: [['DD'], ['D', 'D']] },
    { room: 32, loose: false, stamps: [['D...D', 'DDDDD'], ['D..D', 'DDDD']], spare: [['DDD'], ['DD'], ['D', 'D']] },
  ) },
  // Fur: short tufts leaning back and down, dark and light.
  furred: { untuned: true, mode: 'scatter', tiers: tiers<Scatter>(
    { room: 22, loose: false, stamps: [['D', 'D'], ['L', 'L'], ['D', 'D'], ['.D', 'DD']], spare: [] },
    { room: 24, loose: false, stamps: [['.D', 'DD', 'D.'], ['.L', 'LL'], ['.D', 'DD']], spare: [['D', 'D']] },
    { room: 26, loose: false, stamps: [['..D', '.DD', 'DD.'], ['.L', 'LL', 'L.'], ['.D', '.D', 'DD', 'D.'], ['.D', 'DD', 'D.']], spare: [['D', 'D']] },
  ) },
  // Chitin on a large creature (`armour`): one row of segments along the body, each lit in front and shaded behind,
  // lapping over the next at a dark seam. On a small or medium one, and on a large body of arms (`lines`): dark seams.
  chitinous: { untuned: true, mode: 'seams', lines: { small: { gap: 5, jitter: 5 }, medium: { gap: 6, jitter: 6 }, large: { gap: 8, jitter: 8 } }, armour: { gap: 11, jitter: 6, band: 9 } },
  slick: { untuned: true, mode: 'edge' },
  // Plates on a large creature (`armour`): shields in rows that follow the back, each with a lit upper edge, a shadow
  // and a dark rim. On a small or medium one, and on a large body of arms (`lines`): a lit edge, a seam and a rim.
  plated: { untuned: true, mode: 'plates', lines: { small: { gap: 9, jitter: 6 }, medium: { gap: 14, jitter: 10 }, large: { gap: 20, jitter: 13 } }, armour: { wide: 13, tall: 7 } },
  // Warts: raised bumps scattered unevenly, lit above and shaded below.
  warty: { untuned: true, mode: 'scatter', tiers: tiers<Scatter>(
    { room: 28, loose: false, stamps: [['LL', 'DD']], spare: [['LL'], ['DD']] },
    { room: 38, loose: false, stamps: [['LL', 'LL', 'DD'], ['LL', 'DD']], spare: [['LL'], ['DD']] },
    { room: 60, loose: false, stamps: [['LLL.', 'LLLD', '.DDD'], ['LL.', 'LLD', '.DD']], spare: [['LL', 'DD'], ['LL'], ['DD']] },
  ) },
  // Feathers: slanted two-tone vanes, the pale shaft above the dark trailing edge.
  feathered: { untuned: true, mode: 'scatter', tiers: tiers<Scatter>(
    { room: 26, loose: false, stamps: [['.LL', 'DD.']], spare: [['DD'], ['D', 'D']] },
    { room: 28, loose: false, stamps: [['.LLL', 'DDD.'], ['..LL', 'DDD.']], spare: [['.LL', 'DD.'], ['DD'], ['D', 'D']] },
    { room: 44, loose: false, stamps: [['...LLL', '.LLLDD', 'DDDDD.'], ['..LLL', 'DDDD.']], spare: [['.LLL', 'DDD.'], ['DD'], ['D', 'D']] },
  ) },
  translucent: { untuned: true, mode: 'none' },
  // Crystal: broad facets, a lit plane with a shaded lower edge.
  crystalline: { untuned: true, mode: 'scatter', tiers: tiers<Scatter>(
    { room: 36, loose: true, stamps: [['.LL', 'LLD', '.DD']], spare: [['LL', 'DD']] },
    { room: 70, loose: true, stamps: [['..LL.', '.LLL.', 'LLLD.', 'LLDD.', '.DD..'], ['.LL.', 'LLLD', '.LDD']], spare: [['.LL', 'LLD', '.DD']] },
    { room: 120, loose: true, stamps: [['...LL..', '..LLLL.', '.LLLLD.', 'LLLLDD.', 'LLLDDD.', '.LDDD..', '..DD...'], ['..LL.', '.LLL.', 'LLLD.', 'LLDD.', '.DD..']], spare: [['.LL.', 'LLLD', '.LDD']] },
  ) },
});
