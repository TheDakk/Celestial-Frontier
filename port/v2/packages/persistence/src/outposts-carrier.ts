/* Outposts P2 — the v5 extension namespace `arc9.projects` v1 in the `player` segment (D14; N4 §5 P2).

   Absent ⇒ no projects (an old save loads unchanged; no migration). The carrier is canonical JSON checked field by field: any
   malformed, reordered or out-of-bounds carrier, a future version, or the namespace in another segment reads as PROTECTED, never as
   "no projects" (a lost carrier must not silently re-open refunds or slots). It rides the portable v5 export like every namespace. */
import { canonicalJson, canonicalizeData, type CanonicalJsonObject } from '@cf/domain-acquisition';
import { V5_SEGMENTS, canonicalizeV5Extensions, type V5ExtensionWrite, type V5Extensions } from './migration-v5.js';
import {
  EMPTY_OUTPOST_PROJECTS_V1,
  OUTPOST_SANCTUARY_RESIDENTS_MAX_V1,
  OUTPOST_TOTAL_MAX_V1,
  isOutpostKindV1,
  outpostSiteIdV1,
  type OutpostProjectsStateV1,
  type OutpostSiteV1,
} from './outposts.js';

export const OUTPOST_PROJECTS_NAMESPACE_V1 = 'arc9.projects' as const;
export const OUTPOST_PROJECTS_SCHEMA_V1 = 'cf-v2-outpost-projects/v1' as const;
const VERSION = 1 as const;

export type OutpostProjectsReadV1 =
  | Readonly<{ kind: 'loaded'; state: OutpostProjectsStateV1; present: boolean }>
  | Readonly<{ kind: 'protected'; reason: 'wrong-segment' | 'corrupt' | 'future-version' }>;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const keysAre = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).sort().join(',') === [...keys].sort().join(',');
const u32 = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= 0xffffffff;
const count = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0;
const clock = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0;
const shortId = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 64;

function checkedSite(v: unknown): OutpostSiteV1 | null {
  if (!isObj(v) || !keysAre(v, ['id', 'kind', 'world', 'built', 'openedAtMs', 'baseline', 'finishedAtMs', 'spent', 'residents'])) return null;
  if (!isOutpostKindV1(v.kind) || ![0, 1, 2, 3].includes(v.built as number) || !clock(v.openedAtMs)) return null;
  const w = v.world;
  if (!isObj(w) || !keysAre(w, ['galaxySeed', 'starSeed', 'planetSeed', 'name', 'systemPlanetSeeds'])) return null;
  if (!u32(w.galaxySeed) || !u32(w.starSeed) || !u32(w.planetSeed) || typeof w.name !== 'string' || w.name.length < 1 || w.name.length > 64) return null;
  const sys = w.systemPlanetSeeds;
  if (!Array.isArray(sys) || sys.length > 64 || !sys.every(u32) || !sys.includes(w.planetSeed) || new Set(sys).size !== sys.length
    || sys.some((s, i) => i > 0 && (sys[i - 1] as number) >= (s as number))) return null;
  if (v.id !== outpostSiteIdV1(v.kind, w.planetSeed as number)) return null;
  const b = v.baseline;
  if (!isObj(b) || !keysAre(b, ['landings', 'systemLanded', 'fed']) || !count(b.landings) || !count(b.fed)) return null;
  const sl = b.systemLanded;
  if (!Array.isArray(sl) || !sl.every((s) => sys.includes(s)) || new Set(sl).size !== sl.length
    || sl.some((s, i) => i > 0 && (sl[i - 1] as number) >= (s as number))) return null;
  const built = v.built as number;
  if (built === 3 ? !clock(v.finishedAtMs) : v.finishedAtMs !== null) return null;
  const spent = v.spent;
  if (!Array.isArray(spent) || spent.length !== built) return null;
  for (let i = 0; i < spent.length; i++) {
    const row = spent[i];
    if (!isObj(row) || !keysAre(row, ['stage', 'items', 'stardust']) || row.stage !== i + 1 || !count(row.stardust)) return null;
    if (!Array.isArray(row.items) || row.items.length > 16) return null;
    for (const item of row.items) if (!Array.isArray(item) || item.length !== 2 || !shortId(item[0]) || !Number.isSafeInteger(item[1]) || (item[1] as number) < 1) return null;
  }
  const res = v.residents;
  if (!Array.isArray(res) || res.length > OUTPOST_SANCTUARY_RESIDENTS_MAX_V1 || !res.every(shortId) || new Set(res).size !== res.length) return null;
  if (res.length > 0 && (v.kind !== 'sanctuary' || built !== 3)) return null;
  return v as unknown as OutpostSiteV1;
}

export function readOutpostProjectsV1(extensionsValue: unknown): OutpostProjectsReadV1 {
  let extensions: V5Extensions;
  try { extensions = canonicalizeV5Extensions(extensionsValue); } catch { return Object.freeze({ kind: 'protected', reason: 'corrupt' }); }
  if (V5_SEGMENTS.some((segment) => segment !== 'player' && extensions[segment]?.[OUTPOST_PROJECTS_NAMESPACE_V1] !== undefined)) {
    return Object.freeze({ kind: 'protected', reason: 'wrong-segment' });
  }
  const carrier = extensions.player?.[OUTPOST_PROJECTS_NAMESPACE_V1];
  if (carrier === undefined) return Object.freeze({ kind: 'loaded', state: EMPTY_OUTPOST_PROJECTS_V1, present: false });
  if (carrier.version > VERSION) return Object.freeze({ kind: 'protected', reason: 'future-version' });
  try {
    if (carrier.version !== VERSION) throw new Error('version');
    const value = canonicalizeData(JSON.parse(carrier.json)) as CanonicalJsonObject;
    if (JSON.stringify(value) !== carrier.json || !isObj(value) || !keysAre(value, ['schema', 'sites']) || value.schema !== OUTPOST_PROJECTS_SCHEMA_V1) throw new Error('shape');
    const rawSites = value.sites;
    if (!Array.isArray(rawSites) || rawSites.length > OUTPOST_TOTAL_MAX_V1) throw new Error('sites');
    const sites = rawSites.map(checkedSite);
    if (sites.some((s) => s === null)) throw new Error('site');
    const ids = sites.map((s) => s!.id);
    if (new Set(ids).size !== ids.length || ids.some((id, i) => i > 0 && ids[i - 1]! >= id)) throw new Error('order');
    const relayStars = sites.filter((s) => s!.kind === 'relay').map((s) => s!.world.starSeed);
    if (new Set(relayStars).size !== relayStars.length) throw new Error('relay');
    return Object.freeze({ kind: 'loaded', state: Object.freeze({ sites: Object.freeze(sites as OutpostSiteV1[]) }), present: true });
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'corrupt' });
  }
}

/** The exact carrier write for a state (sites sorted by id; canonical JSON). */
export function outpostProjectsWriteV1(state: OutpostProjectsStateV1): V5ExtensionWrite {
  const sites = [...state.sites].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return Object.freeze({ segment: 'player', namespace: OUTPOST_PROJECTS_NAMESPACE_V1, carrier: Object.freeze({
    version: VERSION, json: canonicalJson({ schema: OUTPOST_PROJECTS_SCHEMA_V1, sites } as never) }) });
}
