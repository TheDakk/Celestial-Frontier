# Celestial Frontier — Roadmap & Session Handoff

## ▶▶▶ NEXT SESSION — v1.6 (Nick, 2026-07-19 close: "record it and get
## ready for next session v1.6"; RESUME HERE) ◀◀◀
##
## STATE AT CLOSE: v1.5.2 LIVE at build 62c8930 (three deploys today:
## 61024a9 five-rulings base → 0caabe7 hpwrap hotfix → 62c8930 fixes
## wave). The first standard 6k beta was IN FLIGHT at close on the live
## build (fail-fast; chaos 749/750 post-clean already banked; results
## land in tools/beta6k-*.json, 'BETA6K DONE' at end) — READ IT FIRST:
## the veteran 250 leg carries the first-ever STALENESS-HORIZON and
## DROUGHT numbers (rep.staleness / rep.drought / rep.noveltyCurve).
## Refresh the director's report artifact with the full round.
##
## OPENING MOVES, in order:
## (1) Beta verdict + report refresh (above).
## (2) NICK'S PENDING WORDS: emoji fixes (⚜ Forbidden Science = wrong;
##     💠 Earpiece / 🚁 Survey Fleet / 🌗 Twin Suns = questionable —
##     inventory in session notes); D1 wall-clock pacing FEEL check on
##     his device (Jump p50 37 actions × 16s bursts — does it feel
##     right?); L6 ceiling call (1/500 reach it — richer XP vs lower
##     threshold).
## (3) VENUS PILLAR REPRO (art): rebuild the exact Venus-132 postcard
##     args and fix the floating-formation seating (ridge baseline +
##     base-contact shadow — the space-era towers at 7601+ are the
##     good pattern).
## (4) MOBILE JOURNEY LEG for tools/uilayout.js (task queued): real
##     touch gameplay (land, mine, accept, sheet, yard) at phone
##     viewports via CDP Input.dispatchTouchEvent.
##
## THE v1.6 SLATE (Nick-approved direction; DESIGN WITH HIM first —
## the full spec block sits below at 'THE v1.6 SLATE'):
##  · THE AFFIX/LOOT CORE (S6) — per-instance gear, one faucet first
##    (conquest spoils), app-layer seeded, never in share codes. The
##    month-scale retention chase.
##  · FAR-RING CONTENT — stars/biomes/galaxy identity beyond ring 1
##    (the progression audit's flat spots R3).
##  · CHAMPION CODES — leveled-creature showcase/challenger codes
##    (clamped import, exhibit-only; Nick: "really cool").
##  · RETENTION LAW — AI-authored deterministic content DROPS on a
##    cadence (events/beacon revival as seasonal vehicles); measured
##    by staleness-horizon/novelty instruments.
##  · Parked critic picks that fold in: P2 Sol first life, P5 early
##    Codex claim, P7 Legendary wall; S11 decline rules if wanted.
## STANDING PROCESS (locked today, see 'STANDARD ROLLOUT PROCESS'):
## battery → copy pass → Guide check → layout gate → 6k beta (fail-
## fast) with feedback ACTED ON → team panels (artwork/engineering/UI/
## bug+feedback/QA/audio) → deploy. Release notes = technical outlines.

## ★★★ v1.5.2 "THE SHIPYARD + THE QUEST SYSTEM" IS LIVE ★★★
## (2026-07-19 overnight, build 61024a9, deployed per Nick's overnight
## charter; version.json v:1.5.2 verified live.)
## THE OVERNIGHT RECORD (Nick asleep; full director's report artifact +
## exec summary delivered separately):
##  · HAMMER3 certified the frozen v1.5.2b build first: chaos 300/300,
##    ui 150/150, medium clean (yard exercised 549×) — both harness
##    driver fixes proven; zero errors anywhere.
##  · BUILT (commits c115458, b5d1651, 61024a9): mining BURST CAP
##    (press = burst ≤ MINE_BURST 10, the upgrade knob) · Ascent →
##    CHAPTERS surface rename (achievement 'The Last Chapter';
##    cinematic 'CHAPTER COMPLETE'; history untouched) · PROGRESSIVE
##    CHAINS (trades spine gates weeklies; Sol tour side income;
##    ring-locked links never revealed) · ACCEPT-TO-ACTIVATE (chacc
##    field, cap 3, auto-accept first link at training end, S1
##    already-proven chk() proofs excluding home ground) · CHARTER
##    GEAR static phase (earpiece/headlamp/magboots/meteor/fieldlegs;
##    grants fire no 'crafted' event) · DEEP-LINK NUDGES (toast go→
##    charters, › affordance) · simrun learned it all (S8) + variety-
##    by-ring telemetry · release notes + Guide synced · smoke checks
##    recreated for the new law (295 PASS).
##  · 5,000-TESTER ROUND: ALL LEGS CLEAN (0 errors/deaths/softlocks;
##    ui 500/500, chaos 500/500). Fun p50: fast 6.59, medium 6.09,
##    deep 5.89. Charters 7-8/run. Variety opens by ring.
##  · FIX BATCH (61024a9): chAccept tutDone guard; DEPTH_TAX sixth
##    rung 2.5 (autonomous, straightforward-fix authority).
##  · PROGRESSION AUDIT (planets/stars, Nick's order): economy +
##    rarity + depth tax OPEN UP (formulas verified); FLAT: star-class
##    variety, world-type/biome pools (ring 1 exhausts them), defender
##    strength/win-odds (copy overstates), galaxy content, post-Deep-
##    Field plateau. All design calls → exec summary R1-R4.
##  · 50,000-TESTER ROUND in flight at close (ui 2000 → chaos 1500 →
##    medium 3000 → deep 1500 → fast 42000 in 6 chunks; results in
##    tools/tester50k-*.json as legs land; 'TESTER50K DONE' at end).
## ⚠ DECISIONS AWAITING NICK (exec summary, morning): S10 pacing
##    (burst compressed Jump p50 65→37, IG 0.3%→27% of deep runs,
##    medium/deep fun dipped ~0.2-0.3 — count chapter goals in bursts?
##    retune c1-mine? accept the faster ladder?) · R1 defender region
##    scaling · R3 far-ring star/biome content (v1.6) · R4 tier-scaled
##    conquest XP (w/ parked P8) · weekly-accept UX (slate of 3 shared
##    with starters) · fun-dip watch.

## ▶▶ MORNING SESSION 2026-07-19 — NICK APPROVED ALL FIVE DECISIONS
## ("Go ahead and work on all of these, approved"):
##  · D1 SHIPPED: chapter mining goals count PRESSES (mined event carries
##    press flag from mineToggle; ascEvent counts presses; goal text
##    'Run the drills N times'). Charters/hold still count real loads.
##  · D2 SHIPPED: GUARDIANS ride the region law — the audit overstated
##    the gap: ordinary apex natives scaled +14%/region since v1.4
##    (apexNative _mult, honored in battleStats 11722, stripped from
##    codes 11776); only the guardian branch skipped it. Now it doesn't.
##  · D3 SHIPPED: conquest XP = (20|60) + world tier; P8 discovery XP —
##    every genuinely new species teaches the standing Field Scout +2
##    (both catalogue paths). Thresholds stay 6·l² (panel consensus).
##  · D5/P3 SHIPPED: ARRIVAL PAYS — first arrival in a new system logs
##    '🧭 First Arrival' + 2 ☄ (sysSeen set, save sysv, cap 900,
##    Sol/home excluded, training/loading silent). Sprinter counterweight.
##  · D4 → THE v1.6 SLATE (below), per the approved recommendation.
##
## ▶▶ DAY-2 AFTERNOON RECORD (2026-07-19, Nick present; three deploys):
##  · HPWRAP POINTER-EAT (live-blocking, Nick's field find): the full-
##    width HP row wrapper silently ate real clicks on the Charters
##    button + answered hovers with the HP tooltip (topbar z-20 over
##    chbtn z-9; synthetic clicks bypassed it, which is how every test
##    missed it). Fixed (wrapper inert, pill interactive) + hotfix
##    deployed 0caabe7. New RAIL-REACHABILITY law in the gate.
##  · THE LAYOUT GATE BORN (tools/uilayout.js): headless-Edge CDP, 9
##    viewports, ~520 checks (✕ corner law glyph-accurate, z-order,
##    rail reachability cold/tray/search, side-scroll, clipped text),
##    fresh expedition per viewport, proof sheets. Found the yard ✕
##    appended at the bottom of the scroll; Nick found the sheet's the
##    same way. Both seated FIRST now. jsdom performs no layout — this
##    gate exists because all three of his mobile bugs were invisible
##    to 10,000+ clean jsdom runs.
##  · MOBILE TRIO: coarse ✕ 28px visual + invisible hit padding; rail
##    panels z-22 over topbar chips; training card dodges its own
##    spotlighted target.
##  · RECORDS RESTRUCTURE (Nick): Records button to the standing slot;
##    Shipyard takes the lower slot on appearing; Statistics ledger
##    moved from the sheet to Records (+First Arrivals row).
##  · FIRST COPY GATE RUN: 6 SHOUTING-caps demoted, 'sock'→'slot',
##    hunt board→charter board, Guide gained tier-XP/scout-XP/First-
##    Arrival currency. Verdict: voice human, Guide current.
##  · FIRST ART REVIEW (vision on tools/sheets/artreview.png): molten
##    worlds drew a WATER river w/ sun glints ('rivers of rock' matched
##    the water regex) — fixed; day river de-glared. Venus pillar
##    seating = repro pending. EMOJI INVENTORY: 1 wrong (⚜ Forbidden
##    Science), 3 questionable — awaiting Nick.
##  · RELEASE NOTES: all 19 entries → technical outlines (standing
##    format). TEAM PIPELINE recorded (incl. audio team).
##  · Deploys: 0caabe7 (hotfix) → 62c8930 (fix wave). Beta 6k running
##    at close; chaos 749/750 + ui 500/500 already clean.
##
## ★ STANDARD ROLLOUT PROCESS (Nick, 2026-07-19 — every release):
##   1. Build + battery (validate/smoke/systems/balance).
##   2. COPY PASS: full story/UI/description sweep — grammar, noun-true
##      capitalization, no random mid-sentence caps for emphasis, human
##      register (how Nick & Claude talk, not AI-ese). Headline caps
##      (release-note lead-ins, kickers) are designed style, kept.
##   3. GUIDE CURRENCY CHECK: every topic verified against mechanics.
##   4. BETA ROUND (two-tier, fail-fast leg order chaos → ui → medium
##      → deep → veteran → fast): STANDARD ~6,000 (chaos 750 + ui 500
##      + medium 1,000 + deep 1,000 + veteran 250 + fast 2,500) every
##      release; MILESTONE ~20,000 (chaos 2,000 + veteran 1,000, same
##      shape) for x.0-scale reworks. Feedback → modifications → only
##      then deploy. (Statistics: behavior means pin by ~1k runs/leg;
##      volume only buys rare-crash hunting, chaos does that best.)
##      THE FEEDBACK IS ACTED ON, not filed (Nick): every beta round's
##      findings feed the same release — recommendations weighed, bugs
##      and exploits fixed, optimizations applied, then the round
##      re-verifies the fixes before the deploy goes out.
##   5. ✕ CORNER LAW: closes sit cleanly in the corner, never bleeding
##      over pictures/UI; touch targets grow by invisible hit-padding.
##   6. LAYOUT GATE (tools/uilayout.js): headless-Edge, 9 viewports,
##      ~520 checks (✕ law, z-order, rail reachability cold/after-tray/
##      after-search, side-scroll, clipped text) + proof sheets. Runs
##      with the battery, ON TOP of the beta count. Born 2026-07-19
##      after jsdom missed all three of Nick's mobile bugs (no layout).
##   7. TEAM REVIEW PANELS (Nick's org design, 2026-07-19): each release
##      is reviewed by the full team before final deploy — ARTWORK
##      (vista/proof-sheet vision review; composition, blending, the
##      painting law), ENGINEERING (correctness/edge/perf), UI (layout
##      gate + viewport sheets), BUG & FEEDBACK (beta-round findings
##      triage), QA (battery + exploit sweep), AUDIO (sting/fanfare
##      coverage + timing). Feedback → fixes → re-verify → live.
##      Implemented as multi-agent panels; findings land in the same
##      release. Release notes are TECHNICAL OUTLINES (category →
##      tight bullets), all entries, standing format.

## ▶▶ THE v1.6 SLATE — FAR-RING CONTENT + THE LOOT CORE (D4, approved
## direction; DESIGN WITH NICK before building — v1.6-scale):
##  · THE AFFIX WALL (S6, the core): per-instance gear, app-layer seeded
##    rolls, one loot faucet first (conquest spoils), power decoupled
##    from rarity, gear never rides share codes.
##  · FAR-RING STARS: give the flat star category distance meaning —
##    region-flavored exotic spawns (magnetar fields in the Deep?),
##    star-scale payoffs (remnant mining? beacon anchors?), so expanding
##    gains something star-wise beyond a rarity tint.
##  · FAR-ONLY WORLD CONTENT: biome/type variants that only spawn beyond
##    given regions (the pool currently exhausts in ring 1) — must stay
##    seed-deterministic per position (region derives from position, so
##    the fingerprint law can hold; audit before building).
##  · GALAXY IDENTITY: galaxyProfile feeds only art today — consider
##    letting far galaxies bias content mixes (a carbon-rich galaxy, a
##    remnant field) without touching near-ring determinism.
##  · POST-DEEP-FIELD: rarity summit at Deep Field is documented design;
##    if Outer Dark/Frontier deserve their own hook, it comes from
##    content (above), not caps.
##  · Parked critic picks that fold in naturally: P2 Sol first life,
##    P5 first Codex claim at stage 2, P7 Legendary wall.
##  · CHAMPION CODES (Nick 2026-07-19, "would be really cool" — liked):
##    a code that carries a creature's LEVEL/XP story (clamped on
##    import), summoned strictly as a CHALLENGER/EXHIBIT — never an
##    owned copy (ownership imports stay level-1; forged god-codes are
##    just a harder duel someone chose). The flex is real, the economy
##    intact. Pipeline exists (CFB-/normGenome; today xp is deliberately
##    stripped at 11793). Pairs with affix gear on the champion card.
##  · RETENTION LAW (Nick's month-two directive): content pipeline must
##    outrun grammar exhaustion — AI-authored, versioned, DETERMINISTIC
##    data drops (never generative in the client: breaks determinism +
##    share codes). Delivery vehicles: the dormant Cosmic Events +
##    Traveler's Beacon as seasonal drops; measured by the harness's
##    novelty-per-hour / staleness-horizon instruments.

## ▼▼ EXECUTED OVERNIGHT 2026-07-19 (kept for the record) ▼▼
## ▶▶▶ NEXT SESSION — v1.5.x CONTINUATION (Nick, 2026-07-19; RESUME
## HERE — everything below is Nick's documented direction) ◀◀◀
##
## STATE AT SESSION CLOSE: v1.5.1 is LIVE (build c299ac3). v1.5.2 "The
## Shipyard" + the v1.5.2b consistency pass are BUILT, COMMITTED and
## STAGED (GAME_VERSION 1.5.2, bulletin written) — deploy was pending
## the final hammer round (chaos 300 + ui 150 + medium 150 on the
## frozen build; an earlier round was invalidated by mid-edit builds
## under the workers). Suites at freeze: fingerprint 50/50, smoke
## 293/293, systems 19/19, balance PASS.
## HAMMER ROUND RESULTS AT SESSION CLOSE (recorded 2026-07-19, Nick:
## no rerun this session):
##  · chaos 300: 0/300 completed, ui 150: 38/150 — a HARNESS
##    FALSE-NEGATIVE, not a game failure: every stall was at
##    'forge: fab tab' — the ui/chaos training driver still clicked
##    the REMOVED #cargo fab-tab selector (smoke was updated for the
##    Shipyard; the driver was not; the 38 completions are the
##    skip-path slice). Zero errors, zero breaks, zero exceptions in
##    both legs. DRIVER FIXED AND COMMITTED at session end (simrun
##    forge flow now: cargobtn → #yardbench [data-craft="plate"]).
##  · medium 150: was still running at close — if tools/
##    hammer2-medium.json exists next session, read it; its bots were
##    already correct (API + updated sheet/yard actions).
## MEDIUM VERDICT + HAMMER3 (recorded 2026-07-19 ~00:30, autonomous
## batch after the hammer2 background round completed):
##  · hammer2-medium landed: 558× 'sheet: docked ship did not open the
##    Shipyard' — the SAME false-negative family, NOT a game bug: the
##    medium/deep 'sheet' action still clicked #dollship, an id REMOVED
##    by the v1.5.2b pack change (the sheet/yard bots were NOT already
##    correct, contrary to the line above). cargoTabs: 0 — the yard got
##    ZERO medium-mode coverage. Otherwise clean: 0 deaths, 0 softlocks,
##    saves 148/150 (2 = run-cap truncation), funIndex mean 6.26.
##  · DRIVER FIXED: sheet action now enters through the real door —
##    #cargobtn (gated on visibility, like a player) → yard asserts →
##    rank reclaims the sheet. Violation string renamed ('the Shipyard
##    rail button did not open the yard').
##  · STALE COPY FIXED in the staged build (v1.5.2b missed spots, all
##    player-visible): the v1.5.2 release-note bullet still said "tap
##    her where she docks beside your paperdoll" (now: the right-rail
##    Shipyard button); the Guide crafting entry still listed "the ship
##    Module docked beside the figure" (now: the 🎒 pack on your
##    shoulder); three stale source comments synced. Battery after:
##    fingerprint 50/50, smoke 293 PASS / 0 FAIL, validate all-PASS.
##  · HAMMER3 LAUNCHED on this build (chaos 300 + ui 150 + medium 150,
##    background): the FIRST round to actually exercise the 23:54
##    training-driver fix (hammer2's ui/chaos legs started before that
##    commit landed and ran the OLD driver). Results →
##    tools/hammer3-{chaos,ui,medium}.json when 'HAMMER3 DONE'.
##  · The GAME build passed everything that actually reached it:
##    fingerprint 50/50, smoke 293/293 (drives all 20 training steps
##    incl. the Shipyard forge THROUGH THE DOM), systems 19/19,
##    balance PASS, and the micro-repro proved the auto-mine loop.
## NEXT SESSION'S OPENING MOVES (Nick's close-out, 2026-07-19):
## (1) re-run the hammer with the FIXED driver (chaos 300 + ui 150 +
## medium 150 if its report is missing) on the frozen build,
## (2) apply the mining burst cap (item 0), (3) smoke + a chaos slice,
## (4) node tools/deploy.js — the v1.5.2 deploy carries Nick's
## standing instruction for this iteration. THEN the Chapters rename +
## progressive-charter work (S3 ruling below).
##
## 0. MINING BURST CAP (Nick's ruling, 2026-07-19 — apply BEFORE or AT
##    next deploy): auto-mining semantics as built — the run binds to
##    ONE world's open card; each 1.6s tick re-checks: button pressed
##    again / card closed / card switched worlds / vein dry → stop;
##    one run ever exists at a time; nothing persists across reload;
##    leaving the card kills the run on the next tick. THE GAP: parking
##    a card open AFK could drain that one world's finite reserve
##    (~10-20 min). THE CAP: one press = one BURST of up to 10 pulls
##    (~16s), then the drills stand down and want another press.
##    BURST SIZE is the future upgrade knob ("recipes to increase the
##    amount you can mine at once" — rigs/recipes extend the burst).
##    Never multi-world, never offline (the crafted Auto-Extractor
##    keeps that role, untouched).
##
## 1. PROGRESSIVE CHARTERS (Nick's quest-system law): only the quests
##    that are AVAILABLE show on the board — completing one reveals the
##    next, chains building further and further ("kind of like a
##    progressive quest system"). AUDIT the current board first: today
##    ALL starters (5 trades + the 5-stop Sol tour) listen and show at
##    once — restructure into visible CHAINS where each completion
##    unlocks the next link. Verify the whole charter flow behaves
##    progressively, not as a wall of parallel checkboxes.
## 2. ACCEPT-TO-ACTIVATE: after training the game says "more charters
##    available" — lean into that: you go to the charter board and hit
##    ACCEPT, and THAT starts the quest tracking (accumulating the
##    resources it needs). NO DECLINE for now (considered for later —
##    accept/decline as a real choice down the line). Progressing
##    through Sol requires accepting its charters and completing them.
## 3. CHARTER REWARDS BECOME GEAR (the quest-outfit path): completing a
##    charter can pay a CRAFTED ITEM instead of (or with) stardust —
##    gloves, a helmet, low-stat starter gear that nudges survival and
##    success odds. The early game outfits you through quests.
##    - EARLY = STATIC: constant, deterministic rewards at first (same
##      item for every explorer — fixed pieces from the existing
##      recipe/gear pool at low tiers).
##    - LATER = DIABLO LOOT: as you expand into the wider world, found
##      gear shifts toward a random-roll loot system ("low random
##      stats" → the full Diablo chase). DESIGN NOTE for the session:
##      random affixes must stay app-layer/seeded (share codes and the
##      fingerprint law are untouched); an affix system on gear is a
##      v1.6-scale design — scope it with Nick before building.
##
## CLAUDE'S SCENARIO REVIEW (2026-07-19, Nick asked "what did I not
## think of" — decisions to make BEFORE building the above):
## S1. PRE-EARNED PROGRESS vs ACCEPT-TO-ACTIVATE (the big one): if
##     tracking starts at accept, a player who mines 8 loads THEN
##     accepts the mining charter gets zero credit — rage fuel. But
##     silent banking contradicts the point of accepting. PROPOSAL:
##     STATE-quests (land on Mars, own a component) check world-state
##     at accept and complete instantly with an "already proven" note
##     (the veteran-trades precedent); COUNT-quests (pull 5 loads)
##     count from accept, and their text says so ("from here on").
##     Decide with Nick.
## S2. CHAIN DEADLOCK GUARD: a charter targeting a SPECIFIC world's
##     resource can strand (e.g. "5 loads from Jupiter/Saturn" if both
##     were mined out first — unlikely at ~700 pulls each, but the
##     PATTERN matters as chains grow). Law: targeted charters prefer
##     categories over single worlds, or auto-complete when the target
##     is no longer satisfiable. Same family as the _far0 lesson: a
##     chain must never REVEAL a link the player's ring can't reach.
## S3. THE ASCENT vs THE CHAINS (decision briefed to Nick 2026-07-19):
##     The Ascent = the v1.4 three-chapter MAINLINE pinned above the
##     charter list. Ch1 Off the Rock (Sol): land 2 Sol worlds · 8 ore
##     loads · 4 parts · 2 components · build ⚡ Jump Drive → opens the
##     Neighborhood. Ch2: land 3 beyond Sol · life on 2 · conquer 1 ·
##     build 📡 Array → whole galaxy. Ch3: breed a hybrid · 2 gear ·
##     20 loads · build 🌌 IG Drive → the Trail takes over. Chapter
##     goals are PARALLEL by design (concurrent activities, any order)
##     and progress BANKS across chapters (review-fix law: out-building
##     your chapter never loses work).
##     ★ NICK'S RULING (2026-07-19, session close): OPTION A — the
##     mainline stays parallel — AND it gets RENAMED "CHAPTERS" and
##     MERGED with the progressive charter work: one quest system,
##     where the Chapters are the campaign spine (parallel goals per
##     chapter, banking intact) and the charters are its progressive
##     side-chains (accept-to-activate, reveal-on-complete). Naming
##     sweep required: "The Ascent" → "Chapters" across the board copy,
##     Guide, nudges, RELEASES vocabulary ("Chapter 1 — Off the Rock"
##     already reads right); check the naming law list (Ascent isn't
##     protected; Prime/Cosmic Codex are). ascStage/asc* internals can
##     keep their names — the SURFACE renames.
##     (Superseded option B: chapter goals reveal progressively — one
##     grammar, but artificial order on concurrent work, and banking
##     would complete hidden goals invisibly.)
##     WEEKLY GATE (Nick agreed to redefine): weeklies open when the
##     FIVE-TRADE chain completes; the Sol tour is optional side
##     income and does not gate. Crisp end to the guided phase.
## S4. ACTIVE-CHARTER CAP: EverQuest journals cap active quests. 3
##     accepted at once feels right (the board shows Available /
##     Accepted / Done sections, folds per the one-fold language).
##     First trade-chain link could AUTO-accept at training's end so
##     the "more charters available" handoff stays seamless.
## S5. QUEST GEAR vs THE FABRICATOR (economy collision): if charters
##     hand out gloves, the crafted Grip Gloves lose their moment and
##     the mine→craft pacing law bends. Rule: quest gear is the WORN
##     tier — lesser "Worn/Standard-Issue" variants (reduced eff) of
##     existing pieces, so crafting stays the upgrade path and the
##     Ascent's craft gates hold. Static phase = grant EXISTING item
##     ids only (zero new machinery).
## S6. THE AFFIX WALL (biggest technical lift in the loot plan): items
##     today are FIXED defs counted by id (items Map id→qty). "Low
##     random stats" means per-INSTANCE gear — a new save shape
##     (instance list), picker/equip/effect plumbing per instance, and
##     app-layer seeded rolls (fingerprint law). Static-first is what
##     makes v1.5.x shippable; the affix system is the v1.6 core.
##     When it lands: ONE loot faucet first (conquest spoils — Diablo
##     is kill-things-get-loot), drop tables obey POWER-DECOUPLED-
##     FROM-RARITY, and gear NEVER rides share codes.
## S7. SAVE-FIELD BUDGET (G12 discipline): the whole plan needs ONE
##     new field now — `chacc` (accepted charter ids, absent-safe
##     empty). Chain availability derives from chDone. Gear instances
##     wait for v1.6. Keep it that lean.
## S8. SIM COVERAGE IN THE SAME BATCH: accept-to-activate breaks every
##     persona bot unless simrun learns to accept charters first —
##     the harness must ship WITH the feature (the lesson this session
##     taught twice: drivers and build move together).
## S9. NUDGE + DEEP LINK: nextStepGoal should point at the current
##     chain link ("Accept your next charter" when none is accepted) —
##     and the toast/nudge could DEEP-LINK: tapping it opens the
##     charter board. Toasts are passive today; a small tap-to-open
##     system serves every future nudge, not just charters.
## S10. BURST vs CHAPTER PACING (small, watch it): one 10-pull burst
##     nearly completes c1-mine (8 loads) in a single press. Ore
##     AMOUNTS still gate crafting, so pacing likely holds — but
##     re-check chapter-1 time-to-Jump-Drive in the sim after the cap
##     lands; if it collapses, chapter goals should count PRESSES
##     (bursts), not loads.
## S11. DECLINE, WHEN IT COMES: declining a weekly needs re-roll rules
##     (gone for the week? redraw from the pool?) — park until Nick
##     wants decline at all.
##
## NICK'S DEVICE-PASS WATCHLIST (carried): the two Edge crash dumps
##    (renderer died in UnrecoverableAccessibilityError — browser-side;
##    canvas aria-hidden mitigation shipped in 1.5.2b; watch whether
##    the crashes recur and whether charters-won't-open recurs with
##    them — it never reproduced in a clean build); paperdoll socket
##    feel on his iPhone; farewell-card/namebox layering on iOS; G14
##    boot time (STILL unverified since v1.3).
## WHAT SHIPPED IN THE STAGED v1.5.2 LINE (context for the resume):
##    the Shipyard screen (ship + Fabricator + Research behind the 🛠
##    rail button, categories folded), Records board (🏆: rarity ladder
##    + achievements out of the sheet), bags-only inventory with slot
##    grid + pack-grown rows (Module = worn 🎒), one fold language
##    (expand/close pills everywhere), plain stat bars, specimen verbs
##    in a grid, 20-step training (landing + forge lessons), the Sol
##    tour charters, auto-run mining (burst cap pending above), depth
##    tax on field wounds, conquest mercy law (bred-only, once per
##    mend, 25% self-gate), names-are-names label pass, ring-sprite
##    clip fix, sticky panel ✕, first-shelf auto-open Compendium.
## (Wherever the v1.5.x line ended up at deploy time, this continues it.)

