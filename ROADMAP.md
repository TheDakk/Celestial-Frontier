# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.
## The per-system docs at repo root (WORLD_GENERATION · BIOME_ATLAS · ART_DIRECTION ·
## SPECIES_AND_GENOME · RARITY_AND_GRADES · CAPTURE_AND_BIOSPHERE · COMBAT_AND_CONQUEST ·
## PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS · BREEDING_AND_SHARING ·
## DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO) are the SOURCE OF TRUTH we pull from for a
## full-system review/edit later. RULE: whenever we change a system, update its doc IN THE
## SAME BATCH (and bump its "matches code as of" marker) — the same way we run validate and
## update this roadmap. A change isn't done until its markdown reflects it. Also keep
## celestial-frontier-codebase-reference.md (code map) in sync when functions move/appear.

## 📌 PINNED — ROADMAP HYGIENE (Nick, 2026-07-21): KEEP THIS FILE LEAN. This doc holds ONLY the
## live SESSION HANDOFF (state / what's done / NEXT backlog / process). Completed batch logs and
## superseded handoff blocks live in `ROADMAP_ARCHIVE.md` (history + traceability, nothing deleted).
## RULE, run at the END OF EACH ARC (or whenever this file grows past ~400 lines): move every batch
## block older than the current one to the TOP of the archive's batch section, verbatim, then refresh
## the SESSION HANDOFF here so WHAT'S DONE / NEXT reflect reality. Rewrite the handoff in place — the
## roadmap stays a one-screen read. History is one file away, git-diffable. (Split first done 2026-07-21
## when this crossed ~285KB / 4,272 lines and stopped reading in one pass.)

