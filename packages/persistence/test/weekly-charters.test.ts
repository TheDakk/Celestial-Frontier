// Ported from SOURCE tests/starter-charters.test.ts:558-643, the tests of the weekly Charters on the expedition's
// own active-play clock that need this package alone.
import { describe, expect, it, vi } from 'vitest';
import {
  WEEKLY_CHARTER_CYCLE_ACTIVE_MS, WEEKLY_CHARTER_DEFINITIONS_V1, formatActivePlayRemainingV1, projectWeeklyCharterBoardV1,
  rollWeeklyCharterCycleV1, stageWeeklyCharterAcceptV1, stageWeeklyCharterEventV1, weeklyCharterCycleV1, weeklyCharterSlateV1,
  type SaveStateV2,
} from '@cf/persistence';

function state(): SaveStateV2 {
  return {
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
  };
}

const WEEK = WEEKLY_CHARTER_CYCLE_ACTIVE_MS;
const TRADES_DONE = ['st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq'];
const veteran = (): SaveStateV2 => { const s = state(); s.chDone = [...TRADES_DONE]; return s; };

describe('weekly Charters — the expedition keeps its own clock', () => {
  it('refuses a duplicated accepted Charter before it can issue two rewards', () => {
    const cycle = Array.from({ length: 40 }, (_, c) => c).find(c => weeklyCharterSlateV1(c).includes('wk-conq'))!;
    const s = veteran(); s.chWeek = cycle; s.chacc = ['wk-conq', 'wk-conq']; s.chProg = { 'wk-conq': 0 };
    const before = structuredClone(s);
    expect(stageWeeklyCharterEventV1({ draft: s, event: { kind: 'conquest' }, activePlayMs: cycle * WEEK }).kind).toBe('refused');
    expect(s).toEqual(before);
  });
  it('cycles are whole blocks of ACTIVE PLAY; the slate is deterministic, three distinct live Charters, and varies between cycles', () => {
    expect(weeklyCharterCycleV1(0)).toBe(0); expect(weeklyCharterCycleV1(WEEK - 1)).toBe(0); expect(weeklyCharterCycleV1(WEEK)).toBe(1);
    expect(() => weeklyCharterCycleV1(-1)).toThrow(); expect(() => weeklyCharterCycleV1(1.5)).toThrow();
    const live = new Set(WEEKLY_CHARTER_DEFINITIONS_V1.map((d) => d.id)), slates = new Set<string>();
    for (let c = 0; c < 40; c++) { const s = weeklyCharterSlateV1(c); expect(s).toEqual(weeklyCharterSlateV1(c)); expect(new Set(s).size).toBe(3); for (const id of s) expect(live.has(id)).toBe(true); slates.add(s.join()); }
    expect(slates.size).toBeGreaterThan(1);
  });
  it('THE CLOCK LAW: no weekly function reads the device clock — a ±10-year device-clock swing changes nothing; only active play rolls the board', () => {
    const now = vi.spyOn(Date, 'now'); let calls = 0; now.mockImplementation(() => { calls++; return 0; });
    try {
      const s = veteran(); const a = structuredClone(s), b = structuredClone(s);
      now.mockImplementation(() => { calls++; return 4_000_000_000_000; }); rollWeeklyCharterCycleV1(a, 3 * WEEK + 5);
      now.mockImplementation(() => { calls++; return 1; }); rollWeeklyCharterCycleV1(b, 3 * WEEK + 5);
      expect(a).toEqual(b); expect(calls).toBe(0);
      expect(projectWeeklyCharterBoardV1(s, 3 * WEEK + 5)).toEqual(projectWeeklyCharterBoardV1(s, 3 * WEEK + 5)); expect(calls).toBe(0);
    } finally { now.mockRestore(); }
  });
  it('rollover is forward-only and once per cycle: it expires weekly acceptances and progress, keeps starter acceptances, and normalizes a legacy calendar value with no payout', () => {
    const s = veteran(); s.chacc = ['st-mercury', 'wk-land']; s.chProg = { 'wk-land': 2, 'st-mercury': 0 }; s.chWeek = 4; s.essence = 50;
    const same = structuredClone(s); expect(rollWeeklyCharterCycleV1(same, 4 * WEEK + 1).rolled).toBe(false); expect(same).toEqual(s);
    const next = structuredClone(s), r = rollWeeklyCharterCycleV1(next, 5 * WEEK);
    expect(r).toMatchObject({ rolled: true, cycle: 5, expired: ['wk-land'] }); expect(next.chacc).toEqual(['st-mercury']); expect(next.chProg).toEqual({ 'st-mercury': 0 }); expect(next.chWeek).toBe(5); expect(next.essence).toBe(50);
    expect(rollWeeklyCharterCycleV1(next, 5 * WEEK + 99).rolled).toBe(false);
    const unopened = state(); const pristine = structuredClone(unopened); expect(rollWeeklyCharterCycleV1(unopened, 9 * WEEK).rolled).toBe(false); expect(unopened).toEqual(pristine); // no board yet → nothing written
    const staleImport = state(); staleImport.chacc = ['wk-conq']; expect(rollWeeklyCharterCycleV1(staleImport, 9 * WEEK)).toMatchObject({ rolled: true, expired: ['wk-conq'] }); expect(staleImport.chacc).toEqual([]);
    const legacy = structuredClone(s); legacy.chWeek = 2900; // a v1 calendar-week number
    expect(rollWeeklyCharterCycleV1(legacy, 7 * WEEK).cycle).toBe(7); expect(legacy.chWeek).toBe(7); expect(legacy.essence).toBe(50);
  });
  it('accept → progress only after acceptance → complete pays Stardust and one honoured Charter exactly once; cannot re-accept this cycle; the next cycle offers it again', () => {
    const at = 2 * WEEK + 10, cycleIds = weeklyCharterSlateV1(2), id = cycleIds[0]!, def = WEEKLY_CHARTER_DEFINITIONS_V1.find((d) => d.id === id)!;
    const s = veteran(); s.chWeek = 2; s.essence = 0; s.stats = { charters: 5 };
    expect(stageWeeklyCharterEventV1({ draft: s, event: { kind: def.event }, activePlayMs: at }).kind).toBe('ready');
    expect(s.chProg[id]).toBeUndefined(); // a deed before acceptance counts for nothing
    expect(stageWeeklyCharterAcceptV1({ draft: s, id, activePlayMs: at }).kind).toBe('ready'); expect(s.chacc).toContain(id);
    for (let i = 0; i < def.count; i++) stageWeeklyCharterEventV1({ draft: s, event: { kind: def.event }, activePlayMs: at + i });
    expect(s.essence).toBe(def.stardust); expect(s.stats.charters).toBe(6); expect(s.chacc).not.toContain(id);
    stageWeeklyCharterEventV1({ draft: s, event: { kind: def.event }, activePlayMs: at + 50 }); expect(s.essence).toBe(def.stardust); // paid once
    expect(projectWeeklyCharterBoardV1(s, at).rows.find((r) => r.definition.id === id)?.status).toBe('completed');
    expect(stageWeeklyCharterAcceptV1({ draft: structuredClone(s), id, activePlayMs: at })).toMatchObject({ kind: 'refused' });
    const later = structuredClone(s); const nextCycle = [...Array(30).keys()].map((k) => k + 3).find((c) => weeklyCharterSlateV1(c).includes(id))!;
    expect(stageWeeklyCharterAcceptV1({ draft: later, id, activePlayMs: nextCycle * WEEK }).kind).toBe('ready');
  });
  it('the board is closed until the five trades are learned; weekly and starter Charters share the three-slot cap; an unrelated event changes nothing', () => {
    const at = WEEK * 3, id = weeklyCharterSlateV1(3)[0]!;
    const fresh = state(); expect(projectWeeklyCharterBoardV1(fresh, at).open).toBe(false);
    expect(stageWeeklyCharterAcceptV1({ draft: fresh, id, activePlayMs: at })).toMatchObject({ kind: 'refused' });
    const full = veteran(); full.chacc = ['st-mercury', 'st-mars', 'st-giants'];
    expect(stageWeeklyCharterAcceptV1({ draft: full, id, activePlayMs: at })).toMatchObject({ kind: 'refused', reason: 'Three charters is a full slate — see one through first.' }); // LEGACY celestial-frontier.html 24886
    const quiet = veteran(); quiet.chWeek = 3; const before = structuredClone(quiet);
    expect(stageWeeklyCharterEventV1({ draft: quiet, event: { kind: 'scout-set' }, activePlayMs: at })).toMatchObject({ kind: 'ready', facts: { changed: false } }); expect(quiet).toEqual(before);
    // SOURCE tests/starter-charters.test.ts:642 reads the same words out of the drawn board.
    expect(formatActivePlayRemainingV1(projectWeeklyCharterBoardV1(veteran(), at).remainingActiveMs)).toBe('4h 0m');
  });
  it('LEGACY 24755-24759: the Charters the legacy pool also holds carry its titles, words, counts and Stardust', () => {
    const read = (id: string) => { const d = WEEKLY_CHARTER_DEFINITIONS_V1.find((x) => x.id === id)!; return [d.event, d.count, d.title, d.description, d.stardust]; };
    expect(read('wk-land')).toEqual(['landfall', 3, 'Boots on three worlds', 'Make planetfall on 3 worlds you have never stood on.', 20]);
    expect(read('wk-mine')).toEqual(['mined', 3, 'Deep veins', 'Mine deposits on 3 dead worlds you have never mined.', 25]);
    expect(read('wk-scan')).toEqual(['bioscan', 3, 'Field naturalist', 'Discover life on 3 new worlds.', 25]);
    expect(read('wk-conq')).toEqual(['conquest', 1, 'Raise a flag', 'Conquer a world.', 30]);
  });
  it('LEGACY 24869: completion adds the Stardust paid to the Stardust ever earned', () => {
    const cycle = [...Array(40).keys()].find((c) => weeklyCharterSlateV1(c).includes('wk-conq'))!, at = cycle * WEEK + 5;
    const s = veteran(); s.chWeek = cycle; s.essence = 7; s.stats = { essenceEarned: 100, charters: 1 };
    expect(stageWeeklyCharterAcceptV1({ draft: s, id: 'wk-conq', activePlayMs: at }).kind).toBe('ready');
    expect(s.stats.essenceEarned).toBe(100); // accepting earns nothing
    expect(stageWeeklyCharterEventV1({ draft: s, event: { kind: 'conquest' }, activePlayMs: at + 1 })).toMatchObject({ kind: 'ready', facts: { completions: [{ id: 'wk-conq', stardust: 30 }] } });
    expect([s.essence, s.stats.essenceEarned, s.stats.charters]).toEqual([37, 130, 2]);
    const none = veteran(); none.chWeek = cycle; none.stats = {};
    stageWeeklyCharterAcceptV1({ draft: none, id: 'wk-conq', activePlayMs: at }); stageWeeklyCharterEventV1({ draft: none, event: { kind: 'conquest' }, activePlayMs: at + 1 });
    expect(none.stats.essenceEarned).toBe(30); // LEGACY: (stats.essenceEarned||0)+c.sd
  });
  it('LEGACY 24756: Deep veins counts only a world mined for the first time, when the mined event says which it was', () => {
    const cycle = [...Array(40).keys()].find((c) => weeklyCharterSlateV1(c).includes('wk-mine'))!, at = cycle * WEEK + 5;
    const s = veteran(); s.chWeek = cycle;
    stageWeeklyCharterAcceptV1({ draft: s, id: 'wk-mine', activePlayMs: at });
    stageWeeklyCharterEventV1({ draft: s, event: { kind: 'mined', first: false }, activePlayMs: at + 1 });
    expect(s.chProg['wk-mine']).toBe(0);
    stageWeeklyCharterEventV1({ draft: s, event: { kind: 'mined', first: true }, activePlayMs: at + 2 });
    expect(s.chProg['wk-mine']).toBe(1);
  });
  it('the board still turns every four hours of active play (Dakk\'s standing decision), not by the calendar week of LEGACY 24771', () => {
    expect(WEEKLY_CHARTER_CYCLE_ACTIVE_MS).toBe(4 * 60 * 60 * 1000);
  });
  it('the time left on the board is told in hours and minutes of play, never less than a minute', () => {
    // SOURCE apps/game/src/weekly-charters.ts:5-8
    expect([0, 1, 60_000, 60_001, 59 * 60_000, 60 * 60_000, 2 * 3_600_000 + 13 * 60_000].map(formatActivePlayRemainingV1))
      .toEqual(['1m', '1m', '1m', '2m', '59m', '1h 0m', '2h 13m']);
  });
});
