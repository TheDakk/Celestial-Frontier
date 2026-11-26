/* What the descent tells the player, as data: the prompt before a manual dive and the two notices of a roll.

   LEGACY celestial-frontier.html, v1.8.9:
   - the word for the odds: `descentTierLabel` 13398-13401;
   - the prompt: its title and its lines, `openDescentBox` 13612-13623; its two buttons, 2415;
   - Through the Fire, on a rolled landing where the biome lands at 30 or less: `_descRoll` 13443-13444;
   - the wave-off: `_descRoll` 13457-13459.
   The legacy game drew a small picture before each notice's title and before the health lost; here each is the
   name of an icon. The storm line reads "−5" even where the floor of 90 held some of it back, as in the legacy
   game. Which weather the prompt is told of is `descent-weather.ts`'s to say. */
import { WEATHER_EVENT_WORD } from '@cf/domain-landing';
import type { DescentOdds } from './descent-policy';
import type { DescentWeather } from './descent-weather';

/** Words with icons among them: each part is text, or the name of an icon drawn in its place in the line. */
export type DescentCopyPart = string | Readonly<{ icon: string }>;

export interface DescentNotice {
  /** Drawn before the title. */
  readonly icon: string;
  readonly title: string;
  readonly message: readonly DescentCopyPart[];
}

export interface DescentPrompt {
  readonly title: string;
  /** Leads the first line, followed by a dash; null when the world has no biome. */
  readonly biomeName: string | null;
  readonly tierLabel: string;
  readonly successPercent: number;
  readonly stormLine: string | null;
  readonly eventLine: string | null;
  /** Absent when the descent cannot fail. */
  readonly waveOffLine: string | null;
}

export const DESCENT_PROMPT_BUTTONS = Object.freeze({ go: 'Begin descent', stay: 'Stay in orbit' });
export const DESCENT_STORM_LINE = 'storm in progress −5';

export function descentTierLabel(successPercent: number): string {
  return successPercent >= 100 ? 'Calm approach' : successPercent >= 90 ? 'Steady approach'
    : successPercent >= 75 ? 'Rough descent' : successPercent >= 55 ? 'Hazardous descent'
    : successPercent >= 30 ? 'Extreme descent' : 'Hostile descent';
}

/** The prompt for these odds in this weather. The odds must have been worked out for the same weather. */
export function descentPrompt(worldName: string | null, odds: DescentOdds, weather: DescentWeather): DescentPrompt {
  if (odds.stormActive !== weather.stormActive) {
    throw new RangeError('descent prompt: the odds were worked out for another weather than the one shown');
  }
  return Object.freeze({
    title: `Begin descent — ${worldName || 'this world'}?`,
    biomeName: odds.biomeName,
    tierLabel: descentTierLabel(odds.successPercent),
    successPercent: odds.successPercent,
    stormLine: weather.stormActive ? DESCENT_STORM_LINE : null,
    eventLine: weather.event === null ? null : WEATHER_EVENT_WORD[weather.event],
    waveOffLine: odds.successPercent < 100
      ? `a wave-off costs ${odds.damageMin}–${odds.damageMax} HP — and teaches the approach (+20% next try)`
      : null,
  });
}

/** The notice of a rolled landing on a hostile world. */
export function throughTheFireNotice(worldName: string | null): DescentNotice {
  return Object.freeze({
    icon: 'trophy',
    title: 'Through the Fire',
    message: Object.freeze([`${worldName || 'A hostile world'} let you in — few explorers ever stand here.`]),
  });
}

/** The notice of a wave-off that cost `damage` health; `nextSuccessPercent` is the next attempt's odds. */
export function waveOffNotice(damage: number, nextSuccessPercent: number): DescentNotice {
  const scrape: DescentCopyPart[] = damage > 0 ? [' with a scrape — ', Object.freeze({ icon: 'blood' }), ` −${damage} HP`] : [];
  return Object.freeze({
    icon: 'landing',
    title: 'Wave-off',
    message: Object.freeze([
      'The descent went sour and you pulled back to orbit', ...scrape,
      `. The approach is learned now: next attempt ${nextSuccessPercent}%.`,
    ]),
  });
}
