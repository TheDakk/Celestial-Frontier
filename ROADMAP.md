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

## ▶▶▶ SESSION HANDOFF — 2026-08-26 · SLICE RED PRESERVED/REPAIRED · CURRENT COMPENDIUM CERTIFIED ◀◀◀

### Current integration state

- **Current local candidate:** OpenAI/Codex on macOS in the exact owned root
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, tracking
  `origin/openai/mac`. Signed source-freeze commit
  `913a327119465ad1f3df85a682d8d78d1ff35cea` (tree
  `afc95f38c517957e5a5bfa14f011b9461925f3d2`) is the child of
  `35a22b130a65f936769dfcfe88b150f44b4295d9`; the branch is ahead 71 at that clean commit. The final
  pre-policy inventory assigned every one of its 69 implementation/test/budget paths to an
  authorized lane and found no generated report, screenshot, binary, coverage or unrelated file.
  Current references are refreshed in the same batch. The Compendium browser-policy repair adds six owned contract/tool
  paths, bringing the candidate to 75 implementation/test/budget paths plus 23 Markdown/reference
  paths; all 98 were independently audited and committed together with no index/worktree overlap.
  `git verify-commit` reports a good `git` signature for
  `79046704+TheDakk@users.noreply.github.com`, Ed25519 fingerprint
  `SHA256:zEMVsGerZMaUimBJbJwXWrpvRqRitWTIlJZ8NBG8qgk`. Signed descendant
  `6d8f18479cce14dc031608aaa12fca331d1eea20` records that freeze, signed activation
  `d33e540f0d620eac34bdc259b7814db0f11a9006` installs the now-historical Compendium ruler and its
  four retained calibration capsules, and signed evidence descendant
  `8553bd78a2b097dcf65c71f4d47f6815af8ee8c8` preserves its exact certificate. Signed repair/calibration
  source `8ffd2e2b4a8ba070cb93d3df6a8f4a91a245f527`; signed current-ruler activation `91f4e04410b893c43ee5d261ebfc1fa3be127c29` and its local certificate remain unpushed.
- **Integrated non-browser freeze:** all 121 Vitest files are green with 1,358 passing tests, one
  intentional skip and zero failures. Root/app/worker TypeScript, no-unused, the 884-module Vite
  build, all changed-tool syntax/import/selftests, root `validate.js`, its unchanged 50-probe
  determinism fingerprint, and the complete legacy jsdom smoke pass. Independent audits are clear
  for the implementation lanes, integration repairs, Compendium transition and the frozen
  contract/Slice/Glass tool bytes.
- **Compendium's former ruler is certified historical evidence:** clean committed source `6d8f184…` supplied
  independent candidates `20260826-phase4-candidate3`, `20260826-phase4-candidate5` and
  `20260826-phase4-candidate6`, plus paired legacy-product baseline
  `20260826-phase4-baseline1` at exact baseline commit
  `38447019517147319bd08c598202d097ee866874`. Each selected run had one attempt and zero retries.
  Signed activation `d33e540…` binds measurement
  `cb5cd9f86ac99435028f98af800bc0d89de96bd7db88694214d832eed83fb15d`, producer
  `587d3bdfab471370e625c71d1658e391067881fe824ce14ccfaf7200eb6e4d73`, strictly-above rational
  ceilings and the exact 14-phone/13-desktop paired-baseline breach inventory. Compendium's
  version-tolerant v2 authority binds Microsoft Edge family, CDP `1.3`, and sealed capability
  contract `cf-v2-compendium-cdp-capabilities/v1` SHA-256
  `6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476`. Exact product version,
  revision, JavaScript version, executable and user agent are mandatory per-run provenance only;
  phone and desktop samples with the same run ID must bind one exact tuple. Edge auto-update alone
  never triggers rebaselining or alters ceilings, while any real measured breach remains terminal
  red. Exact-budget run `20260826-phase4-certification` then passed 78/78 from clean committed
  activation `d33e540…`, with its named verifier PASS. Its exact Edge
  `151.0.4129.107`/revision/JavaScript/path/UA tuple is provenance only. Report raw/gzip SHA-256 are
  `3afe41034c78c11e1e59eeeff542e00f21a155f99bfc752afea8736a0eddffcd` /
  `5677d9ed26cef8be087a87b61fca49aa0ef22d1dd273ed1993a5880079173d70`. A real
  product-owner/built-producer change prevented rebinding that ruler; it was not an Edge rebaseline.
  Signed source `8ffd2e2…` supplied independent `20260826-slice-repair-candidate1`, `20260826-slice-repair-candidate2` and `20260826-slice-repair-candidate3` plus paired
  `20260826-slice-repair-baseline1`, each one attempt/zero retries. The active current ruler binds
  measurement `cb5cd9f8…`, producer `f7c87f2263bdac4014e5f56be5efc5ceeca7fbd2e32e25549a6b9e0260354224`
  and budget SHA-256 `6284a394664c1039c9aca3f3c6d6dc5caf55295a58f4ac1e361974d3b519de52`.
  It retains all four faults and exact 14-phone/13-desktop inventory; only phone warm changed to
  `524288`. Exact-budget run `20260826-slice-repair-certification` then passed 78/78 from clean signed
  activation `91f4e044…`, with complete lifecycle and named verification in one attempt/zero retries.
  It ran `2026-08-26T23:42:19.150Z`–`23:43:03.997Z` (44,847 ms); report raw/gzip SHA-256 are `81c27ed5caa12e0c114a788041dfc5d109742bb9d86a256b548a8e9443d46108` / `6f3deb0ff3d748c7477c98c094684a3f1a04eb2ac3ffc89a055ec1c372710571`. Edge `.107` is provenance
  only; the unchanged version-tolerant contract does not repin SceneMemory or root Gate A.
