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

## ▶▶▶ SESSION HANDOFF — 2026-08-25 · ARC 5A COMPACT V2 COMMITTED + TERMINAL-GREEN LOCALLY · INFRASTRUCTURE-ONLY ◀◀◀

### Current integration state

- **Current local Arc 5A compact-v2 implementation:** signed local commit
  `526eaa71919d08f37a11515c1a5bb7582f09ea07` on `openai/mac`. Retained Slice and Glass reports
  bind its exact executable/test/tool bytes under source parent `48ce0b1662a59b21070667be339a1e59503e1f19`, dirty-diagnostic
  status SHA-256 `729e139b14a978c39457ed9ab24990b7e1fd3f3bb63fef3efeeca24b45e4fb9f` and working-tree
  SHA-256 `a375f64327e00f9aeaa4e7f46b8f5b4af271aad5230ba301484114520ec8e361`; only audited
  Markdown evidence/handoff bytes changed after those runs. The implementation, focused gates,
  browser tools and retained reports are terminal-green and independently audited clear. This
  ROADMAP-only handoff records the implementation commit locally; that commit remains unpushed, and no
  push is authorized. The reports are not claimed as clean exact-head, hosted, integration or release
  evidence. The sole full-run red remains the
  known deferred Compendium measurement-authority seal (`6a961df8…` stored versus `2ab18865…` live),
  whose exact drift is `packageLock+appPackage`; the dependency graph is not frozen, so no rebaseline
  is valid yet.
- PR #33 merged normally into `develop` as
  `8998ffb77ca5b1f3123d7ea776c41db6e23bd24e` after terminal-green
  `test-battery` run `32646110946` (one attempt, no retry; battery 50m29s).
  The approval label was removed. Arc 1A's Compendium, Arc 1B's explicit scene
  ownership, and Arc 1C's normalized ship state/read-only Shipyard are integrated.
- The terminal run included SceneMemory, Compendium, Slice Smoke, Glass Matrix,
  persona synthesis, and preview packaging. It is integration evidence, not a
  production release, whole-Gate closure, true-GPU-byte measurement, or physical-device
  heat/battery evidence.
- `main`, the production site, and the parked development-preview publisher are
  unchanged. No release, deployment, production version bump, `rnSeen` mutation, preview package,
  publication, or production save-key change occurred.
- PR #34 merged normally as `7a9f4c1370dd84292388d718c38ff34214f6203b` after exact-head,
  one-attempt terminal-green battery run `32681394532` (50m10s). The repair's Compendium 78/78
  certificate/verifier, SceneMemory certificate/verifier, Slice Smoke, Glass Matrix, preview package,
  artifacts, and cleanup all passed; the approval label was removed. This is integration evidence only.

### Remaining Arc 1 evidence

- HUMAN review remains required for Arc 1A's six Compendium list/detail/focus images
  and Arc 1C's phone/desktop ship silhouette and caption readability.
- Real-device iOS/iPadOS/Android/desktop accessibility, heat, and battery evidence
  remain open. Arc 1 does not close Gates C, D, I, or any release gate.

### Approved full-session campaign

Nick directs one local, commit-preserving campaign with no intermediate push or hosted battery.
The final reviewed head—not each batch—will be the next GitHub milestone. The dependency/no-go laws
remain in force.

1. **Session charter and current-doc repair:** record PR #34's terminal merge and make complete,
   current PR descriptions a protocol requirement.
2. **F3 — persistence authority:** revision/CAS semantics, split stores, immutable receipts, v4→v5
   migration/recovery, and the tab lease.
3. **F4 — active-play clock and SessionRNG:** active-play time, ecology edge, Auto-Extractor
   migration, replayable outcome counters, and a complete audited call-site inventory.
4. **Arc 0 dependency closures:** finish each named truth/import/continuity seam at the point it
   blocks later work—especially `MAIN-3` before Arc 4 and `D-CFB-1` before Arc 5.
5. **Arcs 2 → 5:** item instances/readable economy, engineering opportunities, capture/ownership,
   then companions. Each writer lands only after F3/F4 authority and its own real outcome proof.
6. **Arc 7 and Arc 8 core audio:** begin after F4, build deterministic audio identity, mixer,
   lifecycle, accessibility, rights tooling, and current-system soundscape alongside the ownership
   loop. Combat/Guardian audio remains an explicit Arc 6 integration dependency; it cannot be
   certified before those systems exist.
