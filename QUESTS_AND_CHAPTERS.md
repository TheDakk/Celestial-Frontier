# Celestial Frontier — Quests & Chapters

**STATUS:** matches code as of 2026-07-31 (verified against main.js). Carries v1.8.6 and v1.8.7 (external rounds 8 and 9) updates — see the ⚠ notes inline.
**Purpose:** The directed-play spine — the ordered campaign ("Chapters", formerly "The Ascent"), the progressive/accept-to-activate Expedition Charters board with gear rewards, the next-step nudges, and the Field Training tutorial (**21 steps**, all counted).
**Source of truth:** this doc is the DESIGN spec; main.js implements it.

## ⚠ v1.8.4 — weekly charters, the clock, and the objective chip

**The banked-landfall law is now STARTER-ONLY.** `chAccept` replays the persisted `landed` set
through a charter's filter so "First footfall: Mercury", accepted while standing on Mercury,
completes on the spot. That is right for the starter chain (a one-time story) and wrong for
**weeklies**, which re-roll: stepping the clock forward a week, opening the board and accepting
paid out from worlds visited long ago — measured at ~20.8 ☄ per clock step against a designed
78 ☄ per real week. Weeklies (`id[0]==='w'`) now count only landings made while they are held.

**`_chRoll` no longer runs on the boot tick.** CF1720-06 moved the `chWeek` repair out of
`loadSave`, but `_chBadge()` → `_chAccepted()` → `_chRoll()` still fired during load for every
`tutDone` save — evaluating the clamp against exactly the pre-NTP `Date.now()` the fix calls
untrustworthy. The roll is now **armed** by the first real gesture (or 8 s), by which time the
clock has settled.

**The objective chip renders for a player with NO objective.** `renderChip` returned at
`if(!g)` — no accepted charter and no outstanding Ascent goal — *above* the stall branch, so the
one player who most needed a suggestion (50% of an external 1,000-session fleet, and 100% of its
rage quits) was the only one who could never be given one. The stall suggestion now stands in for
a missing goal rather than being gated behind one.

**The quest log is live.** `renderQuestLog` had two call sites (the chip click, and `ascEvent`),
so per-charter progress — the only thing the log adds over the chip — never refreshed. It now
rides `_chBadge`, closes on Escape, and cannot strand on screen after the chip hides.

## ⚠ v1.8.6 — the two fixes above each grew a tail

**The chip lost the quest log exactly when a stalled player wanted it (CF1805-04).** The chip is
the log's *only* handle, and it toggles the log only when `dataset.go` is falsy. CF1802-04 replaced
`_nextBest()`'s last `go:null` return with `go:'cosmos'` — so **every** path now returns a truthy
destination, and while the stall suggestion is showing the chip can only ever navigate.

The mechanism is narrower than it first looks, and that narrowed the fix. The click handler
*already* clears the stall (`_stall=0`), which would return the chip to its objective state where
`dataset.go` is `''` and the handle works — but **nothing repainted the chip**, so it kept the
suggestion's markup and kept routing forever. For a stalled player, progress events are precisely
what is not happening, so nothing else was going to repaint it either. The fix is a deferred
`_chBadge()` after the click settles. One-tap routing — CF1802-03's measured win — survives intact.

**A forward clock still re-rolled the weekly slate (CF1805-07).** `_chArmed` correctly defers the
roll past the boot tick, but nothing limited how *often* it can run afterward, and **any board
render triggers it**. `_chRoll` clears every weekly `chProg` key and every weekly `chacc` entry
when `wk > chWeek`, and `_chDoneOf` for a weekly is `(chProg[c.id]||0) >= c.n` — so deleting those
keys makes **every already-completed weekly claimable again**, and `_chWeekly()` reseeds a fresh
slate. Measured over 200 forward week-steps: every pool id recurs in 33–42% of weeks, at an average
**77.5 ☄ per step** — the value the design intends per *real* week, arriving every one to three
minutes.

