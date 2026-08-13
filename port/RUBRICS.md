# Acceptance rubrics — what "done" means, per gate

**Port Phase 0 / Gate A deliverable:** *"elevate `ART_DIRECTION.md`, `AUDIO.md`,
`PROCESS_LAWS.md` and the system docs into acceptance rubrics."*

A **description** says how the system works. A **rubric** says how you know the port got it
right. This file converts the former into the latter, gate by gate.

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
| `[EXEC-TODO]` | Economy table/formula/faucet parity | The 47-material/62-item/9-slot/6-affix source facts are documented, but complete executable manifests, golden affix vectors and real-action faucet outcomes are not covered |
| `[EXEC-TODO]` | **Raw/display rarity separation is an explicit conversion** | ⚠ ROADMAP 9g: the collapse currently lives in `GRADE_TIERS` **data**, with no test. Restoring the old names to rows 10–14 silently reverts every creature surface while `displayRarity` keeps clamping correctly and its tests keep passing. **The port must make this a function and test it.** |
| `[EXEC-TODO]` | Outcome rolls draw from a seeded `SessionRNG` | The reviewer's §2.1 addition. 11 outcome rolls use bare `Math.random()`, so no capture can be pinned in a fixture and no bug report can be replayed |

## Gate C — save safety

| | Criterion | Evidence |
|---|---|---|
| `[EXEC]` | `size` round-trips **unchanged** through the load path | `codefixtures` — 6 `sizePreserved` invariants (0, 5, 6, 12, −3, 1e6). ⚠ This is the v1.8.6 save-corruption rule; a port that "tidies" `size` re-creates it |
| `[EXEC]` | Untrusted imports are hardened without NaN or runaway stats | `codefixtures` — `normGenome` over hostile inputs |
| `[EXEC-TODO]` | `conq[].e` migration correct (absent ⇒ ready, clamped to `[0, EPOCH_BASE]`) | Not covered — `buildSave`/`loadSave` are app-layer and unreachable from the probe realm |
| `[EXEC]` | Corrupt primary restores from valid backup without promoting bad bytes | `@cf/persistence` repository/import tests plus the live v2 smoke recovery path and destructive reset controls |
| `[EXEC-TODO]` | Map-shaped progress/award records reject arrays and preserve durable one-time authority | Inject array-shaped `ascProg`/`chProg`/`prime`; exceed the old 4,000-key `xpFirsts` serialization window, reload, and prove no award re-arms |
| `[EXEC-TODO]` | Every reward-bearing/destructive mutation is revision-checked and stale-tab safe | Same-parent breed, same-world settlement, capture spend, exact-instance salvage and mission claim controls must reject the stale second writer |
| **`[HUMAN]`** | **A REAL veteran save imports with creatures, worlds, stats, inventory, progression, audio settings and lineages preserved** | ⛔ **BLOCKED — no fixture exists.** A synthetic save is generated by the same code that reads it and proves close to nothing. Needs an export of Nick's iPhone save. **Gate C cannot close without it.** |

## Gate D — engine proof

| | Criterion | Evidence |
|---|---|---|
| `[HUMAN]` | Universe → system → Earth → landing → return works on phone and desktop | Played, not asserted |
| `[EXEC-TODO]` | First interaction within budget | `budgets.json`: **answerable ≤ 1000 ms at 4× CPU**. Today's build is 1944 ms — the port must *improve* it |
| `[EXEC-TODO]` | No leaks across repeated travel, Compendium and future Shipyard cycles | V2 now has Pixi and bounded replacement-reload teardown, but ordinary Canvas/Pixi ownership and a warm memory plateau budget remain open |
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
| `[EXEC-TODO]` | GPU/resource budget | The v2 Pixi slice has exact viewport backing-store caps, but scene texture/filter/particle counts and long-session GPU-memory plateau are not yet budgeted |

## Gate G — audio quality

