# Celestial Frontier — Codebase Reference (legacy v1 + current v2 reset overlay)

> A complete technical reference for the game, written so any future session can pick up
> full context without re-reading the source. When in doubt, source wins. The long-form
> sections below mirror the legacy v1 architecture; dated overlays record current port/v2
> boundaries until the port replaces those sections completely.
> **Current port/v2 overlay matches code and live handoff as of 2026-08-12.**
>
> **2026-08-11 v2 integration/hardening overlay:** PR #10 merged the Platinum
> repair into `develop` at `61cc058`. The current bounded port candidate makes the app
> TypeScript configuration and v2 browser gates part of CI; narrows the DOM
> compatibility waiver; hardens SessionRNG; protects sparse/corrupt/future saves
> and IndexedDB retries; bounds cosmic epoch; preserves complete Atlas star
> coordinates; contains malformed Compendium rows; prevents repeat landfall,
> stale-card and direct-code landing outcomes; round-trips accepted custom planet
> names; repairs lazy species-art subscription; and gives phone lower chrome a
> measured 4×2 non-overlap contract. The slice still stores one exported save
> blob, `NavState` is not yet a discriminated union, complete CF1 hierarchy and
> legacy full-state `tsnap` restoration remain open, and CFB still loses hybrid
> parents. Runtime priorities are Compendium virtualization, scene texture
> ownership/memory proof, live HD planet replacement, clock/visibility policy,
> then living organism rigs and biome scenes. Platinum-approved static portraits
> remain frozen; optional polish is not a mandate to repaint them.
>
> **2026-08-12 root browser-harness overlay:** legacy `tools/uilayout.js` now
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
> resolver and `ws` transport but retains its legacy CDP lifecycle.
>
> The live v2 interaction surface uses Pixi `autoDensity` so its CSS canvas and
> hit coordinates stay viewport-sized at DPR > 1. `effectiveDpr()` follows the
> touch-2 / desktop-3 heat caps and a 16,777,216-pixel backing-store ceiling,
> then resynchronizes renderer/backdrop density after viewport changes. Survey
> cards expose minimum-44px **Enter galaxy / Enter system** actions, and touch
> Planetside has a minimum-44px **Leave world** action. The eighth dock slot opens
> the canonical **Guide to the Universe**: `guide-content.ts` carries a
> source-addressed v1.8.9 snapshot of all 9 categories /43 authored stable ids /41
> legacy-live topics, category browsing, search and `data-gt` cross-links. A
> capability table supplies current copy for partial systems and explicit
> unavailable copy for unported mechanics; dormant `beacon` / `events` remain
> retained but hidden. `release-content.ts` similarly preserves all 56 legacy
> releases /398 bullets and keeps an unversioned v2 development draft separate;
> `V2_CURRENT_RELEASE_VERSION` is `null`, so it cannot trigger an update or imply
> a bump. First Guide open persists `seenGuide`. Import moved to **Settings →
> Bring expedition** through the same guarded loader and a named, focus-trapped
> top-layer modal. The live primary is parsed from the whitespace-trimmed JSON
> candidate, while the best-effort `cf_v2_import_original` keepsake retains the
> exact submitted text; a selected file is browser-decoded to text, so the
> moderator-held external file remains the byte-for-byte authority. Planet cards bind the captured galaxy+star `{seed,x,y}` context
> before Land/Atlas/Share, rejecting equal-seed coordinate substitution.
> Guide and Settings render above an open survey card; other panel stacking
> remains unchanged for Training. Field Training is six live
> chart/travel/landing lessons plus an honest graduation. Tooltip deep-links,
> Advanced Briefings, the full 21-step curriculum and full legacy `tsnap`
> restoration remain OPEN. Lazy species art uses one shared load Promise
> and one latest subscriber per view, so prefetch cannot strand Compendium or
> Planetside and a 1,500-row list cannot retain 1,500 rerender callbacks.
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
> The matrix import fixture is witnessed as three observable phases rather than
> a blind reload delay. Sticky CDP event receipts—not a serial polling command—
> bind the explicit import to its old document token, default top execution
> context and top-frame loader; allow 20 seconds for exactly one valid
> `cf-v2-reload-release/v1` witness; allow 5 seconds from that receipt for a
> top-frame commit with a changed loader; and only then start the replacement
> document's independent 20-second boot budget. `replacementNavigationOutcome()`,
> `importReleaseOutcome()` and `replacementReadyOutcome()` validate receipt time,
> exact target session, default top-frame context identity/generation/origin,
> expected URL, changed loader and changed document token. Old-context/global loss
> alone is not navigation or boot evidence. The replacement emits the optional
> `cf-v2-slice-ready/v1` tail binding after load, complete slice/input wiring,
> persistence readiness, the first ticker turn, an animation frame and a later
> task. One phase-owned, at-most-2-second `Runtime.evaluate` then confirms that
> exact ready context; `browsercdp.send()` permits a shorter per-command timeout
> but never one above its connection-wide ceiling. Its browser-native
> `performanceNow` must also be strictly below 20 seconds; an exact-boundary
> control fails, preventing Node observer descheduling from laundering a late
> product boot. The tail binding witnesses
> boot publication plus a serviced event-loop turn, not the separate 50 ms
> answerability metric. `replacement-document-loader-token-phase` and
> `reload-resource-release` negative-control same-loader token mutation, lost/
> rejected phases, wrong/duplicate/malformed session-context-loader-token events,
> stalled or just-late transitions, retained canvases, unreleased renderer and
> over-budget backing pixels. Sticky fatal Page/Runtime/Inspector/Network events
> remain authoritative even when the bounded diagnostic ring rolls over; the
> command never retries a red run.
>
> `scheduleReplacementReload()` is the product half of that contract. All three
> intentional replacement transitions—Training restart after `persistView()`,
> accepted `importBlob()` after `repo.write()`, and the storage retry after real
> bytes reappear—first claim one mutually exclusive replacement transaction, then
> stop ordinary persistence and call the boot-installed
> `releaseRendererForReload()`, and cross one task boundary before
> `location.reload()`. The release hook removes renderer-density listeners,
> destroys Pixi with global/child texture resources, detaches `app.canvas`, and
> collapses both it and `activeBackdropCanvas` to at most 1×1. It optionally emits
> the release witness through a CDP `Runtime.addBinding` seam before the execution
> context dies. This path is deliberately not registered on generic `pagehide`:
> a browser-cache restoration must not revive a destroyed Pixi application.
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
> Immutable executable evidence source `20896ad410b48ae0c407a9f3d6885d30ec6657b1`
> passed its complete exact battery: root preflight selftest/preflight (only the
> expected Edge 151 versus pinned Edge 150 warning), validate/fingerprint and smoke;
> final `exact-20896ad-root-layout` 787/787 across 10/10 viewports and exact
> verification; rarity 60M/0 downgrades; dead-code 3 tooling references; v2 24
> files / 273 tests / 1 skip plus every gate/selftest; one-attempt smoke 0 findings /
> 10 screenshots; and committed/certifying glass 12/12 viewports, 50/50 controls,
> `omitted=[]`, 0 findings/instrument failures/retries with working-tree digest
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
> All 12 reload witnesses passed; desktop-8k proved both 5,461×3,072 canvases →1×1,
> renderer/stage released, view detached, release→commit 31 ms, commit→ready
> 148 ms, `performanceNow` 177 ms, confirmation 1 ms and total 212 ms. All viewport
> totals were 170–212 ms; maximum browser-native time was 177 ms. Nine automated
> personas passed. The terminal-only 4× diagnostic was 586/666/77/151 ms
> (painted/answerable/press→panel/rebuild). Exact 37-file preview
> `dev-preview-exact-20896ad` verified and browser-smoked PASS at 320×568 for expected origin
> `https://dev-celestialfrontier.github.io`, content
> `3a2e5285184cf392a10916270f5d3d449d72d78bb6afb0b6bd29d45d6b1a6b50`,
> `publishable:false`. Prior #201 and #202 remain preserved red without retry.
> `20896ad` underlies a docs-only handoff tip; exact tip/upstream/check state is read
> live, and the final pushed tip requires matching green CI. The
> artifact is origin-bound but not authorized for hosting or
> publication; human playtest, Ready and merge authority remain open.
> Development preview origin/package requirements live in
> `port/DEVELOPMENT_PREVIEW.md`; they do not constitute a release or deployment.
>
> **v1.6 additions not yet folded into the sections below** (see ART_DIRECTION / PROCEDURAL_CHARACTERISTICS /
> UI_PRESENTATION / SPECIES_AND_GENOME for detail): the Earth-bestiary rig system (`_rig*` per class) +
> `hdGenesFor` procedural phenotype resolver + `hdBeastBare` structural-skin/limb/tail/habitat-preserve
> passes; landing sub-surface scenes **`_hdReefScene`** (coral) and `_hdAbyssScene` (deep), routed from
> `showVistaBox`; `_hdBiomeDress` biome cases. New verification tools: `tools/render-audit.js`,
> `tools/rig-audit.js` (193 sentinels), **`tools/biome-audit.js`** (biome-layer integrity), and proof
> sheets `tools/sheets/biome-coverage.js` (MODE=earth|proc, EMPTY=1), `proc-skins.js`, `proc-aqua.js`,
> `b15-butterfly.js`.

