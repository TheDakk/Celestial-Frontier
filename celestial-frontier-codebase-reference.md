# Celestial Frontier — Codebase Reference (legacy v1 + current v2 reset overlay)

> A complete technical reference for the game, written so any future session can pick up
> full context without re-reading the source. When in doubt, source wins. The long-form
> sections below mirror the legacy v1 architecture; dated overlays record current port/v2
> boundaries until the port replaces those sections completely.
> **Current port/v2 source overlay matches the local working tree as of 2026-08-26.**
>
> **2026-08-26 local candidate overlay — implemented source lanes; three preserved Slice reds and a
> certified active Compendium ruler:** Gate B's
> recursive scanner now seals an exact 62-domain-source inventory against DOM, storage,
> `navigator`, network, wall/monotonic clock and uncontrolled randomness. Its only two reasoned
> waivers are the exact `document.createElement('')` expressions used by CombatCore's legacy
> `playerAvatar` and
> `paperdollAvatar` canvas painters; duplicate, reason/matcher drift and injected forbidden-access
> controls fail closed. D-HAZE is no longer a domain exception: `galaxyHaze` and its cache moved
> byte-for-byte from WorldGen to the app-owned `GalaxyArt` layer, with main/html/lifter parity and
> package-edge controls. `search-travel.ts` now owns Search, CF1 travel, native-keyboard lifecycle,
> Compendium continuation/focus and boundary notices. `app-chrome.ts` owns topbar, dock, context,
> hint and viewport/observer lifecycle. `main.ts` remains their rendering and persistence adapter.
>
> F4 now owns the active-play ecology-epoch stage/commit/reject edge, blocks ecology during a
> transition, coalesces the accepted edge into the ordinary checkpoint and refreshes projections
> only after commitment. The import/persistence boundary now preserves three formerly exposed
> seams: injected-clock notification stamps normalize to a fixed point, missing `conq[].e` becomes
> exactly one legacy-ready cycle and all values clamp to `[0, EPOCH_BASE]`, and more than 4,000
> legacy XP-first keys survive through the paired v4 `xpa` binding plus v5
> `progression.xp-firsts` overflow authority without rearming an award.
>
> Deep Scanners now has a live, source-addressed Survey consumer. On the exact eligible scanned,
> registered lifeless non-Earth world it adds one **Mineral veins** row in deterministic ordinary
> deposit order plus the biome marker, while withholding cosmic/exceptional veins, grade, reserves,
> progress and the grounded Mine action. A strict presentation projector maps raw deterministic
> rarity integers 0–14 onto the player-facing 0–9 vocabulary; malformed input discloses nothing,
> and Survey/Compendium consumers use that one conversion. Arc 5's compact model also implements
> the approved child-care invariant: each new bred child receives exactly
> `0.5 * min(clampedLeftFed, clampedRightFed)`, symmetrically and once. No public breed/care writer
> or companion UI exists yet.
>
> Arc 7/8 has crossed one deliberately narrow app boundary. `audio-identity-projector.ts` resolves
> only an exact current registered owned creature into the deterministic signature/profile/call
> plan, excluding mutable XP/hurt/fed/brood state. The app owns the five-bus fail-closed runtime,
> persisted **Creature Voices** setting and an asset-free bounded fauna renderer. Only a native
> Tame gesture followed by the exact durable, nonconverging fauna acquisition and its accessible
> status counterpart may emit one greeting, keyed once to the acquisition record. Mute, Creature
> Voices off, hidden/unanswerable play, miss/refusal, stale or reload convergence, route/counterpart
> loss, replacement and disposal remain silent and synchronously release the audio/runtime owner. Other creature
> actions, ambience, music, combat/Guardian audio, recorded assets, full accessibility/device
> plateaus and HUMAN listening remain open.
>
> The dedicated real-time Arc 4 recovery collector and mutation-sensitive selftest are ready, but
> the uninterrupted real 20-minute certificate has not run. The former Compendium ruler under
> measurement authority `cb5cd9f86ac99435028f98af800bc0d89de96bd7db88694214d832eed83fb15d`
> and producer authority `587d3bdfab471370e625c71d1658e391067881fe824ce14ccfaf7200eb6e4d73`
> remains truthful historical evidence.
> Clean committed source `6d8f184…` supplied selected candidate3/5/6 plus paired baseline1; signed
> activation `d33e540…` retains exact 14-phone/13-desktop baseline discrimination. Its exact
> Arc-local v2 browser authority is Microsoft Edge family + CDP `1.3` + sealed capability contract
> `cf-v2-compendium-cdp-capabilities/v1` (SHA-256
> `6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476`). Exact product version,
> revision, JavaScript version, executable and user agent are mandatory per-run provenance only;
> phone/desktop samples sharing a run ID bind the same tuple. Edge auto-update alone never
> rebaselines or moves ceilings, and a real observed breach remains red. Exact-budget run
> `20260826-phase4-certification` passed 78/78 plus its named verifier on exact Edge
> `151.0.4129.107`, whose full build tuple is provenance only. Report raw/gzip SHA-256 are
> `3afe41034c78c11e1e59eeeff542e00f21a155f99bfc752afea8736a0eddffcd` /
> `5677d9ed26cef8be087a87b61fca49aa0ef22d1dd273ed1993a5880079173d70`. A real
> product-owner/built-producer change—not Edge `.107`—required current-product calibration.
> Signed source `8ffd2e2b4a8ba070cb93d3df6a8f4a91a245f527` supplied independent
> `20260826-slice-repair-candidate1`, `20260826-slice-repair-candidate2` and
> `20260826-slice-repair-candidate3` plus paired `20260826-slice-repair-baseline1`, each one attempt
> and zero retries. The active ruler binds the same measurement authority, current producer
> `f7c87f2263bdac4014e5f56be5efc5ceeca7fbd2e32e25549a6b9e0260354224`, and budget-file SHA-256
> `6284a394664c1039c9aca3f3c6d6dc5caf55295a58f4ac1e361974d3b519de52`. It retains all four sealed
> baseline faults and exact 14-phone/13-desktop breach discrimination; only the phone warm ceiling
> changed to `524288`, with every other numeric ceiling unchanged. Exact-budget run
> `20260826-slice-repair-certification` passed 78/78 from clean signed activation source
> `91f4e04410b893c43ee5d261ebfc1fa3be127c29`, with complete lifecycle and named verification in one
> attempt/zero retries. It ran `2026-08-26T23:42:19.150Z`–`23:43:03.997Z` (44,847 ms) on Edge
> `151.0.4129.107`, revision `@419e77616b4ed7d0a544b85cb53ccd5b74d5f135`, JavaScript
> `15.1.23.12`, CDP `1.3`; that build tuple is provenance only. Raw/gzip report SHA-256 are
> `81c27ed5caa12e0c114a788041dfc5d109742bb9d86a256b548a8e9443d46108` /
> `6f3deb0ff3d748c7477c98c094684a3f1a04eb2ac3ffc89a055ec1c372710571`. This Compendium-only activation does not alter SceneMemory or the
> root Gate-A browser contract.
>
> Browser-free verification for these local bytes is green: 122 test files, 1,362
> passed, one intentional skip and zero failures; `root/app/worker/noUnused` TypeScript; an
> 884-module Vite build; root validation with the unchanged 50-probe fingerprint; legacy jsdom
> smoke; and the applicable contract, reporter, Glass, recovery and Compendium selftests. Current-
> input Slice has three preserved one-attempt/zero-retry reds on Edge `151.0.4129.107`. Run
> `20260826214541492-83064-b252b137f7a3` at signed source `8553bd7…` failed after 92,772 ms with
> Settings and unreachable-target instrument false reds plus the retained-Survey focus product
> regression. Changed clean signed source `9d4b2b0…` supplied run
> `20260827000034983-98202-869d966f2f88`, which failed after 92,566 ms with only the Arc 3 harness
> finding. Settings and Survey focus are outcome-cleared; the reachable target exposed a second
> instrument defect whose oracle combined system navigation with nav-owned planet identity even
> though the selected world is card-owned. Clean signed source `8a23e22…` then supplied run
> `20260827025804458-2742-c0c871ee52b6`, which failed after 93,582 ms with three findings from one
> instrument lifecycle cascade: the retained Survey card intentionally hid the right rail, but
> Slice attempted zero-rect `railshipyard` before yielding it. The third run outcome-clears the
> card-context repair; Deep Scanners and every later stage did not run, and the lifecycle repair is
> unrerun. No
> current-input Slice PASS, Glass result or recovery certificate exists. There is no hosted, HUMAN,
> whole-Gate, release, version,
> preview/publication or deployment claim.
>
> **2026-08-25 Arc 3–5 + Arc 7 historical checkpoint — retained as foundation where the
> 2026-08-26 overlay does not supersede it:** `@cf/domain-opportunity`,
> `arc3-engineering-actions.ts`, `engineering-panel-model.ts`, `engineering-panel.ts`, and
> `product-action-coordinator.ts` now own full-CF1 finite world/star opportunities and the live
> Mine/Skim and eligible fixed-Engineering path. The panel displays six research rows but only Deep
> Scanners was purchasable. Its pure orbital-reveal policy existed, while that checkpoint's Survey rendered no
> orbital mineral rows. The panel lists all 62 fixed recipes, but only connected-effect outputs with
> exact costs/preconditions and capacity/revision headroom are actionable; fully exceptional slotted
> outputs and disconnected-effect rows remain unavailable. One transaction commits Cargo/items/technology, Arc 2/3
> carriers, compatibility mirrors, Charter mine/fabrication progress, F4 authority, receipt and
> revision; publication follows durability.
>
> `boot-route-repair.ts` owns the pure route-persistence classifier. Initial scene publication uses
> `rerender({skipPersist:true})`; rendering cannot mint write intent. A source-proven semantic delta
> in durable saved view or ordered Atlas routes may arm one explicit route repair, coalesced with F4
> seed and Arc 2/3/4/5 bootstrap by `ensureBootAuthorityCommit()`. Protected, source-error, blocked-route,
> Training-checkpoint and runtime-only Training-seat paths restore held durable route bytes before an
> unrelated bootstrap candidate exists. An aligned current-v5 replacement performs no boot commit.
> Arc 3 stale outcomes refuse before durability; after `commitAction()` reports committed, any
> verification/publication failure is a committed action that suppresses the stale live projection
> and converges through one read-only reload—never a second derivation, receipt or write.
>
> Arc 5A stages only after the exact Arc 4 source fixed point. `prepareArc5OwnershipMigration()`
> creates the version-2 manifest plus exactly four fixed generic delta shards, upgrades an aligned
> legacy-v1 certificate through one receipt-free CAS, or loads an aligned current-v2 zero-write fixed point. A protected
> future/corrupt/misplaced/source-drift outcome cancels all earlier boot candidates and restores the
> durable saved view, ordered Atlas routes and Arc 2 `items`/`equip`/`equipAff` mirror before runtime
> creation. `main.ts` exposes this non-player state only through `state().ownershipV2` diagnostics.
>
> Arc 4's current local boundary adds `arc4-capture-capacity.ts`, `arc4-capture-action.ts`, and the
> `main.ts` adapter to `fullWorldRoster`, explicit epoch ownership, capture-contact capability,
> acquisition snapshot/planner and the 18-namespace ownership-v1 codec. Boot migrates an absent
> carrier or reconciles a projectable current mirror inside the shared receipt-free CAS; protected,
> future, corrupt or unrepresentable evidence never rewinds. A genuine legacy Training completion
> derives one Arc 2, all 18 Arc 4 writes and all five Arc 5 carrier writes from the final candidate.
> `prepareTrainingArc5Restore()` preserves aligned authority, keeps source-deferred absence
> explicitly write-free, and protects ambiguity; `committedTrainingArc5State()` binds the five newly
> written carriers and their source/delta/target/shard fixed points to the exact durable Arc 4 source
> before V1/V2 publication.
>
> The native Survey-card Tame/Scavenge/Sample adapter captures exact current nav/address, the
> production full roster and current epoch. Its registered all-scenario certificate prepares the
> miss and every eligible hit as a complete save before either capture-domain draw. The selected
> hit or miss spends one Biosphere attempt and commits the 18 Arc 4 replacements plus five Arc 5
> carrier replacements, compatibility fields, next F4 authority, one immutable receipt and
> revision in one CAS. `prepareArc5OwnershipMigrationSuccessor()` admits only the exact registered
> Arc 4 successor at the next revision and uses the internal-only
> `@cf/domain-acquisition/ownership-v2-internal` bridge; that
> subpath is absent from the public package root. `prepareArc5OwnershipV2Successor()` likewise emits
> exactly five carriers for future V2-only mutations, but has no public or app player entry point.
> The compatibility projection includes
> exact full `codex`, owned `c*` custom-name fields, `bioX` and `scout`. First-species catalogue/reward facts are
> one-time; an eligible repeat may create another stable fauna instance or specimen lot. Independent
> verification sees only a private pending payload of registered plan/settlement identities and
> prepared fingerprint before durability. The committed path mints the evidence token and performs
> the sole WeakMap registration, binding that payload to the exact transaction/kind/revision. The
> verifier then requires the full prepared save before targeted publication; failures converge by
> reload without reroll or second write. `capture-card.ts` presents a source-bound uniform random
> eligible pool—not targeted species selection—with preview/full counts, aggregate and individual
> odds, one shared hit-or-miss Biosphere Yield, active-play recovery, pending non-optimism and
> native Close/reopen/focus behavior. Guide Capture/Discover copy is live/partial within the current
> 24-partial/17-unavailable inventory; **A New Foundation** contains 54 draft bullets. Training
> remained six lessons plus graduation with no Capture lesson. The historical exact-input Slice passed the exact
> nine-stage capture ledger in 336,913 ms (report
> `4cc6fe02fb6965e4b67baef1d6b90d0a5ac64dff836cdc6416f49d5ad5bbbdde`, 14 burn steps,
> `recoveryClaimed:false`); Glass passes 12 viewports/36 Arc 4 outcomes with every planned control
> and no omissions in 71,713 ms (report
> `03a14ce5d6228aa8d2659b1b749cea090bc049273b16e3b6a7a4294630a42369`). Both bind base
> `8633bb48fc89c7ae658fa9ed4a7f47b683be102d`, status `61fc362e…` and exact-input dirty tree
> `b83ccef544dd3abafe5e661d1fff5f362914385edb7d8a24152d307590f4350f`. The uninterrupted
> 20-minute recovery observation and HUMAN review remain open; no Charter bioscan, targeted
> preview, hosted, release/version, `rnSeen` or preview/publication authority is claimed. Arc 5A now
> activates the receipt-bound compact ownership-v2 representation across boot, Training and capture.
> The manifest binds the exact Arc 4 source, canonical delta and reconstructed target while the four
> shards store only deterministic changed/V2-exclusive rows. Source-only growth leaves all four
> canonical empty-shard bytes unchanged, explicitly preventing an Arc 4 duplicate and keeping
> unchanged-state growth O(1). Postcommit verification publishes V1/V2 together or makes both
> unavailable and reload-converges. There is no public breed/care/mission writer or companion UI.
> Arc 7 has pure identity/taxonomy/ecology/expression,
> an injected runtime, lab and empty-rights validator; it is not app-owned playback. Its absolute
> eight-emitter/120-node configuration caps are committed package policy.
> Retained Arc 4 browser reports predate compact Arc 5 V2. The historical exact-input Slice run
> `20260825213041239-98104-c96d3b2d0652` passed once on Edge `151.0.4129.101` in 363,053 ms with
> zero findings/retries/source change, one exact nine-stage/14-burn/`recoveryClaimed:false`/`ok`
> ledger plus PASS, 10 hashed PNGs and executable Arc 5 fixed-point/successor/fault/reload controls
> (report/log SHA-256 `b19ba6f749cb12e5c8fe23bdc1e779fce8fb04ebbb47653e65313ef2f47784ad` /
> `5a5be42cea5a67401472fe214f663ce8ca1bed7b3c6dbccd29b83fd8d1ea9225`). Glass passed on the same
> Edge in 71,449 ms with 12/12 viewport plus reload rows, 95/95 controls, 36/36 Arc 4 outcomes and
> zero blocked/omitted/findings/instrument failures/retries; its Arc 5 `targetDigest` corruption and
> durable-projection controls were non-vacuous (report SHA-256
> `c46b81fbac123c1df22b03949e64589bf1d8d52898613efe01c809b840df177e`). Both bind source commit
> `48ce0b1662a59b21070667be339a1e59503e1f19`, status
> `729e139b14a978c39457ed9ab24990b7e1fd3f3bb63fef3efeeca24b45e4fb9f` and working tree
> `a375f64327e00f9aeaa4e7f46b8f5b4af271aad5230ba301484114520ec8e361`; audits are CLEAR.
>
> **2026-08-24 F3/F4 + Arc 2 implementation overlay — historical foundation, still current where
> the newer overlay does not supersede it:**
> `packages/domain/loot` now owns the recursively frozen 62-definition catalogue (20 stackable,
> 42 slotted across nine slots), ten-tier vocabulary, six literal legacy affixes, strict
> `GearInstance`/`GearInventory` codecs and transitions, fixed recipe/graph/salvage audits, pure
> legacy-imbue evidence, inspect/filter/conditional-compare projections, and a source-neutral
> economy trace. Stable instance identity is source-action + receipt-local ordinal. Generated plans
> accept only bounded authored axes; crafted modifiers/drawbacks, upgrades and sockets reject until
> their named tables exist. The economy trace accepts only version-matched external source receipts
> and reports `arc3-deferred` rather than inventing a production faucet, rate or ETA.
>
> `packages/persistence/src/arc2-loot.ts` owns `inventory/arc2.loot` v1. A supported carrier is
> complete `GearInventory` plus stackable counts or lossless `legacy-protected` source facts when
> exact expansion exceeds capacity/extension-byte authority. It never publishes a prefix;
> corrupt/future/unknown/over-bounds evidence remains protected. The carrier is authoritative and
> `projectArc2LootLegacyMirror()` derives the compatibility-v4 `items` / `equip` / `equipAff` view.
> V5 continues to split the canonical v4 envelope into owner rows with exact source snapshot/journal,
> revision and bounded extension namespaces.
>
> `outcome-transaction.ts` is the shared F3/F4 product assembly owner. It detaches state/extensions,
> rejects product writes to protected `player/f4.authority`, applies product namespaces, prepares the
> next active-play/SessionRNG authority, serializes one complete save and submits product + immutable
> receipt + next revision under the lease fence. Random plans retain their draw after failure.
> Equip/Unequip/Salvage/pending-claim use its no-RNG sibling, advancing only the global ordinal and
> preserving seed/domain counters byte-for-byte.
>
> `apps/game/src/inventory-panel.ts` owns the 48-row bounded panel/detail/modal projection;
> `inventory-actions.ts` owns only the exact legacy compatibility edits implied by a successful
> domain action. `main.ts` registers Inventory in the desktop rail and exact 260px 5×2 ten-control
> phone dock, supplies one durable action adapter, and publishes no optimistic state. The detail
> sheet owns inert background, bidirectional focus wrap/return, exact conditional comparison,
> salvage confirmation, pending action and convergence diagnostics. Genuine legacy Training gear
> replacement derives the Arc 2 carrier and, for absent Arc 4/5 targets, all 18 Arc 4 ownership
> writes plus all five Arc 5 carriers inside the same checked state/extension/F4 transaction.
> Current-view preserves aligned authority; source-deferred restore may retain an aligned Arc 5
> projection or preserve explicit absence without a write. Existing/future/corrupt ownership
> authority refuses rewind. Post-durable verification binds the committed canonical state's exact
> migrated Arc 4 source, five Arc 5 bytes and reconstructed source/delta/target/shard fixed points;
> publication failure reloads without a
> second write.
>
> For the recorded pre-current-WIP Arc 2 candidate, focused Arc 2/F3/F4 checks plus all TypeScript
> programs and the Vite build passed. Its no-retry local Slice Smoke and full Glass Matrix reports
> were terminal PASS on Edge `151.0.4129.101`; both bind that recorded candidate's dirty inputs. In
> that recorded candidate, the full suite's sole deliberate red was the Compendium measurement-
> authority mismatch scheduled for one final multi-Arc reseal. This evidence does not certify the
> current moving working tree. Authored random-loot sources/rates/affix compatibility/richer construction, pacing and HUMAN
> item/compare art remain open. No hosted/integration, preview, Gate, version, release or deployment
> authority follows.
>
> **2026-08-25 Arc 3 historical exact-input local evidence:** commit `c4a02be` contains the boot/recovery
> product and instruments. No-retry Slice Smoke run `20260825013823076-822-b99fea33b17b` passed on
> Edge `151.0.4129.101` in 253,181 ms with zero findings/failure scopes, zero retries and ten
> run-bound screenshots; its report SHA-256 is
> `389bc3a857d1da3dc05dd0b20d046e1ec9d73fef9d0dae8220686b87387e76f0`. Full-certifying Glass
> Matrix passed on the same Edge in 64,222 ms across 12/12 viewports and reload rows, with 78/78
> controls executed, none blocked/omitted, and zero findings, instrument failures or retries; report
> SHA-256 is `a3a67426828efb82962a73fdeb2d99c410a575488e8a416c17f75338e296aa57`. Both reports are
> precommit dirty diagnostics against `768fb32`; Glass reconstructs `c4a02be`, while Slice predates
> only final Glass-only fixture/contract/tool additions and no intervening app-product change. This
> is bounded historical exact-input local evidence, not a same-snapshot clean exact-head, hosted, HUMAN,
> integration, whole-Gate, release or deployment certificate.
>
> **2026-08-22 Arc 1C ship/surface implementation and SceneMemory v2 overlay (historical pre-Arc-2 source):**
> clean product/ruler `a4de5007ffc9131b8bc952a0a4cb469d9139039e` adds
> `packages/scene/src/ship-visual-state.ts`. Its pure `shipVisualStateOf()` accepts only normalized
> `items`, `ascCh`, and an injected livery seed, delegates chassis selection to `ascStageOf`, and
> returns a recursively frozen projection. Installed ids are filtered in exact order
> `jumpdrive,array,igdrive,autoext,cscoop`; visible hardpoints are exactly `array`, `autoext`, and
> `cscoop`; app livery authority is `0x5111`. Only stage 3 from terminal `ascCh` without an owned
> `igdrive` receives `legacy-charter-refit`; nonterminal chapter state, equipment, affixes,
> Research and art cannot mint capability.
>
> `apps/game/src/shipyard-preview.ts` owns deterministic code-native SVG composition for four
> chassis silhouettes, exact hardpoint groups, livery, truthful ARIA text, and an idempotent
> `ShipyardPreviewOwner.open/replace/dispose` lifecycle. There is at most one owned DOM/SVG preview;
> the implementation creates no Pixi application, second renderer, `RenderTexture`, filter,
> particle or asynchronous preview job. `apps/game/src/main.ts` exposes the state at
> `state().shipVisual`, the owner census at `api.shipyardDiagnostics()`, and a read-only registered
> Shipyard panel from the desktop right rail and Arc-1C-era exact 260px 5×2 nine-control dock. The
> panel lists chassis/provenance, exact installed systems and fitted/open hardpoints, then states
> that Fabrication, Research and ship upgrades are unavailable. Close disposes the preview.
>
> `SurfacePlanetTextureAttachment` in `apps/game/src/planet-texture-attachment.ts` names the displayed surface-HD attachment owner
> without coupling that owner to Pixi. A requested successor cannot replace its predecessor until
> identity, lease acquisition, target attachment, and actual TextureSource square backing prove
> the tier. Stale, undersized, throwing, rollback and release-failure paths retain or clean exact
> ownership, and a rejected tier remains retryable. Snapshot evidence includes the currently
> attached backing width/height rather than trusting requested-tier bookkeeping.
>
> Slice Smoke and Glass open/read/close the real Shipyard, compare DOM/state/canonical ids, require
> one preview while open and zero retained after close, and cover the nine-control phone dock,
> geometry, safe areas and real `:focus-visible` paint. The standalone SceneMemory route appends the
> same real Shipyard leg and settles at zero preview work. Historical activation/certification source
> `59530da3bf40965adf9c54f169b310e11ccdd0f8` bound the original 250 ms per-target
> `budgets/scene-memory-v2.json` SHA-256
> `3b71d14ca297ec4d536669d2edf960ac4d01671dd7a0c9eb11a2fb76e4fc43f7`.
> Its one-attempt/no-retry local run `20260822-arc1-local-certification` passed all 42/42 outcomes
> and its named verifier under Edge `151.0.4129.101`; that certificate remains historical and is
> not rewritten or promoted. Clean cross-host SLA repair
> `7d8dc380cd89ef53aac5a11c3850316e19e1aae9` binds the active 1,000 ms budget SHA-256
> `5c8a6e7568e02d4e31501e4188dba57d3ac6e6ad183882b98ff9c68170771501`.
> Its one-attempt/no-retry local run `20260823-pr33-cross-host-sla-certification` passed exact 42/42,
> complete lifecycle/cleanup, empty findings/fatals, and its named verifier under the same exact Edge
> `.101`. Raw report SHA-256 is
> `d16d40cd4d07f96683490eab920072fb9f3b42e0d0ee54434ffd4d312223f960`; deterministic gzip SHA-256
> is `7c4100244abef8d50f93178aab7c8579ae93fa0b6bef76422cc5c0523edac55a`.
> Hosted run `32618995487` remains terminal-red at 40/42 and establishes no hosted authority. The
> repair changes only measurement and fail-fast workflow order; product behavior is unchanged.
> This documentation descendant does not retroactively make its HEAD the certified source. Hosted
> terminal-green integration, HUMAN silhouette judgment, Cargo/Forge,
> Fabrication/Research/upgrades, richer preview/art work, release and deployment remain open.
>
> **2026-08-21 Arc 1B scene-resource ownership and memory overlay (historical foundation; current where Arc 1C does not supersede it):**
> `apps/game/src/scene-texture-owner.ts` owns one document-wide canvas-identity registry for
> non-backdrop scene resources. Leases/scopes are refcounted, Texture creation bypasses Pixi's global
> cache, and the last logical release destroys the owned TextureSource. Whole-scene construction,
> fine-layer replacement, surface handoff, live system tier refresh, star-surface release, and retry/
> clear paths transfer ownership transactionally so a rejected or stale replacement cannot publish
> partial content. Settled Universe boundaries clear retired owners, timers, pending persistence,
> route canvases, and bounded ring/corona/terminator caches. Persisted `pagehide` suspends without
> destroying the live app; intentional document replacement performs final renderer teardown.
>
> Pixi-private retention is isolated behind narrow, fail-closed adapters.
> `pixi-managed-resource-owner.ts` observes and compacts the six managed GC hashes only after product
> release boundaries; owned Graphics teardown includes contexts. `scene-text.ts` detaches destroyed
> Text from shared TextStyle update listeners. `pixi-batch-texture-array.ts` wraps
> `BatchTextureArray.clear()` once and deletes only verified cleared UID tombstones in place. The
> Galaxy path materializes the unchanged ordered ±1.2R cell window once for decoration and stars,
> retaining globular-halo content while removing the duplicate traversal. Diagnostics are
> observational and cannot perform cleanup.
>
> `tools/scenemem.mjs`, `scenemem-contract.mjs`, and
> `budgets/scene-memory-v1.json` own the standalone fail-closed ruler. One Edge process runs four
> unmeasured warmups plus four measured cycles at 390×844 and 1280×800 through Universe → Galaxy/
> fine → Sol/System → Earth/Surface → 1,500-row Compendium → Universe. The contract proves exact
> route/owner work, settled and transient resource counts, canonical per-hash Pixi inventory,
> heap/DOM ceilings, target plus independent browser heartbeat, zero pending work, and same-document
> bfcache survival. At this historical boundary Shipyard was explicitly `future-arc-1c` and was not simulated.
>
> Product/ruler authority is exact clean commit
> `79c605f9c7ab8b63ad082d852c38d66ad6bb11af`; tracked budget/workflow activation is
> `e244c9e2342c6abd79ca4efcd3d26eb46d3d8910`, with budget SHA-256
> `78a9e81a121d2598b8d83bbbd0c8311e503470dcd88083f959fc82c181ee5afb`. Its one-attempt/no-retry run
> `20260821-arc1b-local-certification` passed 40/40 under exact Edge `151.0.4129.93`, complete
> lifecycle/cleanup, zero findings/fatals, and independent named verification. Evidence-retention
> descendant `b30b6d49a8ff1745f33be9a329d421309b96b5e3` does not change the certified product source;
> later documentation descendants likewise are not retroactively exact-head certified. This is
> local evidence, not hosted terminal-green, HUMAN visual review, release, or production authority.
>
> Arc 1B changes resource lifetime and its automated proof, not UI capability or authored visuals.
> Existing scene output and supported 512/768/1024 surface tiers remain; that Arc 1B commit added no
> Cargo, Shipyard, ship portrait, crafting, research, upgrade, combat, companion system, new HD
> package, release note, or version identity. Arc 1C's completed static/read-only foundation is
> recorded above.
> Broader HD visual expansion, living actor/biome animation, and long-task/hidden-tab policy remain
> later work.
> **2026-08-20 Arc 1A Compendium/art/resource overlay (historical implementation and ruler
> chronology; final HUMAN review remains open):** The blocked state described inside this overlay
> was later superseded by terminal-green changed-head run `32462323775` and PR #32 merge
> `d4ab7e6…`; the dated evidence below remains preserved rather than rewritten.
> Exact local implementation `aecf3865095176a509a4cb892e5842b584780870` bounds the
> Compendium HTTP server's close at one immutable monotonic 2,000 ms. Just-before succeeds;
> exact/late/missing/error callbacks force `closeAllConnections()` once and reject, with
> settle-before-force and stale/reentrant controls. Cleanup failure suppresses PASS/sample.
> Clean source `6736ef4…` collected c27/baseline11/c28/c29 once each with zero retries and fresh exact
> Edge `.86`. All candidates completed 78/78 and complete lifecycle with 18 PNG bindings; baseline11
> retained four faults and 14 phone / 13 desktop breaches. Activation `b3957e1…` binds active
> budget/test `546d3a81…` / `ef06252a…` to measurement/collector/selftest `23aacc2c…` /
> `0c7ec3ba…` / `0bbb3541…`; producer `d3223177…` is unchanged and all prior ceilings remain strict.
> This is browser-free ruler authority only; exact-head certification and HUMAN review remain open.
> `apps/game/src/compendium.ts` owns a variable-height virtual list over the
> deterministic 1,500-row fixture/import ceiling. It mounts the visible window,
> bounded overscan, and any focus-pinned row; measured logical anchor-plus-offset
> and the selected row survive filter, detail/Back reconstruction, and height-map
> replacement. `apps/game/src/species-art-loader.ts` is the sole DOM adapter around
> `SpeciesArtBroker` and binds both Compendium and Planetside images to `leaseThumb`
> ownership. Filter, rebind, close, ascent, and final document teardown release their
> exact owners; a persisted bfcache `pagehide` retains the live document's leases
> while suspending worker execution.
>
> `packages/art/src/speciesidentity.ts`, `speciescanvas.ts`, `speciespainter.ts`, and
> `speciesbroker.ts` separate deterministic identity, portable canvas allocation,
> painting, and main-thread ownership. After full app wiring, the app loader's default scheduler
> crosses one rendering opportunity and then one later task (`requestAnimationFrame` →
> `setTimeout(0)`) before every broker pump. At most one serial dedicated module worker at a time dynamically imports the painter, paints a
> 440px scratch canvas, downsamples and encodes a true 132px thumbnail, and returns
> only validated identity-bound results. The renderer never synchronously falls back
> to that heavy path; the worker runs one job at a time and terminates after active work settles and
> its queue is empty, keeping the measured page heap honest. A later new producer burst owns a fresh
> instance/import. Broker pump-generation invalidation rejects a callback armed before bfcache
> suspension or final disposal; resume schedules a fresh serviced turn. Once-per-worker capability,
> import, protocol, and worker failures terminate the instance and settle active plus
> queued owners exactly once, while content-specific paint/encode errors remain
> per-job. Phone/desktop cache, decoded-pixel, byte, queue, lease, portrait, worker
> lifecycle, and phase evidence are explicit. The last pre-timer resource ruler was active under
> measurement authority `bb03a3af…`; exact-788 and exact-ef6 certification remain truthful for that
> authority. The frozen shared-timer repair moves measurement authority to `f9710bdf…`; exact
> baseline5 plus independent candidate8/9/10 historically activated its successor ruler for producer
> `1c8200d7…`. Paired baseline6 plus independent candidate11/12/13 historically activated that
> measurement authority for producer `e59685b1…` under budget `ebe5b5c3…`; the later launcher input
> change prevents carrying those capsules into current certification.
> Specimen detail requests an
> asynchronous 440px result through the same owner; Back/Close cancels that request
> and clears the DOM source. `speciesart.ts`/`speciescompat.ts` remain Window-only
> synchronous audit compatibility and are rejected from the live entry-to-worker
> build graph. Producer failure remains a stable owned error tile and the same key
> recovers under a fresh lease.
> In portrait `surface-mode.card-open`, Survey retains its 44px minimum, Planetside retains a 72px
> scrollable floor, and Planetside's maximum derives from the same bottom anchor so the existing 8px
> inter-surface gap survives compact-phone height. This is the bounded product repair for c095's
> retained 12.5px rectangle overlap; it does not alter Glass ownership predicates or z-index.
> `apps/game/src/planet-texture-demand.ts` owns the pure fitted backing-pixel demand, exact legacy
> 512/768/1024 tier projection, higher-tier suppression, and surface generation/world identity.
> `drawSurface()` computes `ceil(420 × fitZ × DPR)` with a 64px floor: standard phone/desktop boot is
> 609/420px and selects 512. The app owner retains the live Sprite, generation, planet seed/ordinal,
> requested tier, and one refresh timer; it re-reads ThumbArt's cache after the asynchronous bake,
> swaps only a current owner's settled texture, destroys the displaced Pixi texture, rejects stale
> completion, and requests only a genuinely higher tier on zoom/DPR bucket changes. Maximum tested
> phone/desktop zoom demand is 1,248/1,280px and selects 1024, preserving supported sharpness.
>
> `apps/game/src/species-art-protocol.ts`, `species-art-worker-core.ts`, and
> `species-art.worker.ts` own the validated realm protocol, worker state machine, and direct Vite
> module-worker entry. `apps/game/tsconfig.worker.json` compiles that graph with WebWorker globals
> without widening the Window program. `tools/speciesart-build.mjs` proves one exact index owner →
> module worker → worker-local dynamic painter graph and rejects orphan/duplicate/static/preloaded
> worker or painter edges plus any renderer-reachable legacy synchronous facade. The loader owns a
> live `(max-width: 700px)` subscription that immediately trims to phone caps and removes the
> listener on final disposal.
>
> `tools/compendiummem.mjs`, its pure contract, and
> `budgets/compendium-memory-v1.json` own a fail-closed calibration and active-ruler seam. Exact committed
> repair `dea03913014bc58134ebb06ca5b36892210a7571` passes the complete 12-row Glass
> matrix. Its following exact Compendium run
> `20260817150005919-93781-b6643ba7a6` truthfully reports 75/76, solely red at
> `desktop/warm-plateau`; it proves neither a product leak nor a clean plateau because
> the old sequence destructively trimmed the desktop cache before the warm observation
> and measured refill, while its heap summary omitted embedder/backing ownership. The
> repaired collector observes the full native warm cache before cap control; records
> used, embedder, backing-store, and aggregate heap; proves stable unique keys plus
> unchanged job/disposal/worker counters over the last three cycles of one retained window;
> retains a post-cap restored snapshot; embeds compact replayable baseline/candidate capsules; and
> binds the complete fixture/generator/schema/contract/collector/browser/lock/package/
> baseline-save/art-build/outcome input set plus the exact built index-owner → module-worker
> → worker-local-painter graph. Da0's historical budget embeds paired run
> `20260820-arc1a-baseline3-21af3fa`, collected by `21af3fa2…` against legacy product `3844701…`,
> plus independent one-attempt candidate2/3/4 runs from clean committed `21af3fa2…`
> collector/product source that bind historical producer `291b794e…`. All share measurement
> authority `bb03a3af…` and exact Edge 151.0.4129.86. Strict ceilings exceeded all three-run maxima;
> the baseline retained all four sealed faults and breached 14 phone / 13 desktop fields. Commit
> `da0de20bcd78271d6bd4a2ff2f5ca2ca5a6c55e3` locally certified that exact ruler; its no-retry Chrome
> Smoke, full Glass, persona, root-layout, and nonpublishable-preview gates also passed.
>
> PR run `32334254714`, attempt 1, preserved the later terminal product red. Its clean detached
> test-merge `88b9c7b0aa90b860a5474bd099cfab48b125a3f5` matched exact Edge .86, the active budget bytes, and
> producer `291b794e…`. Phone completed 29 stages through veteran-Earth boot readiness; Planetside
> thumb settlement then missed the unchanged 2,000 ms target command bound at 2,001.723 ms while
> root-session `Browser.getVersion` answered in 0.872 ms. The report is correctly
> `product-unanswerable`, not instrument/transport, and desktop did not run. Its partial evidence did
> not retain producer phase at the timeout, so it cannot distinguish worker import, paint, encode,
> result publication, or absence there. Source inspection shows the heavy painter is off-thread and
> that zero-delay main-thread successor pumps could repeatedly win over rendering and inspector work.
>
> The serviced-turn/bfcache repair changes exact built producer authority to
> `1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2`: index
> `f528797d1b3339291dedd5db4b768add9485e8006b1158690323ff2f5ff2769e`, owner
> `assets/main-BAg-DH_f.js` at
> `b12503d154d83a44c4606c31306bf756d6a35e1459877a30e6a89d423c49261f`, with worker and painter
> unchanged.
> Commit `f47cd381699fb1934f30bfca82fc9bf971714e6d` collected exact-Edge-.86 baseline4 against legacy
> product `3844701…`; that baseline carries no candidate producer field. Independent one-attempt
> candidate5/6/7 use `f47cd381…` as clean collector/product source and bind producer `1c8200d7…`.
> All four share measurement authority `bb03a3af…`; every candidate run completed 78/78 outcomes
> with zero retries. That historical pre-timer budget replays those raw capsules and puts all 40 profile ceilings strictly
> above their three-run maxima; baseline4 retains all four sealed faults and breaches 14 phone / 13
> desktop fields. The desktop warm aggregate maximum is 436,412 bytes under a 524,288-byte ceiling.
> Baseline3 and candidate2/3/4 remain truthful inputs to the old `bb03a3af…` ruler; only the
> candidate runs carry old producer `291b794e…`. They are not current certification. Commit
> `78813cd25c67f4255282f418ea6f635a45e0fc29` passed exact-head
> Arc-local Edge run `20260820-arc1a-serviced-turn-active-cert-78813cd`: 78/78 outcomes, zero
> findings/retries, independent named-run verification, report SHA-256 `0d4a7f80…`.
>
> The first following Chrome Smoke run `20260820063539761-70885-f80e1a2198fc` is preserved as a
> one-attempt/zero-retry instrument red (report/log `d2919f0e…` / `4b5de237…`). Its held-painter
> phase created a second target and then observed the first owner without re-establishing or proving
> its foreground authority, while repaired successor pumps intentionally wait for rAF→later-task service. The generic
> `last null` carrier retained neither foreground authority nor the exact terminal image/worker
> phase, so it is not a visible-page product finding. `tools/slicesmoke.mjs` now binds each
> attach-derived target/session plus exact document token, explicitly activates/focuses/brings that
> owner forward, proves continuous visible/focused arm→rAF→later-task service under a fresh token,
> releases once under one immutable 30-second deadline, and retains image/decode, queue, worker
> phase/result/error, broker, and foreground diagnostics. The closed owner gets its own foreground
> proof before settlement. `tools/slicesmoke-contract.mjs` and the report selftest reject wrong or
> stale identity, hidden/unfocused phases, reversed service order, and intervening visibility/focus
> changes; receipt at or after either absolute deadline is late even when the CDP timeout callback
> has not run first. Commit `ef6c2c2cd31363cf47899a89c16c0d9f5f90d7a7` freezes that
> foreground instrument. Exact Edge run `20260820-arc1a-serviced-turn-active-cert-ef6c2c2` and its
> named verifier pass 78/78 with zero findings/blocked/partial/retries; report SHA-256 is
> `406edea11fec5f5a3cf11e6f9fc6dfea00cbdd2ce54fefed780bd1c9dafc9282`.
>
> The immediately following clean-ef6 Chrome Smoke run
> `20260820071826194-75001-c2a22330fd09` stopped the browser battery with only two D-TRAIN import-
> owner findings: the busy-refusal witness was absent and the Skip action was missing
> (`button:false`, `witness:null`). It used Chrome for Testing 152.0.7977.54, one attempt, zero
> retries, 150,963 ms, ten screenshots, and no detected source change. Report/log SHA-256 values are
> `65ca06c8f6d26ef3a9a3da19bb4bc09bb005d754f2291f55f389ac1ecf14aa46` /
> `87b1c8b6308d3a1969fb45ea4c2ccb70d1f46c2a8311751984b3c1ab0acdd7d9`.
> This is a Smoke setup-race finding, not a product transaction finding: the direct D-TRAIN fixture
> put followed real Atlas/Land activity without joining its ordinary persistence owner, and the old
> helper proved only changed document identity before accepting whatever primary remained. The
> report did not retain the winning bytes, so their exact value and the product busy-refusal outcome
> are unobserved. The bounded instrument follow-up drains the prior writer, reproduces stale overwrite
> as a negative control, requires exact primary/document/classified Training route/render/card/
> runnable Skip/idle status/ticker preconditions, and then waits semantically for one
> `claim-rejected/busy` witness with no pre-release write.
>
> Pushed head `1187de0d052761e4463524cde8438ea8810d7149` then reached GitHub Actions run
> `32350971816`, job `96369841133`, workflow attempt 1, on synthetic merge
> `25200b616bbd509f50eaa18f0a8b27ad20dc83e0` (parents `38447019517147319bd08c598202d097ee866874`
> and `1187de0d052761e4463524cde8438ea8810d7149`). Valid report
> `gha-32350971816-1-compendiummem` retained 29 completed phone stages and one final target timeout
> after `1999.758726` ms against its 2,000 ms command deadline. The target remained `timely:true`,
> the ledger put completion `0.241274` ms before the deadline, and the independent root heartbeat
> fulfilled in `7.410808` ms. The terminal contract correctly emitted one instrument finding, zero
> outcomes, and 78 blocked outcomes: this is `instrument-fail`, not a product verdict. Artifact,
> report, and job-log SHA-256 values are `4932fb229c1de1d3820d2322e8273ce9ed609716c8f9f4d9e82b2fa2a3e408c7`,
> `1718faa4403f4f569899d9d328f08c3b7decafae23829d5fabe37660c36da43b`, and
> `7eda5facdac45d192c5b6071ac91394678d2fdb69b7992b218e0d3b0cb9c4ca9`.
>
> `browsercdp.send()` now computes one absolute monotonic deadline. An early timer callback re-arms
> only the remaining interval under that deadline; it rejects only when the clock proves the
> boundary reached/passed, while response receipt at/after the same boundary remains late. Expiry
> during initial timer arming rejects without transmitting the command. Frozen browser-CDP SHA-256
> `36a832bc8cc32ba56373d1fa6d7339903a37a07b337fbf2748bbf95e489061d0`
> changes measurement authority from historical `bb03a3af…` to
> `f9710bdfaac255d7df7e8c29f251c8387041abe99a0178667b7b3430110a0409`. Historical budget/test
> `8ffd0d8e…` / `121ab8cd…` bound the following baseline5/candidate8/9/10 evidence to producer
> `1c8200d7…`.
> Paired `20260820-arc1a-absolute-deadline-baseline5` used clean collector
> `cbe786816cafd196a4b1649b0d1b72966036b7cc` against detached broken source `3844701…`;
> candidate8/9/10 used that clean source, exact Edge .86, producer `1c8200d7…`, one attempt, and no
> retries. Each candidate replays 78/78. All 40 ceilings exceed the three-run maxima: phone
> page/embedder/backing/aggregate/encoded/warm maxima → ceilings are
> `7,771,656/3,151,408/3,099,159/12,406,038/2,477,068/6,196` →
> `8,388,608/4,194,304/4,194,304/14,680,064/2,621,440/65,536` bytes; desktop values are
> `10,550,176/3,216,400/4,914,765/16,017,176/6,592,468/306,704` →
> `12,582,912/4,194,304/6,291,456/18,874,368/6,815,744/524,288`. Baseline5 preserves all four
> faults, observes warm ranges 1,037,780 / 1,222,370 bytes, and breaches 14 phone / 13 desktop
> fields. Those are historical activation facts for their exact producer, not current authority.
>
> Exact clean commit `c0955003d558d7b3deb0afe9e527f24969d512dc` passed Compendium run
> `20260820-arc1a-absolute-deadline-active-cert-c095500` (report `55dba448…`) and Smoke run
> `20260820104231234-94067-7f954ca9942e` (report `6d4f00f8…`). Its first full Glass run is preserved
> at report SHA-256 `8e89d855abf33ba45d43d8284e05732ebad93891ff9e024004869811778917f0`:
> Chrome 152, all 12 viewport rows, 58/58 controls, zero instrument failures/retries, and one product
> `PLANETSIDE_SURFACE_OCCLUDED` finding from a 12.5px compact-phone Survey/Planetside overlap.
> Persona, layout, preview, push, and CI did not run after that stopping red.
>
> The bounded stack repair plus revised development-release bullet changes built producer authority
> to `e59685b1a0d009c321c53fe2d3d8566b3f417d8c2decd89387d7be6d08b9a9fb`: index
> `ca76da4cfd094a7426cfd60b56428ca6abfc9851f472a1e459ad2938ae1e008e`, owner
> `assets/main-Ccq4RHJt.js` / `9260e359c3bebe6bf722ecad5234babbeff0a3e7bb6cb6f0a33242b99668e6c2`, worker and painter
> unchanged. Measurement was `f9710bdf…` before the later cold-start launcher transition. Clean committed collector/candidate source
> `2a105d51397eef97542d856ed3b1bb23edf2b028` collected paired baseline6 against legacy product
> `3844701…` and independent candidate11/12/13 under exact Edge .86. Every run was one-attempt with no
> retry and each candidate replays 78/78. Historical budget/test SHA-256 values are
> `ebe5b5c38f4796652ebbe6110c19a5ad31c310d63ca3adbf5fd4575e3724527d` /
> `ec956b8a7d3bad96736deab42e0ac79e59e6cf9010559723d2dac2249e463a83`.
> All 40 ceilings strictly exceed their maxima. Phone page/embedder/backing/aggregate/encoded/warm
> maxima are `7,778,708/3,177,000/3,086,488/12,458,207/2,473,856/6,492`; desktop values are
> `10,686,028/3,143,608/4,824,582/16,032,517/6,591,340/390,020`. The strict ceilings remain
> `8,388,608/4,194,304/4,194,304/14,680,064/2,621,440/65,536` and
> `12,582,912/4,194,304/6,291,456/18,874,368/6,815,744/524,288`. The four-fault baseline breaches
> 14 phone / 13 desktop fields; its 11,858,524-byte desktop page heap deliberately remains below the
> 12 MiB variance ceiling. Focused 11/11, selftest 222/222, and semantic validation pass. This is an
> historical browser-free ruler.
>
> Exact pushed head `f9ae372f13d9a420e302f05e277b4445efb790c0` passed its complete local battery
> once: Compendium 78/78, Smoke with zero findings, Glass 12/12 and 58/58, nine joined automated
> personas, root layout 787/787 across 10 viewports, and verified nonpublishable preview packaging/
> smoke. Corresponding GitHub Actions run `32367902426`, Compendium job `96421452463`, attempt 1,
> tested synthetic merge `e449e84984400d0b0f4474496264d474424c81d7` (base `3844701…`, head
> `f9ae372…`) and stopped before product measurement. Edge published the stable endpoint at
> `23657.701415` ms, leaving only `6342.262417` ms of the 30,000 ms absolute startup window for a
> declared 15,000 ms socket phase; the absolute deadline expired before `Browser.getVersion`.
> It emitted no Compendium run, report, product outcome, or retry.
>
> At the `32367902426` transition, `browsercdp.mjs` gave only its selftest's one real cold launch a
> caller-owned 45,000 ms
> startup envelope while retaining 15,000/1,500/2,000 ms socket/command/shutdown caps. Portable
> controls pass at 38,657 ms and reject exact/late 38,658/38,659 ms with one child and complete
> socket/child/profile cleanup. That caller change itself added no warmup, relaunch, retry, fallback,
> or workflow change;
> generic and Compendium candidate startup remain 15,000 ms, later warm startup remains 10,000 ms,
> and the product observation remains 2,000 ms. Browser-CDP SHA-256
> `6892dea6df1d222f53093faf62f0b0e38a2d18c600b7191aa29befc9960632e9` establishes measurement
> authority `6ba58522fc961e145df4f065f913d99d8b18355a20d664b9bcdc90741057638a`; producer `e59685b1…`
> remains unchanged. Clean source `374049536e…` collected paired baseline7 plus independent
> candidate14/15/16 once without retry; every candidate replayed 78/78. The then-active browser-free
> budget/test `bb4da2bf0b…` / `d242705ad9…` retain all four baseline faults, 14 phone / 13 desktop
> breaches, and all 40 ceilings strictly above the three-run maxima. This activation is not
> certification. The accepted 45-second CI cold-start allowance is process environment, not a
> game optimization target.
>
> Exact pushed head `c49af5a72a41eebd79ce3975852f3d7c22ab3ac6` completed one full local battery:
> Compendium 78/78 plus named verifier (`6bfa15af…`), zero-finding Smoke (`4351d1bf…`), Glass
> 12/12 and 58/58 (`4215986c…`), nine joined personas, root layout 787/787, and verified preview
> packaging/browser smoke. Corresponding run `32375329693`, attempt 1, tested synthetic merge
> `8e09cffe20640e82c7b934df29a40fe22c5326e7` (base `3844701…`, head `c49af5a…`) without retry.
> Static and Glass passed. Root job `96445227534` emitted zero viewport outcomes after its first
> Chrome launch found no endpoint inside 30 seconds. Compendium job `96445227816` opened exact Edge
> .86 inside 45 seconds, then the generic selftest's 1.5-second `Runtime.enable` command expired
> before the collector. Smoke job `96445227991` retained ten screenshots and only `src length 0`
> from an immediate read of the separately asynchronous detail owner; because the carrier has no
> image state or worker phase and Back then released the owner, it cannot adjudicate 440px settlement.
>
> The bounded repair leaves `browsercdp.mjs` and all measurement-authority inputs unchanged. Root
> layout now owns one captured 45-second startup / 15-second socket / 30-second command / 5-second
> shutdown call. New `port/v2/tools/compendiummem-browser-preflight.mjs` owns the Edge-only workflow
> live proof: one 45/15/sealed-5/2-second launch, exact browser/executable authority, fresh target,
> Runtime/Page/HeapProfiler enable, and one immutable 5-second evaluate plus same-session event phase
> whose receipts must be strictly before deadline, one close, and profile cleanup. Both
> PR certification and development-preview packaging invoke the same preflight before the unchanged
> Compendium selftest/candidate. Smoke binds pre-open document/generation/logical owner, requires
> the opened surface to retain that document/owner at generation + 1, and requires connected
> current `ready`, nontrivial source, completed decode, and exact 440×440 natural dimensions under one
> immutable 30-second deadline, with pending/error/stale/contradictory/exact-late controls and rich
> final diagnostics. Exact pushed head `139ce2f…` then passed the complete local battery.
> Corresponding run `32383320206`, attempt 1, tested synthetic merge `174a9140…` under exact Edge
> .86 and matching measurement `6ba58522…`, producer `e59685b1…`, and then-active budget
> `bb4da2bf0b…`. Phone completed 29 stages through veteran-Earth boot readiness; Planetside thumb
> settlement's target `Runtime.evaluate` took `2001.132592` ms against the unchanged 2,000 ms
> deadline while root `Browser.getVersion` answered in `10.401960` ms. This is terminal
> `product-unanswerable` evidence—zero outcomes, 78 blocked, no review PNG, and no retry—not an
> instrument/transport or timing-policy red.
>
> The displayed-demand/zoom-owner product and development-copy change produces
> `d32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900`: index `dee9af3a…`, owner
> `assets/main-Da536xWA.js` / `28382873…`, worker and painter unchanged. Measurement authority
> was `6ba58522…`. Clean committed collector/candidate source `75a996af…` produced one no-retry
> baseline8 against legacy `3844701…` plus independent no-retry candidate17/18/19 under exact Edge
> .86. Every candidate replayed 78/78; baseline8 retained all four faults and breached 14 phone / 13
> desktop ceilings. Then-active budget/test SHA-256 were `74e88c2b…` / `485be9da…` (79,614 / 20,782
> bytes), with all 40 reused ceilings strictly above the three-candidate maxima. Report/sample pairs
> are baseline8 `0a8b831e…` / `a52bccec…`, c17 `6b86ca9d…` / `0818c86e…`, c18 `a9b28d79…` /
> `c368ba86…`, and c19 `440cb788…` / `abddfa84…`. The browser-free activation became exact head
> `96464d5e4ca59074c0d8d59719a90a5dedc2dd2d`, which completed its full same-head local battery.
> Corresponding GitHub Actions run `32394244417`, Compendium job `96507263338`, attempt 1, tested
> synthetic merge `63665b6…` and retained a pre-product environment/instrument red. On runner image
> `ubuntu24/20260816.277`, exact Edge 151.0.4129.86 was already newest and plain apt was a no-op.
> Browser-path and portable preflight selftests passed; the one-launch live preflight then received
> no CDP endpoint inside the unchanged 45-second bound. It ran no collector and emitted no report,
> outcome, review PNG, or retry. Verifier/upload failures are cascades; root/static and Chrome
> Smoke/Glass jobs passed.
>
> Retained exact-Edge history shows `ubuntu24/20260810.271` upgraded bundled .78 to exact .86 and
> launched 4/4, whereas `ubuntu24/20260816.277` already carried .86, made apt a no-op, and launched
> 0/3. This supports only a single SHA-verified same-package `--reinstall` workflow-normalization
> hypothesis; it does not prove a fix. The preflight selftest now owns a green fail-closed static
> control for both workflows' exact ordered URL/SHA/download/hash/reinstall/version/executable/
> following-preflight chain and rejects removal plus outside-step decoys. That selftest-only control
> changes no live repository-tool behavior; the normalization changes no timing, retry, fallback,
> product, browser package/version, measurement, producer, budget, or authority.
> Exact local head `89bfa05…`, run `20260820-pr32-89bfa05-compendiummem`, then completed 78/78
> outcomes with zero findings and six PNGs before owned browser shutdown exited 2. Terminal log
> `b0bb8abc…` is authoritative; pre-cleanup PASS report `66ba1366…` and verifier `98664dca…` are
> false-green. Preserve this one-attempt/no-retry result as post-measurement instrument red, not
> certification, calibration, or product failure.
>
> Clean lifecycle-repair source `c49e525…` then ran candidate20 once. It completed 78/78 product
> outcomes, zero findings, six PNGs, and complete lifecycle, but the reused `.86`-named app had
> self-updated to `Edg/151.0.4129.93`, revision `@4a822b1b…`. Quarantine report/sample/log
> `175fac5e…` / `916dd12a…` / `7462144b…` as wrong-browser instrument evidence—not calibration,
> certification, product failure, or HUMAN review.
>
> Candidate21/22/23 and paired baseline9 then completed once each without retry under exact Edge
> `.86` and complete lifecycle. Every candidate replayed 78/78 with zero findings; baseline9 kept
> all four faults. They cannot activate a ruler because the old shared-sample identity incorrectly
> compared fresh executable paths and host user agents. Both strings remain mandatory raw per-run
> provenance, while exact product/revision/JavaScript/protocol form shared browser authority.
>
> Clean exact source `fb321f2…` then collected candidate24/25/26 plus paired baseline10, each once
> with zero retries and a distinct fresh `.86` path. All candidates completed 78/78 with zero
> findings, complete lifecycle, and six PNGs; baseline10 retained four faults. That historical budget
> owned explicit top-level `cf-v2-compendium-browser-authority/v1` and rejected mismatch before
> profile collection. Budget/schema/contract/collector/selftest/test `70145575…` / `695d2529…` /
> `e7dfea1d…` / `07131f5e…` / `f86db74a…` / `0fa2e89d…` bind measurement `2318f57b…`, unchanged
> producer `d3223177…`, 3/3 samples per profile, measured 1/1 baseline, and strict ceilings with
> 14 phone / 13 desktop baseline breaches. A synthetic desktop-identity line corrected the focused
> check from 12/13 to 13/13 without changing or rerunning browser evidence. Those facts do not cross
> the later `aecf386…` collector change. Clean `6736ef4…` c27/baseline11/c28/c29 evidence now activates
> budget/test `546d3a81…` / `ef06252a…` at `b3957e1…`; exact-head certification remained open at this
> historical Arc 1A boundary. PR #32 later merged, and the current overlay above records the bounded
> Arc 1B lifecycle result.
> The authority remains Arc-local Edge 151 and does not change the global Gate-A Edge 150
> pin. Da0's six images are stale for the repaired producer; a fresh phone/desktop list,
> focus-pinned, and detail set still awaits HUMAN review.
> This repair owns the current surface globe's fitted start and live tier swap only. The current Arc
> 1B overlay now owns broader existing-scene resource lifetime; Shipyard and named HD planet
> attachment remain Arc 1C, while broader visual expansion remains later rendering/art work.
> **2026-08-16 D-TRAIN-1 source overlay (current working tree; local browser
> evidence recorded below; exact-head CI, integration, real-save Gate C, and
> human authority remain open):** `@cf/persistence` now classifies the real
> v1.8.9 Field Training checkpoint by its exact eleven outer keys
> `{st, ps, ac, es, c, ca, cx, it, eq, ea, e}` and returns a detached,
> recursively frozen bounded clone. Those keys own selected statistics, player
> statistics, achievements, Stardust, Compendium, cargo, exceptional cargo
> counts, items, equipment, equipment affixes, and the captured Earth
> Atlas/home row—never the whole save. Ingress kinds are `none`, current-view,
> `legacy-v1`, and bounded `legacy-or-unknown`. An exact legacy checkpoint with
> `tut:1` rescues the mature completion-before-restore bug by normalizing
> Training incomplete; the synthetic `{codex,essence,marker}` fixture remains
> unknown/refusal-only. Completed-plus-pending cannot export, and oversized
> unsafe evidence is not promoted.
>
> `apps/game/src/training-restore.ts` starts with the surrounding imported v4
> state, restores only those owned surfaces through the normal sanitizers, and
> keeps every other outer-save field. The checkpoint's `e.where` is ignored as
> route authority; canonical Earth is regenerated and source-proven. The
> legacy checkpoint contains no `view`: Skip from Welcome keeps/persists Sol,
> while full completion after Land keeps/persists Earth. Only the current-v2
> exact one-key `{view}` snapshot restores the pre-Training route. Earth
> history is preserved only after sanitization, no land/conquest/achievement is
> invented, HP is down-clamped but never healed, Earth reserves one slot inside
> the 120-row Atlas cap, `surveys` derives from `surveyedSet`, and `arrivals`
> derives from `sysSeen`. Cumulative checkpoint records use the optional
> compatible outer-v4 extension
> `ever:{v:1,hybrids,best,maxGen,scanhits[,arrivals]}`. Outer `v` remains 4:
> this is an additive envelope extension with an independent nested version,
> not “no schema change,” v5, or a game/release bump. Absent carrier preserves
> historical derivation; carrier floors cannot lower derived facts; `sysSeen`
> remains arrival authority; numeric `ever.v > 1` rejects the whole save as
> `future-version`; malformed v1 members are contained.
>
> Training completion is an async atomic replacement transaction. The UI first
> sets `aria-busy`, disables Finish/Skip, retains the lesson/focus lock, claims
> exclusive ownership, stops the ticker, cancels pending persistence, and drains
> an active write. It builds/proves a detached candidate and performs exactly
> one direct primary write before publishing live state or releasing the old
> renderer. Pre-durable refusal rolls back the claim and leaves the checkpoint
> and lesson retryable; post-durable publication failure never writes again and
> reloads from the committed primary. Source-error may write an incomplete
> candidate with the exact checkpoint only when Sol is freshly proven and
> authorized, then reload safely. If Sol also cannot be proven, it forges no
> fallback/write/clear/completion and leaves the checkpoint plus lesson retryable.
>
> Loaded pending checkpoints are write-held. Loaded `tut:0` without a checkpoint
> is also held and seated at proven Sol in runtime only until the one atomic
> completion write; fresh empty onboarding remains ordinary. Unknown checkpoint
> or unavailable-route recovery turns `#importsheet` into a persistent
> nonclosable `aria-modal`: background inert/hidden, focus trapped, Escape
> consumed, release bulletin suppressed, trusted complete import plus reload
> still reachable, and synchronous reopen on every boot while the protected
> source remains. Replacement reasons are now `training-restart`,
> `training-complete`, `training-recovery`, `save-import`, and `storage-retry`.
> At that historical boundary, Guide capability inventory and release structure remained unchanged (five
> categories /44 bullets, draft only, current release null); the remaining
> fifteen D-TRAIN-2 lessons, real-save Gate C, and any version/release remain open.
>
> The ignored Slice Smoke report is terminal PASS for run
> `20260816195736683-4852-27b5c876410a` on Edge `151.0.4129.86`: 154,788 ms,
> 0 findings, 0 automatic retries, 10 screenshots, and no detected source
> change. Its raw log names genuine Training Skip + full Finish,
> rescue/quarantine/retry/races, and canonical Earth. The ignored Glass report
> is independently `full-certifying` / terminal PASS on the same Edge in 57,476
> ms, with 12/12 viewport rows, 12/12 reload-evidence rows, all 57/57 planned
> negative controls run, none blocked/omitted, 0 findings, 0 instrument failures,
> and 0 retries. Both name commit
> `b091f010011fa16bec457599b41274b7f92bb5e6`, branch `openai/mac`, and
> dirty-diagnostic source state, but they bind distinct working-tree hashes:
> Slice Smoke `465adef3606b0b06dd285eb049662e5b5ee659bb6dc0b53430568a3df9cf9104`;
> Glass `4f266568aacdb98c7a6e9cfc8571fc60e0bfc140762540dd844a2714fc0836f5`.
> Their common Git-status digest is
> `c195873a910c3bce42db222560c9bc70b8763df330d0454036388e4e398faa6d`.
> Slice report SHA-256 is
> `33953319124590ced0cebc16888cfb2b8cbe2879cbcb3c225e061d0d7a817027`;
> its 4,163-byte raw-log SHA-256 is
> `b060af3aaa8454a5d9813b2e5f8e6eba0ec2b7f5d3090e991154c1664a132670`.
> Glass report SHA-256 is
> `fe32fe802460a61ec4337c373276de8601196ead530ae8184c36970247545254`.
> This is local outcome evidence for those exact report inputs—not the later
> documentation tree, exact-head CI, integration, Gate C, human play, rubric
> closure, or release authority.
>
> **2026-08-15 F2 canonical-ingress overlay (historical F2 working tree; complete
> local browser outcome green, exact-head integration pending):**
> `port/v2/packages/scene/src/address.ts` now owns
> production galaxy/star/planet candidates, resolvers, deeply frozen proven
> nodes, runtime-private registries and branded canonical keys. Star and planet
> parent guards compare those private canonical parent keys, so an independent
> proof of the same parent is valid while structural clones and cross-hierarchy
> children fail. `cf1-code.ts` parses strict bounded all-tier public input;
> diagnostic source overrides deliberately return untrusted frozen data.
> `zoommode.ts` replaces nullable alias-prone navigation with a frozen,
> registered discriminated `NavState`, validated transitions, canonical-address
> conversion and strict `resolveViewToNav()`. `system.ts` records planet source
> ordinal before its orbit sort; runtime action identity and the world key use
> `{seed,ordinal}`.
>
> `apps/game/src/main.ts` routes generated galaxy/star/planet actions, all CF1
> Search tiers, saved boot/import, Atlas and the exact current one-key Field
> Training `{view}` snapshot through that seam. The app authorizes a proven
> destination against saved Prime/Charter reach before committing destination
> navigation, an accepted name, a route-focused planet card, Land, progression
> or persistence. Planet routes focus the proven
> system survey and never land. `@cf/persistence` keeps bounded raw saved-route,
> Atlas-row and current-snapshot evidence in `ImportRouteIngressV2`, outside
> `SaveStateV2`; the app holds proven Atlas navigation in a private `WeakMap`.
> Deterministically invalid or unauthorized saved navigation repairs only
> `view` to Cosmos. A generator `source-error` holds that route field, and the
> current Training restore keeps its pending snapshot and incomplete state;
> when Sol can be newly proven and authorized, it commits that safe system
> before persistence so reload can reopen Welcome for retry. Atlas rows
> without runtime proof remain visible and disabled. `navToView()` preserves
> the compatibility route shape while excluding brands, keys, parent cells,
> star layer and planet ordinal.
>
> The first F2 real-browser attempt was red after real accepted galaxy
> navigation: `hudText()` passed frozen `ProvenGalaxy` to lifted
> `galaxyStats()`, whose legacy memoizer assigns `_stats` to its input. The
> caller-side repair neither unfreezes provenance nor edits the lifted helper;
> `statsForProvenGalaxy()` passes a disposable mutable spread and caches only
> frozen `{stars,planets}` in an app `WeakMap`. `scene/universe.ts` separately
> copies and freezes nested collision `bridge` data while composing scene
> nodes, with a focused mutation control that proves later composition cannot
> inherit a poisoned memoized value; the intentionally identity-preserving
> `systemScene.P` remains presentation-only and never mints route authority.
> `slicesmoke.mjs` contains all-ingress outcome controls plus a draw-tail
> receipt that joins rendered scene mode/keys to canonical navigation. Final
> audit added held-route Training Restart transfer/rollback and non-null
> per-mode provenance-key controls. A CI-format rendered-copy run then failed
> closed because its bare expected title did not include the real icon-prefixed
> Guide heading, despite complete required copy and no contradiction. After the
> contained-title identity correction, `smoke:ci` passed with zero findings or
> retries in 138,305 ms; the 12-viewport Glass Matrix passed in 55,065 ms with
> zero findings/instrument failures. Both reports bind Edge `151.0.4129.86` and
> dirty-tree digest
> `7dfa649eb7de017424b7ba1ba0b11ba1fd00dc02a5b99b6848e0f3c347acba9e`.
> The static suite is 27 files / 340 passed / 1 skipped; both TypeScript programs,
> `artunused`, art routing/coverage/spec controls, diff hygiene and the 790-module
> app build are green. This remains dirty-working-tree evidence, not exact-head
> CI, integration or rubric-Gate completion.
>
> This historical overlay superseded the scope limits in the dated 2026-08-13 CF1 and
> 2026-08-11 integration notes below, but not their history. F2 changes no
> generator output, share-code/save schema, reach balance, Guide capability,
> Training lessons, local ownership ledgers, ownership/reward/receipt writer,
> version or release. At that boundary D-TRAIN-1 remained open for richer legacy snapshots; F3
> still owns revisions/CAS/split stores/receipt journal, and F4 owns clock,
> visibility, active-play and SessionRNG policy.
> **2026-08-15 F1b WorldGen contract overlay (historical pre-F3/F4 boundary):** The byte-verbatim WorldGen body,
> generated values, cache keys and call order are unchanged. Its typed surface
> now exposes required own `GalaxyCellGalaxies.web` metadata and the exact
> `SupernovaSite`/birth/remnant shape, with `supernovaSites`'s second parameter
> documented as an epoch key rather than a requested count. The app consumes
> those results without local casts. The facade also states the transitional
> `GAL_SPRITES` precondition for a first uncached ordinary generated-galaxy
> branch; `installCaptureHooks()` remains the current boot seam. This is
> contract truth, not removal of the free-global dependency, D-HAZE, CF1/F2,
> `_sanitizeSavedGenome` mutation, or the then-open F4 clock work.
> **2026-08-15 F1b audio package overlay (historical pre-Arc-7 app ownership):** The v2 package was stings-only, but its public
> rarity/survey/navigation stings and `applySfxGain()` now no-op before `initAudio()` installs the
> save-backed seam. Initialization creates no context. After it, Sound-off prevents construction;
> the first enabled sting lazily prefers standard `AudioContext`, falls back to
> `webkitAudioContext` only when standard is absent, and reuses the context. Bounded package tests
> cover pre-init safety, post-init dispatch, live mute state, constructor failure/fallback and
> suspended resume rejection. During the awaited save-load, the app assigns the save and then calls
> `initAudio()` synchronously before later playable scene/input publication; no ordinary current
> pre-init action route to the former package exception was reproduced. This does not implement or
> close Arc 7/8 or Gate G lifecycle, content, ownership, budget, rights, device or listening work, and it
> changes no Guide/Training/release-copy capability or version identity.
> **2026-08-15 F1b epoch persistence overlay (historical pre-F3/F4 boundary):** `EpochClock.base()` is the
> immutable sanitized construction origin; ordinary persistence must snapshot
> the advancing `current()` value. The browser app already followed that recipe:
> it constructs once from imported `SaveStateV2.EPOCH_BASE` and a fresh
> monotonic page-residence segment, refreshes the compatibility-named carrier
> from `current()` before export, and constructs a new clock from the serialized
> snapshot after reload. The package comments and tests now state that saving
> never rebases the live clock and carrying an old elapsed segment into a new
> base would double-count it. Real-browser smoke advances one exact epoch, reads
> the raw IndexedDB primary, and reloads the snapshot. Automatic edge saves, hidden-time policy,
> live global-read timing, SessionRNG and the CAS/revision/tab-lease substrate were still F3/F4
> work at that boundary. The current 2026-08-24 overlay records their implemented authority. This
> was not a current-player data-loss finding.
> **2026-08-13 exploration/ship/loot/companion/audio review (historical review
> boundary; Arc 1A resource status is refreshed above):** The executable v2
> boundary remained the Phase-4 travel/survey slice. At that boundary, `apps/game/src/main.ts` rendered the
> read-only Compendium through `@cf/art/species`, consumed `@cf/domain-combatcore`
> battle stats for specimen detail, and used only the lifted whoosh/survey stings from
> `@cf/audio`. `@cf/persistence` round-trips legacy cargo/items/equipment/affix/tech/
> creature fields, but Inventory, Shipyard, mining/crafting, item-instance loot,
> breeding/care, live combat/Guardians and companion missions have no v2 command owner.
> The Guide at that boundary correctly kept those capabilities unavailable. The 2026-08-22 overlay
> above supersedes only Shipyard inspection from unavailable to partial.
>
> The approved ownership graph is specified in
> `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`: catalogue species split from living
> `CreatureInstance`; stackable definitions/materials split from `GearInstance`;
> The then-approved `ShipVisualState` boundary was a pure projection of the same normalized reach state used by
> travel; companion mission loot is an immutable dispatch-time receipt claimed once
> through revisioned persistence; audio resolves a versioned profile/cue plan without
> consuming simulation RNG. They were planned module boundaries at this historical review; the
> current pure ship projection is now exported as recorded above, while the other writers remain planned.
> That review required the 1,500-entry Compendium to be virtualized, mounted rows
> moved to true 132px thumbnails, and decoded pixels/jobs/resources bounded before
> adding content scale; Arc 1A now implements and measures that bounded DOM/Canvas path.
> Arc 1B later implemented and measured Pixi/canvas scene ownership for the existing travel surfaces;
> Arc 1C then added only the static Shipyard inspection and named HD attachment described above.
> The then-present one-blob, last-writer-wins repository was
> insufficient for two-tab exact-once claims and must gain compare-and-swap or one
> authoritative serialized coordinator.
>
> **2026-08-14 F1a save-integrity overlay:** `@cf/persistence` now treats both
> recovery copies as untrusted input. `readSaveWithRecovery` supplies the coherent,
> supported-envelope predicate to `SaveRepository.recover`; the repository classifies
> the exact backup before it may replace an invalid primary. Corrupt or future backup
> bytes leave the original invalid primary untouched, and a future primary still never
> invokes recovery. The direct exporter contract proves all supported fixture families
> satisfy the boot envelope, while repository reset clears the canonical complete
> `STORES` list so future stores cannot escape a wipe. This implements the bounded F1a
> pre-classification overwrite/reset-coverage repairs only. The then-current one-blob store,
> cross-tab last-writer-wins behavior, split schema, CAS, receipt journal and migration
> authority remain F3 work; Gate C still requires real veteran/device evidence.
>
> **2026-08-14 Charter current-truth overlay:** `@cf/scene/charter.ts` still owns the
> verbatim `ASC_CHAPTERS_DATA`, `bankLandfall`, canonical completion test and system-derived
> reach stage. The Phase-4 app must not render that legacy data directly. Its `fillCharters`
> and top chip use `projectV2Charter` / `currentV2Objective` with the actual `ascStage()`:
> only a reach-valid `landfall` goal is visible, the fresh Sol path stops at a development-slice
> boundary, and no visible completion grants a drive, reward, canonical chapter or new reach.
> `bankLandfall` rejects non-integer, non-finite, negative, terminal and out-of-range chapter
> positions without touching `ascProg`. The canonical array, chapters, goal arrays and goal
> objects are deeply frozen, so the UI's projected goal aliases cannot rewrite process-wide
> truth. `reconcileV2Chapters` evaluates one stable saved reach stage and advances every
> consecutive complete projection. `doLand()` banks only a genuine first landing but reconciles
> after every successful Land action, so a saturated imported record can recover without a
> duplicate landing or progress write while incomplete and unpowered records remain still. Unit
> controls cover malformed indexes, recursive ownership and 0→3/stop cases; a real-browser
> emulated-phone Mercury touch re-land proves the exact ledger in memory, IndexedDB and reload for
> powered, matched unpowered and powered-incomplete fixtures. The one-shot aggregate completion
> replaces adjacent ambient feedback in the same polite status region, and an already-open Charters
> panel refills from the advanced ledger. Mining, fabrication, bioscan, conquest, breeding, rewards,
> accepted chains and weeklies remain unported v2 work.
>
> **2026-08-13 canonical CF1-address overlay:** `@cf/scene/address.ts` introduces the
> pure `resolveCF1WorldAddress` boundary. It accepts only exact uint32 seeds and finite
> public coordinates, normalizes legacy two-decimal CF1 coordinates, probes neighboring
> generator cells, and re-derives galaxy → coarse/fine star → planet ordinal from the
> deterministic sources. It returns only source-derived hierarchy fields and fails closed
> for malformed, missing, ambiguous or throwing source data. `jumpToView` now applies that
> resolver to externally searched `type:'planet'` CF1 routes before reach, survey card,
> custom name, persisted view or navigation can see the supplied parents; a valid route
> still focuses system survey and only explicit Land enters the surface. The real-browser
> control rejects a same-reach forged galaxy parent while preserving query, focus, nav,
> Atlas, landings and names, and the pure suite covers Sol/Earth, a fine-layer world,
> coordinate-boundary rounding, malformed/forged children and ambiguous generation.
> This is deliberately **not** a universal ingress claim: boot-saved views, Atlas rows,
> galaxy/star-only CF1 routes, generated descents and all future ownership/receipt writers
> still need their own canonical boundary integration.
>
> **Historical 2026-08-21 GitHub Actions budget overlay, followed by the current Arc 1C authority:**
> the repository is public, so standard hosted runners
> are free while visibility remains public; 3,000 is the fail-closed private/ambiguous cap and mode
> is `UNFROZEN` in `GITHUB_ACTIONS_BUDGET.md`, with no Arc 1B hosted attempt currently authorized.
> PR #32 integrated the guarded workflow at `d4ab7e6…`: the former every-PR/every-push parallel
> battery, automatic agent-branch sync, and post-green `workflow_run` publisher are retired as
> default execution paths on the remote. `.github/workflows/test.yml` exposes one tiny authorization job followed by
> one fail-fast serial runner whose display name remains the required `battery` context and whose job id remains
> `v2-compendium-memory` for the sealed Edge workflow control. It is eligible only on a PR
> `labeled` event where the repository owner applied exact label `actions-budget-approved`. The
> dependency preserves the sealed Compendium owner's no-`if` contract. Branch direction runs in the
> authorization job; cheap/static gates run before the shorter SceneMemory exact-Edge ruler, then
> Compendium and Chrome work; each dependency tree installs once; the first red skips later gates. No push, PR synchronization, merge, or ordinary label starts
> a runner. Branch-flow, agent-sync, and manual-preview workflows are manual-only, false-default,
> and job-guarded. Branch publication is manual-only and hard parked until a later reviewed exact-SHA
> promotion contract. `tools/actions-budget-policy.js` validates direct YAML ownership and
> negative-controls every trigger/input/job/publisher/concurrency direction plus unknown workflows;
> root `validate.js` runs its real policy first. At that historical Arc 1B boundary the local branch
> added the exact Edge `.93` scene-memory-v1 phase after the terminal verified `.86` Compendium
> phase; it was not yet pushed or hosted. Current Arc 1C workflow authority instead installs exact
> Edge `.101` and runs `scene-memory-v2.json` / 42 outcomes. The historical 250 ms activation
> `59530da3bf40965adf9c54f169b310e11ccdd0f8` and the active cross-host repair
> `7d8dc380cd89ef53aac5a11c3850316e19e1aae9` are distinguished in the current overlay above.
> Hosted run `32618995487` remains terminal-red at 40/42 and provides no hosted authority. The old parallel structure and automatic publishers
> remain truthful history only. Development/production target isolation, manifests, origin refusal,
> noindex/robots, target-specific credentials, and the rule that previews are not human/release
> authority remain unchanged; no publication is currently authorized.
>
> **2026-08-11 v2 integration/hardening overlay:** PR #10 merged the Platinum
> repair into `develop` at `61cc058`. The current bounded port candidate makes the app
> TypeScript configuration and v2 browser gates part of CI; narrows the DOM
> compatibility waiver; hardens SessionRNG; protects sparse/corrupt/future saves
> and IndexedDB retries; bounds cosmic epoch; preserves complete Atlas star
> coordinates; contains malformed Compendium rows; prevents repeat landfall,
> stale-card and direct-code landing outcomes; round-trips accepted custom planet
> names; repairs lazy species-art subscription; and gives phone lower chrome a
> measured 4×2 non-overlap contract. At that 2026-08-11 boundary the slice still stored one exported save
> blob, `NavState` was not yet a discriminated union, complete CF1 hierarchy and
> legacy checkpoint restoration remained open, and CFB still lost hybrid
> parents. Runtime priorities at that boundary were Compendium virtualization,
> scene texture ownership/memory proof, live HD planet replacement, clock/visibility policy,
> then living organism rigs and biome scenes. Platinum-approved static portraits
> remain frozen; optional polish is not a mandate to repaint them.
>
> **2026-08-12 root browser-harness overlay; 2026-08-15 selftest update:** legacy `tools/uilayout.js` now
> consumes the v2-owned browser resolver and raw-CDP launcher instead of owning a
> second candidate list, guessed port, WebSocket loop and cleanup path. The shared
> lifecycle uses browser-assigned port 0 plus `DevToolsActivePort`, records exact
> executable/`Browser.getVersion` provenance, retains bounded startup stderr,
> detects early exit, and performs bounded TERM→KILL shutdown with validated
> profile removal. Layout evidence is an ignored atomic schema-v2 report that
> transitions from `running` to terminal `pass`, `fail`, or `instrument-fail`
> while retaining the legacy `results` array. Full PASS additionally matches all
> 787 `viewport/surface/name` keys from the sealed v1.8.9 layout report; targeted
> runs remain scoped. `--selftest` replaces a seeded stale PASS with an exit-73 red
> record, proves freshness/cleanup, then removes one sealed outcome with consistent
> counts and requires rejection;
> `--verify-run=ID` rejects the wrong attempt. CI runs both before separately
> uploading the required report. Root and v2 manifests/locks both declare the
> pinned `ws` transport and Node `^20.19.0 || ^22.13.0 || >=24.0.0`. Root preflight
> launches the selected executable through `browsercdp`; its selftest rejects
> executable non-browsers and excluded Node lines. `bootperf` shares the executable
> resolver and `ws` transport but retains its legacy CDP lifecycle. Two evidence
> callers continue to deviate from the 15-second CDP-start default. The final
> development-preview package check keeps its fixed 30-second allowance. Root layout
> `tools/uilayout.js` is the battery job's first real browser launch; after the same diagnosed
> pre-endpoint phase recurred at 24 seconds in run `31758515194` and at 30 seconds in run
> `32375329693`, it now owns one explicit 45-second startup / 15-second socket / existing
> 30-second command / 5-second shutdown call, captured by a one-open selftest. The
> browsercdp selftest's first real provenance launch alone now owns a fixed 45-second
> absolute spawn → endpoint → socket-open allowance. The selftest isolates its
> earlier injected WebSocket timeout behind a private launcher seam: the seam writes
> one valid owned endpoint and starts one portable Node child to prove the 200-millisecond socket
> timeout, exactly one fixture launch, socket close, child shutdown, and profile
> cleanup without launching Chrome. Run `31870103561` then proved that a valid endpoint does not
> itself prove an open socket: the cold live leg reused its 1,500-millisecond command ceiling for
> the handshake and failed before `Browser.getVersion`. `webSocketOpenTimeoutMs` now owns that phase,
> defaults to the startup budget, and is clipped to the absolute startup time still remaining on a
> monotonic clock. It begins before WebSocket construction, and `onopen` rechecks the deadline. A
> delayed portable socket must outlive a 100-millisecond command ceiling, open inside its default
> 1-second socket/startup budget, and answer fake provenance. Separate controls reject after an
> explicit short socket cap, clip a longer socket cap to a shorter startup remainder, reject an
> exhausted deadline before socket construction, reject a constructor that consumes the remaining
> phase budget while requiring a provisional error handler before CONNECTING-socket cleanup, and
> reject a just-late open before its overdue
> timer runs; nonpositive/fractional caps reject before launch.
> The cold live leg declares a 15-second socket cap inside its 45-second startup budget; its later
> warm leg keeps 10 seconds for both. Both retain 1,500-millisecond command and 2-second shutdown
> bounds. Post-open `send()` uses one absolute monotonic deadline per command: a callback that wakes
> early re-arms only the remaining interval and cannot reject before the boundary; the response path
> independently rejects at/after that same boundary. This is the bounded repair for run
> `32350971816`'s `1999.758726`-millisecond early timeout. The later caller-local 45-second cold
> envelope addresses only run `32367902426`'s pre-provenance Linux first launch. Run
> `32375329693` then opened exact Edge under that envelope but expired during the generic selftest's
> 1.5-second `Runtime.enable` before the collector. The Edge-only workflows therefore use
> `port/v2/tools/compendiummem-browser-preflight.mjs` for one exact-authority fresh-target proof at
> 45-second startup / 15-second socket / the sealed 5-second candidate command / 2-second shutdown.
> This file is outside the hashed measurement graph, while `browsercdp.mjs` remains byte-identical at
> `6892dea6…`; the active `6ba58522…` ruler is not recalibrated. It is not a product cap increase or
> retry. The live legs
> assert profile cleanup in `finally` on either rejection or success, and never retry. Every platform captures the exact options
> passed by the preview caller and completes a real browser outcome. On POSIX the
> preview selftest starts Chrome immediately but withholds its
> ready CDP endpoint for 16 seconds: the generic path times out while the exact preview
> caller retains its full 30-second startup window, answers `Browser.getVersion`, and closes.
> On macOS the shared launcher and the resolver's launch-facing `--print`
> command also reject the Codex Seatbelt environment before spawn. Three supplied
> Edge crash reports share a main-thread `TransformProcessType` /
> `_RegisterApplication` SIGABRT within 100 ms; the system log confirms denied
> LaunchServices and WindowServer lookups. Approved out-of-sandbox execution removes
> the Seatbelt marker and remains the supported real-browser path. The historical
> `port/spike` renderers resolve through the same launch-facing guard rather than
> invoking a macOS browser directly.
>
> PR #27 run `31887203990` exposed the earlier endpoint-publication boundary during the
> ninth fresh browser of the full Glass matrix: the final `DevToolsActivePort` path existed,
> but the reader observed parser-invalid content and failed after 364 milliseconds;
> all eight earlier and three later rows passed under the same pinned Chrome. The shared
> launcher now requires two consecutive identical, fully valid raw snapshots before socket
> construction. Parser-invalid regular-file content is treated as potentially incomplete only
> within the existing one-process monotonic startup deadline. Wrong file types, symbolic links and
> unexpected
> filesystem errors fail immediately; persistent malformed content reaches the unchanged
> deadline with its last parse diagnosis and no socket. Portable controls stage a
> valid-looking endpoint prefix, a port-only file with its endpoint line missing, and invalid
> endpoint syntax before their final values, and separately prove persistent-malformed rejection,
> immediate unsafe-file cleanup, one launch, final-endpoint identity,
> socket/child closure and profile cleanup. No retry, relaunch, per-viewport sleep, browser
> reuse, fallback change or timeout expansion follows.
>
> The live v2 interaction surface uses Pixi `autoDensity` so its CSS canvas and
> hit coordinates stay viewport-sized at DPR > 1. `effectiveDensityPlan()`
> follows the touch-2 / desktop-3 heat caps and retains native backing through
> UHD 3,840×2,160. Ordinary viewports may use 8,388,608 backing pixels per
> full-screen canvas /16,777,216 aggregate; a viewport strictly above 8,388,608
> CSS pixels selects the ultra tier of 2,073,600 per canvas /4,147,200 aggregate.
> `fitResolutionToPixelCap()` searches against the actual rounded width and
> height, so desktop-8k and 5,120×2,880 each own two 1,920×1,080 stores
> (4,147,200 pixels combined), at DPR 0.25 and 0.375 respectively, without
> rounding above cap. Density transitions release and collapse the prior
> backdrop before resizing/allocating the replacement, record exact peak and
> budget ownership, then update Pixi screen/texture/event geometry even when a
> same-aspect logical resize retains the same integer backing dimensions. Both
> downshift and restore require a strict exact-target/`Browser.getVersion` pair,
> an advancing later post-render ticker turn, and stopped/stale-ticker negative
> controls. The transition still uses the existing full scene rerender; this is an
> allocation tier, not a newly implemented scene-art quality tier. Survey
> cards expose minimum-44px **Enter galaxy / Enter system** actions, and touch
> Planetside has a minimum-44px **Leave world** action. The eighth dock slot opens
> the canonical **Guide to the Universe**: `guide-content.ts` carries a
> source-addressed v1.8.9 snapshot of all 9 categories /43 authored stable ids /41
> legacy-live topics—currently 24 partial and 17 unavailable—plus category browsing, search and
> `data-gt` cross-links. A
> capability table supplies current copy for partial systems and explicit
> unavailable copy for unported mechanics; dormant `beacon` / `events` remain
> retained but hidden. `release-content.ts` similarly preserves all 56 legacy
> releases /398 bullets and keeps **A New Foundation**, the cumulative categorized
> v2.0 development bulletin, separate. Its 54-bullet implemented-outcome outline is explicitly
> `draft` / `Unreleased`; structural and rendered controls require canonical section
> order, unique nonempty bullets, scroll-reachable tail copy, and unchanged `rnSeen` /
> `releasePending` across open and reload. `V2_CURRENT_RELEASE_VERSION` is `null`,
> so that playtest identity cannot trigger an update or imply a production release. The Guide also renders the full source
> commit supplied by the guarded development package. First Guide open persists
> `seenGuide`. Import moved to **Settings →
> Bring expedition** through the same guarded loader and a named, focus-trapped
> top-layer modal. The live primary is parsed from the whitespace-trimmed JSON
> candidate, while the best-effort `cf_v2_import_original` keepsake retains the
> exact submitted text; a selected file is browser-decoded to text, so the
> moderator-held external file remains the byte-for-byte authority. Planet cards bind the captured galaxy+star `{seed,x,y}` context
> before Land/Atlas/Share, rejecting equal-seed coordinate substitution.
> Guide and Settings render above an open survey card; other panel stacking
> remains unchanged for Training. Field Training is six live
> chart/travel/landing lessons plus an honest graduation. Tooltip deep-links,
> Advanced Briefings and the full 21-step curriculum remain OPEN. The newer
> D-TRAIN-1 overlay above records exact legacy-checkpoint restoration. Lazy species art uses
> exact broker leases plus a serial close-at-idle dedicated worker, not a shared renderer import
> callback; Compendium and Planetside bind exact 132px owners, release stale work, and virtualize
> the 1,500-row list without retaining list-scale callbacks, portraits, or main-thread painter work.
> Survey presentation filters the legacy `Spectral class` descriptor row. Planet
> rarity is absent before landing and shown afterward as the plain display-grade
> name. Internal `.designation`/`spectral()` data remains deterministic for art and
> parity, and real stellar G/K/M/remnant classification remains ordinary identity.
> Each panel and Survey card owns exactly one top-right 44px Close action. On desktop,
> notifications plus Settings and Records share the bottom-right utility edge; balanced
> padding, separators and borders use the same glass geometry.
> `panels.ts` retains element-identity ownership for registered panel roots/openers and reads
> `data-panel-boundary` for non-dismiss chrome. The top bar, dock, Survey and both desktop rails
> declare that metadata; Search intentionally does not. Real-CDP smoke hits the exact 8px gap in
> each rail, requires the current panel/ARIA state to survive, removes each marker independently
> to recreate dismissal, and proves the opposite direction on a hit-tested canvas point. Both
> delegated document handlers reject non-`Element` targets before `closest`, restoring the legacy
> event-boundary guard without changing modal, Training, Search or Escape policy.
> Short-landscape panel-open uses a nonmodal split safe workspace: Compendium occupies the left
> safe-height column with a scroller recomputed from the safe viewport; Search, dock, and Survey
> when open remain visible, named, focusable, hit-testable, and operable at right. Panel-open
> status already yields trail/objective, while the short-landscape rule additionally yields only
> noninteractive top/context/hint chrome. Glass drives real hostile A++ first/middle/last and
> focus-pinned rows plus clipped-ancestor controls. This is a bounded geometry repair, not a broad
> presentation-polish claim.
>
> V2 now applies imported Text size / tone / font preferences, a contrast-safe
> 0.82..0.98 glass floor, safe-area and measured dock/context/hint offsets,
> minimum-44px panel/touch controls, focus-visible and forced-colors treatments,
> named sliders/import controls and opener focus restoration. Motion Auto tracks
> the OS live; Reduced removes CSS transitions/animation and freezes Pixi ambient
> clocks while snapping camera/fade state. The canvas is a named keyboard region:
> arrows cycle the actual rendered galaxies/stars/planets, Enter/Space invokes the
> same survey path, +/- zooms at the target and Escape releases it, with a visible
> ring and polite live announcement. Clipboard denial selects the exact CF1 code
> in Search and says Copy is unavailable; it never reports a false success.
> Portrait Planetside now derives its usable band from visible fixed top chrome,
> the last visible trail edge, and measured safe/dock/context lower chrome. It
> retains the trail only when a 72px useful roster plus 6px clearance fits;
> otherwise `syncSurfaceChromeBottom()` applies `surface-trail-yield` to hide the
> noninteractive trail while preserving a minimum-72px vertically scrollable
> roster. `syncDockH()` and `syncCtxH()` reclassify after asynchronous chrome
> measurement, and space restoration restores the trail. Glass-matrix controls
> `planetside-portrait-band-viability` and
> `planetside-portrait-trail-fallback` prove both directions.
>
> The matrix import fixture is witnessed as event-owned phases rather than a
> blind reload delay. One `cf-v2-import-phase/v1` stream binds the exact phase id,
> old document token, target session/default top execution context, and top-frame
> loader. A successful no-pending-save path is `invoked` (ticker running) →
> `claimed` → `no-active-persist` → `primary-write-started` →
> `primary-write-complete` → `release-started` → `release-complete`, with the
> ticker stopped after `invoked`; the alternate path inserts
> `waiting-active-persist` / `active-persist-settled`. Its absolute 20-second
> clock begins before one bounded `Runtime.evaluate({awaitPromise:false})` arm
> command, which receives no fresh deadline and is recorded with the evidence.
> Sticky CDP receipts then require exactly one valid
> `cf-v2-reload-release/v1` witness within that same import bound; allow 5 seconds from that receipt for a
> top-frame commit with a changed loader; and only then start the replacement
> document's independent 20-second boot budget. `replacementNavigationOutcome()`,
> `importReleaseOutcome()`, `importReleaseSequenceOutcome()` and
> `replacementReadyOutcome()` validate receipt time,
> exact target session, default top-frame context identity/generation/origin,
> expected URL, changed loader and changed document token. Old-context/global loss
> alone is not navigation or boot evidence. Pixi initializes with
> `autoStart:false`; the replacement emits the exact event-owned
> `cf-v2-boot-phase/v1` sequence `app-init-start`, `app-init-complete`,
> `backdrop-complete`, `save-load-start`, `save-load-complete`, `scene-rendered`,
> `slice-published`, `wiring-complete`, `ticker-started`, `first-tick`,
> `ready-scheduled`, `ready-emitted`. Each stage binds the target session,
> default top context, generation, origin, changed loader and document token.
> Ticker state must remain false through `wiring-complete` and true thereafter;
> only after the real tick/render, animation frame and later task does the
> replacement emit the optional `cf-v2-slice-ready/v1` tail binding. Two strict,
> no-retry, at-most-2-second target cycles then confirm that exact ready context.
> Each `Runtime.evaluate` is sent concurrently with root-session
> `Browser.getVersion`; cycle 1 samples immediately and cycle 2 awaits a one-shot
> Pixi ticker callback scheduled after the render listener, with a strictly
> advancing tick count. A timely browser heartbeat plus a timed-out/lost exact
> context is `product-unanswerable-after-ready`; an unhealthy heartbeat or
> malformed protocol outcome is instrument/transport failure. The live command
> ledger contains exactly five bound rows: import arm, cycle-1 target/heartbeat,
> and cycle-2 target/heartbeat. `browsercdp.send()` permits a shorter per-command
> timeout but never one above its connection-wide ceiling; one absolute deadline owns that timeout,
> and any early timer wake re-arms only the remaining interval before it may reject. Its browser-native
> `performanceNow` must also be strictly below 20 seconds; an exact-boundary
> control fails, preventing Node observer descheduling from laundering a late
> product boot. Ready is publication evidence; the two confirmations additionally
> prove an immediate target turn and a later post-render ticker turn, while later
> driven controls remain the broader answerability outcomes.
> `replacement-document-loader-token-phase`,
> `reload-resource-release`, and `replacement-boot-phase-sequence` negative-control
> same-loader token mutation, lost/rejected phases, wrong/duplicate/malformed
> session-context-loader-token events, stalled or just-late transitions, missing/
> reordered/identity-mismatched boot stages, early/running tickers, retained
> canvases, unreleased renderer and over-budget aggregate backing pixels.
> `ready-confirmation-heartbeat`, `ready-confirmation-ticker-progress`,
> `ultra-viewport-render-budget`, and `ultra-same-backing-resize` bring the plan
> to 57. Reports distinguish executed, product-blocked, and omitted controls so a
> product failure is not overwritten by a generic instrument omission. Sticky
> fatal Page/Runtime/Inspector/Network events
> remain authoritative even when the bounded diagnostic ring rolls over; the
> command never retries a red run. `import-phase-sequence` and
> `replacement-ticker-quiescence` additionally reject missing/reordered/wrong-
> operation receipts, a stopped ticker before `invoked`, a running ticker after
> claim, and exact-boundary-late arm or phase evidence. No timeout increase or
> `Promise.race` is placed around IndexedDB durability.
> The import-phase and generic release binding handler assigns a monotonic ordinal
> only across those two binding kinds for one armed capture. A successful terminal is
> exactly `release-started` N → release N+1 → `release-complete` N+2. Only that
> release-first intermediate remains pending under the unchanged import deadline;
> phase-complete-first, premature, nonadjacent, missing, late, duplicate, malformed,
> wrong-provenance, early boot/ready, and overlong phase evidence fail closed.
>
> `scheduleReplacementReload()` is the product half of that contract. All five
> intentional replacement transitions—Training restart after `persistView()`,
> atomic Training completion, persistent Training recovery, accepted
> `importBlob()` after `repo.write()`, and the storage retry after real
> bytes reappear—first claim one mutually exclusive replacement transaction, then
> stop a running outgoing Pixi ticker synchronously before any persistence await,
> stop ordinary persistence and call the boot-installed
> `releaseRendererForReload()`, and cross one task boundary before
> `location.reload()`. The release hook removes renderer-density listeners,
> destroys Pixi with global/child texture resources, detaches `app.canvas`, and
> collapses both it and `activeBackdropCanvas` to at most 1×1. It optionally emits
> the release witness through a CDP `Runtime.addBinding` seam before the execution
> context dies. This path is deliberately not registered on generic `pagehide`:
> a browser-cache restoration must not revive a destroyed Pixi application. A
> failed or rolled-back flow restarts only a ticker that its exact claim stopped;
> a successful replacement destroys the already-quiescent app. Invalid import
> bytes reject before claim and leave the live ticker unchanged.
>
> Test-battery #199, run `31571459050` / job `94034164092`, exposed the former
> old-token 10-second timeout at desktop-8k and a small-phone Planetside/trail
> overlap on pushed `33ea341`. Pushed repair
> `8b8a740286a56591cac9dc5734a2fba4c088939b` passed its exact sequential local
> battery. Matching test-battery #200 passed every root/product/v2 gate, one-run
> smoke, full 12-viewport matrix, personas and preview packaging; only final preview
> CDP startup failed before a page existed after that process lost the previous
> step's Chrome environment and selected Linux Edge. Pushed
> `4d14a75e934536dc5f204e40c74f666cc9514df4` moves the browser pin to job scope,
> and `08379d8c072c7eb22e2a029d666972c86d496326` carries the shared root-layout
> launcher/report.
>
> Matching test-battery #201, run
> [`31586917924`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924) /
> job [`94082765087`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924/job/94082765087),
> completed once without retry and is **RED**. Every preceding gate, including
> `smoke:ci`, passed. Only desktop-8k preference import instrument-failed after
> the former 20-second replacement wait while the old loader remained and its
> slice token/import phase were absent. That is not a save-classifier rejection
> or reported repository-write error.
>
> Matching test-battery #202, run
> [`31594595288`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288) /
> job [`94106996466`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288/job/94106996466),
> completed once without retry at pushed `93f75a93ab80a3b199e55b5b49d9488e8fc57f53`
> and is **RED**. Every earlier root/product/v2 gate and `smoke:ci` passed. Only
> desktop-8k glass import/replacement instrument-failed after its first observer
> result arrived at 61.163 seconds. The former probe serially awaited three CDP
> commands that each owned a 30-second ceiling, so this is ambiguous instrument
> latency—not evidence of a 61-second product boot, save rejection or product
> failure—and remains preserved without retry.
>
> Prior immutable executable source `20896ad410b48ae0c407a9f3d6885d30ec6657b1`
> remains preserved clean evidence for the post-write release/ready contract before
> the ticker-quiescence repair. Prior #201 and #202 remain preserved red without retry.
>
> Test-battery #203, run
> [`31602984470`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470) /
> job [`94134750800`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470/job/94134750800),
> completed once without retry at exact pushed head
> `38e4f362533e272f56f708229f7a037f38ae8951` and remains **RED**. Every
> preceding root/product/v2 gate and `smoke:ci` passed. Eleven glass viewport rows
> passed; only desktop-8k import reached 20,015 ms before any release, ready,
> navigation, fatal, command, or event evidence. The outgoing 5,461×3,072 Pixi
> ticker remained active across the durable-write await and teardown under CI
> software rendering. This is a pre-release renderer-pressure cliff, not save
> corruption or a reported repository-write rejection. Preserve #203 without
> retry, timeout increase, or an IndexedDB timeout race.
>
> Before clean certification, one smoke attempt correctly refused mixed-source evidence
> because tracked documentation changed during its run (`source identity changed during
> slice smoke`). That single execution had no automatic retry and remains coordination/
> instrument evidence, not a product failure.
>
> Immutable executable source `7d9980e37e60f0cec8cb840e75098872b9cc90d0`
> then passed the complete exact sequential battery: root preflight selftest and
> owned-CDP preflight (only Edge 151 versus pinned Edge 150 drift), validate/fingerprint,
> root smoke, root layout selftest, `exact-7d9980e-root-layout` 787/787 across 10/10
> viewports plus exact-run verification, rarity 60M/0, dead-code 3 tooling references,
> v2 24 files / 273 tests / 1 skip, and every type/art/override/coverage/spec/instrument
> selftest. One-attempt `smoke:ci` passed 0 findings / 10 screenshots. Exact-source
> certifying glass at working-tree digest
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
> passed 12/12 viewports, 52/52 controls, `omitted=[]`, 0 findings/instrument failures/
> retries, and all 12 exact import-phase/release/ready paths in 194–239 ms. Desktop-8k
> recorded a 3 ms arm, 21 ms phase span with ticker true only at `invoked`, 0 ms write,
> 19 ms release, both 5,461×3,072 canvases →1×1, `performanceNow` 199.5 ms, 1 ms
> confirmation and 239 ms total. Nine automated personas passed. The initial malformed
> `npm run perf -- --runs=4` command was rejected before browser startup; the correct
> single terminal diagnostic recorded 646/726/74/157 ms (painted/answerable/press→panel/
> rebuild) and was not a retry of an evidence failure. Exact 37-file / 10,170,996-byte
> preview `dev-preview-exact-7d9980e` verified and browser-smoked PASS under Edge 151 at
> 320×568 for expected origin `https://dev-celestialfrontier.github.io`, distinct from
> production, content SHA-256
> `a4a3d0f6300df1bf14a21149b53c0a4591283ae2e4ab3ab5b4034cdd130409a7`, exact
> `port/v2` tree `5e90265993304c5b03e49a7baef2479ae2c37184`, `publishable:false`.
> `7d9980e` remains immutable prior exact evidence. The later prior repair
> evidence is bound to clean executable source `46fb627` below. The
> artifact is origin-bound but not authorized for hosting or
> publication; human playtest, Ready and merge authority remain open.
> Development preview origin/package requirements live in
> `port/DEVELOPMENT_PREVIEW.md`; they do not constitute a release or deployment.
>
> Matching test-battery #204, run
> [`31612817092`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092) /
> job [`94168172635`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092/job/94168172635),
> completed once without retry at exact pushed head
> `4cee7d807b8f9258e370aad31c30756269f95a96` and remains **RED**. All earlier
> gates plus `smoke:ci` passed. Desktop-8k import/write/release/navigation/load/FCP
> were healthy: the arm command queued for 9,504 ms, release completed in 35 ms,
> the changed loader arrived at 45 ms, load at 231 ms and FCP at 268 ms. The new
> document then produced no ready witness within 20 seconds and no fatal event.
> Root cause was the combination of two independent full 16,777,216-pixel
> full-viewport allocations and Pixi `autoStart` before asynchronous boot wiring;
> this is not an import, repository-write, release, navigation, load or FCP
> failure. Preserve the single red execution without retry or deadline growth.
>
> Immutable executable source `46fb627640e42ea0f43e2e144529884a959d1e72`
> passed the exact local battery. One malformed `--verify-run` operator invocation
> caused local SIGABRT/report overwrite; one correct rerun plus verification passed
> `exact-46fb627-root-layout`, 787/787 across 10/10. V2 passed 273/1 plus every
> gate/selftest; one-attempt smoke passed 0/10. Full certifying glass at source-snapshot digest
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
> passed 12/12, planned/executed 53/53, `omitted=[]`, zero findings/instrument
> failures/retries in 170–197 ms. Exact 8K was 190 ms total: 2 ms arm, 35 ms
> release→changed-loader commit, 137 ms commit→ready, `performanceNow` 170.5 ms,
> 1 ms confirmation, both outgoing 3,862×2,172 canvases →1×1 and the replacement
> pair at 16,776,528 pixels combined. Nine automated personas passed; terminal-
> only performance was 595/676/76/168 ms. Manifest
> `dev-preview-exact-46fb627` records 37 files /10,176,376 bytes, content SHA-256
> `4d7638e92c4d02cffb953c9588bb1fff2e4c38153c3ff4ad752687e4a0263b58`,
> exact tree `0d47d77a303244fd8ce325a5d2ec975dac0c86ca`, expected origin
> `https://dev-celestialfrontier.github.io`, production distinct and
> `publishable:false`. `46fb627` remains prior immutable exact evidence. No preview
> host, human play, Ready, merge, release,
> deployment or version authority follows from local automation.
>
> Matching test-battery #205, run
> [`31621227550`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550) /
> job [`94196289291`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550/job/94196289291),
> completed once without retry at exact pushed
> `c57305fbf30af2bc8158ff46af1ec49ec4455d95` and remains **RED**. Every
> preceding gate and `smoke:ci` passed. Desktop-8k completed import/write/release,
> changed-loader navigation, all 12 boot stages, and ready at browser-native
> `performanceNow` about 3,733 ms; only the next exact-context command timed out
> at two seconds. With no concurrent browser heartbeat, #205 is strong evidence
> of post-ready target starvation but not retrospective proof of healthy browser/
> CDP transport. Preserve it without retry.
>
> Prior diagnostic only: the earlier `dirty-diagnostic` targeted/smoke/glass
> captures based on `c57305f` remain non-authoritative; their sandbox `EPERM` and
> corrected `7680.000000000001` assertion did not retry a product failure.
> Immutable executable source `135a635d066d1c67e3096dc134de9247267898d5`
> passed the complete exact sequential battery from clean source-status SHA-256
> `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
> and source-snapshot
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
> A sandbox-only Edge SIGABRT interrupted preflight/CDP selftest; the same checks
> passed outside sandbox without product retry. Root validate, legacy smoke,
> rarity and dead-code passed. Root layout
> `exact-135a635d066d-20260812T192848Z-root-layout` passed 787/787 across 10/10
> under Edge 151 in 75,532 ms (report SHA-256
> `7e2689c31e1095885ee8139bb395b40e799972461649efd100b631a4e6e9f85f`).
> V2 passed 273/1 plus all type/art/override/coverage/spec gates. One-attempt
> slice smoke passed 0 findings /10 screenshots /0 retries in 105,379 ms (report
> `c838f3e7dfdf161b7bfa6111c6979215a2ba439fdd44a4cb8e00a8cdf7c3d1a5`).
> Full certifying glass passed 12/12, 57/57 unique, `blocked=[]`, `omitted=[]`,
> zero findings/instrument failures/retries in 52,254 ms (report
> `1f14906d178528613fdf52db53ee4e1f84b6a48ceb21ad3a41bd9d0c5348b23b`),
> with 176–185 ms reloads. Exact 8K was 185 ms total /2 ms arm /12 ms
> invoked→release /32 ms release→commit /122 ms commit→ready /152.2 ms
> `performanceNow`; target confirmations were 1/9 ms and heartbeats 1/1 ms.
> Outgoing/replacement stores were 2,730×1,536 each; outgoing stores collapsed
> to 1×1 and replacement stayed 8,386,560 combined pixels. Nine automated
> personas passed—not human play—with JSON/Markdown SHA-256
> `c17c44fcb3d534707dc6186bbd4fbcae4d1cfea511bdec8a263ec48be4927a58` /
> `43d5d52e44d7d19aec597a3df5b2599c0da143bb7170d16c17ed141bd390d6b4`;
> terminal-only performance was 578/659/76/170 ms. Preview
> `dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked PASS under
> Edge 151; manifest
> `0233984ca2bad28c189e979d4a30082d6137a06e8eac086c3b2525989813dd4e`,
> 37 files /10,186,230 bytes, content
> `da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`,
> tree `d1ab1d79fba4ba2939c3e1ec0661fb60498afb23`, expected separate origin,
> production distinct and `publishable:false`. Live Git/status/PR checks determine
> the docs-only tip; matching CI and host/human/Ready/merge/release/deploy/version
> authority remain open.
>
> Test-battery #206, run
> [`31635297321`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321) /
> job [`94243979205`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321/job/94243979205),
> completed attempt 1 without retry at exact pushed
> `558e0565d368a0b81d86d99fd380ebc50d30bc02`; merge `e160577` is tree-identical.
> All earlier steps and `smoke:ci` passed. The 8K reload passed in 8,749 ms;
> ready `performanceNow` was 2,578.6 ms, and target cycles were 1,905/1,910 ms
> with 3/1 ms heartbeats. The later 5,120×2,880 transition's exact-context
> `Runtime.evaluate` timed out at 2,003 ms versus the strict 2,000 ms bound while
> `Browser.getVersion` answered in 2 ms; `last:null`. The sole
> `ULTRA_VIEWPORT_RESIZE_UNANSWERABLE` is a product answerability finding: all 12
> viewports ran, with 1 product finding, 0 instrument failures, 56 executed plus
> 1 product-blocked control =57, `omitted=[]`, 0 retries, and no persona/preview
> output. Preserve #206 red without retry.
>
> Test-battery #207, run
> [`31642880191`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191) /
> job [`94269466117`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191/job/94269466117),
> completed attempt 1 without retry at exact pushed
> `ff9bebb22aaac0e95cd406e1e15737898452911a`; merge
> `8dfe018590edf8a5d15291730c873869b96caae2` is tree-identical. All prior gates,
> `smoke:ci`, and 11 glass rows passed. Tablet-portrait alone instrument-failed
> because a healthy valid release witness arrived between `release-started` and
> `release-complete` and the observer rejected that intermediate. Release itself
> was healthy. The report records 0 product findings, 1 instrument failure, 57
> planned/listed controls, empty blocked/omitted ledgers, 0 retries, and no persona/
> preview output. Preserve #207 red without retry.
>
> The dirty #207 diagnostic (report
> `805b50cb9341dfa49df6136565f050609b65d78387975e3c90c54ca937f4713b`) remains
> chronology only. Immutable executable source
> `6554b2be652c083bc9ff7ed11c2f928e90b74660` passed the complete exact clean battery
> at clean status/snapshot `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` /
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
> The first sandboxed preflight Edge launch SIGABRTed before CDP; the same invocation passed
> when permitted with only Edge 151/pin-150 drift—an environment refusal, not a product retry.
> Root gates and exact layout 787/787 across 10/10 passed (report
> `58dc4ef4456fac012b2e8f0aa801917b5579cffe435fd4576827ff29bcbb4b78`); v2 passed 273/1 plus all gates;
> one-attempt smoke passed 0 findings/10 screenshots in 105,430 ms (report
> `139b10ea16d17c109d5b624fa75daf73291d98f5ad8fe7df569501829ab5f844`; log
> `76a40b9bd8f88dd5f5ebdc09271c0ed289478795d6cd011338df349438ef62b8`).
> Certifying glass passed 12/12 and 57/57 in 54,877 ms with exact 6/7/8 tails on every
> row, empty blocked/omitted ledgers, and zero findings/instrument failures/retries (report
> `a05ba65e28ac94b146b051164c1b22195bfaa7509bd47d9631561fc394920b6c`). Tablet-
> portrait was 196 ms with commands 2/1/1/7/0 and ready `performanceNow` 166.3 ms;
> exact 8K was 197 ms with commands 1/1/0/7/0, release→commit 34 ms, commit→ready
> 131 ms, ready `performanceNow` 163.6 ms, outgoing 2,365×1,330 twins →1×1, and
> replacement 6,290,900 pixels combined. Nine automated-only personas and terminal-only
> 635/717/77/151 ms performance passed. Preview
> `dev-preview-exact-6554b2b-20260812T184000Z` was browser-smoked under Edge 151 over loopback,
> bound to the expected separate development origin, with `publishable:false` and content SHA-256
> `04bb2c095468a61834992c970a8ac7c364efb37df9ac4397966fd3a4bc43e69d`.
> That immutable source remains prior #207 executable evidence; live Git/PR state determines
> the current tip, upstream, and checks, and the selected pushed tip requires matching CI.
> No host/human/Ready/merge/release/deploy/version authority follows.
>
> Test-battery #208, run
> [`31649176954`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954) /
> job [`94289516851`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954/job/94289516851),
> completed attempt 1 without retry at exact pushed head
> `ee8bc281c424b5a8f998dc7327372e5f5a18067d`; merge `8fc6b4fc` is tree-identical,
> and branch-flow run `31649175614` / job `94289512873` passed. Steps 1–15 and
> `smoke:ci` passed. Desktop-8k alone then reported
> `REPLACEMENT_UNANSWERABLE_AFTER_READY`: valid 2,365×1,330 replacement stores
> scheduled ready at browser performance 584.3 ms but emitted at 3,143.8 ms, a
> 2,559.5 ms gap; exact target cycle 1 timed out at 2,003 ms against the strict
> 2,000 ms bound while the concurrent heartbeat answered in 1 ms, with no fatal.
> The complete 12-row report records 1 product finding, 0 instrument failures,
> 57 planned controls with `ultra-same-backing-resize` product-blocked,
> `omitted=[]`, 0 retries, and no persona/preview output. Preserve #208 red.
>
> The current fixed tier above 8,388,608 CSS pixels is 2,073,600 pixels per
> simultaneous canvas /4,147,200 aggregate, producing exact 1,920×1,080 stores at
> 8K DPR 0.25 and 5K DPR 0.375 while leaving native UHD unchanged. The unchanged
> two-second/heartbeat/ready/retry contracts and literal old/new-shape negative
> controls make this a sustained deterministic product repair rather than a pause.
> The `d8684c415a729222dd1a290e166a2a71ea79f72f2457d2ad144f434a82c30a8b`
> dirty-worktree PASS is prior diagnostic chronology only. Immutable clean executable source
> `307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed committed-clean root layout
> 787/787 across 10/10 (`c42a50873ad01a91dd439860f41f1d695a7d2bf5c41521ed8b7eb768b7ee4975`),
> v2 273/1 plus all gates, one-attempt smoke 0/10 in 105,339 ms
> (`90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723`; log
> `fe8c5d42eec2a09641f3f551486046559cd4c5956591b5a7d71a25b48d926af1`), and glass
> 12/12 unique rows and 57/57 controls in 53,083 ms with exact 6/7/8 release tails,
> five-command ledgers, empty blocked/omitted ledgers and zero findings/instrument failures/
> retries (`42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f`). Exact
> 8K was 171 ms / browser performance 161.9 ms, commands 1/1/1/3/0 ms, 33/129 ms
> release→commit/commit→ready, and two 1,920×1,080 stores /4,147,200 pixels at DPR 0.25;
> terminal-only performance was 606/685/74/171 ms. Automated persona JSON/Markdown hashes
> are `61d73fc9e11f55bc99f153aa6483661d1dc143104dab4d0cb728a48b68b485c5` /
> `fdd7ce423cee68ef2584190bb056afd4b32a41c4158957da0e3a571b02f8c495`.
> Preview `dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was browser-smoked
> under Edge 151 over loopback, bound to expected separate origin
> `https://dev-celestialfrontier.github.io`, with `publishable:false`; manifest/content/tree
> hashes are `1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d` /
> `5db7790977071235ed164fb8f382bd67421c9fd5e834a504cdb4e1a1e8f47589` /
> `5b8e1f649b1259f96f5de6d7e8aca0377bc2cf10`. Live Git/PR is authority for current
> tip/upstream/checks; the selected pushed tip requires matching CI.
>
> Immutable clean executable source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
> remains prior exact #206 executable evidence (clean status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
> snapshot `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`).
> Root preflight warned Edge 151 vs pin 150; validate/smoke, layout 787/787 across 10/10,
> v2 273/1 plus all gates and one-attempt slice smoke 0/10 passed. Certifying glass passed
> 12/12, 57/57, empty blocked/omitted, zero findings/instrument failures/retries in
> 52,557 ms (`7fe33219e70361140ebc931f0d77fca0976a46fe51eecc42815f41eba110980c`).
> Exact 8K was 203 ms / `performanceNow` 158.2 ms, targets 1/10 ms, heartbeats 0/0 ms;
> outgoing 2,365×1,330 stores →1×1 and replacement stayed 6,290,900 pixels combined.
> Nine automated-only personas and terminal-only 581/659/73/152 ms performance passed.
> Preview `dev-preview-exact-df1c28b-20260812T211642Z` was browser-smoked under Edge 151
> over loopback, bound to the expected separate dev origin, with `publishable:false`, manifest
> `758a67e0fedda16392c5f1e0230c57dd0bc32c38aaab612abb816484afcaad02`,
> content `98f1a6dcfb98be7e64269ed53323539ba185035571078eff2289accf43f9e2c0`, tree
> `435c363e3e049f353e74ce71ed2a5fb4e3514c69`. That source remains prior #206 evidence;
> both it and clean `6554b2b` remain prior evidence; clean `307b8aaf` is current local
> #208 executable evidence. No host/human/Ready/
> merge/release/deploy/version authority follows.
>
> **v1.6 additions not yet folded into the sections below** (see ART_DIRECTION / PROCEDURAL_CHARACTERISTICS /
> UI_PRESENTATION / SPECIES_AND_GENOME for detail): the Earth-bestiary rig system (`_rig*` per class) +
> `hdGenesFor` procedural phenotype resolver + `hdBeastBare` structural-skin/limb/tail/habitat-preserve
> passes; landing sub-surface scenes **`_hdReefScene`** (coral) and `_hdAbyssScene` (deep), routed from
> `showVistaBox`; `_hdBiomeDress` biome cases. New verification tools: `tools/render-audit.js`,
> `tools/rig-audit.js` (193 sentinels), **`tools/biome-audit.js`** (biome-layer integrity), and proof
> sheets `tools/sheets/biome-coverage.js` (MODE=earth|proc, EMPTY=1), `proc-skins.js`, `proc-aqua.js`,
> `b15-butterfly.js`.

