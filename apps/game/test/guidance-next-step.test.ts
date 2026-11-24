// The next step, its nudge, the objective chip and the quest log. No fixture: every expectation is taken from
// the legacy game and cites its line. Charter titles and descriptions are placeholders: the rules do not read them.
import { projectWeeklyCharterBoardV1, weeklyCharterSlateV1, type SaveStateV2 } from '@cf/persistence';
import { ASC_CHAPTERS_DATA } from '@cf/scene';
import { describe, expect, it } from 'vitest';
import {
  IDLE_NUDGE_MS, IDLE_POLL_MS, LOGIN_NUDGE_MS, QUEST_LOG_WORDS,
  chipProgressMoved, guidanceView, nextStepGoal, nudgeCopy, objectiveChip, projectStarterCharterBoardV1, questLog, shouldNudge,
  type GuidanceCharter, type GuidanceView, type NextStep,
} from '../src/guidance';

const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|️|⃣/u;
const charter = (id: string, over: Partial<GuidanceCharter> = {}): GuidanceCharter => ({
  id, title: `Title ${id}`, description: `Describe ${id}.`, count: 1, progress: 0, pays: 10, weekly: id.startsWith('wk-'), ...over,
});
/** A trained explorer with nothing to do and nothing owned: every rule's condition is false until a test sets it. */
const view = (over: Partial<GuidanceView> = {}): GuidanceView => ({
  trained: true, chapter: null, accepted: [], available: [], week: 7, signatures: 9,
  craftable: null, atlasEntries: 0, flora: 0, fauna: 0, ...over,
});
const CHAPTER = { name: 'Chapter 1 — Off the Rock', goal: { id: 'c1-land', text: 'Make planetfall on 2 worlds of Sol', count: 2, progress: 1 } };
const said = (...keys: string[]): ReadonlySet<string> => new Set(keys);

describe('the next step', () => {
  it('the three durations are the legacy game\'s', () => {
    expect(LOGIN_NUDGE_MS).toBe(14_000);    // LEGACY main.js:22518
    expect(IDLE_NUDGE_MS).toBe(300_000);    // LEGACY main.js:22520 (5*6e4)
    expect(IDLE_POLL_MS).toBe(60_000);      // LEGACY main.js:22521
  });

  it('rung 1: the chapter goal outranks every charter', () => {
    // LEGACY main.js:22471-22477
    const step = nextStepGoal(view({ chapter: CHAPTER, accepted: [charter('st-land')], available: [charter('st-mercury')], signatures: 0 }));
    expect(step).toEqual({ kind: 'chapter', key: 'asc:c1-land', title: 'Off the Rock', goal: 'Make planetfall on 2 worlds of Sol', done: 1, of: 2 });
    // progress never reads past the goal (LEGACY main.js:22475)
    const over = nextStepGoal(view({ chapter: { ...CHAPTER, goal: { ...CHAPTER.goal, progress: 5 } } }));
    expect(over).toMatchObject({ done: 2, of: 2 });
  });

  it('rung 2: with no chapter goal, the first accepted charter', () => {
    // LEGACY main.js:22482-22486
    const step = nextStepGoal(view({
      accepted: [charter('st-mine', { count: 3, progress: 9, pays: 15 }), charter('st-land')], available: [charter('st-mercury')], signatures: 0,
    }));
    expect(step).toEqual({ kind: 'charter', key: 'ch:st-mine', title: 'Title st-mine', description: 'Describe st-mine.', pays: 15, done: 3, of: 3 });
  });

  it('rung 3: with none accepted, the first charter waiting for its accept', () => {
    // LEGACY main.js:22488-22492
    const step = nextStepGoal(view({ available: [charter('st-mercury', { pays: 10 }), charter('st-land')], signatures: 0 }));
    expect(step).toEqual({ kind: 'charter-waiting', key: 'chacc:st-mercury', title: 'Title st-mercury', pays: 10 });
  });

  it('a weekly charter\'s key carries its week, so the same charter is said again on a new board', () => {
    // LEGACY main.js:22485 and main.js:22491
    expect(nextStepGoal(view({ accepted: [charter('wk-land')], week: 7 }))).toMatchObject({ key: 'ch:wk-land:7' });
    expect(nextStepGoal(view({ available: [charter('wk-land')], week: 8 }))).toMatchObject({ key: 'chacc:wk-land:8' });
  });

  it('rung 4: with a clear board, the long road while Signatures remain', () => {
    // LEGACY main.js:22494-22496
    expect(nextStepGoal(view({ signatures: 2 }))).toEqual({ kind: 'long-road', key: 'prime:2', signaturesLeft: 7 });
    expect(nextStepGoal(view({ signatures: 8 }))).toEqual({ kind: 'long-road', key: 'prime:8', signaturesLeft: 1 });
    expect(nextStepGoal(view({ signatures: 9 }))).toBeNull();
  });

  it('there is no next step in training', () => {
    // LEGACY main.js:22470
    expect(nextStepGoal(view({ trained: false, chapter: CHAPTER, accepted: [charter('st-land')], signatures: 0 }))).toBeNull();
  });
});

