# Acceptance rubrics — what "done" means, per gate

**Current implementation evidence refreshed:** 2026-08-25.

**Port Phase 0 / Gate A deliverable:** *"elevate `ART_DIRECTION.md`, `AUDIO.md`,
`PROCESS_LAWS.md` and the system docs into acceptance rubrics."*

A **description** says how the system works. A **rubric** says how you know the port got it
right. This file converts the former into the latter, gate by gate.

**Recorded pre-current-WIP local evidence boundary (2026-08-24):** Arc 2's focused domain/
persistence/app checks, TypeScript programs, Vite, one real no-retry Slice Smoke and one full Glass
Matrix were locally green for that exact-instance Inventory candidate. The reports bind that
candidate's dirty inputs. Its full suite's sole deliberate red was the Compendium measurement-
authority mismatch scheduled for one final multi-Arc reseal. This is not a final claim about the
current moving working tree. Therefore the executable rows below name implemented criteria, not
clean exact-head, hosted, integration, whole-Arc, whole-Gate, HUMAN, preview or release authority.

**Current Arc 3 historical local evidence boundary:** commit `c4a02be` records the product/browser-tool repair
batch after one no-retry Slice pass (253,181 ms, 0 findings, 10 screenshots) and one full Glass pass
(64,222 ms, 12/12 viewports, 78/78 controls, none blocked/omitted, 0 findings/instrument failures/
retries). Both reports name base `768fb32` but bind different dirty snapshots—Slice `29d54731…`,
Glass `d9b51284…`. Each is bounded local exact-input evidence, not exact-head `c4a02be`, hosted,
integration, full-battery, HUMAN, preview, release, or deployment authority.

Arc 3's canonical finite Mine/Skim actions, Engineering panel/coordinator and committed-only Charter
banking are implemented locally. The panel displays six research rows but only Deep Scanners is
purchasable; its pure orbital-reveal policy exists while current Survey renders no orbital mineral
rows. All 62 fixed recipes are listed, but only connected-effect outputs with exact costs/
preconditions and capacity/revision headroom are actionable; fully exceptional slotted outputs and
disconnected-effect rows remain unavailable. Arc 4 now exposes native Survey-card
Tame/Scavenge/Sample controls over its durable writer: strict 18-namespace boot/Training migration,
full-roster/current-epoch capture, two F4 draws after all-scenario capacity proof, one receipt/CAS,
committed-state verification/publication, source-bound random-pool odds/budget, native Close/reopen
and reload convergence. Current-source Slice passed its exact nine-stage ledger in 336,913 ms
(report `4cc6fe02…`); Glass passed 12 viewports/36 Arc 4 outcomes with every planned control and no
omissions in 71,713 ms (report `03a14ce5…`). Both bind dirty tree `b83ccef5…`; the Slice records
14 burn steps and `recoveryClaimed:false`. Guide is 24 partial/17 unavailable and the draft has 54
bullets; Training remains six lessons plus graduation with no Capture lesson. The uninterrupted
20-minute recovery observation and HUMAN review remain open. Arc 5's V2 model/digest certificate
remains a package foundation, not a companion action. Remaining rows below therefore stay
`[EXEC-TODO]` where broader product outcomes remain absent; no hosted, release or whole-Gate
authority follows.

---

## The distinction this whole file turns on

Every criterion below is tagged, and the tag is the point:

| Tag | Meaning |
|---|---|
| **`[EXEC]`** | A command that passes or fails. No judgment. Runnable today. |
| **`[EXEC-TODO]`** | Should be executable, but the check does not exist yet. Building it is work. |
| **`[HUMAN]`** | Cannot be automated. A person must look, listen, or play. |

**`[HUMAN]` is not a weaker criterion — it is an irreducible one.** This project has nine
logged cases of a check passing while the thing it guarded was broken. The failure mode is
always the same: a criterion that *felt* checkable got a check written for it, the check went
green, and nobody looked. Marking something `[HUMAN]` is a decision that no green tick will
ever substitute for a person, and it is deliberately expensive.

