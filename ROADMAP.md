# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.
## The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
## SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE · COMBAT_AND_CONQUEST ·
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

## ▶▶▶ SESSION HANDOFF — as of 2026-07-31. ★ v1.8.9 "ONE MEASURE" IS LIVE · ★ PHASE 0 HAS STARTED ◀◀◀
## [HYGIENE 2026-07-31, three runs today] The v1.8.6, v1.8.7 and v1.8.8 batch blocks are all in
##   ROADMAP_ARCHIVE.md, VERBATIM. v1.8.6 is worth reading if you ever wonder why "two correct
##   fixes for one bug can disagree" is a law — its own CF1805-06 entry describes both halves of
##   a save-corrupting change approvingly. v1.8.8 is worth reading for the harvest-clock reasoning.
##   [HYGIENE 2026-07-31, second pass] The v1.8.9 batch block is NOW ARCHIVED TOO, verbatim — moved
##   when this file crossed the ~400-line threshold while Phase 0 progress was being recorded.
##   Structure is now pins → this handoff → the v1.9 START HERE block → PHASE 0 PROGRESS →
##   WHERE THINGS STAND → NEXT (incl. the 9x findings) → doc map. All batch logs are in the archive.
##   PROCESS_LAWS.md (extracted 2026-07-30) holds the laws; it is a reference and is never archived.
##   Source AND site pushed; full battery green; live verified end-to-end after deploy, not assumed.
##
## ═══════════════════════════════════════════════════════════════════════════════════
## ▶▶▶ STARTING v1.9 / THE PORT? THE PLAN IS IN `port/`. READ IT FIRST. ◀◀◀
## The v1.8 arc is CLOSED and shipped. v1.9 = PORT PHASE 0.
##
## ★ THE DOCUMENTS (committed 2026-07-31, ca2e9d1 — they were LOST once; never rely on an upload):
##   port/PORT_MASTER_PLAN_v4.0.md   3,164 lines. v4.0 SUPERSEDES v3.1 and is audited against
##                                   v1.8.9, not the v1.6.4 the old review used. §20 = phases,
##                                   §22 = Gates A–I, §23 = open items, §16 = data architecture.
##   port/v1.9-port-update.md        the reviewer’s DELTA against v4.0 — read second, it is short.
##   port/ADDENDUM-A..D              art scope + creature rubric · implementation topics ·
##                                   portability and sizing · technology verification.
##
## ★ PHASE 0 = "v1.8.9 baseline and decision lock", 2–4 weeks (§20). Deliverables verbatim:
##   tag + archive the exact v1.8.9 baseline · reproduce all executable deps in clean CI ·
##   capture the 50 fingerprint probes · add 10,000 cross-language golden seeds · capture saves,
##   share codes, champion codes and migration fixtures · capture fixed-seed visual golden screens
##   and proof sheets · capture audio-profile outputs for representative genomes · establish
##   bundle / answerability / memory / GPU / audio-node budgets · ELEVATE ART_DIRECTION.md,
##   AUDIO.md, PROCESS_LAWS.md AND THE SYSTEM DOCS INTO ACCEPTANCE RUBRICS · run the two-week
##   Canvas/Pixi visual spike (rotating planet, ring occlusion, one creature, one layered biome) ·
##   RUN THE HUMAN AUDIO LISTENING TEST before expanding audio scope · decide the four open design
##   items (fed inheritance, ambience resume, legacy voice family, bat pitch).
##   GATE A: baseline + every approved intentional deviation documented and reproducible.
##   ⚠ NOTE THE FREEZE RULE CHANGED: the old plan wanted a hard freeze. v4.0 §20 and §23 say
##   freeze AFTER Phase 4 UI parity — until then the HTML build stays the reference product and
##   the emergency fallback, and may keep taking critical fixes.
##
## ★ WHAT THE REVIEWER ADDS THAT v4.0 DOES NOT CARRY (port/v1.9-port-update.md §2) — five items:
##   1. SessionRNG. §16.2 makes the UNIVERSE reproducible; nothing makes a PLAYER OUTCOME
##      reproducible. 11 outcome rolls (tryCapture, openPicker, _descRoll, attemptContact,
##      hazardFlavor, _tutGrant, _tutDuel) draw from bare Math.random(), so no test can pin a
##      capture and no bug report can be replayed. Two named domains: WorldRNG (seeded, pure) and
##      SessionRNG (seeded once per session from a stored value, in the save + diagnostics export).
##      Outcomes stay unpredictable to the PLAYER and become replayable to a TEST.
##   2. Reachability has units. Once an affordance is on screen the game WORKS (deep-tier reach
##      100% for nine verbs, breed 96%, craft 94%) — but almost nothing gets on screen: harvest
##      found no card 109 times against 9 successes, tame 89 vs 2, scavenge 84 vs 3. Same shape in
##      the economy: 52 of 62 recipes need intermediate parts and every Fabricator fold starts
##      closed. A DESIGN finding, cheap to fix while Phase 4 rebuilds those surfaces.
##   3. Archetype economics: the archetypes engaging most deeply LOSE on both counters (breeder
##      Δcodex −21, miner Δ☄ 28) against a button-masher at Δ☄ 108. Arithmetically correct,
##      never framed on screen as progress. Belongs in §23 as a deliberate balance decision.
##   4. Gate H should carry reach thresholds: did/saw ≥95% per verb, and saw/attempt not
##      materially worse than the v1.8.9 baseline — that second one is what stops the port
##      quietly LOSING reachability during the component rewrite.
##   5. The audio vocabulary measurement that justifies §15: 533 distinct voices → 199,707 of
##      200,000; duplicate-in-50-creatures 91.3% → 0.6%. THE LISTENING TEST IS NOW UNBLOCKED.
##   ⚠ Their own two corrections: they had conflated the DUAL RARITY ladders (raw 15-band vs
##   display 10-name) across rounds 7–9, so read their old tier labels as RawGradeTier; and they
##   state COSMIC_EPOCH is strictly better than the load-time bound they proposed, and should be
##   "the port’s single time authority" for every cooldown.
##
## ★ OUR OPEN ITEMS ARE ALREADY IN THE PLAN (§23), which is a good sign the two agree: fed
##   inheritance · ambience resume · legacy voice family · bat ceiling · raw/display rarity ·
##   the re-pin permission (recorded as "available, unused for v1.8.9 — spend only on an approved
##   generator change") · desktop training rail overlap (our NEXT #11) · remaining backlog triage.
##   ✔ 9c BIOME_ATLAS and 9d RARITY_AND_GRADES are BOTH DONE (2026-07-31) — see their entries below.
##   Both premises turned out to be wrong: the atlas already existed (in tools/), and there is no
##   15-NAME ladder to correct. Read 9c/9d before trusting any older wording about either.
##
## ═══ ★ PHASE 0 PROGRESS — started 2026-07-31, on Nick's go ═══
## ✔ GATE A, FIRST DELIVERABLE — THE BASELINE IS TAGGED. Annotated tag `v1.8.9` at 92098e9, pushed.
##   Carries the gate results, the recovery procedure and the freeze-rule note in the tag message.
##   VERIFIED FOUR WAYS, not assumed: object type is `tag` not `commit` · points at 92098e9 ·
##   `git show v1.8.9:celestial-frontier.html` is byte-identical to the working tree (sha256
##   9f90f506…, 1,963,584 bytes) · AND validate was RE-RUN against it — 9/9 PASS, FINGERPRINT
##   MATCH 50/50. That last one is the point: the roadmap's own "50/50" was a claim from the day
##   before, and this project has SEVEN logged cases of a check passing while the thing it guarded
##   was broken. A gate figure transcribed is a claim; observed, it is evidence.
## ✔ TAG BACKFILL — tagging had lapsed after v1.8.2; v1.8.3-v1.8.8 shipped UNTAGGED. All six are now
##   annotated tags on the remote, so the whole v1.8 line is addressable. v1.8.5 was the hard one:
##   commit e20d62c, which used a different message convention (`release: v1.8.5 "…"`) and so was
##   invisible to the obvious grep. Releases were identified by checking that package.json AND
##   GAME_VERSION inside the built html both read the expected version — 7/7 agreed — not by trusting
##   commit subjects. The tags SAY they were backfilled today, so the tagger date is not mistaken for
##   the ship date. This matters operationally: audits/README documents recovering an old build from
##   git to negative-control a new gate, and sizedrift-check must FAIL on v1.8.6 and pass on v1.8.7.
## ✔ GATE A EVIDENCE ARCHIVE — port/baseline-v1.8.9/ (fdf2dc3): README, environment.json, the
##   fingerprint output, the uilayout report. Three gates RE-VERIFIED in-environment (validate 9/9,
##   fingerprint 50/50, uilayout PASS 787/10); the other seven are listed under `gates_not_re_run`
##   so the archive cannot overstate itself. Deliberately NOT under releases/ — that directory is
##   gitignored, and the one archive living there exists on a single machine, which is the failure
##   mode that lost the v3.x port plan. Deliberately does NOT duplicate the html or tools/baseline.json
##   — both are tracked at the tag, so git reproduces them byte-exact; referenced by sha256 instead.
## ✔ 9c BIOME_ATLAS + 9d RARITY docs — see those entries. Both premises were false.
## ✔ THE 10,000 GOLDEN SEEDS ARE CAPTURED (2026-07-31). port/baseline-v1.8.9/golden-seeds.json —
##   10,000 seeds × 25 generators = 178,000 cases, ~4.3 MB, captures and verifies in ~7s.
##   `npm run goldenseeds` is a GATE. WHY IT IS NOT JUST A BIGGER baseline.json: the 50-probe
##   fingerprint proves THIS build still matches v1.0; it cannot tell a TypeScript port WHICH input
##   diverged. This corpus hashes PER SEED, so a failing port is pinpointed to one seed.
##   CROSS-LANGUAGE BY CONSTRUCTION: seeds LISTED EXPLICITLY (a port must not reimplement a PRNG
##   just to get inputs — that is a second source of divergence) · canonical form reuses probe.js's
##   1e-9 rounding so both fixtures agree on "equal" · FNV-1a-32 x2, ~10 lines in any language, no
##   crypto import. ⚠ NEVER re-capture to make a failing --check pass (same rule as baseline.json).
##   ⚠ Negative-controlled both ways, and IT CAUGHT A BUG IN ITSELF: --check originally took the
##   corpus size from CLI defaults, so checking a 50-case fixture re-ran 10,000 and reported
##   "26 generators diverged" — a FALSE ALARM. A check that cries wolf gets ignored (the simrun
##   `dead` lesson). --check now reads its counts from the fixture.
## ✔ CODEC + HARDENING FIXTURES CAPTURED (2026-07-31). port/baseline-v1.8.9/code-fixtures.json —
##   108 curated cases: encodeCreature/decodeCreature (share AND champion — one function, `champ`
##   is the 2nd arg and carries xp), encodeWhere/decodeWhere, normGenome (untrusted import) and
##   _sanitizeSavedGenome (load path). `npm run codefixtures` is a GATE.
##   CURATED, NOT RANDOM, ON PURPOSE — golden-seeds covers volume; a codec needs named adversarial
##   edges. A random corpus will never contain size:1e6, a __proto__ key, or a 400-char name.
##   ⚠ SIX `sizePreserved` INVARIANTS ASSERTED OUTRIGHT: _sanitizeSavedGenome leaves `size`
##   unchanged for 0 / 5 / 6 / 12 / -3 / 1e6. This is the v1.8.7 rule made EXECUTABLE — a port that
##   "tidies" size here re-creates the v1.8.6 save corruption. normGenome DOES coerce (-3 -> 3);
##   the two hardeners differ deliberately and both behaviours are recorded.
##   ⚠ SCOPE, STATED HONESTLY: buildSave/loadSave are app-layer and unreachable from the probe
##   realm, so NO full save round-trip is captured. GATE C STAYS OPEN — see the blocker below.
##   ⚠⚠ A SHARED-WeakSet BUG WAS FOUND AND FIXED IN BOTH PROBES. san()'s cycle guard was
##   module-level, so the SECOND canonicalisation of any object returned "«cycle»" and silently
##   dropped fields. It DID corrupt code-fixtures (a recorded size:-3 vanished while the hardener
##   bucket, reading the field directly, showed -3 — the disagreement is what exposed it). It was
##   LATENT in golden-seeds: re-capturing gave 25/25 identical rollups, proving it never bit that
##   corpus. Caught by READING a captured fixture, not by any gate. `seen` is now per-call.
## ⛔ BLOCKED, NEEDS NICK — GATE C CANNOT CLOSE WITHOUT A REAL VETERAN SAVE. The single most
##   valuable migration fixture is the save on Nick's iPhone: real Atlas, real lineages with real
##   `size` drift, real conquest history. Gate C reads "real veteran saves and codes load with
##   preserved creatures, worlds, stats, inventory, progression, audio settings, and lineages" — and
##   a SYNTHETIC save cannot prove that, because it is generated by the same code that reads it.
##   Ask: export it from Settings (diagnostics/export) and drop the JSON in. Until then Gate C is
##   provisional and this is the reason.
## ✔ AUDIO PROFILES CAPTURED + THE VOCABULARY RE-MEASURED (2026-07-31).
##   port/baseline-v1.8.9/audio-profiles.json · `npm run audioprofiles` is a GATE (200 voiceOf
##   profiles). The MEASUREMENT is reported, not asserted — a population statistic drifting is not
##   the same event as a generator changing behaviour.
##   ⚠ RE-MEASURED, NOT TRANSCRIBED. "The listening test is now unblocked" rested on the reviewer's
##   v1.8.6 numbers. Re-derived against v1.8.9 over 200,000 genomes — AND THE CLAIM HOLDS:
##     distinct voices  199,709 / 200,000 (99.855%)   [reviewer: 199,707]
##     pinned at 6 kHz ceiling      0.874%            [reviewer: 0.83%]
##     share a voice with another   0.283%            [reviewer: 0.15% — likely a different
##                                                     definition; ours counts every member of a
##                                                     duplicate group. Not treated as a discrepancy.]
##     duplicate in a 50-collection 0% of 400 windows [reviewer: 0.6%]
##   ★ SO THE HUMAN LISTENING TEST IS GENUINELY UNBLOCKED — verified, not inherited.
##   ★ NEW EVIDENCE FOR TWO OF NICK'S §23 DECISIONS:
##     · `legacy` IS a first-class 18th family at 5.543% of procedural fauna (roadmap guessed
##       ~5.5%). _VOICE_KEYS is Object.keys(_VOICE) and _VOICE INCLUDES legacy, so 1-in-18 is
##       structural, not accidental. Decide whether that is intended.
##     · the f0 clamp is [60, 6000] and BOTH bounds pin: 0.874% at the ceiling AND 0.612% AT THE
##       FLOOR. The floor was never reported before. If the bat ceiling gets lowered, the floor
##       deserves the same look — a pinned voice stops varying at either end.
##   ⚠ WATCH: voiceOf reads `(+g.size||0)%6` — a HAND-TYPED modulus, in the very function where
##   CF1805-03 fixed five of exactly those. It is correct TODAY only because FA_SIZE.length is 6
##   (verified). Add one size word and the voice silently drifts out of step. It also does not use
##   `_szOf`, so it is a sixth raw-ish size reader — harmless now, worth folding in during the port.
## ✔ BUDGETS SET (2026-07-31). port/baseline-v1.8.9/budgets.json — THREE KINDS OF ENTRY, kept
##   strictly apart so the file cannot overstate itself: `measured` (observed, with the command
##   that produced it) · `budget` (a TARGET, with the reasoning) · `unmeasured` (explicitly not
##   known, and WHY — a budget invented for something unmeasurable is a number nobody honours).
##   MEASURED, both arms, because a desktop number is the best case and not the case:
##     bundle       1,963,584 B raw · 675,421 B over the wire · ONE file, ONE inline script.
##                  Transfer is NOT the problem — the network finishes in ~46ms.
##     answerable   1x: painted 111ms, TTI 160ms  ·  4x: painted 355ms, TTI 1944ms (worst 2236)
##                  A 12x SPREAD. Painted is fine at both; ANSWERABLE is where it falls apart,
##                  with 1730ms of pre-gate main-thread block. Confirms 6a: it is V8 compiling
##                  the 1.9MB inline script, i.e. the payload problem the port already owns.
##     audio nodes  10 PER VOICE UTTERANCE (4 gain · 2 osc · 2 biquad · 1 bufferSource · 1 buffer),
##                  zero shipped audio assets — fully procedural.
##   ⚠ NEW FINDING: THERE IS NO AUDIO CONCURRENCY CAP AT ALL. Greps for maxVoices / MAX_VOICES /
##   activeVoices / voiceCap / concurrentVoice return ZERO. Every utterance allocates 10 fresh
##   nodes and nothing bounds how many are in flight. §15 explicitly calls for mobile concurrency
##   budgets; there are none today. Proposed starting targets: <=8 concurrent voices, <=120 live
##   nodes on a phone — to be refined by the listening test and a real device profile.
##   ⛔ MEMORY and GPU are DELIBERATELY LEFT UNMEASURED, with the reason recorded: today's build is
##   immediate-mode Canvas 2D and uses NO WebGL, so there is no GPU baseline to compare against,
##   and the port's memory profile will be dominated by Pixi textures/render-targets that do not
##   exist yet. SET BOTH AT THE PHASE 3 ENGINE PROOF. Carried forward as invariants the port must
##   not quietly relax: art cache 1,200 · DPR 3 desktop / 2 touch (Nick's "phone runs hot" mandate).
## ✔ FIXED-SEED GOLDEN SCREENS CAPTURED (2026-07-31). port/baseline-v1.8.9/screens/ — 28 shots,
##   6.1 MB, via `node tools/uishot.js`. MANIFEST.json records id / viewport / save type / bytes /
##   sha256. Most panels at BOTH desktop and phone widths, deliberately: this project's UI defects
##   have been overwhelmingly MOBILE-ONLY, and a desktop-only proof set would have missed every one
##   (the buried training card, the dock behind the board, the rail overlap).
##   ⚠⚠ THESE ARE A HUMAN REFERENCE, NOT AN AUTOMATED DIFF GATE — and the README says so loudly,
##   because everything ELSE in that directory IS hash-compared and someone will eventually try.
##   A browser screenshot is not byte-reproducible: it moves with browser revision, GPU/driver,
##   font rasterisation, subpixel AA and DPR. The pinned Edge revision makes them COMPARABLE, not
##   IDENTICAL. The sha256 in the manifest detects file corruption in git, NOT render drift; a
##   mismatch after a browser update is expected and means nothing. Gate F is explicitly a HUMAN
##   judgment — "fixed-seed screens pass art rubric", approved by eye against ART_DIRECTION.md.
##   ⛔ NOT INCLUDED, deliberately: the 60+ art proof sheets in tools/sheets/ (gitignored today,
##   far heavier than UI screens) — worth a curated set before the Phase 5 creature-quality gate,
##   but Gate F's SCREEN requirement is met by this set. Also absent: landing vistas and encounter
##   screens, which need a world landed on rather than a panel clicked; add them when the
##   Canvas/Pixi spike needs a before/after.
## ✔ ACCEPTANCE RUBRICS WRITTEN (2026-07-31). port/RUBRICS.md — gates A-I, every criterion tagged
##   [EXEC] (a command that passes/fails) · [EXEC-TODO] (should be executable, does not exist yet) ·
##   [HUMAN] (a person must look, listen or play). ⚠ [HUMAN] IS NOT A WEAKER CRITERION, IT IS AN
##   IRREDUCIBLE ONE — nine logged green-but-wrong cases here all share one shape: something that
##   FELT checkable got a check, the check went green, nobody looked.
##   THE HONEST TALLY: ~half executable today, a third EXEC-TODO, the rest human-only. AND THE TWO
##   THAT MOST BLOCK PHASE 0 — a real veteran save (Gate C) and the listening test (Gate G) — ARE
##   BOTH [HUMAN]. Neither can be worked around by building a better tool.
## ✔ CANVAS/PIXI SPIKE — DAY ONE DONE (2026-07-31). port/spike/ + spike-proof.png. ⚠ A ONE-SITTING
##   spike, NOT the two-week one; it answers the STRUCTURAL questions and NOT the art-quality one.
##   ✅ RING OCCLUSION WORKS — back half behind the planet, front half over it, via two masked
##      containers and painter's order. The item most likely to force a different architecture
##      did not. Parallax layering works. Pixi 8 renders WebGL headlessly.
##   ⚠ THE PLANET TERMINATOR AND RING SHADOW CAME OUT AS HARD-EDGED BLOCKS — MY bug: shading built
##      from ~26 stacked translucent Graphics circles bands and seams. SOFT SHADING BELONGS IN A
##      SHADER OR FILTER, not stacked alpha. Cheap lesson, transfers to Phases 3 and 6.
##   ❌ The creature looks like a cartoon spider. ⚠ NOT a Pixi verdict — a verdict on building
##      creatures from PRIMITIVES, which CONFIRMS the plan's own premise (§10 / Addendum A call for
##      authored art + rig families + mesh deformation precisely because primitives will not do).
##   ⛔ NOT ANSWERED: the painterly quality bar (no shaders/filters/authored textures were used) ·
##      phone performance (headless Edge ran a SOFTWARE rasteriser — any FPS here is meaningless) ·
##      mesh-deformation integration (decision D3, $379/seat). ⚠ NICK'S ART VERDICT SHOULD WAIT —
##      judging the visual ceiling on that creature panel would be judging my primitives, not Pixi.
##   ⚠ Pixi pinned 8.19.0 in an ISOLATED port/spike/package.json (root deps stay acorn+jsdom).
##      That is ALREADY DRIFT: Addendum D verified 8.18.1 as current stable the same day.
## ▶▶ MY PHASE 0 LIST IS NOW EMPTY. Everything remaining is Nick's — see below.
## ═══ ★★ PHASE 1 HAS BEGUN (2026-07-31, Nick's go) — TypeScript domain conversion ═══
## The two open Phase 0 items are NICK-ONLY and gate LATER phases (real save -> Gate C in Phase 2;
## listening test -> Phase 7 audio scope). Domain conversion is blocked by neither.
## ★★★ MODULES 1–8 OF 14 ARE DONE AND PARITY-GREEN (one session, 2026-07-31):
##   Rand ✔ WorldConfig ✔ Naming ✔ StarCatalog ✔ PlanetGen ✔ WorldGen ✔ SurveyPhrases ✔
##   SpeciesTraits ✔ — 6 test files, 31 passing + 1 skipped-with-reason, ~72,000 golden cases +
##   15 fingerprint probes, tsc strict clean. Each module committed + pushed individually.
## ▶▶▶ COLD-START GUIDE FOR THE NEXT SESSION — read this before touching port/v2:
##   · WORKSPACE: port/v2/ (plan §18 layout, packages/domain/*). typescript 7.0.2 · vitest 4.1.10 ·
##     @types/node, all pinned exact. Commands: `npx vitest run` and `npx tsc --noEmit` from port/v2.
##   · THE PORT RULE: bodies VERBATIM + types only. |0, Math.imul, >>> and /4294967296 are the
##     determinism contract — a "cleanup" that passes typecheck can still shift every world.
##   · SMALL modules are hand-ported TS; BIG modules go through port/v2/tools/lift.mjs — byte-
##     verbatim extraction with auto-detected imports, source line range + body sha in the header,
##     DO NOT EDIT marker. Typed surface lives in index.ts + a hand-written .verbatim.d.ts.
##     ⚠ Register each new package's exports in lift.mjs's REGISTRY as you go — auto-imports
##     depend on it (surveyphrases/speciestraits/genome rows are still empty placeholders).
##   · TWO FIXTURE SOURCES: tests/parity.ts (golden-seeds, VOLUME — canon+FNV per the fixture's
##     own spec) and tests/baseline.ts (the 50-probe fingerprint, BREADTH). ⚠ Fingerprint values
##     are stored as JSON STRINGS — compare canon(ours) === storedString, never deep-equal.
##     Test recipes MUST mirror tools/probe.js and tools/goldenseeds-probe.js exactly.
##   · NEGATIVE-CONTROL every new module once (perturb a constant -> parity must fail naming
##     seeds -> revert). Two lifter bugs and one false "10 passed" were caught exactly this way —
##     COUNT THE TEST FILES, not just the tests: a syntax-broken file is silently not collected.
## ▶ REMAINING (deps first): 9 Genome (richest: makeGenome x4 kingdoms, speciesGrade, sapienceTier,
##   classifyRealm, guardianFor, describeSpecies, _szOf — ~50,000 golden cases waiting) ·
##   10 EncUtil · 11 Genetics (crossGenome x10k) · 12 Ecology · 13 Descriptors (~2,800 lines,
##   owes the systemSol REPLAY — see below) · 14 CombatCore (battleStats x1k + code fixtures).
##   Then Gate B close: no-DOM lint · SessionRNG (reviewer §2.1) · noise-generator corpus
##   extension · full 25-generator sweep from TS.
## ⚠ OPEN THREADS carried into the next session, each recorded in code comments too:
##   · systemSol probe DEFERRED (worldgen test, it.skip with full reason): the fingerprint value
##     encodes PROBE-ORDER MUTATION — descriptor probes cache _pal onto memoized P objects before
##     systemSol was captured. Descriptors module must replay planetDescriptor over Sol first.
##     PORT LESSON: memoized generators make call order observable — TS port should not share
##     mutable cached objects across callers.
##   · slimGal carried in @cf/domain-worldgen temporarily (it lives at main.js:3014, app section,
##     but the galaxiesInCell probe needs it) — recorded relocation.
##   · makeNoise/clamp/mix/surfaceColor/atmosphereText+3 not directly fixture-covered — each gap
##     is recorded IN THE TEST FILE where it belongs, none silent. surfaceColor + phrase builders
##     get pinned transitively when Descriptors lands.
##   · ★ 9g IS NOW GUARDED: SpeciesTraits' invariant suite pins the GRADE_TIERS collapse (rows
##     9-14 Transcendent/#F7F1FF, rows 0-9 ≡ RARITY_V17, stars '', displayRarity clamps). The
##     explicit RawGradeTier->DisplayRarityTier conversion function lands with Genome/speciesGrade.
## ✔★ THE FOUR §23 DESIGN DECISIONS ARE MADE (Nick, 2026-07-31). Recorded in port/DECISIONS.md —
##   a NEW live record, so the supplied v4.0 plan stays the reference it was delivered as.
##     1. bred `fed` → INHERIT 50% OF THE LOWER PARENT. Breeding is not sharing: BOTH parents are
##        consumed, so nothing is duplicated. Lower-parent stops it being farmed by feeding one
##        side. Answers the round-8 finding that breeders lose on both counters (Δcodex -21).
##     2. ambience on tab return → RESTART. Silence on return reads as a bug and Gate G requires a
##        clean background/mute/resume lifecycle anyway. ⚠ resume must stay gesture-safe.
##     3. `legacy` voice family → FALLBACK ONLY. It is 1-in-18 BY CONSTRUCTION (_VOICE_KEYS is
##        Object.keys(_VOICE)), measured 5.543%. Costs no variety to drop — voices are already
##        99.855% unique. Keep the definition, exclude it from selection; cheap to reverse.
##     4. f0 clamp → SOFT SATURATION AT BOTH ENDS, curve tuned AFTER the listening test. Both
##        bounds pin (0.874% ceiling, 0.612% floor) and a pinned voice stops varying.
##   ⚠⚠ DECIDED ≠ IMPLEMENTED, DELIBERATELY. All four are implemented IN THE PORT, not in a v1.8.x
##   release. Implementing now would move fixtures just pinned (voiceOf invalidates audio-profiles;
##   `fed` moves breeding parity in golden-seeds) — trading the port's safety net for a change
##   nobody is waiting on. And none is a CRITICAL fix, which is all the freeze rule permits.
## ▶ NEXT IN PHASE 0 — NICK'S, and Phase 0 CANNOT CLOSE without them: the HUMAN LISTENING TEST
##   (12-24 players; no automated fleet can score it — Playwright runs --mute-audio) · a REAL
##   VETERAN SAVE for Gate C · the Canvas/Pixi spike's ART VERDICT.
##   NOT a code phase — no TypeScript until Phase 1.
## ⚠ FOUR NEW FINDINGS LOGGED THIS BATCH, none fixed: 9e (biome→fauna filter is dead code) ·
##   9f (a stale premise guarding the `size` load decision — NICK'S CALL) · 9g (the rarity display
##   collapse is an unguarded data invariant) · 9h (the browser is an undeclared dependency).
## ═══════════════════════════════════════════════════════════════════════════════════

