/* MAIN-3 — one canonical world roster, one bounded presentation window.

   The eight-row Planetside strip is a UI budget, never a data authority.
   Capture, biosphere yield, distant ecology, and future ownership actions must
   target `all`; only the current thumbnail strip consumes `preview`. */
export const PLANETSIDE_PREVIEW_LIMIT = 8;

export interface WorldRosterView<T> {
  readonly all: readonly T[];
  readonly preview: readonly T[];
  readonly total: number;
  readonly hiddenFromPreview: number;
}

export function worldRosterView<T>(rows: readonly T[]): WorldRosterView<T> {
  if (!Array.isArray(rows)) throw new TypeError('world roster must be an array');
  const all = Object.freeze([...rows]);
  const preview = Object.freeze(all.slice(0, PLANETSIDE_PREVIEW_LIMIT));
  return Object.freeze({
    all,
    preview,
    total: all.length,
    hiddenFromPreview: Math.max(0, all.length - preview.length),
  });
}
