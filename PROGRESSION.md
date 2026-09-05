# Celestial Frontier — Player Progression

## Overnight Batch 4 — checkpoint 2c implementation, 2026-09-05

Matches the current recovered implementation; `ROADMAP.md` owns gate acceptance. Signed core
`5377069` is joined to fresh-start develop `9ea0104`: authored Research effects, explicit
Discover Life/one Survey-hazard receipt, nonlethal Flora meal, pre-action Scout +2 XP capped at
486 in capture's receipt, read-only Chronicle/Museum and analytical economy scenarios.
The accepted Discover Life Starter Charter completes only on a later explicit Bioscan for its
established 15 Stardust and Earpiece in the same F4 receipt/CAS; no earlier Survey or Capture
backfill. Exact gear publication, empty-slot equip, capacity and stale/storage refusals remain.
Landing now uses the authored terrain/biome and seeded-weather descent policy with shown chance
and HP risk. Earth, Training and proven canonical revisits roll nothing; ordinary attempts own
two SessionRNG draws and one receipt/CAS. A wave-off leaves orbit, HP at least 1 and canonical
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
backfill or repeated hazard is invented. Static portraits remain unchanged. Individual progression
presentation and mature Atlas remain later checkpoints.
Weekly Charters stay parked. Existing tables and eighteen Arc 4 namespaces/v5 topology govern.
V2 has no legacy player import door; codec/evidence importBlob remains. The draft has 79 bullets
at this checkpoint. Real-device v2 persistence and combined Arc 4.5 / separate Arc 5.5 HUMAN
reviews stay open. `ROADMAP.md` owns exact checkpoint outcomes and unattended decisions.

> **2026-09-04 current beta research-consequence and explorer-meal overlay (matches local v2 code
> as of 2026-09-04; supersedes older research-availability claims while preserving their dated
> history):** all six Engineering research rows now have live consequences. **Deep Scanners** reveal
> bounded orbital mineral veins; **Reinforced Hull** reduces hostile bioscan wounds by 25% before
> worn wound reduction; **Xenobotany Lab** gives a safe Flora meal +1 additional stat nourishment;
> and **Fusion Drive**, **Antimatter Drive** and **Warp Fold** supply the established 2×, 4× and 8×
> travel-speed bases, with registered worn speed added to the selected base.
>
> Explorer Flora meals are now player-reachable from an exact Flora Compendium detail. The card
> selects the one canonical matching owned lot and previews heal, poison and the deterministic
> nourished stat before one **Eat 1** press. Every outcome consumes one exact specimen. Safe meals apply worn heal
> gear, restore HP and raise the seeded stat by `1 + floraTier + (lab1 ? 1 : 0)` up to 330; a toxic
> meal grants neither healing nor stat growth, ignores heal gear for its damage ruler, and remains
> nonlethal. Vitality growth recomputes maximum HP and tops up the increase. The exact ownership lot,
> explorer physiology, receipt and F4 authority commit atomically without retry or precommit copy.
> Safe healing joins `fieldmedic`; surviving a safe meal above 40% poison risk also joins `gambler`.
> Explicit hostile Discover Life joins `survivor` whether its nonlethal wound lands on the Field Scout
> or explorer. These share their owning action's receipt/CAS; only `daily` and `decade` remain
> event-owner blocked, for **26 exact event joins / 2 blocked**.
>
> A successful Tame, Scavenge, or Sample that catalogues a genuinely fresh species gives the Field
> Scout standing before that attempt up to +2 XP in the same capture receipt/CAS, capped at 486.
> A 485-XP Scout gains 1; a capped Scout gains 0; no standing Scout, miss, or repeat species grants
> Scout XP. This changes no genome, lineage, role selection, or capture pool.
>
> The Records board also presents a read-only **Expedition Chronicle & Museum** from already-owned
> facts: at most 60 rows each for latest-receipt battles, canonical first-species discoveries,
> Signature-ordered Prime victories without invented dates, and latest-first Legacy Journal entries.
> It adds no writer, reward, RNG, mission, share card, save field, or global cross-gallery timeline.

> **2026-09-02 current PR #35 battery-ownership overlay (supersedes every older “current” label;
> all dated progression/evidence blocks below remain immutable):** hosted run `33584052508` tested
> exact head `18c088de4388edf58eda2c192b71cb94156e26e7` against base
> `7a9f4c1370dd84292388d718c38ff34214f6203b` once with no retry. Layout passed **787/787**;
> the first and only red was the production-quarantined SceneMemory fixed-eighth phase-validity
> synthetic allocator selftest,
> before the develop admission chain began. The authorization is consumed and no hosted authority
> remains.
>
> The local uncommitted successor makes all live SceneMemory native-heap work
> **production-only/quarantined** while deterministic controls remain universal. Develop admission
> is **Compendium → Slice → Glass**; production/release, only after explicit SceneMemory activation,
> is **SceneMemory → Compendium → Slice → Glass → Recovery** on unchanged source. This changes no
> progression, Charter, achievement, reward, creature or save behavior and closes no progression
> criterion. See `ROADMAP.md` for the live handoff and `port/v2/README.md` for the canonical battery
> commands.

> **2026-09-01 current progression-ceremony green evidence overlay (matches exact signed code;
> supersedes older “current” labels while preserving every dated block):** exact SSH-signed source
> `4a4f0b81c85eee32c538a29d8b46f55af73ae7bb` (tree
> `25cb76916c8f3fcd00a916864abb9402932cdbec`) passed the complete browser-free profile at
> **263 files / 2,719 passed / 1 skipped**. The same unchanged source passed the named-verified,
> once/no-retry chain: Compendium `20260902020238003-42290-3e0d5a9601` **78/78**, zero findings;
> develop Slice `20260902020406920-42750-f6dc8783b4cd`, zero findings/scopes, report/log SHA-256
> `56088a0c5cc03fc45150b937a0cd9e38f054fedcf7df97de0dfe1ba411cd591d` /
> `05b69008a783488af9fbdc0a802119ff0c6c223ab737c48027bae450f0eb2276`; and Glass
> `20260902021048274-43570-053d2c926673`, **12/12** viewport/reload outcomes and **104/104**
> controls with zero findings/instrument failures, report SHA-256
> `df8767c9d2d00843426fe68cab58b59a64043092d7ba5700476425746e5226b2`. Four exact retained
> carriers under `audits/` bind the Compendium report, Slice report/log and Glass report.
>
> The progression-ceremony drain now proves its queue remains intact before any shift while
> `productActionInFlight` belongs to a newer receipt-bearing action, then resumes the deferred
> ceremony exactly once after product/toast ownership clears. The same certificate also covers the
> dynamically observed, deadline-clipped Guide tail and D-TRAIN's stable
> raw/live/focus/pending-cleared bulletin fixed point. Ceremony presentation ordering is the sole
> product behavior change: the legacy game, achievements, ranks, Charters, rewards, loot,
> deterministic generation, save schema, creatures/plants/biomes/Guardians, audio, CSS, numeric
> rulers, browser pin/version policy and no-retry policy are unchanged. Hosted run `33572309149`
> remains immutable red and its ninth
> authorization consumed; no new hosted attempt, push, merge, release, version bump, publication or
> deployment is authorized.

> **2026-09-01 current progression-ceremony ownership correction (matches local code as of
> 2026-09-01; supersedes older “current” labels while preserving dated evidence):** PR #35's
> ninth one/no-retry hosted attempt tested exact head
> `efad4b44c86ad89cbed39c18a39e2bbc9370caaf` through synthetic merge
> `778d3cf58937476a65c550e875b946290c0967b4`. Its Charter recovery outcome was exact, but an
> older queued Share-achievement ceremony surfaced while the newer Landing transaction was still
> held, so the expected one aggregate notice advanced the toast serial twice.
>
> Main now checks `productActionInFlight` before it shifts or delivers the serial ceremony queue.
> An active receipt-bearing owner leaves every queued ceremony intact and re-arms the drain after
> 200 ms; replacement reload may still clear the queue, and an already-visible toast still delays
> delivery. The Landing/Charter aggregate therefore retains the immediate outcome surface, while
> the older ceremony resumes exactly once after product ownership and toast ownership allow it.
> Smoke-only callback/deferral/delivery counters prove that boundary without adding save state.
> Achievement, rank, Charter, reward, RNG, copy and sting rules are unchanged. The hosted run
> remains immutable red, and this changed source has no new browser certificate yet.

> **2026-09-01 current automatic-arrival transient-latch progression overlay (matches local code
> as of 2026-09-01; supersedes older “current” labels while retaining dated evidence):** authorized
> PR #35 run `33522000552` tested exact head
> `6f6fb4fbb80ebdc685fd073ac6b06a1496a8f921` against develop base
> `7a9f4c1370dd84292388d718c38ff34214f6203b`. Compendium passed; the one/no-retry Slice then
> stopped when universe-to-galaxy zoom failed to reach its browser outcome within 6 seconds. A
> transient persistence refusal had consumed the automatic galaxy-arrival one-shot latch before
> any accepted attempt; wormhole traversal carried the same latent ordering defect.
>
> The direct-travel owner now reports synchronous acceptance only after it has claimed the shared
> coordinator and installed its `activePersist` ownership, before the first await. Galaxy arrival
> claims its latch only from that callback; wormhole begin derives its accepted result and claims
> its automatic-key latch inside the same callback. The same unchanged zoom intent remains retryable while persistence is held,
> then settles exactly one travel commit after release. This
> changes no Charter, arrival/event award, achievement, rank, reward, reach, balance or deterministic
> generation rule. The non-mutating diagnostic hold creates no save write, revision or receipt, and
> Slice may accept `migrated-v4` only for its explicitly bound initial exact document. Exact clean
> SSH-signed source `a45220421195042a8702aa1265e96d40d839fc38` passed the tracked-input develop
> profile at **259 files / 2,665 passed / 1 skipped**. On that unchanged source, named-verified
> Compendium `20260901164254371-82172-eaeba62d1a` passed **78/78**; named-verified Slice
> `20260901164421191-82525-616ea739fbb1` passed with report SHA-256
> `d9c4abec7764d37bb029d115d2162931ccc5ffaf3fb26754d2ab3881a4bd902b`; and exact-Slice-bound
> named-verified Glass `20260901165038911-82999-7c3323ea05c7` passed **12/12** viewport classes
> with report SHA-256 `2554d6843a198ee02b3a417bb77ea035f2c73bc4db47ff0124e6ccb1783fc887`.
> Each browser stage ran once with no retry. No timeout, retry, browser
> pin or hosted authority was added, and no push or merge is authorized.