---

## Gate A — baseline integrity

| | Criterion | Evidence |
|---|---|---|
| `[EXEC]` | The exact v1.8.9 baseline is tagged and recoverable | `git show v1.8.9:celestial-frontier.html` — annotated tag at `92098e9` |
| `[EXEC]` | Every executable dependency resolves on a clean machine | `npm run preflight` |
| `[EXEC]` | 50/50 legacy fingerprint | `node tools/validate.js` |
| `[EXEC]` | 10,000 golden seeds reproduce | `npm run goldenseeds` — 178,000 cases |
| `[EXEC]` | Share/champion/where codecs and both genome hardeners reproduce | `npm run codefixtures` — 108 cases, 6 invariants |
| `[EXEC]` | Voice profiles reproduce | `npm run audioprofiles` — 200 profiles |
| `[HUMAN]` | Fixed-seed screens are the intended visual baseline | `port/baseline-v1.8.9/screens/` — 28 shots. **Not** hash-comparable; see that README |
| `[EXEC]` | Negative controls prove the checks discriminate | Each fixture tool documents its controls; all were run before landing |
| `[HUMAN]` | Every intentional deviation is documented | `port/DECISIONS.md` |

## Gate B — domain parity

| | Criterion | Evidence |
|---|---|---|
| `[EXEC]` | Zero unapproved DOM imports in domain packages | `tests/nodom.test.ts` scans every domain source with exact reasoned compatibility exceptions and a negative control |
| `[EXEC-TODO]` | No uncontrolled clock or randomness in every port domain package | Root `validate.js` proves the legacy build; the complete recursive port equivalent and its injected violation control remain required |
| `[EXEC]` | Multi-generation genome parity | `goldenseeds` covers `crossGenome` at 10,000 seeds |
| `[EXEC]` | Combat-stat parity | `goldenseeds` covers `battleStats` |
| `[EXEC]` | Legacy economy manifest/fixed-conversion facts are executable | `@cf/domain-loot` validates all 47 material ids, 62 definitions (20 stackable /42 slotted), 9 slots, 6 literal affixes and magnitude vectors, fixed recipe/prerequisite/Signature graph, recursive bills and salvage-cycle bounds. Focused Arc 2 tests are green. This is conversion/sink truth, not faucet or pacing truth |
| `[EXEC-TODO]` | Complete economy source/formula/faucet parity | Arc 3 supplies canonical finite mining/skimming sources and receipt-backed settlement. Arc 4's live Survey action settles one genuinely-new capture Stardust award with first-only catalogue facts while repeats create only the eligible individual/lot; its source-bound random-pool odds, shared hit-or-miss Biosphere Yield and burn-down are visible, but the uninterrupted 20-minute next-cycle recovery observation and broader pacing remain open. The Arc 2 source-neutral ledger correctly retains its historical `arc3-deferred` field; combat/mission/new-random-loot faucets, broader pacing, five non-Deep-Scanner research purchases, Survey orbital mineral rows and unavailable fixed outputs remain open |
| `[EXEC-TODO]` | **Raw/display rarity separation is an explicit conversion** | ⚠ ROADMAP 9g: the collapse currently lives in `GRADE_TIERS` **data**, with no test. Restoring the old names to rows 10–14 silently reverts every creature surface while `displayRarity` keeps clamping correctly and its tests keep passing. **The port must make this a function and test it.** |
| `[EXEC]` | SessionRNG plans and exact-once product authority are persisted atomically | `player/f4.authority` carries the save-lifetime seed, isolated domain counters and global ordinal; the F3/F4 transaction commits product + next authority + receipt + revision or leaves the same plan replayable. Arc 2 no-RNG actions prove domain counters remain byte-equal while the ordinal advances |
| `[EXEC-TODO]` | Every legacy outcome roll uses that authority through its real action | The exact 24-site audit classifies 14 outcome and 10 presentation calls. Arc 4's player-live real action consumes isolated persisted `captureCandidate` then `captureSuccess` domains after pre-draw certification and proves counter/value binding through hit/miss, refusal, stale and reload browser outcomes; care, combat, training and the other audited outcome writers remain open |