## ═══ WHERE THINGS STAND ═══
## ★ THREE RELEASES SHIPPED 2026-07-31, in order. READ THE BATCH LOGS.
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
##   · v1.8.9 "One Measure" — the size arc CLOSED, and WITHOUT spending the re-pin Nick offered.
##     Six readers took g.size RAW while the card printed % FA_SIZE.length, so a bred "tiny"
##     creature was classified MEGAFAUNA with the full rarity boost (vit 68 vs 52, measured).
##     One helper now; fingerprint held by IDENTITY (the probes are fed makeGenome outputs).
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
## LIVE: v1.8.9 "One Measure" at https://celestialfrontier.github.io/ (shipped 2026-07-31).
##   FOUR releases in two days, each answering an external round or its tail: v1.8.6 (round 8) →
##   v1.8.7 (round 9, a regression fix that was OURS) → v1.8.8 (CF1805-05 closed, harvest on play
##   time) → v1.8.9 (the size arc closed, fingerprint intact). NO OPEN EXPLOITS REMAIN.
## GATES AT SHIP (v1.8.9): validate 9/9 · fingerprint MATCH 50/50 · smoke 553/0 · uilayout
##   787 checks / 10 viewports (was 763 — the new training-DOCK pass) · balance PASS ·
##   simrun dom 0 findings · duelxp 6/0 · sizedrift 8/8 · harvestclock 5/5. bootperf NOT re-run: nothing
##   in this batch touches boot, art scheduling or the first-run path (v1.8.5's PASS still stands).
## ARC STATE: v1.7 "The Forge" COMPLETE and archived. v1.8 "The Connection" COMPLETE
##   (v1.8.0 arc → v1.8.1/.2 playtest → v1.8.3 external battery → v1.8.4 round 7 → v1.8.5
##   the cold-boot fix → v1.8.6 round 8 → v1.8.7 round 9 → v1.8.8 harvest clock → v1.8.9 size). Older batch
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
## ⚠ TITLES: "One Measure", "Paid for Playing", "True to Form", "Kept Promises" and "First
##   Touch" were all CHOSEN BY CLAUDE and flagged to Nick each time; he has approved five deploys
##   without renaming one. Treat that as tacit approval of the practice rather than an open
##   question — but keep flagging, and any rename is one string in RELEASES[0] + a redeploy.
##
## ═══ ▶ NEXT — the actionable list, highest value first ═══
## 1. ★ NICK'S iPHONE / iPAD RE-VERIFY of v1.8.9 — now FOUR things, and (c)/(d) are the ones no
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
## 9e. ⚠ NEW 2026-07-31, FOUND DURING PHASE 0 CAPTURE, NOT FIXED (Nick's call: log, don't fix) —
##    THE BIOME→FAUNA FILTER IS DEAD CODE. main.js:11112 reads `wbRoll.fauna`, but `wbRoll` is a
##    BIOME_SETS entry and that table has NO fauna field (verified: zero occurrences in the whole
##    block). So `_wbFauna` is always null, `_matched` always [], and `standable` always falls through
##    to an unfiltered shuffle — A JUNGLE LANDING CAN SHOW GLACIER FAUNA. The data it wants is one
##    table over: BIOME_PROFILES[wbRoll.k].fauna. Candidate fix is one line, but it CHANGES WHICH
##    CREATURES APPEAR, so it is a gameplay change needing a re-baseline decision against the tag.
##    ⚠ This is the "present, correct and completely inert" shape from PROCESS_LAWS — the same family
##    as the CSS min-height/max-height and earlier-in-the-sheet laws. NO GATE CAUGHT IT because no
##    gate asserts the OUTCOME (which creatures a biome yields); biome-audit checks the manifest, not
##    the runtime path. Related: BIOME_PROFILES' sig/fauna/flora have NO runtime reader at all — only
##    weather/hazard are consumed (_hdVistaEco). The ecology data is currently aspirational.
## 9f. ⚠ NEW 2026-07-31 — A STALE PREMISE GUARDING THE `size` DECISION. main.js:14180 justifies NOT
##    wrapping size at load with: "speciesGrade/rarityRoll/sapience read `g.size` RAW (>=3, >=4, >=5)".
##    FALSE in v1.8.9: speciesGrade (2143-44) and sapienceTier (2036) both go through `_szOf`, and
##    rarityRoll never reads size at all. Nothing is broken — but our OWN v1.8.9 fix invalidated the
##    reasoning that a load-path decision rests on, and nobody updated the note. This is the exact
##    field that caused the v1.8.6 save corruption, so per CLAUDE.md rule 7 it wants a DELIBERATE
##    re-decision, not a quiet edit. The conclusion may well still hold for other reasons; the stated
##    reason is no longer one of them.
##    ✔ DECIDED + DONE 2026-07-31 (Nick): KEEP THE BEHAVIOUR, FIX ONLY THE COMMENT. The rule is
##    unchanged — the load path still does NOT wrap `size` — and it now rests on the correct reason:
##    wrapping at load would REWRITE HONEST DATA, and since every reader already wraps via _szOf it
##    would today buy NOTHING. Comment-only edit at main.js ~14179; fingerprint held MATCH 50/50,
##    smoke 553/0, sizedrift 8/8. See port/DECISIONS.md §5.
##    ⚠ KEEP THE LESSON: a fix can invalidate the stated REASON for a decision made elsewhere, and
##    nobody re-reads the note. CLAUDE.md rule 7 says grep every reader and writer of a field —
##    this adds: grep every COMMENT that reasons about it too.
## 9g. ⚠ NEW 2026-07-31 — THE DISPLAY COLLAPSE IS AN UNGUARDED DATA INVARIANT. Creature rarity names
##    come from GRADE_TIERS via colorGrade, NOT from displayRarity — and `spectral` has no clamp at
##    all. Correctness rests entirely on GRADE_TIERS rows 10-14 staying collapsed to "Transcendent".
##    Restore the old names there and every creature surface silently reverts while displayRarity keeps
##    clamping correctly and every test exercising it keeps passing. No test guards the invariant.
##    Highest-value item for the port to change — §16.3's explicit RawGradeTier -> DisplayRarityTier.
## 9h. ⚠ NEW 2026-07-31 — THE BROWSER IS AN UNDECLARED DEPENDENCY (Gate A gap). package.json declares
##    only acorn + jsdom, but uilayout.js and bootperf.js spawn a REAL system browser over CDP; there
##    is no Playwright/Puppeteer anywhere in tools/. `npm install` on a clean clone therefore CANNOT
##    run two of the nine suites. Resolution order is CF_BROWSER env -> local Windows Edge -> common
##    Linux/macOS Chrome paths, so CI is possible today but undeclared and undocumented. The binary
##    here was Microsoft Edge 150.0.4078.83, which AUTO-UPDATES SILENTLY and is pinned nowhere;
##    Addendum D warns layout thresholds set on one revision drift on the next.
##    ✔ RESOLVED 2026-07-31 — Gate A deliverable #2 now has an instrument. `tools/deps.pinned.json`
##    DECLARES the executable deps (node floor, packages, and the browser with its full resolution
##    order + pinned revision); `tools/preflight.js` VERIFIES a machine against it. `npm run preflight`
##    (drift WARNS) · `npm run preflight:ci --assert-pin` (drift FAILS). Drift warns by default on
##    purpose: per Addendum D a bump is a RE-BASELINE DECISION, not a regression, and failing by
##    default would train people to ignore it. Documented in tools/README.md.
##    ⚠⚠ THE NINTH GREEN-BUT-WRONG, AND IT WAS IN THE NEW CHECK ITSELF. preflight v1 trusted
##    $CF_BROWSER without testing that the path existed — so `CF_BROWSER=/nope` reported PASS and
##    exit 0 while uilayout.js hard-exits(2) on exactly that value. A check written to prevent
##    green-but-wrong shipped green-but-wrong, and ONLY the rule-7 negative control caught it, before
##    it ever landed. Fixed to match uilayout.js:83. THREE CONTROLS MUST KEEP HOLDING: normal -> exit
##    0 · bogus CF_BROWSER -> exit 1 · drift under --assert-pin -> exit 1.
##    ⚠ STILL OPEN (not fixed, deliberately): the browser resolution list is DUPLICATED VERBATIM in
##    uilayout.js (~24), bootperf.js (~56) and now preflight.js — three copies of one truth. If they
##    diverge, preflight silently stops describing what the gates actually run. The port should have
##    ONE resolver; touching the gates during capture is not worth it.
## 9b. ✔ RESOLVED 2026-07-31 — THE PORT PLAN IS COMMITTED at port/ (commit ca2e9d1). Nick supplied
##    v4.0, which SUPERSEDES the lost v3.1 and is audited against v1.8.9 rather than v1.6.4, plus
##    addenda A–D and a v1.9 delta. It will not be lost again.
##    ⚠ KEEP THE LESSON, NOT JUST THE FILE: the v3.x plan was reviewed in 2026-07-26 as a
##    session-scoped upload and vanished with that session, leaving annotations that cited §3/§7/
##    §15/§26/§28.5 of a document nobody could read. audits/README.md existed specifically to stop
##    that and had never been applied to the most important upload. ANY document we reason about
##    gets committed the same day.
##    ⚠ SECTION NUMBERS MOVED between v3.1 and v4.0 — older roadmap/archive entries citing §26
##    step 2, §27.3 or §28.5 refer to the LOST v3.1. In v4.0 the equivalents are §20 (execution
##    phases), §22 (Gates A–I), §23 (open items) and §24 (risks). Do not chase the old numbers.
## 9c. ✔ DONE 2026-07-31 (07c562d) — AND THE PREMISE WAS FALSE. This entry used to read "BIOME_ATLAS.md
##    HAS NEVER EXISTED … Corrected 2026-07-31 so nothing lies." ⚠ IT DID EXIST — at tools/BIOME_ATLAS.md,
##    TRACKED IN GIT since 2026-07-21, 734 lines / 45 KB. The check that declared it missing looked only
##    in the repo ROOT, and that check was itself written the same day under the banner "so nothing lies".
##    ⚠⚠ THE LESSON, which is the eighth instance of this shape: A CORRECTION IS A CLAIM LIKE ANY OTHER.
##    This one shipped a NEW false statement while fixing an old one, and survived a day because nobody
##    re-checked the correction either. Had we generated a fresh atlas as planned, the repo would hold
##    two competing ones — and the NEW one would have been WORSE: §§2-4 (93 Earth + 315 non-Earth +
##    Additional) come from uploaded design-pack CSVs and CANNOT be regenerated from main.js. Those are
##    also where the "93 + 315" figures quoted in ART_DIRECTION §6.1 come from — DESIGN SCOPE, not
##    shipped content. Only the 43 is source-derivable. Never cite 93/315 as source facts.
##    WHAT WAS DONE: audited, corrected, promoted to root as BIOME_ATLAS.md (git mv, history kept).
##    Verified BEFORE promoting — all 43 sig hexes extracted from BIOME_PROFILES and diffed against §1
##    (43/43 exact, no extras); BIOME_PROFILES vs BIOME_SETS keyed 43/43 both ways, no orphans. Added
##    §1.1, a source-GENERATED per-biome catalog merging both tables. Corrected "fauna-free" from 2 to
##    4 (acidhaze, abyssgreen, magmasea, hotglow). Stale anchors fixed across ART_DIRECTION and
##    WORLD_GENERATION (BIOME_SETS ~7477 -> 10763 etc., ~3,300 lines off). Removed `biomeProfile` and
##    `colorDNAFor` from ART_DIRECTION — zero hits in main.js, they never existed.
## 9d. ✔ DONE 2026-07-31 (b0d5998) — and the dual-ladder framing was wrong, INCLUDING OURS.
##    There is NO 15-NAME ladder. GRADE_TIERS (1752) kept its 15-ROW shape — rarityRoll still returns
##    0-14, apex/paragon forces still target 8-14 — but every row's NAME and HEX were collapsed onto
##    the 10-tier set: rows 9-14 all read Transcendent / #F7F1FF. The old names survive ONLY in the
##    `pre` column, feeding ART labels ("Empyrean Black"), never rarity. Raw 0-14 INDEX -> 10 NAME,
##    collapsed IN THE DATA. Source calls it "collapse, don't remap" (1729-1731).
##    OLD DOC WAS WRONG ON: every name from tier 6 up · all 15 hexes · the star column (glyphs retired)
##    · every line anchor by 350-4,000 lines. VERIFIED UNCHANGED: 14 thresholds, six merit boosts,
##    guardian split + epithets, paragon numbers, TAME_ODDS, apex/par load bounds.
##    ⚠ DID NOT DELETE IT despite its own header ordering deletion on the v1.7 deploy (shipped three
##    minors ago). The raw ladder is still rolled, persisted and read for sorting/achievements/_courtProg
##    CROWNS I/II/III; this is its only record, and §16.3 requires RawGradeTier and DisplayRarityTier be
##    documented SEPARATELY. The two rarity docs now split explicitly: RARITY_AND_GRADES = raw ladder,
##    RARITY_UNIVERSAL = 10-name display ladder. Neither supersedes the other.
## 10. ▶ v1.9 = PORT PHASE 0. The plan is port/PORT_MASTER_PLAN_v4.0.md §20; the START HERE block
##    at the top of this file summarises it. Phase 0 is 2–4 weeks and is mostly CAPTURE work —
##    tag the baseline, reproduce deps in clean CI, capture fixtures (the 50 probes, 10,000 golden
##    seeds, saves, share/champion codes, fixed-seed golden screens, audio profiles), set bundle /
##    answerability / memory / GPU / audio-node budgets, elevate the docs to acceptance rubrics,
##    run the Canvas/Pixi spike and the human listening test, and decide four design items.
##    ⚠ IT IS NOT A CODE PHASE. No TypeScript is written until Phase 1 (§20). The temptation to
##    start the rewrite before the fixtures exist is exactly what Gate A prevents — without them
##    there is nothing to prove parity AGAINST, which is the whole thesis of §4.1.
##    ⚠ THE FREEZE RULE CHANGED in v4.0: freeze the HTML build AFTER Phase 4 UI parity, not
##    before. Until then it stays the reference product and the emergency fallback.

