/* The words for the active play left before the weekly board turns
   (ported from SOURCE apps/game/src/weekly-charters.ts:5-8). Pure: the input is
   the expedition's own active-play milliseconds, never a date. */
export function formatActivePlayRemainingV1(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(minutes / 60), m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
