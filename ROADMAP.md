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

## ▶▶▶ SESSION HANDOFF — as of 2026-07-29. ★ v1.8.4 "CLEAR GROUND" IS LIVE (build 66e0516) ◀◀◀
## [HYGIENE 2026-07-29] The completed v1.7 arc + v1.8.0-v1.8.2 moved VERBATIM to the top of
##   ROADMAP_ARCHIVE.md. This file is back to a one-screen read: pins → this handoff → current
##   state → the v2.0 plan. Source AND site pushed; full battery green.
##
## ═══ WHERE THINGS STAND ═══
## LIVE: v1.8.4 (build 66e0516) at https://celestialfrontier.github.io/. Source repo pushed.
## GATES AT SHIP: fingerprint MATCH 50/50 · smoke 553/0 · uilayout 683 checks / 10 viewports ·
##   balance PASS · validate 9/9 · deadcode 3 candidates (all tooling-referenced, fine).
## ARC STATE: v1.7 "The Forge" COMPLETE and archived. v1.8 "The Connection" COMPLETE
##   (v1.8.0 arc → v1.8.1/.2 playtest → v1.8.3 external battery → v1.8.4 round 7, all live).
## SAVE FIELDS added across v1.8: vce/cbx (audio toggles), xpf (one-shot XP ledger). All
##   absent-safe. No save-shape change in v1.8.4 (the monotonic harvest guard is in-memory).
##
## ═══ ▶ NEXT — the actionable list, highest value first ═══
## 1. ★ NICK'S iPHONE RE-VERIFY of v1.8.4 — training steps 5 / 6 / 7 especially. The mobile
##    training wall is gate-proven from both ends (smoke proves the marking, uilayout proves the
##    target is hittable on 10 viewports, and the gate reproduces the bug on the OLD build), but
##    a physical iPhone is still the only judge that has ever caught this class of defect.
## 2. ★ EXTERNAL ROUND 8 on v1.8.4. Ask specifically for:
##    (a) re-run the 7 economy exploits — the LINEAGE bonus needs a MULTI-SESSION probe, because
##        correct behaviour is "pays once per species pair, EVER" and one session cannot tell that
##        from the old bug;
##    (b) RAGE QUITS — 3→5→7→10 across four builds. v1.8.4 is the FIRST release to address the
##        mechanism they identified (CF1802-03: the stall detector could not render for a player
##        with no objective — 50% of their fleet, 100% of the rage quits) rather than the symptom;
##    (c) CF1802-08 repro sequence — we could NOT reproduce it (real path, real pointerdown;
##        codexOpen stays true) and the gate is in place either way;
##    (d) physical iOS/iPadOS Safari, still outside both harnesses.
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
## 6. COLD-BOOT OUTLIER, unchased: an external paired A/B saw 3 of 8 reps take ~2.1-2.3 s to an
##    interactive name gate vs ~0.5 s, the other 5 within 40 ms. The three slow ones were the
##    first three reps, so it may be page-cache warming on the larger file — 8 reps cannot
##    separate that from a real first-load regression. Worth one look: a 2-second first-interactive
##    on a cold cache is exactly the difference between an instant link and a slow one.
## 7. DOM-DRIVEN simrun tier. simrun drives PROBE HOOKS, not the DOM, so it is structurally blind
##    to every UI feature v1.8 shipped. Closing this permanently removes a whole blind spot.
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
## ⚠ DOC/CODE DISAGREEMENT IS A FINDING EITHER WAY. CF1802-09 (free cataloguing) was a case where
##   the GUIDE was right — "the survey reveals the roster; it catalogues nothing" — and the CODE
##   had drifted. Check which one is wrong before "updating" the doc.
##
## ═══ ▶ DOC MAP (all verified against the shipped build 2026-07-29) ═══
## AUDIO.md is NEW — v1.8's whole audio layer had no doc. Per-system docs current as of 2026-07-29:
## AUDIO · PROGRESSION · SAVE_SYSTEM · QUESTS_AND_CHAPTERS · COMBAT_AND_CONQUEST ·
## BREEDING_AND_SHARING · CAPTURE_AND_BIOSPHERE · ECONOMY_LOOT_CRAFTING · UI_PRESENTATION.
## Not touched this arc (still accurate, older markers): WORLD_GENERATION · RARITY_AND_GRADES ·
## SPECIES_AND_GENOME · ART_DIRECTION · DETERMINISM.
## Reviewer-facing: REVIEWER_NOTES_v1.8.2.md · REVIEWER_NOTES_v1.8.4.md (the round-7 response).
## ★ audits/ (NEW 2026-07-29) — external bundles are now COMMITTED, not left in a session-scoped
##   scratchpad: audits/round-7-v1.8.2/ (the 25-item fix list + evidence PNGs + their harness + the
##   1,000-session fleet, voice-model and boot-A/B raw data) and audits/battery-v1.8.2/ (the four
##   review lenses + raw results). audits/README.md indexes both and records how to recover an OLD
##   build from git to negative-control a new gate (uilayout.js --url=FILE).
##

