import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  assessEarlyCoreFlowActionFixedPoint,
  assessF4ActionCommitSequence,
  buildEarlyCoreFlowActionSurfaceExpression,
} from '../tools/slicesmoke-contract.mjs';

const sliceSmokeSource = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);

const TOKEN = 'initial-milky-way-owner-token';
const RENDERED_SERIAL = 8;
const EXPECTED = {
  documentToken: TOKEN, renderedSerial: RENDERED_SERIAL,
  surveyTarget: 'star',
  route: { mode: 'galaxy', gal: 999, galX: 90, galY: -60,
    star: null, starX: null, starY: null, planet: null, planetOrdinal: null, epoch: 0,
    navGalaxyKey: 'CF1|g:999@90,-60', navStarKey: null, navWorldKey: null },
  presentation: { cardOpen: true, cardTitle: 'Star Neris-125', actionOk: true, actionLabel: 'Enter system' },
} as const;

function fixture() {
  const beforeRuntime = { schema: 'cf-v2-f4-runtime/v1', revision: 3, commits: 4,
    sessionSeed: 91, sessionOrdinal: 2, sessionDraws: {}, staleWrites: 0, leaseLosses: 0,
    staleBlocked: false, activePlayMs: 100 };
  const afterRuntime = { ...beforeRuntime, revision: 4, commits: 5,
    sessionOrdinal: 3, activePlayMs: 125 };
  const beforeRaw = { revision: 3, revisionRaw: '3', seed: 91, ordinal: 2, draws: {}, receiptKeys: [], receiptRows: [] };
  const afterRaw = { revision: 4, revisionRaw: '4', seed: 91, ordinal: 3, draws: {},
    receiptKeys: ['receipt:2'], receiptRows: [{ ordinal: 2, kind: 'arc9-survey-v1' }] };
  const state = {
    mode: 'galaxy', gal: 999, galX: 90, galY: -60,
    star: null, starX: null, starY: null, planet: null, planetOrdinal: null, epoch: 0,
    navGalaxyKey: 'CF1|g:999@90,-60', navStarKey: null, navWorldKey: null,
    cardOpen: true, cardTitle: 'Star Neris-125',
    renderedScene: { serial: 8, mode: 'galaxy', ecologyEpoch: 0,
      galaxyKey: 'CF1|g:999@90,-60', starKey: null, worldKey: null },
    persistence: { lastOutcome: 'arc9-survey-committed:4', runtime: afterRuntime },
    landing: { schema: 'cf-v2-arc0-landing-app-state/v1', surveyOutcome: 'committed:star:records', actionCoordinator: {
      inFlight: false,
      owner: { schema: 'cf-v2-product-action-coordinator-diagnostics/v1', busy: false, operation: null },
      hold: { schema: 'cf-v2-product-action-hold-diagnostics/v1', phase: 'idle', operation: null, sequence: 0 },
      faultArmed: { storageFailure: false, staleAuthority: false, publicationFailure: false }, lastFault: null,
    } },
  };
  return { documentToken: TOKEN, action: { ok: true, label: 'Enter system' }, state,
    beforeAuthority: { token: TOKEN, raw: beforeRaw,
      state: { persistence: { runtime: beforeRuntime, lastOutcome: 'checkpoint:3' } } },
    afterAuthority: { token: TOKEN, raw: afterRaw, state } };
}

function assess(value: ReturnType<typeof fixture>) { return assessEarlyCoreFlowActionFixedPoint(value, EXPECTED); }
function mutate(path: string, value: unknown) {
  const candidate = structuredClone(fixture()) as Record<string, any>;
  const parts = path.split('.'); let owner: Record<string, any> = candidate;
  for (const part of parts.slice(0, -1)) owner = owner[part];
  owner[parts.at(-1)!] = value; return candidate as ReturnType<typeof fixture>;
}
async function runPureCausalSequence(observations: ReturnType<typeof fixture>[], downstream: () => void) {
  for (const observation of observations) {
    if (assess(observation).status === 'ready') { downstream(); return { status: 'proceeded', stops: 0 }; }
  }
  return { status: 'stopped', stops: 1 };
}

function currentFixture() {
  const value = fixture();
  value.afterAuthority.raw = structuredClone(value.beforeAuthority.raw);
  value.state.persistence.runtime = structuredClone(value.beforeAuthority.state.persistence.runtime);
  value.state.persistence.runtime.activePlayMs += 25;
  value.state.persistence.lastOutcome = value.beforeAuthority.state.persistence.lastOutcome;
  value.state.landing.surveyOutcome = 'current:star';
  value.afterAuthority.state = value.state;
  return value;
}

