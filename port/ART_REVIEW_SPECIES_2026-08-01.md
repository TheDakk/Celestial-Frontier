# Species Art Review — the full-catalog comparison vs real-life counterparts

**Date:** 2026-08-01 · **Reviewed:** 1,254 native 440×440 portraits (the verbatim v1.8.9
hdart engine, exported by `npm run speciesexport`) — 631 Earth fauna · 334 flora · 27 fungi ·
22 microbes · 240 procedural. Method: three independent art-director review agents over the
full-size exports (45 fauna judged individually, all 27 fungi, 30 flora across every growth
habit, 26 procedural across kingdoms×heats, 12 microbes). **Status: FINDINGS — every proposed
fix is a DEVIATION awaiting Nick's approval (parity law). Reconvene with Nick's own system
run, then pick the slate.**

## The headline

The engine's painterly language is coherent (rim-lit figurine, grounding shadow, vignette)
and its best pieces prove it can nail a species when it commits to **one defining silhouette
feature** (Elephant's trunk+tusks, Owl's face-on disc eyes, Chameleon's casque+spiral tail,
Scorpion's arched stinger, Sunflower, Sword Fern, Corn, Venus Flytrap, Cattail). The upgrade
lever is NOT style — it is **per-species differentiation**: defining-feature guarantees,
pattern legibility, a contrast floor, and killing three mono-template collapses.

## Per-kingdom verdicts

- **FAUNA — coherent set, identity swallowed by templates.** One quadruped mega-template
  serves cats/bears/foxes/rhinos/hippos/deer (Jaguar≈Leopard≈Cheetah; Rhino and Hippo are
  pixel-siblings). Birds share one template with a plank for a folded wing — **no portrait in
  the catalog shows a wing silhouette** (leaks to insects: wingless Dragonfly). Aquatics
  collapse to one generic fish (Blue Whale ≈ Dolphin); shark caudal fins point straight DOWN.
  Named coat patterns almost never land (no cheetah spots, no giraffe patches; Tiger/Zebra
  stripes are the exceptions that work). Famous colors often wrong (grey Polar Bear, brown
  Tiger). Weakest: Camel 1/5 (no head/neck read) · Moose · Rhino · Hippo · Dragonfly ·
  Blue Whale · Komodo · Cheetah · Panda · Polar Bear.
- **FLORA — a genuinely generative system, the port's best kingdom.** ~20 distinct habit
  templates correctly assigned (canopy/bottle/weeping trees, two conifer styles, palm,
  rosette succulents, cactus pads, canes, fern, vines, cereal, cattail, pitcher, flytrap,
  lily-pad). Two let-downs: ALL flower heads collapse to one 8-petal daisy (Tulip=Poppy=
  Dandelion), and hue is roll-driven not species-driven (purple sunflower leaves, red
  dandelion, teal tulip).
- **FUNGI — 27 recolored clones of ONE mushroom silhouette.** No shelves (Turkey Tail/
  Bracket/Shelf/Chicken-of-the-Woods all fail as one), no coral branching, no Earthstar star,
  no Lion's-Mane shag, no Morel honeycomb, no thin Enoki; Yeast/Mold/Mildew drawn as capped
  mushrooms (categorically wrong).
- **MICROBES — the named layer is not driving the art at all.** All 22 are the identical
  nucleated-bubble cluster recolored. Tardigrade — the most iconic body plan in the whole
  catalog — is an invisible dark cluster. Paramecium/Diatom reduced to bubbles.
- **PROCEDURAL — clears the Phase-5 "three radically different archetypes" bar**, almost
  entirely on fauna: lateral fish · metaball quadruped · jellyfish-radial · urchin-sunburst ·
  slug are genuinely distinct. But: heat (0/1/2) is only a palette/contrast lever, never a
  design-language lever; fungi/microbe kingdoms are mono-archetype; **cold/temperate flora
  has a blur/defocus bug** (out-of-focus smudges — looks like an errant LOD pass, not
  intent); one flat-vector conifer violates the HD-engine law.

## The cross-cutting systemic five (the upgrade slate, highest leverage first)

1. **D-ART-1 · Defining-feature guarantee.** Per-species/family silhouette params (trunk,
   hump+neck, horn vs tusk, palmate antlers, wing shapes folded+spread, fluke orientation,
   bracket habit, honeycomb cap, 8-legged tardigrade chub). One folded-wing shape alone fixes
   a dozen birds; one bracket template fixes four fungi.
2. **D-ART-2 · Pattern & color legibility.** Spotted coats that read (cheetah/leopard/
   giraffe), species-true hues for the famous ones (white polar bear, orange tiger, yellow
   sunflower) — species-keyed palette overrides atop the roll.
3. **D-ART-3 · Contrast floor.** A minimum value/rim separation against the near-black
   vignette (Moose/Chimp/Earthstar/Tardigrade currently vanish) + a consistent rim-light hue
   policy (today: arbitrary pink/orange/lime per portrait).
4. **D-ART-4 · Break the three mono-templates.** Fungi silhouette families (cap/bracket/
   coral/star/shag/pin), a flower-head family beyond the daisy (cup/bowl/puff/star), microbe
   body plans (ciliate slipper, diatom shell, tardigrade).
5. **D-ART-5 · Procedural depth.** Make heat a DESIGN lever (not just palette), fix the
   cold-flora blur bug (likely a real code bug, not art), retire flat-vector intrusions.

## Strongest work (the bar the rest should meet)

Fauna: Elephant · Owl · Chameleon · Scorpion · Seahorse · Jellyfish · Kangaroo · Peacock ·
Crocodile. Flora: Sunflower · Sword Fern · Corn · Venus Flytrap · Cattail · Pitcher Plant ·
Prickly Pear · Coconut. Procedural: fauna-h2-s18 (long-neck quadruped) · flora-h2-s3 ·
fungi-h2-s6 (bioluminescent trio) · fauna-h2-s9 (urchin) · fauna-h0-s11 (jellyfish).

## Standing instruments

`npm run speciesaudit` (1,254 painted, exit-1 on misses, 5 contact sheets) ·
`npm run speciesexport` (full-size zips for external review). Any approved deviation gets
before/after sheets + a re-run of both before it lands.
