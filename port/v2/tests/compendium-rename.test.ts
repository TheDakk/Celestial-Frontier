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
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { makeGenome } from '@cf/domain-genome';
import {
  COMPENDIUM_RENAME_OUTCOME_SCHEMA,
  COMPENDIUM_RENAME_PAGE_SIZE_V1,
  CompendiumRenameController,
  projectCompendiumRenameV1,
  type CompendiumRenameActionOutcomeV1,
  type CompendiumRenameActionRequestV1,
  type CompendiumRenameReadModelV1,
  type CompendiumRenameRecordV1,
} from '../apps/game/src/compendium-rename.js';

interface TestWindow extends Window { readonly Event: typeof Event; close(): void; }
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

function fixture(count = 3): Readonly<{
  state: OwnershipStateV2;
  record: CompendiumRenameRecordV1;
  ids: readonly CreatureInstanceId[];
}> {
  const identity = canonicalGenomeIdentityV1(makeGenome(707, 'fauna', 0.52));
  const discoveries = Array.from({ length: count }, (_, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `rename-ui-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `rename-ui-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0,
  }));
  const ids = discoveries.map((_, index) => (
    ownershipContentId('creature', `rename-ui-${index}`) as CreatureInstanceId
  ));
  const creatures = discoveries.map((discovery, index) => createCreatureInstanceV1({
    creatureId: ids[index]!,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: index === 0 ? 'Alpha' : index === 1 ? 'Beta' : `Twin ${index}`,
    origin: 'legacy',
    acquisitionRecordId: discovery.recordId,
    lineage: { kind: 'none', generation: identity.genome.gen as number },
    xp: 0,
    hurt: index === 0 ? 0.8 : 0,
    fed: 0,
    brood: 0,
    assignment: index === 0
      ? { kind: 'recovery', readyAtActivePlayMs: 100_000 }
      : index === 1 ? { kind: 'mission', missionId: 'rename-ui-mission' } : null,
    bond: null,
  }));
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity,
      alias: 'Aurora Beast',
      firstObservationId: discoveries[0]!.recordId,
    })],
    discoveries,
    creatures,
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: ids[0]!,
  });
  return Object.freeze({
    state: migrateOwnershipStateV1ToV2(source),
    record: Object.freeze({ id: 'codex-rename', name: 'Aurora Beast', g: identity.genome }),
    ids: Object.freeze(ids),
  });
}

function model(
  value: ReturnType<typeof fixture>,
  overrides: Readonly<{
    protected?: boolean;
    fixture?: boolean;
    record?: CompendiumRenameRecordV1;
  }> = {},
): CompendiumRenameReadModelV1 {
  return projectCompendiumRenameV1({
    generation: 9,
    logicalId: 'codex-rename',
    record: overrides.record ?? value.record,
    ownership: value.state,
    protected: overrides.protected ?? false,
    fixture: overrides.fixture ?? false,
  });
}

let dom: TestDom | null = null;
let controller: CompendiumRenameController | null = null;

function shell(): Readonly<{ root: HTMLElement; mount: HTMLElement }> {
  dom = new JSDOM(`<!doctype html><html><body>
    <aside id="codexpanel" style="display:block">
      <div data-arc5-rename-body class="compendium-feed"></div>
    </aside>
  </body></html>`);
  return Object.freeze({
    root: dom.window.document.getElementById('codexpanel') as HTMLElement,
    mount: dom.window.document.querySelector('[data-arc5-rename-body]') as HTMLElement,
  });
}

function choose(mount: HTMLElement, creatureId: CreatureInstanceId): void {
  const input = [...mount.querySelectorAll<HTMLInputElement>(
    'input[data-arc5-rename-creature-id]',
  )].find((candidate) => candidate.dataset.arc5RenameCreatureId === creatureId);
  if (!input) throw new Error(`missing rename creature ${creatureId}`);
  input.checked = true;
  input.dispatchEvent(new dom!.window.Event('change', { bubbles: true }));
}

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
});

