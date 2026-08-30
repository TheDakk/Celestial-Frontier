import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  COMBAT_CARD_OUTCOME_SCHEMA,
  COMBAT_CARD_READ_MODEL_SCHEMA,
  CombatCardController,
  projectCombatCardForecastV1,
  projectCombatCardReadModelV1,
  type CombatCardActionOutcomeV1,
  type CombatCardReadModelV1,
} from '../apps/game/src/combat-card.js';
import {
  commitArc6CombatActionV1,
  projectArc6CombatChampionAvailabilityV1,
  projectArc6CombatChampionRosterV1,
  type Arc6CombatChampionRosterV1,
} from '../apps/game/src/arc6-combat-action.js';
import {
  projectGuardianPrimeEncounterV1,
  type PlayerSettlementChampionV1,
} from '@cf/domain-combatcore';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { makeGenome } from '@cf/domain-genome';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import type { SaveStateV2, V5Extensions } from '@cf/persistence';
import { resolveCF1WorldAddress } from '@cf/scene';

interface TestWindow extends Window {
  readonly Element: typeof Element;
  readonly Event: typeof Event;
  readonly HTMLSelectElement: typeof HTMLSelectElement;
  readonly HTMLButtonElement: typeof HTMLButtonElement;
  close(): void;
}
interface TestDom { readonly window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const here = path.dirname(fileURLToPath(import.meta.url));
installCaptureHooks();
const indexSource = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'index.html'), 'utf8');
const combatCardSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'combat-card.ts'), 'utf8',
);

let dom: TestDom | null = null;
let controller: CombatCardController | null = null;
const priorGlobals = new Map<string, unknown>();

function installDomGlobals(window: TestWindow): void {
  for (const [key, value] of Object.entries({
    Element: window.Element,
    Event: window.Event,
    HTMLSelectElement: window.HTMLSelectElement,
    HTMLButtonElement: window.HTMLButtonElement,
  })) {
    priorGlobals.set(key, (globalThis as Record<string, unknown>)[key]);
    (globalThis as Record<string, unknown>)[key] = value;
  }
}

function restoreDomGlobals(): void {
  for (const [key, value] of priorGlobals) {
    if (value === undefined) delete (globalThis as Record<string, unknown>)[key];
    else (globalThis as Record<string, unknown>)[key] = value;
  }
  priorGlobals.clear();
}

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
  restoreDomGlobals();
});

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function readModel(): CombatCardReadModelV1 {
  return deepFreeze({
    schema: COMBAT_CARD_READ_MODEL_SCHEMA,
    contextKey: 'arc6:world:fixture',
    observedActivePlayMs: 0,
    defender: {
      kind: 'titan', label: 'Elemental Titan', name: 'Pyraxis', tier: 14,
      power: 1234, ability: 'Magma Strike',
    },
    championOptions: [{
      id: '__self__', kind: 'player', label: 'Explorer — 100/100 HP',
      power: 250, ability: 'Frontier Resolve', disabled: false, disabledReason: null,
    }],
    selectedChampionId: '__self__',
    forecast: {
      probability: 0,
      percent: '<1%',
      sampleSize: 160,
      decisiveRuns: 160,
      closeRuns: 0,
      band: 'Overwhelming',
      color: '#ff5a4a',
      why: 'it strikes first · its blows land harder',
    },
    stakes: 'Loss wounds you but never kills you; your HP stops at 1.',
    reward: 'Win: conquer the world and claim its Prime Signature.',
    policy: 'Current conquest fields one champion; party roles and retreat remain open.',
    unavailableReason: null,
  });
}

