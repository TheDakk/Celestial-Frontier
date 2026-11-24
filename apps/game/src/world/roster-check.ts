/* The validation half of the world roster: a producer's rows are copied to exact plain data within a size
   budget, without ever running an accessor, and the copy is frozen all the way down. */
export const MAX_WORLD_ROSTER_ROWS = 64;
const MAX_WORLD_ROSTER_OBJECT_KEYS = 64;
const MAX_WORLD_ROSTER_ARRAY_LENGTH = 64;
const MAX_WORLD_ROSTER_DATA_DEPTH = 8;
const MAX_WORLD_ROSTER_DATA_ENTRIES = 4_096;
const MAX_WORLD_ROSTER_DATA_CODE_UNITS = 262_144;

interface RosterCloneBudget {
  entries: number;
  codeUnits: number;
}

function spendRosterBudget(
  budget: RosterCloneBudget,
  entries: number,
  codeUnits: number,
): void {
  budget.entries += entries;
  budget.codeUnits += codeUnits;
  if (budget.entries > MAX_WORLD_ROSTER_DATA_ENTRIES
    || budget.codeUnits > MAX_WORLD_ROSTER_DATA_CODE_UNITS) {
    throw new RangeError('world roster data exceeds its canonical size budget');
  }
}

function exactArrayDataValues(
  value: unknown,
  label: string,
  maximumLength: number,
): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be an exact plain data array`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== 'string')) {
    throw new TypeError(`${label} has a symbol key`);
  }
  const stringKeys = keys as string[];
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
  if (!lengthDescriptor || !Object.hasOwn(lengthDescriptor, 'value')
    || !Number.isSafeInteger(lengthDescriptor.value)
    || lengthDescriptor.value < 0 || lengthDescriptor.value > maximumLength) {
    throw new RangeError(`${label} exceeds its canonical length budget`);
  }
  const length = lengthDescriptor.value as number;
  if (stringKeys.length !== length + 1
    || stringKeys.some((key) => key !== 'length'
      && (!/^(?:0|[1-9]\d*)$/u.test(key) || Number(key) >= length))) {
    throw new TypeError(`${label} must be dense and contain no extra properties`);
  }
  const values: unknown[] = [];
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
      throw new TypeError(`${label}[${index}] must be an enumerable data property`);
    }
    values.push(descriptor.value);
  }
  return values;
}

function cloneCanonicalRosterData(
  value: unknown,
  label: string,
  depth: number,
  ancestors: Set<object>,
  budget: RosterCloneBudget,
): unknown {
  if (depth > MAX_WORLD_ROSTER_DATA_DEPTH) {
    throw new RangeError('world roster data exceeds its canonical depth budget');
  }
  if (value === null || typeof value === 'boolean') {
    spendRosterBudget(budget, 1, 0);
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('world roster contains a non-finite number');
    spendRosterBudget(budget, 1, 0);
    return value;
  }
  if (typeof value === 'string') {
    spendRosterBudget(budget, 1, value.length);
    return value;
  }
  if (typeof value !== 'object') {
    throw new TypeError(`world roster contains unsupported ${typeof value} data`);
  }
  if (ancestors.has(value)) throw new TypeError('world roster contains a cyclic row');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const values = exactArrayDataValues(value, label, MAX_WORLD_ROSTER_ARRAY_LENGTH);
      spendRosterBudget(budget, 1, 0);
      return values.map((entry, index) => cloneCanonicalRosterData(
        entry,
        `${label}[${index}]`,
        depth + 1,
        ancestors,
        budget,
      ));
    }
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      throw new TypeError(`${label} must be an exact plain data object`);
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_WORLD_ROSTER_OBJECT_KEYS) {
      throw new RangeError(`${label} exceeds its canonical key budget`);
    }
    if (keys.some((key) => typeof key !== 'string')) {
      throw new TypeError(`${label} has a symbol key`);
    }
    spendRosterBudget(
      budget,
      1,
      (keys as string[]).reduce((total, key) => total + key.length, 0),
    );
    const clone: Record<string, unknown> = {};
    for (const key of keys as string[]) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
        throw new TypeError(`${label}.${key} must be an enumerable data property`);
      }
      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: cloneCanonicalRosterData(
          descriptor.value,
          `${label}.${key}`,
          depth + 1,
          ancestors,
          budget,
        ),
      });
    }
    return clone;
  } finally {
    ancestors.delete(value);
  }
}

export function detachedRosterRows(value: unknown, label: string): Array<Record<string, unknown>> {
  const sourceRows = exactArrayDataValues(value, label, MAX_WORLD_ROSTER_ROWS);
  const budget: RosterCloneBudget = { entries: 0, codeUnits: 0 };
  return sourceRows.map((sourceRow, index) => {
    if (sourceRow === null || typeof sourceRow !== 'object' || Array.isArray(sourceRow)
      || Object.getPrototypeOf(sourceRow) !== Object.prototype) {
      throw new TypeError(`${label}[${index}] must be an exact plain data object`);
    }
    const clone = cloneCanonicalRosterData(
      sourceRow,
      `${label}[${index}]`,
      0,
      new Set<object>(),
      budget,
    ) as Record<string, unknown>;
    if (!Number.isInteger(clone.seed as number) || (clone.seed as number) < 0
      || (clone.seed as number) > 0xffff_ffff) {
      throw new TypeError(`${label}[${index}].seed must be an exact uint32`);
    }
    if (typeof clone.kingdom !== 'string'
      || !['fauna', 'flora', 'fungi', 'microbe'].includes(clone.kingdom)) {
      throw new TypeError(`${label}[${index}].kingdom is not canonical`);
    }
    return clone;
  });
}

export function freezeCanonicalRosterData(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && Object.hasOwn(descriptor, 'value')) freezeCanonicalRosterData(descriptor.value);
  }
  Object.freeze(value);
}

/** One text for a value: keys sorted, negative zero kept apart from zero. */
export function canonicalFingerprintValue(value: unknown, ancestors = new Set<object>()): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('world roster contains a non-finite number');
    return Object.is(value, -0) ? '-0' : String(value);
  }
  if (typeof value !== 'object') {
    throw new TypeError(`world roster contains unsupported ${typeof value} data`);
  }
  if (ancestors.has(value)) throw new TypeError('world roster contains a cyclic row');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((entry) => canonicalFingerprintValue(entry, ancestors)).join(',')}]`;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('world roster contains a non-canonical object');
    }
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalFingerprintValue(record[key], ancestors)}`).join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function fnv1a32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
