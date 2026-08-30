import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  type CreatureAssignmentV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { companionBreedOddsV1 } from '@cf/domain-acquisition/breed-internal';
import { makeGenome } from '@cf/domain-genome';
import {
  COMPENDIUM_BREED_OUTCOME_SCHEMA,
  COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1,
  CompendiumBreedController,
  projectCompendiumBreedV1,
  type CompendiumBreedActionOutcomeV1,
  type CompendiumBreedActionRequestV1,
  type CompendiumBreedReadModelV1,
  type CompendiumBreedRecordV1,
} from '../apps/game/src/compendium-breed.js';

interface TestWindow extends Window {
  readonly Event: typeof Event;
  close(): void;
}

interface TestDom { readonly window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string) => TestDom;
};

interface CreatureSpec {
  readonly seed: number;
  readonly sameSpecies?: boolean;
  readonly nickname: string;
  readonly hurt?: number | null;
  readonly assignment?: CreatureAssignmentV1 | null;
  readonly exhibit?: boolean;
}

interface Fixture {
  readonly state: OwnershipStateV2;
  readonly record: CompendiumBreedRecordV1;
  readonly primaryReadyId: CreatureInstanceId;
  readonly primaryRecoveryId: CreatureInstanceId;
  readonly mateReadyId: CreatureInstanceId;
  readonly mateInjuredId: CreatureInstanceId;
  readonly exhibitId: CreatureInstanceId;
  readonly missionId: CreatureInstanceId;
}

function fixture(extra: readonly CreatureSpec[] = []): Fixture {
  const primary = canonicalGenomeIdentityV1(makeGenome(101, 'fauna', 0.45));
  const specs: readonly CreatureSpec[] = [
    { seed: 101, sameSpecies: true, nickname: 'Lumen' },
    {
      seed: 101,
      sameSpecies: true,
      nickname: 'Resting Lumen',
      assignment: { kind: 'recovery', readyAtActivePlayMs: 10_000 },
    },
    { seed: 202, nickname: 'Vesper' },
    { seed: 303, nickname: 'Bruised Nova', hurt: 0.3 },
    { seed: 404, nickname: 'Arena Echo', exhibit: true },
    {
      seed: 505,
      nickname: 'Away Comet',
      assignment: { kind: 'mission', missionId: 'mission-visible-lock' },
    },
    ...extra,
  ];
  const identities = specs.map((spec) => spec.sameSpecies
    ? primary
    : canonicalGenomeIdentityV1({
      ...makeGenome(spec.seed, 'fauna', 0.55),
      ...(spec.exhibit ? { exhibit: true } : {}),
    }));
  const discoveries = identities.map((identity, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `breed-ui-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `breed-ui-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: identities.findIndex((candidate) => candidate.speciesId === identity.speciesId)
      === index,
  }));
  const catalogue = identities
    .map((identity, index) => ({ identity, index }))
    .filter(({ identity }, index, rows) => rows.findIndex(
      (candidate) => candidate.identity.speciesId === identity.speciesId,
    ) === index)
    .map(({ identity, index }) => createCatalogSpeciesV1({
      identity,
      alias: specs[index]!.sameSpecies ? 'Aurora Beast' : `Fauna ${index}`,
      firstObservationId: discoveries[index]!.recordId,
    }));
  const creatureIds = specs.map((_, index) => (
    ownershipContentId('creature', `breed-ui-${index}`) as CreatureInstanceId
  ));
  const creatures = specs.map((spec, index) => createCreatureInstanceV1({
    creatureId: creatureIds[index]!,
    speciesId: identities[index]!.speciesId,
    genomeIdentity: identities[index]!.genomeIdentity,
    genome: identities[index]!.genome,
    nickname: spec.nickname,
    origin: 'legacy',
    acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: identities[index]!.genome.gen as number },
    xp: 0,
    hurt: spec.hurt ?? null,
    fed: 0,
    brood: 0,
    assignment: spec.assignment ?? null,
    bond: null,
  }));
  const source = createInitialOwnershipStateV1({
    catalogSpecies: catalogue,
    discoveries,
    creatures,
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: creatureIds[0]!,
  });
  return Object.freeze({
    state: migrateOwnershipStateV1ToV2(source),
    record: Object.freeze({
      id: 'codex-fauna',
      name: 'Aurora Beast',
      g: primary.genome,
    }),
    primaryReadyId: creatureIds[0]!,
    primaryRecoveryId: creatureIds[1]!,
    mateReadyId: creatureIds[2]!,
    mateInjuredId: creatureIds[3]!,
    exhibitId: creatureIds[4]!,
    missionId: creatureIds[5]!,
  });
}

