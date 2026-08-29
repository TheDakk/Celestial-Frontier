import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_OWNERSHIP_REVISION,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createSpecimenLotV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  ownershipStateMirrorV2,
  ownershipStateDigestV2,
  registerOwnershipStateMirrorV2,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import {
  createCreatureTombstoneV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
  createSpecimenTombstoneV2,
  ownershipSourceStateV1,
} from '../packages/domain/acquisition/src/model-v2.js';
import {
  COMPENDIUM_FEED_OUTCOME_SCHEMA,
  CompendiumFeedController,
  projectCompendiumFeedV1,
  type CompendiumFeedActionOutcomeV1,
  type CompendiumFeedActionRequestV1,
  type CompendiumFeedReadModelV1,
  type CompendiumFeedRecordV1,
} from '../apps/game/src/compendium-feed.js';

interface TestWindow extends Window {
  readonly Element: typeof Element;
  readonly Event: typeof Event;
  readonly HTMLInputElement: typeof HTMLInputElement;
  close(): void;
}

interface TestDom { readonly window: TestWindow }

interface FeedFixture {
  readonly state: OwnershipStateV2;
  readonly record: CompendiumFeedRecordV1;
  readonly nonFaunaRecord: CompendiumFeedRecordV1;
  readonly readyIds: readonly [CreatureInstanceId, CreatureInstanceId];
  readonly assignedId: CreatureInstanceId;
  readonly cappedId: CreatureInstanceId;
  readonly otherId: CreatureInstanceId;
  readonly floraIds: readonly [SpecimenLotId, SpecimenLotId];
  readonly fungiId: SpecimenLotId;
}

interface FeedShell {
  readonly document: Document;
  readonly root: HTMLElement;
  readonly back: HTMLButtonElement;
  readonly close: HTMLButtonElement;
  mount: HTMLElement;
}

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};

let dom: TestDom | null = null;
let controller: CompendiumFeedController | null = null;