7. **Combined HUMAN review after Arc 5:** run Arc 4.5's first-journey review, Arc 5 attachment
   review, and applicable Arc 7/8 listening/comfort review together. This moves review timing; it
   does not waive any human criterion. Arc 5.5 remains the separate combat-model HUMAN gate before
   Arc 6.

### Local campaign state — player-facing through Arc 4, with Arc 5A authority infrastructure active

- F3/F4 now provide the live v5 split-store/revision/lease authority used by the app: the protected
  `player/f4.authority` carrier persists the visible/answerable active-play clock and SessionRNG,
  and product writers commit state, extension rows, next authority, one immutable receipt, and the
  next revision in one fenced CAS. Random outcomes retain the same plan after a failed write.
  Deterministic Inventory operations reserve only the global receipt ordinal; they do not consume
  or perturb any per-domain RNG counter.
- Arc 2's canonical loot foundation contains all 62 v1.8.9 definitions—20 stackables and 42 slotted
  bases across nine slots—plus the exact six legacy affixes, fixed recipes, salvage rules, legacy
  imbue evidence, inspect/compare/filter projections, and a source-neutral economy trace. That Arc 2
  trace still says `arc3-deferred` instead of inventing a source rate; Arc 3 separately owns the
  live canonical Mine/Skim sources and fixed Engineering settlement described below.
- `inventory/arc2.loot` v1 is the strict exact-instance authority. A bounded legacy hold migrates
  all-or-nothing to `GearInventory` plus stackable counts; capacity/extension-byte overflow remains
  a lossless `legacy-protected` inspection carrier. Corrupt/future/partial carriers fail closed.
  The legacy-v4 `items` / `equip` / `equipAff` fields are now only its compatibility mirror.
- The real Inventory panel is registered in the desktop rail and exact 260px 5×2 ten-control phone
  dock. It has bounded 48-row pages, filters, exact-item detail/comparison with conditional wording,
  pending rewards, focus-owned modal behavior, salvage confirmation, and durable Equip, Unequip,
  Salvage, and pending-claim actions. State publishes only after the one receipt-bearing transaction
  commits; stale, duplicate, protected, storage-failed, and post-durable convergence paths do not
  optimistically mutate the UI or reroll.
- Training replacement is coherent with the new authority. A genuine legacy checkpoint that owns
  gear derives and replaces the Arc 2 carrier in the same checked state/extension/F4 transaction;
  current-view or source-deferred restoration preserves it, and corrupt/future evidence refuses.
  Post-durable publication verifies the committed carrier or reloads without a second write.
- The recorded Arc 2/F3/F4 candidate had focused tests and root/app/worker TypeScript plus Vite
  green. One real `smoke:ci` run is terminal PASS on Edge
  `151.0.4129.101` (`20260824102021537-86225-972f651deaa3`, 239,546 ms, zero findings/retries),
  and one full-certifying Glass Matrix is terminal PASS on the same browser (61,039 ms, 12/12
  viewports, 78/78 planned/executed controls, none blocked/omitted, zero findings/instrument
  failures/retries). Both bind their recorded dirty working-tree inputs; neither certifies the
  current multi-Arc working tree or is exact-head,
  hosted, HUMAN, integration, preview, release, or deployment authority.
- Arc 2 remains **[PARTIAL]** at the program level. Authored natural-affix compatibility/pools,
   crafted modifier/drawback, upgrade/socket, production loot-source and Fabricator/Research policy;
   source/rate and recovery pacing; and phone/desktop HUMAN item/compare readability remain open.
   Those facts are refused or reported unavailable rather than fabricated.
- Arc 3 now has committed product actions and presentation. Canonical full-CF1 world opportunities
  expose finite lifeless-world mining and star skimming at tiers 0–14. The Engineering panel displays
  six research rows, but only **Deep Scanners** is purchasable; its pure orbital-reveal policy exists,
  while the current Survey surface does **not** render orbital mineral rows. The panel lists all 62
  fixed recipes, but only outputs with a connected live effect, exact costs/preconditions and
  capacity/revision headroom are actionable; fully exceptional slotted outputs and disconnected-
  effect rows remain unavailable. Mine, Skim, the eligible Deep-Scanner purchase and eligible fixed
  Fabrication settle from the prior active-play cursor through one F3/F4 lease-fenced receipt/CAS.
  Research preserves valid sparse veteran technology without granting missing prerequisites; legacy
  seed-only cursors require an explicit collision-refusing canonical resolver. One shared product-
  action coordinator prevents overlapping Inventory and Engineering publication. Charter mining and
  fabrication progress banks only from committed outcomes. Authored variable crafting, new random
  loot sources, upgrades/sockets and pacing remain open.

