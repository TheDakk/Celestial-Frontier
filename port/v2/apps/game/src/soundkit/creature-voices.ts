/* Per-combatant creature voices for the turn cues (batch 3, B5). One voice card per side, compiled
   from that side's anatomy record (or a minimal template record when only a genome exists), then each
   `creature:<cue>` id the turn plan fires is derived through the A4 engine from the source library and
   cached. A side with neither record nor genome (the player placeholder) has no voice and is skipped
   with a reason by the sink. The source library is injected: today the labelled placeholder archetype,
   tomorrow the C3 recordings, same call. Deterministic per (side seed, cue). */
import type { TurnCue } from '../battle2/cue-plan.js';
import type { RenderedCue } from './browser-adapter.js';
import { CREATURE_CUES, parseCueId } from './cues.js';
import { deriveCue, type SourceLibrary } from './derive.js';
import { compileVoiceCard, type AnatomyRecordLike, type SystemCardLike, type VoiceCard } from './voice-card.js';

export interface CreatureVoiceSide {
  readonly record: AnatomyRecordLike | null;
  /** The combatant's genome (fauna); a record without a genome still compiles (size defaults to medium). */
  readonly genome: Readonly<Record<string, unknown>> | null;
  readonly seed: number;
  readonly label: string;
}
export interface CreatureVoiceOptions {
  readonly sides: Readonly<{ left: CreatureVoiceSide; right: CreatureVoiceSide }>;
  readonly sources: SourceLibrary;
  readonly systemCard?: SystemCardLike | null;
  readonly seed: number;
}
export interface CreatureVoiceStatus { readonly left: string; readonly right: string; }
export interface CreatureVoiceHook {
  (cue: TurnCue): RenderedCue | null;
  readonly cards: Readonly<{ left: VoiceCard | null; right: VoiceCard | null }>;
  readonly status: CreatureVoiceStatus;
  cached(): number;
}

/** A record for a genome-only combatant: the quadruped archetype until a painter record names the family. */
export function genomeOnlyRecord(genome: Readonly<Record<string, unknown>>, seed: number): AnatomyRecordLike {
  return { template: { id: 'quadruped' }, identity: { seed, speciesVisualKey: `genome:${seed >>> 0}` } };
}

export function createCreatureVoiceHook(options: CreatureVoiceOptions): CreatureVoiceHook {
  const compile = (side: CreatureVoiceSide): { card: VoiceCard | null; status: string } => {
    const record = side.record ?? (side.genome ? genomeOnlyRecord(side.genome, side.seed) : null);
    if (!record) return { card: null, status: `${side.label}: no voice (no record and no genome)` };
    const result = compileVoiceCard(record, (side.genome ?? null) as Parameters<typeof compileVoiceCard>[1], options.systemCard ?? null);
    if (!result.ok) return { card: null, status: `${side.label}: no voice (${result.reason})` };
    return { card: result.card, status: `${side.label}: ${result.card.archetype} voice, ${result.card.material}, ${result.card.pitchSemitones >= 0 ? '+' : ''}${result.card.pitchSemitones.toFixed(1)} st${result.card.flags.length ? ` (${result.card.flags.join(', ')})` : ''}` };
  };
  const left = compile(options.sides.left), right = compile(options.sides.right);
  const cache = new Map<string, RenderedCue>();
  const hook = ((cue: TurnCue): RenderedCue | null => {
    const parsed = parseCueId(cue.cueId);
    if (!parsed || parsed.group !== 'creature' || !(CREATURE_CUES as readonly string[]).includes(parsed.key)) return null;
    if (cue.source !== 'left' && cue.source !== 'right') return null;
    const card = cue.source === 'left' ? left.card : right.card;
    if (!card) return null;
    const key = `${cue.source}:${parsed.key}`;
    const hit = cache.get(key); if (hit) return hit;
    const derived = deriveCue(card, parsed.key, options.sources, (options.seed ^ options.sides[cue.source].seed) >>> 0);
    cache.set(key, derived);
    return derived;
  }) as CreatureVoiceHook;
  Object.defineProperties(hook, {
    cards: { value: Object.freeze({ left: left.card, right: right.card }), enumerable: true },
    status: { value: Object.freeze({ left: left.status, right: right.status }), enumerable: true },
    cached: { value: () => cache.size, enumerable: true },
  });
  return hook;
}
