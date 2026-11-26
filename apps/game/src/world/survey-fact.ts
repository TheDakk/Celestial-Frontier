/* What a survey reads off a star or a world, and what that adds to the expedition's record.

   LEGACY celestial-frontier.html, v1.8.9, `noteSurvey` 16451-16462, run when a survey card is locked or the
   explorer stands on the world (13752-13757), in training as well as after it:
   - a star adds its kind to the kinds seen, unlocks the achievement of an uncommon kind, of a binary pair and of
     Sol (16453-16458); the kind and the pair are the system's own (`starDescriptor` 5234, `systemFor` 4018-4024);
   - a world adds its type to the types seen (16460, the card's `ptype` 5194);
   - then every achievement is looked at (16461), and with it the rank.
   A survey writes nothing else. The set of surveyed living worlds, `stats.surveys`, the bioscan deed and the
   achievements of a civilization are written by the biosphere scan (`autoScanWorld` 14888-14894), which is the
   Bioscan action's to port.

   Ported from the painted port's `arc9-survey-action.ts` (its fact and its preparation, 244-456). Differences from
   it, all the legacy game's: the painted port also marked a living world surveyed and unlocked the civilization
   achievements at the survey itself, which opened a world's life without the scan; neither is done here. The star's
   pair is read from the system the legacy game builds rather than drawn a second time. */
import { HOME_GAL_SEED, HOME_POS, SOL_POS, SOL_SEED } from '@cf/domain-worldconfig';
import { systemFor } from '@cf/domain-worldgen';
import {
  prepareArc9EventAchievementJoinV1,
  prepareArc9ProgressionRefreshV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
  type SaveStateV2,
} from '@cf/persistence';
import { getCanonicalCF1AddressKey, isCanonicalCF1Address, type CanonicalCF1StarAddress, type CanonicalCF1WorldAddress } from '@cf/scene';

export type SurveyAddressV1 = CanonicalCF1StarAddress | CanonicalCF1WorldAddress;
export type SurveyEventAchievementIdV1 = 'sol' | 'binary' | 'seebh' | 'seens' | 'seemag' | 'seewd' | 'seerg' | 'seesg' | 'seeproto' | 'seebd';

/** The achievement of each uncommon kind of star (LEGACY 16454). */
const STAR_ACHIEVEMENT: Readonly<Record<string, SurveyEventAchievementIdV1>> = Object.freeze({
  BH: 'seebh', NS: 'seens', MAG: 'seemag', WD: 'seewd', RG: 'seerg', SG: 'seesg', PROTO: 'seeproto', BD: 'seebd',
});

export type SurveyFactV1 =
  | Readonly<{ target: 'world'; addressKey: string; planetSeed: number; planetType: string; eventAchievementIds: readonly SurveyEventAchievementIdV1[] }>
  | Readonly<{
    target: 'star'; addressKey: string; starSeed: number; starKind: string; binary: boolean; sol: boolean;
    eventAchievementIds: readonly SurveyEventAchievementIdV1[];
  }>;

export type SurveyProtectionReasonV1 =
  | 'source-unproven'
  | 'source-mismatch'
  | `achievement:${Arc9ProgressionProjectionProtectionReasonV1}`
  | `progression:${Arc9ProgressionProjectionProtectionReasonV1}`;

class SurveyProtection extends Error {
  constructor(readonly reason: SurveyProtectionReasonV1) { super(reason); }
}

