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

## ▶▶▶ SESSION HANDOFF — 2026-08-24 · FULL LOCAL CAMPAIGN · CLEAN BROWSER PROOF NEXT ◀◀◀

### Current integration state

- **Observed committed local snapshot for this handoff:** `HEAD`
  `4e0a976fce5c9380ae9b619762690f66cf2560d4`, branch ahead of its upstream by 57 commits.
  Arc 4 pre-draw/capacity certification is committed at `af12659`, the absolute audio caps are
  committed at `3fd9e81`, and truthful Arc 3 Guide/release/Training guidance is committed at
  `4e0a976`. Only this documentation batch and the browser-tool batch are dirty; the Compendium
  measurement reseal remains deferred until the final multi-Arc dependency graph freezes.
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
  unchanged. No release, deployment, version bump, publication, or save-schema change occurred.
- PR #34 merged normally as `7a9f4c1370dd84292388d718c38ff34214f6203b` after exact-head,
  one-attempt terminal-green battery run `32681394532` (50m10s). The repair's Compendium 78/78
  certificate/verifier, SceneMemory certificate/verifier, Slice Smoke, Glass Matrix, preview package,
  artifacts, and cleanup all passed; the approval label was removed. This is integration evidence only.

### PR #34 Compendium ruler repair

- Runs `32665404776` and `32677088518` are consumed terminal-red, were not retried, and had their
  labels removed. The second exact Linux report proves the first repaired activation succeeded,
  then the Close/reopen activation passed a one-shot row check before a deferred
  ResizeObserver/render turn invalidated its point. A passive 20-second wait issued 112 observations
  and ended on a clipped 51 ms command with a timely root heartbeat. This is a virtual-row
  positioning race, not a memory leak or a 51 ms product SLA.
- The exact report is retained as `audits/PR34_COMPENDIUM_GHA_32677088518_FAILURE.json.gz` with
  raw/gzip SHA-256 `544015e9…` / `cc5ed778…`. The bounded local correction repositions only through
  the existing native-scroll path, consumes a double-render boundary, re-proves thumbnail
  settlement, and requires the same exact owned point before and after that boundary. It then sends
  one press/release and checks the immediate detail receipt; no click retry or timeout widening exists.
- Collector `6d681d19…` changes measurement authority to `6a961df8…`. The former active budget
  `208af955…`, its samples, baseline and local certificate are historical only. Clean repair source
  `a95889d…` produced three independent 78/78 Edge `.101` candidates and the paired legacy baseline
  retained by activation commit `d21ba26…`; no numeric memory ceiling was widened and the baseline
  still breaches 14 phone / 13 desktop fields. Active budget SHA-256 is `faa160b3…`. Exact-budget
  run `20260823-pr34-render-stable-row-certification` then passed 78/78 plus named verification on
  clean `d21ba26…`; raw/gzip report hashes are `42753d5e…` / `a2ff5b00…`. The exact changed head
  then passed terminal-green hosted run `32681394532` and merged in PR #34. No new hosted attempt is
  authorized.

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

### Local campaign state — committed through Arc 3 foundations, with Arc 4/5 seams

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

**Arc 0 `D-CFB-1` kernel (local, 2026-08-24):** legacy `CFB-` remains the exact v1
challenger/exhibit contract; a versioned `CFB2-` owned-creature codec now round-trips one bounded,
ordered uint32 parent tuple while stripping XP, feeding, brood, injury, and other mutable state.
Forward/reverse parents remain distinct, malformed/future/mismatched carriers fail closed, and pure
creatures carry explicit no-lineage state. No companion/share UI is enabled yet.

**Arc 0 `MAIN-3` closure (local, 2026-08-24):** canonical ecology output is no longer truncated
inside its roster owner. `fullWorldRoster` retains every deterministic row; the isolated
`worldRosterView` applies the eight-row cap only to the existing Planetside thumbnail strip and
reports the hidden count. Thirteen-row, short, empty, snapshot, and mutation controls pass. Future
capture/audio targeting must consume the full side, never infer authority from the preview.

