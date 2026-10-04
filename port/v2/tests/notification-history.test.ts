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
import { createProductActionCoordinator } from '../apps/game/src/product-action-coordinator.js';

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

describe('K20: notices deferred during a product action drain when the action settles', () => {
  const deferredNotice = { id: 1, tt: 'Arrived in flight', ms: 'Deferred notice', t: NOW, read: false };
  function inFlight() {
    const h = harness([]);
    h.open();
    h.setDeferred(true);
    h.controller.record(deferredNotice.tt, deferredNotice.ms, NOW);
    expect(h.replace).not.toHaveBeenCalled();
    expect(h.panel.querySelector('[data-notification-pending]')).not.toBeNull();
    expect(h.panel.querySelector('[data-notification-read]')).toBeNull();
    expect(h.panel.textContent).toContain('Awaiting checkpoint');
    const coordinator = createProductActionCoordinator();
    const claim = coordinator.tryClaim('fixture-action');
    if (!claim) throw new Error('fixture claim refused');
    return { h, coordinator, claim };
  }

  it('records the notice with a Mark read control at settle, without a checkpoint or navigation', () => {
    const { h, coordinator, claim } = inFlight();
    const settled: unknown[] = [];
    coordinator.bindSettleHook((outcome) => { settled.push(outcome); h.controller.flushPending(); });
    h.setDeferred(false); // main.ts clears productActionInFlight before every settle
    claim.settle(true);
    expect(settled).toEqual([{ operation: 'fixture-action', durable: true }]);
    expect(h.replace).toHaveBeenCalledOnce();
    expect(h.history()).toEqual([deferredNotice]);
    expect(h.panel.querySelector('[data-notification-pending]')).toBeNull();
    expect(h.mark(1).disabled).toBe(false);
    expect(h.persist).not.toHaveBeenCalled();
    h.expectBadge(1);
    expect(() => coordinator.bindSettleHook(() => undefined)).toThrow('already bound');
  });

  it('negative control: settling without the bound hook leaves the row awaiting a checkpoint', () => {
    const { h, claim } = inFlight();
    h.setDeferred(false);
    claim.settle(true);
    expect(h.replace).not.toHaveBeenCalled();
    expect(h.history()).toEqual([]);
    expect(h.panel.querySelector('[data-notification-pending]')).not.toBeNull();
    expect(h.panel.querySelector('[data-notification-read]')).toBeNull();
    h.expectBadge(1);
  });

  it('keeps the drain refusal-safe: a hook firing while recording is still refused leaves the notice pending', () => {
    const { h, coordinator, claim } = inFlight();
    coordinator.bindSettleHook(() => h.controller.flushPending());
    h.setDeferred(false); h.setRecordable(false);
    claim.settle(false);
    expect(h.replace).not.toHaveBeenCalled();
    expect(h.panel.querySelector('[data-notification-pending]')).not.toBeNull();
    h.setRecordable(true);
    h.controller.flushPending();
    expect(h.history()).toEqual([deferredNotice]);
  });
});

describe('K22: notification timestamps between append, checkpoint, export and import', () => {
  /* The v1.8.9 loader repairs a zero, negative, absent or non-numeric `t` to
     the injected import clock; that contract is fixture-anchored
     (packages/persistence/test/import-v2.test.ts, migration-v5.test.ts) and is
     retained. This pins the writer/reader agreement for every in-range value
     and names the one deliberate asymmetry so a later change is a decision. */
  function durableBase() {
    const imported = importSaveV2('{}', REGISTRY, NOW);
    if (!imported.ok) throw new Error(imported.reason);
    return imported.state;
  }
  const importedT = (t: unknown): number => {
    const data = JSON.parse(exportSaveV2(durableBase(), NOW)) as Record<string, unknown>;
    data.notifs = [{ id: 1, tt: 'Shaped', ms: 'row', ...(t === undefined ? {} : { t }), read: false }];
    const reloaded = importSaveV2(JSON.stringify(data), REGISTRY, NOW);
    if (!reloaded.ok) throw new Error(reloaded.reason);
    return reloaded.state.notifications[0]!.t;
  };

  it('round-trips every positive finite clock unchanged through append → checkpoint → export → import', () => {
    for (const now of [1, 123, NOW, 4e12, 5e12]) {
      const entry = appendNotification([], 'Clock', 'finite', now)[0]!;
      const durable = durableBase();
      const outcome = projectCheckpointState({ durable, live: { ...durable, notifications: [entry] },
        savedView: null, epoch: 0, trainingReplacement: false });
      if (outcome.kind !== 'projected') throw new Error(outcome.detail);
      expect(outcome.droppedFields).toEqual([]);
      const reloaded = importSaveV2(exportSaveV2(outcome.state, NOW), REGISTRY, NOW);
      if (!reloaded.ok) throw new Error(reloaded.reason);
      expect(reloaded.state.notifications, `now=${now}`).toEqual([entry]);
      expect(importedT(now), `now=${now}`).toBe(entry.t);
    }
  });

  it('names the retained legacy repair: a non-positive or non-numeric t reads back as the import clock', () => {
    const zero = appendNotification([], 'Clock unavailable', 'no finite time', Number.NaN)[0]!;
    expect(zero.t).toBe(0); // the writer clamps a missing clock to the floor
    const durable = durableBase();
    const outcome = projectCheckpointState({ durable, live: { ...durable, notifications: [zero] },
      savedView: null, epoch: 0, trainingReplacement: false });
    if (outcome.kind !== 'projected') throw new Error(outcome.detail);
    expect(outcome.state.notifications[0]!.t).toBe(0); // the checkpoint keeps 0 (row.t >= 0 is valid)
    const reloaded = importSaveV2(exportSaveV2(outcome.state, NOW), REGISTRY, NOW);
    if (!reloaded.ok) throw new Error(reloaded.reason);
    expect(reloaded.state.notifications[0]!.t).toBe(NOW); // the fixture-anchored loader repairs it
    for (const t of [0, -5, undefined, null, 'abc', Number.NaN, Number.POSITIVE_INFINITY, '']) {
      expect(importedT(t), `t=${String(t)}`).toBe(NOW);
    }
    // Direction control: the same comparator sees an in-range value survive.
    expect(importedT(7)).toBe(7);
  });
});

