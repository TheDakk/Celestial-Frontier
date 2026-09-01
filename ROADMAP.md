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

## ▶▶▶ SESSION HANDOFF — 2026-09-01 · SETTINGS PROBE REPAIRED, LOCAL DEVELOP CHAIN GREEN ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Exact SSH-signed implementation source is
  **cf2d176862a68f090b935fb0362fe3aeb052b978** (tree
  **cc52f4901d4368f8ab98302ff4302619a3af1f98**, parent
  **2f0ded864742afd0a39bd8c3e2d53cc2550bbbda**). The signed evidence/docs-only descendant that
  contains this handoff adds only the four exact local-certificate carriers and synchronized
  references; its own SHA is intentionally not self-embedded. Resolve it with `git rev-parse HEAD`.
- Exact a452204's prior local **Compendium → Slice → Glass** pass remains immutable historical
  evidence only. The distinct cf2d176 chain below certifies the Settings repair.

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
  negative controls. Independent final review is **CLEAR** after closing exact-manifest, whole-row,
  chain-continuity and answerability false-green findings.
- The complete browser-free develop profile passes **259 files / 2,667 passed / 1 skipped**, all
  TypeScript programs, **34** clean art sources, **1,014/1,014** routes and **454** non-inert fields.
  Exact clean cf2d176 also passes the hermetic tracked-input develop preflight at the same counts.
- Exact unchanged cf2d176 then completed one serial, fail-fast/no-retry local develop chain on Edge
  `152.0.4191.53` / CDP `1.3`; the point version is provenance only. Every named verifier passed:
  Compendium **20260901200818363-3312-ad36b2aac8** passed **78/78** in **63,844 ms** with zero
  findings/blocked outcomes and six review PNGs; Slice
  **20260901200939671-3633-9b419c68c44c** passed in **360,495 ms** with zero findings/scopes and
  ten screenshots (report/log SHA-256 **a610fdbf…f158 / 4cc787e3…c0ae**); Glass
  **20260901201556259-3986-34e7be99634e** consumed that exact Slice and passed **12/12** viewports,
  **12/12** reload rows, **104/104** controls and **36/36** Arc 4 outcomes in **109,289 ms** with
  zero findings/instrument failures (report SHA-256 **89b77c33…126c**).
- Hosted evidence is preserved as deterministic `gzip -n -9` carriers:
  `ARC1A_COMPENDIUM_PR35_WRITABLE_SETTINGS_PREDECESSOR_PASS_20260901_B19FDC9.json.gz`
  (gzip **487,515** bytes / **10bfbea7…**; raw **12,842,516** / **90e38128…**),
  `ARC4_SLICE_PR35_WRITABLE_SETTINGS_COMMAND_DEADLINE_RED_20260901_B19FDC9.json.gz`
  (gzip **1,765** / **9291264a…**; raw **5,070** / **385268d4…**) and its log
  (gzip **1,746** / **d4dd84e2…**; raw **4,214** / **c5416583…**). Exact hashes are in
  `audits/README.md`.
- The four exact cf2d176 PASS carriers also pass gzip integrity and deterministic recompression:
  Compendium **452,817 / bd6d36bf…** (raw **10,836,613 / 7cffdb47…**), Slice report
  **1,961 / c3418496…** (raw **6,102 / a610fdbf…**), Slice log **3,292 / 39be1878…**
  (raw **6,949 / 4cc787e3…**) and Glass **78,764 / d7715720…** (raw
  **898,573 / 89b77c33…**). `audits/README.md` records every full hash.

### What remains

1. No further local code or browser repair remains. The signed evidence/docs-only descendant passes
   the final tracked-input develop preflight; do not rerun or rebind cf2d176's exact browser chain.
2. Ask Nick for fresh authorization naming the final exact `git rev-parse HEAD`, base
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

- **OpenAI/Codex next:** report the final exact signed branch head and wait for one fresh matching
  authorization. Then push **openai/mac**, refresh PR #35 metadata, apply the budget label, dispatch
  once and merge only if terminal green. Do not reuse the consumed 2f0ded8 authorization.
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
