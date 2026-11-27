/* A gas giant's plan by the gas kit's rules (its zonal edition): the seed draws a colour family and its sixteen
   swatches, a stack of ribbons north to south over 32 latitude cells, the winds that bend them and the weather laid
   on them. The kit states its colour sums in fractions; here they are worked exactly in whole numbers, so a plan is
   the same on every device. Names the rules give a part of their own are fixed here (the two caps, the wide zone and
   the wide belt, the hood); every other name and colour is the kit's. */
import { kitTable, type PlanetKit } from './planet-kit';
import { quotient } from './planet-noise';

/** One band of the stack: its drawing's name and which of two drawings, its first latitude cell and its depth in
 *  cells (32 from pole to pole), how many 384ths of a turn it is shifted east, and whether it is mirrored. */
export interface GasRibbon { name: string; kind: 'cap' | 'light' | 'deep'; variant: number; top: number; depth: number; phase: number; mirror: boolean }
/** A wave in the winds, on the 384 by 128 map: the row it is strongest at and how far it reaches, how many waves it
 *  makes round the globe, its height in rows and its phase in 384ths of a turn. */
export interface GasWind { centre: number; radius: number; frequency: number; amplitude: number; phase: number }
/** A piece of weather: its kind, its middle on the 384 by 128 map, its width and height in hundredths of its
 *  drawing's, and whether it is mirrored. */
export interface GasEvent { kind: string; longitude: number; latitude: number; width: number; height: number; mirror: boolean }
export interface GasPlan {
  seed: number; family: string; profile: 'quiet' | 'fine' | 'broad' | 'wild';
  /** The world's sixteen colours (0xRRGGBB), ink 1 first: body, high cloud, jet and cap, four each, light to dark. */
  swatches: number[];
  ribbons: GasRibbon[]; winds: GasWind[]; events: GasEvent[];
}
const CAP_NORTH = 'north';
const CAP_SOUTH = 'south';
const WIDE_ZONE = 'silk';
const WIDE_BELT = 'underflow';
const ICE = 'ice';
/** The kind of weather that lies along the whole north edge. */
export const GAS_HOOD = 'polar-hood';
const PROFILES = ['quiet', 'quiet', 'quiet', 'quiet', 'fine', 'fine', 'broad', 'broad', 'wild'] as const;
const COUNTS = { quiet: [5, 4], fine: [8, 3], broad: [3, 2], wild: [5, 4] } as const;
const EVENT_COUNTS = [1, 2, 2, 3, 3, 3, 4, 5] as const;
/** The parts of a turn a gas plan counts longitude in: the wide map's columns. */
export const GAS_TURN = 384;

/** The kit's sequence of draws: `take(n)` is the next whole number from 0 to n - 1 (n under 65536). */
function dice(seed: number): (limit: number) => number {
  let state = seed >>> 0;
  return (limit) => {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
    z = (z ^ (z >>> 15)) >>> 0;
    return ((z >>> 16) * limit + (((z & 0xffff) * limit) >>> 16)) >>> 16;
  };
}

/** floor(a / b) for a of 0 or more and b of 1 or more, of any size. */
function wideQuotient(a: bigint, b: bigint): bigint {
  let bits = 0n;
  while (b << (bits + 1n) <= a) bits++;
  let [rest, q] = [a, 0n];
  for (let bit = bits; bit >= 0n; bit--) {
    if (b << bit > rest) continue;
    rest -= b << bit;
    q |= 1n << bit;
  }
  return q;
}
/** a over b to the nearest whole number, a half going to the even one. */
function nearest(a: bigint, b: bigint): number {
  const q = wideQuotient(a, b);
  const twice = 2n * (a - q * b);
  return Number(twice > b || (twice === b && (q & 1n) === 1n) ? q + 1n : q);
}

const channels = (rgb: number): [number, number, number] => [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255];

/**
 * One swatch by the kit's rule: its two ends mixed `blend` hundredths of the way from the first to the second; the
 * mix taken to hue, saturation and lightness; its hue turned `quarters` quarter degrees, its saturation multiplied by
 * `chroma` hundredths and held to nine tenths, its lightness moved `exposure` hundredths and held between 0.06 and
 * 0.985; and back, each channel to the nearest byte, a half to the even one. Worked as exact fractions: a channel of
 * the mix counts 25500ths, a lightness 51000ths, and a hue 1440ths of a turn for each part of the mix's spread.
 */
