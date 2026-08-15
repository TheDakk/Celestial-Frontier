# Celestial Frontier — verification toolkit

The v1.0 assertion suites were lost with the original working environment
(HANDOFF §4). This toolkit replaces them with something stronger: a behavioral
equivalence harness that boots the whole game headlessly and fingerprints its
deterministic core.

Requires Node ^20.19, ^22.13, or ≥24 and `npm install` at the repo root
(acorn + jsdom + ws).

> ## ⚠ `npm install` IS NOT ENOUGH — two suites need a real browser
>
> **Run `npm run preflight` on any new machine before trusting the battery.**
>
> `package.json` declares **acorn**, **jsdom**, and the raw-CDP **ws** transport. But `uilayout.js` and
> `bootperf.js` drive a **real browser** — a system binary runs headless and is
> controlled over CDP. There is no Playwright, no Puppeteer, no npm browser driver
> anywhere in `tools/`. So a clean clone that runs `npm install` gets **seven of the
> nine suites**, and the two that need a browser cannot run — or, worse,
> simply never get run and the battery looks complete.
>
> This went undeclared until **2026-07-31**, when port Phase 0's Gate A deliverable
> *"reproduce all executable dependencies in a clean CI environment"* surfaced it
> (ROADMAP 9h).
>
> **Browser ownership:** `uilayout.js` consumes the shared
> `port/v2/tools/browserpath.mjs` resolver and `browsercdp.mjs` launcher. An exact
> `$CF_BROWSER` is authoritative; CI requires it at job scope. The launcher uses
> browser-assigned port 0 plus `DevToolsActivePort`, records the canonical executable
> and complete `Browser.getVersion` provenance, retains bounded startup stderr, detects
> early exit, and owns bounded shutdown/profile cleanup. Root preflight and
> `uilayout` consume one monotonic, absolute spawn → endpoint → socket-open startup deadline;
> WebSocket opening also has a validated phase cap that defaults to the startup budget
> and is clipped to the startup time still remaining; only post-open CDP work consumes
> the command ceiling. Portable controls prove delayed-open success, explicit-cap and
> remaining-startup rejection, fail-closed pre-construction expiry, constructor-overrun
> rejection with guarded CONNECTING cleanup, just-late-open rejection, invalid-cap pre-launch
> rejection, and failure cleanup. Real-browser legs assert profile cleanup in `finally`
> on either rejection or success. `bootperf.js` invokes that same
> executable resolver, so it cannot validate or select
> a different browser; bootperf still owns its older CDP lifecycle and is not covered by
> the launcher's lifecycle claims.
> On macOS, Chromium cannot register with LaunchServices from inside the Codex
> Seatbelt profile. The resolver/launcher therefore rejects
> `CODEX_SANDBOX=seatbelt` before browser spawn and directs the command through
> approved elevated execution. This prevents an environment refusal from creating
> a misleading Edge crash report before CDP or a page exists. The two historical
> `port/spike` screenshot launchers also resolve through this guard; current macOS-
> capable repository browser tools therefore fail before spawn inside Seatbelt.
>
> **⚠ The revision matters.** `uilayout` compares against **stored numbers** (787 checks
> / 10 viewports). Addendum D: thresholds set on one browser revision drift on the next,
> and Edge **auto-updates silently on Windows**. The pinned revision lives in
> `tools/deps.pinned.json`. **A version bump is an explicit re-baseline decision, not a
> regression** — which is why `preflight` only *warns* on drift by default, and fails
> only under `--assert-pin` (use that in CI).

## preflight.js — can this machine run the battery at all?

```
npm run preflight            # check + report; drift warns
npm run preflight:ci         # drift is a hard failure
node tools/preflight.js --selftest  # discriminates supported/excluded Node lines
node tools/preflight.js --json
```

