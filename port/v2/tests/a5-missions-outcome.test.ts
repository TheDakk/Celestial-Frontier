/* D13 stage 2c — the companion mission board as a browser-free UI OUTCOME test (A5 pattern: assert the outcome, not the code path).

   The exact shipped main.ts mission block (controller, projector, runCompanionMission) is sliced, type-stripped and executed over a
   REAL F4 runtime + memory backend. The test drives the real board: it reads the disclosure, presses Send (twice — the latch holds),
   sees the Away badge, plays to the boundary, presses Claim twice, then reads the COMMITTED save back (one dispatch, one claim; the
   hold, XP on the companion and its Compendium mirror row) and checks the live save equals the durable one, the reveal (the return's
   text counterpart) and the Chronicle. Recall needs two taps and pays nothing. The device clock is moved a day forward throughout and
   never matters. Mutation controls re-run against Main mutants and require the outcome to fail. */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { SCENE_OWNERSHIP_ADDRESS_RESOLVER, ownershipStateDigestV2 } from '@cf/domain-acquisition';
import { projectArc5MissionBoardV1, readArc5OwnershipMigration, type SaveStateV2 } from '@cf/persistence';
import { commitArc5MissionClaimV1, commitArc5MissionDispatchV1, commitArc5MissionRecallV1 } from '../apps/game/src/arc5-mission-action.js';
import { MissionBoardController, missionClaimReasonV1, missionReturnTextV1 } from '../apps/game/src/mission-board.js';
import { mirrorCompanionCodexXpV1 } from '../apps/game/src/companion-codex-mirror.js';
import { createProductActionCoordinator } from '../apps/game/src/product-action-coordinator.js';
import type { F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  EARTH, MISSION_NOW, MISSION_SEEDS, cargoOf, missionCreatureId, missionDurable, missionFixture, missionTab, type MissionFixture,
} from '../test-support/arc5-missions-fixture.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & typeof globalThis } };
const DAY = 86_400_000;

function exactMainSection(start: string, end: string): string {
  const a = MAIN_SOURCE.split(start).length - 1, b = MAIN_SOURCE.split(end).length - 1;
  if (a !== 1 || b !== 1) throw new Error(`Main mission anchors must be unique (${a}/${b})`);
  const left = MAIN_SOURCE.indexOf(start);
  return MAIN_SOURCE.slice(left, MAIN_SOURCE.indexOf(end, left));
}
const MAIN_MISSION_SOURCE = exactMainSection('let lastMissionOutcome: string | null = null;', 'let lastArc6CommandOutcome: string | null = null;');
interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }
function executable(env: Record<string, unknown>, mutations: readonly MainMutation[]) {
  const source = mutations.reduce((src, m) => {
    const n = src.split(m.needle).length - 1;
    if (n !== 1) throw new Error(`mutation "${m.name}" needle found ${n} times`);
    return src.replace(m.needle, () => m.replacement);
  }, MAIN_MISSION_SOURCE);
  const t = transformSync('main-missions.ts', source);
  if (t.errors.length > 0) throw new Error(JSON.stringify(t.errors));
  return new Function('env', `with (env) { ${t.code}; return { controller: missionBoardController, project: projectCurrentMissionBoard,
    outcome: () => lastMissionOutcome }; }`)(env) as { controller: MissionBoardController; project: () => unknown; outcome: () => string | null };
}

