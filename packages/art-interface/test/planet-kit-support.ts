/* Kits for the tests. The test kit is made here, small in drawings and plainly ugly, to the kit format and rules:
   it is test input and stands for no artist's work. Of the art agent's gas kit the tests hold numbers only: its
   literal tables and the plans recorded from its generator. No test reads a folder outside this repository, and
   none of the kit's drawings is on this branch: the real kit is proved by hand (tools/check-planet-kit.mjs). */
import { readFileSync } from 'node:fs';
import { GAS_TABLES } from '../../../tools/planet-kit-pack.mjs';

const KEYS = '.123456789abcdefg';

/** A drawing made of 2 by 2 blocks, so it keeps the two-pixel rule: `ink(cx, cy)` gives each block's value. */
function blocks(w: number, h: number, ink: (cx: number, cy: number) => number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) row += KEYS[ink(x >> 1, y >> 1)];
    rows.push(row);
  }
  return rows;
}
const grid = (name: string, rows: string[]): string => [`grid ${name} ${rows[0]!.length} ${rows.length}`, ...rows].join('\n');

/** A whole-wrap ribbon `margin` rows above and below its `nominal` depth: a ragged clear top edge, a body of ink `a`
 *  with patches of ink `b`, each ribbon's patches in places of their own. */
function ribbon(w: number, nominal: number, margin: number, a: number, b: number, salt: number): string[] {
  return blocks(w, nominal + 2 * margin, (cx, cy) => {
    const top = (margin >> 1) - 1 - ((cx * 5 + salt) % 11 < 4 ? 2 : 0) - ((cx + salt) % 7 === 0 ? 1 : 0);
    if (cy < top) return 0;
    return (cx + salt * 3 + (cy >> 1)) % 13 < 4 && (cy + salt) % 5 < 2 ? b : a;
  });
}
/** A stamp: an oval of ink `a` with a middle of ink `b`, clear at its corners; or, `sided`, an oval whose west half
 *  is ink `a` and whose east half is ink `b`, so that it is not its own mirror image. */
function stamp(w: number, h: number, a: number, b: number, sided: boolean): string[] {
  const [mx, my] = [w >> 2, h >> 2];
  return blocks(w, h, (cx, cy) => {
    const [dx, dy] = [2 * cx + 1 - 2 * mx, 2 * cy + 1 - 2 * my];
    const far = dx * dx * my * my + dy * dy * mx * mx;
    if (far > 4 * mx * mx * my * my) return 0;
    if (sided) return dx < 0 ? a : b;
    return far <= 2 * mx * mx * my * my ? b : a;
  });
}

const TEST_RIBBONS: readonly (readonly [string, number, number])[] = [
  ['caps/north', 13, 14], ['caps/south', 16, 15], ['wide/silk', 5, 6], ['wide/underflow', 3, 4], ['zone/ice', 6, 5], ['zone/linen', 1, 5],
  ['made/sail-1', 6, 7], ['made/sail-2', 7, 6], ['belt/dawn', 2, 3], ['belt/copper', 3, 2], ['belt/festoon', 4, 2],
  ['made/scarp-1', 4, 3], ['made/scarp-2', 2, 4],
];
const TEST_STAMPS: readonly (readonly [string, number, number, number, number])[] = [
  ['storm/pearls', 48, 12, 7, 8], ['storm/barge', 40, 8, 4, 3], ['storm/hood', 384, 16, 14, 15], ['storm/squall', 36, 12, 7, 6],
  ['storm/fan', 44, 12, 8, 7], ['storm/comb', 52, 16, 7, 8], ['storm/banner', 60, 12, 8, 6],
];

