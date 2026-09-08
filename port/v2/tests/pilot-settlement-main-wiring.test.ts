import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
function executable(name: string, end: string): string {
  const start = source.indexOf(`async function ${name}(`);
  const finish = source.indexOf(end, start);
  if (start < 0 || finish <= start) throw new Error('Missing native Charter boundary');
  const result = transformSync('charter-action.ts', source.slice(start, finish));
  if (result.errors.length) throw new Error(JSON.stringify(result.errors));
  return result.code;
}
const actionCode = executable('runStarterCharterAccept', '\nasync function acceptStarterCharterWithPilot(');
const callerCode = executable('acceptStarterCharterWithPilot', '\nasync function runArc9BinderSetClaim(');

function caller() {
  const finish = vi.fn(), cancel = vi.fn(), beginSettlement = vi.fn(() => ({ finish, cancel }));
  const pilot = { beginSettlement };
  let resolve!: (value: boolean) => void, reject!: (error: Error) => void;
  const runStarterCharterAccept = vi.fn(() => new Promise<boolean>((yes, no) => { resolve = yes; reject = no; }));
  const state = { audiovisualPilot: pilot as typeof pilot | null, runStarterCharterAccept };
  const run = runInNewContext(callerCode + ';acceptStarterCharterWithPilot;', state) as (id: string, trusted: boolean) => Promise<void>;
  return { run, state, finish, cancel, beginSettlement, runStarterCharterAccept, resolve: (v: boolean) => resolve(v), reject: (e: Error) => reject(e) };
}
function action(completed = false) {
  const id = 'st-land';
  const save = { chacc: [] as string[], chDone: [] as string[], chProg: {}, essence: 10,
    stats: {}, items: [], equip: {}, equipAff: {}, unlocked: [] };
  const successor = { ...save, chacc: completed ? [] : [id], chDone: completed ? [id] : [], essence: completed ? 20 : 10 };
  const runtime = { revision: 10, checkpointParent: vi.fn(() => successor), extensions: {} };
  const outcome = { kind: 'committed', transaction: { revision: 11 }, arc2LootState: null,
    facts: { successor, receiptOrdinal: 1, stage: { extensionWrites: [],
      completions: completed ? [{ title: 'First Landing', stardust: 10, gearId: null }] : [],
      priorUnlockedIds: [], nextUnlockedIds: [], addedAchievementIds: [], priorBestRankIndex: 0, nextBestRankIndex: 0 } } };
  const settle = vi.fn(), barrier = Promise.resolve();
  const fillCharters = vi.fn(), toast = vi.fn(), presentProgressionCeremony = vi.fn();
  const commit = vi.fn(async () => { runtime.revision = 11; return outcome; });
  const publish = vi.fn((target: typeof save) => { Object.assign(target, successor); });
  const projection = { kind: 'projected', board: { rows: [{ definition: { id, title: 'First Landing' }, status: 'available' }], acceptedCount: 0, cap: 3 } };
  const state: Record<string, unknown> = {
    f4Runtime: runtime, save, starterCharterAcceptPendingId: null, smokeForceReadOnly: false,
    f4RuntimeMayMutate: vi.fn(() => true), activePersist: null, importWriteInFlight: false,
    replacementTransaction: null, replacementReloadPending: false, trainingCheckpointWriteHeld: false,
    trainingActive: () => false, ecologyEpochBlocksActions: () => false,
    lastStarterCharterAcceptOutcome: null, lastStarterCharterAcceptStatus: null,
    openPanelId: () => 'ch', fillCharters, toast,
    projectStarterCharterBoardV1: () => projection, operationForStarterCharterAcceptV1: () => 'accept',
    productActionCoordinator: { tryClaim: () => ({ barrier, operation: 'accept', settle }) },
    arc2LootState: {}, inventoryPanelController: { setState: vi.fn() }, productActionInFlight: false,
    smokeProductActionHold: { holdIfArmed: vi.fn(async () => undefined) }, settleF4Heartbeat: vi.fn(async () => undefined),
    commitStarterCharterAcceptV1: commit, boundedCollectionRefusalNeedsReload: () => false,
    scheduleF4AuthorityConvergenceReload: vi.fn(), performance: { now: () => 100 },
    f4LastCheckpointAt: 0, lastPersistenceOutcome: null, publishStarterCharterAcceptFieldsV1: publish,
    updateChips: vi.fn(), fillRecords: vi.fn(), presentProgressionCeremony,
  };
  const run = runInNewContext(actionCode + ';runStarterCharterAccept;', state) as (id: string) => Promise<boolean>;
  return { run: () => run(id), state, save, successor, outcome, runtime, commit, publish, settle, fillCharters, toast, presentProgressionCeremony, projection };
}