> **2026-08-10 port/v2 full-catalogue reset overlay (historical; superseded for live delivery by
> the 2026-08-17 broker/worker overlay above):** PixiJS owns the live
> galaxy/world scene in `port/v2/apps/game/src/main.ts`; deterministic organism
> anatomy was generated by Canvas2D painters through
> `packages/art/src/speciesart.ts` and displayed as DOM `<img>` portraits in the
> Compendium/planetside UI. The genetics facade records the selected Earth
> lineage's exact `_earthBlendKingdom`; `speciesoverrides.ts` sends fauna to the
> lineage-aware HD fallback except for the exact reviewed set Fruit Bat, Eagle,
> Wolf, Elephant, Chameleon, Dragonfly and Octopus, whose marked hybrids use the
> lineage-owned modern painter. Sea Turtle and Great White Shark remain protected
> on the reviewed legacy route; flora/fungi/microbe use the exact kingdom+name
> owner before generic procedural mapping. Portrait and thumb caches canonicalize
> the complete deterministic genome because `A×B` and `B×A` can share a seed while
> inheriting different traits. The schema-v4 hybrid contract guards 13 exact
> five-stage lineages /251 assets spanning every kingdom, including Amoeba as the
> principal microbe row, plus route/cache/mixed-owner negative controls. The exact
> source-`03ea297` package review returned **PASS with optional polish only**; the
> sealed preparation status remains immutable and final all-bloodline certification remains open.
>
> `gp71rejudge.mjs` guards set-aware references; `gp71compare.mjs` exact-joins
> old/current 1,250-image roots; `fullresetlayout.mjs` derives the official 181
> families / 233 packets; and `fullresetreview.mjs` binds each verdict to clean
> 40-hex provenance, native 440px, unlabeled 300px, actual unlabeled 132px,
> labelled old/current and exact `mustRead`/procedural-plan hashes. Clean reset
> commit `bc26e8` produced the first complete official baseline: **516 PASS / 14
> POLISH / 720 FAIL** across all 1,250 rows. It is fully fresh but not
> certification-eligible.
>
> Wave 1 owns exactly **177 r1 non-PASS targets**: root 38 (2 fungi + 8 microbes +
> 28 procedural), fish 59, trees 48, and fauna2 32. Independent 440/300/132
> rejudging closed all four groups **177/177 scoped PASS**. Source ownership is
> bounded to `alientraits.ts`, `invertoverrides.ts`, `proceduralfamilies.ts`,
> `proceduraloverrides.ts`, `speciesoverrides.ts`, `faunaoverrides3.ts`,
> `florarost.ts`, `floraoverrides2.ts`, and `faunaoverrides2.ts`. These scoped
> verdicts are not a replacement full-catalogue score. Wave 1 is committed and
> pushed as `d005090f`.
>
> Apple's focused continuity repair remains independently accepted under its
> historical ruler. Vanilla Orchid r6 was
> independently PASS at `floraoverrides2.ts` SHA-256
> `5BB258D5CD808C63EE2FA2625D100ABA2E0FC6BA31EF62B60661D8114E00135E`:
> the pure portrait remained byte-exact, five stages were unique and progressively
> farther from pure, defining organs survived, and joins remained continuous. The
> sealed schema-v3 evidence validated 234/234 assets and both browser orders; it is
> superseded for the broader 2026-08-11 Platinum ruler by the 13-lineage /251-asset
> schema-v4 contract. The earlier
> `FAIL_BYTE_IDENTICAL_STAGES` state is closed diagnosis, not current status.
> Whole-form routes return
> before legacy generic painters; features behind that return are inert, while a
> second same-target overlay risks double-painted seams. The pixel-neutral flora
> cleanup made the strict/reset tree flags mutually exclusive for 39 overlapping
> names and removed dead orchard/citrus alternatives with 0/174 tree-surface and
> 0/332 Earth-flora native drift.
>
> Wave 2a is committed/pushed as `00e499c`. Mammal A
> is 4/4 independently PASS (Colugo, Sugar Glider, Fur Seal, Sea Lion); INVERT
> worms+sessile is 13/13 PASS; and S1–S3 is 15/15 PASS after bounded R2 closed
> Caddisfly, Diving Beetle, Firefly and Water Beetle at 440/300/132. Its 156
> current/repeat PNGs are exact and all 22 protected rows remain byte-identical.
> The combined 32-target scope is 32/32 PASS. This is not a new catalogue tally.
> Wave 2b is independently **51/51 scoped PASS**: Mammal B 25/25, Bird B1
> 21/21 and Invert I 5/5. Each lane failed closed and reran only its bounded
> blockers: six Mammal R3 rows (Brown Bear, Grizzly Bear, Bobcat, Lynx, Serval,
> Sand Cat), four Bird R2 rows (Secretary Bird, Rhea, Seriema, Hummingbird), and
> Banana Slug's 132px tentacle/eye read. Final source SHA-256 values are
> `quadrupedoverrides.ts` `288E54795D4EBD52EE131E4691AFED98AA7409BC033228FE0274B099B6FE7DAE`,
> `mammaloverrides.ts` `2BB3541963F610B3D4504BEC423C982E1F11E902BD6200AD64E332B8F853CEAA`,
> `faunaoverrides.ts` `783DCCE7641E9EA826296922E9787CEE33857A6853CD96563E88F374F1C9BF10`,
> `birdoverrides.ts` `B5DEBDCA726F48E8405F1D9F47D019E8472A2786825F35DCCFF1E147936494DF`,
> and `invertoverrides.ts` `9173B81703BE955B857ED5D3A39B09DD196967C63DE40E764D8F79EDB1832B1D`.
> Their current/repeat and protected-control evidence is sealed. The final
> integrated gates are green with all five source SHAs unchanged: typecheck and
> artunused pass; speccheck is 417/0/0; overridecheck is 1,014/1,014 catalogue
> and 1,010/1,010 Earth routes; speciesaudit is 1,250/1,250 with zero failures,
> duplicates or clipping; targeted/full diff checks pass. Wave 2b is committed/
> pushed as `9c148f0`, but this scoped closure does not change r1's 516/14/720 or close
> full recertification, ZIP, reset PR or release.
>
> Wave 2b is committed/pushed as `9c148f0`. Wave 2c is independently **56/56
> scoped PASS**: Mammal C 13/13, Bird B2 28/28 and Invert II 15/15. Mammal C
> progressed from 0/13 candidate-ready through 8/13 and 11/13 previews before
> Red Panda's continuous leg/body join and Tasmanian Devil's integrated chest
> band closed. Bird B2's first independent judgment returned 25 PASS /3 FAIL
> (Eider Duck, Rail, Avocet); Invert II's returned 13 PASS /2 FAIL (Krill,
> Tadpole Shrimp). The final exact-five repair was independently accepted.
>
> Final Wave-2c sources are `quadrupedoverrides.ts`
> `45B1C645952DAC02EFF9B0D5266BA31DCED6D89176F51417B85A7B0F0B37BB59`,
> `mammaloverrides.ts` `50B3B2FFEBF2C6DF1842B9E545CEBC79C4880F376FDD96CA8E8C612150C47EC2`,
> `faunaoverrides.ts` `D7917829228DEFFF764D9C5224D55A4C6A708B9FCEDAE4FF7E34149375A907C5`,
> `birdoverrides.ts` `C7D536C679460E0BE8ADF38CF14DF0FF3EB4F4E35C6827D8D51DF2997FE8BD21`
> and `invertoverrides.ts` `6A4020DD69E65473E8034C58FA398A3099A1339B94D83A838A10EE5C905451A0`.
> The shared final-R2 root is
> `port/v2/apps/game/smoke/wave2c-shared-final-r2-evidence-2026-08-10`; manifest
> SHA-256 is `BCB5282571903AC2057F6A5B9F7FCA09C6DE8372E4FEFEEAD8D34340930CE330`.
> It binds 249 rows, 747 surfaces per run, exact A/B, 579 baseline-exact protected
> surfaces, 168 changed target surfaces, three drift-free 139-file input
> snapshots and three rejected negative controls.
>
> Integrated Wave-2c gates are green with all five hashes unchanged: typecheck,
> artunused, 23-file Vitest (238 passed /1 skipped), speccheck 418/0/0,
> overridecheck 1,014/1,014 live +1,010/1,010 Earth, speciesaudit 1,250/1,250
> with zero failure/duplicate/clipping, hybridcheck with 11/11 injected failures
> rejected, hybridmatrix/speciesstrip/fullresetlayout/fullresetreview selftests,
> coveragegap 1,010/1,010 with zero remaining and `git diff --check`. Wave 2c is
> committed/pushed as `dc015cf`, but full recertification, ZIP, reset PR, merge
> and release remain OPEN.
>
> Wave 2d is independently **50/50
> scoped PASS**: Mammal D 16/16, Bird B3 27/27, and Invert III 7/7. Mammal D
> failed closed on six preview blockers, then on Civet's still-round muzzle;
> Civet-only R4 supplied the continuous pointed muzzle. Bird B3 progressed from
> 11/27 candidate-ready through an exact-16 R2 and exact-three tail/streamer R3.
> Invert III progressed from 5/7 through an exact-two Camel Spider/Tarantula R2.
> Every final verdict is author-separated at 440/300/132.
>
> The final root is
> `port/v2/apps/game/smoke/wave2d-shared-final-r4-evidence-2026-08-10`; manifest
> SHA-256 is `DC21922F21E881348263C1B7CE6E8E68C6686752CE782FAA607B3AE6E7398BCE`
> and pre-edit seal is
> `7C68250E3BED9AE64FD5066A4D5389C45056600F09E48B1287253AB20E6B877F`.
> It binds 304 rows =50 targets +254 protected controls and exact 912/912 A/B
> surfaces; all 762 protected surfaces match baseline, all 150 target surfaces
> changed, Civet-only R4 changed 3/3, and the other 909 surfaces stayed exact.
> Three 139-file input snapshots have zero drift and four negative controls were
> rejected.
>
> Final Wave-2d source SHA-256 values are `faunaoverrides.ts`
> `63D7A9B1E3AE8E2FE359137A030E1AE8AEFC3328ACB5C88FB6E59E7F014A2DA2`,
> `birdoverrides.ts` `48FFA589F2273F0F29FD85DF1F05FD070477ADE70F1CDEB7698F5321E5702DC7`,
> `quadrupedoverrides.ts` `544F5A6582F467E744C5F2A3ABF0EDF61DE5A5180CF5658155594E5FF86316C1`,
> `mammaloverrides.ts` `776FB86FF9A42E348A9278F98F7DC03584568C65A09C637CB1D7BFA38BB7A46E`,
> and `invertoverrides.ts` `2BB40BD1838D6B6B01F09B01D3BC4CBE7B00D0F0C219FEA5926BF076A4F39677`.
> The prior `marsupial-c1`, Skua-colour, and shadowed Invert-II-option P2 items
> are now proven pixel-neutral against all 254 protected rows.
>
> Integrated Wave-2d gates are green with those five hashes and the 139-input
> aggregate unchanged: typecheck/artunused, 238-pass/1-skip Vitest, speccheck
> 419/0/0, coveragegap 1,010/1,010, artaudit 23/0, tokencheck selftest 16/16,
> overridecheck 1,014/1,014 routes +1,010/1,010 species, speciesaudit 1,250/1,250
> with zero failure/duplicate/clipping, hybridcheck and its 11 negatives,
> hybridmatrix/speciesstrip/fullresetlayout/fullresetreview selftests, and
> `git diff --check`. Wave 2d was committed/pushed as `2ed0f28`. The frozen r1 ledger stays
> 516/14/720; full recertification, ZIP, reset PR, merge, release, and deployment
> remain OPEN.
>
> Wave 2e is the exact static 47-target scope Mammal E 13 + Fauna E 21 + Invert
> IV 13. Checkpoint `5db9039` reached `develop` through merged PR #8 at
> `bb1a980`; its four frozen art-source hashes remain exact. No Wave-2e visual
> verdict exists. The documented 288-row/864-PNG pre-edit root stayed under
> ignored `port/v2/apps/game/smoke/` on Windows and is absent from the Mac clone
> and every Git ref, so its recorded seal `BC424C8F…AA37`, index
> `2AE4FDB1…26E3`, protected roster, and one-off controls cannot be independently
> verified here. Recover that exact root and producer, or explicitly authorize a
> deterministic `2ed0f28` reconstruction that reproduces both hashes, before
> post-edit A/B promotion. The browser review tools also hard-code Windows Edge,
> so their historical passes are not fresh Mac results.
>
> The independent Mac-side repair is tooling-only: `overridecheck` now delegates
> each complete TypeScript art source to pinned Rolldown 1.2.1/Oxc and counts only
> literal string property/array AST nodes. Every such key is validated regardless
> of length or alphabet, and malformed CANON keys cannot disappear. Exact controls prove inline/ternary
> values are not keys, later duplicates survive template/regex,
> control-head/member-call, Unicode-identifier and ASI grammar traps. Full-source
> declaration traversal covers parenthesized, annotated, comment-separated and
> later `const` declarators; post-declaration writes/aliases and malformed
> route-table source exit 2. Painter values must be statically callable (and
> quadruped specs objects) through immutable, unwritten exact local/import bindings;
> supported factories must return a direct callable expression. Neither `null!`,
> mutable aliases, nor truthy objects count as painters. The denominator is one exact
> four-kingdom `_EARTH_NAMES` AST with its read-only consumer pinned.
> Wiring is measured only from supported route-selection
> initializer AST shapes, exact precedence and executable guard/call/fallback/furniture chains, and
> the `ink.c` → `fitInk(ink.cv,c,…)` → returned-`cv` path inside parsed
> `resolveOverride`; disconnected consumers, always-false predicates,
> discarded/inert syntax, and later count-summary mentions cannot mask a disconnected
> table. Computed route members/methods outside exact audited consumer nodes fail closed.
> Recursive `.ts`/`.mts`/`.cts`/`.tsx` discovery rejects untracked executable imports/re-exports;
> normalized full-path plus actual-export ownership prevents nested same-basename/export
> impersonation. Shadow direction follows resolver precedence, and helper binding/implementation
> drift, direct trusted-global escape, and incomplete kingdom-qualified route coverage fail.
> The sentinel assumes standard unmodified platform intrinsics and approved dependency implementations;
> it is not a visual verdict. It reports
> 1,014/1,014 live routes and 1,010/1,010 Earth
> species without changing a painter.
>
> The v2 renderer caps DPR at 2 for touch/coarse pointers and 3 for desktop. An
> accidental unreferenced 26,400×19,800 PNG at `packages/art/src/5` (2,029,643
> bytes), twelve superseded local painters and definite no-op locals were removed
> with consumer/pixel proof. The live acceptance contract is
> `port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`; no GP7/GP7.1 band is
> a current PASS, and no final all-PASS ZIP or reset PR exists.