> **2026-09-01 current Share progression/waiter-scope overlay (supersedes every older “current”
> label below; dated evidence remains immutable):** exact clean SSH-signed source
> `4a595e2fa3305bf2531fc4051d09314490587e83` closes the earlier 3f8f870 harness-only lexical red
> without changing Share owner-plus-conditional-aggregate semantics, achievements or rank rules.
> Its tracked-input develop preflight passed **259 files / 2,660 passed / 1 skipped**; browser-CDP
> selftest and live Edge preflight passed. Compendium `20260901123144352-62163-00064c788a`
> passed **78/78** and named verification. Exact-source Slice
> `20260901123326914-62541-f7f7c336aa70` passed and named-verified with report SHA-256
> `19833fe4a24dcbc12367e2bcde5b5be3da33578e278e5b3c29b4943357e4b7dd`. Glass
> `20260901123953804-63082-f5844810dfb5` consumed that exact Slice, passed all **12/12** viewports
> and named verification, and has report SHA-256
> `a4f6d9b1431e47cf87d7a53c49758af3a6d0244e0ba749368dda579de30bf597`. Each browser stage ran
> once with no retry.
>
> The shared waiter now belongs to the enclosing execution scope used by both full-journey and
> outcome-controls modes; the Acorn audit binds its single declaration to all five direct calls and
> keeps the re-gated mutant red. This remains a harness-only repair with no product or progression
> change. Edge `152.0.4191.53` / CDP `1.3` is provenance only; compatible point updates never
> require a rebaseline. No hosted attempt, push, merge, release, version bump, publication or
> deployment followed from this local certificate.

> **2026-08-31 historical local a046 collision-control repair overlay (superseded by the current
> overlay above and every older
> “current” label below; dated progression and evidence checkpoints remain immutable):** exact
> clean SSH-signed source `a0460c6aca37ca923768828cde876e449a76cff8` passed Compendium
> **78/78** once/no-retry as `20260831155807329-24237-1c6d2e89d5` in **64,166 ms** with named
> verification. Its exact-source develop Slice `20260831155943782-24588-a98f13f2c7b7` stopped
> terminal red once/no-retry after **359,647 ms** with one
> `world-identity-collision-controls-failed` scope; named verification exited 2 and Glass did not
> run. The base world-identity collision outcome and all product progression state were green.
>
> The runner mixed newest-first Atlas rows `[Beta, Alpha]` with receipt order `[Alpha, Beta]`,
> leaving its pointer mutant inert. Signed repair/evidence commit
> `23eb6dabeaf40cf0bc7878272b4f4893ad422113` derives a distinct measured sibling, rejects inert/equal
> cases, causal-stops a red base and executes a reversed-order regression. Existing Charter rules,
> rewards, achievements, ranks, save authority, creature/genome identity, biome and art structures
> are unchanged; no gameplay, ruler, timeout, retry or Edge contract changed. Focused coverage is
> **1 file / 6 tests** and independent review is **CLEAR**.
> **A New Foundation** remains **77** bullets with ordered SHA-256
> `11483b3d1e9c2760a00354e6511a27889e62a4f092ee6847589dc1b7a0bfb2c1`.
>
> The complete develop profile is green at **253 files / 2,561 passed / 1 skipped**, all TypeScript
> programs, **34** art sources, **1,014/1,014** routes and **454** non-inert fields. Current
> Compendium producer/budget authority remains
> `8d0600bbe98ff786818f05d3dff4f1b8da7dd9703863a9575df026b91755ca2b` /
> `e9c978bfdb885da8cbc6002c0f9af416d96120ca26a617b3758b898652b85a01`. A fresh signed candidate
> and one unchanged-source **Compendium → Slice → Glass** chain remain. SceneMemory is
> production-only. No hosted attempt, push, merge, release, version bump, publication or deployment
> is authorized.

> **2026-08-30 historical local aggregate-follow-up UI release correction (matches local code and
> supersedes narrower current overlays below):** aggregate progression still owns only its one
> coalesced receipt/F4 CAS, canonical achievement append and monotonic best-rank mirror. A capture
> can queue that follow-up before its awaiting Survey repaint; the repaint is correctly read-only
> while Arc 9 owns the shared coordinator. Arc 9 now fully releases product/persistence authority
> before guardedly republishing a still-current visible writable non-Training Capture surface.
> Replacement, convergence, ecology, coordinator or presentation failure remains fail-closed. This
> changes no achievement/rank rule, reward, receipt ordering, Capture pool/Yield/RNG, save schema or
> creature identity. Exact 656 evidence isolated the stale-disabled card before any storage hook;
> the bounded successor is focused browser-free green and awaits a fresh no-retry browser chain.
> Its cumulative **A New Foundation** bulletin has 75 unique bullets with rendered ordered SHA-256
> `52db4f0084c100980d98ae6b847af2ffc0cbbd7430758b77a14b56bb83eac6e1`.

> **2026-08-30 historical exact-`8bdf474…` evidence / Arc 0 publication-oracle repair overlay (matches the local
> working tree and supersedes narrower “current” status below; dated progression evidence remains
> immutable):** exact clean SSH-signed evidence source
> `8bdf474e92467652729a6980f706ca3a2813682c` passed Compendium **78/78** once/no-retry in
> **64,108 ms**. Its unchanged Slice
> `20260830-pr35-arc3-8bdf474e9246-slice-certification` stopped terminal red once/no-retry after
> **111,490 ms** with exactly one Arc 0 Landing publication-oracle scope. The exact carriers and
> replay are preserved; the stored Slice remains FAIL, and Glass and Recovery did not run.
>
> The retained old-document state proves the Landing product was exact and its Pertar card correctly
> remained open; the stale oracle also required that post-Survey card to be closed. The replay
> binds that contradiction and its missing historical held `cardCode`/target capture; the current
> uncommitted runner atomically captures those values and moves the complete future decision into
> browser-free contracts. No Charter, reward, rank, achievement, save schema, gameplay, retry or timeout changes
> follow; prior focus, Survey-predecessor, coordinator and Arc 5 v3 repairs remain. Final
> browser-free validation is green at **251 files / 2,501 passed / 1 skipped**, with all TypeScript
> programs green. The cumulative **74-bullet** development bulletin has rendered
> ordered SHA-256
> `050b8cbf52bc3eeb2a247acd8ecb5c1e01d123bf2e00c19c8f08eafe7d44e892`.
>
> Active derived Compendium producer / index / owner / generated-service-worker authority is
> `f2f1629a98962801a740d0448d955d08c1ccd9157149edb42169bf0a317e43f3` /
> `45fc756d924fabd03b3b214e0fd80697e463c59a686a190fcee2b076d05de27c` /
> `assets/main-BYnoCcc9.js` (`13afe063806bca9b829866070c08741ea0749ca07c1d7dcecf3175c1dae9bfa5`) /
> `5a968f36984021e39a0cb9e70b2ec37b607563c08a29240b078b828f3d0607d3`. Current Scene build
> authority is `9351f6fc2311365a5dfc8a4c0b0629d862d7c91f6cd00a83e236b1ce824a6e17`; Compendium / Scene
> budget-file SHA-256 is `c4f6dddffdf88e42819c567c26132a66f3924a7423002cbfca4564e2defb9d0b` /
> `670f8ecc2c0bc5715fb92b263820db577a70c3faf254151ff11f45de8fe645f7`. Fixed rulers, numeric
> ceilings, historical samples and 78 outcomes are unchanged; compatible Edge point versions are
> provenance only. No fresh repaired-head browser, Glass, Recovery, Gate, HUMAN, hosted, merge,
> release, version or deployment authority is claimed.

> **2026-08-30 current Mine/Starter-Charter atomicity clarification (matches local code):** a real
> durable Mine action owns both extraction and any qualifying accepted `st-mine` settlement in its
> single F4 receipt/CAS. For the exact retained veteran fixture, the valid successor appends
> `st-mine` to `chs`, canonicalizes `chp['st-mine']` from the imported over-complete value 2 to the
> authored completion target 1, removes `st-mine` from `chacc`, advances honored `charters` 2→3,
> and pays 15 Stardust to both the current balance (`essence`) and lifetime earned counter
> (`essenceEarned`). Extraction, cooldown, full-address source proof and all unrelated state remain
> exact. These six Charter/reward fields are coupled Mine-owned effects, never preservation drift.
> The oracle accepts them only from the same canonical required predecessor as the production
> Starter-Charter owner, and separately proves every durable field reached the live SaveState;
> malformed predecessors and live-only publication drift remain red without launching a browser.
> The exact `4a82d9b…` Slice red that exposed the stale oracle remains FAIL; at that historical
> changed-head checkpoint its repair was browser-free green at 250 files / 2,495 passed / 1 skipped
> with typecheck green and changed no player-facing progression rule. The current aggregate boundary
> is stated at this file's top.

> **2026-08-30 current replacement boot-catch-up clarification:** aggregate progression still owns
> one receipt/F4 CAS and only the canonical achievement append plus monotonic `stats.bestRank`.
> Whole-expedition replacement first clears the old receipt history; the replacement document then
> owns one independently expected receipt-free bootstrap without advancing ordinal. An independently
> projected `current` state consumes no progression receipt. A projected `ready` state legitimately
> commits the new expedition's silent ordinal-zero `arc9-progression-refresh-v1` fixed point before
> publication, so the next judged outcome owns ordinal one. For the retained fixture the exact
> sequence is replacement revision 8 → bootstrap 9 → Arc 9 revision 10 → Smoke revision 11.
>
> The fixture begins with `first`, `field10` and bounded unknown `fake`. Its exact aggregate-only
> append is `hybrid`, `rare`, `crafter`, `geared`, `lastvein`, `cosmicfind`, `skimmer`, `event1`,
> `event5`, `guard1`, `essence500`, `bred1`, `bredfail`, `feed5`, `feedfail`, `duel1`, `duelw1` and
> `jumps5`; `stats.bestRank` remains 3 and the successor is a fixed point. The receipt witness remains
> `arc9p1:a8f5961bf107300e280aa9cda8160e051e02ab691c80cda40eaf87642d4f62c9`. Event-owned
> achievements remain excluded and every non-owned save field remains exact.
>
> Exact signed `e4f5af4bf628ee2f0b2485077e46dc0ff86b2b0c` passed Compendium 78/78 before its
> once-only Slice stopped terminal red after 98,988 ms with four scopes. Its F4 finding came from an
> obsolete native-boundary/raw cross-clock oracle, not aggregate policy or product failure. The
> strict post-boot product projection is
> `e40a542553ab61a1f9c5800e856a8f1e3c5efd341fdb73dec776d622258bd31c`; it keeps the full
> achievement append, route/Atlas repair and unrelated state exact while allowing only bounded
> clock-age normalization. No achievement, rank, reward, save-schema or player-facing policy changed.
> Glass and Recovery did not run, and the historical red remains FAIL.

