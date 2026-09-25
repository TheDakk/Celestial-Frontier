# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · PROCEDURAL_CHARACTERISTICS · CREATURE_ANIMATION · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS · LOCAL_AI_GENERATION) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## SESSION HANDOFF — September 25, 2026 (night) · C15 WIRED (9 PAINTED CREATURES), STAGE SPACING + FULL TRAVEL, §20 COMMAND/DUELS/PHASE, D16 ×7, A5 ×8, C13 PINS
This block is self-contained: either lane can resume from it alone. Older handoffs are archived verbatim at the top of `ROADMAP_ARCHIVE.md`.

**State of the branches.**
- **`anthropic/mac`:** pushed through this handoff's commit, every commit signed G with the repo keychain key (`git-ssh-sign-cf`). `origin` is HTTPS via `gh`.
  - It merged `openai/mac` at `e1cc9514` (Codex's 30 C15 commits; `d1dbb979`), then again at `7f88590c` (11 more: Racer, Grouse, Sandpiper, Herring, Wild Horse, Salamander, Eel, Honeybee and a gallop contact fix; `70a0f776`; 5,382 pass, only I5 red). Those new candidates wait on pack room (mailbox C25).
  - It also merged four isolated agent branches from this session: A5 tests, D16 ports, §20 Command, and C13 pins. They were reconciled by hand in `96eb2e2c`.
- **`develop`:** still `c1791e21`. PR #43 is still open. No hosted attempt is eligible (D5): I5 is red, and so is the hidden root typecheck below.
- **The dev site:** republished from this session's head. The exact commit is in the site's `version.json`, and the evidence is in `audits/DEV_PUBLISH/<head>/`.
- **The gate:** `node tools/check-profile.mjs --profile=develop` from `port/v2`.
  - Result: **5,373 pass, and the only red is I5.** The app and worker typechecks show 0 errors. artaudit, overridecheck, speccheck and overridecontrol all exit 0 when run one by one.
  - **Hidden red:** the profile stops at the first failure, so while I5 is red the root `tsc --noEmit --noUnusedLocals` never runs. It has 185 errors that were already there, all in Codex's motion → pixi/@webgpu path plus `motion/overlay.ts`. See mailbox C24.

**What this session delivered.**
- **C15 wiring** (`audits/C15_WIRING_20260925/README.md`):
  - Nine new painted creatures on the card, the stand-ins and the arena: Bass, Tang, Jellyfish (hash-bound sting declaration, proven before play), Dragonfly, Sturgeon, Wolf, Impala (interior-05), River Otter, and Heron (observed supports). The library is now 26.
  - Procedural jellies draw as the Jellyfish.
  - Two family-level accent plans: a swimming-bell radial is one coat, and a flying insect's accent is its antennae only.
  - Held, though they pass the integrated check (`tools/morph/budget-held-archetypes.json`): Pike, Goose, Ibex, Cougar, Marmot and Wall Lizard by the 128 MiB pack cap, and the Gull by CARD = STAGE.
- **Stage** (Claude's):
  - Codex's layered-reach and faint-idle-settle patches are applied, and the layered reach is cached by complete input.
  - READY spacing: a 0.10 frame gap between the painted boxes.
  - The run-up goes box to box, all the way to contact.
  - The high-flyer damage number stays inside the frame.
  - Tests: `ready-spacing.test.ts`, and the library test with each fit's declaration and supports.
- **§20 step 4** (`audits/COMBAT_S20_COMMAND_20260925/README.md`):
  - The Command open-encounter record: sealed plan, CAS decisions, one-receipt settlement, reload to the pending Break.
  - The Break UI (Hold / Swap / Continue / Withdraw / Settle) and battle2 relay beats.
  - Friendly duels: CFB paste, +8 XP on a win, a play-time window.
  - The Guardian phase change at half health (placeholder numbers for S4).
- **D16** (`audits/D16_PARITY_20260925/README.md`): craft ×5, pin recipe, salvage-all + "don't ask again", Prime travel + Titan tracking, reset expedition, the pop-up switch (audio still fires with pop-ups off) and tooltips + switch.
- **A5 outcome tests:** Guardian combat through the card, notification read on a real backend, the Atlas verbs, the frontier ending, card travel, the inventory transaction, and the PWA update with a write in flight. 44 tests, no product bugs.
- **C13** (`audits/C13_PIN_GENERATOR_20260925/README.md`): the generated master pins (26) behind a private frozen registry, with pre-decode admission. The masters still ship.

**Next, by owner.**
- **Claude:**
  1. A single CARD = STAGE tint decision. Measure it once, share it with the stage, then un-hold the Gull.
  2. When Codex's C13 overload is green, remove the masters from the pack and un-hold the six budget-held creatures (re-add the rows from the JSON, rebuild, then run the library test and picker smoke).
  3. The CFB export (sharing your own creature). The rest of D16: card fold/More/vista/postcard (D18), the Guide tour (D19), and the Compendium tools (they touch the I5 scene).
  4. The remaining A5 gaps: #57 Titan through the card, #73 the doll slot picker, #81 passive Charter banking, the XP ledger after Land/capture/Feed, and #11/#92.
  5. Keep merging Codex's signed C15 commits and wiring the passed candidates.
- **Codex:**
  - C21: acknowledge.
  - C22: make the layered reach cheaper (the phone load stall).
  - C23: the C13 loader overload and zero-master-fetch controls.
  - C24: clean the root typecheck.
  - Then the S4 instrument (the stance, phase and Recovery numbers; the party XP split; a review of the two new save carriers), then C8/I5.
- **Nick:** answer D13–D15 and D17–D19, one line each, in `audits/MAILBOX/DECISIONS.md`. Play the dev URL on the iPhone (the H1 probe gates D6): `?battle2=1&vs=Bass,Tang`, `vs=Wolf,Impala`, `vs=Dragonfly,Heron`, `vs=Jellyfish,Sturgeon`.

**Traps (obey them; the earlier list is still in force, archived).**
- **Agent worktrees are cut from `develop`, not from your branch.** Rebase them first, and give `port/v2/node_modules` a copy-on-write copy (`cp -cR`), not a symlink: a symlink makes `@cf/*` resolve into the parent tree.
- **`check-profile` stops at the first red.** "Sole red I5" hides the typechecks, artaudit, overridecheck and speccheck, so run them by hand.
- **Slice-executing tests** (A5, D16, arc6) run exact `main.ts` regions with a `with(env)`. New code placed inside another test's slice fails with a `ReferenceError`. Add the real function to that env, or end the slice at its own block.
- **`run-unit-tests.mjs` builds the PWA pack first.** Over 128 MiB, every test run dies with `RangeError`, so check the pack before adding art (non-arena ≈ 54.5 MiB).
- **The card builder's registry test counts `earthName` literals in `build-card-masters.mjs`.** Keep data such as held rows in JSON.
- **A mask set with `../` file paths** ships at `markings/<name>`; only the shipped copy is rewritten.
- **Rig loads now take seconds** (the layered reach). Tests that load rigs need explicit timeouts.

### What Claude owes next
-111. **C15 wired + stage spacing + four merged lanes (2026-09-25 night).** See this block's summary and `audits/C15_WIRING_20260925/`. Nine creatures wired; seven held with reasons. READY_GAP 0.10, box-to-box run-up to contact, layered reach cached. §20 Command/duels/phase, D16 ×7, A5 ×8 and C13 pins merged. 5,373 pass; only I5 is red (plus the hidden root tsc, which is Codex's).
-110. **§20 Auto Guardian parties live end to end:**
- the engine (S1, parity-locked);
- the party planner (one receipt);
- the Recovery helpers for both carriers, plus the persistence routing and verification;
- the card (stance, two Guardian party slots, "Your plan" forecast), with the plan state in Main;
- the Chronicle prelude.

The end-to-end persistence test found two real gaps: an unowned member, and an unchecked not-fought member in Recovery. Both are fixed.
Next: Command (Breaks) through the open-encounter record, then S4 (Codex), friendly duels, and the Guardian phase change.
-109. **Defeat adds no wound** (§20 applied): a wound on the fallen alone would make Swap necessary.
-108. **Defeat is Recovery, never loss** for every companion and captured Guardian (the 9 tests that pinned permanent loss now prove the
new law).
-107. **A5 outcome tests:** Discover Life (10), Scavenge (7), Breed (10), Rename + Scout (12). No bugs.
-106. **Play-time harvest ported (v1.8.9 parity, `9e4c5959`):** `world-harvest.ts`, conquered-world card button, active-play epochs (see
`ECONOMY_LOOT_CRAFTING.md` v2 note). Owner and wiring tests include THE CLOCK LAW. Trap: an unpublished epoch is refused (the save clamps
`e` to `EPOCH_BASE`), and the runner lives just before `const sideEl`, because tests execute the `surveyPlanet → buildCardActions` region
and the Binder slice runs up to `arc9TravelInspectionOnly`.
-105. **Parity Settings + notifications:** Battle sounds (`cbx`), Confirm salvage (`sv`), Mark all read, and a two-tap Clear all with exact
rollback. v1's open-marks-read stays dropped by design (v2 leaves unread unread).
-104. **A5 outcome tests (browser-free, real controls, durable read-back, mutation controls):** Charter accept (9), Binder claim (9),
Settings identity (13). No product bugs found. Inventory: `audits/A5_OUTCOME_TESTS_20260925/INVENTORY.md`; remaining top gaps: combat/Guardian
via the card, bioscan, breed, scavenge, rename/scout, the Atlas verbs, the XP/achievement ledger after a UI action, the frontier ending,
card travel durable read, the inventory transaction, notification mark-read on a real backend, and the PWA update with a write in flight.
-103. **D16:** port all 36 unported v1 actions except death → wipe. Still to port: the tooltip system + switch, the notification pop-up switch
(toasts carry audio-counterpart duties; needs care), Compendium filters/groups/origin travel/reveal queue (touches Codex's I5-measured
Compendium: coordinate), craft ×5, pin recipe, salvage-all, friendly duels + CFB, Prime slot travel + Titan tracking, card fold/"More"/vista
zoom/postcard, reset expedition, the Guide browse tour, and the salvage dialog's "don't ask again".
-102. **Live Settings smoke on the dev URL:** `audits/DEV_PUBLISH/audio-settings-smoke.mjs` (skips Training through its real Skip,
then presses the switches, reloads and checks the device store). PASS on `7aaea99f`.
-101. **paintedArt accounting (C16):** `byKind.{thumb,portrait}` and `residentArchetypes.{masterLabelBytes, maskBytes, masks}`, where `bytes`
now includes the masks. Test ACCOUNTING in `painted-card-source.test.ts`.
-100. **Feed during Recovery fixed:** `preflightArc5FeedV1` and the Compendium Feed read model refused ANY assignment. The spec (`BREEDING_AND_SHARING.md`)
locks only breed, combat and dispatch. Now only a mission blocks a meal, and a meal keeps its Recovery assignment. Negative-controlled.
-99. **A3: Mono audio and Reduced intensity** (`runtime.ts` `setAccessibility`; `audio-accessibility-prefs.ts`; Settings `#setmono`/`#setsoft`):
- Mono is an explicit 1-channel `speakers` downmix at the master.
- Reduced intensity is 0.55× the master through a −24 dB 4:1 compressor in place of the brick wall.
- Both are stored on the device (guarded localStorage), never in the save.
- Tests: runtime ×6, owner ×2, prefs ×3, and main wiring with 4 mutation controls. The owner test caught a 7th master site that the first
  edit missed.
-98. **Proposals N1, N3, N4 and N5** (`audits/PROPOSALS_20260925/`) became decisions D12–D15, and they wait for Nick. Each carries a staged
plan with owners.
-97. **C15, the art + battle priority reset for Codex:** Nick's prompt, committed as `audits/MAILBOX/C15_ART_BATTLE_FOCUS.md`.
-96. **C4 answered: the build-generated master pin and its trust boundary (2026-09-25, `audits/C4_PIN_PROPOSAL_20260925/README.md`).** The pin table
is compiled into the bundle (never fetched), and the builder emits a pin only after full byte admission of the retained master passes. Codex's
overload checks the record, recipe, cutout hash, path, alpha, binding and atlas against it before decode. Masters stay in the package until
Codex's negative controls are green.
-95. **The dev URL is live on `652790a4` (2026-09-25; Nick: "D9 yes").** `port/v2/tools/deploy-dev.mjs` does the whole chain, stopping at the
first failure:
  1. a clean tree whose HEAD verifies G;
  2. `devpreview.mjs --approved-publication-candidate` for the dev origin (the package must say publishable, committed, and this exact commit);
  3. `--verify`, `devpreviewcheck`, and the controlled-worker real-duel `picker-smoke --sw-control --duel` (painted rigs, offline reuse,
     cold control, zero page errors);
  4. a fresh clone of `Dev-CelestialFrontier/dev-celestialfrontier.github.io`, its files replaced by the package, one signed commit, a push
     to `main`;
  5. a poll until the live `version.json` reports the exact commit.

The target repo and origin are hard-coded and checked. Site commit `56215bc`; evidence `audits/DEV_PUBLISH/652790a4586c/` (report.json PASS,
48 arena files served, 0 refused, 0 page errors; a mid-duel still). Traps: the packager re-checks the tree at the end, so write nothing
into the worktree while it runs. `--skip-duel-smoke` exists for a docs-only republish.
-94. **Weekly Charters, live on the expedition's own clock (2026-09-25; Nick: "moving the clock must not reset the charter… record the time… don't use V1").**
`weekly-charters.ts`: a cycle is 4 h of F4 ACTIVE PLAY. That clock is persisted in the save and committed with every action; it accrues from
`performance.now()` only while the game is visible and answerable, and the device clock never enters it. The save records the cycle the weekly
state belongs to (`chWeek`); a transaction in a later cycle rolls the board forward once, and only once the board exists (the five trades are
learned), so an explorer who never saw it gets no Charter writes. The slate is deterministic: three of the live pool (new-world landfall, mining,
discovering life, fabrication). A Charter counts only after it is accepted, pays Stardust plus one honoured Charter exactly once, and shares the
cap of three. The accept goes through the SAME audited transaction path as the starters, with an exact-once operation per cycle. Landing, mining,
fabrication and bioscan stage weekly progress in their own transactions; the single-outcome F4 derive input gained `activePlayMs` (additive).
Tests: a ±10-year device-clock swing changes nothing; forward-only rollover; legacy normalization; closed-board no-op; the cap; acceptance-only
counting (control: counting without acceptance fails); paid once; the real F4 commit with a per-cycle operation. Unit 5,076 pass; only I5 is red.
Codex: C10 (release bullet + pinned inventory), C11 (weekly conquest in Arc 6's settlement).
-93. **I5 on `fb82c32c` reviewed (2026-09-25, `audits/I5_REVIEW_20260925/README.md`).** Codex's run stopped correctly at the producer gate: all five
inputs changed with intended work. The gate is single-use by design (any app change moves index and service worker; `--calibrate` refuses under an
active budget). The review found a real memory regression the certificate would have caught, and fixed it (`ffa1f126`): painted stand-ins could keep
all 13 decoded archetypes (over 20 MiB) resident, and they are now an LRU of 2. Recommendation for Nick and Codex: one authorized recalibration
epoch, `compendium-memory-v2` on the integrated head with a growth guard against v1.
-92. **Playtest package on `fb82c32c` (2026-09-25):** `port/v2/apps/game/smoke/dev-preview-fb82c32cac67-20260925005333/`. `preview:package`, `verify` and `smoke`
PASS. The controlled-worker smoke on the package (`audits/PAINTED_STAND_INS_20260924/package-smoke-01/`) passes: Alien #12 as a Civet vs Alien #11 as a Tarantula,
two painted rigs, log paced 2.2 / 6.3 / 10.4 s, offline reload, zero errors. Play: `python3 -m http.server 8080` inside it, then
`http://127.0.0.1:8080/?battle2=1&vs=alien:12,alien:11&duel=1`; the Compendium shows painted stand-ins. Supersedes `dev-preview-3201cd86834e-20260924200110`.
-91. **…and on the battle stage (2026-09-24).** `matchRecord` falls back to the painted stand-in, so a fighter without its own painting fights as
its stand-in's painted rig, morphed by its own genes. The picker takes `alien:<seed>`. Edge real duels with the worker in control: Alien #12
(4 legs) fights as a Civet against Alien #11 (8 legs) as a Tarantula, and Alien #5 (fish) as a Salmon on the lake against the Octopus;
painted rigs, paced log, zero errors. Unit 5,067 pass; only I5 is red.
-90. **The painted art direction on every card (Nick 2026-09-24: "that art style should carry throughout the game";
`audits/PAINTED_STAND_INS_20260924/README.md`).** `painted-stand-in.ts`: every creature whose anatomy a painting draws gets that painting on
its card, morphed by its own genes. That is the 17 painted species; about 560 Earth species via their body plan's archetype; and generated
creatures via the SAME body family the procedural painter draws (drift-tested against hdart's own source; the leg-count law is tested).
43% of generated creatures are now painted. The uncovered families (jelly, four-winged, sturgeon, flat fish, 0/2/3-leg land bodies,
lobster, mantis, squid, shark, sessile) are the painting list for the game's own creatures. Also fixed: a grown tail was clipped at the
card edge (`padForProportionV1`). Unit 5,065 pass; only I5 is red.
-89. **Codex's three items merged (staged merge of `4b56ef82`).** The Centipede crawl is identical to `f7339401`, so it merged clean. 53 species are routed to
existing templates (the Fiddler Crab now to brachyuran, so it shares the crab's pinch; `creature-rig-r3` was updated to match, and Crayfish,
Lobster and Hermit Crab still refuse). The five `fb1922a0` reds are green. Edge on the merged tree (`picker-smoke-11-merged`, worker controlling
the page, real duels): Chimpanzee vs Centipede and Fruit Bat vs Crab, painted rigs, paced log, cached reload, zero page errors.
-88. **Phone-tier CPU study (`3e34873a`, `audits/BATTLE2_LIBRARY_20260924/README.md`).** At 4× CPU (Chrome throttle), all seven library pairs hold 60 fps
with zero refusals; stage CPU p95 is 3.5–6.5 ms, except Chimpanzee vs Centipede at 10.7 ms. The Centipede's skin is the phone-tier budget item
(Codex). A device probe remains the gate.
-87. **Picker status follows the study (`87f374cd`).** It reads "finished" or the failure reason instead of "playing" forever.
-86. **Every painted creature has a voice (`c2409c93`).** Placeholder synthesized sets for all 13 body plans (serpent hiss, insect clicks, fish bubbles,
bird chirps, crab click-bubble…). The quadruped set is byte-identical; 'brachyuran' is appended last, so no existing seed moves. Edge: Python vs
Crab real duel, zero page errors. Recorded C3 masters still replace these.
-85. **Playtest package on `3201cd86`: the first whose worker installs (2026-09-24).** `port/v2/apps/game/smoke/dev-preview-3201cd86834e-20260924200110/`:
`preview:package`, `preview:verify` and `preview:smoke` PASS, and all 305 worker pins match. `picker-smoke-09-package --sw-control --duel` on the package itself:
the worker controls the page; a real duel between Salmon and Octopus on the lake has its log paced by the stage (2.0 / 5.7 / 9.5 s); two painted rigs in each
run; the arena reload uses 0 server requests; cold-pair control; zero page errors. **Play:** serve the folder on loopback (`python3 -m http.server 8080`
inside it) and open `http://127.0.0.1:8080/?battle2=1&vs=Civet,Python&duel=1`. Supersedes `dev-preview-23e5f4ce5ec9-20260924143808`.
-84. **Codex's item 5 applied (2026-09-24).** Codex's prepared patch was applied verbatim, and the Centipede's KNOWN pin removed in the same commit: its crawl no longer
bobs the trunk, and the scale sweep demands zero refusals for all 17 at every scale. Control: the old crawl line reproduces the 0.85× fold. Codex commits the
same line in `openai/mac`, so the identical change merges clean.
-83. **Preview packages could never install their service worker; fixed (2026-09-24).** `tools/devpreview.mjs` stamped the four HTML files
AFTER `vite build`, but the PWA plugin had already pinned their SHA-256, so the worker's install always failed (4 of 305 pins). The arena
only "worked" in a package because no worker ever controlled the page. The stamp now runs INSIDE the build
(`apps/game/dev-preview-html-plugin.ts`, the last `transformIndexHtml` step, only under `CF_DEV_PREVIEW_HTML`). The HTML is byte-identical to the
old rewrite on all 4 pages, and all 309 pins match. The Edge duel smoke with the worker controlling the page passes on the stamped build
(`picker-smoke-08-stamped`).
-82. **A non-quadruped fighter FROZE THE WHOLE GAME in the flagged study; fixed (`86c9e3ed`).** The study's creature-voice hook has a source set
only for the quadruped, so `deriveCue` threw inside `BattleStage.tick` for any other body plan whenever an audio port was supplied (the game
supplies one). A throw inside a ticker callback stops Pixi's SHARED ticker, so the page stopped animating. Now a body plan without a
source set gets no voice (labelled), and the study's tick is guarded (a throw fails the study, never the ticker). Both have negative
controls. Found by the first smoke that watched a bout past 2.5 s and captured page errors.
-81. **The picker plays a REAL duel with the Chronicle under the stage (`f6ee445f`, `&duel=1` or the checkbox).** `matchupDuel` builds full genomes carrying
each painting's visual genes, then runs the combat domain's `runDuel`, `planCombatSettlementV1`, the cue plan and the Combat Chronicle, in `main.ts`'s
order (pacer, start, stage). Every archetype fights a planned duel as champion and as defender and keeps its visual key. Edge with the worker in control:
Civet vs Python's rows land at 2.4 / 6.1 / 10.0 s (its three hits), and the log completes as the stage finishes. This is the pacing proof
item -80 was missing.
-80. **The stage paces the Chronicle log (Nick 2026-09-24, decision 4).** `CombatChronicleController.setPacer(pacer)` (set before `start`):
each step waits for `pacer.waitFor(transcriptIndex)`, never longer than `COMBAT_CHRONICLE_PACER_MAX_WAIT_MS` (12 s). Skip, hide, close and reduced motion are
unchanged; without a pacer the 420/240 cadence is byte-identical. `createCombatChroniclePacerGateV1()` is the gate. `main.ts` sets it only under
`?battle2=1` with motion on; the study releases each staged turn's row at its IMPACT, and everything on finish, failure or dispose. Tests: Chronicle
(rows only on release and in order, every cue once; the max wait; Skip then a late release changes nothing; `setPacer(null)` restores the cadence;
a controller that ignores the pacer fails 2) and wiring (release at impact before the turn ends, releaseAll on finish, dispose and failure). No
real-browser battle run yet.
-79. **The guardian stands in the foreground (Nick 2026-09-24, decision 1).** `GUARDIAN_STANDS.groundY` = 0.95. A ground fighter stands on its
composed stand line in `placeCombatants`. The Bear rests at 0.673 of the frame (Edge film `bear-shipped-default`, 0/0 refusals, CPU 2.6 ms); the test
checks the top and bottom stay in frame through an attack and a victory, and the ground-line control fails 4 of its assertions.
-78. **The arena fits the pack: bindings gzip-compressed (`92fbe610`).** The builder writes `binding.json.gz`, and the asset source gunzips `.gz`
(sniffing the bytes). The arena drops from 77.6 to 48.1 MiB; with the ~47 MiB shell that is ~95 of 128 MiB. Test: every gunzipped binding equals its fit's
binding byte for byte.
-77. **The painted arena plays in a built game under the service worker (`5229e4f1` merge + `92fbe610`).** `battle2-assets.json` pins every file under
`public/battle2` for Codex's first-use lane (test: exact inventory, bytes and digests, with a one-byte control). Edge `picker-smoke-06-sw --sw-control`:
the page is controlled; Tree Frog vs Salmon and Civet vs Centipede stage as two painted rigs; 46 files are fetched on first use; a reload with every
arena file refused stages both painted rigs with 0 server requests; control: an unstaged pair gets 6 refusals and falls back to portrait rigs.
### Codex (openai lane) — next run (standing authority) — I5 is the last red on PR #43
**2026-09-24 (Claude):** the live prompt is `audits/MOTION_ANATOMY_20260923/CODEX_PROMPT.md`. It keeps the motion-anatomy program and defects 1–3, and adds four items: (4) a lane in the service worker for `/battle2/` so the painted arena stages in a built game (item -70); (5) the Centipede skin fold at 0.85×, pinned as KNOWN in `library-arena.test.ts`, where the pin goes red when you fix it; (6) stance-reach and your override gate, unchanged; (7) the coverage painting plan, for when Nick picks, plus the 53 profiles with `candidateTemplates: []` that you may wire now. I5 stays first for PR #43.
Your Glass fix `6910f2bf` is merged (`46b00267`) with one reconciliation you should keep in mind: its blanket `@media(min-width:901px),(orientation:landscape){body:is(.card-open,.panel-open) :is(#trail,#objchip){display:none}}` broke K21 (`ui-shell-cascade`: `#objchip`, the only Charters opener, must stay visible at 1280×800 with a card open) and reverted K19's anchor ownership; this lane kept K19/K21 and your portrait-yield CLASSES, dropped the media rule (phone portrait never matched it, so your Glass result stands — re-verified here: small-phone PASS ×2, large-phone PASS). Your Civet masks are merged and shipped in the card assets.
**The one item: I5 — the Compendium memory budget's measured re-seal.** PR #43's hosted battery (run `35669457751`) reds at `v2 base-profile static gates` on `tests/current-producer-authorities.test.ts` → "binds every live memory budget required by the active check profile": `authorityMismatchPaths(compendiumBudget.producerAuthority, current.compendium.producer)` is non-empty (index/owner/worker/painter/service-worker sha256 + the composite). `budgets/compendium-memory-v1.json` still carries the 9/02 producer `357ad8db…`, and `tests/compendium-budget.test.ts` PINS that value ("fails the current producer closed without rebinding historical samples") — so the two only agree after a measured re-seal that updates the budget AND its historical samples together. A hand re-bind was tried here and correctly refused by those pins (reverted). `compendiummem.mjs --calibrate` refuses ("candidate calibration is closed because the measured Compendium budget is active") and the standalone `npm run compendiummem` refuses ("built index/owner/worker/painter does not match the Compendium calibration authority") — the instrument is yours; produce the fresh measured certificate on clean committed source with exact Edge, re-seal the budget and its pinned samples, and report the run id. Until then every hosted attempt reds at that step. Signed commit + packet; no fetch/sync/push/PR/merge.
(Done: … crab masks `d8a1a8f9`, borrowed atlas `3f0607be`, Civet masks `f25098fa`, Glass survey yield `6910f2bf`.)

### Nick — TWO looks from the second archetype's sheets (2026-09-23, item -61, `audits/MORPH_20260923/`)
1. **One page, one choice — the base/accent split** (this is Nick's own open question (2) of 9/22, now measured): `civet-accent-option-sheet-01.png`. Row 0 = as shipped (accent = head + jaw + neck + ears + tail, **38.1 %** of the Civet's labelled pixels, straight seam across the shoulder); row 1 = the **head group on the base coat**, ears and tail still accent. Row 1 reads as one animal on all four widest-contrast individuals. Choosing row 1 is a byte-identical no-op on the five crab archetypes (control in the JSON). Say "row 1" (or "keep as shipped") and it is one change; nothing else waits on it.
2. **The lumin gene is inert on both painted archetypes** — both were painted `lumin: true`, so the gene can neither add glow nor remove it, and the 9/22 sheet's "lumin (emissive)" row was byte-identical to the row above it (retained as the failing control; the system is correct, the sheet row was not). Accept it (the painting wins, as with colour) or have the kit paint non-lumin masters so the gene can add the lift.
Also worth one glance: `civet-palette-sheet-01.png` — the quadruped's 12 palette morphs with the painted fur, spots and ringed tail intact.

### Nick — DECIDED 2026-09-22 (late), "proceed with your recommendations": markings: CRAB · IK: GO · guardian fill: -02
(1) Codex paints the first marking-mask set for the crab archetype (the queued block in the Codex section is released); (2) Codex builds the analytic rigid-support IK branch for endpoint-only supports (BEAR_DIAGNOSIS.md's proposal; limits, compression, terminal rule and the 0.25 px gate unchanged; gallop stays separate); (3) `GUARDIAN_FRAME_FILL` 0.96 on the tallest pose and the guardian stands stand as built (film -02).

### Nick — DECIDED 2026-09-22 (late): the Compendium card shows the PAINTED INDIVIDUAL everywhere, phone included (option 3)
Nick: "I want option 3." The creature the player bred is one painted individual across the card and the arena on every device. This amends D1 for the CARD only: phones load a card-size painted master (a sealed ≤512² downscale of the archetype, derived offline), not a live rig; live painted rigs on phones stay out until the phone-tier item (N5/S5) is decided. BUILT the same night (item -48): card masters, the Pixi-free rasteriser, the species-art loader interposition (painter fallback), tests, sheet. Open: the same individual in the battle ARENA on phones stays behind D1/N5 (the card is done on every device).

### Nick — one look + two small decisions (2026-09-22): the morph system
Look: `audits/MORPH_20260922/crimson-vs-turquoise-01/turn0-hit-approach-50.png` — two morphed individuals of ONE painted crab fighting on the real stage; and `audits/MORPH_20260922/crab-palette-sheet-01.png` — the crab archetype (top-left) and 12 palette morphs from 12 seeds; the painted finish is preserved (only hue/chroma move), low-chroma colours desaturate. Decisions from `MORPH_SYSTEM_DESIGN.md` §5, neither blocks steps 3–4: (1) marking masks painted first for the crab or the Civet? (2) `color` recolours the base coat (body + legs) with `accent` on head/claws/tail/ears — keep this default or declare base/accent per archetype on the painting side?

### Nick — one decision from Codex's packet (2026-09-22): analytic rigid-support IK
Codex's `BEAR_DIAGNOSIS.md`: the bear's observed-support refusals are the hind-far ankle's endpoint-offset fixed point oscillating (0.305 px), not skin-weight conflict. Proposed: an analytic rigid-support IK branch for endpoint-only supports, keeping source offsets, lengths, terminal rule, limits, compression and the 0.25 px gate unchanged; mixed-weight supports as-is; gallop's compression stays separate. Say "IK: go" to authorize Codex's build (or "hold"). Nothing else waits on it — the stage plays the bear on rest supports today.

### Nick — one look to choose (2026-09-22): guardian fill
One page: `audits/VISION_D2_GUARDIAN_20260921/G7_SHEET/brown-bear-review-sheet.png` (bottom row: -01 / -02 / bear as target). Sources: `audits/BATTLE2_D2_GUARDIAN_FILM_20260922/`: `bear-vs-crab-01/turn0-hit-approach-50.png` (bear 0.9 of the frame at rest; rearing head leaves the frame; paws overlap the crab before the lunge) vs `bear-vs-crab-02/turn0-hit-approach-50.png` (the fill sizes the tallest pose → 0.70 at rest, always inside, guardian stands 0.30/0.82). -02 is what the code does now; say "-01", "-02" or a number in between and it is one constant (`GUARDIAN_FRAME_FILL`) — nothing else waits on it.

### Nick — A2 taken (2026-09-22) and built (README slice 36); the table below is the measurement behind it
Under decision A the approach beat's time is set by distance. Measured on the six rigged subjects at arena scale
(run-up 0.18 × frame = 184 px; per-cycle travel = 2 × the rig's measured stance reach):

| subject | gait | body on arena | run-up | per cycle | cycles | approach time |
|---|---|---|---|---|---|---|
| crab | 420 ms | 119 px | 1.5 bodies | 0.40 | 4 | **1.7 s** |
| coconut | 420 ms | 114 px | 1.6 | 0.40 | 5 | **2.1 s** |
| freshwater | 420 ms | 111 px | 1.7 | 0.20 | 9 | **3.8 s** |
| mud | 420 ms | 132 px | 1.4 | 0.14 | 11 | **4.6 s** |
| vent | 420 ms | 100 px | 1.8 | 0.14 | 14 | **5.9 s** |
| Civet | 869 ms | 85 px | 2.2 | 0.40 | 6 | **5.2 s** |

Today's approach beat is 420 ms. The reach that sets these numbers is the RIG's (far legs painted foreshortened
or folded), not the animal's: a real crab scuttles about a body length per cycle. Options:
(A1) accept 2–6 s approaches — faithful, slow, and the slowest rigs are the worst-drawn far legs;
(A2, recommended) **walk whole cycles up to a cap (2 cycles ≈ 0.84 s, feet planted, no slide) and let the attack
clip's own lunge cover the remaining distance** (a lunge is a committed airborne move, choreographed contact, not
gait) — the arena distance is preserved, no foot slides, approach ≤ 0.9 s;
(A3) raise the rigs' reach first (Codex's body-planted folded legs may lift freshwater/mud/vent toward 0.2; crab
and coconut are already at the compression bound, so A3 alone cannot reach one body length per cycle).
Until decided: the stage keeps its 420 ms eased run-up without `stageDisplacement` (feet ride with the body, as in
the films).

### Claude — next run (standing authority: Nick says "go") — MORPH SYSTEM is the critical path (Nick, 2026-09-22)
Steps 1–4, the card and M3/M4 (items -45/-50) landed. Measured/recorded before the next step: **(4b) Compendium parity** = rendering the painted individual (a rest-pose raster of the paint-skin rig) onto the card, which today draws the painter tier through `SpeciesArtLoader` — desktop only per D1 and a look decision for Nick, not a bug; **texture cache** across battles is blocked by ownership: `loadCreatureRigV1`'s dispose destroys its atlas texture, so a shared cached texture would die with the first rig (a Codex loader change: borrowed vs owned atlas) — until then each battle re-decodes + remaps once (46 ms on the Civet's 2039² atlas). M3/M4 are built on the crab's masks (item -50). Next, in order: (5b) emissive without marking — done (-52); (6) texture cache — done (-51); **(7)** marking masks for the Civet (Codex paints on Nick's word) and the second archetype's sheet; then once Codex has painted the first marking-mask set. Then Codex's next report (bear IK if Nick says go), mud/vent re-finish, and the compiler hold as before.

### Claude — previous block (kept for the record)
Done this batch: bear merged, static RED reviewed on the stage, G6 built + tested + filmed (items -39/-40; films -01 and -02 await Nick's eye — one constant each). Bear as target filmed and the guardian is in the E1 outcome suite (item -41). G7 sheet composed (item -42) — D2 complete on the automatable side. Next, in order: (1) on Codex's report: re-merge, re-film mud/vent once their reach lifts, re-check the A2 outcome test; (3) the compiler: the two merged near-claw fingers (coconut/freshwater) and crab `leg3Far` remain the only crab defects; every matcher lever and the fork-aware ridge are measured and rejected (README slices 25–32) — the defects are in the paintings' terminals (P2 resolution / painting-side), so the compiler holds at IC-4 strict 5/7 until a painting-side decision; the roster batch runs the moment IC-4 passes on the crabs (one sheet for Nick).

### Nick — decision A taken (2026-09-21, latest): the stage runs up in body lengths with a stride cadence
Codex's stage/solver work: the run-up distance becomes N stride cycles of the attacker's gait (each ≤ 0.2 body lengths of stage travel per stance), the stage passes `stageDisplacement` per tick, feet plant exactly; Claude re-films and re-pins when it lands.

(Superseded question, kept for the record.) The solver plants exactly within 0.2 body lengths of stage travel per stance and refuses beyond; the battle stage's run-up is 0.18 × frame (≈ 9 body lengths for a crab at arena scale). Choose: (a) the stage runs up in body lengths with a stride cadence (several gait cycles per run-up — the physically right one; Codex's stage/solver work), or (b) the solver clamps to reach instead of refusing (feet slide a little; cheapest). Until then the stage does not pass the displacement and feet ride with the body as in tonight's films.

### Nick — decisions taken 2026-09-21 (late)
1. **Re-seal**: the v2 `training-checkpoint` fixture and test now seal the TypeSafe html (`a65d5905…`, from `5d0844c4…`; reason recorded in the fixture); the hdart lift was re-run from the tracked source and `speciesportable`'s byte-seal re-blessed to the new `hdart.verbatim.js`. `validate.js` fingerprint identical throughout. port/v2 suite: 4,770 pass, 1 expected fail; the one red file (`current-producer-authorities`) is the direct-`vitest` path — it expects the prepared receipt `CF_UNIT_AUTHORITY_BUILD` that `npm test` (`tools/run-unit-tests.mjs`) builds first; not a code red. The anatomy runners now take ad-hoc subjects via `ANATOMY_SUBJECTS=id:template:master[:record][:presence]` so the Brown Bear is one command (G3).
2. **D2**: Brown Bear; a guardian CPU tier at 5 ms desktop-only; §6 landmark bound 60 px at 1536; Codex's IC-3 writers released for this one guardian.
3. **Declarations**: the coconut's `leg3Far` is painted — declare it visible (Codex applies to the fit's presence file); the crab's `leg3Far` stays (a finger-vs-leg call no declaration describes).
4. **Codex's next run**: the two solver findings (stance-target double count under `travel:'stage'`; observed-support joint drift), then G1–G2 of the Brown Bear. Claude: the fork-aware ridge (the one structural lever left for IC-4).
**Decision item withdrawn (2026-09-21, slice 21):** the folded legs DO have alpha-only candidates (freshwater: an endpoint 1 px from the record misclassified as a claw finger by ridge thickness; crab: a loop at 68 px); an interior-edge stage was built as an option and measured (README slice 21) — it cleans the ridge but does not change the naming economics that actually lose the slot. Nothing to decide until the stop. R9 addendum's two answers (finisher model = the accepted one; arena-scale crab on the sheet)
are already in the pre-answered set (§7).