---

## 1. What the game is

**Celestial Frontier** (subtitle *Cosmic Codex*) is a single-file, offline-capable
HTML/Canvas game about exploring a deterministic, procedurally generated, effectively
infinite universe. The player is an **explorer** running an **expedition**: they zoom
from the open universe → into a galaxy → into a star system → down onto a planet
surface, surveying worlds, cataloguing alien life, breeding hybrids, conquering planets,
and assembling the **Prime Codex** (9 legendary "Signatures") to win.

- **Genre:** procedural exploration / creature-collection / light tactical combat.
- **Tone:** awe-driven, "pure dopamine," endless exploration; you *cannot* truly finish it.
- **Platform:** runs as a single `.html` file in any modern browser, desktop or mobile.
  Designed mobile-first (the player tests on iPhone).
- **Persistence:** browser `localStorage` only (per-device, per-browser). No server.

### Win / end condition
Complete the **Prime Codex** by claiming all **9 Signatures**, then choose an **ending**
(there are multiple ending paths, e.g. a Prismatic ending requiring conquest + a sapient
find + a deep Compendium). The universe remains open and playable after winning.

---

## 2. Files & build/test workflow

| File | Purpose |
|---|---|
| `main.js` | **The source of truth** (~24,300 lines). **Gitignored** — recoverable from the committed html, see below. |
| `celestial-frontier.html` | **The build artifact, and the entire shipped game.** ~26,750 lines, ~1.93 MB. **TWO** `<style>` elements (append new CSS to the **LAST**), then markup, then one `<script>` from ~line 2,420. **All CSS lives here — there is none in `main.js`.** |
| `original/celestial-frontier-v1.0.html` | Pristine pre-refactor v1.0 build (source of the determinism baseline). |
| `tools/` | Verification toolkit (`npm install` once; see `tools/README.md`). |
| `celestial-frontier-codebase-reference.md` | **This file.** |

