# Clean promotion plan: openai/mac → develop → main

Recorded 2026-09-12 at Nick's request. Nick's goal: port only a clean version of the code from `develop` to `main` when ready. Governing rules: PARALLEL_GIT_PROTOCOL.md, GITHUB_ACTIONS_BUDGET.md (every hosted attempt needs Nick's explicit authorization), CLAUDE.md release checklist.

## Principle

History may be messy; the tree at the head must be clean. Do not cherry-pick a "clean subset" out of ~160 commits. Prune the tree on `openai/mac`, then squash-merge tiered PRs into `develop`, then promote `develop` to `main` with the full chain.

## Step 1. Pruning batch on openai/mac (before any PR is readied)

- Delete superseded code: `scene-image-cache-plan.ts` and test (no importers); `civet-rig.ts` deformer and `painted-civet-rig.test.ts`; the livingvista quartet (`earth-resident.worker/layer/protocol/load`); pilot studies and their query lanes unless Nick ships them; the Blender Civet projection builder `civet_proof.py` (retain the canid master, `audit_canid.py` and the Civet turnaround under `audits/` as engine-port assets); `run-offline-runtime.mjs` CLI; the stale `audiovisual-pilot-review.mjs`. Already removed: OPFS variant layer, six-reference scene generator.
- Pack hygiene: exclude `assets/pilot/**` and all WAV from the PWA inventory; convert any shipped audio to Opus or AAC.
- Docs: move query-lane sentences out of `V2_DRAFT_RELEASE`; correct the stale claims in FULL_REVIEW Part G; every reference doc carries a current "matches code as of" marker.
- Evidence size: `audits/` grew from 79 MB to over 700 MB. Options: (a) migrate bulky evidence (profiles, GIFs, tarballs, screenshots over ~1 MB) to Git LFS on `openai/mac` before its PR is readied; this rewrites the agent branch and requires Nick's explicit approval per protocol; (b) accept the size. Decision pending Nick.
- Remaining Part K items not yet closed, with negative controls.

## Step 2. Tiered PRs into develop, squash-merged

| Tier | Contents | Admission |
|---|---|---|
| Production UI and gameplay | responsive shell, notifications, battle staging, audio, graphics, checkpoint changes | required battery on the exact head under one authorized hosted attempt |
| Painted landfall engine | ordinary Land path: kit compiler, painter composite, warm worker, masked finisher, weather layer, originals store, viewer | same; this is production code now |
| Research tooling | local-image-generation experiments, repack tools, Blender studies, runners | tools only; no game change |

Standing merge authority applies once a PR is scoped, clean, mergeable and terminal-green.

## Step 3. develop → main

One release PR with the full chain (Compendium → Slice → Glass; plus SceneMemory and Recovery for production), version bump only on Nick's separate authorization, then `node tools/deploy.js --release X.Y.Z` for the site and `git push origin main` for the source, in that order.

## Step 4. Timing

Prune soon (it shrinks review surface). Ready the PRs only after: the Civet 2D proof, the weather ladder pick, and the phone-tier decision. Then the PR bodies are written once.

## Step 5. Claude's branch

`anthropic/mac` holds documentation-only commits; Codex holds the canonical copies of the shared files. After Codex's PRs merge, Claude fetches and merges `develop`; identical files merge cleanly, later reviews are added. No separate PR from `anthropic/mac` is needed.

## Definition of clean at main

No dead modules; no query-gated studies in the default bundle; no study assets in the pack; release notes describe only default-reachable behaviour; docs match code; tests green on the exact head; evidence does not bloat the repository.
