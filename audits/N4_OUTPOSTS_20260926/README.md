# D14 Outposts — P1–P5 (Claude, 2026-09-26)

Nick decided D14 "yes" (`audits/PROPOSALS_20260925/N4_PROJECTS.md`, Option A), and asked for the full vision as fast as possible. So the
build uses Claude's starting numbers. **Codex's P0 cost table replaces `PROJECT_COSTS_V1`** (one table,
`port/v2/packages/persistence/src/outposts.ts`). The first wave is Survey Relay, Field Shelter and Companion Sanctuary.

| Stage | Commit | What landed |
|---|---|---|
| P1 | `bf2e4514` | Pure domain `outposts.ts`: definitions, one cost table, site eligibility, all-or-nothing stages, deeds counted only since the stage opened, full-refund abandon, sanctuary residents, board/world-offer projections, finished-only consumers. 9 tests, each rule both ways. |
| P2 | `e6ce907e` | `arc9.projects` v1 carrier (player segment). Absent ⇒ empty (old saves unchanged); a strict canonical codec (malformed / future / wrong-segment ⇒ PROTECTED); byte-exact portable export round trip. 3 tests. |
| P3 | `4b738f99` | The action owners (`outposts-action.ts`, operation `outpost-project`): one deterministic F4 receipt each for start / build / abandon / residents. Parts are spent on the Arc 2 carrier with its legacy mirror in step. Real-runtime test with mutation controls. |
| P4 | `efd35b12` | UI (`outposts-ui.ts` + a Main block before `const sideEl`): the world card's Outposts section, the Projects board beside the Charters, portrait marks, the Sanctuary picker, the Museum's fifth "Outposts" gallery. Outcome test runs the exact Main section. |
| P5 | `639f9723` | Consumers: the Relay's star-card readout (equal to the in-orbit Deep Scanner row), the Shelter's hazard-free Discover Life (safe reason `shelter`), the Sanctuary residents on the card. |
| — | this commit | Test-slice fixes (the Command slice now ends at its own block; the `runtime-hardening` env gets the two Main-local names) + this README. |

## Design calls (reversible, stated in one line each)
- **Deeds read counters, not new event joins.** The "deed joins on the existing owners" are the counters those owners already write
  (`stats.landings`, the `landed` set, companions' `fed`), compared with a baseline recorded when the stage opened. The rule is the
  same: only deeds after opening count. The Landing, Mine, Bioscan and Feed transactions are unchanged, so no other receipt or pin moved.
- **"Land here again"** is proven by `stats.landings` rising since the stage opened AND the build being pressed while standing on the
  site (surface mode).
- **"Feed your companions twice"** counts the companions' summed `fed` gain (a disliked meal adds 0; a loved meal can add 2).
- **The Relay's reward** is the star card listing every lifeless world's orbit readout (the orbit reveal already covers worlds
  inside the system, so "without a visit" means from the galaxy view).
- **Portrait marks** show beside the card's Outposts title (the finished outposts' icons). No render or portrait art changed.
- **Abandon** is allowed on finished outposts too (full refund; nothing was paid out). It needs a second, confirming press.

## Guide text (proposed; Codex's Guide/release inventory is sealed, so it lands with the C17/D19 re-measure)
> **Outposts.** After you honour "A working component", open any world you have landed on and choose **Build here**. An outpost has three
> stages; each spends parts and Stardust at once, and some also ask for one deed done after that stage opened. A finished outpost stays
> forever, with no upkeep, and adds its mark to the world and an exhibit to the Museum. Two can be under construction at a time, 24 in
> all. Abandoning refunds every built stage.
> - 📡 **Survey Relay** (needs Deep Scanners; one per system): the star's card shows every lifeless world's mineral readout.
> - ⛺ **Field Shelter** (a landed fauna world you have not conquered): Discover Life there is hazard-free.
> - 🌿 **Companion Sanctuary** (a conquered world): up to six companions of your choice appear on the world's card.

## Proposed release bullet (New Features & Systems)
> 🏗 OUTPOSTS — Build a Survey Relay, a Field Shelter or a Companion Sanctuary on a world you chose: three stages each, paid in parts and
> Stardust, with no timers or upkeep. Finished outposts change their world for good and join the Museum.

## For Codex
- **P0:** replace `PROJECT_COSTS_V1` with your cost table and scenario runs (expected / minimum / maximum), with acceptance bands.
- **P6:** Slice/Glass instrument coverage for the Outposts flows. The world card and the Charters panel each gained a section.
- The world card's height grows by the Outposts section once projects are open. Re-check any card-capacity measurement.

## Checks
- **Develop profile:** 5,483 pass. The only reds are I5 and Codex's `slicesmoke-sixth-red-contract` release SHA.
- **Run by hand:** root `tsc --noEmit --noUnusedLocals`, app and worker tsc: 0 errors; artaudit, overridecheck and speccheck exit 0.
- `rarity-main-wiring` once timed out at 5 s under the parallel profile. It passed alone and on the rerun; it was not touched here.
