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

## ▶▶▶ SESSION HANDOFF — 2026-08-21 · ARC 1B LOCAL COMPLETE · CLAUDE REVIEW NEXT ◀◀◀

### Fresh-session start

- Read `GITHUB_ACTIONS_BUDGET.md`, this handoff, `PROCESS_LAWS.md`,
  `PARALLEL_GIT_PROTOCOL.md`, and the owning agent instructions. Use only the active agent's own
  worktree; another agent may review `openai/mac` by commit/ref without editing that worktree.
- `origin/develop` is PR #32 merge `d4ab7e671959ab80198bed22bb600a26fc3524cc`.
  Arc 1B product/ruler authority is local commit
  `79c605f9c7ab8b63ad082d852c38d66ad6bb11af`; tracked budget/workflow activation is
  `e244c9e2342c6abd79ca4efcd3d26eb46d3d8910`; retained-certification descendant is
  `b30b6d49a8ff1745f33be9a329d421309b96b5e3`. This documentation batch is a descendant and does
  not retroactively make its HEAD the certified source.
- Remote draft PR #33 is still `openai/mac` → `develop`, remote head
  `49b872ef5b01127e687d824d95956b09f6262b23`, base `d4ab7e6…`, title
  **docs: record PR 32 terminal-green merge**, `MERGEABLE` but `BLOCKED` because it is draft and its
  current Arc 1B commits are not pushed. Local `openai/mac` is six commits ahead of that remote
  before this final docs commit. Re-read exact local HEAD/status; never infer push authority.
- Current Actions mode is `UNFROZEN`, repository visibility is public, and the 3,000-minute cap
  remains fail-closed for private/ambiguous billing. No Arc 1B push, approval label, hosted attempt,
  Ready transition, merge, publication, release, version bump, or deployment is authorized.

### Arc 1B automated result

- One document-wide `CanvasTextureRegistry` now refcounts canvas identity across scene scopes.
  Non-backdrop scene textures bypass Pixi's global cache; final logical release destroys the
  TextureSource. Whole-scene builds, fine-layer replacements, surface handoff, system-HD refresh,
  star-surface release, and clear/retry paths preserve transactional ownership and current content.
  `_rgCache`, corona/terminator canvases, timers, pending writes, retired fine owners, and route
  caches reconcile at settled Universe boundaries. Persisted `pagehide` keeps the same live app;
  only intentional replacement destroys the renderer.
- Pixi 8.19 retention carriers are bounded at their actual owners: managed GC hashes compact only
  after product release boundaries; owned `Graphics` contexts are destroyed; destroyed scene Text
  detaches from its shared `TextStyle`; and `BatchTextureArray.clear()` deletes only its own null UID
  tombstones in place. The galaxy view still materializes the original ordered ±1.2R window once,
  preserving globular-halo content while removing the duplicate 4,900-cell traversal.
- Standalone `scenemem` uses one browser process, four unmeasured warmups and four measured cycles
  for 390×844 phone and 1280×800 desktop. Each cycle proves Universe → Galaxy/fine → Sol/System →
  Earth/Surface → 1,500-row Compendium → Universe, exact owner/work deltas, populated routes,
  transient peaks, per-hash Pixi inventory, heap/DOM bounds, target plus independent browser
  heartbeat, and same-document bfcache survival. `shipyardStatus: future-arc-1c` is explicit; no
  absent Shipyard surface is fabricated or claimed.
- Three clean one-attempt/no-retry candidates at `79c605f…` replayed 40/40 under exact Edge
  `151.0.4129.93`. Budget `port/v2/budgets/scene-memory-v1.json` SHA-256
  `78a9e81a121d2598b8d83bbbd0c8311e503470dcd88083f959fc82c181ee5afb` binds their exact producer
  and browser authorities. Exact clean `e244c9e…` run `20260821-arc1b-local-certification` passed
  40/40, complete lifecycle/cleanup, no findings/fatals, followed by independent named verification.
  Raw/gzip evidence and ceiling rationale are retained in
  `audits/ARC1B_SCENEMEM_CALIBRATION_2026-08-21.md`.
- Retained 12-cycle diagnostics prove stable product-owned counts, six Pixi hashes at 87 live / 0
  cleared, 13 shared-style listeners, zero pending persistence, and byte-flat backing storage on
  both profiles. The post-fix maximum sliding four-cycle heap slope is 70,049.2 B/cycle; the active
  131,072-B ceiling remains far below the pre-fix 648,704/765,221-B slopes.

### Local verification completed