> **2026-08-30 current local canonical-successor + named-CF1 correction (supersedes narrower same-date
> descriptions below where they differ):** progression-bearing product writers now verify their
> expected successor with the deterministic transaction owner's `canonicalizeState`, which is bound
> to the same detached registry and one validated commit clock used by the write. The converted set
> is Arc 0 Atlas, Landing and world naming; Arc 5 Field Scout; Arc 9 Atlas Favorite, explorer naming,
> Frontier ending, nameplate, Sharing, Survey and Travel; Binder set claims; and Starter Charter
> acceptance/staging. Their existing receipt, reward, achievement, rank, idempotence and no-retry
> rules are unchanged; the correction prevents codec housekeeping from making a valid committed
> fixed point disagree with a raw or differently clocked prediction. Historical evidence below is
> not relabelled as proof of this local successor.
>
> Accepted custom-world naming no longer starts aggregate progression catch-up before a submitted
> route can own the shared coordinator. Direct Travel atomically owns its accepted route, arrival,
> galaxy visit and any proved galaxy-kind event; Follow owns that arrival aggregate plus Jumps and
> `wayfarer` in one receipt. Direct Travel remains ineligible for Follow/Jumps/`wayfarer`. If the
> post-name route refuses or otherwise does not join progression, the world-name transaction queues
> exactly one aggregate catch-up after its own settlement. A synchronous composite reservation
> defers/coalesces ordinary save checkpoints across that handoff and re-arms one afterward, so a
> debounce cannot replace the removed progression race.
> The bounded wait retains its diagnostic timeout; it does not retry, sleep past a refusal or infer a
> route outcome.
>
> This boundary was isolated by exact clean signed source
> `941ba45a96e5baabadc255d53db86fa935cefe81`: Compendium passed **78/78** once/no-retry in
> 65,731 ms, then Slice `20260830115041916-36220-7ed2dd2ef398` stopped once/no-retry after 63,106
> ms with **63 findings / 42 scopes**. Sixty-two are Guide/Release instrument drift from both early
> reads before deferred DOM publication and stale inventory/player-copy expectations (the superseded
> 26-partial/15-unavailable split and older Scout, conquest, reward and audio claims instead of the
> current 9/41/34/7 authority and live copy); the independent final product finding is the named-CF1 Follow
> starvation repaired above. No Glass or Recovery ran. The current changed head has no browser
> certificate yet and changes no rank formula, achievement manifest, reward, creature, genome or
> save schema.

> **2026-08-29 current local Binder and Prime-Frontier progression overlay:** Records now appends
> the legacy Binder as six exact type-collection pages—**The Spectrum, The Sixteen Realms, Body
> Plans, Ability Themes, Flora Flavors, and Size Classes**—derived from canonical Compendium species,
> never from procedural individuals. Seven non-Paragon sets are live one-time claims: Four Crowns
> **25**, The Five Flavors **40**, Master of Arts **80**, The Bestiary **80**, Warden of Realms
> **100**, Against All Odds **60**, and The Apex Court **150** Stardust. A completed, unclaimed row
> crosses one receipt/F4 revision CAS and atomically appends its `claimedSets` id, raises current and
> lifetime-earned Stardust, and applies any newly proved aggregate achievement/best-rank successor.
> Incomplete, already claimed, malformed, overflowing, stale, lost, or storage-failed attempts
> publish nothing and never retry. **The Fifty Paragons** remains visible but unavailable until its
> deterministic discovery owner is ported; an imported `para10` claim is preserved and is never
> exposed as a claim target.
>
> The Prime Codex now projects the canonical nine Signatures in registry order: **Earth** (`stone`),
> **Fire** (`flame`), **Air** (`sky`), **Stellar** (`star`), **Water** (`ocean`), **Electric**
> (`mind`), **Poison** (`life`), **Void**, and **Prism**. An unclaimed Titan may appear only on a
> registered unconquered world when its minimum region, deterministic 8.5% placement, and
> world-type rule agree; Void has the established first-selection priority. Only a verified Titan
> conquest writes that Signature and its exact world in the combat transaction. Counts 0/2/4/6/8/9
> advance the separate galaxy-radius ladder from Solar Reach through the Frontier, and the ninth
> distinct claim opens the Frontier ending choice.
>
> The five established one-time legacies are **Sovereign of the Frontier**, **Warden of Life**,
> **World-Shaper**, **The Unseen Hand**, and **Prismatic Pathfinder**. The first four require all
> nine Signatures; Prismatic Pathfinder additionally requires at least three conquered worlds, the
> Electric (`mind`) Signature, and at least 40 catalogued species. The action changes only
> `frontierEnding` through one receipt/F4 CAS, is idempotent only for the same already-durable
> choice, cannot overwrite a different choice, and never retries or publishes optimistically.
> Durable ambiguity converges by read-only reload. A syntactically valid unknown imported ending
> remains visible protected evidence rather than being interpreted, repaired, or overwritten.

> **2026-08-29 current local Arc 9A rank, Records and achievement authority:**
> `@cf/domain-progression` owns the exact ten-rank ladder, all six expedition-score weights, all ten
> permanent nameplate rewards, Eternal Frontier foil, endless `✦N` prestige every 3,000 score, and
> the complete ordered **96-achievement** manifest. The **68** aggregate rules are strict bounded
> pure projections. The **28** legacy `t:null` rows stay event-owned: they may display a durable
> unlock, but no nearby counter is allowed to guess that the event happened. Unknown bounded
> compatibility ids remain explicit and retain legacy rank credit without masquerading as a known
> achievement.
>
> The v2 app now projects sanitized `SaveStateV2` owners into those facts and renders the exact six
> factors, current/next rank, permanent nameplate reward and all 96 rows across 13 native Records
> shelves. A coalesced follow-up after each receipt-bearing product action appends every newly proved
> aggregate id in manifest order and monotonically raises `stats.bestRank` through one F4
> deterministic transaction: one immutable receipt, one lease/revision CAS, no retry and no
> precommit publication. The committed canonical save must reopen at the exact fixed point before
> Main publishes only the detached `unlocked` list and best-rank mirror. Existing event-owned and
> safe unknown ids keep their order; overflow refuses all-or-nothing. The canonical v4 `ach` and
> `br` fields remain the only persistence carriers, so no save schema or migration was added.
>
> The top-bar nameplate now follows the saved unlocked rank hue, including the Eternal Frontier
> foil. `progression-ceremony.ts` accepts only an exact append delta from one verified committed
> publication: every newly appended known achievement keeps manifest order and receives its
> `Achievement · <name>` text notification plus the established rarity sting at tier 3; a strictly
> higher saved best-rank index receives the named Rank Up toast, tier-5 sting and existing gold FX
> semantic. The gold palette is fixed, the mature ceiling is 40 particles, and current motion/device
> effects policy may lower that count. Main queues each result once by committed revision; it asks
> AppChrome only for the player-chip center geometry, never its element. Missing geometry or
> Web Audio leaves the durable fact and text ceremony intact. Boot catch-up, Training sandbox,
> replay/out-of-order revision, already-durable observation, refused/stale/failed storage and
> committed convergence are silent. Before consuming a queue entry, Main defers while
> `productActionInFlight` belongs to a newer receipt-bearing action, preserves the complete queue,
> and schedules another drain; only an idle product owner and idle toast permit delivery.
> Replacement reload remains the sole path that clears pending ceremonies. The ceremony is
> presentation only and invents no currency, item or achievement reward.
>
> Settings now offers Auto/current-rank or every color through the durable best-rank record. One native choice
> uses one receipt/F4 CAS with no retry or optimistic color publication; locked or malformed choices
> refuse, and unconfirmable durable results reload instead of applying twice. Exact event
> joins now share their real owning transactions: canonical Earth landing → `home`; durable world
> naming and exact companion Rename → `namer`; first verified settlement → `settle1`; a successful
> pairing whose two captured pre-action parent tiers are both Legendary-or-better → `bredlegend`;
> verified player combat that leaves 1–19 HP → `brink`; valid-world Share → `share`; and an accepted
> source-proven/reach-authorized CF1 Follow → `wayfarer`; twelve source-derived Survey facts →
> `civ`, `spacefar`, `sol`, `binary`, `seebh`, `seens`, `seemag`, `seewd`, `seerg`, `seesg`,
> `seeproto`, and `seebd`; galaxy arrival or wormhole traversal → `quasar`, `dwarfg`, and `worm`;
> and the first explicit Atlas Favorite → `curator`. Accepted Follow composes its accepted route,
> Jumps, `wayfarer`, galaxy visit and any proved galaxy-kind event in the same receipt. Capacity is
> proved before each writer, existing ids are fixed points, and each committed projection is
> independently rechecked before publication. Those are **23** distinct event rows. Exactly five
> remain owner-blocked—`daily`, `decade`, `survivor`, `fieldmedic`, and `gambler`; the aggregate
> action can never stand in for one.
>
> Explorer self-rename is now live from **Settings → Explorer name → Change name**. It uses the
> shipped sanitizer and 24-character cap, changes only `explorerName`, treats cleaned-empty and
> unchanged input as receipt-free no-ops, and crosses one receipt/F4 CAS without retry or optimistic
> publication. Durable ambiguity converges read-only through reload. Because this is identity-only,
> it deliberately does not unlock the discovery-name `namer` achievement. Exactly the five event
> owners named below remain open; durable achievement/rank notification ceremonies are live, while
> any separate material reward design remains deliberately absent.

