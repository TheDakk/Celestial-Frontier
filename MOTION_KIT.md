# Celestial Frontier Motion Kit

Motion direction and animation contract, PROPOSED version 1, 2026-09-12. Companion to ART_KIT.md. One motion hand for the whole universe: every creature, plant, ship, effect, panel and reveal moves by the same rules, and every rule is compiled from game data by one interpreter. Nothing is animated per creature by hand.

Each section is plain text inside a fenced block. Sections 1 and 2 are frozen once approved; section 3 is filled by the compiler from the resolved-anatomy record; sections 4 to 7 are the closed action, timing, secondary-motion and staging vocabularies.

## 0. How to use

```text
CELESTIAL FRONTIER - MOTION KIT
motion_id: frontier-motion   |   proposed v1, 2026-09-12   |   one hand, compiled

Every motion recipe is assembled in this order:
    MOTION LOCK -> FROZEN MOTION -> BODY CARD -> ACTION -> TIMING
    -> SECONDARY -> STAGING -> BUDGET

Sections 1 and 2 are identical in every recipe and are never reworded.
Section 3 (BODY CARD) is emitted by the compiler from the resolved-anatomy
record of the winning painter owner; nobody types a body card. Section 4
picks ONE action from the family template's library. Section 5 supplies the
timing scaled by the body card. Section 6 adds secondary motion by material.
Section 7 supplies the staging for the surface (arena, landfall, shipyard,
map, panel). Section 8 is the runtime budget.

Motion is deterministic: pose curves, timings and secondary phases are
derived from the recipe seed and the body card. The playback clock advances
animation; it never chooses what the animation is. A recipe replays
identically on any device at any frame rate.

ONE INTERPRETER. Recipes are compiled from game data and applied verbatim.
Nobody hand-edits a pose for one creature. A creature that looks wrong is a
template or body-card defect, fixed for its family, never for the row.
```

## 1. Motion lock

```text
Paste in every recipe. The visual references for motion quality are the
sixteen-bit turn-based battles in the spirit of Chrono Trigger and Final
Fantasy VI, read as principles rather than frames: strong readable key poses,
smooth interpolation between them, anticipation before every action,
overshoot on arrival, settle after, weight in every landing, and a turn
rhythm that is quick and legible. No franchise animation, sprite or
choreography is copied. The look of every frame is governed by ART_KIT.md;
this kit governs only how things move.
```

## 2. Frozen motion

```text
Paste in every recipe. Never reword once approved; a materially different
feel is a new motion kit with a new id.

  Smooth, weighty, hand-animated motion at sixty frames per second, made of
  strong key poses joined by eased interpolation. Every action has
  anticipation, a fast main beat, overshoot on arrival and a settle. Mass
  decides timing: heavy bodies start slow and land hard, light bodies snap.
  Secondary parts lag their driver and follow through: tails, ears, fins,
  fronds, cloth and membranes never stop on the same frame as the body.
  Contact is honest: feet plant, weight shifts, nothing hovers or slides.
  Motion reads in silhouette at a glance. Never linear, never stepped, never
  floaty, never physics-simulated jitter, never mechanical repetition; idle
  cycles breathe at non-integer ratios so two creatures never move in sync.
  Easing family: ease-out for arrivals, ease-in for launches, back-out for
  overshoot, sine-in-out for breathing. Named, fixed, shared by every
  surface of the game from battles to panels.
```

## 3. Body card

```text
Emitted by the compiler from the resolved-anatomy record (ownerId,
speciesVisualKey, familyTemplateId, landmarks, bone lengths, materials). It
never reads raw genes for named Earth species; it reads the painter's
record. Source vocabularies: family routing (proceduraloverrides.ts, hdart),
FA_SIZE, FA_LOCO, FA_SKIN, FA_LIMBS, realms (speciestraits, genome).

  BODY CARD - <speciesVisualKey>
    Template: <one of the 14 fauna or 2 plant templates in section 4>
    Mass class: <from FA_SIZE: tiny .70, small .85, medium 1.00, large 1.20,
       huge 1.40, titanic 1.60; multiplies every duration in section 5>
    Locomotion: <FA_LOCO value; selects the approach gait in section 4>
    Realm: <land | aerial | aquatic | amphibious | gas-giant; selects medium
       damping and ground rules>
    Materials: <FA_SKIN per part: scaled, furred, chitinous, slick, plated,
       warty, feathered, translucent, crystalline; selects section 6 rules>
    Parts: <part list with pivots and bone lengths from the record>
    Secondary parts: <tail segments, ears, fins, wings, antennae, fronds,
       with lag order from the record>
    Weapons: <natural weapons named in the record: bite, claw, gore, tail,
       sting, peck, headbutt, constrict, spit; selects the melee action>
    Luminous: <true/false; adds pulse in section 6>
    Bounds: <the template's joint limits; poses outside are clamped and
       flagged, never invented>

  A body card with a template the record does not support compiles to the
  whole-portrait fallback and says so; it never guesses a skeleton.
```

