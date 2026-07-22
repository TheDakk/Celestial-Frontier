# Celestial Frontier — Quests & Chapters

**STATUS:** matches code as of 2026-07-20 (verified against main.js).
**Purpose:** The directed-play spine — the ordered campaign ("Chapters", formerly "The Ascent"), the progressive/accept-to-activate Expedition Charters board with gear rewards, the next-step nudges, and the Field Training tutorial (18 counted steps — UI renders `/18`; `TUT_STEPS` array holds 20 entries, 2 being non-counted intro/conditional cards).
**Source of truth:** this doc is the DESIGN spec; main.js implements it.

## 1. Overview
Three layers of directed play sit on one event bus:

- **Chapters (mainline)** — `ASC_CHAPTERS`, an ordered 3-chapter campaign whose capstone in each chapter is a **ship system whose existence IS the ring unlock** (Jump Drive → Long-Range Array → Intergalactic Drive). Rides *pinned above* the charter board. New saves start **locked to Sol** (travel is gated, curiosity/looking never is). Internally still called "the Ascent" (`asc*` names, save fields `asc`/`ascp`); it is *presented* as "Chapters".
- **Expedition Charters (side board)** — a hunt board on the left rail. **Starter charters** (5 core-trade chain + 5 Sol-tour chain) teach the trades and tour the home system; then a **weekly board** of 3 rotating charters, seeded identically for every explorer. Progressive reveal + accept-to-activate + gear rewards (below).
- **Field Training tutorial** — `TUT_STEPS` (20 array entries), presented to the player as **18 counted steps** (UI renders a literal `/18`; 2 entries are non-counted intro/conditional cards — CLAUDE.md's "18-step" is correct), with a focus-lockdown gate.

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
- 20 steps (see §7). Each step: `{id, text(), spot?, allow?, acts?, btn?, when?, enter?, rev?, pick?}`.
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
- **Step-count discrepancy (real):** `TUT_STEPS` contains **20** steps and the UI header renders `N / TUT_STEPS.length` (= "/ 20"). CLAUDE.md, the smoke harness, and this task all say "18-step Field Training". The "18" label is stale — the two extra steps are the `duel` and `search`/`sheet`-era additions. Either the label or the array should be reconciled; code currently ships 20.
- **Gear rewards are static-only:** `_chGrant` pays fixed existing item ids. The "deeper loot later" phase (rolled/tiered charter loot) is described in comments but not implemented.
- **Sol-tour gear:** `earpiece`, `headlamp`, `magboots`, `meteor`, `fieldlegs` must exist in `ITEM_BY`/`ITEMS` for `_chGrant` to pay out; verify none were renamed in a later item pass.
- **Weekly expiry UX:** accepted weeklies silently expire at rollover (`_chRoll`); no in-progress warning. Intentional but worth noting for players mid-charter at week's end.
