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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · BATTERY CONSOLIDATED · AUTHORITIES GREEN · FINAL DEVELOP CHAIN NEXT ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. The committed base is **d1b0202fae029d54a8495a3cadcb5d598ad0d8c8**
  (tree **3a5da7a0929966e60b1380583e44aed025dc9c11**, parent **4ac4d3cf8b71…**) and is
  **31 commits ahead** of the fetched remote agent branch.
- **Current local batch:** the dirty worktree changes only check orchestration, GitHub workflow
  policy/contracts and current process documentation. It adds no gameplay feature, save/schema
  change, numeric ruler, browser threshold, retry, release identity or calibration. The V2
  `package.json` is byte-identical to d1 so SceneMemory and Compendium producer authority remain
  exact; no budget was rewritten.
- **PR boundary:** draft PR **#35**, base **develop**, source **openai/mac**, remains blocked and
  unmerged. Fetched base is **7a9f4c1370dd84292388d718c38ff34214f6203b** and remote head is
  **017fa6decbc41809188768ccdb98ab86ef1b9ebc**. Nothing in this batch is pushed.
- **Actions boundary:** `GITHUB_ACTIONS_BUDGET.md` is **UNFROZEN**, the repository is assumed
  public, and **zero hosted attempts are authorized**. Do not push, label, dispatch, rerun, mark
  Ready, merge, release, bump a version, publish or deploy without a new exact authorization.
- **Browser policy:** root and Chrome-owned gates accept the canonical Chromium family at CDP
  **1.3**; SceneMemory and Compendium require the Microsoft Edge family at CDP **1.3**. Point
  versions are provenance only and never trigger a rebaseline or threshold change.

### Battery decision — retain facts, remove duplicate executions

- The **2,505 passing / 1 skipped** Vitest inventory is one browser-free regression run, not 2,505
  Actions jobs or browser launches. It completes in about **22 seconds** on this Mac and remains the
  fast product safety net. This consolidation adds only four cheap workflow/profile contract cases;
  it does not multiply browser checks.
- `node tools/check-profile.mjs --profile=dev|develop|production` is now the single immutable,
  cross-platform, fail-fast owner:
  - **dev:** one full Vitest run plus root-strict, game and worker TypeScript;
  - **develop:** dev plus art audit, exact route/coverage authority and specification check;
  - **production:** develop plus the 107-mutation override-checker control.
- The runner is deliberately outside `package.json`. Both memory gates hash that whole manifest;
  keeping policy aliases out prevents a CI-only script edit from masquerading as product/memory
  drift. The authority printer independently confirms SceneMemory and both Compendium authorities
  match their existing budgets with unchanged build/dist bytes.
- Exact duplicate runs are removed: no standalone current-producer test after `npm test`; no
  looser root TypeScript pass before the strict pass; no second workflow invocation of selftests
  already owned by Vitest; no routine `coveragegap` beside stricter `overridecheck`; and no
  unconditional `overridecontrol` in the coding/develop profile.
- The exact base/head path classifier is dependency-free and mutation-tested. Ordinary V2 product
  work skips browser-instrument selftests; changing the shared launcher, memory instruments,
  workflow, or their dependency lock runs those controls once on `develop`, while production
  always owns them. Parser dependency changes likewise trigger the art mutation control.
- The owner-authorized **develop** battery runs browser-free work first, conditionally runs legacy
  root gates only when their tracked surface changed, then one distinct SceneMemory → Compendium →
  Slice → Glass chain with causal stop and no retry. The **production** battery always owns
  instrument controls and adds uninterrupted predecessor-bound Recovery plus package smoke.
  Recovery is not a
  20-minute tax on every coding batch.
- The manual preview workflow shrank from **225 to 108 lines**. It now runs the dev profile and one
  package-specific preview producer/integrity selftest, creates one exact-commit separate-origin
  package, browser-smokes that package and uploads it. It
  cannot recertify Compendium/Slice/Glass/Recovery/personas or satisfy the `battery` context.
