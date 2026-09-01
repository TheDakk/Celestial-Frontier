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

## ▶▶▶ SESSION HANDOFF — 2026-09-01 · SURVEY SURFACE EXPRESSION REPAIR BROWSER-FREE GREEN ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Before the pending successor commit, the branch is two commits ahead and
  the latest signed checkpoint is **138cdee0d3840efd899b5ebdbe974fd12d87e828**.
- Commit 138cdee has tree **56d16790c414402e585b791d751fb7e173607ddf**, parent
  **6030035dff1779c3fc3be7e4f46f376ff01455e8**, and an embedded SSH `gpgsig`. It passed the
  hermetic tracked-input develop rehearsal at **258 files / 2,628 passed / 1 skipped**, all three
  TypeScript programs, **34** clean art sources, **1,014/1,014** routes and **454** non-inert
  specification fields.
- Its changed-browser-instrument CDP selftest and live Compendium preflight passed on Edge
  **152.0.4191.53** / CDP **1.3**. The browser point version remains per-run provenance and does
  not trigger a rebaseline.
- Exact-source Compendium **20260901055749358-33363-aa39fce457** passed **78/78** once/no-retry
  in **64,730 ms** with zero findings/blocked outcomes; exact named verification passed.
- Exact-source develop Slice **20260901055920314-33714-d47f27b9497a** then stopped terminal red
  once/no-retry after **14,746 ms** with exactly **1 finding / 1 scope**, `harness`, and two
  screenshots. Glass correctly did not run; 138cdee was not retried or relabelled.
- **Hosted authority:** PR #35 still has five consumed hosted terminal-red attempts against base
  **7a9f4c1370dd84292388d718c38ff34214f6203b**. All approval labels are absent. No push, label,
  hosted attempt, retry, Ready transition, merge, release, version bump, preview/publication or
  deployment is currently authorized. PR #35 remains Draft/unmerged; `develop`, `main` and the
  live site are unchanged.

### Exact 138cdee local stop and complete failure-surface diagnosis

- Slice crossed the repaired fresh-document F4 authority boundary, booted the real product,
  completed early interactions and captured `universe` plus `galaxy` screenshots. It reached
  the non-Sol Survey card. No product code threw.
- The first Charter-dependent surface probe evaluated a syntactically valid generated expression
  shaped as `({documentToken,state,action})()`. The embedded action IIFE completed, then JavaScript
  attempted to call the resulting object and threw `TypeError: {...} is not a function` before
  the Charter action click.
- The same malformed outer call existed in exactly three new fixed-point helpers—desktop,
  isolated keyboard and phone—serving eleven Survey-dependent checks. A full template/string
  inventory found no other matching shape.
- The defect was latent in 6030035 because that exact source stopped earlier on its old
  `fresh-v5` readiness oracle. The 138cdee repair correctly crossed that boundary and exposed the
  next harness-only defect. This is no product, gameplay, persistence or presentation verdict.

### Browser-free-verified bounded successor

- One pure `buildEarlyCoreFlowActionSurfaceExpression` now owns the page-realm expression for all
  three drivers. It returns a parenthesized object value and groups the supplied action expression;
  the inner action still executes exactly once and the outer object is never invoked.
- The executable regression proves the exact token/state/action result, one action evaluation,
  empty-expression refusal, rejection of the historical outer-call mutant, the exact three-driver
  consumer inventory and absence of the malformed source shape.
- Focused verification passed **2 files / 52 tests**; both changed Node programs pass syntax, and
  all three TypeScript programs pass. The complete develop profile passed **258 files / 2,629
  passed / 1 skipped**, **34** clean art sources, **1,014/1,014** routes and **454** non-inert
  fields. Independent final review is **APPROVED**.
- Current Compendium producer authority remains
  **410d2639ec981647adc20b3ae00576c0d60839296c7b763333fa2a00c79b42a6**.
- The successor changes only the Slice contract/declaration/runner/test, immutable evidence and
  current references. It is still an unsigned dirty working tree and inherits no 138cdee browser
  certificate.

### Immutable exact-source evidence

- Compendium PASS:
  `audits/ARC1A_COMPENDIUM_PR35_SURVEY_SURFACE_EXPRESSION_PREDECESSOR_PASS_20260901_138CDEE.json.gz`
  — gzip **526,415 bytes**, SHA-256
  `4b48ba792a665a177289cd358e4372e60469839d790a2d30ced4d2606a66db86`; raw
  **10,885,845 bytes**, SHA-256
  `07b225f69914fe328149fec4980a507c6236c7cecfd7c067019f7f1008a80ed2`.