describe('Arc 5 Compendium companion rename projection and controller', () => {
  it('owns exactly three delegated listeners only while attached and reattaches once', () => {
    const value = fixture();
    const { root, mount } = shell();
    controller = new CompendiumRenameController({ root, isCurrent: () => true });
    controller.setState(model(value));
    expect(controller.diagnostics().delegatedListenerCount).toBe(0);

    controller.attach(mount);
    controller.attach(mount);
    expect(controller.diagnostics().delegatedListenerCount).toBe(3);
    controller.detach();
    controller.detach();
    expect(controller.diagnostics()).toMatchObject({
      attachedMountCount: 0,
      retainedDomCount: 0,
      delegatedListenerCount: 0,
    });

    controller.attach(mount);
    expect(controller.diagnostics()).toMatchObject({
      attachedMountCount: 1,
      delegatedListenerCount: 3,
      contextKey: model(value).contextKey,
    });
    controller.dispose();
    controller.detach();
    expect(controller.diagnostics().delegatedListenerCount).toBe(0);
  });

  it('keeps same-species twins distinct and permits identity-only rename while assigned or hurt', () => {
    const value = fixture();
    const projected = model(value);
    expect(projected.availability).toBe('ready');
    expect(new Set(projected.creatures.map((row) => row.creatureId))).toEqual(new Set(value.ids));
    expect(projected.creatures.find((row) => row.nickname === 'Alpha'))
      .toMatchObject({ status: 'ready' });
    expect(projected.creatures.find((row) => row.nickname === 'Beta'))
      .toMatchObject({ status: 'ready' });
    expect(new Set(projected.creatures.map((row) => row.label)).size).toBe(3);
  });

  it('fails closed for fixtures, non-fauna, and protected ownership', () => {
    const value = fixture();
    expect(model(value, { fixture: true }).availability).toBe('fixture');
    expect(model(value, { protected: true }).availability).toBe('protected');
    const flora = canonicalGenomeIdentityV1(makeGenome(909, 'flora', 0.5));
    expect(model(value, { record: Object.freeze({
      id: 'codex-rename', name: 'Flora', g: flora.genome,
    }) }).availability).toBe('non-fauna');
  });

  it('normalizes the shipped name policy, paints pending first, and publishes only settlement', () => {
    const value = fixture();
    const { root, mount } = shell();
    let request: CompendiumRenameActionRequestV1 | null = null;
    controller = new CompendiumRenameController({
      root,
      isCurrent: () => true,
      onAction: (next) => { request = next; },
    });
    controller.setState(model(value));
    controller.attach(mount);
    choose(mount, value.ids[0]!);
    const name = mount.querySelector<HTMLInputElement>('[data-arc5-rename-input]')!;
    expect(name.value).toBe('Alpha');
    name.value = '  <Nova>&\"\'  ';
    name.dispatchEvent(new dom!.window.Event('input', { bubbles: true }));
    expect(mount.querySelector('[data-arc5-rename-preview]')?.textContent).toBe('Saved name: Nova');
    const confirm = mount.querySelector<HTMLButtonElement>('[data-arc5-rename-confirm]')!;
    expect(confirm.disabled).toBe(false);
    confirm.click();
    expect(request).toMatchObject({
      creatureId: value.ids[0], nicknameBefore: 'Alpha', nicknameAfter: 'Nova',
    });
    expect(mount.querySelector('[data-arc5-rename-status]')?.textContent)
      .toContain('current name remains shown until the save commits');
    expect(controller.diagnostics()).toMatchObject({ pendingWork: 1, convergenceLatched: false });
    const exact = request as unknown as CompendiumRenameActionRequestV1;
    const outcome: CompendiumRenameActionOutcomeV1 = Object.freeze({
      schema: COMPENDIUM_RENAME_OUTCOME_SCHEMA,
      kind: 'committed',
      convergence: 'none',
      request: exact,
      title: 'Renamed.',
      detail: 'Nova is now this companion’s durable name.',
    });
    controller.settle(outcome);
    expect(mount.querySelector('[data-arc5-rename-status]')?.textContent)
      .toContain('Nova is now');
    expect(controller.diagnostics()).toMatchObject({ pendingWork: 0, selectedCreatureId: null });
  });

  it('bounds controls per page and remains safe across Close and read-only convergence', () => {
    const value = fixture(COMPENDIUM_RENAME_PAGE_SIZE_V1 + 3);
    const { root, mount } = shell();
    let request: CompendiumRenameActionRequestV1 | null = null;
    controller = new CompendiumRenameController({
      root,
      isCurrent: () => true,
      onAction: (next) => { request = next; },
    });
    controller.setState(model(value));
    controller.attach(mount);
    expect(controller.diagnostics().creatureControlCount).toBe(COMPENDIUM_RENAME_PAGE_SIZE_V1);
    choose(mount, value.ids[0]!);
    const name = mount.querySelector<HTMLInputElement>('[data-arc5-rename-input]')!;
    name.value = 'Closed Nova';
    name.dispatchEvent(new dom!.window.Event('input', { bubbles: true }));
    mount.querySelector<HTMLButtonElement>('[data-arc5-rename-confirm]')!.click();
    const exact = request as unknown as CompendiumRenameActionRequestV1;
    controller.detach();
    expect(mount.childElementCount).toBe(0);
    controller.settle(Object.freeze({
      schema: COMPENDIUM_RENAME_OUTCOME_SCHEMA,
      kind: 'committed-convergence',
      convergence: 'read-only-reload',
      request: exact,
      title: 'Rename saved — reload required.',
      detail: 'The durable name will converge after reload.',
    }));
    expect(controller.diagnostics()).toMatchObject({
      attachedMountCount: 0, pendingWork: 0, convergenceLatched: true,
      delegatedListenerCount: 0,
    });
  });
});
