/* One press of Discover Life, committed: the hazard's strike and who took it, the world's roster opened, and what
   opening it leads to, in one receipt, or nothing at all.

   LEGACY celestial-frontier.html, v1.8.9:
   - the row stands on a world with life that is grounded (Earth, landed on or conquered) and not yet revealed: its
     seed is not in the surveyed set and some species of it is not in the Compendium (13719, 13932-13937); the
     lessons of training do not gate it (14236-14243 gate only the card's `data-act` buttons);
   - the press rolls with the danger of the card on screen (`dangerOf(_lastDesc)` 14293), counts a strike in
     `stats.scanhits` whoever takes it (14295), and routes it to the scout or the explorer; an explorer who dies
     ends the press there (14294-14298; the rules, and what a strike unlocks, are `bioscan-hazard.ts`);
   - then the scan: the world joins the surveyed set, `stats.surveys` becomes the set's size, a civilized world
     unlocks its achievements and a Paragon's home gives up its Paragon (`autoScanWorld` 14888-14922; the rules
     are `bioscan-reveal.ts`); the `bioscan` deed is said to the Charters and the Ascent (`gameEvent`
     25358-25363), which hear nothing in training (24908, 25285). The Ascent's goal `c2-scan` has no place filter
     (25232), so Earth's scan counts;
   - a stored page raises the best find and the achievements are looked at (`onSpeciesStored` 16474-16480).

   The press is held to the card it was made on, as a capture is: the row's fence names the world, the epoch its
   roster was read at and the danger shown. A press whose fence is not the stored state's is refused and writes
   nothing, so the roll is never made at a danger the player was not shown. (The legacy game kept the card on
   screen and rolled with it, epoch turned or not; here the player is shown the new row and presses again.)

   A strike that would cost the scout its life costs it (13154-13159): the scout's post is emptied, the beast leaves
   the Compendium, and the scan goes on. Nothing is unlocked by it; the strike is counted like any other.
   One corner differs, and only a save brought from the legacy game can reach it: a scout that is the Paragon of the
   very world scanned, lost to the strike, is not catalogued again by the same press (the legacy game looked for it
   after the removal and stored it anew, 14909).
   A Paragon is a whole beast, as the legacy game stored it (14910): a page of the Compendium and its creature.
   What follows an explorer's death (`showDeath` 19371, then a new expedition, 20736) is not here: the facts say `dead` and a
   health of 0; the stored state holds 1, as the legacy game's own reader made of a dead save (16783).

   The painted port (`bioscan-action.ts`) kept the explorer alive at 1, capped the scout at 0.85, found a Paragon
   only at its full address and joined the survey's own receipt to this one; none of that is the legacy game's. */
