# Celestial Frontier — Roadmap ARCHIVE

> Chronological batch logs and superseded session-handoff blocks, newest-first.
> This is history/traceability only. The LIVE agenda lives in `ROADMAP.md`.
> Nothing here is deleted — moved verbatim from ROADMAP.md on 2026-07-21 when the
> working doc crossed ~285KB / 4,272 lines and stopped reading in one pass.
> Append future completed batches to the TOP of the batch section here as they age out of ROADMAP.md.


## ══════════ ARCHIVED 2026-07-30 (v1.8.5 "First Touch" ship) — v1.8.3 + v1.8.4 ══════════
## Moved VERBATIM from ROADMAP.md under the pinned HYGIENE rule (nothing deleted). These two
## blocks were the live agenda through the v1.8.4 ship; v1.8.5 superseded them as the live
## build. Current state: the ROADMAP.md handoff.


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


## ═══ (v1.6.4 landing hotfix — now superseded as the live build; kept for history) ═══

## ══════════ ARCHIVED 2026-07-29 (v1.8.4 ship) — the completed v1.7 arc + v1.8.0 ══════════
## Moved VERBATIM from ROADMAP.md under the pinned HYGIENE rule (nothing deleted). Everything below
## this banner was live state up to v1.8.2; it is history now. Current state: ROADMAP.md handoff.


## ▶▶▶ 2026-07-27 ★ v1.7.18 "THE HONEST FRONTIER" LIVE (build 76dd136) — the ENTIRE v1.7.15
##   third-round audit in ONE bundle (Nick's call). 35 of 38 findings + expanded-audit hardening
##   shipped; deferred BY PLAN to v1.8: CF1715-09 (conquest meter — strengthens the specced item),
##   -27 burn death-lines, -29 spoils slot, -35 stacking contexts, -37 step-13 copy, + audit P1s
##   (progression XP economy, no-op contract, direct 132px thumbnails, training transition
##   controller). ★ PROCESS WINS THIS ROUND: (1) the restart-training criticals were invisible to
##   472 checks because NOTHING walked Settings→Restart on a stocked veteran — smoke now walks the
##   exact journey (+8 checks incl. tsnap persistence); (2) the balance sim was blind to the
##   ROLLED ability pool — now measures all 55 ABILITY_THEMES arts ([8,92] band) every deploy;
##   (3) SECOND-EVER re-pins (battleStats, runDuel) via full field-diff — 'non-magnitude delta:
##   NONE' proven before pinning, authorization recorded in baseline repins[]. Archetypes retuned
##   into 42-58 under the corrected formula. ⚠ LESSONS: journey coverage beats volume (their
##   report's live-browser repro found what our fleet couldn't); every measuring stick needs an
##   inventory of what it DOESN'T measure. Gates at ship: fp MATCH 50/50 · smoke 479/0 · layout
##   546/9 · BALANCE PASS (17+55). ▶ NEXT: Nick playtests 1.7.18 · v1.8 "The Connection" spec now
##   ABSORBS: matchup meter w/ real simulated odds (-09), XP economy table, no-op contract,
##   direct thumbnails, transition controller, audio pass, §7 visual spike. HOLDING for the word.
## ▶▶▶ 2026-07-27 ★ v1.7.19 "TRUST, VERIFIED" LIVE (build 2ec37b0) — the round-4 correction pass.
##   Round 4's humbling finding: THREE v1.7.18 fixes were correct but placed where they couldn't
##   run (2 CSS blocks in the FIRST <style> — the file has TWO; 1 helper scoped inside loadSave's
##   module) and all failed SILENTLY. All corrected + the round's real deliverable: ASSERT-WHAT-
##   YOU-FIX is now law — new smoke journey boots a tsnap save and walks reload→restart→restore
##   (it immediately caught my SECOND wrong hoist into SaveSystem scope), + static cascade-order
##   sentinels. Also fixed: tie coin executes (mine/theirs seeds), hybrids double-count (_loading
##   guard), Earth entry stashed whole, tutspot z59, tsnap clamps, sysSeen 900th pays, chWeek
##   forward clamp, focus-theft guard, role=img, last contrast inks, srow2. ⚠ LESSONS FOR THE
##   AGES: (1) the html has TWO style elements — appended CSS must land in the LAST one (sentinel
##   now enforces); (2) helpers live in module scopes — verify the CALLER's scope, and the smoke
##   journey is the only proof that counts; (3) in runDuel A/B are STAT BLOCKS, mine/theirs are
##   the combatants. ▶ PUSHED TO v1.8 (Nick's triage): CF1715-09 conquest meter · -27 death lines
##   · -29 spoils slot · -35 stacking contexts · -37 step-13 copy · -06 fer<20 tail (walls-don't-
##   win accepted for now) · CF1718-10 full per-modal focus memory · ambush IV/V high-mag gate ·
##   direct 132px thumbnails · XP economy · no-op contract · transition controller · audio · §7
##   spike. Gates: fp MATCH 50/50 · smoke 487/0 · layout 546/9 · BALANCE PASS (17+55).
## ▶▶▶ 2026-07-28 ★ v1.7.20 "THE PROOF" LIVE (build b2549bf) — round-5 corrections AND the
##   assertion discipline that ends the five-round bug class. THE PATTERN (their words): five
##   rounds, five fixes that were CORRECT CODE placed where it could not run — CSS in the wrong
##   <style> ×2, a helper outside scope ×2, a restore in the wrong function ×1. ROOT CAUSE OF THE
##   MISSES: our harness asserted the CODE PATH RAN, not the OUTCOME THE FIX PROMISED. The 1.7.19
##   reload journey passed with the bug LIVE because its tsnap carried an EMPTY creature list, so
##   the throwing sanitizer line never executed. ★ NOW LAW (both harnesses): smoke's reload
##   journey carries a REAL genome and asserts codex.size===1 + Earth's timestamp/☆ SURVIVE + no
##   recovery toast lied; uilayout gained a REAL-BROWSER COMPUTED-BOX gate (bell/setbtn/helpbtn/
##   recbtn/hpheart ≥44 on coarse pointers + 16px input floor) — 546→560 checks. Neither
##   stylesheet-placement failure could have survived it. FIXES: sanitizer exported, pending
##   snapshot survives its own literal, recovery restores-then-claims (honest 'Incomplete' toast
##   + do-not-reload guidance when it can't), Earth restore in _tutEnsureEarth + stash nulled,
##   chWeek never lowers a banked week, focus guard tests p.btn, role=application restored, heal
##   44×44, tutbox z60, namein 16px, paragon hover, reveal state signal by weight. Gates: fp
##   MATCH 50/50 · smoke 490/0 · layout 560/9 · BALANCE PASS (17+55). ▶ REMAINING BACKLOG (all
##   v1.8, unchanged): CF1715-09 meter · -27 · -29 · -35 · -37 · -06 fer<20 tail · direct 132px
##   thumbnails · XP economy · no-op contract · transition controller · audio · §7 spike · the
##   auditors' reload-at-every-lesson×1000 randomized regression (worth building into the harness).
## ▶▶▶ 2026-07-28 ★ v1.8 ITEM ADDED — "MOMENTUM" (Nick approved). THE RULE: never let a tap cost
##   nothing. Rationale: the fleet's rage-quit metric IS a no-progress streak (3→5→7 across the
##   last three rounds while every other metric improved — the one thing trending wrong), and its
##   precursor is the no-op rate (45.25% Rancher / 29.24% newer cohort). Four components:
##   (1) ACTIONABLE-DENIAL CONTRACT (already specced, now the CORE of this item): every blocked
##       action returns {ok:false, reason, missing[], next[], targetSurface} and renders as a
##       sentence + a "Take me there" button. Dead tap → lead.
##   (2) PREVENTION BEFORE EXPLANATION: disable impossible actions before selection; sort valid
##       candidates first in every picker; put the binding shortfall ON the button face (the
##       Fabricator's "Need 3× Iron + 1× Chromium" pattern, extended to breed/feed/duel/conquer).
##   (3) ★ STALL DETECTOR ON THE OBJECTIVE CHIP — THE NEW BUILD. _questNudge fires on an IDLE
##       timer (5 quiet minutes); a rage-quitting player is BUSY and getting nothing, so the
##       opposite trigger is needed. Count consecutive actions yielding NO progress of any kind
##       (no XP, no charter tick, no discovery, no material, no atlas/codex change); at a
##       threshold the chip escalates from TRACKING to SUGGESTING — one concrete reachable step
##       with tap-to-go. Same surface the player already reads, new job when they're stuck.
##       Reset the counter on any progress event. Must obey the one-voice law (never over a
##       modal/lesson) and be silent during training.
##   (4) BROADENED CREATURE XP as the statistical floor — once feeding/breeding/first-lineage/
##       habitat/close-loss all pay something, most actions produce a visible number, which
##       collapses streak LENGTH before the detector is ever needed.
##   ★ ACCEPTANCE GATE — BUILD THE MEASURING STICK FIRST (the lesson of the whole audit arc):
##   simrun must COUNT no-op rate and no-progress-streak length itself and report them per
##   persona, and the deploy gate watches them the way it now watches archetype balance. We
##   currently learn these numbers only when an external report arrives — ship-and-believe is
##   exactly the trap that ran rounds 2-5. TARGETS (from the audits): overall no-op <15% ·
##   Rancher no-op <20% · rage quits ≤3/1000 · creature Level 3 common in a first real session.
## ▶▶▶ 2026-07-28 ★ v1.8 "THE CONNECTION" — THE SIX ARE BUILT (source only, NOT deployed), AND
##   THE ARC-WIDE A/B RETURNED A NULL RESULT THAT IS ABOUT THE INSTRUMENT, NOT THE WORK.
##   BUILT + outcome-tested (smoke 505/0, fp MATCH 50/50, layout 561/9, BALANCE PASS):
##   (0) momentum instrument · (1) denial contract (prevention on the button face + explanation
##   with a real destination) · (2) broadened XP w/ per-creature anti-farm ledger (save field xpf)
##   · (3) STALL DETECTOR (interactions since last progress → chip changes VOICE → _nextBest()
##   never suggests the unavailable) · (4) conquest MATCHUP METER via trueOdds() 160 seeded duels
##   — CF1715-09 CLOSED, proven on the audit's own case (40% shown → 0% true → 'Overwhelming')
##   · (5) breeding anticipation (ranges, never the roll) · (6) personality + survey spotlight.
##   ★★ THE A/B (medium tier, 100 runs each, CF_SRC-matched):
##       pre-v1.8      noop 35.3%  maxStreak 59  stalls 100/100  L3 16
##       full v1.8     noop 35.4%  maxStreak 62  stalls 100/100  L3 14  (meanTopXP 30.4→31.8)
##   NOTHING MOVED. Two findings, and the second is the important one:
##   (A) NOISE FLOOR MEASURED BY ACCIDENT: two builds that are IDENTICAL from the sim's point of
##       view (instrument-only vs +denial-contract, which is UI-only) returned L3 16 vs 10. So the
##       harness's own noise on L3 at n=100 is ~±6 — which means my earlier "broadened XP did
##       nothing (10→9)" was NOT a null result, it was noise I over-read. Always run a same-build
##       repeat before attributing a delta. noop% and stalls ARE stable (35.3/35.3/35.0/35.4 and
##       100/100 every run) — those are the trustworthy signals, and they are flat.
##   (B) ★ THE INSTRUMENT IS STRUCTURALLY BLIND TO v1.8. simrun drives the game through PROBE
##       HOOKS (H.breedPair, H.craftItem, H.chAccept…), not the DOM. Every v1.8 item is UI-layer:
##       the denial contract renders into surfaces the sim never opens, and the stall detector
##       counts pointerdown events the sim never fires — its counter cannot even increment there.
##       So the flat result says NOTHING about whether the work helps a human. What the instrument
##       actually measures is the SIM'S OWN action-selection success (its blind attempts), which
##       is a property of the persona logic, not of the game's guidance.
##   ▶ WHAT THIS COSTS / WHAT IT BUYS: v1.8 is unit-proven at the OUTCOME level (every item has
##   assertions that fail without it — the denial CTA opens its destination, the chip changes
##   voice and clears on progress, the meter reports 0% where the ratio said 40%) but it is
##   UNVALIDATED at the player level. Validation must come from a UI-DRIVEN harness — which is
##   exactly what the external fleet does (Playwright, real clicks) and exactly what the v2.0 port
##   plan already mandates (Vitest + Playwright, §6). ▶ NEXT: (1) do NOT claim v1.8 works until a
##   UI-driven run says so — the next external fleet report is the real verdict; (2) consider a
##   DOM-driven tier for simrun (slower, fewer runs, but it would see the UI layer); (3) raise
##   runs-per-arm or fixed-seed pairing so L3 stops swinging ±6.
## ▶▶▶ 2026-07-28 ★★ v1.8.0 "THE CONNECTION" LIVE (build 5009d4d) — THE ARC IS COMPLETE.
##   SHIPPED: momentum instrument · denial contract (prevention + explanation + destination, with
##   an audible deny tone) · broadened XP (care counts; per-creature anti-farm ledger) · STALL
##   DETECTOR (chip changes voice, _nextBest never suggests the unavailable) · CONQUEST MATCHUP
##   METER via trueOdds() 160 seeded duels — CF1715-09 CLOSED · breeding anticipation (ranges,
##   never the roll) · personality · survey spotlight · ★ CREATURE VOICES (18 rig archetypes so
##   Earth's 631 fauna sound like what they are; alien voices from genome; HYBRIDS INHERIT AND
##   DRIFT on the art's own _earthBlend/_anchorVal law — zero payload, deterministic) · COMBAT
##   SOUND (per-blow weight, crits, ability procs) · PLANETFALL arrival + bounded biome beds ·
##   two independent audio toggles (vce/cbx, absent ⇒ on).
##   Gates at ship: fp MATCH 50/50 · smoke 515/0 · layout 561/9 · BALANCE PASS (17+55) · sim ui
##   100/100 · CI green.
##   ⚠⚠ THE HONEST CAVEAT, CARRIED FORWARD: v1.8 is OUTCOME-proven (every item has assertions
##   that fail without it) but PLAYER-UNVALIDATED. Our simrun drives PROBE HOOKS, not the DOM, so
##   it is structurally blind to every UI item in this arc — the flat A/B (noop 35.3→35.4,
##   stalls 100/100) says nothing about human benefit. The verdict must come from a UI-DRIVEN
##   run: the external fleet's Playwright personas. DO NOT claim v1.8 works until that lands.
##   Also unresolved: the harness's own noise floor on L3 is ±6 at n=100 — raise runs-per-arm or
##   pair seeds before scoring anything at that granularity again.
##   ▶ NEXT: (1) external fleet round on 1.8.0 — the real verdict, and the first round that can
##   hear audio at all (their persona reviews were screenshot-based and blind to sound; this is
##   the cheap audio playtest §15 asked for before committing 10-18 weeks); (2) a DOM-driven
##   simrun tier so this blind spot closes permanently; (3) v1.8.x for whatever the round finds;
##   (4) then v1.9 consolidation = Phase 0/1 of the port (saves/Zod, module split = the TS
##   extraction, payload budget, art-direction doc) → v2.0 PixiJS.
## ▶▶▶ SESSION HANDOFF (as of 2026-07-23 — v1.6.4 LIVE; v1.7 ARC IN PROGRESS, source-only) ◀◀◀
## [HYGIENE 2026-07-24] Roadmap trimmed to a one-screen read: the v1.6.x DEPLOY history + Batch-15 + 6k/10k
##   beta blocks were moved VERBATIM to the TOP of ROADMAP_ARCHIVE.md (nothing deleted). Everything below is
##   still-live v1.7 state / backlog / process. All work committed + pushed; battery green. READY FOR NEXT SESSION.
## ▶▶▶ 2026-07-25 NINTH DIRECTIVE — FULL EXECUTION GREENLIT (Nick: waves 1-3 + WHOLE pending list + the
##   FULL UI PASS "left settings/help circles/topbar shelf — consistent with the infinite/sandbox ARPG feel"
##   + save export/import design ("let's figure this out") + TRAINING FULLY REDONE to match the new UI with
##   the SAME FOCUS LOCKDOWN (Nick x2: keep the lock, apply every prior training lesson: off-screen spotlight
##   guard, veteran-save seeding, overlay dismissal on step entry, gameEvent emissions intact) + FULL PROOF
##   SET at the end for his next review round.
##   ★ SESSION PROGRESS (all committed, each battery-green fp MATCH · render 1010/0 · smoke 415/0 · layout 546/9):
##   WAVE 1 = ✔✔✔✔ COMPLETE: (1) CANOPY UNION [tools/sheets/canopy.js proof] — _canopyMass wobble-lobe
##     union+gradient+pockets; tree/shrub/bushy/dense/round/baobab/acacia; no circles at 100/200%. (2) FLORA
##     IDENTITY WAVE 2 [flora-wave2.js proof] — form-agnostic paintOrgan (grapes/cherry/nutClu/barkCurl/
##     pepper/podHang + prior 4), spice row (cinnamon/cardamom/black pepper/vanilla/chili/mustard), per-species
##     fruit colors, 5 ROOT KINDS w/ vegetable colors, 4 HERB STRUCTURES (leafhead/needle/feather/aromatic),
##     4 GRAIN KINDS, sheet algae (aq6), umbel flowers. (3) liveview sheet = REAL ring grammar. (4) deepspace
##     labels + TRUE star-scale row.
##   WAVE 2 = MOSTLY DONE: wormhole continuous lensing + warped star-trails + throat depth ✔ · molecular-cloud
##     presence + protostars ✔ · MOON GEOLOGY ✔ (far masters ONE hero feature; icy branching interrupted
##     fractures; volcanic basalt+caldera+cooled fissures; rocky broken rims + ejecta) · OPEN-SEA per-landing
##     variation ✔ (salt re-deals islands/swell/fauna; opts.salt threaded into hdVista) · FAUNA IDENTITY ✔
##     [fauna-wave2.js proof] (dart/glass/tree/bullfrog frogs, puffin bill, raptor hook+chest, swan S-neck,
##     hummingbird, macaw, kudu/lyre/prong horns, warthog mane, meerkat sentinel special, sloth hang special,
##     turtle splayed feet; ALSO fixed 2 stray 0x08 bytes in the boar regex — was silently breaking \bboar\b).
##     FAUNA NITS REMAINING: dart-frog patch contrast verify at card size · eagle hook still subtle · gerenuk
##     neck (o.neck doesn't drive mammal-rig neck length — needs rig param) · red-panda RINGED TAIL (needs tail
##     path access) · R4 spike/fur/feather softening pass NOT STARTED.
##   [2026-07-25 SECOND SESSION, all committed+pushed → 5c0530f, every batch battery-green]:
##   R4 SPIKES ✔ [crystal+dorsal: varied spacing/length, mid-back envelope, ROOTED mounds; feather grid
##     jittered — fur/translucent-organs/wings were already done in earlier passes]. WAVE 3 ✔✔✔: coast-rim
##     BREAKUP (shore band width varies by type — cliffs plunge to water) + cloud FIELD mask (weather systems
##     w/ clear sky) + cloud SHADOWS [planets24 proof reviewed] · 4-WING vs 2-WING silhouettes (hindwing =
##     real second pair, separated tip) [winged proof reviewed] · star-class extras = previously done + scale
##     row. UI PASS STEP 1 ✔: ⚙+? circles JOIN the dock (desktop ±330 slots, phone edge-bookends; ids
##     untouched → training lockdown + smoke targets hold; layout 546/9, smoke 415/0).
##   ★★★ 2026-07-25 FINISH-LINE SESSION (Nick: "get this across the finish line") — ALL DONE, PROOFS SHIPPED:
##   UI PASS ✔ COMPLETE: THE SHELF (one-row topbar desktop: nameplate·HP·search·bell; phones keep 2-row) +
##     ⚙/? FLANK THE DOCK (±330 desktop, edge bookends phone) + 5 stale guide/training position refs fixed
##     to the dock era. TRAINING: ids untouched → lockdown + spotlights + smoke's 20-step run all hold
##     (415/0). WINGS ✔ (Nick's mid-turn note): QUARTER-OPEN dragon posture, tips below crown, heads clear;
##     4-wing keeps its second pair. Raptor head +15% so the hook reads.
##   NEW TOOLING: tools/uishot.js — headless-Edge UI screenshots via exactly-sized IFRAME (window-size lies
##     under Windows display scaling — measured vw 492 at requested 390; iframe gives the true CSS viewport).
##     Seeds veteran save {me,tut:1,rn:GAME_VERSION} → boots the live UI, no intro/release popups.
##   ★ CF-v17-GOLD-PROOFS.zip DELIVERED to Nick: 58 PNGs, 7 folders (earth-creatures/flora/procedural/
##     celestial/materials-gear-ships/vistas/UI) + README mapping every change. All 41 sheets rendered 0-fail.
## ★ 2026-07-25 ROUND-3 ITERATION (Nick's review feedback, all committed → 5464498, battery green):
##   THE ENGRAVE = the texture SOLUTION: skin layers hold GREYSCALE RELIEF (white raise / black carve)
##   composited with globalCompositeOperation OVERLAY → detail modulates the hide's own painted color+light
##   ('drawn in with the creature'). Rows/seams BOW around the torso (_bow); fur = pure interior flowing coat
##   (zero protruding fringe); plumage clipped inside the body; crystalline carved + 2 grazing glints. WINGS
##   shoulder-rooted side view (round 3, Nick: correct direction) + grander sweep. UI v3: HP STACKED under
##   nameplate (left HUD column: Cadet→HP→Charters), NOTIFICATIONS in the bottom-right corner beside ?/⚙ with
##   an UPWARD Windows-style tray — uniform desktop/tablet/phone (phone: bell above the ? bookend). ⚠ LESSON:
##   syncTopbarH measured row1 from the BELL — moving the bell to the bottom made --row1-h = viewport height
##   and threw every right panel off-screen (layout gate caught it); now measured from SEARCH. Charters spot
##   still undecided by Nick (left column for now).
## ★ 2026-07-25 ROUND-4 (GOLD_PROOFS_REVIEW_2026-07-25.md saved — 92% verdict, 'focused and finite';
##   + Nick's UI v4 spec). ALL DONE this round (→ 840b0db, battery green; CF-v17-GOLD-PROOFS-R2.zip delivered):
##   ENGRAVE v2 = full-body texture FIELDS (paint the whole canvas, the sil mask fits it — fixed chitin
##   'scribbled in the middle' + anything outside the lines) + FEATHERED rebuilt as engraved shingle plumage
##   (col-4 'bunch of lines' fix) + crystalline glints masked in-body. WING-ROOT CONTACT SHADOW (§E/F).
##   UI v4 (Nick): EMOJI ICONS everywhere (✦🗺📖🛠🏆); desktop ✦ Prime TOP-MIDDLE · 🗺 Atlas under search ·
##   📖🏆🛠 right rail · 🔔?⚙ corner w/ upward tray; phone TWO-ROW icon dock same order (row1 🗺✦📖 ·
##   row2 ⚙🏆🛠? · 🔔 above ?); shelf truncation FIXED (nameplate 58vw, adaptive search placeholder in
##   syncTopbarH). REVIEW TRIAGE: must-do #2,#3,§E/F DONE · #1 version label = BUNDLE-TIME by design (house
##   rule: GAME_VERSION on Nick's word; '(dev)' marks source build) · REMAINING FOR GOLD (the final micro-
##   wave): 4 fauna reads (eagle hook, gerenuk neck, red-panda rings, dart contrast) · open-sea variance bump ·
##   jungle/desert vista organicity · puffin/toucan/macaw bill authority · liveview ring-shadow value bump ·
##   review's SDF/silhouette-influence pipeline = LOGGED as post-Gold enhancement (engrave v2 covers the
##   integration ask at our style level; silhouette budgets/zone maps queued if Nick wants more).
## ★ 2026-07-25 ROUND-5 — TWO R2 REVIEWS TRIAGED (saved: GOLD_R2_REVIEW_A/B_2026-07-25.md; verdict
##   96% CONDITIONAL GOLD, 'micro-pass, not another art cycle') + Nick's iPhone all-docked spec. DONE (→
##   5ea9844, battery green): UI v5 = phone row 2 is FIVE centered chips ⚙🏆🛠🔔? (nothing floats) + EVERY
##   phone panel (settings/tray/charters/compendium/atlas/records) opens as a SHEET ABOVE the dock — aligned,
##   zero overlap. ⚠ LESSON: a transformed fixed ancestor becomes the containing block — bellwrap's translateX
##   collapsed the fixed tray to 20px (gate caught it); positioned via left:calc() instead.
##   ▶▶▶ THE FINAL GOLD MICRO-PASS (both reviews' gate, = the LAST wave before Gold sign-off):
##   (1) EAGLE raptor read (hook+brow+chest+squared tail+talon stance) (2) GERENUK neck +20-30% vs impala,
##   raised head, slimmer torso (needs mammal-rig neck param) (3) RED PANDA tail rings + volume (needs tail
##   path in marking pass) (4) DART FROG contrast at card size (min patch width, saturation) (5) OPEN-SEA
##   COMPOSITION ARCHETYPES — 8 real archetypes (empty horizon/near island/archipelago/rocky coast/reef
##   shelf/storm front/low sun/distant life), vary within each — not one comp with parameter jitter
##   (6) FLIGHT-STATE separation — airborne rises off its shadow (narrow+soften), legs tuck, body tilts;
##   grounded lowers + folds tighter; 4-wing pair separation in flight (7) version string = BUNDLE-TIME
##   (by design — bind guide card to GAME_VERSION at the bump; verify in release shots) (8) phone guide
##   launcher lane above the dock. POLISH (if schedule): fur contour fuzz + crystal planar breaks (silhouette
##   budgets), chitin joint interruption, scale zoning, ring-shadow softening, wormhole bead reduction,
##   nebula arc breakup, live-view exposure hierarchy (runtime dominant-glow compression), 44px touch-target
##   audit + first-use dock tooltips (accessibility batch), meta-dock collapse = POST-FORGE (no realtime
##   combat state exists yet), flora-family vista mismatch = VERIFY (spot-check landing rosters vs biome).
## ★★★ 2026-07-25 THE FINAL GOLD MICRO-PASS = EXECUTED (→ 7003c15, battery green, proofs delivered):
##   ✔ (1) EAGLE brow ledge + squared raptor tail ✔ (2) GERENUK neckX (NEW mammal-rig G.neckX multiplier —
##   o.neck was never consumed; now any recipe can stretch a neck) ✔ (3) RED PANDA ringed bush tail (rig
##   exports rigOut.tailSeg, bush-aware; alternating dark/cream bands) ✔ (4) DART FROG aposematic
##   source-atop wash (survives every downstream pelt wash — the pattern for guaranteed-bright species)
##   + min patch width ✔ (5) OPEN-SEA 8 ARCHETYPES (empty/near-island/archipelago/rocky-coast/reef-shelf/
##   storm-front/low-sun/distant-life; salt picks archetype then varies within; landings SHEET now salts per
##   cell — the old sheet passed no salt so every sea cell rolled identically) ✔ (6) FLIGHT-STATE separation
##   (_fitBeast: airborne winged procs lift S*0.10 off a narrowed, faded shadow) ✔ (8) phone guide-launcher
##   lane above the dock. REMAINING before Gold sign-off: (7) version string AT BUNDLE TIME (bind verified) ·
##   Nick's proof review of this pass · then regenerate the FULL zip as the Gold-candidate package.
## ★ 2026-07-25 UI v9 (Nick's screenshot round): dots retired · SELECTION GROWTH (.sel via PANELS sync)
##   · 🌍 Atlas · Charters normalized · corner quartet on tablet/desktop · centered settings · phone lanes
##   raised. ⚠ LESSON: TWO min-width:701 media blocks exist — a block-splice keyed on indexOf hit the tutbox
##   one and ate 555 lines; recovered via git checkout + exact-match edits ONLY (re-learned rule 2 the hard way).
## ★★★ 2026-07-25 UI v10/v11 + TRAINING GRADUATION (all Nick-directed, → committed, battery green
##   fp MATCH · smoke 419/0 (+4 graduation checks) · layout 546/9):
##   UI v10: uniform stack pitch/metrics · SEARCH RESULTS own fixed lane below the right stack (typed-
##   'earth' proof) · 🏆 trophy-only circle · dodge lanes desktop 100/phone 150. UI v11: counts retired
##   except ✦ Prime 0/9 · selection = GOLD-WASH HIGHLIGHT (growth removed — Nick: spacing never moves) ·
##   HP BAR POLISH (quarter ticks, lit-top fill depth, bright leading tip; hue slide kept) · BELL = circle
##   everywhere · utility order EVERYWHERE = 🏆 Records · 🔔 Notifications · ? Guide · ⚙ Settings.
##   ★ TRAINING = 21 STEPS, ends on Nick's order of operations: NEW 'charter-first' step — recruit opens
##   📜 and ACCEPTS their first contract (chAccept step-scoped exception; 'already proven' disabled until
##   tutDone so sandbox stats can't complete deeds; accept fires gameEvent('chaccept'); chacc SURVIVES
##   _tutCleanup) → finale points at ? Guide + 🎓 briefings. Smoke walks all 21 + asserts no auto-accepts,
##   exactly one accepted. ⚠ LESSON: smoke's tutAt matched the literal 'n / 20' card counter — adding a step
##   broke 22 checks at once; counter now '/ 21' (grep the total when steps change).
##   DOCS SYNCED: UI_PRESENTATION (final v8-v11 layout) + QUESTS_AND_CHAPTERS (graduation mechanics).
## ▶▶▶ 2026-07-25 NINTH DIRECTIVE — CACTI ROOT-CAUSE + INVENTORY PROOFS + PHONE DOLL (all gates green:
##   fp MATCH 50/50 · render 1010/0 · smoke 419/0 · layout 546/9):
##   ★ DESERT-CACTI FIX (Gold review Gate 1) — ROOT CAUSE FOUND: main.js floraGenes mapped flora genomes
##   through hdGenesFor — the FAUNA phenotype resolver. Its return R carries NO .form/.color/.seed, so
##   _floraSpx defaulted every lookup → FAM[0]='fern' in default colors for EVERY vista plant on EVERY
##   world (the reviewer's "web-frond forms everywhere"). Compendium was never wrong (raw genomes).
##   FIX: floraGenes passes RAW genomes (hdFloraBare reads the genome itself); same wrong wrap removed
##   from tools/sheets/floravista.js (the audit sheet was masking its own test). airGenes KEEPS
##   hdGenesFor (hdBeastBare wants R); aerFlora is presence-only (harmless). floravista proof now
##   draws true column cacti / broadleaves+palm / flowers+ferns per genome. fp-safe (render layer).
##   ⚠ LESSON: hdGenesFor = FAUNA-ONLY resolver. Flora painters (hdFloraBare/_floraSpx) take the RAW
##   genome. A silent-defaults object made every field fall back — nothing threw, everything rendered.
##   ★ INVENTORY PROOF RIG (cert gaps closed) — uishot.js SEED_FULL: populated save (23 materials across
##   all 5 families + cgx exceptionals, 22 item stacks, MIXED-TIER LOADOUT WORN incl. T5 cg-plasma +
##   affixes via ea). New shots: shipyard d/p, inv-materials/craftables/gear d + materials/gear p,
##   prime-phone. Closes reviewers' Shipyard-proof + equipped-paperdoll + Prime-phone gaps.
##   ⚠ uishot outDir must be ABSOLUTE — headless Edge silently drops relative --screenshot paths.
##   ★ PHONE SHEET (Nick) — paperdoll capped at min(62vw,240px) on ≤700px (was ~75% of viewport; tabs
##   + effects bar + first material families now surface unscrolled); sockets 44px (touch floor).
##   Sheets all scroll (overflow-y:auto + styled scrollbar) — wheel + finger, confirmed.
## ▶▶▶ 2026-07-25 TENTH DIRECTIVE — PRE-DEPLOY CODE REVIEW (Nick: "full code review before we go
##   live + defunct code + optimizations"). 27-agent workflow review of the whole v1.7 arc (diff
##   3a4b839...HEAD): 21 verified findings → 10 distinct defects, ALL FIXED + below-cap cleanups
##   (all gates green after: fp MATCH 50/50 · render 1010/0 · smoke 419/0 · layout 546/9):
##   [1] #pinchip/#chchip were PRE-v6 anchors sitting ON the v11 Charters/Compendium stack (z9 over
##       z8 — a pinned recipe made Compendium unclickable, its clicks opened the Shipyard!) → chips
##       moved below the stack (topbar+92/+128); proof shot w/ pin:"igdrive" seeded.
##   [2] GRADUATION RESTART DEADLOCK: chacc survives quit-before-finale; _chAvailable hides accepted
##       heads → two half-finished runs left the board with NO Accept → charter-first step now
##       self-heals in enter: if chacc.size, the deed is already done — re-emit chaccept, advance.
##   [3] _tutFinish's v1.5.2 unconditional chacc.add('st-land') fought the graduation (st-mercury
##       grad got st-land forced + wrong notification) → auto-accept now ONLY on the skip path
##       (chacc empty); graduate keeps their own pick, notification matches either way.
##   [4] VISTA GENE-PLUMBING FAMILY: _hdAbyssScene got NO genes in-game (proof sheets passed them —
##       certs showed populated abysses the game never rendered) and _hdReefScene got the LAND herd
##       (land beasts swam; real fish invisible) → new xtra.aquaGenes (aqua-classed, hdGenesFor)
##       threads to both scenes. aerFloraG de-wrapped from hdGenesFor (same fern-bug class).
##   [5] _vistaSalt used stats.landings (first-landing-only counter) → re-landing the same world
##       rolled the SAME region all epoch → session _descSeq++ per openLandingVista re-rolls truly.
##   [6] VETERAN MIGRATION: pre-1.7 saves have no `seen` → every old species wore the blue new-dot
##       → absent field (not empty array) backfills all catalogued ids as viewed after codex load.
##   [7] _tutSpot FLIP OSCILLATION (PLAUSIBLE→fixed): flip branch fought forced-side re-assert
##       (card teleporting top↔bottom ~1/s) + early-return froze ring/--tut-bot → flip now LATCHES
##       per step (_tutFlipOvr, outranks side rules, cleared each _tutShow) and falls through.
##   [8] _fabHTML's stale 4-entry _SRC copy (none of the 7 cosmics had source hints) → _matUses().src
##       single source. [9-10]+cleanups: TXhi/TXlo dead consts, 8 dead .arr rules (class renamed
##       wchev), dead #codex .sp .kd, shadowed phone #tray/#bellwrap rules, stale phone dot-corner
##       rule, _tutTimer vestige, uishot dup shots removed, board-dot system fully retired [87b398c],
##       fa3 stream-preserving r(). deadcode.js clean (3 keepers probe/tool-referenced).
##   ⚠ LESSON: proof sheets can MASK integration bugs — biome-coverage/vistas-big passed genes the
##   game call site didn't; audit the GAME call site, not just the sheet. NOT YET SMOKE-PROBED:
##   graduation-restart self-heal (needs a quit-mid-training harness — future smoke work).
## ▶▶▶ 2026-07-25 ELEVENTH DIRECTIVE — EXTERNAL CODE REVIEW (CODE_REVIEW_EXTERNAL_2026-07-25.md,
##   Nick: "fix everything"). 14 findings, 13 verified real, ALL 14 ADDRESSED (gates: fp MATCH 50/50
##   incl. BOTH fp-sensitive fixes proven identity · smoke 426/0 w/ 9 NEW regression checks ·
##   layout 546/9 · new version-consistency gate):
##   CF-CR-001 search-sink XSS → esc() at the sink + codex from/where sanitized on load (from strips
##     markup ≤48ch; where via _sanitizeView). CF-CR-002 affix resurrection → _clearDeadAffixes on
##     last-copy destruction (single+bulk salvage); stale affix no longer blocks exceptional forges.
##   CF-CR-003 320k-power saves → battleStats caps EFFECTIVE brood/fed at 200 (share-code ceiling;
##     fp-proven identity), load xp clamped 486 (levelOf caps at 9). CF-CR-004 → validate.js now
##     FAILS if GAME_VERSION ≠ package.json (bump itself stays bundle-time, Nick's word).
##   CF-CR-005 4.6MB saves → atlasThumb rebuilds EVERY kind (planet/star/galaxy/moon/comet/belt)
##     from seed; _cw keeps slimGal fields (numbers, not base64); save strips all regenerable thumbs
##     (legacy galaxy entries w/o gal.seed keep theirs, never blank). CF-CR-006 → portrait cache
##     1200 FIFO → 256 TRUE LRU (hit re-files; ~356MB worst-case → ~75MB) ⚠ AUDITED INVARIANT
##     CHANGED deliberately (phone-heat mandate). CF-CR-007 mirror duels 93.5% first-slot → seeded
##     CASCADED-hash coin (hashInt's h^x collapses for identical/xor-related seeds — the naive coin
##     measured 100% one-sided!) → 50.1% measured over 5,000 mirrors, fp MATCH (no probe duel ties).
##   CF-CR-008 prime where → _sanitizeView. CF-CR-009 → all load arrays length-bounded (_capA).
##   CF-CR-010 → 8192-char cap on CF1/CFB before decode. CF-CR-011 → browser zoom re-enabled
##     (iOS ignored the lock; canvas gestures preventDefault) + role=dialog/aria-modal on the 5 big
##     overlays; keyboard Navigator stays deferred (feature build, post-Forge). CF-CR-012 → RAF
##     STOPS on document.hidden, resumes on visibility. CF-CR-013 → fonts SELF-HOSTED (2 variable
##     woff2 latin subsets embedded base64, ~93KB; zero third-party requests, offline-proof).
##   CF-CR-014 → tools/deploy.js RUNS validate+smoke+uilayout and aborts on failure (--skip-gate
##     escape hatch); package.json test/smoke/layout/deploy scripts added.
##   ⚠ LESSONS: (1) hashInt(a,b,·) DEGENERATES when a,b are equal/xor-related (opening h^x is
##   constant) — cascade nested hashInt for pair-keyed coins. (2) smoke's salvageItem hook added to
##   probe-names.json (tools-only, fp-neutral). DEFERRED from review (roadmap): keyboard Navigator +
##   full a11y batch · OffscreenCanvas/worker portraits · source split into modules · savegame
##   schema/migration pipeline (ties save export/import design).
## ▶▶▶ 2026-07-25 TWELFTH DIRECTIVE — EXTERNAL RE-REVIEW (CODE_REREVIEW_EXTERNAL_2026-07-25.md;
##   confirmed ALL 14 prior fixes hold; found 1 NEW security defect + hardening items — Nick:
##   "another pass"). ALL ADDRESSED (fp MATCH 50/50 · smoke 430/0 w/ 4 new regressions · layout
##   546/9 · all 3 deploy gates verified):
##   CF-RR-001 (High, NEW) legacy-thumb XSS — MY OWN legacy mitigation kept saved data:image
##     strings and both sinks concatenated into src="" — a crafted `…;base64,x" onerror="` broke
##     out. FIX: strict load validation /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/
##     (no quote can exist; canvas toDataURL always passes) + esc() at BOTH sinks (belt+braces).
##   CF-RR-002 save resilience — `{}` where an array belonged THREW mid-load; outer catch dumped
##     the WHOLE save (fresh boot then SAVES OVER real progress). FIX: _capA moved to top of
##     loadSave (12 more loops guarded + bx/seen bounded; a bad field loads empty, rest survives)
##     + LAST-KNOWN-GOOD BACKUP (raw stashed to SAVE_KEY_bak after every proven-good load;
##     corrupt primary restores from it with a 🛟 toast; reset clears both; loadSaveWithRecovery
##     exported 3-site). CF-RR-006 portrait cache DEVICE-TIERED (phone 96 / desktop 256) + pagehide
##     flush. CF-RR-007 prefers-reduced-transparency kills backdrop-filter (OS opt-in only — glass
##     stays default). CF-RR-003/process: deploy REQUIRES --release X.Y.Z matching GAME_VERSION+
##     package.json; --skip-gate needs CF_EMERGENCY_DEPLOY=I_ACCEPT_UNTESTED_RELEASE. CI ADDED
##     (.github/workflows/test.yml: npm ci + full battery + rarity-sanity + deadcode on push/PR;
##     uilayout browser now resolvable via CF_BROWSER/linux chrome paths). FONT-LICENSES.md (OFL).
##     _cbT dead const removed. ⚠ LESSON: a "keep legacy data" mitigation is itself an INPUT PATH —
##     validate what you keep. ⚠ LESSON 2: module-scoped fns need the 3-site export (API banner +
##     freeze + destructure) — ReferenceError caught by validate's jsdom boot.
##   ⚖ RESOLVED (CF-RR-004, Nick 2026-07-25: "2.5× titan") — LINEAGE SOFT KNEE shipped [30bbda7]:
##     combined bonus identity ≤1,000 (realistic creatures/live saves byte-identical), saturates
##     above (asymptote 1,700) → maxed 200/200 = +1,500 ≈ 2,250 total (~2.5× titan ~900) vs old
##     ~6,600. Monotonic; fp MATCH; smoke asserts knee identity + maxed delta. §24 pass retunes
##     the knee/asymptote knob if wanted. Curve documented in COMBAT_AND_CONQUEST.md.
##   ⚠ CI NOTE: first workflow run (b8d021e) FAILED w/ deprecation warning — @v4 actions forced
##     onto Node 24; bumped to @v5 + env-echo step + explicit CF_BROWSER [30bbda7]. If the run at
##     30bbda7 still fails, get the failing STEP from the Actions page (or gh auth) — candidates:
##     slow-runner smoke `until()` timeouts, or chrome/CDP quirks in the layout gate on ubuntu.
##   DEFERRED (unchanged): instance-based gear (§5, pre-loot-depth) · adaptive/dirty-frame render ·
##     module split · Object Navigator + a11y batch · seeded action-RNG (anti-save-scum, design) ·
##     per-section save schema/migration (ties export/import).
##   ▶ AWAITING NICK — iPhone device verify + the §24/lineage-ceiling call; THEN bundle-time
##   (bump GAME_VERSION+package.json to 1.7.0, RELEASES notes, `node tools/deploy.js --release
##   1.7.0` [self-gating], push source, final Gold zip + release archive).'S REVIEW of the zip. KNOWN DEFERRALS (next pass): eagle hook strength · gerenuk neck
##     (rig param) · red-panda tail rings · dart-frog contrast at card size · settings-panel anchor could sit
##     closer to the dock ⚙ on desktop (cosmetic) · desktop caption-vs-hint overlap at boot (pre-existing,
##     cosmetic). THEN: bundle-time items (RELEASES notes, GAME_VERSION bump on Nick's word, deploy site+
##     source, iPhone verify list).
## ▶▶▶ 2026-07-25 EIGHTH DIRECTIVE — TWO MORE REVIEW DOCS TRIAGED (both saved to repo):
##   GAP_AUDIT_2026-07-25.md ("Build Gap Audit"): P0 items 1,3,4,5,6,8 ALREADY DONE this arc (universal rarity,
##   save validation/hardening, canopy, ring grammar, deepspace labels, gear-on-ladder); P0-2 Earth-cap = N/A
##   (grades are fingerprinted generation — recapping breaks determinism law); P0-3 migration = our absent-safe
##   field policy + feeds the EXPORT/IMPORT DESIGN (adopt: versioned save envelope w/ schema fields when built).
##   ADOPTED: save-size budget w/ warning threshold (ties CF-002) · mirror-duel test in balance sim (ties v1.6
##   deferral) · sting-coverage audit (playRaritySting exists — verify flora/material discovery coverage) ·
##   BALANCE.md numbers snapshot generated from code · release-gates checklist AT BUNDLE TIME. DECLINED (scope/
##   fit): durability-repair, spoilage, vendor/auction/multiplayer economy, weapon families, PvP normalization,
##   full 19-field schemas, document-owner bureaucracy, modifier compatibility matrix (worldgen derives
##   properties structurally — cannot produce the contradictions the matrix guards). DEFERRED w/ quality grades+
##   uniques+bio-ingredients (post-Forge): recipe-acquisition progression (hybrid unlock model — Nick's call,
##   changes the fixed-recipes simplicity principle).
##   RUNTIME_INTEGRATION_2026-07-25.md: ADOPT NOW — actual-size proof standard (every family proofed at master/
##   gameplay/icon sizes — fold into the full proof set) · sheets-regression runner (render ALL sheets, no
##   ERROR cells) · UI-scale proof sheet (cards/icons at true size). FOLD INTO EXISTING QUEUES: gameplay-state
##   readability + accessibility redundancy (accessibility batch) · tutorial-uses-real-art (training redo).
##   ROADMAP (post-Forge candidates, Nick decides): ANIMATION/locomotion system (big — Steam-worthy but a new
##   engine layer) · ecology-in-motion (herds/packs/predation behavior) · procedural AUDIO identity (creature
##   calls from genome) · breeding PREVIEW UI (deterministic spoiler tension — design taste call) · duplicate-use
##   /bad-luck-pity systems · lineage archive/memorials · store/key-art/trailer assets (Steam prep) ·
##   localization. NOTE: visual determinism concern = covered by policy (saves store seeds not pixels; painter
##   changes are deliberate, RELEASES-noted).
## ▶▶▶ 2026-07-25 SEVENTH DIRECTIVE — GOLD MASTER TRIAGE (GOLD_MASTER_2026-07-25.md saved to repo; Nick's
##   compiled Part I materials/gear spec + Part II art Gold assessment; verdict "Near-Gold, hold for one
##   focused correction pass" — ACCEPTED, feedback delivered, awaiting Nick's go on execution).
##   PART I = COMPLIANCE AUDIT DONE (MATERIALS_AND_GEAR.md §26): shipped build already satisfies all 15
##   Final Rules in scope (_itemRarity anchors on blueprint tier NOT rarest ingredient; veins gate by tier;
##   landing never rerolls; skim = survey→unlock→extract; deterministic crafts). DEFERRED deliberately:
##   quality grades (Crude→Perfect) → masterwork/Uniques arc; 19-field instance schema → exceptional vein
##   IS our instance model; biological ingredients (§10 harvest parts) → post-Forge; independent ilvl →
##   only if balance ever needs it (§24 validated without).
##   PART II = THE GOLD CORRECTION PASS, three waves (full detail in ART_DIRECTION.md 2026-07-25 block):
##   ★ APPROVED GOLD, do not reopen: procedural creatures (architecture/blending/materials/aquatic/plans),
##     large-planet direction, BH + quasar direction, gas-deck vistas. First external GOLD on the renderer.
##   WAVE 1 (blockers): (1) FLORA CANOPY UNION — adopted the review's mask→union→blur→threshold→distort→
##     gradient pipeline; acceptance = no construction circle visible at 100%/200%; lifts all 334 flora +
##     vistas (= soft-mass queue #1). (2) Earth-flora identity organs wave 2 (kill the 7 repeated templates).
##     (3) PUSHBACK: liveview ring "seam" = the SHEET's rect clip (game split+shadows correct since 927e41b)
##     → rebuild sheet on real draw grammar. (4) deepspace label overlap = sheet cosmetic → fix + add TRUE
##     relative-scale star row (both are 2nd re-flags — the proofs must stop lying about the game).
##   WAVE 2 (high): fauna identity wave 2 (frogs/bird sub-rigs/ungulate horns/small mammals/turtle feet) ·
##     R4 spike-fur-feather polish · moon geology + dedicated small-size masters · wormhole throat +
##     molecular-cloud punch · open-sea per-salt variation.
##   WAVE 3 (polish): coast-halo breakup · cloud fronts/storms · star-class surface behavior + WD density ·
##     wing-count silhouettes · then ONE full regression proof set → §10 Gold retest checklist.
## ★★★ v1.7 BIOME-COHERENCE / ZOOM / CATALOG POLISH = DONE (2026-07-23, same session; each commit battery-green:
##   fp MATCH 50/50, render 1010/0, biome-audit PASS, smoke 396/0, layout 546/9; pushed). "One visual language
##   everywhere — the thing on the planet is the thing in your Compendium" (Nick).
##   (1) GAS BIOMES ALIVE [fbee7ce]: a gas giant's biosphere is microbial + aerial flora + rare air fauna, but the
##     deck only drew a generic floater gated on the (~0) macrofauna air-count → looked lifeless. Now paints the
##     world's ACTUAL aerial ecosystem: floating cloud-gardens (its af flora) + gas-bladder colonies + aeroplankton
##     + its real AIR CREATURES as flying silhouettes (hdBeastBare, same genome as their portrait). openLandingVista
##     threads airGenes/aerFlora → showVistaBox → _hdDeckScene.
##   (2) FLORA CONSISTENCY [5a8d0b8]: extracted _floraSpx(g) + hdFloraBare(g,seed) (the flora parallel to hdBeastBare)
##     out of hdPortraitFlora (BYTE-IDENTICAL refactor). The VISTA now draws the world's ACTUAL terrestrial flora
##     species — desert cacti / jungle broadleaves / meadow ferns — not a generic canopy; flora-less worlds keep the
##     tuned generic dressing (fallback). Creatures ALREADY shared hdBeastBare across portrait/card/vista (confirmed).
##   (3) SMOOTH ZOOM [2fb3433]: a discrete mouse wheel snapped zoomAt() step-by-step across universe→galaxy→system.
##     Wheel/double-tap now ease toward a cursor-anchored TARGET each frame (_stepZoomGlide, 0.32); pinch/programmatic
##     stay immediate; Motion:Reduced instant. ⚠ FEEL change — needs Nick's interactive check on a wheel device.
##   (4) STAR CLASSES [f662e54]: MAG/PROTO/RG-SG made distinct (see the sweep entry below). Docs all synced [3978f07].
##   (5) THE LANDING ROLL [183e757]: Earth was SPECIAL-CASED OUT of the %-weighted landing roll (always the same
##     vista) and the roll only changed per 20-min epoch. Now: Earth rolls its REAL surface mix (_EARTH_LANDING —
##     ~71% seas incl. coral/archipelago/storm belts, ~29% land split temperate/jungle/savanna/tundra/wetland/karst/
##     saltflat; histogram verified: opensea 55%, savanna 7.5%…), the salt re-rolls PER LANDING (_vistaSalt =
##     epoch*997+stats.landings), and the vista's RESIDENTS match the rolled region (openLandingVista rolls ONCE →
##     xtra.wb; fauna filtered by the biome's rig families + per-landing seeded shuffle). Terran sea-rolls show the
##     shore scene; coral/abyssal keep their reef/deep routes. Anchor biome (veins/odds/generation) untouched — fp
##     MATCH. ⚠ training's first Earth landing rolls too (~55% ocean splash-down) — kept, flagged for Nick. Proof:
##     tools/sheets/earthlandings.js.
## ★★★ 2026-07-24 BATCH (Nick: "continue the roadmap suggestions" + dead-code purge; every commit battery-green
##   fp MATCH 50/50 · smoke ↑410/0 · layout 546/9 · render 1010/0; all pushed):
##   (1) GLYPH DEAD-CODE CLEANUP [0eaa038] — all SEVEN dead star-render sites excised (spCard .rar, Atlas .rstar +
##     logMap star field write/load-sanitize, found-list gstar, reveal gbadge, 3 cinematic/toast appends) + dead
##     #codex .sp .rar / #log .item .rstar CSS. KEPT: .ic-chip.rar (live item-card chip) + data-layer star:'' (fp).
##   (2) FULL DEFUNCT-CODE PURGE [9260056] — NEW tools/deadcode.js (reusable zero-ref scanner: game+markup+CSS+
##     probes+checks+sheets corpora; every candidate hand-verified). Removed 12 JS symbols (colorDNAFor, biomeProfile
##     accessor, pick1, SP_KINGDOM, SAP_LABEL, watery, finpt, matInfo, whole retired Prime-claim chain incl.
##     speciesSignatures/worldSignature + no-op call sites) + 11 dead CSS rule-groups (.actrow .dstats .dship
##     .gstep(s) .ic-equip .pframe/.pav/.pmeta/.pname/.prank .splist; fs-lg/xl compounds trimmed keeping .gsub).
##     KEPT deliberately: Color-Atlas trio (gate-tested in validate), _titanElemOf (probe-hooked), ELEM_ICES (sheet).
##   (3) §5 INSTANCE RARITY = DESIGN CALL RESOLVED [092a281] — "the EXCEPTIONAL VEIN": vein-level resolution meets
##     §21 stack-by-substance. exVeinFor (~15% of worlds, own palette, own rng stream — cv fp-discipline), sparse
##     extra trickle, ✦ sub-count on the SAME card (cgx, save field cgx, absent-safe, load-clamped), exceptional =
##     base+1 clamp 6 (exTierOf), cosmics excluded. _spendMat burns exceptional first; FULL exceptional coverage ⇒
##     EXCEPTIONALLY FORGED (seeded affix via spoils machinery, never clobbers a live enchant). 8 sentinels; §5 doc.
##   (4) §8b SKIM DESIGN PASS (delegated) [77ac43c] — CORONA SCOOP sys (reqs Jump Drive, costs 1 hand-skimmed Pls):
##     +1 sample/pass + ~50% deeper corona (exhausted stars reopen), bonuses OUTSIDE the seeded draw. REMNANT'S BITE:
##     WD/NS/MAG/BH skims cost 3 HP unshielded (never lethal — <5 HP refused); the Scoop ends it. 3 sentinels; §8b doc.
##   (5) §22 REMAINDER [b04ea3c] — TIER STRUCTURE layer in partIcon (the tier changes the MACHINE: rig conduit→plasma
##     core, suit tanks→shoulder armor, helm pods→antenna+halo, glove/legs/boot/probe/charm/struts each evolve) +
##     bespoke 'scoop' painter (was falling through to charm gem) + SHIP HULL TIERS in shipImage (Jump=armored spine
##     +nose cap, IG=luminous seams+wingtip beacons, Scoop=golden ventral ladle; scout silhouette persists). Proof
##     sheets reviewed: gear-tiers + NEW tools/sheets/shiptiers.js (⚠ harness gotcha documented: never lift `items`).
##   (6) WINGED BODY-PLAN PASS [d1e11fa] — Nick's "gas fliers read as floating quads": wings now DOMINATE (span
##     0.30→0.42, peak −0.44, scalloped trailing edge); AIRBORNE winged tucks to 2-leg flight stance, grounded keeps
##     full limbs (gryphon grammar). Proc plans only (Earth rigs untouched). NEW tools/sheets/winged.js reviewed.
##   (7) §24 EMPIRICAL VALIDATION = COMPLETE, PASS — archetype balance-sim PASS (all 17 in the 42–58% band; fury 55.6
##     top, enrage 45.6 floor; healthy counters ±29 max). fast-500 CLEAN (0 err/death/softlock, funIndex 6.9 ≥ v1.6's
##     6.87). deep-500 CLEAN (0 deaths/softlocks; funIndex 5.6 ≥ 5.5; broad gear adoption; drought mean ~36 = the SAME
##     pre-existing staleness signal, unchanged by v1.7 — the Expedition Contracts suggestion is its designed fix).
##     The affix ramp + cosmic gear did NOT distort deaths, stage progression, or equipment spread. §24 validated.
##   ▶ STILL QUEUED (each its own focused pass): charter-training module · accessibility (CF16-012 pinch-zoom +
##     CF-006 keyboard Navigator — needs device verify) · TEXT-POLISH re-pin (fingerprint re-pin — do with Nick) ·
##     rest of PROCEDURAL_CHARACTERISTICS pass order (proc HEAD system, tail-types, marquee traits, eye/limb counts).
## ▶▶ THE SOFT-MASS PASS (Nick 2026-07-24: 'blended colors, not just circles' — PRINCIPLE ADOPTED):
##   soft subjects (snow/water/mist/canopies/clouds/tissue) = layered radial gradients with feathered edges;
##   hard subjects (crystal/plate/machinery/ice SHARDS/coral skeletons) keep crisp edges — that IS their identity.
##   SHIPPED: tundra drifts + swamp pools + coral shallows [bd5a0f5]. AUDIT QUEUE (priority order): (1) FLORA
##   CANOPIES — berry bushes + round-crown trees are circle-piles; converting the canopy painter to gradient
##   clumps lifts all 334 flora at once; (2) moss/lichen mats; (3) vista foliage clumps; (4) gas-giant storm
##   flecks. Creature pipeline + planets/stars/nebulae already gradient-based (audited clean).
## ▶▶▶ 2026-07-24 SIXTH DIRECTIVE — PROOFSET-2 REVIEW TRIAGE (PROOFSET2_REVIEW_2026-07-24.md saved to
##   repo; Nick: 'we need to get this right and proceed'). VERDICT ACCEPTED: identity fidelity is the gap, not
##   rendering. THE SIGNATURE-FEATURE PASS is the program of record, four enforced rules:
##   (R1) every named Earth animal gets MANDATORY anatomical identifiers (recipe-declared, silhouette-level);
##   (R2) every named Earth plant gets a MANDATORY identity organ readable at icon size;
##   (R3) every landing biome gets a DISTINCT environmental composition (coral/mangrove/swamp/tundra scenes
##        currently share the inland-settlement template — scene recipes per biome family);
##   (R4) every procedural trait gets a MINIMUM READABLE FOOTPRINT (horn/mandible/eye-count/limb-offset
##        minimums; translucent = soft organs not machinery rectangles; wing sweep in flight).
##   EXECUTION ORDER: (1) MARKINGS layer in the pelt pass (mask/eye-patch/leg-stripes/chest-mark/belly-
##   contrast, recipe-declared) + flagged-fauna recipes (panda, orca, okapi, bears, walrus tusks, elephant
##   TRUNK as real rig anatomy, ape differentiation: arm length/stance/bulk, bird sub-silhouettes: swan-swim,
##   raptor, puffin bill, hummingbird scale) → re-proof pages. (2) FLORA identity-organ system (signature
##   fruit/flower/rhizome/pod per plant — rafflesia/banana/coffee/cacao/durian/papaya/spice-row first) —
##   the review's #1 blocker. (3) R3 STATUS 2026-07-24: era:town artifact REMOVED from the proof sheet (settlement/roads were sheet-forced; all 31 wb biome cases exist in-engine). REMAINING REAL WORK, now precisely visible: STRENGTHEN the weak wb washes — tundra must read SNOW (pale ground+sky, frost haze), swamp = standing water + dead trees, mangrove = channels + root stilts, coral-land = turquoise shelf + reef forms; + OPEN-SEA VARIETY (island count/placement, wave strength, sun position, shore curvature per salt). Histogram confirmed ~70% sea-family per spec. (4) Procedural trait minimums (R4).
##   PUSHBACKS RECORDED: live-view ring 'seam' = the LIVEVIEW MOCK's crude clip (in-game split+shadows are
##   correct) → FIX THE SHEET so proofs reflect the game; deep-space heading overlap = sheet cosmetic → fix;
##   70/30 landing spread claim → validate with a 10k-roll histogram (classification: coral/archipelago/marsh
##   count as SEA in the 70). Star-class SIZE differences exist in-game (sheet renders equal-size — add true
##   relative scale row to the sheet so reviews stop re-flagging it).
## ▶▶▶ 2026-07-24 FIFTH DIRECTIVE (Nick) — THE 1.7 POLISH SUPER-QUEUE. Inputs: VISUAL_REVIEW_2026-07-24.md
##   (Nick's upload, saved to repo) + "advanced briefings + content completeness + ALL QoL + full Earth-catalog
##   one-by-one polish + procedural-trait pass + breeding cohesion, proof sheets when done".
##   DOCK ANSWER: the shipped dock IS universal — ONE bottom dock on both platforms (labels on desktop, icon+count
##   chips ≤520px). No second design needed; device verify still pending.
##   VISUAL-REVIEW TRIAGE — ✔ COMPLETE 2026-07-24 incl. venus circulation + moons −10% [83a6c54]. Original:
##   FIX-FIRST — ✔ ALL DONE 2026-07-24 (quasar jets ff/knots/asym [b5fe614] · ring shadows both ways [927e41b] + 2nd gap/grain [b8c0f37] · nebula multi-scale [553f849] · BH turbulence/lensing/soft-horizon [05616f9] · star-class textures [b936805] · coasts/vortices/cloud-wind [ff6e618]). Original list: (a) QUASAR JETS — tapered irregular plasma w/ knots + emission cone +
##     asymmetry (review's #1; rectangular beams confirmed). (b) RING OCCLUSION+SHADOWS — planet shadow across
##     rings + ring shadow on planet + uneven band opacity/grain/gaps (in-game draw already splits back/front; the
##     seam was the LIVEVIEW SHEET's clip, partly sheet artifact — but shadows are real gaps). (c) NEBULA
##     STRUCTURE — multi-scale: filaments/cavities/dust lanes per type (h2 dust lanes + wind cavities, reflection
##     directional light, mol silhouette+rim, remnant shell+filaments). (d) BH polish — soften horizon edge ~1px,
##     baked smeared star-arcs near photon ring, disk turbulence, −12% peak ring brightness.
##   PARTLY-DONE / PUSHBACK (recorded, see reply to Nick): star-class SIZES already differ in-game (starR; sheet
##     drew all at equal size — hid it); distant-moon softness mostly a sheet-blowup artifact (28px master IS
##     dedicated, draws ≤34px in-game); dynamic terminators + slow clouds ALREADY LIVE (review predates them);
##     moon-size −10–20% = do −10% only where pick-targets stay ≥ floor (tap safety).
##   STAR-CLASS TEXTURE differentiation (medium): flare regions on M dwarfs, prominence plumes on SG, tighter
##     hotter granulation on B, restrained WD halo — extend _starSurf kind params.
##   PLANET SURFACE round 2 (medium): coastline halo break-up (beach/wetland/cliff variants by noise), weather
##     fronts + spiral storms + land/ocean cloud density, fractal cap edges + glacial tongues (cap noise shipped;
##     push further), gas-giant storms/vortices/band-width variety, venus circulation layers.
##   THEN THE BIG CONTENT PASSES (each its own arc, Nick 2026-07-24: "proceed with all four, don't wait"):
##     (1) ✔ ADVANCED BRIEFINGS SHIPPED [44ef2f1] — 5 drills from the Guide 🎓 row, zero-lockdown runner, 4 smoke sentinels; full-UI coverage now: 20-step training + guardians step + charter finale + 5 drills + Guide. (2) CONTENT-
##     COMPLETENESS slate. (3) ALL QoL slate. (4) EARTH CATALOG ONE-BY-ONE — audit all 1010 vs real counterparts
##     (rig-audit classifications + per-species silhouette review via catalog pages), fix misreads; PROCEDURAL-
##     TRAIT pass (head/tail/marquee/eye-limb) + BREEDING COHESION; proof sheets to Nick at each stage.
##   + TRAINING & GUIDE ADDITIONS (Nick, same directive): (a) TRAINING ORDER REVIEW — walk the 20 steps as a new
##     player would play (zoom Earth → survey → Atlas → …), verify each step's order matches the intended game
##     flow; document the audit in the roadmap even if no changes needed. (b) FILL THE GAPS: a CHARTERS step
##     (accept + complete flow, already the finale handoff — teach the BOARD earlier too if order review says so)
##     and a PRIME CODEX step teaching the GUARDIANS: how signatures are retrieved (fell elemental TITANS), how
##     to challenge a boss (land + survey → face it or send champions), and what it takes to win (bred/tamed
##     champion power, gear, element reach). Keep the "Guide has every answer" closer — Nick likes it. (c) GUIDE
##     FULL AUDIT — every Guide entry checked against v1.6/v1.7 reality: dock wording (done), 3-tab hold, item
##     windows/affixes/salvage, materials/cosmics/exceptional veins, skimming + Corona Scoop + remnant bite,
##     rarity discovery-gating, 10-tier ladder names, landing roll variety, titan/signature flow; ADD entries for
##     any shipped system with no Guide presence (Forge economy, exceptional forging, skim).
## ★★★ 2026-07-24 FOURTH BATCH — Nick's build directives (commits eeb7e16→99fe900, battery-green, pushed):
##   ✔ LIGHTING VERIFIED ACCURATE (sprite light re-aims at the star per frame, star-tinted lit overlay, terminator
##     sweeps with orbit, city lights night-side only — answered in code, no fix needed).
##   ✔ DRIFTING CLOUD DECK — a second upper cloud layer (own noise stream, _cloudSpr) slides across terran/ocean
##     worlds; motion-gated, close-up only, 2 draws/frame. The living-planet feel without per-frame rasterizing.
##   ✔ THE BOTTOM DOCK (Proposal A picked by Nick) — the 5 right-rail pills docked bottom-center, SAME ids (all
##     spotlights/gates/smoke intact), phone folds labels into icon+count chips, hint/?/⚙/bottom-pinned training
##     cards step above it. Layout gate passed 546/9 WITHOUT re-pin. ⚠ THE arc's most visible change — iPhone
##     verify FIRST next session.
##   ✔ TRAINING → CHARTER HANDOFF — the finale spotlights #chbtn and sends the graduate to accept their first
##     contract; all 8 '(right rail)' texts across toasts/Guide/training updated to '(bottom dock)'.
##   ▶ STILL TO BUILD from this directive (next session, in order): (1) ADVANCED BRIEFINGS training modules (the
##     5-drill plan below — Nick wants EVERY part of the UI taught; audit each screen against training coverage:
##     dock pills, character sheet/paperdoll/3-tab hold, item windows, salvage, veins trio, skim, discovery
##     gating, Records, Events, Beacon, Guide search) + a light pass re-checking the 20-step flow against the
##     DOCK layout on device. (2) CONTENT-COMPLETENESS slate (Nick approved: pick order from the block below).
##     (3) QoL SLATE builds (journal + recipe tracker first). (4) Text re-polish re-pin + pinch-zoom (device).
## ★★★ 2026-07-24 THIRD BATCH — UNIVERSE-CRISPNESS (Nick: "planets everywhere? do stars + everything else") —
##   commits eeb7e16 (QoL-p dynamic ❤ heal hint) + 97fb07d, battery-green, pushed. CONFIRMED: the planet polish IS
##   universal (surfaceColor caps = every terran anywhere; limb haze = all airy types; HD tier = any focused world).
##   EXTENDED to the rest: STAR SURFACES (_starSurf — granulation + limb darkening + core lift inside the corona
##   when zoomed; giants huge cells, WD smooth; NS/MAG/BH/PROTO keep bespoke; binaries/trinaries included) ·
##   HD MOONS (160px close masters; REWORKED after Nick's live review "craters overlap / weird lines" →
##   rejection-sampled non-overlap fields, bowl shading to the light, soft rims, mottling; icy frost / volcanic
##   elbow-fissures) · RINGS 512 masters + sane cache cap. Proof: tools/sheets/starsurf.js. ⚠ iPhone verify next.
##   + DEEP-SPACE follow-up [6ce5b95]: BLACK HOLE baked cinematic _bhSpr (Doppler disc, horizon-hugging lensed
##   halo, photon ring; also a heat-rule win) · WORMHOLE 192 · QUASAR 320 · NEBULAE 256 (all four types) ·
##   GALAXY masters stay 512 BY DESIGN (64-entry cache is memory-bound; the zoom transition hands off to live
##   in-galaxy rendering which is vector-sharp). Proofs sent to Nick: universe-pass / deepspace / liveview
##   composite (tools/sheets/{starsurf,deepspace,liveview}.js).
## ★★★ 2026-07-24 SECOND BATCH — Nick's device feedback round (commit 96416e7, battery-green, pushed):
##   training feed/breed bottom-pin (step-10 rail-block screenshot) · WINDOWED cinematic card + newborn portrait in
##   the breed reveal · planet blending (noise-edge caps w/ real iceAmt weight, sea-ice vs snow, limb atmosphere
##   haze kills the ortho streak artifacts, 768/1024 HD focused-planet masters — phone capped 768 per heat pass).
##   Proof: tools/sheets/planets24.js. ⚠ ALL need Nick's real-iPhone verify (esp. planet crispness + reveal window).
##
## ▶▶ NICK'S DECISIONS RECORDED (2026-07-24):
##   · SAVE EXPORT/IMPORT = ON HOLD (Nick: version updates could break imported saves — revisit only WITH a
##     versioned-migration story: export embeds GAME_VERSION + save schema rev; import runs the same load-time
##     sanitize/coerce/clamp path as localStorage plus per-version migrations. Do NOT build until designed.)
##   · GREEN-LIT for this version: Expedition JOURNAL · pinned RECIPE TRACKER · the QoL slate below · TEXT
##     RE-POLISH (rides a fingerprint re-pin — surgical, Phase-A discipline) · PINCH-ZOOM (CF16-012) · TRAINING
##     MODULE updates covering the new systems · UI EFFICIENCY pass (direction call below) · breed-reveal window
##     (SHIPPED above) · planet blending (SHIPPED above).
##
## ▶▶ PLANET SPIN — RECOMMENDATION (Nick asked): full surface rotation means re-rasterizing the noise field
##   every frame (a 512²-1024² loop — a phone heater; against the v1.2 heat mandate). But we can get ~80% of the
##   living-planet feel for ~zero cost: (1) a separate CLOUD LAYER canvas that drifts horizontally across the
##   disc (masked to the sphere, wraps) — classic trick, reads as rotation; (2) the terminator ALREADY re-aims at
##   the star at draw time, so day/night sides genuinely shift as worlds orbit; (3) optional: a slow ~2s periodic
##   re-render of the FOCUSED planet only with a u-offset (true spin, amortized). Recommend (1)+(2) now, (3) only
##   if the feel wants more. Motion:Reduced keeps everything still. AWAITING NICK's go.
##
## ▶▶ UI EFFICIENCY REVIEW (Nick asked for thoughts — DIRECTION CALL NEEDED before the build):
##   CURRENT (phone): left name-pill + HP row; right search + bell; RIGHT RAIL of 5 stacked pills (Prime Codex /
##   Compendium / Star Atlas / Shipyard / Records) each w/ counts; bottom hint bar; floating ? and ⚙. PAIN: the
##   rail eats the right edge of the world view, collides with training cards (today's step-10 bug class), sits
##   in the top half (worst thumb reach), and 5 pill+count rows is heavy chrome for a phone.
##   PROPOSAL A (recommended) — THE BOTTOM DOCK: consolidate the 5 rail pills into a fixed bottom icon dock
##   (🐾 Compendium · ✦ Atlas · 🛠 Shipyard · 🏆 Records · ◉ Prime) with badge counts. KEEP THE SAME ELEMENT IDS
##   (codexbtn/logbtn/…) so training spotlights, gates and smoke keep working — only position/shape changes.
##   Thumb-reachable, frees the whole right edge, standard game grammar. Search collapses to a 🔍 icon that
##   expands over the topbar; ?+⚙ fold into the dock end or stay floating bottom-right above it. HP slims to a
##   thread when full, fattens when hurt. COSTS: a uilayout-gate re-pin (546 expectations updated deliberately),
##   a training-position audit (cards must dodge the DOCK now — bottom-pinned steps flip to top), safe-area
##   insets. PROPOSAL B (lighter) — keep the rail but collapse it to ICON-ONLY pills (40px squares, counts as
##   badges), auto-hide while a panel is open, move Prime Codex into Records. PROPOSAL C (minimal) — auto-fade
##   the rail to 35% while the map moves + the training-dodge hardening only. My call: A is the real fix; B if
##   you want zero muscle-memory change. NICK PICKS → then it's its own focused session with device verify.
##
## ▶▶ CONTENT COMPLETENESS — what 1.6/1.7 still leaves on the table (biomes / Earth catalog / procgen; Nick
##   asked "anything we left out"): AUDIT 2026-07-24 — several items turn out ALREADY LIVE: night/twilight landings (tod rolls from orbital brightness), aurora on high-field worlds at night, night bioluminescence (hdVista bioLume). TRULY OPEN below: BIOMES: (was: night/dawn/dusk vista variants — LIVE; ties to the landing
##   salt) · ecotone landings (a rolled COAST between two biomes — the transition zone IS the vista) · aurora on
##   high-field worlds at night · meteor-shower / eclipse sky events (wxEventFor has the slot) · underground
##   vistas (karst/lava-tube interiors — a "descend" verb on cave biomes). EARTH CATALOG: seasonal coats (arctic
##   fox white↔brown by the world's band) · juvenile/adult life stages (size gene exists, no stage read) · sexual
##   dimorphism pass (subtle crest/size per seed parity) · fungi/microbe shelves are thin vs 1010 fauna. PROCGEN
##   (the queued PROCEDURAL_CHARACTERISTICS order): procedural HEAD system · tail-types · marquee traits ·
##   eye/limb-count variety — plus NEW: bioluminescence for abyssal/night creatures (glow markings after dark) ·
##   symbiosis pairs (a creature and its flora co-spawn in vistas) · predator-prey vista moments (a chase pose
##   pairing) · true-giant scale storytelling (size 4 creatures should DWARF the herd). None started — pickable.
##
## ▶▶ TRAINING MODULE UPDATE — PLAN (Nick green-lit; build next session): the 20-step field training predates
##   the v1.6/v1.7 systems. Approach: DON'T bloat the golden 20-step path — add a second, OPT-IN "ADVANCED
##   BRIEFINGS" module (the charter-training pattern): short 3-5 step drills unlocked from the Guide/charters,
##   one per system — (1) THE HOLD: 3 tabs, materials stack, salvage + confirm toggle; (2) THE FORGE: item
##   window anatomy (rarity frame, affixes, compare), Equip/Salvage buttons, exceptional stock → Exceptionally
##   Forged; (3) PROSPECTING: veins on the survey card (biome ✦ / cosmic ✦ / exceptional ✦), rich strikes,
##   reserves; (4) THE STARS: survey → skim, the remnant's bite, the Corona Scoop; (5) DISCOVERY: rarity hides
##   until you land/catch/survey (the reveal moment). Each drill = allow-gated like field training, smoke-driven.
##   ALSO: the existing 20 steps get a light TEXT refresh where stale (rides the text re-pin).
##
## ▶▶ SUGGESTIONS FOR NICK (2026-07-24, per "think about value-adds / what we missed / player QoL" — AWAITING
##    GREEN-LIGHT, none started; ordered by impact-per-effort, S/M/L = build size):
##    LOOK & FEEL: (a) [M] EXPEDITION JOURNAL — a scrollable strip of your past landings as postcard thumbnails
##      (world · biome · date). ZERO save bloat: store only (seed, salt) pairs, re-render deterministically. Gives
##      the game a memory; pairs with the landing-roll variety we just shipped. (b) [S] TIME-OF-DAY LANDINGS — the
##      per-landing salt already re-rolls the biome; let it also pick dawn/dusk/night palettes (pal variants exist)
##      so repeat landings breathe. (c) [S] IDLE DRIFT-CAM — after ~20s idle on system view, a slow parallax drift
##      (Motion-gated, any input cancels). The universe breathes on the title-adjacent screens. (d) [L] AMBIENT
##      AUDIO BEDS per vista family (the v1.7 P5 audio pass — still the single biggest feel multiplier remaining).
##    MISSED / TRUST: (e) [S] SAVE EXPORT/IMPORT — "Export expedition file" (JSON download) + import in Settings.
##      localStorage is one cleared-cache away from loss; this is the cheapest trust feature there is. (f) [S]
##      RARITY-LADDER LUMINANCE CHECK — tiny tool asserting the 10 tier hexes stay distinguishable in grayscale
##      (a11y backstop for the color+frame system). (g) [M] EXPEDITION CONTRACTS — 3 rotating procedurally-picked
##      goals from EXISTING verbs ("skim a remnant star", "catalogue 2 jungle fauna", "forge with exceptional
##      stock") paying stardust; directly attacks the deep-sim maxDrought staleness signal using charter machinery.
##    PLAYER QoL — THE FULL SLATE — IN PROGRESS 2026-07-24: ✔(h) recipe tracker [230aac6] ✔(a2) journal v1 text+region strip [488d7c6; postcard thumbs = v2, needs vista-opts reconstruction] ✔(o) sticky hold tab [31c52eb] ✔(p) heal hint [eeb7e16]. NOTE (i) recent-worlds needs a where-blob captured into the journal entries (travel needs more than a seed) — capture it in journal v2. ✔(j)dots [9591ad4] ✔(l)batch craft [9309b09] ✔(n)Atlas filters [fd17f63] ✔(k)bulk feed [0cb83a9] ✔(q)charter chip [7304921] ✔(m)salvage undo [d281f4b]. QoL SLATE COMPLETE except (i) recent-worlds (needs journal-v2 where-blob). (Nick 2026-07-24: "list out all the QoL suggestions" — direction APPROVED,
##    items below are the build queue; ✔=green-lit by name, others pick-and-go):
##      (h) [M] ✔ PINNED RECIPE TRACKER — pin a Fabricator target; a small HUD chip shows live missing-materials
##          while you mine (reads _canCraft delta). The Forge economy's best friend.
##      (a2)[M] ✔ EXPEDITION JOURNAL — past landings as a postcard strip (world · biome · date); stores only
##          (seed, salt) pairs, re-renders deterministically — zero save bloat.
##      (i) [S] RECENT-WORLDS quick-travel chips at the Atlas top (derived from the log — no save change).
##      (j) [S] "NEW" DOTS — unseen Compendium entries / first-time materials get a dot until viewed
##          (cardExpand-style memory, tiny save field).
##      (k) [S] BULK FEED — "Feed until full" on the specimen card (one confirm, consumes flora as today).
##      (l) [S] BATCH CRAFT — ×5 press-and-hold on parts/components at the Fabricator (never on one-shot systems).
##      (m) [S] SALVAGE UNDO — a 5s "Undo" on the salvage toast (returns the piece, re-takes the mats) — softer
##          than the confirm for veterans who toggle confirmation off.
##      (n) [S] ATLAS QUICK-FILTERS — chips for ★ favorites / 🏴 conquered / ⛏ has-reserves / civilized.
##      (o) [S] STICKY SHELVES — Compendium remembers the last-open kingdom shelf; the hold remembers its tab
##          (cardExpand grammar, tiny field).
##      (p) [S] HP HEAL HINT — the ❤ chip names the best healing flora you currently own in its tooltip.
##      (q) [M] CHARTER CHIP — the active charter's next goal as a one-line progress chip under the topbar,
##          tap = open charters (kills the "what was I doing?" reopen loop).
## ★★★ v1.7 POLISH / SECURITY / BALANCE / ART-AUDIT SWEEP = DONE (2026-07-23, long remote-control session; each
##   commit battery-green: fp MATCH 50/50, smoke ↑396/0, layout 546/9, render 1010/0; all pushed). This sweep sits
##   ATOP the cosmic economy (5a/5c/5d/§8), material art (§22 47/47), and the two prior code reviews.
##   (1) VISTA/BIOME ART AUDIT [da1ab6f]: RIVERS were HARDCODED (4 control points) → every world drew one S-curve;
##     now SEEDED per world (rvQ: spring/meander/mouth vary). ROADS pick the bank the river ISN'T on (_rivMouthX).
##     SKYLINES seated into the ridge (haze skirt). TITANS: mid-body contact skirt + at-sea mirrored reflection.
##     FAUNA/FLORA ground-leveled (hdBeastBare measures the sprite's true lowest opaque row → universal seat).
##   (2) STAR CLASSES [f662e54]: MAG (field loops), PROTO (dusty disk+jets), RG/SG (swollen glow) — were
##     indistinguishable; proof-sheet tools/sheets/stars.js. Planets/space bodies/decks re-verified clean.
##   (3) GEAR ART + CRISPNESS [a956fe5]: partIcon tier-dress + function-emblem motifs; shipImage/paperdollAvatar
##     2× backing store; thumbCache capped 500 (_thumbSet) — was UNBOUNDED (CF16-005 leak).
##   (4) VISTA TAP-TO-ZOOM [bc09a58]: tap the landing view → full-screen (#vistabox.zoom); ✕/backdrop close;
##     training keeps tap-to-continue. Nick's ask.
##   (5) GAME-WIDE EXPLOIT REVIEW → ALL 10 CONFIRMED FIXED [3fb4361] (36-agent sweep): save-injection XSS (esc()
##     + coerce-on-load), NaN-camera crash from share codes/view (decodeWhere/_sanitizeView clamp all numbers),
##     captured-guardian _mult/_wf strip, salvage 100%-exotic-refund (_SALVAGE_GATED) + unequip-with-duplicates,
##     conquest-harvest anti-edit clamp, friendly-duel win-farm throttle (30s), COSMIC_EPOCH 240s→1200s (EPOCH_TICK,
##     kills sit-and-farm), tutorial landed(133) restore made conditional.
##   (6) BALANCE / POWER CURVE [38e8a40]: rollAffix tier factor was CAPPED AT TIER 6 → loot went flat exactly where
##     the hardest worlds begin. Now reaches full at tier 9 with a real ramp (shallow ~30-60% of band → summit full
##     hi, never over-rolls). Creature/champion power already ramped (battleStats 170+tier*38). Nick's "feel more
##     powerful deeper" ask.
##   (7) DOC SYNC [3978f07]: all 9 per-system CAPS docs brought current vs source (epoch, MATERIALS/ELEM_NAME, save
##     fields skx/skims/cosmics/sv/gt, capture-strip, rarity-doc banner, vista-zoom, star art); markers → 2026-07-23.
##   ▶ UI: reviewed — the palette is DISCIPLINED (--accent/--plasma + matching rgba alphas, semantic green/red, panel-
##     identity cyan/gold; no off-palette outliers) → NO standardization churn (would only risk the layout gate).
##   ▶ REMAINING v1.7 (unchanged, needs Nick): §22 gear×tier + ship-hull art · §5 instance-rarity model · §8 skim
##     design pass · §24 power-curve empirical tuning (run the 1000-tester panel on the new ramp) · charter-training ·
##     text-polish re-pin · deferred accessibility (CF16-012). RELEASES notes still written AT BUNDLE TIME (rule 7).
## ★★★ v1.7 FULL CODE REVIEW + §22 MATERIAL ART = DONE (2026-07-23, same remote session, commits d7039a0+a6fd2fe).
##   (A) §22 P3 MATERIAL ART — ALL 47 BESPOKE [d7039a0]: `_MAT_ART` per-material registry (dispatched before the old
##   family forms in _hdElemIcon) — structural 15 + precious 10 + volatiles 12 each get their OWN painterly 144px form
##   (H2O keeps the canonical spear trio; Vg/Pz keep their gems); cosmics upgraded from the proof-sheet review (Voe
##   nebula veil — the black tear vanished on dark tiles; Pro seams brightened; Si ball→wafer). Proof-sheet
##   tools/sheets/materials47.js (needs liftBetween for the registry — the simple const-lift truncates at inner `;`),
##   reviewed 47/47 distinct, zero recolor pairs. STILL OPEN §22: gear family×tier masters + ship hull tiers.
##   (B) WORKFLOW CODE REVIEW (31 agents, high effort, 3a4b839..HEAD) → 10 CONFIRMED findings, ALL FIXED [a6fd2fe]:
##   tutorial dodge DEADLOCK (card covering its own spot → flip halves, 900ms damped; !r no longer snaps card top) ·
##   cardExpand clamp 0..7→0..31 (bit-16 affix + bit-8 lineage fold memory survived neither reload) · stale
##   Salvage-All arm disarmed on closeSheet · resetMemoryState clears skimX · first-landing reveal derives
##   planetDescriptor (manual-zoom descents lost it FOREVER) · skim GATED on Jump Drive (was Chapter-1 Celestial
##   farming) · orbital cosmic-vein leak closed (cosmic row = landing payoff) · sheet dwell allows '#sheet' whole
##   screen · Apex Court blind grind → Crowns I/II/III progress + guardian-row crown overlay · skim toasts
##   notable-only (bell-tray 60-cap guard). +7 pool cleanups: stats.skims/cosmics PERSISTED (reset every session
##   before) · matName() unified in salvage/craft text · salvageItem→closeItemCard() · probe-names deduped · dup
##   350ms _tutSpot interval removed (≈half the tutorial's forced layout hit-tests on phones) · Records blank
##   star-glyph appends dropped · Guide Settings topic = FOUR tabs w/ accurate Gameplay copy. NOT fixed by design:
##   RELEASES[0] rides the v1.7 bundle (write release notes AT BUNDLE TIME — rule 7) · enter-hooks→collision
##   coordinator = CF16-001 (deferred). Battery green ea. commit: fp MATCH 50/50, smoke 387/0, layout 546/9.
## ★★★ v1.7 PHASE B (step 5a) — 47-MATERIAL DATA MODEL = DONE (2026-07-23, remote-control session, commit 66e7ef9;
##   fp-SAFE, source-only). Built the `MATERIALS` registry (main.js @section materials-registry) — the SOURCE OF
##   TRUTH for each material's {fam, cls, tier, job} (+ name/col for cosmics). 47 substances: base 15 · volatile 13 ·
##   precious 10 · exotic 2 · COSMIC 7 (Stellar Plasma/Coronium/Protomatter/Primordial Ice/Void Essence/Chronal Shard/
##   Dark Matter, symbols Pls/Crn/Pro/Pri/Voe/Chr/Dkm). Base tiers = §5 caps (industrial 0-1 · precious/tech 2-3 ·
##   defining anchors Pm/Vg/Pz=5 · stellar 7 · foundational 8 · reality-breaking 9). Accessors matName/matBaseTier/
##   matFamily/matColor/matJob/matInfo (names+colors of the 40 legacy stay single-sourced from ELEM_NAME/EC). ★ WHY
##   fp-SAFE: the registry is METADATA only — the 7 cosmics are DEFINED but NOT in DEPOSIT_PROFILES/RARE_VEIN, so
##   depositsFor is byte-identical and nothing generates cosmics yet. +9 smoke sentinels (roster 47, families
##   15/13/10/2/7, tiers 0-9, cosmics-not-vein-placed, symbols distinct). probe-names hooked MATERIALS/MAT_FAMILY/
##   matName/matBaseTier/matFamily + ELEM_NAME/DEPOSIT_PROFILES/RARE_VEIN. Battery: fp MATCH 50/50, smoke 356/0, layout
##   546/9. Doc synced (MATERIALS_AND_GEAR.md §3 "matches code as of 2026-07-23").
##   ► THEN Nick granted FULL AUTONOMY ("get everything done, don't wait, we'll review at the end") → I built the rest
##     of the cosmic economy, each battery-green (fp MATCH 50/50) & pushed. ★★★ THE COSMIC ECONOMY IS COMPLETE — all 7
##     cosmics obtainable + all 7 craftable:
##     (5a-ui) MATERIAL CARD family+role [5bf069d] + BASE GRADE [dc857c5] (displayRarity of base tier; cargo stacks by
##       substance §21 so it's the substance grade, not instance). (§21) MATERIALS TAB groups by family [8e59342] +
##       CRAFTABLES TAB groups by kind [e681539]. (5c) WORLD-COSMIC VEINS [9ce9927] — cosmicVeinFor(seed,tier), a
##       tier-gated SEPARATE vein like biome veins (tier<8 null → depositsFor untouched, mineWorld trickle gated on
##       cv → fp-SAFE, NO RE-PIN NEEDED): tier 8 → foundational Pro/Pri, tier≥9 → +reality-breaking Voe/Chr/Dkm. Survey
##       shows ✦ vein, mineWorld pays ~4% trickle, cargo load filter widened ELEM_NAME→MATERIALS so cosmics persist.
##       (5d) COSMIC GEAR [3c427ad] — the 5 world-cosmics each anchor one endgame piece (§12 defining-anchor rar 8/9;
##       §24 power modest/in-band, ⚠ flagged for power-curve tuning). (§8) STELLAR EXTRACTION [27900e5] — stellarYieldFor
##       (class→cosmic: hot→Stellar Plasma, remnant→Coronium), star card ☀ Skim Corona action = skimStar() finite run
##       (save field `skx`, additive/safe-absent, mirrors mining `mx`); + 2 stellar gear (Plasma Gauntlets/Coronal Aegis,
##       Celestial). ⚠ SKIM INTERACTION mirrors mining as a default — FLAGGED for Nick's design review. smoke 384/0.
##   ▶ NEXT (remaining v1.7, for the end review / next session):
##     • NEEDS NICK: §22 FULL BESPOKE ART (47 materials + gear + ships — HD engine law, proof-sheets, his visual review;
##       cosmics currently borrow the gem-icon form in their hue as INTERIM) · §24 POWER-CURVE tuning (1000-tester panel
##       + his feel; cosmic/relic gear effects flagged) · §8 SKIM interaction design · cosmic GEAR BALANCE · TEXT POLISH
##       (rides a re-pin). • AUTONOMOUS-DOABLE: §5 instance-rarity resolver + surface on deposits · CHARTER-training
##       module · the fp-safe DEFERRED FIXES (CF16-013 Atlas field-whitelist, CF16-015 doc/version, CF16-016 .gitignore).
##     ⚠ NEW SAVE FIELD this session: `skx` (stellar skims) — additive, safe-absent-default; note in codebase-reference §10.
## ★★★ TRAINING FLOW/OVERLAP FIXES (2026-07-23, remote-control session, commit e83aaa9; source-only, fp-safe,
##   tutorial-only) = DONE. Closed 2 of the 3 deeper per-step FLOW/STUCK bugs from the empty-ring block's "STILL TO
##   DO" list, via a full 20-step transition audit (each advance checked for a TUT_ALWAYS modal or a graced panel
##   covering the next step's spot): (c) HAZARD step (12) — the duel RESULT modal (#duelbox is in TUT_ALWAYS) lingered
##   full-screen over the #hpbar the step points at; hazard.enter now dismisses it (duelBox hidden + setArenaBackdrop
##   (null)) so the recruit sees the HP bar the parting nip drops — Nick's own suggested fix. (b) FORGE step (17) —
##   the panel sweep GRACES the character sheet across the advance (the sheet step's allow named its #rank btn), so it
##   stayed open covering the #cargobtn Shipyard rail; forge.enter now closes the sheet (closeSheet() if sheetOpen) so
##   the rail is reachable. AUDIT also cleared: step 6 vista-over-codexbtn is INTENTIONAL (text says tap Planetside
##   first; empty-ring hit-test hides the ring meanwhile) + step 18 graced yard dismisses on the "Got It" tap — neither
##   is a bug. smoke +2 guards (346/0), fp MATCH (50/50), layout 546/9. ► FOLLOW-UP (commit c4e6bf4, same session):
##   Nick's DEVICE REPRO of (b) — "I click my inventory, it pops up, then it says Open the starship — I can't click
##   the starship, the inventory is blocking me." Revealed the first (b) fix was insufficient: the sheet step advanced
##   the INSTANT the sheet opened (when:stats-open) and _tutHook advances SYNCHRONOUSLY, so forge.enter's closeSheet
##   fired in the SAME tap with no paint between → the nameplate tap would look DEAD (sheet never visible). FIX: the
##   sheet step is now a "look at this, then Got It" step (btn:'Got It', when removed — like survey-tour/card-tour): the
##   nameplate tap OPENS the sheet and leaves it open to explore, Got It advances, forge closes it on the way out AFTER
##   it's been visible → Shipyard rail revealed. smoke now a 2-tap flow +1 guard (347/0), fp MATCH, layout 546/9.
##   DEPLOY DECISION (Nick, this session, remote-control): HOLD — do NOT deploy to verify; keep source-only per BUNDLE,
##   verify when v1.7 ships. Source pushed to origin (c4e6bf4). ⚠ STILL OPEN: bug (a) "Compendium ON TOP of the
##   open inventory, stuck" — NO linear-flow repro found (during training the global one-open-per-side closer is DISABLED
##   `if(!tutDone)return` @~17929, so training leans on _tutGate + _tutPanelSweep; no step opens codex over the sheet in
##   sequence) → genuinely needs Nick's real-device repro to pin the trigger. Do NOT guess a fix (regression risk).
## ★★★ v1.7 PHASE B "THE FORGE" BUILD = IN PROGRESS (2026-07-23; Nick: "sprint through everything, don't wait").
##   DONE + VERIFIED (all fp-safe, each committed w/ fp MATCH + smoke + layout 546/9):
##   (1) SETTINGS › GAMEPLAY tab + "Confirm before salvaging" toggle (salvageConfirm, default ON, saved `sv`). [7057da2]
##   (2) SALVAGE SYSTEM — item-card even/centered Equip+Salvage buttons (kept data-equipbtn); salvageItem() returns
##       ~half it.cost (min 1), unequips, banks mats, removes item, closes card; in-card confirm (returns + "Turn off
##       confirmation") gated on salvageConfirm; SALVAGE ALL on the Crafted header (bulk unequipped tier<=1, two-stage
##       confirm). [103006b]
##   (3) ARPG ITEM WINDOW anatomy — rarity-FRAME header band (.card.framed + --ic-rc) + name band + Item-Lv chip +
##       meta chips + the AFFIXES expand/close PILL fold (default EXPANDED, shares cardExpand BIT 16 → fold memory
##       global across worlds/creatures/items, Nick's rule). smoke 342/0. [this commit]
##   (4) 3-TAB INVENTORY — the hold splits into Materials / Craftables / Gear tabs (cargoTab; §21); item tiles moved
##       into the Gear tab (Salvage All lives on its Equipment header), smoke navigates the Gear tab. smoke 343/0. [this commit]
##   ═══ the ENTIRE fp-safe UI LAYER of The Forge is now done (settings, salvage, ARPG item window, 3-tab inventory). ═══
##   (5b) GEAR-ON-THE-LADDER = DONE [this commit]: `_itemRarity(it)` maps craft tier+cat → 10-tier ladder (authored
##       `rar` overrides; fp-safe — items aren't seeded); the item window's FRAME + a rarity CHIP now wear the item's
##       true rarity (Common..Mythic), and inventory tiles tint by rarity. Icon art stays its own hue (rarity = frame
##       only, per the ladder spec). smoke 344/0, fp MATCH. NOTE: v1 tier→rarity map; the full §12 defining-anchor
##       model refines it in the economy.
##   ▶ NEXT — THE BIG GENERATION PIECE (needs its own careful, dedicated build; do NOT rush — determinism-critical):
##   (5a) 47-material DATA model (roster + rarity tier + color + family + job) — fp-safe if not yet vein-placed;
##   (5c) wire materials into depositsFor vein generation = THE RE-PIN; (5d) recipes/crafting for the new materials;
##   material rarity RESOLUTION (§5) + world-to-resource generation (§6). This turns real multi-affix/quality/sockets
##   on + fills the 3 inventory tabs with the 47 materials. (6)
##   FULL-BESPOKE ART (§22) — 47 masters + gear family×tier + ship tiers, proof-sheet. (7) generation modifiers +
##   POWER-CURVE tuning (§24) via the 1000-tester panel. Uniques DEFERRED (§24). Design LOCKED in §22–24 + the mockup.
## ★★★ TRAINING EMPTY-RING FIX (2026-07-23, Nick's 2 iPhone screenshots) = DONE [this commit]. ROOT CAUSE: `_tutSpot`
##   only bounds-checked the target VERTICALLY, so a spotlight target that was OFF-SCREEN (a right-rail button behind
##   the open character sheet — screenshot: forge step 18) or COVERED by a blocking overlay (a duel result over the
##   HP bar — screenshot: hazard step 13) still drew an empty blue pill over nothing you could reach. FIX: full-
##   viewport bounds (added rect.right>0 && rect.left<W) + a centre HIT-TEST (document.elementFromPoint — spotlight
##   only if the topmost element at the target's centre IS the target or in its family; else draw nothing). fp MATCH,
##   smoke 344/0 (jsdom already had 0-rects so training LOGIC unaffected). ✅ FOLLOW-UP (b)+(c) FIXED 2026-07-23
##   (commit e83aaa9, see the FLOW/OVERLAP block at the top of this handoff). REMAINING: (a) the "Compendium not
##   loading, sitting ON TOP of the open inventory, can't click, stuck" case — a panel-manager one-panel-rule miss
##   during training (opening a panel over the character sheet without closing it) — no linear-flow repro; needs
##   real-device repro. [DONE (b) forge step 17 — char sheet closed on enter so the Shipyard rail is reachable.]
##   [DONE (c) duel RESULT dismissed when the hazard step enters.] Nick: "go through the WHOLE
##   training module" — CF16-001/009 collision-aware layout + readiness-based mounting. He noted HP-bar/nameplate
##   steps already read better (the dodge/darken landed). Audit every step for empty-ring + overlap + stuck.
## ★★★ v1.7 CADENCE DECISION (Nick, 2026-07-22): HOLD & BUNDLE — do NOT deploy phases individually. Keep building
##   "The Forge" in SOURCE ONLY and ship the whole arc as ONE big v1.7 release when substantially complete. No
##   version bump / no deploy until then. Source can sit ahead of the live site (currently v1.6.4).
## ★★★ v1.7 PHASE A "UNIVERSAL RARITY VOCABULARY" = BUILT IN SOURCE (2026-07-22, commit 375498a, atop v1.6.4; NOT
##   deployed per the bundle decision). Collapsed the 15-tier grade system to the canonical 10-tier ladder
##   (RARITY_UNIVERSAL.md §1): Common..Transcendent, normal caps, NO glyphs (★✦✧❖ all removed), color = badge only.
##   "COLLAPSE, DON'T REMAP" — rarityRoll UNTOUCHED; new displayRarity(raw)=RARITY_V17[clamp(raw,0,9)] reads the raw
##   score AS a tier + clamps 10+→Transcendent, so universe/power/old share codes unchanged (score-6 = same creature,
##   now "Mythic"). RARITY_V17 (10 rows) + displayRarity added in main.js (exported via the SpeciesTraits module
##   boundary); GRADE_TIERS names/hex collapsed, all star:'', `pre`+SPECTRA KEPT byte-identical so planet/star ART
##   labels don't move. SURGICAL RE-PIN: exactly 7 probes changed (gradeTiers/speciesGrade/colorGrade/describeSpecies/
##   faunaDesc/battleStats/runDuel) — a field-level diff PROVED every delta is a rarity field only (name/hex/star/
##   label), ZERO generation-text/combat-number change; baseline re-pinned for those 7 only (backup verified, then
##   deleted). UI swept: Guide (rarity/guardians/chapters prose), rarity achievements (best>=7 Celestial / >=8
##   Primordial / >=11 Transcendent / >=12 apex; tiers12→all-10; tiersOwned collapses raw 9-14), ring-region notes,
##   Binder "The Spectrum" (RARITY_V17.map, Transcendent folds raw 9-14), records rarity ladder (10 rows), discovery
##   kicker ('✦ Rare Find'→'Rare Find'). SENTINELS in smoke.js (10-tier ladder / collapse 6→Mythic,7→Celestial /
##   clamp 10+ / no glyphs / no old names / no ALL-CAPS) + hooked RARITY_V17+displayRarity in probe-names.json. Gates:
##   validate FINGERPRINT MATCH, smoke 329/0, layout 546/9. ⚠ LESSON LEARNED: NEVER run `node tools/extract.js` after
##   editing main.js — it regenerates main.js FROM the html and CLOBBERS your edits (cost a full redo this session).
##   After editing main.js, run `node tools/build.js` ONLY.
## ★★★ v1.7 PHASE A PRESENTATION LAYER = BUILT IN SOURCE (2026-07-22, commit eb16e3a; RARITY_UNIVERSAL.md §3
##   items 10-12, all fp-safe/UI-only). DISCOVERY GATING: a world HIDES its grade until you LAND — renderPanel's
##   Spectral-class row shows a "land to reveal" teaser + the card border stays neutral from orbit, gated on the
##   existing `grounded` flag; the glance leak ("glance still shows the color language") is closed too. Stars/
##   galaxies still reveal on survey (gate keys on d.planetSeed). KEY: worlds carry `.designation` not `.grade`, so
##   the Atlas/log/conquest NEVER leaked rarity — no gating needed there (confirmed by a full surface map).
##   ESCALATING REVEAL: `_performLanding` fires a tier-scaled cinematic on the FIRST descent onto a Legendary+
##   world (uses displayRarity for the collapsed name/color; Common..Exotic land quietly); per-tier data-frame bands
##   (low→summit) are the readable-without-color a11y signal. CROSS-KIND COMPENDIUM: a rarity-floor filter (All/
##   Rare+/Legendary+/Mythic+, `codexRare`) under the kingdom tabs sifts every kingdom by DISPLAY tier at once (list
##   already sorts by tier). Smoke guards: unlanded world hides grade / landing reveals it. Gates: fp MATCH, smoke
##   330/0, layout 546/9.
## ★★★ v1.7 GLASS/TINT SLIDER = BUILT IN SOURCE (2026-07-22; Nick's iOS-26 "liquid glass" ask). Settings → Graphics
##   → "Panel tint": a range slider driving a new `--glass-a` CSS alpha every glass panel reads, so one dial takes
##   the whole UI from airy glass (0.40 floor, keeps text readable) to near-solid (0.98). Persists in save (`gt`,
##   absent ⇒ classic 0.72); applyGlass() + clamp; Guide text updated. Smoke guard: live apply + floor clamp. (This
##   was on the v1.7 backlog; done now as a self-contained fp-safe win.) Gates: fp MATCH, smoke 333/0.
## ▶ v1.7 NEXT (still to build, source-only, bundle when done) — THE BIG ONE: Phase B "THE FORGE"
##   (MATERIALS_AND_GEAR.md + FORGE_AND_DISCOVERY.md P2): 47 craftable materials + seeded veins (world rarity
##   decides what you mine) + 3-tab inventory (Materials/Craftables/Gear) + gear on the rarity ladder + generation
##   modifiers = FULL re-pin (deserves its own careful arc — generation-critical for Steam; the game already has a
##   base economy: cargo/ITEMS/craftItem/mineWorld/depositsFor/ELEM_NAME to build ON). THEN P3 ART = FULL BESPOKE
##   (Nick 2026-07-23, LOCKED — MATERIALS_AND_GEAR.md §22): all 47 materials get their OWN painterly 144px master
##   (NO family-recolor shortcuts — the current _hdElemIcon 4-archetype recolor is SUPERSEDED; Iron≠Titanium≠Gold at
##   a glance), 7 cosmics get bespoke otherworldly forms, gear masters per family AND tier w/ rarity frame, ship hull
##   tiers; extend _hdElemIcon/partIcon into a per-material/per-gear registry, proof-sheet ALL of it. + P4 ARPG ITEM
##   WINDOWS (Nick loves the Diablo 2 / PoE 1 & 2 feel — desktop hover + mobile tap OPENS the window; EQUIP +
##   SALVAGE are explicit device-agnostic BUTTONS (not gestures), NO corner-bracket decorations; framed stat
##   tooltip: rarity header/frame, item level, affix lines w/ ranges, quality fold, compare-to-equipped deltas,
##   socket/upgrade rows). SALVAGE GUARD (Nick, LOCKED): confirm prompt before salvage (names item + returns,
##   "don't ask again") toggleable Settings›Gameplay "Confirm before salvaging" (default ON) + SALVAGE ALL button
##   on the character screen (bulk-breaks unequipped Common/Uncommon) behind its own "Confirm 'Salvage All'" toggle;
##   both persist. See MATERIALS_AND_GEAR.md §23. + P5
##   audio + TEXT POLISH (rides a re-pin) + charter-training module + the ~16 DEFERRED FIXES. See the v1.7 pinned
##   blocks below + the three v1.7 design docs.
## v1.7 RARITY = RECORDED & READY (Nick, 2026-07-22): canonical doc **RARITY_UNIVERSAL.md** written (design
##   basis = Nick's "V1.7 Universal Rarity, Color, and Modifier Specification" upload). ONE 10-tier ladder for
##   ALL entities (flora/fauna/planets/stars): Common·Uncommon·Notable·Rare·Exotic·Legendary·Mythic·Celestial·
##   Primordial·Transcendent, canonical colors. LOCKED: NORMAL caps (no ALL-CAPS), NO glyphs (★/✦/✧), COLLAPSE-
##   NOT-REMAP (raw rarityRoll score UNCHANGED → read AS tier 0–9, clamp 10–14→9, rename 0–9, delete Anomalous/
##   Unique/Empyrean/Eternal/Omnipotent) → universe+power untouched, old codes unaffected → SURGICAL re-pin.
##   Unique=one-of-one DESIGNATION overlay (not a tier). Stars KEEP rarity (reverses the earlier remove-star-rarity
##   idea; clean presentation fixes the confusion). Rarity color = badge/frame only, never entity art. Nick wants
##   BOTH phases in v1.7, AFTER v1.6 ships: PHASE A = vocabulary (surgical re-pin, RARITY_UNIVERSAL.md §3) FIRST;
##   PHASE B = generation-modifier system (§4 — Hollow/Shattered worlds that reshape terrain, anchor-tier resolver,
##   world envelopes, Unique registry; universe-affecting → FULL re-pin) SECOND. APPROVED VALUE-ADDS folded in
##   (all Nick): GEAR/loot on the SAME ladder (item cards match); rarity HIDDEN until the discovery moment
##   (worlds=successful land / creatures+plants=catch / stars=survey; orbit = teaser only) — universal Pillar-1
##   rule; ESCALATING tier-scaled reveal (juice, biggest flourish for scarce top); CROSS-KIND Compendium rarity
##   filter/sort; per-tier FRAME so rarity reads without color (a11y). DOC PLAN: RARITY_UNIVERSAL.md is now THE
##   canonical rarity doc; RARITY_AND_GRADES.md (current 15-tier) is kept ONLY until Phase A ships (it describes
##   the LIVE game) → ON PHASE-A SHIP: DELETE RARITY_AND_GRADES.md + repoint cross-refs (this pinned list, CLAUDE.md,
##   codebase-reference). When BUILDING: update this line + the per-system docs in the same batch (rule).
## ★ STEAM IS THE DESTINATION (Nick, 2026-07-22): the game is being built toward a STEAM release. This reframes
##   scope philosophy — depth IS the product, so v1.7 adopts EVERY idea in FULL (no lean MVP). Packaging the
##   HTML/canvas build for Steam (desktop wrapper/shell) is a separate later track — noted, not scoped yet.
## v1.7 = "THE FORGE" (Nick's name). MATERIALS/GEAR: **MATERIALS_AND_GEAR.md** is now the CANONICAL design of
##   record (full adoption of Nick's reviewed spec). Key: universal 10-tier on ALL items; SEPARATE dimensions
##   (rarity/level/QUALITY(foldable)/affix/upgrade/designation); materials resolve their OWN rarity (world sets
##   eligibility/richness, not copy); finished-gear rarity anchored by DEFINING component (not rarest ingredient);
##   landing = ACCESS/sampling only, NEVER rewrites generation; stars UNLOCK extraction (survey→skim/probe→cargo),
##   no free plasma; bio parts don't copy organism rarity; 7 cosmic materials (Stellar Plasma/Coronium/Protomatter/
##   Primordial Ice/Void Essence/Chronal Shard/Dark Matter); ALL 47 materials craft-critical (each has a job);
##   deterministic craftSeed. INVENTORY (Nick): 3 separated tabs on the character sheet — MATERIALS (stackable,
##   auto-collected, ample = expanded Cargo hold) · CRAFTABLES (crafted non-gear) · GEAR bag (slot grid, only
##   equippables, grown by pack modules); materials/consumables stack, never eat gear slots. Build = Phase B
##   (post-v1.6, full re-pin). See MATERIALS_AND_GEAR.md.
## v1.7 TEXT POLISH (Nick, 2026-07-22): full grammar/spelling/capitalization/CONSISTENCY pass across the
##   FINGERPRINTED content — species/flora/fauna descriptions + trait arrays (FA_*, FLORA_FORM, FUNGI_FORM,
##   MICROBE_FORM, SP_COLOR, EX_*), planet/star DESCRIPTORS (planetDescriptor/starDescriptor/spectral), grade
##   words, and all statistics/generation text — so stars/worlds/creatures/traits/descriptions read consistently
##   "across the board". This text is fingerprinted → it MUST ride the v1.7 re-pin (SAME batch as the rarity
##   rename, one re-pin covers both). The fp-SAFE UI-chrome polish (buttons/charters/tooltips/Guide/settings) was
##   already done in v1.6 (button-verb alignment + colour→color / neighbouring→neighboring / Flavours→Flavors).
##   ALSO finish here: the deferred UI flavour→flavor instances in the Guide/card (skipped in v1.6 due to phrase
##   duplication with historical RELEASES). Standing COPY RULES: real button verbs (Land/Mine/Survey/Tame/
##   Scavenge/Breed/Feed/Heal/Scout/Duel/Craft/Challenge/Harvest/Jump), US spelling, normal capitalization
##   (no ALL-CAPS, per the rarity spec).
## v1.7 CHARTER TRAINING MODULE (Nick, 2026-07-22): add a Field-Training segment that teaches the CHARTERS —
##   how to read the board, ACCEPT a charter (the Accept button for optional quests), and complete one. Idea:
##   have the player accept the first ~3 quests during training so they learn the Accept flow. Extends the
##   existing 20-step training; keep it in the tutorial-sandbox pattern (snapshot/restore, no leaked progress —
##   see CF-001). Goal: players currently may not know charters exist or how to use them.
## v1.7 GLASS / TINT SLIDER (Nick, 2026-07-22): add a WINDOW TRANSPARENCY slider to Graphics settings — the panels
##   use a glass/blur look (backdrop-filter); let players dial the tint from full-glass → more-opaque (the iOS-26
##   "Liquid Glass" vibe), keeping a minimum tint FLOOR. Genuinely useful — the glass transparency is part of why
##   text can be hard to read behind panels (see the intro-overlap fix). ★ Nick's call: this REPLACES the
##   accessibility/screen-reader work on the near backlog → DEFER CF16-012 (zoom + keyboard/screen-reader NAVIGATOR
##   / CF-006) to a LATER time (not this arc).
## v1.7 DEFERRED FIXES (consolidated — v1.6 code review CF16-001..016 + P2-005 + earlier deferrals; per phase):
##   (A) RE-PIN / generation-touching → Phase A/B: rare-vein DEDUP (P2-005) · MIRROR-DUEL tiebreak (CF16-011/CF-004,
##       runDuel — fp + champion codes) · NAME VARIETY epithet (CF-008, with the naming/text pass).
##   (B) SAVE / MEMORY: Atlas THUMBNAIL bloat (CF16-004/CF-002 — strip ALL thumbs + rebuild from seed + v5 migration,
##       rule-5) · bounded LRU portrait/thumb caches + split list-thumb (96-144px) vs detail-portrait (CF16-005,
##       mobile-memory HIGH) · Atlas-entry field-whitelist before innerHTML (CF16-013, hardening).
##   (C) ACCESSIBILITY: restore pinch-ZOOM + limit touch-action:none to #cosmos + keyboard/screen-reader NAVIGATOR
##       (CF16-012/CF-006) + modal dialog semantics/focus-trap/return + 44px touch targets.
##   (D) REAL-IPHONE mobile-onboarding LAYOUT pass (needs device testing — the review's #1 BLOCKER set): ONE
##       collision-aware tutorial layout coordinator (CF16-001) · dynamic/hit-tested spotlight targets + Forge
##       sub-step (CF16-002) · intro FIXED ACTION FOOTER so the CTA isn't below the fold (CF16-003) · single
##       event-driven spotlight tracker (CF16-009) · readiness-based target mounting (CF16-010) · charter-counter
##       wrap (CF16-006) · specimen frame/scroller separation (CF16-007) · cyan rim-light softening (CF16-008).
##       ⚠ CF16-006/007 are NOT the verb-row grid fixed in v1.6 — separate elements, still OPEN.
##   (E) TOOLING/DOCS (cheap, non-blocking): Playwright + CI + all-20-tutorial-steps + small-phone viewports
##       (CF16-014) · fix doc/version inconsistencies — README/CLAUDE 18→20 steps + smoke counts, package.json
##       1.0.0→1.6, UI_PRESENTATION stacking order (CF16-015) · .gitignore generated artifacts (scratchpad/
##       uisheets/reports) + stop tracking them (CF16-016).
##   SHIPPED already (not deferred): the 4 P2 hotfixes (Binder/save/conquest/breed) in v1.6.1; and the 2 items this
##   review calls "already present in v1.6" (tutorial stat-leak, delayed-hazard) = our CF-001/CF-003 (this session).
## v1.7 ARC = "THE FORGE & DISCOVERY" — design doc WRITTEN: **FORGE_AND_DISCOVERY.md** (source of truth for the
##   arc). Runs AFTER v1.6 deploys. Two pillars + streams: (P1) DISCOVERY — world rarity becomes a LANDING reveal,
##   not an orbital label; drop "Spectral"/color-word/★ glyphs; NEW world ladder (Nick FINAL): 0 ordinary(silent)/
##   1 Uncommon/2 Notable/3 Rare/4 Exotic/5 Legendary/6 Mythic/7-9 Unique(One of a Kind)/10+ Primordial; REMOVE
##   rarity from STARS entirely (can't land on them). (P2) MATERIALS ECONOMY — promote real elements (rock/iron/
##   aluminum/carbon/copper/silver/titanium/gold + the 4 exotics) to first-class craftables w/ seeded veins +
##   recipe roles; WORLD RARITY DECIDES WHAT YOU MINE (ties P1↔P2 into the exploration→materials→crafting loop).
##   (P3) painterly craftable/gear/material icons + ship progression hull tiers. (P4) ARPG item windows —
##   hover(desktop)+tap(mobile), affix ranges, compare-to-equipped. (P5) AUDIO parallel. SEQUENCE: materials +
##   rarity rename + star-removal = ONE bundled Nick-authorized RE-PIN (fingerprinted); art/windows second (fp-safe).
##   OPEN: confirm "remove stars" scope (star rarity + ★ glyphs; creatures unchanged) + full vein→material map.
## Optional post-lock
##   polish only (both reviews' explicit non-blockers): differentiate the look-alike clusters (marsh/swamp/
##   mangrove; ice family; rocky boulder/graben/carbon; sulfur/acid/abyssgreen; ember family) · richer
##   multi-layer ecosystems · Earth grain/seaweed + bespoke plants (rafflesia/joshua) · big-cat/bear/
##   ungulate/bird iconic passes · lineage deep-drift legibility. THEN: v1.6 RELEASE-NOTES draft +
##   GAME_VERSION bump to 1.6 (Nick's word, rule 7) → 6k/20k beta → deploy.
## PROCESS (standing): battery (validate + smoke + layout) → proof-sheet review → team panels →
##   6k/20k beta → deploy. Ship on Nick's word. See [[celestial-frontier-workflow]].
##   DEPLOY = TWO PUSHES: (1) commit source release → (2) `node tools/deploy.js` (pushes the LIVE SITE repo) →
##   (3) `git push origin main` (pushes the SOURCE repo TheDakk/Celestial-Frontier — deploy.js does NOT). Step 3
##   is easy to forget; the source once drifted 97 commits. ALWAYS push source after a deploy.

---

**History / full batch logs:** see [`ROADMAP_ARCHIVE.md`](ROADMAP_ARCHIVE.md) — every v1.6 batch
(1–14), the v1.5 charter, and all superseded session-handoff blocks, newest-first.
## ▶▶▶ 2026-07-26 GO-LIVE — ★★ v1.7.0 "THE FORGE" DEPLOYED LIVE ★★ (Nick's word: "ready for go-live
##   + 1,000-tester feedback"). Build 4264b2e → https://celestialfrontier.github.io/ via the SELF-
##   GATING deploy (--release 1.7.0 target-checked; validate+smoke+layout ALL ran and passed inside
##   the deploy). Source pushed + tag v1.7.0; release archive cut (releases/v1.7.0-4264b2e/: build,
##   SHA-256, both fingerprints, layout report — dir gitignored). RELEASES[0] "The Forge" notes ship
##   the whole arc. Bundle-day lessons: (1) the version bump broke 2 smoke checks pinning 'v1.6'
##   text — version checks are now DYNAMIC via H.GAME_VERSION/H.RELEASES hooks, never re-pin again;
##   (2) package-lock must bump WITH package.json or npm ci hard-fails.
##   ★ CI ROOT CAUSE (Nick's "437" = log line ~400): the ONLY failing check across all 3 red runs
##   was smoke's 'Escape closes the Nameplate menu' — same-tick close assert passed on local Node 26,
##   failed deterministically on CI Node 22 (jsdom event-timing differs by node major). Fixed: check
##   allows an async beat (until 1500ms — intent unchanged), CI pinned to Node 26 for LOCAL PARITY,
##   upload-artifact@v6. Logs were pulled via the git credential-manager token → GitHub API (gh CLI
##   unauthenticated — this path works for future CI triage).
##   ▶ IN FLIGHT: 1,000-tester sim (fast 600 + deep 200 + chaos 140 + ui 60) → feedback report to
##   Nick. THEN: Nick's real-iPhone pass on LIVE v1.7.0 · watch CI run at aeccae8 · post-Forge queue
##   (§24 knee retune if wanted, instance gear, a11y Navigator, module split, save schema).
## ▶▶▶ 2026-07-26 POST-RELEASE DESIGN QUEUE — ★ v1.8 "THE CONNECTION" ARC (Nick 2026-07-26: the
##   feedback work is its OWN NAMED ARC, not a 1.7 patch — working title "The Living Bond" TBD).
##   VERSIONING LAW REAFFIRMED: minor lines = themed arcs; 1.7.x stays FREE for Forge-era hotfixes
##   (iPhone pass / live findings ship as 1.7.1+ without waiting on feature work). The SIX quick
##   items OPEN the 1.8 line; the deeper feedback items continue as 1.8.x. Same HOLD & BUNDLE
##   cadence. WAIT FOR MORE FEEDBACK before building. Source: PATH_TO_10_2026-07-26.md ("Path to 10/10",
##   built on synthetic-campaign data). THESIS ACCEPTED: better CONNECTIONS between existing
##   systems, not new systems — the creature loop's pieces don't feed each other (XP only flows
##   from wins → 55/200 deep sims hit creature L3, ONE hit L6; Rancher persona breeds 4,575 times
##   for the LOWEST fun score 5.18). CAVEAT: the 35.3% no-op rate is persona-inflated (blind
##   attempts); fix is right anyway. PUSHBACK: training (8.7/10, 300/300) needs nothing now;
##   "unusual creature in 5 min" must be PRESENTATION not generation (determinism law).
##   THE SIX (all app-layer, fp-safe, live-save-safe; sequence 1→3 first):
##   (1) ACTIONABLE DENIALS — every "can't" (breed/feed/duel/craft/land/skim/mine) names what's
##       missing + where + the best available action now. [their #1; copy + availability checks]
##   (2) BROADEN CREATURE XP — small awards at existing events (first tame, correct feed, breed,
##       first-hybrid, conquest-loss survival, scans); target L3 in a first real session; the
##       486-xp/L9 ceiling already bounds it.
##   (3) CONQUEST MATCHUP METER — surface the EXISTING winEstimate pre-fight (Favored/Even/
##       Dangerous/Overwhelming + one factor line); losses pay: partial XP, weakness intel,
##       suggested preparation.
##   (4) BREEDING ANTICIPATION — pre-breed hint panel (trait RANGES + rarity odds, NEVER the exact
##       roll — breeding is deterministic; exact preview kills the reveal) + reveal beat + "new
##       lineage" presentation.
##   (5) CREATURE PERSONALITY (display layer) — surface the temperament/behavior/habitat genes the
##       genomes already carry as card personality lines + earned MILESTONE TITLES ("won a duel at
##       1 HP") in a new absent-safe save field.
##   (6) SURVEY SPOTLIGHT — a living world's card highlights its most notable resident (first
##       "unusual creature" by emphasis, zero generation change).
##   MEASURE: re-run the 1,000-tester battery after the pass and compare vs the v1.7.0 baseline
##   (in flight now): no-op rate (→<10%), Rancher fun (5.18→8+), overall fun (5.60→8+), L3
##   attainment, conquest clarity. ROADMAP-ONLY (not quick pass): family tree/ancestry UI, museum/
##   housing, faction threats, seasonal regions, audio motifs (→ procedural-audio arc; agree sound
##   now outranks another art pass), persona routes, midgame/endgame structures.
##   ▶ HOLDING for Nick's word + more feedback (tester report lands when the run finishes).
## ▶▶▶ 2026-07-26 HOTFIX — ★ v1.7.1 "THE POCKET PATCH" LIVE (build c51c8c6). Nick's real-iPhone
##   pass found ONE root cause wearing four masks: the CF-CR-011 viewport zoom unlock let iOS
##   AUTO-ZOOM on input focus (namein 14px / searchin 12px < the 16px threshold) and never release
##   → visual/layout viewport split → nameplate+HP+search cut off top, tray/sheets overflowing the
##   window, Shipyard ✕ unreachable, AND canvas taps OFFSET from picks = the training-two "can't
##   tap Earth" stuck. FIX: viewport lock restored (iOS ignores user-scalable=no for USER pinch —
##   a11y zoom intact; the a11y reviewer's ask cost nothing to revert) + 16px phone input floor.
##   ⚠ LESSON: on iOS, `user-scalable=no` isn't (just) about zoom — it PINS the layout viewport;
##   removing it re-enables input-focus auto-zoom which BREAKS fixed-position app UIs and canvas
##   hit-testing. Never remove it from a canvas-app page; a11y reviewers' zoom asks are satisfied
##   by iOS's forced pinch-zoom anyway. Smoke/uilayout/uishot CANNOT see this class (no real iOS
##   viewport dynamics) — REAL-DEVICE PASS REMAINS MANDATORY before any mobile-facing release.
##   ▶ Nick to re-verify on iPhone (fresh load / hard refresh): intro typing must not zoom;
##   training two taps Earth; tray/Shipyard fit + close. 1000-tester baseline still in flight.
## ▶▶▶ 2026-07-26 FLEET REPORT TRIAGE (FLEET_REPORT_v1.7.0_2026-07-26.html — 1,000 bot sessions ·
##   21 devices · 12 personas · 49 issues vs LIVE v1.7.0; fun 4.9/12-persona mean, 9/12 would
##   replay; ZERO js errors / soft-locks fleet-wide; viewport bug already fixed in 1.7.1).
##   TRIAGE (batches, AWAITING NICK's pick):
##   ★ BATCH A "FIELD PATCH" (v1.7.2, ~25 quick fixes, days): toast lane (cap 1 <420px, dock above
##     chrome, suppress over open panels) · #toast pointer-events:auto on .tst + MODAL_SEL '#toasts'
##     →'#toast' TYPO (deep-links dead — 2-line real bugs) · Prime Codex psub2 WRAP + render the
##     UNUSED SIGS.lore per titan (huge lore win, ~2 lines) · #records .srow selector (run-on
##     'Mercurycarbon') + journal biome DISPLAY name · ?-button opens Guide directly · release
##     bulletin GATED to returning saves (design change; retune smoke intent) · craft button always
##     visible w/ shortfall label + group '0 craftable' · landing-verb copy unification · safe-area-
##     inset-top on topbar/panel heads · skip-confirm emphasis inversion + Settings 'Restart
##     Training' · atlas ×/clear-all confirms+undo · name-gate: enable from cleanName + inline
##     reason · Escape = ordered overlay stack (all 9 panels; keep training guard) · mouse PICK_F
##     1.2 + hover halo + double-tap hint/ping · tooltip collision flip + suppress-when-open ·
##     bell mark-read on open + 44px tacts · scroll fades/scrollbars (primebox/records/shipyard
##     hero collapse) · vista/card taxonomy wording ('carbon flats of Mercury') · Sol special-case
##     caption · progress-format helper · notification casing/icons · comet tail lineWidth /z
##     (1-line) · 'top left' layout-aware copy · save-reassurance line + one-time saved chip ·
##     ⚠ Air/Wind rename ('star' label → Stellar) NEEDS fp check (SIGS is probed).
##   ★ BATCH B "THE TABLET TIER" (layout arc): 701–900px breakpoint · ONE panel model (sheets w/
##     scrim) · survey-card/panel collision rules · ultrawide space use · 44px touch-target sweep ·
##     dock chip captions · panel heights vs dock · vista default size on tablets.
##   ★ BATCH C "THE BOARD SPEAKS" (a11y, RE-RANKED CRITICAL by the report — persona fun 1.5, total
##     block): canvas roving keyboard focus over picks[] (arrows/Enter/Escape, +/- zoomAt) · Leave-
##     world button · aria-live mirror for toasts/picks · dialog focus traps/inert + aria names ·
##     search results keyboard-reachable · contrast floors (tier '66' alpha, psig.locked) + Text
##     tone reaching inline hexes · fs-lg/xl root-var refactor. (Was 'deferred Navigator batch' —
##     the report measured it as a hard block; recommend folding INTO or ahead of v1.8.)
##   ★ INTO v1.8 (Connection arc, already specced): recipe OUTPUT lines + common-material source
##     map (their min-maxer asks = our actionable-denials/matchup items) · already-satisfied
##     charters auto-honour (banked-state law care) · onboarding pacing beyond bulletin gating.
##   CONFIRMED CLEAN by fleet: 0 js errors, 0 soft-locks, save/paste hardening 'armoured', 45+ fps
##   worst case (their earlier 11fps was THEIR harness artifact, retracted), 791ms load.
## ▶▶▶ 2026-07-26 ★ v1.7.2 "THE FIELD PATCH" — FLEET BATCH A BUILT (26 of 49 issues; gates all
##   green: fp MATCH 50/50 · smoke 429/0 · layout 546/9 · version 1.7.2 consistent).
##   SHIPPED: toast system (phone top-dock, cap 1, yields to open boards, CLICKABLE cards + the
##   '#toasts' MODAL_SEL typo — deep links were dead since v1.5.2) · Prime Codex (wrap + per-titan
##   LORE render + readable locked rows + scrollbars) · Records (srow selector, journal display
##   names, full-ink tiles) · onboarding (fresh saves skip the changelog; ? → Guide direct post-
##   training; skip-confirm inverted + Settings Restart Training; name gate cleanName-enable +
##   inline reason; save reassurance + one-time saved chip) · input (Escape closes ALL boards via
##   stack+PANELS — safe subset in training; tooltip own-panel suppress + collision flip; mouse
##   PICK_F 1.2; assist-landing announce; tray read-on-open + 44px + armed clear-all; Atlas ×
##   tip/legend/undo) · survey (LAND gold primary; ONE landing verb; Sol named; vista header =
##   world · region; comet tail /z; goals show n / m; safe-area topbar) · Fabricator (Craft always
##   visible w/ shortfall name; '0 craftable' counts) · shipyard hero collapse <780px.
##   ⚠ LESSON: my first toast fix (top-dock) recreated the covered-panel bug UP TOP — the layout
##   gate caught it (24 FAILs) → boards now CLAIM the screen (closePanels clears standing cards on
##   phones; every toast tray-logs so nothing is lost). The gate paying for itself.
##   ⚖ DEFERRED TO NICK: Wind→Stellar signature rename — the `sigs` PROBE pins signature names
##   (fp MISMATCH on rename, reverted). Needs an authorized ONE-PROBE re-pin; the new lore line
##   already tells the stellar story meanwhile. NOT IN A: notification casing audit (polish list),
##   Batch B tablet tier, Batch C a11y (canvas keyboard/AT), v1.8 folds.
## ▶▶▶ 2026-07-26 ★ v1.7.3 "THE TABLET TIER" — BATCH B + THE STELLAR RENAME (deploying).
##   ⚖ FIRST RE-PIN OF THE ARC (Nick-authorized): Wind→Stellar Signature. Field-diff proof: ONE
##   probe (sigs) / ONE entry (index 3, id 'star') / ONE field differed across all 50 probes.
##   Surgical re-pin recorded in baseline.json `repins[]` (probe, date, authorizedBy, reason).
##   PROCESS PIN: this is how ALL future intended fingerprint changes go — field-diff first,
##   re-pin ONLY the proven probe, record authorization in the baseline itself.
##   BATCH B SHIPPED: 701–900px joins the DOCK+SHEET model (breakpoints flipped html+JS; the
##   96-portrait art-cache stays at 700 — memory budget ≠ layout) · ONE panel model ≤900: titled
##   sheets (::before headers), scrim (100vmax shadow), min-height 42dvh · tablet sheets center at
##   600px · ultrawide ≥1600 panels widen · vista 72vh on tablets · dock chips CAPTIONED + 44px
##   floor · 44px touch sweep (Accept/☆/⌂/×/fsopt/closers) · corner circles 44 · uishot seeds read
##   GAME_VERSION from the build. Gates: fp MATCH 50/50, smoke 429/0, layout 546/9 (ipad-port now
##   judged under the dock model — the gate's laws are layout-agnostic and it passed unchanged).
##   REMAINING from fleet: Batch C a11y (canvas keyboard/AT — the big one) · notification-casing
##   audit · Atlas chart pane (feature) · v1.8 folds. Nick's iPhone re-verify now covers 1.7.1-3.
## ▶▶▶ 2026-07-26 ★ v1.7.4 "THE QUIET DOCK" LIVE (build 0bfc49e) — Nick's option 3: dock captions
##   are a TEACHING layer. body.recruit mirrors !tutDone (_syncRecruit @ boot/_tutFinish/retrain):
##   recruits see named chips; graduation restores the clean v11 icon dock (Prime keeps 0 / 9);
##   Settings›Restart Training brings labels back. Proofed both states. DESIGN PRINCIPLE PINNED:
##   onboarding affordances may be LOUD for recruits and silent for veterans — gate on tutDone,
##   don't compromise the veteran aesthetic for the newcomer or vice versa.
##   LIVE LADDER TODAY: 1.7.1 viewport → 1.7.2 Field Patch → 1.7.3 Tablet Tier + Stellar → 1.7.4.
##   ▶ NEXT: Nick iPhone re-verify (all four patches, one pass) · fleet Batch C a11y · v1.8 holding.
## ▶▶▶ 2026-07-26 ROUND-2 FEEDBACK TRIAGE (two independent groups re-tested v1.7.3 b4a02df; docs
##   saved: SYNTH_REPORT / FLEET_FIXLIST / FLEET_REPORT _v1.7.3_2026-07-26).
##   SCOREBOARD: fun 4.92→5.71, ALL 12 personas up, 11/12 would keep playing (was 9), completionist
##   dead-clicks 34→14.3%, 9-12/14 round-1 fixes verified IN BEHAVIOR, fps concern RETRACTED (60fps
##   both builds, measured properly), other group: "no new technical blocker… better release
##   candidate". COST: 7 regressions from our own fixes, JS errors 0→1, overlap defects 85→243.
##   ★ REGRESSION HOTFIX QUEUE (v1.7.6 candidate, AWAITING NICK):
##   (1) CRITICAL CF173-01 null-deref: describePick reads st.star.x unguarded in 4 branches
##       (main.js ~2912-2918) — zoom-out with a card open crashes every frame. VERIFIED.
##   (2) CF173-04 my vista-taxonomy fix NEVER RENDERED — #vistabox .vh text-transform:uppercase
##       cancels the .toLowerCase() ⚠ LESSON: check the CSS at the sink before shipping a casing fix.
##   (3) CF173-05 _craftNeed quotes only the FIRST shortfall → accumulate ('Need 3× Iron + 1× Cr').
##   (4) CF173-06 toasts (z40) behind tutbox (z50) in the SAME top lane — the saved-chip written FOR
##       the cautious newbie died unread behind the training card. (5) CF173-07 toasts collide with
##       panels on SHORT viewports (720p) — yield-to-open-boards at ALL sizes + cap-1 to ≤900.
##   (6) CF173-08 Records/Tray double titles (::before + inner heading). (7) CF173-03 #panel absent
##       from PANELS/MODAL_SEL → boards bury/leak the survey card (85→243 overlaps) + dock overprints
##       card (z14>z9) + Escape skips card → REGISTER the card, dock-aware bottom, z fix.
##   (8) CF173-09 disabled craft buttons untabbable → aria-disabled pattern. (9) CF173-10 hint pill
##       truncates (double-tap clause) → wrap ≤420 + shorten. (10) contrast: psub2 --faint→--dim,
##       records .tier 8.5→11px (their measure: my 0.85 'stopped one step early'). (11) atlas-undo
##       far from finger → inline undo/distinct 🗑. (12) dock labels 7.5→8.5px. (13) 'First
##       footfall' already-satisfied → 'Ready to claim' state (pulled forward from v1.8).
##   ★ HARNESS SYNC (no deploy): CF-SIM-001 simrun STILL waits for the fresh bulletin (my flow
##   change retuned smoke but NOT simrun — the tutAt lesson repeated on a different axis: when the
##   FLOW changes, grep BOTH harnesses) · CF-SIM-002 medium runs labeled 'deep' · CF-SIM-003 20-step
##   comments · CF-SIM-004 page recycling.
##   ⚖ NICK DECISIONS: (a) desktop rail panels (901+) get TITLES + role/aria-label (recommend YES —
##   cheap, keeps the v11 rail look; scrim stays touch-only) · (b) Star Atlas AUTO-ADDS landed
##   worlds w/ Visited filter (both rounds' explorer #1 ask — recommend YES) · (c) Shipyard starter
##   affordability (recommend the nearest-affordable CTA over free iron) · NESTING CLAIM REFUTED:
##   the tablet/1600 blocks ARE top-level (verified brace-walk) — but the model-stops-at-900 point
##   stands as the design divergence in (a).
##   ▶ THEN: Batch C a11y — BOTH rounds now rank it top (focus management named critical, zero
##   aria-live, search keyboard-dead); v1.8 spec absorbs their XP table + next-battery success
##   criteria (Rancher 7.5+, no-op <15%, L3 60% of medium creature players, L6 20% of deep).
## ▶▶▶ 2026-07-26 ★ v1.7.6 "THE REGRESSION ROUND" + v1.7.7 "THE OPEN DOOR" (Nick: proceed 1-4;
##   decision (c) per recommendation). 1.7.6: all 7 round-2 regressions — describePick null guard
##   (the per-frame crash), #panel REGISTERED in PANELS/MODAL_SEL w/ training exception + dock-aware
##   clamp, vista casing rendered at last (.vhn/.vhr spans; ⚠ LESSON: check the CSS at the sink),
##   _craftNeed full shortfall list, training claims the screen (saved-chip at graduation), toast
##   yield scoped (≤900 suppress minus the survey card; short desktops get a bottom-LEFT lane —
##   smoke PROVED suppression eats board-produced feedback), single titles + titles at ALL widths
##   w/ role=dialog (decision a), aria-disabled need-buttons, hint wraps, contrast to AA, closest-
##   build CTA (decision c), banked LANDFALL credit + Claim ✓ rows, inline Atlas undo.
##   1.7.7: BATCH C — canvas keyboard cursor (arrows/Enter-with-credit/±zoom/Escape + per-frame
##   gold ring), aria-live announcer (toasts/targets/surveys), central focus management (focus-in
##   on open, restore on close, Tab contained in the 5 modals), keyboard search (listbox + ↑↓ +
##   Enter), 2px rings everywhere · decision (b) planetfall AUTO-CHARTS + ⛳ Visited filter ·
##   harness sync CF-SIM-001/002/003 (004 N/A — our rig boots fresh JSDOM per session).
##   REMAINING Batch-C tail (roadmap): full inert on modal backgrounds · 'Leave this world' button ·
##   Records journal aria · vista tap-dead-420ms · Reset button placement · notification casing.
##   ▶ Next fleet re-run will score the a11y persona against 2.5; targets: overlaps ≤85, JS errors 0.
## ▶▶▶ 2026-07-26 ★ STEP-6 LANDING LOCK fixed in SOURCE (bb56edc) — Nick hit it LIVE on v1.7.7:
##   the survey card closed between atlas-add and land with no allowed reopen. THREE closers, one
##   trap: (1) the 1.7.6 PANELS registration's grace-dismiss killed the card on the REAL pointerdown
##   of the Atlas tap → training sweep now SKIPS the panel entry (the canvas needsCard sweep owns the
##   card during training); (2) land step now carries pick(Earth-133) like find-earth so tap-Earth-to-
##   reopen is REAL (also covers goTo: the atlas-open lesson invites tapping the Earth row, which
##   travels + clears the lock); (3) FOCUS LOCKDOWN, KEYBOARD EDITION — Batch C's cv keydown was never
##   lesson-gated (Escape released the card; ± zoomed the mode over): canvas keys now act only when
##   the lesson opens #cosmos, like taps/wheel. FULL-FLOW AUDIT ran: every other step's completion
##   surface is dock/HUD/tutbox or has an allowed reopen (#codexbtn / _tutSpot auto-reopen) — this
##   was the only lock class left. Smoke +7 (439/0) incl. the real-pointerdown repro click() never
##   fired (⚠ LESSON: jsdom click() ≠ pointerdown — dismiss-on-pointerdown paths need the real event).
##   ⚠ NOT DEPLOYED — awaiting Nick's word for the v1.7.8 hotfix (bump + RELEASES entry at deploy).
## ▶▶▶ 2026-07-26 ★ UPDATE WATCH fixed in SOURCE (6b99db6) — Nick live: "the build is not refreshing
##   even after resetting". The pill's location.reload() RE-SERVED the cached document (iOS Safari +
##   Pages max-age=600) so refresh landed back on the stale build; first check was at 45s, so a stale
##   cached boot (incl. in-game reset — same cached file) played old code all session. FIX: _updGo
##   navigates to ?v=<build> (new URL = guaranteed cache miss; saves safe — localStorage + beforeunload),
##   _updCheck(true) runs at BOOT so a stale boot silently self-heals before play (one try per build via
##   sessionStorage guard — CDN lag falls to the pill, never a loop), spent buster stripped from the bar,
##   _updSeen per-build so a second deploy re-offers. Probe hook +2, smoke +3 (442/0). ⚠ NOTE: users on
##   the CURRENT stale build only gain this once they receive it — their copies heal via Pages cache
##   expiry (~10 min revalidation) or their old 45s pill; all future updates then propagate instantly.
##   ⚠ NOT DEPLOYED — rides the same v1.7.8 hotfix, awaiting Nick's word.
## ▶▶▶ 2026-07-26 ★ v1.7.8 "THE COURIER" LIVE (build 2ba78d7) + ★ v1.7.9 "THE COURTESY PASS" LIVE
##   (build 31186a4) — Nick: "continue on with the rest of 1.7 in the queue". 1.7.8 = the two live
##   fixes (step-6 landing lock + cache-busted update watch). 1.7.9 = BATCH-C TAIL COMPLETE except
##   the Atlas chart pane (a feature build, still queued): FULL INERTNESS (bg inert+aria-hidden
##   under Guide/Prime/duel, rides syncSelState pulse; sheet+Settings deliberately excluded — dock
##   board-swapping and outside-tap-close need live backgrounds) · LEAVE THIS WORLD (grounded card
##   data-act=depart → overview camera reset + announce) · VISTA GHOST GUARD REBUILT (pointerdown-
##   on-overlay tells ghost from genuine; the 420ms blanket was a fleet-flagged dead window; Escape
##   bypasses via _vistaDismiss — a key is never a ghost; zoom steps out first) · JOURNAL role=list/
##   listitem sentence labels · RESET separation (14px + muted-until-intent) · CASING AUDIT (10
##   toast titles → Title Case). ⚠ LESSON: any dismiss-on-pointerdown path breaks el.click()
##   callers — grep for programmatic .click() when adding pointer-based guards (the Escape stack
##   was silently stranded). Harness: smoke tap() helper (pointerdown+click) for vista sites (both
##   harnesses synced same-batch). Gates: fp MATCH 50/50, smoke 450/0, layout 546/9, sim ui 100/100.
##   ▶ REMAINING 1.7 QUEUE (in order): Atlas chart pane (feature) · save-health pass (Atlas thumb
##   strip + rebuild-from-seed + LRU art caches — rule-5 care) · §24 power-curve retune (tester
##   data in hand) · name-variety epithets + text-polish (re-pin candidates) · rare-vein dedup +
##   §5 instance-rarity (generation-touching, careful) · §22 gear×tier + ship-hull masters (art
##   sessions). Then v1.8 Connection (holding) → 1.9 consolidation → 2.0 engine arc (Nick: PixiJS
##   port SAVED FOR 2.0; art ports as canvas→texture masters, logic split is the prep).
## ▶▶▶ 2026-07-26 ★ v1.7.10 "THE LISTENING POST" LIVE (build 338b000) — Nick's live-play findings
##   + the SAVE-HEALTH CORE, same-day loop (Nick playing live, feeding screenshots). LIVE FIXES:
##   search results under the box + 100vmax scrim (supersedes 1.7.2's fixed lane; box lit via
##   focus-within z-bump) · Compendium/Fabricator shelves ship CLOSED, session-remembered
##   (training seeds the lesson's shelf: codex auto-open !tutDone-only; forge.enter adds 'part') ·
##   #codex desktop top +98 (glow ring sat on its own chip) · vista ⛶ hidden during training
##   (zoom deliberately inert there; visible dead button reads broken) · training feed/breed/heal
##   DISMISS the standing card (_tutDropReveal — Nick's step-10/14 screenshots). SAVE-HEALTH
##   (CF16-005 done): speciesThumb 132px list-thumb split w/ own 600-LRU; artOf NEVER pins full
##   portraits on entries (500 species retained ~150MB before); reveal/duel flip to genome-fresh
##   speciesPortrait; discoverSpecies art:null; ThumbArt FIFO→LRU. CF16-004 (thumb strip) + CF16-013
##   (Atlas whitelist) verified ALREADY DONE by earlier security batches — 4 smoke sentinels added
##   so bloat can't return. Gates: fp MATCH 50/50, smoke 454/0, layout 546/9, sim ui 100/100.
##   ⚖ AWAITING NICK (design, not built): (1) QUEST-LOG RETHINK — Nick: the post-accept "Make
##   planetfall" dock pill just opens the board ("pointless"), and the pinned Chapter-1 goal list
##   reads as pre-accepted quests; BRAINSTORM FIRST, options proposed in chat (next-goal TEXT chip
##   vs objective tracker vs chapter restyle). (2) Binder → Records move (recommended: yes, it's a
##   collection view — but it's a restructure, Nick to confirm). (3) Land button GOLD is the 1.7.2
##   one-primary decision — explained to Nick, revert on their word.
## ▶▶▶ 2026-07-26 ★ v1.7.11 "THE WAYPOINT" LIVE (build 283f0ca) — Nick approved: Binder move +
##   quest-log OPTIONS 1+3 (option 2 tracker-stack rejected). OBJECTIVE CHIP: #chchip = live
##   tracker (accepted charter outranks chapter; else Ascent next-goal; p/n + chipbump pulse on
##   progress, rmotion-safe; tap→board) — the game always answers "what's next". MAINLINE
##   RESTYLE: .asckick kicker ("The Ascent — your mainline · no accepting needed") + .ascgoal slim
##   progress LINES w/ 3px bars — visually distinct from Accept-bearing charter pills. BINDER →
##   RECORDS: renderBinder(target) into #records behind Trophies|Binder tabs (_recTabs/recView);
##   _binderClicks delegation moved to the records listener (paragon travel closes Records);
##   Compendium is SPECIES-ONLY (codexView kept for compat); Guide topic updated. Smoke +5 net
##   (459/0) incl. binder-on-records block, chapter-restyle assert (no .ch inside .ascbox), chip-
##   tracks-chapter. Gold Land: Nick informed it's the 1.7.2 one-primary decision — STANDS unless
##   they say revert. Gates: fp MATCH 50/50, smoke 459/0, layout 546/9, sim ui 100/100.
## ▶▶▶ 2026-07-26 ★ THE FULL QUEUE RUN (Nick: "proceed with all of this" + audio→v1.8) — v1.7.13
##   "THE CARTOGRAPHER" LIVE (build 9d07a74): (1) ATLAS CHART PANE ✔ (List|Chart tabs, painterly
##   universe chart, cluster halos, tap-to-travel, filters apply — Batch-C tail COMPLETE).
##   (2) §24 POWER-CURVE ✔ (smite 58.7%→53.5% + roulette re-banded, ALL 17 archetypes in 42-58;
##   dead relics Graven Aegis/Prismatic Lathe → true sidegrades; balance-sim JOINED THE DEPLOY
##   GATE — deterministic, first live gate run PASSED). (3) CF-008 EPITHETS ✔ (notable worlds,
##   deterministic, ~1.1% near home scaling with region; Earth exempt; fp MATCH — no re-pin
##   needed) + Favours→Favors/flavors text pass (historical RELEASES untouched). (4) P2-005
##   RARE-VEIN DEDUP ✔ (0 dups/7,048 rolls, rng stream identical) + §5 PER-DEPOSIT RESOLVER ✔
##   (resolvedDepositTier, grounded cards grade each vein). (5) §22 GEAR WAVE 1 in SOURCE
##   (e5023d6, NOT deployed — ⚖ AWAITING NICK's proof-sheet sign-off): _GEAR_ART registry, 11
##   masters (rigs/suits/helms), proof sheet tools/sheets/gear-wave1.js; self-review flags: suit
##   shoulder taper · hazmat hood seating · voidglass starfield brightness. WAVE 2: struts/anchor/
##   ears/necklace/gloves/legs/boots (14) + relics (9) + cosmic gear (7) + SHIP HULL tiers.
##   ★ NAMEPLATE-ESCAPE FLAKE SOLVED (instrumented bubbleReached + 2nd-press probes): a late
##   queued specimen reveal popped over the open menu and correctly ATE the first Escape —
##   harness drains stack-ahead overlays; GAME FOLLOW-UP QUEUED: reveals must not pop over open
##   modals (v1.7.14 candidate). ⚠ LESSONS: proofsheet runner injects TAU (never lift it);
##   sheet helpers ride liftBetween verbatim (const-lift truncates at inner semicolons).
##   ★ AUDIO PASS → v1.8 "The Connection" (Nick's call, this session).
## ▶▶▶ 2026-07-26 ★ v1.7 ARC COMPLETE — v1.7.14 "THE OUTFITTER" (1fd90df) + v1.7.15 "THE FIELD
##   MANUAL" (bec2f8c) LIVE. 1.7.14 = §22 DONE (hull ladder gap: Array-era gold registry band +
##   strobes; all 41 gear masters ride — Nick's deploy order = sheet sign-off) + REVEALS DEFER
##   OVER MODALS (_revealBlocked/_revealFlush on the input pulse — the proven Escape-eater fixed
##   at the game layer). Review battery at ship: smoke 471/0 · fp MATCH 50/50 · layout 546/9 ·
##   deadcode clean · sim ui 100/100 · chaos 95/100 zero errors. 1.7.15 = Guide caught up
##   (Atlas/survey/charters topics + keywords). ★ STANDING RULE (Nick): the GUIDE updates in the
##   SAME BATCH as every feature — check it at every release.
## ★★★ v1.6.4 "THE LANDING FIX" DEPLOYED LIVE (2026-07-22, build 3a4b839; site + source pushed). CRITICAL hotfix
##   for Nick's "landing highlights but never triggers land" (stuck at step 6/20, Planetside open, empty ring).
##   ROOT CAUSE: the land step advances on the `landfall` event, but noteLanding(seed) (main.js ~8914) early-returns
##   `if(landed.has(seed))` BEFORE emitting landfall. Any VETERAN save already has Earth (133) in `landed` (samples
##   long since read) → no landfall → step never advances. FRESH boots never have 133 landed, so smoke/layout/all
##   gates passed clean and could NOT see it — device-with-history only. FIX (tutorial-only, NOT fingerprinted): the
##   land step (main.js ~16947) got `enter:()=>{ landed.delete(133); }` — un-lands home for the drill so the press
##   freshly fires landfall (noteLanding re-adds 133 instantly). REGRESSION GUARD added to smoke.js (~186): seeds
##   `landed.add(133)` BEFORE entering the land step (old code fails, fix passes). fp 50/50, smoke 0-fail/322-pass,
##   layout 546/9 all green. LESSON: fresh-boot gates are blind to veteran-save state — when a bug is "works for me
##   but not on device", suspect saved state (landed/conquered/codex) that the harness starts empty.
## ★★★ v1.6.3 "CARD & TRAINING POLISH" DEPLOYED LIVE (2026-07-22, build 3a4f5f6; site + source pushed). More of
##   Nick's real-iPhone review. SHIPPED (fp 50/50, smoke+layout green): SPECIMEN CARD verbs reordered per Nick →
##   Breed·Feed·Duel·Scout·Code (rev-* ids unchanged so smoke/gate still work); RENAME moved to a ✎ icon beside the
##   name (.rn-edit, id rev-rename, calls askRenameSpecies — matches the player "✎ Change name" convention) ·
##   COMPENDIUM training step pinned to TOP (new step flag top:true honored in _tutSpot dodge logic) so the fauna
##   list stays scrollable. Earlier this session: v1.6.2 intro Begin-button — first tried a STICKY footer (caused
##   text bleed-through), then FIXED with a flex-COLUMN card (lore scrolls in its own region, actions a real footer;
##   #namebox .card display:flex, .lore flex:1 overflow-y:auto, .nm-actions flex:none). ⚠ ALL need real-iPhone verify.
## ▶ NEXT MOBILE PASS — Nick's REMAINING trio (the hard tutorial timing / z-order / lifecycle bugs; do ONE AT A TIME
##   with device verify): (#1) EARTH/ATLAS menu bleeds UNDER the training+world card (step 6) — panel z-order/cleanup,
##   a residual atlas panel not swept. (#5) BREED → DUEL OVERLAP (step 12) — the "A New Bloodline" reveal and the duel
##   screen are both live at once → GATE the duel step on the breed reveal being dismissed (one thing on screen).
##   (#6) EMPTY blue SPOTLIGHT RING on the nameplate/HP steps (steps 8/13) — CF16-002/010: highlight draws on a
##   target that's covered or not-yet-rendered → wait-for-render + elementFromPoint hit-test before showing the ring.
##   Plus the earlier-review CF16-007 (specimen frame crosses "Critical"), CF16-008 (cyan rim), CF16-004/005 (save/
##   memory). See the v1.7 DEFERRED FIXES block. Glass/tint SLIDER + accessibility-DEFER already recorded (v1.7).
## ★★★ v1.6.2 "MOBILE POLISH" DEPLOYED LIVE (2026-07-22, build 5c85d8b; site + source pushed) — the FIRST mobile-
##   onboarding pass from the v1.6 mobile review (Nick's real-iPhone findings). SHIPPED (fp 50/50, smoke+layout
##   green, both fp-safe CSS/markup): CF16-003 intro Begin-button STICKY FOOTER (was below the fold on short
##   iPhones — .nm-actions position:sticky) · CF16-006 charter counter no-wrap (.cp white-space:nowrap;flex:none).
##   ⚠ NEEDS REAL-IPHONE VERIFICATION — the layout gate doesn't cover small-iPhone viewports (CF16-014). STILL OPEN
##   (structural, do next ONE AT A TIME with Nick verifying on device): CF16-007 specimen frame crosses "Critical"
##   text (needs inner-scroller markup) · CF16-001 tutorial card BLOCKS the panel it teaches (collision-aware
##   layout coordinator — the big one) · CF16-010 highlight/items don't load until clicked (readiness-based target
##   mounting, not a 480ms timer) · CF16-008 cyan rim shards (fp-safe render — verify via proof sheet) · CF16-004/
##   005 Atlas save-bloat + portrait-cache memory · CF16-012 zoom/touch-action (behavioral). See the v1.7 DEFERRED
##   FIXES block below for the full mapped list.
## ★★★ v1.6.1 "THE BINDER PATCH" DEPLOYED LIVE (2026-07-22, build 973bbaa; site + source both pushed). The
##   v1.6 CODE REVIEW (Nick's synthetic gameplay/code-review report) ran and found real bugs our panel/smoke
##   missed. HOTFIXED (all fp-safe, fp 50/50, smoke+layout green, +Binder smoke check): P2-001 Binder crash
##   (renderBinder read ABILITY_THEMES from outer scope → ReferenceError; exported it from CombatCore — was a
##   LIVE crash) · P2-002 malformed-save (_sanitizeSavedGenome clamps brood/fed/xp/hurt + seed/kingdom; a crafted
##   save forged an 11.7M-power creature exportable as a share code) · P2-003 duplicate conquest reward (idempotent
##   conquered.has guard at onResolve) · P2-004 stale breeding parents (breedPair rejects consumed/invalid).
##   DEFERRED to v1.7 (fingerprint/re-pin or bigger): P2-005 rare-vein dedup (depositsFor = generation → materials
##   re-pin) · CF16-011 mirror-duel tiebreak (=CF-004) · CF16-004 Atlas thumbnails (=CF-002) · CF16-012 zoom/
##   keyboard-nav (=CF-006) · CF16-001/002/003 mobile-onboarding LAYOUT blockers (need real-iPhone pass). NOTE the
##   review tested an OLD 'dev' snapshot, so several carried-forward UI findings were ALREADY fixed in v1.6/v1.6.1
##   (verb grid, Records short-phone, training soft-lock). NEXT: dive into v1.7 (rarity Phase A → Forge/materials
##   Phase B → text polish → charter-training module + the deferred review items).
## ★★★ v1.6 "THE LIVING FRONTIER" IS DEPLOYED LIVE (2026-07-22, build 8351d67 → https://celestialfrontier.github.io/;
##   version.json v1.6). Committed to source main @8351d67 (release commit). Battery green at ship: validate 8
##   gates + fp 50/50, smoke 0 fails, layout PASS(546). v1.6 = the painterly art overhaul + lineage cards +
##   champion codes + loot affixes + biosphere yield + item cards, PLUS the fix batch (footer version binding,
##   CF-001 tutorial stat-leak, CF-003 hazard timeout, CF-005 Records short-phone fit, CF-007 aria-label, CF-009
##   button types, CF-010 name-length, charter drills→Mine wording, specimen VERB-ROW GRID (fixed the button
##   crush at all resolutions), TRAINING soft-lock re-assert (Settings-cancel now reopens the Compendium — does
##   NOT lock Settings), and the fp-safe UI TEXT POLISH). DEFERRED (safety) → caught by the v1.6 CODE REVIEW +
##   v1.7: CF-002 (Atlas save bloat — needs thumb-rebuild plumbing, rule-5), CF-004 (duel tiebreak — fp/re-pin +
##   champion-code interaction), CF-006 (keyboard Navigator — its own focused pass), CF-008 (name variety — v1.7
##   naming pass). ▶ NEXT (Nick's plan): the v1.6 CODE REVIEW is the FIRST v1.7 item — do it FIRST (catches the
##   deferred fixes + anything else), THEN the rest of v1.7 (rarity Phase A → Forge/materials Phase B → text
##   polish → charter-training module). See the v1.7 lines below.
##
## [HISTORICAL — pre-deploy handoff, kept for context] STATE: v1.5.2 is LIVE. v1.6 is BUILT but NOT deployed. The RC3 Gold review declared everything
##   Gold-ready EXCEPT the biome-coverage LAYERS (4 narrow blockers); BATCH 15.5 closed all 4 — all
##   render-only, fp 50/50, NO re-pin. validate = 8 gates green (193 sentinels), smoke green, layout
##   PASS (546), NEW biome-layer audit green. Latest package: scratchpad/CF-FullArt-Batch15.5-Gold.zip.
## BATCH 15.5 — the 4 RC3 Gold biome-layer blockers (all done): (1) EMPTY PURITY — reef fish-schools +
##   abyssal creatures now gated on genes, so empty biomes carry ZERO fauna (coral=coral+water only,
##   abyssal=dark water+vents only). (2) POPULATION — ice/grey(rocky)/haze(venus) worlds placed NO
##   creatures (the land block at ~L7917 excludes those pals), so cryogeyser/tundra/rocky/venus were
##   blank in all 3 modes; added a dedicated placement block (anchor + secondary). (3) SEPARATION —
##   _hdAbyssScene now draws the ACTUAL genes (Earth anglerfish/squid vs procedural alien); GAS = Option
##   A (Earth life UNSUPPORTED, labeled; native aerial life only in the procedural pass). Earth != proc
##   everywhere now. (4) BIOME AUDIT — new tools/biome-audit.js (empty-purity structural gates + population
##   + Earth!=proc lineage + fauna-free whitelist), wired into the audit report. RC2 Lepidoptera "blocker"
##   was a FALSE ALARM (test-only names, not in catalog); classifier hardened + 23 sentinels anyway (B15.4).
## BATCH 15.2 — the 4 release gates (all done): (Gate 1) FULL CATALOG EXPORT — all 18 fauna + 10 flora
##   pages rendered (scratchpad/catalog/) + automated AUDIT-REPORT (render-audit 1010 clean · rig-audit
##   631 classified/170 sentinels · fp 50/50); catalog is class-clean (Butterflyfish→fish, Butterfly/
##   Moth→insect all certified). (Gate 2) SKIN — furred rebuilt (soft uneven fringe + neck/chest/tail
##   tufts, not spikes), feathered rebuilt (overlapping directional contour feathers + tail plume),
##   translucent now DROPS body opacity (0.66) so spine/ribs/gut/heart read through the membrane. (Gate 3)
##   BUTTERFLY/MOTH — the symmetric-wing rig now returns faceOn→a MATCHED eye PAIR (was one side eye).
##   (Gate 4) VISTA HERO-DEPTH — _hdPlaceBeast draws a denser ground-fringe, every 4th blade taller so it
##   OVERLAPS the feet, scaled with the creature → heroes read as grounded foreground across all vistas.
## WHAT'S DONE (Batch 15, from the Batch-14 review): (Area 3) STRUCTURAL SKIN — all 9 FA_SKIN materials
##   now change the material language (scale rows/fur fringe/chitin bands/wet sheen/armour plates/warts/
##   feathers/translucent channels/crystal facets), masked to the body [§0.6]. (Area 2) HABITAT-PRESERVES-
##   BODY-PLAN — aquatic shelled/crystalline/tusked/horned/squat creatures read as shell-backed / mineral-
##   plated / tusked / horned / benthic SWIMMERS, not a plain fish (_procFamily fpreserve marker + grafts)
##   [§0.5]; GROUPED-LIMB anatomy (fore/mid/rear, tripod, arthropod) [§8.3]; specialized-rig TAILS on
##   fish/crust/ceph [§0.4/8.4]. (Area 4) AQUATIC (6) + AERIAL (3) FLORA SUBFAMILIES in hdPortraitFlora/
##   _hdPlantBare (kelp/seagrass/reef/sargassum/bloom/tube · veil/banner/cloud-garden) [§0.7]; root/tuber
##   noted Earth-harvest-only. FROG pupils/irises drawn on top of the texture [§0.2]. PLAN-0 renamed
##   FA_BODY[0] 'six-limbed'→'sturdy-limbed' (Nick's call — limb gene sets the count; fp-safe, NO re-pin)
##   [§0.3]. (Area 1) VISTAS: global creature SCALE (clamp 1.8→1.4) + stronger GROUND-CONTACT shadow
##   [§0.1]; NEW _hdReefScene — Coral-Shallows now drops to a bright reef (caustics, coral colonies, fish
##   schools, in-column creatures), routed in showVistaBox like abyssal [§5.4]; JUNGLE canopy ceiling +
##   vines + foreground broadleaf [§5.2]. KEY FINDING: the review's ABYSSAL "trees+moon+waterline" was a
##   PROOF-SHEET ARTIFACT (vistas-big rendered abyssal via hdVista; the game uses _hdAbyssScene) — fixed
##   the sheet; the real abyssal was already correct.
## DESIGN DOCS (source of truth): ART_DIRECTION.md · PROCEDURAL_CHARACTERISTICS.md ·
##   LINEAGE_AND_BREEDING.md (+ the per-system docs). New sheets: proc-skins.js, proc-aqua.js, b15-*.js.
## ✅ GOLD SIGN-OFF RECEIVED (2026-07-21): Nick's "Batch 15.5 Gold Candidate Final Review" landed and is
##   GOLD APPROVED across all six areas (art direction · Earth catalog · procedural fauna/phenotype ·
##   procedural flora · biome layers · showcase vistas) — "No additional pre-release visual changes are
##   necessary." Only actionable was its §18 shipping-checklist item 1 ("rerun the suite against the exact
##   build"). DONE THIS SESSION: (a) re-extracted main.js + re-ran the FULL battery against the current
##   build — validate 8 gates + fp 50/50 · biome-audit PASS · render 1010/0 · smoke PASS · layout PASS(546);
##   all green. (b) REGENERATED the full art package fresh from that build → scratchpad/CF-FullArt-Batch15.5-
##   Gold.zip (49 files; prior delivered zip backed up as *.PRIOR.zip). NOTE: tooling drift — flora-all-big.js
##   is now ROWS=5 (30/page) so the Earth-flora catalog is 12 pages (was 10 @ 36); all 334 flora, more legible.
##   (c) reviewed + edited Nick's markdown: added §0 build-verification addendum (battery table + fingerprint),
##   §20 release-handoff, and corrected the flora page count 10→12; delivered the edited copy alongside the zip.
##   Regen driver: scratchpad/build-package.js. All per-system docs already SYNCED to B15.5.
## ▶ PHASE 8 IN PROGRESS (2026-07-21, Nick's word): v1.6 RELEASE-NOTES written + GAME_VERSION BUMPED to '1.6'
##   (title "The Living Frontier"; RELEASES[0] new entry — art overhaul, alien phenotypes, landing vistas,
##   lineage card, champion codes, conquest loot affixes, biosphere yield, item cards, class-routing).
##   validate green (fp 50/50), smoke green (updated the 2 stale version assertions: fresh-bulletin + guide-
##   footer now expect the v1.6 line). Bulletin logic confirmed: openReleaseNotes('latest') shows the current
##   minor line alone (_line=GAME_VERSION[0..1]) → fresh v1.6 shows "The Living Frontier" only, no 1.5.x leak.
##   6k BETA LAUNCHED in background (scratchpad/beta6k.sh → tools/beta-v16-{chaos,ui,fast,deep}.json;
##   chaos1500+ui900+fast3000+deep600=6000). Fail-fast slices (chaos25/ui25/fast50) were CLEAN on v1.6.
## 6k RESULT (CLEAN): 0 errors/breaks/violations/softlocks/deaths across ALL 6000 sessions. funIndex fast 6.87 /
##   deep 5.5; deep maxDrought ~35 (the SAME long-session staleness signal v1.5.2 flagged — economy unchanged, not
##   a v1.6 regression; feeds retention/crafting-depth backlog + the v1.7 materials idea). saveFail was a RED
##   HERRING: pre-existing HARNESS artifact (active runs don't flush a final save in the 1.2s read window), 4%
##   here vs 14% on the live v1.5.2 build — v1.6 is BETTER; codex does NOT persist lineage (L11639), doSave has
##   graceful quota toast (L11641). NOT a blocker. Nick approved 10k (not 20k) crash-weighted confirmation.
## ▶ 10k CONFIRMATION LAUNCHED (scratchpad/beta10k.sh → tools/beta10k-v16-*.json; chaos5000+ui3000+fast1500+
##   deep500=10000). When it lands clean → team panels → deploy via tools/deploy.js on Nick's word.

## ═══ v1.6 BATCH 15.5 (2026-07-21) — the 4 RC3 GOLD biome-layer blockers. Render-only, fp 50/50, no
##   re-pin; NEW biome-layer audit green; smoke + layout green. RC3 declared everything else Gold-ready.
##  ✅ BLOCKER 1 EMPTY PURITY — empty biomes must carry no fauna. _hdReefScene fish-schools now gated on
##     genes.length; _hdAbyssScene rewritten to draw ONLY supplied genes (was always-on generic swimmers).
##     Empty coral = coral+water+caustics only; empty abyssal = dark water+vents+motes only.
##  ✅ BLOCKER 2 POPULATION — root cause: the land placement block (~L7917) is gated `pal!=='ice' &&
##     pal!=='grey' && pal!=='haze'`, so ICE (cryogeyser/tundra), GREY (rocky: cratered/boulder/graben/
##     geode/carbon), HAZE (venus: sulfurdeck) worlds placed NO creatures → identical across empty/earth/
##     proc. Added a dedicated placement block for those pals (anchor 0.44×size + secondary), tuft colour
##     per family. Every life-bearing biome now shows a discoverable anchor.
##  ✅ BLOCKER 3 SEPARATION (Earth != procedural) — _hdAbyssScene now draws the ACTUAL o.genes as pressure-
##     dark silhouettes + local lure glow → Earth abyss (Anglerfish/Giant Squid) reads different from a
##     procedural abyss (was identical generic swimmers). GAS policy = Option A: Earth life UNSUPPORTED
##     (gas EARTH pass renders no floaters + labels "Earth life: unsupported"; native aerial life fires
##     only in the procedural pass). So earth-populated ≠ procedural-populated in every biome now.
##  ✅ BLOCKER 4 BIOME-LAYER AUDIT — new tools/biome-audit.js: empty-purity via STRUCTURAL source gates
##     (fauna draws must be gated on genes), population presence (every life-bearing biome has an Earth +
##     procedural anchor), separation (Earth anchor resolves to a real Earth lineage family via _earthArt;
##     procedural uses alien plans — different by construction), fauna-free whitelist (acidhaze/abyssgreen)
##     + gas Earth-unsupported. Wired into AUDIT-REPORT. 37 life-bearing + 2 fauna-free + 4 gas.
##  ➜ Package: CF-FullArt-Batch15.5-Gold.zip (catalog + procedural + all biomes empty/earth/proc + showcase
##     + verify + audit). Review's verdict path: "one biome-layer integrity patch, then lock" → patch done.

## ═══ v1.6 BATCH 15.4 (2026-07-21) — responses to the RC2 (Earth/procedural) + RC3 (non-Earth biome)
##   reviews. All render-only, fp 50/50, no re-pin, 193 sentinels, smoke + layout green.
##  ✅ RC2 "LEPIDOPTERA BLOCKER" (review 15.2) — FALSE ALARM: the 5 flagged names (Painted Lady/Cabbage
##     White/Hawk Moth/Red Admiral/Peacock Butterfly) are NOT in the 631 catalog — they were test-only
##     names I put in my own verify sheet. No shipping regression. HARDENED the classifier anyway: a
##     Lepidoptera branch resolves AFTER the fish rule (so Butterflyfish stays fish) but BEFORE the raptor/
##     bird/mammal words, catching butterfly/moth + explicit common names → so "Hawk Moth"/"Peacock
##     Butterfly"/"Elephant Hawk Moth"/"Tiger Moth" → insect, while bare Hawk/Peacock → bird, Tiger/Leopard
##     → mammal. Added 23 Lepidoptera+collision SENTINELS to rig-audit (expected class = biological truth,
##     independent of the classifier — the reviewer's audit-integrity ask). Rewrote the verify sheet to
##     honestly test real+collision names (verify-lepidoptera-routing.png).
##  ✅ RC3 GATE 1 (count) — corrected: 43 total = 39 surface + 4 gas (the gas biomes ARE in the 43; the
##     "43+4=47" was a double-count). README fixed.
##  ✅ RC3 GATE 3 (gas life) — _hdDeckScene already supports aerial life (air>0); the identical populated/
##     empty was a SHEET bug (air hardcoded on in both). Strengthened: a gas-bladder ANCHOR floater + an
##     aeroplankton SWARM; sheet now passes air=EMPTY?0:3 so populated ≠ empty.
##  ✅ RC3 GATE 2/5 (population visibility) — anchor creature now size-4 (large) + secondary size-2 across
##     biomes; _hdAbyssScene gained a large giant-squid anchor silhouette (the review's scale event).
##  ✅ RC3 GATE 4 (the "reads-wrong" biomes) — CANYON now has vertical walls + strata (was low hills);
##     GLASS has large translucent shards + refraction (was sand+sparkles); SALTFLAT (polygonal cracks) vs
##     SALTPAN (reflective brine + terraces) split (were one identical case); volcisle dressing strengthened.
##     Remaining ice/ember/venus/rocky look-alike separation = reviewer's explicit NON-BLOCKING post-lock.
##  ✅ COMPREHENSIVE PACKAGE: biome-coverage.js now renders MODE=earth (Earth species per biome) | proc
##     (procedural) | EMPTY. CF-FullArt-Batch15.4.zip = catalog + procedural + all biomes (earth + proc +
##     empty) + showcase vistas + verify + audit.

## ═══ v1.6 BATCH 15.3 (2026-07-21) — NON-EARTH BIOME COVERAGE audit (Nick's Q: are the exotic biomes +
##   their PROCEDURAL life clean too, not just the 8 Earth-analog showcase vistas?). Render-only, fp 50/50.
##  ✅ NEW sheet tools/sheets/biome-coverage.js — renders ALL 43 BIOME_PROFILES biomes + 4 gas giants as
##     landing vistas, POPULATED with procedural genomes biased to each biome's environment (aquatic →
##     swimmers/jelly/ceph, land → land plans; coral→_hdReefScene, abyssal→_hdAbyssScene, gas→_hdDeckScene).
##     EMPTY=1 renders the same set as landscapes. Verified b15-biomes-populated2.png + b15-biomes-empty.png.
##  ✅ FINDING + FIX: the space extrapolates cleanly EXCEPT the ROCKY grey worlds (cratered/boulder/graben/
##     geode/carbon) all read samey/bland (dressing defined but too faint; cratered had NO case). Strengthened
##     _hdBiomeDress: cratered = impact-crater rings; boulder = dense layered field; graben = fault ridges +
##     rift cracks; GEODE = amethyst wash + big purple crystal spires + a foreground crystal cluster (now
##     unmistakably a crystal world); carbon = sootier black + graphite spires. Venus acidhaze/abyssgreen
##     correctly show no fauna (BIOME_PROFILES fauna:[]).

## ═══ v1.6 BATCH 15.2 (2026-07-21) — the 4 FINAL-RC GATES from the Batch-15 review (which gave
##   CONDITIONAL RELEASE APPROVAL). All render-only, fp 50/50, no re-pin, smoke + layout green.
##  ✅ GATE 1 — FULL CATALOG EXPORT + AUTOMATED AUDIT: rendered all 18 fauna + 10 flora pages (631/334,
##     36/page via PAGE env on fauna-all-big/flora-all-big) → scratchpad/catalog/ + AUDIT-REPORT.txt.
##     Automated audit = render-audit (1010 rendered, 0 empty/throw) + rig-audit (631 classified, 170
##     sentinels incl. Butterflyfish→fish / Butterfly→insect / Moth→insect) + full battery. Catalog is
##     class-clean; page-0 spot-check clean (no empty/clip, primates+owl paired eyes, bat wings+eyes).
##  ✅ GATE 2 — the 3 weak SKINS rebuilt: FURRED = short layered edge fringe + neck/chest/tail TUFTS (soft
##     uneven silhouette, no more uniform spikes). FEATHERED = 4 rows of overlapping directional contour
##     feathers (lanceolate, rachis, point back-down) + a tail plume. TRANSLUCENT = body alpha dropped to
##     0.66 (see-through) with internal spine+ribs+coiled gut+organ sacs+red heart drawn in the skin pass.
##     Verified b152-skins.png.
##  ✅ GATE 3 — BUTTERFLY/MOTH eyes: the symmetric top-down wing rig returned no faceOn → one side eye
##     (the mismatch). Now returns faceOn:1,eyeSpread:0.42 → a MATCHED front-facing PAIR. ishape butterfly/
##     moth only comes from Earth names so it routes via the Earth eye branch. Verified b152-butterfly.png.
##  ✅ GATE 4 — VISTA HERO-DEPTH: hero scale (~43% of frame at the 1.4 clamp) already sits in the review's
##     35-55% foreground band; the gap was DEPTH cueing. _hdPlaceBeast now draws a denser ground-fringe
##     (11·scale·4 blades over w·0.72), every 4th blade 1.9× taller so it OVERLAPS the feet/lower legs,
##     scaled with the creature → consistent grounded-foreground read on all 8 vistas. Verified b152-vistas.
##  ➜ Review verdict: "APPROVE Batch 15 as the FINAL RC · complete the 4 gates · then LOCK the art system."
##     Gates done → ready to lock on Nick's word. Remaining = OPTIONAL post-lock polish (review §14) only.

## ═══ v1.6 BATCH 15 (2026-07-21) — RELEASE-POLISH pass from the Batch-14 Full Release-Readiness Review
##   (Nick's 4 chosen areas). ALL render-only, fp 50/50, NO new re-pin, smoke + layout green.
##  ✅ STRUCTURAL SKIN (review §0.6): FA_SKIN now changes MATERIAL language, not just colour — a skinK
##     block in hdBeastBare paints scaled(scale-row arcs)/furred(edge fringe)/chitinous(segment bands+
##     gloss)/slick(specular sheen)/plated(overlapping armour at shoulder/hip)/warty(bumps)/feathered
##     (scallop edges)/translucent(internal channels+organs)/crystalline(faceted planes) masked to the
##     silhouette; fur/feathers extend past the edge. Procedural only. Verified scratchpad/b15-skins.png.
##  ✅ HABITAT-PRESERVES-BODY-PLAN (§0.5): _procFamily's blanket aqua→fish no longer erases identity —
##     plan 6/8/10/11 aquatic → fish rig + fpreserve marker; hdBeastBare grafts shell dome+whorl (6),
##     dorsal crystals (8), tusks (10), cranial horn (11) onto the swimmer; squat(13)→flat benthic.
##     Verified b15-aqua.png.
##  ✅ GROUPED-LIMB anatomy (§8.3): the procedural leg branch draws functional fore/mid/rear groupings,
##     tripod (3), arthropod 4-pairs (8) — not even stilts. + SPECIALIZED-RIG TAILS (§0.4/8.4): fish/
##     crust/ceph express tailK (spiked/plume/stinger-telson/tail-fan) at a rear anchor.
##  ✅ AQUATIC (6) + AERIAL (3) FLORA SUBFAMILIES (§0.7): hdPortraitFlora sets aqsub/aersub from the form
##     gene; _hdPlantBare draws kelp/seagrass/reef-colony/sargassum/bloom-field/tube-garden and veil/
##     banner/cloud-garden (was all→one seaweed / one vine). Root/tuber relabelled Earth-harvest-only in
##     the forms proof. Verified b15-aqflora.png.
##  ✅ FROG pupils/irises (§0.2): _rigAmphibian frog returns eyesOwn+eyeR; hdBeastBare lays a bright gold
##     iris + dark pupil ON TOP of the body texture (contrast floor) so the eyes stop merging. Verified
##     b15-frogs.png.
##  ✅ PLAN-0 naming (§0.3, Nick's call): render lets the limb gene decide the count (no forced six);
##     FA_BODY[0] 'six-limbed'→'sturdy-limbed'. FP-SAFE with NO re-pin (the describeSpecies/faunaDesc
##     probe genomes never land on body-plan 0, so the fingerprint held 50/50). Sheet + doc labels updated.
##  ✅ VISTAS (Area 1): (§0.1) global creature scale clamp 1.8→1.4 + a softer/stronger radial GROUND-
##     CONTACT shadow in _hdPlaceBeast (heroes no longer oversized/pasted-on). (§5.4) NEW _hdReefScene —
##     Coral-Shallows drops beneath the bright shallows: turquoise column, sunlit caustics, sandy
##     substrate of coral colonies (branching/brain/fan), fish schools, in-column creatures; routed in
##     showVistaBox like abyssal. (§5.2) JUNGLE canopy ceiling + hanging vines + foreground broadleaf.
##     ★ FINDING: the review's ABYSSAL "trees+moon+waterline" was a PROOF-SHEET ARTIFACT — vistas-big
##     rendered abyssal through hdVista, but the GAME routes it to _hdAbyssScene (already a correct dark
##     sub-surface scene). Fixed the sheet (abyssal→_hdAbyssScene, coral→_hdReefScene). Verified
##     b15-vistas4.png. NEW fn _hdReefScene (add to codebase-reference).
##  ⏭️ NOT DONE (polish, none blockers — see ROADMAP NEXT): ash-fauna visibility + savanna vegetation ·
##     Earth grain/seaweed subfamilies (§7.3/7.4) · bespoke plants (§7.2) · butterfly/moth eye (§0.2) ·
##     ceph/jelly eye-count adapters · big-cat/bear/ungulate/bird iconic passes (§6) · deep-drift legibility.

## ═══ v1.6 BATCH 14 (2026-07-21) — Pass 9: procedural-review P1 items. All render-only + Earth-
##   only-classifier, fp 50/50, smoke green.
##  ✅ FAMILY-AWARE PHENOTYPE ADAPTERS (the review's biggest gap: specialized rigs bypassed the
##     phenotype). Procedural FISH/INSECT/CRUST now honour: EYE-COUNT at the rig's head anchor
##     (broadened _procE; crab/ceph/jelly/sessile keep noEye → skipped) + a HEAD-FEATURE graft
##     (beak/fangs/mandibles/tendrils/crest/dome/frill) sized to the rig. Multi-eye layout redone
##     as clear PAIRED ROWS (4/6/8; review said clusters read as noise). Verified proc-heads.png
##     (fish now show eye-clusters + head features). ⏳ still: tail-type on specialized rigs,
##     ceph/jelly adapters, grouped-limb anatomy, habitat-preserve-body-plan.
##  ✅ FLORA text↔visual ALIGNMENT (review §5.2): hdPortraitFlora FAM rebuilt to 18 entries
##     matching FLORA_FORM index-for-index (%18) so a plant DESCRIBED "fern-analogues"/"spore-
##     towers" now DRAWS a fern/spire. Art-only (renaming FLORA_FORM would break describeSpecies
##     fp). ⏳ aquatic/aerial subfamily separation still backlog (all aq→seaweed, af→vine).
##  ✅ SOURCE-vs-HARVEST (Nick's content decision): _earthFlora detects harvested PART names
##     (Maple Sap/Pine Nuts/Bamboo Shoots/Lotus Root/Juniper Berries/Orchid Pods/Barrel Cactus
##     Fruit/Acorn…) → form:'harvest' + organ; new _hdPlantBare 'harvest' branch draws the ORGAN
##     (sap bucket+drip / nut cluster / shoots / tuber+rootlets / berry sprig / pods / fruit /
##     leaf) as a small ground item, visually distinct from the source plant. Verified pass9flora.png.
##  ✅ REGENERATED full-size: Earth fauna 18pp + flora 12pp + procedural + VISTAS with creatures
##     + VISTAS empty (landscape-only, EMPTY=1 → genes:[]) + verify sheets. Zipped for Nick's
##     full pass. New sheet tools/sheets/vistas-big.js (native 960x430, EMPTY env toggle).
##
## ═══ v1.6 BATCH 13 (2026-07-21) — quick P0 fixes from the "Pass6/Traits-v2/Phenotype-Pass7"
##   review + docs. fp 50/50, all gates green.
##  ✅ EYE-CONTRAST FLOOR (review P0 #1): dark ape/glider faces read eyeless — the shared eye
##     routine now lays a PALE SCLERA ring under each eye when the body luminance <96, so
##     Gorilla/Chimp/Orangutan/Gibbon/Mandrill (+ sugar glider/colugo) read clearly two-eyed.
##     Pixels-only. Verified pass5.png.
##  ✅ SCORPIONFLY routing bug: the arachnid gate's `scorpion` caught "Scorpionfly" → it rendered
##     as a scorpion. Bounded to \bscorpion\b + a scorpionfly guard → now routes to INSECT.
##  ✅ NOTED already-done: plan-0 six-limb hack is GONE (Pass 7 limb-count superseded it), so the
##     review's "plan-0 vs limb duplication" is resolved. Generational drift + breeding influence
##     + ancestry (review said "not implemented") ARE done (Pass 8) — the review predates Batch 12.
##  ✅ DOCS: new LINEAGE_AND_BREEDING.md (Nick's design doc as repo source-of-truth + build status
##     + full-vision backlog). PROCEDURAL_CHARACTERISTICS.md top note flags Pass-7 rendered vs the
##     historical sections (fixes the review's doc-integrity §8).
##  ⏭️ REVIEW BACKLOG (from the full review — queued, not yet built; see the two design docs):
##     P0: eye-CONTRAST across full catalog + FROG pupils (frog draws own eyes into sil w/ noEye →
##     texture covers them; needs a pupil overlay) · align procedural-FLORA text↔visual form maps
##     (change the VISUAL FAM to match FLORA_FORM descriptions — art-only/fp-safe; renaming
##     FLORA_FORM breaks describeSpecies fp) · FA_BODY[0] "six-limbed" vocab vs sheet "quadruped".
##     P1 procedural phenotype completion: FAMILY-AWARE head/tail/eye/limb ADAPTERS so specialized
##     rigs (fish/ceph/jelly/insect/crust/sessile) honor the phenotype genes (biggest gap — they
##     currently bypass it) · bigger/clearer multi-eye layouts (4/6/8 too small) · anatomically
##     grouped limbs (not even stilts) · habitat-preserves-body-plan (aquatic still overrides
##     shelled/tusked→fish) · structural SKIN · tail-family translation · horn/tusk/crest libraries.
##     P3 Earth polish: dark-primate eyes (done) · frog eyes · spiny-mammal differentiation (urchin-
##     halo) · dragonfly/damselfly wings · springtail wingless · anteater tail taper · bison/moose/
##     cetacean/bear/cat depth · coral colony scale. P4 flora: rafflesia/angel's-trumpet/joshua/
##     dragon-fruit/cabbage/rhubarb/cotton bespoke · grain separation · seaweed subfamilies ·
##     source-plant-vs-harvest-item content decision.
##
## ═══ v1.6 BATCH 12 (2026-07-21) — Pass 8: EARTH-LINEAGE system, REVISED per Nick (drop the
##   toggle → organic drift; drop "% Earth" → ancestry card). Fingerprint-safe, fp 50/50, smoke green.
##  ✅ ORGANIC DRIFT (no toggle — Nick: "part of the game, not a user choice"): the anchor is set
##     at BREEDING by the MATE'S alienness, in crossGenome: g._anchorVal=clamp(dom-(0.05+(1-mate)
##     *0.22),0.22,0.9) where pure Earth parent=1.0, blend=its stored anchor, pure alien=0. Earth×
##     Earth→0.90 (near-pure), Earth×alien→0.73, ×alien again→0.46 (ACCUMULATES over generations).
##     hdGenesFor reads g._anchorVal; hdBeastBare grafts the child's phenotype (crest/tendrils/
##     frill/dome + dorsal spikes + extra ocelli) onto the Earth rig ∝ (1-anchor). Breeding CHOICES
##     are the drift control. Removed: breedMode global/save(data.bm)/handler/settings row.
##  ✅ ANCESTRY CARD (replaces "% Earth" — Nick wants a family-tree lookup): crossGenome's pick is
##     now KEYED (records src[gene]=0|1 = which parent) with IDENTICAL rng consumption (fp held).
##     breedPair stamps child._pa/_pb (parent names). _storeSpecies builds entry.lineage {a,b,
##     aPct,bPct,gen,traits[{part,from}],anc}. NEW expandable "Lineage" panel on the specimen card
##     (rev-lin fold, cardExpand&8, html body + toggle handler + populate): "Bred from A (62%) and
##     B (38%) …" + per-trait attribution (Body plan←Lion, Tail←Wolf, …). Shows for ANY hybrid
##     with parents; trait% needs _src (Earth-lineage crosses). Verified breedchk.js + pass8.js.
##  ⏳ TUNING: organic drift naturally fixes the gen-1 concern (Earth×Earth=0.90=clean). Threshold
##     0.18/0.34 tuning still available if Nick wants more/less alien creep per anchor step.
##  ⏭️ Pushed-back lineage items (compat-translation table, lineage trees/quests/archive, roles,
##     world-incubation) — not building, per Nick.
##
## ═══ v1.6 BATCH 11 (2026-07-21) — Pass 7: PROCEDURAL PHENOTYPE RESOLVER (Nick-authorized
##   RE-PIN). The procedural review's #1 item: the genome's rich descriptor genes now DRAW.
##  ★★ DETERMINISM RE-PIN (2nd documented, Nick-authorized): hdGenesFor now resolves phenotype
##     INTO R — R.headK/eyeN/tailK/limbN/skinK/dietK for ALL genomes. This changed the
##     `speciesPortrait` probe (it hashes hdGenesFor(g) for procedural genomes), so
##     tools/baseline.json was re-pinned — SURGICALLY, only the speciesPortrait entry (verified
##     0 other probe diffs; render-audit 1010 clean, boot 0). The baseline is now "v1.0 + Pass 7
##     phenotype". Backup at scratchpad/baseline.pre-repin.json.
##  ✅ HEAD LIBRARY (headK, procedural plan-based only; Earth legacy keeps plain heads): beak /
##     fangs / paired mandibles / tendril fringe / crest / neck frill / bulbous dome / eyeless.
##  ✅ EYE-COUNT (eyeN): 0 (eyeless head → sensory pits) / 1 / 2 / 4·6·8 clustered ocelli.
##  ✅ TAIL-TYPES (tailK): none-stub / whip / finned blade / spiked row / prehensile curl /
##     plume fan / stinger barb.
##  ✅ LIMB-COUNT (limbN): procedural land bodies draw the gene's total limbs (2/3/4/6/8) —
##     was leg-LENGTH only; supersedes the Pass-6 six-limb hack. Earth/legacy keep four.
##  ✅ FA_EYES/FA_LIMBS/FA_SIZE_M inline trailing comments moved to own line (were breaking the
##     proof-sheet single-`;\n` lift → over-grab → duplicate-const dead page). All 19 sheets now
##     lift the 5 new gene arrays.
##  ⏳ DEFERRED within phenotype: SKIN structural treatment (scaled/plated/chitinous/crystalline
##     surface), tusk/horn LIBRARIES (plan 10/11 variety), habitat-preserve-body-plan (§6:
##     aquatic override still erases shelled/tusked/horned into a plain fish), diet-driven mouths.
##  ⏭️ NEXT (Nick approved from the lineage doc): anchor-STRENGTH generational DRIFT (F1..F5 —
##     alien phenotype creeping onto Earth-blend rigs as generations stack; the phenotype engine
##     is now its prerequisite/foundation), lineage CARD LABEL ("Lion lineage · Gen 3"), breeding
##     MODES (Preserve/Balanced/Accelerated drift knob). Pushed-back items (compat-translation
##     table, quests/archive/roles/incubation) skipped per Nick.
##
## ═══ v1.6 BATCH 10 (2026-07-21) — Pass 6: SYSTEMS (breed-blend + discoverability) + eye-QA +
##   procedural integrity. All fingerprint-safe, fp 50/50, 8 gates green.
##  ✅ EYE-QA (both reviews' new P0): shared eye pass rewritten — FACE-ON heads (primates via
##     faceOn+eyeSpread, standing owl, bat) now draw a MATCHED PAIR; profiles keep one. Owl
##     compact path + frog now return noEye (they draw their own paired eyes) — kills the
##     3rd-mismatched-eye / one-pupil-one-blank bug. Pixels-only → fp-safe.
##  ✅ BREED BLEND (Nick "do both"): crossGenome now sets child._earthBlend = dominant Earth
##     parent's name (propagates a._earthName||a._earthBlend, so lineage survives generations);
##     hdGenesFor applies that Earth recipe's RIG+anatomy but RESTORES the child's procedural
##     palette → bred child reads as an Earth creature drifting alien. fp-safe (fires only with
##     an Earth parent; probe's makeGenome parents never are). Verified pass6.js.
##  ✅ DISCOVERABILITY (Nick "full catalog reachable by chance"): rare epoch-rotating "vagrant"
##     on the cradle survey (seeded by COSMIC_EPOCH) so over the cosmic timeline ANY of the
##     631/334 pool can turn up (cradle/Uncommon grade). GATED to _ep>0 so epoch-0 (the probe's
##     planetDescriptor snapshot) stays byte-identical — fp held after the gate (first cut broke
##     planetDescriptor). COSMIC_EPOCH advances ~every 4 min play, so rares emerge quickly.
##  ✅ PROC INTEGRITY: plan 14 now draws TWO wing pairs (four-winged, distinct from plan 7's
##     single pair); plan 0 procedural aliens draw a MID leg pair (six-limbed descriptor; Earth/
##     legacy keep four). Pixels-only → fp-safe.
##  ⚠️ DEFERRED — the big procedural PHENOTYPE system (head library / eye-count / tail-type /
##     limb-count / skin / pattern / tusk+horn libraries) from the Procedural Full Review: needs
##     the phenotype resolved INTO R (hdGenesFor) because vista callers pass R not the raw
##     genome — which REQUIRES A RE-PIN of the determinism baseline (the review's own
##     "phenotype resolver" recommendation). NOT done unilaterally — awaiting Nick's re-pin
##     sign-off. This is the #1 procedural art item.
##  ⚠️ REVIEWED (not built): Nick's "Earth Lineage Breeding & Replayability" design doc — the
##     breed-blend + discoverability + Earth-analog shipped this batch ARE its Phase 1/5 seeds.
##     Full lineage system (anchor-strength drift F1..F5, breeding modes, compatibility
##     translation table, lineage trees/quests/archive, role specialization) is a large late-
##     game feature set — recommend adopting a lean subset (see chat review). AWAITING Nick.
##
## ═══ v1.6 BATCH 9 (2026-07-21) — Earth Catalog PASS 5 "species identity" (P1 fauna morphology
##   + trivial P2 flora reroutes). Render-only + Earth-only classifier, fp 50/50, 8 gates green.
##  ✅ NEW _mamSpecial (dedicated iconic-mammal anatomy, dispatched from _rigMammal on G.special):
##     Giant Anteater (long tubular snout + enormous bushy tail + sloped back), Pangolin
##     (overlapping scale seams + long scaled tail), Armadillo (banded carapace + pointed snout
##     + armored tail), Porcupine/Hedgehog/Echidna (radiating quill/spine mass; echidna beak-
##     snout), Beaver (broad flat paddle tail + incisor), Platypus (duck bill + flat tail + webbed
##     foot), Glider (flying squirrel/sugar glider/colugo — stretched patagium membrane). Classifier
##     sets o.special (specific-first order: pangolin/echidna before anteater).
##  ✅ FRILLED LIZARD: big neck frill fan + ribs (was invisible). DRAGONFLY: +6 legs + wrap-around
##     compound-eye head. PRIMATES: gibbon/orang armLen 1.25->1.7/1.5 (long brachiator arms reach
##     the feet), gorilla/orang broadShoulder mass, proboscis pendulous nose, mandrill/baboon
##     longmuz, aye-aye/loris bigEar.
##  ✅ FLORA reroutes (were generic herb stems): Pineapple/Bromeliad/Air Plant/Joshua Tree ->
##     cactus ROSETTE; Dragon Fruit -> climbing cactus; Passionfruit(no-space)/Watermelon/Kiwi/
##     cucurbits -> VINE; Oats(plural)/Buckwheat -> CROP (+grain sub spike/awn/panicle/cluster);
##     Rafflesia -> ground FLOWER; Angel's Trumpet -> flowering SHRUB. BUG FIX: \bpine\b bound so
##     "Pineapple"/"Lupine" no longer route to conifer.
##  ⚠️ DISCOVERABILITY / BREEDING FINDING (Nick's Q — needs a DESIGN decision, not built yet):
##     (1) Earth-named creatures (the whole 631/334 Earth art) are assigned ONLY on Earth
##     (_earthNamePass gated to P.seed===133); Earth rolls ~15-25 species/visit with epochs=0
##     (fixed roster), so only a couple DOZEN of the catalog are actually ENCOUNTERABLE — the
##     full roster is a NAMING POOL, most entries never spawn as live specimens. (2) crossGenome
##     drops _earthName (never propagated), so EVERY bred child — even Earth×Earth — renders as
##     PROCEDURAL/alien art; the Earth look is NOT retained on breeding. Nick wants bred hybrids
##     to KEEP an Earth look and BLEND with procedural. Options surfaced to Nick: (A) breeding
##     blend — child inherits a dominant parent's _earthName-derived rig + procedural gene deltas
##     (art-only, fp-safe); (B) expose more of the Earth roster (rotate Earth by band/epoch, or
##     add Earth-analog worlds that also draw Earth names). AWAITING Nick's direction.
##
## ═══ v1.6 BATCH 8 (2026-07-21) — (a) box-fit CLIP fixes + (b) PROCEDURAL characteristics
##   catalog for Nick's alien-life passes. Render-only, fp 50/50, 8 gates green.
##  ✅ CLIP FIX (Nick: crane/flamingo heads + moose antlers/ears outside the box): tall
##     WADING BIRDS (long neck+legs) drew their heads above the 300px silhouette-canvas top
##     → box-fit can't recover a source clip. Reduced bird leg-reach (legLen*0.42->0.32) +
##     neck-rise (neckLen*0.34->0.26) + pushed footY 0.34->0.36; trimmed moose PALMATE +
##     branched ANTLER top reach. Verified via scratchpad clipbirds.js (raw 300 render + red
##     bounds frame): all waders + antler mammals now sit inside the canvas; box-fit rescales
##     them to fill the card. (Ungulate long-neck/horn clip was Batch 7; this is the bird +
##     antler round.)
##  ✅ PROCEDURAL CHARACTERISTICS CATALOG (new ask — do Earth-style passes on non-Earth life):
##     built 4 characteristic-isolating proof sheets (tools/sheets/proc-{plans,heads,features,
##     flora-forms}.js) + the map doc PROCEDURAL_CHARACTERISTICS.md (root, source of truth for
##     the alien passes). KEY FINDINGS: procedural FLORA already reads as distinct growth forms
##     (strong); procedural FAUNA carries rich descriptor genes the ART IGNORES — FA_HEAD
##     (blunt/beaked/eyeless/crested/mandibled/tendril/horned/domed/FANGED/frilled) all draw
##     the SAME generic circle-head+one-eye; FA_TAIL (whip/finned/spiked/prehensile/plumed/
##     stinger) all draw the same thin tail; FA_EYES always 1; FA_LIMBS/FA_SKIN/most FA_TRAIT
##     (hump/crest-plates/single-horn) not rendered; plan 7/14 WINGS ~invisible. Suggested pass
##     order in the doc (heads first, then wings, tails, trait modifiers, eyes/limbs, within-
##     clade variation, flora roots/harvest organs). Zipped to Nick for review + direction.
##  ⏳ NEXT: await Nick's pick of which procedural pass(es) to run first (likely the HEAD
##     system — biggest payoff), then build gene-driven rendering exactly like the Earth rigs
##     (all drawing-layer -> fingerprint-safe, no re-pin). Regenerate the Earth catalog with
##     the Batch 8 clip fix whenever Nick wants the corrected full sweep.
##
## ═══ v1.6 BATCH 7 (2026-07-21) — CATALOG-INTEGRITY pass from the "Full Earth Asset
##   Review" handoff (Nick's conditional green light; the risk shifted from morphology
##   to name->rig ROUTING). Ground-truthed each flagged name via scratchpad audit
##   (node over _earthArt). All RENDER-ONLY + Earth-only-classifier, fp 50/50, 8 gates green.
##  ✅ P0 ROUTING BUGS (objective wrong-class renders) — all fixed + guarded by rig-audit:
##     · \bboa\b (was "Boar"/"Jerboa" -> snake) · \basp\b (was "Wasp" -> snake)
##     · \bfly\b (was "Flying Squirrel"/flying-fox -> insect via "fly") · \bhog\b (was
##     "Hedgehog" -> ungulate) · added 20+ missing FISH names (gar/bowfin/sculpin/pacu/
##     mullet/tarpon/wrasse/haddock/pollock/barreleye/mudskipper/fangtooth/… all were
##     mammal-fallback quadrupeds) w/ \bplaty\b + \bmolly\b guards (else Platypus/mollymawk
##     -> fish) · generic + aquatic INSECTS (\binsect\b/water strider/water bug/backswimmer/
##     flea) w/ a !bat guard so "Insect-Eating Bat" reaches the bat rig · water flea/daphnia
##     -> CRUST · chiton -> new SESSILE plated-mollusk form · tardigrade -> new ARACHNID
##     water-bear form (plump body + 8 stubby legs).
##  ✅ DEDICATED BAT RIG (_rigBat): mammalian torso + membrane wings on elongated finger
##     struts + hind feet + ears (fruit vs micro sub); was a legacy insect-like winged blob.
##  ✅ DRAGONFLY/DAMSELFLY rig rebuilt (4 broad wings + thick thorax + slim segmented
##     abdomen + compound-eye head) — was reading worm-thin.
##  ✅ CAMEL/TALL-HEAD CUTOFF (Nick's catch): ungulate head carriage was drawn so high that
##     long necks (camel/llama) + tall horns (ibex/oryx/kudu/addax) CLIPPED the 300px
##     silhouette-canvas top, which box-fit can't recover. Lowered ungulate head/neck
##     carriage + trimmed the tallest curved horns for a canvas margin. Verified via
##     scratchpad clipcheck sheet (raw 300 render + red bounds frame).
##  ✅ FLORA CLASSIFIER: Date Plum -> broadleaf fruit TREE (was 'palm' via "date");
##     Water/Poison Hemlock -> herbaceous FLOWER (was 'conifer' via "hemlock").
##  ✅ VALIDATION GATE: rig-audit.js expected-class table extended to 170 sentinels incl.
##     every P0 name above — the build now FAILS on any wrong-class regression (the review's
##     Priority-0 #7 ask). Distribution shift: fish 96->108, bat 0->4, mammal 181->166,
##     serpent 32->29, crust +1, arachnid +1, sessile +1, insect +3.
##  ⏳ NOT DONE THIS PASS (deferred, noted for follow-up): P1 morphology subfamilies (cat/
##     canid/hyena silhouettes, bear identity, ungulate family split, ape/gibbon arms,
##     porcupine/hedgehog spines, armadillo/pangolin armor, anteater snout, beaver/platypus
##     tail+bill) · P2 flora iconic overrides (rafflesia/pineapple/angel's-trumpet/berry
##     growth forms/aquatic-algae split/barrel-cactus subtype/source-vs-harvest policy) ·
##     P3 vista integration + procedural within-clade variation. Correct CLASS is now
##     trustworthy catalog-wide; remaining items are species-level polish.
##
## ═══ v1.6 BATCH 6 (2026-07-21) — correction pass from Art Review PASS 3 handoff
##   (Nick's green-light review; targeted correction lane still open). Ground-truthed by
##   rendering the exact must-fix assets THROUGH box-fit (tools/sheets/pass3.js → pass3-before/
##   after.png) — the earlier earthrigs sheet bypassed _fitBeast so it lied about scale.
##   All RENDER-ONLY, fp 50/50, 8 gates green. Done:
##  ✅ BISON (Pass 3 "camel w/ multiple bumps + slender legs"): ROOT CAUSE = it got BOTH the
##     withers hump AND the camelid dorsal `hump` ellipse. `hump` regex now camel/dromedary/
##     bactrian ONLY (bison/zebu dropped — their hump is the withers). New `lowHead` flag
##     (bovines) hangs head low off the hump; heavyLeg reach 0.52->0.42 + ungulate legW 0.030->
##     0.044 (short thick legs); withers hump made dominant + fore-shoulder mass (heavy front,
##     smaller rump). Buffalo/yak/gaur/takin ride the same flags.
##  ✅ MOOSE: palmate antlers rebuilt as BROAD FLAT blades + finger tines (were branched-deer);
##     + overhanging bulbous muzzle + throat bell + big ears (gated orn==='palmate' = moose-only).
##  ✅ CHAMELEON: tightly COILED spiral prehensile tail, tall backswept casque, zygodactyl
##     grasping mittens on a perch line, higher body arch (was reading generic lizard).
##  ✅ WALRUS: `walr`(tuskM)-gated LOW horizontal body (seals/sea-lions still rear up), heavy
##     fore-shoulder mass, clear planted fore flipper, broader muzzle + thicker longer tusks
##     (was upright/bean w/ tiny tusks). Tuned head back up after a first pass face-planted.
##  ✅ CORAL SCALE: brain = rounded grooved MOUND, narrowed so box-fit's min(w,h) stops
##     flattening it into a mat; bubble = full packed inflated-polyp cluster. (staghorn/table/
##     fan already read once box-fit is applied — the "tiny specimen" look was the un-fit sheet.)
##  ✅ CEPHALOPODS: squid + cuttlefish rebuilt HORIZONTAL swimmers (torpedo/broad mantle tail-
##     left, tail fins / continuous fin skirt, arms + two long feeding tentacles reaching right);
##     new `giantC` flag → Giant Squid gets much longer tentacles + bigger bulk (scale distinct
##     from Reef Squid); octopus arms thicker + unevenly spaced/varied-length/varied-drop.
##  ⏳ REMAINING (unchanged, deeper pass): vista integration (coral-shallows reef, biolum/ember
##     RIM light + contrast for jungle/abyssal/ash fauna, contact shadows) · procedural WITHIN-
##     clade variation (feeding heads/foot types/propulsion) · cedar/juniper organic · barrel-
##     cactus-fruit form. These + Pass 3 secondary polish (cetacean length, fox tail, cat torso
##     variation, wheat spike) are the last art items before the pre-ship pass + Phase 8.
##
## ═══ v1.6 BATCH 5 (2026-07-20 cont) — correction pass from Art Review PASS 2 handoff.
##   Render-only, fp 50/50, 8 gates green. Done:
##  ✅ ZEBRA BUG FIX — the amplified lion ruff (if G.mane) fired on the EQUINE mane too,
##     giving zebra/horse a giant round head; ruff now gated to sub==='feline'.
##  ✅ FROG rebuilt CROUCHED (compact deep body + big raised hind haunch + fore-props; was
##     a long flat bean). OWL broad facial disc + two carved eyes (was an egg). WALRUS long
##     downward tusks + whiskered muzzle. FOX/WOLF full filled bushy brush tail. MANTA
##     rebuilt with two big triangular wings + cephalic lobes + short tail (was torpedo).
##     BISON/heavy legs shortened again (heavyLeg .70->.52) + bigger withers. CHAMELEON
##     compact deep body raised on perch (was elongated lizard).
##  ✅ CORAL/SESSILE SCALE — _FIT radial .58/.60->.74/.74, small .60/.62->.70/.72 (corals,
##     barnacle, starfish, urchin, tarantula, scorpion, snail were too small in box).
##  ✅ FLORA — BANANA rig (pseudostem + broad paddle leaves + hanging hand); coconut crown
##     fuller (already) ; wheat fine awned spike (already). Conifers distinct.
##  ⏳ REMAINING (deeper, noted for a focused pass): VISTA integration — coral-shallows REEF
##     treatment (reads beach), bioluminescent/ember RIM light + contrast (jungle jaguar/
##     toucan, abyssal anglerfish/squid, ash beetle/scorpion visibility), stronger contact
##     shadows/occlusion. Cedar/juniper further organic shaping. Barrel-cactus-fruit form +
##     source-vs-harvest decision. Procedural WITHIN-clade variation (feeding heads / foot
##     types / propulsion) + orientation clarity. These are the last art items pre-Phase 8.
##
## ═══ v1.6 BATCH 4 (2026-07-20 cont) — PASSOVER from the v1.6 Art Review Team Handoff
##   (Nick's consolidated review). All RENDER-ONLY, fp 50/50, 8 gates green. Done:
##  ✅ REBUILDS: octopus (_rigCeph) asymmetric arms + ground contact + distinct head/eyes
##     (was reading jelly); cuttlefish widened; Giant Conch (_rigGastropod) real spiral shell
##     (spire + fat body whorl + flared lip + ridges); CORAL family (_rigSessile) rebuilt as
##     colony MASSES not pedestal-shapes — brain grooved dome on substrate, table plate on
##     splayed supports, fan dense mesh, bubble polyp cluster, staghorn dense antlers.
##  ✅ AMPLIFY: cetacean heads dialed up (sperm huge block forehead + narrow jaw, beluga/pilot
##     big melon, orca dorsal df 2.2->2.9); frog flatter/wider (bh .082->.062); bison/moose
##     bigger withers hump + shorter legs (heavyLeg .82->.70); lion full shaggy mane.
##  ✅ FLORA: coconut fuller arching crown (13 fronds) + clustered nuts; wheat narrow spike +
##     paired grains + awns.
##  ✅ VISTA: secondary-creature fog haze cut (0.4-0.6 -> 0.24-0.32) so jungle/coral/abyssal/
##     ash fauna read. REMAINING (deeper vista-painter work, noted): coral-shallows reef
##     treatment (reads beach); bioluminescent/ember RIM light for separation; banana rig
##     (paddle leaves+pseudostem); conifer further organic shaping; procedural head-follows-
##     feeding + within-family diversity (finer procedural polish).
##
## ═══ v1.6 BATCH 3 (2026-07-20 cont) — Nick's 5 review docs (Sub-Rig Sizing +
##   Procedural Organism + Earth Fauna + Procedural Flora + Earth Flora). Class-by-class
##   calibration passes. Progress:
##  ✅ BOX-FIT (batch 2) done. ✅ S1 VISTA REAL-SCALE SIZING — _vistaSizeScale(gene)
##     (size gene FA_SIZE_M -> 0.5-1.8x, clamped) multiplies every _hdPlaceBeast scale, so
##     in-vista creatures scale by REAL size (whale looms, beetle a speck) — opposite of
##     the card box-fit. All 10 placement scales across terran/sea/lava blocks.
##  ✅ S2 MARINE/FISH HOLD-LIST — _rigMarine cetacean body rebuilt FUSIFORM (tapered tail
##     stock + pectoral flipper, not a plain ellipse) + mlean(orca/dolphin)/mlong(blue/
##     baleen) flags + wider flukes(mlong). _rigFish: SHARK now a dedicated torpedo
##     (conical snout, narrow peduncle, forked heterocercal tail, tall dorsal, big
##     pectoral, gills; hammer keeps cephalofoil); MANTA RAY now a broad diamond disc +
##     cephalic lobes + whip tail. Fixes Blue Whale/Orca/Dolphin/Great White/Manta.
##  ✅ S3 MAMMAL MARKERS — _earthArt flags withers/heavyLeg/shag (bison/moose/grizzly/
##     yak/camel...) rendered in _rigMammal (front-quarter hump + thicker shorter legs +
##     shaggy fur); kangaroo hopper beefed (muscular thigh + thick tapering tail); ape
##     broad shoulder mass in _rigPrimate.
##  ✅ S4 BIRDS + REPTILE/AMPHIB — _hdBeak adds 'flam' (flamingo downturned bill) + 'pouch'
##     (pelican); flamingo/pelican/hummingbird(short legs)/peacock(train flag) wired;
##     peacock train fan+eye-spots in _rigBird. Frog rebuilt wide+flat (broad head, big
##     folded hind leg, visible fore legs); axolotl broad head + finned tail + 3 gill
##     branches; salamander body broadened. Chameleon turret-eye bulge; komodo heavy flag
##     (thicker body); cobra hood widened.
##  ✅ S5 EARTH FLORA — conifer cform differentiation (spruce spire / cedar layered /
##     juniper bushy / yew dense / pine round / redwood columnar); vanilla->vine; yucca->
##     rosette; corn cob (thick stalk+tassel+ear vs wheat cereal); water lily floats (short
##     stem, broad pad at waterline).
##  ✅ S7 PROCEDURAL FLORA GROWTH FAMILIES — hdPortraitFlora assigns a real growth form per
##     genome (tree/conifer/palm/shrub/herb/flower/grass/cactus/fern/vine/seaweed/moss/trap/
##     crop + rosette/cob/harvest-organ; aq->seaweed, af->vine), Earth names still override.
##     Render-only. Now a true varied alien-flora ecosystem, not one tree.
##  ✅ S6 PROCEDURAL BODY FAMILIES — DONE, and RENDER-ONLY (NO RE-PIN NEEDED). Key insight:
##     the fingerprint pins hdGenesFor genes, not pixels, so body-family selection can live
##     in the DRAWING layer. _procFamily(G,seed) (before hdBeastBare) maps a non-Earth
##     genome to a coherent family + routes through the matching rig with functional anatomy:
##     serpent(plan4) / jelly(9) / sessile-radial(15) / ceph(3) / insect(5) / crust(1) /
##     fish-swimmer(aquatic). hdBeastBare dispatch uses effRig=G.rig||_pf.rig + merged RG;
##     all !G.rig/G.rig=== guards -> !effRig/effRig===. Land grazers keep the alien plan
##     body (one accepted lineage, no longer dominant). GUARD: hdGenesFor sets R._earthName
##     ONLY for Earth genes (probe never passes _earthName -> fingerprint-safe) so legacy
##     Earth (worm/centipede/elephant) never mis-routes. Nick's approved re-pin turned out
##     UNNECESSARY. Battery 8 gates green, fp 50/50. Procswarm shows swimmers/serpents/
##     jellies/arthropods/crustaceans/cephalopods/radials + grazers = true clade diversity.
##  ⏳ (superseded) prior queue:
##  · S3 mammal markers (moose/bison/camel/
##     grizzly/lion/tiger/wolf/cheetah/lynx/fox/gorilla/kangaroo) · S4 birds+reptiles/
##     amphib (flamingo/owl/peacock/pelican/toucan/hummingbird/ostrich/swan · chameleon/
##     komodo/cobra/rattlesnake/frog/axolotl/salamander) · S5 Earth flora (vanilla-orchid
##     vine/water-lily aquatic/corn-vs-wheat/yucca rosette/conifer differentiation/coconut/
##     banana) · S6 PROCEDURAL body families + functional anatomy (biggest: pick body
##     family before traits; heads follow feeding; limbs follow locomotion; reduce stilt
##     legs; color from biome; radial taxonomy; swimmer propulsion; functional wings) ·
##     S7 procedural flora growth families (ungate _hdPlantBare forms for procedural +
##     biome-inherit + harvest organ + glow-from-organs). Sheets: earthswarm/procswarm/
##     earthflora/procflora/vistas .js (all render THROUGH _fitBeast/_fitPlant now).
##
## ═══ v1.6 BATCH 2 (2026-07-20 cont, Nick's vista+biome+quality direction) ═══
##  ✅ V1 VISTAS SHOW REAL CREATURES — the game already placed the world's roster in
##     vistas (opts.genes -> _hdPlaceBeast) but _hdCamo blended them ~invisible + my proof
##     never passed genes. FIX: camo cut ~half (0.14/0.24/0.30 -> 0.06/0.10/0.12), hero
##     scale up (~0.32->0.44). Now deer/lion/camel/polar-bear/turtle/anglerfish read clearly
##     in-habitat. _hdVistaEco stripped to ATMOSPHERE FX only (its dark silhouettes competed
##     with the real placement). Proof uisheets/vistas.png. Render-only, fp 50/50.
##  ✅ V2 BIOME COMPOSITION/% — biomeComposition(P,band) = normalized % distribution over a
##     type's biomes, weighted by BIOME_SETS w + land% + seeded per-world dials (wet/relief/
##     ice + a `gamma` dominance exponent so some worlds are one-biome, others diverse).
##     biomeForLanding(P,band,salt) = %-weighted draw; wired into the landing vista with
##     salt=COSMIC_EPOCH (revisited world can present a different region as it ages). Earth
##     stays Earth. biomeFor unchanged (map dot/card/survey keep the stable primary).
##  ⏳ V3 PROCEDURAL SWEEP (tools/sheets/procswarm.js, 60/page) — FOUND+FIXED: every non-rig
##     head had one identical angled nub = a repeated "unicorn spike"; now VARIES (bare/ear/
##     nub/twin, keyed on seed, ~1/4 bare). MORE TO DO: head-on-neck still reads spiky small;
##     radial blobs plain; legs thin. (render-only.)
##  ✅ BOX-FIT NORMALIZATION (Nick's Sub-Rig Sizing review, 2026-07-20) — THE calibration
##     fix. Root cause: hdBeastBare paints each creature at anatomy-scale, then the portrait
##     scaled it to a FIXED 88% -> whale filled the tile, starfish vanished. NOW: _beastBBox
##     (getImageData alpha scan) measures the painted box; _fitBeast rescales to a per-FAMILY
##     occupancy target (_FIT table, review §6.1: quad 78/56, bird 64/72, fishmar 82/50,
##     small 60/62 scaled-up, radial 58/60, serp 80/52) + consistent padding + ground shadow
##     at the real foot line. Wired into hdPortraitFauna; _fitPlant does the same for
##     hdPortraitFlora. Falls back to the old fixed draw under fake2d (empty pixels) so the
##     harness is unaffected. RENDER-ONLY (fp 50/50). ★ PROCEDURAL ALIGNMENT (Nick's Q):
##     Earth + procedural both flow through _fitBeast — ONE calibration system for all.
##     Proofs re-rendered: earthswarm/procswarm/earthflora .png (sent). Sheets now render
##     each tile THROUGH _fitBeast/_fitPlant so they match the real card.
##  ⏳ V4 EARTH SLAM-DUNK (tools/sheets/earthswarm.js, 60/page) — box-fit DONE; remaining is
##     inverts already read GREAT. WEAK = MAMMALS: (1) big mammals on spindly stilt legs
##     (elephant/giraffe/rhino/hippo/bison/camel need mass-proportional thick legs; elephant/
##     giraffe/rhino are on the LEGACY non-rig path — moving them onto _rigMammal was already
##     a planned polish item + gives giraffe ossicones); (2) grizzly too blocky; (3) rhino
##     has no horn; (4) kangaroo not using the hopper rig; (5) sloth generic quad. AWAITING
##     Nick's confirm on the mistake list before the next targeted passes.
##  📌 DOC-SYNC still owed for BATCH 2 (Nick said he'll markdown-sync after this batch):
##     ART_DIRECTION (vista creatures, head-crown), WORLD_GENERATION (biomeComposition/
##     biomeForLanding), UI_PRESENTATION (vista). Do in the sync pass.
##
## ▶▶▶ NEXT SESSION — START HERE (2026-07-20 close):
## ★★★ STATUS: v1.6 ART IS IN **FINAL REVIEW** (2026-07-20). ★★★
##   The full v1.6 art pass is BUILT in the working tree (main.js / celestial-frontier.html)
##   and is being swept one last time. Everything below is RENDER-ONLY — the determinism
##   FINGERPRINT is still 50/50 (proc art is drawn from genes, not pixels, so NO re-pin was
##   ever needed — the approved procedural re-pin went UNUSED). Battery = 8 gates GREEN
##   (syntax/css/ids/domain-rng · rig-audit · color-atlas · biome-profiles · render-audit
##   1010 · fingerprint 50/50). NOT DEPLOYED. v1.5.2 remains LIVE.
##   FINAL-REVIEW ARTIFACT: a full all-Earth-assets sweep zip was sent to Nick — PAGINATED at
##   readable size: 14 fauna pages (fauna-p00..13, all 631 at 48/page, ~144px cells) + 9 flora
##   pages (flora-p00..08, all 334 at 40/page) + earthrigs/earthswarm/earthflora/procswarm/
##   procflora/vistas + the playable build. Regenerate a page:
##   `PAGE=<n> node tools/proofsheet.js tools/sheets/fauna-all.js tools/uisheets/fauna-p<nn>.png`
##   (fauna-all.js/flora-all.js paginate via the PAGE env var). Other sheets:
##   `node tools/proofsheet.js tools/sheets/<name>.js tools/uisheets/<name>.png`.
##   RESUME PLAN: (1) fold Nick's final-sweep notes (last art corrections). (2) The one
##   remaining art batch = DEEPER VISTA-PAINTER work (coral-shallows reef treatment;
##   bioluminescent/ember RIM light + contrast for jungle/abyssal/ash fauna visibility;
##   stronger contact shadows/occlusion) + procedural within-clade variation + a couple
##   flora polish items (cedar/juniper organic, barrel-cactus form) — all render-only, see
##   BATCH 5 "REMAINING". (3) THEN the STANDARD PRE-SHIP PASS (testing / bug / exploit /
##   optimization battery). (4) THEN PHASE 8 (copy de-dash sweep, full QA, 6k beta, deploy
##   v1.6) — ships on Nick's word. The art batches A-G + V1-2 + S1-7 + passover batches
##   1-3 are all DONE (see BATCH 1-5 blocks below for the full per-item record).
## ⚠ DOC-SYNC (pinned): the per-system docs are updated for the v1.6 systems (ART_DIRECTION,
##   DETERMINISM, ECONOMY_LOOT_CRAFTING affix fix, SAVE_SYSTEM). Remaining light sync as new
##   art passes land; keep ART_DIRECTION current as the art source of truth.
##
## ═══ v1.6 BUILD IN PROGRESS (2026-07-20, Nick: "proceed with the entire 1.6
##   build, except for phase 8" + procedural RE-PIN authorized "yes, re-pin now").
##   Doing A-G; Phase 8 (deploy) held for the standard test/bug/exploit/optimize
##   pass before shipping. PROGRESS:
##   ✅ A. AFFIX SAVE-CLAMP BUG fixed — load hardening (main.js load path) now clamps
##      each affix to its own def.hi (contact/land hi:12), not a flat 5. Save writes
##      ea raw; roundtrip preserves >5 values. Validate 50/50, smoke+systems green.
##   ✅ B. P0 WRONG-CLASS FIXES — all 10 keyword collisions fixed in _earthArt
##      (tang->fish, spider monkey->primate, barnacle->sessile+cone rig, elk\b,
##      swallow\b/swallowtail->insect, crow\b, rhino!beetle, widow->arachnid,
##      vervet->primate, periwinkle->snail, crown-of-thorns->sessile). 631 fauna
##      all classify; 132 sentinels pass.
##   ✅ C. VALIDATION GATE — tools/rig-audit.js (class->rig sentinel table +
##      completeness) wired into validate.js; FAILS build on wrong binding.
##   ✅ D. MISSING FAUNA RIGS — _rigGastropod (foot+coiled/conch/limpet/slug shell+
##      eyestalks) · _rigCeph (octopus/squid/cuttlefish/nautilus-shell split, replaces
##      the legacy G.ceph path) · coral architectures in _rigSessile (brain/staghorn/
##      table/fan/bubble) · cat sub-rigs in _rigMammal feline (heavy/speed/mountain/lynx
##      + xlong/bob tails + lynx ear-tufts) · cetacean heads in _rigMarine (sperm square
##      head, beluga/pilot melon, orca tall dorsal). BUGFIX: gated plan-based shelled/
##      tent/crys body add-ons on !G.rig (were double-drawing on rigged species).
##      NEW BATTERY GATES: tools/render-audit.js (renders all 660 Earth species, catches
##      throws the procedural fingerprint misses) wired into validate.js. Proof:
##      tools/uisheets/earthrigs.png (sent to Nick). Cats = weak row, per-species polish in G.
##   ✅ E. P.hue AUDIT + COLOR_ATLAS. ★ AUDIT RESULT: P.hue is RENDER-ONLY — every
##      reader is rendering (surfaceColor/gasPalette/_hdDeckScene/sprite); NOTHING
##      generative (planetSpecies/realmBiome/classifyRealm/climateBand/planetDescriptor)
##      reads it. => the WHOLE Phase-4 color rework is FINGERPRINT-SAFE (FREE, no re-pin)
##      as long as color resolves at RENDER time and planetParams' RNG stream is left
##      untouched. Only re-pin in the build stays the procedural art rebuild (G).
##      BUILT: COLOR_ATLAS as pure top-level resolvers (main.js after getPlanetSprite):
##      resolveBodyPalette(P,starCol,biome) / resolveVistaTint(level) / resolveMapDot(
##      P,starCol,habitable,rarityHex) + CA_BODY/CA_CLASSRING tables + _caGasCloud (gas
##      from cloud chemistry, not H2) + _caHslHex/_caTintToward. Physical color != theme;
##      rarity only touches the map-dot glow. HEXES ARE PHYSICALLY-GROUNDED DEFAULTS —
##      swap in Nick's authored atlas (upload 0c0c685a §6-16) on art review; callers
##      unchanged. Gate: tools/coloratlas-check.js (purity + determinism, wired into
##      validate). Live-render WIRING (map-dot/vista/portrait) rides with F+G.
##   ✅ F. BIOME PROFILE REGISTRY — BIOME_PROFILES (main.js after COLOR_ATLAS): one
##      profile per live BIOME_SETS biome (43) = {sig(AUTHORED atlas §1 hex), native
##      fauna families, native flora families, hazard, weather}; gas giants list only
##      floaters (jelly/ceph). + biomeProfile(k) + colorDNAFor(P,biomeK,starCol) tying
##      atlas palette to biome sig + native families. Gate: tools/biomeprofile-check.js
##      (coverage: every biome has a profile; sigs hex; families are real rig/form keys).
##   ✅ G(flora) — per-species differentiation in _earthFlora + _hdPlantBare: tree tforms
##      (willow weep / baobab swollen trunk / acacia flat-top / broad) · redwood columnar
##      conifer · flower fforms (sunflower disc / orchid asymmetric / lavender spike /
##      lotus lily / daisy) · cattail brown seed-head · aloe/agave rosette · spanish-moss
##      drape · reindeer-lichen branch · duckweed mat. render-audit now covers flora too
##      (1010 species clean). Proof: uisheets/earthflora.png (sent).
##   ✅ G(fauna cats) — feline sharpen: deeper chest, thicker legs, full lion mane,
##      distinct heavy/speed/mountain/lynx. Proof: uisheets/earthrigs.png (sent).
##   ✅ G(vista ecosystem) — _hdVistaEco(g,W,H,hz,opts,seed), called from hdVista before
##      the vignette, driven by BIOME_PROFILES[opts.wb] (the biome key hdVista already
##      gets): draws the biome's native FLORA (_hdPlantBare) + FAUNA (hdBeastBare) as
##      dark rig-silhouettes in fg/mid/bg tiers = same rigs as the cards → cross-view
##      coherence; + atmosphere fx by weather/hazard (mist/ash/ember/steam/acid halo/
##      salt shimmer/abyssal light shafts). Defensively try/caught. RENDER-ONLY (fp 50/50).
##      Proof: uisheets/vistas.png (sent). FOLLOW-UP (small): cut the repeated river motif
##      in hdVista's water section; wire colorDNAFor into the layer palettes (currently
##      HD_PALS-driven); add more fauna prominence.
##   ⚠ AUDIT FINDING (recorded in DETERMINISM.md): the 50-probe fingerprint pins
##      hdGenesFor (the VISUAL-GENE contract), NOT drawn pixels — so procedural DRAWING
##      changes (hdBeastBare) are RENDER-ONLY = fingerprint-safe. A re-pin is needed ONLY
##      if the procedural rebuild changes hdGenesFor's gene output/upstream gen. => G4 may
##      NOT need a re-pin at all if kept in the drawing layer (prefer that; re-pin only the
##      speciesPortrait key if gene-layer coherence fields are genuinely required).
##   ⏳ G REMAINING (ONE piece): PROCEDURAL COHERENCE REBUILD (non-Earth silhouettes:
##      construction orders + compat rules + one-dominant-effect + rarity->complexity).
##      Prefer render-only (drawing layer) = no re-pin; do the single-key speciesPortrait
##      re-pin ceremony ONLY if gene fields are needed (never regen baseline just to pass).
## BATTERY now: syntax/css/ids/domain-rng + rig-audit + color-atlas + biome-profiles +
##   render-audit(1010) + fingerprint 50/50, all green. New gates wired into validate.js.

## ➡ ART SPEC LIVES IN `ART_DIRECTION.md` (repo root) — the consolidated master art
##   direction (all 8 Nick uploads + every decision this session). READ IT FIRST for
##   anything art/biome/vista/color. The detailed art blocks lower in THIS roadmap are
##   now superseded by that file (kept for history; prune on v1.6 deploy).
## ➡ SYSTEM DESIGN DOCS (repo root, 2026-07-20 — the per-system SOURCE OF TRUTH; edit
##   these to drive changes, review them for full-system audits; each has a STATUS
##   "matches code as of" marker so doc-vs-game drift is visible):
##   UNIVERSE: WORLD_GENERATION.md · BIOME_ATLAS.md · ART_DIRECTION.md
##   LIFE: SPECIES_AND_GENOME.md · RARITY_AND_GRADES.md
##   GAMEPLAY: CAPTURE_AND_BIOSPHERE.md · COMBAT_AND_CONQUEST.md · PROGRESSION.md ·
##     ECONOMY_LOOT_CRAFTING.md · QUESTS_AND_CHAPTERS.md · BREEDING_AND_SHARING.md
##   INFRASTRUCTURE: DETERMINISM.md · SAVE_SYSTEM.md · UI_PRESENTATION.md
##   META: ROADMAP.md (this) · celestial-frontier-codebase-reference.md (code map)
## ⚠ KNOWN BUG (found via the 2026-07-20 system-doc review, NOT yet fixed — awaiting
##   Nick's word): AFFIX SAVE CLAMP. Load hardening (main.js ~L10171) clamps every
##   affix value to clamp(num(a.v),0,5), but AFFIX_DEFS `contact` & `land` roll integers
##   lo:4→hi:12. So a legit contact/land affix >5 is silently CUT TO 5 on save→reload
##   (data loss). FIX: raise the load-clamp ceiling to 12 (or per-def hi) — pct affixes
##   (yield/strike/scut/heal, 0.10-0.35) are unaffected. Recorded in ECONOMY_LOOT_CRAFTING.md §7.
## STATE: v1.5.2 LIVE. v1.6 in the working tree, NOT deployed. Battery-green (smoke
##   319/0, systems 19/0, balance PASS, FINGERPRINT 50/50 — art is NOT fingerprinted).
##   DONE this session: 15 Earth-fauna rigs + family-distinct heads · flora growth-form
##   rebuild + plant-stat · BIOME_ATLAS.md · full proof-sheet set (fauna/flora/vistas)
##   · classifier collision hardening. All _earthName/_earthFlora-gated → zero re-pin.
## DECISIONS LOCKED: Earth fauna = FULL per-species · Earth flora = FULL per-species ·
##   Procedural (fauna+flora) = curated systematic + biome-inherited (RE-PIN gated) ·
##   Phase 4 (biome/color/vista) IS in v1.6 · everything hangs off the BIOME PROFILE.
## NO v1.6 BETA YET — beta6k-*/tester*-*.json on disk are v1.5.2 (Jul 19); v1.6 beta
##   is Phase 8, still ahead. ONLY HARD GATE LEFT = Nick's procedural RE-PIN go-ahead.
## BUILD ORDER (full detail in ART_DIRECTION.md §10): (1) P0 wrong-class fixes +
##   validation gate → (2) missing fauna rigs (gastropod/coral-architectures/ceph-split/
##   cat-subrigs/cetacean-heads) → (3) COLOR_ATLAS + P.hue audit → (4) Biome Profiles →
##   (5) Earth fauna everything ‖ Earth flora per-species ‖ vista ecosystem ‖ procedural
##   [re-pin] → (6) Phase 8 deploy. START = P0 fixes (cheap, safe, unblocks fauna).
## ▶ TOP OF NEXT SESSION — DO IN THIS ORDER (all fingerprint-safe unless noted):
##   A. FIX AFFIX SAVE-CLAMP BUG (~L10171: clamp ceiling 5→12). validate → 50/50.
##   B. P0 WRONG-CLASS FIXES (10 collisions, see RESUME OPTIONS #1 below) + re-run
##      rig-audit.js + classify-audit.js → confirm 0 real collisions → validate.
##   C. VALIDATION GATE: promote rig-audit.js to a battery check (class→allowed-rig,
##      FAIL build on wrong binding); wire into validate.js or its own tools/ script.
##   D. MISSING FAUNA RIGS: gastropod · coral colony architectures · cephalopod split
##      · cat sub-rigs · cetacean head/dorsal differences. Proof-sheet each.
##   E. COLOR_ATLAS module (Cosmic Color Atlas → resolveBodyPalette/VistaTint/MapDot)
##      + AUDIT: is P.hue render-only (free) or seeds gen (re-pin)? Decides Phase-4 cost.
##   F. BIOME PROFILE registry (colorDNA + native flora/fauna families + procedural
##      pools + niches per biome) — the connective tissue for vistas + procedural.
##   G. THEN parallel: Earth fauna EVERYTHING (per-species, class-by-class, proof each) ‖
##      Earth flora FULL per-species (~20 flora rig families + botanical fixes, ART_DIRECTION §5)
##      ‖ vista ecosystem integration (reuse rigs, color all layers, cut river motif) ‖
##      procedural curated rebuild ⚠NEEDS NICK'S RE-PIN GO-AHEAD.
##   H. Phase 8: copy/de-dash + full QA battery + 6k beta + deploy v1.6 (when art locked).
##   NEEDS FROM NICK: (1) go on A+B (or just "go"), (2) procedural RE-PIN yes/no/later,
##   (3) "lock art → Phase 8" call when ready. NO v1.6 beta run yet.
## RESUME OPTIONS — HISTORICAL (superseded by ART_DIRECTION.md §10; kept for detail):
##   1. P0 WRONG-CLASS FIXES (verified real collisions, ~1hr, fingerprint-safe):
##      swallowtail→swallow(bird) [swallow\b + add insect] · rhino beetle→rhino
##      [guard !beetle] · crown-of-thorns→crow(bird) [\bcrow\b + sessile-star] ·
##      spider monkey→spider [guard !monkey] · whelk→elk [\belk\b] · black widow→
##      mammal [add widow arachnid] · blue tang→mammal [add \btang\b fish] · vervet
##      →mammal [add primate] · periwinkle→mammal [add gastropod] · barnacle→crust
##      [route sessile cone]. (Angelfish claim is WRONG — mine has no lure.)
##   2. VALIDATION GATE: promote rig-audit.js to a permanent battery check
##      (class→allowed-rig table; FAIL build on wrong binding). Kills this bug class.
##   3. MISSING RIGS: gastropod (foot+coiled shell+tentacles, no legs) · coral colony
##      architectures (brain/staghorn/table/fan/bubble) · cephalopod split (squid vs
##      cuttlefish vs nautilus-shell) · cat sub-rigs (heavy/speed/mountain/lynx) ·
##      cetacean head/dorsal differences (orca fin/sperm square head/beluga no-dorsal).
##   4. EARTH "everything" marathon: species-trait dials class-by-class (review's
##      mandatory-3-traits table is the checklist), proof-sheet each class.
##   5. Presentation polish: context shadows (fly/swim/sessile) + scale cue + light
##      material separation (edge/roughness by class).
##   6. ⚠ (F) PROCEDURAL upgrade — NEEDS NICK'S RE-PIN GO-AHEAD (procedural art IS the
##      fingerprint). Review's construction hierarchy + "≤25% same rig / 6 silhouette
##      families" = the acceptance test. proc fauna=proof-13, proc flora=flora-procedural.
##   7. (E) fungi bracket/coral/puffball + microbe colony forms — ART-SAFE.
##   8. Phase 4 (far-ring/Biome Atlas + biome→color). SPEC UPGRADED 2026-07-20:
##      Nick's DETERMINISTIC COSMIC COLOR ATLAS (0c0c685a) supersedes the single-hex
##      plan in BIOME_ATLAS.md. Model = "Color DNA": planet color resolves from FIXED
##      LOOKUP TABLES keyed by physical props (star class §6, atmosphere/cloud §9,
##      surface §10, liquid §11, biosphere pigment §12, multi-hex live-biome palettes
##      §13, theme accents §16), NOT one biome hex. KEY RULES: physical color ≠ theme
##      color (2 fields) · rarity → UI/effects ONLY (never physical planet) · gas
##      giants from cloud chemistry not H2 · stars follow temperature (no green/purple
##      main-sequence) · multi-biome = coverage-weighted blend · vista tint 5-35% by
##      tier (not full multiply) · segmented map-dot. DETERMINISM = a WIN: pure table
##      lookup (no mulberry32 in color path) → deterministic by construction. BUILD as
##      a COLOR_ATLAS module (resolveBodyPalette/resolveVistaTint/resolveMapDot);
##      follow the doc's migration plan (P1-2 cheap: 43 keys + palette records; P4-5
##      bigger: body classes + coverage blend). ⚠ AUDIT FIRST: is P.hue render-only
##      (→fingerprint-safe) or does it seed gen (→re-pin)? BIOME_ATLAS.md = content
##      source of truth; Color Atlas = color-resolution source of truth.
##   9. Phase 8 (copy/de-dash + QA + 6k beta + deploy v1.6) once art is locked.
## ★★★ UNIFIED BIOME-DRIVEN ECOSYSTEM (2026-07-20, Nick folds PHASE 4 INTO THIS BUILD
##   + 3 new docs: Procedural_Organism_Integration, Flora_Review, Biome_Vista_Integration).
##   DECISIONS LOCKED: EARTH FLORA = FULL PER-SPECIES (like Earth fauna); PROCEDURAL
##   (fauna+flora) = growth/body families + hero + BIOME-INHERITED palette/physics
##   (curated ecosystem, NOT random part-mixer). Phase 4 (color/biome/vista) is IN v1.6.
##   THE UNIFYING ARCHITECTURE — everything hangs off BIOME. Build a BIOME PROFILE
##   registry: per biome {colorDNA(§color-atlas), nativeFloraFamilies, nativeFaunaFamilies,
##   proceduralPools, niches, weatherStates, hazards}. Then:
##     • COLOR_ATLAS (deterministic lookup) feeds map-dot + vista(all layers: sky/
##       atmosphere/terrain/water/flora/accent/hazard, NOT just sky) + portrait.
##     • VISTAS compose from the profile: 2-4 flora masses + 1-3 fauna silhouettes +
##       0-2 procedural cues, in fg/mid/bg scale tiers — REUSING the card rigs
##       (hdBeastBare fauna + _hdPlantBare flora) as tiny silhouettes = cross-view
##       coherence. Cut the repeated river/path motif; add biome-specific fg anchors +
##       atmosphere fx (marsh mist, salt shimmer, ash, steam, acid halo, abyssal beams).
##     • PROCEDURAL gen starts from the profile (planet→biome→chemistry→niche→family→
##       anomaly), inherits biome palette+physics; more flora families (arboreal/shrub/
##       vertical/mat/buoyant/hazard) + fauna archetypes; anomaly sparse. NO trees/walkers
##       on gas giants (floating/sail/gasbag only). Flora full per-species review fixes:
##       willow droop, redwood columnar, baobab swollen trunk, acacia flat-top, sunflower
##       disc, orchid asymmetric, lavender spikes, corn stalk+ear, aloe rosette, cattail
##       brown head, duckweed floating mat, spanish moss draped, reindeer lichen branching
##       + ~20 flora rig families; harvest-part visible; stat as secondary layer.
##   DETERMINISM MAP: color-atlas(render-only, pending P.hue audit)=SAFE · Earth flora
##   per-species(name-gated)=SAFE · vista integration(render)=SAFE · PROCEDURAL rebuild
##   (art IS fingerprint)=RE-PIN (Nick-authorized). BUILD ORDER: COLOR_ATLAS → BIOME
##   PROFILES → [Earth flora per-species ‖ vista ecosystem ‖ procedural(re-pin)].
## ┌─ KEY CODE MAP (v1.6 ART — line #s drift, function names are stable; these notes
## │  STAY in the roadmap until v1.6 is built+deployed, then prune. Nick's convention.)
## │  ALL fauna art flows: speciesPortrait(g) → hdGenesFor(g) → hdBeastBare(G,seed).
## │  CLASSIFIERS (keyword→rig+dials, art-only, gated on the organism NAME):
## │    • _earthArt(name)         ~L4378  — fauna. Returns {rig, msub/rsub/ssub/asub/
## │        cshape/ashape/sshape/fshape/mshape, orn, face, hump, mane, beak, tailB,
## │        legLen, neckLen, gills, sea, frill, base/base2/pat colors, plan…}. First
## │        matching keyword branch wins — ORDER MATTERS; use \b word-boundaries to
## │        stop substring collisions (praying→ray, wombat→bat, lemur→emu, etc.).
## │    • hdGenesFor(g)           ~L4451  — merges _earthArt(g._earthName) into genome
## │        at ~L4506 `if(g._earthName){…Object.assign(R,rec)…}` (THE Earth gate).
## │    • _earthFlora(name)       ~L5740  — flora → {form, fruit, flower, pad, pitcher}.
## │  RIG DISPATCH (silhouette builders): hdBeastBare ~L5243; the `if(G.rig==='…')`
## │    chain at ~L5268-5281 routes to the 15 rig fns (each returns {hp,hips,shoulders,
## │    feetMax,noEye}):
## │      _rigBird ~L4551 · _rigSerpent ~L4641 · _rigAmphibian ~L4667 · _rigTurtle
## │      ~L4701 · _rigReptile ~L4720 · _rigMammal ~L4761 (head/ornament block inside
## │      ~L4820) · _rigJelly ~L4889 · _rigPrimate ~L4908 · _rigArachnid ~L4935 ·
## │      _rigCrust ~L4966 · _rigSessile ~L5006 · _rigInsect ~L5065 · _rigMarine ~L5127
## │      · _rigFish ~L5171. Un-rigged fall through to the OLD plan-based body (ceph/
## │      snail-shell/bat-winged/procedural bead-chain) — that path is the FINGERPRINT.
## │  FLORA art: _hdPlantBare(seed,sp) ~L5488 dispatches on sp.form (15 forms);
## │    hdPortraitFlora ~L5763 injects _earthFlora + plant-stat accent at ~L5779.
## │  AUDIT/PROOF TOOLS (scratchpad, run vs probe-build.html __PROBE_HOOK__):
## │    classify-audit.js (per-name plan check) · rig-audit.js (rig collisions) ·
## │    shot-cat.js "Name,Name,…" LABEL out.png (Earth fauna sheet) · shot-flora.js
## │    (flora) · shot-proc.js N out.png (procedural aliens) · shot-bestiary.js N
## │    (paginated 631 bestiary). Output → tools/uisheets/.
## │  GOTCHA: never write \b in a node -e JS string literal (JS turns it into 0x08
## │    BACKSPACE = silently dead regex). Edit regexes with the Edit tool, or convert
## │    0x08→"\b" via an explicit char-code map ([...s].map(c=>c.charCodeAt(0)===8?…)).
## └─ Determinism proof each edit: `node tools/validate.js` must stay FINGERPRINT 50/50
##    (art isn't fingerprinted, so Earth-gated art edits never move it).
##
## ★★★ v1.6 UNIFIED ART-DIRECTION BIBLE (2026-07-20, Nick's 6-file package —
## THE standing spec for ALL organism art; supersedes the pages-1-12 review):
##   Uploads: 01_UNIFIED_ART_DIRECTION_BIBLE, 02_EARTH_FAUNA_A_TO_M,
##   03_EARTH_FAUNA_N_TO_Z, 04_EARTH_FLORA_A_TO_Z, 05_PROCEDURAL_GENERATION,
##   06_HEAD_AND_FACE_ART_DIRECTION_SUPPLEMENT (heads = #1 identity anchor).
##   Per-entry format: {group, base rig, required anatomy, species cues, avoid,
##   correction priority}. Counts: 1046 fauna, 569 flora, 758 procedural traits.
##   LAW: 2-second silhouette test · Earth = real anatomy first (may simplify, may
##   NOT remove limb count / defining head-bill-fin-shell-leaf / posture / sessile-
##   vs-mobile) · one dominant visual idea · anatomy ≠ VFX (glow can't replace an
##   organ) · effect intensity scales with rarity · plant stat is a SECONDARY layer
##   (pose/accent/aura, never replaces botany).
## THE 30 REQUIRED FAUNA RIGS → ALL BUILT (✅ 2026-07-20, was a 9-rig start):
##   _rigFish (bony/shark/ray/seahorse/puffer/bill/sunfish/angler/flat) · _rigInsect ·
##   _rigBird (raptor/owl/wader/waterfowl/songbird/ratite/penguin/parrot) · _rigAmphibian
##   (frog/salamander/axolotl) · _rigSerpent (smooth snake/eel, hood/viper/rattle) ·
##   _rigCrust · _rigArachnid · _rigPrimate (ape/monkey/lemur) · _rigMarine (whale/
##   dolphin/seal/sirenian) · _rigJelly · _rigSessile (star/urchin/cucumber/sponge/
##   squirt/coral/anemone/bivalve) · _rigMammal (feline/canid/ungulate[cervid antler/
##   moose palmate/bovid horn/ram spiral/equine mane/camel hump]/bear/rodent/mustelid/
##   rabbit/marsupial/hopper) · _rigReptile (lizard/croc-scutes/chameleon) · _rigTurtle
##   (shell+flippers/legs) · ceph (octopus) · shelled (snail) · winged (bat).
##   Elephant/rhino/giraffe keep their existing distinct renders (giraffe ossicones =
##   a polish item: move it onto _rigMammal for the long neck + ossicone knobs).
## FLORA (currently ONE recursive tree in _hdPlantBare) → NEW _earthFlora(name)
##   classifier + botanical rigs: HERB(108+45+23+14 aromatic/flowering/root/fruiting)
##   · TREE(86+39+11 fruit/woody/tropical) · GRASS-reed-cane(51) · SHRUB(32) ·
##   CONIFER(28) · CACTUS-succulent(18) · SEAWEED-alga(16) · FIELD-CROP(16) ·
##   PALM(10) · VINE-climber(10+8) · FERN-sporophyte(9) · MOSS-groundcover(6) ·
##   TRAP-plant(4 venus flytrap etc). + PLANT-STAT accents (Vitality warm-abundant /
##   Ferocity thorns-heat-red / Resilience bark-earthy / Agility slender-teal /
##   Insight intricate-blue-violet) as a secondary UI/aura layer only.
## FUNGI + MICROBE (Nick's package under-specs these vs the fauna/flora depth — I
##   FLAGGED as a gap to add): need mushroom rigs (cap+stipe / bracket / coral /
##   puffball) + microbe colony forms (film/chain/cluster/flagellate).
## PROCEDURAL (non-Earth) coherence — construction orders + 58 compatibility rules +
##   one-dominant-effect + rarity→complexity. ⚠ DETERMINISM: procedural (un-named)
##   art IS the 50-probe fingerprint. Earth-name & flora-name rigs are GATED → NO
##   re-pin. But improving PROCEDURAL alien art WILL change the fingerprint → needs a
##   Nick-authorized baseline RE-PIN round (like the v16 roster re-pin) + proof that
##   same-seed→same-output still holds cross-device. Phased: Earth first (free),
##   procedural second (re-pin, flagged to Nick).
## BUILD ORDER + STATUS (update every step — Nick's standing ask 2026-07-20):
##   ✅ (A) MAMMAL sub-rigs — _rigMammal(msub: feline/canid/ungulate/bear/rodent/
##      mustelid/rabbit/marsupial/hopper), smooth bodies, 182 mammals rigged. Proof
##      rig-mammal2.png.
##   ✅ (B) REPTILE + BIVALVE — _rigReptile(rsub: lizard/croc/chameleon, sprawled
##      low body + splayed limbs + long tail; croc snout+scutes; frill) + sessile
##      'bivalve' (two valves, scallop ribs). Proof rig-reptile.png.
##   ✅ (B2) SERPENT + AMPHIBIAN + TURTLE — _rigSerpent (SMOOTH tapering wave, not
##      beads; cobra hood/viper head/rattle/tongue; eels too) · _rigAmphibian (frog
##      squat + folded hind legs + eyes-on-top; salamander/newt/olm elongate; axolotl
##      gills) · _rigTurtle (dome shell + beaked head + flippers[sea]/legs, no horn).
##   ✅ FULL PER-TYPE PROOF SET (Nick asked): proof-01..13 (carnivores/herbivores/
##      birds/reptiles/amphibians/fish/marine/insects/arachnids-crust/molluscs/
##      sessile/primates/PROCEDURAL). shot-proc.js renders un-named aliens.
##   ✅ (D) FLORA — _earthFlora(name) classifier + _hdPlantBare form dispatch (tree/
##      palm/conifer/shrub/herb/flower/grass/cactus/fern/vine/seaweed/crop/root/moss/
##      trap) + PLANT-STAT accent layer (Vitality/Ferocity/Resilience/Agility/Insight
##      via accent color + motes, botany stays dominant). Gated on _earthName in
##      hdPortraitFlora → art-only, fingerprint-safe. Proof rig-flora1.png. NOTE:
##      fungi ALREADY render as a mushroom stand (hdPortraitFungi) — decent baseline.
##   ✅ (C+HEADS) HEAD/FACE SUPPLEMENT (06_HEAD_AND_FACE) — mammal head system DONE:
##      family skull/muzzle/ears + ORNAMENT antler(branched)/palmate(moose)/horn/
##      spiral(ram)/ossicone(okapi) + camel humps(1 dromedary/2 bactrian)/bison hump/
##      equine mane. Proof rig-mammal3.png. Bird beaks, fish snouts/rostra/cephalofoil,
##      reptile/croc snouts, amphibian gills already carry head cues from their rigs.
##      REMAINING head polish: giraffe ossicones (needs giraffe on _rigMammal), elk>deer
##      antler sweep, per-species small-mammal muzzle cues (aardvark/pangolin/anteater).
##   ⬜ (E) fungi bracket/coral/puffball variants + microbe colony forms.
##   ⬜ (F) PROCEDURAL coherence [re-pin, Nick-authorized]: construction orders + 58
##      compat rules + head_archetype field + one-dominant-effect + rarity→complexity.
##   Proof-sheet + audit (classify-audit/rig-audit + shot-cat/shot-flora in scratchpad)
##   each step. Fingerprint 50/50 throughout (art is not fingerprinted).

## ▶ v1.6 BUILD PROGRESS (2026-07-19, in the working tree, NOT yet deployed —
## v1.6 ships as one batch at Phase 8 after full QA + 6k beta):
## ✅ Phase 1 — Item cards + click-to-equip (tap any hold item → painterly stat
##    card w/ effects + Equip button; #itemcard modal; 6 smoke checks; shot OK).
## ✅ Phase 2 — Capture backbone: TAME_ODDS[15] table replaces the flat formula;
##    Fauna→Tame / Flora+Fungi→Scavenge / Microbe→Sample (3 verbs, all 4 kingdoms
##    already in the genome model); depth x0.9/ring; gear (contact) up to +25pp.
## ✅ Phase 3 (roster half) — _EARTH_NAMES expanded to the FULL authored roster:
##    fauna 631 · flora 334 · fungi 27 · microbe 22 (pack 563 + Part I + gap adds,
##    generated from the CSV). SINGLE-KEY baseline re-pin: only planetDescriptor
##    changed (Earth names), all 49 others byte-identical, noted
##    note_planetDescriptor_repin_v16_bestiary (Nick-authorized full roster).
## ✅ Phase 3 (art half — THE EARTH BESTIARY): _earthArt(name) KEYWORD CLASSIFIER →
##    art-dial overrides in hdGenesFor, GATED on g._earthName (probed un-named
##    creatures untouched → fingerprint 50/50, NO re-pin, ever).
##  ★ 2026-07-20 STRUCTURAL REBUILD (Nick's art-direction review: one quadruped
##    template stretched across all classes). Now 8 DEDICATED BASE RIGS in
##    hdBeastBare, each a class-true white-silhouette builder returning
##    {hp,hips,shoulders,feetMax,noEye}, dispatched on G.rig, gated so procedural
##    fauna/probes take the exact old path:
##      _rigBird (2 legs, beak by kind: hook/long/spoon/curve/wide/huge/needle/owl;
##        folded wing; tail fan/long/fork; upright owl w/ facial disc+ear-tufts;
##        penguin upright w/ flippers; wader/ratite/songbird/raptor/waterfowl)
##      _rigFish (fusiform, vertical caudal, dorsal/pectoral fins, NO neck; shapes:
##        shark/hammer/ray/seahorse/puffer/bill/sunfish/angler/flat/sturgeon)
##      _rigMarine (cetacean flippers+horizontal fluke+dorsal, pinniped fore+hind
##        flippers, sirenian paddle, narwhal/walrus tusks — never hind legs)
##      _rigInsect (3 tagmata, 6 legs, antennae; butterfly/moth/dragonfly/beetle/
##        bee/mantis/stick/generic; airbug wings; hornbug)
##      _rigArachnid (8 legs, 2 segments, no antennae; scorpion stinger-tail+pincers)
##      _rigCrust (crab carapace+claws+eye-stalks; lobster/shrimp segmented+tail fan)
##      _rigSessile (anemone crown / branching coral / spiny urchin / soft cucumber /
##        vase sponge-squirt / 5-arm star — noEye, no legs)
##      _rigPrimate (upright torso, long hanging arms+hands, primate head, monkey/
##        lemur curling tail, ape tailless)
##    Existing rigs kept: ceph (octopus mantle+8 arms), serpent (snake/eel), jelly,
##    reptile/amphibian (low-quad + frog plan 13), shelled (snail/turtle), mammal
##    quadruped (default, lion MANE, tiger/zebra stripes, elephant trunk+tusks).
##    KEYWORD HARDENING: word-boundaries kill substring collisions — \bant\b \bbee\b
##    \bemu\b \bowl\b \bray\b \btick\b \bmite\b fish\b \bgoose\b + guards (fish branch
##    excludes jelly/cuttle/silver/cray/starfish; elephant excludes seal). NOTE: an
##    earlier node edit wrote literal 0x08 BACKSPACE chars where \b was intended —
##    fixed via char-code map (never write \b through a JS string literal in node -e).
##    Audit tooling in scratchpad: classify-audit.js + rig-audit.js run _earthArt
##    over all 631, flag mismatches — ONLY 6 false positives remain (Eagle Ray etc).
##    Proofs: tools/uisheets/rig-*.png + bestiary-p00..13.png (full 631, 14 pages).
##    REMAINING POLISH: kiwi dumpier · proper jelly rig (dome+tentacles) · kangaroo
##    hopper · dedicated sprawled-reptile rig · per-species signature traits.
## ✅ Phase 5 — BIOSPHERE YIELD: bioX Map (pseed→[used,epoch], save field bx);
##    bioPool = abundance (3 + species*1.2 + seeded wobble, clamp 3-16); every
##    Tame/Scavenge/Sample spends one attempt; dry = "Worked Out" toast; recovery
##    on a new COSMIC_EPOCH (roster also re-rolls per epoch → evolved life);
##    attempts-left shown on the life fold. Save/load/reset wired.
## ✅ Phase 7 — CHAMPION CODES: encodeCreature(entry,true) carries xp; decode
##    re-applies level (clamped to L9) + marks out.exhibit (duel-only, never
##    owned/bred — enforced by the CFB challenger flow); shareChampion() +
##    🏆 Champion button on the reveal card for leveled creatures.
## ✅ Phase 6 — AFFIX/LOOT CORE: equipAff{slot→{k,v,forId}} (save field ea);
##    AFFIX_DEFS (yield/strike/scut/contact/land/heal) + rollAffix(seed,tier)
##    seeded, stronger at depth; FIRST FAUCET = conquest spoils (40% roll imbues
##    a worn piece, tied to that exact item); folded into _equipBonus; rendered
##    on the item card (✦, "spoils of conquest"). Save/load/reset wired.
## ⬜ Phases 4/8 REMAIN — the big ones: FAR-RING/Biome Atlas + biome→color (525
##    biomes vocab + deterministic assignment + derive planet hue from biome) ·
##    AFFIX/LOOT CORE (per-instance gear-stat model → renders on the item card) ·
##    Phase 3 ART (name-matched silhouettes, proof-sheet iteration w/ Nick) ·
##    Phase 8 copy/de-dash + full QA + 6k beta + deploy. Battery-green
##    (fingerprint 50/50, smoke 319, systems 19, balance PASS).


## ★★★ v1.6 "THE LIVING FRONTIER" — LOCKED DESIGN (2026-07-19, Nick +
## Claude, off the uploaded 5-file Generation Data Pack v2.1.0) ★★★
## SHIP-GATE FIRST: v1.5.2c "The Titan Hunt" (GAME_VERSION bumped in source;
## titan/cradle/capture/story release notes added; retitled block) is staged
## — rebuild+validate after the running 6k beta clears, then deploy on Nick's
## word to CLOSE OUT 1.5. Then v1.6 begins.
##
## THE DATA PACK (uploads: 01_EARTH 3236 rows, 02_NON_EARTH 1575, 03_PROCEDURAL
## 816, 04_SUPPORT 117, 05_GUIDE.md). RULING: CURATE + VOCABULARY, never embed
## wholesale (5,600 rows would break the single-file seeded-procedural
## architecture + phone budget).
##   · EARTH = AUTHORED. Full unique roster: 563 animals + 310 plants (distinct
##     species — Black/Brown/Polar/Sloth/Spectacled Bear are 5 separate catches;
##     2,269 fauna rows = biome PLACEMENTS of the 563, kept as biome-membership).
##     ALL of it spawns at home, organized into ~10-13 biome-family REGIONS
##     (Forest/Grassland/Desert/Polar/Marine/Freshwater/Mountain/Coastal/Cave/
##     Island/Shrubland), Uncommon-capped, real names, starter-normalized stats,
##     per-expedition RANDOMNESS (replay Earth → different Compendium slice).
##   · NON-EARTH = PROCEDURAL VOCABULARY. Lift the 315 biome IDENTITIES (element/
##     theme, tier, planet-type, substrate/atmo/temp/gravity/light, hazards) into
##     the seeded generator → far-ring worlds gain distinct star/biome/galaxy
##     identity beyond ring 1. 758 procedural traits + 58 compatibility rules →
##     richer, more coherent creatures. Elemental biomes (Fire→Emberfield etc.)
##     feed the Titan Hunt's 9 elements. DO NOT embed the 1,260 spawn-pool rows —
##     the engine already generates them.
##   · THE 93 EARTH BIOMES do DOUBLE DUTY (Nick's compromise): signature families
##     at HOME; the full 93 are the biome pool for FAR-RING habitable/Earth-like
##     worlds (Earth-like creatures out there, + a seeded EVOLUTION twist so a
##     Deep-Field Earth-like shows a Rare/mutated cousin, bridging authored Earth
##     life into the procedural rarity ladder).
##
## RARITY / TIERS / SUCCESS (Nick approved 2026-07-19):
##   · LADDER: our live 15-tier GRADE_TIERS is AUTHORITATIVE (Common..Omnipotent).
##     Pack's 7 map in by POSITION not name: Epic→Exotic, pack-Anomalous(their
##     top)→our summit. We have far more than enough tiers; add none.
##   · CAPS BY RING: existing ringGrade stands (Legendary near → Mythic home galaxy
##     → summit Deep Field). Pack difficulty tiers 1-5 ≙ our rings 1-5.
##   · SUCCESS TABLE: REPLACE the flat formula (0.78-0.07*tier, same for both) with
##     CLAUDE'S per-attempt table (pack was the sanity-ref, NOT literal — pack
##     numbers assume unlimited tries; Biosphere Yield makes tries FINITE, so we
##     recalibrated UP to per-VISIT feel). TAME/attempt: Common 60 · Uncommon 45 ·
##     Rare 27 · Exotic 19 · Legendary 13 · Anomalous 9 · Mythic 4 · Celestial+ 2→<1.
##     SCAVENGE ≈ 1.5-2× tame (cap 95). SAMPLE (microbes) its own gentle curve.
##     TARGET per abundant visit (~8 attempts): Common near-lock · Rare likely ·
##     Legendary+ a chase · summit = post-game tail.
##   · TWO FIXES THAT MATTER MORE THAN THE TABLE: (1) GEAR SCALING — contact gear
##     is +0.5% today (noise); make it up to ~+25% by tier = the real
##     success-per-attempt lever. (2) DEPTH PENALTY — mild x0.9/ring beyond home,
##     NOT the pack's cliff (Deep-Field Common ~40%, not 8%).
##
## THE FOUR KINGDOMS (Nick 2026-07-19): Fauna→🐾 Tame (fighters/breeders) ·
## Flora→🌿 Scavenge (medicine/food/poison) · Fungi→🌿 Scavenge (flora-family,
## distinct flavor) · Microbes→🔬 SAMPLE (NOT combatants — research/crafting
## inputs to the Fabricator + Compendium breadth; the life of primitive/
## "microbial" abundance-tier worlds). Verb label follows the kingdom over one
## capture flow.
##
## BIOSPHERE YIELD: attempts = the finite world resource (every Tame/Scavenge/
## Sample spends one, hit or miss; dry = worked out, move on). Pool by abundance:
## barren 0 (mine instead) · microbial ~3 · flora ~6 · complex/Earth-like ~10-12,
## x seeded wobble. Success-per-attempt = the table + gear (never the pool).
## RECOVERY + EVOLUTION ride the EXISTING epoch clock (evolveGenome/per-epoch
## reroll): revisit after an epoch → pool regrows + roster evolved (new hybrids/
## descendants). One clock → a LIVING Compendium. Emergent replay for free.
## COMPENDIUM = POST-GAME TROPHY atop the Titan Hunt/Prime Codex arc; "100%" is a
## DEFINED MILESTONE (every world-type's signature life, or a prestige) over the
## endless living count — "you cannot finish the infinite, only master it."
##
## EARTH ROSTER ADDITIONS (Claude's gap review, Nick liked — compile in pack
## format w/ rarity + biome placements): AUSTRALIA/MONOTREMES Kangaroo·Koala·
## Platypus·Echidna·Wombat·Tasmanian Devil·Wallaby·Sugar Glider · ICONIC
## REPTILES/AMPHIB Komodo Dragon·Chameleon·Gila Monster·Axolotl·Frilled Lizard ·
## PRIMATES Lemur·Gibbon·Mandrill·Marmoset · RATITES Emu·Cassowary·Kiwi · MISC
## Sun Bear·Dingo·Cockatoo·Firefly·Vampire Bat·Pronghorn · LIVING FOSSILS (great
## high-rarity catches) Coelacanth·Nautilus·Tardigrade·Horseshoe Crab · NEW
## EARTH FUNGI KINGDOM (~10, incl. a poison) Chanterelle·Morel·Truffle·Oyster·
## Lion's Mane·Fly Agaric·Puffball·Death Cap · EARTH MICROBES for Sample
## Tardigrade·Plankton·Diatom·Cyanobacteria·Amoeba · PLANTS Venus Flytrap·
## Eucalyptus·Poppy·Oak·Redwood·Cedar. (~40-50 adds; pack is otherwise complete.)
##
## BUILD ORDER: (1) ITEM TOOLTIP CARDS + CLICK-TO-EQUIP (Nick's ask: cargo items
## have no stats/hover card today; crafted+found get a painterly card like
## planets/stars showing effects+slot+rarity; click an equippable → auto-slots to
## its body socket. This is the loot foundation — the card is where per-instance
## affixes render). (2) CAPTURE BACKBONE (success table + gear fix + depth mod +
## the 4-kingdom verbs). (3) EARTH STARTER ZONE (full roster + additions + fungi/
## microbes + biome regions + zone traversal — survey-card lists regions, map is a
## later upgrade). (4) FAR-RING CONTENT (biome vocabulary, habitable-world Earth-
## like rosters + evolution twist, trait enrichment). (5) BIOSPHERE YIELD (finite
## attempts + epoch recovery). (6) AFFIX/LOOT CORE (per-instance gear stats on the
## item card). (7) CHAMPION CODES (clamped, exhibit-only showcase codes).
## ★ THE ARTWORK ANSWER (Nick's key question 2026-07-19: how do KNOWN Earth
## animals fit the HD engine?): WE DON'T DRAW THEM — we describe each as a
## GENOME RECIPE and let speciesPortrait/hdGenesFor PAINT it, so it's in-style
## by construction (one brush = the HD Engine Law holds automatically). Today
## the Cradle layers real NAMES onto RANDOM genomes (a "Wolf" may not look
## wolf-ish); v1.6 FLIPS it: named animal → authored/derived genome whose traits
## (body plan, head, covering, color, size + 2-3 defining TELLS) make the engine
## render a recognizable painterly version. Scales because animals cluster into
## ~40-60 body ARCHETYPES (all bears/cats/canids/ungulates share a base) ×
## parametric variation, NOT 563 drawings — and Part II's taxonomy IS the recipe
## language. REAL WORK: extend the engine's render vocabulary for distinct
## SILHOUETTES (bipedal-hopper=kangaroo, duck-bill=platypus, trunk=elephant,
## long-neck=giraffe, shell, antlers…) — pays double (better Earth animals AND
## richer aliens). Painterly interpretation, not photoreal; lean on NAME + biome
## + signature feature; the 5 bears share a base and differ by color/size (honest
## — real bears are similar). PROOF-SHEET every Earth animal (proofsheet.js),
## read the PNGs, iterate recipes till they read right. This is its own v1.6
## phase: "THE EARTH BESTIARY" (engine-vocabulary extension + genome recipes),
## sequenced with/after the Earth Starter Zone build.
##
## THE 2ND UPLOAD (618a8f13 Additional Organisms + Procedural Vocabulary):
##   PART I ORGANISMS — ALL NEW (cross-checked vs the 563/310, zero dupes). ADOPT:
##   ~38 fauna (Pronghorn·Springbok·Bongo·Duiker·Gerenuk·Nilgai·Tahr·Serow·Colugo·
##   Tree Shrew·Aye-Aye·Proboscis Monkey·Quoll·Harpy Eagle·Kookaburra·Hoatzin·
##   Quetzal·Weaverbird·Screamer·Kakapo·Ocean Sunfish·Remora·Archerfish·Knifefish·
##   Icefish·Mudminnow·Flying Gurnard·Sea Squirt·Salp·Pyrosome·Lancelet·Sea Spider·
##   Fairy Shrimp·Tadpole Shrimp·Springtail·Dobsonfly·Scorpionfly·Thrips) · ~18
##   flora (Dragon Fruit·Kiwi Fruit·Watermelon·Mangosteen·Rhubarb·Breadnut·Cotton·
##   Flax·Hemp·Tobacco·Canola·Licorice·Anise·Star Anise·Fenugreek·Joshua Tree·Tea
##   Tree·Camphor Tree) · ~25 FUNGI (new kingdom) · ~22 MICROBES (new). APPLY the
##   doc's NORMALIZATION (merge Cat/Cattle/Chicken/Grape/etc.; KEEP Grizzly Bear
##   SEPARATE from Brown Bear — Nick's earlier Q answered YES). Net Earth roster
##   after both uploads: ~600 animals + ~330 plants + ~35 fungi + ~22 microbes.
##   PART II PROCEDURAL VOCABULARY (28 fields) — this IS the expanded genome
##   language for BOTH the artwork recipes AND richer aliens. TRIAGE:
##     ADOPT (core vocab + systems): body plan/shape/limbs/skeleton, head/mouth/
##     feeding, respiration/circulatory/metabolism, covering/pattern/color-behavior,
##     locomotion, defensive+offensive traits (→ duel abilities), senses, behavior/
##     communication/temperament (→ tameability), reproduction/lifespan/size,
##     habitat, ELEMENTAL AFFINITY (→ the 9 titans/biome elements), tameability
##     factors + scavenge/harvest factors (→ Biosphere Yield tuning + crafting),
##     flora structure/parts/defenses/growth, fungi+microbe traits, environmental
##     variables (atmo/gravity/temp/light/liquid/weather → biome identity+vista+
##     hazards), RESOURCE DROPS (→ creatures drop materials to the Fabricator/loot),
##     and §28 PROCEDURAL VALIDATION RULES (coherence backbone — Earth fauna can't
##     get crystalline skeleton/void travel/magma-swim etc.; aquatic needs gills;
##     parasites need hosts; biome caps override; Earth ≤ Uncommon — this is WHAT
##     KEEPS EARTH ANIMALS RECOGNIZABLE and aliens coherent; extends the pack's 58
##     rules). FLAVOR-ONLY (descriptor on summit/void/prismatic, not built as
##     mechanics now): anomalous abilities (Teleport/Time/Reality), exotic diets
##     (Emotion/Light Feeder), telepathy/hive-mind, void/magical metabolism, exotic
##     locomotion (Teleport/Phase). DEFER/EXCLUDE: Sapient/Proto-Sapient (conflicts
##     with the civilization system), RPG-gating (Required Quest/Reputation/Skill),
##     Disease Chance/Spoilage (no such systems yet).
## THE 3RD UPLOAD (904f763c Additional Biomes) — ADOPT as biome VOCABULARY (same
## curate rule: lift identities+metadata, generator paints/assigns; don't embed
## spawn rows). BIGGEST WIN = the NEW MIDDLE TIER "EARTH-LIKE EXOPLANET" (~60-70:
## tidally-locked Twilight-Belt Forest/Terminator Savanna, star-spectrum Red-Dwarf
## Blackleaf Forest/Infrared Jungle/UV Shield Forest, planet-scale Global Riverland/
## Fog Desert/Supercontinent Interior, gravity Low-Grav Giant Forest/High-Grav Dwarf
## Forest, atmosphere High-Oxygen Megaforest/Sulfur-Tolerant Wetland, geological
## Crater Oasis/Lava-Tube Biosphere/Caldera Rainforest, moon Subsurface Moon Ocean/
## Ice-Moon Vent). These ARE the "far-ring Earth-like worlds" — biologically
## plausible, recognizable ecological roles, Rare-or-lower, carry the EARTH ROSTER
## with star/gravity-driven color+anatomy shifts + the seeded EVOLUTION twist.
## ALSO ADOPT the extra EXOTIC non-Earth (physical/cosmic Rogue-Planet Sea/Neutron-
## Star Crustlands/Photon Sea/Aurora Ocean → tie to our stellar systems; exotic-
## matter Ferrofluid Marsh/Diamond-Rain Layer/Metallic-Hydrogen Ocean → real
## exoplanet science; TECH Quantum-Computer Caverns/Server-Reef → Machine element;
## LIGHT/PRISM Laser Forest/UV Reef/Living-Rainbow River → Prism titan; VOID Void
## Bloom/Silence Abyss/Vacuum Garden → Void titan; LIVING-WORLD Living Continent/
## Sapient Ocean/Planetary Eye → a RARE deep-frontier special world-type). Nick
## already EXCLUDED Mind/Memory/Emotion + Dimensional/Reality biomes (too abstract/
## un-renderable — good). ADOPT the biome_scope FIELD (Earth · Earth-Like Exoplanet
## · Alien Habitable · Extreme Alien · Artificial · Anomalous · Spiritual · Cosmic)
## — it drives ring/type assignment. TARGET ~525-550 biomes (93 Earth + 60-70
## Earth-like + 370-390 exotic).
## ★ THE 2ND ART LIFT — "THE BIOME ATLAS": biomes/vistas paint the SAME way as
## creatures (hdVista assembles from biome metadata: substrate/atmo/light/liquid/
## weather/palette → NOT hand-drawn). The new biomes need vista-painter vocabulary
## extension (red-dwarf → dark foliage, low-grav → tall spindly, diamond-rain →
## crystalline, void → null-light) + proof-sheets. Parallels The Earth Bestiary:
## creatures = genome→speciesPortrait; biomes = metadata→hdVista. Both are the big
## v1.6 art work; both "describe→engine paints→proof-sheet," never external art.
## PROTOTYPE FIRST (Nick agreed): author genome recipes for a handful (Wolf·
## Kangaroo·Elephant·Great White) + a couple new-biome vistas, proof-sheet them,
## and confirm the engine renders recognizably BEFORE committing to ~600 animals +
## ~525 biomes. De-risks the whole art question.
## ★ BIOME ASSIGNMENT + COLOR COHERENCE (Nick's Q 2026-07-19: how do planets get
## biomes, which HZ worlds go non-Earth-like, do colors reflect biome?). PIPELINE
## (all seeded/deterministic, cached per planet seed): seed → planetParams(type,
## gravity/size, atmosphere) → system STAR CLASS → climateBand(HZ position: hot/
## temperate/cold) → ring/region → FILTER the ~525 biomes by each biome's metadata
## (compatible_planet_types + temp/gravity/atmo/light BANDS + difficulty_tier +
## biome_scope) → SEEDED PICK. Same planet = same biome for every player. WHICH HZ
## WORLDS GO NON-EARTH-LIKE: terran/ocean IN the HZ near home around a SUN-LIKE
## star → Earth-like; the SAME world around a RED DWARF / tidally-locked / high-
## gravity / odd-atmosphere system → EARTH-LIKE EXOPLANET (star+gravity+air pick
## it); wrong type in HZ → sparse/microbial/Alien Habitable; out of HZ or lava/gas/
## ice/venus → exotic/elemental regardless; DEPTH shifts the eligible pool Earth-
## like→Alien Habitable→Extreme Alien→Void/Prismatic, gated by ring rarity cap.
## ONE-VS-MANY: rich complex-life worlds get a FEW biome REGIONS (like Earth);
## barren/simple worlds get ONE dominant biome — scales with Biosphere Yield
## abundance. COLOR (the v1.3 card-drives-picture law EXTENDED, this is a real
## change — today P.hue is RANDOM r()*360): the BIOME drives the palette. Each
## biome carries a theme/palette → the planet's ORBITAL sprite hue derives from its
## PRIMARY biome (read a world's nature from its map color before landing) → the
## surface vista uses the SAME palette → creatures rim-lit by the scene (creature-
## belonging law). Orbital sprite → vista → creature light = one biome-derived
## palette, map to ground. WORK: derive display hue from assigned biome in
## planetParams/getPlanetSprite (still seeded), + the Biome Atlas vista vocabulary.
## PROCESS: standard rollout each release (battery→copy+DE-DASH sweep→guide→layout
## gate→6k beta acted-on→team panels→deploy). v1.6 copy law: remove the em-dash
## game-wide.

## ▶▶▶ NEXT SESSION — v1.6 (RESUME HERE; updated 2026-07-19 session
## close, Nick: "get ready for v1.6") ◀◀◀
##
## STATE AT CLOSE: v1.5.2 LIVE at build 8279eb6. The day ran long past
## the overnight round: after the 6k beta (all clean), Nick playtested
## live and drove a big wave of fixes + two major systems, each battery-
## green (fingerprint 50/50, smoke 305, layout gate) and deployed on his
## word. Deploy chain today: 61024a9 → 0caabe7 → 62c8930 → 07142d0
## (emoji/virga) → 5cca2ab (capture) → 61a9420/53eb46c/9b99a74 (training
## + field-bug fixes) → 6164d3f (Codex stage 1) → 9f110e7 (titan hunt
## stage 2) → a9958e7 (stage 3) → 8279eb6 (story). LIVE = 8279eb6.
##
## WHAT SHIPPED TODAY (all live): THE BLOSSOM + TAME/SCAVENGE capture
## design (survey reveals, capture catalogues, odds fall w/ rarity +
## gear); THE CRADLE — Earth's real catchable roster (real names,
## Uncommon-clamped); PRIME CODEX → ELEMENTAL TITAN HUNT (stages 1-3:
## 9 named titans seeded by world seed/shared, region-banded cumulative,
## resonance deep-link, element theming, balance pass — titan ~870-940
## vs champion ceiling ~751); the "MASTERING THE UNIVERSE" story rewrite
## (retired the Pathfinder/beacon lore everywhere player-visible); plus
## Nick's playtest fixes (Shipyard always on rail, training click-
## through no-timer, craft button affordability re-render, Records/
## Statistics move, ✕ corner+z-order laws, hpwrap click-eater, vista
## ghost-click guard, mining drill-quest counts pulls).
##
## OPENING MOVES next session:
## (1) NICK'S PENDING JUDGMENT CALLS (need his device/feel): TITAN
##     BALANCE — playtest the fights; ~1.15x mult (871 near / 941 far
##     vs ~751 champion ceiling) is a FIRST PASS, confirm win rate
##     (a deep-sim combat leg can measure it if he wants data). D1
##     pacing feel (Jump p50 37). L6 XP ceiling (1/500 reach it).
## (2) THE EARTH WORK Nick flagged ("stuff with Earth after Stage 3")
##     — awaiting his direction on what.
## (3) MOBILE JOURNEY LEG for tools/uilayout.js (still queued, task
##     #21): real touch gameplay at phone viewports via CDP
##     Input.dispatchTouchEvent — the harness gap that let his field
##     bugs slip (synthetic clicks bypass the training pointer gate).
## (4) Then v1.6 proper (THE v1.6 SLATE below).
##
## ★ PRIME CODEX → ELEMENTAL SIGNATURE GUARDIANS (Nick's endgame
## redesign, 2026-07-19; detailed spec — building next):
##   THE LOOP: land to discover whether a signature is here (unknown
##   from orbit); the signature is GUARDED by a unique, NAMED, very
##   strong elemental creature — the SAME guardian for every player of
##   that element. Send your bred/tamed animals to defeat it; the kill
##   claims the signature. Guardian may not always be present at the
##   site. Collect all nine to complete the Prime Codex.
##   THE 9 ELEMENTS + TIER STAGGER (basics near → obscure far):
##     Tier 1 (home/Neighborhood/home galaxy): Earth, Wind, Fire,
##       Water  (Nick listed earth/wind/fire/air/water — air≈wind,
##       reconcile to 4 basics + water, or keep Air distinct = 5 near)
##     Tier 2 (Local Cluster / Near Field): Electric, Poison
##     Tier 3 (Deep Field / Outer Dark / Frontier): Void, Prism
##   Guardians are element-themed, named, forced-apex genomes; found in
##   multiple galaxies/clusters but the higher elements only spawn
##   farther out. Ties the whole game: land→mine/tame/heal→craft/
##   upgrade→breed stronger→hunt the guardian→claim→reach further.
##   BONES THAT EXIST (makes this a reframe, not net-new): SIGS[9]
##   (stone/ocean/flame/sky/life/mind/star/void/prism, 14881),
##   claimSignature (14961), primeCheckSpecies/World claim-on-conquest
##   (14979), guardianFor named Apex Guardians (3563), REGIONS frontier
##   expansion by primeCount (14906), relic blueprints per signature.
##   ★ NICK'S RULING (2026-07-19): REPLACE with pure elements — no
##   beacon narrative; the elements ARE the arc. LOCKED MAPPING (keep
##   internal SIG ids so saves + relic item.sig refs survive; re-theme
##   display only): stone→EARTH · ocean→WATER · flame→FIRE · sky→AIR ·
##   star→WIND (stellar wind) · life→POISON · mind→ELECTRIC · void→VOID
##   · prism→PRISM. TIER STAGGER: near = Earth/Fire/Air/Wind/Water;
##   mid = Electric/Poison; far = Void/Prism. Each bound to a NAMED
##   elemental titan (forced-apex, app-layer, deterministic) you defeat
##   to claim. BUILD STAGES: (1) LIVE 6164d3f — elemental re-theme +
##   named titans + copy. (2) BUILT — THE TITAN HUNT: titanFor/
##   titanGuardian at APP layer (near apexNative; NOT the Genome domain
##   module — they need primeFill/SIGS/st/regionAt), seeded by WORLD
##   seed (shared, NEVER epoch: epoch is per-player), region-banded
##   cumulative (_TITAN_MINREG), 8.5% presence roll. apexNative returns
##   the titan (world conquerable without native fauna); conquest win →
##   claimSignature(elem). Old type-based claim (primeCheckWorld/
##   Species + survey auto-claim) NEUTERED to no-ops — titans are the
##   sole path; saved primeFill carries live claims. Resonance reading
##   in renderPrime (_sigResonance: world-KIND + distance, no tier
##   labels). Titan power ~1280 vs normal apex 641. 6 smoke checks
##   (305 PASS). (3) NEXT: balance vs bred teams · resonance deep-link
##   to nearest titan world · per-element titan art · 6k beta.
##   (4) v1.6: renewable rematch loop.
##   ⚠ LESSON: titan fns first put in the Genome DOMAIN module —
##   unexported + blind to app state; apexNative's try/catch HID the
##   ReferenceError and smoke passed VACUOUSLY. Moved to app layer.
##   Watch domain/app scope for any fn needing primeFill/st/SIGS.
##   Save: primeFill keys unchanged (ids kept), NO migration; relics
##   keep sig ids.

## THE v1.6 SLATE (Nick-approved direction; DESIGN WITH HIM first —
## the full spec block sits below at 'THE v1.6 SLATE'):
##  · BIOSPHERE YIELD — finite tame/scavenge per living world (Nick's
##    idea 2026-07-19; "no more spam-clicking one planet"). TWO AXES:
##    ATTEMPTS = the finite world resource (every try, hit or miss,
##    spends one; dry = worked out, move on); SUCCESS-PER-ATTEMPT =
##    gear/craft (the existing contact/strike bonuses raise odds, NEVER
##    the pool). TIER by BIOSPHERE ABUNDANCE, not size/random: Life
##    level (barren→microbial→flora→complex) × roster size × rarity,
##    + a small seeded per-world wobble so worlds feel individual.
##    RECOVERY: the pool regrows on revisit after the biosphere
##    recovers (hook the cosmic-epoch clock) — worlds aren't
##    permanently locked; come-back-geared-up is a real loop.
##    EMERGENT: finite attempts + random catch order ⇒ a fresh
##    expedition yields a different Compendium (roster still seeded/
##    shared) — Nick's "replay Earth, get a different animal" for free.
##    ★ NICK'S RULING (2026-07-19): completable-WITH-INVESTMENT, and
##    the Compendium is the POST-GAME TROPHY — you finish the main arc
##    (Titan Hunt / Prime Codex) then KEEP PLAYING to fill it out. It's
##    the endgame that never runs dry. THIS ALIGNS WITH THE EPOCH/'YEAR'
##    CLOCK and is powered by it: the clock (a) REGROWS biospheres
##    (refreshes attempt pools → revisiting works) AND (b) EVOLVES them
##    (planetSpecies already re-rolls rosters per epoch → returned worlds
##    hold further-evolved descendants + new hybrids). One clock feeds
##    recovery + endless novelty → a LIVING Compendium that keeps
##    growing new catches as the universe ages. Compendium = post-game
##    trophy; Prime Codex = the main game w/ an ending.
##    ⚠ NUANCE TO DECIDE LATER: raw count is technically infinite (new
##    life keeps appearing), so '100%' can't be a literal number. Frame
##    the trophy as a DEFINED MILESTONE (e.g. every world-type's
##    signature life catalogued, or a prestige achievement) that IS
##    completable, sitting atop the endless living count — a real
##    'you did it' without pretending the infinite is finishable
##    (matches the ending line: 'you cannot finish the infinite, only
##    master it').
##    MINING ALREADY DOES THIS (reserveFor finite by tier + burst cap) —
##    this makes mine/tame/scavenge one honest idea: every world is a
##    finite resource you work and leave.
##  · THE AFFIX/LOOT CORE (S6) — per-instance gear, one faucet first
##    (conquest spoils), app-layer seeded, never in share codes. The
##    month-scale retention chase.
##  · FAR-RING CONTENT — stars/biomes/galaxy identity beyond ring 1
##    (the progression audit's flat spots R3).
##  · CHAMPION CODES — leveled-creature showcase/challenger codes
##    (clamped import, exhibit-only; Nick: "really cool").
##  · RETENTION LAW — AI-authored deterministic content DROPS on a
##    cadence (events/beacon revival as seasonal vehicles); measured
##    by staleness-horizon/novelty instruments.
##  · CREATURE-BELONGING PASS (Nick's artistic law, 2026-07-19: "the
##    animal pictured as what it is on the card, in their native
##    environment — never pasted"): (a) contact shadows under every
##    stamped creature (the seating law); (b) scene palette tints the
##    creature's rim light; (c) behavior-true posture (grazers heads-
##    down, ambushers in flora); (d) reveal-card backdrops painted by
##    the SAME biome painter as the vista — the card as a window into
##    the world. Pairs with far-ring biomes. The one-sentence law for
##    all art: everything in the frame painted by the same hand at the
##    same hour (buildings sit · virga dies in air · rivers born from
##    mist · lava born from the mountain · creatures in their light).
##  · Parked critic picks that fold in: P2 Sol first life, P5 early
##    Codex claim, P7 Legendary wall; S11 decline rules if wanted.
## STANDING PROCESS (locked today, see 'STANDARD ROLLOUT PROCESS'):
## battery → copy pass → Guide check → layout gate → 6k beta (fail-
## fast) with feedback ACTED ON → team panels (artwork/engineering/UI/
## bug+feedback/QA/audio) → deploy. Release notes = technical outlines.
## v1.6 COPY STYLE (Nick, 2026-07-19): REMOVE THE EM-DASH game-wide —
## the whole game leans on '—' as its voice; Nick wants it gone
## ('humans don't use the long dash'). Replace by job: comma (soft
## pause/aside), period (hard break), colon (definition/list intro),
## semicolon (linked clauses). A full de-dash sweep across Guide,
## cards, toasts, release notes; fold into the copy-pass. (v1.5.2
## story rewrite kept dashes per Nick's 'leave them for now'.)
## STORY THEME (locked): MASTERING THE UNIVERSE — the Prime Codex is
## the master survey; fell each element's titan to master it; master
## all nine to master the forces of the universe and open the
## Celestial Frontier. 'You cannot finish the infinite, only master
## it.' Master = master-of-a-craft, never tyrant. Title stays
## 'Celestial Frontier' (no 'Master of the Universe' subtitle — reads
## He-Man, fights the serene tone). Applied to intro/subtitle/guide/
## ending/meta/relics in v1.5.2c (build TBD).

## ★★★ v1.5.2 "THE SHIPYARD + THE QUEST SYSTEM" IS LIVE ★★★
## (2026-07-19 overnight, build 61024a9, deployed per Nick's overnight
## charter; version.json v:1.5.2 verified live.)
## THE OVERNIGHT RECORD (Nick asleep; full director's report artifact +
## exec summary delivered separately):
##  · HAMMER3 certified the frozen v1.5.2b build first: chaos 300/300,
##    ui 150/150, medium clean (yard exercised 549×) — both harness
##    driver fixes proven; zero errors anywhere.
##  · BUILT (commits c115458, b5d1651, 61024a9): mining BURST CAP
##    (press = burst ≤ MINE_BURST 10, the upgrade knob) · Ascent →
##    CHAPTERS surface rename (achievement 'The Last Chapter';
##    cinematic 'CHAPTER COMPLETE'; history untouched) · PROGRESSIVE
##    CHAINS (trades spine gates weeklies; Sol tour side income;
##    ring-locked links never revealed) · ACCEPT-TO-ACTIVATE (chacc
##    field, cap 3, auto-accept first link at training end, S1
##    already-proven chk() proofs excluding home ground) · CHARTER
##    GEAR static phase (earpiece/headlamp/magboots/meteor/fieldlegs;
##    grants fire no 'crafted' event) · DEEP-LINK NUDGES (toast go→
##    charters, › affordance) · simrun learned it all (S8) + variety-
##    by-ring telemetry · release notes + Guide synced · smoke checks
##    recreated for the new law (295 PASS).
##  · 5,000-TESTER ROUND: ALL LEGS CLEAN (0 errors/deaths/softlocks;
##    ui 500/500, chaos 500/500). Fun p50: fast 6.59, medium 6.09,
##    deep 5.89. Charters 7-8/run. Variety opens by ring.
##  · FIX BATCH (61024a9): chAccept tutDone guard; DEPTH_TAX sixth
##    rung 2.5 (autonomous, straightforward-fix authority).
##  · PROGRESSION AUDIT (planets/stars, Nick's order): economy +
##    rarity + depth tax OPEN UP (formulas verified); FLAT: star-class
##    variety, world-type/biome pools (ring 1 exhausts them), defender
##    strength/win-odds (copy overstates), galaxy content, post-Deep-
##    Field plateau. All design calls → exec summary R1-R4.
##  · 50,000-TESTER ROUND in flight at close (ui 2000 → chaos 1500 →
##    medium 3000 → deep 1500 → fast 42000 in 6 chunks; results in
##    tools/tester50k-*.json as legs land; 'TESTER50K DONE' at end).
## ⚠ DECISIONS AWAITING NICK (exec summary, morning): S10 pacing
##    (burst compressed Jump p50 65→37, IG 0.3%→27% of deep runs,
##    medium/deep fun dipped ~0.2-0.3 — count chapter goals in bursts?
##    retune c1-mine? accept the faster ladder?) · R1 defender region
##    scaling · R3 far-ring star/biome content (v1.6) · R4 tier-scaled
##    conquest XP (w/ parked P8) · weekly-accept UX (slate of 3 shared
##    with starters) · fun-dip watch.

## ▶▶ MORNING SESSION 2026-07-19 — NICK APPROVED ALL FIVE DECISIONS
## ("Go ahead and work on all of these, approved"):
##  · D1 SHIPPED: chapter mining goals count PRESSES (mined event carries
##    press flag from mineToggle; ascEvent counts presses; goal text
##    'Run the drills N times'). Charters/hold still count real loads.
##  · D2 SHIPPED: GUARDIANS ride the region law — the audit overstated
##    the gap: ordinary apex natives scaled +14%/region since v1.4
##    (apexNative _mult, honored in battleStats 11722, stripped from
##    codes 11776); only the guardian branch skipped it. Now it doesn't.
##  · D3 SHIPPED: conquest XP = (20|60) + world tier; P8 discovery XP —
##    every genuinely new species teaches the standing Field Scout +2
##    (both catalogue paths). Thresholds stay 6·l² (panel consensus).
##  · D5/P3 SHIPPED: ARRIVAL PAYS — first arrival in a new system logs
##    '🧭 First Arrival' + 2 ☄ (sysSeen set, save sysv, cap 900,
##    Sol/home excluded, training/loading silent). Sprinter counterweight.
##  · D4 → THE v1.6 SLATE (below), per the approved recommendation.
##
## ▶▶ DAY-2 AFTERNOON RECORD (2026-07-19, Nick present; three deploys):
##  · HPWRAP POINTER-EAT (live-blocking, Nick's field find): the full-
##    width HP row wrapper silently ate real clicks on the Charters
##    button + answered hovers with the HP tooltip (topbar z-20 over
##    chbtn z-9; synthetic clicks bypassed it, which is how every test
##    missed it). Fixed (wrapper inert, pill interactive) + hotfix
##    deployed 0caabe7. New RAIL-REACHABILITY law in the gate.
##  · THE LAYOUT GATE BORN (tools/uilayout.js): headless-Edge CDP, 9
##    viewports, ~520 checks (✕ corner law glyph-accurate, z-order,
##    rail reachability cold/tray/search, side-scroll, clipped text),
##    fresh expedition per viewport, proof sheets. Found the yard ✕
##    appended at the bottom of the scroll; Nick found the sheet's the
##    same way. Both seated FIRST now. jsdom performs no layout — this
##    gate exists because all three of his mobile bugs were invisible
##    to 10,000+ clean jsdom runs.
##  · MOBILE TRIO: coarse ✕ 28px visual + invisible hit padding; rail
##    panels z-22 over topbar chips; training card dodges its own
##    spotlighted target.
##  · RECORDS RESTRUCTURE (Nick): Records button to the standing slot;
##    Shipyard takes the lower slot on appearing; Statistics ledger
##    moved from the sheet to Records (+First Arrivals row).
##  · FIRST COPY GATE RUN: 6 SHOUTING-caps demoted, 'sock'→'slot',
##    hunt board→charter board, Guide gained tier-XP/scout-XP/First-
##    Arrival currency. Verdict: voice human, Guide current.
##  · FIRST ART REVIEW (vision on tools/sheets/artreview.png): molten
##    worlds drew a WATER river w/ sun glints ('rivers of rock' matched
##    the water regex) — fixed; day river de-glared. Venus pillar
##    seating = repro pending. EMOJI INVENTORY: 1 wrong (⚜ Forbidden
##    Science), 3 questionable — awaiting Nick.
##  · RELEASE NOTES: all 19 entries → technical outlines (standing
##    format). TEAM PIPELINE recorded (incl. audio team).
##  · Deploys: 0caabe7 (hotfix) → 62c8930 (fix wave). Beta 6k running
##    at close; chaos 749/750 + ui 500/500 already clean.
##
## ★ STANDARD ROLLOUT PROCESS (Nick, 2026-07-19 — every release):
##   1. Build + battery (validate/smoke/systems/balance).
##   2. COPY PASS: full story/UI/description sweep — grammar, noun-true
##      capitalization, no random mid-sentence caps for emphasis, human
##      register (how Nick & Claude talk, not AI-ese). Headline caps
##      (release-note lead-ins, kickers) are designed style, kept.
##   3. GUIDE CURRENCY CHECK: every topic verified against mechanics.
##   4. BETA ROUND (two-tier, fail-fast leg order chaos → ui → medium
##      → deep → veteran → fast): STANDARD ~6,000 (chaos 750 + ui 500
##      + medium 1,000 + deep 1,000 + veteran 250 + fast 2,500) every
##      release; MILESTONE ~20,000 (chaos 2,000 + veteran 1,000, same
##      shape) for x.0-scale reworks. Feedback → modifications → only
##      then deploy. (Statistics: behavior means pin by ~1k runs/leg;
##      volume only buys rare-crash hunting, chaos does that best.)
##      THE FEEDBACK IS ACTED ON, not filed (Nick): every beta round's
##      findings feed the same release — recommendations weighed, bugs
##      and exploits fixed, optimizations applied, then the round
##      re-verifies the fixes before the deploy goes out.
##   5. ✕ CORNER LAW: closes sit cleanly in the corner, never bleeding
##      over pictures/UI; touch targets grow by invisible hit-padding.
##   6. LAYOUT GATE (tools/uilayout.js): headless-Edge, 9 viewports,
##      ~520 checks (✕ law, z-order, rail reachability cold/after-tray/
##      after-search, side-scroll, clipped text) + proof sheets. Runs
##      with the battery, ON TOP of the beta count. Born 2026-07-19
##      after jsdom missed all three of Nick's mobile bugs (no layout).
##   7. TEAM REVIEW PANELS (Nick's org design, 2026-07-19): each release
##      is reviewed by the full team before final deploy — ARTWORK
##      (vista/proof-sheet vision review; composition, blending, the
##      painting law), ENGINEERING (correctness/edge/perf), UI (layout
##      gate + viewport sheets), BUG & FEEDBACK (beta-round findings
##      triage), QA (battery + exploit sweep), AUDIO (sting/fanfare
##      coverage + timing). Feedback → fixes → re-verify → live.
##      Implemented as multi-agent panels; findings land in the same
##      release. Release notes are TECHNICAL OUTLINES (category →
##      tight bullets), all entries, standing format.

## ▶▶ THE v1.6 SLATE — FAR-RING CONTENT + THE LOOT CORE (D4, approved
## direction; DESIGN WITH NICK before building — v1.6-scale):
##  · THE AFFIX WALL (S6, the core): per-instance gear, app-layer seeded
##    rolls, one loot faucet first (conquest spoils), power decoupled
##    from rarity, gear never rides share codes.
##  · FAR-RING STARS: give the flat star category distance meaning —
##    region-flavored exotic spawns (magnetar fields in the Deep?),
##    star-scale payoffs (remnant mining? beacon anchors?), so expanding
##    gains something star-wise beyond a rarity tint.
##  · FAR-ONLY WORLD CONTENT: biome/type variants that only spawn beyond
##    given regions (the pool currently exhausts in ring 1) — must stay
##    seed-deterministic per position (region derives from position, so
##    the fingerprint law can hold; audit before building).
##  · GALAXY IDENTITY: galaxyProfile feeds only art today — consider
##    letting far galaxies bias content mixes (a carbon-rich galaxy, a
##    remnant field) without touching near-ring determinism.
##  · POST-DEEP-FIELD: rarity summit at Deep Field is documented design;
##    if Outer Dark/Frontier deserve their own hook, it comes from
##    content (above), not caps.
##  · Parked critic picks that fold in naturally: P2 Sol first life,
##    P5 first Codex claim at stage 2, P7 Legendary wall.
##  · CHAMPION CODES (Nick 2026-07-19, "would be really cool" — liked):
##    a code that carries a creature's LEVEL/XP story (clamped on
##    import), summoned strictly as a CHALLENGER/EXHIBIT — never an
##    owned copy (ownership imports stay level-1; forged god-codes are
##    just a harder duel someone chose). The flex is real, the economy
##    intact. Pipeline exists (CFB-/normGenome; today xp is deliberately
##    stripped at 11793). Pairs with affix gear on the champion card.
##  · RETENTION LAW (Nick's month-two directive): content pipeline must
##    outrun grammar exhaustion — AI-authored, versioned, DETERMINISTIC
##    data drops (never generative in the client: breaks determinism +
##    share codes). Delivery vehicles: the dormant Cosmic Events +
##    Traveler's Beacon as seasonal drops; measured by the harness's
##    novelty-per-hour / staleness-horizon instruments.

## ▼▼ EXECUTED OVERNIGHT 2026-07-19 (kept for the record) ▼▼
## ▶▶▶ NEXT SESSION — v1.5.x CONTINUATION (Nick, 2026-07-19; RESUME
## HERE — everything below is Nick's documented direction) ◀◀◀
##
## STATE AT SESSION CLOSE: v1.5.1 is LIVE (build c299ac3). v1.5.2 "The
## Shipyard" + the v1.5.2b consistency pass are BUILT, COMMITTED and
## STAGED (GAME_VERSION 1.5.2, bulletin written) — deploy was pending
## the final hammer round (chaos 300 + ui 150 + medium 150 on the
## frozen build; an earlier round was invalidated by mid-edit builds
## under the workers). Suites at freeze: fingerprint 50/50, smoke
## 293/293, systems 19/19, balance PASS.
## HAMMER ROUND RESULTS AT SESSION CLOSE (recorded 2026-07-19, Nick:
## no rerun this session):
##  · chaos 300: 0/300 completed, ui 150: 38/150 — a HARNESS
##    FALSE-NEGATIVE, not a game failure: every stall was at
##    'forge: fab tab' — the ui/chaos training driver still clicked
##    the REMOVED #cargo fab-tab selector (smoke was updated for the
##    Shipyard; the driver was not; the 38 completions are the
##    skip-path slice). Zero errors, zero breaks, zero exceptions in
##    both legs. DRIVER FIXED AND COMMITTED at session end (simrun
##    forge flow now: cargobtn → #yardbench [data-craft="plate"]).
##  · medium 150: was still running at close — if tools/
##    hammer2-medium.json exists next session, read it; its bots were
##    already correct (API + updated sheet/yard actions).
## MEDIUM VERDICT + HAMMER3 (recorded 2026-07-19 ~00:30, autonomous
## batch after the hammer2 background round completed):
##  · hammer2-medium landed: 558× 'sheet: docked ship did not open the
##    Shipyard' — the SAME false-negative family, NOT a game bug: the
##    medium/deep 'sheet' action still clicked #dollship, an id REMOVED
##    by the v1.5.2b pack change (the sheet/yard bots were NOT already
##    correct, contrary to the line above). cargoTabs: 0 — the yard got
##    ZERO medium-mode coverage. Otherwise clean: 0 deaths, 0 softlocks,
##    saves 148/150 (2 = run-cap truncation), funIndex mean 6.26.
##  · DRIVER FIXED: sheet action now enters through the real door —
##    #cargobtn (gated on visibility, like a player) → yard asserts →
##    rank reclaims the sheet. Violation string renamed ('the Shipyard
##    rail button did not open the yard').
##  · STALE COPY FIXED in the staged build (v1.5.2b missed spots, all
##    player-visible): the v1.5.2 release-note bullet still said "tap
##    her where she docks beside your paperdoll" (now: the right-rail
##    Shipyard button); the Guide crafting entry still listed "the ship
##    Module docked beside the figure" (now: the 🎒 pack on your
##    shoulder); three stale source comments synced. Battery after:
##    fingerprint 50/50, smoke 293 PASS / 0 FAIL, validate all-PASS.
##  · HAMMER3 LAUNCHED on this build (chaos 300 + ui 150 + medium 150,
##    background): the FIRST round to actually exercise the 23:54
##    training-driver fix (hammer2's ui/chaos legs started before that
##    commit landed and ran the OLD driver). Results →
##    tools/hammer3-{chaos,ui,medium}.json when 'HAMMER3 DONE'.
##  · The GAME build passed everything that actually reached it:
##    fingerprint 50/50, smoke 293/293 (drives all 20 training steps
##    incl. the Shipyard forge THROUGH THE DOM), systems 19/19,
##    balance PASS, and the micro-repro proved the auto-mine loop.
## NEXT SESSION'S OPENING MOVES (Nick's close-out, 2026-07-19):
## (1) re-run the hammer with the FIXED driver (chaos 300 + ui 150 +
## medium 150 if its report is missing) on the frozen build,
## (2) apply the mining burst cap (item 0), (3) smoke + a chaos slice,
## (4) node tools/deploy.js — the v1.5.2 deploy carries Nick's
## standing instruction for this iteration. THEN the Chapters rename +
## progressive-charter work (S3 ruling below).
##
## 0. MINING BURST CAP (Nick's ruling, 2026-07-19 — apply BEFORE or AT
##    next deploy): auto-mining semantics as built — the run binds to
##    ONE world's open card; each 1.6s tick re-checks: button pressed
##    again / card closed / card switched worlds / vein dry → stop;
##    one run ever exists at a time; nothing persists across reload;
##    leaving the card kills the run on the next tick. THE GAP: parking
##    a card open AFK could drain that one world's finite reserve
##    (~10-20 min). THE CAP: one press = one BURST of up to 10 pulls
##    (~16s), then the drills stand down and want another press.
##    BURST SIZE is the future upgrade knob ("recipes to increase the
##    amount you can mine at once" — rigs/recipes extend the burst).
##    Never multi-world, never offline (the crafted Auto-Extractor
##    keeps that role, untouched).
##
## 1. PROGRESSIVE CHARTERS (Nick's quest-system law): only the quests
##    that are AVAILABLE show on the board — completing one reveals the
##    next, chains building further and further ("kind of like a
##    progressive quest system"). AUDIT the current board first: today
##    ALL starters (5 trades + the 5-stop Sol tour) listen and show at
##    once — restructure into visible CHAINS where each completion
##    unlocks the next link. Verify the whole charter flow behaves
##    progressively, not as a wall of parallel checkboxes.
## 2. ACCEPT-TO-ACTIVATE: after training the game says "more charters
##    available" — lean into that: you go to the charter board and hit
##    ACCEPT, and THAT starts the quest tracking (accumulating the
##    resources it needs). NO DECLINE for now (considered for later —
##    accept/decline as a real choice down the line). Progressing
##    through Sol requires accepting its charters and completing them.
## 3. CHARTER REWARDS BECOME GEAR (the quest-outfit path): completing a
##    charter can pay a CRAFTED ITEM instead of (or with) stardust —
##    gloves, a helmet, low-stat starter gear that nudges survival and
##    success odds. The early game outfits you through quests.
##    - EARLY = STATIC: constant, deterministic rewards at first (same
##      item for every explorer — fixed pieces from the existing
##      recipe/gear pool at low tiers).
##    - LATER = DIABLO LOOT: as you expand into the wider world, found
##      gear shifts toward a random-roll loot system ("low random
##      stats" → the full Diablo chase). DESIGN NOTE for the session:
##      random affixes must stay app-layer/seeded (share codes and the
##      fingerprint law are untouched); an affix system on gear is a
##      v1.6-scale design — scope it with Nick before building.
##
## CLAUDE'S SCENARIO REVIEW (2026-07-19, Nick asked "what did I not
## think of" — decisions to make BEFORE building the above):
## S1. PRE-EARNED PROGRESS vs ACCEPT-TO-ACTIVATE (the big one): if
##     tracking starts at accept, a player who mines 8 loads THEN
##     accepts the mining charter gets zero credit — rage fuel. But
##     silent banking contradicts the point of accepting. PROPOSAL:
##     STATE-quests (land on Mars, own a component) check world-state
##     at accept and complete instantly with an "already proven" note
##     (the veteran-trades precedent); COUNT-quests (pull 5 loads)
##     count from accept, and their text says so ("from here on").
##     Decide with Nick.
## S2. CHAIN DEADLOCK GUARD: a charter targeting a SPECIFIC world's
##     resource can strand (e.g. "5 loads from Jupiter/Saturn" if both
##     were mined out first — unlikely at ~700 pulls each, but the
##     PATTERN matters as chains grow). Law: targeted charters prefer
##     categories over single worlds, or auto-complete when the target
##     is no longer satisfiable. Same family as the _far0 lesson: a
##     chain must never REVEAL a link the player's ring can't reach.
## S3. THE ASCENT vs THE CHAINS (decision briefed to Nick 2026-07-19):
##     The Ascent = the v1.4 three-chapter MAINLINE pinned above the
##     charter list. Ch1 Off the Rock (Sol): land 2 Sol worlds · 8 ore
##     loads · 4 parts · 2 components · build ⚡ Jump Drive → opens the
##     Neighborhood. Ch2: land 3 beyond Sol · life on 2 · conquer 1 ·
##     build 📡 Array → whole galaxy. Ch3: breed a hybrid · 2 gear ·
##     20 loads · build 🌌 IG Drive → the Trail takes over. Chapter
##     goals are PARALLEL by design (concurrent activities, any order)
##     and progress BANKS across chapters (review-fix law: out-building
##     your chapter never loses work).
##     ★ NICK'S RULING (2026-07-19, session close): OPTION A — the
##     mainline stays parallel — AND it gets RENAMED "CHAPTERS" and
##     MERGED with the progressive charter work: one quest system,
##     where the Chapters are the campaign spine (parallel goals per
##     chapter, banking intact) and the charters are its progressive
##     side-chains (accept-to-activate, reveal-on-complete). Naming
##     sweep required: "The Ascent" → "Chapters" across the board copy,
##     Guide, nudges, RELEASES vocabulary ("Chapter 1 — Off the Rock"
##     already reads right); check the naming law list (Ascent isn't
##     protected; Prime/Cosmic Codex are). ascStage/asc* internals can
##     keep their names — the SURFACE renames.
##     (Superseded option B: chapter goals reveal progressively — one
##     grammar, but artificial order on concurrent work, and banking
##     would complete hidden goals invisibly.)
##     WEEKLY GATE (Nick agreed to redefine): weeklies open when the
##     FIVE-TRADE chain completes; the Sol tour is optional side
##     income and does not gate. Crisp end to the guided phase.
## S4. ACTIVE-CHARTER CAP: EverQuest journals cap active quests. 3
##     accepted at once feels right (the board shows Available /
##     Accepted / Done sections, folds per the one-fold language).
##     First trade-chain link could AUTO-accept at training's end so
##     the "more charters available" handoff stays seamless.
## S5. QUEST GEAR vs THE FABRICATOR (economy collision): if charters
##     hand out gloves, the crafted Grip Gloves lose their moment and
##     the mine→craft pacing law bends. Rule: quest gear is the WORN
##     tier — lesser "Worn/Standard-Issue" variants (reduced eff) of
##     existing pieces, so crafting stays the upgrade path and the
##     Ascent's craft gates hold. Static phase = grant EXISTING item
##     ids only (zero new machinery).
## S6. THE AFFIX WALL (biggest technical lift in the loot plan): items
##     today are FIXED defs counted by id (items Map id→qty). "Low
##     random stats" means per-INSTANCE gear — a new save shape
##     (instance list), picker/equip/effect plumbing per instance, and
##     app-layer seeded rolls (fingerprint law). Static-first is what
##     makes v1.5.x shippable; the affix system is the v1.6 core.
##     When it lands: ONE loot faucet first (conquest spoils — Diablo
##     is kill-things-get-loot), drop tables obey POWER-DECOUPLED-
##     FROM-RARITY, and gear NEVER rides share codes.
## S7. SAVE-FIELD BUDGET (G12 discipline): the whole plan needs ONE
##     new field now — `chacc` (accepted charter ids, absent-safe
##     empty). Chain availability derives from chDone. Gear instances
##     wait for v1.6. Keep it that lean.
## S8. SIM COVERAGE IN THE SAME BATCH: accept-to-activate breaks every
##     persona bot unless simrun learns to accept charters first —
##     the harness must ship WITH the feature (the lesson this session
##     taught twice: drivers and build move together).
## S9. NUDGE + DEEP LINK: nextStepGoal should point at the current
##     chain link ("Accept your next charter" when none is accepted) —
##     and the toast/nudge could DEEP-LINK: tapping it opens the
##     charter board. Toasts are passive today; a small tap-to-open
##     system serves every future nudge, not just charters.
## S10. BURST vs CHAPTER PACING (small, watch it): one 10-pull burst
##     nearly completes c1-mine (8 loads) in a single press. Ore
##     AMOUNTS still gate crafting, so pacing likely holds — but
##     re-check chapter-1 time-to-Jump-Drive in the sim after the cap
##     lands; if it collapses, chapter goals should count PRESSES
##     (bursts), not loads.
## S11. DECLINE, WHEN IT COMES: declining a weekly needs re-roll rules
##     (gone for the week? redraw from the pool?) — park until Nick
##     wants decline at all.
##
## NICK'S DEVICE-PASS WATCHLIST (carried): the two Edge crash dumps
##    (renderer died in UnrecoverableAccessibilityError — browser-side;
##    canvas aria-hidden mitigation shipped in 1.5.2b; watch whether
##    the crashes recur and whether charters-won't-open recurs with
##    them — it never reproduced in a clean build); paperdoll socket
##    feel on his iPhone; farewell-card/namebox layering on iOS; G14
##    boot time (STILL unverified since v1.3).
## WHAT SHIPPED IN THE STAGED v1.5.2 LINE (context for the resume):
##    the Shipyard screen (ship + Fabricator + Research behind the 🛠
##    rail button, categories folded), Records board (🏆: rarity ladder
##    + achievements out of the sheet), bags-only inventory with slot
##    grid + pack-grown rows (Module = worn 🎒), one fold language
##    (expand/close pills everywhere), plain stat bars, specimen verbs
##    in a grid, 20-step training (landing + forge lessons), the Sol
##    tour charters, auto-run mining (burst cap pending above), depth
##    tax on field wounds, conquest mercy law (bred-only, once per
##    mend, 25% self-gate), names-are-names label pass, ring-sprite
##    clip fix, sticky panel ✕, first-shelf auto-open Compendium.
## (Wherever the v1.5.x line ended up at deploy time, this continues it.)

## ▶▶ v1.5.1 "THE MIRROR POLISH" — BUILT, STAGED, AWAITING NICK'S
## DEPLOY + BUMP WORD (2026-07-18 late; Nick: "apply those" + uncrowd
## the iPhone + one card grammar + a more human portrait):
##  · PORTRAIT v2: human proportions, neck/joints/face-behind-visor,
##    landing pad + ringed world (proof-sheeted, anchors re-pinned)
##  · UNIFORM CARD LAW: specimen verbs on TOP; sheet left column = 4
##    critical lines + 3 folds (Statistics / Collection / Achievements
##    master fold, nested groups)
##  · P6: equip picker POPOVER beside the tapped socket; phones stack
##    doll→CARGO→stats; ship thumb unclipped
##  · P1 MERCY LAW: bred champions crawl home Critical; champion duty
##    floors at 1 HP (scrape, never grave); can't lead below 25% HP.
##    VERIFIED: deep-sim deaths 347/700 → 0/60.
##  · RELEASES 1.5.1 staged hidden; GAME_VERSION stays 1.5 until the
##    bump word. Suites: fingerprint 50/50, smoke 277/277, systems
##    19/19, balance PASS, chaos 40/40.
##  STILL PARKED FOR NICK'S v1.6 PICKS: P2 Sol first-life, P3 arrival
##  pays, P4 conquest/duel inversion, P5 first Codex claim at stage 2,
##  P7 Legendary wall, P8 discovery XP — and Nick's own musing: a
##  fuller UI uniformity sweep as v1.6.
##  FROM THE 1,000-TESTER UI PANEL (8.5/10, "ship it"; two folded, two
##  parked): PARKED — phone socket anchors nudge off the figure art
##  (helmet-over-visor, torso stack; his device pass should judge);
##  desktop sheet left-column dead zone below the folds. Adversary-only
##  stall family (chaos re-opening reveals on the finale step) recovers
##  100% — recorded, not fixed.

## ★★★ v1.5 "FRESH START" IS LIVE ★★★ (2026-07-18/19, build 0d86e32,
## deploy pre-authorized in Nick's session charter; version.json v:1.5
## verified live, all systems present in the served html.)
## EVERY WORK ORDER SHIPPED (9 commits): the WIPE (cfcc_save_v2, no
## migration, farewell card honors the old expedition's rarest find;
## grandfather machinery + drawSurface/art-tiles purged; single-key
## baseline re-pin of the constants SAVE_KEY tail, documented) · THE
## PAPERDOLL CHARACTER SCREEN (full-body painterly explorer, 9 sockets
## anchored to the body, ship docked beside, stats left, cargo/
## Fabricator/Research beneath; proof-sheeted + live screenshots) ·
## specimen cards CONDENSED (world-card fold, cx bit 4, ⟁ hook never
## folds) · QUEST NOTIFICATIONS (login+idle next-step nudge, never
## twice per goal) · CHARTERS⇄CODEX slot swap · events+beacon DORMANT
## (buttons/Guide/achievement shelf hidden, engines refuse) · THE
## PATHFINDERS' TRAIL (beacon lore + reach per Signature, NINE relic
## blueprints one-per-socket gated on claims, Legacy teased honestly) ·
## XP RETUNE (levelOf 12·l²→6·l², measured: L3 reach 3%→24%; awards
## unchanged) · training tray bug fixed with a GRACE-BEAT sweep (the
## lesson's own panel gets 1.6s on screen, then yields).
## BUGS FOUND EN ROUTE: surfSeen (Groundfall/Trailblazer + worlds-
## landed stat) frozen since 1.3.8 — fixed into _performLanding.
## PRE-SHIP REVIEW (adversarial agent, 6 confirmed findings, ALL
## fixed): grace-beat sweep; Escape closes the sheet; nudge modal guard
## + hover shield cover the new surfaces; corrupt legacy keys earn no
## eulogy; primeFill claims coerced/clamped on load.
## SUITES AT SHIP: fingerprint 50/50 byte-identical (1 documented
## re-pin), smoke 277/277, systems 19/19, balance PASS.
##
## THE 5,000-TESTER ROUND (Nick's scale-up; fast 3,600 + deep 700 +
## ui 400 + chaos 300): ZERO errors, ZERO breaks, ZERO softlocks in
## every leg; training 700/700 complete incl. 300 chaos-adversary runs;
## the new sheet exercised 46,000+ times through the real DOM clean.
## How far they get: Jump Drive p50 65 actions (deep) / 203 (short
## sessions); Array p50 394 (32% of long sessions); IG 2/700; L3 165/
## 700 at p50 411 actions; deep fun-index p50 6.23 (rancher 6.72 top).
## One loud signal: 347/700 deep deaths, 344 of them CHAMPION-DUTY
## SPIRALS (re-fighting lost conquests as self at 1 HP — part bot
## tilt, part real design gap; medicine-never-kills held at 3).
##
## ▶▶ THE CRITIC PANEL'S v1.6 SLATE (4 lenses on the packs; ranked,
## AWAITING NICK'S PICKS — nothing built post-deploy without his word):
## P1 CONQUEST MERCY PACK (optimizer #1 + backlog item d): fallen bred
##    champions return 'Critical' instead of dying + a self-champion
##    floor (first conquest loss as yourself leaves you Critical;
##    conquest can't start while Critical). Converts the 347 run-ending
##    deaths into recoverable states. NOTE 42% of dead runs had no
##    bred champion — the self-floor half is what closes it.
## P2 SOL NEEDS FIRST LIFE (collector #1 + explorer #2): rancher
##    persona catalogued ZERO species in 722 short sessions — the
##    wiped Binder gains nothing until the Jump Drive (~200 actions).
##    Candidates: starter microbes on Mars/ice moons, Earth's own
##    breeding pair kept post-training, or ring-breach anomaly (e).
## P3 ARRIVAL PAYS (explorer #1, "the beacon's vacated job"): a first-
##    footfall/arrival event per new system that writes a log line —
##    18,044 jumps logged against ~18 payoff events is the loudest
##    ratio in the pack. Fits the corridor-wonder backlog item (g).
## P4 CONQUEST/DUEL INVERSION (optimizer #2): conquest wins 21% vs
##    duels 76% — duel-grinding is the degenerate XP path while the
##    named verb is a 4-in-5 loss. Telegraph winnable conquests
##    (picker already shows odds — surface them earlier) or raise +20.
## P5 FIRST CODEX CLAIM AT STAGE 2 (optimizer #3): zero Signature/
##    relic events in 700 runs — as gated, all nine relic blueprints
##    shipped as dead content. Let the first 1-2 Signatures (Stone/
##    Star?) be claimable in the home galaxy so the Trail's first
##    beacon lights during the Ascent, not after it.
## P6 SHEET POLISH (quartermaster, verdict "ALMOST — yes on desktop"):
##    (a) anchor the equip picker to the tapped socket (it renders
##    below the whole doll — cause and effect half a screen apart);
##    (b) mobile region order doll→CARGO→stats (the empty states
##    promise "the Fabricator below" but stats' long tail buries it);
##    (c) fold nameplate+rarity ladder into a collapsed Collection
##    group; (d) pull the ship-thumb module anchor in ~4% (clips at
##    the card edge on phones). Gear engagement is real (22% tap-to-
##    equip) but top-heavy: Hazmat Suit worn 1×, Verdant Locket 1×.
## P7 LEGENDARY WALL (collector #3): 61% of rare finds are the same
##    grade — within-ring grade variance or a shorter road to stage 2.
## P8 DISCOVERY XP (collector #2): all tracked XP came from combat —
##    cataloguing a genuinely new species could tick the sheet (+2?).
##    A pure collector is level 0 forever.
## KEEP AS-IS (panel consensus): the 6·l² curve ("thresholds honest,
## don't re-cut"), the Ascent stage-1 pacing (Jump p50 65 "crisp"),
## breeding (59% hybrid rate, "best-feeling loop in the game").
## NICK DEVICE-PASS WATCHLIST: paperdoll socket feel on iPhone;
## farewell card over the name prompt (iOS keyboard layering);
## G14 boot time (STILL unverified since v1.3).

## ▼▼ THE EXECUTED v1.5 CHARTER (kept for the record) ▼▼
## ▶▶▶ v1.5 "FRESH START" — THE NEXT SESSION'S CHARTER (planned
## 2026-07-18 at session close, Nick's words folded in verbatim-intent;
## RESUME HERE) ◀◀◀
##
## THE HEADLINE (Nick): **v1.5 WIPES ALL EXISTING DATA — a fresh start
## for everybody, nothing grandfathered.** Implementation: bump the save
## key (cfcc_save_v1 → cfcc_save_v2), no migration; the update bulletin
## announces the fresh start honestly (a "your old expedition is
## honored, the frontier begins anew" send-off — consider letting the
## old save's rarest find get a farewell card). CLEANUP DIVIDEND: the
## grandfather machinery becomes dead code — rc entry markers, rsw
## world flag, asc-absent⇒complete, land/cont absent-grandfathers,
## veteran charter auto-completes — ALL simplify to the post-law path.
## The Ascent/ring spectrum becomes every player's canon opening.
## drawSurface + art-tiles purge finally ships too (dead since 1.3.8).
##
## NICK'S v1.5 WORK ORDERS:
## 1. XP/LEVEL PROGRESSION BALANCE + SYNTHETIC TESTING: the class-XP
##    system (duels +8 · conquests +20 · guardians +60; quadratic
##    thresholds, innate arts at L3/L6) has never been tuned — and
##    levelOf only STARTED WORKING this session (the export hotfix).
##    Build a leveling tier into simrun.js (track XP curves per persona,
##    time-to-L3/L6/L9, art-unlock pacing vs duel/conquest cadence) and
##    balance the thresholds against real progression speed.
## 2. 1,000-BOT ROUND №2 — CHARACTER-SHEET FOCUS: how bots interact
##    with the sheet: stats readouts, equipment picker flows, shipyard,
##    nameplate, stat-growth legibility (eat-to-grow), achievements
##    panel. Instrument sheet-interaction telemetry + critic panel on
##    "is the character sheet a place you WANT to open?"
## 3. SPECIMEN CARDS CONDENSE (Nick: "same as the world cards"): fauna/
##    flora/fungi/microbe reveal cards + Compendium entries are walls of
##    text — apply the 1.1.2 world-card pattern: stats up top, identity
##    always visible, the verbose blocks (anatomy/behavior/habitat/
##    genome details) folded behind remembered expand groups (cardExpand
##    precedent, new bits), ⟁-grade hooks never folded. Same treatment
##    across reveal card, Compendium rows, duel side-cards.
## 4. BUG (Nick's live pass): the notification TRAY stays open over the
##    search box during training step 16 ("type earth") — the tray
##    opened in step 15 must close (or be closed by) the search step;
##    check the panel manager's training-inert rules for the tray.
## 5. COSMIC EVENTS + TRAVELER'S BEACON: **hide both for now** (buttons
##    + panels off; keep the engines dormant) and REWORK for a later
##    update — fold into the quest/notification system when they
##    return (beacon = charter-side "expedition of the hour"?; events =
##    seasonal spectacles with witness rewards).
## 6. UI SWAP: CHARTERS ⇄ PRIME CODEX positions (charters/Ascent are
##    the daily driver now — they earn the prime slot; the Codex is
##    endgame). + QUEST NOTIFICATIONS: a nudge pipeline that tells the
##    player their NEXT chapter goal / charter when idle or on login
##    (the pushNotif rail exists; add a "next step" heartbeat — gentle,
##    dismissible, never nagging twice for the same goal).
## 7. PRIME CODEX REWORK (Nick asked for thoughts — Claude's proposal,
##    for discussion at session start):
##    THE PROBLEM: the 9 Signatures predate the Ascent — they were the
##    only progression; now they overlap it (both gate reach) and their
##    verbs (conquer X, find Y) read like flat checklist charters.
##    THE PROPOSAL — "THE PATHFINDERS' TRAIL": the Codex becomes the
##    ENDGAME arc that begins where the Ascent ends (beyond the Rim):
##    · Each Signature becomes a mini-CHAPTER with narrative beats
##      (the Pathfinders' story told through their 9 lost beacons —
##      the lore hooks already exist in the hints), not a checkbox:
##      e.g. Flame = follow the third beacon's trail to a Magma-Sea
##      world in the Deep Field, ground it, conquer its guardian.
##    · Signatures keep gating the outer REGIONS (that part works and
##      now composes cleanly: Ascent owns rings 0-2, Codex owns 3+).
##    · Each Signature ALSO awards a unique Fabricator BLUEPRINT
##      (signature-tier gear/ship modules — ties the endgame arc into
##      the crafting spine; the "signature relics" set).
##    · Ring-spectrum synergy: each Signature's target band sits in
##      the region its trail reaches — the Codex becomes the guided
##      tour of the upper spectrum.
##    · The ending stays multi-flavored but adds the sandbox promise:
##      finishing the Trail unlocks a "Legacy" prestige layer (v2
##      hook) instead of just an epilogue.
##
## 8. THE PAPERDOLL CHARACTER SCREEN (Nick: "Diablo 2/3/4, PoE 1/2,
##    classic WoW look and feel" — also the fix for "I wasn't sure how
##    to open the Cargo"): opening the character sheet brings up a
##    CENTERED screen, one home for the whole explorer:
##    · LEFT PANEL: all the stats — battle stats, HP, rank/score,
##      expedition statistics (collapsible groups as today).
##    · CENTER: a FULL-BODY painterly portrait of your explorer (the
##      current avatar is a bust — extend playerAvatar to a full-length
##      paperdoll, HD engine law, proof-sheeted) with the equipment
##      sockets ANCHORED TO THE BODY: Helmet at the head, Earpiece at
##      the ear, Necklace below the chin, Suit on the chest, Gloves at
##      the hands, Leggings on the legs, Boots at the feet, Tool in a
##      hand, ship Module docked beside the figure (Shipyard thumbnail
##      as its anchor). Charm/necklace side-slots in the classic
##      positions flanking the portrait.
##    · UNDERNEATH: the full CARGO + INVENTORY grid (elements + crafted
##      items), with the Fabricator/Research tabs riding along — the
##      cargo panel folds INTO the character screen; the top-bar 🧰
##      button stays as a shortcut that opens this screen on its
##      inventory tab.
##    · MOBILE-FIRST CAUTION (iPhone primary): the classic three-column
##      paperdoll must stack on phones — paperdoll first, stats fold,
##      inventory below; sockets stay finger-sized.
##    · Panel-manager: this is a big centered surface — one-at-a-time
##      rules, ✕ + outside-tap, training-inert per the standing laws.
##    · SEQUENCING: build this BEFORE work order #2 (the 1,000-bot
##      character-sheet round) so the bots test the NEW screen — and
##      the specimen-card condense (#3) shares its visual language.
##
## CARRY-INS FROM THE v1.4.1 CRITIC PANEL (ranked backlog, Nick has
## seen the report):
##  a. Array wall: p50 378 actions/24% completion — cheaper Nav Core
##     chain or paying ch2 sub-goals.
##  b. Gear-ladder legibility: ⬆ upgrade pip on equipped items with a
##     craftable successor (Descent Stabilizers: 1/700 wears).
##  c. Exotic circular gate: wave-offs at hostile biome worlds drop a
##     pinch of that biome's exotic (failure funds the counter-gear).
##  d. Bred-champion mercy: fallen bred conquest champions return
##     'Critical' (or leave a re-breedable bloodline record).
##  e. Ring-breach anomaly: ONE rare near-home world carrying a single
##     deep-spectrum find — taste the spectrum early.
##  f. Death keeps the diary: reset leaves a 'recovered expedition
##     log' (fresh-start v1.5 makes this the right moment to design).
##  g. Stage-1→2 corridor wonder: en-route events on long hauls.
##  h. NICK DIALS still open: apex grades out of stats.best (Rarity-
##     achievement detonation — recommended YES); biome-vein valve
##     (recommended KEEP open).
##  i. Deferred features standing: cooking/provisions (flask slot),
##     Frontier Records, archaeology/fossils, hazardous flora (G15),
##     mined-out worlds as real estate (v1.5+ candidate), Shipyard
##     visual evolution (avatar tint by nameplate / rank-evolving
##     portrait), Eyeball World + per-hue rarity + V2 morphology + V13
##     crossGenome (domain decisions), G14 boot time (STILL unverified).
##
## SUGGESTED BUILD ORDER: wipe/fresh-start plumbing first (everything
## else simplifies behind it) → tray/training bug + UI swap + hide
## events/beacon (small, ship early) → THE PAPERDOLL CHARACTER SCREEN
## (#8 — before the bot round; full-body avatar proof-sheeted first) →
## specimen-card condense (shares the paperdoll's visual language) →
## quest notifications → Prime Codex rework (design sign-off with
## Nick first) → XP balance + leveling sim tier → 1,000-bot sheet-
## focus round + critic panel on the NEW screen → carry-in backlog by
## Nick's picks.
## Standing rules: extract.js first; proofsheet for ALL art; deploys
## on Nick's word; simrun.js (ui/chaos/fast/deep) is the regression
## gate; fingerprint stays byte-identical (the baseline survives the
## save wipe — determinism is about the universe, not the save).

## ★★ v1.3 "THE HD FRONTIER" IS LIVE ★★ (2026-07-18, build b79de67,
## Nick: "Ship it"). HD IS ALWAYS ON — no Classic mode, no setting.
## Shipped: painted landing vistas on every world (seeded compositions,
## weather spells, wonder rolls: sky rings / giant moons / biolume
## shores / star-tinted light), painterly portraits for ALL kingdoms w/
## grade-scaled rarity AURAS, HD material icons, class-colored glowing
## galaxy stars + textured nebulae, per-seed unique galaxies (kind-
## locked to the card), card-honest planets (band water / era lights /
## ring thumbs / typed moons), conquest arenas + guardian entrances,
## vista postcards w/ CF1 codes, painterly player avatar, card ✕ +
## drag, human-voice copy pass. Fingerprint 50/50 (two documented
## single-key re-pins of speciesPortrait ONLY — see baseline.json
## notes; wholesale regeneration stays banned), smoke 173/173, systems
## 19/19, balance PASS at ship.

## ▶▶ v1.3.5 "SOFT LANDINGS" (working name) — PLANNED 2026-07-18 from
## NICK'S LIVE PASS (5 phone screenshots + notes; plan approved: ___)
##
## HIS FINDINGS → ROOT CAUSES (all verified in source):
## N1 "little lines around recent nebulae": decoSprite 'rem' branch
##    draws 26 filament STROKES in a ring (~line 4662) — reads as dashes.
## N2 "circles around recent deaths": supernovaSites live loop strokes a
##    hard orange circle per remnant (~4823) + the gravitational-wave
##    cosmic event draws 3 stroked concentric rings (~4867). Nick's law:
##    NO circles/rings on deaths — gassy, blended, space-cloud look.
##    (Bonus: that whole loop allocates radial gradients per frame — a
##    known heat-rule violation; baking sprites fixes both.)
## N3 gas giants have no landing payoff: showVistaBox returns early for
##    type gas (~6788); zoom-in dumps you on flat band tiles; card says
##    "no surface to land on" while YOU ARE HERE. Nick: ALL worlds land,
##    gas giants included (Claude agrees — the "no surface" fact becomes
##    the scene, not a wall).
## N4 landing should carry a small ROLL of risk (HP scrape on a rough
##    descent) without making players fear landing.
## N5 MOBILE MENU STACKING (the unplayable one): every panel (Atlas /
##    Compendium / Cargo / Charters / Events / stats...) keeps its own
##    open bool, only some pairs mutually exclude, only some have
##    outside-tap close — they pile up and can only be closed from their
##    own buttons. Universal ✕ + one-panel-at-a-time needed.
## N6 zooming into a world should NOT land you into flat graphics — at
##    landing zoom it should ASK ("begin descent?"), then the VISTA is
##    the landing, with an ✕ to close (the ✕ convention goes everywhere).
##
## THE PLAN — 4 batches, each build → validate/smoke/systems → commit:
## BATCH 1 SPACE DUST (graphics): rework 'rem' deco sprite to a gassy
##    filament shell (soft puffs on the shell annulus, no strokes);
##    bake supernova-site remnants into cached textured sprites (seeded
##    by site.seed — kills the per-frame gradients too); replace the GW
##    event's stroked rings with soft luminous ripples ('lighter'
##    gradients, feathered). Proof sheet via headless Edge BEFORE Nick
##    sees it. No domain changes.
## BATCH 2 ONE PANEL AT A TIME (the unplayable fix, ships first if
##    split): central panel registry (id/el/close), openPanel() closes
##    the rest — BOTH platforms (predictability > desktop real estate);
##    ✕ in every panel header (reuse the card's .pxc language); one
##    unified empty-space-tap handler closes the open panel; vista gets
##    an ✕ too. Smoke: exclusivity matrix + ✕ + outside-tap.
## BATCH 3 EVERY WORLD HAS A VISTA (Nick 2026-07-18: "not just gas
##    giants — ensure every planet has a vista; the scene is whatever
##    the card indicates"). The 8 planet types are closed (gas/rocky/
##    desert/ice/terran/ocean/venus/lava) and GAS IS THE ONLY GAP —
##    the other 7 already render. So: (a) new gas scene — you hold
##    station in the high cloud deck: banded storm horizon, cloud-top
##    floor, polar auroras when the card promises them (V5 debt), ring
##    overhead when P.ring, typed moons, lightning in the deeps, aerial
##    fauna silhouettes when Gas Giant Life; header "Cloud deck" not
##    "Planetfall"; TYPE_DESC copy softens ("no solid surface — you
##    ride the high deck"). (b) HARD GUARANTEE: showVistaBox never
##    early-returns for any type; seed-sweep harness asserts 8/8 types
##    × the pal/wx matrix produce a scene. Card law holds everywhere.
## BATCH 4 THE DESCENT (landing flow, Nick's split):
##    - MANUAL ZOOM: the zoom STOPS at approach altitude, BEFORE the
##      flat surface tiles ever show — confirm sheet "Begin descent?"
##      with the risk read. Decline = stay in orbit (no re-prompt until
##      you pull back out past the threshold and dive again).
##    - LAND BUTTON: auto-lands, NO confirm (pressing it IS the intent).
##    - THE LANDING LADDER (Nick 2026-07-18: success lines up with the
##      BIOME, full spectrum, standardized game-wide; gentle on good
##      biomes, brutal on hostile ones). Six standard tiers, each biome
##      pinned to one (table in Batch 5): CALM 100% (no scrape) /
##      STEADY 90% (wave-off 2 HP) / ROUGH 75% (3-4 HP) / HAZARDOUS
##      55% (4-6 HP) / EXTREME 30% (5-7 HP) / HOSTILE 10-15% (6-8 HP).
##      WEATHER MODIFIER (Nick 2026-07-18: "very, very small"): an
##      ACTIVE weather spell = −5, and it never drags a Calm/Steady
##      world below 90 (weather is flavor risk, never a wall on
##      friendly worlds); floor 5% overall. The confirm sheet shows
##      the real % incl. the weather line ("storm in progress −5") —
##      (mechanics precedent: bioscan danger % is already shown;
##      vague-not-wrong governs world FACTS, not odds).
##    - THE ROLL (app-layer random, like first contact): SUCCESS → the
##      vista pops (the landing IS the vista). FAIL = WAVE-OFF: bounced
##      back to orbit with the tier's scrape (hull tech reduces,
##      routeHit, never lethal — floor 1 HP) + toast; retry immediate.
##    - THE PITY RAMP (anti-frustration, makes 10% biomes playable
##      without gear): each consecutive wave-off on the SAME world adds
##      +20% to the next attempt (10→30→50→70→90→100 — worst case 6
##      dives, ~25 HP; the pilot learns the approach). Resets only on
##      success; grounded worlds are forever 100% + skip the confirm.
##      Earth + training exempt (auto-confirm + auto-succeed).
##      Guide + RELEASES copy. Roll plumbing takes a success-bonus
##      modifier from day one (v1.4 gear slots straight in).
##    - v1.4 HOOK (Nick): crafted items will BOOST landing success up
##      to 100% (see the v1.4 craft-effects list) — so the roll plumbing
##      takes a success-bonus modifier from day one.
##
## BATCH 5 THE BIOME EXPANSION (Nick 2026-07-18: "think of all the
##    biomes possible... even brand new alien type biomes... a full
##    deep dive iteration" — more worlds to see, more vistas).
##    ARCHITECTURE (determinism-safe, Claude's design, Nick approving):
##    - The 8 domain TYPES are FROZEN — re-slicing planetParams' roll
##      would re-type every existing world (atlases, share codes,
##      grounded worlds would contradict player memory). Never.
##    - Instead a BIOME layer refines within type: biomeFor(P, desc) =
##      pure deterministic fn in a NEW app-layer module (depositsFor
##      precedent), seeded by hashInt(seed, BIOME_CONST) — a separate
##      stream, ZERO perturbation of existing rng draws, fingerprint
##      stays byte-identical, no baseline touch at all.
##    - CONDITIONED ON THE CARD so it never contradicts (vague-never-
##      wrong): biome rolls only among candidates the card's climate
##      band / Water row / Life row allow. "Mostly evaporated" terran
##      can't roll Marsh — it rolls Salt Flats. Swamp needs liquid
##      water + life. The card stays coherent by construction.
##    - PRESENTATION: card gains a Biome row (app-layer renderPanel,
##      like Mineral veins) and the SUB-LABEL wears it — players see
##      "Swamp world", "Fungal world", "Crystal world" as if new
##      planet types, engine keeps 8 archetypes underneath.
##    - CARD-HONEST ART: vista scene per biome family + thumb/system-
##      sprite tinting follows (swamp = dark blackwater mottle, crystal
##      = faceted glints). Rarity ladder: common biomes common, ALIEN
##      biomes rare (engineered-infinity L3 — wonder-class rolls).
##    PROPOSED BIOME SETS (Nick trims/renames; ~34 across 8 types):
##    - TERRAN: Temperate (current) / Swamp (blackwater fens, hanging
##      moss, mist) / Marsh (reed flats, braided channels, fireflies)
##      / Jungle (canopy tiers) / Savanna (gold grass, big herds) /
##      Tundra (permafrost moss, low sun) / rare-alien: Fungal (spore
##      towers, gill canopies) + Crystal Steppe (mineral spires).
##    - OCEAN: Open Sea + islands (current) / Archipelago (island
##      chains) / Coral Shallows (turquoise reef flats) / Storm Sea
##      (perpetual squall) / rare-alien: Milk Sea (biolume blooms).
##    - ICE: Glacier Fields (current) / Cryogeyser Plains (Enceladus
##      jets) / Pack-Ice Sea (pressure ridges) / rare-alien: Blue-Ice
##      Canyons (glowing crevasse light).
##    - DESERT: Dune Sea (current) / Salt Flats (blinding white,
##      mirage shimmer) / Canyon Lands (slot canyons, strata) / Oxide
##      Waste (rust + dust devils) / rare-alien: Glass Desert
##      (vitrified, lightning-fused).
##    - ROCKY: Cratered Highlands (current) / Graben Canyons / Boulder
##      Regolith / rare-alien: Geode Fields (amethyst gashes) + Carbon
##      World (graphite black, diamond glints).
##    - VENUS: Acid Haze (current) / Sulfur Storm Decks / rare:
##      Greenhouse Abyss (crushing gloom, constant lightning).
##    - LAVA: Ember Fields (current) / Obsidian Plains (black glass,
##      red cracks) / Magma Seas (molten-ocean coasts) / Ash Wastes.
##    - GAS: Banded Deck (Batch 3 scene) / Great-Storm Eye (a
##      hurricane bigger than worlds) / Pastel Ammonia Decks / rare:
##      Hot-Giant Glow (night side is a furnace).
##    LANDING SUCCESS BY BIOME (Nick's ask; % = base success, before
##    pity ramp / weather −10 / v1.4 gear; grounded worlds always 100):
##    - TERRAN: Temperate 100 · Savanna 100 · Tundra 90 · Marsh 90 ·
##      Jungle 85 · Fungal 85 · Crystal Steppe 85 · Swamp 80
##    - OCEAN: Coral Shallows 100 · Archipelago 95 · Open Sea 90 ·
##      Milk Sea 90 · Storm Sea 60
##    - ICE: Glacier Fields 90 · Pack-Ice Sea 85 · Cryogeyser Plains
##      70 · Blue-Ice Canyons 55
##    - DESERT: Dune Sea 90 · Canyon Lands 85 · Salt Flats 85 · Oxide
##      Waste 75 · Glass Desert 50
##    - ROCKY: Cratered Highlands 95 · Boulder Regolith 90 · Graben
##      Canyons 85 · Geode Fields 80 · Carbon World 60
##    - GAS: Pastel Ammonia Decks 75 · Banded Deck 65 · Great-Storm
##      Eye 30 · Hot-Giant Glow 15
##    - VENUS: Sulfur Storm Decks 30 · Acid Haze 25 · Greenhouse
##      Abyss 10
##    - LAVA: Ash Wastes 35 · Ember Fields 25 · Obsidian Plains 20 ·
##      Magma Seas 10 (Nick's "lava ~10%" anchor)
##    Alien biomes deliberately span the FULL spectrum (Fungal 85 →
##    Hot-Giant Glow 15) — alien ≠ dangerous; hostile ≠ boring.
##    EXTREMOPHILE LIFE — AUDITED + NICK'S DECISION (2026-07-18,
##    "we should still have life... sulfur-magma creature... icy
##    creature... lower chance based on how life survives"):
##    - AUDIT RESULT: biosphere() already gives EVERY type a nonzero
##      life chance — lava 10% microbial vent mats, venus 12% aerial
##      microbes, gas 14% cloud floaters, rocky 18%, ice 50%
##      subsurface hidden seas, desert ALWAYS at least microbial,
##      ocean rolls full Aquatic ecosystems (deep-sea worlds exist and
##      are covered). Nick's principle is already domain law.
##    - THE ACTUAL GAP: hostile types cap at MICROBIAL — no creature
##      ever appears. NEW: a rare EXTREMOPHILE FAUNA tier, carved as a
##      thin slice INSIDE each hostile type's existing single rng draw
##      (nested thresholds on the same r() call — NO extra draws, the
##      stream stays byte-aligned; only the sliced worlds' Life row
##      upgrades microbial→fauna). Biome-conditioned (a fauna world
##      preferentially rolls the biome its creature fits), wired
##      through the existing 'Extreme-World Life'/'Gas Giant Life'/
##      'Subterranean Life' habitats into bioscan/Compendium/vistas.
##    - EXTREMOPHILE FAUNA CHANCES — FULL PASS (Nick 2026-07-18:
##      "ultra rare on types we're almost positive wouldn't exist" —
##      chances follow REAL astrobiology, in four plausibility bands):
##      EARTHLIKE (life expected — the normal biosphere roll already
##        provides fauna, no slice needed): all terran biomes, all
##        ocean biomes except deep-vent below.
##      PROVEN EXTREME ~0.5-2.5% (Earth has these TODAY — vents,
##        brines, deserts, permafrost, deep rock):
##        Canyon Lands 2.5 · Dune Sea 2.0 · Cryogeyser Plains 1.5 ·
##        Pack-Ice Sea 1.5 · deep-vent fauna on hot-band oceans 1.0 ·
##        Blue-Ice Canyons 0.8 · Glacier Fields 0.5 · Oxide Waste 0.5
##        · Geode Fields 0.5 · Salt Flats 0.3 · rocky subsurface
##        (Cratered/Boulder/Graben cave fauna) 0.3
##      SPECULATIVE ~0.1-0.4% (debated science — Venus clouds,
##        Sagan's floaters): Pastel Ammonia Decks 0.4 · Banded Deck
##        0.3 · Sulfur Storm Decks 0.2 · Acid Haze 0.15 · Great-Storm
##        Eye 0.15 · Ash Wastes 0.1
##      NEAR-IMPOSSIBLE 0.01-0.05% (no real-world basis — THE GRAILS):
##        Ember Fields 0.05 · Glass Desert 0.05 · Carbon World 0.05 ·
##        Obsidian Plains 0.03 · Greenhouse Abyss 0.02 · Hot-Giant
##        Glow 0.02 · MAGMA SEAS 0.01 (Nick's "pure fire" anchor —
##        1 in 10,000; finding the magma-swimmer is a LEGEND, its
##        share code a trophy).
##      ENCOUNTER MATH (why these numbers): a player surveying ~1,000
##      worlds meets a handful of proven-extreme fauna (the loop pays
##      regularly), maybe ONE speculative find (a story), and near-
##      impossible finds stay community events. Rarity-tier/aura should
##      scale with the band (near-impossible ⇒ summit-grade rarity).
##    EXTREMOPHILE VISUAL LANGUAGE (Nick 2026-07-18: "these creatures
##    should look very alien-like... not just the aura"). THE LAW
##    EXTENDS: the ENVIRONMENT drives the anatomy. Alien-ness scales
##    with the plausibility band — band 2 reads as recognizably weird
##    Earth-logic; band 4 is fully alien body logic. Per-environment
##    GENE PACKS (material + palette + feature + glow, each pack a
##    combinatorial pool so no two match):
##    - MAGMA/EMBER: obsidian-plate hide w/ glowing seam-cracks (ember
##      rim light), heat-vane fins, slag-shell backs; basalt black +
##      ember orange.
##    - UNDER-ICE VENT (Europa logic): translucent antifreeze flesh,
##      biolume lures, eyeless-or-huge-eyed (deep-sea rules), frost-
##      crystal shells; blue-white + biolume cyan.
##    - DEEP-VENT OCEAN: black-smoker armor, mineral-crust plating,
##      siphon mouths; charcoal + mineral glints.
##    - VENUS ACID CLOUDS: float-sac drifter bodies, trailing filter
##      tendrils, iridescent acid-sheen membranes; sulfur gold-greens.
##    - GAS DECK: hydrogen ballonets, kite membranes, storm-riding
##      sails — palette MIRRORS that world's own deck bands (card!).
##    - ROCKY SUBSURFACE: pallid eyeless troglobites, echo-sense
##      organs, crystal-tipped feelers.
##    - SALT/BRINE: halophile PINKS (real Earth biology — brine pools
##      are pink today), salt-crust carapace.
##    - CARBON WORLD: graphite-black bodies, diamond glint facets.
##    - GLASS DESERT: vitreous translucent shells, fulgurite spines.
##    IMPLEMENTATION: descriptor TEXT drives it (card-drives-picture) —
##    extremophile FA_TRAIT/hide pools per habitat ("obsidian-plated,
##    veins of cooling magma", "antifreeze-clear blood") live in the
##    NEW extremophile species branch ONLY (existing species pools/
##    streams untouched — new text is reachable only from the new Life
##    levels, so existing genomes stay byte-identical); hdGenesFor +
##    the portrait renderer learn the material/glow packs; the SAME
##    render is globally there (vista herds / reveal card / Compendium)
##    per the Phase-2 rule. FLORA TOO: chemosynthetic tube gardens at
##    vents, cinder blooms + sulfur chimneys on ember fields, frost-
##    crystal flora under ice, aeroplankton veils in acid clouds —
##    vista-visible where the card grants them. RARITY FLOORS by band:
##    proven-extreme ⇒ elevated floor; speculative ⇒ high floor;
##    near-impossible ⇒ summit-grade floor + full aura treatment (the
##    magma-swimmer must LOOK like the legend it is).
##    - THIS IS A DOMAIN CHANGE, AUTHORIZED BY NICK 2026-07-18 (the
##      V13-class call, made): ~2-3% of hostile worlds' Life row text
##      changes. Per the re-pin protocol: per-probe diff first; if a
##      pinned baseline world falls in a slice, single-key re-pin with
##      note naming this decision. Wholesale regen stays banned.
##    - DANGER = RARITY (the Diablo-loot law): the hardest landings
##      host the strangest finds.
##    AIR/LAND/SEA AUDIT (Nick 2026-07-18 "complete pass... see if
##    there's anything we're missing"; audited FA_*/FLORA_FORM/
##    FUNGI_FORM/MICROBE_FORM/FA_HABITAT/planetSpecies):
##    - FAUNA: LAND rich (11 locos). SEA solid at the surface
##      (swimmers/jet-swimmers/filter-feeders; coastal/open-ocean/reef
##      habitats) but NO abyssal-trench or under-ice habitat. AIR thin:
##      only passive fliers (gliders/floaters/drifters/current-
##      drifters) — no powered winged hunters despite the four-winged
##      body plan. MICROBES already gloriously extreme (sulfur-eating,
##      acid-pool, methane-eating, snow-algae — aligned as-is).
##    - FLORA: LAND strong (18 forms). SEA MISSING ENTIRELY — aquatic
##      worlds roll flora but FLORA_FORM has no kelp/seagrass/reef-
##      builder/sargassum (the "kelp, algae mats" only exist in a
##      comment!). AIR flora nonexistent.
##    - HARD CONSTRAINT (learned): existing pools are INDEX-PINNED
##      (genome rolls use (r()*len)|0 — extending ANY existing array
##      re-rolls every existing creature). ALL additions ship as
##      PARALLEL POOLS reachable only from NEW species branches/slots:
##      · EX_HABITAT (extremophile branch): beneath the ice sheets,
##        abyssal trenches, cooling lava margins, acid cloud layers,
##        storm-eye updrafts, brine pools, the eternal twilight ring.
##      · EX_LOCO adds powered fliers: winged hunters, storm-riders,
##        thermal-soarers (aerial fauna finally get wings that flap).
##      · AQ_FLORA (new additive slots on aquatic worlds, separate
##        hash stream — existing species byte-identical, worlds GAIN
##        rows): kelp towers, seagrass meadows, reef-builder colonies,
##        sargassum rafts, biolume bloom fields.
##      · AIR_FLORA (new slots on aerial-life worlds): aeroplankton
##        veils, drift-spore banners, cloud-garden colonies.
##    - BIOMES +5 (audit gaps → ~39 total): Mangrove Coast (terran
##      wet — the mangrove-tangles habitat gets its world; land 90) ·
##      Karst Caverns (rocky/terran — crystal-cavern + cave fauna
##      stage; land 80, cave fauna 1.0) · Volcanic Archipelago (ocean
##      — ember-meets-sea, Hawaii logic; land 70) · Abyssal Ocean
##      (ocean, no islands, lightless deep — vent/abyssal fauna stage;
##      land 75, vent fauna 1.5) · EYEBALL WORLD (terran/ice around
##      RED DWARFS — tidally locked: permanent day face, frozen night
##      face, life crowded into the terminator ring; the existing
##      'twilight terminator zone' habitat finally gets its world;
##      card-honest via the star's spectral class; land 85; rare-alien
##      showpiece).
##    - VISTA WIRING: hdVista already carries air/aqua counts (opts) —
##      the new fliers/swimmers have a rendering path waiting.
##    FLORA VARIETY PASS (Nick 2026-07-18 "all the various types of
##    plants and trees... obviously a fire world never has plants"):
##    biome-conditioned FLORA FAMILIES — each biome weights its plant
##    species toward what belongs (mangrove tangles on Mangrove
##    Coasts, succulent/cactus-analogues + deep-root scrub in deserts,
##    cushion-scrub + dwarf frost flora on tundra, reed thickets in
##    marshes, canopy titans in jungles, kelp/seagrass/reef flora in
##    the sea biomes, aeroplankton on aerial-life worlds). The card's
##    Life row remains the gate — fire/airless/lifeless worlds get NO
##    flora, ever, unless an extremophile slice grants it (cinder
##    blooms are card-granted, never decoration). Vista plant stamps +
##    species rosters + thumbs draw from the same biome family so the
##    world reads as ONE ecology, not a hodgepodge.
##    WEATHER EVENT SYSTEM (Nick 2026-07-18 "crazy other weather
##    events... tornadoes in the background... drives 'what's going on
##    with this planet?'"). AUDIT FINDING: weatherText() ALREADY
##    promises the spectacle — "Continent-sized cyclones", "Endless
##    hurricanes", "Planet-circling dust storms", "cryovolcanic geyser
##    plumes", "sulfuric-acid drizzle that evaporates before it lands",
##    "storms of glowing rock vapor" — and the vista renders generic
##    rain/dust. ANOTHER CARD DEBT (the aurora pattern). THE FIX:
##    weather EVENTS as app-layer spell rolls (the proven seeded ~90s
##    mechanism), conditioned on Weather row + type + band + biome —
##    common weather common, SHOWPIECES rare. No domain text changes:
##    exotic phenomena the old row lacks ride the NEW biome row's text
##    (iron rain lives in Hot-Giant Glow's description). EVENT CATALOG:
##    - TERRAN temperate: thunderstorm (forked lightning, wind-bent
##      trees, downpour) · TORNADO funnel on the horizon (rare) · hail
##      · fog banks · monsoon walls (jungle/marsh) · rainbow after
##      rain (optical wonder).
##    - TERRAN cold: blizzard whiteout · ICE STORM (crystal-coated
##      flora) · diamond-dust glitter · sun dogs / light halos (real
##      ice-crystal optics).
##    - TERRAN hot: heat shimmer · dry lightning · firestorm fronts
##      (rare).
##    - OCEAN: HURRICANE wall on the horizon (the card's endless
##      promise, finally painted) · WATERSPOUTS (rare) · squall lines
##      · lightning over open water.
##    - DESERT: HABOOB (advancing sand-cliff wall — the showpiece) ·
##      dust devils · dry lightning · global-storm haze days · mirage
##      shimmer.
##    - ICE: CRYOGEYSER ERUPTIONS (the card's plumes, painted) ·
##      nitrogen frost-fog · aurora storms.
##    - VENUS: ACID VIRGA (rain dying mid-air — the card's exact
##      sentence, painted) · sulfur mega-lightning · crush-haze.
##    - LAVA: VOLCANIC LIGHTNING in the ash column (real physics,
##      spectacular) · ember rain · FIRE WHIRLS (rare) · rock-vapor
##      glow storms.
##    - GAS: the cyclone wall seen from the deck · ammonia lightning
##      lighting clouds from below · biome-carried exotics: IRON RAIN
##      (Hot-Giant Glow) · glass-shard winds · diamond hail (deep
##      decks, rare).
##    - ROCKY/airless: stays honest — no atmosphere, no weather, ever.
##    WIRING: surface status line + vista caption word the event
##    ("volcanic lightning storm"); the descent confirm's weather line
##    names it ("hurricane in progress −5") — Nick's exact fantasy:
##    see the storm from orbit, dare the landing, land INSIDE it.
##    Overlays pre-baked per event (heat rules); smoke probes per
##    event family; postcards inherit (a tornado postcard!). (5b)
##    NMS-INSPIRED ADDITIONS (Nick shared No Man's Sky's full update
##    arc 2026-07-18; three fits for THIS patch, filtered hard):
##    - COLOSSAL WANDERERS (Origins' sandworm energy, 100% card-
##      honest): FA_SIZE already has 'titanic' and the Megafauna realm
##      exists — when a world's OWN roster holds a titanic creature, a
##      rare wonder-roll renders it at TRUE horizon scale in the
##      vista: a sandworm breaching the Dune Sea, a leviathan arching
##      out of the Open/Abyssal ocean, a sky-colossus silhouette
##      crossing the gas deck. The card said titanic; the vista
##      finally means it. (5b)
##    - UNDERWATER VANTAGE (The Abyss): the Abyssal Ocean biome's
##      vista is the game's first SUB-surface view — biolume drifts,
##      vent glow below, the dim ceiling of the sea above (cloud-deck
##      precedent: the vantage follows the card's truth). (5b)
##    - HAZARDOUS FLORA (Visions): dangerous plant traits in the NEW
##      parallel pools (spore-burst pods, snap-traps, acid sap) —
##      vista-visible, card-warned in the flora text (vague-never-
##      wrong), tiny field-sample risk on the worst offenders. Plants
##      stop being furniture. (5a text + 5b art)
##    FILTERED OUT for now (noted for v1.4+ below): Wonders/records
##    catalogue, archaeology/fossils; bases/freighters/multiplayer/
##    settlements are a different game.
##    FULL-KINGDOM BALANCE GATE (Nick: "eventually somebody will just
##    hunt out one creature... full balance pass on everything"):
##    - LAW: POWER IS DECOUPLED FROM RARITY. Rarity buys aura,
##      prestige, stardust value and Compendium glory — NOT combat
##      dominance. Extremophile/summit finds stay inside the tuned
##      combat bands; no biome or species may be the strictly-best
##      hunt. (The chase stays wide — Diablo law: many viable grails.)
##    - GATE: the balance-sim extends to ALL FOUR KINGDOMS (fauna,
##      flora, fungi, microbes) incl. extremophiles + cross-pool
##      hybrids: duel win-rate spread, feeding/medicine value
##      distribution (no single flora farm dominates healing), breed
##      outcomes, conquest champion spread. Any dominant strategy the
##      sim flags gets tuned BEFORE the batch ships (balance PASS is
##      already a ship gate — this widens what it covers).
##    PUSH PLAN (separate pushes, Nick's word each): 5a biomeFor +
##    card row + sub-label + landing-ladder audit + the parallel gene
##    pools/slots above; 5b vista scenes per biome family (the big art
##    batch — proof sheets per family); 5c thumbs/system sprites.
##    Seed-sweep gate extends to the full type × biome × pal matrix.
##    v1.4 HOOK: rare biomes can gate rare VEINS later ("rarer worlds'
##    veins gate rarer recipes" — biome becomes the flavor carrier).
##
## CLAUDE'S GAP AUDIT (2026-07-18, Nick: "anything else that could be
## missing that I didn't think about") — folded into the batches:
## G1 DISCOVERABILITY OF THE GRAILS: at 0.01% nobody will know the
##    magma-swimmer EXISTS. The orbital glance/survey must HINT on
##    extremophile-slice worlds ("faint biosignatures — where nothing
##    should survive", ⟁-language, vague-never-wrong) so the hunt is
##    playable, not blind luck. + New charters ("Catalogue an
##    extremophile") and Prime Codex/achievement hooks pointing at
##    hostile-biome hunting, so the content advertises itself. (5a)
## G2 BREEDING EXTREMOPHILES: crossGenome must handle the new parallel
##    pools safely (index math). RECOMMENDATION: breedable with
##    anything (infinite-Pokémon pillar — magma-beast × meadow grazer
##    hybrids are the dream), hybrid draws each gene from the parent's
##    own pool so indices never cross pools. (5a + smoke)
## G3 BALANCE: summit-grade rarity floors mean extremophiles could
##    dominate duels/conquest — balance-sim gate must cover them; tune
##    power separately from rarity if the sim flags it. Conquest
##    ARENAS also need the new biome backdrops or the defender's-biome
##    arena renders wrong. (5b)
## G4 WAVE-OFF DAMAGE ROUTING (design call made): the EXPLORER takes
##    landing scrapes (it's piloting, not fieldwork) — the Field Scout
##    only absorbs bioscan wounds. Hull tech reduces both. (Batch 4)
## G5 PITY-RAMP PERSISTENCE: ramp progress saves per-world (small
##    capped map) — losing 5 wave-offs of progress to a page reload on
##    a 10% world would be rage-quit fuel. (Batch 4, save field w/
##    absent-safe default)
## G6 SEARCH & ATLAS: biome joins the search index ("swamp", "eyeball")
##    and Atlas rows show the biome word — hunting by biome becomes a
##    real workflow. (5a/5c)
## G7 EVENT LANGUAGE: wave-off/landing toasts classify into the evClass
##    color palette (harm red scrape, gain green touchdown, gold first
##    footfall on a Hostile world); planetfall whoosh gets a wave-off
##    variant sting (volume/rmotion rules apply). (Batch 4)
## G8 RULE-7 SWEEP: every batch lands its Guide topic updates (landing
##    ladder, biomes, extremophiles) + categorized RELEASES bullets in
##    the same batch it ships. (all)
## FINAL AUDIT (2026-07-18, pre-build):
## G9 PANELS vs MODALS (Batch 2, ship-blocker-grade): the overlay list
##    (~line 4064) mixes closable PANELS (codex/log/stats/events/
##    cargo/charters/setpanel/guidebox/primebox/search results/notif
##    tray) with true MODALS (duelbox mid-fight, pickbox, reveal,
##    namebox, deathbox, endingbox). Tap-outside-to-close applies to
##    PANELS ONLY — a stray tap must NEVER close a duel, a reveal, or
##    a name prompt. Registry carries a modal flag; modals keep their
##    explicit buttons (and get the corner ✕ only where dismissal is
##    already legal). Notification tray + search results JOIN the
##    panel registry (they stack today too).
## G10 COPY SWEEP "zoom all the way in" (Batch 4): the charter
##    st-land text, the landcta fallback toast, and the Guide survey
##    topic all teach "zoom all the way into this world" — every
##    instance updates to the descent-confirm flow in the same batch,
##    or the game teaches a lie.
## G11 ROLL SEQUENCE ON CIV WORLDS (Batch 4, defined not changed):
##    descent roll first; first-contact roll only fires AFTER a
##    successful landing (as today, on the card render). No stacking
##    surprise: civ worlds are overwhelmingly temperate terran = Calm.
## G12 SAVE SCHEMA TALLY (whole patch): exactly ONE new save field —
##    the pity-ramp map (capped, absent-safe default empty). Biomes/
##    weather derive from seed; extremophiles ride the codex; panel
##    state is transient. Keep it that way.
## G13 VISTA ✕ IN TRAINING (Batch 2): follows the card-✕ rule —
##    hidden during training (the vista is the lesson); tap-to-
##    dismiss still works there.
## G14 STILL UNVERIFIED FROM NICK'S v1.3 WATCHLIST: boot time on his
##    big save — none of the 1.3.5 batches touch boot; Nick should
##    watch it on his next pass and report.
## POST-NMS AUDIT (2026-07-18, second pass over the three additions):
## G15 HAZARDOUS FLORA ✕ FATAL MEALS (coherence win): the fatal-meal
##    mechanic already exists — hazardous flora species should be the
##    LIKELY fatal meals (the card warned you; feeding acid-sap to
##    your champion is on you). One system, two faces. Sample-time
##    scrapes from hazardous flora route like bioscan wounds (Field
##    Scout absorbs — it's fieldwork, unlike landing G4).
## G16 UNDERWATER VANTAGE WIRING: the F3 aquatic filter runs in
##    REVERSE beneath the waves (swimmers/drifters IN, walkers OUT);
##    weather/aurora/moon overlays don't reach the deep (always-dark
##    pal, biolume is the light); header copy "Descent — beneath the
##    waves" not "Planetfall".
## G17 COLOSSAL WANDERERS: visual-only (no combat/balance surface —
##    the titan on the horizon is the same creature already in the
##    roster); joins the wonder-roll family + first-sighting gold
##    caption; "Witness a colossal wanderer" charter/achievement
##    candidate rides G1 discoverability.
## G18 5b SCOPE SPLIT: the art batch is now large — 5b-i biome scene
##    families; 5b-ii weather events + wanderers + underwater vantage.
##    Two proof-sheeted pushes instead of one monster.
## FINAL OCD AUDIT (2026-07-18, Guide matrix + achievement math):
## G19 GUIDE COVERAGE MATRIX (17 topics audited; the batch that ships
##    a feature ships its Guide line): zoom (descent confirm replaces
##    zoom-to-land) · survey (ladder %, biome row, ⟁ extremophile
##    hints) · search+atlas (biome terms) · charters (new types) ·
##    colors (wave-off/touchdown classes) · discover (extremophile
##    hunting, hazardous-flora sampling) · kingdoms (gene packs, sea/
##    air flora, wanderers) · breed (cross-pool hybrids) · feed
##    (hazardous flora = risky meals) · mining (gas giants behind the
##    first-landing roll; veterans grandfathered) · settings (Motion
##    gates weather animation). + ONE new topic: 'landing' (the
##    ladder, wave-offs, pity ramp, grounded = forever safe). beacon/
##    rank/ending/events/codes: no change needed (verified).
## G20 ACHIEVEMENT MATH GUARDS (would have silently broken):
##    - Bestiary counts FA_BODY.length — extremophiles REUSE the 16
##      body plans (material/gene packs only, no new body indices).
##    - Warden of Realms counts REALM_ORDER.length — extremophiles
##      map INTO existing realms (Extreme-World/Gas Giant/
##      Subterranean); NO new realm entries.
##    - Five Flavours / Master of Arts — new flora/fauna draw from
##      the existing 5 flavors + existing ABILITY_THEMES. No pool
##      growth on achievement-counted arrays anywhere.
## G21 WEEKLY CHARTER POOL: selection hashes the pool SIZE
##    (hashInt(0xC4A7, week, 7)) — growing the pool changes which
##    weeklies a given week rolls. Ship pool growth as a deliberate
##    one-time rollover (note in RELEASES); cross-player determinism
##    holds per version.
## G22 MOTION SETTING gates all animated weather/wanderer overlays
##    (rmotion whitelist extends); thunder/ambient stings honor the
##    volume taper.
## G23 RESET clears the pity-ramp map (save hygiene; reset stays a
##    full clean slate).
##
## SETTLED (Nick 2026-07-18): VERSION IS 1.3.5, separate pushes per
## batch. STILL HIS CALLS: descent success/damage numbers (proposal:
## Calm 100%; Rough ~85%, wave-off 3-4 HP; Hazardous ~70%, wave-off
## 5-8 HP — before v1.4 item bonuses); panel exclusivity on desktop
## too (recommended yes); Batch 5 biome list trims/renames + whether
## sub-labels read "Swamp world" style (recommended yes).

## ★★ v1.3.5 "SOFT LANDINGS" IS LIVE ★★ (2026-07-18, build bc70152,
## Nick: "ship it"). Deployed after the pre-ship review (2 agents +
## self-review, all findings fixed) — suites at ship: fingerprint
## 50/50 byte-identical, smoke 214/214, systems 19/19, balance PASS.
## ALL FIVE BATCHES LANDED (7 commits, one per push):
##  B2 panel manager (one panel at a time both platforms, ✕ everywhere
##     incl. vista, modals exempt + training-inert; ALSO fixed a real
##     vista dismiss race a fast tap could hit on phones)
##  B1 space dust (gassy remnant shells, soft merger ripples, baked
##     sprites — the per-frame gradient heat sink is gone)
##  B3 cloud deck (8/8 vista coverage; TYPE_DESC + status copy fixed —
##     gas giants no longer claim "airless")
##  B4 the descent (biome ladder w/ shown %, zoom stops at approach +
##     asks / Land button auto-rolls, wave-off never lethal, +20% pity
##     SAVED per world [field wvo], grounded forever safe, weather −5
##     small, Earth+training exempt, Guide topic 'landing', copy sweep)
##  B5a biomes (~35 in 8 frozen types, band-conditioned, sub-label +
##     Biome row, rare kinds violet; EXTREMOPHILE fauna slices in
##     domain [Nick-authorized; NO pinned probe world fell in a slice —
##     fingerprint 50/50 with ZERO re-pins]; parallel pools EX_HABITAT/
##     EX_LOCO/AQ_FLORA/AIR_FLORA via g.x/g.aq/g.af markers; kelp at
##     last; xfauna breed true when both parents are; weekly charter
##     'Down the hard way'. EYEBALL WORLD DEFERRED: tidal lock would
##     contradict the Seasons row — NICK DOMAIN DECISION pending.)
##  B5b-i biome-dressed vistas (9 feature painters + identity washes;
##     header names the biome; deck tuned per gas biome; NOTE for
##     Nick's device pass: terran color identities [savanna gold, swamp
##     gloom] are directionally in but want palette-level tuning
##     against real screenshots)
##  B5b-ii weather events (9 showpieces, seeded spells, named on
##     surface line + vista caption + descent ask), colossal wanderers
##     (titanic roster members break the horizon), the deep (abyssal
##     underwater vantage)
##  B5c biome-tinted orbit sprites (band-independent types only —
##     honesty over flair on search thumbs)
##  + language pass (training un-bolded to functional-only, descent
##     language replaces zoom-to-land everywhere, intro tightened)
## PRE-SHIP REVIEW (2026-07-18, Nick's final-check ask; 2 review agents
## + self-review, findings fixed in-batch):
##  FIXED: per-frame biomeFor/wxEventFor alloc on the surface status
##  line (heat rule — now env-cached per spell bucket); stale descent
##  confirm on zoom-out/travel (_descAbort); cached vista header lost
##  the biome name on re-view; the mining Guide topic still taught
##  "zoom all the way in" (G10 residual); Atlas entries now BOOKMARK
##  UNDER THE BIOME NAME (G6 real fix — "swamp"/"carbon" searchable;
##  pre-1.3.5 entries keep type labels, honest); hull1 now trims
##  wave-off scrapes (G4 promise); gold "Through the fire" toast on
##  first grounding of a <=30% world (G7); 7 Guide teaching lines
##  (G19: survey/discover/kingdoms/breeding/colors/charters/search);
##  'Against All Odds' achievement — catalogue an extremophile (G1);
##  cross-pool breeding smoke checks (G2).
##  DEFERRED, NOW RECORDED (completeness agent caught the silent
##  drop): HAZARDOUS FLORA (spore-bursts/snap-traps/acid sap + the
##  fatal-meal linkage G15 + scout-absorbed sample scrapes) — NOT
##  BUILT in v1.3.5; queue with the 5b portrait-materials work.
##  Also still open as candidates: 'Witness a colossal wanderer'
##  charter; first-sighting gold caption for wanderers; per-hue
##  color rarity (currently 17 hides uniform ~5.9% — finish rarity
##  rides the creature tier instead; making hues rarer for NEW
##  creatures is a domain call for Nick).
## SUITES AT BUMP: fingerprint 50/50 byte-identical (zero re-pins
## needed), smoke 211/211 (+38 new checks), systems 19/19, balance
## PASS. New tools: proofsheet.js + sheets/ (headless-Edge art review;
## 5 proof rounds inspected, 3 in-review fixes).
## AWAITING: Nick's deploy word; his device pass (esp. terran biome
## washes + aura feel + boot time on his big save — G14 still open).

## ★★ v1.3.6 "QUIET SKIES" IS LIVE ★★ (2026-07-18, build c1bac38,
## Nick: "build it and deploy it"). + hover cards live at SYSTEM scale
## only (a tap is intent, a hover is an accident — sweeps at galaxy
## scale strobed every star card; taps unchanged everywhere). From Nick's desktop live pass:
## training rigs now -1 (beat ANY odds — a failed training breed ate
## both parents and stranded him); training hover glances step-scoped
## (his "one voice" ask — find-earth lets Earth glance); STAR CHARTS
## setting (Graphics, OFF default, save field chart) hides orbit
## paths/hz band+label/belt label/Oort dashes; surface zoom capped
## 600->6 (tile smear + untextured region at extreme zoom); EARTH
## EXEMPT from the biome roll (was re-labeled "Savanna world" against
## its own card). RELEASES[0]=1.3.6 staged hidden. Suites: fingerprint
## 50/50, smoke 218/218, systems 19/19, balance PASS.

## ★★ v1.3.7 "ONE LESSON AT A TIME" IS LIVE ★★ (2026-07-18, build
## 840e651). Training answers ONLY the lesson: survey-card actions gate
## to per-step acts:[] whitelists (Nick landed on Earth mid-atlas-
## lesson — the whole panel was an allowed surface); specimen-card
## verbs gate to per-step rev:'' (card-tour keeps the reversible scout
## toggle); the vista backdrop is near-opaque dark space (the ground
## close-up leaked through the blur). Suites at ship: fingerprint
## 50/50, smoke 219/219, systems 19/19, balance PASS.

## ★★ v1.3.8 "THE VIEW HOLDS" IS LIVE ★★ (2026-07-18, build 5b9652d).
## LANDING NEVER LEAVES SPACE: surface mode is unreachable — the zoom
## transition holds at approach framing and _performLanding runs the
## rites spaceside; openLandingVista derives clock/weather/roster
## standalone (planetDescriptor fallback when no card is open); Land
## button + confirm land at approach zoom; the Landing vista button
## rides any grounded world's system card and REBUILDS after reload.
## Training zooms but never lands. Vista ✕ now in every vista incl.
## training; ? popover obeys the one-panel rule (Nick's settings-
## under-helppop overlap). NOTE: drawSurface + the surface caller
## block are now dead code — PURGE CANDIDATE for a cleanup batch
## (kept this ship for zero-risk deploy). v1.4 panel exceptions
## (inventory+bench co-open) deferred to the Fabricator design.
## Suites: fingerprint 50/50, smoke 220/220, systems 19/19, balance
## PASS. (Also note: Nick's 1.3.7-era reports came from a CACHED
## 1.3.6 client — the update pill matters; watch his next session
## picks up 1.3.8 cleanly.)

## ★★★ v1.3 LINE COMPLETE — SEVEN SHIPS IN ONE DAY (2026-07-18) ★★★
## 1.3 (HD Frontier, pre-session) → 1.3.5 Soft Landings (bc70152) →
## 1.3.6 Quiet Skies (c1bac38) → 1.3.7 One Lesson at a Time (840e651)
## → 1.3.8 The View Holds (5b9652d) → 1.3.9 Eyes on the Lesson
## (1caf852) → 1.3.10 Kingdom ShelVES IS LIVE (89ac8c9, FINAL v1.3
## UPDATE — Compendium kingdom chips + tinted shelves; chips hidden in
## training; counts read the filtered truth). Ship-gate suites green
## on every ship; final exploit sweep PASS (wvo clamped, chart strict,
## samples/charters unfarmable, wave-offs grant nothing, filter
## transient). Fingerprint ended the day 50/50 byte-identical with 3
## documented single-key re-pins. Smoke grew 173 -> 227.
## THE v1.3 LINE IS CLOSED. Next session opens v1.4 "THE ASCENT".

## ▶▶ NICK'S DIRECTIVE ROUND (2026-07-18, third pass — ALL BUILT):
## · EQUIPMENT = NINE SOCKETS (his slot set): Helmet · Earpiece ·
##   Necklace · Suit · Gloves · Leggings · Boots · Tool · Module.
##   New gear per slot (headlamp/visor/Voidglass visor; comms earpiece
##   + reslotted Vein Resonator; meteorite pendant/Star Compass/
##   Diplomat's Beacon/Prismatic Pendant; grip+surgeon's gloves; field
##   leggings/greaves; mag-boots/Graviton Boots). Medkit removed
##   (Surgeon's Gloves carry heal). 4 new icon families, proof-sheeted.
## · "Planetside" replaces "Landing vista" (his pick) — button + notes.
## · Duel skip label = "⚔ Skip" (his emoji call).
## · AUTO-EXTRACTOR LOADS COUNT (try-and-iterate): stats.mines and
##   Ascent mining goals count loads, not presses; wording back to
##   "loads of ore".
## · EARTH HARVESTS (audit fix applied): home is settled-from-start and
##   now pays hourly stardust like any settled world (card was gated on
##   a fauna roster Earth's hardcoded rows never had).
## · BIOME-GATED VEINS (his "very cool, do it"): geode→Nd, carbon→Pm,
##   glass→Vg, magmasea→Pz — guaranteed ✦ vein on the card, steady
##   trickle on pulls, rich strikes there ALWAYS hit the exotic;
##   RARE_VEIN luck elsewhere untouched (no card contradictions).
##   Grail recipes consume them (Voidglass Visor, Graviton Boots,
##   Prismatic Pendant; Warp Fold already ate Pz).
## · BEACON REWORKED (his call, see how it plays): ring-scoped —
##   walks Sol at stage 0, Neighborhood/galaxy stars at 1-2, the old
##   far-cosmos walk at 3; stage-aware toast + Guide copy.
## · SHIPYARD on the character sheet: painterly SPACECRAFT side profile
##   (needle nose, swept fins — Nick: "not like a boat") that gains
##   each built system: jump engines, Array dish, extractor pod, IG
##   outriggers. Cached per built-set; proof-sheeted both states.
## · Mined-out-worlds-as-real-estate: LIKED, logged as v1.5 candidate.
## · PACING LAW (his close): Sol must mine+craft its way to the next
##   ring, then each ring funds the next — verified for ch1 (Sol veins
##   cover the whole Jump Drive chain + Earth harvest now funds ☄).
## Suites after the round: fingerprint 50/50, smoke 252/252, systems
## 19/19, balance PASS.
##
## ▶▶ HD COVERAGE PASS + SYNTHETIC PLAYTESTS (2026-07-18, fourth round):
## THE HD ENGINE LAW is now standing memory (Nick: everything visual uses
## the painterly engine, forever). Full-code audit (1 agent + proof
## sheets) found 11 flat holdouts — ALL FIXED: banded per-seed RING
## sprites w/ Cassini gap (was one stroked arc), typed lit-sphere MOONS
## (was flat tinted discs), shaded DWARF planets, 'Oumuamua-style
## INTERSTELLAR VISITOR sliver (was a fillRect), comet COMA, WORMHOLE
## gravitational-lensing sprite (was stroked ellipses), QUASAR sprite
## (host+core+jets, view AND thumb), PLANETARY NEBULA joins decoSprite
## (the last stroked-circle death), rogue-planet rim orb, pulsar beams
## tapered everywhere, NS thumb glow, BINARY-PAIR star thumbs, per-moon
## seeded moonThumb craters. Verified-HD coverage map in the audit
## (tools/sheets/v14space.png is the proof sheet). drawSurface confirmed
## dead code (purge candidate, unchanged).
## SYNTHETIC PLAYTESTS (new tools/simrun.js, Report Pack):
##  · 1,000 fast persona expeditions (miner/sprinter/explorer/rancher/
##    chaotic; land/mine/craft/equip/scan/feed/breed/heal/harvest/
##    beacon/jump via probe hook) — ZERO errors, ZERO invariant
##    violations, ZERO softlocks; 22 deaths all from toxic-meal gambles
##    (WAD); wave-off floor held (explorers pinned at 1 HP, never
##    died); Jump Drive reached in p50 181 actions (focused sprinters
##    ~89-180 ≈ the 30-45min human target); stage 2 needs conquest +
##    weekly economy (beyond a 3-min session — expected).
##  · 60 full-UI 18-step training playthroughs w/ seeded random choices
##    (11 via skip path) — 60/60 complete, zero stalls, zero errors.
##  · probe-names grew to 146; simreport-fast/ui.json keep full data.
##
## ▶▶ v1.4.1 "THE RING SPECTRUM" LIVE (2026-07-18, builds c3ea6ce →
## 5337a68 → a3dd448; Nick: "cap the tiers by ring… apply it across the
## whole board"):
##  · CREATURE grades cap by catalog location: Neighborhood→Legendary(5),
##    home galaxy→Mythic(8), regions 0/1/2→9/10/11, Deep Field+→summit.
##    App-layer (genomes/power/portraits/codes untouched); guardians+
##    Paragons exempt; bred/imported never capped; per-entry rc marker =
##    nothing already catalogued ever downgrades.
##  · WORLD/STAR designations obey the same ladder on NEW saves (rsw
##    flag; veterans' cards never rewrite). One clamp at the descriptor
##    memo → spoils/veins/reserves/samples/signatures all inherit.
##    Survey fixes: card row rewrites with the clamp; worlds clamp in
##    their OWN SPECTRA ladder (Red-Gold, not Gray-Gold); duel side-
##    cards tint by catalogued grade (budgets stay raw+deterministic).
##  · **levelOf HOTFIX (deployed 5337a68, was LIVE-BROKEN)**: never
##    exported from CombatCore → every victorious duel/conquest with a
##    CREATURE champion threw in awardXP, aborting the win (no
##    conquered.set/spoils/guardian/signature/ch2 credit). Player-as-
##    champion skipped it — why humans never saw it. Caught by the
##    700-run deep sims (501 hits). Smoke regression-locked.
##  · BOARD-WIDE RARITY SURVEY (agent, recorded verdicts): veins/
##    reserves/spoils/samples/breeding/rare-find all inherit the ring
##    via the clamped tier; biomes/extremophiles/wonders/paragons stay
##    position-free BY DESIGN; battle-budget capping REJECTED (would
##    desync shared-code duels). NICK DIALS PENDING: (a) route Apex
##    grades out of stats.best so one early guardian doesn't detonate
##    six Rarity achievements; (b) biome-vein valve (grail exotics
##    craftable in-galaxy via hard landings — recommended KEEP open).
##  · SYNTHETIC REPORT PACK: 300 chaos trainings (100% complete after
##    the Escape fix) + 700 deep expeditions on the fixed build (0
##    errors, 519 conquests, ring spectrum visible in the data: best-
##    catch p50 = Legendary; jump p50 64 acts, Array p50 378, IG 2/700;
##    fun-index p50 5.7, rancher/explorer highest). 3 player-critic
##    agents (collector/optimizer/explorer) reviewing for the fun
##    matrix + recommendations. simrun.js modes: ui/chaos/fast/deep.
##
## ★★★ v1.4 "THE ASCENT" DEPLOYED 2026-07-18 (build 4d28528, Nick:
## "deploy and do our standard post-deployment checks") — LIVE at
## celestialfrontier.github.io, version.json serving v1.4. ★★★
##
## POST-DEPLOY SWEEP (2 audit agents + chaos-sim + self):
##  HEAT: baked the last per-frame gradients from the HD pass (rogue
##   orb, pulsar beams, NS cores incl. the system-view straggler, the
##   visitor trail) into shared sprites.
##  EXPLOIT AUDIT — 3 fixed: auto-extractor clock-warp/save-edit farm
##   (mined stamps now clamp to one accrual window before a new `at`
##   wall-clock save stamp), mx save cap that could refill finite
##   reserves (uncapped — minedw stored the keys anyway), c1-mine Sol
##   filter (was relying on the travel lock). Determinism, crafting,
##   Ascent gates, save-tamper hardening, consumption loops all CLEAN.
##  MISSED-SCENARIO AUDIT — fixed: **DEATH SOFT-LOCK** (pre-v1.0! the
##   in-place rebuild never hid the z-50 deathbox — "new expedition"
##   ran under a permanent overlay; Settings→Reset masked it since it
##   never opens deathbox); resetMemoryState missed claimedSets (Binder
##   bounties unclaimable post-death) + lastAnomKey/_parSites/nameHue/
##   _chBadge; biomeVeinFor determinism guard (roll now consumed either
##   way); _eqOpen clears on stats close; auto-extractor restamps mined
##   worlds on build (no retroactive windfall); stranded-boot on a
##   gated CF1 hash now falls back to saved-view; copy sweep (nine
##   sockets / click-mine / beacon-per-ring tooltip / tiers12 dup /
##   search topic). Endings, training×v1.4, share codes, panel manager,
##   achievements all verified CLEAN.
##  CHAOS SYNTHETIC TEST (300 adversarial UI-training runs — random
##   clicks/Escape/panel-storms between every step): found + fixed a
##   REAL strand — **Escape during the training duel closed it and
##   hung the tutorial forever** (the input lockdown covered taps, not
##   keydown; Escape now inert on lesson modals while !tutDone). After
##   the fix: 300/300 complete, 0 breaks, 0 stacked panels, vista +
##   helppop + one-panel rules all held under the storm.
##  Suites green after every fix: fingerprint 50/50, smoke 253/253,
##  systems 19/19, balance PASS. (700 deep progression runs +
##  player-critic fun report in flight.)
##
## ★★★ v1.4 "THE ASCENT" IS LIVE ★★★
## (2026-07-18, second session; commits 0f39b99 + ff0abfe + review batch.
## GAME_VERSION bumped to '1.4' [Nick commissioned the 1.4 build this
## session]; NOT deployed — deploys only on Nick's word.)
##
## PART 1 — NICK'S v1.3 LIVE-PASS FIXES (folded into the 1.4 bulletin):
##  · ? popover closes on outside tap (it lives in MODAL_SEL, so it got
##    its own dedicated closer)
##  · ASTEROIDS ARE ROCKS: baked 8-variant shaded lump sprites (grey
##    belt + icy Kuiper families) replace the fillRect squares — system
##    view AND beltThumb; proof-sheeted (tools/sheets/v14icons.png)
##  · CARD ANCHORING: locked cards + hover glances ride WITH their
##    planet through pans/zooms (offset anchoring via _frozenPick;
##    _livePick matches picks by P.seed since pick objects are rebuilt
##    per frame) — Nick's screenshot: Earth's card stranded across the
##    screen in training
##  · COMPENDIUM SHELVES: realms fold onto one habitat language for
##    display (Gas Giant Life→Aerial Fauna, Amphibious/Cave/
##    Extremophile/Sapient/Hive Fauna); card badges keep the precise
##    realm; Warden-of-Realms untouched (display-only _SHELF_OF)
##  · TRAINING IS A SAFE ROOM: all three rolls (feed/breed/heal)
##    rigged on EVERY step while !tutDone. ROOT CAUSE FOUND: the 1.3.6
##    {feed:-1} rig GUARANTEED poisoning — feedPair poisons on LOW
##    rolls (roll<pois), so -1 always failed. Feed rig is 0.99 now.
##  · DUEL SKIP: ⏭ Skip-to-the-outcome button; auto-play stays default
##  · VISTA IS A WINDOWED POP-UP: .vcard frame floats over the dimmed
##    game, ✕ on the frame (was: full-screen takeover, ✕ in the screen
##    corner). "Landing vista" WORDING: brainstorm list delivered to
##    Nick, NOT renamed — his pick pending.
##
## PART 2 — v1.4 CORE (the four systems, intertwined):
##  · MINING REBUILT (Nick's spec): click=pull, NO timer; varying haul
##    seeded by extraction INDEX (hashInt(seed,0xE1F,n) — same for
##    every explorer, no reroll exploit); FINITE reserves
##    (reserveFor: ~420-800 pulls ×(1+tier*0.35); card counts pulls
##    left; mined-out is forever); rich strikes (5%+tier+gear) hit
##    rare-vein pockets; AUTO-EXTRACTOR accrues 1 load/10min offline
##    (cap 30) once built. Save field mx (absent⇒veterans full).
##    Also fixed: resetMemoryState never cleared mined/cargo/tech.
##  · THE FABRICATOR: Cargo panel tabs Inventory/Fabricator/Research.
##    ~30 recipes: T1 parts → T2 components → T3 ship systems + gear.
##    ELEMENT PICKS AUDITED AGAINST SOL'S ACTUAL SEEDED VEINS (Mercury
##    Fe/Al/Ca/Cr · Mars Si/Cl/Ca · gas giants H/He/CH4/NH3/He3 ·
##    Uranus ices/O — NO Cu/Ti/C/Li in Sol, hence Aluminium Wire,
##    chromium Steel Frame, methane-cracked Carbon Weave, H/O Power
##    Cell) so Chapter 1 is craftable without leaving home. Painterly
##    partIcon() shape families (proof-sheeted, 4 icon fixes from
##    review: array-leaf→radar dish, rig-arrow→drill, struts-kite→
##    lander tripod, coil core lit).
##  · EQUIPMENT (ARPG pillar): 5 sockets on the character sheet
##    (Suit/Tool/Module/Instrument/Charm), tap-to-pick, live effect
##    readout, fresh-craft auto-equips into an empty matching socket.
##    Wired: yield/strike (mining), land + per-family hazard suits
##    (Thermal/Pressure/Cryo +30 on their families) + Gravitic Anchor
##    land100, struts scrape cut, scut (routeHit — bioscan AND failed
##    contact), contact +%, heal +%, speed (driveMult+charm).
##  · THE ASCENT: 3 chapters on the charter machinery (ascEvent via
##    gameEvent), pinned .ascbox atop the Charters panel. NEW saves
##    (save field asc; ABSENT⇒complete=veterans) start Sol-locked.
##    Ring ladder = ascStage(): 0 Sol only → 1 Jump Drive: Neighborhood
##    (GR*0.25 around SOL_POS) → 2 Long-Range Array: whole home galaxy
##    → 3 Intergalactic Drive: REGIONS/prime-sig ladder as before.
##    GATES (travel only, never curiosity): star entry in
##    checkTransitions, galaxy entry via reachRadius (UCELL*0.35 at
##    stage<3), wormhole transit, travelTo, travelToCode; charter ring
##    drawn in-galaxy with the next build named on the label;
##    charterBlock speaks ascHint() while the Ascent gates. Chapter 1
##    announced at training end (new saves only).
##  · 9 Engineering achievements; Guide chapters 'The Fabricator &
##    gear' + 'The Ascent'; mining topic rewritten; RELEASES v1.4
##    entry (fixes + features).
##  SUITES AT BUILD: fingerprint 50/50 byte-identical, smoke 251/251
##  (+24 new: helppop close, duel skip, vista window, shelf mapping,
##  mining pulls/reserves, Sol lock matrix, craft chain, self-equip,
##  ring stages, veteran grandfather), systems 19/19, balance PASS.
##  probe-names grew to 129 hooked names. NEW TOOLING:
##  tools/sheets/v14icons.js (icon + rock proof sheet; 4 in-review
##  icon fixes).
##
## PRE-SHIP REVIEW (2 agents + self-review, 2026-07-18 — ALL CONFIRMED
## FINDINGS FIXED IN-BATCH):
##  · cosmic-event "Witnessed" credit + Beacon pilgrimage credit no
##    longer awarded when the Ascent refuses the jump (was: cinematic +
##    achievement + "you are being sent" with the camera parked)
##  · CURIOSITY UNGATED (the review's philosophical catch): foreign-
##    galaxy BROWSING + wormhole rides stay open at every stage
##    (reachRadius back to regional; ascAllows gates only star/system
##    dives; wormhole far mouth is a view — its stars stay drive-gated)
##  · chapter progress BANKS across chapters (out-building the current
##    chapter no longer discards Ch3 work; while-loop completion);
##    c1-land gained its Sol filter
##  · stage-0 starter charters (scan/scout/conquer — impossible in
##    lifeless Sol) say "awaits the stars" on the board and the
##    completion toast never points at them
##  · Field Medkit no longer sharpens poison (dmg keys off unboosted
##    heal); "pulls" wording aligned everywhere (counts = presses)
##  · plain mining pulls stay out of the 60-cap bell tray (rich
##    strikes / first mine / mined-out still log); mx save cap keeps
##    deepest-mined worlds + load-time backfill (mined-out can never
##    silently refill); star-gate camera clamp *0.97 BELOW the dive
##    trigger (was: ascBlock toast every 1.8s forever); in-place reset
##    hides the cargo button/panels (showCargoBtn can hide now);
##    "Ship System Online" cinematic queues BEFORE the chapter-complete
##    cinematic it causes; paragon plot-a-course respects the gate;
##    equipItem fires checkAch (Outfitted lands on equip)
##  STILL OPEN (Nick decisions, see audit report): Earth-harvest
##  economy hole (settled-since-start Earth has no Harvest button —
##  pre-existing, now visible because Earth is a stage-0 player's only
##  settlement); auto-extractor loads deplete reserves but count as
##  one "pull" per collection press (wording now says pulls; counting
##  loads instead is a design call).
##
## DEFERRED FROM THE v1.4 DESIGN (recorded, not built): COOKING &
## PROVISIONS (meals/flora produce — the flask slot), FRONTIER RECORDS
## board, ARCHAEOLOGY/FOSSILS, hazardous flora (still open from 1.3.5),
## biome-gated rare veins ("rarer worlds' veins gate rarer recipes" —
## rare veins exist via RARE_VEIN tiers but biome doesn't gate them
## yet), beacon/weekly-charter awareness of the Sol lock (see audit).
##
## ▶▶ PREVIOUS SESSION AGENDA (v1.4 KICKOFF) — kept for the record.
## SHIPPED THAT SESSION: v1.3.5 "Soft Landings" (build bc70152) +
## v1.3.6 "Quiet Skies" (build c1bac38).
##
## 1. NICK'S LIVE PASSES of 1.3.5+1.3.6 (screenshots are bug reports):
##    watch terran biome color identity (savanna gold / swamp gloom
##    want palette-level tuning), jungle density, aura feel, extremo-
##    phile hunt pacing, descent feel on phone, boot time on his big
##    save (STILL unverified, G14).
## 2. v1.3.x DEBT (small, shippable anytime): HAZARDOUS FLORA (the
##    recorded deferral — spore-bursts/snap-traps/acid sap + G15
##    fatal-meal linkage + scout-absorbed sample scrapes; queue with
##    extremophile portrait materials); wanderer-witness charter +
##    first-sighting gold caption; NICK DOMAIN DECISIONS: Eyeball
##    World (Seasons row), per-hue color rarity, V2 galaxy morphology,
##    V13 crossGenome gaps.
## 3. START v1.4 "THE ASCENT" — goals + full design below (north star,
##    ring ladder, recipe spine, chapter engine, equipment screen,
##    cooking, hazmat suits). BUILD ORDER stands: a) recipe spine
##    (bench data + Fabricator tabs), b) chapter engine on charters,
##    c) Chapter 1 Sol lock (NEW saves only, gate TRAVEL never
##    CURIOSITY, first jump <=45min), d) chapters 2-3 + ring ladder on
##    reachRadius. HOOKS ALREADY LIVE IN 1.3.5: descentBonus() gear
##    socket, biome rare-material flavor, extremophile g.x packs, the
##    'risk is the frontier, gear tames it' law.
## 4. Standing rules: extract.js first; proofsheet.js + sheets/ for
##    ALL art review (headless Edge); deploys on Nick's word; baseline
##    re-pin protocol single-key only (3 sanctioned re-pins exist);
##    core.autocrlf false (a stash cycle once CRLF-corrupted the
##    toolchain).

1. NICK'S LIVE PASS of v1.3 (his screenshots are bug reports — read
   them closely). Watch for: vista variety across many landings, aura
   feel on his real Compendium, postcard flow on iPhone, boot time on
   his big save.
2. START v1.4 "THE ASCENT" — full design already below (Sol lock-in →
   Jump Drive → ring unlocks: Milky Way slice → Local Cluster →
   outward). SUGGESTED BUILD ORDER:
   a. RECIPE SPINE first (pure data + Fabricator UI): T1 basic parts /
      T2 components / T3 ship systems, procedural part icons in the
      _hdElemIcon language, Research Bench → Fabricator tabs. No
      gating yet — veterans just get a new bench to play with.
   b. ASCENT CHAPTER ENGINE on the charter machinery (ordered chain,
      chapter panel pinned atop the charter board, save fields with
      absent-safe defaults = veterans complete).
   c. CHAPTER 1 "Off the Rock": Sol lock (NEW saves only; gate TRAVEL
      never CURIOSITY), Moon/Mars/asteroid mining goals, Jump Drive
      recipe, first jump ≤45 min. Smoke needs a full chapter-1 drive.
   d. Chapters 2-3 + ring ladder on reachRadius.
3. Deferred graphics polish (only if Nick asks): real crescent phases
   (needs sprite relight — city-lights conflict), surface-view F1/F3/F4
   nits, galaxy interior morphology V2 + crossGenome inheritance V13
   (both DOMAIN changes — Nick decisions, unchanged).
4. Mechanics: extract.js first; deploys only on Nick's word; the
   baseline re-pin protocol (single-key, diff-verified, documented) is
   the ONLY sanctioned baseline touch.

## ▶▶ THE GRAPHICS OVERHAUL — APPROVED IN FULL (Nick, 2026-07-17: "I want
## to include all of this") + NEW PILLAR: ENGINEERED INFINITY
##
## Nick's addition: "be sure there's infinite possibilities with the
## planets, stars, flora, fauna — a very high likelihood we're going to
## see variations we never seen before. This is the main discovery aspect."
##
## THE INFINITY ARCHITECTURE (all app-layer, deterministic per seed):
##  L1 CONTINUOUS DIALS — kill every fixed anchor/color: river course,
##     horizon, sun x, plant branch/droop/leaf genes, aurora hue pair,
##     star-face spots/corona, island layouts, beast spots/facing — all
##     become seeded parameters.
##  L2 COMBINATORIAL RECIPES — portraits draw ALL the genome (16 bodies ×
##     9 hides × 18 locos × patterns × traits); plants get species genes
##     from world palette+heat; thumbs read the whole card.
##  L3 WONDER ROLLS — rare card-derived visual events, combinations rarer
##     still: rings overhead (P.ring), giant/low moon, twin suns (binary
##     card fact), bioluminescent night shores (life+dark), meteor
##     showers, exotic sky tints (atmosphere row), vegetation hue
##     families (chlorophyll common; copper/violet/crimson rare).
##  Law holds: every wonder must trace to a card fact + seed. Where the
##  card TEXT already varies (FA_TRAIT "bearing crystal antlers",
##  atmosphere rows), the art now FOLLOWS the text — infinite because
##  the text pools are combinatorial, honest because the card said it.
##
## BUILD ORDER (each batch: build → validate/smoke/systems → commit):
##  BATCH A ✓ DONE (bde0603) — V1-V11 honesty fixes + I2-system + I9
##  BATCH B ✓ DONE (9ea3d7e) — vista re-view/fade/chrome (B1+B3)
##  BATCH C ✓ DONE (59f56e9) — galaxy star sprites + textured deco
##            pre-renders + cluster sprites (I1+G2+G5). NOT done: V2
##            morphology + I4 per-seed galaxy sprites — V2 needs a
##            DOMAIN change (star positions move vs the frozen
##            fingerprint baseline) → NICK DECISION, see below.
##  BATCH D — partially absorbed: I2 star-tint (system ✓ in A, vista ✓
##            in E; surface dawn/dusk STILL OPEN), I3 rings-in-sky ✓ in
##            E (daytime moons still open), I12 real crescents OPEN.
##  BATCH E ✓ DONE (df64e84) — INFINITY CORE: seeded compositions,
##            per-world flora species + rare hue families, seeded
##            aurora families, herd scaling, wonder rolls (rings sky /
##            looming moon / biolume shores / star-tinted noon).
##  BATCH F1 ✓ DONE (f372d0b) — V12 portrait anatomy overhaul, HD-GATED:
##            the fingerprint PINS Classic portrait bytes (learned by
##            hitting it), so HD_PORTRAITS rides the hd flag via applyHd.
##            All 16 body plans distinct, skin/loco/trait drawn, eyeless
##            honest, Guardian gold / Paragon teal rims.
##  BATCH F2 — REMAINING: I7 specimenCard wiring, I13 small thumbs
##            (per-moon seeds, binary star thumbs, quasar sprite,
##            filament web blobs).
##  RELEASES[0] bullets written for everything Classic-visible (galaxy
##  stars, card-honest pictures, rarity uncap) + the HD infinity/portrait
##  additions folded into the HD bullets (rule 7 satisfied pre-deploy).
##  BATCH F2+G ✓ DONE (1c5e990): painterly player avatar, tunnel
##            per-destination lanes + outward rush + heat fix, vista
##            POSTCARDS (PNG with name + CF1 code baked in), conquest
##            ARENAS (defender's biome behind the duel card) + guardian
##            entrance cinematic w/ portrait, PER-SEED galaxy sprites
##            (kind-locked to the card; archetype placeholder + LRU
##            bake). Also earlier: fungi/microbe painterly portraits,
##            rarity AURAS (grade-scaled; Nick's foil call), HD material
##            icons, atlas live thumbs, lazy art, dead code purge, human
##            copy pass over intro/notes/training.
##  HD IS ALWAYS ON (Nick's ship call, 2026-07-18, f9c6012): the Landing
##            view setting is GONE; old saves' hd field ignored. BASELINE
##            RE-PIN: exactly one probe (speciesPortrait art bytes)
##            changed; all 49 domain probes verified byte-identical
##            before the surgical single-key re-pin (note in
##            baseline.json). Wholesale regeneration remains banned.
##  STILL DEFERRED: real crescent phases (runtime shadow mask conflicts
##            with night-side city lights baked into planet sprites —
##            needs a sprite relight rework); F1 tile-proxy fallback,
##            F3 surface aurora seeded hues, F4 cloud-shadow prerender
##            (minor surface-view polish).
##  NICK DECISIONS PENDING (domain/baseline changes, NOT built):
##  - V2 galaxy interior morphology (ellipticals stop being spirals) —
##    moves star positions vs the determinism baseline.
##  - V13 crossGenome inheritance gaps (5 genes never inherit; limbs/
##    accent never mutate) — changes future bred children.

## ▶ GRAPHICS PASS FINDINGS (2026-07-17, 3 audit agents + spot-verified;
## the raw finding list the overhaul above was built from)

LAW VIOLATIONS (card contradicts picture — fix-before-ship candidates):
 V1 terran water ignores climate band: liquid blue oceans painted on
    "Mostly evaporated" and "Frozen into ice sheets" worlds — in the
    system sprite, card thumb AND surface tiles (surfaceColor takes no
    band; verified). One parameter threads all three.
 V2 galaxy morphology: card says Lenticular/Elliptical/Irregular, the
    interior is ALWAYS a 2-3-arm spiral; interior hue ≠ exterior sprite
    hue (16 shared archetype sprites for the whole universe).
 V3 desert "Sparse, hardy vegetation" + fauna worlds vista as EMPTY
    dunes (green-life block gated !desert).
 V4 system-view moons all render flat grey; the moon card + thumb are
    typed rocky/icy/volcanic/captured.
 V5 gas giants: card promises "auroras crown the poles" + immense
    field; no view ever shows it.
 V6 vista era flattening: Modern-era civs render the medieval keep
    (everything below spacefaring → 'iron').
 V7 civilized worlds lose their river (river block requires civ none).
 V8 WITHDRAWN on verification: ice/desert/rocky/venus worlds can NEVER
    have a magnetosphere (hasField = terran/ocean/gas/Earth only), so
    the card never promises them auroras — the vista is already honest.
 V9 planetThumb ignores rings/civ/life/band (P.ring never in the thumb).
 V10 rarity presentation: reveal cinematic CLAMPS tier at 8 (an
    Omnipotent find celebrates as a Mythic); Compendium rows never foil
    at summit; Binder Paragon slots hardcode teal regardless of grade.
 V11 Si missing from the EC icon palette (mined on rocky/desert/dwarf,
    used in a research cost — renders generic gray).
 V12 portraits: "eyeless" fauna get eyes; mottled/plain draw nothing;
    11 of 16 FA_BODY plans share one ellipse; skin/loco/trait ignored;
    Guardians/Paragons get zero bespoke visual anywhere.
 V13 (domain! Phase 2 + fingerprint decision) crossGenome never
    inherits temper/sense/repro/life/metab; limbs+accent can never
    mutate. Fixing changes generated children → baseline question.

VISTA FEATURE-BAR BLOCKERS:
 B1 see-once art: any stray tap dismisses instantly, no fade, no ✕, NO
    RE-VIEW — cache the args + "Landing vista" action on the surface
    card; fade in/out (cinema's .on pattern).
 B2 one composition per type: fixed horizon/sun/river/island/volcano
    anchors — every temperate terran is the same painting. Seeded
    layout variants.
 B3 vistabox chrome off-language (ad-hoc border, no glass, hint doesn't
    match cinema's dismiss convention) + phone-landscape letterboxing
    (width needs calc(70vh*2.233) clamp) + no safe-area padding.

HEAT-RULE VIOLATIONS FOUND (per-frame allocations): galaxy nebulae/
remnant/supernova gradients; surface cloud-shadow gradients (4/frame);
travel-tunnel gradient + mulberry closure per frame (also: same fixed
90 streaks every trip, seed 0x7261).

TOP UPGRADE IDEAS (proposed to Nick, his picks):
 I1 galaxy star sprites — 13 pre-rendered per-class glow/spike sprites
    replace flat 1-2px arcs + twinkle on the brightest (HIS SCREENSHOT).
 I2 star-colored light EVERYWHERE: spectral class tints vista sunlight,
    system planet lighting, surface dawn/dusk (st.star.c is one
    argument away; verified available).
 I3 rings in the vista sky when P.ring (+ daytime moons).
 I4 per-seed galaxy sprites (LRU like hazeCache) — every galaxy unique,
    thumb/interior/exterior agree; fixes V2 with the same plumbing.
 I5 vista postcards: save/share a landing vista stamped with world
    name + share code (rides the existing share-code loop).
 I6 battle staging: seeded arena backdrop behind duels/conquest from
    the defender's world type (habitat-scene generator reusable as-is);
    guardian intro card at scale with summit foil.
 I7 wire the DEAD specimenCard (finished painterly labeled card art,
    never exported/called — verified) into reveal/Compendium detail.
 I8 ambient motion, rmotion-gated, zero JS: 60-90s CSS slow-pan on the
    vista canvas; cinema-style fades.
 I9 city lights for every civ world's night side, era-scaled (currently
    an Earth-only easter egg) — sprite + thumb + classic tiles.
 I10 herd size scales with the roster (5+ on teeming worlds, distant
    silhouettes); per-world plant species (palette/heat-driven variants,
    2 per scene — one tree universe-wide today).
 I11 classic-mode card-honesty nods: vegetation tint + era night dots
    on tiles, star-tinted terminator (non-HD players see the card too).
 I12 real crescent phases in system view (shadow-mask sprite over
    unrotated planet — features stop spinning with orbit).
 I13 moon thumbs seeded per moon; binary-pair star thumbs; quasar
    sprite; filament-shaped web blobs (universe view).
 I14 Rings/Moons rows on the planet card (facts render but aren't ON
    the card — reverse law gap; touches descriptor = design call).
 DEAD CODE to prune or keep for tests: ocean harbor + ember fauna vista
 paths (unreachable by domain rules: civs need Abundant land life).

## ▶ ITERATION 2c (2026-07-17, same session): CARD UX + SETTINGS AUDIT

- SURVEY CARD ✕ + DRAG (Nick's ask): locked cards wear a ✕ (close;
  tapping empty space still works — the ✕ is the visible affordance);
  any open card drags by its HEADER, pointer events, mouse + touch
  (6px threshold so taps stay taps; touch-action:none on the head;
  drag position rides _frozenPos so the per-frame clamp keeps the card
  on-screen; surface card draggable too, defaults top-left). Hidden and
  inert during training. Smoke +4 (✕ present, drag moves+stays open, ✕
  releases the lock — cursor-hover legitimately reopens the GLANCE on
  desktop — re-lock works).
- SETTINGS AUDIT (Nick: "make sure all settings work"): agent audited
  all 12 controls end-to-end (wiring→apply→persist→load→edges).
  11/12 clean, incl. the historic fixes holding (rm never freezes the
  OS pref; vol taper; hd flag; notif gating; reset two-step). FIXED:
  Text size A+/A++ now also scales the Guide, Charters, Release Notes,
  pick/duel/share/Prime dialog cards and the settings panel itself
  (was: survey/list surfaces only); fs whitelisted on load (arbitrary
  body-class injection via a tampered save); flushToasts re-checks
  notifOn at fire time; _wiping guard actually arms during a wipe
  (was write-only-false) and releases after the in-place rebuild.
- Suites at commit: fingerprint byte-identical, smoke 167/167,
  systems 19/19, balance PASS.

## ▶ ITERATION 2b (2026-07-17, same session): THE WHOLE-SPACE PASS

Nick: "we're not just limited to these cards, right? account for
everything possible in the world and make sure it all looks great."
Confirmed generative (hdVista renders ANY card at planetfall; artifact
cards are examples). Then rendered the FULL reachable card space (43
scenes through showVistaBox's exact mapping) and fixed what read wrong:
- AURORA: smooth veil (2× overlapping gradient columns, alphas halved)
  — Nick's "lines through it" striping is gone; suppressed while
  rain/snow actively falls (a deck hangs above).
- WEATHER SPELLS (the big unlock): the Weather row is CLIMATE, not a
  permanent condition — whether it falls NOW is a seeded ~90s spell
  roll (same mechanism as the lightning bursts), shared by surface and
  vista; the surface status line says "clear skies" between spells.
  Without this, temperate terrans and ALL ocean worlds rained forever —
  the sunny meadow and sunny island scenes were UNREACHABLE in play.
- SNOW IS GROUND STATE: cold-band worlds keep the snow pal between
  falls (climSnow); flakes only while snowing.
- WATER ROW DRIVES THE RIVER: liquid / FROZEN ice ribbon with pressure
  cracks (cold worlds + deep winter) / none ("Mostly evaporated" hot
  worlds get no river).
- LIFELESS LAND = BARREN SOIL ground palette (meadow green promised a
  biosphere the card denies); no clouds on airless rocky worlds.

## ▶ v1.3 PHASE 1 ITERATION 2 — BUILT & VERIFIED (2026-07-17). The whole
## roadmap iteration list landed in one batch; still flag-gated, NOT deployed.

WHAT CHANGED (all inside @section hdart + the showVistaBox mapping):
- EMBER WORLDS (lava): new ember pal (smoke-black sky, red horizon glow),
  _hdVolcano (cone + crater glow + flank trickle + leeward smoke), the
  river course runs as a LAVA FLOW (crust plates, bank glow), emissive
  ground cracks, smoke banks with underlit bellies; wx 'ash' overlay =
  falling ash + rising embers. Fauna ember-lit with warm haze ('150,96,80').
- ISLAND SCENE (ocean worlds, biome:'island'): open sea to the horizon
  with per-pal water gradients (day/night/rain/twilight/snow), distant
  island silhouettes, sun/moon GLITTER ROAD (sparkle-dash envelope — no
  drawn shape; a wake-triangle draft violated the no-rays law and was
  cut), wave crests opening toward shore, beach foreground with foam
  lines + wet sand, era-scaled harbor on the big island (iron: keep +
  hearth dots; space: lit towers + beacon). Beasts and flora come down
  to the sand.
- SNOW: new snow pal (winter-grey light, snow-covered layers/ground) for
  terran snowfall; wx 'snow' overlay (round flakes at two depths + chill
  band) — ice worlds get falling snow too, and winter rain→snow (effWx)
  now reaches the vista.
- TWILIGHT: first-class pal, no longer a flat grade — indigo→amber dusk
  sky, LOW sun (sy=hz-30, sets behind the ridges on land, kisses the
  water on islands), dark cloud bellies lit from below, first stars,
  warm crest light, dusk grade on top.
- AURORA NIGHTS: opts.aurora (from env.hasField — the same magnetosphere
  fact whose card row says "auroras crown the poles") hangs curtain
  auroras over night scenes, twin hues 140/280 matching the live surface,
  column-striated with per-column gradients.
- SCENE-WIDE GRADING (proof-sheet findings, fixed in-batch): the river
  now WEARS THE SKY (night dark-steel + faint moon glints, twilight
  amber→violet; was summer-blue in every scene — glowed like a
  searchlight at night); plants darken to silhouettes at night / steep
  violet at dusk / frost in winter (_hdStampPlant darkAmt/darkCol);
  near beasts knocked back at night; sea-day sun halo softened (110px,
  0.62 alpha — glare dominated the open sky); beast tuft color per
  ground ('34,14,10' basalt, '86,72,44' sand); rain/dust/snow/ash
  overlays keyed to the card's wx TOKEN, not the pal (night rain now
  streaks); vista caption words the weather ("snowfall", "ashfall").
- WIRING: showVistaBox(P, tod, wx, era, genes, aurora) — era→harbor on
  islands too; lava→ember (the dust stand-in is gone); terran/ocean tod
  twilight→twilight pal, wx snow→snow pal.
VERIFIED: fingerprint byte-identical (all app-layer), smoke 155→163
(8 new scene checks render ember/island/aurora/snow/twilight/nightize/
bare-beach headless via the new hdVista probe hook), systems 19/19,
balance PASS. Proof sheet rendered via headless Edge (14 scenes) and
inspected — that's where the searchlight-river, day-glo-trees-at-night,
glare-halo and wake-triangle findings came from.
REVIEW ROUND (2 parallel agents, all confirmed findings fixed in-batch):
- CORRECTNESS: clean — executed all 1,728 caller-producible opt
  combinations headless (0 throws, 0 invalid canvas colors); plat/ridge2
  guards, pal fallbacks, hasField parity vs the card all verified.
- EDGE/DESIGN-LAW, 5 confirmed, 5 fixed:
  F1 ice/rocky/venus/desert at night rendered DAYLIGHT under a caption
     saying "local night" → new nightize grade (starlight + the card's
     moons + no sun/clouds/sun-crests) and duskize (dusk grade) applied
     to types whose pal has no clock; ember exempt (sunless either way).
  F2 moon-glitter road + river night-glints rendered with 0 moons →
     both now gate on the card's moons (moonless night = dark water).
  F3 aquatic fauna ("jet-propelled swimmers of the open ocean") stood
     legged on the beach → caller filters non-standing loco/habitat
     (swim/float/filter/drift; open ocean/sea shallows/cloud decks/vent
     fields) out of the vista party. TRUE body-plan genes stay Phase 2.
  F4 beach/meadow trees + grass fringe on "No known life"/microbial
     worlds → new flora flag from the card's Life row gates every plant
     stamp and the grass silhouettes (land + island scenes both).
  F5 night rain/snow fell from a clear starry sky → cloud deck now
     rides the night pal when the wx token precipitates.
ARTIFACT REPUBLISHED post-fixes (engine slice re-lifted verbatim).
ARTIFACT UPDATED (same URL): the Landing Zones section now renders from
the game's own hdart code (lifted verbatim), 11 scenes incl. the five
new ones; footer marks vistas "IN THE GAME, flag-gated, iterating".

## ▶ v1.3 "THE HD FRONTIER" — IN THE CODE, ITERATING (2026-07-18). DO NOT
## BUMP/DEPLOY until Nick's word; the hd flag keeps it invisible either way.

THE LAW (Nick, settled over the 2026-07-17/18 art sessions): **the card
drives the picture** — every render derives only from descriptor facts +
seed. Estimates vague-never-wrong. Nothing decorative the card didn't ask
for. No rays/spikes/glow-domes. Color language per [[Ink & Ember]].
The full visual bible lives as a claude.ai artifact ("Celestial Frontier —
v1.3 Visual Direction", Nick has the link) — galaxies (dust = suppressed
starlight, never painted), living system (star-lit belt/comet/ringed
giant/terran moons/phase strip), card-driven worlds (era-scaled night
lights, hurricanes, cloud shadows, gas storms), 4-generation breeding
inheritance, and the landing vistas.

PHASE 1 — LANDED IN THE GAME (this commit, flag-gated):
- New @section hdart [app] (~450 lines): _hdNoise/_hdFbm (seeded, no
  Math.random), HD_PALS (day/night/rain/dust/sand/ice/grey/haze),
  hdVista(opts) master renderer (biomes: green w/ river+life, iron-era
  keep+road+flanking-village+fields, spacefaring skyline grounded per-
  tower on ridgeY, deserts, ice crystals, rocky/venus palettes), moons-
  from-card night sky (max 3, radiant primary, no beams), weather
  overlays (rain 2-depth + road sheen streaks, dust banks + wind),
  twilight grade, hdGenesFor(genome)→visual genes (v1: seeded from
  genome seed + ability color; TRUE parent-trait inheritance is Phase 2),
  hdBeastBare + placement (lit-side-sunward flip, warm grade, seated
  tufts, distance haze), plant stamps (base-anchored, contact shadows).
- #vistabox overlay: planetfall (when hdOn) opens the panorama once the
  surface frame knows tod/wx and renderPanel has cached the descriptor
  (era parsed from Tech era row; genes from the fauna roster, max 2).
  Tap dismisses. Gas giants skip (no ground). lava→dust pal was a V1
  STAND-IN — replaced by the real ember scene in ITERATION 2 (above).
- Settings → Graphics → "Landing view: Classic / HD (beta)" — save field
  `hd` (absent ⇒ 0 Classic), applyHd(), probe hdOn. DEFAULT CLASSIC:
  main can deploy for hotfixes without exposing v1.3.
- Verified: fingerprint byte-identical (all app-layer), smoke 155/155
  (flag default/toggle/persist + full planetfall→vista→dismiss drive),
  systems 19/19.

## ▶▶ v1.4 GOALS (Nick, 2026-07-18 — THE NORTH STAR, verbatim intent):
## achieve the ability to space explore at a HIGH LEVEL with very large
## success rates — and everything that power is EARNED through the loop:
## - MINE materials across worlds → BUILD spaceships that travel faster
##   and farther (extends the drive ladder + the ring unlocks).
## - CHARACTER EQUIPMENT SCREEN: an equipment panel grows out of the
##   character sheet — gear SLOTS on your explorer (suit, and the slot
##   set to be designed). Materials found exploring worlds (biomes and
##   rare worlds drop the special stuff) build hazmat suits etc. that
##   let you land WITHOUT damage and push success rates toward 100%.
## - THE TWO FEELS, NAMED: Minecraft/Satisfactory resource-gathering
##   (mine → inventory → bench → build) + Diablo/Path of Exile ACTION
##   RPG (equipment on your character, loot-chase for gear materials —
##   the ARPG pillar now formally covers GEAR, not just fauna).
## - THE FOUR SYSTEMS of v1.4: crafting bench · inventory · character
##   equipment · resource gathering — fully intertwined into gameplay
##   (quests route through all four; nothing is a menu island).
## - UI MANDATE: make it all VERY BEAUTIFUL for the player — the
##   bench/inventory/equipment screens get the full HD treatment
##   (the _hdElemIcon language + rarity auras set the bar).
##
## ▶▶ v1.4 DIRECTION v2 (Nick, 2026-07-17): "THE ASCENT" — CRAFT BENCH +
## SATISFACTORY-STYLE PROGRESSION. Nick: after training "it just feels
## like I don't know what to do next" — lock new players into Sol, mine →
## build your way off, quest chain outward: Sol → Milky Way → other
## galaxies. Codex becomes ultimate goals; quests give the next step.
##
## AGREED DESIGN SKETCH (Claude's shape, Nick to iterate):
## - THE ASCENT = the mainline quest chain, built ON the existing charter
##   engine (it already listens to the whole gameEvent stream). Charters
##   stay as the weekly/side board; Ascent chapters are ordered, each
##   with unlocks. Prime Codex/achievements become the "ultimate goals"
##   meta-layer above both.
## - CHAPTER 1 "Off the Rock" (Sol lock-in, NEW saves only — veterans
##   are grandfathered past any chapter whose unlock they already hold,
##   the proven charter-veteran pattern): interstellar travel now needs a
##   JUMP DRIVE. Mine Sol (Moon/Mars/asteroids), craft T1 basic parts →
##   T2 components → the Jump Drive. Target: first jump within ~30-45
##   minutes of play. LAW: gate TRAVEL, never CURIOSITY — the whole sky
##   stays visible/surveyable from Sol; moving is what costs parts.
## - CHAPTER 2 "The Neighborhood" (Milky Way): quests introduce the
##   existing loops as goals (first bioscan, first conquest, first
##   breeding, charters board) + build the Long-Range Array → extends
##   reachRadius rings (the mechanic already exists and already gates
##   the map — perfect hook).
## - CHAPTER 3 "Beyond the Rim": Intergalactic Drive (T3 system built
##   from T2 components) → other galaxies; wormholes stay as the wild
##   shortcut.
## - THE RING THEME (Nick, 2026-07-18 — THE v1.4 THEME): expansion is a
##   ladder of CONCENTRIC UNLOCKS, each earned by quests + building:
##     Sol (locked start) → a slice of the Milky Way → the LOCAL CLUSTER
##     → farther clusters → ... outward ring by ring, forever.
##   Quests gate each ring; every ring re-runs the whole loop at bigger
##   scale (mine richer veins → craft higher tiers → hunt stranger
##   fauna → unlock the next ring). reachRadius IS the ring mechanic —
##   the chapters just take ownership of when it grows.
## - RECIPE TIERS (Satisfactory pattern, deterministic, same for all):
##   T0 raw elements (mined, exists) → T1 basic parts (Iron Plate,
##   Copper Wire, Silicon Chip, Fuel Pellet...) → T2 components (Drive
##   Coil, Hull Segment, Nav Core, Fuel Cell) → T3 ship systems (Jump
##   Drive, Long-Range Array, Intergalactic Drive) → beyond-v1.4: more
##   systems (vista-visible ship parts, first-contact gifts — the v1.4
##   craft-effects list below). Rarer worlds' veins gate rarer recipes.
## - PACING RULES: early recipes cost minutes, not hours; NO wait-timers
##   (the mining cooldown already paces per-world — quests should push
##   you to MORE worlds, not to waiting); costs grow with tier; the
##   complexity curve comes from recipe DEPTH not grind width.
## - UI: Research Bench grows into the FABRICATOR (tabs: Inventory /
##   Fabricator / Blueprints); parts get procedural icons in the
##   elemIcon language; quest tracker rides the charter panel (Ascent
##   chapter pinned on top); full inventory/bench visual refresh ships
##   WITH it (Nick: "make sure craft bench and inventory are completely
##   up to date and looking great").
## - HD MATERIAL ICONS (Nick 2026-07-17, DONE in v1.3 as groundwork):
##   every minable element renders painterly at 96px behind the hd flag
##   — faceted gems w/ star glints, translucent ice spears, glowing
##   glass flasks, brushed beveled ingot stacks (_hdElemIcon). The
##   inventory IS the bag (Minecraft/Satisfactory is the explicit
##   reference bar — mine from worlds, build at the bench). v1.4 PART
##   icons extend this same language (plates/wires/coils/cores), and
##   the RARITY AURA system (also DONE: grade-scaled spectral glow on
##   portraits — none <T4, grade-hex glow up the ladder, foil glints
##   T8+, prismatic shimmer at summit; Pokémon-foil WOW without
##   swamping the art) sets the bar for how rank reads everywhere.
## - v1.4 ties it ALL into the progression flow: quests route players
##   from mining → crafting → travel → BATTLING/collecting (the combat
##   and Compendium loops become quest goals so players always know
##   the next step into the fun).
## - GUARDRAILS: share codes to unreachable places become a quest hint,
##   not a dead tap; reset keeps the Ascent restartable; smoke needs a
##   full chapter-1 drive; save schema: quest progress fields with
##   absent-safe defaults (veterans ⇒ complete).
##
## (original v1.4 craft-bench notes below — still the effects list)
## ▶ v1.4 DIRECTION (Nick, 2026-07-18): THE CRAFT BENCH

Build out the craft bench, Minecraft-style: the materials mined from
worlds match real recipes, and what you build changes what you can do —
explore faster, land safer, succeed more often at first contact, and so
on. Design intent (to be shaped when v1.4 opens):
- Grows the existing Research Bench + element cargo + inventory grid
  (icons already shipped in 1.2.5) from a fixed 6-tech list into open
  crafting: recipes consume specific mined elements (+ ☄), rarer worlds'
  veins gate rarer recipes.
- Crafted things carry EFFECTS, not numbers-for-numbers (no-grind rule):
  e.g. drives/travel speed (extends the existing ladder), a diplomat's
  gift or beacon that raises first-contact odds, scan lures/armor for
  safer bioscans, harvest/mining yield tools, vista-visible ship parts.
- LANDING GEAR (Nick, 2026-07-18, ties to the v1.3.5 descent roll):
  crafted items raise landing success odds, up to a 100% guarantee
  (e.g. T1 Landing Struts trim wave-off damage → T2 Descent
  Stabilizers upgrade a hazard tier → T3 Gravitic Anchor = 100%,
  never wave off). The pattern generalizes: crafting is how you buy
  certainty across the game's rolls (landing, first contact, bioscan)
  — risk is the frontier, gear is how you tame it.
- FRONTIER RECORDS (NMS Fractal's Wonders catalogue, deferred from
  1.3.5 for scope): a personal records board — largest creature
  catalogued, most hostile world landed, rarest find, deepest ring
  reached — amplifying the grail hunt the extremophile system opens.
  Rides existing stats; pairs with the Prime Codex meta-layer.
- ARCHAEOLOGY & FOSSILS (NMS Visions/Relics, v1.4+ candidate): dig
  sites on dead worlds yield fossils of EXTINCT seeded species (the
  evolution engine already ages rosters by cosmic epoch — extinct
  ancestors are derivable); assemble skeletons for a Binder-style
  museum page. Pairs naturally with mining/crafting loops.
- COOKING & PROVISIONS (Nick, 2026-07-18): flora yield HARVESTABLE
  PRODUCE — fruits, vegetables, biome-flavored crops (ember-fruit
  from cinder blooms, brine-melons off salt flats, kelp hearts from
  the sea gardens). The bench combines them into MEALS AND SOUPS that
  restore HP (and later buff) — feeding-as-medicine extends from
  creatures to the EXPLORER, and meals become the ARPG consumable
  slot (the flask feel). Recipes deterministic; rare biomes grow rare
  ingredients (same law as veins: rarer worlds, richer kitchens).
- HAZARD SUITS + EXTREMOPHILE HUNTING (Nick, 2026-07-18): per-hazard
  gear opens the hostile biomes as EXPLORATION tiers, not just landing
  rolls — Thermal Weave (lava/ember), Pressure Hull (venus abyss /
  gas deeps), Cryo Lining (blue-ice/cryogeyser), each pushing its
  biome family toward 100% landing AND gating safe bioscans there.
  The prize: adapted alien life (deep-sea-vent logic) — thermovores
  on magma seas, acid-cloud floaters over venus, high-pressure
  drifters in the storm eye, under-ice vent fauna. Rides the existing
  'Extreme-World Life'/'Gas Giant Life'/'Subterranean Life' habitats;
  danger = rarity, so the hostile biomes become the endgame hunting
  grounds (Monster Hunter pillar). Loop: craft the suit → land the
  unlandable → scan the unscannable → rarest Compendium finds.
- Items get their own procedural icons in the inventory grid (elemIcon
  recipe style); recipes deterministic and identical for every explorer.
- Ties the whole economy loop: explore → land (samples) → mine → craft →
  explore farther. Charters can teach it ("Craft your first tool").

PHASE PLAN (iterate in order, each phase shippable; flag stays until
Nick flips the default):
1. VISTAS (in) → iterate: volcano/ember scene ✓, island scene for ocean
   worlds ✓, snow weather ✓, twilight polish ✓, aurora nights ✓, moon
   count from P.moons ✓ (ALL LANDED — iteration 2, 2026-07-17); still
   open: Nick's on-device passes.
2. CREATURE PORTRAITS: HD painterly fauna/flora replacing speciesPortrait
   (spine/limb silhouette + per-pixel hide + rim + habitat), TRUE gene
   inheritance (visual genes derived from genome fields so crossGenome
   children visibly blend parents), same render reused vista/card/
   Compendium ("globally there").
3. WORLDS & SYSTEM DRESSING: HD planet sprites (terrain noise, cloud
   shadows, atmosphere rims, era-scaled night lights, hurricanes from
   the weather row, gas storm ovals), phase-from-orbit lighting, belt
   rocks, comet tails, ringed giants, terran moons in system view.
4. GALAXIES (OPTIONAL, LAST): dust-as-gaps spirals — only swap the live
   sprites when unambiguously better on Nick's screen.
GATES: seed-sweep harness (render ~200 random cards headless, assert no
degenerate layouts) before any phase's flag flips; heat check per phase
(renders stay once-per-object cached; v1.2 heat rules apply); full
validate/smoke each batch.



> The living state of development. **Any session (human or Claude) resumes from
> this file** — update the Now/Next/Awaiting sections at the end of every work
> batch, keep everything committed and pushed. The chat is disposable; this
> file and the repo are not.

## ★ v1.1.2 "CLEAR SIGNALS" — BUILT & SHIPPING (2026-07-16, Nick's go:
## "let's begin it all now") — GAME_VERSION bumped to '1.1.2'

CARD CONDENSING BUILT & VERIFIED (validate green, fingerprint byte-identical,
smoke 113/113, systems-check 19/19):
- Actions (Atlas row / Conquer / Mine / Share) at the TOP of the card body
  with a divider — fixes the below-the-fold Atlas button that stranded the
  Safari playtester at training step 4.
- 🌍 Environment group (Made of, Atmosphere, Climate, Water, Gravity,
  Magnetism, Weather, Seasons) folds behind a chevron row; collapsed header
  digest = first clause of Climate + Gravity, ellipsis-clamped.
- Civilization census (Tech era, Local year, Population) folds behind the
  Civilization headline row (name stays visible — a civ is a headline
  discovery). Wilderness worlds keep their single plain row.
- ⟁ Signal row NEVER folds (discovery hook). Spectral class never folds.
- Expand state = cardExpand bitmask (bit1 env, bit2 civ), new save field
  `cx` (absent-default 0 = collapsed), remembered across cards + sessions;
  toggles flip DOM in place (no rebuild — keyboard focus survives) and
  patch the panel key's trailing |cx suffix.
- Grouping is label-driven in renderPanel (app) ONLY — planetDescriptor
  (domain, fingerprinted) untouched. Guide survey topic + RELEASES bullets
  updated. Smoke +10 checks (top actions, folds, digest, toggle, training
  never advanced by fold clicks).

## (superseded planning notes below — kept for the record)

BUILT & VERIFIED 2026-07-16 (validate green, fingerprint byte-identical,
smoke 103/103; committed, NOT deployed — awaiting the rest of the batch):
1. VISIBLE SCROLLBARS everywhere — global lavender thumb + faint track
   (both scrollbar-color and ::-webkit-scrollbar syntaxes so Chrome/Firefox/
   Safari all comply); the #stats/#codex/#log tints kept, brightened
   0.25→0.5 alpha. Root cause of Nick's friend getting STUCK IN TRAINING
   on desktop: the release-notes card scrolled but the default thumb
   vanished into the void. (Friend's screenshot still pending — may reveal
   a second, separate snag; re-check when it arrives.)
2. RELEASE-NOTES STACKING — the 'latest' bulletin now shows the shipped
   version's whole minor line (1.1.2 ⇒ 1.1.2 + 1.1.1 + 1.1, newest first),
   still hiding unshipped entries newer than GAME_VERSION. Smoke check
   rewritten to the new intent (stacks the line / never leaks v-next).
3. SETTINGS OVERFLOW (Nick's phone: pills past the panel's right edge) —
   real cause: the 3-pill rows (Font ~208px, Motion ~210px) never fit the
   210px panel. Panel 210→236px + max-width:calc(100vw-32px); .srow2/.opts
   are now wrap-safe (pills drop to a right-aligned second line — matters
   because pill labels render in the CHOSEN font and Mono runs wide).
RELEASES[0] is now the working v1.1.2 "Clear Signals" entry (title = Claude's
placeholder, Nick may rename). Version bumps to '1.1.2' only on Nick's word.

STILL QUEUED FOR 1.1.2:
- Training stuck — screenshot ARRIVED (2026-07-16), diagnosis CONFIRMED:
  Safari (overlay scrollbars hidden until scrolled), Earth card at training
  step 4 cut off mid-sentence with "+ Add to Star Atlas" below the fold and
  no scroll cue. The shipped scrollbar fix forces a visible thumb+track in
  Safari; the card redesign (buttons up top) removes the trap structurally.
  Consider CLOSED unless Nick's friend hits it again post-deploy.

## ★ v1.2 "THE DISCOVERY ARC" — SHIPPED 2026-07-16 (Nick: "it's go time")

PRE-SHIP REVIEW (3 parallel agents: correctness / perf-heat / edge-cases;
every finding verified against source, all confirmed ones fixed in-batch):
- CORRECTNESS: glance regexes didn't match real descriptor strings —
  airless/lifeless worlds (Mercury!) glanced as "atmosphere ·
  biosignatures". Fixed (^None / ^No known life / liquid|ocean|river).
- EDGE CASES fixed: scout stand-down on ANY codex removal (breeding, fatal
  meal, lost conquest, training cleanup) with toast; veteran grandfather
  now includes surveyedSet (Atlas cap 120 left bioscanned worlds out);
  conquered counts as grounded (key + check); training landings no longer
  permanently forfeit field samples; save `land` unions conquered+mined
  and cap raised to 4000 (eviction can't re-hide a held census); Guide/
  bulletin copy aligned with emoji-free buttons + glance qualified as
  desktop-hover.
- LAND BUTTONS (ship-blocker found by review): the locked card covers the
  planet on phones and swallowed the landing gesture. flyDown(pseed)
  places st.scam at landing zoom → real planetfall next frame. Unlanded
  civ worlds: "Land — make contact"; unlanded dead worlds: "Land to
  prospect" (both data-act=landcta; toast fallback off-system).
- HEAT PASS (Nick: "phone runs hot"): descriptor memo (400ms TTL, honors
  every _panelKey=null invalidation) — descriptors were recomputed 60×/s,
  worst on surfaces (per-frame forced pick); panel measure/maxHeight only
  on rebuild/viewport change (was a forced reflow every frame); backdrop
  (gradient + 900 stars) pre-rendered per resize; ctxEl.textContent
  write-on-change; universe grain positions cached (~2k closures/frame
  gone); DPR capped 2 on TOUCH devices (desktop stays 3) — CLAUDE.md rule
  8 updated; ~55% fewer pixels on iPhone, the single biggest heat lever.
  REVERT PATH if Nick finds phones soft: TOUCH?2:3 in resize().
- Deferred (logged by perf agent): picks pooling, galaxy star batching,
  frame governor, integer cache keys.
SHIP: GAME_VERSION='1.2', smoke 133/133 (new: Land-button planetfall
end-to-end — press button → surface → mine on the spot → samples toast →
zoom out → card stays Ground-surveyed; venus glance asserts NO
biosignatures), fingerprint byte-identical, systems 19/19, balance PASS.

## ★ v1.2.6 "INK & EMBER" — LIVE (2026-07-17, build a8a045f): functional-
## only bold; MUD Chronicle + game-wide event color language (toasts, tray,
## outcomes, verdicts, glance, Compendium scout tag, Atlas badges, Cosmic
## Events, charter ticks); 44-fix grammar pass; Guide coverage pass (new
## "color language" topic, field samples documented, mining topic
## modernized). Suites green at ship.

## ★ v1.2.5 "FIRST CONTACT" — LIVE (2026-07-17, build 319e5b9). Pre-deploy
## review: 4 findings (stale _pendingContact from training landings;
## wk-mine counted re-mines; survivor achievement text; 2 vacuous smoke
## clauses) — all fixed in-batch. (Nick renamed 1.2.2→1.2.5:
## "more than just bug fixes"), GAME_VERSION bumped — AWAITING DEPLOY WORD

Nick's asks (Saturn screenshot session) + the staged Smooth Landings fixes,
all in one entry (fingerprint byte-identical, smoke 146/146, systems 19/19):
1. STUCK-CARD BUG (heat-pass regression, same-day catch): the fold toggles
   in place without a rebuild, so the panel kept collapsed measurements
   and the expanded card hung off-screen, unscrollable. gtoggle now sets
   _panelDirty → remeasure + reposition on unfold.
2. ONE LAND BUTTON EVERYWHERE (Nick: no flavored labels): every planet
   card in system view says just "Land" (works on grounded worlds too —
   revisits/sightseeing). Flavored variants removed.
3. FIRST CONTACT (Nick's design): landing on an inhabited world attempts
   contact — 70% warm reception opens the census; failure wounds
   (14 HP, 11 with hull1) via new routeHit() (the Field Scout absorbs it,
   same wound math as bioscans — scanlife refactored onto routeHit).
   Retry by re-landing (_pendingContact set per planetfall, resolved on
   card render like samples). contacted:Set, save `cont` (cap 4000);
   ABSENT ⇒ grandfather landed+conquered (no census re-hides). known
   (133|conquered|contacted) now gates the census fold instead of
   grounded; rebuild key gains |K. Guarded by tutDone (no contact rolls
   in training). Guide survey topic updated.
4. CARGO INVENTORY (Nick's "Minecraft component"): Cargo panel split into
   Inventory / Research Bench tabs. Inventory = sandbox item grid: every
   element gets a procedural SVG icon (ingots=metals, shards=ices,
   flasks=gases/volatiles, cut gems=exotics; tinted per element via the
   EC palette, cached data URIs, elemIcon()); tiles wear corner
   quantities + name tooltips; min 12 slots for the grid feel. Bench
   recipes show the same icons. This pulls the v1.3 "element mini-SVG
   icons" item forward in inventory form (Cargo's ◆ glyphs replaced;
   Research costs iconified).
SMOKE COVERAGE ADDED: inventory tiles + qty + bench tab, veteran
contacted-grandfather, Land-button rename intent. NOT smoke-driven: a
live first-contact roll (no civ world in Sol; noted for a future seeded
fixture).
NOT deployed — one word ships it (bump not needed: 1.2.1 line stacking
means the bulletin shows 1.2.2+1.2.1+1.2... wait: GAME_VERSION must bump
'1.2.1'→'1.2.2' at ship + smoke version strings).

## ★ v1.2.1 "THE HUNT BOARD" — LIVE (2026-07-17, build aeb5eb0, Nick:
## "Let's deploy it"). Bulletin stacks 1.2.1 + 1.2 for the 1.2 line.

## (build notes below)

EXPEDITION CHARTERS (Nick's onboarding concern: "will new players know
what to do?"). Built & verified (fingerprint byte-identical, smoke
140/140, systems 19/19):
- Charters button + panel, left rail under Cosmic Events (gold dot;
  rmotion whitelist extended; mobile offsets added).
- 5 STARTER charters = training part two, in the order the systems chain:
  Make planetfall → Prospect a dead world → Discover life → Name a Field
  Scout → Conquer a world. Paid ☄ on the spot; completion toast names the
  next charter; _tutFinish announces the board when training ends. ALL
  starters listen simultaneously (no lost credit), panel lists them with
  ✓ ticks.
- WEEKLY board after starters: 3 charters from a 7-template pool, seeded
  by calendar week (hashInt(0xC4A7, week, 7)) — identical for every
  explorer. Weekly progress resets on rollover; app-layer Date.now (like
  mining cooldowns; domain untouched).
- Engine taps gameEvent centrally. New emissions: mined, bioscan (once
  per world, in autoScanWorld's new-survey branch), scout-set, conquest
  (victory only), species (onSpeciesStored; _loading-guarded so save
  restore doesn't count). charterEvent guarded by tutDone + _loading.
- Save: chs (done starter ids), chw (week), chp (progress), charters
  stat (character-sheet row added). Reset clears. VETERANS: proven trades
  auto-complete quietly, no retroactive pay (landed/mines/surveyedSet/
  scoutId/conquered-beyond-Earth — Earth's preset flag doesn't count).
- Guide topic 'charters' (data-guide wired); RELEASES[0] = v1.2.1 entry;
  leak-checked (stays invisible until the bump).
NOT bumped/deployed — rule 7: version ships on Nick's word only. One
word ships it: bump GAME_VERSION '1.2'→'1.2.1', update smoke version
strings (footer + fresh-bulletin checks), validate+smoke, deploy.

STILL QUEUED FOR v1.2.x / NEXT: scout marker in Compendium lists;
grade-scaled scout rare-find bonus; Nick's on-device pass of heat + DPR
feel + charters.

## (pre-ship notes below)
## ▶ v1.2 "THE DISCOVERY ARC" — CORE BUILT 2026-07-16 (Nick: "begin it all
## now") — NOT DEPLOYED, GAME_VERSION stays '1.1.2' until Nick's bump

BUILT & VERIFIED (fingerprint byte-identical — all app-layer; smoke 125/125
incl. 12 new discovery checks driving hover→tap→land on a real Sol pick;
systems-check 19/19):
- landed:Set<planetSeed> + noteLanding() (ui-panel section). Hooked at the
  planetfall transition AND in renderPanel's surface branch (covers saves
  restored directly onto a surface). Toast on first landing (not Earth).
- Save field `land` (capped 2000 newest). ABSENT ⇒ grandfather: atlas 'p'
  ids + conquered keys + mined keys. Earth 133 always grounded. Reset
  clears. Veteran smoke fixture extended (log p555 + conq 777 → both
  grandfathered, probe-asserted).
- Tiers in renderPanel (planets only; stars/moons/galaxies untouched):
  GLANCE (hover, !locked) = head + spectral row + 🛰 Long-range reads
  (☁ atmosphere / 🌊 liquid-water / 🧬 biosignatures / ⟁ structured
  signals, derived from real rows — vague, never wrong) + no buttons;
  ORBITAL (tap/lock) = 1.1.2 card, but census replaced by "Signals from an
  organized world — land to make contact" when !grounded; GROUND (landed)
  = full census fold + veins + ⛳ Ground-surveyed tag.
- Mining gated on grounded (gas giants ARE landable in this game — no
  orbital-skim exception needed); scan1 Deep Scanners still show veins
  from orbit (tech-removes-friction), but the Mine button needs landing;
  unlanded dead worlds get "⛳ Land to prospect" (tap = explainer toast).
  Ground survey shows veins WITHOUT scan1.
- Rebuild key gains |G (grounded) before the trailing |cx. probe-names +3:
  landed, noteLanding, cardExpand (83 hooked).
- Guide survey topic rewritten around the three acts; mining topic updated;
  RELEASES[0] = fresh v1.2 "The Discovery Arc" entry (bulletin-leak smoke
  check asserts it stays invisible until the bump).
CARD POLISH BATCH 2 (Nick's screenshot, 2026-07-16 — BUILT, smoke 126/126):
- k-column emojis REMOVED (🌍/🛰/⛏/👑 broke the 74px label column
  alignment); ⟁ Signal keeps its glyph (brand language, monochrome).
- Fold affordance is now the WORD "expand"/"close" in a tiny pill (CSS
  ::after swap on .grp.open — in-place toggle needs no rebuild). The bare
  ▸ triangle read as decoration.
- BUG FOUND IN NICK'S SCREENSHOT & FIXED: Earth wore a ⛏ Mine Deposits
  button — seed 133 hardcodes flora/fauna rows without populating
  d.species, so the lifeless-world test misfired. Now excluded (the only
  living world that could be mined). Flagged to Nick — revert if he wants
  Earth minable as a starter resource.

## v1.2 SYSTEMS INTERTWINING — APPROVED BY NICK 2026-07-16 ("I like your
## proposal as a first iteration, let's do it"). B + A BUILT; C NEXT.

BUILT 2026-07-16 (fingerprint byte-identical, smoke 131/131, systems 19/19,
balance PASS — combat untouched, sim run for safety):
B. FIELD SAMPLES: first landing on any world grants 1× of up to 2 of its
   deposit elements (same depositsFor recipe as mining — deterministic) +
   3+tier*2 ☄. Granted via _pendingSample on the NEXT card render (that's
   where type/tier live); suppressed during training and on Earth. New
   stats.landings counter (save field landings). Toast lists the haul;
   Cargo button appears.
A. FIELD SCOUT: scoutId (save `scout`, validated against codex on load —
   stale ids stand down silently). Toggle button on owned fauna reveal
   cards (🐾 Scout / Scouting ✓). Hostile bioscan damage reroutes to the
   scout: wound = clamp(dmg/80, .12, .6) onto genome.hurt (hull1 reduction
   carries over); cumulative >=1 ⇒ removeFromCodex + scout lost toast;
   else condition toast. Explorer path (incl. 'survivor' unlock) unchanged
   when no scout. Feeding-as-medicine mends scouts like anything else.
   Guide discover topic + release bullets updated. probe +scoutId.
FOLLOW-ON POLISH (logged): scout 🐾 marker in Compendium list rows + feed
picker; grade-scaled rare-find field bonus for scouts (cut from v1 to keep
balance untouched).
NOT BUILT YET — C. EXPEDITION CHARTERS (next batch): 3 rotating epoch-week
seeded goals, same for every player, paying elements/stardust. Needs: pure
seeded charter gen, progress tracking off gameEvent stream (survey/landfall/
scan/mine/conquest already emit), a small UI surface (left rail bulletin?),
save fields, smoke. ALSO PENDING: LAND button (pulled into v1.2), Nick's
on-device pass, bump + deploy on his word.

## (original proposal record below)

Nick's direction: systems should play with each other; discovery with self
OR fauna; addicting hunt for the next best fauna/flora/world; mining feeds
future shipbuilding. Claude's proposal (three features, build order B→A→C):
A. SURVEY COMPANION (fauna join discovery): a chosen Compendium creature
   absorbs hostile-bioscan damage instead of the explorer, using the
   EXISTING injury/condition/mend systems; its grade adds a small rare-find
   field bonus. Loop: hunt tougher fauna → scan riskier worlds → rarer
   finds. (No XP changes in v1 — power stays through wins.)
B. GROUND-SURVEY YIELD (landing pays): FIRST landing on any world yields a
   deterministic element/stardust trace scaled by type + spectral tier
   (living worlds one-time samples; dead worlds keep full mining). Completes
   the discovery arc's act 3 with a reward; funnels everything into the
   research/ship track. Must be a pure seeded function — no Math.random.
C. EXPEDITION CHARTERS (the next-hunt driver): 3 rotating deterministic
   goals (epoch-week seeded, same for all players) — "ground-survey an ice
   world in a frontier region", "catalogue a Legendary+ fauna", "mine 3
   metal worlds" — paying stardust/elements. The compulsion scaffold that
   points every system at the others.
PULLED FORWARD RECOMMENDATION: the LAND button design call (was a v1.1
design call) belongs IN v1.2 — landing now gates content, and phone
double-tap-to-land remains awkward (first tap locks a card over the point).

## MOVED v1.2 → v1.3 (Nick, 2026-07-16: "move that to v1.3")

Element mini-SVG icons · JOB 2 curated raster art pack (style bible first) ·
guardian unique battle intros · generative music (hand-rolled seeded Web
Audio) · tutorial restructure (collapse chrome steps 3-7) · new-player
bulletin placement call · minor warts list (#sharelink focus, #namein
maxlength, "Explorer" re-prompt, TOUCH constant, Notifications toggle
placement). v1.2 stays focused: Discovery Arc + systems intertwining.

STILL OPEN FOR v1.2 (design + build):
- Conquest/Discover Life deliberately NOT landing-gated (no double gates).
- Possible: landing achievement(s), first-footfall discovery record,
  training step teaching landing, orbital deep-scan tech tier that reveals
  the census from orbit (the friction-remover unlock).
- Nick's on-device pass of 1.1.2 (live) + this build; his call on bump+
  deploy timing and the "vague vs wrong" estimates read (built as VAGUE).

## DISCOVERY ARC — original direction notes (2026-07-16), superseded above

Nick: survey-card fields shouldn't be viewable until you DISCOVER the
planet — coarse read from space, land to learn the truth, discovery
unlocks mining etc. Agreed shape (Claude's recommendation, Nick to
confirm):
- Tier 0 glance (free, always): name, type, spectral class + 2-3 coarse
  long-range reads derived from real data ("dense atmosphere · liquid-
  water signature · ⟁ structured signals" — extend the Signal-row
  language). Looking stays free — friction gates KNOWING, never looking.
- Tier 1 orbital survey (= the existing tap-lock, unchanged cost):
  environment block as instrument readings; life as "biosignatures";
  civilization as signals only. Prime Codex / survey achievements keep
  keying off the tap exactly as today.
- Tier 2 ground survey (land once): full civ block (name/era/year/pop),
  mineral veins + Mine button, geological truth; card gains a permanent
  "⛳ Ground-surveyed" state.
- Estimates are VAGUE, never WRONG (a second lying-descriptor system =
  huge cost + reads as a bug). Parking lot: rare "reads dead from orbit,
  ground survey finds subterranean life" surprise worlds.
- Guardrails: Discover Life keeps its own danger loop (landing must NOT
  become a second gate on it); gas giants need an orbital-skim mining
  exception (no surface); veterans grandfathered (Atlas/Compendium/
  conquered/mined ⇒ counts as ground-surveyed; new save field, absent-
  default = discovered); Earth stays fully known (home + keeps training
  untouched). Future tech hook: orbital deep-scanner research reveals
  ground data from space (unlock that REMOVES friction).
- Sizing: v1.2, NOT 1.1.2 (save schema, mining gating, Guide, training,
  smoke). The 1.1.2 card condensing becomes the skeleton: collapsed
  environment group gets a "🛰 Orbital survey" framing the tiers slot into.
AWAITING NICK: estimates-as-vagueness ok? go/no-go on 1.1.2 card
condensing.
- PLANET CARD CONDENSING — Nick's proposal + Claude's recommended shape
  (2026-07-16, Nick reviewing): buttons move up but UNDER the header;
  Spectral class row always visible; "Environment" group (Made of,
  Atmosphere, Climate, Water, Gravity, Magnetism, Weather, Seasons)
  collapsed by default behind a one-line digest header; Life/Flora/Fauna
  stay open (the collection hook); "Civilization" group collapses tech
  era/local year/population but the header keeps name+era visible; ⟁
  Signal row stays outside every group; expand state remembered (new save
  field, absent-default collapsed). Expand states must join the panel
  rebuild key (the _spExpanded pattern); Field Training's Atlas-button
  target moves (spotlight tracks live; smoke needs new checks). Biggest
  1.1.2 item — do NOT start until Nick oks the shape.

## ▶ PREVIOUS SESSION AGENDA (agreed with Nick, 2026-07-15)

1. Nick's on-device pass of LIVE v1.1.1 — Tier 1 feel (ping/whoosh, labels,
   moon-tap) + Tier 2 feel (volume, Motion Reduced, landing glide, touch
   targets). Feedback reshapes everything below.
2. Build (no decisions needed): ELEMENT MINI-SVG ICONS — procedural
   crystals/ingots/flasks tinted per element family (metals silver/gold,
   ices cyan, volatiles amber, exotics iridescent), species-portrait recipe
   style, replacing the colored ◆ glyphs in Cargo/Research.
3. Design calls if Nick wants to settle any: bulletin placement, tutorial
   restructure, LAND button, generative music.
4. Opportunistic warts (list under MINOR WARTS): #sharelink focus,
   #namein maxlength 20 vs 24, "Explorer" re-prompt, TOUCH constant,
   Notifications toggle in Audio tab.
Mechanics reminder: extract.js first; new player-visible work starts the
fresh v1.2 RELEASES[0] entry.

## ★ v1.1.1 "SIGNAL & POLISH" IS LIVE ★ (2026-07-15, patch — build c5f1e94)

The two held fixes shipped as a patch on Nick's call, repo and live in sync:
- Page identity: <title> is just "Celestial Frontier" + og:/description
  meta — shared links stop previewing as "Cosmic Codex" (in-game names
  untouched; Prime Codex keeps Codex per rule 9).
- Settings rows keep a 12px flex gap — Font/Motion pills were butting
  against their labels (Nick's screenshots).
v1.1 saves see the small Signal & Polish bulletin once. The next working
RELEASES[0] entry (v1.2) starts fresh when new player-visible work lands.
NOTE for link previews: services that already cached the old preview
(Discord/Slack/iMessage etc.) may show "Cosmic Codex" until their cache
expires or is refreshed — the page itself is correct.

## ★★ v1.1 "FIELD REPORTS" IS LIVE ★★ (2026-07-15)

SHIPPED: **deployed as build 14ca544** (GAME_VERSION='1.1', Dakk's call
2026-07-15). Contains Emerson-playtest Tier 1 (six fixes: hint copy, moon
tap-steal, training quiet pass, rename surfaced, label contrast, survey
ping + whoosh) and Tier 2 (Motion Auto/Full/Reduced, landing assist, touch-
target inflation, SFX volume bus + slider, keyboard operability — full
detail in the TIER sections below). Live v1.0 saves (rn='1.0') get the
Field Reports bulletin exactly once; any session left open should show the
gold refresh pill. The release-notes pattern resumes: new player-visible
work starts a fresh RELEASES[0] v1.2 entry as it is built; GAME_VERSION
bumps only on Dakk's say-so.

VERIFICATION AT SHIP: fingerprint byte-identical (50 probes), smoke
102/102, systems-check 19/19, balance PASS. Tier 2 was review-hardened
pre-commit by a high-effort adversarial workflow (4 finders / 11 verifiers,
17 verified findings — every confirmed correctness finding fixed in-batch:
assist arming, delete-× padding exclusion, rm tri-state so the OS
preference is never frozen into the save, real volume assertion, focus
restore after re-renders) plus two tooling cleanups (shared tools/fake2d.js,
live probe-hook getters).

AWAITING DAKK: on-device pass of the LIVE v1.1 — Tier 1 feel (survey ping /
whoosh character, label brightness, moon-tap) and Tier 2 feel (volume
slider, Motion Reduced on iPhone, landing-assist glide, fatter touch
targets); the update pill's real-world test (deploy after 14ca544); and the
design calls under EMERSON PLAYTEST (bulletin placement, tutorial
restructure, LAND button, generative music).

REVIEW LEFTOVERS (logged, deliberately not built): PICK_F is convention-
applied at 15 pick sites (a future pick site must remember ×PICK_F on its
floor); body.rmotion CSS is a 7-selector whitelist (a future decorative
loop must be appended there). Both are documented at their definition sites.

NEXT SESSION MECHANICS: `node tools/extract.js` first (main.js is a
generated artifact, not committed); loop = edit main.js/html → validate.js →
smoke.js (now 102 checks). RELEASES[0] is the working v1.1 "Field Reports"
entry — new player-visible work adds bullets there; the 'latest' bulletin is
pinned to the GAME_VERSION entry so unshipped bullets stay invisible.

## ★★★ v1.0 "THE FRONTIER OPENS" IS LIVE ★★★ (2026-06-12, ~4:30 AM)

SHIPPED: deployed as 0808737, refreshed same-night as **107107a** (live now).
GAME_VERSION='1.0'; single comprehensive debut bulletin; the version reset
is complete. **The release-notes pattern now RESUMES the old way: every
player-visible change lands as a bullet in a NEW RELEASES[0] v1.1 entry as
it is built; GAME_VERSION bumps only on Dakk's say-so.**

WHAT 1.0 CONTAINS (all verified): deterministic universe · hyperlane travel
with real distance + drive ladder · 15-grade rarity (deep spectrum + summit,
Omnipotent at top) · Apex Guardians · the Fifty Paragons · the Binder + Sets
· ~182 creature classes with innate arts · XP/levels (power through wins,
levels wake arts, never stats) · ability matrix (17 verbs × 11 themes × 5
magnitudes, empirically balanced 42–58) · the Chronicle (narrated duels +
ledger + shareable battle log) · mining/elements/Cargo/research bench ·
poison-wounds-not-executes · habitat-backdrop painterly portraits + rarity
card frames · nameplate rank colors · collection-card badges/foil · tabbed
Settings (Display/Graphics/Audio) · text tone + font options · unified
right-rail design system · glass-pill HP readout · Pathfinders story from
intro to Prism Signature to ending · Witness Log · discovery records ·
field training (all soft-locks fixed) · ? popover (version → full notes).

VERIFICATION TOOLING (run all three on any future change):
- tools/validate.js — build + invariants + 50-probe determinism fingerprint
- tools/smoke.js — full jsdom UI walk incl. training
- tools/balance-sim.js [mag] — 17-verb combat fairness (42–58 band)
- tools/systems-check.js — 19 functional checks (classes/XP/breeding/
  imports/guardians/duels). All four GREEN at ship.

POST-1.0 QUEUE (the v1.1 pile, in rough priority):
1. Dakk's live playtest feedback (the eternal source of truth).
   → FIRST OUTSIDE FEEDBACK ARRIVED: see "EMERSON PLAYTEST" section below —
   verified against source 2026-07-01, Tier 1 fixes in progress.
2. Element icons as real mini-SVG art (colored ◆ glyphs shipped in 1.0).
3. JOB 2 — the curated AI raster art pack (Paragons/class crests/elements/
   guardian archetypes): when Dakk opts in, FIRST deliverable is a style
   bible for his image generations, then assets/ wiring with SVG fallback.
4. More guardian flavor: unique battle intros per epithet.
5. Public-player bug reports once anyone else plays.
HOUSEKEEPING: the hotfix worktree (C:\Projects\cf-hotfix, branch
hotfix/v12-mobile) is obsolete now that 1.0 collapsed the lines.

## EMERSON PLAYTEST (received 2026-06-12; every claim source-verified 2026-07-01)

`celestial-frontier-feedback.md` (committed) — desktop Chrome, fresh profile,
live v1.0. A 14-agent verification pass checked each claim against HEAD with
adversarial re-checks. Verdicts: ~60% confirmed, ~25% partial, ~15% wrong.

WRONG (no build needed, keep for the record):
- "Mobile verbs don't exist" — full touch mapping ships (tap-lock survey,
  pinch-at-midpoint, double-tap zoom, long-press tips; device-branched HINTS).
  He extrapolated from desktop copy.
- "Camera starts at top scale" — fresh expeditions start INSIDE Sol system
  (startNewGame), one level deeper than his suggested galaxy start.
- "Player rename impossible" — exists (nameplate → sheet → ✎ rename) but is a
  9px link, absent from Settings/Guide, and unclickable during training
  (the sheet step advances synchronously on open) — discoverability is real.

KEY MISDIAGNOSIS (his best find, wrong cause): "tap Earth took 3 attempts" is
NOT orbital speed (~5px/s, one self-diameter per ~2.4s) — it's the MOON pick
(10px floor, orbiting 4-11px from Earth's center at default zoom) stealing
nearest-wins taps; Moon's descriptor has no planetSeed so find-earth silently
never advances. Labels are also hidden at that zoom, and a Moon mis-tap locks
a panel that eats the next tap.

TIER 1 — ★ BUILT & VERIFIED 2026-07-01 (all six + the pinned-bulletin fix),
committed as the batch after a9fa4ed. RELEASES[0] is now the working v1.1
"Field Reports" entry (GAME_VERSION stays '1.0' until Dakk's bump; the
'latest' bulletin is PINNED to the GAME_VERSION entry so unshipped bullets
never reach players). What shipped:
1. Desktop hint copy: "Hover to preview · click to survey" (stale since the
   2026-06-11 hover-survey removal).
2. Moon tap-steal fixed: below the moon-label zoom a moon's pick is its TRUE
   apparent size (sub-pixel on phones — can't steal "tap Earth"); the 10px
   floor returns at label zoom (visible desktop gas-giant moons stay
   clickable). Planet pick floor 14→16px.
3. Training quiet pass: toasts tray-only while body.training (achievements
   pattern); Rank Up fanfare fully gated during training (its promotion is
   revoked at cleanup — was a bug); tooltips held; wheel-block now nudges the
   card (was silent on 17/18 steps); flushToasts re-checks the gate at fire
   time. ONE exception: the locked-Guide message stays a visible pop-up (it
   IS the ? button's feedback mid-training).
4. Player rename surfaced: Settings → Display → Explorer name; Guide rank
   topic documents it; ✎ link enlarged; Cancel button + Escape on the rename
   dialog (initial naming still mandatory); cancel flushes queued toasts;
   #namebox joined the body.training yield rules (renders below the card).
5. Survey-card labels: new --label #9aa4cb (8:1; tone-aware) replaces --faint
   on .k/.tag, and the stale .krow selectors are fixed so they scale with
   A+/A++ (they were the ONLY body text that ignored the setting).
6. playSurveyPing (every tap-lock) + playWhoosh (travelTo + planetfall);
   travel-skip taps disarmed so the skip can't survey-lock + ping the arrival.
VERIFICATION: fingerprint byte-identical (50 probes), smoke 91/91 (new checks:
training-quiet ×3, pinned bulletin, rename flow ×5, locked-Guide feedback),
plus a 3-lens adversarial review workflow whose 4 confirmed findings were all
fixed (stranded toast queue, moon dead band, skip-tap ping, namebox overlap).
Reference doc + CLAUDE.md synced. NOT deployed — awaiting Dakk's word.

TIER 2 — ★ BUILT & VERIFIED 2026-07-15 (all five, plus review-round fixes).
What each item became:
1. Motion setting (Settings → Graphics): Auto / Full / Reduced (save `rm`
   -1/0/1). Auto follows the OS prefers-reduced-motion preference LIVE
   (matchMedia change listener) and is itself the persisted default, so the
   OS preference is never frozen into the save (review catch — the first
   draft wrote 0/1 on every autosave). Reduced gates the travel tunnel,
   screen shake and confetti in JS and stamps body.rmotion, which stills
   the decorative CSS loops (update pill, cinema rays, events dot, foil
   shimmer).
2. Landing assist: armed ONLY by a zoom-in gesture blocked at the system
   zoom ceiling (450ms window) — the original always-on glide hijacked
   moon surveys and off-screen planets (review catch). Glides 0.14/frame
   toward the dominant landing-size planet; instant step under reduced
   motion; panning/pinching always wins.
3. Touch-target inflation: PICK_F (×1.4 on TOUCH) scales every canvas pick
   FLOOR (15 sites; true-apparent-size parts untouched — the moon lesson);
   @media(pointer:coarse) invisible ::after hit-padding on Atlas row
   actions and Settings pills. The destructive Atlas delete × is
   deliberately EXCLUDED from padding (review catch — an unconfirmed
   permanent action must never win near-miss taps).
4. SFX volume bus + slider (Settings → Audio, save `vol` 0-100): all six
   synths exit through one shared gain (sfxOut), sfxVol² perceptual taper
   computed only in applySfxGain; the survey ping answers on release at
   the chosen level.
5. Keyboard operability: role="button" tabindex="0" on Settings pills/tabs,
   Compendium tabs/groups/cards, Binder paragon slots, Atlas items, Guide
   categories/topics/back/cross-links (the existing Enter/Space shim drives
   them); [role=button]:focus-visible gold ring; refocus() restores focus
   after innerHTML re-renders (review catch — activation used to dump
   keyboard users back at <body>).
TOOLING: shared tools/fake2d.js replaces four drifted fake-canvas copies
(two lacked createImageData and threw every frame); make-probe-build now
emits LIVE getters so smoke can assert on scalar state (sfxVol, motionMode
added to probe-names.json — 80 hooked names); smoke suite 102 checks.

DESIGN CALLS — AWAITING DAKK (do not build until he picks):
- New-player bulletin: drop from fresh path (1-line + smoke rewrite) or
  retitle "Your expedition briefing"? Becomes real patch-notes noise the
  moment v1.1 bullets exist.
- Opening fly-in: camera already starts at Sol — the text stack is the real
  issue; cheaper = trim/defer lore, feed Pathfinders in during play.
- Tutorial restructure (collapse chrome steps 3-7): medium; heaviest
  smoke.js rework of anything here. 12/18 steps event-gated, 6 click-through.
- LAND button on locked planet card: small; zoom-to-land is a deliberate
  signature, BUT phone double-tap-to-land mostly can't work (first tap locks
  a full-width card over the tap point) — strengthens the case.
- Generative music: Tone.js OUT (no-dependency rule); hand-rolled seeded
  Web Audio engine fits (throwaway mulberry32 presentation instances + iOS
  resume plumbing already exist). Large; differentiating.
- 3D/WebGL: park — conflicts with single-file identity; JOB 2 covers the
  art ambition.

MINOR WARTS LOGGED (fix opportunistically): #sharelink outline:none with no
:focus style; #namein maxlength=20 vs cleanName cap 24; self-naming "Explorer"
re-prompts every boot; TOUCH is a load-time constant (mouse-driven touchscreen
laptop gets touch hints); "Notifications" toggle lives in the Audio tab but
gates visual toasts.

## ★ 1.0 WAS READY (2026-06-12, commit d3f721e) — historical ★

Everything built and verified: GAME_VERSION='1.0', single debut bulletin
"The Frontier Opens", habitat-backdrop portraits, ~182 classes, the
Chronicle, all four pillars, all fixes. Fingerprint/smoke/balance green.
Deploy = `node tools/deploy.js` from the repo root on Dakk's word (the
hotfix worktree at C:\Projects\cf-hotfix is now obsolete — remove after
1.0 ships: `git worktree remove C:\Projects\cf-hotfix`).
POST-1.0 (the v1.1 pile starts fresh): Dakk's on-device review feedback,
element mini-SVG icons (colored ◆ shipped), Job 2 raster art pack (style
bible first), public playtest fixes.

## VERSION RESET (Dakk, 2026-06-11 ~9:45 PM): the staged release SHIPS AS v1.0

- Nobody but Dakk has played yet and every bug was fixed pre-release, so the
  release formerly staged as "v1.3" ships as **v1.0 — the public debut**.
  Everywhere this file says "v1.3", read "the 1.0 release".
- **Release notes collapse to a SINGLE v1.0 entry**: a high-level overview of
  every game system and feature to date (an introduction, not a changelog).
  Written at ship time, replacing the whole RELEASES history in-game (git
  history keeps the old notes).
- In-game `GAME_VERSION` resets '1.2' → '1.0' at ship. Dakk's live save has
  rn='1.2' ≠ '1.0', so the new bulletin pops once for him — expected.
- AFTER 1.0 ships: resume the old pattern exactly — fixes/additions pile
  into RELEASES[0] as v1.1 bullets as they're built; bump on Dakk's say-so.

## Current state (updated 2026-06-11, late evening)

- **Version: v1.2** (in-game `GAME_VERSION`) — live as build `ffdd3e2`
  (incl. the iOS 100vh Continue-button hotfix). Bumps only on Dakk's say-so;
  every shipped change gets a bullet in `RELEASES[0]` (see CLAUDE.md rule 7).
- **STAGED, not deployed: v1.3 "The Deep Spectrum"** — rarity ladder extended
  8 → 12 tiers (see section below). Built, validated, smoke-green; notes
  staged as `RELEASES[0]`. **Awaiting Dakk: bump `GAME_VERSION` to '1.3' +
  deploy.**
- **Live:** https://celestialfrontier.github.io/ (org user site; old
  thedakk.github.io deleted; dev repo TheDakk/Celestial-Frontier is PRIVATE).
- Shipped in v1.1 so far: SOLID restructure + test toolkit, Guide to the
  Universe, tooltip system (text-only, 650/600ms), Field Training (lockdown,
  Sol-start, Settings allowed, dialogs yield below card, desktop high-riding
  card), release-notes system (bulletin-first welcome: name → notes →
  training; once-per-update for returners; cumulative via Guide footer),
  update watch (BUILD_ID + version.json + refresh pill), toast pacing
  (read-length, tap-dismiss, title-screen hold), v1.0-feedback fixes (Kepler
  moons, slow galaxies, sound resume, hover-survey, % labels, HP/condition
  line, no phantom Rank Up).

## Awaiting Dakk's playtest feedback

- Tooltip timing (now 650 ms hover / 600 ms long-press) — eager or sluggish?
- Tutorial pacing & copy on iPhone — any step that drags or confuses?
- Release-notes bulletin readability on phone; bullet length.
- Desktop training card: widened to 440px / nudged down 20px under the topbar
  (2026-06-11) — Dakk had a screenshot showing it could be "more centered up
  top" on PC; screenshot never surfaced on disk, so confirm the new placement
  matches what he meant.
- Update pill: first real-world test = the deploy after build 8fe599c (any
  session left open should show the gold refresh pill).

## Recently fixed (2026-06-11, second batch)

- Training always starts at Sol (reload mid-training used to restore the saved
  camera anywhere in the universe → "find Earth" unwinnable). `startTutorial`
  snaps home; `_savedView` restore now requires `tutDone`.
- Settings (`#setbtn`/`#setpanel`) usable during training lockdown.
- Skip-training unlock covered by regression checks.

## Recently fixed (2026-06-11, boot-noise + desktop pass)

- Phantom "Rank Up — Cadet" after reset / training cleanup: rank fanfare now
  requires a genuine promotion (floor increase); trackers reset on wipe.
- Desktop training card: 470px, larger type, more breathing room under the
  topbar. Dakk wants a broader "mobile-first that translates to PC" review —
  the desktop topbar spreads to corners while the card floats center; consider
  a fuller desktop HUD alignment pass if it still reads as off.
- ("Survey the Sun" on boot in Dakk's screenshot = the hover-survey bug, fixed
  in f143ed8; screenshots predated that build.)

## Recently fixed (2026-06-11, v1.0-feedback round)

- Moon orbits now Kepler-ish (outer moons slower; gas giants stately).
- Galaxy rotation slowed ~7x (cosmic-time realism, per Dakk).
- Sound recovery: persistent gesture listeners + visibilitychange re-arm the
  suspended AudioContext (iOS backgrounding bug).
- Hover no longer surveys: credit/achievements/find-Signatures need a tap.
- Breeding/feeding/eating percentages labeled (% success / % poison).
- Specimen cards show battle HP + Healthy condition line.

## Design decisions (made with Dakk, revisit only if it chafes)

- **Discover Life risks the explorer, conquest risks the champion** — kept
  as-is (2026-06-11). The asymmetry is the design: scanning is push-your-luck
  with your own HP; "send the animals instead" already exists as the
  conquer-first-then-scan-safely strategy.

## STAGED for v1.3 "The Deep Spectrum" (2026-06-11, awaiting bump + deploy)

- Rarity ladder extended 8 → 15 tiers. Deep spectrum: **Mythic (~1/22k),
  Celestial (~1/91k), Primordial (~1/333k), Transcendent (1/1M)**; summit:
  **Empyrean (~1/3.3M), Eternal (~1/11M), Omnipotent (~1/33M)** (was "Singular";
  Dakk renamed 2026-06-11 — power-fantasy fits the card-collection direction).
  All bands carved out of the TOP of the old unique band so existing grades
  hold or climb — verified over 60M seeds (0 downgrades; `tools/rarity-sanity.js`).
- **Collection-card pass** (Dakk: "like a card collection game"): specimen cards
  wear a `.gbadge` grade badge; tier 12+ gets the **iridescent foil** treatment
  (shimmer badge + animated prismatic `.iridframe` ring — CSS at the end of the
  style block). High-tier palette repainted to pop: aqua/starlight/ember/
  white-light/dawnfire/twilight/iridescent-magenta.
- **👑 Apex Guardians** (the "ultra-rare encounters" runway item): ~1 in 40
  fauna-bearing worlds is ruled by a named one-of-a-kind titan wearing a summit
  grade (`guardianFor`, deterministic — same ruler for every player). Guarded
  worlds show the ruler on the survey card; conquest becomes a guardian
  challenge; victory stores the guardian in the Compendium, +40 spoils, 👑
  cinematic. Guardian-hood never inherits; `normGenome` clamps imported `apex`.
- Spectral designations past Prismatic fuse tier finish + domain hue
  ("Radiant Fire", "Primordial Black"); `TIER_MAX` replaces hardcoded 7-clamps
  (incl. the loadSave conquered-tier clamp, was 0–9).
- Boosted bloodlines can now breed past Unique (boost cap raised to TIER_MAX);
  summit via breeding needs a natural Anomalous+ under max boost — two roads
  to the top: breeder's and fighter's.
- 8 new achievements (Beyond the Veil ≥Mythic, One in a Million =Transcendent,
  Beyond the Million ≥Empyrean — the FINAL rarity achievement per Dakk: tier
  12+ — plus The Deep Spectrum =12 distinct tiers, Regicide / Throne Breaker
  =1/5 guardians, Realm Ranger / Master of Realms =8/16 realms owned).
  Deliberately NO achievement for the very top: the character sheet instead
  shows **"Highest grade ever reached"** (statistic over achievement, Dakk's
  call) and "Apex Guardians felled". New save field `guardians`
  (absent-default 0). Guide topics (rarity + new Apex Guardians), reference,
  HANDOFF updated; settle25 icon ceded 👑 to guard1.
- **Poison rework (Dakk):** a toxic meal no longer kills a beast outright — it
  deals condition damage (`feedPair`: dmg = 0.16 + severity*0.22 + tier*0.045,
  clamped 0.1–0.92; severity = how deep under the poison threshold the roll
  landed). Death only when cumulative hurt would hit 1.0 ("0 HP"). Survivors
  show their new condition inline with a mend hint. All "toxic kills" copy
  (picker note, feed tip, Guide feeding topic, husbandry header) updated.
  Player eating already worked this way (healExplorer) — untouched.
- Flora coverage verified: floraStat is uniform across all 5 stats (20.0%
  each over 1M seeds) and flora rolls the full 15-tier ladder; heal
  (12+t*9+risk*30), growth (1+t) and mending (0.22+t*0.05) scale uncapped.
- `tools/baseline.json` intentionally regenerated twice (deep spectrum, then
  summit+guardians): only `gradeTiers` changed plus the NEW `guardians` probe
  (50 probes now); all rolls/grades/genomes/duels/codes byte-identical. The
  poison rework needed NO regen — feedPair isn't fingerprinted.

## SHIPPED in v1.2 "The Living Frontier" (2026-06-11)

- Cinematic celebration system: tier-scaled full-screen spectacles for
  Legendary+ discoveries, newborn bloodlines, conquest wins, first-witnessed
  events (queued, tap-dismiss, fxOn-gated, shake at tier 6+).
- Creature injury system: persistent genome.hurt; conquest scars + bad-meal
  wounds; feeding-as-medicine (loved mends most); conditions on cards/picker;
  battleStats guarded so the v1.0 fingerprint stays byte-identical.
- v1.2 bump (everyone's bulletin re-arms), build number in Guide footer,
  new-URL bullet in notes.

## NEXT BATCH for v1.3, before the bump (carry-over for the next session)

Dakk's direction from the 2026-06-11 late-night session (his words paraphrased):

1. **Story coherence pass (v1.3)** — revisit the narrative (Prime Codex /
   Pathfinders fiction, intro, endings, Guide lore) so it's coherent and
   in line with where the game is going: the deep spectrum, the summit
   grades, named Apex Guardians, and the card-collection identity. Weave
   guardians into the Pathfinders story rather than leaving them mechanical.
   Not started — needs a focused pass over intro text, SIGS hints, ending
   text, and Guide category blurbs.
2. ~~Mobile playtest fixes~~ — **DONE & DEPLOYED 2026-06-11 ~9 PM** (Dakk
   approved): shipped to live as **v1.2 hotfix `c3f3830`** (branch
   `hotfix/v12-mobile` off ffdd3e2; only the 4 fixes — no v1.3 content) and
   applied identically to main in 6f78e47. The four: overlay scroll-to-top
   (relbox + all 4 guide views), tap-never-tooltips (focusin gated by recent
   pointerdown; keyboard focus still shows), HP number ON the bar (absolute
   centered; per-text-size fonts 9.5/10.5/11.5px), Settings local-storage
   warning. v1.3 notes carry a 🐞 Bug Fixes section documenting them.
   Worktree gotchas hit & solved: fresh checkout needed LF normalization
   (CRLF broke make-probe-build's IIFE anchor) and a node_modules junction.
3. Tutorial "horizon" step now highlights the conquest champion choice
   (fight as yourself or send a beast) — main/v1.3 only (copy change).
4. ~~Playtest round 2 (2026-06-11 ~9:30 PM)~~ — **FIXED on main**: tutorial
   spotlight now tracks its target live (200ms interval; was positioned once
   per step → stale gold rings = the "phantom long HP bar" around #hpwrap and
   the ring left on the bell) and spots #hpbar not #hpwrap; spotlight is CYAN
   (gold drowned in the gold topbar); breed cinematic chains the reveal card
   via new cinematic({then}) — card never slides in mid-spectacle; HP number
   rides a dark .hpchip; poison ☠ spaced from its % in pickers.
5. ~~Nameplate colors~~ — **BUILT (v1.3)**: RANK_HUES (one per rank, Eternal
   Frontier = .irid foil), unlocks tracked monotonically in stats.bestRank
   (save `br`), choice in save `nh` (-1 = match current rank), picker dots in
   the character sheet above the rarity ladder, painted by applyNameplate().
6. ~~Travel animation~~ — **BUILT (v1.3), moved up from v1.4 per Dakk**:
   travelTo() wraps goTo for the 8 user jump sites (atlas/home/beacon/search/
   codex-where/share-code/prime-grid/events). Three phases over ~950ms: dive
   (camera z ×0.94/frame — real zoom-out through the scale transitions),
   teleport hidden mid-tunnel, eased arrival. Deterministic streak tunnel
   (mulberry32(0x7261), 90 additive lines) tinted by destination star color;
   tap skips; fxOn-gated; honors prefers-reduced-motion. Pure presentation.
7a. **Readability + accessibility (Dakk, ~10 PM round): partially built,
   audit spec below.** BUILT: default body text brightened (--dim #8b93b8 →
   #a0a8cc — was blue-on-blue); new **Text tone** setting (Soft/Bright/Max,
   save field `tone`) lifting text toward white, with <b> emphasis shifting
   to GOLD via --emph in the bright tones (Dakk's "yellowish emphasis" —
   `b{color:var(--emph,inherit)}`, default tone unchanged). STILL TO DO —
   **colorblind audit** for the 1.0 pass: verify every signal has a
   non-color channel. Current inventory: HP = number + bar length ✓;
   creature condition = text labels ✓; odds = % numbers ✓; rarity = names +
   stars + badges ✓; loved/disliked tastes = ♥/⊘ glyphs ✓; RISK: green-vs-
   red odds coloring and the green/amber/red HP slide are red-green-
   confusable — consider a "high-visibility palette" toggle later (blue/
   orange instead of green/red) rather than reworking defaults.
7b. **UI color/contrast pass — code-side DONE (2026-06-11 late), on-device
   sweep REMAINS.** Fixed: HP bar is now continuous green→amber→red by HP
   fraction (pure green ONLY at 100% — Dakk: "red when below 100%"; the
   empty track also tints faint red when wounded); HP chip darkened to
   rgba(6,8,16,0.78) + pure white text (white-on-green failed playtest
   twice); nameplate text color now luminance-aware (ink on bright plates,
   near-white on deep ones). Earlier: cyan spotlight, poison spacing.
   REMAINING: a literal on-device sweep of every panel at A/A+/A++ with
   Dakk's screenshots — code review can't see rendering.
8. **Code audit (Dakk: exploits/vulns/optimizations) — DONE 2026-06-11
   late:** no eval/Function/document.write; the one insertAdjacentHTML
   (duel log) uses cleanName'd names only; CFB import hardened (normGenome
   clamps apex 12..TIER_MAX, ep coerced, brood/fed capped 200, hurt
   stripped); save load coerces+clamps ALL fields incl. new nh/br/
   guardians; domain Math.random/Date.now ban enforced by validate.js;
   new intervals/listeners leak-free (spotlight interval cleared on all 3
   exits; travel frame guard-exits when idle; document listeners are
   singletons); per-frame cost additions ~zero when idle. Guide verified
   current: rarity 15 grades, guardians, poison, hyperlane (atlas topic),
   nameplate colors (rank topic), save warning. No findings requiring
   behavior change beyond the contrast fixes above.
9. **Story coherence pass — STARTED (intro + frame), MORE WELCOME**: intro
   lore now weaves the full arc (Pathfinders' silent beacons → nine
   Signatures → "colors deeper than Prismatic" → named titans → Celestial
   Frontier); Prime Codex panel subtitle ties to the unfinished survey;
   ending text closes the beacon motif. STILL TO DO if Dakk wants more:
   SIGS hint copy, Guide category blurbs, region-name lore, guardian
   battle intros (also listed in the arc).
9. **Release notes** — keep RELEASES[0] current while building; at SHIP TIME
   collapse everything into the single v1.0 systems-overview entry (see
   VERSION RESET at top) and set GAME_VERSION='1.0'.
10. Ship checklist for 1.0: four pillars built (arc section below) → notes
    collapse + version set → full validate/smoke/baseline regen as needed →
    Dakk's go → deploy.

## THE ARC IS v1.3 (Dakk, 2026-06-11 late): "no one else has played yet —
## we're keeping this for v1.3, not an expansion"

## DAKK'S 1.0 ROUND (2026-06-11 ~10:25 PM) — RECORD FIRST, BUILD NEXT SESSION

1. **Element graphics**: Cargo currently shows TEXT chips (the UI spot is the
   🧰 Cargo button, right rail, appears after first mine; labeled "Cargo
   Hold" + "Research Bench"). TODO: per-element ICONS — procedural SVG mini-
   crystals/ingots/flasks tinted per element family (metals silver/gold,
   ices cyan, volatiles amber, exotics iridescent) — same recipe style as
   species portraits; no rasters needed.
2. **ART DIRECTION (Dakk's vision: D&D Monster Manual / MTG / Pokémon-grade
   fantasy art, still meshing with the space-exploration look).** Agreed
   assessment of the technical reality:
   - Runtime AI generation: impossible (offline, deterministic, no server).
   - Infinite procedural species can never each have hand/AI raster art.
   - THE PLAN (3 tracks): (a) **painterly SVG upgrade** for ALL portraits —
     silhouette-first composition, layered gradients + rim light + SVG
     turbulence/noise filters, dramatic poses, decorated card frames per
     rarity (the foil treatment already leads here); (b) **curated raster
     pack for FIXED entities** — the Fifty Paragons, guardian archetypes,
     class crests, element icons (~100-250 images, AI-generated OFFLINE by
     Dakk at his leisure, art-directed to one style bible, shipped as WebP
     in an assets/ folder next to index.html in the site repo — breaks
     single-FILE purity but keeps offline via cache manifest; or embedded
     base64 if total stays <2-3MB); (c) hybrid card design: procedural
     portrait inside hand-designed painted FRAMES per rarity/class (frames
     are where MTG-feel mostly lives). Start with (a)+(c), add (b) when
     Dakk generates the pack.
3. **CLASS SYSTEM + XP/LEVELS (Dakk pasted a ~150-entry FANTASY CREATURE
   CLASS LIST — stored verbatim in tools/class-list.txt).** Design agreed:
   - Every fauna rolls a CLASS (deterministic from genome; rarity-weighted
     so legendary classes like Worldbreaker/Avatar/Chosen One are summit-
     band only). Class shows on the specimen card as a crest/badge.
   - Classes grant INNATE abilities that proc at much higher rates than
     the matrix verbs; class ability KITS map onto the existing hook
     vocabulary + matrix verbs (e.g., Berserker = execB-inverted "stronger
     when hurt" hook; Paladin = mend+aegis kit; Assassin = ambush+stun).
   - CROSS-BREEDING: hybrid offspring can fuse parent classes into hybrid
     classes (Spellsword from Mage×Fighter etc.) — fusion table, not free
     text; mutation chance for off-list surprises.
   - **XP & LEVELS: power through WINS, not stat stacking** (Dakk's core
     rule). Creatures gain XP from duels/conquests/guardian fights; levels
     unlock MORE abilities (multi-ability kits at high level) rather than
     inflating stats; XP bar on the specimen card. Save: per-creature xp
     in genome (like brood/fed, capped, travels stripped in CFB? decide:
     levels are YOUR creature's story — strip on share like injuries).
   - Then ANOTHER full balance pass: extend tools/balance-sim.js to sim
     class kits × levels; band 42-58 vs the field; legendary classes may
     exceed via rarity gating (they're rare, not common-strong).
4. **Tutorial overlay bug (screenshot 10:24 PM)**: the guidance card sits ON
   TOP of the survey card; the step target (+ Add to Star Atlas) scrolls
   under it. FIX: during training, #panel obeys --tut-bot like dialogs do
   (body.training #panel top override + max-height) so the survey card
   always opens BELOW the guidance card. (Dakk's alt idea — tap-to-front
   z-swap — rejected as fiddly; the yield-below pattern already exists.)
5. **? button → version popover**: tapping ? shows build version + a "Open
   the Guide" link (Guide stays locked during training; version always
   visible). Replaces ?-opens-guide-directly.

**ALL FOUR PILLARS BUILT 2026-06-11/12 (b0cd6dd, d33b92d, 091be62) PLUS the
CLASS/XP SYSTEM, discovery records, witness log, element glyphs (0e5523e).
NOT DEPLOYED — Dakk wants the full 1.0 held until his go.**
JOB 1 (painterly pass) BUILT 2026-06-12: every portrait now staged (aura,
ground shadow, feTurbulence displacement texture, rim light, vignette —
pure SVG, deterministic) + etched rarity frames with corner glints on
specimen cards (mid/gold/prism/deep/summit bands). SIGS hints rewritten as
the Pathfinders' field notes (Prism = the discovery they died short of).
**JOB 2 — FUTURE UPDATE (post-1.0), Dakk's call:** the curated AI-raster
pack for fixed entities (Fifty Paragons, class crests, element icons,
guardian archetypes). First deliverable when Dakk opts in: a one-page
STYLE BIBLE for his image generations; then assets/ wiring with SVG
fallback. NOT in 1.0.
BUILT 2026-06-12 (980a122): **THE CHRONICLE** — D&D duel narration (seeded
narrator, severity verbs, named arts, first strikes/executes/thorns/burn
ticks/staggers, death lines), closing per-side statistics ledger, and a
"Share battle log" button (plain-text chronicle via the share box; fights
not saved — share-like-a-screenshot per Dakk). runDuel log enriched;
OUTCOMES byte-identical (rng untouched).
**OPEN ART DECISION (Dakk leaning, not confirmed): habitat backdrops.**
Recommended hybrid: procedural habitat vignette (sky tinted by biome heat,
horizon, 2-3 silhouette terrain layers, props from FA_HABITAT's 19
habitats + flora/fungi/microbe settings) UNDERNEATH the existing
stagecraft lighting (shadow grounds the creature IN the scene). Dakk to
say go; portraits unchanged until then.
REMAINING before ship: (a) folding the remaining ~60 class-list names into
the CLASSES table (pure data; needs a baseline regen); (b) element icons
as real mini-SVGs (colored ◆ glyphs shipped as v1); (c) Dakk's on-device
contrast sweep + art-taste review of the painterly pass; then the SHIP
steps: collapse RELEASES into the single v1.0 systems-overview entry, set
GAME_VERSION='1.0', full validate/smoke/balance, deploy on Dakk's word.
**Design principle added by Dakk: progression must keep players engaged
without EVER feeling like an eternal grind — pacing over padding; every
unlock should change what you can do, not just add a number.**

1. **Vast collection system** — collect TYPES, not individuals: a
   binder of deterministic slots (kingdom × realm × rarity × body plan ×
   ability theme…) that procedural specimens FILL — same slots for every
   player, different cards. Plus curated SETS with rewards ("The Five
   Flavors" = one flora per stat; "The Apex Court" = a guardian of each
   summit grade) and ~50 named PARAGONS — guardian-style one-of-a-kind
   creatures at fixed deterministic locations, silhouettes until found.
2. **Ability expansion + balance harness** — theme (11) × archetype
   (~16 D&D verbs: DoT, stun/slow, shield, lifesteal, thorns, shred,
   execute, ramp, cleanse, gamble…) × rarity-scaled magnitude = hundreds of
   generated abilities ("Emberfang Rebuke III"). Flora get botany
   PROPERTIES instead: medicinal / toxin / fertilizer (breed-odds boost) /
   preservative (injury resist) / catalyst (research speed — ties into
   minerals). Cross-breeding: child inherits one parent's theme, rolls the
   other's archetype, mutation chance; hybrid magnitudes can exceed natural.
   BALANCE EMPIRICALLY: runDuel is deterministic — build a node harness
   that sims archetype×archetype matchups en masse; tune the archetype cost
   table until win rates sit in 45–55%. Budget law stays 170+tier*38.
3. **Minerals & elements** — lifeless worlds get deterministic
   element profiles by type (lava→S/Fe/W, ice→H2O/CH4/He-3, metal→Pt
   group, gas→H/He), world rarity tier boosts rare yields. ~40 real
   elements + a few exotics; "all elements" is a binder page. UI: a 🧰
   Cargo button in the right rail (matches Compendium/Atlas pattern) that
   only APPEARS after the first harvest — keeps early mobile UI clean.
4. **Tech tree + ships + travel** — parallel to Prime Codex, never
   replacing it: Codex = explorer's legend (win track), tech = engineer's
   capability track. Materials + stardust + catalyst flora → research →
   scanner/drive/hull ladder as named ship classes (chemical → fusion →
   antimatter → warp). Distance travel: the shipped hyperlane animation is
   the travel presentation; duration = distance ÷ drive tier, CAPPED ~3–8s
   (flavor, never boredom); "too far" = needs a better drive. Gives REGIONS
   a second axis: Signatures open the frontier, ships make it reachable.
   CAUTION agreed: free zoom-anywhere is the game's soul — travel friction
   must never gate looking, only jumping. Per Dakk's no-grind principle:
   research costs tuned so each tier lands while the previous one still
   feels fresh.

Also folded into the v1.3 arc (was v1.4 runway): planet/world abilities
alongside animal ones; guardian-specific battle intros / unique guardian
abilities; "first discovery record card" share keepsake (pairs with foil
cards); cosmic-events witness log.

## Later / ideas parking lot

- Playwright smoke on a real browser engine (jsdom covers logic, not rendering).
- Duplicate Prime Codex backdrop-close listener (harmless; tidy someday).

## Working agreements (summary — full rules in CLAUDE.md)

1. Loop: `extract.js` → edit `main.js` → `validate.js` → `smoke.js` →
   commit/push → `deploy.js` (deploys at Dakk-approved milestones).
2. Never regenerate `tools/baseline.json` to make a failure pass.
3. Version bumps & release notes: CLAUDE.md rule 7. Suggest a bump when the
   unreleased pile feels substantial.
4. Saves are sacred: new fields optional with safe absent-defaults.
