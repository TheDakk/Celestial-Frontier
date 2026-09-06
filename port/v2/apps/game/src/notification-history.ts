/** Presentation notices use the existing bounded save shape. No receipt or
 * gameplay outcome is created by reading a message. */
import type { SaveStateV2 } from '@cf/persistence';
export type NotificationEntry = SaveStateV2['notifications'][number];
export const NOTIFICATION_HISTORY_LIMIT = 50; // matches the existing export cap
const escapeText = (text: string): string => text.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

export function appendNotification(
  history: readonly NotificationEntry[], title: string, message: string, now: number,
): NotificationEntry[] {
  const occupied = new Set(history.map((entry) => entry.id));
  let id = ((history[0]?.id ?? 0) + 1) | 0;
  while (occupied.has(id)) id = (id + 1) | 0;
  return [{ id, tt: title.slice(0, 200), ms: message.slice(0, 400),
    t: Math.max(0, Math.min(4e12, Number.isFinite(now) ? now : 0)), read: false },
  ...history].slice(0, NOTIFICATION_HISTORY_LIMIT);
}

export interface NotificationHistoryOptions {
  panel: HTMLElement;
  buttons: readonly HTMLElement[];
  history: () => readonly NotificationEntry[];
  replace: (history: NotificationEntry[]) => void;
  mayWrite: () => boolean;
  mayRecord: () => boolean;
  deferRecord: () => boolean;
  persist: () => Promise<boolean>;
  fill: (html: string) => void;
}
export function createNotificationHistory(options: NotificationHistoryOptions): {
  record(title: string, message: string, now: number): void;
  render(): void;
  refreshBadge(): void;
  flushPending(): void;
} {
  let sessionOnly: NotificationEntry[] = [];
  let pendingNotices: NotificationEntry[] = [];
  let pending = false;
  let status = '';
  const unreadCount = (): number => [...options.history(), ...sessionOnly, ...pendingNotices]
    .filter((entry) => !entry.read).length;
  function refreshBadge(): void {
    const unread = unreadCount();
    for (const button of options.buttons) {
      button.setAttribute('aria-label', `Notifications${unread ? `, ${unread} unread` : ', all read'}`);
      button.dataset.unread = String(unread);
      let badge = button.querySelector<HTMLElement>('[data-notification-count]');
      if (!badge) {
        badge = button.ownerDocument.createElement('span');
        badge.dataset.notificationCount = '';
        badge.setAttribute('aria-hidden', 'true');
        button.append(badge);
      }
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.hidden = unread === 0;
    }
  }
  function row(entry: NotificationEntry, session: boolean, awaitingCheckpoint = false): string {
    const read = entry.read;
    return `<li class="notification-entry${read ? ' is-read' : ''}"${awaitingCheckpoint ? ' data-notification-pending' : ''}><div class="notification-heading"><strong>${escapeText(entry.tt)}</strong><span>${read ? 'Read' : 'Unread'}${awaitingCheckpoint ? ' · Awaiting checkpoint' : session ? ' · This session' : ''}</span></div><p>${escapeText(entry.ms)}</p>${!read && !awaitingCheckpoint ? `<button type="button" data-notification-read="${entry.id}" data-notification-session="${session}"${pending || (!session && !options.mayRecord()) ? ' disabled' : ''}>Mark read</button>` : ''}</li>`;
  }
  function render(): void {
    const active = options.panel.ownerDocument.activeElement;
    const ownedFocus = active instanceof HTMLElement && options.panel.contains(active);
    const actionId = ownedFocus ? active.dataset.notificationRead : undefined;
    const actionSession = ownedFocus ? active.dataset.notificationSession : undefined;
    refreshBadge();
    const history = options.history();
    const entries = pendingNotices.map((entry) => row(entry, false, true)).join('')
      + sessionOnly.map((entry) => row(entry, true)).join('')
      + history.map((entry) => row(entry, false)).join('');
    options.fill(`<h2>Notifications</h2><p class="dim">Recent messages · up to 50 saved. Opening this panel leaves unread messages unread.</p><p class="notification-save-status" role="status">${escapeText(status || (!options.mayWrite() ? 'History is read-only while save authority is unavailable.' : 'Read state is saved with your expedition.'))}</p>${entries ? `<ol class="notification-list">${entries}</ol>` : '<p class="notification-empty">No messages yet.</p>'}`);
    if (ownedFocus) {
      const candidate = [...options.panel.querySelectorAll<HTMLButtonElement>('[data-notification-read]')]
        .find((button) => button.dataset.notificationRead === actionId
          && button.dataset.notificationSession === actionSession && !button.disabled);
      (candidate ?? options.panel.querySelector<HTMLElement>('[data-pnx]'))?.focus({ preventScroll: true });
    }
  }
  function refreshOpen(): void {
    refreshBadge();
    if (options.panel.style.display !== 'none') render();
  }
  function flushPending(): void {
    if (!options.mayRecord() || pendingNotices.length === 0) return;
    let history = [...options.history()];
    // Replay oldest first so the newest deferred notice remains first. IDs are
    // assigned against the settled history, never the in-flight product copy.
    for (const entry of [...pendingNotices].reverse()) {
      history = appendNotification(history, entry.tt, entry.ms, entry.t);
    }
    options.replace(history);
    pendingNotices = [];
    refreshOpen();
  }
  options.panel.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-notification-read]');
    if (!button || button.disabled || pending) return;
    const id = Number(button.dataset.notificationRead);
    if (button.dataset.notificationSession === 'true') {
      sessionOnly = sessionOnly.map((entry) => entry.id === id ? { ...entry, read: true } : entry);
      render(); return;
    }
    if (!options.mayWrite()) {
      status = options.mayRecord()
        ? 'Another action or save is settling. Try Mark read again shortly.'
        : 'History is read-only while save authority is unavailable.';
      render(); return;
    }
    const before = options.history();
    if (!before.some((entry) => entry.id === id && !entry.read)) return;
    options.replace(before.map((entry) => entry.id === id ? { ...entry, read: true } : entry));
    pending = true; status = 'Saving read state…'; render();
    let committed = false;
    try { committed = await options.persist(); } catch { /* keep the unread state on refusal */ }
    if (!committed) {
      // New notices arriving during the write are retained; only this read is undone.
      options.replace(options.history().map((entry) => entry.id === id ? { ...entry, read: false } : entry));
    }
    pending = false;
    status = committed ? 'Read state saved.' : 'Read state was not saved. This message remains unread.';
    render();
  });
  return {
    record(title, message, now) {
      if (options.deferRecord() || (options.mayRecord() && pendingNotices.length > 0)) {
        pendingNotices = appendNotification(pendingNotices, title, message, now);
      } else if (options.mayRecord()) {
        options.replace(appendNotification(options.history(), title, message, now));
      } else {
        sessionOnly = appendNotification(sessionOnly, title, message, now);
      }
      refreshOpen();
    },
    render, refreshBadge, flushPending,
  };
}