*(Counts corrected 2026-07-30. This table read "~8,000 lines, ~462 KB … one `<style>` … `<script>` starts ~line 948" — off by more than 3× and wrong about the number of `<style>` elements, which matters because appending CSS to the first one silently does nothing.)*

### Working method (important for future edits)
Edit `main.js`, never the html in place, and validate before shipping:

1. Edit `main.js` via exact, unique string matches (a bad match must never
   silently corrupt the file). **CSS is the exception — it lives only in the html**;
   append to the **LAST** `<style>` element. `build.js` preserves it.
2. `node tools/build.js` — assembles `main.js` (+ the html's own CSS/markup) into
   `celestial-frontier.html`.
3. `node tools/validate.js` — rebuilds, then runs `node --check`, CSS brace balance,
   duplicate-id check, version consistency, class→rig binding, colour atlas, biome
   profiles, render audit, the no-`Math.random`/`Date.now`-in-domain-modules grep, a
   headless **jsdom boot** (zero errors required), and a **50-probe determinism
   fingerprint** that must match the v1.0 baseline (`tools/baseline.json`) byte for byte.
4. Ship the updated `celestial-frontier.html` only when everything passes (§12 lists
   the full nine-suite battery and which four gate every batch).

> ⚠ **`node tools/extract.js` is NOT part of this loop.** This section used to open with
> it as step 1, which is the most dangerous stale instruction this file has ever carried:
> `extract.js` regenerates `main.js` **from the html** and silently discards every edit
> made since the last build. It is a **one-time bootstrap for a fresh clone**, and the
> reason `main.js` can be gitignored safely (`node tools/extract.js celestial-frontier.html <out.js>`
> recovers it — always pass an explicit output path). The everyday command is `build.js`.
> CLAUDE.md rule 4 has carried this warning for some time while this file still
> recommended the opposite — a reminder that a correction must be applied everywhere the
> old claim lives, not just where it was noticed.

**Encoding caution:** the source mixes encodings — some unicode is stored as literal
backslash-u escape *text* in JS strings (renders at runtime), some as real UTF-8 chars
(—, ·, ❤, emoji). In Python here-docs, a single `\uXXXX` decodes to a real char; double
`\\uXXXX` stays literal. Prefer HTML entities (`&middot;`, `&mdash;`) in static markup to
avoid escape-text rendering bugs. Use `cat -A` to see true bytes before matching.

---

## 3. Core architecture

### Module structure (SOLID restructure, June 2026)
The script is one strict-mode IIFE organized into three strata (full map in the
`ARCHITECTURE` comment at the top of the script):

1. **Domain modules** — banner `@module <Name> [domain]` — pure, deterministic,
   no DOM/clock/`Math.random()`. Each is a revealing-module IIFE that returns a
   frozen API object, destructured back into script scope so call sites keep
   their original names (`const {mulberry32,…}=Rand;`). In dependency order:
   `Rand` (PRNG/hash/noise) → `PlanetGen`, `Naming`, `WorldConfig` (anchors),
   `StarCatalog` → `WorldGen` (cell-based generation) → `SurveyPhrases`,
   `SpeciesTraits` → `Genome` → `EncUtil` (b64/SVG-URI) → `Genetics`
   (evolve/cross) → `Ecology` (biospheres/civs) → `Descriptors` →
   `CombatCore` (battle stats, abilities, duels, CFB-codes).
2. **Art & service modules** — `@module <Name> [app]` — deterministic canvas/SVG
   art and self-contained services: `ThumbArt`, `GalaxyArt`, `SpeciesArt`,
   `Fx` (bursts/shake/fanfares), `SaveSystem` (save/load/reset/wipe),
   `Renderer` (the four `draw*` passes).
3. **App sections** — `@section <name>` — UI panels, input, progression wiring
   and shared mutable state. Cross-section mutable bindings (e.g. `essence`,
   `hp`, `pstats`, settings flags) deliberately live in plain script scope: a
   destructured module export would not propagate reassignment, so a module may
   only own a `let` that no other section reassigns.

**`_hdLater(fn, ms)`** (2026-07-29) sits at game-IIFE top level, immediately after
`@end PlanetGen`, and is the one scheduler both art modules use for their
"instant lo → async hi" upgrade. While `_introUp()` is true it re-polls at 250ms
instead of rendering, because HD synthesis behind the first-run naming screen is
invisible *and* blocks the only control on screen (measured: 6440ms → 1905ms to an
answerable gate on a 4×-throttled phone profile). It lives at top level on purpose —
its callers are in two *different* nested module IIFEs (`ThumbArt.getPlanetSprite`,
`GalaxyArt.getGalaxySprite`), and a helper belongs in the scope of its **callers**.
See UI_PRESENTATION.md § "THE ART-HOLD LAW" and `tools/bootperf.js`.

**`_szOf(g)`** (v1.8.9) is exported from `Genome` and is the single definition of "what size
means": `size % FA_SIZE.length`, the value the card prints. `crossGenome` mutates `size` without
wrapping, so bred genomes drift past 5 (~12% by generation 5); six readers used to take it raw and
classified a "tiny" creature as Megafauna with the full rarity boost (vit 68 vs 52, measured). It is
exported rather than duplicated **because a second inline copy is exactly the bug it fixes** —
v1.8.6 computed the same truth about `size` in two places and they disagreed. Guarded by
`tools/sizedrift-check.js`.

⚠ It was first written as a module-private helper and called from `@section descent`, which threw on
the landing path. `validate`'s jsdom boot passed, because nothing throws until you actually land on a
world — **`smoke` caught it** (553 → 551). Exporting one more name means all three places: the banner
`API:` line, the `Object.freeze({…})` return, and the destructuring line beneath it.

Names not in a module's `API:` list are module-private (interface segregation).
To export another name, extend all three: the banner `API:` line, the
`Object.freeze({...})` return, and the destructuring line after the IIFE.
Extension points are data registries (open/closed): trait tables,
`ABILITY_THEMES`, `GRADE_TIERS`, `REGIONS`, `SIGS`, `ACH`, `EVENT_DEFS`,
`MODE_PAINTERS` (mode → draw pass).

### Rendering
- **Canvas2D** full-screen (`#cosmos`), redrawn every frame via `requestAnimationFrame`
  (`frame` → `frameInner`). `DPR = Math.min(devicePixelRatio||1, 3)` caps mobile GPU cost.
- Four zoom **modes** held in `st.mode`: `'universe'` → `'galaxy'` → `'system'` → `'surface'`.
  Each has its own draw function: `drawUniverse`, `drawGalaxy`, `drawSystem`, `drawSurface`
  (plus `drawBackdrop`), dispatched per frame via the frozen `MODE_PAINTERS` registry.
  `checkTransitions` handles zoom-driven mode changes; pinch/scroll
  zoom via `zoomAt` / `zoomLimits`. **Landing assist** (Tier 2): a zoom-IN
  gesture blocked at the system-mode ceiling (`zoomAt` with `f>1` clamping to
  `zmax`) arms `_assistArm` for 450 ms — the one unmistakable "let me land"
  signal. While armed, `checkTransitions` glides the camera toward the largest
  planet past landing size (`apparent>0.40*minWH`, within `d<1.6*minWH`,
  `lerp 0.14/frame`; an instant step instead when `!motionOK()`), never while
  `dragging`/`pinching`, until planetfall fires. Un-armed proximity — surveying
  moons, framing rings, parking — is never hijacked. Canvas tap targets: every
  pick's **minimum** radius scales by `PICK_F` (×1.4 on `TOUCH` devices, ×1 on
  desktop); true-apparent-size components are untouched, so nothing can start
  stealing taps from a bigger neighbor (the moon lesson).