describe('the nudge', () => {
  const step = nextStepGoal(view({ chapter: CHAPTER }))!;
  const quiet = { training: false, modalOpen: false, saidThisSession: said() };

  it('speaks for a goal not yet said, outside training, with no modal open', () => {
    expect(shouldNudge(step, quiet)).toBe(true);
    expect(shouldNudge(null, quiet)).toBe(false);   // LEGACY main.js:22503
  });
  it('silent in training', () => {
    expect(shouldNudge(step, { ...quiet, training: true })).toBe(false);   // LEGACY main.js:22464, main.js:22470
  });
  it('silent with a modal open', () => {
    expect(shouldNudge(step, { ...quiet, modalOpen: true })).toBe(false);   // LEGACY main.js:22504-22509
  });
  it('never twice for the same key', () => {
    // LEGACY main.js:22503, main.js:22510
    expect(shouldNudge(step, { ...quiet, saidThisSession: said('asc:c1-land') })).toBe(false);
    expect(shouldNudge(step, { ...quiet, saidThisSession: said('asc:c1-mine') })).toBe(true);
  });

  it('the words are the legacy game\'s, each emoji an icon name', () => {
    const compass = 'compass', scroll = { icon: 'charter' }, dust = { icon: 'stardust' };
    // LEGACY main.js:22476-22477
    expect(nudgeCopy(step)).toEqual({
      icon: compass, title: 'Next Step — Off the Rock', opens: 'charters',
      message: ['Make planetfall on 2 worlds of Sol (1 / 2). The chapter rides atop your ', scroll, ' Charters board.'],
    });
    // a goal of one shows no count (LEGACY main.js:22477)
    expect(nudgeCopy({ ...step, done: 0, of: 1 } as NextStep).message[0]).toBe('Make planetfall on 2 worlds of Sol. The chapter rides atop your ');
    // LEGACY main.js:22485-22486
    expect(nudgeCopy({ kind: 'charter', key: 'ch:a', title: 'Deep veins', description: 'Mine deposits 3 times.', pays: 20, done: 1, of: 3 })).toEqual({
      icon: compass, title: 'Next Charter — Deep veins', opens: 'charters',
      message: ['Mine deposits 3 times. (1 / 3) Pays +20 ', dust, ' on completion.'],
    });
    expect(nudgeCopy({ kind: 'charter', key: 'ch:a', title: 'T', description: 'Land.', pays: 10, done: 0, of: 1 }).message[0]).toBe('Land. Pays +10 ');
    // LEGACY main.js:22491-22492
    expect(nudgeCopy({ kind: 'charter-waiting', key: 'chacc:a', title: 'Deep veins', pays: 20 })).toEqual({
      icon: compass, title: 'A Charter Awaits — Deep veins', opens: 'charters',
      message: ['Accept it on the ', scroll, ' Charters board — pays +20 ', dust, '.'],
    });
    // LEGACY main.js:22495-22496: no destination; one Signature left reads in the singular
    expect(nudgeCopy({ kind: 'long-road', key: 'prime:2', signaturesLeft: 7 })).toEqual({
      icon: compass, title: 'The Long Road', opens: null,
      message: ['The board is clear — the Prime Codex waits. 7 Signatures left; the ✦ Prime Codex (the dock — or the right rail on desktop) names the next.'],
    });
    expect(nudgeCopy({ kind: 'long-road', key: 'prime:8', signaturesLeft: 1 }).message[0]).toContain(' 1 Signature left;');
    for (const s of [step, { kind: 'long-road', key: 'k', signaturesLeft: 3 } as const]) expect(JSON.stringify(nudgeCopy(s))).not.toMatch(EMOJI);
  });
});