function availabilityOwnership(): Readonly<{
  state: OwnershipStateV2;
  recoveryId: CreatureInstanceId;
  missionId: CreatureInstanceId;
}> {
  const identities = [101, 202].map((seed) => (
    canonicalGenomeIdentityV1(makeGenome(seed, 'fauna', 0.5))
  ));
  const discoveries = identities.map((identity, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `combat-card-availability-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `combat-card-availability-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  }));
  const creatureIds = identities.map((_, index) => (
    ownershipContentId('creature', `combat-card-availability-${index}`) as CreatureInstanceId
  ));
  const creatures = identities.map((identity, index) => createCreatureInstanceV1({
    creatureId: creatureIds[index]!,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: index === 0 ? 'Resting Lumen' : 'Away Comet',
    origin: 'legacy',
    acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: 0 },
    xp: 0,
    hurt: 0,
    fed: 0,
    brood: 0,
    assignment: index === 0
      ? { kind: 'recovery', readyAtActivePlayMs: 10_000 }
      : { kind: 'mission', missionId: 'mission-visible-lock' },
    bond: null,
  }));
  const source = createInitialOwnershipStateV1({
    catalogSpecies: identities.map((identity, index) => createCatalogSpeciesV1({
      identity,
      alias: null,
      firstObservationId: discoveries[index]!.recordId,
    })),
    discoveries,
    creatures,
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  return Object.freeze({
    state: migrateOwnershipStateV1ToV2(source),
    recoveryId: creatureIds[0]!,
    missionId: creatureIds[1]!,
  });
}

function availabilitySave(): SaveStateV2 {
  return {
    explorerName: 'Explorer',
    hp: 100,
    HP_MAX: 100,
    pstats: { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 },
    chacc: [],
    equip: {},
    equipAff: {},
  } as unknown as SaveStateV2;
}

function availabilityRoster(ownershipV2: OwnershipStateV2): Arc6CombatChampionRosterV1 {
  const roster = projectArc6CombatChampionRosterV1({ ownershipV2, extensions: {} });
  if (roster.kind !== 'projected') throw new Error(`availability roster protected: ${roster.reason}`);
  return roster;
}

function availabilityEncounter() {
  const world = resolveCF1WorldAddress({
    galaxy: { seed: 1594395733, x: -5501.81, y: -11753.64 },
    star: { seed: 4077594722, x: -271.54, y: -67.36 },
    planet: { seed: 488332735 },
  });
  if (!world.ok) throw new Error(world.reason);
  const opportunity = projectWorldOpportunity(world.address);
  const encounter = projectGuardianPrimeEncounterV1({
    world: world.address,
    descriptor: { worldType: opportunity.source.planetType },
    regionIndex: 0,
    faunaRoster: [{ speciesId: 'availability-native', genome: makeGenome(999, 'fauna', 0.5) }],
    claimedSignatureIds: [],
    conquered: false,
  });
  if (encounter === null) throw new Error('availability encounter missing');
  return Object.freeze({ encounter, opportunity });
}

function outcome(
  convergence: CombatCardActionOutcomeV1['convergence'] = 'none',
): CombatCardActionOutcomeV1 {
  return deepFreeze({
    schema: COMBAT_CARD_OUTCOME_SCHEMA,
    kind: convergence === 'none' ? 'verified-win' : 'committed-unknown',
    convergence,
    title: convergence === 'none' ? 'Explorer prevailed.' : 'Combat committed.',
    detail: convergence === 'none'
      ? 'Durable receipt verified.' : 'Reloading durable truth; do not challenge again.',
  });
}

function shell(): Readonly<{
  document: Document;
  root: HTMLElement;
  mount: HTMLElement;
}> {
  dom = new JSDOM('<!doctype html><body><aside id="survey"><section data-combat-card-body></section></aside></body>');
  installDomGlobals(dom.window);
  return {
    document: dom.window.document,
    root: dom.window.document.getElementById('survey') as HTMLElement,
    mount: dom.window.document.querySelector('[data-combat-card-body]') as HTMLElement,
  };
}

function trustedChallengeGestureContract(source: string): boolean {
  const start = source.indexOf('#onClick = (event: Event): void => {');
  const end = source.indexOf('\n\n  constructor(', start);
  if (start < 0 || end < 0) return false;
  const click = source.slice(start, end);
  const gesture = click.indexOf('if (event.isTrusted) this.#onNativeChallengeGesture?.();');
  const lock = click.indexOf('this.#pending = Object.freeze({');
  const challenge = click.indexOf("this.#onAction(Object.freeze({ kind: 'challenge', championId: option.id }));");
  return gesture >= 0 && lock > gesture && challenge > lock
    && click.match(/#onNativeChallengeGesture\?\.\(\)/gu)?.length === 1
    && click.match(/kind: 'challenge'/gu)?.length === 1;
}

describe('Arc 6 combat card', () => {
  it('owns exactly two delegated listeners only while attached and reattaches them once', () => {
    const view = shell();
    const add = vi.spyOn(view.root, 'addEventListener');
    const remove = vi.spyOn(view.root, 'removeEventListener');
    controller = new CombatCardController({ root: view.root, onAction: vi.fn() });
    controller.setState(readModel());
    expect(add).not.toHaveBeenCalled();

    controller.attach(view.mount);
    controller.attach(view.mount);
    expect(add.mock.calls.map(([type]) => type)).toEqual(['change', 'click']);
    controller.detach();
    controller.detach();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(['change', 'click']);

    controller.attach(view.mount);
    expect(add.mock.calls.map(([type]) => type)).toEqual([
      'change', 'click', 'change', 'click',
    ]);
    controller.dispose();
    controller.detach();
    expect(remove.mock.calls.map(([type]) => type)).toEqual([
      'change', 'click', 'change', 'click',
    ]);
  });

  it('renders one labelled 44px champion decision, honest odds, explicit stakes, and a live status region', () => {
    const view = shell();
    controller = new CombatCardController({ root: view.root, onAction: vi.fn() });
    controller.setState(readModel());
    controller.attach(view.mount);

    const label = view.mount.querySelector('label')!;
    const select = view.mount.querySelector<HTMLSelectElement>('[data-combat-champion]')!;
    const button = view.mount.querySelector<HTMLButtonElement>('[data-combat-challenge]')!;
    const status = view.mount.querySelector<HTMLElement>('[role="status"]')!;
    expect(label.htmlFor).toBe(select.id);
    expect(select.value).toBe('__self__');
    expect(button.textContent).toContain('Challenge Pyraxis');
    expect(view.mount.textContent).toContain('Overwhelming · <1% over 160 deterministic simulations');
    expect(view.mount.textContent).toContain('HP stops at 1');
    expect(view.mount.textContent).toContain('party roles and retreat remain open');
    expect(status.getAttribute('aria-live')).toBe('polite');

    expect(indexSource).toContain('[data-combat-champion] { width: 100%; min-height: 44px;');
    expect(indexSource).toContain('[data-combat-challenge] { width: 100%; min-height: 44px;');
    const undersized = indexSource
      .replace('[data-combat-challenge] { width: 100%; min-height: 44px;',
        '[data-combat-challenge] { width: 100%; min-height: 20px;');
    expect(undersized).not.toContain('[data-combat-challenge] { width: 100%; min-height: 44px;');
  });

  it('keeps mission and Recovery champions visible but disabled, rejects a forged selection, and unlocks Recovery at equality', () => {
    const ownership = availabilityOwnership();
    const championRoster = availabilityRoster(ownership.state);
    const { encounter } = availabilityEncounter();
    const blocked = projectCombatCardReadModelV1({
      contextKey: 'arc6:availability:9999',
      encounter,
      state: availabilitySave(),
      ownershipV2: ownership.state,
      championRoster,
      observedActivePlayMs: 9_999,
      selectedChampionId: ownership.recoveryId,
      unavailableReason: null,
    });
    expect(blocked).not.toBeNull();
    const recovery = blocked!.championOptions.find((row) => row.id === ownership.recoveryId)!;
    const mission = blocked!.championOptions.find((row) => row.id === ownership.missionId)!;
    expect(blocked!.championOptions).toHaveLength(3);
    expect(blocked!.selectedChampionId).toBe('__self__');
    expect(recovery).toMatchObject({ disabled: true });
    expect(recovery.disabledReason).toBe(
      'Recovery 0:01 active play remaining; Breed, combat, and dispatch are locked.',
    );
    expect(mission).toMatchObject({ disabled: true });
    expect(mission.disabledReason).toBe(
      'Away on a companion mission; Breed, combat, and dispatch are locked.',
    );

    const view = shell();
    const onAction = vi.fn();
    controller = new CombatCardController({ root: view.root, onAction });
    controller.setState(blocked);
    controller.attach(view.mount);
    const select = view.mount.querySelector<HTMLSelectElement>('[data-combat-champion]')!;
    const renderedRecovery = [...select.options].find((row) => row.value === ownership.recoveryId)!;
    const renderedMission = [...select.options].find((row) => row.value === ownership.missionId)!;
    expect(renderedRecovery.disabled).toBe(true);
    expect(renderedRecovery.textContent).toContain('Recovery 0:01 active play remaining');
    expect(renderedMission.disabled).toBe(true);
    expect(renderedMission.textContent).toContain('Away on a companion mission');
    Object.defineProperty(select, 'value', {
      configurable: true,
      value: ownership.recoveryId,
    });
    select.dispatchEvent(new dom!.window.Event('change', { bubbles: true }));
    expect(onAction).not.toHaveBeenCalled();

    const ready = projectCombatCardReadModelV1({
      contextKey: 'arc6:availability:10000',
      encounter,
      state: availabilitySave(),
      ownershipV2: ownership.state,
      championRoster,
      observedActivePlayMs: 10_000,
      selectedChampionId: ownership.recoveryId,
      unavailableReason: null,
    });
    expect(ready?.observedActivePlayMs).toBe(10_000);
    expect(ready?.selectedChampionId).toBe(ownership.recoveryId);
    expect(ready?.championOptions.find((row) => row.id === ownership.recoveryId))
      .toMatchObject({ disabled: false, disabledReason: null });
    expect(ready?.championOptions.find((row) => row.id === ownership.missionId))
      .toMatchObject({ disabled: true });
  });

  it('refuses forged mission and Recovery champions at the action boundary before any runtime write', async () => {
    const ownership = availabilityOwnership();
    const championRoster = availabilityRoster(ownership.state);
    const { encounter, opportunity } = availabilityEncounter();
    let commitCalls = 0;
    const runtime = Object.freeze({
      async commitCombatSettlement() {
        commitCalls++;
        throw new Error('an assignment-blocked champion must never reach the writer');
      },
    });
    const common = Object.freeze({
      runtime,
      state: availabilitySave(),
      extensions: Object.freeze({}) as V5Extensions,
      encounter,
      opportunity,
      ownershipV2: ownership.state,
      championRosterAuthorityKey: championRoster.authorityKey,
      codecNow: 1_753_900_060_000,
    });

    const recovery = await commitArc6CombatActionV1({
      ...common,
      championId: ownership.recoveryId,
      observedActivePlayMs: 9_999,
    });
    expect(recovery).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'champion:recovery-active', transaction: null,
    });

    const mission = await commitArc6CombatActionV1({
      ...common,
      championId: ownership.missionId,
      observedActivePlayMs: 10_000,
    });
    expect(mission).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'champion:mission-assigned', transaction: null,
    });
    expect(commitCalls).toBe(0);
    expect(projectArc6CombatChampionAvailabilityV1({
      ownershipV2: ownership.state,
      guardianRoster: championRoster,
      championId: ownership.recoveryId,
      observedActivePlayMs: 10_000,
    })).toEqual({ kind: 'available', activePlayMs: 10_000 });
  });

  it('locks synchronously before emitting one immutable challenge and keeps Close outside its ownership', () => {
    const view = shell();
    const onNativeChallengeGesture = vi.fn();
    const onAction = vi.fn((request) => {
      expect(Object.isFrozen(request)).toBe(true);
      expect(view.mount.getAttribute('aria-busy')).toBe('true');
      expect(view.mount.querySelector<HTMLButtonElement>('[data-combat-challenge]')!.disabled).toBe(true);
    });
    controller = new CombatCardController({ root: view.root, onNativeChallengeGesture, onAction });
    controller.setState(readModel());
    controller.attach(view.mount);
    const button = view.mount.querySelector<HTMLButtonElement>('[data-combat-challenge]')!;
    button.click();
    button.dispatchEvent(new dom!.window.Event('click', { bubbles: true }));
    expect(onNativeChallengeGesture).not.toHaveBeenCalled();
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith({ kind: 'challenge', championId: '__self__' });

    controller.settle(outcome());
    expect(view.mount.querySelector('[role="status"]')?.textContent)
      .toContain('Durable receipt verified');
    expect(view.mount.getAttribute('aria-busy')).toBe('false');
  });

  it('keeps the optional native challenge gesture trusted-only and before the sole challenge emission', () => {
    expect(trustedChallengeGestureContract(combatCardSource)).toBe(true);
    const unguarded = combatCardSource.replace(
      'if (event.isTrusted) this.#onNativeChallengeGesture?.();',
      'this.#onNativeChallengeGesture?.();',
    );
    expect(trustedChallengeGestureContract(unguarded)).toBe(false);
    const late = combatCardSource.replace(
      'if (event.isTrusted) this.#onNativeChallengeGesture?.();',
      '',
    ).replace(
      "this.#onAction(Object.freeze({ kind: 'challenge', championId: option.id }));",
      "this.#onAction(Object.freeze({ kind: 'challenge', championId: option.id }));\n    if (event.isTrusted) this.#onNativeChallengeGesture?.();",
    );
    expect(trustedChallengeGestureContract(late)).toBe(false);
    const duplicate = combatCardSource.replace(
      "this.#onAction(Object.freeze({ kind: 'challenge', championId: option.id }));",
      "this.#onAction(Object.freeze({ kind: 'challenge', championId: option.id }));\n    this.#onAction(Object.freeze({ kind: 'challenge', championId: option.id }));",
    );
    expect(trustedChallengeGestureContract(duplicate)).toBe(false);
  });

  it('retains a terminal convergence latch across mount replacement and never emits a replay', () => {
    const view = shell();
    const onAction = vi.fn();
    controller = new CombatCardController({ root: view.root, onAction });
    controller.setState(readModel());
    controller.attach(view.mount);
    view.mount.querySelector<HTMLButtonElement>('[data-combat-challenge]')!.click();
    controller.settle(outcome('read-only-reload'));
    expect(view.mount.querySelector('[role="status"]')?.getAttribute('data-convergence'))
      .toBe('read-only-reload');
    expect(view.mount.querySelector<HTMLButtonElement>('[data-combat-challenge]')!.disabled).toBe(true);

    controller.detach();
    expect(view.mount.childElementCount).toBe(0);
    const replacement = view.document.createElement('section');
    replacement.setAttribute('data-combat-card-body', '');
    view.root.append(replacement);
    controller.attach(replacement);
    replacement.querySelector<HTMLButtonElement>('[data-combat-challenge]')!
      .dispatchEvent(new dom!.window.Event('click', { bubbles: true }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(replacement.textContent).toContain('do not challenge again');
  });

  it('preserves deterministic 160-run fixed points and reacts to champion mutation', () => {
    const world = resolveCF1WorldAddress({
      galaxy: { seed: 1594395733, x: -5501.81, y: -11753.64 },
      star: { seed: 4077594722, x: -271.54, y: -67.36 },
      planet: { seed: 488332735 },
    });
    if (!world.ok) throw new Error(world.reason);
    const opportunity = projectWorldOpportunity(world.address);
    const encounter = projectGuardianPrimeEncounterV1({
      world: world.address,
      descriptor: { worldType: opportunity.source.planetType },
      regionIndex: 0,
      faunaRoster: [{ speciesId: 'forecast-native', genome: makeGenome(999, 'fauna', 0.5) }],
      claimedSignatureIds: [],
      conquered: false,
    });
    if (encounter === null) throw new Error('forecast encounter missing');
    const champion: PlayerSettlementChampionV1 = {
      kind: 'player', explorerId: 'explorer', name: 'Explorer', genomeSeed: 0x50a1e5,
      currentHp: 100,
      stats: {
        vit: 50, fer: 50, res: 50, agi: 50, ins: 50,
        tier: 0, total: 250, hex: '#ffcf8a', name: 'Explorer', cls: null, lvl: 0,
        ab: { theme: 'player', themeLabel: 'Player', col: '#ffcf8a', n: 'Frontier Resolve', regen: 0.04, taken: 0.9 },
      },
    };
    const first = projectCombatCardForecastV1(champion, encounter);
    expect(projectCombatCardForecastV1(champion, encounter)).toBe(first);
    expect(first.sampleSize).toBe(160);
    expect(first.probability).toBeGreaterThanOrEqual(0);
    expect(first.probability).toBeLessThanOrEqual(1);
    const stronger = deepFreeze({
      ...champion,
      stats: { ...champion.stats, vit: 500, fer: 500, res: 500, agi: 500, ins: 500, total: 2500 },
    });
    const mutated = projectCombatCardForecastV1(stronger, encounter);
    expect(mutated).not.toBe(first);
    expect(mutated.probability).not.toBe(first.probability);
  });
});