## ▶▶▶ SESSION HANDOFF — as of 2026-07-30. ★ v1.8.5 "FIRST TOUCH" IS LIVE (build e20d62c) ◀◀◀
## [HYGIENE 2026-07-30] The v1.8.3 + v1.8.4 batch blocks moved VERBATIM to the top of
##   ROADMAP_ARCHIVE.md (this file had reached 423 lines; it is ~368 now, and 157 lines of it
##   are the two archived blocks' replacement: a single v1.8.5 log). Structure is
##   pins → this handoff → the v1.8.5 batch log → the v2.0 plan. Source AND site pushed;
##   full battery green; the live site was verified end-to-end after deploy, not assumed.
##
## ═══ WHERE THINGS STAND ═══
## ★ v1.8.5 "FIRST TOUCH" SHIPPED 2026-07-29 (Nick's call: "deploy it as 1.85"). Two NEXT items:
##   · #6 cold boot (commit 94bcfba) — tools/bootperf.js + `_hdLater`. TTI on a 4x-throttled
##     phone 6440ms -> ~1880ms (1905ms pre-release, 1878ms measured on the shipped build; both
##     are real runs, the spread is host noise). THE player-visible content of this release.
##   · #7 DOM reachability tier — tools/simrun.js `dom` mode. Tooling only, no game code.
##   BOTH found bugs in THEMSELVES before they found any in the build (see the ⚠⚠ notes in 6
##   and 7). That is now SIX instances of a check passing while the thing it guarded was broken,
##   and the 2026-07-29 corollary is earned: WHEN A NEW INSTRUMENT FIRES, SUSPECT THE INSTRUMENT
##   FIRST. Make every finding carry its own diagnosis — "no control for {id}" was a bug report
##   nobody could action; adding the surrounding state cracked it in minutes.
## LIVE: v1.8.5 "First Touch" (build e20d62c) at https://celestialfrontier.github.io/.
##   VERIFIED LIVE, not assumed: version.json returns {"v":"1.8.5","build":"e20d62c"} and the
##   served html reports GAME_VERSION='1.8.5' with `_hdLater` present. Source repo pushed too
##   (the two-push law); both repos show no ahead/behind.
## GATES AT SHIP: validate 9/9 · fingerprint MATCH 50/50 · smoke 553/0 · uilayout 683 checks /
##   10 viewports · balance PASS · bootperf --assert PASS (art-hold 493ms vs 900ms budget,
##   TTI 1878ms) · simrun dom PASS (99.4% of presses landed, 0 findings).
## ARC STATE: v1.7 "The Forge" COMPLETE and archived. v1.8 "The Connection" COMPLETE
##   (v1.8.0 arc → v1.8.1/.2 playtest → v1.8.3 external battery → v1.8.4 round 7 → v1.8.5
##   the cold-boot fix + two new gates). v1.8.3/.4 batch logs are in ROADMAP_ARCHIVE.md.
## SAVE FIELDS added across v1.8: vce/cbx (audio toggles), xpf (one-shot XP ledger). All
##   absent-safe. NO save-shape change in v1.8.4 (the monotonic harvest guard is in-memory)
##   and NONE in v1.8.5 (the art hold is pure scheduling).
## ⚠ TITLE CAVEAT: "First Touch" was CHOSEN BY CLAUDE, not specified — Nick asked only for
##   "1.85". Renaming is one string in RELEASES[0] plus a redeploy. See 6c.
##
## ═══ ▶ NEXT — the actionable list, highest value first ═══
## 1. ★ NICK'S iPHONE RE-VERIFY of v1.8.5 — (a) training steps 5 / 6 / 7, still unverified on a
##    device since the v1.8.3 fix; (b) NEW — the FIRST 10 SECONDS of a brand-new expedition on a
##    real phone. v1.8.5 took the naming screen from unanswerable-for-6.4s to ~1.9s on a
##    4x-throttled profile, and that is precisely the window a new player judges the game in.
##    Clear the save (or use a fresh browser profile) so it is a genuine first run. The mobile
##    training wall is gate-proven from both ends (smoke proves the marking, uilayout proves the
##    target is hittable on 10 viewports, and the gate reproduces the bug on the OLD build), but
##    a physical iPhone is still the only judge that has ever caught this class of defect.
## 2. ★ EXTERNAL ROUND 8 on v1.8.5 (build e20d62c). Ask specifically for:
##    (a) re-run the 7 economy exploits — the LINEAGE bonus needs a MULTI-SESSION probe, because
##        correct behaviour is "pays once per species pair, EVER" and one session cannot tell that
##        from the old bug;
##    (b) RAGE QUITS — 3→5→7→10 across four builds. v1.8.4 was the FIRST release to address the
##        mechanism they identified (CF1802-03: the stall detector could not render for a player
##        with no objective — 50% of their fleet, 100% of the rage quits) rather than the symptom;
##    (c) CF1802-08 repro sequence — we could NOT reproduce it (real path, real pointerdown;
##        codexOpen stays true) and the gate is in place either way;
##    (d) physical iOS/iPadOS Safari, still outside both harnesses;
##    (e) NEW — re-run their boot A/B, but THROTTLED (they ran an idle desktop host). Item 6 shows
##        the effect is CPU-bound, not cache-bound: at 4x it is a 6.4s unanswerable first screen,
##        which is very likely what their 3 slow reps were seeing on a host still recovering from
##        the 1,000-session fleet. Ask them to measure ANSWERABILITY, not just paint — and note
##        their harness's `waitForSelector(visible)` cannot tell the two apart.
## 3. ★ HUMAN LISTENING TEST for audio. Their three prerequisites are now done (mute lifecycle,
##    the 540→millions voice vocabulary, the temperament gene). No automated fleet can score this
##    — Playwright runs with --mute-audio. 12-24 players, audio on vs off, headphones + phone
##    speaker, first 30 min + one creature-heavy session. DO THIS BEFORE sizing the port's §15
##    (904 lines of audio plan resting on 2 of 24 testers, neither substantive).
## 4. ⏳ NICK'S DESIGN CALL — should a bred child inherit any `fed`? `brood` is summed across
##    parents; `fed` is not, so a hybrid of two well-fed parents starts at 0 (up to ~2,000 power
##    silently lost). The BUG is fixed (the preview no longer quotes fed-inflated totals — it was
##    up to 6.2x overstated — and the card says fed does not carry over). Whether it SHOULD be
##    inherited is a balance change, deliberately not made quietly. See BREEDING_AND_SHARING.md.
## 5. ⏳ NICK'S DESIGN CALL — should the biome ambience restart when the tab becomes visible
##    again? Today it stops on hide and stays silent on return. See AUDIO.md §5.
## 6. ✔ COLD-BOOT OUTLIER — CHASED, DIAGNOSED AND FIXED 2026-07-29 (was: "worth one look").
##    IT WAS NOT CACHE WARMING. Their own data already ruled that out and we misread it: in the
##    SLOW reps load=409ms and DCL=384ms, INDISTINGUISHABLE from the fast reps. The file was
##    fully downloaded, parsed AND executed at ~400ms every single time. Nothing about the
##    network or the payload differed. And `askExplorerName(true)` runs SYNCHRONOUSLY in boot,
##    so the gate is in the DOM before DCL — a visibility poll runs IN THE PAGE, so the only way
##    it reports late is a BLOCKED MAIN THREAD. Different defect, different fix.
##    ROOT CAUSE: both art modules use the house "instant lo → async hi" pattern (setTimeout
##    30ms/45ms). A brand-new expedition calls startNewGame() at +120ms, which goTo()s Sol and
##    queues one HD upgrade PER BODY plus the galaxy face — each a 300-800ms block
##    (n2/fbm/renderPlanetSprite/makeGalaxySprite). All of it INVISIBLE behind the naming screen,
##    which is the only control on screen. MEASURED on a 4x-throttled iPhone-class profile:
##      new player      gate painted 393ms · ANSWERABLE 6440ms · 5818ms blocked
##      returning player                                         · 0ms blocked  <-- named the cause
##    FIX: `_hdLater()` (main.js, top of the game IIFE after @end PlanetGen) re-polls while
##    _introUp() instead of rendering. TTI 6440ms -> 1905ms. Precedent, not invention: toasts
##    ALREADY wait on _introUp() (_toastQ, "held while the title / explorer-name screen is up").
##    Determinism-safe by construction (sprites derive from seeds, not from when they are drawn)
##    — fingerprint MATCH 50/50. Full battery green: smoke 553/0 · uilayout 683/10 · balance PASS.
##    NEW GATE tools/bootperf.js — decomposes first-interactive (network / in-DOM / painted /
##    ANSWERABLE / blocked pre-gate / blocked post-gate) in a real browser over gzipped HTTP.
##    Sound WITHOUT clock correlation: --save=none never types a name, so the intro is up for the
##    whole window and art self-time over the profile IS art time behind the intro.
##    NEGATIVE-CONTROLLED BOTH WAYS against the shipped v1.8.4 recovered from git: 3611ms exit 1
##    unfixed, 495ms exit 0 fixed, budget 900ms clear of both.
##    ⚠⚠ AND IT CAUGHT TWO BUGS IN ITSELF FIRST — the fifth instance of a check passing while the
##    thing it guarded was broken, and the first that was a PERF gate: (a) it stopped observing at
##    TTI, so a deliberate 1500ms block at 600ms reported 0ms and PASSED — a longtask census whose
##    window closes at TTI is not a census (fixed: --settle, default 2500ms past load);
##    (b) a setTimeout block CANNOT preempt the parser, so it ran after the gate legitimately
##    painted and proved nothing — only a SYNCHRONOUS block before the game <script> manufactures
##    a painted-but-unanswerable gate. Both controls found the instrument wrong, not the build.
##    ▶ STILL OPEN, measured and deliberately NOT done (see 6a/6b below).
## 6a. REMAINING 1905ms is dominated by `(program)` ~2s = V8 compiling the 1.9MB inline script at
##    4x throttle. That is the PAYLOAD problem the v2.0 port plan already owns (payload budget
##    gate, Phase 0) — not a boot bug. Best evidence yet for prioritising the module split.
## 6b. `drawSystem` burns ~416ms/boot painting the world BEHIND the full-screen naming modal
##    (78% opaque + 6px blur). Skipping the painter while _introUp() would recover most of it, but
##    frameInner also runs gameplay logic (epoch ticks, checkTransitions, queueSave) and `picks`
##    feeds hit-testing, so it is frame-loop surgery for a partial win — and it changes what the
##    player sees behind the intro (live starfield vs frozen), which is Nick's art call. NOT DONE.
## 6c. ✔ RELEASE NOTE WRITTEN AND SHIPPED as v1.8.5 "First Touch" — a NEW RELEASES[0] entry, not
##    an append to v1.8.4's (which was already live; appending there would have credited shipped
##    notes with a fix live players never received). One Bug Fixes bullet (the first screen answers
##    at once) + two Under the Hood bullets (the cold-boot gate, the fleet pressing real buttons).
##    ⚠ TITLE WAS MINE, NOT NICK'S — "First Touch". He said only "deploy it as 1.85"; the release
##    schema needs a title and the update popup fires on deploy, so it was picked rather than
##    blocked on. Rename freely; it is one string in RELEASES[0] plus a redeploy.
## 7. ✔ DOM-DRIVEN simrun tier — BUILT 2026-07-29 as `node tools/simrun.js dom N`.
##    FIRST, A CORRECTION: the old wording here ("simrun drives PROBE HOOKS, not the DOM") was
##    half wrong. The `ui`/`chaos` tiers ALREADY drive the DOM and use the probe hook only to
##    OBSERVE. It is the EXPEDITION tiers (fast/deep/medium/veteran) — the high-volume ones that
##    produce every metric — that call ~28 hooks directly. That is the real blind spot, and it is
##    why a bot calling craftItem() could never notice a dead Craft button: CF1802-07 (a Fabricator
##    button with NO handler) and CF1802-09 (a roster row that minted a species) both had to be
##    found by an external round.
##    THE TIER: a covered action is driven through the real control and the press must LAND, proven
##    by a before/after effect snapshot — never by the fact that a click was dispatched. Three
##    findings, kept apart because they have three different fixes: `absent` (no control for an
##    action the API says is possible) · `disabled` (control refuses, API accepts) · `dead`
##    (control accepts the press, nothing happens).
##    ★ ADJUDICATING `dead` IS THE WHOLE DESIGN. "Pressed it and nothing changed" is ALSO what a
##    legitimately-unavailable action looks like, so a naive check cries wolf on every unaffordable
##    recipe. `dead` is recorded ONLY if the API path then succeeds from the same state. A harness
##    that cries wolf gets ignored, and an ignored harness is worse than none.
##    NEGATIVE-CONTROLLED BOTH WAYS via the existing CF_SRC env var, and it DISTINGUISHES the two:
##    handler neutralised -> 183 dead / 0 absent · attribute renamed away -> 178 absent / 0 dead ·
##    real build (24 runs, 1,488 presses) -> 99.3% landed, 0 findings, PASS.
##    ⚠⚠ THE LESSON, AND IT IS THE SAME ONE AGAIN: the first FOUR iterations reported 141, then
##    106, then 85 findings — EVERY ONE the harness's own fault. A stale Shipyard (the bot mines
##    via H.mineWorld, which never fires the UI's ore-arrival re-render) and then the Research
##    Bench being up instead of the Fabricator (yardView renders one bench at a time, and BOTH use
##    .bset rows, so the wrong one looks superficially like a rendered Fabricator — .fabgrp is the
##    tell). Findings that carry their own diagnosis (`why()`) are what cracked it; the first
##    version's "no control for {id}" was a bug report nobody could action.
##    ⚠ SCOPE, stated so the report is never read as more than it is: jsdom has NO LAYOUT, so this
##    proves a LIVE HANDLER, not that the control is on screen or tappable. uilayout.js owns that
##    half. Together they cover reachability; neither does alone.
## 7a. COVERAGE IS ONE ACTION SO FAR — `craft`. `capture`, `equip`, `feed`, `breed`, `heal` need
##    panel/picker state the expedition never establishes; they stay API-driven and are counted as
##    `uncovered` in the report rather than quietly omitted (a tier that silently skips what it
##    cannot drive reads as "all clear" when it means "did not look"). Adding one is a UI_PATHS
##    entry: open/find/effect/why. NEXT most valuable: `capture` (CF1802-09's own surface).
## 8. HARNESS NOISE FLOOR: ±6 on "creatures reaching L3" at n=100 (found when two sim-identical
##    builds returned 16 and 10). Raise runs-per-arm or pair seeds before scoring at that
##    granularity again. The no-op and stall counters ARE stable (35.3/35.3/35.0/35.4).
## 9. KNOWN BACKLOG, not claimed fixed: CF1715-27 burn/thorns kills produce no death line ·
##    CF1715-29 conquest affix always lands on a worn slot · CF1715-35 #searchres/#tray trapped in
##    ancestor stacking contexts (latent) · CF1715-37 step 13 asserts a wound applied 400ms later ·
##    CF1715-06 the ferocity damage floor only bites above fer 20 · CF1718-10 full per-modal focus
##    memory (partial) · Ambush at magnitudes IV/V · direct 132px thumbnail rendering (first paint
##    still generates HD) · willReadFrequently on the two hot canvas contexts · the `legacy` voice
##    archetype is a first-class 18th family in the wild (~5.5%), probably not intended.
## 10. THEN v1.9 CONSOLIDATION = PORT PHASE 0/1 → v2.0 PixiJS. See the v2.0 block at the bottom
##    of this file: save schema + Zod, module split BECOMES the TS extraction, payload budget gate,
##    ART_DIRECTION.md elevated to the port rubric + a golden screen. Also still open from that
##    review: the falsifiable Canvas2D visual spike (§26 step 2), and re-running the plan's §3
##    counts against the current build before Phase 0 (it audited ~21.8k lines / a 15-tier ladder;
##    we are now ~25k lines / 10-tier + a _GEAR_ART layer).
##
## ═══ ▶ PROCESS LAWS EARNED THE HARD WAY (read before touching UI or tests) ═══
## ⚠⚠ WHEN A NEW INSTRUMENT FIRES, SUSPECT THE INSTRUMENT FIRST (2026-07-30, learned twice in one
##   session). Both gates built that day found bugs in THEMSELVES before finding any in the build:
##   bootperf's window closed at the moment it was measuring, and the dom tier reported 141 phantom
##   findings from its own stale/wrong-tab DOM. Corollaries: (a) an observation window must outlive
##   the thing it observes — pass --settle, don't stop at the first success; (b) MAKE EVERY FINDING
##   CARRY ITS OWN DIAGNOSIS. "no control for {id}" was a bug report nobody could action; adding the
##   surrounding state (a `why()` hook) turned days of guessing into minutes; (c) prefer a
##   DETERMINISTIC path over a clever one — "always reopen the panel" beat four rounds of trying to
##   deduce whether the DOM was current enough to trust.
## ⚠ PAINTED ≠ ANSWERABLE. A gate can be drawn, hit-testable and completely unable to respond,
##   because the main thread is busy. `waitForSelector(visible)` cannot tell the two apart, and that
##   ambiguity is what sent the cold-boot investigation to "cache warming" for three builds. Time
##   ANSWERABILITY (first frame within 50ms of its predecessor), and split the longtask census at
##   that moment: blocked-before-gate delays interactivity, blocked-after-gate is a different defect.
## ⚠ NOTHING EXPENSIVE RUNS BEHIND A BLOCKING FULL-SCREEN SURFACE. Invisible work still costs the
##   player the only control they can reach. `_hdLater` + `_introUp` is the pattern; toasts had it
##   first (_toastQ). See UI_PRESENTATION "THE ART-HOLD LAW".
## ⚠ A HARNESS THAT CRIES WOLF GETS IGNORED, and an ignored harness is worse than none. When a
##   negative signal is ambiguous ("pressed it and nothing happened" is also what an unavailable
##   action looks like), make the harness ADJUDICATE before it reports — the dom tier records `dead`
##   only if the API path then succeeds from the same state.
## ⚠ NEVER run `node tools/extract.js` after editing main.js — it regenerates main.js FROM the
##   html and silently destroys uncommitted work (main.js is gitignored). Use `node tools/build.js`.
##   Three docs used to instruct exactly that; all three now warn (fixed 2026-07-29).
## ⚠ CSS lives ONLY in the html, and there are TWO <style> elements — append to the LAST one.
## ⚠ SPECIFICITY: one ID beats any number of classes. `body.training .tutpri{z-index:58}` LOST to
##   `#panel{z-index:9}`; the mark applied, class-level tests passed, and the fix did NOTHING.
##   An external round found the identical trap in shipped code the same week (CF1720-07).
##   A class-level override cannot govern surfaces that declare their layer through an id.
## ⚠ ASSERT THE OUTCOME, NOT THE CODE PATH — and never assert a selector's SPELLING. Three checks
##   have now passed while the thing they guarded was broken: the v1.8.1 vista check (matched
##   literal selector text), the first meter check (called the formatter directly and passed
##   against a regressed render site), and CF1720-07's own check (asserted the dead rule's text).
## ⚠ NEGATIVE-CONTROL EVERY NEW CHECK — break the build on purpose and confirm the check fails.
##   Two controls changed what shipped this round: the .tutpri specificity miss, and a stall-detector
##   test that passed against a reverted build because it never constructed the no-objective state.
## ⚠ jsdom has NO LAYOUT. A CSS rule can be present, correct and completely inert. tools/uilayout.js
##   (real headless browser, elementFromPoint hit-tests, 10 viewports) is the only gate that sees
##   this. It takes --url=FILE, so replay a new gate against an OLD build to prove it catches the bug.
## ⚠ A bare click() never fires the outside-close manager or the tap-dismiss — use a real
##   pointerdown+click. This has produced vacuous passes twice (the v1.6.4 step-6 lock, CF1802-08).
## ⚠ MODULE SCOPE: a helper belongs in the scope of its CALLERS, not its callees. _denyPress/_okPress
##   went inside the Fx IIFE next to playDeny and threw ReferenceError everywhere — three lines under
##   a comment warning about that exact trap.
## ⚠ RE-PIN PROCESS unchanged: field-diff proof → surgical single-probe re-pin → authorization
##   recorded in baseline.json repins[]. Never regenerate the baseline to make a failure pass.
## ⚠ DEPLOY = TWO PUSHES: deploy.js ships the SITE repo only; `git push origin main` syncs source.
## ⚠ LINE ENDINGS ARE PART OF THE BUILD CONTRACT — .gitattributes pins LF. Without it a fresh
##   clone on Windows (autocrlf=true) checks out CRLF, and make-probe-build.js cannot find the game
##   IIFE anchor "
})();
</script>" → validate/smoke/fingerprint/deploy-gate ALL fail, plus a
##   26,717-byte payload tax. Found 2026-07-29 by cloning cold and running the battery; the tool now
##   also tolerates CRLF. VERIFIED: a clone forced with core.autocrlf=true still checks out LF and
##   the full battery passes on it. If you ever touch .gitattributes, re-run that test.
## ⚠ DOC/CODE DISAGREEMENT IS A FINDING EITHER WAY. CF1802-09 (free cataloguing) was a case where
##   the GUIDE was right — "the survey reveals the roster; it catalogues nothing" — and the CODE
##   had drifted. Check which one is wrong before "updating" the doc.
##
## ═══ ▶ DOC MAP (all verified against the shipped build; markers current 2026-07-30) ═══
## Per-system docs current as of 2026-07-30: UI_PRESENTATION (+ THE ART-HOLD LAW) · DETERMINISM
## (+ render timing is not fingerprint input).
## Current as of 2026-07-29 (the v1.8.4 sweep): AUDIO (was NEW that batch — v1.8's whole audio layer
## had no doc) · PROGRESSION · SAVE_SYSTEM · QUESTS_AND_CHAPTERS · COMBAT_AND_CONQUEST ·
## BREEDING_AND_SHARING · CAPTURE_AND_BIOSPHERE · ECONOMY_LOOT_CRAFTING.
## Not touched since (still accurate, older markers): WORLD_GENERATION · RARITY_AND_GRADES ·
## SPECIES_AND_GENOME · ART_DIRECTION · BIOME_ATLAS.
## ★ THE BATTERY IS NOW SIX SUITES, not four — validate · smoke · uilayout · balance-sim, plus
##   bootperf.js (cold boot / answerability) and simrun `dom` (UI reachability). The first four gate
##   every batch and deploy.js enforces them; the last two are run on demand. tools/README.md
##   documents all six, including the two traps that made bootperf pass vacuously at first.
## Reviewer-facing: REVIEWER_NOTES_v1.8.2.md · REVIEWER_NOTES_v1.8.4.md (the round-7 response).
##   ⚠ There is NO REVIEWER_NOTES_v1.8.5.md — round 8 has not been asked for yet (NEXT #2). Write
##   one when it is, and lead with 2(e): their boot A/B must be re-run THROTTLED.
## ★ audits/ (NEW 2026-07-29) — external bundles are now COMMITTED, not left in a session-scoped
##   scratchpad: audits/round-7-v1.8.2/ (the 25-item fix list + evidence PNGs + their harness + the
##   1,000-session fleet, voice-model and boot-A/B raw data) and audits/battery-v1.8.2/ (the four
##   review lenses + raw results). audits/README.md indexes both and records how to recover an OLD
##   build from git to negative-control a new gate (uilayout.js --url=FILE).
##

