/* D13 stage 2b — companion missions through a REAL F4 runtime over a memory backend (browser-free).

   Outcomes read back from DURABLE storage: dispatch seals the result and locks the companion; a reboot cannot reroll it; the
   claim waits for the ACTIVE-PLAY boundary (a device clock moved a day either way changes nothing), then pays exactly the
   sealed result once (materials, Stardust, XP on the ownership row AND its Compendium mirror, bond firsts); a second claim of
   the same mission (double click, a second tab, a reload) commits nothing; a full hold keeps the mission ready and loses
   nothing; recall brings the companion home unhurt with nothing; a third field mission is refused (two slots).
   Negative controls: a corrupted carrier is protected (never read as "nothing away"), and a stale ownership is refused. */
import { describe, expect, it } from 'vitest';
import { MISSION_RATES_V1, companionMissionHourlyCeilingV1, sealCompanionMissionV1 } from '@cf/domain-acquisition/missions-internal';
import { ARC5_MISSIONS_NAMESPACE_V1, applyV5ExtensionWrites, projectArc5MissionBoardV1, readArc5MissionsV1 } from '@cf/persistence';
import { commitArc5MissionClaimV1, commitArc5MissionDispatchV1, commitArc5MissionRecallV1 } from '../apps/game/src/arc5-mission-action.js';
import {
  EARTH, EARTH_DEPOSITS as DEPOSITS, MISSION_NOW as NOW, MISSION_SEEDS as SEEDS, cargoOf, missionCreatureId as idOf, missionDurable as durable,
  missionFixture as fixture, missionTab as tab,
} from '../test-support/arc5-missions-fixture.js';

const DAY = 86_400_000;

describe('companion missions — the placeholder rate table (until Codex\'s 2a)', () => {
  it('sits inside the proposal ceiling: two Long missions give at most 36 materials and 6 Stardust per active hour', () => {
    expect(MISSION_RATES_V1.status).toBe("placeholder until Codex's 2a");
    expect(companionMissionHourlyCeilingV1()).toEqual({ materials: 36, stardust: 6 });
    expect(MISSION_RATES_V1.lengths.long.minBondLevel).toBe(2);
  });
  it('the sealed result is a pure function of the three draws: a wound halves Prospect materials; Survey pays Stardust and a lore line, never materials', () => {
    const base = { type: 'prospect' as const, length: 'standard' as const, bond: null, deposits: ['Fe', 'Cu'] };
    const clean = sealCompanionMissionV1({ ...base, draws: [0.9, 0.2, 0.5] });
    const hurt = sealCompanionMissionV1({ ...base, draws: [0.05, 0.2, 0.5] });
    expect(clean).toEqual(sealCompanionMissionV1({ ...base, draws: [0.9, 0.2, 0.5] }));
    expect(clean.materials.reduce((n, [, c]) => n + c, 0)).toBe(8);
    expect(hurt.hurt).toBe(0.15); expect(hurt.materials.reduce((n, [, c]) => n + c, 0)).toBe(4);
    const survey = sealCompanionMissionV1({ ...base, type: 'survey', draws: [0.9, 0.2, 0.5] });
    expect(survey.materials).toEqual([]); expect(survey.stardust).toBe(1); expect(survey.loreIndex).not.toBeNull();
    // a Devoted companion (bond 3) halves the wound chance: the same 0.07 roll wounds a new companion but not a Devoted one
    const devoted = { level: 3, preferredRole: null, worldsSurvived: 0, guardianVictories: 0, mementoIds: [], memories: Array.from({ length: 15 }, (_, i) => ({ id: `m${i}`, kind: 'x', worldKey: null, atActivePlayMs: 0 })) };
    expect(sealCompanionMissionV1({ ...base, draws: [0.07, 0.2, 0.5] }).hurt).toBe(0.15);
    expect(sealCompanionMissionV1({ ...base, bond: devoted as never, draws: [0.07, 0.2, 0.5] }).hurt).toBe(0);
  });
});