/** The facts of one registered star or world, read from the universe itself: nothing a card says is taken. */
export function deriveSurveyFactV1(address: SurveyAddressV1): SurveyFactV1 {
  if (!isCanonicalCF1Address(address) || !('star' in address) || getCanonicalCF1AddressKey(address) !== address.key) {
    throw new SurveyProtection('source-unproven');
  }
  const system = systemFor(address.star.seed);
  if ('planet' in address) {
    const entry = system.planets[address.planet.ordinal];
    if (!entry || entry.P.seed !== address.planet.seed) throw new SurveyProtection('source-mismatch');
    const type = entry.P.type;
    return Object.freeze({
      target: 'world', addressKey: address.key, planetSeed: address.planet.seed,
      planetType: typeof type === 'string' && type.length > 0 ? type : 'rocky',
      eventAchievementIds: Object.freeze([]),
    });
  }
  const starKind = typeof system.kind === 'string' ? system.kind : '';
  if (starKind === '') throw new SurveyProtection('source-mismatch');
  const binary = system.binary !== undefined && system.binary !== null;
  const sol = address.galaxy.seed === HOME_GAL_SEED && address.galaxy.x === HOME_POS.x && address.galaxy.y === HOME_POS.y
    && address.star.seed === SOL_SEED && address.star.x === SOL_POS.x && address.star.y === SOL_POS.y;
  const eventAchievementIds: SurveyEventAchievementIdV1[] = [];
  if (Object.prototype.hasOwnProperty.call(STAR_ACHIEVEMENT, starKind)) eventAchievementIds.push(STAR_ACHIEVEMENT[starKind]!);
  if (binary) eventAchievementIds.push('binary');
  if (sol) eventAchievementIds.push('sol');
  return Object.freeze({
    target: 'star', addressKey: address.key, starSeed: address.star.seed, starKind, binary, sol,
    eventAchievementIds: Object.freeze(eventAchievementIds),
  });
}

export type SurveySettlementV1 =
  /** The survey shows something new: `successorState` is the state with it recorded. */
  | Readonly<{ kind: 'ready'; facts: SurveyFactV1; successorState: SaveStateV2; addedAchievementIds: readonly string[] }>
  /** Everything this survey shows is already in the record. */
  | Readonly<{ kind: 'current'; facts: SurveyFactV1 }>
  | Readonly<{ kind: 'protected'; reason: SurveyProtectionReasonV1 }>;

/** What this survey would leave in the state. Pure: `state` is not touched. */
export function prepareSurveySettlementV1(state: SaveStateV2, address: SurveyAddressV1): SurveySettlementV1 {
  try {
    const facts = deriveSurveyFactV1(address);
    let successor: SaveStateV2 = facts.target === 'world'
      ? { ...state, ptypesSeen: state.ptypesSeen.includes(facts.planetType) ? state.ptypesSeen : [...state.ptypesSeen, facts.planetType] }
      : { ...state, starKindsSeen: state.starKindsSeen.includes(facts.starKind) ? state.starKindsSeen : [...state.starKindsSeen, facts.starKind] };
    for (const id of facts.eventAchievementIds) {
      const join = prepareArc9EventAchievementJoinV1(successor, id);
      if (join.kind !== 'prepared') throw new SurveyProtection(`achievement:${join.reason}`);
      if (join.added) successor = { ...successor, unlocked: [...join.nextUnlockedIds] };
    }
    const refresh = prepareArc9ProgressionRefreshV1(successor);
    if (refresh.kind === 'protected') throw new SurveyProtection(`progression:${refresh.reason}`);
    if (refresh.kind === 'ready') successor = refresh.successorState;
    const was = new Set(state.unlocked);
    const addedAchievementIds = successor.unlocked.filter((id) => !was.has(id));
    const changed = successor.ptypesSeen !== state.ptypesSeen || successor.starKindsSeen !== state.starKindsSeen
      || addedAchievementIds.length > 0 || (successor.stats.bestRank ?? 0) !== (state.stats.bestRank ?? 0);
    return changed
      ? Object.freeze({ kind: 'ready', facts, successorState: successor, addedAchievementIds: Object.freeze(addedAchievementIds) })
      : Object.freeze({ kind: 'current', facts });
  } catch (error) {
    return Object.freeze({ kind: 'protected', reason: error instanceof SurveyProtection ? error.reason : 'source-mismatch' });
  }
}
