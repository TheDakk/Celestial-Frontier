# Review: Earth temperate arena plates and the Wild effect sequence (kit v4.2 proof)

Date: 2026-09-12. Reviewer: Claude, read-only. Source: openai/mac 75a5c4a4, `audits/ARENA_EFFECTS_V42_PROOF_20260912/`. Viewed at native size: FAR, MID and NEAR masters, the keyed composite, the three Wild phase masters and their keyed review, the anchors JSON, the intake numbers and the prompts.

## Arena: ACCEPT as the Earth temperate arena template v1

- **FAR** is in the hand: rain, mist, layered ridges, river at the horizon, Living Worlds light. Accept.
- **MID** is a broad wet riverbank band painted on the key with the ground line at 0.78 and clear stands at both thirds; the composite over FAR reads as one place with one light. Accept, with one intake pass on the 190 unresolved fine-foliage edge pixels at the left and right margins (a wider despill neighbour search, on copies only, no repaint).
- **NEAR** is a quiet stone edge on the key occupying the lower fifth rather than the lower tenth; both stands are clear (alpha 0 at 0.78), so it is acceptable for v1 and gives stronger parallax. Accept.
- Delivered sizes (1672×941) are above the runtime floor under the v4.1 rule. Accept.
- The kit v4.2 text and the compiler-derived arena recipe (seed from battle context, ground line recorded) are as approved.

## Wild sequence: ACCEPT the shapes and phases, REPAINT once for theme identity

The launch, travel and impact are well painted, consistent in material, and read as a three-claw rake with a burst. The problem is that it reads as **Frost**. The compiler did exactly what the kit says: it translated the game's Wild colour, `#9fb6d6` (`combatcore.verbatim.js:95`), to pigment, and that slate blue sits next to Frost's `#8fd6ff`. This is a data collision, not a painting error, and it will repeat for every Wild ability unless the class gains a material vocabulary.

Recommendation (kit v4.3, one table, Nick approves): a closed **theme material table** for the Effects class, in the kit's own "name the object, never the idea" spirit, where the game's theme hex is the accent and the material carries the identity:

| Theme | Material and shape vocabulary | Accent (game hex) |
|---|---|---|
| Fire | flame tongues, embers, char, heat shimmer as shape | #ff7a4a |
| Frost | ice shards, rime, frozen mist, crystal shatter | #8fd6ff |
| Storm | forked arcs, charged dust, cloud rupture | #ffe06a |
| Tide | water sheets, spray, foam crest | #5fd0c8 |
| Stone | rock shards, grit, cracked ground | #caa06a |
| Venom | droplets, spatter, corroding film | #9fe06a |
| Void | torn dark, inhaled debris, collapse ring | #b58cff |
| Sand | grain streams, scour, dune spill | #e8c878 |
| Chem | fizzing foam, reactive spray, etched surface | #c0ff5a |
| Psionic | concentric ripples, warped air, snap ring | #ff9fe0 |
| Wild | claw rake, fur tufts, torn leaves, kicked earth, wind streaks; warm ochre and earth tones | #9fb6d6 as a sheen only |

Do not change the game's theme hexes: they are domain presentation data and altering them is not worth the determinism review. With the table, repaint the Wild sequence once; require common-canvas registration (same canvas, same origin and contact anchors across phases) in the prompt, and keep the per-phase anchor JSON as the runtime fallback.

## Tooling correction (mine)

`@pixi/particle-emitter` 5.0.10 declares Pixi peers below 8 and the game is on Pixi 8.19.0. My recommendation was wrong for Pixi 8. Remove the package. Write a small seeded emitter on Pixi 8's own particle container (or plain sprites if that class is unavailable in 8.19): deterministic from the recipe seed, which the Motion Kit requires anyway. No peer overrides, no second renderer.

## Next

After Nick approves the table: repaint Wild (three phases); then the Civet versus Platypus parts-rig turn in this arena with the Wild sequence and Motion Kit timings; ten-second captures for Civet, fox and the procedural quadruped.
