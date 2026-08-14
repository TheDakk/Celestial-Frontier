# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.
## The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
## SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE · COMBAT_AND_CONQUEST ·
## PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS · BREEDING_AND_SHARING ·
## DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES · EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are
## the SOURCE OF TRUTH we pull from for a full-system review/edit later. RULE: whenever we change a
## system, update its doc IN THE SAME BATCH (and bump its "matches code as of" marker) — the same
## way we run validate and update this roadmap. A change isn't done until its markdown reflects it.
## Also keep celestial-frontier-codebase-reference.md (code map) in sync when functions move/appear.
## ★ PROCESS_LAWS.md (extracted from this file 2026-07-30) is the other standing reference —
## READ IT BEFORE TOUCHING UI OR TESTS. Same discipline: refreshed in place, never archived.

## 📌 PINNED — ROADMAP HYGIENE (Nick, 2026-07-21): KEEP THIS FILE LEAN. This doc holds ONLY the
## live SESSION HANDOFF (state / what's done / NEXT backlog / process). Completed batch logs and
## superseded handoff blocks live in `ROADMAP_ARCHIVE.md` (history + traceability, nothing deleted).
## RULE, run at the END OF EACH ARC (or whenever this file grows past ~400 lines): move every batch
## block older than the current one to the TOP of the archive's batch section, verbatim, then refresh
## the SESSION HANDOFF here so WHAT'S DONE / NEXT reflect reality. Rewrite the handoff in place — the
## roadmap stays a one-screen read. History is one file away, git-diffable.
## ▶▶▶ SESSION HANDOFF — 2026-08-13 · V2 FULL SWEEP COMPLETE (PLANNING ONLY); ARC 1A SCOPE AWAITING NICK'S AGREEMENT ◀◀◀

### Cold start

- This handoff was written by Anthropic/Claude Code on Windows
  (`C:\Projects\celestial-frontier-anthropic-windows`, branch `anthropic/windows`). Each
  agent works only from its own ownership row in `PARALLEL_GIT_PROTOCOL.md`.
- Integration state: PR #20 merged the stabilization repair into `develop` at
  `9aad1a423dd4ffbec35e369e4cc5386f14dce1aa`; its push battery and development publisher
  both passed, and the DEV origin serves **v2.0 development** build `develop-9aad1a423dd4`.
  `main`/production untouched. Resolve live Git/PR/check state before any Git action.
