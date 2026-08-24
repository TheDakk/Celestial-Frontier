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

## ▶▶▶ SESSION HANDOFF — 2026-08-24 · FULL LOCAL CAMPAIGN · F3/F4 + ARC 2–5 + AUDIO ◀◀◀

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
- PR #34 merged normally as `7a9f4c1370dd84292388d718c38ff34214f6203b` after exact-head,
  one-attempt terminal-green battery run `32681394532` (50m10s). The repair's Compendium 78/78
  certificate/verifier, SceneMemory certificate/verifier, Slice Smoke, Glass Matrix, preview package,
  artifacts, and cleanup all passed; the approval label was removed. This is integration evidence only.

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
  `208af955…`, its samples, baseline and local certificate are historical only. Clean repair source
  `a95889d…` produced three independent 78/78 Edge `.101` candidates and the paired legacy baseline
  retained by activation commit `d21ba26…`; no numeric memory ceiling was widened and the baseline
  still breaches 14 phone / 13 desktop fields. Active budget SHA-256 is `faa160b3…`. Exact-budget
  run `20260823-pr34-render-stable-row-certification` then passed 78/78 plus named verification on
  clean `d21ba26…`; raw/gzip report hashes are `42753d5e…` / `a2ff5b00…`. The exact changed head
  then passed terminal-green hosted run `32681394532` and merged in PR #34. No new hosted attempt is
  authorized.

### Remaining Arc 1 evidence

- HUMAN review remains required for Arc 1A's six Compendium list/detail/focus images
  and Arc 1C's phone/desktop ship silhouette and caption readability.
- Real-device iOS/iPadOS/Android/desktop accessibility, heat, and battery evidence
  remain open. Arc 1 does not close Gates C, D, I, or any release gate.

### Approved full-session campaign

Nick directs one local, commit-preserving campaign with no intermediate push or hosted battery.
The final reviewed head—not each batch—will be the next GitHub milestone. The dependency/no-go laws
remain in force.

1. **Session charter and current-doc repair:** record PR #34's terminal merge and make complete,
   current PR descriptions a protocol requirement.
2. **F3 — persistence authority:** revision/CAS semantics, split stores, immutable receipts, v4→v5
   migration/recovery, and the tab lease.
3. **F4 — active-play clock and SessionRNG:** active-play time, ecology edge, Auto-Extractor
   migration, replayable outcome counters, and a complete audited call-site inventory.
4. **Arc 0 dependency closures:** finish each named truth/import/continuity seam at the point it
   blocks later work—especially `MAIN-3` before Arc 4 and `D-CFB-1` before Arc 5.
5. **Arcs 2 → 5:** item instances/readable economy, engineering opportunities, capture/ownership,
   then companions. Each writer lands only after F3/F4 authority and its own real outcome proof.
6. **Arc 7 and Arc 8 core audio:** begin after F4, build deterministic audio identity, mixer,
   lifecycle, accessibility, rights tooling, and current-system soundscape alongside the ownership
   loop. Combat/Guardian audio remains an explicit Arc 6 integration dependency; it cannot be
   certified before those systems exist.
7. **Combined HUMAN review after Arc 5:** run Arc 4.5's first-journey review, Arc 5 attachment
   review, and applicable Arc 7/8 listening/comfort review together. This moves review timing; it
   does not waive any human criterion. Arc 5.5 remains the separate combat-model HUMAN gate before
   Arc 6.

**F3 batch 1 (local, 2026-08-24):** `@cf/persistence` now has the first reusable exact-once
primitive: one checked transaction compares the observed save revision and an optional immutable
SessionRNG receipt ordinal, then commits split-store DTO writes, the receipt, and next revision
together. Two same-parent writers yield one commit plus an explicit stale/duplicate outcome; neither
retries or partially lands a losing mutation. The canonical store list now includes `receipts`, and
the IndexedDB schema target is v2 so `onupgradeneeded` can create it for existing v1 databases.
Focused memory outcomes and all three TypeScript configurations pass. This is substrate only: no live
v4 blob migration, writer, or F3 completion claim yet.

**F4 clock kernel (local, 2026-08-24):** the pure progression package now owns a persisted
`activePlayMs` clock driven only by injected monotonic time. It accrues only while the document is
visible, the app is answerable, and the F3 tab lease is owned; hidden, frozen, and losing-tab time
all remain zero. Reload, wall-clock wind, invalid/backward source, and cap controls pass. App/save
wiring still waits on the completed F3 lease and v5 migration.

**Arc 0 `D-CFB-1` kernel (local, 2026-08-24):** legacy `CFB-` remains the exact v1
challenger/exhibit contract; a versioned `CFB2-` owned-creature codec now round-trips one bounded,
ordered uint32 parent tuple while stripping XP, feeding, brood, injury, and other mutable state.
Forward/reverse parents remain distinct, malformed/future/mismatched carriers fail closed, and pure
creatures carry explicit no-lineage state. No companion/share UI is enabled yet.

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
3. Start the approved campaign with a bounded F3 persistence batch. Preserve the Arc 1 proof
   boundaries, current HUMAN evidence list, and all F3/F4 no-go rules; commit locally after each
   complete owned batch and do not push until the campaign review head is ready.
4. Claude/Anthropic should receive merged work only by fetching `origin` and
   merging `origin/develop` into a clean `anthropic/mac` at its next batch—no
   manual file copying. Nick does not need to open Claude now.

**Current side:** Codex macOS is on `openai/mac`, locally fast-forwarded to merged `develop`
`7a9f4c1…`; `origin/openai/mac` remains the contained PR #34 head until a later authorized final
push. PR #34's render-stable repair passed hosted run `32681394532` and merged normally.
**GitHub step:** none.
**Release status:** `develop` contains Arc 1; `main` and both sites are unchanged.
**Actions budget:** `UNFROZEN`; PR #34 runs `32665404776` and `32677088518` remain consumed
terminal-red, and run `32681394532` is consumed terminal-green. All labels are removed; no new
hosted attempt is authorized by this handoff.