describe('the objective chip', () => {
  it('shows the first accepted charter before the chapter goal, with its count and how many more are accepted', () => {
    // LEGACY main.js:22537-22540 (an accepted charter outranks the chapter: it was chosen) and main.js:22609-22611
    const chip = objectiveChip(view({ chapter: CHAPTER, accepted: [charter('st-mine', { count: 3, progress: 1 }), charter('st-land')] }), false);
    expect(chip).toEqual({ kind: 'objective', key: 'ch:st-mine', icon: 'charter', text: 'Title st-mine', done: 1, of: 3, count: '1 / 3', more: 1 });
  });
  it('else shows the chapter goal', () => {
    // LEGACY main.js:22541-22546
    expect(objectiveChip(view({ chapter: CHAPTER }), false))
      .toEqual({ kind: 'objective', key: 'asc:c1-land', icon: 'up', text: 'Make planetfall on 2 worlds of Sol', done: 1, of: 2, count: '1 / 2', more: 0 });
  });
  it('cuts the title at 34 characters', () => {
    // LEGACY main.js:22609
    const long = 'A charter with a very long title indeed, longer than the chip';
    expect(objectiveChip(view({ accepted: [charter('st-land', { title: long })] }), false)).toMatchObject({ text: long.slice(0, 34) });
  });
  it('with no objective the suggestion shows at once', () => {
    // LEGACY main.js:22564 and main.js:22598-22604
    expect(objectiveChip(view(), false)).toEqual({ kind: 'suggestion', key: 'stall', icon: 'idea', text: 'Survey a world and press Land', opens: 'map' });
  });
  it('when stalled the suggestion stands in for the objective, cut at 44 characters', () => {
    // LEGACY main.js:22598-22601
    const v = view({ chapter: CHAPTER, available: [charter('st-mercury', { title: 'A very long charter title that runs past the chip' })] });
    expect(objectiveChip(v, false)).toMatchObject({ kind: 'objective' });
    expect(objectiveChip(v, true)).toEqual({
      kind: 'suggestion', key: 'stall', icon: 'idea', text: 'Accept a charter — A very long charter title that runs past the chip'.slice(0, 44), opens: 'charters',
    });
  });
  it('shows nothing in training', () => {
    // LEGACY main.js:22536 and main.js:22873
    expect(objectiveChip(view({ trained: false, chapter: CHAPTER, accepted: [charter('st-land')] }), true)).toBeNull();
  });
  it('pulses when its own goal\'s progress moves up, and at no other time', () => {
    // LEGACY main.js:22613-22616; after a suggestion the last chip is the stall's (main.js:22604)
    const at = (v: GuidanceView, stalled = false) => objectiveChip(v, stalled);
    const one = at(view({ chapter: CHAPTER })), two = at(view({ chapter: { ...CHAPTER, goal: { ...CHAPTER.goal, progress: 2 } } }));
    expect(chipProgressMoved(one, two)).toBe(true);
    expect(chipProgressMoved(two, one)).toBe(false);
    expect(chipProgressMoved(one, one)).toBe(false);
    expect(chipProgressMoved(null, two)).toBe(false);
    expect(chipProgressMoved(at(view({ chapter: CHAPTER }), true), two)).toBe(false);
    expect(chipProgressMoved(at(view({ accepted: [charter('st-land')] })), two)).toBe(false);
  });
});

describe('the quest log', () => {
  it('lists the chapter goal, then every accepted charter, each with its progress', () => {
    // LEGACY main.js:22640-22655
    const log = questLog(view({ chapter: CHAPTER, accepted: [charter('st-mine', { count: 3, progress: 1 }), charter('st-land', { progress: 4 })] }));
    expect(log).toEqual({
      chapter: { icon: 'up', text: 'Make planetfall on 2 worlds of Sol', done: 1, of: 2, count: '1 / 2', percent: 50 },
      charters: [
        { icon: 'charter', text: 'Title st-mine', done: 1, of: 3, count: '1 / 3', percent: 33 },
        { icon: 'charter', text: 'Title st-land', done: 1, of: 1, count: '1 / 1', percent: 100 },
      ],
      empty: false,
    });
  });
  it('says so when there is nothing to list', () => {
    // LEGACY main.js:22657: the line stands in only when no row at all was written
    expect(questLog(view())).toEqual({ chapter: null, charters: [], empty: true });
    expect(questLog(view({ chapter: CHAPTER }))).toMatchObject({ charters: [], empty: false });
    expect(questLog(view({ accepted: [charter('st-land')] }))).toMatchObject({ chapter: null, empty: false });
    // LEGACY main.js:22657-22658
    expect(QUEST_LOG_WORDS).toEqual({
      heading: 'Quest log', empty: 'No contract accepted — open the board and take one.', foot: { icon: 'charter', text: 'Open the Charters board' },
    });
  });
  it('there is no quest log in training', () => {
    // LEGACY main.js:22631
    expect(questLog(view({ trained: false, chapter: CHAPTER }))).toBeNull();
  });
});

