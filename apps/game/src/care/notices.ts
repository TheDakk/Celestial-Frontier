/* What the care actions say, as data: the Discover Life row and the notices after a scan, a press of Scout and a
   rename. No element is made here; a screen draws from this.

   LEGACY celestial-frontier.html, v1.8.9:
   - the Discover Life row, its danger in whole percent and its two tips: 13934-13939;
   - a strike on the explorer: `damageExplorer` 19338; on the scout: `routeHit` 13163; a scout lost: 13159;
   - Biosphere Surveyed: `autoScanWorld` 14901-14903;
   - the Scout button, its tip and what a press says: 15150, 15200-15202;
   - Renamed: 24625;
   - the explorer's meal: 19150-19154; a companion's meal: 19187-19196, less the line the removed roll picked
     (`FEED_EVENTS`) and the lines of the toxic bite; Mend: 19054-19058.
   The legacy game drew a small picture before some titles; here each is the name of an icon. Its bold marks are
   not carried: the words are. The spectacle of a Paragon found (14911-14914) is rarity's show, a new design. */
import type { BioscanDanger } from './bioscan-hazard';
import type { BioscanFactsV1 } from './bioscan-action';
import type { FedMealV1, FeedFactsV1 } from './feed-action';
import type { ExplorerMealFactsV1 } from './meal-action';
import { FLAVOUR_NAMES } from './meals';
import type { RenameFactsV1 } from './rename-action';
import type { RestFactsV1 } from './rest-action';

/** Words with icons among them: each part is text, or the name of an icon drawn in its place in the line. */
export type CareCopyPart = string | Readonly<{ icon: string }>;
export interface CareNotice {
  /** Drawn before the title; null when the legacy game drew none. */
  readonly icon: string | null;
  readonly title: string;
  readonly message: readonly CareCopyPart[];
}
const notice = (icon: string | null, title: string, ...message: CareCopyPart[]): CareNotice => Object.freeze({ icon, title, message: Object.freeze(message) });

/** The Discover Life row of a grounded world not yet revealed. */
export function discoverLifeRow(lifeForms: number, danger: BioscanDanger): Readonly<{ label: string; text: string; danger: string | null; tip: string }> {
  return Object.freeze({
    label: 'Discover Life',
    text: `${lifeForms} life forms detected`,
    danger: danger.pct <= 0 ? null : `${Math.round(danger.pct * 100)}% danger`,
    tip: danger.pct > 0
      ? `Hostile wildlife may wound you for ${danger.dmg} HP — conquer the world first to discover life safely`
      : 'Discover & catalogue this world’s species',
  });
}

/** What a committed scan says, in the legacy order: the strike, then the roster revealed. */
export function bioscanNotices(facts: BioscanFactsV1): readonly CareNotice[] {
  const notices: CareNotice[] = [];
  if (facts.scout?.lost === true) {
    notices.push(notice('skull', 'Scout Lost', `${facts.scout.name} took the strike meant for you — and had nothing left. It is gone.`));
  } else if (facts.scout !== null) {
    notices.push(notice('scout', 'Scout Wounded',
      `${facts.scout.name} took the strike meant for you — now ${facts.scout.condition} (${Math.round(facts.scout.hurtAfter * 100)}% hurt). Feed it flora it loves to mend.`));
  } else if (facts.target === 'explorer' && !facts.dead) {
    notices.push(notice('wound', `−${facts.damage} HP`,
      `${facts.flavour ?? ''} You’re at ${facts.hpAfter} HP — tap the `, Object.freeze({ icon: 'heart' }), ' by your HP bar to heal with flora.'));
  }
  if (facts.scanned) {
    notices.push(notice(null, 'Biosphere Surveyed', `${facts.lifeForms} life forms revealed` + (facts.uncatalogued > 0
      ? ` — ${facts.uncatalogued} not yet in your Compendium. Tame the beasts; scavenge the growth.`
      : ' — every one already walks your Compendium.')));
  }
  return Object.freeze(notices);
}

export const SCOUT_BUTTON = Object.freeze({
  label: 'Scout',
  standing: 'Scouting',
  tip: 'Your Field Scout takes the hit when a bioscan turns hostile — wounds and all. A scout with nothing left is lost forever.',
});
/** What a committed press of Scout says of the beast it was pressed on. */
export function scoutNotice(name: string, named: boolean): CareNotice {
  return notice('scout', 'Field Scout', named
    ? `${name} now walks point — it takes the hit when a bioscan turns hostile.`
    : `${name} stands down. Hostile scans risk your own HP again.`);
}

/** What a committed rename says. */
export function renameNotice(facts: RenameFactsV1): CareNotice {
  return notice(null, 'Renamed', `${facts.name} it is — the name travels inside its creature code too.`);
}

/** What a committed meal of the explorer's says. */
export function mealNotice(facts: ExplorerMealFactsV1): CareNotice {
  if (facts.ok) {
    return notice('heal', `+${facts.heal} HP · +${facts.gain} ${FLAVOUR_NAMES[facts.stat]}`,
      `The ${facts.name} nourished you — now at ${facts.hpAfter}/${facts.hpMaxAfter} HP.`);
  }
  return notice('skull', `Poisoned −${facts.dmg} HP`,
    `The ${facts.name} was toxic (${Math.round(facts.pois * 100)}% risk). You’re at ${facts.hpAfter}/${facts.hpMaxAfter} HP`
      + (facts.brink ? ' — at the brink. Medicine gutted you, but it never kills.' : '.'));
}

/** How wounded a beast is after a meal, as the legacy line said it: "Bruised (25% hurt)", or "Healthy". */
const conditionWords = (meal: FedMealV1): string => meal.condition + (meal.condition === 'Healthy' ? '' : ` (${Math.round(meal.hurtAfter * 100)}% hurt)`);
/** What one meal of a companion's says: what the flora is to it, what it gained, and its wounds if they mended. */
export function feedNotice(name: string, meal: FedMealV1): CareNotice {
  const rich = `${FLAVOUR_NAMES[meal.flavour]}-rich flora`;
  const taste = meal.taste === 'loved' ? `It loves ${rich}` : meal.taste === 'disliked' ? `It dislikes ${rich}` : `It is indifferent to ${rich}`;
  const gain = meal.fedGain > 0 ? `+${meal.fedGain} bloodline` : 'no change';
  return notice('meal', name, `${taste} — ${gain}.` + (meal.mended ? ` Its wounds mend — now ${conditionWords(meal)}.` : ''));
}
/** What a committed press of "Mend — safest meals" says. */
export function mendNotice(facts: FeedFactsV1): CareNotice {
  const served = facts.meals.length;
  return notice('heart', `${served} safe meal${served === 1 ? '' : 's'} served.`,
    (facts.halt === 'out-of-safe-flora' ? 'out of safe flora. ' : '') + `Now ${conditionWords(facts.meals.at(-1)!)}.`);
}

/** What a committed Rest says: the painted port's line for a resting companion. The legacy game has no Rest. */
export function restNotice(facts: RestFactsV1): CareNotice {
  return notice('rest', 'Resting', `${facts.name} — ${facts.minutes} min of play left`);
}
