/* A new type's streams. A type draws only from streams it has declared: each is one pair of salts hashed with a
   seed, declared once, and never a pair the legacy game hashes with a world's, a star's or a moon's seed. So a new
   type cannot share a roll with anything the legacy game made, and no legacy number can move with it.

   The legacy game's pairs (LEGACY celestial-frontier.html; tools/census.mjs checks this list against its script):
   - every literal first salt it uses is refused whatever the second is;
   - a first salt under 0x400 is refused: there lie its counted salts (a planet's seed `i*101+7` 4036, a dwarf's
     `400+i` 4066, a moon's `m*17+5` 5321, a comet's `31+ci` 5340, a species slot's, the names' 3 and 7);
   - a second salt of 0x9A is refused: the rarity roll takes any first salt (4244). */
import { hashInt, mulberry32 } from '@cf/domain-rand';

/** Every literal first salt of a `hashInt` call in the legacy script. */
export const LEGACY_FIRST_SALTS: readonly number[] = Object.freeze([
  0x1A2D, 0x2E5, 0x33D, 0x5901, 0x5902, 0x5A91, 0x5C1, 0x5C2, 0x5EED, 0x5F0C, 0x6A2D, 0x7174, 0x77, 0x7E3D, 0x9E37,
  0xAB1, 0xAB2, 0xAB3, 0xAFF1, 0xB105, 0xB10E, 0xC05, 0xC0FF, 0xC1A, 0xE, 0xE1E, 0xE1F, 0xE8C, 0xE917, 0xF0,
]);

const LEGACY_COUNTED_BELOW = 0x400;
const LEGACY_RARITY_TAIL = 0x9A;

/** Whether the legacy game may hash this pair with a seed. */
export function isLegacyStream(a: number, b: number): boolean {
  return a < LEGACY_COUNTED_BELOW || b === LEGACY_RARITY_TAIL || LEGACY_FIRST_SALTS.includes(a);
}

/** A declared stream. Only `declareStream` makes one. */
export interface TypeStream {
  readonly owner: string;
  readonly a: number;
  readonly b: number;
}

const DECLARED = new Map<string, TypeStream>();
const STREAMS = new WeakSet<TypeStream>();

/** Declares a stream for its owner. Refused: a pair the legacy game uses, and a pair already declared. */
export function declareStream(owner: string, a: number, b: number): TypeStream {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 0xFFFFFFFF || b > 0xFFFFFFFF) {
    throw new RangeError('a stream is a pair of whole numbers from 0 through 0xFFFFFFFF');
  }
  if (isLegacyStream(a, b)) throw new Error(`${owner} cannot draw from 0x${a.toString(16)}/${b}: the legacy game draws there`);
  const taken = DECLARED.get(`${a}/${b}`);
  if (taken !== undefined) throw new Error(`${owner} cannot draw from 0x${a.toString(16)}/${b}: it is already ${taken.owner}'s`);
  const stream: TypeStream = Object.freeze({ owner, a, b });
  DECLARED.set(`${a}/${b}`, stream);
  STREAMS.add(stream);
  return stream;
}

/** Every stream declared so far, in the order declared. */
export function declaredStreams(): readonly TypeStream[] {
  return [...DECLARED.values()];
}

/** A type's own stream on a seed. */
export function ownStream(seed: number, stream: TypeStream): () => number {
  if (!STREAMS.has(stream)) throw new Error('a type draws only from a declared stream');
  return mulberry32(hashInt(seed >>> 0, stream.a, stream.b) >>> 0);
}

/** The first value of a type's own stream, in [0, 1). */
export function ownDraw(seed: number, stream: TypeStream): number {
  return ownStream(seed, stream)();
}