### Determinism (the heart of the game)
Everything is generated from seeds, so the universe is identical on every device and
shareable by code. Core PRNG helpers: `mulberry32(seed)`, `hashInt(...ints)`,
`cellRng(cx,cy,salt)`. Spatial generation is **cell-based**: `galaxiesInCell(cx,cy)`,
`starsInCell`, `fineStarsInCell` generate content on demand per grid cell (infinite world,
low memory). Object descriptors (`planetDescriptor`, `starDescriptor`, `galaxyDescriptor`,
etc.) are pure functions of position/seed.

### Key constants (§ verify in source before relying on)
| Const | Value | Meaning |
|---|---|---|
| `UCELL` | 400 | universe grid cell size |
| `OBS_R` | 5200 | observable radius |
| `GR` | 1200 | galaxy radius scale |
| `SYS_R` | 320 | system radius |
| `HOME_GAL_SEED` | 999 | home (Milky Way) galaxy seed |
| `HOME_POS` | {x:90,y:-60} | home galaxy position |
| `SOL_SEED` | 424242 | our solar system seed |
| `PLAYER_SEED` | 0x50A1E5 | stable seed → deterministic duels vs the player |
| `HARVEST_CD` | 3600e3 | legacy 1-hour wall-clock cadence; retired as the harvest gate in v1.8.8, retained only by the legacy load-time display-stamp floor |
| `SAVE_KEY` | `'cfcc_save_v2'` | localStorage key (v1.5 fresh start; v1 read once for the farewell, then removed) |
| Earth | planet seed **133** | home world, conquered from game start |

