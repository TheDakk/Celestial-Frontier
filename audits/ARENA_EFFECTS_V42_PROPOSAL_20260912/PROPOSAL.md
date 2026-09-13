# Art Kit v4.2 proposal — Arena profile and Effects class

**PROPOSED; NOT APPLIED. Nick's approval is required before painting.**
The active ART_KIT.md remains unchanged, including the frozen paragraph and4E turnaround.
The exact patch contains two additive blocks only. Existing fences, shared negatives,
reference locks and size rules are preserved byte-for-byte; version/contents bookkeeping
can accompany adoption, with no rewording of existing prompt blocks.

### Arena scene profile

```text
WHAT (iii) ARENA: a procedural combat environment assembled from a biome-family
  template and the same compiler-filled system card and frozen style as its
  biome plate. The template is reusable; the battle context supplies its seed.

ARENA - SUBJECT SLOT, in this order:
  source biome family and defining landform; fighting-ground material and
  sheen; system-card light, mineral palette, atmosphere, weather and time of
  day; the home world's physical signature; the requested depth plate
  (far, mid or near). No combatants are painted into the arena.

ARENA - LAYOUT (paste):
  A wide, side-view painted fighting stage at low eye level, with a flat,
  continuous fighting-ground band and clear combatant stands at the left
  and right thirds. Compose for two opposing creatures, each one third to
  one half of frame height. Keep their silhouettes and run-up path clear.
  Put atmospheric depth behind the fight, with no competing foreground.
  Use one shared horizon, ground registration and system-card light direction
  across all three plates. Every shadow agrees with that light.
  FAR: distant landforms, sky and atmosphere behind the combatants.
  MID: the fighting ground and restrained biome landmarks behind the stands.
  NEAR: a quiet ground edge that supports parallax without covering the stands,
  paws, effects or fighting path. Parallax must not reveal gaps between plates.

ARENA - OUTPUT:
  Scene block, three separately painted 2560 x 1440 masters per biome-family
  template: far, mid and near, each with its own brief; never one image sliced.
  The masters remain opaque scene paintings. Matching mid/near extraction
  masks are retained as separate intake data for layered composition; never
  paint a checkerboard or imitation transparency into a master.

ARENA - NEGATIVE ADDITIONS:
  No characters, resident creatures, scale figures, baked-in attack effects,
  UI, timing bar, labels, steep or broken fighting ground, competing foreground,
  obstacles on the fighting path, inconsistent perspective or mismatched light.
```

## 4K. Effects (cut-out sequences)

```text
WHAT: painted ability-theme effect sequences with launch, travel and impact
  phases, using the unchanged frozen style. The source theme keys are:
  fire (Fire), frost (Frost), storm (Storm), tide (Tide), stone (Stone),
  venom (Venom), void (Void), sand (Sand), chem (Chem), psionic (Psionic),
  wild (Wild). Use only the theme and ability selected by game data.

SUBJECT SLOT, in this order:
  source ability theme and the physical action it represents; material and
  palette; sequence phase (launch, travel or impact); the phase's strong shape
  and direction of motion; its origin or contact anchor and relative scale.
  Keep the same painted material, palette, direction and scale relationship
  across the sequence. A melee travel phase may be a short directional sweep;
  it need not invent a projectile for an ability that does not have one.

ACCURACY:
  Must include: a readable theme-specific effect silhouette in each phase,
  with shared anchors and consistent scale for runtime sequencing.
  Must exclude: creatures, body parts, scenery, ground, cast shadows, text,
  symbols used as labels, UI and a baked-in target.

LAYOUT (paste):
  One isolated phase of the named ability effect, painted as a crisp-edged,
  fully opaque shape against the flat pure magenta key (#FF00FF). Keep the
  entire shape within the frame with room for its motion. Paint energy,
  spray, dust and impact as bounded shapes and grouped marks in the frozen
  hand, with no halo or soft haze bleeding into the key. Keep the canvas size,
  registered origin/contact anchor and scale consistent between phase images.
  Runtime placement and tweening connect the phases; do not paint a battle
  scene or generate a contact sheet.

NEGATIVE ADDITIONS:
  No magenta or pink within the effect, soft transparent fringe, photographic
  particles, lens flare, glowing outline, baked motion blur, lettering,
  frames, scenery, body parts or duplicate phase images in one output.

OUTPUT:
  Cut-out block, 1024 square per phase master, subject to section 5's existing
  authoring-target and runtime-input admission rule. Deliver launch, travel
  and impact as separately named images; retain their ordered phase/anchor
  metadata. Any extra key images use the same registration. Review sheets
  and runtime effect atlases are assembled from these masters after intake.
```

## Compiler and staging contract — recorded direction, not kit prompt prose

- Arena recipe: biome-family template + compiler-filled system card + a versioned seed
  derived only from stable battle context. Persist the resolved recipe; never derive arena
  identity, host selection or variation from a clock, a timing-bar click or frame timing.
  Source biome-family keys decide templates; no invented fixed count or new biome taxonomy.
- Wild encounter: use the wild creature's home world. Guardian: use its lair and the system
  card's One signature. Duel: choose the first host deterministically from the battle seed,
  then alternate host by round; do not re-roll ownership on each round.
- Derive lighting, palette, weather and time of day from that resolved home's system card.
  Retain template plate/mask hashes, card, host/round, seed and compiler version in the recipe.
  Cache arenas through the existing originals lifecycle with tier/pipeline provenance, so
  replay reuses its original and unrelated recipes cannot inherit it. Phone composes template
  plates and card lighting with no finisher; desktop may finish. This is a requirement for
  the future compiler, not storage/delivery implementation authorized in this proposal batch.
- Side-view combatants face each other at one third to one half of frame height. Use parallax
  on run-ups. Run-up <0.5s; attack0.5–0.75s; hit reaction about0.3s; return <0.5s. Brief hitstop,
  flash, short shake, damage number and quick timing bar are runtime presentation, not artwork.
  A timing-bar scoring or damage rule is not specified by this art proposal.
- Parts rig: strong shared key poses with easing, anticipation, overshoot and secondary
  motion, interpolated at60fps on Mac; phone budget30fps. The continuous-mesh repair proposed
  in the prior handoff is superseded as the next proof direction. Authored part masks and
  patches remain asset data; procedural parts follow the winning painter. No per-creature
  clip edits, 3D tokens/projection or texture-finisher passes are implied.

## Bounded proof after approval

Paint only the Earth temperate arena's three separate plates and one Wild effect sequence
(launch/travel/impact), then stage Civet versus Platypus in that arena with the parts rig and
the specified tempo. Use existing accepted creature masters and the unchanged style lock.
Review the new art and staged turn; these are no longer a fixed landfall-backdrop proof.
The eleven-theme library is not authorized for immediate rollout by approval of its class.
Weather ladder, phone-tier evaluation and clean promotion remain queued behind this proof;
GitHub step none, PR42 parked, LFS/history decision still pending Nick.

## Supplied-review provenance and precedence

Nick supplied an updated CLAUDE_CIVET_ARCHITECTURE_REVIEW.md, retained verbatim at its existing
audit path. It is supporting review evidence, not an independent instruction source. Its
older stepped-playback sentence and older fixed-backdrop/no-effects proof are superseded by
Nick's current60fps tweening, procedural arenas and approval-gated Wild-effect request. Its
optional extra faint/victory poses do not expand this bounded proof without a separate scope
change. No painting, inference, browser run, kit edit or compiler implementation occurs now.