function model(
  value: Fixture,
  options: Readonly<{
    state?: OwnershipStateV2 | null;
    activePlayMs?: number;
    protected?: boolean;
    fixture?: boolean;
    record?: CompendiumBreedRecordV1;
  }> = {},
): CompendiumBreedReadModelV1 {
  return projectCompendiumBreedV1({
    generation: 7,
    logicalId: 'codex-fauna',
    record: options.record ?? value.record,
    ownership: options.state === undefined ? value.state : options.state,
    protected: options.protected ?? false,
    fixture: options.fixture ?? false,
    activePlayMs: options.activePlayMs ?? 1_000,
    earnedStardust: 750,
  });
}

let dom: TestDom | null = null;
let controller: CompendiumBreedController | null = null;

function shell(): Readonly<{
  root: HTMLElement;
  mount: HTMLElement;
}> {
  dom = new JSDOM(`<!doctype html><html><body>
    <aside id="codexpanel" style="display:block">
      <div data-arc5-breed-body class="compendium-feed"></div>
    </aside>
  </body></html>`);
  return Object.freeze({
    root: dom.window.document.getElementById('codexpanel') as HTMLElement,
    mount: dom.window.document.querySelector('[data-arc5-breed-body]') as HTMLElement,
  });
}

function choose(
  mount: HTMLElement,
  kind: 'primary' | 'mate',
  creatureId: CreatureInstanceId,
): void {
  const input = [...mount.querySelectorAll<HTMLInputElement>(
    `input[data-arc5-breed-choice="${kind}"]`,
  )].find((candidate) => candidate.dataset.arc5BreedCreatureId === creatureId);
  if (!input) throw new Error(`missing ${kind} ${creatureId}`);
  input.checked = true;
  input.dispatchEvent(new dom!.window.Event('change', { bubbles: true }));
}

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
});