**Arc 3 boot/recovery closure (committed local `c4a02be`, 2026-08-25):** the initial scene render is
always `skipPersist`; rendering alone never authorizes a save. `classifyBootRouteRepair()` compares
the durable saved view and ordered Atlas routes with their source-proven projection, normalizes
semantically omitted false flags, and arms only a real unheld repair. Source-error, protected,
Training-checkpoint, blocked-route and runtime-only Training-seat paths restore the held durable
route before any other bootstrap candidate can carry it. `ensureBootAuthorityCommit()` coalesces an
explicit route repair with F4 seed and Arc 2/3 bootstrap in one lease-fenced commit; an aligned
current-v5 replacement performs zero boot commits and has no pending persistence work. A stale Arc 3
outcome is pre-durable and publishes nothing. Once `commitAction()` reports committed, durability is
terminal: a verification/publication failure makes the old projection unavailable and performs one
read-only convergence reload, never a second derivation, receipt or write.

**Arc 3 recovery/browser evidence (bounded local proof for `c4a02be`, 2026-08-25):** no-retry Slice
Smoke run `20260825013823076-822-b99fea33b17b` passed on Edge `151.0.4129.101` in 253,181 ms with
zero findings/failure scopes, zero retries and ten run-bound screenshots (report SHA-256
`389bc3a857d1da3dc05dd0b20d046e1ec9d73fef9d0dae8220686b87387e76f0`). The following
full-certifying Glass Matrix passed on the same Edge in 64,222 ms across 12/12 viewports and reload
rows, with 78/78 planned controls executed, none blocked/omitted, and zero findings, instrument
failures or retries (report SHA-256
`a3a67426828efb82962a73fdeb2d99c410a575488e8a416c17f75338e296aa57`). Both reports honestly
retain precommit `dirty-diagnostic` provenance against parent `768fb32`: Glass's source digest
reconstructs `c4a02be`, while Slice predates only the final Glass fixture/contract/tool additions;
no app product file changed between them. This is current-source local outcome evidence, not a
same-snapshot clean exact-head, hosted, HUMAN, integration, whole-Gate, release or deployment
certificate.

**Arc 0 `D-CFB-1` kernel (local, 2026-08-24):** legacy `CFB-` remains the exact v1
challenger/exhibit contract; a versioned `CFB2-` owned-creature codec now round-trips one bounded,
ordered uint32 parent tuple while stripping XP, feeding, brood, injury, and other mutable state.
Forward/reverse parents remain distinct, malformed/future/mismatched carriers fail closed, and pure
creatures carry explicit no-lineage state. No companion/share UI is enabled yet.

**Arc 0 `MAIN-3` closure (local, 2026-08-24):** canonical ecology output is no longer truncated
inside its roster owner. `fullWorldRoster` retains every deterministic row; the isolated
`worldRosterView` applies the eight-row cap only to the existing Planetside thumbnail strip and
reports the hidden count. Thirteen-row, short, empty, snapshot, and mutation controls pass. Future
capture/audio targeting must consume the full side, never infer authority from the preview. Arc 4
capture now does so; the rule remains open for audio and later selectors.

**Arc 4 durable foundation (committed local `fd72c06`, 2026-08-25):** absent ownership-v1
carriers now bootstrap into the shared receipt-free F4/Arc 2/Arc 3 boot CAS without granting a
Compendium page, discovery, creature, specimen or reward. Current projectable mirrors reconcile in
that same owned commit; future, corrupt, unrepresentable and legacy-protected states remain exact
and fail closed. Legacy Training composes its one Arc 2 replacement with all 18 Arc 4 namespaces,
and postcommit verification binds the exact source evidence before publishing compatibility fields.
At that committed boundary, the diagnostics-only writer captured the real current surface, canonical address, current ecology
epoch and full roster, certifies a miss plus every eligible hit before either F4 draw, and settles
one finite attempt, ownership successor, legacy projection, receipt, next authority and revision in
one lease-fenced CAS. Misses spend an attempt; first observations alone add catalogue/reward state;
later cycles/worlds may add a new individual or lot without a second page or reward. Pre-CAS retains
only a private pending payload binding the registered plan/settlement identities and full prepared
fingerprint; the committed path alone creates and registers the opaque evidence token against the
exact transaction, kind and revision. Stale/storage/protected paths publish nothing, while
post-durable verification faults clear live authority and perform one read-only convergence reload
without a second write or reroll. This paragraph preserves the committed headless foundation; the
newer local product boundary follows.