## 4. Action library

```text
One library per family template; every action is a set of key poses in
joint space relative to bone length, with a timing template from section 5.
Templates: quadruped, hopper, biped-bird, fish, insect, arachnid, serpent,
myriapod, radial, cephalopod, flyer-membrane, primate, plant-woody,
plant-herb.

FAUNA ACTIONS (all templates unless noted):
  idle          breathe, weight shift, one secondary flick; loops at a
                seeded non-integer period
  alert         head up, ears/antennae forward, one-beat hold
  approach      the run-up; gait from Locomotion: walk, trot, gallop, hop,
                slither, crawl, swim, jet, fly, glide, roll, cling-crawl,
                drift; feet plant on the fighting-ground line
  melee         from Weapons: bite (jaw open, head drive), claw swipe
                (foreleg arc), gore (head dip and lift), tail whip (chain
                lash), sting (abdomen curl), peck, headbutt, constrict
                (serpent coil), spit (head recoil); each has anticipation,
                strike with a one-frame smear, recovery
  cast          rear or rise, hold, release toward target; used for ranged
                and themed abilities with the Effects sequence
  hit           head back, body compress, one-step stagger, settle
  dodge         quick sidestep or hop back, return
  faint         collapse along the template's fall path, no bounce
  victory       rear, hop or head toss, settle to idle
  tame          approach player, lower head, settle (capture and bond)
  feed          head down, two chews, head up
  travel        world-scale movement for landfall residents (later): the
                approach gait at idle tempo

PLANT ACTIONS (plant-woody, plant-herb):
  sway          wind-driven chain sway by weather strength
  disturb       recoil when a creature passes or an effect lands
  harvest       shake, item detaches, settle
  grow          scale-in with overshoot (Compendium reveal only)

Every action's key poses are authored ONCE per template and reviewed on the
template's proof creature plus two reuse controls of different proportions.
```

## 5. Timing

```text
Base durations at mass class 1.00, milliseconds. Multiply by the mass class.
Never below 60 percent of base on tiny bodies; never above 200 percent.

  idle period      2600 to 3400 (seeded per creature, non-integer ratio
                   against any other creature on stage)
  alert            220
  approach         420 total, distance-independent (speed scales)
  melee            anticipation 140, strike 90, smear 1 frame, recovery 260
  cast             rise 180, hold 120, release 90, settle 220
  hit              recoil 110, stagger 160, settle 180
  dodge            120 out, 160 back
  faint            520
  victory          600
  return           380
  hitstop          70 on the target and attacker, scaled by the ATTACKER's
                   mass class, capped 140
  flash            two frames white on the target, then 120 fade
  shake            amplitude 6 px at mass 1.00 for 180, decaying
  damage number    pop 90 (back-out), rise 420, fade last 160
  timing bar       fills in game-owned turn time; the bar's motion uses
                   ease-out on the final 10 percent so a turn reads as ready

Frame rate: 60 on desktop, 30 budget on phone; all curves are time-based,
never frame-counted.
```

## 6. Secondary motion by material

```text
Applied automatically from the body card's materials. Never authored per
creature.

  furred        soft lag .08 s on tail and ruff, slight settle on landing
  feathered     flutter on wings and tail fan, .06 s lag, crest lift on alert
  scaled        firm; tail lag .05 s; no jiggle
  slick, warty  squash 6 percent on landing, stretch 4 percent on launch
  chitinous     rigid segments, sharp stops, antenna quiver .04 s
  plated        rigid, heavy settle, no stretch
  crystalline   rigid, a one-frame glint on strike (painted highlight shape,
                no glow)
  translucent   wobble .12 s on every stop, damped in two cycles
  luminous      slow pulse 1.8 s on idle, quick pulse on strike; painted as
                shape change, never a bloom
  fronds/leaves sway lag by segment from base to tip, .05 s per segment

Medium: aquatic actions are damped 25 percent and drift on settle; aerial
actions hover with a 1.4 s bob; gas-giant floaters drift continuously.
```

