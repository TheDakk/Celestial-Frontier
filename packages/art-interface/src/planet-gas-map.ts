/* A gas giant's map: the kit's drawings painted into one wrapped map by the world's plan, as the kit's rules paint
   it ("Painting the wrap"). Whole numbers throughout, on the globe's own sine table, as the kit states its winds:
   a map is the same on every device, and the kit's own for the same plan. */
import { GAS_HOOD, GAS_TURN, kitWhole, type GasPlan, type GasRibbon } from './planet-gas-plan';
import { SINE } from './planet-globe';
import { kitGrid, kitTable, type KitGrid, type PlanetKit } from './planet-kit';
import { squareMend } from './planet-mend';
import { quotient } from './planet-noise';

/** A composed map: w by h inks, 1 to 16, row-major from the north-west. */
export interface GasMap { w: number; h: number; values: Uint8Array }

/** One row of the 128, in the parts a wind's push is counted in. */
const UNIT = 128 * 65536;
/** The most a hand-made plan may ask of one number: every sum then stays a whole number held exactly. */
const MOST = 4096;

/** The sine of `tick` 768ths of a turn (0 or more), in 65536ths. */
function sineAt(tick: number): number {
  const part = tick % 768;
  const half = part % 384;
  const value = SINE[Math.min(half, 384 - half)] ?? 0;
  return part < 384 ? value : 0 - value;
}
/** floor(push * sine / 65536) for a push of 0 or more under 2^32 and a sine of 65536 at most either side of 0. */
function pushed(push: number, sine: number): number {
  const size = Math.abs(sine);
  const [high, low] = [(push >>> 16) * size, (push & 0xffff) * size];
  return sine >= 0 ? high + (low >>> 16) : 0 - high - ((low + 65535) >>> 16);
}

/** One line naming the first part of a plan the composer cannot paint, for a plan made by hand: a seed's plan has none. */
function refusePlan(plan: GasPlan): void {
  const whole = (n: number, least: number): boolean => Number.isInteger(n) && n >= least && n <= MOST;
  for (const ribbon of plan.ribbons) {
    if (!whole(ribbon.depth, 1) || !whole(ribbon.top, 0) || !whole(ribbon.phase, 0)) throw new Error(`the ribbon ${ribbon.name} of a gas plan has a depth of ${ribbon.depth} cells from cell ${ribbon.top}, shifted ${ribbon.phase}: a depth is 1 or more, and all three are whole numbers up to ${MOST}`);
  }
  for (const wind of plan.winds) {
    if (!whole(wind.radius, 1) || !whole(wind.amplitude, 0) || !whole(wind.frequency, 0) || !whole(wind.phase, 0) || !whole(wind.centre, 0)) throw new Error(`a wind of a gas plan has radius ${wind.radius}, height ${wind.amplitude}, ${wind.frequency} waves, phase ${wind.phase} about row ${wind.centre}: a radius is 1 or more, and all five are whole numbers up to ${MOST}`);
  }
  for (const event of plan.events) {
    if (!whole(event.width, 1) || !whole(event.height, 1) || !whole(event.longitude, 0) || !whole(event.latitude, 0)) throw new Error(`the ${event.kind} of a gas plan is ${event.width} by ${event.height} hundredths at ${event.longitude}, ${event.latitude}: a size is 1 or more, and all four are whole numbers up to ${MOST}`);
  }
}

/** A ribbon's drawing in a tier and its nominal depth in the drawing's rows. */
function ribbonSource(kit: PlanetKit, width: number, ribbon: GasRibbon): { grid: KitGrid; nominal: number } {
  const at = width === GAS_TURN ? 0 : 2;
  const own = kit.tables.get(`ribbon/${ribbon.name}`);
  if (own !== undefined) return { grid: kitGrid(kit, width, own[at] ?? ''), nominal: kitWhole(own[at + 1], `ribbon/${ribbon.name}`) };
  const rest = kitTable(kit, 'ribbons-else', 3);
  return { grid: kitGrid(kit, width, `${rest[0]}/${ribbon.name}-${ribbon.variant}`), nominal: kitWhole(rest[width === GAS_TURN ? 1 : 2], 'ribbons-else') };
}