### Still open, unchanged
N5/S5 phone tier (D1); N7–N10; I5 stale Compendium producer certificate (fresh measured certificate only); 53 of 58 bodies
unbound; nothing visually qualified; Q1 crab gape candidate only.

### Where to read
`audits/INTAKE_COMPILER_20260921/sheet-01/` — the compiler's review sheet per subject (look here first); `port/v2/tools/anatomy-verify/README.md` slices 18–21 — every rule and number.
`audits/ANATOMY_REVIEW_20260917/` (this lane): `CLAUDE_R1BR2B_REVIEW.md` (§1–§8), `R9_ADDENDUM_FINISHED_TEXTURES.md`,
`E1_BATTLE2_INTEGRATION_DESIGN.md` (§5 status), `MASTER_PROGRAM_20260917.md`, `r1b-r2b-look/`. Code: `port/v2/apps/game/src/battle2/`
(`README.md` E1 section, `parts-rig.ts`, `habitat-arena.ts`, `e1-outcomes.test.ts`, `parts-rig.test.ts`). Codex lane:
`audits/ANATOMY_COMPLETION_20260917/` (its evidence folders as the run produces them).

## Live handoff — 2026-09-25, C15 art + battle ONLY

Codex/macOS owns openai/mac at /Users/nick/Projects/celestial-frontier-openai-mac. Claude lane is absolute read-only. Nick's C15 priority supersedes the earlier pause and economy queue: keep painting/rigging/repairing in large batches. C8 I5 waits until after art; C16 diagnostics exist but no new epoch is authorized by this work. Weekly/economy/C19/C20 parked.