## Gate C — save safety

| | Criterion | Evidence |
|---|---|---|
| `[EXEC]` | `size` round-trips **unchanged** through the load path | `codefixtures` — 6 `sizePreserved` invariants (0, 5, 6, 12, −3, 1e6). ⚠ This is the v1.8.6 save-corruption rule; a port that "tidies" `size` re-creates it |
| `[EXEC]` | Untrusted imports are hardened without NaN or runaway stats | `codefixtures` — `normGenome` over hostile inputs |
| `[EXEC-TODO]` | `conq[].e` migration correct (absent ⇒ ready, clamped to `[0, EPOCH_BASE]`) | Not covered — `buildSave`/`loadSave` are app-layer and unreachable from the probe realm |
| `[EXEC]` | Corrupt primary restores from valid backup without promoting bad bytes | `@cf/persistence` repository/import tests plus the live v2 smoke recovery path and destructive reset controls |
| `[EXEC-TODO]` | Map-shaped progress/award records reject arrays and preserve durable one-time authority | Inject array-shaped `ascProg`/`chProg`/`prime`; exceed the old 4,000-key `xpFirsts` serialization window, reload, and prove no award re-arms |
| `[EXEC]` | Arc 2 exact-instance destructive/actions are revision-checked and stale-safe | Equip, Unequip, Salvage and pending-claim use one lease-fenced F3/F4 receipt/CAS; focused tests plus real Slice/Glass controls cover stale/duplicate/storage/protection/publication/reload convergence without retry |
| `[EXEC]` | Arc 2 carrier migration/replacement is all-or-nothing and mirror-coherent | `inventory/arc2.loot` admits complete Inventory + stackables or lossless `legacy-protected`; corrupt/future/partial input refuses. Legacy Training gear restore replaces carrier + v4 mirror together; source-deferred/current-view preserve it |
| `[EXEC-TODO]` | Every later reward-bearing/destructive mutation is revision-checked and stale-tab safe | Arc 3 fixed fabrication and Arc 4 capture use the shared coordinator plus one lease-fenced receipt/CAS. Arc 4 focused and real-browser controls cover pending non-optimism, storage refusal, stale convergence, one-spend hit/miss, disabled suppression and publication convergence without reroll or second write. Same-parent breed, same-world settlement, mission claim, combat settlement and other later writers must still reject the stale second writer; implemented slices do not certify absent products |
| **`[HUMAN]`** | **A REAL veteran save imports with creatures, worlds, stats, inventory, progression, audio settings and lineages preserved** | ⛔ **BLOCKED — no fixture exists.** A synthetic save is generated by the same code that reads it and proves close to nothing. Needs an export of Nick's iPhone save. **Gate C cannot close without it.** |

## Gate D — engine proof

| | Criterion | Evidence |
|---|---|---|
| `[HUMAN]` | Universe → system → Earth → landing → return works on phone and desktop | Played, not asserted |
| `[EXEC-TODO]` | First interaction within budget | `budgets.json`: **answerable ≤ 1000 ms at 4× CPU**. Today's build is 1944 ms — the port must *improve* it |
| `[EXEC]` | No leaks across repeated travel, Compendium and real Shipyard cycles | Arc 1A's maximum-Compendium ruler passed exact hosted run `32462323775` and merged in PR #32 at `d4ab7e6…`. Arc 1B's `79c605f…` / `e244c9e…` 40/40 scene-memory-v1 certificate remains historical pre-Shipyard authority. Arc 1C product/ruler `a4de5007ffc9131b8bc952a0a4cb469d9139039e` adds normalized ship state, one SVG/DOM Shipyard preview owner and the named HD-surface attachment. `59530da…` / budget `3b71d14c…` / run `20260822-arc1-local-certification` remain historical 42/42 authority for the former Mac-derived 250 ms ruler. Active repair `7d8dc380cd89ef53aac5a11c3850316e19e1aae9`, budget `5c8a6e7568e02d4e31501e4188dba57d3ac6e6ad183882b98ff9c68170771501`, and local no-retry run `20260823-pr33-cross-host-sla-certification` preserve the product/collector/contract and pass 42/42 plus named verification under exact Edge `151.0.4129.101`. Hosted run `32618995487` remains historical terminal-red 40/42 under the retired 250 ms ruler. The repaired changed head then passed terminal-green battery run `32646110946` and merged PR #33 as `8998ffb77ca5b1f3123d7ea776c41db6e23bd24e`. This row is executable; other Gate D rows still prevent whole-Gate closure. |
| `[HUMAN]` | Rings and planet composition read correctly | Art judgment |

