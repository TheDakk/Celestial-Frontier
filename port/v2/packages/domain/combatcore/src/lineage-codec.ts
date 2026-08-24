/* D-CFB-1 — versioned creature code with bounded parent-lineage continuity.

   Legacy `CFB-` remains the v1 challenger/exhibit codec and deliberately
   strips `parents` as anti-cheat hardening. It cannot truthfully carry a bred
   companion or deterministic audio lineage. `CFB2-` is the explicit owned-
   creature compatibility boundary: it keeps the same normalized genome/name
   behavior, then restores only one ordered pair of uint32 parent seeds. No
   mutable XP, feeding, injury, bond, assignment, or brood state travels. */
import { b64decUtf8, b64encUtf8 } from '@cf/domain-encutil';
import { cleanName } from '@cf/domain-strays';
import { normGenome } from './combatcore.verbatim.js';
import type { Genome } from '@cf/domain-genome';

export const LINEAGE_CREATURE_CODE_PREFIX = 'CFB2-';
const MAX_CODE_LENGTH = 8_192;

export type ParentSeedTuple = readonly [number, number];

export interface LineageCreatureEntry {
  readonly name: string;
  readonly genome: Genome;
}

function uint32(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 0xFFFF_FFFF
    ? (value as number) >>> 0
    : null;
}

/** Preserve exact parent order. Reversed parents describe a different
 * lineage input even when the child phenotype happens to match. */
export function normalizeParentSeedTuple(value: unknown): ParentSeedTuple | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const left = uint32(value[0]), right = uint32(value[1]);
  return left === null || right === null ? null : Object.freeze([left, right] as const);
}

export function encodeLineageCreature(entry: LineageCreatureEntry): string {
  if (!entry || typeof entry !== 'object' || !entry.genome) throw new TypeError('lineage creature entry is required');
  const genome = normGenome(entry.genome as unknown as Record<string, unknown>) as Genome;
  delete genome.fed;
  delete genome.brood;
  delete (genome as Record<string, unknown>).hurt;
  const parents = normalizeParentSeedTuple(entry.genome.parents);
  if (parents !== null) genome.parents = [...parents];
  /* `normGenome` already removes mutable/exhibit fields. The separate `p`
     carrier makes lineage ownership explicit and lets decode reject a body
     whose embedded tuple disagrees with its versioned witness. */
  const body = JSON.stringify({ v: 2, g: genome, n: cleanName(entry.name), p: parents });
  return LINEAGE_CREATURE_CODE_PREFIX
    + b64encUtf8(body).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export function decodeLineageCreature(code: string): LineageCreatureEntry | null {
  try {
    const raw = String(code ?? '').trim();
    if (raw.length > MAX_CODE_LENGTH || !raw.startsWith(LINEAGE_CREATURE_CODE_PREFIX)) return null;
    let encoded = raw.slice(LINEAGE_CREATURE_CODE_PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    while (encoded.length % 4) encoded += '=';
    const body = JSON.parse(b64decUtf8(encoded)) as Record<string, unknown>;
    if (!body || body.v !== 2 || !body.g || typeof body.g !== 'object') return null;
    const source = body.g as Record<string, unknown>;
    const seed = uint32(source.seed);
    if (seed === null) return null;
    const parents = body.p === null ? null : normalizeParentSeedTuple(body.p);
    if (body.p !== null && parents === null) return null;
    const embedded = source.parents === undefined ? null : normalizeParentSeedTuple(source.parents);
    if ((parents === null) !== (embedded === null)
      || (parents !== null && embedded !== null
        && (parents[0] !== embedded[0] || parents[1] !== embedded[1]))) return null;
    const genome = normGenome(source) as Genome;
    delete genome.fed;
    delete genome.brood;
    delete (genome as Record<string, unknown>).hurt;
    if (parents !== null) genome.parents = [...parents];
    return Object.freeze({
      name: cleanName(typeof body.n === 'string' ? body.n : '') || 'Companion',
      genome: Object.freeze(genome),
    });
  } catch { return null; }
}