- `port/v2 npm test`: 45 files, 509 passed / 1 intentional skip.
- `port/v2 npm run typecheck`: root, game, and worker configurations PASS.
- Compendium browser-preflight workflow selftest PASS after adding the separate Arc 1B Edge phase.
- Post-fix real-browser Slice Smoke PASS: complete Gate-D core route, phone journey, Compendium,
  save/reload, zero console errors.
- `scenemem` clean candidates 3/3; tracked-budget local certification PASS; exact named verifier PASS.
- Two independent pre-commit reviews found and cleared the galaxy-halo regression and the terminal
  verifier/producer-authority gaps. No unresolved product/ruler blocker is recorded.

### Review and next bounded sequence

1. Finish and commit this documentation descendant, then ask Nick for exact authorization to push
   that full local `openai/mac` head and refresh draft PR #33's title/body. Do not apply
   `actions-budget-approved`; no hosted attempt is authorized. Claude's separate owned worktree
   cannot review unpushed OpenAI bytes through GitHub, and files must not be copied between worktrees.
2. **After the authorized push, open Claude Code for a read-only review.** From its own clean
   `anthropic/mac` worktree, fetch `origin` and review
   `origin/develop...origin/openai/mac` plus draft PR #33. Do not merge the OpenAI branch into the
   Anthropic branch and do not edit the OpenAI worktree. Focus on scene lease transactions, the
   narrow Pixi-private compatibility seam, BatchTextureArray patch safety, stale async publication,
   bfcache, the raw-CDP evaluator/negative controls, budget authority, and `.86` → `.93` workflow
   ordering. Record actionable findings with file/line evidence; do not mark the draft Ready.
3. Resolve any Claude findings locally on `openai/mac`, then rerun the affected focused checks plus
   full v2 test/type and the browser gate when warranted. Do not broaden scope without a concrete
   finding.
4. A hosted `test-battery` attempt requires a separate exact changed head/base/label/runner-ceiling/
   no-retry authorization after review; local green is not CI. Keep the draft unapproved until then.
5. Keep Arc 1A's six-image HUMAN Compendium review open. Arc 1B's existing-scene automated boundary
   is complete, but Gate D/I, physical heat/battery, and HUMAN play/art judgment are not closed.
6. Arc 1C remains next product work after this review/integration boundary: pure `ShipVisualState`,
   static responsive Shipyard, at most one owned preview, and named HD planet attachment. Arc 1C
   appends the real Shipyard leg to the resource cycle; Arc 1B deliberately does not build a shell.

## Parallel Git handoff — exact budget-aware fields

**Current side:** OpenAI/Codex macOS owns local `openai/mac`. Product/ruler commit is `79c605f…`,
budget/workflow commit `e244c9e…`, and certification-evidence commit `b30b6d4…`; the final docs
commit descends from those. Remote `origin/openai/mac` remains `49b872e…` until separately authorized.

**GitHub step:** None now. Do not push, label, dispatch, mark Ready, merge, or publish. The next
GitHub step requires Nick's exact local-head authority to push `openai/mac` and refresh the existing
draft's title/body; only then may the Claude review begin. Do not open another PR.

**PR details:** [PR #33](https://github.com/TheDakk/Celestial-Frontier/pull/33), base `develop`, source
`openai/mac`. Copy-ready replacement title: **Arc 1B — Bound Pixi scene resources and certify memory
plateaus**. Copy-ready description: **Adds explicit Canvas/Pixi scene ownership and transactional
release, bounds Pixi GC/style/batch bookkeeping, preserves bfcache, and adds a calibrated phone/
desktop travel + Compendium scene-memory gate with a one-attempt CI gate. Shipyard remains Arc 1C.
Verification: full v2 tests 509 passed / 1 skipped; typecheck, browser-preflight workflow selftest,
and real-browser Slice Smoke passed; three clean calibrations and exact-budget local certification
each passed 40/40, with independent certification verification. Hosted CI has not run. After push,
Claude reviews read-only from `anthropic/mac`; that side receives the change only after PR merge by
merging `origin/develop`, never by copying files. No release, deployment, version bump, or
publication is included.**

**Other side:** Do not open Anthropic/Claude Code for this review until Nick authorizes the exact
local-head push. After that push, open it in its own clean `anthropic/mac` worktree, fetch origin,
and perform the read-only range review above; never copy files between worktrees.

**Release status:** `develop` remains `d4ab7e6…`; `main`, live site, and development site are
unchanged. No release, deployment, version bump, publication, or site write occurred.

**Actions budget:** `UNFROZEN`; public/standard runners remain free while visibility holds; 3,000 is
the fail-closed private/ambiguous cap. PR #32 attempts remain consumed history. Arc 1B authorized
future attempts: zero; approval label: absent.
