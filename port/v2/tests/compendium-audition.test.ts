import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createSpecimenLotV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import { makeGenome } from '@cf/domain-genome';
import {
  CompendiumAuditionController,
  projectCompendiumAuditionV1,
  type CompendiumAuditionReadModelV1,
} from '../apps/game/src/compendium-audition.js';

vi.mock('@cf/domain-sessionrng', () => {
  throw new Error('Compendium audition imported gameplay SessionRNG');
});

interface TestWindow extends Window {
  readonly Event: typeof Event;
  close(): void;
}
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string) => TestDom;
};

let dom: TestDom | null = null;
let controller: CompendiumAuditionController | null = null;

function fixture(kingdom: 'fauna' | 'flora' = 'fauna') {
  const identity = canonicalGenomeIdentityV1(makeGenome(68, kingdom, 1));
  const discoveries = Array.from({ length: kingdom === 'fauna' ? 2 : 1 }, (_, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId(
      'discovery', `audition-${kingdom}-${index}`,
    ) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `codex-${kingdom}-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0,
  }));
  const creatureIds = Object.freeze([
    ownershipContentId('creature', 'audition-left') as CreatureInstanceId,
    ownershipContentId('creature', 'audition-right') as CreatureInstanceId,
  ] as const);
  const creatures = kingdom === 'fauna' ? creatureIds.map((creatureId, index) => (
    createCreatureInstanceV1({
      creatureId,
      speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity,
      genome: identity.genome,
      nickname: index === 0 ? 'Aster' : null,
      origin: 'legacy',
      acquisitionRecordId: discoveries[index]!.recordId,
      lineage: { kind: 'none', generation: 0 },
      xp: index * 99,
      hurt: null,
      fed: 11 + index,
      brood: null,
      assignment: index === 0 ? null : { kind: 'mission' as const, missionId: 'away-1' },
      bond: null,
    })
  )) : [];
  const ownership = migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity,
      alias: null,
      firstObservationId: discoveries[0]!.recordId,
    })],
    discoveries,
    creatures,
    specimenLots: kingdom === 'flora' ? [createSpecimenLotV1({
      lotId: ownershipContentId('specimen', 'audition-flora') as SpecimenLotId,
      speciesId: identity.speciesId,
      kind: 'flora',
      quantity: 1,
      origin: 'legacy',
      acquisitionRecordId: discoveries[0]!.recordId,
    })] : [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: creatures[0]?.creatureId ?? null,
  }));
  return Object.freeze({
    identity,
    ownership,
    creatureIds,
    record: Object.freeze({
      id: `codex-${kingdom}`,
      name: kingdom === 'fauna' ? 'Sky Grazer' : 'Glow Frond',
      g: identity.genome,
    }),
  });
}

function model(
  f: ReturnType<typeof fixture>,
  patch: Partial<Parameters<typeof projectCompendiumAuditionV1>[0]> = {},
): CompendiumAuditionReadModelV1 {
  return projectCompendiumAuditionV1({
    generation: 7,
    logicalId: f.record.id,
    record: f.record,
    ownership: f.ownership,
    fixture: false,
    ...patch,
  });
}

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
});

describe('Arc 7 Compendium detail audition', () => {
  it('projects every exact live matching fauna identity without changing creature state', () => {
    const f = fixture();
    const before = JSON.stringify(f.ownership);
    const projected = model(f);
    expect(projected).toMatchObject({
      availability: 'ready',
      ownershipRevision: f.ownership.revision,
      surface: { generation: 7, logicalId: 'codex-fauna' },
    });
    expect([...projected.creatures.map((row) => row.creatureId)].sort())
      .toEqual([...f.creatureIds].sort());
    expect(projected.creatures.find((row) => row.creatureId === f.creatureIds[0])!.label)
      .toContain('Aster');
    expect(JSON.stringify(f.ownership)).toBe(before);
  });

  it('fails closed for fixtures, non-fauna, missing ownership, and catalogue mismatch', () => {
    const fauna = fixture();
    const flora = fixture('flora');
    expect(model(fauna, { fixture: true }).availability).toBe('fixture');
    expect(model(flora).availability).toBe('non-fauna');
    expect(model(fauna, { ownership: null }).availability).toBe('protected');
    expect(model(fauna, {
      record: Object.freeze({
        ...fauna.record,
        g: canonicalGenomeIdentityV1(makeGenome(91, 'fauna', 1)).genome,
      }),
    }).availability).toBe('protected');
  });

  it('renders only explicit buttons and never auditions on attach, state, or refresh', () => {
    const f = fixture();
    dom = new JSDOM('<!doctype html><body><aside id="codexpanel"><div id="mount"></div></aside></body>');
    const document = dom.window.document;
    const root = document.getElementById('codexpanel') as HTMLElement;
    const mount = document.getElementById('mount') as HTMLElement;
    const onNative = vi.fn();
    const onAudition = vi.fn();
    controller = new CompendiumAuditionController({
      root,
      isCurrent: () => true,
      onNativeAuditionGesture: onNative,
      onAudition,
    });
    controller.setState(model(f));
    controller.attach(mount);
    controller.refresh();
    expect(onAudition).not.toHaveBeenCalled();
    expect(onNative).not.toHaveBeenCalled();
    expect(mount.querySelectorAll('button[data-arc7-audition-creature-id]')).toHaveLength(2);

    const button = mount.querySelector<HTMLButtonElement>(
      `button[data-arc7-audition-creature-id="${f.creatureIds[0]}"]`,
    )!;
    button.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    expect(onNative).not.toHaveBeenCalled();
    expect(onAudition).toHaveBeenCalledTimes(1);
    const [request, counterpart] = onAudition.mock.calls[0]!;
    expect(request).toMatchObject({
      creatureId: f.creatureIds[0],
      eventKey: `arc7:compendium-audition:${f.creatureIds[0]}`,
    });
    expect(controller.counterpartIsCurrent(counterpart)).toBe(true);
    expect(mount.querySelector('[data-arc7-audition-status]')?.getAttribute('aria-live'))
      .toBe('polite');
  });

  it('owns exactly one delegated listener only while attached and reattaches it once', () => {
    const f = fixture();
    dom = new JSDOM('<!doctype html><body><aside id="codexpanel"><div id="mount"></div></aside></body>');
    const document = dom.window.document;
    const root = document.getElementById('codexpanel') as HTMLElement;
    const mount = document.getElementById('mount') as HTMLElement;
    const add = vi.spyOn(root, 'addEventListener');
    const remove = vi.spyOn(root, 'removeEventListener');
    controller = new CompendiumAuditionController({
      root,
      isCurrent: () => true,
      onAudition: vi.fn(),
    });

    controller.setState(model(f));
    expect(add).not.toHaveBeenCalled();
    controller.attach(mount);
    controller.attach(mount);
    expect(add.mock.calls.map(([type]) => type)).toEqual(['click']);

    controller.detach();
    controller.detach();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(['click']);
    controller.attach(mount);
    expect(add.mock.calls.map(([type]) => type)).toEqual(['click', 'click']);

    controller.dispose();
    controller.detach();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(['click', 'click']);
  });

  it('keeps native gesture activation guarded and ordered before playback dispatch', () => {
    const source = readFileSync(fileURLToPath(
      new URL('../apps/game/src/compendium-audition.ts', import.meta.url),
    ), 'utf8');
    const click = source.slice(source.indexOf('readonly #onClick'), source.indexOf('  #render():'));
    const trusted = click.indexOf('if (event.isTrusted) this.#onNativeAuditionGesture?.();');
    const dispatch = click.indexOf('this.#onAudition?.(request, counterpart);');
    expect(trusted).toBeGreaterThan(0);
    expect(dispatch).toBeGreaterThan(trusted);
    expect(click).not.toContain('setState(');
    expect(click).not.toContain('attach(');
  });
});
