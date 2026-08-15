# Celestial Frontier v2 — Complete Program Roadmap

> **Status:** comprehensive planning baseline, created 2026-08-14; implementation state updated
> 2026-08-15.
> **Scope:** the complete approved v2 program—foundation repairs, product Arcs 0–10,
> premium visual/audio production, Gate A–I evidence, and release readiness.
> **Implementation status:** active, one bounded review branch at a time. F1a save integrity is
> integrated in `develop` at merge `a1dabdeb4059292d67d7a89652e92fb317d750c7`; Charter
> SCN-1/SCN-2/SCN-6 is integrated at merge `bd49beb0693b45fdd57d4acad746ade79843a91e`.
> UI-P1 registered panel-chrome dismissal is integrated at merge
> `b5e5d0a3b4bb4057fa6d251816454b370e8b2624`; the truthful WorldGen contract is the active
> bounded F1b batch. Later F1b slices and product batches remain planned.
> This document does not authorize a release, deployment, version bump, or claim that an entire
> Gate is closed.
> **Review provenance:** the accepted PR #23 and HD-audio review inputs are preserved verbatim at
> [`../audits/v2-program-review-2026-08-14/`](../audits/v2-program-review-2026-08-14/).

## 1. Purpose, authority, and status

This is the operational coverage map for the v2 program. It maps approved product direction into
named work packages, dependencies, evidence, human gates, and review questions so no system is
lost between a sweep, a handoff, and a future PR. It does not replace the live session handoff in
`ROADMAP.md`, the source code, or a specialist system reference.

### 1.1 Authority order

When sources disagree, resolve the conflict in this order and record the discrepancy as work:

1. Current source and the live `ROADMAP.md` handoff establish current implementation state.
2. [`../EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`](../EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md)
   owns approved product direction, Arc 0–10 sequence, player promise and acceptance.
3. [`DECISIONS.md`](DECISIONS.md) owns decisions Nick has made; decided does not mean implemented.
4. [`RUBRICS.md`](RUBRICS.md) defines what counts as executable and human completion.
5. [`PORT_MASTER_PLAN_v4.0.md`](PORT_MASTER_PLAN_v4.0.md) owns premium visual/audio architecture,
   data/migration architecture, master phases and Gates A–I.
6. [`v2/README.md`](v2/README.md) and [`v2/DEVIATIONS.md`](v2/DEVIATIONS.md) establish the current
   v2 boundary and the live open/closed delta ledger.
7. [`V2_FULL_SWEEP_2026-08-13.md`](V2_FULL_SWEEP_2026-08-13.md) is an independent findings and
   proposal record. It informs this roadmap; it does not silently amend an approved contract.
8. Historical handoffs and old CI run IDs explain why, never current branch/check/publication state.
   Verify those live.

`ART_DIRECTION.md`, `AUDIO.md`, `AUDIO_LICENSES.md`, the system references, and
`PROCESS_LAWS.md` are binding specialist references within their subject areas.

### 1.2 Status vocabulary

| Label | Meaning |
| --- | --- |
| **[LIVE]** | Available in the current slice and supported by current source/evidence. |
| **[PARTIAL]** | A bounded part is live; all remaining data, ingress, quality, or evidence is named. |
| **[PLANNED]** | Approved direction, not yet player-visible or not yet proven. |
| **[DECISION]** | A product decision is still required before the affected work begins. |
| **[EXEC]** | An executable criterion has current exact-head evidence. |
| **[EXEC-TODO]** | An executable criterion is required but absent or insufficient. |
| **[HUMAN]** | Human review is required; no automated metric can replace it. |

The current v2 application is a playable exploration/survey Phase-4 slice. It is not a finished
v2 product: Inventory, Shipyard build actions, item instances, creature ownership, missions,
combat, Guardians, living previews, and full audio remain planned until their real actions,
persistence/reload, reachability, negative controls, and required human evidence land.

## 2. Product promise and non-negotiable program laws

### 2.1 The loop to build

```text
Discover → Learn → Gather → Build → Raise → Risk → Return → Reach farther
```

The player should feel curiosity, growing competence, attachment, and authorship. Every feature
needs a real choice, visible consequence, and honest next step. The program does **not** rely on
paid randomness, hidden odds, FOMO, expiring rewards, mandatory maintenance, unattended/offline
income, trade markets, global rankings, forced social play, or punishment for leaving.

### 2.2 Canonical ownership and identity

- One capability has one gameplay owner, one persisted authority, and one player-facing Guide
  statement. Presentation never grants progression.
- Gameplay identity, render identity, and audio identity are separate versioned projections.
  Improving visual/audio presentation cannot move worlds, alter stats, change share codes, or
  consume gameplay RNG.
- Catalogue species are not living companions; base items are not rolled item instances; rendered
  thumbnails/caches are never authoritative player state.
- World-bound ownership uses canonically proven galaxy/star/planet/ordinal provenance—not
  caller-supplied coordinates or bare planet seed.
- Destructive/reward mutations need one revisioned transaction and, where appropriate, an immutable
  receipt. Retrying a UI action must not create a second grant.

### 2.3 Evidence and player-truth laws

- Assert outcomes, not code paths. A helper call does not prove a player earned an outcome.
- Every new instrument has bidirectional negative controls and reproduces the reported state or
  geometry—not a convenient substitute.
- Painted is not answerable. Layout, touch, keyboard, focus, answerability, and lifetime require
  real-browser evidence where jsdom cannot observe them.
- A Guide capability becomes available only after its real action exists, persists/reloads, is
  keyboard/touch reachable, has outcome evidence, and fails a deliberate negative control. Human
  sign-off binds the exact body/capability revision.
- One surface has one Close owner. Layering is bounded: one primary workspace, at most one owned
  compare/inspection sidecar, and a true modal above both. Mobile uses push/stack presentation;
  Escape restores focus in modal → sidecar → workspace order.
- Every batch audits readers, writers, importers, exporters, player copy, resource ownership, and
  exploit paths for every value it changes.

### 2.4 Browser, accessibility, and release laws

- Phone is a first-class target: touch floors, safe areas, responsive density, deliberate quality
  tiers, heat/battery measurement, and physical-device evidence are requirements.
- Reduced Motion is visual only. It never slows ecological time, rewards, or readiness, and does
  not imply an audio preference.
- Important audio always has text, icon, animation, caption, or equivalent feedback.
- A DEV preview is a separate noindex exact-commit evidence surface, not a production/release
  signal. `develop` never enters `main` without separate approval.

## 3. Program dependency spine

Foundation packages are not replacements for product Arcs; they make the Arcs safe to build.

```mermaid
flowchart TD
  F1["F1a Save integrity\nF1b narrow guards"] --> F2["F2 Canonical ingress + NavState"]
  F2 --> A0["Arc 0 Current truth + continuity"]
  A0 --> A1A["Arc 1A Compendium virtualization"]
  A1A --> A1B["Arc 1B Texture/resource ownership"]
  A1B --> A1C["Arc 1C Ship visual foundation"]
  A1C --> F3["F3 CAS, split stores, receipts"]
  F3 --> F4["F4 Active-play clock + SessionRNG"]
  F4 --> A2["Arc 2 Items + readable economy"]
  A2 --> A3["Arc 3 Engineering"]
  A3 --> A4["Arc 4 Capture + ownership"]
  A4 --> A45["Arc 4.5 First complete journey [HUMAN]"]
  A45 --> A5["Arc 5 Companions"]
  A5 --> A55["Arc 5.5 Combat decision model [HUMAN]"]
  A55 --> A6["Arc 6 Combat + Guardians"]
  A6 --> A7["Arc 7 Audio foundation"]
  A7 --> A8["Arc 8 HD audio/content"]
  A8 --> A9["Arc 9 Legacy + projects"]
  A9 --> A10["Arc 10 Integration beta"]
```

Visual and audio production are linked workstreams, not later polish. Their milestones span the
product arcs and have independent Gate E/F/G evidence.

