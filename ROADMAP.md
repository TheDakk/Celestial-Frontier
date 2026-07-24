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
##   ▶ FLAGGED for a focused reviewed pass (NOT done — catalog-affecting): WINGED body plan 7/14 (gas fliers read as
##     floating quads — real wings = big payoff for fliers + breeding-program creatures; #2 on PROCEDURAL_CHARACTERISTICS
##     pass order) · the rest of that pass order (procedural HEAD system, tail-types, marquee traits, eye/limb counts).
##     Proof-sheets ready: tools/sheets/{gasdeck,floravista,stars,coherence,artreview}.js.
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
## ═══ (v1.6.4 landing hotfix — now superseded as the live build; kept for history) ═══
## ★★★ v1.6.4 "THE LANDING FIX" DEPLOYED LIVE (2026-07-22, build 3a4b839; site + source pushed). CRITICAL hotfix
##   for Nick's "landing highlights but never triggers land" (stuck at step 6/20, Planetside open, empty ring).
##   ROOT CAUSE: the land step advances on the `landfall` event, but noteLanding(seed) (main.js ~8914) early-returns
##   `if(landed.has(seed))` BEFORE emitting landfall. Any VETERAN save already has Earth (133) in `landed` (samples
##   long since read) → no landfall → step never advances. FRESH boots never have 133 landed, so smoke/layout/all
##   gates passed clean and could NOT see it — device-with-history only. FIX (tutorial-only, NOT fingerprinted): the
##   land step (main.js ~16947) got `enter:()=>{ landed.delete(133); }` — un-lands home for the drill so the press
##   freshly fires landfall (noteLanding re-adds 133 instantly). REGRESSION GUARD added to smoke.js (~186): seeds
##   `landed.add(133)` BEFORE entering the land step (old code fails, fix passes). fp 50/50, smoke 0-fail/322-pass,
##   layout 546/9 all green. LESSON: fresh-boot gates are blind to veteran-save state — when a bug is "works for me
##   but not on device", suspect saved state (landed/conquered/codex) that the harness starts empty.
## ★★★ v1.6.3 "CARD & TRAINING POLISH" DEPLOYED LIVE (2026-07-22, build 3a4f5f6; site + source pushed). More of
##   Nick's real-iPhone review. SHIPPED (fp 50/50, smoke+layout green): SPECIMEN CARD verbs reordered per Nick →
##   Breed·Feed·Duel·Scout·Code (rev-* ids unchanged so smoke/gate still work); RENAME moved to a ✎ icon beside the
##   name (.rn-edit, id rev-rename, calls askRenameSpecies — matches the player "✎ Change name" convention) ·
##   COMPENDIUM training step pinned to TOP (new step flag top:true honored in _tutSpot dodge logic) so the fauna
##   list stays scrollable. Earlier this session: v1.6.2 intro Begin-button — first tried a STICKY footer (caused
##   text bleed-through), then FIXED with a flex-COLUMN card (lore scrolls in its own region, actions a real footer;
##   #namebox .card display:flex, .lore flex:1 overflow-y:auto, .nm-actions flex:none). ⚠ ALL need real-iPhone verify.
## ▶ NEXT MOBILE PASS — Nick's REMAINING trio (the hard tutorial timing / z-order / lifecycle bugs; do ONE AT A TIME
##   with device verify): (#1) EARTH/ATLAS menu bleeds UNDER the training+world card (step 6) — panel z-order/cleanup,
##   a residual atlas panel not swept. (#5) BREED → DUEL OVERLAP (step 12) — the "A New Bloodline" reveal and the duel
##   screen are both live at once → GATE the duel step on the breed reveal being dismissed (one thing on screen).
##   (#6) EMPTY blue SPOTLIGHT RING on the nameplate/HP steps (steps 8/13) — CF16-002/010: highlight draws on a
##   target that's covered or not-yet-rendered → wait-for-render + elementFromPoint hit-test before showing the ring.
##   Plus the earlier-review CF16-007 (specimen frame crosses "Critical"), CF16-008 (cyan rim), CF16-004/005 (save/
##   memory). See the v1.7 DEFERRED FIXES block. Glass/tint SLIDER + accessibility-DEFER already recorded (v1.7).
## ★★★ v1.6.2 "MOBILE POLISH" DEPLOYED LIVE (2026-07-22, build 5c85d8b; site + source pushed) — the FIRST mobile-
##   onboarding pass from the v1.6 mobile review (Nick's real-iPhone findings). SHIPPED (fp 50/50, smoke+layout
##   green, both fp-safe CSS/markup): CF16-003 intro Begin-button STICKY FOOTER (was below the fold on short
##   iPhones — .nm-actions position:sticky) · CF16-006 charter counter no-wrap (.cp white-space:nowrap;flex:none).
##   ⚠ NEEDS REAL-IPHONE VERIFICATION — the layout gate doesn't cover small-iPhone viewports (CF16-014). STILL OPEN
##   (structural, do next ONE AT A TIME with Nick verifying on device): CF16-007 specimen frame crosses "Critical"
##   text (needs inner-scroller markup) · CF16-001 tutorial card BLOCKS the panel it teaches (collision-aware
##   layout coordinator — the big one) · CF16-010 highlight/items don't load until clicked (readiness-based target
##   mounting, not a 480ms timer) · CF16-008 cyan rim shards (fp-safe render — verify via proof sheet) · CF16-004/
##   005 Atlas save-bloat + portrait-cache memory · CF16-012 zoom/touch-action (behavioral). See the v1.7 DEFERRED
##   FIXES block below for the full mapped list.
## ★★★ v1.6.1 "THE BINDER PATCH" DEPLOYED LIVE (2026-07-22, build 973bbaa; site + source both pushed). The
##   v1.6 CODE REVIEW (Nick's synthetic gameplay/code-review report) ran and found real bugs our panel/smoke
##   missed. HOTFIXED (all fp-safe, fp 50/50, smoke+layout green, +Binder smoke check): P2-001 Binder crash
##   (renderBinder read ABILITY_THEMES from outer scope → ReferenceError; exported it from CombatCore — was a
##   LIVE crash) · P2-002 malformed-save (_sanitizeSavedGenome clamps brood/fed/xp/hurt + seed/kingdom; a crafted
##   save forged an 11.7M-power creature exportable as a share code) · P2-003 duplicate conquest reward (idempotent
##   conquered.has guard at onResolve) · P2-004 stale breeding parents (breedPair rejects consumed/invalid).
##   DEFERRED to v1.7 (fingerprint/re-pin or bigger): P2-005 rare-vein dedup (depositsFor = generation → materials
##   re-pin) · CF16-011 mirror-duel tiebreak (=CF-004) · CF16-004 Atlas thumbnails (=CF-002) · CF16-012 zoom/
##   keyboard-nav (=CF-006) · CF16-001/002/003 mobile-onboarding LAYOUT blockers (need real-iPhone pass). NOTE the
##   review tested an OLD 'dev' snapshot, so several carried-forward UI findings were ALREADY fixed in v1.6/v1.6.1
##   (verb grid, Records short-phone, training soft-lock). NEXT: dive into v1.7 (rarity Phase A → Forge/materials
##   Phase B → text polish → charter-training module + the deferred review items).
## ★★★ v1.6 "THE LIVING FRONTIER" IS DEPLOYED LIVE (2026-07-22, build 8351d67 → https://celestialfrontier.github.io/;
##   version.json v1.6). Committed to source main @8351d67 (release commit). Battery green at ship: validate 8
##   gates + fp 50/50, smoke 0 fails, layout PASS(546). v1.6 = the painterly art overhaul + lineage cards +
##   champion codes + loot affixes + biosphere yield + item cards, PLUS the fix batch (footer version binding,
##   CF-001 tutorial stat-leak, CF-003 hazard timeout, CF-005 Records short-phone fit, CF-007 aria-label, CF-009
##   button types, CF-010 name-length, charter drills→Mine wording, specimen VERB-ROW GRID (fixed the button
##   crush at all resolutions), TRAINING soft-lock re-assert (Settings-cancel now reopens the Compendium — does
##   NOT lock Settings), and the fp-safe UI TEXT POLISH). DEFERRED (safety) → caught by the v1.6 CODE REVIEW +
##   v1.7: CF-002 (Atlas save bloat — needs thumb-rebuild plumbing, rule-5), CF-004 (duel tiebreak — fp/re-pin +
##   champion-code interaction), CF-006 (keyboard Navigator — its own focused pass), CF-008 (name variety — v1.7
##   naming pass). ▶ NEXT (Nick's plan): the v1.6 CODE REVIEW is the FIRST v1.7 item — do it FIRST (catches the
##   deferred fixes + anything else), THEN the rest of v1.7 (rarity Phase A → Forge/materials Phase B → text
##   polish → charter-training module). See the v1.7 lines below.
##
## [HISTORICAL — pre-deploy handoff, kept for context] STATE: v1.5.2 is LIVE. v1.6 is BUILT but NOT deployed. The RC3 Gold review declared everything
##   Gold-ready EXCEPT the biome-coverage LAYERS (4 narrow blockers); BATCH 15.5 closed all 4 — all
##   render-only, fp 50/50, NO re-pin. validate = 8 gates green (193 sentinels), smoke green, layout
##   PASS (546), NEW biome-layer audit green. Latest package: scratchpad/CF-FullArt-Batch15.5-Gold.zip.
## BATCH 15.5 — the 4 RC3 Gold biome-layer blockers (all done): (1) EMPTY PURITY — reef fish-schools +
##   abyssal creatures now gated on genes, so empty biomes carry ZERO fauna (coral=coral+water only,
##   abyssal=dark water+vents only). (2) POPULATION — ice/grey(rocky)/haze(venus) worlds placed NO
##   creatures (the land block at ~L7917 excludes those pals), so cryogeyser/tundra/rocky/venus were
##   blank in all 3 modes; added a dedicated placement block (anchor + secondary). (3) SEPARATION —
##   _hdAbyssScene now draws the ACTUAL genes (Earth anglerfish/squid vs procedural alien); GAS = Option
##   A (Earth life UNSUPPORTED, labeled; native aerial life only in the procedural pass). Earth != proc
##   everywhere now. (4) BIOME AUDIT — new tools/biome-audit.js (empty-purity structural gates + population
##   + Earth!=proc lineage + fauna-free whitelist), wired into the audit report. RC2 Lepidoptera "blocker"
##   was a FALSE ALARM (test-only names, not in catalog); classifier hardened + 23 sentinels anyway (B15.4).
## BATCH 15.2 — the 4 release gates (all done): (Gate 1) FULL CATALOG EXPORT — all 18 fauna + 10 flora
##   pages rendered (scratchpad/catalog/) + automated AUDIT-REPORT (render-audit 1010 clean · rig-audit
##   631 classified/170 sentinels · fp 50/50); catalog is class-clean (Butterflyfish→fish, Butterfly/
##   Moth→insect all certified). (Gate 2) SKIN — furred rebuilt (soft uneven fringe + neck/chest/tail
##   tufts, not spikes), feathered rebuilt (overlapping directional contour feathers + tail plume),
##   translucent now DROPS body opacity (0.66) so spine/ribs/gut/heart read through the membrane. (Gate 3)
##   BUTTERFLY/MOTH — the symmetric-wing rig now returns faceOn→a MATCHED eye PAIR (was one side eye).
##   (Gate 4) VISTA HERO-DEPTH — _hdPlaceBeast draws a denser ground-fringe, every 4th blade taller so it
##   OVERLAPS the feet, scaled with the creature → heroes read as grounded foreground across all vistas.
## WHAT'S DONE (Batch 15, from the Batch-14 review): (Area 3) STRUCTURAL SKIN — all 9 FA_SKIN materials
##   now change the material language (scale rows/fur fringe/chitin bands/wet sheen/armour plates/warts/
##   feathers/translucent channels/crystal facets), masked to the body [§0.6]. (Area 2) HABITAT-PRESERVES-
##   BODY-PLAN — aquatic shelled/crystalline/tusked/horned/squat creatures read as shell-backed / mineral-
##   plated / tusked / horned / benthic SWIMMERS, not a plain fish (_procFamily fpreserve marker + grafts)
##   [§0.5]; GROUPED-LIMB anatomy (fore/mid/rear, tripod, arthropod) [§8.3]; specialized-rig TAILS on
##   fish/crust/ceph [§0.4/8.4]. (Area 4) AQUATIC (6) + AERIAL (3) FLORA SUBFAMILIES in hdPortraitFlora/
##   _hdPlantBare (kelp/seagrass/reef/sargassum/bloom/tube · veil/banner/cloud-garden) [§0.7]; root/tuber
##   noted Earth-harvest-only. FROG pupils/irises drawn on top of the texture [§0.2]. PLAN-0 renamed
##   FA_BODY[0] 'six-limbed'→'sturdy-limbed' (Nick's call — limb gene sets the count; fp-safe, NO re-pin)
##   [§0.3]. (Area 1) VISTAS: global creature SCALE (clamp 1.8→1.4) + stronger GROUND-CONTACT shadow
##   [§0.1]; NEW _hdReefScene — Coral-Shallows now drops to a bright reef (caustics, coral colonies, fish
##   schools, in-column creatures), routed in showVistaBox like abyssal [§5.4]; JUNGLE canopy ceiling +
##   vines + foreground broadleaf [§5.2]. KEY FINDING: the review's ABYSSAL "trees+moon+waterline" was a
##   PROOF-SHEET ARTIFACT (vistas-big rendered abyssal via hdVista; the game uses _hdAbyssScene) — fixed
##   the sheet; the real abyssal was already correct.
## DESIGN DOCS (source of truth): ART_DIRECTION.md · PROCEDURAL_CHARACTERISTICS.md ·
##   LINEAGE_AND_BREEDING.md (+ the per-system docs). New sheets: proc-skins.js, proc-aqua.js, b15-*.js.
## ✅ GOLD SIGN-OFF RECEIVED (2026-07-21): Nick's "Batch 15.5 Gold Candidate Final Review" landed and is
##   GOLD APPROVED across all six areas (art direction · Earth catalog · procedural fauna/phenotype ·
##   procedural flora · biome layers · showcase vistas) — "No additional pre-release visual changes are
##   necessary." Only actionable was its §18 shipping-checklist item 1 ("rerun the suite against the exact
##   build"). DONE THIS SESSION: (a) re-extracted main.js + re-ran the FULL battery against the current
##   build — validate 8 gates + fp 50/50 · biome-audit PASS · render 1010/0 · smoke PASS · layout PASS(546);
##   all green. (b) REGENERATED the full art package fresh from that build → scratchpad/CF-FullArt-Batch15.5-
##   Gold.zip (49 files; prior delivered zip backed up as *.PRIOR.zip). NOTE: tooling drift — flora-all-big.js
##   is now ROWS=5 (30/page) so the Earth-flora catalog is 12 pages (was 10 @ 36); all 334 flora, more legible.
##   (c) reviewed + edited Nick's markdown: added §0 build-verification addendum (battery table + fingerprint),
##   §20 release-handoff, and corrected the flora page count 10→12; delivered the edited copy alongside the zip.
##   Regen driver: scratchpad/build-package.js. All per-system docs already SYNCED to B15.5.
## ▶ PHASE 8 IN PROGRESS (2026-07-21, Nick's word): v1.6 RELEASE-NOTES written + GAME_VERSION BUMPED to '1.6'
##   (title "The Living Frontier"; RELEASES[0] new entry — art overhaul, alien phenotypes, landing vistas,
##   lineage card, champion codes, conquest loot affixes, biosphere yield, item cards, class-routing).
##   validate green (fp 50/50), smoke green (updated the 2 stale version assertions: fresh-bulletin + guide-
##   footer now expect the v1.6 line). Bulletin logic confirmed: openReleaseNotes('latest') shows the current
##   minor line alone (_line=GAME_VERSION[0..1]) → fresh v1.6 shows "The Living Frontier" only, no 1.5.x leak.
##   6k BETA LAUNCHED in background (scratchpad/beta6k.sh → tools/beta-v16-{chaos,ui,fast,deep}.json;
##   chaos1500+ui900+fast3000+deep600=6000). Fail-fast slices (chaos25/ui25/fast50) were CLEAN on v1.6.
## 6k RESULT (CLEAN): 0 errors/breaks/violations/softlocks/deaths across ALL 6000 sessions. funIndex fast 6.87 /
##   deep 5.5; deep maxDrought ~35 (the SAME long-session staleness signal v1.5.2 flagged — economy unchanged, not
##   a v1.6 regression; feeds retention/crafting-depth backlog + the v1.7 materials idea). saveFail was a RED
##   HERRING: pre-existing HARNESS artifact (active runs don't flush a final save in the 1.2s read window), 4%
##   here vs 14% on the live v1.5.2 build — v1.6 is BETTER; codex does NOT persist lineage (L11639), doSave has
##   graceful quota toast (L11641). NOT a blocker. Nick approved 10k (not 20k) crash-weighted confirmation.
## ▶ 10k CONFIRMATION LAUNCHED (scratchpad/beta10k.sh → tools/beta10k-v16-*.json; chaos5000+ui3000+fast1500+
##   deep500=10000). When it lands clean → team panels → deploy via tools/deploy.js on Nick's word.
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