---

## 4. World generation

**Historical v2 typed boundary (2026-08-15; current where not superseded):** `galaxiesInCell` returns its
memoized mutable galaxy array with required finite `[0,1]` `web` metadata, even
when the array is empty. `supernovaSites(galaxySeed, epoch)` returns 1–3 typed
sites, each with a typed `NS | shell | BH` remnant and 1–3 births; `epoch` is the
deterministic cache/time key, not a count. A plain `number` cannot nominally
prevent count misuse; stronger epoch ownership was still F4 work at that boundary and is now
supplied by the current app authority. Import is safe,
but an uncached ordinary galaxy/merger/dwarf generation path still needs the
legacy-compatible 16-entry `GAL_SPRITES` binding installed first; empty,
special-only, and cached paths may not read it. The app performs that installation
before generation. `slimGal` is owned by Descriptors in v2, not WorldGen.

- **Galaxies:** `galaxiesInCell`, `galaxyProfile`, `galaxyName`, `makeGalaxySprite`,
  `slimGal`. Special objects: quasars, wormholes (`galaxyWormhole`), supernova sites
  (`supernovaSites`), dwarf galaxies, CMB backdrop.
- **Stars:** `starsInCell`, `starName`, and `starClass` own real astronomical
  M/K/G/F/A/B/O and remnant identity (white dwarf, neutron star, magnetar, red giant,
  brown dwarf, black hole). The separate deterministic `spectral()` designation is
  internal rarity/art data; current v2 does not render it as a **Spectral class** row.
  `starDescriptor`, `supernovaDescriptor`, `protostarDescriptor` remain pure.
- **Planets:** `planetParams(seed)` returns a `P` object with `type` (lava/venus/ice/
  ocean/desert/gas/rocky/terran…), `sizeMul`, `hue`, `ring`, `moons`, plus type-specific
  fields. `planetDescriptor` builds deterministic survey data (atmosphere, climate,
  water, gravity, magnetism, seasons, weather, and an internal designation). V2's
  presentation adapter hides the legacy Spectral row and withholds planet rarity until
  successful landing, then displays only the plain ten-tier name.
- **Moons:** count **scales with planet size** — `base = round((sizeMul-0.85)*3.1)`, `+4`
  for gas giants, `+1` for ice/ocean/terran, then a size-scaled random bump, **capped at
  16**. Gas giants get ~8–13 (Jupiter-like). Sol giants are hand-set (Jupiter 8, Saturn 7,
  Uranus 4, Neptune 4). Moons are named with **Roman numerals** via `roman(n)` (e.g.
  "Jupiter VIII"); labels capped to first 10 to reduce clutter.
- **Sol system:** hand-authored via `SOL_MOONS` and explicit planet objects (Earth=133).
  The game opens here (Phase A).

---

## 5. Life: fauna / flora generation

### Kingdoms
Four kingdoms: **Microbe, Flora, Fauna, Fungi**. A world's biosphere is rolled by
`planetSpecies` / `biosphere` / `realmBiome` / `classifyRealm` based on planet type.

### Genome
`makeGenome` builds a genome; `crossGenome(a,b)` breeds two (preserving kingdom via
`pick(a.kingdom,b.kingdom)`); `evolveGenome` mutates. Genome fields include:
`seed, kingdom, color, form, body, loco, trait, size, diet, head, limbs, skin, tail,
pattern, eyes, behavior, habitat, detail, accent, lumin, gen, heat, parents, mutation`.

Trait arrays drive description & art: `FA_HABITAT`, `FA_LOCO`, `FA_BODY`, `FA_SKIN`, etc.
`describeSpecies`, `faunaDesc`, `speciesName`, `sapienceTier` (intelligence),
`ecologyRole`, `realmModifiers`.

### Art
`speciesPortrait(g)` renders per-kingdom painterly **Canvas** art (microbe = cell cluster,
flora = stalk+fronds+bloom, fungi = mushrooms, fauna = assembled anatomy). In current
`port/v2`, `speciesart.ts` and `speciescompat.ts` expose that synchronous Window-only URL path for
audit compatibility; the production entry graph rejects it as a renderer-reachable dependency.
`leaseThumb(g)` is the Compendium and Planetside path: `SpeciesArtBroker` snapshots the complete
genome, deduplicates/cancels keyed asynchronous jobs, and owns a true-132px LRU capped at **96 / 256**
with decoded-pixel, byte, queue, active-job, lease, and worker-lifecycle limits. The app's default
broker scheduler crosses one animation frame and one later task before every pump; bfcache
suspension invalidates an already-armed pump generation and resume schedules a fresh one. At most
one serial lazy module worker at a time imports the portable painter, creates a 440px scratch canvas,
downsamples to 132px, and encodes the result off the renderer. It terminates after active work
settles and its queue is empty; a later genuinely new producer burst owns a fresh instance/import.
Detail uses an asynchronous broker-owned 440px result rather than the compatibility URL. A persisted bfcache
`pagehide` retains the same document's leases while suspending worker execution; final
non-persisted teardown releases jobs, leases, caches, and the worker. Reveal cards show a
**biome-colored glow** behind the portrait (ability-theme color for fauna, nourished-stat color
for flora).

### Rarity grades
The player-facing `RARITY_V17` ladder has ten grades: **Common, Uncommon, Notable,
Rare, Exotic, Legendary, Mythic, Celestial, Primordial, Transcendent**. The internal
`GRADE_TIERS` / `TIER_MAX = 14` shape remains for deterministic raw rolls, sorting,
old saves, art prefixes, and forced Apex/Paragon indices, but raw tiers 10–14 all
display as **Transcendent** with the same `#F7F1FF` presentation. The retired
Empyrean/Eternal/Omnipotent names survive only as internal art-label prefixes; they
are not separate visible rarity grades or collectible slots.
Specimen cards (`showReveal`) wear a `.gbadge` grade badge; the character sheet shows
"Highest grade ever reached" (a statistic, not an achievement — the summit is deliberately
chased, not checklisted) and "Apex Guardians felled".
`rarityRoll` / `speciesGrade` / `colorGrade` retain the raw deterministic score; higher
scores still drive sorting, stings, FX, and Stardust bonuses (§9). `displayRarity(raw)`
is the canonical clamp. Current v2 routes it through `rarity-presentation.ts`, which accepts only
integer raw values 0–14, returns the exact 0–9 label/color projection, and returns null rather than
inventing disclosure for malformed input. Survey and Compendium consumers use that projector.
Spectral art designations may still combine an
internal prefix with a domain hue (for example "Radiant Fire"), but badges, filters,
items, and collection progress use the ten-grade display ladder. `tiersOwned()` clamps
raw 9–14 to display tier 9, and the historical `tiers12` ID now truthfully awards all
ten displayed grades rather than asking for retired slots.

### Apex Guardians (v1.3)
`guardianFor(pseed)` (Genome module): ~1 in 40 worlds passes the gate
(`mulberry32(hashInt(pseed, 0x6A2D, 0x11)) < 0.025`); rulers split Empyrean 70% /
Eternal 25% / Omnipotent 5%. The guardian is a titanic luminous fauna genome with
`apex:<tier>` (forced grade — `speciesGrade` short-circuits on `g.apex`) and
`ep` (epithet index into `GUARDIAN_EPITHETS`; `faunaDesc` appends it to the name,
e.g. "Nyxora the Stormcrowned"). `apexNative` returns the guardian (flag
`guardian:true`) as the conquest defender of any unconquered fauna-bearing guarded
world; victory stores the guardian in the codex (`stats.guardians++`, achievements
`guard1`/`guard5`, +40 stardust spoils, 👑 cinematic). Guardian-hood never inherits:
`crossGenome` builds an explicit field set (no `apex`/`ep`), and `evolveGenome` only
ever runs on world-roster or crossbred genomes. `normGenome` clamps imported `apex`
to genuine summit values (12–`TIER_MAX`) so hand-edited CFB codes can't mint fakes
beyond what determinism already allows. Probe `guardians` pins the first rulers.

---

## 6. Player stats, combat & abilities

### Player battle stats (`pstats`)
Five stats, all start at **50**: **Vitality (vit), Ferocity (fer), Resilience (res),
Agility (agi), Insight (ins)** — see `STAT_META` for names/colors/descriptions. Stats grow
by **eating flora** (`healExplorer`): each plant nourishes one stat (`floraStat(g)` picks
which) by `1 + tier`. Loaded values clamped 1–330.

- `HP_MAX = hpMaxFromVit()` = `max(20, round(vit*2))` (=100 at start). `recomputeHPMax`
  heals by headroom gained when vit rises.
- `STAT_KEYS = ['vit','fer','res','agi','ins']`.

### Duel combat (`runDuel(mine, theirs)`)
Deterministic per matchup. HP pool = `vit*3`. Per round: initiative by **agi**; damage
≈ `fer*(1+ramp)*(0.8+rand*0.5) − res*0.45`; crit chance = `ins/420 + ability.critB`.
Ability hooks read on the combatant: `dmg, taken, dbl, critB, regen, ramp, dodge, first,
gutsy, drink, burn` (burn = damage-over-time). `battleStats(g)` derives a creature's stats
from its genome and honors `g.brood`, `g.fed`, `g._mult`.

