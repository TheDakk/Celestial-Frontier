# Midgame artwork and full landfall concepts — September 8, 2026

Nick requested a recognizable, coherent art direction across fauna, flora and
cosmic discoveries, followed by full-size landfall paintings with multiple
organisms. Four requested generations are retained here. The **Living Worlds
triptych (02) is approved visual direction**: Nick selected its cohesive painting
and asked to use that approach for the landing screen. After the full scenes, Nick confirmed
“This exactly aligns with my vision, 100%” and requested this direction throughout the game.
This approves the visual direction of the full landfalls as well; exact identity/botanical
qualification, runtime installation and all-world procedural coverage remain distinct work.

The latest [direction decision](../STATIC_LANDING_PORTRAIT_20260908/DIRECTION_DECISION.md)
owns the presentation change: show a large cohesive still on landing, then reuse
the same organism identity for Compendium portraits and future articulated 2D
battles. Live resident movement on the landing screen is no longer required now.
The decision does not promote these conceptual organisms into canonical species
or make a flattened painting a complete animation asset.

## Retained images and exact generation provenance

All four use **built-in `image_gen` mode**. Complete prompts, exact original
copies, dimensions, byte counts and SHA-256 hashes are retained. No external
image-generation CLI or post-generation editing was used for these four PNGs.
The result JSON files record the generation-time review state and remain
unchanged; the later approval of 02 is recorded in the direction decision.

| Image | Size / bytes | Exact prompt and result | Current interpretation |
|---|---|---|---|
| [01 — Discovery atlas](01-discovery-atlas.png) | 1536 × 1024 / 2,954,509 | [Prompt](01-discovery-atlas-prompt.txt) · [Result](01-result.json) | Hypothetical midgame fauna, flora and cosmic collection; review only. |
| [02 — Living Worlds](02-inhabited-worlds.png) | 1881 × 836 / 3,014,976 | [Prompt](02-inhabited-worlds-prompt.txt) · [Result](02-result.json) | Approved environmental painting and static-landing direction; conceptual worlds. |
| [03 — Earth full landfall](03-earth-full-landfall.png) | 1672 × 941 / 3,156,154 | [Prompt](03-earth-full-landfall-prompt.txt) · [Result](03-result.json) | Six named organisms from canonical Earth epoch 0, interpreted in one painting; identity/botanical acceptance remains open. |
| [04 — Fungal full landfall](04-alien-full-landfall.png) | 1672 × 941 / 3,255,598 | [Prompt](04-alien-full-landfall-prompt.txt) · [Result](04-result.json) | Fungal-biome family concept; not a verified seeded encounter. |

Exact PNG hashes, repeated here for artifact identification:

- 01: `c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62`
- 02: `68f03f0233ec2ca89ddf39238cfaf1a30b83027a58beaea9fbb1735273720a38`
- 03: `93c1b9cd6a57dc087cd4896ce05cb6025fbe5877dcba3a52f7b0ab6268289eec`
- 04: `c808c6fe442d5827c4c0f56649115de60266f3863b057d2e65c3231c32b6e116`

The user's subsequently supplied, visually matching triptych is preserved
separately as [user-approved-living-worlds.png](../STATIC_LANDING_PORTRAIT_20260908/user-approved-living-worlds.png),
with its own [exact intake](../STATIC_LANDING_PORTRAIT_20260908/reference-intake.json).
Its hash is `5ba8a19f3a9da76c0fa732c11414e4a3629f9376556321ece14c447f5a04f012`
and size 3,100,660 bytes. It is not claimed to be byte-identical to generation 02.
[intake.json](intake.json) retains the five earlier approved reference inputs and
the original two-board intent; the later full-scene requests are represented by
the separate 03/04 prompts and results.

## Gameplay and source boundaries

Earth 03 uses Civet, Platypus, Frog, Persimmon, Cranberry and Devil's Club from the
retained [canonical Earth roster](../AV_EARTH_LAYERED_SCENE_20260908/canonical-earth.json).
It does not claim real-world geographic co-occurrence. The Civet's face and coat
do not preserve the exact selected Civet asset, and complete botanical review is
still needed; see [REVIEW.md](REVIEW.md). This is not an exact identity replacement
for the current game or Compendium.

Fungal 04 follows the current BIOME_ATLAS family vocabulary: insect, gastropod,
amphibian, moss and fern. Its giant fungal canopy is conceptual environment
scenery. The [one-system source review](alien-source/README.md) retains all full
genomes and actual owners for Velae, Lonos and Droae and explains why none supplied
a completely coherent exact encounter. Existing biome/habitat/owner conflicts
were not fixed or hidden to justify the illustration. No further seed sweep ran.

The common animation [source taxonomy](../CIVET_PAINTED_PARTS_20260908/SOURCE_TAXONOMY.md)
and [CREATURE_ANIMATION.md](../../CREATURE_ANIMATION.md) remain relevant to future
Compendium/battle reuse. The same final owner, complete genome and lineage must
identify an organism across surfaces; similar-looking concepts do not establish
that contract. Healing, other flora effects, acquisition rules, categories and
rarity come from existing game data, never from the painting's appearance.

## Review and handoff limits

[REVIEW.md](REVIEW.md) records agent visual observations, positive direction and
concrete gaps. These four images establish no native-browser, physical-device,
Compendium/Slice/Glass/Recovery, retained-heap, animation, extraction or universal
procedural coverage qualification. Any separately implemented static-landing
pilot is owned by [its own packet](../STATIC_LANDING_PORTRAIT_20260908/README.md).

All earlier evidence and blockers remain binding in [ROADMAP.md](../../ROADMAP.md)
and [ROADMAP_ARCHIVE.md](../../ROADMAP_ARCHIVE.md), including the
[Earth layered-scene packet](../AV_EARTH_LAYERED_SCENE_20260908/README.md),
[painted Civet packet](../CREATURE_PAINTED_CIVET_20260908/README.md),
[scene-cohesion packet](../CREATURE_SCENE_COHESION_20260908/README.md) and
[water/motion packet](../CIVET_WATER_AND_MOTION_20260908/README.md). Concept approval
does not relabel a prior red, remove a verification blocker or accept the remaining
unfinished resident assets. No hosted action, scheduled prompt, release or version
change is authorized by this packet. The parent owns the local signed batch and
the paired Codex/Claude handoff; this documentation subtask performed no Git write.
