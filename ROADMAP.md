# Celestial Frontier — Roadmap & Session Handoff

## ▶▶ NEXT SESSION AGENDA

1. NICK'S ON-DEVICE PASS of Phase 1 iterations 2+2b+2c (below): flip
   Settings → Graphics → Landing view → HD, then land widely — lava,
   ocean, winter, dusk, night. Also try the new card ✕ + drag (those
   ship in CLASSIC too). His screenshots drive iteration 3.
2. GALAXY-VIEW STARS (Nick's screenshot, 2026-07-17: "it's bland right
   now" — sparse colored dots, one supernova remnant): CONFIRMED as
   v1.3 PHASE 3 (system dressing: belt rocks, comet tails, ringed
   giants, phase-lit planets) + PHASE 4 (dust-carved galaxy sprites) +
   an in-galaxy star-field richness pass (fainter deep-field stars,
   color temperature spread, clustering along arms) — add that pass to
   Phase 3's list; the vista work deliberately came first.
3. Remaining Phase 1 candidates: per-world biome variety inside a type;
   aurora over ICE worlds (surface draws them; the vista's nightize
   grade doesn't yet).
4. Then PHASE 2 — creature portraits + true gene inheritance.
5. Mechanics: extract.js first; the hd flag stays default-Classic and
   UNDEPLOYED until Nick's word — BUT NOTE: weather spells, the card
   ✕/drag, and the text-size coverage fixes are NOT flag-gated (they
   ride any deploy; RELEASES[0] bullets written).

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