- Read next: `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` ·
  **`port/V2_FULL_SWEEP_2026-08-13.md`** (this batch's deliverable) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `celestial-frontier-codebase-reference.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.

### What this batch did (planning only — no product code changed)

A full line-by-line review of the v2 product surface: `main.ts` and the app UI/system
files, the persistence, scene, domain (17 facades + declarations), audio, and art-runtime
packages, plus instrument-quality notes on the two browser audits. Platinum-frozen species
tables, verbatim lifted bodies, and the tools battery were sampled, not re-judged. Local
gates on the merged state: v2 tests **283 passed / 1 skipped**, root+app typecheck clean.

The complete findings register (~45 findings: 3 HIGH, ~17 MED), the vision-alignment
assessment (Diablo/PoE loot · Minecraft/Satisfactory crafting · infinite exploration ·
Pokémon taming · Spore discovery · never punishing), and the proposed batch ladder live in
**`port/V2_FULL_SWEEP_2026-08-13.md`**. Highlights that shape the plan:

- **HIGH:** `recover()` overwrites the primary before classifying the backup (PER-1);
  no test proves `exportSaveV2` output passes the boot envelope check (PER-2); the epoch
  clock's `base()` doc tells the next wiring author to persist the wrong value (DOM-1).
- **The live gate bypass:** star/galaxy CF1 routes still reach reach/charter gates with
  forged coordinates — only planet routes are canonically proven (SCN-3).
- **Arc 1A's defect confirmed at source:** `speciesThumb` returns 440px art synchronously
  on miss; `fillCodex` mounts the whole list (D-COMPENDIUM-MEM), with a concrete lease-API
  and `renderPortraitCanvas`-seam design ready in the sweep doc.
- **Structural prep named before content arcs:** panel coexistence law, Guide
  capability sign-off (the `unavailable()` full-legacy cliff), lesson framework,
  `main.ts` split, persistence CAS/receipts, NavState union + ingress extension.

### Next order (proposed — implementation starts only after Nick agrees scope)

1. **F1 hardening quickies** (save-integrity + law-guard fixes from the sweep, test-first).
2. **Arc 1A — Compendium virtualization + leased 132px thumbnails** (windowed rows, lease
   API, byte-budgeted caches, Planetside migration, `compendiummem` plateau gate with
   bidirectional negative controls).
3. **Arc 1B — Pixi/canvas texture ownership + long-session memory plateau gate.**
4. **F2 NavState union + canonical ingress for star/galaxy/boot routes** (closes SCN-3);
   **F3 persistence CAS + split stores + receipt journal + tab lease**; **F4 clock +
   SessionRNG wiring** — all before any world-bound ownership/reward writer, then the
   approved contract ladder (§13 of `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`).
5. Decision points for Nick are listed at the end of the sweep doc §4: batch order,
   panel-coexistence law, Guide sign-off change, and the Arc 1A detail choices.

Boundaries unchanged: no `develop` → `main`, no release/version/deploy, no manual Pages
writes, no legacy/parity deletion without complete usage proof, draft PRs only from
`anthropic/*` / `openai/*` into `develop`.

### PR #21 battery attempt 1 — preserved red (instrument), repaired

Test-battery run `31758515194` attempt 1 (job `94639563562`) on head `0c73ed1` failed at
the root layout gate and is preserved without retry. Every prior step (preflight selftest,
validate, jsdom smoke) passed; the layout gate — the battery job's **first real browser
launch** — started the exact pinned Chrome (pid 2211, only benign D-Bus stderr) but had no
`DevToolsActivePort` at uilayout's prior 24-second startup bound. The report correctly
recorded `instrument-fail` and `--verify-run` correctly exited 2. This is the same
diagnosed Linux runner cold-start phase that earned the exact development-preview caller
its bounded 30-second allowance (PR #20), not the #200 browser-provenance class and not a
product/docs finding. Repair: the root layout caller now owns the same bounded 30-second
startup allowance (`tools/uilayout.js`), generic launcher default and command/shutdown
bounds unchanged; the four current-state references naming the preview caller as the only
30-second exception were corrected in the same batch. The new head requires its own
matching CI; attempt 1 stays red evidence.

### Battery optimization (2026-08-14, Nick-approved)

Measured on the last green develop battery: 33 minutes wall, of which glassmatrix owned
~17 min and smoke:ci ~9 min (the same commands take ~1 and ~2 min on a workstation — the
2-core software-rendering runner is the cost, not the instruments). Two changes landed:

1. **`.github/workflows/test.yml` now runs five parallel jobs** — `root-gates`,
   `v2-static`, `v2-smoke`, `v2-glass`, then `v2-persona-preview` joining their evidence —
   **plus a summary gate job named `battery`** that needs all five and fails unless every
   one succeeded. The summary gate exists because the develop/main rulesets require one
   status context named `battery` (the old serial job's name); the first parallel run was
   green in every job yet sat "Expected — waiting for status" on that orphaned required
   context until the gate restored the name. It can never satisfy the ruleset by being
   skipped (`if: always()` + explicit per-need result check). Measured first parallel run:
   **~11 min wall** (glass 9m42s · smoke 7m31s · root 3m39s · static 3m12s · persona
   1m01s), down from 33 — and root-gates CI-proved the uilayout 30-second repair. Nothing weakened: every serial command still runs exactly once
   with unchanged one-attempt/no-retry semantics; the persona join and the
   `v2-development-preview` artifact still require ALL jobs green; the branch-site
   publisher keys on the whole workflow's conclusion (unchanged trigger); each
   browser-owning job pins `CF_BROWSER` at job scope and re-proves provenance with its own
   selftests. Artifact relocation: root evidence → `root-reports` + `root-layout-evidence`;
   per-job `v2-smoke-evidence`/`v2-glass-evidence` (retained on red); `battery-reports`
   re-joined by the final job.
2. **glassmatrix now records per-viewport `viewportTimings`** (validated fail-closed: a
   certifying PASS must time all 12 rows in order; malformed rows rejected; partial
   timings stay legal on red — all four directions selftested), so the next optimization
   decision (larger runner and/or matrix sharding) is measured, not guessed.

Deliberately not done: Vite-build sharing between smoke and glass (violates the
always-rebuild freshness law), viewport/control trimming, retries, docs-only gate
skipping. A larger (4/8-core) runner remains the next lever if Nick wants sub-15-minute
batteries and accepts the per-minute cost; the glass timing data will size that decision.

3. **Agent-branch auto-sync (2026-08-14, Nick-requested):**
   `.github/workflows/sync-agent-branches.yml` fast-forwards each agent branch that is
   strictly behind `develop` on every `develop` push, so Nick no longer manually updates
   branches after a merge. Divergent branches (unmerged agent work) are skipped with a
   report line and keep the manual protocol merge; never force, never `main`. Local
   clones still `git pull` at session start — the automation moves origin branches only.

## Parallel Git handoff — exact five fields

**Current side:** Anthropic/Claude Code on Windows, branch `anthropic/windows`,
synchronized with `origin/develop` at `9aad1a4` before the batch. This PR now carries:
the sweep doc + roadmap refresh, the bounded uilayout cold-start repair, the parallel-job
battery restructure + glassmatrix per-viewport timing, and the cross-agent pickup
sections in both START_HERE docs; committed and pushed on `anthropic/windows`.

**GitHub step:** review draft PR #21 from `anthropic/windows` into `develop`. Battery
attempt 1 on `0c73ed1` is preserved red (uilayout cold start); each newer head requires
its own green battery — the newest head is also the first live run of the parallel-job
structure. Under the standing 2026-08-13 authorization it may merge normally once clean,
mergeable and terminal-green.

**PR details:**

- Base branch: `develop`
- Source branch: `anthropic/windows`
- Copy-ready title: `Record v2 full-sweep review and arc plan; refresh roadmap handoff`
- Copy-ready description: see the draft PR body (summarizes the sweep, verification run,
  cross-agent effect, and states that no release or deployment is included).

**Other side:** OpenAI/Codex (macOS `openai/mac` / Windows `openai/windows`) does not have
this docs batch until the PR merges. It may continue unrelated work but must not copy
files manually. After merge, at its next coding batch and only from a clean worktree, it
fetches `origin` and merges current `origin/develop` into its own branch.

**Release status:** `develop` remains `9aad1a4` until this PR merges; DEV origin serves
build `develop-9aad1a423dd4`. `main`, production Pages and version identity untouched.
No release or deployment performed.
