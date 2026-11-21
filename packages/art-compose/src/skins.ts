import type { SkinName } from '@cf/art-format';

// Every tunable number of the skin painter, fixed per renderer version. Tuning changes numbers here only.

export interface SkinRule {
  untuned: boolean;                         // true: a first version Dakk has not seen on stills
  mode: 'none' | 'grid' | 'rows' | 'dots' | 'edge';
  across: number; down: number;             // cell size in frame pixels
  stagger: number;                          // columns every other row of cells moves by
  step: -1 | 1;                             // shade change on a texture pixel, clamped inside its own ramp
}
export const SKIN_TABLE: Readonly<Record<SkinName, SkinRule>> = {
  scaled:      { untuned: true, mode: 'grid', across: 3, down: 2, stagger: 1, step: -1 },
  furred:      { untuned: true, mode: 'dots', across: 2, down: 3, stagger: 1, step: -1 },
  chitinous:   { untuned: true, mode: 'rows', across: 1, down: 3, stagger: 0, step: -1 },
  slick:       { untuned: true, mode: 'edge', across: 1, down: 1, stagger: 0, step: 1 },
  plated:      { untuned: true, mode: 'grid', across: 5, down: 4, stagger: 2, step: -1 },
  warty:       { untuned: true, mode: 'dots', across: 4, down: 3, stagger: 2, step: 1 },
  feathered:   { untuned: true, mode: 'grid', across: 4, down: 3, stagger: 2, step: -1 },
  translucent: { untuned: true, mode: 'none', across: 1, down: 1, stagger: 0, step: 1 },
  crystalline: { untuned: true, mode: 'grid', across: 4, down: 4, stagger: 2, step: 1 },
};
