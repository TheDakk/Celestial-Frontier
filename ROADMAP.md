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
## ★ PROCESS_LAWS.md (extracted from this file 2026-07-30) is the other standing reference —
## READ IT BEFORE TOUCHING UI OR TESTS. Same discipline: refreshed in place, never archived.

## 📌 PINNED — ROADMAP HYGIENE (Nick, 2026-07-21): KEEP THIS FILE LEAN. This doc holds ONLY the
## live SESSION HANDOFF (state / what's done / NEXT backlog / process). Completed batch logs and
## superseded handoff blocks live in `ROADMAP_ARCHIVE.md` (history + traceability, nothing deleted).
## RULE, run at the END OF EACH ARC (or whenever this file grows past ~400 lines): move every batch
## block older than the current one to the TOP of the archive's batch section, verbatim, then refresh
## the SESSION HANDOFF here so WHAT'S DONE / NEXT reflect reality. Rewrite the handoff in place — the
## roadmap stays a one-screen read. History is one file away, git-diffable. (Split first done 2026-07-21
## when this crossed ~285KB / 4,272 lines and stopped reading in one pass.)

## ▶▶▶ SESSION HANDOFF — as of 2026-07-31. ★ v1.8.8 "PAID FOR PLAYING" IS LIVE ◀◀◀
## [HYGIENE 2026-07-31] The v1.8.6 batch block moved VERBATIM to the top of ROADMAP_ARCHIVE.md
##   (this file had reached 443 lines; it is ~348 now). It is kept in full for one reason worth
##   naming: it is the clearest example on record of TWO CORRECT FIXES FOR ONE BUG, SHIPPED
##   TOGETHER, THAT DISAGREE — its own CF1805-06 entry describes both halves approvingly.
##   Structure is pins → this handoff → NEXT → doc map → the v1.8.7 batch log → the v2.0 plan.
##   PROCESS_LAWS.md (extracted 2026-07-30) holds the laws; it is a reference and is never archived.
##   Source AND site pushed; full battery green; live verified end-to-end after deploy, not assumed.
##
## ═══ WHERE THINGS STAND ═══
## ★ TWO RELEASES SHIPPED 2026-07-31, in order. READ BOTH BATCH LOGS.
##   · v1.8.7 "True to Form" — the round-9 response, and above all a REGRESSION FIX. Round 9
##     reviewed v1.8.6 hunk by hunk and caught that ONE LINE WE HAD SHIPPED WAS CORRUPTING LIVE
##     SAVES: v1.8.6 fixed `size` TWICE, in the same release, and the two fixes disagreed. ~12% of
##     bred creatures were being rewritten into titanic, maximum-vitality ones on their next load.
##   · v1.8.8 "Paid for Playing" — ★ CF1805-05 CLOSED, on Nick's design call ("yield tracks
##     engagement rather than the wall"). THE PREVIOUS ENTRY HERE SAID THIS WAS "NOT CLOSABLE
##     OFFLINE", and that was true only of the WALL CLOCK. Harvest now runs on COSMIC_EPOCH — a
##     persisted, monotonic PLAY-TIME accumulator the game has used for biosphere recovery since
##     v1.7 — so there is no Date.now() left in the path to defend. Three rounds of mitigations
##     were replaced by removing the untrustworthy clock instead of hardening around it.
##     ⚠ THE LESSON: when a defence keeps failing, check whether you are defending the wrong thing.
##   ═══ THE LESSON COUNT, WHICH IS THE POINT OF THIS SECTION ═══
##   SEVEN times a check here has passed while the thing it guarded was broken — and round 9 added
##   FOUR MORE green-but-wrong states in a single afternoon, all in ONE new gate and its fix:
##   a key collision that clobbered another check; a pass that measured EMPTY surfaces (which
##   collapse under the very min-height:0 the fix sets); a pass reading a CSS var left at the
##   previous pass's value; and then the CSS fix itself, placed EARLIER in the sheet than the rule
##   it had to override, at equal specificity, so it did nothing. Each was caught only by running
##   the check against the BROKEN build and demanding it fail.
##   THE LAWS THAT FOLLOW, now in PROCESS_LAWS.md: WHEN A NEW INSTRUMENT FIRES — OR PASSES —
##   SUSPECT THE INSTRUMENT FIRST · REPRODUCE THE REPORTED GEOMETRY, NOT A CONVENIENT ONE ·
##   ASSERT THE OUTCOME, NOT THE CODE PATH · TWO CORRECT FIXES FOR ONE BUG CAN DISAGREE.
## LIVE: v1.8.8 "Paid for Playing" at https://celestialfrontier.github.io/ (shipped 2026-07-31) —
##   CF1805-05 CLOSED: harvest now runs on PLAY time, so the last open exploit has nowhere to
##   stand. Predecessors: v1.8.7 "True to Form" (4ee4016, the round-9 regression fix), v1.8.6 and
##   v1.8.5 — three releases in two days, each answering an external round.
## GATES AT SHIP (v1.8.8): validate 9/9 · fingerprint MATCH 50/50 · smoke 553/0 · uilayout
##   787 checks / 10 viewports (was 763 — the new training-DOCK pass) · balance PASS ·
##   simrun dom 0 findings · duelxp 6/0 · sizedrift 4/4 · harvestclock 5/5. bootperf NOT re-run: nothing
##   in this batch touches boot, art scheduling or the first-run path (v1.8.5's PASS still stands).
## ARC STATE: v1.7 "The Forge" COMPLETE and archived. v1.8 "The Connection" COMPLETE
##   (v1.8.0 arc → v1.8.1/.2 playtest → v1.8.3 external battery → v1.8.4 round 7 → v1.8.5
##   the cold-boot fix → v1.8.6 round 8 → v1.8.7 round 9 → v1.8.8 the harvest clock). Older batch
##   logs are in ROADMAP_ARCHIVE.md.
## SAVE FIELDS added across v1.8: vce/cbx (audio toggles), xpf (one-shot XP ledger), and
##   ★ v1.8.8 conq[].e (the epoch at last harvest). All absent-safe. No shape change in .4/.5/.6/.7.
##   ⚠ conq[].e ABSENT ⇒ READY, so a pre-v1.8.8 empire pays one cycle per world on first load —
##   deliberate and one-time. On load it is clamped to [0, EPOCH_BASE]: a future-epoch save would
##   otherwise hold a world hostage forever.
##   ⚠ SAVE-VALUE clamps, stated carefully because this is where v1.8.6 went wrong: `fed` and
##   `brood` ARE clamped to 200 at their mutation sites (every consumer already enforced that
##   ceiling, so it only stops the card quoting a number the game does not honour). `size` is
##   **NOT** clamped and MUST NOT BE — v1.8.6 clamped it and permanently rewrote ~12% of bred
##   creatures. See SAVE_SYSTEM.md's v1.8.7 section; guarded by tools/sizedrift-check.js.
## ⚠ TITLE CAVEAT (FOUR releases running): "Paid for Playing", "True to Form", "Kept Promises"
##   and "First Touch" were all CHOSEN BY CLAUDE. Nick has never named one and has never objected,
##   but he has never been asked either. One string in RELEASES[0] + a redeploy. ASK next time.
##
## ═══ ▶ NEXT — the actionable list, highest value first ═══
## 1. ★ NICK'S iPHONE / iPAD RE-VERIFY of v1.8.8 — now FOUR things, and (c)/(d) are the ones no
##    instrument has ever seen:
##    (a) training steps 5 / 6 / 7, still unverified on a device since the v1.8.3 fix;
##    (b) the FIRST 10 SECONDS of a brand-new expedition. v1.8.5 took the naming screen from
##        unanswerable-for-6.4s to ~1.9s on a 4x-throttled profile — the window a new player
##        judges the game in. Clear the save (or a fresh browser profile) so it is a genuine
##        first run;
##    (c) ★ TRAINING STEP 8 ON AN iPAD — "open a shelf, then tap a specimen", AND the DOCK on a
##        small phone at step 20. Two different v1.8.x fixes meet here (CF1805-01 buried the lesson
##        card; CF1806-02 buried the dock behind the board that fixed it), and both were found on
##        real hardware by an outside party, never by us.
##        ⚠ DO NOT expect the step-8 STALL RATE to move: round 9 RETRACTED its own round-8 claim
##        that CF1805-01 caused it. The card went 0% -> 100% reachable and the stall rate did not
##        budge (25% -> 27%), so the burial was real and was not what was walling players. Their
##        driver is weakest exactly there, so step 8 is currently UNMEASURED, not defective.
##        What a device pass can settle that no instrument has: whether a human gets past it.
##    (d) ★ NEW — THE HARVEST CADENCE, PLAYED. v1.8.8 moved harvest onto PLAY time
##        (HARVEST_EPOCHS=2 ≈ 40 min of exploring per world). The gate proves it cannot be wound
##        and that readiness arrives; it CANNOT tell you whether the cadence FEELS right. Play a
##        real session with a few settled worlds and answer one question: does the empire pay often
##        enough to feel worth conquering, without paying so often it trivialises stardust?
##        HARVEST_EPOCHS is the single knob. This is a balance call and it is yours.
## 2. ✔ EXTERNAL ROUND 8 — DELIVERED 2026-07-30, and answered the same day (see the batch log).
##    TWO independent bundles arrived: the round-8 fleet review (18 archetypes · 12 goal-directed
##    verbs · 214 sessions, 7 new CF1805-xx items) and a separate full-battery audit (1,000
##    synthetic profiles, its own P0). 15 of 25 round-7 items verified fixed — their best ratio in
##    eight rounds — and the mobile training wall confirmed dead from the PLAYER side: stall points
##    5 and 7 vanished entirely, and 41 of 117 sessions now reach step 8 against 15 of 498 before.
##    ⚠ WHAT THEY ASKED FOR THAT WE STILL OWE: (d) physical iOS/iPadOS Safari, still outside both
##    harnesses; and (e) their boot A/B re-run THROTTLED — they did not run it this round, so the
##    cold-boot fix is still verified only by our own instrument. Both carry into round 9.
##    ⚠ 2(a) IS NOW MOOT AND WORTH KNOWING WHY: we asked for a MULTI-SESSION lineage probe because
##    one session could not tell "pays once per pair, ever" from the old bug. They found the answer
##    by READING it instead — the key was per-individual, so it could never repeat. A code read beat
##    the probe we specified. Ask for both next time.
##    THE ORIGINAL ROUND-8 ASK, for reference:
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
## 6. ✔ COLD-BOOT — DIAGNOSED AND FIXED, SHIPPED IN v1.8.5. It was NOT cache warming; the
##    external round’s own data ruled that out (load/DCL identical in their slow reps). It was HD
##    sprite synthesis behind the first-run naming screen: 4x-throttled, the gate painted at 393ms
##    and would not answer a tap until 6440ms. `_hdLater()` fixed it (TTI ~1.9s) and tools/bootperf.js
##    was built to measure it. FULL STORY + both negative controls: ROADMAP_ARCHIVE.md, the v1.8.5
##    batch block. Still open below as 6a / 6b.
## 6a. REMAINING 1905ms is dominated by `(program)` ~2s = V8 compiling the 1.9MB inline script at
##    4x throttle. That is the PAYLOAD problem the v2.0 port plan already owns (payload budget
##    gate, Phase 0) — not a boot bug. Best evidence yet for prioritising the module split.
## 6b. `drawSystem` burns ~416ms/boot painting the world BEHIND the full-screen naming modal
##    (78% opaque + 6px blur). Skipping the painter while _introUp() would recover most of it, but
##    frameInner also runs gameplay logic (epoch ticks, checkTransitions, queueSave) and `picks`
##    feeds hit-testing, so it is frame-loop surgery for a partial win — and it changes what the
##    player sees behind the intro (live starfield vs frozen), which is Nick's art call. NOT DONE.
## 7. ✔ DOM-DRIVEN simrun tier — BUILT AND SHIPPED in v1.8.5 as `node tools/simrun.js dom N`.
##    The EXPEDITION tiers call ~28 probe hooks directly, so they could never see a control that is
##    absent / disabled-but-possible / present-with-no-handler. A press must be proven to LAND by a
##    before/after effect snapshot, and `dead` is recorded only if the API then succeeds from the
##    same state — a harness that cries wolf gets ignored. FULL STORY, the design of the `dead`
##    adjudication, both negative controls and the four phantom-finding iterations: ROADMAP_ARCHIVE.md,
##    the v1.8.5 batch block. ⚠ SCOPE: jsdom has NO LAYOUT — this proves a LIVE HANDLER, not that the
##    control is on screen. uilayout.js owns that half; neither covers reachability alone.
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
## 11. ⚠ NEW, FOUND BY THE ROUND-9 GATE AND NOT FIXED: on laptop/desktop/ipad-land, a raised
##    training board overlaps #codexbtn and #chbtn. PRE-EXISTING — v1.8.5 reports the same 2
##    controls buried, so it is NOT the CF1806-02 regression and was deliberately not folded in
##    behind that name (a gate that conflates two defects behind one label teaches nobody
##    anything). Above 900px those ids are RAIL buttons, not a dock, so the right assertion is a
##    different one. The dock pass is scoped <=900px until someone decides what desktop should do.
## 10. THEN v1.9 CONSOLIDATION = PORT PHASE 0/1 → v2.0 PixiJS. See the v2.0 block at the bottom
##    of this file: save schema + Zod, module split BECOMES the TS extraction, payload budget gate,
##    ART_DIRECTION.md elevated to the port rubric + a golden screen. Also still open from that
##    review: the falsifiable Canvas2D visual spike (§26 step 2), and re-running the plan's §3
##    counts against the current build before Phase 0 (it audited ~21.8k lines / a 15-tier ladder;
##    we are now ~25k lines / 10-tier + a _GEAR_ART layer).
##
## ═══ ▶ PROCESS LAWS — MOVED 2026-07-30 ═══
## ★ They now live in PROCESS_LAWS.md, verbatim. READ IT BEFORE TOUCHING UI OR TESTS.
## Why it moved: at 88 lines it was the largest section in a file whose pin says it holds ONLY the
## live agenda — and being a REFERENCE rather than a log, the hygiene rule could never archive it
## (CLAUDE.md: “logs archive, references refresh”). It was growing every batch and sinking the
## agenda beneath it. In its own doc it gets refreshed in place instead.
## The headline four, so a cold start knows what it is walking into:
##   1. WHEN A NEW INSTRUMENT FIRES — OR PASSES — SUSPECT THE INSTRUMENT FIRST (7 instances).
##   2. ASSERT THE OUTCOME, NOT THE CODE PATH (the +8 duel win had never paid in any build).
##   3. PAINTED ≠ ANSWERABLE (a gate can be drawn, hit-testable and unable to respond).
##   4. ONE ID BEATS ANY NUMBER OF CLASSES — and in CSS, min-height beats max-height.

