# Celestial Frontier v1.8.5 "Steady Hands" — round 8 bundle

Build `e20d62c`. Previous audit v1.8.2 `a9a13c7`, 444 changed lines.
Asked for: every kind of player, a full review of what to improve, and the path to 10/10.

## Start here

**`v1.8.5-review.md`** — §1 the obstacles · §2 the archetypes · §3 the path to 10/10 · §4 the pattern.

## Headline

**15 of 25 round-7 findings fixed, plus both outstanding partials — the best ratio of the eight rounds.**
CF1802-09, the free-catalogue mint that supplied three other exploits, is properly closed.
CF1802-01, the mobile training wall, is fixed with a better solution than the one proposed:
the dock went from **0% to 95% reachable** on every phone, and the fleet confirms it —
**training stall points 5 and 7 have vanished entirely.**

Seven new items. The three to do first:

1. **CF1805-02** — duel XP. The comment states *"`mine.id` is set at no reachable call site"*
   and the line below it passes `mine.id`. "Bout survived" and "taken to the wire" still pay
   nothing, and the +8 **duel win has never paid in any build**. One identifier, three places.
2. **CF1805-05** — harvest. The monotonic gate closes the in-session case; `_hvMono` is
   in-memory, so harvest → clock +1h → reload → harvest. ~6,200 ☄/hr against 26 by design.
3. **CF1805-01** — the P0 fix's mirror image. The raised board now buries the lesson card:
   on iPad mini step 8 the training card measures **0% reachable, 63/63 blocked by `#codex`**.
   Root cause is one missing piece of CSS, not the z-index.

## What's in here

    v1.8.5-review.md              the review

    evidence/
      tr_ipad-mini_step8.png      CF1805-01 — the Compendium is up, the training card is gone
      tr_ipad-mini_step5/6/7/9    the surrounding steps, for context
      v182_dock_burial_BEFORE.png last round's P0, annotated — the before picture

    data/
      fleet-rollup.txt            214 sessions: health, per-archetype reach, saw-vs-did
      training-reachability-v185.txt  6 viewports x 17 surfaces, every training step
      fleet-214-sessions.jsonl.gz the raw session records
      fleet-plan.json             the seeded plan (re-runnable)
      veteran-save.json           the mid-game save the system archetypes boot from

    harness/                      the rebuilt instrument — see below

    prior-rounds/                 v1.7.15 through v1.8.2 fix lists

## The harness, rebuilt

`bot8.mjs` is the round-8 instrument. Two changes that mattered:

**18 archetypes** (was 10). New: hardcore, casual, miner, breeder, collector, economist,
idler, backtracker.

**12 goal-directed verbs** (was 8 generic actions, all of which poked the same map — which is
why five rounds of testing never reached mid-game):

    mine · harvest · scavenge · tame · conquer · craft · breed · feed · charter · sheet · idle · backout

driven off the game's own `data-act` / `data-craft` / `data-chacc` hooks, with a land-first
fallback for the verbs that only exist on the ground.

Each verb records three counters, and the middle one is the point:

    did       the verb completed and the world changed
    saw       the affordance existed when we looked for it
    goalFail  it existed and pressing it changed nothing

`saw` vs `did` is a reachability measure. A system nobody can find is as broken as one that
errors, and before this round there was no way to see the difference.

**Running it:**

    cd /path/to/build && python3 -m http.server 8909 --bind 127.0.0.1
    node mkveteran.mjs                                   # build the mid-game save
    node plan8.mjs 214 144 out/plan.json                 # N, deep-tier count
    node fleet8.mjs 0 2 out/plan.json out/fleet.jsonl    # worker 0 of 2
    node analyze8.mjs out/fleet.jsonl

| file | what it does |
|---|---|
| `bot8.mjs` | one session — archetypes, device matrix, the 12 verbs, the audit passes |
| `plan8.mjs` / `fleet8.mjs` / `analyze8.mjs` | plan, shard, roll up |
| `mkveteran.mjs` / `model8.mjs` | the mid-game save, built from the build's **own** `makeGenome` |
| `tutreach8.mjs` | the training-reachability sweep — the instrument that found both P0s |
| `shot_dock.mjs` | walks to a step and screenshots with reachability labelled on each handle |
| `voicemodel.mjs` / `voicerun.mjs` | extracts `voiceOf` et al. verbatim, runs 200k genomes |
| `amb3.mjs` | ambience lifecycle: close / hidden tab / sound-off |
| `ab_boot7.mjs` | paired cold boot against a second build on another port |
| `handles.mjs` `craftprobe.mjs` `yarddiag.mjs` `shelfstate.mjs` `specclick2.mjs` | the probes that produced retractions — kept deliberately |

## Three things I retracted before publishing

Kept in the bundle because the negative results cost real time and the probes that produced
them are worth having.

1. **`craft:nochange` ×30** looked like an unresponsive Shipyard. The recipes were inside a
   collapsed `.fgbody`, so every click hit a zero-height box. `yarddiag.mjs` found it.
2. **49 fatal sessions** were my own `kill -9` orphaning Chromium, not a game crash. Zero
   fatals across all 214 after a clean restart.
3. **`sheet` 37% reach and `charter:noboard` ×51** looked like broken handles. `handles.mjs`
   showed `#rank` opens the sheet and `#chbtn` opens the Charters board on both desktop and
   phone — my verbs don't close what's already open first, and my `backout` map pointed
   `#pcdxbtn` at `#records` when it opens `#primebox`.

And one number I nearly reported backwards: the whole-fleet rage-quit rate is 51.4/1000 against
last round's 10.0 — meaningless, because this fleet is 67% deep tier and last round's was 8%.
On the deep tier alone, the only like-for-like slice, it went **112.5 → 62.5 — down for the
first time in four builds.**
