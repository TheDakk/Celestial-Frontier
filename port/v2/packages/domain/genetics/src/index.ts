/* @cf/domain-genetics — MODULE 11 of 14 (typed facade over the auto-lift). */
import {
  crossGenome as crossGenomeVerbatim,
  evolveGenome,
} from './genetics.verbatim.js';

export { evolveGenome };

type Genome = Parameters<typeof crossGenomeVerbatim>[0] & Record<string, unknown>;
type Lineage = { name: string; kingdom: string; field: '_earthName' | '_earthBlend' };

/* A bare Earth name is not a complete lineage identity: four names occur in
   two catalogues, and a mixed-kingdom child may inherit a kingdom unrelated to
   the Earth parent whose anatomy it retains. The lifted implementation remains
   byte-verbatim; this facade carries the selected set through its existing
   deterministic name pick. */
const LINEAGE_TOKEN = '\u0000cf-lineage-v1:';
const EARTH_KINGDOMS = new Set(['fauna', 'flora', 'fungi', 'microbe']);

function lineageOf(parent: Genome): Lineage | null {
  const earthName = typeof parent._earthName === 'string' && parent._earthName
    ? parent._earthName : '';
  const blend = typeof parent._earthBlend === 'string' && parent._earthBlend
    ? parent._earthBlend : '';
  const name = earthName || blend;
  if (!name) return null;
  const recorded = !earthName && typeof parent._earthBlendKingdom === 'string'
    ? parent._earthBlendKingdom : '';
  const inherited = EARTH_KINGDOMS.has(recorded) ? recorded : String(parent.kingdom || '');
  return {
    name,
    kingdom: EARTH_KINGDOMS.has(inherited) ? inherited : 'fauna',
    field: earthName ? '_earthName' : '_earthBlend',
  };
}

function tokenFor(lineage: Lineage): string {
  return LINEAGE_TOKEN + JSON.stringify([lineage.kingdom, lineage.name]);
}

function encodedParent(parent: Genome, lineage: Lineage | null): Genome {
  if (!lineage) return parent;
  return { ...parent, [lineage.field]: tokenFor(lineage) } as Genome;
}

function decodeLineage(value: unknown): { kingdom: string; name: string } | null {
  if (typeof value !== 'string' || !value.startsWith(LINEAGE_TOKEN)) return null;
  try {
    const decoded: unknown = JSON.parse(value.slice(LINEAGE_TOKEN.length));
    if (!Array.isArray(decoded) || decoded.length !== 2
      || typeof decoded[0] !== 'string' || !EARTH_KINGDOMS.has(decoded[0])
      || typeof decoded[1] !== 'string' || !decoded[1]) return null;
    return { kingdom: decoded[0], name: decoded[1] };
  } catch {
    return null;
  }
}

/** Preserve the selected Earth parent's exact catalogue owner without changing
 * the lifted RNG stream. The temporary set-qualified token participates only
 * in the verbatim lineage-name pick; it is decoded before the child escapes. */
export function crossGenome(
  a: Parameters<typeof crossGenomeVerbatim>[0],
  b: Parameters<typeof crossGenomeVerbatim>[1],
): ReturnType<typeof crossGenomeVerbatim> {
  const parentA = a as Genome;
  const parentB = b as Genome;
  const lineageA = lineageOf(parentA);
  const lineageB = lineageOf(parentB);
  const child = crossGenomeVerbatim(
    encodedParent(parentA, lineageA),
    encodedParent(parentB, lineageB),
  ) as ReturnType<typeof crossGenomeVerbatim> & Record<string, unknown>;
  const selected = decodeLineage(child._earthBlend);
  if (selected) {
    child._earthBlend = selected.name;
    child._earthBlendKingdom = selected.kingdom;
  }
  return child;
}