Checks Node against the declared supported release lines, confirms the npm packages
resolve, then launches the same canonical browser used by `uilayout.js` through its
owned CDP probe and compares `Browser.getVersion` to the pin. An executable that is not
a working Chromium-family browser is therefore blocking, not a warning. `bootperf.js`
uses the same executable resolver and pinned `ws` transport, but retains its legacy
fixed-port/startup/cleanup lifecycle.
Exit 0 = everything required is present; exit 1 = a suite cannot run.

> **Negative-controlled in both directions before it shipped, and it caught itself.**
> The first version trusted `$CF_BROWSER` without checking the path existed, so
> `CF_BROWSER=/nope` reported **PASS, exit 0** — while the layout gate rejected the
> same value. A green-but-wrong state *inside the check written to prevent green-
> but-wrong states*. Fixed so preflight and the shared resolver both reject it. Required
> controls now include: supported Node lines accepted · 20.18/21/22.12/23 rejected · an
> executable non-browser rejected by a real CDP launch · normal browser run → exit 0 ·
> bogus `CF_BROWSER` → exit 1 · drift under `--assert-pin` → exit 1.

> ## ⚠ NEVER run `tools/extract.js` after editing `main.js`
>
> `extract.js` regenerates `main.js` **from the html**. `main.js` is the source of
> truth and is gitignored, so running it after an edit **silently discards every
> change you have made since the last build.** It exists only to bootstrap
> `main.js` on a fresh clone, once.
>
> The everyday command is `node tools/build.js` (main.js → html). If in doubt,
> use `validate.js`, which builds for you.

## goldenseeds.js — the 10,000-case parity corpus for the port

```
npm run goldenseeds              # re-run and compare (a GATE)
npm run goldenseeds:capture      # rewrite the fixture — see the warning below
node tools/goldenseeds.js --capture --count=500 --heavy=100   # quick pass
```

**Why this exists alongside `baseline.json`.** The 50-probe fingerprint proves *this
build still behaves like v1.0*. It does **not** give a TypeScript re-implementation
enough to check itself against: 50 hand-picked cases is a smoke test, and when it fails
it cannot tell you *which input* diverged. `golden-seeds.json` is the parity corpus —
**10,000 seeds × 25 generators = 178,000 cases**, with a hash per seed, so a failing
port is pinpointed to one seed instead of one function.

Lives at `port/baseline-v1.8.9/golden-seeds.json` (~4.3 MB). Captures in ~7s.

**Cross-language by construction:**

- **Seeds are listed explicitly.** A port must not have to reimplement a PRNG just to
  obtain test inputs — that would be a second source of divergence.
- **Canonical form** before hashing: numbers → `Math.round(v*1e9)/1e9` (non-finite →
  `String(v)`), object keys sorted, `undefined` → `null`. This is the **same 1e-9
  rounding `probe.js` uses**, reused deliberately so both fixtures agree on "equal".
- **FNV-1a 32-bit run twice** (bases `0x811c9dc5`, `0x9e3779b9`), concatenated to 16 hex
  chars — ~10 lines in any language, no crypto import.
- **Rollup** per generator for the cheap check; **perSeed** to localise a failure.

> ⚠ **Never re-capture to make a failing `--check` pass.** Exactly the `baseline.json`
> rule: a mismatch means observable generator behavior changed. Re-capture only when the
> change is intended and recorded.

> **Negative-controlled both ways.** Corrupting one stored hash (and recomputing its
> rollup, so only the per-seed value is wrong) makes `--check` fail *and name the exact
> seed*. It also caught a bug in itself: the first version took the corpus size from CLI
> defaults in `--check` too, so checking a 50-case fixture re-ran 10,000 and reported
> "26 generators diverged" — a **false alarm**, and a check that cries wolf gets ignored.
> `--check` now takes its counts from the fixture unless `--count` is passed explicitly.

## codefixtures.js — the codec and load-path hardening corpus

```
npm run codefixtures            # re-run and compare (a GATE)
npm run codefixtures:capture
```