## ▶▶▶ 2026-07-29/30 ★ v1.8.5 "FIRST TOUCH" LIVE (build e20d62c) — NEXT #6 + #7, then ship.
##   Nick: "go ahead and commit all items" → "push for now and the simrun tier" → "deploy it as 1.85".
##   THE PLAYER-VISIBLE CONTENT IS ONE FIX. Everything else this batch is instrumentation, and the
##   release notes say so (one 🐛 bullet + two 🔧 Under the Hood bullets).
##   ★ #6 THE COLD-BOOT OUTLIER WAS MISDIAGNOSED IN THIS VERY FILE. The old item read "may be page
##   cache warming on the larger file". The external round's OWN data ruled that out and we had all
##   of it: in their SLOW reps load=409ms and DCL=384ms — indistinguishable from the fast reps. The
##   file was fully downloaded, parsed AND executed at ~400ms every time. Cache warming would move
##   responseEnd/load/DCL; it moved none of them. The tell we had not drawn out: askExplorerName(true)
##   runs SYNCHRONOUSLY in boot, so the gate is in the DOM before DCL, and a visibility poll runs IN
##   THE PAGE — so the only way it reports late is a BLOCKED MAIN THREAD. Painted ≠ answerable.
##   ROOT CAUSE: the house "instant lo → async hi" art pattern. A new expedition calls startNewGame()
##   at +120ms → goTo()s Sol → queues one HD upgrade PER BODY plus the galaxy face, each a 300-800ms
##   block (n2 / fbm / renderPlanetSprite / makeGalaxySprite), ALL of it behind a full-screen naming
##   modal. 4x-throttled iPhone-class profile: painted 393ms, ANSWERABLE 6440ms, 5818ms blocked.
##   The returning player — who never builds a system — blocked 0ms, and THAT is what named the cause.
##   FIX `_hdLater()`: re-poll while _introUp() instead of rendering. 6440ms → ~1880ms. Precedent not
##   invention — toasts ALREADY wait on _introUp() (_toastQ, "held while the title / explorer-name
##   screen is up"). Determinism-safe BY CONSTRUCTION (sprites derive from seeds, not from when they
##   are drawn) — fingerprint MATCH 50/50 confirms it. Scope law honoured: _hdLater sits at game-IIFE
##   top level because its two callers live in DIFFERENT nested module IIFEs.
##   ★ #7 THE DOM TIER, and a CORRECTION to the old item's premise: "simrun drives PROBE HOOKS, not
##   the DOM" was half wrong. ui/chaos ALREADY drive the DOM and use the hook only to OBSERVE. It is
##   the EXPEDITION tiers (fast/deep/medium/veteran — the high-volume ones behind every metric) that
##   call ~28 hooks directly. THAT is the blind spot, and it is why a bot calling craftItem() could
##   never notice a dead Craft button: CF1802-07 and CF1802-09 both had to come from outside.
##   `dom` mode drives the real control and the press must LAND (before/after effect snapshot).
##   Findings kept apart: absent · disabled · dead. ADJUDICATING `dead` IS THE DESIGN — "pressed it
##   and nothing changed" is ALSO what an unavailable action looks like, so `dead` is recorded only
##   if the API then succeeds from the same state. A harness that cries wolf gets ignored.
##   ★★ THE LESSON OF THE BATCH — BOTH NEW GATES FOUND BUGS IN THEMSELVES FIRST, and neither found
##   one in the build. bootperf's first cut stopped observing at TTI, so a deliberate 1500ms block at
##   600ms reported 0ms and PASSED (a longtask census whose window closes at TTI is not a census);
##   its second control used setTimeout, which CANNOT preempt the parser, so it ran after the gate had
##   legitimately painted and proved nothing — only a SYNCHRONOUS block before the game <script>
##   manufactures a painted-but-unanswerable gate. The dom tier reported 141, then 106, then 85
##   findings across four iterations, EVERY ONE its own fault: a stale Shipyard (the bot mines via
##   H.mineWorld, which never fires the UI's ore-arrival re-render) and then the Research Bench being
##   up instead of the Fabricator (yardView renders ONE bench at a time and BOTH use .bset rows, so
##   the wrong one looks superficially like a rendered Fabricator — .fabgrp is the tell).
##   THAT IS SIX INSTANCES of a check passing while the thing it guarded was broken. NEW COROLLARY,
##   now in the process laws: WHEN A NEW INSTRUMENT FIRES, SUSPECT THE INSTRUMENT FIRST — and make
##   every finding carry its own diagnosis. "no control for {id}" was a bug report nobody could
##   action; adding the surrounding state (why()) cracked it in minutes.
##   BOTH GATES NEGATIVE-CONTROLLED BOTH WAYS against deliberately broken builds: bootperf 3611ms
##   exit 1 unfixed / 495ms exit 0 fixed (budget 900ms clear of both) · dom tier 183 dead when the
##   handler is neutralised, 178 absent when the attribute is renamed away, and it DISTINGUISHES the
##   two. The unfixed build came from git (the shipped v1.8.4), which is the cheapest control there is.
##   DOCS THIS BATCH: UI_PRESENTATION "THE ART-HOLD LAW" · tools/README (bootperf metrics table + the
##   dom tier + both traps) · codebase-reference (_hdLater + the battery table) · DETERMINISM (render
##   timing is not fingerprint input) · CLAUDE.md (the two new tools) · this file (hygiene + #6/#7).
##   ⏳ NOT DONE, DELIBERATELY, all measured: 6a the remaining ~1.9s is `(program)` ≈2s = V8 compiling
##   the 1.9MB inline script at 4x — the v2.0 PAYLOAD problem, and the best evidence yet for the
##   module split; 6b drawSystem burns ~416ms/boot painting BEHIND the modal, but frameInner also runs
##   epoch ticks / checkTransitions / queueSave and `picks` feeds hit-testing, so it is frame-loop
##   surgery for a partial win AND it changes what shows behind the intro (live vs frozen starfield),
##   which is Nick's art call; 7a dom coverage is `craft` only — capture/equip/feed/breed/heal need
##   panel/picker state the expedition never establishes and are reported as `uncovered`, never
##   silently skipped. NEXT most valuable there is `capture`, CF1802-09's own surface.