> **2026-08-29 current local Starter Charter progression overlay:** the live two-chain board exposes
> only one incomplete link per chain plus already accepted rows, requires explicit acceptance before
> tracking and enforces three active slots. `st-scan` and all weeklies remain protected; `st-conq`
> stays combat-owned. Exact already-proven durable state may complete a state-style row during the
> acceptance receipt, but `st-giants` remains a five-press counter and unavailable `st-scan` never
> auto-completes. New Landing/Mine events carry a full registered world address: canonical Earth is
> excluded from `st-land`, and Sol-tour filters prove the exact Sol hierarchy/ordinal rather than a
> reusable planet seed. Live Landing, Mine, canonical fixed-component Fabrication, non-null Scout
> set/switch and combat writers fold their matching Charter successor into the deed's existing F4
> receipt/CAS; stand-down, no-op, refusal, stale/storage failure and convergence add nothing.
>
> Completion pays the authored 10/15/25 Stardust value to both current and lifetime totals, raises
> honored Charters once, removes acceptance and may append aggregate achievements/promote best rank
> in that same candidate. The fixed gear rows are Headlamp (`st-mercury`), Mag-Boots (`st-mars`),
> Meteorite Pendant (`st-giants`), Field Leggings (`st-ice`) and the currently unavailable Earpiece
> (`st-scan`). A deterministic Arc 2 instance auto-equips only into an empty slot; inventory overflow
> uses the 500-entry pending-reward carrier, and exhausted/corrupt/future carrier or numeric capacity
> refuses all rewards together. Only the verified postcommit progression delta reaches the ceremony
> path described above.

> **2026-08-29 current Arc 5/6 XP and Charter joins:** successful owned-fauna conquest pays the
> canonical `20 + world tier` XP, or `60 + world tier` against an Apex Guardian/Elemental Titan, in
> the same verified combat CAS as injury, conquest and rewards. A first loss by that exact creature
> on that exact world pays +3; a near-brink result raises the one-time maximum to +5, so ordinary→
> near-brink pays +3 then +2, near-brink-first pays +5, and no later loss can farm it. The bounded
> archive/`xpa` carrier preserves older first-award membership. Live captured Guardians and Titans
> now use that same exact win/loss XP authority as combat champions. Their XP and injury persist in
> the separate `arc6.guardian-companions` overlay rather than Arc 5; because they carry no bred
> lineage, a defeat permanently tombstones the last-live state and removes the champion from the
> combat roster and composite Compendium across reload. Their acquisition record and any Prime
> Signature claim remain independent. They gain no care, breeding, mission or Recovery progression.
> Successful nonlethal Breed now gives the newborn +2 XP and adds +5 exactly once for the canonical
> unordered parent-species pair. Its child XP, canonical `xpf` claim, any `xpa` overflow replacement,
> `c3-breed` tick and eligible `bredlegend` join share the same pre-draw-certified F4 receipt/CAS as
> the exact-five ownership successor. Rename remains identity-only and may join `namer`; Field Scout
> designation changes only the role and does not yet grant fresh-species XP or redirect injury.

> **Earlier local Arc 4 Charter checkpoint (2026-08-29):** the playable capture writer prepared
> one Chapter 2 `c2-scan` tick only for the first durable successful Tame, Scavenge, or Sample on
> each complete source-proven world beyond Sol. Exact pre-action ownership discovery provenance
> supplies world uniqueness; the Charter change shares the capture's pre-draw capacity proof,
> F4 outcome, receipt, revision and fenced F3 CAS. A miss, exact Sol, unreachable or past-chapter
> source, later success on that world, saturated goal, stale tab or failed write banks nothing and
> cannot retry. Unrelated Charter progress is preserved exactly.
> Capture and Search travel bind exact galaxy/star coordinates plus seeds; same-seed wrong-parent
> routes cannot inherit reach. A successful capture that earns no bioscan also cannot reconcile an
> imported Charter chapter.
>
> This deliberately replaces, rather than claims parity with, v1.8.9's separate Discover Life
> control. It does not append to the legacy survey/Records ledger or change `stats.surveys`; Survey
> Records and accepted/weekly bioscan Charters remain unavailable. Guide, Training and the v2 draft
> said so explicitly. At that checkpoint, focused and full browser-free product/copy evidence was
> green at 230 files / 2,315 passed + one skipped; the older signed
> `3f69e88…` browser certificate predates this writer, so fresh exact-source browser and HUMAN
> evidence remain open. No release, version, deployment or hosted-write authority follows.

> **2026-08-27 current-candidate progression correction:** capture contact is now a real equipped
> gear effect rather than inert copy: each effective point adds 1.5 percentage points to capture
> chance, equipped gear contributes at most +25 points, and the final chance remains capped at 95%.
> First contact remains unavailable. F4 now distinguishes storage failure while acquiring from
> failure while renewing its active-play lease. Acquire failure grants no lease and accrues zero;
> renew failure first settles the already-earned visible/answerable interval, then revokes the lease
> and stops further accrual immediately. The domain permits reacquisition only through an explicit
> later heartbeat, while the app makes the document read-only, stops heartbeat/answerability/player
> mutation and converges through one protected reload instead of starting an automatic reacquire
> loop. A rejected repository-revision read during authority verification follows the same protected
> convergence path, and periodic/`pageshow` callbacks cannot reacquire while that hold is set. Cleanup
> attempts audio disposal and runtime release, aggregates failures into the convergence witness, and
> reloads regardless.
>
> Charter landfall classification also follows the complete registered canonical CF1 address. Sol
> requires the exact home-galaxy seed/coordinates, Sol-star seed/coordinates and expected planet
> source ordinal; a colliding leaf seed under another hierarchy is non-Sol, and an unregistered
> lookalike cannot bank. A committed first landing updates only matching landfall scopes from the
> current chapter onward and caps every goal at its authored target. These repairs still require the
> final frozen-producer battery and bound browser campaign before they become current exact evidence.
> Chapter 1 Mine credit uses the same hierarchy discipline: exact home-galaxy and Sol-star seeds and
> coordinates, exact dead-world seed, and exact source ordinal. A same-seed planet under any changed
> parent coordinate or ordinal grants no mining progress.
>
> Browser evidence uses three separate version-tolerant authorities: the root Chromium-family/CDP
> `1.3` authority with source-derived layout/boot capabilities and exact per-run provenance, the
> Compendium ruler with its own collector/transport capability and producer bindings, and the
> SceneMemory ruler with its own capability/profile contract and producer binding. Compatible point
> updates do not merge those rulers or move their fixed thresholds; final battery and independent
> audits remain pending.

> **2026-08-26 progression checkpoint (historical where superseded):** the published ecology epoch now advances
> only from F4's visible-and-answerable, lease-owned `activePlayMs`, through one receipt-free
> lease/revision CAS before publication and exact scene reprojection. Until that refresh completes,
> epoch-dependent Survey/Planetside/capture progression is fenced. This does not close Arc 4: the
> ordinary Slice at that checkpoint still recorded `recoveryClaimed:false`. Exact signed
> `3f69e88…` later completed the uninterrupted 20-minute Recovery certificate; HUMAN first-journey
> review and fresh evidence for newer local product work remain open.
>
> After owned `scan1`, an eligible registered current-system lifeless non-Earth orbital **Mineral
> veins** Survey row passively lists ordinary mineral deposits in canonical order plus the optional
> biome-only vein marked `✦`. It grants nothing
> and exposes no Mine action, cosmic/exceptional material, grades, reserves, progress or extraction
> state. Player rarity uses the strict ten-name presentation projector: valid raw tiers `0..8` map
> directly, `9..14` display as Transcendent, and invalid/missing values are omitted rather than
> defaulted to Common; internal art-grade labels and raw numbers remain private.
>
> The XP anti-farm seam is durable and now backs the bounded Arc 6 conquest XP writer: `xpf` holds the newest 4,000
> bounded unique keys, older membership moves to the strict v5-only `progression.xp-firsts` archive,
> and `xpa` v1 binds total count plus archive-carrier digest. Missing or inconsistent archive
> evidence protects instead of rearming one-time awards. Executable `conq[].e` codec/readiness
> vectors preserve absent-as-ready and present-as-gated semantics, and the combat settlement proves
> ordinary-loss +3 versus near-brink maximum +5 in both event orders. The real-veteran Gate-C run
> remains separate and open.
>
> Arc 5 Breed is now player-live from a real-fauna Compendium detail. It pages through exact owned
> instances, requires two distinct eligible fauna, shows the established rarity-plus-lifetime-
> Stardust chance, certifies success and failure successors before one `breedOutcome` draw, and
> settles one receipt/CAS. Both parents remain owned; success creates one deterministic child and
> assigns eight active-play minutes of Recovery, while failure creates no child and assigns two.
> Recovery blocks Breed, combat and dispatch and never advances from closed-game or wall-clock time.
> The child initializes `fed` to half the lower clamped parent value exactly once. Exact-instance
> Rename is also live and changes only one sanitized at-most-24-character companion nickname through
> a receipt/CAS with no RNG or optimistic publication. A successful Breed gives the child +2 XP
> and +5 for the first exact unordered species pair, and banks the exact `c3-breed` Charter tick in
> that same child-bearing save; Rename grants no XP or Charter progress. Broader care, bond and
> missions remain separate work.

> **2026-08-25 Arc 4 progression overlay — recorded local boundary:** native Survey
> Tame/Scavenge/Sample actions now turn a finite Biosphere attempt into one durable hit or miss.
> The card states that it selects randomly from the verb's eligible species across the canonical
> full roster, not the eight-row preview, and shows aggregate/individual odds plus the shared
> hit-or-miss budget and active-play recovery countdown. A genuinely first successful species adds
> its catalogue/discovery facts and eligible Legendary+ Stardust exactly once; repeat success may
> add another stable fauna instance or specimen lot without paying the first-only reward again.
> Charter bioscan progress is deliberately not exposed, and no targeted-species preview exists.
>
> Player publication follows the single F3/F4 receipt/CAS. Pending, storage-refused and stale paths
> grant nothing optimistically; a post-durable fault reloads the committed result without reroll or
> duplicate award. One no-retry Slice pass proves hit, miss, 14-attempt depletion and convergence;
> full Glass proves the 12-viewport native controls/Close/reopen and exact source-bound copy. The
> genuine 20-minute next-cycle recovery observation and combined HUMAN first-journey review remain
> open, so Arc 4 is **[PARTIAL]**. Guide/release copy is current, but Field Training remains six
> lessons plus graduation with no Capture lesson, and no shipped version/release follows.

