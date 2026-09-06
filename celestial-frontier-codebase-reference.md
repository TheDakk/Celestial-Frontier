# Celestial Frontier — Codebase Reference (legacy v1 + current v2 reset overlay)

## Current v2 U1 shell overlay — matches code as of 2026-09-06

`port/v2/apps/game/src/ui-presentation-tokens.ts` emits shared Inter/spacing/type/color-role/
layer variables; `ui-shell-style.ts` owns the normal-game shelf/dock/rail/lane geometry.
Caption text retains a dark translucent backing independent of the artwork, uses capped
available width, and clears the existing measured hint height by8px on phones while keeping
the nominal164px minimum bottom offset.
Phone<=700 uses5 labelled boards +4 utilities at64px centers; desktop>=701 uses bottom-right
utilities and rails. Inventory now opens through the nameplate. AppChrome still measures the
shelf and projects Prime count; panel/Training owners retain focus and locked controls.
`notification-history.ts` adds explicit saved Mark read using the existing notification shape
and receipt-free UI checkpoint whitelist. See UI_PRESENTATION.md and SAVE_SYSTEM.md for bounds,
read-only behavior and review deviations. U2–U4 and integrated-pilot approval remain open.

## Audiovisual pilot implementation — 2026-09-05 local

Matches the scoped Phase 1 implementation as of **2026-09-05 local**. Nick authorized B–D
production under the integrated-pilot approval stop; develop `c1791e2` (including PR #41) is
its merged foundation. `audiovisual-pilot.html` is the compact Earth/Scout direction study,
48-condition portrait comparison and eight-cue listening set. It links separately to the
playable `?avpilot=1` comparison, current v2 without the pilot and production v1.8.9. The real
game activates the pilot after answerable boot. Scene assets remain under active authoring;
this candidate direction still awaits human acceptance.

The study and opt-in native windows share navy glass, restrained gold accents, locally bundled
Inter under SIL Open Font License 1.1, compact spacing and the shared token hierarchy. The
study exposes the bundled license in its provenance disclosure. Panels retain their distinct
Inventory, Shipyard and Atlas layouts; 8px panels and 6px controls preserve 44px input targets
and visible focus. Canonical rarity, resource and status color owners retain their meanings.
The real game honors the existing Settings font, text-size and tone preferences. Compact review
controls yield to native windows, Training and modal ownership; decorative layers are pointer
transparent. The top bar, dock and rails retain their existing structure.

The material-rendered Scout appears inside the existing native Shipyard preview only for the
exact eligible starter stage/livery with no installed systems or hardpoints. Other loadouts
and unavailable images retain the native loadout preview. The rainy Earth landscape candidate
is bound to the exact canonical render request, including world identity, roster, environment
and weather. It becomes visible only when the canonical vista is ready and every candidate
image has loaded successfully. Until then, or for another world/request, the native globe/vista
remains the fallback. Galaxy art and canonical flora/fauna generation are unchanged.

All eight body plans retain protected static portraits at 132/300/440; 300 displays the existing
440 source. Anatomical animation remains INCOMPLETE for every family. The optional accent
outside the frame demonstrates motion policy only. Existing painter/artlock inputs remain.
Supporting component mockups and review provenance are secondary accessible disclosures.

The same eight original PCM16/48 kHz audio cues remain listening candidates; masters, MIDI,
Surge patches and REAPER projects stay private. The shared Tame/creature audio owner admits at
most four decorative pilot voices, one per category, with finite lifetimes and existing
mute/hide/route/teardown guards. The separate decoded-data cache remains bounded at 19,503,360
bytes; native playing AudioBuffers are additional allocations. The real game creates no second
audio context. Music/bed return to silence after 24 seconds without an automatic resume loop.
After explicit pilot activation, existing Shipyard/Inventory/Compendium navigation clicks may
add a short UI cue. Ship/combat/settlement recordings still have no durable outcome mapping.
Canonical creature synthesis and legacy sting compatibility ownership remain unchanged.

Eight authoritative rights rows, file/header/hash checks and sanitized processing evidence
remain the audio intake. Matched-level human listening, anatomy/art direction, comfort and
physical iPhone/Safari/PWA evidence remain open. Build-time complete-pack admission enforces
128 MiB; the 256 MiB retained-update ceiling remains policy rather than runtime enforcement.
Current media inventories, backup status and exact-source checks belong to
`audits/AAA_PILOT_BCD_20260905.md`, `AAA_GAP_AUDIT.md` and `AAA_COVERAGE_LEDGER.md`.

Work stays command-line only. Isolated headless review may inspect generated game pages and
assets; it never inspects the desktop, an existing browser/profile or user REAPER settings.
Those diagnostics do not establish human visual/listening acceptance or a new certificate.
No further audio render, Phase 2/chrome migration, hosted attempt, purchase or release is part
of this refinement.

## Overnight Batch 4 — checkpoint 2e implementation, 2026-09-05

Matches the current recovered implementation; `ROADMAP.md` owns gate acceptance. Signed core
`5377069` is joined to fresh-start develop `9ea0104`: authored Research effects, explicit
Discover Life/one Survey-hazard receipt, nonlethal Flora meal, pre-action Scout +2 XP capped at
486 in capture's receipt, read-only Chronicle/Museum and analytical economy scenarios.
The accepted Discover Life Starter Charter completes only on a later explicit Bioscan for its
established 15 Stardust and Earpiece in the same F4 receipt/CAS; no earlier Survey or Capture
backfill. Exact gear publication, empty-slot equip, capacity and stale/storage refusals remain.
Landing now uses the authored terrain/biome and seeded-weather descent policy with shown chance
and HP risk. Earth, Training and proven canonical revisits roll nothing; ordinary attempts own
two SessionRNG draws and one receipt/CAS. A wave-off leaves the ship in orbit, with HP at least 1 and canonical
learning (+20 percentage points per failure, capped at five), without landing rewards. Success
clears that world's learning. Landing gear and struts apply; Reinforced Hull remains hostile
Discover Life only. Legacy seed-only learning binds once on its first source-verified encounter;
fresh v2 games start empty. All possible outcomes are preflighted before RNG/publication.
The Fifty Paragons now use their authored fixed genomes and exact home worlds. Explicit Discover
Life at an eligible home adds only its catalogue record in that same Bioscan receipt; it creates
no companion/specimen, spends no Yield and grants no capture or extra discovery award. Binder
shows all fifty: found entries Inspect the exact existing Compendium record; missing entries use
existing reach-checked travel. Ten records unlock the separate authored +120 Stardust Claim.
New Paragon provenance binds index to its exact genome; Binder pair keys must match record IDs.
Pre-feature development saves with an already-scanned home retain their recorded refusal; no
backfill or repeated hazard is invented. Static portraits remain unchanged. Exact-instance progression now displays each individual's
XP, level, class, innate arts, wounds and active-play Recovery, with distinct twins and retained
tombstone history. The established curve caps XP at486, unlocks innate slots at levels3/6 and
preserves valid fractional XP without rewriting ownership. Passive refill preserves semantic
focus without scrolling or stealing focus; a lost/disabled action falls back to its owning Close.
No new XP source, Feed stat/Power growth, injury healing, care or bond is added. Atlas now owns
List/Chart with All/Favorites/Visited/Conquered/Life filters, canonical coordinates, Home, Remove
and one-level eight-second Undo. Remove/Undo use one exact receipt/CAS and preserve route
ownership, original row order and originally absent routes; stale sidecars refuse. Bounded
44px chart clusters open the exact existing List actions and return focus to the owning chart
control. Travel durability, reach, speed/motion and Favorite behavior remain with existing owners.
Weekly Charters stay parked. Existing tables and eighteen Arc 4 namespaces/v5 topology govern.
V2 has no legacy player import door; codec/evidence importBlob remains. The draft has 79 bullets
at this checkpoint. Real-device v2 persistence and combined Arc 4.5 / separate Arc 5.5 HUMAN
reviews stay open. `ROADMAP.md` owns exact checkpoint outcomes and unattended decisions.

## V2 beta Research and descent consumers — implementation as of 2026-09-05

The six-row Engineering catalogue is fully purchasable through the existing Arc 3 receipt/CAS
owner. `projectEngineeringCapabilities` replays the registered Arc 2 loadout and exposes the legacy
`heal`, capped `scut`, and `speed` effects beside the existing mining/skimming/capture values.
It also exposes `landingSuccessBonus` (`land`), `landingFamilyBonus` (`landfam`),
`landingGuaranteed` (`land100`) and `waveOffDamageReduction` (`struts`) for descent.
Deep Scanners keep their orbit-only mineral reveal; Reinforced Hull and `scut` gear feed the
explicit living-world Bioscan hazard; Xenobotany and `heal` gear feed the explorer Flora meal; the
three speed researches plus `speed` gear feed a deterministic, skippable, device/motion-bounded
Search/CF1/Atlas travel presentation. Permanent Jump/Array/Intergalactic systems and Prime
Signatures still own reach—speed research cannot cross a locked boundary.

`packages/domain/opportunity/src/state.ts::RESEARCH_IDS` owns the frozen six-row production research order. `engineering-panel.ts::ENGINEERING_RESEARCH_ORDER` is its public alias, retaining the existing row-ID type. The panel fixtures and tool-owned Engineering catalogue keep their independently authored six-row expectations, including missing-row and order refusals.

`descent-policy.ts` projects type/biome odds, deterministic weather, exact worn gear and learned
approaches before `arc0-landing-action.ts` settles one selected outcome. Ordinary attempts reserve
exactly `descent.success` and `descent.damage`; canonical Earth, Training and proven full-address
landed returns consume no descent draws. A wave-off keeps orbit and the explorer at 1 HP or more;
only HP and wave-off progress change in the save. Reinforced Hull does not reduce descent damage.
The canonical wave-off extension owns full-address learning. Legacy seed-only counts remain
unresolved compatibility evidence until the first matching source-proven non-Training descent
settles and consumes them; inspection or Training alone cannot bind them, and later worlds sharing
that leaf seed do not inherit the consumed count. Successful non-Training arrival clears the exact
approach count; Training preserves it. Outcome, HP, learning and the compatibility mirror commit
together under one receipt/CAS, with no optimistic publication or automatic retry.

`apps/game/src/landing-card.ts` owns the ready/unavailable `LandingCardStateV1`, the presentation projector and `landingCardActionHtml`. Main supplies its existing escape function and retains exact world/save authority projection and action wiring. The extraction preserves the rendered controls, visible chance/HP/learning disclosure and accessibility attributes; policy and settlement remain in `descent-policy.ts` and `arc0-landing-action.ts`.

`explorer-meal.ts` owns exact legacy nourishment/poison arithmetic over one canonical Flora lot,
with the beta-safe 1 HP floor, 330 stat ceiling, Vitality-derived maximum HP, and same-transaction
`fieldmedic`/high-risk `gambler` event joins. `compendium-explorer-meal.ts` exposes one bounded
owner-minted **Eat 1** request and never changes companion Feed/Breed/Rename/Scout or genome data.
The explicit living-world **Discover Life** action replaces automatic living-world Survey ledger
publication: one `survey.hazard` draw and one F4 transaction join the existing Arc 9 Survey successor,
close-call counter, explorer HP or exact Field Scout injury, and the five-carrier Arc 5 successor.
Scout injury is nonlethal and capped at `.85`; protected legacy Scouts above that cap refuse rather
than being silently normalized. Conquered worlds remain clear. Capture/census publication remains a
separate landed action. A successful capture that catalogues a genuinely fresh species also gives
the Scout standing before that attempt up to +2 XP in the same capture receipt/CAS, capped at 486;
no standing Scout, miss, or repeat species grants Scout XP. The reward changes no genome, lineage,
role selection, or capture-pool fact.

Step 2c adds the exact-home catalogue exception through `paragon-finder.ts` and the existing
`bioscan-action.ts` receipt. All fifty indexed genomes and fixed homes use the authored deterministic
recipe. A matching source-proven home can add its exact catalogue species and acquisition audit
while preserving owned creatures, specimen lots and Biosphere Yield; it grants no Capture credit.
The joined Arc 4/Arc 5 successors and legacy catalogue mirror settle atomically with Bioscan.
Ownership validation checks the full indexed genome; Binder checks that each pair key equals its
record id before that row may count toward discovery or a claim. A previously Bioscanned home in a
pre-feature development save still refuses as `already-recorded`, so returning cannot backfill it.
Records retains six Binder type pages and now has eight claim owners; `para10` becomes claimable
after ten exact Paragons and pays 120 current/lifetime Stardust only through its separate once-only
Claim receipt/CAS. Prior claims stay claimed. Missing slots use the source-proven finder and existing
ship/Prime reach checks; found slots open the exact Compendium record through Inspect without travel
or acquisition. Existing static portrait owners are unchanged.

Step 2d adds `compendium-creature-progression.ts` and its surface owner to the existing fauna
detail. The registered Arc 5 owner supplies exact live individuals plus immutable retired
tombstone snapshots; a matching species identity never merges their separate IDs, names, XP or
condition. At most 24 rows mount per page, with XP/level progress, class/group, named innate arts
and effects, wounds, and active-play Recovery status. This is a read-only projection: it creates
no XP, care, Feed stat growth, new assignment, ownership write or clock advancement. A recovered
assignment is only cleared by an existing companion action, never by its display heartbeat.

`creature-level-progress.ts` uses the lifted `levelOf` authority for the existing
`min(9, floor(sqrt(xp / 6)))` curve and accepts the registered finite 0–486 XP range. Fractional XP
remains exact; only independent integer cursors search the level thresholds. The frozen
`projectCreatureInnateArts` adapter reads the existing private class/ability tables and the 3/6
level awakenings, without rewriting genomes, base stats or combat rules.

The surface refresh is fenced to the current detail and ownership. A passive heartbeat restores
only the same enabled pager with `preventScroll`; if it disappeared, became disabled or its
surface vanished, focus falls back to that panel's Close with the same scroll policy. Restoration
requires that the old pager still owned focus; a user move elsewhere is respected. Only an explicit
page press may choose the alternate pager with ordinary focus behavior. The existing lifecycle
detaches this section when its detail closes or changes.

The safe explorer-meal successor joins `fieldmedic`, and a safe meal above 40% poison risk also
joins `gambler`. Any hostile explicit Bioscan joins `survivor` whether its wound lands on the Scout
or explorer; a safe scan does not. The current event-owned achievement boundary is therefore 26
exact joins with only `daily` and `decade` still blocked.

`expedition-chronicle.ts` projects one escaped read-only Records surface from already-registered
facts. Battle Chronicle sorts at most 60 fights by latest receipt ordinal; Discovery Museum follows
canonical immutable first-species record IDs; Prime Victories follows Signature ID and invents no
claim time; Legacy Journal retains its established append order with latest entries first. Invalid
or protected authority produces one protected panel. This owner adds no writer, receipt, reward,
RNG, save field, mission, share card, or semantic chronology across the four galleries.

## V2 explicit build boundary — implementation as of 2026-09-04

`port/v2/apps/game/vite.config.ts` selects diagnostic code only for exact Vite mode `evidence`;
`pwa-build.ts` binds the corresponding `cf-build-mode` HTML marker into final PWA asset hashes.
`tools/build-mode.mjs` is the shared consumer check. Ordinary builds and development-preview
packages remain distributable and must not expose `__CF_SLICE__` or armable save faults.
`tools/devpreview-readiness.mjs` observes ordinary rendered UI before the existing real Guide
outcome check. Awaited inert action holds preserve task ordering. This describes the implementation
boundary, not completed browser/device evidence; consult `ROADMAP.md` for current verification.

## Current v2 runtime hardening

Audio finite lifetime (matches code as of 2026-09-04): `packages/audio/src/runtime.ts` owns one
injected deadline wake for optional bounded voices and reuses `finishVoice` for overdue cleanup.
The creature/ecology/combat builders derive limits from existing envelopes with a cleanup-only
tail; `tame-greeting-audio.ts` supplies the browser timer adapter. No sound plans, identity,
gameplay timing or save fields change. See `AUDIO.md` §0.3 for the compatibility/lifecycle limits.
The art manifest/lock now declares its existing Genome and PlanetGen imports; painters are unchanged.

Matches code as of **2026-09-04**. `main.ts::persistView` uses one local admission predicate
before queueing, at queued execution and after heartbeat settlement. No denied writer stages
ecology, projects a candidate or commits. Existing named-search deferral and private heartbeat/
lifecycle exceptions remain narrow; Training/import/reload holds and exact replacement-claim
ownership are rechecked. Import's active-tail drain and failed-replacement debounce rearm remain
unchanged. This adds defense in depth, not a finding of proven import corruption; save schemas,
receipts, revision CAS and durable-publication ordering are unchanged. See `SAVE_SYSTEM.md`.

`panel-refill-focus.ts::capturePanelRefillFocus` is a synchronous, single-use continuation for
Records, Atlas and Charters. It matches authored action/row identity after DOM replacement and
disabled-state projection, restores the unique available control or sticky Close using
`preventScroll`, and leaves another current focus owner alone. Atlas Favorite no longer
unconditionally refocuses its action at async settlement. Explicit Settings actions and the
Engineering/Capture action-specific focus owners are unchanged. `runtime-hardening.test.ts`
executes these real app functions with injected dependencies plus the DOM helper; it does not
claim native browser geometry or device acceptance. See `UI_PRESENTATION.md`.

The main header now accurately identifies 15 current Training lesson IDs, the remaining
hands-on curriculum, and already-live Atlas favorites/rarity stings. Dated evidence overlays
below retain their checkpoint scope; `ROADMAP.md` owns current integration and verification.

## Approved audiovisual authoring exception — 2026-09-04

Nick permits Blender-authored assets and REAPER/Surge audio alongside existing procedural
painters/runtime. Canvas-only asset origin is relaxed; painterly identity, protected static
portraits, deterministic game state and runtime budgets remain. Phase 0/1 pilot only: eight body
plans at 132/300/440, static/animated. See `port/AAA_AUDIOVISUAL_CAMPAIGN.md` and
`port/AAA_ASSET_POLICY.md`. The pilot implementation above owns current media status. Product
baseline is landed develop `c1791e2`, including Batch 4/PR #41. WIP remains parked. V2 starts
fresh: no player import door; existing codec/evidence seam stays. Claude owns CI/budget policy.
No Phase 2/release. This reference was reconciled against code on 2026-09-05 local.

> **2026-09-04 UTC current PR #35 forensic-prevention architecture overlay (matches current local
> code):** `.github/workflows/test.yml` retains one two-minute authorization job and one battery
> job. The battery orchestration cap is 120 minutes and Compendium's independent step cap is 55;
> `tools/actions-budget-policy.js` seals both and rejects topology/retry/soft-fail drift. These are
> not product deadlines, memory rulers, browser pins or hosted authority. One exact future attempt
> would have a 122-runner-minute maximum including authorization, once/no-retry.
>
> The changed-input Glass step remains one seven-minute process and executes distinct immutable
> `small-phone` then `large-phone` targeted rows sequentially. The first retains Inventory
> action/modal evidence; the second binds Capture native Tab and one Shipyard `mining` Summary
> native Enter across forced ordinary F4 heartbeat replacements. Either red stops immediately.
> The diagnostic is noncertifying; Compendium → exact Slice → full 12-row Glass remains the
> unconditional `develop` certificate.
> The preflight starts with `command -v jq >/dev/null`. Only the existing pinned Edge download
> uses `--retry 3 --retry-all-errors --retry-delay 5`, with identical URL/version/SHA-256; neither
> a product/instrument red nor a battery is retried. Existing exact-command assertions and the
> existing download mutation anchor are synchronized; no new control or verifier is added.
>
> `runF4HeartbeatCycle()` now resolves one
> `cf-v2-f4-heartbeat-cycle-receipt/v1` for every lawful completed/skipped/failed path, binding the
> current document, typed reason and Shipyard/Compendium/Capture refresh disposition. Capture's
> forced carrier/assessment are now `cf-v2-glass-arc4-native-tab-heartbeat/v2` and
> `cf-v2-glass-arc4-native-tab-assessment/v2`; their completed receipt must name
> `refresh.capture=completed`. The generic Shipyard setup/heartbeat/receipt/assessment carrier
> re-queries the current Summary by selector and full descriptor, proves original disconnection,
> current replacement/focus, completed `refresh.shipyard`, trusted current-target Enter and the
> expected disclosure toggle.
> The ambient timer is quiesced and settled before that baseline is rebound. Settlement requires
> both `pendingPersistenceWrites === 0` and `pendingDebounceWrites === 0`. This closes the
> setup-to-quiescence race; coherent missing/duplicate targets remain product-red with exact null
> evidence instead of being misclassified as malformed instrumentation.
>
> `glassmatrix-evidence-contract.mjs` owns current PASS schema `cf-v2-glassmatrix/v2`. Glass's
> writer/verifier, Recovery, terminal diagnostic and persona consumer refuse v1 PASS, including
> targeted PASS; v1 remains accepted only for historical red diagnostics. PASS deep-replays exact
> descriptor maps, 44px rectangles, string display/visibility, target-plus-ancestor effective
> opacity and exact assessment-key maps. Hosted jq repeats those raw checks instead of trusting
> summary booleans. Product Shipyard focus restoration already existed in
> `EngineeringPanelController.#captureView/#restoreView`; no duplicate product fix was added.
> Mandatory artifact upload remains hard-fail.
>
> Focused closure passes **73/73**, all three TypeScript programs, Glass/Recovery/persona
> selftests and **66** Actions-policy mutations. The consolidated browser-free `develop` profile
> passes **268/268 files, 2,785 passed / 1 skipped**. The source-derived Compendium producer is
> `ad74e459e00a12c516fc7fbfc17122cb53faa14ef89bdbe5d4e6776d658cb907` under unchanged
> measurement `b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da`; fixed ruler,
> ceilings, 78 outcomes and historical samples did not change. This architecture-only batch
> changes no gameplay, saves, creatures, plants, biomes, Guardians, loot, graphics, audio, release
> identity or HUMAN criterion and grants no GitHub action. Exact clean implementation checkpoint
> `f348b249…` passed Compendium **78/78** with named verification and nine immutable targeted Glass
> rows with zero findings/instrument failures under Edge `152.0.4191.53` / CDP `1.3`; the rows are
> local noncertifying diagnostics, not a full Slice-bound Glass certificate.
> Subsequent clean `cc4d7c9` evidence closed the previously unexecuted Slice/full-v2-Glass paths:
> Slice and full 12-row Glass passed, as did named verification and diagnostic projection
> (126,732 base64 bytes against 700,000). Real small/large Chrome reports passed the unchanged
> workflow jq filter. The Part B successor changes only orchestration/settlement robustness;
> the audit `audits/PR35_CC4D7C9_LOCAL_PROOF_AND_ROBUSTNESS_20260904.md` preserves exact provenance.

> **2026-09-03 UTC historical predecessor Glass native-Tab identity / diagnostic-retention architecture overlay
> (matches the signed local descendant containing this reference):** hosted PR #35 run
> `33708487067`, job `100502739510`, attempt 1, tested exact head
> `d529a9727c29fca3cd9f337a5bb4fc2577ceaec3` against base
> `7a9f4c1370dd84292388d718c38ff34214f6203b`. Authorization, static owners, changed-input Glass
> preflight, Layout **787/787**, Compendium **78/78** with named verification and exact-bound Slice
> all passed. Full Glass reached its fourth row, `large-phone`, then stopped once with
> `ARC4_CAPTURE_NATIVE_SURVEY_RETURN`; only `idleKeyboardFocus:false` was retained.
>
> The old native-Tab helper retained setup-time Scavenge and Sample DOM objects across the ordinary
> Capture authority heartbeat. A healthy heartbeat replaces those objects while preserving the
> controls' semantic identities. Current Sample could therefore own focus while comparison against
> the disconnected old Sample returned false. The later mandatory artifact upload independently
> found 27 files but timed out in `CreateArtifact`, leaving no hosted Glass JSON; the aggregate log
> retains the terminal finding. That forensic limit is preserved rather than filled with an invented
> report hash or event history.
>
> Native setup, heartbeat and focus carriers now own
> `cf-v2-glass-arc4-native-tab-setup/v1`,
> `cf-v2-glass-arc4-native-tab-heartbeat/v1` and
> `cf-v2-glass-arc4-native-tab-focus/v1`. Setup retains the first trusted same-document Tab receipt
> even when its origin is wrong; origin, current-control presence, semantic lineage, restored prior
> focus, settled scroll and final focus remain product judgments. The exact `large-phone` row forces
> one real quiesce → resume → F4 heartbeat between setup and native Tab, requires the original
> controls to disconnect, reacquires the current Scavenge/Sample controls and requires semantic
> Scavenge focus restoration before CDP delivers Tab. Focus evidence is sampled from the reacquired
> current target across stable frames, and visible focus paint must have nonzero color alpha.
>
> `assessArc4NativeTabFocusEvidence()` separates carrier/schema/document/receipt integrity from
> those current-product facts. Missing or wrong-document receipts are instrument-red; lost
> restoration, wrong origin, missing/replaced semantic lineage, transparent paint or post-Tab focus
> loss are product-red. Both directions have deterministic negative controls. Each viewport emits a
> concise start and terminal line with duration and bounded diagnosis counts, so the last completed
> row remains visible in raw logs.
>
> The workflow also runs one browser-free, fail-closed post-Glass diagnostic projection whenever
> Glass was not skipped. It exact-validates the immutable terminal report, committed source,
> profile, Slice predecessor ID/hash, sealed 12-row inventory, completed timing prefix and terminal
> state. A valid pass, product red or instrument red projects bounded first-red details, timings,
> hashes and a deterministic gzip/base64 report carrier to `GITHUB_STEP_SUMMARY` under strict
> per-carrier and cumulative UTF-8 caps. It cannot convert Glass red to green, advance Recovery,
> weaken named verification or replace mandatory artifact upload.
>
> Targeted local Edge/CDP evidence `20260903043639066-7926-2f4122517015` passed `large-phone` in
> **11,037 ms**, with **3/3** Arc 4 outcomes, both old nodes disconnected, both semantic
> replacements acquired, restored Scavenge focus, trusted Tab from current Scavenge and painted
> focus on current Sample. Independent reviews are CLEAR. Focused coverage is **24/24** plus
> **12/12**, Actions policy **64/64**, and the full browser-free `develop` profile is green at
> **266/266 files, 2,758 passed / 1 skipped**, with all three TypeScript programs and static owners
> green. This is local diagnostic evidence, not a hosted certificate.
>
> Current Compendium measurement/producer authority remains
> `b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da` /
> `c216cdc9e8d62800699bc592949726a197f3d8cb6613d1a35086ecd69a1d8cae`; the ruler, ceilings,
> 78-outcome inventory, worker/painter behavior and historical samples are unchanged. The repair
> changes evidence identity and retention only—no Capture mechanics, action structure, odds,
> SessionRNG, Yield, rewards, ownership, persistence, creatures, plants, biomes, Guardians, loot,
> graphics or audio. The exact hosted authority was consumed; PR #35 remains open/unmerged and this
> overlay creates no push, retry, merge, release or deployment authority.

> **2026-09-02 historical predecessor early hosted Glass-preflight architecture overlay (workflow/evidence only;
> exact signed local browser proof green):** `port/v2/tools/battery-scope.mjs` now projects one
> `glass_preflight_changed` output from the exact Glass tools, direct fixture/build inputs,
> application runtime sources, and package runtime sources. It excludes colocated/package tests,
> declarations, docs, app `.gitignore`, and the separately owned worker-only typecheck config.
> Workflow/scope self-inputs fail closed and activate the preflight.
>
> On a `develop` PR with that output true, `.github/workflows/test.yml` runs one
> `glassmatrix.mjs --viewport=small-phone` immediately after the shared Chrome launcher selftest.
> The step has its own `...-glass-preflight` run ID and five-minute/no-retry boundary. It resolves
> configured `CF_BROWSER` through `browserpath.mjs --print` and compares evidence to that canonical
> path, so `/usr/bin/google-chrome` symlink changes cannot create a false red or weaken identity.
> The jq verdict requires committed unchanged source, terminal noncertifying PASS, exact
> 320×568@2 mobile/zero-safe-area geometry, Chrome/CDP `1.3` and complete provenance, strictly typed
> empty finding/instrument/blocked ledgers, selftest/exit/retry invariants, and the five Inventory
> modal/action controls spanning the twelfth and thirteenth hosted failures. Its unique report is
> included in the always-run evidence artifact.
>
> This is a fail-fast diagnostic ordering change, not a new certificate or game subsystem. The
> unconditional certifying develop chain remains Compendium → exact Slice → full 12-viewport Glass
> plus named verification. Recovery/preview remain `main`-only, and evidence upload is the only
> develop operation after Glass. Focused contracts pass **28/28**, the Actions policy selftest
> passes **64/64**, and the working-source `develop` profile passes **264/264 files, 2,739 passed /
> 1 skipped** plus all TypeScript/art/route/specification owners. Three independent audits are clear
> after their findings were repaired. Exact SSH-signed source `4a0228d…`, tree `56650fbf…`, passed
> that hermetic profile and one unchanged-source local Edge/CDP targeted row in **13,625 ms** with
> zero findings, instrument failures, blocked controls or retries and all five required Inventory
> controls. Its raw/gzip report hashes are `9ef29a3b…8f24` / `e0146ec7…e5c`; this remains
> noncertifying and does not prove Ubuntu/Chrome. The
> full thirteen-stop classification and residual hosted-only risk are preserved in
> `audits/PR35_FAILURE_SURFACE_AND_EARLY_GLASS_PREFLIGHT_20260902.md`. No product/runtime, browser
> point-version policy, timeout, retry, release, or deployment behavior changed; no hosted attempt
> is authorized.

