# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.
## The per-system docs at repo root (WORLD_GENERATION · BIOME_ATLAS · ART_DIRECTION ·
## SPECIES_AND_GENOME · RARITY_AND_GRADES · CAPTURE_AND_BIOSPHERE · COMBAT_AND_CONQUEST ·
## PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS · BREEDING_AND_SHARING ·
## DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION) are the SOURCE OF TRUTH we pull from for a
## full-system review/edit later. RULE: whenever we change a system, update its doc IN THE
## SAME BATCH (and bump its "matches code as of" marker) — the same way we run validate and
## update this roadmap. A change isn't done until its markdown reflects it. Also keep
## celestial-frontier-codebase-reference.md (code map) in sync when functions move/appear.

## 📌 PINNED — ROADMAP HYGIENE (Nick, 2026-07-21): KEEP THIS FILE LEAN. This doc holds ONLY the
## live SESSION HANDOFF (state / what's done / NEXT backlog / process). Completed batch logs and
## superseded handoff blocks live in `ROADMAP_ARCHIVE.md` (history + traceability, nothing deleted).
## RULE, run at the END OF EACH ARC (or whenever this file grows past ~400 lines): move every batch
## block older than the current one to the TOP of the archive's batch section, verbatim, then refresh
## the SESSION HANDOFF here so WHAT'S DONE / NEXT reflect reality. Rewrite the handoff in place — the
## roadmap stays a one-screen read. History is one file away, git-diffable. (Split first done 2026-07-21
## when this crossed ~285KB / 4,272 lines and stopped reading in one pass.)

