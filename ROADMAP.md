# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Dakk, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

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

## CLAUDE SESSION HANDOFF — 2026-09-26 (session 4, end) · GENERATED ART IS THE GOAL
Self-contained for a fresh Claude session. Codex's block follows below. Older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md` (session 3's is at its top).

**Dakk's goal (2026-09-26, verbatim):** "Can we get to the generated art? That's the main goal, so that we have the complete Earth creatures having full movement animations and all the procedurally generated animations in their various different battleground biomes." Dakk does ONE full visual pass at the end, so don't stop for per-creature approvals; keep the pipeline flowing and keep the review sheets current.

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit adding this block; every commit is signed G (`git-ssh-sign-cf`); `origin` is HTTPS via `gh`. Codex is merged through `7441ee1e` (merge `d8f71eca`: 32 C56 + 7 C57 pattern paintings, Cougar/Wolf/Gull phone originals, `pattern-observation.mjs`, elbow-flap diagnosis).
- **Gate:** from `port/v2`, `node tools/check-profile.mjs --profile=develop`; the ONLY red is I5. Run it on a QUIET tree. Also run by hand: `npm run typecheck`, `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`. Claude changed audits/docs only. Codex's merged `port/v2` change adds finished phone originals behind `?finish=1`; see "Dev site" below.
- **Dev site:** https://dev-celestialfrontier.github.io, republished by Claude from the signed commit carrying this block (it adds Codex's Cougar/Wolf/Gull finished originals behind `?finish=1`). Republish with `node tools/deploy-dev.mjs` (from `port/v2`, out of the sandbox, clean signed head).
- **develop** is still `c1791e21`; PR #43 is open; no hosted attempt (I5 red).
- **Decisions** (`audits/MAILBOX/DECISIONS.md`): D24 and D26 are DECIDED. D25 is open (reference shopping stays off). **D27 is open** (patterned cats): its recommended default is implemented; the Snow Leopard and Clouded Leopard re-paints pass, while the Tiger/Ocelot/Leopard re-paints and both Jaguars do not.

**This session (session 4)**
- **C54 batch scored** (`audits/G1_AUTO_AUTHOR_20260926/README.md`, "G2 C54 batch"): 9/24 ADMIT + PASS_STATIC. Quadrupeds 7/12 (Dingo, Jackal, Lion, Tiger, Leopard, Ocelot, Weasel); birds 2/4 (Goose and Quail, the first birds through static); serpents 0/4; insects 0/4.
- **Native** (`native-g2c54/`): 7/7 quadrupeds DIAGNOSTIC_PASS 0/0. Goose and Quail FAIL native (peck refusals; ARAP folds and the faint foot limit).
- **Looked at full size:** the tails are all full.
  - Fit fault: on Tiger, Leopard and Ocelot, a chest-fur flap hangs below the near elbow in stride (`chest-zoom.jpg`), and the Leopard has a shoulder seam.
  - Painting fault: the five patterned cats have no pattern (D27).
  - The review sheet and the full-size sheets were sent to Dakk.
- **Fish tail** (`audits/TAIL_STALK_BRIDGE_20260926/README.md`):
  - A component-preserving bridge on top of Codex's C55 observed fill. The Cod is byte-identical to Codex's cover-04; the negative controls hold both ways.
  - Perch and Carp now pass ownership, static and native, and with their selective welds the gill hole is gone.
  - NOT adopted: neither is a genuinely gapped tail, and Trout, Herring and Arctic Fox still refuse (the outer contour encloses later-listed owners).

