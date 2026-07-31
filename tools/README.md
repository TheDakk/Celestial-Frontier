# Celestial Frontier — verification toolkit

The v1.0 assertion suites were lost with the original working environment
(HANDOFF §4). This toolkit replaces them with something stronger: a behavioral
equivalence harness that boots the whole game headlessly and fingerprints its
deterministic core.

Requires Node ≥ 18 and `npm install` at the repo root (acorn + jsdom).

> ## ⚠ NEVER run `tools/extract.js` after editing `main.js`
>
> `extract.js` regenerates `main.js` **from the html**. `main.js` is the source of
> truth and is gitignored, so running it after an edit **silently discards every
> change you have made since the last build.** It exists only to bootstrap
> `main.js` on a fresh clone, once.
>
> The everyday command is `node tools/build.js` (main.js → html). If in doubt,
> use `validate.js`, which builds for you.

## The loop (run after every batch of edits)

```
# ...edit main.js (it is the SOURCE OF TRUTH; the html is a build artifact)...
node tools/build.js            # main.js -> html
node tools/validate.js         # builds, then ALL checks below + the fingerprint
node tools/smoke.js            # jsdom interaction suite (incl. full tutorial)
node tools/uilayout.js         # REAL headless browser: computed boxes + hit-tests
                               #   across 10 viewports (add --shots for screenshots,
                               #   --vp=iphone,desktop to narrow, --url=FILE to
                               #   replay the gate against another build)
node tools/balance-sim.js      # archetype win-rate band + ability-theme art band
node tools/bootperf.js         # COLD BOOT: decomposes first-interactive in a real
                               #   browser over gzipped HTTP. Not "how fast is boot"
                               #   but "is the first screen ANSWERABLE" — a gate can
                               #   be painted and still refuse a tap. Run the art-hold
                               #   assertion with:
                               #     --save=none --cpu=4 --cpuprofile --assert
                               #   Other flags: --reps=N --profile=fresh|warm
                               #   --gate=SEL --settle=MS --url=FILE --verbose
node tools/duelxp-check.js     # REWARD OUTCOMES: plays a real duel, reads the ledger
node tools/sizedrift-check.js  # guards the size clamp regression (see below)
node tools/deploy.js --release X.Y.Z   # runs the whole battery, then ships
node tools/deploy.js           # ship to https://celestialfrontier.github.io/ — stamps
                               #   BUILD_ID with the git sha and publishes
                               #   version.json so live sessions detect updates
```

`validate.js` fails loudly if any step fails:

1. **build.js** — splices `main.js` back between the html's `<script>` tags.
2. **checks.js** — `node --check` on the script, CSS brace balance, duplicate
   element ids, and a grep proving no `Math.random()`/`Date.now()` appears
   inside any `@module … [domain]` block (determinism guard, CLAUDE.md rule 1).
3. **make-probe-build.js** — injects `window.__PROBE_HOOK__` (the names in
   `probe-names.json`) inside the game IIFE so the probe can reach them.
4. **harness.js** — boots the probe build in jsdom (fake 2D canvas context,
   `pretendToBeVisual`), requires **zero boot errors**, then runs
   `probe.js` in-page: 50 probes over the deterministic core (PRNG, naming,
   world-gen, descriptors, genomes, breeding, duels, share codes, constants).
5. Compares every probe against `baseline.json` — captured from the original
   v1.0 file — and fails on any mismatch. **Do not regenerate the baseline to
   make a failure pass**; a mismatch means observable behavior changed.
   (If a change is *intentionally* behavior-altering, regenerate with
   `node tools/make-probe-build.js celestial-frontier.html tools/probe-build.html
   && node tools/harness.js tools/probe-build.html tools/baseline.json`
   and say so in the commit.)

## bootperf.js — what its numbers mean

A gate can be **painted** and still refuse a tap. Timing "first interactive" with one number
cannot tell a slow network from a blocked main thread, and that ambiguity is what produced the
"maybe it's cache warming on the larger file" hypothesis for the round-7 cold-boot outlier. It
was not cache: in the slow reps their own `load`/`DCL` were indistinguishable from the fast ones,
so the file was fully downloaded, parsed *and executed* at ~400ms every time.

So this tool decomposes instead of timing:

| column | means |
|---|---|
| `resp_end` / `transfer` | the network is done; bytes actually crossed the wire |
| `DCL` | the inline script has run — `askExplorerName` is synchronous, so the gate exists |
| `painted` | first rAF frame where the gate has a real laid-out box |
| `TTI` | first frame **within 50ms of its predecessor** at/after the paint — the thread is free |
| `blocked pre-gate` | longtask time standing between the player and their first tap |
| `blocked post-gate` | jank *after* the gate is up — a real but different defect |

