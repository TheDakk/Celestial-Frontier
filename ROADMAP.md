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

## ▶▶▶ SESSION HANDOFF — 2026-09-01 · SEVENTH HOSTED STOP, BOUNDED SETTINGS PROBE REPAIR ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Published/local HEAD is exact SSH-signed
  **2f0ded864742afd0a39bd8c3e2d53cc2550bbbda** (tree
  **9609c1eb5d356ab991413284cd047524ad258204**, parent
  **a45220421195042a8702aa1265e96d40d839fc38**). The bounded successor is an uncommitted dirty
  working tree; preserve every listed change and the three new hosted-evidence carriers.
- Exact a452204's prior local **Compendium → Slice → Glass** pass remains immutable historical
  evidence only. It does not certify this changed source.

### Seventh exact hosted attempt — consumed terminal red

- Nick authorized PR #35's one-time `test-battery` for exact head **2f0ded8…** against exact base
  **7a9f4c1370dd84292388d718c38ff34214f6203b**, label `actions-budget-approved`, maximum
  92 minutes and no retry. The branch/PR metadata was synchronized and PR #35 was Ready.
- GitHub run **33542791572**, attempt 1, used synthetic merge
  **b19fdc97c470161f78e1f707328c2b582e64010b** / tree
  **9609c1eb5d356ab991413284cd047524ad258204**; the tree is byte-identical to the exact head.
  Authorization job **99972904837** passed; battery job **99972949035** completed terminal red.
- Compendium **gha-33542791572-1-compendiummem** passed **78/78** once/no-retry in
  **1,780,826 ms** with zero findings/blocked outcomes and six review PNGs.
- Slice stopped once/no-retry after **295,159 ms** with exactly **1 finding / 1 scope**, `harness`:
  `desktop eval failed near "(async()=>{const S=window.__CF_SLICE__,api=S.api; const click=(selector)=>{const target=document.querySelector(selector)": slice smoke: timed out waiting for Runtime.evaluate`.
  Seven screenshots were retained; Codex, phone and Training were not reached. Glass, Recovery and
  preview packaging correctly did not run.
- Artifact `battery-evidence` is ID **9815881641**, archive size **7,798,834 bytes**, digest
  `sha256:c19694ef682975db3f096f6bd72d48dbb4fbc626bac093081b3b5fc325152423`, expiring
  **2026-09-15**. The approval label was removed. The attempt is consumed, PR #35 remains
  Ready/open/unmerged, and **no hosted attempt, retry, push, PR mutation or merge is authorized**.

### Root cause and bounded successor

- The old writable-Settings proof put all eleven controls, both mutate/restore phases and their
  persistence waits inside one `Runtime.evaluate` command under the global 30-second CDP command
  deadline. It invoked **23** diagnostic `__smokePersistNow()` calls on top of the controls' real
  immediate/debounced writes, producing roughly **42–45** commits. Healthy Linux latency could
  therefore time out the harness while the game remained responsive. A retry, larger timeout,
  browser pin or Edge rebaseline would not repair that ownership error.
- The successor gives every Settings mutate/restore action, settlement observation and raw-v5 read
  its own named bounded CDP command. It never manufactures a diagnostic save. An independent exact
  manifest binds all eleven control selectors, live fields, durable aliases, persistence modes and
  restore semantics so the table cannot accidentally test the wrong setting.
- Before the first action, Slice stops the ticker and heartbeat, joins ecology/debounce/active-
  persist writers and makes runtime answerability deterministically false. Every real handler must
  synchronously arm exactly one immediate persist or one debounce, publish exactly **+1 revision /
  +1 commit**, and settle with zero tails. The harness reads the raw `settings/v5:settings` row,
  proves only the owned alias changed, cross-binds the full row across all 22 receipts, and repeats
  raw/live authority after a quiet window. Resume synchronously restores ticker, heartbeat,
  answerability and creature-audio authority on the same document.