## ═══ ▶ DOC MAP (all verified against the shipped build; markers current 2026-07-30) ═══
## THE NINE SYSTEM DOCS the v1.8.6 sweep touched (plus the codebase reference) are marked
##   2026-07-30 and were re-verified against the SHIPPED build, not against the diff:
##   UI_PRESENTATION (+ THE ART-HOLD LAW, + THE TRAINING
##   LAYOUT CONTRACT) · DETERMINISM (+ why three changes to generated content did NOT move the
##   fingerprint) · COMBAT_AND_CONQUEST (odds signature, the `size` term) · PROGRESSION (the awards
##   that were advertised and never paid) · ECONOMY_LOOT_CRAFTING (two clock exploits, and why only
##   one closed) · SAVE_SYSTEM (the clamp list was a record of past incidents, not a trust boundary)
##   · AUDIO (five wrong moduli; the Bat ceiling is STILL OPEN and the population number hid it) ·
##   QUESTS_AND_CHAPTERS (both v1.8.4 fixes grew a tail; step count corrected 20/18 → 21) ·
##   BREEDING_AND_SHARING (the lineage key has now been wrong twice, in opposite directions) ·
##   celestial-frontier-codebase-reference (§2 rewritten — see below).
## Not touched by this sweep, checked and still accurate: CAPTURE_AND_BIOSPHERE (2026-07-29 — the
##   `fed` clamp is documented at `feedPair` in BREEDING_AND_SHARING, which is where feeding lives;
##   it is deliberately NOT duplicated here) · WORLD_GENERATION · RARITY_AND_GRADES ·
##   SPECIES_AND_GENOME · ART_DIRECTION · BIOME_ATLAS.
## ★ THE BATTERY IS NOW SEVEN SUITES, not four — validate · smoke · uilayout · balance-sim gate
##   every batch (deploy.js enforces them); bootperf.js (cold boot / answerability), simrun `dom`
##   (UI reachability) and duelxp-check.js (reward OUTCOMES) run on demand. tools/README.md
##   documents all seven, including the traps that made bootperf pass vacuously and the one that
##   made the training-card gate pass by accident.
## ⚠ THREE STALE CLAIMS FOUND AND KILLED IN THE 2026-07-30 SWEEP, all in preambles nobody re-reads —
##   which is exactly where drift hides, and the same pattern the previous sweep found:
##   (1) codebase-reference §2 listed `node tools/extract.js` as STEP 1 of the everyday workflow.
##       That is the single most dangerous stale instruction this repo has carried — extract.js
##       regenerates main.js FROM the html and silently discards every edit since the last build.
##       CLAUDE.md rule 4 has warned about it for some time while this file recommended it.
##       Same section also had the html at "~8,000 lines, ~462 KB, one <style>, script ~line 948"
##       (really ~26,750 / 1.93 MB / TWO <style> / ~line 2,420) and a "49-probe" fingerprint (50).
##   (2) The Field Training step count was wrong in FOUR docs at once (18 / 20 / "literal /18"),
##       and QUESTS_AND_CHAPTERS carried it as a documented "known discrepancy" that vouched for
##       CLAUDE.md — which said 21. It is 21, rendered from `TUT_STEPS.length`.
##   (3) README described a "20-step" tutorial two lines from its own "21-step" reference.
## Reviewer-facing: REVIEWER_NOTES_v1.8.2.md · REVIEWER_NOTES_v1.8.4.md (round 7) ·
##   ★ REVIEWER_NOTES_v1.8.6.md (round 8, written 2026-07-30 — READY FOR ROUND 9). It leads with
##   what we fixed, then §2 what we did NOT fix and why (CF1805-05 is open BY DECISION and their
##   proposed fix is not implementable), §3 where their reports were incomplete AND the one place
##   we were wrong about them, §4 our own gate failing its control, and §5 what we want next.
##   ⚠ THE TWO STANDING ASKS THEY HAVE NOT DELIVERED: physical iOS/iPadOS Safari (three rounds
##   running) and their cold-boot A/B RE-RUN THROTTLED — they skipped it in round 8, so the
##   v1.8.5 boot fix is still verified only by our own instrument. Lead round 9 with both.
##   ⚠ There is NO REVIEWER_NOTES_v1.8.5.md and there never will be — round 8 audited v1.8.5 and
##   our response shipped as v1.8.6, so the notes are numbered for the build that ANSWERS a round,
##   not the one that was audited. (v1.8.4 followed the same rule for round 7.)
## ★ audits/ (NEW 2026-07-29) — external bundles are now COMMITTED, not left in a session-scoped
##   scratchpad: audits/round-7-v1.8.2/ (the 25-item fix list + evidence PNGs + their harness + the
##   1,000-session fleet, voice-model and boot-A/B raw data) and audits/battery-v1.8.2/ (the four
##   review lenses + raw results). audits/README.md indexes both and records how to recover an OLD
##   build from git to negative-control a new gate (uilayout.js --url=FILE).
##