First ten-item sheet: audits/ART_BATTLE_FOCUS_20260925/batch01-review-sheet.png. This is ten reviewed paintings, not ten admitted creatures. Bass fit-05 and Tang fit-06 pass all13 static rows/presentation/exact rest and zero-refusal native4×CPU films; whole-stage p95 respectively4.80ms and7.80ms. Claude wiring/picker pending; no integrated coverage gain. Eight repair items: Jellyfish tentacle count/separation; Dragonfly sixth visible leg; Sturgeon outward facing; Wall Lizard/Cougar/Impala/Marmot/Cattle contact/fold failures. Cattle also loses encoded frames (14.60ms stage p95,2/7 rig refusals). Each full packet retains all prompts, masters, authoring, six masks when intake passed, failed fits, films and source hashes.

Jellyfish follow-up: jellyfish-repair-03/fit-06 +native-phone4x-04 now passes13/13 static/presentation/exactrest and declared sting film with0/0 refusals,9.20ms whole-stage p95 at4×CPU. Eight marginal+four oral appendages, six masks. Shared radial-side projection/translucent-chain amplitude repair passes all six S2 controls byte-identically; develop5,081pass, sole I5 red. Claude must wire the hash-bound sting declaration and smoke picker before any coverage gain. Original ten-item sheet remains the historical review.

