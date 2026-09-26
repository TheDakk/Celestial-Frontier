# Three decisions for Nick — Art Kit v3 adoption

**SUPERSEDED / REJECTED — Nick, September 12 revised packet:** v3, both paintings and these proposed decisions are retired; do not use their prompts or hand-typed system card. See root ART_KIT.md v4 and ROADMAP.md. The material below is preserved historical evidence only.

Prepared September 12, 2026. These are proposals, not changes to the kit or seeded game
content. The supplied ART_KIT.md remains byte-for-byte version 3. Initial sheet/plate use
its existing AMBER row and current companion wording. No volume generation before decisions.

## 1. Earth profile

Recommend the Earth system card only:

> EARTH PROFILE: named Earth species keep their real anatomy, fur, feather and botany; the anchor's material clause applies to alien worlds.

This preserves the nineteen canonical genomes and six named residents. No alien-world
exception, recolouring of real anatomy, or change to §2 is implied. Alternative: put the
same line into a future kit version's §3. Nick's decision is pending.

## 2. Star mapping and proposed added rows

This is an art vocabulary overlay. Never change `starClass`, thresholds, seeds, star colours,
companion records or generated life to fit the table. Actual source:
`port/v2/packages/domain/starcatalog/src/index.ts` and
`port/v2/packages/domain/worldgen/src/worldgen.verbatim.js`.

| Game data | Proposed art row | Boundary |
| --- | --- | --- |
| M | EMBER | Existing row. |
| K | AMBER | Existing row. |
| G, including Sol | WHITE | Existing row; Earth profile governs named Earth life. |
| A / B | AZURE | Shared pigment/light vocabulary; retain actual class/size in subject. |
| RG / SG | CINDER | Giant phases are present in source, resolving the review's open check; preserve giant versus supergiant scale. |
| NS | NEUTRON (new) | Proposed row below. |
| BH | ABYSS (new) | Paint the surrounding emitting material; the black hole remains dark. |
| MAG | MAGNETAR (new) | Proposed row below. |
| PROTO / nursery birth | NURSERY (new) | Nursery has 1–3 seeded births; retain exact count. |
| binary | TWIN data-aware revision in a future kit | Keep actual primary and companion pigment; never invent a white dwarf. |
| trinary | TRINE (new composition rule) | Three actual lights; keep primary, binary companion and third component. |
| BD | BANKED (additional missing row) | Source includes brown dwarfs; do not mislabel as red dwarfs. |
| WD | ASH (additional missing row) | Source includes white dwarfs; do not mislabel as yellow-white suns. |

The following is proposed art direction, not a physical habitability claim. It specifies
how already-generated life is painted; fauna/flora adaptations are rendered only when
supported by organism data. No anatomy or genome mutation is authorized.

| Proposed row | Pigment | Light | Flora palette | Fauna rendition |
| --- | --- | --- | --- | --- |
| NEUTRON (NS) | bone white, pale cobalt, black surrounding field | compact cold key; hard edged narrow beam when visible; deep cobalt-grey shadows | graphite, mineral silver, restrained teal | graphite and pale mineral surfaces; depict existing eye shielding only |
| ABYSS (BH) | opaque black centre; ochre, pale gold and bone-white accretion material | disc is the emitting structure; warm grazing key, near-black shadows | olive-black, charcoal, muted copper | dark mineral/chitin surfaces with copper accents where genes permit |
| MAGNETAR (MAG) | chalk white, ice blue, cobalt | compact cold key with structured painted magnetic arcs; no soft bloom | silver-grey, blue-black, pale cyan | pale mineral and blue-black surfaces; retain seeded body plan |
| NURSERY (PROTO) | burnt orange, ochre, soot-black dust | warm key filtered through a structured dust disc; soft but directional ochre shadows | rust, ochre, olive-black | banded rust/tan and dark membrane where supported |
| TRINE (trinary) | actual primary row plus both actual companion pigments | one dominant key plus two weaker directional sources; trace all three shadow directions explicitly | primary row's permitted pigments | primary palette with secondary light falling on the same surfaces; no invented split anatomy |
| BANKED (BD) | dull sienna, copper, near-black core | very low copper-red key, weak contrast, long shadows | near-black, charcoal, muted copper | dark hides/chitin, restrained copper pigment; keep actual eyes |
| ASH (WD) | chalk white, pale cobalt edge | small hard cold key, long cool shadows | graphite, silver, blue-black | slate and pale mineral surfaces; no assumed new armour |

Binary source companions are `#ff9a6a` or `#ffd9a0`; trinary's third component is
`#ff9a6a`. Proposed pigment mapping is cadmium-red/rust or gold/ochre, respectively.
Existing TWIN describes a white dwarf with an ember companion, which does not cover
these seeded systems. Keep v3 unchanged and authorize a future table revision before
painting those classes. Same reserved-magenta rule throughout. Initial AMBER references
need none of these proposed additions. Nick's mapping/rows decision is pending.

## 3. Companion clause

Recommend retaining §2 exactly as supplied: “Serious and wondrous in tone” without adding
“never cute”; retain the exact §4E “built to be kept” clause only for companion-flagged
data. Hostiles and guardians never receive it. No mascot/chibi styling.

The initial sheet uses the supplied wording, with no newly assigned companion flags.
The alternative is a future kit version adding “never cute” and removing the companion
rule. Nick's final decision is pending; do not freeze or generate volume before it.
