/* One press of Discover Life, committed: the hazard's strike and who took it, the world's roster opened, and what
   opening it leads to, in one receipt, or nothing at all.

   LEGACY celestial-frontier.html, v1.8.9:
   - the row stands on a world with life that is grounded (Earth, landed on or conquered) and not yet revealed: its
     seed is not in the surveyed set and some species of it is not in the Compendium (13719, 13932-13937); the
     lessons of training do not gate it (14236-14243 gate only the card's `data-act` buttons);
   - the press rolls the hazard, counts a strike in `stats.scanhits`, and routes it to the scout or the explorer;
     an explorer who dies ends the press there (14294-14298; the rules are `bioscan-hazard.ts`);
   - a strike on the explorer unlocks `survivor`, dead or alive, and `brink` when under 20 health is left
     (`routeHit` 13167-13169, `damageExplorer` 19336-19337);
   - then the scan: a world new to the surveyed set joins it, `stats.surveys` becomes the set's size, and the
     `bioscan` deed is said to the Charters and the Ascent (`autoScanWorld` 14889-14894, `gameEvent`
     25358-25363); a civilized world unlocks `civ`, a spacefaring one `spacefar` as well (14895-14896, the card's
     badge 5145-5147 with `civBadge` at the civilization rows);
   - at a Paragon's home world the Paragon is catalogued without a capture and `stats.paragons` rises (14904-14917);
     a stored page raises the best find and the achievements are looked at (`onSpeciesStored` 16474-16480).

   NOT BUILT, and refused by name so that nothing else happens in its place:
   - a strike that would cost the scout its life (13154-13159 removes it from the Compendium and the scan goes on).
     The save's ownership carrier cannot take a creature or a species out; the press is refused with
     `scout-loss:not-carried` and nothing is written.
   Carried as far as the save allows: a Paragon is a page of the Compendium with no creature behind it (the carrier
   keeps it so), where the legacy game stored a whole beast that could be fed, bred or named the scout. What follows
   an explorer's death (`showDeath` 19371, then a new expedition, 20736) is not here: the facts say `dead` and a
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
  prepareArc9EventAchievementJoinV1,
  prepareArc9ProgressionRefreshV1,
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
import { commitCare, refuse, settleCare, type CareAuthority, type CareDoor, type CareOutcome, type CareReceipt, type CareStaged } from './commit';
import { compendiumId, compendiumRow, contentsOf, ownershipOf, stageOwnership } from './ownership';
import { paragonIndexAt } from './paragon-finder';

export const BIOSCAN_ACTION = 'bioscan' as const;
export const BIOSCAN_RECEIPT_KIND_V1 = 'care-bioscan-v1' as const;
/** The hazard's value, then the value that picks the mishap's words. */
export const BIOSCAN_DOMAINS_V1 = Object.freeze([DOMAINS.surveyHazard, DOMAINS.hazardFlavor] as const);
const REINFORCED_HULL = 'hull1';
const BRINK_HP = 20;

/** Why Discover Life does not stand on a world, in the legacy card's order. */
export type BioscanGateV1 = 'no-life' | 'not-landed' | 'already-revealed';

/** What the guidance system's Charter staging answers, as far as a care action reads it. */
export type CareCharterStage =
  | Readonly<{ kind: 'refused'; reason: string }>
  | Readonly<{ kind: 'ready' | 'current'; facts: Readonly<{ progressIds: readonly string[]; completions: ReadonlyArray<Readonly<{ id: string }>>; extensionWrites: readonly V5ExtensionWrite[] }> }>;
/** Stages a deed on the draft against the Charters accepted: the guidance system's own function. */
export type CareCharterStager = (input: {
  draft: SaveStateV2;
  extensions: V5Extensions;
  event: Readonly<{ kind: 'bioscan'; address: CanonicalCF1WorldAddress }> | Readonly<{ kind: 'scout-set'; scoutId: string }>;
  receiptOrdinal: number;
  activePlayMs?: number;
}) => CareCharterStage;

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
  readonly scout: Readonly<{ id: string; name: string; hurtBefore: number; hurtAfter: number; condition: CreatureConditionLabel }> | null;
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
  readonly codecNow: number;
  readonly charters: CareCharterStager;
}