/** The test kit's text. Three colour families, one of them the night's; five kinds of weather and two rare ones. */
export function testGasKitText(): string {
  const lines = [
    'kit 1 gas',
    'table families ember night frost',
    'table spreads 20 60 30',
    'table night night',
    'table skies/ember d7b779 c59965 b27a53 8b5d4d fff3d8 f8dfad ecc288 dba673 d58950 ba623d 914635 5c383a bfaa93 a18d80 816f70 5e5763',
    'table mineral/ember cba07f ae7952 925f42 714839 f7d7b1 eabc8c d79967 c78051 c65c42 9b443c 743437 4c2c32 a99287 8a7678 6d616b 504658',
    'table skies/night 403c50 302e40 242537 171925 c0cbd5 485469 374258 2c3245 866b63 4b3b45 332634 211c29 7a818f 4b4b5a 343444 212233',
    'table mineral/night 394953 29363c 202a31 181e26 c4cfc0 45595b 30444a 25353a 658282 354b56 253640 19232d 728486 454e53 333940 21272e',
    'table skies/frost 82abcc 6695bd 5179a3 415d86 e3f0ea c5e3e5 9dc8da 84abcf 6d9bc2 4b71a1 374c7d 2c345b a5c6d4 859eb9 687e9c 495975',
    'table mineral/frost 8aaedc 668dc3 4c69a4 3b548a d6eafa b6d6f3 95b9e7 7b9cd6 626aad 4c5397 373f7b 272e58 b4b9cc 8997ba 667ba1 485d80',
    'table bright ice linen sail',
    'table belt dawn copper',
    'table active festoon scarp',
    'table ribbon/north caps/north 32 caps/north 64',
    'table ribbon/south caps/south 32 caps/south 64',
    'table ribbon/silk wide/silk 32 wide/silk 64',
    'table ribbon/underflow wide/underflow 32 wide/underflow 64',
    'table ribbon/ice zone/ice 32 zone/ice 64',
    'table ribbon/linen zone/linen 32 zone/linen 64',
    'table ribbon/dawn belt/dawn 32 belt/dawn 64',
    'table ribbon/copper belt/copper 32 belt/copper 64',
    'table ribbon/festoon belt/festoon 32 belt/festoon 64',
    'table ribbons-else made 32 64',
    'table weather pearls dark-barge polar-hood squall-line cloud-fan',
    'table rare breaking-comb banner-front',
    'table deep-hosts pearls cloud-fan banner-front',
    'table event/pearls storm/pearls 8:9',
    'table event/dark-barge storm/barge 3:10',
    'table event/polar-hood storm/hood',
    'table event/squall-line storm/squall',
    'table event/cloud-fan storm/fan 8:11 7:2',
    'table event/breaking-comb storm/comb',
    'table event/banner-front storm/banner',
    'table night-ribbon 5:13',
    'table night-event/pearls 6:5',
    'table night-event/cloud-fan 6:5',
    'table night-event/dark-barge 7:5',
    'table night-event/squall-line 6:5',
  ];
  for (const [width, nominal, margin, scale] of [[384, 32, 12, 1], [192, 64, 24, 2]] as const) {
    lines.push(`tier ${width}`);
    TEST_RIBBONS.forEach(([name, a, b], salt) => lines.push(grid(name, ribbon(width, nominal, margin, a, b, salt + 1))));
    for (const [name, w, h, a, b] of TEST_STAMPS) lines.push(grid(name, name === 'storm/hood' ? ribbon(width, 16 >> (scale - 1), 0, a, b, 3) : stamp(w >> (scale - 1), Math.max(4, h >> (scale - 1)), a, b, name === 'storm/banner')));
  }
  return lines.join('\n');
}

/** The gas kit's literal tables alone, as a kit with no drawing: its colours, names and lists, enough to plan a
 *  world and not to paint one. The kit's drawings are the art agent's and are never on this branch. */
export const gasTablesText = (): string => ['kit 1 gas', ...GAS_TABLES].join('\n');
/** The kit's own generator's plans as recorded (tools/record-planet-kit.mjs), by seed. */
export const recordedPlans = (): Record<string, { ramps: string[] } & Record<string, unknown>> => (JSON.parse(readFileSync(new URL('../../../fixtures/art/planet-gas-plans-v1.json', import.meta.url), 'utf8')) as { plans: Record<string, { ramps: string[] } & Record<string, unknown>> }).plans;
