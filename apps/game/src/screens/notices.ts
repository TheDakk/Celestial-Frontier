/* The standing notice of a save this page may not write: what is wrong, in words and an icon, for as long as
   it is so. A newer or damaged save stays as it is until the page is reloaded onto something it can write;
   storage that could not be read can be tried again. */
import type { BootKind, WriteHold } from '../events';
import { icon, type Toast } from '../ui';
import { el } from './dom';

export type HeldNotice = 'newer' | 'damaged' | 'unavailable' | 'reload';

/** The notice of a page, or null when it may write. `hold` and `tightened` are the write gate as it stands now:
 *  `tightened` is why the hold was tightened after the boot, or null when it was not. */
export function heldNoticeFor(kind: BootKind, hold: WriteHold, tightened: string | null): HeldNotice | null {
  if (hold === false) return null;
  if (kind === 'future-protected') return 'newer';
  if (hold === 'transient-read') return 'unavailable';
  if (tightened !== null && tightened.includes('reload required')) return 'reload';
  if (tightened !== null && tightened.includes('newer build')) return 'newer';
  return 'damaged';
}

export const NOTICE_WORDS: Readonly<Record<HeldNotice, { title: string; text: string }>> = Object.freeze({
  newer: { title: 'Update required', text: 'This expedition was written by a newer build. It will not be changed here.' },
  damaged: { title: 'Save protected', text: 'The stored expedition did not prove writable. It remains unchanged, and nothing you do here is saved.' },
  unavailable: { title: 'Save unavailable', text: 'Storage could not be read. This expedition remains protected from overwrite, and nothing you do here is saved.' },
  reload: { title: 'Reload required', text: 'Another save authority won. This page is now read-only so no progress can be overwritten.' },
});

export function mountNotices(host: HTMLElement, ports: {
  boot: { kind: BootKind };
  gate: { readonly hold: WriteHold; readonly detail: string | null };
  /** Reads the store again under a transient hold. */
  retry(): Promise<'reload' | 'protected' | 'unavailable'>;
  reload(): void;
  toast: Toast;
}): { /** Draws the notice again after the write gate may have changed. */ refresh(): void } {
  let trying = false;

  const draw = (): void => {
    const notice = heldNoticeFor(ports.boot.kind, ports.gate.hold, ports.gate.detail);
    if (notice === null) { host.replaceChildren(); return; }
    const words = NOTICE_WORDS[notice];
    const box = el('div', { class: 'notice', role: 'status', 'data-notice': notice },
      icon('warn', { decorative: true }), el('b', {}, words.title), el('span', {}, words.text));
    if (notice === 'unavailable') {
      const again = el('button', { type: 'button', 'data-notice-action': 'retry', disabled: trying }, 'Try again');
      again.addEventListener('click', () => { void retry(); });
      box.append(again);
    }
    if (notice === 'reload') {
      const now = el('button', { type: 'button', 'data-notice-action': 'reload' }, 'Reload');
      now.addEventListener('click', () => ports.reload());
      box.append(now);
    }
    host.replaceChildren(box);
  };

  const retry = async (): Promise<void> => {
    if (trying) return;
    trying = true;
    draw();
    const outcome = await ports.retry();
    trying = false;
    if (outcome === 'reload') { ports.reload(); return; }
    if (outcome === 'unavailable') ports.toast.show(NOTICE_WORDS.unavailable.title, 'Storage is still unavailable. This expedition remains protected from overwrite.');
    draw();
    host.querySelector<HTMLElement>('[data-notice-action]')?.focus();
  };

  draw();
  return { refresh: draw };
}