## Gate E — creature quality

| | Criterion | Evidence |
|---|---|---|
| `[HUMAN]` | Three radically different procedural archetypes reach commercial quality on phone | The Phase 5 proof. Irreducibly a judgment |
| `[HUMAN]` | Correct anatomy across procedural combinations | `ART_DIRECTION.md` + Addendum A's scored creature rubric |
| `[EXEC-TODO]` | No anatomy failures across a generated sweep | A proof-sheet sweep can *surface* candidates; it cannot *rule* on them |
| `[EXEC]` | Creature identity is preserved from the baseline | `goldenseeds` — `hdGenesFor`, `describeSpecies` |

## Gate F — universe quality

| | Criterion | Evidence |
|---|---|---|
| `[HUMAN]` | Fixed-seed screens pass the art rubric | `port/baseline-v1.8.9/screens/` + `ART_DIRECTION.md`. **Approved by eye** |
| `[HUMAN]` | LOD transitions reveal no blotches, seams or procedural repetition | Explicitly a looking task |
| `[EXEC]` | All 43 biomes remain covered and correctly keyed | `validate.js` biome-profile check; `BIOME_ATLAS.md` §1.1 is the content contract |
| `[EXEC-TODO]` | GPU/resource budget | Exact viewport backing-store caps remain. Arc 1B budgets scene Canvas leases/bytes, live TextureSources, Pixi managed-texture pixels and per-hash inventories, render-target/cache proxies, DOM, heap/backing storage, slope/range, BFCache and answerability. Arc 1C's active `7d8dc380…` / `5c8a6e75…` local Edge `.101` 42/42 certificate extends those proxies through the real Shipyard, its one SVG/DOM preview owner, and the named HD-surface attachment; the former `59530da…` / `3b71d14c…` 250 ms certificate is historical. PR #33's later terminal-green run `32646110946` supplies hosted integration. Chromium still exposes no portable true GPU-byte counter; later filters/particles and physical-device GPU/heat evidence remain open. |

## Gate G — audio quality