async function harness(f: MissionFixture, mutations: readonly MainMutation[] = []) {
  const t = await missionTab(f, 'ui-tab');
  if (t.lease.kind !== 'owned') throw new Error('lease');
  t.setPlay(60_000);
  const dom = new JSDOM('<!doctype html><body><section data-mission-board-body></section></body>');
  const document = dom.window.document;
  const reload = vi.fn();
  const env: Record<string, unknown> = {
    document, MissionBoardController, missionClaimReasonV1, missionReturnTextV1, projectArc5MissionBoardV1, mirrorCompanionCodexXpV1,
    commitArc5MissionDispatchV1, commitArc5MissionClaimV1, commitArc5MissionRecallV1, readArc5OwnershipMigration, SCENE_OWNERSHIP_ADDRESS_RESOLVER, ownershipStateDigestV2,
    save: structuredClone(f.state), f4Runtime: t.runtime, arc5OwnershipState: f.ownership, arc5OwnershipEvidence: f.evidence, arc5OwnershipProtection: null,
    compendiumFixtureRows: null, currentCompendiumDetailRow: () => null,
    f4RuntimeMayMutate: (r: F4RuntimeAuthority | null) => r !== null && r.diagnostics().leaseOwned && !r.diagnostics().staleBlocked,
    activePersist: null, importWriteInFlight: false, replacementTransaction: null, replacementReloadPending: false, trainingCheckpointWriteHeld: false,
    productActionCoordinator: createProductActionCoordinator(), productActionInFlight: false,
    settleF4Heartbeat: async () => undefined, Date: Object.freeze({ now: () => MISSION_NOW + DAY }), performance: Object.freeze({ now: () => 1 }),
    f4LastCheckpointAt: 0, lastPersistenceOutcome: null, scheduleF4AuthorityConvergenceReload: reload, queueArc9ProgressionRefresh: vi.fn(), updateChips: vi.fn(),
    companionCareController: { setState: vi.fn() }, projectCurrentCompanionCare: () => null,
  };
  const exec = executable(env, mutations);
  const mount = document.querySelector<HTMLElement>('[data-mission-board-body]')!;
  exec.controller.setState(exec.project() as never, EARTH.key);
  exec.controller.attach(mount);
  const rerender = () => exec.controller.setState(exec.project() as never);
  const settled = () => vi.waitFor(() => { if (exec.controller.pending) throw new Error('pending'); }, { timeout: 5_000, interval: 2 });
  const q = <T extends Element = HTMLElement>(sel: string) => mount.querySelector<T & HTMLElement>(sel);
  return { t, dom, env, exec, mount, reload, rerender, settled, q };
}
type H = Awaited<ReturnType<typeof harness>>;
function pick(h: H, name: string, value: string): void {
  const s = h.q<HTMLSelectElement>(`[data-mission-pick="${name}"]`)!;
  s.value = value; s.dispatchEvent(new h.dom.window.Event('change', { bubbles: true }));
}

