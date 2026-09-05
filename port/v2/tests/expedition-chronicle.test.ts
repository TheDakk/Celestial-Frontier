import { createRequire } from 'node:module';
import { afterEach, describe, expect, it } from 'vitest';
import { COMBAT_SETTLEMENT_RECEIPT_KIND_V1 } from '@cf/domain-combatcore';
import { makeGenome } from '@cf/domain-genome';
import {
  canonicalJson,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV1,
} from '@cf/domain-acquisition';
import {
  COMBAT_SETTLEMENT_AUTHORITY_NAMESPACE_V1,
  COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1,
  COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1,
  applyV5ExtensionWrites,
  readCombatSettlementAuthorityV1,
  type CombatSettlementAuthorityV1,
  type SaveStateV2,
} from '@cf/persistence';
import {
  EXPEDITION_CHRONICLE_SCHEMA_V1,
  EXPEDITION_CHRONICLE_SECTION_LIMIT_V1,
  projectExpeditionChronicleV1,
  renderExpeditionChronicleV1,
} from '../apps/game/src/expedition-chronicle.js';

interface TestWindow extends Window { close(): void }
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string) => TestDom;
};
const openDoms: TestDom[] = [];
afterEach(() => { for (const dom of openDoms.splice(0)) dom.window.close(); });

function fixture(): {
  save: SaveStateV2;
  ownership: OwnershipStateV1;
  combat: CombatSettlementAuthorityV1;
} {
  const identity = canonicalGenomeIdentityV1(makeGenome(73, 'fauna', 0.6));
  const recordId = ownershipContentId('discovery', 'chronicle-radiant') as DiscoveryRecordId;
  const creatureId = ownershipContentId('creature', 'chronicle-radiant') as CreatureInstanceId;
  const discovery = createLegacyDiscoveryRecordV1({
    recordId,
    speciesId: identity.speciesId,
    legacyCodexId: 'chronicle-radiant',
    legacySourceIndex: 0,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  });
  const ownership = createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity,
      alias: '<Radiant>',
      firstObservationId: discovery.recordId,
    })],
    discoveries: [discovery],
    creatures: [createCreatureInstanceV1({
      creatureId,
      speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity,
      genome: identity.genome,
      nickname: null,
      origin: 'legacy',
      acquisitionRecordId: discovery.recordId,
      lineage: { kind: 'none', generation: identity.genome.gen as number },
      xp: null,
      hurt: null,
      fed: null,
      brood: null,
      assignment: null,
      bond: null,
    })],
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  const combatSource = {
    schema: COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1,
    version: COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1,
    battles: [
      {
        battleIdDigest: '1'.repeat(64), encounterDigest: '2'.repeat(64),
        outcome: 'champion-win', planWitnessDigest: '3'.repeat(64),
        receiptKind: COMBAT_SETTLEMENT_RECEIPT_KIND_V1, receiptOrdinal: 7,
        sourceRevision: 7, transcriptDigest: '4'.repeat(64),
        transcriptFingerprint: 'chronicle-battle-7', worldKey: 'world-1',
      },
      {
        battleIdDigest: '5'.repeat(64), encounterDigest: '6'.repeat(64),
        outcome: 'defender-win', planWitnessDigest: '7'.repeat(64),
        receiptKind: COMBAT_SETTLEMENT_RECEIPT_KIND_V1, receiptOrdinal: 8,
        sourceRevision: 8, transcriptDigest: '8'.repeat(64),
        transcriptFingerprint: 'chronicle-battle-8', worldKey: 'world-2',
      },
    ],
    conquests: [{ legacyEpoch: 0, planetSeed: 17, tier: 4, worldKey: 'world-1' }],
    lossXp: [],
  } as unknown as CombatSettlementAuthorityV1;
  const extensions = applyV5ExtensionWrites({}, [{
    segment: 'player',
    namespace: COMBAT_SETTLEMENT_AUTHORITY_NAMESPACE_V1,
    carrier: { version: 1, json: canonicalJson(combatSource) },
  }]).extensions;
  const combat = readCombatSettlementAuthorityV1(extensions);
  if (combat.kind !== 'loaded') throw new Error(`combat fixture ${combat.reason}`);
  return {
    save: {
      journal: [{ s: 1, n: '<Old signal>', w: '& beyond', t: 12 }],
      primeFill: { fire: { title: '<Fire>', sub: 'Ash & ember', tier: 4, hex: '#f00', where: {} } },
    } as unknown as SaveStateV2,
    ownership,
    combat: combat.authority,
  };
}

