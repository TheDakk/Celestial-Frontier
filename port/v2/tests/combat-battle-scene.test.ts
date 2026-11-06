import { createRequire } from 'node:module';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { resolveCF1WorldAddress } from '@cf/scene';
import { battleStats, planCombatSettlementV1, projectGuardianPrimeEncounterV1, runDuel,
  type CombatSettlementChampionV1 } from '@cf/domain-combatcore';
import { combatCuePlan, projectCombatCueParticipantsV1 } from '@cf/audio';
import { CombatChronicleController, projectCombatChronicleV1, COMBAT_CHRONICLE_START_DELAY_MS,
  COMBAT_CHRONICLE_ROW_DELAY_MS, type CombatChronicleCueEmissionV1 } from '../apps/game/src/combat-chronicle.js';
import { CombatBattleSceneController, COMBAT_BATTLE_MOTION_MS } from '../apps/game/src/combat-battle-scene.js';
import type { SpeciesArtLoader } from '../apps/game/src/species-art-loader.js';
import type { VisualEffectPolicyInputV1 } from '../apps/game/src/visual-effect-policy.js';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const cleanups: Array<() => void> = [];
beforeAll(() => installCaptureHooks());
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup(); vi.useRealTimers(); });
const full: VisualEffectPolicyInputV1 = { effectsOn: true, motion: 'full', deviceTier: 'high' };

function plans(player = false, battleId = 'battle-scene-test') {
  const world = resolveCF1WorldAddress({ galaxy: { seed: 1594395733, x: -5501.81, y: -11753.64 },
    star: { seed: 4077594722, x: -271.54, y: -67.36 }, planet: { seed: 488332735 } });
  if (!world.ok) throw new Error(world.reason);
  const encounter = projectGuardianPrimeEncounterV1({ world: world.address, descriptor: { worldType: 'airless' },
    regionIndex: 0, faunaRoster: [{ speciesId: 'battle-scene-defender', genome: makeGenome(999, 'fauna', 0.5) }],
    claimedSignatureIds: [], conquered: false });
  if (!encounter) throw new Error('missing test encounter');
  const genome = makeGenome(3, 'fauna', 0.5);
  const champion: CombatSettlementChampionV1 = player
    ? { kind: 'player', explorerId: 'explorer', name: 'Explorer', genomeSeed: genome.seed, stats: battleStats(genome), currentHp: 100 }
    : { kind: 'owned-fauna', creatureId: 'battle-scene-champion', name: '<Champion & companion>', genome, legacyBredLineage: true };
  const mine = champion.kind === 'player'
    ? { name: champion.name, genome: { seed: champion.genomeSeed }, stats: champion.stats }
    : { name: champion.name, genome: champion.genome as Genome };
  const transcript = runDuel(mine, { name: encounter.defender.name, genome: encounter.defender.battleGenome as Genome });
  const settlement = planCombatSettlementV1({ battleId, receiptOrdinal: 47, encounter, champion, transcript,
    outcome: transcript.winner === 'A' ? 'champion-win' : transcript.winner === 'B' ? 'defender-win' : 'draw', worldTier: 5,
    authority: { worldConquered: false, claimedPrimeSignatureIds: [], lossXp: player ? null : { kind: 'known-target', awardedTarget: 0 } } });
  if (settlement.status !== 'planned') throw new Error(settlement.reason);
  const cuePlan = combatCuePlan(settlement, projectCombatCueParticipantsV1(settlement));
  return { settlement, cuePlan, chronicle: projectCombatChronicleV1(settlement, cuePlan) };
}
function fixture(policy = full, player = false, pendingArt = false) {
  vi.useFakeTimers();
  const dom = new JSDOM('<!doctype html><body><aside id="combat"><section id="mount"></section></aside></body>', { pretendToBeVisual: true });
  const document = dom.window.document, root = document.getElementById('combat') as HTMLElement, mount = document.getElementById('mount') as HTMLElement;
  const animations: Array<{ target: HTMLElement; frames: Keyframe[]; options: KeyframeAnimationOptions; cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }> = [];
  dom.window.HTMLElement.prototype.animate = function(frames: Keyframe[], options: KeyframeAnimationOptions) {
    const animation = { target: this, frames, options, cancel: vi.fn(), onfinish: null };
    animations.push(animation); return animation;
  };
  const leases: Array<{ genome: unknown; release: ReturnType<typeof vi.fn>; unsubscribe: ReturnType<typeof vi.fn>; deliver: () => void }> = [];
  const artLoader = { leaseThumb(genome: unknown) {
    const key = 'battle-art-' + leases.length, asset = { key, url: 'data:image/png;base64,AA==', width: 132, height: 132 };
    let listener: ((value: unknown) => void) | null = null;
    const row = { genome, release: vi.fn(), unsubscribe: vi.fn(), deliver: () => listener?.(asset) }; leases.push(row);
    return { key, current: pendingArt ? null : asset, subscribe: (callback: (value: unknown) => void) => { listener = callback; return row.unsubscribe; }, release: row.release };
  } } as unknown as SpeciesArtLoader;
  const handled: Array<{ emission: CombatChronicleCueEmissionV1; accepted: boolean }> = [];
  let scene!: CombatBattleSceneController;
  const chronicleOwner = new CombatChronicleController({ root,
    onCue: emission => handled.push({ emission, accepted: scene.presentCue(emission) }), onStopVoices: reason => scene.stop(reason) });
  chronicleOwner.attach(mount);
  scene = new CombatBattleSceneController({ root, artLoader, counterpartIsCurrent: receipt => chronicleOwner.counterpartIsCurrent(receipt) });
  scene.setPolicy(policy);
  const pair = plans(player), generation = chronicleOwner.start(pair.chronicle, pair.cuePlan);
  scene.start({ mount, ...pair, generation });
  cleanups.push(() => { scene.dispose(); chronicleOwner.dispose(); dom.window.close(); });
  const advanceToDamage = () => {
    for (let index = 0; index <= pair.chronicle.steps.length + 1; index++) {
      vi.advanceTimersByTime(index === 0 ? COMBAT_CHRONICLE_START_DELAY_MS : COMBAT_CHRONICLE_ROW_DELAY_MS);
      const found = handled.find(row => row.accepted && row.emission.cue.families.includes('damage'));
      if (found) return found.emission;
    }
    throw new Error('registered transcript produced no damage cue');
  };
  return { dom, root, mount, pair, generation, scene, chronicleOwner, animations, leases, handled, advanceToDamage };
}