Dragonfly follow-up: dragonfly-repair-03/fit-03 +native-phone4x-02 has six visible legs/four wings, explicit adult-flight habitat and13/13 static/presentation/exactrest PASS. Air/air mandible film0/0refusals,10.40ms whole-stage p95 at4×CPU; damage9 clips the upper viewport and is assigned to Claude before live publication. Six masks conserved. Adult-flight selector repair preserves undeclared ground defaults and rejects missing/folded wing controls; S2 identical, develop5,082pass/soleI5red.

Sturgeon follow-up: sturgeon-facing-04/fit-02 +native-phone4x-01 fixes inward facing,13/13 static/presentation/exactrest PASS,0/0 rig refusals,3.60ms stage p95 at4×CPU and six freshly conserved own masks. Ready/return snouts overlap; Claude has the stage spacing/reach fix request and must resolve it before publication. Original outward-facing source stays retained.

C12 repair: audits/ART_BATTLE_FOCUS_20260925/centipede-kernel-01 has byte-exact active-incident and ARAP SIMD execution optimizations, corrected module-aware CPU profiling, unchanged S2 and develop5,082pass/soleI5red. Ten final pairings cover all17 shipped archetypes with0/0refusals,3.50–10.60ms whole-stage p95 at4×CPU; Centipede unprofiled10.00ms,598live/602encoded,framep9516.80ms. No continuous60fps or iPhone acceptance claim. Tree Frog detached orange forefoot patches and Eagle top-bar overlap need visual review. Five quad failures and the native REST/static observed contact distinction are handed to Claude in QUADRUPED_HANDOFF.md.