## ▶▶ v1.5.1 "THE MIRROR POLISH" — BUILT, STAGED, AWAITING NICK'S
## DEPLOY + BUMP WORD (2026-07-18 late; Nick: "apply those" + uncrowd
## the iPhone + one card grammar + a more human portrait):
##  · PORTRAIT v2: human proportions, neck/joints/face-behind-visor,
##    landing pad + ringed world (proof-sheeted, anchors re-pinned)
##  · UNIFORM CARD LAW: specimen verbs on TOP; sheet left column = 4
##    critical lines + 3 folds (Statistics / Collection / Achievements
##    master fold, nested groups)
##  · P6: equip picker POPOVER beside the tapped socket; phones stack
##    doll→CARGO→stats; ship thumb unclipped
##  · P1 MERCY LAW: bred champions crawl home Critical; champion duty
##    floors at 1 HP (scrape, never grave); can't lead below 25% HP.
##    VERIFIED: deep-sim deaths 347/700 → 0/60.
##  · RELEASES 1.5.1 staged hidden; GAME_VERSION stays 1.5 until the
##    bump word. Suites: fingerprint 50/50, smoke 277/277, systems
##    19/19, balance PASS, chaos 40/40.
##  STILL PARKED FOR NICK'S v1.6 PICKS: P2 Sol first-life, P3 arrival
##  pays, P4 conquest/duel inversion, P5 first Codex claim at stage 2,
##  P7 Legendary wall, P8 discovery XP — and Nick's own musing: a
##  fuller UI uniformity sweep as v1.6.
##  FROM THE 1,000-TESTER UI PANEL (8.5/10, "ship it"; two folded, two
##  parked): PARKED — phone socket anchors nudge off the figure art
##  (helmet-over-visor, torso stack; his device pass should judge);
##  desktop sheet left-column dead zone below the folds. Adversary-only
##  stall family (chaos re-opening reveals on the finale step) recovers
##  100% — recorded, not fixed.

## ★★★ v1.5 "FRESH START" IS LIVE ★★★ (2026-07-18/19, build 0d86e32,
## deploy pre-authorized in Nick's session charter; version.json v:1.5
## verified live, all systems present in the served html.)
## EVERY WORK ORDER SHIPPED (9 commits): the WIPE (cfcc_save_v2, no
## migration, farewell card honors the old expedition's rarest find;
## grandfather machinery + drawSurface/art-tiles purged; single-key
## baseline re-pin of the constants SAVE_KEY tail, documented) · THE
## PAPERDOLL CHARACTER SCREEN (full-body painterly explorer, 9 sockets
## anchored to the body, ship docked beside, stats left, cargo/
## Fabricator/Research beneath; proof-sheeted + live screenshots) ·
## specimen cards CONDENSED (world-card fold, cx bit 4, ⟁ hook never
## folds) · QUEST NOTIFICATIONS (login+idle next-step nudge, never
## twice per goal) · CHARTERS⇄CODEX slot swap · events+beacon DORMANT
## (buttons/Guide/achievement shelf hidden, engines refuse) · THE
## PATHFINDERS' TRAIL (beacon lore + reach per Signature, NINE relic
## blueprints one-per-socket gated on claims, Legacy teased honestly) ·
## XP RETUNE (levelOf 12·l²→6·l², measured: L3 reach 3%→24%; awards
## unchanged) · training tray bug fixed with a GRACE-BEAT sweep (the
## lesson's own panel gets 1.6s on screen, then yields).
## BUGS FOUND EN ROUTE: surfSeen (Groundfall/Trailblazer + worlds-
## landed stat) frozen since 1.3.8 — fixed into _performLanding.
## PRE-SHIP REVIEW (adversarial agent, 6 confirmed findings, ALL
## fixed): grace-beat sweep; Escape closes the sheet; nudge modal guard
## + hover shield cover the new surfaces; corrupt legacy keys earn no
## eulogy; primeFill claims coerced/clamped on load.
## SUITES AT SHIP: fingerprint 50/50 byte-identical (1 documented
## re-pin), smoke 277/277, systems 19/19, balance PASS.
##
## THE 5,000-TESTER ROUND (Nick's scale-up; fast 3,600 + deep 700 +
## ui 400 + chaos 300): ZERO errors, ZERO breaks, ZERO softlocks in
## every leg; training 700/700 complete incl. 300 chaos-adversary runs;
## the new sheet exercised 46,000+ times through the real DOM clean.
## How far they get: Jump Drive p50 65 actions (deep) / 203 (short
## sessions); Array p50 394 (32% of long sessions); IG 2/700; L3 165/
## 700 at p50 411 actions; deep fun-index p50 6.23 (rancher 6.72 top).
## One loud signal: 347/700 deep deaths, 344 of them CHAMPION-DUTY
## SPIRALS (re-fighting lost conquests as self at 1 HP — part bot
## tilt, part real design gap; medicine-never-kills held at 3).
##
## ▶▶ THE CRITIC PANEL'S v1.6 SLATE (4 lenses on the packs; ranked,
## AWAITING NICK'S PICKS — nothing built post-deploy without his word):
## P1 CONQUEST MERCY PACK (optimizer #1 + backlog item d): fallen bred
##    champions return 'Critical' instead of dying + a self-champion
##    floor (first conquest loss as yourself leaves you Critical;
##    conquest can't start while Critical). Converts the 347 run-ending
##    deaths into recoverable states. NOTE 42% of dead runs had no
##    bred champion — the self-floor half is what closes it.
## P2 SOL NEEDS FIRST LIFE (collector #1 + explorer #2): rancher
##    persona catalogued ZERO species in 722 short sessions — the
##    wiped Binder gains nothing until the Jump Drive (~200 actions).
##    Candidates: starter microbes on Mars/ice moons, Earth's own
##    breeding pair kept post-training, or ring-breach anomaly (e).
## P3 ARRIVAL PAYS (explorer #1, "the beacon's vacated job"): a first-
##    footfall/arrival event per new system that writes a log line —
##    18,044 jumps logged against ~18 payoff events is the loudest
##    ratio in the pack. Fits the corridor-wonder backlog item (g).
## P4 CONQUEST/DUEL INVERSION (optimizer #2): conquest wins 21% vs
##    duels 76% — duel-grinding is the degenerate XP path while the
##    named verb is a 4-in-5 loss. Telegraph winnable conquests
##    (picker already shows odds — surface them earlier) or raise +20.
## P5 FIRST CODEX CLAIM AT STAGE 2 (optimizer #3): zero Signature/
##    relic events in 700 runs — as gated, all nine relic blueprints
##    shipped as dead content. Let the first 1-2 Signatures (Stone/
##    Star?) be claimable in the home galaxy so the Trail's first
##    beacon lights during the Ascent, not after it.
## P6 SHEET POLISH (quartermaster, verdict "ALMOST — yes on desktop"):
##    (a) anchor the equip picker to the tapped socket (it renders
##    below the whole doll — cause and effect half a screen apart);
##    (b) mobile region order doll→CARGO→stats (the empty states
##    promise "the Fabricator below" but stats' long tail buries it);
##    (c) fold nameplate+rarity ladder into a collapsed Collection
##    group; (d) pull the ship-thumb module anchor in ~4% (clips at
##    the card edge on phones). Gear engagement is real (22% tap-to-
##    equip) but top-heavy: Hazmat Suit worn 1×, Verdant Locket 1×.
## P7 LEGENDARY WALL (collector #3): 61% of rare finds are the same
##    grade — within-ring grade variance or a shorter road to stage 2.
## P8 DISCOVERY XP (collector #2): all tracked XP came from combat —
##    cataloguing a genuinely new species could tick the sheet (+2?).
##    A pure collector is level 0 forever.
## KEEP AS-IS (panel consensus): the 6·l² curve ("thresholds honest,
## don't re-cut"), the Ascent stage-1 pacing (Jump p50 65 "crisp"),
## breeding (59% hybrid rate, "best-feeling loop in the game").
## NICK DEVICE-PASS WATCHLIST: paperdoll socket feel on iPhone;
## farewell card over the name prompt (iOS keyboard layering);
## G14 boot time (STILL unverified since v1.3).

## ▼▼ THE EXECUTED v1.5 CHARTER (kept for the record) ▼▼
## ▶▶▶ v1.5 "FRESH START" — THE NEXT SESSION'S CHARTER (planned
## 2026-07-18 at session close, Nick's words folded in verbatim-intent;
## RESUME HERE) ◀◀◀
##
## THE HEADLINE (Nick): **v1.5 WIPES ALL EXISTING DATA — a fresh start
## for everybody, nothing grandfathered.** Implementation: bump the save
## key (cfcc_save_v1 → cfcc_save_v2), no migration; the update bulletin
## announces the fresh start honestly (a "your old expedition is
## honored, the frontier begins anew" send-off — consider letting the
## old save's rarest find get a farewell card). CLEANUP DIVIDEND: the
## grandfather machinery becomes dead code — rc entry markers, rsw
## world flag, asc-absent⇒complete, land/cont absent-grandfathers,
## veteran charter auto-completes — ALL simplify to the post-law path.
## The Ascent/ring spectrum becomes every player's canon opening.
## drawSurface + art-tiles purge finally ships too (dead since 1.3.8).
##
## NICK'S v1.5 WORK ORDERS:
## 1. XP/LEVEL PROGRESSION BALANCE + SYNTHETIC TESTING: the class-XP
##    system (duels +8 · conquests +20 · guardians +60; quadratic
##    thresholds, innate arts at L3/L6) has never been tuned — and
##    levelOf only STARTED WORKING this session (the export hotfix).
##    Build a leveling tier into simrun.js (track XP curves per persona,
##    time-to-L3/L6/L9, art-unlock pacing vs duel/conquest cadence) and
##    balance the thresholds against real progression speed.
## 2. 1,000-BOT ROUND №2 — CHARACTER-SHEET FOCUS: how bots interact
##    with the sheet: stats readouts, equipment picker flows, shipyard,
##    nameplate, stat-growth legibility (eat-to-grow), achievements
##    panel. Instrument sheet-interaction telemetry + critic panel on
##    "is the character sheet a place you WANT to open?"
## 3. SPECIMEN CARDS CONDENSE (Nick: "same as the world cards"): fauna/
##    flora/fungi/microbe reveal cards + Compendium entries are walls of
##    text — apply the 1.1.2 world-card pattern: stats up top, identity
##    always visible, the verbose blocks (anatomy/behavior/habitat/
##    genome details) folded behind remembered expand groups (cardExpand
##    precedent, new bits), ⟁-grade hooks never folded. Same treatment
##    across reveal card, Compendium rows, duel side-cards.
## 4. BUG (Nick's live pass): the notification TRAY stays open over the
##    search box during training step 16 ("type earth") — the tray
##    opened in step 15 must close (or be closed by) the search step;
##    check the panel manager's training-inert rules for the tray.
## 5. COSMIC EVENTS + TRAVELER'S BEACON: **hide both for now** (buttons
##    + panels off; keep the engines dormant) and REWORK for a later
##    update — fold into the quest/notification system when they
##    return (beacon = charter-side "expedition of the hour"?; events =
##    seasonal spectacles with witness rewards).
## 6. UI SWAP: CHARTERS ⇄ PRIME CODEX positions (charters/Ascent are
##    the daily driver now — they earn the prime slot; the Codex is
##    endgame). + QUEST NOTIFICATIONS: a nudge pipeline that tells the
##    player their NEXT chapter goal / charter when idle or on login
##    (the pushNotif rail exists; add a "next step" heartbeat — gentle,
##    dismissible, never nagging twice for the same goal).
## 7. PRIME CODEX REWORK (Nick asked for thoughts — Claude's proposal,
##    for discussion at session start):
##    THE PROBLEM: the 9 Signatures predate the Ascent — they were the
##    only progression; now they overlap it (both gate reach) and their
##    verbs (conquer X, find Y) read like flat checklist charters.
##    THE PROPOSAL — "THE PATHFINDERS' TRAIL": the Codex becomes the
##    ENDGAME arc that begins where the Ascent ends (beyond the Rim):
##    · Each Signature becomes a mini-CHAPTER with narrative beats
##      (the Pathfinders' story told through their 9 lost beacons —
##      the lore hooks already exist in the hints), not a checkbox:
##      e.g. Flame = follow the third beacon's trail to a Magma-Sea
##      world in the Deep Field, ground it, conquer its guardian.
##    · Signatures keep gating the outer REGIONS (that part works and
##      now composes cleanly: Ascent owns rings 0-2, Codex owns 3+).
##    · Each Signature ALSO awards a unique Fabricator BLUEPRINT
##      (signature-tier gear/ship modules — ties the endgame arc into
##      the crafting spine; the "signature relics" set).
##    · Ring-spectrum synergy: each Signature's target band sits in
##      the region its trail reaches — the Codex becomes the guided
##      tour of the upper spectrum.
##    · The ending stays multi-flavored but adds the sandbox promise:
##      finishing the Trail unlocks a "Legacy" prestige layer (v2
##      hook) instead of just an epilogue.
##
## 8. THE PAPERDOLL CHARACTER SCREEN (Nick: "Diablo 2/3/4, PoE 1/2,
##    classic WoW look and feel" — also the fix for "I wasn't sure how
##    to open the Cargo"): opening the character sheet brings up a
##    CENTERED screen, one home for the whole explorer:
##    · LEFT PANEL: all the stats — battle stats, HP, rank/score,
##      expedition statistics (collapsible groups as today).
##    · CENTER: a FULL-BODY painterly portrait of your explorer (the
##      current avatar is a bust — extend playerAvatar to a full-length
##      paperdoll, HD engine law, proof-sheeted) with the equipment
##      sockets ANCHORED TO THE BODY: Helmet at the head, Earpiece at
##      the ear, Necklace below the chin, Suit on the chest, Gloves at
##      the hands, Leggings on the legs, Boots at the feet, Tool in a
##      hand, ship Module docked beside the figure (Shipyard thumbnail
##      as its anchor). Charm/necklace side-slots in the classic
##      positions flanking the portrait.
##    · UNDERNEATH: the full CARGO + INVENTORY grid (elements + crafted
##      items), with the Fabricator/Research tabs riding along — the
##      cargo panel folds INTO the character screen; the top-bar 🧰
##      button stays as a shortcut that opens this screen on its
##      inventory tab.
##    · MOBILE-FIRST CAUTION (iPhone primary): the classic three-column
##      paperdoll must stack on phones — paperdoll first, stats fold,
##      inventory below; sockets stay finger-sized.
##    · Panel-manager: this is a big centered surface — one-at-a-time
##      rules, ✕ + outside-tap, training-inert per the standing laws.
##    · SEQUENCING: build this BEFORE work order #2 (the 1,000-bot
##      character-sheet round) so the bots test the NEW screen — and
##      the specimen-card condense (#3) shares its visual language.
##
## CARRY-INS FROM THE v1.4.1 CRITIC PANEL (ranked backlog, Nick has
## seen the report):
##  a. Array wall: p50 378 actions/24% completion — cheaper Nav Core
##     chain or paying ch2 sub-goals.
##  b. Gear-ladder legibility: ⬆ upgrade pip on equipped items with a
##     craftable successor (Descent Stabilizers: 1/700 wears).
##  c. Exotic circular gate: wave-offs at hostile biome worlds drop a
##     pinch of that biome's exotic (failure funds the counter-gear).
##  d. Bred-champion mercy: fallen bred conquest champions return
##     'Critical' (or leave a re-breedable bloodline record).
##  e. Ring-breach anomaly: ONE rare near-home world carrying a single
##     deep-spectrum find — taste the spectrum early.
##  f. Death keeps the diary: reset leaves a 'recovered expedition
##     log' (fresh-start v1.5 makes this the right moment to design).
##  g. Stage-1→2 corridor wonder: en-route events on long hauls.
##  h. NICK DIALS still open: apex grades out of stats.best (Rarity-
##     achievement detonation — recommended YES); biome-vein valve
##     (recommended KEEP open).
##  i. Deferred features standing: cooking/provisions (flask slot),
##     Frontier Records, archaeology/fossils, hazardous flora (G15),
##     mined-out worlds as real estate (v1.5+ candidate), Shipyard
##     visual evolution (avatar tint by nameplate / rank-evolving
##     portrait), Eyeball World + per-hue rarity + V2 morphology + V13
##     crossGenome (domain decisions), G14 boot time (STILL unverified).
##
## SUGGESTED BUILD ORDER: wipe/fresh-start plumbing first (everything
## else simplifies behind it) → tray/training bug + UI swap + hide
## events/beacon (small, ship early) → THE PAPERDOLL CHARACTER SCREEN
## (#8 — before the bot round; full-body avatar proof-sheeted first) →
## specimen-card condense (shares the paperdoll's visual language) →
## quest notifications → Prime Codex rework (design sign-off with
## Nick first) → XP balance + leveling sim tier → 1,000-bot sheet-
## focus round + critic panel on the NEW screen → carry-in backlog by
## Nick's picks.
## Standing rules: extract.js first; proofsheet for ALL art; deploys
## on Nick's word; simrun.js (ui/chaos/fast/deep) is the regression
## gate; fingerprint stays byte-identical (the baseline survives the
## save wipe — determinism is about the universe, not the save).

## ★★ v1.3 "THE HD FRONTIER" IS LIVE ★★ (2026-07-18, build b79de67,
## Nick: "Ship it"). HD IS ALWAYS ON — no Classic mode, no setting.
## Shipped: painted landing vistas on every world (seeded compositions,
## weather spells, wonder rolls: sky rings / giant moons / biolume
## shores / star-tinted light), painterly portraits for ALL kingdoms w/
## grade-scaled rarity AURAS, HD material icons, class-colored glowing
## galaxy stars + textured nebulae, per-seed unique galaxies (kind-
## locked to the card), card-honest planets (band water / era lights /
## ring thumbs / typed moons), conquest arenas + guardian entrances,
## vista postcards w/ CF1 codes, painterly player avatar, card ✕ +
## drag, human-voice copy pass. Fingerprint 50/50 (two documented
## single-key re-pins of speciesPortrait ONLY — see baseline.json
## notes; wholesale regeneration stays banned), smoke 173/173, systems
## 19/19, balance PASS at ship.

