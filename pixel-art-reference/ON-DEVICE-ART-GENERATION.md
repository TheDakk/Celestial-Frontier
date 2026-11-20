# Celestial Frontier — On-device procedural pixel art

**Status** · Proposed v2 renderer design, 2026-11-20

See the [art reference index](START-HERE.md) for the approved style, example scenes and generation prompts. The images in the pack are concept references for asset authors. This document describes how the game would render new artwork offline as players explore, discover life and breed companions.

## Design

The game ships a library of native-grid pixel parts and the rules for assembling them. Existing world, species, genome, lineage and item data determine which parts the device places and how it colors them. Concept image generation can help artists explore designs during authoring. The runtime uses deterministic composition and works offline once the app and required art packs are available locally.

```text
World address / genome / item identity
  → existing world, anatomy, lineage or equipment resolver
  → versioned appearance recipe
  → native-grid composition from local parts
  → icon, portrait, scene layers or battle sprite
```

The v2 procedural body-plan resolver and the existing species visual identity key are the starting points for fauna and flora. The full supported immutable genome and lineage supply creature appearance, including the differences that a seed alone can miss. Gameplay remains the authority for what creatures, worlds, encounters and items exist. Rendering does not consume gameplay random draws or grant outcomes.

## Runtime responsibilities

| Surface | Local generation | Artist-authored inputs |
| --- | --- | --- |
| Space and landfall | Place stars, assemble planet bands and rings, choose terrain and vegetation layers from the world address and biome, and animate weather as a presentation effect. | Star, planet and ship elements, terrain layers, foliage, palettes and landmark art. |
| Fauna and breeding | Resolve the body family and lineage. Select compatible proportions, markings, colors, tails and other allowed parts. Use the same appearance recipe for the Compendium, Lineage and battle. | Family silhouettes, joint and contact anchors, compatible parts, pose frames and named species art. |
| Flora, fungi and microbes | Compose growth forms from seeded branching, leaf and organ placement, or colony patterns. Preserve the identity and anatomy of named Earth organisms. | Growth modules, support and attachment rules, canopy, pod, cap, root and colony shapes. |
| Guardians and Titans | Apply the encounter's identity to the supported anatomy, with authored telegraphs, scale, framing and effects. Read live health, phase and party state from gameplay. | Signature creature parts and poses, family motion treatments, effects and encounter staging. |
| Items, ships and UI | Render exact item identities and their visible variants, installed hardware, ship stages, and interface state. | Distinct base icons, hulls, hardpoints, interface pieces and bitmap display type. |

The output should read like the reference pack at the player's viewing size. Draw silhouettes, contours and marks on a square pixel grid. Use deliberately chosen shade ramps, hard edges, selective dithering and integer scaling where practical. Lay out readable text and touch targets independently of the art resolution.

## Appearance recipes and compatibility

- Define a versioned recipe for each renderer family. Its inputs include a stable game identity, the immutable visual data and the art version. Include the world address and any explicit environmental phase for scene recipes. Health bars, active effects, playback time and selection are presentation state.
- Derive choices using separate, named art random streams. This lets a new cosmetic detail use its own stream without shifting unrelated traits. Keep palette and geometry rules with the version that owns them.
- Produce a stable recipe and canonical pixel buffer for the same version and supported input. Test the canonical buffer independently of device pixel ratio, display scaling and browser compositing.
- Keep viewport, pose and output size in the bitmap cache key as applicable. Keep the creature's identity in the shared appearance recipe so different views can draw at different sizes without changing its features.
- Author family rules for permitted parts, layer order, joints, contact points and safe proportions. If a combination lacks production pixel coverage, use an authored fallback for that family or identity with a known scope. Track the missing coverage.
- Preserve the identity of saved creatures and worlds as assets evolve. Keep published art recipes reproducible through compatible implementations or a documented art-version migration. No save-schema change is assumed for the first proof.

### Example · Wolf lineage

If a child retains a Wolf anatomical scaffold, its muzzle, leg structure and gait stay recognizably canid. Compatible inherited traits can change the coat patches or add bands and plates. The renderer reads those outcomes from the existing genetics and lineage rules. The same child's bands and plates should remain legible in the portrait and stay attached through approach, hit and recovery poses.

[Breeding and lineage concept](03-life-and-lineage/04-breeding-lineage-variants.png) · [Seeded creature variants](03-life-and-lineage/03-seeded-fauna-variants.png)

## Offline iPhone path

- Load and cache the relevant small art packs before their first offline use. Cache policy must account for a device evicting data.
- Build a thumbnail on first discovery. Prepare visible portraits and only the next likely battle assets. Prefer worker composition where supported, with small chunked jobs as a fallback.
- Keep the cache bounded by bytes and evict idle bitmaps and textures. Cancel queued art jobs when the owning scene closes. Rebuild an evicted bitmap from its recipe and local parts.
- Keep animation ticks focused on composing the current pose from ready art. Measure first-use latency separately from battle frame times, and track memory and sustained responsiveness across discoveries and repeated scene changes.

## First playable proof

The active Earth species reference-library work provides vetted anatomical source material. The proposed first runtime proof should cover one wild creature family, one successful cross through the real breeding flow, one seeded pod shrub, and one Guardian encounter. Connect those examples through normal gameplay on a physical iPhone.

- **Repeatability** · Recreate the same supported world and offspring after reload. Render the same canonical inputs on desktop and iPhone and compare recipes and fixed-grid pixels.
- **Identity** · Check that inherited traits remain readable in Lineage, the Compendium and battle. Include distinct full genomes that share a seed or differ by parent order.
- **Motion** · Review idle, approach, attack, hit and recovery at phone size. Check planted feet, tail and plate joins, and clear Guardian phase cues.
- **Offline and responsiveness** · After caching, reopen offline and render a previously unseen supported world or creature. Traverse multiple worlds, breed, battle and repeat while recording first-use latency, frame pacing and memory. Set rollout thresholds against observed physical-device results.
- **Game parity** · Compare the existing discovery, breeding, combat and save outcomes through their normal controls before and after introducing the art renderer.

This proof establishes feasibility for the chosen families. Broader body plans, land, air and water motion, named roster coverage and all other surfaces need their own art and validation.

## Project references

Repository paths for implementation context.

- `port/v2/packages/art/src/proceduraloverrides.ts` and `port/v2/packages/art/src/speciesidentity.ts`
- `SPECIES_AND_GENOME.md`, `PROCEDURAL_CHARACTERISTICS.md`, `LINEAGE_AND_BREEDING.md` and `BREEDING_AND_SHARING.md`
- `WORLD_GENERATION.md`, `BIOME_ATLAS.md`, `ART_DIRECTION.md` and `port/DECISIONS.md`
- `audits/PIXEL_PIVOT_20261120/PIXEL_ART_DIRECTION.md`