- Slice FAIL:
  `audits/ARC4_SLICE_PR35_SURVEY_SURFACE_EXPRESSION_ORACLE_RED_20260901_138CDEE.json.gz`
  — gzip **1,481 bytes**, SHA-256
  `f5bf24b7d240ef7cf693ddc962379c865c7a5c4c068989da9243777520b5c081`; raw **3,933
  bytes**, SHA-256 `db66d6f2edbdd548efb3249f0267bb24dc59d3779c8370879096cfb68449bba4`.
- Slice log:
  `audits/ARC4_SLICE_PR35_SURVEY_SURFACE_EXPRESSION_ORACLE_RED_20260901_138CDEE.log.gz`
  — gzip **1,612 bytes**, SHA-256
  `bd4b37a43bbb65a1c7e08701a8b5f3d2c67da90ee2ac1a0c20f4abbb8458eb04`; raw **3,935
  bytes**, SHA-256 `7843fa089c2b19837910d7c2813a000bb873ea48f95a5c9be00433595fd92dab`.
- All three carriers pass gzip integrity and bind only exact signed 138cdee. The 6030035 and five
  hosted red carriers remain immutable history and are not relabelled.

### Unchanged product boundary

Gameplay, save schema/semantics, deterministic generation, creature/genome/plant/biome/Guardian
structures, art/audio, CSS, copy and presentation geometry are unchanged. Browser-family/CDP
policy, numeric rulers, timeouts and one-attempt/no-retry policy are unchanged. No roadmap feature,
Arc/Gate/HUMAN status, development-preview rule or release identity changed.

### What remains

1. Commit the bounded successor as one clean SSH-signed candidate, then run
   `node tools/tracked-input-preflight.mjs --profile=develop` against that exact commit.
2. On the same unchanged source, run one fresh local Compendium → Slice → Glass develop chain,
   once/no-retry, with every named verifier. Stop after any red or ambiguity; SceneMemory remains
   production-only/quarantined and Recovery is not part of develop.
3. If locally terminal green, commit the exact evidence/docs descendant and rerun its tracked-input
   preflight without rebinding the browser certificate.
4. Only then obtain Nick's fresh exact authorization naming the final head, base
   **7a9f4c1370dd84292388d718c38ff34214f6203b**, PR #35, `test-battery`,
   `actions-budget-approved`, 92-minute maximum and no retry. Push/update/run exactly once.
5. Merge PR #35 into `develop` only if that exact hosted attempt is terminal green and branch
   protection is satisfied. After integration, Claude begins the requested full-plan polish review
   from a fresh `anthropic/*` branch at the exact `develop` merge commit.

### Product vision and HUMAN boundary

The browser game remains the main bread-and-butter product: a deterministic, effectively infinite
universe built for repeat exploration, mining, crafting, exceptional loot and Pureforged gear,
creature discovery/care/breeding and Pokémon-like combat, Guardian progression and long-term return
play. Existing implemented systems and source-aligned references remain the foundation.

Authored visual/listening/accessibility/first-journey judgment, physical phone/tablet install, heat,
battery and true-GPU review remain HUMAN. Explicitly parked design/production work remains in the
system references and `port/V2_PROGRAM_ROADMAP.md`; this harness repair changes no Arc/Gate status.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** sign the bounded Survey-surface expression successor, run its tracked-input
  develop rehearsal, then one exact no-retry Compendium → Slice → Glass chain. Do not push, label
  or dispatch until the final exact candidate is terminal green locally and Nick supplies a fresh
  exact hosted authorization.
- **PR:** existing draft #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves creature/genome/universe art structures; hardens action-time evidence and
  exact Survey-predecessor settlement across every dependent Slice Enter/Land path; binds immutable
  fresh-document provenance; executable-tests every shared page-realm Survey surface; and
  causal-stops descendants after any red. Product behavior, saves, CSS, numeric rulers, retry and
  browser-version policy are unchanged. No release, version bump, preview or deployment is included.”
- **Claude Code next:** Nick does **not** need to open Claude yet. Open it only after PR #35's final
  exact head is terminal green and merged into `develop`; Claude must use a fresh `anthropic/*`
  branch and must not edit this OpenAI worktree.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