**Arc 4 player-facing current local candidate (2026-08-25):** Survey now exposes native
Tame/Scavenge/Sample controls over the exact production writer. The presentation-semantics fence
owns a source-bound uniform random eligible pool—not targeted species selection—and reports the
preview/full-roster counts, aggregate and individual odds, one shared hit-or-miss Biosphere Yield
budget and active-play recovery countdown. A press remains pending and non-optimistic until the one
transaction commits. Hit and miss each spend exactly one attempt; storage refusal, stale authority
and post-durable publication faults converge without a reroll, optimistic grant or second write.
First observations alone add the durable Compendium fact and any eligible first-only Stardust reward; repeats add
only another stable fauna individual or specimen lot. Native Close/reopen, focus and reload use the
same product state. The Guide remains 41 player topics—24 partial and 17 unavailable—with live,
honest Capture/Discover copy. **A New Foundation** has 54 draft bullets. Training remains six
lessons plus graduation with no Capture lesson. There is no Charter bioscan or targeted preview.

The active Arc 5A candidate does not change that presentation. Every Arc 4 hit and miss now requires
aligned current-v2 Arc 5 authority before either draw, prepares the exact 18 Arc 4 plus five Arc 5
replacement writes for every capacity scenario, and publishes verified V1/V2 together only after
the one receipt-bearing CAS commits.

**Arc 5A compact-v2 authority (committed local `526eaa7`, 2026-08-25; infrastructure-only):**
`player/arc5.ownership.migration` is now the version-2 manifest and
`creatures/arc5.ownership.delta.0` through `.3` are exactly four fixed generic delta shards. Every
prepared successor is one exact five-write tuple. The manifest binds the exact Arc 4 source,
canonical delta and reconstructed V2 target; each shard binds its own ordered range/count/digest.
Reads reconstruct `V2 = exact Arc 4 source + exact delta` and require source, delta, target and all
four shard fixed points. Absent authority bootstraps after Arc 4. An aligned legacy-v1 certificate
upgrades receipt-free in the shared one CAS; aligned current-v2 is a strict zero-write fixed point.
Future/corrupt/misplaced/drifted evidence protects, cancels staged boot intent and restores durable
route, Atlas and Arc 2 compatibility fields. Genuine legacy Training composes one Arc 2, 18 Arc 4
and five Arc 5 writes. Capture certifies 18+5 before RNG. The internal V2-only successor outputs
exactly five Arc 5 carriers but is not exported publicly.

The delta contains only changed or V2-exclusive rows, never a second copy of unchanged Arc 4 state.
Source-only Arc 4 growth changes fixed-size manifest evidence while all four canonical empty-shard
bytes remain identical, making the O(1) anti-duplication claim executable. Postcommit verification
binds the exact five prepared bytes to durable source/delta/target/shard evidence before publication;
mismatch makes V1/V2 unavailable and read-only reload-converges without a second write. Breed,
feed/care, Recovery, assignment, disposition, Chronicle, mission/dispatch, companion UI, Guide
capability, Training lesson and release copy remain absent.

**Arc 5A final implementation-input local evidence — terminal green:** the focused compact-v2 gate passed
109/109. Root/app/worker/noUnused TypeScript, `artunused` and the 876-module Vite build passed;
syntax, contract/Glass/reporter selftests, imports and scoped diff checks were clean. The final full
run recorded 102 passing files and one failing file, with 1,218 tests passed, one failed and one
skipped (1,220 total). Focused Compendium was 18 passed/one failed; its selftest passed 222 controls.
The sole known failure is the deferred Compendium measurement-authority seal described above.