- PR #33 remains merged in `develop` as `8998ffb77ca5b1f3123d7ea776c41db6e23bd24e`
  and PR #34 as `7a9f4c1370dd84292388d718c38ff34214f6203b`; their retained hosted/browser evidence remains
  historical integration evidence only; the former Compendium certificate above is separate
  exact-input local proof for `d33e540…` and does not rebind those reports.
- `main`, the production site and the parked development-preview publisher are unchanged. No push,
  hosted attempt, PR update, merge, preview package, publication, release, deployment, production
  version bump, `rnSeen` mutation or production save-key change is authorized or performed.

### Remaining evidence and decisions

- **Source signing and both Compendium certificates are resolved proof:** the source
  freeze, handoff descendant, activation and certificate-evidence descendant are signed; no unsigned
  substitute was used. Signed repair source `8ffd2e2…` supplied the current ruler; signed activation
  `91f4e044…` passed its exact certificate and named verifier. Edge `.101`/`.107` is provenance.
- **Current-input Slice chronology is terminal red and preserved:** one clean one-shot run
  `20260826214541492-83064-b252b137f7a3` against signed source `8553bd7…` on exact Edge
  `151.0.4129.107` ended FAIL after 92,772 ms with three findings and zero retries. Settings expected
  14 instead of the actual 15 pressed controls after Creature Voices, and Arc 3 selected a target
  unreachable at stage 1; both were instrument false reds. Retained Survey Close returned focus to
  canvas instead of its dock opener; that was a product regression. All three are repaired locally,
  but no rerun PASS exists yet.
- **Next evidence, serial/no-retry:** retain and test-bind the certificate, then run repaired Slice,
  full 12-viewport Glass and uninterrupted 1,200,000 ms Arc 4 recovery. Ordinary Slice remains a nonclaim with `recoveryClaimed:false`.
- HUMAN review remains required for Compendium list/detail/focus, ship readability, the combined Arc
  4 first-journey/ownership experience, Arc 5 attachment, and applicable Arc 7/8 listening/comfort.
  Real-device accessibility, heat and battery evidence remain open. No whole Gate or release is closed.

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

### Local campaign state — player-facing through Arc 4 plus one bounded Arc 7/8 Tame expression

- F3/F4 now provide the live v5 split-store/revision/lease authority used by the app: the protected
  `player/f4.authority` carrier persists the visible/answerable active-play clock and SessionRNG,
  and product writers commit state, extension rows, next authority, one immutable receipt, and the
  next revision in one fenced CAS. Random outcomes retain the same plan after a failed write.
  Deterministic Inventory operations reserve only the global receipt ordinal; they do not consume
  or perturb any per-domain RNG counter.
- The current F4 ecology owner no longer publishes from page-residence time. It derives only from
  visible, answerable, lease-owned `activePlayMs`, stages a detached epoch candidate, commits it in
  one receipt-free revision CAS, and only then republishes the global/current scene. Scene, Survey,
  Planetside and capture all consume one prepared roster at the published epoch. Hidden commits defer
  painting until a proven foreground resume; refusal publishes nothing, while a post-durable rebuild
  fault suppresses stale presentation and performs one read-only convergence reload.
