/** D55 (Dakk 2026-11-04, "Library check profile"): the roster of the per-creature battle battery (the arena suite and the matchup
 * stagings — the loops whose cost grows with every delivered creature).
 * - `CF_V2_LIBRARY_ROSTER=all` (the `library` check profile, `tools/library-battery.mjs`; run for every delivery batch and inside
 *   `production`): EVERY archetype, with time budgets scaled by roster size.
 * - otherwise (dev / develop): every hand-listed archetype plus the first archetype of each body family (the D52 representatives),
 *   so every body family is exercised on every run while the everyday gate stays bounded as the library grows.
 * Nothing is skipped: a creature reaches the game only after the library profile ran the whole battery over it. Registry and
 * integrity checks (every archetype has its assets, pins, tint…) keep iterating the full lists everywhere. */
import { readFileSync } from 'node:fs';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';

const DELIVERED = new Set((JSON.parse(readFileSync(new URL('../../../tools/morph/delivered-archetypes.json', import.meta.url), 'utf8')) as { rows: { earthName: string }[] }).rows.map((r) => r.earthName));
/** The first archetype of each body family, in registry order (the same rule as MATCHUP_FAMILY_REPRESENTATIVES). */
const REPRESENTATIVES = (() => { const seen = new Set<string>(), out = new Set<string>(); for (const f of BATTLE2_PARTS_FITS) if (!seen.has(f.bodyFamily)) { seen.add(f.bodyFamily); out.add(f.earthName); } return out; })();

/** The roster's names for a mode (pure, so both modes are testable in one process). */
export function rosterNamesV1(all: boolean): ReadonlySet<string> {
  return new Set(CARD_ARCHETYPES.map((a) => a.earthName).filter((n) => all || !DELIVERED.has(n) || REPRESENTATIVES.has(n)));
}
export const LIBRARY_ROSTER = process.env.CF_V2_LIBRARY_ROSTER === 'all';
export const ROSTER_NAMES = rosterNamesV1(LIBRARY_ROSTER);
export const ROSTER_ARCHETYPES = CARD_ARCHETYPES.filter((a) => ROSTER_NAMES.has(a.earthName));
const EVERYDAY = rosterNamesV1(false).size;
/** A loop's time budget, written for the everyday roster; the library run scales it by the roster ratio (never below it). */
export const rosterBudget = (ms: number): number => (LIBRARY_ROSTER ? Math.ceil(ms * Math.max(1, CARD_ARCHETYPES.length / EVERYDAY)) : ms);