Cougar follow-up: cougar-repair-03/fit-03 +static-root-weld-07 passes19/19 action rows,1,675 presentation samples and exact rest. Root ownership fixed trot folds; a source-geometric constant faint torso gain fixes all five new quads' focused faint-contact tests while preserving Civet/S2 byte-for-byte. A named root/spine source seam closes the torso ownership hole; all-boundary fit02 is rejected. Full develop5,089pass/soleI5red. Native01 still has0/11 walk refusals and overlapping heads; stage composite/reach mismatch is in TO_CLAUDE. Full-script capture repair now records every turn/phase: full-battle-capture-01 Civet0/0 at14.73s; Cougar0/11 at15.53s, with no added faint refusal. Older10s studies keep their original scope. No new quadruped picker/coverage admission.

C13 contract review DONE in audits/ART_BATTLE_FOCUS_20260925/master-pin-review-01: accepted with private frozen-pin identity validation, unambiguous hashes/paths and pre-decode morph-cache checks. Claude owns the generator/wiring next; Codex adds the narrow loader/negative controls once the generated authority lands. Masters stay shipped; no measured pack saving yet.

Next Codex: continue Wall Lizard/Cougar/Impala/Marmot/Cattle motion and the next ten while Claude handles stage contacts and the pin generator; do not relabel retained failures as completion. Preserve accepted bindings, S2, contracts, gates and limits. New candidate boundary ownership repairs have fixed folds; existing preservePaintBoundaries:true closed flat-master fin seams without changing any source pixel or UV. A numeric native PASS alone missed visible Bass holes, so inspect impact/return stills.

