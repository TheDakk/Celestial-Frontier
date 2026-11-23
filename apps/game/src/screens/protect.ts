/* The save protection rows of Settings: whether the browser keeps the data, the backup door and the restore
   door. The flows are the protect system's; this draws them and passes the player's choices on. */
import {
  PORTABLE_V5_MAX_BYTES,
  type ContentRegistry, type SaveStateV2, type StorageOperation, type V5ExtensionWrite, type V5Extensions,
} from '@cf/persistence';
import type { Bus } from '../bus';
import type { GameEvents, PersistState } from '../events';
import { wallDateParts, type Clocks } from '../platform/clock';
import {
  backupFileName, checkRestoreText, createBackupText, readLastBackupAt, recordBackup, restoreBackup, type RestoreCheck,
} from '../protect';
import { icon, type Toast } from '../ui';
import { el, row } from './dom';

export interface ProtectPorts {
  registry: ContentRegistry;
  clocks: Clocks;
  bus: Bus<GameEvents>;
  /** The last stored state (null when this page can no longer tell) and its extensions. */
  runtime: { readonly extensions: V5Extensions; checkpointParent(): SaveStateV2 | null };
  gate: { mayWrite(): boolean };
  /** Stores what the player sees now, with these extension writes, in its turn among the page's writes. True
   *  when it was stored; false at once on a page that may not write. */
  store(extensionWrites: readonly V5ExtensionWrite[]): Promise<boolean>;
  /** The last answer of the browser about keeping the data. */
  persistState(): PersistState;
  askAgain(): Promise<PersistState>;
  /** False when the stored expedition could not be read: there is then nothing to back up. */
  canBackUp(): boolean;
  replaceExpedition(operations: readonly StorageOperation[]): Promise<boolean>;
  saveTextFile(name: string, text: string): void;
  pickTextFile(maxBytes: number): Promise<string | null>;
  toast: Toast;
}

const PERSIST_WORDS: Readonly<Record<PersistState, { words: string; icon: string }>> = {
  kept: { words: 'Kept by this browser', icon: 'ok' },
  'not-kept': { words: 'This browser may clear it when the device runs short of space', icon: 'warn' },
  unsupported: { words: 'This browser cannot promise to keep it', icon: 'warn' },
  unknown: { words: 'Not known yet', icon: 'warn' },
};
const REFUSED_FILE: Readonly<Record<Exclude<RestoreCheck['kind'], 'ok'>, string>> = {
  'future-version': 'That file was written by a newer version of the game. Nothing was changed.',
  corrupt: 'That file is damaged or is not a backup of this game. Nothing was changed.',
  'too-large': 'That file is too large to be a backup. Nothing was changed.',
};

const two = (n: number): string => String(n).padStart(2, '0');
/** A wall time as the device's local date and time of day. */
export function localDateTime(ms: number): string {
  const { y, mo, d, h, mi } = wallDateParts(ms);
  return `${y}-${two(mo)}-${two(d)} ${two(h)}:${two(mi)}`;
}

export interface ProtectView {
  /** The rows as they stand now. */
  render(): HTMLElement[];
  /** For the layout check: the next render shows the restore confirmation over a made-up choice. */
  showConfirm(): void;
}

/** `redraw` is called whenever the rows have changed and must be drawn again. */
export function createProtectView(ports: ProtectPorts, redraw: () => void): ProtectView {
  let note: string | null = null;
  let chosen: Extract<RestoreCheck, { kind: 'ok' }> | null = null;
  let confirming = false;
  let busy = false;

  const backUp = async (): Promise<void> => {
    // What the player sees is stored first, so the file holds it. A page that may not write hands over the
    // expedition as it was last stored.
    await ports.store([]);
    const stored = ports.runtime.checkpointParent();
    if (stored === null) return;
    const wallNow = ports.clocks.wallNow();
    ports.saveTextFile(backupFileName(wallNow),
      createBackupText({ state: stored, extensions: ports.runtime.extensions, registry: ports.registry, wallNow }));
    note = 'Backup file made.';
    redraw();
    if (await recordBackup({ extensions: () => ports.runtime.extensions, store: ports.store, wallNow })) {
      ports.bus.emit('protect:backup', { at: wallNow });
    }
    redraw();
  };

  // The chooser may never answer when it is dismissed, so nothing waits on it: Restore stays ready to press.
  const choose = async (): Promise<void> => {
    const text = await ports.pickTextFile(PORTABLE_V5_MAX_BYTES);
    if (text === null) return;
    const check = checkRestoreText(text, ports.registry, ports.clocks.wallNow());
    chosen = check.kind === 'ok' ? check : null;
    confirming = check.kind === 'ok';
    note = check.kind === 'ok' ? null : REFUSED_FILE[check.kind];
    redraw();
  };

  const restore = async (): Promise<void> => {
    if (chosen === null || busy) return;
    busy = true;
    redraw();
    const outcome = await restoreBackup({ replaceExpedition: ports.replaceExpedition }, chosen);
    busy = false;
    if (outcome === 'refused') {
      confirming = false;
      chosen = null;
      ports.toast.show('Restore unavailable', 'The save could not be replaced. Your expedition is unchanged.', true);
    }
    redraw();
  };

  const button = (key: string, text: string, run: () => void, attrs: Record<string, string | boolean | null> = {}): HTMLButtonElement => {
    const b = el('button', { type: 'button', 'data-set': key, ...attrs }, text);
    b.addEventListener('click', run);
    return b;
  };

  return {
    showConfirm() { confirming = true; },
    render() {
      const held = !ports.gate.mayWrite();
      const persist = PERSIST_WORDS[ports.persistState()];
      const last = readLastBackupAt(ports.runtime.extensions);
      const rows: HTMLElement[] = [
        el('h3', {}, 'Save protection'),
        row('Saved data',
          el('span', { class: 'row-value', 'data-set': 'persist-state' }, icon(persist.icon, { decorative: true }), el('span', {}, persist.words)),
          button('persist-ask', 'Ask again', () => { void ports.askAgain().then(redraw); })),
        row('Backup', button('backup', 'Back up now', () => { void backUp(); }, { disabled: !ports.canBackUp() })),
        row('Last backup', last === null
          ? el('span', { class: 'row-value', 'data-set': 'last-backup' }, 'Never')
          : el('span', { class: 'row-value', 'data-set': 'last-backup', 'data-l10n-skip': true }, localDateTime(last))),
        row('Restore', button('restore', 'Restore…', () => { void choose(); },
          { disabled: held, 'aria-expanded': String(confirming), 'aria-controls': 'setrestoreconfirm' })),
      ];
      if (held) rows.push(el('p', { class: 'sub' }, 'Not available while the save is protected.'));
      if (note !== null) rows.push(el('p', { class: 'sub', role: 'status', 'data-set': 'protect-note' }, note));
      rows.push(el('div', { class: 'row confirm', id: 'setrestoreconfirm', role: 'group', 'aria-label': 'Confirm restore', hidden: !confirming },
        el('span', { class: 'sub' }, 'Replace this whole expedition with the one in the backup file? This cannot be undone.'),
        button('restore-yes', 'Replace and reload', () => { void restore(); }, { class: 'danger', disabled: busy || held }),
        button('restore-no', 'Cancel', () => { confirming = false; chosen = null; redraw(); })));
      return rows;
    },
  };
}
