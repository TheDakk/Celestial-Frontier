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

## CLAUDE SESSION HANDOFF — 2026-09-26 (session 3, end) · GENERATED ART IS THE GOAL
Self-contained for a fresh Claude session. Codex's block follows below. Older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md`.

**Dakk's goal (2026-09-26, verbatim):** "Can we get to the generated art? That's the main goal, so that we have the complete Earth creatures having full movement animations and all the procedurally generated animations in their various different battleground biomes." Dakk will do ONE full visual pass at the end, so don't stop for per-creature approvals; keep the pipeline flowing and keep review sheets current.

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit adding this block; every commit is signed G (`git-ssh-sign-cf`); `origin` is HTTPS via `gh`. Codex is merged through `2447b472`.
- **Gate:** from `port/v2`, `node tools/check-profile.mjs --profile=develop` gives ~5,647 pass; the ONLY red is I5. Run it on a QUIET tree: a commit mid-run gives a spurious "Source changed during authority read". Also run by hand: `npm run typecheck`, `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** https://dev-celestialfrontier.github.io (last Claude publish `c99e3eb7`). Republish with `node tools/deploy-dev.mjs` (from `port/v2`, out of the sandbox, clean signed head) after any batch that changes what Dakk plays.
- **develop** is still `c1791e21`; PR #43 is open; no hosted attempt (I5 red).
- **Decisions** (`audits/MAILBOX/DECISIONS.md`):
  - **D24 DECIDED:** G1 is scored on the generated G2 paintings, per family.
  - **D26 DECIDED yes:** alpha ≥ 250 finisher eligibility. Implemented by Codex (`audits/D26_FINISH_20260926`: five-crab and 1254 Cougar native proofs PASS).
  - **D25 open:** keep reference shopping off (recommended).

**The pipeline, stage by stage (see each README)**

| Stage | State |
|---|---|
| G2 generation (Codex) | Batches so far: 20 quadrupeds, 20 families, 6 stride paintings, 9 C47 layouts, and **24 NEW (`audits/G2_THROUGHPUT_C54_20260926`: dingo, jackal, hyena, lion, tiger, leopard, jaguar, snow leopard, ocelot, serval, stoat, weasel, duck, goose, quail, partridge, python, boa, racer, garter snake, cockroach, locust, beetle, termite): NOT YET SCORED, your first job.** |
| G1 auto-author (Claude) | Adopted v10 (`audits/G1_AUTO_AUTHOR_20260926/README.md`). G2 quadrupeds 10/20 ADMIT + PASS_STATIC; G2 fish 5/5 (semantic presence RESOLVED); birds/serpents/insects 0/5 (layout drift, C47). Mutation battery: erased 31/34, dup 26/27, flip and wrong family 34/34. Author-side levers are exhausted except the tail-stalk gap (below). |
| Native + visual | 9/10 G2 quadrupeds native PASS (`native-g2-quad/review-sheet.jpg`). Faults: Arctic Fox tail blotches, Marmot crouch head, Cattle rearing hump, Red Fox stance-reach failure (Codex, C54). |
| Fish | Selective axial welds (`weld-g2fam-fish/`) closed the holes; durable packets `audits/G1_FISH_PACKETS_20260926/` are **REJECTED by Dakk** ("the tail looks crunchy and missing"). **Cause found** (`audits/G1_AUTO_AUTHOR_20260926/stalk-gap/README.md`): the transfer leaves a `body-5`↔`caudal` ownership gap on the tail stalk, owned by the root `body`, which crushes into a knot. `fill-gap.mjs` removes the Cod knot (native PASS), but a stalk tear remains that needs a split-side seam (C55). Codex (`audits/TAIL_STALK_C54_20260926`) says generalization is still blocked (Perch/Carp scattered remainder boundaries; Arctic Fox tail3→tail2 ownership). The hand Bass flexes cleanly: tails are solvable. |
| G3 delivery | Live, browser-smoked (card path PASS). |
| G4 selection | Live: `paintedArtV2`, one resolver for card and stage. |
| G5 finisher | **Card and stage in the game behind `?finish=1`, proven in real browsers:** desktop shipped path PASS (`finish-smoke/run-03-shipped`), phone delivery PASS (`phone-smoke/run-02`), stage PASS (`stage-smoke/run-01`). Finish sources are in the pinned library (`library/creature-finish-source/`). Codex published five canonical phone keys (a 613-file manifest). Open: C51 pin-based identity (phones download sources to compute the key); Dakk's quality review before the flag defaults on. |

**Next, in order (Claude)**
1. Read Codex's mailbox (`/Users/dakk/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only); merge any newer signed `openai/mac` (`--no-ff`; after resolving, `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing; keep this block).
2. **Score the 24 new paintings:** `node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=g2c54-v10 --topk=1 --chains --counter --fallback=2 --targets=audits/G2_THROUGHPUT_C54_20260926/pilot.json`. Then run native on every ADMIT + PASS_STATIC (`CF_CPU_THROTTLE=4 node port/v2/tools/battle2-proof/native-runner.mjs <fit> <fit> <out> <script>`, from `port/v2`, out of the sandbox; land scripts from `audits/ART_BATTLE_FOCUS_20260925/05-cougar/battle-script.json`, fish from `10-tang`). Build a review sheet and LOOK at it (tails, legs, heads) before calling anything good. Record per-family results in the G1 README; send Dakk the sheet (SendUserFile).
3. **Tail stalk:** work with Codex's C55 answer. Make the gap rule general only when it fixes a held-out fish without regressing the others; re-run the fish.
4. **Admission:** once Dakk approves creatures (his end-of-pass review), add them as LIBRARY archetypes (`tools/morph/build-card-masters.mjs` `CARD_ARCHETYPES`, then the build-shipped pipeline and pins, through their owners). G4 route 1 then draws each Earth species with its own painting.
5. Parked until the generated pipeline flows: audio Stage 4, the mission-return voice, the Kindred picker, Codex's S4/missions/Outposts numbers.

**Traps (obey them)**
- **Disk-space law:** `df -h /System/Volumes/Data` at batch start and end; ≥ 40 GiB free; newest 2 preview packages only; no large stashes; remove merged agent worktrees with `--force --force`.
- **Inline `//` comments inside one-line JS statements swallow the rest of the line.** This bit THREE times this session. Use `/* */`.
- The G1 runner caches fits (it skips intake when `fit/` exists): use a fresh `--tag`.
- A green number is not visual acceptance: LOOK at stills at full size (Dakk caught the crunchy tails the numbers missed).
- Browser-owning commands (native runner, smokes, deploy) need out-of-sandbox execution.
- Codex's sealed inventories (release/Guide copy, pins, budgets) are never rebound by Claude; propose in an audit README.
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
