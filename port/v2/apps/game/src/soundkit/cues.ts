/* Sound Kit section 4: the closed cue vocabulary as typed ids.
   Fixed groups are enumerated; the seeded ambience/space families whose key
   spaces live in other owners (43 biome beds, 29 weather layers, 25 hazard
   accents, 13 star kinds) are structural ids validated by prefix + key shape. */

export const CREATURE_CUES = Object.freeze([
  'call', 'alert', 'attack-vocal', 'hurt', 'faint', 'victory', 'breath-idle',
  'footfall-set', 'land-thud', 'tame-settle', 'feed-chew',
] as const);
export type CreatureCueId = typeof CREATURE_CUES[number];

export const ABILITY_THEMES = Object.freeze([
  'fire', 'frost', 'storm', 'tide', 'stone', 'venom', 'void', 'sand', 'chem', 'psionic', 'wild',
] as const);
export type AbilityTheme = typeof ABILITY_THEMES[number];
export const ABILITY_PHASES = Object.freeze(['launch', 'travel', 'impact'] as const);
export type AbilityPhase = typeof ABILITY_PHASES[number];

export const BATTLE_CUES = Object.freeze([
  'turn-ready', 'cursor', 'confirm', 'cancel', 'approach-start', 'hitstop-thump',
  'flash-sting', 'shake-rumble', 'damage-tick', 'miss-whiff', 'dodge-swish', 'faint-fall',
  'victory-sting', 'defeat-sting', 'battle-start', 'battle-end',
] as const);
export const SPACE_CUES = Object.freeze([
  'planet-approach', 'orbit-enter', 'warp-charge', 'jump', 'arrive', 'comet-pass', 'belt-rattle',
  'engine:scout', 'engine:jump', 'engine:survey-cruiser', 'engine:frontier',
  'dock', 'undock', 'shipyard-build', 'upgrade-fit',
] as const);
export const ECONOMY_CUES = Object.freeze([
  'landfall-touchdown', 'survey-ping', 'capture-start', 'capture-success', 'breed-hatch', 'feed',
  'harvest', 'craft-complete', 'inventory-move', 'sell',
] as const);
export const LOOT_MATERIALS = Object.freeze([
  'wood', 'stone', 'metal', 'crystal', 'cloth', 'organic', 'tech', 'relic',
] as const);
export const UI_CUES = Object.freeze(['tap', 'open', 'close', 'toggle', 'error'] as const);
export const MUSIC_CUES = Object.freeze([
  'exploration-bed', 'battle-theme', 'victory-fanfare', 'defeat', 'shipyard', 'title',
] as const);
export const AMBIENCE_LAYERS = Object.freeze([
  'bed', 'weather', 'water', 'hazard', 'time', 'star', 'distant-call',
] as const);

export type CueGroup = 'creature' | 'ability' | 'battle' | 'ambience' | 'space' | 'economy' | 'ui' | 'music';
export interface ParsedCue {
  readonly id: string;
  readonly group: CueGroup;
  /** impact-class cues stack on the single impact slot (section 5). */
  readonly impact: boolean;
  readonly key: string;
}

const KEY = /^[a-z0-9][a-z0-9-]{0,63}$/u;
const has = (list: readonly string[], v: string): boolean => list.includes(v);

/** Parse a cue id; null when it is outside the closed vocabulary. */
export function parseCueId(id: string): ParsedCue | null {
  if (typeof id !== 'string' || id.length === 0 || id.length > 96) return null;
  const parts = id.split(':');
  const [group = '', a = '', b = '', c = ''] = parts;
  const out = (g: CueGroup, key: string, impact = false): ParsedCue => Object.freeze({ id, group: g, impact, key });
  switch (group) {
    case 'creature': return parts.length === 2 && has(CREATURE_CUES, a) ? out('creature', a, a === 'land-thud') : null;
    case 'ability': return parts.length === 3 && has(ABILITY_THEMES, a) && has(ABILITY_PHASES, b)
      ? out('ability', `${a}:${b}`, b === 'impact') : null;
    case 'battle': return parts.length === 2 && has(BATTLE_CUES, a) ? out('battle', a, a === 'hitstop-thump') : null;
    case 'ambience': {
      if (parts.length !== 3 || !has(AMBIENCE_LAYERS, a) || !KEY.test(b)) return null;
      if (a === 'water' && !has(['liquid', 'frozen', 'none'], b)) return null;
      if (a === 'time' && !has(['day', 'twilight', 'night'], b)) return null;
      return out('ambience', `${a}:${b}`);
    }
    case 'space': {
      if (parts.length === 3 && a === 'star-hum' && KEY.test(b)) return out('space', `star-hum:${b}`);
      const key = parts.length === 3 ? `${a}:${b}` : a;
      return (parts.length === 2 || parts.length === 3) && has(SPACE_CUES, key) ? out('space', key) : null;
    }
    case 'economy': {
      if (parts.length === 3 && a === 'discovery-sting' && /^tier-(?:[1-9]|10)$/u.test(b)) return out('economy', `${a}:${b}`);
      if (parts.length === 4 && a === 'loot-pickup' && has(LOOT_MATERIALS, b) && /^tier-(?:[1-9]|10)$/u.test(c)) {
        return out('economy', `${a}:${b}:${c}`);
      }
      return parts.length === 2 && has(ECONOMY_CUES, a) ? out('economy', a) : null;
    }
    case 'ui': return parts.length === 2 && has(UI_CUES, a) ? out('ui', a) : null;
    case 'music': {
      if (parts.length === 3 && a === 'landfall-theme' && KEY.test(b)) return out('music', `${a}:${b}`);
      return parts.length === 2 && has(MUSIC_CUES, a) ? out('music', a) : null;
    }
    default: return null;
  }
}

export function isCueId(id: string): boolean { return parseCueId(id) !== null; }

export function assertCueId(id: string): ParsedCue {
  const parsed = parseCueId(id);
  if (parsed === null) throw new RangeError(`sound kit cue id is outside the closed vocabulary: ${String(id)}`);
  return parsed;
}

export function creatureCueId(cue: CreatureCueId): string { return `creature:${cue}`; }