> **2026-08-10 port/v2 full-catalogue reset overlay:** PixiJS owns the live
> galaxy/world scene in `port/v2/apps/game/src/main.ts`; deterministic organism
> anatomy is still generated by Canvas2D painters through
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
| `HARVEST_CD` | 3600e3 | 1-hour stardust-harvest cooldown (ms) |
| `SAVE_KEY` | `'cfcc_save_v2'` | localStorage key (v1.5 fresh start; v1 read once for the farewell, then removed) |
| Earth | planet seed **133** | home world, conquered from game start |

---

## 4. World generation

- **Galaxies:** `galaxiesInCell`, `galaxyProfile`, `galaxyName`, `makeGalaxySprite`,
  `slimGal`. Special objects: quasars, wormholes (`galaxyWormhole`), supernova sites
  (`supernovaSites`), dwarf galaxies, CMB backdrop.
- **Stars:** `starsInCell`, `starName`, `starClass`/`spectral` (real spectral classes
  M/K/G/F/A/B/O, plus remnants: white dwarf, neutron star, magnetar, red giant, brown
  dwarf, black hole). `starDescriptor`, `supernovaDescriptor`, `protostarDescriptor`.
- **Planets:** `planetParams(seed)` returns a `P` object with `type` (lava/venus/ice/
  ocean/desert/gas/rocky/terran…), `sizeMul`, `hue`, `ring`, `moons`, plus type-specific
  fields. `planetDescriptor` builds the survey card text (atmosphere, climate, water,
  gravity, magnetism, seasons, weather — all deterministic helper fns).
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
`speciesPortrait(g)` renders per-kingdom SVG art (microbe = cell cluster, flora =
stalk+fronds+bloom, fungi = mushrooms, fauna = assembled anatomy). Cached in
`speciesArtCache` (**capped at 1,200** with eviction). Reveal cards show a **biome-colored
glow** behind the portrait (ability-theme color for fauna, nourished-stat color for flora).

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
is the single player-facing clamp. Spectral art designations may still combine an
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
- **Harvesting** conquered worlds (`doHarvest`, 1-hour cooldown via `HARVEST_CD`).
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

