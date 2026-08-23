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

## ▶▶▶ SESSION HANDOFF — 2026-08-22 · PR #33 ATTEMPT 1 RED · D-ART-36 RULER REPAIRED LOCALLY ◀◀◀

### Fail-closed workspace and SSH identity

- The current owner is **OpenAI/Codex on macOS** in the physical root
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, tracking
  `origin/openai/mac`. Before any work or GitHub operation, require that exact app + OS + physical
  root + branch row. Do not repair a mismatch by changing directory or switching branches inside an
  incorrectly opened task.
- The four valid rows are fixed in `PARALLEL_GIT_PROTOCOL.md`:
  - OpenAI/Codex Windows: `C:\Projects\celestial-frontier-openai-windows` · `openai/windows`
  - Anthropic/Claude Code Windows: `C:\Projects\celestial-frontier-anthropic-windows` · `anthropic/windows`
  - OpenAI/Codex macOS: `/Users/nick/Projects/celestial-frontier-openai-mac` · `openai/mac`
  - Anthropic/Claude Code macOS: `/Users/nick/Projects/celestial-frontier-anthropic-mac` · `anthropic/mac`
- All four rows use exact origin `git@github.com:TheDakk/Celestial-Frontier.git`; never fall back to
  HTTPS credentials or copy a private key into a worktree. On this Mac, effective OpenSSH config
  selected the local 1Password SSH Agent. Noninteractive
  `ssh -T -o BatchMode=yes -o ConnectTimeout=15 git@github.com` returned GitHub's authenticated
  **Hi TheDakk!** message and the expected no-shell exit 1. BatchMode repository read returned
  `d4ab7e671959ab80198bed22bb600a26fc3524cc` for remote `HEAD`, and `git fetch origin` passed.
  Nick reports the Windows 1Password setup verified there; this Mac did not independently probe the
  Windows agent. Repeat the same fail-closed proof on each machine before its first write.
- Git branch bytes use SSH. PR title/body metadata may use the authenticated GitHub connector; that
  does not change the Git remote or authorize an HTTPS/PAT fallback. The local `gh` token is not an
  authority for this handoff.

### Exact Arc 1 authority layers

- `origin/develop` is Arc 1A integration commit
  `d4ab7e671959ab80198bed22bb600a26fc3524cc` from terminal-green PR #32. Arc 1A's automated maximum
  Compendium implementation is integrated; its six phone/desktop images still need HUMAN review.
- Arc 1B historical product/ruler authority is
  `79c605f9c7ab8b63ad082d852c38d66ad6bb11af`; scene-memory-v1 activation/certification authority is
  `e244c9e2342c6abd79ca4efcd3d26eb46d3d8910`; retained evidence descendant is
  `b30b6d49a8ff1745f33be9a329d421309b96b5e3`.
- Arc 1C product/ruler authority is
  `a4de5007ffc9131b8bc952a0a4cb469d9139039e`. Scene-memory-v2 budget/workflow activation and exact
  local-certification source is `59530da3bf40965adf9c54f169b310e11ccdd0f8`. Active budget
  `port/v2/budgets/scene-memory-v2.json` SHA-256 is
  `3b71d14ca297ec4d536669d2edf960ac4d01671dd7a0c9eb11a2fb76e4fc43f7`.
- Durable Arc 1C calibration/certification evidence and refreshed references are committed at
  `ebede04e26267d67821115a6767aa046e1f58049`. This final handoff is a later documentation
  descendant; neither it nor `ebede04…` is retroactively the exact certified source.

### Automated implementation result

- **Arc 1A — maximum Compendium:** virtualized 1,500-row list, deterministic filter/detail/focus,
  cancellable thumbnail and portrait leases, bounded cache/worker ownership, serviced-turn paint,
  Planetside integration, and exact phone/desktop memory authority. PR #32 is merged in `develop`.
- **Arc 1B — explicit scene ownership:** document-wide refcounted canvas/TextureSource leases,
  fresh-owner whole-scene rollback, transactional fine/surface swaps, stale HD cleanup, bfcache
  survival, bounded local caches, and narrow Pixi 8.19 managed-hash/TextStyle/batch-UID cleanup.
