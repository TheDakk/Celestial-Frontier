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

## ▶▶▶ SESSION HANDOFF — as of 2026-07-30. ★ v1.8.6 "KEPT PROMISES" IS LIVE (build 0bfc904) ◀◀◀
## [HYGIENE 2026-07-30, second run today] Two moves, and the second one is structural.
##   (1) The v1.8.5 batch block moved VERBATIM to the top of ROADMAP_ARCHIVE.md (this file had
##   reached 496 lines). Earlier the same day the v1.8.3 + v1.8.4 blocks were archived on the
##   v1.8.5 ship, and the shipped NEXT items 6 / 6c / 7 were collapsed to pointers — their full
##   story, including every negative control, is in that archived block.
##   (2) ★ PROCESS LAWS MOVED OUT to **PROCESS_LAWS.md**. At 88 lines it was the largest section
##   in a file whose own pin says it holds ONLY the live agenda, and it grew every single batch.
##   Archiving could never fix it: the laws are a REFERENCE, not a log, and CLAUDE.md's hygiene
##   principle is "logs archive, references refresh". The agenda was sinking underneath them.
##   THIS FILE IS NOW 363 LINES, comfortably inside the ~400 pin, and the reduction is structural
##   rather than a trim — nothing was shortened, one thing was put where it belongs.
##   Structure is pins → this handoff → NEXT → doc map → the v1.8.6 batch log → the v2.0 plan.
##   Source AND site pushed; full battery green; live verified end-to-end after deploy, not assumed.
##
## ═══ WHERE THINGS STAND ═══
## ★ v1.8.6 "KEPT PROMISES" SHIPPED 2026-07-30 — the external round-8 response, written and
##   deployed the SAME DAY the feedback landed. Nick: "Let's go ahead deploy, version bump, and
##   get ready for more testing." 12 fixes from TWO independent audit bundles + 2 new instruments.
##   READ THE 2026-07-30 BATCH LOG FIRST. It carries what was deliberately NOT fixed and why —
##   including CF1805-05 (harvest), which is NOT CLOSABLE offline and needs a DESIGN DECISION,
##   not a patch. Do not "fix" it in a later session without reading ECONOMY_LOOT_CRAFTING's
##   2026-07-30 addendum, which is where that argument is written out in full.
##   THE TWO HEADLINES: (1) v1.8.4's own P0 fix had a MIRROR IMAGE — raising a lesson's surface
##   also raised it above the lesson CARD, so on iPad mini step 8 the instruction and its Skip
##   button were 0% reachable, 63/63 blocked by #codex; (2) THE +8 DUEL WIN HAD NEVER PAID IN ANY
##   BUILD — round 7 derived a correct identity, guarded on it, and awarded to a different one.
##   ⚠ SEVEN instances now of a check passing while the thing it guarded was broken. The newest is
##   the sharpest: our new reachability gate AGREED WITH THE BUG REPORT BY ACCIDENT, measuring a
##   top-pinned lesson card when the reported one had DODGED to the bottom, so it came back clean
##   on the very case it was written for. The corollary is upgraded: WHEN A NEW INSTRUMENT FIRES
##   — OR PASSES — SUSPECT THE INSTRUMENT FIRST, and reproduce the REPORTED geometry, not a
##   convenient one. Its sibling: ASSERT THE OUTCOME, NOT THE CODE PATH — smoke.js had a duel-XP
##   check that called awardXP() directly, which is exactly why a reward the game never granted
##   passed it in every build.
## LIVE: v1.8.6 "Kept Promises" at https://celestialfrontier.github.io/ (shipped 2026-07-30).
##   The predecessor was v1.8.5 "First Touch" (build e20d62c), live for one day.
## GATES AT SHIP (v1.8.6): validate 9/9 · fingerprint MATCH 50/50 · smoke 553/0 · uilayout
##   763 checks / 10 viewports (was 683 — the new training-card reachability pass) · balance PASS ·
##   simrun dom 2,452 presses / 0 findings · duelxp-check 6/0. bootperf NOT re-run: nothing in this
##   batch touches boot, art scheduling or the first-run path (v1.8.5's PASS still stands).
## ARC STATE: v1.7 "The Forge" COMPLETE and archived. v1.8 "The Connection" COMPLETE
##   (v1.8.0 arc → v1.8.1/.2 playtest → v1.8.3 external battery → v1.8.4 round 7 → v1.8.5
##   the cold-boot fix + two new gates → v1.8.6 the round-8 response). v1.8.3/.4 batch logs are
##   in ROADMAP_ARCHIVE.md.
## SAVE FIELDS added across v1.8: vce/cbx (audio toggles), xpf (one-shot XP ledger). All
##   absent-safe. NO save-shape change in v1.8.4 (the monotonic harvest guard is in-memory),
##   NONE in v1.8.5 (the art hold is pure scheduling) and NONE in v1.8.6 — but note that v1.8.6
##   CLAMPS two live fields on save/load (`fed`, `brood` to 200; `size` to 0-5), so a save that
##   was carrying an out-of-range value will read back clamped. That is the intended fix, not drift.
## ⚠ TITLE CAVEAT (now twice running): "Kept Promises" — like "First Touch" before it — was
##   CHOSEN BY CLAUDE, not specified. Nick asked only for a bump. Renaming is one string in
##   RELEASES[0] plus a redeploy. Worth ASKING next time rather than assuming the pattern holds.
##
## ═══ ▶ NEXT — the actionable list, highest value first ═══
## 1. ★ NICK'S iPHONE / iPAD RE-VERIFY of v1.8.6 — now THREE things, and (c) is new and the most
##    valuable, because it is the only one an instrument has never seen:
##    (a) training steps 5 / 6 / 7, still unverified on a device since the v1.8.3 fix;
##    (b) the FIRST 10 SECONDS of a brand-new expedition. v1.8.5 took the naming screen from
##        unanswerable-for-6.4s to ~1.9s on a 4x-throttled profile — the window a new player
##        judges the game in. Clear the save (or a fresh browser profile) so it is a genuine
##        first run;
##    (c) ★ TRAINING STEP 8 ON AN iPAD — "open a shelf, then tap a specimen". This is CF1805-01,
##        the v1.8.6 headline: the lesson card was 0% reachable behind the raised Compendium and
##        29 of 117 fleet sessions stalled there. Our gate now measures it on 10 viewports in both
##        card positions AND reproduces the bug on the old build, but the defect was found on a
##        real iPad and the whole class has only ever been caught on real hardware.
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

