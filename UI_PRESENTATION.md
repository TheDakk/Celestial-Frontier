# Celestial Frontier — UI / Presentation System

> **2026-08-16 D-TRAIN-1 UI overlay (current source; local browser evidence
> recorded below; exact-head CI, integration, real-save Gate C, and human
> authority remain open):**
> Finish and Skip are asynchronous replacement controls. Once invoked, the
> lesson card sets `aria-busy="true"`, disables its actions, and retains the
> live lesson/focus lockdown while exclusive ownership, active-write drain,
> detached restore/proof, and the single direct primary write complete. A
> pre-durable failure removes busy state and leaves the same lesson/checkpoint
> retryable. After durability, live publication or teardown failure cannot
> cause a second write; the committed primary is reload authority.
>
> Loaded unfinished expeditions are not ordinary onboarding. A recognized
> pending checkpoint and a loaded `tut:0` save without one both hold ordinary
> persistence; the no-checkpoint case may be seated at proven Sol in runtime
> only until atomic completion. Fresh empty onboarding remains saveable. An
> unknown checkpoint or unavailable recovery route converts `#importsheet`
> into a persistent `aria-modal` recovery lock. The rest of the page is inert
> and `aria-hidden`; focus enters the sheet, Tab/Shift+Tab wrap inside it,
> Close is hidden/disabled, and Escape is consumed without dismissal. Trusted
> complete import and Reload to retry remain reachable, the release bulletin
> is suppressed, and the lock reopens synchronously on every boot while the
> protected source condition remains. No click, key, or session-only lesson
> progress may make those protected bytes appear changed.
>
> Player copy in the existing Settings and Saving Guide topics and the single
> existing Field Training release bullet now names legacy partial ownership
> and fail-closed recovery. It also distinguishes route behavior: only a
> current-v2 `{view}` checkpoint returns to the pre-Training view; a legacy
> checkpoint has no `view`, so Skip from Welcome stays in Sol and full
> completion after Land stays at Earth. Topic/capability inventory is unchanged, the draft
> remains five categories /44 bullets, `V2_CURRENT_RELEASE_VERSION` remains
> null, and no version/release is authorized. The remaining fifteen legacy
> lessons stay D-TRAIN-2 work.
>
> The local ignored Slice Smoke report is terminal PASS on Edge
> `151.0.4129.86`: 154,788 ms, 0 findings, 0 automatic retries, 10 screenshots, with the
> genuine Training Skip/full-Finish, rescue/quarantine/retry/race and canonical-
> Earth outcomes named in its raw log. The separately terminal-PASS,
> full-certifying Glass report took 57,476 ms over 12/12 viewports, ran all
> 57/57 planned negative controls with none blocked/omitted, and recorded 0
> findings, 0 instrument failures and 0 automatic retries. Both report commit
> `b091f010011fa16bec457599b41274b7f92bb5e6` / `openai/mac`; Slice Smoke binds
> dirty-tree `465adef3606b0b06dd285eb049662e5b5ee659bb6dc0b53430568a3df9cf9104`
> and Glass binds `4f266568aacdb98c7a6e9cfc8571fc60e0bfc140762540dd844a2714fc0836f5`.
> These local results certify neither this later documentation state nor an
> exact head, integration, real-save Gate C, human play, or release.

> **2026-08-15 F2 canonical-ingress overlay (historical pre-D-TRAIN-1 boundary):** Search treats a
> marked CF1 string as strict route input and supports galaxy, star and planet
> tiers. Each candidate is source-proven before the existing Prime/Charter
> authority check. A successful galaxy or star route opens its own level; a
> planet route opens the exact live system survey and never presses Land. A
> malformed, stale, forged, ambiguous, source-failed or out-of-reach code leaves
> the current view unchanged and keeps the query in Search for correction.
>
> Saved boot/import routes and Atlas rows use the same resolver. A deterministically
> bad saved location repairs only the view to Cosmos; a transient source error
> holds that route field rather than destroying it. Atlas history stays listed,
> but only rows with a private runtime proven-NavState sidecar are enabled. Live
> galaxy/star/planet actions are rebound to regenerated proven nodes, and planet
> actions include the source ordinal captured before orbit sorting; seed-only
> diagnostics and stale structural card contexts cannot Survey or Land.
>
> The first real-browser F2 attempt reached an accepted galaxy and then went red:
> `hudText()` passed the frozen `ProvenGalaxy` authority object to lifted
> `galaxyStats()`, whose legacy memoizer writes `_stats` onto its input.
> `statsForProvenGalaxy()` now passes a disposable mutable spread to that helper
> and stores only a frozen `{stars,planets}` projection in an app-owned
> `WeakMap<ProvenGalaxy,...>`. Provenance stays frozen; mutable presentation
> caching never borrows the authority object.
>
> Current-v2 Training restart stores exactly `{view}`. A normal Finish or Skip
> restores that route only after fresh source proof. If restore reports a
> `source-error`, the exact snapshot remains pending and Training remains
> incomplete; the app attempts to re-prove and persist the Sol system before the
> next-load retry. If Sol itself cannot be proven, it does not forge that fallback
> or discard the retained snapshot. At that boundary richer legacy snapshots were
> not interpreted or restored and D-TRAIN-1 remained open.
>
> Guide and development-draft copy describe source verification and field-local
> route repair. The repaired complete one-attempt local `smoke:ci` is terminal-
> green on the tested dirty-tree candidate, including the injected one-shot
> Training source-error → proven-Sol → reload retry outcome. The complete
> 12-viewport Glass Matrix is separately terminal-green; both reports bind Edge
> `151.0.4129.86` and working-tree digest
> `7dfa649eb7de017424b7ba1ba0b11ba1fd00dc02a5b99b6848e0f3c347acba9e`.
> This is not exact-head CI, integration, human-sign-off or rubric-Gate
> certification, and it changes no schema, production version, shipped release
> or update-popup state.