> **2026-09-02 historical predecessor Glass Inventory action-evidence architecture overlay (matches the exact
> signed local successor; its evidence/docs descendant is pending and older dated evidence remains
> immutable):** PR #35 run `33674116068`, attempt 1, tested exact head
> `5ae12c7e161e90b3799d6b49a63e2b0438048da6` against base
> `7a9f4c1370dd84292388d718c38ff34214f6203b`. Layout **787/787**, Compendium **78/78** plus named
> verification, and exact-bound Slice passed; Glass then stopped instrument-red at the first
> small-phone action settlement with zero product findings and exact error `small-phone:
> small-phone/Inventory action settlement: outcome did not arrive within 10000ms (last null)`.
> Exact-head architecture had two harness defects: a later spread overwrote
> the composed pending-action `ok`, and the settlement expression returned only complete success or
> `null`, discarding the state required to classify the timeout. This does not establish a product,
> lease or browser-version defect; no retry ran.
>
> `inventoryActionPendingOutcome` now spreads retained setup diagnostics first and computes its
> composite verdict last. The browser path completes/restores its offscreen control before arm,
> binds the exact document/top-frame/default context/origin plus a live browser heartbeat, quiesces
> F4, and owns one exact-sequence diagnostic action hold. A trusted native operation/instance
> receipt, held pending owner and no-optimism state form the action prerequisite; wrong hold identity,
> sequence, contamination or control plumbing is instrument failure. The exact hold is then
> released. `inventoryActionSettlementSnapshot` and its page-source builder always retain action
> kind/detail, pending/modal state, revision, entry/binding state, persistence/lease and
> coordinator/hold authority. Refusal is terminal red; committed remains incomplete while a lawful
> Arc 9 progression tail owns the coordinator. Explicit causal stops prevent pending or settlement
> reds from running dependent checks.
>
> A later stable targeted small-phone diagnostic,
> `20260902213203634-49535-0e789796749b`, had zero product findings but stopped instrument-red on
> portrait campaign scope. Its only baseline was a lawful fallback, while both portrait controls
> intentionally require `portraitControlBaselineEligible`—green, visible trail and no fallback—as
> their starting state. The old campaign nevertheless required an eligible baseline and both
> controls whenever `planned > 0`, making that targeted case intrinsically impossible to pass.
> Full 12-row architecture keeps the eligible-baseline and exact-once requirements. Targeted
> architecture requires exact-once controls when its baseline is eligible, but requires exact-zero
> scoped omissions when it is fallback-only; terminal guards derive the same requirement.
>
> This is a Glass harness-only change. The existing 10-second semantic bound, no-retry contract,
> version-tolerant Chromium-family/CDP policy, workflow jobs, sealed 104-control inventory,
> product source and every game/UI behavior remain unchanged. Successor targeted small-phone run
> `20260902213750107-50317-aa753f436e55` passed with zero findings or instrument failures and is
> explicitly noncertifying. Current evidence is **19/19** focused Inventory instrument tests,
> **37/37** across the related four files, green typecheck and green Glass selftest. The
> browser-free `develop` profile passes **264/264 files, 2,738 passed / 1 skipped**.
>
> Exact SSH-signed implementation `64e405bc6678302c5936945c1b34ac5de5407025`, tree
> `732bcf9930ac36e7661b14cdfd6cde64137d34f4`, parent/pushed head `5ae12c7…`, passed that
> tracked-input profile and one unchanged clean Edge `152.0.4191.53` / CDP `1.3` chain, each stage
> once/no-retry. Compendium `20260902214924248-53897-bef91ee56a` passed **78/78** in **61,826 ms**
> (report `128763fc…f105`); Slice `20260902215043536-54220-81ac577271ec` passed in **362,381 ms**
> with zero findings/scopes and ten screenshots (report/log `7f73b8bb…b7c3` /
> `1b89495e…0eba`); exact-Slice-bound Glass `20260902215703000-54563-41950fd00ea0` passed in
> **114,022 ms** with **12/12** viewports/reloads, **104/104** controls and zero findings,
> instrument failures, blocked/omitted work or retries (report `de298933…adc2`). Every named
> verifier passed and independent code/docs reviews are **CLEAR**. SSH-signed evidence/reference
> descendant `112bf7f…` preserves all four deterministic carriers and passes the final
> tracked-input `develop` profile at **264/264 files, 2,738 passed / 1 skipped**; the current signed
> handoff-only descendant passes it too. Local closure is complete, but this exact local
> certificate grants no hosted authority.

> **2026-09-02 historical predecessor Inventory modal-lifetime overlay (matches exact source; supersedes
> older “current” labels while dated evidence remains immutable):** PR #35 run `33657402955`,
> attempt 1, tested exact head `bdd8a4c46fbbd8484fb9a36d43bb3f60bf660c17` against base
> `7a9f4c1370dd84292388d718c38ff34214f6203b`. Layout, Compendium and Slice passed; Glass then
> causal-stopped on its first small-phone row with exactly one product finding and no instrument
> failure or retry. Inventory retained one correct sheet/detail, identity, geometry, 44px controls
> and Close focus; only `backgroundLocked:false` failed. The report did not identify the unlocked
> sibling, so toast and later FX writers remain source-supported candidates rather than claimed
> observations. The authorization is consumed, PR #35 remains Ready/open/unmerged, and no hosted
> authority remains.
>
> Inventory now owns background isolation for the sheet's whole open lifetime: it snapshots each
> encountered direct body root once, continuously reasserts both `inert` and `aria-hidden="true"`
> after late mounts or attribute rewrites, disconnects before release, and restores exact prior
> state on Close/dispose. Glass keeps its existing 104-control inventory, retains exact unlocked-
> root and nearby presentation diagnostics, and exercises attribute mutation, late-root recovery,
> outside-focus redirection, native Tab wrap and exact restoration in its existing controls. Focused
> tests, the corrected **264/264-file / 2,728-pass / 1-skip** `develop` profile, all three TypeScript
> programs and the small-phone Inventory route/controls are green. Exact signed source
> `5004fd36f9fdb2632f323d99f1535e9fb2ac5b95`, tree
> `cc1a568ebd49e038b831464b2c1ce7d8ac01ad3a`, passed the hermetic tracked-input rehearsal,
> browser/Compendium controls and one unchanged-source/no-retry chain: Compendium
> `20260902185934666-38136-1560adf2b6` **78/78**, zero-finding Slice
> `20260902190106514-38463-d9be88c2f213`, and exact-Slice-bound Glass
> `20260902190730548-38863-824672142575` **12/12** viewports/reloads and **104/104** controls with
> zero blocked/omitted work, findings, instrument failures or retries. Every named verifier passed;
> four exact carriers are indexed in `audits/README.md`, and the signed evidence/docs descendant
> containing this reference also passes final tracked-input proof. No
> gameplay, loot, save, creature/genome, plant, biome, Guardian, art, graphics, audio, ruler, retry,
> browser-version, Gate/HUMAN, release or production identity changed.
> That exact-source Compendium measurement/producer authority was
> `b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da` /
> `f0bb6c638f2ad89236168c28a7161f941dd5702a51104ff93b898481bea4e9dc`; the product/release
> copy moved only the exact built index/main/service-worker graph. Worker/painter bytes, the fixed
> ruler, every numeric ceiling, 78-outcome inventory and historical samples remain unchanged.

> **2026-09-02 current launcher-lifecycle/battery-right-sizing overlay (supersedes older “current”
> labels; dated evidence remains immutable):** PR #35 run `33628648136`, attempt 1, tested exact
> head `85431115256137b05d7cdfa590e087fd3b4d52e1` against base
> `7a9f4c1370dd84292388d718c38ff34214f6203b` and stopped after **6m30s** at the shared launcher
> selftest. A synthetic abnormal post-`Browser.close` exit was accepted; no game page, exact Edge,
> live Compendium, Slice or Glass ran. The authorization is consumed, there was no retry, and no
> hosted authority remains.
>
> The bounded successor freezes close phase before send, claims the close request only after send
> succeeds, waits for exact browser lifecycle rather than premature tree quiescence, and uses a
> receipt-bearing deterministic code-17 process exit instead of relying on core-dump scheduling.
> The sentinel terminates and observes the exact browser, flushes lifecycle IPC, then publishes its
> final identity/acknowledgement barrier and group-kills survivors. Shutdown diagnostics cannot
> release ownership early; profile removal requires proven termination; a direct kill failure is
> provisional until lifecycle evidence expires. The shared launcher selftest now precedes every
> expensive browser consumer. Independent review is **CLEAR**.
>
> Focused launcher/workflow/authority contracts pass **152/152**, the launcher selftest passes,
> Compendium's synthetic instrument passes **618/618**, and the complete browser-free `develop`
> profile passes **264/264 files, 2,728 passed / 1 skipped**, all three TypeScript programs,
> **34** art sources, **1,014/1,014** routes and **454** declared fields. Current launcher /
> Compendium measurement authority is
> `4236ec3fc357d987c525bfde3e58eec09f38373dab8faff61d5712dc598ba7ca` /
> `b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da`; producer
> `308b97e6f1cedca1cde2c4b857d4fb64f45a3165a64a61fb8acd080447c0ef77`, all rulers, ceilings,
> samples, outcomes and the version-tolerant Edge/CDP policy remain unchanged. Exact SSH-signed
> source `a484c39b30c8cdecac464c31283f64efb0263628` passed the hermetic develop rehearsal, root
> Layout **787/787**, Compendium `20260902133054645-17703-2cf459762b` **78/78**, zero-finding
> Slice `20260902133238723-18057-fb0557070177`, and exact-Slice-bound Glass
> `20260902133910919-18520-cab54654b9fd` **12/12** viewports/reloads and **104/104** controls.
> Every named verifier passed; the source stayed clean/byte-identical; no stage retried. Five exact
> carriers and their hashes are indexed in `audits/README.md`. The signed documentation/evidence
> descendant containing this reference also passes the final hermetic tracked-input `develop`
> proof with the same **264/264 files, 2,728 passed / 1 skipped** result.

> **2026-09-02 historical predecessor browser-ownership/Glass repair overlay (superseded by the
> current overlay above;
> dated evidence remains immutable):** exact clean source
> `05690215771db91601cf9dbcbcaa8d771fe540b5` passed the complete browser-free develop profile,
> Compendium and Slice. Exact-Slice-bound Glass
> `20260902034025002-67201-c5ef56b312e9` completed six viewport/reload rows with zero product
> findings, then stopped once/no-retry at tablet-portrait cleanup (`kill EPERM`). No later
> full-certifying viewport ran and that report remains immutable red.
>
> The fault was shared POSIX launcher ownership, not game behavior. POSIX now keeps a detached
> Node sentinel as the live process-group leader while Chromium runs non-detached inside it. Exact
> browser PID/lifecycle IPC, final group identity, acknowledgement, terminal group SIGKILL and
> sentinel SIGKILL exit form the barrier; the parent performs no negative-PGID operation. A clean
> exit is accepted after `Browser.close`; POSIX TERM/KILL are accepted only during owned shutdown;
> crash/nonzero exits remain red. Windows external exit is accepted only after the exact bounded
> taskkill request succeeds. Current browser/Compendium measurement authority is
> `8c6094e4e4bc05c40ace80478b038890e2e8c33856e5932a60805ac71249e0df` /
> `a963f40135651323bb2c0f2a0a6fa7a381ab3905e43b6e5721f45e9f38e50e62`; producer
> `308b97e6f1cedca1cde2c4b857d4fb64f45a3165a64a61fb8acd080447c0ef77` and all rulers,
> ceilings, samples and compatible-browser policy are unchanged.
>
> Final Glass review made Inventory's offscreen control refusal-only: `dispatch:false`, no receipt
> listener, zero input/receipt and exact retained-owner restoration before real product input. A
> generated-source syntax red and Chromium's absent-style-to-empty first removal were both caught
> locally with zero product input/findings; executable page-source and browser-faithful
> null-versus-empty controls close them. Tablet portrait and every downstream viewport through 8K
> then passed once with zero findings/instrument failures/retries on identical dirty-source digest
> `23884a5d5050bc79642d25ac4700e58b269e0deee2d61464c37143550815c027`.
> Product Inventory architecture and every game/UI/save/graphics/audio behavior remain unchanged.
> The finished dirty source passes the complete browser-free `develop` profile at **264/264 files,
> 2,728 passed / 1 skipped**, all three TypeScript programs and the root validator with the
> 50-probe v1.0 determinism fingerprint unchanged. The producer-authority printer is current for
> Compendium and remains red only for intentionally stale, production-only SceneMemory inputs.
> Exact SSH-signed implementation `1f80b0ad050763bf478b2364ad0194e389a7096e`, tree
> `e25579bc4fe063bcdf314ac74c9df2435003617a`, then passed the hermetic tracked-input rehearsal and
> one unchanged-source/no-retry chain: Compendium `20260902055002322-92073-faba0f2692` **78/78**,
> zero-finding Slice `20260902055112371-92394-deee4ff0bf81`, and exact-Slice-bound Glass
> `20260902055724658-92954-a2feb2f6006e` **12/12** viewports/reloads and **104/104** controls with
> zero findings/instrument failures. Local closure is complete; no hosted attempt is authorized.

> **2026-09-02 historical predecessor PR #35 battery-ownership overlay (superseded by the current
> overlay above;
> all dated architecture/evidence blocks below remain immutable):** hosted run `33584052508` tested
> exact head `18c088de4388edf58eda2c192b71cb94156e26e7` against base
> `7a9f4c1370dd84292388d718c38ff34214f6203b` once with no retry. Layout passed **787/787**;
> the first and only red was the production-quarantined SceneMemory fixed-eighth phase-validity
> synthetic allocator selftest,
> before the develop admission chain began. The authorization is consumed and no hosted authority
> remains.
>
> The signed implementation successor makes all live SceneMemory native-heap work
> **production-only/quarantined** while its deterministic schema, contract, mutation and
> historical-red controls remain universal. Develop admission is **Compendium → Slice → Glass**;
> production/release, only after explicit SceneMemory activation, is
> **SceneMemory → Compendium → Slice → Glass → Recovery** on unchanged source. This is a workflow
> ownership change only; no runtime architecture, game, save or deterministic content behavior
> changes. `ROADMAP.md` is the live handoff and `port/v2/README.md` owns canonical commands.

> **2026-09-01 current v2 Guide/ceremony/D-TRAIN green authority overlay (matches exact signed
> code; supersedes older “current” labels while preserving every dated block):** exact SSH-signed
> source `4a4f0b81c85eee32c538a29d8b46f55af73ae7bb` (tree
> `25cb76916c8f3fcd00a916864abb9402932cdbec`) passed the complete browser-free profile at
> **263 files / 2,719 passed / 1 skipped**. Its unchanged-source, named-verified, once/no-retry
> chain passed Compendium `20260902020238003-42290-3e0d5a9601` **78/78** with zero findings;
> develop Slice `20260902020406920-42750-f6dc8783b4cd` with zero findings/scopes and report/log
> SHA-256 `56088a0c5cc03fc45150b937a0cd9e38f054fedcf7df97de0dfe1ba411cd591d` /
> `05b69008a783488af9fbdc0a802119ff0c6c223ab737c48027bae450f0eb2276`; and Glass
> `20260902021048274-43570-053d2c926673` at **12/12** viewport/reload outcomes and **104/104**
> controls with zero findings/instrument failures, report SHA-256
> `df8767c9d2d00843426fe68cab58b59a64043092d7ba5700476425746e5226b2`. Four exact retained
> carriers under `audits/` bind that chain:
> `ARC1A_COMPENDIUM_PR35_GUIDE_CHARTER_DTRAIN_REPAIR_PASS_20260901_4A4F0B8.json.gz`,
> `ARC4_SLICE_PR35_GUIDE_CHARTER_DTRAIN_REPAIR_PASS_20260901_4A4F0B8.json.gz`,
> `ARC4_SLICE_PR35_GUIDE_CHARTER_DTRAIN_REPAIR_PASS_20260901_4A4F0B8.log.gz` and
> `ARC4_GLASS_PR35_GUIDE_CHARTER_DTRAIN_REPAIR_PASS_20260901_4A4F0B8.json.gz`.
>
> `slicesmoke` now drives the exact Guide tail through a pure adaptive-wheel state machine while one
> Node-owned absolute deadline clips every setup/observation/input call and an independent cleanup
> bound restores scroll/style ownership. Main defers the progression drain before queue shift while
> `productActionInFlight`, preserves the full queue and resumes the ceremony exactly once. D-TRAIN
> brackets live/focus evidence with stable primary reads, requires pending release cleared and waits
> for the exact third native write before topology judgment. Ceremony presentation ordering is the
> sole product behavior change. Legacy game, save schema/migrations, deterministic generation,
> creatures, plants, biomes, Guardians, loot, audio, CSS, numeric rulers, browser pin/version policy
> and no-retry policy are unchanged. Hosted run `33572309149` remains immutable red and its ninth
> authorization consumed; no new hosted attempt, push, merge, release, version bump, publication or
> deployment is authorized.

> **2026-09-01 current v2 Guide/ceremony/D-TRAIN correction (matches local code as of 2026-09-01;
> supersedes older “current” labels while preserving dated evidence):** PR #35 run `33572309149`
> tested exact head `efad4b44c86ad89cbed39c18a39e2bbc9370caaf` through synthetic merge
> `778d3cf58937476a65c550e875b946290c0967b4`. Layout passed **787/787**, Compendium passed
> **78/78**, and Slice ran once/no-retry for **1,345,522 ms**, retained all ten screenshots, then
> stopped with exactly three independent findings: the Guide driver issued three fixed 10,000px
> wheel intents without re-observation, only two advanced to 20,000/25,829, and that intermediate
> position was judged; an older Share ceremony advanced the toast serial before
> a held Landing/Charter aggregate; and D-TRAIN's fixed delay read the restored pre-bulletin `rn`.
>
> `slicesmoke-contract.mjs` now owns a pure bounded Guide native-wheel state machine with exact
> tail/document/owner/geometry binding and exact restoration. The runner adds one Node-owned action
> deadline that clips every CDP setup/observation/input call to its remaining budget and a separate
> bounded cleanup owner, plus the stable D-TRAIN raw/live/focus assessor. Main's ceremony timer now checks `productActionInFlight` before queue shift, preserves
> the queue and reschedules; smoke-only `cf-v2-progression-ceremony-diagnostics/v1` counters expose
> callbacks, in-flight deferrals, deliveries and queue keys without entering persistence. Guide,
> Training and release product timing are unchanged; the ceremony ordering is the sole product
> behavior correction. The hosted run remains immutable red and does not certify this changed
> source.

> **2026-09-01 current v2 automatic-arrival transient-latch boundary (matches local code as of
> 2026-09-01; supersedes older “current” labels while keeping all exact historical evidence):**
> authorized PR #35 run `33522000552` tested exact head
> `6f6fb4fbb80ebdc685fd073ac6b06a1496a8f921` against develop base
> `7a9f4c1370dd84292388d718c38ff34214f6203b`. Compendium passed; Slice then ran once/no-retry
> and stopped at `universe-to-galaxy zoom did not reach its browser outcome within 6000ms`.
> `descendGalaxy(..., 'zoom')` had claimed `automaticGalaxyArrivalLatch` before
> `arc9TravelWriteTemporarilyBlocked()` could refuse, and the wormhole path had claimed its latch
> before `beginWormholeTraversal()` reported acceptance. With the camera intent still centered, the
> consumed latch made a transient refusal permanent.
>
> `settleArc9DirectTravel` now invokes a synchronous accepted callback only after claiming the
> shared product coordinator and installing its action barrier as `activePersist`, before its first
> await. Mutable galaxy descent claims its one-shot latch from that callback;
> `beginWormholeTraversal()` derives its accepted boolean and claims its automatic-key latch inside
> that same callback. Inspection-only navigation remains synchronous and does not claim it. The same unchanged intent therefore
> remains retryable during a hold, then starts and commits exactly once after authority clears;
> leaving the intent resets ordinary one-shot suppression. `smokeArmTransientPersistHold()` /
> `smokeReleaseTransientPersistHold()` form a diagnostics-only, identity-cleared `activePersist`
> hold which never writes IndexedDB, advances revision/receipts or mutates product state. The F4
> readiness contract's `allowMigrated` path accepts `migrated-v4` only with the expected token and
> no predecessor—Slice's initial exact document—not by default or after reload/replacement.
>
> Exact clean SSH-signed source `a45220421195042a8702aa1265e96d40d839fc38` passed the
> tracked-input develop profile at **259 files / 2,665 passed / 1 skipped**. On that unchanged
> source, named-verified Compendium `20260901164254371-82172-eaeba62d1a` passed **78/78**;
> named-verified Slice `20260901164421191-82525-616ea739fbb1` passed with report SHA-256
> `d9c4abec7764d37bb029d115d2162931ccc5ffaf3fb26754d2ab3881a4bd902b`; and exact-Slice-bound
> named-verified Glass `20260901165038911-82999-7c3323ea05c7` passed **12/12** viewport classes
> with report SHA-256 `2554d6843a198ee02b3a417bb77ea035f2c73bc4db47ff0124e6ccb1783fc887`.
> Each browser stage ran once with no retry. This repair changes no timeout, retry, browser pin,
> fixed ruler, art/audio,
> creature/genome, plant/biome, Guardian, save-schema, generation or balance contract. The hosted
> authorization is consumed, and no push, rerun, merge, release or deploy is authorized.

> **2026-09-01 current v2 Share-waiter lexical-scope boundary (matches local code as of
> 2026-09-01; supersedes older “current” labels):** exact clean SSH-signed source
> `4a595e2fa3305bf2531fc4051d09314490587e83` closes the earlier 3f8f870 harness-only lexical red.
> Its tracked-input develop preflight passed **259 files / 2,660 passed / 1 skipped**; browser-CDP
> selftest and live Edge preflight passed. Compendium `20260901123144352-62163-00064c788a`
> passed **78/78** and named verification. Exact-source Slice
> `20260901123326914-62541-f7f7c336aa70` passed and named-verified with report SHA-256
> `19833fe4a24dcbc12367e2bcde5b5be3da33578e278e5b3c29b4943357e4b7dd`. Glass
> `20260901123953804-63082-f5844810dfb5` consumed that exact Slice, passed all **12/12** viewport
> classes and named verification, and has report SHA-256
> `a4f6d9b1431e47cf87d7a53c49758af3a6d0244e0ba749368dda579de30bf597`. Every browser stage ran
> once with no retry.
>
> The shared waiter now belongs to the enclosing execution scope used by full-journey and
> outcome-controls modes. Its semantics and all product save/schema, Share/gameplay, deterministic
> generation, presentation, art/audio and creature/genome/plant/biome/Guardian behavior are
> unchanged. Edge `152.0.4191.53` / CDP `1.3` is provenance only; compatible point updates do not
> require a rebaseline. No hosted attempt, push, merge, release, version bump, publication or
> deployment followed from this local certificate.

> **2026-08-31 historical terminal-green Compendium raw failure-cleanup boundary (superseded by
> the current certified boundary above; exact evidence remains immutable):** exact clean
> SSH-signed certified source `9b37ffcdb5879d243288e511b7d70c59ea935dae` (tree
> `e05e48c807597e86530e9b258a11e93d9533cd3c`, parent `4ea8198c…`) contains the collector failure
> cleanup, selftest and derived budget authority. At that historical checkpoint, its signed
> evidence/docs-only descendant added only four exact PASS carriers and synchronized references.
>
> Before this repair, a native Back-input rejection after action-witness arming entered `catch` and
> ran cleanup through the normal tracked observation wrapper. Successful cleanup advanced the
> tracked stage/completion/command carriers, so a partial report could replace the original failed
> `Input.dispatchMouseEvent` boundary with cleanup. Current raw bounded cleanup bypasses observation
> tracking, validates exact listener/carrier release, preserves the primary error's command and
> failing stage, and surfaces any cleanup failure independently. The selftest passes **618 controls**
> and makes the former tracked-cleanup overwrite red.
>
> At that checkpoint, measurement / contract / collector / producer / budget-file authority was
> `5a498342f1090f383f7ae0aa0a62748f0893fb38867103a38540aa5eb762da35` /
> `1b17df2e4983b44d929acfb16cb3ed79250ad7c9b68e522418a44fb3a58d6692` /
> `ffe0494e42d5bf383141709d5ddeacaa65933ed7a7f1c51a85dac265d5b1621d` /
> `af74148c97a41a421592baee801611787f065c60a64bf6da38985bf00bdd79c7` /
> `454cfe610d550fc55466c1725e95af8236ed6789f5887bfbd746b409cf6fecb8`. Contract and product
> producer remain unchanged. Product/CSS, ±2px
> restoration tolerance, numeric rulers/ceilings, historical samples, timeouts, retry/click policy,
> outcome inventory and Edge-family + CDP `1.3` policy are unchanged. Exact `3ca7d30…` is
> historical exact-source evidence only. Exact clean 9b37 passed the complete develop profile at
> **254/254 files / 2,567 passed / 1 skipped**, every TypeScript, art, route and specification owner,
> and all required browser-instrument selftests. On unchanged source, Compendium passed **78/78**
> with desktop `-46 / -46 / -46` and phone `-2 / -2 / -2`; develop Slice passed with zero findings
> and ten screenshots; full Glass passed **12/12** viewports and **104/104** controls with zero
> findings or instrument failures. Every stage ran once/no-retry and every exact named verifier
> passed. SceneMemory certification and Recovery did not run by develop policy. Exact carriers,
> sizes and hashes are in `audits/README.md`; no hosted run or merge is authorized.

> **2026-08-31 historical exact-source terminal-green local Compendium action-time boundary:** exact
> clean committed
> source `3ca7d300f4c8192fef596d4f08e8c493a8875863` (tree
> `7801ead641bf88eb4480767adb816eb5d1e39865`) passed the develop profile at **254 files / 2,567
> passed / 1 skipped**, all TypeScript programs, 64 action controls and every changed browser-tool
> control: browser-path resolution, Compendium preflight, **611-control** Compendium selftest,
> SceneMemory heap phase and browser-CDP lifecycle. Live preflight accepted Edge `152.0.4191.53` /
> CDP `1.3`.
>
> The unchanged source then passed one/no-retry **Compendium → Slice → Glass** develop chain with
> all exact named verifiers green. Compendium
> `20260831-pr35-back-action-3ca7d30-compendium-certification` passed **78/78** in **66,094 ms**;
> one trusted capture-phase witness with complete cleanup bound desktop setup/action/return at
> `-46 / -46 / -46` and phone at `-2 / -2 / -2`. Slice
> `20260831-pr35-back-action-3ca7d30-slice-certification` passed in **365,285 ms** with zero
> findings/scopes and ten screenshots. Full Glass
> `20260831-pr35-back-action-3ca7d30-glass-certification` passed in **111,353 ms** across all **12**
> viewports with zero findings, zero instrument failures and **104/104** controls run, none blocked
> or omitted. Exact carrier names, sizes and hashes are in `audits/README.md`.
>
> That exact source's measurement / contract / collector / producer / budget-file authority was
> `20a1b773e7eec309de31772c2b1c0a174c0f175cfc798e573f20a53b966aba2e` /
> `1b17df2e4983b44d929acfb16cb3ed79250ad7c9b68e522418a44fb3a58d6692` /
> `a5afcffd2f75e7cc2db1284194bc3eb76bde22bf4a1b4741f5157ce25339df51` /
> `af74148c97a41a421592baee801611787f065c60a64bf6da38985bf00bdd79c7` /
> `c60b2f1fb50e978c0d6f522ee52a0274e9a45cd63a51f1643808229b1e25ce60`. Product/CSS, ±2px
> restoration tolerance, numeric rulers/ceilings, historical samples, timeouts, retry/click policy,
> outcome inventory and version-tolerant Edge-family + CDP `1.3` authority are unchanged. The hosted
> 77/78 red below remains immutable diagnosis. SceneMemory certification and Recovery did not run.
> Its four carriers remain historical exact-source evidence, are committed by exact 4ea, and do not
> certify current exact source 9b37 or its evidence/docs descendant.