Pins `encodeCreature`/`decodeCreature` (share **and** champion codes — same function,
`champ` is the 2nd arg and carries xp), `encodeWhere`/`decodeWhere`, `normGenome`
(untrusted import hardening) and `_sanitizeSavedGenome` (load-path hardening).
108 curated cases at `port/baseline-v1.8.9/code-fixtures.json`.

**Curated, not random — deliberately.** `golden-seeds.json` covers volume. A codec and
a hardener need the opposite: named adversarial edges with stated expectations. A random
corpus will never contain `size: 1e6`, a `__proto__` key, or a 400-character name.

**⚠ The `size_*` cases are the point.** `crossGenome` mutates `size` without wrapping, so
honestly-bred genomes carry `size > 5`. v1.8.6 added a load-path clamp that permanently
rewrote ~12% of bred creatures into titanic ones; v1.8.7 reverted it. The fixture asserts
**six `sizePreserved` invariants outright** — `_sanitizeSavedGenome` leaves `size`
unchanged for 0, 5, 6, 12, −3 and 1e6. A port that "tidies" `size` here re-creates the
save-corruption bug. `normGenome` *does* coerce (`Math.abs((+v)|0)`, so −3 → 3) — the two
hardeners differ on purpose, and both behaviours are recorded.

> **⚠ Scope, stated honestly.** `buildSave`/`loadSave` are app-layer and not reachable
> from the probe realm, so this does **not** capture a full save round-trip. Gate C's
> *"a real veteran save imports successfully"* stays **open** — a synthetic save generated
> by the same code that reads it proves very little.

> **A shared-`WeakSet` bug was found here and fixed in both probes.** `san()`'s cycle
> guard was module-level, so the *second* canonicalisation of any object returned
> `«cycle»` — silently dropping fields. It corrupted this fixture (a recorded `size: -3`
> vanished) and was latent in `goldenseeds`; re-capturing there produced 25 of 25
> identical rollups, confirming it never bit that corpus. `seen` is now per-call in both.

## audioprofiles.js — voice fixtures, and the vocabulary measurement

```
npm run audioprofiles           # a GATE — 200 voiceOf profiles must not move
npm run audioprofiles:capture   # fixture + the full 200,000-genome measurement
```

`voiceOf(g)` → `{kind, f0, rich, nz, vib, vibD, dur, sweep}` — deterministic per genome,
no audio synthesised. Fixture at `port/baseline-v1.8.9/audio-profiles.json`.

**Two jobs, and only one of them is asserted.** The 200-profile fixture is a parity
corpus and `--check` enforces it. The population measurement is *reported for the
record*, because a statistic drifting slightly is not the same event as a generator
changing behaviour — conflating those would make the gate cry wolf.

**Re-measured, not transcribed.** The claim that the human listening test is unblocked
rested on an external reviewer's v1.8.6 figures. Re-derived over 200,000 genomes against
v1.8.9, **the claim holds**: 199,709 distinct voices of 200,000 (99.855%), 0.874% pinned
at the 6 kHz ceiling.

**It also produces evidence for two open §23 decisions:**

- **`legacy` is a first-class 18th voice family at 5.543%** of procedural fauna.
  `_VOICE_KEYS` is `Object.keys(_VOICE)` and `_VOICE` *includes* `legacy`, so 1-in-18 is
  structural, not accidental.
- **`f0` is clamped to [60, 6000] and both bounds pin** — 0.874% at the ceiling and
  **0.612% at the floor**. The floor had never been reported.

> The family list is **read from `main.js`**, never hand-typed — a hand-typed vocabulary
> drifting out of step with its array is the CF1805-03 defect, and it was found in
> `voiceOf` itself. If the extraction fails, family shares are skipped rather than
> computed against a wrong list.
>
> ⚠ Note `voiceOf` still reads `(+g.size||0)%6`, a hand-typed modulus, correct today only
> because `FA_SIZE.length` is 6.

## The loop (run after every batch of edits)

