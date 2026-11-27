/* A planet kit is the artist's own drawings and literal tables, packed into one text a type:

     kit 1 gas
     table bright ice linen veil
     tier 384
     grid discovery/silk 384 56
     <56 rows of 384 characters, one a pixel>

   A table is a name and its words, in the artist's order. A tier is a map width; the grids after it are that tier's.
   A grid's rows hold one key a pixel: `.` is clear, and each other key is an ink of its type. A name given twice in a
   tier is the later drawing: the artist's load order, in which the last name wins. */

import { thinPixels } from './planet-mend';

/** The keys of each type's inks in order, clear first: a grid's value is its key's place here. */
const KIT_KEYS: ReadonlyMap<string, string> = new Map([
  ['gas', '.123456789abcdefg'],
  ['terran', '.abcdefghijklmnopqrstuvwxABCDEFGHIJKL'],
]);

/** One drawing: w by h values, row-major from the north-west, 0 clear. `thin` is how many of its pixels sit in no
 *  like 2 by 2 square (a drawing as wide as its tier wraps; any other does not): a measure of the drawing for its
 *  artist, and no refusal. The two-pixel rule is kept on the finished map, whatever its drawings hold. */
export interface KitGrid { name: string; w: number; h: number; values: Uint8Array; thin: number }
export interface PlanetKit { type: string; keys: string; tables: Map<string, readonly string[]>; tiers: Map<number, Map<string, KitGrid>> }

const WHOLE = /^[1-9][0-9]{0,3}$/;

/**
 * Reads a kit. Throws one line naming the fault: a first line that is not "kit 1" and a type there is, a line that is
 * none of the four kinds, a table with no name, a grid before any tier, a grid with a row short, long or missing, a
 * key its type does not have.
 */
export function parsePlanetKit(text: string): PlanetKit {
  const lines = text.split('\n');
  const head = (lines[0] ?? '').split(' ');
  const keys = KIT_KEYS.get(head[2] ?? '');
  if (head.length !== 3 || head[0] !== 'kit' || head[1] !== '1' || keys === undefined) throw new Error(`a kit begins "kit 1" and its type (${[...KIT_KEYS.keys()].join(', ')}), not "${(lines[0] ?? '').slice(0, 40)}"`);
  const kit: PlanetKit = { type: head[2] ?? '', keys, tables: new Map(), tiers: new Map() };
  let tier: Map<string, KitGrid> | undefined;
  let width = 0;
  for (let at = 1; at < lines.length; at++) {
    const line = lines[at] ?? '';
    if (line === '') continue;
    const words = line.split(' ');
    if (words[0] === 'table' && words.length >= 2 && words[1] !== '') {
      kit.tables.set(words[1] ?? '', words.slice(2));
    } else if (words[0] === 'tier' && words.length === 2 && WHOLE.test(words[1] ?? '')) {
      width = Number(words[1]);
      tier = kit.tiers.get(width) ?? new Map<string, KitGrid>();
      kit.tiers.set(width, tier);
    } else if (words[0] === 'grid' && words.length === 4 && WHOLE.test(words[2] ?? '') && WHOLE.test(words[3] ?? '')) {
      const name = words[1] ?? '';
      if (tier === undefined) throw new Error(`line ${at + 1}: the grid ${name} comes before any tier`);
      const [w, h] = [Number(words[2]), Number(words[3])];
      const values = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) {
        const row = lines[at + 1 + y];
        if (row === undefined || row.length !== w) throw new Error(`line ${at + 2 + y}: row ${y + 1} of the grid ${name} is ${row === undefined ? 'missing' : `${row.length} wide`}: the grid is ${w} by ${h}`);
        for (let x = 0; x < w; x++) {
          const value = keys.indexOf(row[x] ?? '');
          if (value < 0) throw new Error(`line ${at + 2 + y}: the grid ${name} uses the key "${row[x]}", which a ${kit.type} kit does not have`);
          values[y * w + x] = value;
        }
      }
      tier.set(name, { name, w, h, values, thin: thinPixels(values, w, h, w === width) });
      at += h;
    } else {
      throw new Error(`line ${at + 1}: not a table, a tier or a grid: "${line.length > 40 ? `${line.slice(0, 40)}...` : line}"`);
    }
  }
  return kit;
}

/** A kit's table by name, or one line saying it is missing or shorter than `least` words. */
export function kitTable(kit: PlanetKit, name: string, least = 1): readonly string[] {
  const table = kit.tables.get(name);
  if (table === undefined || table.length < least) throw new Error(`the ${kit.type} kit has no table "${name}" of ${least} or more words`);
  return table;
}

/** A tier's drawing by name, or one line saying which is missing. */
export function kitGrid(kit: PlanetKit, tier: number, name: string): KitGrid {
  const grid = kit.tiers.get(tier)?.get(name);
  if (grid === undefined) throw new Error(`the ${kit.type} kit has no drawing "${name}" in tier ${tier}`);
  return grid;
}
