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
  projectCompendiumCreatureProgressionV1,
  type CompendiumCreatureProgressionRecordV1,
} from '../apps/game/src/compendium-creature-progression.js';
import { CompendiumCreatureProgressionSurfaceV1 } from
  '../apps/game/src/compendium-creature-progression-surface.js';

interface TestWindow extends Window { readonly Event: typeof Event; close(): void; }
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

function fixture(count = 26): Readonly<{
  ownership: OwnershipStateV2;
  record: CompendiumCreatureProgressionRecordV1;
}> {
  const identity = canonicalGenomeIdentityV1(makeGenome(93_731, 'fauna', 0.61));
  const discoveries = Array.from({ length: count }, (_, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `progression-surface-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `progression-surface-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0,
  }));
  const creatures = discoveries.map((discovery, index) => createCreatureInstanceV1({
    creatureId: ownershipContentId('creature', `progression-surface-${index}`) as CreatureInstanceId,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: `Surface Twin ${index + 1}`,
    origin: 'legacy',
    acquisitionRecordId: discovery.recordId,
    lineage: { kind: 'none', generation: identity.genome.gen as number },
    xp: index,
    hurt: 0,
    fed: 0,
    brood: 0,
    assignment: index === 0 ? { kind: 'recovery', readyAtActivePlayMs: 5_000 } : null,
    bond: null,
  }));
  return Object.freeze({
    ownership: migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({
      catalogSpecies: [createCatalogSpeciesV1({
        identity,
        alias: 'Surface Fauna',
        firstObservationId: discoveries[0]!.recordId,
      })],
      discoveries,
      creatures,
      specimenLots: [],
      biosphereProgress: [],
      legacyBioX: [],
      scoutCreatureId: null,
    })),
    record: Object.freeze({ id: 'surface-fauna', name: 'Surface Fauna', g: identity.genome }),
  });
}

let dom: TestDom | null = null;
let surface: CompendiumCreatureProgressionSurfaceV1 | null = null;

afterEach(() => {
  surface?.detach();
  surface = null;
  dom?.window.close();
  dom = null;
});

describe('Compendium creature progression mounted surface', () => {
  it('pages bounded exact rows and refreshes active-play Recovery without losing focus', () => {
    const value = fixture();
    dom = new JSDOM(`<!doctype html><html><body>
      <aside id="detail"><section data-arc5-scout-body></section></aside>
    </body></html>`);
    const detail = dom.window.document.getElementById('detail') as HTMLElement;
    let activePlayMs = 2_000;
    let current = true;
    surface = new CompendiumCreatureProgressionSurfaceV1({
      isCurrent: () => current,
      project: (pageIndex) => projectCompendiumCreatureProgressionV1({
        logicalId: value.record.id,
        record: value.record,
        ownership: value.ownership,
        protected: false,
        fixture: false,
        observedActivePlayMs: activePlayMs,
        pageIndex,
      }),
    });

    surface.attach(detail);
    expect(surface.snapshot()).toMatchObject({ attached: true, pageIndex: 0, rowCount: 24 });
    expect(surface.snapshot().statusRows[0]).toContain('3 seconds of active play');
    expect(detail.firstElementChild?.getAttribute('data-arc5-progression-body')).not.toBeNull();
    const next = detail.querySelector<HTMLButtonElement>(
      '[data-creature-progression-page="next"]',
    )!;
    next.focus();

    activePlayMs = 6_000;
    surface.refresh();
    expect(surface.snapshot().statusRows[0]).toContain('Recovery is complete');
    expect((dom.window.document.activeElement as HTMLElement).dataset.creatureProgressionPage)
      .toBe('next');

    (dom.window.document.activeElement as HTMLButtonElement).click();
    expect(surface.snapshot()).toMatchObject({ pageIndex: 1, rowCount: 2 });
    expect((dom.window.document.activeElement as HTMLElement).dataset.creatureProgressionPage)
      .toBe('previous');

    (dom.window.document.activeElement as HTMLButtonElement).click();
    expect(surface.snapshot()).toMatchObject({ pageIndex: 0, rowCount: 24 });
    expect((dom.window.document.activeElement as HTMLElement).dataset.creatureProgressionPage)
      .toBe('next');

    const before = detail.innerHTML;
    current = false;
    activePlayMs = 9_000;
    surface.refresh();
    expect(detail.innerHTML).toBe(before);

    surface.detach();
    expect(surface.snapshot()).toEqual({ attached: false, pageIndex: 0, rowCount: 0, statusRows: [] });
    expect(detail.querySelector('[data-arc5-progression-body]')).toBeNull();
  });
});