`_chRoll` now allows ~~one roll per 10 monotonic minutes~~ **one roll per page load** (plus one per
10 monotonic minutes within a load — ⚠ **corrected in v1.8.7, see below;** the original wording here
overstated what the code delivers). It is a rate limit, not a fix. The root cause is that an offline
game cannot verify a wall clock; the same limit is why the harvest version of this exploit is open
by decision. See ECONOMY_LOOT_CRAFTING.md — it is the one place this reasoning is written out.

## 1. Overview
Three layers of directed play sit on one event bus:

- **Chapters (mainline)** — `ASC_CHAPTERS`, an ordered 3-chapter campaign whose capstone in each chapter is a **ship system whose existence IS the ring unlock** (Jump Drive → Long-Range Array → Intergalactic Drive). Rides *pinned above* the charter board. New saves start **locked to Sol** (travel is gated, curiosity/looking never is). Internally still called "the Ascent" (`asc*` names, save fields `asc`/`ascp`); it is *presented* as "Chapters".
- **Expedition Charters (side board)** — a hunt board on the left rail. **Starter charters** (5 core-trade chain + 5 Sol-tour chain) teach the trades and tour the home system; then a **weekly board** of 3 rotating charters, seeded identically for every explorer. Progressive reveal + accept-to-activate + gear rewards (below).
- **Field Training tutorial** — `TUT_STEPS`, **21 entries, all of them counted**, with a focus-lockdown gate. The counter is rendered from the array itself (`(_tutStep+1) + ' / ' + TUT_STEPS.length`), so it cannot drift from the real length.

  > ⚠ **Corrected 2026-07-30.** This line previously read "20 array entries, presented as **18 counted steps**, UI renders a literal `/18`, 2 non-counted intro/conditional cards — CLAUDE.md's '18-step' is correct." **Every clause of that was false**, and the last one vouched for a number CLAUDE.md does not contain (it says 21). There is no literal `/18` in the source; the ids are `welcome · find-earth · survey-tour · atlas-add · atlas-open · land · cache · specimen · card-tour · feed · breed · duel · hazard · heal · tray · search · sheet · forge · horizon · charter-first · finale` — twenty-one, none conditional. External round 8's own screenshots read *"Field Training 8 / 21"*, and its §3.1 argues from "twenty-one steps is a lot to ask", so the real number was sitting in evidence we had already read.
  >
  > Worth keeping as a caution: a doc that **cross-certifies another doc** ("CLAUDE.md's 18-step is correct") manufactures false confidence. Re-derive counts from the source, and prefer citing the expression that produces them over the number itself.

One funnel: `gameEvent(type, detail)` (main.js ~L15309) fans every system event to the tutorial hook, `charterEvent`, and `ascEvent`.

## 2. Rules & mechanics (flows + gating)