> **Historical 2026-08-24 Arc 3 progression overlay (superseded where the current 2026-08-29
> overlays above differ):** Mine and Skim are live
> through the Engineering panel. Six research rows are displayed, but only Deep Scanners is
> purchasable; the 2026-08-26 correction above records its now-live bounded passive orbital Survey
> row. All 62 fixed recipes are listed, but only connected-effect outputs with exact costs/
> preconditions and capacity/revision headroom are actionable. As of 2026-08-29, an eligible
> slotted recipe paid entirely from exceptional direct materials receives one deterministic exact-
> item modifier—mining yield, rich-strike chance, or capture-contact points—while mixed payment
> remains ordinary; disconnected-effect rows remain unavailable. Eligible Deep-Scanner and fixed-Fabrication
> actions use the durable transaction. Canonical source opportunities, technology prerequisites,
> material/part/Signature/Stardust costs, finite reserves, active-play accrual and revision/capacity
> headroom are projected before each press and re-derived inside it. Eligible fixed system
> fabrication can change the normalized ship/reach projection. Charter mining and fabrication counters bank only from the
> committed result, never from button intent. One shared coordinator serializes Engineering with
> Inventory publication.
>
> At that boundary this did not complete progression: authored random loot, variable crafting,
> upgrades/sockets, companions, combat/Guardians, the complete Charter/Training journey and HUMAN
> pacing remained open. The current overlays above supersede its later-landed systems and Charter
> writers while retaining this Arc 3 transaction foundation.

> **2026-08-24 F3/F4 + Arc 2 progression overlay — current local implementation:** the v5 app now
> persists one protected F4 authority containing visible/answerable/lease-owned `activePlayMs` and
> SessionRNG's seed, isolated domain counters, and global receipt ordinal. Hidden, frozen,
> unanswered, lease-lost, backward and wall-clock-only intervals add zero. A product outcome and its
> next authority/receipt/revision commit together; a failed write preserves the same planned roll.
> Arc 2's deterministic Equip, Unequip, Salvage and pending-claim actions consume no domain roll and
> reserve only the next receipt identity, so UI order cannot perturb later random outcomes.
>
> At the Arc 2 boundary, the exact-instance Inventory became live from the desktop rail and the phone's exact 260px 5×2
> ten-control dock. It can inspect and conditionally compare migrated gear, then durably equip,
> unequip, salvage or claim a pending item. That Arc did not grant materials, research, reach,
> crafting, random loot or a ship upgrade; Arc 3 now owns the fixed Engineering subset above.
> Oversized legacy holds remain complete inspection-only evidence
> rather than being truncated into false progression. Fixed recipe and economy-sink graphs are
> inspectable development truth; their Arc 2-local source model reports `arc3-deferred` and exposed
> no player progression action at that boundary. Arc 3 now owns the fixed actions described above.
>
> Genuine legacy Training completion also keeps the Arc 2 carrier aligned with its owned
> `items` / `equip` / `equipAff` checkpoint fields under one checked transaction. Current-view and
> source-deferred recovery preserve the carrier; corrupt/future evidence cannot mint gear. For the
> recorded pre-current-WIP Arc 2 candidate, focused tests plus one no-retry Slice Smoke and one Glass
> Matrix were terminal green on Edge `151.0.4129.101`, but bind that recorded candidate's dirty
> inputs and do not certify the current moving tree. Remaining outcome-call-site migration,
> authored loot/craft progression and HUMAN comparison/pacing
> remain open; no hosted, integration, Gate, release, version or deployment authority follows.

> **2026-08-22 Arc 1C progression overlay — historical pre-Arc-2 implementation:** clean
> product/ruler `a4de5007ffc9131b8bc952a0a4cb469d9139039e` adds a read-only Shipyard
> projection without adding a progression writer. `ShipVisualState` is recursively frozen and
> derives only from normalized `items`, `ascCh`, and injected livery seed `0x5111`;
> `ascStageOf` remains the sole reach/chassis-stage authority. Installed-system identity and order
> are exactly `jumpdrive,array,igdrive,autoext,cscoop`, with visible hardpoints exactly `array`,
> `autoext`, and `cscoop`. Only the terminal compatibility path lacking its Intergalactic Drive
> may use the generic `legacy-charter-refit` provenance; no art or chapter-progress number invents
> an owned named system.
>
> The Shipyard exposes four static SVG silhouettes and truthful chassis, provenance, installed
> systems, and open/fitted hardpoints from the desktop right rail and then-nine-control 5×2 phone dock.
> One DOM/SVG preview owner disposes on replace/close. It deliberately offers no Fabrication,
> Research, upgrade, Cargo, reward, reach, or save mutation and creates no Pixi renderer or
> `RenderTexture`. The Guide describes this capability as partial inspection only.
>
> The real SceneMemory journey now opens and closes Shipyard and proves a settled zero-preview
> state alongside the named transactional `SurfacePlanetTextureAttachment`. Historical
> activation/certification source `59530da3bf40965adf9c54f169b310e11ccdd0f8` bound the original
> 250 ms `scene-memory-v2.json` budget SHA-256
> `3b71d14ca297ec4d536669d2edf960ac4d01671dd7a0c9eb11a2fb76e4fc43f7`; local run
> `20260822-arc1-local-certification` passed 42/42 and its named verifier under Edge
> `151.0.4129.101`, but that certificate remains historical. Clean cross-host SLA repair
> `7d8dc380cd89ef53aac5a11c3850316e19e1aae9` bound budget SHA-256
> `5c8a6e7568e02d4e31501e4188dba57d3ac6e6ad183882b98ff9c68170771501`; local one-attempt/no-retry
> run `20260823-pr33-cross-host-sla-certification` passed exact 42/42 and its named verifier under
> the same Edge `.101`. Raw/gzip SHA-256 are
> `d16d40cd4d07f96683490eab920072fb9f3b42e0d0ee54434ffd4d312223f960` /
> `7c4100244abef8d50f93178aab7c8579ae93fa0b6bef76422cc5c0523edac55a`. Hosted run
> `32618995487` remains terminal-red at 40/42 and establishes no hosted authority. Product behavior
> is unchanged. SceneMemory now owns its separate version-tolerant Microsoft Edge-family + CDP
> `1.3` + sealed capability/profile authority; exact `.101` remains historical provenance, the
> numeric budget is unchanged, and the changed final frozen producer requires a new bound
> certificate. This docs descendant is not the exact certified head. Hosted terminal-green
> integration, HUMAN silhouette judgment, Cargo/Forge writers,
> Fabrication/Research/upgrades, release and deployment remain open.

> **2026-08-16 D-TRAIN-1 progression overlay (current source; local browser
> evidence recorded below; exact-head CI, integration, real-save Gate C, and
> human authority remain open):** Field Training compatibility restores only the exact eleven
> checkpoint-owned surfaces `{st, ps, ac, es, c, ca, cx, it, eq, ea, e}`.
> It does not roll back the whole save and cannot manufacture unrelated
> progression. All surrounding v4 fields remain owned by the surrounding
> imported expedition; canonical Earth is regenerated instead of trusting
> `e.where`, historical Earth values are sanitized, HP is never healed, and
> survey/arrival totals are reconciled from their identity ledgers. The
> optional compatible outer-v4 `ever.v:1` carrier retains only cumulative
> records that the old checkpoint could own; its floors never lower derived
> progress, `sysSeen` remains arrival authority, and future nested versions
> protect the whole expedition.
> The legacy checkpoint does not contain `view`: Skip from Welcome keeps Sol,
> while full completion after Land keeps Earth. Only current-v2 `{view}`
> restoration returns to the exact pre-Training route.
>
> Loaded unfinished saves are held against ordinary writes until the one
> atomic Finish/Skip replacement commits. A loaded `tut:0` expedition without
> a checkpoint receives only a runtime Sol seat, not invented checkpoint or
> progress. Unknown evidence enters a persistent recovery lock rather than
> allowing session practice to appear saved. A pre-durable failure retains the
> lesson and checkpoint; a durable primary write is never repeated because
> later in-memory publication failed. This adds no chapter, Charter, landing,
> reward, reach, ownership, or Guide capability, leaves outer `v:4`, and does
> not finish the remaining fifteen D-TRAIN-2 lessons or authorize a release.
>
> Local ignored evidence is terminal PASS on Edge `151.0.4129.86` at dirty
> commit `b091f010011fa16bec457599b41274b7f92bb5e6` / branch `openai/mac`.
> Slice Smoke took 154,788 ms with 0 findings, 0 automatic retries and 10 screenshots;
> its raw outcome names genuine Training Skip + full Finish,
> rescue/quarantine/retry/races and canonical Earth. Full-certifying Glass took
> 57,476 ms across 12/12 viewports with 57/57 negative controls, none
> blocked/omitted, with 0 findings, 0 instrument failures and 0 automatic retries. Their distinct
> dirty-tree hashes are respectively
> `465adef3606b0b06dd285eb049662e5b5ee659bb6dc0b53430568a3df9cf9104`
> and `4f266568aacdb98c7a6e9cfc8571fc60e0bfc140762540dd844a2714fc0836f5`.
> This is input-bound local outcome evidence, not this later documentation
> state, exact-head CI, integration, Gate C, human, or release authority.

