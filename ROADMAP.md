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

## ▶▶▶ SESSION HANDOFF — 2026-09-05 UTC · TWO-LANE BATTERY MERGED INTO DEVELOP (PR #36 · AGENT LANE 12m47s) · NO HOSTED AUTHORITY REMAINS ◀◀◀

### Exact boundary

- **Anthropic/Claude Code on Windows:** `C:\Projects\celestial-frontier-anthropic-windows`,
  branch **anthropic/windows**, fast-forwarded to `develop`
  **0cad14dea80b4f2d5052210fa19d583bd0ada085** (merge of PR #36, head `15ae4372a6ee`) plus this
  handoff commit; its exact SHA is stated at the Git handoff, and `origin/anthropic/windows`
  carries it after the authorized push.
- Nick explicitly authorized, in order: refreshing the GitHub CLI login on this PC, creating the
  `actions-full-chain-approved` label, pushing `anthropic/windows`, opening PR #36, one hosted
  attempt under `actions-budget-approved`, and the merge on terminal green (standing green-PR
  authority). All are done. The approval label was removed after the run.
- Budget mode **UNFROZEN**, visibility **PUBLIC**, private fallback **3,000**. **Zero** further
  hosted attempts, labels, merges or releases are authorized by this handoff.
- Repository labels now: `actions-budget-approved` (bounded agent lane on `develop`; full chain
  on `main`) and `actions-full-chain-approved` (full chain on `develop`). Both are owner-only
  triggers of the unchanged `pull_request: [labeled]` workflow.

### Hosted record — PR #36 (`anthropic/windows` → `develop`)

- `test-battery` run **33935183563**, attempt 1; authorize job 101221616380 (2s); battery job
  **101221627059**: **SUCCESS**, wall **12m47s**, job **12m40s**. Head `15ae4372a6ee`, base
  `7bf3e84`. Lane selected: `agent (actions-budget-approved -> develop)`.
- Scope: 12 changed paths; legacy, art-instrument, compendium-instrument, browser-transport and
  glass-preflight all `true`, because the PR edits the workflow itself. Every changed-input
  control therefore ran: this is an **upper bound** for the agent lane, not its typical cost.
- Steps: policy selftest PASS (79 controls) · legacy browser-free gates 1m38s · v2 `develop`
  profile **PASS, 268 test files**, 2m28s · changed-art mutation control 1m54s · Chrome launcher
  selftest 0m29s · Glass `small-phone` then `large-phone` canaries **PASS**, 4m03s · root layout
  (10 viewports) 1m27s + freshness verify · Compendium instrument selftests 0m10s ·
  `battery-evidence` archived. Skipped by the full-lane guard: Edge install, Compendium
  preflight/certification/verify, Slice, 12-viewport Glass, Glass diagnostic, Recovery, preview.
- A v2-app-only agent PR additionally skips the legacy gates, root layout and the changed-art
  control (about 5 minutes here), so roughly **7–8 minutes** is the expected agent-lane cost;
  that figure is **not measured** yet.
- The exact record is also posted as a comment on PR #36. The retained `battery-evidence`
  artifact holds the two canary reports.

### Now in `develop`

- The two-lane battery and its sealed policy (79 controls), the Compendium preflight contract
  requiring the exact full-lane guard, the pinning tests, and the refreshed references
  (`GITHUB_ACTIONS_BUDGET.md`, `PARALLEL_GIT_PROTOCOL.md`, `CLAUDE.md`, `AGENTS.md`,
  `port/v2/README.md`).
- **Conflict ahead, by design:** Codex's parked Batch 1 (`e0acfab…`, on
  `openai/parked-gameplay-20260904`) rewrites the same `.github/workflows/test.yml` (workflow jq
  verdicts → shared Node verifier, −344 lines) and `GITHUB_ACTIONS_BUDGET.md`. The prepared
  Batches 1–3 candidate must merge `origin/develop` (`0cad14d`) into its branch (a merge commit,
  never a rebase of the signed commits), resolve `test.yml` by keeping the lane selector, the
  two-label authorize guard and the five `steps.lane.outputs.lane == 'full'` guards while
  replacing the jq verdict blocks with the Node verifier, refresh the policy seal only if the
  lane step's non-comment bytes change (they should not), re-run the exact-source `develop`
  profile, then open its PR and request `actions-budget-approved` — the agent lane, about
  thirteen minutes.

### Paired handoff

- **Anthropic/Claude Code:** nothing pending on GitHub. This handoff commit is pushed to
  `origin/anthropic/windows` (no workflow trigger). Next Claude batches, per the full review:
  artlock CI ownership and the eleven-artifact verbatim-seal gap, or reconcile support for Codex
  on request. Any new head still needs Nick's separate exact hosted authorization.
- **OpenAI/Codex:** continue Batch A locally; reconcile the Batches 1–3 candidate as described
  above before requesting its PR; do not touch `.github/workflows` or the budget policy beyond
  that reconcile. Batch 4 still waits for Nick's real save export and its own PR.
- **GitHub:** no PR is open from Claude. `develop` = `0cad14d`; `main` and the live site are
  unchanged.
- **Release:** unchanged. No version bump, deployment or `main` merge.