async function scenario(mutations: readonly MainMutation[] = []): Promise<void> {
  const f = await missionFixture();
  const h = await harness(f, mutations);
  const mine = missionCreatureId(MISSION_SEEDS[0]);
  pick(h, 'companion', mine); pick(h, 'mission', 'prospect'); pick(h, 'length', 'short'); pick(h, 'world', EARTH.key);
  // DISCLOSURE before anything leaves: length, minutes of play, wound chance, what it brings, recall returns nothing
  expect(h.q('[data-mission-disclosure]')?.textContent).toMatch(/Short · 10 min of play · 0% chance of a wound · brings materials from .*deposits\. Recall any time: it comes home with nothing\./u);
  const send = h.q<HTMLButtonElement>('[data-mission-send]')!;
  expect(send.disabled, h.q('[data-mission-send-why]')?.textContent ?? '').toBe(false);
  send.click(); send.click();
  await h.settled();
  let d = await missionDurable(f.backend);
  expect(d.revision, `one Send = one receipt (Main said ${h.exec.outcome()})`).toBe(1);
  const mission = d.missions.kind === 'loaded' ? d.missions.state.active[0]! : null;
  expect(mission?.creatureId).toBe(mine);
  h.rerender();
  expect(h.q(`[data-mission-row="${mission!.missionId}"] [data-mission-badge]`)?.dataset.missionBadge).toBe('away');
  expect(h.q(`[data-mission-claim="${mission!.missionId}"]`)!.hasAttribute('disabled'), 'Claim waits for the boundary').toBe(true);
  // play to the boundary; the board shows Ready; Claim twice → one claim
  h.t.setPlay(60_000 + 10 * 60_000 + 1_000);
  h.rerender();
  expect(h.q(`[data-mission-row="${mission!.missionId}"] [data-mission-badge]`)?.dataset.missionBadge).toBe('ready');
  const cargoBefore = new Map((h.env.save as SaveStateV2).cargo);
  const claim = h.q<HTMLButtonElement>(`[data-mission-claim="${mission!.missionId}"]`)!;
  claim.click(); claim.click();
  await h.settled();
  d = await missionDurable(f.backend);
  expect(d.revision, `dispatch + ONE claim (Main said ${h.exec.outcome()})`).toBe(2);
  for (const [id, n] of mission!.sealed.materials) expect(cargoOf(d.saved.state, id), id).toBe((cargoBefore.get(id) ?? 0) + n);
  expect(d.creature(MISSION_SEEDS[0])).toMatchObject({ assignment: null, xp: 10 + mission!.sealed.xp });
  expect(d.mirrorXp(MISSION_SEEDS[0])).toBe(10 + mission!.sealed.xp);
  // the live save equals the durable one for what the claim committed
  const live = h.env.save as SaveStateV2;
  expect(live.cargo).toEqual(d.saved.state.cargo);
  expect(live.essence).toBe(d.saved.state.essence);
  expect((live.codex.find(([id]) => id === `s${MISSION_SEEDS[0]}`)![1].g as { xp?: number }).xp).toBe(10 + mission!.sealed.xp);
  // the reveal (the text counterpart of the return) and the Chronicle
  const reveal = h.q('[data-mission-message]');
  expect(reveal?.getAttribute('role')).toBe('status');
  expect(reveal?.textContent).toMatch(/^Scout 1 returned from .*\(Prospect, Short\): .*\+2 XP\./u);
  expect(h.q(`[data-mission-log="${mission!.missionId}"]`)?.textContent).toBe(reveal?.textContent);
  // RECALL needs two taps and pays nothing
  pick(h, 'companion', missionCreatureId(MISSION_SEEDS[1])); pick(h, 'mission', 'survey');
  h.q<HTMLButtonElement>('[data-mission-send]')!.click();
  await h.settled();
  d = await missionDurable(f.backend);
  const second = d.missions.kind === 'loaded' ? d.missions.state.active[0]! : null;
  h.rerender();
  const recall = () => h.q<HTMLButtonElement>(`[data-mission-recall="${second!.missionId}"]`)!;
  recall().click();
  expect(recall().dataset.missionRecallArmed, 'the first tap only arms').toBe('true');
  expect((await missionDurable(f.backend)).revision).toBe(3);
  recall().click();
  await h.settled();
  d = await missionDurable(f.backend);
  expect(d.revision).toBe(4);
  expect(d.creature(MISSION_SEEDS[1])).toMatchObject({ assignment: null, xp: 10, hurt: 0 });
  expect(h.q('[data-mission-message]')?.textContent).toMatch(/was recalled from .* and came home with nothing\./u);
  expect(h.reload).not.toHaveBeenCalled();
  await h.t.runtime.release();
}

describe('the companion mission board through the shipped Main block (browser-free outcome)', () => {
  it('disclosure, Send (double press latched), Away → Ready on PLAY (device clock a day ahead ignored), Claim (double press latched) pays once, live = durable, reveal + Chronicle, two-tap Recall pays nothing', async () => {
    await scenario();
  }, 60_000);

  const mutants: readonly MainMutation[] = [
    { name: 'UNWIRED CLAIM: the Claim press never reaches the transaction', needle: "onClaim: (missionId) => { void runCompanionMission('claim', missionId); },", replacement: 'onClaim: () => {},' },
    { name: 'UNPUBLISHED HOLD: the claim commits but the live save keeps the old hold', needle: 'save.cargo = outcome.state.cargo.map(([id, n]) => [id, n]);', replacement: 'void 0;' },
    { name: 'UNPUBLISHED MIRROR: the Compendium row never shows the mission XP', needle: 'save.codex = mirrorCompanionCodexXpV1(save.codex, outcome.state.codex);', replacement: 'void 0;' },
    { name: 'NO REVEAL: the return has no text counterpart', needle: ': missionReturnTextV1(outcome.value as Parameters<typeof missionReturnTextV1>[0], missionCompanionName(value.creatureId)));', replacement: ": 'Done.');" },
  ];
  it('every mutation needle occurs exactly once in the shipped block (a missing needle would make a control pass vacuously)', () => {
    for (const m of mutants) expect(MAIN_MISSION_SOURCE.split(m.needle).length - 1, m.name).toBe(1);
  });
  for (const mutant of mutants) {
    it(`mutation control — ${mutant.name}: the outcome test fails`, async () => {
      await expect(scenario([mutant])).rejects.toThrow();
    }, 60_000);
  }
});