| | Criterion | Evidence |
|---|---|---|
| `[EXEC-TODO]` | V2 voice/profile identity preserved | The root `audioprofiles` suite preserves the v1.8.9 baseline under Gate A; v2 has only navigation/discovery stings today. This row becomes executable when the typed v2 resolver has deterministic profile/cue vectors and negative controls |
| **`[HUMAN]`** | **Human listening confirms appeal and distinction** | **OUTSTANDING — not run.** 12–24 players, audio on vs off, headphones + phone speaker. No automated signal or perceptual oracle can decide appeal or recognizability; profile uniqueness is only a prerequisite |
| `[EXEC-TODO]` | Background / mute / resume lifecycle | Release-blocking per §15.1. `DECISIONS.md` §2 settles the behaviour; the check does not exist |
| `[EXEC-TODO]` | Concurrency stays within budget | ⚠ `budgets.json`: **there is no cap today.** Proposed ≤8 simultaneous creature-call emitters within the device-class full-mix budget, and ≤120 total live Web Audio nodes |
| `[EXEC-TODO]` | Every current `kingdom\|name` Earth identity resolves to an intentional audio mapping and non-fauna cannot fall through to animal calls | complete 1,010-identity /1,014-route manifest check plus a forced mammal-fallback control |
| `[EXEC-TODO]` | A canonical genome + exact owner + resolver version produces one finite profile/cue plan without consuming gameplay RNG | deterministic profile vectors, lineage/reverse-parent controls and simulation-RNG before/after equality |
| `[EXEC-TODO]` | Audio assets are locally owned/licensed, hash-bound and orphan-free | machine-readable rights manifest; missing/incompatible license, changed hash and orphan controls |
| `[EXEC-TODO]` | Encoded bytes, decoded buffers, active sources, creature emitters and total nodes plateau under travel/combat/background cycles | instrumented browser backend; suppressed eviction/disconnect/visibility cleanup controls |
| `[EXEC-TODO]` | Combat transcript events map to matching audio and visual/caption cues without changing duel outcome | golden duel transcripts covering dodge/stun/crit/status/execute/Guardian motifs |
| `[HUMAN]` | Earth/procedural/hybrid calls are recognizable, non-fatiguing and identifiable on phone speaker, headphones, mono and reduced-intensity mix | blinded specimen↔voice matching and long-session real-device listening; never inferred from profile uniqueness alone |

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
| `[EXEC-TODO]` | Maximum-size Compendium mounts/paints only a bounded visible window and plateaus after warmup | 1,500-row raw-CDP fixture; decoded-pixel/job/DOM/resource counters; deliberately unbounded and no-disposal controls |
| `[EXEC-TODO]` | Ship art, installed-system captions and travel reach derive from one normalized state | all four chassis stages, hardpoint permutations, imported veteran fallback, save/reload, deliberately mismatched selector control |
| `[HUMAN]` | Inventory portrait and every ship stage read clearly at phone row, inspector and native scales | fixed proof sheet + real phone/desktop review; automation cannot judge appeal or silhouette strength |
| `[EXEC-TODO]` | Gear instances migrate, equip, salvage and persist by exact instance identity | legacy fixtures, fixed-point migration, duplicate-base distinct rolls, corrupt/future rows, inventory-full behavior |
| `[EXEC-TODO]` | Loot is deterministic, compatible, bounded and impossible to reload-reroll or double-claim | golden table vectors + dispatch/Guardian receipts; injected claim-time roll, duplicate apply and incompatible affix controls |
| `[EXEC-TODO]` | Catalogue species and owned creatures are separate; every mutation targets a stable creature ID | duplicate-species companions, migration, breed/feed/combat/delete/assignment outcome tests |
| `[EXEC-TODO]` | Tame/Scavenge/Sample are the finite acquisition writers for catalogue pages, specimens and owned fauna | real-action success/miss, Biosphere spend/recovery, genuinely-new reward, reload-reroll, duplicate creature and stale-tab controls |
| `[EXEC-TODO]` | Companion missions use active play and exact-once transactional receipts | clock-wind, reload, double-click, write failure, inventory-full, wrong assignment and stale-tab/CAS controls |
| `[EXEC-TODO]` | Auto-Extractor cannot accrue from wall-clock wind or repeat its bounded batch after reload | migrate to the dedicated persisted active-play clock; injected forward/backward device-clock control and absent-field migration |
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
| `[EXEC-TODO]` | Performance and heat budgets | `budgets.json` sets bundle + answerability; memory/GPU pending Phase 3 |
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
