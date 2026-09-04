import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createSpecimenLotV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  type DiscoveryRecordId,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import { makeGenome } from '@cf/domain-genome';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  migrateLegacyEngineeringState,
} from '@cf/domain-opportunity';
import {
  importSaveV2,
  prepareArc2LootLegacyMigration,
  readArc2EngineeringLoadout,
  type ContentRegistry,
} from '@cf/persistence';
import {
  COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1,
  CompendiumExplorerMealController,
  projectCompendiumExplorerMealV1,
  type CompendiumExplorerMealOutcomeV1,
  type CompendiumExplorerMealRequestV1,
} from '../apps/game/src/compendium-explorer-meal.js';

interface TestWindow extends Window {
  readonly Element: typeof Element;
  readonly Event: typeof Event;
  close(): void;
}
interface TestDom { readonly window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string) => TestDom;
};
const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'),
  'utf8',
)) as ContentRegistry;
const NOW = 1_753_900_060_000;
let dom: TestDom | null = null;
let controller: CompendiumExplorerMealController | null = null;

function fixture() {
  const flora = canonicalGenomeIdentityV1(makeGenome(29, 'flora', 0.4));
  const otherFlora = canonicalGenomeIdentityV1(makeGenome(31, 'flora', 0.6));
  const discoveries = [flora, flora, otherFlora].map((identity, index) => (
    createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', `meal-panel-${index}`) as DiscoveryRecordId,
      speciesId: identity.speciesId,
      legacyCodexId: `meal-panel-${index}`,
      legacySourceIndex: index,
      from: 'Legacy',
      legacyLocation: null,
      firstForSpecies: index !== 1,
    })
  ));
  const lotIds = [0, 1, 2].map((index) => (
    ownershipContentId('specimen', `meal-panel-${index}`) as SpecimenLotId
  ));
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [flora, otherFlora].map((identity, index) => createCatalogSpeciesV1({
      identity,
      alias: index === 0 ? 'Verdant Bell' : null,
      firstObservationId: discoveries[index === 0 ? 0 : 2]!.recordId,
    })),
    discoveries,
    creatures: [],
    specimenLots: [
      createSpecimenLotV1({
        lotId: lotIds[0]!, speciesId: flora.speciesId, kind: 'flora', quantity: 3,
        origin: 'legacy', acquisitionRecordId: discoveries[0]!.recordId,
      }),
      createSpecimenLotV1({
        lotId: lotIds[1]!, speciesId: flora.speciesId, kind: 'flora', quantity: 1,
        origin: 'legacy', acquisitionRecordId: discoveries[1]!.recordId,
      }),
      createSpecimenLotV1({
        lotId: lotIds[2]!, speciesId: otherFlora.speciesId, kind: 'flora', quantity: 9,
        origin: 'legacy', acquisitionRecordId: discoveries[2]!.recordId,
      }),
    ],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const state = {
    ...imported.state,
    hp: 40,
    HP_MAX: 100,
    pstats: { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 },
    techOwned: ['lab1'],
  };
  const engineering = migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: 0,
    worlds: [],
    stars: [],
    research: ['lab1'],
  }, { resolveWorldSeed: () => [], resolveStarSeed: () => [] });
  const loot = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: [['surgeon', 1]], equip: { gloves: 'surgeon' }, equipAff: {} },
    capacity: 4,
  });
  if (loot.kind !== 'prepared') throw new Error(loot.kind);
  const loadout = readArc2EngineeringLoadout(loot.extensions);
  if (loadout.kind !== 'loaded') throw new Error(loadout.kind);
  return Object.freeze({
    ownership: migrateOwnershipStateV1ToV2(source),
    record: Object.freeze({ id: 'flora-detail', name: 'Verdant Bell', g: flora.genome }),
    faunaRecord: Object.freeze({
      id: 'fauna-detail',
      name: 'Not Flora',
      g: makeGenome(11, 'fauna', 0.4),
    }),
    lotIds,
    state,
    engineering,
    capabilities: loadout.capabilities,
  });
}

function project(f: ReturnType<typeof fixture>) {
  return projectCompendiumExplorerMealV1({
    generation: 7,
    logicalId: f.record.id,
    record: f.record,
    ownership: f.ownership,
    engineering: f.engineering,
    capabilities: f.capabilities,
    state: f.state,
    protected: false,
    fixture: false,
  });
}

function shell() {
  dom = new JSDOM(`<!doctype html><html><body>
    <aside id="codexpanel" aria-label="Compendium" style="display:block">
      <button id="codexback" type="button">Back</button>
      <button id="codexclose" type="button">Close</button>
      <div data-arc5-explorer-meal-body></div>
    </aside>
  </body></html>`);
  const document = dom.window.document;
  return {
    root: document.getElementById('codexpanel') as HTMLElement,
    mount: document.querySelector('[data-arc5-explorer-meal-body]') as HTMLElement,
    back: document.getElementById('codexback') as HTMLButtonElement,
  };
}

function outcome(
  request: CompendiumExplorerMealRequestV1,
): CompendiumExplorerMealOutcomeV1 {
  return Object.freeze({
    schema: COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1,
    kind: 'committed',
    convergence: 'none',
    request,
    title: 'Meal complete.',
    detail: 'The exact flora lot was consumed durably.',
  });
}

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
});