function fixture(options: Readonly<{
  matching?: 'mixed' | 'none' | 'unavailable';
  flora?: boolean;
}> = {}): FeedFixture {
  const fauna = canonicalGenomeIdentityV1({ seed: 11, kingdom: 'fauna', form: 3 });
  const otherFauna = canonicalGenomeIdentityV1({ seed: 17, kingdom: 'fauna', form: 8 });
  const floraOne = canonicalGenomeIdentityV1({ seed: 29, kingdom: 'flora', form: 1 });
  const floraTwo = canonicalGenomeIdentityV1({ seed: 30, kingdom: 'flora', form: 2 });
  const fungi = canonicalGenomeIdentityV1({ seed: 31, kingdom: 'fungi', form: 4 });
  const identities = [
    fauna, fauna, fauna, fauna, otherFauna, floraOne, floraTwo, fungi,
  ] as const;
  const discoveries = identities.map((identity, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `compendium-feed-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `compendium-feed-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0 || index >= 4,
  }));
  const catalogue = [fauna, otherFauna, floraOne, floraTwo, fungi].map((identity, index) => (
    createCatalogSpeciesV1({
      identity,
      alias: identity.kingdom === 'flora' ? `Flora ${index}` : null,
      firstObservationId: discoveries[[0, 4, 5, 6, 7][index]!]!.recordId,
    })
  ));
  const readyIds = Object.freeze([
    ownershipContentId('creature', 'compendium-feed-ready-left') as CreatureInstanceId,
    ownershipContentId('creature', 'compendium-feed-ready-right') as CreatureInstanceId,
  ] as const);
  const assignedId = ownershipContentId(
    'creature', 'compendium-feed-assigned',
  ) as CreatureInstanceId;
  const cappedId = ownershipContentId('creature', 'compendium-feed-capped') as CreatureInstanceId;
  const otherId = ownershipContentId('creature', 'compendium-feed-other') as CreatureInstanceId;
  const creature = (
    creatureId: CreatureInstanceId,
    identity: typeof fauna,
    discoveryIndex: number,
    fed: number,
    nickname: string | null,
    assignment: { readonly kind: 'mission'; readonly missionId: string } | null = null,
  ) => createCreatureInstanceV1({
    creatureId,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname,
    origin: 'legacy',
    acquisitionRecordId: discoveries[discoveryIndex]!.recordId,
    lineage: { kind: 'none', generation: 0 },
    xp: null,
    hurt: null,
    fed,
    brood: null,
    assignment,
    bond: null,
  });
  const matching = options.matching ?? 'mixed';
  const matchingCreatures = matching === 'unavailable'
    ? [
      creature(readyIds[0], fauna, 0, 30, 'Aster', { kind: 'mission', missionId: 'mission-5' }),
      creature(readyIds[1], fauna, 1, 200, null),
      creature(assignedId, fauna, 2, 30, 'Voyager', { kind: 'mission', missionId: 'mission-7' }),
      creature(cappedId, fauna, 3, 200, null),
    ]
    : [
      creature(readyIds[0], fauna, 0, 19, 'Aster'),
      creature(readyIds[1], fauna, 1, 91, null),
      creature(assignedId, fauna, 2, 30, 'Voyager', { kind: 'mission', missionId: 'mission-7' }),
      creature(cappedId, fauna, 3, 200, null),
    ];
  const floraIds = Object.freeze([
    ownershipContentId('specimen', 'compendium-feed-flora-one') as SpecimenLotId,
    ownershipContentId('specimen', 'compendium-feed-flora-two') as SpecimenLotId,
  ] as const);
  const fungiId = ownershipContentId('specimen', 'compendium-feed-fungi') as SpecimenLotId;
  const lots = [
    createSpecimenLotV1({
      lotId: floraIds[0], speciesId: floraOne.speciesId, kind: 'flora', quantity: 3,
      origin: 'legacy', acquisitionRecordId: discoveries[5]!.recordId,
    }),
    createSpecimenLotV1({
      lotId: floraIds[1], speciesId: floraTwo.speciesId, kind: 'flora', quantity: 1,
      origin: 'legacy', acquisitionRecordId: discoveries[6]!.recordId,
    }),
    createSpecimenLotV1({
      lotId: fungiId, speciesId: fungi.speciesId, kind: 'fungi', quantity: 4,
      origin: 'legacy', acquisitionRecordId: discoveries[7]!.recordId,
    }),
  ];
  const source = createInitialOwnershipStateV1({
    catalogSpecies: catalogue,
    discoveries,
    creatures: [
      ...matchingCreatures,
      creature(otherId, otherFauna, 4, 14, 'Other'),
    ],
    specimenLots: lots,
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: matchingCreatures[0]?.creatureId ?? otherId,
  });
  const initial = migrateOwnershipStateV1ToV2(source);
  let state = matching === 'none'
    ? createOwnershipSuccessorV2(initial, {
      source: ownershipSourceStateV1(initial),
      bredAcquisitions: initial.bredAcquisitions,
      creatures: initial.creatures.filter((row) => row.speciesId !== fauna.speciesId),
      creatureTombstones: [
        ...initial.creatureTombstones,
        ...initial.creatures.filter((row) => row.speciesId === fauna.speciesId).map((row, index) => (
          createCreatureTombstoneV2(row, createF4ReceiptEvidenceV2({
            ordinal: index,
            actionKind: 'test-remove-companion',
            witnessDigest: String(index + 1).padStart(64, '0'),
          }))
        )),
      ],
      specimenLots: initial.specimenLots,
      specimenTombstones: initial.specimenTombstones,
      scoutCreatureId: otherId,
    })
    : initial;
  if (options.flora === false) {
    const removed = state.specimenLots.filter((row) => row.kind === 'flora');
    state = createOwnershipSuccessorV2(state, {
      source: ownershipSourceStateV1(state),
      bredAcquisitions: state.bredAcquisitions,
      creatures: state.creatures,
      creatureTombstones: state.creatureTombstones,
      specimenLots: state.specimenLots.filter((row) => row.kind !== 'flora'),
      specimenTombstones: [
        ...state.specimenTombstones,
        ...removed.map((row, index) => createSpecimenTombstoneV2(
          row,
          createF4ReceiptEvidenceV2({
            ordinal: 20 + index,
            actionKind: 'test-remove-flora',
            witnessDigest: String(20 + index).padStart(64, '0'),
          }),
        )),
      ],
      scoutCreatureId: state.scoutCreatureId,
    });
  }
  return Object.freeze({
    state,
    record: Object.freeze({ id: 'codex-fauna', name: 'Sky Grazer', g: fauna.genome }),
    nonFaunaRecord: Object.freeze({ id: 'codex-flora', name: 'Glow Frond', g: floraOne.genome }),
    readyIds,
    assignedId,
    cappedId,
    otherId,
    floraIds,
    fungiId,
  });
}

