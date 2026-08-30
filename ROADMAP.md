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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · RECOVERED-WORKER ORACLE REPAIRED · SIGNED · CHANGED-HEAD CERTIFICATION NEXT ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **`openai/mac`**, upstream
  **`origin/openai/mac`**. Work remains limited to the v2 port, its evidence tooling/tests and
  current Markdown. Legacy `main.js` / `celestial-frontier.html`, `develop`, `main`, the live-site
  repository and every other agent worktree remain untouched.
- **Signed implementation/evidence repair:** exact commit
  **`52ea357f62f5c2f7c1a0d8bd205ec2c7bf3b3576`** (tree
  **`5d1f3caa197aa284a01e86280fb3af5e92dd49ad`**, parent signed exact-source browser checkpoint
  **`d33abdfd513236e72294b81e3bb46b1362f810e1`**) contains an embedded SSH signature. It preserves
  the exact terminal-red report, adds an independent immutable replay, repairs the recovered-worker
  oracle, strengthens stale-receipt controls, clarifies the coupled cap diagnosis, rebinds only the
  live measurement authority and updates affected references. Product/game/build bytes, producer
  authority, fixed rulers, numeric ceilings and the 78-outcome inventory are unchanged.
- **Documentation closure:** the lean handoff/archive update is the direct signed successor to
  `52ea357…`. Resolve its exact current hash with `git rev-parse HEAD`; never overwrite or relabel
  either signed checkpoint.
- **Branch relationship:** `52ea357…` is twelve commits ahead of `origin/openai/mac`; its
  documentation closure adds one local commit. Fetched `origin/develop`
  **`7a9f4c1370dd84292388d718c38ff34214f6203b`** remains an ancestor. Nothing in this batch has
  been pushed.
- **PR boundary:** draft PR **#35** remains **`openai/mac` → `develop`**. Remote head
  **`017fa6decbc41809188768ccdb98ab86ef1b9ebc`** and base
  **`7a9f4c1370dd84292388d718c38ff34214f6203b`** are unchanged; the PR is blocked and unmerged.
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

### Exact terminal red and immutable evidence

Exact clean signed source `d33abdfd513236e72294b81e3bb46b1362f810e1` ran
`20260830-pr35-first-install-d33abdfd5132-compendium-certification` exactly once with zero automatic
retries under accepted Edge `152.0.4191.53` / CDP `1.3`. The run completed in **65,724 ms** with all
78 outcomes present: **74 passed / four failed**, zero blocked. Named verification reproduced that
exact terminal red and exited nonzero. Slice, Glass and Recovery did not run.

The four stored reds were phone/desktop `cap-shrink` and `settled-jobs`. Their product evidence was
healthy in both profiles:

- cache entries shrank **256 → 96**, decoded bytes reached the exact **6,690,816** phone limit and
  **160** assets were disposed;
- all four warm cycles were sealed with 25 cached thumbnails, eight leases, zero queue/active work,
  zero subscribers and no portrait retention;
- phone/desktop final workers were ready/released/balanced at 41/42 starts and disposals, with exact
  phase/result arithmetic, one deliberate cumulative paint control and `lastError:null`;
- post-cap workers were likewise ready/released/balanced at 61/62 starts and disposals, with exact
  nine-stage resource order, restored phone/desktop class, one cumulative paint control and
  `lastError:null`.

Preserved immutable evidence:

- Carrier:
  `audits/ARC1C_COMPENDIUM_PR35_RECOVERED_WORKER_ORACLE_FAILURE_20260830_D33ABDF.json.gz`
- Gzip: **451,743 bytes**, SHA-256
  `4e714e115ca7f4b5d1d32ba118241ca8b78055596438a4dd22bbb1c1d471ffab`
- Raw: **10,813,681 bytes**, SHA-256
  `e4eb2aba1079a1d42b1da5e7f97d236105917fd497035937b1f6855d63a4289e`
- Independent replay: **8/8**, binding exact source/browser/authority, 74/4 ledger, both cap and
  post-cap worker closures, exact resource order and all six review PNG receipts without importing
  the live evaluator or budget.

Historical measurement `e6aba53d75c17669f4bc8893770023c849d4ed23edb6be36eb938f4491e17e97`
and outcome contract `2c751b866ca40fc8e4593dda82d19eb62ca4ff804caffc7531228128b480af21`
remain bound to this red and are not rebound.

### Cause and fail-closed repair