import { paragonGenomeV1, paragonSeedV1 } from '@cf/domain-acquisition/paragon-internal';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createParagonDiscoveryRecordV1,
  ownershipContentId,
  ownershipStateDigestV1,
  withoutSpeciesV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateContentsV1,
} from '@cf/domain-acquisition';
import { battleStats } from '@cf/domain-combatcore';
import { planetDescriptorAtEcologyEpoch } from '@cf/domain-descriptors';
import { classifyRealm, describeSpecies, sapienceTier, type Genome } from '@cf/domain-genome';
import { isCanonicalEarthWorldAddress } from '@cf/domain-opportunity';
import { DOMAINS } from '@cf/domain-sessionrng';
import { ringGrade } from '@cf/domain-strays';
import { systemFor } from '@cf/domain-worldgen';
import {
  readArc2EngineeringLoadout,
  readWorldIdentity,
  worldIdentityRecord,
  type CodexEntry,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';
import { ascStageOf, bankBioscan, reconcileV2Chapters, type CanonicalCF1WorldAddress } from '@cf/scene';
import { bioscanDanger, creatureCondition, depthTax, resolveBioscanPress, type BioscanDanger, type CreatureConditionLabel } from './bioscan-hazard';
import { revealBiosphere } from './bioscan-reveal';
import { scoutStands } from './bond';
import {
  commitCare, refreshProgression, refuse, settleCare, unlockAchievement, type CareAuthority, type CareCharterStager, type CareOutcome, type CareReceipt, type CareSettleDeps, type CareStaged,
} from './commit';
import { compendiumId, compendiumRow, contentsOf, ownershipOf, stageOwnership } from './ownership';
import { paragonIndexAt } from './paragon-finder';

export const BIOSCAN_ACTION = 'bioscan' as const;
export const BIOSCAN_RECEIPT_KIND_V1 = 'care-bioscan-v1' as const;
/** The hazard's value, then the value that picks the mishap's words. */
export const BIOSCAN_DOMAINS_V1 = Object.freeze([DOMAINS.surveyHazard, DOMAINS.hazardFlavor] as const);
const REINFORCED_HULL = 'hull1';

/** Why Discover Life does not stand on a world, in the legacy card's order. */
export type BioscanGateV1 = 'no-life' | 'not-landed' | 'already-revealed';

interface WorldCard {
  readonly planetType: string;
  readonly badge: string | null;
  /** The world's species, in the card's order. */
  readonly species: ReadonlyArray<Readonly<Record<string, unknown>>>;
}
/** The world's survey card as the legacy game describes it at this epoch. */
function cardOf(address: CanonicalCF1WorldAddress, epoch: number): WorldCard {
  const system = systemFor(address.star.seed) as unknown as { planets?: ReadonlyArray<{ P: Record<string, unknown> }> };
  const entry = system.planets?.[address.planet.ordinal];
  if (entry === undefined || entry.P.seed !== address.planet.seed) return refuse('world:source-mismatch');
  const card = planetDescriptorAtEcologyEpoch(entry.P, system as never, entry as never, epoch);
  return {
    planetType: typeof card.ptype === 'string' ? card.ptype : '',
    badge: typeof card.badge === 'string' ? card.badge : null,
    species: (card.species ?? []) as ReadonlyArray<Readonly<Record<string, unknown>>>,
  };
}
const grounded = (state: SaveStateV2, extensions: V5Extensions, address: CanonicalCF1WorldAddress): boolean => {
  const seed = address.planet.seed;
  if (isCanonicalEarthWorldAddress(address) || state.conquered.some(([world]) => Number(world) === seed)) return true;
  const identity = readWorldIdentity(extensions);
  return identity.kind === 'loaded' && (worldIdentityRecord(identity.state, address)?.landed === true
    || identity.state.unresolved.some((row) => row.seed === seed && row.landed));
};
const gateOf = (state: SaveStateV2, extensions: V5Extensions, address: CanonicalCF1WorldAddress, card: WorldCard): BioscanGateV1 | null => {
  if (card.species.length === 0) return 'no-life';
  if (!grounded(state, extensions, address)) return 'not-landed';
  const held = new Set(state.codex.map(([id]) => id));
  return state.surveyedSet.some((world) => Number(world) === address.planet.seed) || card.species.every((g) => held.has(compendiumId(g.seed)))
    ? 'already-revealed' : null;
};
/** The gate Discover Life meets first on this world, or null when it stands. */
export function bioscanGateV1(state: SaveStateV2, extensions: V5Extensions, address: CanonicalCF1WorldAddress): BioscanGateV1 | null {
  return gateOf(state, extensions, address, cardOf(address, state.EPOCH_BASE));
}
/** The danger the card shows for this world now. */
export function bioscanDangerV1(state: SaveStateV2, address: CanonicalCF1WorldAddress): BioscanDanger {
  return dangerOf(state, address, cardOf(address, state.EPOCH_BASE));
}
const fenceOf = (address: CanonicalCF1WorldAddress, epoch: number, danger: BioscanDanger): string => `${address.key}|${epoch}|${danger.pct}|${danger.dmg}`;
/** What the Discover Life row showed, to hold a press to: the world, the epoch its roster was read at and its danger. */
export function bioscanFenceV1(state: SaveStateV2, address: CanonicalCF1WorldAddress): string {
  return fenceOf(address, state.EPOCH_BASE, bioscanDangerV1(state, address));
}
function dangerOf(state: SaveStateV2, address: CanonicalCF1WorldAddress, card: WorldCard): BioscanDanger {
  return bioscanDanger({
    powers: card.species.filter((g) => g.kingdom === 'fauna').map((g) => battleStats(g).total),
    planetType: card.planetType,
    settled: state.conquered.some(([world]) => Number(world) === address.planet.seed),
    depthTax: depthTax(address.galaxy),
  });
}

export interface BioscanFactsV1 {
  readonly worldKey: string;
  readonly planetSeed: number;
  readonly danger: Readonly<{ pct: number; dmg: number }>;
  /** Whether a hazard value was read: only a world with danger rolls. */
  readonly rolled: boolean;
  readonly hostile: boolean;
  /** The wound after the hull and the suit. */
  readonly damage: number;
  readonly flavour: string | null;
  readonly target: 'none' | 'scout' | 'explorer';
  readonly hpBefore: number;
  readonly hpAfter: number;
  /** The explorer died of the strike: the scan did not complete. */
  readonly dead: boolean;
  /** The scout that took the strike. One it cost its life is `lost`: it has no hurt and no condition afterwards. */
  readonly scout:
    | Readonly<{ id: string; name: string; hurtBefore: number; hurtAfter: number; condition: CreatureConditionLabel; lost: false }>
    | Readonly<{ id: string; name: string; hurtBefore: number; hurtAfter: null; condition: null; lost: true }>
    | null;
  /** The named scout that was resting when the strike fell, so that the explorer took it; null otherwise. */
  readonly scoutResting: Readonly<{ id: string; name: string }> | null;
  /** The roster is revealed. */
  readonly scanned: boolean;
  /** The world joined the surveyed set with this scan. */
  readonly firstScan: boolean;
  readonly lifeForms: number;
  /** Of them, the species the Compendium does not hold. */
  readonly uncatalogued: number;
  readonly surveys: number;
  readonly paragon: Readonly<{ index: number; speciesId: string; name: string; tier: number | null }> | null;
  readonly charters: Readonly<{ progressIds: readonly string[]; completedIds: readonly string[] }>;
  readonly achievementIds: readonly string[];
}
export type BioscanActionOutcomeV1 = CareOutcome<BioscanFactsV1>;

export interface BioscanActionInputV1 {
  readonly runtime: CareAuthority;
  /** The last stored state. */
  readonly state: SaveStateV2;
  readonly address: CanonicalCF1WorldAddress;
  /** The fence of the row the player pressed (`bioscanFenceV1`). */
  readonly shown: string;
  readonly codecNow: number;
  readonly charters: CareCharterStager;
}

/** Everything a press must pass before a value is drawn: the row stands, and it is the row the player was shown. */
function ready(input: BioscanActionInputV1, state: SaveStateV2, extensions: V5Extensions): Readonly<{ card: WorldCard; danger: BioscanDanger }> {
  const card = cardOf(input.address, state.EPOCH_BASE);
  const gate = gateOf(state, extensions, input.address, card);
  if (gate !== null) return refuse(gate);
  const danger = dangerOf(state, input.address, card);
  if (fenceOf(input.address, state.EPOCH_BASE, danger) !== input.shown) return refuse('presentation:changed');
  return { card, danger };
}

function stage(input: BioscanActionInputV1, receipt: CareReceipt): CareStaged<BioscanFactsV1> {
  const { address } = input;
  const { draft, extensions } = receipt;
  const seed = address.planet.seed;
  const { card, danger } = ready(input, draft, extensions);
  const loadout = readArc2EngineeringLoadout(extensions);
  if (loadout.kind !== 'loaded') return refuse(`gear:${loadout.kind}`);
  const ownership = ownershipOf(extensions);
  // The scout takes a strike only while it is a beast of the Compendium (13150-13151), and not while it rests: a
  // resting scout is not at its post, and the strike is the explorer's (`scoutStands`).
  const creature = draft.scoutId === null ? null : compendiumRow(ownership, draft.scoutId)?.creature ?? null;
  const named = draft.scoutId === null || creature === null ? null : { id: draft.scoutId, creature };
  const standing = named !== null && scoutStands(named.creature, receipt.activePlayMs) ? named : null;
  const resolved = resolveBioscanPress({
    danger, planetType: card.planetType, draws: receipt.draws, reinforcedHull: draft.techOwned.includes(REINFORCED_HULL),
    suitCut: loadout.capabilities.bioscanDamageReduction, hp: draft.hp, scoutHurt: standing === null ? null : standing.creature.hurt ?? 0,
  });

  const unlockedBefore = new Set(draft.unlocked);
  const hpBefore = draft.hp;
  const writes: V5ExtensionWrite[] = [];
  let contents: { -readonly [K in keyof OwnershipStateContentsV1]: OwnershipStateContentsV1[K] } = contentsOf(ownership);
  const touched: string[] = [];
  let scoutLost = false;
  let scoutFact: BioscanFactsV1['scout'] = null;
  if (resolved.hostile) {
    // A strike is counted whoever takes it (14295).
    draft.stats = { ...draft.stats, scanhits: (draft.stats.scanhits ?? 0) + 1 };
    if (resolved.target === 'scout') {
      // The strike was routed to the scout because one stands.
      const { id, creature: scout } = standing!;
      const named = { id, name: draft.codex.find(([held]) => held === id)?.[1].name ?? '', hurtBefore: scout.hurt ?? 0 };
      if (resolved.scoutLost) {
        // It had nothing left: its post is emptied and it leaves the Compendium (13156-13157).
        contents = { ...withoutSpeciesV1(contents, scout.speciesId) };
        scoutLost = true;
        scoutFact = { ...named, hurtAfter: null, condition: null, lost: true };
      } else {
        const hurt = resolved.scoutHurtAfter!;
        contents.creatures = contents.creatures.map((row) => row === scout ? createCreatureInstanceV1({ ...scout, hurt }) : row);
        touched.push(id);
        scoutFact = { ...named, hurtAfter: hurt, condition: creatureCondition(hurt).label, lost: false };
      }
    } else {
      draft.hp = resolved.hpAfter;
    }
    for (const id of resolved.unlocks) unlockAchievement(draft, id);
  }

  let firstScan = false;
  let charters: BioscanFactsV1['charters'] = { progressIds: [], completedIds: [] };
  let paragon: BioscanFactsV1['paragon'] = null;
  let paragonEntry: CodexEntry | null = null;
  if (resolved.scanCompletes) {
    const index = paragonIndexAt(seed);
    const reveal = revealBiosphere({
      planetSeed: seed, surveyed: draft.surveyedSet, surveys: draft.stats.surveys ?? 0, badge: card.badge,
      paragon: index === null ? null : { index, held: draft.codex.some(([id]) => id === compendiumId(paragonSeedV1(index))) },
      paragons: draft.stats.paragons ?? 0,
    });
    // The gate has refused a world already in the set, so this scan is the world's first and its deed is said.
    firstScan = reveal.firstScan;
    draft.surveyedSet = [...reveal.surveyed];
    draft.stats = { ...draft.stats, surveys: reveal.surveys };
    // The deed: the Charters' own staging hears nothing in training (24908); neither does the Ascent (25285).
    const staged = input.charters({ draft, extensions, event: { kind: 'bioscan', address }, receiptOrdinal: receipt.receiptOrdinal, activePlayMs: receipt.activePlayMs });
    if (staged.kind === 'refused') return refuse(`charter:${staged.reason}`);
    charters = { progressIds: [...staged.facts.progressIds], completedIds: staged.facts.completions.map(({ id }) => id) };
    writes.push(...staged.facts.extensionWrites);
    if (draft.tutDone) {
      const progress = { ...draft.ascProg };
      if (bankBioscan(draft.ascCh, progress, address)) {
        const reconciled = reconcileV2Chapters(draft.ascCh, progress, ascStageOf(draft.items, draft.ascCh));
        if (reconciled === null) return refuse('ascent:invalid');
        draft.ascProg = progress;
        draft.ascCh = reconciled.nextChapter;
      }
    }
    for (const id of reveal.unlocks) unlockAchievement(draft, id);
    if (reveal.paragon !== null) {
      const genome = paragonGenomeV1(reveal.paragon);
      const identity = canonicalGenomeIdentityV1(genome);
      const recordId = ownershipContentId('discovery', JSON.stringify({
        schema: 'care-paragon-scan/v1', parent: ownershipStateDigestV1(ownership), receiptOrdinal: receipt.receiptOrdinal, index: reveal.paragon, worldKey: address.key,
      })) as DiscoveryRecordId;
      contents.discoveries = [...contents.discoveries, createParagonDiscoveryRecordV1({
        recordId, speciesId: identity.speciesId, paragonIndex: reveal.paragon, worldAddress: address, receiptOrdinal: receipt.receiptOrdinal,
      })];
      contents.catalogSpecies = [...contents.catalogSpecies, createCatalogSpeciesV1({ identity, alias: null, firstObservationId: recordId })];
      // A whole beast, stored as any other is (`_storeSpecies` 14910): it can be fed, wounded and named the scout.
      contents.creatures = [...contents.creatures, createCreatureInstanceV1({
        creatureId: ownershipContentId('creature', `${recordId}:creature`) as CreatureInstanceId,
        speciesId: identity.speciesId, genomeIdentity: identity.genomeIdentity, genome: identity.genome, nickname: null, origin: 'wild',
        acquisitionRecordId: recordId, lineage: { kind: 'none', generation: Number(genome.gen ?? 0) },
        xp: null, hurt: null, fed: null, brood: null, assignment: null, bond: null,
      })];
      draft.stats = { ...draft.stats, paragons: reveal.paragons };
      paragon = { index: reveal.paragon, speciesId: compendiumId(genome.seed), name: '', tier: null };
    }
  }
  if (touched.length > 0 || scoutLost || paragon !== null) {
    writes.push(...stageOwnership({
      draft, extensions, parent: ownership, contents, touched,
      entryOf: (id, g, from, where) => {
        const genome = g as unknown as Genome;
        const described = describeSpecies(genome);
        const grade = ringGrade(g, described.grade as never, where) as { tier?: unknown } | null | undefined;
        paragonEntry = {
          id, name: described.name, kind: described.kind, tier: typeof grade?.tier === 'number' ? grade.tier : null, realm: classifyRealm(genome),
          sapient: sapienceTier(genome), from, hybrid: false, g, where,
        };
        return paragonEntry;
      },
    }));
  }
  const stored = paragonEntry as CodexEntry | null;
  if (paragon !== null && stored !== null) {
    paragon = { ...paragon, name: stored.name, tier: stored.tier };
    // A stored page raises the best find before the achievements are looked at (`onSpeciesStored` 16476).
    draft.stats = { ...draft.stats, best: Math.max(draft.stats.best ?? 0, stored.tier ?? 0) };
  }
  refreshProgression(draft);
  const held = new Set(draft.codex.map(([id]) => id));
  const facts: BioscanFactsV1 = {
    worldKey: address.key, planetSeed: seed, danger: { pct: danger.pct, dmg: danger.dmg }, rolled: danger.pct > 0, hostile: resolved.hostile, damage: resolved.damage,
    flavour: resolved.flavour, target: resolved.target, hpBefore, hpAfter: draft.hp, dead: resolved.dead, scout: scoutFact,
    scoutResting: resolved.hostile && named !== null && standing === null
      ? { id: named.id, name: draft.codex.find(([held]) => held === named.id)?.[1].name ?? '' } : null,
    scanned: resolved.scanCompletes, firstScan, lifeForms: card.species.length,
    uncatalogued: card.species.filter((g) => !held.has(compendiumId(g.seed))).length,
    surveys: draft.stats.surveys ?? 0, paragon, charters, achievementIds: draft.unlocked.filter((id) => !unlockedBefore.has(id)),
  };
  return { facts, extensionWrites: writes };
}

/** Commits one press of Discover Life. Everything is decided on the receipt's own draft; the caller's state is not touched. */
export async function commitBioscanV1(input: BioscanActionInputV1): Promise<BioscanActionOutcomeV1> {
  const { address } = input;
  let rolled = false;
  return commitCare<BioscanFactsV1>({
    runtime: input.runtime, state: input.state, codecNow: input.codecNow, receiptKind: BIOSCAN_RECEIPT_KIND_V1,
    // A world with no danger reads no random value (14294): its scan is a receipt ordinal alone.
    route: () => rolled ? { domains: BIOSCAN_DOMAINS_V1 } : { operation: `care.bioscan:${address.key}` },
    preflight: (state, extensions) => { rolled = ready(input, state, extensions).danger.pct > 0; },
    stage: (receipt) => stage(input, receipt),
    // The save never holds a dead explorer: its reader lifts the health to 1 (16783).
    verify: (stored, facts) => stored.hp !== Math.max(1, facts.hpAfter) ? 'health'
      : facts.scanned !== stored.surveyedSet.some((world) => Number(world) === address.planet.seed) ? 'surveyed-set'
        : (stored.stats.surveys ?? 0) !== facts.surveys ? 'surveys'
          : facts.scout !== null && (facts.scout.lost
            ? stored.scoutId !== null || stored.codex.some(([id]) => id === facts.scout!.id)
            : stored.codex.find(([id]) => id === facts.scout!.id)?.[1].g.hurt !== facts.scout.hurtAfter) ? 'scout'
            : facts.paragon !== null && !stored.codex.some(([id]) => id === facts.paragon!.speciesId) ? 'paragon'
              : facts.achievementIds.some((id) => !stored.unlocked.includes(id)) ? 'achievements'
                : facts.charters.completedIds.some((id) => !stored.chDone.includes(id)) ? 'charters' : null,
  });
}

/** One press of Discover Life as the page makes it. */
export function settleBioscanV1(deps: CareSettleDeps, input: Pick<BioscanActionInputV1, 'address' | 'shown' | 'codecNow'>): Promise<BioscanActionOutcomeV1> {
  return settleCare(deps.door, BIOSCAN_ACTION, (runtime, durable) => commitBioscanV1({ ...input, runtime, state: durable, charters: deps.charters }));
}