## ▶▶ v1.3.5 "SOFT LANDINGS" (working name) — PLANNED 2026-07-18 from
## NICK'S LIVE PASS (5 phone screenshots + notes; plan approved: ___)
##
## HIS FINDINGS → ROOT CAUSES (all verified in source):
## N1 "little lines around recent nebulae": decoSprite 'rem' branch
##    draws 26 filament STROKES in a ring (~line 4662) — reads as dashes.
## N2 "circles around recent deaths": supernovaSites live loop strokes a
##    hard orange circle per remnant (~4823) + the gravitational-wave
##    cosmic event draws 3 stroked concentric rings (~4867). Nick's law:
##    NO circles/rings on deaths — gassy, blended, space-cloud look.
##    (Bonus: that whole loop allocates radial gradients per frame — a
##    known heat-rule violation; baking sprites fixes both.)
## N3 gas giants have no landing payoff: showVistaBox returns early for
##    type gas (~6788); zoom-in dumps you on flat band tiles; card says
##    "no surface to land on" while YOU ARE HERE. Nick: ALL worlds land,
##    gas giants included (Claude agrees — the "no surface" fact becomes
##    the scene, not a wall).
## N4 landing should carry a small ROLL of risk (HP scrape on a rough
##    descent) without making players fear landing.
## N5 MOBILE MENU STACKING (the unplayable one): every panel (Atlas /
##    Compendium / Cargo / Charters / Events / stats...) keeps its own
##    open bool, only some pairs mutually exclude, only some have
##    outside-tap close — they pile up and can only be closed from their
##    own buttons. Universal ✕ + one-panel-at-a-time needed.
## N6 zooming into a world should NOT land you into flat graphics — at
##    landing zoom it should ASK ("begin descent?"), then the VISTA is
##    the landing, with an ✕ to close (the ✕ convention goes everywhere).
##
## THE PLAN — 4 batches, each build → validate/smoke/systems → commit:
## BATCH 1 SPACE DUST (graphics): rework 'rem' deco sprite to a gassy
##    filament shell (soft puffs on the shell annulus, no strokes);
##    bake supernova-site remnants into cached textured sprites (seeded
##    by site.seed — kills the per-frame gradients too); replace the GW
##    event's stroked rings with soft luminous ripples ('lighter'
##    gradients, feathered). Proof sheet via headless Edge BEFORE Nick
##    sees it. No domain changes.
## BATCH 2 ONE PANEL AT A TIME (the unplayable fix, ships first if
##    split): central panel registry (id/el/close), openPanel() closes
##    the rest — BOTH platforms (predictability > desktop real estate);
##    ✕ in every panel header (reuse the card's .pxc language); one
##    unified empty-space-tap handler closes the open panel; vista gets
##    an ✕ too. Smoke: exclusivity matrix + ✕ + outside-tap.
## BATCH 3 EVERY WORLD HAS A VISTA (Nick 2026-07-18: "not just gas
##    giants — ensure every planet has a vista; the scene is whatever
##    the card indicates"). The 8 planet types are closed (gas/rocky/
##    desert/ice/terran/ocean/venus/lava) and GAS IS THE ONLY GAP —
##    the other 7 already render. So: (a) new gas scene — you hold
##    station in the high cloud deck: banded storm horizon, cloud-top
##    floor, polar auroras when the card promises them (V5 debt), ring
##    overhead when P.ring, typed moons, lightning in the deeps, aerial
##    fauna silhouettes when Gas Giant Life; header "Cloud deck" not
##    "Planetfall"; TYPE_DESC copy softens ("no solid surface — you
##    ride the high deck"). (b) HARD GUARANTEE: showVistaBox never
##    early-returns for any type; seed-sweep harness asserts 8/8 types
##    × the pal/wx matrix produce a scene. Card law holds everywhere.
## BATCH 4 THE DESCENT (landing flow, Nick's split):
##    - MANUAL ZOOM: the zoom STOPS at approach altitude, BEFORE the
##      flat surface tiles ever show — confirm sheet "Begin descent?"
##      with the risk read. Decline = stay in orbit (no re-prompt until
##      you pull back out past the threshold and dive again).
##    - LAND BUTTON: auto-lands, NO confirm (pressing it IS the intent).
##    - THE LANDING LADDER (Nick 2026-07-18: success lines up with the
##      BIOME, full spectrum, standardized game-wide; gentle on good
##      biomes, brutal on hostile ones). Six standard tiers, each biome
##      pinned to one (table in Batch 5): CALM 100% (no scrape) /
##      STEADY 90% (wave-off 2 HP) / ROUGH 75% (3-4 HP) / HAZARDOUS
##      55% (4-6 HP) / EXTREME 30% (5-7 HP) / HOSTILE 10-15% (6-8 HP).
##      WEATHER MODIFIER (Nick 2026-07-18: "very, very small"): an
##      ACTIVE weather spell = −5, and it never drags a Calm/Steady
##      world below 90 (weather is flavor risk, never a wall on
##      friendly worlds); floor 5% overall. The confirm sheet shows
##      the real % incl. the weather line ("storm in progress −5") —
##      (mechanics precedent: bioscan danger % is already shown;
##      vague-not-wrong governs world FACTS, not odds).
##    - THE ROLL (app-layer random, like first contact): SUCCESS → the
##      vista pops (the landing IS the vista). FAIL = WAVE-OFF: bounced
##      back to orbit with the tier's scrape (hull tech reduces,
##      routeHit, never lethal — floor 1 HP) + toast; retry immediate.
##    - THE PITY RAMP (anti-frustration, makes 10% biomes playable
##      without gear): each consecutive wave-off on the SAME world adds
##      +20% to the next attempt (10→30→50→70→90→100 — worst case 6
##      dives, ~25 HP; the pilot learns the approach). Resets only on
##      success; grounded worlds are forever 100% + skip the confirm.
##      Earth + training exempt (auto-confirm + auto-succeed).
##      Guide + RELEASES copy. Roll plumbing takes a success-bonus
##      modifier from day one (v1.4 gear slots straight in).
##    - v1.4 HOOK (Nick): crafted items will BOOST landing success up
##      to 100% (see the v1.4 craft-effects list) — so the roll plumbing
##      takes a success-bonus modifier from day one.
##
## BATCH 5 THE BIOME EXPANSION (Nick 2026-07-18: "think of all the
##    biomes possible... even brand new alien type biomes... a full
##    deep dive iteration" — more worlds to see, more vistas).
##    ARCHITECTURE (determinism-safe, Claude's design, Nick approving):
##    - The 8 domain TYPES are FROZEN — re-slicing planetParams' roll
##      would re-type every existing world (atlases, share codes,
##      grounded worlds would contradict player memory). Never.
##    - Instead a BIOME layer refines within type: biomeFor(P, desc) =
##      pure deterministic fn in a NEW app-layer module (depositsFor
##      precedent), seeded by hashInt(seed, BIOME_CONST) — a separate
##      stream, ZERO perturbation of existing rng draws, fingerprint
##      stays byte-identical, no baseline touch at all.
##    - CONDITIONED ON THE CARD so it never contradicts (vague-never-
##      wrong): biome rolls only among candidates the card's climate
##      band / Water row / Life row allow. "Mostly evaporated" terran
##      can't roll Marsh — it rolls Salt Flats. Swamp needs liquid
##      water + life. The card stays coherent by construction.
##    - PRESENTATION: card gains a Biome row (app-layer renderPanel,
##      like Mineral veins) and the SUB-LABEL wears it — players see
##      "Swamp world", "Fungal world", "Crystal world" as if new
##      planet types, engine keeps 8 archetypes underneath.
##    - CARD-HONEST ART: vista scene per biome family + thumb/system-
##      sprite tinting follows (swamp = dark blackwater mottle, crystal
##      = faceted glints). Rarity ladder: common biomes common, ALIEN
##      biomes rare (engineered-infinity L3 — wonder-class rolls).
##    PROPOSED BIOME SETS (Nick trims/renames; ~34 across 8 types):
##    - TERRAN: Temperate (current) / Swamp (blackwater fens, hanging
##      moss, mist) / Marsh (reed flats, braided channels, fireflies)
##      / Jungle (canopy tiers) / Savanna (gold grass, big herds) /
##      Tundra (permafrost moss, low sun) / rare-alien: Fungal (spore
##      towers, gill canopies) + Crystal Steppe (mineral spires).
##    - OCEAN: Open Sea + islands (current) / Archipelago (island
##      chains) / Coral Shallows (turquoise reef flats) / Storm Sea
##      (perpetual squall) / rare-alien: Milk Sea (biolume blooms).
##    - ICE: Glacier Fields (current) / Cryogeyser Plains (Enceladus
##      jets) / Pack-Ice Sea (pressure ridges) / rare-alien: Blue-Ice
##      Canyons (glowing crevasse light).
##    - DESERT: Dune Sea (current) / Salt Flats (blinding white,
##      mirage shimmer) / Canyon Lands (slot canyons, strata) / Oxide
##      Waste (rust + dust devils) / rare-alien: Glass Desert
##      (vitrified, lightning-fused).
##    - ROCKY: Cratered Highlands (current) / Graben Canyons / Boulder
##      Regolith / rare-alien: Geode Fields (amethyst gashes) + Carbon
##      World (graphite black, diamond glints).
##    - VENUS: Acid Haze (current) / Sulfur Storm Decks / rare:
##      Greenhouse Abyss (crushing gloom, constant lightning).
##    - LAVA: Ember Fields (current) / Obsidian Plains (black glass,
##      red cracks) / Magma Seas (molten-ocean coasts) / Ash Wastes.
##    - GAS: Banded Deck (Batch 3 scene) / Great-Storm Eye (a
##      hurricane bigger than worlds) / Pastel Ammonia Decks / rare:
##      Hot-Giant Glow (night side is a furnace).
##    LANDING SUCCESS BY BIOME (Nick's ask; % = base success, before
##    pity ramp / weather −10 / v1.4 gear; grounded worlds always 100):
##    - TERRAN: Temperate 100 · Savanna 100 · Tundra 90 · Marsh 90 ·
##      Jungle 85 · Fungal 85 · Crystal Steppe 85 · Swamp 80
##    - OCEAN: Coral Shallows 100 · Archipelago 95 · Open Sea 90 ·
##      Milk Sea 90 · Storm Sea 60
##    - ICE: Glacier Fields 90 · Pack-Ice Sea 85 · Cryogeyser Plains
##      70 · Blue-Ice Canyons 55
##    - DESERT: Dune Sea 90 · Canyon Lands 85 · Salt Flats 85 · Oxide
##      Waste 75 · Glass Desert 50
##    - ROCKY: Cratered Highlands 95 · Boulder Regolith 90 · Graben
##      Canyons 85 · Geode Fields 80 · Carbon World 60
##    - GAS: Pastel Ammonia Decks 75 · Banded Deck 65 · Great-Storm
##      Eye 30 · Hot-Giant Glow 15
##    - VENUS: Sulfur Storm Decks 30 · Acid Haze 25 · Greenhouse
##      Abyss 10
##    - LAVA: Ash Wastes 35 · Ember Fields 25 · Obsidian Plains 20 ·
##      Magma Seas 10 (Nick's "lava ~10%" anchor)
##    Alien biomes deliberately span the FULL spectrum (Fungal 85 →
##    Hot-Giant Glow 15) — alien ≠ dangerous; hostile ≠ boring.
##    EXTREMOPHILE LIFE — AUDITED + NICK'S DECISION (2026-07-18,
##    "we should still have life... sulfur-magma creature... icy
##    creature... lower chance based on how life survives"):
##    - AUDIT RESULT: biosphere() already gives EVERY type a nonzero
##      life chance — lava 10% microbial vent mats, venus 12% aerial
##      microbes, gas 14% cloud floaters, rocky 18%, ice 50%
##      subsurface hidden seas, desert ALWAYS at least microbial,
##      ocean rolls full Aquatic ecosystems (deep-sea worlds exist and
##      are covered). Nick's principle is already domain law.
##    - THE ACTUAL GAP: hostile types cap at MICROBIAL — no creature
##      ever appears. NEW: a rare EXTREMOPHILE FAUNA tier, carved as a
##      thin slice INSIDE each hostile type's existing single rng draw
##      (nested thresholds on the same r() call — NO extra draws, the
##      stream stays byte-aligned; only the sliced worlds' Life row
##      upgrades microbial→fauna). Biome-conditioned (a fauna world
##      preferentially rolls the biome its creature fits), wired
##      through the existing 'Extreme-World Life'/'Gas Giant Life'/
##      'Subterranean Life' habitats into bioscan/Compendium/vistas.
##    - EXTREMOPHILE FAUNA CHANCES — FULL PASS (Nick 2026-07-18:
##      "ultra rare on types we're almost positive wouldn't exist" —
##      chances follow REAL astrobiology, in four plausibility bands):
##      EARTHLIKE (life expected — the normal biosphere roll already
##        provides fauna, no slice needed): all terran biomes, all
##        ocean biomes except deep-vent below.
##      PROVEN EXTREME ~0.5-2.5% (Earth has these TODAY — vents,
##        brines, deserts, permafrost, deep rock):
##        Canyon Lands 2.5 · Dune Sea 2.0 · Cryogeyser Plains 1.5 ·
##        Pack-Ice Sea 1.5 · deep-vent fauna on hot-band oceans 1.0 ·
##        Blue-Ice Canyons 0.8 · Glacier Fields 0.5 · Oxide Waste 0.5
##        · Geode Fields 0.5 · Salt Flats 0.3 · rocky subsurface
##        (Cratered/Boulder/Graben cave fauna) 0.3
##      SPECULATIVE ~0.1-0.4% (debated science — Venus clouds,
##        Sagan's floaters): Pastel Ammonia Decks 0.4 · Banded Deck
##        0.3 · Sulfur Storm Decks 0.2 · Acid Haze 0.15 · Great-Storm
##        Eye 0.15 · Ash Wastes 0.1
##      NEAR-IMPOSSIBLE 0.01-0.05% (no real-world basis — THE GRAILS):
##        Ember Fields 0.05 · Glass Desert 0.05 · Carbon World 0.05 ·
##        Obsidian Plains 0.03 · Greenhouse Abyss 0.02 · Hot-Giant
##        Glow 0.02 · MAGMA SEAS 0.01 (Nick's "pure fire" anchor —
##        1 in 10,000; finding the magma-swimmer is a LEGEND, its
##        share code a trophy).
##      ENCOUNTER MATH (why these numbers): a player surveying ~1,000
##      worlds meets a handful of proven-extreme fauna (the loop pays
##      regularly), maybe ONE speculative find (a story), and near-
##      impossible finds stay community events. Rarity-tier/aura should
##      scale with the band (near-impossible ⇒ summit-grade rarity).
##    EXTREMOPHILE VISUAL LANGUAGE (Nick 2026-07-18: "these creatures
##    should look very alien-like... not just the aura"). THE LAW
##    EXTENDS: the ENVIRONMENT drives the anatomy. Alien-ness scales
##    with the plausibility band — band 2 reads as recognizably weird
##    Earth-logic; band 4 is fully alien body logic. Per-environment
##    GENE PACKS (material + palette + feature + glow, each pack a
##    combinatorial pool so no two match):
##    - MAGMA/EMBER: obsidian-plate hide w/ glowing seam-cracks (ember
##      rim light), heat-vane fins, slag-shell backs; basalt black +
##      ember orange.
##    - UNDER-ICE VENT (Europa logic): translucent antifreeze flesh,
##      biolume lures, eyeless-or-huge-eyed (deep-sea rules), frost-
##      crystal shells; blue-white + biolume cyan.
##    - DEEP-VENT OCEAN: black-smoker armor, mineral-crust plating,
##      siphon mouths; charcoal + mineral glints.
##    - VENUS ACID CLOUDS: float-sac drifter bodies, trailing filter
##      tendrils, iridescent acid-sheen membranes; sulfur gold-greens.
##    - GAS DECK: hydrogen ballonets, kite membranes, storm-riding
##      sails — palette MIRRORS that world's own deck bands (card!).
##    - ROCKY SUBSURFACE: pallid eyeless troglobites, echo-sense
##      organs, crystal-tipped feelers.
##    - SALT/BRINE: halophile PINKS (real Earth biology — brine pools
##      are pink today), salt-crust carapace.
##    - CARBON WORLD: graphite-black bodies, diamond glint facets.
##    - GLASS DESERT: vitreous translucent shells, fulgurite spines.
##    IMPLEMENTATION: descriptor TEXT drives it (card-drives-picture) —
##    extremophile FA_TRAIT/hide pools per habitat ("obsidian-plated,
##    veins of cooling magma", "antifreeze-clear blood") live in the
##    NEW extremophile species branch ONLY (existing species pools/
##    streams untouched — new text is reachable only from the new Life
##    levels, so existing genomes stay byte-identical); hdGenesFor +
##    the portrait renderer learn the material/glow packs; the SAME
##    render is globally there (vista herds / reveal card / Compendium)
##    per the Phase-2 rule. FLORA TOO: chemosynthetic tube gardens at
##    vents, cinder blooms + sulfur chimneys on ember fields, frost-
##    crystal flora under ice, aeroplankton veils in acid clouds —
##    vista-visible where the card grants them. RARITY FLOORS by band:
##    proven-extreme ⇒ elevated floor; speculative ⇒ high floor;
##    near-impossible ⇒ summit-grade floor + full aura treatment (the
##    magma-swimmer must LOOK like the legend it is).
##    - THIS IS A DOMAIN CHANGE, AUTHORIZED BY NICK 2026-07-18 (the
##      V13-class call, made): ~2-3% of hostile worlds' Life row text
##      changes. Per the re-pin protocol: per-probe diff first; if a
##      pinned baseline world falls in a slice, single-key re-pin with
##      note naming this decision. Wholesale regen stays banned.
##    - DANGER = RARITY (the Diablo-loot law): the hardest landings
##      host the strangest finds.
##    AIR/LAND/SEA AUDIT (Nick 2026-07-18 "complete pass... see if
##    there's anything we're missing"; audited FA_*/FLORA_FORM/
##    FUNGI_FORM/MICROBE_FORM/FA_HABITAT/planetSpecies):
##    - FAUNA: LAND rich (11 locos). SEA solid at the surface
##      (swimmers/jet-swimmers/filter-feeders; coastal/open-ocean/reef
##      habitats) but NO abyssal-trench or under-ice habitat. AIR thin:
##      only passive fliers (gliders/floaters/drifters/current-
##      drifters) — no powered winged hunters despite the four-winged
##      body plan. MICROBES already gloriously extreme (sulfur-eating,
##      acid-pool, methane-eating, snow-algae — aligned as-is).
##    - FLORA: LAND strong (18 forms). SEA MISSING ENTIRELY — aquatic
##      worlds roll flora but FLORA_FORM has no kelp/seagrass/reef-
##      builder/sargassum (the "kelp, algae mats" only exist in a
##      comment!). AIR flora nonexistent.
##    - HARD CONSTRAINT (learned): existing pools are INDEX-PINNED
##      (genome rolls use (r()*len)|0 — extending ANY existing array
##      re-rolls every existing creature). ALL additions ship as
##      PARALLEL POOLS reachable only from NEW species branches/slots:
##      · EX_HABITAT (extremophile branch): beneath the ice sheets,
##        abyssal trenches, cooling lava margins, acid cloud layers,
##        storm-eye updrafts, brine pools, the eternal twilight ring.
##      · EX_LOCO adds powered fliers: winged hunters, storm-riders,
##        thermal-soarers (aerial fauna finally get wings that flap).
##      · AQ_FLORA (new additive slots on aquatic worlds, separate
##        hash stream — existing species byte-identical, worlds GAIN
##        rows): kelp towers, seagrass meadows, reef-builder colonies,
##        sargassum rafts, biolume bloom fields.
##      · AIR_FLORA (new slots on aerial-life worlds): aeroplankton
##        veils, drift-spore banners, cloud-garden colonies.
##    - BIOMES +5 (audit gaps → ~39 total): Mangrove Coast (terran
##      wet — the mangrove-tangles habitat gets its world; land 90) ·
##      Karst Caverns (rocky/terran — crystal-cavern + cave fauna
##      stage; land 80, cave fauna 1.0) · Volcanic Archipelago (ocean
##      — ember-meets-sea, Hawaii logic; land 70) · Abyssal Ocean
##      (ocean, no islands, lightless deep — vent/abyssal fauna stage;
##      land 75, vent fauna 1.5) · EYEBALL WORLD (terran/ice around
##      RED DWARFS — tidally locked: permanent day face, frozen night
##      face, life crowded into the terminator ring; the existing
##      'twilight terminator zone' habitat finally gets its world;
##      card-honest via the star's spectral class; land 85; rare-alien
##      showpiece).
##    - VISTA WIRING: hdVista already carries air/aqua counts (opts) —
##      the new fliers/swimmers have a rendering path waiting.
##    FLORA VARIETY PASS (Nick 2026-07-18 "all the various types of
##    plants and trees... obviously a fire world never has plants"):
##    biome-conditioned FLORA FAMILIES — each biome weights its plant
##    species toward what belongs (mangrove tangles on Mangrove
##    Coasts, succulent/cactus-analogues + deep-root scrub in deserts,
##    cushion-scrub + dwarf frost flora on tundra, reed thickets in
##    marshes, canopy titans in jungles, kelp/seagrass/reef flora in
##    the sea biomes, aeroplankton on aerial-life worlds). The card's
##    Life row remains the gate — fire/airless/lifeless worlds get NO
##    flora, ever, unless an extremophile slice grants it (cinder
##    blooms are card-granted, never decoration). Vista plant stamps +
##    species rosters + thumbs draw from the same biome family so the
##    world reads as ONE ecology, not a hodgepodge.
##    WEATHER EVENT SYSTEM (Nick 2026-07-18 "crazy other weather
##    events... tornadoes in the background... drives 'what's going on
##    with this planet?'"). AUDIT FINDING: weatherText() ALREADY
##    promises the spectacle — "Continent-sized cyclones", "Endless
##    hurricanes", "Planet-circling dust storms", "cryovolcanic geyser
##    plumes", "sulfuric-acid drizzle that evaporates before it lands",
##    "storms of glowing rock vapor" — and the vista renders generic
##    rain/dust. ANOTHER CARD DEBT (the aurora pattern). THE FIX:
##    weather EVENTS as app-layer spell rolls (the proven seeded ~90s
##    mechanism), conditioned on Weather row + type + band + biome —
##    common weather common, SHOWPIECES rare. No domain text changes:
##    exotic phenomena the old row lacks ride the NEW biome row's text
##    (iron rain lives in Hot-Giant Glow's description). EVENT CATALOG:
##    - TERRAN temperate: thunderstorm (forked lightning, wind-bent
##      trees, downpour) · TORNADO funnel on the horizon (rare) · hail
##      · fog banks · monsoon walls (jungle/marsh) · rainbow after
##      rain (optical wonder).
##    - TERRAN cold: blizzard whiteout · ICE STORM (crystal-coated
##      flora) · diamond-dust glitter · sun dogs / light halos (real
##      ice-crystal optics).
##    - TERRAN hot: heat shimmer · dry lightning · firestorm fronts
##      (rare).
##    - OCEAN: HURRICANE wall on the horizon (the card's endless
##      promise, finally painted) · WATERSPOUTS (rare) · squall lines
##      · lightning over open water.
##    - DESERT: HABOOB (advancing sand-cliff wall — the showpiece) ·
##      dust devils · dry lightning · global-storm haze days · mirage
##      shimmer.
##    - ICE: CRYOGEYSER ERUPTIONS (the card's plumes, painted) ·
##      nitrogen frost-fog · aurora storms.
##    - VENUS: ACID VIRGA (rain dying mid-air — the card's exact
##      sentence, painted) · sulfur mega-lightning · crush-haze.
##    - LAVA: VOLCANIC LIGHTNING in the ash column (real physics,
##      spectacular) · ember rain · FIRE WHIRLS (rare) · rock-vapor
##      glow storms.
##    - GAS: the cyclone wall seen from the deck · ammonia lightning
##      lighting clouds from below · biome-carried exotics: IRON RAIN
##      (Hot-Giant Glow) · glass-shard winds · diamond hail (deep
##      decks, rare).
##    - ROCKY/airless: stays honest — no atmosphere, no weather, ever.
##    WIRING: surface status line + vista caption word the event
##    ("volcanic lightning storm"); the descent confirm's weather line
##    names it ("hurricane in progress −5") — Nick's exact fantasy:
##    see the storm from orbit, dare the landing, land INSIDE it.
##    Overlays pre-baked per event (heat rules); smoke probes per
##    event family; postcards inherit (a tornado postcard!). (5b)
##    NMS-INSPIRED ADDITIONS (Nick shared No Man's Sky's full update
##    arc 2026-07-18; three fits for THIS patch, filtered hard):
##    - COLOSSAL WANDERERS (Origins' sandworm energy, 100% card-
##      honest): FA_SIZE already has 'titanic' and the Megafauna realm
##      exists — when a world's OWN roster holds a titanic creature, a
##      rare wonder-roll renders it at TRUE horizon scale in the
##      vista: a sandworm breaching the Dune Sea, a leviathan arching
##      out of the Open/Abyssal ocean, a sky-colossus silhouette
##      crossing the gas deck. The card said titanic; the vista
##      finally means it. (5b)
##    - UNDERWATER VANTAGE (The Abyss): the Abyssal Ocean biome's
##      vista is the game's first SUB-surface view — biolume drifts,
##      vent glow below, the dim ceiling of the sea above (cloud-deck
##      precedent: the vantage follows the card's truth). (5b)
##    - HAZARDOUS FLORA (Visions): dangerous plant traits in the NEW
##      parallel pools (spore-burst pods, snap-traps, acid sap) —
##      vista-visible, card-warned in the flora text (vague-never-
##      wrong), tiny field-sample risk on the worst offenders. Plants
##      stop being furniture. (5a text + 5b art)
##    FILTERED OUT for now (noted for v1.4+ below): Wonders/records
##    catalogue, archaeology/fossils; bases/freighters/multiplayer/
##    settlements are a different game.
##    FULL-KINGDOM BALANCE GATE (Nick: "eventually somebody will just
##    hunt out one creature... full balance pass on everything"):
##    - LAW: POWER IS DECOUPLED FROM RARITY. Rarity buys aura,
##      prestige, stardust value and Compendium glory — NOT combat
##      dominance. Extremophile/summit finds stay inside the tuned
##      combat bands; no biome or species may be the strictly-best
##      hunt. (The chase stays wide — Diablo law: many viable grails.)
##    - GATE: the balance-sim extends to ALL FOUR KINGDOMS (fauna,
##      flora, fungi, microbes) incl. extremophiles + cross-pool
##      hybrids: duel win-rate spread, feeding/medicine value
##      distribution (no single flora farm dominates healing), breed
##      outcomes, conquest champion spread. Any dominant strategy the
##      sim flags gets tuned BEFORE the batch ships (balance PASS is
##      already a ship gate — this widens what it covers).
##    PUSH PLAN (separate pushes, Nick's word each): 5a biomeFor +
##    card row + sub-label + landing-ladder audit + the parallel gene
##    pools/slots above; 5b vista scenes per biome family (the big art
##    batch — proof sheets per family); 5c thumbs/system sprites.
##    Seed-sweep gate extends to the full type × biome × pal matrix.
##    v1.4 HOOK: rare biomes can gate rare VEINS later ("rarer worlds'
##    veins gate rarer recipes" — biome becomes the flavor carrier).
##
## CLAUDE'S GAP AUDIT (2026-07-18, Nick: "anything else that could be
## missing that I didn't think about") — folded into the batches:
## G1 DISCOVERABILITY OF THE GRAILS: at 0.01% nobody will know the
##    magma-swimmer EXISTS. The orbital glance/survey must HINT on
##    extremophile-slice worlds ("faint biosignatures — where nothing
##    should survive", ⟁-language, vague-never-wrong) so the hunt is
##    playable, not blind luck. + New charters ("Catalogue an
##    extremophile") and Prime Codex/achievement hooks pointing at
##    hostile-biome hunting, so the content advertises itself. (5a)
## G2 BREEDING EXTREMOPHILES: crossGenome must handle the new parallel
##    pools safely (index math). RECOMMENDATION: breedable with
##    anything (infinite-Pokémon pillar — magma-beast × meadow grazer
##    hybrids are the dream), hybrid draws each gene from the parent's
##    own pool so indices never cross pools. (5a + smoke)
## G3 BALANCE: summit-grade rarity floors mean extremophiles could
##    dominate duels/conquest — balance-sim gate must cover them; tune
##    power separately from rarity if the sim flags it. Conquest
##    ARENAS also need the new biome backdrops or the defender's-biome
##    arena renders wrong. (5b)
## G4 WAVE-OFF DAMAGE ROUTING (design call made): the EXPLORER takes
##    landing scrapes (it's piloting, not fieldwork) — the Field Scout
##    only absorbs bioscan wounds. Hull tech reduces both. (Batch 4)
## G5 PITY-RAMP PERSISTENCE: ramp progress saves per-world (small
##    capped map) — losing 5 wave-offs of progress to a page reload on
##    a 10% world would be rage-quit fuel. (Batch 4, save field w/
##    absent-safe default)
## G6 SEARCH & ATLAS: biome joins the search index ("swamp", "eyeball")
##    and Atlas rows show the biome word — hunting by biome becomes a
##    real workflow. (5a/5c)
## G7 EVENT LANGUAGE: wave-off/landing toasts classify into the evClass
##    color palette (harm red scrape, gain green touchdown, gold first
##    footfall on a Hostile world); planetfall whoosh gets a wave-off
##    variant sting (volume/rmotion rules apply). (Batch 4)
## G8 RULE-7 SWEEP: every batch lands its Guide topic updates (landing
##    ladder, biomes, extremophiles) + categorized RELEASES bullets in
##    the same batch it ships. (all)
## FINAL AUDIT (2026-07-18, pre-build):
## G9 PANELS vs MODALS (Batch 2, ship-blocker-grade): the overlay list
##    (~line 4064) mixes closable PANELS (codex/log/stats/events/
##    cargo/charters/setpanel/guidebox/primebox/search results/notif
##    tray) with true MODALS (duelbox mid-fight, pickbox, reveal,
##    namebox, deathbox, endingbox). Tap-outside-to-close applies to
##    PANELS ONLY — a stray tap must NEVER close a duel, a reveal, or
##    a name prompt. Registry carries a modal flag; modals keep their
##    explicit buttons (and get the corner ✕ only where dismissal is
##    already legal). Notification tray + search results JOIN the
##    panel registry (they stack today too).
## G10 COPY SWEEP "zoom all the way in" (Batch 4): the charter
##    st-land text, the landcta fallback toast, and the Guide survey
##    topic all teach "zoom all the way into this world" — every
##    instance updates to the descent-confirm flow in the same batch,
##    or the game teaches a lie.
## G11 ROLL SEQUENCE ON CIV WORLDS (Batch 4, defined not changed):
##    descent roll first; first-contact roll only fires AFTER a
##    successful landing (as today, on the card render). No stacking
##    surprise: civ worlds are overwhelmingly temperate terran = Calm.
## G12 SAVE SCHEMA TALLY (whole patch): exactly ONE new save field —
##    the pity-ramp map (capped, absent-safe default empty). Biomes/
##    weather derive from seed; extremophiles ride the codex; panel
##    state is transient. Keep it that way.
## G13 VISTA ✕ IN TRAINING (Batch 2): follows the card-✕ rule —
##    hidden during training (the vista is the lesson); tap-to-
##    dismiss still works there.
## G14 STILL UNVERIFIED FROM NICK'S v1.3 WATCHLIST: boot time on his
##    big save — none of the 1.3.5 batches touch boot; Nick should
##    watch it on his next pass and report.
## POST-NMS AUDIT (2026-07-18, second pass over the three additions):
## G15 HAZARDOUS FLORA ✕ FATAL MEALS (coherence win): the fatal-meal
##    mechanic already exists — hazardous flora species should be the
##    LIKELY fatal meals (the card warned you; feeding acid-sap to
##    your champion is on you). One system, two faces. Sample-time
##    scrapes from hazardous flora route like bioscan wounds (Field
##    Scout absorbs — it's fieldwork, unlike landing G4).
## G16 UNDERWATER VANTAGE WIRING: the F3 aquatic filter runs in
##    REVERSE beneath the waves (swimmers/drifters IN, walkers OUT);
##    weather/aurora/moon overlays don't reach the deep (always-dark
##    pal, biolume is the light); header copy "Descent — beneath the
##    waves" not "Planetfall".
## G17 COLOSSAL WANDERERS: visual-only (no combat/balance surface —
##    the titan on the horizon is the same creature already in the
##    roster); joins the wonder-roll family + first-sighting gold
##    caption; "Witness a colossal wanderer" charter/achievement
##    candidate rides G1 discoverability.
## G18 5b SCOPE SPLIT: the art batch is now large — 5b-i biome scene
##    families; 5b-ii weather events + wanderers + underwater vantage.
##    Two proof-sheeted pushes instead of one monster.
## FINAL OCD AUDIT (2026-07-18, Guide matrix + achievement math):
## G19 GUIDE COVERAGE MATRIX (17 topics audited; the batch that ships
##    a feature ships its Guide line): zoom (descent confirm replaces
##    zoom-to-land) · survey (ladder %, biome row, ⟁ extremophile
##    hints) · search+atlas (biome terms) · charters (new types) ·
##    colors (wave-off/touchdown classes) · discover (extremophile
##    hunting, hazardous-flora sampling) · kingdoms (gene packs, sea/
##    air flora, wanderers) · breed (cross-pool hybrids) · feed
##    (hazardous flora = risky meals) · mining (gas giants behind the
##    first-landing roll; veterans grandfathered) · settings (Motion
##    gates weather animation). + ONE new topic: 'landing' (the
##    ladder, wave-offs, pity ramp, grounded = forever safe). beacon/
##    rank/ending/events/codes: no change needed (verified).
## G20 ACHIEVEMENT MATH GUARDS (would have silently broken):
##    - Bestiary counts FA_BODY.length — extremophiles REUSE the 16
##      body plans (material/gene packs only, no new body indices).
##    - Warden of Realms counts REALM_ORDER.length — extremophiles
##      map INTO existing realms (Extreme-World/Gas Giant/
##      Subterranean); NO new realm entries.
##    - Five Flavours / Master of Arts — new flora/fauna draw from
##      the existing 5 flavors + existing ABILITY_THEMES. No pool
##      growth on achievement-counted arrays anywhere.
## G21 WEEKLY CHARTER POOL: selection hashes the pool SIZE
##    (hashInt(0xC4A7, week, 7)) — growing the pool changes which
##    weeklies a given week rolls. Ship pool growth as a deliberate
##    one-time rollover (note in RELEASES); cross-player determinism
##    holds per version.
## G22 MOTION SETTING gates all animated weather/wanderer overlays
##    (rmotion whitelist extends); thunder/ambient stings honor the
##    volume taper.
## G23 RESET clears the pity-ramp map (save hygiene; reset stays a
##    full clean slate).
##
## SETTLED (Nick 2026-07-18): VERSION IS 1.3.5, separate pushes per
## batch. STILL HIS CALLS: descent success/damage numbers (proposal:
## Calm 100%; Rough ~85%, wave-off 3-4 HP; Hazardous ~70%, wave-off
## 5-8 HP — before v1.4 item bonuses); panel exclusivity on desktop
## too (recommended yes); Batch 5 biome list trims/renames + whether
## sub-labels read "Swamp world" style (recommended yes).