> **2026-08-31 current Compendium action-time Back-witness boundary:** GitHub run
> `33437596315` tested authorized PR #35 head
> `8eb0b1bd901c7b36d8900f43f4de7d3a54158a0c` against develop base
> `7a9f4c1370dd84292388d718c38ff34214f6203b` through synthetic merge
> `4ccae861ab2f43f4269edfeefa51fd2e4985a875`; merge and head share exact tree
> `b466c5a586dacfc785e7c9c1c8654a90ad5bdade`. Every pre-Compendium stage passed, then the
> one-attempt/no-retry Compendium run completed **77/78** with sole red
> `desktop/back-restores-focus`; Slice and Glass did not run. The immutable report remains red.
>
> The report's desktop setup anchor was `cmem-0773 / -34`, but the existing native activation
> helper legitimately settled the row three times before the sole click. The product then restored
> the later action-time `cmem-0773 / -92` anchor both immediately and after settlement, with exact
> row selection, pinning and focus. The phone control preserved `cmem-0776 / -9`. Historical
> evidence therefore diagnoses the old pre-helper comparison as an instrument false negative, not
> a Compendium product, CSS or Linux-rendering defect.
>
> The local successor adds exact action-time evidence to the collector and outcome contract.
> Schema `cf-v2-compendium-back-action-witness/v1` is armed after final row settlement and before
> native press/release, observes one trusted delegated capture-phase click before the product
> handler, and binds current document, logical row/index, unique target/scroller, hit point, input
> fields, panel state, logical anchor and cleanup. Current `backNavigation` retains `setup`,
> `actionWitness`, witness-derived `before`, `after` and `afterSettled`; legacy reports retain their
> explicit historical replay path and are never rewritten. Focused verification passes **5 files /
> 56 tests** and the selftest passes **611 controls**.
>
> Current measurement / outcome-contract / collector / producer / budget-file authority is
> `20a1b773e7eec309de31772c2b1c0a174c0f175cfc798e573f20a53b966aba2e` /
> `1b17df2e4983b44d929acfb16cb3ed79250ad7c9b68e522418a44fb3a58d6692` /
> `a5afcffd2f75e7cc2db1284194bc3eb76bde22bf4a1b4741f5157ce25339df51` /
> `af74148c97a41a421592baee801611787f065c60a64bf6da38985bf00bdd79c7` /
> `c60b2f1fb50e978c0d6f522ee52a0274e9a45cd63a51f1643808229b1e25ce60`. Product source and
> producer, CSS, the fixed **±2px** tolerance, numeric rulers/ceilings, 78 outcomes, historical
> samples, timeouts, click/retry policy and version-tolerant Edge-family + CDP `1.3` authority are
> unchanged. The earlier `7e089f3…` local chain below remains exact historical evidence only for its
> own bytes. The changed collector still requires a fresh clean signed develop profile and one
> unchanged-source **Compendium → Slice → Glass** chain; there is no new hosted or merge authority.

> **2026-08-31 current terminal-green local develop boundary:** exact clean signed source
> `7e089f3432a834636064615ac2da13b2b0ac39df` passed the isolated tracked-input develop profile,
> then completed one unchanged-source/no-retry **Compendium → Slice → Glass** chain. Compendium
> passed **78/78**; Slice passed with zero findings/scopes and ten screenshots; full Glass passed
> all **12** viewports with zero findings, zero instrument failures and **104/104** controls run,
> none blocked or omitted. Every exact named verifier passed. Report/log carriers and hashes are in
> `audits/README.md`. This is the local develop certificate for the bounded Glass causal-stop plus
> Capture/Binder presentation repair; SceneMemory remains production-only and Recovery did not run.
> Edge `152.0.4191.53` / CDP `1.3` is provenance only. HUMAN/device, hosted, merge, production,
> release and deployment authority remain open.

> **2026-08-31 historical pre-final Glass/product-presentation overlay (superseded above):** exact
> clean signed source `0d4b72aaccc673054b049b4bb533e199ab1f7680` passed
> Compendium **78/78** and develop Slice with zero findings/ten screenshots, each once/no-retry with
> named verification. Exact-source Glass `20260831163921002-30283-9bd10ae7a9bb` stopped immutable
> `instrument-fail` after **102,462 ms**; its old noncausal continuation accumulated 88 provisional
> rows and 9 instrument failures, which are not independent-defect counts or a Glass certificate.
>
> Exact signed implementation `2b9e9effe35af2e8a585f4fdfe5f769bca372c5f` centers Capture
> actions at base grid scope while preserving 44px/narrow/landscape contracts and gives only
> owned/non-missing Binder rarity slots the opaque `#05070d` surface. Glass now causal-stops the
> first product red with a complete blocked suffix, classifies current rendered Guide copy before
> instrument controls, excludes unpainted closed-`details` descendants, and repairs stale
> copy/restoration/Shipyard carriers. Creature/genome/biome/plant/Guardian structure, Capture
> mechanics, raw rarity, save, RNG, balance, browser ruler, timeout and retry are unchanged.
>
> Focused product/harness **7 files / 51 tests**, producer authority **2 files / 32 tests**, Glass
> selftest, syntax and diff checks pass; three independent reviews are **CLEAR**. Targeted
> primary-phone, large-phone and phone-landscape diagnostics pass but are not a full certificate.
> The complete develop profile is green at **253 files / 2,562 passed / 1 skipped**, all TypeScript
> programs, **34** art sources, **1,014/1,014** routes and **454** non-inert fields. Current
> Compendium producer/budget authority is
> `af74148c97a41a421592baee801611787f065c60a64bf6da38985bf00bdd79c7` /
> `80a2b8b39d400419a5527f9737a92ea2e0c54916ba8c3966411e607fd950fd79`; fixed rulers, samples and
> version-tolerant Edge-family + CDP `1.3` policy are unchanged. The fresh chain described above now
> supplies the exact local develop certificate; no hosted/release/deploy authority exists.

> **2026-08-31 historical 4002/4822 instrument overlay (superseded above):** exact clean
> signed source `4002b2d59508fce70d8e9eed404fd3544635f54d` passed Compendium **78/78** once/no-retry as
> `20260831130356666-917-5be54ef202`; its exact-source develop Slice
> `20260831130558500-1306-cb8d7cf92834` stopped after **303,148 ms** with **3 findings / 3
> scopes**, and Glass did not run. Hidden Prime, forced HP overlap and forced visible
> Prime-over-Survey all made the geometry oracle red correctly. Whole serialized `style` equality
> then falsely rejected restoration, and the non-stopped run later produced a dependent
> protected-save harness cascade. Product presentation was green at the causal boundary.
>
> Exact SSH-signed instrument/evidence source `4822cab92ae3f300635ef16678f860f60a6872e8`
> changes only Slice evidence code and tests. One shared browser-free-tested
> helper captures/restores/inspects exact value/priority pairs for each owned property; absent
> properties are removed, unrelated inline declarations survive, intermediate/final restoration is
> reproved, and affected base/control/restoration reds causal-stop immediately. Creature/genome,
> biome, painter, loot, combat, Guardian, save schema, RNG, balance, audio and product CSS are
> unchanged. The consolidated develop profile passes **253/253 files, 2,557 tests, 1 skipped**, all
> three TypeScript programs, **34** art sources, **1,014/1,014** routes and **454** non-inert fields.
> Current Compendium producer/budget authority remains
> `99436b414f0caa1699c98181a263c93110a9365445f1da47fe08dd80cba97e5d` /
> `c7d8dc926724d65a390d45a631b98f26cb0499f73ba302b8bb08689a7af924c2`; the 77-bullet release
> draft SHA-256 remains `11483b3d1e9c2760a00354e6511a27889e62a4f092ee6847589dc1b7a0bfb2c1`.
> Develop next restarts one unchanged-source **Compendium → Slice → Glass** chain from a new clean
> signed candidate. SceneMemory remains production-only; no hosted/release/deploy authority exists.

> **2026-08-30 historical SceneMemory source-normalized admission overlay (matches local code):**
> exact signed source `553b06bc5b477a90e0d7284360fa84ab99704fb7` supplied exactly three
> calibration-only observations, once each with zero retry, under one unchanged 52-file build and
> Edge `152.0.4191.53` / CDP `1.3`. Every candidate completed 44/44 calibration outcomes with
> stable route topology, warm range/slope, ownership and cleanup. Worst phone/desktop V8 growth over
> the scored fixed-second initial snapshot was 5,387,552 / 5,677,328 bytes; worst growth plus
> embedder plus backing storage was 11,098,217 / 11,352,882 bytes.
>
> The current serialized boundary is report-v4/profile-v3/input-v5/verdict-v4/budget-v5. It retains
> 12 MiB initial-V8 and 18 MiB initial-aggregate safety stops, then caps V8 growth at 6 MiB and the
> normalized working set at 12 MiB. Raw totals remain report diagnostics; existing component,
> range/slope, DOM/listener, resource, ownership, pending, BFCache, answerability and surface-vista
> semantics are unchanged. Exact/+1, equal-offset, post-initial retained-allocation,
> missing/detached-initial and historical input-v3/v4 replay controls are green. The old absolute
> 12 MiB post-route V8 cap would reject two of the three identical-source desktop BFCache samples.
> The v5 initial heap carrier is an exact three-field projection (`usedSize`,
> `embedderHeapUsedSize`, `backingStorageSize`); raw CDP `totalSize` and synthetic future fields are
> rejected rather than becoming browser-version-sensitive contract authority.
> A fresh clean input-v5 browser certificate remains pending; historical evidence is never
> relabelled, and compatible Edge point versions remain provenance only.

> **2026-08-30 historical local Arc 4/9 open-card publication correction (matches local code):**
> `runCaptureCardAction()` may resume after its committed Capture has already queued and yielded to
> `runArc9ProgressionRefresh()`. The shared coordinator then correctly makes
> `refreshCaptureCardState()` publish unavailable rows and clear its presentation fence. Arc 9's
> `finally` now releases `productActionInFlight`, its coordinator claim and its exact
> `activePersist` barrier before calling `refreshOpenCaptureSurfaceAfterArc9Progression()`. That
> helper republishes only when the same runtime is current/answerable, no replacement, convergence,
> Training or ecology boundary is active, the Survey card still owns the current Capture surface and
> the coordinator is idle. A synchronous publication fault clears the fence and schedules the
> existing read-only convergence reload. Domain Capture projection, F4 transaction, receipt order,
> RNG, Yield and Arc 4/5 ownership are untouched. Exact 656 browser evidence preserves the original
> one-scope pre-arm stale-disabled result; focused source/mutation and replay tests cover the repair.

> **2026-08-30 historical exact-`8bdf474…` evidence / Arc 0 publication-oracle repair overlay
> (superseded by the current handoff):** exact clean SSH-signed evidence source
> `8bdf474e92467652729a6980f706ca3a2813682c` passed Compendium **78/78** once/no-retry in
> **64,108 ms**. Its unchanged Slice
> `20260830-pr35-arc3-8bdf474e9246-slice-certification` stopped terminal red once/no-retry after
> **111,490 ms** with exactly one scope, `arc-0-landing-publication-convergence`. The exact
> reports/log, source tuple and no-successor boundary are preserved under `audits/`; the stored
> Slice remains FAIL, and Glass/Recovery did not run.
>
> The retained pre-action and held old-document live products have zero differing fields and the
> same 1,876-byte / `e353f175…e78` identity; both retained the correct open Pertar post-Survey card.
> The stale instrument also applied a pre-Survey helper requiring that card to be closed. The
> immutable replay proves that contradiction and records its missing historical held
> `cardCode`/target capture. The then-uncommitted runner atomically captured those values and
> evaluated live-product parity plus complete route/rendered-scene/card/share/target evidence through
> shared browser-free contracts and field-level controls. Earlier Research/Fabricator focus lineage, explicit
> Survey predecessor, exact coordinator, Arc 5 v3 diagnostics and Guide-inventory repairs remain.
>
> No timeout, retry, browser rebaseline, product schema bump, save/gameplay redesign or
> creature/genome/art/audio change followed. At that checkpoint browser-free validation was green:
> **251 files / 2,501 passed / 1 skipped**, with all TypeScript programs green. Fresh exact-source
> browser authority remains pending.

> **2026-08-30 historical exact-`e4f5af4…` Slice-oracle overlay:** exact signed source
> `e4f5af4bf628ee2f0b2485077e46dc0ff86b2b0c` passed Compendium **78/78** once/no-retry in
> 64,831 ms, then Slice `20260830-pr35-slice-oracle-e4f5af4bf628-slice-certification` stopped
> terminal red once/no-retry after **98,988 ms** with four ordered scopes:
> `f4-replacement-outcome`, `arc-3-mine-action`, `arc-3-mine-action-controls-failed` and `harness`.
> Seven partial screenshots and the three immutable carrier identities are registered in
> `audits/README.md`. Glass and Recovery did not run; this chronology remains FAIL.
>
> The corrected F4 oracle treats native replacement and held bootstrap as separate transactions. It
> inventories every readwrite first observed before replacement completion and requires exactly one
> eight-store replacement, then freezes before the required later lease-release CAS. It captures
> every available object-store request method and index access, requires the exact 13-request
> lifecycle with empty index inventories that clears old receipts and writes source v5
> rows without F4 authority, then requires the replacement document's one receipt-free seed/bootstrap
> commit. `current` assigns the judged outcome ordinal zero; `ready` requires exactly one silent,
> aggregate-only, fixed-point `arc9-progression-refresh-v1` receipt at ordinal zero and assigns the
> judged outcome ordinal one. The retained sequence is 7 staged → 8 replacement → 9 bootstrap →
> 10 Arc 9 receipt 0 → 11 Smoke receipt 1. Prefix selection comes from an independent production
> projection, never the observed ledger.
>
> Exact source legacy bytes remain bound by
> `57e9d86d1847ab0bd7d8ba4579b2bfd5a51f9b65715fc1ef412db050a6fadd88`; the independently
> derived post-boot projection is
> `e40a542553ab61a1f9c5800e856a8f1e3c5efd341fdb73dec776d622258bd31c`. Only the absolute
> `at` anchor and exact conquest/mined ages may normalize between codec clocks; both absolute clocks
> remain run-bounded and monotonic. Full saved-view geometry, canonical Earth Atlas route, rejected
> forged-Earth route, achievements/rank and every unrelated product field stay exact. Red setup
> stops before import, red prefix stops before the diagnostic outcome, and red outcome/control stops
> hide and Arc 3 before a timeout cascade. The live periodic heartbeat is stopped, settled and bound
> to the exact document before staging/arming. This repair adds no product
> capability, save schema/migration, achievement/rank/reward policy, retry, browser rebaseline or
> player-facing change.

> **2026-08-30 sealed-worker/PWA + Guide/Release/named-CF1 design with historical authority
> checkpoint (product design matches local code;
> supersedes the
> execution-late `clients.get()` repair and narrower current-authority language below; every named
> run remains immutable history):** exact signed source
> `38d8848c984089d33f4bafa1043e36c2cbb2ce9e` first preserved the 3,115 ms painter-import
> `product-fail`, zero outcomes and all 78 blocked. Exact descendant
> `dc6004cf4426df72bea141ac77b0be927f36886c` then ran
> `20260830-pr35-execution-late-dc6004cf4426-compendium-certification` once with no retry and failed
> again after **3,112 ms** at phone veteran-Earth Planetside: its worker reached `ready`, but the
> first painter import failed, zero outcomes ran and all 78 were blocked. Neither red was retried and
> neither was followed by Slice, Glass or Recovery. The 38d report is preserved as
> `audits/ARC1C_COMPENDIUM_PR35_PAINTER_IMPORT_PRODUCT_FAILURE_20260830_38D8848.json.gz`, 6,053
> gzip bytes / SHA-256
> `e45b2f65cc93ad717524d52ebddfdd504e2abedf5296d6d5aa287e949be968aa`, 37,825 raw bytes /
> SHA-256 `63014b6dfea3790fe3618344bdf8d5b31de68e1ac54798f5fe80b5a41092ccf5`; independent replay is
> **4/4**.
>
> Fetch-time adoption was falsified as a product repair: first-install claim can still leave a
> worker's later module fetch without usable client ownership. Current code removes that fetch
> boundary. Worker construction remains lazy, but the species-art worker statically owns the entire
> painter and the biome-vista worker statically owns the entire renderer. Production build authority
> rejects `import()` and every external static JavaScript import in either worker entry. The generated
> service worker no longer adopts an unpinned request at fetch time; every unpinned non-navigation
> request remains exact 503. Valid controlled worker creation may still bind its
> `resultingClientId`, and absent pinned clients still require `clients.get()` confirmation before
> pruning, but no post-start worker chunk depends on enumeration, lookup, timing, network fallback,
> cross-build inference, sleep or retry.
>
> At that historical sealed-worker checkpoint, Compendium measurement / contract / collector
> authorities were
> `5c408472b808f09e9f31133905635f08b7ef3588fad151f5f68e2a67ff68b1d0` /
> `9fc43fe4d29453ec4b546a53a2e62bc874499c67bae9f0f0f4c33e8063c41828` /
> `0af0f5884c0eec67cea7c6696c20a2c691c669fa93ee255fd1c54d17b56d5010`.
> Its final derived changed-head producer authority was
> `f2f1629a98962801a740d0448d955d08c1ccd9157149edb42169bf0a317e43f3`; it binds index
> `45fc756d924fabd03b3b214e0fd80697e463c59a686a190fcee2b076d05de27c`, owner
> `assets/main-BYnoCcc9.js` / `13afe063806bca9b829866070c08741ea0749ca07c1d7dcecf3175c1dae9bfa5`, and generated
> `service-worker.js` `5a968f36984021e39a0cb9e70b2ec37b607563c08a29240b078b828f3d0607d3`.
> Combined worker/painter `assets/species-art.worker-DnnSDKMy.js` remains
> `25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172`. At that checkpoint, Scene
> build / game-main, Compendium budget-file and Scene budget-file authorities were
> `9351f6fc2311365a5dfc8a4c0b0629d862d7c91f6cd00a83e236b1ce824a6e17` /
> `07bdf8aac9bd8224870f2749df18461576d733c55555698dd247ddeffb83f831`,
> `c4f6dddffdf88e42819c567c26132a66f3924a7423002cbfca4564e2defb9d0b`, and
> `670f8ecc2c0bc5715fb92b263820db577a70c3faf254151ff11f45de8fe645f7`. The green printer binds a
> **964-module / 52-file** build. The sealed-worker portion changes worker packaging and PWA
> ownership only. That checkpoint also included the bounded Engineering focus repair, its 74th
> release-note bullet and evidence-assessor repairs; no save schema, painter pixel, seed, genome,
> anatomy, art structure, ruler, numeric ceiling or 78-outcome inventory changed.
>
> Exact clean signed source `941ba45a96e5baabadc255d53db86fa935cefe81` then passed the
> once-only named Compendium run
> `20260830-pr35-sealed-worker-941ba45a96e5-compendium-certification` at **78/78** in **65,731
> ms**, with both profiles, all six review PNGs and Edge `152.0.4191.53` / CDP `1.3`. Its immutable
> report is **452,127 gzip / 10,881,302 raw bytes**, SHA-256
> `e6f2aa4dfcbf94830f3c0059a8e64239956ac0d2e0685c8e267a338faba2f6f8` /
> `d4b2b2aa07f3b1f4a70903d4d8ae82abe1eaf755523a51d7ecc85d1e610c109b`.
>
> Its exact-source Slice `20260830115041916-36220-7ed2dd2ef398` then ran once/no-retry and stopped
> terminal red after **63,106 ms**, **63 findings / 42 scopes**, and six partial screenshots. The
> first 62 findings are Guide/Release instrument drift from both synchronous reads of the previous
> DOM before deliberate microtask publication and stale 26-partial/15-unavailable plus player-copy
> expectations rather than current 9/41/34/7 authority and live Scout, conquest, reward and audio
> truth. The independent
> final finding is product-red named-CF1 Follow starvation after accepted custom-world naming. Glass
> and Recovery
> did not run. Immutable Slice JSON is **40,180 gzip / 522,130 raw bytes**, SHA-256
> `c7b314352c65e5dd24120eb5982a78e87a899f488a78e3c205156a2e134eedad` /
> `65917019eeb8c74d258b89ab793ad13db2fc2619da1f21d7b0b2b6550e44c07d`; its log is **19,473
> gzip / 253,140 raw bytes**, SHA-256
> `d5321f9ea85d949f32f6b688ddbc11b8638ae6e776a97feb6502b7ca392416f9` /
> `c54bd170a95eedf884bf591dd4c17241a1460cfcde7dc3a79cfa32bcdc56113c`.
>
> Current `slicesmoke.mjs` Guide/Release interaction owners await the exact requested DOM identity
> after every category, topic, search, home, release-list and release-article transition. Their
> browser-free controls bind **9 categories / 41 unique topics / 34 partial / 7 unavailable**, the
> exact topic-to-category mapping and current gameplay copy; reverse-direction deferred publication,
> wrong mapping, stale identity and mutation/restore all fail. The product repair removes Main's
> early post-name aggregate catch-up. Direct Travel owns its accepted route, arrival, galaxy visit
> and any proved galaxy-kind event; Follow additionally owns Follow/Jumps/`wayfarer`. A post-name
> route that refuses or otherwise does not join progression
> queues exactly one catch-up only after the name transaction settles. The adapter synchronously
> reserves this handoff, defers/coalesces ordinary persistence attempts and re-arms one after route/
> catch-up enqueue. Exact heartbeat and pagehide-lifecycle owner tokens remain nondeferrable; the
> heartbeat owner already refuses to queue behind product work and lifecycle may supersede the route.
> The bounded timeout retains actionable diagnostics; it is not a retry.
> No creature/genome/save-schema contract changed. That historical changed head had no complete browser certificate,
> and browser point version remains provenance only—never a rebaseline or threshold input.

> **2026-08-30 historical post-claim PWA/species-art overlay (matched code at that source;
> superseded by the sealed single-file overlay above):** exact signed source
> `830e601b8f16092d6f9193ecde329cfefd279bcd` ran
> `20260830-pr35-visualkey-v2-830e601b8f16-compendium-certification` once with no retry. It stopped
> terminal `instrument-fail` after **33,217 ms** at phone veteran-Earth Planetside settlement with
> zero outcomes and all 78 blocked. Observation v2 proved that the eight 766–779-character visual
> keys crossed the new bounded membership projection. The species-art worker's first lazy painter
> import failed, but v1 Window diagnostics discarded the error code and message. The exact v2
> report/carrier remains immutable; no later diagnostic schema can recover a message it never
> retained.
>
> The deterministic PWA harness reproduced the code-supported cause. First-install activation took
> its all-client snapshot before `clients.claim()`; a worker created in that gap loaded its entry
> uncontrolled, then became controlled at claim without an exact retained-build pin. Its lazy import
> consequently received the exact 503 `This document has no retained Celestial Frontier build.`
> First activation now runs `preserveLiveClientBuilds(state, false)` again after `clients.claim()`
> inside the same activation `waitUntil`. The fixed harness pins and serves the gap worker's exact
> lazy bytes; a mutant deleting only that second pass recreates the exact 503. Workers created after
> claim still pin through the entry request's valid `resultingClientId`, and unrelated unpinned
> requests remain red. The post-claim pass is realm reconciliation, not a network or cross-build
> fallback.
>
> `species-art-loader.ts` now publishes required nullable immutable `lastError` under
> `cf-v2-species-art-worker-diagnostics/v2`, with exact fields
> `{producerEpoch,workerInstanceId,jobId,kind,stage,code,message}` and a 1–512-character message.
> Only trusted, protocol-valid worker errors populate it; `jobId`, `kind` and `key` must be all null
> or all present and valid. A replacement producer clears both `lastEvent` and `lastError`; adapter-
> protocol failure and external/untrusted fatal clear `lastError` too, while a trusted worker fatal
> retains its exact record. Compendium live thumb-settlement
> observation is `cf-v2-compendium-thumb-settlement-observation/v3`: authority and exact-shape
> validation precede product classification. Absent broker/worker diagnostics, exact art schema
> `cf-v2-species-art-diagnostics/v1` or exact lazy schema
> `cf-v2-species-art-worker-diagnostics/v2` refuses terminal product attribution. With all present,
> a current error plus a matching trusted `lastError` returns terminal `product-error`, which the
> collector preserves immediately as `product-fail` without sleep or retry. Cumulative recovered-
> error telemetry with a coherent current `ready` producer remains nonterminal.
>
> Exact signed descendant `d33abdfd513236e72294b81e3bb46b1362f810e1` then ran
> `20260830-pr35-first-install-d33abdfd5132-compendium-certification` once/no-retry on Edge
> `152.0.4191.53` / CDP `1.3`. All 78 outcomes completed: 74 passed, while phone/desktop
> `cap-shrink` and `settled-jobs` stored red. Their own evidence proves 256 → 96 cache shrink, exact
> 6,690,816 decoded bytes, 160 disposals, four sealed warm cycles, restored device class and
> balanced/released worker lifecycle. The shared oracle defect instead required the deliberately
> induced paint error's `lastError` to remain non-null after replacement recovery. The exact report
> remains red and immutable; no successor browser gate ran.
>
> For current diagnostics v2, every selected released/recovered worker snapshot must be `ready`
> with `lastError === null`, including non-final and post-cap samples. Exact cumulative paint/phase/
> result arithmetic still proves the induced negative control. Terminal current product errors keep
> the opposite requirement: one exact non-null trusted receipt. Historical diagnostics v1 remains
> replayable. The exact carrier is
> `audits/ARC1C_COMPENDIUM_PR35_RECOVERED_WORKER_ORACLE_FAILURE_20260830_D33ABDF.json.gz`, 451,743
> gzip bytes / SHA-256
> `4e714e115ca7f4b5d1d32ba118241ca8b78055596438a4dd22bbb1c1d471ffab`, 10,813,681 raw bytes /
> SHA-256 `e4eb2aba1079a1d42b1da5e7f97d236105917fd497035937b1f6855d63a4289e`, with independent 8/8
> replay.
>
> At that historical d33 checkpoint, Compendium producer authority was history-safe schema
> `cf-v2-compendium-producer-authority/v2`, SHA-256
> `2ef58ea042d2d5ecb97715642efeac14e013dfb8b375406cfb47c090cf072e39`. Its exact inputs are the
> generated `service-worker.js` (`81dca3977138d0973b52e85c0c82b6636674088546463edb136ec64640b78a14`)
> plus index, owner, species worker and painter. Deleting the post-claim repair changes authority;
> historical v1 producer records remain replayable under their own shape. Scene build
> authority was `49bc3ce0529eab7af1dff496c09fb79f08d5ad9e7ab4f1b7a05fc8d2e0d13dfc`; Compendium
> measurement / contract / collector authorities are
> `fc54f822dc7f93481fbb1402b7c7940bc9a618b836112fd5514e8130de9f29ed` /
> `f756bc7557613dd6c61ecb35acd9de752d54a7d0e51a52e192f361dca3f4ab29` /
> `2a74e941abbe701ca5c1d3952a7451ccd11ce3284d794f9e22aa0a79c0315237`.
> Browser-free repair coverage closes at 591 `compendiummem:selftest` controls, independent 8/8
> carrier replay, the full **239 files / 2,431 passed / 1 skipped** suite, all three TypeScript
> programs and the green authority printer. Fixed ruler, numeric ceilings and the 78-outcome inventory are unchanged.
> Certification remains open; only a materially changed signed source may make one new no-retry
> Compendium attempt.

> **2026-08-29 exact-build PWA foundation (current except where superseded above):**
> `port/v2/apps/game/pwa-build.ts` is a build-only Vite plugin that emits the same-origin web
> manifest, standard/maskable SVG icons and a generated classic service worker. Its canonical,
> path-sorted SHA-256 asset table covers every final written runtime output except source maps and
> the worker itself; an automatically derived SHA-256 worker-template revision joins that table in
> the canonical build identity, so a worker-logic-only change still receives a distinct immutable
> build/cache id. Because the bundler can finalize bytes after `generateBundle`, the plugin re-reads
> actual files in post-ordered `writeBundle` and rewrites only the generated worker with those exact
> final digests. Install fetches with reload semantics, rejects redirects, URL drift, non-OK
> responses or digest drift, writes the completion marker last and deletes the candidate on any
> failure.
>
> Activate verifies the complete candidate and preserves every live client type's exact persisted
> build pin before switching the selected build. A successor never claims already-running pages;
> each remains on its pinned complete build until an explicit navigation/reload. Navigation selects
> the globally active build and pins the resulting document. A module-worker or shared-worker entry
> request inherits that selected pin through its valid `resultingClientId`. Current production
> species-art and biome-vista worker entries each contain their complete statically bundled graph;
> the build rejects both `import()` and external static JavaScript imports in those entries. If a prior-
> pinned client would make a third retained build necessary, activation refuses before
> `skipWaiting`. Retention enumerates `clients.matchAll({type:'all'})`, and an apparently absent
> pinned client must also be absent from `clients.get()` before its pin is pruned; this closes the
> ready-snapshot/worker-creation race. On first installation only, activation claims existing clients
> and then repeats that complete preservation pass inside the same `waitUntil`, closing the distinct
> pre-claim-snapshot/claim-gap worker race for enumerable clients. There is no fetch-time adoption:
> every unpinned non-navigation request remains exact 503. Current plus one verified prior cache
> remain, with local 4xx/5xx refusals and no undeclared, cross-build, external or network fallback.
>
> `src/pwa-update.ts` mounts an accessible Settings-contained App-status controller only in emitted
> PWA builds. Registration bypasses HTTP cache; update status is polite/atomic and errors are alerts.
> Waiting workers call `skipWaiting` only after an exact-id Activate gesture; status/results are
> accepted only from the exact waiting/active worker, and a matching new-active status broadcast—not
> `controllerchange`—reveals Reload without forcing it. A refused third-build activation restores
> the controls. Rollback verifies/swaps the selected active/prior ids, but running documents keep
> their pins until the same explicit reload. Main refuses that reload during product/import/Training,
> authority-convergence or protected save-authority conflicts, joins an active persist, and
> checkpoints a debounce canceled
> by the exclusive replacement claim. A failed durability boundary releases ownership and rearms
> that debounce; only success releases audio, F4/runtime, chrome, the PWA controller, Pixi and both
> canvases before navigation. Runtime caches never contain or roll back IndexedDB expedition data.
> VM, JSDOM, static wiring and independent built-output digest/inventory mutation coverage exercise
> this contract; exact signed `5004fd36…` supplies the current local Compendium → Slice → Glass
> authority. Physical install/offline/update/rollback, assistive-technology, device and HUMAN
> acceptance remain open.