| Program point | Primary purpose | Main exit |
| --- | --- | --- |
| F1a | Save/recovery integrity | Invalid/future data cannot destroy recoverable data. |
| F2 | Canonical world ingress | No unproven route reaches render/reach/Charter/save/Land authority. |
| Arc 0 | Honest current truth and continuity | Guide, imports, and surfaced opportunities are truthful. |
| Arc 1A–C | Bounded catalogue, resource, and ship presentation | Presentation scales without leaks or false ownership. |
| F3–F4 | Transaction, time, and outcome authority | Future mutations are exact-once, active-play based, and replayable. |
| Arc 2–4 | Economy, engineering, and capture | The first safe ownership loop exists. |
| Arc 4.5 | First complete journey | Humans understand and enjoy the first 30–60 minutes. |
| Arc 5–6 | Companions, combat, Guardians | Attachment/challenge are strategic, non-punitive, and exact-once. |
| Arc 7–8 | Audio platform and content | Full mix is distinctive, accessible, lawful, and comfortable. |
| Arc 9–10 | Legacy, projects, integration beta | Complete sustainable product with release evidence. |

## 4. Foundation and current-truth work

### 4.1 F1a — save integrity and recovery contract

**Goal:** eliminate durable-save recovery risk before new systems increase save complexity.

**Required scope:**

- Classify a backup before it can replace a primary. Corrupt, unsupported-future, and transient
  input are never evidence that another stored value is safe to promote.
- Add a direct/exhaustive exporter → boot-envelope contract. Existing smoke covers one real
  export/reload path; it does not prove future exporter/classifier coupling.
- Make reset enumerate and clear every current authoritative store/key, with a control that fails
  if a new store is omitted.
- Cover future-version protection, invalid-primary → valid-backup recovery, invalid backup, fresh
  storage, transient failure/retry, and no-resurrection-after-reset outcomes.
- Preserve exact protected/recovery bytes wherever the save contract promises protection.

**Explicit exclusion:** F1a does not claim multi-tab safety, receipt atomicity, or v5 migration.
Those belong to F3.

**Exit evidence:**

- [EXEC] Unit and real-repository outcomes for every recovery state above.
- [EXEC] Controls that restore pre-classification overwrite, omit a reset store, substitute a
  malformed backup, and force a transient failure.
- [EXEC] Browser reload proof through persisted IndexedDB data.
- [HUMAN] Gate C stays open until a real veteran/current-device save imports, reads back, and its
  original legacy source remains recoverable.

**F1a implementation record (2026-08-14):** `SaveRepository.recover` now accepts the supported
classifier and proves the exact backup before replacement; reset clears the canonical `STORES`
list; and every supported fixture family passes a direct exporter → boot-envelope contract. Unit
test-first controls restored the old overwrite/reset omissions and failed 2 of 36 tests; an omitted
export key failed all 9 direct fixture contracts; and the browser control named both future- and
corrupt-backup overwrite cases. With the repair restored, clean exact head
`f7cf75f69332b88846aa6f19f41e64f888f0531c` passed 296 tests /1 skipped, both TypeScript
configurations, the unused-code type gate, and the full real-browser slice smoke. F3 and the Gate-C
human device/veteran-save criterion remain open.

### 4.2 F1b — narrow, independently reviewable guardrails

F1b prevents the save hotfix from becoming a mixed “quickies” PR. Each item must stay separately
reviewable or join its natural owner:

- failing-closed landfall bounds, frozen canonical Charter data, and protected imported chapter
  advancement;
- epoch persistence documentation/reference correction: persist the advancing `current()` value,
  not an immutable session base;
- lifted declaration/runtime corrections, façade warnings, and audio pre-init guard coverage;
- right-rail/panel structural correction and similarly isolated UI contract work.