## ★★ v1.3.5 "SOFT LANDINGS" IS LIVE ★★ (2026-07-18, build bc70152,
## Nick: "ship it"). Deployed after the pre-ship review (2 agents +
## self-review, all findings fixed) — suites at ship: fingerprint
## 50/50 byte-identical, smoke 214/214, systems 19/19, balance PASS.
## ALL FIVE BATCHES LANDED (7 commits, one per push):
##  B2 panel manager (one panel at a time both platforms, ✕ everywhere
##     incl. vista, modals exempt + training-inert; ALSO fixed a real
##     vista dismiss race a fast tap could hit on phones)
##  B1 space dust (gassy remnant shells, soft merger ripples, baked
##     sprites — the per-frame gradient heat sink is gone)
##  B3 cloud deck (8/8 vista coverage; TYPE_DESC + status copy fixed —
##     gas giants no longer claim "airless")
##  B4 the descent (biome ladder w/ shown %, zoom stops at approach +
##     asks / Land button auto-rolls, wave-off never lethal, +20% pity
##     SAVED per world [field wvo], grounded forever safe, weather −5
##     small, Earth+training exempt, Guide topic 'landing', copy sweep)
##  B5a biomes (~35 in 8 frozen types, band-conditioned, sub-label +
##     Biome row, rare kinds violet; EXTREMOPHILE fauna slices in
##     domain [Nick-authorized; NO pinned probe world fell in a slice —
##     fingerprint 50/50 with ZERO re-pins]; parallel pools EX_HABITAT/
##     EX_LOCO/AQ_FLORA/AIR_FLORA via g.x/g.aq/g.af markers; kelp at
##     last; xfauna breed true when both parents are; weekly charter
##     'Down the hard way'. EYEBALL WORLD DEFERRED: tidal lock would
##     contradict the Seasons row — NICK DOMAIN DECISION pending.)
##  B5b-i biome-dressed vistas (9 feature painters + identity washes;
##     header names the biome; deck tuned per gas biome; NOTE for
##     Nick's device pass: terran color identities [savanna gold, swamp
##     gloom] are directionally in but want palette-level tuning
##     against real screenshots)
##  B5b-ii weather events (9 showpieces, seeded spells, named on
##     surface line + vista caption + descent ask), colossal wanderers
##     (titanic roster members break the horizon), the deep (abyssal
##     underwater vantage)
##  B5c biome-tinted orbit sprites (band-independent types only —
##     honesty over flair on search thumbs)
##  + language pass (training un-bolded to functional-only, descent
##     language replaces zoom-to-land everywhere, intro tightened)
## PRE-SHIP REVIEW (2026-07-18, Nick's final-check ask; 2 review agents
## + self-review, findings fixed in-batch):
##  FIXED: per-frame biomeFor/wxEventFor alloc on the surface status
##  line (heat rule — now env-cached per spell bucket); stale descent
##  confirm on zoom-out/travel (_descAbort); cached vista header lost
##  the biome name on re-view; the mining Guide topic still taught
##  "zoom all the way in" (G10 residual); Atlas entries now BOOKMARK
##  UNDER THE BIOME NAME (G6 real fix — "swamp"/"carbon" searchable;
##  pre-1.3.5 entries keep type labels, honest); hull1 now trims
##  wave-off scrapes (G4 promise); gold "Through the fire" toast on
##  first grounding of a <=30% world (G7); 7 Guide teaching lines
##  (G19: survey/discover/kingdoms/breeding/colors/charters/search);
##  'Against All Odds' achievement — catalogue an extremophile (G1);
##  cross-pool breeding smoke checks (G2).
##  DEFERRED, NOW RECORDED (completeness agent caught the silent
##  drop): HAZARDOUS FLORA (spore-bursts/snap-traps/acid sap + the
##  fatal-meal linkage G15 + scout-absorbed sample scrapes) — NOT
##  BUILT in v1.3.5; queue with the 5b portrait-materials work.
##  Also still open as candidates: 'Witness a colossal wanderer'
##  charter; first-sighting gold caption for wanderers; per-hue
##  color rarity (currently 17 hides uniform ~5.9% — finish rarity
##  rides the creature tier instead; making hues rarer for NEW
##  creatures is a domain call for Nick).
## SUITES AT BUMP: fingerprint 50/50 byte-identical (zero re-pins
## needed), smoke 211/211 (+38 new checks), systems 19/19, balance
## PASS. New tools: proofsheet.js + sheets/ (headless-Edge art review;
## 5 proof rounds inspected, 3 in-review fixes).
## AWAITING: Nick's deploy word; his device pass (esp. terran biome
## washes + aura feel + boot time on his big save — G14 still open).

## ★★ v1.3.6 "QUIET SKIES" IS LIVE ★★ (2026-07-18, build c1bac38,
## Nick: "build it and deploy it"). + hover cards live at SYSTEM scale
## only (a tap is intent, a hover is an accident — sweeps at galaxy
## scale strobed every star card; taps unchanged everywhere). From Nick's desktop live pass:
## training rigs now -1 (beat ANY odds — a failed training breed ate
## both parents and stranded him); training hover glances step-scoped
## (his "one voice" ask — find-earth lets Earth glance); STAR CHARTS
## setting (Graphics, OFF default, save field chart) hides orbit
## paths/hz band+label/belt label/Oort dashes; surface zoom capped
## 600->6 (tile smear + untextured region at extreme zoom); EARTH
## EXEMPT from the biome roll (was re-labeled "Savanna world" against
## its own card). RELEASES[0]=1.3.6 staged hidden. Suites: fingerprint
## 50/50, smoke 218/218, systems 19/19, balance PASS.

## ★★ v1.3.7 "ONE LESSON AT A TIME" IS LIVE ★★ (2026-07-18, build
## 840e651). Training answers ONLY the lesson: survey-card actions gate
## to per-step acts:[] whitelists (Nick landed on Earth mid-atlas-
## lesson — the whole panel was an allowed surface); specimen-card
## verbs gate to per-step rev:'' (card-tour keeps the reversible scout
## toggle); the vista backdrop is near-opaque dark space (the ground
## close-up leaked through the blur). Suites at ship: fingerprint
## 50/50, smoke 219/219, systems 19/19, balance PASS.

## ★★ v1.3.8 "THE VIEW HOLDS" IS LIVE ★★ (2026-07-18, build 5b9652d).
## LANDING NEVER LEAVES SPACE: surface mode is unreachable — the zoom
## transition holds at approach framing and _performLanding runs the
## rites spaceside; openLandingVista derives clock/weather/roster
## standalone (planetDescriptor fallback when no card is open); Land
## button + confirm land at approach zoom; the Landing vista button
## rides any grounded world's system card and REBUILDS after reload.
## Training zooms but never lands. Vista ✕ now in every vista incl.
## training; ? popover obeys the one-panel rule (Nick's settings-
## under-helppop overlap). NOTE: drawSurface + the surface caller
## block are now dead code — PURGE CANDIDATE for a cleanup batch
## (kept this ship for zero-risk deploy). v1.4 panel exceptions
## (inventory+bench co-open) deferred to the Fabricator design.
## Suites: fingerprint 50/50, smoke 220/220, systems 19/19, balance
## PASS. (Also note: Nick's 1.3.7-era reports came from a CACHED
## 1.3.6 client — the update pill matters; watch his next session
## picks up 1.3.8 cleanly.)

## ★★★ v1.3 LINE COMPLETE — SEVEN SHIPS IN ONE DAY (2026-07-18) ★★★
## 1.3 (HD Frontier, pre-session) → 1.3.5 Soft Landings (bc70152) →
## 1.3.6 Quiet Skies (c1bac38) → 1.3.7 One Lesson at a Time (840e651)
## → 1.3.8 The View Holds (5b9652d) → 1.3.9 Eyes on the Lesson
## (1caf852) → 1.3.10 Kingdom ShelVES IS LIVE (89ac8c9, FINAL v1.3
## UPDATE — Compendium kingdom chips + tinted shelves; chips hidden in
## training; counts read the filtered truth). Ship-gate suites green
## on every ship; final exploit sweep PASS (wvo clamped, chart strict,
## samples/charters unfarmable, wave-offs grant nothing, filter
## transient). Fingerprint ended the day 50/50 byte-identical with 3
## documented single-key re-pins. Smoke grew 173 -> 227.
## THE v1.3 LINE IS CLOSED. Next session opens v1.4 "THE ASCENT".

## ▶▶ NICK'S DIRECTIVE ROUND (2026-07-18, third pass — ALL BUILT):
## · EQUIPMENT = NINE SOCKETS (his slot set): Helmet · Earpiece ·
##   Necklace · Suit · Gloves · Leggings · Boots · Tool · Module.
##   New gear per slot (headlamp/visor/Voidglass visor; comms earpiece
##   + reslotted Vein Resonator; meteorite pendant/Star Compass/
##   Diplomat's Beacon/Prismatic Pendant; grip+surgeon's gloves; field
##   leggings/greaves; mag-boots/Graviton Boots). Medkit removed
##   (Surgeon's Gloves carry heal). 4 new icon families, proof-sheeted.
## · "Planetside" replaces "Landing vista" (his pick) — button + notes.
## · Duel skip label = "⚔ Skip" (his emoji call).
## · AUTO-EXTRACTOR LOADS COUNT (try-and-iterate): stats.mines and
##   Ascent mining goals count loads, not presses; wording back to
##   "loads of ore".
## · EARTH HARVESTS (audit fix applied): home is settled-from-start and
##   now pays hourly stardust like any settled world (card was gated on
##   a fauna roster Earth's hardcoded rows never had).
## · BIOME-GATED VEINS (his "very cool, do it"): geode→Nd, carbon→Pm,
##   glass→Vg, magmasea→Pz — guaranteed ✦ vein on the card, steady
##   trickle on pulls, rich strikes there ALWAYS hit the exotic;
##   RARE_VEIN luck elsewhere untouched (no card contradictions).
##   Grail recipes consume them (Voidglass Visor, Graviton Boots,
##   Prismatic Pendant; Warp Fold already ate Pz).
## · BEACON REWORKED (his call, see how it plays): ring-scoped —
##   walks Sol at stage 0, Neighborhood/galaxy stars at 1-2, the old
##   far-cosmos walk at 3; stage-aware toast + Guide copy.
## · SHIPYARD on the character sheet: painterly SPACECRAFT side profile
##   (needle nose, swept fins — Nick: "not like a boat") that gains
##   each built system: jump engines, Array dish, extractor pod, IG
##   outriggers. Cached per built-set; proof-sheeted both states.
## · Mined-out-worlds-as-real-estate: LIKED, logged as v1.5 candidate.
## · PACING LAW (his close): Sol must mine+craft its way to the next
##   ring, then each ring funds the next — verified for ch1 (Sol veins
##   cover the whole Jump Drive chain + Earth harvest now funds ☄).
## Suites after the round: fingerprint 50/50, smoke 252/252, systems
## 19/19, balance PASS.
##
## ▶▶ HD COVERAGE PASS + SYNTHETIC PLAYTESTS (2026-07-18, fourth round):
## THE HD ENGINE LAW is now standing memory (Nick: everything visual uses
## the painterly engine, forever). Full-code audit (1 agent + proof
## sheets) found 11 flat holdouts — ALL FIXED: banded per-seed RING
## sprites w/ Cassini gap (was one stroked arc), typed lit-sphere MOONS
## (was flat tinted discs), shaded DWARF planets, 'Oumuamua-style
## INTERSTELLAR VISITOR sliver (was a fillRect), comet COMA, WORMHOLE
## gravitational-lensing sprite (was stroked ellipses), QUASAR sprite
## (host+core+jets, view AND thumb), PLANETARY NEBULA joins decoSprite
## (the last stroked-circle death), rogue-planet rim orb, pulsar beams
## tapered everywhere, NS thumb glow, BINARY-PAIR star thumbs, per-moon
## seeded moonThumb craters. Verified-HD coverage map in the audit
## (tools/sheets/v14space.png is the proof sheet). drawSurface confirmed
## dead code (purge candidate, unchanged).
## SYNTHETIC PLAYTESTS (new tools/simrun.js, Report Pack):
##  · 1,000 fast persona expeditions (miner/sprinter/explorer/rancher/
##    chaotic; land/mine/craft/equip/scan/feed/breed/heal/harvest/
##    beacon/jump via probe hook) — ZERO errors, ZERO invariant
##    violations, ZERO softlocks; 22 deaths all from toxic-meal gambles
##    (WAD); wave-off floor held (explorers pinned at 1 HP, never
##    died); Jump Drive reached in p50 181 actions (focused sprinters
##    ~89-180 ≈ the 30-45min human target); stage 2 needs conquest +
##    weekly economy (beyond a 3-min session — expected).
##  · 60 full-UI 18-step training playthroughs w/ seeded random choices
##    (11 via skip path) — 60/60 complete, zero stalls, zero errors.
##  · probe-names grew to 146; simreport-fast/ui.json keep full data.
##
## ▶▶ v1.4.1 "THE RING SPECTRUM" LIVE (2026-07-18, builds c3ea6ce →
## 5337a68 → a3dd448; Nick: "cap the tiers by ring… apply it across the
## whole board"):
##  · CREATURE grades cap by catalog location: Neighborhood→Legendary(5),
##    home galaxy→Mythic(8), regions 0/1/2→9/10/11, Deep Field+→summit.
##    App-layer (genomes/power/portraits/codes untouched); guardians+
##    Paragons exempt; bred/imported never capped; per-entry rc marker =
##    nothing already catalogued ever downgrades.
##  · WORLD/STAR designations obey the same ladder on NEW saves (rsw
##    flag; veterans' cards never rewrite). One clamp at the descriptor
##    memo → spoils/veins/reserves/samples/signatures all inherit.
##    Survey fixes: card row rewrites with the clamp; worlds clamp in
##    their OWN SPECTRA ladder (Red-Gold, not Gray-Gold); duel side-
##    cards tint by catalogued grade (budgets stay raw+deterministic).
##  · **levelOf HOTFIX (deployed 5337a68, was LIVE-BROKEN)**: never
##    exported from CombatCore → every victorious duel/conquest with a
##    CREATURE champion threw in awardXP, aborting the win (no
##    conquered.set/spoils/guardian/signature/ch2 credit). Player-as-
##    champion skipped it — why humans never saw it. Caught by the
##    700-run deep sims (501 hits). Smoke regression-locked.
##  · BOARD-WIDE RARITY SURVEY (agent, recorded verdicts): veins/
##    reserves/spoils/samples/breeding/rare-find all inherit the ring
##    via the clamped tier; biomes/extremophiles/wonders/paragons stay
##    position-free BY DESIGN; battle-budget capping REJECTED (would
##    desync shared-code duels). NICK DIALS PENDING: (a) route Apex
##    grades out of stats.best so one early guardian doesn't detonate
##    six Rarity achievements; (b) biome-vein valve (grail exotics
##    craftable in-galaxy via hard landings — recommended KEEP open).
##  · SYNTHETIC REPORT PACK: 300 chaos trainings (100% complete after
##    the Escape fix) + 700 deep expeditions on the fixed build (0
##    errors, 519 conquests, ring spectrum visible in the data: best-
##    catch p50 = Legendary; jump p50 64 acts, Array p50 378, IG 2/700;
##    fun-index p50 5.7, rancher/explorer highest). 3 player-critic
##    agents (collector/optimizer/explorer) reviewing for the fun
##    matrix + recommendations. simrun.js modes: ui/chaos/fast/deep.
##
## ★★★ v1.4 "THE ASCENT" DEPLOYED 2026-07-18 (build 4d28528, Nick:
## "deploy and do our standard post-deployment checks") — LIVE at
## celestialfrontier.github.io, version.json serving v1.4. ★★★
##
## POST-DEPLOY SWEEP (2 audit agents + chaos-sim + self):
##  HEAT: baked the last per-frame gradients from the HD pass (rogue
##   orb, pulsar beams, NS cores incl. the system-view straggler, the
##   visitor trail) into shared sprites.
##  EXPLOIT AUDIT — 3 fixed: auto-extractor clock-warp/save-edit farm
##   (mined stamps now clamp to one accrual window before a new `at`
##   wall-clock save stamp), mx save cap that could refill finite
##   reserves (uncapped — minedw stored the keys anyway), c1-mine Sol
##   filter (was relying on the travel lock). Determinism, crafting,
##   Ascent gates, save-tamper hardening, consumption loops all CLEAN.
##  MISSED-SCENARIO AUDIT — fixed: **DEATH SOFT-LOCK** (pre-v1.0! the
##   in-place rebuild never hid the z-50 deathbox — "new expedition"
##   ran under a permanent overlay; Settings→Reset masked it since it
##   never opens deathbox); resetMemoryState missed claimedSets (Binder
##   bounties unclaimable post-death) + lastAnomKey/_parSites/nameHue/
##   _chBadge; biomeVeinFor determinism guard (roll now consumed either
##   way); _eqOpen clears on stats close; auto-extractor restamps mined
##   worlds on build (no retroactive windfall); stranded-boot on a
##   gated CF1 hash now falls back to saved-view; copy sweep (nine
##   sockets / click-mine / beacon-per-ring tooltip / tiers12 dup /
##   search topic). Endings, training×v1.4, share codes, panel manager,
##   achievements all verified CLEAN.
##  CHAOS SYNTHETIC TEST (300 adversarial UI-training runs — random
##   clicks/Escape/panel-storms between every step): found + fixed a
##   REAL strand — **Escape during the training duel closed it and
##   hung the tutorial forever** (the input lockdown covered taps, not
##   keydown; Escape now inert on lesson modals while !tutDone). After
##   the fix: 300/300 complete, 0 breaks, 0 stacked panels, vista +
##   helppop + one-panel rules all held under the storm.
##  Suites green after every fix: fingerprint 50/50, smoke 253/253,
##  systems 19/19, balance PASS. (700 deep progression runs +
##  player-critic fun report in flight.)
##
## ★★★ v1.4 "THE ASCENT" IS LIVE ★★★
## (2026-07-18, second session; commits 0f39b99 + ff0abfe + review batch.
## GAME_VERSION bumped to '1.4' [Nick commissioned the 1.4 build this
## session]; NOT deployed — deploys only on Nick's word.)
##
## PART 1 — NICK'S v1.3 LIVE-PASS FIXES (folded into the 1.4 bulletin):
##  · ? popover closes on outside tap (it lives in MODAL_SEL, so it got
##    its own dedicated closer)
##  · ASTEROIDS ARE ROCKS: baked 8-variant shaded lump sprites (grey
##    belt + icy Kuiper families) replace the fillRect squares — system
##    view AND beltThumb; proof-sheeted (tools/sheets/v14icons.png)
##  · CARD ANCHORING: locked cards + hover glances ride WITH their
##    planet through pans/zooms (offset anchoring via _frozenPick;
##    _livePick matches picks by P.seed since pick objects are rebuilt
##    per frame) — Nick's screenshot: Earth's card stranded across the
##    screen in training
##  · COMPENDIUM SHELVES: realms fold onto one habitat language for
##    display (Gas Giant Life→Aerial Fauna, Amphibious/Cave/
##    Extremophile/Sapient/Hive Fauna); card badges keep the precise
##    realm; Warden-of-Realms untouched (display-only _SHELF_OF)
##  · TRAINING IS A SAFE ROOM: all three rolls (feed/breed/heal)
##    rigged on EVERY step while !tutDone. ROOT CAUSE FOUND: the 1.3.6
##    {feed:-1} rig GUARANTEED poisoning — feedPair poisons on LOW
##    rolls (roll<pois), so -1 always failed. Feed rig is 0.99 now.
##  · DUEL SKIP: ⏭ Skip-to-the-outcome button; auto-play stays default
##  · VISTA IS A WINDOWED POP-UP: .vcard frame floats over the dimmed
##    game, ✕ on the frame (was: full-screen takeover, ✕ in the screen
##    corner). "Landing vista" WORDING: brainstorm list delivered to
##    Nick, NOT renamed — his pick pending.
##
## PART 2 — v1.4 CORE (the four systems, intertwined):
##  · MINING REBUILT (Nick's spec): click=pull, NO timer; varying haul
##    seeded by extraction INDEX (hashInt(seed,0xE1F,n) — same for
##    every explorer, no reroll exploit); FINITE reserves
##    (reserveFor: ~420-800 pulls ×(1+tier*0.35); card counts pulls
##    left; mined-out is forever); rich strikes (5%+tier+gear) hit
##    rare-vein pockets; AUTO-EXTRACTOR accrues 1 load/10min offline
##    (cap 30) once built. Save field mx (absent⇒veterans full).
##    Also fixed: resetMemoryState never cleared mined/cargo/tech.
##  · THE FABRICATOR: Cargo panel tabs Inventory/Fabricator/Research.
##    ~30 recipes: T1 parts → T2 components → T3 ship systems + gear.
##    ELEMENT PICKS AUDITED AGAINST SOL'S ACTUAL SEEDED VEINS (Mercury
##    Fe/Al/Ca/Cr · Mars Si/Cl/Ca · gas giants H/He/CH4/NH3/He3 ·
##    Uranus ices/O — NO Cu/Ti/C/Li in Sol, hence Aluminium Wire,
##    chromium Steel Frame, methane-cracked Carbon Weave, H/O Power
##    Cell) so Chapter 1 is craftable without leaving home. Painterly
##    partIcon() shape families (proof-sheeted, 4 icon fixes from
##    review: array-leaf→radar dish, rig-arrow→drill, struts-kite→
##    lander tripod, coil core lit).
##  · EQUIPMENT (ARPG pillar): 5 sockets on the character sheet
##    (Suit/Tool/Module/Instrument/Charm), tap-to-pick, live effect
##    readout, fresh-craft auto-equips into an empty matching socket.
##    Wired: yield/strike (mining), land + per-family hazard suits
##    (Thermal/Pressure/Cryo +30 on their families) + Gravitic Anchor
##    land100, struts scrape cut, scut (routeHit — bioscan AND failed
##    contact), contact +%, heal +%, speed (driveMult+charm).
##  · THE ASCENT: 3 chapters on the charter machinery (ascEvent via
##    gameEvent), pinned .ascbox atop the Charters panel. NEW saves
##    (save field asc; ABSENT⇒complete=veterans) start Sol-locked.
##    Ring ladder = ascStage(): 0 Sol only → 1 Jump Drive: Neighborhood
##    (GR*0.25 around SOL_POS) → 2 Long-Range Array: whole home galaxy
##    → 3 Intergalactic Drive: REGIONS/prime-sig ladder as before.
##    GATES (travel only, never curiosity): star entry in
##    checkTransitions, galaxy entry via reachRadius (UCELL*0.35 at
##    stage<3), wormhole transit, travelTo, travelToCode; charter ring
##    drawn in-galaxy with the next build named on the label;
##    charterBlock speaks ascHint() while the Ascent gates. Chapter 1
##    announced at training end (new saves only).
##  · 9 Engineering achievements; Guide chapters 'The Fabricator &
##    gear' + 'The Ascent'; mining topic rewritten; RELEASES v1.4
##    entry (fixes + features).
##  SUITES AT BUILD: fingerprint 50/50 byte-identical, smoke 251/251
##  (+24 new: helppop close, duel skip, vista window, shelf mapping,
##  mining pulls/reserves, Sol lock matrix, craft chain, self-equip,
##  ring stages, veteran grandfather), systems 19/19, balance PASS.
##  probe-names grew to 129 hooked names. NEW TOOLING:
##  tools/sheets/v14icons.js (icon + rock proof sheet; 4 in-review
##  icon fixes).
##
## PRE-SHIP REVIEW (2 agents + self-review, 2026-07-18 — ALL CONFIRMED
## FINDINGS FIXED IN-BATCH):
##  · cosmic-event "Witnessed" credit + Beacon pilgrimage credit no
##    longer awarded when the Ascent refuses the jump (was: cinematic +
##    achievement + "you are being sent" with the camera parked)
##  · CURIOSITY UNGATED (the review's philosophical catch): foreign-
##    galaxy BROWSING + wormhole rides stay open at every stage
##    (reachRadius back to regional; ascAllows gates only star/system
##    dives; wormhole far mouth is a view — its stars stay drive-gated)
##  · chapter progress BANKS across chapters (out-building the current
##    chapter no longer discards Ch3 work; while-loop completion);
##    c1-land gained its Sol filter
##  · stage-0 starter charters (scan/scout/conquer — impossible in
##    lifeless Sol) say "awaits the stars" on the board and the
##    completion toast never points at them
##  · Field Medkit no longer sharpens poison (dmg keys off unboosted
##    heal); "pulls" wording aligned everywhere (counts = presses)
##  · plain mining pulls stay out of the 60-cap bell tray (rich
##    strikes / first mine / mined-out still log); mx save cap keeps
##    deepest-mined worlds + load-time backfill (mined-out can never
##    silently refill); star-gate camera clamp *0.97 BELOW the dive
##    trigger (was: ascBlock toast every 1.8s forever); in-place reset
##    hides the cargo button/panels (showCargoBtn can hide now);
##    "Ship System Online" cinematic queues BEFORE the chapter-complete
##    cinematic it causes; paragon plot-a-course respects the gate;
##    equipItem fires checkAch (Outfitted lands on equip)
##  STILL OPEN (Nick decisions, see audit report): Earth-harvest
##  economy hole (settled-since-start Earth has no Harvest button —
##  pre-existing, now visible because Earth is a stage-0 player's only
##  settlement); auto-extractor loads deplete reserves but count as
##  one "pull" per collection press (wording now says pulls; counting
##  loads instead is a design call).
##
## DEFERRED FROM THE v1.4 DESIGN (recorded, not built): COOKING &
## PROVISIONS (meals/flora produce — the flask slot), FRONTIER RECORDS
## board, ARCHAEOLOGY/FOSSILS, hazardous flora (still open from 1.3.5),
## biome-gated rare veins ("rarer worlds' veins gate rarer recipes" —
## rare veins exist via RARE_VEIN tiers but biome doesn't gate them
## yet), beacon/weekly-charter awareness of the Sol lock (see audit).
##
## ▶▶ PREVIOUS SESSION AGENDA (v1.4 KICKOFF) — kept for the record.
## SHIPPED THAT SESSION: v1.3.5 "Soft Landings" (build bc70152) +
## v1.3.6 "Quiet Skies" (build c1bac38).
##
## 1. NICK'S LIVE PASSES of 1.3.5+1.3.6 (screenshots are bug reports):
##    watch terran biome color identity (savanna gold / swamp gloom
##    want palette-level tuning), jungle density, aura feel, extremo-
##    phile hunt pacing, descent feel on phone, boot time on his big
##    save (STILL unverified, G14).
## 2. v1.3.x DEBT (small, shippable anytime): HAZARDOUS FLORA (the
##    recorded deferral — spore-bursts/snap-traps/acid sap + G15
##    fatal-meal linkage + scout-absorbed sample scrapes; queue with
##    extremophile portrait materials); wanderer-witness charter +
##    first-sighting gold caption; NICK DOMAIN DECISIONS: Eyeball
##    World (Seasons row), per-hue color rarity, V2 galaxy morphology,
##    V13 crossGenome gaps.
## 3. START v1.4 "THE ASCENT" — goals + full design below (north star,
##    ring ladder, recipe spine, chapter engine, equipment screen,
##    cooking, hazmat suits). BUILD ORDER stands: a) recipe spine
##    (bench data + Fabricator tabs), b) chapter engine on charters,
##    c) Chapter 1 Sol lock (NEW saves only, gate TRAVEL never
##    CURIOSITY, first jump <=45min), d) chapters 2-3 + ring ladder on
##    reachRadius. HOOKS ALREADY LIVE IN 1.3.5: descentBonus() gear
##    socket, biome rare-material flavor, extremophile g.x packs, the
##    'risk is the frontier, gear tames it' law.
## 4. Standing rules: extract.js first; proofsheet.js + sheets/ for
##    ALL art review (headless Edge); deploys on Nick's word; baseline
##    re-pin protocol single-key only (3 sanctioned re-pins exist);
##    core.autocrlf false (a stash cycle once CRLF-corrupted the
##    toolchain).

