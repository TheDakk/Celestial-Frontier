/* Strict public CF1 ingress parsing.

   The lifted decoder is intentionally compatibility-tolerant: it coerces,
   wraps, defaults, and clamps old payloads so display code cannot crash.
   That is not enough for navigation authority. This parser preserves the
   exact public hierarchy bytes so the canonical address resolver can prove
   them against deterministic sources before any route is accepted. */

const CF1_PREFIX = 'CF1-';
const CF1_MAX_LENGTH = 8192;
const UINT32_MAX = 0xffff_ffff;
const ALLOWED_KEYS = new Set(['t', 'g', 's', 'p', 'n']);

export interface StrictCF1GalaxyCandidate {
  readonly galaxy: Readonly<{ seed: number; x: number; y: number }>;
}

export interface StrictCF1StarCandidate extends StrictCF1GalaxyCandidate {
  readonly star: Readonly<{ seed: number; x: number; y: number }>;
}

export interface StrictCF1WorldCandidate extends StrictCF1StarCandidate {
  readonly planet: Readonly<{ seed: number }>;
}

export type StrictCF1CodeResult =
  | { readonly kind: 'not-code' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'valid'; readonly tier: 'galaxy'; readonly candidate: StrictCF1GalaxyCandidate; readonly name: string | null }
  | { readonly kind: 'valid'; readonly tier: 'star'; readonly candidate: StrictCF1StarCandidate; readonly name: string | null }
  | { readonly kind: 'valid'; readonly tier: 'planet'; readonly candidate: StrictCF1WorldCandidate; readonly name: string | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExactUint32(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= 0
    && value <= UINT32_MAX;
}

function isExactCoordinate(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && Math.abs(value) <= 1e7
    && Math.round(value * 100) / 100 === value;
}

function validGalaxyTuple(value: unknown): value is [number, number, number, number, number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 8) return false;
  return isExactCoordinate(value[0])
    && isExactCoordinate(value[1])
    && typeof value[2] === 'number' && Number.isFinite(value[2]) && value[2] >= 8 && value[2] <= 4000
    && typeof value[3] === 'number' && Number.isInteger(value[3]) && value[3] >= 0 && value[3] <= 300000
    && typeof value[4] === 'number' && Number.isFinite(value[4]) && value[4] >= -7 && value[4] <= 7
    && typeof value[5] === 'number' && Number.isFinite(value[5]) && value[5] >= -7 && value[5] <= 7
    && isExactUint32(value[6])
    && typeof value[7] === 'number' && Number.isInteger(value[7]) && value[7] >= 0 && value[7] <= 7;
}

function validStarTuple(value: unknown): value is [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && isExactCoordinate(value[0])
    && isExactCoordinate(value[1])
    && isExactUint32(value[2]);
}

function decodePayload(encoded: string): unknown {
  let base64 = encoded.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

/**
 * Parse one public CF1 code without compatibility coercion. Any string that
 * contains the CF1 marker but cannot supply one exact supported tier is an
 * invalid-code outcome, never a Compendium search query.
 */
export function parseStrictCF1Code(code: string): StrictCF1CodeResult {
  /* Bound adversarial persistence/search input before even scanning it for a
     marker. The parser's caller may receive strings from outside the UI's
     normal input-length controls. */
  if (code.length > CF1_MAX_LENGTH) return { kind: 'invalid' };
  const marker = code.indexOf(CF1_PREFIX);
  if (marker < 0) return { kind: 'not-code' };

  let raw: unknown;
  try {
    raw = decodePayload(code.slice(marker + CF1_PREFIX.length));
  } catch {
    return { kind: 'invalid' };
  }
  if (!isRecord(raw) || Object.keys(raw).some((key) => !ALLOWED_KEYS.has(key))) {
    return { kind: 'invalid' };
  }
  if (!validGalaxyTuple(raw.g)) return { kind: 'invalid' };
  if (raw.n !== undefined && (typeof raw.n !== 'string' || raw.n.length > 24)) {
    return { kind: 'invalid' };
  }

  const galaxy = Object.freeze({ x: raw.g[0], y: raw.g[1], seed: raw.g[6] });
  const name = typeof raw.n === 'string' ? raw.n : null;
  if (raw.t === 'g') {
    if (raw.s !== undefined || raw.p !== undefined) return { kind: 'invalid' };
    return { kind: 'valid', tier: 'galaxy', candidate: Object.freeze({ galaxy }), name };
  }
  if (!validStarTuple(raw.s)) return { kind: 'invalid' };
  const star = Object.freeze({ x: raw.s[0], y: raw.s[1], seed: raw.s[2] });
  if (raw.t === 's') {
    if (raw.p !== undefined) return { kind: 'invalid' };
    return { kind: 'valid', tier: 'star', candidate: Object.freeze({ galaxy, star }), name };
  }
  if (raw.t === 'p' && isExactUint32(raw.p)) {
    const planet = Object.freeze({ seed: raw.p });
    return { kind: 'valid', tier: 'planet', candidate: Object.freeze({ galaxy, star, planet }), name };
  }
  return { kind: 'invalid' };
}
