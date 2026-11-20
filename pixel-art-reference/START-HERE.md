# Celestial Frontier pixel-art reference library

Start with the [game-wide style board](01-style-and-worlds/00-celestial-frontier-style-board.png). The library contains 37 reference PNGs across all major player-facing systems, with four prompt guides. The game documentation and source define the actual mechanics, labels and availability.

- Use the [on-device generation design](ON-DEVICE-ART-GENERATION.md) for the runtime approach, from seeded inputs and reusable pixel parts through iPhone and offline verification.
- Use the system map below to find a visual target. For procedural generation, start with [seeded fauna variants](03-life-and-lineage/03-seeded-fauna-variants.png), [breeding lineage](03-life-and-lineage/04-breeding-lineage-variants.png), [pod shrub variants](03-life-and-lineage/08-pod-shrub-variants.png), and the [Guardian Command encounter](04-combat-and-guardians/04-guardian-command-iphone.png).
- Use the prompt guides when generating additional concept art. Use the [art manifest](art-manifest.json) to identify the original reference PNGs by dimensions and SHA-256.

## System map

| System | Visual starting points | Game references |
| --- | --- | --- |
| Universe, galaxies, star systems, orbit and landfall | [Universe map](02-space-and-ships/01-universe-map.png), [Milky Way](02-space-and-ships/02-milky-way.png), [Sol](02-space-and-ships/03-sol-earth.png), [Mars approach](02-space-and-ships/05-mars-approach.png), [Saturn rings](02-space-and-ships/06-saturn-rings.png) | WORLD_GENERATION.md, UI_PRESENTATION.md |
| Stellar and cosmic discovery, star skimming | [Stellar phenomena](02-space-and-ships/07-stellar-phenomena.png), [Cosmic Codex](05-economy-and-progression/06-records-codices-and-binder.png) | port/v2/README.md, ECONOMY_LOOT_CRAFTING.md |
| Biomes, surface layering, weather and Vistas | [Rainwood](01-style-and-worlds/01-earth-rainwood-biome.png), [Dune Sea](01-style-and-worlds/02-mars-dune-sea.png), [Fungal Highlands](01-style-and-worlds/03-fungal-highlands.png) | BIOME_ATLAS.md, ART_KIT.md, ART_DIRECTION.md, UI_PRESENTATION.md |
| World mining, outposts and field operations | [Planetary operations](01-style-and-worlds/04-planetary-operations.png) | PROGRESSION.md, ECONOMY_LOOT_CRAFTING.md |
| Life discovery, capture, Biosphere Yield and biosphere listening | [Biosphere survey](03-life-and-lineage/10-biosphere-survey.png) | CAPTURE_AND_BIOSPHERE.md, AUDIO.md |
| Named and seeded fauna, anatomy, and motion design | [Creature reference](03-life-and-lineage/02-creature-reference.png), [Seeded fauna](03-life-and-lineage/03-seeded-fauna-variants.png), [Battle](04-combat-and-guardians/02-rainwood-iphone-battle.png) | SPECIES_AND_GENOME.md, PROCEDURAL_CHARACTERISTICS.md, CREATURE_ANIMATION.md, ATTACK_ANATOMY.md |
| Earth and procedural flora, fungi and microbes | [Earth flora](03-life-and-lineage/06-earth-flora.png), [Procedural flora](03-life-and-lineage/07-procedural-flora.png), [Pod shrubs](03-life-and-lineage/08-pod-shrub-variants.png), [Fungi and microbes](03-life-and-lineage/09-fungi-and-microbes.png) | SPECIES_AND_GENOME.md, PROCEDURAL_CHARACTERISTICS.md |
| Compendium, owned companions, care, Field Scout, breeding and lineage | [Compendium](03-life-and-lineage/11-compendium-gallery.png), [Companion care](03-life-and-lineage/05-companion-care.png), [Breeding line](03-life-and-lineage/04-breeding-lineage-variants.png) | BREEDING_AND_SHARING.md, LINEAGE_AND_BREEDING.md, CAPTURE_AND_BIOSPHERE.md |
| Wild combat, friendly duels, conquest, Guardians, Titans and Chronicle | [Guardian silhouettes](04-combat-and-guardians/03-guardian-silhouettes.png), [Command break](04-combat-and-guardians/04-guardian-command-iphone.png), [Threat dossier and Chronicle](04-combat-and-guardians/05-threat-dossier-and-chronicle.png) | COMBAT_AND_CONQUEST.md, port/DECISIONS.md |
| Materials, rarity and loot, item instances, gear, comparison and salvage | [Materials and parts](05-economy-and-progression/01-materials-and-parts.png), [Explorer gear](05-economy-and-progression/02-explorer-gear.png), [Inventory](05-economy-and-progression/03-inventory-and-loadout.png) | MATERIALS_AND_GEAR.md, ECONOMY_LOOT_CRAFTING.md, RARITY_UNIVERSAL.md |
| Fabrication, research, ship capability and hardpoints | [Engineering](05-economy-and-progression/04-engineering-and-fabrication.png), [Four hull stages](02-space-and-ships/08-ship-progression.png) | EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md, MATERIALS_AND_GEAR.md |
| Training, Chapters, Charters, progression and collection records | [Training and Starter Charters](05-economy-and-progression/05-charters-and-field-training.png), [Records, Binder, Prime and Cosmic Codices](05-economy-and-progression/06-records-codices-and-binder.png) | QUESTS_AND_CHAPTERS.md, PROGRESSION.md, UI_PRESENTATION.md |
| Guides, controls, accessibility, audio UI and visible feedback | [Guide and settings](05-economy-and-progression/07-guide-settings-and-audio.png), [Biosphere survey](03-life-and-lineage/10-biosphere-survey.png), [Chronicle](04-combat-and-guardians/05-threat-dossier-and-chronicle.png) | UI_PRESENTATION.md, AUDIO.md, SOUND_KIT.md |
| Atlas, world sharing, postcards, backup and restore | [Atlas, Postcard and save tools](02-space-and-ships/09-atlas-sharing-and-backup.png) | UI_PRESENTATION.md, SAVE_SYSTEM.md, BREEDING_AND_SHARING.md |