> **2026-08-15 F2 progression-boundary overlay (historical pre-D-TRAIN-1 boundary):** Source proof
> now precedes every navigation authority decision. Search, generated descent,
> saved boot/import and Atlas candidates must first resolve to a canonical
> galaxy/star/planet hierarchy; only that proven target is then evaluated by
> saved Prime reach and the current Charter stage. A provenance rejection is
> therefore not reported or counted as a Charter/Prime rejection, and it cannot
> bank landfall, reconcile a chapter, apply a custom name or mutate navigation.
> A planet route stops at its system survey; only the separately guarded Land
> action can write first-landfall progression.
>
> Planet action identity includes its source ordinal before orbit sorting, but
> that runtime fact is not a new progression key or migrated ledger. F2 creates
> no drive, chapter, reward, XP, ownership, receipt or reach writer and does not
> change existing landfall/Charter balancing. Field Training restores only the
> exact current `{view}` route snapshot after successful re-proof. A transient
> `source-error` instead keeps Training incomplete and the exact snapshot pending,
> writes no lesson completion or other progression, and attempts to return to a
> freshly proven Sol system for the next-load retry. That Sol move is conditional:
> if Sol proof is also unavailable, the app neither forges it nor discards the
> retained retry evidence. At that boundary D-TRAIN-1 remained
> open. F2 itself made no schema/version/release, exact-head certification or Gate status changes
> here.

> **2026-08-15 v2 overlay — historical pre-Arc-1C boundary (superseded where noted above):**
> The current v2 slice preserves imported Cargo/items/equipment/technology/Ascent data and
> uses built drive items plus compatible `ascCh` state for reach, but it has no Cargo,
> Shipyard, crafting, research, upgrade actions or ship portrait. The Charter board and
> objective chip now consume a stage-aware landfall-only projection rather than raw legacy
> chapter data: a fresh Sol expedition can complete its two live landfalls, then reaches an
> honest boundary without gaining a drive, chapter, reward or reach tier. A **nonterminal**
> saved chapter index never stands in for a missing drive; the explicit terminal legacy/veteran
> fallback (`ascCh >= ASC_CHAPTER_COUNT`) still grants stage 3 even when item bytes are absent.
> Only a world’s first landing banks new landfall progress. Any successful Land action can
> reconcile every consecutive already-complete imported chapter proved by one stable saved
> reach stage, even when its landfall counters were saturated; incomplete or unpowered records
> remain unchanged, and reconciliation creates no progress, drive, reward or reach. Only live goal
> writers may be presented as actionable progression while those systems remain absent. Legacy v1.8.9 does
> contain an additive deterministic ship picture; it is not a live v2 surface and does not
> satisfy the approved distinct-silhouette target.
>
> The subsequent Arc 1C implemented one pure `ShipVisualState` projection shared with the reach-stage
> decision. It yields four capability stages—Scout/Chemical, Jump/Interstellar,
> Array/Survey Cruiser and Intergalactic/Frontier—plus independent Auto-Extractor and
> Corona Scoop hardpoints. A legacy save completed through `ascCh` but lacking drive items
> receives an honest veteran-refit chassis; it must not appear as a bare scout with full
> reach or claim an absent named drive. Visual state never writes save progression.
> Arc 1C chose one bounded static DOM/SVG preview and no Pixi preview, second renderer or
> `RenderTexture`; any later motion proposal remains a separately owned decision.
>
> Collection presentation follows the same player-respect rule. A possible 1,500-entry
> Compendium is virtualized; visible rows receive asynchronous 132px thumbnails and the
> selected creature alone receives its 440px detail master. The current eager/full-image
> path remains a CPU/decode/memory risk until repeated maximum-catalogue cycles plateau in
> a real browser and a deliberate unbounded/no-disposal control fails. Progression is a
> mastery/capability ladder: every earned stage exposes a legible new exploration ability,
> optional systems remain separately understandable, veterans keep earned access, and
> rarity or ornament never stands in for mechanical power.
>
> **10/10 completion bar, planned rather than current v2:** before the game scales its
> catalogue, a fresh explorer must be able to complete one comprehensible 30–60 minute
> journey—discover a meaningful opportunity, learn what it needs, gather finite material,
> make or improve something, form a companion connection, choose a prepared branch or hazard,
> return with a lasting result and see a farther reachable possibility. Combat is not a
> prerequisite for this Arc-4.5 gate; the order may be staged by the
> live arc, but no Guide, Charter or visual promise may skip an unavailable action. A later
> optional Outpost/project layer extends that loop with clearly disclosed finite projects
> (relay, lab, shelter, cargo beacon or observatory), a before/after world projection and
> no offline-maintenance or mandatory-income treadmill.
>
> The future **Expedition Chronicle/Museum** gives the player durable authorship over the
> journey: selected receipt-backed discoveries, named companions and lineages, ship refits,
> Companion mission returns, Guardian trophies and world records can be revisited or presented.
> It is a read-only, player-curated projection over stable records—not a second unbounded
> history store, a score substitute or a reward faucet. Rename, migration, reload and
> catalogue deduplication must preserve the referent of every displayed memory.
>
> **2026-08-15 v2 epoch-contract overlay (historical pre-F3/F4 boundary):** `COSMIC_EPOCH` accepts only a
> nonnegative safe integer and is capped at 10,000 to bound retained O(epoch)
> ecology work. `EpochClock.base()` is the immutable sanitized construction
> origin; it is not the current save value. The browser app constructs once from
> the imported epoch and a fresh app-owned monotonic elapsed page-residence
> segment, snapshots `current()` on every ordinary save, and constructs a new
> clock from that serialized snapshot plus another fresh segment after reload.
> The real browser gate advances one exact 1,200-second epoch, reads the raw
> IndexedDB primary, reloads, and requires the advancing snapshot to survive.
> At that boundary current elapsed time was not yet a proved foreground-only active-play policy.
> The current F3/F4 overlay above now owns the CAS/revision/lease and visible/answerable active-play
> authority. In this historical plan, F4 still owned hidden-tab
> semantics, automatic integer-edge persistence/invalidation, live global-read
> timing, SessionRNG, and the separate persisted `activePlayMs` clock/accrual
> policy for future readiness systems.
> Repeat planet landings do not bank an extra landfall; a veteran Training
> replay may still receive its lesson event without receiving progression credit.

**STATUS:** legacy sections match `main.js` as of 2026-07-30; the current dated v2 overlays
match the local `port/v2` candidate as of 2026-09-04, while older overlays preserve their historical boundaries. See the 2026-07-30 addendum at the end —
three advertised XP awards were dead until then.
**Purpose:** How the explorer and their creatures grow over a run — creature XP/leveling, the player character sheet (`pstats`/paperdoll), the standing-rank milestone ladder, and the Compendium collection track.
**Source of truth:** this doc is the DESIGN spec; `main.js` implements the legacy
sections, and `port/v2` implements the dated port overlay.

## 1. Overview
Progression runs on three parallel tracks, none of which touch world/creature *generation* (the fingerprint law):

1. **Creature levels (XP).** Individual **Fauna** in your Compendium earn XP by winning fights and level up (cap **L9**). Levels wake **innate class arts**, never raw stats.
2. **The explorer (`pstats`).** *You* are a battler too — five stats grown by eating flora, shown on the character sheet paperdoll with nine gear sockets.
3. **Standing rank (milestones).** A lifetime score over everything you've done climbs the rank ladder (Cadet → Eternal Frontier → infinite ✦ levels), unlocking nameplate colors and gating nothing — pure prestige.

A fourth, collection-side track is the **Compendium** (the species catalogue) and its **Binder**.
Current v2 exposes eight one-time Set claims, including `para10`, **Seeker of Legends**: ten
exact Paragon catalogue records unlock a separate **Claim** for 120 current/lifetime Stardust.
The Fifty are fixed legends shared by every explorer; an explicit Discover Life Bioscan at a
source-proven home can add only its exact catalogue record. A sighting creates no owned companion
or specimen, spends no Yield, grants no Capture credit and never pays that Set reward automatically.

Depth (frontier region / world tier) is the master difficulty dial: farther worlds grant more XP, hide rarer finds, and tax your wounds harder.

## 2. Rules & mechanics

### Creature XP & leveling
- XP lives on the creature's genome as `g.xp`. Level is a pure function of it (`levelOf`):
  `level = min(9, floor(sqrt(xp / 6)))` — i.e. **level L requires 6·L² XP**. Cap **L9**.
  - **Retune confirmed:** the curve is **6·l²** (halved from the old **12·l²** — same shape, half the XP per level, so leveling comes twice as fast).
- Only catalogued **Fauna** earn XP (`awardXP` bails on non-Fauna). `g.xp` is hard-capped at 1e6.
- **XP faucets — victories AND care.** (v1.8 broadened this; this doc still said "victories only" until v1.8.3.)
  - Friendly **duel** win: **+8**
  - **Conquest** win: **+20 + world tier**
  - **Guardian/Titan** conquest win: **+60 + world tier**
  - Cataloguing a **genuinely new species** teaches your standing **Field Scout** creature **+2** (a single-catalogue path to XP that needs no fight).
  - **Care faucets (v1.8; ledgering CORRECTED in v1.8.4):** welcome meal **+1** *(once per creature — it was a bare unledgered `awardXP` paying on every loved meal until v1.8.4)* · taste discovered **+2** (once per creature per flavour) · bout survived **+2** · fight taken to the wire **+3** *(both unreachable until v1.8.4: the guard read `mine.id`, which no `fightNow` call site sets — the identity is now derived from the genome)* · conquest lost **+3** · defender pushed to the brink **+5** *(both now keyed per creature per world; unledgered, an unconquered world paid on every attempt forever, and one meal undoes the `hurt=0.85` brake)*. In legacy v1.8.9, anti-farm is a **per-creature ledger** (`xpFirsts`) whose `xpf` save mirror is capped at 4,000 entries of ≤64 chars, not a global cooldown.
  - **Current v2 persistence boundary:** the strict archive/`xpa` binding preserves membership older
    than the newest-4,000 `xpf` window. The live Arc 6 conquest writer pays the win and one-time
    loss/near-brink awards in its combat CAS. Arc 5 Breed now pays union XP in its own CAS: new pair
    firsts are 64-character SHA-256 digests over sorted canonical parent `SpeciesId`s, while an
    imported v1 `pair|<FNV32-base36>` key derived from `_earthName || speciesName(seed)` remains
    read-only already-paid evidence in either `xpf` or the archive. A genuinely fresh successful
    capture gives the exact Scout standing before that attempt up to +2 XP in the same receipt,
    capped at 486; no Scout, miss or repeat species gives Scout XP. Other advertised care/duel
    faucets still await their true v2 owners. `arc4-capture-capacity.ts` owns the joined Scout facts.
  - **Union (v1.8, CORRECTED in v1.8.3):** a successful breed pays **+2** to the **newborn**, plus **+5** the first time a given *species pair* is crossed (`awardXPPair`). Until v1.8.3 both awards landed on `aEntry` — which the union consumes moments later, so the XP was destroyed as it was earned. The lineage key was also `[a.kind,b.kind]`, and breeding is always Fauna×Fauna, so it could only ever read `'Fauna+Fauna'`: a once-per-parent payout wearing a lineage's name. It now keys on the two parent **species**, FNV-hashed short so it survives the ledger's 64-char load truncation.
    V2 preserves that imported key only as a compatibility alias; every new V2 first uses the
    collision-resistant canonical SpeciesId digest and both awards land directly on the child in
    Breed's existing exact-five/F4 transaction.