> **2026-08-13 v2 next-arc overlay — approved design, NOT LIVE:** The current v2
> Compendium is a read-only eager list and V2 has no Cargo, Shipyard, ship portrait,
> crafting, research, or upgrade controls. A maximum imported catalogue can contain
> 1,500 rows; cold rows currently receive the full 440px portrait before the asynchronous
> 132px derivative is cached, so mounted DOM references can outrun the existing cache caps.
> The next portrait surface virtualizes to the visible window plus bounded overscan,
> delivers 132px thumbnails asynchronously with an identity-safe placeholder, and reserves
> the 440px master for the selected detail. Scroll position, native keyboard focus and the
> one-Close-owner law survive thumbnail arrival; stale work cancels on filter, close or
> generation change. Decoded pixels/bytes, mounted rows and outstanding jobs are budgeted,
> and repeated open/scroll/detail/close cycles must plateau in a real browser with a
> deliberate unbounded-list/no-disposal control.
>
> The approved Shipyard is a new responsive panel, not a repurposed character sheet. Its
> static presentation reads one pure `ShipVisualState` shared with the travel-reach
> projection: Scout/Chemical, Jump/Interstellar, Array/Survey Cruiser and
> Intergalactic/Frontier chassis, plus independent Auto-Extractor and Corona Scoop
> hardpoints. The legacy `ascCh` veteran-completion fallback receives an honest refit
> presentation even when no old drive item exists. A before/after build preview, installed-
> system list and reach copy must all agree; art never grants capability. At most one Pixi
> preview may animate engines, beacons or the array. It pauses when hidden/reduced-motion
> and disposes scene-owned textures, filters and particles on panel close; no Pixi renderer
> is created per inventory row. The progression layout is a player-respectful mastery
> ladder: each earned capability has an immediately readable silhouette and named outcome,
> optional systems remain legible hardpoints, and cosmetic rarity never impersonates power.
>
> **Later immersion surfaces, not live v2 panels:** a first complete journey should let a
> fresh player see an opportunity, its finite cost, the build or companion choice it enables,
> the risk it changes and the farther possibility it opens—without making the player decode a
> spreadsheet or consult a hidden guide. A future optional Outpost/project board follows the
> same language: one named purpose, disclosed finite inputs, visible before/after projection
> and no idle-income, daily-maintenance or urgency loop. The Expedition Chronicle/Museum is a
> player-curated read-only view of receipt-backed discoveries, companions, ship history,
> missions, worlds and trophies; it never owns a second event log, creates a reward faucet or
> masquerades as a retention dashboard.
>
> Automated personas and layout reports remain necessary but do not establish delight,
> comprehension or attachment. The formal human cadence in `port/RUBRICS.md` reviews the
> first 30–60 minutes, the first three sessions and a sustained session across phone/desktop
> and accessibility lenses; it records clarity, agency, delight, meaningful choice,
> attachment and fatigue—not retention pressure or engagement targets.
>
> **2026-08-15 v2 development overlay (matches the current `port/v2` contract):**
> Desktop notifications now rise from the bottom-right utility edge above the measured
> dock; Settings and Records open from that same bottom-right anchor. Panel padding,
> row spacing, dividers, corner radii and inset borders use one balanced glass grammar.
> Every panel and Survey card owns exactly one 44px top-right Close action—refill code
> preserves it, duplicate seating is removed, and no close control may detach to the
> upper-left. Outside dismissal now reads one declarative boundary marker on the top bar,
> dock, Survey and both desktop rails rather than a duplicated ID exception list. A real
> pointer in either rendered 8px rail gap leaves the active panel and its ARIA state intact;
> removing either marker recreates the close, while genuine unmarked canvas space still
> dismisses. Search deliberately retains its established outside-dismiss/focus policy until
> the later panel-coexistence/Escape decision. Survey cards suppress the legacy **Spectral class** row. Planet rarity is
> absent before landing and appears afterward as a plain ten-tier rarity name; internal
> deterministic spectral colors and real stellar G/K/M/remnant classifications remain.
> Development identity appears only in the Guide as **Celestial Frontier v2.0
> development** plus the full source commit. There is no floating DEV badge. `v2.0` is
> a playtest identity, not a production release: the legacy v1.8.9 history is immutable,
> `V2_CURRENT_RELEASE_VERSION` stays `null`, and no one-time update popup may fire.
> The current **Charters** panel renders one stage-aware projected record rather than the
> raw legacy chapter book; `currentV2Objective` feeds the top chip from the same source.
> Only a reachable live landfall goal may appear. After the visible landfall work is
> complete, the panel and chip name the development-slice boundary rather than seating
> mining, fabrication, Shipyard, reward or drive controls. Star/drive reach blocks use a
> dedicated **Beyond Your Charter** toast: the next Charter system is unavailable in this
> development slice. Galaxy-distance blocks use a distinct **Beyond Your Saved Reach** toast:
> the saved Prime Signature radius ends there and its expansion is unavailable in this slice.
> Either boundary can replace an ordinary Charted/Share notice immediately, while an unchanged
> repeated block stays quiet. The matching Guide route/Charter copy carries both precise
> capability boundaries and never promises Signature collection.
>
> **2026-08-12 v2 port base overlay:** The phone slice now
> owns an explicit 206×98, 4×2 dock and publishes measured `--dock-h` and
> `--ctx-h`. Context, hint and Planetside offsets derive from those values, so a
> wrapped line, safe-area change or media-query change cannot bury copy beneath
> the dock. The 390×844 real-browser leg checks pairwise rectangle clearance,
> all eight button hit targets, exact rows/size, and CSS-variable equality, then
> injects the old overlap and requires the gate to fail. Hint verbs also use real
> word-boundary regex bytes, so `.kw` highlighting is tested as an outcome. A
> separate fresh-origin phone leg keeps Field Training active, anchors its card
> above measured `--dock-h`, proves all eight dock centres remain geometrically
> clear, and rejects an injected training-card burial; the veteran phone capture
> can no longer make that fresh-player layout pass vacuously.
> Pixi also uses `autoDensity: true`: the backing store remains DPR-scaled
> while the rendered canvas box equals the viewport. The phone gate injects the
> former doubled CSS canvas and requires the density check to fail.
>
> Survey-first navigation is also phone- and slow-device safe: the first tap
> opens the typed body card without teleporting, and its explicit 44px
> `Enter galaxy` or `Enter system` action performs the dive. The card may cover
> the body on a phone, so navigation never depends on a second canvas tap or a
> timing window. The portable browser gate proves the desktop action and a real
> 390×844 touch body→card-action outcome. It also drives the actual Sol sprite,
> a stage-0 non-Sol fine-star Charter rejection and a deterministic stage-2
> fine star, compares exact `{seed,x,y}` identity, and includes buried-action
> controls.
> Planet cards bind the complete captured galaxy+star `{seed,x,y}` identity;
> smoke deliberately moves an Earth card to a same-seed/different-coordinate
> system and requires Land, Atlas and Share to remain unavailable.
> On touch, Planetside supplies a minimum-44px **Leave world** action that calls
> the same ascent state machine as Escape/right-click; returning to orbit never
> depends on a keyboard or a precision zoom-out gesture.
>
> The eighth phone-dock slot now opens the canonical **Guide to the Universe**
> rather than the old import shortcut or a second seven-topic manual. V2 carries
> the mature inventory—9 categories /43 authored stable topic ids /41
> legacy-live topics—plus category drill-down, title/keyword/body search and
> `data-gt` cross-links. A capability layer substitutes current-slice copy for
> partially ported systems and a visible **Not yet in v2** explanation for
> unported systems; dormant `beacon` / `events` remain retained in the source
> contract but hidden from the 41-topic player catalogue. First open persists
> `seenGuide`; import moved without loss to **Settings → Bring expedition**.
> The same panel exposes all 56 immutable legacy release entries plus **A New
> Foundation**, the cumulative categorized v2.0 development bulletin. It summarizes
> every implemented playtest layer while keeping unavailable port work out of its
> promises. The long draft is browser-checked for canonical section order and a
> reachable final bullet; opening and reloading it cannot change `rnSeen` or create
> a shipped-update state. No v2 production version exists until Nick authorizes one. Tooltip deep links and
> Advanced Briefings remain open port scope. The slice's Field Training likewise
> owns six real chart/travel/landing lessons plus an honest graduation, not the
> full legacy 21-step curriculum.
> **Settings → Bring expedition** opens above every dock/panel as a true
> `aria-modal` dialog, keeps Tab focus inside, and in ordinary import mode lets
> Escape close only the dialog before restoring Settings focus. In Training
> recovery mode the same sheet is intentionally nonclosable: Close is absent,
> Escape is consumed, background content remains inert/hidden, and retry/import
> stays until protected state is replaced. The phone gate injects its old z=11
> layer and must observe the dock become exposed.
> On a 390×844 phone, browser smoke also opens the real Guide panel and requires
> at least 8px clearance above the measured dock. Its negative control injects
> the superseded fixed `max-height` and must reproduce the overlap, so the check
> cannot pass by measuring only the dock or an unopened panel.
> Guide and Settings sit at z24 above the z23 survey card. Outside Field
> Training, Compendium, Records, Star Atlas, and Charters also rise to z24 so
> every ordinary phone panel remains operable over a populated card; Training
> keeps its step-specific card/panel order. Real Earth-card intersections and
> injected low-layer controls prove these surfaces are not merely present
> underneath the card.
> Every panel now seats exactly one 44px top-right Close control in its own header
> geometry, so scrolling content cannot render or receive focus beneath that
> target and refill cannot duplicate it. Closing still prefers the exact opener; if a desktop rail opener has
> become hidden because Survey reopened, focus falls back to Survey and then to
> the exploration canvas instead of remaining on a hidden close control.
> On every ≤900px landed layout, populated Planetside owns the limited
> mid-screen reading band, so the objective yields until ascent. Portrait now
> measures visible fixed top chrome plus the last visible trail edge, and the
> already measured safe/dock/context lower chrome. `syncDockH` and `syncCtxH`
> rerun the classification after asynchronous chrome changes. It retains the
> trail only when a useful **72px Planetside roster band
> plus 6px clearance** fits; otherwise `surface-trail-yield` hides only the
> noninteractive trail. Planetside keeps a 72px floor and `overflow-y:auto`, so
> its heading and specimens remain vertically reachable instead of collapsing
> or rising through the trail. Short landscape continues to yield the trail,
> and Planetside begins below measured top chrome. The matrix names the two-way
> portrait controls `planetside-portrait-band-viability` (remove the cap and
> reproduce the collision) and `planetside-portrait-trail-fallback` (force the
> tight branch, prove a useful scrolling strip, then restore the trail), in
> addition to objective yield/restoration, landscape yield and top-clearance
> controls.
>
> The responsive glass/accessibility pass is now behavioral rather than just
> cosmetic. Safe-area variables drive top, side and bottom anchors; rendered
> dock/context/hint heights feed the remaining offsets; 320px portrait through
> ultrawide and phone-landscape geometries are exercised. Glass tint has an
> 0.82 contrast floor (up to 0.98), a solid fallback when backdrop blur is
> unavailable, and forced-colors treatment. Touch and panel controls are at
> least 44px; focus-visible is unmistakable; sliders and import controls have
> names; panels focus their close control and return focus to their opener; the
> import modal traps Tab and restores Settings focus.
> Saved Text size / Text tone / Font preferences now apply to the live DOM and
> remeasure the chrome. Motion Auto follows the OS live; Reduced removes CSS
> animation/transitions and also freezes Pixi ambient clocks, snaps camera/fade
> state and gates Planetside organisms. The canvas is a named focusable region:
> arrows cycle the rendered galaxy/star/planet targets, Enter/Space opens the
> same survey card, +/- zooms around the target, Escape releases it, a visible
> ring marks it and a polite live region announces it. Clipboard refusal never
> reports success: the exact CF1 code is selected in Search with an honest
> browser-copy instruction.
> The dock remains a 44px pointer/focus target while its icon uses the 42px
> client line left inside the 1px border, preventing a hidden two-pixel scroll
> overflow. A++ also preserves notification hierarchy: the toast title remains
> 19px while its body is 16px rather than being flattened to one size. On desktop,
> the toast, Settings, and Records use the bottom-right utility edge rather than
> appearing over the upper-left navigation rail.
> Renderer density remains dynamic after resize/visual-viewport change. The
> selected plan retains the touch-2 / desktop-3 heat caps and native backing
> through UHD 3,840×2,160. Ordinary viewports may use 8,388,608 backing pixels
> per canvas / 16,777,216 aggregate; a viewport **strictly larger** than
> 8,388,608 CSS pixels selects the ultra tier of 2,073,600 per canvas /
> 4,147,200 aggregate. Exact rounded-dimension fitting keeps fractional DPR from
> rounding over the selected cap, so desktop-8k and 5,120×2,880 each use two
> 1,920×1,080 stores (2,073,600 each /4,147,200 combined), at DPR 0.25 and 0.375
> respectively. `autoDensity` keeps CSS and hit
> coordinates viewport-sized. A live transition destroys and collapses the old
> backdrop before resizing/allocating its replacement, records the exact
> transition peak against its budget, and refreshes Pixi screen/texture/event
> geometry even when a same-aspect viewport change happens to retain the same
> integer backing dimensions. Downshift and restore each require a strict exact-
> target/`Browser.getVersion` pair plus an advancing later post-render ticker turn;
> stopped and stale tickers fail deliberate controls. The existing scene rerender
> still runs on the transition—this repair lowers the resource ceiling and does not
> introduce a separate art-quality tier or scene-rerender optimization.
>
> Species art remains a lazy chunk, but readiness is now one shared Promise with
> one latest subscriber per interested view. An idle prefetch can no longer
> swallow a later Compendium/Planetside refill, and a 1,500-row Compendium cannot
> retain 1,500 callbacks and replay the whole list 1,500 times when art arrives.
>
> V2 browser smoke and root `uilayout.js` use the owned portable CDP lifecycle.
> Legacy `bootperf.js` shares their executable resolver and pinned `ws` transport
> but retains its fixed-port/startup/cleanup lifecycle; unresolved performance metrics fail rather
> than print a profile-shaped success. The glass matrix's import/reload contract
> is likewise fail-closed. Import settlement, navigation commit, and replacement
> boot are three separately witnessed phases: exactly one
> `cf-v2-reload-release/v1` event must arrive within the 20-second import bound and
> prove Pixi renderer/stage release,
> application-view detachment, and collapse of the application/backdrop canvases
> to at most 1×1; the top-frame loader then gets 5 seconds to commit a change; and
> only that committed loader starts the new document's independent 20-second boot
> budget. A vanished old execution context is not navigation evidence by itself.
> The replacement initializes Pixi with `autoStart:false` and keeps its ticker
> stopped through save load, scene render, slice publication and input wiring.
> Its exact event-owned `cf-v2-boot-phase/v1` sequence is `app-init-start` →
> `app-init-complete` → `backdrop-complete` → `save-load-start` →
> `save-load-complete` → `scene-rendered` → `slice-published` →
> `wiring-complete` → `ticker-started` → `first-tick` → `ready-scheduled` →
> `ready-emitted`. Each receipt binds the exact session, default top context,
> generation, origin, loader and document token; the ticker must be false through
> wiring and true thereafter. Only after a real tick/render, animation frame and
> later task does the optional `cf-v2-slice-ready/v1` tail event publish. Glass
> accepts exactly one event from the
> exact target session and new default top context/generation/origin on the changed
> loader, with the expected URL and changed token, then runs two strict,
> no-retry, at-most-2-second confirmation cycles in that context. Each target
> command is issued concurrently with root-session `Browser.getVersion`; cycle 1
> samples immediately, while cycle 2 resolves from a one-shot Pixi ticker callback
> after the render listener and must advance the ready ticker count. A timely
> browser heartbeat plus an unanswerable/lost target is a product finding; an
> unhealthy or late heartbeat is an instrument/transport failure. The exact
> five-command ledger records the import arm and both target/heartbeat pairs.
> Sticky receipt timestamps—not serial Page/Runtime polling—own the deadlines.
> Import-phase and generic release bindings share one capture-scoped monotonic
> ordinal: a successful tail is exactly `release-started` N → release N+1 →
> `release-complete` N+2. Only the valid release-first intermediate waits under
> the unchanged import deadline. Phase-complete-first, premature, nonadjacent,
> missing, late, duplicate, malformed, wrong-provenance, early boot/ready, and
> an overlong sequence-8 duplicate terminal fail closed.
> The payload's browser-native
> `performanceNow` must be strictly below 20 seconds, with the exact boundary a
> failing control, so observer descheduling cannot make a genuinely late product
> boot look timely. The ready chain plus both confirmations witnesses publication,
> an immediate serviced target turn, and a later post-render ticker turn; ready by
> itself is not steady-state answerability, and later driven outcomes remain
> authoritative.
>
> The product produces that witness from one code-owned path used by its three
> intentional reloads: Training restart, supported expedition import, and the
> storage-retry reload. Each first claims one mutually exclusive replacement
> transaction before awaiting. Claiming synchronously stops a running outgoing
> Pixi ticker before the first persistence wait. Only the exact owner of a failed
> or rolled-back replacement may restart a ticker that its claim stopped; a
> successful flow destroys the app while it is already quiescent, and pre-claim
> invalid import rejection leaves the live renderer untouched. The chosen flow
> blocks ordinary persistence, destroys Pixi and global/
> child texture resources, detaches and shrinks both outgoing backing canvases,
> then crosses one task boundary before `location.reload()`. It does not use a
> generic `pagehide` teardown, because a browser-cache restore must not revive a
> destroyed application. The harness retains bounded Page, Runtime, Inspector,
> and Network lifecycle/failure evidence and fails on duplicate/invalid release
> witnesses, crash, unreachable navigation, replacement exception, fatal document
> load, loader reversion, wrong URL, or any missed phase. The controls
> `replacement-document-loader-token-phase`, `reload-resource-release`, and
> `replacement-boot-phase-sequence` reject stalled navigation, stalled new-loader
> boot, same-loader token mutation, early context loss, just-late transitions,
> missing/reordered/identity-mismatched boot stages, early/running tickers,
> retained canvases, unreleased renderer, and over-budget aggregate backing
> pixels. `ready-confirmation-heartbeat`, `ready-confirmation-ticker-progress`,
> `ultra-viewport-render-budget`, and `ultra-same-backing-resize` extend the full
> plan to 57 controls. The report separates executed, product-blocked, and omitted
> controls so a product answerability failure cannot be overwritten by a generic
> instrument omission. The run remains single-attempt—a red result is never
> retried into green.
> An event-owned `cf-v2-import-phase/v1` stream now proves the pre-release half:
> `invoked` begins with the ticker running; `claimed`, persistence wait/write, and
> release stages require it stopped. The absolute 20-second import clock begins
> before one bounded non-awaiting arm command and is never renewed. Controls
> `import-phase-sequence` and `replacement-ticker-quiescence` reject missing,
> reordered, wrong-operation/context, just-late, and still-rendering evidence.
> IndexedDB itself is not wrapped in a timeout race, and no retry or timeout
> increase turns a red import green.
> The current profile is not yet a release
> budget gate: cold repetitions, long-task/memory budgets, Compendium
> virtualization, scene-texture disposal, live HD planet replacement and fuller
> hidden-tab behavior remain open. The v2 static preview packaging/hosting
> contract is documented separately in `port/DEVELOPMENT_PREVIEW.md`; a preview
> is development evidence, never a release or production deployment.
>
> **Earlier repair evidence:** pushed commit
> `8b8a740286a56591cac9dc5734a2fba4c088939b` passed its exact sequential local
> battery and repaired test-battery #199's desktop-8k reload witness plus
> small-phone Planetside/trail collision. Matching test-battery #200 passed every
> root/product/v2 gate, the one-attempt smoke, complete 12-viewport glass matrix,
> automated personas and preview packaging; only preview CDP startup failed before
> a page existed because that step lost the previous step's Chrome environment and
> selected Linux Edge. Pushed commit `4d14a75e934536dc5f204e40c74f666cc9514df4`
> pins Chrome at job scope.
>
> Clean code/tool commit `08379d8c072c7eb22e2a029d666972c86d496326` carries the follow-on
> root-layout repair. `uilayout.js`
> now consumes the v2-owned resolver/launcher: port 0 plus `DevToolsActivePort`,
> exact browser provenance, early-exit and bounded stderr diagnosis, bounded
> TERM→KILL cleanup, and owned-profile removal. It atomically replaces its ignored
> schema-v2 report from `running` to terminal `pass` / `fail` /
> `instrument-fail`, preserves legacy `results`, and supports a stale-PASS/exit-73
> `--selftest` plus exact `--verify-run=ID` freshness. A full PASS must reproduce
> the sealed v1.8.9 report's exact 787 `viewport/surface/name` outcomes; targeted
> runs certify only their requested viewport subset. The selftest removes one
> sealed outcome while keeping counts consistent and requires rejection. Its first sandboxed Edge
> diagnostic preserved SIGABRT as red; a separately permitted mutable-tree run
> then completed 787/787 across 10 viewports.
>
> Matching test-battery #201, run
> [`31586917924`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924) /
> job [`94082765087`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924/job/94082765087),
> completed once without retry and is **RED**. Every preceding root/product/v2
> gate, including one-attempt `smoke:ci`, passed. Only the desktop-8k preference-
> fixture import leg instrument-failed: after the 20-second replacement wait, the
> old top-frame loader still owned the frame while the old slice token/import
> phase were absent. That is a replacement-lifecycle/instrument finding after
> reload was requested, not a save-classifier rejection, `import-rejected`, or
> reported repository-write error. It must not be erased by rerunning unchanged
> code.
>
> Matching test-battery #202, run
> [`31594595288`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288) /
> job [`94106996466`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288/job/94106996466),
> completed once without retry at pushed `93f75a93ab80a3b199e55b5b49d9488e8fc57f53`
> and remains **RED**. Every earlier root/product/v2 gate and `smoke:ci` passed;
> only desktop-8k glass import/replacement instrument-failed when the former
> observer first returned at 61.163 seconds. That observer serially awaited three
> CDP commands with 30-second ceilings, so #202 does not prove a 61-second product
> boot, save rejection or presentation failure. It is preserved instrument
> ambiguity, without retry or a timeout increase.
>
> Matching test-battery #203, run
> [`31602984470`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470) /
> job [`94134750800`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470/job/94134750800),
> completed once without retry at exact pushed head
> `38e4f362533e272f56f708229f7a037f38ae8951` and is **RED**. All root,
> product, v2 and `smoke:ci` gates before glass passed. Eleven viewport rows
> passed; only desktop-8k import reached its 20,015 ms bound before any release,
> ready, navigation, fatal, command or event witness appeared. The outgoing
> 5,461×3,072 Pixi ticker was still scheduling software-rendered frames across
> the durable-write wait and teardown. This is a pre-release renderer-pressure
> cliff, not proof of save corruption or a rejected repository write. Preserve
> #203 as first-attempt evidence; do not retry it or lengthen the deadline.
>
> Immutable executable evidence source
> `7d9980e37e60f0cec8cb840e75098872b9cc90d0` passed its exact sequential battery.
> Root preflight selftest/preflight, validate/fingerprint and smoke passed; the
> only preflight note was Edge 151 versus pinned Edge 150 drift. Certifying run
> selftest passed, then `exact-7d9980e-root-layout` passed the sealed 787/787
> inventory across 10/10 viewports and exact verification. Rarity completed 60M/0 downgrades and dead-code review
> found 3 tooling references. V2 passed 24 files / 273 tests / 1 skip plus every
> gate/selftest; one-attempt smoke passed 0 findings / 10 screenshots.
>
> Exact-source certifying glass passed 12/12 viewports, 52/52 controls,
> `omitted=[]`, 0 findings/instrument failures/retries, with working-tree digest
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
> All 12 exact import-phase/release/ready paths passed, with replacement totals
> of 194–239 ms. Desktop-8k recorded a 3 ms arm, 21 ms import-phase span with
> the ticker true only at `invoked`, 0 ms write, 19 ms release, both
> 5,461×3,072 backings collapsing to 1×1, `performanceNow` 199.5 ms, 1 ms
> confirmation and 239 ms total. All nine automated personas passed. The initial
> malformed `npm run perf -- --runs=4` command was rejected before a browser
> launched; the correct single terminal diagnostic then recorded 646 ms painted /
> 726 ms answerable / 74 ms press→panel / 157 ms rebuild, not a retry of an
> evidence failure. Exact 37-file / 10,170,996-byte preview
> `dev-preview-exact-7d9980e` verified and browser-smoked PASS under Edge 151 at
> 320×568 for expected origin `https://dev-celestialfrontier.github.io`, distinct
> from production, content SHA-256
> `a4a3d0f6300df1bf14a21149b53c0a4591283ae2e4ab3ab5b4034cdd130409a7`, exact
> `port/v2` tree `5e90265993304c5b03e49a7baef2479ae2c37184`, `publishable:false`.
> `7d9980e` remains immutable prior exact evidence. The later prior repair
> evidence is bound to `46fb627640e42ea0f43e2e144529884a959d1e72` below. The
> artifact is bound to `https://dev-celestialfrontier.github.io`, but no host or
> publication is authorized and the separate-origin human playtest is still
> required before Ready or merge.
>
> Before that stable-source battery, one smoke attempt refused mixed-source
> evidence because tracked documentation changed during its run (`source identity
> changed during slice smoke`). The single execution had no automatic retry and
> remains a coordination/instrument refusal, not a product failure. None of the
> automated results substitutes for matching CI or human play.
>
> Matching test-battery #204, run
> [`31612817092`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092) /
> job [`94168172635`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092/job/94168172635),
> completed once without retry at exact pushed head
> `4cee7d807b8f9258e370aad31c30756269f95a96` and is **RED**. Every earlier gate
> and one-attempt `smoke:ci` passed. Desktop-8k import, primary write, 35 ms
> renderer release, navigation, changed loader at 45 ms, load at 231 ms and FCP
> at 268 ms were healthy after the arm command had queued for 9,504 ms; the new
> document then emitted no ready witness within its independent 20-second budget
> and no fatal event. The failure exposed two concurrent boot costs: each
> full-viewport canvas could allocate the full 16,777,216-pixel ceiling, and Pixi
> auto-started before asynchronous save/scene/slice/input wiring. Preserve #204
> as first-attempt evidence; it is not an import, write, release, navigation,
> load or FCP failure, and it must not be retried or hidden by a longer deadline.
>
> Immutable executable source `46fb627640e42ea0f43e2e144529884a959d1e72`
> passed the exact local battery. One malformed `--verify-run` operator invocation
> caused local SIGABRT and report overwrite; one correct rerun plus verification
> then passed `exact-46fb627-root-layout`, 787/787 across 10/10 viewports. V2
> passed 273 tests /1 skip and all gates/selftests; one-attempt smoke passed 0
> findings /10 screenshots. Full certifying glass at source-snapshot digest
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
> passed 12/12, planned/executed 53/53, `omitted=[]`, zero findings/instrument
> failures/retries in 170–197 ms. Exact 8K was 190 ms total: 2 ms arm, 35 ms
> release→changed-loader commit, 137 ms commit→ready, `performanceNow` 170.5 ms
> and 1 ms confirmation; both outgoing 3,862×2,172 canvases collapsed to 1×1,
> while the replacement pair remained 16,776,528 pixels combined. All nine
> automated personas passed, still not a human playtest; terminal-only performance
> was 595/676/76/168 ms. Manifest `dev-preview-exact-46fb627` records 37 files /
> 10,176,376 bytes, content SHA-256
> `4d7638e92c4d02cffb953c9588bb1fff2e4c38153c3ff4ad752687e4a0263b58`,
> expected origin `https://dev-celestialfrontier.github.io`, production distinct
> and `publishable:false`. `46fb627` remains prior immutable exact evidence; live
> Git/PR checks determine exact tip/upstream status. Host, human play, Ready, merge,
> release, deployment and version authority remain unchanged.
>
> Matching test-battery #205, run
> [`31621227550`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550) /
> job [`94196289291`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550/job/94196289291),
> completed once without retry at exact pushed head
> `c57305fbf30af2bc8158ff46af1ec49ec4455d95` and is **RED**. Every preceding
> gate and `smoke:ci` passed. Desktop-8k completed import, write, release,
> changed-loader navigation, all 12 application boot stages, and ready at
> browser-native `performanceNow` about 3,733 ms; the exact-context confirmation
> alone timed out at two seconds. #205 carried no concurrent browser-process
> heartbeat, so it remains strong evidence of post-ready target starvation but
> not retrospective proof that browser/CDP transport was healthy. Preserve it
> without retry.
>
> Prior diagnostic only: the earlier `dirty-diagnostic` targeted/smoke/glass captures
> based on `c57305f` remain non-authoritative; their sandbox `EPERM` and corrected
> `7680.000000000001` harness assertion did not retry a product failure.
> Immutable executable source `135a635d066d1c67e3096dc134de9247267898d5`
> passed the complete exact sequential battery from clean source-status SHA-256
> `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` and
> source-snapshot
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
> A sandbox-only Edge SIGABRT interrupted preflight/CDP selftest; the same checks
> passed outside sandbox without a product retry. Root validate, legacy smoke,
> rarity and dead-code passed. Root layout
> `exact-135a635d066d-20260812T192848Z-root-layout` passed 787/787 across 10/10
> under Edge 151 in 75,532 ms (report SHA-256
> `7e2689c31e1095885ee8139bb395b40e799972461649efd100b631a4e6e9f85f`).
> V2 passed 273/1 plus all type/art/override/coverage/spec gates. One-attempt smoke
> passed 0 findings /10 screenshots /0 retries in 105,379 ms (SHA-256
> `c838f3e7dfdf161b7bfa6111c6979215a2ba439fdd44a4cb8e00a8cdf7c3d1a5`).
> Full certifying glass passed 12/12, 57/57 unique, `blocked=[]`, `omitted=[]`,
> zero findings/instrument failures/retries in 52,254 ms (SHA-256
> `1f14906d178528613fdf52db53ee4e1f84b6a48ceb21ad3a41bd9d0c5348b23b`),
> with reloads at 176–185 ms. Exact 8K was 185 ms total /2 ms arm /12 ms
> invoked→release /32 ms release→commit /122 ms commit→ready /152.2 ms
> `performanceNow`; target confirmations were 1/9 ms and heartbeats 1/1 ms.
> Outgoing/replacement stores were 2,730×1,536 each; outgoing stores collapsed
> to 1×1 and the replacement pair remained 8,386,560 combined pixels. All nine
> automated personas passed—not human play—with JSON/Markdown SHA-256
> `c17c44fcb3d534707dc6186bbd4fbcae4d1cfea511bdec8a263ec48be4927a58` /
> `43d5d52e44d7d19aec597a3df5b2599c0da143bb7170d16c17ed141bd390d6b4`.
> Terminal-only performance was 578/659/76/170 ms. Preview
> `dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked PASS under
> Edge 151; manifest SHA-256
> `0233984ca2bad28c189e979d4a30082d6137a06e8eac086c3b2525989813dd4e`,
> 37 files /10,186,230 bytes, content SHA-256
> `da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`,
> tree `d1ab1d79fba4ba2939c3e1ec0661fb60498afb23`, expected separate origin,
> production distinct and `publishable:false`. Live Git/status/PR checks determine
> the exact docs-only tip; matching CI, host approval, human play, Ready, merge,
> release, deployment and version authority remain separate and open.
>
> Test-battery #206, run
> [`31635297321`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321) /
> job [`94243979205`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321/job/94243979205),
> completed attempt 1 without retry at exact pushed
> `558e0565d368a0b81d86d99fd380ebc50d30bc02`; merge `e160577` is tree-identical.
> Every preceding step and `smoke:ci` passed. The 8K reload passed in 8,749 ms,
> ready published at `performanceNow` 2,578.6 ms, and initial target cycles completed
> in 1,905/1,910 ms with 3/1 ms heartbeats. The later 5,120×2,880 transition's
> exact-context `Runtime.evaluate` timed out at 2,003 ms against the strict 2,000 ms
> bound while `Browser.getVersion` answered in 2 ms; `last:null`. That sole
> `ULTRA_VIEWPORT_RESIZE_UNANSWERABLE` result is a product finding, not instrument
> ambiguity. Glass covered all 12 viewports with 1 product finding, 0 instrument
> failures, 56 executed plus 1 product-blocked control =57, `omitted=[]`, and 0
> retries. No persona or preview evidence was produced. Preserve #206 red without retry.
>
> Test-battery #207, run
> [`31642880191`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191) /
> job [`94269466117`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191/job/94269466117),
> completed attempt 1 without retry at exact pushed
> `ff9bebb22aaac0e95cd406e1e15737898452911a`; merge
> `8dfe018590edf8a5d15291730c873869b96caae2` is tree-identical. All prior gates,
> `smoke:ci`, and 11 glass rows passed. Tablet-portrait alone instrument-failed when
> a valid healthy release witness was received between ordered `release-started` and
> `release-complete`. The report retained 0 product findings, 1 instrument failure,
> 57 planned/listed controls, empty blocked/omitted ledgers, 0 retries, and no persona/
> preview output. Preserve #207 red; this is an observer race, not a product/UI failure.
>
> The dirty #207 diagnostic (report
> `805b50cb9341dfa49df6136565f050609b65d78387975e3c90c54ca937f4713b`) remains
> chronology only. Immutable executable source
> `6554b2be652c083bc9ff7ed11c2f928e90b74660` passed the complete exact clean battery.
> A first sandboxed preflight Edge launch SIGABRTed before CDP; the same invocation passed
> when permitted with only expected Edge 151/pin-150 drift, an environment launch refusal and
> not a product retry. Root gates and exact layout 787/787 across 10/10 passed (report
> `58dc4ef4456fac012b2e8f0aa801917b5579cffe435fd4576827ff29bcbb4b78`); v2 passed
> 273/1 plus all gates; one-attempt smoke passed 0 findings/10 screenshots in 105,430 ms
> (report `139b10ea16d17c109d5b624fa75daf73291d98f5ad8fe7df569501829ab5f844`).
> Certifying glass passed 12/12 and 57/57 in 54,877 ms with exact 6/7/8 tails on every
> row, empty blocked/omitted ledgers, and zero findings/instrument failures/retries (report
> `a05ba65e28ac94b146b051164c1b22195bfaa7509bd47d9631561fc394920b6c`). Tablet-
> portrait was 196 ms with commands 2/1/1/7/0 and ready `performanceNow` 166.3 ms.
> Exact 8K was 197 ms with commands 1/1/0/7/0, release→commit 34 ms, commit→ready
> 131 ms, ready `performanceNow` 163.6 ms, outgoing 2,365×1,330 twins →1×1, and
> replacement at 6,290,900 combined pixels. Nine automated-only personas and terminal-only
> 635/717/77/151 ms performance passed. Preview
> `dev-preview-exact-6554b2b-20260812T184000Z` was browser-smoked under Edge 151 over loopback,
> bound to the expected separate development origin, with `publishable:false` and content
> `04bb2c095468a61834992c970a8ac7c364efb37df9ac4397966fd3a4bc43e69d`.
> That immutable source remains prior #207 executable evidence; live Git/PR state determines
> the current tip, upstream, and checks, and the selected pushed tip still requires matching CI.
> No human, host, Ready, merge, release, deploy, or version authority follows.
>
> Test-battery #208, run
> [`31649176954`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954) /
> job [`94289516851`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954/job/94289516851),
> completed attempt 1 without retry at exact pushed head
> `ee8bc281c424b5a8f998dc7327372e5f5a18067d`; merge `8fc6b4fc` is tree-identical,
> and branch-flow run `31649175614` / job `94289512873` passed. Steps 1–15,
> `smoke:ci`, and the first 11 glass rows passed. Desktop-8k alone reported
> `REPLACEMENT_UNANSWERABLE_AFTER_READY`: its valid 2,365×1,330 pair /6,290,900
> pixels scheduled ready at browser performance 584.3 ms but emitted at 3,143.8 ms,
> a 2,559.5 ms main-thread gap. Exact target cycle 1 then timed out at 2,003 ms
> against the unchanged strict 2,000 ms bound while the browser heartbeat answered
> in 1 ms; no fatal event occurred. The full 12-row report retained 1 product
> finding, 0 instrument failures, 57 planned controls with
> `ultra-same-backing-resize` product-blocked, `omitted=[]`, 0 retries, and no
> persona/preview output. Preserve #208 red without retry.
>
> The fixed repair described above targets sustained responsiveness, not a one-shot
> ticker pause: UHD stays native and the larger tier deterministically resolves 8K
> and 5K to 1,920×1,080 each /4,147,200 combined, while ready, two-second target,
> concurrent-heartbeat, ticker, pointer, resize, and zero-retry contracts remain.
> Literal new-shape positives and former 2,365×1,330 plus existing 2,730×1,536
> ready/release negatives prevent stale policy from passing.
>
> The `d8684c415a729222dd1a290e166a2a71ea79f72f2457d2ad144f434a82c30a8b`
> dirty-worktree PASS is prior diagnostic chronology only. Immutable clean executable source
> `307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed committed-clean root layout
> 787/787 across 10/10 (`c42a50873ad01a91dd439860f41f1d695a7d2bf5c41521ed8b7eb768b7ee4975`),
> v2 273/1 plus all gates, one-attempt smoke 0/10 in 105,339 ms
> (`90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723`; log
> `fe8c5d42eec2a09641f3f551486046559cd4c5956591b5a7d71a25b48d926af1`), and glass
> 12/12 unique rows and 57/57 controls in 53,083 ms with exact 6/7/8 tails, empty
> blocked/omitted ledgers and zero findings/instrument failures/retries
> (`42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f`). Exact
> 8K was 171 ms / browser performance 161.9 ms, commands 1/1/1/3/0 ms, 33/129 ms
> release→commit/commit→ready, and two 1,920×1,080 stores /4,147,200 pixels at DPR 0.25;
> terminal-only performance was 606/685/74/171 ms. Preview
> `dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was browser-smoked under Edge
> 151 over loopback, bound to expected separate origin `https://dev-celestialfrontier.github.io`,
> with `publishable:false` (manifest `1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d`,
> content `5db7790977071235ed164fb8f382bd67421c9fd5e834a504cdb4e1a1e8f47589`).
> Live Git/PR determines current tip/upstream/checks; the selected pushed tip requires matching
> CI. No host, human, Ready, merge, release, deployment, or version authority follows.
>
> Immutable clean executable source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
> remains prior exact #206 executable evidence (clean status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
> snapshot `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`).
> Edge 151/pin-150 preflight warned; root validate/smoke, exact layout 787/787 across
> 10/10 (`d0d9a9b3c58f996e5fb7b10f21aa98c974272531f10ccdb945cd026942429252`),
> v2 273/1 plus all gates, and one-attempt slice smoke 0 findings/10 screenshots
> (`b835f79764f4e22a2179ab74f9412491ee4d81730e775889372461d64ddd0474`) passed.
> Certifying glass passed 12/12, 57/57, empty blocked/omitted and zero findings/
> instrument failures/retries in 52,557 ms (`7fe33219e70361140ebc931f0d77fca0976a46fe51eecc42815f41eba110980c`).
> Exact 8K was 203 ms / `performanceNow` 158.2 ms, phases 2/11/33/127 ms, targets
> 1/10 ms, heartbeats 0/0 ms; 2,365×1,330 outgoing stores →1×1 and replacement
> remained 6,290,900 pixels combined. Nine automated-only personas passed (JSON
> `c10c9e33542ed57b4c51683c0ddf3f1bbc468696a025e88ef2d1e500209581bc`; Markdown
> `1c9961515028a716ba064ca32ea9dd3ef2d41118cfde4c76b24c16520daa2d14`), plus
> terminal-only 581/659/73/152 ms performance. Preview
> `dev-preview-exact-df1c28b-20260812T211642Z` was browser-smoked under Edge 151 over
> loopback, bound to the expected separate dev origin, with `publishable:false`, manifest
> `758a67e0fedda16392c5f1e0230c57dd0bc32c38aaab612abb816484afcaad02`,
> content `98f1a6dcfb98be7e64269ed53323539ba185035571078eff2289accf43f9e2c0`, tree
> `435c363e3e049f353e74ce71ed2a5fb4e3514c69`. That source remains prior #206 evidence;
> both it and clean `6554b2b` remain prior evidence; clean `307b8aaf` is current local
> #208 executable evidence. No host/human/Ready/
> merge/release/deploy/version authority follows.

