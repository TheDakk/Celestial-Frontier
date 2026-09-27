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
- **Branch:** `anthropic/mac` is pushed through the commit adding this block; every commit is signed G (`git-ssh-sign-cf`); `origin` is HTTPS via `gh`. Codex is merged through `046914af` (C56: exact tail labels, the Red Fox contact measurement, phone-original producer, 32 G2 requests in generation).
- **Gate:** from `port/v2`, `node tools/check-profile.mjs --profile=develop`; the ONLY red is I5. Run it on a QUIET tree. Also run by hand: `npm run typecheck`, `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`. This session changed audits/docs only (no `port/v2` source), so the dev site was not republished (still `c99e3eb7`).
- **develop** is still `c1791e21`; PR #43 is open; no hosted attempt (I5 red).
- **Decisions** (`audits/MAILBOX/DECISIONS.md`): D24 and D26 are DECIDED (per-family G1 scoring on G2 paintings; finisher alpha ≥ 250, implemented). D25 is open (reference shopping stays off). **D27 NEW, open:** regenerate patterned cats with the pattern named first (recommended; Codex proceeds unless Dakk objects).

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

**Next, in order (Claude)**
1. Read Codex's mailbox (`/Users/dakk/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) for its C57 replies. Merge any newer signed `openai/mac` (`--no-ff`; after resolving, run `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing; keep this block).
2. **Score each new G2 batch the same way:**
   - `node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=<fresh> --topk=1 --chains --counter --fallback=2 --targets=<batch>/pilot.json`.
   - Then run native on every ADMIT + PASS_STATIC. Pattern: `audits/G1_AUTO_AUTHOR_20260926/native-g2c54/run.sh` (sequential, out of the sandbox). Land scripts come from `05-cougar`, birds from `15-goose`, fish from `native-g2fam-fish/*-script.json`, each with the names swapped.
   - Build the sheet with `native-g2c54/sheet.mjs` and the full-size crops with `crops.mjs`, then LOOK at tails, legs, heads and elbows. Record the results in the G1 README and send Dakk the sheet.
3. **Tail:** Codex's exact-label placement (`audits/TAIL_LABELS_C56_20260926`, merged) supersedes my polygon bridge; the reassigned pixels agree exactly, and it also covers Arctic Fox.
   - Run the G1 held-out and mutation checks on the exact-label contract (Codex asks for this before integration), and look at its native stills at full size.
   - Integrate it into the author only if it passes without regressing Cod, Perch, Carp or Arctic Fox.
   - Codex's next G2 batch (C56: 32 paintings, 8 per family) arrives for scoring next to the 24.
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

## Current Codex sprint handoff — 2026-09-26, C56 active batch

- Worktree `/Users/dakk/Projects/celestial-frontier-openai-mac`, branch `openai/mac`. Signed no-ff merge23bae15b contains requested f50abbf7; Claude handoff above preserved exactly. C55/C56 and decisions read read-only. D24/D26 live; D25 off.
- Goal remains every Earth creature generated and moving in its battle biome, one visual review at the end. No per-creature pause.
- Tail seam decision: author emits shared exact labels; existing split already welds anatomical body5/caudal. New `TAIL_LABELS_C56_20260926` avoids lossy contour projection. Cod/Perch/Carp/Arctic Fox preserve every changed pixel, original RGBA/recipe and other ownership. Five controls, four static suites, three native captures PASS with zero refusals. Full visual acceptance remains open (other body slivers, Arctic Fox crouch tears). No replacement/admission or tolerance relaxation.
- `QUAD_CONTACT_C56_20260926` measures Red Fox near foreleg exceeding 8% compression in additive idle/trot at zero travel; prior far-leg projection did not address it. Marmot head/Cattle hump and six prior fit repairs remain open.
- G2 C56:32 canonical requests prepared (8quadrupeds/8birds/8serpents/8insects); image generation running. Retain every returned original byte-exact, receipts, geometric observations and review sheet, then ask Claude to score pilot alongside previous24. Do not claim G1 acceptance.
- `PHONE_ORIGINALS_C56_20260926`: canonical Cougar/Wolf/Gull producer prepared; source admission verified. Commit producer, run native three-source proof, independently verify conservation then publish exact bytes and regenerate library manifest. Prior D26 five-crab/Cougar proofs and five canonical keys remain intact.
- Signed commits only; own normal push after local battery (I5 only accepted red), fresh budget/visibility/workflow check. No PR/label/hosted/develop/main/release/deploy. Keep≥40GiB; session started221GiB and no tool updates needed. No new worktree.
- Finish batch: validate, full browser-free develop owner and remaining7owners, retain all reds, update references and this handoff, read Claude mailbox at batch end and reply only in own TO_CLAUDE. Claude continues automatic scoring; Dakk need not relay or switch apps.