describe('Arc 5 Compendium Breed projection and controller', () => {
  it('owns exactly two delegated listeners only while attached and reattaches once', () => {
    const value = fixture();
    const view = shell();
    controller = new CompendiumBreedController({ root: view.root, isCurrent: () => true });
    controller.setState(model(value));
    expect(controller.diagnostics().delegatedListenerCount).toBe(0);

    controller.attach(view.mount);
    controller.attach(view.mount);
    expect(controller.diagnostics()).toMatchObject({
      attachedMountCount: 1,
      delegatedListenerCount: 2,
    });
    controller.detach();
    controller.detach();
    expect(controller.diagnostics()).toMatchObject({
      attachedMountCount: 0,
      retainedDomCount: 0,
      delegatedListenerCount: 0,
    });

    controller.attach(view.mount);
    expect(controller.diagnostics()).toMatchObject({
      attachedMountCount: 1,
      delegatedListenerCount: 2,
      contextKey: model(value).contextKey,
    });
    controller.dispose();
    controller.detach();
    expect(controller.diagnostics().delegatedListenerCount).toBe(0);
  });

  it('projects exact current-species primaries, universe fauna mates, and visible locks', () => {
    const value = fixture();
    const projected = model(value);
    expect(projected).toMatchObject({
      availability: 'ready',
      ownershipRevision: value.state.revision,
      earnedStardustBonus: 0.15,
    });
    expect(projected.primaryParents.map((row) => row.creatureId)).toEqual([
      value.primaryReadyId,
      value.primaryRecoveryId,
    ]);
    expect(projected.primaryParents.find((row) => row.creatureId === value.primaryRecoveryId))
      .toMatchObject({
        status: 'recovery',
        recoveryRemainingActivePlayMs: 9_000,
      });
    expect(projected.primaryParents.find((row) => row.creatureId === value.primaryRecoveryId)
      ?.disabledReason).toContain('Breed, combat, and dispatch are locked');
    expect(projected.mateParents.find((row) => row.creatureId === value.mateInjuredId))
      .toMatchObject({ status: 'injured', hurt: 0.3 });
    expect(projected.mateParents.find((row) => row.creatureId === value.exhibitId))
      .toMatchObject({ status: 'exhibit' });
    expect(projected.mateParents.find((row) => row.creatureId === value.missionId))
      .toMatchObject({ status: 'mission' });
  });

  it('canonicalizes Recovery to ready at the exact active-play boundary', () => {
    const value = fixture();
    expect(model(value, { activePlayMs: 9_999 }).primaryParents
      .find((row) => row.creatureId === value.primaryRecoveryId)?.status).toBe('recovery');
    expect(model(value, { activePlayMs: 10_000 }).primaryParents
      .find((row) => row.creatureId === value.primaryRecoveryId)?.status).toBe('ready');
  });

  it('fails closed for fixtures, non-fauna, protected ownership, and absent companions', () => {
    const value = fixture();
    expect(model(value, { fixture: true }).availability).toBe('fixture');
    expect(model(value, { protected: true }).availability).toBe('protected');
    const flora = canonicalGenomeIdentityV1(makeGenome(909, 'flora', 0.5));
    expect(model(value, { record: Object.freeze({
      id: 'codex-fauna', name: 'Not fauna', g: flora.genome,
    }) }).availability).toBe('non-fauna');
    const other = fixture([{ seed: 818, nickname: 'Other fauna' }]);
    const absent = canonicalGenomeIdentityV1(makeGenome(717, 'fauna', 0.5));
    expect(model(other, { record: Object.freeze({
      id: 'codex-fauna', name: 'Absent fauna', g: absent.genome,
    }) }).availability).toBe('protected');
  });

  it('shows exact odds and explicit nonlethal Recovery before one confirmation', () => {
    const value = fixture();
    const view = shell();
    const requests: CompendiumBreedActionRequestV1[] = [];
    controller = new CompendiumBreedController({
      root: view.root,
      isCurrent: () => true,
      onAction: (next) => { requests.push(next); },
    });
    controller.setState(model(value));
    controller.attach(view.mount);
    choose(view.mount, 'primary', value.primaryReadyId);
    choose(view.mount, 'mate', value.mateReadyId);

    const summary = view.mount.querySelector<HTMLElement>('[data-arc5-breed-summary]')!;
    const confirm = view.mount.querySelector<HTMLButtonElement>('[data-arc5-breed-confirm]')!;
    const left = model(value).primaryParents.find((row) => row.creatureId === value.primaryReadyId)!;
    const right = model(value).mateParents.find((row) => row.creatureId === value.mateReadyId)!;
    const odds = companionBreedOddsV1(left.tier, right.tier, 0.15);
    expect(Number(summary.dataset.odds)).toBe(odds);
    expect(summary.textContent).toContain(`${Math.round(odds * 100)}% success`);
    expect(summary.textContent).toContain('Both parents remain yours');
    expect(summary.textContent).toContain('8 active-play minutes');
    expect(summary.textContent).toContain('failure gives 2');
    expect(view.mount.textContent).not.toMatch(/\bTier\s+\d+/u);
    expect(confirm.disabled).toBe(false);
    confirm.click();
    expect(requests[0]?.parentCreatureIds).toEqual([value.primaryReadyId, value.mateReadyId]);
    expect(requests[0]?.odds).toBe(odds);
  });

  it('paints pending before dispatch and reveals no optimistic child or Recovery', () => {
    const value = fixture();
    const view = shell();
    const diagnosticsAtDispatch: ReturnType<CompendiumBreedController['diagnostics']>[] = [];
    controller = new CompendiumBreedController({
      root: view.root,
      isCurrent: () => true,
      onAction: () => { diagnosticsAtDispatch.push(controller!.diagnostics()); },
    });
    controller.setState(model(value));
    controller.attach(view.mount);
    choose(view.mount, 'primary', value.primaryReadyId);
    choose(view.mount, 'mate', value.mateReadyId);
    view.mount.querySelector<HTMLButtonElement>('[data-arc5-breed-confirm]')!.click();

    expect(diagnosticsAtDispatch[0]?.pendingWork).toBe(1);
    const status = view.mount.querySelector<HTMLElement>('[data-arc5-breed-status]')!;
    expect(status.textContent).toContain('No child or Recovery is shown until the save commits');
    expect(view.mount.textContent).not.toContain('New bloodline secured');
    expect(view.mount.querySelector<HTMLButtonElement>('[data-arc5-breed-confirm]')?.disabled)
      .toBe(true);
  });

  it('publishes only matching committed outcomes and latches read-only convergence', () => {
    const value = fixture();
    const view = shell();
    let request: CompendiumBreedActionRequestV1 | null = null;
    controller = new CompendiumBreedController({
      root: view.root,
      isCurrent: () => true,
      onAction: (next) => { request = next; },
    });
    controller.setState(model(value));
    controller.attach(view.mount);
    choose(view.mount, 'primary', value.primaryReadyId);
    choose(view.mount, 'mate', value.mateReadyId);
    view.mount.querySelector<HTMLButtonElement>('[data-arc5-breed-confirm]')!.click();
    const committed: CompendiumBreedActionOutcomeV1 = Object.freeze({
      schema: COMPENDIUM_BREED_OUTCOME_SCHEMA,
      kind: 'committed-convergence',
      convergence: 'read-only-reload',
      request: request!,
      title: 'Breeding saved — reload required.',
      detail: 'The result is durable; reloading cannot breed twice.',
    });
    controller.settle(committed);
    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 0,
      convergenceLatched: true,
      lastOutcome: committed,
    });
    expect(view.mount.querySelector('[data-arc5-breed-status]')?.textContent)
      .toContain('Breeding saved — reload required');
    expect([...view.mount.querySelectorAll<HTMLInputElement>('[data-arc5-breed-choice]')]
      .every((input) => input.disabled)).toBe(true);
  });

  it('keeps each parent selector to one bounded DOM page', () => {
    const extra = Array.from({ length: 55 }, (_, index): CreatureSpec => ({
      seed: 1_000 + index,
      nickname: `Mate ${String(index).padStart(2, '0')}`,
    }));
    const value = fixture(extra);
    const view = shell();
    controller = new CompendiumBreedController({ root: view.root, isCurrent: () => true });
    controller.setState(model(value));
    controller.attach(view.mount);
    const controls = view.mount.querySelectorAll('[data-arc5-breed-choice]');
    expect(controls.length).toBeLessThanOrEqual(COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1 * 2);
    const next = view.mount.querySelector<HTMLButtonElement>(
      '[data-arc5-breed-page="mate"][data-arc5-breed-direction="next"]',
    )!;
    expect(next.disabled).toBe(false);
    next.click();
    expect(controller.diagnostics().matePage).toBe(1);
    expect(view.mount.querySelectorAll('[data-arc5-breed-choice]').length)
      .toBeLessThanOrEqual(COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1 * 2);
  });

  it('disables distinct-parent and stale-surface violations before dispatch', () => {
    const value = fixture();
    const view = shell();
    let current = true;
    let actions = 0;
    controller = new CompendiumBreedController({
      root: view.root,
      isCurrent: () => current,
      onAction: () => { actions++; },
    });
    controller.setState(model(value));
    controller.attach(view.mount);
    choose(view.mount, 'primary', value.primaryReadyId);
    const same = [...view.mount.querySelectorAll<HTMLInputElement>(
      '[data-arc5-breed-choice="mate"]',
    )].find((candidate) => candidate.dataset.arc5BreedCreatureId === value.primaryReadyId)!;
    expect(same.disabled).toBe(true);
    choose(view.mount, 'mate', value.mateReadyId);
    current = false;
    controller.refresh();
    const confirm = view.mount.querySelector<HTMLButtonElement>('[data-arc5-breed-confirm]')!;
    expect(confirm.disabled).toBe(true);
    confirm.click();
    expect(actions).toBe(0);
  });
});
