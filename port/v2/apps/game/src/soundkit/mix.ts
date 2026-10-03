/* Sound Kit section 5: cue ids -> existing runtime categories, priorities and
   concurrency, and a plan function that admits or drops intents in priority
   order. Types come from the audio package and are never modified here. */
import {
  AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1, createAudioVoiceMixIntentV1,
  type AudioCategory, type AudioVoiceMixIntentV1, type AudioVoiceRequest,
} from '@cf/audio';
import { assertCueId, type ParsedCue } from './cues.js';

export type MixSlot = 'impact' | 'effect' | 'creature' | 'ui' | 'ambience' | 'music';
export interface MixPolicy {
  readonly slot: MixSlot;
  readonly category: AudioCategory;
  readonly priority: number;
  readonly concurrencyGroup: string;
  readonly maxConcurrent: number;
  readonly mixIntent: AudioVoiceMixIntentV1;
  readonly cooldownMs: number;
}

/** Combat foreground ducks music and ambience to 0.75, as the runtime's own combat voices do. */
const FOREGROUND_DUCK = createAudioVoiceMixIntentV1(Object.freeze({
  music: 0.75, ambience: 0.75, creature: 1, 'combat-gameplay': 1, ui: 1,
}));

const SLOT_POLICY: Readonly<Record<MixSlot, Omit<MixPolicy, 'slot'>>> = Object.freeze({
  impact: { category: 'combat-gameplay', priority: 100, concurrencyGroup: 'soundkit:impact', maxConcurrent: 1, mixIntent: FOREGROUND_DUCK, cooldownMs: 40 },
  effect: { category: 'combat-gameplay', priority: 80, concurrencyGroup: 'soundkit:effect', maxConcurrent: 2, mixIntent: FOREGROUND_DUCK, cooldownMs: 40 },
  creature: { category: 'creature', priority: 60, concurrencyGroup: 'soundkit:creature', maxConcurrent: 2, mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1, cooldownMs: 80 },
  ui: { category: 'ui', priority: 40, concurrencyGroup: 'soundkit:ui', maxConcurrent: 2, mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1, cooldownMs: 30 },
  ambience: { category: 'ambience', priority: 20, concurrencyGroup: 'soundkit:ambience', maxConcurrent: 3, mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1, cooldownMs: 0 },
  music: { category: 'music', priority: 10, concurrencyGroup: 'soundkit:music', maxConcurrent: 1, mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1, cooldownMs: 0 },
});

export function slotOf(cue: ParsedCue): MixSlot {
  if (cue.impact) return 'impact';
  switch (cue.group) {
    case 'creature': return 'creature';
    case 'ability': case 'battle': case 'space': case 'economy': return 'effect';
    case 'ui': return 'ui';
    case 'ambience': return 'ambience';
    case 'music': return 'music';
  }
}

export interface MixOptions { readonly phone?: boolean }

export function mixPolicyFor(cueId: string, options?: MixOptions): MixPolicy {
  const cue = assertCueId(cueId);
  const slot = slotOf(cue);
  const base = SLOT_POLICY[slot];
  /* one bed plus two layers; phones keep the identical mix with half the layers */
  const maxConcurrent = slot === 'ambience' && options?.phone === true ? 2 : base.maxConcurrent;
  return Object.freeze({ slot, ...base, maxConcurrent });
}

/** An intent the runtime can start once a graph factory is attached. */
export type SoundKitVoiceIntent = Omit<AudioVoiceRequest, 'create' | 'meaning'> & { readonly cueId: string };
export interface MixPlan {
  readonly admitted: readonly SoundKitVoiceIntent[];
  readonly dropped: readonly Readonly<{ cueId: string; reason: string }>[];
}

/** Admit intents by priority (ties keep request order); over-concurrency cues
 * are dropped, never delayed into a wrong beat. */
export function planCues(
  cueIds: readonly string[],
  options?: MixOptions & { readonly maxDurationMs?: Readonly<Record<string, number>> },
): MixPlan {
  const rows = cueIds.map((cueId, ordinal) => ({ cueId, ordinal, policy: mixPolicyFor(cueId, options) }));
  rows.sort((l, r) => r.policy.priority - l.policy.priority || l.ordinal - r.ordinal);
  const counts = new Map<string, number>();
  const admitted: SoundKitVoiceIntent[] = [];
  const dropped: Array<{ cueId: string; reason: string }> = [];
  for (const row of rows) {
    const { policy, cueId } = row;
    const n = counts.get(policy.concurrencyGroup) ?? 0;
    if (n >= policy.maxConcurrent) { dropped.push({ cueId, reason: `concurrency:${policy.slot}` }); continue; }
    counts.set(policy.concurrencyGroup, n + 1);
    const maxDurationMs = options?.maxDurationMs?.[cueId];
    admitted.push(Object.freeze({
      cueId, key: `soundkit:${cueId}`, category: policy.category, priority: policy.priority,
      cooldownGroup: `soundkit:${cueId}`, cooldownMs: policy.cooldownMs, concurrencyGroup: policy.concurrencyGroup,
      maxConcurrent: policy.maxConcurrent, nodeCount: 2, mixIntent: policy.mixIntent,
      ...(maxDurationMs !== undefined ? { maxDurationMs } : {}),
    }));
  }
  return Object.freeze({ admitted: Object.freeze(admitted), dropped: Object.freeze(dropped) });
}