**STATUS:** legacy sections match `main.js` + the html + `tools/` as of 2026-08-12; the
v2 overlay matches `port/v2` as of 2026-08-15. The addenda at the end preserve
**THE ART-HOLD LAW** (v1.8.5), **THE TRAINING LAYOUT CONTRACT** (v1.8.6), and
its part two (v1.8.7): nothing expensive may be synthesised behind a blocking
full-screen surface, and any surface raised over training must clear the lesson
card through `--tut-bot` while also preserving its dock clearance.
**Purpose:** the mobile-first presentation layer — the unified topbar, the one-panel-at-
a-time manager, the "fold language", the vista box, the cards, and the platform caps —
plus the headless layout gate that guards them.

> **2026-08-10 v2 correction:** the Pixi slice now enforces the same mobile heat
> law as the legacy build: coarse-pointer/touch devices cap renderer DPR at 2,
> desktop at 3. Static species portraits are deterministic Canvas images in DOM
> cards; Pixi living actors/mesh animation remain future work. The reset's staged
> graphics path is anatomy/lineage continuity first, an explicit resolution-aware
> portrait seam second, a bounded Pixi living-preview proof third, and a later
> mesh/skeletal production pipeline only after those gates. Pixi filters cannot
> repair a wrong silhouette or disconnected anatomy. See
> `port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`.

