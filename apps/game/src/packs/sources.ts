import { readBytes } from '../platform/http';
import type { PackEntry } from './manifest';

/** A place packs are fetched from. null: this place does not hold the pack. Throws when it cannot be reached. */
export interface PackSource { fetch(entry: PackEntry): Promise<Uint8Array | null> }
export type ReadBytes = (url: string) => Promise<Uint8Array | null>;

/** The packs beside the app: the ignored `art-packs/` folder in development, the build's own copy after it. A pack
 *  is the file of its manifest entry, directly under the base address. */
export function localFolderSource(baseUrl: string, read: ReadBytes = readBytes): PackSource {
  const base = baseUrl.replace(/\/+$/, '');
  return { fetch: (entry) => read(`${base}/${entry.file}`) };
}