| | Criterion | Evidence |
|---|---|---|
| `[EXEC-TODO]` | V2 voice/profile identity preserved | The root `audioprofiles` suite preserves the v1.8.9 baseline under Gate A. The package-only resolver-v1 pipeline now has deterministic signature/profile/call-plan vectors, mutable-field controls and exact-owner/lineage positives over already-normalized inputs. The player app still has only navigation/discovery stings; a canonical creature/save projector, v1-parity disposition, authored renderer and app outcome proof remain open |
| **`[HUMAN]`** | **Human listening confirms appeal and distinction** | **OUTSTANDING — not run.** 12–24 players, audio on vs off, headphones + phone speaker. No automated signal or perceptual oracle can decide appeal or recognizability; profile uniqueness is only a prerequisite |
| `[EXEC-TODO]` | Background / mute / resume lifecycle | The injected runtime now tests mute-before-create, explicit blocked/suspended/running states, hidden shutdown, explicit visibility restart, context-loss replacement, stale async races and disposal. The player app and compatibility stings do not use that owner, and no real `AudioContext`/browser route proves the release behavior |
| `[EXEC-TODO]` | Concurrency stays within budget | Committed package policy defaults to 8 creature emitters/96 nodes and rejects configured maxima above the absolute ≤8/≤120 Gate G caps before context creation. Package controls cover stealing, reservation, sibling pressure and cleanup. Compatibility stings and the app remain outside its accounting, and no browser/device plateau exists |
| `[EXEC-TODO]` | Every current `kingdom\|name` Earth identity resolves to an intentional audio mapping and non-fauna cannot fall through to animal calls | A source-pinned package manifest/witness covers all 1,010 identities/1,014 routes, rejects missing/duplicate/drift/legacy/mammal fallbacks and keeps non-fauna on explicit kingdom policies. It is deliberately one coarse taxonomy per kingdom; authored family mappings, playback and listening remain open |
| `[EXEC-TODO]` | A canonical genome + exact owner + resolver version produces one finite profile/cue plan without consuming gameplay RNG | The pure resolver has finite deterministic profile/call-plan vectors plus selected-field, mutable-field, exact-owner and ordered/reverse-lineage controls. It accepts already-normalized `AudioIdentityInput`; the canonical app genome/save projector and real gameplay-RNG before/after integration proof do not exist |
| `[EXEC-TODO]` | Distant ecology hints derive only from canonical world + already surfaced approach/survey lead or roster + resolver version and cannot reveal hidden species or grant state | The pure plan seam covers canonical-world/surfaced-evidence determinism, different-world, wrong/hidden-owner and silent/non-fauna controls without a state writer. No canonical approach/Survey audio adapter, app audio event, same-granularity counterpart, UI/combat ducking, reduced-intensity behavior or lifecycle playback is wired |
| `[EXEC-TODO]` | Companion expression is selected from a stable call-plan repertoire by a completed event while signature/profile/call-plan bytes remain unchanged | The pure resolver has deterministic settled-event vectors and rejects plan drift, state polling, absence triggers and missing captions while mutable fields stay projected away. Arc 4 capture settles without emitting this expression event; no care/companion event owner, counterpart registry or player playback consumes it |
| `[EXEC-TODO]` | One versioned biome profile binds every visual, ecology and audio consumer across all 43 keys | complete cross-modal join, inventory of every biome-presenting runtime route, deliberately mismatched-profile control, and injected alternate-classifier/bypass control; current biome-key coverage alone does not prove consumer binding |
| `[EXEC-TODO]` | Audio assets are locally owned/licensed, hash-bound and orphan-free | The package pins an authoritative empty manifest and pure validator with missing-row, incompatible-license, hash-drift and orphan controls. No audio asset exists; a nonempty ledger, proof archive, real filesystem/media observation and byte policy remain open |
| `[EXEC-TODO]` | Encoded bytes, decoded buffers, active sources, creature emitters and total nodes plateau under travel/combat/background cycles | The pure lab certifies two equal injected-runtime accounting cycles and keeps browser/byte/device fields explicitly unresolved. An app-owned instrumented browser backend plus suppressed eviction/disconnect/visibility controls and real travel/combat/background workloads remain open |
| `[EXEC-TODO]` | Combat transcript events map to matching audio and visual/caption cues without changing duel outcome | golden duel transcripts covering dodge/stun/crit/status/execute/Guardian motifs |
| `[HUMAN]` | Earth/procedural/hybrid calls are recognizable, non-fatiguing and identifiable on phone speaker, headphones, mono and reduced-intensity mix | blinded specimen↔voice matching, including same-creature/different-expression-state trials; distant-call anticipation-versus-noise and expression warmth-versus-fatigue judgments; long-session real-device listening; never inferred from profile uniqueness alone |

## Gate H — feature-complete beta

