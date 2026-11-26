import { quotient } from './planet-noise';
import { rootOf } from './space';

/** The sine of a quarter turn in 192 steps, in 65536ths: SINE[k] is the sine of k 768ths of a turn. A map 384 wide
 *  takes every second value for its columns and one 128 high every third for its rows; maps of half the size take
 *  every fourth and every sixth. */
export const SINE: readonly number[] = [
  0, 536, 1072, 1608, 2144, 2680, 3216, 3751, 4286, 4821, 5356, 5890,
  6424, 6957, 7490, 8022, 8554, 9085, 9616, 10146, 10676, 11204, 11732, 12259,
  12785, 13311, 13835, 14359, 14882, 15403, 15924, 16444, 16962, 17479, 17995, 18510,
  19024, 19537, 20048, 20557, 21066, 21573, 22078, 22582, 23085, 23586, 24086, 24583,
  25080, 25574, 26067, 26558, 27047, 27535, 28020, 28504, 28986, 29466, 29944, 30420,
  30893, 31365, 31835, 32303, 32768, 33231, 33692, 34151, 34607, 35062, 35513, 35963,
  36410, 36854, 37297, 37736, 38173, 38608, 39040, 39469, 39896, 40320, 40741, 41160,
  41576, 41989, 42399, 42806, 43211, 43613, 44011, 44407, 44800, 45190, 45577, 45960,
  46341, 46719, 47093, 47464, 47832, 48197, 48559, 48917, 49273, 49624, 49973, 50318,
  50660, 50998, 51333, 51665, 51993, 52318, 52639, 52957, 53271, 53581, 53888, 54191,
  54491, 54787, 55080, 55368, 55653, 55935, 56212, 56486, 56756, 57022, 57284, 57543,
  57798, 58048, 58295, 58538, 58777, 59013, 59244, 59471, 59694, 59914, 60129, 60340,
  60547, 60751, 60950, 61145, 61336, 61522, 61705, 61884, 62058, 62228, 62394, 62556,
  62714, 62868, 63017, 63162, 63303, 63440, 63572, 63700, 63824, 63944, 64059, 64170,
  64277, 64379, 64477, 64571, 64661, 64746, 64827, 64903, 64975, 65043, 65107, 65166,
  65220, 65271, 65317, 65358, 65396, 65429, 65457, 65481, 65501, 65516, 65527, 65534,
  65536,
];
/** The sine of each whole degree from 0 to 90, in 65536ths: a globe leans in whole degrees. */
export const LEAN_SINE: readonly number[] = [
  0, 1144, 2287, 3430, 4572, 5712, 6850, 7987, 9121, 10252, 11380, 12505,
  13626, 14742, 15855, 16962, 18064, 19161, 20252, 21336, 22415, 23486, 24550, 25607,
  26656, 27697, 28729, 29753, 30767, 31772, 32768, 33754, 34729, 35693, 36647, 37590,
  38521, 39441, 40348, 41243, 42126, 42995, 43852, 44695, 45525, 46341, 47143, 47930,
  48703, 49461, 50203, 50931, 51643, 52339, 53020, 53684, 54332, 54963, 55578, 56175,
  56756, 57319, 57865, 58393, 58903, 59396, 59870, 60326, 60764, 61183, 61584, 61966,
  62328, 62672, 62997, 63303, 63589, 63856, 64104, 64332, 64540, 64729, 64898, 65048,
  65177, 65287, 65376, 65446, 65496, 65526, 65536,
];
/** The widest globe a table is made for: its radius in 4096ths of a pixel stays a root rootOf can take. */
const WIDEST = 511;
const SINE_TURN = 768;

/** Where each pixel of a globe reads its map. side is the globe's width; index (dy + r) * side + (dx + r), r its
 *  radius. row is the map row, 0 the northmost; col is how many map columns east of the meridian through the globe's
 *  middle the pixel reads, wrapped into 0 to mapW - 1. Both are -1 off the disc. */
export interface GlobeTable { side: number; mapW: number; mapH: number; row: Int16Array; col: Int16Array }

/** The most steps of `stride` table values, `most` at most, whose sine times `scale` is not past `reach`. */
function stepsWithin(reach: number, scale: number, stride: number, most: number): number {
  let low = 0;
  let high = most;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if ((SINE[middle * stride] ?? 0) * scale <= reach * 65536) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * The table of a globe `width` pixels wide (odd, 3 to 511) reading a wrapped map mapW by mapH, leaning `tilt` whole
 * degrees: above 0 its north pole tips to the right, below 0 to the left, 90 at most either way.
 *
 * The map is the artist's: its columns are even in longitude all the way round, and its rows are even in latitude from
 * the north pole to the south. The globe is seen from over its equator, each pixel read at its middle, the ball's
 * radius the painter's disc's: half the width. A pixel is turned back by the lean; how far it then lies below the
 * middle is the sine of its latitude, and how far right, against the half-width of the ball at that height, the sine
 * of its longitude. The row and the column are the last table step whose sine is not past the pixel: no arcsine, and
 * whole numbers throughout. Distances are held in 4096ths of a pixel.
 */
export function globeTable(width: number, mapW: number, mapH: number, tilt: number): GlobeTable {
  if (!Number.isInteger(width) || width < 3 || width > WIDEST || (width & 1) === 0) throw new Error(`a globe is an odd number of pixels wide, from 3 to ${WIDEST}, not ${width}`);
  if (!Number.isInteger(tilt) || tilt < -90 || tilt > 90) throw new Error(`a globe leans a whole number of degrees, 90 at most either way, not ${tilt}`);
  const colStride = Number.isInteger(mapW) && mapW >= 4 && mapW <= SINE_TURN ? quotient(SINE_TURN, mapW) : 0;
  if (colStride * mapW !== SINE_TURN) throw new Error(`a map ${mapW} wide does not fit the sine table: its width divides ${SINE_TURN}`);
  const rowStride = Number.isInteger(mapH) && mapH >= 2 && mapH <= SINE_TURN >> 1 ? quotient(SINE_TURN >> 1, mapH) : 0;
  if (rowStride * mapH !== SINE_TURN >> 1) throw new Error(`a map ${mapH} high does not fit the sine table: its height divides ${SINE_TURN >> 1}`);
  const r = (width - 1) >> 1;
  const lean = Math.abs(tilt);
  const sine = tilt < 0 ? -(LEAN_SINE[lean] ?? 0) : LEAN_SINE[lean] ?? 0;
  const cosine = LEAN_SINE[90 - lean] ?? 0;
  const radius = width * 2048;
  const [quarter, half] = [mapW >> 2, mapH >> 1];
  const row = new Int16Array(width * width).fill(-1);
  const col = new Int16Array(width * width).fill(-1);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + r) continue;
      const i = (dy + r) * width + dx + r;
      const right = (dx * cosine + dy * sine) >> 4;
      const down = (dy * cosine - dx * sine) >> 4;
      const south = stepsWithin(Math.abs(down), radius, rowStride, half - 1);
      row[i] = down >= 0 ? half + south : half - 1 - south;
      const across = rootOf(Math.max(0, radius * radius - down * down));
      const east = stepsWithin(Math.abs(right), across, colStride, quarter - 1);
      col[i] = right >= 0 ? east : mapW - 1 - east;
    }
  }
  return { side: width, mapW, mapH, row, col };
}
