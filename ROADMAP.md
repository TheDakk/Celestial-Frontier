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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · COMPENDIUM FIRST-INSTALL AUTHORITY REPAIRED · SIGNED · FRESH CERTIFICATION NEXT ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **`openai/mac`**, upstream
  **`origin/openai/mac`**. Work remains limited to the v2 port, its evidence tooling/tests and
  current Markdown. Legacy `main.js` / `celestial-frontier.html`, `develop`, `main`, the live-site
  repository and every other agent worktree remain untouched.
- **Signed implementation/evidence repair:** exact commit
  **`f3063a2a02fde540a2e343d57eaee132e5794d2a`** (tree
  **`883d7ca89c7e0a779775504175b8e670d82ed5d6`**, parent signed documentation checkpoint
  **`830e601b8f16092d6f9193ecde329cfefd279bcd`**) contains an embedded SSH signature. It preserves
  the exact stopped worker-import carrier; repairs the first-install service-worker claim gap;
  adds exact bounded worker-error attribution; binds the generated service worker into current
  producer authority; and updates all affected current references. The signed documentation
  closure is its direct successor; resolve that exact current HEAD with `git rev-parse HEAD` and do
  not overwrite either checkpoint.
- **Branch relationship:** the implementation commit is ten commits ahead of
  `origin/openai/mac`; this documentation closure adds one local commit. Freshly fetched
  `origin/develop` **`7a9f4c1370dd84292388d718c38ff34214f6203b`** is an ancestor. Nothing in this
  batch has been pushed.
- **PR boundary:** draft PR **#35** remains **`openai/mac` → `develop`**. Its remote head is still
  **`017fa6decbc41809188768ccdb98ab86ef1b9ebc`** against base
  **`7a9f4c1370dd84292388d718c38ff34214f6203b`**; it is blocked and unmerged.
- **Actions boundary:** `GITHUB_ACTIONS_BUDGET.md` is **UNFROZEN**, the repository is assumed
  public, and **zero hosted attempts are authorized**. The 3,000-minute cap applies fail-closed if
  visibility becomes private or ambiguous. Do not push, label, dispatch, rerun, mark Ready, merge,
  release, bump a version, publish a preview or deploy without Nick authorizing one exact final
  head/base attempt.
- **Browser policy:** compatible Edge/Chrome/Chromium point versions are provenance only. They never
  trigger a rebaseline, threshold change or product repair. Current local provenance is canonical
  Microsoft Edge `152.0.4191.53`, CDP `1.3`; acceptance remains family/protocol plus the sealed
  source-inventoried capability contract.
- **Historical automated chain:** signed source `3f69e88…` retains the immutable green
  Layout → SceneMemory → Compendium → Slice → Glass → Recovery campaign. It is history only; no
  successor inherits or relabels it. Bare Glass still refuses without its exact named-verified
  Slice predecessor by design.

### Exact stopped run and preserved evidence

Exact clean signed source `830e601b8f16092d6f9193ecde329cfefd279bcd` ran
`20260830-pr35-visualkey-v2-830e601b8f16-compendium-certification` exactly once with zero automatic
retries under accepted Edge `152.0.4191.53` / CDP `1.3`. It stopped **instrument-fail** at phone
`veteran-earth-planetside thumb settlement` after **33,217 ms**, retained zero product outcomes and
blocked all 78. Desktop, review PNG, Slice, Glass and Recovery successors did not run.

The prior long-visual-key repair worked. The first lazy species painter import failed instead, and
the historical v1 window projection discarded the exact worker error code and message, so the old
collector could not distinguish a product failure from an instrument blind spot. No retry or Edge
rebaseline was attempted.

Preserved immutable evidence:

- Carrier:
  `audits/ARC1C_COMPENDIUM_PR35_WORKER_IMPORT_INSTRUMENT_FAILURE_20260830_830E601.json.gz`
- Gzip: **7,357 bytes**, SHA-256
  `90d61baeee297041a2afc7bf776fb504c5ac803140cf0613785859714c5f2aa9`
- Raw: **54,172 bytes**, SHA-256
  `ef3cec79cf181323705d8a9eff82d9bb8023275590a23a0589515248e626d6b5`
- The independent replay binds exact source/browser/authority, one-attempt lifecycle, stopped stage,
  zero outcomes and all 78 blocked. Historical evidence remains immutable and is not rebound to the
  repair.

### Code-supported cause and permanent bounded repair

The stopped run exposed a deterministic first-install ownership race. Activation took its initial
client snapshot before `clients.claim()`. A dedicated species worker created in the claim gap was
absent from that snapshot, loaded its entry uncontrolled, then became service-worker controlled
before its first lazy painter request. With no exact retained-build pin for that worker client, the
service worker correctly refused the mixed-build request with exact 503 text:
`This document has no retained Celestial Frontier build.`

The repair is narrow and negative-controlled:

- first-install activation now reruns all-client retained-build reconciliation immediately after
  `clients.claim()` inside the same activation `waitUntil` barrier; deleting that step recreates the
  unpinned worker and exact 503;
- species-loader diagnostics schema v2 publishes one frozen, bounded `lastError` receipt only for a
  trusted valid worker error; `jobId` / `kind` / `key` must be all-null or all-present;
- producer replacement clears both `lastEvent` and `lastError`; adapter-protocol and external
  fatals clear stale error evidence, while a trusted worker fatal retains its exact receipt;
- live settlement observation v3 requires complete broker, exact art-schema, exact lazy-worker
  schema and worker diagnostics before terminal product attribution. A matching current error ends
  immediately as distinct `product-error` / `product-fail` with no sleep or retry; missing,
  malformed, stale or mismatched evidence remains instrument-red;
