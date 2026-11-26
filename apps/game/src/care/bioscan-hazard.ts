/* The hazard of a biosphere scan: how likely the wildlife is to strike, how hard, and who takes it.

   LEGACY celestial-frontier.html, v1.8.9:
   - the danger is the strongest beast's: (power - 170) / 520 held to 0..0.5, 0.12 more on a lava or venus world up
     to 0.65, none on a conquered world; the wound is (10 + power / 22) times the depth tax, at least 1; a world
     with no beast has neither (`dangerOf` 19278-19288);
   - the depth tax is 0.8 in the home galaxy and 1.0, 1.3, 1.6, 1.9, 2.2, 2.5 by region beyond it; 1 with no place
     (`DEPTH_TAX`, `depthTax` 19270-19277);
   - a random value is read only when there is danger; it strikes below the danger (14294);
   - the Reinforced Hull takes a quarter off the wound, never below 1 (14296);
   - the words of the mishap are one of the world type's three, picked by a second random value (`hazardFlavor`
     19245-19261);
   - the worn suit cuts the wound by its share, held to 0.7, never below 1 (`routeHit` 13149);
   - a Field Scout that is a beast of the Compendium takes it: its hurt rises by the wound / 80 held to 0.12..0.6,
     up to 0.95; a scout that would reach 1 is lost (13150-13166);
   - with no scout the explorer takes it and may die; a dead explorer's scan does not complete (`damageExplorer`
     19329-19339, `routeHit` 13167-13170, 14298);
   - a strike the explorer lives through with under 20 health left unlocks `brink` (19337), and a strike on the
     explorer unlocks `survivor`, dead or alive (13168).
   The painted port (`bioscan-hazard.ts`, `bioscan.ts`) kept the explorer at 1 health and the scout at 0.85: neither
   is the legacy game's, and neither is carried. */
import { regionAt } from '@cf/domain-strays';
import { HOME_GAL_SEED } from '@cf/domain-worldconfig';

export const DEPTH_TAX_HOME = 0.8;
export const DEPTH_TAX_BY_REGION: readonly number[] = Object.freeze([1.0, 1.3, 1.6, 1.9, 2.2, 2.5]);
export const REINFORCED_HULL_SHARE = 0.75;
export const SUIT_CUT_MAX = 0.7;
export const SCOUT_HURT_MAX = 0.95;
/** Under this health after a strike, an explorer who lived was at the brink (19337). */
export const BRINK_HP = 20;

/** The depth tax of the home galaxy, of a region beyond it, or of no place at all. */
export function depthTaxOf(home: boolean, region: number | null): number {
  if (home) return DEPTH_TAX_HOME;
  if (region === null) return 1;
  return DEPTH_TAX_BY_REGION[Math.min(region, DEPTH_TAX_BY_REGION.length - 1)] ?? 1;
}
/** The depth tax where this galaxy lies. */
export function depthTax(galaxy: Readonly<{ seed: number; x: number; y: number }> | null): number {
  if (galaxy === null) return 1;
  return galaxy.seed === HOME_GAL_SEED ? depthTaxOf(true, null) : depthTaxOf(false, regionAt(galaxy.x, galaxy.y));
}

export interface BioscanDanger {
  /** The chance of a strike, 0 to 0.65. */
  readonly pct: number;
  /** The wound a strike deals before the hull and the suit. */
  readonly dmg: number;
  /** The strongest beast's power. */
  readonly top: number;
}
/** The danger of a world whose beasts have these powers. */
export function bioscanDanger(input: Readonly<{ powers: readonly number[]; planetType: string; settled: boolean; depthTax: number }>): BioscanDanger {
  if (input.powers.length === 0) return Object.freeze({ pct: 0, dmg: 0, top: 0 });
  let top = 0;
  for (const power of input.powers) if (power > top) top = power;
  let pct = Math.min(0.5, Math.max(0, (top - 170) / 520));
  if (input.planetType === 'lava' || input.planetType === 'venus') pct = Math.min(0.65, pct + 0.12);
  if (input.settled) pct = 0;
  return Object.freeze({ pct, dmg: Math.max(1, Math.round((10 + top / 22) * input.depthTax)), top });
}

/** The wound behind a Reinforced Hull. */
export const hullDamage = (dmg: number, reinforcedHull: boolean): number => reinforcedHull ? Math.max(1, Math.round(dmg * REINFORCED_HULL_SHARE)) : dmg;
/** The wound through a suit that cuts this share of it. */
export function suitedDamage(dmg: number, cut: number): number {
  const share = Math.min(SUIT_CUT_MAX, Math.max(0, cut));
  return share > 0 ? Math.max(1, Math.round(dmg * (1 - share))) : dmg;
}
/** What a strike does to a scout holding this hurt: it is lost, or holds this hurt afterwards. */
export function scoutWound(dmg: number, hurt: number): Readonly<{ lost: true } | { lost: false; hurt: number }> {
  const wound = Math.min(0.6, Math.max(0.12, dmg / 80));
  return hurt + wound >= 1 ? Object.freeze({ lost: true }) : Object.freeze({ lost: false, hurt: Math.min(SCOUT_HURT_MAX, hurt + wound) });
}

