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

## ▶▶▶ SESSION HANDOFF — as of 2026-07-31. ★ v1.8.9 "ONE MEASURE" IS LIVE · ★★★ PHASE 1 IS
## COMPLETE (all 14 domain modules + Gate B close-out) — see the PHASE 1 block below. ◀◀◀
## [HYGIENE 2026-07-31, FOUR runs today] v1.8.6/.7/.8/.9 batch blocks AND the PHASE 0 PROGRESS
##   deliverable log are all in ROADMAP_ARCHIVE.md, VERBATIM (the Phase 0 block moved on the
##   fourth pass, when Phase 1 completed and this file re-crossed ~400 lines). v1.8.6 is worth
##   reading if you wonder why "two correct fixes for one bug can disagree" is a law.
##   Structure is now pins → this handoff → the v1.9 START HERE block → PHASE 0 pointer →
##   ★ PHASE 1 COMPLETE block (the live cold-start guide) → WHERE THINGS STAND → NEXT → doc map.
##   PROCESS_LAWS.md (extracted 2026-07-30) holds the laws; it is a reference and is never archived.
##   Source pushed after every module (9 commits this session); port suite 16 files/161 green;
##   goldenseeds gate PASS at 27 generators; main.js/html untouched.
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
## ═══ ★ PHASE 0 PROGRESS (started + completed 2026-07-31) — ARCHIVED ═══
## The full deliverable-by-deliverable log (Gate A tag · tag backfill · evidence archive ·
## 10,000 golden seeds · code fixtures · audio profiles · budgets · golden screens · rubric
## elevation · the Canvas/Pixi spike results) moved VERBATIM to ROADMAP_ARCHIVE.md on
## 2026-07-31 when Phase 1 completed and this file passed the ~400-line threshold again.
## Phase 0 is COMPLETE on the automatable side; the three NICK-ONLY items are listed below
## after the Phase 1 block.
## ═══ ★★★ PHASE 1 DOMAIN CONVERSION: COMPLETE (2026-07-31, one further session) ═══
## ALL 14 MODULES PORTED AND PARITY-GREEN + GATE B CLOSE-OUT DONE (automatable side).
##   Modules 9-14 landed this session: Genome ✔ (71k golden + 7 probes + the 9g end-to-end
##   guard) · EncUtil ✔ (independent-truth: Node Buffer b64 + hand-computed shade) ·
##   Genetics ✔ · Ecology ✔ · Descriptors ✔ (2k heavy golden + ★ the systemSol REPLAY —
##   the deferred probe passes byte-for-byte) · CombatCore ✔ (battleStats x1k + the FULL
##   code-fixtures corpus: share/champion codes x23 genomes, normGenome, cleanName).
## ★ GATE B DELIVERABLES, all in port/v2: tests/sweep.test.ts (27-generator sweep from TS,
##   198,000 cases, completeness-asserted) · tests/nodom.test.ts (no-DOM/no-nondeterminism
##   lint, 2 reasoned exceptions) · @cf/domain-sessionrng (reviewer §2.1 — counter-per-domain,
##   replayable, order-isolated; app wires the 11 Math.random() sites in Phase 2+) ·
##   @cf/domain-strays (cleanName, where-codecs, winEstimate, floraStat, biomeFor+BIOME_SETS,
##   hdGenesFor, _sanitizeSavedGenome — closes whereCodes + sanitizeSavedGenome buckets incl.
##   the v1.8.7 sizePreserved invariant x23) · GOLDEN CORPUS EXTENDED addition-only,
##   diff-verified 25/25 byte-identical (makeNoise x10k + crossGenome_uncorrelated x10k;
##   npm run goldenseeds PASS, 27 generators / 198,000 cases).
## GATES AT SESSION CLOSE: vitest 16 files / 161 passed / 1 documented skip · tsc strict clean ·
##   npm run goldenseeds PASS. main.js/html UNTOUCHED (only tools/goldenseeds-probe.js gained
##   the two new generators), so the validate battery stands as at v1.8.9.
## ★ FINDINGS made this session, each recorded at its site (README module table + test files):
##   · FIXTURE BLIND SPOT: the golden crossGenome recipe's CONSECUTIVE parent seeds bias the
##     mutation draw — size-mutation branch executed ZERO times in 10k cases (color 80% /
##     trait 12.5% / size 0%). Game unaffected (uniform with real uncorrelated seeds); corpus
##     extension closes it. Lesson: input correlation can silently zero a branch's coverage.
##   · GREEN-WHILE-BROKEN: worldgen's galaxiesInCell reads free GAL_SPRITES — all three probed
##     cells are EMPTY, so parity stayed green while every POPULATED cell threw. Found by
##     real-input structural tests; hooked + populated-cell test added. (Instrument-first law
##     holds in the port too.)
##   · VACUOUS PROBES, reproduced exactly and recorded: planetSpecies (level=2 vs string
##     levels, stored "[]" since v1.0) · galaxyDescriptor (cell 0,0 empty) · moonDescriptor
##     (no moons at that call shape). Ecology's 0xB105 salt hole was MEASURED open at module
##     12 (perturbation passed 7/7) and VERIFIED closed at module 13 (fails 2 descriptor tests).
##   · SOURCE LAYERING VIOLATION: galaxyHaze draws a 2048px canvas INSIDE the WorldGen [domain]
##     module (main.js ~1373) — violates the file's own architecture rule; only the Renderer
##     calls it. Lint exception with reason; RELOCATION CANDIDATE for a future main.js batch.
##   · toLocaleString in civilization yearLabel is locale-dependent — captured under the
##     capture machine's locale; a port machine with another default locale would diverge on
##     descriptor text. Surfaced by planetDescriptor golden staying green here; note for CI.
## ✔ OPEN THREADS FROM THE 1-8 SESSION, ALL CLOSED: systemSol replay (descriptors test) ·
##   slimGal relocated worldgen→descriptors · lift.mjs REGISTRY placeholders filled (now
##   tools/registry.mjs, shared by lift.mjs + lift-strays.mjs + lift-apphooks.mjs) ·
##   makeNoise corpus gap · 9g part 2 (collapse guarded THROUGH speciesGrade incl. apex 12-14).
## ⚠ STILL OPEN, recorded where they belong: _earthArt (hdGenesFor's Earth-bestiary branch —
##   SpeciesArt, Phase 4 art port; strays d.ts) · combatcore app-coupled exports need an app
##   layer (index.ts) · COSMIC_EPOCH reads 0 in lifts (= capture condition; app wires it
##   Phase 2+) · SessionRNG call-site wiring (Phase 2+).
## ▶▶▶ ★ PHASE 2 HAS STARTED (same day, after a full re-verification: vitest 161 green ·
##   tsc clean · goldenseeds/codefixtures/audioprofiles/preflight PASS · validate FINGERPRINT
##   MATCH 50/50). Phase 2 = plan §20 "Persistence, sharing, and parity harness"; share/champion
##   codes + genome sanitization already landed in Phase 1 (modules 14/strays).
##   LANDED (6d03e81): @cf/domain-progression (COSMIC_EPOCH clock, injected play-time source —
##   harvestclock invariant BY CONSTRUCTION; v1.8.8 load clamp; exact-boundary readiness) ·
##   @cf/persistence (§19.3 stores · CF-RR-002 recovery repository · in-memory + IndexedDB
##   backends; IDB end-to-end proof deliberately deferred to Phase 3's browser slice).
##   ⚠ LESSON, same shape as ever: the reset-law test PASSED its own negative control with the
##   defect live (recover() short-circuits on missing primary — vacuous assertion). Rewritten to
##   drive the real resurrection scenario; ALSO the first sed perturbation silently didn't match —
##   A CONTROL MUST VERIFY ITS PERTURBATION LANDED.
## ✔★ THE SAVE-FIXTURE HARNESS IS BUILT AND GATED (e27e37a): tools/savefixtures.js seeds 9
##   curated saves into localStorage BEFORE boot (bootProbe gained beforeBoot + a url override —
##   jsdom's file:// realm is an OPAQUE ORIGIN where localStorage THROWS; smoke.js's
##   https://game.local precedent), so the REAL boot-time loadSaveWithRecovery loads them,
##   recovery path included. The probe snapshots 72 load-observable fields through the hook
##   (probe-names.json 258→301; validate re-verified 50/50 after regeneration). `npm run
##   savefixtures` is a GATE (+ :capture). Double-boot determinism self-checks on the rich AND
##   recovery fixtures; the recovery path's own minted notification carried Date.now() and is
##   normalized to «minted-at-boot» — the check caught its own leak on the first re-run.
##   Truths pinned: conq e:1e9→EPOCH_BASE while absent-e stays absent · bred size:9 survives
##   UNWRAPPED through the real path · illegal equips + affixes rejected · notifs 70→60 ·
##   hostile {}-for-array loses one field, never the save · backup restore pays out (essence 777).
## ✔★★ THE IMPORTER IS DONE AND PARITY-GREEN (46b317d): @cf/persistence importSaveV2 —
##   the full load path as a pure function (injected now + content registry), 11/11 against
##   save-fixtures.json across the 72-field surface with a completeness assertion. Derived-at-
##   load semantics mirrored (onSpeciesStored rebuilds hybrids/best/maxGen; applyNameplate's
##   rank raise lifts bestRank via the rankInfo score). The content VALIDATION SURFACE is its
##   own gated fixture now: tools/contentregistry.js → port/baseline-v1.8.9/content-registry.json
##   (62 items · 47 materials · 6 techs · tierMax 14; re-captures WITH content changes only).
##   Strays grew the codex grade chain (_sanitizeView, REGIONS, RING_SPECTRUM, ASC_RING_R,
##   regionAt, gradeCapAt, ringGrade); the extractor counts both bracket kinds now.
##   ★ It FOUND 9i (string maxGen poisoning — see the findings list) — the parity harness
##   paying for itself on its first real assignment.
## ✔★★★ PHASE 2 AUTOMATABLE SIDE COMPLETE (92c54c8, same day). The final pieces:
##   exportSaveV2 (doSave's write path pure: thumb strip · land union · seen filter · every
##   bounded slice) + THE ROUND-TRIP FIXED POINT (import→export→import stable from round two;
##   round one moves exactly what a live doSave moves, each transform asserted; codex genomes
##   byte-identical incl. drifted size:9; conquest tier/e exact — `t` rides the anti-edit
##   floor BY DESIGN, a spec error the test caught in itself) + the repository flow end-to-end
##   (write→import→promote→corrupt→recover→import, veteran survives byte-identical).
##   §20 Phase 2 ledger: importer ✔ · IDB repository+recovery ✔ (browser proof = Phase 3) ·
##   codes ✔ (Phase 1 module 14) · sanitization+backup ✔ · COSMIC_EPOCH+harvest ✔ · tsnap
##   rides the round trip ✔ (live rehydration = app layer, Phase 4) · defect injection ✔.
##   ⛔ GATE C: machinery complete; blocked SOLELY on NICK's real veteran save → fixture #10
##   (tools/savefixtures.js takes it verbatim; real timestamps are past ⇒ deterministic).
##   ⚠ Twice-recorded tooling trap: sed restores near twin-shaped lines corrupt the twin
##   (cargo/cgx, twice). Hand-edit restores; the suite caught it both times.
## ═══ ▶▶▶ PHASE 3 IS NEXT — Pixi universe-navigation vertical slice (plan §20) ═══
##   Gate D: open game → navigate universe → Sol → Earth → land → leave → save → reload,
##   desktop AND phone. Scope: Pixi app + renderer selection + resolution policy · scene
##   containers (universe/galaxy/system/surface) · camera & zoom-mode transitions · one
##   galaxy + Sol + Earth + one procedural system · stars/planets/moons/rings with correct
##   occlusion · pointer/touch/wheel/pinch/keyboard input parity · worker pre-generation ·
##   HTML survey card via typed selectors.
##   STARTING ASSETS: every domain module ported+green (worldgen/planetgen/descriptors feed
##   scenes directly) · @cf/persistence closes the save/reload leg · the spike PROVED the
##   painter→Pixi pipeline (port/spike/pipeline.cjs — verbatim painters, 2× shim, custom GLSL;
##   ring occlusion works with no special architecture; soft shading needs a shader).
##   ⚠ OPEN DECISIONS AT KICKOFF: Pixi PIN (Addendum D verified 8.18.1; the spike drifted to
##   8.19.0 — re-verify current stable, pin exact, record) · Vite version pin · where the app
##   workspace lives (plan §18 tree: apps/game with rendering/ui/input/audio/persistence/
##   workers) · headless test story for scenes (Playwright is in the plan for Phase 1 CI;
##   bootperf/uilayout patterns exist for the old build). ⛔ Nick-only: the Gate D phone leg,
##   the Pixi ART verdict (still unjudged — the spike's creature panel was primitives, not
##   Pixi's ceiling), veteran save (Gate C), listening test (Gate G).
##   ★ PHASE 3 FIRST COMMIT IS IN (1591dc3): @cf/scene — the PURE scene-model layer.
##   zoommode.ts (the four st.mode values as a typed state machine; illegal jumps rejected —
##   the st.star-null and NaN-camera crash classes prevented structurally; navToView emits the
##   _sanitizeView shape, closing the loop with persistence) + universe.ts (galaxy nodes from
##   ported galaxiesInCell; test pins that the home view CONTAINS home galaxy 999).
##   ARCHITECTURE RULE: composition pure under vitest; apps/game (NOT yet created) is a dumb
##   Pixi renderer over it. ✔ PIN DECIDED: pixi.js 8.19.0 (stable caught up to the spike —
##   Addendum D's drift note resolved) · vite 8.2.0.
##   ✔ system-mode composition LANDED (3148db6): systemScene — Sol pins its own descent
##   (8 planets in strict orbit order, Earth 133, Saturn ringed; P objects asserted to be the
##   MEMOIZED originals — the systemSol lesson as a structural test).
##   ★ QUALITY PASS same stretch (ad82b65): mechanical field differential importer/exporter vs
##   loadSave/doSave = complete both ways; found+fixed ONE real parity bug (chp/ascp/prime:
##   the game's typeof gates let ARRAYS pass — chp:[7] ⇒ chProg:{'0':7}; my stricter guards
##   dropped it; new fixture hostile_arrays_as_objects pins the class, controlled both ways).
##   ★ port/v2/DEVIATIONS.md — THE IMPROVEMENT LEDGER: every found imperfection the port can
##   beat, parity-first until Nick approves (D-9i string maxGen · D-9e dead fauna filter ·
##   D-LOC locale text · D-HAZE layering · D-RNG SessionRNG wiring · D-NOTIF-T · D-AUDIO-CAP),
##   plus what's already structurally better at zero parity cost.
##   ✔ galaxy-mode LANDED (30b6bc6): the cell convention READ from the Renderer (~4120) —
##   {stars,deco} in galaxy-local px, GCELL=42, content gated on CELL CENTERS within GR=1200,
##   clip ±(HALO/GCELL+1), HALO=GR*1.7. The "empty cells" were the black hole's void (rad<34
##   swallowed) + an instrument error (.length on an object). Soft disc edge: the gate is on
##   centers, stars scatter up to a cell past GR (test corrected WITH the reason).
##   ✔ apps/game SHELL BUILDS (e960e21): Vite 8.2.0 + pixi 8.19.0 pinned; universe→galaxy→
##   system descent through the TESTED nav machine; pan/zoom; Escape/right-click ascent; nav
##   view persists via IndexedDB (its first browser wiring). vite build 260ms, 45KB gzip main.
##   Circle marks = declared scaffolding (HD engine law governs SHIPPED art; painterly
##   pipeline replaces them Phases 4-6). pixi @webgpu/types vs TS7 lib.dom clash: skipLibCheck
##   APP-SCOPED, reason in the tsconfig, root strict.
##   ✔★★ REAL ART + REAL BROWSER (675255c): @cf/art carries GalaxyArt VERBATIM (16 archetypes,
##   per-seed kind-locked faces via galSpriteFor — browser-only, sprites bake at module load);
##   universe mode draws the true painterly sprites with the Renderer's exact transform + the
##   Milky Way label. tools/slicesmoke.mjs (headless Edge, raw CDP, no new deps) PASSES:
##   boot · painted stage (via Pixi extract — 2D drawImage reads a WebGL canvas BLACK, the
##   run-1 instrument error) · real click-descent into gal 999 · ★ VIEW SURVIVES RELOAD through
##   IndexedDB (Gate D's save/reload leg, first browser proof) · zero console errors.
##   Screenshots at port/v2/apps/game/smoke/ (gitignored) — sent to Nick 2026-07-31.
##   ✔★ THE GALAXY LOOKS LIKE THE GAME (78c61f2): ThumbArt + decoSprite/_quasarSpr lifted
##   verbatim into @cf/art (lift-art-extras.mjs); slice layers galaxyHaze + nebulae/shells/
##   remnants at Renderer size factors + star field; system mode draws real getPlanetSprite
##   surfaces. Art-hook seam installed with reasons (_hdLater→setTimeout · getGalaxySprite→
##   galSpriteFor · CARD_FACTS default map until D-STRAYS unification). 'open' clusters await
##   the starSprite painter (recorded). Smoke PASS; galaxy screenshot sent to Nick.
##   ✔★★★ GATE D'S CORE LOOP RUNS (69e2054): universe → Milky Way → Sol → LANDED ON EARTH —
##   clickable painterly planets · the HTML SURVEY CARD over typed selectors (data-sel/
##   data-row), planetDescriptor speaking the whole domain stack (Earth: Green-Gold —
##   Legendary · Home + cradle roster) · surface mode (the world's 1024 painterly master;
##   biome scenes = Phase 6) · camera EASING (pan immediate, zoom eased) · starSprite lifted
##   (open clusters render) · stale persisted seed falls back to home, never bricks boot.
##   slicesmoke drives the FULL loop via a test API that calls the SAME functions as the
##   pointer handlers; reload restores the SURFACE view. Sol + Earth screenshots sent to Nick.
##   Instrument catches: row assertion sliced at 14 (missed Civilization past Earth's roster);
##   Edge component extensions' "message channel closed" noise suppressed via LAUNCH FLAGS,
##   never an error-text filter.
##   ✔★★ THE SLICE SPEAKS THE RENDERER'S VISUAL LANGUAGE (2026-07-31, the quality/graphics
##   batch): the previous NEXT list landed IN ONE PASS, recipes carried number-for-number
##   from main.js 3380-5340. · ZOOM-DRIVEN TRANSITIONS (checkTransitions semantics: dive by
##   zooming into a thing, rise past gz0*0.62/sz0*0.62 floors, starZ=minWH/34 star dives,
##   per-mode zoomLimits, ascent re-centers the outer view on what you left) — ⚠ transitions
##   read camT (INTENT), not the eased cam: a descent's ease-in starts BELOW the ascend floor
##   and would bounce straight back (caught in review before it ever ran) · GALAXY LOD: stars
##   are starSprite painters now (additive, baseR=max(0.7/z,0.55), spiked giants ≥1.5,
##   twinkle >1.3) — the slice's LAST flat-primitive stars are gone · fineStarsInCell resolve
##   layer at z>minWH/260, viewport-windowed, rebuilt on window/bucket change · the Sun
##   marker at SOL_POS (ring 9/z + 'Sun — our star', z>minWH/900 gate; the sol flag rides
##   starsInCell from the domain) · deco pass CORRECTED + COMPLETED (rem was ×2.3, is ×2.6;
##   glob/rogue/fbd were silently SKIPPED — the review found both) · the black-hole disc over
##   the star layers · SYSTEM VIEW PAINTERLY: corona gradient (verbatim stops) + BH/NS/MAG
##   sprites via newly-lifted painters, planets at the Renderer's live orbit angles rotated
##   so their baked light faces the star, day/night terminator overlay, _ringSprite banded
##   rings split back/front around the globe, typed _moonSpr moons on Kepler drifts
##   (SOL_MOONS honored), _rockSet belt+kuiper (110 rocks each, live), _dwarfSpr dwarfs,
##   binary companions orbiting · PINCH ZOOM + cursor-anchored wheel · restoreView VALIDATES
##   mode-context (a mode without its gal/star/planet falls back home, never a blank stage).
##   lift-art-extras.mjs grew 9 painters (_rockSet _ringSprite _starSurf _moonSpr _dwarfSpr
##   _rogueSpr _beamSpr _nsCoreSpr _bhSpr), all self-contained, sha-stamped.
##   ✔ SLICESMOKE IS A STANDING GATE (`npm run smoke` in port/v2) and grew the ZOOM-LADDER
##   leg: surface→Esc→system→zoomout→galaxy→zoomout→universe→EMPTY-SPACE NEGATIVE CONTROL
##   (deep zoom in nothing must NOT dive)→zoomin→Milky Way→hold at z=8 over SOL_POS
##   (asserts fine layer BUILT + Sun marker VISIBLE, screenshot slice-solmark)→zoomin→Sol.
##   Negative-controlled BOTH directions: checkTransitions disabled in a control build →
##   6 named failures; restored → PASS. Gates at close: vitest 21 files/210 · tsc root+app
##   clean · smoke PASS · main.js/html UNTOUCHED (validate battery stands as at v1.8.9).
##   ✔★★★ THE SLICE RUNS ON THE REAL SAVE (2026-07-31, same session, next batch): the
##   nav-view side JSON is GONE — the slice boots through importSaveV2 (fresh expedition =
##   '{}' import), persists through exportSaveV2 (the proven round-trip fixed point), the
##   nav view rides the save's `view` via navToView→_sanitizeView→viewToNav (viewToNav NEW
##   in @cf/scene, DEGRADES toward home — planet-without-star is a galaxy view, no-gal is
##   universe; round-trip tests through the REAL _sanitizeView), landings ride the `land`
##   set, HUD speaks the save (explorer · stardust · worlds landed). An older slice store
##   migrates free (importSaveV2 reads its `view`, defaults the rest).
##   ★ FOUND: describePick (the game's card router, exported since the Descriptors lift)
##   reads `st` AND `customNames` as free globals the capture hooks never installed — it
##   would THROW on first real call (same green-while-broken shape as GAL_SPRITES). Slice
##   installs the seam (D-ST in DEVIATIONS); real-input vitest coverage added (real
##   home-galaxy nebula card · star card + _nameKey · customNames title ride · the
##   CF173-01 null-star bail). ⚠ STALE-LIFT HAZARD recorded: re-lifting Descriptors after
##   registry.mjs grew regionAt added a missing import the old lift left FREE — re-lift
##   after any registry change. GRAPHICS POLISH: deco sprites PICKABLE (describePick cards
##   for nebulae/shells/remnants/rogues/fbd) · fine stars DIVEABLE (main.js 4193 parity) ·
##   _starSurf boiling-surface close-up at the Renderer's DPR gate · moon day/night
##   terminator (baked disc, rotates with the planet's orbit angle) · drifting cloud deck
##   on terran/ocean surfaces (twin-sprite wrap, reduced-motion gated) — _cloudSpr lifted
##   (art extras now 14 painters). SMOKE grew the real-save leg (Earth 133 in `land` after
##   reload · savedView.type='planet' · essence numeric) — negative-controlled BOTH ways
##   (landed push disabled → named FAIL → restored → PASS). Gates: vitest 22 files/216 ·
##   tsc root+app clean · smoke PASS · main.js/html untouched.
##   ✔★★★ SOUND · SURVEY-FIRST · THE UNIVERSE STREAMS (2026-08-01 batch): production-value
##   pass, everything through the shipped recipes. · @cf/audio IS BORN (tools/lift-audio.mjs
##   — playWhoosh/playSurveyPing/playRaritySting + the sfxOut shared-gain bus, VERBATIM;
##   initAudio installs the ac/sfxVol seam over the REAL save's sndOn/sfxVol; ⚠ SCOPE LAW:
##   §15 voices/ambience/mixer stay GATED behind Nick's listening test — this package
##   deliberately carries only the shipped UI stings). Whoosh on every travel/planetfall,
##   sonar ping on every survey lock. · SURVEY-FIRST INTERACTION (the game's own flow):
##   one tap = the survey card (galaxy/quasar/star/deco/wormhole/supernova/protostar via
##   describePick), a quick second tap dives — no more silent teleports; smoke asserts a
##   single tap does NOT descend (negative-controlled: forced single-tap descent → named
##   FAIL). · THE UNIVERSE STREAMS: the window builds around the CAMERA (UCELL crossings
##   rebuild), so panning — or riding the WORMHOLE (verbatim seeded jump, lensing sprite,
##   card; reach clamp = progression's, recorded) — keeps resolving new galaxies. ·
##   COSMIC_EPOCH RUNS FOR REAL: @cf/domain-progression's clock (base from the save,
##   advanced by PLAY seconds only — harvestclock-safe), global installed for ecology's
##   guarded reads, EPOCH_BASE accumulates through exportSaveV2. Supernova sites render
##   epoch-anchored (snSiteSprite/remnant cores/protostar births, all pickable). ·
##   EXPLOIT PASS: showSurvey's esc() hardened for ATTRIBUTE context (quotes) — defense
##   in depth; cleanName upstream already strips quotes. · PERF: CullerPlugin + cullable
##   on stars/deco/fine (offscreen sprites skip render) · rebuildSystemHD destroys the
##   outgoing texture tier (no GPU creep on long zoom sessions). · Art extras = 18
##   painters (+_wormSpr, snSiteSprite, _bhDiscSpr, _protoSpr).
##   Gates: vitest 22/216 · tsc root+app clean · smoke PASS (survey-first + epoch
##   asserts added) · main.js/html untouched.
##   ✔★★★ THE CHARTER GATES TRAVEL · THE UNIVERSE IS COMPLETE (2026-08-01, batch 4):
##   · ASCENT/CHARTER GATING IS LIVE AND PURE: @cf/scene/charter.ts (ascStageOf —
##   "the built system IS the key", reads save.items/ascCh · ascAllowsStar verbatim
##   ladder: stage 0 Sol only / 1 the ASC_RING_R Neighborhood / 2 home galaxy / 3
##   everywhere · reachRadiusOf/withinReachOf/currentRegionOf over strays' REGIONS —
##   state as PARAMETERS, the D-ST lesson applied at birth; 3 new vitest suites).
##   Wired at the descend CHOKE POINTS (every path: tap, zoom, api): blocked dives
##   park BELOW the trigger (the game's *0.97 anti-refire precedent) and TOAST the
##   build that opens the ring (ascHintFor verbatim strings). Wormhole jump wears the
##   verbatim reach clamp toward HOME_POS. SMOKE: fresh save = stage 0 proven live
##   (non-Sol dive REFUSED + charter toast; control: gate disabled → 'CHARTER GATE
##   BROKEN' named FAIL). · UNIVERSE VISUAL COMPLETION (main.js 3578-3795 recipes):
##   cosmic-web breath (WEB_BLOB per cell, web>0.5) + cluster/void far-zoom captions ·
##   QUASARS wear _quasarSpr (the slice had been drawing them as plain galaxies — a
##   parity gap the batch found) with blazar pulse · radio galaxies get baked jet
##   lobes + rotated hosts · tidal bridges between colliding pairs · every non-dwarf
##   galaxy earns its NAME at sz·z>34 · the charter ring + veil + fog-of-war beyond
##   (fog static per rebuild — drift recorded) + 'your charter — {region}' · the
##   observable-universe orange ring at OBS_R. · SYSTEM: comets on stretched orbits
##   (eccentric math verbatim, tails away from the star, zoom-compensated widths,
##   'Comet {properName}' labels) + the tumbling interstellar visitor with its
##   outgassing trail (_visitorSpr/_comaSpr/_vtrailSpr lifted; art extras = 21).
##   · HUD shows the charter region + stage; galaxy rebuild profiled ~70ms (logged
##   by the smoke each run). ⚠ INSTRUMENT LESSON №10-adjacent: the OBS_R ring blew
##   the stage's LOCAL bounds past the max texture size and the smoke's UNFRAMED
##   extract.pixels read back BLACK while the screen was perfect — the painted check
##   failed against a healthy build; fixed by framing the extract to renderer.screen.
##   Gates: vitest 22/219 (+3 charter) · tsc root+app clean · smoke PASS · main.js
##   untouched.
##   ✔★★★ THE NICK-ONLY LIST COLLAPSED TO ITS MINIMUM (2026-08-01, batch 5 — "do the
##   still-yours"): every ⛔ item now has its machine half DONE, so what remains is
##   genuinely judgment/hardware only.
##   · GATE C's FRONT DOOR IS BUILT AND REHEARSED: the slice grew a save-import sheet
##     (⛭ save, top-right — Phase 4's second UI component after the survey card; 44px
##     floors): paste or file-pick your cfcc_save_v2 → VALIDATED through the real
##     importSaveV2 → stored VERBATIM (the fixture-#10 rule) → reboots into it, Ascent
##     stage and all. ⚠ Guard added: the real loader hardens ANY object into a fresh
##     save — right at boot, WRONG in an import sheet (an accidental "{}" would wipe
##     the expedition); the sheet requires known save fields before overwriting.
##     SMOKE REHEARSES THE EXACT FLOW: garbage refused (nothing stored) · the
##     veteran_rich fixture imported through the sheet's own handler → boots as Dakk,
##     ✦5000, surface view restored. Nick's remaining step is literally paste-and-tap.
##   · THE PHONE LEG (emulated half): the smoke now runs a SECOND target at 390×844
##     @ DPR 3 with touch emulation — veteran save FOLLOWS across targets (IndexedDB),
##     stage painted, real two-finger PINCH zooms via the touch path. ★ IT FOUND A
##     REAL BUG: the surface zoom cap of 6× assumed the game's ground tiles; on the
##     slice's 420px globe a pinch-out smeared the master — cap now scales to the
##     sprite's crisp range (Phase 6's vista retunes it). Physical hand-feel = Nick.
##   · THE ART+SOUND VERDICT SHEET: `npm run proofsheet` (tools/proofsheet.mjs) bakes
##     golden-screen vs slice side-by-sides + the two verdict questions into ONE page
##     (apps/game/smoke/proof-sheet.png, headless Edge over file://). Judging is
##     minutes now, not archaeology.
##   · THE LISTENING TEST IS RUNNABLE THE DAY PLAYERS EXIST: port/LISTENING_TEST.md —
##     arms, devices, the two sessions, the 8 questions, and exactly which decisions
##     hang on each answer (f0 curve · legacy voice · ambience resume · §15 sizing).
##   · Also landed: fog-of-war DRIFTS (noise phase re-sampled per tick, verbatim
##     rates) · import sheet + button are real DOM components with data-sel hooks.
##   Gates: vitest 22/219 · tsc root+app clean · smoke PASS (now 4c Gate-C rehearsal +
##   4d phone leg) · proofsheet generated · main.js untouched.
##   ✔★★★ THE PHASE 4 SHELL IS UP — THE SLICE READS LIKE THE GAME (2026-08-01, batch 6):
##   index.html grew the GLASS SYSTEM (mobile-first, safe-areas, 44px floors) and main.ts
##   fills real chrome: · THE UNIFIED TOPBAR — trail breadcrumb (setTrail: Cosmos ›
##   Milky Way › Sun (Sol) › Earth via naming's galaxyName/starName), the PLAYER CHIP
##   (name · ✦ stardust · ❤ hp/HP_MAX · worlds · charter region — all REAL save fields),
##   and ★ THE OBJECTIVE CHIP: ASC_CHAPTERS as pure DATA in charter.ts (text verbatim,
##   the two landfall filters as a scope field) + bankLandfall (the review-catch rule:
##   credit BANKS for every chapter from the current on — TESTED, incl. future-chapter
##   banking + the n-cap) + currentObjective; LANDING ON EARTH MOVES THE CHIP 0/2→1/2
##   IN THE SMOKE, and chapter completion advances ascCh + toasts the unlockNote.
##   Height MEASURED never guessed (--topbar-h via syncTopbarH + ResizeObserver — the
##   game's own law); the survey card sits below it and RESERVES the dock's space (the
##   CF1806-02 burial class prevented structurally, not by z-index luck). · THE HINT
##   PILL + THE CAPTION LINE (setCtxText): the Renderer's own tails — universe ladder
##   verbatim (grain-of-light / beyond-observable / cosmic-web), galaxyStats numbers in
##   galaxy mode ('every dot is one of ~2.1M stars…'), '8 worlds orbit Sol — humanity's
##   own yellow star' with the binary note. · THE DOCK: survey/charts/sound/save, every
##   press proven by an EFFECT — charts toggles the new chartLayer (orbit rings + the
##   HABITABLE ZONE band + belt caption, OFF by default per v1.3.6 Nick's call) and
##   PERSISTS through exportSaveV2; sound flips save.sndOn live; save opens the Gate C
##   sheet. Smoke: dead-button control (handler unwired → 'DOCK PRESS DID NOT LAND').
##   · Smoke asserts REWRITTEN state-based (11 hud-text greps retired) + shell checks
##   (topbar/trail/measured height/objective/captions/dock).
##   ★ THE FIXES-CARRY-OVER LEDGER (Nick's ask — how v1.8.x fixes reach the port):
##   (1) DOMAIN fixes carry by construction — the port's source IS v1.8.9 verbatim,
##   pinned by 200k+ golden cases; bug-for-bug items live in DEVIATIONS.md until
##   approved. (2) UI-LAW fixes carry as STRUCTURE, not patches: CF1806-02 (dock
##   burial) → the card's CSS reserves dock space; the height-sync law → syncTopbarH
##   from day one; one-panel law + tap-empty-close + sticky ✕ → land with the panel
##   manager (next); CF1805-01 (--tut-bot) → lands with the training port; the
##   art-hold law → owns Phase 4's boot sequence when heavy panels arrive. (3) The
##   check battery carries as the smoke's negative-controlled asserts (9 controls so
##   far, all still failing on demand).
##   Gates: vitest 22/220 (+banking suite) · tsc root+app clean · smoke PASS ·
##   proofsheet regenerated · main.js untouched.
##   ✔★★ THE PANEL SYSTEM LIVES (2026-08-01, batch 7): apps/game/src/panels.ts — THE
##   ONE-PANEL LAW as its own module (opening one closes the rest · corner ✕ seated
##   FIRST and STICKY, surviving refills via fillPanel · tap-empty-to-close with the
##   modal exemption — main.js ~16019 semantics). TWO RAIL PANELS: · SETTINGS — every
##   control drives a REAL save field and persists (sound · volume through the shared
##   squared-taper bus, applySfxGain live · charts mirroring the dock both ways ·
##   MOTION Auto/Full/Reduced — motionOK() is LIVE now, Auto follows the OS, and it
##   stills the twinkle/fog-drift/cloud-deck · PANEL TINT driving --glass-a, the
##   game's liquid-glass slider). · COMPENDIUM — read-only over save.codex (name/kind/
##   tier/hybrid/realm rows, empty-state line; virtualization noted for Phase 4's
##   large-catalog bullet; the veteran fixture's 3 entries asserted in the smoke).
##   Dock grew codex+settings (sound moved into Settings). SMOKE: the one-panel law
##   leg (set→codex closes set · ✕ closes · tap-empty closes · the volume slider
##   drives save.sfxVol=0.3) — negative-controlled (closePanels disabled → 'ONE-PANEL
##   LAW BROKEN' named FAIL); slice-settings.png joins the visual record.
##   Gates: vitest 22/220 · tsc clean · smoke PASS (0 fails, 11 controls standing) ·
##   proofsheet regenerated · main.js untouched.
##   ✔★★★ GOLDEN-LAYOUT PARITY (2026-08-01, batch 8 — Nick: "keep the positioning we
##   paid for"): the chrome RE-HOMED to the golden screens' exact geometry, checked
##   against ui-main-desktop/phone.png at full res — the top is FLOATING PILLS on the
##   canvas, NOT a solid bar (the first shell's glass header was a divergence; killed).
##   Player chip top-LEFT (uppercase letter-spaced, the game's voice) with the ❤ HP
##   BAR beneath (green-gradient track — an inline-span height collapse briefly
##   rendered 100/100 as EMPTY; display:block, the min-height-law family) · ✦ Prime
##   Codex n/9 pill top-CENTER (gold border, live primeFill count; display-only until
##   the prime panel ports — no dead buttons) · the TRAIL beneath it, centered
##   small-caps with the current segment lit (#trail's own markup semantics) ·
##   objective chip LEFT @26vh (both goldens) · caption ABOVE hint pill, bottom-center
##   · ≤900px: the round-icon DOCK bottom-center (phone golden) · >900px: Compendium
##   rides the LEFT RAIL, the round cluster sits BOTTOM-RIGHT, dock-codex hides (the
##   ROADMAP-#11 rail lesson made structural). panels.ts grew multi-home buttons
##   (dock + rail share one panel, both light up). ★ THE GEOMETRY CONTRACT is a smoke
##   leg now (uilayout discipline): real bounding boxes vs the golden positions on
##   BOTH viewports, WITH a live self-control — the checker moves the objective chip,
##   must catch it, restores (reproduce-the-reported-geometry law) — so a silent
##   layout drift fails the run by name. Determinism cameo: 'Seizecy Galaxy' renders
##   at the golden's exact spot with the golden's exact name.
##   Gates: vitest 22/220 · tsc clean · smoke PASS (12 standing controls) ·
##   proofsheet regenerated · main.js untouched.
##   ✔★★ THE PHONE PORTRAIT FIXED + SEARCH LIVES (2026-08-01, batch 9 — Nick flagged
##   the portrait misalignment): · the Prime pill was COLLIDING with the player chip
##   on phones — in the phone golden Prime rides the dock tier, so ≤900px hides the
##   top pill · the trail clipped off-right — now centered below the chip rows with
##   ellipsis · the veteran surface OVERFILLED the phone as blur — drawSurface now
##   FITS the globe (fitZ = 0.78·minWH/420) · the player chip ran under the search
##   bar (padding past max-width; box-sizing'd — AND the check that should have seen
##   it only ran on desktop: the PHONE now runs the FULL geometry contract, the
##   instrument-first law again). · ★ THE SEARCH BAR (both goldens' top-right slot):
##   paste a CF1 code → decodeWhere → the SANITIZED view → the SAME charter gates →
##   TRAVEL (encodeWhere/decodeWhere round trip smoke-proven: encode Earth, Escape
##   to the universe, paste, land back on Earth); a non-code string filters the
##   Compendium by name (opens the panel with the filter chip); garbage NEVER moves
##   the camera (asserted). · THE ESCAPE ORDER law lands (search field yields →
##   panels → survey card → ascent) — the smoke's choreography adapted (its first
##   Escape was correctly eaten by an open panel).
##   Gates: vitest 22/220 · tsc clean · smoke PASS (full geometry on BOTH viewports,
##   13 standing controls) · proofsheet regenerated · main.js untouched.
##   ✔★★★ THE COMPENDIUM SPEAKS + RECORDS + CMB + FOCUS (2026-08-01, batch 10):
##   · COMPENDIUM DETAIL CARDS — tap a species row and the WHOLE DOMAIN STACK speaks
##   for one creature: describeSpecies (the fixture-pinned prose incl. the fauna
##   enrichments — diet/anatomy/temper/sense/repro/life/metab/habitat/behavior) +
##   battleStats as FIVE STAT BARS in the game's own STAT_NAMES/STAT_HUES (position-
##   indexed arrays, caught by tsc) + the grade badge in its grade hex. ‹ back
##   returns to the list; rows are delegated (survive refills); the living portrait
##   joins in Phase 5. Genome decode failures degrade to an honest line, never a
##   crash. · RECORDS — the third rail panel (golden's RIGHT-rail slot on desktop,
##   dock on phone): landed/seen/surveyed counts + stardust earned + the JOURNAL
##   (newest-first, empty state). ⚠ The smoke's first Records assert wanted 6 landed
##   worlds from a STALE screenshot memory; the fixture's truth is land=[133,134]=2
##   — the check found ground truth, the expectation was wrong (corrected with the
##   reason). · THE CMB BAND-PICK — a tap on empty space NEAR the observable-
##   universe ring (|dist−OBS_R|·z < 30) opens the origin card; the smoke proves
##   the BAND, not the box (a tap far inside must NOT fire — both directions). ·
##   FOCUS RESTORATION in panels.ts — closing returns focus to the opener (smoke:
##   focus docksets → open → ✕ → activeElement is docksets again). Panels now sit
##   OVER chips/rails (z 22) like the game. slice-codex.png joins the record.
##   Gates: vitest 22/220 · tsc clean · smoke PASS (15 standing controls incl. the
##   detail-row dead-click control) · proofsheet regenerated · main.js untouched.
##   ✔★★★ THE AUDIT SWEEP (2026-08-01, batch 11 — "the full 100 yards"): a fresh-eyes
##   subagent audit of the whole slice + a new throttled-CPU profile, EIGHT findings,
##   all fixed the same batch:
##   · #1 HIGH: THE RECOVERY CONTRACT WAS NEVER WIRED — repo.recover()/
##     promoteLastKnownGood (CF-RR-002, built AND tested in Phase 2) had zero call
##     sites; a transient IDB read failure at boot fell through to a fresh save and
##     the boot's own persist overwrote the evidence within one frame. NOW: corrupt/
##     unreadable primary → recover() restores the backup ONCE; a payload that proves
##     it loads is promoted to last-known-good (the v1.8.9 loadSave semantic); a read
##     that THREW holds all persists until the player acts. The green-while-broken
##     ledger gains a new shape: A SAFETY NET FULLY BUILT, FULLY TESTED, AND NEVER
##     ATTACHED — the tests proved the net, nothing proved the attachment.
##   · #2 Gate C risk: "stored byte-for-byte" was true for ONE FRAME — the first boot
##     persist rewrites the store through exportSaveV2, silently dropping any field
##     the port's schema doesn't carry. The ORIGINAL paste now survives as an
##     untouched keepsake (cf_v2_import_original) and the sheet says so honestly.
##   · #3 pre-boot clicks on charts/search threw on `save` before load — guarded.
##   · #4 clearWorld DETACHED but never DESTROYED — Texts own their canvas textures
##     and the universe rebuilds per pan cell-crossing → GPU creep; children are
##     destroyed now (shared textures survive by default).
##   · #5 sliders exported the whole save per input event — debounced (persistSoon).
##   · #6 toast was the one unescaped innerHTML sink (unexploitable today) — esc'd.
##   · #7 five stale comments contradicting shipped behavior — refreshed, header too.
##   · #8 gz0/sz0 staled across rotation (ascend floor vs dive threshold drift) —
##     recomputed on resize; minWH floored so a zero-sized window can't mint z=0.
##   ★★ THE PERF PROBE FOUND ITS OWN BUG FIRST (instrument law, again): the scene
##   centered at (65,141) on DPR-3 phones — renderer.width is ALREADY logical in
##   Pixi v8, so /(2·resolution) divided twice; invisible on desktop (res 1), wrong
##   on EVERY phone, and the phone smoke's paint/pinch checks were blind to it by
##   construction. Fixed via app.screen at all three sites.
##   ★ `npm run perf` (tools/sliceperf.mjs): 4×-throttled DPR-3 phone — PAINTED
##   1,658ms · ANSWERABLE 1,749ms (press→panel 82ms). The old build's pre-fix window
##   was painted-393ms/answerable-6,440ms; the port meets the v1.8.5 bar with the
##   FULL painterly bake. Galaxy rebuild throttled ~420ms (desktop ~70ms).
##   ⚠ RECORDED for the hardware leg: Pixi pointertap does not fire from CDP-emulated
##   touch in headless (raw pointer events DO — the pinch proves the path); canvas
##   taps on a REAL phone are Nick's to verify.
##   Root gates re-proven same batch: goldenseeds/savefixtures/contentregistry/
##   codefixtures/audioprofiles PASS · validate FINGERPRINT MATCH 50/50.
##   Gates: vitest 22/220 · tsc clean · smoke PASS · main.js untouched.
##   ✔★★★ FIELD TRAINING LIVES + THE ATLAS + THE CARD'S ACTION ROW (2026-08-01,
##   batch 12): · THE TRAINING FRAMEWORK (training.ts) with the first SIX lessons,
##   texts VERBATIM from TUT_STEPS — welcome · find-earth · survey-tour · atlas-add ·
##   atlas-open · land — then an honest graduation ("the cache/feed/breed/duel arc
##   trains the systems, so it waits for the systems — Phase 5"). The LAWS carried:
##   the lesson card publishes --tut-bot (CF1805-01) and structurally CLEARS the dock
##   (CF1806-02 family — smoke-asserted geometry) · `allow` locks chrome to the
##   lesson's own affordances, canvas free only when #cosmos is allowed · the
##   spotlight ring follows its `spot` through layout changes · steps advance ONLY on
##   the REAL gameEvents live play emits (survey/atlas-add/atlas-open/landfall) —
##   never a timer · "Skip training — you lose nothing" is the game's own promise,
##   persists as tut:1 through exportSaveV2 · a truly EMPTY store = a NEW EXPEDITION
##   trains (the absent-⇒-done default keeps protecting held saves, verbatim
##   importer semantics). · THE STAR ATLAS ('log'): save.logMap rows, tap = TRAVEL
##   through jumpToView (the same charter gates), dock ≤900 (7 buttons wrap into the
##   phone golden's two tiers) + the golden's RIGHT-rail slot on desktop. · THE
##   SURVEY CARD'S ACTION ROW restores the game's TRUE two-step: a tap SURVEYS
##   (⛳ Land · + Add to Star Atlas → ★ charted · ⧉ share code → clipboard + toast);
##   pressing LAND is its own act (landfall banking/whoosh ride it). · SMOKE: the
##   fresh-boot main origin now TRAINS and the classic legs skip like a veteran
##   (skip persists); a SECOND ORIGIN (own IndexedDB = a new expedition) runs the
##   full six-step drill end-to-end incl. graduation-persists-across-reload —
##   negative-controlled (event bus severed → 'DRILL: surveying Earth did not
##   advance', by name). ⚠ The drill's first run caught its own choreography bug:
##   descendSystem from universe was correctly REFUSED by the state machine —
##   galaxy first, like a player. slice-training.png joins the record.
##   Gates: vitest 22/220 · tsc clean · smoke PASS (17 standing controls) ·
##   proofsheet regenerated · main.js untouched.
##   ✔★★★ PHASE 5 OPENS — THE LIVING PORTRAITS (2026-08-01, batch 13): the ENTIRE
##   @section hdart [app] (main.js 5427-10647, ~380KB — the HD painterly creature/
##   vista engine) lifted VERBATIM in one range (tools/lift-hdart.mjs, sha-stamped;
##   auto-imports resolved across FIVE domain packages). ⚠ SCOPE HONESTY up front
##   (the GAL_SPRITES rule applied BEFORE it could bite): only the four PORTRAIT
##   painters (hdPortraitFauna/Flora/Fungi/Microbe) are exported and only they are
##   real-render-proven; the vista half rides along DORMANT (its app free
##   identifiers wake in Phase 6); hdGenesFor is a recorded byte-identical duplicate
##   of strays' fixture-pinned copy. The SpeciesArt LRU wrapper HAND-PORTED (bodies
##   verbatim incl. CF-RR-006's device-following cache budget and CF16-005's
##   portrait/thumb split — the ~150MB pinning fix carries). THE COMPENDIUM IS
##   ALIVE: detail cards crowned by the genome's painterly portrait (Dakk's
##   Toruneeus, Neon Green badge, whiskers and all), list rows wear 132px thumbs;
##   painter failures degrade to the text card, never a crash. SMOKE: the portrait
##   src length real-render assert (>5KB data URL = the engine truly painted) +
##   ★ THE RESOLUTION MATRIX — the golden-geometry contract now runs on FOUR
##   viewports (desktop 1280×800 · phone 390×844@3x · tablet-portrait 820×1180 ·
##   small-phone 360×640), the uilayout matrix discipline arriving in the slice.
##   Perf re-profiled after the 380KB ride-along: painted 1,725ms / answerable
##   1,814ms @4× throttle — the bar still holds (bundle code-split noted for the
##   Phase 4 payload budget).
##   Gates: vitest 22/220 · tsc clean · smoke PASS (18 controls) · proofsheet
##   regenerated · main.js untouched.
##   ✔★★★ THE UNIVERSE FILLS IN (2026-08-01, batch 14): · THE BACKDROP (drawBackdrop,
##   main.js 3560 — verbatim recipe): the seeded 900-star field under the deep radial
##   wash, screen-space behind the world, rebuilt per viewport — the flat black is
##   gone at every mode. · ★ THE LIVING PLANETSIDE: landing now shows the world's
##   REAL roster — planetSpecies through a BIOSPHERE REPLICA (the game's own
##   endorsed pattern, main.js 4338: "same rng stream, same draw order — identical
##   values"; body verbatim 2486-2519), Earth's cradle roster through _earthNamePass
##   (Edelweiss · Milkweed · Green Algae · Mangosteen · Mildew · Giant Puffball…),
##   every specimen wearing its hdart portrait in a planetside strip (Phase 4
##   chrome; Phase 6 owns the walkable vista). Epoch-aware by construction — the
##   roster evolves as COSMIC_EPOCH climbs. SMOKE: strip ≥3 species with ≥3 REAL
##   painted portraits (>2KB srcs) asserted on Earth. Perf: painted 1,200ms /
##   answerable 1,875ms @4× (the backdrop actually paints EARLIER now — first pixels
##   before the painterly bake).
##   Gates: vitest 22/220 · tsc clean · smoke PASS (19 asserted behaviors under
##   control) · proofsheet regenerated · main.js untouched.
##   ★★★ NICK'S FIRST UI VERDICT + THE BOT CRITIQUE + THE CLEANLINESS PASS
##   (2026-08-01, batch 15). THE VERDICT, recorded first-class: "not as clean as the
##   old UI — things overlap and aren't as organized." He'll play more; treat the old
##   UI as the bar until he says otherwise. A DESIGN-CRITIQUE SUBAGENT then compared
##   the six slice screens against four goldens ("what the bots think") and ranked 12
##   concrete deltas — its #1 matched Nick's addendum word-for-word: OVERLAPS (three
##   live collisions: captions bleeding through the charter/training cards, rails
##   sitting on the survey card's buttons). The golden's three laws, named: ONE
##   ACCENT (gold marks state; blue only instructs) · CONTENT-HUGGING FLOATING CARDS
##   (own silhouette, never touch a neighbor) · NOTHING NAKED (no raw text, no OS
##   scrollbars, no labels under icons). FIXED SAME BATCH (items 1-8, 10, 12):
##   survey card = floating rounded shadowed panel (edge-weld gone), rails+captions
##   YIELD to open cards (body.card-open / body.training) · panels hug content
##   (bottom:auto + max-height + shadow) · scrollbars disciplined thin everywhere ·
##   dock = quiet 44px icon-only circles · .on states all GOLD (the steel-blue
##   second accent retired incl. the Land button) · HP text INSIDE the fill (one
##   object, golden's compact pill) · panel headers = gold letter-spaced caps with
##   hairline · trail wears a pill (never naked text) · hint verbs light blue.
##   Items 9/11 (button-weight sweep · settings ghost rows) queued with the polish
##   backlog; Nick's replay + the fleet's opinion decide what's next.
##   Gates: vitest 22/220 · tsc clean · smoke PASS (geometry contract green on all
##   four viewports through the restyle) · proofsheet regenerated · main.js
##   untouched.
##   ✔★★ CHARTERS + CLOUD DECKS + THE PILL SWEEP (2026-08-01, batch 16): · THE
##   CHARTERS PANEL — the Ascent's chapter book over ASC_CHAPTERS_DATA + the save's
##   LIVE ascProg: current chapter leads in gold, done chapters ✓, future chapters
##   dim with goals folded, every goal a progress bar (gold at complete); the
##   golden's TOP-left-rail slot on desktop, dock on phone; smoke asserts 3 chapters/
##   current/live goal rows. · THE DRIFTING CLOUD DECKS reach the SYSTEM view
##   (main.js 5256): terran/ocean close-ups, the Renderer's pr·z>22 gate, motion-
##   gated, twin-sprite wrap UNDER the terminator (night shades the clouds — the
##   z-order caught in review). · Critique #9 DONE: the outline-pill button language
##   everywhere (near-transparent bodies, full radius, 34-36px heights).
##   Gates: vitest 22/220 · tsc clean · smoke PASS (20 asserted behaviors) ·
##   proofsheet regenerated · main.js untouched.
##   ✔★★ THE PAYLOAD SPLIT + RESTART TRAINING (2026-08-01, batch 17): · THE PORTRAIT
##   ENGINE IS A LAZY CHUNK — @cf/art grew a './species' subpath; hdart's 380KB
##   (164KB chunk / 49KB gzip) is OFF THE BOOT PATH, idle-prefetched 3s after boot;
##   Compendium/planetside REFILL THEMSELVES when the painters arrive (no blank
##   waits, text renders first — the game's own instant-lo→async-hi pattern). Main
##   chunk 373KB. · SETTINGS → FIELD TRAINING → RESTART: the game's promise
##   ("Settings › Gameplay can restart the 21 lessons any time") — tutDone=false +
##   persist + reload; smoke asserts the control exists (pressing = the fresh-boot
##   training flow, already the drill's own leg). · Critique #11 stays queued for
##   Nick's replay (likely a stale-screenshot artifact).
##   Gates: vitest 22/220 · tsc clean · smoke PASS (21 asserted behaviors) ·
##   perf painted 1,380ms @4× · main.js untouched.
##   ✔★★★ THE ENTIRE EARTH CATALOG + THE PROCEDURAL SPREAD, PAINTED (2026-08-01,
##   batch 18 — Nick: "get to the Earth catalog and procedural generation part"):
##   ★ 1,254 / 1,254 PAINTED, ZERO FAILURES — the FULL Earth roster (631 fauna ·
##   334 flora · 27 fungi · 22 microbes = 1,014 named species via _EARTH_NAMES +
##   makeGenome + _earthName overrides, the hdart module's own _earthArt resolving
##   module-locally) PLUS a 240-portrait procedural spread (4 kingdoms × 3 heats ×
##   20 seeds) — all through the VERBATIM engine in a real browser. This is the
##   game's own "1,010 rendered clean" render-audit gate, PORTED AND EXCEEDED.
##   · `npm run speciesaudit` (audit.html + src/audit.ts, a second vite page +
##   tools/speciesaudit.mjs headless driver): counts, failures BY NAME, and FIVE
##   CONTACT SHEETS baked for the art verdict (smoke/sheet-earth-{fauna,flora,
##   fungi,microbe}.png + sheet-procedural.png — the fungi sheet alone: Chanterelle
##   → Death Cap → Bioluminescent Mushroom, every one its own palette and glow).
##   Fails loudly (exit 1) on any unpainted species — a standing Phase 5 gate.
##   Gates: vitest 22/220 · tsc clean · smoke PASS · main.js untouched.
##   ✔★★★ MORPHOLOGY WAVE 21 — THE NAMED-SPECIES NEEDS_FIX, FAUNA HALF (2026-08-02, batch 42).
##   Every fauna finding read "generic silhouette; add <the one thing>", so the fix splits two
##   ways. ★TAUGHT TO THE SYSTEMS (so siblings stay coherent): FishSpec gained wings/dome/droop/
##   gape/bighead/paddle/eyespot — Flying Fish + Flying Gurnard (pectorals so enlarged they ARE
##   the animal) · Barreleye (a transparent dome over upward TUBULAR eyes) · Blobfish · Basking
##   Shark (a cavernous filter mouth) · Fangtooth + Viperfish · Paddlefish · Butterflyfish.
##   BirdSpec gained wings:'soaring' + headMass — Albatross · Kookaburra · Secretary Bird ·
##   Spoonbill. QuadSpec gained earScale/tailScale (Fennec Fox), InsectSpec wingScale (Wasp).
##   ★BESPOKE where no parameter reaches (faunaoverrides5.ts): Bear (was a spiky yellow sausage;
##   now MASS — shoulder hump, low heavy head, plantigrade paws) · Koala (read rabbit-like) ·
##   ★★Dugong + Manatee HAD NO ROUTE AT ALL and fell through as SPHERES (D-ART-71: a missing
##   route is invisible to the dead-route sentinel — it only proves keys we DID write reach real
##   species) · Humpback (flippers a third of the animal, pleats, tubercles) · Beaked Whale ·
##   Cuttlefish (mantle + fin skirt + W pupil) · Horseshoe Crab (FROM ABOVE) · Sea Squirt ·
##   Lamprey (oral disc + gill pores). Plus Enoki, Black Truffle -> the wave-20 truffle, and
##   Cyanobacteria -> the wave-20 trichome. ★THREE REPEATS OF ONE MISTAKE IN ONE WAVE: the wings
##   VANISHED at 1.35x/0.2 alpha (D-ART-68 scale is the signature); the skull/rostrum/gape read
##   as parts GLUED ON (D-ART-69 wear the body's light, taper in, an aperture is a TUNNEL not a
##   wedge — the gape read as a BROOM until it was); the brush tail's guard hairs made a
##   STARBURST, the kiwi's wave-19 failure verbatim (D-ART-70). ★The brush tail was a
##   CATALOGUE-WIDE defect: one constant-width round-capped stroke gave every fox and snow
##   leopard an orange PIPE. ★artaudit caught 3 of 9 new painters seeding an rng and discarding
##   it. GATES: vitest 225 · tsc · overridecheck 931/931 0 dead · 7/7 controls · artaudit 0
##   findings · artbattery 5/5 · speciesaudit 1254/1254 0 dupes 0 clipped · slicesmoke PASS ·
##   hdart UNTOUCHED. NEXT: the 17 flora NEEDS_FIX rows, then re-export + re-audit.
##   ✔★★★ MORPHOLOGY WAVE 20 — THE PROCEDURAL FAMILIES (2026-08-02, batch 41). 120 of the
##   audit's 165 NEEDS_FIX rows were procedural fungi + microbes, both judged "all 60 outputs
##   remain variations of the same template". TWO things were wrong. (1) TOO FEW FAMILIES —
##   packages/art/src/proceduralfamilies.ts adds 12 painters: fungi TOOTH · JELLY · TRUFFLE ·
##   CUP · CLUB; microbe RODS · SPIRALS · FILAMENT · CHAIN · FLAGELLATE · PLATES · MAT. Both
##   kingdom tables now run 13 deep. (2) THE SELECTOR WAS NOT UNIFORM — form%6 clumps, so half
##   a sample came back puffballs and 5 microbes in 6 were the same amoeba; the picker now
##   avalanches the seed first. ★★AND THE FIRST CUT OF THAT FIX PAINTED NOTHING: 'h ^= h >>> 16'
##   is an INT32 XOR that returns NEGATIVE when the high bit is set, '-3 % 13' is -3, which
##   indexes an array to undefined — 22 OF 60 PROCEDURAL FUNGI RENDERED AN EMPTY FRAME while
##   vitest, tsc, overridecheck and the art battery were ALL GREEN. The contact strip caught it.
##   D-ART-65: UNSIGN EVERY STEP OF A MIXING HASH. Guarded by packages/art/test/familyspread
##   .test.ts, which calls the renderer's OWN selector (a copy would have copied the bug),
##   carries a control reproducing it, and was verified to FAIL with the real selector broken
##   then pass restored. ★Three painted-on tells fixed: microbeMat's substrate RECTANGLE (a box
##   is the loudest painted-on tell in the library) -> a ragged organic field; microbeFilament
##   drawn as beads was indistinguishable from CHAIN, a different family in the same table ->
##   one continuous tube with cross-walls (D-ART-66: a cell is marked by walls, never by gaps);
##   the pennate diatom's full-height straight ribs read as a BARCODE -> a real raphe with three
##   nodules and striae fanning to the margin. GATES: vitest 225 (5 new) · tsc · overridecheck
##   930/930 0 dead · 7/7 controls · artbattery 5/5 · speciesaudit 1254/1254 0 dupes 0 clipped ·
##   slicesmoke PASS · hdart UNTOUCHED. NEXT: wave 21 = the 45 named-species NEEDS_FIX rows;
##   then re-export the five zips and re-run the Platinum audit.
##   ✔★★★ MORPHOLOGY WAVE 19 — ALL 28 PLATINUM RELEASE BLOCKERS CLEARED (2026-08-02, batch 40).
##   Buckets C + D of port/AUDIT_PLATINUM_PLAN.md; with wave 18's A + B this closes EVERY one of
##   the audit's 28 named blockers (fauna 6 · flora 12 · fungi 6 · microbe 4). BUCKET C, 8 iconic
##   flora in floraoverrides3.ts: Cabbage (wrapped lobes — concentric rings read as a snail
##   shell) · Carrot · Corn · Hemp · Tobacco · Watermelon · Wild Strawberry · Kiwi Fruit. The
##   foliage green bias went 0.55 -> 0.82 because Hemp and Tobacco had PINK and BROWN leaves.
##   BUCKET D, faunaoverrides4.ts: Kiwi · Mudskipper · Pyrosome · Salp · Tripod Fish + a rebuilt
##   microbe Foraminiferan (a real trochospiral: 8 chambers, each 22.5% larger, spaced 1.52x
##   their radius so they OVERLAP into one shell; soft sutures, perforate wall, aperture, 76
##   pseudopodia). ★D-ART-61 THE IDENTITY ANCHOR: anchor(p,r,g,b,k) blends the genome tint toward
##   a colour the organism IS — the kiwi rendered lime green and stopped being a kiwi (now 72%
##   brown); foram 55% calcite. ★D-ART-62 A MARK CANNOT BE THE SURFACE: the salp was hoops over
##   an empty fill and read as a coiled spring; fill the volume, then lay bands on it as
##   foreshortened arcs. Same class as kiwi plumage radiating out of the outline instead of
##   draping on the body — THE SURFACE LAWS, verbatim, twice. Tripod fin rays walked in 14
##   segments tapering 3.2->1.2px. GATES: vitest 220 · tsc · overridecheck 930/930 0 dead · 7/7
##   controls · artbattery 5/5 · speciesaudit 1254/1254 0 dupes 0 clipped · hdart UNTOUCHED.
##   NEXT: wave 20 = the 165 NEEDS_FIX polish sweep · wave 21 = procedural fungi + microbe
##   families · then re-export the five zips and re-run the Platinum audit.
##   ✔★★★ MORPHOLOGY WAVE 18 — THE PLATINUM AUDIT: CANONICAL + FUNGI (2026-08-02, batch 39).
##   The 2nd full audit came back — pipeline CLEAN (1,254 open, 440x440, no clip, no byte-dupe,
##   matrix complete), 28 named RELEASE_BLOCKERS. Plan in port/AUDIT_PLATINUM_PLAN.md. Wave 18
##   = buckets A (canonical) + B (fungi), 10 of 28. ★★THE 1,014-vs-1,010 COUNT DELTA IS SOLVED
##   (task #14): the audit's cross-library conflicts name 4 organisms each in 2 kingdom lists
##   (Tardigrade fauna+microbe · Green Algae flora+microbe · Snow Algae flora+microbe ·
##   Reindeer Lichen flora+fungi) = 1,014 rows - 4 dupes = 1,010 unique. Fix = a CANON map in
##   resolveOverride keyed by kingdom+name, each copy rendered for its ROLE: Tardigrade an
##   8-legged animal in both; Green Algae a macroalgal sheet (flora) vs a micro cell (microbe);
##   Snow/Ice Algae a bloom field; Reindeer Lichen one canonical lichen mat; Sea Lettuce a
##   green sheet (macroalgae green-biased since green is identity). ★BUCKET B — 6 bespoke fungi
##   whose SIGNATURE the shared families cannot express: Fly Agaric (red cap + white warts) ·
##   Lion's Mane (white pom-pom of tooth-spines) · Maitake (frond rosette) · Stinkhorn (upright
##   stalk + dark gleba) · Cordyceps (clubs on a host). The override law as designed. D-ART-58..60.
##   GATES: vitest 220 · tsc · artbattery 5/5 · speciesaudit 1254/1254 0 dupes 0 clipped ·
##   slicesmoke PASS · hdart UNTOUCHED. NEXT: bucket C (flora iconic 10) · bucket D (fauna 6) ·
##   re-export + re-audit.
##   ✔★★★ MORPHOLOGY WAVE 17 — THE LAST MONO-TEMPLATE (2026-08-02, batch 38). Nick's audit
##   §12/§13 named two mono-templates (27 fungi = 1 mushroom, 22 microbes = 1 bubble). Wave 1
##   fixed them for NAMED species — but NEVER for the PROCEDURAL spread, and nothing had ever
##   rendered one to notice until wave 13 added proc: to the strip. ★WHAT IT SHOWED: ten
##   procedural fungi = THE SAME THREE MUSHROOMS ten times in ten colours; ten microbes = THE
##   SAME BUBBLE CLUSTER. Heat changed nothing structural. The exact defect Nick called out,
##   still alive in the half of the game no name-based instrument could see. ★THE FIX WAS
##   ROUTING, NOT PAINTING: the families already existed (bracket/puffball/coral/morel/mould/
##   earthstar · tardigrade/diatom/ciliate/amoeba) and were simply UNREACHABLE WITHOUT A NAME.
##   A procedural genome now picks one from its own `form` gene; lumin lights it (D-ART-49).
##   TWO WAVES RUNNING, the win came from making an existing system REACHABLE rather than from
##   new art — which is what the override-layer architecture was for. ★★AND IT EXPOSED A LATENT
##   BUG: fungiMold was PURE HAZE at 0.10 alpha with no substrate. Over a named species'
##   vignette it read fine; on a procedural genome the FIT PASS SCALED A CLOUD OF DUST to fill
##   the frame and the colony VANISHED. It now grows on a ragged crust — and the NAMED Mold,
##   Mildew and Yeast improved too, the tell that the vignette had been carrying a thin painter
##   all along. D-ART-56/57. TASK 19 CLOSED. GATES: vitest 220 · tsc · artbattery 5/5 ·
##   speciesaudit 1254/1254 0 dupes 0 clipped · slicesmoke PASS · perf 1347/2087ms · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 16 — THE SECOND REVIEW PASS (2026-08-01, batch 37). Nick: "make sure
##   we are looking at EVERYTHING not just the least look — we want to nail this execution."
##   Rendered review strips across EVERY category. EIGHT real defects, several in species the
##   first pass called clean — which is the point of a second pass. ★THE RODENT HAUNCH: ~30
##   rodents had ONE FLAT p.dark ellipse on the flank and NO hind foot — the oval read as a
##   HOLE punched in the animal and the rodent FLOATED (exactly Nick's "painted on"). Now a
##   MASS: lit like the body, proud of the flank, soft thigh crease, hind leg folding onto a
##   long foot, forefoot tucked under the chest. ★CEPHALOPOD ARMS: eight constant-width bezier
##   strokes = an octopus that read as a STOOL. An arm is thick at the mantle, TAPERS all the
##   way and CURLS at the tip — now a walk of short segments with shrinking width + a sucker
##   row (same class as D-ART-31: a limb drawn at one width is furniture). ★ALSO: coral was a
##   bare grey twig → a COLONY (5 trunks, deeper branching, 3x polyps) · sea cucumber read as a
##   spiny fish → a soft sausage with BLENDED papillae · comb jelly tentacles bowed out like
##   table legs → they TRAIL · anemone bleached to a shaving brush → tips stay TINTED ·
##   ★Water Lily/Lotus/Duckweed were drawing as vertical KELP STRAPS → aquatic+pad is now
##   floating PADS on a waterline with the flower beside them · herb/vine leaves too small to
##   read → enlarged · Aloe used water pads → a spiky lance rosette. ★★AN INSTRUMENT BUG THE
##   REVIEW EXPOSED: "Lion's Mane" rendered as an EMPTY RED BOX in the strip — the catalog
##   stores a CURLY apostrophe and the lookup compared raw strings, so A SPECIES WE COULD NOT
##   REVIEW WAS INVISIBLE TO REVIEW. Both sides normalised. (The audit was always fine — it
##   iterates the catalog directly.) ★CLEAN on 2nd pass: birds · fish · textured mammals ·
##   rooted quills · turtle grooves · post-clip textures · fungi · microbes · cetaceans · the
##   procedural spread. D-ART-53..55. GATES: vitest 220 · tsc · artbattery 5/5 · speciesaudit
##   1254/1254 0 dupes 0 clipped · slicesmoke PASS · perf 1424/2248ms · hdart UNTOUCHED.
##   FULL EXPORT RE-RUN.
##   ✔★★★ MORPHOLOGY WAVE 15 — THE SYSTEMATIC REVIEW (2026-08-01, batch 36). Nick asked for a
##   full render for his review AND a category-by-category artifact hunt: "the hair, the
##   spikes, the turtle-shell lines all blended… everything stays within the body… not painted
##   on with MS Paint". Rendered dense review strips per category and went through them.
##   ★NICK'S #1 CONCERN — MARKS OFF THE ANIMAL: three retrospective texture passes (snake
##   mottle, myriapod tint, shrimp speckle) were UNCLIPPED and could drift past the silhouette;
##   pulled to the body core / sized to girth / clipped to the carapace. (Quadruped coat, bird
##   plumage, primate fur, turtle scutes were clipped from day one — clean.) ★THE TURTLE SHELL
##   (Nick by name, "lines all blended"): the scute grid was a hard 2.4px stroke = a drawn-on
##   net; now each boundary is a GROOVE (wide soft shadow + thin dark centre + lit lip, weakest
##   at the lit crown) with each scute centre raised so it reads as PLATES. ★THE EEL GHOST
##   BODY: Moray/Electric/Gulper/Oarfish showed a translucent SECOND body — the median fin
##   filled a body-coloured shape 0.72·depth past a thin eel; now a hugging pale MEMBRANE
##   (≤0.30·depth). ★PLANTS (3 defects): tree canopies were a pale MOP on light palettes
##   (task 21 — CLOSED) → foliage GREEN tinted 40% by the hue with its own value structure;
##   grass/grain heads floated free → seated on a stalk joined to the crown; ferns were spiky
##   balls + palms grey mops → the frond is now a feathered arching blade. ★CLEAN in review:
##   birds · fish · textured mammals · rooted quills · and the standout, the PROCEDURAL
##   creatures with wave-14 alien traits. D-ART-50..52. GATES: vitest 220 · tsc · artbattery
##   5/5 · speciesaudit 1254/1254 0 dupes 0 clipped · slicesmoke PASS · hdart UNTOUCHED.
##   FULL-SIZE EXPORT re-run for Nick's system review.
##   ✔★★★ MORPHOLOGY WAVE 14 — STRANGENESS INSIDE OUR LANGUAGE (2026-08-01, batch 35).
##   Nick chose OPTION (b) from wave 13: don't accept a more Earth-like procedural world in
##   exchange for coherence — push the strangeness back IN. ★THE RULE THAT KEEPS IT FROM
##   UNDOING WAVE 13: an alien trait is an ADDITION to a body our systems already draw well,
##   NEVER a replacement. A six-legged creature is still built on the quadruped's jointed
##   limbs, deep chest and tucked waist — it simply has three pairs. That is what makes an
##   alien animal look like an ANIMAL rather than a pile of shapes, and it is why the Earth
##   pass had to come first: we had to know how a real leg attaches before giving something
##   six of them. ★packages/art/src/alientraits.ts — each trait driven by a gene THE ART NEVER
##   SHOWED: legPairs 2/3/4 from loco (pairs spaced along the torso so 6 or 8 legs read as ONE
##   body, not a train of hips) · STALKED eyes · eye CLUSTER · BLIND (a sensory PIT, so the
##   face reads as perceiving not missing) · TENDRILS · plated/chitinous/crystalline/
##   TRANSLUCENT (the shadow of what is INSIDE — the clearest cue a body is not flesh)/warty
##   skins · a membranous DORSAL SAIL · segmented ARMOUR bands. ★★AND THE LUMIN FLAG: every
##   genome since v1.0 has carried it and NO painter had ever drawn it — bioluminescence now
##   renders OUTSIDE the body clip so the glow spills past the silhouette, which is the entire
##   point of a glow. Every skin finish obeys the SURFACE LAWS (wrapped to the form, lit by it)
##   because a plate that ignores the light is exactly the sticker wave 12 killed. ★THE EARTH
##   CATALOGUE IS UNTOUCHED: alien is optional and undefined for every named species — verified
##   by strip vs Giraffe/Hippo/Rhino/Camel/Moose/Wolf/Leopard/Cheetah/Musk Ox/Oryx and by 0
##   duplicate pairs across 1,254. ★DETERMINISM HOLDS: traits selected from genome fields only;
##   goldenseeds 198,000 + v1.0 FINGERPRINT MATCH still passing. D-ART-48/49.
##   GATES: vitest 220 · tsc · artbattery 5/5 · speciesaudit 1254/1254 0 dupes 0 clipped ·
##   slicesmoke PASS · perf 1479/2203ms · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 13 — THE PROCEDURAL CREATURES (2026-08-01, batch 34).
##   ★FIRST AN INSTRUMENT GAP: we had NEVER ONCE LOOKED at a procedural creature — every
##   instrument took a species NAME, so 12 waves were judged entirely on the Earth catalogue.
##   speciesstrip now accepts proc:<kingdom>:h<heat>:s<seed>, rendering a genome with NO
##   _earthName = the exact path every BRED creature takes. ★WHAT IT SHOWED: the procedural art
##   is NOT bad — the verbatim engine reads body/head/pattern/size and draws 16 genuinely alien
##   plans with care. What it does NOT share is the VISUAL LANGUAGE: coloured habitat glows vs
##   our vignette, flat shading vs form shading with rim light, and none of the surface laws.
##   Side by side that reads as TWO GAMES = exactly the "mixed and matched" to avoid.
##   ★SO WAVE 13 IS A ROUTER, NOT A REPLACEMENT: a nameless genome picks a plan FROM ITS OWN
##   GENES — swimmers→fish · four-winged+gliders→bird · four-winged→insect · serpentine→snake ·
##   many-segmented→myriapod · shelled→turtle · sturdy/armored/stilt/tusked/horned/spindly/squat
##   →quadruped · terrestrial flora habits→plant system — inheriting the fit pass, the pattern
##   law and the surface laws. ★★AND IT DELIBERATELY DOES NOT MAP FIVE PLANS (tentacled,
##   membranous, crystalline-plated, gelatinous, radially symmetric) + the alien flora habits:
##   no Earth analogue, verbatim draws them better, and they are WHY procedural life looks
##   alien = D-ART-14 applied to a whole RENDERING PATH. ★DETERMINISM was load-bearing:
##   planFor() reads only genome fields — no Math.random/Date — verified by grep and by
##   goldenseeds 198,000 still passing; break it and share codes + cross-device parity break.
##   ⚠★A TASTE DECISION FOR NICK, NOT A BUG: mapped plans now read markedly more EARTH-LIKE —
##   the coherence asked for, but a real loss of strangeness on 11 of 16 plans. (a) keep as-is,
##   or (b) push alien features back INTO our systems (extra limb pairs from loco, stalked/
##   clustered eyes from head, plated/crystalline skins from skin) so procedural life keeps our
##   language AND its strangeness. (b) is more work and the better end state. D-ART-46/47.
##   GATES: vitest 220 · tsc · artbattery 5/5 · speciesaudit 1254/1254 0 dupes 0 clipped (240
##   procedural included) · slicesmoke PASS · perf 1391/2112ms · goldenseeds 198,000 ·
##   validate FINGERPRINT MATCH · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 12 — THE SURFACE LAWS (2026-08-01, batch 33). Nick: "the fur, the
##   spikes, everything just looks like it's part of the animal and not just painted on".
##   packages/art/src/surface.ts names the THREE GEOMETRIC causes of "painted on" and fixes
##   each: (1) ★IT IGNORED THE FORM — a spot near the rim of a rounded flank is seen edge-on;
##   drawn as the same circle everywhere it announces the body is FLAT. formMark() computes how
##   much a point FACES the viewer, foreshortens across the radius and turns the mark's long
##   axis ALONG the surface. (2) ★IT IGNORED THE LIGHT — the engine lights upper-left, but
##   markings kept ONE opacity across a lit shoulder and a shadowed belly, which is what a
##   DECAL does; dark marks now fade in light, light marks fade in shadow. (3) ★★IT STOPPED AT
##   THE OUTLINE — fur strokes inside a smooth silhouette are WALLPAPER IN A CUTOUT, and the
##   silhouette is the FIRST thing the eye reads. furRim() pushes tufts THROUGH the outline,
##   each starting INSIDE the body so it grows out rather than sits on (musk ox/yak/bison/
##   takin/ibex no longer have the outline of a bar of soap). ★rootedSpine(): a quill drawn as
##   a bare stroke is a pin in a balloon — each now gets a dark SOCKET where it leaves the
##   skin, a two-segment taper, and depth sorting (hedgehog + porcupine the visible win).
##   Applied in the SHARED painters so ~130 quadrupeds gained it at once. ★GOVERNED BY D-ART-41:
##   every change was rendered against a known-good species BEFORE broad application, and
##   faunaWingedInsect (the dragonfly) stays deliberately untouched. D-ART-43..45.
##   ⇒★★★ WAVE 13 NEXT — THE PROCEDURAL CREATURES: resolveOverride keys on _earthName, so a
##   procedural genome falls through to the verbatim engine ENTIRELY — 240 of the audit's 1,254
##   portraits AND EVERY CREATURE A PLAYER BREEDS are untouched by 12 waves of work. Fix =
##   select a BODY PLAN FROM THE GENOME (kingdom + form + heat + limb/wing/fin genes → the same
##   PlantSpec/FishSpec/QuadSpec/InsectSpec structures) so bred creatures inherit the same
##   systems and surface laws. Without it the world splits into "Earth species look right,
##   everything else looks like the old engine". GATES: vitest 220 · tsc · artbattery 5/5 ·
##   speciesaudit 1254/1254 0 dupes 0 clipped · slicesmoke PASS · perf 1357/2164ms · hdart UNTOUCHED.
##   ✔★★★ THE RETROSPECTIVE + THE ART BATTERY (2026-08-01, batch 32). Nick: "hope we didn't
##   miss anything else in all the waves". Answered with an instrument, not from memory:
##   ★tools/artaudit.mjs encodes EVERY defect class this pass has shipped — A dead painters ·
##   B discarded rngs · C unused name params · D degenerate salts · E size-only variation ·
##   F unwired tables · G pattern-globbed file discovery · H stale-bundle readers — and runs
##   them across all 11 waves. ★★IT FOUND SEVEN PAINTERS THROWING THEIR RANDOMNESS AWAY
##   (faunaWingedInsect, faunaBird, reptSnake, reptTurtle, primate, myriapod, shrimpBody):
##   seeded a per-species stream and discarded it with 'void r', so every one of those bodies
##   carried a perfectly UNIFORM surface. Six now spend it on SURFACE TEXTURE — snake scale
##   mottle · turtle scute wear · primate fur breaking the torso into shoulder/flank/haunch ·
##   myriapod segment tint · crustacean carapace speckle · bird plumage groups — all pattern-law
##   (radial falloff, clipped to body, never a stamp). ★★★AND THE TEXTURE PASS IMMEDIATELY
##   BROKE THE BEST THING WE HAVE: texturing faunaWingedInsect turned the DRAGONFLY's venated
##   wings (the species Nick and both reviews singled out) into GREY SMUDGES. Reverted within
##   one strip. ⇒ THE OVERRIDE LAW APPLIES TO OUR OWN IMPROVEMENTS — a later idea of ours is
##   still an override. Its rng stays deliberately unspent, tagged @rng-unused: so the audit
##   accepts it AND the decision stays visible. ★sliceperf.mjs was ALSO reading a stale bundle
##   (D-ART-36's second offender) — every perf number was potentially measured on whatever
##   happened to be on disk; it rebuilds unconditionally now (honest: 1254/1874ms). ★★THE
##   AUDIT'S OWN HOLE, FOUND BY USING IT: check G exempted any pattern merely CONTAINING an
##   extension test, so /overrides\d*\.ts$/ was waved through — and coveragegap had kept that
##   glob one wave too long, UNDER-REPORTING COVERAGE BY 302 SPECIES while the check said
##   clean. Tightened + negative-controlled. ★npm run artbattery = ONE COMMAND, FIVE STAGES
##   (artaudit → overridecheck → overridecontrol → coveragegap → speciesaudit) = 5/5.
##   ★COVERAGE MEASURED: 930/1,014 (91.7%) — fauna 583/631 · flora 321/334 · fungi 16/27 ·
##   microbe 10/22; of 48 fauna left ~35 are deliberately-excluded excellent species.
##   D-ART-40..42. GATES: vitest 220 · tsc · artbattery 5/5 · slicesmoke PASS · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 11 — THE PLANT SYSTEM + THE UNWIRED TABLE (2026-08-01, batch 31).
##   ★THE GAP REPORT WAS WRONG AND HAD BEEN STEERING THE PLAN: the scratch script picking each
##   wave's target carried the SAME hardcoded file list overridecheck shipped with, so after
##   waves 8-10 it reported ~250 covered species as uncovered. Promoted to
##   tools/coveragegap.mjs (reads the directory). Corrected, it said the largest uncovered
##   block was never the animals — it was the PLANTS, 288 of 334. ★THE PLANT SYSTEM: 280
##   routes from ONE plant whose HABIT/LEAF/FLOWER/FRUIT are the species — tree (tapering
##   forking trunk + a THREE-PASS crown: deep mass, lit upper surface, leaves filling it) ·
##   shrub (MANY STEMS FROM THE GROUND = the whole difference from a tree) · herb · grass
##   (FILLED blades, wide at the crown, tapering, bending under their own weight) · cane ·
##   vine (sinuous stem + coiled tendrils) · succulent (ribbed column or pads) · fern (filled
##   pinnae + fiddlehead) · aquatic (straps + kelp gas bladders) · rosette · palm. 10 leaf
##   shapes · 11 fruit types (incl. citrus, grain with awns, cone, pod) · 6 flower
##   architectures (head = ray florets round a disc, umbel, spike, bell, star, catkin) — the
##   answer to "every flower is the same daisy". ★★THE FOURTH BLINDNESS CLASS — THE UNWIRED
##   TABLE: FLORA2_SPEC was imported into speciesoverrides.ts and NEVER CONSULTED by
##   resolveOverride. Every key resolved, so overridecheck reported 927/927 0 dead — while ALL
##   280 ROUTES WERE UNREACHABLE. "The key names a real species" and "the router ever looks at
##   this table" are DIFFERENT CLAIMS. Only the DUPLICATE SENTINEL noticed, via a 15-pair
##   regression when the superseded anti-duplicate entries were retired. overridecheck reports
##   UNWIRED TABLES now; control F proves it fires (7/7 controls). Also: file discovery widened
##   from a NAME PATTERN to every art source — the THIRD time the discovery rule itself was the
##   bug (hardcoded list → export-const-only → *overrides.ts glob). ★COVERAGE MEASURED:
##   927/1,010 (91.8%) — fauna 582 · flora 320 · fungi 16 · microbe 9. ⚠KNOWN+RECORDED: tree
##   crowns read inconsistently across PALETTES (a green oak is beautiful; a pale palette reads
##   as a mop) because crown masses and leaves share the species hue — wave 12 should give the
##   crown its own value structure. D-ART-37..39. GATES: vitest 220 · tsc · speciesaudit
##   1254/1254 0 dupes 0 clipped · overridecheck 927/927 0 dead 0 shadowed 0 unwired ·
##   overridecontrol 7/7 · slicesmoke PASS · perf 1224/1842ms · goldenseeds 198,000 · validate
##   FINGERPRINT MATCH · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 10b — THE INVERTEBRATES + THREE INSTRUMENT BUGS (2026-08-01,
##   batch 30). 83 routes from FIVE body-plan painters — an arthropod is legible from its
##   TAGMATA and LEG COUNT: insect (3 sections/6 legs/antennae + petiole, bee pile, mantis
##   raptorial strike, grasshopper jumping femur, moth plumes, FOUR big wings) · arachnid
##   (2 sections/8 legs/NO antennae + scorpion telson, harvestman span) · myriapod ·
##   crab (claws FORWARD — drawn before the shell they were buried under it) · shrimp (the
##   abdomen CURLS: a shrimp at rest is a comma, never a rod) · plus worms, nudibranch
##   cerata, jellies with TRAILING tentacles, ctenophore comb rows, coral, sponge.
##   ★★★ONE DUPLICATE (Copepod = Tadpole Shrimp) UNCOVERED THREE INSTRUMENT BUGS:
##   (1) ★SCALE IS INVISIBLE — every painter varied by name in OVERALL SIZE, and the FIT PASS
##   rescales every subject to fill the frame, erasing it. Anti-duplicate variation must
##   change a RATIO (aspect/angle/count), never a scale. (2) ★THE DEGENERATE SALT, retroactive
##   to EVERY wave since 7: the helper did ((hash ^ salt) >>> 0) / 2^32, and XOR-ing a small
##   salt moves only the LOWEST byte (~1e-7 after the divide) — so six "independent" axes
##   were ONE axis six times, in waves 7/8/9/10a/10b; near-neighbour hashes also made
##   near-identical animals. Fixed with a murmur3-finalizer AVALANCHE in all five copies.
##   (3) ★★THE AUDIT READ A STALE BUNDLE ALL SESSION — speciesaudit built only if audit.html
##   was MISSING, so once dist/ existed it never rebuilt and every run measured the bundle,
##   not the repo. It reported a duplicate the source had already fixed and would as happily
##   have reported PASS for code that no longer existed. (The strip tool always rebuilt, so
##   every VISUAL check this session was honest.) Audit+export ALWAYS build now, plus a
##   FRESHNESS GUARD that exits 2 if dist is older than any art source. NINTH LESSON: a check
##   that reads a build artefact must prove the artefact is current. ★COVERAGE MEASURED:
##   652/1,010 (64.6%) — fauna 582 · flora 45 · fungi 16 · microbe 9. D-ART-33..36.
##   GATES: vitest 220 · tsc · speciesaudit 1254/1254 0 dupes 0 clipped · overridecheck
##   652/652 · overridecontrol 6/6 · slicesmoke PASS · perf 1321/1973ms · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 10a — THE MAMMAL REMAINDER + THE FIRST SWEEPING PASS (2026-08-01,
##   batch 29). Re-measuring changed the plan again: hiding in the "other" bucket were ~95
##   MAMMALS — bovids/canids/felids/mustelids/bears/pigs/equids/domestics — every one a body
##   plan wave 4's quadruped system already knew. 82 new routes as pure TABLE work. One
##   painter change: ★THE BOVID HORN (straight oryx rapiers · spiral kudu corkscrew · lyre
##   impala · prong pronghorn · shorthorn) because as one generic spike every antelope is the
##   same goat. ★★THE WAVE-9 SHADOW SENTINEL CAUGHT FIVE OF MY OWN MISTAKES BEFORE ANY PIXEL
##   RENDERED: Red Fox, Arctic Fox, Horse and Tapir were ALREADY in QUAD_SPEC (would have been
##   written, listed, never drawn) + one invented name (Gemsbok-like Antelope). ★★★THE FIRST
##   SWEEPING PASS — 130 quadrupeds at once made two survivable-at-40 flaws glaring, both
##   fixed in the SHARED painter so EVERY quadruped improved at once: (1) A LEG HAS A JOINT —
##   four straight even strokes read as a TABLE; limbs now carry a thick upper segment, a THIN
##   cannon bone and a foot, with front and hind bending in OPPOSITE directions (hock back,
##   knee forward). (2) A TORSO IS NOT A SLAB — the underline ran straight from brisket to
##   groin; now a deep chest, a TUCKED WAIST behind the ribs, a rounded rump = the silhouette
##   that makes a wolf read as a wolf before any marking. (3) humps seated ON the back line at
##   their own x (a Bactrian's rear hump hovered over a spine it never touched). NO REGRESSION:
##   verified against Giraffe/Hippo/Rhino/Camel/Moose/Wolf/Leopard/Cheetah. ★COVERAGE MEASURED:
##   569/1,010 (56.3%) — PAST HALFWAY — fauna 499 · flora 45 · fungi 16 · microbe 9. REMAINING:
##   arthropods 67 · worms/cnidaria 22 · marsupials+pinnipeds+cetacean remainder (need posture
##   painters, not table rows) · procedural fungi+microbe · flower-heads · 43 biome scenes.
##   D-ART-30..32. GATES: vitest 220 · tsc · speciesaudit 1254/1254 0/0/0 · overridecheck
##   569/569 0 dead · overridecontrol 6/6 · slicesmoke PASS · perf 1354/2128ms · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 9 — THE BIRDS + A THIRD KIND OF DEAD ROUTE (2026-08-01, batch 28).
##   73 new bird routes by EXTENDING wave 3's faunaBird, not replacing it (D-ART-14). New
##   axes, all optional+defaulted so the 28 wave-3 birds are byte-unchanged: SIZE (a
##   hummingbird is not an ostrich — body scale said so NOWHERE; every bird was one size with
##   different legs) · NECK incl. the swan S-CURVE · TAIL incl. peacock OCELLI · OWL (facial
##   disc + FORWARD-FACING eyes + ear tufts — the one head that does not read in profile) ·
##   SWIM (THE WATERLINE, why a duck reads as a duck and not a bird standing in a hole) ·
##   UPRIGHT (penguin/auk: a stiff FLIPPER, not a wing) · bills short/chisel/needle/duck.
##   Wave-3 birds name-seeded too (Hawk and Falcon shared a spec). A BILL DOES NOT SCALE WITH
##   THE BIRD: linear scaling shrank the hummingbird's needle — as long as its body in life —
##   to a dot; bills keep most of their length when small (exactly 1.0 at sz=1, so no
##   regression). ★★A THIRD KIND OF DEAD ROUTE — SHADOWED: wave 9's swan-necked Swan would
##   NEVER HAVE RUN, because wave 3 already keyed 'Swan' in a table resolveOverride consults
##   first. Both keys resolve to a real species, so the dead-route check was blind BY
##   CONSTRUCTION and the audit stayed 1,254/1,254. overridecheck reports shadowed routes now.
##   ⚠THE INSTRUMENT'S FOURTH SELF-INFLICTED BUG: the shadow check's first run flagged 'Green
##   Algae [FLORA_DUPES shadows MICROBE_NAME]' — NOT a shadow (that name is in BOTH catalogs
##   and resolveOverride branches on KINGDOM first). Kingdom-aware now, which also made 'dead'
##   catch MIS-KINGDOMED keys and coverage count per kingdom. Four self-inflicted bugs from
##   one tool before it found anything real — READ AN INSTRUMENT'S FIRST REPORT AS A BUG
##   REPORT ABOUT THE INSTRUMENT. npm run overridecontrol = SIX controls, all firing (A dead
##   key · B duplicate · C a whole new FILE · D a shadowed species · E an unclassifiable table
##   is REPORTED not silently skipped). ★COVERAGE MEASURED: 488/1,010 (48.3%) — fauna 418 ·
##   flora 45 · fungi 16 · microbe 9. NEARLY HALF the catalog on corrected morphology.
##   REMAINING BY MEASURED SIZE: arthropods 67 · worms/cnidaria 22 · mammal+reptile remainder ·
##   procedural fungi+microbe body plans · flower-heads · 43 biome scenes. D-ART-27..29.
##   GATES: vitest 220 · tsc · speciesaudit 1254/1254 0/0/0 · overridecheck 488/488 0 dead ·
##   overridecontrol 6/6 · slicesmoke PASS · perf 1479/2254ms · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 8 — THE FISH SYSTEM (2026-08-01, batch 27). The gap was MEASURED
##   first (catalog diffed against every table, the wave-7 lesson applied to planning): FISH
##   were the largest uncovered group in the game at 106 species, MORE than the birds (77).
##   ★ONE TRACED BODY, parameterised like wave 4's quadruped: profile (fusiform/deep/eel/
##   globe/box/ribbon) · len · depth · tail (forked/lunate/round/point/SHARK heterocercal/fan)
##   · snout (blunt/jaw/BILL/shovel/tube/HAMMER) · dorsal (one/SAIL/two/spiny/sharkfin) ·
##   pattern — 105 routes, no per-species painters. Shark anatomy (5 gill slits, swept
##   pectorals), the anglerfish LURE on its illicium, photophore rows, teeth, countershading
##   dark-above/pale-below, lateral line, operculum; patterns CLIPPED to the body.
##   ★THREE SIZING BUGS, ONE ROOT (fins scaled from the body's MAXIMUM depth): an eel got a
##   tuna's tail (the Gar wore a green dinner plate); a deep-bodied tang's tail was taller
##   than the tang; round/fan was a free-standing ellipse touching the fish nowhere. Fins are
##   measured AT THE PEDUNCLE, clamped to the body's own height, traced from its edge. Also:
##   an eel with no fin is a stick → the continuous median fin down back and belly.
##   ★★THE SENTINEL WAS BLIND TO ITS OWN CLASS OF BUG: wave 8 added faunaoverrides3.ts and
##   overridecheck reported "NO CHANGE, 310 keys" — its file list was HARDCODED, so a whole
##   new override file was invisible and 105 routes went unchecked. It reads the DIRECTORY
##   now, and tools/overridecheck.control.mjs (npm run overridecontrol) is a committed
##   control set — control C is exactly this bug. ★COVERAGE MEASURED: 415/1,010 (41.1%),
##   up from 310 (30.7%) — fauna 346 · flora 43 · fungi 16 · microbe 10. REMAINING BY
##   MEASURED SIZE: birds 77 · arthropods 67 · worms/cnidaria 22 · mammal+reptile remainder ·
##   procedural fungi+microbe body plans · flower-heads · 43 biome scenes. D-ART-24..26.
##   GATES: vitest 220 · tsc · speciesaudit 1254/1254 0/0/0 · overridecheck 415/415 0 dead ·
##   overridecontrol 5/5 fire · slicesmoke PASS · perf 1241/1925ms (improved) · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 7 — 24 UNREACHABLE PAINTERS, AND THE TWO INSTRUMENTS THAT
##   FOUND THEM (2026-08-01, batch 26). ★★THE FINDING: wave 7's table was written from
##   memory of what ANIMALS exist rather than from what the CATALOG contains — King Cobra,
##   Sea Snake, Bonobo, Tarsier, Chinchilla, Loris, Periwinkle, Coral Snake, Boa Constrictor,
##   Cane Toad, Giant Tortoise, Electric Ray, Ring-Tailed Lemur are not species in this game.
##   Auditing waves 3+4 the same way found ELEVEN MORE (Caterpillar, Grub, Maggot, Lacewing,
##   Sole, Stag Beetle, Bighorn Sheep, Dromedary, White Rhino, Bracken, Water Bear). 24
##   painters written, listed and unreachable — while EVERY species audit stayed green at
##   1,254/1,254, because an audit renders the names the CATALOG asks for and cannot see a
##   key the catalog never mentions. The project's own law in a new costume: a check only
##   sees the axis it measures. ★tools/overridecheck.mjs (npm run overridecheck) exits 1 on
##   any unresolvable key WITH the nearest real name, and on duplicate keys; its own first
##   cut reported 38 phantom dead routes (painter OPTIONS are strings too) and skipped both
##   non-exported tables — negative-controlled both directions now. ★tools/speciesstrip.mjs
##   (npm run strip "A,B,C") = THE EYEBALL INSTRUMENT: any named list rendered big and
##   labelled through the audit's own genome. It found the dead routes AND four bad painters
##   in one look. FIXED FROM THE STRIP: snakes were beads (46 stamped discs) → one continuous
##   200-segment ribbon with scale-row lighting; the cobra's hood vanished into the coil →
##   a notched shield with its own contrast; frogs read as spiders → the hind leg's three
##   real masses; the rabbit was a blob (the ear ellipse reached below the chin) → ears
##   anchored by their BASE; every primate was a ball in a gown → traced shoulder-to-hip
##   torso + legs drawn in FRONT; shells were painted roses → shaded whorl spheres; starfish
##   plumped; anemone tentacles carry their own colour. ★NEW BODY PLANS: salamander (paddle
##   tail + axolotl gills), starfish, urchin, anemone, and the snail as an ANIMAL (foot +
##   eyestalks, not a shell on the ground). ★WAVE 6's DUPLICATE SENTINEL EARNED ITS KEEP:
##   caught Howler = Spider Monkey and Macaque = Baboon on the first wave-7 audit (painters
##   keyed on OPTIONS, ignoring the NAME — the flora ladder bug in fauna); every wave-7
##   painter is now name-seeded. ★COVERAGE IS NOW MEASURED, NOT CLAIMED: 310 of 1,010 Earth
##   species (30.7%) = fauna 241 · flora 43 · fungi 16 · microbe 10. (Wave 6's claimed "5
##   fungi routes covering all 27" was wrong — it covers 16.) D-ART-19..23. GATES: vitest
##   220 · tsc · speciesaudit 1254/1254 0 fails 0 dupes 0 clipped · overridecheck 310/310
##   0 dead · slicesmoke PASS · perf 1400/2091ms · goldenseeds 198,000 · codefixtures ·
##   audioprofiles · savefixtures · validate FINGERPRINT MATCH · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 6 — THE PRE-CLIP BUG + THE CLIP SENTINEL (2026-08-01, batch 25).
##   Nick: "the hippo's nose is STILL cut off, it's not round — check that on ALL the artwork".
##   ★ROOT CAUSE: wave 5's fit pass measured ink on a 440 layer, but a painter reaching past
##   440 is CUT BY THE CANVAS EDGE BEFORE the measurement — fitInk was faithfully centring an
##   already-severed muzzle (a fit can only rescale what survived the draw). FIX: the ink layer
##   is OVERSIZED (2S) with the painter origin offset by S/2, so overflow in every direction
##   survives and the measurement sees the WHOLE subject. ★THE CLIP SENTINEL: fitInk records
##   any subject whose ink still reaches the layer edge and speciesaudit EXITS 1 naming them —
##   "check all the artwork" automated forever. Run: 1,254/1,254 · 0 fails · 0 dupes · 0
##   CLIPPED. Hippo's jaw:'barrel' now draws a blunt ROUND block with nostril pads.
##   ★ COVERAGE (Nick asked if the creatures are done — honest answer NO): 160 of 1,014 Earth
##   species corrected (15.8%) = 5 fungi routes (all 27) · 4 microbe · 8 iconic flora · 37
##   anti-dupe flora · 66 fauna specialists · 40 quadrupeds. The other 854 stay on the
##   byte-verbatim engine BY DESIGN (D-ART-14). NEXT in rank order: reptiles/amphibians ·
##   rodents · remaining fish/shellfish · primates · the bird long tail · procedural fungi +
##   microbe body plans (audit §12/§13) · flower-head families · the 43 biome scenes (Phase 6).
##   D-ART-17/18. Gates: vitest 22/220 · tsc · slicesmoke PASS · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 5 — NICK'S TWO LAWS: FIT THE FRAME · BLEND THE PATTERN (2026-08-01,
##   batch 24). From his wave-4 review ("the hippo's nose is off screen, same with the giraffe
##   … the spots are like octagons — make them blend into the skin, that's how it should look
##   on ALL creatures"). ★LAW 1 THE FIT PASS: resolveOverride paints every subject to a
##   TRANSPARENT layer, measures its ink bounds, and scales+centres it into the frame at a 0.90
##   margin (shrink-only) — the verbatim engine's own _fitPlant convention generalised to EVERY
##   override painter across all four kingdoms, so a clipped subject cannot happen again.
##   ★LAW 2 THE PATTERN LAW: softMark() draws every coat mark as a radial gradient falling to
##   ZERO alpha at the rim, and organic patches are CLUSTERS of overlapping soft lobes — the
##   6-gon giraffe stamp is gone, replaced by 84 blended patches over the FULL torso (the old
##   range missed the upper back) and carried up the neck as soft marks (was a dashed stroke).
##   Spots (78), rosettes (broken soft rings + core) and stripes all rewritten the same way.
##   Also: 'level' backs got a gentle withers-to-rump curve — a ruler-straight spine reads as a
##   table edge, never an animal. D-ART-15/16. Gates: 1,254/1,254 · 0 fails · 0 dupes ·
##   vitest 22/220 · slicesmoke PASS · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 4 — THE QUADRUPED SYSTEM + THE OVERRIDE LAW (2026-08-01, batch 23;
##   Nick: carry wave 3's structure "to everything, forward and backward"). ONE parameterized
##   mammal painter whose SPEC is the species: leg/depth/neck/BACK PROFILE (level/humped/sloped/
##   arched)/muzzle/jaw/ears/tail/coat/SIGNATURE ORGAN (nose horn, ossicone, palmate + branched
##   antlers, tusks, curled horn, humps, trunk). PROPORTION CARRIES IDENTITY BEFORE DECORATION;
##   coats CLIPPED to the torso (fur, not stickers); species-true hue only where color IS
##   identity (white Polar Bear, Panda blocking). 40 species: Rhino ≠ Hippo at last (twin horns
##   + longer legs vs barrel jaw + stub legs + tiny ears), Camel humps + curved neck, Giraffe
##   patches UP the neck + ossicones, Moose palmate antlers on a humped shoulder, Bison hump +
##   shag, Cheetah spots + tear lines, Fennec huge ears, Hyena sloped back, bears differentiated.
##   ★★ THE OVERRIDE LAW, LEARNED THE HARD WAY: NEVER OVERRIDE WHAT ALREADY EXCELS — the generic
##   quadruped made the verbatim ELEPHANT (4.5/5, real curled trunk) WORSE; Elephants/Zebra/
##   Tiger/Lion/Red Panda/Raccoon REMOVED, keeping the bespoke painter. Governs all future waves.
##   Two painterly fixes same review: faceted back line → midpoint-quadratic smoothing; flat
##   spine rim → gradient that FADES at both ends. D-ART-13/14. Gates: 1,254/1,254 · 0 fails ·
##   0 dupes · vitest 22/220 · slicesmoke PASS · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 3 — FAUNA SPECIALISTS + THE WING (2026-08-01, batch 22).
##   BLOCKER 4 (life stages): Fly Larvae/Maggot/Caterpillar were drawn as WINGED ADULTS →
##   now legless segmented grubs; Dragonfly/Damselfly had NO WINGS → now two venated wing
##   pairs + compound eyes + 6 legs; Springtail wingless w/ furcula; Ladybug/Firefly/Diving
##   Beetle get real elytra (spots/glow/paddle legs); Fiddler Crab ONE huge claw; Horseshoe
##   Crab carapace+spine. BLOCKER 6 (specialist bodies): flatfish lie FLAT with BOTH EYES
##   UPPER (Flounder/Halibut/Sole); Angelfish deep+tall-finned; Lionfish spine fan;
##   cephalopods get 8 arms + fin skirt (+2 squid tentacles); cetaceans get a HORIZONTAL
##   FLUKE + per-species dorsal (Blue Whale ≠ Dolphin at last). ★ THE WING — the agents’ #1
##   systemic (NO bird in 631 had one): faunaBird draws layered coverts + primaries, with
##   BILL SHAPE and LEG LENGTH as species params (raptor/wader/spoon/huge/flightless);
##   ⚠ review catch — the leg math kept the body at fixed height so a Flamingo didn’t tower;
##   body now rides legLen above a fixed ground line. Wave 4 = the quadruped polish (Rhino vs
##   Hippo, cheetah spots) — right FAMILY today, just under-differentiated. D-ART-10/11/12.
##   Gates: 1,254/1,254 · 0 fails · 0 dupes · vitest 22/220 · slicesmoke PASS · hdart UNTOUCHED.
##   ✔★★★ MORPHOLOGY WAVE 2 — THE FLORA DUPLICATES DIE (2026-08-01, batch 21). ★ ROOT CAUSE
##   PROVEN for Blocker 3: the verbatim flora painter’s generic LEAF LADDER is deterministic
##   per FORM and the species NAME never reaches it — Acai/Milkweed/Salmonberry have DIFFERENT
##   genomes (form 12/10/1) yet rendered byte-identical. A code-shape problem, not art taste.
##   FIX (packages/art/src/floraoverrides.ts): a NAME-SEEDED painter — leaf count, phyllotaxy,
##   angle, stem lean, fruiting organ all hash from the species’ OWN NAME xor its genome seed,
##   so two labels can never collide again STRUCTURALLY. Result: 16 groups → 0, 38 files → 0,
##   all 334 flora unique. ICONIC PLANTS (Blocker 5) got real bodies: Rafflesia (5 spotted
##   lobes, no stem), Pineapple (rosette+crosshatched fruit+crown), Joshua Tree, Cotton bolls,
##   Dragon Fruit, Rhubarb/Tobacco petioles, Cabbage head. ★ THE DUPLICATE SENTINEL IS NOW
##   PERMANENT (Nick §17): speciesaudit hashes every Earth portrait and EXITS 1 naming any two
##   species that render identically. Gates: 1,254/1,254 · 0 failures · 0 dupes · vitest 22/220
##   · tsc · slicesmoke PASS · hdart.verbatim.js STILL UNTOUCHED. D-ART-8/9 in DEVIATIONS.
##   ✔★★★ THE MORPHOLOGY PASS — WAVE 1 LANDED (2026-08-01, batch 20 — Nick: "go the whole
##   slate, it all begins with the art"). The plan is port/MORPHOLOGY_PASS.md (the cold-start
##   guide). ARCHITECTURE: corrections live in packages/art/src/speciesoverrides.ts ATOP the
##   verbatim engine — speciesPortrait consults it first by _earthName (curly-apostrophe
##   normalized, catching the Lion’s-Mane mojibake), unmatched species stay BYTE-VERBATIM
##   so the hdart lift stays pristine + re-liftable. Palette read exactly as the engine does
##   → bodies, not recolors. WAVE 1 broke the two mono-templates Nick flagged as blockers:
##   FUNGI now bracket/shelf/puffball/coral/morel/mold/earthstar families (Black Truffle =
##   round ball, Turkey Tail = shelves on wood, Coral/Lion’s-Mane/Cordyceps branch, Morel
##   honeycombed, Mold/Yeast fuzzy) with true gilled mushrooms falling through; MICROBES now
##   tardigrade (contrast-guaranteed amber water bear)/diatom/radiolarian/ciliate/amoeba.
##   D-ART-6 + D-ART-7 in DEVIATIONS. PROOF: speciesaudit 1,254/1,254 painted 0 failures
##   (parity held) · the fungi/microbe contact sheets are before/after · vitest 22/220 · tsc
##   clean · slicesmoke PASS. REMAINING WAVES tracked in MORPHOLOGY_PASS.md (P1 dupes/manifest
##   → P2 fauna specialists/iconic flora → P3 fauna family polish → P4 procedural depth).
##   ★★★ THE SPECIES ART REVIEW IS IN (2026-08-01, batch 19): three independent
##   review agents over the FULL-SIZE exports → port/ART_REVIEW_SPECIES_2026-08-01.md.
##   Headline: the painterly language is coherent and the best pieces prove the engine
##   (Elephant/Owl/Chameleon/Scorpion · Sunflower/Fern/Corn/Flytrap); the lever is
##   PER-SPECIES DIFFERENTIATION, not style. The systemic five (D-ART-1..5, ALL
##   deviations awaiting Nick): defining-feature guarantees (no bird in 631 has a wing
##   silhouette; Rhino≈Hippo; Camel 1/5) · pattern/color legibility (no cheetah spots,
##   grey polar bear) · a contrast floor (dark subjects vanish) · break the three
##   mono-templates (27 fungi = ONE mushroom recolored; 22 microbes = ONE bubble
##   cluster — Tardigrade invisible; all flower heads = one daisy) · procedural depth
##   (heat is palette-only; COLD-FLORA BLUR BUG — likely real code; a flat-vector
##   conifer violates the HD law). Phase-5 archetype bar: CLEARS (fish/jellyfish/
##   urchin/metaball-quadruped), carried by fauna. Flora is the best kingdom (~20 true
##   growth habits). RECONVENE: Nick runs his system over the zips; the two reviews
##   merge into the approved deviation slate.
##   ▶ NEXT: Nick's art verdict over the five sheets (the Phase 5 quality gate
##   wants THREE radically different procedural archetypes judged) · encounter
##   surfaces · the Phase-5 training lessons · raritySting · codex virtualization ·
##   evolveGenome epoch sweep in the audit (aged forms) · #11 verify.
##   ⛔ Nick (unchanged minimum): PASTE the real save into 📥 save · hold the phone ·
##   the five sheets + proof-sheet.png + listen · recruit the 12-24.
##   ⚠ THRICE-RECORDED THIS SESSION: wrong-cwd commands damaged root files twice and a root
##   npm install once — ALWAYS cd explicitly before root-file or package.json work.
##   Cold start: this block → port/v2/README.md → plan §20 Phase 3 + §18 tree + Addendum D.
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
## ▶ STILL NICK'S, and Phase 0 CANNOT FULLY CLOSE without them: the HUMAN LISTENING TEST
##   (12-24 players; no automated fleet can score it — Playwright runs --mute-audio) · a REAL
##   VETERAN SAVE for Gate C (now the blocking input for Phase 2) · the Canvas/Pixi spike's
##   ART VERDICT.
## ⚠ THE 9x FINDINGS (2026-07-31), status: 9e (biome→fauna filter dead code — OPEN, main.js) ·
##   9f (stale premise in the `size` note — CORRECTED in the _sanitizeSavedGenome comment,
##   NICK'S CALL still open on the drift-balance question) · ✔ 9g CLOSED (guarded in the port:
##   data invariant at module 8 + end-to-end through speciesGrade at module 9) ·
##   9h (browser as undeclared dependency — OPEN, tools/preflight owns it) ·
##   ★ 9i NEW (found BY the importer parity test, 2026-07-31): _sanitizeSavedGenome clamps
##   brood/fed/xp/hurt but NOT `gen`; onSpeciesStored (main.js ~14018) compares coercively and
##   assigns entry.gen RAW — a hostile save's gen:'2' (string) lands in stats.maxGen and
##   PERSISTS into every future save (any maxGen+1 would concatenate to '21'). Candidate
##   one-line fix (coerce gen at the comparison or add gen to the sanitizer's clamp list) is
##   a DELIBERATE v1.9 change, not a critical fix — the freeze rule holds; the port reproduces
##   it bug-for-bug until then (save-fixtures pins the string; both sides flagged in code).
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