> **B15–15.5 LANDING VISTAS (render-only, fp 50/50):** two dedicated sub-surface scenes now route from
> `showVistaBox` — `_hdReefScene` (Coral-Shallows → bright reef: caustics, coral colonies, fish schools,
> in-column creatures) and `_hdAbyssScene` (the deep; now draws the world's ACTUAL genes as pressure-dark
> silhouettes). Both draw fauna ONLY when genes are supplied → an empty vista carries zero fauna. Global
> hero SCALE clamp 1.4 + stronger `_hdPlaceBeast` ground-contact/occlusion. `_hdBiomeDress` gained/
> strengthened cases: jungle canopy · canyon vertical walls · glass shards · saltflat(cracks) vs
> saltpan(brine) · rocky cluster (geode amethyst crystals, cratered rings, carbon spires). ICE/GREY/HAZE
> worlds now PLACE creatures (they were skipped by the land block). Gas giants (`_hdDeckScene`) carry
> native AERIAL life (Earth life unsupported). Coverage sheets: `tools/sheets/biome-coverage.js`
> (MODE=earth|proc, EMPTY=1); integrity gate: `tools/biome-audit.js`.
**Source of truth:** this doc is the DESIGN spec; `main.js` + `tools/` implement
the legacy sections, and `port/v2` implements the dated port overlay.

