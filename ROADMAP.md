# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## ▶▶▶ SESSION HANDOFF — 2026-09-05 UTC · REVIEW BATCHES 1–3 MERGED (PR #39 · AGENT LANE 6m28s) · TWO-LANE BATTERY + REVIEW BRANCHES LIVE · NO HOSTED AUTHORITY REMAINS ◀◀◀

### Exact boundary

- **Anthropic/Claude Code on Windows:** `C:\Projects\celestial-frontier-anthropic-windows`,
  branch **anthropic/windows**, fast-forwarded to `develop`
  **1d719c63fbcdb6d0e6ab98a96b16e487aafe1239** (merge of PR #39) plus this handoff commit; its
  exact SHA is stated at the Git handoff and `origin/anthropic/windows` carries it after the push.
  The review branch `anthropic/review-batches-1-3-20260905` (tip `1219648…`) is merged and left
  dormant. Codex's `openai/review-batches-1-3-20260904` (tip `121df53…`) is untouched; PR #37 is
  closed as superseded.
- Nick's authority chain: "do everything for me" (2026-09-04) and "authorize per Codex"
  (2026-09-05). Nick refreshed the GitHub CLI login himself. Under that authority Claude created
  the `actions-full-chain-approved` label, opened and merged PRs #36, #38 and #39 through their
  own agent-lane runs, marked PR #37 ready and then closed it as superseded, and removed each
  approval label after its run. Budget **UNFROZEN**, visibility **PUBLIC**, private fallback
  **3,000**. **Zero** further hosted attempts, labels, merges or releases are authorized.

### What `develop` now contains (this session's three merges)

1. **PR #36** — two-lane `test-battery`: `actions-budget-approved` runs the bounded agent lane on
   `develop` (browser-free `develop` profile, changed-input controls, legacy root gates only when
   legacy inputs changed, small-phone then large-phone Glass canaries on every agent PR) and the
   full chain on `main`; `actions-full-chain-approved` runs the full chain on `develop`. Edge
   install, Compendium preflight/certification, Slice and Glass carry one shared guard
   `if: steps.lane.outputs.lane == 'full'`, sealed by the Actions policy, the Compendium preflight
   contract and the workflow tests.
2. **PR #38** — the sealed branch-flow validator also admits bounded review branches
   `openai/review-*` and `anthropic/review-*` into `develop` (never into `main`); policy seal
   updated, two rejection controls added (81 controls); rule recorded in
   `PARALLEL_GIT_PROTOCOL.md` and `GITHUB_ACTIONS_BUDGET.md`.
3. **PR #39** — Codex's signed Batches 1–3 (`e0acfab` → `13d24af` → `8bf9c45`, reconcile merge
   `121df53`) integrated by Claude as merge `1219648`: queued save admission repeats before
   commit, semantic panel focus, portable npm invocation, the shared targeted Glass verdict
   verifier (the workflow's two phone verdicts now call it instead of the duplicated jq filter),
   explicit distributable/evidence-build isolation (the test harness leaves the phone bundle),
   finite audio voice cleanup, and reference/dependency corrections. No Batch 4 gameplay, no
   checkpoint, no parked WIP, no audiovisual assets.

### Hosted records this session

| PR | Head | Run | Lane | Wall | Merge |
| --- | --- | --- | --- | --- | --- |
| #36 | `15ae437` | 33935183563 | agent | 12m47s | `0cad14d` |
| #38 | `365ce43` | 33938776553 | agent | 12m48s | `f03761d` |
| #39 | `1219648` | 33940061406 | agent | 6m28s | `1d719c6` |

All three passed on their first attempt; each approval label was removed afterwards and each run
record is posted on its PR. #36 and #38 edited the workflow and root tools, so every changed-input
control ran; #39 edited the workflow only, so the legacy gates and root layout were skipped. A
v2-app-only agent PR is expected near **4–5 minutes** (**not measured**).

### Verification notes

- Every merged tree was checked locally on Windows before its PR: Actions policy selftest, the
  Compendium preflight selftest, the three workflow-pinning test files and a YAML parse. With
  Codex's Node verifier in `develop`, the former Windows-only jq replay failure is gone.
- Codex's exact-source `develop` profile for the reconciled candidate is recorded on PR #37
  (274 files, 2,886 tests passed). No full browser chain or production certification is claimed;
  Gate C (real iPhone save export), production SceneMemory activation and the HUMAN gates stay open.

### Paired handoff

- **Anthropic/Claude Code:** nothing pending on GitHub. Next candidates from the full review:
  artlock CI ownership and the eleven-artifact verbatim-seal gap; reconcile support on request.
  Any new head needs Nick's separate exact hosted authorization.
- **OpenAI/Codex:** before continuing Batch A, synchronize `openai/mac` from a clean worktree by
  merging `origin/develop` (`1d719c6`) through the shared protocol; do not cherry-pick or copy.
  Batch 4 (connected research effects, Discover Life, meals, Scout XP, Chronicle & Museum) still
  waits for Nick's real save export and its own PR from a bounded `openai/review-*` branch, which
  the validator now admits. Do not edit `.github/workflows` or the budget policy in the campaign.
- **Nick:** nothing required. To run a full chain on a `develop` PR, apply
  `actions-full-chain-approved`; to run the agent lane, apply `actions-budget-approved`. Remove the
  label after each run.
- **GitHub / Release:** `main`, the v1.8.9 live site, protected portraits and deployment are
  unchanged. No version bump.