- **C56 + C57 scored** (the pattern gate was honoured: 6 skipped): 8/33 static, **7/8 native**. Snow Leopard, Clouded Leopard, Coyote, Mink, Marten, Fisher, and **the Raven, the first bird through the whole chain**. Bobcat: an instrument-class capture FAIL with 0 refusals.
  - Full-size faults: an elbow flap on every Cougar-referenced fit (Codex's repair; it now blocks 7 creatures), and the Raven's tail splits in the hit reaction.
  - Sheets were sent to Dakk. The running total is **23 generated creatures passing native**; none is visually accepted.
- **Exact-label tail contract checked independently** (`audits/TAIL_LABELS_CHECK_20260926`): a byte-exact reproduction, and 3 of 4 mutation classes are safe.
  - A wrong tail NAME silently moves paint. The guard `tail-identity.mjs` derives the pair from the rig joints (positive 4/4, negative 4/4).
  - The contract is accepted with the guard.

**Next, in order (Claude)**
1. Read Codex's mailbox (`/Users/dakk/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) for its C57 replies. Merge any newer signed `openai/mac` (`--no-ff`; after resolving, run `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing; keep this block).
2. **Score each new G2 batch the same way:**
   - `node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=<fresh> --topk=1 --chains --counter --fallback=2 --targets=<batch>/pilot.json`.
   - Then run native on every ADMIT + PASS_STATIC. Pattern: `audits/G1_AUTO_AUTHOR_20260926/native-g2c54/run.sh` (sequential, out of the sandbox). Land scripts come from `05-cougar`, birds from `15-goose`, fish from `native-g2fam-fish/*-script.json`, each with the names swapped.
   - Build the sheet with `native-g2c54/sheet.mjs` and the full-size crops with `crops.mjs`, then LOOK at tails, legs, heads and elbows. Record the results in the G1 README and send Dakk the sheet.
3. **Tail:** integrate the checked exact-label placement into the G1 runner (after intake, before static), with `assertTailPair` binding tail and stalk from the rig. Keep it OFF by default until Codex's body seams close. Re-run Cod, Perch, Carp and Arctic Fox plus the mutation battery.
   - The Raven's hit-reaction tail split is a new bird tail case: check whether it is the same stalk-gap class (tail vs body ownership) before handing it over.
4. **Birds:** Goose and Quail pass static but fail native. Diagnose peck/faint on the Gull-referenced fits (Codex owns the bird motion repairs; check C44/C57 replies first).
5. **Admission:** only after Dakk's end-of-pass approval, add creatures as LIBRARY archetypes (`tools/morph/build-card-masters.mjs` `CARD_ARCHETYPES`, then the build-shipped pipeline and pins, through their owners).
6. Parked until the generated pipeline flows: audio Stage 4, the mission-return voice, the Kindred picker, Codex's S4/missions/Outposts numbers.

**Traps (obey them)**
- **Disk-space law:** `df -h /System/Volumes/Data` at batch start and end; ≥ 40 GiB free; newest 2 preview packages only; no large stashes; remove merged agent worktrees with `--force --force`.
- **Inline `//` comments inside one-line JS statements swallow the rest of the line.** Use `/* */`.
- **zsh does not word-split `$var`:** `for f in "a b"; set -- $f` silently passes "a b" as one argument (it bit this session). Use `${pr%%:*}` pairs.
- The G1 runner caches fits (it skips intake when `fit/` exists): use a fresh `--tag`.
- **A green number is not visual acceptance.** The elbow flap passed every gate, and the native impact still is washed out by the hit flash (sheets use approach, return-end and reaction).
- Browser-owning commands (native runner, smokes, deploy) need out-of-sandbox execution.
- Codex's sealed inventories (release/Guide copy, pins, budgets) are never rebound by Claude; propose changes in an audit README.
- `tools/run-unit-tests.mjs` builds the PWA pack first; for quick diagnostics run `node node_modules/vitest/vitest.mjs run <file>`.

## Current Codex sprint handoff — 2026-09-27, C59 repair checkpoint

### Goal, source and authority
- Worktree `/Users/dakk/Projects/celestial-frontier-openai-mac`, branch `openai/mac`. Signed no-ff `1ba92999` merges requested `4b56836d`; incoming Claude session-4 block above preserved byte-identically. Implementation/evidence signed as `55471066`; final verification-only descendant follows.
- Every Earth creature needs its own generated painting and full movement in battle biomes. Dakk reviews once at the end. D24/D26 are live; D25 shopping stays off. Read Claude's absolute read-only mailbox through C59 at run start and batch end; reply only in this lane's TO_CLAUDE.md.
- Signed commits, normal own-branch push only after the local battery with I5 the sole accepted red and fresh budget/workflow check. No PR/label/hosted/develop/main/release/deploy. Disk >=40GiB; last215GiB, three permanent worktrees, no stashes, newest two previews only.

### Delivered repair work
- `audits/C59_REPAIR_20260926`: seven `*-side/fit` candidates correct the elbow flap on Mink/Fisher/SnowLeopard/CloudedLeopard and C54 Tiger/Leopard/Ocelot. Use `foreleg-side-labels.mjs` + `compile-side.mjs`; only opposite-foreleg ownership changes, same-side longitudinal cuts and all other owners preserved. Source pixels/records/recipes/landmarks/limits unchanged. All seven static PASS + native0/0,933–934frames,5.9–7.1ms CPU p95 at4×. Independent exact-label reproduction in candidate-checks.json. Before/after and late-reaction sheets inspected. C54 plain cats remain pattern-refused; other torso defects are not accepted. Broader and upper-only candidates are superseded, not defaults.
- Portable source-input triplets and restore-masters.mjs map ignored input masters back to exact TRACKED canonical originals. Claude can reproduce/adopt only after independent checks; no registry/pin admission occurred.
- Tail compile now calls Claude's assertTailPair before fill; four real pairs and actual wrong-Cod-name compiler refusal pass. C59 independent tail contract acceptance is consumed.
- Bobcat: diagnostic CPU-profile run reproduces850frames against887required,0refusals. Late reaction/return/idle reaches~200ms due ARAP/orientation WASM. Real performance red, not capture error; no lowered floor or accepted retry. Profile and phase table retained.
- Cod/Perch: two observed body/body-1 and body/body-2 welds on exact-tail labels close the large rectangular gill holes in the reviewed frame; static/nativePASS0/0,707frames,4.4ms. Cod belly sliver remains.
- ArcticFox: source-connected smaller remainder-island placement improves head/foreleg shards, static/nativePASS0/0,933frames,7.5ms. Pointed shoulder in lethal reaction remains. Head/spine weld-only is rejected; no whole-fox visual acceptance. Raven hit-reaction tail split confirmed and open.

### Generated paintings ready for Claude
- `audits/G2_C59_20260926/pilot.json`:12 untouched1254 originals, six quadrupeds/three birds/two serpents/one insect, built-in imagegen and exact compiled prompts/receipts. Six pattern-onlyPASS, five NOT_REQUIRED, MountainViper REFUSE (zigzag unresolved). WaterSnake bands/Ladybug spots corrected. Score11eligible; no hand authoring or retrospective prompt changes. Preserve overlapping limb/layout findings and all earlier refusals.

### Verification and next work
- Rootvalidate and focused controls PASS. Quiet signed55471066 battery:5,647testsPASS/1I5failure/2expectedfail/2skip; all7remainingownersPASS. Source and HEAD unchanged; final-battery/REVIEW.md binds logs. Fresh PUBLIC/UNFROZEN workflow check permits a normal own-branch push without hosted triggers. No ruler, solver, joint, compression, source-conservation or sealed baseline changes.
- Superseded films/redundant stills:546,101,803bytes hash-inventoried and pruned only after scoped ignore rules. Final seven foreleg films plus final fish/fox films and three reviewed stills per run retained; report inventories remain original and missing scratch is explained in scratch-prune.json.
- Codex: continue from the signed repair checkpoint; keep Bobcat performance, ArcticFox shoulder, remaining fish/quad faults and Raven tail split open. Existing RedFox/Marmot/Cattle/prior-six repairs, C51 efficiency and I5 retain their queues. Claude: merge signed lane directly, independently check placement candidates and score the twelve-master pilot while respecting refusals. No Dakk relay or app switching needed; no per-creature approval stop.

### Active override — I5 repair, 2026-09-27
Dakk now requests fixing I5. C59 is signed/pushed4b08de117; its generated-art queues remain open. C8 v2 ownership work resumed in audits/I5_REPAIR_20260927. Painted diagnostics add exact retained data-URL bytes; v2 keeps separate raw owner inventories and includes resident buffers.61instrumentcontrols/8paintedproducttests/appTypeScript/rootvalidate PASS. Next: sign this preparation, isolate its exact source in a managed checkout, run one fresh guarded3-calibration/1-certificate epoch, stop on any refusal without retries or limit changes. Only a successful new certificate can replace the active-profile v1 binding. No hosted/PR/label/develop/release. Claude handoff unchanged; own mailbox holds the coordination receipt.

I5 measurement update: signedb3a34e15's fresh epoch stopped at native keyboard entry (four-Tab assumption versus ten current filter chips), after the initial mixed-owner settlements passed. No retries/later phases/certificate. Changed successor derives/validates each native Tab from actual DOM topology, extends worker-error/dedupe controls to the correct owner, and embeds its helper for reproducible replay.63instrumentcontrols plus a native synthetic11-step positive/four-step negative pass. Signed successor c506e1a4 quiet battery is complete:5,647testsPASS, I5authority alone red, all7remainingownersPASS;63instrumentcontrols/native synthetic keyboard/rootvalidate PASS. A separately authorized fresh guarded3+1 epoch on exact c506e1a4 is required before v2 budget/profile admission. Failed source checkout archived;216GiB free. No retry/hosted work. C60 arrived: Claude independently accepted seven foreleg repairs, requests a25% movement guard, serpent-contract review and wing/tail follow-up; those stay queued behind this I5 repair.

Latest batch-end mailbox read: C62. C61 Termite/Cicada motion and same-joint intake merge; C62 folded-wing reference-pool work remain queued after I5. Existing generated-art requests remain open. Claude can consume signed fixes directly; no Dakk relay/app switch is needed.