- Legacy notification sanitization still maps zero/invalid/negative stamps to the caller-injected
  clock and preserves bounded future stamps. V5 split-to-exact-mirror verification now uses the
  stored split envelope clock, preventing later reads from falsely corrupting an honest migrated
  notification. The legacy `xpf` field remains the newest exact 4,000 keys; strict optional `xpa`
  plus `inventory/progression.xp-firsts` archive authority preserves older membership without
  truncation. This is persistence infrastructure only—there is no player-live v2 XP award writer.
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
  six research rows, but only **Deep Scanners** is purchasable. After that committed research is owned,
  an orbital Survey card renders one escaped, passive `Mineral veins` row in canonical ordinary order
  with the biome vein marked `✦`; it discloses no cosmic/exceptional grade, reserve, progress or Mine
  authority, disappears on the surface, refreshes an already-open card after commit, and reloads from
  the same durable state. The panel lists all 62
  fixed recipes, but only outputs with a connected live effect, exact costs/preconditions and
  capacity/revision headroom are actionable; fully exceptional slotted outputs and disconnected-
  effect rows remain unavailable. Mine, Skim, the eligible Deep-Scanner purchase and eligible fixed
  Fabrication settle from the prior active-play cursor through one F3/F4 lease-fenced receipt/CAS.
  Research preserves valid sparse veteran technology without granting missing prerequisites; legacy
  seed-only cursors require an explicit collision-refusing canonical resolver. One shared product-
  action coordinator prevents overlapping Inventory and Engineering publication. Charter mining and
  fabrication progress banks only from committed outcomes. Authored variable crafting, new random
  loot sources, upgrades/sockets and pacing remain open. Economy replay ordering no longer delegates
  to locale-sensitive `localeCompare`; its explicit UTF-16 code-unit comparator changes no recipe,
  quantity, affix, reward or source policy.

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

The dedicated recovery collector is now implemented and independently audited without changing the
ordinary Slice ledger. It requires a genuinely destroyed target, a distinct reopened document,
zero closed-time credit, 1,200,000 ms of continuously visible/focused/answerable service, exact
pre-boundary exhausted presentation, all-three-row recovery within one honest heartbeat, fixed RNG
and ownership/receipt evidence, one attempt/zero retry, cleanup before PASS, and terminal source/
build/input replay. Its earlier instrument-only run exposed a valid mixed exhausted surface—Tame
`empty`, Scavenge/Sample `depleted`, all disabled—and the repaired classifier now accepts only the
exact stable `empty|depleted` exhausted shape with at least one depleted. **No real repaired recovery
PASS exists yet**; the clean committed 20-minute run remains mandatory.

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
mismatch makes V1/V2 unavailable and read-only reload-converges without a second write. The pure
registered successor now sets only a newly admitted bred child's initial `fed` to
`0.5 * min(clamped parent fed)` with null→0 and preserves all later values; it does not expose a
breeding action or writer. Player breeding, care/feed, Recovery, assignment, disposition, Chronicle,
mission/dispatch, companion UI, Guide capability and Training lesson remain absent; their product
rules are not inferred from legacy destructive behavior.

**Current integrated non-browser evidence (2026-08-26):** the complete v2 suite is 121/121 files,
1,358 passing tests and one intentional skip. TypeScript/no-unused, Vite 884, root validation,
legacy smoke, Compendium 222-control selftest, Arc 4 contract/Slice/Glass/recovery selftests and
scoped diff checks are green. The Compendium budget transition independently rejects stale samples,
invented ceilings, stale baseline state, self-consistent authority drift and premature activation.
Signed activation `d33e540…` and exact-budget run `20260826-phase4-certification` remain historical
78/78 plus named-verifier proof for former producer `587d3bdf…`; report raw/gzip SHA-256 are
`3afe4103…` / `5677d9ed…`. Signed source `8ffd2e2…` supplied fresh candidates 1/2/3 and paired
baseline1 once each with zero retries; active budget `6284a394…` retains all four faults and exact
14-phone/13-desktop discrimination, changing only phone warm to `524288`. Signed activation
`91f4e044…` passed `20260826-slice-repair-certification` 78/78 plus named verification with complete
lifecycle in one attempt/zero retries (44,847 ms; raw/gzip `81c27ed5…` / `6f3deb0f…`). Current-input Slice
`20260826214541492-83064-b252b137f7a3` is the preserved one-attempt/zero-retry 92,772 ms FAIL:
two instrument false reds and one product focus regression, all repaired locally without a PASS
rerun. Glass and recovery results remain pending.

**Arc 7/8 current-system Tame expression (local, 2026-08-26; bounded partial):** `@cf/audio` retains
its pure resolver-v1 identity/profile/call-plan foundation and injected bounded runtime. The app now
adds a strict registered OwnershipStateV2→frozen audio projection and one synthesized, asset-free,
fauna-only oscillator-plus-gain expression request. A trusted native Tame gesture may arm one silent
context only while Sound and Creature Voices are on and the current document is visible/answerable.
Playback claims exactly one event only after a durable committed, non-converging fauna Tame hit,
binds the exact acquired live creature/species and matching acquisition, and requires the visible
assertive capture toast as its registered accessible counterpart. Miss, refusal, stale identity,
route/toast loss, mute/voice-off, hide, convergence, reload and replacement stop or close without
retry/replay. Settings now expose Creature Voices; Sound Off immediately zeros/stops and resolves
the owned context lifecycle without creating one while off.