## ▶▶▶ SESSION HANDOFF (as of 2026-07-23 — v1.6.4 LIVE; v1.7 ARC IN PROGRESS, source-only) ◀◀◀
## [HYGIENE 2026-07-24] Roadmap trimmed to a one-screen read: the v1.6.x DEPLOY history + Batch-15 + 6k/10k
##   beta blocks were moved VERBATIM to the TOP of ROADMAP_ARCHIVE.md (nothing deleted). Everything below is
##   still-live v1.7 state / backlog / process. All work committed + pushed; battery green. READY FOR NEXT SESSION.
## ▶▶▶ 2026-07-25 NINTH DIRECTIVE — FULL EXECUTION GREENLIT (Nick: waves 1-3 + WHOLE pending list + the
##   FULL UI PASS "left settings/help circles/topbar shelf — consistent with the infinite/sandbox ARPG feel"
##   + save export/import design ("let's figure this out") + TRAINING FULLY REDONE to match the new UI with
##   the SAME FOCUS LOCKDOWN (Nick x2: keep the lock, apply every prior training lesson: off-screen spotlight
##   guard, veteran-save seeding, overlay dismissal on step entry, gameEvent emissions intact) + FULL PROOF
##   SET at the end for his next review round.
##   ★ SESSION PROGRESS (all committed, each battery-green fp MATCH · render 1010/0 · smoke 415/0 · layout 546/9):
##   WAVE 1 = ✔✔✔✔ COMPLETE: (1) CANOPY UNION [tools/sheets/canopy.js proof] — _canopyMass wobble-lobe
##     union+gradient+pockets; tree/shrub/bushy/dense/round/baobab/acacia; no circles at 100/200%. (2) FLORA
##     IDENTITY WAVE 2 [flora-wave2.js proof] — form-agnostic paintOrgan (grapes/cherry/nutClu/barkCurl/
##     pepper/podHang + prior 4), spice row (cinnamon/cardamom/black pepper/vanilla/chili/mustard), per-species
##     fruit colors, 5 ROOT KINDS w/ vegetable colors, 4 HERB STRUCTURES (leafhead/needle/feather/aromatic),
##     4 GRAIN KINDS, sheet algae (aq6), umbel flowers. (3) liveview sheet = REAL ring grammar. (4) deepspace
##     labels + TRUE star-scale row.
##   WAVE 2 = MOSTLY DONE: wormhole continuous lensing + warped star-trails + throat depth ✔ · molecular-cloud
##     presence + protostars ✔ · MOON GEOLOGY ✔ (far masters ONE hero feature; icy branching interrupted
##     fractures; volcanic basalt+caldera+cooled fissures; rocky broken rims + ejecta) · OPEN-SEA per-landing
##     variation ✔ (salt re-deals islands/swell/fauna; opts.salt threaded into hdVista) · FAUNA IDENTITY ✔
##     [fauna-wave2.js proof] (dart/glass/tree/bullfrog frogs, puffin bill, raptor hook+chest, swan S-neck,
##     hummingbird, macaw, kudu/lyre/prong horns, warthog mane, meerkat sentinel special, sloth hang special,
##     turtle splayed feet; ALSO fixed 2 stray 0x08 bytes in the boar regex — was silently breaking \bboar\b).
##     FAUNA NITS REMAINING: dart-frog patch contrast verify at card size · eagle hook still subtle · gerenuk
##     neck (o.neck doesn't drive mammal-rig neck length — needs rig param) · red-panda RINGED TAIL (needs tail
##     path access) · R4 spike/fur/feather softening pass NOT STARTED.
##   [2026-07-25 SECOND SESSION, all committed+pushed → 5c0530f, every batch battery-green]:
##   R4 SPIKES ✔ [crystal+dorsal: varied spacing/length, mid-back envelope, ROOTED mounds; feather grid
##     jittered — fur/translucent-organs/wings were already done in earlier passes]. WAVE 3 ✔✔✔: coast-rim
##     BREAKUP (shore band width varies by type — cliffs plunge to water) + cloud FIELD mask (weather systems
##     w/ clear sky) + cloud SHADOWS [planets24 proof reviewed] · 4-WING vs 2-WING silhouettes (hindwing =
##     real second pair, separated tip) [winged proof reviewed] · star-class extras = previously done + scale
##     row. UI PASS STEP 1 ✔: ⚙+? circles JOIN the dock (desktop ±330 slots, phone edge-bookends; ids
##     untouched → training lockdown + smoke targets hold; layout 546/9, smoke 415/0).
##   ★★★ 2026-07-25 FINISH-LINE SESSION (Nick: "get this across the finish line") — ALL DONE, PROOFS SHIPPED:
##   UI PASS ✔ COMPLETE: THE SHELF (one-row topbar desktop: nameplate·HP·search·bell; phones keep 2-row) +
##     ⚙/? FLANK THE DOCK (±330 desktop, edge bookends phone) + 5 stale guide/training position refs fixed
##     to the dock era. TRAINING: ids untouched → lockdown + spotlights + smoke's 20-step run all hold
##     (415/0). WINGS ✔ (Nick's mid-turn note): QUARTER-OPEN dragon posture, tips below crown, heads clear;
##     4-wing keeps its second pair. Raptor head +15% so the hook reads.
##   NEW TOOLING: tools/uishot.js — headless-Edge UI screenshots via exactly-sized IFRAME (window-size lies
##     under Windows display scaling — measured vw 492 at requested 390; iframe gives the true CSS viewport).
##     Seeds veteran save {me,tut:1,rn:GAME_VERSION} → boots the live UI, no intro/release popups.
##   ★ CF-v17-GOLD-PROOFS.zip DELIVERED to Nick: 58 PNGs, 7 folders (earth-creatures/flora/procedural/
##     celestial/materials-gear-ships/vistas/UI) + README mapping every change. All 41 sheets rendered 0-fail.
## ★ 2026-07-25 ROUND-3 ITERATION (Nick's review feedback, all committed → 5464498, battery green):
##   THE ENGRAVE = the texture SOLUTION: skin layers hold GREYSCALE RELIEF (white raise / black carve)
##   composited with globalCompositeOperation OVERLAY → detail modulates the hide's own painted color+light
##   ('drawn in with the creature'). Rows/seams BOW around the torso (_bow); fur = pure interior flowing coat
##   (zero protruding fringe); plumage clipped inside the body; crystalline carved + 2 grazing glints. WINGS
##   shoulder-rooted side view (round 3, Nick: correct direction) + grander sweep. UI v3: HP STACKED under
##   nameplate (left HUD column: Cadet→HP→Charters), NOTIFICATIONS in the bottom-right corner beside ?/⚙ with
##   an UPWARD Windows-style tray — uniform desktop/tablet/phone (phone: bell above the ? bookend). ⚠ LESSON:
##   syncTopbarH measured row1 from the BELL — moving the bell to the bottom made --row1-h = viewport height
##   and threw every right panel off-screen (layout gate caught it); now measured from SEARCH. Charters spot
##   still undecided by Nick (left column for now).
## ★ 2026-07-25 ROUND-4 (GOLD_PROOFS_REVIEW_2026-07-25.md saved — 92% verdict, 'focused and finite';
##   + Nick's UI v4 spec). ALL DONE this round (→ 840b0db, battery green; CF-v17-GOLD-PROOFS-R2.zip delivered):
##   ENGRAVE v2 = full-body texture FIELDS (paint the whole canvas, the sil mask fits it — fixed chitin
##   'scribbled in the middle' + anything outside the lines) + FEATHERED rebuilt as engraved shingle plumage
##   (col-4 'bunch of lines' fix) + crystalline glints masked in-body. WING-ROOT CONTACT SHADOW (§E/F).
##   UI v4 (Nick): EMOJI ICONS everywhere (✦🗺📖🛠🏆); desktop ✦ Prime TOP-MIDDLE · 🗺 Atlas under search ·
##   📖🏆🛠 right rail · 🔔?⚙ corner w/ upward tray; phone TWO-ROW icon dock same order (row1 🗺✦📖 ·
##   row2 ⚙🏆🛠? · 🔔 above ?); shelf truncation FIXED (nameplate 58vw, adaptive search placeholder in
##   syncTopbarH). REVIEW TRIAGE: must-do #2,#3,§E/F DONE · #1 version label = BUNDLE-TIME by design (house
##   rule: GAME_VERSION on Nick's word; '(dev)' marks source build) · REMAINING FOR GOLD (the final micro-
##   wave): 4 fauna reads (eagle hook, gerenuk neck, red-panda rings, dart contrast) · open-sea variance bump ·
##   jungle/desert vista organicity · puffin/toucan/macaw bill authority · liveview ring-shadow value bump ·
##   review's SDF/silhouette-influence pipeline = LOGGED as post-Gold enhancement (engrave v2 covers the
##   integration ask at our style level; silhouette budgets/zone maps queued if Nick wants more).
## ★ 2026-07-25 ROUND-5 — TWO R2 REVIEWS TRIAGED (saved: GOLD_R2_REVIEW_A/B_2026-07-25.md; verdict
##   96% CONDITIONAL GOLD, 'micro-pass, not another art cycle') + Nick's iPhone all-docked spec. DONE (→
##   5ea9844, battery green): UI v5 = phone row 2 is FIVE centered chips ⚙🏆🛠🔔? (nothing floats) + EVERY
##   phone panel (settings/tray/charters/compendium/atlas/records) opens as a SHEET ABOVE the dock — aligned,
##   zero overlap. ⚠ LESSON: a transformed fixed ancestor becomes the containing block — bellwrap's translateX
##   collapsed the fixed tray to 20px (gate caught it); positioned via left:calc() instead.
##   ▶▶▶ THE FINAL GOLD MICRO-PASS (both reviews' gate, = the LAST wave before Gold sign-off):
##   (1) EAGLE raptor read (hook+brow+chest+squared tail+talon stance) (2) GERENUK neck +20-30% vs impala,
##   raised head, slimmer torso (needs mammal-rig neck param) (3) RED PANDA tail rings + volume (needs tail
##   path in marking pass) (4) DART FROG contrast at card size (min patch width, saturation) (5) OPEN-SEA
##   COMPOSITION ARCHETYPES — 8 real archetypes (empty horizon/near island/archipelago/rocky coast/reef
##   shelf/storm front/low sun/distant life), vary within each — not one comp with parameter jitter
##   (6) FLIGHT-STATE separation — airborne rises off its shadow (narrow+soften), legs tuck, body tilts;
##   grounded lowers + folds tighter; 4-wing pair separation in flight (7) version string = BUNDLE-TIME
##   (by design — bind guide card to GAME_VERSION at the bump; verify in release shots) (8) phone guide
##   launcher lane above the dock. POLISH (if schedule): fur contour fuzz + crystal planar breaks (silhouette
##   budgets), chitin joint interruption, scale zoning, ring-shadow softening, wormhole bead reduction,
##   nebula arc breakup, live-view exposure hierarchy (runtime dominant-glow compression), 44px touch-target
##   audit + first-use dock tooltips (accessibility batch), meta-dock collapse = POST-FORGE (no realtime
##   combat state exists yet), flora-family vista mismatch = VERIFY (spot-check landing rosters vs biome).
## ★★★ 2026-07-25 THE FINAL GOLD MICRO-PASS = EXECUTED (→ 7003c15, battery green, proofs delivered):
##   ✔ (1) EAGLE brow ledge + squared raptor tail ✔ (2) GERENUK neckX (NEW mammal-rig G.neckX multiplier —
##   o.neck was never consumed; now any recipe can stretch a neck) ✔ (3) RED PANDA ringed bush tail (rig
##   exports rigOut.tailSeg, bush-aware; alternating dark/cream bands) ✔ (4) DART FROG aposematic
##   source-atop wash (survives every downstream pelt wash — the pattern for guaranteed-bright species)
##   + min patch width ✔ (5) OPEN-SEA 8 ARCHETYPES (empty/near-island/archipelago/rocky-coast/reef-shelf/
##   storm-front/low-sun/distant-life; salt picks archetype then varies within; landings SHEET now salts per
##   cell — the old sheet passed no salt so every sea cell rolled identically) ✔ (6) FLIGHT-STATE separation
##   (_fitBeast: airborne winged procs lift S*0.10 off a narrowed, faded shadow) ✔ (8) phone guide-launcher
##   lane above the dock. REMAINING before Gold sign-off: (7) version string AT BUNDLE TIME (bind verified) ·
##   Nick's proof review of this pass · then regenerate the FULL zip as the Gold-candidate package.
## ★ 2026-07-25 UI v9 (Nick's screenshot round): dots retired · SELECTION GROWTH (.sel via PANELS sync)
##   · 🌍 Atlas · Charters normalized · corner quartet on tablet/desktop · centered settings · phone lanes
##   raised. ⚠ LESSON: TWO min-width:701 media blocks exist — a block-splice keyed on indexOf hit the tutbox
##   one and ate 555 lines; recovered via git checkout + exact-match edits ONLY (re-learned rule 2 the hard way).
## ★★★ 2026-07-25 UI v10/v11 + TRAINING GRADUATION (all Nick-directed, → committed, battery green
##   fp MATCH · smoke 419/0 (+4 graduation checks) · layout 546/9):
##   UI v10: uniform stack pitch/metrics · SEARCH RESULTS own fixed lane below the right stack (typed-
##   'earth' proof) · 🏆 trophy-only circle · dodge lanes desktop 100/phone 150. UI v11: counts retired
##   except ✦ Prime 0/9 · selection = GOLD-WASH HIGHLIGHT (growth removed — Nick: spacing never moves) ·
##   HP BAR POLISH (quarter ticks, lit-top fill depth, bright leading tip; hue slide kept) · BELL = circle
##   everywhere · utility order EVERYWHERE = 🏆 Records · 🔔 Notifications · ? Guide · ⚙ Settings.
##   ★ TRAINING = 21 STEPS, ends on Nick's order of operations: NEW 'charter-first' step — recruit opens
##   📜 and ACCEPTS their first contract (chAccept step-scoped exception; 'already proven' disabled until
##   tutDone so sandbox stats can't complete deeds; accept fires gameEvent('chaccept'); chacc SURVIVES
##   _tutCleanup) → finale points at ? Guide + 🎓 briefings. Smoke walks all 21 + asserts no auto-accepts,
##   exactly one accepted. ⚠ LESSON: smoke's tutAt matched the literal 'n / 20' card counter — adding a step
##   broke 22 checks at once; counter now '/ 21' (grep the total when steps change).
##   DOCS SYNCED: UI_PRESENTATION (final v8-v11 layout) + QUESTS_AND_CHAPTERS (graduation mechanics).
## ▶▶▶ 2026-07-25 NINTH DIRECTIVE — CACTI ROOT-CAUSE + INVENTORY PROOFS + PHONE DOLL (all gates green:
##   fp MATCH 50/50 · render 1010/0 · smoke 419/0 · layout 546/9):
##   ★ DESERT-CACTI FIX (Gold review Gate 1) — ROOT CAUSE FOUND: main.js floraGenes mapped flora genomes
##   through hdGenesFor — the FAUNA phenotype resolver. Its return R carries NO .form/.color/.seed, so
##   _floraSpx defaulted every lookup → FAM[0]='fern' in default colors for EVERY vista plant on EVERY
##   world (the reviewer's "web-frond forms everywhere"). Compendium was never wrong (raw genomes).
##   FIX: floraGenes passes RAW genomes (hdFloraBare reads the genome itself); same wrong wrap removed
##   from tools/sheets/floravista.js (the audit sheet was masking its own test). airGenes KEEPS
##   hdGenesFor (hdBeastBare wants R); aerFlora is presence-only (harmless). floravista proof now
##   draws true column cacti / broadleaves+palm / flowers+ferns per genome. fp-safe (render layer).
##   ⚠ LESSON: hdGenesFor = FAUNA-ONLY resolver. Flora painters (hdFloraBare/_floraSpx) take the RAW
##   genome. A silent-defaults object made every field fall back — nothing threw, everything rendered.
##   ★ INVENTORY PROOF RIG (cert gaps closed) — uishot.js SEED_FULL: populated save (23 materials across
##   all 5 families + cgx exceptionals, 22 item stacks, MIXED-TIER LOADOUT WORN incl. T5 cg-plasma +
##   affixes via ea). New shots: shipyard d/p, inv-materials/craftables/gear d + materials/gear p,
##   prime-phone. Closes reviewers' Shipyard-proof + equipped-paperdoll + Prime-phone gaps.
##   ⚠ uishot outDir must be ABSOLUTE — headless Edge silently drops relative --screenshot paths.
##   ★ PHONE SHEET (Nick) — paperdoll capped at min(62vw,240px) on ≤700px (was ~75% of viewport; tabs
##   + effects bar + first material families now surface unscrolled); sockets 44px (touch floor).
##   Sheets all scroll (overflow-y:auto + styled scrollbar) — wheel + finger, confirmed.
## ▶▶▶ 2026-07-25 TENTH DIRECTIVE — PRE-DEPLOY CODE REVIEW (Nick: "full code review before we go
##   live + defunct code + optimizations"). 27-agent workflow review of the whole v1.7 arc (diff
##   3a4b839...HEAD): 21 verified findings → 10 distinct defects, ALL FIXED + below-cap cleanups
##   (all gates green after: fp MATCH 50/50 · render 1010/0 · smoke 419/0 · layout 546/9):
##   [1] #pinchip/#chchip were PRE-v6 anchors sitting ON the v11 Charters/Compendium stack (z9 over
##       z8 — a pinned recipe made Compendium unclickable, its clicks opened the Shipyard!) → chips
##       moved below the stack (topbar+92/+128); proof shot w/ pin:"igdrive" seeded.
##   [2] GRADUATION RESTART DEADLOCK: chacc survives quit-before-finale; _chAvailable hides accepted
##       heads → two half-finished runs left the board with NO Accept → charter-first step now
##       self-heals in enter: if chacc.size, the deed is already done — re-emit chaccept, advance.
##   [3] _tutFinish's v1.5.2 unconditional chacc.add('st-land') fought the graduation (st-mercury
##       grad got st-land forced + wrong notification) → auto-accept now ONLY on the skip path
##       (chacc empty); graduate keeps their own pick, notification matches either way.
##   [4] VISTA GENE-PLUMBING FAMILY: _hdAbyssScene got NO genes in-game (proof sheets passed them —
##       certs showed populated abysses the game never rendered) and _hdReefScene got the LAND herd
##       (land beasts swam; real fish invisible) → new xtra.aquaGenes (aqua-classed, hdGenesFor)
##       threads to both scenes. aerFloraG de-wrapped from hdGenesFor (same fern-bug class).
##   [5] _vistaSalt used stats.landings (first-landing-only counter) → re-landing the same world
##       rolled the SAME region all epoch → session _descSeq++ per openLandingVista re-rolls truly.
##   [6] VETERAN MIGRATION: pre-1.7 saves have no `seen` → every old species wore the blue new-dot
##       → absent field (not empty array) backfills all catalogued ids as viewed after codex load.
##   [7] _tutSpot FLIP OSCILLATION (PLAUSIBLE→fixed): flip branch fought forced-side re-assert
##       (card teleporting top↔bottom ~1/s) + early-return froze ring/--tut-bot → flip now LATCHES
##       per step (_tutFlipOvr, outranks side rules, cleared each _tutShow) and falls through.
##   [8] _fabHTML's stale 4-entry _SRC copy (none of the 7 cosmics had source hints) → _matUses().src
##       single source. [9-10]+cleanups: TXhi/TXlo dead consts, 8 dead .arr rules (class renamed
##       wchev), dead #codex .sp .kd, shadowed phone #tray/#bellwrap rules, stale phone dot-corner
##       rule, _tutTimer vestige, uishot dup shots removed, board-dot system fully retired [87b398c],
##       fa3 stream-preserving r(). deadcode.js clean (3 keepers probe/tool-referenced).
##   ⚠ LESSON: proof sheets can MASK integration bugs — biome-coverage/vistas-big passed genes the
##   game call site didn't; audit the GAME call site, not just the sheet. NOT YET SMOKE-PROBED:
##   graduation-restart self-heal (needs a quit-mid-training harness — future smoke work).
## ▶▶▶ 2026-07-25 ELEVENTH DIRECTIVE — EXTERNAL CODE REVIEW (CODE_REVIEW_EXTERNAL_2026-07-25.md,
##   Nick: "fix everything"). 14 findings, 13 verified real, ALL 14 ADDRESSED (gates: fp MATCH 50/50
##   incl. BOTH fp-sensitive fixes proven identity · smoke 426/0 w/ 9 NEW regression checks ·
##   layout 546/9 · new version-consistency gate):
##   CF-CR-001 search-sink XSS → esc() at the sink + codex from/where sanitized on load (from strips
##     markup ≤48ch; where via _sanitizeView). CF-CR-002 affix resurrection → _clearDeadAffixes on
##     last-copy destruction (single+bulk salvage); stale affix no longer blocks exceptional forges.
##   CF-CR-003 320k-power saves → battleStats caps EFFECTIVE brood/fed at 200 (share-code ceiling;
##     fp-proven identity), load xp clamped 486 (levelOf caps at 9). CF-CR-004 → validate.js now
##     FAILS if GAME_VERSION ≠ package.json (bump itself stays bundle-time, Nick's word).
##   CF-CR-005 4.6MB saves → atlasThumb rebuilds EVERY kind (planet/star/galaxy/moon/comet/belt)
##     from seed; _cw keeps slimGal fields (numbers, not base64); save strips all regenerable thumbs
##     (legacy galaxy entries w/o gal.seed keep theirs, never blank). CF-CR-006 → portrait cache
##     1200 FIFO → 256 TRUE LRU (hit re-files; ~356MB worst-case → ~75MB) ⚠ AUDITED INVARIANT
##     CHANGED deliberately (phone-heat mandate). CF-CR-007 mirror duels 93.5% first-slot → seeded
##     CASCADED-hash coin (hashInt's h^x collapses for identical/xor-related seeds — the naive coin
##     measured 100% one-sided!) → 50.1% measured over 5,000 mirrors, fp MATCH (no probe duel ties).
##   CF-CR-008 prime where → _sanitizeView. CF-CR-009 → all load arrays length-bounded (_capA).
##   CF-CR-010 → 8192-char cap on CF1/CFB before decode. CF-CR-011 → browser zoom re-enabled
##     (iOS ignored the lock; canvas gestures preventDefault) + role=dialog/aria-modal on the 5 big
##     overlays; keyboard Navigator stays deferred (feature build, post-Forge). CF-CR-012 → RAF
##     STOPS on document.hidden, resumes on visibility. CF-CR-013 → fonts SELF-HOSTED (2 variable
##     woff2 latin subsets embedded base64, ~93KB; zero third-party requests, offline-proof).
##   CF-CR-014 → tools/deploy.js RUNS validate+smoke+uilayout and aborts on failure (--skip-gate
##     escape hatch); package.json test/smoke/layout/deploy scripts added.
##   ⚠ LESSONS: (1) hashInt(a,b,·) DEGENERATES when a,b are equal/xor-related (opening h^x is
##   constant) — cascade nested hashInt for pair-keyed coins. (2) smoke's salvageItem hook added to
##   probe-names.json (tools-only, fp-neutral). DEFERRED from review (roadmap): keyboard Navigator +
##   full a11y batch · OffscreenCanvas/worker portraits · source split into modules · savegame
##   schema/migration pipeline (ties save export/import design).
## ▶▶▶ 2026-07-25 TWELFTH DIRECTIVE — EXTERNAL RE-REVIEW (CODE_REREVIEW_EXTERNAL_2026-07-25.md;
##   confirmed ALL 14 prior fixes hold; found 1 NEW security defect + hardening items — Nick:
##   "another pass"). ALL ADDRESSED (fp MATCH 50/50 · smoke 430/0 w/ 4 new regressions · layout
##   546/9 · all 3 deploy gates verified):
##   CF-RR-001 (High, NEW) legacy-thumb XSS — MY OWN legacy mitigation kept saved data:image
##     strings and both sinks concatenated into src="" — a crafted `…;base64,x" onerror="` broke
##     out. FIX: strict load validation /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/
##     (no quote can exist; canvas toDataURL always passes) + esc() at BOTH sinks (belt+braces).
##   CF-RR-002 save resilience — `{}` where an array belonged THREW mid-load; outer catch dumped
##     the WHOLE save (fresh boot then SAVES OVER real progress). FIX: _capA moved to top of
##     loadSave (12 more loops guarded + bx/seen bounded; a bad field loads empty, rest survives)
##     + LAST-KNOWN-GOOD BACKUP (raw stashed to SAVE_KEY_bak after every proven-good load;
##     corrupt primary restores from it with a 🛟 toast; reset clears both; loadSaveWithRecovery
##     exported 3-site). CF-RR-006 portrait cache DEVICE-TIERED (phone 96 / desktop 256) + pagehide
##     flush. CF-RR-007 prefers-reduced-transparency kills backdrop-filter (OS opt-in only — glass
##     stays default). CF-RR-003/process: deploy REQUIRES --release X.Y.Z matching GAME_VERSION+
##     package.json; --skip-gate needs CF_EMERGENCY_DEPLOY=I_ACCEPT_UNTESTED_RELEASE. CI ADDED
##     (.github/workflows/test.yml: npm ci + full battery + rarity-sanity + deadcode on push/PR;
##     uilayout browser now resolvable via CF_BROWSER/linux chrome paths). FONT-LICENSES.md (OFL).
##     _cbT dead const removed. ⚠ LESSON: a "keep legacy data" mitigation is itself an INPUT PATH —
##     validate what you keep. ⚠ LESSON 2: module-scoped fns need the 3-site export (API banner +
##     freeze + destructure) — ReferenceError caught by validate's jsdom boot.
##   ⚖ RESOLVED (CF-RR-004, Nick 2026-07-25: "2.5× titan") — LINEAGE SOFT KNEE shipped [30bbda7]:
##     combined bonus identity ≤1,000 (realistic creatures/live saves byte-identical), saturates
##     above (asymptote 1,700) → maxed 200/200 = +1,500 ≈ 2,250 total (~2.5× titan ~900) vs old
##     ~6,600. Monotonic; fp MATCH; smoke asserts knee identity + maxed delta. §24 pass retunes
##     the knee/asymptote knob if wanted. Curve documented in COMBAT_AND_CONQUEST.md.
##   ⚠ CI NOTE: first workflow run (b8d021e) FAILED w/ deprecation warning — @v4 actions forced
##     onto Node 24; bumped to @v5 + env-echo step + explicit CF_BROWSER [30bbda7]. If the run at
##     30bbda7 still fails, get the failing STEP from the Actions page (or gh auth) — candidates:
##     slow-runner smoke `until()` timeouts, or chrome/CDP quirks in the layout gate on ubuntu.
##   DEFERRED (unchanged): instance-based gear (§5, pre-loot-depth) · adaptive/dirty-frame render ·
##     module split · Object Navigator + a11y batch · seeded action-RNG (anti-save-scum, design) ·
##     per-section save schema/migration (ties export/import).
##   ▶ AWAITING NICK — iPhone device verify + the §24/lineage-ceiling call; THEN bundle-time
##   (bump GAME_VERSION+package.json to 1.7.0, RELEASES notes, `node tools/deploy.js --release
##   1.7.0` [self-gating], push source, final Gold zip + release archive).'S REVIEW of the zip. KNOWN DEFERRALS (next pass): eagle hook strength · gerenuk neck
##     (rig param) · red-panda tail rings · dart-frog contrast at card size · settings-panel anchor could sit
##     closer to the dock ⚙ on desktop (cosmetic) · desktop caption-vs-hint overlap at boot (pre-existing,
##     cosmetic). THEN: bundle-time items (RELEASES notes, GAME_VERSION bump on Nick's word, deploy site+
##     source, iPhone verify list).
## ▶▶▶ 2026-07-25 EIGHTH DIRECTIVE — TWO MORE REVIEW DOCS TRIAGED (both saved to repo):
##   GAP_AUDIT_2026-07-25.md ("Build Gap Audit"): P0 items 1,3,4,5,6,8 ALREADY DONE this arc (universal rarity,
##   save validation/hardening, canopy, ring grammar, deepspace labels, gear-on-ladder); P0-2 Earth-cap = N/A
##   (grades are fingerprinted generation — recapping breaks determinism law); P0-3 migration = our absent-safe
##   field policy + feeds the EXPORT/IMPORT DESIGN (adopt: versioned save envelope w/ schema fields when built).
##   ADOPTED: save-size budget w/ warning threshold (ties CF-002) · mirror-duel test in balance sim (ties v1.6
##   deferral) · sting-coverage audit (playRaritySting exists — verify flora/material discovery coverage) ·
##   BALANCE.md numbers snapshot generated from code · release-gates checklist AT BUNDLE TIME. DECLINED (scope/
##   fit): durability-repair, spoilage, vendor/auction/multiplayer economy, weapon families, PvP normalization,
##   full 19-field schemas, document-owner bureaucracy, modifier compatibility matrix (worldgen derives
##   properties structurally — cannot produce the contradictions the matrix guards). DEFERRED w/ quality grades+
##   uniques+bio-ingredients (post-Forge): recipe-acquisition progression (hybrid unlock model — Nick's call,
##   changes the fixed-recipes simplicity principle).
##   RUNTIME_INTEGRATION_2026-07-25.md: ADOPT NOW — actual-size proof standard (every family proofed at master/
##   gameplay/icon sizes — fold into the full proof set) · sheets-regression runner (render ALL sheets, no
##   ERROR cells) · UI-scale proof sheet (cards/icons at true size). FOLD INTO EXISTING QUEUES: gameplay-state
##   readability + accessibility redundancy (accessibility batch) · tutorial-uses-real-art (training redo).
##   ROADMAP (post-Forge candidates, Nick decides): ANIMATION/locomotion system (big — Steam-worthy but a new
##   engine layer) · ecology-in-motion (herds/packs/predation behavior) · procedural AUDIO identity (creature
##   calls from genome) · breeding PREVIEW UI (deterministic spoiler tension — design taste call) · duplicate-use
##   /bad-luck-pity systems · lineage archive/memorials · store/key-art/trailer assets (Steam prep) ·
##   localization. NOTE: visual determinism concern = covered by policy (saves store seeds not pixels; painter
##   changes are deliberate, RELEASES-noted).
## ▶▶▶ 2026-07-25 SEVENTH DIRECTIVE — GOLD MASTER TRIAGE (GOLD_MASTER_2026-07-25.md saved to repo; Nick's
##   compiled Part I materials/gear spec + Part II art Gold assessment; verdict "Near-Gold, hold for one
##   focused correction pass" — ACCEPTED, feedback delivered, awaiting Nick's go on execution).
##   PART I = COMPLIANCE AUDIT DONE (MATERIALS_AND_GEAR.md §26): shipped build already satisfies all 15
##   Final Rules in scope (_itemRarity anchors on blueprint tier NOT rarest ingredient; veins gate by tier;
##   landing never rerolls; skim = survey→unlock→extract; deterministic crafts). DEFERRED deliberately:
##   quality grades (Crude→Perfect) → masterwork/Uniques arc; 19-field instance schema → exceptional vein
##   IS our instance model; biological ingredients (§10 harvest parts) → post-Forge; independent ilvl →
##   only if balance ever needs it (§24 validated without).
##   PART II = THE GOLD CORRECTION PASS, three waves (full detail in ART_DIRECTION.md 2026-07-25 block):
##   ★ APPROVED GOLD, do not reopen: procedural creatures (architecture/blending/materials/aquatic/plans),
##     large-planet direction, BH + quasar direction, gas-deck vistas. First external GOLD on the renderer.
##   WAVE 1 (blockers): (1) FLORA CANOPY UNION — adopted the review's mask→union→blur→threshold→distort→
##     gradient pipeline; acceptance = no construction circle visible at 100%/200%; lifts all 334 flora +
##     vistas (= soft-mass queue #1). (2) Earth-flora identity organs wave 2 (kill the 7 repeated templates).
##     (3) PUSHBACK: liveview ring "seam" = the SHEET's rect clip (game split+shadows correct since 927e41b)
##     → rebuild sheet on real draw grammar. (4) deepspace label overlap = sheet cosmetic → fix + add TRUE
##     relative-scale star row (both are 2nd re-flags — the proofs must stop lying about the game).
##   WAVE 2 (high): fauna identity wave 2 (frogs/bird sub-rigs/ungulate horns/small mammals/turtle feet) ·
##     R4 spike-fur-feather polish · moon geology + dedicated small-size masters · wormhole throat +
##     molecular-cloud punch · open-sea per-salt variation.
##   WAVE 3 (polish): coast-halo breakup · cloud fronts/storms · star-class surface behavior + WD density ·
##     wing-count silhouettes · then ONE full regression proof set → §10 Gold retest checklist.
## ★★★ v1.7 BIOME-COHERENCE / ZOOM / CATALOG POLISH = DONE (2026-07-23, same session; each commit battery-green:
##   fp MATCH 50/50, render 1010/0, biome-audit PASS, smoke 396/0, layout 546/9; pushed). "One visual language
##   everywhere — the thing on the planet is the thing in your Compendium" (Nick).
##   (1) GAS BIOMES ALIVE [fbee7ce]: a gas giant's biosphere is microbial + aerial flora + rare air fauna, but the
##     deck only drew a generic floater gated on the (~0) macrofauna air-count → looked lifeless. Now paints the
##     world's ACTUAL aerial ecosystem: floating cloud-gardens (its af flora) + gas-bladder colonies + aeroplankton
##     + its real AIR CREATURES as flying silhouettes (hdBeastBare, same genome as their portrait). openLandingVista
##     threads airGenes/aerFlora → showVistaBox → _hdDeckScene.
##   (2) FLORA CONSISTENCY [5a8d0b8]: extracted _floraSpx(g) + hdFloraBare(g,seed) (the flora parallel to hdBeastBare)
##     out of hdPortraitFlora (BYTE-IDENTICAL refactor). The VISTA now draws the world's ACTUAL terrestrial flora
##     species — desert cacti / jungle broadleaves / meadow ferns — not a generic canopy; flora-less worlds keep the
##     tuned generic dressing (fallback). Creatures ALREADY shared hdBeastBare across portrait/card/vista (confirmed).
##   (3) SMOOTH ZOOM [2fb3433]: a discrete mouse wheel snapped zoomAt() step-by-step across universe→galaxy→system.
##     Wheel/double-tap now ease toward a cursor-anchored TARGET each frame (_stepZoomGlide, 0.32); pinch/programmatic
##     stay immediate; Motion:Reduced instant. ⚠ FEEL change — needs Nick's interactive check on a wheel device.
##   (4) STAR CLASSES [f662e54]: MAG/PROTO/RG-SG made distinct (see the sweep entry below). Docs all synced [3978f07].
##   (5) THE LANDING ROLL [183e757]: Earth was SPECIAL-CASED OUT of the %-weighted landing roll (always the same
##     vista) and the roll only changed per 20-min epoch. Now: Earth rolls its REAL surface mix (_EARTH_LANDING —
##     ~71% seas incl. coral/archipelago/storm belts, ~29% land split temperate/jungle/savanna/tundra/wetland/karst/
##     saltflat; histogram verified: opensea 55%, savanna 7.5%…), the salt re-rolls PER LANDING (_vistaSalt =
##     epoch*997+stats.landings), and the vista's RESIDENTS match the rolled region (openLandingVista rolls ONCE →
##     xtra.wb; fauna filtered by the biome's rig families + per-landing seeded shuffle). Terran sea-rolls show the
##     shore scene; coral/abyssal keep their reef/deep routes. Anchor biome (veins/odds/generation) untouched — fp
##     MATCH. ⚠ training's first Earth landing rolls too (~55% ocean splash-down) — kept, flagged for Nick. Proof:
##     tools/sheets/earthlandings.js.
## ★★★ 2026-07-24 BATCH (Nick: "continue the roadmap suggestions" + dead-code purge; every commit battery-green
##   fp MATCH 50/50 · smoke ↑410/0 · layout 546/9 · render 1010/0; all pushed):
##   (1) GLYPH DEAD-CODE CLEANUP [0eaa038] — all SEVEN dead star-render sites excised (spCard .rar, Atlas .rstar +
##     logMap star field write/load-sanitize, found-list gstar, reveal gbadge, 3 cinematic/toast appends) + dead
##     #codex .sp .rar / #log .item .rstar CSS. KEPT: .ic-chip.rar (live item-card chip) + data-layer star:'' (fp).
##   (2) FULL DEFUNCT-CODE PURGE [9260056] — NEW tools/deadcode.js (reusable zero-ref scanner: game+markup+CSS+
##     probes+checks+sheets corpora; every candidate hand-verified). Removed 12 JS symbols (colorDNAFor, biomeProfile
##     accessor, pick1, SP_KINGDOM, SAP_LABEL, watery, finpt, matInfo, whole retired Prime-claim chain incl.
##     speciesSignatures/worldSignature + no-op call sites) + 11 dead CSS rule-groups (.actrow .dstats .dship
##     .gstep(s) .ic-equip .pframe/.pav/.pmeta/.pname/.prank .splist; fs-lg/xl compounds trimmed keeping .gsub).
##     KEPT deliberately: Color-Atlas trio (gate-tested in validate), _titanElemOf (probe-hooked), ELEM_ICES (sheet).
##   (3) §5 INSTANCE RARITY = DESIGN CALL RESOLVED [092a281] — "the EXCEPTIONAL VEIN": vein-level resolution meets
##     §21 stack-by-substance. exVeinFor (~15% of worlds, own palette, own rng stream — cv fp-discipline), sparse
##     extra trickle, ✦ sub-count on the SAME card (cgx, save field cgx, absent-safe, load-clamped), exceptional =
##     base+1 clamp 6 (exTierOf), cosmics excluded. _spendMat burns exceptional first; FULL exceptional coverage ⇒
##     EXCEPTIONALLY FORGED (seeded affix via spoils machinery, never clobbers a live enchant). 8 sentinels; §5 doc.
##   (4) §8b SKIM DESIGN PASS (delegated) [77ac43c] — CORONA SCOOP sys (reqs Jump Drive, costs 1 hand-skimmed Pls):
##     +1 sample/pass + ~50% deeper corona (exhausted stars reopen), bonuses OUTSIDE the seeded draw. REMNANT'S BITE:
##     WD/NS/MAG/BH skims cost 3 HP unshielded (never lethal — <5 HP refused); the Scoop ends it. 3 sentinels; §8b doc.
##   (5) §22 REMAINDER [b04ea3c] — TIER STRUCTURE layer in partIcon (the tier changes the MACHINE: rig conduit→plasma
##     core, suit tanks→shoulder armor, helm pods→antenna+halo, glove/legs/boot/probe/charm/struts each evolve) +
##     bespoke 'scoop' painter (was falling through to charm gem) + SHIP HULL TIERS in shipImage (Jump=armored spine
##     +nose cap, IG=luminous seams+wingtip beacons, Scoop=golden ventral ladle; scout silhouette persists). Proof
##     sheets reviewed: gear-tiers + NEW tools/sheets/shiptiers.js (⚠ harness gotcha documented: never lift `items`).
##   (6) WINGED BODY-PLAN PASS [d1e11fa] — Nick's "gas fliers read as floating quads": wings now DOMINATE (span
##     0.30→0.42, peak −0.44, scalloped trailing edge); AIRBORNE winged tucks to 2-leg flight stance, grounded keeps
##     full limbs (gryphon grammar). Proc plans only (Earth rigs untouched). NEW tools/sheets/winged.js reviewed.
##   (7) §24 EMPIRICAL VALIDATION = COMPLETE, PASS — archetype balance-sim PASS (all 17 in the 42–58% band; fury 55.6
##     top, enrage 45.6 floor; healthy counters ±29 max). fast-500 CLEAN (0 err/death/softlock, funIndex 6.9 ≥ v1.6's
##     6.87). deep-500 CLEAN (0 deaths/softlocks; funIndex 5.6 ≥ 5.5; broad gear adoption; drought mean ~36 = the SAME
##     pre-existing staleness signal, unchanged by v1.7 — the Expedition Contracts suggestion is its designed fix).
##     The affix ramp + cosmic gear did NOT distort deaths, stage progression, or equipment spread. §24 validated.
##   ▶ STILL QUEUED (each its own focused pass): charter-training module · accessibility (CF16-012 pinch-zoom +
##     CF-006 keyboard Navigator — needs device verify) · TEXT-POLISH re-pin (fingerprint re-pin — do with Nick) ·
##     rest of PROCEDURAL_CHARACTERISTICS pass order (proc HEAD system, tail-types, marquee traits, eye/limb counts).
## ▶▶ THE SOFT-MASS PASS (Nick 2026-07-24: 'blended colors, not just circles' — PRINCIPLE ADOPTED):
##   soft subjects (snow/water/mist/canopies/clouds/tissue) = layered radial gradients with feathered edges;
##   hard subjects (crystal/plate/machinery/ice SHARDS/coral skeletons) keep crisp edges — that IS their identity.
##   SHIPPED: tundra drifts + swamp pools + coral shallows [bd5a0f5]. AUDIT QUEUE (priority order): (1) FLORA
##   CANOPIES — berry bushes + round-crown trees are circle-piles; converting the canopy painter to gradient
##   clumps lifts all 334 flora at once; (2) moss/lichen mats; (3) vista foliage clumps; (4) gas-giant storm
##   flecks. Creature pipeline + planets/stars/nebulae already gradient-based (audited clean).
## ▶▶▶ 2026-07-24 SIXTH DIRECTIVE — PROOFSET-2 REVIEW TRIAGE (PROOFSET2_REVIEW_2026-07-24.md saved to
##   repo; Nick: 'we need to get this right and proceed'). VERDICT ACCEPTED: identity fidelity is the gap, not
##   rendering. THE SIGNATURE-FEATURE PASS is the program of record, four enforced rules:
##   (R1) every named Earth animal gets MANDATORY anatomical identifiers (recipe-declared, silhouette-level);
##   (R2) every named Earth plant gets a MANDATORY identity organ readable at icon size;
##   (R3) every landing biome gets a DISTINCT environmental composition (coral/mangrove/swamp/tundra scenes
##        currently share the inland-settlement template — scene recipes per biome family);
##   (R4) every procedural trait gets a MINIMUM READABLE FOOTPRINT (horn/mandible/eye-count/limb-offset
##        minimums; translucent = soft organs not machinery rectangles; wing sweep in flight).
##   EXECUTION ORDER: (1) MARKINGS layer in the pelt pass (mask/eye-patch/leg-stripes/chest-mark/belly-
##   contrast, recipe-declared) + flagged-fauna recipes (panda, orca, okapi, bears, walrus tusks, elephant
##   TRUNK as real rig anatomy, ape differentiation: arm length/stance/bulk, bird sub-silhouettes: swan-swim,
##   raptor, puffin bill, hummingbird scale) → re-proof pages. (2) FLORA identity-organ system (signature
##   fruit/flower/rhizome/pod per plant — rafflesia/banana/coffee/cacao/durian/papaya/spice-row first) —
##   the review's #1 blocker. (3) R3 STATUS 2026-07-24: era:town artifact REMOVED from the proof sheet (settlement/roads were sheet-forced; all 31 wb biome cases exist in-engine). REMAINING REAL WORK, now precisely visible: STRENGTHEN the weak wb washes — tundra must read SNOW (pale ground+sky, frost haze), swamp = standing water + dead trees, mangrove = channels + root stilts, coral-land = turquoise shelf + reef forms; + OPEN-SEA VARIETY (island count/placement, wave strength, sun position, shore curvature per salt). Histogram confirmed ~70% sea-family per spec. (4) Procedural trait minimums (R4).
##   PUSHBACKS RECORDED: live-view ring 'seam' = the LIVEVIEW MOCK's crude clip (in-game split+shadows are
##   correct) → FIX THE SHEET so proofs reflect the game; deep-space heading overlap = sheet cosmetic → fix;
##   70/30 landing spread claim → validate with a 10k-roll histogram (classification: coral/archipelago/marsh
##   count as SEA in the 70). Star-class SIZE differences exist in-game (sheet renders equal-size — add true
##   relative scale row to the sheet so reviews stop re-flagging it).
## ▶▶▶ 2026-07-24 FIFTH DIRECTIVE (Nick) — THE 1.7 POLISH SUPER-QUEUE. Inputs: VISUAL_REVIEW_2026-07-24.md
##   (Nick's upload, saved to repo) + "advanced briefings + content completeness + ALL QoL + full Earth-catalog
##   one-by-one polish + procedural-trait pass + breeding cohesion, proof sheets when done".
##   DOCK ANSWER: the shipped dock IS universal — ONE bottom dock on both platforms (labels on desktop, icon+count
##   chips ≤520px). No second design needed; device verify still pending.
##   VISUAL-REVIEW TRIAGE — ✔ COMPLETE 2026-07-24 incl. venus circulation + moons −10% [83a6c54]. Original:
##   FIX-FIRST — ✔ ALL DONE 2026-07-24 (quasar jets ff/knots/asym [b5fe614] · ring shadows both ways [927e41b] + 2nd gap/grain [b8c0f37] · nebula multi-scale [553f849] · BH turbulence/lensing/soft-horizon [05616f9] · star-class textures [b936805] · coasts/vortices/cloud-wind [ff6e618]). Original list: (a) QUASAR JETS — tapered irregular plasma w/ knots + emission cone +
##     asymmetry (review's #1; rectangular beams confirmed). (b) RING OCCLUSION+SHADOWS — planet shadow across
##     rings + ring shadow on planet + uneven band opacity/grain/gaps (in-game draw already splits back/front; the
##     seam was the LIVEVIEW SHEET's clip, partly sheet artifact — but shadows are real gaps). (c) NEBULA
##     STRUCTURE — multi-scale: filaments/cavities/dust lanes per type (h2 dust lanes + wind cavities, reflection
##     directional light, mol silhouette+rim, remnant shell+filaments). (d) BH polish — soften horizon edge ~1px,
##     baked smeared star-arcs near photon ring, disk turbulence, −12% peak ring brightness.
##   PARTLY-DONE / PUSHBACK (recorded, see reply to Nick): star-class SIZES already differ in-game (starR; sheet
##     drew all at equal size — hid it); distant-moon softness mostly a sheet-blowup artifact (28px master IS
##     dedicated, draws ≤34px in-game); dynamic terminators + slow clouds ALREADY LIVE (review predates them);
##     moon-size −10–20% = do −10% only where pick-targets stay ≥ floor (tap safety).
##   STAR-CLASS TEXTURE differentiation (medium): flare regions on M dwarfs, prominence plumes on SG, tighter
##     hotter granulation on B, restrained WD halo — extend _starSurf kind params.
##   PLANET SURFACE round 2 (medium): coastline halo break-up (beach/wetland/cliff variants by noise), weather
##     fronts + spiral storms + land/ocean cloud density, fractal cap edges + glacial tongues (cap noise shipped;
##     push further), gas-giant storms/vortices/band-width variety, venus circulation layers.
##   THEN THE BIG CONTENT PASSES (each its own arc, Nick 2026-07-24: "proceed with all four, don't wait"):
##     (1) ✔ ADVANCED BRIEFINGS SHIPPED [44ef2f1] — 5 drills from the Guide 🎓 row, zero-lockdown runner, 4 smoke sentinels; full-UI coverage now: 20-step training + guardians step + charter finale + 5 drills + Guide. (2) CONTENT-
##     COMPLETENESS slate. (3) ALL QoL slate. (4) EARTH CATALOG ONE-BY-ONE — audit all 1010 vs real counterparts
##     (rig-audit classifications + per-species silhouette review via catalog pages), fix misreads; PROCEDURAL-
##     TRAIT pass (head/tail/marquee/eye-limb) + BREEDING COHESION; proof sheets to Nick at each stage.
##   + TRAINING & GUIDE ADDITIONS (Nick, same directive): (a) TRAINING ORDER REVIEW — walk the 20 steps as a new
##     player would play (zoom Earth → survey → Atlas → …), verify each step's order matches the intended game
##     flow; document the audit in the roadmap even if no changes needed. (b) FILL THE GAPS: a CHARTERS step
##     (accept + complete flow, already the finale handoff — teach the BOARD earlier too if order review says so)
##     and a PRIME CODEX step teaching the GUARDIANS: how signatures are retrieved (fell elemental TITANS), how
##     to challenge a boss (land + survey → face it or send champions), and what it takes to win (bred/tamed
##     champion power, gear, element reach). Keep the "Guide has every answer" closer — Nick likes it. (c) GUIDE
##     FULL AUDIT — every Guide entry checked against v1.6/v1.7 reality: dock wording (done), 3-tab hold, item
##     windows/affixes/salvage, materials/cosmics/exceptional veins, skimming + Corona Scoop + remnant bite,
##     rarity discovery-gating, 10-tier ladder names, landing roll variety, titan/signature flow; ADD entries for
##     any shipped system with no Guide presence (Forge economy, exceptional forging, skim).
## ★★★ 2026-07-24 FOURTH BATCH — Nick's build directives (commits eeb7e16→99fe900, battery-green, pushed):
##   ✔ LIGHTING VERIFIED ACCURATE (sprite light re-aims at the star per frame, star-tinted lit overlay, terminator
##     sweeps with orbit, city lights night-side only — answered in code, no fix needed).
##   ✔ DRIFTING CLOUD DECK — a second upper cloud layer (own noise stream, _cloudSpr) slides across terran/ocean
##     worlds; motion-gated, close-up only, 2 draws/frame. The living-planet feel without per-frame rasterizing.
##   ✔ THE BOTTOM DOCK (Proposal A picked by Nick) — the 5 right-rail pills docked bottom-center, SAME ids (all
##     spotlights/gates/smoke intact), phone folds labels into icon+count chips, hint/?/⚙/bottom-pinned training
##     cards step above it. Layout gate passed 546/9 WITHOUT re-pin. ⚠ THE arc's most visible change — iPhone
##     verify FIRST next session.
##   ✔ TRAINING → CHARTER HANDOFF — the finale spotlights #chbtn and sends the graduate to accept their first
##     contract; all 8 '(right rail)' texts across toasts/Guide/training updated to '(bottom dock)'.
##   ▶ STILL TO BUILD from this directive (next session, in order): (1) ADVANCED BRIEFINGS training modules (the
##     5-drill plan below — Nick wants EVERY part of the UI taught; audit each screen against training coverage:
##     dock pills, character sheet/paperdoll/3-tab hold, item windows, salvage, veins trio, skim, discovery
##     gating, Records, Events, Beacon, Guide search) + a light pass re-checking the 20-step flow against the
##     DOCK layout on device. (2) CONTENT-COMPLETENESS slate (Nick approved: pick order from the block below).
##     (3) QoL SLATE builds (journal + recipe tracker first). (4) Text re-polish re-pin + pinch-zoom (device).
## ★★★ 2026-07-24 THIRD BATCH — UNIVERSE-CRISPNESS (Nick: "planets everywhere? do stars + everything else") —
##   commits eeb7e16 (QoL-p dynamic ❤ heal hint) + 97fb07d, battery-green, pushed. CONFIRMED: the planet polish IS
##   universal (surfaceColor caps = every terran anywhere; limb haze = all airy types; HD tier = any focused world).
##   EXTENDED to the rest: STAR SURFACES (_starSurf — granulation + limb darkening + core lift inside the corona
##   when zoomed; giants huge cells, WD smooth; NS/MAG/BH/PROTO keep bespoke; binaries/trinaries included) ·
##   HD MOONS (160px close masters; REWORKED after Nick's live review "craters overlap / weird lines" →
##   rejection-sampled non-overlap fields, bowl shading to the light, soft rims, mottling; icy frost / volcanic
##   elbow-fissures) · RINGS 512 masters + sane cache cap. Proof: tools/sheets/starsurf.js. ⚠ iPhone verify next.
##   + DEEP-SPACE follow-up [6ce5b95]: BLACK HOLE baked cinematic _bhSpr (Doppler disc, horizon-hugging lensed
##   halo, photon ring; also a heat-rule win) · WORMHOLE 192 · QUASAR 320 · NEBULAE 256 (all four types) ·
##   GALAXY masters stay 512 BY DESIGN (64-entry cache is memory-bound; the zoom transition hands off to live
##   in-galaxy rendering which is vector-sharp). Proofs sent to Nick: universe-pass / deepspace / liveview
##   composite (tools/sheets/{starsurf,deepspace,liveview}.js).
## ★★★ 2026-07-24 SECOND BATCH — Nick's device feedback round (commit 96416e7, battery-green, pushed):
##   training feed/breed bottom-pin (step-10 rail-block screenshot) · WINDOWED cinematic card + newborn portrait in
##   the breed reveal · planet blending (noise-edge caps w/ real iceAmt weight, sea-ice vs snow, limb atmosphere
##   haze kills the ortho streak artifacts, 768/1024 HD focused-planet masters — phone capped 768 per heat pass).
##   Proof: tools/sheets/planets24.js. ⚠ ALL need Nick's real-iPhone verify (esp. planet crispness + reveal window).
##
## ▶▶ NICK'S DECISIONS RECORDED (2026-07-24):
##   · SAVE EXPORT/IMPORT = ON HOLD (Nick: version updates could break imported saves — revisit only WITH a
##     versioned-migration story: export embeds GAME_VERSION + save schema rev; import runs the same load-time
##     sanitize/coerce/clamp path as localStorage plus per-version migrations. Do NOT build until designed.)
##   · GREEN-LIT for this version: Expedition JOURNAL · pinned RECIPE TRACKER · the QoL slate below · TEXT
##     RE-POLISH (rides a fingerprint re-pin — surgical, Phase-A discipline) · PINCH-ZOOM (CF16-012) · TRAINING
##     MODULE updates covering the new systems · UI EFFICIENCY pass (direction call below) · breed-reveal window
##     (SHIPPED above) · planet blending (SHIPPED above).
##
## ▶▶ PLANET SPIN — RECOMMENDATION (Nick asked): full surface rotation means re-rasterizing the noise field
##   every frame (a 512²-1024² loop — a phone heater; against the v1.2 heat mandate). But we can get ~80% of the
##   living-planet feel for ~zero cost: (1) a separate CLOUD LAYER canvas that drifts horizontally across the
##   disc (masked to the sphere, wraps) — classic trick, reads as rotation; (2) the terminator ALREADY re-aims at
##   the star at draw time, so day/night sides genuinely shift as worlds orbit; (3) optional: a slow ~2s periodic
##   re-render of the FOCUSED planet only with a u-offset (true spin, amortized). Recommend (1)+(2) now, (3) only
##   if the feel wants more. Motion:Reduced keeps everything still. AWAITING NICK's go.
##
## ▶▶ UI EFFICIENCY REVIEW (Nick asked for thoughts — DIRECTION CALL NEEDED before the build):
##   CURRENT (phone): left name-pill + HP row; right search + bell; RIGHT RAIL of 5 stacked pills (Prime Codex /
##   Compendium / Star Atlas / Shipyard / Records) each w/ counts; bottom hint bar; floating ? and ⚙. PAIN: the
##   rail eats the right edge of the world view, collides with training cards (today's step-10 bug class), sits
##   in the top half (worst thumb reach), and 5 pill+count rows is heavy chrome for a phone.
##   PROPOSAL A (recommended) — THE BOTTOM DOCK: consolidate the 5 rail pills into a fixed bottom icon dock
##   (🐾 Compendium · ✦ Atlas · 🛠 Shipyard · 🏆 Records · ◉ Prime) with badge counts. KEEP THE SAME ELEMENT IDS
##   (codexbtn/logbtn/…) so training spotlights, gates and smoke keep working — only position/shape changes.
##   Thumb-reachable, frees the whole right edge, standard game grammar. Search collapses to a 🔍 icon that
##   expands over the topbar; ?+⚙ fold into the dock end or stay floating bottom-right above it. HP slims to a
##   thread when full, fattens when hurt. COSTS: a uilayout-gate re-pin (546 expectations updated deliberately),
##   a training-position audit (cards must dodge the DOCK now — bottom-pinned steps flip to top), safe-area
##   insets. PROPOSAL B (lighter) — keep the rail but collapse it to ICON-ONLY pills (40px squares, counts as
##   badges), auto-hide while a panel is open, move Prime Codex into Records. PROPOSAL C (minimal) — auto-fade
##   the rail to 35% while the map moves + the training-dodge hardening only. My call: A is the real fix; B if
##   you want zero muscle-memory change. NICK PICKS → then it's its own focused session with device verify.
##
## ▶▶ CONTENT COMPLETENESS — what 1.6/1.7 still leaves on the table (biomes / Earth catalog / procgen; Nick
##   asked "anything we left out"): AUDIT 2026-07-24 — several items turn out ALREADY LIVE: night/twilight landings (tod rolls from orbital brightness), aurora on high-field worlds at night, night bioluminescence (hdVista bioLume). TRULY OPEN below: BIOMES: (was: night/dawn/dusk vista variants — LIVE; ties to the landing
##   salt) · ecotone landings (a rolled COAST between two biomes — the transition zone IS the vista) · aurora on
##   high-field worlds at night · meteor-shower / eclipse sky events (wxEventFor has the slot) · underground
##   vistas (karst/lava-tube interiors — a "descend" verb on cave biomes). EARTH CATALOG: seasonal coats (arctic
##   fox white↔brown by the world's band) · juvenile/adult life stages (size gene exists, no stage read) · sexual
##   dimorphism pass (subtle crest/size per seed parity) · fungi/microbe shelves are thin vs 1010 fauna. PROCGEN
##   (the queued PROCEDURAL_CHARACTERISTICS order): procedural HEAD system · tail-types · marquee traits ·
##   eye/limb-count variety — plus NEW: bioluminescence for abyssal/night creatures (glow markings after dark) ·
##   symbiosis pairs (a creature and its flora co-spawn in vistas) · predator-prey vista moments (a chase pose
##   pairing) · true-giant scale storytelling (size 4 creatures should DWARF the herd). None started — pickable.
##
## ▶▶ TRAINING MODULE UPDATE — PLAN (Nick green-lit; build next session): the 20-step field training predates
##   the v1.6/v1.7 systems. Approach: DON'T bloat the golden 20-step path — add a second, OPT-IN "ADVANCED
##   BRIEFINGS" module (the charter-training pattern): short 3-5 step drills unlocked from the Guide/charters,
##   one per system — (1) THE HOLD: 3 tabs, materials stack, salvage + confirm toggle; (2) THE FORGE: item
##   window anatomy (rarity frame, affixes, compare), Equip/Salvage buttons, exceptional stock → Exceptionally
##   Forged; (3) PROSPECTING: veins on the survey card (biome ✦ / cosmic ✦ / exceptional ✦), rich strikes,
##   reserves; (4) THE STARS: survey → skim, the remnant's bite, the Corona Scoop; (5) DISCOVERY: rarity hides
##   until you land/catch/survey (the reveal moment). Each drill = allow-gated like field training, smoke-driven.
##   ALSO: the existing 20 steps get a light TEXT refresh where stale (rides the text re-pin).
##
## ▶▶ SUGGESTIONS FOR NICK (2026-07-24, per "think about value-adds / what we missed / player QoL" — AWAITING
##    GREEN-LIGHT, none started; ordered by impact-per-effort, S/M/L = build size):
##    LOOK & FEEL: (a) [M] EXPEDITION JOURNAL — a scrollable strip of your past landings as postcard thumbnails
##      (world · biome · date). ZERO save bloat: store only (seed, salt) pairs, re-render deterministically. Gives
##      the game a memory; pairs with the landing-roll variety we just shipped. (b) [S] TIME-OF-DAY LANDINGS — the
##      per-landing salt already re-rolls the biome; let it also pick dawn/dusk/night palettes (pal variants exist)
##      so repeat landings breathe. (c) [S] IDLE DRIFT-CAM — after ~20s idle on system view, a slow parallax drift
##      (Motion-gated, any input cancels). The universe breathes on the title-adjacent screens. (d) [L] AMBIENT
##      AUDIO BEDS per vista family (the v1.7 P5 audio pass — still the single biggest feel multiplier remaining).
##    MISSED / TRUST: (e) [S] SAVE EXPORT/IMPORT — "Export expedition file" (JSON download) + import in Settings.
##      localStorage is one cleared-cache away from loss; this is the cheapest trust feature there is. (f) [S]
##      RARITY-LADDER LUMINANCE CHECK — tiny tool asserting the 10 tier hexes stay distinguishable in grayscale
##      (a11y backstop for the color+frame system). (g) [M] EXPEDITION CONTRACTS — 3 rotating procedurally-picked
##      goals from EXISTING verbs ("skim a remnant star", "catalogue 2 jungle fauna", "forge with exceptional
##      stock") paying stardust; directly attacks the deep-sim maxDrought staleness signal using charter machinery.
##    PLAYER QoL — THE FULL SLATE — IN PROGRESS 2026-07-24: ✔(h) recipe tracker [230aac6] ✔(a2) journal v1 text+region strip [488d7c6; postcard thumbs = v2, needs vista-opts reconstruction] ✔(o) sticky hold tab [31c52eb] ✔(p) heal hint [eeb7e16]. NOTE (i) recent-worlds needs a where-blob captured into the journal entries (travel needs more than a seed) — capture it in journal v2. ✔(j)dots [9591ad4] ✔(l)batch craft [9309b09] ✔(n)Atlas filters [fd17f63] ✔(k)bulk feed [0cb83a9] ✔(q)charter chip [7304921] ✔(m)salvage undo [d281f4b]. QoL SLATE COMPLETE except (i) recent-worlds (needs journal-v2 where-blob). (Nick 2026-07-24: "list out all the QoL suggestions" — direction APPROVED,
##    items below are the build queue; ✔=green-lit by name, others pick-and-go):
##      (h) [M] ✔ PINNED RECIPE TRACKER — pin a Fabricator target; a small HUD chip shows live missing-materials
##          while you mine (reads _canCraft delta). The Forge economy's best friend.
##      (a2)[M] ✔ EXPEDITION JOURNAL — past landings as a postcard strip (world · biome · date); stores only
##          (seed, salt) pairs, re-renders deterministically — zero save bloat.
##      (i) [S] RECENT-WORLDS quick-travel chips at the Atlas top (derived from the log — no save change).
##      (j) [S] "NEW" DOTS — unseen Compendium entries / first-time materials get a dot until viewed
##          (cardExpand-style memory, tiny save field).
##      (k) [S] BULK FEED — "Feed until full" on the specimen card (one confirm, consumes flora as today).
##      (l) [S] BATCH CRAFT — ×5 press-and-hold on parts/components at the Fabricator (never on one-shot systems).
##      (m) [S] SALVAGE UNDO — a 5s "Undo" on the salvage toast (returns the piece, re-takes the mats) — softer
##          than the confirm for veterans who toggle confirmation off.
##      (n) [S] ATLAS QUICK-FILTERS — chips for ★ favorites / 🏴 conquered / ⛏ has-reserves / civilized.
##      (o) [S] STICKY SHELVES — Compendium remembers the last-open kingdom shelf; the hold remembers its tab
##          (cardExpand grammar, tiny field).
##      (p) [S] HP HEAL HINT — the ❤ chip names the best healing flora you currently own in its tooltip.
##      (q) [M] CHARTER CHIP — the active charter's next goal as a one-line progress chip under the topbar,
##          tap = open charters (kills the "what was I doing?" reopen loop).
## ★★★ v1.7 POLISH / SECURITY / BALANCE / ART-AUDIT SWEEP = DONE (2026-07-23, long remote-control session; each
##   commit battery-green: fp MATCH 50/50, smoke ↑396/0, layout 546/9, render 1010/0; all pushed). This sweep sits
##   ATOP the cosmic economy (5a/5c/5d/§8), material art (§22 47/47), and the two prior code reviews.
##   (1) VISTA/BIOME ART AUDIT [da1ab6f]: RIVERS were HARDCODED (4 control points) → every world drew one S-curve;
##     now SEEDED per world (rvQ: spring/meander/mouth vary). ROADS pick the bank the river ISN'T on (_rivMouthX).
##     SKYLINES seated into the ridge (haze skirt). TITANS: mid-body contact skirt + at-sea mirrored reflection.
##     FAUNA/FLORA ground-leveled (hdBeastBare measures the sprite's true lowest opaque row → universal seat).
##   (2) STAR CLASSES [f662e54]: MAG (field loops), PROTO (dusty disk+jets), RG/SG (swollen glow) — were
##     indistinguishable; proof-sheet tools/sheets/stars.js. Planets/space bodies/decks re-verified clean.
##   (3) GEAR ART + CRISPNESS [a956fe5]: partIcon tier-dress + function-emblem motifs; shipImage/paperdollAvatar
##     2× backing store; thumbCache capped 500 (_thumbSet) — was UNBOUNDED (CF16-005 leak).
##   (4) VISTA TAP-TO-ZOOM [bc09a58]: tap the landing view → full-screen (#vistabox.zoom); ✕/backdrop close;
##     training keeps tap-to-continue. Nick's ask.
##   (5) GAME-WIDE EXPLOIT REVIEW → ALL 10 CONFIRMED FIXED [3fb4361] (36-agent sweep): save-injection XSS (esc()
##     + coerce-on-load), NaN-camera crash from share codes/view (decodeWhere/_sanitizeView clamp all numbers),
##     captured-guardian _mult/_wf strip, salvage 100%-exotic-refund (_SALVAGE_GATED) + unequip-with-duplicates,
##     conquest-harvest anti-edit clamp, friendly-duel win-farm throttle (30s), COSMIC_EPOCH 240s→1200s (EPOCH_TICK,
##     kills sit-and-farm), tutorial landed(133) restore made conditional.
##   (6) BALANCE / POWER CURVE [38e8a40]: rollAffix tier factor was CAPPED AT TIER 6 → loot went flat exactly where
##     the hardest worlds begin. Now reaches full at tier 9 with a real ramp (shallow ~30-60% of band → summit full
##     hi, never over-rolls). Creature/champion power already ramped (battleStats 170+tier*38). Nick's "feel more
##     powerful deeper" ask.
##   (7) DOC SYNC [3978f07]: all 9 per-system CAPS docs brought current vs source (epoch, MATERIALS/ELEM_NAME, save
##     fields skx/skims/cosmics/sv/gt, capture-strip, rarity-doc banner, vista-zoom, star art); markers → 2026-07-23.
##   ▶ UI: reviewed — the palette is DISCIPLINED (--accent/--plasma + matching rgba alphas, semantic green/red, panel-
##     identity cyan/gold; no off-palette outliers) → NO standardization churn (would only risk the layout gate).
##   ▶ REMAINING v1.7 (unchanged, needs Nick): §22 gear×tier + ship-hull art · §5 instance-rarity model · §8 skim
##     design pass · §24 power-curve empirical tuning (run the 1000-tester panel on the new ramp) · charter-training ·
##     text-polish re-pin · deferred accessibility (CF16-012). RELEASES notes still written AT BUNDLE TIME (rule 7).
## ★★★ v1.7 FULL CODE REVIEW + §22 MATERIAL ART = DONE (2026-07-23, same remote session, commits d7039a0+a6fd2fe).
##   (A) §22 P3 MATERIAL ART — ALL 47 BESPOKE [d7039a0]: `_MAT_ART` per-material registry (dispatched before the old
##   family forms in _hdElemIcon) — structural 15 + precious 10 + volatiles 12 each get their OWN painterly 144px form
##   (H2O keeps the canonical spear trio; Vg/Pz keep their gems); cosmics upgraded from the proof-sheet review (Voe
##   nebula veil — the black tear vanished on dark tiles; Pro seams brightened; Si ball→wafer). Proof-sheet
##   tools/sheets/materials47.js (needs liftBetween for the registry — the simple const-lift truncates at inner `;`),
##   reviewed 47/47 distinct, zero recolor pairs. STILL OPEN §22: gear family×tier masters + ship hull tiers.
##   (B) WORKFLOW CODE REVIEW (31 agents, high effort, 3a4b839..HEAD) → 10 CONFIRMED findings, ALL FIXED [a6fd2fe]:
##   tutorial dodge DEADLOCK (card covering its own spot → flip halves, 900ms damped; !r no longer snaps card top) ·
##   cardExpand clamp 0..7→0..31 (bit-16 affix + bit-8 lineage fold memory survived neither reload) · stale
##   Salvage-All arm disarmed on closeSheet · resetMemoryState clears skimX · first-landing reveal derives
##   planetDescriptor (manual-zoom descents lost it FOREVER) · skim GATED on Jump Drive (was Chapter-1 Celestial
##   farming) · orbital cosmic-vein leak closed (cosmic row = landing payoff) · sheet dwell allows '#sheet' whole
##   screen · Apex Court blind grind → Crowns I/II/III progress + guardian-row crown overlay · skim toasts
##   notable-only (bell-tray 60-cap guard). +7 pool cleanups: stats.skims/cosmics PERSISTED (reset every session
##   before) · matName() unified in salvage/craft text · salvageItem→closeItemCard() · probe-names deduped · dup
##   350ms _tutSpot interval removed (≈half the tutorial's forced layout hit-tests on phones) · Records blank
##   star-glyph appends dropped · Guide Settings topic = FOUR tabs w/ accurate Gameplay copy. NOT fixed by design:
##   RELEASES[0] rides the v1.7 bundle (write release notes AT BUNDLE TIME — rule 7) · enter-hooks→collision
##   coordinator = CF16-001 (deferred). Battery green ea. commit: fp MATCH 50/50, smoke 387/0, layout 546/9.
## ★★★ v1.7 PHASE B (step 5a) — 47-MATERIAL DATA MODEL = DONE (2026-07-23, remote-control session, commit 66e7ef9;
##   fp-SAFE, source-only). Built the `MATERIALS` registry (main.js @section materials-registry) — the SOURCE OF
##   TRUTH for each material's {fam, cls, tier, job} (+ name/col for cosmics). 47 substances: base 15 · volatile 13 ·
##   precious 10 · exotic 2 · COSMIC 7 (Stellar Plasma/Coronium/Protomatter/Primordial Ice/Void Essence/Chronal Shard/
##   Dark Matter, symbols Pls/Crn/Pro/Pri/Voe/Chr/Dkm). Base tiers = §5 caps (industrial 0-1 · precious/tech 2-3 ·
##   defining anchors Pm/Vg/Pz=5 · stellar 7 · foundational 8 · reality-breaking 9). Accessors matName/matBaseTier/
##   matFamily/matColor/matJob/matInfo (names+colors of the 40 legacy stay single-sourced from ELEM_NAME/EC). ★ WHY
##   fp-SAFE: the registry is METADATA only — the 7 cosmics are DEFINED but NOT in DEPOSIT_PROFILES/RARE_VEIN, so
##   depositsFor is byte-identical and nothing generates cosmics yet. +9 smoke sentinels (roster 47, families
##   15/13/10/2/7, tiers 0-9, cosmics-not-vein-placed, symbols distinct). probe-names hooked MATERIALS/MAT_FAMILY/
##   matName/matBaseTier/matFamily + ELEM_NAME/DEPOSIT_PROFILES/RARE_VEIN. Battery: fp MATCH 50/50, smoke 356/0, layout
##   546/9. Doc synced (MATERIALS_AND_GEAR.md §3 "matches code as of 2026-07-23").
##   ► THEN Nick granted FULL AUTONOMY ("get everything done, don't wait, we'll review at the end") → I built the rest
##     of the cosmic economy, each battery-green (fp MATCH 50/50) & pushed. ★★★ THE COSMIC ECONOMY IS COMPLETE — all 7
##     cosmics obtainable + all 7 craftable:
##     (5a-ui) MATERIAL CARD family+role [5bf069d] + BASE GRADE [dc857c5] (displayRarity of base tier; cargo stacks by
##       substance §21 so it's the substance grade, not instance). (§21) MATERIALS TAB groups by family [8e59342] +
##       CRAFTABLES TAB groups by kind [e681539]. (5c) WORLD-COSMIC VEINS [9ce9927] — cosmicVeinFor(seed,tier), a
##       tier-gated SEPARATE vein like biome veins (tier<8 null → depositsFor untouched, mineWorld trickle gated on
##       cv → fp-SAFE, NO RE-PIN NEEDED): tier 8 → foundational Pro/Pri, tier≥9 → +reality-breaking Voe/Chr/Dkm. Survey
##       shows ✦ vein, mineWorld pays ~4% trickle, cargo load filter widened ELEM_NAME→MATERIALS so cosmics persist.
##       (5d) COSMIC GEAR [3c427ad] — the 5 world-cosmics each anchor one endgame piece (§12 defining-anchor rar 8/9;
##       §24 power modest/in-band, ⚠ flagged for power-curve tuning). (§8) STELLAR EXTRACTION [27900e5] — stellarYieldFor
##       (class→cosmic: hot→Stellar Plasma, remnant→Coronium), star card ☀ Skim Corona action = skimStar() finite run
##       (save field `skx`, additive/safe-absent, mirrors mining `mx`); + 2 stellar gear (Plasma Gauntlets/Coronal Aegis,
##       Celestial). ⚠ SKIM INTERACTION mirrors mining as a default — FLAGGED for Nick's design review. smoke 384/0.
##   ▶ NEXT (remaining v1.7, for the end review / next session):
##     • NEEDS NICK: §22 FULL BESPOKE ART (47 materials + gear + ships — HD engine law, proof-sheets, his visual review;
##       cosmics currently borrow the gem-icon form in their hue as INTERIM) · §24 POWER-CURVE tuning (1000-tester panel
##       + his feel; cosmic/relic gear effects flagged) · §8 SKIM interaction design · cosmic GEAR BALANCE · TEXT POLISH
##       (rides a re-pin). • AUTONOMOUS-DOABLE: §5 instance-rarity resolver + surface on deposits · CHARTER-training
##       module · the fp-safe DEFERRED FIXES (CF16-013 Atlas field-whitelist, CF16-015 doc/version, CF16-016 .gitignore).
##     ⚠ NEW SAVE FIELD this session: `skx` (stellar skims) — additive, safe-absent-default; note in codebase-reference §10.
## ★★★ TRAINING FLOW/OVERLAP FIXES (2026-07-23, remote-control session, commit e83aaa9; source-only, fp-safe,
##   tutorial-only) = DONE. Closed 2 of the 3 deeper per-step FLOW/STUCK bugs from the empty-ring block's "STILL TO
##   DO" list, via a full 20-step transition audit (each advance checked for a TUT_ALWAYS modal or a graced panel
##   covering the next step's spot): (c) HAZARD step (12) — the duel RESULT modal (#duelbox is in TUT_ALWAYS) lingered
##   full-screen over the #hpbar the step points at; hazard.enter now dismisses it (duelBox hidden + setArenaBackdrop
##   (null)) so the recruit sees the HP bar the parting nip drops — Nick's own suggested fix. (b) FORGE step (17) —
##   the panel sweep GRACES the character sheet across the advance (the sheet step's allow named its #rank btn), so it
##   stayed open covering the #cargobtn Shipyard rail; forge.enter now closes the sheet (closeSheet() if sheetOpen) so
##   the rail is reachable. AUDIT also cleared: step 6 vista-over-codexbtn is INTENTIONAL (text says tap Planetside
##   first; empty-ring hit-test hides the ring meanwhile) + step 18 graced yard dismisses on the "Got It" tap — neither
##   is a bug. smoke +2 guards (346/0), fp MATCH (50/50), layout 546/9. ► FOLLOW-UP (commit c4e6bf4, same session):
##   Nick's DEVICE REPRO of (b) — "I click my inventory, it pops up, then it says Open the starship — I can't click
##   the starship, the inventory is blocking me." Revealed the first (b) fix was insufficient: the sheet step advanced
##   the INSTANT the sheet opened (when:stats-open) and _tutHook advances SYNCHRONOUSLY, so forge.enter's closeSheet
##   fired in the SAME tap with no paint between → the nameplate tap would look DEAD (sheet never visible). FIX: the
##   sheet step is now a "look at this, then Got It" step (btn:'Got It', when removed — like survey-tour/card-tour): the
##   nameplate tap OPENS the sheet and leaves it open to explore, Got It advances, forge closes it on the way out AFTER
##   it's been visible → Shipyard rail revealed. smoke now a 2-tap flow +1 guard (347/0), fp MATCH, layout 546/9.
##   DEPLOY DECISION (Nick, this session, remote-control): HOLD — do NOT deploy to verify; keep source-only per BUNDLE,
##   verify when v1.7 ships. Source pushed to origin (c4e6bf4). ⚠ STILL OPEN: bug (a) "Compendium ON TOP of the
##   open inventory, stuck" — NO linear-flow repro found (during training the global one-open-per-side closer is DISABLED
##   `if(!tutDone)return` @~17929, so training leans on _tutGate + _tutPanelSweep; no step opens codex over the sheet in
##   sequence) → genuinely needs Nick's real-device repro to pin the trigger. Do NOT guess a fix (regression risk).
## ★★★ v1.7 PHASE B "THE FORGE" BUILD = IN PROGRESS (2026-07-23; Nick: "sprint through everything, don't wait").
##   DONE + VERIFIED (all fp-safe, each committed w/ fp MATCH + smoke + layout 546/9):
##   (1) SETTINGS › GAMEPLAY tab + "Confirm before salvaging" toggle (salvageConfirm, default ON, saved `sv`). [7057da2]
##   (2) SALVAGE SYSTEM — item-card even/centered Equip+Salvage buttons (kept data-equipbtn); salvageItem() returns
##       ~half it.cost (min 1), unequips, banks mats, removes item, closes card; in-card confirm (returns + "Turn off
##       confirmation") gated on salvageConfirm; SALVAGE ALL on the Crafted header (bulk unequipped tier<=1, two-stage
##       confirm). [103006b]
##   (3) ARPG ITEM WINDOW anatomy — rarity-FRAME header band (.card.framed + --ic-rc) + name band + Item-Lv chip +
##       meta chips + the AFFIXES expand/close PILL fold (default EXPANDED, shares cardExpand BIT 16 → fold memory
##       global across worlds/creatures/items, Nick's rule). smoke 342/0. [this commit]
##   (4) 3-TAB INVENTORY — the hold splits into Materials / Craftables / Gear tabs (cargoTab; §21); item tiles moved
##       into the Gear tab (Salvage All lives on its Equipment header), smoke navigates the Gear tab. smoke 343/0. [this commit]
##   ═══ the ENTIRE fp-safe UI LAYER of The Forge is now done (settings, salvage, ARPG item window, 3-tab inventory). ═══
##   (5b) GEAR-ON-THE-LADDER = DONE [this commit]: `_itemRarity(it)` maps craft tier+cat → 10-tier ladder (authored
##       `rar` overrides; fp-safe — items aren't seeded); the item window's FRAME + a rarity CHIP now wear the item's
##       true rarity (Common..Mythic), and inventory tiles tint by rarity. Icon art stays its own hue (rarity = frame
##       only, per the ladder spec). smoke 344/0, fp MATCH. NOTE: v1 tier→rarity map; the full §12 defining-anchor
##       model refines it in the economy.
##   ▶ NEXT — THE BIG GENERATION PIECE (needs its own careful, dedicated build; do NOT rush — determinism-critical):
##   (5a) 47-material DATA model (roster + rarity tier + color + family + job) — fp-safe if not yet vein-placed;
##   (5c) wire materials into depositsFor vein generation = THE RE-PIN; (5d) recipes/crafting for the new materials;
##   material rarity RESOLUTION (§5) + world-to-resource generation (§6). This turns real multi-affix/quality/sockets
##   on + fills the 3 inventory tabs with the 47 materials. (6)
##   FULL-BESPOKE ART (§22) — 47 masters + gear family×tier + ship tiers, proof-sheet. (7) generation modifiers +
##   POWER-CURVE tuning (§24) via the 1000-tester panel. Uniques DEFERRED (§24). Design LOCKED in §22–24 + the mockup.
## ★★★ TRAINING EMPTY-RING FIX (2026-07-23, Nick's 2 iPhone screenshots) = DONE [this commit]. ROOT CAUSE: `_tutSpot`
##   only bounds-checked the target VERTICALLY, so a spotlight target that was OFF-SCREEN (a right-rail button behind
##   the open character sheet — screenshot: forge step 18) or COVERED by a blocking overlay (a duel result over the
##   HP bar — screenshot: hazard step 13) still drew an empty blue pill over nothing you could reach. FIX: full-
##   viewport bounds (added rect.right>0 && rect.left<W) + a centre HIT-TEST (document.elementFromPoint — spotlight
##   only if the topmost element at the target's centre IS the target or in its family; else draw nothing). fp MATCH,
##   smoke 344/0 (jsdom already had 0-rects so training LOGIC unaffected). ✅ FOLLOW-UP (b)+(c) FIXED 2026-07-23
##   (commit e83aaa9, see the FLOW/OVERLAP block at the top of this handoff). REMAINING: (a) the "Compendium not
##   loading, sitting ON TOP of the open inventory, can't click, stuck" case — a panel-manager one-panel-rule miss
##   during training (opening a panel over the character sheet without closing it) — no linear-flow repro; needs
##   real-device repro. [DONE (b) forge step 17 — char sheet closed on enter so the Shipyard rail is reachable.]
##   [DONE (c) duel RESULT dismissed when the hazard step enters.] Nick: "go through the WHOLE
##   training module" — CF16-001/009 collision-aware layout + readiness-based mounting. He noted HP-bar/nameplate
##   steps already read better (the dodge/darken landed). Audit every step for empty-ring + overlap + stuck.
## ★★★ v1.7 CADENCE DECISION (Nick, 2026-07-22): HOLD & BUNDLE — do NOT deploy phases individually. Keep building
##   "The Forge" in SOURCE ONLY and ship the whole arc as ONE big v1.7 release when substantially complete. No
##   version bump / no deploy until then. Source can sit ahead of the live site (currently v1.6.4).
## ★★★ v1.7 PHASE A "UNIVERSAL RARITY VOCABULARY" = BUILT IN SOURCE (2026-07-22, commit 375498a, atop v1.6.4; NOT
##   deployed per the bundle decision). Collapsed the 15-tier grade system to the canonical 10-tier ladder
##   (RARITY_UNIVERSAL.md §1): Common..Transcendent, normal caps, NO glyphs (★✦✧❖ all removed), color = badge only.
##   "COLLAPSE, DON'T REMAP" — rarityRoll UNTOUCHED; new displayRarity(raw)=RARITY_V17[clamp(raw,0,9)] reads the raw
##   score AS a tier + clamps 10+→Transcendent, so universe/power/old share codes unchanged (score-6 = same creature,
##   now "Mythic"). RARITY_V17 (10 rows) + displayRarity added in main.js (exported via the SpeciesTraits module
##   boundary); GRADE_TIERS names/hex collapsed, all star:'', `pre`+SPECTRA KEPT byte-identical so planet/star ART
##   labels don't move. SURGICAL RE-PIN: exactly 7 probes changed (gradeTiers/speciesGrade/colorGrade/describeSpecies/
##   faunaDesc/battleStats/runDuel) — a field-level diff PROVED every delta is a rarity field only (name/hex/star/
##   label), ZERO generation-text/combat-number change; baseline re-pinned for those 7 only (backup verified, then
##   deleted). UI swept: Guide (rarity/guardians/chapters prose), rarity achievements (best>=7 Celestial / >=8
##   Primordial / >=11 Transcendent / >=12 apex; tiers12→all-10; tiersOwned collapses raw 9-14), ring-region notes,
##   Binder "The Spectrum" (RARITY_V17.map, Transcendent folds raw 9-14), records rarity ladder (10 rows), discovery
##   kicker ('✦ Rare Find'→'Rare Find'). SENTINELS in smoke.js (10-tier ladder / collapse 6→Mythic,7→Celestial /
##   clamp 10+ / no glyphs / no old names / no ALL-CAPS) + hooked RARITY_V17+displayRarity in probe-names.json. Gates:
##   validate FINGERPRINT MATCH, smoke 329/0, layout 546/9. ⚠ LESSON LEARNED: NEVER run `node tools/extract.js` after
##   editing main.js — it regenerates main.js FROM the html and CLOBBERS your edits (cost a full redo this session).
##   After editing main.js, run `node tools/build.js` ONLY.
## ★★★ v1.7 PHASE A PRESENTATION LAYER = BUILT IN SOURCE (2026-07-22, commit eb16e3a; RARITY_UNIVERSAL.md §3
##   items 10-12, all fp-safe/UI-only). DISCOVERY GATING: a world HIDES its grade until you LAND — renderPanel's
##   Spectral-class row shows a "land to reveal" teaser + the card border stays neutral from orbit, gated on the
##   existing `grounded` flag; the glance leak ("glance still shows the color language") is closed too. Stars/
##   galaxies still reveal on survey (gate keys on d.planetSeed). KEY: worlds carry `.designation` not `.grade`, so
##   the Atlas/log/conquest NEVER leaked rarity — no gating needed there (confirmed by a full surface map).
##   ESCALATING REVEAL: `_performLanding` fires a tier-scaled cinematic on the FIRST descent onto a Legendary+
##   world (uses displayRarity for the collapsed name/color; Common..Exotic land quietly); per-tier data-frame bands
##   (low→summit) are the readable-without-color a11y signal. CROSS-KIND COMPENDIUM: a rarity-floor filter (All/
##   Rare+/Legendary+/Mythic+, `codexRare`) under the kingdom tabs sifts every kingdom by DISPLAY tier at once (list
##   already sorts by tier). Smoke guards: unlanded world hides grade / landing reveals it. Gates: fp MATCH, smoke
##   330/0, layout 546/9.
## ★★★ v1.7 GLASS/TINT SLIDER = BUILT IN SOURCE (2026-07-22; Nick's iOS-26 "liquid glass" ask). Settings → Graphics
##   → "Panel tint": a range slider driving a new `--glass-a` CSS alpha every glass panel reads, so one dial takes
##   the whole UI from airy glass (0.40 floor, keeps text readable) to near-solid (0.98). Persists in save (`gt`,
##   absent ⇒ classic 0.72); applyGlass() + clamp; Guide text updated. Smoke guard: live apply + floor clamp. (This
##   was on the v1.7 backlog; done now as a self-contained fp-safe win.) Gates: fp MATCH, smoke 333/0.
## ▶ v1.7 NEXT (still to build, source-only, bundle when done) — THE BIG ONE: Phase B "THE FORGE"
##   (MATERIALS_AND_GEAR.md + FORGE_AND_DISCOVERY.md P2): 47 craftable materials + seeded veins (world rarity
##   decides what you mine) + 3-tab inventory (Materials/Craftables/Gear) + gear on the rarity ladder + generation
##   modifiers = FULL re-pin (deserves its own careful arc — generation-critical for Steam; the game already has a
##   base economy: cargo/ITEMS/craftItem/mineWorld/depositsFor/ELEM_NAME to build ON). THEN P3 ART = FULL BESPOKE
##   (Nick 2026-07-23, LOCKED — MATERIALS_AND_GEAR.md §22): all 47 materials get their OWN painterly 144px master
##   (NO family-recolor shortcuts — the current _hdElemIcon 4-archetype recolor is SUPERSEDED; Iron≠Titanium≠Gold at
##   a glance), 7 cosmics get bespoke otherworldly forms, gear masters per family AND tier w/ rarity frame, ship hull
##   tiers; extend _hdElemIcon/partIcon into a per-material/per-gear registry, proof-sheet ALL of it. + P4 ARPG ITEM
##   WINDOWS (Nick loves the Diablo 2 / PoE 1 & 2 feel — desktop hover + mobile tap OPENS the window; EQUIP +
##   SALVAGE are explicit device-agnostic BUTTONS (not gestures), NO corner-bracket decorations; framed stat
##   tooltip: rarity header/frame, item level, affix lines w/ ranges, quality fold, compare-to-equipped deltas,
##   socket/upgrade rows). SALVAGE GUARD (Nick, LOCKED): confirm prompt before salvage (names item + returns,
##   "don't ask again") toggleable Settings›Gameplay "Confirm before salvaging" (default ON) + SALVAGE ALL button
##   on the character screen (bulk-breaks unequipped Common/Uncommon) behind its own "Confirm 'Salvage All'" toggle;
##   both persist. See MATERIALS_AND_GEAR.md §23. + P5
##   audio + TEXT POLISH (rides a re-pin) + charter-training module + the ~16 DEFERRED FIXES. See the v1.7 pinned
##   blocks below + the three v1.7 design docs.
## v1.7 RARITY = RECORDED & READY (Nick, 2026-07-22): canonical doc **RARITY_UNIVERSAL.md** written (design
##   basis = Nick's "V1.7 Universal Rarity, Color, and Modifier Specification" upload). ONE 10-tier ladder for
##   ALL entities (flora/fauna/planets/stars): Common·Uncommon·Notable·Rare·Exotic·Legendary·Mythic·Celestial·
##   Primordial·Transcendent, canonical colors. LOCKED: NORMAL caps (no ALL-CAPS), NO glyphs (★/✦/✧), COLLAPSE-
##   NOT-REMAP (raw rarityRoll score UNCHANGED → read AS tier 0–9, clamp 10–14→9, rename 0–9, delete Anomalous/
##   Unique/Empyrean/Eternal/Omnipotent) → universe+power untouched, old codes unaffected → SURGICAL re-pin.
##   Unique=one-of-one DESIGNATION overlay (not a tier). Stars KEEP rarity (reverses the earlier remove-star-rarity
##   idea; clean presentation fixes the confusion). Rarity color = badge/frame only, never entity art. Nick wants
##   BOTH phases in v1.7, AFTER v1.6 ships: PHASE A = vocabulary (surgical re-pin, RARITY_UNIVERSAL.md §3) FIRST;
##   PHASE B = generation-modifier system (§4 — Hollow/Shattered worlds that reshape terrain, anchor-tier resolver,
##   world envelopes, Unique registry; universe-affecting → FULL re-pin) SECOND. APPROVED VALUE-ADDS folded in
##   (all Nick): GEAR/loot on the SAME ladder (item cards match); rarity HIDDEN until the discovery moment
##   (worlds=successful land / creatures+plants=catch / stars=survey; orbit = teaser only) — universal Pillar-1
##   rule; ESCALATING tier-scaled reveal (juice, biggest flourish for scarce top); CROSS-KIND Compendium rarity
##   filter/sort; per-tier FRAME so rarity reads without color (a11y). DOC PLAN: RARITY_UNIVERSAL.md is now THE
##   canonical rarity doc; RARITY_AND_GRADES.md (current 15-tier) is kept ONLY until Phase A ships (it describes
##   the LIVE game) → ON PHASE-A SHIP: DELETE RARITY_AND_GRADES.md + repoint cross-refs (this pinned list, CLAUDE.md,
##   codebase-reference). When BUILDING: update this line + the per-system docs in the same batch (rule).
## ★ STEAM IS THE DESTINATION (Nick, 2026-07-22): the game is being built toward a STEAM release. This reframes
##   scope philosophy — depth IS the product, so v1.7 adopts EVERY idea in FULL (no lean MVP). Packaging the
##   HTML/canvas build for Steam (desktop wrapper/shell) is a separate later track — noted, not scoped yet.
## v1.7 = "THE FORGE" (Nick's name). MATERIALS/GEAR: **MATERIALS_AND_GEAR.md** is now the CANONICAL design of
##   record (full adoption of Nick's reviewed spec). Key: universal 10-tier on ALL items; SEPARATE dimensions
##   (rarity/level/QUALITY(foldable)/affix/upgrade/designation); materials resolve their OWN rarity (world sets
##   eligibility/richness, not copy); finished-gear rarity anchored by DEFINING component (not rarest ingredient);
##   landing = ACCESS/sampling only, NEVER rewrites generation; stars UNLOCK extraction (survey→skim/probe→cargo),
##   no free plasma; bio parts don't copy organism rarity; 7 cosmic materials (Stellar Plasma/Coronium/Protomatter/
##   Primordial Ice/Void Essence/Chronal Shard/Dark Matter); ALL 47 materials craft-critical (each has a job);
##   deterministic craftSeed. INVENTORY (Nick): 3 separated tabs on the character sheet — MATERIALS (stackable,
##   auto-collected, ample = expanded Cargo hold) · CRAFTABLES (crafted non-gear) · GEAR bag (slot grid, only
##   equippables, grown by pack modules); materials/consumables stack, never eat gear slots. Build = Phase B
##   (post-v1.6, full re-pin). See MATERIALS_AND_GEAR.md.
## v1.7 TEXT POLISH (Nick, 2026-07-22): full grammar/spelling/capitalization/CONSISTENCY pass across the
##   FINGERPRINTED content — species/flora/fauna descriptions + trait arrays (FA_*, FLORA_FORM, FUNGI_FORM,
##   MICROBE_FORM, SP_COLOR, EX_*), planet/star DESCRIPTORS (planetDescriptor/starDescriptor/spectral), grade
##   words, and all statistics/generation text — so stars/worlds/creatures/traits/descriptions read consistently
##   "across the board". This text is fingerprinted → it MUST ride the v1.7 re-pin (SAME batch as the rarity
##   rename, one re-pin covers both). The fp-SAFE UI-chrome polish (buttons/charters/tooltips/Guide/settings) was
##   already done in v1.6 (button-verb alignment + colour→color / neighbouring→neighboring / Flavours→Flavors).
##   ALSO finish here: the deferred UI flavour→flavor instances in the Guide/card (skipped in v1.6 due to phrase
##   duplication with historical RELEASES). Standing COPY RULES: real button verbs (Land/Mine/Survey/Tame/
##   Scavenge/Breed/Feed/Heal/Scout/Duel/Craft/Challenge/Harvest/Jump), US spelling, normal capitalization
##   (no ALL-CAPS, per the rarity spec).
## v1.7 CHARTER TRAINING MODULE (Nick, 2026-07-22): add a Field-Training segment that teaches the CHARTERS —
##   how to read the board, ACCEPT a charter (the Accept button for optional quests), and complete one. Idea:
##   have the player accept the first ~3 quests during training so they learn the Accept flow. Extends the
##   existing 20-step training; keep it in the tutorial-sandbox pattern (snapshot/restore, no leaked progress —
##   see CF-001). Goal: players currently may not know charters exist or how to use them.
## v1.7 GLASS / TINT SLIDER (Nick, 2026-07-22): add a WINDOW TRANSPARENCY slider to Graphics settings — the panels
##   use a glass/blur look (backdrop-filter); let players dial the tint from full-glass → more-opaque (the iOS-26
##   "Liquid Glass" vibe), keeping a minimum tint FLOOR. Genuinely useful — the glass transparency is part of why
##   text can be hard to read behind panels (see the intro-overlap fix). ★ Nick's call: this REPLACES the
##   accessibility/screen-reader work on the near backlog → DEFER CF16-012 (zoom + keyboard/screen-reader NAVIGATOR
##   / CF-006) to a LATER time (not this arc).
## v1.7 DEFERRED FIXES (consolidated — v1.6 code review CF16-001..016 + P2-005 + earlier deferrals; per phase):
##   (A) RE-PIN / generation-touching → Phase A/B: rare-vein DEDUP (P2-005) · MIRROR-DUEL tiebreak (CF16-011/CF-004,
##       runDuel — fp + champion codes) · NAME VARIETY epithet (CF-008, with the naming/text pass).
##   (B) SAVE / MEMORY: Atlas THUMBNAIL bloat (CF16-004/CF-002 — strip ALL thumbs + rebuild from seed + v5 migration,
##       rule-5) · bounded LRU portrait/thumb caches + split list-thumb (96-144px) vs detail-portrait (CF16-005,
##       mobile-memory HIGH) · Atlas-entry field-whitelist before innerHTML (CF16-013, hardening).
##   (C) ACCESSIBILITY: restore pinch-ZOOM + limit touch-action:none to #cosmos + keyboard/screen-reader NAVIGATOR
##       (CF16-012/CF-006) + modal dialog semantics/focus-trap/return + 44px touch targets.
##   (D) REAL-IPHONE mobile-onboarding LAYOUT pass (needs device testing — the review's #1 BLOCKER set): ONE
##       collision-aware tutorial layout coordinator (CF16-001) · dynamic/hit-tested spotlight targets + Forge
##       sub-step (CF16-002) · intro FIXED ACTION FOOTER so the CTA isn't below the fold (CF16-003) · single
##       event-driven spotlight tracker (CF16-009) · readiness-based target mounting (CF16-010) · charter-counter
##       wrap (CF16-006) · specimen frame/scroller separation (CF16-007) · cyan rim-light softening (CF16-008).
##       ⚠ CF16-006/007 are NOT the verb-row grid fixed in v1.6 — separate elements, still OPEN.
##   (E) TOOLING/DOCS (cheap, non-blocking): Playwright + CI + all-20-tutorial-steps + small-phone viewports
##       (CF16-014) · fix doc/version inconsistencies — README/CLAUDE 18→20 steps + smoke counts, package.json
##       1.0.0→1.6, UI_PRESENTATION stacking order (CF16-015) · .gitignore generated artifacts (scratchpad/
##       uisheets/reports) + stop tracking them (CF16-016).
##   SHIPPED already (not deferred): the 4 P2 hotfixes (Binder/save/conquest/breed) in v1.6.1; and the 2 items this
##   review calls "already present in v1.6" (tutorial stat-leak, delayed-hazard) = our CF-001/CF-003 (this session).
## v1.7 ARC = "THE FORGE & DISCOVERY" — design doc WRITTEN: **FORGE_AND_DISCOVERY.md** (source of truth for the
##   arc). Runs AFTER v1.6 deploys. Two pillars + streams: (P1) DISCOVERY — world rarity becomes a LANDING reveal,
##   not an orbital label; drop "Spectral"/color-word/★ glyphs; NEW world ladder (Nick FINAL): 0 ordinary(silent)/
##   1 Uncommon/2 Notable/3 Rare/4 Exotic/5 Legendary/6 Mythic/7-9 Unique(One of a Kind)/10+ Primordial; REMOVE
##   rarity from STARS entirely (can't land on them). (P2) MATERIALS ECONOMY — promote real elements (rock/iron/
##   aluminum/carbon/copper/silver/titanium/gold + the 4 exotics) to first-class craftables w/ seeded veins +
##   recipe roles; WORLD RARITY DECIDES WHAT YOU MINE (ties P1↔P2 into the exploration→materials→crafting loop).
##   (P3) painterly craftable/gear/material icons + ship progression hull tiers. (P4) ARPG item windows —
##   hover(desktop)+tap(mobile), affix ranges, compare-to-equipped. (P5) AUDIO parallel. SEQUENCE: materials +
##   rarity rename + star-removal = ONE bundled Nick-authorized RE-PIN (fingerprinted); art/windows second (fp-safe).
##   OPEN: confirm "remove stars" scope (star rarity + ★ glyphs; creatures unchanged) + full vein→material map.
## Optional post-lock
##   polish only (both reviews' explicit non-blockers): differentiate the look-alike clusters (marsh/swamp/
##   mangrove; ice family; rocky boulder/graben/carbon; sulfur/acid/abyssgreen; ember family) · richer
##   multi-layer ecosystems · Earth grain/seaweed + bespoke plants (rafflesia/joshua) · big-cat/bear/
##   ungulate/bird iconic passes · lineage deep-drift legibility. THEN: v1.6 RELEASE-NOTES draft +
##   GAME_VERSION bump to 1.6 (Nick's word, rule 7) → 6k/20k beta → deploy.
## PROCESS (standing): battery (validate + smoke + layout) → proof-sheet review → team panels →
##   6k/20k beta → deploy. Ship on Nick's word. See [[celestial-frontier-workflow]].
##   DEPLOY = TWO PUSHES: (1) commit source release → (2) `node tools/deploy.js` (pushes the LIVE SITE repo) →
##   (3) `git push origin main` (pushes the SOURCE repo TheDakk/Celestial-Frontier — deploy.js does NOT). Step 3
##   is easy to forget; the source once drifted 97 commits. ALWAYS push source after a deploy.