```
# ...edit main.js (it is the SOURCE OF TRUTH; the html is a build artifact)...
node tools/build.js            # main.js -> html
node tools/validate.js         # builds, then ALL checks below + the fingerprint
node tools/smoke.js            # jsdom interaction suite (incl. full tutorial)
npm run layout:selftest        # fail-closed launcher/report/freshness negative control
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
node tools/harvestclock-check.js # proves the harvest clock cannot be wound
node tools/publish-branch-site.js --selftest
                               # validates the post-battery branch publisher,
                               # including its channel/package/identity reject paths.
# GitHub Actions publishes only after a successful push battery:
#   main    -> https://celestialfrontier.github.io/ (root v1.8.9 HTML)
#   develop -> https://dev-celestialfrontier.github.io/ (exact tested port/v2 v2.0 package)
```

Production and development deliberately use different package paths. Production replaces
the root HTML's build placeholder and otherwise preserves the v1.8.9 game. Development
requires `--package-root` and accepts only a verified `cf-dev-preview/v3` publication
candidate whose full source commit, `develop` branch, clean exact-archive inputs, expected
origin, shared v2.0 version, generated `version.json`, and byte inventory all agree. It
mirrors that package into the development site so stale legacy files cannot survive. The
package keeps its runtime origin refusal, `noindex` meta, disallowing `robots.txt`, and
manifest; visible version/build identity appears only inside the Guide, never as a floating
corner badge. The selftest must reject an unapproved artifact, a cross-channel branch, a
missing production build placeholder, and stale destination bytes.

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

## uilayout.js — owned launcher and current-run evidence

`uilayout.js` now uses the same owned raw-CDP resolver/lifecycle as the v2 browser
gates. Chromium chooses an unused port and publishes it through the owned profile's
`DevToolsActivePort`; the shared launcher then opens its WebSocket inside the same
absolute startup deadline before issuing `Browser.getVersion`. The tool records the
canonical executable plus product,
revision, user agent, JavaScript version and protocol version. Startup and commands
are bounded, an early browser exit retains its exit state and bounded stderr head and
tail, and cleanup owns TERM→KILL escalation plus removal of only its validated profile.

Every ordinary invocation atomically replaces `tools/uilayout-report.json` with
schema `celestial-frontier/uilayout-report@2`: first `running`, then terminal `pass`,
`fail`, or `instrument-fail`. The report is generated and ignored, but preserves the
legacy top-level `results` rows. It also binds a run id, target/viewport scope, exact
browser provenance, counts, timing and a structured failure. A terminal targeted PASS is
valid only for its requested viewport subset. A full 10-viewport PASS additionally binds
the exact 787 `viewport/surface/name` outcome inventory to the sealed
`port/baseline-v1.8.9/uilayout-report.json`; the old baseline remains immutable evidence.

```
npm run layout:selftest
CF_UILAYOUT_RUN_ID=local-review-001 node tools/uilayout.js
node tools/uilayout.js --verify-run=local-review-001
```

The selftest never accepts the prior report by filename: it seeds a stale PASS, runs
an executable that exits 73 with `UILAYOUT_SELFTEST_EARLY_EXIT`, and requires a
current `instrument-fail` report with that diagnosis, a rejected stale run id, and no
owned profile leak. It also removes one sealed outcome, repairs the summary counts so they
remain internally consistent, and requires inventory verification to reject that plausible
but incomplete PASS. `--verify-run=ID` accepts only the exact terminal schema-v2 run;
CI assigns the id, runs selftest + gate + verification, then uploads this report in a
separate always-run artifact step where a missing file is an error.

The first mutable-tree diagnostic through the new launcher preserved a sandboxed Edge
SIGABRT as red startup evidence. A separately permitted diagnostic then completed all
787 checks across 10 viewports. That second run proves reachability only; neither run
is exact-head certification. The implementation still needs a clean commit, the full
sequential exact-commit battery, push, and matching GitHub CI.

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