1. NICK'S LIVE PASS of v1.3 (his screenshots are bug reports — read
   them closely). Watch for: vista variety across many landings, aura
   feel on his real Compendium, postcard flow on iPhone, boot time on
   his big save.
2. START v1.4 "THE ASCENT" — full design already below (Sol lock-in →
   Jump Drive → ring unlocks: Milky Way slice → Local Cluster →
   outward). SUGGESTED BUILD ORDER:
   a. RECIPE SPINE first (pure data + Fabricator UI): T1 basic parts /
      T2 components / T3 ship systems, procedural part icons in the
      _hdElemIcon language, Research Bench → Fabricator tabs. No
      gating yet — veterans just get a new bench to play with.
   b. ASCENT CHAPTER ENGINE on the charter machinery (ordered chain,
      chapter panel pinned atop the charter board, save fields with
      absent-safe defaults = veterans complete).
   c. CHAPTER 1 "Off the Rock": Sol lock (NEW saves only; gate TRAVEL
      never CURIOSITY), Moon/Mars/asteroid mining goals, Jump Drive
      recipe, first jump ≤45 min. Smoke needs a full chapter-1 drive.
   d. Chapters 2-3 + ring ladder on reachRadius.
3. Deferred graphics polish (only if Nick asks): real crescent phases
   (needs sprite relight — city-lights conflict), surface-view F1/F3/F4
   nits, galaxy interior morphology V2 + crossGenome inheritance V13
   (both DOMAIN changes — Nick decisions, unchanged).
4. Mechanics: extract.js first; deploys only on Nick's word; the
   baseline re-pin protocol (single-key, diff-verified, documented) is
   the ONLY sanctioned baseline touch.

## ▶▶ THE GRAPHICS OVERHAUL — APPROVED IN FULL (Nick, 2026-07-17: "I want
## to include all of this") + NEW PILLAR: ENGINEERED INFINITY
##
## Nick's addition: "be sure there's infinite possibilities with the
## planets, stars, flora, fauna — a very high likelihood we're going to
## see variations we never seen before. This is the main discovery aspect."
##
## THE INFINITY ARCHITECTURE (all app-layer, deterministic per seed):
##  L1 CONTINUOUS DIALS — kill every fixed anchor/color: river course,
##     horizon, sun x, plant branch/droop/leaf genes, aurora hue pair,
##     star-face spots/corona, island layouts, beast spots/facing — all
##     become seeded parameters.
##  L2 COMBINATORIAL RECIPES — portraits draw ALL the genome (16 bodies ×
##     9 hides × 18 locos × patterns × traits); plants get species genes
##     from world palette+heat; thumbs read the whole card.
##  L3 WONDER ROLLS — rare card-derived visual events, combinations rarer
##     still: rings overhead (P.ring), giant/low moon, twin suns (binary
##     card fact), bioluminescent night shores (life+dark), meteor
##     showers, exotic sky tints (atmosphere row), vegetation hue
##     families (chlorophyll common; copper/violet/crimson rare).
##  Law holds: every wonder must trace to a card fact + seed. Where the
##  card TEXT already varies (FA_TRAIT "bearing crystal antlers",
##  atmosphere rows), the art now FOLLOWS the text — infinite because
##  the text pools are combinatorial, honest because the card said it.
##
## BUILD ORDER (each batch: build → validate/smoke/systems → commit):
##  BATCH A ✓ DONE (bde0603) — V1-V11 honesty fixes + I2-system + I9
##  BATCH B ✓ DONE (9ea3d7e) — vista re-view/fade/chrome (B1+B3)
##  BATCH C ✓ DONE (59f56e9) — galaxy star sprites + textured deco
##            pre-renders + cluster sprites (I1+G2+G5). NOT done: V2
##            morphology + I4 per-seed galaxy sprites — V2 needs a
##            DOMAIN change (star positions move vs the frozen
##            fingerprint baseline) → NICK DECISION, see below.
##  BATCH D — partially absorbed: I2 star-tint (system ✓ in A, vista ✓
##            in E; surface dawn/dusk STILL OPEN), I3 rings-in-sky ✓ in
##            E (daytime moons still open), I12 real crescents OPEN.
##  BATCH E ✓ DONE (df64e84) — INFINITY CORE: seeded compositions,
##            per-world flora species + rare hue families, seeded
##            aurora families, herd scaling, wonder rolls (rings sky /
##            looming moon / biolume shores / star-tinted noon).
##  BATCH F1 ✓ DONE (f372d0b) — V12 portrait anatomy overhaul, HD-GATED:
##            the fingerprint PINS Classic portrait bytes (learned by
##            hitting it), so HD_PORTRAITS rides the hd flag via applyHd.
##            All 16 body plans distinct, skin/loco/trait drawn, eyeless
##            honest, Guardian gold / Paragon teal rims.
##  BATCH F2 — REMAINING: I7 specimenCard wiring, I13 small thumbs
##            (per-moon seeds, binary star thumbs, quasar sprite,
##            filament web blobs).
##  RELEASES[0] bullets written for everything Classic-visible (galaxy
##  stars, card-honest pictures, rarity uncap) + the HD infinity/portrait
##  additions folded into the HD bullets (rule 7 satisfied pre-deploy).
##  BATCH F2+G ✓ DONE (1c5e990): painterly player avatar, tunnel
##            per-destination lanes + outward rush + heat fix, vista
##            POSTCARDS (PNG with name + CF1 code baked in), conquest
##            ARENAS (defender's biome behind the duel card) + guardian
##            entrance cinematic w/ portrait, PER-SEED galaxy sprites
##            (kind-locked to the card; archetype placeholder + LRU
##            bake). Also earlier: fungi/microbe painterly portraits,
##            rarity AURAS (grade-scaled; Nick's foil call), HD material
##            icons, atlas live thumbs, lazy art, dead code purge, human
##            copy pass over intro/notes/training.
##  HD IS ALWAYS ON (Nick's ship call, 2026-07-18, f9c6012): the Landing
##            view setting is GONE; old saves' hd field ignored. BASELINE
##            RE-PIN: exactly one probe (speciesPortrait art bytes)
##            changed; all 49 domain probes verified byte-identical
##            before the surgical single-key re-pin (note in
##            baseline.json). Wholesale regeneration remains banned.
##  STILL DEFERRED: real crescent phases (runtime shadow mask conflicts
##            with night-side city lights baked into planet sprites —
##            needs a sprite relight rework); F1 tile-proxy fallback,
##            F3 surface aurora seeded hues, F4 cloud-shadow prerender
##            (minor surface-view polish).
##  NICK DECISIONS PENDING (domain/baseline changes, NOT built):
##  - V2 galaxy interior morphology (ellipticals stop being spirals) —
##    moves star positions vs the determinism baseline.
##  - V13 crossGenome inheritance gaps (5 genes never inherit; limbs/
##    accent never mutate) — changes future bred children.

## ▶ GRAPHICS PASS FINDINGS (2026-07-17, 3 audit agents + spot-verified;
## the raw finding list the overhaul above was built from)

LAW VIOLATIONS (card contradicts picture — fix-before-ship candidates):
 V1 terran water ignores climate band: liquid blue oceans painted on
    "Mostly evaporated" and "Frozen into ice sheets" worlds — in the
    system sprite, card thumb AND surface tiles (surfaceColor takes no
    band; verified). One parameter threads all three.
 V2 galaxy morphology: card says Lenticular/Elliptical/Irregular, the
    interior is ALWAYS a 2-3-arm spiral; interior hue ≠ exterior sprite
    hue (16 shared archetype sprites for the whole universe).
 V3 desert "Sparse, hardy vegetation" + fauna worlds vista as EMPTY
    dunes (green-life block gated !desert).
 V4 system-view moons all render flat grey; the moon card + thumb are
    typed rocky/icy/volcanic/captured.
 V5 gas giants: card promises "auroras crown the poles" + immense
    field; no view ever shows it.
 V6 vista era flattening: Modern-era civs render the medieval keep
    (everything below spacefaring → 'iron').
 V7 civilized worlds lose their river (river block requires civ none).
 V8 WITHDRAWN on verification: ice/desert/rocky/venus worlds can NEVER
    have a magnetosphere (hasField = terran/ocean/gas/Earth only), so
    the card never promises them auroras — the vista is already honest.
 V9 planetThumb ignores rings/civ/life/band (P.ring never in the thumb).
 V10 rarity presentation: reveal cinematic CLAMPS tier at 8 (an
    Omnipotent find celebrates as a Mythic); Compendium rows never foil
    at summit; Binder Paragon slots hardcode teal regardless of grade.
 V11 Si missing from the EC icon palette (mined on rocky/desert/dwarf,
    used in a research cost — renders generic gray).
 V12 portraits: "eyeless" fauna get eyes; mottled/plain draw nothing;
    11 of 16 FA_BODY plans share one ellipse; skin/loco/trait ignored;
    Guardians/Paragons get zero bespoke visual anywhere.
 V13 (domain! Phase 2 + fingerprint decision) crossGenome never
    inherits temper/sense/repro/life/metab; limbs+accent can never
    mutate. Fixing changes generated children → baseline question.

