# N4 — Projects (Arc 9 long-horizon goals): proposal with a recommended default

Claude, 2026-09-25. Written for the completion ledger's N4 row
(`audits/OPERATING_MODEL_20260925/COMPLETION_LEDGER.md:30`). Writing only: no code, no other file changed.
Nick answers in one line at the end.

## 1. What exists today

**The plan already says what a project is.** Four documents describe the same thing, and none of them
has been built:

- `port/V2_PROGRAM_ROADMAP.md:2975-2979` (Arc 9B): "optional finite frontier projects/outposts … Projects
  have visible inputs/outcomes and no decay, forced maintenance, idle income, or social pressure." Line 178
  lists "projects" among the open Arc 9–10 items.
- `QUESTS_AND_CHAPTERS.md:526-535`: world projects (scanner relay, field lab, shelter, cargo beacon,
  observatory) are finite, player-chosen builds tied to one canonical world and a receipt, with a visible
  finished state and a specific reach/access/efficiency/expression purpose. They are "never used as
  filler Charter goals".
- `ECONOMY_LOOT_CRAFTING.md:413-415, 427-437`: projects are a materials sink with "no passive income, decay,
  daily upkeep or unattended resource production"; state lives in the same revision-checked save and
  receipt discipline as crafting and cannot pay twice across tabs or reloads.
- `PROGRESSION.md:749-751`: an optional Outpost layer with "a before/after world projection and no
  offline-maintenance or mandatory-income treadmill".

**Nick's standing resolutions that bind this design** (`port/DECISIONS.md`): #7 (line 202) progression is
capability-building, Minecraft-like: gather, build, reach somewhere new. #8 (line 209) no paid or hidden
random rewards, no expiring rewards. #13 (line 258) no streak decay, FOMO, punishment for a break, expiring
missions or attendance pressure. #10 and #16 (lines 231, 303) any timer runs on the persisted active-play
clock. D8 (`audits/MAILBOX/DECISIONS.md:14`): a Charter "week" is 4 hours of active play.

**What projects must sit beside without duplicating:**

| System | Source | Shape | Reward scale |
|---|---|---|---|
| Starter Charters | `port/v2/apps/game/src/starter-charters.ts:48-140` | 10 one-time deeds in two chains, accept first, 3 active slots | 10–25 Stardust, some starter gear |
| Weekly Charters | `port/v2/apps/game/src/weekly-charters.ts:17-35` | 3 deeds per 4 h active-play cycle, counted after accept | 20–25 Stardust each |
| Achievements | `arc9-progression-projection.ts`; 96-row manifest, 26 event joins | Fixed milestones on counters/events; rank ladder | Rank and nameplate; rewards are ledger item A2 |
| Binder Sets / Paragons | `port/v2/apps/game/src/binder-sets.ts:126-169` | Collection claims, once each | 25–150 Stardust; 120 for ten Paragons |
| Research / Fabricator | `port/v2/packages/domain/loot/src/catalogue.ts:153-175` | Parts → components → systems/gear | T3 systems cost 30–150 Stardust plus parts |
| Chronicle & Museum | `port/v2/apps/game/src/expedition-chronicle.ts:23` | Four read-only galleries, 60 rows each | None (read-only) |

So Charters cover short deeds, achievements cover milestones, the Binder covers collections, and the
Fabricator covers gear for the ship and explorer. **The one thing nothing covers is building something
on a world you chose that stays there.** That is where projects fit.

**Plumbing that already exists and can be reused:** every claim settles through
`F4RuntimeAuthority.commitAction` (`f4-runtime-authority.ts:244`) with one receipt, a witness hash and a
revision check. `binder-sets.ts:455-530` is the pattern: re-derive inside the transaction, refuse if
already done, write, hash the facts. The weekly board's `stageWeeklyCharterEventV1` (`weekly-charters.ts`)
shows how to count "deeds done after you started" inside the existing Landing, Mine and Bioscan
transactions. New save data can live in a versioned v5 extension namespace
(`packages/persistence/src/migration-v5.ts:41-60`, 256 KiB per namespace). If the namespace is missing,
the player simply has no projects. The v4 codec stays as it is and no migration is needed. The bioscan
hazard already has a named safe case for settled worlds (`bioscan-hazard.ts:101, 120, 136`) that a Shelter
can extend.

## 2. Decisions Nick must make

1. **Shape.** Should projects be buildings on worlds (what the plan describes), long goals across the whole
   save ("chart 50 worlds"), or both?
2. **Reward kind.** Should a project pay a capability or keepsake only, or also pay Stardust?
3. **Time.** Should a stage build as soon as its inputs are delivered, or also need some active play to build?
4. **Limits.** How many projects can be under construction at once, and how many can be built in total?
5. **First set.** Which projects ship first?

## 3. Options

### Option A — "Outposts": world-bound three-stage builds, capability or keepsake reward, no timers