> **2026-08-31 current local Binder and Prime-Frontier overlay:**
> `port/v2/apps/game/src/binder-sets.ts` is a strict read projection over canonical `codex` and
> bounded `claimedSets`. It retains the six legacy pages—The Spectrum, The Sixteen Realms, Body
> Plans, Ability Themes, Flora Flavors and Size Classes—and proves seven non-Paragon sets from
> canonical species types: `kingdoms`/Four Crowns (25 Stardust), `flavors`/The Five Flavors (40),
> `themes`/Master of Arts (80), `bodies`/The Bestiary (80), `realms`/Warden of Realms (100),
> `xeno`/Against All Odds (60), and `court`/The Apex Court (150). `para10` is read-only imported
> compatibility evidence: the Fifty Paragons stays visible/unavailable and has no claim id or
> deterministic discovery writer.
>
> `commitArc9BinderSetClaimV1` reprojects eligibility inside one generic F4 action, adds the exact id
> and current/lifetime Stardust, folds aggregate achievements/best rank into the candidate, and binds
> the result to a canonical facts digest plus `arc9-binder-set-claim-v1` receipt. It advances the
> receipt ordinal without a domain draw. Exact checkpoint verification precedes targeted
> `claimedSets`/`essence`/`stats`/`unlocked` publication; already claimed is a receipt-free fixed
> point, and incomplete/corrupt/overflow/stale/storage paths cannot pay. Main mounts the projection
> below Records rank, delegates only one of the seven registered ids, rechecks Training and write
> authority after the heartbeat, and enters read-only convergence on ambiguous durability.
> Owned/non-missing rarity slots use opaque `#05070d` behind the canonical tier foreground;
> `.missing` slots retain their separate dim/transparent semantics and are not treated as owned.
>
> `prime-codex-panel.ts` consumes only `PRIME_SIGNATURES_V1` and Persistence's five registered
> ending ids. The nine ordered Signature rows are Earth/`stone`, Fire/`flame`, Air/`sky`,
> Stellar/`star`, Water/`ocean`, Electric/`mind`, Poison/`life`, Void and Prism, with their exact
> Titan guardian, lore, hunt, reach and imported claim. `guardian-prime.ts` selects an unclaimed
> Titan only when a registered unconquered CF1 world satisfies minimum region, deterministic
> seed-local 8.5% presence and matching world type; Void is checked first. A verified Titan win
> writes its Prime claim and exact world inside combat settlement. `reachRadiusOf(primeCount)` uses
> the established 0/2/4/6/8/9 Signature thresholds, and the ninth distinct combat claim sets
> `frontierUnlocked`.
>
> The panel exposes Sovereign of the Frontier (`conquer`), Warden of Life (`protect`), World-Shaper
> (`terraform`), The Unseen Hand (`preserve`) and Prismatic Pathfinder (`balance`) only after the
> exact nine-claim mirror agrees. Balance additionally requires at least three conquered worlds,
> the Electric/`mind` claim and 40 catalogued species. `arc9-frontier-ending-action.ts` accepts one
> registered id, changes only `frontierEnding`, and commits one `arc9-frontier-ending-v1` receipt/F4
> revision CAS with no retry or optimistic publication. The same chosen id is receipt-free current;
> another choice cannot overwrite it. Missing fixed-point evidence or presentation failure restores
> prior live authority and schedules read-only convergence. A bounded unknown imported ending token
> is shown as protected evidence and never interpreted, normalized, or replaced. Main owns the
> native Prime opener/panel/button delegation, heartbeat and Training/write recheck, exact checkpoint
> publication, and read-only selector; the pure panel/action modules own no DOM or storage globals.

> **2026-08-29 current local Arc 9 rank/Records/achievement overlay:**
> `port/v2/packages/domain/progression/src/rank.ts` preserves the mature score formula, ten exact
> rank thresholds/titles, nameplate hues, permanent best-rank unlocks, Eternal Frontier foil and
> endless 3,000-point prestige. `achievements.ts` carries all 96 legacy metadata rows in exact order
> and separates 68 bounded aggregate projections from 28 event-owner-only unlocks. The pure
> projector renders known durable ids, reports eligible aggregate rows, keeps event rows blocked on
> their real action owner, and exposes bounded unknown compatibility ids without laundering them
> into the catalogue.
>
> `arc9-progression-projection.ts` maps sanitized canonical `SaveStateV2` carriers into that strict
> domain; `records-rank-model.ts` exposes all six score factors and 96 rows; and
> `records-rank-panel.ts` renders one bounded current/next-rank card plus 13 native achievement
> shelves. `arc9-progression-action.ts` appends only newly proved aggregate ids and monotonically
> raises the existing `br` mirror through the generic F4 deterministic product owner: one immutable
> receipt, one tab-lease/revision CAS, no retry or optimistic publication, followed by exact
> committed-save fixed-point verification. Existing event and safe unknown ids retain their order.
> Main coalesces one follow-up after a product owner settles, publishes only detached `ach`/`br`
> fields and shows the rank/nameplate in AppChrome. `progression-ceremony.ts` then accepts only the
> exact append/rank delta from a first committed publication. Newly appended known ids retain
> manifest order and produce text plus rarity sting 3; a strictly higher durable best-rank index
> produces the named Rank Up toast, sting 5 and the mature four-gold-color burst semantic. Main
> revision-dedupes and serializes that queue. Gold particles never exceed 40 and are further clipped
> by current motion/device policy; the FX caller receives only player-chip center geometry from
> AppChrome. Boot catch-up, Training, replay/out-of-order revision, already-durable observation,
> refusal and committed convergence are silent. DOM/audio/effect failure cannot change the durable
> fact, and the ceremony grants no item or currency. The mature `ach`/`br` fields remain the only
> carriers; no schema or migration was added.
> `arc9-nameplate-action.ts` and `nameplate-settings.ts` now expose the saved color policy directly:
> Auto follows current rank, while explicit choices stop at durable `stats.bestRank`. One native
> change rolls its tentative DOM value back before one receipt/F4 CAS and updates `nameHue` plus
> AppChrome only after independent fixed-point verification. Locked/malformed values refuse and
> durable ambiguity reload-converges. `arc9-explorer-name-action.ts` and
> `explorer-name-settings.ts` own the separate **Change name** action: the shipped sanitizer and
> 24-character cap change only `explorerName`, cleaned-empty/unchanged input is receipt-free, and one
> F4 receipt/CAS settles without retry or optimistic publication. Durable ambiguity restores the old
> live name and reload-converges. This identity-only action deliberately cannot unlock `namer`.
>
> Twenty-three distinct event rows now share the true transaction that proves them: canonical Earth
> → `home`; durable world or companion Rename → `namer`; successful Legendary-pair Breed →
> `bredlegend`; first settlement → `settle1`; player combat ending at 1–19 HP → `brink`; valid-world
> Share → `share`; accepted CF1 Follow → `wayfarer`; twelve source-derived Survey facts; source-
> proved `worm`/`quasar`/`dwarfg` travel; and explicit Atlas Favorite → `curator`. Accepted Follow
> composes its accepted route, `stats.jumps`, galaxy visit, `wayfarer`, and any proved galaxy-kind
> event inside the sharing receipt rather than opening a second travel write. Atlas Favorite mutates
> only the exact row's `fav` field in place, retaining its route sidecar. Each protects the 146-id
> capacity, preserves unknown ids and independently reprojects the committed catalogue before
> publication. Exactly `daily`, `decade`, `survivor`, `fieldmedic`, and `gambler` remain
> owner-blocked. Achievement/rank notifications are live through the postcommit-only ceremony above;
> no separate material reward is claimed.

> **2026-08-29 current local Starter Charter overlay:** `starter-charters.ts` owns the canonical
> five-link `trades` and five-link `tour` definitions, their authored counts/Stardust/fixed gear,
> one-link reveal, accept-to-activate rule and exact three-active cap. The board retains accepted
> rows plus the first incomplete row in each chain. `st-scan` remains visible/unavailable and blocks
> later newly revealed trades until its real bioscan owner exists; weekly rows are an explicit
> protected boundary, never rolled or paid. `st-conq` remains the verified combat owner's +25
> Stardust completion and retains its Jump Drive reveal lock.
>
> `commitStarterCharterAcceptV1` is a deterministic F4 product action with one receipt/CAS, no draw,
> retry or optimistic publication. It can complete an accepted state deed immediately only from
> exact existing evidence: non-canonical-Earth landing, positive Mine count, existing legacy Scout,
> a parseable legacy `conquered` row whose seed is not 133, Mercury/Mars/ice landing, or a canonical
> T2 component. Giant mines stay count-only and `st-scan` never auto-completes. New landfall/mining
> events carry the complete
> registered CF1 world address; Sol-tour filters require `isSolLandfallAddress` plus the authored
> seed/ordinal, and canonical Earth never proves `st-land`. Imported `surfSeen` seed fallbacks are
> compatibility-only already-proven evidence, not authority for new events.
>
> Permanent non-Training Landing stages `st-land`/Mercury/Mars/ice; Arc 3 Mine stages `st-mine` and
> giant progress; eligible fixed Fabrication stages `st-comp` from the canonical `comp` category;
> non-null Scout set/switch stages `st-scout` while stand-down does not; combat alone stages
> `st-conq`. `starter-charter-action.ts` composes each Charter/Arc 2 extension successor into the
> deed's existing writes, binds compact postcommit facts and never opens a duplicate progression
> transaction. Completion removes acceptance, appends permanent completion/progress, pays exact
> current/lifetime Stardust, raises `stats.charters` and refreshes aggregate achievements/best rank
> in that candidate.
>
> Fixed reward gear is Earpiece (`st-scan`, unavailable), Headlamp (`st-mercury`), Mag-Boots
> (`st-mars`), Meteorite Pendant (`st-giants`) and Field Leggings (`st-ice`). Each is a deterministic
> Arc 2 instance derived from Charter id plus receipt ordinal. An inventory grant auto-equips only
> when its slot is empty; full inventory creates a pending reward up to the exact 500-entry cap.
> Missing/future/corrupt Arc 2 state, pending-cap/revision exhaustion or numeric overflow refuses the
> entire successor, so
> no partial Stardust/gear result exists. Every writer verifies its owned Charter/reward/progression
> fields before targeted publication; stale/storage/refusal is unpublished and durable ambiguity
> reloads without retry. Only its committed delta may reach the ceremony seam above.

> **2026-08-29 current local Arc 5 companion overlay:** the compact manifest plus four fixed shards
> now backs four bounded player-live exact-instance writers. Feed consumes one exact flora specimen
> for one eligible owned fauna and advances bounded `fed`, with one settled synthesized expression.
> Breed selects two distinct exact fauna from bounded pages, evaluates the published legacy rarity
> plus lifetime-Stardust chance once, preserves both parents, creates one deterministic child on
> success, and assigns eight active-play Recovery minutes after success or two after failure; a
> successful child receives +2 XP and the first exact unordered parent-species pair adds +5, while
> the complete save also banks `c3-breed`. New firsts use a SHA-256 digest over sorted canonical
> `SpeciesId`s. An imported v1.8.9 `pair|<FNV32-base36>` alias derived from immutable
> `_earthName || speciesName(seed)` remains read-only already-paid evidence across both `xpf` and
> archived `xpa`; nickname/order cannot re-arm it and V2 never writes the alias. Rename changes only
> one stable instance nickname through the shipped sanitizer and 24-character cap. Field Scout
> changes only compact-v2 `scoutCreatureId` in ownership, allowing name/switch/stand-down without
> mutating genome, lineage, injury, Recovery, mission or bond state; a non-null set/switch may also
> carry the separate same-CAS Starter Charter successor described above.
>
> Main exposes those writers only from verified real-fauna Compendium detail state, binds exact
> generation/logical-id/context/source plus ownership revision/digest, claims the shared product
> coordinator, rechecks heartbeat/write holds and performs one receipt/exact-five/F4 CAS without
> retry or optimistic publication. Each path independently proves its committed fixed point and
> converges read-only by reload on durable ambiguity; detached Back/Close DOM cannot reacquire an
> outcome. Breed folds child XP, `xpf`, any required `xpa` overflow carrier, Charter and achievement
> changes into that same ownership receipt; failure or pre-draw capacity refusal changes no XP-first
> membership. Breed and Rename share the true `bredlegend` and `namer` achievement transactions, and
> durable Scout settlement queues the same coalesced Arc 9 refresh as other product owners. Wider
> tastes, care/bond, injury healing, Scout injury interception/+2 fresh-species XP, missions,
> friendly duels and the durable Expedition Chronicle/Museum remain open. The post-settlement Combat
> Chronicle is a separate live presentation described below.

> **2026-08-29 current local Arc 6 Guardian/Prime preservation overlay:**
> `@cf/domain-combatcore` owns registered canonical Guardian/Titan encounter identity plus the
> transcript-verified settlement plan. `@cf/domain-acquisition/guardian-acquisition-internal` owns
> the additive `cf-v2-guardian-acquisition-state/v1` catalogue/living-individual/provenance carrier;
> it requires a registered Arc 5 ownership parent and binds full CF1 world, defender/Signature,
> encounter digest and F4 receipt while preserving `_storeSpecies` deduplication and stripping only
> battlefield `_mult`/`_wf`. `@cf/domain-acquisition/guardian-companion-internal` separately owns
> `cf-v2-guardian-companion-state/v1`: an immutable acquisition-bound live/tombstone overlay for
> captured-Guardian combat XP and injury. `projectGuardianCompanionsV1` rebinds every overlay row to
> its exact acquisition source, retains acquisitions with no overlay as live, and cannot resurrect a
> tombstone. `@cf/persistence` stores the two authorities at
> `creatures/arc6.guardian-acquisitions` and `creatures/arc6.guardian-companions`, then joins them atomically with the selected champion successor,
> battle/conquest/loss-XP ledgers, compatible v4 Codex/conquest/Stardust fields, Guardian
> achievements, Prime claim and Frontier unlock. Verified player damage at 1–19 HP joins `brink`;
> an accepted one-time starter conquest Charter joins its +25 current/lifetime Stardust, honored-
> Charter increment and completion/removal. The verifier reloads and matches each exact fixed point
> before publication.
>
> Main now mounts a landed non-Training combat card with explorer/eligible-Arc-5-fauna plus live
> captured-Guardian/Titan champion choice,
> exact Titan/Guardian/strongest-fauna defender, deterministic 160-run forecast, stakes and supported
> rewards. It claims the shared product coordinator, settles/rechecks the heartbeat and exact
> encounter, invokes one combat CAS and independently verifies before publishing. Weekly conquest
> Charter lifecycle, authored Guardian loot and v2 post-construction conquest-affix coexistence are
> explicit open decisions, so none is fabricated by this live slice.
>
> `projectArc6CombatChampionRosterV1` joins registered Arc 5 living fauna with the separately-carried
> Guardian projection, omits tombstones and protects corrupt/detached rows or cross-carrier creature-
> ID collisions. A captured champion is projected as the existing `owned-fauna` settlement kind with
> `legacyBredLineage:false`, so the established forecast, Chronicle, registered combat-audio, win-XP and exact
> Guardian loss-XP bridge apply unchanged. `prepareGuardianCompanionCombatV1` writes only the overlay:
> XP/injury remain live rows, while fatal loss replaces the exact last-live row with an immutable
> receipt-bound tombstone. Reload, composite Compendium projection, boot, Training restore and Arc 4
> capture reconciliation retain the overlay and omit tombstones. The acquisition source and Prime
> claim remain independent; no Arc 5 ownership row, care/breeding/mission/Recovery field, party,
> tactics or retreat system is created.
>
> After exact durable verification, `combat-chronicle.ts` projects the registered settlement and
> matching `CombatCuePlanV1` into one accessible timed panel: named transcript rows, two native HP
> meters, deterministic statistics/result, silent Skip completion and plain-text Share with a visible
> selected-text fallback. Battle-log sharing has no progression owner. Each registered cue owns one
> exact visible-caption audio counterpart. The shared `tame-greeting-audio.ts` runtime may claim the session only
> from the trusted Challenge gesture plus exact committed non-converging outcome/cue plan, then
> `combat-gameplay-voice.ts` preserves deterministic legacy-shaped impact noise with only the
> registered critical/ability-proc layers and adds deterministic initiative, dodge, stun-skipped,
> burn, regeneration, defeat, resolution and Guardian/Titan entrance/phase/outcome gestures.
> Composite families share one voice. Playback uses the combat/gameplay bus and master Sound, not
> Creature Voices, with at most two active combat voices. Skip/Close/replace, hidden/unanswerable state,
> route/counterpart drift, Sound Off, context loss and disposal cancel the session. Skip never plays
> unrendered remainder or result cues; no authored/recorded combat assets, ambience or music are implied.

> **Historical signed universe-polish + bounded Arc 5 Feed automated certificate (2026-08-29):** exact
> signed source `3f69e88ea8e34fdb8d9913276601b426ada783ae` (tree
> `df10355a81c21fc6a553c7fa5684b08399bce6d8`, parent `916d921ebf78…`) stayed committed, clean
> and unchanged through one serial **Layout → SceneMemory → Compendium → Slice → Glass →
> Recovery** campaign on Edge `151.0.4129.107` / CDP `1.3`. Layout passed 787/787 in 76,603 ms;
> SceneMemory input-v4 passed 44/44 in 10,561 ms; Compendium passed 78/78 in 46,239 ms with all
> six review-image bindings; Slice passed in 434,263 ms with zero findings and ten screenshots
> (`33aa30b3…`); Glass consumed that exact Slice and passed all 12 viewport classes in 85,823 ms
> with zero findings or instrument failures (`2a67a258…`); Recovery consumed both exact
> predecessors and passed all ten stages in 1,290,953 ms with a real uninterrupted 1,200,297.5 ms
> active-browser observation (`b78e8a52…`). Every stage ran once with zero automatic retries and
> passed its exact source/predecessor-bound verifier. At that checkpoint, the full v2 battery was
> 163 files / 1,712 passed + one skipped, and all TypeScript configurations were green.
>
> For that exact source, this is the complete historical automated certificate for the universe-wide visual treatment and
> bounded Arc 5 Feed scope. It is not HUMAN visual, listening, screen-reader or first-journey
> judgment; physical-device heat/battery/true-GPU evidence, Gate G distant playback and D-9e remain
> open, as do whole Gates A–I. It grants no hosted attempt, merge, release/version or deployment
> authority. Exact carriers, sizes and hashes are preserved in `audits/README.md`. Edge point
> version is provenance only; compatible updates never trigger rebaseline or recalibration.
> Earlier Final13/Final12/Final11/Final10 wording below is historical where superseded.