- The 12 Glass viewports and the distinct SceneMemory, Compendium, Slice and Recovery instruments
  remain. They measure different failure classes and were not collapsed into a misleading single
  browser pass. Per-stage builds remain until a separately reviewed content-addressed build carrier
  exists.

### Browser-free acceptance on the current dirty batch

- Integrated workflow/profile contracts: **3 files / 25 passed**.
- `node tools/check-profile.mjs --profile=develop`: **PASS** in **26.8 seconds**:
  **251 files / 2,505 passed / 1 skipped**, all three TypeScript programs, **34** art sources with
  zero findings, **1,014/1,014** routes covering **1,010/1,010** Earth species, and
  **454** declared specification fields with zero inert/unread fields.
- Production-only `npm run overridecontrol`: **107/107 mutation controls PASS** once, with exact
  clean restoration.
- Current producer printer: SceneMemory budget match, Compendium measurement match and Compendium
  built-producer match are all **true** at the unchanged **964-module / 52-file** build.
- Compendium workflow preflight selftest: PASS; exact extract → live preflight → certificate →
  verifier ownership and all negative controls remain intact.
- Preview producer/browser selftest: PASS; package tamper/origin/owner controls plus the bounded
  real-Chrome startup control remain intact without recertifying gameplay.
- Actions-budget selftest: **64 fail-closed controls PASS**.
- Tool syntax and `git diff --check`: PASS.
- No browser/HUMAN/hosted/merge/release/deployment authority is claimed by these browser-free results.

### Exact next work — one clean admission, then one develop chain

1. Finish the synchronized current documentation, commit this consolidation as one SSH-signed
   successor of d1, verify the embedded signature and require a clean worktree.
2. Run `node tools/tracked-input-preflight.mjs --profile=develop` once on that exact clean commit.
   It installs one tracked snapshot and invokes the shared develop profile exactly once.
3. Because PR #35's exact base/head scope contains legacy and changed browser-instrument inputs,
   run those conditional controls once, then one SceneMemory → Compendium → Slice → Glass chain on
   the same unchanged commit. Stop at
   the first nonzero/red/instrument result; no automatic retry.
4. Preserve exact named evidence and refresh this handoff. **Do not run Recovery** for the agent →
   develop admission; it belongs to the separately authorized develop → main production candidate.
5. Report exact final head/base to Nick. A push/label/hosted attempt still requires explicit
   authorization naming that pair.

### Product-roadmap and HUMAN boundary

The dependency-ready V2 gameplay campaign remains implemented. This process batch does not recreate
or redesign the established creature/genome, Guardian/Prime Codex, loot/Pureforged, exploration,
combat, progression, universe-wide visual or audio systems. Existing creature anatomy, silhouette,
proportions, topology, seeds, identity and interaction geometry remain protected.

Still-open items require authored product decisions or HUMAN/device evidence and must not be
invented merely to call the roadmap complete: conquest-imbue coexistence, another Guardian reward
table, canonical mission/care/healing rules, broader Chronicle/Museum history, achievement reward
claims, Fifty Paragons, remaining production media/depth, real-veteran import, accessibility, and
physical phone/tablet install, heat, battery, true-GPU and first-journey judgment. Current system
references and `port/V2_PROGRAM_ROADMAP.md` own those boundaries.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** sign this battery-consolidation batch, run one exact clean tracked admission,
  then one final develop browser chain with causal stop and no retry.
- **GitHub step now:** none. Zero hosted attempts are authorized.
- **PR #35:** existing draft; base **develop**, source **openai/mac**, title
  **feat(v2): complete roadmap campaign and harden CI parity**.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After PR #35 is terminal-green and merged into `develop`, Claude should use an
  `anthropic/*` branch from that exact integration commit for the requested whole-plan polish.
- **Release status:** `develop`, `main` and the live site remain unchanged. No release, version
  bump, preview publication or deployment is in progress.
- **Actions budget:** UNFROZEN, repository assumed public, private cap 3,000 fail-closed,
  **zero authorized hosted attempts**.