## 1. Overview
Primary device is **iPhone** (CLAUDE.md rule 10). The whole chrome hangs off a single
unified topbar whose height is measured, not guessed, and published as CSS custom
properties so every surface aligns. Panels obey one law — opening one closes the rest, a
corner ✕ closes it, a tap on empty space closes it — while true modals (fights, prompts)
stand apart. jsdom runs logic but does NO layout, so a dedicated CDP gate
(`tools/uilayout.js`) drives the resolved Chromium-family browser through the shared owned
launcher across 10 viewports to catch the bugs the
logic battery is blind to by construction.

## 2. Rules & mechanics

### Unified topbar & height sync
- `resize()` (main.js 107–118) sets `DPR = Math.min(window.devicePixelRatio||1,
  TOUCH?2:3)` then calls `syncTopbarH()`.
- `syncTopbarH()` (119–128) writes two CSS vars on `:root`:
  - **`--topbar-h`** = the topbar's measured `offsetHeight`.
  - **`--row1-h`** = the bottom of `#bellwrap` (row 1: search + bell), so the right rail
    (Prime Codex / Compendium / Star Atlas) hangs from row 1, not the whole bar.
- Re-synced on `resize`, `load`, `orientationchange` (twice, +250 ms), and via a
  `ResizeObserver` on `#topbar` (129–133). Renders that change the bar's height also
  call it (e.g. 9851).

### Panels + the sticky ✕ (the one panel law)
The panel manager (`@section` at ~16019, `PANELS` 16027–16050) lists every dismissible
surface with `{id, el, btn, x, open, close}`:
- **Rail panels (`x:1`, get a ✕):** `log` (Star Atlas), `codex` (Compendium),
  `charters`, `events`, `sheet` (character screen), `yard` (Shipyard), `records`.
