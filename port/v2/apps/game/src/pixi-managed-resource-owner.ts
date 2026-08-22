export interface PixiManagedResourceHashSnapshot {
  readonly name: string;
  readonly type: 'resource' | 'renderable';
  readonly liveEntryCount: number;
  readonly clearedEntryCount: number;
}

export interface PixiManagedResourceOwnerSnapshot {
  readonly schema: 'cf-v2-pixi-managed-resources/v2';
  readonly valid: boolean;
  readonly hashCount: number;
  readonly hashes: readonly PixiManagedResourceHashSnapshot[];
  readonly liveEntryCount: number;
  readonly clearedEntryCount: number;
  readonly compactionCount: number;
  readonly compactedSlotCount: number;
  readonly faultCount: number;
}

export type PixiRendererProvider = () => unknown;
export type CleanManagedHash = (
  hash: Record<string, object | null | undefined>,
) => Record<string, object | null | undefined>;

type UnknownRecord = Record<PropertyKey, unknown>;
type ManagedHash = Record<string, object | null | undefined>;
type ManagedHashEntry = {
  readonly context: UnknownRecord;
  readonly name: string;
  readonly hash: string;
  readonly type: 'resource' | 'renderable';
  readonly priority: number;
  readonly value: ManagedHash;
  readonly live: readonly (readonly [string, object])[];
  readonly clearedCount: number;
};
type ManagedHashObservation = {
  readonly entries: readonly ManagedHashEntry[];
  readonly hashCount: number;
  readonly hashes: readonly PixiManagedResourceHashSnapshot[];
  readonly liveEntryCount: number;
  readonly clearedEntryCount: number;
};

const ENTRY_KEYS = Object.freeze(['context', 'hash', 'priority', 'type']);

const isRecord = (value: unknown): value is UnknownRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const exactStringKeys = (value: object, expected: readonly string[]): boolean => {
  const actual = Reflect.ownKeys(value);
  if (actual.some((key) => typeof key !== 'string') || actual.length !== expected.length) {
    return false;
  }
  const expectedSet = new Set(expected);
  return actual.every((key) => expectedSet.has(key as string));
};

/**
 * One compatibility seam for Pixi 8.19's private renderer GC registry. Reads are
 * observational; only an explicit compact() may replace registered hashes.
 */
export class PixiManagedResourceOwner {
  private compactionCount = 0;
  private compactedSlotCount = 0;
  private faultCount = 0;
  private stickyFault: Error | null = null;
  private lastObservation: Omit<ManagedHashObservation, 'entries'> = {
    hashCount: 0,
    hashes: Object.freeze([]),
    liveEntryCount: 0,
    clearedEntryCount: 0,
  };

  constructor(
    private readonly provideRenderer: PixiRendererProvider,
    private readonly cleanManagedHash: CleanManagedHash,
  ) {}

  snapshot(): PixiManagedResourceOwnerSnapshot {
    if (!this.stickyFault) {
      try { this.remember(this.inspect()); }
      catch (error) { this.stick(error); }
    }
    return this.currentSnapshot();
  }

  compact(): PixiManagedResourceOwnerSnapshot {
    if (this.stickyFault) throw this.stickyFault;

    let before: ManagedHashObservation;
    try { before = this.inspect(); }
    catch (error) { throw this.stick(error); }
    this.remember(before);
    if (before.clearedEntryCount === 0) return this.currentSnapshot();

    try {
      const replacements = before.entries.map((entry) => {
        if (entry.clearedCount === 0) return entry.value;
        const replacement = this.cleanManagedHash(entry.value);
        this.assertCleanReplacement(entry, replacement);
        return replacement as ManagedHash;
      });

      for (let index = 0; index < before.entries.length; index++) {
        const entry = before.entries[index]!;
        const replacement = replacements[index]!;
        if (replacement !== entry.value) entry.context[entry.hash] = replacement;
      }
      for (let index = 0; index < before.entries.length; index++) {
        const entry = before.entries[index]!;
        if (entry.context[entry.hash] !== replacements[index]) {
          throw new Error('Pixi managed-resource hash replacement postcondition failed');
        }
      }

      const after = this.inspect();
      if (after.hashCount !== before.hashCount
        || after.liveEntryCount !== before.liveEntryCount
        || after.clearedEntryCount !== 0) {
        throw new Error('Pixi managed-resource compaction postcondition failed');
      }
      this.compactionCount++;
      this.compactedSlotCount += before.clearedEntryCount;
      this.remember(after);
      return this.currentSnapshot();
    } catch (error) {
      throw this.stick(error);
    }
  }

  private currentSnapshot(): PixiManagedResourceOwnerSnapshot {
    return Object.freeze({
      schema: 'cf-v2-pixi-managed-resources/v2',
      valid: this.stickyFault === null,
      ...this.lastObservation,
      compactionCount: this.compactionCount,
      compactedSlotCount: this.compactedSlotCount,
      faultCount: this.faultCount,
    });
  }

