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

## 2026-09-17 · Claude read-only review of openai/mac (docs-only commit on anthropic/mac)

Nick requested a consolidated review of the Codex worktree at `0426ef4d` plus its staged, unsigned
September 17 batch (5 crab fits, 3 flora fits, 7 observations, C1–C5 continuation). Two passes are
committed verbatim in `audits/ANATOMY_REVIEW_20260917/CLAUDE_REVIEW_RESPONSE.md`; the copy-ready
plan-only prompt for Codex is `CODEX_PLANNING_PROMPT.md` beside it. Headline: input manifest verified
(1,271/1,275 + 4 declared pointer diffs); five systemic findings (S1 frame-refusal policy, S2 amplitude
not bone-length-relative, S3 no planted contact outside quadruped, S4 pinch unreachable by resolvers,
S5 phone budget) plus the Pass 1 register. No lane was edited or synced; no push; PR42 parked.
Nothing on anthropic/mac changed except this note and the two audit files.

Later the same day: Codex’s approved plan (`9769d299`) and R1/R2 producer (`6b11407d`) were reviewed
against the eight-subject native evidence (`r1-r2-native-01`, commit `57dfe112`). Review committed as
`audits/ANATOMY_REVIEW_20260917/CLAUDE_R1R2_REVIEW.md`: tears and floating legs are gone, but motion
is now unreadable because body-length-relative motion uses a 4 % root→carapace axis (N1); recommended
a bounded R1b/R2b (N1–N4 + one quadruped sentinel) before R3–R8; Q4 kit paragraph recommended for
approval. Still no push; PR42 parked.

## 2026-09-17 (later) · vision program approved; E1 design started

Nick restated the full vision and approved the master program's decisions D1–D4
(`audits/ANATOMY_REVIEW_20260917/MASTER_PROGRAM_20260917.md`): D1 phone tier = delivered finished
originals with painter-only fallback (no on-device inference); D2 first guardian = Earth-temperate apex
at 1536 on the same pipeline; D3 arenas by biome family, Earth temperate first; D4 E1 design now, code
after R3 reaches develop. Track B design is `E1_BATTLE2_INTEGRATION_DESIGN.md` (parts-rig adapter,
attack-driven turn plan, habitat arena selection, five outcome tests; Codex owes `ContactPhase.travel`
and the brachyuran attack row in R3). Codex is mid-R1b/R2b (N1 decision + N11/N12 given). No push.

## 2026-09-19 · Claude review of R1b/R2b re-capture; N3 withdrawn; R1c direction; R9 addendum

Read-only review of `openai/mac` evidence `d0437436` on producer `6a58e40e`, committed as
`audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md` with the contact sheets Claude looked at in
`r1b-r2b-look/`. Integrity verified (README ↔ JSON, producer diff scope, zero pin deltas). Visual: scuttle
is readable for the first time (V1); **faint recovers to rest by 75 %** (V2) and **pinch is static** (V3);
N8 fringes persist (V5). **N3 withdrawn and owned:** the vertex was already rigid; the gate reduces to
`2·|o|·sin(θ/2)` (rest offset × stance rotation) and the pin receipts' |o| (1.3–3.1 px) are consistent with
every pass/fail — a derivation, not a proof, so R1c (a) measures it with three negative controls. R1c (b)
discriminates a Civet adapter artifact from a family-solver gap (hypothesis: no root accommodation) without
clearance; R1c (c) is a variance floor + 2×2 {harness order × scale reference} attribution, plus the
persimmon fold ownership dump (the fold pre-exists on `6b11407d`; `normalPasses` unchanged). Gate stays
0.25 px; no repair chosen. `R9_ADDENDUM_FINISHED_TEXTURES.md` written in the plan's format (desktop only,
D1). No sync, no push, PR42 parked.

## 2026-09-19 (night) · openai/mac merged locally; E1 battle2 integration coded on the real fits

