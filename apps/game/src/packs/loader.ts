import { parseInterfaceSheet } from '@cf/art-interface';
import type { GameEvents } from '../events';
import { useSheet } from '../ui/sheet-source';
import type { PackCache } from './cache';
import { checkPackBytes } from './manifest';
import type { PackEntry, PackManifest } from './manifest';
import type { PackSource } from './sources';

export type PackResult =
  | { state: 'ready'; text: string }
  | { state: 'standin'; reason: 'offline' | 'absent' }
  | { state: 'refused'; reason: 'wrong-hash' | 'wrong-size' | 'unreadable' };

function textOf(bytes: Uint8Array): PackResult {
  try {
    return { state: 'ready', text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { state: 'refused', reason: 'unreadable' };
  }
}

/** A cache that fails costs only the offline copy, never the pack: a failed read is a miss. */
async function quietly<T>(work: () => Promise<T>): Promise<T | null> {
  try {
    return await work();
  } catch {
    return null;
  }
}

/**
 * One pack of the manifest: from the cache by hash, else from the first source that holds the right bytes.
 * Bytes are checked against the manifest entry before they are used or cached, cached ones too; a cached
 * entry that fails is deleted. Wrong bytes at one source do not stop a later source. With no right bytes
 * anywhere the pack is refused if some source held wrong ones, else a stand-in: `offline` if a source could
 * not be reached, `absent` if every source answered that it has no such pack.
 */
export async function loadPack(entry: PackEntry, deps: { cache: PackCache; sources: readonly PackSource[] }): Promise<PackResult> {
  const cached = await quietly(() => deps.cache.get(entry.sha256));
  if (cached !== null) {
    if (checkPackBytes(entry, cached).ok) return textOf(cached);
    await quietly(() => deps.cache.delete(entry.sha256));
  }
  let refused: 'wrong-hash' | 'wrong-size' | null = null;
  let unreachable = false;
  for (const source of deps.sources) {
    let bytes: Uint8Array | null;
    try {
      bytes = await source.fetch(entry);
    } catch {
      unreachable = true;
      continue;
    }
    if (bytes === null) continue;
    const check = checkPackBytes(entry, bytes);
    if (!check.ok) {
      refused ??= check.reason;
      continue;
    }
    const result = textOf(bytes);
    if (result.state === 'ready') {
      const right = bytes;
      await quietly(() => deps.cache.put(entry.sha256, right));
    }
    return result;
  }
  if (refused !== null) return { state: 'refused', reason: refused };
  return { state: 'standin', reason: unreachable ? 'offline' : 'absent' };
}

/** Removes every cached pack the manifest no longer lists. */
export async function prunePackCache(cache: PackCache, manifest: PackManifest): Promise<void> {
  const listed = new Set(manifest.packs.map((entry) => entry.sha256));
  for (const key of (await quietly(() => cache.keys())) ?? []) {
    if (!listed.has(key)) await quietly(() => cache.delete(key));
  }
}

export interface PackLoadDeps {
  readonly cache: PackCache;
  readonly sources: readonly PackSource[];
  /** Told the outcome of each pack as it is known: the payload of `pack:status`. */
  status(status: GameEvents['pack:status']): void;
}
export interface PackReport {
  readonly results: ReadonlyArray<{ readonly entry: PackEntry; readonly result: PackResult }>;
  /** How many packs of the manifest the game is drawing stand-ins for. */
  readonly standIns: number;
}

/**
 * Loads every pack of the manifest, in its order. A ready `interface` pack that parses becomes the sheet in
 * use; one that does not parse is refused and the sheet in use stays. The cache is pruned to the manifest
 * only once every pack is ready, so the packs of the build before stay cached until this one's are.
 */
export async function loadPacks(manifest: PackManifest, deps: PackLoadDeps): Promise<PackReport> {
  const results: Array<{ entry: PackEntry; result: PackResult }> = [];
  for (const entry of manifest.packs) {
    let result = await loadPack(entry, deps);
    if (entry.kind === 'interface' && result.state === 'ready') {
      try {
        useSheet(parseInterfaceSheet(result.text));
      } catch {
        result = { state: 'refused', reason: 'unreadable' };
      }
    }
    results.push({ entry, result });
    deps.status({ name: entry.name, state: result.state, detail: result.state === 'ready' ? null : result.reason });
  }
  const standIns = results.filter(({ result }) => result.state !== 'ready').length;
  if (standIns === 0) await prunePackCache(deps.cache, manifest);
  return { results, standIns };
}