describe('native Starter Charter settlement caller', () => {
  it('uses the exact canonical enabled native button and original event trust', () => {
    expect(source).toContain('if (button === null || button.disabled) return;');
    expect(source).toContain('if (id !== undefined) void acceptStarterCharterWithPilot(id, event.isTrusted);');
  });
  it('captures activation before delayed persistence and finishes once only afterward', async () => {
    const s = caller(); const pending = s.run('st-land', true);
    expect(s.beginSettlement).toHaveBeenCalledExactlyOnceWith(true);
    expect(s.beginSettlement.mock.invocationCallOrder[0]).toBeLessThan(s.runStarterCharterAccept.mock.invocationCallOrder[0]!);
    expect(s.finish).not.toHaveBeenCalled();
    s.resolve(true); await pending;
    expect(s.finish).toHaveBeenCalledExactlyOnceWith(true); expect(s.cancel).not.toHaveBeenCalled();
  });
  it.each(['refusal', 'untrusted', 'replaced-pilot'])('keeps %s silent after action settlement', async kind => {
    const s = caller(); const pending = s.run('st-land', kind !== 'untrusted');
    if (kind === 'replaced-pilot') s.state.audiovisualPilot = null;
    s.resolve(kind !== 'refusal'); await pending;
    expect(s.finish).toHaveBeenCalledExactlyOnceWith(false);
  });
  it('preserves unexpected action failures and cancels the captured ticket', async () => {
    const s = caller(); const pending = s.run('st-land', true); const error = new Error('write failed');
    s.reject(error); await expect(pending).rejects.toBe(error);
    expect(s.finish).not.toHaveBeenCalled(); expect(s.cancel).toHaveBeenCalledOnce();
  });
  it.each(['capture', 'finish'])('does not let %s media failures block the action', async phase => {
    const s = caller();
    if (phase === 'capture') s.beginSettlement.mockImplementation(() => { throw new Error('audio'); });
    else s.finish.mockImplementation(() => { throw new Error('audio'); });
    const pending = s.run('st-land', true); s.resolve(true); await expect(pending).resolves.toBeUndefined();
    expect(s.runStarterCharterAccept).toHaveBeenCalledExactlyOnceWith('st-land');
    if (phase === 'finish') expect(s.cancel).toHaveBeenCalledOnce();
  });
});

describe('actual Starter Charter publication verdict', () => {
  it.each([false, true])('publishes accepted/immediately complete=%s only after barrier release', async completed => {
    const s = action(completed);
    expect(await s.run()).toBe(true);
    expect(s.save.chacc).toEqual(completed ? [] : ['st-land']);
    expect(s.save.chDone).toEqual(completed ? ['st-land'] : []);
    expect(s.state.activePersist).toBeNull(); expect(s.state.productActionInFlight).toBe(false);
    expect(s.settle).toHaveBeenCalledExactlyOnceWith(true);
    expect(s.state.lastStarterCharterAcceptOutcome).toBe('committed:st-land:1');
  });
  it.each(['smokeForceReadOnly', 'activePersist', 'importWriteInFlight', 'replacementTransaction',
    'replacementReloadPending', 'trainingCheckpointWriteHeld'])('rejects %s before writing', async key => {
    const s = action(); s.state[key] = true;
    expect(await s.run()).toBe(false); expect(s.commit).not.toHaveBeenCalled();
  });
  it('does not turn duplicate acceptance into another success', async () => {
    const s = action(); s.save.chacc.push('st-land');
    expect(await s.run()).toBe(false); expect(s.commit).not.toHaveBeenCalled();
  });
  it.each(['current', 'refused', 'committed-convergence'])('keeps %s transaction results silent', async kind => {
    const s = action(); s.outcome.kind = kind;
    expect(await s.run()).toBe(false); expect(s.publish).not.toHaveBeenCalled();
  });
  it('rejects a durable checkpoint that disagrees with its successor', async () => {
    const s = action(); s.runtime.checkpointParent.mockReturnValue({ ...s.successor, essence: 999 });
    expect(await s.run()).toBe(false); expect(s.publish).not.toHaveBeenCalled();
  });
  it('rejects a failed progression publication despite an already durable acceptance', async () => {
    const s = action(); s.presentProgressionCeremony.mockImplementation(() => { throw new Error('presentation'); });
    expect(await s.run()).toBe(false); expect(s.save.chacc).toEqual([]);
    expect(s.state.lastStarterCharterAcceptOutcome).toBe('committed-publication-reload');
  });
  it('rejects final Charters refresh failure after the action barrier settles', async () => {
    const s = action(); let calls = 0;
    s.fillCharters.mockImplementation(() => { if (++calls === 3) throw new Error('final refresh'); });
    expect(await s.run()).toBe(false); expect(s.settle).toHaveBeenCalledExactlyOnceWith(true);
    expect(s.save.chacc).toEqual([]); expect(s.state.scheduleF4AuthorityConvergenceReload).toHaveBeenCalledOnce();
  });
  it('rejects a superseding revision at barrier release', async () => {
    const s = action(); s.settle.mockImplementation(() => { s.runtime.revision++; });
    expect(await s.run()).toBe(false);
  });
});