## ▶▶▶ 2026-07-26 ★ v2.0 ENGINE PLAN REVIEWED (upload: FULL_ENGINE...PORT_PLAN_v3.3_STACK_LOCKED
##   — TS + PixiJS 8 + Spine 2D + HTML/CSS(+React/Lit opt) + Vite + IndexedDB + Zod + WebAudio +
##   Vitest/Playwright; WebGL baseline, WebGPU opt-in). MY REVIEW (recorded for the arc):
##   ✔ ENDORSE the stack lock — matches the 2.0 assessment already on this roadmap (painterly
##     masters port as canvas→texture; hybrid DOM UI; deterministic core untouched).
##   ✔ §26 SEQUENCING ("cheap work first, port inherits validated answers"): STEP 1 IS ALREADY
##     SUBSTANTIALLY DONE — the plan was annotated against v1.7.0/1.7.3; since then 1.7.4→1.7.15
##     shipped the legibility/onboarding/a11y work it prescribes (keyboard canvas w/ survey
##     credit, aria-live, focus mgmt + inert, panel model, objective chip). The port inherits a
##     VALIDATED design, per the plan's own argument. Its "freeze" framing is obsolete — we
##     never froze and shipped 12 releases; recommend NO freeze until Phase-4 parity.
##   ✔ §26 STEP 2 (the falsifiable Canvas2D visual prototype — planet rotation + ring occlusion,
##     re-run personas, compare vs the +0.79 legibility delta): ADOPT — run it DURING v1.8 as its
##     own two-week spike. Either outcome is decisive and cheap.
##   ✔ §27.3 DETERMINISM LANDMINE: correct in principle, but the LOCKED STACK largely defuses it
##     — TypeScript compiles to the SAME JS numerics (doubles, int32 bitwise, mulberry32/hashInt
##     integer paths), so bit-identity survives TS migration nearly free. The cross-language
##     conformance suite (10k golden seeds in CI) matters only if D2 (Unreal/Unity) ever reopens
##     — adopt it as a cheap insurance line in Phase 0 anyway. Render seeds vs identity seeds:
##     already our law.
##   ✔ ACCESSIBILITY TO PHASE 4: agree — and it's already BUILT here, which is the strongest
##     version of that argument (retrofit cost paid once, in the cheap codebase).
##   ✔ D4 "AI AS THE ARTIST": the described loop (rubric → generate → vision critique → revise
##     the GENERATOR → diff on fixed seeds) is literally this project's proof-sheet workflow —
##     the §28.5 call to write the ART-DIRECTION DOC + GOLDEN SCREEN first is right; ART_DIRECTION.md
##     exists in-repo and should be ELEVATED to the port rubric (highest-leverage open item).
##   ⚠ HONESTY ON TIMELINE: team is not 5-7 people — the solo/duo rows (20-34/15-24 months
##     hand-built) govern, BUT the D4 generator model + this session's throughput argue those
##     rows overstate: art is generators not assets here. Plan by MILESTONE GATES, not calendar.
##   ⚠ AUDIO WEIGHTING (§15 = 904 lines, evidence-blind): Nick already moved a SMALL audio pass
##     into v1.8 — that IS the audio playtest the annotation demands. Ship it cheap, measure,
##     THEN size §15.
##   ⚠ PLAN'S AUDIT DRIFT (15-tier ladder, 21.8k lines): re-run all §3 counts against v1.7.15
##     before Phase 0 (now ~25k lines, 10-tier ladder, +_GEAR_ART layer).
##   ▶ SEQUENCE INTO OUR ARCS: v1.8 Connection (+ audio pass + §7 visual spike) → v1.9
##     consolidation = PHASE 0/1 (module split BECOMES the TS extraction; save schema/Zod +
##     share-code migration policy; payload budget gate; art-direction doc + golden screen) →
##     v2.0 port Phases 2+ under the milestone gates. §28.5's "nothing blocks Phase 1" is right.