- **Header panels (`x:0`):** `tray` (bell), `set` (settings), `guide`, `prime`
  (Prime Codex).
- **`closePanels(except)`** (16051–16053) — the "open one closes the rest" enforcer.
- **Tap-empty-to-close** — a document `pointerdown` handler (16056–16069) closes any open
  panel unless the tap is inside the panel, on its rail button, on a `MODAL_SEL` element,
  or during training (`!tutDone` bails; the tutorial keeps its own locks).
- **The corner ✕** — one delegated `click` handler (16070–16076) on `[data-pnx]`. Buttons
  are built by `_mkPnx(id)` (16079) and seated **first + sticky** by a `MutationObserver`
  per rail panel (16085–16093), so the ✕ rides the top even as the list under it scrolls,
  and re-seats itself after any innerHTML rebuild. Seating waits for `tutDone`.

### The "fold language" (word-pills, not arrows)
Detail groups collapse behind an **expand/close word-pill** rather than a chevron arrow.
The `.chev` pill's CSS `::after` content is literally the word **`expand`** when closed
and **`close`** when open (celestial-frontier.html 853–854). Folds:
- Toggled by `[data-gtoggle]` / `[data-lifetoggle]` headers (main.js 7971, 7985, 8307–
  8329); the class `.grp.open` reveals `.gbody`.
- Remembered in the **`cardExpand` bitmask** (declared 7375; saved as `cx`): **bit 1 =
  Environment**, **bit 2 = census/civ**, **bit 4 = specimen field notes (reveal card)**.
- Toggle happens **in place, no rebuild** — so keyboard focus stays put — and it marks
  `_panelDirty` to remeasure (an expanded card that isn't remeasured hangs off the bottom
  of the screen unscrollable, a fixed regression). The panel-key's `|cx…` suffix is
  patched to match, then `queueSave()`.

### Smooth zoom (navigation)
- **`zoomAt()`** wheel / double-tap now accumulate onto a TARGET and ease toward it each frame
  (`_stepZoomGlide`, factor 0.32), cursor-anchored, so a discrete mouse-wheel notch glides
  instead of snapping across the universe / galaxy / system scales. Pinch and programmatic
  zooms stay immediate; Motion:Reduced zooms instantly (glide gated on `motionOK()`); a pan /
  pinch / mode-change cancels an in-flight glide; the step runs **before** `checkTransitions`
  so mode-change thresholds read the eased z.

### The vista box (landing picture)
- **`showVistaBox(P, tod, wx, era, genes, aurora, flora, climSnow, water, xtra)`**
  (7274) paints the landing scene onto a canvas (`_hdDeckScene` for gas giants, surface
  scenes otherwise), mounts it via `_vistaMount(head, cv, vtTxt)`, and shows
  `#vistabox` with a `requestAnimationFrame`→`classList.add('on')` fade (guarded by
  `_vistaShowSeq`).
- **Tap-to-continue** — the caption reads `'local <tod> — tap to continue'`. State is
  cached in `_lastVista`; `reshowVista()` re-opens it, and the card's `[data-act="vista"]`
  button rebuilds it from `_lastDesc` in a fresh session.
- **Tap-to-zoom** (`#vistabox.zoom`) — in live play, tapping the vista canvas zooms it
  full-screen; ✕ or the backdrop closes the zoom. During training the tap keeps its
  tap-to-continue meaning.
- **Full-screen button** — the vista card now carries a visible "⛶ Full screen" pill (in a
  `.vrow` beside "⇪ Save postcard") that adds `#vistabox.zoom`; tapping the image still zooms
  too. Semantics: while zoomed, tapping ANYWHERE steps back OUT to the windowed card (never
  dismisses); only the ✕ closes everything; training keeps tap-to-continue (the pill is inert
  until `tutDone`).

### Cards
- **World / survey panel** (`#panel`, `@section` at ~7364) — the object card with the
  folds above; the Life-forms roster and 🐾 Tame / 🌿 Scavenge actions live inside the
  Life fold.
- **Reveal card** (`#reveal`) — new-species reveal; its field-notes fold (`#rev-fold`,
  `cx` bit 4) opens straight to the roster; reading inside it never dismisses the card.
- **Item card** (`#itemcard`, created 13747) — the loot/gear detail popover.
- **Character sheet / paperdoll** (`#sheetcard`, opened by tapping `#rank`,
  `open`/`close` via `openSheet`/`closeSheet` 16303) — a centered Diablo-style home:
  full-length painterly explorer (`paperdollAvatar()` 10945, `DOLL_ANCHORS`) with nine
  gear sockets pinned to the body, stats column, and Cargo/Fabricator/Research beneath.
  Phones stack paperdoll → stats → hold. The Shipyard (`#yardcard`, `openYard`/
  `closeYard` 13884) and Records board are their own surfaces (v1.5.2 split).

### Rail buttons
`#chbtn` Charters · `#codexbtn` Compendium · `#logbtn` Star Atlas · `#recbtn` Records ·
`#cargobtn` Shipyard · `#pcdxbtn` Prime Codex · `#bell`/`#bellwrap` notification tray ·
`#setbtn` Settings · `#helpbtn` Guide · `#rank` character screen. (Naming per CLAUDE.md
rule 9: the catalogue is "Compendium"; "Prime Codex"/"Cosmic Codex" keep "Codex".)

### `MODAL_SEL` + escape handling
- **`MODAL_SEL`** (16055) = `#reveal,#pickbox,#duelbox,#sharebox,#namebox,#platebox,
  #itemcard,#deathbox,#endingbox,#relbox,#tutbox,#helppop,#vistabox,#toasts,#descbox` —
  true modals the panel manager never auto-closes (a stray tap must never eat a fight).
- **Escape** (keydown 2765–2798) closes one dismissible overlay per press, in priority
  order: rename dialog (but the *initial* name prompt insists on a name), descent-confirm
  (`Escape` = stay in orbit), then the first visible of
  `reveal,pickbox,duelbox,sharebox,itemcard,platebox,primebox,guidebox,setpanel`, then the
  character sheet. During training (`!tutDone`) Escape bails so the lesson keeps its
  modals. The search box has its own Escape (10512); a tooltip closes on Escape (12524).

### Mobile-first rules
- **DPR caps:** `Math.min(dpr, TOUCH ? 2 : 3)` — phones cap at 2 (v1.2 heat pass:
  iPhones report DPR 3 = 2.25× the pixels for barely-visible sharpness and the biggest
  GPU/heat cost), desktop keeps 3 (main.js 112).
- **Notification tray cap 60** — trimmed on push (`notifications.length=60`, 9576) and on
  load (`<60` guard, 10212); 50 persisted to save.
- **Art cache cap 1,200** — `speciesArtCache.size>1200` evicts oldest (1900); portrait/
  icon masters render at 144px so a 50px tile stays crisp at DPR 3.
- **Thumb cache cap 500** — a second bounded cache: `thumbCache` is capped at **500**
  via `_thumbSet` (distinct from the 1,200 `speciesArtCache` cap).

## 3. Key names & numbers (REAL values)
- CSS vars: **`--topbar-h`**, **`--row1-h`** (set by `syncTopbarH`).
- DPR cap: **2** touch / **3** desktop. Notification cap: **60** (50 saved). Art cache
  cap: **1,200**; thumb cache cap: **500** (`_thumbSet`). Icon/portrait master: **144px**.
- `PANELS`: 11 surfaces (7 rail with ✕, 4 header). `MODAL_SEL`: 15 modal ids.
- Layout gate: **10 viewports** (see §6).

## 4. Data / save fields
UI presentation persists via settings fields (full list in SAVE_SYSTEM.md): `tips`
(tooltips), `vol` (`sfxVol*100`), `rm` (`motionMode`), `cx` (`cardExpand` fold bitmask —
bit1 Environment, bit2 census, bit4 field notes), plus `fs`/`tone`/`font`/`snd`/`fx`/
`chart`/`shake`/`notif` toggles and `view` (last camera). Panel open/closed state,
sticky-pick, and vista state are **transient** (not saved). Absent-field defaults:
`tips`⇒on, `cx`⇒0 (collapsed), `rm`⇒Auto, `vol`⇒full (SAVE_SYSTEM.md §2).

## 5. Determinism (how this system interacts with the fingerprint)
The UI layer is entirely `[app]` — it may use `Date.now()`, `devicePixelRatio`, DOM
state, and wall-clock freely because none of it feeds world/genome/descriptor
generation. It reads the deterministic core (portraits from `hdGenesFor`, cards from
descriptors) but never seeds it, so no UI change touches the fingerprint. Portrait art
IS pinned (via the `speciesPortrait`→`hdGenesFor` probe), so changing the genome→visual
contract is the one UI-adjacent path that needs a re-pin — see DETERMINISM.md.

## 6. Code anchors
- Topbar / DPR — main.js viewport `@section` **102–133** (`resize` 107, `syncTopbarH`
  119, DPR cap 112).
- Panel manager — `@section` at **~16019**; `PANELS` 16027, `closePanels` 16051,
  tap-close 16056, ✕ delegate 16070, `_mkPnx` 16079, sticky seat 16085.
- `MODAL_SEL` 16055; Escape handler 2765–2798.
- Fold language — CSS `.chev::after` celestial-frontier.html **853–854**; JS folds
  7971 / 7985 / 8307–8329; `cardExpand` decl 7375.
- Vista — `showVistaBox` **7274**; reshow via `[data-act="vista"]` 8298.
- Cards — `#itemcard` 13747; character sheet `openSheet`/`closeSheet` 16303/16329,
  `renderDoll`/`paperdollAvatar` 10945; Shipyard `closeYard` 13884; reveal fold 8878.
- Caps — notification 9576 / 10212; art cache 1900; 144px masters 14151.
- Layout gate — **`tools/uilayout.js`**: VIEWPORTS list (10): iphone-se, iphone,
  iphone-max, android, ipad-port, ipad-mini, ipad-land, laptop, desktop, wide;
  SURFACES 41–50; laws = ✕ corner, z-order, no side-scroll, no clipped text; drives real
  Chromium through the shared owned CDP launcher; proof sheets to `tools/uisheets/`;
  ignored atomic `celestial-frontier/uilayout-report@2` retains the legacy result rows
  plus exact run/browser/terminal status; full PASS binds all 787
  viewport/surface/name keys to `port/baseline-v1.8.9/uilayout-report.json`, while
  `--vp` remains diagnostic scope; `--selftest` and `--verify-run=ID` fail closed;
  exit 1 on product FAIL and 2 on instrument failure.