Wolf item11 now has31 parts, final fit03 and mask-set02,19/19 static +1,688 presentation/exactrest PASS, full15.5327s native0/0refusals with5.0ms stage p95 at4×. Packet audits/ART_BATTLE_FOCUS_20260925/11-wolf. Ready/return has a visible snout gap; full-stage travel remains pending (run-up only±.0447076613). Claude must wire/picker/coverage after stage check. No coverage gain claimed.

Gull item12 packet audits/ART_BATTLE_FOCUS_20260925/12-gull:17parts and six masks; named shoulder seams close native holes and fix faint, finalfit03static13/14/exactrestPASS. Dodge compression remains blocked; tiny2.6% excursion substitute explicitly rejected. Full native02 has0/0refusals,4.0ms stage p95 at4×,765live/769encoded,12.7328s, but cannot supersede observed-support static red. Keep Gull out of picker; full-flight art is not supplied by folded wings.

River Otter item13 packet audits/ART_BATTLE_FOCUS_20260925/13-river-otter:31parts, fit02, six own masks;19/19 static +1,681 presentation/exactrest PASS. Full native01 has0/0refusals,4.30ms stage p95 at4×,932live/936encoded over15.5328s. Rest/return heads overlap; Claude spacing/full-travel and picker gate remain before admission.