function swatch(sky: number, mineral: number, blend: number, quarters: number, chroma: number, exposure: number): number {
  const [a, b] = [channels(sky), channels(mineral)];
  const mix = a.map((part, i) => part * (100 - blend) + (b[i] ?? 0) * blend);
  const [red, green, blue] = [mix[0] ?? 0, mix[1] ?? 0, mix[2] ?? 0];
  const [most, least] = [Math.max(red, green, blue), Math.min(red, green, blue)];
  const [spread, sum] = [most - least, most + least];
  const light = Math.min(50235, Math.max(3060, sum + 510 * exposure));
  if (spread === 0) {
    const grey = nearest(BigInt(255 * light), 51000n);
    return (grey << 16) | (grey << 8) | grey;
  }
  let [sn, sd] = [spread * chroma, 100 * (sum <= 25500 ? sum : 51000 - sum)];
  if (10 * sn > 9 * sd) [sn, sd] = [9, 10];
  const sixths = most === red ? green - blue : most === green ? 2 * spread + blue - red : 4 * spread + red - green;
  const turn = 1440 * spread;
  const hue = (((240 * sixths + quarters * spread) % turn) + turn) % turn;
  const near = 2 * light <= 51000 ? light : 51000 - light;
  const base = (BigInt(light) * BigInt(sd) - BigInt(sn) * BigInt(near)) * BigInt(turn);
  const reach = 2n * BigInt(sn) * BigInt(near);
  const under = BigInt(sd) * 51000n * BigInt(turn);
  const channel = (third: number): number => {
    const at = (hue + third * (turn - quotient(turn, 3))) % turn;
    const part = 6 * at < turn ? 6 * at : 2 * at < turn ? turn : 3 * at < 2 * turn ? 4 * turn - 6 * at : 0;
    return nearest(255n * (base + reach * BigInt(part)), under);
  };
  // Red reads a third of a turn on, blue a third back: two thirds on.
  return (channel(2) << 16) | (channel(0) << 8) | channel(1);
}

const hex = (word: string, table: string): number => {
  if (!/^[0-9a-f]{6}$/.test(word)) throw new Error(`the gas kit's table "${table}" holds "${word}", which is no colour`);
  return Number.parseInt(word, 16);
};
export const kitWhole = (word: string | undefined, table: string): number => {
  if (word === undefined || !/^[0-9]{1,4}$/.test(word)) throw new Error(`the gas kit's table "${table}" holds "${word ?? ''}", which is no whole number`);
  return Number(word);
};

/**
 * A gas giant's plan from its seed (a whole number, read as 32 bits) and its kit's tables, by the kit's rules in the
 * kit's order of draws. Every draw the rules take is taken, also the ones whose answer is not used (a variant for a
 * ribbon with one drawing), so the plan is the artist's for the same seed. The Great Red Spot is in no seed's plan.
 */
