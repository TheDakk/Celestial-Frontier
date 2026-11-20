# Addendum A — Scope clarification and the creature rubric

**Restores v3.1 §2. Slots into v4.0 as §2.6, referenced from §10 (Procedural Creature Upgrade) and §27.4 (art-direction document).**

v4.0 §2.1 carries a one-line version of this — *"Pokémon-level readability, attachment, and recognizable behavior without copying Pokémon designs"* — but not the checklist underneath it. That checklist is the scope fence for art production and, under decision D4 ("AI is the artist"), it is the rubric the generate → render → critique → revise loop optimises against. A loop without a written rubric optimises against whatever the critic happens to notice.

---

## A.1 The original scope clarification, restored verbatim

> Pokémon is a useful reference for **readability, personality, animation, attachment, and memorable species identity**.
>
> Celestial Frontier should not copy Pokémon's visual designs or become a cartoon imitation. Its creatures should remain:
>
> - More alien
> - More ecological
> - More procedurally varied
> - More textured
> - More mature in tone
> - More connected to planetary conditions
> - More materially expressive
>
> The qualities to borrow are:
>
> - Strong silhouettes
> - Readable faces
> - Recognizable idle movement
> - Species-specific locomotion
> - Emotional reactions
> - Memorable attack animations
> - Taming and bonding behavior
> - Clear personality
> - A sense that each creature is alive
>
> The recommended target is:
>
> > **Pokémon-level creature readability and emotional attachment, combined with Celestial Frontier's more detailed illustrated extraterrestrial identity.**

## A.2 The engine boundary, restored verbatim

> PixiJS can deliver a dramatic premium upgrade through layered 2D and 2.5D creatures, skeletal animation, mesh deformation, parallax, dynamic lighting, material shaders, particles, environmental effects, and animated encounters and biomes.
>
> PixiJS is not the ideal sole renderer for fully rotatable 3D creatures walking through a free-camera open world.
>
> The recommendation in this report is therefore a **premium animated 2.5D game**, not a fully 3D Pokémon-style overworld.
>
> If the future requirement becomes fully modeled creatures visible from every camera angle, the project should either add a browser-native 3D layer such as PlayCanvas or Babylon.js for selected scenes, or reassess the project as a native 3D production using a different engine.

This is the same boundary v4.0 §2.5 and §25 hold. It is restored here because it is the *reason* for the checklist above: every quality on that list is achievable in 2.5D, which is what makes the list a fence rather than an aspiration.

---

## A.3 The rubric — new, and the part that does work

The list above is a set of qualities. A generate-and-critique loop needs those qualities expressed as things a critic can score and a generator can be revised against. Each row below is scored per creature against a fixed-seed proof sheet; **the generator is revised, never the individual asset** (D4).

### Silhouette and readability

| # | Criterion | Fails when |
|---|---|---|
| A1 | The creature is identifiable from its **black silhouette alone** at 132 px, the current thumbnail size | Two creatures of different body plans produce the same blob |
| A2 | The silhouette reads at **thumbnail, card and full-portrait** scale without a separate asset | Detail that only exists to fill the large render disappears and takes identity with it |
| A3 | **Limb and head count are countable** in the silhouette | An eight-limbed creature reads as four-limbed |
| A4 | The **rig family is guessable** from the silhouette by someone who knows the taxonomy | A serpent reads as a fish |

### Face and personality

| # | Criterion | Fails when |
|---|---|---|
| A5 | The eyes are the **first thing the viewer finds**, and eye count matches the genome | The genome says six eyes and the render is legible only at two |
| A6 | The face carries **one legible temperament**, and it is the one the card prints | The card says "placid and curious" and the face reads hostile |
| A7 | Personality survives **rig sharing** — two creatures on the same rig do not read as recolours | A shared rig makes a family of near-identical animals |

Note A6 against the round-9 audio finding: `voiceOf` now correctly reads `g.temper` through `_TEMPER_BOLD`. The face should read the **same gene**, or the creature will look one way and sound another.

### Movement and life

| # | Criterion | Fails when |
|---|---|---|
| A8 | **Idle alone** identifies the locomotion class — a glider idles unlike a burrower | Every creature breathes on the same loop |
| A9 | Locomotion is **anatomically possible** for the limb count and body plan the genome specifies | A zero-limbed creature walks; a six-limbed one animates four |
| A10 | At least one **emotional reaction** is legible without text — pain, alarm, contentment | Damage is conveyed only by a number |
| A11 | The **attack silhouette differs from the idle silhouette** at a glance | Combat reads as the same pose with particles on top |
| A12 | **Taming and bonding** have a visible state change, not only a UI state change | The only evidence of a bond is a badge |

v4.0 §10.4's core animation library and §10.5's face and personality work are the implementation of A8–A12; this is the acceptance side of them.

### Alien-ness and ecology — the half that is *not* Pokémon

| # | Criterion | Fails when |
|---|---|---|
| A13 | The creature **belongs to its biome** — palette, material and adaptation read as a response to the world | A tundra creature and a magma creature differ only in hue |
| A14 | **Material response is genuine** — chitin, slick skin, fur, crystal and translucency behave differently under the same light | Everything is the same shader with a different albedo |
| A15 | The design is **more alien than cute**, and would not be mistaken for an existing franchise's creature | A designer could name the franchise it resembles |
| A16 | **Procedural variation is visible across a run of twelve** from the same family | Twelve rolls of one family look like one creature twelve times |

### Scoring

Sixteen criteria, scored 0 / 1 / 2 (fails / passes / exemplary) on a fixed-seed sheet of at least **24 creatures spanning all 18 rig families**, refreshed on every generator change.

- **Gate E (creature-quality proof) minimum:** no criterion averages below 1.0, and A1, A9 and A15 have **zero** scores of 0 anywhere in the sheet.
- A regression on any criterion between two generator revisions is a blocking finding, not a note.

A1, A9 and A15 are singled out because each is unrecoverable later: an unreadable silhouette cannot be fixed by animation, impossible anatomy cannot be fixed by materials (v4.0 Risk 7), and a derivative design cannot be fixed at all.

---

## A.4 Why this belongs in the plan rather than in an artist's head

The current game's art is generated by runtime code, which v4.0 §6.7 correctly identifies as a limit — the code is the only place the art exists. The port fixes that by moving to typed phenotype data plus rigs plus materials. But the *judgement* that decided the current look also lives only in the code, and nothing in v4.0 captures it.

Under D4 the critic in the loop is a vision model reading a rubric. The rubric is therefore not documentation — it is a **program input**, and its quality bounds the output quality of every creature in the game. §27.4's art-direction document is the highest-leverage open item in the plan for exactly this reason; A.3 is the scoreable half of it.