## 7. Staging by surface

```text
ARENA (battle): the whole arena is alive: plate life as in LANDFALL runs
  behind the fight at reduced density; side view; combatants at one third to one half of frame
  height on the left and right thirds, facing each other on the shared
  fighting-ground line; parallax rates far .10, mid .50, near 1.20 of the
  run-up displacement; no camera moves. Turn sequence: timing bar ready ->
  command and target cursor -> approach -> action (melee or cast with the
  Effects sequence: launch at attacker, travel, impact at target) ->
  hitstop, flash, shake, damage number -> target hit or dodge -> return ->
  idle. Both combatants idle throughout. Victory or faint ends the turn.
LANDFALL (world life): nothing in the world is static. Plate life is
  deterministic layered motion on the painting: rain and snow streaks at the
  card's density, mist and dust drift, water shimmer and ripple, foliage sway
  by weather strength, distant fliers or swimmers as small silhouettes, light
  flicker for luminous flora. Resident life uses the family templates: breathe,
  weight shift, flick, head turn, plant sway and disturb; travel (the approach
  gait at idle tempo) only after a family template is proven. Everything is
  seeded from the recipe so the same landing replays identically.
COMPENDIUM: portrait grow on reveal; idle breathe; page transitions use the
  panel easing.
SHIPYARD and SHIPS: launch (anticipation dip, ease-in rise), dock (ease-out,
  settle bounce 3 percent), jump (hold, stretch 8 percent, snap), engine
  idle shimmer painted as shape; the four ship stages scale timing by hull
  mass class small .85 to large 1.30.
STAR MAP and TRAVEL: pan and zoom ease-out; arrival settle; comets and
  orbits keep their existing deterministic motion.
PANELS and UI: open ease-out 220, close ease-in 160, list items stagger 18
  per row up to 8 rows; no bounce on chrome; the same easing family as
  everything else so the interface belongs to the world.
LOOT and INVENTORY: pickup pop 90 back-out; reveal flourish scaled by rarity
  tier (Common a settle; Rare a lift and settle; Legendary a lift, hold and
  settle with the item's painted highlight), never a glow ring; inventory
  drag with .06 s lag and settle.
```

## 8. Budget

```text
  Per rigged creature on stage: at most 40 parts, 32 bones, one atlas
  (2048 square desktop, 1024 phone), under 2 ms update at 60 fps desktop,
  under 4 ms at 30 fps phone. Two rigged combatants plus one effect sequence
  and three parallax plates must hold frame rate on the phone tier.
  Effects: at most 3 phase textures plus an emitter of at most 200 particles.
  Any recipe over budget compiles to the reduced variant (fewer secondary
  parts, no emitter) and records it; never to a frame drop.
```

## 9. Production discipline

```text
  ONE INTERPRETER. The compiler emits every recipe from the body card and
  the template library; nobody edits a clip for one creature.
  HASH EVERY RECIPE. Store the recipe hash with every capture.
  REVIEW CAPTURES, NOT LOGS. Every template action is reviewed as a
  ten-second capture at native size beside the previous accepted capture.
  Mechanical gates (no tears, feet planted, budget) are necessary; only the
  viewed capture is acceptance.
  NEGATIVE CONTROLS. A template must refuse a body it does not fit; a
  corrupted body card must fail; a clock read inside compilation must fail.
  FALLBACK IS LABELLED. Whole-portrait staging is allowed only as a labelled
  fallback and never counts as an articulated result.
  NEVER OVERWRITE AN ACCEPTED TEMPLATE. Retire under its date and reason.
```

## 10. Before any volume

```text
  a. Nick approves sections 1, 2, 5 and 6 as written or amended.
  b. Quadruped template proof: the Civet, then reuse on the fox reference
     and one procedural quadruped, staged in the Earth temperate arena with
     the Wild sequence. Ten-second captures.
  c. Then hopper, biped-bird, fish, insect, in that order, each with its
     proof creature and two reuse controls.
  d. Then landfall world life (plate life first, then resident idle life),
     ships, panels, loot and Compendium motion from section 7.
  e. Then freeze sections 1, 2, 5, 6; templates grow only by adding a
     template with its own proof.
```