- Compendium producer authority v2 now binds generated `service-worker.js` with index, owner,
  species worker and painter. Historical v1 authority/reports still replay unchanged;
- the canonical v2 bulletin remains exactly 73 bullets: the first-install repair is integrated into
  the existing cold-Planetside-art note rather than silently expanding its sealed inventory;
- creature/genome structure, deterministic art identity, cache limits, fixed numeric rulers,
  ceilings and the 78-outcome inventory are unchanged.

### Current authority and browser-free acceptance

- Browser capability:
  `35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341`
- Compendium measurement:
  `e6aba53d75c17669f4bc8893770023c849d4ed23edb6be36eb938f4491e17e97`
- Outcome contract:
  `2c751b866ca40fc8e4593dda82d19eb62ca4ff804caffc7531228128b480af21`
- Collector:
  `2a74e941abbe701ca5c1d3952a7451ccd11ce3284d794f9e22aa0a79c0315237`
- Producer authority v2:
  `2ef58ea042d2d5ecb97715642efeac14e013dfb8b375406cfb47c090cf072e39`
- Generated service worker:
  `81dca3977138d0973b52e85c0c82b6636674088546463edb136ec64640b78a14`
- Scene build:
  `49bc3ce0529eab7af1dff496c09fb79f08d5ad9e7ab4f1b7a05fc8d2e0d13dfc`
- Active Compendium budget:
  `a48804b319e9b2dabda91ebaa6d947971d44abcd4e0a375ba8a3405002e5eac2`
- Active SceneMemory budget:
  `82166755fac8eea288090bf58845c629f416dd4749ef927327c5f4d346cb539f`
- Compendium selftest: **589/589 independent product/instrument controls pass**.
- Focused PWA/worker/authority/budget/carrier battery: **6 files / 96 tests pass**.
- Full browser-free v2 suite: **238 files / 2,423 passed / 1 skipped**.
- Root, app and worker TypeScript programs: **all green**.
- Independent current-authority printer: SceneMemory budget, Compendium measurement budget and
  Compendium producer budget all match.
- Carrier reproduction/hashes, canonical release inventory, scoped diff and independent code review:
  **green / CLEAR**.

This is signed browser-free product/instrument authority. It is **not** a fresh Compendium browser
certificate, HUMAN visual acceptance, successor-chain evidence, hosted CI green or merge/release
authority.

### Exact next work — one changed-head attempt, then stop or advance

1. Sign this documentation closure, require a clean worktree, and run
   `node tools/tracked-input-preflight.mjs`. Then run the Compendium selftest,
   browser-preflight selftest and exactly one live preflight. A nonzero result stops the campaign;
   no browser point-version rebaseline or automatic retry is allowed.
2. From that exact clean signed documentation HEAD, run exactly one fresh Compendium certificate
   with a unique commit-derived run ID and zero retries, then named-verify that immutable ID. Stop
   after any nonzero, product-red or instrument-red result and preserve its evidence before any
   repair.
3. Only if Compendium is terminal-green, keep the committed source unchanged and run the strict
   serial chain copied in `port/v2/README.md`:
   - `npm run smoke:report:selftest` → one `npm run smoke:ci` → exact named Slice verifier;
   - `npm run glassmatrix:selftest` → one Glass run with that exact Slice ID → exact two-ID verifier;
   - `npm run arc4recovery:selftest` → one Recovery run with both exact predecessor IDs → exact
     three-ID verifier.
   Stop at the first red/nonzero result. Never invoke bare Glass or substitute a latest pointer for
   an immutable predecessor ID.
4. Preserve exact reports/logs/PNGs, refresh this handoff at the end of the batch, sign any
   evidence/documentation closure and rerun tracked-input preflight on the final clean committed
   index. A docs-only descendant does not change product bytes but must never relabel an earlier
   exact-source browser result.
5. Report the final full head/base to Nick. Only a new authorization naming that exact pair may push,
   apply `actions-budget-approved`, run the one 92-minute hosted battery and—if terminal-green—merge
   PR #35 normally into `develop`.

### Product-roadmap boundary

The dependency-ready v2 gameplay campaign remains implemented. This repair does not recreate or
redesign the established creature/genome, Guardian/Prime Codex, loot, Pureforged crafting,
exploration, combat, progression, universe-wide visual or audio systems. Existing creature anatomy,
silhouette, proportions, topology, seeds, identity and interaction geometry remain protected.

Still-open work requires authored product decisions or HUMAN/device evidence and must not be invented
merely to call the roadmap complete: conquest-imbue coexistence, an additional Guardian reward
table, canonical mission/care/healing rules, broader Chronicle/Museum history, achievement reward
claims, Fifty Paragons, remaining production media/depth, real-veteran import, accessibility, and
physical phone/tablet install, heat, battery, true-GPU and first-journey judgment. Current system
references and `port/V2_PROGRAM_ROADMAP.md` own those boundaries.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** remain in this worktree, complete the exact local browser chain and make no
  GitHub write until Nick authorizes one immutable final head/base attempt.
- **GitHub step now:** none.
- **PR #35:** base `develop`, source `openai/mac`, title
  **`feat(v2): complete roadmap campaign and harden CI parity`**. Refresh its description only when
  the final clean head is ready; include the service-worker/diagnostic/settlement repairs, preserved
  red evidence, current full local verification, exact browser-chain result, cross-agent
  synchronization effect and explicit no-release/deployment boundary.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After PR #35 is terminal-green and merged into `develop`, Claude should create or update
  an `anthropic/*` branch from that exact integration commit and perform the requested whole-plan
  polish review.
- **Release status:** `develop`, `main` and the live site remain unchanged. No release, version bump,
  preview publication or deployment is in progress.
