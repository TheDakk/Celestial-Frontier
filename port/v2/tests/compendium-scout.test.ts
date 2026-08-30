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
  COMPENDIUM_SCOUT_OUTCOME_SCHEMA,
  COMPENDIUM_SCOUT_PAGE_SIZE_V1,
  CompendiumScoutController,
  projectCompendiumScoutV1,
  type CompendiumScoutActionOutcomeV1,
  type CompendiumScoutActionRequestV1,
  type CompendiumScoutReadModelV1,
  type CompendiumScoutRecordV1,
} from '../apps/game/src/compendium-scout.js';

interface TestWindow extends Window { readonly Event: typeof Event; close(): void; }
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

function fixture(count = 3): Readonly<{
  state: OwnershipStateV2;
  record: CompendiumScoutRecordV1;
  ids: readonly CreatureInstanceId[];
}> {
  const identity = canonicalGenomeIdentityV1(makeGenome(1_211, 'fauna', 0.52));
  const discoveries = Array.from({ length: count }, (_, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `scout-ui-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `scout-ui-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0,
  }));
  const ids = discoveries.map((_, index) => (
    ownershipContentId('creature', `scout-ui-${index}`) as CreatureInstanceId
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
      : index === 1 ? { kind: 'mission', missionId: 'scout-ui-mission' } : null,
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
    record: Object.freeze({ id: 'codex-scout', name: 'Aurora Beast', g: identity.genome }),
    ids: Object.freeze(ids),
  });
}

function model(
  value: ReturnType<typeof fixture>,
  overrides: Readonly<{
    protected?: boolean;
    fixture?: boolean;
    record?: CompendiumScoutRecordV1;
  }> = {},
): CompendiumScoutReadModelV1 {
  return projectCompendiumScoutV1({
    generation: 9,
    logicalId: 'codex-scout',
    record: overrides.record ?? value.record,
    ownership: value.state,
    protected: overrides.protected ?? false,
    fixture: overrides.fixture ?? false,
  });
}

let dom: TestDom | null = null;
let controller: CompendiumScoutController | null = null;

function shell(): Readonly<{ root: HTMLElement; mount: HTMLElement }> {
  dom = new JSDOM(`<!doctype html><html><body>
    <aside id="codexpanel" style="display:block">
      <div data-arc5-scout-body class="compendium-feed"></div>
    </aside>
  </body></html>`);
  return Object.freeze({
    root: dom.window.document.getElementById('codexpanel') as HTMLElement,
    mount: dom.window.document.querySelector('[data-arc5-scout-body]') as HTMLElement,
  });
}

function choose(mount: HTMLElement, creatureId: CreatureInstanceId): void {
  const input = [...mount.querySelectorAll<HTMLInputElement>(
    'input[data-arc5-scout-creature-id]',
  )].find((candidate) => candidate.dataset.arc5ScoutCreatureId === creatureId);
  if (!input) throw new Error(`missing Field Scout companion ${creatureId}`);
  input.checked = true;
  input.dispatchEvent(new dom!.window.Event('change', { bubbles: true }));
}

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
});