## ▶▶▶ 2026-07-30 ★ v1.8.6 "KEPT PROMISES" LIVE — ROUND 8 RESPONSE: 12 fixes, 2 new instruments.
##   Nick: "here's the next batch of feedback. Let's get everything fixed up." → "Let's go ahead
##   deploy, version bump, and get ready for more testing." Two bundles landed (see NEXT #2).
##   EVERY claim was reproduced in source before a line was changed; three were reproduced with a
##   controlled failure. Ten of the twelve are player-visible and carry release-notes bullets.
##   ⚠ TITLE CAVEAT (same as v1.8.5's): "Kept Promises" was CHOSEN BY CLAUDE — Nick asked only for
##   a bump. The theme is that things the game already advertised now actually happen: the duel
##   awards pay, the odds meter tells the truth, the lesson card stays readable. Renaming is one
##   string in RELEASES[0] plus a redeploy.
##   ═══ FIXED (all gates green: validate 9/9 · fingerprint MATCH 50/50 · smoke 553/0 ·
##       uilayout 763 checks / 10 viewports · simrun dom 2452 presses, 0 findings) ═══
##   · CF1805-01 P1 — THE MIRROR IMAGE OF THE v1.8.4 P0 FIX, and the round's most valuable item.
##     Raising a lesson's own surface to z58 raised it above the LESSON CARD at z50. Only #panel had
##     ever joined the --tut-bot positioning contract; #log/#codex/#chpanel/#records got the raise
##     and not the geometry, so they rendered THROUGH the card. On iPad mini step 8 the card measured
##     0% reachable, 63/63 blocked by #codex — instruction AND Skip button both gone. The fleet saw
##     the same wall independently: stalls at step 8 went 8 → 29 the moment 5 and 7 were cleared.
##     Fix is CSS, in the html. bottom/min-height MUST be released explicitly — under
##     @media (max-width:900px) those four are pinned `top:auto !important` WITH a min-height, and
##     min-height beats max-height, so a top-only rule would have been present, correct and inert.
##   · CF1805-02 high — THE +8 DUEL WIN HAD NEVER PAID, IN ANY BUILD. Round 7 derived `_mid`,
##     guarded on `_mid`, then awarded to `mine.id` — undefined at every reachable call site
##     (both friendly-duel callers build {name,genome,art}). Strictly WORSE than before for
##     participation: the guard fired, consumed the 30s throttle, and paid nothing. One identifier,
##     three places. `stats.duelwins++` sits outside the guard, so the win counted toward rank and
##     achievements while the creature got nothing.
##   · CF1805-03 — five wrong moduli in voiceOf (trait %7 of 25, body %9 of 16, loco %6 of 18,
##     diet %5 of 6, sense %6 of 10). Now read FA_X.length, three lines below the fix that
##     introduced the correct idiom. voiceOf is NOT a fingerprint probe, so this was free.
##   · CF1805-04 — the quest log's only handle. While stalled dataset.go is always truthy
##     (CF1802-04 removed _nextBest's last go:null), so the chip could not open the log in exactly
##     the state a lost player wants it. ⚠ THE REPORT'S MECHANISM WAS INCOMPLETE: the click handler
##     already clears the stall, but NOTHING repainted the chip, so it kept routing forever. The fix
##     is a deferred _chBadge(), not a re-plumb — one-tap routing (CF1802-03's measured win) survives.
##   · CF1805-06 — `size` was the one linear power term nothing clamped. Two halves, both shipped:
##     a load-path clamp (a hand-edited size:1e6 bought +4,000,000 vitality and travelled in a share
##     code), and battleStats now reads `%FA_SIZE.length` — the SAME value the card prints — so a
##     bred size-9 beast can no longer read "dog-sized" while fighting with +36 vitality.
##     makeGenome yields 0-5, so the modulus is identity there and the fingerprint did not move.
##   · CF1805-07 — a forward clock re-rolled the weekly charter slate on any board render
##     (~77.5 ☄ per step). RATE-LIMITED, not closed: one roll per 10 monotonic minutes. See below.
##   · CF1802-16 — "a first-of-its-kind lineage" fired on EVERY breed. The key was per-individual
##     (codexId = 's'+seed) and both parents are consumed one line above, so it could never repeat:
##     the ledger worked perfectly and guarded nothing. Now keyed on the pairing, as its own comment
##     always said it meant. Harmless to the numbers; the toast was lying every time.
##   · P0 (battery) — the conquest odds memo could show the OPPOSITE truth: demonstrated 0% while
##     the real matchup had become 100%, and 100% while it had become 0%. The key named four inputs
##     (seed|seed|xp|hurt) out of the ten that move the result. Now keyed on the SIMULATION'S OWN
##     INPUTS — the battle-stat vector, level and ability set runDuel consumes, plus both seeds and
##     the sample count. fed/brood/hurt/xp/_mult/_wf all reach combat THROUGH those, so they are
##     covered without being named and a future stat input cannot silently escape the key.
##   · P1 (battery) — live `fed` and child `brood` clamped to 200 at the mutation site. Every
##     consumer already clamped, so this was never a stat exploit — just a card quoting 240 / 401
##     and snapping back after a reload.
##   · P1 (battery) — the specimen sheet's "victories feed it" copy predated v1.8's care XP and
##     made feeding and breeding progression invisible on the one card players read.
##   ═══ NEW INSTRUMENTS ═══
##   · tools/duelxp-check.js — an OUTCOME test for the duel rewards, and the direct answer to the
##     recommendation they have now made five rounds running. smoke.js ALREADY had a duel-XP check;
##     it called awardXP() directly, so it stayed green through every build in which the friendly
##     duel paid nothing at all. This drives the real arena and reads the ledger. NEGATIVE-CONTROLLED:
##     against the pre-fix build it reports `xp 0 -> 0` while duelwins still increments.
##     ⚠ `startDuelWithCode` was added to probe-names.json (254 names) to reach the real flow.
##   · uilayout.js — 4 surfaces × 2 card positions × 10 viewports = 40 new checks (683 → 763).
##     ⚠⚠ THE CONTROL CAUGHT MY OWN GATE FIRST, AGAIN (that is SEVEN). My first version pinned the
##     card at the TOP and came back CLEAN on the very case the round reported, because a top-pinned
##     card and a bottom-anchored board never share a band on a tablet. Their card had DODGED to the
##     bottom. Adding the dodge pass reproduced their number verbatim — ipad-mini, Compendium,
##     0% reachable, 63/63 blocked by #codex. A gate that agrees with a bug report by accident is
##     worth nothing; make it reproduce the REPORTED GEOMETRY, not a convenient one.
##   ═══ DELIBERATELY NOT FIXED — these need Nick, or are not closable ═══
##   · CF1805-05 harvest reload (~6,200 ☄/hr vs 26 by design). THE PROPOSED FIX IS NOT IMPLEMENTABLE:
##     "persist the monotonic stamps" cannot work, because a browser has NO cross-reload monotonic
##     clock — perfTime() restarts at every load, so a persisted monotonic stamp is meaningless on
##     the far side of the reload that defeats it. More fundamentally, an offline game cannot
##     distinguish "waited an hour" from "wound the clock an hour", and every bound that would close
##     it also penalises a genuinely returning player. The in-session gate IS real and stays. Options
##     for Nick: accept it (single-player, offline, no leaderboard — it is self-cheating), or change
##     the DESIGN so harvest yield scales with engagement rather than wall time. Same root cause
##     limits CF1805-07, which is why that one is rate-limited rather than fixed.
##   · CF1805-06's third half — wrapping `size` in crossGenome. crossGenome AND evolveGenome are
##     both fingerprint probes, so wrapping the mutation changes every bred creature and breaks the
##     v1.0 baseline. NOT a quiet fix. The player-visible divergence is closed at battleStats
##     instead; the drift itself is a balance decision.
##   · CF1802-08 (the Compendium closes when a specimen card is dismissed — renderCodex is still
##     byte-identical), CF1802-07's unaffordable Build button (not rendered at all, so there is
##     nothing to press), the Bat voice ceiling (14.4% of named Bats still hard-clamp at 6 kHz),
##     direct 132px thumbnails, and adaptive stall cadence. All real, all sized, none started.
##   · §3.1 THE STRUCTURAL ONE — 50% of sessions skip Field Training, 100% of rage quits skipped it,
##     and no bot has finished all 21 steps in six rounds. Their proposal: cut the mandatory path to
##     five steps that unlock a loop and make the other sixteen contextual. That is a DESIGN CALL and
##     the highest-leverage item on the whole list. Rage quits did fall for the first time in four
##     builds (112.5 → 62.5 per 1000 on the deep tier, the only like-for-like slice).
##   ═══ DOCS THIS BATCH ═══ ROADMAP (this block + NEXT #2) · tools/README (duelxp-check + the
##     uilayout dodge pass) · codebase-reference §12 (SEVEN suites) · ECONOMY_LOOT_CRAFTING
##     (charter rate-limit + the harvest limit) · COMBAT_AND_CONQUEST (odds signature, size) ·
##     PROGRESSION (the XP awards that now pay) · DETERMINISM (why these were fingerprint-safe).

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