const FLAVOURS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  lava: ['a fissure split and molten spatter caught you', 'you broke through a thin crust above a lava tube', 'a column of superheated gas vented without warning'],
  venus: ['the acid haze seared your lungs', 'a pocket of corrosive cloud closed over you', 'the furnace-hot, crushing air overcame you'],
  ice: ['you dropped through into a cryogenic crevasse', 'the cold flash-froze a seam in your suit', 'a cryovolcanic geyser erupted beneath you'],
  ocean: ['a rogue swell dragged you under', 'something immense brushed past you in the black water', 'the pressure of the deep nearly crushed you'],
  desert: ['a sudden sandstorm flayed you raw', 'the heat dropped you before you could react', 'the ground gave way into shifting sand'],
  gas: ['a savage downdraft hurled you through the cloud decks', 'lightning arced across the storm and found you', 'the crushing pressure closed in'],
  rocky: ['a rockfall came down without warning', 'the airless cold bit straight through your suit', 'you lost your footing on a sheer regolith slope'],
  terran: ['you were swarmed before you could retreat', 'a venomous strike found a gap in your gear', 'the apex predator ran you down in the open'],
});
const FLAVOURS_ELSEWHERE: readonly string[] = ['the environment turned on you without warning', 'a hazard you never saw coming struck'];
/** What happened, in the words of this world type, picked by a random value. */
export function hazardFlavour(planetType: string, value: number): string {
  const bank = Object.hasOwn(FLAVOURS, planetType) ? FLAVOURS[planetType]! : FLAVOURS_ELSEWHERE;
  return `Mid-scan, ${bank[Math.floor(value * bank.length)]}.`;
}

export type CreatureConditionLabel = 'Healthy' | 'Bruised' | 'Injured' | 'Critical';
/** How badly a creature is wounded (`creatureCondition` 18886-18892). */
export function creatureCondition(hurt: number | null | undefined): Readonly<{ h: number; label: CreatureConditionLabel }> {
  const h = Number(hurt) || 0;
  if (h < 0.05) return Object.freeze({ h: 0, label: 'Healthy' });
  return Object.freeze({ h, label: h < 0.3 ? 'Bruised' : h < 0.6 ? 'Injured' : 'Critical' });
}

/** What a strike on the explorer unlocks, in the legacy order. */
export type StrikeUnlock = 'brink' | 'survivor';
export interface StrikeRoute {
  /** The wound after the suit. */
  readonly damage: number;
  readonly target: 'scout' | 'explorer';
  readonly hpAfter: number;
  readonly dead: boolean;
  readonly scoutLost: boolean;
  /** The scout's hurt after the strike; null when it took none or was lost. */
  readonly scoutHurtAfter: number | null;
  readonly unlocks: readonly StrikeUnlock[];
}
/** Who takes a strike of `dmg` (the wound behind the hull) and what it does (`routeHit` 13144-13171). `scoutHurt`
    is the hurt of a standing scout that is a beast of the Compendium, null with none. */
export function routeStrike(input: Readonly<{ dmg: number; suitCut: number; hp: number; scoutHurt: number | null }>): StrikeRoute {
  const damage = suitedDamage(input.dmg, input.suitCut);
  if (input.scoutHurt !== null) {
    const wound = scoutWound(damage, input.scoutHurt);
    return Object.freeze({
      damage, target: 'scout', hpAfter: input.hp, dead: false, scoutLost: wound.lost, scoutHurtAfter: wound.lost ? null : wound.hurt, unlocks: Object.freeze([]),
    });
  }
  const hpAfter = Math.max(0, input.hp - damage);
  const dead = hpAfter <= 0;
  return Object.freeze({
    damage, target: 'explorer', hpAfter, dead, scoutLost: false, scoutHurtAfter: null,
    unlocks: Object.freeze<StrikeUnlock[]>(!dead && hpAfter < BRINK_HP ? ['brink', 'survivor'] : ['survivor']),
  });
}

export interface BioscanPressResolution {
  /** How many of the two random values the legacy game would have read: 0 with no danger, 1 on a clear roll, 2 on a strike. */
  readonly drawsRead: 0 | 1 | 2;
  readonly hostile: boolean;
  /** The wound after the hull and the suit; 0 when nothing struck. */
  readonly damage: number;
  /** The words of the mishap; null when nothing struck. */
  readonly flavour: string | null;
  readonly target: 'none' | 'scout' | 'explorer';
  readonly hpAfter: number;
  readonly dead: boolean;
  readonly scoutLost: boolean;
  /** The scout's hurt after the strike; null when it took none or was lost. */
  readonly scoutHurtAfter: number | null;
  /** What the strike unlocks, in the legacy order; none when nothing struck or the scout took it. */
  readonly unlocks: readonly StrikeUnlock[];
  /** Whether the scan goes on to reveal the roster: always, unless the explorer died. */
  readonly scanCompletes: boolean;
}
/** One press of Discover Life, resolved. `draws` are the hazard value then the flavour value; `scoutHurt` is the
    hurt of a standing scout that is a beast of the Compendium, null with none. */
export function resolveBioscanPress(input: Readonly<{
  danger: BioscanDanger; planetType: string; draws: readonly number[]; reinforcedHull: boolean; suitCut: number; hp: number; scoutHurt: number | null;
}>): BioscanPressResolution {
  const { danger, hp } = input;
  const clear = (drawsRead: 0 | 1): BioscanPressResolution => Object.freeze({
    drawsRead, hostile: false, damage: 0, flavour: null, target: 'none', hpAfter: hp, dead: false, scoutLost: false, scoutHurtAfter: null,
    unlocks: Object.freeze([]), scanCompletes: true,
  });
  if (!(danger.pct > 0)) return clear(0);
  const [hazard, flavourValue] = input.draws;
  if (hazard === undefined) throw new RangeError('a scan with danger needs its hazard value');
  if (!(hazard < danger.pct)) return clear(1);
  if (flavourValue === undefined) throw new RangeError('a strike needs its flavour value');
  const flavour = hazardFlavour(input.planetType, flavourValue);
  const route = routeStrike({ dmg: hullDamage(danger.dmg, input.reinforcedHull), suitCut: input.suitCut, hp, scoutHurt: input.scoutHurt });
  return Object.freeze({ ...route, drawsRead: 2, hostile: true, flavour, scanCompletes: !route.dead });
}