/** A table of ink swaps ("8:11 7:2", after `skip` words) as a list: place i holds the ink that ink i becomes. All
 *  swaps of one table happen at once. */
function swaps(words: readonly string[] | undefined, skip: number, table: string, into: number[] = Array.from({ length: 17 }, (_, i) => i)): number[] {
  for (const word of (words ?? []).slice(skip)) {
    const [from, to] = word.split(':').map((part) => kitWhole(part, table));
    if (from === undefined || to === undefined || from < 1 || from > 16 || to < 1 || to > 16) throw new Error(`the gas kit's table "${table}" swaps "${word}": inks are 1 to 16`);
    into[from] = to;
  }
  return into;
}

/**
 * The plan painted at brush size, before the last step: a map 384 by 128 of one-pixel brush cells, or 96 by 32 of
 * cells that become 2 by 2 pixels of the map 192 wide. Ribbons are painted north to south, each over the last one's
 * margin; the winds move each column's rows; the hood and then the other weather are stamped on, where the winds
 * have carried their band. A wind's push on a row is eased from its middle to its reach in 256 steps and counted in
 * 65536ths of a row of the 128; a row moved is read at the nearest row, a half going to the even one.
 */
export function gasBrush(plan: GasPlan, kit: PlanetKit, width: number): GasMap {
  if (width !== GAS_TURN && width !== GAS_TURN >> 1) throw new Error(`a gas map is ${GAS_TURN} or ${GAS_TURN >> 1} wide, not ${width}`);
  const brush = width === GAS_TURN ? 1 : 2;
  const [w, h] = [GAS_TURN >> (2 * (brush - 1)), 128 >> (2 * (brush - 1))];
  const cell = h >> 5;
  refusePlan(plan);
  const night = (kit.tables.get('night') ?? []).includes(plan.family);
  let field = new Uint8Array(w * h);
  for (const ribbon of plan.ribbons) {
    const { grid, nominal } = ribbonSource(kit, width, ribbon);
    if (grid.w !== width) throw new Error(`the ribbon ${grid.name} is ${grid.w} wide in tier ${width}: a ribbon is a whole wrap`);
    const shift = brush * quotient(ribbon.phase * w, GAS_TURN);
    for (let y = 0; y < h; y++) {
      const along = (2 * y + 1 - 2 * cell * ribbon.top) * nominal + cell * ribbon.depth * (grid.h - nominal);
      if (along < 0) continue;
      const row = Math.min(grid.h - 1, quotient(along, 2 * cell * ribbon.depth));
      for (let x = 0; x < w; x++) {
        const from = (((brush * x - shift) % width) + width) % width;
        const ink = grid.values[row * width + (ribbon.mirror ? width - 1 - from : from)] ?? 0;
        if (ink !== 0) field[y * w + x] = ink;
      }
    }
  }
  if (field.includes(0)) throw new Error(`the ribbons of seed ${plan.seed} leave part of the map unpainted in tier ${width}`);

  // Where the winds have carried each brush cell's row, in UNITs of a brush row: its own row and their push.
  const displaced = new Float64Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) displaced[y * w + x] = y * UNIT;
  for (const wind of plan.winds) {
    const reach = 2 * h * wind.radius;
    const sines = Array.from({ length: w }, (_, x) => sineAt(wind.frequency * x * quotient(768, w) + 2 * wind.phase));
    for (let y = 0; y < h; y++) {
      const t = quotient(256 * Math.max(0, reach - Math.abs((2 * y + 1) * 128 - 2 * h * wind.centre)), reach);
      const push = ((t * t * (768 - 2 * t)) >> 8) * wind.amplitude;
      if (push !== 0) for (let x = 0; x < w; x++) displaced[y * w + x] = (displaced[y * w + x] ?? 0) + pushed(push, sines[x] ?? 0) * h;
    }
  }
  const blown = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Held within a row of the map's two edges first: past them the row read is the edge's either way.
      const at = Math.min(h * UNIT, Math.max(0 - UNIT, displaced[y * w + x] ?? 0));
      let from = at >> 23;
      const rest = 2 * (at - from * UNIT);
      if (rest > UNIT || (rest === UNIT && (from & 1) === 1)) from++;
      blown[y * w + x] = field[Math.min(h - 1, Math.max(0, from)) * w + x] ?? 0;
    }
  }
  field = blown;
  if (night) {
    const ribbonInks = swaps(kit.tables.get('night-ribbon'), 0, 'night-ribbon');
    for (let i = 0; i < field.length; i++) field[i] = ribbonInks[field[i] ?? 0] ?? 0;
  }

  const hoodFirst = [...plan.events.filter((event) => event.kind === GAS_HOOD), ...plan.events.filter((event) => event.kind !== GAS_HOOD)];
  for (const event of hoodFirst) {
    const table = kitTable(kit, `event/${event.kind}`);
    const stamp = kitGrid(kit, width, table[0] ?? '');
    const inks = swaps(table, 1, `event/${event.kind}`);
    if (night) swaps(kit.tables.get(`night-event/${event.kind}`), 0, `night-event/${event.kind}`, inks);
    const hood = event.kind === GAS_HOOD;
    const across = hood ? w : Math.max(3, quotient(stamp.w * event.width, 100 * brush));
    const down = Math.max(2, quotient(stamp.h * event.height, 100 * brush));
    const middle = quotient(event.longitude * w, GAS_TURN);
    // The row the winds have carried the event's latitude to, at its own column: the first of the nearest.
    const centre = quotient(event.latitude * h, 128);
    let [anchor, least] = [0, -1];
    for (let y = 0; y < h; y++) {
      const far = Math.abs((displaced[y * w + middle] ?? 0) - centre * UNIT);
      if (least < 0 || far < least) [anchor, least] = [y, far];
    }
    for (let j = 0; j < down; j++) {
      const y = hood ? j : anchor - (down >> 1) + j;
      if (y < 0 || y >= h) continue;
      const row = quotient(j * stamp.h, down);
      for (let i = 0; i < across; i++) {
        const column = quotient(i * stamp.w, across);
        const ink = stamp.values[row * stamp.w + (event.mirror ? stamp.w - 1 - column : column)] ?? 0;
        if (ink !== 0) field[y * w + ((((middle - (across >> 1) + i) % w) + w) % w)] = inks[ink] ?? ink;
      }
    }
  }
  return { w, h, values: field };
}

/**
 * A gas giant's finished map, 384 by 128 or 192 by 64, from its plan and its kit. Every pixel holds an ink from 1 to
 * 16 and sits in a 2 by 2 square of its own ink, a square across the seam counted: on the wide map the kit's last
 * step, the mend, sees to it (and `mended` says how many pixels it rewrote); on the narrow map every brush cell is a
 * square of 2 by 2 pixels. So nothing is one pixel wide or tall, and the map does not flicker as its globe turns.
 */
export function gasMap(plan: GasPlan, kit: PlanetKit, width: number): GasMap & { mended: number } {
  const brushed = gasBrush(plan, kit, width);
  if (brushed.w === width) return { ...brushed, mended: squareMend(brushed.values, brushed.w, brushed.h) };
  const [w, h] = [2 * brushed.w, 2 * brushed.h];
  const values = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) values[y * w + x] = brushed.values[(y >> 1) * brushed.w + (x >> 1)] ?? 0;
  return { w, h, values, mended: 0 };
}