describe('early core-flow Survey fixed point', () => {
  it('executes one object-valued Survey surface across all three journey drivers', () => {
    const state = { mode: 'galaxy', cardOpen: true };
    const actionExpression = `(()=>{window.actionCalls+=1;return {ok:true,label:'Enter system'};})()`;
    const expression = buildEarlyCoreFlowActionSurfaceExpression(actionExpression);
    const makeWindow = () => ({
      actionCalls: 0,
      __CF_SLICE__: {
        documentToken: TOKEN,
        api: { state: () => state },
      },
    });
    const window = makeWindow();
    const execute = new Function('window', `return ${expression};`);
    expect(execute(window)).toEqual({
      documentToken: TOKEN,
      state,
      action: { ok: true, label: 'Enter system' },
    });
    expect(window.actionCalls).toBe(1);
    expect(() => buildEarlyCoreFlowActionSurfaceExpression('')).toThrow(TypeError);

    const malformedOuterCall = new Function('window', `return ${expression}();`);
    expect(() => malformedOuterCall(makeWindow())).toThrow(TypeError);
    expect(sliceSmokeSource.match(
      /await eval(?:In|K|NavPh)\(\s*buildEarlyCoreFlowActionSurfaceExpression\(actionExpression\)\s*,?\s*\)/gu,
    )).toHaveLength(3);
    expect(sliceSmokeSource).not.toMatch(/action:\$\{actionExpression\}\s*\}\)\(\)/u);
  });

  it('composes exact route/render/card presentation around one settled Survey commit', () => {
    expect(assess(fixture())).toEqual({ status: 'ready', reasons: [] });
  });
  it.each([
    ['outer token', 'documentToken', 'replacement-token', 'document identity'],
    ['before token', 'beforeAuthority.token', 'replacement-token', 'document identity'],
    ['after token', 'afterAuthority.token', 'replacement-token', 'document identity'],
    ['mode', 'state.mode', 'universe', 'core-flow route authority'],
    ['galaxy', 'state.gal', 998, 'core-flow route authority'],
    ['galaxy x', 'state.galX', 91, 'core-flow route authority'],
    ['galaxy y', 'state.galY', -59, 'core-flow route authority'],
    ['star', 'state.star', 424242, 'core-flow route authority'],
    ['star x', 'state.starX', 560, 'core-flow route authority'],
    ['star y', 'state.starY', 170, 'core-flow route authority'],
    ['planet', 'state.planet', 133, 'core-flow route authority'],
    ['planet ordinal', 'state.planetOrdinal', 0, 'core-flow route authority'],
    ['galaxy key', 'state.navGalaxyKey', 'wrong', 'core-flow route authority'],
    ['star key', 'state.navStarKey', 'wrong', 'core-flow route authority'],
    ['world key', 'state.navWorldKey', 'wrong', 'core-flow route authority'],
    ['epoch', 'state.epoch', 1, 'core-flow route authority'],
    ['render serial', 'state.renderedScene.serial', RENDERED_SERIAL + 1, 'core-flow rendered receipt identity'],
    ['render mode', 'state.renderedScene.mode', 'universe', 'core-flow rendered receipt identity'],
    ['render epoch', 'state.renderedScene.ecologyEpoch', 1, 'core-flow rendered receipt identity'],
    ['render galaxy', 'state.renderedScene.galaxyKey', 'wrong', 'core-flow rendered receipt identity'],
    ['render star', 'state.renderedScene.starKey', 'wrong', 'core-flow rendered receipt identity'],
    ['render world', 'state.renderedScene.worldKey', 'wrong', 'core-flow rendered receipt identity'],
    ['card open', 'state.cardOpen', false, 'core-flow card/action presentation'],
    ['card title', 'state.cardTitle', 'Sun (Sol)', 'core-flow card/action presentation'],
    ['action readiness', 'action.ok', false, 'core-flow card/action presentation'],
    ['action label', 'action.label', 'Land', 'core-flow card/action presentation'],
  ])('rejects isolated owned %s drift', (_label, path, value, reason) => {
    expect(assess(mutate(path, value)).reasons).toContain(reason);
  });
  it('reuses the single-action assessor for revision, receipt, outcome, and coordinator mutants', () => {
    const controls = [mutate('afterAuthority.raw.revision', 3), mutate('afterAuthority.raw.receiptRows.0.kind', 'wrong'),
      mutate('state.persistence.lastOutcome', 'arc9-survey-committed:3'),
      mutate('state.landing.surveyOutcome', 'refused:authority-changed'),
      mutate('state.landing.actionCoordinator.inFlight', true),
      mutate('state.persistence.runtime.schema', 'wrong-runtime'),
      mutate('state.persistence.runtime.sessionSeed', 92),
      mutate('state.persistence.runtime.sessionOrdinal', 2),
      mutate('state.persistence.runtime.sessionDraws', { drift: 1 })];
    for (const control of controls) {
      const result = assess(control); expect(result.status).toBe('pending');
      expect(result.reasons.some((reason: string) => reason.startsWith('Survey action commit:'))).toBe(true);
    }
  });
  it('accepts an exact current Survey fixed point without inventing a second receipt', () => {
    expect(assessEarlyCoreFlowActionFixedPoint(currentFixture(), {
      ...EXPECTED, settlement: 'current',
    })).toEqual({ status: 'ready', reasons: [] });
  });
  it('accepts either an exact commit or a source-current no-write result when target class is fixture-dependent', () => {
    const expected = { ...EXPECTED, settlement: 'either' } as const;
    expect(assessEarlyCoreFlowActionFixedPoint(fixture(), expected)).toEqual({ status: 'ready', reasons: [] });
    expect(assessEarlyCoreFlowActionFixedPoint(currentFixture(), expected)).toEqual({ status: 'ready', reasons: [] });
  });
  it('rejects current Survey authority, outcome, or coordinator drift', () => {
    const authority = currentFixture(); authority.afterAuthority.raw.revision = 4;
    const outcome = currentFixture(); outcome.state.persistence.lastOutcome = 'changed';
    const coordinator = currentFixture(); coordinator.state.landing.actionCoordinator.owner.busy = true;
    const retainedFault = currentFixture();
    (retainedFault.state.landing.actionCoordinator as { lastFault: unknown }).lastFault = {
      kind: 'stale-authority',
    };
    const surveyOutcome = currentFixture(); surveyOutcome.state.landing.surveyOutcome = 'refused:authority-changed';
    const runtime = currentFixture(); runtime.state.persistence.runtime.sessionOrdinal += 1;
    const pairedRevision = currentFixture();
    pairedRevision.beforeAuthority.state.persistence.runtime.revision = 99;
    pairedRevision.state.persistence.runtime.revision = 99;
    const pairedSeed = currentFixture();
    pairedSeed.beforeAuthority.state.persistence.runtime.sessionSeed = 92;
    pairedSeed.state.persistence.runtime.sessionSeed = 92;
    const pairedOrdinal = currentFixture();
    pairedOrdinal.beforeAuthority.state.persistence.runtime.sessionOrdinal = 9;
    pairedOrdinal.state.persistence.runtime.sessionOrdinal = 9;
    const pairedDraws = currentFixture();
    pairedDraws.beforeAuthority.state.persistence.runtime.sessionDraws = { drift: 1 };
    pairedDraws.state.persistence.runtime.sessionDraws = { drift: 1 };
    for (const control of [
      authority, outcome, coordinator, retainedFault, surveyOutcome, runtime,
      pairedRevision, pairedSeed, pairedOrdinal, pairedDraws,
    ]) {
      expect(assessEarlyCoreFlowActionFixedPoint(control, {
        ...EXPECTED, settlement: 'current',
      }).reasons).toContain('Survey current fixed point: exact no-write authority, current outcome, and idle coordinator');
    }
  });
  it('keeps the exact hosted pending Survey action pending', () => {
    const hosted = fixture() as any; const coordinator = hosted.state.landing.actionCoordinator;
    coordinator.inFlight = true; coordinator.owner.busy = true; coordinator.owner.operation = 'arc9.survey-star';
    coordinator.hold.phase = 'holding'; coordinator.hold.operation = 'arc9.survey-star'; coordinator.hold.sequence = 1;
    const result = assess(hosted); expect(result.status).toBe('pending');
    expect(result.reasons).toContain('Survey action commit: idle clear landing action coordinator');
  });
  it('polls pending to ready and proceeds exactly once', async () => {
    const downstream = vi.fn(); const pending = mutate('state.landing.actionCoordinator.owner.busy', true);
    expect(await runPureCausalSequence([pending, pending, fixture(), fixture()], downstream)).toEqual({ status: 'proceeded', stops: 0 });
    expect(downstream).toHaveBeenCalledTimes(1);
  });
  it('stops permanent pending exactly once with zero downstream stages', async () => {
    const downstream = vi.fn(); const pending = mutate('state.landing.actionCoordinator.owner.busy', true);
    expect(await runPureCausalSequence([pending, pending], downstream)).toEqual({ status: 'stopped', stops: 1 });
    expect(downstream).not.toHaveBeenCalled();
  });
});