function unlock(draft: SaveStateV2, id: 'survivor' | 'brink' | 'civ' | 'spacefar'): void {
  const join = prepareArc9EventAchievementJoinV1(draft, id);
  if (join.kind !== 'prepared') return refuse(`achievement:${join.reason}`);
  if (join.added) draft.unlocked = [...join.nextUnlockedIds];
}

function stage(input: BioscanActionInputV1, receipt: CareReceipt, rolled: boolean): CareStaged<BioscanFactsV1> {
  const { address } = input;
  const { draft, extensions } = receipt;
  const seed = address.planet.seed;
  const card = cardOf(address, draft.EPOCH_BASE);
  const gate = gateOf(draft, extensions, address, card);
  if (gate !== null) return refuse(gate);
  const danger = dangerOf(draft, address, card);
  if ((danger.pct > 0) !== rolled) return refuse('hazard:route-changed');
  const loadout = readArc2EngineeringLoadout(extensions);
  if (loadout.kind !== 'loaded') return refuse(`gear:${loadout.kind}`);
  const ownership = ownershipOf(extensions);
  // The scout takes a strike only while it is a beast of the Compendium (13150-13151).
  const scoutRow = draft.scoutId === null ? null : compendiumRow(ownership, draft.scoutId);
  const scout = scoutRow?.creature ?? null;
  const resolved = resolveBioscanPress({
    danger, planetType: card.planetType, draws: receipt.draws, reinforcedHull: draft.techOwned.includes(REINFORCED_HULL),
    suitCut: loadout.capabilities.bioscanDamageReduction, hp: draft.hp, scoutHurt: scout === null ? null : scout.hurt ?? 0,
  });
  if (resolved.scoutLost) return refuse('scout-loss:not-carried');

  const unlockedBefore = new Set(draft.unlocked);
  const hpBefore = draft.hp;
  const writes: V5ExtensionWrite[] = [];
  const contents: { -readonly [K in keyof OwnershipStateContentsV1]: OwnershipStateContentsV1[K] } = contentsOf(ownership);
  const touched: string[] = [];
  let scoutFact: BioscanFactsV1['scout'] = null;
  if (resolved.hostile) {
    draft.stats = { ...draft.stats, scanhits: (draft.stats.scanhits ?? 0) + 1 };
    if (resolved.target === 'scout' && scout !== null && resolved.scoutHurtAfter !== null && draft.scoutId !== null) {
      const hurt = resolved.scoutHurtAfter;
      contents.creatures = contents.creatures.map((row) => row === scout ? createCreatureInstanceV1({ ...scout, hurt }) : row);
      touched.push(draft.scoutId);
      scoutFact = {
        id: draft.scoutId, name: draft.codex.find(([id]) => id === draft.scoutId)?.[1].name ?? '', hurtBefore: scout.hurt ?? 0, hurtAfter: hurt,
        condition: creatureCondition(hurt).label,
      };
    } else {
      draft.hp = resolved.hpAfter;
      unlock(draft, 'survivor');
      if (!resolved.dead && resolved.hpAfter < BRINK_HP) unlock(draft, 'brink');
    }
  }

  let firstScan = false;
  let charters: BioscanFactsV1['charters'] = { progressIds: [], completedIds: [] };
  let paragon: BioscanFactsV1['paragon'] = null;
  let paragonEntry: CodexEntry | null = null;
  if (resolved.scanCompletes) {
    if (!draft.surveyedSet.some((world) => Number(world) === seed)) {
      firstScan = true;
      // The set holds planet seeds as the legacy save does.
      draft.surveyedSet = [...draft.surveyedSet, seed as unknown as string];
      draft.stats = { ...draft.stats, surveys: draft.surveyedSet.length };
      if (draft.tutDone) {
        const staged = input.charters({ draft, extensions, event: { kind: 'bioscan', address }, receiptOrdinal: receipt.receiptOrdinal, activePlayMs: receipt.activePlayMs });
        if (staged.kind === 'refused') return refuse(`charter:${staged.reason}`);
        charters = { progressIds: [...staged.facts.progressIds], completedIds: staged.facts.completions.map(({ id }) => id) };
        writes.push(...staged.facts.extensionWrites);
        const progress = { ...draft.ascProg };
        if (bankBioscan(draft.ascCh, progress, address)) {
          const reconciled = reconcileV2Chapters(draft.ascCh, progress, ascStageOf(draft.items, draft.ascCh));
          if (reconciled === null) return refuse('ascent:invalid');
          draft.ascProg = progress;
          draft.ascCh = reconciled.nextChapter;
        }
      }
    }
    if (card.badge === 'Civilized' || card.badge === 'Advanced') unlock(draft, 'civ');
    if (card.badge === 'Advanced') unlock(draft, 'spacefar');
    const index = paragonIndexAt(seed);
    if (index !== null && !draft.codex.some(([id]) => id === compendiumId(paragonSeedV1(index)))) {
      const genome = paragonGenomeV1(index);
      const identity = canonicalGenomeIdentityV1(genome);
      const recordId = ownershipContentId('discovery', JSON.stringify({
        schema: 'care-paragon-scan/v1', parent: ownershipStateDigestV1(ownership), receiptOrdinal: receipt.receiptOrdinal, index, worldKey: address.key,
      })) as DiscoveryRecordId;
      contents.discoveries = [...contents.discoveries, createParagonDiscoveryRecordV1({
        recordId, speciesId: identity.speciesId, paragonIndex: index, worldAddress: address, receiptOrdinal: receipt.receiptOrdinal,
      })];
      contents.catalogSpecies = [...contents.catalogSpecies, createCatalogSpeciesV1({ identity, alias: null, firstObservationId: recordId })];
      draft.stats = { ...draft.stats, paragons: (draft.stats.paragons ?? 0) + 1 };
      paragon = { index, speciesId: compendiumId(genome.seed), name: '', tier: null };
    }
  }
  if (touched.length > 0 || paragon !== null) {
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
  const refresh = prepareArc9ProgressionRefreshV1(draft);
  if (refresh.kind === 'protected') return refuse(`progression:${refresh.reason}`);
  if (refresh.kind === 'ready') {
    draft.unlocked = [...refresh.successorState.unlocked];
    draft.stats = { ...refresh.successorState.stats };
  }
  const held = new Set(draft.codex.map(([id]) => id));
  const facts: BioscanFactsV1 = {
    worldKey: address.key, planetSeed: seed, danger: { pct: danger.pct, dmg: danger.dmg }, rolled, hostile: resolved.hostile, damage: resolved.damage,
    flavour: resolved.flavour, target: resolved.target, hpBefore, hpAfter: draft.hp, dead: resolved.dead, scout: scoutFact,
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
    preflight: (state, extensions) => {
      const card = cardOf(address, state.EPOCH_BASE);
      const gate = gateOf(state, extensions, address, card);
      if (gate !== null) refuse(gate);
      rolled = dangerOf(state, address, card).pct > 0;
    },
    stage: (receipt) => stage(input, receipt, rolled),
    // The save never holds a dead explorer: its reader lifts the health to 1 (16783).
    verify: (stored, facts) => stored.hp !== Math.max(1, facts.hpAfter) ? 'health'
      : facts.scanned !== stored.surveyedSet.some((world) => Number(world) === address.planet.seed) ? 'surveyed-set'
        : (stored.stats.surveys ?? 0) !== facts.surveys ? 'surveys'
          : facts.scout !== null && stored.codex.find(([id]) => id === facts.scout!.id)?.[1].g.hurt !== facts.scout.hurtAfter ? 'scout'
            : facts.paragon !== null && !stored.codex.some(([id]) => id === facts.paragon!.speciesId) ? 'paragon'
              : facts.achievementIds.some((id) => !stored.unlocked.includes(id)) ? 'achievements'
                : facts.charters.completedIds.some((id) => !stored.chDone.includes(id)) ? 'charters' : null,
  });
}

export interface CareSettleDeps {
  readonly door: CareDoor;
  readonly charters: CareCharterStager;
}
/** One press of Discover Life as the page makes it. */
export function settleBioscanV1(deps: CareSettleDeps, input: Pick<BioscanActionInputV1, 'address' | 'codecNow'>): Promise<BioscanActionOutcomeV1> {
  return settleCare(deps.door, BIOSCAN_ACTION, (runtime, durable) => commitBioscanV1({ ...input, runtime, state: durable, charters: deps.charters }));
}