- **Level-ups wake innate arts, not stats.** `classKit` grants `1 + (lvl≥3) + (lvl≥6)` innate-art slots → **1 / 2 / 3 arts** at levels 1 / 3 / 6. A level-up at 3 or 6 toasts "A new innate art awakens!"
- Levels are *your* creature's story: a **shared code arrives at level 1** (`normGenome` strips `xp`); an **exhibit** code may carry `xp` clamped to `6·81 = 486` (exactly the L9 threshold).

### The explorer as a battler — the character sheet
- `pstats = {vit, fer, res, agi, ins}`, each starting **50**, clamped **1..330**.
  - **Vitality** → HP pool, **Ferocity** → attack, **Resilience** → defense, **Agility** → initiative, **Insight** → crit.
- `HP_MAX = max(20, round(vit·2))`; `recomputeHPMax` tops you up when Vitality grows.
- **Growth = eating flora.** `healExplorer` mends HP *and* raises one stat: `floraStat(g)` picks 1 of the 5 deterministically from the plant's genome seed; the gain is `1 + floraTier + (Xenobotany Lab ? 1 : 0)`. A toxic meal (poison roll) heals nothing and can gut you to the brink but **never kills** the explorer.
- **Current v2 meal owner:** one exact owned specimen lot is selected from its verified Flora
  Compendium page and consumed whether the outcome is safe or toxic. The preview and commit share
  the same heal, risk and seeded-stat facts. Safe healing includes registered worn `heal`; poison
  damage does not, grants no stat, and stops at 1 HP. Stats cap at 330, and a Vitality increase
  recomputes maximum HP and tops up only the increase. Physiology and Flora ownership share one
  receipt-bearing F4 commit with no retry or optimistic result.
- **Player battle profile** (`playerBattleStats`): tier = `clamp(floor((total−250)/130), 0..TIER_MAX)`; fixed ability **Frontier Resolve** (regen 0.04, taken ×0.9). Power = sum of the five stats.
- **The paperdoll.** `paperdollAvatar()` renders the full-body explorer figure; the nine gear sockets pin to it via `DOLL_ANCHORS` (fractional x,y). `playerAvatar()` is the gold-helmeted battler portrait used in duels. `playerCombatant()` fields you with genome `{seed: PLAYER_SEED}`.
- **`PLAYER_SEED = 0x50A1E5`** — a stable seed so *duels against you* are deterministic and reproducible on every device (your avatar/genome never drift).

### Milestones — the standing-rank ladder
- `rankInfo()` scores your whole record: `surveys·4 + codex.size·2 + best·12 + unlocked.size·6 + hybrids + galSeen.size·3`.
- `RANKS` thresholds (score → title): Cadet 0 · Scout 30 · Pathfinder 90 · Voyager 220 · Pioneer 460 · Star Cartographer 900 · Mythic Wayfarer 1700 · Void Sovereign 3000 · Cosmic Luminary 5200 · **Eternal Frontier 8200**.
- Past the summit the ladder never ends: a new **✦N** level every **3000** score beyond 8200.
- Each rank permanently unlocks a **nameplate color**; the default follows current rank, Eternal Frontier unlocks the iridescent foil.
- Discrete **achievements** (the `unlocked` set via `checkAch`, e.g. `harvest10` Quartermaster, `essence500` Stockpiler, `brink`, `fieldmedic`, `gambler`) are the finer-grained milestones layered on top.
- **Current v2 domain boundary:** `rank.ts` preserves those thresholds, weights, rewards and
  nameplate fallback rules exactly. `achievements.ts` is the versioned, immutable 96-row manifest
  and pure projection owner: 68 aggregate rules plus 28 action-event rules. Aggregate evaluation
  accepts only bounded integer/set-count/boolean facts; it contains no clock or entropy source.
  Event-owned rows report `event-owner-required` until their exact action writer has durably
  unlocked them. This prevents an aggregate such as “one settled world” from fabricating the
  witnessed first-settlement achievement.
- **Current v2 app/persistence boundary:** `arc9-progression-projection.ts` maps only sanitized
  canonical save owners into the domain snapshot; `records-rank-model.ts` exposes the exact six
  score factors and all 96 rows, while `records-rank-panel.ts` renders their bounded Records
  presentation without acquiring action authority. `arc9-progression-action.ts`
  persists only newly eligible aggregate rows plus a monotonic `bestRank` mirror through the
  generic F4 deterministic-action owner. The product, F4 authority, immutable receipt, tab-lease
  fence and repository revision share one CAS; a stale/lost/failed write is never retried or
  published. Postcommit verification requires the canonical save to re-project with zero eligible
  aggregate rows and the exact expected best rank. Main schedules that refresh only after the
  preceding product owner settles, suppresses a boot-baseline fanfare, and publishes a named-rank
  promotion only after durability. The same typed event adapter is joined by exact owners for
  canonical Earth `home`, world and companion `namer`, successful Legendary-pair `bredlegend`,
  first settlement `settle1`, player-at-1–19-HP `brink`, valid-world `share`, accepted-CF1
  `wayfarer`, twelve source-derived Survey events, source-proved `worm`/`quasar`/`dwarfg` travel,
  and explicit Atlas Favorite `curator`. Accepted Follow composes route, Jumps, galaxy visit,
  `wayfarer`, and any proved galaxy-kind event in its one existing receipt. They preserve unknown
  ids, protect the 146-row bound and independently verify the committed projection without
  inferring any other event. Explicit hostile Discover Life joins `survivor`; safe explorer Flora
  healing joins `fieldmedic`, and safe healing above 40% poison risk also joins `gambler`, each in
  its owning receipt (`bioscan-action.ts`, `explorer-meal-action.ts`). Only `daily` and `decade`
  still require their absent gameplay transactions. Explorer self-rename is a separate identity-only
  receipt/CAS and cannot unlock `namer`.

### Compendium collection progression
- The species catalogue is the **Compendium** (`codex`, keyed by species id; `_storeSpecies` dedupes — only a genuinely *new* species is "fresh").
- **Rare-find ☄ Stardust:** on the **first** catalogue of a Legendary+ specimen (`grade.tier ≥ 5`) you earn **`tier − 3`** Stardust, a ✦ Rare Find cinematic, and a rarity sting. Tier ≥ 4 throws a color burst. (Never re-paid — dedupe gates it.)
- **Binder** sets expose a separate **one-time Claim** when complete. Current v2 keeps six type
  pages and eight Set claims; `para10` pays 120 current/lifetime Stardust after ten exact Paragons.
  All fifty missing silhouettes can plot their source-proven homes through existing ship/Prime
  reach checks; found entries **Inspect** the exact existing Compendium record without travel.
  Prior claims stay claimed and cannot pay twice. Paragon portraits retain the existing static art.
- **First Arrival:** reaching a system no record precedes you in pays **+2 ☄**.

### How depth affects progression
- **Conquest XP scales with world tier** (`+tier` on both the +20 and +60 awards) — "leveling finally opens up with distance."
- **The Depth Tax** (`DEPTH_TAX = [1.0, 1.3, 1.6, 1.9, 2.2, 2.5]` by frontier region; home galaxy ×0.8): grades the *wound you take*, not the shown danger %. Creature POWER rolls stay position-free by design (fingerprint law) — the ramp lives app-side on the injury (`depthTax` → `dangerOf` damage).
- **Rarity is a ladder of distance:** the reachable grade band widens ring by ring (Neighborhood→Legendary, home galaxy→Mythic, then Celestial/Primordial/Transcendent, Deep Field→summit grades), so the strongest catalogue entries and the best rare-find payouts live farthest out.

## 3. Key tables & numbers (REAL values)

### XP curve (6·l²) — thresholds to reach each level
| Level | XP needed (6·L²) | Cumulative note |
|------:|-----------------:|-----------------|
| 1 | 6   | first win or two |
| 2 | 24  | |
| 3 | 54  | +1 art slot |
| 4 | 96  | |
| 5 | 150 | |
| 6 | 216 | +1 art slot (3 total) |
| 7 | 294 | |
| 8 | 384 | |
| 9 | 486 | **cap** (exhibit-code xp clamp = 486) |

### XP awards
| Source | XP |
|--------|----|
| Friendly duel win | +8 |
| Conquest win | +20 + world tier |
| Guardian / Titan win | +60 + world tier |
| New species catalogued (to Field Scout) | +2 |

### Explorer stats
- `pstats` start **50** each, clamp **1..330**. `HP_MAX = max(20, round(vit·2))` (base 100).
- Flora meal stat gain: `1 + floraTier + (lab1 ? 1 : 0)`.
- Player tier: `clamp(floor((total−250)/130), 0..TIER_MAX)`.

### Rank ladder (score thresholds)
0 Cadet · 30 Scout · 90 Pathfinder · 220 Voyager · 460 Pioneer · 900 Star Cartographer · 1700 Mythic Wayfarer · 3000 Void Sovereign · 5200 Cosmic Luminary · 8200 Eternal Frontier · then ✦N every +3000.

### Depth tax by region
`[1.0, 1.3, 1.6, 1.9, 2.2, 2.5]` (Solar Reach → the Frontier); home galaxy override ×0.8.

### Rare-find stardust
First catalogue of tier ≥ 5 → **`tier − 3`** ☄ (Legendary=5→+2, up through the summit grades). First Arrival → +2 ☄. Harvest (settled world, hourly) → `6 + tier·4` ☄.