  private inspect(): ManagedHashObservation {
    const renderer = this.provideRenderer();
    if (!isRecord(renderer)) throw new Error('Pixi renderer provider returned an invalid renderer');
    const gc = renderer.gc;
    if (!isRecord(gc)) throw new Error('Pixi renderer has an invalid GC system');
    const registryDescriptor = Object.getOwnPropertyDescriptor(gc, '_managedResourceHashes');
    const registry = registryDescriptor && 'value' in registryDescriptor
      ? registryDescriptor.value
      : undefined;
    if (!Array.isArray(registry) || Object.getPrototypeOf(registry) !== Array.prototype) {
      throw new Error('Pixi GC managed-resource registry has an invalid array shape');
    }
    const expectedArrayKeys = [
      ...Array.from({ length: registry.length }, (_, index) => String(index)),
      'length',
    ];
    if (!exactStringKeys(registry, expectedArrayKeys)) {
      throw new Error('Pixi GC managed-resource registry is sparse or extended');
    }

    const entries: ManagedHashEntry[] = [];
    const seen = new Map<object, Set<string>>();
    const seenSemanticIdentities = new Set<string>();
    let liveEntryCount = 0;
    let clearedEntryCount = 0;
    for (const candidate of registry as unknown[]) {
      if (!isRecord(candidate)
        || Object.getPrototypeOf(candidate) !== Object.prototype
        || !exactStringKeys(candidate, ENTRY_KEYS)) {
        throw new Error('Pixi managed-resource registry entry has an invalid shape');
      }
      const { context, hash, type, priority } = candidate;
      if (!isRecord(context) || typeof hash !== 'string' || hash.trim() !== hash || !hash) {
        throw new Error('Pixi managed-resource registry entry has an invalid context or hash');
      }
      const name = context.name;
      if (typeof name !== 'string' || name.trim() !== name || !name) {
        throw new Error('Pixi managed-resource registry entry has an invalid name');
      }
      if ((type !== 'resource' && type !== 'renderable')
        || typeof priority !== 'number' || !Number.isFinite(priority)) {
        throw new Error('Pixi managed-resource registry entry has invalid metadata');
      }
      const semanticIdentity = `${type}\u0000${name}`;
      if (seenSemanticIdentities.has(semanticIdentity)) {
        throw new Error('Pixi managed-resource registry contains a duplicate semantic owner');
      }
      seenSemanticIdentities.add(semanticIdentity);
      const contextHashes = seen.get(context) ?? new Set<string>();
      if (contextHashes.has(hash)) {
        throw new Error('Pixi managed-resource registry contains a duplicate hash owner');
      }
      contextHashes.add(hash);
      seen.set(context, contextHashes);

      const hashDescriptor = Object.getOwnPropertyDescriptor(context, hash);
      if (!hashDescriptor || !('value' in hashDescriptor) || !hashDescriptor.writable) {
        throw new Error('Pixi managed-resource context does not own a writable hash');
      }
      const value = hashDescriptor.value;
      const hashObservation = this.inspectHash(value);
      liveEntryCount += hashObservation.live.length;
      clearedEntryCount += hashObservation.clearedCount;
      entries.push({
        context,
        name,
        hash,
        type,
        priority,
        value: value as ManagedHash,
        ...hashObservation,
      });
    }
    const hashes = entries.map((entry) => Object.freeze({
      name: entry.name,
      type: entry.type,
      liveEntryCount: entry.live.length,
      clearedEntryCount: entry.clearedCount,
    })).sort((left, right) => {
      const leftIdentity = `${left.type}\u0000${left.name}`;
      const rightIdentity = `${right.type}\u0000${right.name}`;
      return leftIdentity < rightIdentity ? -1 : leftIdentity > rightIdentity ? 1 : 0;
    });
    return {
      entries,
      hashCount: entries.length,
      hashes: Object.freeze(hashes),
      liveEntryCount,
      clearedEntryCount,
    };
  }

  private inspectHash(value: unknown): {
    readonly live: readonly (readonly [string, object])[];
    readonly clearedCount: number;
  } {
    if (!isRecord(value) || Object.getPrototypeOf(value) !== null) {
      throw new Error('Pixi managed-resource hash must have a null prototype');
    }
    const live: Array<readonly [string, object]> = [];
    let clearedCount = 0;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') {
        throw new Error('Pixi managed-resource hash contains a non-string key');
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable
        || !descriptor.writable || !descriptor.configurable) {
        throw new Error('Pixi managed-resource hash contains an invalid slot descriptor');
      }
      const slot = descriptor.value;
      if (slot === null || slot === undefined) clearedCount++;
      else if (typeof slot === 'object') live.push([key, slot]);
      else throw new Error('Pixi managed-resource hash contains an invalid live slot');
    }
    return { live, clearedCount };
  }

  private assertCleanReplacement(entry: ManagedHashEntry, replacement: unknown): void {
    if (replacement === entry.value) {
      throw new Error('Pixi cleanHash did not replace a cleared managed-resource hash');
    }
    const inspected = this.inspectHash(replacement);
    if (inspected.clearedCount !== 0 || inspected.live.length !== entry.live.length) {
      throw new Error('Pixi cleanHash changed the managed-resource inventory');
    }
    for (const [key, resource] of entry.live) {
      if ((replacement as ManagedHash)[key] !== resource) {
        throw new Error('Pixi cleanHash changed a live managed-resource identity');
      }
    }
  }

  private remember(observation: ManagedHashObservation): void {
    this.lastObservation = {
      hashCount: observation.hashCount,
      hashes: observation.hashes,
      liveEntryCount: observation.liveEntryCount,
      clearedEntryCount: observation.clearedEntryCount,
    };
  }

  private stick(error: unknown): Error {
    if (!this.stickyFault) {
      this.stickyFault = error instanceof Error
        ? error
        : new Error('Pixi managed-resource owner failed with a non-Error value');
      this.faultCount++;
    }
    return this.stickyFault;
  }
}