it('uses actual Chronicle cue publication for finite actor/target movement over exact canonical art', () => {
  const h = fixture(), before = JSON.stringify(h.pair.settlement), emission = h.advanceToDamage();
  expect(h.leases).toHaveLength(2);
  if (h.pair.settlement.champion.kind !== 'owned-fauna') throw new Error('fixture is not owned fauna');
  expect(h.leases[0]!.genome).toBe(h.pair.settlement.champion.genome);
  expect(h.leases[1]!.genome).toBe(h.pair.settlement.encounter.defender.battleGenome);
  expect(h.animations).toHaveLength(2);
  expect(h.animations.map(row => row.target.dataset.battleActor)).toEqual([emission.cue.actorSide, emission.cue.targetSide]);
  expect(h.animations.every(row => row.options.duration === COMBAT_BATTLE_MOTION_MS && row.options.iterations === 1)).toBe(true);
  expect(h.animations[0]!.frames[1]!.transform).toContain(emission.cue.actorSide === 'A' ? '12px' : '-12px');
  expect(h.mount.querySelector('[data-combat-battle-scene]')!.getAttribute('data-battle-cue-id')).toBe(emission.cue.cueId);
  expect(h.mount.querySelectorAll('progress[data-combat-hp-progress]')).toHaveLength(2); // Existing Chronicle alone owns HP.
  expect(h.mount.querySelector('figcaption')!.textContent).toBe('<Champion & companion>');
  expect(h.mount.querySelector('figcaption img')).toBeNull();
  vi.runAllTimers();
  expect(JSON.stringify(h.pair.settlement)).toBe(before);
  expect(h.mount.querySelector('[data-battle-cue="result"]')!.textContent).toBe(h.pair.chronicle.resultText);
  expect(h.mount.querySelector<HTMLProgressElement>('[data-combat-hp-progress="A"]')!.value).toBe(h.pair.settlement.transcript.hpA);
});
it.each([{ effectsOn: false, motion: 'full', deviceTier: 'high' }, { effectsOn: true, motion: 'reduced', deviceTier: 'high' }] as const)('retains a visible real cue without optional motion for $effectsOn/$motion/$deviceTier', policy => {
  const h = fixture(policy), emission = h.advanceToDamage();
  expect(h.animations).toHaveLength(0);
  expect(h.mount.querySelector('[data-battle-cue="damage"]')!.textContent).toBe(h.pair.chronicle.steps[emission.cue.transcriptIndex!]!.rows.find(row => row.kind === 'damage')!.displayText);
  expect(h.mount.querySelectorAll('[data-battle-action="hit"]')).toHaveLength(1);
});
it('keeps the bounded attack visible on low-tier phones without a particle or bloom allocation', () => {
  const h = fixture({ ...full, deviceTier: 'low' }); h.advanceToDamage();
  expect(h.animations).toHaveLength(2); expect(h.leases).toHaveLength(2);
});
it('retains native Chronicle completion if the optional compositor throws', () => {
  const h = fixture(); h.dom.window.HTMLElement.prototype.animate = () => { throw new Error('compositor unavailable'); };
  h.advanceToDamage(); vi.runAllTimers();
  expect(h.mount.querySelector('[data-combat-chronicle-result]')!.textContent).toBe(h.pair.chronicle.resultText);
  expect(h.mount.querySelector('[data-battle-cue="result"]')!.textContent).toBe(h.pair.chronicle.resultText);
});
it('cancels active motion immediately on policy reduction and ignores duplicate or stale cue identities', () => {
  const h = fixture(), emission = h.advanceToDamage();
  h.scene.setPolicy({ ...full, motion: 'reduced' }); expect(h.animations.every(row => row.cancel.mock.calls.length === 1)).toBe(true);
  expect(h.scene.presentCue(emission)).toBe(false);
  expect(h.scene.presentCue({ ...emission, counterpart: { ...emission.counterpart, generation: h.generation + 1 } })).toBe(false);
  expect(h.scene.presentCue({ ...emission, plan: { ...emission.plan } })).toBe(false);
  expect(h.scene.presentCue({ ...emission, cue: { ...emission.cue } })).toBe(false);
  expect(h.mount.querySelector('[data-battle-cue="damage"]')!.textContent).toBeTruthy();
});
it('keeps player identity as a nameplate and allocates only the actual defender portrait', () => {
  const h = fixture(full, true); expect(h.leases).toHaveLength(1);
  expect(h.leases[0]!.genome).toBe(h.pair.settlement.encounter.defender.battleGenome);
  expect(h.mount.querySelector('[data-battle-player-nameplate]')!.textContent).toBe('Explorer');
  expect(h.mount.querySelectorAll('[data-battle-portrait]')).toHaveLength(1);
});
it('rejects unregistered or mismatched battle inputs before replacing its current scene', () => {
  const h = fixture(), original = h.mount.querySelector('[data-combat-battle-scene]');
  expect(() => h.scene.start({ mount: h.mount, ...h.pair, generation: h.generation, chronicle: { ...h.pair.chronicle } })).toThrow();
  const other = plans(false, 'different-battle');
  expect(() => h.scene.start({ mount: h.mount, ...h.pair, generation: h.generation, cuePlan: other.cuePlan })).toThrow();
  expect(h.mount.querySelector('[data-combat-battle-scene]')).toBe(original); expect(h.leases).toHaveLength(2);
});
it('uses the native Chronicle Skip path to stop motion without replaying cues or removing static identities', () => {
  const h = fixture(); h.advanceToDamage();
  const prior = h.handled.length;
  h.mount.querySelector<HTMLButtonElement>('[data-combat-chronicle-skip]')!.click();
  expect(h.animations.every(row => row.cancel.mock.calls.length === 1)).toBe(true);
  expect(h.handled).toHaveLength(prior); expect(h.leases.every(row => row.release.mock.calls.length === 0)).toBe(true);
  expect(h.mount.querySelectorAll('[data-battle-portrait]')).toHaveLength(2);
  expect(h.mount.querySelector('[data-battle-cue="result"]')!.textContent).toBe(h.pair.chronicle.resultText);
  h.chronicleOwner.close(); expect(h.leases.every(row => row.release.mock.calls.length === 1)).toBe(true);
});
it('releases both leases on hidden/replaced/disposed ownership and rejects late asset publication', async () => {
  const h = fixture(full, false, true), oldImages = [...h.mount.querySelectorAll('img')];
  h.root.setAttribute('aria-hidden', 'true'); await Promise.resolve();
  expect(h.leases.every(row => row.release.mock.calls.length === 1 && row.unsubscribe.mock.calls.length === 1)).toBe(true);
  for (const row of h.leases) row.deliver(); expect(oldImages.every(image => !image.hasAttribute('src'))).toBe(true);
  h.root.removeAttribute('aria-hidden');
  const pair = plans(false, 'replacement'), generation = h.chronicleOwner.start(pair.chronicle, pair.cuePlan);
  h.scene.start({ mount: h.mount, ...pair, generation }); expect(h.leases).toHaveLength(4);
  h.scene.dispose(); expect(h.leases.every(row => row.release.mock.calls.length === 1)).toBe(true);
  for (const row of h.leases) row.deliver(); expect(h.mount.querySelector('[data-combat-battle-scene]')).toBeNull();
  expect(() => h.scene.start({ mount: h.mount, ...pair, generation })).toThrow('disposed');
});
