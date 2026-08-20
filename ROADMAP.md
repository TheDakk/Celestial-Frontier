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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 GITHUB ACTIONS CONSERVATION FREEZE ◀◀◀

### Cold start and non-negotiable budget state

- Read `GITHUB_ACTIONS_BUDGET.md` before any GitHub operation, then this handoff,
  `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`, and the owning agent instructions.
- **Current Actions mode is `FROZEN`.** Nick confirmed the repository is public as of 2026-08-20,
  so standard GitHub-hosted runners are free while it remains public. The reported 3,000 allowance
  remains a fail-closed cap if the repository becomes private or billing is ambiguous. The freeze
  remains an efficiency/intent gate until Nick explicitly lifts it: do not push, label, dispatch,
  rerun, merge, sync, or publish. Continue development and evidence locally.
- OpenAI/Codex macOS owns
  `/Users/nick/Projects/celestial-frontier-openai-mac` on `openai/mac`. At the freeze boundary,
  local and `origin/openai/mac` were exact `731b2e2ab974252b410ba97dbdbe3ec6d3ee9c20`
  with a clean worktree. Recheck local state; avoid repeated GitHub polling.

### PR #32 evidence boundary

- PR #32 remains open from `openai/mac` into `develop`
  `38447019517147319bd08c598202d097ee866874`. Do not merge it.
- Exact head `731b2e2…` completed one full local battery in the required order. Its 111-entry
  checksum manifest is `65e75e516d5e8173c16d6c887780d331f89bf982edf371cee399b7a50778620d`.
  That local evidence remains truthful but is not hosted CI or merge authority.
- GitHub Actions run `32420327368`, attempt 1, tested the current PR head/merge. Root gates,
  v2 static, Chrome Smoke, and Chrome Glass were green. Compendium job `96590728191` was canceled
  at its 40-minute job ceiling while the report remained `running` and lifecycle-pending; the
  exact Edge authority matched, six review PNGs existed, but zero terminal profiles/outcomes or
  product verdict were published. Full-job log/report/artifact ZIP SHA-256 values are
  `b05cd9dd…` / `896f3217…` / `3c7317e0…`. The verifier correctly rejected absent cleanup/
  release authority. Persona was skipped. The summary `battery` job separately could not start
  because GitHub reported the account billing/spending limit. Preserve that exact historical
  annotation; it does not mean standard hosted runners are currently billed while the repository
  remains public.
- Preserve that as one no-retry hosted timeout/incomplete-evidence red. Do not increase a timeout,
  rerun the unchanged head, or call its six diagnostic PNGs certification. The Compendium timeout
  diagnosis remains local follow-up after this emergency budget batch.

### Local budget-protocol transition

- The completed local, unpushed batch makes ordinary pushes, PR synchronization, merges, sync,
  and publication start zero hosted runners by default after rollout. `test.yml` uses one tiny
  authorization job followed by one serial fail-fast job. Only a successful owner-label plus
  branch/fork authorization emits the required `battery` name; other events are
  `budget-not-authorized`. The dependency preserves the Arc-local Edge owner's sealed no-`if`
  workflow contract; cheap/static checks run before browsers.
- Branch-flow, agent-sync, and manual-preview workflows are manual-only with a required,
  false-default budget token. Branch direction is also the first battery step. Automatic branch
  publication is hard parked pending a separately reviewed exact-SHA promotion contract.
- `tools/actions-budget-policy.js --selftest` inventories every workflow and mutation-tests
  automatic triggers, default-run inputs, job guards, decoys, duplicate concurrency, the single
  battery runner, the parked publisher, and unknown workflows. Root validation runs the real gate.
- These protections are local until pushed. The remote still contains the old automatic triggers.
  While mode is frozen, do not push this transition. Because the repository is public, disabling
  Actions is not needed merely to protect private minutes; a later rollout still requires one
  explicit Git handoff authorization and must leave the battery label absent.

### Next bounded sequence

1. Keep the completed browser-free policy/workflow/docs batch local and unpushed while `FROZEN`.
   Its 63 negative controls, YAML parse, Compendium workflow control, root validate, paired-agent
   instruction identity, and diff checks passed without a hosted run.
2. Diagnose PR #32's preserved Compendium timeout locally; do not rerun the unchanged head.
3. Only after Nick explicitly authorizes the rollout may the guarded workflow commit reach GitHub.
   Public standard-runner billing does not lift `FROZEN`. Record exact head/base, configured maximum
   runner minutes, one run, no retry, and label removal. PR #32's Compendium timeout must be
   diagnosed/fixed locally before any new battery authorization.
4. Fresh phone/desktop list, focus-pinned, and detail images still require separate HUMAN judgment.
   Arc 1B follows PR #32 closure; no release, version bump, deployment, or `main` work is in scope.

## Parallel Git handoff — exact budget-aware fields

**Current side:** OpenAI/Codex on macOS owns the completed local GitHub Actions conservation batch
on `openai/mac`. Exact pushed head `731b2e2…` and PR #32 remain blocked. The unpushed local commit
must not reach GitHub while frozen.

**GitHub step:** None. Do not open Actions, apply `actions-budget-approved`, dispatch, rerun,
push, merge, or publish. Repository-wide Actions disablement was not performed because it is a
broad persistent settings change and needs Nick's explicit approval of that exact consequence.

**PR details:** existing PR #32; base `develop`; source `openai/mac`; title
**Arc 1A — Bound Compendium portraits and measured resources**. Do not update or merge it during
the freeze. No new PR is needed for the local guard batch yet.

**Other side:** Anthropic/Claude Code need not be opened now. It does not have this local budget
transition and must not push/sync on the assumption that it does. It may continue unrelated local
work in its own clean worktree under the same `FROZEN` law.

**Release status:** `develop`, `main`, and both sites are unchanged. No release, version bump,
deployment, site write, or publication is authorized.

**Actions budget:** `FROZEN`; repository public, so standard hosted runners are free while that
visibility holds; 3,000 remains the fail-closed private-repository cap. Authorized hosted runs: zero.
