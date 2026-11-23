/* Backup and restore. A backup is the whole expedition as one portable text the player keeps as a file. A
   restore replaces the stored expedition with the one in such a file. The time of the last backup is part
   of the save, so it is gone with the expedition after a reset.

   This system does not write the save itself. It is handed the save loop's write and the whole-expedition
   replacement as ports. */
import {
  PORTABLE_V5_MAX_BYTES,
  exportPortableV5Save,
  prepareV5Replacement,
  type ContentRegistry,
  type SaveStateV2,
  type StorageOperation,
  type V5ExtensionWrite,
  type V5Extensions,
  type V5ReplacementPreparation,
} from '@cf/persistence';
import { wallDateParts } from '../platform/clock';

/** A v5 extension in the settings segment. */
export const PROTECT_NAMESPACE = 'shell.protect';
export const PROTECT_VERSION = 1;

/** The wall time of the last backup, or null when there was none or its record is not one this build reads. */
export function readLastBackupAt(extensions: V5Extensions): number | null {
  const carrier = extensions.settings?.[PROTECT_NAMESPACE];
  if (carrier === undefined || carrier.version !== PROTECT_VERSION) return null;
  try {
    const at = (JSON.parse(carrier.json) as { lastBackupAt?: unknown }).lastBackupAt;
    return typeof at === 'number' && Number.isSafeInteger(at) && at >= 0 ? at : null;
  } catch {
    return null;
  }
}

const two = (n: number): string => String(n).padStart(2, '0');

/** `celestial-frontier-backup-YYYYMMDD-HHMM.cfsave`, in the device's local time. */
export function backupFileName(wallNow: number): string {
  const { y, mo, d, h, mi } = wallDateParts(wallNow);
  return `celestial-frontier-backup-${String(y).padStart(4, '0')}${two(mo)}${two(d)}-${two(h)}${two(mi)}.cfsave`;
}

export function createBackupText(input: {
  state: SaveStateV2;
  extensions: V5Extensions;
  registry: ContentRegistry;
  wallNow: number;
}): string {
  return exportPortableV5Save({ state: input.state, extensions: input.extensions }, input.registry, input.wallNow);
}

export type RestoreCheck =
  | { kind: 'ok'; prepared: Extract<V5ReplacementPreparation, { kind: 'prepared' }> }
  | { kind: 'future-version' }
  | { kind: 'corrupt' }
  | { kind: 'too-large' };

/** Judges the text of a chosen file. Only a backup this game wrote is `ok`; a save string of the old game
 *  is `corrupt`. White space around the text is not part of it. Nothing is stored. */
export function checkRestoreText(raw: string, registry: ContentRegistry, wallNow: number): RestoreCheck {
  const text = raw.trim();
  if (text.length > PORTABLE_V5_MAX_BYTES || new TextEncoder().encode(text).byteLength > PORTABLE_V5_MAX_BYTES) {
    return { kind: 'too-large' };
  }
  const prepared = prepareV5Replacement(text, registry, wallNow);
  return prepared.kind === 'prepared' ? { kind: 'ok', prepared } : prepared;
}

/** Stores `wallNow` as the time of the last backup. False when it was not stored: under a hold, without the
 *  lease, or over a record a newer build wrote. */
export async function recordBackup(deps: {
  /** The extensions as last stored. */
  extensions(): V5Extensions;
  /** The save loop's write: a checkpoint carrying these extension writes, stored in its turn among the page's
   *  writes. True when it was stored. */
  store(extensionWrites: readonly V5ExtensionWrite[]): Promise<boolean>;
  wallNow: number;
}): Promise<boolean> {
  const stored = deps.extensions().settings?.[PROTECT_NAMESPACE];
  if (stored !== undefined && stored.version > PROTECT_VERSION) return false;
  return deps.store([{
    segment: 'settings',
    namespace: PROTECT_NAMESPACE,
    carrier: { version: PROTECT_VERSION, json: JSON.stringify({ lastBackupAt: deps.wallNow }) },
  }]);
}

/** Replaces the stored expedition with a checked backup, then the page reloads. `refused`: nothing was
 *  replaced; under any hold nothing is tried. */
export async function restoreBackup(
  deps: {
    /** The save system's whole-expedition replacement: true when it was stored and the page is reloading. */
    replaceExpedition(operations: readonly StorageOperation[]): Promise<boolean>;
  },
  check: Extract<RestoreCheck, { kind: 'ok' }>,
): Promise<'restored' | 'refused'> {
  return await deps.replaceExpedition(check.prepared.operations) ? 'restored' : 'refused';
}