### Key panels / modals (and their elements)
| Element id | What |
|---|---|
| `#panel` | Survey card (scrollable; bookmark row; conquer/share buttons; "locked" pin hint at top-left). |
| `#sheet` / `#sheetcard` | **v1.5 THE CHARACTER SCREEN** — centered overlay (z 24) holding three regions: `#sheetstats` (contains `#stats`), `#doll` (full-body `paperdollAvatar()` + 9 sockets absolutely positioned via `DOLL_ANCHORS` + ship thumb + picker + effect readout), `#sheetcargo` (contains `#cargo`). `openSheet(view)`/`closeSheet()`; `statsOpen`/`cargoOpen` mirror `sheetOpen` for legacy callers. One PANELS entry (`id:'sheet'`, btns `#rank,#cargobtn`); ✕ seated on open. Mobile stacks doll → stats → cargo. |
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
  `tests/guide-release.test.ts`. `getGuideCatalogue` defaults to 41 player topics
  (dormant hidden, unavailable retained with honest copy); `getGuideTopic` and
  `searchGuide` keep stable ids, search and live cross-links. `fillGuide` /
  `renderGuideMenu` / `renderGuideCategory` / `renderGuideTopic` /
  `renderGuideSearch` own the panel. `getReleaseHistory({includeDraft:true})`
  supplies the unversioned v2 development entry followed by the 56 legacy
  releases. `getCurrentV2Release()` returns nothing while
  `V2_CURRENT_RELEASE_VERSION === null`; `showUnseenV2Release()` therefore
  cannot mutate `rnSeen` or open an update until an authorized shipped v2 entry
  exists. This ports the data model, browsing and cumulative-history door; v2
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
  restores a snapshot (stats counters, pstats, achievements, essence), removes
  every species catalogued during training, refills HP, and guarantees Earth
  charted + home (`_tutEnsureEarth`). Skippable with confirm; `tutAbort()` on
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
- **Performance:** art cache capped (1,200); DPR capped (3); notifications capped (60);
  survey panel rebuilds only on content change; frame loop has error recovery; FX
  particles & event timers are cleaned up.

---

## 12. Test suites (all must pass)

The original v1.0 assertion suites (`phaseAtest` … `finaltest`, `esc_check`) were lost
with the previous working environment. They are superseded by `tools/validate.js`
(see §2 and `tools/README.md`): syntax check, CSS brace balance, duplicate-id check,
version consistency, class→rig binding, colour atlas, biome profiles, render audit,
domain-determinism grep, headless jsdom boot with zero errors, and a **50-probe**
fingerprint over the deterministic core (world-gen, descriptors, genomes, duels,
share codes) that must match the v1.0 baseline byte for byte.

**The primary battery is now NINE suites, not one** (four gate every batch and
`deploy.js` enforces them; the last five are run on demand):

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
  five `EQ_SLOTS` on the character sheet, `partIcon()` painterly icons.
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
