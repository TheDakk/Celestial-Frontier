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

## ▶▶▶ SESSION HANDOFF — 2026-08-25 · ARC 4 PLAYER-FACING CAPTURE BROWSER-GREEN · PARTIAL PENDING RECOVERY/HUMAN ◀◀◀

### Current integration state

- **Committed local product/reference snapshot for this handoff:**
  `0d56106bcecf5603f8cfa5fd54da0a36bfd85a27` on `openai/mac`, ahead of its upstream by 64
  commits before this ROADMAP-only handoff commit. Arc 3 recovery remains committed at `c4a02be`;
  Arc 4's strict ownership bootstrap and diagnostics-only durable foundation remain committed at
  `fd72c06`. The player-facing Arc 4 UI, copy, browser contracts and synchronized references are
  committed locally at `0d56106`. The final browser reports predate the docs-only refresh and bind
  status `61fc362e…` plus dirty tree
  `b83ccef544dd3abafe5e661d1fff5f362914385edb7d8a24152d307590f4350f`; independent audits prove
  the executable, test and tool bytes are exactly those committed at `0d56106`. This is not a
  remote, hosted, integration or release milestone. The Compendium measurement reseal remains
  deferred until the final multi-Arc dependency graph freezes.
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

### Local campaign state — player-facing through Arc 4, with Arc 5 still model/certificate only

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

**Arc 4 final local evidence:** no-retry Slice Smoke run
`20260825143239498-59502-655815e34a3e` passed on Edge `151.0.4129.101` in 336,913 ms with zero
findings/failure scopes, zero retries, no source change and exactly one nine-stage ledger/PASS:
precondition, pending-no-optimism, hit, storage-refusal, stale-convergence, miss, burn-down,
disabled-suppression and publication-convergence. It records 14 burn steps and
`recoveryClaimed:false`; report/log SHA-256 are
`4cc6fe02fb6965e4b67baef1d6b90d0a5ac64dff836cdc6416f49d5ad5bbbdde` /
`15683111584df5f1fead034b0b28f0e1a9b9ec96c2eb5cc3978b78c5ca1436b2`.
Full-certifying Glass Matrix passed on the same Edge in 71,713 ms across 12 viewports and 36 Arc 4
outcomes, executing every planned control with none blocked or omitted and zero findings,
instrument failures or retries; report SHA-256 is
`03a14ce5d6228aa8d2659b1b749cea090bc049273b16e3b6a7a4294630a42369`. Both reports bind base
`8633bb48fc89c7ae658fa9ed4a7f47b683be102d`, status
`61fc362edebc5f747143131de7cf4a27a7228a3734f6becb49b2089ca6381cac` and the same dirty tree
`b83ccef544dd3abafe5e661d1fff5f362914385edb7d8a24152d307590f4350f`. Full Vitest records
1,186 passes, one skip and the one known deferred Compendium seal failure; excluding that file,
99 files /1,168 tests pass with one skip. Final source audits are clear. Arc 4 remains
**[PARTIAL]** because the real uninterrupted 20-minute next-cycle recovery observation and combined
HUMAN first-journey/ownership review remain open. None of this is clean exact-head, hosted,
integration, HUMAN, preview/publication, release, version or deployment authority.

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

1. Continue only in the Codex macOS root on `openai/mac`. The committed Arc 4 product/reference
   snapshot is `0d56106bcecf5603f8cfa5fd54da0a36bfd85a27`; this ROADMAP-only follow-up is the current local
   handoff head. The browser evidence binds the same executable/test/tool bytes through recorded
   dirty tree `b83ccef5…`, not a clean exact-head run. Do not fetch/merge, switch branches, push, or
   run GitHub workflows without a new exact authorization.
2. Read this handoff, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`, and
   `GITHUB_ACTIONS_BUDGET.md`; use `port/V2_PROGRAM_ROADMAP.md` §5.3 for the Arc 4 contract.
3. Arc 4's native controls, random-pool presentation, current Guide/release copy and automated
   browser outcomes are locally terminal-green. Before calling the Arc complete, run the real
   uninterrupted 20-minute next-cycle recovery observation; do not substitute the 14-step burn-down
   (`recoveryClaimed:false`) for it. Keep the combined HUMAN first-journey/ownership review queued
   after Arc 5 as the approved campaign specifies.
4. The independent source/docs audits and normal local product commit are complete. Arc 5 may now
   activate its authority against player-live Arc 4 ownership before exposing breeding/companions.
   Preserve source-bound random-pool
   semantics, exact stable ownership IDs and committed-only outcomes; do not invent a Charter
   bioscan or targeted preview. Keep audio package-only until canonical app adapters, content,
   accessibility and browser/device/HUMAN evidence exist. Recalibrate/reseal Compendium only after
   the final multi-Arc dependency graph freezes.
5. Claude/Anthropic should receive merged work only by fetching `origin` and
   merging `origin/develop` into a clean `anthropic/mac` at its next batch—no
   manual file copying. Nick does not need to open Claude now.

**Current side:** Codex macOS is on `openai/mac`, based on merged `develop` `7a9f4c1…`. Arc 4's
durable foundation is committed at `fd72c06`; its audited player UI/copy/tools/references are
committed locally at `0d56106`, followed only by this ROADMAP handoff. Arc 4 remains `[PARTIAL]`
for recovery/HUMAN only; Arc 5 authority activation is the next implementation batch.
`origin/openai/mac` remains the contained PR #34 head until a later exact final-head authorization.
**GitHub step:** none.
**PR details:** not needed; the local campaign is still batching and no push/hosted attempt is
authorized.
**Other side:** Anthropic/Claude Code does not have this local Arc 4 player-facing batch. Nick does not need to
open Claude now; after a future reviewed merge into `develop`, Claude should fetch `origin` and
merge `origin/develop` into a clean `anthropic/mac`, never copy files manually.
**Release status:** `develop` contains Arc 1; `main` and both sites are unchanged.
**Actions budget:** `UNFROZEN`; the repository is public as observed 2026-08-20, while 3,000 remains
the fail-closed cap if it becomes private or billing is ambiguous. PR #34 runs `32665404776` and
`32677088518` remain consumed terminal-red, and run `32681394532` is consumed terminal-green. All
labels are removed; zero new hosted attempts and no push are authorized by this handoff.