export function gasPlan(seed: number, kit: PlanetKit): GasPlan {
  if (kit.type !== 'gas') throw new Error(`a gas giant is planned from a gas kit, not a ${kit.type} kit`);
  const key = seed >>> 0;
  const families = kitTable(kit, 'families', 2);
  const [bright, belt, active] = [kitTable(kit, 'bright'), kitTable(kit, 'belt'), kitTable(kit, 'active')];
  const weather = kitTable(kit, 'weather', EVENT_COUNTS[EVENT_COUNTS.length - 1]);
  const rare = kitTable(kit, 'rare', 2);
  const deepHosts = new Set(kitTable(kit, 'deep-hosts', 0));

  // The colour family: each aligned block of as many seeds as there are families holds each family once.
  const block = quotient(key >>> 1, families.length) * 2 + quotient(((key >>> 1) % families.length) * 2 + (key & 1), families.length);
  const slot = (((key >>> 1) % families.length) * 2 + (key & 1)) % families.length;
  const bag = [...families];
  const shuffle = dice((block ^ 0x57696e64) >>> 0);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = shuffle(i + 1);
    [bag[i], bag[j]] = [bag[j] ?? '', bag[i] ?? ''];
  }
  const family = bag[slot] ?? '';
  const blend = dice((key ^ 0xa1b2c3d4) >>> 0)(101);

  const take = dice(key);
  const pick = <T>(items: readonly T[]): T => items[take(items.length)] as T;
  const spread = kitWhole(kitTable(kit, 'spreads', families.length)[families.indexOf(family)], 'spreads');
  const tint = take(2 * spread + 1) - spread;
  const accent = take(81) - 40;
  const chroma = 76 + take(57);
  const exposure = take(11) - 5;
  const [skies, mineral] = [kitTable(kit, `skies/${family}`, 16), kitTable(kit, `mineral/${family}`, 16)];
  const swatches = Array.from({ length: 16 }, (_, i) => swatch(hex(skies[i] ?? '', `skies/${family}`), hex(mineral[i] ?? '', `mineral/${family}`), blend,
    4 * tint + ([0, -accent, 4 * accent, 2 * accent][i >> 2] ?? 0), chroma, exposure));

  const profile = pick(PROFILES);
  const [fewest, more] = COUNTS[profile];
  const count = fewest + take(more);
  const [north, south] = [2 + take(3), 2 + take(3)];
  const weights = Array.from({ length: count }, () => 2 + take(4));
  if (profile !== 'fine') {
    const heavy = take(count);
    weights[heavy] = (weights[heavy] ?? 0) + 7 + take(10);
  }
  const spare = 32 - north - south - 2 * count;
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const depths: number[] = [];
  let [before, edge] = [0, 0];
  for (const weight of weights) {
    before += weight;
    const next = quotient(spare * before, total);
    depths.push(2 + next - edge);
    edge = next;
  }
  // A band too deep hands a cell at a time to the shallowest other band, the nearest of them, the northmost of those.
  const limit = profile === 'broad' ? 12 : 10;
  for (let i = 0; i < count; i++) {
    while ((depths[i] ?? 0) > limit) {
      let to = -1;
      for (let j = 0; j < count; j++) {
        if (j === i) continue;
        const [d, best] = [depths[j] ?? 0, depths[to] ?? 0];
        if (to < 0 || d < best || (d === best && Math.abs(i - j) < Math.abs(i - to))) to = j;
      }
      depths[i] = (depths[i] ?? 0) - 1;
      depths[to] = (depths[to] ?? 0) + 1;
    }
  }
  const parity = take(2);
  const ribbons: GasRibbon[] = [{ name: CAP_NORTH, kind: 'cap', variant: 0, top: 0, depth: north, phase: 0, mirror: false }];
  let top = north;
  depths.forEach((depth, i) => {
    const light = i % 2 === parity;
    ribbons.push({ name: pick(light ? bright : belt), kind: light ? 'light' : 'deep', variant: 0, top, depth, phase: 0, mirror: false });
    top += depth;
  });
  ribbons.push({ name: CAP_SOUTH, kind: 'cap', variant: 0, top, depth: south, phase: 0, mirror: false });

  const winds: GasWind[] = [];
  const deep = ribbons.filter((ribbon) => ribbon.kind === 'deep');
  const stirred = profile === 'wild' ? deep.length : Math.min(deep.length, 1 + take(2));
  for (let n = 0; n < stirred; n++) {
    const [band] = deep.splice(take(deep.length), 1);
    if (band === undefined) break;
    band.name = pick(active);
    winds.push({ centre: 4 * band.top + 2 * band.depth, radius: 15 + 2 * band.depth, frequency: 1 + take(3), amplitude: 3 + take(5), phase: take(GAS_TURN) });
  }
  if (profile === 'wild') winds.push({ centre: 64, radius: 96, frequency: 2 + take(2), amplitude: 7 + take(5), phase: take(GAS_TURN) });
  for (const ribbon of ribbons) {
    if (ribbon.depth >= 6 && ribbon.kind === 'light' && ribbon.name !== ICE) ribbon.name = WIDE_ZONE;
    if (ribbon.depth >= 5 && ribbon.kind === 'deep' && profile !== 'wild') ribbon.name = WIDE_BELT;
    ribbon.variant = 1 + take(2);
    ribbon.phase = take(GAS_TURN);
    ribbon.mirror = take(2) === 1;
  }

  const events: GasEvent[] = [];
  const eventCount = pick(EVENT_COUNTS);
  const kinds = [...weather];
  const [score, place] = [quotient(key >>> 2, 5), ((key >>> 2) % 5) * 4 + (key & 3)];
  const isRare = place === dice((score ^ 0x536b7921) >>> 0)(20);
  const start = 64 + take(49);
  const rank = (ribbon: GasRibbon): number => ribbon.depth * 4 - Math.abs(2 * ribbon.top + ribbon.depth - 32);
  for (let i = 0; i < eventCount; i++) {
    const kind = i === 0 && isRare ? rare[(score & 1) ^ dice(((score >>> 1) ^ 0xc10d5) >>> 0)(2)] ?? '' : pick(kinds);
    if (kinds.includes(kind)) kinds.splice(kinds.indexOf(kind), 1);
    const role = deepHosts.has(kind) ? 'deep' : 'light';
    const hosts = ribbons.filter((ribbon) => ribbon.kind === role);
    const lead = i === 0 || (i === 1 && events[0]?.kind === GAS_HOOD);
    // The opening event takes the deepest host nearest the equator, the northmost on a tie; the others draw theirs.
    let host = hosts[0];
    if (lead) { for (const ribbon of hosts) if (host === undefined || rank(ribbon) > rank(host)) host = ribbon; } else host = pick(hosts);
    if (host === undefined) throw new Error(`a gas plan has no ${role} band to carry its ${kind}`);
    if (lead && deepHosts.has(kind) && profile !== 'wild') host.name = WIDE_BELT;
    const longitude = (start + quotient(i * GAS_TURN, eventCount) + (i === 0 ? 0 : take(25) - 12)) % GAS_TURN;
    events.push({ kind, longitude, latitude: 4 * host.top + 2 * host.depth, width: 94 + take(42), height: 100 + take(48), mirror: take(2) === 1 });
  }
  // A hood shows through the whole turn: the events after it share the turn among themselves.
  if (events[0]?.kind === GAS_HOOD) events.slice(1).forEach((event, j) => { event.longitude = (start + quotient(j * GAS_TURN, eventCount - 1)) % GAS_TURN; });
  return { seed: key, family, profile, swatches, ribbons, winds, events };
}
