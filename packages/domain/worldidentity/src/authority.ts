/* Neutral CF1 world-identity authority.

   Scene owns source re-derivation and is the only consumer of the internal
   mint subpath. Lower deterministic domains consume only the public runtime
   verifier, avoiding a scene -> strays -> combatcore -> scene dependency
   cycle while still rejecting structural address clones. */

export interface RegisteredCF1WorldAddress {
  readonly format: 'CF1';
  readonly key: string;
  readonly galaxy: Readonly<{ readonly seed: number; readonly x: number; readonly y: number }>;
  readonly star: Readonly<{ readonly seed: number; readonly x: number; readonly y: number }>;
  readonly planet: Readonly<{ readonly seed: number; readonly ordinal: number }>;
}

const REGISTERED_WORLD_KEYS = new WeakMap<object, string>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUint32(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 0xffff_ffff;
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && !Object.is(value, -0);
}

function hasWorldShape(value: unknown): value is RegisteredCF1WorldAddress {
  if (!isRecord(value) || value.format !== 'CF1'
    || typeof value.key !== 'string' || value.key.length === 0
    || !isRecord(value.galaxy) || !isRecord(value.star) || !isRecord(value.planet)) return false;
  return isUint32(value.galaxy.seed)
    && isFiniteCoordinate(value.galaxy.x)
    && isFiniteCoordinate(value.galaxy.y)
    && isUint32(value.star.seed)
    && isFiniteCoordinate(value.star.x)
    && isFiniteCoordinate(value.star.y)
    && isUint32(value.planet.seed)
    && Number.isSafeInteger(value.planet.ordinal)
    && (value.planet.ordinal as number) >= 0;
}

/** Public lower-layer check. Exact structural clones have no WeakMap entry. */
export function isRegisteredCF1WorldAddress(value: unknown): value is RegisteredCF1WorldAddress {
  return hasWorldShape(value)
    && REGISTERED_WORLD_KEYS.get(value) === value.key;
}

/** Package-internal mint used only after Scene re-derives and freezes the
 * complete CF1 hierarchy from production generators. */
export function registerCF1WorldAddressAuthority<T extends RegisteredCF1WorldAddress>(address: T): T {
  if (!hasWorldShape(address)
    || !Object.isFrozen(address)
    || !Object.isFrozen(address.galaxy)
    || !Object.isFrozen(address.star)
    || !Object.isFrozen(address.planet)) {
    throw new TypeError('CF1 world authority requires one deeply frozen canonical address');
  }
  REGISTERED_WORLD_KEYS.set(address, address.key);
  return address;
}