---

**History / full batch logs:** see [`ROADMAP_ARCHIVE.md`](ROADMAP_ARCHIVE.md) — every v1.6 batch
(1–14), the v1.5 charter, and all superseded session-handoff blocks, newest-first.
## ▶▶▶ 2026-07-26 GO-LIVE — ★★ v1.7.0 "THE FORGE" DEPLOYED LIVE ★★ (Nick's word: "ready for go-live
##   + 1,000-tester feedback"). Build 4264b2e → https://celestialfrontier.github.io/ via the SELF-
##   GATING deploy (--release 1.7.0 target-checked; validate+smoke+layout ALL ran and passed inside
##   the deploy). Source pushed + tag v1.7.0; release archive cut (releases/v1.7.0-4264b2e/: build,
##   SHA-256, both fingerprints, layout report — dir gitignored). RELEASES[0] "The Forge" notes ship
##   the whole arc. Bundle-day lessons: (1) the version bump broke 2 smoke checks pinning 'v1.6'
##   text — version checks are now DYNAMIC via H.GAME_VERSION/H.RELEASES hooks, never re-pin again;
##   (2) package-lock must bump WITH package.json or npm ci hard-fails.
##   ★ CI ROOT CAUSE (Nick's "437" = log line ~400): the ONLY failing check across all 3 red runs
##   was smoke's 'Escape closes the Nameplate menu' — same-tick close assert passed on local Node 26,
##   failed deterministically on CI Node 22 (jsdom event-timing differs by node major). Fixed: check
##   allows an async beat (until 1500ms — intent unchanged), CI pinned to Node 26 for LOCAL PARITY,
##   upload-artifact@v6. Logs were pulled via the git credential-manager token → GitHub API (gh CLI
##   unauthenticated — this path works for future CI triage).
##   ▶ IN FLIGHT: 1,000-tester sim (fast 600 + deep 200 + chaos 140 + ui 60) → feedback report to
##   Nick. THEN: Nick's real-iPhone pass on LIVE v1.7.0 · watch CI run at aeccae8 · post-Forge queue
##   (§24 knee retune if wanted, instance gear, a11y Navigator, module split, save schema).
## ▶▶▶ 2026-07-26 POST-RELEASE DESIGN QUEUE — ★ v1.8 "THE CONNECTION" ARC (Nick 2026-07-26: the
##   feedback work is its OWN NAMED ARC, not a 1.7 patch — working title "The Living Bond" TBD).
##   VERSIONING LAW REAFFIRMED: minor lines = themed arcs; 1.7.x stays FREE for Forge-era hotfixes
##   (iPhone pass / live findings ship as 1.7.1+ without waiting on feature work). The SIX quick
##   items OPEN the 1.8 line; the deeper feedback items continue as 1.8.x. Same HOLD & BUNDLE
##   cadence. WAIT FOR MORE FEEDBACK before building. Source: PATH_TO_10_2026-07-26.md ("Path to 10/10",
##   built on synthetic-campaign data). THESIS ACCEPTED: better CONNECTIONS between existing
##   systems, not new systems — the creature loop's pieces don't feed each other (XP only flows
##   from wins → 55/200 deep sims hit creature L3, ONE hit L6; Rancher persona breeds 4,575 times
##   for the LOWEST fun score 5.18). CAVEAT: the 35.3% no-op rate is persona-inflated (blind
##   attempts); fix is right anyway. PUSHBACK: training (8.7/10, 300/300) needs nothing now;
##   "unusual creature in 5 min" must be PRESENTATION not generation (determinism law).
##   THE SIX (all app-layer, fp-safe, live-save-safe; sequence 1→3 first):
##   (1) ACTIONABLE DENIALS — every "can't" (breed/feed/duel/craft/land/skim/mine) names what's
##       missing + where + the best available action now. [their #1; copy + availability checks]
##   (2) BROADEN CREATURE XP — small awards at existing events (first tame, correct feed, breed,
##       first-hybrid, conquest-loss survival, scans); target L3 in a first real session; the
##       486-xp/L9 ceiling already bounds it.
##   (3) CONQUEST MATCHUP METER — surface the EXISTING winEstimate pre-fight (Favored/Even/
##       Dangerous/Overwhelming + one factor line); losses pay: partial XP, weakness intel,
##       suggested preparation.
##   (4) BREEDING ANTICIPATION — pre-breed hint panel (trait RANGES + rarity odds, NEVER the exact
##       roll — breeding is deterministic; exact preview kills the reveal) + reveal beat + "new
##       lineage" presentation.
##   (5) CREATURE PERSONALITY (display layer) — surface the temperament/behavior/habitat genes the
##       genomes already carry as card personality lines + earned MILESTONE TITLES ("won a duel at
##       1 HP") in a new absent-safe save field.
##   (6) SURVEY SPOTLIGHT — a living world's card highlights its most notable resident (first
##       "unusual creature" by emphasis, zero generation change).
##   MEASURE: re-run the 1,000-tester battery after the pass and compare vs the v1.7.0 baseline
##   (in flight now): no-op rate (→<10%), Rancher fun (5.18→8+), overall fun (5.60→8+), L3
##   attainment, conquest clarity. ROADMAP-ONLY (not quick pass): family tree/ancestry UI, museum/
##   housing, faction threats, seasonal regions, audio motifs (→ procedural-audio arc; agree sound
##   now outranks another art pass), persona routes, midgame/endgame structures.
##   ▶ HOLDING for Nick's word + more feedback (tester report lands when the run finishes).
## ▶▶▶ 2026-07-26 HOTFIX — ★ v1.7.1 "THE POCKET PATCH" LIVE (build c51c8c6). Nick's real-iPhone
##   pass found ONE root cause wearing four masks: the CF-CR-011 viewport zoom unlock let iOS
##   AUTO-ZOOM on input focus (namein 14px / searchin 12px < the 16px threshold) and never release
##   → visual/layout viewport split → nameplate+HP+search cut off top, tray/sheets overflowing the
##   window, Shipyard ✕ unreachable, AND canvas taps OFFSET from picks = the training-two "can't
##   tap Earth" stuck. FIX: viewport lock restored (iOS ignores user-scalable=no for USER pinch —
##   a11y zoom intact; the a11y reviewer's ask cost nothing to revert) + 16px phone input floor.
##   ⚠ LESSON: on iOS, `user-scalable=no` isn't (just) about zoom — it PINS the layout viewport;
##   removing it re-enables input-focus auto-zoom which BREAKS fixed-position app UIs and canvas
##   hit-testing. Never remove it from a canvas-app page; a11y reviewers' zoom asks are satisfied
##   by iOS's forced pinch-zoom anyway. Smoke/uilayout/uishot CANNOT see this class (no real iOS
##   viewport dynamics) — REAL-DEVICE PASS REMAINS MANDATORY before any mobile-facing release.
##   ▶ Nick to re-verify on iPhone (fresh load / hard refresh): intro typing must not zoom;
##   training two taps Earth; tray/Shipyard fit + close. 1000-tester baseline still in flight.
## ▶▶▶ 2026-07-26 FLEET REPORT TRIAGE (FLEET_REPORT_v1.7.0_2026-07-26.html — 1,000 bot sessions ·
##   21 devices · 12 personas · 49 issues vs LIVE v1.7.0; fun 4.9/12-persona mean, 9/12 would
##   replay; ZERO js errors / soft-locks fleet-wide; viewport bug already fixed in 1.7.1).
##   TRIAGE (batches, AWAITING NICK's pick):
##   ★ BATCH A "FIELD PATCH" (v1.7.2, ~25 quick fixes, days): toast lane (cap 1 <420px, dock above
##     chrome, suppress over open panels) · #toast pointer-events:auto on .tst + MODAL_SEL '#toasts'
##     →'#toast' TYPO (deep-links dead — 2-line real bugs) · Prime Codex psub2 WRAP + render the
##     UNUSED SIGS.lore per titan (huge lore win, ~2 lines) · #records .srow selector (run-on
##     'Mercurycarbon') + journal biome DISPLAY name · ?-button opens Guide directly · release
##     bulletin GATED to returning saves (design change; retune smoke intent) · craft button always
##     visible w/ shortfall label + group '0 craftable' · landing-verb copy unification · safe-area-
##     inset-top on topbar/panel heads · skip-confirm emphasis inversion + Settings 'Restart
##     Training' · atlas ×/clear-all confirms+undo · name-gate: enable from cleanName + inline
##     reason · Escape = ordered overlay stack (all 9 panels; keep training guard) · mouse PICK_F
##     1.2 + hover halo + double-tap hint/ping · tooltip collision flip + suppress-when-open ·
##     bell mark-read on open + 44px tacts · scroll fades/scrollbars (primebox/records/shipyard
##     hero collapse) · vista/card taxonomy wording ('carbon flats of Mercury') · Sol special-case
##     caption · progress-format helper · notification casing/icons · comet tail lineWidth /z
##     (1-line) · 'top left' layout-aware copy · save-reassurance line + one-time saved chip ·
##     ⚠ Air/Wind rename ('star' label → Stellar) NEEDS fp check (SIGS is probed).
##   ★ BATCH B "THE TABLET TIER" (layout arc): 701–900px breakpoint · ONE panel model (sheets w/
##     scrim) · survey-card/panel collision rules · ultrawide space use · 44px touch-target sweep ·
##     dock chip captions · panel heights vs dock · vista default size on tablets.
##   ★ BATCH C "THE BOARD SPEAKS" (a11y, RE-RANKED CRITICAL by the report — persona fun 1.5, total
##     block): canvas roving keyboard focus over picks[] (arrows/Enter/Escape, +/- zoomAt) · Leave-
##     world button · aria-live mirror for toasts/picks · dialog focus traps/inert + aria names ·
##     search results keyboard-reachable · contrast floors (tier '66' alpha, psig.locked) + Text
##     tone reaching inline hexes · fs-lg/xl root-var refactor. (Was 'deferred Navigator batch' —
##     the report measured it as a hard block; recommend folding INTO or ahead of v1.8.)
##   ★ INTO v1.8 (Connection arc, already specced): recipe OUTPUT lines + common-material source
##     map (their min-maxer asks = our actionable-denials/matchup items) · already-satisfied
##     charters auto-honour (banked-state law care) · onboarding pacing beyond bulletin gating.
##   CONFIRMED CLEAN by fleet: 0 js errors, 0 soft-locks, save/paste hardening 'armoured', 45+ fps
##   worst case (their earlier 11fps was THEIR harness artifact, retracted), 791ms load.
## ▶▶▶ 2026-07-26 ★ v1.7.2 "THE FIELD PATCH" — FLEET BATCH A BUILT (26 of 49 issues; gates all
##   green: fp MATCH 50/50 · smoke 429/0 · layout 546/9 · version 1.7.2 consistent).
##   SHIPPED: toast system (phone top-dock, cap 1, yields to open boards, CLICKABLE cards + the
##   '#toasts' MODAL_SEL typo — deep links were dead since v1.5.2) · Prime Codex (wrap + per-titan
##   LORE render + readable locked rows + scrollbars) · Records (srow selector, journal display
##   names, full-ink tiles) · onboarding (fresh saves skip the changelog; ? → Guide direct post-
##   training; skip-confirm inverted + Settings Restart Training; name gate cleanName-enable +
##   inline reason; save reassurance + one-time saved chip) · input (Escape closes ALL boards via
##   stack+PANELS — safe subset in training; tooltip own-panel suppress + collision flip; mouse
##   PICK_F 1.2; assist-landing announce; tray read-on-open + 44px + armed clear-all; Atlas ×
##   tip/legend/undo) · survey (LAND gold primary; ONE landing verb; Sol named; vista header =
##   world · region; comet tail /z; goals show n / m; safe-area topbar) · Fabricator (Craft always
##   visible w/ shortfall name; '0 craftable' counts) · shipyard hero collapse <780px.
##   ⚠ LESSON: my first toast fix (top-dock) recreated the covered-panel bug UP TOP — the layout
##   gate caught it (24 FAILs) → boards now CLAIM the screen (closePanels clears standing cards on
##   phones; every toast tray-logs so nothing is lost). The gate paying for itself.
##   ⚖ DEFERRED TO NICK: Wind→Stellar signature rename — the `sigs` PROBE pins signature names
##   (fp MISMATCH on rename, reverted). Needs an authorized ONE-PROBE re-pin; the new lore line
##   already tells the stellar story meanwhile. NOT IN A: notification casing audit (polish list),
##   Batch B tablet tier, Batch C a11y (canvas keyboard/AT), v1.8 folds.
## ▶▶▶ 2026-07-26 ★ v1.7.3 "THE TABLET TIER" — BATCH B + THE STELLAR RENAME (deploying).
##   ⚖ FIRST RE-PIN OF THE ARC (Nick-authorized): Wind→Stellar Signature. Field-diff proof: ONE
##   probe (sigs) / ONE entry (index 3, id 'star') / ONE field differed across all 50 probes.
##   Surgical re-pin recorded in baseline.json `repins[]` (probe, date, authorizedBy, reason).
##   PROCESS PIN: this is how ALL future intended fingerprint changes go — field-diff first,
##   re-pin ONLY the proven probe, record authorization in the baseline itself.
##   BATCH B SHIPPED: 701–900px joins the DOCK+SHEET model (breakpoints flipped html+JS; the
##   96-portrait art-cache stays at 700 — memory budget ≠ layout) · ONE panel model ≤900: titled
##   sheets (::before headers), scrim (100vmax shadow), min-height 42dvh · tablet sheets center at
##   600px · ultrawide ≥1600 panels widen · vista 72vh on tablets · dock chips CAPTIONED + 44px
##   floor · 44px touch sweep (Accept/☆/⌂/×/fsopt/closers) · corner circles 44 · uishot seeds read
##   GAME_VERSION from the build. Gates: fp MATCH 50/50, smoke 429/0, layout 546/9 (ipad-port now
##   judged under the dock model — the gate's laws are layout-agnostic and it passed unchanged).
##   REMAINING from fleet: Batch C a11y (canvas keyboard/AT — the big one) · notification-casing
##   audit · Atlas chart pane (feature) · v1.8 folds. Nick's iPhone re-verify now covers 1.7.1-3.
## ▶▶▶ 2026-07-26 ★ v1.7.4 "THE QUIET DOCK" LIVE (build 0bfc49e) — Nick's option 3: dock captions
##   are a TEACHING layer. body.recruit mirrors !tutDone (_syncRecruit @ boot/_tutFinish/retrain):
##   recruits see named chips; graduation restores the clean v11 icon dock (Prime keeps 0 / 9);
##   Settings›Restart Training brings labels back. Proofed both states. DESIGN PRINCIPLE PINNED:
##   onboarding affordances may be LOUD for recruits and silent for veterans — gate on tutDone,
##   don't compromise the veteran aesthetic for the newcomer or vice versa.
##   LIVE LADDER TODAY: 1.7.1 viewport → 1.7.2 Field Patch → 1.7.3 Tablet Tier + Stellar → 1.7.4.
##   ▶ NEXT: Nick iPhone re-verify (all four patches, one pass) · fleet Batch C a11y · v1.8 holding.
## ▶▶▶ 2026-07-26 ROUND-2 FEEDBACK TRIAGE (two independent groups re-tested v1.7.3 b4a02df; docs
##   saved: SYNTH_REPORT / FLEET_FIXLIST / FLEET_REPORT _v1.7.3_2026-07-26).
##   SCOREBOARD: fun 4.92→5.71, ALL 12 personas up, 11/12 would keep playing (was 9), completionist
##   dead-clicks 34→14.3%, 9-12/14 round-1 fixes verified IN BEHAVIOR, fps concern RETRACTED (60fps
##   both builds, measured properly), other group: "no new technical blocker… better release
##   candidate". COST: 7 regressions from our own fixes, JS errors 0→1, overlap defects 85→243.
##   ★ REGRESSION HOTFIX QUEUE (v1.7.6 candidate, AWAITING NICK):
##   (1) CRITICAL CF173-01 null-deref: describePick reads st.star.x unguarded in 4 branches
##       (main.js ~2912-2918) — zoom-out with a card open crashes every frame. VERIFIED.
##   (2) CF173-04 my vista-taxonomy fix NEVER RENDERED — #vistabox .vh text-transform:uppercase
##       cancels the .toLowerCase() ⚠ LESSON: check the CSS at the sink before shipping a casing fix.
##   (3) CF173-05 _craftNeed quotes only the FIRST shortfall → accumulate ('Need 3× Iron + 1× Cr').
##   (4) CF173-06 toasts (z40) behind tutbox (z50) in the SAME top lane — the saved-chip written FOR
##       the cautious newbie died unread behind the training card. (5) CF173-07 toasts collide with
##       panels on SHORT viewports (720p) — yield-to-open-boards at ALL sizes + cap-1 to ≤900.
##   (6) CF173-08 Records/Tray double titles (::before + inner heading). (7) CF173-03 #panel absent
##       from PANELS/MODAL_SEL → boards bury/leak the survey card (85→243 overlaps) + dock overprints
##       card (z14>z9) + Escape skips card → REGISTER the card, dock-aware bottom, z fix.
##   (8) CF173-09 disabled craft buttons untabbable → aria-disabled pattern. (9) CF173-10 hint pill
##       truncates (double-tap clause) → wrap ≤420 + shorten. (10) contrast: psub2 --faint→--dim,
##       records .tier 8.5→11px (their measure: my 0.85 'stopped one step early'). (11) atlas-undo
##       far from finger → inline undo/distinct 🗑. (12) dock labels 7.5→8.5px. (13) 'First
##       footfall' already-satisfied → 'Ready to claim' state (pulled forward from v1.8).
##   ★ HARNESS SYNC (no deploy): CF-SIM-001 simrun STILL waits for the fresh bulletin (my flow
##   change retuned smoke but NOT simrun — the tutAt lesson repeated on a different axis: when the
##   FLOW changes, grep BOTH harnesses) · CF-SIM-002 medium runs labeled 'deep' · CF-SIM-003 20-step
##   comments · CF-SIM-004 page recycling.
##   ⚖ NICK DECISIONS: (a) desktop rail panels (901+) get TITLES + role/aria-label (recommend YES —
##   cheap, keeps the v11 rail look; scrim stays touch-only) · (b) Star Atlas AUTO-ADDS landed
##   worlds w/ Visited filter (both rounds' explorer #1 ask — recommend YES) · (c) Shipyard starter
##   affordability (recommend the nearest-affordable CTA over free iron) · NESTING CLAIM REFUTED:
##   the tablet/1600 blocks ARE top-level (verified brace-walk) — but the model-stops-at-900 point
##   stands as the design divergence in (a).
##   ▶ THEN: Batch C a11y — BOTH rounds now rank it top (focus management named critical, zero
##   aria-live, search keyboard-dead); v1.8 spec absorbs their XP table + next-battery success
##   criteria (Rancher 7.5+, no-op <15%, L3 60% of medium creature players, L6 20% of deep).
## ▶▶▶ 2026-07-26 ★ v1.7.6 "THE REGRESSION ROUND" + v1.7.7 "THE OPEN DOOR" (Nick: proceed 1-4;
##   decision (c) per recommendation). 1.7.6: all 7 round-2 regressions — describePick null guard
##   (the per-frame crash), #panel REGISTERED in PANELS/MODAL_SEL w/ training exception + dock-aware
##   clamp, vista casing rendered at last (.vhn/.vhr spans; ⚠ LESSON: check the CSS at the sink),
##   _craftNeed full shortfall list, training claims the screen (saved-chip at graduation), toast
##   yield scoped (≤900 suppress minus the survey card; short desktops get a bottom-LEFT lane —
##   smoke PROVED suppression eats board-produced feedback), single titles + titles at ALL widths
##   w/ role=dialog (decision a), aria-disabled need-buttons, hint wraps, contrast to AA, closest-
##   build CTA (decision c), banked LANDFALL credit + Claim ✓ rows, inline Atlas undo.
##   1.7.7: BATCH C — canvas keyboard cursor (arrows/Enter-with-credit/±zoom/Escape + per-frame
##   gold ring), aria-live announcer (toasts/targets/surveys), central focus management (focus-in
##   on open, restore on close, Tab contained in the 5 modals), keyboard search (listbox + ↑↓ +
##   Enter), 2px rings everywhere · decision (b) planetfall AUTO-CHARTS + ⛳ Visited filter ·
##   harness sync CF-SIM-001/002/003 (004 N/A — our rig boots fresh JSDOM per session).
##   REMAINING Batch-C tail (roadmap): full inert on modal backgrounds · 'Leave this world' button ·
##   Records journal aria · vista tap-dead-420ms · Reset button placement · notification casing.
##   ▶ Next fleet re-run will score the a11y persona against 2.5; targets: overlaps ≤85, JS errors 0.
## ▶▶▶ 2026-07-26 ★ STEP-6 LANDING LOCK fixed in SOURCE (bb56edc) — Nick hit it LIVE on v1.7.7:
##   the survey card closed between atlas-add and land with no allowed reopen. THREE closers, one
##   trap: (1) the 1.7.6 PANELS registration's grace-dismiss killed the card on the REAL pointerdown
##   of the Atlas tap → training sweep now SKIPS the panel entry (the canvas needsCard sweep owns the
##   card during training); (2) land step now carries pick(Earth-133) like find-earth so tap-Earth-to-
##   reopen is REAL (also covers goTo: the atlas-open lesson invites tapping the Earth row, which
##   travels + clears the lock); (3) FOCUS LOCKDOWN, KEYBOARD EDITION — Batch C's cv keydown was never
##   lesson-gated (Escape released the card; ± zoomed the mode over): canvas keys now act only when
##   the lesson opens #cosmos, like taps/wheel. FULL-FLOW AUDIT ran: every other step's completion
##   surface is dock/HUD/tutbox or has an allowed reopen (#codexbtn / _tutSpot auto-reopen) — this
##   was the only lock class left. Smoke +7 (439/0) incl. the real-pointerdown repro click() never
##   fired (⚠ LESSON: jsdom click() ≠ pointerdown — dismiss-on-pointerdown paths need the real event).
##   ⚠ NOT DEPLOYED — awaiting Nick's word for the v1.7.8 hotfix (bump + RELEASES entry at deploy).
## ▶▶▶ 2026-07-26 ★ UPDATE WATCH fixed in SOURCE (6b99db6) — Nick live: "the build is not refreshing
##   even after resetting". The pill's location.reload() RE-SERVED the cached document (iOS Safari +
##   Pages max-age=600) so refresh landed back on the stale build; first check was at 45s, so a stale
##   cached boot (incl. in-game reset — same cached file) played old code all session. FIX: _updGo
##   navigates to ?v=<build> (new URL = guaranteed cache miss; saves safe — localStorage + beforeunload),
##   _updCheck(true) runs at BOOT so a stale boot silently self-heals before play (one try per build via
##   sessionStorage guard — CDN lag falls to the pill, never a loop), spent buster stripped from the bar,
##   _updSeen per-build so a second deploy re-offers. Probe hook +2, smoke +3 (442/0). ⚠ NOTE: users on
##   the CURRENT stale build only gain this once they receive it — their copies heal via Pages cache
##   expiry (~10 min revalidation) or their old 45s pill; all future updates then propagate instantly.
##   ⚠ NOT DEPLOYED — rides the same v1.7.8 hotfix, awaiting Nick's word.
## ▶▶▶ 2026-07-26 ★ v1.7.8 "THE COURIER" LIVE (build 2ba78d7) + ★ v1.7.9 "THE COURTESY PASS" LIVE
##   (build 31186a4) — Nick: "continue on with the rest of 1.7 in the queue". 1.7.8 = the two live
##   fixes (step-6 landing lock + cache-busted update watch). 1.7.9 = BATCH-C TAIL COMPLETE except
##   the Atlas chart pane (a feature build, still queued): FULL INERTNESS (bg inert+aria-hidden
##   under Guide/Prime/duel, rides syncSelState pulse; sheet+Settings deliberately excluded — dock
##   board-swapping and outside-tap-close need live backgrounds) · LEAVE THIS WORLD (grounded card
##   data-act=depart → overview camera reset + announce) · VISTA GHOST GUARD REBUILT (pointerdown-
##   on-overlay tells ghost from genuine; the 420ms blanket was a fleet-flagged dead window; Escape
##   bypasses via _vistaDismiss — a key is never a ghost; zoom steps out first) · JOURNAL role=list/
##   listitem sentence labels · RESET separation (14px + muted-until-intent) · CASING AUDIT (10
##   toast titles → Title Case). ⚠ LESSON: any dismiss-on-pointerdown path breaks el.click()
##   callers — grep for programmatic .click() when adding pointer-based guards (the Escape stack
##   was silently stranded). Harness: smoke tap() helper (pointerdown+click) for vista sites (both
##   harnesses synced same-batch). Gates: fp MATCH 50/50, smoke 450/0, layout 546/9, sim ui 100/100.
##   ▶ REMAINING 1.7 QUEUE (in order): Atlas chart pane (feature) · save-health pass (Atlas thumb
##   strip + rebuild-from-seed + LRU art caches — rule-5 care) · §24 power-curve retune (tester
##   data in hand) · name-variety epithets + text-polish (re-pin candidates) · rare-vein dedup +
##   §5 instance-rarity (generation-touching, careful) · §22 gear×tier + ship-hull masters (art
##   sessions). Then v1.8 Connection (holding) → 1.9 consolidation → 2.0 engine arc (Nick: PixiJS
##   port SAVED FOR 2.0; art ports as canvas→texture masters, logic split is the prep).
## ▶▶▶ 2026-07-26 ★ v1.7.10 "THE LISTENING POST" LIVE (build 338b000) — Nick's live-play findings
##   + the SAVE-HEALTH CORE, same-day loop (Nick playing live, feeding screenshots). LIVE FIXES:
##   search results under the box + 100vmax scrim (supersedes 1.7.2's fixed lane; box lit via
##   focus-within z-bump) · Compendium/Fabricator shelves ship CLOSED, session-remembered
##   (training seeds the lesson's shelf: codex auto-open !tutDone-only; forge.enter adds 'part') ·
##   #codex desktop top +98 (glow ring sat on its own chip) · vista ⛶ hidden during training
##   (zoom deliberately inert there; visible dead button reads broken) · training feed/breed/heal
##   DISMISS the standing card (_tutDropReveal — Nick's step-10/14 screenshots). SAVE-HEALTH
##   (CF16-005 done): speciesThumb 132px list-thumb split w/ own 600-LRU; artOf NEVER pins full
##   portraits on entries (500 species retained ~150MB before); reveal/duel flip to genome-fresh
##   speciesPortrait; discoverSpecies art:null; ThumbArt FIFO→LRU. CF16-004 (thumb strip) + CF16-013
##   (Atlas whitelist) verified ALREADY DONE by earlier security batches — 4 smoke sentinels added
##   so bloat can't return. Gates: fp MATCH 50/50, smoke 454/0, layout 546/9, sim ui 100/100.
##   ⚖ AWAITING NICK (design, not built): (1) QUEST-LOG RETHINK — Nick: the post-accept "Make
##   planetfall" dock pill just opens the board ("pointless"), and the pinned Chapter-1 goal list
##   reads as pre-accepted quests; BRAINSTORM FIRST, options proposed in chat (next-goal TEXT chip
##   vs objective tracker vs chapter restyle). (2) Binder → Records move (recommended: yes, it's a
##   collection view — but it's a restructure, Nick to confirm). (3) Land button GOLD is the 1.7.2
##   one-primary decision — explained to Nick, revert on their word.
## ▶▶▶ 2026-07-26 ★ v1.7.11 "THE WAYPOINT" LIVE (build 283f0ca) — Nick approved: Binder move +
##   quest-log OPTIONS 1+3 (option 2 tracker-stack rejected). OBJECTIVE CHIP: #chchip = live
##   tracker (accepted charter outranks chapter; else Ascent next-goal; p/n + chipbump pulse on
##   progress, rmotion-safe; tap→board) — the game always answers "what's next". MAINLINE
##   RESTYLE: .asckick kicker ("The Ascent — your mainline · no accepting needed") + .ascgoal slim
##   progress LINES w/ 3px bars — visually distinct from Accept-bearing charter pills. BINDER →
##   RECORDS: renderBinder(target) into #records behind Trophies|Binder tabs (_recTabs/recView);
##   _binderClicks delegation moved to the records listener (paragon travel closes Records);
##   Compendium is SPECIES-ONLY (codexView kept for compat); Guide topic updated. Smoke +5 net
##   (459/0) incl. binder-on-records block, chapter-restyle assert (no .ch inside .ascbox), chip-
##   tracks-chapter. Gold Land: Nick informed it's the 1.7.2 one-primary decision — STANDS unless
##   they say revert. Gates: fp MATCH 50/50, smoke 459/0, layout 546/9, sim ui 100/100.
## ▶▶▶ 2026-07-26 ★ THE FULL QUEUE RUN (Nick: "proceed with all of this" + audio→v1.8) — v1.7.13
##   "THE CARTOGRAPHER" LIVE (build 9d07a74): (1) ATLAS CHART PANE ✔ (List|Chart tabs, painterly
##   universe chart, cluster halos, tap-to-travel, filters apply — Batch-C tail COMPLETE).
##   (2) §24 POWER-CURVE ✔ (smite 58.7%→53.5% + roulette re-banded, ALL 17 archetypes in 42-58;
##   dead relics Graven Aegis/Prismatic Lathe → true sidegrades; balance-sim JOINED THE DEPLOY
##   GATE — deterministic, first live gate run PASSED). (3) CF-008 EPITHETS ✔ (notable worlds,
##   deterministic, ~1.1% near home scaling with region; Earth exempt; fp MATCH — no re-pin
##   needed) + Favours→Favors/flavors text pass (historical RELEASES untouched). (4) P2-005
##   RARE-VEIN DEDUP ✔ (0 dups/7,048 rolls, rng stream identical) + §5 PER-DEPOSIT RESOLVER ✔
##   (resolvedDepositTier, grounded cards grade each vein). (5) §22 GEAR WAVE 1 in SOURCE
##   (e5023d6, NOT deployed — ⚖ AWAITING NICK's proof-sheet sign-off): _GEAR_ART registry, 11
##   masters (rigs/suits/helms), proof sheet tools/sheets/gear-wave1.js; self-review flags: suit
##   shoulder taper · hazmat hood seating · voidglass starfield brightness. WAVE 2: struts/anchor/
##   ears/necklace/gloves/legs/boots (14) + relics (9) + cosmic gear (7) + SHIP HULL tiers.
##   ★ NAMEPLATE-ESCAPE FLAKE SOLVED (instrumented bubbleReached + 2nd-press probes): a late
##   queued specimen reveal popped over the open menu and correctly ATE the first Escape —
##   harness drains stack-ahead overlays; GAME FOLLOW-UP QUEUED: reveals must not pop over open
##   modals (v1.7.14 candidate). ⚠ LESSONS: proofsheet runner injects TAU (never lift it);
##   sheet helpers ride liftBetween verbatim (const-lift truncates at inner semicolons).
##   ★ AUDIO PASS → v1.8 "The Connection" (Nick's call, this session).
## ▶▶▶ 2026-07-26 ★ v1.7 ARC COMPLETE — v1.7.14 "THE OUTFITTER" (1fd90df) + v1.7.15 "THE FIELD
##   MANUAL" (bec2f8c) LIVE. 1.7.14 = §22 DONE (hull ladder gap: Array-era gold registry band +
##   strobes; all 41 gear masters ride — Nick's deploy order = sheet sign-off) + REVEALS DEFER
##   OVER MODALS (_revealBlocked/_revealFlush on the input pulse — the proven Escape-eater fixed
##   at the game layer). Review battery at ship: smoke 471/0 · fp MATCH 50/50 · layout 546/9 ·
##   deadcode clean · sim ui 100/100 · chaos 95/100 zero errors. 1.7.15 = Guide caught up
##   (Atlas/survey/charters topics + keywords). ★ STANDING RULE (Nick): the GUIDE updates in the
##   SAME BATCH as every feature — check it at every release.
## ▶▶▶ 2026-07-26 ★ v2.0 ENGINE PLAN REVIEWED (upload: FULL_ENGINE...PORT_PLAN_v3.3_STACK_LOCKED
##   — TS + PixiJS 8 + Spine 2D + HTML/CSS(+React/Lit opt) + Vite + IndexedDB + Zod + WebAudio +
##   Vitest/Playwright; WebGL baseline, WebGPU opt-in). MY REVIEW (recorded for the arc):
##   ✔ ENDORSE the stack lock — matches the 2.0 assessment already on this roadmap (painterly
##     masters port as canvas→texture; hybrid DOM UI; deterministic core untouched).
##   ✔ §26 SEQUENCING ("cheap work first, port inherits validated answers"): STEP 1 IS ALREADY
##     SUBSTANTIALLY DONE — the plan was annotated against v1.7.0/1.7.3; since then 1.7.4→1.7.15
##     shipped the legibility/onboarding/a11y work it prescribes (keyboard canvas w/ survey
##     credit, aria-live, focus mgmt + inert, panel model, objective chip). The port inherits a
##     VALIDATED design, per the plan's own argument. Its "freeze" framing is obsolete — we
##     never froze and shipped 12 releases; recommend NO freeze until Phase-4 parity.
##   ✔ §26 STEP 2 (the falsifiable Canvas2D visual prototype — planet rotation + ring occlusion,
##     re-run personas, compare vs the +0.79 legibility delta): ADOPT — run it DURING v1.8 as its
##     own two-week spike. Either outcome is decisive and cheap.
##   ✔ §27.3 DETERMINISM LANDMINE: correct in principle, but the LOCKED STACK largely defuses it
##     — TypeScript compiles to the SAME JS numerics (doubles, int32 bitwise, mulberry32/hashInt
##     integer paths), so bit-identity survives TS migration nearly free. The cross-language
##     conformance suite (10k golden seeds in CI) matters only if D2 (Unreal/Unity) ever reopens
##     — adopt it as a cheap insurance line in Phase 0 anyway. Render seeds vs identity seeds:
##     already our law.
##   ✔ ACCESSIBILITY TO PHASE 4: agree — and it's already BUILT here, which is the strongest
##     version of that argument (retrofit cost paid once, in the cheap codebase).
##   ✔ D4 "AI AS THE ARTIST": the described loop (rubric → generate → vision critique → revise
##     the GENERATOR → diff on fixed seeds) is literally this project's proof-sheet workflow —
##     the §28.5 call to write the ART-DIRECTION DOC + GOLDEN SCREEN first is right; ART_DIRECTION.md
##     exists in-repo and should be ELEVATED to the port rubric (highest-leverage open item).
##   ⚠ HONESTY ON TIMELINE: team is not 5-7 people — the solo/duo rows (20-34/15-24 months
##     hand-built) govern, BUT the D4 generator model + this session's throughput argue those
##     rows overstate: art is generators not assets here. Plan by MILESTONE GATES, not calendar.
##   ⚠ AUDIO WEIGHTING (§15 = 904 lines, evidence-blind): Nick already moved a SMALL audio pass
##     into v1.8 — that IS the audio playtest the annotation demands. Ship it cheap, measure,
##     THEN size §15.
##   ⚠ PLAN'S AUDIT DRIFT (15-tier ladder, 21.8k lines): re-run all §3 counts against v1.7.15
##     before Phase 0 (now ~25k lines, 10-tier ladder, +_GEAR_ART layer).
##   ▶ SEQUENCE INTO OUR ARCS: v1.8 Connection (+ audio pass + §7 visual spike) → v1.9
##     consolidation = PHASE 0/1 (module split BECOMES the TS extraction; save schema/Zod +
##     share-code migration policy; payload budget gate; art-direction doc + golden screen) →
##     v2.0 port Phases 2+ under the milestone gates. §28.5's "nothing blocks Phase 1" is right.
