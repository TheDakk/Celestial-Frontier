import type { PatternName } from '@cf/art-format';

// Every tunable number of the mark painter, fixed per renderer version. Tuning changes numbers here only.
// Strength for hand-drawn layers is not designed yet: a hand-drawn layer is applied as drawn at every strength.

export interface PatternRule {
  untuned: boolean;                                   // true: a first attempt Dakk has not seen on stills
  mode: 'lines' | 'spots' | 'rings' | 'mottle' | 'veins';
  period: 3 | 5 | 15; on: number;                     // a flow value f is on a line when (f - 1 + phase) % period < on
  percent: number;                                    // a spot value s is chosen when rolls[s - 1] * 100 < percent * STRENGTH_KEEP[strength]
                                                      // (mottle: a cell is chosen the same way, with rolls[cell])
  shade: readonly [number, number, number, number];   // mark value by the frame pixel's shade 0-3 inside its ramp; 0 leaves the pixel
  centre: number;                                     // rings: the value inside the rim, whatever the shade under it
  jog: number;                                        // veins: added to the phase inside a chosen spot
}
const MARK = [5, 5, 5, 6] as const;                   // accent 5, or 6 on the host ramp's lightest shade
export const PATTERN_TABLE: Readonly<Record<Exclude<PatternName, 'plain'>, PatternRule>> = {
  striped:       { untuned: false, mode: 'lines',  period: 5,  on: 2, percent: 0,  shade: MARK, centre: 0,  jog: 0 },
  banded:        { untuned: false, mode: 'lines',  period: 15, on: 6, percent: 0,  shade: MARK, centre: 0,  jog: 0 },
  spotted:       { untuned: false, mode: 'spots',  period: 15, on: 0, percent: 55, shade: MARK, centre: 0,  jog: 0 },
  'eye-spotted': { untuned: false, mode: 'rings',  period: 15, on: 0, percent: 55, shade: MARK, centre: 7,  jog: 0 }, // centre: accent, second-lightest
  mottled:       { untuned: true,  mode: 'mottle', period: 15, on: 0, percent: 55, shade: MARK, centre: 0,  jog: 0 }, // period and on unused
  marbled:       { untuned: true,  mode: 'veins',  period: 15, on: 4, percent: 50, shade: MARK, centre: 0,  jog: 5 },
  iridescent:    { untuned: true,  mode: 'lines',  period: 3,  on: 1, percent: 0,  shade: [0, 0, 7, 8], centre: 0, jog: 0 },
};
export const STRENGTH_KEEP = [33, 67, 100] as const;  // hint, clear, full: percent of marks kept
export const PHASE_SPREAD = 3;                        // how far one part's stripes may sit from the creature's phase
// Mottle: only pixels inside a spot blob and on a flow line are considered. Each lies in a cell
// (s * MOTTLE_SPOT_STEP + (place >> MOTTLE_PAIR_SHIFT) * MOTTLE_LINE_STEP) % 15, where place is the flow value's place in the
// 15-step cycle at the part's phase: one spot blob crossed with a pair of neighbouring flow lines. Nested by strength.
export const MOTTLE_SPOT_STEP = 7;
export const MOTTLE_LINE_STEP = 4;
export const MOTTLE_PAIR_SHIFT = 1;                   // 1: two neighbouring flow lines share a cell