The shared false clause required current worker diagnostics v2 to retain a non-null paint
`lastError` after replacement recovery. That contradicted the producer lifecycle: replacement
correctly clears `lastEvent` and `lastError`, while cumulative `errors.paint === 1` plus exact
thumb/portrait phase and result arithmetic preserves proof of the deliberate negative control.

The repair is narrow and stronger than the original final-only check:

- every selected current-schema snapshot accepted as released/recovered must be `ready`,
  identity-balanced, fully disposed and `lastError === null`;
- a stale receipt on an early non-final selected snapshot and on the post-cap snapshot each fails
  closed;
- the cumulative one-paint-error requirement, exact phase/result arithmetic, contained/recoverable
  producer-error witness, worker identity, canvas count and release proof remain mandatory;
- a terminal current product error still requires its exact non-null trusted receipt; malformed,
  unavailable, stale or mismatched evidence remains instrument-red;
- historical diagnostics v1 remains replayable without inventing a field it never carried;
- `cap-shrink` now names both trim and post-cap recovered-worker closure, so a future worker failure
  cannot masquerade as failed cache trimming;
- creature/genome structure, deterministic art identity, game behavior, cache policy, numeric
  limits, fixed rulers and outcome count are unchanged.

### Current authority and browser-free acceptance

- Browser capability:
  `35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341`
- Compendium measurement:
  `fc54f822dc7f93481fbb1402b7c7940bc9a618b836112fd5514e8130de9f29ed`
- Outcome contract:
  `f756bc7557613dd6c61ecb35acd9de752d54a7d0e51a52e192f361dca3f4ab29`
- Collector:
  `2a74e941abbe701ca5c1d3952a7451ccd11ce3284d794f9e22aa0a79c0315237`
- Producer authority v2:
  `2ef58ea042d2d5ecb97715642efeac14e013dfb8b375406cfb47c090cf072e39`
- Generated service worker:
  `81dca3977138d0973b52e85c0c82b6636674088546463edb136ec64640b78a14`
- Scene build:
  `49bc3ce0529eab7af1dff496c09fb79f08d5ad9e7ab4f1b7a05fc8d2e0d13dfc`
- Active Compendium budget:
  `6ba77f1084d07610ca867cafb76dcae602d9d62f8acf3a6893d9e13db37b40a5`
- Active SceneMemory budget:
  `82166755fac8eea288090bf58845c629f416dd4749ef927327c5f4d346cb539f`
- Compendium selftest: **591/591 independent product/instrument controls pass**.
- Independent carrier replay: **8/8 pass**.
- Full browser-free v2 suite: **239 files / 2,431 passed / 1 skipped**.
- Root, app and worker TypeScript programs: **all green**.
- Independent current-authority printer: SceneMemory budget, Compendium measurement budget and
  Compendium producer budget **all match**.
- Gzip integrity, scoped diff, chronology review and adversarial code/evidence review:
  **green / CLEAR**.
- The superseded first-install handoff was archived byte-verbatim with SHA-256
  `4a0e6497c646f987ed690b61035b063699722b591051796980c51748a4029dbb`.

This is signed browser-free product/instrument authority. It is **not** a fresh Compendium browser
certificate, HUMAN visual acceptance, successor-chain evidence, hosted CI green or merge/release
authority.

### Exact next work — one changed-head attempt, then stop or advance

1. Sign this documentation closure and require a clean worktree. From `port/v2`, run
   `node tools/tracked-input-preflight.mjs`. Then run `npm run compendiummem:selftest`,
   `node tools/compendiummem-browser-preflight.mjs --selftest` and exactly one live
   `node tools/compendiummem-browser-preflight.mjs`. Any nonzero stops the campaign; there is no
   version-triggered rebaseline or automatic retry.
2. From that exact clean signed documentation HEAD, run exactly one fresh Compendium certificate
   with a unique commit-derived run ID and zero retries, then named-verify that exact immutable ID.
   A product-red or instrument-red stops the chain and is preserved before any changed-head repair.
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
5. Report the final full head/base to Nick. Only a new authorization naming that exact pair may
   push, apply `actions-budget-approved`, run the one 92-minute hosted battery and—if
   terminal-green—merge PR #35 normally into `develop`.

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
  the final clean head is ready; include the first-install and recovered-worker oracle repairs,
  preserved red evidence, current full local verification, exact browser-chain result, cross-agent
  synchronization effect and explicit no-release/deployment boundary.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After PR #35 is terminal-green and merged into `develop`, Claude should create or update
  an `anthropic/*` branch from that exact integration commit and perform the requested whole-plan
  polish review.
- **Release status:** `develop`, `main` and the live site remain unchanged. No release, version bump,
  preview publication or deployment is in progress.