- **Arc 1C — ship visual and Shipyard foundation:** one recursively frozen `ShipVisualState` from
  canonical reach and exact owned ids; four deterministic code-native SVG silhouettes; a responsive
  read-only Shipyard in the desktop rail and exact 260px 5×2 nine-control phone dock; one preview
  owner while open and zero retained after Close; no second Pixi renderer or `RenderTexture`.
  `SurfacePlanetTextureAttachment` now owns identity-safe acquire/publish/release and proves the
  actual attached 512/768/1024 TextureSource backing rather than requested-tier bookkeeping.
- Fabrication, Research, Cargo/material spending, build/upgrade writers, richer living previews,
  true GPU-byte measurement, physical heat/battery, release and deployment remain outside this Arc
  1 automated-local claim. No save schema, production version, or shipped release changed.

### Exact local verification completed

- `port/v2 npm test`: 49 files PASS; 571 passed / 1 intentional skip.
- `port/v2 npm run typecheck`: root, game, and worker configurations PASS.
- Real-browser Slice Smoke: terminal `SLICE SMOKE: PASS`, including the real Shipyard open/read/
  owned-Close leg; the SceneMemory surface route separately proves the attached Earth HD backing
  witness. One attempt, no retry.
- Real-browser Glass Matrix: terminal PASS for all 12/12 viewports after the focus ruler began owning
  `focusVisible` modality and negative-controlled suppression, paint removal, and restoration.
- SceneMemory v2: three clean one-attempt/no-retry calibration reports each replay 42/42 under exact
  Edge `151.0.4129.101`. Clean run `20260822-arc1-local-certification` at `59530da…` passed 42/42,
  complete lifecycle/cleanup, empty findings/fatals, then passed the independent named verifier.
  Report raw/gzip SHA-256 are
  `e24ceef86d17fb4a47bbb10e58f81d442cac6e3def28923672448f6c47eac3a5` /
  `0d83e6ce339205beb0b5387008ca74ca9b1f95cb22bf61444c439da36405f2a6`.
- The retained evidence test is 7/7 and binds the collected profile projection, exact scope/fixture,
  exact 38-file built inventory, producer/browser/budget authority, terminal evidence, recomputed
  metrics, and byte-equal verdict/outcomes. Actions-budget policy selftest passed 64 controls.
- Independent product, ruler, evidence, archive, and current-reference reviews are CLEAR. The old
  Arc 1B handoff is preserved byte-verbatim at the top of `ROADMAP_ARCHIVE.md`.

### Claude full-Arc review — completed and remediated locally

- Claude's read-only full-Arc review is retained on this branch at
  `audits/ARC1_CLAUDE_REVIEW_2026-08-22.md`, traceably preserved from
  `origin/anthropic/mac` commit `53692f117908f6df9f432b54d35fe9225ae8eed0`. It reviewed the full range
  `38447019517147319bd08c598202d097ee866874...8b2c423bc9b1a17295d5ce9f23908e67c18a11f9` and found no
  BLOCKER or HIGH item.
- Commit `1a3eeec83e6d262fc03c8bde7e7b5b1412586afe` resolves its one MEDIUM and three LOW findings without
  changing product, collector, workflow, or the calibrated producer authority: retained raw
  SceneMemory observations are now independently re-derived in tests; the `pendingPreviewWork: 0`
  claim is source-policy guarded; the Slice Smoke/HD evidence wording is corrected; and the exact
  PR #32 cross-host-repair handoff is restored byte-verbatim in the archive.
- The remediation passed full v2 tests (49 files, 571 passed / 1 intentional skip), root/game/worker
  typecheck, and diff hygiene. The following documentation-only handoff commit is not a new product
  or certification authority.
- Authorized run `32609389977` tested exact head `5ce92fc458d0d6acc9e389f94a2f2e5ffcbfa1fd`
  against `d4ab7e671959ab80198bed22bb600a26fc3524cc` once. Authorization passed in 3s; the battery was
  terminal-red after 3m39s at `v2 parity, type, art, and coverage gates`. Root validation, Smoke,
  Field Training, layout, and all 571 v2 tests/typechecks passed. `artaudit` then falsely classified
  SceneMemory as a stale-bundle reader because D-ART-36 recognized only the legacy `execSync` build
  spelling, not its real unconditional `execFileSync(npm, ['run', 'build'])`. Later browser work was
  skipped, the label was removed, the attempt is consumed, and PR #33 was not merged.