describe('Expedition Chronicle and Museum', () => {
  it('projects four bounded galleries from durable authorities without inventing one global clock', () => {
    const outcome = projectExpeditionChronicleV1(fixture());
    expect(outcome.kind).toBe('projected');
    if (outcome.kind !== 'projected') return;
    expect(outcome.model.schema).toBe(EXPEDITION_CHRONICLE_SCHEMA_V1);
    expect(outcome.model.sections.map(({ id }) => id)).toEqual([
      'battles', 'discoveries', 'prime-codex', 'legacy-journal',
    ]);
    expect(outcome.model.entryCount).toBe(5);
    expect(outcome.model.sections[0]!.entries.map(({ title }) => title))
      .toEqual(['Expedition defeated', 'World conquered']);
    expect(outcome.model.sections[1]!.entries[0]!.title).toBe('<Radiant>');
  });

  it('renders escaped accessible history and explicitly says it is read-only', () => {
    const outcome = projectExpeditionChronicleV1(fixture());
    if (outcome.kind !== 'projected') throw new Error('fixture protected');
    const html = renderExpeditionChronicleV1(outcome.model);
    const dom = new JSDOM(`<main>${html}</main>`);
    openDoms.push(dom);
    const document = dom.window.document;
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('[data-expedition-chronicle]')?.getAttribute('data-expedition-chronicle'))
      .toBe(EXPEDITION_CHRONICLE_SCHEMA_V1);
    expect(document.querySelectorAll('[data-chronicle-section]')).toHaveLength(4);
    expect(document.querySelectorAll('[data-chronicle-entry]')).toHaveLength(5);
    expect(document.body.textContent).toContain('<Radiant>');
    expect(document.body.textContent).toContain('Ash & ember');
    expect(document.body.textContent).toContain('read-only history');
    expect(document.body.textContent).toContain('creates no rewards or duplicate save record');
  });

  it('caps each gallery and reports omitted durable facts without truncating its source', () => {
    const input = fixture();
    const journal = Array.from({ length: EXPEDITION_CHRONICLE_SECTION_LIMIT_V1 + 5 }, (_, index) => ({
      s: index, n: `Entry ${index}`, w: 'Somewhere', t: index,
    }));
    const outcome = projectExpeditionChronicleV1({
      ...input, save: { ...input.save, journal } as SaveStateV2,
    });
    if (outcome.kind !== 'projected') throw new Error('fixture protected');
    const gallery = outcome.model.sections[3]!;
    expect(gallery.entries).toHaveLength(EXPEDITION_CHRONICLE_SECTION_LIMIT_V1);
    expect(gallery.omitted).toBe(5);
    expect(journal).toHaveLength(EXPEDITION_CHRONICLE_SECTION_LIMIT_V1 + 5);
  });

  it('preserves identity order for records without time authority and never calls omissions older', () => {
    const input = fixture();
    const primeFill = Object.fromEntries(Array.from(
      { length: EXPEDITION_CHRONICLE_SECTION_LIMIT_V1 + 5 },
      (_, index) => [`signature-${String(index).padStart(3, '0')}`, {
        title: `Signature ${index}`, sub: `Element ${index}`, tier: index % 15,
        hex: '#fff', where: null,
      }],
    ));
    const outcome = projectExpeditionChronicleV1({
      ...input, save: { ...input.save, primeFill } as SaveStateV2,
    });
    if (outcome.kind !== 'projected') throw new Error('fixture protected');
    const gallery = outcome.model.sections[2]!;
    expect(gallery.entries).toHaveLength(EXPEDITION_CHRONICLE_SECTION_LIMIT_V1);
    expect(gallery.entries[0]?.id).toBe('prime:signature-000');
    expect(gallery.entries.at(-1)?.id).toBe('prime:signature-059');
    expect(gallery.omitted).toBe(5);
    const html = renderExpeditionChronicleV1(outcome.model);
    expect(html).toContain('5 additional records remain safely stored.');
    expect(html).not.toContain('older records remain safely stored.');
  });

  it('protects structurally forged ownership even when its rows resemble catalogue evidence', () => {
    const input = fixture();
    const discovery = input.ownership.discoveries[0]!;
    const ownership = {
      ...input.ownership,
      discoveries: [{ ...discovery, speciesId: 'species-forged' }],
    } as unknown as OwnershipStateV1;
    expect(projectExpeditionChronicleV1({ ...input, ownership })).toEqual({
      kind: 'protected', reason: 'invalid-authority',
    });
  });
});