## ▶▶▶ 2026-07-31 ★ v1.8.8 "PAID FOR PLAYING" — CF1805-05 CLOSED. THE LAST OPEN EXPLOIT.
##   Nick: "Should we yield track engagement rather than the wall... I want to get these fixes in so
##   we can move with the port over." → "go ahead with 1.8".
##   ★ THE ANSWER WAS ALREADY IN THE CODEBASE. Rounds 7, 8 and 9 chased a wall-clock harvest exploit
##   through THREE mitigations (CF1802-14's in-session monotonic gate, _hvFloor's load clamp,
##   CF1805-07's rate limit) and none could close it — because the defect was never in the guard,
##   it was in the CLOCK. An offline game cannot verify Date.now().
##   COSMIC_EPOCH is a PERSISTED, MONOTONIC PLAY-TIME accumulator: EPOCH_BASE (saved as `epoch`)
##   plus perfTime()/EPOCH_TICK this session. It never reads the OS clock, survives a reload, and
##   cannot be wound. BIOSPHERE POOLS AND EVOLUTION HAVE RUN ON IT SINCE v1.7, when EPOCH_TICK was
##   deliberately slowed 240→1200 as an ANTI-FARM change. Harvest was the ONLY regeneration system
##   still keyed to the wall. So this is not a new mechanic — it makes the outlier match the pattern
##   the game already chose, and there is no Date.now() left in the path to defend.
##   · HARVEST_EPOCHS=2 (~40 min of PLAY per world) is the single knob. An engaged player earns
##     slightly FASTER than the old 1-hour wall cadence; an idle one no longer accrues while away.
##     "The empire pays you for playing, not for waiting."
##   · SAVE: `conq[].e` is additive and ABSENT-SAFE — a ≤v1.8.7 empire reads ready and pays one
##     cycle per world on first load (deliberate; the alternative penalises it for our change).
##     On load `e` is clamped to [0, EPOCH_BASE] — a future-epoch save would hold a world hostage.
##   · ONE PREDICATE, FOUR CALL SITES. `_harvestReady` is read by the button face, the survey card,
##     the panel cache key AND doHarvest. That is the round-9 lesson applied prospectively: v1.8.6
##     computed the same truth about `size` in two places and they disagreed. A world can no longer
##     look ready and then refuse.
##   · COPY: the Guide, both tooltips and the conquest toast no longer promise an hourly harvest.
##     ⚠ Release-note history (v1.7/v1.8 entries) still says "hourly" and MUST STAY — those are
##     accurate records of what those releases shipped.
##   · `_hvMono` deleted. `HARVEST_CD` survives only as the load-path DISPLAY clamp and gates nothing.
##   NEW GATE tools/harvestclock-check.js — winds a simulated device clock forward a FULL DAY and
##   asserts no payout, then asserts readiness DOES arrive on play time, then that HARVEST_CD is
##   gone from doHarvest entirely. 5/5 here; on v1.8.7 it reports 3 failures including the payout.
##   ⚠⚠ AND IT CAUGHT ITSELF FIRST, AGAIN. Its original last check ("Date.now() is never compared to
##   HARVEST_CD") PASSED on v1.8.7 where the exploit was live, because the two sit on different
##   statements. A check that passes for the wrong reason is worse than none — replaced with
##   "HARVEST_CD does not appear in doHarvest", which discriminates.
##   GATES: validate 9/9 · fingerprint MATCH 50/50 · smoke 553/0 · uilayout 787/10 · balance PASS ·
##   duelxp 6/0 · sizedrift 4/4 · harvestclock 5/5.
##   ⚠ TITLE: "Paid for Playing" chosen by Claude (fourth running). Nick has still never named one.
##   ▶ NEXT PER NICK: gather more external reviews to double-check this batch, THEN Phase Zero.