### Abilities (`ABILITY_THEMES`)
**11 biome themes** — fire, frost, storm, tide, stone, venom, void, sand, chem, psionic,
wild — each with a label/color and a list of abilities (~15+ total, e.g. Cinderburn=burn,
Frostbite, Rime Mend=regen, Static Field=critB…). `HAB_THEME` maps habitat→theme;
`abilityTheme(g)` applies loco overrides (gliders→storm, swimmers→tide,
floaters/drifters→psionic, burrowers→stone); `abilityOf(g)` returns the resolved ability
+ theme color/label.

### Where combat happens
- **Duels:** `fightNow`, `startDuelWithCode`, `duelSideCard`, `encodeCreature`/
  `decodeCreature` (CFB- codes to fight a friend's creature).
- **Conquest:** `conquerPlanet` → `runConquestBattle` vs the world's `apexNative`. Win →
  the world is added to `conquered` (Map keyed by planet seed → `{t, tier}`).

---

## 7. Progression systems

### Compendium (species catalogue — formerly "Codex")
The `codex` Map stores discovered species. `discoverSpecies`, `autoScanWorld`,
`_storeSpecies`, `renderCodex`, `removeFromCodex`. **Renamed to "Compendium"** in UI
(button, headers, prose). NOTE: "Prime Codex" (win track) and "Cosmic Codex" (app title)
are intentionally **kept** as "Codex."

The current v2 Compendium projects as many as 1,500 deterministic species through
`CompendiumVirtualList`, mounting only its measured window, bounded overscan, and any
focus-pinned row. Rows acquire 132px art leases; detail alone retains a 440px portrait. Logical
anchor-plus-offset, selected-row focus, and exact release/recovery ownership survive filter,
detail/Back, resize, and close. Native Arc 4 Tame/Scavenge/Sample controls can durably add first-only
catalogue compatibility data after the exact committed transaction verifies; eligible repeats add
only the appropriate stable fauna individual or specimen lot. Failed or refused attempts do not
publish optimistic ownership, reroll, or perform a second write.

The former local ruler is retained as historical evidence under measurement authority
`cb5cd9f86ac99435028f98af800bc0d89de96bd7db88694214d832eed83fb15d` and producer authority
`587d3bdfab471370e625c71d1658e391067881fe824ce14ccfaf7200eb6e4d73`. Clean committed source
`6d8f184…` supplied independent `20260826-phase4-candidate3`,
`20260826-phase4-candidate5` and `20260826-phase4-candidate6` plus paired legacy-product
`20260826-phase4-baseline1`, each one attempt and zero retries. Signed activation
`d33e540f0d620eac34bdc259b7814db0f11a9006` installs rational ceilings strictly above selected
candidate maxima while preserving all four sealed baseline faults and exact 14-phone/13-desktop
breach discrimination. Browser
authority schema `cf-v2-compendium-browser-authority/v2` accepts canonical Microsoft Edge builds
that report CDP `1.3` and satisfy sealed capability contract
`cf-v2-compendium-cdp-capabilities/v1` / SHA-256
`6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476`. Exact product version,
revision, JavaScript version, executable and user agent remain mandatory evidence, but only as one
per-run provenance tuple shared by that run's phone and desktop samples. Independent runs may span
Edge auto-updates without rebaselining or threshold changes; an actual threshold breach still
fails. Exact-budget run `20260826-phase4-certification` passed 78/78 plus its named verifier from
clean committed activation `d33e540…`; exact Edge `151.0.4129.107` is provenance only. Report
raw/gzip SHA-256 are `3afe41034c78c11e1e59eeeff542e00f21a155f99bfc752afea8736a0eddffcd` /
`5677d9ed26cef8be087a87b61fca49aa0ef22d1dd273ed1993a5880079173d70`. For current producer
`f7c87f2263bdac4014e5f56be5efc5ceeca7fbd2e32e25549a6b9e0260354224`, signed source
`8ffd2e2b4a8ba070cb93d3df6a8f4a91a245f527` supplied
`20260826-slice-repair-candidate1/2/3` plus `20260826-slice-repair-baseline1`, each one attempt and
zero retries. Active budget SHA-256 `6284a394664c1039c9aca3f3c6d6dc5caf55295a58f4ac1e361974d3b519de52`
retains the same measurement authority, all four sealed baseline faults and exact
14-phone/13-desktop discrimination. Only the phone warm ceiling changed to `524288`; every other
numeric ceiling is unchanged. Clean signed activation source
`91f4e04410b893c43ee5d261ebfc1fa3be127c29` then passed exact-budget run
`20260826-slice-repair-certification` 78/78 with complete lifecycle and its named verifier in one
attempt/zero retries. It ran `2026-08-26T23:42:19.150Z`–`23:43:03.997Z` (44,847 ms); report
raw/gzip SHA-256 are `81c27ed5caa12e0c114a788041dfc5d109742bb9d86a256b548a8e9443d46108` /
`6f3deb0ff3d748c7477c98c094684a3f1a04eb2ac3ffc89a055ec1c372710571`. This was real producer
drift, not an Edge-version trigger; exact Edge `.107` is provenance only.
SceneMemory and the root Gate-A browser authority are outside this change.

### Star Atlas (bookmarks)
The `logMap` Map. `addToLog`, `renderLog`. Every survey card (galaxy/star/planet/moon/etc.)
has a uniform **bookmark row**: **+ Add to Star Atlas**, **☆ favorite**, **⌂ home** — the
icons auto-add to the Atlas on tap. Entries can be favorited/home-set from the Atlas list
too. (Favoriting unlocks the **Curator** achievement.)

### Breeding & feeding
- `breedPair` — cross two same-kingdom specimens; **consumes both parents** on success
  and failure. Odds via `breedOdds` (boosted by stardust). Works on **all kingdoms**.
- `feedPair` — feed flora to a fauna specimen; `faunaTastes(g)` gives liked/disliked
  stats; preference affects outcome (loved/neutral/disliked events, poison risk).
  Feed is **fauna-only**.

### Stardust economy (`essence`)
The soft currency that boosts breeding odds (`stardustBonus`, `breedOdds`). Faucets:
- **Harvesting** conquered worlds (`doHarvest`, readiness via `HARVEST_EPOCHS` against
  `COSMIC_EPOCH`; `HARVEST_CD` is only the retired legacy display-stamp floor).
- **Spoils of Conquest** — winning a world grants `8 + tier*5` stardust.
- **Rare Find Bonus** — discovering Legendary+ (tier ≥ 5) species grants `tier−3`.
Loaded value clamped 0–1e9.

### Ranks (`RANKS`, `rankInfo`)
By expedition score: **Cadet(0) → Scout(30) → Pathfinder(90) → Voyager(220) →
Pioneer(460) → Star Cartographer(900) → Mythic Wayfarer(1700) → Void Sovereign(3000) →
Cosmic Luminary(5200) → Eternal Frontier(8200)**. Rank-up plays a sting + gold FX burst.

### Frontier expansion (`REGIONS`)
The reachable universe expands as you claim Signatures. Tiers: **the Solar Reach → the
Local Cluster → the Near Field → the Deep Field → the Outer Dark → the Frontier**.
`currentRegion`, `reachRadius`, `withinReach`, `charterBlock` (gates travel beyond reach).

### The Prime Codex (win track) — `SIGS`
**9 Signatures**, each with a `verb` shown on locked slots:
| id | Signature | How | Verb |
|---|---|---|---|
| stone | Stone | conquer a rare rocky/metal/mineral world | Conquer |
| ocean | Ocean | conquer a living ocean world | Conquer |
| flame | Flame | conquer an extreme volcanic world | Conquer |
| sky | Sky | conquer an aerial/gas-giant ecosystem | Conquer |
| life | Life | conquer a complex land biosphere | Conquer |
| mind | Mind | conquer a world with a sapient native | Conquer |
| prism | Prism | conquer a unique prismatic lifeform's world | Conquer |
| star | Star | **find** an extreme star / stellar remnant | Find |
| void | Void | **find** a black hole / void / galactic anomaly | Find |

Logic: `worldSignature`, `speciesSignatures`, `primeCheckWorld`, `primeCheckSpecies`
(species signatures require the world to be **conquered**), `claimSignature`, `primeCount`,
`renderPrime`, `checkFrontier`, `chooseEnding`/`renderEnding`/`openFrontier`.

**v1.5 — THE PATHFINDERS' TRAIL:** the Codex is presented as the endgame arc
(begins where the Ascent ends). Each `SIGS` entry carries `lore` (its lost
beacon's story beat) and `reach` (how far its trail leads); claiming a
Signature unlocks its **relic blueprint** — nine `cat:'relic'` items in
`ITEMS` (one per equipment socket, `sig` field names the gating Signature;
`_canCraft` refuses while `primeFill[sig]` is empty). Claim mechanics,
region gating and endings are unchanged. The "Prime Codex" NAME is law.

### Achievements
`unlock(id)`, `checkAch`, `ACH` list (categories: Cataloguing, Breeding, Rarity, Worlds,
Stellar, Exploration…). Shown in the stats panel as collapsible category groups.

---

## 8. UI layout & panels

### Topbar (unified across desktop & mobile)
Brand hidden; breadcrumb hidden. Layout (flexbox, `--topbar-h` and `--row1-h` measured
live by `syncTopbarH` + ResizeObserver):
- **Row 1:** nameplate (rank pill, opens the character screen) … search box (grows to fill) + 🔔 bell.
- **Row 2:** HP bar (heart + bar + "X/Y HP").
- **Right rail** (anchored to bottom of row 1, `--row1-h`): **Charters** (the v1.5
  prime slot — gold pill) → **Compendium** → **Star Atlas** → **Cargo** (shortcut
  into the character screen's inventory).
- **Left rail** (anchored below full topbar): **Prime Codex** (endgame — moved here
  in the v1.5 swap). Traveler's Beacon + Cosmic Events are HIDDEN for rework
  (`EVENTS_DORMANT`; buttons `display:none`, engines refuse clicks).

In the current v2 app, `app-chrome.ts` is the focused owner for this chrome: safe-text nameplate,
topbar/dock/context/hint publication, the 72px visibility boundary, resize/mutation observers and
dispose-before-replacement. `search-travel.ts` separately owns Search/CF1 travel, native keyboard
listener lifecycle, Compendium continuation/focus and boundary notices. `main.ts` supplies their
rendering and persistence adapters rather than owning either lifecycle directly.

### Key panels / modals (and their elements)
| Element id | What |
|---|---|
| `#panel` | Survey card (scrollable; bookmark row; conquer/share buttons; "locked" pin hint at top-left). |
| `#sheet` / `#sheetcard` | **v1.5 THE CHARACTER SCREEN** — centered overlay (z 24) holding three regions: `#sheetstats` (contains `#stats`), `#doll` (full-body `paperdollAvatar()` + 9 sockets absolutely positioned via `DOLL_ANCHORS` + picker + effect readout), `#sheetcargo` (contains `#cargo`). `openSheet(view)`/`closeSheet()`; `statsOpen`/`cargoOpen` mirror `sheetOpen` for legacy callers. One PANELS entry (`id:'sheet'`, btns `#rank,#cargobtn`); ✕ seated on open. Mobile stacks doll → stats → cargo. The separate legacy ship portrait renders in Shipyard `#yardship`, not on the paper doll. |
| `#stats` | Expedition stats REGION inside the sheet (rank/score, **clickable** battle-stat rows, collapsible **Statistics** + **Achievements**, nameplate picker, rarity ladder). No longer position:fixed. |
| `#codex` / `#codexbtn` | **Compendium** (species). |
| `#log` / `#logbtn` | **Star Atlas** (bookmarks). |
| `#primebox` / `#pcdxbtn` | **Prime Codex** modal (× and backdrop close). |
| `#events` / `#eventsbtn` | **Cosmic Events**. |
| `#daily*` / `#dailybtn` | **Traveler's Beacon** (random destination every 5 min). |
| `#tray` / `#bell` | **Notifications** tray (z-index 40, above rail; 66vh tall). |
| `#searchin` / `#searchres` | Search ("Search discoveries or paste code"); results z-index 40. |
| `#setpanel` / `#setbtn` | **Settings** (see below). |
| `#guidebox` / `#helpbtn` | **Guide to the Universe** — searchable, browsable manual of every system (see "Guide, tooltips & Field Training" below) + credit footer "Celestial Frontier · v<GAME_VERSION> (build <sha>) · Developed by Dakk". |
| `#tipbubble` (JS-created) | Tooltip bubble for `[data-tip]` elements. |
| `#tutbox` / `#tutspot` (JS-created) | Field Training instruction card + spotlight ring. |
| `#namebox` | **Intro / name prompt** ("Celestial Frontier" title, ringed-planet icon, **BEGIN THE EXPEDITION**). Doubles as the **rename dialog** (explorer via Settings → Display → Explorer name or the character sheet's ✎ link; species via card Rename) — rename modes show a **Cancel** button and dismiss on Escape; only the initial naming is mandatory. |
| `#duelbox`, `#pickbox`, `#sharebox`, `#reveal`, `#endingbox` | Duel loader, breed/feed picker, share-code, reveal card queue, ending screen. |

### Settings toggles (persisted; Display / Graphics / Audio tabs)
Display: **Text size** (`fsMode`), **Text tone** (`toneMode`), **Font** (`fontMode`),
**Explorer name** (`#renameopt` → `askExplorerName(false)` — rename anytime, purely
cosmetic: the name feeds no seed, hash or code payload), **Tooltips** (`tipsOn`).
Graphics: **Visual effects** (`fxOn` — particle bursts/cinematics/travel tunnel),
**Screen shake** (`shakeOn`), **Motion** (`motionMode`: −1 Auto / 0 Full /
1 Reduced, resolved by `motionOK()`. **Auto follows the OS
`prefers-reduced-motion` preference LIVE** (`_sysReduced` + a matchMedia
change listener), and because Auto is itself a persisted value, saving never
freezes the OS preference into the save. Reduced skips the travel tunnel,
screen shake and confetti in JS and stamps `body.rmotion`, which stills the
decorative CSS loops: update-pill pulse, cinema rays, events dot, iridescent
shimmer). Audio: **Sound** (`sndOn`),
**Volume** (`#volslider` → `sfxVol` 0..1 — every synth exits through one shared
gain bus `sfxOut(a)`, gain = `sfxVol²`; the survey ping answers on release at
the chosen level), **Notifications** (`notifOn` — silences toast *popups* but
still logs to the bell tray). Plus **Reset Game → Erase Everything**.
All the pill toggles and panel items carry `role="button" tabindex="0"`, so the
global Enter/Space shim (`@section input`) drives them from the keyboard;
`[role="button"]:focus-visible` paints a gold focus ring.

### FX system (`fxBurst`, `fxShake`)
DOM-particle confetti bursts (gold/green/purple/red palettes, capped & self-cleaning) and a
CSS screen-shake. Gated by `fxOn`/`shakeOn` and by `motionOK()` (Motion: Reduced stills both).
Hooked into conquest wins, signature claims, rank-ups, breeding, feeding, eating flora,
harvests, rare discoveries (tinted), damage, and death.

### Escape / dismiss
Global **Escape** first cancels an open rename dialog (`#namebox`, only when
`!_nameInitial` — the first naming stays mandatory), then closes the topmost
dismissible overlay (reveal → pickbox → duelbox → sharebox → primebox → guidebox →
setpanel). All modals also close on backdrop click. Outside-tap closes
Compendium / Star Atlas / Cosmic Events / Settings.

### Guide, tooltips & Field Training (v1.1)
- **Guide to the Universe** (`?` button, `@section guide`): a data-driven manual —
  `GUIDE` holds 43 authored topic records `{id, t, k, body}` across 9 categories;
  41 are live and `beacon` / `events` are retained but dormant. It provides live search
  (title/keyword/body), category drill-down, topic cross-links via
  `<span data-gt="id">`, and a deep-link API `openGuideTopic(id)`.
- **Tooltips** (`@section tooltips`): any `[data-tip]` element shows a one-line
  text-only bubble (`pointer-events:none`) — hover (650 ms) / focus on desktop,
  **long-press (600 ms) on touch**; the long-press suppresses the following tap
  action. Gated by `tipsOn` (Settings toggle, saved as `tips`) and **suppressed
  during Field Training** (the guidance card keeps a single voice). `data-guide`
  attributes remain in the DOM but are currently unused (the in-bubble Guide
  link was removed — not tappable on touch).
- **Release notes** (`@section release-notes`): `GAME_VERSION` + `RELEASES`
  (newest first; categorized sections). Returning saves whose `rn` field ≠
  `GAME_VERSION` get a one-time "latest" popup (`#relbox`, styled like the
  intro card) ~900 ms after boot; dismissing marks it seen. Fresh expeditions
  read the same bulletin between naming and Field Training. The "latest" view
  is **pinned to the entry matching `GAME_VERSION`** (not `RELEASES[0]`), so
  unshipped v-next bullets piling up on top never reach players early. The
  Guide footer credit (`#gcredit`) is the permanent link to the **cumulative**
  history. **House rule: `GAME_VERSION` bumps only when Dakk says so** — but
  every player-visible change is appended to the v-next entry as it is built.
- **Current v2 counterpart** (`port/v2/apps/game/src/guide-content.ts`,
  `release-content.ts`, wired by `main.ts`): `LEGACY_GUIDE_CATEGORIES` and
  `LEGACY_RELEASES` are exact source-addressed snapshots, guarded by
  `tests/guide-release.test.ts`. `getGuideCatalogue` defaults to 41 player topics—currently
  24 partial and 17 unavailable—with dormant topics hidden and unavailable topics retained with
  honest copy; `getGuideTopic` and
  `searchGuide` keep stable ids, search and live cross-links. `fillGuide` /
  `renderGuideMenu` / `renderGuideCategory` / `renderGuideTopic` /
  `renderGuideSearch` own the panel. `getReleaseHistory({includeDraft:true})`
  supplies **A New Foundation**, the cumulative v2.0 development entry, followed
  by the 56 legacy releases. Its exact 54-bullet implemented-outcome
  inventory is checked structurally and in the rendered Guide, including real-scroll
  tail reach and unchanged shipped-release state. That version is development identity
  only. `getCurrentV2Release()` returns nothing while
  `V2_CURRENT_RELEASE_VERSION === null`; `showUnseenV2Release()` therefore
  cannot mutate `rnSeen` or open an update until an authorized shipped v2 entry
  exists. The existing Settings and Saving topics and existing Field Training
  bullet describe the exact current-view success path, partial ownership of genuine
  legacy checkpoints (including their lack of a saved route: Welcome Skip stays
  in Sol and post-Land completion stays at Earth), and the persistent unknown-checkpoint recovery lock without
  adding a topic, capability, category, bullet, release, or version. This ports the data model, browsing and cumulative-history door; v2
  tooltip deep-link triggers and Advanced Briefings are still open.
- **Update watch** (same section): `tools/deploy.js` stamps `BUILD_ID` with the
  git sha and publishes `version.json` beside the game. Live sessions poll it
  every 10 min and on `visibilitychange` (iOS Safari resurrects stale tabs);
  a newer build shows a gold **⬆ refresh pill** (`#updatepill`) + toast —
  deferred while Field Training is active. Refresh is safe (`beforeunload`
  saves). Inert for `dev` builds, `file://`, or offline — the game stays
  fully offline-capable. The Guide footer shows `v<GAME_VERSION> (build <sha>)`.

### v1.2 systems (June 2026)
- **Cinematics** (`@section cinematics`): `cinematic({kicker,title,sub,hex,tier})`
  — full-screen tier-scaled celebration overlay (`#cinema`: rotating rays,
  gradient title), queued so shows never stack, tap-to-dismiss, gated by `fxOn`,
  `fxShake` + double burst at tier ≥ 6. Fired from: tier ≥ 5 discoveries
  (`autoScanWorld` + `discoverSpecies`), bred newborns (picker), conquest wins
  (`runConquestBattle`), and first-time event witnessing (events click).
- **Creature injuries**: `genome.hurt` (0–0.85) persists via the codex save
  (rides inside the serialized genome — no schema change). Sources: winning a
  conquest below 55% HP (`hurt += (0.55-frac)*0.7`), a disliked meal whose
  event has `fed<0` (`hurt += 0.12+tier*0.05`). Healing: feeding — loved mends
  `0.22+tier*0.05`, neutral `0.1`; wounds never heal on their own. Effects:
  `battleStats` scales all five stats by `1-min(0.85,hurt)*0.55` — **guarded
  behind `if(g.hurt)` so unhurt genomes stay byte-identical to the v1.0
  fingerprint**. `creatureCondition(g)` → Healthy/Bruised/Injured/Critical,
  shown on specimen cards, Compendium rows and the conquest picker.
  `normGenome` deletes `hurt` (injuries don't travel in CFB codes); hybrids
  are born unhurt (crossGenome never copies it). Friendly duels stay harmless.
- **Field Training** (`@section tutorial`): a 21-step, event-gated tutorial for
  brand-new expeditions only (`tut` save field; absent = veteran, never shown;
  reset → training again; reload mid-training restarts it). Game systems report
  through one funnel — `gameEvent(type, detail)` (no-op unless training is
  active) — emitted from: survey render, `addToLog`, Atlas/Compendium/tray/
  character-sheet toggles, `showReveal`, feed/breed/heal picker outcomes,
  `fightNow` resolution, and `runSearch`. Each step's `when(type, detail)`
  matcher gates advancement, so the player really performs each action:
  find & survey Earth → chart it (this is how Earth enters the Atlas now —
  `startNewGame` pre-charts it only for veterans) → open Atlas → receive a
  **training cache** (3 random fauna + 3 random flora, `from:'Training Cache'`)
  → open Compendium → specimen card → feed → breed → training duel → scripted
  hazard nip → heal → tray → search → character sheet → horizons → finale.
  **The whole thing is a sandbox**: key rolls are rigged for smoothness
  (`_tutRig`: guaranteed breed/heal success, safe feed), and the finale
  restores the exact eleven-field snapshot
  `{st, ps, ac, es, c, ca, cx, it, eq, ea, e}` (selected statistics, player
  statistics, achievements, Stardust, Compendium, cargo, exceptional cargo,
  items, equipment, equipment affixes, and Earth Atlas/home history). It then
  sanitizes that owned state, including the legacy behavior that removes every
  species catalogued only during training, refills HP in the mature game, and
  guarantees Earth charted + home (`_tutEnsureEarth`). The v2 compatibility
  restore is deliberately narrower about HP: it never heals current lower HP.
  Skippable with confirm; `tutAbort()` on
  game reset. **Training is toast-quiet** (v1.1 post-launch): while
  `body.training` is set, `toast()` logs to the bell tray only (the tray step's
  payoff), the rank-up fanfare is suppressed (its sandbox promotion is revoked
  at cleanup anyway), tooltips hold, and the focus-lockdown gate replays its
  card **nudge** for blocked wheel events (throttled 500 ms) — blocked scrolls
  used to fail silently.

---

## 9. Audio

> **See `AUDIO.md` for the full system** (creature voices, combat, ambience, the
> feedback grammar, the toggles, and the traps). This section is the code map only.

The current v2 application remains deliberately narrower than production v1, but its Arc 7
foundation is no longer package-only. `audio-identity-projector.ts` admits only the exact current,
registered owned creature and projects immutable genome/owner/lineage evidence into the pure
signature/profile/call-plan pipeline; XP, hurt, fed, bond, assignment and brood state cannot alter
that identity. `createAudioRuntime()` owns master plus music, ambience, creature, combat/gameplay
and UI buses; limiter/meters; priority/cooldown/concurrency/stealing; cancellation-aware resume;
and exact node, cache and context cleanup. Mute and stop are synchronous, unmute does not allocate,
failed or closing contexts stay fail-closed, and hostile close/re-entry cannot resurrect an old
owner. The absolute eight-creature-emitter/120-node policy remains intact.

`creature-expression-voice.ts` supplies a deterministic asset-free fauna graph bounded to one
oscillator and one gain node in a single expression concurrency group. `tame-greeting-audio.ts`
arms only from the native Tame gesture and admits only the exact committed durable nonconverging
fauna Tame result whose species/world/revision, current ownership, acquisition record and projector
all match. It pairs that sound with the exact accessible status event and keys the one allowed
greeting as `arc4:taming-succeeded:${recordId}`. Sound off, persisted **Creature Voices** off,
hidden/unanswerable play, miss/refusal, stale/reload convergence, route or counterpart loss,
replacement and disposal stay silent and stop/release the audio/runtime owner. Reload begins disposed, unarmed
and without context, counterpart, voice or nodes.

Compatibility survey/navigation stings remain separate. No other creature expression, distant
ecology, ambience, music, combat/Guardian cue or recorded asset is player-live. Compendium audition,
decoded-byte/media plateau, full captions/mono/dynamic-range/reduced-intensity behavior, device
heat and HUMAN listening/quality acceptance remain open. This narrow implementation does not close
Arc 7, Arc 8 or Gate G and grants no release/version authority.

**v1.8 "The Connection" added the largest part of this layer** and it is not
described below: `voiceOf`/`playVoice` (deterministic per-genome creature voices
over 18 rig archetypes, blending across a bloodline's Earth anchor),
`playHit` (per-blow combat sound scaled to damage, with crits and ability procs),
`playArrival` + `ambienceStart`/`ambienceStop` (planetfall and bounded biome beds),
and `playBlip`/`playDeny`/`playConfirm` with the `_denyPress`/`_okPress`
press-level wrappers. Two independent toggles — `voiceOn` (`vce`) and
`combatSfxOn` (`cbx`) — ride the master `sndOn`; absent ⇒ on.

⚠ `_denyPress`/`_okPress` live at **true top level, after the `Fx` destructure** —
not inside the Fx IIFE. Putting them beside `playDeny` threw `ReferenceError` at
every app-layer caller. A helper belongs in the scope of its **callers**.

The v1.0/v1.1 originals, still present:
Web Audio oscillators — hand-rolled, asset-free. `ac()` resumes the context
(persistent gesture + visibilitychange re-arm for iOS backgrounding).
`playRaritySting(tier)` (discoveries & celebrations; pitch/steps/harmonics/
drone climb with tier), `playFailTone()`, `playFanfare()`, `playThud()`, plus
the v1.1 core-loop pair: `playSurveyPing()` (one soft sonar blip on every
canvas tap-lock — the *act* of surveying) and `playWhoosh()` (filtered-noise
sweep on `travelTo` and the system→surface landing transition). All gated by
`sndOn`. `Math.random` in the whoosh's noise buffer is fine — audio is
presentation, the determinism ban covers domain modules only.

---

## 10. Save format (`localStorage['cfcc_save_v2']`)

**Current v2 topology (2026-08-26):** v4 remains the imported/exported compatibility codec, while
repository schema v5 stores owner-partitioned rows, pre-migration source snapshot/journal, revision,
receipts and independently versioned extension namespaces. Current product authorities include
`player/f4.authority` v1 (active-play + SessionRNG), `inventory/arc2.loot` v1 (exact gear +
stackables or protected legacy facts), `engineering/arc3.state`, and Arc 4's 18 fixed ownership
namespaces. Every complete v5 write/replacement must carry them explicitly; round-tripping only the
v4 envelope would erase authority. Receipt-free boot migration/reconciliation shares one
lease-fenced CAS, while product actions join their carrier/compatibility/F4 changes with one receipt
and next revision. This schema number is independent of the development display identity and
production `GAME_VERSION`.

Three bounded compatibility seams are now separately executable. Notification stamps use only the
injected clock and converge to identical later-v5 bytes. A missing conquest epoch `conq[].e`
imports as exactly one legacy-ready cycle, hostile values clamp to `[0, EPOCH_BASE]`, and the result
round-trips. XP-first authority stores the newest exact 4,000 legacy keys in v4 `xpf`; v4 `xpa` is
the strict binding to the full v5 `progression.xp-firsts` overflow authority. Together they carry
the complete set without rearm and protect mismatch, future, corrupt or source-protected evidence.

**Current v2 Training compatibility fields (2026-08-16):** the outer envelope
remains `v:4`. While Training is incomplete, optional `tsnap` carries either the
exact current one-key `{view}` snapshot, the exact genuine legacy eleven-field
checkpoint, or bounded unknown evidence held for refusal/recovery. A completed
export omits it. Optional
`ever:{v:1,hybrids,best,maxGen,scanhits[,arrivals]}` preserves cumulative
checkpoint records that cannot always be reconstructed from surviving identities.
It is an additive compatible v4 extension with independent nested versioning;
numeric future `ever.v` values protect the entire save as `future-version`.
Absence retains historical derivation, malformed v1 members are contained,
floor fields only raise derived facts, and `sysSeen` remains arrival-count
authority. Neither field is a v5 migration, whole-save checkpoint, reward
receipt, game-version bump, or production release.

**Current v2 Training ownership coherence (2026-08-25):** a genuine legacy checkpoint that owns
restored Compendium/creature/biosphere/scout compatibility fields prepares Arc 4 only when the 18
ownership namespaces are absent. Its single replacement transaction then carries exactly one Arc 2
write plus all 18 Arc 4 writes and verifies the carrier, compatibility mirror and exact migrated
source evidence from `committed.saved.canonicalState` after durability. Current-view and source-
deferred checkpoints preserve current authority; existing, future, corrupt or unrepresentable Arc 4
evidence is protected/refused and never rewound.

**Current v2 epoch carrier (2026-08-15):** the IndexedDB slice still exports one
v4 JSON blob whose `epoch` field comes from `SaveStateV2.EPOCH_BASE`. That name is
compatibility layering, not the `EpochClock.base()` method contract. The ordinary
app refreshes it from `epochClock.current()` immediately before export; the next
boot imports and sanitizes it, constructs one new clock with a fresh zero-origin
elapsed segment, and does not rebase again after each save. The focused package
test proves base/current/rebase semantics; real-browser smoke separately proves
the actual current() → `persistView()` → raw IndexedDB → import/reload path across
one exact epoch. Neither proves automatic epoch-edge saves or F3/F4 clock policy.

**v1.5 FRESH START:** the key bumped `cfcc_save_v1` → `cfcc_save_v2` with **no
migration** — the bump IS the wipe. `readLegacySave()` reads the old key once
at boot to build the farewell card (rarest find honored), then removes it.
All grandfather paths listed below (asc-absent ⇒ complete, land/cont absent
⇒ back-filled, `rsw`/`rc` markers, veteran starter-charter auto-completes)
are GONE — absent fields now take their plain post-law defaults. `cx` clamps
0–7 (bit 4 = specimen field-notes fold). The historical notes below describe
the v1 loader for the record.

Written by `doSave` (debounced via `queueSave`, 900 ms). Fields (v1):

```
v, epoch, view, hp, pstats, fs, snd, fx, shake, notif, tips, notifs, me, essence,
conq, breeds, breedwins, feeds, feedfails, harvests, essenceEarned, names,
shares, jumps, anomalies, anomKey, events, duels, duelwins, surveyed, gals,
surf, starK, ptypes, evts, evann, ach, home, prime, frontier, ending, guide,
tut, codex (array of {g:genome, f:from, w:where})
```

v1.1 additions are **optional & backward compatible**: `tips` (tooltips toggle;
absent = on), `tut` (Field Training complete; **absent = treated as done**, so
pre-tutorial saves never see training), `rn` (last release-notes version
seen; **absent = '1.0'**, so updated saves get the bulletin exactly once),
`vol` (SFX volume 0–100; **absent = 100**, clamped on load) and `rm` (Motion
setting; −1 = Auto, 0 = Full, 1 = Reduced; **absent or −1 = Auto**, which
keeps following the OS reduced-motion preference live — only an explicit
player choice of Full/Reduced ever overrides it).

v1.1.2 addition: `cx` (survey-card expand bitmask — bit 1 Environment fold
open, bit 2 Civilization census open; **absent = 0 = collapsed**, clamped
0–3).

v1.2 addition: `land` (array of planet seeds the player has stood on,
newest-capped at 2000; drives the discovery arc's ground-survey tier —
census + mining unlock). **Absent (pre-1.2 save) ⇒ grandfathered**: every
planet in the Atlas (`p…` log ids) plus all `conquered` and `mined` keys
counts as landed, so a veteran's known universe is never re-hidden. Earth
(seed 133) is always treated as grounded without occupying a slot.
`noteLanding(seed)` (ui-panel section) adds a world at the planetfall
transition or when a save restores directly onto a surface.

Further v1.2 additions: `scout` (Compendium id of the Field Scout fauna
that absorbs hostile-bioscan wounds; validated against the loaded codex —
a stale id stands down silently) and `landings` (count of first-footfall
field-sample grants; the samples themselves ride `_pendingSample` →
`grantFieldSamples(d)` on the next survey-card render, using the same
deterministic `depositsFor` recipe as mining).

`loadSave` restores all of the above. **Hardened against tampering/corruption** (v1):
names re-sanitized via `cleanName`, every counter coerced to a finite number, `essence`
clamped 0–1e9, `conquered` timestamps clamped to "now" (prevents frozen harvest
cooldowns), HP/pstats clamped, notifications capped at 60. `resetMemoryState` clears all
live state; `wipeSaveAndReload` does a robust **in-place reset** (works even where iframe
navigation is blocked) — clears save, rebuilds the opening Sol/Earth expedition, re-prompts
for a name.

---

## 11. Security & robustness (audited at v1.0)

- **No untrusted HTML injection:** all user/code-supplied names pass through
  `cleanName` (strips `< > & " '`, 24-char cap). Share codes (`CF1-`, `decodeWhere`) and
  duel codes (`CFB-`, `decodeCreature`) sanitize embedded names on decode.
- **Save hardening:** see §10 (coercion + clamps + sanitize).
- **No economy exploits found:** flora consumed on eat; both breed parents consumed;
  feed multiplier normalized & capped; rare-find stardust only on genuinely new species;
  conquered worlds can't be re-won; duel codes touch only cosmetic counters.
- **Performance:** full portrait cache device-capped (96 phone /256 otherwise), thumbnail cache
  capped (600); DPR capped (3); notifications capped (60);
  survey panel rebuilds only on content change; frame loop has error recovery; FX
  particles & event timers are cleaned up.

---

## 12. Test suites (all must pass)

**Current local candidate snapshot (2026-08-26):** browser-free verification is green at 122 test
files / 1,362 passed / one intentional skip / zero failures, with root, app, worker and no-unused
TypeScript, the 884-module Vite build, root validation/fingerprint, legacy jsdom smoke, and the
applicable contract/reporter/Glass/recovery/Compendium selftests green. Compendium run
`20260826-phase4-certification` remains historical 78/78 named-verifier proof for former producer
`587d3bdf…`. Signed source `8ffd2e2…` supplied the active `f7c87f22…` ruler's fresh candidate1/2/3
and paired baseline1, each one attempt/zero retries; budget `6284a394…` preserves all four faults
and exact 14-phone/13-desktop discrimination, changing only the phone warm ceiling to `524288`.
Clean signed activation `91f4e044…` passed current exact-budget run
`20260826-slice-repair-certification` 78/78 plus named verification with complete lifecycle in one
attempt/zero retries (44,847 ms; raw/gzip SHA-256 `81c27ed5…` / `6f3deb0f…`). Current-input Slice
retains three one-attempt/zero-retry reds: `20260826214541492-83064-b252b137f7a3` failed after 92,772
ms with two instrument defects plus one retained-Survey focus product regression, while changed
clean signed source `9d4b2b0…` supplied `20260827000034983-98202-869d966f2f88`, which failed after
92,566 ms with only the newly exposed impossible card-context oracle. Settings and focus are
outcome-cleared. Clean signed `8a23e22…` then supplied `20260827025804458-2742-c0c871ee52b6`,
which failed after 93,582 ms with three cascading findings because the open Survey card correctly
hid `#railrgt` before Slice tried zero-rect `railshipyard`. That outcome clears the card-context
repair; Deep Scanners and later stages did not run, and the lifecycle repair is unrerun. No current-input Slice
PASS, Glass result or 20-minute recovery certificate exists. Hosted execution, HUMAN
review, whole-Gate closure and release remain open.

The original v1.0 assertion suites (`phaseAtest` … `finaltest`, `esc_check`) were lost
with the previous working environment. They are superseded by `tools/validate.js`
(see §2 and `tools/README.md`): syntax check, CSS brace balance, duplicate-id check,
version consistency, class→rig binding, colour atlas, biome profiles, render audit,
domain-determinism grep, headless jsdom boot with zero errors, and a **50-probe**
fingerprint over the deterministic core (world-gen, descriptors, genomes, duels,
share codes) that must match the v1.0 baseline byte for byte.

**The primary battery is now NINE suites, not one** (four gate every batch and
`deploy.js` enforces them; the last five are run on demand):

The root parity battery also includes `npm run trainingcheckpoint`. It replays
the action-derived v1.8.9 restart capture and exact-compares the sealed fixture
plus its source/driver/snapshot provenance; the paired
`trainingcheckpoint:capture` command prints a candidate and never overwrites the
sealed baseline. The separate v2
`packages/persistence/test/training-checkpoint.test.ts` suite owns the exact
eleven-key classifier, `tut:0` and rescued-`tut:1` round trips,
missing/extra/oversized refusal, and synthetic-unknown negative control. This is
deterministic jsdom/action provenance plus focused static semantics, not a
browser outcome or real veteran-save Gate-C evidence.

| Suite | What it can see | Gate? |
|---|---|---|
| `validate.js` | build + 9 static gates + the 50-probe fingerprint | every batch |
| `smoke.js` | jsdom: real flows, the full 21-step training, ~553 checks | every batch |
| `uilayout.js` | **a real headless browser through the shared owned CDP launcher**: computed boxes, 44px touch floors, and `elementFromPoint` hit-tests across 10 viewports (787 checks, incl. a 63-point reachability grid on the training card against each raisable surface in **both** card positions); ignored atomic schema-v2 evidence binds exact browser/run/status, full PASS binds the sealed v1.8.9 report's exact 787-key inventory, targeted runs remain scoped, and `--selftest` / `--verify-run=ID` enforce completeness/freshness | every batch |
| `balance-sim.js` | 17 archetype win-rate band + 55 ability-theme art band | every batch |
| `bootperf.js` | **cold boot in a real browser over gzipped HTTP**: decomposes first-interactive into network / in-DOM / painted / **answerable**, plus a longtask census split at the gate. `--assert` enforces the art-hold law | on demand |
| `simrun.js dom` | **UI reachability**: takes actions through the real controls and proves the press *landed*; reports `absent` / `disabled` / `dead` / `uncovered` | on demand |
| `duelxp-check.js` | **reward outcomes**: drives the real friendly-duel arena and reads the ledger afterwards — proves the XP *arrived*, not that `awardXP` works | on demand |
| `sizedrift-check.js` | **save round-trip outcome**: proves an honestly bred genome survives save/load unchanged and rejects the removed clamp that rewrote ordinary high `size` genes | on demand |
| `harvestclock-check.js` | **clock exploit outcome**: advances the device wall clock and proves a settled world grants no offline harvest | on demand |

`uilayout.js` exists because jsdom has no layout: a rule can be present, correct
and **completely inert**, and only a real browser can tell you. It accepts
`--url=FILE`, so a new gate can be replayed against an older build to prove it
catches the bug it was written for. It records `running` before launch and atomically
replaces that with terminal `pass`, `fail`, or `instrument-fail`; CI verifies the
exact assigned run id before uploading the ignored report in its own always-run step.

`bootperf.js` and `simrun.js dom` close two UI blind spots that were *structural*, not
oversights. **Painted ≠ answerable**: a gate can be drawn and hit-testable while the
main thread is too busy to respond, and `waitForSelector(visible)` cannot tell the
difference — that ambiguity misdiagnosed the cold-boot outlier for three builds.
**API ≠ reachable**: the high-volume expedition tiers call ~28 probe hooks directly,
so a bot calling `craftItem()` could never notice a dead Craft button (CF1802-07).
Neither jsdom nor the fingerprint can see either problem by construction. The
other three on-demand suites guard real reward, save-round-trip and clock outcomes
whose helper-level checks had previously allowed player-visible regressions through.

⚠ Both were **negative-controlled in both directions** before being believed, and both
found bugs in *themselves* first. Do not trust a green run from either until you have
re-broken a build on purpose — `tools/README.md` records the two traps that made
`bootperf` pass vacuously (an observation window that closed at TTI, and a `setTimeout`
block that cannot preempt the parser).

When an edit intentionally changes behavior a probe captures, regenerate the baseline
**deliberately and say so** (don't weaken the intent of a check).

⚠ **A stale claim removed here twice — do not let it return.** This section used to end
"a browser smoke test (Playwright) exercising every panel … remains the highest-value
addition if sustained work resumes". `uilayout.js` has driven a real browser for weeks,
and `bootperf.js` now drives one too. The v1.8.4 sweep believed it had deleted that
sentence and had not; it survived to 2026-07-30. The highest-value *remaining* addition
is **widening `simrun dom` coverage past `craft`** — `capture` first (CF1802-09's own
surface), since panel/picker actions are the ones no harness here drives yet.

---

## 13. Development history (feedback rounds, condensed)

- **Foundations:** Prime Codex win condition; reset/save robustness; mobile pinch/tap.
- **Phase A/B/C:** Sol/Earth opening; stepped REGIONS frontier expansion; difficulty curve;
  fog-of-war.
- **Rounds 1–9:** achievements tray; conquest-gated signatures; reset confirm; mobile
  header overlap fixes (`--topbar-h`); Primer rewrite; survey-panel scroll; hazard flavor;
  explicit flora-grown player stats; biome-themed D&D-style abilities; feeding preferences;
  breed-all-kingdoms; mobile topbar cleanup; outside-tap close; Title-Case actions.
- **Round 10:** clickable stat descriptions; collapsible "Statistics"; reworded/added stats.
- **Round 11:** mobile topbar reflow (`display:contents`); Codex → **Compendium** rename;
  Prime Codex moved to the right rail.
- **Round 12:** in-place reset fix; layout parity; HP/search tuning.
- **Round 13:** unified layout on all platforms; **FX system** (bursts + shake); stardust
  faucets (spoils + rare bonus); portrait biome glow; Title-Case toasts.
- **Round 14:** intro title "Celestial Frontier"; signature verbs (Conquer/Find); Effects
  toggle; help credit; Primer em-dashes.
- **Round 15:** uniform **☆/⌂ bookmark icons** on all survey cards; Curator achievement.
- **Round 16:** search/tray z-index; "Search discoveries or paste code"; split Effects &
  Screen-shake toggles; **size-scaled moons** + Roman numerals; locked-pin hint to top-left.
- **Round 17:** search box grows to fit text.
- **Round 18:** tray above rail + taller; stats panel over the HP bar; **Notifications**
  toggle (silences popups, keeps tray); intro modal redesign (icon, background, gradient
  title, de-italicized lore).
- **v1.0 hardening (round 19):** save-restore sanitization/coercion/clamps; Prime Codex
  backdrop close; global **Escape** closes overlays; full security/perf audit.
- **Final:** intro button → **BEGIN THE EXPEDITION** ("Survey" kept as the game's verb).
- **SOLID restructure (June 2026):** script reorganized into domain/app modules with
  a verification toolkit (`tools/`) — behavior identical, fingerprint pinned (49 probes at the
  time; the baseline has since grown to **50** — see §12).
- **v1.1 (June 2026):** **Guide to the Universe** (the full searchable manual replaces
  the Primer); **tooltip system** (`data-tip`/`data-guide`, Settings toggle, long-press
  on touch); **Field Training** — a 21-step, event-gated, fully sandboxed new-player
  tutorial (Earth charting, training cache, feed/breed/duel/heal practice, scripted
  hazard, cleanup that restores the record). New optional save fields `tips`, `tut`.
  jsdom smoke suite drives the entire tutorial end-to-end.
- **v1.1 continued:** **Release Notes system** (one-time update bulletin via save
  field `rn`; cumulative history behind the Guide footer version line; content in
  `RELEASES`, version bumps only on Dakk's call); tutorial card moved top-center
  with **focus lockdown** (per-step `allow` lists; capture-phase gate on
  pointerdown/click/touchstart/wheel; open dialogs always usable); tooltips made
  text-only with longer delays (650 ms hover / 600 ms long-press). Smoke suite:
  72 checks.
- **v1.1 post-launch, Emerson playtest round (July 2026):** desktop hint copy
  corrected (hover *previews*, click surveys); planet pick floor 14→16 px and
  **moon picks gated to `c.z > minWH/420`** (the moon-label zoom) so sub-pixel
  moons stop stealing nearest-wins taps aimed at their planet; **training
  quiet pass** (toasts tray-only + no rank-up fanfare + tooltips held during
  training; wheel-block nudge feedback); **player rename surfaced** (Settings →
  Display row, Guide mention, larger ✎ link, Cancel/Escape on the rename
  dialog); survey-card `.k`/`.tag` labels moved to a brighter `--label` color
  (8:1 on the glass panel; tone-aware) and the stale `.krow` fs-lg/fs-xl
  selectors fixed so those labels finally scale with A+/A++; new
  `playSurveyPing`/`playWhoosh` core-loop SFX; release-notes "latest" view
  pinned to the `GAME_VERSION` entry; `RELEASES` gains the working v1.1
  "Field Reports" entry. An adversarial review round then hardened the batch:
  the locked-Guide message stays a visible pop-up during training (the one
  exception to the quiet pass), rename-cancel flushes queued toasts (and
  `flushToasts` re-checks the training gate at fire time), moon picks use
  true-apparent-size targets below the label zoom instead of vanishing (a
  visible desktop gas-giant moon stays clickable), travel-skip taps are
  disarmed so they can't survey-lock (and ping) the arrival scene, and
  `#namebox` joined the `body.training` yield rules. Smoke suite: 91 checks
  (training-quiet, pinned bulletin, rename flow, locked-Guide feedback).
- **2026-07-15 — Emerson-playtest Tier 2 (accessibility & feel):** SFX **volume
  bus** (`sfxOut(a)` shared gain, `sfxVol²` taper computed only in
  `applySfxGain`, Settings → Audio slider, save `vol`); **Motion
  Auto/Full/Reduced** (`motionMode`/`motionOK()`, save `rm` −1/0/1; Auto tracks
  the OS preference live via a matchMedia listener; gates
  tunnel/shake/confetti in JS + `body.rmotion` stills the decorative CSS
  loops); **landing assist** in `checkTransitions`, armed only by a blocked
  zoom-in at the system ceiling (450 ms window; instant step under reduced
  motion); **touch pick-floor scaling** (`PICK_F` ×1.4 on TOUCH) + invisible
  hit-padding on Atlas row actions (delete × deliberately excluded) and
  Settings pills (`@media (pointer:coarse)` `::after` insets); **keyboard
  operability** — `role="button" tabindex="0"` on Settings pills/tabs,
  Compendium tabs/groups/cards, Binder paragon slots, Atlas items, Guide
  categories/topics/back/cross-links, riding the existing Enter/Space shim,
  with a `:focus-visible` gold ring and a `refocus()` helper that restores
  focus after innerHTML re-renders. An adversarial review workflow (17
  verified findings) drove the arming design, the delete-× exclusion, the rm
  tri-state (never freeze the OS preference into the save), live probe-hook
  getters (`make-probe-build` now emits `get name(){}`), and one shared
  `tools/fake2d.js` replacing four drifted fake-canvas copies. Smoke suite:
  102 checks.

---

## 14. Glossary of in-game terms

| Term | Meaning |
|---|---|
| **Expedition** | a playthrough (the player's run). |
| **Survey** | examining/cataloguing a world (the core action verb). |
| **Compendium** | the catalogue of discovered species (was "Codex"). |
| **Star Atlas** | the player's saved bookmarks of places. |
| **Prime Codex** | the 9-Signature win track. |
| **Cosmic Codex** | the app's title/subtitle. |
| **Signature** | one of 9 legendary milestones that complete the Prime Codex. |
| **Stardust** (`essence`) | soft currency; boosts breeding odds. |
| **Traveler's Beacon** | a fresh random destination every 5 minutes. |
| **Pathfinder** | the in-lore order of explorers; also a rank; "Pathfinder's Primer" = help. |

---

## 15. v1.4 "The Ascent" addendum (2026-07-18)

Three new app-layer systems (all in `main.js`; nothing touches the domain modules —
fingerprint stayed byte-identical):

- **Mining rework** (`@section mining`): `mineWorld` is instant per click ("pull");
  yields seeded by extraction index (`hashInt(seed,0xE1F,n)`), so pull *n* is identical
  for every explorer. `reserveFor(seed,tier)` fixes each world's FINITE total pulls
  (~420–800 × (1+tier·0.35)); `mineX` (save `mx`, absent ⇒ veterans full) tracks pulls
  taken; rich strikes add `RARE_VEIN` pockets; `minePending` accrues auto-extractor
  loads (1/10 min, cap 30) anchored on `mined` timestamps.
- **Fabricator + equipment** (`@section fabricator`): `ITEMS` recipe catalog
  (T1 parts → T2 components → T3 ship systems + gear; costs audited against Sol's
  actual seeded veins so Chapter 1 is craftable at home), `craftItem`/`equipItem`,
  nine `EQ_SLOTS` on the character sheet, `partIcon()` painterly icons.
  `_equipBonus(key)` is the single gear socket read by: `descentFor`/`descentBonus(P)`
  (land, per-family `landfam`, `land100`), `_descRoll` (struts scrape cut), `routeHit`
  (`scut` wound cut), `attemptContact` (contact %), `healExplorer` (heal %),
  `driveMult` (speed), `mineWorld` (yield, strike, auto). Save fields `items`, `eq`.
- **Ascent chapter engine** (`@section ascent`): `ASC_CHAPTERS` (3 chapters on the
  charter/gameEvent machinery, pinned atop the Charters panel), save `asc`/`ascp`
  (**`asc` absent ⇒ complete — veterans never re-lock**). `ascStage()` 0–3 keys off
  the built drives; `ascAllows(where)` gates star entry (checkTransitions), wormholes,
  `travelTo`, `travelToCode`; `reachRadius()` returns `UCELL*0.35` below stage 3.
  Rings: Sol → Neighborhood (`ASC_RING_R = GR*0.25` around `SOL_POS`) → home galaxy →
  the pre-existing REGIONS/prime-signature ladder. Reset restarts the Ascent.

v1.3.11-grade fixes shipped in the same build: card offset-anchoring
(`_frozenPick`/`_livePick`), Compendium display shelves (`_SHELF_OF`), training roll
rigs on every step (feed rig is a HIGH roll — `feedPair` poisons on `roll<pois`),
duel `#duelskip`, vista `.vcard` windowed pop-up, `_rockSet` asteroid sprites,
helppop outside-tap closer. `resetMemoryState` now clears the engineer's track
(mined/mineX/cargo/tech/items/equip/asc — previously leaked through soft resets).

---

*Generated for continuity. If the source and this document disagree, trust the source —
then update this file.*