function model(
  f: FeedFixture,
  options: Readonly<{
    generation?: number;
    logicalId?: string;
    record?: CompendiumFeedRecordV1;
    ownership?: OwnershipStateV2 | null;
    protected?: boolean;
    fixture?: boolean;
  }> = {},
): CompendiumFeedReadModelV1 {
  return projectCompendiumFeedV1({
    generation: options.generation ?? 7,
    logicalId: options.logicalId ?? 'codex-fauna',
    record: options.record ?? f.record,
    ownership: options.ownership === undefined ? f.state : options.ownership,
    protected: options.protected ?? false,
    fixture: options.fixture ?? false,
  });
}

function shell(): FeedShell {
  dom = new JSDOM(`<!doctype html><html><body>
    <aside id="codexpanel" aria-label="Compendium" style="display:block">
      <button id="codex-close" type="button">Close</button>
      <button id="codexback" type="button">Back</button>
      <div data-arc5-feed-body></div>
    </aside>
  </body></html>`);
  const document = dom.window.document;
  return {
    document,
    root: document.getElementById('codexpanel') as HTMLElement,
    close: document.getElementById('codex-close') as HTMLButtonElement,
    back: document.getElementById('codexback') as HTMLButtonElement,
    mount: document.querySelector('[data-arc5-feed-body]') as HTMLElement,
  };
}

function radio(
  view: FeedShell,
  selector: 'creature' | 'flora',
  id: CreatureInstanceId | SpecimenLotId,
): HTMLInputElement {
  const attribute = selector === 'creature'
    ? 'data-arc5-feed-creature-id'
    : 'data-arc5-feed-food-lot-id';
  return [...view.mount.querySelectorAll<HTMLInputElement>(`input[${attribute}]`)]
    .find((candidate) => candidate.getAttribute(attribute) === id)!;
}

function choose(
  view: FeedShell,
  selector: 'creature' | 'flora',
  id: CreatureInstanceId | SpecimenLotId,
): HTMLInputElement {
  const input = radio(view, selector, id);
  input.focus();
  input.checked = true;
  input.dispatchEvent(new dom!.window.Event('change', { bubbles: true }));
  return radio(view, selector, id);
}

function outcome(
  request: CompendiumFeedActionRequestV1,
  input: Readonly<{
    kind?: CompendiumFeedActionOutcomeV1['kind'];
    convergence?: CompendiumFeedActionOutcomeV1['convergence'];
    title?: string;
    detail?: string;
  }> = {},
): CompendiumFeedActionOutcomeV1 {
  return Object.freeze({
    schema: COMPENDIUM_FEED_OUTCOME_SCHEMA,
    kind: input.kind ?? 'refused',
    convergence: input.convergence ?? 'none',
    request,
    title: input.title ?? 'Nothing was used.',
    detail: input.detail ?? 'The exact request was refused before durability.',
  });
}

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
});