| | Criterion | Evidence |
|---|---|---|
| `[EXEC-TODO]` | Complete v2 Field Training is reachable through real actions | Root legacy smoke/layout prove the mature 21-step baseline; current v2 owns six live lessons plus an honest graduation and must add later lessons only with their systems |
| `[EXEC]` | Duel award outcome is tested through the real action — **not a helper call** | `duelxp-check` closes the historical direct-`awardXP()` false green |
| `[EXEC-TODO]` | Every other advertised XP/reward faucet has a real-action outcome test | Six advertised awards still lack one; helper invocation or aggregate-counter mutation is not evidence |
| `[EXEC-TODO]` | `did/saw ≥ 95%` per verb, and `saw/attempt` no worse than the v1.8.9 baseline | The reviewer's §2.4 addition. The second half is what stops the port quietly *losing* reachability during the component rewrite |
| `[HUMAN]` | No P0/P1 defects | Triage judgment |

### Gate H expansion — ships, loot and companions (approved 2026-08-13)

| | Criterion | Evidence |
|---|---|---|
| `[EXEC]` | Maximum-size Compendium mounts/paints only a bounded visible window and plateaus after warmup | Product virtualization, art ownership, focus/filter/detail/Close outcomes, and the owner→worker→painter graph are implemented. Exact run `32462323775` passed the complete changed-head battery and PR #32 merged at `d4ab7e6…`. PR #34 runs `32665404776` and `32677088518` later exposed native virtual-row ruler defects, not leaks. The second proves the first activation/receipt repair worked, then a Close/reopen point moved across the deferred render boundary and 112 passive observations could not reposition it. Collector `6d681d19…` now requires native-scroll repositioning and the same exact owned point before/after double-render plus thumbnail settlement before its one click. Measurement `6a961df8…`, activation `d21ba26…`, and active budget `faa160b3…` retain three 78/78 candidates, the paired 14-phone/13-desktop broken baseline, and unchanged numeric ceilings. Exact-budget run `20260823-pr34-render-stable-row-certification` passed 78/78 plus named verification (raw/gzip `42753d5e…` / `a2ff5b00…`). Six-image HUMAN judgment remains separate, Arc-local Edge 151 does not repin Gate A, and no new hosted attempt is authorized. |
| `[HUMAN]` | The maximum Compendium's 132px list art, 440px detail art, hierarchy and focus treatment read correctly on phone and desktop | **OUTSTANDING — not run.** Review six fresh run-bound list/detail/focus-pinned images. Automated geometry, reachability and resource evidence cannot certify visual quality or focus feel |
| `[EXEC]` | Ship art, installed-system captions and travel reach derive from one normalized state | Product/ruler `a4de5007ffc9131b8bc952a0a4cb469d9139039e` makes travel, captions, four SVG chassis, exact `array`/`autoext`/`cscoop` hardpoints and diagnostics consume one unsaved projection. Unit/integration/browser controls cover 64 normalized cases, all eight hardpoint permutations, reload-shaped reconstruction, imported-veteran fallback, friendly-alias rejection, deliberately mismatched selectors, one-preview ownership and real opener/Close state parity. Active repair source `7d8dc380cd89ef53aac5a11c3850316e19e1aae9` passed the current scene-memory-v2 42/42 certification and named verifier under budget `5c8a6e75…`; `59530da…` / `3b71d14c…` remains historical. Terminal-green run `32646110946` then merged this evidence in PR #33. |
| `[HUMAN]` | Inventory item treatment and every ship stage read clearly at phone row, inspector and native scales | **OUTSTANDING.** Exact Inventory rows/detail/comparison and all four Shipyard stages are now reviewable, but automation cannot judge item-art hierarchy, conditional-copy comprehension, appeal or silhouette strength; the bespoke paper-doll/item-art layer remains open. |
| `[EXEC]` | Gear instances migrate, equip, unequip, salvage, pending-claim and persist by exact identity | Strict codecs/fixed-point tests cover duplicate-base identity, equipped legacy affix ownership, corrupt/future rows, full-inventory pending state and lossless capacity/byte protection. Local real Smoke/Glass drive action publication, raw/runtime/DOM parity and reload; the evidence is dirty-input/local, not hosted or Gate closure |
| `[EXEC-TODO]` | New loot is source-deterministic, authored-compatible and impossible to reload-reroll or double-claim | Stable instance/receipt construction and legacy vectors exist, but production occurrence pools/rates, natural-affix compatibility, crafted modifier/drawback, upgrade/socket tables and dispatch/Guardian receipts remain open. Injected claim-time roll, duplicate apply and incompatible-affix controls belong with those writers |
| `[EXEC-TODO]` | Catalogue species and owned creatures are separate; every mutation targets a stable creature ID | Ownership-v1/v2 codecs model stable catalogue/specimen/fauna identities, receipt provenance, ordered lineage and tombstones. The player-live Arc 4 writer creates first-only catalogue facts and stable-ID fauna individuals or specimen lots, with repeat and browser/reload controls. Duplicate-species migration plus breed/feed/combat/delete/assignment outcomes remain required |
| `[EXEC]` | Tame/Scavenge/Sample are the finite acquisition writers for catalogue pages, specimens and owned fauna | Native Survey controls bind exact nav/address, the production full roster/current epoch and all-scenario capacity before two F4 draws; they spend on hit or miss and commit first-only reward, repeat individual/lot, one receipt/CAS, exact committed verification and targeted publication. Source-bound random-pool odds/budget, presentation-semantics fencing, native Close/reopen and storage/stale/publication/reload outcomes are browser-proved across the exact-input Slice/Glass pair. This row does not claim the separate 20-minute recovery observation, HUMAN journey review, Charter bioscan, targeted preview, hosted or release authority |
| `[EXEC-TODO]` | Companion missions use active play and exact-once transactional receipts | clock-wind, reload, double-click, write failure, inventory-full, wrong assignment and stale-tab/CAS controls |
| `[EXEC]` | Auto-Extractor cannot accrue from wall-clock wind or repeat its bounded batch after reload | Arc 3 computes capped matured loads from the prior F4 active-play cursor inside the plan, preserves remainders, discards loads beyond finite reserves, ignores legacy wall timestamps, and reanchors newly fabricated extractors. Planner/app tests cover forged time, reload-shaped migration and cursor publication; the bounded local Arc 3 Slice/Glass pair is green, while exact-head/full-battery and HUMAN evidence remain separate |
| `[EXEC-TODO]` | Conquest loss pays the advertised +3 base and at most +2 near-brink delta in either encounter order | both non-brink→brink and brink→non-brink real-action sequences; repeated settlement and stale-tab controls |
| `[EXEC-TODO]` | A mission never silently loses a bonded companion or expires a ready reward | transition-table tests plus real UI reachability and explicit irreversible-mode confirmation if one exists |
| `[HUMAN]` | Progression creates mastery, readable choice and attachment without pressure mechanics | multi-session play review; no streak/FOMO/paid-random/expiry/energy/notification-pressure design |