### Chapters (`ascEvent`, ~L15270)
- `ascStage()` (~L15235) reads the **built ship systems**, not a counter: `igdrive`⇒3, `array`⇒2, `jumpdrive`⇒1, else 0. `ascCh>=length`⇒3.
- `ascAllows(w)` (~L15258) gates STAR/SYSTEM dives only — galaxy-scale sightseeing and browsing any galaxy is always free. Stage 0 = Sol only; stage 1 = Sol + Neighborhood slice (`ASC_RING_R = GR*0.25` around Sol); stage 2 = whole home galaxy; stage 3 = universe. Foreign-galaxy stars wait for the IG drive. Blocked travel calls `ascBlock()` → throttled toast with `ascHint()`.
- **Progress banks forward:** `ascEvent` credits the current chapter *and all future chapters* (so out-of-order building, e.g. Array before the Ch2 conquest, isn't lost), but only the **current** chapter narrates. On completion, `while` loop closes every chapter the banked progress now covers, fires `cinematic()` + `playFanfare()` per chapter, emits `gameEvent('ascent-chapter', …)`.
- Goals use `{id, ev, filt, n, t}`; a goal ticks when `ev===type` and `filt(detail)` passes. Mining ticks **once per pull** (auto-pulls included).

### Charters — progressive reveal (`_chAvailable`, ~L14994)
- Two chains in `CH_CHAINS`: `trades` and `tour`. `_chainNext(chain)` finds the first not-yet-`chDone` link and returns it **only if reachable** — the `_far0` law (`_far0Ids`, ~L14983) locks `st-conq` while `ascStage()===0` (conquest needs the stars). A locked chain shows `_chLockedNote()` ("⬆ build the ⚡ Jump Drive") instead of the link.
- The board shows **only the next available link per chain** — completing one reveals the next.
- **Weeklies gate behind the trades chain:** `_chWeekly()` charters only appear once `_tradesDone()` (all 5 `trades` links `chDone`). The Sol tour gates nothing (optional side income).

### Charters — accept-to-activate (`chAccept`, ~L15035)
- **`if(!tutDone) return;`** — the board is fully inert (accepts included) until Field Training ends.
- A charter tracks **only once accepted** (`chacc` set, save field `chacc`). Cap enforced: `_chAccepted().length >= CH_CAP` ⇒ refused with a toast.
- `chk` is the "already proven" test: a STATE charter whose deed is already done `_chComplete`s **on the spot at accept** (`proven=true`) — no lost credit, no silent banking. COUNT charters (no `chk`, or `n>1`) count from the moment of accept.
- `charterEvent(type, detail)` (~L15047) increments `chProg[id]` for each accepted charter matching `ev`+`filt`; at `>=c.n` it calls `_chComplete`.
- `_chComplete` (~L15022): starter ids (`s…`) go to `chDone` (permanent); others set `chProg[id]=c.n`. Awards `c.sd` stardust, bumps `stats.charters`, grants gear, toasts (and announces the weekly board opening the first time the trades finish).

### Charter gear rewards (`_chGrant`, ~L15015 — the "S5 static phase")
- A charter with an `item` field pays a **crafted piece by existing id** — deterministic, the same for every explorer (no loot roll yet). `_chGrant` adds one to `items`, auto-equips if the slot is empty, refreshes the cargo button.
- Design intent (comment): the **quiet early pieces** outfit the early game (headlamp, magboots, meteor pendant, fieldlegs, earpiece); rigs/gloves/suits stay the Fabricator's moment. "Static/deterministic early → deeper loot later" is the stated trajectory; only the static phase is implemented.

### Nudges (`nextStepGoal`/`_questNudge`, ~L15066)
- Names the player's single next goal. Priority: **active Chapter goal → accepted charter → available (accept-me) charter → Prime Codex** (if `primeCount()<9`).
- Silent during training (`!tutDone`) and while any listed modal is open. Never fires twice for the same goal key in a session (`_nudged` set). Login nudge at **14 s** after boot; idle nudge after **5 quiet minutes** (`5*6e4`), polled each 60 s.

### Field Training (`TUT_STEPS`, ~L15315)
- 21 steps (see §7). Each step: `{id, text(), spot?, allow?, acts?, btn?, when?, enter?, rev?, pick?}`.
- **Focus lockdown** (`_tutGate`, ~L15391): only `TUT_ALWAYS` surfaces + the current step's `allow` list accept pointer/click/touch/wheel; everything else is `preventDefault`'d with a "nudge" flash. `_tutPanelSweep` closes panels the new step doesn't own, with a one-beat grace so the completing click's own panel still paints.
- **Landing lesson** (`land`→`cache`, steps 6–7): press Land on Earth; a training cache grants 3 Earth beasts + 3 Earth flora on loan (`_tutGrant`); the Planetside vista *holds* until tapped (no auto-close), then yields to the Compendium.
- **Forge lesson** (`forge`, step 18): the order loans ore (`cargo` gets Fe/Al/Si), player crafts an Iron Plate at the Shipyard. `finale` (`_tutCleanup`) returns the loaned cache/ore/plate and heals wounds — "nothing you lose in training follows you out".
- Rigged rolls during training (`_tutRig`): feed `0.99`, breed `-1`, heal `0.95` — training never loses a roll.

## 3. Key tables & numbers (REAL values)

**`CH_CAP = 3`** (a full slate). Weekly rotation window = `Math.floor(Date.now()/6048e5)` (604 800 000 ms = 7 days).

**Chapters** (`ASC_CHAPTERS`, ~L15203):
| id | name | capstone item | unlock |
|----|------|---------------|--------|
| ch1 | Off the Rock | `jumpdrive` | Neighborhood stars |
| ch2 | The Neighborhood | `array` | whole home galaxy |
| ch3 | Beyond the Rim | `igdrive` | intergalactic frontier |

`ASC_RING_R = GR*0.25`. Sol worlds `_SOL_SEEDS = {131..138}` (Mercury..Neptune; Earth=133).

**Starter charters** (`CHARTER_STARTERS`, ~L14909) — `sd` = stardust reward:
| id | ev / filt | n | sd | gear | proof (`chk`) |
|----|-----------|---|----|----|----|
| st-land | landfall | 1 | 10 | — | any surfSeen ≠133 |
| st-mine | mined | 1 | 15 | — | `stats.mines>0` |
| st-scan | bioscan | 1 | 15 | `earpiece` | count-only |
| st-scout | scout-set | 1 | 15 | — | `scoutId` set |
| st-conq | conquest | 1 | 25 | — | any conquered ≠133 |
| st-mercury | landfall seed131 | 1 | 10 | `headlamp` | surfSeen 131 |
| st-mars | landfall seed134 | 1 | 10 | `magboots` | surfSeen 134 |
| st-giants | mined seed135/136 | 5 | 15 | `meteor` | count-only |
| st-ice | landfall seed137/138 | 1 | 10 | `fieldlegs` | surfSeen 137/138 |
| st-comp | crafted cat=comp | 1 | 15 | — | any comp owned |

**Chains** (`CH_CHAINS`, ~L14938): `trades = [st-land, st-mine, st-scan, st-scout, st-conq]`; `tour = [st-mercury, st-mars, st-giants, st-ice, st-comp]`.

**Weekly pool** (`CHARTER_POOL`, ~L14944) — 8 entries, 3 drawn/week:
| id | ev / filt | n | sd |
|----|-----------|---|----|
| wk-land | landfall | 3 | 20 |
| wk-mine | mined (first) | 3 | 25 |
| wk-scan | bioscan | 3 | 25 |
| wk-sp | species | 5 | 25 |
| wk-conq | conquest | 1 | 30 |
| wk-feed | fed (ok) | 3 | 20 |
| wk-breed | bred (ok) | 1 | 30 |
| wk-hostile | landfall venus/lava/gas | 1 | 35 |

Weekly draw: `mulberry32(hashInt(0xC4A7, chWeek, 7))` splices 3 from the pool (deterministic per calendar week — same board universe-wide).

## 4. Data / save fields
- **`chacc`** — array of accepted incomplete charter ids (`Set`). Loaded ids validated against both decks and skipped if already `chDone`. Absent ⇒ nothing accepted.
- `chs` — completed starter ids (`chDone`, permanent; validated against `CHARTER_STARTERS`).
- `chw` — rotation week (`chWeek`; default −1). On a new week `_chRoll` clears weekly `chProg` keys and expires last week's accepted weeklies.
- `chp` — `chProg` map (id→count; keys <24 chars, clamped 0..999; weekly keys reset on rollover).
- `charters` — lifetime honored count (`stats.charters`).
- **Chapters:** `asc` = `ascCh` chapter index (clamped 0..`ASC_CHAPTERS.length`); `ascp` = `ascProg` goal map.
- **Tutorial:** `tut` = `tutDone` (save ~L10095/10270). **Absent ⇒ treated as done** ("never force training on a held/edited save"). Fresh start sets `tutDone=false`, `ascCh=0`, clears charters.

## 5. Determinism
Quests are mostly app-layer, but the parts that must be identical cross-device are:
- **Weekly board** — `mulberry32(hashInt(0xC4A7, chWeek, 7))`, keyed on the *calendar week*, not per-device state. Every explorer in the universe sees the same 3 charters. `Date.now()` is used **only** to derive the week bucket (`_chNow`), an app-layer clock like mining cooldowns — the pure domain modules stay clean (no `Math.random`/`Date.now` in generation).
- **Chapter goals & charter filters** derive from world seeds (`planetSeed`, `x.cat`, `x.id`), which are themselves seed-generated, so "conquer a gas giant" etc. resolves identically everywhere.
- Cinematics/toasts are cosmetic and don't feed generation.

## 6. Code anchors (functions + ~line numbers)
- `CHARTER_STARTERS` L14909 · `CH_CHAINS` L14938 · `CH_CAP` L14942 · `chacc` L14943 · `CHARTER_POOL` L14944 · `chDone/chWeek/chProg` L14957–14959
- `_chRoll` L14962 · `_chWeekly` L14970 · `_chById` L14976 · `_chDoneOf` L14977 · `_far0Ids` L14983 · `_tradesDone` L14984 · `_chainNext` L14985 · `_chLockedNote` L14990 · `_chAvailable` L14994 · `_chAccepted` L15004
- `_chGrant` (gear) L15015 · `_chComplete` L15022 · `chAccept` L15035 · `charterEvent` L15047 · `renderCharters` L15122
- `nextStepGoal` L15066 · `_questNudge` L15099 (login 14 s L15113, idle 5 min L15114)
- `ASC_CHAPTERS` L15203 · `ascStage` L15235 · `ascHint`/`ascBlock` L15243/15250 · `ascAllows` L15258 · `_ascActive` L15269 · `ascEvent` L15270 · `gameEvent` L15309
- `TUT_STEPS` L15315 · focus gate `_tutGate` L15391 · `_tutShow` L15413 · `_tutAdvance` L15470 · `_tutPanelSweep` L15490
- Save write `chs/chw/chp/chacc` L10067, `asc/ascp` L10083, `tut` L10095 · load L10230–10238, L10178–10179, L10270

## 7. Open questions / pending
- ~~**Step-count discrepancy (real):**~~ **RESOLVED 2026-07-30.** `TUT_STEPS` contains **21** steps; the header renders `N / TUT_STEPS.length`, so the displayed count is always the real one and there is nothing to reconcile in code. Every stale label has been corrected (this doc, `celestial-frontier-codebase-reference.md`, `README.md`, `UI_PRESENTATION.md`). CLAUDE.md and the smoke harness already said 21. **The discrepancy this entry described was between two documents, never between a document and the code** — which is why it sat open long enough to be restated as "18", then "20", then cross-certified by a sibling doc. Counts belong in exactly one place: the expression that computes them.
- **Gear rewards are static-only:** `_chGrant` pays fixed existing item ids. The "deeper loot later" phase (rolled/tiered charter loot) is described in comments but not implemented.
- **Sol-tour gear:** `earpiece`, `headlamp`, `magboots`, `meteor`, `fieldlegs` must exist in `ITEM_BY`/`ITEMS` for `_chGrant` to pay out; verify none were renamed in a later item pass.
- **Weekly expiry UX:** accepted weeklies silently expire at rollover (`_chRoll`); no in-progress warning. Intentional but worth noting for players mid-charter at week's end.

## 2026-07-25 addition — TRAINING GRADUATION = THE FIRST ACCEPT (Nick's order of operations)
Field training is now **21 steps** and ends exactly as specified: zoom → find Earth → add to
Atlas → land → catalogue/tame → feed → breed → duel → heal → tray → search → sheet → forge →
Prime Codex/Guardians teach → **`charter-first`** → finale.

**`charter-first` (step 20)**: the recruit opens the 📜 Charters board and presses **Accept** on
their first contract THEMSELVES. Nothing is ever auto-accepted. Mechanics:
- `chAccept` is inert during training EXCEPT this step (checked against the live step id);
- the "already proven" instant-complete path is disabled until `tutDone` — a deed can never
  complete off sandbox training stats;
- accepting fires `gameEvent('chaccept')`, which is the step's advance gate;
- the accepted charter **persists through `_tutCleanup`** (cleanup restores stats/codex/cargo but
  never touches `chacc`) — the quest line carries the graduate out of school.

**Finale (step 21)**: cleanup runs, and the card closes on: *"If you ever need help, tap the
? Guide button — and the 🎓 briefings inside it walk every advanced system."*

Smoke drives the full 21 steps and asserts: board-open alone does NOT advance; nothing
auto-accepted (chacc empty before the click); the recruit's accept advances; exactly ONE
charter accepted at graduation. (419 checks total.)

**2026-07-25 review hardening**: (1) *Restart self-heal* — `chacc` deliberately survives both the
save and `_tutCleanup`, so a recruit who accepted at the graduation lesson but quit before the
finale restarts training already holding a contract while `_chAvailable` hides accepted heads;
the `charter-first` step's `enter` now detects `chacc.size` and re-emits `chaccept` — the deed
already done is honored and the step advances instead of deadlocking. (2) *No forced double-accept* —
`_tutFinish`'s v1.5.2 `chacc.add('st-land')` now runs ONLY when `chacc` is empty (the Skip path,
which never saw the lesson); a graduate keeps exactly the contract they chose, and the closing
notification matches whichever path ran.