No-retry Slice Smoke run `20260825213041239-98104-c96d3b2d0652` passed on Edge
`151.0.4129.101` in 363,053 ms with zero findings/failure scopes/retries/source change. It produced
exactly one ordered nine-stage/14-burn/`recoveryClaimed:false`/`ok` ledger plus PASS and 10 hashed
PNGs. Report/log SHA-256 are
`b19ba6f749cb12e5c8fe23bdc1e779fce8fb04ebbb47653e65313ef2f47784ad` /
`5a5be42cea5a67401472fe214f663ce8ca1bed7b3c6dbccd29b83fd8d1ea9225`.
Full-certifying Glass passed on the same Edge in 71,449 ms with all 12/12 viewport plus reload rows,
95/95 controls and 36/36 Arc 4 outcomes. None were blocked or omitted; findings, instrument failures
and retries were zero. The five-carrier fingerprint, coherent current-v2 corruption and source-growth
four-empty-shard invariance controls were non-vacuous. Glass report SHA-256 is
`c46b81fbac123c1df22b03949e64589bf1d8d52898613efe01c809b840df177e`.

Both browser reports bind the source identity recorded in Current integration state. Frozen tool
SHA-256 are contract `149e3499e549642dca895d80431807d95477662ced09d26a4efb1ffdb2ce22e1`,
Slice `add907d1e2b548ae0c1d1333517da11e960c8d03659935ba2aa38c5bfd865468`, Glass
`b77a4dde5884ef43b6a06c2f2e1797a5476b2ac7e976f9744de4e6b88a9637f5` and reporter
`aeb96bf9f51fcf7c5be3fa4298ae5548c3239e5b1c4852f2af12dc6adbce7ba4`. Independent runtime,
persistence, browser-contract and evidence audits are **CLEAR**. Arc 4 remains **[PARTIAL]** for the
real uninterrupted 20-minute recovery observation and combined HUMAN first-journey/ownership review;
Arc 5 remains **[PARTIAL]** and infrastructure-only. None of this is exact-head, hosted, integration,
HUMAN, preview/publication, release, version or deployment authority.

**Arc 7/8 audio package foundation (local, 2026-08-24; package-only partial):** `@cf/audio` now
owns pure resolver-v1 signature/profile/call-plan data over already-normalized inputs, a pinned
1,014-route/1,010-identity coarse kingdom taxonomy and sound-output witness, distant-ecology and
settled-expression plan seams, an injected five-category mixer/limiter/voice runtime with lifecycle
and diagnostics, a pure two-cycle lab audit, and a pinned empty rights authority/validator. The
committed runtime policy fails closed above the absolute eight-creature/120-node ceiling and uses
an eight/96 default.
These foundations do **not** make audio player-live: the application
still imports only the compatibility stings and calls survey ping/travel whoosh, those stings remain
outside the new runtime's ownership/accounting, and Settings still expose only Sound/Volume.
Canonical creature/event adapters, authored synthesis or licensed content, app/browser integration,
captions/mono/dynamic-range/reduced-intensity controls, byte and device plateaus, combat/Guardian
integration, and every HUMAN listening/comfort judgment remain open. Gate G and Arc 7/8 are not
closed; no recorded audio asset exists. Commit `4e0a976` aligns Guide/release/Training with the
eligible Arc 3 Engineering actions while keeping package-only audio unavailable. Arc 3's bounded
current-source local browser proof is recorded above; audio browser/listening evidence remains open.

### SSH and branch discipline

- Use only the matching app/OS/root/branch row in `PARALLEL_GIT_PROTOCOL.md`;
  Codex macOS is
  `/Users/nick/Projects/celestial-frontier-openai-mac` on `openai/mac`.
  All agent roots use `git@github.com:TheDakk/Celestial-Frontier.git` and their
  local 1Password SSH Agent; no HTTPS/PAT fallback or copied private key.
- Before a machine's first GitHub write, require the exact-root/branch check,
  `ssh -T -o BatchMode=yes -o ConnectTimeout=15 git@github.com` (the expected
  authenticated no-shell exit is 1), and `git ls-remote origin HEAD`.
- The stale `backup/*` and `hotfix/v12-mobile` remote branches were pruned after
  being confirmed merged, unused, and PR-free. Do not delete active
  `openai/*`, `anthropic/*`, `develop`, or `main` branches as cleanup.

### Streamlined GitHub protocol

- `develop` requires a current, terminal-green `battery` check, normal merge
  commits, resolved review threads, and an up-to-date head. It requires neither a
  review count nor the former extra approval for unattributed changes.