VISTA FEATURE-BAR BLOCKERS:
 B1 see-once art: any stray tap dismisses instantly, no fade, no ✕, NO
    RE-VIEW — cache the args + "Landing vista" action on the surface
    card; fade in/out (cinema's .on pattern).
 B2 one composition per type: fixed horizon/sun/river/island/volcano
    anchors — every temperate terran is the same painting. Seeded
    layout variants.
 B3 vistabox chrome off-language (ad-hoc border, no glass, hint doesn't
    match cinema's dismiss convention) + phone-landscape letterboxing
    (width needs calc(70vh*2.233) clamp) + no safe-area padding.

HEAT-RULE VIOLATIONS FOUND (per-frame allocations): galaxy nebulae/
remnant/supernova gradients; surface cloud-shadow gradients (4/frame);
travel-tunnel gradient + mulberry closure per frame (also: same fixed
90 streaks every trip, seed 0x7261).

TOP UPGRADE IDEAS (proposed to Nick, his picks):
 I1 galaxy star sprites — 13 pre-rendered per-class glow/spike sprites
    replace flat 1-2px arcs + twinkle on the brightest (HIS SCREENSHOT).
 I2 star-colored light EVERYWHERE: spectral class tints vista sunlight,
    system planet lighting, surface dawn/dusk (st.star.c is one
    argument away; verified available).
 I3 rings in the vista sky when P.ring (+ daytime moons).
 I4 per-seed galaxy sprites (LRU like hazeCache) — every galaxy unique,
    thumb/interior/exterior agree; fixes V2 with the same plumbing.
 I5 vista postcards: save/share a landing vista stamped with world
    name + share code (rides the existing share-code loop).
 I6 battle staging: seeded arena backdrop behind duels/conquest from
    the defender's world type (habitat-scene generator reusable as-is);
    guardian intro card at scale with summit foil.
 I7 wire the DEAD specimenCard (finished painterly labeled card art,
    never exported/called — verified) into reveal/Compendium detail.
 I8 ambient motion, rmotion-gated, zero JS: 60-90s CSS slow-pan on the
    vista canvas; cinema-style fades.
 I9 city lights for every civ world's night side, era-scaled (currently
    an Earth-only easter egg) — sprite + thumb + classic tiles.
 I10 herd size scales with the roster (5+ on teeming worlds, distant
    silhouettes); per-world plant species (palette/heat-driven variants,
    2 per scene — one tree universe-wide today).
 I11 classic-mode card-honesty nods: vegetation tint + era night dots
    on tiles, star-tinted terminator (non-HD players see the card too).
 I12 real crescent phases in system view (shadow-mask sprite over
    unrotated planet — features stop spinning with orbit).
 I13 moon thumbs seeded per moon; binary-pair star thumbs; quasar
    sprite; filament-shaped web blobs (universe view).
 I14 Rings/Moons rows on the planet card (facts render but aren't ON
    the card — reverse law gap; touches descriptor = design call).
 DEAD CODE to prune or keep for tests: ocean harbor + ember fauna vista
 paths (unreachable by domain rules: civs need Abundant land life).

## ▶ ITERATION 2c (2026-07-17, same session): CARD UX + SETTINGS AUDIT

- SURVEY CARD ✕ + DRAG (Nick's ask): locked cards wear a ✕ (close;
  tapping empty space still works — the ✕ is the visible affordance);
  any open card drags by its HEADER, pointer events, mouse + touch
  (6px threshold so taps stay taps; touch-action:none on the head;
  drag position rides _frozenPos so the per-frame clamp keeps the card
  on-screen; surface card draggable too, defaults top-left). Hidden and
  inert during training. Smoke +4 (✕ present, drag moves+stays open, ✕
  releases the lock — cursor-hover legitimately reopens the GLANCE on
  desktop — re-lock works).
- SETTINGS AUDIT (Nick: "make sure all settings work"): agent audited
  all 12 controls end-to-end (wiring→apply→persist→load→edges).
  11/12 clean, incl. the historic fixes holding (rm never freezes the
  OS pref; vol taper; hd flag; notif gating; reset two-step). FIXED:
  Text size A+/A++ now also scales the Guide, Charters, Release Notes,
  pick/duel/share/Prime dialog cards and the settings panel itself
  (was: survey/list surfaces only); fs whitelisted on load (arbitrary
  body-class injection via a tampered save); flushToasts re-checks
  notifOn at fire time; _wiping guard actually arms during a wipe
  (was write-only-false) and releases after the in-place rebuild.
- Suites at commit: fingerprint byte-identical, smoke 167/167,
  systems 19/19, balance PASS.

## ▶ ITERATION 2b (2026-07-17, same session): THE WHOLE-SPACE PASS

Nick: "we're not just limited to these cards, right? account for
everything possible in the world and make sure it all looks great."
Confirmed generative (hdVista renders ANY card at planetfall; artifact
cards are examples). Then rendered the FULL reachable card space (43
scenes through showVistaBox's exact mapping) and fixed what read wrong:
- AURORA: smooth veil (2× overlapping gradient columns, alphas halved)
  — Nick's "lines through it" striping is gone; suppressed while
  rain/snow actively falls (a deck hangs above).
- WEATHER SPELLS (the big unlock): the Weather row is CLIMATE, not a
  permanent condition — whether it falls NOW is a seeded ~90s spell
  roll (same mechanism as the lightning bursts), shared by surface and
  vista; the surface status line says "clear skies" between spells.
  Without this, temperate terrans and ALL ocean worlds rained forever —
  the sunny meadow and sunny island scenes were UNREACHABLE in play.
- SNOW IS GROUND STATE: cold-band worlds keep the snow pal between
  falls (climSnow); flakes only while snowing.
- WATER ROW DRIVES THE RIVER: liquid / FROZEN ice ribbon with pressure
  cracks (cold worlds + deep winter) / none ("Mostly evaporated" hot
  worlds get no river).
- LIFELESS LAND = BARREN SOIL ground palette (meadow green promised a
  biosphere the card denies); no clouds on airless rocky worlds.

## ▶ v1.3 PHASE 1 ITERATION 2 — BUILT & VERIFIED (2026-07-17). The whole
## roadmap iteration list landed in one batch; still flag-gated, NOT deployed.

WHAT CHANGED (all inside @section hdart + the showVistaBox mapping):
- EMBER WORLDS (lava): new ember pal (smoke-black sky, red horizon glow),
  _hdVolcano (cone + crater glow + flank trickle + leeward smoke), the
  river course runs as a LAVA FLOW (crust plates, bank glow), emissive
  ground cracks, smoke banks with underlit bellies; wx 'ash' overlay =
  falling ash + rising embers. Fauna ember-lit with warm haze ('150,96,80').
- ISLAND SCENE (ocean worlds, biome:'island'): open sea to the horizon
  with per-pal water gradients (day/night/rain/twilight/snow), distant
  island silhouettes, sun/moon GLITTER ROAD (sparkle-dash envelope — no
  drawn shape; a wake-triangle draft violated the no-rays law and was
  cut), wave crests opening toward shore, beach foreground with foam
  lines + wet sand, era-scaled harbor on the big island (iron: keep +
  hearth dots; space: lit towers + beacon). Beasts and flora come down
  to the sand.
- SNOW: new snow pal (winter-grey light, snow-covered layers/ground) for
  terran snowfall; wx 'snow' overlay (round flakes at two depths + chill
  band) — ice worlds get falling snow too, and winter rain→snow (effWx)
  now reaches the vista.
- TWILIGHT: first-class pal, no longer a flat grade — indigo→amber dusk
  sky, LOW sun (sy=hz-30, sets behind the ridges on land, kisses the
  water on islands), dark cloud bellies lit from below, first stars,
  warm crest light, dusk grade on top.
- AURORA NIGHTS: opts.aurora (from env.hasField — the same magnetosphere
  fact whose card row says "auroras crown the poles") hangs curtain
  auroras over night scenes, twin hues 140/280 matching the live surface,
  column-striated with per-column gradients.
- SCENE-WIDE GRADING (proof-sheet findings, fixed in-batch): the river
  now WEARS THE SKY (night dark-steel + faint moon glints, twilight
  amber→violet; was summer-blue in every scene — glowed like a
  searchlight at night); plants darken to silhouettes at night / steep
  violet at dusk / frost in winter (_hdStampPlant darkAmt/darkCol);
  near beasts knocked back at night; sea-day sun halo softened (110px,
  0.62 alpha — glare dominated the open sky); beast tuft color per
  ground ('34,14,10' basalt, '86,72,44' sand); rain/dust/snow/ash
  overlays keyed to the card's wx TOKEN, not the pal (night rain now
  streaks); vista caption words the weather ("snowfall", "ashfall").
- WIRING: showVistaBox(P, tod, wx, era, genes, aurora) — era→harbor on
  islands too; lava→ember (the dust stand-in is gone); terran/ocean tod
  twilight→twilight pal, wx snow→snow pal.
VERIFIED: fingerprint byte-identical (all app-layer), smoke 155→163
(8 new scene checks render ember/island/aurora/snow/twilight/nightize/
bare-beach headless via the new hdVista probe hook), systems 19/19,
balance PASS. Proof sheet rendered via headless Edge (14 scenes) and
inspected — that's where the searchlight-river, day-glo-trees-at-night,
glare-halo and wake-triangle findings came from.
REVIEW ROUND (2 parallel agents, all confirmed findings fixed in-batch):
- CORRECTNESS: clean — executed all 1,728 caller-producible opt
  combinations headless (0 throws, 0 invalid canvas colors); plat/ridge2
  guards, pal fallbacks, hasField parity vs the card all verified.
- EDGE/DESIGN-LAW, 5 confirmed, 5 fixed:
  F1 ice/rocky/venus/desert at night rendered DAYLIGHT under a caption
     saying "local night" → new nightize grade (starlight + the card's
     moons + no sun/clouds/sun-crests) and duskize (dusk grade) applied
     to types whose pal has no clock; ember exempt (sunless either way).
  F2 moon-glitter road + river night-glints rendered with 0 moons →
     both now gate on the card's moons (moonless night = dark water).
  F3 aquatic fauna ("jet-propelled swimmers of the open ocean") stood
     legged on the beach → caller filters non-standing loco/habitat
     (swim/float/filter/drift; open ocean/sea shallows/cloud decks/vent
     fields) out of the vista party. TRUE body-plan genes stay Phase 2.
  F4 beach/meadow trees + grass fringe on "No known life"/microbial
     worlds → new flora flag from the card's Life row gates every plant
     stamp and the grass silhouettes (land + island scenes both).
  F5 night rain/snow fell from a clear starry sky → cloud deck now
     rides the night pal when the wx token precipitates.
ARTIFACT REPUBLISHED post-fixes (engine slice re-lifted verbatim).
ARTIFACT UPDATED (same URL): the Landing Zones section now renders from
the game's own hdart code (lifted verbatim), 11 scenes incl. the five
new ones; footer marks vistas "IN THE GAME, flag-gated, iterating".

## ▶ v1.3 "THE HD FRONTIER" — IN THE CODE, ITERATING (2026-07-18). DO NOT
## BUMP/DEPLOY until Nick's word; the hd flag keeps it invisible either way.

THE LAW (Nick, settled over the 2026-07-17/18 art sessions): **the card
drives the picture** — every render derives only from descriptor facts +
seed. Estimates vague-never-wrong. Nothing decorative the card didn't ask
for. No rays/spikes/glow-domes. Color language per [[Ink & Ember]].
The full visual bible lives as a claude.ai artifact ("Celestial Frontier —
v1.3 Visual Direction", Nick has the link) — galaxies (dust = suppressed
starlight, never painted), living system (star-lit belt/comet/ringed
giant/terran moons/phase strip), card-driven worlds (era-scaled night
lights, hurricanes, cloud shadows, gas storms), 4-generation breeding
inheritance, and the landing vistas.

PHASE 1 — LANDED IN THE GAME (this commit, flag-gated):
- New @section hdart [app] (~450 lines): _hdNoise/_hdFbm (seeded, no
  Math.random), HD_PALS (day/night/rain/dust/sand/ice/grey/haze),
  hdVista(opts) master renderer (biomes: green w/ river+life, iron-era
  keep+road+flanking-village+fields, spacefaring skyline grounded per-
  tower on ridgeY, deserts, ice crystals, rocky/venus palettes), moons-
  from-card night sky (max 3, radiant primary, no beams), weather
  overlays (rain 2-depth + road sheen streaks, dust banks + wind),
  twilight grade, hdGenesFor(genome)→visual genes (v1: seeded from
  genome seed + ability color; TRUE parent-trait inheritance is Phase 2),
  hdBeastBare + placement (lit-side-sunward flip, warm grade, seated
  tufts, distance haze), plant stamps (base-anchored, contact shadows).
- #vistabox overlay: planetfall (when hdOn) opens the panorama once the
  surface frame knows tod/wx and renderPanel has cached the descriptor
  (era parsed from Tech era row; genes from the fauna roster, max 2).
  Tap dismisses. Gas giants skip (no ground). lava→dust pal was a V1
  STAND-IN — replaced by the real ember scene in ITERATION 2 (above).
- Settings → Graphics → "Landing view: Classic / HD (beta)" — save field
  `hd` (absent ⇒ 0 Classic), applyHd(), probe hdOn. DEFAULT CLASSIC:
  main can deploy for hotfixes without exposing v1.3.
- Verified: fingerprint byte-identical (all app-layer), smoke 155/155
  (flag default/toggle/persist + full planetfall→vista→dismiss drive),
  systems 19/19.

## ▶▶ v1.4 GOALS (Nick, 2026-07-18 — THE NORTH STAR, verbatim intent):
## achieve the ability to space explore at a HIGH LEVEL with very large
## success rates — and everything that power is EARNED through the loop:
## - MINE materials across worlds → BUILD spaceships that travel faster
##   and farther (extends the drive ladder + the ring unlocks).
## - CHARACTER EQUIPMENT SCREEN: an equipment panel grows out of the
##   character sheet — gear SLOTS on your explorer (suit, and the slot
##   set to be designed). Materials found exploring worlds (biomes and
##   rare worlds drop the special stuff) build hazmat suits etc. that
##   let you land WITHOUT damage and push success rates toward 100%.
## - THE TWO FEELS, NAMED: Minecraft/Satisfactory resource-gathering
##   (mine → inventory → bench → build) + Diablo/Path of Exile ACTION
##   RPG (equipment on your character, loot-chase for gear materials —
##   the ARPG pillar now formally covers GEAR, not just fauna).
## - THE FOUR SYSTEMS of v1.4: crafting bench · inventory · character
##   equipment · resource gathering — fully intertwined into gameplay
##   (quests route through all four; nothing is a menu island).
## - UI MANDATE: make it all VERY BEAUTIFUL for the player — the
##   bench/inventory/equipment screens get the full HD treatment
##   (the _hdElemIcon language + rarity auras set the bar).
##
## ▶▶ v1.4 DIRECTION v2 (Nick, 2026-07-17): "THE ASCENT" — CRAFT BENCH +
## SATISFACTORY-STYLE PROGRESSION. Nick: after training "it just feels
## like I don't know what to do next" — lock new players into Sol, mine →
## build your way off, quest chain outward: Sol → Milky Way → other
## galaxies. Codex becomes ultimate goals; quests give the next step.
##
## AGREED DESIGN SKETCH (Claude's shape, Nick to iterate):
## - THE ASCENT = the mainline quest chain, built ON the existing charter
##   engine (it already listens to the whole gameEvent stream). Charters
##   stay as the weekly/side board; Ascent chapters are ordered, each
##   with unlocks. Prime Codex/achievements become the "ultimate goals"
##   meta-layer above both.
## - CHAPTER 1 "Off the Rock" (Sol lock-in, NEW saves only — veterans
##   are grandfathered past any chapter whose unlock they already hold,
##   the proven charter-veteran pattern): interstellar travel now needs a
##   JUMP DRIVE. Mine Sol (Moon/Mars/asteroids), craft T1 basic parts →
##   T2 components → the Jump Drive. Target: first jump within ~30-45
##   minutes of play. LAW: gate TRAVEL, never CURIOSITY — the whole sky
##   stays visible/surveyable from Sol; moving is what costs parts.
## - CHAPTER 2 "The Neighborhood" (Milky Way): quests introduce the
##   existing loops as goals (first bioscan, first conquest, first
##   breeding, charters board) + build the Long-Range Array → extends
##   reachRadius rings (the mechanic already exists and already gates
##   the map — perfect hook).
## - CHAPTER 3 "Beyond the Rim": Intergalactic Drive (T3 system built
##   from T2 components) → other galaxies; wormholes stay as the wild
##   shortcut.
## - THE RING THEME (Nick, 2026-07-18 — THE v1.4 THEME): expansion is a
##   ladder of CONCENTRIC UNLOCKS, each earned by quests + building:
##     Sol (locked start) → a slice of the Milky Way → the LOCAL CLUSTER
##     → farther clusters → ... outward ring by ring, forever.
##   Quests gate each ring; every ring re-runs the whole loop at bigger
##   scale (mine richer veins → craft higher tiers → hunt stranger
##   fauna → unlock the next ring). reachRadius IS the ring mechanic —
##   the chapters just take ownership of when it grows.
## - RECIPE TIERS (Satisfactory pattern, deterministic, same for all):
##   T0 raw elements (mined, exists) → T1 basic parts (Iron Plate,
##   Copper Wire, Silicon Chip, Fuel Pellet...) → T2 components (Drive
##   Coil, Hull Segment, Nav Core, Fuel Cell) → T3 ship systems (Jump
##   Drive, Long-Range Array, Intergalactic Drive) → beyond-v1.4: more
##   systems (vista-visible ship parts, first-contact gifts — the v1.4
##   craft-effects list below). Rarer worlds' veins gate rarer recipes.
## - PACING RULES: early recipes cost minutes, not hours; NO wait-timers
##   (the mining cooldown already paces per-world — quests should push
##   you to MORE worlds, not to waiting); costs grow with tier; the
##   complexity curve comes from recipe DEPTH not grind width.
## - UI: Research Bench grows into the FABRICATOR (tabs: Inventory /
##   Fabricator / Blueprints); parts get procedural icons in the
##   elemIcon language; quest tracker rides the charter panel (Ascent
##   chapter pinned on top); full inventory/bench visual refresh ships
##   WITH it (Nick: "make sure craft bench and inventory are completely
##   up to date and looking great").
## - HD MATERIAL ICONS (Nick 2026-07-17, DONE in v1.3 as groundwork):
##   every minable element renders painterly at 96px behind the hd flag
##   — faceted gems w/ star glints, translucent ice spears, glowing
##   glass flasks, brushed beveled ingot stacks (_hdElemIcon). The
##   inventory IS the bag (Minecraft/Satisfactory is the explicit
##   reference bar — mine from worlds, build at the bench). v1.4 PART
##   icons extend this same language (plates/wires/coils/cores), and
##   the RARITY AURA system (also DONE: grade-scaled spectral glow on
##   portraits — none <T4, grade-hex glow up the ladder, foil glints
##   T8+, prismatic shimmer at summit; Pokémon-foil WOW without
##   swamping the art) sets the bar for how rank reads everywhere.
## - v1.4 ties it ALL into the progression flow: quests route players
##   from mining → crafting → travel → BATTLING/collecting (the combat
##   and Compendium loops become quest goals so players always know
##   the next step into the fun).
## - GUARDRAILS: share codes to unreachable places become a quest hint,
##   not a dead tap; reset keeps the Ascent restartable; smoke needs a
##   full chapter-1 drive; save schema: quest progress fields with
##   absent-safe defaults (veterans ⇒ complete).
##
## (original v1.4 craft-bench notes below — still the effects list)
## ▶ v1.4 DIRECTION (Nick, 2026-07-18): THE CRAFT BENCH

Build out the craft bench, Minecraft-style: the materials mined from
worlds match real recipes, and what you build changes what you can do —
explore faster, land safer, succeed more often at first contact, and so
on. Design intent (to be shaped when v1.4 opens):
- Grows the existing Research Bench + element cargo + inventory grid
  (icons already shipped in 1.2.5) from a fixed 6-tech list into open
  crafting: recipes consume specific mined elements (+ ☄), rarer worlds'
  veins gate rarer recipes.
- Crafted things carry EFFECTS, not numbers-for-numbers (no-grind rule):
  e.g. drives/travel speed (extends the existing ladder), a diplomat's
  gift or beacon that raises first-contact odds, scan lures/armor for
  safer bioscans, harvest/mining yield tools, vista-visible ship parts.
- LANDING GEAR (Nick, 2026-07-18, ties to the v1.3.5 descent roll):
  crafted items raise landing success odds, up to a 100% guarantee
  (e.g. T1 Landing Struts trim wave-off damage → T2 Descent
  Stabilizers upgrade a hazard tier → T3 Gravitic Anchor = 100%,
  never wave off). The pattern generalizes: crafting is how you buy
  certainty across the game's rolls (landing, first contact, bioscan)
  — risk is the frontier, gear is how you tame it.
- FRONTIER RECORDS (NMS Fractal's Wonders catalogue, deferred from
  1.3.5 for scope): a personal records board — largest creature
  catalogued, most hostile world landed, rarest find, deepest ring
  reached — amplifying the grail hunt the extremophile system opens.
  Rides existing stats; pairs with the Prime Codex meta-layer.
- ARCHAEOLOGY & FOSSILS (NMS Visions/Relics, v1.4+ candidate): dig
  sites on dead worlds yield fossils of EXTINCT seeded species (the
  evolution engine already ages rosters by cosmic epoch — extinct
  ancestors are derivable); assemble skeletons for a Binder-style
  museum page. Pairs naturally with mining/crafting loops.
- COOKING & PROVISIONS (Nick, 2026-07-18): flora yield HARVESTABLE
  PRODUCE — fruits, vegetables, biome-flavored crops (ember-fruit
  from cinder blooms, brine-melons off salt flats, kelp hearts from
  the sea gardens). The bench combines them into MEALS AND SOUPS that
  restore HP (and later buff) — feeding-as-medicine extends from
  creatures to the EXPLORER, and meals become the ARPG consumable
  slot (the flask feel). Recipes deterministic; rare biomes grow rare
  ingredients (same law as veins: rarer worlds, richer kitchens).
- HAZARD SUITS + EXTREMOPHILE HUNTING (Nick, 2026-07-18): per-hazard
  gear opens the hostile biomes as EXPLORATION tiers, not just landing
  rolls — Thermal Weave (lava/ember), Pressure Hull (venus abyss /
  gas deeps), Cryo Lining (blue-ice/cryogeyser), each pushing its
  biome family toward 100% landing AND gating safe bioscans there.
  The prize: adapted alien life (deep-sea-vent logic) — thermovores
  on magma seas, acid-cloud floaters over venus, high-pressure
  drifters in the storm eye, under-ice vent fauna. Rides the existing
  'Extreme-World Life'/'Gas Giant Life'/'Subterranean Life' habitats;
  danger = rarity, so the hostile biomes become the endgame hunting
  grounds (Monster Hunter pillar). Loop: craft the suit → land the
  unlandable → scan the unscannable → rarest Compendium finds.
- Items get their own procedural icons in the inventory grid (elemIcon
  recipe style); recipes deterministic and identical for every explorer.
- Ties the whole economy loop: explore → land (samples) → mine → craft →
  explore farther. Charters can teach it ("Craft your first tool").

PHASE PLAN (iterate in order, each phase shippable; flag stays until
Nick flips the default):
1. VISTAS (in) → iterate: volcano/ember scene ✓, island scene for ocean
   worlds ✓, snow weather ✓, twilight polish ✓, aurora nights ✓, moon
   count from P.moons ✓ (ALL LANDED — iteration 2, 2026-07-17); still
   open: Nick's on-device passes.
2. CREATURE PORTRAITS: HD painterly fauna/flora replacing speciesPortrait
   (spine/limb silhouette + per-pixel hide + rim + habitat), TRUE gene
   inheritance (visual genes derived from genome fields so crossGenome
   children visibly blend parents), same render reused vista/card/
   Compendium ("globally there").
3. WORLDS & SYSTEM DRESSING: HD planet sprites (terrain noise, cloud
   shadows, atmosphere rims, era-scaled night lights, hurricanes from
   the weather row, gas storm ovals), phase-from-orbit lighting, belt
   rocks, comet tails, ringed giants, terran moons in system view.
4. GALAXIES (OPTIONAL, LAST): dust-as-gaps spirals — only swap the live
   sprites when unambiguously better on Nick's screen.
GATES: seed-sweep harness (render ~200 random cards headless, assert no
degenerate layouts) before any phase's flag flips; heat check per phase
(renders stay once-per-object cached; v1.2 heat rules apply); full
validate/smoke each batch.



> The living state of development. **Any session (human or Claude) resumes from
> this file** — update the Now/Next/Awaiting sections at the end of every work
> batch, keep everything committed and pushed. The chat is disposable; this
> file and the repo are not.

## ★ v1.1.2 "CLEAR SIGNALS" — BUILT & SHIPPING (2026-07-16, Nick's go:
## "let's begin it all now") — GAME_VERSION bumped to '1.1.2'

CARD CONDENSING BUILT & VERIFIED (validate green, fingerprint byte-identical,
smoke 113/113, systems-check 19/19):
- Actions (Atlas row / Conquer / Mine / Share) at the TOP of the card body
  with a divider — fixes the below-the-fold Atlas button that stranded the
  Safari playtester at training step 4.
- 🌍 Environment group (Made of, Atmosphere, Climate, Water, Gravity,
  Magnetism, Weather, Seasons) folds behind a chevron row; collapsed header
  digest = first clause of Climate + Gravity, ellipsis-clamped.
- Civilization census (Tech era, Local year, Population) folds behind the
  Civilization headline row (name stays visible — a civ is a headline
  discovery). Wilderness worlds keep their single plain row.
- ⟁ Signal row NEVER folds (discovery hook). Spectral class never folds.
- Expand state = cardExpand bitmask (bit1 env, bit2 civ), new save field
  `cx` (absent-default 0 = collapsed), remembered across cards + sessions;
  toggles flip DOM in place (no rebuild — keyboard focus survives) and
  patch the panel key's trailing |cx suffix.
- Grouping is label-driven in renderPanel (app) ONLY — planetDescriptor
  (domain, fingerprinted) untouched. Guide survey topic + RELEASES bullets
  updated. Smoke +10 checks (top actions, folds, digest, toggle, training
  never advanced by fold clicks).

## (superseded planning notes below — kept for the record)

BUILT & VERIFIED 2026-07-16 (validate green, fingerprint byte-identical,
smoke 103/103; committed, NOT deployed — awaiting the rest of the batch):
1. VISIBLE SCROLLBARS everywhere — global lavender thumb + faint track
   (both scrollbar-color and ::-webkit-scrollbar syntaxes so Chrome/Firefox/
   Safari all comply); the #stats/#codex/#log tints kept, brightened
   0.25→0.5 alpha. Root cause of Nick's friend getting STUCK IN TRAINING
   on desktop: the release-notes card scrolled but the default thumb
   vanished into the void. (Friend's screenshot still pending — may reveal
   a second, separate snag; re-check when it arrives.)
2. RELEASE-NOTES STACKING — the 'latest' bulletin now shows the shipped
   version's whole minor line (1.1.2 ⇒ 1.1.2 + 1.1.1 + 1.1, newest first),
   still hiding unshipped entries newer than GAME_VERSION. Smoke check
   rewritten to the new intent (stacks the line / never leaks v-next).
3. SETTINGS OVERFLOW (Nick's phone: pills past the panel's right edge) —
   real cause: the 3-pill rows (Font ~208px, Motion ~210px) never fit the
   210px panel. Panel 210→236px + max-width:calc(100vw-32px); .srow2/.opts
   are now wrap-safe (pills drop to a right-aligned second line — matters
   because pill labels render in the CHOSEN font and Mono runs wide).
RELEASES[0] is now the working v1.1.2 "Clear Signals" entry (title = Claude's
placeholder, Nick may rename). Version bumps to '1.1.2' only on Nick's word.

STILL QUEUED FOR 1.1.2:
- Training stuck — screenshot ARRIVED (2026-07-16), diagnosis CONFIRMED:
  Safari (overlay scrollbars hidden until scrolled), Earth card at training
  step 4 cut off mid-sentence with "+ Add to Star Atlas" below the fold and
  no scroll cue. The shipped scrollbar fix forces a visible thumb+track in
  Safari; the card redesign (buttons up top) removes the trap structurally.
  Consider CLOSED unless Nick's friend hits it again post-deploy.

## ★ v1.2 "THE DISCOVERY ARC" — SHIPPED 2026-07-16 (Nick: "it's go time")

PRE-SHIP REVIEW (3 parallel agents: correctness / perf-heat / edge-cases;
every finding verified against source, all confirmed ones fixed in-batch):
- CORRECTNESS: glance regexes didn't match real descriptor strings —
  airless/lifeless worlds (Mercury!) glanced as "atmosphere ·
  biosignatures". Fixed (^None / ^No known life / liquid|ocean|river).
- EDGE CASES fixed: scout stand-down on ANY codex removal (breeding, fatal
  meal, lost conquest, training cleanup) with toast; veteran grandfather
  now includes surveyedSet (Atlas cap 120 left bioscanned worlds out);
  conquered counts as grounded (key + check); training landings no longer
  permanently forfeit field samples; save `land` unions conquered+mined
  and cap raised to 4000 (eviction can't re-hide a held census); Guide/
  bulletin copy aligned with emoji-free buttons + glance qualified as
  desktop-hover.
- LAND BUTTONS (ship-blocker found by review): the locked card covers the
  planet on phones and swallowed the landing gesture. flyDown(pseed)
  places st.scam at landing zoom → real planetfall next frame. Unlanded
  civ worlds: "Land — make contact"; unlanded dead worlds: "Land to
  prospect" (both data-act=landcta; toast fallback off-system).
- HEAT PASS (Nick: "phone runs hot"): descriptor memo (400ms TTL, honors
  every _panelKey=null invalidation) — descriptors were recomputed 60×/s,
  worst on surfaces (per-frame forced pick); panel measure/maxHeight only
  on rebuild/viewport change (was a forced reflow every frame); backdrop
  (gradient + 900 stars) pre-rendered per resize; ctxEl.textContent
  write-on-change; universe grain positions cached (~2k closures/frame
  gone); DPR capped 2 on TOUCH devices (desktop stays 3) — CLAUDE.md rule
  8 updated; ~55% fewer pixels on iPhone, the single biggest heat lever.
  REVERT PATH if Nick finds phones soft: TOUCH?2:3 in resize().
- Deferred (logged by perf agent): picks pooling, galaxy star batching,
  frame governor, integer cache keys.
SHIP: GAME_VERSION='1.2', smoke 133/133 (new: Land-button planetfall
end-to-end — press button → surface → mine on the spot → samples toast →
zoom out → card stays Ground-surveyed; venus glance asserts NO
biosignatures), fingerprint byte-identical, systems 19/19, balance PASS.

## ★ v1.2.6 "INK & EMBER" — LIVE (2026-07-17, build a8a045f): functional-
## only bold; MUD Chronicle + game-wide event color language (toasts, tray,
## outcomes, verdicts, glance, Compendium scout tag, Atlas badges, Cosmic
## Events, charter ticks); 44-fix grammar pass; Guide coverage pass (new
## "color language" topic, field samples documented, mining topic
## modernized). Suites green at ship.

## ★ v1.2.5 "FIRST CONTACT" — LIVE (2026-07-17, build 319e5b9). Pre-deploy
## review: 4 findings (stale _pendingContact from training landings;
## wk-mine counted re-mines; survivor achievement text; 2 vacuous smoke
## clauses) — all fixed in-batch. (Nick renamed 1.2.2→1.2.5:
## "more than just bug fixes"), GAME_VERSION bumped — AWAITING DEPLOY WORD

Nick's asks (Saturn screenshot session) + the staged Smooth Landings fixes,
all in one entry (fingerprint byte-identical, smoke 146/146, systems 19/19):
1. STUCK-CARD BUG (heat-pass regression, same-day catch): the fold toggles
   in place without a rebuild, so the panel kept collapsed measurements
   and the expanded card hung off-screen, unscrollable. gtoggle now sets
   _panelDirty → remeasure + reposition on unfold.
2. ONE LAND BUTTON EVERYWHERE (Nick: no flavored labels): every planet
   card in system view says just "Land" (works on grounded worlds too —
   revisits/sightseeing). Flavored variants removed.
3. FIRST CONTACT (Nick's design): landing on an inhabited world attempts
   contact — 70% warm reception opens the census; failure wounds
   (14 HP, 11 with hull1) via new routeHit() (the Field Scout absorbs it,
   same wound math as bioscans — scanlife refactored onto routeHit).
   Retry by re-landing (_pendingContact set per planetfall, resolved on
   card render like samples). contacted:Set, save `cont` (cap 4000);
   ABSENT ⇒ grandfather landed+conquered (no census re-hides). known
   (133|conquered|contacted) now gates the census fold instead of
   grounded; rebuild key gains |K. Guarded by tutDone (no contact rolls
   in training). Guide survey topic updated.
4. CARGO INVENTORY (Nick's "Minecraft component"): Cargo panel split into
   Inventory / Research Bench tabs. Inventory = sandbox item grid: every
   element gets a procedural SVG icon (ingots=metals, shards=ices,
   flasks=gases/volatiles, cut gems=exotics; tinted per element via the
   EC palette, cached data URIs, elemIcon()); tiles wear corner
   quantities + name tooltips; min 12 slots for the grid feel. Bench
   recipes show the same icons. This pulls the v1.3 "element mini-SVG
   icons" item forward in inventory form (Cargo's ◆ glyphs replaced;
   Research costs iconified).
SMOKE COVERAGE ADDED: inventory tiles + qty + bench tab, veteran
contacted-grandfather, Land-button rename intent. NOT smoke-driven: a
live first-contact roll (no civ world in Sol; noted for a future seeded
fixture).
NOT deployed — one word ships it (bump not needed: 1.2.1 line stacking
means the bulletin shows 1.2.2+1.2.1+1.2... wait: GAME_VERSION must bump
'1.2.1'→'1.2.2' at ship + smoke version strings).

## ★ v1.2.1 "THE HUNT BOARD" — LIVE (2026-07-17, build aeb5eb0, Nick:
## "Let's deploy it"). Bulletin stacks 1.2.1 + 1.2 for the 1.2 line.

## (build notes below)

EXPEDITION CHARTERS (Nick's onboarding concern: "will new players know
what to do?"). Built & verified (fingerprint byte-identical, smoke
140/140, systems 19/19):
- Charters button + panel, left rail under Cosmic Events (gold dot;
  rmotion whitelist extended; mobile offsets added).
- 5 STARTER charters = training part two, in the order the systems chain:
  Make planetfall → Prospect a dead world → Discover life → Name a Field
  Scout → Conquer a world. Paid ☄ on the spot; completion toast names the
  next charter; _tutFinish announces the board when training ends. ALL
  starters listen simultaneously (no lost credit), panel lists them with
  ✓ ticks.
- WEEKLY board after starters: 3 charters from a 7-template pool, seeded
  by calendar week (hashInt(0xC4A7, week, 7)) — identical for every
  explorer. Weekly progress resets on rollover; app-layer Date.now (like
  mining cooldowns; domain untouched).
- Engine taps gameEvent centrally. New emissions: mined, bioscan (once
  per world, in autoScanWorld's new-survey branch), scout-set, conquest
  (victory only), species (onSpeciesStored; _loading-guarded so save
  restore doesn't count). charterEvent guarded by tutDone + _loading.
- Save: chs (done starter ids), chw (week), chp (progress), charters
  stat (character-sheet row added). Reset clears. VETERANS: proven trades
  auto-complete quietly, no retroactive pay (landed/mines/surveyedSet/
  scoutId/conquered-beyond-Earth — Earth's preset flag doesn't count).
- Guide topic 'charters' (data-guide wired); RELEASES[0] = v1.2.1 entry;
  leak-checked (stays invisible until the bump).
NOT bumped/deployed — rule 7: version ships on Nick's word only. One
word ships it: bump GAME_VERSION '1.2'→'1.2.1', update smoke version
strings (footer + fresh-bulletin checks), validate+smoke, deploy.

STILL QUEUED FOR v1.2.x / NEXT: scout marker in Compendium lists;
grade-scaled scout rare-find bonus; Nick's on-device pass of heat + DPR
feel + charters.

## (pre-ship notes below)
## ▶ v1.2 "THE DISCOVERY ARC" — CORE BUILT 2026-07-16 (Nick: "begin it all
## now") — NOT DEPLOYED, GAME_VERSION stays '1.1.2' until Nick's bump

BUILT & VERIFIED (fingerprint byte-identical — all app-layer; smoke 125/125
incl. 12 new discovery checks driving hover→tap→land on a real Sol pick;
systems-check 19/19):
- landed:Set<planetSeed> + noteLanding() (ui-panel section). Hooked at the
  planetfall transition AND in renderPanel's surface branch (covers saves
  restored directly onto a surface). Toast on first landing (not Earth).
- Save field `land` (capped 2000 newest). ABSENT ⇒ grandfather: atlas 'p'
  ids + conquered keys + mined keys. Earth 133 always grounded. Reset
  clears. Veteran smoke fixture extended (log p555 + conq 777 → both
  grandfathered, probe-asserted).
- Tiers in renderPanel (planets only; stars/moons/galaxies untouched):
  GLANCE (hover, !locked) = head + spectral row + 🛰 Long-range reads
  (☁ atmosphere / 🌊 liquid-water / 🧬 biosignatures / ⟁ structured
  signals, derived from real rows — vague, never wrong) + no buttons;
  ORBITAL (tap/lock) = 1.1.2 card, but census replaced by "Signals from an
  organized world — land to make contact" when !grounded; GROUND (landed)
  = full census fold + veins + ⛳ Ground-surveyed tag.
- Mining gated on grounded (gas giants ARE landable in this game — no
  orbital-skim exception needed); scan1 Deep Scanners still show veins
  from orbit (tech-removes-friction), but the Mine button needs landing;
  unlanded dead worlds get "⛳ Land to prospect" (tap = explainer toast).
  Ground survey shows veins WITHOUT scan1.
- Rebuild key gains |G (grounded) before the trailing |cx. probe-names +3:
  landed, noteLanding, cardExpand (83 hooked).
- Guide survey topic rewritten around the three acts; mining topic updated;
  RELEASES[0] = fresh v1.2 "The Discovery Arc" entry (bulletin-leak smoke
  check asserts it stays invisible until the bump).
CARD POLISH BATCH 2 (Nick's screenshot, 2026-07-16 — BUILT, smoke 126/126):
- k-column emojis REMOVED (🌍/🛰/⛏/👑 broke the 74px label column
  alignment); ⟁ Signal keeps its glyph (brand language, monochrome).
- Fold affordance is now the WORD "expand"/"close" in a tiny pill (CSS
  ::after swap on .grp.open — in-place toggle needs no rebuild). The bare
  ▸ triangle read as decoration.
- BUG FOUND IN NICK'S SCREENSHOT & FIXED: Earth wore a ⛏ Mine Deposits
  button — seed 133 hardcodes flora/fauna rows without populating
  d.species, so the lifeless-world test misfired. Now excluded (the only
  living world that could be mined). Flagged to Nick — revert if he wants
  Earth minable as a starter resource.

## v1.2 SYSTEMS INTERTWINING — APPROVED BY NICK 2026-07-16 ("I like your
## proposal as a first iteration, let's do it"). B + A BUILT; C NEXT.

BUILT 2026-07-16 (fingerprint byte-identical, smoke 131/131, systems 19/19,
balance PASS — combat untouched, sim run for safety):
B. FIELD SAMPLES: first landing on any world grants 1× of up to 2 of its
   deposit elements (same depositsFor recipe as mining — deterministic) +
   3+tier*2 ☄. Granted via _pendingSample on the NEXT card render (that's
   where type/tier live); suppressed during training and on Earth. New
   stats.landings counter (save field landings). Toast lists the haul;
   Cargo button appears.
A. FIELD SCOUT: scoutId (save `scout`, validated against codex on load —
   stale ids stand down silently). Toggle button on owned fauna reveal
   cards (🐾 Scout / Scouting ✓). Hostile bioscan damage reroutes to the
   scout: wound = clamp(dmg/80, .12, .6) onto genome.hurt (hull1 reduction
   carries over); cumulative >=1 ⇒ removeFromCodex + scout lost toast;
   else condition toast. Explorer path (incl. 'survivor' unlock) unchanged
   when no scout. Feeding-as-medicine mends scouts like anything else.
   Guide discover topic + release bullets updated. probe +scoutId.
FOLLOW-ON POLISH (logged): scout 🐾 marker in Compendium list rows + feed
picker; grade-scaled rare-find field bonus for scouts (cut from v1 to keep
balance untouched).
NOT BUILT YET — C. EXPEDITION CHARTERS (next batch): 3 rotating epoch-week
seeded goals, same for every player, paying elements/stardust. Needs: pure
seeded charter gen, progress tracking off gameEvent stream (survey/landfall/
scan/mine/conquest already emit), a small UI surface (left rail bulletin?),
save fields, smoke. ALSO PENDING: LAND button (pulled into v1.2), Nick's
on-device pass, bump + deploy on his word.

## (original proposal record below)

Nick's direction: systems should play with each other; discovery with self
OR fauna; addicting hunt for the next best fauna/flora/world; mining feeds
future shipbuilding. Claude's proposal (three features, build order B→A→C):
A. SURVEY COMPANION (fauna join discovery): a chosen Compendium creature
   absorbs hostile-bioscan damage instead of the explorer, using the
   EXISTING injury/condition/mend systems; its grade adds a small rare-find
   field bonus. Loop: hunt tougher fauna → scan riskier worlds → rarer
   finds. (No XP changes in v1 — power stays through wins.)
B. GROUND-SURVEY YIELD (landing pays): FIRST landing on any world yields a
   deterministic element/stardust trace scaled by type + spectral tier
   (living worlds one-time samples; dead worlds keep full mining). Completes
   the discovery arc's act 3 with a reward; funnels everything into the
   research/ship track. Must be a pure seeded function — no Math.random.
C. EXPEDITION CHARTERS (the next-hunt driver): 3 rotating deterministic
   goals (epoch-week seeded, same for all players) — "ground-survey an ice
   world in a frontier region", "catalogue a Legendary+ fauna", "mine 3
   metal worlds" — paying stardust/elements. The compulsion scaffold that
   points every system at the others.
PULLED FORWARD RECOMMENDATION: the LAND button design call (was a v1.1
design call) belongs IN v1.2 — landing now gates content, and phone
double-tap-to-land remains awkward (first tap locks a card over the point).

## MOVED v1.2 → v1.3 (Nick, 2026-07-16: "move that to v1.3")

Element mini-SVG icons · JOB 2 curated raster art pack (style bible first) ·
guardian unique battle intros · generative music (hand-rolled seeded Web
Audio) · tutorial restructure (collapse chrome steps 3-7) · new-player
bulletin placement call · minor warts list (#sharelink focus, #namein
maxlength, "Explorer" re-prompt, TOUCH constant, Notifications toggle
placement). v1.2 stays focused: Discovery Arc + systems intertwining.

STILL OPEN FOR v1.2 (design + build):
- Conquest/Discover Life deliberately NOT landing-gated (no double gates).
- Possible: landing achievement(s), first-footfall discovery record,
  training step teaching landing, orbital deep-scan tech tier that reveals
  the census from orbit (the friction-remover unlock).
- Nick's on-device pass of 1.1.2 (live) + this build; his call on bump+
  deploy timing and the "vague vs wrong" estimates read (built as VAGUE).

## DISCOVERY ARC — original direction notes (2026-07-16), superseded above

Nick: survey-card fields shouldn't be viewable until you DISCOVER the
planet — coarse read from space, land to learn the truth, discovery
unlocks mining etc. Agreed shape (Claude's recommendation, Nick to
confirm):
- Tier 0 glance (free, always): name, type, spectral class + 2-3 coarse
  long-range reads derived from real data ("dense atmosphere · liquid-
  water signature · ⟁ structured signals" — extend the Signal-row
  language). Looking stays free — friction gates KNOWING, never looking.
- Tier 1 orbital survey (= the existing tap-lock, unchanged cost):
  environment block as instrument readings; life as "biosignatures";
  civilization as signals only. Prime Codex / survey achievements keep
  keying off the tap exactly as today.
- Tier 2 ground survey (land once): full civ block (name/era/year/pop),
  mineral veins + Mine button, geological truth; card gains a permanent
  "⛳ Ground-surveyed" state.
- Estimates are VAGUE, never WRONG (a second lying-descriptor system =
  huge cost + reads as a bug). Parking lot: rare "reads dead from orbit,
  ground survey finds subterranean life" surprise worlds.
- Guardrails: Discover Life keeps its own danger loop (landing must NOT
  become a second gate on it); gas giants need an orbital-skim mining
  exception (no surface); veterans grandfathered (Atlas/Compendium/
  conquered/mined ⇒ counts as ground-surveyed; new save field, absent-
  default = discovered); Earth stays fully known (home + keeps training
  untouched). Future tech hook: orbital deep-scanner research reveals
  ground data from space (unlock that REMOVES friction).
- Sizing: v1.2, NOT 1.1.2 (save schema, mining gating, Guide, training,
  smoke). The 1.1.2 card condensing becomes the skeleton: collapsed
  environment group gets a "🛰 Orbital survey" framing the tiers slot into.
AWAITING NICK: estimates-as-vagueness ok? go/no-go on 1.1.2 card
condensing.
- PLANET CARD CONDENSING — Nick's proposal + Claude's recommended shape
  (2026-07-16, Nick reviewing): buttons move up but UNDER the header;
  Spectral class row always visible; "Environment" group (Made of,
  Atmosphere, Climate, Water, Gravity, Magnetism, Weather, Seasons)
  collapsed by default behind a one-line digest header; Life/Flora/Fauna
  stay open (the collection hook); "Civilization" group collapses tech
  era/local year/population but the header keeps name+era visible; ⟁
  Signal row stays outside every group; expand state remembered (new save
  field, absent-default collapsed). Expand states must join the panel
  rebuild key (the _spExpanded pattern); Field Training's Atlas-button
  target moves (spotlight tracks live; smoke needs new checks). Biggest
  1.1.2 item — do NOT start until Nick oks the shape.

## ▶ PREVIOUS SESSION AGENDA (agreed with Nick, 2026-07-15)

1. Nick's on-device pass of LIVE v1.1.1 — Tier 1 feel (ping/whoosh, labels,
   moon-tap) + Tier 2 feel (volume, Motion Reduced, landing glide, touch
   targets). Feedback reshapes everything below.
2. Build (no decisions needed): ELEMENT MINI-SVG ICONS — procedural
   crystals/ingots/flasks tinted per element family (metals silver/gold,
   ices cyan, volatiles amber, exotics iridescent), species-portrait recipe
   style, replacing the colored ◆ glyphs in Cargo/Research.
3. Design calls if Nick wants to settle any: bulletin placement, tutorial
   restructure, LAND button, generative music.
4. Opportunistic warts (list under MINOR WARTS): #sharelink focus,
   #namein maxlength 20 vs 24, "Explorer" re-prompt, TOUCH constant,
   Notifications toggle in Audio tab.
Mechanics reminder: extract.js first; new player-visible work starts the
fresh v1.2 RELEASES[0] entry.

## ★ v1.1.1 "SIGNAL & POLISH" IS LIVE ★ (2026-07-15, patch — build c5f1e94)

The two held fixes shipped as a patch on Nick's call, repo and live in sync:
- Page identity: <title> is just "Celestial Frontier" + og:/description
  meta — shared links stop previewing as "Cosmic Codex" (in-game names
  untouched; Prime Codex keeps Codex per rule 9).
- Settings rows keep a 12px flex gap — Font/Motion pills were butting
  against their labels (Nick's screenshots).
v1.1 saves see the small Signal & Polish bulletin once. The next working
RELEASES[0] entry (v1.2) starts fresh when new player-visible work lands.
NOTE for link previews: services that already cached the old preview
(Discord/Slack/iMessage etc.) may show "Cosmic Codex" until their cache
expires or is refreshed — the page itself is correct.

## ★★ v1.1 "FIELD REPORTS" IS LIVE ★★ (2026-07-15)

SHIPPED: **deployed as build 14ca544** (GAME_VERSION='1.1', Dakk's call
2026-07-15). Contains Emerson-playtest Tier 1 (six fixes: hint copy, moon
tap-steal, training quiet pass, rename surfaced, label contrast, survey
ping + whoosh) and Tier 2 (Motion Auto/Full/Reduced, landing assist, touch-
target inflation, SFX volume bus + slider, keyboard operability — full
detail in the TIER sections below). Live v1.0 saves (rn='1.0') get the
Field Reports bulletin exactly once; any session left open should show the
gold refresh pill. The release-notes pattern resumes: new player-visible
work starts a fresh RELEASES[0] v1.2 entry as it is built; GAME_VERSION
bumps only on Dakk's say-so.

VERIFICATION AT SHIP: fingerprint byte-identical (50 probes), smoke
102/102, systems-check 19/19, balance PASS. Tier 2 was review-hardened
pre-commit by a high-effort adversarial workflow (4 finders / 11 verifiers,
17 verified findings — every confirmed correctness finding fixed in-batch:
assist arming, delete-× padding exclusion, rm tri-state so the OS
preference is never frozen into the save, real volume assertion, focus
restore after re-renders) plus two tooling cleanups (shared tools/fake2d.js,
live probe-hook getters).

AWAITING DAKK: on-device pass of the LIVE v1.1 — Tier 1 feel (survey ping /
whoosh character, label brightness, moon-tap) and Tier 2 feel (volume
slider, Motion Reduced on iPhone, landing-assist glide, fatter touch
targets); the update pill's real-world test (deploy after 14ca544); and the
design calls under EMERSON PLAYTEST (bulletin placement, tutorial
restructure, LAND button, generative music).

REVIEW LEFTOVERS (logged, deliberately not built): PICK_F is convention-
applied at 15 pick sites (a future pick site must remember ×PICK_F on its
floor); body.rmotion CSS is a 7-selector whitelist (a future decorative
loop must be appended there). Both are documented at their definition sites.

NEXT SESSION MECHANICS: `node tools/extract.js` first (main.js is a
generated artifact, not committed); loop = edit main.js/html → validate.js →
smoke.js (now 102 checks). RELEASES[0] is the working v1.1 "Field Reports"
entry — new player-visible work adds bullets there; the 'latest' bulletin is
pinned to the GAME_VERSION entry so unshipped bullets stay invisible.

## ★★★ v1.0 "THE FRONTIER OPENS" IS LIVE ★★★ (2026-06-12, ~4:30 AM)

SHIPPED: deployed as 0808737, refreshed same-night as **107107a** (live now).
GAME_VERSION='1.0'; single comprehensive debut bulletin; the version reset
is complete. **The release-notes pattern now RESUMES the old way: every
player-visible change lands as a bullet in a NEW RELEASES[0] v1.1 entry as
it is built; GAME_VERSION bumps only on Dakk's say-so.**

WHAT 1.0 CONTAINS (all verified): deterministic universe · hyperlane travel
with real distance + drive ladder · 15-grade rarity (deep spectrum + summit,
Omnipotent at top) · Apex Guardians · the Fifty Paragons · the Binder + Sets
· ~182 creature classes with innate arts · XP/levels (power through wins,
levels wake arts, never stats) · ability matrix (17 verbs × 11 themes × 5
magnitudes, empirically balanced 42–58) · the Chronicle (narrated duels +
ledger + shareable battle log) · mining/elements/Cargo/research bench ·
poison-wounds-not-executes · habitat-backdrop painterly portraits + rarity
card frames · nameplate rank colors · collection-card badges/foil · tabbed
Settings (Display/Graphics/Audio) · text tone + font options · unified
right-rail design system · glass-pill HP readout · Pathfinders story from
intro to Prism Signature to ending · Witness Log · discovery records ·
field training (all soft-locks fixed) · ? popover (version → full notes).

VERIFICATION TOOLING (run all three on any future change):
- tools/validate.js — build + invariants + 50-probe determinism fingerprint
- tools/smoke.js — full jsdom UI walk incl. training
- tools/balance-sim.js [mag] — 17-verb combat fairness (42–58 band)
- tools/systems-check.js — 19 functional checks (classes/XP/breeding/
  imports/guardians/duels). All four GREEN at ship.

POST-1.0 QUEUE (the v1.1 pile, in rough priority):
1. Dakk's live playtest feedback (the eternal source of truth).
   → FIRST OUTSIDE FEEDBACK ARRIVED: see "EMERSON PLAYTEST" section below —
   verified against source 2026-07-01, Tier 1 fixes in progress.
2. Element icons as real mini-SVG art (colored ◆ glyphs shipped in 1.0).
3. JOB 2 — the curated AI raster art pack (Paragons/class crests/elements/
   guardian archetypes): when Dakk opts in, FIRST deliverable is a style
   bible for his image generations, then assets/ wiring with SVG fallback.
4. More guardian flavor: unique battle intros per epithet.
5. Public-player bug reports once anyone else plays.
HOUSEKEEPING: the hotfix worktree (C:\Projects\cf-hotfix, branch
hotfix/v12-mobile) is obsolete now that 1.0 collapsed the lines.

## EMERSON PLAYTEST (received 2026-06-12; every claim source-verified 2026-07-01)

`celestial-frontier-feedback.md` (committed) — desktop Chrome, fresh profile,
live v1.0. A 14-agent verification pass checked each claim against HEAD with
adversarial re-checks. Verdicts: ~60% confirmed, ~25% partial, ~15% wrong.

WRONG (no build needed, keep for the record):
- "Mobile verbs don't exist" — full touch mapping ships (tap-lock survey,
  pinch-at-midpoint, double-tap zoom, long-press tips; device-branched HINTS).
  He extrapolated from desktop copy.
- "Camera starts at top scale" — fresh expeditions start INSIDE Sol system
  (startNewGame), one level deeper than his suggested galaxy start.
- "Player rename impossible" — exists (nameplate → sheet → ✎ rename) but is a
  9px link, absent from Settings/Guide, and unclickable during training
  (the sheet step advances synchronously on open) — discoverability is real.

KEY MISDIAGNOSIS (his best find, wrong cause): "tap Earth took 3 attempts" is
NOT orbital speed (~5px/s, one self-diameter per ~2.4s) — it's the MOON pick
(10px floor, orbiting 4-11px from Earth's center at default zoom) stealing
nearest-wins taps; Moon's descriptor has no planetSeed so find-earth silently
never advances. Labels are also hidden at that zoom, and a Moon mis-tap locks
a panel that eats the next tap.

TIER 1 — ★ BUILT & VERIFIED 2026-07-01 (all six + the pinned-bulletin fix),
committed as the batch after a9fa4ed. RELEASES[0] is now the working v1.1
"Field Reports" entry (GAME_VERSION stays '1.0' until Dakk's bump; the
'latest' bulletin is PINNED to the GAME_VERSION entry so unshipped bullets
never reach players). What shipped:
1. Desktop hint copy: "Hover to preview · click to survey" (stale since the
   2026-06-11 hover-survey removal).
2. Moon tap-steal fixed: below the moon-label zoom a moon's pick is its TRUE
   apparent size (sub-pixel on phones — can't steal "tap Earth"); the 10px
   floor returns at label zoom (visible desktop gas-giant moons stay
   clickable). Planet pick floor 14→16px.
3. Training quiet pass: toasts tray-only while body.training (achievements
   pattern); Rank Up fanfare fully gated during training (its promotion is
   revoked at cleanup — was a bug); tooltips held; wheel-block now nudges the
   card (was silent on 17/18 steps); flushToasts re-checks the gate at fire
   time. ONE exception: the locked-Guide message stays a visible pop-up (it
   IS the ? button's feedback mid-training).
4. Player rename surfaced: Settings → Display → Explorer name; Guide rank
   topic documents it; ✎ link enlarged; Cancel button + Escape on the rename
   dialog (initial naming still mandatory); cancel flushes queued toasts;
   #namebox joined the body.training yield rules (renders below the card).
5. Survey-card labels: new --label #9aa4cb (8:1; tone-aware) replaces --faint
   on .k/.tag, and the stale .krow selectors are fixed so they scale with
   A+/A++ (they were the ONLY body text that ignored the setting).
6. playSurveyPing (every tap-lock) + playWhoosh (travelTo + planetfall);
   travel-skip taps disarmed so the skip can't survey-lock + ping the arrival.
VERIFICATION: fingerprint byte-identical (50 probes), smoke 91/91 (new checks:
training-quiet ×3, pinned bulletin, rename flow ×5, locked-Guide feedback),
plus a 3-lens adversarial review workflow whose 4 confirmed findings were all
fixed (stranded toast queue, moon dead band, skip-tap ping, namebox overlap).
Reference doc + CLAUDE.md synced. NOT deployed — awaiting Dakk's word.

TIER 2 — ★ BUILT & VERIFIED 2026-07-15 (all five, plus review-round fixes).
What each item became:
1. Motion setting (Settings → Graphics): Auto / Full / Reduced (save `rm`
   -1/0/1). Auto follows the OS prefers-reduced-motion preference LIVE
   (matchMedia change listener) and is itself the persisted default, so the
   OS preference is never frozen into the save (review catch — the first
   draft wrote 0/1 on every autosave). Reduced gates the travel tunnel,
   screen shake and confetti in JS and stamps body.rmotion, which stills
   the decorative CSS loops (update pill, cinema rays, events dot, foil
   shimmer).
2. Landing assist: armed ONLY by a zoom-in gesture blocked at the system
   zoom ceiling (450ms window) — the original always-on glide hijacked
   moon surveys and off-screen planets (review catch). Glides 0.14/frame
   toward the dominant landing-size planet; instant step under reduced
   motion; panning/pinching always wins.
3. Touch-target inflation: PICK_F (×1.4 on TOUCH) scales every canvas pick
   FLOOR (15 sites; true-apparent-size parts untouched — the moon lesson);
   @media(pointer:coarse) invisible ::after hit-padding on Atlas row
   actions and Settings pills. The destructive Atlas delete × is
   deliberately EXCLUDED from padding (review catch — an unconfirmed
   permanent action must never win near-miss taps).
4. SFX volume bus + slider (Settings → Audio, save `vol` 0-100): all six
   synths exit through one shared gain (sfxOut), sfxVol² perceptual taper
   computed only in applySfxGain; the survey ping answers on release at
   the chosen level.
5. Keyboard operability: role="button" tabindex="0" on Settings pills/tabs,
   Compendium tabs/groups/cards, Binder paragon slots, Atlas items, Guide
   categories/topics/back/cross-links (the existing Enter/Space shim drives
   them); [role=button]:focus-visible gold ring; refocus() restores focus
   after innerHTML re-renders (review catch — activation used to dump
   keyboard users back at <body>).
TOOLING: shared tools/fake2d.js replaces four drifted fake-canvas copies
(two lacked createImageData and threw every frame); make-probe-build now
emits LIVE getters so smoke can assert on scalar state (sfxVol, motionMode
added to probe-names.json — 80 hooked names); smoke suite 102 checks.

DESIGN CALLS — AWAITING DAKK (do not build until he picks):
- New-player bulletin: drop from fresh path (1-line + smoke rewrite) or
  retitle "Your expedition briefing"? Becomes real patch-notes noise the
  moment v1.1 bullets exist.
- Opening fly-in: camera already starts at Sol — the text stack is the real
  issue; cheaper = trim/defer lore, feed Pathfinders in during play.
- Tutorial restructure (collapse chrome steps 3-7): medium; heaviest
  smoke.js rework of anything here. 12/18 steps event-gated, 6 click-through.
- LAND button on locked planet card: small; zoom-to-land is a deliberate
  signature, BUT phone double-tap-to-land mostly can't work (first tap locks
  a full-width card over the tap point) — strengthens the case.
- Generative music: Tone.js OUT (no-dependency rule); hand-rolled seeded
  Web Audio engine fits (throwaway mulberry32 presentation instances + iOS
  resume plumbing already exist). Large; differentiating.
- 3D/WebGL: park — conflicts with single-file identity; JOB 2 covers the
  art ambition.

MINOR WARTS LOGGED (fix opportunistically): #sharelink outline:none with no
:focus style; #namein maxlength=20 vs cleanName cap 24; self-naming "Explorer"
re-prompts every boot; TOUCH is a load-time constant (mouse-driven touchscreen
laptop gets touch hints); "Notifications" toggle lives in the Audio tab but
gates visual toasts.

## ★ 1.0 WAS READY (2026-06-12, commit d3f721e) — historical ★

Everything built and verified: GAME_VERSION='1.0', single debut bulletin
"The Frontier Opens", habitat-backdrop portraits, ~182 classes, the
Chronicle, all four pillars, all fixes. Fingerprint/smoke/balance green.
Deploy = `node tools/deploy.js` from the repo root on Dakk's word (the
hotfix worktree at C:\Projects\cf-hotfix is now obsolete — remove after
1.0 ships: `git worktree remove C:\Projects\cf-hotfix`).
POST-1.0 (the v1.1 pile starts fresh): Dakk's on-device review feedback,
element mini-SVG icons (colored ◆ shipped), Job 2 raster art pack (style
bible first), public playtest fixes.

## VERSION RESET (Dakk, 2026-06-11 ~9:45 PM): the staged release SHIPS AS v1.0

- Nobody but Dakk has played yet and every bug was fixed pre-release, so the
  release formerly staged as "v1.3" ships as **v1.0 — the public debut**.
  Everywhere this file says "v1.3", read "the 1.0 release".
- **Release notes collapse to a SINGLE v1.0 entry**: a high-level overview of
  every game system and feature to date (an introduction, not a changelog).
  Written at ship time, replacing the whole RELEASES history in-game (git
  history keeps the old notes).
- In-game `GAME_VERSION` resets '1.2' → '1.0' at ship. Dakk's live save has
  rn='1.2' ≠ '1.0', so the new bulletin pops once for him — expected.
- AFTER 1.0 ships: resume the old pattern exactly — fixes/additions pile
  into RELEASES[0] as v1.1 bullets as they're built; bump on Dakk's say-so.

## Current state (updated 2026-06-11, late evening)

- **Version: v1.2** (in-game `GAME_VERSION`) — live as build `ffdd3e2`
  (incl. the iOS 100vh Continue-button hotfix). Bumps only on Dakk's say-so;
  every shipped change gets a bullet in `RELEASES[0]` (see CLAUDE.md rule 7).
- **STAGED, not deployed: v1.3 "The Deep Spectrum"** — rarity ladder extended
  8 → 12 tiers (see section below). Built, validated, smoke-green; notes
  staged as `RELEASES[0]`. **Awaiting Dakk: bump `GAME_VERSION` to '1.3' +
  deploy.**
- **Live:** https://celestialfrontier.github.io/ (org user site; old
  thedakk.github.io deleted; dev repo TheDakk/Celestial-Frontier is PRIVATE).
- Shipped in v1.1 so far: SOLID restructure + test toolkit, Guide to the
  Universe, tooltip system (text-only, 650/600ms), Field Training (lockdown,
  Sol-start, Settings allowed, dialogs yield below card, desktop high-riding
  card), release-notes system (bulletin-first welcome: name → notes →
  training; once-per-update for returners; cumulative via Guide footer),
  update watch (BUILD_ID + version.json + refresh pill), toast pacing
  (read-length, tap-dismiss, title-screen hold), v1.0-feedback fixes (Kepler
  moons, slow galaxies, sound resume, hover-survey, % labels, HP/condition
  line, no phantom Rank Up).

## Awaiting Dakk's playtest feedback

- Tooltip timing (now 650 ms hover / 600 ms long-press) — eager or sluggish?
- Tutorial pacing & copy on iPhone — any step that drags or confuses?
- Release-notes bulletin readability on phone; bullet length.
- Desktop training card: widened to 440px / nudged down 20px under the topbar
  (2026-06-11) — Dakk had a screenshot showing it could be "more centered up
  top" on PC; screenshot never surfaced on disk, so confirm the new placement
  matches what he meant.
- Update pill: first real-world test = the deploy after build 8fe599c (any
  session left open should show the gold refresh pill).

## Recently fixed (2026-06-11, second batch)

- Training always starts at Sol (reload mid-training used to restore the saved
  camera anywhere in the universe → "find Earth" unwinnable). `startTutorial`
  snaps home; `_savedView` restore now requires `tutDone`.
- Settings (`#setbtn`/`#setpanel`) usable during training lockdown.
- Skip-training unlock covered by regression checks.

## Recently fixed (2026-06-11, boot-noise + desktop pass)

- Phantom "Rank Up — Cadet" after reset / training cleanup: rank fanfare now
  requires a genuine promotion (floor increase); trackers reset on wipe.
- Desktop training card: 470px, larger type, more breathing room under the
  topbar. Dakk wants a broader "mobile-first that translates to PC" review —
  the desktop topbar spreads to corners while the card floats center; consider
  a fuller desktop HUD alignment pass if it still reads as off.
- ("Survey the Sun" on boot in Dakk's screenshot = the hover-survey bug, fixed
  in f143ed8; screenshots predated that build.)

## Recently fixed (2026-06-11, v1.0-feedback round)

- Moon orbits now Kepler-ish (outer moons slower; gas giants stately).
- Galaxy rotation slowed ~7x (cosmic-time realism, per Dakk).
- Sound recovery: persistent gesture listeners + visibilitychange re-arm the
  suspended AudioContext (iOS backgrounding bug).
- Hover no longer surveys: credit/achievements/find-Signatures need a tap.
- Breeding/feeding/eating percentages labeled (% success / % poison).
- Specimen cards show battle HP + Healthy condition line.

## Design decisions (made with Dakk, revisit only if it chafes)

- **Discover Life risks the explorer, conquest risks the champion** — kept
  as-is (2026-06-11). The asymmetry is the design: scanning is push-your-luck
  with your own HP; "send the animals instead" already exists as the
  conquer-first-then-scan-safely strategy.

## STAGED for v1.3 "The Deep Spectrum" (2026-06-11, awaiting bump + deploy)

- Rarity ladder extended 8 → 15 tiers. Deep spectrum: **Mythic (~1/22k),
  Celestial (~1/91k), Primordial (~1/333k), Transcendent (1/1M)**; summit:
  **Empyrean (~1/3.3M), Eternal (~1/11M), Omnipotent (~1/33M)** (was "Singular";
  Dakk renamed 2026-06-11 — power-fantasy fits the card-collection direction).
  All bands carved out of the TOP of the old unique band so existing grades
  hold or climb — verified over 60M seeds (0 downgrades; `tools/rarity-sanity.js`).
- **Collection-card pass** (Dakk: "like a card collection game"): specimen cards
  wear a `.gbadge` grade badge; tier 12+ gets the **iridescent foil** treatment
  (shimmer badge + animated prismatic `.iridframe` ring — CSS at the end of the
  style block). High-tier palette repainted to pop: aqua/starlight/ember/
  white-light/dawnfire/twilight/iridescent-magenta.
- **👑 Apex Guardians** (the "ultra-rare encounters" runway item): ~1 in 40
  fauna-bearing worlds is ruled by a named one-of-a-kind titan wearing a summit
  grade (`guardianFor`, deterministic — same ruler for every player). Guarded
  worlds show the ruler on the survey card; conquest becomes a guardian
  challenge; victory stores the guardian in the Compendium, +40 spoils, 👑
  cinematic. Guardian-hood never inherits; `normGenome` clamps imported `apex`.
- Spectral designations past Prismatic fuse tier finish + domain hue
  ("Radiant Fire", "Primordial Black"); `TIER_MAX` replaces hardcoded 7-clamps
  (incl. the loadSave conquered-tier clamp, was 0–9).
- Boosted bloodlines can now breed past Unique (boost cap raised to TIER_MAX);
  summit via breeding needs a natural Anomalous+ under max boost — two roads
  to the top: breeder's and fighter's.
- 8 new achievements (Beyond the Veil ≥Mythic, One in a Million =Transcendent,
  Beyond the Million ≥Empyrean — the FINAL rarity achievement per Dakk: tier
  12+ — plus The Deep Spectrum =12 distinct tiers, Regicide / Throne Breaker
  =1/5 guardians, Realm Ranger / Master of Realms =8/16 realms owned).
  Deliberately NO achievement for the very top: the character sheet instead
  shows **"Highest grade ever reached"** (statistic over achievement, Dakk's
  call) and "Apex Guardians felled". New save field `guardians`
  (absent-default 0). Guide topics (rarity + new Apex Guardians), reference,
  HANDOFF updated; settle25 icon ceded 👑 to guard1.
- **Poison rework (Dakk):** a toxic meal no longer kills a beast outright — it
  deals condition damage (`feedPair`: dmg = 0.16 + severity*0.22 + tier*0.045,
  clamped 0.1–0.92; severity = how deep under the poison threshold the roll
  landed). Death only when cumulative hurt would hit 1.0 ("0 HP"). Survivors
  show their new condition inline with a mend hint. All "toxic kills" copy
  (picker note, feed tip, Guide feeding topic, husbandry header) updated.
  Player eating already worked this way (healExplorer) — untouched.
- Flora coverage verified: floraStat is uniform across all 5 stats (20.0%
  each over 1M seeds) and flora rolls the full 15-tier ladder; heal
  (12+t*9+risk*30), growth (1+t) and mending (0.22+t*0.05) scale uncapped.
- `tools/baseline.json` intentionally regenerated twice (deep spectrum, then
  summit+guardians): only `gradeTiers` changed plus the NEW `guardians` probe
  (50 probes now); all rolls/grades/genomes/duels/codes byte-identical. The
  poison rework needed NO regen — feedPair isn't fingerprinted.

## SHIPPED in v1.2 "The Living Frontier" (2026-06-11)

- Cinematic celebration system: tier-scaled full-screen spectacles for
  Legendary+ discoveries, newborn bloodlines, conquest wins, first-witnessed
  events (queued, tap-dismiss, fxOn-gated, shake at tier 6+).
- Creature injury system: persistent genome.hurt; conquest scars + bad-meal
  wounds; feeding-as-medicine (loved mends most); conditions on cards/picker;
  battleStats guarded so the v1.0 fingerprint stays byte-identical.
- v1.2 bump (everyone's bulletin re-arms), build number in Guide footer,
  new-URL bullet in notes.

## NEXT BATCH for v1.3, before the bump (carry-over for the next session)

Dakk's direction from the 2026-06-11 late-night session (his words paraphrased):

1. **Story coherence pass (v1.3)** — revisit the narrative (Prime Codex /
   Pathfinders fiction, intro, endings, Guide lore) so it's coherent and
   in line with where the game is going: the deep spectrum, the summit
   grades, named Apex Guardians, and the card-collection identity. Weave
   guardians into the Pathfinders story rather than leaving them mechanical.
   Not started — needs a focused pass over intro text, SIGS hints, ending
   text, and Guide category blurbs.
2. ~~Mobile playtest fixes~~ — **DONE & DEPLOYED 2026-06-11 ~9 PM** (Dakk
   approved): shipped to live as **v1.2 hotfix `c3f3830`** (branch
   `hotfix/v12-mobile` off ffdd3e2; only the 4 fixes — no v1.3 content) and
   applied identically to main in 6f78e47. The four: overlay scroll-to-top
   (relbox + all 4 guide views), tap-never-tooltips (focusin gated by recent
   pointerdown; keyboard focus still shows), HP number ON the bar (absolute
   centered; per-text-size fonts 9.5/10.5/11.5px), Settings local-storage
   warning. v1.3 notes carry a 🐞 Bug Fixes section documenting them.
   Worktree gotchas hit & solved: fresh checkout needed LF normalization
   (CRLF broke make-probe-build's IIFE anchor) and a node_modules junction.
3. Tutorial "horizon" step now highlights the conquest champion choice
   (fight as yourself or send a beast) — main/v1.3 only (copy change).
4. ~~Playtest round 2 (2026-06-11 ~9:30 PM)~~ — **FIXED on main**: tutorial
   spotlight now tracks its target live (200ms interval; was positioned once
   per step → stale gold rings = the "phantom long HP bar" around #hpwrap and
   the ring left on the bell) and spots #hpbar not #hpwrap; spotlight is CYAN
   (gold drowned in the gold topbar); breed cinematic chains the reveal card
   via new cinematic({then}) — card never slides in mid-spectacle; HP number
   rides a dark .hpchip; poison ☠ spaced from its % in pickers.
5. ~~Nameplate colors~~ — **BUILT (v1.3)**: RANK_HUES (one per rank, Eternal
   Frontier = .irid foil), unlocks tracked monotonically in stats.bestRank
   (save `br`), choice in save `nh` (-1 = match current rank), picker dots in
   the character sheet above the rarity ladder, painted by applyNameplate().
6. ~~Travel animation~~ — **BUILT (v1.3), moved up from v1.4 per Dakk**:
   travelTo() wraps goTo for the 8 user jump sites (atlas/home/beacon/search/
   codex-where/share-code/prime-grid/events). Three phases over ~950ms: dive
   (camera z ×0.94/frame — real zoom-out through the scale transitions),
   teleport hidden mid-tunnel, eased arrival. Deterministic streak tunnel
   (mulberry32(0x7261), 90 additive lines) tinted by destination star color;
   tap skips; fxOn-gated; honors prefers-reduced-motion. Pure presentation.
7a. **Readability + accessibility (Dakk, ~10 PM round): partially built,
   audit spec below.** BUILT: default body text brightened (--dim #8b93b8 →
   #a0a8cc — was blue-on-blue); new **Text tone** setting (Soft/Bright/Max,
   save field `tone`) lifting text toward white, with <b> emphasis shifting
   to GOLD via --emph in the bright tones (Dakk's "yellowish emphasis" —
   `b{color:var(--emph,inherit)}`, default tone unchanged). STILL TO DO —
   **colorblind audit** for the 1.0 pass: verify every signal has a
   non-color channel. Current inventory: HP = number + bar length ✓;
   creature condition = text labels ✓; odds = % numbers ✓; rarity = names +
   stars + badges ✓; loved/disliked tastes = ♥/⊘ glyphs ✓; RISK: green-vs-
   red odds coloring and the green/amber/red HP slide are red-green-
   confusable — consider a "high-visibility palette" toggle later (blue/
   orange instead of green/red) rather than reworking defaults.
7b. **UI color/contrast pass — code-side DONE (2026-06-11 late), on-device
   sweep REMAINS.** Fixed: HP bar is now continuous green→amber→red by HP
   fraction (pure green ONLY at 100% — Dakk: "red when below 100%"; the
   empty track also tints faint red when wounded); HP chip darkened to
   rgba(6,8,16,0.78) + pure white text (white-on-green failed playtest
   twice); nameplate text color now luminance-aware (ink on bright plates,
   near-white on deep ones). Earlier: cyan spotlight, poison spacing.
   REMAINING: a literal on-device sweep of every panel at A/A+/A++ with
   Dakk's screenshots — code review can't see rendering.
8. **Code audit (Dakk: exploits/vulns/optimizations) — DONE 2026-06-11
   late:** no eval/Function/document.write; the one insertAdjacentHTML
   (duel log) uses cleanName'd names only; CFB import hardened (normGenome
   clamps apex 12..TIER_MAX, ep coerced, brood/fed capped 200, hurt
   stripped); save load coerces+clamps ALL fields incl. new nh/br/
   guardians; domain Math.random/Date.now ban enforced by validate.js;
   new intervals/listeners leak-free (spotlight interval cleared on all 3
   exits; travel frame guard-exits when idle; document listeners are
   singletons); per-frame cost additions ~zero when idle. Guide verified
   current: rarity 15 grades, guardians, poison, hyperlane (atlas topic),
   nameplate colors (rank topic), save warning. No findings requiring
   behavior change beyond the contrast fixes above.
9. **Story coherence pass — STARTED (intro + frame), MORE WELCOME**: intro
   lore now weaves the full arc (Pathfinders' silent beacons → nine
   Signatures → "colors deeper than Prismatic" → named titans → Celestial
   Frontier); Prime Codex panel subtitle ties to the unfinished survey;
   ending text closes the beacon motif. STILL TO DO if Dakk wants more:
   SIGS hint copy, Guide category blurbs, region-name lore, guardian
   battle intros (also listed in the arc).
9. **Release notes** — keep RELEASES[0] current while building; at SHIP TIME
   collapse everything into the single v1.0 systems-overview entry (see
   VERSION RESET at top) and set GAME_VERSION='1.0'.
10. Ship checklist for 1.0: four pillars built (arc section below) → notes
    collapse + version set → full validate/smoke/baseline regen as needed →
    Dakk's go → deploy.

## THE ARC IS v1.3 (Dakk, 2026-06-11 late): "no one else has played yet —
## we're keeping this for v1.3, not an expansion"

## DAKK'S 1.0 ROUND (2026-06-11 ~10:25 PM) — RECORD FIRST, BUILD NEXT SESSION

1. **Element graphics**: Cargo currently shows TEXT chips (the UI spot is the
   🧰 Cargo button, right rail, appears after first mine; labeled "Cargo
   Hold" + "Research Bench"). TODO: per-element ICONS — procedural SVG mini-
   crystals/ingots/flasks tinted per element family (metals silver/gold,
   ices cyan, volatiles amber, exotics iridescent) — same recipe style as
   species portraits; no rasters needed.
2. **ART DIRECTION (Dakk's vision: D&D Monster Manual / MTG / Pokémon-grade
   fantasy art, still meshing with the space-exploration look).** Agreed
   assessment of the technical reality:
   - Runtime AI generation: impossible (offline, deterministic, no server).
   - Infinite procedural species can never each have hand/AI raster art.
   - THE PLAN (3 tracks): (a) **painterly SVG upgrade** for ALL portraits —
     silhouette-first composition, layered gradients + rim light + SVG
     turbulence/noise filters, dramatic poses, decorated card frames per
     rarity (the foil treatment already leads here); (b) **curated raster
     pack for FIXED entities** — the Fifty Paragons, guardian archetypes,
     class crests, element icons (~100-250 images, AI-generated OFFLINE by
     Dakk at his leisure, art-directed to one style bible, shipped as WebP
     in an assets/ folder next to index.html in the site repo — breaks
     single-FILE purity but keeps offline via cache manifest; or embedded
     base64 if total stays <2-3MB); (c) hybrid card design: procedural
     portrait inside hand-designed painted FRAMES per rarity/class (frames
     are where MTG-feel mostly lives). Start with (a)+(c), add (b) when
     Dakk generates the pack.
3. **CLASS SYSTEM + XP/LEVELS (Dakk pasted a ~150-entry FANTASY CREATURE
   CLASS LIST — stored verbatim in tools/class-list.txt).** Design agreed:
   - Every fauna rolls a CLASS (deterministic from genome; rarity-weighted
     so legendary classes like Worldbreaker/Avatar/Chosen One are summit-
     band only). Class shows on the specimen card as a crest/badge.
   - Classes grant INNATE abilities that proc at much higher rates than
     the matrix verbs; class ability KITS map onto the existing hook
     vocabulary + matrix verbs (e.g., Berserker = execB-inverted "stronger
     when hurt" hook; Paladin = mend+aegis kit; Assassin = ambush+stun).
   - CROSS-BREEDING: hybrid offspring can fuse parent classes into hybrid
     classes (Spellsword from Mage×Fighter etc.) — fusion table, not free
     text; mutation chance for off-list surprises.
   - **XP & LEVELS: power through WINS, not stat stacking** (Dakk's core
     rule). Creatures gain XP from duels/conquests/guardian fights; levels
     unlock MORE abilities (multi-ability kits at high level) rather than
     inflating stats; XP bar on the specimen card. Save: per-creature xp
     in genome (like brood/fed, capped, travels stripped in CFB? decide:
     levels are YOUR creature's story — strip on share like injuries).
   - Then ANOTHER full balance pass: extend tools/balance-sim.js to sim
     class kits × levels; band 42-58 vs the field; legendary classes may
     exceed via rarity gating (they're rare, not common-strong).
4. **Tutorial overlay bug (screenshot 10:24 PM)**: the guidance card sits ON
   TOP of the survey card; the step target (+ Add to Star Atlas) scrolls
   under it. FIX: during training, #panel obeys --tut-bot like dialogs do
   (body.training #panel top override + max-height) so the survey card
   always opens BELOW the guidance card. (Dakk's alt idea — tap-to-front
   z-swap — rejected as fiddly; the yield-below pattern already exists.)
5. **? button → version popover**: tapping ? shows build version + a "Open
   the Guide" link (Guide stays locked during training; version always
   visible). Replaces ?-opens-guide-directly.

**ALL FOUR PILLARS BUILT 2026-06-11/12 (b0cd6dd, d33b92d, 091be62) PLUS the
CLASS/XP SYSTEM, discovery records, witness log, element glyphs (0e5523e).
NOT DEPLOYED — Dakk wants the full 1.0 held until his go.**
JOB 1 (painterly pass) BUILT 2026-06-12: every portrait now staged (aura,
ground shadow, feTurbulence displacement texture, rim light, vignette —
pure SVG, deterministic) + etched rarity frames with corner glints on
specimen cards (mid/gold/prism/deep/summit bands). SIGS hints rewritten as
the Pathfinders' field notes (Prism = the discovery they died short of).
**JOB 2 — FUTURE UPDATE (post-1.0), Dakk's call:** the curated AI-raster
pack for fixed entities (Fifty Paragons, class crests, element icons,
guardian archetypes). First deliverable when Dakk opts in: a one-page
STYLE BIBLE for his image generations; then assets/ wiring with SVG
fallback. NOT in 1.0.
BUILT 2026-06-12 (980a122): **THE CHRONICLE** — D&D duel narration (seeded
narrator, severity verbs, named arts, first strikes/executes/thorns/burn
ticks/staggers, death lines), closing per-side statistics ledger, and a
"Share battle log" button (plain-text chronicle via the share box; fights
not saved — share-like-a-screenshot per Dakk). runDuel log enriched;
OUTCOMES byte-identical (rng untouched).
**OPEN ART DECISION (Dakk leaning, not confirmed): habitat backdrops.**
Recommended hybrid: procedural habitat vignette (sky tinted by biome heat,
horizon, 2-3 silhouette terrain layers, props from FA_HABITAT's 19
habitats + flora/fungi/microbe settings) UNDERNEATH the existing
stagecraft lighting (shadow grounds the creature IN the scene). Dakk to
say go; portraits unchanged until then.
REMAINING before ship: (a) folding the remaining ~60 class-list names into
the CLASSES table (pure data; needs a baseline regen); (b) element icons
as real mini-SVGs (colored ◆ glyphs shipped as v1); (c) Dakk's on-device
contrast sweep + art-taste review of the painterly pass; then the SHIP
steps: collapse RELEASES into the single v1.0 systems-overview entry, set
GAME_VERSION='1.0', full validate/smoke/balance, deploy on Dakk's word.
**Design principle added by Dakk: progression must keep players engaged
without EVER feeling like an eternal grind — pacing over padding; every
unlock should change what you can do, not just add a number.**

1. **Vast collection system** — collect TYPES, not individuals: a
   binder of deterministic slots (kingdom × realm × rarity × body plan ×
   ability theme…) that procedural specimens FILL — same slots for every
   player, different cards. Plus curated SETS with rewards ("The Five
   Flavors" = one flora per stat; "The Apex Court" = a guardian of each
   summit grade) and ~50 named PARAGONS — guardian-style one-of-a-kind
   creatures at fixed deterministic locations, silhouettes until found.
2. **Ability expansion + balance harness** — theme (11) × archetype
   (~16 D&D verbs: DoT, stun/slow, shield, lifesteal, thorns, shred,
   execute, ramp, cleanse, gamble…) × rarity-scaled magnitude = hundreds of
   generated abilities ("Emberfang Rebuke III"). Flora get botany
   PROPERTIES instead: medicinal / toxin / fertilizer (breed-odds boost) /
   preservative (injury resist) / catalyst (research speed — ties into
   minerals). Cross-breeding: child inherits one parent's theme, rolls the
   other's archetype, mutation chance; hybrid magnitudes can exceed natural.
   BALANCE EMPIRICALLY: runDuel is deterministic — build a node harness
   that sims archetype×archetype matchups en masse; tune the archetype cost
   table until win rates sit in 45–55%. Budget law stays 170+tier*38.
3. **Minerals & elements** — lifeless worlds get deterministic
   element profiles by type (lava→S/Fe/W, ice→H2O/CH4/He-3, metal→Pt
   group, gas→H/He), world rarity tier boosts rare yields. ~40 real
   elements + a few exotics; "all elements" is a binder page. UI: a 🧰
   Cargo button in the right rail (matches Compendium/Atlas pattern) that
   only APPEARS after the first harvest — keeps early mobile UI clean.
4. **Tech tree + ships + travel** — parallel to Prime Codex, never
   replacing it: Codex = explorer's legend (win track), tech = engineer's
   capability track. Materials + stardust + catalyst flora → research →
   scanner/drive/hull ladder as named ship classes (chemical → fusion →
   antimatter → warp). Distance travel: the shipped hyperlane animation is
   the travel presentation; duration = distance ÷ drive tier, CAPPED ~3–8s
   (flavor, never boredom); "too far" = needs a better drive. Gives REGIONS
   a second axis: Signatures open the frontier, ships make it reachable.
   CAUTION agreed: free zoom-anywhere is the game's soul — travel friction
   must never gate looking, only jumping. Per Dakk's no-grind principle:
   research costs tuned so each tier lands while the previous one still
   feels fresh.

Also folded into the v1.3 arc (was v1.4 runway): planet/world abilities
alongside animal ones; guardian-specific battle intros / unique guardian
abilities; "first discovery record card" share keepsake (pairs with foil
cards); cosmic-events witness log.

## Later / ideas parking lot

- Playwright smoke on a real browser engine (jsdom covers logic, not rendering).
- Duplicate Prime Codex backdrop-close listener (harmless; tidy someday).

## Working agreements (summary — full rules in CLAUDE.md)

1. Loop: `extract.js` → edit `main.js` → `validate.js` → `smoke.js` →
   commit/push → `deploy.js` (deploys at Dakk-approved milestones).
2. Never regenerate `tools/baseline.json` to make a failure pass.
3. Version bumps & release notes: CLAUDE.md rule 7. Suggest a bump when the
   unreleased pile feels substantial.
4. Saves are sacred: new fields optional with safe absent-defaults.