describe('the view, read from the save and the two boards', () => {
  const state = (over: Partial<SaveStateV2> = {}): SaveStateV2 => ({
    EPOCH_BASE: 0, essence: 10, explorerName: 'Dakk', lastAnomKey: null,
    stats: { essenceEarned: 20, bestRank: 0 }, pstats: {}, hp: 10, HP_MAX: 10,
    customNames: [], conquered: [], cargo: [], cgx: [], items: [], equip: {}, equipAff: {},
    pinnedRecipe: null, cargoTab: 'mat', seenSp: [], journal: [], mined: [], mineX: [], skimX: [],
    bioX: [], techOwned: [], claimedSets: [], ascCh: 0, ascProg: {}, nameHue: -1,
    savedView: null, fsMode: '', toneMode: '', fontMode: '', sndOn: true, fxOn: true,
    chartsOn: true, shakeOn: true, salvageConfirm: true, notifOn: true, tipsOn: true,
    sfxVol: 1, glassTint: 0, motionMode: 0, cardExpand: 0, notifications: [],
    surveyedSet: [], galSeen: [], surfSeen: [133], xpFirsts: [], sysSeen: [], starKindsSeen: [],
    ptypesSeen: [], eventKeysSeen: [], evAnnounced: [], unlocked: [], landed: [], contacted: [],
    waveOffs: [], primeFill: {}, frontierUnlocked: false, frontierEnding: null, seenGuide: false,
    tutDone: true, rnSeen: '', tutSnapPending: null, scoutId: null, chWeek: -1, chProg: {},
    chacc: [], chDone: [], homeId: null, voiceOn: true, combatSfxOn: true, logMap: [], codex: [],
    ...over,
  });
  const read = (s: SaveStateV2, craftable: string | null = null): GuidanceView => {
    const starter = projectStarterCharterBoardV1(s);
    if (starter.kind !== 'projected') throw new Error(starter.reason);
    return guidanceView({ state: s, starter: starter.board, weekly: projectWeeklyCharterBoardV1(s, 0), craftable });
  };
  const entry = (kind: string) => ({ id: 'x', name: 'x', kind, tier: 0, realm: '', sapient: 0, from: '', hybrid: false, g: {}, where: null });

  it('a new explorer: the first unmet goal of the chapter, and one waiting charter per chain', () => {
    const v = read(state({ ascProg: { 'c1-land': 2, 'c1-mine': 3 } }));
    // LEGACY main.js:22473: the first goal still short of its count
    expect(v.chapter).toEqual({ name: ASC_CHAPTERS_DATA[0]!.name, goal: { id: 'c1-mine', text: ASC_CHAPTERS_DATA[0]!.goals[1]!.t, count: 8, progress: 3 } });
    // LEGACY main.js:22379-22387: the chains in order, then the weekly board
    expect(v.available.map((c) => c.id)).toEqual(['st-land', 'st-mercury']);
    expect(v).toMatchObject({ trained: true, accepted: [], signatures: 0, craftable: null, atlasEntries: 0, flora: 0, fauna: 0 });
  });

  it('accepted charters stand in the order they were accepted, starter and weekly together', () => {
    // LEGACY main.js:22389-22395: the order of the accepted set
    const trades = ['st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq'];
    const [first, second, third] = weeklyCharterSlateV1(0);
    const v = read(state({ chDone: trades, chWeek: 0, chacc: [second!, 'st-mercury', first!], chProg: { [second!]: 1 } }));
    expect(v.accepted.map((c) => c.id)).toEqual([second, 'st-mercury', first]);
    expect(v.accepted.map((c) => c.weekly)).toEqual([true, false, true]);
    expect(v.accepted[0]!.progress).toBe(1);
    expect(v.available.map((c) => c.id)).toEqual([third]);
    expect(v.week).toBe(0);
  });

  it('counts what the suggestions read: Signatures, Atlas entries, flora and fauna; the chapters end', () => {
    // LEGACY main.js:21949 (Signatures), main.js:22874-22875 (kinds), main.js:22888 (the Atlas), main.js:22825 (no chapter after the last)
    const sig = { title: '', sub: '', tier: 0, hex: '', where: null };
    const v = read(state({
      ascCh: ASC_CHAPTERS_DATA.length, primeFill: { a: sig, b: sig }, logMap: [['k', {}]],
      codex: [['1', entry('Fauna')], ['2', entry('Flora')], ['3', entry('Fauna')], ['4', entry('Fungi')]], tutDone: false,
    }), 'Jump Drive');
    expect(v).toMatchObject({ trained: false, chapter: null, signatures: 2, atlasEntries: 1, flora: 1, fauna: 2, craftable: 'Jump Drive' });
  });

  it('a chapter whose goals are all met shows no goal', () => {
    // LEGACY main.js:22473-22474: no unmet goal, so the charters speak
    const met = Object.fromEntries(ASC_CHAPTERS_DATA[0]!.goals.map((g) => [g.id, g.n]));
    expect(read(state({ ascProg: met })).chapter).toBeNull();
  });
});