> **Earlier local Arc 4 Charter checkpoint (2026-08-29; not part of `3f69e88…`, predecessor to the
> PR #35 lifecycle repair below):** the capture
> capacity certificate now stages one `c2-scan` tick only in successful scenarios whose exact
> registered CF1 world has no prior world-provenance discovery, is beyond the exact Sol hierarchy,
> is reachable from owned systems and remains within the current/future Chapter 2 goal boundary.
> That Charter successor shares the complete pre-draw save, F4 authority, ownership/reward, receipt,
> revision and fenced F3 CAS. The committed verifier checks the exact progress delta before targeted
> publication of cloned `ascProg`; misses, Sol, repeat worlds, unreachable/past-chapter sources,
> saturation, stale/failed writes and post-durable convergence cannot mint another tick or reroll.
> The existing ownership ledger supplies canonical world uniqueness, so no new schema is added.
> Capture and Search travel now evaluate reach against exact galaxy/star parent coordinates plus
> seeds; colliding leaves under a different parent cannot inherit Sol or home-galaxy reach. A
> successful capture that does not bank a bioscan cannot reconcile Charter chapters.
>
> This is a documented v2 semantics deviation: capture success replaces v1.8.9's separate Discover
> Life interaction for this one Chapter deed, while exact Sol exclusion makes the “alien worlds”
> copy literal. The legacy survey/Records ledger and `stats.surveys` do not change, and the separate
> interaction plus accepted/weekly bioscan systems remain unavailable. At that checkpoint focused
> and full browser-free tests were green at 233 files / 2,333 passed + one skipped; fresh clean browser
> evidence and HUMAN acceptance remain open, with no hosted/release/
> version/deployment authority.

> **Arc 0 action/checkpoint closure (current local worktree, 2026-08-29):** receipt-bearing Land,
> canonical world naming and Atlas operations own their complete product successors. The generic
> receipt-free route/epoch checkpoint starts only from `F4RuntimeAuthority.checkpointParent()` and
> projects its limited fields into a detached candidate; it never overlays live identity, Charter,
> Atlas, naming, Inventory, capture or progression state. Training replacement/quarantine write-hold
> is checked both before and after an action heartbeat. An Atlas `already-durable` observation binds
> its exact existing row back into the app's private source-proven route `WeakMap`, or latches a
> read-only convergence reload if that sidecar cannot be restored. No action retries or optimistically
> republishes durable state. The one-call Survey → Landing API additionally drains the route's
> current persistence barrier, starts Survey exactly once, drains Survey's replacement barrier,
> requires that exact settlement to return true and invokes Land exactly once. A synchronous
> refusal or later durable false stops before Land. The pure choreography helper owns no save,
> clock, route or retry policy.

> **PR #35 permanent lifecycle overlay (current local repair, 2026-08-29):** the consumed one-time/
> no-retry `test-battery` run `33278630671` tested exact pushed head `017fa6d…` against base
> `7a9f4c1…`. Its browser-free/static predecessors were green; SceneMemory stopped on the phone
> profile because real Earth planetfall returned false, and its desktop leg plus every later browser
> stage were correctly skipped. The run remains immutable red and consumes its exact authorization.
> No replacement hosted attempt is authorized.
>
> Two systemic repairs close the actual product path. The Survey → Landing barrier choreography is
> the exact one-call ordering described above. At the deterministic transaction boundary,
> `outcome-transaction.ts` detaches its content registry when the F4 owner is created, validates the
> injected codec clock exactly once per commit, and gives the derive callback an owner-minted
> `canonicalizeState` bound to that same registry and clock. Product derivations still submit their
> raw state to the persistence owner; every full-state expected successor is independently retained
> in canonical form for postcommit comparison. Arc 3 likewise canonicalizes its retained owned-state
> expectation while preserving the exact owned extension derivation. This prevents veteran
> compatibility timestamp floors from turning a correct durable successor into a false mismatch.
>
> The exact-build PWA repair propagates the parent's selected build to valid worker/shared-worker
> `resultingClientId`s and retains all client types with `clients.get()` confirmation before pin
> pruning. SceneMemory binds Land and its bounded witness in one browser task, requires no scheduled
> convergence before Surface observation, fails fast on coherent cause-bearing vista diagnostics,
> and uses a separate-origin BFCache helper beyond the product worker's interception scope. These
> changes retain the **44-outcome** ruler, every numeric ceiling and all immutable historical
> evidence, including exact signed `3f69e88…`.
>
> The current local browser-resource successor treats hidden UI as non-ownership. When its source
> route is invalid, Survey clears controller models, fences, route references, listeners and DOM;
> same-system Surface/orbit retention remains source-proven. Compendium audition/breed/feed/rename/
> scout, Capture, Combat and ecology-audio controllers install listeners only while attached and
> detach idempotently. `panels.ts` owns one delegated capture listener for opener focus plus one
> delegated bubble listener for opener toggle, replacing per-opener closures. Guide and release
> archives load through dynamic imports: lightweight `release-identity.ts` remains eager, while
> Guide/release content publishes only for the current request generation and still-visible panel;
> loading, failure and retry states are explicit, and a cached import still crosses a microtask so
> `openPanel()` visibility has settled before publication.
>
> `species-art-loader.ts` preserves each worker's validated immutable PNG data URL as protocol
> evidence, but converts a settled 132px thumbnail to a window-owned Blob URL before handing it to
> `SpeciesArtBroker`; 440px portraits remain data URLs. The broker's `disposeAsset` boundary owns
> revocation for invalid, oversize, dropped-consumer, duplicate, evicted, protocol-mismatched, late-
> generation and final-dispose results. Live leases make cached thumbnails ineligible for eviction.
> `releaseUnownedCachedArt({ retainRecentThumbEntries: 17 })` idempotently removes portraits and all
> excess unleased thumbnails while retaining the exact phone/desktop route working set; BFCache
> suspends producer work but preserves the live document's bounded cache. The earlier dirty-only
> diagnosis has been superseded as current status by signed source
> `2046000873f98318c767db53d2ffb2abac71cc94`: its one-attempt/no-retry SceneMemory run
> `20260830-pr35-fixed-second-2046000-scenemem-certification` passed all 44/44 outcomes plus named
> verification. The immediately following one-attempt/no-retry Compendium run
> `20260830-pr35-2046000-compendium-certification` preserved 76/78; only phone/desktop
> `warm-precondition` were red because the truthful plateau was eight live Planetside leases plus 17
> unleased warm entries, 25 total, rather than the obsolete 96/256 capacity-fill assumption.
>
> Signed child `3fb958f859ff0ea28b4e8bb720adaea98ad3c001` then supplied one no-retry attempt
> `20260830-pr35-quiescent-3fb958f-compendium-certification`. It stopped terminal
> `instrument-fail` at phone Planetside settlement after 32,946 ms on Edge `152.0.4191.53` / CDP
> `1.3`: 585 ledger observations included 577 on-time value observations plus timely heartbeats, but
> the old collector returned generic `null`. All 78 outcomes were consequently blocked; only one
> partial phone profile exists, with no desktop profile and no outcome/review PNGs. No successor ran.
> This adjudicates the instrument only—not product behavior, Edge compatibility or numeric rulers.
> Signed implementation `3eefbbcf…` supplied the structured instrument; its exact successor source
> `b2eecfbd…` then stopped instrument-only after 33,041 ms because a generic 512-character projector
> nullified eight real 766–779-character `visualKey` identities despite ready decoded 132×132 images.
> Historical signed implementation `d9d79025…` repaired only that evidence projection and was browser-free green
> at 565 selftest controls, focused 35/35, 237 files / 2,413 passed + one skipped, all three TypeScript
> programs and the producer-authority printer with both budget matches true. Its exact 85-phase
> history plus observation-v2 identity evidence was not browser-certified at that boundary. Later exact signed
> `941ba45…` passed Compendium 78/78 before its exact-source Slice successor stopped red; Glass and Recovery did
> not run. The changed head still requires a fresh clean exact-source browser chain.
>
> `port/v2/tools/tracked-input-preflight.mjs` is the mandatory preauthorization rehearsal. From a
> clean committed candidate it exports only the exact Git index, installs inside an owned temporary
> snapshot and executes the exact ordered hosted browser-free/static command block. It rejects
> forgotten source-owned untracked/ignored tests, excludes dependency-owned `node_modules` tests,
> and rechecks HEAD plus tracked state before terminal PASS. Both
> guarded workflows run its mutation-sensitive selftest immediately after v2 installation. The
> earlier static repair also clears four `artunused` findings hidden behind its consumed stop and
> remains the hermetic browser-free preauthorization boundary. At that historical boundary, signed implementation
> `d9d79025…` gave the instrument-only repair exact-source authority and browser-free local closure.
> Neither repair is a hosted green, browser
> certificate, HUMAN judgment, merge, release,
> version bump or deployment authority.

> A complete technical reference for the game, written so any future session can pick up
> full context without re-reading the source. When in doubt, source wins. The long-form
> sections below mirror the legacy v1 architecture; dated overlays record current port/v2
> boundaries until the port replaces those sections completely.
> **Current port/v2 reference overlay matches certified source `580c99a…` and its evidence/docs
> descendant as of 2026-08-31.**
> Historical browser claims remain bound only to their named signed sources, including `3f69e88…` and
> exact `941ba45…`: the latter passed Compendium 78/78 before its exact-source Slice successor stopped
> red, so Glass and Recovery did not run. At that historical boundary the changed head had no complete browser certificate.
>
> **Historical 2026-08-28 Final10 offline-reopened oracle stop (superseded by Final11 above):**
> signed clean source `4405fb2b4ba7ef6898eb334330d7ef4300b5266c` supplied Layout
> 787/787, source-bound SceneMemory 42/42, source-bound Compendium 78/78 with six PNG bindings,
> Slice PASS with zero findings and ten screenshots, and full 12-viewport Glass PASS with zero
> findings or instrument failures. Every predecessor ran once and passed its named verifier.
> Recovery then ran once and stopped terminal `instrument-fail` at `offline-reopened` after
> 110,549 ms. Fixture, the complete 16-attempt burn-down, exhausted disabled suppression,
> close/checkpoint and closed/offline proof passed; cleanup passed with zero retry. The real
> 20-minute active observation, boundary crossing and recovered stages did not run. Final10
> therefore makes no offline durable-parity, Recovery product-layout, 20-minute recovery or
> recovered-state claim.
>
> Post-run review separated one Compendium product root (a floated 44px Close plus cleared heading
> spent an unintended header row) and two narrow-phone Inventory product defects (copy starved
> beside the badge column) from two hostile-row Compendium oracle artifacts (overscan-only mount
> counted as geometry) and four Settings oracle artifacts (individually reachable controls were
> incorrectly required to remain simultaneously reachable). The bounded Final8/Final9/Final10 predecessors
> certify the repair that removes the extra Compendium row, reflows `<=360px` Inventory rows without hiding exact
> identity/state/action content, and makes each Settings control own its isolated reveal, two-sample
> settlement, centre-hit/native-receipt proof and exact scroll restoration. Numeric rulers, browser
> authority, retry policy and release identity are unchanged. Final9's old exhausted-control oracle
> sampled a semantically disabled 292x44 Tame button before revealing it inside the clipped Survey
> scrollport, collapsed geometry and hit ownership into one `ok` bit and retained no actual hit
> owner. Unchanged-source Glass independently revealed the same control class and proved its
> containment/ownership at the same phone viewport; Slice passed its native disabled-suppression
> path. This diagnoses an instrument defect without granting a Recovery product verdict and remains
> preserved as prior chronology.
>
> Final10 signed that shared disabled-suppression successor, then exposed the next instrument seam.
> Its reopened document was deliberately read-only/ineligible and truthfully rendered an exhausted
> 16/16/0 cycle-0 budget with Tame, Scavenge and Sample all `unavailable`, model-disabled, natively
> disabled and aria-disabled. The phase-blind poll accepted only active `empty`/`depleted` rows, so
> it rejected the coherent offline surface. Its terminal `last:null` is the unmatched poll; the
> retained non-null `observed` receipt proves the actual same-document UI → state sample. This is a
> semantic/status-oracle defect, not demonstrated product loss.
>
> Slice and Recovery retain the same exact disabled-suppression receipt.
> It quiesces the complete in-flight heartbeat cycle, captures a synchronized raw → state → UI
> exhausted baseline, then retains initial plus two settled post-reveal target samples, exact
> button/card/viewport/scroll/hit/document identity, bound native dispatch and one trusted pointer,
> full protected before/after state and replayable cleanup. Its exact quiesce/resume receipts bind
> the document and timer states; stable lease-read, revision-read and lease-heartbeat counters prove
> that neither the normal heartbeat nor its checkpoint overlaps the observation. Cleanup integrity
> and target-instrument truth are judged before any product suppression verdict. Recovery seals its
> preparation/collector/verdict source at SHA-256
> `22e8704122103323d0dd0079ce0d2821d69f249a860f31e4062f51b9f8e68771`; Slice seals its
> preparation/collector source at
> `baa284a736d9243df4a61de192e553111c9c5fbc9d6aa70ffd05af5b6e31e45f`.
>
> The signed Final10 successor repair added disjoint `ready-visible`, active
> `exhausted-visible` (`empty`/`depleted`) and read-only `exhausted-offline` (`unavailable` plus the
> save-authority explanation) predicates. The offline proof reads raw then consumes UI and state
> from one returned same-document surface, requiring UI → state chronology, nondecreasing active
> time, and the same revision/SessionRNG tuple. Reactivation must show authority, become writable and
> focused, run a full heartbeat refresh, and reproduce the original active exhausted facts before
> the observer arms. Sampler/witness corruption is instrument-red; a coherent stable phase mismatch
> is product-red. A candidate PASS retains schema-bound full Pertar receipts for the original active-
> exhausted, offline-reopened and reactivated active-exhausted surfaces. Terminal finalization and
> named verification independently replay and cross-bind phase, document, cycle, facts, SessionRNG,
> state/UI and the first active sample. Before observation, `active-observation:running` is persisted
> and must survive later failure. Each Pertar wait receipts the strict remaining share of one
> absolute 20-second deadline; clipping or exceeding it is red. The exhausted raw/live-state chain
> and reactivated→first-service binding require at most 20 seconds, the same cycle/RNG and revision
> delta at most one. Missing, swapped, coherently retokened, reversed or coherently recomputed route/
> card/runtime/pending evidence is red, as are internally assessment-green retiming, +2-revision and
> next-cycle mutants.
>
> The final Recovery seal inventory is exactly six SHA-256/UTF-8-byte regions: full collector
> source `c1b4798eb21bad961d1dd984b515ca1cc884101ce28405c09613c1e361118f84` (217,578 B); production
> boundary `a96138cc33ace145c77e64de584f4062d0860d4e418c8d3c19d06a1293db56be` (91,758 B); dedicated
> helper→assessment→wait span `f568a7bb95a49d7dfb9839d2d11cc68743f87cf3af6eb52776f5551dba0e6045`
> (10,442 B); phase assessment `c5a76e70c096a33df9bc12ba9a044c7d7bfddc1dc082d61e8365f5d7c99b35f5`
> (6,184 B); offline-reopened→reactivated phase span
> `b661d676f1679e9fc92590bf7849ee319ea0b8c78f444a91f46b06eccff29b6e` (7,125 B); and disabled-
> suppression preparation/collector
> `22e8704122103323d0dd0079ce0d2821d69f249a860f31e4062f51b9f8e68771` (13,190 B). The whole-
> production seal rejects a dead-wrapped or comment-shadowed sole operative span; the full-collector
> seal rejects late reassignment of the phase helpers.
>
> Browser-free current-byte checks at locally signed implementation/evidence commit
> `3fbfcd5eba3d39e46a3e3e954e6eb5134a5f698e` (verified embedded SSH signature; parent Final10
> `4405fb2…`) are 138 Vitest files / 1,494 passed / one skip, typecheck, `artunused`, focused Recovery
> 5/5, Recovery selftest, root validate at 1,010 renders / 50 probes and independent review CLEAR.
> Those documentation bytes changed source identity; their signed clean docs-only descendant
> supplied immutable Final11. Its stored failure remains intact and its repaired bundle replay is
> green. Immutable Final12, preserved at signed evidence checkpoint `2bf99bd…`, then passed Layout,
> SceneMemory and Compendium before Slice stopped once/no retry: the product assessment was wholly
> green, but the strengthened authority mutant correctly returned two red clauses while its wrapper
> expected one. Glass/Recovery did not run. Signed repair `5ab4d3e…` fixed only that harness
> expectation. Exact signed Final13 source `7cb0969…` then completed the full once-only chain from
> Layout through Recovery with every named verifier green and no retries/findings/instrument
> failures. Edge `151.0.4129.107` / CDP `1.3`
> is provenance only: a compatible point update never triggers a rebaseline, recalibration or
> threshold change. That exact-source local Recovery certificate grants no whole-Gate, hosted,
> HUMAN or release authority.
>
> **2026-08-29 current local visual implementation boundary:** the universe-wide treatment is now
> wired through the active v2 routes. `@cf/art/visual-treatment` defines exact finite appearance
> scopes/axes; `canvas-treatment.ts` applies a single surface-space `source-atop` warm/cool depth
> field; and `surface-polish.ts` owns once-per-surface finishers for galaxy, system, planet, biome and
> species canvases. `index.ts`, the lifted thumbnail finishers, scene-local decorators, production/
> worker/audit species routes and planet sprites all consume those owners. Existing painters retain
> sole geometry and seed authority, alpha silhouettes are preserved, and semantic masks/identity-
> black occluders remain explicit raw exceptions. `shipyard-preview.ts` applies the same material/
> light language as deterministic SVG while keeping its four hull paths and exact optional hardpoint
> geometry unchanged.
>
> `@cf/domain-biome-profile` is the dependency-neutral exact recursively frozen authority for all 43
> live keys and their authored signature, fauna/flora-family, hazard and weather records. Schema
> `cf.domain.biome-profile.v1` and digest `bpd1-6fce883d4d70e3b6bde0fb184b416e8e` bind that content;
> art's `biome-visual-profile.ts` is a compatibility re-export rather than a second table.
> `world-roster.ts` publishes schema/digest/key and one environment fingerprint over the exact world,
> ecology epoch, biosphere and climate. `biome-vista.ts` exposes the
> preserved complete `960×430` generic, gas-deck, abyss and reef compositors. The normal landing
> route projects only from an exact proven world plus matching canonical roster, separating land,
> aquatic, aerial and ground-flora evidence without a Sol/leaf-seed shortcut. `biome-vista.worker.ts`
> renders lazily with OffscreenCanvas; its protocol rejects inexact scene options and result identity/
> dimensions. Main validates the exact product render envelope before `postMessage`, fences stale
> work with the exact document token, generation, world key, environment fingerprint, profile schema
> and profile digest authority, then separately requires the exact scene and biome key. It owns a 12-second
> deadline, and publishes only after successful copy/mount into a one-entry fail-soft cache. Any
> worker/protocol/copy/mount failure records one bounded cause in scene diagnostics and leaves the
> already complete globe usable. Portrait layout fits
> the entire source as a horizon band above the globe; landscape/desktop centers it without crop.
>
> `visual-effect-policy.ts` and `camera-shake-policy.ts` now consume the persisted **Visual effects**,
> **Screen shake** and Motion settings. Effects Off resolves to zero optional particles/no animated
> emissive modulation while retaining seeded base star/quasar glow; reduced
> motion and low-tier devices resolve to bounded static decoration; full-motion medium/high tiers
> permit bounded animated particles/bloom. Camera shake requires all three consent gates, caps
> concurrent impulses by device tier and cancels them when the policy becomes ineligible. Diagnostics expose the
> resolved policies and active count; none of these presentation choices enters generation or
> gameplay geometry.
>
> Exact browser-free coverage lives in the art `visual-authorities`, `canvas-treatment`,
> `surface-polish`, `planet-sprite-finisher`, `speciesportable`, `biome-vista` and
> `biome-vista-ecology` suites plus app `biome-vista-surface`, `biome-vista-protocol`,
> `biome-vista-cache`, `universe-polish-main-wiring`, `visual-effect-policy`,
> `camera-shake-policy`, `visual-policy-main-wiring`, `shipyard-preview` and
> `art-tools-browser-resolution`. Their controls cover exact-set/field/identity mismatches,
> disconnected finishers, changed compositor routes, stale/faulted cache publication, cropped phone
> layout, policy bypasses and hard-coded browser paths. Raw-CDP art tools share
> `tools/browserpath.mjs`; explicit `CF_BROWSER` fails closed. Before evidence, each of the seven
> migrated tools requires connected `Browser.getVersion` to identify Chrome, Chromium, Edge (`Edg`)
> or HeadlessChrome with a complete four-part version, executable/product/revision/UA/JS provenance
> and CDP `1.3`, then emits that exact tuple. Compatible point versions are accepted and never
> baseline selectors.
>
> The current SceneMemory input-v6 contract retains **44 outcomes**: the historical 42 scene/resource
> outcomes plus one phone and one desktop `surface-vista-lifecycle` outcome. Each binds the raw
> `surfaceVistaWorkerActive`, `surfaceVistaMounted`, `surfaceVistaCacheEntries` and
> `surfaceVistaCachePixels` diagnostics through cold zero, first mount, repeated surface/ascent,
> BFCache and reload-clear/replacement cleanup, with the semantic cache ceiling fixed at one entry /
> 412,800 pixels. The heap admission retains 12 MiB initial-V8 / 18 MiB initial-aggregate safety,
> then caps `max(0, point.usedSize - initial.usedSize)` at 6 MiB and that growth plus embedder plus
> backing storage at 12 MiB. Raw totals remain diagnostic; warm aggregate range/slope and every
> non-heap ruler are unchanged. The current collector captures Land's result plus bounded route, persistence and
> landing evidence in one CDP evaluation, requires accepted Surface state with no scheduled
> convergence reload, and retains full settlement diagnostics on every poll. Coherent vista fault
> diagnostics, including the bounded last cause, are terminal immediately rather than degrading
> into a 30-second timeout. The BFCache away document is served from a separate loopback origin,
> outside the product service worker's scope, and its owner stays live until the history return is
> requested. Browser-free contract/budget/tool controls retain missing-field,
> vacuous-zero, worker/mount leak, cache overflow and retained-on-reload mutations. Exact signed
> Historical input-v3/verdict-v2 and input-v4/verdict-v3 reports replay under their original raw
> semantics; current terminal verification requires input-v6/verdict-v5. Exact signed historical
> source `3f69e88…` run `20260829-universe-polish-3f69e88ea8e3-scenemem` passed input-v4 44/44 in 10,561 ms with
> complete cleanup inside that historical serial certificate. Every 42/42 statement below remains bound
> to its historical source and schema.
>
> Exact signed source `3f69e88…` retains its complete historical exact-source automated certificate: Layout 787/787,
> SceneMemory input-v4 44/44, Compendium 78/78, zero-finding Slice, 12-viewport zero-finding Glass
> and ten-stage Recovery with a real 1,200,297.5 ms active-browser observation, all once/no-retry and
> exact source/predecessor-bound verified. That certificate is limited to the universe-wide visual
> treatment and bounded Arc 5 Feed scope. Fixed-seed review images do not substitute for HUMAN phone/
> desktop visual, listening, screen-reader or first-journey judgment; physical-device frame-time,
> heat, battery and true GPU/resource measurements, Gate G distant playback, D-9e and whole Gates
> A–I remain open. No hosted, merge, release/version or deployment authority follows.
>
> **2026-08-27 Final4 Glass repair overlay — historical pre-Final5 source:** signed clean source
> `041d1cfdff28c4217d699bdb26eacd5f792f7a80` supplied fresh named Layout 787/787,
> SceneMemory 42/42, Compendium 78/78 and a ten-screenshot Slice PASS on one unchanged source.
> Full Glass then ran once, stopped `instrument-fail`, preserved its report and did not start
> recovery. Diagnosis separated stale or contaminated evidence from two product presentation
> defects. Glass now waits for post-render settlement before geometry, gives every scoped control
> its own native `elementFromPoint` hit-owner proof, and restores every touched scroller to its exact
> prior position in `finally`. Survey title semantics require nonempty content, so valid four-character
> **Mars** passes while an empty title is the negative control. The source-independent Engineering
> oracle remains separate from production but now classifies all current live `contact` consumers
> (`earpiece`, `diplobeacon`, `rl-mind`) as connected, with a live-mapping mutation control.
>
> Product presentation keeps the canonical Exotic foreground `#9A5CFF` and places written rarity
> tokens from Survey, Compendium and owned/non-missing Binder slots on the shared opaque `#05070d`
> badge, yielding effective text contrast of at least 4.5:1 across supported glass. Missing Binder
> slots retain their missing-state surface. Panels reserve a 58px right gutter, translate their 44px Close owner by
> 44px into it, and clear headings below the floated header geometry; neighboring controls and focus
> can no longer occupy the sticky Close hit target. Removal controls independently recreate the
> transparent-rarity contrast failure and the laptop Settings overlap. These repairs change no
> deterministic rarity value, save shape, memory ruler, browser-version authority, release identity
> or production boundary. A new signed clean source and a fresh fail-fast chain from Layout remain
> required before certification.
>
> **2026-08-27 producer-binding checkpoint foundation — signed second harness repair, final3 Layout green,
> SceneMemory instrument stop preserved, and live producer binding repair reviewed for the signed
> final4 checkpoint:**
> signed source `5ddddbfb79ea984d44c86e2107e5e4013f84f1b3` passed final3 Layout 787/787
> across ten viewports plus named verification. SceneMemory then ran once and stopped
> `instrument-fail` before measurement because only live `buildDist` and `gameMain` bindings were
> stale; current-byte derivation also found Compendium measurement current but its built index/owner
> producer stale. Compendium and all later stages correctly did not run. The bounded repair rebinds
> only those live producer records, preserves historical rulers/samples and every numeric ceiling,
> and makes ordinary `npm test` compare both budgets to independently built current bytes with
> directional mutants. The full repair battery is green at 135 Vitest files /1,478 passed /one
> intentional skip, all TypeScript/no-unused programs, the 887-module build, authority printer and
> root validator. Three independent final binding/test, whole-diff, and documentation/evidence
> reviews are CLEAR. The signed clean commit containing this record owns final4 from Layout. Gate B's
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
> `progression.xp-firsts` overflow authority without rearming an award. Arc 5 Breed uses that strict
> union for canonical pair-first XP, including read-only recognition of imported v1 pair aliases;
> malformed or one-sided evidence protects before its one draw.
>
> `packages/persistence/src/world-identity.ts` now owns current landing/name identity in
> `catalog/world.identity.manifest` plus exactly four `catalog/world.identity.shard.N` carriers.
> Rows bind a complete registered CF1 galaxy/star/planet address, landing flag and optional name;
> the v4 leaf-seed arrays remain compatibility mirrors only. Reads require the exact manifest,
> source-reproof and canonical re-encode. Explicit code-unit ordering and deterministic greedy
> byte-load balancing keep up to 9,000 records /5,000 names within the real carrier limits, and
> every mutation applies candidate writes against all current extensions before publication.
> Ambiguous v4 collisions retain one unresolved count/name without presenting either world; the
> first exact encounter consumes that fact without a duplicate first-landing reward. Main wires
> the owner through Search naming, Land, Atlas, share copy, rarity, Records, boot and Training.
>
> Legacy last-known-good promotion and backup recovery are single atomic
> `compareAndApply` operations, not read-then-write repairs. Promotion requires the exact primary
> bytes and absence of both `f3:revision` and `f3:lease:active-play`. Recovery first validates the
> exact backup, then its one CAS requires the same invalid primary bytes, the same backup bytes and
> absence of those two v5 authority keys. A changed primary, changed backup, revision, or lease wins
> the race without a legacy write; once v5 authority exists, legacy promotion/recovery is retired
> and cannot roll the save backward.
>
> F4 lease failure is fail-closed. An acquire storage failure grants no lease and accrues no active
> time; a renew storage failure settles only the already-earned interval, revokes the local grant and
> stops further accrual. After acquisition, either a revision mismatch or a revision-read failure
> enters transient protection and schedules one read-only convergence reload: answerability,
> heartbeat, mutations and audio stop, release/disposal failures are aggregated into diagnostics,
> and the same document never automatically reacquires. The release witness requires zero lease
> reads when stale authority already lost its grant and exactly one repository read when owned
> publication authority releases its grant. The browser-only v4 staging hook cancels an unstarted
> debounce, blocks new writes, joins the exact active persist, releases authority and atomically
> clears/stages the isolated stores. Every direct primary, backup and absent-primary fixture retains
> an exact receipt even when staging rejects. A live held-writer control observes the page-owned
> protected hold under a bounded deadline, keeps staging pending while a competing persist settles
> false, and then requires the released writer's safe exact +1 committed revision plus exact staged
> bytes. This prevents predecessor state from masquerading as product evidence. The app-owned
> `apps/game/src/f4-convergence-latch.ts` latches the hold and schedules exactly one replacement
> before invoking the fallible presentation repaint. If full Engineering is open, that transition
> immediately demotes it to one capability-derived preview, an exact unavailable reason and zero
> sections/actions with app, DOM and outer/inner diagnostic key parity and unchanged durable bytes.
> Repaint/diagnostic failure is retained in the convergence witness and cannot cancel cleanup or
> reload. While protected, all nine Settings controls
> (Sound, Volume, Creature voices, Text size, Text tone, Font, Star charts, Motion and Panel tint)
> plus Restart Training and lesson actions are read-only. The former **Bring expedition** exception
> no longer exists: the save-import door was removed on 2026-09-05 (v2 starts every explorer fresh),
> so a protected reload is the only recovery path. The evidence-build `importBlob` seam still
> validates a complete candidate, must claim versioned persistence authority, refuses with zero
> writes if that authority is unavailable, and on success performs one exclusive whole-save
> replacement followed by reload; it grants no authority for ordinary protected-state mutations.
>
> Engineering presentation now publishes one atomic `{ship, engineering, reason}` view. The ship is
> the same capability/reach projection consumed by travel and remains valid when Arc 3 is protected
> or F4 is read-only. Those states therefore retain exactly one read-only SVG preview and installed-
> system inspection while rendering an explicit unavailable reason and zero Mining, Skimming,
> Research or Fabricator controls. A full Engineering view must carry the exact same ship key or is
> rejected before paint. Diagnostics publish a preview key only when the live owner and exact-one
> DOM carrier agree; missing, forged or duplicate carriers remain red and close/replacement disposes
> all preview ownership.
>
> This split was exposed by named SceneMemory run `20260827-phase4-final-scenemem` on signed
> predecessor `bb5dc7c7f4372f712778af67ace2b5f81b71b99d`: Edge `151.0.4129.107` ran once with zero
> retries and complete cleanup, then stopped after 33,181 ms on the phone Shipyard preview. The
> immutable veteran carrier remains unchanged; SceneMemory derives the Arc 1C resource input by
> changing only its existing `view` field to `null` and preserving every other field. Its orphan
> seed-201 Mine facts correctly protect Arc 3 but do not invalidate the independent preview. The
> protected-preview product/diagnostic repair preserves
> a structured last observation plus named field reasons instead of `last:null`, without adding Arc
> 3 loaded authority to PASS or changing its timeout, ruler or version-tolerant browser authority.
> The timeout was not a performance/deadline defect and is no reason to lengthen the allowance.
> The preserved carrier and exact raw/gzip hashes are inventoried in `audits/README.md`. Compendium,
> Slice, Glass and recovery did not run after this red; at that boundary a new signed successor
> campaign was required.
>
> Signed successor `862a75b316142348636abea442dab15e87393642` passed named Layout
> `20260827-phase4-successor-layout` 787/787 across all ten viewports and exact-run verification.
> Its next one-attempt/zero-retry SceneMemory stage,
> `20260827-phase4-successor-scenemem`, completed cleanup on Edge `151.0.4129.107` / CDP `1.3`
> and stopped the serial chain at 40/42. Only phone/desktop `heap-dom-budget` failed: phone maxima
> were 11,580,536 V8 heap bytes, 17,758,550 aggregate heap bytes, 898 nodes and 90 JavaScript
> listeners; desktop maxima were 11,635,116, 17,687,678, 895 and 89. Warm range/slope,
> answerability, resource ownership, registry, same-document and cleanup outcomes were green.
> The exact carrier is
> `audits/ARC1C_SCENEMEM_CURRENT_INPUT_FAILURE_20260827_163818607.json.gz`; raw/gzip SHA-256 are
> `3197ca65a1011bf386067d73515a0bcefd17ab91752a2d9d36af5e5dd055dfd7` /
> `dc6c149341323912f410bd32498cf4eec3128b5f13f2bbad16ba3a72f495cb47`. It remains the paired
> broken baseline, not a green result or calibration sample.
>
> Static ownership separated the avoidable closed shell from fixed product growth. Production
> Inventory now retains inventory/filter/page state while closed but unmounts its row tree and six
> open-lifetime subscriptions; a late committed action updates authoritative state without rebuilding
> hidden rows, and disposal cannot reacquire through a stale registration. All registered panel
> openers share one delegated focus-capture owner that preserves the exact nested-click opener.
> SceneMemory now diagnoses each breached field with its observed value and ceiling while retaining
> the prior acceptance of valid zero-valued heap components. Dirty, deliberately non-certifying
> diagnostic `20260827165427809-91398-352d7132df` reduced nodes to 676/673 and listeners to 71/70,
> below the unchanged 704/80 ceilings; it is diagnosis only, never a candidate or certificate. V8
> and aggregate heap remained at the larger fixed Arc 2–5/F4 product level. Signed repair source
> `6c9ad85577bd90d6af883dd7b3f13556d24eb3ad` (tree
> `a389646081f9fb5246825d1ac187eeb06504a8e4`) then supplied exactly
> `20260827-phase4-repair-candidate1`, `20260827-phase4-repair-candidate2`, and
> `20260827-phase4-repair-candidate3`. Each ran once with zero retries and complete browser/server/
> workspace-lock cleanup on Edge `.107` / CDP `1.3`. Across the three, V8 maxima were 11,566,152
> phone and 11,630,936 desktop bytes; aggregate maxima were 17,681,258 and 17,636,682; nodes and
> listeners remained 676/71 and 673/70. Signed activation
> `4a54c0d7473a5cec2c155be2cf8eb57e6fd28a93` (tree
> `ff11158ac2ccc214490f6f3289d4a7a3660138e6`, parent `6c9ad855…`) changes only V8 to 12 MiB
> (`12,582,912`) and aggregate heap to 18 MiB (`18,874,368`), for exact phone/desktop headroom of
> 1,016,760 / 951,976 V8 bytes and 1,193,110 / 1,237,686 aggregate bytes. Every other ceiling stays
> unchanged, and paired red `862a75b…` remains red on its node/listener excess. Edge `.107` is
> provenance only: a compatible point update never starts calibration, rebaselines a ruler or moves
> a threshold.
>
> Signed evidence boundary `7362a0ea32e90b24e4988c81d566b82e20549e66` (tree
> `711573279cbf8debbed7e67847016885e5647527`) supplied standalone SceneMemory
> `20260827-phase4-activation-scenemem` at 42/42, then source-bound serial SceneMemory 42/42
> (10,216 ms) and Compendium 78/78 (44,852 ms), each once with zero retries and named verification.
> The associated serial Layout carrier is 787/787 and verifier-green, but its schema embeds no
> Git/source identity and its non-commit-tagged run lacks a preserved execution record; it is
> chronology-associated result provenance rather than standalone exact-source evidence.
> Slice `20260827-phase4-final-slice` then ran once for 414,213 ms and stopped terminal red with 12
> findings across 11 scopes; Glass and recovery did not run. Exact green and red carriers/hashes are
> inventoried in `audits/README.md`.
>
> That Slice red exposed stale evidence assumptions rather than product or Edge drift. Guide oracles
> still expected `DEVELOPMENT PUBLISHING IS ISOLATED` instead of truthful
> `DEVELOPMENT PUBLISHING STAYS PARKED`; Settings imported raw tint `0.55` correctly restores to the
> live `0.82` slider floor; Arc 4 releases runtime/audio before pagehide; Training restore writes the
> canonical full-address Earth ID rather than legacy `p133`; and rejected Arc 2 bootstrap leaves
> Inventory lazy, closed and empty. The bounded repair negative-controls required publishing copy
> plus additive contradictions, exact Settings target/restore domains, stale-vs-publication Arc 4
> before lifecycles plus read-count/tuple/audio/release invariants, canonical-vs-legacy Earth
> identity, and absent/blank/open Inventory states. It changes no product, producer, ruler or
> deadline byte. Because evidence-source bytes changed, the final chain must restart at Layout on a
> new signed unchanged commit; the exact `7362a0e…` greens remain truthful history but cannot serve
> as its predecessors.
>
> Charter mining consumes exact registered world identity. Chapter 1's `c1-mine` credit requires a
> successful Mine on a canonical landfall whose complete CF1 hierarchy matches Home galaxy
> seed/coordinates, Sol star seed/coordinates, the expected planet ordinal and a Sol dead-world
> seed; an equal seed or ordinal under substituted galaxy/star coordinates is rejected. Chapter 3
> intentionally accepts a successful Mine from any canonical registered world rather than applying
> the Sol filter. Both bank one successful action tick, never a page load, and retain goal caps.
>
> Resize and `visualViewport` bursts share one frame-coalescer owner: the newest sample wins and at
> most one non-persisting scene rebuild runs per animation frame. A surface-HD successor is not
> published until its identity, lease, backing and attachment all succeed; a failed build preserves
> the predecessor and an explicit retry path. After publication the successor stays live even if
> predecessor release fails; failed retired leases remain owned for later cleanup, and release,
> rollback and final-disposal failures are aggregated while every current/retired owner is attempted.
> The fine-scene successor follows the same publish-complete-before-release and aggregate-cleanup law.
>
> Deep Scanners now has a live, source-addressed Survey consumer. On the exact eligible scanned,
> registered lifeless non-Earth world it adds one **Mineral veins** row in deterministic ordinary
> deposit order plus the biome marker, while withholding cosmic/exceptional veins, grade, reserves,
> progress and the grounded Mine action. A strict presentation projector maps raw deterministic
> rarity integers 0–14 onto the player-facing 0–9 vocabulary; malformed input discloses nothing,
> and Survey/Compendium consumers use that one conversion. Arc 5's compact model also implements
> the approved child-care invariant: each new bred child receives exactly
> `0.5 * min(clampedLeftFed, clampedRightFed)`, symmetrically and once. A player-live Feed flow now
> exists only on a real fauna Compendium detail. It selects one exact unassigned owned companion
> below the 200-Meal cap and one exact owned flora lot, then `Use 1` advances bounded `fed`, consumes
> or tombstones that exact lot, compact ownership and F4 through one receipt/CAS with no retry or
> optimistic publication. Assigned/recovering and capped rows explain why they are disabled;
> exact-instance twins remain separate; Back/Close remain available. The inline polite/atomic
> committed status is the sole accessible announcement; the simultaneous corner toast is
> supplemental visual-only feedback. After that status settles, one deterministic contented Feed
> expression may play only while its native gesture, exact successor, accessible counterpart, Sound
> and Creature voices still agree. One constant-size latest-successful-ownership slot rejects the
> same and every superseded committed result.
> Tastes/flavours, stat or Power growth, injury care/healing, poison,
> bond, explorer eating, Breed, rename, scouting, duels and missions remain unavailable.
>
> Arc 7/8 has crossed one deliberately narrow app boundary. `audio-identity-projector.ts` resolves
> only an exact current registered owned creature into the deterministic signature/profile/call
> plan, excluding mutable XP/hurt/fed/brood state. The app owns the five-bus fail-closed runtime,
> persisted **Creature Voices** setting and an asset-free bounded fauna renderer. Each admitted
> voice owns one immutable versioned category-mix intent; active owners combine by deterministic
> per-category minimum against saved base gains, transact before stealing, roll back partial writes
> and quarantine irrecoverable/reentrant adapters within a bounded recompute. All lifecycle paths
> release that owner and diagnostics/lab evidence prove the effective gains. Current Tame, Feed,
> Compendium-audition and generic-biosphere callers are explicitly neutral, so this adds no audible
> rebalance, setting or save field. A native Tame
> gesture followed by the exact durable, nonconverging fauna acquisition and its accessible status
> counterpart may emit one greeting keyed once to the acquisition record. A native Feed gesture may
> emit one `feed-completed` / `accepted` expression only after the exact durable one-meal successor,
> current creature/revision and accessible Feed status agree. The committed
> result preserves its global F3 transaction `revision` separately from the Arc 4/5
> `ownershipRevision`; the owner fences only the latter after the Arc 4 and Arc 5 ownership
> successors agree. Mute, Creature Voices off, hidden/unanswerable play, miss/refusal, stale or
> reload convergence, route/counterpart loss, replacement and disposal remain silent and
> synchronously release the audio/runtime owner. An explicit real owned-fauna Compendium detail may
> also select the exact companion's stable `selected` / `contact` expression without list/filter/
> focus/navigation autoplay. An inhabited current-world Planetside may explicitly emit one generic
> biosphere pulse only after its exact biosphere visual is visible; that presentation reveals and
> awards nothing and writes no state. A trusted Challenge may additionally claim one exact durable,
> non-converging combat settlement plus its registered cue plan. The accessible Chronicle emits each
> registered cue once from its exact visible caption; `combat-gameplay-voice.ts` preserves the
> legacy-shaped impact and exact critical/ability-proc layers and synthesizes bounded initiative,
> dodge, stun-skipped, burn, regeneration, defeat, resolution and Guardian/Titan motifs on the
> Sound-governed combat/gameplay bus. Creature Voices
> does not gate it. Skip/Close/replace and every lifecycle/counterpart loss cancel playback; Skip
> finishes the transcript silently. Other creature actions, broader/authored ambience, music,
> recorded assets, full accessibility/device
> plateaus and HUMAN listening remain open.
>
> The dedicated real-time Arc 4 recovery collector and mutation-sensitive selftest are ready, but
> recovery is non-standalone. Slice and Recovery now share the exact suppression schema and replay
> the same target, dispatch, trusted pointer, protected state and cleanup invariants. The collector
> first quiesces the whole heartbeat cycle, then recaptures one synchronized raw → state → UI
> exhausted baseline before revealing and sampling the exact Tame owner. Its exact quiesce/resume
> receipt binds one document, timer stop/restart and full-cycle settlement; stable lease-read,
> revision-read and lease-heartbeat counters prove the heartbeat and its checkpoint did not overlap
> collection. Only ticker/runtime projections and the deliberately stopped/restarted timer may vary;
> every other app-state field remains suppression evidence.
>
> Initial and two post-reveal settled samples retain button/card/viewport/scroll/point/document
> identity. Dispatch uses the final green centre over the bound CDP session and must produce exactly
> one trusted pointer plus zero clicks. Scroll, listener and owned-global cleanup completes before
> the after-state read and before any product verdict, so a concurrent cleanup red cannot be hidden
> behind a suppression result. Recovery's exact preparation/collector/verdict source seal is
> `22e8704122103323d0dd0079ce0d2821d69f249a860f31e4062f51b9f8e68771`; Slice's exact
> preparation/collector digest is
> `baa284a736d9243df4a61de192e553111c9c5fbc9d6aa70ffd05af5b6e31e45f`. Exact-shape,
> extra-key, node/document, synchronization, heartbeat-overlap, source-drift, cleanup-order and
> product-state mutations fail independently.
>
> Immutable Final10 `4405fb2…` passed all five responsive predecessors, fixture, the complete
> 16-attempt burn-down, exhausted suppression, close/checkpoint and closed/offline proof before its
> phase-blind poll stopped `instrument-fail` at `offline-reopened` after 110,549 ms. The retained
> read-only UI correctly used `unavailable`, not the eligible `empty`/`depleted` vocabulary. It made
> no offline durable-parity, Recovery product-layout, 20-minute recovery or recovered-state claim.
> Signed implementation/evidence repair `3fbfcd5…` gives ready, active-exhausted and offline-ineligible surfaces
> disjoint predicates, binds a separate offline raw read followed by one UI → state surface and its
> document/runtime tuple, and performs a full heartbeat refresh plus active-exhaustion equality check
> before arming observation. A candidate PASS retains and independently replays the three phase
> receipts described in the exact six-region seal inventory at the top of this overlay.
>
> On one newly signed unchanged clean committed source, the exact Slice report must
> be terminal-green and pass named verification; full Glass must consume that exact Slice ID and its
> exact report must pass named verification with the same ID; only then may recovery consume both
> exact predecessor IDs, and its exact report must pass named verification with both. Stop on any
> nonzero, red or instrument result and do not start a successor or automatically retry.
> Final11 completed the uninterrupted real 20-minute observation and recovered UI and remains stored
> final-assessor red; its unchanged bundle replays green under the repaired assessor. Immutable
> Final12 stopped earlier at Slice's stale negative-control expectation, with the main assessment
> green and Glass/Recovery not run. Exact signed Final13 source `7cb0969…` later completed the full
> named-verified chain green and earned the stable local Recovery certificate. The former Compendium ruler under
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
> product-owner/built-producer change—not Edge `.107`—required the then-current calibration.
> Signed source `8ffd2e2b4a8ba070cb93d3df6a8f4a91a245f527` supplied independent
> `20260826-slice-repair-candidate1`, `20260826-slice-repair-candidate2` and
> `20260826-slice-repair-candidate3` plus paired `20260826-slice-repair-baseline1`, each one attempt
> and zero retries. That historical ruler bound the same measurement authority, former producer
> `f7c87f2263bdac4014e5f56be5efc5ceeca7fbd2e32e25549a6b9e0260354224`, and budget-file SHA-256
> `6284a394664c1039c9aca3f3c6d6dc5caf55295a58f4ac1e361974d3b519de52`. It retains all four sealed
> baseline faults and exact 14-phone/13-desktop breach discrimination; only the phone warm ceiling
> changed to `524288`, with every other numeric ceiling unchanged. Historical exact-budget run
> `20260826-slice-repair-certification` passed 78/78 from clean signed activation source
> `91f4e04410b893c43ee5d261ebfc1fa3be127c29`, with complete lifecycle and named verification in one
> attempt/zero retries. It ran `2026-08-26T23:42:19.150Z`–`23:43:03.997Z` (44,847 ms) on Edge
> `151.0.4129.107`, revision `@419e77616b4ed7d0a544b85cb53ccd5b74d5f135`, JavaScript
> `15.1.23.12`, CDP `1.3`; that build tuple is provenance only. Raw/gzip report SHA-256 are
> `81c27ed5caa12e0c114a788041dfc5d109742bb9d86a256b548a8e9443d46108` /
> `6f3deb0ff3d748c7477c98c094684a3f1a04eb2ac3ffc89a055ec1c372710571`. That Compendium-only
> activation did not alter SceneMemory or the root Gate-A browser contract. Its exact bytes remain
> historical for that producer.
>
> Signed first repair `b206cf0986cf21747967e72700222ea9fa9d10f0` passed the complete
> browserless battery at 134 Vitest files / 1,474 passed / one intentional skip / zero failures,
> plus `root/app/worker/noUnused` TypeScript, `artunused`, syntax/import selftests, an 887-module Vite
> build and root validation. It retained final2 Layout 787/787, source-bound SceneMemory 42/42 and
> source-bound Compendium 78/78 with named verification before Slice stopped terminal-red after
> 424,225 ms with six findings across five scopes. `bb5dc7c7…` remains the protected-preview red;
> signed `862a75b…` remains the paired 40/42 heap/DOM red; signed `6c9ad855…` supplied the three clean
> calibration candidates; and signed `4a54c0d…` activates 12 MiB V8 /18 MiB aggregate under budget
> SHA-256 `e6c4aeea…`. Signed `5ddddbf…` contains the second harness repair and its complete
> browser-free checkpoint. Final3 Layout passed; SceneMemory then stopped pre-measurement on stale
> live `buildDist`/`gameMain` binding, with exact evidence and no retry. Browser-free derivation also
> found Compendium's measurement current but producer stale. That pre-Final4 repair bound SceneMemory
> budget `47d24080…775b` and Compendium budget `f0bedb67…3c64`, preserved all numeric/historical
> ruler data, and adds standard-build current-authority plus green-wrong mutants. The complete
> browser-free battery, authority printer and root validator pass; three independent final
> binding/test, whole-diff, and documentation/evidence reviews were CLEAR. The repair became signed
> clean source `041d1cf…`, whose Final4 Layout, SceneMemory, Compendium and Slice stages passed before
> Glass stopped on the preserved instrument report. Its bounded repair became signed `39e4f20…`,
> whose Final5 Layout and SceneMemory reports passed before Compendium stopped instrument-only at
> 0/78. Its exact-membership repair became signed Final6 source `ea845d7…`, whose Layout,
> SceneMemory and Compendium stages passed before Slice stopped on the preserved Inventory causal
> instrument report. The causal repair became signed Final7 source `53d030b…`; Layout, SceneMemory,
> Compendium and Slice passed before Glass stopped terminal-red with 25 findings. Post-run review
> separated one Compendium header/workspace product root and two narrow-phone Inventory product
> defects from two hostile-row Compendium oracle artifacts and four Settings oracle artifacts. The
> bounded repair made all prior certificates historical for their exact source and required a fresh
> signed successor from Layout. Exact signed Final13 source `7cb0969…` later passed current-source
> full Glass and real Recovery; whole-Gate evidence remains open.
>
> Historical current-input Slice chronology retains nine one-attempt/zero-retry reds on Edge `151.0.4129.107`.
> The first five remain preserved historical diagnosis. Signed-clean source
> `1e0141be418ca20a37dd82f1115c00b1a005e090` supplied run
> `20260827085237038-27561-1f8e3c1771b7`, which failed after 397,101 ms with 23 findings
> across 16 scopes and no Arc 4 success evidence: required was false, `ok`/ledger were null, and
> there was no success marker or ledger line. Source stayed clean/stable; Glass and recovery
> correctly did not run.
>
> Five independent roots are repaired in the current worktree. Guide/Glass bind the exact
> 55-bullet draft and 54-bullet removal with count, uniqueness, section, raw-nonempty and raw-trim
> controls. Stable fixture comparison excludes both legitimate ecology diagnostic clocks while
> independently bounding, monotonicity-checking and mutating the ecology value. A blocked
> contextless audio runtime accepts either boolean mute state but must create no context, node,
> voice, id or emitter. Epoch evidence observes the private precommit candidate, invokes the real
> persistence seam, then proves committed published/raw/reloaded equality. Survey calls
> `refreshTrainingScope()` after its replacement card is visible, rebinding current lesson locks,
> spotlight and focus ownership. Exact Edge version remains Slice provenance only; Slice and Glass
> judge fresh behavior/geometry rather than a version pin, so a browser update alone never
> rebaselines or moves ceilings. Compendium and SceneMemory own separate sealed Edge-family + CDP
> `1.3` capability/profile authorities; version tolerance changed no numeric budget in either ruler.
> Signed `7362a0e…` supplied exact SceneMemory and Compendium certificates before its seventh Slice
> red. Signed `b206cf0…` repeated the three serial green predecessors before final2's eighth red: an
> unchecked fixture-stage rejection reloaded predecessor state and cascaded through four saved-route/
> Atlas findings, while a stale Arc 4 publication oracle expected zero reads across an owned release
> that necessarily performs one. The second repair exact-receipts every direct primary, backup and
> absent-primary fixture, atomically resets/stages all stores, closes the sibling document and
> executable-tests a held active persist; Arc 4 requires zero stale-release and one publication-
> release read. Signed `5ddddbf…` contains that repair. Its final3 SceneMemory instrument stop and
> source-derived live-binding repair required both memory gates to repeat inside fresh Final4
> without recalibration; signed `041d1cf…` then passed Final4 Layout, SceneMemory, Compendium and
> Slice before Glass stopped with 46 findings and five instrument failures. Its repair became signed
> `39e4f20…`; Final5 passed Layout and SceneMemory before Compendium's cardinality oracle stopped the
> chain without a product verdict. Its repair became signed `ea845d7…`; Final6 passed Layout,
> SceneMemory and Compendium before Slice's ninth red exposed the Inventory pre-reveal/causal-prefix
> defect. The causal repair became signed `53d030b…`; Final7 passed Layout, SceneMemory, Compendium
> and Slice before Glass stopped with the preserved 25-finding report. That bounded product/oracle
> repair required a fresh signed-successor chain from Layout; exact signed Final13 source
> `7cb0969…` later completed it through named-verified Recovery. Root Gate A separately
> accepts compatible Chromium family + CDP `1.3` only after exercising the exact CDP inventory
> derived from `tools/uilayout.js` + `tools/bootperf.js` and recording complete per-run provenance;
> point version alone never repins, rebaselines or moves a root threshold. Current-source Glass and
> Recovery PASS evidence now exists for Final13; no hosted/HUMAN, whole-Gate, release, version,
> preview/publication or deployment claim follows.
>
> **2026-08-25 Arc 3–5 + Arc 7 historical checkpoint — retained as foundation where the
> 2026-08-27 overlay does not supersede it:** `@cf/domain-opportunity`,
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
> Research/Fabricator focus settlement also owns native default-action timing. If the exact trusted
> action still owns focus, the controller parks focus on its stable `data-semantic-key` row before
> disabling the action, so a delayed native Enter button-to-BODY transition cannot erase lineage.
> Settlement may restore the exact replacement action only while that lineage remains; a later user
> move to BODY, a summary or another control wins. Mine/Skim expose no semantic row and retain their
> separately proved disable-to-BODY behavior.
> The panel controller also captures open disclosure state and the current `data-focus-key` before
> every passive `setView` render, then restores the matching replacement after `replaceChildren`.
> That heartbeat product behavior predates the 2026-09-03 forensic batch. The successor changes
> only Slice/Glass observation: a forced F4 receipt and semantic descriptor lineage prove the
> existing restoration without carrying the disconnected Summary object across CDP.
>
> Arc 5A stages only after the exact Arc 4 source fixed point. `prepareArc5OwnershipMigration()`
> creates the version-2 manifest plus exactly four fixed generic delta shards, upgrades an aligned
> legacy-v1 certificate through one receipt-free CAS, or loads an aligned current-v2 zero-write fixed point. A protected
> future/corrupt/misplaced/source-drift outcome cancels all earlier boot candidates and restores the
> durable saved view, ordered Atlas routes and Arc 2 `items`/`equip`/`equipAff` mirror before runtime
> creation. `main.ts` exposes this non-player state only through `state().ownershipV2` diagnostics.
> Its current `cf-v2-arc5-app-state/v3` shape is exact-keyed over the base migration fields plus
> `feed`, `breed`, `rename` and `scout`. Feed includes its controller and action-coordinator
> diagnostics; Breed, Rename and Scout each bind their own controller schema and exact fields.
> Recovery/Slice assessment rejects wrong, missing or extra fields in every subtree. Historical
> `cf-v2-arc5-app-state/v2` base-only evidence is accepted only under the explicit legacy-replay
> option; v3 was already the product schema, so this assessor repair is not a schema migration.
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
> native Close/reopen/focus behavior. Passive authority rerenders replace their DOM while restoring
> the same semantic action with `focus({preventScroll:true})`; explicit action settlement retains
> default-focus reveal behavior. Its CSS action owner centers Tame/Scavenge/Sample at the base
> four-row grid scope instead of stretching them, retains the 44px floor, and preserves ≤390px
> full-width plus short-landscape behavior without changing Capture mechanics. At that historical
> checkpoint, Guide Capture/Discover copy was
> live/partial within the 24-partial/17-unavailable inventory; **A New Foundation** contained 54 draft bullets. Training
> remained six lessons plus graduation with no Capture lesson. The historical exact-input Slice passed the exact
> nine-stage capture ledger in 336,913 ms (report
> `4cc6fe02fb6965e4b67baef1d6b90d0a5ac64dff836cdc6416f49d5ad5bbbdde`, 14 burn steps,
> `recoveryClaimed:false`); Glass passes 12 viewports/36 Arc 4 outcomes with every planned control
> and no omissions in 71,713 ms (report
> `03a14ce5d6228aa8d2659b1b749cea090bc049273b16e3b6a7a4294630a42369`). Both bind base
> `8633bb48fc89c7ae658fa9ed4a7f47b683be102d`, status `61fc362e…` and exact-input dirty tree
> `b83ccef544dd3abafe5e661d1fff5f362914385edb7d8a24152d307590f4350f`. The uninterrupted
> Final11's 20-minute observation passed and its unchanged bundle replays green under the repaired
> assessor. Immutable Final12 stopped at Slice's stale negative-control expectation before
> Glass/Recovery. Exact signed Final13 source `7cb0969…` later completed the full named-verified
> chain green and earned the stable local Recovery certificate; HUMAN review remains open. No Charter bioscan, targeted
> preview, hosted, release/version, `rnSeen` or preview/publication authority is claimed. Arc 5A now
> activates the receipt-bound compact ownership-v2 representation across boot, Training and capture.
> The manifest binds the exact Arc 4 source, canonical delta and reconstructed target while the four
> shards store only deterministic changed/V2-exclusive rows. Source-only growth leaves all four
> canonical empty-shard bytes unchanged, explicitly preventing an Arc 4 duplicate and keeping
> unchanged-state growth O(1). Postcommit verification publishes V1/V2 together or makes both
> unavailable and reload-converges. The real-fauna Compendium detail now projects exact eligible
> companion instances and flora lots, then routes `Use 1` through the same receipt-bound Feed/F4
> authority. It publishes no optimistic state, never retries, preserves Back/Close, and assigns the
> visible settled status to the event outcome; the exact accepted successor may then own one
> deterministic contented expression with no replay. The newer current Arc 5 overlay above
> supersedes this checkpoint's former absence of Breed/Recovery, Rename and Field Scout; missions,
> tastes, growth, care/healing, poison, bond, explorer-eating and friendly duels remain open.
> Arc 7 has pure identity/taxonomy/ecology/expression, an injected runtime, lab and eight-cue pilot rights
> validator, plus exact app-owned Tame, Feed and explicit owned-fauna Compendium audition. The same
> shared owner also accepts one generic current-world biosphere pulse after an exact visible
> Planetside counterpart; its app join and renderer bind canonical Survey roster, schema/digest and
> environment evidence while carrying no kingdom, family or species identity. Its absolute eight-
> emitter/120-node configuration caps are committed package policy.
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
> **2026-08-29 Pureforged current overlay:** `@cf/domain-loot` now owns a narrow
> `exceptional-v1` fixed-craft modifier policy in addition to the historical foundation below.
> **Pureforged** is the approved player-facing v2 name; `exceptional-v1` remains an invisible stable
> compatibility identifier so existing item identity, receipts and reload behavior do not change.
> When every direct material in an eligible slotted fixed recipe is paid from exceptional stock,
> `planFixedFabrication()` derives one modifier from the fixed-recipe owner, exact receipt ordinal,
> generation seed, and base; `prepareArc2FixedFabrication()` persists it on that exact generated
> `GearInstance`. Mixed/ordinary payment keeps the ordinary generation plan. Policy v1 contains
> only `yield`, `strike`, and `contact`, because their mining, rich-strike, and acquisition
> consumers are live; unsupported `scut`, `land`, and `heal` crafted ids fail closed rather than
> becoming dormant paid rewards.
>
> The strict Gear/Inventory codecs, inspect/compare/filter presentation, F3/F4 settlement and
> reload, Engineering capabilities, acquisition capabilities, and Slice/Glass evidence oracles all
> read the same instance-bound modifier. Natural affix/drop tables, drawbacks, upgrades, sockets,
> vendors and general variable-crafting/source policy remain open. The 2026-08-24 statement below
> that crafted modifiers reject is retained as its historical boundary and is superseded only by
> this narrow fixed fully exceptional path.

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
> `outcome-transaction.ts` is the shared F3/F4 product assembly owner. It detaches state/extensions
> plus its codec registry, rejects product writes to protected `player/f4.authority`, validates the
> injected save clock once per commit, and supplies one same-registry/same-clock canonicalizer for
> expected postcommit successors. It applies product namespaces, prepares the next active-play/
> SessionRNG authority, serializes one complete save and submits product + immutable receipt + next
> revision under the lease fence. Random plans retain their draw after failure.
> Equip/Unequip/Salvage/pending-claim use its no-RNG sibling, advancing only the global ordinal and
> preserving seed/domain counters byte-for-byte.
>
> `apps/game/src/inventory-panel.ts` owns the 48-row bounded panel/detail/modal projection;
> `inventory-actions.ts` owns only the exact legacy compatibility edits implied by a successful
> domain action. `main.ts` registers Inventory in the desktop rail and exact 260px 5×2 ten-control
> phone dock, supplies one durable action adapter, and publishes no optimistic state. The detail
> sheet owns the background for its entire open lifetime: existing and newly mounted direct body
> roots are snapshot once, kept both inert and `aria-hidden`, then restored to their exact prior
> states after observation disconnects on Close/dispose. It also owns bidirectional focus
> wrap/return, exact conditional comparison,
> salvage confirmation, pending action and convergence diagnostics. At `<=360px`, each Inventory
> row reflows to one content column with copy above a wrapping, left-aligned badge group. This changes
> presentation only: the full exact instance id, item copy, equipped/protected/pending state and
> native button/detail/action semantics remain visible and owned by the same row instance. Production opts into the closed-
> surface lifecycle: data, filters and page survive Close, but the 48-row projection and its six
> panel/detail event subscriptions exist only while open. A durable promise settling after Close
> updates state without remounting hidden DOM; stale registration callbacks cannot reacquire after
> disposal. Genuine legacy Training gear
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
> `7d8dc380cd89ef53aac5a11c3850316e19e1aae9` bound the 1,000 ms budget SHA-256
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
> At that historical Arc 1A boundary, the authority remained Arc-local Edge 151 and did not change
> the then-active v1.8.9 Gate-A point-version authority. The current root compatibility contract is
> recorded in the 2026-08-27 overlay above. Da0's six images are stale for the repaired producer; a fresh phone/desktop list,
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
> fallback/write/clear/completion and leaves the checkpoint plus lesson retryable. The release
> witness may precede the independently queued bulletin seen-state autosave; the current Slice
> assessor accepts completion only after two equal raw reads bracket live/focus evidence in which
> Training is released, Guide alone owns the fixture bulletin and Back focus, `releasePending` is
> clear, and live `rnSeen` equals durable raw `rn`. This replaces a fixed observation delay without
> changing product timers or write topology.
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
> **Historical 2026-08-14 Charter overlay (superseded by the current Starter Charter overlay above):** `@cf/scene/charter.ts` still owns the
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
> **Historical 2026-08-21 GitHub Actions budget overlay and later workflow chronology; current
> browser authority is summarized in the 2026-08-27 overlay above:**
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
> phase; it was not yet pushed or hosted. The later Arc 1C workflow installed exact Edge `.101`
> before `scene-memory-v2.json` / 42 outcomes. Current CI instead gives SceneMemory its own freshly
> resolved stable Edge-family process and preserves the separately sealed exact-`.101`
> install → preflight → certificate adjacency only for the Compendium leg. Those workflow choices
> are environment normalization and exact-run provenance, not browser-version budget identity.
> The historical 250 ms activation `59530da3bf40965adf9c54f169b310e11ccdd0f8` and historical
> cross-host repair `7d8dc380cd89ef53aac5a11c3850316e19e1aae9` are distinguished in the current overlay above;
> signed `4a54c0d…` owns the heap-only activation. Signed `7362a0e…` supplied exact SceneMemory
> 42/42 and Compendium 78/78 certificates before the later Slice harness red; both repeat inside the
> restarted full chain because the repaired evidence source must be newly signed.
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
> **2026-08-12 root browser-harness overlay; 2026-08-15 selftest update; 2026-08-27
> compatibility-authority update:** legacy `tools/uilayout.js` now
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
> launches the selected executable through the shared owner, then the root capability probe
> exercises every CDP method source-derived from `uilayout` + `bootperf` with response sentinels
> and publishes only after target/process cleanup. It requires canonical Chromium-family product,
> CDP `1.3`, the exact capability inventory and complete executable/product/version/revision/UA/JS/
> protocol provenance. Older/current/synthetic-future Edge and Chrome/Chromium controls pass;
> family, malformed-product, protocol, provenance, capability and executable-non-browser mutants
> fail. Point version is provenance only and a compatible update never rebaselines or moves root
> thresholds. Exact Edge 150 remains historical v1.8.9 capture evidence. `bootperf` shares the executable
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
> **2026-09-02 POSIX ownership refinement:** one detached Node sentinel remains the group leader
> while Chromium runs non-detached inside its group. The sentinel reports the exact browser
> PID/lifecycle, holds TERM, announces its exact final group identity, waits for parent
> acknowledgement, then group-SIGKILLs itself and all survivors; a watchdog covers lost
> acknowledgement. Parent success requires that identity plus sentinel SIGKILL exit and stdio
> close, and the parent performs no negative-PGID probe or signal at any phase. Browser exit before
> endpoint/socket or during work fails closed. After `Browser.close`, only code `0` with null signal
> is accepted; POSIX owned shutdown additionally accepts exact TERM/KILL, never a crash or nonzero
> exit. Windows may accept an external integer/null-signal exit only after its exact bounded
> taskkill request succeeded. Profile removal and stable absence happen after the terminal barrier.
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
> controls. The transition still rebuilds the full scene, but resize and
> visual-viewport bursts share one animation-frame owner, sample the latest viewport
> in-frame, and perform at most one non-persisting rebuild per frame. This is an
> allocation tier, not a newly implemented scene-art quality tier. Survey
> cards expose minimum-44px **Enter galaxy / Enter system** actions, and touch
> Planetside has a minimum-44px **Leave world** action. The eighth dock slot opens
> the canonical **Guide to the Universe**: `guide-content.ts` carries a
> source-addressed v1.8.9 snapshot of all 9 categories /43 authored stable ids /41
> legacy-live topics—currently 25 partial and 16 unavailable—plus category browsing, search and
> `data-gt` cross-links. A
> capability table supplies current copy for partial systems and explicit
> unavailable copy for unported mechanics; dormant `beacon` / `events` remain
> retained but hidden. `release-content.ts` similarly preserves all 56 legacy
> releases /398 bullets and keeps **A New Foundation**, the cumulative categorized
> v2.0 development bulletin, separate. Its 64-bullet implemented-outcome outline is explicitly
> `draft` / `Unreleased`; structural and rendered controls require canonical section
> order, unique nonempty bullets, scroll-reachable tail copy, and unchanged `rnSeen` /
> `releasePending` across open and reload. `V2_CURRENT_RELEASE_VERSION` is `null`,
> so that playtest identity cannot trigger an update or imply a production release. The Guide also renders the full source
> commit supplied by the guarded development package. First Guide open persists
> `seenGuide`. The player-facing import door (**Settings → Bring expedition**, paste/pick controls
> and the `cf_v2_import_original` keepsake) was removed on 2026-09-05; `#importsheet` survives only as
> the nonclosable Field Training recovery sheet, and the evidence-build `importBlob` seam still parses
> the whitespace-trimmed JSON candidate for Slice/Glass replacement proofs. Planet cards bind the captured galaxy+star `{seed,x,y}` context
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
> `panels.ts` retains element-identity ownership for registered panel roots/openers, captures every
> registered opener through one document-level delegated owner (including nested clicked content),
> and reads
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
> focus-pinned rows plus clipped-ancestor controls. The current repair keeps the floated 44px Close
> and Compendium heading in one header row by removing the heading's inherited clear; it changes no
> list membership, virtualized row structure, portrait or focus ownership. This is a bounded geometry repair, not a broad
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
> Settings geometry is assessed per control rather than requiring Sound and Voice to remain visible
> at one scroll position. Each control owns an isolated reveal, two identical settled samples,
> exact centre `elementFromPoint` ownership, Close-presence/clearance proof, trusted native input
> receipt and exact panel/document scroll restoration in `finally`. Missing or unsafe product
> geometry is product-red; transport/evaluation failure remains instrument-red. Browser-free mutants
> cover replacement nodes, stable missing Close, receipt type/coordinate drift, unsafe dispatch,
> partial causal coverage and failed restoration. Exact signed Final13 source `7cb0969…` supplies
> the current-source full 12-viewport Glass certificate for this repaired oracle.
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
(Sovereign, Warden, World-Shaper, Unseen Hand, or Prismatic Pathfinder). The Prismatic/Balance
ending additionally requires at least three conquered worlds, the Electric Signature, and 40
catalogued species. The universe remains open and playable after winning.

---

## 2. Files & build/test workflow

| File | Purpose |
|---|---|
| `main.js` | **The local legacy edit source of truth** (~24,300 lines). **Gitignored** and recoverable from the committed html, see below. It is never a CI or port-test input. |
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

Port tests that need legacy source bytes use `port/v2/test-support/tracked-v1-source.ts`. It extracts
the unique literal inline script from committed `celestial-frontier.html` without trimming or
newline normalization and fails closed on missing, duplicate, reversed or empty boundaries. No test
may read or fall back to ignored local `main.js`; a local-only dependency is not clean-checkout
evidence.

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

In the v2 port, `@cf/domain-ecology` keeps the lifted civilization generator byte-verbatim but owns
the D-LOC presentation facade: generated non-Earth `yearLabel` values use pure ASCII comma grouping.
Earth's authored `Year 2026 CE`, the numeric year, all other fields and exact RNG chronology remain
unchanged; Descriptor parity consumes that facade transitively.

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

Compendium's current Back evidence distinguishes setup geometry from action-time product input.
The native row helper may reposition through several deferred-layout/resource-settlement attempts;
therefore its earlier `setup` anchor is diagnostic only. After the helper accepts its final point,
the collector arms one exact current-document capture-phase click witness before native
press/release. That witness binds the trusted delegated click, logical row/index, unique target and
scroller, hit-tested coordinates, panel list/query/source counts and the anchor synchronously seen
before the product handler. The report derives `before` from that witness and compares `after` plus
`afterSettled` to it under the unchanged ±2px ruler. Listener/carrier cleanup is part of the
evidence contract; the product's own focus/scroll restoration code is unchanged.

Historical exact source `3ca7d300f4c8192fef596d4f08e8c493a8875863` proves the action-time
success contract for its own bytes: desktop retains setup/action/return offset `-46`, phone retains
`-2`, each profile records exactly one trusted event, aborts its witness controller and leaves no
carrier. Its unchanged-source Compendium, develop Slice and full Glass reports are terminal green,
independently named-verified and indexed in `audits/README.md`; they do not certify the current
signed 9b37 source or its evidence/docs descendant.

The current exceptional cleanup owner is deliberately outside the tracked observation wrapper.
After a primary native-input failure it evaluates only the exact cleanup expression under the
existing transport bound, requires an aborted controller and absent carrier, and leaves
`currentStage`, `lastCompletedStage`, completed stages and the original command ledger untouched.
An independent cleanup failure augments the primary diagnosis but never replaces its causal stage.

Exact clean signed source `9b37ffcdb5879d243288e511b7d70c59ea935dae` certifies this combined
success/failure boundary. Compendium run
`20260831-pr35-back-cleanup-9b37ffcdb587-compendium-certification` passed **78/78** in **63,594
ms** with one trusted witness and complete cleanup per profile; desktop stayed
`-46 / -46 / -46` and phone stayed `-2 / -2 / -2`. Its unchanged-source develop Slice passed with
zero findings/scopes and ten screenshots in **358,221 ms**; full Glass passed **12/12** viewports
and **104/104** controls with zero findings, instrument failures, blocked or omitted work in
**111,201 ms**. Every exact named verifier passed. The four exact report/log carriers and raw/gzip
hashes are indexed in `audits/README.md` and committed by the signed evidence/docs descendant.

The current PR #35 foreground-service authority treats a serviced turn as target-bound evidence,
not a generic root heartbeat. For each accepted attachment the collector binds exact target,
session, document and logical observation identity; enables focus emulation, brings that page to the
front, arms visible/focused witnesses, then requires a real `requestAnimationFrame` followed by a
later browser task with zero visibility/focus loss before the single 5,000 ms phase deadline. Each
success uses top-level schema `cf-v2-compendium-foreground-service-receipt/v1` and retains
`timing: { issuedAtMs, deadlineMs, receivedAtMs, timeoutMs }`, exact expected/observed identities,
and a cleanup witness proving document globals/listeners are gone. Successful focus emulation remains
owned until the caller hands off or disposes that attachment. Every failed claim best-effort removes
its globals/listeners and disables its attempted focus emulation while preserving the original
product/instrument classification and surfacing any independent cleanup fault.

A complete measurement requires the ordered fresh-lazy-control, veteran-Earth and final-lazy-control
receipts and independently re-reads `pageAuthorities` for the lazy and main sessions. This prevents
coordinated mutation of expected and observed receipt identity from manufacturing success.
List and Planetside settlement are structured at the page boundary: every poll retains raw and diagnostic
target/session/document identity, image `src`/decode/dimensions, art, lazy-loader, worker, broker and
page state. Node recomputes readiness and a bounded reason list from those fields. `null` or any
non-object page result becomes explicit terminal diagnostic evidence rather than being mutated or
collapsed into a product finding.

Exact source `b2eecfbd9379f50c25208ca8bcd72501b07e303c` ran that structured instrument once with no
retry as `20260830-pr35-settlement-evidence-b2eecfbd9379-compendium-certification` on Edge
`152.0.4191.53` / CDP `1.3`. It stopped terminal `instrument-fail` after **33,041 ms** at phone
veteran-Earth Planetside settlement with zero outcomes, all 78 blocked and no desktop or successor.
The carrier proved eight distinct ready/decoded 132×132 rows. Their page-owned canonical identities
were **766–779 characters**, but the generic observation-v1 512-character text projector serialized
each `visualKey` as `null`. This is an evidence-contract failure, not product-memory or browser-
compatibility evidence. Historical measurement / contract / collector / budget authorities
`326d3b3515512cf84182ffa8bb8c3b87c5cd5e10913644a67ce22a1a9b68e66b` /
`7ac505e156ec45f38b0dedcb57df6b0157efa5f0af56afdae492a0c1f5fc6c24` /
`ece4edc132dbb5c8cf252d5b113ab3855f115aba1e921a8dc005ce762d9a7690` /
`c272a12028361c0f51d474480559f285aea8d036dbd5a9be2572978e45240de3` remain bound only to that red.

Each profile executes one exact **85-phase** settlement plan: **75 list** phases and **10
Planetside** phases in sealed order. A semantic invocation, not a poll command, owns one attempt.
Every accepted invocation appends its strict receipt to `thumbnailSettlementHistory` before the
phase's latest receipt is inserted or replaced; attempts are contiguous `1..N`, tokens are unique,
timing is strictly serial, and the 85-entry latest projection must equal the final history receipt
for each plan group. Partial-profile schema v6 retains its diagnosis, the full accepted history and
latest completed prefix, plus one structured active next-phase or latest-phase-retry tail. Terminal
verification rejects omission/reorder and coordinated attempt/token/history/page/browser/command/
timing laundering.

Partial carriers bind lazy/main page authority independently and require distinct identities whenever
both are present. The retained command ledger has exactly one terminal polling command per semantic
deadline group and fails closed above **2,048 entries or 2 MiB**. Receipt tokens are capped at **256
characters**, and a ready-but-unreceipted tail survives only under its exact receipt-assembly
instrument diagnosis.

Signed implementation commit `d9d79025794c95d5491ab9c9e1139b66eea7be5e` (tree
`d4bc3a04bec6243045a6941feadd9074a7722e79`, parent
`b2eecfbd9379f50c25208ca8bcd72501b07e303c`) changes no product/game byte. Observation v2 validates
the complete opaque identity only in the owning page realm. The serialized image projection carries
bounded key length and exact indices into independently produced leased and cached key inventories;
it never carries the opaque key through a generic text cap. Each inventory is capped at exactly
**256 entries before `indexOf` or `Set` construction**. Every image must prove membership and
per-image distinctness, each inventory length must equal its live lease/cache count, and both
inventories must prove internal distinctness.
Explicit controls make a literal 256-entry inventory green and a 257-entry inventory an instrument
error; realistic 768–831-character identities remain green.

That observation-v2 repair owned the authority tuple exercised by its successor run: capability SHA-256
`35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341`, measurement
`87d6782ad7d4ceaed3222eef8d2740dfe964db6d02b628fa2c3e125eaea6d06d`, contract
`abedc70f6ffcd3130445f4a5e1681ba7a2607210fbb9e6f3522ac8a7ab752138`, collector
`b75f426541982bc431c01f127c3410a1030ef0fd51f849e1833d492313025f4e`, budget
`7efe9fa86075e33518020d41e7cc48bf9b2bc75ecb7ed9c0e074bd84c4d74200`, and unchanged producer
`0de7dc1a95ceeb35738d4cb17e7ccd464aab947848a9fe643e7c69355836bf13`. The capability inventory
includes focus emulation and `Page.bringToFront`; no cache, timing or memory ceiling, gameplay
structure, genome/anatomy rule, or browser point-version policy changed. Browser-free validation is
green at 565 `compendiummem:selftest` controls, focused 35/35, 237 files / 2,413 passed + one skipped,
all three TypeScript programs and the producer-authority printer with both budget matches true;
independent review was clear. It was not browser certification.

Exact signed successor `830e601b8f16092d6f9193ecde329cfefd279bcd` exercised that visual-key repair once, with no retry,
as `20260830-pr35-visualkey-v2-830e601b8f16-compendium-certification`. It stopped terminal
`instrument-fail` after **33,217 ms** at phone veteran-Earth Planetside settlement with zero outcomes,
all 78 blocked, no desktop profile and no successor evidence. The eight 766–779-character visual keys
retained valid leased membership indices, proving the observation-v2 long-key boundary worked. All
eight thumbnails instead held current `error`, the first worker-local painter import had failed,
and the v1 species-art Window diagnostics retained import counters/stage but no code or message.
That historical observation-v2 report and carrier remain byte-immutable; the original worker message
cannot be recovered from them.

The current local producer diagnostics schema is `cf-v2-species-art-worker-diagnostics/v2`. Its
`lastError` property is required and nullable; when present it is frozen and has exactly
`{producerEpoch,workerInstanceId,jobId,kind,stage,code,message}`. `jobId`/`kind` may be null for the
registered non-job stages, `message` is bounded to 1–512 characters, and only a trusted worker error
that passes the species-art protocol may populate the record. Its source worker response owns a
valid error only when `jobId`, `kind` and `key` are all null or all present and valid; mixed-null
ownership is malformed. A replacement producer clears both `lastEvent` and `lastError`. Adapter-
protocol failure and an external/untrusted fatal clear `lastError` too; an exact trusted worker
fatal retains its validated record. Constructor failures and malformed or untrusted worker messages
do not fabricate cause-bearing evidence, and stale same-worker attribution cannot survive a later
non-worker failure.

Live Compendium settlement uses observation schema
`cf-v2-compendium-thumb-settlement-observation/v3`. Exact observation authority and shape are
validated before product state is classified. Terminal product attribution also requires present
broker/worker diagnostics, exact art schema `cf-v2-species-art-diagnostics/v1` and exact lazy schema
`cf-v2-species-art-worker-diagnostics/v2`. Only then do current errored thumbnails/
lazy state with a trusted `lastError` matching the current producer identity classify immediately as
`product-error`; the collector retains that exact active tail and emits terminal `product-fail`
without sleeping, repolling or retrying. Cumulative counters and an older `lastError` remain useful
recovery telemetry, but a coherent current `ready` producer is nonterminal.

Exact signed descendant `d33abdfd513236e72294b81e3bb46b1362f810e1` ran
`20260830-pr35-first-install-d33abdfd5132-compendium-certification` exactly once with no retry on
Edge `152.0.4191.53` / CDP `1.3`. It completed all 78 outcomes at **74 pass / four fail**, with
phone and desktop `cap-shrink` plus `settled-jobs` red. The exact cap/resource and lifecycle facts
were healthy: 256 → 96 entries, 6,690,816 decoded bytes, 160 disposals, four sealed warm cycles,
restored device class, zero queued/active work, zero portraits, and balanced released workers. One
shared evaluator clause nevertheless demanded a non-null paint `lastError` after replacement had
correctly recovered to `ready` and cleared the receipt. The result remains an immutable exact-source
red; Slice, Glass and Recovery did not run.

The corrected released-worker predicate requires `lastError === null` for every selected current-v2
released/recovered snapshot, not only the final one. Exact cumulative paint/phase/result arithmetic
still proves the deliberate one-paint-error control; a current terminal product failure still
requires an exact non-null trusted receipt. Non-final and post-cap stale-receipt mutants keep both
directions fail-closed, while historical diagnostics v1 continues to replay. The exact report is
preserved at
`audits/ARC1C_COMPENDIUM_PR35_RECOVERED_WORKER_ORACLE_FAILURE_20260830_D33ABDF.json.gz` with
451,743 gzip bytes / SHA-256
`4e714e115ca7f4b5d1d32ba118241ca8b78055596438a4dd22bbb1c1d471ffab` and 10,813,681 raw bytes /
SHA-256 `e4eb2aba1079a1d42b1da5e7f97d236105917fd497035937b1f6855d63a4289e`; independent replay is
8/8.

The final derived producer record at that historical checkpoint was `cf-v2-compendium-producer-authority/v2` /
`f2f1629a98962801a740d0448d955d08c1ccd9157149edb42169bf0a317e43f3`. It binds index
`45fc756d924fabd03b3b214e0fd80697e463c59a686a190fcee2b076d05de27c`, owner
`assets/main-BYnoCcc9.js` / `13afe063806bca9b829866070c08741ea0749ca07c1d7dcecf3175c1dae9bfa5`,
the unchanged statically bundled species worker/painter
`assets/species-art.worker-DnnSDKMy.js` /
`25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172`, and generated
`service-worker.js` SHA-256
`5a968f36984021e39a0cb9e70b2ec37b607563c08a29240b078b828f3d0607d3`. Historical schema-v1 and
earlier schema-v2 producer records remain replayable. At that checkpoint, Scene build / game-main authority was
`9351f6fc2311365a5dfc8a4c0b0629d862d7c91f6cd00a83e236b1ce824a6e17` /
`07bdf8aac9bd8224870f2749df18461576d733c55555698dd247ddeffb83f831`; Compendium
measurement / contract / collector authorities were
`5c408472b808f09e9f31133905635f08b7ef3588fad151f5f68e2a67ff68b1d0` /
`9fc43fe4d29453ec4b546a53a2e62bc874499c67bae9f0f0f4c33e8063c41828` /
`0af0f5884c0eec67cea7c6696c20a2c691c669fa93ee255fd1c54d17b56d5010`.
Compendium and Scene budget-file SHA-256 values were
`c4f6dddffdf88e42819c567c26132a66f3924a7423002cbfca4564e2defb9d0b` and
`670f8ecc2c0bc5715fb92b263820db577a70c3faf254151ff11f45de8fe645f7`. The green authority printer
bound a **964-module / 52-file** build. Worker construction remains
lazy, but the species painter and biome renderer are statically owned by their worker entries; the
production build rejects worker `import()` and external static JavaScript imports. Fetch-time pin
adoption is removed and unpinned non-navigation requests remain 503. At that checkpoint the fixed
ruler, every numeric ceiling and the 78-outcome inventory were unchanged. Exact `941ba45…`
generated values remain historical authority for its passed Compendium and red Slice only; that changed head had no browser
certificate.

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
`5677d9ed26cef8be087a87b61fca49aa0ef22d1dd273ed1993a5880079173d70`. For former producer
`f7c87f2263bdac4014e5f56be5efc5ceeca7fbd2e32e25549a6b9e0260354224`, signed source
`8ffd2e2b4a8ba070cb93d3df6a8f4a91a245f527` supplied
`20260826-slice-repair-candidate1/2/3` plus `20260826-slice-repair-baseline1`, each one attempt and
zero retries. Historical budget SHA-256 `6284a394664c1039c9aca3f3c6d6dc5caf55295a58f4ac1e361974d3b519de52`
retains the same measurement authority, all four sealed baseline faults and exact
14-phone/13-desktop discrimination. Only the phone warm ceiling changed to `524288`; every other
numeric ceiling is unchanged. Historical clean signed activation source
`91f4e04410b893c43ee5d261ebfc1fa3be127c29` then passed exact-budget run
`20260826-slice-repair-certification` 78/78 with complete lifecycle and its named verifier in one
attempt/zero retries. It ran `2026-08-26T23:42:19.150Z`–`23:43:03.997Z` (44,847 ms); report
raw/gzip SHA-256 are `81c27ed5caa12e0c114a788041dfc5d109742bb9d86a256b548a8e9443d46108` /
`6f3deb0ff3d748c7477c98c094684a3f1a04eb2ac3ffc89a055ec1c372710571`. This was real producer
drift, not an Edge-version trigger; exact Edge `.107` is provenance only. Those exact bytes are
historical. Compendium and SceneMemory now own separate Edge-family + CDP `1.3` capability/profile
authorities; version tolerance itself changed no numeric budget. SceneMemory's three-candidate
calibration and signed heap-only activation are complete, and signed `7362a0e…` supplied exact
SceneMemory/Compendium certificates. Exact signed Final13 source `7cb0969…` repeated both stages
inside its fresh green predecessor chain without reopening either numeric ruler. Root Gate-A remains
separate.

### Star Atlas (bookmarks)

**Current v2 (Step 2e, 2026-09-05):** `star-atlas-state.ts`, `star-atlas-panel.ts` and
`arc9-atlas-row-actions.ts` own the bounded 120-row List/Chart view, All/Favorites/Visited/
Conquered/Life filters, Home, exact Remove and one-level Undo. Favorites includes Home; visited
and conquered facts use complete canonical world keys for current rows, with preserved seed facts
used only for legacy `p<seed>` rows. Chart coordinates and its current-view marker come from
source-proven routes; compatibility location text cannot mint a route. Incomplete routes remain
visible but cannot travel, including Travel Home. Accepted planet travel returns to Survey and
keeps Land explicit; existing ship/Prime reach checks and Search/CF1/Atlas hyperlane semantics remain.

Overlapping Chart points merge into bounded 44px cluster controls. Opening one shows its exact
member rows with the existing List actions and performs no travel. Return to Chart restores the
originating cluster; if it is gone, focus falls back to the Chart view control, then that panel's
Close. Passive semantic refills preserve current focus ownership without claiming a new route.

Favorite retains its existing exact-row/route and first false-to-true `curator` owner. Home, Remove
and Undo use their exact expected-state receipt and one F4 CAS, with no RNG, optimistic publication
or automatic retry. Remove preserves every surviving pair and route identity and clears Home only
when that exact row was Home. For eight monotonic seconds its one-level Undo retains the removed
pair and the exact present-or-absent route association. Undo requires the exact removal successor,
receipt, retained pair and unchanged route identity, then restores the original pair at its original
position and restores the prior Home state. An originally absent route stays absent; Undo never
synthesizes one or deletes another row's route. Other save/source stores remain unchanged. Another
Atlas mutation, route-identity change or convergence reload expires the retained Undo; stale or
failed writes never publish, and ambiguous durable outcomes converge read-only without retry.

**Legacy v1.8.9 implementation:** the icon/auto-add details below describe the original game.
The `logMap` Map. `addToLog`, `renderLog`. Every survey card (galaxy/star/planet/moon/etc.)
has a uniform **bookmark row**: **+ Add to Star Atlas**, **☆ favorite**, **⌂ home** — the
icons auto-add to the Atlas on tap. Entries can be favorited/home-set from the Atlas list
too. (Favoriting unlocks the **Curator** achievement.)

### Breeding & feeding
- `breedPair` — cross two same-kingdom specimens; **consumes both parents** on success
  and failure. Odds via `breedOdds` (boosted by stardust). Works on **all kingdoms**. This is the
  legacy v1.8.9 path; current V2 Arc 5 Breed is fauna-only, preserves both parents in Recovery, and
  gives the successful child +2 XP plus the one-time exact-species-pair +5 through its F4 CAS.
- `feedPair` — feed flora to a fauna specimen; `faunaTastes(g)` gives liked/disliked
  stats; preference affects outcome (loved/neutral/disliked events, poison risk).
  Feed is **fauna-only**.

### Stardust economy (`essence`)
The soft currency that boosts breeding odds (`stardustBonus`, `breedOdds`). Faucets:
- **Harvesting** conquered worlds (`doHarvest`, readiness via `HARVEST_EPOCHS` against
  `COSMIC_EPOCH`; `HARVEST_CD` is only the retired legacy display-stamp floor).
- **Spoils of Conquest** — winning a world grants `8 + tier*5` stardust.
- **Accepted starter conquest Charter** — its one verified `st-conq` win adds 25 more to current
  and lifetime Stardust in the same combat CAS; weekly conquest rewards are not yet live in v2.
- **Rare Find Bonus** — discovering Legendary+ (tier ≥ 5) species grants `tier−3`.
Loaded value clamped 0–1e9.

### Ranks (`RANKS`, `rankInfo`)
By expedition score: **Cadet(0) → Scout(30) → Pathfinder(90) → Voyager(220) →
Pioneer(460) → Star Cartographer(900) → Mythic Wayfarer(1700) → Void Sovereign(3000) →
Cosmic Luminary(5200) → Eternal Frontier(8200)**. Rank-up plays a sting + gold FX burst.

The current v2 pure owner is `@cf/domain-progression/rank.ts`: it retains the exact
`surveys·4 + catalogue·2 + bestRawTier·12 + unlocked·6 + hybrids + galaxies·3` score,
all ten nameplate hues, foil at Eternal Frontier, permanent `bestRank` reward projection and
`✦N` every 3,000 thereafter. The Arc 9 app adapter derives those exact factors from sanitized save
owners. Its aggregate refresh raises `stats.bestRank` only in the same receipt/CAS that appends
proved aggregate achievements. The bounded Records model/panel exposes current/next rank, progress,
best-rank reward and factor contributions; AppChrome shows the selected unlocked hue/foil and rank.
Boot establishes the no-fanfare baseline. A later first committed named-rank promotion queues the
mature promotion copy, sting 5 and effects-budgeted gold burst (fixed palette, maximum 40) from the
geometry-only AppChrome player-chip anchor. Newly appended known achievements queue first with
manifest copy and sting 3. Replay, Training, already-durable and convergence paths remain silent;
the queue never writes or rewards progression. Settings nameplate selection is separately live.

### Frontier expansion (`REGIONS`)
The reachable universe expands as you claim Signatures. Tiers: **the Solar Reach → the
Local Cluster → the Near Field → the Deep Field → the Outer Dark → the Frontier**.
`currentRegion`, `reachRadius`, `withinReach`, `charterBlock` (gates travel beyond reach).

### The Prime Codex (historical legacy v1.8.9 source track) — `SIGS`
The table and function names in this subsection document the legacy source verbatim. Current v2
player truth is the nine Titan-backed registry and one-choice ending overlay at the top of this
reference; do not reinterpret the legacy `Find` rows as a second current claim path.

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

The current v2 manifest is `@cf/domain-progression/achievements.ts`: **96 exact rows across 13
categories**, with 68 pure aggregate rules and 28 explicit event-owner rules matching the mature
`t:null` boundary. `evaluateAchievementUnlocks` returns only newly eligible aggregate ids in
canonical order. `projectAchievementCatalogue` returns all rows plus status, bounded unknown save
ids and legacy-compatible rank-credit count. It never infers an event achievement.

The app boundary is split four ways: `arc9-progression-projection.ts` owns the strict sanitized
`SaveStateV2` mapping; `records-rank-model.ts` owns bounded display data; `records-rank-panel.ts`
owns escaped Records markup; and `arc9-progression-action.ts` owns the aggregate-only F4 action.
The action preserves existing known, event-owned and unknown ids in their durable order, appends
every newly eligible aggregate id in manifest order, refuses a complete successor above the codec's
146-id bound, and advances no random draw. Product state, `ach`/`br`, F4 authority, receipt, lease
fence and repository revision commit in one CAS. Stale, lost and storage failures publish nothing
and are never retried; a commit is returned only after canonical reload projection is an exact
fixed point. No separate progression extension or migration exists.

Exact event joins currently live in their true owners: complete canonical Earth landing → `home`
(including legacy's intentional Training-Earth case); durable world or exact companion naming →
`namer`; a successful pairing whose captured pre-action parents are both tier 5+ → `bredlegend`;
the first verified conquest → `settle1`; verified player combat ending at 1–19 HP → `brink`; valid-
world Share → `share`; accepted source-proven/reach-authorized CF1 Follow → `wayfarer`; canonical
Survey facts → `civ`, `spacefar`, `sol`, `binary` and the eight star-kind witnesses; source-proved
travel → `worm`, `quasar`, and `dwarfg`; and explicit Atlas Favorite → `curator`. Share joins
`stats.shares` and `share` in its one owning `arc9-share-send-v1` receipt before the independent
clipboard result. After that owner settles, aggregate progression may append exactly one separate
`arc9-progression-refresh-v1` receipt when fifth Share projects `share5` or the post-Share
aggregate score raises best rank; otherwise no tail is written. Follow composes `stats.jumps`, its
accepted saved route, galaxy visit, `wayfarer`, and any proved galaxy-kind event in one receipt; ordinary
Search/Atlas/direct arrival uses the travel receipt without earning Follow. Atlas Favorite changes
only the exact row's `fav` field in place, preserving its WeakMap route sidecar; false-to-true owns
`curator`, unfavorite never removes it, and unchanged state is receipt-free. Main publishes each
committed detached carrier only after its owning fixed point succeeds. Explorer self-rename is live
but identity-only and cannot unlock `namer`. Explicit hostile Discover Life joins `survivor` in
`bioscan-action.ts`; safe explorer Flora healing joins `fieldmedic` and, above 40% poison risk,
`gambler` in `explorer-meal-action.ts`. Only `daily` and `decade` remain owner-blocked; no aggregate
proxy may mint them.

`planProgressionCeremonyV1` validates the exact prior/next append and best-rank transition after an
owner's committed publication. It rejects reordered/unknown/duplicate achievement deltas and rank
demotion all-or-nothing. Known additions retain manifest order, use the existing text-safe
description and sting tier 3; one higher rank uses the authored Rank Up copy, sting tier 5 and the
bounded gold FX semantic. Boot, Training, replay, already-durable, refusal and convergence
dispositions return silent before presentation. Main's highest-revision fence and serial queue
prevent duplicate delivery. Before shifting an entry, the drain preserves the complete queue and
reschedules while `productActionInFlight` belongs to a newer receipt-bearing owner; replacement
reload remains the explicit path that clears pending ceremonies. The smoke-visible diagnostic
schema is transient observation only and adds no save carrier.

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
rendering and persistence adapters rather than owning either lifecycle directly. At phone width,
the native minimum-44-pixel Prime control occupies a centered tier at
`calc(var(--topbar-h) + 8px)` and the trail follows at `calc(var(--topbar-h) + 58px)`, so both derive
from the measured live topbar without expanding the 5×2 ten-control dock. Main's global mutation
fence also distinguishes **Expedition action settling** while `productActionInFlight` is true from
**Read-only expedition** when save authority is actually unavailable; neither state permits a
dependent mutation, and Survey Close remains available during settlement.

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
  35 partial and 6 unavailable—with dormant topics hidden and unavailable topics retained with
  honest copy; `getGuideTopic` and
  `searchGuide` keep stable ids, search and live cross-links. `fillGuide` /
  `renderGuideMenu` / `renderGuideCategory` / `renderGuideTopic` /
  `renderGuideSearch` own the panel. `getReleaseHistory({includeDraft:true})`
  supplies **A New Foundation**, the cumulative v2.0 development entry, followed
  by the 56 legacy releases. Its exact 79-bullet implemented-outcome inventory has rendered
  ordered SHA-256 `351c1279d7b36fa795a414f4d56a6237d57c0575675b80f69fcbc5471c6ae042`
  and is checked structurally and in the rendered Guide. Tail proof dispatches one adaptive
  native wheel per fresh exact-document/tail/hit-owner/geometry observation until the final item
  is visible at bottom, then restores scroll and inline overflow ownership exactly; unchanged
  shipped-release state remains separately required. That version is development identity
  only. `getCurrentV2Release()` returns nothing while
  `V2_CURRENT_RELEASE_VERSION === null`; `showUnseenV2Release()` therefore
  cannot mutate `rnSeen` or open an update until an authorized shipped v2 entry
  exists. The existing Settings and Saving topics and Field Training bullet describe
  the exact current-view success path, partial ownership of genuine
  legacy checkpoints (including their lack of a saved route: Welcome Skip stays
  in Sol and post-Land completion stays at Earth), and the persistent unknown-checkpoint recovery
  lock. The PWA work extends those two existing Guide topics and adds two draft bullets without
  adding a topic, capability, category, shipped release or version. This ports the data model,
  browsing and cumulative-history door; v2
  tooltip deep-link triggers and Advanced Briefings are still open.
- **Current v2 installed-app contract** (`port/v2/apps/game/pwa-build.ts`,
  `src/pwa-update.ts`, `vite.config.ts`, wired by `main.ts`): emitted builds contain one exact
  final-byte runtime inventory plus an automatic worker-template revision, and a completion marker
  written last. A partial or altered candidate is deleted. Exact per-document build pins survive
  activation/rollback until explicit reload; navigation selects and pins the active build. Worker
  and shared-worker creation propagates that selected pin to the valid resulting client. The
  species-art and biome-vista entries each statically bundle their complete worker graph, and the
  production build rejects worker `import()` or external static JavaScript imports. A successor does
  not claim existing pages. On
  first installation, the worker takes its initial all-client preservation snapshot, calls
  `clients.claim()`, then repeats the complete preservation pass inside that same activation
  `waitUntil`; this pins a worker created in the snapshot/claim gap when that worker is enumerable.
  Fetch-time adoption is deliberately absent: every unpinned non-navigation request remains exact
  503. All client types retain their pins, an omitted snapshot client must also fail
  `clients.get()` before pruning, and third-build activation refuses while any live client owns the
  retained prior.
  Settings accepts exact-worker status/results and exposes
  accessible explicit Check, Activate, Reload and Roll back actions; active status—not controller
  change—reveals Reload. Main refuses conflicting reloads, joins active persistence and
  checkpoints/rearms canceled debounce work across the exclusive reload boundary. Only current plus
  one verified prior set may remain, with no network/cross-build fallback; rollback changes app
  assets only and leaves protected IndexedDB
  expedition data untouched. Dev serving deliberately registers nothing. Automated local proof does
  not close physical PWA/device/HUMAN acceptance or authorize publication.
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
exact node, cache and context cleanup; and an immutable per-voice category-mix intent aggregated by
the minimum active owner factor. Prospective bus policy is installed before victim theft, partial
writes roll back, reentrant generations force an all-bus recompute, and non-settling adapters
quarantine within a 12-pass bound. Mute and stop are synchronous, unmute does not allocate,
failed or closing contexts stay fail-closed, and hostile close/re-entry cannot resurrect an old
owner. Every voice lifecycle releases its mix owner; diagnostics/lab validation bind owners,
factors and effective gains. Current creature-expression requests are neutral, so no audible mix or
saved policy changes. The absolute eight-creature-emitter/120-node policy remains intact.

`creature-expression-voice.ts` supplies a deterministic asset-free fauna graph bounded to one
oscillator and one gain node in a single expression concurrency group. `tame-greeting-audio.ts`
is the shared exact-expression owner. Its Tame path arms only from the native gesture and admits only
the exact committed durable nonconverging fauna result whose species/world, global F3 transaction `revision`, Arc 4/5
`ownershipRevision`, current ownership, acquisition record and projector all match. Main preserves
the two revisions as distinct evidence and publishes only after the Arc 4 and Arc 5 ownership
successors agree; the audio owner fences current ownership against `ownershipRevision`, never the
global revision. It pairs that sound with the exact accessible status event and keys the one allowed
greeting as `arc4:taming-succeeded:${recordId}`. The current repair requires release to return
`true` before `collectArc4TameGreetingStart()` retains its exact result, global, ownership, claim,
counterpart, runtime and toast clauses, and accepts one start that is either still active or has naturally
completed before its first read. Generic Arc 4 ownership-revision and reload-result-null controls
are included. Exact signed `3f69e88…` Slice passed this historical exact-source evidence inside the
immutable chain. Sound off,
persisted **Creature Voices** off, hidden/unanswerable play, miss/refusal, stale/reload convergence,
route or counterpart loss, replacement and disposal stay silent and stop/release the audio/runtime
owner. Reload begins disposed, unarmed and without context, counterpart, voice or nodes.

Its Feed path arms only from the native Feed gesture, then admits the exact committed durable
nonconverging successor whose global revision, receipt ordinal, creature ID, ownership revision and
one-step `fed` increase still match current ownership. The event key is
`arc5:feed-completed:${revision}:${receiptOrdinal}:${creatureId}`. The owner retains only that latest
successful ownership revision/key: an exact-key replay fails as already claimed and an equal/older
ownership result fails as non-advancing, keeping Feed replay memory constant-size. The inline
`role=status`, `aria-live=polite`, `aria-atomic=true` result is its accessible counterpart and sole
assistive-technology announcement; the concurrent toast is `role=presentation`, `aria-live=off`,
`aria-hidden=true`. The status precedes the `feed-completed` / `accepted` expression. The current
Slice oracle requires the raw-CDP `Oscillator` source's successful `start()` and a complete same-
context path through recorded WebAudio edges to exactly one raw-CDP `AudioDestination`; disconnected,
wrong-destination and cross-context mutations fail. Exact signed `3f69e88…` Slice passed this
bounded Feed outcome, its exact-instance settlement/reload evidence and the two-native-click stale
race with zero findings; Glass then consumed and verified that exact Slice. Refusal,
stale/converging state, replay, route/detail/counterpart loss and disabled audio are silent.

`compendium-audition.ts` projects an intentional real-fauna detail-only Listen surface from the
same exact current ownership and immutable identity boundary. One button per matching owned
companion selects the existing `selected` / `contact` phrase after a trusted native gesture and
polite/atomic status counterpart. List mount, focus, filtering, virtualization and navigation never
dispatch playback. Fixture, non-fauna, unowned/mismatched/protected, programmatic, stale or lost
paths are silent; the action changes no creature, genome, lineage, ownership or save field.

`biome-ecology-audio.ts` retains the pure canonical inhabited-current-world join and now registers
distinct `approach-lead` and `survey-roster` playback receipts only after their exact visible
biosphere counterpart exists. World identity, biome-profile schema/digest/key, weather, hazard and
environment fingerprint remain bound at biosphere granularity. `approach-ecology-audio.ts` projects
the existing pre-landing planet Survey card from one production canonical roster and renders only a
generic living/silent/protected lead plus an explicit 44px **Listen to biosphere** control. It stores
roster authority privately and constructs playback only after that exact current system-route card,
world, ecology epoch and visible control agree. Landing, card presentation and navigation contain no
playback call. The landed Planetside owner separately retains literal `PLANETSIDE — Biosphere`, full-
roster fingerprint and epoch proof.

`distant-ecology-voice.ts` recanonicalizes only generic `approach-lead|survey-roster` / `biosphere`
ambience with null kingdom, family and identity, then creates the same low-gain oscillator/envelope
pulse. The shared live owner binds approach playback to its system route while retaining the exact
target-world key; landed playback remains owned by its world route. Route/visual/counterpart loss
stops either source. Both consume no SessionRNG, reveal no species, create no discovery/acquisition/
reward and write no state.

`combat-cues.ts` projects exact registered participant, transcript, caption/visual and Guardian-motif
facts from one replay-verified `CombatSettlementPlanV1`; it never simulates combat or draws RNG.
`combat-chronicle.ts` requires that exact settlement/cue-plan join, reproduces the mature seeded
narrator and owns named timed rows, native HP meters, statistics/result, silent Skip and the
plain-text Share/fallback surface. Each registered prelude, transcript or result cue provides an
exact one-use `AudioCounterpartReceipt` bound to its visible caption. `tame-greeting-audio.ts` claims a combat session only after a trusted
native Challenge and exact committed non-converging Arc 6 outcome. `combat-gameplay-voice.ts` accepts
only an exact cue object from that plan. Damage retains deterministic legacy-shaped impact noise plus
its proved critical/ability-proc layers; authored synthesized contours cover initiative, dodge,
stun-skipped, burn, regeneration, defeat, resolution and Guardian/Titan entrance, phase, victory and
defeat. Composite families remain one voice; priority arbitration keeps at most two concurrent combat
voices. The combat/gameplay bus and master Sound govern it; Creature Voices does not. Skip,
Close, replacement, hidden/unanswerable state, route/counterpart loss, Sound Off, context loss and
dispose synchronously cancel the session, while Skip renders the remainder silently.

Compatibility survey/navigation stings remain separate. No other creature expression, authored or
continuous ambience, music or recorded combat asset is player-live. Catalogue-only
audition policy, more-specific ecology content, UI/combat ducking, decoded-byte/media
plateau, full captions/mono/dynamic-range/reduced-intensity behavior, device
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

**Current v2 topology (2026-08-27):** v4 remains the imported/exported compatibility codec, while
repository schema v5 stores owner-partitioned rows, pre-migration source snapshot/journal, revision,
receipts and independently versioned extension namespaces. Current product authorities include
`player/f4.authority` v1 (active-play + SessionRNG), `inventory/arc2.loot` v1 (exact gear +
stackables or protected legacy facts), `engineering/arc3.state`, and Arc 4's 18 fixed ownership
namespaces. Every complete v5 write/replacement must carry them explicitly; round-tripping only the
v4 envelope would erase authority. Receipt-free boot migration/reconciliation shares one
lease-fenced CAS, while product actions join their carrier/compatibility/F4 changes with one receipt
and next revision. This schema number is independent of the development display identity and
production `GAME_VERSION`.

The current replacement evidence contract separates three authorities: exact imported source
bytes, the one complete native replacement transaction, and the later replacement-document
bootstrap/product fixed point. Cross-clock equality uses the production codec plus independently
expected route repair. It replaces `at` with a sentinel and represents `conq[].t` / `minedw[]` only
as exact ages from `at`, while separately bounding the observed absolute anchors. It never removes
saved-view geometry or Atlas `where` rows and never ignores achievements, rank, cargo, Prime,
Compendium or other unrelated fields. The strict retained-fixture projection SHA-256 is
`e40a542553ab61a1f9c5800e856a8f1e3c5efd341fdb73dec776d622258bd31c`.

Three bounded compatibility seams are now separately executable. Notification stamps use only the
injected clock and converge to identical later-v5 bytes. A missing conquest epoch `conq[].e`
imports as exactly one legacy-ready cycle, hostile values clamp to `[0, EPOCH_BASE]`, and the result
round-trips. XP-first authority stores the newest exact 4,000 legacy keys in v4 `xpf`; v4 `xpa` is
the strict binding to the full v5 `progression.xp-firsts` overflow authority. Together they carry
the complete set without rearm and protect mismatch, future, corrupt or source-protected evidence.
Arc 5 Breed writes one 64-character canonical SpeciesId-pair digest for a genuinely new V2 union,
but recognizes the exact legacy genome-derived `pair|FNV32` alias as already paid from either tier;
all ownership, XP, mirror/archive and F4 changes commit under its one receipt and revision CAS.

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

**Current tracked-only preauthorization gate (2026-08-31):** from `port/v2`, a clean committed
develop candidate must pass `node tools/tracked-input-preflight.mjs --profile=develop`. It exports
only the exact index into an isolated temporary tree, installs there and runs the shared develop
browser-free/static profile exactly once: full Vitest, all TypeScript programs, art audit, exact
route/coverage ownership and spec reachability. The test owner derives current Compendium producer
authority as part of that run; production alone adds the source-mutating override controls and
quarantined SceneMemory producer binding. It rechecks HEAD,
tracked cleanliness and forgotten source-owned untracked/ignored tests before PASS while excluding
dependency-owned `node_modules` tests. Its selftest mutation-controls ambient-versus-tracked
dependencies, generated artifacts, command order/execution, soft-fail and workflow adjacency.
Synchronous Slice/Glass/Recovery selftests use explicit 15-second child and
20-second outer limits with separate timeout/nonzero/missing-marker controls. This gate does not
replace the strict browser evidence chain or authorize hosted work.

**Current Slice Survey-predecessor contract (2026-09-01; browser-free verified):** a visible
dependent Enter/Land control does not prove that the preceding Survey has settled. The shared
early-core-flow staging path must observe the current document's exact Survey receipt/revision and
persistence, current route/render/card/action identity, and coordinator idle before pointer,
keyboard, touch or already-current action dispatch. Any missing, red, replaced or still-settling
predecessor causal-stops every descendant. `state().landing.surveyOutcome` carries bounded diagnosis
only and cannot replace receipt/action authority. Hosted run `33466661094` preserves the negative
case: prerequisites and Compendium 78/78 passed, then one non-Sol Survey → Enter race produced 12
cascades and correctly prevented Glass. Current acceptance additionally requires Atlas Travel's one
exact `arc9-galaxy-arrival-v1` / `arc9-travel-committed:` commit, single/sequence runtime schema and
before/after live↔raw SessionRNG parity, current-Survey retained-fault rejection and paired stable-
but-wrong live/raw revision/seed/ordinal/draw controls. Focused 73/73, all TypeScript programs and
the 257-file/2,622-pass/1-skip develop profile are green; two reviews are APPROVED. This does not
become current browser evidence until a clean candidate passes tracked-input preflight and one
unchanged-source Compendium → Slice → Glass chain.

**Current Slice Share action-sequence contract (2026-09-01; browser-free verified):** a
generic writable F4 observation may sit between Share's owning receipt and its queued aggregate
progression receipt, so it is not the action fixed point. `READ_F4_AUTHORITY_EXPRESSION` reads
canonical `catalog`/`v5:catalog` in the same read-only transaction as revision/player/receipts.
The predecessor cross-binds catalog schema/segment plus exact codex/surveyed/gals arrays to legacy
raw, and binds existing live `codexCount`, `stats.surveys`, best and hybrids. The successor must
preserve both catalog and legacy inputs. Exactly one `arc9-share-send-v1` is required, followed by
exactly one `arc9-progression-refresh-v1` only when fifth Share adds `share5` or aggregate score
raises best rank. Same-token receipt/revision/ordinal/SessionRNG spans, final outcome and two
consecutive exact samples are mandatory. The c0 fixture uses the exact captured 26 unlock IDs,
rank-oracle parity covers every threshold/factor including permanent saved-rank no-demotion, and
all six Share helper outputs are bound to their waiter arguments. The shared waiter is declared in
the enclosing execution `try`, not inside full-journey mode, so collision-only mode can reach it;
an Acorn audit proves its one declaration precedes and scopes all five direct calls while a re-gated
mutant fails. Exact clean signed 4a595e2 passed tracked-input at **259 files / 2,660 passed / 1
skipped**, browser-CDP selftest and live Edge preflight, then completed one/no-retry, named-verified
Compendium **78/78** → Slice (`19833fe4…`) → Glass **12/12** (`a4f6d9b1…`) chain with exact Slice
predecessor binding. This is a harness-only repair. Edge point version remains provenance only;
there is no hosted, push, merge or release authority.

**Current Glass causal/presentation contract (2026-09-03):** native keyboard evidence follows
semantic identity rather than setup-time DOM object lifetime. The setup listener retains the first
trusted same-document Tab receipt; the collector reacquires the current controls before and after a
real `large-phone` heartbeat replacement, proves old-node disconnection and requires prior semantic
focus restoration before native Tab. The same row re-queries the Shipyard `mining` Summary after a
forced heartbeat and requires trusted Enter to originate from, remain active on and toggle the one
current descriptor-matching replacement. Structured F4 cycle receipts distinguish completed,
skipped and failed cycles and bind the exact Capture/Shipyard refresh. Current-control presence,
origin, lineage, settled scroll, post-Tab focus, exact visibility, target/ancestor effective
opacity and nontransparent focus paint are product outcomes; schema, carrier, document, query
witness, exact descriptor and trusted receipt integrity are instrument outcomes.

The terminal writer emits `cf-v2-glassmatrix/v2`. Every current PASS consumer requires its deep
Shipyard inventory; v1 may be replayed only when historically red. The changed-input canary runs
small then large sequentially inside one seven-minute/no-retry step, while the full 12-row
certificate remains unconditional. The terminal report is exact-validated and deterministically
projected to the step summary after Glass so diagnosis survives an independent artifact-service
failure without softening the failed Glass step, mandatory upload or Recovery ordering.

The first instrument red retains one root failure, blocks dependent controls and stops later
viewport work. The first product red likewise stops dependent product work and records a complete,
disjoint blocked suffix rather than pretending those controls executed. Rendered Guide ingress
reopens and re-queries the unique current topic carrier, judges all required-copy baselines first,
classifies copy mismatch as product-red and
setup/control/restoration defects as instrument-red, and arms mutants only from green. Generic
visibility walks ancestor `<details>` elements: a closed disclosure admits only its direct first
Summary subtree; retained rectangles, computed style or requested scroll do not make hidden actions
visible. Opening the disclosure admits the same action. Inventory's offscreen-action negative
control uses refusal-only activation (`dispatch:false`), arms no receipt listener and must prove no
native input or receipt. When the settled scroller is already zero, Glass temporarily transforms
only the judged action outside the viewport, retains the exact button/card owner, and restores the
entire inline-style attribute and scroll owner in `finally`. Its generated restoration expression
is parsed and executed by a unit control; absent and empty style attributes remain distinct, and
the owned absent case performs final normalization only after retaining transform evidence. Setup,
negative-control or restoration failure is instrument-red before product action or outcome;
publication mutants run only from a green real-action predecessor. Product-direction
controls keep Capture
actions base-centered with a 44px floor while preserving ≤390px full width and short landscape;
rarity-removal controls independently cover Compendium badges and owned Binder slots while missing
Binder semantics remain distinct.

Inventory modal assessment also retains a per-root unlocked-background ledger with selector/tag/id,
`inert` property/attribute and `aria-hidden`, plus nearby toast/progression presentation state. Its
existing modal controls independently make a current attribute writer and a late direct-body root
turn red, wait for observer-driven green, verify outside-focus redirection and exact post-Close
restoration, and keep native forward/reverse Tab bypass sentinels inside the modal. This strengthens
diagnosis and both-direction negative control without adding a job, changing the 104-control sealed
inventory or weakening the product predicate.

**Historical Inventory-lifetime certificate (still valid for its exact source):** exact signed implementation
`5004fd36f9fdb2632f323d99f1535e9fb2ac5b95` passed the hermetic tracked-input develop profile
and one unchanged-source/no-retry, named-verified Compendium **78/78** → zero-finding Slice →
Glass **12/12 / 104/104** chain with zero blocked/omitted work, findings, instrument failures or
retries. The four deterministic report/log carriers are indexed in `audits/README.md`; the later
docs/evidence descendant does not rebind authority away from that implementation source.

Historical predecessor `1f80b0ad050763bf478b2364ad0194e389a7096e` remains green evidence for
its own exact pre-lifetime-repair bytes and is not relabelled as the current certificate.

**Historical exact `8bdf474…` evidence / Arc 0 publication-oracle repair boundary (2026-08-30;
superseded by the current handoff):** the immutable
8bdf Slice remains terminal FAIL with exactly one Landing publication-oracle finding and no
Glass/Recovery successor. Its retained old-document live product matches the pre-action product
exactly and keeps the open Pertar card; the obsolete check simultaneously required that card to be
closed. The then-uncommitted runner repair moved live-product parity plus complete held
route/rendered-scene/card/share/target judgment into shared browser-free contracts with field-level
controls and immutable real-report replay.

The prior Landing repair treats Survey as an owned fixture predecessor: it verifies exactly one Survey
receipt, the current Pertar route/card, durable-to-live publication, coordinator idle and F4
writability, then resamples raw/live authority before arming each fault and invoking direct
`landHere()` once. Pre-Survey baselines, missing receipts, wrong route/card and wrong live
publication are independent red controls. Coordinator-idle requires the exact owner, hold and
three-key fault-latch projections: missing/renamed/extra/armed latches, stale hold diagnostics and
a retained setup/reload fault are independently red. A malformed positive setup fail-stops before
mutants are constructed, so it retains the Arc 0 diagnosis instead of becoming a generic harness
exception. The composite Survey-plus-Landing helper is not the judged action.

That same historical evidence path exact-key validated `state().ownershipV2` v3 over every base field
and all four Feed/Breed/Rename/Scout diagnostic subtrees. Baseline replay is green only for the
complete current shape; wrong, missing and extra-field mutants for each subtree are red. Historical
v2 base-only evidence remains available only through the explicit legacy option. This is an
assessor catch-up to an existing product schema, not a schema bump. Final repair-batch browser-free
validation was green: 251 files / 2,501 passed / one skipped, with all TypeScript programs green.
Fresh exact-source browser authority remains pending.

**Historical exact e4f5 evidence/oracle boundary (2026-08-30):** Compendium run
`20260830-pr35-slice-oracle-e4f5af4bf628-compendium-certification` passed 78/78 once/no-retry.
Its unchanged-source Slice successor ran once and stopped terminal red after 98,988 ms with the four
ordered scopes listed in the current overlay, seven partial screenshots and no PASS marker. The
browser-free evidence replay binds all three gzip/raw carriers, exact source/run identity, finding
order/message hashes, child/log evidence and the absence of any Glass/Recovery successor. Focused
F4 controls now execute the exact native transaction trace, independently derive both replacement
branches, bind the absolute codec window and strict clock-age product projection, and mutation-test
conquest/mined stamps, complete saved-route geometry, both relevant Atlas routes, achievements,
essence, cargo, Prime and Compendium state. Red setup stops before import, red prefix stops before
its diagnostic outcome, and red outcome/control stops hide and Arc 3. These browser-free repairs do
not relabel the immutable Slice or supply a changed-head
browser certificate.

**Historical exact-source evidence snapshot (2026-08-29):** exact signed source
`3f69e88ea8e34fdb8d9913276601b426ada783ae` completed the once-only, zero-retry
Layout → SceneMemory → Compendium → Slice → Glass → Recovery chain. Layout passed 787/787,
SceneMemory input-v4 44/44 and Compendium 78/78; Slice passed with zero findings, Glass consumed
that exact Slice and passed all 12 viewport classes with zero findings or instrument failures, and
Recovery consumed both exact predecessors and passed all ten stages with a real uninterrupted
1,200,297.5 ms active-browser observation. Every immutable report passed its exact source/
predecessor-bound verifier. At that checkpoint, the full v2 battery was 163 files / 1,712 passed +
one skipped and all TypeScript configurations were green. This exact evidence certifies the universe-wide visual
treatment and bounded Arc 5 Feed scope only; HUMAN visual/listening/screen-reader/first-journey,
physical-device heat/battery/true-GPU, Gate G distant playback, D-9e, whole-Gate and hosted/release
authority remain open. Exact carriers, sizes and hashes are in `audits/README.md`.

**Historical Final11/Final13 evidence snapshot (2026-08-28):** signed clean source `1ca67156…` supplied immutable
historical Final11. Layout passed 787/787, SceneMemory 42/42, Compendium 78/78 with six PNG bindings, Slice
passed with zero findings/ten screenshots, and full 12-viewport Glass passed with zero findings or
instrument failures. Every predecessor ran once and passed named verification. Recovery then ran
once for 1,291,034 ms and passed all 15 observation outcomes across 309 samples, the uninterrupted
20-minute active-play window, exact next-cycle boundary and recovered UI. Its final domain assessor
failed only `activePlayProjection` and `closeCheckpoint`: the former rejected a valid 20 ms render
lag within the existing 10-second runtime law, and the latter compared close against a stale raw
capture instead of the latest exhausted live runtime. Cleanup passed and no retry occurred.
Final11 remains immutable stored `fail`, with unchanged hashes, one attempt, zero retries and those
two stored false checks; it is not a Recovery certificate or product failure.

The repaired assessor independently replays Final11's unchanged `recoveryBundle` wholly
green. It permits durable raw to lead rendered UI while rendered remains at or before runtime and
within the existing 10-second bound, retaining the exact raw/runtime authority tuple. Close binds
the latest exhausted live state/UI time, exact six-key committed/lost hide witness and committed
revision outcome. Isolated controls cover the reported 20 ms/322 ms geometry, exact boundary/+1,
future/excessive lag and every witness field. Immutable Final12 source `509734533dd4…` (tree
`609e92c6278…`) passed Layout 787/787, SceneMemory 42/42 and Compendium 78/78, then Slice ran once/
no retry and stopped stored `fail` at `arc-4-stale-convergence`. Its real assessment was wholly
green. Only `witnessAuthorityControl` correctly double-redlined `convergenceRelease` and
`oldUiConvergence` after the strengthened authority binding while its wrapper required the first
alone. Product and `slicesmoke.mjs` blobs in the stored carrier were unchanged from Final11;
Glass/Recovery did not run. Signed evidence checkpoint `2bf99bd…` preserves that immutable result.
Signed repair `5ab4d3e…` changes only the exact harness/test assertion. Exact signed Final13 source
`7cb0969…` then completed the once-only chain from Layout through Recovery with every named verifier
green, no retries/findings/instrument failures and the real 20-minute observation. Numeric rulers,
historical samples, product/save bytes, browser authority and retry/release policy remain unchanged.
Edge `151.0.4129.107` / CDP `1.3` is provenance only; a compatible point update never causes
a rebaseline, recalibration or threshold move. That exact-source local Recovery certificate grants
no hosted/HUMAN whole-Gate or release authority.

**Historical Final10 predecessor:** signed `4405fb2…` passed the same five responsive predecessors
and Recovery through closed/offline proof before the phase-blind `offline-reopened` oracle rejected
truthful read-only `unavailable` controls. Signed implementation/evidence repair `3fbfcd5…`
separated ready-visible, active-exhausted and offline-ineligible predicates; its signed docs
descendant became Final11 source `1ca67156…`. Exact historical carriers remain in
`audits/README.md`.
Earlier
`bb5dc7c7…` and `862a75b…` reds,
calibration source `6c9ad855…`, activation
`4a54c0d…`, and the historical `7362a0e…` / `b206cf0…` / `5ddddbf…` / `041d1cf…` evidence remain
truthful for their exact inputs.

Historical current-input Slice chronology retains nine one-attempt/zero-retry reds. The first six
remain historical diagnosis. Signed `7362a0e…` then retained three green predecessors before Slice
`20260827-phase4-final-slice` stopped after 414,213 ms with 12 findings/11 scopes. Signed `b206cf0…`
repeated the three predecessors before final2 Slice stopped with six findings/five scopes. Four
saved-route/Atlas findings cascaded because unchecked staging reloaded the prior expedition; two Arc
4 findings cascaded from a zero-read publication oracle even though owned release performs exactly
one repository read. The second repair atomically clears/stages every direct primary, backup and
absent-primary fixture after joining active persistence, closes the sibling document, retains
byte/hash receipts even on rejection, and executable-tests a held writer plus blocked competing
persist. Arc 4 now requires zero stale-release reads and one publication-release read with missing/
extra controls. Exact Edge version is provenance only; compatible point updates never rebaseline or
move ceilings. For those historical sources, post-start audio, the exact nine-stage/14-burn ledger,
full Glass and 20-minute Recovery remained unproved. The ninth red is Final6's single root Inventory
reachability defect and
four unexercised descendants; Final7 supersedes it with four green predecessors and the preserved
Glass red described above. Final9 later supersedes their predecessor-chain boundary through Glass
and the 16-attempt burn-down. Final10 preserves another five-green-predecessor chain and advances
Recovery through closed/offline proof before its `offline-reopened` instrument stop. At that
historical Final10 boundary, signed implementation/evidence repair `3fbfcd5…` had no successor
browser result, and the synchronized
signed clean docs-only descendant supplied immutable Final11. Its repaired replay is green.
Immutable Final12, preserved at signed evidence checkpoint `2bf99bd…`, passed Layout, SceneMemory
and Compendium before Slice's stale negative-control expectation stopped the chain; Glass/Recovery
did not run. Signed repair `5ab4d3e…` fixed only that harness expectation. Exact signed Final13
source `7cb0969…` then completed the full once-only named-verified chain and real Recovery
certificate. No hosted, HUMAN,
whole-Gate, release, version, preview/publication or deployment claim exists.

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