describe('Arc 5 Compendium Field Scout projection and controller', () => {
  it('owns exactly two delegated listeners only while attached and reattaches once', () => {
    const value = fixture();
    const { root, mount } = shell();
    controller = new CompendiumScoutController({ root, isCurrent: () => true });
    controller.setState(model(value));
    expect(controller.diagnostics().delegatedListenerCount).toBe(0);

    controller.attach(mount);
    controller.attach(mount);
    expect(controller.diagnostics().delegatedListenerCount).toBe(2);
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
      delegatedListenerCount: 2,
      contextKey: model(value).contextKey,
    });
    controller.dispose();
    controller.detach();
    expect(controller.diagnostics().delegatedListenerCount).toBe(0);
  });

  it('keeps same-species twins distinct and preserves legacy role-only eligibility', () => {
    const value = fixture();
    const projected = model(value);
    expect(projected.availability).toBe('ready');
    expect(new Set(projected.creatures.map((row) => row.creatureId))).toEqual(new Set(value.ids));
    expect(projected.creatures.find((row) => row.creatureId === value.ids[0]))
      .toMatchObject({ status: 'ready', current: true });
    expect(projected.creatures.find((row) => row.creatureId === value.ids[1]))
      .toMatchObject({ status: 'ready', current: false });
    expect(new Set(projected.creatures.map((row) => row.label)).size).toBe(3);
  });

  it('fails closed for fixtures, non-fauna, and protected ownership', () => {
    const value = fixture();
    expect(model(value, { fixture: true }).availability).toBe('fixture');
    expect(model(value, { protected: true }).availability).toBe('protected');
    const flora = canonicalGenomeIdentityV1(makeGenome(1_212, 'flora', 0.5));
    expect(model(value, { record: Object.freeze({
      id: 'codex-scout', name: 'Flora', g: flora.genome,
    }) }).availability).toBe('non-fauna');
  });

  it('paints pending first and emits one exact switch request without optimism', () => {
    const value = fixture();
    const { root, mount } = shell();
    let request: CompendiumScoutActionRequestV1 | null = null;
    controller = new CompendiumScoutController({
      root,
      isCurrent: () => true,
      onAction: (next) => { request = next; },
    });
    controller.setState(model(value));
    controller.attach(mount);
    choose(mount, value.ids[1]!);
    const confirm = mount.querySelector<HTMLButtonElement>('[data-arc5-scout-confirm]')!;
    expect(confirm.textContent).toBe('Name Field Scout');
    expect(confirm.disabled).toBe(false);
    confirm.click();
    expect(request).toMatchObject({
      scoutBefore: value.ids[0],
      scoutAfter: value.ids[1],
    });
    expect(mount.querySelector('[data-arc5-scout-status]')?.textContent)
      .toContain('saved Scout remains unchanged until commit');
    expect(mount.textContent).toContain('Alpha');
    expect(mount.textContent).toContain('Field Scout ✓');
    expect(controller.diagnostics()).toMatchObject({ pendingWork: 1, convergenceLatched: false });
    const exact = request as unknown as CompendiumScoutActionRequestV1;
    const outcome: CompendiumScoutActionOutcomeV1 = Object.freeze({
      schema: COMPENDIUM_SCOUT_OUTCOME_SCHEMA,
      kind: 'committed',
      convergence: 'none',
      request: exact,
      title: 'Field Scout named.',
      detail: 'Beta now holds the durable expedition role.',
    });
    controller.settle(outcome);
    expect(mount.querySelector('[data-arc5-scout-status]')?.textContent)
      .toContain('Beta now holds');
    expect(controller.diagnostics()).toMatchObject({ pendingWork: 0, selectedCreatureId: null });
  });

  it('selecting the current exact companion produces stand-down, not a second set', () => {
    const value = fixture();
    const { root, mount } = shell();
    let request: CompendiumScoutActionRequestV1 | null = null;
    controller = new CompendiumScoutController({
      root,
      isCurrent: () => true,
      onAction: (next) => { request = next; },
    });
    controller.setState(model(value));
    controller.attach(mount);
    choose(mount, value.ids[0]!);
    const confirm = mount.querySelector<HTMLButtonElement>('[data-arc5-scout-confirm]')!;
    expect(confirm.textContent).toBe('Stand down');
    confirm.click();
    expect(request).toMatchObject({ scoutBefore: value.ids[0], scoutAfter: null });
  });

  it('preserves exact-row focus and disables controls without an action owner', () => {
    const value = fixture();
    const { root, mount } = shell();
    controller = new CompendiumScoutController({ root, isCurrent: () => true });
    controller.setState(model(value));
    controller.attach(mount);
    const beta = [...mount.querySelectorAll<HTMLInputElement>(
      'input[data-arc5-scout-creature-id]',
    )].find((candidate) => candidate.dataset.arc5ScoutCreatureId === value.ids[1]);
    if (!beta) throw new Error('missing focus-control Scout twin');
    beta.focus();
    beta.checked = true;
    beta.dispatchEvent(new dom!.window.Event('change', { bubbles: true }));
    const replacedBeta = [...mount.querySelectorAll<HTMLInputElement>(
      'input[data-arc5-scout-creature-id]',
    )].find((candidate) => candidate.dataset.arc5ScoutCreatureId === value.ids[1]);
    expect(dom!.window.document.activeElement).toBe(replacedBeta);
    const confirm = mount.querySelector<HTMLButtonElement>('[data-arc5-scout-confirm]')!;
    expect(confirm.disabled).toBe(true);
    expect(confirm.getAttribute('aria-disabled')).toBe('true');
    expect(confirm.title).toContain('Choose one eligible exact companion');
    expect(controller.diagnostics().pendingWork).toBe(0);
  });

  it('bounds controls per page and releases DOM through Close and convergence', () => {
    const value = fixture(COMPENDIUM_SCOUT_PAGE_SIZE_V1 + 3);
    const { root, mount } = shell();
    let request: CompendiumScoutActionRequestV1 | null = null;
    controller = new CompendiumScoutController({
      root,
      isCurrent: () => true,
      onAction: (next) => { request = next; },
    });
    controller.setState(model(value));
    controller.attach(mount);
    expect(controller.diagnostics().creatureControlCount).toBe(COMPENDIUM_SCOUT_PAGE_SIZE_V1);
    choose(mount, value.ids[1]!);
    mount.querySelector<HTMLButtonElement>('[data-arc5-scout-confirm]')!.click();
    const exact = request as unknown as CompendiumScoutActionRequestV1;
    controller.detach();
    expect(mount.childElementCount).toBe(0);
    controller.settle(Object.freeze({
      schema: COMPENDIUM_SCOUT_OUTCOME_SCHEMA,
      kind: 'committed-convergence',
      convergence: 'read-only-reload',
      request: exact,
      title: 'Field Scout saved — reload required.',
      detail: 'The durable role will converge after reload.',
    }));
    expect(controller.diagnostics()).toMatchObject({
      attachedMountCount: 0, pendingWork: 0, convergenceLatched: true,
      delegatedListenerCount: 0,
    });
  });
});