`--profile=warm` serves the file from cache (`0 B over the wire`) with no TTI benefit, which is
the direct falsification of the cache story. `--cpu=4` matters more than any of it: the iPhone is
the primary device, and a desktop-speed number is the best case, not the case.

Two traps, both of which bit this tool before it worked:

- **Do not stop observing at TTI.** The first cut did, so a 1500ms block injected at 600ms
  reported `0ms` and passed. `--settle=MS` (default 2500) keeps the window open past `load`.
- **A `setTimeout` block cannot preempt the parser.** It runs *after* the gate legitimately
  paints, so it proves nothing. Only a **synchronous** block placed before the game `<script>`
  manufactures a painted-but-unanswerable gate.

Both controls found bugs in the instrument rather than the build — worth repeating before trusting
any change to it.

## simrun.js `dom` — the reachability tier

```
node tools/simrun.js dom 24        # → tools/simreport-dom.json
CF_SRC=/path/to/other.html node tools/simrun.js dom 24    # A/B another build
```

Every other expedition tier (`fast`, `deep`, `medium`, `veteran`) takes its actions
by calling a probe hook — `H.craftItem()`, `H.tryCapture()`, `H.equipItem()`. That
proves the **action** works. It cannot prove a **player could reach it**, which is
why 1,000-session tiers were structurally blind to CF1802-07 (a Fabricator button
with no handler at all) and CF1802-09 (a roster row that minted a species). Both had
to be found by an external round.

In `dom` mode a covered action is driven through the real control, and the press must
**land** — proven by a before/after effect snapshot, never by the fact that a click was
dispatched. Three findings, kept apart because they have three different fixes:

| finding | meaning |
|---|---|
| `absent` | no control for an action the API says is possible |
| `disabled` | the control refuses while the API accepts (a gating disagreement) |
| `dead` | the control accepts the press and nothing happens |

**Adjudicating `dead` is the whole design.** "Pressed it and nothing changed" is *also*
what a legitimately-unavailable action looks like, so a naive before/after check cries
wolf on every unaffordable recipe. The tier records `dead` only if the API path then
succeeds from the same state. A harness that cries wolf gets ignored, and an ignored
harness is worse than none.

`uncovered` is reported on purpose. A tier that silently skips what it cannot drive
reads as "all clear" when it really means "did not look". Currently covered: **craft**.
`capture`, `equip`, `feed`, `breed` and `heal` need panel/picker state the expedition
never establishes — they stay API-driven and are counted, not quietly omitted.

Adding an action means adding a `UI_PATHS` entry: `open()` makes the surface reachable
(idempotent), `find()` returns the control a player would press, `effect()` returns a
comparable snapshot the action must change, optional `why()` makes a finding
self-diagnosing.

⚠ **Scope.** jsdom has NO LAYOUT, so this tier proves a *live handler* exists — not that
the control is on screen, unburied or tappable. `tools/uilayout.js` owns that half, in a
real browser with hit-tests. Together they cover reachability; neither does alone.

**Negative-controlled both ways** via `CF_SRC` against deliberately broken builds — the
only reason a `PASS` here means anything:

| build | ok | absent | dead | verdict |
|---|---|---|---|---|
| craft handler neutralised (`const cr=null`) | 0 | 0 | **183** | FAIL |
| `data-craft` attribute renamed away | 0 | **178** | 0 | FAIL |
| real build (24 runs, 1,488 presses) | 99.3% | 0 | 0 | **PASS** |

A caution worth repeating: the first four iterations of this tier reported 141, then
106, then 85 findings, **all of them the harness's own fault** — a stale Shipyard (the
bot mines via API, which never fires the UI's ore-arrival re-render) and the Research
Bench being up instead of the Fabricator (`yardView` renders one bench at a time, and
both use `.bset` rows, so the wrong one looks superficially right — `.fabgrp` is the
tell). Distrust this tier's first findings until the controls above pass.

## duelxp-check.js — asserting that a reward ARRIVED

```
node tools/duelxp-check.js              # the current build
node tools/duelxp-check.js --src=<html> # any build, for negative controls
```

Added 2026-07-30 (round 8, CF1805-02). It boots the game, catalogues a champion,
drives the **real** friendly-duel flow — arena → paste a challenger code → Fight →
Skip — and then reads the catalogue entry's XP.

