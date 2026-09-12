# Codex handoff — resume from the review packet, not from the pause checkpoint

Prepared 2026-09-11 by Claude for Nick to hand to OpenAI/Codex. Copy-ready.

## Read first, in this order

1. `ART_KIT.md` at the repository root: Nick's Art Kit version 3, the canonical art direction. Never reword its fenced sections.
2. `audits/CLAUDE_FULL_REVIEW_20260910/README.md`: executive summary.
3. `audits/CLAUDE_FULL_REVIEW_20260910/ART_KIT_INTEGRATION.md`: how the kit maps onto the codebase, ten reconciliations, program version 3.
4. `audits/CLAUDE_FULL_REVIEW_20260910/FULL_REVIEW.md`: Parts A to K; Part K is the defect register (47 confirmed, 4 plausible) and the optimization register.
5. Then the usual: ROADMAP, PROCESS_LAWS, PARALLEL_GIT_PROTOCOL, UI_TOOLCHAIN startup.

## Where things stand

- `openai/mac` signed HEAD f6eed9b4 plus an uncommitted, unverified working copy (the block32 OPFS variant storage, Prepare/Verify/Stop controls, first-step diagnostic, ten untracked files). `origin/develop` is unchanged at c1791e21. PR42 remains parked Draft.
- The paused checkpoint's restart sequence (integrated checks, new pack, `--landfall --variant` native run) continues the variant-storage path. Do not resume it. The review recommends replacing that layer with in-worker expansion (FULL_REVIEW Part C1), and no native run should be spent on it.
- Direction lock: the art direction is unchanged. The kit is the direction. Every task below serves it.

## First actions

1. **Commit the dirty working copy as a checkpoint** so nothing is lost, with the ten untracked files included (FULL_REVIEW Part F, `browser-variant-plan.json` and siblings). Sign as configured. Do not run the integrated chain or any native inference to do this.
2. **Store the kit.** Nick's `ART_KIT.md` must exist verbatim on `openai/mac` too (SHA-256 `2266febc5937b447572358cee6bde66b4a710a87cff1a841e2aabe0c989204a3`, 35,728 bytes). Obtain it from Nick or from `anthropic/mac` after an authorized fetch; never copy between worktrees by hand.
3. **Update the references** in the same batch: `ART_DIRECTION.md` gains a short pointer stating that `ART_KIT.md` is the canonical style statement and that the descriptive direction text remains; `LOCAL_AI_GENERATION.md` records that the compiled prompt will be rebuilt in the kit's order; `ROADMAP.md` handoff replaces the checkpoint restart sequence with program version 3.

## Program version 3 (do in order; each step ends with Nick looking at the picture)

1. **Adopt the kit.** Prepare the three decisions for Nick (Earth profile line, missing star-table rows for NS, BH, MAG, protostar and trinary plus the M/K/G/A/B mapping, companion clause). Paint `frontier-sheet-01.png` and `frontier-plate-01.png` with the kit's own prompts; calibrate eleven images from one system card; freeze; record SHA-256 values.
2. **Local model on the kit.** Rebuild `landfall-conditioning.ts` to assemble prompts in the kit's order from game data (one interpreter). Repaint the six Earth references as kit-compliant cut-outs on the magenta key and the Earth biome plate as the scene anchor. Unfreeze `steps`, `seed` and size (`local-ai-game.ts:211`, `landfall-fidelity.ts:124`, `stage-worker.mjs:22`). Implement per-organism passes composited on the plate and one low-strength finisher pass in `stage-worker.mjs`. One measured run; judge at native size against plate-01 with bounding boxes per organism.
3. **iPhone probe.** One run on Nick's target iPhone reporting `maxBufferSize`, `shader-f16`, storage quota and memory at transformer load. This gates all delivery work.
4. **Defect register.** Fix Part K items 1 to 10, 19 to 24, 33 to 35 first (integration, shell UI, locks, untracked files). Add one page-level test that loads the real Notifications wiring, and computed-style tests for the sheet cascade. Every fix gets a negative control.
5. **Artwork durability.** `navigator.storage.persist()` and status, add-to-home-screen prompt on iOS, PNG export through the share sheet, protected originals in any eviction, labelled regeneration on loss.
6. **Prune and split.** Exclude `assets/pilot/**` and all WAV from the PWA inventory; delete `scene-image-cache-plan.ts`, the `civet-rig.ts` deformer, the livingvista quartet, the `run-offline-runtime.mjs` CLI and the stale pilot review; move query-lane sentences out of `V2_DRAFT_RELEASE`; correct the ten stale doc claims in Part G; move bulky evidence out of git history. Split PR42 into production UI, gated AI and research tools.
7. **Tier 1 finisher on the real phone**, then tier policy, quality setting, crossfade, precomputed text embeddings, warm sessions, start on orbit arrival.
8. **Library rollout by class**, Compendium through the finisher, battle staging, living-plate effects, one human listening session.
9. **View-envelope sharing.**

## Do not

- Do not resume the checkpoint's `--landfall --variant` native run or build a new pack for the variant layer.
- Do not run prompt sweeps on the six-reference scene generator.
- Do not add storage or delivery engineering before the iPhone probe result.
- Do not reword any fenced section of `ART_KIT.md`; a change is a new kit version.
- Do not take the checkout lock inside unit tests.
- Do not push, label, dispatch, merge, release or deploy without Nick's exact authorization for that GitHub write.

## Paired Git handoff

- **Claude (`anthropic/mac`):** docs-only commits ahead of `origin/anthropic/mac` containing `ART_KIT.md` and the review packet. No push has been authorized. No hosted workflow triggers on a push to an agent branch (all workflows are `workflow_dispatch` or labeled-PR only), so an authorized push costs zero Actions minutes; it remains a GitHub write that Nick must authorize explicitly.
- **Codex (`openai/mac`):** commit the dirty checkpoint, store the kit, update the three references, then begin program step 1. GitHub step now: none. PR42 stays parked; refresh its title and body only when the split is ready.
- **Nick:** to let Codex read the packet, either authorize one push of `anthropic/mac` (Codex then fetches `origin/anthropic/mac` read-only and copies nothing) or supply `ART_KIT.md` and the four packet files directly. Nick needs to open the Codex app to begin; Claude does not need to be opened until step 2's painting is ready for review.
- **Future PR when the docs should reach `develop`:** base `develop`, source `anthropic/mac`, title `docs: store Art Kit v3 and Claude complete review of openai/mac f6eed9b4`, description: "Adds ART_KIT.md verbatim (SHA-256 2266febc…) as the canonical art direction and the read-only review packet with defect and optimization registers, kit integration notes and program version 3. No source, save, or generation change. No release."