it('the actual recording admission refuses a live checkpoint without mutating its notice overlay',()=>{
 const main=readFileSync(new URL('../apps/game/src/main.ts',import.meta.url),'utf8');
 const start=main.indexOf('  mayRecord: () =>'),end=main.indexOf('\n  deferRecord:',start);
 expect(start).toBeGreaterThan(0);expect(end).toBeGreaterThan(start);
 const expression=main.slice(start+'  mayRecord: '.length,end).trim().replace(/,$/,'');
 const admit=(source:string,activePersist:unknown)=>new Function('activePersist',`const save={},playerMutationsBlocked=()=>false,trainingActive=()=>false,trainingCheckpointWriteHeld=false,replacementTransaction=false,replacementReloadPending=false,importWriteInFlight=false,persistHold=false;return (${source})();`)(activePersist);
 const check=(source:string)=>{const h=harness();h.setRecordable(admit(source,Promise.resolve()));const before=h.history();h.controller.record('During checkpoint','must not mutate',NOW);expect(h.history()).toEqual(before);};
 expect(()=>check(expression)).not.toThrow();expect(()=>check(expression.replace('activePersist === null && ',''))).toThrow();
 expect(admit(expression,null)).toBe(true);

});

describe('v1.8.9 parity: Mark all read and armed Clear all (2026-09-25)', () => {
  const bulk = (h: ReturnType<typeof harness>, action: 'read-all' | 'clear') =>
    h.panel.querySelector<HTMLButtonElement>(`[data-notification-bulk="${action}"]`);

  it('Mark all read reads every saved and session message through one saved write, and survives export/import', async () => {
    const h = harness([notice(9), notice(8), notice(7, true)]);
    h.setWritable(false); h.controller.record('Session notice', 'kept for this session', NOW); h.setWritable(true);
    h.open(); h.expectBadge(3);
    bulk(h, 'read-all')!.click(); await turn();
    expect(h.persist).toHaveBeenCalledTimes(1);
    expect(h.history().every((entry) => entry.read)).toBe(true);
    h.expectBadge(0);
    expect(bulk(h, 'read-all')).toBeNull(); // nothing unread → no button
    const imported = importSaveV2('{}', REGISTRY, NOW);
    if (!imported.ok) throw new Error(imported.reason);
    const round = importSaveV2(exportSaveV2({ ...imported.state, notifications: h.history() }, NOW), REGISTRY, NOW);
    if (!round.ok) throw new Error(round.reason);
    expect(round.state.notifications.every((entry) => entry.read)).toBe(true);
  });

  it('a refused Mark all read restores exactly those unread flags and keeps a notice that arrived during the write', async () => {
    const h = harness([notice(9), notice(8, true)]);
    let settle!: (ok: boolean) => void;
    h.persist.mockImplementationOnce(() => new Promise<boolean>((resolve) => { settle = resolve; }));
    h.open(); bulk(h, 'read-all')!.click();
    expect(h.history().find((entry) => entry.id === 9)!.read).toBe(true);
    h.controller.record('Arrived meanwhile', 'during the write', NOW + 1);
    settle(false); await turn();
    expect(h.history().find((entry) => entry.id === 9)!.read).toBe(false);
    expect(h.history().find((entry) => entry.id === 8)!.read).toBe(true);
    expect(h.history().some((entry) => entry.tt === 'Arrived meanwhile')).toBe(true);
    expect(h.panel.textContent).toContain('Messages remain unread');
  });

  it('Clear all arms on the first tap, fires on the second, and disarms by itself', async () => {
    vi.useFakeTimers();
    try {
      const h = harness([notice(9), notice(8, true)]);
      h.open();
      bulk(h, 'clear')!.click();
      expect(h.persist).not.toHaveBeenCalled();
      expect(bulk(h, 'clear')!.textContent).toBe('Clear all? — confirm');
      vi.advanceTimersByTime(4100);
      expect(bulk(h, 'clear')!.textContent).toBe('Clear all'); // disarmed: a lone tap never destroys
      bulk(h, 'clear')!.click(); bulk(h, 'clear')!.click();
      await vi.runAllTimersAsync();
      expect(h.persist).toHaveBeenCalledTimes(1);
      expect(h.history()).toEqual([]);
      expect(h.panel.querySelector('.notification-empty')).not.toBeNull();
      h.expectBadge(0);
    } finally { vi.useRealTimers(); }
  });

  it('a refused Clear all restores the removed messages (new arrivals kept first); read-only authority clears nothing saved', async () => {
    const h = harness([notice(9), notice(8, true)]);
    h.persist.mockImplementationOnce(async () => false);
    h.open(); bulk(h, 'clear')!.click(); bulk(h, 'clear')!.click(); await turn();
    expect(h.history().map((entry) => entry.id)).toEqual([9, 8]);
    expect(h.panel.textContent).toContain('Messages were not cleared');
    h.setWritable(false); h.setRecordable(false); h.controller.render();
    bulk(h, 'clear')!.click(); bulk(h, 'clear')!.click(); await turn();
    expect(h.history().map((entry) => entry.id)).toEqual([9, 8]);
    expect(h.panel.textContent).toContain('read-only');
  });
});