It exists because of a specific, embarrassing gap. `smoke.js` already had a
duel-XP check; it called `awardXP()` **directly**, so it stayed green through every
build in which the friendly duel paid nothing at all. The +8 "a duel won" award had
never paid in **any** shipped build: the guard derived a correct identity and the
award used a different one that is `undefined` at every reachable call site. A test
that calls the reward function proves the reward function works. It says nothing
about whether the game ever calls it.

| build | result |
|---|---|
| pre-fix (`awardXP(mine.id, 8, …)`) | **FAIL** — `xp 0 -> 0`, while `duelwins` still increments |
| fixed (`awardXP(_mid, 8, …)`) | **PASS** — 6/6 |

The negative control matters more than the pass here: it reproduces the exact
reported shape, where the win counts toward rank and achievements while the
creature that won it gets nothing.

`startDuelWithCode` was added to `probe-names.json` for this (254 names) — the
sanctioned way to reach a binding inside the game IIFE.

**The generalisation, which is still open work:** the external round has asked five
times for this treatment across *all* nine advertised XP awards. Three were dead as
of round 8. Only the duel ones have an outcome test today.

## uilayout.js — the training-card reachability pass

Four raisable surfaces (`#log` `#codex` `#chpanel` `#records`) × two lesson-card
positions × 10 viewports = 40 checks, sampling a 63-point grid per element so the
numbers are directly comparable to the external round's.

⚠ **Read this before trusting a green run.** The first version of this pass measured
with the card pinned at the **top**, and came back clean on the very case round 8
reported — a top-pinned card and a bottom-anchored board never share a band on a
tablet. Their card had **dodged to the bottom** (the opposite-half rule), which is
exactly where those boards live under `@media (max-width:900px)`. Adding the dodge
pass reproduced their measurement verbatim: `ipad-mini · Compendium · 0% reachable ·
63/63 blocked by #codex`.

A gate that agrees with a bug report by accident is worth nothing. Reproduce the
**reported geometry**, not a convenient one — and negative-control it by stripping
the fix (`--url=` a patched copy) before believing the pass.

## One-time refactor tooling (kept for the record)

`refactor/` holds the scripts that performed the 2026-06 SOLID restructure:
`structure.js` (declaration map), `analyze.js` (cross-reference / TDZ-hazard /
shared-state analysis driven by `modules.json`), `wrap-modules.js` (wrapped
line ranges into revealing-module IIFEs without touching statement bytes),
`banner-sections.js` (app-layer section banners + architecture TOC). They are
not needed for day-to-day work.

## sizedrift-check.js — the guard against re-adding the `size` load clamp

```
node tools/sizedrift-check.js              # the current build
node tools/sizedrift-check.js --src=<html> # any build, for negative controls
```

Added 2026-07-31 (round 9, CF1806-01). v1.8.6 shipped two fixes for one problem that contradicted
each other — `battleStats` wraps `size`, the load path clamped it — and the clamp permanently
rewrote honestly-bred creatures on their next load.

It asserts the outcome in both directions:

1. an honestly-drifted genome (built by the build's **own** `crossGenome`/`evolveGenome`) survives
   `_sanitizeSavedGenome` **unchanged**, and its vitality does not move;
2. a crafted `size:1e6` still lands inside the legitimate range — i.e. the wrap alone closes the
   exploit the clamp was written for.

| build | result |
|---|---|
| v1.8.6 (clamp present) | **FAIL** — `size 9 -> 5`, `vit 80 -> 88` |
| v1.8.7 (clamp removed) | **PASS** — 4/4 |

Check 3 passes on *both* builds, which is the point: it demonstrates the clamp was redundant as
well as harmful. It also asserts its own premise (that breeding really does drift `size` past 5),
so if `crossGenome` ever changes, the check reports that rather than silently testing nothing.

## uilayout.js — the training DOCK pass

Alongside the training-card pass, `uilayout.js` now asserts that **every dock control is the
topmost element at its own coordinates** while each of the four raisable boards is up, on every
viewport at or below the 900px dock breakpoint. Scoped there deliberately: above it those same ids
are rail buttons with different layout, and a board overlapping them is a different question with a
different answer (laptop/desktop report overlaps on v1.8.5 too — pre-existing, filed separately).

⚠ **It took three corrections before it measured anything real**, and all three are recorded in
PROCESS_LAWS.md: a key collision that clobbered an existing check, **empty** boards that collapse
under `min-height:0` and never reach the dock, and stale `--tut-bot` left over from the dodge pass.
In its first two forms it passed against the shipped build the external round had already proven
broken. Run `--diag` to dump the geometry (viewport, `--tut-bot`/`--tut-cap`, board rect, every dock
button rect) when a result looks too clean.