- The bounded local repair teaches D-ART-36 both supported synchronous build forms and runs paired
  controls proving unconditional `execSync`/`execFileSync` pass while conditional/missing builds stay
  red. Post-repair `artaudit`, all 571 tests, root/game/worker typecheck, unused-art, override/coverage,
  spec, Actions-policy, and root validation gates pass. The repair and terminal-red record are
  committed locally as one changed head; publish it only with fresh exact push authority, then obtain
  separate exact head/base/label/runner-ceiling/no-retry authorization. Do not rerun `32609389977`.
- Keep Arc 1A's six-image Compendium review and Arc 1C's phone/desktop silhouette/readability review
  open as HUMAN work. After review/integration, the implementation spine is **F3 → F4 → Arc 2**.

## Parallel Git handoff — exact budget-aware fields

**Current side:** OpenAI/Codex macOS owns
`/Users/nick/Projects/celestial-frontier-openai-mac` on `openai/mac`. Arc 1 product/ruler,
activation, retained evidence, references, and Claude review remediation remain published to matching
`origin/openai/mac`. The D-ART-36 repair and this terminal-red handoff are committed together locally
but remain unpushed pending fresh exact authority. At a fresh-session start, verify status and exact
local-ahead SHA state.

**GitHub step:** PR #33 is draft, mergeable, unlabeled, and terminal-red at consumed run
`32609389977`. The bounded ruler repair is locally reviewed and committed; push that exact changed
head only after Nick authorizes the GitHub write. A branch push starts no hosted runner under the
sealed labeled-event workflow. Do not apply the approval label, dispatch, mark Ready, merge, or
publish until Nick separately provides one fresh exact changed-head attempt authorization.

**PR details:** [PR #33](https://github.com/TheDakk/Celestial-Frontier/pull/33), base `develop`, source
`openai/mac`. Copy-ready title: **Arc 1 — Complete Compendium, scene ownership, and Shipyard foundations**

Copy-ready description:

> Completes Arc 1's remaining automated-local layers on top of Arc 1A's already integrated maximum
> virtualized Compendium and bounded art worker: Arc 1B adds explicit Canvas/Pixi scene ownership,
> bfcache survival, and a memory plateau ruler; Arc 1C adds normalized ShipVisualState, a
> responsive read-only Shipyard with one code-native SVG owner, and named identity-safe surface-HD
> attachment. Fabrication, Research, Cargo spending, build/upgrade writers, and richer living ship
> previews remain future work.
>
> Verification: full v2 tests passed 571 with 1 intentional skip across 49 files; root/game/worker
> typecheck passed; real-browser Slice Smoke passed; Glass Matrix passed all 12 viewports; three
> clean Arc 1C calibrations and the exact-budget local certificate each passed 42/42 under Edge
> 151.0.4129.101; the named verifier and 64-control Actions-budget selftest passed. Hosted run
> `32609389977` reached the v2 gate and went red only because D-ART-36 failed to recognize
> SceneMemory's unconditional npm build form; the changed-head ruler repair is locally green.
>
> Claude's full-Arc review is complete and preserved with this PR. Its one MEDIUM and three LOW
> findings are resolved at the current head. The Anthropic side did not copy, merge, or edit OpenAI
> bytes; it receives accepted work only after PR merge through `origin/develop`. This PR remains draft
> pending the exact-head hosted battery. No release, deployment, version bump, publication, or site
> write is included.

**Other side:** The Claude review is already complete on its separate `anthropic/mac` branch. Do not
merge, rebase, copy, or synchronize that review branch into either `openai/mac` or `develop`; the
review was read-only evidence. It receives accepted work only after the eventual PR merge through
`origin/develop`.

**Release status:** `develop` remains `d4ab7e6…`; `main`, the live site, and development site are
unchanged. No release, deployment, version bump, publication, or site write occurred.

**Actions budget:** `UNFROZEN`; public standard runners remain free while visibility holds; 3,000 is
the fail-closed private/ambiguous cap. Consumed Arc 1C attempt: `32609389977` terminal-red. Authorized
future attempts: zero. Approval label: absent. The next attempt requires separate exact changed-head
authority and must not reuse or rerun the consumed run.