describe('Compendium explorer meal projection/controller', () => {
  it('projects one deterministic canonical matching lot with the action-owned facts', () => {
    const f = fixture();
    const model = project(f);
    expect(model).toMatchObject({
      availability: 'ready',
      floraName: 'Verdant Bell',
      ownershipRevision: 0,
    });
    const selectedId = [f.lotIds[0]!, f.lotIds[1]!].sort()[0]!;
    expect(model.lots.map(({ foodLotId }) => foodLotId)).toEqual([selectedId]);
    expect(model.lots[0]!.quantityBefore).toBe(selectedId === f.lotIds[0] ? 3 : 1);
    expect(model.lots.every((lot) => lot.healAmount > 0
      && lot.poisonChance >= 0.05 && lot.poisonChance <= 0.6
      && lot.nourishment >= 2)).toBe(true);
  });

  it('renders one native Eat 1 request, locks pending, and preserves Back', () => {
    const f = fixture();
    const view = shell();
    const actions: CompendiumExplorerMealRequestV1[] = [];
    controller = new CompendiumExplorerMealController({
      root: view.root,
      isCurrent: () => true,
      onAction: (request) => actions.push(request),
    });
    const model = project(f);
    controller.setState(model);
    controller.attach(view.mount);
    expect(view.mount.querySelectorAll('[data-arc5-explorer-meal-confirm]')).toHaveLength(1);
    expect(view.mount.querySelector('[data-arc5-explorer-meal-preview]')?.textContent)
      .toMatch(/Heal up to \d+ HP · \d+% poison risk · [A-Z]+ \+\d+/u);
    expect(view.mount.querySelectorAll('[data-arc5-explorer-meal-lots] li')).toHaveLength(1);
    const button = view.mount.querySelector<HTMLButtonElement>(
      '[data-arc5-explorer-meal-confirm]',
    )!;
    expect(button.textContent).toBe('Eat 1');
    button.click();
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      foodLotId: model.lots[0]!.foodLotId,
      foodQuantityBefore: model.lots[0]!.quantityBefore,
      foodQuantityAfter: model.lots[0]!.quantityAfter,
    });
    expect(button.isConnected).toBe(false);
    expect(view.mount.querySelector<HTMLButtonElement>(
      '[data-arc5-explorer-meal-confirm]',
    )!.disabled).toBe(true);
    expect(view.mount.querySelector('[role="status"]')?.textContent).toMatch(/Meal pending/u);
    expect(view.back.disabled).toBe(false);

    controller.settle(outcome(actions[0]!));
    expect(view.mount.querySelector('[role="status"]')?.textContent)
      .toContain('The exact flora lot was consumed durably.');
    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 0,
      delegatedListenerCount: 1,
      actionControlCount: 1,
    });
  });

  it('distinguishes a durable convergence latch from pending work', () => {
    const f = fixture();
    const view = shell();
    const actions: CompendiumExplorerMealRequestV1[] = [];
    controller = new CompendiumExplorerMealController({
      root: view.root,
      isCurrent: () => true,
      onAction: (request) => actions.push(request),
    });
    controller.setState(project(f));
    controller.attach(view.mount);
    view.mount.querySelector<HTMLButtonElement>(
      '[data-arc5-explorer-meal-confirm]',
    )!.click();
    const request = actions[0]!;
    controller.settle(Object.freeze({
      schema: COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1,
      kind: 'committed-convergence',
      convergence: 'read-only-reload',
      request,
      title: 'Reload required.',
      detail: 'The meal committed, but this page cannot publish it safely.',
    }));

    const button = view.mount.querySelector<HTMLButtonElement>(
      '[data-arc5-explorer-meal-confirm]',
    )!;
    expect(button.disabled).toBe(true);
    expect(button.title).toBe('Reload required before another meal.');
    expect(view.mount.getAttribute('aria-busy')).toBe('false');
    expect(view.mount.querySelector('[role="status"]')?.textContent).toMatch(/Reload required/u);
    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 0,
      convergenceLatched: true,
      actionControlCount: 1,
    });
    button.click();
    expect(actions).toHaveLength(1);
  });

  it('preserves semantic focus across passive refill without scrolling', () => {
    const f = fixture();
    const view = shell();
    controller = new CompendiumExplorerMealController({
      root: view.root,
      isCurrent: () => true,
      onAction: vi.fn(),
    });
    controller.setState(project(f));
    controller.attach(view.mount);
    const first = view.mount.querySelector<HTMLButtonElement>(
      '[data-arc5-explorer-meal-confirm]',
    )!;
    first.focus();
    controller.setState(project(f));
    const replacement = view.mount.querySelector<HTMLButtonElement>(
      '[data-arc5-explorer-meal-confirm]',
    )!;
    expect(replacement).not.toBe(first);
    expect(replacement.ownerDocument.activeElement).toBe(replacement);
  });

  it('keeps non-Flora and protected ownership action-free', () => {
    const f = fixture();
    const nonFlora = projectCompendiumExplorerMealV1({
      generation: 7,
      logicalId: f.faunaRecord.id,
      record: f.faunaRecord,
      ownership: f.ownership,
      engineering: f.engineering,
      capabilities: f.capabilities,
      state: f.state,
      protected: false,
      fixture: false,
    });
    expect(nonFlora.availability).toBe('non-flora');
    const blocked = projectCompendiumExplorerMealV1({
      generation: 7,
      logicalId: f.record.id,
      record: f.record,
      ownership: f.ownership,
      engineering: f.engineering,
      capabilities: f.capabilities,
      state: f.state,
      protected: true,
      fixture: false,
    });
    const view = shell();
    controller = new CompendiumExplorerMealController({
      root: view.root,
      isCurrent: () => true,
      onAction: vi.fn(),
    });
    controller.setState(blocked);
    controller.attach(view.mount);
    expect(view.mount.querySelector('[data-arc5-explorer-meal-confirm]')).toBeNull();
  });
});
