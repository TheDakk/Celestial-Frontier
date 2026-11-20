# Celestial Frontier pixel-art direction

Dakk approved the November 20 pixel-art reference packs as the visual target
for the whole game. The [reference manifest](pixel-art-reference-manifest.json) identifies the exact PNGs from
both packs by SHA-256. The packs show the visual target and give reusable
prompts for additional authoring references.

## Visual standard

- Draw on a native square-pixel grid with deliberate clusters, stepped
  silhouettes, limited hue-shifted palettes and selective dithering. Scale
  in integer steps where the layout allows. Review assets at their actual
  sizes on iPhone and desktop.
- Keep recognizable shapes and markings from the existing artwork. Separate
  foreground, scenery, sprites and effects so they can move and layer
  independently. Render names, controls and values using the game's UI.
- Use deep navy, cyan selections, restrained brass accents and warm ivory
  display text. Keep readable contrast and clear touch targets.

## Game-wide scope

| Surface | How the approved direction applies |
| --- | --- |
| Universe, galaxies, systems and orbit | Distinct galaxy and planet silhouettes, stepped orbit tracks, readable selection markers and matching survey cards. |
| Landfall and biomes | Layered terrain, weather and flora with open encounter ground. Earth Rainwood, Mars Dune Sea and Fungal Highlands establish the range. |
| Earth and procedural fauna | Use vetted Earth paintings as anatomy references. Build procedural art from resolved body plans, compatible authored parts and genome-driven traits. Draw poses and effects for each family. |
| Earth and procedural flora | Preserve named botanical growth habits. Use seeded family rules for branching, leaf shape, root or holdfast placement, palette and organ placement within supported forms. |
| Compendium and collection | Carry each species' distinct shape and markings through icons, portraits, discovery views, battle and breeding or lineage views. |
| Inventory, crafting and ships | Give materials, parts and gear distinct silhouettes. Apply the style to all ship stages and hardpoints, Engineering and Shipyard, and recipe and item details. |
| Remaining UI | Carry the same visual language through navigation, Charters, Records, Guide, training, menus, dialogs, icons and feedback. |

An art version and the existing immutable identity should be enough to
reproduce a supported procedural appearance. Version palettes, part sets and
assembly rules. Keep the generator's world, genome, breeding and save contracts
as the source for those decisions, and verify visual identity across reloads,
Compendium and gameplay.

## Proposed first playable slice

Complete the active 631-species painted reference intake. Then prove a complete
path from the galaxy to Sol and Earth, through Rainwood landfall and a normal
battle, and back to the Compendium and Engineering. Include a named Earth
creature, one family of procedural fauna, one family of procedural flora, and
one existing recipe. Check silhouette and motion at phone scale, the same
genome across reloads and views, and the actual survey, encounter and crafting
outcomes through their normal controls.

This sequence is a proposed implementation order. The approved references set
the art target; authoring production assets and wiring the runtime are future
work under the roadmap.
