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
##     (1) ADVANCED BRIEFINGS (5 drills + full-UI coverage audit, charter handoff shipped). (2) CONTENT-
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
##   asked "anything we left out"): BIOMES: night/dawn/dusk vista variants (pal exists — ties to the landing
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
##    PLAYER QoL — THE FULL SLATE — IN PROGRESS 2026-07-24: ✔(h) recipe tracker [230aac6] ✔(a2) journal v1 text+region strip [488d7c6; postcard thumbs = v2, needs vista-opts reconstruction] ✔(o) sticky hold tab [31c52eb] ✔(p) heal hint [eeb7e16]. NOTE (i) recent-worlds needs a where-blob captured into the journal entries (travel needs more than a seed) — capture it in journal v2. Remaining: i/j/k/l/m/n/q. (Nick 2026-07-24: "list out all the QoL suggestions" — direction APPROVED,
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