**F1b Charter implementation record (2026-08-14):** the active bounded slice makes malformed
chapter positions fail closed without changing progress, deeply freezes canonical Charter data and
projected goal aliases, and separates first-landfall banking from stable-stage reconciliation after
any successful Land. Every consecutive already-complete, reach-backed imported chapter may advance;
the first incomplete/unpowered chapter stops, with no duplicate landing, progress, reward, drive or
reach. A one-shot completion now replaces adjacent ambient feedback politely, and an already-open
Charters board refills from the advanced ledger. Test-first unit controls failed on the
throwing/mutable/missing-helper behavior. The repaired candidate passes the focused 18-test scene
suite and both TypeScript configurations. Its real-browser proof covers an emulated-phone touch on
already-landed Mercury, exact progress/reward/reach preservation, matched unpowered and
powered-incomplete controls, immediate Share→completion replacement, IndexedDB/reload, and a separate
desktop open-panel refill. Clean exact commit `ce6ef639057944447da631bcced74a70da2750cc` passed the full
298-pass/1-skipped unit suite, both TypeScript configurations, unused-art audit, real-browser smoke,
glass selftest and all 12 viewport classes. PR
[#25](https://github.com/TheDakk/Celestial-Frontier/pull/25) test-battery run
[`31813881697`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31813881697) independently
passed v2 static, root gates, one-attempt smoke, 12-viewport glass, same-commit persona/preview and the
final battery join at that SHA. Claude's exact-diff review was resolved and the final instrument-
repair head `a0ee7666f5fb1edf22a0035acfeb7df1beebefe9` passed test-battery run
[`31858641826`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31858641826). PR #25 then
merged normally at `bd49beb0693b45fdd57d4acad746ade79843a91e`. Epoch, lifted
declaration/runtime and audio pre-init remain separate F1b batches.

**PR #25 final-head CI instrument note (updated 2026-08-15):** the following evidence-only PR head
`a5896dc9a5e98c0f2037bb1cb16905b74e48feb1` did not invalidate
that Charter evidence: run `31815658572` passed static, root, and full glass jobs, then v2 smoke
stopped inside the shared browsercdp selftest before gameplay. Its injected WebSocket-timeout case
had launched real Chrome and could therefore reject on the earlier 10-second cold-start phase. The
bounded correction isolates that control behind one deterministic portable Node child and a valid
owned endpoint, while only the following live provenance launch receives 30 seconds; the generic
15-second default, later warm 10-second launch, command/shutdown bounds, and no-retry law remain.
The repaired final head and review completed as recorded above. The exact merge then passed
`develop` test-battery run
[`31867609188`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31867609188); mapped
publication run [`31868417305`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31868417305)
served development build `develop-bd49beb0693b` with that full source SHA. Production remained
skipped and unchanged.

**F1b UI-P1 implementation record (2026-08-15, integrated):** the ported outside-
dismiss handler used a literal left-rail exception but omitted the identical right rail, so a real
pointer in its rendered 8px flex gap closed the active panel. Registered panel roots/openers retain
element identity; stable top-bar, dock, Survey and rail chrome now self-declare one generic
`data-panel-boundary`. Search deliberately retains its parity outside-dismiss/focus behavior, and
modal, Training, coexistence and Escape policy are unchanged. A test-first real-CDP run failed on
the exact right-gap close, missing boundary inventory, asymmetric left/right removal controls,
non-Element document targets and an ignored owned-canvas control. With the repair restored, all
298 tests/1 skip, both TypeScript programs and the complete one-attempt browser smoke pass: both
browser-mouse rail gaps preserve panel/ARIA state, independently removing either marker recreates close,
owned versus genuine-empty canvas points discriminate in both directions, and delegated pointer/
click handlers fail closed on non-`Element` targets. Implementation commit
`d6ccb9b810fc644437ed205e4f6dbed7974cdba1` and the bounded launcher repair culminated in exact PR
head `c1bfc3b7674f5113dd7c9a0c6063fc99737ea1ba`; test-battery run
[`31872279328`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31872279328) was terminal
green. PR [#26](https://github.com/TheDakk/Celestial-Frontier/pull/26) then merged at
`b5e5d0a3b4bb4057fa6d251816454b370e8b2624`. GitHub records no Claude review or PR comments, so
this history does not claim one. The merge passed exact `develop` test-battery run
[`31884952674`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31884952674); mapped
publication run [`31885531363`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31885531363)
served `develop-b5e5d0a3b4bb` with the full source SHA while production stayed skipped. This record
does not close the broader UI preparation.

**PR #26 exact-head CI instrument note (2026-08-15):** head
`ea972a8f43fbe4a3382d1e1c00a2bd46f1606bbc` remains bound to red test-battery run
[`31870103561`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31870103561). Its
v2-smoke job stopped in `browsercdp --selftest` before gameplay: the first live-provenance launch
found a valid `DevToolsActivePort` inside 30 seconds, then WebSocket opening incorrectly borrowed
the 1,500-millisecond command ceiling and expired before `Browser.getVersion`. This is inherited
instrument coupling, not a UI-P1 product failure; the exact run's static, root and full glass jobs
passed, while persona/preview skipped and the final join was a dependency cascade. The bounded
repair makes startup one monotonic, absolute
spawn → endpoint → socket-open deadline, adds a validated socket cap clipped to remaining startup
time, defaults that cap to startup rather than post-open command time, and retains the exact
startup/command/shutdown budgets and no-retry rule. Portable delayed-open, explicit-cap,
remaining-startup, pre-construction-expiry, guarded CONNECTING constructor-overrun, just-late-open,
never-open and invalid-cap controls prove the phase boundaries and cleanup. Those local controls
still required fresh new-head CI; it later passed, while GitHub records no Claude review before the
external integration described above.
The bounded implementation and synchronized-reference commit is
`cc0900bca0c8f4943bb064cb0d4bb21cad25dfdc`; exact final head
`c1bfc3b7674f5113dd7c9a0c6063fc99737ea1ba` passed run `31872279328` and integrated as recorded
above. The known-red run remains immutable history and was not retried.

**F1b WorldGen truthful-contract implementation record (2026-08-15, active bounded candidate):**
the byte-verbatim generator body, generated values, cache keys and call order remain unchanged.
The typed facade exposes required own galaxy-cell `web` metadata and the exact supernova
remnant/birth result, names the second supernova argument as the deterministic epoch key, and states
the transitional `GAL_SPRITES` installation precondition for a first uncached ordinary
generated-galaxy branch. The app consumes those types without local casts. Focused tests pin empty,
special-only and ordinary-populated `web`, the exact baseline plus same-key cache identity,
cross-epoch change, bounded
site/birth shape, declaration semantics, and both missing-hook failure and installed-hook success.
This closes DOM-2, DOM-3's missing-warning obligation, and only the WorldGen `.web` half of DOM-11.
It does not remove the hook dependency, fix `_sanitizeSavedGenome`, install the live epoch bridge,
close CF1/F2, change generation, or close a Gate. Reviewed bounded commit
`29601e478e99b2a114720e23b696e8fb7d79d33c` passes 299 tests /1 skip, both TypeScript programs,
`artunused`, `git diff --check`, and the complete one-attempt real-browser slice smoke with zero
console errors. Three independent read-only source, test and documentation audits are clean after
their findings were resolved. The first pushed exact head is preserved red below. Claude review and
fresh exact-CI on the eventual launcher-repair head remain integration gates; local evidence cannot
certify a later handoff head.

**PR #27 exact-head CI sentinel note (2026-08-15):** draft PR
[#27](https://github.com/TheDakk/Celestial-Frontier/pull/27) reached exact head
`fe37753d66b52d66c08df878cd315cc7168dcb2e`. Test-battery run
[`31886401312`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31886401312) completed with
the full `v2 parity and complete TypeScript surface` step, `root-gates`, `v2-smoke` and `v2-glass`
all green. The only red primary job was `v2-static`, which failed closed at the audited `apphooks.ts`
authority-hash sentinel inside the art-routing/coverage step; `v2-persona-preview` skipped and
`battery` failed only as the dependency cascade. The changed bytes were comment-only historical
wording in a deliberately byte-pinned
catalog wrapper. This is a provenance failure, not a WorldGen behavior, type, generation, route,
coverage or browser finding; the head must not be retried and the sentinel must not be re-pinned.

The bounded repair restores `packages/domain/descriptors/src/apphooks.ts` exactly to audited
SHA-256 `c7544344733ce0efe0c08762b96bfa3d1ca8451e38b7617ef67aa8fde9a1329a`
and pre-batch blob `ba95d19349f3ae911f41a2903080c03816489767`. Corrected dependency truth
remains in WorldGen-owned facade/declaration/tests and current references. On the restored bytes,
`overridecheck` passes 1,014/1,014 routes with zero dead and 1,010/1,010 Earth coverage; every
`overridecontrol` leg passes including the wrapper-byte and restored-clean controls; `artaudit`
passes 23 sources/zero findings; `coveragegap` passes 1,010/1,010 with zero remaining; and
`speccheck` passes 454/zero unread/zero inert. All 299 tests /1 skip, both TypeScript programs,
`artunused` and `git diff --check` also pass.

**PR #27 shared-launcher publication note (2026-08-15):** the byte-restored exact head
`1a0839a95e595673409436bae27962e999f256a0` is a second immutable red and must not be retried.
Test-battery run
[`31887203990`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31887203990) completed with
`v2-static`, `root-gates`, and `v2-smoke` green. `v2-glass` passed its report selftest, then emitted
an honest `instrument-fail` artifact with zero product findings and zero retries after its ninth
fresh matrix browser (`desktop`) observed `DevToolsActivePort has an invalid port` in 364
milliseconds; all eight earlier and all three later matrix rows passed with the same pinned Chrome
151 provenance. `v2-persona-preview` skipped and `battery` failed only as the dependency cascade.
This finding occurred before page creation and does not change the bounded WorldGen product scope.

The shared launcher had treated `DevToolsActivePort` path existence as proof that Chromium had
finished publishing both lines. Its bounded repair keeps one process and the existing monotonic
startup deadline, but accepts an endpoint only after two consecutive identical, fully valid raw
snapshots. Parser-invalid regular-file content is treated as potentially incomplete inside that
deadline;
wrong file types, symbolic links, and unexpected filesystem errors remain immediate failures. A
persistent malformed file reaches the unchanged deadline with its last parse diagnosis, constructs
no WebSocket, then cleans the one child and owned profile. Permanent portable controls cover a
syntactically valid-looking prefix, a port-only file with its endpoint line missing, and invalid
endpoint syntax that later become complete, plus persistent malformed content and unsafe file
types. The old implementation fails the staged-prefix
fixture; the strengthened local `browsercdp --selftest` passes. This adds no relaunch, retry, sleep,
browser reuse, fallback change, or timeout expansion. The Glass report selftest, full 12-viewport
Glass matrix, one-attempt v2 smoke, root preflight/selftest, root layout selftest, sealed
787-outcome layout gate, 299 tests /1 skip, both TypeScript programs, `artunused`, syntax and diff
hygiene all pass locally on the same working diff; local preflight also records a successful Edge
151 launch and the expected non-blocking revision-drift warning against the Edge 150 baseline.
Three independent final read-only source, control, caller and documentation audits are clean after
their findings were resolved. A new pushed exact head, fresh CI, and Claude review remain required
before integration.

**Amendment:** do not implement the sweep’s DOM-10 wording literally. Eleven legacy outcome call
sites do not prove there should be eleven semantic RNG domain keys. F4 first owns a complete
call-site → semantic-domain inventory.

### 4.3 F2 — canonical ingress and discriminated navigation

**Goal:** close the forged star/galaxy CF1 bypass and establish one provenance boundary for every
current and future world-bound action.

**Scope:**

1. Replace nullable/alias-prone navigation with an immutable discriminated `NavState`, validating
   smart constructors, normalized copies, and legal transition rules.
2. Resolve galaxy, star, and planet hierarchy from deterministic sources. A resolver returns proven
   hierarchy/provenance; callers never supply authoritative parent coordinates.
3. Route every ingress through it: external planet shares, galaxy-only CF1, star-only CF1,
   saved-view boot, Atlas rows, generated descents, and future receipt/ownership targeting.
4. Feed resolver results—not unproven caller fields—to rendering, reach, Charter, persistence,
   custom names, Land, sharing, and future world registries.
5. Use canonical galaxy + star + planet + ordinal world keys. Fail closed on malformed, ambiguous,
   missing, and source-throwing values; stale saved state degrades to a neutral home state.

**Required controls:** galaxy-A/star-B forgery, coordinate mismatch, NaN, coarse/fine duplicate,
ambiguous source, source exception, stale boot state, and every ingress class must prove it cannot
render foreign content, land, bank Charter credit, persist, or award.

**Hard no-go:** no world-bound ownership, reward, or receipt writer before F2 closes.

### 4.4 Arc 0 completion — current truth, imports, and continuity

F2 is the identity seam of Arc 0, not all of it. These items remain named sub-batches:

The dependency spine shows Arc 0's critical path, not a blanket serial barrier. Each row's own
placement rule determines what it blocks: later-bound decisions such as `D-CFB-1` and
`D-IMPORT-1` remain open and visible, but do not mechanically block unrelated Arc 1A–1C work.

| Item | Required outcome | Placement rule |
| --- | --- | --- |
| `D-TRAIN-1` | Imported full-expedition `tsnap` restores before clear; completion, skip, and write-failure preserve the real expedition. | Before Training can claim full migration. |
| `D-CFB-1` | Explicit compatibility decision and normalized parent-tuple round trip with reverse-parent/matchup controls. | Before companions, combat, or audio identity rely on it. |
| `D-IMPORT-1` | Map/Set semantics reconstruct; malformed rows are contained; valid genome/size values do not drift. | Before import becomes a broad player promise. |
| Charter/opportunity truth | Every surfaced opportunity maps to a live action; stale chapters cannot claim unbuilt systems. | Before new ownership/reward writers. |
| Guide/Training/tooltip truth | Capability sign-off, real-system-only bodies, deep links, and Advanced Briefing placement. | Before an affected capability becomes available. |
| Remaining open deltas | Biome fauna timing, locale, descriptor/state seam, domain haze ownership, and notification time source each receive named ownership. | Never leave a known delta as unowned “later.” |
| `PER-5` imported strings | Decide and record validation for `lastAnomKey`/`frontierEnding`; do not silently change verbatim parity. | Before either value is rendered or trusted as authority. |
| `DOM-5` package cycle | Assign and remove the `combatcore` ⇄ `strays` dependency cycle at an owned package seam. | Before stricter bundling or dependency enforcement relies on an acyclic graph. |
| `MAIN-3` roster boundary | Separate the full canonical world roster from the eight-row Planetside preview/paging cap. | Before Arc 4 capture consumes roster identity. |

**Arc 0 exit:** fresh saves receive no impossible live goal; surfaced opportunities map to real
actions; continuity required by every capability reached so far is preserved; Guide truth is
current; no ownership writer precedes canonical proof.

`D-CFB-1` is a minimum lineage-compatibility bridge, not proof that both parents' complete audible
traits survive. Arc 7/8 must either persist a bounded versioned parent-audio projection or use the
documented deterministic fallback; an ordered two-seed tuple alone cannot promise an exact blend of
both parent voices.

### 4.5 Arc 1A — Compendium virtualization and thumbnail leasing

**Goal:** make the 1,500-entry catalogue bounded on phone and desktop without degrading identity,
accessibility, or approved static art.

**Scope:**

- Window approximately two viewports plus overscan with spacer-preserved scrollbar. Pin focused
  rows so keyboard focus cannot unmount under the player.
- Preserve filter, count, detail, Back/Close, focus carry, and logical row identity.
- Add typed `leaseThumb(genome)`: only a real 132px cache hit returns synchronously; a miss shows a
  neutral placeholder, takes a refcounted/cancellable/deduplicated job lease, and never mounts a
  440px image as a list thumbnail.
- Release on row unmount/panel close, cancel dropped queued work, handle errors, and do not rerender
  a closed panel.
- Keep complete-genome/set-qualified visual identity; a bare seed is insufficient for bred or
  lineage-sensitive portraits.
- Create an internal canvas → canvas thumbnail seam that avoids the full-portrait encode/decode
  detour and full-cache pollution. Retain the already-fixed shared lazy-art subscription behavior.
- Keep the DOM-mutating species-art chunk under app-shell lifecycle ownership: sequence its lazy
  import only after the owning document/shell exists, and do not let non-DOM consumers import the
  side-effectful module directly.
- Budget decoded pixels/bytes, cache entries, jobs, and leases; trim correctly as phone caps shrink.
- Move Planetside chips to the lease path without changing their structural semantics.

**Exit evidence:** a standalone workspace-locked `compendiummem` gate uses a deterministic
1,500-row catalogue and proves mounted-row bound, `naturalWidth ≤ 132`, decoded resources,
jobs/leases, populated surface, warm plateau, focus/detail/filter reachability, and close cleanup
on phone/desktop. Independent negative controls reintroduce unwindowed rows, 440px mounting,
missing lease release, and missing disposal. [HUMAN] review validates 132px list art and 440px
Compendium detail art, text hierarchy, and focus behavior; the separate 300px surface remains
art-review-packet evidence, not a Compendium delivery tier.

### 4.6 Arc 1B — Pixi/canvas resource ownership and plateaus

**Goal:** give ordinary scene lifetime the same explicit ownership discipline as intentional
replacement-document teardown.

**Scope:** own/acquire/release/evict galaxy haze, planet texture tiers, render/canvas caches,
`_rgCache`, render targets, and future selected previews. Establish a travel → Compendium →
Shipyard warm plateau under raw-CDP resource counters and decoded/GPU proxies.

**bfcache law:** ordinary `pagehide` must not unconditionally destroy the application. A pagehide
signal may notify an owner only with an explicit persisted/pageshow plan; renderer destruction stays
with its owned replacement transaction.

**Explicit exclusion:** this establishes shared vocabulary for future AudioBuffers/nodes but does
not complete audio lifecycle. Arc 7 owns that work.

### 4.7 Arc 1C — ship visual foundation and HD planet attachment

**Goal:** make capability visually legible without allowing art to become a second gameplay owner.

**Scope:**

- One pure normalized `ShipVisualState`, derived from canonical saved capability/reach state.
  Travel, Shipyard captions, chassis, hardpoints, and preview consume it; it is not separately saved.
- Prove Scout/Chemical, Jump/Interstellar, Survey Cruiser, and Frontier/IG chassis roles. Hardpoints
  appear only when truly owned; veteran legacy data receives an honest generic-refit fallback.
- Build static Shipyard proof before real build writers. At most one disposable Pixi ship preview is
  owned by Shipyard; dense inventory/comparison remains DOM-first.
- Give completed HD planet textures a named attachment/lifetime package after Arc 1B.

**Exit evidence:** four stages, hardpoint permutations, legacy fallback, save/reload,
travel/visual-selector agreement, deliberately mismatched-selector controls, phone/desktop
silhouette review, and the Arc 1B resource cycle including Shipyard.

### 4.8 F3 — persistence authority, split stores, and receipts

**Goal:** make future ownership/reward mutations exact-once and safe against stale writers.

**Scope:**

- Revision/CAS semantics in memory and IndexedDB, with explicit stale-writer outcomes.
- Real-browser upgrade/onupgradeneeded/versionchange evidence before irreversible schema migration.
- Separate stores for metadata/schema, player/progression, creatures/genomes, catalogue/Atlas/log,
  inventory/equipment/materials, settings/accessibility/audio, recovery/migration journal, and
  disposable generated-asset caches. Authoritative data never embeds Pixi/DOM/render/audio buffers.
- Immutable receipts keyed by save-lifetime RNG ordinal and written in the same transaction as the
  mutation they witness.
- v4 → v5 migration with pre-migration snapshot; failure leaves v4 intact. Preserve v4 codec as a
  supported migration reader/writer while v5 grows.
- Tab lease for F4 active-play-clock ownership.

**Exit evidence:** memory, IndexedDB, and browser controls cover stale tabs, same-parent breeding,
same-world settlement, duplicate receipts, capture spend, migration/recovery failure, corrupt/future
rows, and double action. F3 is the first point at which persistence may be called concurrency-safe.

**Hard no-go:** no item/creature instance mutation, capture spend, craft/salvage, companion dispatch,
Guardian settlement, or receipt-backed reward before F3.

### 4.9 F4 — active-play clock and SessionRNG

**Goal:** separate ecology epoch, active-play readiness, and replayable player outcomes without a
wall-clock exploit or a change to universe determinism.

**Scope:**

- Install live epoch getter before ecology/worldgen use. Persist/rebuild its advancing current value
  exactly once at an edge and settle hidden-tab behavior explicitly.
- Add a persisted visible/answerable active-play millisecond clock under F3’s tab lease. It is neither
  device wall-clock nor capped ecology epoch.
- Migrate Auto-Extractor/harvest accrual from wall-clock time, including absent-field migration and
  clock-wind forward/back/reload controls.
- Mint/persist SessionRNG seed and per-domain counters atomically before the first outcome roll.
  Map every legacy roll through an audited semantic call-site inventory.
- Add real outcome tests/counter-perturbation controls for every migrated roll and persist state in
  all save paths plus diagnostics export.

**Hard no-go:** new extraction, missions, readiness, capture/reward, or anti-reroll loops do not
use `Date.now()` or bare `Math.random()`. Reduced Motion never slows progress.

## 5. Product Arc delivery plan

**Charter co-delivery law:** when an Arc makes a system such as mining, fabrication, bioscan,
capture, conquest, or breeding real, that same Arc ports and outcome-tests the system's Charter
writer before exposing its goal. Arc 9A is the closure audit for cross-system chains, weeklies,
rewards, ranks, and endings—not the first delivery point for every earlier system writer.

### 5.1 Arc 2 — item instances and readable economy

**Player promise:** a found or built item is a readable, stable object with provenance, honest
comparison, and visible ways to earn, improve, salvage, or target it.

**Build scope:**

- Introduce `GearInstance` and exact-instance Inventory separate from catalogue/base-item
  definitions and material Cargo.
- Add schema/migration, fixed-point import/export, equip/unequip, inspect, salvage, overflow/
  pending-reward handling, comparison, filters, and build tags.
- Implement deterministic loot tables, item level/quality/affix grammar, and compatibility caps.
  Rolls receive their entropy as an argument or SessionRNG receipt—not a hidden global random call.
- Publish an inspectable source/sink/pacing ledger: sources, ranges, targeted crafting, salvage,
  expected time-to-upgrade, recovery from a bad allocation, and no dominant farm.
- Apply the panel coexistence, focus, Escape, and Close law before dense Inventory/compare/vendor
  UI expands. Static DOM thumbnails remain bounded; do not build a grid of unowned Pixi scenes.

**Dependencies:** F2 canonical targeting, F3 transactions/receipts, F4 RNG/clock, and Arc 1
portrait/Shipyard foundations.

**Exit evidence:** fixed-point migration; exact-instance mutation; no duplicate/reroll/overflow loss;
stale-tab/double-click controls; readable source/range/targeted-craft paths; mobile/desktop comparison
review; current Guide/Training truth.

### 5.2 Arc 3 — engineering loop

**Player promise:** surveyed worlds reveal finite, understandable opportunities. Gathering and
engineering visibly improve what the player can build, see, and reach.

**Build scope:**

- Truthful opportunity map plus mining, skimming, research, and fabrication actions.
- Finite veins/limits, active-play extraction, clear worked-out state, and no idle-income fiction.
- Material sources/sinks joined to Arc 2 economy; research/fabrication produce visible capability,
  ship, and reach changes rather than invisible counters.
- Deterministic opportunity/resource selection and receipt-backed settlement.
- Player wording, tooltips, Training, Charter, and visuals agree with actual availability.

**Exit evidence:** real-action rewards; finite extraction; no wall-clock accrual; save/reload/two-tab
protection; reach/visual/Guide agreement; economy simulation; phone/desktop human comprehension.

### 5.3 Arc 4 — capture and ownership

**Player promise:** discovery becomes meaningful ownership through finite, legible actions—not by
opening a page or replaying a roll.

**Build scope:**

- Separate `CatalogSpecies`, `CreatureInstance`, specimens/resources, and discovered records.
- Implement finite Tame, Scavenge, and Sample actions plus Biosphere Yield. Fauna Tame may create a
  living creature; Scavenge/Sample never silently create companions.
- Model attempt spend, success/failure, recovery, depleted/worked-out state, provenance, and
  receipt-backed settlement.
- Give survey/discovery/capture outcomes clear visual and caption paths without claiming rewards
  before the transaction succeeds.

**Dependencies:** Arc 2 item/storage model, Arc 3 world opportunity/reach, F2 canonical identity,
F3 transactions, and F4 time/RNG.

**Exit evidence:** a real action creates the correct catalogue page/specimen/creature; no free page,
reroll, double spend, duplicate creature, or stale-tab grant; reload/write-failure controls; Guide
remains unavailable until those outcomes exist.

### 5.4 Arc 4.5 — first complete journey [HUMAN]

**Goal:** prove the solo product loop before broadening companion, combat, project, or social
content.

**Journey:** fresh-start Survey → understood opportunity → Gather → Build → Tame → visible ship
upgrade → farther reach → meaningful Return.

**Required evidence:**

- [HUMAN] First 30–60 minutes: a new player can explain where to go, what the opportunity means,
  and the next useful choice without external instruction.
- [HUMAN] First three sessions: discovery, ship change, comparison, and creature ownership create
  anticipation/attachment rather than confusion, grinding, or fear of missing out.
- [HUMAN] Long session: visual density, audio, menus, accessibility, and heat remain comfortable
  while meaningful choices continue.
- [EXEC] Economy simulations cover time-to-upgrade, source/sink coverage, recovery, and absence of
  dominant farms. Automation never substitutes for comprehension or delight.

Arc 4.5 is a hard product gate. It is not optional polish and cannot be passed by a scripted reward,
retention metric, or technically green demo.

### 5.5 Arc 5 — companions

**Player promise:** a companion is an owned creature with care, history, and recoverable stakes—not
a disposable loot roll or unattended-income machine.

**Build scope:**

- Nonlethal breeding, feeding, injury/care, bond, recovery, and Chronicle presentation.
- Apply the approved lower-parent 50% `fed` inheritance rule and preserve chosen lineage semantics
  across save/share/CFB.
- Use bounded canonical memories/read models. Chronicle never becomes a second event authority.
- Add active-play companion missions with away/recovery locks, explicit return timing, transaction
  receipts, safe settlement, and no background reward minting.
- Add bounded selected living previews only after Arc 1 resource contracts and creature identity are
  stable.

**Dependencies:** Arc 4 ownership split, F3/F4, CFB/import continuity work, and Arc 4.5 proof.

**Exit evidence:** fed inheritance; recovery/away locks; return exactly once; save failure/reload/
two-tab controls; no silent bonded-creature loss; honest Guide/Training; human attachment review.

### 5.6 Arc 5.5 — combat decision model [HUMAN]

**Goal:** decide the game of battle before expanding battle screens, effects, or damage numbers.

**Scope:** roles, preparation, telegraphs, timing, costs, counterplay, retreat, defeat/injury/
recovery, Guardian stakes, and settlement rules are specified and scenario-proven. The model gives
players understandable responses rather than opaque hard counters or stat-only outcomes.

**Exit evidence:** [HUMAN] players can choose and explain viable responses in representative
scenarios. [EXEC] fixtures show state, telegraph, choices, and settlement consequences.

### 5.7 Arc 6 — combat and Guardians

**Player promise:** duels, conquest, and Guardians are readable decisions with memorable stakes,
not visual noise around a hidden roll.

**Build scope:**

- Transcript-driven duel/conquest/Guardian presentation. Simulation settles first; visuals/audio
  consume the finished transcript and never create outcome RNG.
- Party/role preparation, action/retreat presentation, damage/condition/ability feedback, and
  non-punitive recovery.
- One post-combat receipt settles XP, injury, loot, Guardian reward, and conquest state.
- Guardian visual/audio identity derives from deterministic world/ability data; reward tables,
  affix compatibility, and conquest-loss corrections remain inspectable.

**Exit evidence:** every reward, injury, and settlement is outcome-tested through a real action;
receipt/stale-tab controls prevent duplicate settlement; telegraphs read on phone/desktop; [HUMAN]
Guardian encounters are memorable and strategically legible.

### 5.8 Arc 7 — audio foundation

**Goal:** build the platform that can deliver premium, distinctive audio safely before broad sound
content is added.

**Current truth:** v2 currently has stings only. It does not have creature calls, ambience, music,
recorded assets, a category mixer, a concurrency manager, or complete audio package tests.

**Build scope:**

- Pure deterministic `AudioSignature` → `AudioIdentityProfile` → `CreatureCallPlan`/cue-plan
  modules. Identity uses exact catalogue owner, selected immutable phenotype, and surviving lineage;
  mutable XP, injury, feeding, assignment, bond, and brood do not change a signature.
- Pure `DistantEcologyHintPlan` and `CreatureExpressionCue` seams. Hint plans bind canonical world,
  an already surfaced approach/survey lead or roster and resolver version; expression selection
  binds an immutable call plan to one settled event identity without changing the
  signature/profile/plan or consuming SessionRNG.
- Typed event boundary and Web Audio engine: master → music, ambience, creature, combat/gameplay,
  and UI buses; limiter; real category routing; truthful blocked/suspended state.
- Voice manager with priorities, cooldowns, concurrency groups, stealing, and exact stop/disconnect
  ownership.
- Gesture-safe activation, mute-before-create, hidden-tab shutdown, visibility restart policy,
  context-loss recovery, explicit dispose, and settings only for real buses.
- Audio lab, diagnostics, profile fixtures, cache/node/voice budgets, and rights-manifest tooling.
- Captions, mono, dynamic range, and reduced-intensity controls. No meaningful state is audio-only.

**Exit evidence:** deterministic profile/cue-plan vectors; full set-qualified catalogue join;
collision/mutable-field controls; lifecycle/mute/resume/context-loss tests; cache plateau;
concurrency/stealing proof; deliberate failing controls; [HUMAN] listening on headphones, phone
speaker, mono, low volume, and reduced-intensity settings.

**Initial budget policy:** measure before locking encoded/decoded byte caps. The approved starting
full-mix active-voice targets are 20–28 low/mobile, 28–40 standard mobile/tablet, 40–56 desktop
standard, and 56–72 desktop high. Gate G begins with at most eight creature emitters and 120 live
nodes; these counts are distinct scopes, not interchangeable limits.

### 5.9 Arc 8 — HD audio and content

**Goal:** turn the proven audio platform into a full local, distinctive, legally safe soundscape.

**Build scope:**

- Intentionally map all 1,010 Earth identities / 1,014 set-qualified routes. Flora, fungi, and
  microbes receive environmental/scientific sonification or correct palettes—not mammal fallbacks.
- Add Earth, procedural, and hybrid creature voices; keep `legacy` fallback-only and tune pitch soft
  saturation after listening evidence.
- Add an intentional Compendium detail-card audition action with the same stable voice used in
  travel, return, and combat. List mount, focus, filtering, or virtualization never auto-plays it.
- Add presentation-only distant biosphere calls during approach or survey, after that owning surface
  has presented the matching lead. They key on canonical world identity, resolver version, and the
  already player-visible opportunity/survey projection. A call cannot reveal an unsurfaced species,
  create a discovery, or consume new gameplay RNG; its visual equivalent carries the same
  information granularity, and the layer ducks under UI/combat while honoring audio reduced
  intensity.
- Add event-owned hurt/fed/care/bond/greeting expression cues selected from an immutable call-plan
  repertoire. Expression may change articulation, never serialized signature/profile/plan, and may
  not become an absence or attendance-pressure signal.
- Add adaptive music; universe, celestial, planet, biome, ship, material, crafting, capture,
  combat, and Guardian layers; animation-linked foley; selective spatialization/reverb.
- Use only local project-owned, public-domain/CC0, or explicitly commercially redistributable media.
  Add machine-readable rights manifest, proof, hashes, processing chain, loop/loudness data, and
  validator in the same asset PR.
- Enforce decoded-buffer byte LRU, fetch/decode deduplication, and device heat/battery testing.

**Exit evidence:** complete route/rights coverage; family distinction; no non-fauna fallback;
audio/memory/node plateaus; transcript-to-cue coverage; human listening/repetition/comfort; phone
heat and speaker/headphone/mono acceptance.

### 5.10 Arc 9 — progression, legacy, projects, and records

Arc 9 closes player history and remaining current-system progression rather than leaving it between
“feature parity” and optional projects.

**9A — progression/records closure:** audit and close the per-system Charter writers delivered with
their owning Arcs; complete cross-system rewards, accepted chains, weeklies, ranks, achievements,
Ascent, Prime Codex, events, Stardust, endings, Atlas/share closure, Records, collections, Binder,
and Paragons. Every record has a real action owner and outcome proof.

**9B — Chronicle/projects/share expression:** build Chronicle/museum, ship/discovery/Guardian
history, share cards, and optional finite frontier projects/outposts only after identity, ownership,
and privacy boundaries hold. Projects have visible inputs/outcomes and no decay, forced maintenance,
idle income, or social pressure.

**Exit evidence:** human review confirms history feels meaningful rather than a score wall; every
legacy/project record maps to an action; bounded input/output and privacy rules hold.

### 5.11 Arc 10 — integration beta and release readiness

**Goal:** integrate the complete product without hiding state, resource, or human-experience debt.

**Scope:**

- Living previews/travel reuse, full Guide/Training/tooltip/Advanced Briefing coverage, balance and
  economy simulations, real UI-path outcome tests, and content/localization validation.
- Long-session texture/render/audio/actor plateaus, answerability, accessibility, and heat profiling
  across phone/tablet/desktop.
- Save migration stress, export/recovery, PWA/offline/update rollback, cross-browser/device matrix,
  release candidate evidence, monitoring, and rollback plan.

**Exit evidence:** full applicable battery; Gate C real save; Gates D–I criterion-by-criterion
evidence; multi-lens human play; no P0/P1 defects; separately approved production release decision.
DEV preview never substitutes for release authority.

## 6. Premium visual-production track

Top-tier graphics are a first-class production lane. This is not a promise of indiscriminate
repainting; it is a deliberate path from deterministic static identity to convincing living worlds
within browser and mobile budgets.

### 6.1 Visual quality charter

The target is a premium animated 2D/2.5D browser universe with strong silhouettes, recognizable
behavior, coherent materials, ecological atmosphere, and player-readable upgrades. It retains
Celestial Frontier’s alien, painterly, mature identity rather than copying another game’s designs.

Quality means all of these together:

- **Identity:** a planet, species, or ship remains recognizably itself across list, inspector,
  world, encounter, save, and share contexts.
- **Readability:** silhouette, material, rarity, and owned-vs-catalogue state are legible before
  decorative detail competes with information.
- **Life:** creatures and biomes have purposeful motion, personality, and environment response—not
  generic idle loops.
- **Craft:** anatomy, rig attachment, LOD, occlusion, seam, crop, and material behavior survive
  fixed-seed and human review.
- **Performance:** art yields to interactive UI, resources plateau, Reduced Motion is respected,
  and phone/tablet/desktop quality tiers are intentional rather than accidental degradation.

### 6.2 Visual milestones

| Lane | Program placement | Required proof |
| --- | --- | --- |
| Static portrait delivery | Arc 1A/1B | 132/300/440px review, full-genome identity, bounded decoded resources, and no list-scale 440px mounts. |
| Ship visual grammar | Arc 1C | One ShipVisualState, stage/hardpoint readability, honest veteran fallback, static/bounded preview proof. |
| Living-species pilot | Alongside Arcs 5–6 / Master Phase 5 | Three radically different procedural archetypes plus representative Earth species are commercially convincing on phone/desktop without anatomy failures. |
| Universe/biome production | Master Phase 6 / integrated with Arcs 3–6 | Galaxies, systems, planets, moons/rings, descent, 43 biome scenes, weather, ecology, materials, and ship/gear presentation meet fixed-seed art/performance review. |
| Integration polish | Arc 10 | LOD, reuse, visual fatigue, answerability, GPU/heat, and physical-device evidence. |

### 6.3 Static work already protected

The Platinum-reviewed static portrait set remains frozen for delivery. Arc 1 changes how art is
requested, sized, cached, and disposed; it does not authorize a blanket repaint. The next genuine
visual ceiling is a separately proven living-rig/animation pipeline and then full biome/universe
production. Existing scoped art review is valuable but does not substitute for all-catalogue
certification, Gate E creature proof, or Gate F universe proof.

### 6.4 Living species and ecosystem production

Before broad content scale, prove this production pipeline:

- genome → phenotype → rig → sockets/materials → animation/behavior;
- rig-family/anatomical compatibility validation;
- idle, locomotion, interaction, care, combat, damage, defeat, taming, and emotional states;
- eye/face/personality and material response legible at intended sizes;
- Earth overrides plus coherent procedural alien families;
- artist-readable source masters, stable manifests, generator/render-profile versioning, and
  fixed-seed review fixtures;
- creature/biome interaction that changes presentation only, never roster, simulation, or outcome
  RNG without an explicit game-system decision.

Gate E is [HUMAN]: hashes, counts, or a generated proof sheet cannot certify that a creature feels
alive, lovable, anatomically believable, or commercially finished.

### 6.5 Universe, biome, and planet production

The visual world track explicitly includes galaxies, nebulae, stars, black holes, wormholes,
quasars, anomalies, planets, moons, rings, atmospheres, clouds, weather, oceans, emissions,
auroras, descent/landing, material reveals, and all 43 biome profiles. One versioned `BiomeProfile`
bridges visual/ecological/audio presentation so separate classifiers cannot drift.

The current executable 43-biome key coverage does not yet prove that cross-modal binding. Arc 8
adds the audio join, inventories every biome-presenting runtime consumer, and requires deliberately
mismatched-profile plus alternate-classifier/bypass controls before it may be called complete.

Gate F is [HUMAN] plus fixed-seed/device evidence: no LOD blotches, seams, incorrect occlusion,
procedural repetition, detached visual action, or mobile heat regression.

## 7. Premium audio-production track

### 7.1 Audio quality charter

Audio is a full local identity system, not an afterthought or generic stock loop. It makes the
universe more legible and emotionally specific without becoming tiring, invasive, networked, or
necessary for comprehension.

```text
immutable phenotype + exact catalogue owner + surviving lineage + resolver version
  → AudioSignature → AudioIdentityProfile + CreatureCallPlan
```

The same creature retains audible palette, register, phrase grammar, rhythm, and event plan across
devices/saves. Browser PCM can differ by hardware and implementation; that is not an identity
failure. Audio never changes gameplay RNG, stats, rarity, genetics, or share codes.

### 7.2 Platform before content scale

Arc 7 owns pure profiles/cue plans, typed events, bus mixer, limiter, concurrency/stealing,
node/buffer ownership, lifecycle, settings/accessibility, audio lab, and rights-manifest tooling.
Broad music, biome, creature, and combat content waits until that platform has parity, cleanup,
budget, and listening evidence.

```text
master → music | ambience | creature | combat/gameplay | UI
```

A narration bus stays reserved until narration exists; an empty slider is not a feature.

### 7.3 Event ownership and content grammar

- Survey, discovery, capture, build, combat, and Guardian cues consume completed game events; they
  never add a second roll or change a settled outcome.
- Combat audio reads the deterministic transcript. Guardian motifs derive from stable world/ability
  data and have visual/caption counterparts.
- Fauna may use curated family palettes and exact licensed overrides. Flora, fungi, and microbes
  use appropriate environmental/scientific sonification and never fall through to mammal calls.
- Animation foley attaches to stable event markers; not every ambient element creates a spatial
  node. Distant ecology uses clustered/premixed layers when appropriate.
- Distant ecology hints consume the canonical, already surfaced approach/survey lead or roster. They
  are presentation-only, never advertise a hidden species, carry a same-granularity visual cue,
  duck under UI/combat, and honor audio reduced intensity.
- Care, injury, feeding, bond, selection, and companion-mission-return expressions consume completed
  typed events and resolve a transient cue from the stable call-plan repertoire; the plan itself
  remains byte-stable, its palette/register/phrase grammar remain recognizable, and no idle poll or
  absence-triggered distress loop exists.
- Silence is an intentional layer for vacuum, caves, and abyssal spaces.

### 7.4 Rights, privacy, and delivery

No recorded asset lands without a machine-readable rights manifest and human-readable ledger. Accept
only project-owned work, public-domain/CC0 material with retained evidence, or media with explicit
commercial, derivative, and redistribution rights compatible with offline shipping.

Never use scraped/ripped media, vague “fair use,” unclear uploads, celebrity/human voice cloning,
biometric voices, microphone capture without consent, remote TTS/generative audio, telemetry, or a
network request that discloses genome/share identity. Runtime stays local/offline or same-origin with
a silent/local fallback.

Each asset records stable ID, source/creator, license snapshot/proof, rights flags, acquisition and
processing history, original/derivative hashes, version, codec, duration, loop points, loudness,
peak, and tags. CI fails closed on missing/orphaned/changed/incompatible rows and proves its
validator with missing-row, hash-drift, license-drift, and orphan controls.

### 7.5 Audio acceptance

Gate G needs more than deterministic profile uniqueness:

- resolver/profile/cue-plan parity and full route mapping;
- canonical-world/surfaced-lead-or-roster hint vectors, wrong/hidden-species and silent/non-fauna
  controls, gameplay-RNG equality, same-granularity visual information, UI/combat ducking, audio
  reduced-intensity behavior, and route/visibility cleanup;
- event-owned expression vectors with invariant signature/profile/call-plan bytes, plus
  state-polling, absence-trigger, signature-drift, and missing-caption controls;
- current voice identity preservation;
- gesture activation, mute-before-create, hidden-tab cleanup, restart/resume, and context-loss
  recovery;
- bounded encoded/decoded bytes, sources, creature emitters, and AudioNodes with warm plateaus;
- captions, mono, dynamic range, reduced intensity/high-frequency comfort, and no audio-only state;
- [HUMAN] listening on headphones, phone speaker, mono, low volume, and long sessions, including
  blinded specimen-to-call matching for Earth/procedural/hybrid examples and same-creature matching
  across different expression states, distant-call anticipation-versus-noise judgment, and
  expression warmth-versus-fatigue judgment;
- [HUMAN] music/ambience transition, repetition, fatigue, and device-heat acceptance.

## 8. Gate A–I coverage ledger

No Gate is a one-bit label. Record individual criteria as `[EXEC]`, `[EXEC-TODO]`, or `[HUMAN]` in
the live gate ledger and bind evidence to exact head/device/artifact.

| Gate | Program contributors | Closure evidence |
| --- | --- | --- |
| **A — baseline integrity** | Baseline fixtures, decisions, docs, visual/audio profiles, all batches | Immutable v1.8.9 evidence, golden seeds/screens/profiles, negative controls, documented intentional deviations. |
| **B — domain parity** | Domain facades, F4, Arc 2 manifests/economy, Arc 5 lineage | No DOM/clock/randomness in domains, explicit rarity conversion, genome/combat/economy parity. F4 alone cannot close it. |
| **C — save safety** | F1a, Arc 0 import/continuity, F3, Arc 2/5 migrations | Real veteran/iPhone save import/readback, legacy preservation, migration/recovery scenarios. |
| **D — engine proof** | F2, Arc 1A–C, performance work | Desktop/phone universe → Earth → land → leave → save/reload, answerability, repeated-travel plateau. |
| **E — creature quality** | Living-species visual lane, Arcs 5–6 | Representative Earth plus three radically different procedural archetypes pass anatomy/motion/personality/mobile/human review. |
| **F — universe quality** | Universe/biome visual lane, Arcs 3–6 | Galaxy through landing, 43 biome/LOD/occlusion/material review, fixed-seed art and physical-device performance. |
| **G — audio quality** | Arcs 7–8 | Profile parity, mixer/lifecycle/budgets/rights, route coverage, human listening/device mix. |
| **H — feature-complete beta** | Arcs 2–10 | Real UI-path outcomes, complete Training, migrations, product play studies, no P0/P1 defects. |
| **I — release** | Arc 10 | Physical iOS/iPadOS/Android/desktop, accessibility, heat/performance, PWA/rollback, export/recovery, monitoring plan. |

## 9. Cross-cutting work required in every arc

### 9.1 Data and manifest architecture

Content-heavy arcs add versioned, validated manifests rather than renderer/UI-owned truth:

- organisms, phenotype/rig/material/behavior data, and biome compatibility;
- worlds/celestial phenomena, materials, recipes, gear, affixes, and abilities;
- Charter/achievement/ending, Training/Guide/tooltip, and localization data;
- visual profiles, render identities, rig/animation/socket rules;
- audio profiles/families/ambience/music states, asset rights, and accessibility descriptions.

Validation rejects duplicate/unstable IDs, broken references, missing rig/animation/audio mappings,
impossible anatomy, invalid rarity conversion, recipe/reward errors, migration gaps, deterministic
drift, and rights/master-asset gaps.

### 9.2 Guide, Training, accessibility, and panels

Each player-visible arc updates in the same batch:

- its capability-aware Guide current/unavailable body;
- relevant Training, tooltip, and Advanced Briefing path;
- before the first new-system lesson, a capability-gated lesson definition over a typed event
  boundary, selector-evaluated allow-scope at event time, resize/rotation geometry refresh, and
  adjacent in-scope Tab behavior;
- release draft text only for actually usable outcomes;
- keyboard, touch, screen-reader, focus, Escape, Close-owner, and Reduced Motion behavior;
- stale-wording negative control plus browser proof of rendered wording and real outcome.

No planned system is advertised as live, and no live system is silently absent from the Guide.
Outside-dismiss behavior also belongs to this law: panel content/openers use manager identity,
stable non-dismiss chrome declares one root boundary, both desktop rail gaps receive browser-mouse
hit-test/removal controls, and genuine unmarked canvas still closes. Do not infer preservation from
`.glass`, ARIA role, or broad top chrome—Search intentionally remains an outside action until the
later coexistence/Escape decision.

### 9.3 Performance, lifecycle, and evidence discipline

- New UI: type checks, smoke, real-browser layout/reachability, and applicable phone checks.
- New memory/resource work: populated surfaces, warm plateau, raw counters where available, and
  deliberate unbounded/no-disposal controls.
- New declarations: compile-time probes plus runtime consumer shapes.
- New persistence: exporter/importer/migration/readback/failure/two-tab outcomes.
- New art/audio: fixed-seed proof, phone/desktop review, and required [HUMAN] acceptance.
- Browser/preview evidence comes from a clean exact commit with manifest/tree/lock/byte binding.
  Mutating negative-control tools never overlap browser/build/evidence processes.

**Recurring code-health, optimization, and balance rail:**

- Every batch audits all readers, writers, callers, exports and resource owners around the touched
  seam. Remove dead/defunct code only after static search plus runtime/fixture evidence proves zero
  supported consumers and the compatibility/migration horizon permits removal; record what was
  removed and which control would catch an accidental live-path deletion.
- Optimize measured player or resource outcomes—answerability, frame/task time, allocation/decoded
  bytes, active resources, network/build weight, heat or battery—not aesthetics of the source alone.
  Keep before/after measurements, representative populated scenarios, regression budgets, and a
  control that makes the bottleneck return. Refactoring for ownership remains behavior-preserving
  until an approved product deviation says otherwise.
- Balance changes require deterministic simulation vectors, faucet/sink and reachability analysis,
  disclosed player-facing odds/costs/rewards, old-vs-new outcome comparison, exploit controls, and
  [HUMAN] fun/clarity evidence where feel matters. Never hide grind, dynamic punishment, FOMO, or
  retention pressure inside a tuning pass.
- At every Arc boundary, run package/dependency-cycle, unused-export, unreachable-route, orphaned-
  asset, stale-capability-copy and manifest-reference audits. Findings become named work in the
  owning batch; unrelated cleanup does not hitchhike into a high-risk fix.

### 9.4 Human experience cadence

At meaningful milestones, record three different sessions:

1. **First 30 minutes:** comprehension of place, opportunity, and next choice.
2. **First three sessions:** anticipation, ownership, discovery, ship/companion attachment, and
   absence of pressure/grind.
3. **Long session:** comfort, fatigue, visual/audio density, accessibility, device heat, and still
   meaningful choices.

Record comprehension, delight, attachment, agency, fatigue/confusion, and accessibility—not
retention pressure or session-length targets.

## 10. Hard no-go rules

1. No world-bound ownership, reward, or receipt writer before F2 canonical provenance.
2. No instance/receipt/destructive mutation before F3 revision/CAS and transactional stores.
3. No wall-clock/bare-randomness reward, mission, extraction, or anti-reroll loop before F4.
4. No Guide availability before action, persistence/reload, reachability, outcome test, and
   capability/body-revision sign-off.
5. No broad Inventory/compare/vendor UI before layered panel/focus/Escape/Close policy, bounded
   catalogue/resource behavior, and a behavior-preserving split of `apps/game/src/main.ts` into
   owned scene-draw, chrome, panel-content, replacement/boot-instrumentation, and search/travel
   modules before Arc 2 UI expansion.
6. No generic destructive `pagehide` renderer teardown; preserve bfcache.
7. No blanket repaint of frozen static portraits as a substitute for living visual production proof.
8. No broad HD audio scale before deterministic profile/mixer/lifecycle/budgets and human listening.
9. No baseline re-pin, stale DOM, empty surface, dirty working copy, or blind retry used as evidence.
10. No production/main/release assertion from a DEV preview or planning document.
11. No speculative optimization, balance rewrite, or dead-code deletion without an owner, measured
    before/after outcome, supported-consumer audit, rollback-safe scope, and negative control.

## 11. Work ownership and review protocol

### 11.1 Required batch card

Every future batch proposal states:

1. named program item(s), authority references, and explicit exclusions;
2. canonical owner(s), fields read/written, importer/exporter/migration effect;
3. player-visible outcome and Guide/Training/release-copy implications;
4. executable tests and deliberate negative controls;
5. browser/device/human evidence;
6. resource/lifecycle owner and budget; and
7. exact exit condition and the next item unblocked.

### 11.2 Codex and Claude review checklist

Reviewers verify that:

- every approved Arc 0–10 has named placement and exit evidence;
- every open deviation has an owner or explicit deferred reason;
- no content arc bypasses identity, persistence, or time/RNG prerequisites;
- visual/audio work remains a real production lane with human quality gates;
- no current-state claim relies on historical commit/run prose; and
- no requirement contradicts the approved contract, decisions, rubrics, or process laws.

### 11.3 Integration boundary

Planning changes use the normal agent branch → draft PR → `develop` path. Review or merge of a
planning document never authorizes `develop` → `main`, a release, a version bump, a manual Pages
write, or implementation outside a separately scoped batch.

## 12. Final coverage checklist

- [x] Foundation integrity, canonical ingress, resources, persistence, and clock/RNG work have
  named placement before ownership/content scale.
- [x] Every approved product Arc 0–10 has purpose, dependencies, and exit evidence.
- [x] Arc 4.5 and Arc 5.5 retain their non-substitutable human gates.
- [x] Visual work includes static delivery, Shipyard grammar, living species, universe/biomes, and
  integration quality—not only thumbnails.
- [x] Audio includes deterministic identity, runtime/lifecycle, rights, HD content, and human
  listening—not only one-shot effects.
- [x] Gate A–I has a mapped program owner and criterion-by-criterion evidence discipline.
- [x] `tsnap`, CFB, malformed data, Training/Guide truth, Charter/records, and deferred projects
  remain named instead of disappearing from the plan.
- [x] The product remains browser-native, deterministic, mobile-first, accessible, save-safe, and
  respectful of player time.

## 13. Source map

- [`PORT_MASTER_PLAN_v4.0.md`](PORT_MASTER_PLAN_v4.0.md): premium browser architecture, visual/audio
  target, data architecture, migration, master phases, and Gates A–I.
- [`RUBRICS.md`](RUBRICS.md): executable/human closure criteria for each Gate.
- [`DECISIONS.md`](DECISIONS.md): settled exploration, loot, companion, ship, and audio decisions.
- [`V2_FULL_SWEEP_2026-08-13.md`](V2_FULL_SWEEP_2026-08-13.md): independent findings and F1/F2/Arc 1
  technical proposals.
- [`v2/README.md`](v2/README.md) and [`v2/DEVIATIONS.md`](v2/DEVIATIONS.md): current slice boundary
  and open implementation ledger.
- [`../EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`](../EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md):
  approved product contract and Arc acceptance.
- [`../ART_DIRECTION.md`](../ART_DIRECTION.md): visual direction, frozen/static art state,
  deterministic art, and biome/rig production rules.
- [`../AUDIO.md`](../AUDIO.md) and [`../AUDIO_LICENSES.md`](../AUDIO_LICENSES.md): audio architecture,
  lifecycle/accessibility, quality, and rights rules.
- [`DEVELOPMENT_PREVIEW.md`](DEVELOPMENT_PREVIEW.md) and `PROCESS_LAWS.md`: exact-head preview,
  instrument, evidence, and current-truth discipline.

`ROADMAP.md` stays lean: it records the active batch, current branch/evidence, and next action. This
document is the durable full-program map that the live handoff points to.