describe('bounded F4 action sequence fixed point', () => {
  function twoCommitFixture() {
    const value = fixture();
    value.afterAuthority.raw = {
      ...value.afterAuthority.raw,
      revision: 5,
      revisionRaw: '5',
      ordinal: 4,
      receiptKeys: ['receipt:2', 'receipt:3'],
      receiptRows: [
        { ordinal: 2, kind: 'arc0-world-name' },
        { ordinal: 3, kind: 'arc9-share-follow-v1' },
      ],
    };
    value.state.persistence.runtime = {
      ...value.state.persistence.runtime,
      revision: 5,
      commits: 6,
      sessionOrdinal: 4,
    };
    value.state.persistence.lastOutcome = 'arc9-share-follow-committed:5';
    value.afterAuthority.state = value.state;
    return value;
  }
  const assessSequence = (value: ReturnType<typeof twoCommitFixture>) =>
    assessF4ActionCommitSequence({
      beforeAuthority: value.beforeAuthority,
      afterAuthority: value.afterAuthority,
      state: value.state,
      expectedKinds: ['arc0-world-name', 'arc9-share-follow-v1'],
      expectedPersistenceLastOutcome: 'arc9-share-follow-committed:5',
    });

  it('accepts one exact two-receipt named Follow sequence', () => {
    expect(assessSequence(twoCommitFixture())).toEqual({ ok: true, reasons: [] });
  });

  it('accepts an ordinal 9 to 10 tail independent of IndexedDB key order', () => {
    const value = twoCommitFixture();
    value.beforeAuthority.raw.revision = 20;
    value.beforeAuthority.raw.revisionRaw = '20';
    value.beforeAuthority.raw.ordinal = 9;
    value.beforeAuthority.state.persistence.runtime.revision = 20;
    value.beforeAuthority.state.persistence.runtime.commits = 4;
    value.beforeAuthority.state.persistence.runtime.sessionOrdinal = 9;
    value.afterAuthority.raw.revision = 22;
    value.afterAuthority.raw.revisionRaw = '22';
    value.afterAuthority.raw.ordinal = 11;
    value.afterAuthority.raw.receiptKeys = ['receipt:10', 'receipt:9'];
    value.afterAuthority.raw.receiptRows = [
      { ordinal: 10, kind: 'arc9-share-follow-v1' },
      { ordinal: 9, kind: 'arc0-world-name' },
    ];
    value.state.persistence.runtime.revision = 22;
    value.state.persistence.runtime.commits = 6;
    value.state.persistence.runtime.sessionOrdinal = 11;
    value.state.persistence.lastOutcome = 'arc9-share-follow-committed:22';
    expect(assessF4ActionCommitSequence({
      beforeAuthority: value.beforeAuthority,
      afterAuthority: value.afterAuthority,
      state: value.state,
      expectedKinds: ['arc0-world-name', 'arc9-share-follow-v1'],
      expectedPersistenceLastOutcome: 'arc9-share-follow-committed:22',
    })).toEqual({ ok: true, reasons: [] });
  });

  it.each([
    ['revision', (value: ReturnType<typeof twoCommitFixture>) => { value.afterAuthority.raw.revision = 4; }, 'exact raw revision span'],
    ['runtime', (value: ReturnType<typeof twoCommitFixture>) => { value.state.persistence.runtime.commits = 5; }, 'exact live runtime span'],
    ['runtime schema', (value: ReturnType<typeof twoCommitFixture>) => { value.state.persistence.runtime.schema = 'wrong-runtime'; }, 'exact live runtime span'],
    ['runtime seed parity', (value: ReturnType<typeof twoCommitFixture>) => { value.state.persistence.runtime.sessionSeed = 92; }, 'exact live/raw SessionRNG parity'],
    ['runtime ordinal parity', (value: ReturnType<typeof twoCommitFixture>) => { value.state.persistence.runtime.sessionOrdinal = 3; }, 'exact live/raw SessionRNG parity'],
    ['runtime draws parity', (value: ReturnType<typeof twoCommitFixture>) => { value.state.persistence.runtime.sessionDraws = { drift: 1 }; }, 'exact live/raw SessionRNG parity'],
    ['receipt order', (value: ReturnType<typeof twoCommitFixture>) => { value.afterAuthority.raw.receiptRows.reverse(); }, 'exact action receipt sequence'],
    ['outcome', (value: ReturnType<typeof twoCommitFixture>) => { value.state.persistence.lastOutcome = 'arc0-world-name-committed:4'; }, 'exact persistence outcome'],
    ['coordinator', (value: ReturnType<typeof twoCommitFixture>) => { value.state.landing.actionCoordinator.owner.busy = true; }, 'idle clear landing action coordinator'],
  ])('rejects isolated %s drift', (_label, mutateSequence, reason) => {
    const value = twoCommitFixture(); mutateSequence(value);
    expect(assessSequence(value).reasons).toContain(reason);
  });
});
