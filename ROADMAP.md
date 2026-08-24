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

## ▶▶▶ SESSION HANDOFF — 2026-08-23 · ARC 1 MERGED · F3 NEXT ◀◀◀

### Current integration state

- PR #33 merged normally into `develop` as
  `8998ffb77ca5b1f3123d7ea776c41db6e23bd24e` after terminal-green
  `test-battery` run `32646110946` (one attempt, no retry; battery 50m29s).
  The approval label was removed. Arc 1A's Compendium, Arc 1B's explicit scene
  ownership, and Arc 1C's normalized ship state/read-only Shipyard are integrated.
- The terminal run included SceneMemory, Compendium, Slice Smoke, Glass Matrix,
  persona synthesis, and preview packaging. It is integration evidence, not a
  production release, whole-Gate closure, true-GPU-byte measurement, or physical-device
  heat/battery evidence.
- `main`, the production site, and the parked development-preview publisher are
  unchanged. No release, deployment, version bump, publication, or save-schema change occurred.

### PR #34 Compendium ruler repair

- Runs `32665404776` and `32677088518` are consumed terminal-red, were not retried, and had their
  labels removed. The second exact Linux report proves the first repaired activation succeeded,
  then the Close/reopen activation passed a one-shot row check before a deferred
  ResizeObserver/render turn invalidated its point. A passive 20-second wait issued 112 observations
  and ended on a clipped 51 ms command with a timely root heartbeat. This is a virtual-row
  positioning race, not a memory leak or a 51 ms product SLA.
- The exact report is retained as `audits/PR34_COMPENDIUM_GHA_32677088518_FAILURE.json.gz` with
  raw/gzip SHA-256 `544015e9…` / `cc5ed778…`. The bounded local correction repositions only through
  the existing native-scroll path, consumes a double-render boundary, re-proves thumbnail
  settlement, and requires the same exact owned point before and after that boundary. It then sends
  one press/release and checks the immediate detail receipt; no click retry or timeout widening exists.
- Collector `6d681d19…` changes measurement authority to `6a961df8…`. The former active budget
  `208af955…`, its samples, baseline and local certificate are historical only. The tracked budget
  is `calibration-required`, with empty samples and no ceilings, until three fresh clean candidates,
  one paired legacy baseline and one independent exact-budget certificate are retained from the
  committed repair source. PR #34 remains Draft and unmerged; no new hosted attempt is authorized.

### Remaining Arc 1 evidence

- HUMAN review remains required for Arc 1A's six Compendium list/detail/focus images
  and Arc 1C's phone/desktop ship silhouette and caption readability.
- Real-device iOS/iPadOS/Android/desktop accessibility, heat, and battery evidence
  remain open. Arc 1 does not close Gates C, D, I, or any release gate.

### Next implementation spine

1. **F3 — persistence authority, split stores, and receipts:** revision/CAS-safe
   mutations, immutable receipts, v4→v5 migration/recovery, and the tab lease.
2. **F4 — active-play clock and SessionRNG:** replayable outcome authority and
   migration away from wall-clock accrual.
3. **Arc 2 — item instances and readable economy:** only after F3/F4 establish
   safe mutation, time, and outcome authority.

### SSH and branch discipline

- Use only the matching app/OS/root/branch row in `PARALLEL_GIT_PROTOCOL.md`;
  Codex macOS is
  `/Users/nick/Projects/celestial-frontier-openai-mac` on `openai/mac`.
  All agent roots use `git@github.com:TheDakk/Celestial-Frontier.git` and their
  local 1Password SSH Agent; no HTTPS/PAT fallback or copied private key.
- Before a machine's first GitHub write, require the exact-root/branch check,
  `ssh -T -o BatchMode=yes -o ConnectTimeout=15 git@github.com` (the expected
  authenticated no-shell exit is 1), and `git ls-remote origin HEAD`.
- The stale `backup/*` and `hotfix/v12-mobile` remote branches were pruned after
  being confirmed merged, unused, and PR-free. Do not delete active
  `openai/*`, `anthropic/*`, `develop`, or `main` branches as cleanup.

### Streamlined GitHub protocol

- `develop` requires a current, terminal-green `battery` check, normal merge
  commits, resolved review threads, and an up-to-date head. It requires neither a
  review count nor the former extra approval for unattributed changes.
- `branch-flow-guard` remains a manual diagnostic workflow, but is not a required
  merge context. Do not dispatch it to unblock a green PR.
- While `GITHUB_ACTIONS_BUDGET.md` is `UNFROZEN`, Nick authorizes one exact
  changed-head `test-battery` attempt. After that exact battery is green, the
  agent removes the label, marks a draft Ready if necessary, and merges normally
  without asking Nick for a second review/guard/merge approval. A red or incomplete
  battery remains a hard stop.
- One authorization remains intentionally explicit: a new hosted attempt for a new
  head. It controls Actions spend; it is not a second merge approval.

### Fresh-session start

1. Verify the exact app/OS/root/branch row and clean worktree; then
   `git fetch origin`.
2. Read this handoff, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`, and
   `GITHUB_ACTIONS_BUDGET.md`; inspect the F3 scope in
   `port/V2_PROGRAM_ROADMAP.md` before proposing or editing F3 work.
3. Create no new product scope before F3 is decomposed into a bounded owned batch.
   Preserve the Arc 1 proof boundaries and current HUMAN evidence list.
4. Claude/Anthropic should receive merged work only by fetching `origin` and
   merging `origin/develop` into a clean `anthropic/mac` at its next batch—no
   manual file copying. Nick does not need to open Claude now.

**Current side:** Codex macOS is on `openai/mac`; PR #34's render-stable row repair and failed-run
evidence are local, uncommitted, and not yet calibrated.
**GitHub step:** none.
**Release status:** `develop` contains Arc 1; `main` and both sites are unchanged.
**Actions budget:** `UNFROZEN`; PR #34 runs `32665404776` and `32677088518` are consumed
terminal-red and their labels were removed; no new hosted attempt is authorized by this handoff.