## ▶▶▶ 2026-07-28 ★ v1.8.3 "CLEAR GROUND" — the external battery's four defects + Nick's phone blocker.
##   TWO INPUTS THIS BATCH: (a) Nick's real-iPhone screenshots (steps 5 and 7 STUCK), (b) the external
##   v1.8.2 Full Battery ("Conditional Gold ~94%", 2 P1 + 2 P2).
##   ★ THE PHONE BLOCKER (Nick): the Star Atlas + Compendium lessons opened their board UNDERNEATH
##   Earth's survey card, with no way through. ROOT CAUSE: v1.7.17's blanket `body.training #panel
##   {z-index:58}` (added because the boards buried the card on the LAND step) outranks every board
##   (#log/#codex/#chpanel/#records = 22) AND the phone dock (14). Desktop never collided — the card
##   has its own column; on a phone they share one. Neither surface can statically win.
##   THE LAW NOW: the surface THIS lesson points at is the top surface — _tutPri() derives it from the
##   step's own spot/allow (exact-token match, so '#logbtn' never lights '#log'), so it holds for all
##   21 steps and any step added later. Also: #vistabox joined the yield-below-the-lesson family it was
##   the only modal missing (Nick: "the vista is behind the training dialogue"); the survey card now
##   stops ABOVE the dock. NOTE Nick asked whether the vista should go ON TOP of the dialogue — it
##   shouldn't: that hides the sentence telling you to tap it. Below, like every other dialog.
##   ★ BATTERY P1 (breeding XP): awardXP(aEntry) then removeFromCodex(aEntry) 11 lines later — the XP
##   vanished as it was earned. Now paid to the NEWBORN. Their suggested patch was NOT taken verbatim:
##   awardXPOnce keys on id|key, so born.id makes every child fresh and the +5 would fire EVERY birth.
##   Fixing that exposed a defect they missed — the lineage key was [aEntry.kind,bEntry.kind], and
##   breeding is always Fauna×Fauna, so it could ONLY ever read 'Fauna+Fauna'. A once-per-parent payout
##   wearing a lineage's name, and it would read as "working" in any log. Now keys on the two parent
##   SPECIES via awardXPPair (FNV-hashed short — the ledger truncates to 64 chars on load, and two raw
##   codexIds concatenated exceed that → silent cross-session collisions).
##   ★ BATTERY P1 (ambience): Sound Off left the bed looping. ac() already returns null when muted, so
##   the bed was the ONLY leak (it outlives its trigger) — no other envelope needed chasing.
##   ★ BATTERY P2: Settings › Audio was under the lesson card on 4/5 of their viewports → body.training
##   #setpanel{z-index:60}. ★ BATTERY P2: aria-disabled removed from the actionable Breed/Feed shortfall
##   buttons (+ real accessible names); the inert `bclaim need` KEEPS its aria-disabled (correct there).
##   ★ Meter: <1% / >99% instead of absolutes — 160 samples can't tell 0% from 0.6%.
##   ★★ TWO PROCESS LESSONS, both earned the hard way this batch:
##   (1) SPECIFICITY BEAT ME. `body.training .tutpri{z-index:58}` scored 0 ids/2 classes against
##   #panel{z-index:9} and #codex{z-index:22} — ONE ID BEATS ANY NUMBER OF CLASSES. The mark applied,
##   smoke's class assertions passed, and the fix did NOTHING. Only the new real-browser
##   elementFromPoint gate caught it. Rule reinforced: a class-level override cannot govern surfaces
##   that declare their layer through an id. Now `body.training #panel.tutpri, …` (list mirrors
##   TUT_PRI_SURF).
##   (2) A CHECK THAT ECHOES THE SOURCE STRING IS NOT A CHECK. The v1.8.1 vista check asserted the
##   literal text 'body.training:not(.vista) #panel' and failed on a refactor while the LAW was fine;
##   my first meter check called _oddsPct() directly and PASSED against a build whose render site had
##   regressed to Math.round. Both now assert the law/rendered outcome. Third instance of this class.
##   NEW GATES (all negative-controlled — each proven to FAIL on a deliberately broken build):
##   smoke +13 (step 5/6/8 priority + token control + mark-clearing; union XP reaches the newborn incl.
##   the +5; aria; meter read from the RENDERED DOM via a titan matchup) · uilayout +54 (a training-stack
##   probe on all 9 viewports: dock chips tappable, open board outranks the card, card still wins the
##   LAND press, Settings › Audio clickable — measured by hit-test the way the battery measured it).
##   ⚠ THE DECISIVE PROOF: replayed against the v1.8.2 build Nick was playing, the new layout gate
##   REPRODUCES his report on all three phone viewports (Compendium chip untappable, both boards buried).
##   GUIDE UPDATED (Nick's standing rule): classes topic now covers care XP + where a union's XP lands;
##   breeding repeats it; conquest explains the meter is simulated; Settings lists Creature voices +
##   Battle sound (the tab had never been updated for v1.8.0).
##   CORRECTED OUR OWN CLAIM: "zero added payload" was an overstatement the battery caught — it is zero
##   AUDIO-MEDIA payload (~45KB raw / ~15KB gzip of synthesis code). REVIEWER_NOTES_v1.8.2.md fixed;
##   REVIEWER_NOTES_v1.8.3.md written as the response doc.
##   Gates: fp MATCH 50/50 · smoke 540/0 · layout 615 checks/9 viewports · BALANCE PASS · validate 9/9.
##   ▶ NEXT: (1) NICK'S iPHONE RE-VERIFY of steps 5/6/7 — the fix is gate-proven but the device is the
##   judge; (2) next external round on 1.8.3 (ask them to re-check the lineage bonus specifically —
##   "pays once per species pair EVER" won't distinguish from the old bug in a single session);
##   (3) rage-quit measurement still unproduced — the one metric moving the wrong way (3→5→7);
##   (4) human audio A/B before scaling §15; (5) DOM-driven simrun tier; (6) then v1.9 → v2.0 PixiJS.
## ▶▶▶ 2026-07-29 ★★ v1.8.4 "CLEAR GROUND" — round 7 (25 findings) + Nick's phone blocker, ONE BUNDLE.
##   Nick's call: "hold, fix everything, ship one bundle" — so 1.8.3 never deployed; it is folded in here.
##   ROUND 7 was the strongest external round yet: 1,000-session fleet (10 personas x 21 devices),
##   training-reachability sweep, Web Audio node instrumentation, a 200k-genome voice model extracted
##   VERBATIM from the build, paired idle-host boot A/B. 23 of 25 fixed, 1 not reproducible, 1 = design.
##   ★ CF1802-01 (their P0) = Nick's phone blocker, independently reproduced + MEASURED: #codexbtn 0%
##   reachable on iPhone SE/14 Pro/Galaxy S8 at steps 3-6 (63/63 points blocked by #panel); #logbtn
##   54-83%; desktop 100% (which is why both harnesses missed it). Their fleet corroborated: stall
##   points {2,7} for three builds, then {2:1, 5:5, 7:3, 8:8} in v1.8.2 — steps 5 and 8 appearing for
##   the FIRST time, exactly the two whose lesson surface is a board. We had already fixed it (v1.8.3)
##   and did NOT take their patch: theirs hardcodes 3 step ids and drifts on any step rename; ours
##   derives from each step's own spot/allow. Their recommended assert IS the gate we built.
##   ★★★ THE LESSON OF THE ROUND — SPECIFICITY, TWICE, INDEPENDENTLY:
##   (a) OUR fix `body.training .tutpri{z-index:58}` (0 ids/2 classes) LOST to #panel{z-index:9} and
##   #codex{z-index:22} — ONE ID BEATS ANY NUMBER OF CLASSES. Mark applied, smoke's class assertions
##   passed, fix did NOTHING. Only the new real-browser elementFromPoint gate caught it.
##   (b) THEIR CF1720-07: `body.training #tutspot{z-index:49}` (1,1,1) out-specifies
##   `#tutspot.overtop{z-index:59}` (1,1,0) → line 1837 permanently DEAD. Same trap, same week, and
##   our own CF1720-07 check passed because it asserted the SOURCE STRING of the dead rule.
##   RULE NOW IN UI_PRESENTATION.md: a class-level override cannot govern surfaces that declare their
##   layer through an id; and NEVER assert a selector's spelling — assert the law it implements.
##   ★ EXPLOITS (all 7): CF1802-09 tapping a life-form row MINTED an uncaught species (`codex.get() ||
##   _storeSpecies()`) — no bioLeft spent, no odds rolled, repeatable; it was the SUPPLY LINE for -10,
##   -11, -12. NOTE the Guide already promised the right behaviour ("the survey reveals the roster; it
##   catalogues nothing") — the DOC was right and the CODE had drifted. CF1802-10 welcome meal was a
##   bare unledgered awardXP + `fed` unbounded (fed=100 → +1000 power vs a tier-14 apex's ~717 budget)
##   → welcome is now a FIRST. CF1802-11 a LOST conquest was never recorded → per-creature-per-world
##   ledger ("losing is what keeps it unconquered" — their line, and it was exactly right). CF1802-12
##   mitigated AT SOURCE by -09 (a mate costs a capture again; grade-uncapped bred children stay
##   intentional). CF1802-13 weekly landfall charters self-completed from the PERSISTED landed set on
##   every clock step (~20.8☄/step vs 78☄/real week) → banked-landfall law is now STARTER-ONLY.
##   CF1802-13b _chRoll still ran on the boot tick via _chBadge→_chAccepted (CF1720-06 only half
##   fixed) → now ARMED by first gesture or 8s. CF1802-14 harvest cooldown → monotonic perfTime too,
##   in-memory, no save-shape change. CF1802-15 sanitiser missed _mult/_wf/apex → mirrors normGenome.
##   STANDING RULE recorded in SAVE_SYSTEM.md: anything normGenome strips from a SHARED creature must
##   be stripped from a LOADED one — same trust boundary.
##   ★ MOMENTUM: CF1802-03 is the round's most consequential item — renderChip returned at if(!g)
##   ABOVE the stall branch, so the player with NO objective (50% of the fleet, 100% of the rage
##   quits) was the ONLY one who could never be nudged. Rage quits 3→5→7→10 across four builds
##   (z=1.06 vs v1.7.20 — not significant step-to-step, but four builds have failed to move it and
##   this is the first change aimed at the MECHANISM). Also -04 (both Atlas suggestions now gated on
##   logMap; go:null → real destination), -05 ('skim' vs emitted 'skimmed' — an active skimmer was
##   told to go do something else), -06 (quest log was a SNAPSHOT: now rides _chBadge, Escape-closable,
##   can't strand), -07 (the Fabricator shortfall button had NO handler at all; the 3 silent training
##   returns now refuse audibly via _tutRefuse).
##   ★ CF1802-08 NOT REPRODUCIBLE — drove the real path (shelf → row tap → real pointerdown dismiss);
##   codexOpen stays true. First cut of that check passed VACUOUSLY because click() alone never fires
##   the outside-close manager (the v1.6.4 trap again). Gate kept regardless; asked them for the repro.
##   ★ AUDIO — their 3 prerequisites for any listening test, all done: -19 bed stops on Sound-off,
##   -20 vocabulary was 533 DISTINCT VOICES TOTAL (91.3% chance of a twin at 50 creatures) → now folds
##   trait/body/loco/diet/sense as bounded multipliers, -21 `bold` read g.behavior%5 = the WRONG GENE
##   under the WRONG modulus (FA_BEHAVIOR has 12) → now g.temper%FA_TEMPER.length with an explicit
##   boldness map. Plus -22 playConfirm had ZERO call sites, -23 deny tone fired from a MARKUP BUILDER,
##   -24 bat f0 5200 pinned ~2% of all creatures at the 6kHz clamp → 3600 + taper above 4kHz.
##   ★ Their measured wins to keep: boot +8ms load / +3ms DCL on an idle host (audio cost ~nothing);
##   payload +2.4% gzip for the WHOLE arc; meter MAE 0.73pp with old power-ratio wrong in 113/120.
##   Meter perf fixed per their ask #4: 320 redundant battleStats per row hoisted out of the loop.
##   ⏳ NOT FIXED, DELIBERATELY: CF1802-17 fed INHERITANCE is a design call for Nick (the preview BUG
##   — up to 6.2x overstated — is fixed; the card now says fed does not carry over). Cold-boot outlier
##   (3 of 8 reps ~2.1-2.3s to interactive) not chased. Ambience does not restart on tab-return.
##   Gates: fp MATCH 50/50 · smoke 553/0 · layout 683 checks/10 viewports (NEW 744x1133 band, their
##   CF1802-02) · BALANCE PASS · validate 9/9. Every new check negative-controlled; TWO of those
##   controls changed what shipped (the .tutpri specificity miss, and the vacuous CF1802-03 state).
##   ▶ NEXT: (1) NICK'S iPHONE re-verify — steps 5/6/7 especially; (2) round 8 on 1.8.4: re-run the 7
##   exploits (the lineage bonus needs a MULTI-session probe — "once per species pair EVER"), and rage
##   quits, the first round where the mechanism has actually been addressed; (3) human listening test
##   now that -19/-20/-21 are done; (4) CF1802-08 repro sequence; (5) fed-inheritance design call;
##   (6) cold-boot outlier; (7) then v1.9 consolidation → v2.0 PixiJS.
##   ▶ DOC SWEEP (same batch, Nick: "make sure everything is in the roadmap and all the documents
##   are updated"). Audited every markdown against the shipped build; 11 doc claims spot-checked
##   against celestial-frontier.html and all 11 verified.
##   ★ NEW: AUDIO.md — the ENTIRE v1.8 audio layer (the largest single feature of the arc) had NO
##   doc at all. Now covers: the never-a-sample rule + why (the instant-link property; +8ms load /
##   +2.4% gzip measured externally), the ac()/sfxOut plumbing and the ONE exception to the ac()
##   mute gate (a looping node outlives its trigger — the CF1802-19 lesson generalised), the 4
##   toggles + save fields, voiceOf's model incl. the 540→millions vocabulary widening and the
##   temper-vs-behavior gene fix, combat/planetfall/ambience lifecycles, the feedback grammar +
##   the _denyPress/_okPress SCOPE TRAP, code anchors, and an honest section on what no harness
##   here can test (Playwright runs muted — only a human listening test can answer it).
##   ★ UPDATED: CAPTURE_AND_BIOSPHERE (CF1802-09 + the lesson that the GUIDE was right and the
##   CODE had drifted — "the survey reveals the roster; it catalogues nothing" was already the
##   documented promise), ECONOMY_LOOT_CRAFTING (monotonic harvest rule + the dead craft button;
##   general rule recorded: any cooldown gating a reward needs a monotonic clock, the wall clock is
##   user input), COMBAT_AND_CONQUEST (conqloss ledger + trueOdds hoist), BREEDING_AND_SHARING
##   (fed does not travel; preview fixed; inheritance left as Nick's design call),
##   UI_PRESENTATION (round-7 addenda: the specificity trap confirmed TWICE in one week, setpanel
##   z60, the 744px band), PROGRESSION / SAVE_SYSTEM / QUESTS_AND_CHAPTERS (earlier this batch).
##   ★ celestial-frontier-codebase-reference.md §9 Audio predated the whole v1.8 layer → now points
##   at AUDIO.md and lists the new fns + the scope trap; §12 corrected 49→50 probes and rewritten
##   as the FOUR-suite battery table (the old text still called a real-browser suite "the highest-
##   value addition if work resumes" — uilayout.js has existed for weeks).
##   ★★ FIXED A DOC HAZARD: tools/README.md, README.md AND CLAUDE.md all instructed
##   `node tools/extract.js` as step 1 of the edit loop — the ONE command that regenerates main.js
##   FROM the html and silently destroys every uncommitted edit (main.js is gitignored). All three
##   now warn explicitly and name `build.js` as the everyday command. CLAUDE.md rule 4 is now that
##   warning + the CSS-lives-only-in-the-html / LAST-<style> rule; rules renumbered 1-11; the smoke
##   description corrected (20→21 steps, ~380→550+ checks) and uilayout.js added as a required run.
##   AUDIO.md registered in the PINNED per-system list (CLAUDE.md + ROADMAP).

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