describe('Arc 5 Compendium Feed projection and controller', () => {
  it('projects exact same-species individuals and flora-only lots from registered V2 authority', () => {
    const f = fixture();
    const projected = model(f);

    expect(Object.isFrozen(projected)).toBe(true);
    expect(Object.isFrozen(projected.surface)).toBe(true);
    expect(Object.isFrozen(projected.creatures)).toBe(true);
    expect(projected).toMatchObject({
      availability: 'ready',
      ownershipRevision: f.state.revision,
      ownershipDigest: ownershipStateDigestV2(f.state),
    });
    expect(projected.surface).toMatchObject({
      generation: 7,
      logicalId: 'codex-fauna',
      speciesId: f.state.creatures.find((row) => row.creatureId === f.readyIds[0])!.speciesId,
    });
    expect(new Set(projected.creatures.map((row) => row.creatureId))).toEqual(new Set([
      ...f.readyIds, f.assignedId, f.cappedId,
    ]));
    expect(projected.creatures.find((row) => row.creatureId === f.readyIds[0])).toMatchObject({
      status: 'ready', fedBefore: 19, fedAfter: 20,
    });
    expect(projected.creatures.find((row) => row.creatureId === f.readyIds[1])).toMatchObject({
      status: 'ready', fedBefore: 91, fedAfter: 92,
    });
    expect(projected.creatures.find((row) => row.creatureId === f.assignedId)).toMatchObject({
      status: 'assigned', fedBefore: 30, fedAfter: 31,
    });
    expect(projected.creatures.find((row) => row.creatureId === f.cappedId)).toMatchObject({
      status: 'capped', fedBefore: 200, fedAfter: 200,
    });
    expect(projected.creatures.find((row) => row.creatureId === f.readyIds[0])!.label)
      .toContain(f.readyIds[0].slice(-8));
    expect(projected.creatures.find((row) => row.creatureId === f.assignedId)!.disabledReason)
      .toMatch(/mission/i);
    expect(projected.creatures.find((row) => row.creatureId === f.cappedId)!.disabledReason)
      .toMatch(/200/);
    expect(projected.floraLots.map((row) => [
      row.foodLotId, row.quantityBefore, row.quantityAfter,
    ])).toEqual([
      [f.floraIds[0], 3, 2],
      [f.floraIds[1], 1, 0],
    ]);
    expect(projected.floraLots.some((row) => row.foodLotId === f.fungiId)).toBe(false);
  });

  it('fails closed for fixture, non-fauna, protected, unregistered, missing-companion and missing-flora inputs', () => {
    const f = fixture();
    expect(model(f, { fixture: true })).toMatchObject({
      availability: 'fixture', creatures: [], floraLots: [],
    });
    expect(model(f, {
      logicalId: 'codex-flora', record: f.nonFaunaRecord,
    })).toMatchObject({ availability: 'non-fauna', creatures: [], floraLots: [] });
    expect(model(f, { protected: true }).availability).toBe('protected');
    expect(model(f, { ownership: null }).availability).toBe('protected');
    expect(model(f, { ownership: { ...f.state } as OwnershipStateV2 }).availability)
      .toBe('protected');

    const noCompanion = fixture({ matching: 'none' });
    expect(model(noCompanion)).toMatchObject({
      availability: 'no-companion', creatures: [],
    });
    const noEligible = fixture({ matching: 'unavailable' });
    expect(model(noEligible)).toMatchObject({ availability: 'no-eligible-companion' });
    expect(model(noEligible).creatures).toHaveLength(4);
    expect(model(noEligible).creatures.every(
      (row) => row.status === 'assigned' || row.status === 'capped',
    )).toBe(true);
    const noFlora = fixture({ flora: false });
    expect(model(noFlora)).toMatchObject({ availability: 'no-flora', floraLots: [] });

    const mismatched = Object.freeze({ ...f.record, id: 'wrong-row' });
    expect(model(f, { record: mismatched }).availability).toBe('protected');

    const exhausted = registerOwnershipStateMirrorV2({
      ...ownershipStateMirrorV2(f.state),
      revision: MAX_OWNERSHIP_REVISION,
    }, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    const exhaustedModel = model(f, { ownership: exhausted });
    expect(exhaustedModel).toMatchObject({
      availability: 'protected', ownershipRevision: MAX_OWNERSHIP_REVISION,
    });
    expect(exhaustedModel.detail).toMatch(/revision ceiling/i);
    const view = shell();
    const onAction = vi.fn();
    controller = new CompendiumFeedController({
      root: view.root,
      isCurrent: (surface) => surface.generation === 7,
      onAction,
    });
    controller.setState(exhaustedModel);
    controller.attach(view.mount);
    expect(view.mount.querySelector('[data-arc5-feed-confirm]')).toBeNull();
    expect([...view.mount.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
      .every((input) => input.disabled)).toBe(true);
    view.mount.dispatchEvent(new dom!.window.Event('click', { bubbles: true }));
    expect(onAction).not.toHaveBeenCalled();
  });

  it('renders native exact-ID choices, 44px labels, one Use 1 preview, and no owned Back or Close', () => {
    const f = fixture();
    const view = shell();
    const onAction = vi.fn();
    let currentGeneration = 7;
    controller = new CompendiumFeedController({
      root: view.root,
      isCurrent: (surface) => surface.generation === currentGeneration,
      onAction,
    });
    controller.setState(model(f));
    controller.attach(view.mount);

    expect([...view.mount.querySelectorAll('fieldset legend')].map((node) => node.textContent))
      .toEqual(['Choose an owned companion', 'Choose one flora lot']);
    expect([...view.mount.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
      .every((input) => input.name === 'arc5-feed-creature'
        || input.name === 'arc5-feed-flora')).toBe(true);
    expect(radio(view, 'creature', f.assignedId).disabled).toBe(true);
    expect(radio(view, 'creature', f.cappedId).disabled).toBe(true);
    expect(radio(view, 'creature', f.readyIds[1]).value).toBe(f.readyIds[1]);
    expect(radio(view, 'flora', f.floraIds[1]).value).toBe(f.floraIds[1]);
    expect(view.mount.querySelector(`[data-arc5-feed-flora-label="${f.fungiId}"]`)).toBeNull();
    expect([...view.mount.querySelectorAll<HTMLLabelElement>('.compendium-feed-choice')]
      .every((label) => label.style.minHeight === '44px')).toBe(true);
    const status = view.mount.querySelector<HTMLElement>('[data-arc5-feed-status]')!;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-atomic')).toBe('true');
    expect(view.mount.querySelectorAll('[data-arc5-feed-confirm]')).toHaveLength(1);
    expect(view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.textContent)
      .toBe('Use 1');
    expect(view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.disabled)
      .toBe(true);

    const focusedCreature = choose(view, 'creature', f.readyIds[1]);
    expect(view.document.activeElement).toBe(focusedCreature);
    const focusedFlora = choose(view, 'flora', f.floraIds[1]);
    expect(view.document.activeElement).toBe(focusedFlora);
    expect(view.mount.querySelector('[data-arc5-feed-summary]')?.textContent)
      .toMatch(/Meals 91 → 92.*Use 1.*Quantity 1 → 0/u);
    expect(view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.disabled)
      .toBe(false);
    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 0,
      actionControlCount: 1,
      radioControlCount: 6,
      delegatedListenerCount: 2,
      selectedCreatureId: f.readyIds[1],
      selectedFoodLotId: f.floraIds[1],
    });

    view.back.click();
    view.close.click();
    expect(onAction).not.toHaveBeenCalled();
    expect(view.back.disabled).toBe(false);
    expect(view.close.disabled).toBe(false);
    currentGeneration = 7;
  });

  it('locks synchronously before one frozen request escapes and keeps status focus without optimism', () => {
    const f = fixture();
    const view = shell();
    const onNativeFeedGesture = vi.fn();
    let observed: CompendiumFeedActionRequestV1 | null = null;
    const onAction = vi.fn((request: CompendiumFeedActionRequestV1) => {
      observed = request;
      expect(Object.isFrozen(request)).toBe(true);
      expect(request.creatureId).toBe(f.readyIds[1]);
      expect(request.foodLotId).toBe(f.floraIds[1]);
      expect(request).toMatchObject({
        fedBefore: 91, fedAfter: 92, foodQuantityBefore: 1, foodQuantityAfter: 0,
      });
      expect(view.mount.getAttribute('aria-busy')).toBe('true');
      expect([...view.mount.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
        .every((input) => input.disabled)).toBe(true);
      expect(view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.disabled)
        .toBe(true);
      expect(view.document.activeElement).toBe(
        view.mount.querySelector('[data-arc5-feed-status]'),
      );
      view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!
        .dispatchEvent(new dom!.window.Event('click', { bubbles: true }));
    });
    controller = new CompendiumFeedController({
      root: view.root,
      isCurrent: (surface) => surface.generation === 7,
      onNativeFeedGesture,
      onAction,
    });
    controller.setState(model(f));
    controller.attach(view.mount);
    choose(view, 'creature', f.readyIds[1]);
    choose(view, 'flora', f.floraIds[1]);
    const previewBefore = view.mount.querySelector('[data-arc5-feed-summary]')?.textContent;

    view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.click();

    expect(onAction).toHaveBeenCalledOnce();
    expect(onNativeFeedGesture).not.toHaveBeenCalled();
    expect(view.mount.querySelector('[data-arc5-feed-summary]')?.textContent).toBe(previewBefore);
    expect(view.mount.querySelector('[data-arc5-feed-status]')?.textContent)
      .toMatch(/stay unchanged until the durable outcome settles/i);
    expect(view.back.disabled).toBe(false);
    expect(view.close.disabled).toBe(false);
    expect(controller.diagnostics()).toMatchObject({ pendingWork: 1 });

    const wrongRequest = Object.freeze({ ...observed!, foodLotId: f.floraIds[0] });
    expect(() => controller!.settle(outcome(wrongRequest))).toThrow(/exact request/);
    expect(controller.diagnostics()).toMatchObject({ pendingWork: 1 });

    controller.settle(outcome(observed!));
    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 0,
      selectedCreatureId: f.readyIds[1],
      selectedFoodLotId: f.floraIds[1],
    });
    expect(view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.disabled)
      .toBe(false);
    expect(view.document.activeElement).toBe(
      view.mount.querySelector('[data-arc5-feed-status]'),
    );

    view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.click();
    expect(onAction).toHaveBeenCalledTimes(2);
    controller.settle(outcome(observed!, {
      convergence: 'read-only-reload',
      title: 'Feed could not be verified.',
      detail: 'This detail remains read-only while ownership reloads.',
    }));
    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 0,
      convergenceLatched: true,
    });
    expect(view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.disabled)
      .toBe(true);
    view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!
      .dispatchEvent(new dom!.window.Event('click', { bubbles: true }));
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('suppresses stale generations and never rebuilds or focuses a closed detail after settlement', () => {
    const f = fixture();
    const view = shell();
    let currentGeneration = 7;
    let request: CompendiumFeedActionRequestV1 | null = null;
    const onAction = vi.fn((value: CompendiumFeedActionRequestV1) => { request = value; });
    controller = new CompendiumFeedController({
      root: view.root,
      isCurrent: (surface) => surface.generation === currentGeneration,
      onAction,
    });
    controller.setState(model(f));
    controller.attach(view.mount);
    choose(view, 'creature', f.readyIds[0]);
    choose(view, 'flora', f.floraIds[0]);

    currentGeneration = 8;
    controller.refresh();
    expect(view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.disabled)
      .toBe(true);
    view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!
      .dispatchEvent(new dom!.window.Event('click', { bubbles: true }));
    expect(onAction).not.toHaveBeenCalled();

    controller.setState(model(f, { generation: 8 }));
    choose(view, 'creature', f.readyIds[0]);
    choose(view, 'flora', f.floraIds[0]);
    view.mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]')!.click();
    expect(onAction).toHaveBeenCalledOnce();
    expect(request).not.toBeNull();

    const closedMount = view.mount;
    view.root.style.display = 'none';
    controller.refresh();
    expect(closedMount.childElementCount).toBe(0);
    expect(controller.diagnostics()).toMatchObject({ attachedMountCount: 0, pendingWork: 1 });
    controller.settle(outcome(request!, {
      kind: 'committed',
      title: 'Meal complete.',
      detail: 'Meals 19 → 20. Used 1 flora; 2 remain.',
    }));
    expect(closedMount.childElementCount).toBe(0);
    expect(view.document.activeElement).not.toBe(closedMount);

    view.root.style.display = 'block';
    currentGeneration = 9;
    controller.setState(model(f, { generation: 9 }));
    closedMount.remove();
    const nextMount = view.document.createElement('div');
    nextMount.setAttribute('data-arc5-feed-body', '');
    view.root.append(nextMount);
    view.mount = nextMount;
    controller.attach(nextMount);
    expect(nextMount.querySelector<HTMLElement>('[data-arc5-feed-status]')!.hidden).toBe(true);
    expect(nextMount.textContent).not.toContain('Meal complete.');
    expect(controller.diagnostics()).toMatchObject({ attachedMountCount: 1, pendingWork: 0 });
  });
});