describe('companion missions through a real F4 runtime (durable outcomes)', () => {
  it('Earth offers deposits for Prospect (the fixture is not vacuous)', () => { expect(DEPOSITS.length).toBeGreaterThan(0); });

  it('dispatch seals and locks; a reboot cannot reroll; the claim waits for PLAY (device clock ±1 day ignored), pays the sealed result exactly once, and a second claim commits nothing', async () => {
    const f = await fixture();
    const a = await tab(f, 'tab-a'); expect(a.lease.kind).toBe('owned');
    a.setPlay(60_000);
    const dispatched = await commitArc5MissionDispatchV1({ runtime: a.runtime, ownershipV2: f.ownership, state: f.state, codecNow: NOW,
      creatureId: idOf(SEEDS[0]), type: 'prospect', length: 'long', worldKey: EARTH.key });
    expect(dispatched.kind, JSON.stringify(dispatched)).toBe('committed'); if (dispatched.kind !== 'committed') return;
    let d = await durable(f.backend);
    const sealed = d.missions.kind === 'loaded' ? d.missions.state.active[0]! : null;
    expect(sealed?.missionId).toBe(`mission:${dispatched.receiptOrdinal}`);
    expect(d.creature(SEEDS[0]).assignment).toEqual({ kind: 'mission', missionId: sealed!.missionId });
    expect(sealed!.readyAtActivePlayMs - sealed!.dispatchedAtActivePlayMs).toBe(60 * 60_000);
    // the board shows AWAY and nothing sealed
    const board = projectArc5MissionBoardV1({ extensions: d.saved.extensions, ownershipV2: d.ownership, state: d.saved.state, activePlayMs: d.activePlayMs, nameOf: () => 'Scout', worldKey: EARTH.key })!;
    expect(board.active[0]).toMatchObject({ status: 'away', remainingMinutes: 60, claimRefusal: 'mission-not-ready' });
    expect(JSON.stringify(board.active)).not.toContain('"materials"');
    await a.runtime.release();

    // REBOOT: a fresh tab from durable storage; the sealed result is byte-identical (no reroll)
    const b = await tab(f, 'tab-b', d.revision, d.saved.extensions, d.saved.state, d.authority!);
    expect(b.lease.kind).toBe('owned');
    let again = await durable(f.backend);
    expect(again.missions).toEqual(d.missions);
    // not ready: 59 minutes of play, and the device clock a day FORWARD and a day BACK, all refuse
    b.setPlay(59 * 60_000);
    for (const codecNow of [NOW + DAY, NOW - DAY]) {
      const early = await commitArc5MissionClaimV1({ runtime: b.runtime, ownershipV2: again.ownership, state: again.saved.state, codecNow, missionId: sealed!.missionId });
      expect(early).toMatchObject({ kind: 'refused', detail: 'refused:mission-not-ready' });
    }
    expect((await durable(f.backend)).revision, 'a refused claim commits nothing').toBe(d.revision);
    // at the boundary (60 min after the 1-min dispatch snapshot) the claim pays EXACTLY the sealed result
    b.setPlay(61 * 60_000 + 1_000);
    const cargoBefore = new Map(again.saved.state.cargo);
    const claim = await commitArc5MissionClaimV1({ runtime: b.runtime, ownershipV2: again.ownership, state: again.saved.state, codecNow: NOW, missionId: sealed!.missionId });
    expect(claim.kind, JSON.stringify(claim)).toBe('committed');
    d = await durable(f.backend);
    for (const [id, n] of sealed!.sealed.materials) expect(cargoOf(d.saved.state, id), `material ${id}`).toBe((cargoBefore.get(id) ?? 0) + n);
    expect(d.creature(SEEDS[0]).assignment).toBeNull();
    expect(d.creature(SEEDS[0]).xp).toBe(10 + sealed!.sealed.xp);
    expect(d.mirrorXp(SEEDS[0]), 'the Compendium mirror row shows the same XP').toBe(10 + sealed!.sealed.xp);
    expect(d.creature(SEEDS[0]).hurt).toBe(sealed!.sealed.hurt);
    const memories = d.creature(SEEDS[0]).bond!.memories.map((m) => m.id);
    expect(memories).toEqual(expect.arrayContaining(['mission:first:prospect', `mission:world:${EARTH.key}`, 'mission:first:long']));
    expect(d.creature(SEEDS[0]).bond!.mementoIds, 'the first Long return from a world leaves a memento').toEqual([`memento:mission:${EARTH.key}`]);
    expect(d.missions.kind === 'loaded' && d.missions.state.active).toEqual([]);
    expect(d.missions.kind === 'loaded' && d.missions.state.log[0]).toMatchObject({ outcome: 'returned', missionId: sealed!.missionId, memento: `memento:mission:${EARTH.key}` });
    const paidRevision = d.revision;
    // DOUBLE CLAIM (the same press again, from the pre-claim authority): nothing commits
    const second = await commitArc5MissionClaimV1({ runtime: b.runtime, ownershipV2: d.ownership, state: d.saved.state, codecNow: NOW, missionId: sealed!.missionId });
    expect(second).toMatchObject({ kind: 'refused', detail: 'refused:mission-not-active' });
    expect((await durable(f.backend)).revision).toBe(paidRevision);
    await b.runtime.release();
    // A SECOND TAB with the stale pre-claim save cannot claim again either (stale revision / lease)
    const c = await tab(f, 'tab-c', again.revision, again.saved.extensions, again.saved.state, again.authority!);
    c.setPlay(62 * 60_000);
    const stale = await commitArc5MissionClaimV1({ runtime: c.runtime, ownershipV2: again.ownership, state: again.saved.state, codecNow: NOW, missionId: sealed!.missionId });
    expect(stale.kind).toBe('refused');
    const end = await durable(f.backend);
    expect(end.revision).toBe(paidRevision);
    for (const [id, n] of sealed!.sealed.materials) expect(cargoOf(end.saved.state, id)).toBe((cargoBefore.get(id) ?? 0) + n);
    await c.runtime.release();
  });

  it('a full hold keeps the mission READY and loses nothing; recall brings a companion home unhurt with nothing; a third field mission is refused (two slots)', async () => {
    const full: Array<[string, number]> = DEPOSITS.map((id) => [id, 999_999]);
    const f = await fixture({ cargo: full });
    const a = await tab(f, 'tab-full');
    a.setPlay(60_000);
    const one = await commitArc5MissionDispatchV1({ runtime: a.runtime, ownershipV2: f.ownership, state: f.state, codecNow: NOW, creatureId: idOf(SEEDS[1]), type: 'prospect', length: 'short', worldKey: EARTH.key });
    expect(one.kind).toBe('committed'); if (one.kind !== 'committed') return;
    const two = await commitArc5MissionDispatchV1({ runtime: a.runtime, ownershipV2: one.ownershipV2, state: one.state, codecNow: NOW, creatureId: idOf(SEEDS[2]), type: 'survey', length: 'short', worldKey: EARTH.key });
    expect(two.kind).toBe('committed'); if (two.kind !== 'committed') return;
    const three = await commitArc5MissionDispatchV1({ runtime: a.runtime, ownershipV2: two.ownershipV2, state: two.state, codecNow: NOW, creatureId: idOf(SEEDS[0]), type: 'survey', length: 'short', worldKey: EARTH.key });
    expect(three).toMatchObject({ kind: 'refused', detail: 'refused:slots-full' });
    a.setPlay(60_000 + 10 * 60_000 + 5_000);
    let d = await durable(f.backend);
    const prospect = d.missions.kind === 'loaded' ? d.missions.state.active.find((m) => m.creatureId === idOf(SEEDS[1]))! : null;
    const claim = await commitArc5MissionClaimV1({ runtime: a.runtime, ownershipV2: d.ownership, state: d.saved.state, codecNow: NOW, missionId: prospect!.missionId });
    expect(claim).toMatchObject({ kind: 'refused', detail: 'refused:cargo-full' });
    d = await durable(f.backend);
    expect(d.missions.kind === 'loaded' && d.missions.state.active.some((m) => m.missionId === prospect!.missionId), 'the mission stays, ready').toBe(true);
    expect(d.creature(SEEDS[1]).assignment).toEqual({ kind: 'mission', missionId: prospect!.missionId });
    for (const [id, n] of full) expect(cargoOf(d.saved.state, id)).toBe(n);
    // RECALL the Survey: home unhurt, nothing paid, the sealed result discarded
    const survey = d.missions.kind === 'loaded' ? d.missions.state.active.find((m) => m.creatureId === idOf(SEEDS[2]))! : null;
    const essence = d.saved.state.essence;
    const recall = await commitArc5MissionRecallV1({ runtime: a.runtime, ownershipV2: d.ownership, state: d.saved.state, codecNow: NOW, missionId: survey!.missionId });
    expect(recall.kind, JSON.stringify(recall)).toBe('committed');
    d = await durable(f.backend);
    expect(d.creature(SEEDS[2])).toMatchObject({ assignment: null, hurt: 0, xp: 10 });
    expect(d.saved.state.essence).toBe(essence);
    expect(d.missions.kind === 'loaded' && d.missions.state.log[0]).toMatchObject({ outcome: 'recalled', stardust: 0, xp: 0, materials: [] });
    await a.runtime.release();
  });

  it('a Standard Survey pays its sealed Stardust (and lifetime Stardust) and keeps its lore line in the return log; no materials', async () => {
    const f = await fixture();
    const a = await tab(f, 'tab-survey');
    a.setPlay(60_000);
    const sent = await commitArc5MissionDispatchV1({ runtime: a.runtime, ownershipV2: f.ownership, state: f.state, codecNow: NOW, creatureId: idOf(SEEDS[1]), type: 'survey', length: 'standard', worldKey: EARTH.key });
    expect(sent.kind).toBe('committed'); if (sent.kind !== 'committed') return;
    a.setPlay(60_000 + 25 * 60_000);
    let d = await durable(f.backend);
    const essence = d.saved.state.essence, earned = d.saved.state.stats.essenceEarned ?? 0, cargo = JSON.stringify(d.saved.state.cargo);
    const claim = await commitArc5MissionClaimV1({ runtime: a.runtime, ownershipV2: d.ownership, state: d.saved.state, codecNow: NOW, missionId: sent.value.missionId });
    expect(claim.kind, JSON.stringify(claim)).toBe('committed');
    d = await durable(f.backend);
    expect(sent.value.sealed.stardust).toBe(MISSION_RATES_V1.lengths.standard.stardust);
    expect(d.saved.state.essence).toBe(essence + sent.value.sealed.stardust);
    expect(d.saved.state.stats.essenceEarned ?? 0).toBe(earned + sent.value.sealed.stardust);
    expect(JSON.stringify(d.saved.state.cargo), 'a Survey never brings materials').toBe(cargo);
    expect(d.missions.kind === 'loaded' && d.missions.state.log[0]).toMatchObject({ outcome: 'returned', loreIndex: sent.value.sealed.loreIndex, memento: null });
    await a.runtime.release();
  });

  it('negative controls: a corrupted carrier is PROTECTED (never "nothing away"); a stale ownership is refused', async () => {
    const f = await fixture();
    const bad = applyV5ExtensionWrites(f.extensions, [{ segment: 'player', namespace: ARC5_MISSIONS_NAMESPACE_V1, carrier: { version: 1, json: '{"schema":"cf-v2-arc5-missions/v1","active":"x","log":[]}' } }]).extensions;
    expect(readArc5MissionsV1(bad)).toEqual({ kind: 'protected', reason: 'corrupt' });
    expect(readArc5MissionsV1(f.extensions)).toEqual({ kind: 'loaded', state: { active: [], log: [] } });
    const a = await tab(f, 'tab-neg');
    a.setPlay(60_000);
    const first = await commitArc5MissionDispatchV1({ runtime: a.runtime, ownershipV2: f.ownership, state: f.state, codecNow: NOW, creatureId: idOf(SEEDS[1]), type: 'survey', length: 'short', worldKey: EARTH.key });
    expect(first.kind).toBe('committed');
    // the pre-dispatch ownership is now stale: a dispatch built on it must refuse
    const stale = await commitArc5MissionDispatchV1({ runtime: a.runtime, ownershipV2: f.ownership, state: f.state, codecNow: NOW, creatureId: idOf(SEEDS[2]), type: 'survey', length: 'short', worldKey: EARTH.key });
    expect(stale.kind).toBe('refused');
    await a.runtime.release();
  });
});