## ▶▶▶ 2026-07-31 ★ v1.8.7 "TRUE TO FORM" — ROUND 9 RESPONSE. A REGRESSION FIX, and it was OURS.
##   Nick: "I think we finally got some great feedback... Check this out." → "Yes please let's do it."
##   Round 9 reviewed v1.8.6's 152-line delta hunk by hunk and closed 6 of 7 round-8 findings, two
##   "better than I asked for". It also found that ONE LINE WE SHIPPED WAS CORRUPTING LIVE SAVES.
##   ★★ CF1806-01 — THE HEADLINE, AND THE MOST IMPORTANT THING IN THIS BLOCK.
##   v1.8.6 shipped TWO fixes for ONE problem and they contradicted each other: battleStats began
##   WRAPPING `size` (% FA_SIZE.length) and _sanitizeSavedGenome began CLAMPING it to 0-5.
##   crossGenome mutates `size` and never wraps it, so HONEST saves carry size>5 — measured on our
##   own functions at 12.4% of lineages by generation 5 (max 10). The clamp rewrote every one of
##   them PERMANENTLY on the next load: a "tiny" size-6 creature came back "titanic" with vit 70,
##   and its portrait scale, voice pitch and Size-Classes slot moved with it. A share code exported
##   before the reload no longer matched one exported after.
##   AND THE CLAMP BOUGHT NOTHING: its own justification was a crafted size:1e6 save, and the wrap
##   in the SAME release already closed that — measured, 1e6 yields vit 66 against a LEGITIMATE
##   maximum of 70. Deleted. Guarded by tools/sizedrift-check.js, which FAILS on v1.8.6
##   (size 9 -> 5, vit 80 -> 88) and passes here.
##   ⚠ ONE WRINKLE THE REVIEW MISSED, worth knowing before anyone "finishes" this: `size` is NOT
##   uniformly wrapped. speciesGrade/rarityRoll/sapience read it RAW (>=3/>=4/>=5), so a stored 6
##   is NOT equivalent to a stored 0 (vit 50 vs 37) — wrapping at LOAD would also rewrite honest
##   data, just less visibly. The drift is a BALANCE question and crossGenome is a fingerprint probe.
##   ═══ ALSO FIXED ═══
##   · CF1806-02 (P1, phones) — our v1.8.6 training-layout rule released `bottom` (those boards are
##     pinned bottom:142px precisely to clear the dock) and reserved a flat 24px, so a raised board
##     grew straight down over the dock: iPhone SE and Galaxy S8 measured 0% reachability on ALL SIX
##     dock controls at step 20. Fixed with a --tut-dock variable (126px below the 900px breakpoint,
##     24px above), NOT a second rule — see the process law below for why the obvious fix failed.
##   · CF1806-04 — v1.8.6's chip repaint made the chip VANISH for a player with no objective, the
##     exact population CF1802-03 exists for. An objective-less player now gets a suggestion
##     unconditionally, which is what CF1802-03 always claimed to do (it was still half-gated).
##   · CF1806-03 — the weekly-charter limit costs ONE RELOAD, not ten monotonic minutes; _chRollMono
##     is a module `let` and resets per load. The CODE is unchanged and correct; the COMMENT now
##     states the real bound. Round 8's wording overstated it — which is round 8's own pattern.
##   · Round-9 §2.5 smalls: the lineage-pair key is keyed on the GENOME (_earthName || speciesName)
##     instead of the player-renamable display name; trueOdds no longer rebuilds the invariant
##     native battleStats once per picker row (the P0 rekey had moved the cache check below it).
##   ═══ THE GATE THAT MISSED CF1806-02, AND WHAT IT COST TO FIX ═══
##   uilayout.js now asserts EVERY DOCK CONTROL is topmost at its own coordinates while each of the
##   four boards is raised, on every viewport <=900px (763 -> 787 checks). Scoped there on purpose:
##   above the breakpoint those ids are rail buttons and laptop/desktop report overlaps on v1.8.5
##   TOO — pre-existing, filed as NEXT #11, deliberately not folded in behind the same name.
##   ⚠⚠ IT TOOK THREE CORRECTIONS BEFORE IT MEASURED ANYTHING REAL, and in its first two forms it
##   PASSED against the shipped v1.8.6 the round had already proven broken: (a) a key collision
##   (out.dockAtlas was taken) that silently clobbered an existing check; (b) it measured EMPTY
##   boards, which collapse under the very min-height:0 the fix sets and never reach the dock;
##   (c) it read --tut-bot left at the DODGED value (53px) from the previous pass. Then the FIX
##   itself failed its own gate — the first CSS attempt was a duplicate rule EARLIER in the sheet
##   with equal specificity, so it lost. Four green-but-wrong states in one afternoon.
##   ═══ STILL OPEN FROM ROUND 9 ═══ CF1802-08 (renderCodex byte-identical for a THIRD build —
##   dismissing a specimen still closes the Compendium) · CF1802-17 (a hybrid of two well-fed
##   parents still starts fed=0; disclosed, not fixed) · CF1805-05 harvest (open BY DECISION).
##   ═══ THE GOOD NEWS ═══ THE AUDIO ARC IS CLOSED. Their 200k-genome re-run: distinct voices
##   533/20,000 -> 199,707/200,000; creatures sharing a voice 97.3% -> 0.15%; a 50-creature
##   collection holding a duplicate 91.3% -> 0.6%. The listening test's precondition is met (NEXT #3).
##   Rage quits fell for a SECOND consecutive build (112.5 -> 76.4 -> 71.4 per 1000, deep tier).
##   ⚠ AND THEY RETRACTED A HEADLINE OF THEIR OWN: round 8 blamed the step-8 training wall on
##   CF1805-01. The card is now measurably readable (0% -> 100%) and the stall rate did NOT move
##   (25% -> 27%). The burial was real and fixing it was right; it was not the cause of that number.
##   Step 8's stall rate is currently UNMEASURED, not defective — their driver is weakest exactly
##   there. Do not treat 26/98 as a known bug.
##   ⚠ TITLE: "True to Form" was CHOSEN BY CLAUDE again. Nick said "Yes please let's do it" without
##   naming one; flagged rather than blocked on. One string in RELEASES[0] + a redeploy to change.

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