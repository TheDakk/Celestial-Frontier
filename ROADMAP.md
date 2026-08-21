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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 PREVIEW BROWSER-CONTRACT REPAIR ◀◀◀

### Fresh-session start

- Read `GITHUB_ACTIONS_BUDGET.md`, this handoff, `PROCESS_LAWS.md`,
  `PARALLEL_GIT_PROTOCOL.md`, and the owning agent instructions. Either OpenAI/Codex or
  Anthropic/Claude can resume from repository state; use only that agent's owned worktree.
- Committed source head is `2721798a80b35dce957f8b79d850184fc63ad6c3` on `openai/mac`.
  `origin/openai/mac` remains `731b2e2ab974252b410ba97dbdbe3ec6d3ee9c20`; the branch is ahead 5.
  The working copy intentionally contains the scoped `port/v2/tools/devpreview.mjs` repair plus this
  documentation batch. Recheck status; do not discard or overwrite either.
- Actions remain **`FROZEN`**. The repository is public and standard hosted runners are free while
  it remains public, but Nick's efficiency/intent gate forbids push, label, dispatch, rerun, merge,
  sync, or publication. The 3,000 cap applies fail-closed if visibility/billing changes.

### Preserved active ruler and hosted history

- Active Compendium budget/test are `546d3a817073e42910b496895734ae2a01bb4c633af2780ecde1b1ef6570b292` /
  `ef06252af072d59b85351c05671b762f5d3fa259656e20bc87b22e84ba510b55` under measurement
  `23aacc2cda6b46ae022c7cfaac70929fb2cd1f310fa846208bd5b2486c2c5b92`, collector
  `0c7ec3ba5b41f7ee0766c6986a27e75b3c22c00009419fbf540d4de280d6315b`, selftest
  `0bbb35417182ddfd5465206c2dd5f9f75537c67fec3053e8d8e79935db32b15b`, and producer
  `d32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900`. Candidate c27/c28/c29
  are 78/78 with complete lifecycle; baseline11 retains four faults and 14 phone / 13 desktop
  breaches; all previous numeric ceilings remain strict.
- Existing open, non-draft PR #32 is `openai/mac` → `develop`
  `38447019517147319bd08c598202d097ee866874`. Run `32420327368` remains historical no-verdict
  evidence and is not retry authority. Do not update or merge the PR while frozen.

### Local battery stop and bounded repair

- The local battery at exact committed `2721798…` was green through persona, then stopped without
  retry at `preview:selftest`. The checker required job-level Chrome even though the intentionally
  serialized test job owns Edge and the preview-package/smoke step pins exact Chrome. This is a
  browser-provenance contract-checker red, not a preview package, browser, product, or ruler finding.
- The scoped working-copy repair makes the owning preview-smoke step's effective browser authoritative:
  exact Chrome may come from that step (overriding a job pin) or from one exact job environment.
  Missing, wrong, duplicate, previous-step-only, and command-line overrides reject. The complete
  `preview:selftest` is green after the repair; no workflow, browser choice, timeout, retry policy,
  product byte, resource ruler, publication authority, or hosted state changed.
- Earlier greens belong to committed `2721798…`, not the repaired working copy. They remain useful
  diagnostics but do not certify the next exact head.

### Next bounded sequence

1. Review and commit only the preview checker plus synchronized docs locally.
2. From that clean exact commit, run the complete required local battery once from the beginning in
   protocol order. First red, ambiguity, authority mismatch, or cleanup failure stops; no retry.
3. HUMAN review remains open for six fresh phone/desktop Compendium list/detail/focus images.
4. A hosted attempt exists only if Nick explicitly lifts `FROZEN` and authorizes that exact head.
   PR #32 must close terminal-green before Arc 1B/gameplay resumes. No release, deployment, version
   bump, or `main` work is authorized.

## Parallel Git handoff — exact budget-aware fields

**Current side:** OpenAI/Codex macOS owns `openai/mac`. Committed head is `2721798…`; the preview
checker repair and synchronized docs are working-copy changes. Nothing is pushed.

**GitHub step:** None. Do not push, apply `actions-budget-approved`, dispatch, rerun, merge, or
publish while `FROZEN`.

**PR details:** existing open, non-draft PR #32; base `develop`; source `openai/mac`; title
**Arc 1A — Bound Compendium portraits and measured resources**. Its remote head lacks all five local
commits and the current working-copy repair; no PR write is authorized.

**Other side:** Anthropic/Claude Code need not be opened now. It does not have these changes and may
synchronize only through `origin/develop` after an authorized PR merge, from its own clean branch.

**Release status:** `develop`, `main`, and both sites are unchanged. No release, version bump,
deployment, or publication was performed or authorized.

**Actions budget:** `FROZEN`; public/standard runners free while visibility holds; 3,000 remains
the fail-closed private-repository cap. Authorized hosted attempts: zero.
