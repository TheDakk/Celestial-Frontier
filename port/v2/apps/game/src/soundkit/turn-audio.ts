/* Turn audio sink: the bridge from battle2's TurnCuePlayer to the existing audio runtime. Every cue the
   player fires becomes one derived-voice request (buffer source → gain) through the kit's mix policy
   and the runtime's own admission (cooldown, concurrency, budgets), so the arena never bypasses the
   audio authority. Ability and battle cues render through the ORIGINAL combat set (`original-combat.ts`; a theme without an original
   set yet falls back to the labelled placeholder and flags it); creature
   cues come from the caller's voice hook (A4 derivation) or are skipped with a reason. Synthesis is
   cached per (cueId, amount), and results are kept in a bounded log for the study status and tests. */
import type { AudioVoiceRequest, AudioVoiceStartResult } from '@cf/audio';
import type { CueSink, TurnCue } from '../battle2/cue-plan.js';
import { createDerivedVoiceRequest } from './browser-adapter.js';
import { parseCueId } from './cues.js';
import { planCues, type MixOptions } from './mix.js';
import type { SynthCue } from './battle-synth.js';
import { renderCombatCueV1 } from './original-combat.js';

export interface TurnAudioRuntime { playVoice(request: AudioVoiceRequest): AudioVoiceStartResult; }
export interface TurnAudioEntry { readonly cueId: string; readonly source: TurnCue['source']; readonly atMs: number; readonly lateMs: number; readonly result: string; }
export interface TurnCueSink extends CueSink {
  readonly log: readonly TurnAudioEntry[];
  /** Number of synthesized buffers held (one per distinct cueId/amount). */
  cached(): number;
}
export interface TurnAudioOptions extends MixOptions {
  readonly runtime: TurnAudioRuntime;
  readonly seed: number;
  /** Creature cue voice per side (A4 derived cue); null = skip with a reason. */
  readonly creatureVoice?: (cue: TurnCue) => Pick<SynthCue, 'samples' | 'sampleRate'> | null;
  readonly synthesize?: (cueId: string, seed: number, options: { readonly amount?: number }) => Pick<SynthCue, 'samples' | 'sampleRate'>;
  readonly gain?: number;
  readonly logLimit?: number;
}

export function createTurnCueSink(options: TurnAudioOptions): TurnCueSink {
  const synth = options.synthesize ?? renderCombatCueV1, cache = new Map<string, Pick<SynthCue, 'samples' | 'sampleRate'>>(), log: TurnAudioEntry[] = [], limit = options.logLimit ?? 64;
  const record = (cue: TurnCue, lateMs: number, result: string): void => { log.push(Object.freeze({ cueId: cue.cueId, source: cue.source, atMs: cue.atMs, lateMs, result })); if (log.length > limit) log.splice(0, log.length - limit); };
  const sink: TurnCueSink = {
    log,
    cached: () => cache.size,
    play(cue, lateMs) {
      const parsed = parseCueId(cue.cueId);
      if (!parsed) { record(cue, lateMs, 'refused: outside the closed vocabulary'); return; }
      let derived: Pick<SynthCue, 'samples' | 'sampleRate'> | null;
      if (parsed.group === 'creature') { derived = options.creatureVoice?.(cue) ?? null; if (!derived) { record(cue, lateMs, 'skipped: no creature voice for this side'); return; } }
      else {
        const key = `${cue.cueId}:${cue.amount ?? 0}`;
        derived = cache.get(key) ?? null;
        if (!derived) { derived = synth(cue.cueId, options.seed, cue.amount !== undefined ? { amount: cue.amount } : {}); cache.set(key, derived); }
      }
      const intent = planCues([cue.cueId], { ...(options.phone !== undefined ? { phone: options.phone } : {}) }).admitted[0];
      if (!intent) { record(cue, lateMs, 'dropped: mix policy'); return; }
      const request = createDerivedVoiceRequest(intent, derived, { kind: 'decorative' }, options.gain ?? 1);
      let result: AudioVoiceStartResult;
      try { result = options.runtime.playVoice(request); } catch (error) { record(cue, lateMs, `error: ${error instanceof Error ? error.message : String(error)}`); return; }
      record(cue, lateMs, result.kind === 'started' ? 'started' : `${result.kind}: ${'reason' in result ? String(result.reason) : ''}`.trim());
    },
  };
  return sink;
}
