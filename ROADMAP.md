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

## ▶▶▶ SESSION HANDOFF — 2026-09-05 UTC · REVIEW BATCHES 1–3 INTEGRATED ON A BOUNDED REVIEW BRANCH · ONE AGENT-LANE ATTEMPT PENDING ◀◀◀

### Exact boundary

- **Anthropic/Claude Code on Windows:** `C:\Projects\celestial-frontier-anthropic-windows`,
  temporarily on **anthropic/review-batches-1-3-20260905** (a bounded review branch admitted by
  the policy decision below), created from `develop` **f03761da399e97761e1d5a17a5622b1eeba27944**
  (merge of PR #38) and merging Codex's PR #37 head **121df53d0d101822f32f2ca98a878db10518e65d**
  with a real merge commit. Codex's three signed commits (`e0acfab…`, `13d24af…`, `8bf9c45…`) and
  its reconcile merge are ancestors, unchanged. The worktree returns to `anthropic/windows` after
  the merge. `openai/mac` (audiovisual campaign) and the parked backup are untouched.
- Nick's authority: "authorize per Codex" (2026-09-05), following "do everything for me"
  (2026-09-04). It covered the review-branch policy decision, PR #38, marking PR #37 ready, and
  one hosted attempt plus merge for the reconciled candidate. Budget **UNFROZEN**, visibility
  **PUBLIC**, private fallback **3,000**.
- Repository labels: `actions-budget-approved` (agent lane on `develop`; full chain on `main`) and
  `actions-full-chain-approved` (full chain on `develop`).

### Hosted records this session

- **PR #36** (`anthropic/windows` → `develop`, two-lane battery): run **33935183563** SUCCESS,
  **12m47s**, lane `agent`; merged as `0cad14dea80b4f2d5052210fa19d583bd0ada085`.
- **PR #38** (`anthropic/windows` → `develop`, review-branch admission + PR #36 handoff): run
  **33938776553** SUCCESS, **12m48s**, lane `agent`, policy 81 controls; merged as
  `f03761da399e97761e1d5a17a5622b1eeba27944`. Both PRs edit the workflow itself, so every
  changed-input control ran; a v2-app-only PR is expected near 7–8 minutes (**not measured**).
- **PR #37** (`openai/review-batches-1-3-20260904`, head `121df53d…`): opened by Codex as a draft,
  correctly flagged as blocked by the sealed branch-flow validator; marked ready by Claude, then
  **CONFLICTING** after PR #38 moved `develop` (documentation files only). Superseded by the review
  branch above; closed with a pointer once the review PR is open. No label was applied to it.

### What this review branch carries (Codex's Batches 1–3, per its handoff)

- Queued save admission and semantic panel focus, portable npm invocation, the shared targeted
  Glass verdict verification, explicit distributable/evidence-build isolation, finite audio voice
  cleanup, and the corresponding reference/dependency corrections. No Batch 4 gameplay, no
  checkpoint, no parked WIP, no audiovisual assets.
- `test.yml`: `develop`'s lane selector, two-label owner guard, review-branch admission, agent/full
  canary condition and all five `if: steps.lane.outputs.lane == 'full'` guards, with the two
  phone-verdict bodies calling Codex's existing source-bound Node verifier instead of the
  duplicated jq filter. Policy code and the lane selector's sealed bytes are unchanged from
  `develop`. Tests compose the lane pins with the retained Node-verifier/corruption coverage.
- Merge resolution: `GITHUB_ACTIONS_BUDGET.md` keeps both sides' entries newest-first (Codex's
  merged-source note relabelled as preserved); this file is rewritten as one handoff; the archive
  keeps every prior block (both superseded handoffs archived verbatim above Codex's parent-handoff
  entry; the duplicate local-only copy is referenced, not repeated).

### Verification and the pending boundary

- Local on the merged tree (Windows, browser-free): recorded at the Git handoff — policy selftest,
  Compendium preflight selftest, the three workflow-pinning test files, YAML parse.
- Hosted: the review PR runs the bounded agent lane under one authorized `actions-budget-approved`;
  merge on terminal green under the standing authority. The two phone rows and the static profile
  are the hosted evidence for this head; no full chain is implied. Native iPhone/save/listening
  acceptance, production SceneMemory activation and the HUMAN gates remain open.

### Paired handoff

- **Anthropic/Claude Code:** after the review PR merges, fast-forward `anthropic/windows` to
  `develop`, record the run in this handoff and the budget log, push the handoff, close PR #37.
  Next candidates per the full review: artlock CI ownership; the eleven-artifact verbatim-seal gap.
- **OpenAI/Codex:** the Mac checkout returns to `openai/mac` for the audiovisual pilot (Batch A);
  after the review PR merges, `openai/mac` synchronizes from a clean worktree by merging
  `origin/develop` through the shared protocol. Batch 4 still awaits Nick's real save export and
  its own PR from a bounded `openai/review-*` branch. Do not edit `.github/workflows` or the budget
  policy in the campaign.
- **GitHub / Release:** `main`, the v1.8.9 live site, protected portraits and deployment are
  unchanged. No version bump.