The player opens an outpost site on a world they have landed on, from that world's card. The site shows all
three stages up front. Each stage lists the parts, elements and Stardust it needs from the existing
Fabricator catalogue, plus sometimes one deed at that world or in its system (for example "land on two
other worlds in this system"). **Build stage** spends the inputs in one receipt, like crafting. The last
stage switches on a permanent effect limited to that world or its system, adds a mark to the world's
portrait (the plan's "before/after"), and adds a Museum exhibit.

- *Player experience:* this is the Minecraft fantasy the plan promises: pick a place, gather for it, build
  it, and see it change. It gives a reason to go back to a favourite world. You never have to maintain it
  and never lose it.
- *Engineering:* medium. One pure domain module, one v5 namespace, three action owners (start, build stage,
  abandon), deed counting in three existing transactions, one board plus world-card controls, one Museum
  gallery. No RNG draws at all.
- *Economy:* a pure **sink**. Each project costs about as much as one T3 system (parts plus 20–30 Stardust).
  It adds no faucet, so the weekly and Binder numbers stay as they are.
- *Risk:* low. The main risk is a capability that quietly overlaps an existing owner. The first set below is
  chosen so that each one extends exactly one named existing rule.

### Option B — "Expedition Ledger": save-wide long goals with Stardust tiers

These would be tiered goals like "Chart 25/50/100 worlds" or "Raise 5/10 companions to level 6", each paying
Stardust.

- *Player experience:* familiar and easy to read, but it is a second score wall. The Arc 9 exit test
  (`V2_PROGRAM_ROADMAP.md:2982`) asks that history feel "meaningful rather than a score wall".
- *Engineering:* low, because it reuses counters.
- *Economy:* a new **faucet** that stacks on Weekly, Binder and achievement rewards (A2). Codex would need to
  re-tune all of them.
- *Risk:* high overlap. Most tiers repeat the counter-based rows among the 96 achievements and the rank
  score. It also contradicts the plan's own definition of a project.

### Option C — Outposts plus active-play build clocks and a Stardust commission

This is Option A, plus each stage needs 20, 40 or 60 minutes of active play to finish building. The first
build of each project type also pays a one-time Stardust commission (about 25–40).

- *Player experience:* more anticipation, but it adds "come back when it is done". Even on the active-play
  clock, this edges toward the attendance loop that Decision #13 rules out.
- *Engineering:* medium-high. It needs a second active-play timer consumer (like breeding Recovery), a
  ready/claim step, and timer UI and tests.
- *Economy:* a small faucet, bounded at 6 types × at most 40 = 240 Stardust. Codex has to fit it beside the
  Binder's 535 plus the 120 Paragon claim.
- *Risk:* medium. The claim step is a second place where a double payout could happen.

## 4. Recommended default — Option A, "Outposts"

**Rules**
- **Unlock:** projects open once Starter Charter `st-comp` ("A working component",
  `starter-charters.ts:137`) is honoured. By then the player has fabricated a T2 component and knows the
  parts the projects consume. Before that, projects are invisible and appear in no Guide or objective.
- **Limits:** 2 projects under construction at once, on their own slots separate from the three Charter
  slots. Each type can be built at most once per world. Survey Relay is limited to one per star system. At
  most 24 outposts can be built in total, which keeps the save and the Museum gallery bounded (the gallery
  limit is 60).
- **Inputs:** only existing catalogue parts, elements and Stardust. A stage is all-or-nothing, exactly like
  `craftItem`. There are no partial deliveries to track.
- **Deeds:** a deed counts only if it happens after its stage opens. This is the post-acceptance rule that
  weekly Charters already use, and it prevents credit for past play. Deeds come from existing event
  owners: landfall, mined, bioscan and fed.
- **Reward:** a permanent effect scoped to that world or system, a portrait mark, and one Museum exhibit
  with the world's name and the active-play time it was finished. Projects pay **no Stardust**, add **no
  achievements** (the 96-row manifest is fixed) and add **nothing to rank**. They are not used as Charter
  goals.
- **Abandon:** the player confirms, and every built stage is refunded in full, parts and Stardust. Nothing
  was paid out, so there is nothing to exploit, and a bad pick costs nothing but time (per economy table
  row 413).
- **No timers, decay, upkeep or idle income.** Projects draw no RNG. Sites are keyed to the canonical world
  address.

**First list: six projects, three ship first.** The costs are Claude's starting numbers. Codex owns the
final rates.

| # | Project (site rule) | Stage 1 | Stage 2 | Stage 3 | Reward (existing rule it extends) |
|---|---|---|---|---|---|
| 1 ★ | **Survey Relay** — any world you have landed on; one per star system; needs Deep Scanners researched | 2 Steel Frame, 2 Iron Plate | 1 Nav Core, 2 Optic Lens; deed: land on 2 other worlds in this system | 1 Drive Coil, 1 Power Cell, 20 ✦ | Every world in the system shows the same orbital readout Deep Scanners already gives in orbit, without a visit. It reveals no species names and no hidden presence. It gives no Survey achievement credit; those still need the real Survey. |
| 2 ★ | **Field Shelter** — a landed fauna world you have not conquered | 2 Hull Segment | 1 Cryo Capsule, 1 Servo Rig, 1 Power Cell | 1 Fuel Cell, 25 ✦; deed: land here again | Discover Life on this world is hazard-free, like a settled world (`bioscan-hazard.ts:120`, new safe reason `shelter`). It is not a conquest: no harvest, no settle records, and conquest stays possible. |
| 3 ★ | **Companion Sanctuary** — a world you conquered | 2 Carbon Weave, 2 Steel Frame | 2 Hull Segment, 1 Cryo Capsule | 1 Servo Rig, 2 Cryo Gel, 30 ✦; deed: feed companions twice | You choose up to 6 companions, living or remembered, to appear on the world's card and in a Museum exhibit. Display only: no assignment, no Recovery, no stats, and no bond (bond is N3's call). |
| 4 | **Observatory** — a landed world outside the home galaxy; needs the Long-Range Array | 4 Optic Lens, 1 Steel Frame | 2 Nav Core, 1 Power Cell | 2 Pt, 60 ✦ | Charts that galaxy's quasars, dwarf galaxies and wormholes as Atlas rows. Travel is still reach-checked, and the `quasar`, `dwarfg` and `worm` records still need the real trip. |
| 5 | **Cargo Beacon** — any landed world; at most 3 | 1 Fuel Cell, 1 Nav Core | 1 Power Cell, 2 Aluminium Wire | 15 ✦ | A Companion mission waypoint. **Only if N3 approves missions**; otherwise it is dropped. |
| 6 | **Deep Bore** — a world whose finite vein you mined empty; at most 3 | 2 Servo Rig | 1 Drive Coil, 1 Steel Frame | 1 Fuel Cell, 30 ✦ | One finite deep reserve, hand-mined in normal bursts, that never refills. **Only if Codex's scenario proves** the yield stays below about 1.5× the build's input value. |

**Ships first: 1–3.** Each one extends exactly one existing rule: the orbital readout, the bioscan safe
case, and the Museum. Across the three, the Stardust sink is 75 ✦ in total, a little more than one 4-hour
weekly cycle can pay at most (3 Charters, about 65 ✦). Projects 4–6 come in the second wave, after their
dependencies (N3, Codex rates) are settled.

## 5. Staged engineering plan

Lane law is one owner per deliverable. Claude owns UI and wiring. Codex owns economy rates and instruments.

| Stage | Deliverable | Owner | Done when |
|---|---|---|---|
| P0 | Final cost table for projects 1–3, plus expected, minimum and maximum scenario runs (fresh save, mid-reach, inventory full). Acceptance bands are committed with the table. | **Codex** | No valid path leaves a project impossible to finish. The sink sits inside Codex's bands. |
| P1 | Pure `projects` domain module: definitions, site eligibility, stage staging, deed counting and board projection. No `Date.now`/`Math.random`. Negative controls in both directions. | Claude | Tests prove: past deeds do not count; one type per world; one relay per system; the caps hold; abandon refunds exactly. |
| P2 | v5 extension namespace `arc9.projects` v1 in the `player` segment: codec, bounds, and absent means empty. Export/import round trip. | Claude | An old save with no namespace loads unchanged. A corrupt namespace is refused, not repaired. The size limit is proved. |
| P3 | Action owners `arc9-project-start-v1`, `arc9-project-stage-v1` and `arc9-project-abandon-v1` through `commitAction`, with witness hashes. Deed joins added to the existing Landing, Mine, Bioscan and Feed transactions. | Claude | Reload, double-press, stale-tab and full-inventory controls all settle exactly once. |
| P4 | UI: a "Build here" site on the world card; a Projects board beside Charters (own slots); portrait marks; a fifth Museum gallery "Outposts"; a Guide topic; a `V2_DRAFT_RELEASE` bullet. Tested at iPhone width. | Claude | `dom`-tier reachability shows each press landing. The outcome test reads the save, not the code path. |
| P5 | Consumers: relay readout in the Atlas/system rows; `shelter` safe reason in the bioscan policy; sanctuary display. Every reader and writer of `settled` is grepped and kept in agreement. | Claude | Each capability has an outcome test and a mutation control (the effect off means the test is red). |
| P6 | Slice/Glass instrument coverage for the project flows; economy acceptance re-run. | **Codex** | The instruments are green on the unchanged source, and a seeded break turns them red. |
| P7 | Human play (ledger H2): does building one outpost feel worth the trip? | Nick | This is the Arc 9 exit evidence (`V2_PROGRAM_ROADMAP.md:2982`). |
| Wave 2 | Observatory; Cargo Beacon if N3 approves missions; Deep Bore if Codex's rates allow it. | Claude wiring, Codex rates | Same gates as P1–P6. |

P1, P2 and P0 can run in parallel. P3 needs P1 and P2. P4 and P5 need P3. Nothing here touches Charter, weekly,
achievement or rank owners except the deed joins in P3.

## 6. The one-line question for Nick

**"N4: build Option A — world-bound three-stage Outposts (Survey Relay, Field Shelter, Companion Sanctuary
first) that are paid in parts plus 20–30 Stardust, reward a local capability or keepsake with no Stardust
payout, no timers and no upkeep, allow 2 under construction and 24 in total, and open after 'A working
component'? (yes / change …)"**