### Gate H human product-play cadence — required for the completed loop

This is a product-quality study, not a retention experiment. It begins only once the relevant
arcs are actually playable from a clean save; automated personas, screen hashes, funnel counts and
time-in-app are never substitutes. Each report records the exact commit/preview/save/device/input
and observed confusion or delight, with at least one phone, one desktop and applicable reduced-
motion/keyboard/screen-reader lens. The assessment vocabulary is clarity, agency, meaningful
choice, delight, attachment, fatigue and accessibility—not return-rate targets, streak completion
or engagement pressure.

| | Criterion | Evidence |
|---|---|---|
| `[HUMAN]` | First 30–60 minutes form one understandable Arc-4.5 journey: Survey an opportunity → Gather → Build → Tame → visibly improve the ship → reach farther → Return | Fresh-player facilitated sessions; players explain their next self-chosen goal and complete a real, persistent loop without a hidden-system workaround. Combat/risk is optional and is not a prerequisite for this gate |
| `[HUMAN]` | The first three sessions create a coherent personal plan rather than parallel grind bars | Session notes track whether players can distinguish reach, access, efficiency, survivability and expression; record choices deferred, changed or regretted without treating continued play as success |
| `[HUMAN]` | A 90–120 minute sustained session stays legible, exciting and physically comfortable | Observe cognitive/visual/audio fatigue, repetition, heat/battery, memory symptoms, motion/mono/reduced-intensity preferences and a natural stopping point; Gate D/G/I technical evidence remains separate |
| `[EXEC-TODO]` | Chronicle/Museum entries are receipt-backed, bounded and referentially stable | Rename, migration, reload, duplicate-catalogue and removed/retired-creature controls; inject an orphan, duplicate receipt and second-event-store attempt |
| `[HUMAN]` | Chronicle/Museum and any later optional Outpost/project layer feel authored and readable, not like a score wall or maintenance chore | Player review of chosen memories, companion/ship/world history and project before/after states; finite inputs and optionality remain obvious, with no daily/idle-income/urgency pressure |