## 7. Open questions / pending
- `ROADMAP.md` shows ongoing device-pass / overlay-eater work — the layout gate exists
  precisely because jsdom can't see layout; keep adding surfaces to `SURFACES` as new
  panels ship.
- The fold bitmask has 3 bits defined (1/2/4); `cx` is clamped 0–7 on load, leaving room
  for future folds without a save-shape change.

## 2026-07-24 additions (v1.7 polish arc — verified in main.js)
- **THE BOTTOM DOCK** (Nick picked Proposal A): the five rail pills (Prime Codex / Star
  Atlas / Compendium / Shipyard / Records) are a bottom-center dock — same element ids,
  slot-centered via translateX; phone (<=520px) folds labels (.lbl) into icon+count chips.
  Hint bar, ?/⚙ and bottom-pinned training cards step above it (safe-area aware).
- **Chips**: #pinchip (pinned Fabricator recipe — live missing-materials, green READY,
  tap → Shipyard) under the charter button; #chchip (first accepted charter progress,
  tap → board) beneath it. Both hide when idle/in-training.
- **WINDOWED CINEMATIC**: the reveal core is a solid glass card (tier-colored border/glow,
  rays behind). The breed reveal shows the newborn's portrait (speciesPortrait).
- **ADVANCED BRIEFINGS**: a 🎓 row atop the Guide menu (post-training) launches five
  zero-lockdown walkthrough drills (Hold / Forge / Prospecting / Stars / Discovery) —
  tutorial visuals via #tutbox/#tutspot, direct rect spotlighting, smoke-driven.
- **Records board**: the EXPEDITION JOURNAL strip (last 12 landings — world · rolled
  region · date) above the statistics ledger.
- **QoL slate shipped**: NEW-entry dots in the Compendium (.newdot until card viewed) ·
  Atlas quick-filters (🏴 settled / ❋ life) · batch craft ×5 on parts/comps · bulk feed
  ('Mend — safest meals', halts on first toxic bite) · salvage UNDO (6s toast window) ·
  sticky hold tab · dynamic ❤ heal-hint tooltip.
- **Training**: feed/breed steps bottom-pinned (rail-block fix); the horizon step teaches
  the GUARDIANS (how signatures/titans work); the finale spotlights the charter board.
- All '(right rail)' copy now reads '(bottom dock)'.

## 2026-07-25 THE ONE-BAR LANGUAGE (v1.7 UI pass — matches code as of 2026-07-25)
- **THE SHELF** (topbar): ONE row on desktop — nameplate · HP pill (inline, flex 160-340px) ·
  search · bell; `--topbar-h` shrinks and every rail offset gains the row back. Phones keep
  the two-row stack (HP full-width row 2). Trail hidden as before.
- **THE DOCK** (bottom): ⚙ Settings and ? Guide now FLANK the five pills — desktop at ±330
  translateX slots, phones as fixed edge bookends (left:10/right:10 — fits any width).
  Same element ids everywhere: training spotlights, TUT_ALWAYS lockdown, and smoke targets
  unchanged. Dock reads: ⚙ | Prime Codex · Star Atlas · Compendium · Shipyard · Records | ?
- **TEXT SYNC**: 5 stale position refs updated to the dock era (charters "top left, under
  the shelf"; ⚙ "bottom dock, left edge"; Prime Codex + ? Guide "bottom dock"; shipyard
  comment). Training's focus lockdown verified end-to-end (smoke drives all 21 steps).
- **PROOF RIG**: `tools/uishot.js` — headless-Edge UI screenshots via an exactly-sized
  IFRAME (window-size is unreliable under Windows display scaling; the iframe gives a true
  CSS viewport). Seeds a veteran save (`{me, tut:1, rn:GAME_VERSION}`) so the live UI boots
  without intro/release popups. 13 shots: main/settings/charters/compendium/atlas/records/
  prime/guide × desktop+phone.

## 2026-07-25 FINAL LAYOUT — UI v8→v11 (matches code as of 2026-07-25, Nick-directed)
The settled cross-device layout after Nick's iteration rounds 8–11:

**DESKTOP / TABLET (≥701px)**
- ✦ **Prime Codex** — the VERY top, centered in the shelf line (keeps its 0/9 count — the only
  button that keeps a count).
- **Left stack** under the topbar: 📜 Charters over 📖 Compendium (equal pill metrics, uniform pitch).
- **Right stack**: 🌍 Star Atlas over 🛠 Shipyard. SEARCH RESULTS open in their own fixed lane
  BELOW the stack (typing never covers the pills).
- **Bottom-right corner**, evenly pitched 42px, all CIRCLES, order: 🏆 Records · 🔔 Notifications ·
  ? Guide · ⚙ Settings. Records is trophy-only (no label). Corner panels rise from their buttons;
  the SETTINGS panel centers between Prime and the caption; every bottom dialog opens ABOVE the
  caption text lane.

**PHONE (≤700px)** — everything docked, two rows, even slots:
- Row 1 (boards): 📜 Charters · 📖 Compendium · ✦ Prime (0/9) · 🛠 Shipyard · 🌍 Atlas — equal-width
  58px chips, 64px slot pitch.
- Row 2 (utilities): 🏆 Records · 🔔 Notifications · ? Guide · ⚙ Settings — 34-36px circles, 64px pitch.
- Every panel opens as an aligned SHEET above the hover-hint; the guide launcher has its own lane.

**Shared language**: emoji icons everywhere; status dots and counts RETIRED (only Prime keeps 0/9);
SELECTION = a gold-wash HIGHLIGHT on the open board's button (synced from the PANELS registry via
.sel — highlight over growth so spacing never moves); HP bar polished (quarter ticks in the trough,
lit-top depth + bright leading tip on the fill, continuous green→amber→red hue held from before).
Bell is a circle everywhere. `tools/uishot.js` captures 20 canonical screens per run.

**2026-07-25 addendum (Nick's phone-sheet pass)**: on ≤700px the character-sheet paperdoll is
capped at `min(62vw,240px)` (it was eating ~75% of the viewport) so the effects bar, all three
inventory tabs, and the first material families surface without scrolling; sockets hold the 44px
touch floor. Every sheet/panel scrolls internally (`overflow-y:auto` + styled scrollbar) — mouse
wheel and touch drag both work. `tools/uishot.js` now also carries `SEED_FULL`, a populated save
(5 material families + ✦ exceptionals, craftables, mixed-tier loadout worn with affixes) powering
the Shipyard/inventory/paperdoll proof shots — outDir must be ABSOLUTE (headless Edge silently
drops relative screenshot paths).

## 2026-07-28 THE TRAINING STACK LAW (v1.8.3 — matches code as of 2026-07-28)

**The law: during training, the surface the CURRENT lesson points at is the top surface.**
Nothing else is raised, and nothing is raised for the whole of training.

### Why a static z-index cannot work
Training has two opposite needs on adjacent steps:
- **Step 5 / 7** ("open the Star Atlas" / "open your Compendium") — the *board* must win, or the
  lesson opens it underneath Earth's survey card and the recruit is stuck with no way through.
- **Step 6** ("press Land on Earth's card") — the *card* must win, or a board still open from
  step 5 buries the button the lesson names.

v1.7.17 answered the second with a blanket `body.training #panel{z-index:58}`, which broke the
first. On desktop nothing collided (the card owns its own column); on a phone every board shares
that column, so the card buried whichever surface the lesson had just asked for. Nick hit it on a
physical iPhone at both steps.

### How it works
`_tutPri()` (main.js, beside `_tutShow`) reads the current step's own `spot` + `allow` selectors
and marks any surface in `TUT_PRI_SURF` — `#panel #log #codex #chpanel #records #vistabox` — with
`.tutpri`. It runs on step change *and* on the spotlight's 200 ms tick, so a board opened
mid-step takes the stack as soon as it exists, and clears every mark when training ends.

Matching is **exact-token**: `#log` must not be lit by a step that only allows `#logbtn`
(`new RegExp(id + '(?![\w-])')`) — the same trap the focus-lockdown token set documents.

### ⚠ The specificity trap (this cost a full gate cycle)
The CSS rule **cannot** be written `body.training .tutpri{z-index:58}`. That scores 0 ids / 2
classes, and every surface it must override declares its layer through an **id**
(`#panel{z-index:9}`, `#codex{z-index:22}`) — **one id outranks any number of classes.** The mark
applied, the class-level tests passed, and the fix did nothing. It is written as an explicit
per-surface list (`body.training #panel.tutpri, body.training #log.tutpri, …`) whose members
mirror `TUT_PRI_SURF`; **change one and change the other.**

### Companions
- `body.training #setpanel{z-index:60}` — Settings is deliberately reachable mid-training
  (it is in `TUT_ALWAYS`), so it must outrank both the lesson card (50) and any raised surface (58).
- `body.training #vistabox{justify-content:flex-start}` + a `--tut-bot` margin on `.vcard` —
  the Planetside joins `#reveal`/`#pickbox`/`#namebox` in yielding *below* the lesson. Putting it
  *above* the card (the intuitive fix) hides the sentence telling you to tap it. `.zoom` is exempt.
- On ≤900px the survey card's `max-height` reserves the bottom dock (126px + safe-area), because
  steps 5 and 7 point at chips down there.

### How it is gated
- **smoke** proves the JS half: at steps 5 / 6 / 8 the right surface carries `.tutpri`, `#logbtn`
  never masquerades as `#log`, and the marks clear at graduation.
- **tools/uilayout.js** proves the half smoke cannot see — a `training` probe on all 10 viewports
  that publishes `--tut-bot` the way `_tutSpot` does, then **hit-tests** (`elementFromPoint`) the
  dock chips, each open board, the card on the LAND step, and Settings › Audio.
  Replayed against the v1.8.2 build with `--url=`, it reproduces the original report on all three
  phone viewports — which is the only reason to trust it.

## 2026-07-29 ROUND 7 ADDENDA — the stack law, extended (v1.8.4)

Three additions to the training-stack law recorded above, all from round 7.

### The specificity trap, confirmed twice in one week

The law's own implementation hit it (`body.training .tutpri` — 0 ids / 2 classes — losing to
`#panel{z-index:9}`), and an external round found the *same* trap in shipped code:

```css
body.training #tutspot{z-index:49}   /* (1,1,1) */
#tutspot.overtop{z-index:59}         /* (1,1,0) — permanently DEAD */
```

`CF1720-07` was declared fixed and verified by a check that asserted the **source string of the
dead rule**. Now `body.training #tutspot.overtop{z-index:59}` — a rule that can actually win.

> **Two rules, both earned:**
> 1. A class-level override cannot govern surfaces that declare their layer through an **id**.
> 2. Never assert a selector's *spelling*. Assert the **law** it implements — a computed
>    comparison, or better, a hit-test.

### Settings outranks the lesson

`body.training #setpanel{z-index:60}` — above the lesson card (50) and above any raised surface
(58). Settings is deliberately reachable during training (`TUT_ALWAYS`), and an external round
measured its Audio tab as unclickable on 4 of 5 viewports. Gated by **clickability**, per viewport,
the way they measured it — not by a z-index assertion.

### The 744px band

`744×1133` is now a permanent layout-gate viewport. An external harness found **no spotlight ring
at all** there at step 5, where every phone and desktop profile rendered one. It sits just under
the 900px dock breakpoint — the dock layout applies but the tablet band's sheet widths do not,
which is exactly the seam a bug hides in. We believe the missing ring was downstream of the stack
bug (`_tutSpot` deliberately draws nothing when its target's centre is covered), and the band
passes now, but it stays in the gate because no one was watching it before.

## 2026-07-29/30 THE ART-HOLD LAW (shipped in v1.8.5 "First Touch" — matches code as of 2026-07-30)

**Nothing expensive may be synthesised behind a blocking full-screen screen.** A surface the
player cannot see is not worth a frame, and on the first run the thing hidden behind it is the
*only* control on screen.

### What was happening

`ThumbArt.getPlanetSprite` and `GalaxyArt.getGalaxySprite` both use the house "instant lo → async
hi" pattern: return a cheap sprite now, schedule the HD master on a short timer (30ms / 45ms).
A brand-new expedition calls `startNewGame()` 120ms into boot, which `goTo()`s Sol and queues one
HD upgrade **per body**, plus the galaxy face. Each HD render is a 300–800ms main-thread block
(`n2` → `fbm` → `renderPlanetSprite` / `makeGalaxySprite`).

Meanwhile `askExplorerName(true)` runs *synchronously* in boot, so the naming screen is in the DOM
before `DOMContentLoaded`. Measured on a 4× CPU-throttled iPhone-class profile
(`tools/bootperf.js`):

| arm | gate painted | gate **answerable** | main thread blocked first |
|---|---|---|---|
| new player (`--save=none`) | 393ms | **6440ms** | 5818ms |
| returning player (`--save=done`) | n/a | n/a | **0ms** |

The gate was painted at 0.4s and would not answer a tap until 6.4s. The returning player, who
never builds a new system, blocked 0ms — which is what named the cause. After the fix: **1905ms**,
and the remainder is V8 compiling the 1.9MB inline script (`(program)` ≈ 2s at 4×), which is the
payload problem the v2.0 port plan owns, not this one.

### The law in code

`_hdLater(fn, ms)` (main.js, top of the game IIFE, just after `@end PlanetGen`) replaces the bare
`setTimeout` at both upgrade sites. While `_introUp()` is true it re-polls at 250ms instead of
rendering.

- **Precedent, not invention.** Toasts already wait on exactly this condition — see the notify
  section's `_toastQ`, *"toasts held while the title / explorer-name screen is up"*. Art now waits
  on the same predicate.
- **Scope.** Defined at game-IIFE top level deliberately: both callers live inside *different*
  nested module IIFEs (`ThumbArt`, `GalaxyArt`), and a helper belongs in the scope of its
  **callers**, not its callees. (The `_denyPress`/`_okPress` ReferenceError was this trap.)
- **A re-poll, not a flush queue.** The hold lifts however the screen closes — commit, cancel or
  Escape — so there is no hook to forget. One pending sprite costs one timer.
- **Determinism-safe by construction.** Sprites derive from seeds, never from *when* they are
  drawn, so deferring one cannot move the fingerprint. Confirmed: MATCH 50/50.

### The gate

`node tools/bootperf.js --save=none --cpu=4 --cpuprofile --assert` fails if art self-time behind
the intro exceeds 900ms. **Why it needs no clock correlation:** in the `--save=none` arm the
harness never types a name, so the intro is up for the whole observed window — art self-time over
the entire CPU profile *is* art time spent behind the intro. Mapping profiler microseconds onto
`performance.now()` is exactly where such a check would otherwise quietly go wrong.

Negative-controlled in both directions against the shipped v1.8.4 build recovered from git:
**3611ms → exit 1** unfixed, **495ms → exit 0** fixed, with the 900ms budget clear of both rather
than hugging either.

### What this cost us to learn about our own gates

The first cut of `bootperf.js` stopped observing the moment the gate went responsive, so a
deliberate 1500ms block injected at 600ms reported **0ms and passed**. A longtask census whose
window closes at TTI is not a census. A second control was equally instructive: a `setTimeout`
block *cannot* preempt the parser, so it ran after the gate had legitimately painted and proved
nothing — only a **synchronous** block placed before the game script manufactures the real defect.
Both controls found bugs in the instrument, not the build. This is the fourth time on this project
that a check has passed while the thing it guarded was broken; it is the first time the check was
a performance gate.

---

## ADDENDUM 2026-07-30 — THE TRAINING LAYOUT CONTRACT (round 8, CF1805-01)

**The rule:** any surface that `_tutPri()` can raise above the lesson card MUST
also join the `--tut-bot` / `--tut-cap` positioning contract. A raise without the
geometry does not reorder two surfaces — it *buries the instruction*.

v1.8.4 fixed the mobile training wall by raising a lesson's own surface to
`z-index:58`. The lesson **card** sits at 50. `#panel` was the only board that had
ever joined the positioning contract, so it renders *below* the card; `#log`,
`#codex`, `#chpanel` and `#records` got the raise and not the geometry, so they
rendered *through* it. On iPad mini at step 8 the card measured **0% reachable,
63/63 sample points blocked by `#codex`** — the instruction and its Skip button both
invisible, with no way forward. The fleet saw the same wall from the player's side:
once steps 5 and 7 were cleared, stalls at step 8 went **8 → 29**.

Two things make this contract work, and both are easy to get wrong:

**`--tut-bot` already encodes both card positions.** `_tutSpot()` publishes the free
band: card at the top → the band *below* it; card dodged to the bottom → the band
*above* it. So one rule (`top: var(--tut-bot)`, `max-height: var(--tut-cap)`) keeps a
raised board clear either way. There is no need to branch on the card's side.

**`bottom` and `min-height` must be released explicitly.** Under
`@media (max-width:900px)` those four boards are pinned `top:auto !important` with a
`min-height`, and in CSS **`min-height` beats `max-height`**. A `top:`-only rule
would have been present, correct and completely inert — this project's signature
failure mode, and the reason `uilayout.js` exists.

**The gate.** `uilayout.js` now measures the card's reachability on a 63-point grid
against each of the four surfaces, in **both** card positions, across 10 viewports.

⚠ The first version of that gate measured only the top-pinned card and came back
**clean on the exact case the round reported**, because a top-pinned card and a
bottom-anchored board never share a band on a tablet. Their card had dodged. Adding
the dodge pass reproduced their measurement verbatim. *Reproduce the reported
geometry, not a convenient one.*

---

## ADDENDUM 2026-07-31 — the training layout contract, part two (round 9, CF1806-02)

The contract added in v1.8.6 (previous addendum) was right about the geometry and **dropped the
reason those boards were pinned in the first place**.

Under `@media (max-width:900px)`, `#log`/`#codex`/`#chpanel`/`#records` are pinned
`bottom: calc(142px + env(safe-area-inset-bottom,0px))` **to clear the bottom dock**. The v1.8.6
rule released `bottom` — correctly, so the board could sit in the free band — and then reserved a
flat **24px**, so the board grew straight down over the dock instead. Measured with `#chpanel`
raised (the state training step 20 `charter-first` creates):

| device | dock reachability |
|---|---|
| iPhone SE (667) | **0%** — all six controls buried |
| Galaxy S8 (740) | **0%** — all six |
| iPhone 14 Pro (852) | 19% row 1 · 94% row 2 |
| iPad mini (1133) | 95% — clear |

`#panel` — the one board that had joined this contract before — has carried the allowance since
2026-07-28: `126px + env(safe-area-inset-bottom)`. **A new rule must inherit the constraints of
the sibling it is modelled on, not just its selector shape.**

**The fix is a variable, not a second rule.** `--tut-dock` is `126px` below the breakpoint and
`24px` above it, and the `.tutpri` rule reads it. That shape was chosen after the obvious one
failed: the first attempt added a *duplicate* `max-height` inside the media block, which sits
**earlier** in the sheet than the `.tutpri` rule at ~1876 and has **equal specificity**, so it
lost and changed nothing. Both rules were `!important`; both were mine.

> **Two CSS laws, earned one release apart, both about a rule that was present and inert:**
> `min-height` beats `max-height` (v1.8.6), and **an equal-specificity override that appears
> earlier in the sheet loses** (v1.8.7). Neither is exotic; both cost a release.

**The gate.** `uilayout.js` now asserts, on every viewport at or below the 900px breakpoint and
for each of the four raisable boards, that **every dock control is the topmost element at its own
coordinates** — not merely that the lesson card survives. The card-only pass added in v1.8.6 is
why CF1805-01 is genuinely fixed and is also exactly why this was missed: the card was fine
throughout; it was everything *below* the board that was not.

⚠ The new pass needed three corrections before it measured anything real — a key collision that
silently clobbered an existing check, **empty** boards that collapse under `min-height:0` and never
reach the dock, and stale `--tut-bot` left over from the dodge pass. In its first two forms it
passed on the shipped build the external round had already proven broken. *Reproduce the reported
geometry, populate the surface, and control against the broken build — every time.*
