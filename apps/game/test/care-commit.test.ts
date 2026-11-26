// The check after storage: a care action says committed only when what storage holds is what the action staged.
// Each test lets the real commit run and then hands the action a stored state that is not the staged one.
import { describe, expect, it } from 'vitest';
import type { SaveStateV2 } from '@cf/persistence';
import {
  bioscanFenceV1, settleBioscanV1, settleRenameV1, settleScoutV1, type CareAuthority, type CareCommitted, type CareDoor, type CareTransaction,
} from '../src/care';
import { carePage, clearSession, earthId, heldPage, strikeSession, type CarePage } from './care-support';
import { EARTH } from './capture-support';
import { NOW } from './save-support';

type Lie = (committed: CareCommitted) => CareCommitted;
/** The page's door, with storage's committed answer changed on its way back to the action. */
function lyingDoor(page: CarePage, lie: Lie): CareDoor {
  const changed = (answer: CareTransaction): CareTransaction => answer.kind === 'committed' ? lie(answer) : answer;
  return {
    settle: (kind, commit) => page.loop.settle(kind, (runtime: CareAuthority, durable: SaveStateV2) => commit({
      get extensions() { return runtime.extensions; },
      commitAction: async (input) => changed(await runtime.commitAction(input)),
      commitMultiOutcome: async (input) => changed(await runtime.commitMultiOutcome(input)),
    }, durable)),
  };
}
/** Storage answers with this state, as the state it stored. */
const stored = (change: (state: SaveStateV2) => SaveStateV2): Lie => (committed) => {
  const state = change(committed.state);
  return { ...committed, state, saved: { ...committed.saved, canonicalState: state } } as CareCommitted;
};

describe('the check after storage', () => {
  const scan = (page: CarePage, lie: Lie) =>
    settleBioscanV1({ door: lyingDoor(page, lie), charters: page.deps.charters }, { address: EARTH, shown: bioscanFenceV1(page.durable(), EARTH), codecNow: NOW });

  it('an honest door commits', async () => {
    const page = await carePage({ sessionSeed: clearSession() });
    expect(await scan(page, (committed) => committed)).toMatchObject({ kind: 'committed', facts: { scanned: true } });
  });

  it('a scan whose stored state is not the staged one is not called committed, whatever is missing', async () => {
    const cases: Array<[string, Lie, { sessionSeed: number; held?: ReturnType<typeof heldPage>[]; scout?: string }]> = [
      ['health', stored((state) => ({ ...state, hp: state.hp - 1 })), { sessionSeed: clearSession() }],
      ['surveyed-set', stored((state) => ({ ...state, surveyedSet: [] })), { sessionSeed: clearSession() }],
      ['surveys', stored((state) => ({ ...state, stats: { ...state.stats, surveys: 7 } })), { sessionSeed: clearSession() }],
      ['achievements', stored((state) => ({ ...state, unlocked: state.unlocked.filter((id) => id !== 'survivor') })), { sessionSeed: strikeSession() }],
      ['scout', stored((state) => ({ ...state, codex: state.codex.map(([id, entry]) => [id, { ...entry, g: { ...entry.g, hurt: 0 } }]) })),
        { sessionSeed: strikeSession(), held: [heldPage(11)], scout: earthId(11) }],
      ['state-not-stored', (committed) => ({ ...committed, state: { ...committed.state, hp: 5 } }) as CareCommitted, { sessionSeed: clearSession() }],
      ['receipt', (committed) => ({ ...committed, receipt: { ...committed.receipt, witness: 'another' } }) as CareCommitted, { sessionSeed: clearSession() }],
    ];
    for (const [missing, lie, options] of cases) {
      const page = await carePage(options);
      const outcome = await scan(page, lie);
      expect(outcome, missing).toMatchObject({ kind: 'committed-convergence', detail: `postcommit:${missing}` });
      expect('facts' in outcome, missing).toBe(false);
    }
  });

  it('a Scout press and a rename are held to the same check', async () => {
    const page = await carePage({ held: [heldPage(11)] });
    const scout = await settleScoutV1(
      { door: lyingDoor(page, stored((state) => ({ ...state, scoutId: null }))), charters: page.deps.charters }, { speciesId: earthId(11), codecNow: NOW });
    expect(scout).toMatchObject({ kind: 'committed-convergence', detail: 'postcommit:scout' });

    const naming = await carePage({ held: [heldPage(11)] });
    const live = () => naming.live;
    const unnamed = await settleRenameV1(
      { door: lyingDoor(naming, stored((state) => ({ ...state, customNames: [] }))), live }, { speciesId: earthId(11), rawName: 'Rex', codecNow: NOW });
    expect(unnamed).toMatchObject({ kind: 'committed-convergence', detail: 'postcommit:name' });
    const other = await carePage({ held: [heldPage(11)] });
    const page2 = await settleRenameV1(
      { door: lyingDoor(other, stored((state) => ({ ...state, codex: state.codex.map(([id, entry]) => [id, { ...entry, name: 'Another' }]) }))), live: () => other.live },
      { speciesId: earthId(11), rawName: 'Rex', codecNow: NOW });
    expect(page2).toMatchObject({ kind: 'committed-convergence', detail: 'postcommit:page' });
  });
});