---

## ⚠ v1.8.7 — round 9: the repaint had a hole, and the rate-limit note was overstated

**CF1806-04 — the chip vanished for the one player it exists for.** v1.8.6's repaint fixed the
stuck-router bug but ran with `_stall` already cleared to `0`, and the suggestion was still gated
behind `_stall >= 10`:

```js
const _nbEarly = (!g && _stall>=10) ? _nextBest() : null;   /* v1.8.6 */
if(!g && !_nbEarly){ /* hides the chip */ }
```

So for a player with **no objective at all**, the repaint landed in the early-out and the chip
*disappeared*, where before it had at least stayed on screen. It returned only after ten more
pointer events. That is precisely the population CF1802-03 identified as most likely to quit.

An objective-less player now gets a suggestion **unconditionally** (`const _nbEarly = (!g) ?
_nextBest() : null`). This is what CF1802-03 said it did — *"the stall suggestion stands in for a
missing goal rather than being gated behind one"* — it was still half-gated. There is nothing to
nag over: `g` is null only when no charter is accepted **and** no chapter goal is outstanding,
which is genuinely adrift rather than merely idle.

**CF1806-03 — the weekly rate-limit costs a reload, not ten minutes.** `_chRollMono` is a plain
module `let`, so it resets on every page load and the first roll of each load always passes. The
real bound is **one roll per page load** (plus one per 10 monotonic minutes *within* a load).
Round 8's comment claimed "one roll per 10 monotonic minutes", which overstated it; the comment
now states the true bound.

It is not fixable by persisting the stamp: any wall-clock minimum written to the save is satisfied
by the same forward wind that triggers the roll, and a monotonic stamp is meaningless across a
reload because `perfTime()` restarts at zero. **A per-session limit cannot bind an attacker who
controls the session** — whoever can wind the device clock can also press F5. Same root cause as
CF1805-05 (harvest), open by decision. See ECONOMY_LOOT_CRAFTING.md.
