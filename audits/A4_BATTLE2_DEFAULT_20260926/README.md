# A4: the painted battle stage becomes the default (2026-09-26)

Nick (2026-09-26): "finish everything on your side, don't wait on me, we'll play test after". That lifts D6's wait for the iPhone probe
for development builds. A production release stays gated by Codex's I5 v2 certificate; the constant below is not that gate.

## What changed
- **`port/v2/apps/game/src/battle2-gate.ts` (new, dependency-free)** holds `BATTLE2_DEFAULT = true` and `battle2On(search)`:
  - `?battle2=1` forces the stage on;
  - `?battle2=0` opts out to the Chronicle-only path;
  - anything else follows the constant. Flip the constant to `false` to make the stage opt-in again.
- **`main.ts`** imports only that tiny module statically.
  - The Chronicle pacer and the one dynamic import line (`if (battle2On(location.search)) void import('./battle2-wiring.js')…`, still a static-string import) both use it.
  - The import stays inside `presentCommittedCombatChronicle`, so boot never loads the stage.
  - Every safeguard is unchanged: reduced motion and device tier; the Chronicle is the accessible owner; a failure releases the pacer and leaves the Chronicle; the stage never changes HP or rewards; the `{ removeView: true, releaseGlobalResources: false }` teardown.
- **`battle2-wiring.ts`:** `battle2Enabled` is now exactly `battle2On`, and `BATTLE2_FLAG` is re-exported from the gate.
- **The matchup picker is unchanged:** it stays behind `?battle2=1&vs=…`.

## Tests (`apps/game/src/battle2-wiring.test.ts`)
- **Gate contract.** Exactly one `if (battle2On(location.search))` line carries the dynamic import. That line sits inside `presentCommittedCombatChronicle`, so it is never on the boot path. There is no static import of the wiring or of `battle2/`. The gate module has no imports.
- **A4 defaults.** The stage is on by default; `?battle2=0` turns it off and `?battle2=1` turns it on. The picker line keeps `get('battle2') === '1'` and `get('vs') !== null`. `battle2Enabled` equals `battle2On` for every query shape tested.
- **The default path mounts the stage:** an empty query builds and plays the stage. The opt-out path (`?battle2=0`) does no work at all.
- **Mutation controls (all fail as they should):**
  - a static import;
  - an ungated dynamic import;
  - the import-line gate replaced by `true`;
  - the gated line hoisted to top level (the boot path);
  - the gate module evaluated with the default flipped off;
  - by hand: the old `get('battle2') === '1'` gate restored in main.ts (2 gate tests fail), and `BATTLE2_DEFAULT = false` (3 tests fail).

## Also corrected
`COMBAT_AND_CONQUEST.md` still said a lone Balanced Auto fighter meets no phase. That has been out of date since the D17 fix (`832dc18b`), and it now says so.

## For the parent
The real-browser picker/duel smoke was not run in this worktree. Please run `picker-smoke --sw-control --duel` on a package from the merged head (it opts into `?battle2=1` explicitly, so it is unaffected). Also check one plain Guardian fight **without** any query flag on the dev URL, which is the new default path.

## Proposed release bullet (for Codex's batched C17/D19 re-measure; the sealed inventory was not edited)
- **UI Enhancements:** "⚔️ PAINTED BATTLES BY DEFAULT — every fight now plays out on the painted battle stage, with each creature's own painted art and motion, above the Combat Chronicle. Add `?battle2=0` to the address to watch the Chronicle alone."