export const NOTIFICATION_HISTORY_CSS = `
#notificationpanel{top:calc(var(--topbar-h) + 8px);right:calc(var(--safe-right) + 12px);width:min(380px,calc(100vw - 24px));max-height:calc(100dvh - var(--topbar-h) - 128px - var(--safe-bottom));box-sizing:border-box;overflow:auto;padding:16px;font:var(--cf-type-body)/1.5 var(--ui);z-index:var(--cf-layer-sheet)}
#notificationpanel h2{margin:0 44px 8px 0;font-size:var(--cf-type-section)}
.notification-list{padding:0;margin:12px 0 0;list-style:none}.notification-entry{padding:12px 0;border-top:1px solid var(--cf-color-border)}
.notification-heading{display:flex;gap:8px;align-items:baseline;justify-content:space-between}.notification-heading span{font-size:11px;color:var(--cf-color-accent-gold);white-space:nowrap}.notification-entry.is-read .notification-heading span{color:var(--dim)}
.notification-entry p{margin:4px 0 8px;overflow-wrap:anywhere}.notification-entry button{min-width:44px;min-height:44px;padding:8px 12px;border-radius:var(--cf-radius-small);border:1px solid var(--cf-color-border);background:var(--cf-color-elevated);color:var(--ink);font:inherit}.notification-entry button:disabled{opacity:.6}.notification-entry button:focus-visible{outline:2px solid var(--cf-color-accent-gold);outline-offset:2px}
.notification-save-status{font-size:11px;color:var(--dim);margin:8px 0}.dock-utility{position:relative}[data-notification-count]{position:absolute;top:0;right:0;min-width:14px;padding:1px 3px;border-radius:8px;background:var(--cf-color-accent-gold);color:#131b28;font:700 9px/12px var(--ui);text-align:center;pointer-events:none}[data-notification-count][hidden]{display:none}
`;
