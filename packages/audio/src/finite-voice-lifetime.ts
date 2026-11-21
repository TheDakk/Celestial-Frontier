/** Cleanup allowance after the already-authored final source stop. This does
 * not alter an envelope, mix, cooldown, or source schedule; natural onended
 * still owns ordinary completion. The deadline only bounds a lost callback. */
const SOURCE_COMPLETION_TAIL_MS = 250;

export function finiteVoiceMaxDurationMs(scheduledSeconds: number): number {
  return Math.ceil(scheduledSeconds * 1_000) + SOURCE_COMPLETION_TAIL_MS;
}