- `branch-flow-guard` remains a manual diagnostic workflow, but is not a required
  merge context. Do not dispatch it to unblock a green PR.
- `UNFROZEN` does not itself authorize a hosted attempt. Only after Nick explicitly authorizes one
  exact head/base `test-battery` attempt may the agent apply its approval label. If that exact
  battery is green, the agent removes the label, marks a draft Ready if necessary, and merges
  normally without asking Nick for a second review/guard/merge approval. A red or incomplete
  battery remains a hard stop.
- One authorization remains intentionally explicit: a new hosted attempt for a new
  head. It controls Actions spend; it is not a second merge approval.

### In-session continuation / fresh-session recovery

1. Continue only in the Codex macOS root on `openai/mac`. Arc 5A compact-v2 is signed local commit
   `526eaa71919d08f37a11515c1a5bb7582f09ea07`; this ROADMAP-only handoff follows it. The retained
   evidence binds its exact executable/test/tool bytes under the dirty-diagnostic source
   commit/status/tree and tool/report hashes recorded above; later changes were audited Markdown only.
   Do not fetch/merge, switch branches, push, or run
   GitHub workflows without a new exact authorization.
2. Read this handoff, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`, and
   `GITHUB_ACTIONS_BUDGET.md`; use `port/V2_PROGRAM_ROADMAP.md` §§5.3/5.5 for the Arc 4/5 boundary.
3. Arc 4's native controls, random-pool presentation, current Guide/release copy and automated
   browser outcomes are locally terminal-green. Before calling the Arc complete, run the real
   uninterrupted 20-minute next-cycle recovery observation; do not substitute the 14-step burn-down
   (`recoveryClaimed:false`) for it. Keep the combined HUMAN first-journey/ownership review queued
   after Arc 5 as the approved campaign specifies.
4. Arc 5A compact-v2 authority is implemented, terminal-green locally and independently audited
   clear. Preserve source-bound random-pool semantics, exact stable ownership IDs, the exact-five
   manifest/shard tuple, legacy-v1 one-CAS upgrade, current-v2 zero-write fixed point, 18+5 pre-draw
   capture, O(1) empty-shard invariance and committed-only outcomes. Before exposing breeding, care
   or missions, resolve the still-open product parameters and add the corresponding real-action
   evidence; do not store a second full ownership mirror or expose the internal V2-only bridge. Keep
   Guide/release/Training lesson capability unchanged, do not invent a Charter bioscan or targeted
   preview, and keep audio package-only until its app/content/accessibility/evidence work exists.
   Recalibrate/reseal Compendium only after the final multi-Arc dependency graph freezes.
5. Claude/Anthropic should receive merged work only by fetching `origin` and
   merging `origin/develop` into a clean `anthropic/mac` at its next batch—no
   manual file copying. Nick does not need to open Claude now.

**Current side:** Codex macOS `openai/mac` contains signed local implementation commit
`526eaa71919d08f37a11515c1a5bb7582f09ea07`, recorded by this ROADMAP-only handoff. Retained reports
bind the exact executable/test/tool bytes under the dirty-diagnostic identity above. The implementation
commit remains local and unpushed; this handoff carries no push authority. Arc 5A compact-v2 authority is implemented and locally terminal-green.
Arc 4 remains `[PARTIAL]` for recovery/HUMAN only; Arc 5 remains `[PARTIAL]` and
infrastructure-only.
`origin/openai/mac` remains the contained PR #34 head until a later exact final-head authorization.
**GitHub step:** none.
**PR details:** not needed; the local campaign is still batching and no push/hosted attempt is
authorized.
**Other side:** Anthropic/Claude Code does not have this local Arc 4 player-facing or Arc 5A batch. Nick does not need to
open Claude now; after a future reviewed merge into `develop`, Claude should fetch `origin` and
merge `origin/develop` into a clean `anthropic/mac`, never copy files manually.
**Release status:** `develop` contains Arc 1; `main` and both sites are unchanged.
**Actions budget:** `UNFROZEN`; the repository is public as observed 2026-08-20, while 3,000 remains
the fail-closed cap if it becomes private or billing is ambiguous. PR #34 runs `32665404776` and
`32677088518` remain consumed terminal-red, and run `32681394532` is consumed terminal-green. All
labels are removed; zero new hosted attempts and no push are authorized by this handoff.