## 4. Data / save fields
- **Creature XP:** stored *inside* each Compendium entry's genome — `codex` saves as `{g, f, w}` (genome / from / where), so `g.xp` rides along. No separate xp field.
- **`pstats`** — saved verbatim as `pstats` (each key coerced/clamped 1..330 on load).
- **`me`** — explorer name; **`nh`** — nameplate hue.
- **`essence`** (current ☄) + **`essenceEarned`** (lifetime, drives breeding-odds bonus and Stockpiler ach); **`harvests`**, **`guardians`**, **`paragons`**, **`br`** (best rank).
- **`scout`** — the Field Scout creature id (target of the +2 catalogue XP; must resolve to a Compendium fauna on load).
- **`ach`** — the unlocked achievement set; ranks are *derived* (`rankInfo`), not stored.
- **Current v2 projection boundary:** at most 146 bounded unique `ach` tokens (the mature 96-row
  catalogue plus the save codec's 50-row compatibility allowance) are accepted. Unknown safe ids
  remain explicit `unsupportedUnlockedIds` and still count exactly as the mature `unlocked.size`
  rank formula did; they never create a known catalogue row. `br` remains the durable best named-rank
  index, so unlocked nameplate colors never demote. The aggregate writer preserves existing order,
  appends only canonical aggregate ids, and refuses a write if the complete successor would exceed
  that bound. No partial unlock, alternate carrier, save shape, or migration was added in Arc 9.
- Related economy/gear fields (`ea`, `cargo`, `items`, `eq`, …) are documented in `ECONOMY_LOOT_CRAFTING.md`.

## 5. Determinism
- **XP → level is a pure deterministic derivation** (`levelOf`), no randomness. Same xp ⇒ same level everywhere, forever.
- **Anti-cheat / cross-device parity:** `normGenome` strips `xp` from any imported genome — **shared codes arrive at L1**; only an **exhibit** code may carry xp, clamped ≤ 486.
- **`PLAYER_SEED = 0x50A1E5`** fixes your battler genome so duels against you replay identically on any device.
- **Not part of the 49-probe fingerprint.** Levels, `pstats`, ranks and the Depth Tax are all *player save state* / app-side wound math — the fingerprint covers world/genome/descriptor **generation**, which is deliberately position-free. Progression can evolve without a re-pin.

## 6. Code anchors (functions + ~line numbers)
- `levelOf` — **10847**; `classKit` (art-slot count) — **10848**; `awardXP` — **11439**.
- `PLAYER_SEED` — **11187**; `playerBattleStats` — **11188**; `statBlockHTML` — **11196**; `playerCombatant` — **11211**.
- `playerAvatar` — **10893**; `paperdollAvatar` — **10945**; `DOLL_ANCHORS` — **11176**.
- `pstats` — **12099**; `hpMaxFromVit` — **12100**; `floraStat` — **12101**; `recomputeHPMax` — **12104**; `healExplorer` (stat growth) — **12181** (gain at **12205**).
- `RANKS` — **9780**; `rankInfo` — **9783**.
- Rare-find stardust / cinematic — **8790–8796**; Field Scout +2 XP — **8800**; Set-complete bounty — **9283**; First Arrival +2 — **9490**.
- `DEPTH_TAX` / `depthTax` — **12131–12137**; `dangerOf` — **12139**.
- Compendium `discoverSpecies` — **8781**; character-sheet doll render — **~16220**.
- Save (codex/pstats/essence) — **10096 / 10186 / 10120**; load scout — **10228**.
- Current v2 rank/achievement and saved-choice domain —
  `port/v2/packages/domain/progression/src/rank.ts` and `achievements.ts`; exact metadata/rule,
  threshold, boundary, unsupported-id, immutability, export and dependency sentinels live in the
  sibling `test/rank.test.ts` and `test/achievements.test.ts`.
- Current v2 sanitized adapter, aggregate persistence action and live Records model/panel —
  `port/v2/apps/game/src/arc9-progression-projection.ts`, `arc9-progression-action.ts`, and
  `arc9-nameplate-action.ts`, `nameplate-settings.ts`, `records-rank-model.ts` /
  `records-rank-panel.ts`; fixed-point, one-CAS, stale/storage,
  hostile-input, capacity, event-owner preservation, Main wiring and presentation evidence lives in
  `port/v2/tests/arc9-progression.test.ts`, `arc9-main-wiring.test.ts`, and
  `records-rank-panel.test.ts`.
- Current exact event joins — `arc0-landing-action.ts` owns `home` only for the complete canonical
  Earth address (including the legacy-intended Training Earth case), and `arc0-world-name-action.ts`
  owns `namer` for a committed discovery-name action. `arc5-rename-action.ts` owns the same id for
  one exact companion name; `arc5-breed-action.ts` owns `bredlegend` only on the proved successful
  Legendary-pair successor; and the Arc 6 combat action/settlement own `settle1` and the exact
  1–19-HP `brink` case. `arc9-sharing-action.ts` owns `share` plus `stats.shares` in one
  `arc9-share-send-v1` receipt for a valid-world native Share, and owns `wayfarer` only for an
  already-accepted CF1 Follow route. `share5` is an aggregate projection from
  `sharedCodeCount >= 5`, not a second event owned by the Share action.
  `arc9-progression-action.ts` owns the optional following `arc9-progression-refresh-v1` receipt
  that adds `share5` and/or raises best rank after the Share owner settles. `arc9-survey-action.ts`
  derives twelve observation joins from the registered CF1
  hierarchy. `arc9-travel-action.ts` derives galaxy visit plus `quasar`/`dwarfg` on arrival and
  `worm` on proved wormhole traversal; accepted Follow folds that arrival successor into its existing
  sharing receipt rather than opening a second write. `arc9-atlas-favorite-action.ts` owns only the
  explicit false-to-true Favorite edge and preserves the Atlas row/route identity in place. Their
  focused action and fixed-point tests sit beside those owners.
- `arc9-explorer-name-action.ts` plus `explorer-name-settings.ts` own identity-only explorer
  self-rename. The action changes only `explorerName`, uses the shipped sanitizer/24-character cap,
  gives cleaned-empty and unchanged input no receipt, and intentionally has no achievement side
  effect.

## 7. Open questions / pending
- Arc 9's standing **rank ladder + 96 achievements** is now live through the bounded Records board,
  AppChrome nameplate, receipt-following aggregate refresh and committed-publication achievement/
  rank ceremonies. Newly appended known achievements use text plus sting 3; a saved named-rank
  promotion uses text, sting 5 and effects-budgeted gold FX from AppChrome-owned geometry. The
  saved choice now has a live Settings selector for Auto/current-rank or every permanently earned
  color, and Settings also owns the identity-only Explorer name editor. These ceremonies are
  notifications only; no separate item/currency reward is implied.
- Exactly **two event IDs remain explicitly blocked, not inferred**: `daily` and `decade` belong to
  dormant Beacon/Cosmic Events. Hostile explicit Bioscan now owns `survivor`; safe explorer Flora
  healing owns `fieldmedic`; and a safe above-40%-risk meal owns `gambler`, each in its true action's
  transaction and postcommit ceremony seam. Combat retains its separate bounded
  post-settlement cue path.
- Field Scout XP path (+2) requires a scout to be *set* and to be a different fauna than the fresh catch; a run with no scout set banks nothing from cataloguing — intended.
- XP has a 1e6 hard cap but L9 is reached at 486; everything above 486 is inert. Fine today; note if a soft "prestige past 9" is ever wanted.
- Depth Tax tops out at ×2.5 (Frontier). No open balance flag, but it's the main survivability knob — watch alongside gear scut/hull.

---

## ADDENDUM 2026-07-30 — round 8: the awards that were advertised and never paid

Of the nine XP awards the Guide advertises, **three were dead** as of round 8 — and
the largest of them had never paid in any shipped build.

| award | status after 2026-07-30 |
|---|---|
| welcome meal +1 | ✓ fixed v1.8.5, ledgered |
| taste discovered +2 | ✓ always worked |
| successful union +2 | ✓ fixed v1.8.5 |
| first-of-its-kind lineage +5 | ✓ **now genuinely once per pairing** (was firing on every breed) |
| bout survived +2 | ✓ **fixed 2026-07-30** |
| fight taken to the wire +3 | ✓ **fixed 2026-07-30** |
| conquest lost +3 | ✓ fixed v1.8.5 |
| defender nearly broken +5 | ✓ legacy v1.8.5 remained foreclosed by an earlier +3; current v2 repairs the shared-key bug with a stored 0→3→5 maximum and outcome-tests both orders |
| **duel won +8** | ✓ **fixed 2026-07-30 — had never paid in ANY build** |

**The duel awards (CF1805-02).** Round 7 correctly diagnosed that `mine.id` is set
at no reachable call site, derived a catalogue identity `_mid` from the genome, and
guarded on it — then passed `mine.id` to `awardXP` anyway. `awardXP(undefined, …)`
hits `codex.get(undefined)` and returns. Both friendly-duel callers build
`{name, genome, art}` with no `id`.

For participation this made the build **strictly worse than before the fix**: the
guard now fired, consumed the 30-second throttle, and paid nothing, so the next
qualifying bout inside the window was blocked too. Previously the guard never fired
and the throttle was never touched. `stats.duelwins++` sits *outside* the guard, so
a win counted toward rank and achievements while the creature that won it got
nothing.

**The lineage bonus (CF1802-16)** paid on *every* successful breed. The ledger key
was `[aEntry.id, bEntry.id]`, and `codexId` is `'s'+seed` — per **individual** —
while both parents are consumed one line above. That key can never repeat, so the
one-shot ledger worked perfectly and guarded nothing. It is now keyed on the
pairing, which is what the code's own comment always said it meant. The numbers
were never affected (7 XP is still level 1); the toast was lying every time.

**The lesson, and the standing rule it earns.** The external round has recommended
the same thing for five rounds: *assert that the XP arrived, not that the code path
ran.* `smoke.js` did have a duel-XP check — it called `awardXP()` directly, so it
stayed green through every build in which the friendly duel paid nothing at all.
`tools/duelxp-check.js` now drives the real arena and reads the ledger afterwards.

⚠ **Only the duel awards have an outcome test today.** The other six deserve the
same treatment; that work is open. See ROADMAP's 2026-07-30 batch log.