**Arc 4 capture foundation (committed local, 2026-08-24; no product writer yet):** the canonical
full roster, exact epoch ownership, capture-contact capability, 18 owner namespaces, strict
ownership-v1 codecs, a source-proven acquisition snapshot, and a pure capture planner now exist.
They do not bootstrap a save carrier, spend a biosphere attempt, mutate ownership or Compendium,
write a capture receipt, expose a capture button, or prove reload/UI/browser outcomes. Commit
`af12659` adds the pre-draw/capacity all-scenario certification and settlement prerequisite. That
prerequisite is committed; it is not a durable capture writer, save bootstrap, product UI or
browser certification.

**Arc 5 ownership seam (committed local, 2026-08-24; model/certificate only):** ownership-v2 defines
receipt-bound capture, deterministic fauna-only bred-child successors with ordered parent evidence,
and tombstone/disposition consistency. The additive `player/arc5.ownership.migration` certificate
binds a digest of a freshly imported Arc 4 carrier; it deliberately stores no duplicate ownership
bytes. There is no v2 ownership writer, product migration, breed/companion UI, assignment, care,
mission or dispatch capability yet.

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
eligible Arc 3 Engineering actions while keeping package-only audio unavailable. Clean current-
source Smoke/Glass browser certification remains pending.

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
- While `GITHUB_ACTIONS_BUDGET.md` is `UNFROZEN`, Nick authorizes one exact
  changed-head `test-battery` attempt. After that exact battery is green, the
  agent removes the label, marks a draft Ready if necessary, and merges normally
  without asking Nick for a second review/guard/merge approval. A red or incomplete
  battery remains a hard stop.
- One authorization remains intentionally explicit: a new hosted attempt for a new
  head. It controls Actions spend; it is not a second merge approval.

### In-session continuation / fresh-session recovery

1. Continue only in the Codex macOS root on `openai/mac`. The local campaign worktree is intentionally
   dirty only for the browser instruments and current-doc batch; do not fetch/merge, switch branches,
   push, or run GitHub workflows over it.
2. Read this handoff, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`, and
   `GITHUB_ACTIONS_BUDGET.md`; use `port/V2_PROGRAM_ROADMAP.md` §5.3 for the Arc 4 contract.
3. Freeze the browser tools/docs inputs, then run one clean no-retry Slice Smoke followed by one
   clean Glass Matrix. Review those reports and commit the browser tools plus this docs batch.
4. Only after that browser/docs commit, continue Arc 4 in dependency order: bootstrap the ownership
   carrier, land one durable capture
   writer with exact failed-attempt and post-commit outcomes, then expose truthful UI and browser
   proof. Only after that may Arc 5 consume receipt-bound ownership for breeding/companions. Keep
   audio package-only until canonical app adapters, a runtime owner, content, accessibility and
   browser/device/HUMAN evidence exist. Recalibrate/reseal the Compendium measurement authority only
   once the final multi-Arc dependency graph is frozen.
5. Claude/Anthropic should receive merged work only by fetching `origin` and
   merging `origin/develop` into a clean `anthropic/mac` at its next batch—no
   manual file copying. Nick does not need to open Claude now.

**Current side:** Codex macOS is on `openai/mac`, based on merged `develop` `7a9f4c1…`, with the
commit-preserving local campaign ahead and the Arc 4 prerequisite/current-truth batches in progress.
`origin/openai/mac` remains the contained PR #34 head until a later exact final-head authorization.
**GitHub step:** none.
**Release status:** `develop` contains Arc 1; `main` and both sites are unchanged.
**Actions budget:** `UNFROZEN`; PR #34 runs `32665404776` and `32677088518` remain consumed
terminal-red, and run `32681394532` is consumed terminal-green. All labels are removed; no new
hosted attempt is authorized by this handoff.