Brown Bear item14 packet audits/ART_BATTLE_FOCUS_20260925/14-brown-bear:31parts, fit02;18/19static, tame compression240ms. Full native01 FAIL0/10right-walk refusals,7.5ms stage p95 at4×,932live/936encoded. Five usable masks; eye patch misplaced and correction tool-refused (request b99c0e1f-0ff3-446d-a779-9be0a094cd3a), all retained. Keep out of picker.

Goose item15 packet audits/ART_BATTLE_FOCUS_20260925/15-goose:plain corrected master,17parts, fit02, six masks. Shin ownership repair improves7/14 to11/14static; hit/dodge/tame still red. Native01 FAIL0/38 final counters (36logged live faint events),4.30ms stage p95 at4×,776live/780encoded. Shoulder gaps visible; keep out of picker.

Heron item16 packet audits/ART_BATTLE_FOCUS_20260925/16-heron:17parts/19joints, fit01, six masks;13/14static, dodge compression55.067ms only. Full native01 0/0,3.90ms stage p95 at4×,780live/784encoded over12.9828s. Keep out of picker until static dodge/support reconciliation and full-stage motion.

Sparrow item17 packet audits/ART_BATTLE_FOCUS_20260925/17-sparrow:fit01 static10/14; alert tail fold plus claw/hit/dodge compression. Full native01 0/0,6.5ms stage p95 at4×,753live/757encoded, but large wing-root gaps. Four-boundary fit02 and two-shoulder fit03 welds rejected with extra folds; retain all. Six masks conserve on fit01. Do not wire.

Ibex item18 packet audits/ART_BATTLE_FOCUS_20260925/18-ibex:fit02 static19/19 +1,675 presentation/exactrest PASS and six masks. Native01 FAIL26/14 approach-walk refusals,5.60ms stage p95 at4×,931live/935encoded; positive return spacing, no visible detached paint. Do not wire until stage composite/support repair.

Reef Shark item19 packet audits/ART_BATTLE_FOCUS_20260925/19-reef-shark:fit06 static13/13/exactrest PASS; fullnative02 0/0,3.40ms p954×,726live/730encoded. Use mask-set02. Return snouts overlap and faint tail breaches water band; Claude stage fixes before publication. Habitat/material/script refusals retained.

Pike item20 packet audits/ART_BATTLE_FOCUS_20260925/20-pike:fit02 static13/13/exactrest PASS, fullnative01 0/0,3.20ms p954×,726live/729encoded; six masks, connected within-water return/faint, positive gap. Fullstage/picker pending. Second ten sheet+index now at audits/ART_BATTLE_FOCUS_20260925/batch02-review-sheet.png and batch02-review-index.json; ten reviewed candidates, not ten admitted creatures.

Next repair shared motion and candidate skin, then continue ranked paintings; existing Python/Beetle masks, specialized uncovered templates, complete-stage motion, C12 Centipede orientation cost and C13 pin review remain in the art program. Done only with measured generated coverage≥80%, no misleading ranked top35 Earth, all motion/picker gates and every library pair at60fps4×CPU. No new completion claims yet.

C18 prerequisite repair is signed a7f154f8: full develop profile5,080pass, sole historicalI5 red; original lock and v1 samples unchanged. No whole-battery PASS, push or hosted eligibility. Asset batches have their own scoped static/native and root validate evidence; no unchanged full battery retries.

Signing: repository keychain git-ssh-sign-cf, proof already G; no1Password changes. Read Claude absolute mailbox at start/end, reply only local TO_CLAUDE. Shared-object-store hand-reconciled lane merges require green local battery; no remote push wait. PR/label/hosted/develop/main/release/deploy gates remain explicit. battle2 remains flagged pending iPhone and v2 certificate. Pre-existing .DS_Store untouched.

Paired next steps: Codex keeps repairing/painting and signs each item; Claude consumes candidate packets, wires Bass/Tang, smoke-tests the picker and republishes under existing authority. Nick reviews the ten-item art sheet and plays on iPhone; no other-app relay required.

Layered approach repair: audits/ART_BATTLE_FOCUS_20260925/approach-envelope-01 supplies a new helper and exact proposed Claude adapter patch. Composite idle+walk caused the old isolated six-phase estimate to over-admit. Proposed full native Ibex0/0 (old26/14), Cougar0/0 (old0/11), p954×5.5/6.6ms; Cougar spacing still wrong. Contact-only library11applicable+6not-applicable, no refusal; Centipede measurement load2698.432ms, never per frame. Full develop5092pass/soleI5red;90S2-source files identical. Claude integration/full-stage/picker pending; no coverage gain. Codex continues skin/static repairs.

Quadruped repair04: packet audits/ART_BATTLE_FOCUS_20260925/quadruped-repair-04 now has all five candidates19/19static/exactrest, contact-based conditional hit/tame torso authoring and a bounded input-keyed envelope cache. Five proposed-stage full films0/0; Lizard05 maximum CPU9.7ms at4× with no over-budget frame, Cattle05 p9515ms but34 frames over16.667ms (NOT60fps). Impala flank crease and several overlapping heads remain. Final develop5100pass/soleI5red, S2six/13286byte-identical. Claude must reconcile layered-reach + faint-idle-settle patches on actual integrated source before picker/coverage; Codex continues art/skin/motion repairs. No new admission, certificate, push or deployment.

Impala interior-root repair05: use interior-root-repair-05/impala-fit-02,19/19static/exactrest, six own masks; proposed-stage fullnative01 zero refusals and noCPUframe over16.667ms (p955.9/max14.3ms4×). The visible flank rectangle is removed. Equivalent Cattle change rejected17/19+presentationfolds; keep quadruped-repair04/cattle-fit-02 and its open performance defect. Runtime/S2 unchanged, no repeatedbattery. Claude integration/fullstage/picker pending; Codex continues C15.