- The new hooks are diagnostics-only and dormant outside Slice smoke. Ordinary game behavior,
  Settings semantics and the v5 schema are unchanged. Current Compendium producer authority is
  **bd8c2aa69dfe9f21fe3b0e254d3102ff029778cc5ce99b7537b0110ec8ed17e4** and current budget-file
  SHA-256 is **d833ac3328c6e31071589101702ad817f7d60e7abe1c0ee0e7dfe2d06c14a847**. The measurement
  contract, fixed ruler, every numeric ceiling, historical sample, 78-outcome inventory and
  version-tolerant Edge-family/CDP 1.3 policy are unchanged; this is a producer rebind only.

### Verification and evidence now present

- Both harness modules parse; `git diff --check` and all three TypeScript programs pass. The full
  Slice-focused boundary passes **21 files / 227 tests**, including executable generated
  expressions, exact-manifest, collateral-field, disjoint-chain, raw-quiet and answerability
  negative controls. Independent final review's three false-green findings are all closed.
- The complete browser-free develop profile passes **259 files / 2,667 passed / 1 skipped**, all
  TypeScript programs, **34** clean art sources, **1,014/1,014** routes and **454** non-inert fields.
  Its first pass correctly stopped only on stale Compendium producer identity; the bounded rebind
  changed no ruler or ceiling, and the final profile is green.
- Hosted evidence is preserved as deterministic `gzip -n -9` carriers:
  `ARC1A_COMPENDIUM_PR35_WRITABLE_SETTINGS_PREDECESSOR_PASS_20260901_B19FDC9.json.gz`
  (gzip **487,515** bytes / **10bfbea7…**; raw **12,842,516** / **90e38128…**),
  `ARC4_SLICE_PR35_WRITABLE_SETTINGS_COMMAND_DEADLINE_RED_20260901_B19FDC9.json.gz`
  (gzip **1,765** / **9291264a…**; raw **5,070** / **385268d4…**) and its log
  (gzip **1,746** / **d4dd84e2…**; raw **4,214** / **c5416583…**). Exact hashes are in
  `audits/README.md`.

### What remains

1. Finish the synchronized process/budget/audit/reference documentation, SSH-sign the bounded
   implementation/evidence commit, prove it clean, then run
   `node tools/tracked-input-preflight.mjs --profile=develop` once.
2. On that exact unchanged clean source, run one fail-fast/no-retry local
   **Compendium → Slice → Glass** develop chain and every exact named verifier. SceneMemory remains
   production-only/quarantined; Recovery remains outside `develop`.
3. Preserve the local chain as deterministic carriers, create a signed evidence/docs-only closure,
   and run its final tracked-input preflight. Do not rerun or rebind the exact implementation chain.
4. Ask Nick for fresh authorization naming the final exact head, base
   **7a9f4c1370dd84292388d718c38ff34214f6203b**, PR #35, `test-battery`,
   `actions-budget-approved`, 92-minute maximum and no retry. Merge into `develop` only if that
   exact hosted attempt is terminal green and branch protection is satisfied.

### Unchanged product and HUMAN boundary

The repair changes no save schema, CF1/deterministic generation, creature/genome/plant/biome/
Guardian structure, art/audio content, gameplay balance, progression rewards, copy, CSS, geometry,
memory ceiling, timeout or retry. The browser game remains the main product: effectively infinite
exploration, mining/crafting/loot and Pureforged gear, creature care/breeding/combat, Guardian
progression and long-term return play. Authored visual/listening/accessibility/first-journey
judgment, physical-device heat/battery/install and true-GPU review remain HUMAN.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** complete the exact local verification/certificate sequence above. Do not
  push, label, dispatch, mutate PR metadata or merge without a fresh exact changed-head authorization.
- **PR:** existing #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves creature/genome/universe art structures; hardens action-time evidence and
  exact Survey/Share/Travel/Settings persistence settlement; replaces one monolithic Settings CDP
  campaign with independently owned per-action commands and full raw-v5 continuity; and retains
  immutable seventh-attempt evidence. No timeout, retry, Edge rebaseline, fixed-ruler, save-schema,
  release, version, preview or deployment change is included.”
- **Claude Code next:** Nick does **not** need to open Claude yet. Open it only after PR #35's final
  exact head is terminal green and merged into `develop`; Claude must use a fresh `anthropic/*`
  branch and must not edit this OpenAI worktree.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