This is one player-live current-system greeting, **not** Arc 7/8 or Gate G completion. Compendium
audition, distant ecology, ambience/music, premium or licensed assets, mono/dynamic-range/reduced-
intensity controls, combat/Guardian integration, physical-device byte/heat/battery plateaus and all
HUMAN listening/comfort judgments remain open. Current Slice/Glass tool controls for the greeting
are browserless-green and independently audited. The one current-input Slice execution is the
preserved three-finding terminal red above; no repaired PASS or current-input Glass run exists yet.

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

1. Continue only as OpenAI/Codex on macOS in
   `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, tracking
   `origin/openai/mac`, exact SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`. Signed
   product/source freeze is `913a327119465ad1f3df85a682d8d78d1ff35cea`; signed Compendium
   activation is `d33e540f0d620eac34bdc259b7814db0f11a9006`, and signed former-certificate
   evidence is `8553bd78a2b097dcf65c71f4d47f6815af8ee8c8`. Do not fetch/merge, switch branches,
   push, dispatch, release or deploy.
2. Read this handoff, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md` and
   `GITHUB_ACTIONS_BUDGET.md`. Preserve source commit `913a327…`, signed handoff descendant
   `6d8f184…`, signed ruler activation `d33e540…`, signed former-certificate evidence `8553bd7…`,
   and the terminal-red Slice chronology. Do not rebind any of those older artifacts to current
   product bytes.
3. The implementation/reference freeze is browserless-green: 121 files/1,358 tests/one skip, all
   TypeScript/no-unused, Vite 884, root validation/fingerprint/smoke and instrument selftests pass.
   Former producer `587d3bdf…` retains historical c3/c5/c6, baseline1 and 14/13 discrimination.
   Signed source `8ffd2e2…` supplied current `20260826-slice-repair-candidate1/2/3` plus paired
   `20260826-slice-repair-baseline1`, once each/zero retries. Active budget `6284a394…` binds producer
   `f7c87f22…`, retains all four faults and exact 14/13 discrimination, and changes only phone warm
   to `524288`. Signed activation `91f4e044…` passed `20260826-slice-repair-certification` 78/78 plus
   named verification with complete lifecycle in one attempt/zero retries. Compatibility remains Edge family + CDP
   `1.3` + sealed capability hash; exact same-run build fields are provenance, and updates alone
   never rebaseline or change ceilings.
4. **Slice red and repairs:** run `20260826214541492-83064-b252b137f7a3` executed exactly once from clean
   signed `8553bd7…` on Edge `.107`, failed after 92,772 ms with three findings, and was not retried.
   The 14-versus-15 Settings expectation and stage-1-unreachable Arc 3 target were instrument defects;
   Survey Close focus was a product defect. All three are repaired locally, but there is no rerun PASS.
5. Preserve/test-bind the passed current Compendium certificate, then run one repaired current-input
   Slice, one full 12-viewport Glass, and the dedicated uninterrupted 1,200,000 ms recovery
   collector. Do not reinterpret Slice's exact nine-stage/14-burn/`recoveryClaimed:false` ledger as recovery proof.
6. After evidence, substitute exact run IDs, commits, browser/source/report hashes and findings into
   current references and this handoff; keep later documentation-only provenance explicit. Arc 5B
   breeding/care/mission rules,
   broader Arc 7/8 soundscape/assets, physical-device reviews and every HUMAN criterion remain later
   product/review work—not missing implementation to invent now.
7. Claude/Anthropic does not have this local candidate. Nick does not need to open Claude now. Only
   after a future reviewed merge into `develop` should Claude fetch `origin` and merge
   `origin/develop` into a clean `anthropic/mac`; never copy files manually.

**Current side:** OpenAI/Codex macOS — implementation, Slice repairs and Compendium activation remain local/unpushed.
Former certificate is historical; current cert/verifier passed. Slice rerun and Glass/recovery are outstanding. No Edge rebaseline is involved.
**GitHub step:** none. No push or hosted attempt is authorized.
**PR details:** not needed while the local campaign is still batching. A future PR, if authorized,
must use base `develop`, source `openai/mac`, and a refreshed title/body covering the final exact head.
**Other side:** Anthropic/Claude Code does not have these bytes and should not copy or merge them.
Nick does not need to open Claude now.
**Release status:** `develop` contains PR #34; `main` and both sites are unchanged. No release,
deployment, production version bump or publication occurred.
**Actions budget:** `UNFROZEN`; repository visibility is public as observed 2026-08-20, with 3,000
the fail-closed private cap. Zero hosted attempts are authorized and all prior approval labels are
absent.