## Gate I — release

| | Criterion | Evidence |
|---|---|---|
| **`[HUMAN]`** | Physical iOS / iPadOS / Android / desktop matrix | ⛔ Outstanding for **four rounds**. No harness has ever seen this game on real iOS |
| `[EXEC-TODO]` | Accessibility audit | Partially covered by `uilayout` (44px touch floors, focus order) |
| `[EXEC-TODO]` | Performance and heat budgets | `budgets.json` sets bundle + answerability; Arc 1A's Compendium ruler passed exact run `32462323775` and merged in PR #32. Arc 1B's exact Edge `.93` 40/40 certificate remains historical. Arc 1C's former `59530da…` / `3b71d14c…` 250 ms local certificate is historical; active `7d8dc380…` / `5c8a6e75…` defines strict `<1000 ms` and passed current local Edge `.101` run `20260823-pr33-cross-host-sla-certification` 42/42 plus named verification. Hosted run `32618995487` is historical terminal-red 40/42 under the superseded 250 ms ruler; repaired run `32646110946` then passed terminal-green and merged PR #33. True GPU bytes and physical-device heat/battery remain open, so this row and Gate I stay open. |
| `[EXEC-TODO]` | PWA offline / update rollback | Nothing exists today |
| `[HUMAN]` | Save export and recovery path works for a real player | Same blocker as Gate C |

---

## The standing laws every gate inherits

From `PROCESS_LAWS.md` — these are not gate-specific, they are how any check must be built:

1. **When a new instrument fires — or passes — suspect the instrument first.** Nine
   instances. The most recent was a `preflight` check that reported PASS while the gate it
   guarded could not run at all, caught only by negative-controlling it.
2. **Assert the outcome, not the code path.**
3. **Painted ≠ answerable.** Measured here as 355 ms vs 1944 ms at 4× CPU.
4. **Negative-control every new check in both directions.** Break the build on purpose and
   confirm the check fails. Every fixture tool in this directory documents its controls.
5. **Two correct fixes for one bug can disagree.** Grep every reader, every writer — and
   every *comment* that reasons about the field (added 2026-07-31, ROADMAP 9f).

## What this file does not do

It does not restate the system docs. `WORLD_GENERATION.md`, `SPECIES_AND_GENOME.md`,
`COMBAT_AND_CONQUEST.md`, `SAVE_SYSTEM.md`, `AUDIO.md`, `ART_DIRECTION.md`, `BIOME_ATLAS.md`,
`RARITY_AND_GRADES.md` and `RARITY_UNIVERSAL.md` remain the descriptions. This is the
checklist that says which of their claims the port must *prove*, and by what means.

**The honest summary:** of the criteria above, roughly half are executable today, a third are
`[EXEC-TODO]`, and the rest can only ever be judged by a person. The two that most directly
block Phase 0 from closing — a real veteran save, and the human listening test — are both
`[HUMAN]`, and neither can be worked around by building a better tool.