Forward orientation optimization02: kernel skips only unchanged previously satisfied constraints; Cattle3614/Centipede2248calls exact againstprior,15controls+twoinvalidmutants, S2six/13286identical. Full develop5100pass/soleI5red. Forward memory +64KiB Cattle/+128KiB Centipede perrig. Full4× films0/0: Cattlep9514ms but33overbudgetframes; Centipede8.6ms but5approachspikes. Neithercontinuous60fps. Packet orientation-forward-02 retainsoriginal/currentartifacts,parity,fullfilms. Codex continues C15; Claude integratedstage/pickerpending.

Bird motion02: Gull/Goose/Heron14/14static/presentation/exactrest and fullobserved-supportnative0/0; p954×4.0/4.2/3.7ms, zeroCPUframes>16.667ms. Goosefit04two proximal shoulder/neck joins; its originalfaint is retained. REST supports causedold0/60; observedpainted supportsfixit withoutguardchanges. Rejectedfaintcurve/travelpatches retained and NOT forintegration. Finalruntime8tests/fullprofile5108pass/soleI5red/S2identical. Sparrow12/14 (alertfold/clawcompression) andwingholes remain. Claude mustwire observed supports +existingstageproposals andrunpicker; Codex continues C15.

Sparrow repair03: fit02 now14/14static+1039presentation/exactrest after torso/tail ownership and conditional level claw. Six own masks conserved;9tests/S2six13286identical/TS/rootPASS. Full proposed observed-support native01 zero refusals and closed shoulder holes, but15CPUframes>16.667ms (p957.2/max29.7ms4×) in final faint settle. Full develop5108pass/TWOreds: parkedI5 + unchanged acquisition source-scan5000ms timeout (6784ms), no retry/allowance change. Claude integratedpicker/fullstage and Sparrow/Cattle/Centipede performance remain open; Codex continues ranked C15 art.

Racer item21 (Earth rank14): packet21-racer/fit02 passes12/12static+945presentation/exactrest, six own masks. Proposed observed native01 0/0, p952.6/max9.9ms4×, zeroCPUoverbudget/longintervals; other-lane work15/21hostsamples disclosed. Heads overlap atreturn; Claude stage/picker/coveragepending. Three masterattempts, two framingrejects retained; exact maskpromptLFserialization reconciled without changing old receipts. Runtimeunchanged839cac0b; rootvalidatePASS, no unchangedbattery. NextGrouse/Sandpiper, thenranking; Capuchinnewtailedtemplate remainsdependency.


Grouse item22: audits/ART_BATTLE_FOCUS_20260925/22-grouse finalfit03/mask-set03 passes14/14+1033presentation/exactrest; nativeobserved02 closes nearwing opening,0/0refusals,p957.4/max28.3ms4×,oneCPUoverbudget finalsettle. OtherlaneVitest23/23samples. Positive headgap; integratedfullstage/picker/phonegatependingClaude. Runtime839cac0b unchanged, no repeatedfull/S2; priorI5+acquisitiontimeout remain. Codex next Sandpiper thenrankedtop35; Capuchinawaitstailed-primate. C8/economyparked, noGitHubwrite.


Sandpiper item23 finalfit02:14/14+1028presentation/exactrest; sixownmasks. Canonical tame neck-bow conditionalafter original/legspan refusal preservesexpression/override.10tests,S2six/13286identical,appTS/rootPASS; fullprofile5110pass/soleparkedI5red (earlieracquisitiontimeout didnotrecuronchangedsource). Proposednativeobserved01:0/0,p954.9/max10.6ms4×,zeroCPUoverbudget; otherlane0/22samples. Connectedpaint/positivebillgap. Claudeintegratedfullstage/picker/coveragepending. CodexnextDivingBeetle,Herring,WildHorseandremainingtop35; Capuchintemplateaskoutstanding. C8/economyparked.


Rank22 DivingBeetle prepaintblocked: explicit hidden flightwings unsupported (onlycrab hiddenlegs currently). Exactrefusal/sourcehashes in closed-beetle-intake-01; Clauderequest forclosedwing support preservingopenbeetles/flightgate/S2. Noabsentlie orpaintingattempt. CodexcontinuesHerring, returnswhencontractavailable. Sandpiper signed0e9fcf18G.


Herring item24 /Earthrank23 finalfit02+sixmasks:13/13+949presentation/exactrest; waternative0/0,p953/max8.6ms4×,zeroCPUoverbudget. Heads overlapreturn and fainttailcrosseswaterband—Claude stagefixbeforepublication. Runtimeunchanged0e9fcf18,no repeatedfull/S2; rootPASS. CodexnextWildHorse thenSalamander/Eel/Honeybee/Rat/Hare/Turtle/Dolphin/Whale/Bullfrog/Boar/Deer. ClosedBeetlecapabilityrefusal signedc132cf40G; nofalseadmission. C8/economyparked.

Herring also retains low-alpha fringe/specks outside visible silhouette; alpha-extents.json and README explicitly keep master cleanup open, noalphaerase/raisedthreshold. Do not count it as visually admitted.


Wild Horse item25 /Earthrank24 finalfit05:19/19static+1680presentation/exactrest, six own masks incl. zebra legbands. Material-wording refusal and native01 neck/body seam retained; fit05 explicit neck/spine join closesseam. Proposednative02 0/0,p955.8/max14.2ms4×,zeroCPUoverbudget,positive headgap. Runtimeunchanged0e9fcf18,no repeatedfull/S2;rootPASS. Claudeintegratedfullstage/picker/coveragepending. CodexnextSalamander/Eel andremainingranked; C8/economyparked.


Salamander item26/Earthrank25:27parts finalfit05,sixmasks,17/19static/exactrest. Gallop foreNearreach73.7ms/castcompression372.75ms; presentationforefootlimit7700ms, allretained. Nativeobserved01 0/0,p954.1/max9.8ms4×zeroCPUover, butheadsoverlapreturn. NO pickeradmission. Fourmasterattempts retained; finalopaquekeycleanbounds. Codexrepairs shortlegmotion thenEel/ranking; Claude stagespacing/integrationpending. Runtimeunchanged0e9fcf18/rootPASS/no repeatedfull/S2.


Salamander motion01 repairscanonical gallop/cast by conditionalwhole-torsogain underunchangedcontact. Samefit05 now19/19+1557presentation/exactrest. Sevennew+18existingtests/appTS/rootPASS; S2six/13286identical; fullprofile5117pass/soleparkedI5red. Freshproposednative0/0,p954.1/max11.8ms4×zeroCPUover; heads stilloverlapreturn,Claude stage/picker/coveragepending. CodexcontinuesEel/ranking; C8/economyparked; nohostedwrite.

Eel item27: audits/ART_BATTLE_FOCUS_20260925/27-eel, fit02 +mask-set03/markings.json,13parts,12/12static+1015presentation/exactrest, sixownmasks. Proposed waterfilm0/0,p952.3/max7ms4×,zeroCPUoverbudget,757live761encoded; returnheads overlap, integrated admission pendingClaude spacing/fulltravel/picker. Two rejectedmottled generations retained. Runtime6d195114 unchanged, no repeatedfull/S2. NextHoneybee/Rat/Hare and thirdten sheet; C8/economyparked.

Honeybee item28: audits/ART_BATTLE_FOCUS_20260925/28-honeybee fit02 +mask-set02,21owners,13/13static+953presentation/exactrest, six explicitly abdomen-only masks. Proposedflight0/0p955.8max37.1ms4×;25overbudgetapproach/return frames,13longintervals →phoneRED. Positiveheadgap/connectedpaint reviewed. Codex phase-transition performance repair pending; Claude no picker admission yet. NextRat/Hare for thirdten sheet. C8/economyparked.
