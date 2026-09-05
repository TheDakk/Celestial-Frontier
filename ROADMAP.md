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

## ▶▶▶ SESSION HANDOFF — 2026-09-04 UTC · TWO-LANE BATTERY BUILT ON ANTHROPIC/WINDOWS · LOCAL ONLY · NO HOSTED AUTHORITY ◀◀◀

### Exact boundary

- **Anthropic/Claude Code on Windows:** `C:\Projects\celestial-frontier-anthropic-windows`,
  branch **anthropic/windows**, based on landed `develop`
  **7bf3e84761da2d1abe21dc6fe751b4bad2308f3b** (fast-forwarded; a local duplicate review
  commit was dropped before this work). `origin/anthropic/windows` is older and unchanged.
- Nick selected the coverage policy recorded in Codex's Batches 1–3 handoff: the browser-free
  `develop` profile plus the two phone Glass canaries on every agent → `develop` PR; the full
  Compendium → Slice → twelve-row Glass chain on `develop` → `main` and under a separate
  on-demand label. Claude owns CI/budget policy; Codex's audiovisual campaign edits neither.
- Parked backup `openai/parked-gameplay-20260904` (tip `cf1b9a78…`) is on origin. Codex's
  prepared Batches 1–3 candidate (`openai/review-batches-1-3-20260904`, head `8bf9c45d…`) is
  local on the Mac; its Batch 1 also rewrites `.github/workflows/test.yml` (workflow jq verdicts
  → shared Node verifier, −344 lines) and `GITHUB_ACTIONS_BUDGET.md`. Whichever lands second
  reconciles through Git and produces fresh exact-source evidence; no worktree copying.
- Budget mode **UNFROZEN**, visibility last verified **PUBLIC**, private fallback **3,000**.
  Zero hosted attempts, labels, pushes, merges or releases are authorized by this batch.

### What this batch changed

- `.github/workflows/test.yml`: the authorize guard admits `actions-budget-approved` or
  `actions-full-chain-approved` (owner only; trigger still `pull_request: [labeled]`); a new
  `select battery lane` step maps the exact label/base pair to `lane=agent|full` before any
  install and stops the job on any other pair; the two-row Glass canary step runs on every
  agent-lane PR (full lane: when Glass inputs changed, as before); the Edge install, Compendium
  live preflight, Compendium certification, Slice and twelve-row Glass carry exactly
  `if: steps.lane.outputs.lane == 'full'`. Caps (2 + 120, 55-minute Compendium step, 7-minute
  canary step), one attempt/no retry, artifact upload, the required `battery` context and the
  historical jq verdict blocks are unchanged.
- `tools/actions-budget-policy.js`: two-label owner guard; seals the lane selector's non-comment
  bytes and the full-lane guards on Compendium certification, Slice and Glass; **13** new
  negative controls (**79** total).
- `port/v2/tools/compendiummem-browser-preflight.mjs`: the workflow contract requires the exact
  full-lane guard on its three owned steps (previously any condition was forbidden); its selftest
  adds unguarded and foreign-guard controls beside the retained `if: false`/soft-fail controls.
- `port/v2/tests/scenemem-workflow.test.ts` (authorize tokens, exact canary condition) and
  `port/v2/tests/evidence-chain-tools.test.ts` (Slice/Glass guard, lane-selector contract, five
  guarded stages, mutation controls). `tracked-input-preflight.test.ts` needed no change.
- References refreshed in place: `GITHUB_ACTIONS_BUDGET.md` (top entry + fail-closed section),
  `PARALLEL_GIT_PROTOCOL.md`, `CLAUDE.md`, `AGENTS.md`, `port/v2/README.md` overlay, this handoff.
  No new instrument, schema, verifier, job, shard, pin, timeout or baseline was added.

### Local evidence (Windows, browser-free)

- `node tools/actions-budget-policy.js --selftest`: **PASS, 79 fail-closed controls**; plain
  policy validation PASS.
- `node tools/compendiummem-browser-preflight.mjs --selftest`: **PASS**.
- Vitest `scenemem-workflow`, `evidence-chain-tools`, `tracked-input-preflight`: **28 passed /
  1 failed**; the failure is the pre-existing Windows-only `spawnSync jq ENOENT` replay case.
- The edited workflow parses as valid YAML; every per-step condition was read back from the parse.
- Consolidated `check-profile --profile=develop` on this Windows checkout after a fresh lockfile
  install: **268 files, 2,774 passed / 8 failed / 5 skipped**, profile red on Windows. The same
  nine files run targeted give identical results on the untouched base `7bf3e84` in a throwaway
  worktree (jq ENOENT, two path-separator cases, one `spawnSync npm.cmd EINVAL` load failure),
  and the five extra full-profile failures (`arc4-capture-card`, the Slice selftest deadline,
  `rarity-main-wiring`, `training-restore`, `speciesart` cache trim) pass targeted on this branch:
  Windows load/deadline artifacts, none touching lane-owned files. Ubuntu remains the authority.
- Not run: any browser chain or hosted run. The agent lane's hosted duration is **not measured**
  until its first authorized run.

### Paired handoff

- **Anthropic/Claude Code:** this batch is committed locally on `anthropic/windows` (exact SHA in
  the Git handoff; not pushed). On Nick's word, push the branch and open the PR. Base **develop**
  (`7bf3e84…`), source **anthropic/windows**. Copy-ready title:
  `ci(battery): add bounded agent lane and on-demand full-chain label`. Description: “Adds a
  fail-closed lane selector to test-battery: `actions-budget-approved` runs the bounded agent lane
  on develop (browser-free develop profile, changed-input controls, two phone Glass canaries on
  every agent PR) and the full chain on main; `actions-full-chain-approved` runs the full chain on
  develop. Edge install, Compendium preflight/certification, Slice and Glass carry one shared
  full-lane guard sealed by the Actions policy (79 controls), the Compendium preflight contract and
  the workflow tests. Caps, one-attempt/no-retry, artifact upload and the required battery context
  are unchanged. Docs refreshed. Local: policy and preflight selftests PASS; pinning tests pass
  except the Windows-only jq replay. No hosted result is claimed.” The PR's own first run under
  `actions-budget-approved` exercises and measures the agent lane.
- **GitHub (Nick):** the repository label **`actions-full-chain-approved`** must exist before it
  can be applied (create it once in the repository's Labels page; `actions-budget-approved`
  already exists). Branch protection needs no change: both lanes emit `battery`.
- **OpenAI/Codex:** continue Batch A locally; do not edit `.github/workflows` or the budget
  policy. Recommended order: this lane lands first (small, static, its own agent-lane run), then
  the Batches 1–3 PR goes through the agent lane; Batch 1's jq → Node verifier rewrite then
  reconciles onto the lane through Git with fresh exact-source evidence.
- **Release:** `develop`, `main` and the live site are unchanged.
