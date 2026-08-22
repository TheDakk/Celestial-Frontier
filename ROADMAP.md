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

## ▶▶▶ SESSION HANDOFF — 2026-08-22 · ARC 1 AUTOMATED IMPLEMENTATION LOCALLY COMPLETE · CLAUDE FULL-ARC REVIEW NEXT ◀◀◀

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

- `port/v2 npm test`: 49 files PASS; 567 passed / 1 intentional skip.
- `port/v2 npm run typecheck`: root, game, and worker configurations PASS.
- Real-browser Slice Smoke: terminal `SLICE SMOKE: PASS`, including the real Shipyard open/read/
  owned-Close leg and attached Earth HD backing witness; one attempt, no retry.
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

### Claude full-Arc review — immediate next action

1. Nick authorized publication of the complete OpenAI Arc 1 head in this batch. Push only
   `openai/mac` to matching `origin/openai/mac` through the proven 1Password SSH path, then refresh
   existing draft PR #33. Keep it draft. Do not add `actions-budget-approved`, dispatch, rerun,
   mark Ready, merge, publish, release, version, or deploy.
2. **After that push, open Claude Code now** in its own exact macOS folder
   `/Users/nick/Projects/celestial-frontier-anthropic-mac`, branch `anthropic/mac`. Re-prove that
   folder/branch/upstream and its SSH agent, fetch origin, and review remote refs read-only. Do not
   edit the OpenAI worktree, merge the OpenAI branch into the Anthropic branch, or copy files.
3. Review the **entire Arc 1** as
   `38447019517147319bd08c598202d097ee866874...origin/openai/mac`. Also inspect the current Arc 1B/C
   PR delta `origin/develop...origin/openai/mac` and draft PR #33 metadata. Focus on Arc 1A
   Compendium/art/worker ownership; Arc 1B scene/Pixi transactions and bfcache; Arc 1C normalized
   ship truth, SVG owner, HD attachment; browser-gate modality; raw-CDP authority and negative
   controls. Return only evidence-backed findings or CLEAR; do not mark the draft Ready.
4. Resolve any Claude findings on `openai/mac`, rerun proportionate checks, then request one exact
   changed-head/base/label/runner-ceiling/no-retry `test-battery` authorization. Only terminal-green
   hosted evidence can unlock normal merge to `develop` under the standing merge rule.
5. Keep Arc 1A's six-image Compendium review and Arc 1C's phone/desktop silhouette/readability review
   open as HUMAN work. After review/integration, the implementation spine is **F3 → F4 → Arc 2**.

## Parallel Git handoff — exact budget-aware fields

**Current side:** OpenAI/Codex macOS owns
`/Users/nick/Projects/celestial-frontier-openai-mac` on `openai/mac`. Arc 1 product/ruler,
activation, retained evidence, references, and this handoff are committed. Nick authorized this
complete head to be pushed to `origin/openai/mac`; verify exact local/remote SHA equality after push
rather than trusting a pre-push hash embedded in the handoff.

**GitHub step:** Push `openai/mac` via SSH and refresh existing draft PR #33 only. A branch push or
PR metadata edit starts no hosted runner under the sealed labeled-event workflow. Do not apply the
approval label, dispatch, mark Ready, merge, or publish.

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
> Verification: full v2 tests passed 567 with 1 intentional skip across 49 files; root/game/worker
> typecheck passed; real-browser Slice Smoke passed; Glass Matrix passed all 12 viewports; three
> clean Arc 1C calibrations and the exact-budget local certificate each passed 42/42 under Edge
> 151.0.4129.101; the named verifier and 64-control Actions-budget selftest passed. Hosted CI has
> not run for this Arc 1C head.
>
> After push, Claude reviews the full Arc 1 remote range read-only from its separate `anthropic/mac`
> worktree. The Anthropic side must not copy, merge, or edit OpenAI bytes; it receives accepted work
> only after PR merge through `origin/develop`. This PR remains draft during review. No release,
> deployment, version bump, publication, or site write is included.

**Other side:** Open Anthropic/Claude Code only after the OpenAI push is verified. Use
`/Users/nick/Projects/celestial-frontier-anthropic-mac` on `anthropic/mac`, fetch origin via its own
1Password SSH Agent, and perform the read-only full-Arc review above. Do not synchronize changes into
that branch yet.

**Release status:** `develop` remains `d4ab7e6…`; `main`, the live site, and development site are
unchanged. No release, deployment, version bump, publication, or site write occurred.

**Actions budget:** `UNFROZEN`; public standard runners remain free while visibility holds; 3,000 is
the fail-closed private/ambiguous cap. Exact Arc 1C hosted attempts authorized: zero. Approval label:
absent by required policy. The next hosted attempt requires separate exact changed-head authority.
