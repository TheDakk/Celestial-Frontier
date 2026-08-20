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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 STATIC-SERVER SHUTDOWN RECALIBRATION ◀◀◀

### Fresh-session start

- Read `GITHUB_ACTIONS_BUDGET.md`, this handoff, `PROCESS_LAWS.md`,
  `PARALLEL_GIT_PROTOCOL.md`, and the owning agent instructions. Either OpenAI/Codex or
  Anthropic/Claude can resume from repository state; use only that agent's owned worktree.
- Implementation commit `aecf3865095176a509a4cb892e5842b584780870` is on `openai/mac`;
  `origin/openai/mac` remains `731b2e2ab974252b410ba97dbdbe3ec6d3ee9c20`, so the branch was
  ahead 2 before this documentation batch. Recheck local status; do not poll GitHub.
- Actions remain **`FROZEN`**. The repository is public and standard hosted runners are free while
  it remains public, but Nick's efficiency/intent gate still forbids push, label, dispatch, rerun,
  merge, sync, or publication. The 3,000 cap applies fail-closed if visibility/billing changes.

### Preserved hosted evidence

- PR #32 remains open from `openai/mac` into `develop`
  `38447019517147319bd08c598202d097ee866874`; do not update or merge it while frozen.
- Run `32420327368`, attempt 1, remains one no-retry incomplete-evidence red. Root/static/Chrome
  Smoke/Chrome Glass passed. Compendium job `96590728191` hit its 40-minute ceiling with its report
  RUNNING/lifecycle-pending, six diagnostic PNGs, and zero terminal profiles/outcomes or product
  verdict. Its spending annotation is historical and does not override current public billing.

### Bounded shutdown and fail-closed ruler

- Commit `aecf386…` gives the Compendium HTTP server one immutable monotonic 2,000 ms close
  deadline. Just-before succeeds. Exact, late, missing, or error callbacks force
  `closeAllConnections()` exactly once and reject; settle-before-force plus stale/reentrant guards
  prevent later timer/callback delivery from changing the result.
- Static-server cleanup remains terminal lifecycle ownership. A cleanup red suppresses PASS,
  discards candidate/baseline samples, publishes truthful instrument evidence, and releases the
  workspace lock; it is never product or numeric evidence.
- Frozen SHA-256 authorities: collector `0c7ec3ba5b41f7ee0766c6986a27e75b3c22c00009419fbf540d4de280d6315b`;
  selftest `0bbb35417182ddfd5465206c2dd5f9f75537c67fec3053e8d8e79935db32b15b`;
  measurement `23aacc2cda6b46ae022c7cfaac70929fb2cd1f310fa846208bd5b2486c2c5b92`;
  budget `c711c8a56072e5a18e60eb2219e7933196a603f8873b9659bef2d4ed186171e0`;
  focused test `2f3f8dcee6ffdd7e201cf2a51265b26c30ec23834f51418f5ae6b1539794143c`.
  Producer `d32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900`
  and exact Arc-local Edge `.86` authority are unchanged.
- Candidate24/25/26 plus baseline10 are truthful history for the prior collector/measurement only.
  Current state is `calibration-required`: samples empty, ceilings null, paired baseline
  `measurement-required` with null collector commit and empty samples. Certification refuses
  before browser launch.

### Next bounded sequence

1. Finish/review this synchronized documentation batch locally; no browser or hosted run.
2. From one later clean committed source and one fresh exact Edge `.86` materialization per launch,
   run serial local IDs `c27`, `baseline11`, `c28`, `c29`, each once with zero retries. First red,
   authority mismatch, cleanup failure, or ambiguity stops.
3. Only after all four capsules audit cleanly may a separate activation embed them, restore strict
   ceilings above candidate maxima, preserve all baseline faults, and run focused controls.
4. After activation, one exact-head local battery and one explicitly authorized hosted attempt
   remain. Fresh phone/desktop list/detail/focus images still need HUMAN review. Arc 1B follows
   terminal-green PR #32; no release, deployment, version bump, or `main` work is authorized.

## Parallel Git handoff — exact budget-aware fields

**Current side:** OpenAI/Codex macOS owns this local batch on `openai/mac`. Implementation
`aecf386…` is committed locally; synchronized docs remain working-copy changes. Nothing is pushed.

**GitHub step:** None. Do not push, apply `actions-budget-approved`, dispatch, rerun, merge, or
publish while `FROZEN`.

**PR details:** existing PR #32; base `develop`; source `openai/mac`; title
**Arc 1A — Bound Compendium portraits and measured resources**. Remote PR #32 contains neither
local commit; no description update is authorized yet.

**Other side:** Anthropic/Claude Code need not be opened now. It may resume only in its own
worktree after an authorized handoff; until then it does not have the local commits.

**Release status:** `develop`, `main`, and both sites are unchanged. No release, version bump,
deployment, or publication was performed or authorized.

**Actions budget:** `FROZEN`; public/standard runners free while visibility holds; 3,000 remains
the fail-closed private-repository cap. Authorized hosted runs: zero.