Nick relaxed D4 ("go"): E1 codes against Codex's signed producer by local merge. `openai/mac` `4cb5f7a3` merged into
`anthropic/mac` as `e86a66ab` (Codex's nine motion files win; lane docs kept; four merge repairs recorded in the commit —
Codex's absolute-path pose probe re-pinned, its stale blender span repointed, the battle2 keyer made a static import per the
Arc 4 law, my motion tests retargeted to Codex's contracts, synthetic fixtures given source habitats). Then E1.1–E1.4:
`battle2/parts-rig.ts` (Codex's paint-skin rig through its owner + contact solver, refusal policy, joint read-out),
`TurnAttack` on the turn plan with `impactAtMs` on the effect schedule, `battle2/habitat-arena.ts`, reduced-motion rule,
`RigPoseContext` hand-over, wiring of the six fits + per-turn `compileAnatomyAttack` + `status().arena/attacks/refusals`.
Outcome tests run on the REAL fits in vitest: Civet bite pays; no refusal in play (Civet both roles, five crabs as targets);
habitat refusal visible; reduced motion holds. Three `it.fails` pins flip when R3 lands (travel:'stage', crab attack, pinch).
Battery: typecheck ×3, 210 tool tests, evidence build, vitest 4,736 pass / 3 expected-fail / 1 red = I5 stale certificate.

## 2026-09-19 · TypeSafe second-opinion tooling landed (from the Windows build, via zip) and its first live battery

The Windows-side batch's own handoff, verbatim (it was written against the Sept-5 roadmap base; the tooling
arrived here as a zip and was installed after a full read; nothing else from that ROADMAP was taken):

> **What landed:** TypeSafe's Jev model (text-only typed Choice/Noul answers with probabilities) is wired in as
> **offline audit tooling only** — see `TYPESAFE_START_HERE.md` for the fit decision, the laws, and the
> copy-ready prompt. It is NOT the art judge (Jev cannot see PNGs) and never enters `main.js` or the v2
> runtime. `tools/_earthart-load.js` (loaders shared by `rig-audit.js` and `rig-secondopinion.js`),
> `tools/typesafe-client.js` (key from `TYPESAFE_API_KEY` only, `--dry-run`, gitignored cache),
> `npm run typesafe:rig` / `typesafe:reference` / `typesafe:judgetag`, `@typesafe-ai/sdk` 0.6.0 dev dependency,
> `tools/README.md` section. Verified there: `node --check`, `validate.js` PASS, all three tools under `--dry-run`.

**Battery (this lane, Nick's go):** `audits/TYPESAFE_BATTERY_20260919/README.md`. Spend 54 requests /
1.73 M input tokens (~$0.073). Rig: 8 disagreements → 3 confirmed regex misses fixed in `main.js` (Whale Shark,
Viperfish → fish; Nudibranch → gastropod) with sentinels (196), 5 model misses left alone. Reference: 272
disagreements → 14 posture corrections in `fauna.json`, each justified by the row's own text or its family
convention; eyes untouched (fish-`prominent` is a convention). `rig-audit`, `validate.js`, `referencecheck.mjs`
PASS. `artlock.mjs` is stale (1250/1250 since 2026-08-06, identical on the pre-change html) — Nick's re-bless
decision, not this batch. Judgetag skipped (no judge run on this Mac). §4 of the log answers "can it check
everything?" — yes for text/JSON (flora rows, biomes, procedural records, universe cards), no for art/numbers.

## SESSION HANDOFF — September 19, 2026 (night) · E1 CODED ON THE MERGED LANE; CODEX RUNNING THE SINGLE-RUN PROGRAM

Self-contained. Either lane can resume from this block alone. Earlier handoffs of the day are archived verbatim at the top of
`ROADMAP_ARCHIVE.md`.

### Lane state — 2026-09-21 re-merge (this commit merges `openai/mac` `db8858bb` into `anthropic/mac` locally)
Codex's R3-S → §8 chain (signed, 20 stages verified in its packet `audits/R3S_RESUME_20260921/`) is now in this lane. Resolution
rule as recorded: Codex's R9/finisher files canonical (`creature-originals.ts`+test, `finish-master.mjs`, `finish-conservation.mjs`+test,
`prepare-observed-crabs.mjs`, `kit-worker-engine.mjs`, `landfall-conditioning.ts` — the duplicated `compileCreatureFinishV1` resolved to
Codex's); `ROADMAP.md`/`ROADMAP_ARCHIVE.md` kept from this lane. Test state on the merged tree: `tsc` clean; battle2 33 pass + 1 expected
fail; the two E1 R3 pins FLIPPED green (crab pinch admitted; a crab attacks through the stage); the parts rig now forwards
`travel:'stage'` and takes an optional binding for observed supports (off by default). **Two solver findings for Codex, measured:**
(1) under `travel:'stage'` the family solver zeroes root dx but its stance targets still advance by stride×(completed+step), so feet
march in body space while the stage moves the body — the double count; arena-planting needs targets that recede by the stage
displacement (the third pin stays `it.fails` with this reason, 185 px spread); (2) with `observedContactSupports` on the crab, foot
JOINTS drift up to 5.3 px under hit loading (the surface, not the joint, is what that model pins; a support-position accessor is needed
to test the true invariant). Three sealed tests are red on the merged tree and none is merge-caused: `biome-vista` (identical bytes on
both lanes), `training-checkpoint` (this lane's TypeSafe batch `a3bd835d` changed the v1.8.9 html by 8 lines — Codex's html matches the
seal; Nick decides re-seal vs revert), `current-producer-authorities` (a local `dist/` build artifact). `node tools/validate.js` PASS
(fingerprint match). Anatomy-verify runners own their PNG helper now (`png.mjs`).

### Lane state (both lanes pushed to origin 2026-09-19 evening under Nick's explicit "push anthropic/mac and openai/mac")

| Lane | HEAD | Note |
|---|---|---|
| `openai/mac` (Codex) | `ddb51313` local (origin at `7dd884f0`): R2c-L step 1 ran (crabs zero exceedances, bit-identical) and stopped S2 at the 8 % compression bound on the Civet bite lunge (157 ms). Review §13 maps the whole conflict (every body-moving quadruped row breaks the all-feet-planted solve: lunge/rear-up/hop need 70–297 px of compression vs 28 px; faint needs ±92° elbow) and issues **R3-S** as ONE run without internal stops: report-all ledger → per-template per-action stance contract (quadruped hind-only for melee/cast/victory, none for dodge/kick, all otherwise; brachyuran all) → contactLimitsDeg from planted folds → after ledger → controls → rest of §8 | awaiting the §13 paste + Nick's authorization line |
| `anthropic/mac` (Claude) | this commit (slice 18, intake compiler; pushed to `origin/anthropic/mac` under Nick's standing lane-push authorization) on top of `13d4406a`: **R9 finished textures delivered** (tooling `8b901e6c`; evidence `audits/ANATOMY_COMPLETION_20260917/crab-finish-01/`, five crabs PASS on every gate, bindings byte-identical in `crab-fits-finished-01/`, offline rebind test 5 PASS; quality not accepted — see the README's findings for Nick: the accepted 0.35 × 1-step finish is subtle; strength/steps study needs Nick's word; coconut-crab at 1×; Civet needs its ownership map; native rebind rows at the R3 re-merge). E1.1–E1.5 coded and filmed; two TypeSafe batteries; tree clean apart from `.DS_Store` |

Pushed as plain branch pushes only (no workflow runs on a branch push per `GITHUB_ACTIONS_BUDGET.md`; `origin/openai/mac` = 140 commits, `origin/anthropic/mac` = 72 first-parent commits, pushed in fast-forward chunks along the first-parent chain — pushing a `rev-list --reverse` order without `--first-parent` rejects at the merge's side commits, which is what the first attempt hit). PR42 parked, no PR opened, no merge to develop, no release. Lanes still read each other by absolute path.

### The program in flight (Nick, 2026-09-19: "most work possible before a stop")

`audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md` §8: ONE Codex run — toolchain → R1c-b/c → R2c → R2d → R3 → R4 →
re-capture → R9 → R5–R8 → roster by family → PR42 split prepared → ONE stop with an accumulated review packet. S2 (a
shared-path red: Civet sentinel or any of the five crabs regressing after a solver change) is the only halt. Claude runs E1 in
parallel on local merges of Codex's signed producers.

### Codex's run stopped at S2 in R2c (its packet `audits/ANATOMY_SINGLE_RUN_20260919/`)
R2c closes Mud/Vent (five crabs ≤ 0.0094 px) and adds the root accommodation R1c-b proved missing, but the Civet
sentinel fails idle at 0.2608 px: its support is unpinned and ~85 % paw-weighted, so R2c's rigid-to-endpoint
correction over-corrects (Claude's derivation in review §9). Direction issued: **R2c′** — model the support by its
actual skin weights, crabs must reproduce bit-for-bit, Civet must pass unchanged, then resume §8. Codex's R2c
packet is staged UNSIGNED (1Password refused both lanes tonight; now unlocked) — sign it first. R1c-c attributed
most cold flora CPU to the declared scale (per-pass cost, `normalPasses` 4 everywhere): leaf red for R8/Q4.

### R2c′ ran, S2 fired again (Codex `R2c-prime/`, signed `dd33865c`) — direction R2c″ issued (review §10)
Crabs bit-for-bit; Civet idle/approach pass; `melee:bite` 0.266 px = covariance 0.100 + ARAP 0.181. The retained
samples show the crabs' ARAP residual at their (R1b-pinned) supports is 0.0000 px in every row while the unpinned
candidate-10 Civet carries 0.02–0.20 px even in passing rows. R2c″: exact per-vertex LBS at the support, and
regenerate the Civet binding through the current shared split with contact locks (candidate-10 kept as history);
control: unpinned candidate-10 under the new model must still fail. E1 then loads the regenerated Civet binding.

### E1.5 done — the films exist (`audits/BATTLE2_E1_PROOF_20260919/`)
`tools/battle2-proof/native-runner.mjs` films two real fits on the real stage in Edge. Five Civet-vs-crab runs pass
(zero refusals, CPU p95 ≈ 2.2 ms at 60 fps); `review-sheet.png` is the packet row. **The film found what the gates
could not:** the parts rig was invisible (normalized display units drawn 0.3 px tall — fixed, `cutout` 1×1 +
`sourceSize`), and the quadruped victory rear-up was refused as a planted stance (fixed, `plantedFor` frees it).
For Nick's eye: the contact gap stops at a crab's leg tips (silhouette box vs body box — kit question); the fainted
crab stands back up (V2 on the stage); crabs are raw painter texture until R9.

### TypeSafe tooling live on this lane — both batteries done (log §1–§5)
Eight tools (`npm run typesafe:rig|reference|judgetag|reference2|biome|text|procedural|universe`), ≈ $0.11 for the
whole day. Table fixes: 3 regex + 14 fauna postures + 4 flora forms, all gates green. **Findings that need Nick's
decision, not edits:** (1) "A omnivore" article bug at `main.js:2165` — fix is one line but changes the determinism
fingerprint (re-baseline decision); (2) 12/60 sampled procedural fauna are swimmers/drifters in dunes/ridges/canopy —
`loco` and `habitat` roll independently; (3) `climateBand` is orbit-only, so molten/Venusian worlds land in cold/
temperate bands that seed species; (4) biome atlas family lists are subsets (design or gap?); (5) `tuber`/`rosette`
conventions in `flora.json`. **Safety:** all three checkouts are worktrees of ONE `.git`; 455 commits (315 + 140) exist
only on this Mac — bundle backup written to `~/Projects/celestial-frontier-lanes-backup-20260919.bundle`; the plain
branch push of both lanes Nick then authorized is done (see Lane state), so origin now holds every commit on this Mac.


### What Claude owes next
-28. **Re-merge of Codex's R3-S → §8 (2026-09-21, this commit):** see Lane state above. E1 re-film on the family solver is next (browser run).
-27. **Slice 31 (2026-09-21, commit `82c25377`):** `emit.mjs` — the compiler writes Codex-format `labels.png` + `declaration.json` per crab (`audits/INTAKE_COMPILER_20260921/compiled-01/`), with declared gaps (eyes unnamed; arm/palm split first cut; quadruped part vocabulary needed from Codex; no record written). P2 constants in body units are an option (byte-identical at 512); scale is not a lever (thinning topology). After this the Claude list is blocked on Codex's R3-S stop and Nick's D2 decisions.
-26. **Slice 30 (2026-09-21, commit `f400328e`):** the coconut/freshwater "false endpoints" are the near claw's lone dactyl tips (5–6 px from the record) whose twin merged into one ridge at the 512 px working scale — a P2 graph defect, not a matcher one. Palm, twin-stub, thinness re-sweep and a working-scale sweep measured and rejected; the prerequisite is P2's constants in body units. Codex is running R3-S (authorized 2026-09-21).
-25. **D2 G6 (2026-09-21, commit `3191d02b`):** `combatantScale` gains a `frameFill` option (guardian frame fill as an option of the scale, not a species branch) with three outcome tests (`arena-frame-fill.test.ts`, 3/3 pass, tsc clean); nothing wired until a guardian record exists (D2 decisions for Nick). After this the Claude list is blocked on others: E1 re-film and the parts-rig family solver wait for Codex's R3 re-merge; D2 G1–G5 wait for Nick's four decisions; R9 (b)/(c)/(e) need the canonical finisher/ownership map/native harness on Codex's lane.
-24. **Slice 29 — option A done (2026-09-21, commit pending signature):** knees measured across four placements (exit + reference fraction stays; bend-based rejected at median 90 px); tail landmark = farthest leaf near the tuft junction (Civet tail3 65 → 42 px). **§6 PASS 2/7** (Civet, Wolf) on the committed run. D2 first-guardian design written (`audits/VISION_PROGRAM_20260920/D2_FIRST_GUARDIAN_DESIGN.md`: Brown Bear recommended, pipeline G1–G7 with owners/gates, CPU needs a guardian tier — four decisions for Nick). R9 (b) coconut rerun at workCanvasMax 1088: not run — the canonical finisher has no work-canvas flag on this lane and the run needs the browser + local model; recorded, not chased.
-23. **§6 pass printed honestly (2026-09-21, commit `c4e7fabe`/`753d0cb7`):** `ic4.mjs` PASS = ADMIT + every named landmark within 60 px of the record: **PASS 1/7** (Wolf, verdict only; the Civet fails on `tail3` at 65 px), FAIL 6/7 — corrected from the actual run after `c4e7fabe` shipped a scope error; second-round declarations and the claw-attached test measured and rejected. Levers exhausted on these subjects: rules (slices 18–28), declarations, economics, ordering, interior edges, confidence. What moves it next is not on this lane: the remaining wrong feet are false endpoints beside the claws that every family-free feature measured so far shares with true legs.
-22. **Slice 28 (2026-09-21, commit `b21789a7`):** per-slot assignment margins implemented and measured against the wrong feet — fails the both-way control (two wrong feet have wide margins, several right feet thin); kept as output, not a gate. The three wrong-foot ADMITs come from false candidates the cost model prefers, not close calls. IC-4 unchanged.
-21. **IC-4 status report (2026-09-21, commit `e00b19dd`):** `audits/INTAKE_COMPILER_20260921/IC4_STATUS.md` — the verdict passes 5/7 but PROGRAM §6's landmark bar passes 1/7 (Civet at 31 px): three ADMITs carry wrong feet (freshwater leg3Near 206, mud folded leg0Far 158 — the false loop won once the folded waiver dropped the length penalty —, vent leg2/3Near 429/439). Next compiler item: a per-slot confidence in the verdict (cost margin + evidence kind) so a wrong NAME refuses; then the folded-slot rule by expected position, not a waiver.
-20. **Slice 27 (2026-09-21, commit `0ba7210b`/`657fd938`):** Codex applied the three `folded` declarations to the fits' `presence.json` (`openai/mac`); the compiler now reads declarations from those files (`declarationOf`), proposal map removed; results byte-identical (IC-4 positives 5/7 · 7/7 · 6/10 · 7/10). Open: crab `leg3Far` (finger vs short leg) and the coconut's painted-but-declared-hidden `leg3Far` are fit-declaration calls for Nick; the seven absorbed mutants are named in README slice 26.
-19. **Slice 26 (2026-09-21, commit `c62abcb8`) — Nick decided: folded legs are DECLARED.** `declaredFolded` is an intake input; proposal for Codex's presence files in `audits/INTAKE_COMPILER_20260921/FOLDED_DECLARATIONS.md` (crab `leg0Far`, mud `leg0Far`, vent `leg0Near`). IC-4 positives 3/7 → **5/7**, wrong-template 7/7; erased/duplicated 6/10 each (the mutants need re-cutting for folded legs — next). Two refusals with recorded causes: crab `leg3Far` read as a claw finger; coconut shows a leg its fit declares hidden. Eight absorbed mutants named in the README (folded slots re-admit any loop; the mutant runner must compare against the positive's own loop).
-18. **Slice 25 (2026-09-21, commit `3aa3cb14`):** four ordering primitives measured side by side (separation / tip / label-border root / mid-limb / per-depth): all tie at 28–29/38, none moves IC-4; `sep` stays. The remaining near-side errors are a candidate-order swap (coconut) and a loop-evidence shift (vent). State: named 29/38, positions 30/39, IC-4 strict 3/7 · 7/7 · 7/10 · 9/10 over seven subjects.
-17. **Slice 24 (2026-09-21, commit `d5d3ea52`):** declared-hidden slots are pre-emptied in the assignment (the declaration is an intake input): hidden sets exact by construction; coconut now refuses on an unused endpoint at its declared-hidden leg (correct). Ordering by tip angle measured and rejected (28/38). State: named 29/38, positions 30/39, IC-4 strict 3/7 · 7/7 · 7/10 · 9/10 over seven subjects. Next P6 item: an independent ROOT estimate along the body outline as the ordering primitive.
-16. **Slice 23 (2026-09-21, commit `3564eafa`):** Codex's Wolf (PROGRAM §6 exception, `openai/mac` `audits/VISION_P1_QUADRUPED_20260921/generation-01/`) through the identical code: ADMIT with tail + four paws after one generic change (an appendage's length counts the body-thick run from the spine — a bushy tail); Civet ADMIT unchanged; crabs unchanged 29/39. **Nick decided the IC-4 verdict is strict.** IC-4 over seven subjects: positives 3/7 (freshwater, Civet, Wolf), wrong-template 7/7 refused, erased 7/10, duplicated 9/10 — still not passing on coconut/crab/mud/vent (true loop-filled rear legs; declared-hidden slot filled on the coconut). Signing law: commits from this session fail at 1Password's approval; Nick commits from Terminal.app with the message file, Claude pushes.
-15. **Slice 22 (2026-09-21, commit `1f8c4055`):** `touchNotSep` (a touching tip at an endpoint chain's separation point is a junction, not a tip) + `thickMaxLen` 0.7 are the defaults: named **29/39** (from 27/39), positions 30/39; IC-4 strict positives 2/6 · wrong-template 6/6 · erased 7/10 · duplicated 9/10 (lenient 3/6 · 6/10 · 7/10). Naming and verdict now pull against each other on TRUE loop-filled rear legs (crab 68 px, mud 10 px); next lever = the loop candidate's own thin-cross-section test. Sheet regenerated.
-14. **Sheet + contact refinement (2026-09-21, commit `9145ead1`):** `sheet.mjs` renders the compiler's reading per subject for Nick's eye — `audits/INTAKE_COMPILER_20260921/sheet-01/` (six PNGs + summary); contact-terminal refinement through the contract (Civet paws 18–31 px, named 27/39); appendage-slot candidates count as used (Civet ADMIT); IC-4 now positives 4/6, wrong-template 6/6, erased 7/10, duplicated 8/10. Economics grid and `thickNeedsFork` measured and rejected (README slice 21 addenda).
-13. **Slice 21 (2026-09-21, commit `e071017c`):** interior-edge stage built as an off-by-default option and measured; slice 19's "no candidate" finding CORRECTED (the folded legs are in the pool, misclassified/weak); strict evidence verdict in `ic4.mjs` (erased 7/10, dup 8/10 refused, positives 3/6); second wrist cut. Bottleneck stated precisely in README slice 21: unused/empty-slot economics + terminal-thickness consistency let two false far-side candidates outbid an empty slot. Defaults unchanged (30/35, 24/34).
-12. **Slice 20 (2026-09-21, commit `bdddefdb`):** Codex answered the hidden-placement question (`openai/mac` `78dc7dc3`, read-only note): geometric rule, `hidden-anatomy.mjs#inferHiddenLandmarks`, 0 px from the hand roots. Adopted in `assign.mjs` generalized to stations (no leg names); contract axis mapped per view (front → spine top normal). Hidden feet from the compiler's own roots: crab 108, freshwater 112, mud 391, coconut 709/460 (misnamed pair 2). Claw wrist probe: the wrist is on the body ridge between the claw root node and the spine — next P3 step is a body-edge shortest path per claw with the DT minimum as the wrist (unblocks P7 body IoU). Codex's `hidden-anatomy.mjs` is NOT merged here yet; the compiler will call it at the next local merge instead of its own copy.
-11. **Slice 19 rounds (2026-09-21, commits `16e736a4`, `62f98e48`, this one):** naming-bottleneck rules measured and rejected with numbers (touch junction body-distance bound, loops off, even-spacing prior, gap-consistency prior, P7 leg-seed offset). **Design finding for Nick:** the two legs no rule can name (freshwater/crab `leg0Far`, folded flat over the carapace) have no candidate at all — a limb painted over the body is inside the silhouette and invisible to the alpha-only ridge graph; an interior-edge probe shows its contour is present but texture-noisy. The compiler needs an interior-edge stage (design item) — until then a folded leg is an empty slot and an erased-leg mutant on it is undetectable by construction. Options retained off by default; defaults unchanged (crabs 30/35 positions, 24/34 named).
-10. **Slice 19 (2026-09-21, commit `5f7b41fd`):** IC-4 absorbed mutants diagnosed — the erase is real; the slot was already filled by a false touching tip in the positive, so the verdict cannot beat the pool; the independent tip-detector count is not usable (10/7, erasing raises it). P7 labels first cut (`labels.mjs`, geodesic nearest ridge, 130–200 ms): body 0.35–0.48 IoU, claws 0.29–0.50, legs 0.6–0.8 where named right, 0 where wrong. Next: naming precision (loop/touch evidence) is the single bottleneck for verdict AND labels; then body-outline seeding for P7; then Codex's hidden rule.
-9. **Intake compiler slice 18 (2026-09-21, earlier commit `1a72806f`):** the compiler is template-driven end to end — descriptor from the family contract + measured rest ratios (`port/v2/tools/anatomy-verify/template-rest.mjs`), `view`/`facing` conventions, every threshold in body units, spine-ridge axis, contract appendage slots (tail claimed on the Civet), exact side-view station assignment; two graph bugs fixed (duplicate edges in `ridge.mjs`; exponential chain DFS → shortest-path tree). Runner committed (`score.mjs`), gate committed (`ic4.mjs`). Numbers at 25 px: crabs positions 30/35, named 24/34 (from 22/35, 13/25); Civet all four paws + tail in the right slots (20–60 px, paw-pad vs toe). IC-4 first run: positives 4/6, wrong-template 6/6 refused, erased 5/10, duplicated 6/10 refused — **not passing**; the absorbed mutants are the next fix (evidence-per-slot verdict + count check). Knees first cut 7–110 px; hidden placement disagrees with Codex's behind-the-claw rule (165–735 px) — read the record rule from the writer before tuning. P7 labels not started. Everything measured is in README slice 18 with the failed rules (√rest body split, Otsu, rest-angle and rest-length priors, interior/profile touch tests, thick-finger off, far-point refine).
-8. **Universal intake compiler (Nick, 2026-09-20 night):** design in `audits/VISION_PROGRAM_20260920/INTAKE_COMPILER_DESIGN.md` — no creature or family code, a template-driven graph matcher; crab = instance 1, Civet = instance 2; build order P4 separation point + template-derived body ratio → P5 matcher → P6/P7 → IC-4. Codex delivered all four crab films (geometry green; CPU one-run 3.6–4.0 ms reads recorded, not chased); IC-3 frozen.
-7. **Decisions recorded (PROGRAM §6, 2026-09-20 night):** painted-tier CPU gate 3.5 ms full-film p95 on desktop, boundary 24 canonical; IC-4 acceptance bar fixed; no new intake or painting until IC-4 passes (one painted quadruped excepted); trust battery after IC-4. Codex: apply the gate, deliver the four crab films/sheets, then hold with writers frozen. Claude: compiler graph queries (count-driven thin cluster, loop limbs, eye knobs) then side/order assignment.
-6. **IC-1 (intake compiler registration) status, 2026-09-20 evening:** three cuts measured against Codex's hand landmarks — feet-only assignment (6/8 + 3/3 exact), guide similarity (rejected, 200 px residual), root-anchored carapace transform (rejected, roots 170–210 px). Conclusion in `anatomy-verify/README.md` slice 10: build the painting's ridge graph and match it topologically to the template graph; the guide supplies counts/order/directions only. Next Claude slice = the ridge graph. Program §5 unchanged.
-5. **2026-09-20 midday state:** five painted crabs accepted by Nick (art); coconut rigged with a declared hidden pair to a film (two leaf reds: painted-tier CPU, faint-recovery continuity); vent crab through intake; crab/freshwater/mud await hidden declarations for the claw-occluded front leg; Codex running the boundaryStep CPU series and the continuity ledger. T1: tip detector + same-toe merge sound (`anatomy-verify/README.md` slice 6), class assignment needs the template-graph walk-back (next). T2 first numbers `audits/VISION_PROGRAM_20260920/T2_FIRST_NUMBERS.md`; P2 design `P2_ASSEMBLY_DIRECTION.md`.
-4. **P1 complete to a film (2026-09-20 morning):** Codex's `hidden-01` — hidden pair declared, 21 visible parts, exact rest, drift 0.001 px, twelve rows + presentation green, film 14.2 s zero refusals; two leaf reds (approach CPU 2.10 ms vs <2 ms; faint-recovery root step 9.10 px vs 8.10 px stride bound). Claude's review `audits/VISION_PROGRAM_20260920/P1_ANIMATION_REVIEW.md`: accepted as built; CPU is a painted-tier budget decision (vertex-budget measurement first); continuity guard to be split gait/non-gait by measurement; the other four crabs may be PAINTED now, rigs wait. Nick's animation verdict on the film is the open item.
-3. **Vision program authorized 2026-09-20** (`audits/VISION_PROGRAM_20260920/PROGRAM.md`): painted library + morphs (Track P), trust as a funded track (T1 verifier design in `port/v2/tools/anatomy-verify/README.md` with three retained failed slices; T2 battery; T3 contract), anatomy chain through R4 then the roster HOLDS for P1. Claude next: T1 step 2–3 (ridge skeleton + template graph matching) and the P1 compile packet for the coconut crab; Codex after R4: paint P1, admit, rig, film.
-2. **R9 was built TWICE (2026-09-19 night):** Codex's R3-S single run reached its queued R9/Q1 (`openai/mac` `0cae378e` → `36489e9a`: native-pixel finisher with label-driven editable mask + per-pixel conservation, five finished crabs, native films with numeric equality, IndexedDB round trip, phone fallback, atlas control) while Claude built the addendum's same file set here under Nick's "I want to build it". Both measure the same thing: at the accepted 0.35 × 1 step the finish is subtle (Claude SSIM 0.98–0.997 / ΔE ≈ 1; Codex's crabs through Claude's gates: SSIM 0.983–0.995 / ΔE 0.5–1.2). **Reconciliation at the re-merge: Codex's R9 is canonical** (it sits in the single-run chain with native rows); every same-path file (`creature-originals.ts`, `finish-master.mjs`, `finish-conservation.mjs`, `prepare-observed-crabs --finished`, `landfall-conditioning.ts`, `kit-worker-engine.mjs#finishCreature`) takes Codex's version; Claude keeps only what is additive — the integer work canvas (`creatureWorkPlan` + resamplers) offered as an option, the both-way gate mutants, `finished-fit.test.ts`, and the strength/steps study runner — re-based on Codex's finisher. `crab-finish-01` stays as a retained diagnostic packet, not a second certification.
-1. **R9 follow-ups (this lane, after Codex's read-only review of `crab-finish-01`):** (a) if Nick authorizes it, a bounded strength/steps study on one crab (0.35/1 · 0.5/2 · 0.65/4) on the same tool; (b) coconut-crab rerun with `workCanvasMax` 1088; (c) the Civet as the sixth subject with its ownership map from the parts build; (d) route `creature-originals.ts` behind a desktop-only load path so the finished atlas replaces the painter atlas as texture source; (e) native rebind rows on Codex's harness at the re-merge.
0. **Self-finding (review §12):** the E1.5 films used the compat solver, which has no joint-limit check; they are contact/cadence evidence only. The parts rig moves to the family solver at the R3 re-merge (already planned) and the films are re-shot then.
1. **Re-merge at Codex's signed R2c′/R3 producers**; pass `observedContactSupports(record, binding)` to the parts rig's family solver; then flip the three pins: `ContactPhase.travel:'stage'` in the parts-rig
   context (drop the interim stride double-count note), crab attacks through the stage, pinch selection; re-run
   `parts-rig.test.ts` + `e1-outcomes.test.ts`; move crabs from target-only to attacker in outcome 2.
2. E1.5 is done (above); re-film after the R2c′/R3 re-merge so the packet shows planted feet and crab attacks.
3. Guardian design (D2) as a document; Chronicle cadence sync stays open.
4. Merge findings to hand Codex at the stop (recorded in `e86a66ab`): its pose probe hard-codes an absolute path into this
   worktree and pinned my old adapter bytes (make it repo-relative, re-pin); `creature-blender-export.mjs` must span
   `paintOverrideCanvas` (one-token edit, identical text applied here); `resolvePhysicalHabitat` never reads `genome.realm`
   (a habitat-gene-less "drifters" jelly resolves aerial); the I5 stale certificate is the one red on both lanes.

### Codex (openai lane)
Holds with writers frozen; the `folded` declarations are applied and consumed (slice 27). Nothing further asked unless Nick decides the coconut/crab declarations.
Continues §8 unattended. Interfaces E1 consumes from R3, unchanged: `ContactPhase.travel?: 'solver' | 'stage'` (zero solver root
dx in stage mode, stance targets unchanged) and `contactJoint` on `compileAnatomyAttack` (already on the attack rows). Nothing
in Claude's E1 changed a Codex-owned file except the two merge repairs above, both recorded for re-application in its lane.

### Nick
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