## 11. ⚠ NEW, FOUND BY THE ROUND-9 GATE AND NOT FIXED: on laptop/desktop/ipad-land, a raised
##    training board overlaps #codexbtn and #chbtn. PRE-EXISTING — v1.8.5 reports the same 2
##    controls buried, so it is NOT the CF1806-02 regression and was deliberately not folded in
##    behind that name (a gate that conflates two defects behind one label teaches nobody
##    anything). Above 900px those ids are RAIL buttons, not a dock, so the right assertion is a
##    different one. The dock pass is scoped <=900px until someone decides what desktop should do.
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

## ═══ ▶ DOC MAP (verified against the shipped build; markers current 2026-07-31) ═══
## ★ port/ (NEW 2026-07-31, ca2e9d1) — THE v2.0 PORT PLAN, committed so it cannot be lost a
##   second time. PORT_MASTER_PLAN_v4.0.md (3,164 lines, supersedes v3.1, audited against v1.8.9) ·
##   v1.9-port-update.md (the reviewer delta — 5 additions + 2 self-corrections) · ADDENDUM-A..D ·
##   source-checks/. The v1.9 START HERE block at the top of this file is the summary.
## ⚠ PORT-READINESS AUDIT RAN 2026-07-31 — read 9b / 9c / 9d before trusting this map. Two docs
##   it used to list DO NOT EXIST or are three minors behind, and the port plan itself is missing.
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
##   SPECIES_AND_GENOME · ART_DIRECTION. ⚠ THE LAST THREE OF THOSE WERE ALL TOUCHED 2026-07-31 —
##   RARITY_AND_GRADES was refreshed (9d), and WORLD_GENERATION + ART_DIRECTION took corrections for
##   the BIOME_ATLAS retraction and ~3,300-line-stale anchors (9c). Re-read them rather than trusting
##   this line's older "still accurate" claim.
## ★ BIOME_ATLAS.md — NOW AT THE REPO ROOT (promoted 2026-07-31, 07c562d). It ALWAYS existed, at
##   tools/BIOME_ATLAS.md, tracked since 2026-07-21; this file previously said it never had. §1 + the
##   new source-generated §1.1 are the biome CONTENT catalog; §§2-4 are design-pack scope that CANNOT
##   be regenerated from main.js. See 9c.
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
