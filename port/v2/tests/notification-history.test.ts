import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportSaveV2, importSaveV2, type ContentRegistry } from '@cf/persistence';
import {
  appendNotification,
  createNotificationHistory,
  NOTIFICATION_HISTORY_LIMIT,
  type NotificationEntry,
} from '../apps/game/src/notification-history.js';
import { projectCheckpointState } from '../apps/game/src/checkpoint-state.js';

interface TestWindow extends Window {
  close(): void;
  Element: typeof Element;
  HTMLElement: typeof HTMLElement;
}
interface TestDom { window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const REGISTRY = JSON.parse(readFileSync(new URL('../../baseline-v1.8.9/content-registry.json', import.meta.url), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_060_000;
const GLOBAL_KEYS = ['window', 'document', 'Element', 'HTMLElement'] as const;
const originals = new Map<string, PropertyDescriptor | undefined>();
let dom: TestDom;

beforeEach(() => {
  for (const key of GLOBAL_KEYS) originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  dom = new JSDOM(`<!doctype html><html><body>
    <button id="shelfnotifications">Bell</button><button id="docknotifications">Bell</button>
    <aside id="notificationpanel" style="display:none"></aside>
  </body></html>`, { url: 'https://example.test/' });
  const bindings: Record<typeof GLOBAL_KEYS[number], unknown> = {
    window: dom.window, document: dom.window.document,
    Element: dom.window.Element, HTMLElement: dom.window.HTMLElement,
  };
  for (const key of GLOBAL_KEYS) Object.defineProperty(globalThis, key, {
    configurable: true, writable: true, value: bindings[key],
  });
});

afterEach(() => {
  dom.window.close();
  for (const key of GLOBAL_KEYS) {
    const original = originals.get(key);
    if (original) Object.defineProperty(globalThis, key, original);
    else Reflect.deleteProperty(globalThis, key);
  }
  originals.clear();
});

const notice = (id = 7, read = false): NotificationEntry => ({
  id, tt: `Notice ${id}`, ms: 'Expedition message', t: NOW - id, read,
});
const turn = async (): Promise<void> => { await new Promise<void>((resolve) => setTimeout(resolve, 0)); };

function harness(initial: NotificationEntry[] = [notice()]) {
  let history = initial;
  let writable = true;
  let recordable: boolean | null = null;
  let deferred = false;
  const panel = document.getElementById('notificationpanel')!;
  const buttons = ['shelfnotifications', 'docknotifications'].map((id) => document.getElementById(id)!);
  const replace = vi.fn((next: NotificationEntry[]) => { history = next; });
  const persist = vi.fn<() => Promise<boolean>>(async () => true);
  const controller = createNotificationHistory({
    panel, buttons, history: () => history, replace, mayWrite: () => writable,
    mayRecord: () => recordable ?? writable, deferRecord: () => deferred,
    persist,
    fill: (html) => { panel.innerHTML = '<button type="button" data-pnx="notifications">Close Notifications</button>' + html; },
  });
  const open = (): void => { panel.style.display = 'block'; controller.render(); };
  const mark = (id: number, session = false): HTMLButtonElement => {
    const button = panel.querySelector<HTMLButtonElement>(`[data-notification-read="${id}"][data-notification-session="${session}"]`);
    if (!button) throw new Error(`missing ${session ? 'session' : 'saved'} Mark read action ${id}`);
    return button;
  };
  const expectBadge = (unread: number): void => {
    for (const button of buttons) {
      expect(button.dataset.unread).toBe(String(unread));
      expect(button.getAttribute('aria-label')).toBe(`Notifications${unread ? `, ${unread} unread` : ', all read'}`);
      const badge = button.querySelector<HTMLElement>('[data-notification-count]')!;
      expect(badge.textContent).toBe(unread > 99 ? '99+' : String(unread));
      expect(badge.hidden).toBe(unread === 0);
    }
  };
  return { controller, panel, buttons, replace, persist, open, mark, expectBadge,
    history: () => history, setWritable: (value: boolean) => { writable = value; },
    setRecordable: (value: boolean) => { recordable = value; },
    setDeferred: (value: boolean) => { deferred = value; } };
}

describe('notification history presentation and saved read state', () => {
  it('opens without marking messages read and native Mark read survives the existing checkpoint/export/import path', async () => {
    const h = harness([notice(7), notice(6, true)]);
    const imported = importSaveV2('{}', REGISTRY, NOW);
    if (!imported.ok) throw new Error(imported.reason);
    const durable = imported.state;
    durable.notifications = h.history();
    let stored = '';
    h.persist.mockImplementation(async () => {
      const live = { ...durable, notifications: h.history() };
      const outcome = projectCheckpointState({ durable, live, savedView: null, epoch: 0, trainingReplacement: false });
      if (outcome.kind !== 'projected') throw new Error(outcome.detail);
      stored = exportSaveV2(outcome.state, NOW);
      return true;
    });
    h.open();
    h.controller.render();
    expect(h.replace).not.toHaveBeenCalled();
    expect(h.persist).not.toHaveBeenCalled();
    expect(h.history()[0]!.read).toBe(false);
    h.expectBadge(1);
    h.mark(7).click();
    await turn();
    expect(h.persist).toHaveBeenCalledOnce();
    const reloaded = importSaveV2(stored, REGISTRY, NOW);
    if (!reloaded.ok) throw new Error(reloaded.reason);
    expect(reloaded.state.notifications).toEqual([notice(7, true), notice(6, true)]);
    expect(durable.notifications[0]!.read).toBe(false);
    expect(h.panel.querySelector('[data-notification-read="7"]')).toBeNull();
    expect(h.panel.textContent).toContain('Read state saved.');
    h.expectBadge(0);
  });

  it('rolls back only the rejected read flag and retains a notice arriving during its checkpoint', async () => {
    const h = harness();
    let settle!: (value: boolean) => void;
    h.persist.mockImplementation(() => new Promise<boolean>((resolve) => { settle = resolve; }));
    h.open();
    h.mark(7).click();
    expect(h.history()[0]!.read).toBe(true);
    h.controller.record('Arrived during write', 'Keep this message', NOW);
    expect(h.persist).toHaveBeenCalledOnce();
    expect(h.history().map(({ id }) => id)).toEqual([8, 7]);
    const actionWhilePending = h.mark(8);
    expect(actionWhilePending.disabled).toBe(true);
    actionWhilePending.click();
    expect(h.persist).toHaveBeenCalledOnce();
    settle(false);
    await turn();
    expect(h.history()).toEqual([
      { id: 8, tt: 'Arrived during write', ms: 'Keep this message', t: NOW, read: false }, notice(7),
    ]);
    expect(h.mark(7).disabled).toBe(false);
    expect(h.panel.textContent).toContain('Read state was not saved.');
    h.expectBadge(2);
  });

  it('keeps notices and their read flags in this session when save authority is unavailable', async () => {
    const original = [notice(1)];
    const h = harness(original);
    h.setWritable(false);
    h.controller.record('Session warning', 'Save is protected', NOW);
    h.open();
    expect(h.history()).toBe(original);
    expect(h.replace).not.toHaveBeenCalled();
    expect(h.persist).not.toHaveBeenCalled();
    expect(h.mark(1, false).disabled).toBe(true);
    expect(h.mark(1, true).disabled).toBe(false);
    h.expectBadge(2);
    h.mark(1, true).click();
    await turn();
    expect(h.persist).not.toHaveBeenCalled();
    expect(h.replace).not.toHaveBeenCalled();
    expect(h.history()).toEqual([notice(1)]);
    expect(h.panel.textContent).toContain('Read · This session');
    expect(h.panel.textContent).toContain('History is read-only');
    h.expectBadge(1);
  });

  it('buffers notices without changing an in-flight product snapshot and promotes them only into an existing safe checkpoint', async () => {
    const h = harness();
    const productSnapshot = JSON.stringify(h.history());
    h.setWritable(false);
    h.setRecordable(false);
    h.setDeferred(true);
    h.controller.record('During product work', 'Do not change the captured source', NOW);
    h.controller.record('Later in product work', 'Keep chronological order', NOW + 1);
    h.open();
    expect(JSON.stringify(h.history())).toBe(productSnapshot);
    expect(h.replace).not.toHaveBeenCalled();
    expect(h.persist).not.toHaveBeenCalled();
    expect(h.panel.querySelectorAll('[data-notification-pending]')).toHaveLength(2);
    expect(h.panel.querySelector('[data-notification-pending] [data-notification-read]')).toBeNull();
    expect(h.panel.textContent).toContain('Awaiting checkpoint');
    h.controller.flushPending();
    expect(JSON.stringify(h.history())).toBe(productSnapshot);
    // A verified product may replace the save object while notices are buffered.
    h.replace([notice(12)]);
    h.setDeferred(false);
    h.setRecordable(true);
    h.setWritable(true);
    h.controller.flushPending();
    expect(h.history().map(({ id, tt }) => ({ id, tt }))).toEqual([
      { id: 14, tt: 'Later in product work' }, { id: 13, tt: 'During product work' }, { id: 12, tt: 'Notice 12' },
    ]);
    expect(h.panel.querySelectorAll('[data-notification-pending]')).toHaveLength(0);
    expect(h.persist).not.toHaveBeenCalled();
    const checkpoint = JSON.parse(JSON.stringify(h.history())) as NotificationEntry[];
    expect(checkpoint).toEqual(h.history());
    h.expectBadge(3);
    h.mark(13).click();
    await turn();
    expect(h.persist).toHaveBeenCalledOnce();
    expect(h.history().find(({ id }) => id === 13)!.read).toBe(true);
    expect(checkpoint.find(({ id }) => id === 13)!.read).toBe(false);
    h.expectBadge(2);
  });

  it('does not cache a transient checkpoint busy state as a disabled read control', async () => {
    const h = harness();
    h.setWritable(false);
    h.setRecordable(true);
    h.open();
    expect(h.mark(7).disabled).toBe(false);
    h.mark(7).click();
    expect(h.history()[0]!.read).toBe(false);
    expect(h.replace).not.toHaveBeenCalled();
    expect(h.persist).not.toHaveBeenCalled();
    expect(h.panel.textContent).toContain('Another action or save is settling. Try Mark read again shortly.');
    h.setWritable(true);
    // No reopen/refill: the same live action must become usable after settlement.
    h.mark(7).click();
    await turn();
    expect(h.persist).toHaveBeenCalledOnce();
    expect(h.history()[0]!.read).toBe(true);
    h.expectBadge(0);
  });

  it('retains semantic focus during incoming messages and leaves outside focus alone after awaited read completion', async () => {
    const h = harness();
    h.open();
    const original = h.mark(7);
    original.focus();
    h.controller.record('Incoming', 'Focus stays on the existing message', NOW);
    expect(original.isConnected).toBe(false);
    expect(document.activeElement).toBe(h.mark(7));
    let settle!: (value: boolean) => void;
    h.persist.mockImplementation(() => new Promise<boolean>((resolve) => { settle = resolve; }));
    h.mark(7).click();
    expect(document.activeElement).toBe(h.panel.querySelector('[data-pnx]'));
    const outside = h.buttons[0]!;
    outside.focus();
    settle(true);
    await turn();
    expect(document.activeElement).toBe(outside);
    expect(h.history().find(({ id }) => id === 7)!.read).toBe(true);
    h.expectBadge(1);
  });

  it('escapes saved/session content and bounds titles, details and each new saved history to the existing 50 rows', () => {
    const h = harness([]);
    h.controller.record('<img src=x onerror=1>', '<script>unsafe()</script> & text', NOW);
    h.open();
    expect(h.panel.querySelector('img,script')).toBeNull();
    expect(h.panel.textContent).toContain('<img src=x onerror=1>');
    expect(h.panel.textContent).toContain('<script>unsafe()</script> & text');
    h.setWritable(false);
    h.controller.record('<svg onload=1>', '<iframe src=x>', NOW);
    expect(h.panel.querySelector('svg,iframe')).toBeNull();
    expect(h.panel.textContent).toContain('<svg onload=1>');
    const previous = Array.from({ length: 60 }, (_, index) => notice(60 - index));
    const before = structuredClone(previous);
    const next = appendNotification(previous, 't'.repeat(201), 'm'.repeat(401), 4e12 + 1);
    expect(NOTIFICATION_HISTORY_LIMIT).toBe(50);
    expect(next).toHaveLength(50);
    expect(next[0]).toEqual({ id: 61, tt: 't'.repeat(200), ms: 'm'.repeat(400), t: 4e12, read: false });
    expect(next.at(-1)?.id).toBe(12);
    expect(previous).toEqual(before);
    expect(appendNotification([], '', '', Number.NaN)[0]!.t).toBe(0);
    expect(appendNotification([], '', '', -1)[0]!.t).toBe(0);
    h.expectBadge(2);
  });

  it('keeps recording free of persistence timers and joins pending notices only after the final checkpoint admission', () => {
    const owner = readFileSync(new URL('../apps/game/src/notification-history.ts', import.meta.url), 'utf8');
    const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
    const recordStart = owner.indexOf('    record(title, message, now) {');
    const recordEnd = owner.indexOf('    render, refreshBadge, flushPending,', recordStart);
    expect(recordStart).toBeGreaterThan(0);
    expect(recordEnd).toBeGreaterThan(recordStart);
    const record = owner.slice(recordStart, recordEnd);
    const writeFree = (source: string): boolean => !/options\.persist\(|setTimeout|schedulePersist/u.test(source);
    expect(writeFree(record)).toBe(true);
    expect(writeFree(record + '\noptions.persist();')).toBe(false);
    expect(writeFree(record + '\nsetTimeout(() => options.persist(), 400);')).toBe(false);
    expect(writeFree(record)).toBe(true);
    const wiringStart = main.indexOf('const notificationHistory = createNotificationHistory({');
    const wiringEnd = main.indexOf("registerPanel({ id: 'notifications'", wiringStart);
    const wiring = main.slice(wiringStart, wiringEnd);
    expect(wiringStart).toBeGreaterThan(0);
    expect(wiringEnd).toBeGreaterThan(wiringStart);
    expect(wiring).not.toMatch(/schedulePersist|persistSoon|setTimeout/u);
    expect(wiring).toContain('activePersist === null && !namedSearchPersistenceHeld');
    expect(wiring).toContain('mayRecord: () => !!save && !playerMutationsBlocked()');
    expect(wiring).toContain('deferRecord: () => !!save && productActionInFlight && f4RuntimeMayMutate()');
    const flush = main.indexOf('if (!productActionInFlight) notificationHistory.flushPending();');
    const finalAdmission = main.lastIndexOf('if (!admitted()) return false;', flush);
    const runtimeCheck = main.lastIndexOf('if (!f4RuntimeMayMutate(runtime)) return false;', flush);
    const projection = main.indexOf('const projection = projectCheckpointState({', flush);
    expect(finalAdmission).toBeGreaterThan(0);
    expect(runtimeCheck).toBeGreaterThan(finalAdmission);
    expect(flush).toBeGreaterThan(runtimeCheck);
    expect(projection).toBeGreaterThan(flush);
  });

  it('wraps signed32 notice IDs without colliding with retained entries', () => {
    const history = [notice(2_147_483_647), notice(-2_147_483_648), notice(-2_147_483_647)];
    const next = appendNotification(history, 'Wrapped', 'New ID', NOW);
    expect(next[0]!.id).toBe(-2_147_483_646);
    expect(new Set(next.map(({ id }) => id)).size).toBe(next.length);
    expect(history.map(({ id }) => id)).toEqual([2_147_483_647, -2_147_483_648, -2_147_483_647]);
  });
});