## Concept boundaries

- Rosette, Ridgeback lineage, Fungal Highlands, Reef and Sky Guardians, and the fungi and microbe samples illustrate art direction. They do not assign entries to a canonical roster or prove a genome outcome.
- The Titan treatment is referenced through combat roles and the shared Guardian presentation. The archive does not propose a new named Titan.
- The body plan, marks, palette and poses proposed for procedural art need deterministic, versioned assembly from existing resolved anatomy and the complete genome. The current research and ship diagrams are concept treatments of documented capability stages.
- The example survey lineup, ring survey control, outpost buildings, Codex glyphs and UI groupings are visual studies. Use the current game rules and assets when deciding what appears on a live screen.
- The visuals for audio represent controls and event cues. Audio clips, save codecs, and the deterministic generation engine are outside a visual reference deliverable.
- A finished game asset should be drawn on a native grid, with named parts or layers as needed. The generated PNGs are style and staging reference.

## Prompts

- [New system studies and reusable master prompt](prompts/04-system-studies.txt)
- [Original game-wide pack](prompts/01-core-reference-prompts.txt)
- [Biome, space, flora and item expansion](prompts/02-expansion-prompts.txt)
- [Procedural fauna, lineage and Guardians](prompts/03-lineage-and-guardians-prompts.txt)

## Complete art index

### Style and worlds

- [celestial frontier style board](01-style-and-worlds/00-celestial-frontier-style-board.png)
- [earth rainwood biome](01-style-and-worlds/01-earth-rainwood-biome.png)
- [mars dune sea](01-style-and-worlds/02-mars-dune-sea.png)
- [fungal highlands](01-style-and-worlds/03-fungal-highlands.png)
- [planetary operations](01-style-and-worlds/04-planetary-operations.png)

### Space and ships

- [universe map](02-space-and-ships/01-universe-map.png)
- [milky way](02-space-and-ships/02-milky-way.png)
- [sol earth](02-space-and-ships/03-sol-earth.png)
- [sol mars](02-space-and-ships/04-sol-mars.png)
- [mars approach](02-space-and-ships/05-mars-approach.png)
- [saturn rings](02-space-and-ships/06-saturn-rings.png)
- [stellar phenomena](02-space-and-ships/07-stellar-phenomena.png)
- [ship progression](02-space-and-ships/08-ship-progression.png)
- [atlas sharing and backup](02-space-and-ships/09-atlas-sharing-and-backup.png)

### Life and lineage

- [procedural fauna concept](03-life-and-lineage/01-procedural-fauna-concept.png)
- [creature reference](03-life-and-lineage/02-creature-reference.png)
- [seeded fauna variants](03-life-and-lineage/03-seeded-fauna-variants.png)
- [breeding lineage variants](03-life-and-lineage/04-breeding-lineage-variants.png)
- [companion care](03-life-and-lineage/05-companion-care.png)
- [earth flora](03-life-and-lineage/06-earth-flora.png)
- [procedural flora](03-life-and-lineage/07-procedural-flora.png)
- [pod shrub variants](03-life-and-lineage/08-pod-shrub-variants.png)
- [fungi and microbes](03-life-and-lineage/09-fungi-and-microbes.png)
- [biosphere survey](03-life-and-lineage/10-biosphere-survey.png)
- [compendium gallery](03-life-and-lineage/11-compendium-gallery.png)

### Combat and Guardians

- [rainwood atmosphere](04-combat-and-guardians/01-rainwood-atmosphere.png)
- [rainwood iphone battle](04-combat-and-guardians/02-rainwood-iphone-battle.png)
- [guardian silhouettes](04-combat-and-guardians/03-guardian-silhouettes.png)
- [guardian command iphone](04-combat-and-guardians/04-guardian-command-iphone.png)
- [threat dossier and chronicle](04-combat-and-guardians/05-threat-dossier-and-chronicle.png)

### Economy and progression

- [materials and parts](05-economy-and-progression/01-materials-and-parts.png)
- [explorer gear](05-economy-and-progression/02-explorer-gear.png)
- [inventory and loadout](05-economy-and-progression/03-inventory-and-loadout.png)
- [engineering and fabrication](05-economy-and-progression/04-engineering-and-fabrication.png)
- [charters and field training](05-economy-and-progression/05-charters-and-field-training.png)
- [records codices and binder](05-economy-and-progression/06-records-codices-and-binder.png)
- [guide settings and audio](05-economy-and-progression/07-guide-settings-and-audio.png)
