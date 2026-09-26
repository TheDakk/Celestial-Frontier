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

## CLAUDE SESSION HANDOFF — 2026-09-26 (end of day) · THE GENERATED CREATURE PIPELINE IS THE PRIORITY
Self-contained for a fresh Claude session. Codex's own block follows below; older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md`.

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit that adds this block. Every commit is signed G with the repo keychain key (`git-ssh-sign-cf`), and `origin` is HTTPS via `gh`.
- **Codex:** `openai/mac` last merged at `f01f911e` on Codex's side, and HEAD contains every Codex commit through `6cbeefe0`. Before merging, read Codex's mailbox (`/Users/nick/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) and run `git log HEAD..openai/mac`.
- **Gate** (`node tools/check-profile.mjs --profile=develop` from `port/v2`): **5,579 pass; the ONLY red is I5.** The Guide/release SHA red is fixed by Codex's C28(f) re-measure.
  - The profile stops at the first red, so ALWAYS also run by hand: `npx tsc --noEmit --noUnusedLocals`, the app and worker `tsc`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs` and `npm run overridecontrol`. All are clean.
- **Dev site:** https://dev-celestialfrontier.github.io serves `f1620af4`. Republish with `node tools/deploy-dev.mjs` from `port/v2`, out of the sandbox, on a clean signed head.
- **develop** is still `c1791e21`. PR #43 (`anthropic/mac` → `develop`) is open. No hosted attempt: I5 is red (D5).
- **Branches:** development is Mac-only. The Windows branches and `anthropic/review-batches-1-3-20260905` are deleted; the live docs mark Windows retired. Remote branches are `main`, `develop`, `anthropic/mac`, `openai/mac`, plus three old `openai/*` branches. Two of those are merged; `openai/parked-gameplay-20260904` has 2 unmerged commits (question to Codex, C39).
- **Disk:** about 214 GiB free. Obey the **Disk-space law** in `PARALLEL_GIT_PROTOCOL.md` (it's imperative).

**The priority: the Generated Creature Pipeline** (Nick D22 hybrid generation, D23 pipeline first; `audits/GENERATION_PIPELINE_20260926/PROGRAM.md`)

Nick's vision is that every creature shows its OWN AI-generated painting. Today we have a bridge: 38 archetypes painted by hand-driven AI, and every other creature drawn as the nearest archetype morphed by its genes. The painting-to-rig step (`authoring.json`) is hand-authored by Codex.

| Stage | Owner | State |
|---|---|---|
| G1 auto-author: painting + family → `authoring.json` → Codex's UNCHANGED `intake-authored.mjs` | Claude | **v2 merged: 12/40** admitted + static with zero hand edits. The gate is ≥ 30/40; the hand ceiling on this gate is 30/40. Code: `port/v2/tools/anatomy-verify/auto-author.mjs`; results: `audits/G1_AUTO_AUTHOR_20260926/README.md`. |
| G1 v3: independent limb counter | Claude | **The agent stopped at session exit (stale).** Its work is on LOCAL branch `claude/t1-limb-counter`: `99b0c771` (the counter + its admission, committed by the agent) and `8a0332e8` (its uncommitted v3c iteration, retained as an UNVERIFIED WIP). The worktree is removed; the branch lives in the shared object store. **First task of the next session:** see below. |
| G2 library at scale (every Earth fauna + alien variants per family; derived masks) | Codex | Assigned (C35–C38). Pilot: ~20 same-family quadrupeds, plus 3–5 each for radial, serpent, insect and bird. These packets are also G1's missing references. |
| G3 on-demand art delivery | Claude | **Merged + live.** 14 core archetypes in the pack, 24 fetched from a pinned library (manifest pin in bundle and worker, per-file SHA before decode, 128 MiB LRU worker cache, offline reuse). Pack 91.3 → 60.7 MiB. `audits/G3_ART_DELIVERY_20260926/README.md`. **Not browser-smoked:** Compendium cards loading library art, and the offline card fallback. |
| G4 selection (exact species → nearest library variant → stand-in; one card/stage resolver) | Claude | Next, after G1 moves |
| G5 finisher in the game (desktop per individual; phones get delivered finished originals) | Claude routes, Codex engine | After G3 (done) and Codex's finished-original format |

**Everything else built this session is merged and on the dev site** (details in the item list below, -110…-114):
- §20 combat: Auto/Command parties for Guardians/Titans, Break UI, defeat = Recovery, friendly duels + CFB export, and the D17 phase change on EVERY Guardian/Titan fight, solo Auto included.
- 38 painted archetypes with READY spacing, box-to-box travel and motion-envelope band fit; battle2 is the development DEFAULT (`BATTLE2_DEFAULT`, `?battle2=0`).
- D13 companion care, bond and missions (placeholder `MISSION_RATES_V1`); D14 Outposts (placeholder `PROJECT_COSTS_V1`).
- D16 parity complete (Compendium chips, shelves, origin travel, reveal queue, vista + postcard, craft ×5, pin, salvage-all, Prime travel, reset, pop-ups, tooltips, D18 fold option).
- A5 outcome tests.
- Audio Stages 0–3 (original seeded sources, loudness gate, one voice per creature, soundscape).
- `?deviceProbe=1` (codec/perf/heat/memory), `?audioReview=1` (L1 Listening), and A6 localization (Settings).

**Parked by D23 until G1 passes:** audio Stage 4 (Tame/Feed/Compendium on the new voices, star hums, captions), the mission-return voice, the Kindred mission-type picker, the S4 re-tune (Codex: feasibility map first, C37), the placeholder numbers, the pack diet and I5.

**Next, in order (Claude)**
1. **Finish G1 v3 from branch `claude/t1-limb-counter`** (the agent went stale at session exit):
   - Review `99b0c771` and the WIP `8a0332e8` with `git show`, then re-run its harness to get real numbers. Don't trust the WIP's untested summary.
   - Continue in a fresh worktree cut from that branch, or check the files out onto a new branch at the lane head.
   - Targets: erase/dup refusals ≥ 90% with no loss in wrong-family/flip refusals; admitted + static above 12/40.
   - Merge (`--no-ff`, signed) only when the full gate stays I5-only. Remove any worktree the moment it merges.
2. **Merge Codex's G2 pilot packets** as they arrive, and re-score G1 on them; they are the missing same-family references. Push G1 toward ≥ 30/40.
3. **G4 selection,** then **G5 finisher routing.**
4. **Browser-smoke G3's card path:** Compendium library art, and the offline fallback.
5. **After G1 passes:** the parked items above. Polish and QA come after Nick's playtest (D21).

**Nick (none blocking):** the playtest checklist (`?deviceProbe=1`, `?audioReview=1`, a full journey, `?battle2=1&vs=…` pairs), then paste the Copy results. Also whether `openai/parked-gameplay-20260904` may be deleted (Codex answers C39 first).

**Traps (obey them)**
- **Disk-space law:** `df -h /System/Volumes/Data` at batch start and end; stay ≥ 40 GiB free. At most 4 live agent worktrees. Remove each one as soon as it merges with `--force --force` (they are LOCKED; a single `--force` silently fails). Never park large stashes. Keep only the newest 2 preview packages.
- **Agent worktrees are cut from `develop` and pre-populated.** Switch to a branch at the lane head first, and give `port/v2/node_modules` a copy-on-write copy (`cp -cR`), never a symlink.
- **Merges:** after resolving, run `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing. Committed conflict markers happened once (859b9bfe, fixed forward in e85318b3). Never `git add -A` straight after a conflicted merge.
- **Slice-executing tests** (A5, D16, arc6, Command, missions, Outposts) run exact `main.ts` regions inside `with(env)`. New code inside a slice needs its real function added to that test's env, or the slice must end at its own block.
- **`tools/run-unit-tests.mjs` builds the PWA pack first.** Over 128 MiB, every test dies with `RangeError`. For quick diagnostics, run `node node_modules/vitest/vitest.mjs run <file>` directly.
- **Codex's sealed inventories** (release/Guide bullets, budgets, pins) are never rebound by Claude. Propose bullets in an audit README; Codex re-measures.
- **Rig loads now take seconds** (layered reach, cached by complete input). Tests that load rigs need explicit timeouts.
- **The lone agent-harness checkout** at `/Users/nick/Projects/Celestial-Frontier` is Nick's original clone (`develop`). Don't edit it.

## Current sprint handoff — Generated Creature Pipeline, 2026-09-26

Codex/macOS: /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac → origin/openai/mac.
HTTPS origin; repository keychain signing, every commit G. Claude's worktree is read-only.
D22/D23 and the pipeline PROGRAM.md are current. Mac-only development: never push, merge from
or recreate either retired Windows branch. Read both lane mailboxes at start/end; no Nick relay.

Disk law: check df at every batch boundary, cleanup below60GiB, stop/clean below40GiB.
This batch185GiB before →205GiB after two completed I5 worktrees and38 stale preview packages
removed; newest2 retained and git status unchanged. No own stashes/temp worktrees remain.
Finisher model cache and named recovery/evidence retained. See audits/G_PIPELINE_CODEX_20260926.

Completed C34 copy checkpoint: signed Claude bba9215e merged no-ff (inherited main.ts
changes announced),119 release bullets,41 topics,5 briefings;7ea28e02/C17/D19 retained.
Full develop profile504 tool passes,5,562 unit passes, standingI5 only; all seven manual
owners PASS;81 focused copy tests and native phone/desktop Guide briefings PASS. Root validate PASS.
Own-branch push is explicitly authorized, each measured pack below2GB. No PR/label,
hosted attempt, develop/main merge, release or deploy. Budget UNFROZEN; no hosted authority.

Next order:
1. Sign/push completed copy checkpoint, then G2.
2. G2: ~20 Earth quadruped generated masters from the compiled controlled-layout prompt,
   with exact prompts and visible-anatomy verifier counts. NO new hand authoring. One sheet.
3. Derived six marking masks, unchanged conservation gate.
4. Review Claude G1 auto-author contract against unchanged intake and38 reference packets;
   report field/invariant failures without silent repair.
5. G5 phone-deliverable finished original engine after G3; desktop per individual.
6. Only after G1 PASS: S4 training-only feasibility map, then the ONE authorized fresh epoch
   (declare new untouched corpus before tuning) or one recommended target decision for Nick.
Hand paintings, missions/Outposts numbers, pack diet and I5 are parked until G1 passes.

S4 candidates03/13 remain rejected; prior runtime restored exactly. Old held-out corpora are
consumed and never reused. S4 refusal packet: audits/S4_PRODUCTION_EPOCH_20260926/README.md.
Claude builds G1/G3; Codex supplies G2/masks/G5 and reviews the interface. Shared signed commits
are immediately available; Nick need not open another app. Prior remote openai/mac6cbeefe0;
no GitHub write yet in this batch. Pre-existing .DS_Store stays untouched.

Remote cleanup complete: only openai/mac, anthropic/mac, develop and main remain. Retired
parked OpenAI tip retained by local archive tag. Free219GiB at copy checkpoint.
G1 contract review delivered (G1_REVIEW.md):12/40 red, all-visible presence lacks independent
counts. Claude G3 has since landed; merge its signed result after this checkpoint for G5.

## Preserved unfinished gameplay — keep visible across handoffs

Signed parked WIP cf1b9a78 is preserved by local tag archive/openai-parked-gameplay-20260904
and the verified191KiB recovery bundle in audits/G_PIPELINE_CODEX_20260926. Remote branch
was deleted at Nick's request; commits were NOT discarded. Batch4 recovered primary gameplay
owners individually. Forge Training remains parked; assess old living-preview behavior against
the current generated-art pipeline before marking it superseded. Weekly lifecycle is now live.
See RECOVERY.md and BATCH4_OVERNIGHT_REPORT_20260905.md for exact disposition; no wholesale
WIP merge. This is an outstanding-work pointer, not a change to G1/G2 priority.
