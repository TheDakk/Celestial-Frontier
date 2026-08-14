# V2 FULL SWEEP — 2026-08-13 (planning-only review, no code changed)

**Status:** review record + forward game plan, written by Anthropic/Claude Code on
`anthropic/windows` from clean synchronized `develop` merge `9aad1a423dd4` (PR #20).
This document records findings and proposals only. **Nothing in it is implemented**;
every finding lands in a named future batch with its own tests and negative controls.
Findings here supplement (never replace) the deviation ledger in `port/v2/DEVIATIONS.md`;
when a batch fixes one, record the fix there as usual.

**Local verification of the reviewed state:** `npm test` 25 files / 283 passed / 1 skipped ·
`npm run typecheck` clean (workspace root + `apps/game/tsconfig.json`). Matches CI on
`develop` at `9aad1a4`.

---

## 1. Method and coverage

Read line-by-line (six parallel reviews, one per area):

| Area | Files | Lines |
|---|---|---|
| App core | `apps/game/src/main.ts` | 3,805 |
| App UI/system surfaces | `panels.ts`, `training.ts`, `guide-content.ts`, `release-content.ts` + instrument quality of `audit.ts`, `hybridmatrixaudit.ts` | ~4,100 |
| Persistence | `packages/persistence/*` (repository, import-v2, export-v2, tests) | ~1,200 |
| Scene | `packages/scene/*` (charter, address, zoommode, composition, tests) | ~1,300 |
| Domain + audio | 17 domain facades + hand-written `.d.ts` surfaces + `sessionrng`/`progression`/`genetics` wrappers + `packages/audio` | ~2,500 |
| Art runtime | `speciesart.ts`, `index.ts`, `skin/torso/surface.ts`, `resolveOverride` plumbing, cache behavior of `thumbart`/`hdart`/`artextras`/`galaxyart` verbatims | ~3,500 |

Deliberately **sampled, not re-judged**: the 1,250 Platinum-certified species tables
(frozen by decision — reopening them is out of scope), verbatim lifted domain bodies
(bug-for-bug parity by law; only their facades/declarations were reviewed), and the
`tools/*.mjs` evidence harnesses (own selftests and negative controls; two low
instrument notes recorded below). Cross-cutting contract: `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`
read in full and used as the plan's spine.

Severity: **HIGH** = can corrupt/lose player state or silently break a core law ·
**MED** = real defect or trap, bounded blast radius · **LOW** = latent/edge/hygiene.

---

## 2. Findings register

### 2.1 Persistence (`packages/persistence`) — save integrity

- **PER-1 · HIGH · `repository.ts:89–96` — `recover()` overwrites the primary on disk
  *before* the recovered payload is classified.** Corrupt primary + corrupt/future backup:
  recover destroys the on-disk primary bytes, then classification fails and reports
  `protected` over raw that no longer exists anywhere. The boot persist-hold's "protect
  the evidence" is partially vacuous. Fix shape: read backup → classify → conditional swap.
- **PER-2 · HIGH (latent, one-line test closes it) — nothing proves `exportSaveV2` output
  satisfies `isPlausibleSaveEnvelope`.** The boot classifier requires the 37-key envelope;
  the writer emits all 37 today, but one conditional-field refactor would make every save
  the game writes classify `invalid` at next boot and silently roll players back to backup
  on every boot. Add `isPlausibleSaveEnvelope(JSON.parse(exportSaveV2(...)))` across all fixtures.
- **PER-3 · MED · `repository.ts:90–94` — `recover()` is three transactions, not one
  conditional swap**; a concurrent tab's valid write can be clobbered by the stale backup.
- **PER-4 · MED · `repository.ts:97–103` — `reset()` clears only `meta`+`assetcache`+`journal`.**
  The other five §19.3 stores survive a reset. Inert today; a resurrection hazard the day
  split stores hold creatures/inventory. Clear all `STORES`, with a control that fails when
  the list grows.
- **PER-5 · MED · `import-v2.ts:170, 439` — `lastAnomKey`/`frontierEnding` are the only
  imported string fields with zero validation** (truthy objects pass the `as string` cast,
  round-trip verbatim; injection class if `ending` is ever rendered). Verbatim-parity —
  harden as a recorded deviation, not a silent edit.
- **PER-6 · MED (test blind spot) — the `future-version` branch of `readSaveWithRecovery`
  (`repository.ts:68`) has zero coverage**, and the orchestrated happy-recovery path
  (invalid primary → recover → `loaded{recovered:true}`) is never driven end-to-end.
- **PER-7 · LOW — transient `recover()` failure is labeled `invalid`** (safe direction,
  wrong player-facing reason).
- **PER-8 · LOW — set-membership fields accept non-string members** (v1-parity; comment it).
- **PER-9 · LOW — round-trip fixed point uses one frozen NOW**, so time-advancing codec
  drift (the `t`/mined stamp floors) is structurally invisible; the `t`-drag is never
  proven bounded under an advancing clock.
- **PER-10 · LOW — IndexedDB backend proven only against a hand-rolled fake** (recorded
  in-file); `onupgradeneeded`/versionchange untested in a real engine — prove before any
  schema migration relies on it.
- **PER-11 · LOW — a malformed `ContentRegistry` converts every save to `invalid`**
  (config bug → recovery churn); no registry-shape guard.
- **PER-12 · LOW — boot runs the full importer 2–3× on the same raw** (incl. ~1,500
  `describeSpecies` calls each) — bootperf budget, not correctness.

### 2.2 Scene (`packages/scene`) — navigation, charter, canonical identity

- **SCN-1 · MED · `charter.ts:117–127` — `bankLandfall` throws on non-integer/negative
  `ascCh`** instead of failing closed like every sibling; a crash inside `doLand` would
  abort a landfall mid-write (after `save.landed.push`, before persist).
- **SCN-2 · MED · `charter.ts:76–111, 193` — canonical `ASC_CHAPTERS_DATA` is runtime-mutable
  and its goal objects are aliased into the player-facing projection.** One sloppy renderer
  write rewrites the canonical charter process-wide. Deep-freeze it.
- **SCN-3 · MED (the live gate bypass, scoped-limitation made concrete) — star/galaxy CF1
  routes defeat `ascAllowsStar`/`withinReachOf` with forged coordinates.** Only planet
  routes go through `resolveCF1WorldAddress`; a crafted `t:'s'` code claiming near-Sol
  coords for any home-galaxy star seed passes the stage-1 gate at `main.ts:1215`, renders
  the real far system, and a subsequent real `doLand` banks non-Sol progression the charter
  forbids; the spoofed view then persists and boot-restores unchecked. The weaker routes
  carry the live bypass while the strongest gate protects the least dangerous route.
- **SCN-4 · LOW/MED · `zoommode.ts:34–47` — transition guards validate seeds only;
  coordinates unchecked** (NaN/missing x/y reach NavState and the camera).
- **SCN-5 · LOW — `viewToNav` retains raw caller objects; `_sanitizeView` fabricates a
  default star (seed 1 @ 0,0) from a `star:{}` stub** that `viewToNav` then trusts —
  needs a sentinel when boot ingress is extended.
- **SCN-6 · MED (edge) — chapter advance can wedge permanently on imported saves** whose
  current chapter is complete with saturated landfall goals: `bankLandfall` returns false
  forever, so `ascCh` never advances while the board shows `complete`. Evaluate advance at
  import/boot or on any landfall.
- **SCN-7 · LOW — `universe.ts:29` aliases `bridge` from the memoized cell cache** into
  returned nodes (the systemSol lesson is guarded for `P` but not `bridge`).
- **SCN-8 · LOW — `ascStageOf` truthiness on counts** (negative count ⇒ stage 3; only
  non-import callers exposed).
- **SCN-9 · INFO — `v2Stage(NaN)` returns NaN** (all comparisons fail closed; the named
  clamp doesn't canonicalize).
- **SCN-10 · INFO — canonical addresses carry 2-dp rounded coords, scene nodes raw floats.**
  Any future equality join must round through `normalizeCF1Coordinate`; only resolver-emitted
  keys are join-safe. **Ownership registries must key on the canonical
  galaxy+star+planet+ordinal key, never bare planet seed** (`save.landed` /
  `customNames['p'+seed]` are player-local and low-risk; receipts are not).
- **Test blind spots:** `star-ambiguous`/`planet-ambiguous`/throwing-source untested; no
  cross-hierarchy forgery test (galaxy A + star of galaxy B); no coarse+fine double-match
  control; SCN-1/2/4 uncovered; no sentinel on the fabricated-default star.

### 2.3 Domain packages + audio — facades, declarations, clock

- **DOM-1 · HIGH (wiring trap) · `progression/src/index.ts:44` — `base()`'s doc tells the
  app to persist the wrong value.** "Write this to the save as `epoch`" — but `base()`
  returns the load-time base frozen at construction. Wiring that follows the comment
  freezes COSMIC_EPOCH across sessions forever and every test stays green. Persist
  `current()`; fix the doc and add a stated persistence recipe. (The live slice at
  `main.ts:3001` already persists `current()` — the trap is for the next wiring author.)
- **DOM-2 · MED (declaration lie) · `worldgen.verbatim.d.ts:14` — `supernovaSites(seed, n)`
  declares an epoch parameter as a count.** A caller passing a desired count typechecks and
  quietly produces a supernova layer that never ages.
- **DOM-3 · MED · worldgen facade carries no `GAL_SPRITES` warning** — importing only
  `@cf/domain-worldgen` throws `ReferenceError` on the first *populated* cell unless
  descriptors' `installCaptureHooks()` ran (the exact 2026-07-31 green-while-broken shape,
  fixed in tests, still untold to fresh consumers).
- **DOM-4 · MED (wiring order) — nothing in the port defines the `COSMIC_EPOCH` global;**
  ecology reads it typeof-guarded (silently 0). The app sets it per tick today, but the
  bridge must be a *live* read installed before the first ecology/worldgen call — a
  boot-time copy freezes memo keys at epoch 0 for the session.
- **DOM-5 · LOW — combatcore ⇄ strays circular package dependency** (call-time only, safe
  today; record before bundling gets stricter).
- **DOM-6 · LOW — combatcore declaration corners:** `playerCombatant()` return lacks
  `cls`/`lvl` and ability theme fields the interface requires; `statBlockHTML`'s app-coupled
  list omits `STAT_KEYS`/`STAT_META`/`HP_MAX` globals; `_statOpen` mislabeled app-coupled.
- **DOM-7 · LOW (deviation-preservation trap) — D-CAT-1 dedupe reverts silently if a future
  app layer installs the legacy `_earthNamePass`** (hooks deliberately never overwrite an
  existing global; the masked parity test would keep passing). The app port must install
  `@cf/domain-descriptors`' pass, never a lifted one.
- **DOM-8 · LOW (declaration lie) — `Genome.wild?: number`; the only writer sets a boolean.**
- **DOM-9 · LOW — genetics facade: a failed `decodeLineage` would leak the NUL-prefixed
  internal token into `_earthBlend`** (unreachable today; one-line strip-on-failure in the
  facade future-proofs it).
- **DOM-10 · MED (export gap) — `sessionrng` `DOMAINS` names 7 of the 11 legacy
  `Math.random()` sites** while its header claims eleven; the test asserts only `>= 7`.
  Complete the roster and pin the exact set before D-RNG wiring.
- **DOM-11 · LOW — `_sanitizeSavedGenome` mutates its argument in place;** the declaration
  reads as a pure transform. Same class: `galaxiesInCell` returns an array carrying an
  out-of-type `web` property.
- **DOM-12 · MED — audio: every sting calls `ac()` outside its try/catch;** any
  `playSurveyPing()` before `initAudio()` is an uncaught ReferenceError from a UI handler.
  Bare `new AudioContext()` (no webkit fallback) is an unverified deviation. The package
  has **zero tests** — not even import-does-not-throw.
- Purity: **clean.** No unrecorded Math.random/Date.now/DOM leak in any domain package; the
  three known lint exceptions stand.

### 2.4 Art runtime (`packages/art`) — memory and API shape

- **ART-1 · MED · `hdart.verbatim.js:4758` — module-load DOM side effects:** importing
  `@cf/art/species` appends a `#vistabox` div and registers global listeners at chunk-load
  time (the "dormant vista" claim doesn't cover this line). Arc 1A's loader must treat
  "import the species chunk" as a DOM-mutating act sequenced by the app shell; any non-DOM
  import crashes at load.
- **ART-2 · MED — portrait cache budget is entries, not bytes** (256 × ~150–500 KB data-URL
  strings ≈ 40–130 MB desktop; 96 on phone still ≈ 15–50 MB, invisible to canvas accounting).
  Budget by `url.length` bytes with entry cap secondary.
- **ART-3 · LOW/MED — cap shrink never applied:** evict-one per insert plus a dynamic
  `matchMedia` cap means crossing the 700px breakpoint leaves 256 entries on a 96 budget
  permanently. Loop the eviction / trim on cap change.
- **ART-4 · MED (design) — thumb misses pollute the portrait LRU and double-encode:**
  each list-row miss pays the 880² `getImageData` scan + 440 `toDataURL` + async decode +
  132 `toDataURL`, and inserts the 440 URL into the portrait cache, cycling out the
  portraits the detail view needs.
- **ART-5 · MED — no in-flight dedup on the thumb build** (re-renders multiply decodes);
  no `onerror`, so a failed decode retries the full path forever and never gets a thumb.
- **ART-6 · LOW — `CLIPPED` grows without bound** (per render, not per species).
- **ART-7 · MED on phones — `galSpriteFor` cache is FIFO (no hit re-file), 65 × 512px
  canvases** (~65 MB worst) on top of `GAL_SPRITES`' 16 baked at module load; hot sprites
  can be evicted by cold browsing and rebaked. `index.ts` is hand-written — eligible for a
  real LRU touch.
- **ART-8 · LOW — global-shim seams** (`getGalaxySprite` drops the legacy second arg;
  `??=` load-order dependence; `CARD_FACTS` unbounded if the app ever writes it).
- **ART-9 · LOW/MED — cache-key completeness is also a fragmentation hazard:** keying on
  every enumerable field means volatile fields (hp/xp/timestamps) on a live creature record
  would fragment both LRUs; `stableGenomeNode` throws on function/symbol fields and has no
  cycle guard. Audit what the app passes (pure genomes today); keep the key law.
- **ART-10 · Determinism — clean** (no wall-clock/random in runtime paths; `toDataURL` is
  per-device deterministic — never feed those strings to share codes).

### 2.5 App core (`apps/game/src/main.ts`) — my read

- **MAIN-1 · MED (structural) — main.ts is 3,805 lines and growing into the v1 monolith
  shape:** chrome sync, guide/release rendering, compendium, atlas, charter UI, search/CF1
  ingress, import/replacement transactions, boot witnesses, all four Pixi scene draws, and
  input live in one file. Split into owned modules **before** the loot/taming arcs multiply
  panels (scene-draw, chrome, panel content, replacement/boot instrumentation, search/travel).
  Behavior-preserving; sequence it before contract Arc 2.
- **MAIN-2 · MED — `biosphereReplica` (`main.ts:2459–2480`) is a hand-copied verbatim body
  in the app.** Two copies of one derivation (the roster-level ladder) that must agree
  forever with the ecology path — the exact two-correct-fixes-disagree class. Home it in a
  domain package (strays-style lift) when Planetside next changes.
- **MAIN-3 · LOW — `worldRoster` caps at 8 species** (`slice(0,8)`) — fine for the strip;
  the taming/collection arcs need the full roster with paging.
- **MAIN-4 · LOW — `persistView` failure is silent outside the protected/transient paths**
  ("private mode: session continues unsaved") — a player on failing storage silently loses
  progress with no one-time notice.
- **MAIN-5 · MED (Arc 1B target) — scene texture accumulation:** `Texture.from(canvas)`
  retains canvas-backed textures in Pixi's global cache across scene rebuilds
  (per-galaxy `galaxyHaze` 2048px canvases, planet sprites outside the HD-swap path);
  `clearWorld` correctly destroys Text children but deliberately leaves shared textures.
  `_rgCache` unbounded (tiny). This is the Arc 1B ownership + plateau-gate scope.
- **MAIN-6 · INFO — `addToAtlas` stamps `Date.now()`** into `logMap` rows (save metadata,
  non-domain; matches legacy shape — fine, recorded).

### 2.6 App UI/system surfaces (`panels/training/guide/release`)

- **UI-P1 · LOW/MED · `panels.ts:127` — `#railrgt` missing from tap-empty exclusions:** a
  tap on the right rail's padding closes the open panel; the left rail doesn't. The cost of
  a hand-maintained chrome list.
- **UI-P2 · LOW — stale `_opener` when `openPanel` gets an unknown id** (next empty tap
  yanks focus to the stale button).
- **UI-P3 · LOW (latent, becomes daily the week a live Cargo grid ships) — `fillPanel` on an
  open panel strands keyboard focus;** Settings compensates locally; the primitive should
  own a restore-to-same-`data-sel` contract.
- **UI-P4 · INFO — `#tutcard`/`#planetside` not excluded from tap-empty** (harmless in the
  current six lessons; a trap for future lessons that keep a panel open).
- **UI-T1 · MED · `training.ts:191–199` — allow-scope is element-identity but the lesson
  surface can be rebuilt:** after `retainLessonSurface` reopens the survey, the rebuilt
  Land/Add controls are not in `allowedRoots` — the trainer spotlights a button it swallows,
  and the rebuilt card's non-allowed controls come back un-inert. Evaluate scope by selector
  at event time, or re-run `applyAllow` after any retention/reopen.
- **UI-T2 · LOW/MED — `--tut-bot` published once per step** (stale across rotate/resize
  mid-step; CF1805-01's variable law needs a ResizeObserver refresh).
- **UI-T3 · LOW — mid-list Tab redirect snaps to the first preferred target**, not the
  adjacent in-scope element (never traps in the current six steps; will in dynamic lessons).
- **UI-G1 · MED (hazard by one string) — the Guide's `unavailable()` factory is a
  full-legacy-copy cliff:** granting a single capability flips the complete v1.8.9 body
  live with a completeness claim and no partial staging. Audited: no topic flips today —
  the law holds by one string. Make `available` an explicit per-topic human sign-off and
  split coarse capabilities into verb-level flags before the first mining/taming slice.
- **UI-G2 · INFO — Insight/Instinct stat-name split is latent in the frozen legacy bodies**
  (exposed only via the G1 cliff).
- **UI-G3 · INFO — dormant topics unfindable by search** (deliberate per the panel blurb).
- **UI-R1 · Verified safe — the release draft cannot touch popup/`rnSeen`/version state**
  (typed-`null` current version; only shipped entries can mark seen; draft renders labeled).
- **UI-R2 · LOW — `getLegacyReleaseLine` falls back to v1.8.9's notes for unknown versions**
  (fails quiet, not loud).
- **UI-R3 · INFO — release bullets render unescaped by design** (compile-frozen authored
  HTML; becomes a sink only if copy is ever dynamic).
- **Instruments (quality notes only):** audit.ts duplicate sentinel is per-kingdom-sheet
  scoped and its sampling can only over-report (documented polarity); `?strip=` can't reach
  the second owner of a duplicated name (the retained microbe route has no eyeball
  instrument); `?full=1` and hybridmatrixaudit's default `EMIT=true` hang silently without
  a driver. Training/Guide/release otherwise verified honest against the slice, claim by claim.

---

## 3. Vision alignment — where the code stands against the game we want

The target (Nick, 2026-08-13): an encapsulating explore/mine/build/craft/tame loop —
Diablo/PoE loot chase, Minecraft/Satisfactory sandbox-crafting, infinite exploration,
Pokémon-style taming and attachment, Spore-style "never know when the next best creature
appears" — **never punishing**, per the deep-play law in `PROCESS_LAWS.md` and §1 of
`EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` (the approved contract; this sweep confirms it
is the right spine and proposes no change to it).

- **Infinite exploration — strongest foundation.** Deterministic universe, reach/charter
  gates, share codes, survey-first input, and the fail-closed CF1 planet resolver are
  production-quality. The gaps are identity gaps: canonical ingress covers only the planet
  route (SCN-3 is the live bypass), NavState still admits illegal shapes (D-NAV), and
  world-keyed registries must move from bare seeds to canonical keys before anything is
  *owned* on a world (SCN-10). §1.1's per-world opportunity map is the design piece that
  turns "infinite" into "worth mastering" — schedule its contract with contract Arc 3.
- **Diablo/PoE loot — design ready, substrate not.** `GearInstance` + receipts + roll
  grammar (§6) are well-specified. Blockers in order: persistence CAS/revisions and the
  receipt journal (PER-1..4 + D-STORE/D-RECEIPT), the identity split (D-IDENTITY-LOOT),
  then a **pure `@cf/domain-loot`** anchored on the verbatim `rollAffix`. The review's key
  law: *content identity* (what a drop is) derives from pure hash of
  `sourceActionId`+ordinal — reproducible, reroll-proof; *whether an outcome happens*
  (drop/capture/tame) is a SessionRNG domain roll — unpredictable in the moment,
  save-scum-proof because replay is identical. Never seed a taming roll from the genome
  pair the way duels are (a creature would be permanently uncapturable by a player).
- **Sandbox/crafting (Satisfactory) — contract Arcs 2–3.** Mining/research/fabrication need
  the active-play clock authority first: the Auto-Extractor wall-clock exploit
  (D-AUTOEXTRACT-CLOCK) must not return, and DOM-1's `base()`/`current()` trap must be
  fixed before anyone wires accrual. The economy source/sink/pacing model (§6.2) is a
  deliverable, not an afterthought.
- **Pokémon taming / Spore discovery — contract Arcs 4–5.** The renderer side is ahead of
  the game side: procedural creatures, hybrid lineage continuity, and the audit
  instruments already make "the next best creature" visually real. Missing is the whole
  ownership chain: CatalogSpecies/CreatureInstance split, finite Tame/Scavenge/Sample
  writers with receipts, nonlethal breeding + Recovery, bond/Chronicle. Compendium
  virtualization (Arc 1A) is the doorway — the collection UI must scale before the
  collection exists.
- **Never punishing — codified, keep it executable.** No wall-clock rewards, no expiry, no
  hidden odds, active-play progress only, ready rewards wait. These stay acceptance
  criteria on every batch (partially testable: clock-wind controls, no-expiry invariants).

---

## 4. Game plan — proposed batch order

Foundation before content, per the contract's own sequencing law. Each batch = one draft
PR from an agent branch into `develop`, docs updated in the same PR, outcome tests +
bidirectional negative controls, no version bump, no release authority.

**F1 — Hardening quickies (small PR, first).** Closes the cheapest save-integrity and
law-guard traps found by this sweep, all test-first: PER-2 (export↔envelope test),
PER-4 (reset clears all stores), PER-1 (classify-before-swap recover) + PER-6 tests;
SCN-1 (clamp `bankLandfall`), SCN-2 (deep-freeze charter data), SCN-6 (wedged advance);
DOM-1 (clock doc + persistence recipe), DOM-2 (`supernovaSites` d.ts), DOM-3 (facade
warning), DOM-10 (complete `DOMAINS` to 11); DOM-12 (guard stings pre-init + first audio
test); UI-P1 (`#railrgt`). ~15 focused changes, each independently verifiable.

**Arc 1A — Compendium virtualization + thumbnail/resource ownership** (the previously
proposed scope, refined by the art review):
1. Windowed list (~two viewports + overscan), spacer-preserved scrollbar, focused row
   pinned mounted; filter/count/detail/focus-carry/Close semantics unchanged.
2. `leaseThumb(g)` in `@cf/art/species`: sync return only on 132px cache hit; miss mounts
   the neutral placeholder tile and takes a refcounted lease on a bounded, time-sliced
   main-thread job queue (painters need `document`); release on row unmount/panel close;
   dropped-at-dequeue cancellation; in-flight dedup + `onerror` handling (ART-5). Identity
   stays the shared complete-genome `speciesArtKey` (the recorded collision law).
3. Internal `renderPortraitCanvas` seam: thumb jobs downscale canvas→canvas, skipping the
   portrait-cache insert and the encode→decode round trip (ART-4); this same seam is what
   Arc 1B's Pixi textures need — build it here.
4. Byte-budget both caches + loop eviction (ART-2/ART-3); `speciesThumb` stays as a
   deprecated non-list shim (delete later with usage proof).
5. Planetside chips migrate to the lease path, structure unchanged.
6. Species-chunk import sequenced by the app shell (ART-1).
7. New gate `npm run compendiummem` (own selftest + workspace lock, wired into CI): seeded
   deterministic 1,500-row codex; scroll passes; assert mounted-row bound, no list `<img>`
   decoding above 132px (`naturalWidth` probe — the axis entry-count caches are blind to),
   decoded-image count + JS heap warm plateau, populated-surface proof, focus/detail/filter
   reachability; negative controls: windowing off, lease release off, 440-mount defect
   reintroduced — each must fail with its own diagnosis; run phone + desktop viewports.

**Arc 1B — Pixi/canvas texture ownership + long-session memory plateau.** Ownership for
scene textures beyond the replacement-reload teardown (MAIN-5: per-galaxy haze, planet
sprite tiers, `_rgCache`), lease/refcount as the eviction gate for the package canvas
caches (ART-7 LRU touch), `pagehide` notifying texture owners, and a
travel→Compendium→Shipyard-cycle plateau gate under raw-CDP resource counters (the
contract §5.2 requirement).

**F2 — NavState discriminated union + canonical ingress extension.** The scene review's
order: (1) union + validating/freezing smart constructors reusing the address validators
(closes SCN-4/5, D-NAV); (2) `resolveCF1StarAddress`/galaxy factoring so `jumpToView`
resolves **every** non-universe route before gates/persistence see coordinates (closes
SCN-3, the live bypass); (3) boot-saved views + Atlas rows through the resolver, degrade
to home (neutralizes the fabricated-default star); (4) branded `ProvenStar`/`ProvenPlanet`
node types for generated descents. **No world-bound ownership writer before this lands.**
Add the missing address tests (ambiguity, cross-hierarchy forgery, throwing source).

**F3 — Persistence CAS + split stores + receipt journal + tab lease.** The persistence
review's order: CAS guard on `StorageBackend.apply` (+`stale-writer` outcome, memory
backend gains identical semantics); real-browser IDB proof incl. `onupgradeneeded`
(PER-10) before any schema migration; instance stores (`inventory`, `creatures`) keyed by
instanceId; append-only `journal` receipts keyed by save-lifetime RNG ordinal, written in
the same transaction as the mutation they witness (exact-once = key uniqueness + CAS);
v4→v5 migration with a pre-migration journal snapshot, failure leaving v4 intact;
`meta/lease` tab lease for the active-play millisecond clock. `importSaveV2`/`exportSaveV2`
freeze as the v4 codec/migration reader-writer.

**F4 — Clock + SessionRNG wiring.** Live `COSMIC_EPOCH` getter installed before first
ecology/worldgen call (DOM-4); persist `current()` (DOM-1); session seed minted and
persisted atomically **before the first roll**; the 11 legacy `Math.random()` sites
replaced one at a time, each with its `DOMAINS` name, an *outcome* test (the duel-XP law)
and a perturb-the-counter negative control; `state()` into every save + diagnostics export.

**UI structural prep (rides with F-batches, lands before contract Arc 2's inventory UI):**
panel registration metadata for chrome/modal/tap-empty (kills the UI-P1 class), `fillPanel`
focus-preservation contract (UI-P3), **a decided panel-coexistence law** (Diablo-style
inventory + item-compare + vendor cannot live under the one-panel law — decide the layer
rule now, don't let the first inventory PR carve exceptions), Escape-order moved into the
manager, capability-gated lesson arcs with a typed event bus and selector-evaluated
allow-scope (UI-T1..T3), and the Guide sign-off model (UI-G1: `available` only by explicit
per-topic human review; verb-level capability flags). MAIN-1's main.ts split belongs here.

**Then the contract ladder as approved** (§13, unchanged): Arc 1C ship visual state +
static Shipyard proof → Arc 2 item instances + readable economy (`@cf/domain-loot`) →
Arc 3 engineering loop (finite veins, active-play extraction) → Arc 4 capture/ownership
(`@cf/domain-taming`; roll-as-argument outcome resolvers) → **Arc 4.5 first complete
30–60-minute journey (human gate)** → Arc 5 companions → 5.5 combat decision model →
6 combat/Guardians → 7–8 audio → 9 legacy/projects → 10 integration beta. Human
experience gates (§13.1) are not disguisable with metrics.

### Decision points for Nick

1. **Batch order:** F1 → 1A → 1B → F2 → F3 → F4 (recommended), or 1A first if the
   Compendium work should lead. F1 is 1–2 days and protects save integrity.
2. **Panel coexistence law** (one-panel vs layered inventory/compare) — needed before any
   inventory UI is designed.
3. **Guide sign-off change** (UI-G1) — approve making `available` an explicit human review.
4. Arc 1A details previously proposed: leased API alongside deprecated `speciesThumb`,
   plateau gate as its own npm script in CI, neutral placeholder tile.

---

## 5. Boundaries honored

No product code changed in this batch. No `develop` → `main`, no release/version/deploy
authority, no manual Pages writes, no legacy/parity deletions (the §11 dead-code law
stands: nothing removed without complete usage proof). The Platinum portrait freeze,
verbatim-parity rule, determinism law, and save compatibility are untouched by everything
proposed here; where a fix touches a verbatim surface (PER-5), it is flagged as a
recorded-deviation decision, never a silent edit.
