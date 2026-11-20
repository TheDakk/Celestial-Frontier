# Celestial Frontier v1.7 — Gold Proofs Round 2 Full Review

**Package reviewed:** `CFv17GOLDPROOFSR2(1).zip`  
**Proof date:** 2026-07-25  
**Review scope:** Earth fauna, Earth flora, procedural phenotype art, celestial objects, ships, gear, materials, biome vistas, landing generation, and desktop/mobile UI.

---

# 1. Executive verdict

## Overall assessment

Gold Proofs Round 2 is a substantial improvement over the first v1.7 proof package.

The system now feels much more cohesive across:

- creature skins and pelts;
- wings;
- flora and harvest organs;
- planets, stars, moons, rings, and deep-space objects;
- materials and gear;
- biome vistas;
- desktop and phone navigation.

The strongest Round 2 successes are:

- full-body procedural skin integration;
- improved feather construction;
- masked crystalline glints;
- shoulder-rooted wings with contact shadows;
- stronger Earth pelt identity;
- clearer flora harvest organs;
- broad celestial-object coverage;
- a coherent materials/gear icon language;
- improved responsive navigation on desktop and phone.

## Gold decision

> **Approve the v1.7 visual direction, but do not lock this exact package as final Gold yet.**

The package is extremely close, but several narrow release gates remain.

The included README itself states that two items are still scheduled for a micro-pass:

1. four remaining fauna reads;
2. open-sea landing variance.

The proof images also expose two additional integration gates:

3. phone bottom-dock and modal safe-area collisions;
4. flora-family mismatch in some landing-vista proofs.

After those corrections and a complete full-catalog regression/export, the v1.7 art and UI can be locked.

No foundational redesign is required.

---

# 2. Source-derived completion status

The included README reports the following as completed:

- Engrave v2 full-body skin integration;
- full-canvas texture fields clipped by the silhouette;
- rebuilt feathered skin;
- masked crystalline glints;
- shoulder-rooted side-view wings;
- near/far wing layering;
- wing-root contact shadows;
- desktop and phone navigation restructuring;
- phone nameplate truncation correction;
- shortened phone search placeholder;
- bundle-time version labeling by design.

The README explicitly identifies the following as the next micro-pass:

- four fauna reads;
- open-sea variance.

This review agrees that those two areas remain unfinished.

---

# 3. Readiness matrix

| Area | Status | Recommendation |
|---|---|---|
| Earth pelt direction | Strong | Approve |
| Earth eye treatment | Strong | Approve |
| Remaining Earth species reads | Incomplete | Focused micro-pass |
| Wing construction | Strongly improved | Flight-state polish required |
| Flora source/harvest distinction | Strong | Approve |
| Flora species specificity | Mixed | Targeted polish |
| Procedural body plans | Strong | Approve |
| Procedural heads/features | Strong | Approve with scale QA |
| Procedural skins | Strongly improved | Minor material polish |
| Planets | Strong | Approve |
| Stars/moons/rings | Strong foundation | Integration polish |
| Deep-space objects | Strong | Approve with exposure polish |
| Materials and gear | Cohesive | Approve |
| Ship progression | Clear | Structural polish recommended |
| Biome vistas | Broad and cohesive | Mapping/variance pass required |
| Desktop UI | Strong | Approve |
| Phone UI | Improved but not final | Safe-area fix required |
| Full Gold lock | Conditional | Complete final gates |

---

# 4. Earth fauna

# 4.1 Recipe-authoritative pelts

The Earth pelt system is moving in the correct technical direction.

The visible proof set shows successful improvements for:

- Tiger;
- Jaguar;
- Leopard;
- Clouded Leopard;
- Ocelot;
- Giant Panda;
- Okapi;
- Orca;
- Badger;
- Raccoon;
- Meerkat;
- Red Panda;
- Skunk;
- Spectacled Bear.

The most important success is architectural:

```text
canonical species recipe
→ species/family painter
→ lighting and presentation
```

The painter is no longer allowed to erase the defining species pattern.

## Tiger

Tiger is immediately recognizable.

The stripes now survive the full-body painter and cover:

- torso;
- neck;
- head;
- limbs.

## Remaining cat-pattern issue

The large cats still share closely related torso anatomy, so the pelt must carry a large portion of species identity.

The patterns should separate more strongly:

- Jaguar: large, heavy rosettes with dark centers.
- Leopard: smaller, denser rosettes.
- Clouded Leopard: large cloud-like patches.
- Ocelot: elongated chain and stripe markings.
- Cheetah: simple solid spots.
- Tiger: irregular branching stripes.

The current tiger stripes are still highly regular and vertical. They can read as a barcode rather than a natural pelt.

### Recommended improvement

Add anatomy-aware pattern zones:

```text
face
neck
shoulder
torso
legs
tail
underbody
```

Vary stripe:

- width;
- spacing;
- branching;
- interruption;
- direction.

---

# 4.2 Marked mammals

The markings sheets demonstrate useful species recognition.

Strong reads include:

- Panda;
- Okapi;
- Orca;
- Skunk;
- Raccoon;
- Elephant;
- Walrus;
- Gorilla;
- Orangutan;
- Warthog;
- Kudu.

## Remaining issue

Some patterns still behave as graphic symbols placed onto a shared body rather than markings following anatomy.

Examples:

- Okapi leg stripes are clear but extremely regular.
- Panda color blocking is strong, but the body remains broad and ungulate-like.
- Spectacled Bear face marking is readable but visually tiny.

These are acceptable within the stylized system but can be improved through region-aware masks.

---

# 4.3 Eyes and frontal faces

The previously identified eye problems remain corrected.

Working examples include:

- paired owl eyes;
- paired bat eyes;
- paired primate eyes;
- visible frog pupils;
- frontal butterfly eye pairing.

The eyes remain readable at catalog scale.

**Status:** Approved.

---

# 4.4 Frogs

The frog family now has stable eyes and a clear category silhouette.

However, the species still rely primarily on:

- body color;
- eye color;
- a few spots or belly marks.

Poison Dart Frog, Tree Frog, Bullfrog, Toad, Glass Frog, Pacman Frog, and other families remain very close in anatomy.

## Recommended non-blocking improvement

Create three or four frog subfamilies:

- tree frog: long toes and climbing posture;
- toad: squat body and warty skin;
- bullfrog: broad heavy body;
- poison frog: smaller compact body;
- Pacman frog: extremely wide head and mouth;
- glass frog: lighter translucent belly.

This is likely one of the remaining fauna-read opportunities referenced by the README.

---

# 4.5 Birds

The bird families remain broadly readable, and the clipping/box-fit proofs are stable.

Strong examples:

- Flamingo;
- Crane;
- Heron;
- Stork;
- Spoonbill;
- Peacock;
- Pelican;
- Toucan;
- Hornbill;
- Eagle.

## Remaining species-read issues

Several birds remain extremely close to the same generic body.

Examples:

- Puffin and Penguin are primarily separated by beak color.
- Ostrich, Cassowary, and some waders share similar proportions.
- Swan does not yet strongly communicate an aquatic swan body.
- Secretary Bird lacks its strongest crown and raptor-leg identity.

## Recommended micro-pass

Focus only on the most visible silhouette markers:

- Puffin: larger colorful triangular bill, compact body.
- Penguin: flipper arms and upright aquatic body.
- Swan: broader waterfowl body with long curved neck.
- Cassowary: heavy torso and casque.
- Secretary Bird: crown feathers and long raptor legs.

---

# 4.6 Ungulates and small mammals

The fauna-wave proof shows useful category breadth, but several species remain family-generic.

Examples:

- Kudu, Impala, Gerenuk, Pronghorn, and Ibex share similar long-legged bodies.
- Warthog and Wild Boar remain close.
- Red Panda, Raccoon, Skunk, and Badger share a long low mammal scaffold.
- Sloth uses a distinctive hanging pose but reads more as a suspended object than a natural animal.

These are not taxonomy failures.

They are likely part of the README’s remaining fauna-read micro-pass.

## Recommended approach

Do not rebuild the entire catalog.

Add only defining markers:

- Gerenuk: very long neck.
- Pronghorn: forked/pronged horns.
- Kudu: spiral horns.
- Ibex: large backward-curving horns.
- Warthog: tusks and facial mass.
- Red Panda: large ringed tail.
- Raccoon: ringed tail and face mask.
- Skunk: dorsal white stripe and full tail.
- Badger: low heavy body and head stripe.

---

# 4.7 Winged procedural fauna

## Major success

Round 2 materially improves the wings.

The wings are now:

- shoulder-rooted;
- side-view appropriate;
- swept up and back;
- separated from the head;
- layered as near and far wings;
- integrated through a contact shadow.

This directly solves the previous “wings pasted onto the body” problem.

## Remaining flight-state issue

The airborne rows still sit very close to the ground shadow.

Several examples read as:

- gliding just above the ground;
- crouching;
- displaying their wings;
- running with open wings.

The grounded and airborne silhouettes are therefore not yet different enough.

## Required Gold polish

For airborne states:

- raise the body farther above the ground shadow;
- narrow and soften the shadow;
- tuck or reduce the legs;
- tilt the body slightly forward;
- vary wing stroke angle;
- separate the wing shadow from the body shadow.

For grounded states:

- lower the body;
- retain full legs;
- broaden the contact shadow;
- fold the wings more tightly.

For four-winged organisms:

- increase forewing/hindwing separation;
- use different angles and sizes;
- avoid merging the two pairs into one large shape.

---

# 5. Earth flora

# 5.1 Harvest organs

The source-versus-harvest model is working well.

Clear harvest items include:

- Maple Sap;
- Pine Nuts;
- Bamboo Shoots;
- Lotus Root;
- Juniper Berries;
- Orchid Pods;
- Barrel Cactus Fruit;
- Acorn.

The source plants remain visually separate.

This supports the correct gameplay model:

```text
source plant
→ harvestable organ
```

**Status:** Approved.

---

# 5.2 Fruit and reproductive organs

The flora-organ proof improves recognizability for:

- Banana;
- Coffee;
- Cacao;
- Durian;
- Mango;
- Papaya;
- Date Palm;
- Jackfruit;
- Avocado.

## Remaining attachment issue

Some fruits appear to float near or above the canopy rather than growing from branches.

Examples:

- Coffee berries;
- Mango;
- some canopy fruits.

## Recommended improvement

Attach reproductive organs to:

- visible branch tips;
- trunk nodes;
- stem clusters;
- canopy underside.

Use small contact stems so they do not read as floating inventory items.

---

# 5.3 Rafflesia

Rafflesia is more recognizable as a large flower, but it is still presented on a visible upright stem.

The real defining growth read should be:

- ground-level;
- no conventional trunk;
- enormous bloom relative to the rest of the organism;
- thick fleshy petals.

This remains a high-value iconic override.

---

# 5.4 Flora-wave species identity

The expanded flora sheet adds useful families:

- spices;
- fruits;
- nuts;
- vines;
- roots;
- herbs;
- grains;
- marine plants.

The shape vocabulary is broader, but several Earth species use colors or silhouettes that are not naturally recognizable.

Examples:

- Cinnamon and Cardamom use unusual blue-purple foliage.
- Lettuce, Sea Kale, and Watercress share nearly identical bowl forms.
- Wheat, Barley, Buckwheat, Sorghum, and Quinoa remain closely related.
- Kelp, Sea Lettuce, Red Algae, and Eelgrass require stronger marine-form separation.

## Recommended improvement

Earth organisms should use natural Earth palettes unless a gameplay state explains otherwise.

Separate families through morphology first, color second.

---

# 5.5 Canopy system

The canopy sheet demonstrates:

- seeded tree variation;
- broad, fruiting, conifer, baobab, and acacia families;
- 100% and 200% scale tests;
- procedural integration at vista scale.

The broad silhouettes work well in landscapes.

## Remaining issue

Some conifer subtypes lose conifer identity and become soft amorphous canopy blobs.

Refine:

- visible vertical taper;
- branch tiers;
- needle-like edge rhythm;
- clearer trunk-to-crown relation.

At 200%, several canopy textures become visibly soft. This is acceptable for distant vistas but should not be reused for close-up codex art.

---

# 6. Procedural fauna

# 6.1 Body plans

The procedural body-plan library remains broad and usable.

It includes:

- land grazers;
- armored crawlers;
- stilt-legged forms;
- cephalopods;
- serpents;
- segmented organisms;
- shelled organisms;
- winged organisms;
- crystalline forms;
- jellies;
- tusked and horned forms;
- squat organisms;
- radial life.

The population does not collapse into one quadruped family.

**Status:** Approved.

---

# 6.2 Heads, tails, eyes, limbs, and traits

The procedural features remain visible across multiple body families.

Strong areas include:

- eyeless heads;
- tendril-fringed heads;
- domed heads;
- horned heads;
- tail families;
- multi-eye layouts;
- six/eight appendage variations;
- crystal antlers;
- armor plates;
- water humps.

## Remaining scale issue

Some small features still become weak at card scale:

- fangs;
- mandibles;
- small horns;
- narrow frills;
- minor tail tips.

## Recommended rule

A defining trait should occupy enough silhouette area to survive at the smallest supported card size.

If it disappears when reduced, increase:

- size;
- contrast;
- spacing;
- outline;
- pose influence.

---

# 6.3 Engrave v2 skin system

## Major success

The new skin-compositing method is substantially better.

The texture now:

- covers the full body;
- is clipped by the creature silhouette;
- affects head, limbs, torso, and tail;
- preserves the base paint and lighting;
- avoids scribbling outside or only across the center of the creature.

The system reads as material integrated into the organism.

## Strongest families

- scaled;
- chitinous;
- plated;
- warty;
- feathered;
- translucent.

## Furred

Furred is clearer than before but still reads in places as:

- rounded body lumps;
- wool;
- scalloped armor.

Optional refinement:

- irregular edge fringe;
- directional tufts;
- neck/chest/tail concentration;
- shorter non-uniform fur rhythm.

## Feathered

The shingle-plumage rebuild is successful.

The layered feather read is much better than the previous line treatment.

## Crystalline

Masked glints are corrected and remain inside the body.

However, some crystalline examples are visually subtle.

Increase, where appropriate:

- facet breaks;
- refractive edges;
- crystal seams;
- translucent mineral planes.

---

# 6.4 Earth versus procedural path

The A/B sheet clearly demonstrates:

- named Earth organism → canonical Earth rig and pelt;
- identical genes without an Earth name → pure procedural morphology.

This supports the intended dual system:

```text
Earth ancestry
≠
pure alien generation
```

The distinction is useful and readable.

---

# 7. Celestial objects

# 7.1 Planets

The planet system remains one of v1.7’s strongest additions.

Strong features include:

- blended polar caps;
- smooth coastlines;
- atmospheric limb haze;
- cloud coverage;
- seeded gas vortices;
- multiple terrestrial climate treatments.

## Remaining opportunities

### Terrestrial palette diversity

Several worlds still share an Earth-like recipe:

- blue water;
- green terrain;
- tan interiors;
- white clouds.

Expand chemistry-driven variation.

### Cold-band world

The cold-band example remains heavily washed out and loses terrain readability.

### Venus

The Venus-like world remains too uniformly smooth.

Add subtle atmospheric circulation and sulfur-cloud structure.

### Gas giant

The gas giant has useful storms but needs stronger:

- latitudinal bands;
- cloud-height separation;
- differential rotation;
- storm depth.

---

# 7.2 Stars

The star thumbnails and surface sheets cover a broad stellar set.

The relative-scale proof is especially useful.

It includes:

- white dwarf;
- M;
- K;
- G;
- F;
- A;
- B;
- red giant;
- supergiant.

## Remaining issue

The close star surfaces still share a related cloudy texture.

The colors are distinct, but class-specific material behavior can be stronger.

Recommended:

- G/F: granulation and active regions.
- B/A: smoother high-energy surfaces.
- M: mottled active zones and compact flares.
- Red giant: large slow convection cells.
- Supergiant: massive irregular cells and mass-loss effects.
- White dwarf: small hard core with tight halo.

---

# 7.3 Moons

The moon families are stable at far and close scale.

Strongest:

- rocky;
- captured.

Remaining refinements:

- icy fractures are too clean and geometric;
- volcanic moon is bright and toy-like;
- crater shading can still resemble embossed circles.

Use more material-specific terrain rather than uniform circular features.

---

# 7.4 Rings

The ring recipes are clear and deterministic.

The live-view ringed planet reveals the remaining integration issue:

- the planet’s ring shadow is broad and sharply banded;
- front/back ring transitions can still feel masked rather than spatial.

## Recommended final integration pass

- soften ring shadow edges;
- vary optical depth by band;
- allow planet shadow across rear rings;
- test multiple inclinations;
- test near-edge-on presentation;
- add subtle particulate texture at close scale.

---

# 7.5 Deep-space objects

## Black hole

The black hole remains the strongest deep-space asset.

Working features:

- readable event horizon;
- accretion disk;
- lensed arcs;
- photon-ring treatment;
- Doppler-side concept.

Optional improvement:

- stronger blue/red asymmetry;
- thinner photon ring;
- softer boundary around the event horizon.

## Wormhole

Readable and distinctive, but the surrounding particles still create a bead/bracelet quality.

Move toward:

- continuous space distortion;
- sheared background stars;
- deeper interior throat;
- fewer repeated nodes.

## Quasar

The core and jets are readable on the proof sheet.

At live-view scale, the jets become small.

Increase their length or brightness hierarchy.

## Nebulae

The nebula families are differentiated, but several still show repeated circular arc construction.

The molecular dark cloud is intentionally subtle but risks disappearing in gameplay.

Use:

- broken gas fronts;
- blocked-star silhouettes;
- asymmetric opacity;
- embedded dust;
- rim illumination.

---

# 7.6 Live system view

The live composition proves that the objects share one visual language.

The main remaining issue is exposure hierarchy.

The large sun’s corona dominates while smaller deep-space phenomena become tiny and quiet.

## Recommended runtime system

Select one dominant luminous object per viewport and compress other glows dynamically.

Use distance-aware detail:

```text
far icon
→ medium procedural texture
→ close HD master
```

---

# 8. Ships, gear, and materials

# 8.1 Ship tiers

The ship progression remains clear:

1. Scout Hull;
2. Jump Drive;
3. Long-Range Array;
4. Intergalactic Drive;
5. Auto-Extractor;
6. Corona Scoop.

The player can recognize one persistent ship being rebuilt.

## Remaining issue

Most stages preserve almost the same body silhouette.

Several upgrades appear attached rather than structurally integrated.

The Auto-Extractor is especially small.

## Recommended non-blocking improvement

Allow each major tier to change one structural area:

- nose;
- spine;
- engine assembly;
- fins;
- ventral keel;
- radiators;
- armor.

The Corona Scoop should have:

- visible mount;
- power conduit;
- deployed/stowed state.

---

# 8.2 Materials

The 47-material sheet is cohesive and readable.

The families are clear:

- structural;
- gases;
- volatiles;
- precious;
- technological;
- exotic;
- cosmic.

The icon language is broad enough to prevent most materials from looking identical.

## Accessibility recommendation

Some metallic and pale materials rely heavily on subtle hue.

Use labels and shape as the primary identity, with color as reinforcement.

---

# 8.3 Gear tiers

The gear system has strong family breadth and readable progression.

Working features:

- matte basic materials;
- first-glint components;
- luminous ship systems;
- role badges;
- explorer gear;
- signature relics;
- cosmic orbit effects.

## Remaining issue

Higher tiers depend heavily on:

- bloom;
- color;
- sparkles;
- orbit lines.

At small size or under color-vision differences, some tiers may merge.

## Recommended improvement

Encode rarity through more than color:

- frame shape;
- icon border;
- corner marks;
- number of orbital particles;
- material texture;
- silhouette complexity.

---

# 8.4 Paper doll

The full-body paper doll is a strong improvement over the earlier bust.

The socket map is useful and includes:

- helmet;
- ears;
- necklace;
- module;
- suit;
- gloves;
- tool;
- legs;
- boots.

## Missing Gold proof

The package does not show the paper doll wearing a complete mixed equipment loadout.

Before final UI lock, provide one actual equipped-state proof showing:

- overlapping gear;
- glow stacking;
- left/right hand behavior;
- clipping;
- module placement;
- helmet and ears compatibility;
- body-size scaling.

---

# 9. Vistas and biome generation

# 9.1 General coherence

The biome library has expanded significantly.

Strong categories include:

- jungle;
- savanna;
- swamp/marsh;
- fungal;
- crystal steppe;
- salt flat;
- glass desert;
- oxide waste;
- cryogenic worlds;
- volcanic environments;
- gas decks;
- storm seas;
- settlements;
- night scenes.

The common horizon and layered-plane language keeps the game visually coherent.

---

# 9.2 Open-sea variance — required micro-pass

The Earth landing histogram shows:

```text
open sea = 55%
```

Many of the generated open-sea landings are nearly identical:

- same beach;
- same island horizon;
- same trees;
- same light;
- same water state.

For a procedural exploration game, this will become repetitive quickly.

The README explicitly identifies open-sea variance as unfinished.

## Required improvement

Create multiple open-sea sub-recipes:

- calm pelagic coast;
- archipelago;
- coral shelf;
- stormfront;
- volcanic island;
- ice sea;
- fog bank;
- night ocean;
- bioluminescent shore;
- rough swell;
- shallow sandbar;
- cliff coast.

Vary:

- island count;
- island position;
- beach width;
- wave state;
- cloud state;
- time of day;
- vegetation;
- atmospheric visibility.

Also reconsider whether 55% is the intended landing distribution.

If it is intentional, the visual family needs significantly more internal diversity.

---

# 9.3 Flora-vista mapping mismatch

The flora-vista proof contains a clear mapping concern.

The panel labeled:

```text
desert · its CACTI
```

uses foreground forms that read closer to ferns, web fronds, or grasses than cacti.

The jungle and meadow panels reuse similar foreground web-like forms despite different flora labels.

## Required correction

Biome flora selection should resolve through:

```text
biome flora family
→ compatible growth forms
→ scale layer
→ placement rule
```

Examples:

- desert → column cactus, barrel cactus, pads, succulents;
- jungle → broadleaf, vines, epiphytes, ferns;
- meadow → grass, flowers, low herbs;
- swamp → reeds, mangrove roots, aquatic mats;
- crystal steppe → mineral flora and sparse hardy analogues.

The label and visible vegetation must agree.

---

# 9.4 Rivers

The seeded river proof demonstrates deterministic placement and useful variation.

However, many rivers remain:

- very bright;
- uniform in width;
- smooth and road-like;
- minimally connected to banks or tributaries.

In village scenes, road and river can feel like two clean vector lines.

## Recommended improvement

Add:

- varying width;
- dark banks;
- reflected sky;
- meanders;
- tributaries;
- deltas;
- crossings;
- bridges;
- reeds;
- wetland edges;
- terrain erosion.

---

# 9.5 Gas decks

The gas-deck scenes are distinctive and support:

- floating flora;
- aerial fauna;
- night/day differences;
- moons;
- rings;
- rain;
- color families.

This is a successful biome category.

Optional improvement:

- clarify buoyancy anatomy;
- vary cloud-layer altitude;
- increase parallax between foreground and distant floaters.

---

# 9.6 Coherence sheet

The coherence sheet demonstrates good expansion beyond wilderness:

- Iron-era village;
- spacefaring settlement;
- herds;
- snow environments;
- volcanic ecology;
- island night;
- crystal steppe.

This is a strong direction.

The next improvement should be ecosystem density rules rather than additional art families.

---

# 10. UI review

# 10.1 Desktop layout

The desktop hierarchy is clear:

- player status left;
- Prime Codex top-center;
- search top-right;
- Atlas/Compendium/Records/Shipyard right rail;
- notification/help/settings bottom-right;
- Charters left.

Panels remain compact and avoid covering the primary galaxy view excessively.

**Status:** Strong.

---

# 10.2 Phone navigation

The two-row phone dock follows the requested ordering and keeps the major boards reachable.

The nameplate and shortened search placeholder fit.

This successfully resolves the original top-bar truncation concern.

---

# 10.3 Phone safe-area collision — required fix

The phone screenshots expose a repeated bottom-layout issue.

The following elements overlap or sit behind the dock:

- galaxy explanatory text;
- bottom interaction helper;
- Guide popup;
- Settings panel;
- Reset Game button;
- some modal content.

The Settings screenshot is the clearest case: the panel extends into the navigation dock and the reset control is partially obscured.

## Required Gold fix

Reserve a persistent bottom safe area equal to:

```text
dock height
+
device safe-area inset
+
spacing margin
```

When a panel is open:

- scroll content above the dock;
- raise the modal;
- hide or move the galaxy helper;
- prevent destructive buttons from sitting behind navigation;
- ensure close controls remain reachable.

---

# 10.4 Missing phone proofs

The package includes phone proofs for:

- Main;
- Charters;
- Compendium;
- Guide;
- Settings.

It does not include phone proofs for:

- Prime Codex;
- Atlas;
- Records;
- Shipyard.

These are important because Records and Shipyard are likely denser than the panels already shown.

## Required final UI proof set

Provide phone captures for every major board, including:

- empty state;
- populated state;
- long-content/scroll state;
- on-screen keyboard state where search or codes are entered.

---

# 10.5 Version label

The Guide proof displays:

```text
Celestial Frontier · v1.6.4 (dev)
```

The README explains that this is bundle-time by design and `(dev)` identifies the source build.

That is acceptable for development proofs.

Before Gold, confirm that the exact shipping bundle shows:

- the correct public release number;
- no unintended `(dev)` marker;
- build or commit information in an appropriate diagnostics location.

---

# 10.6 Emoji/icon consistency

The requested emoji navigation is implemented.

One technical concern remains:

> Native emoji can render differently across operating systems and browsers.

For deterministic visual identity, consider:

- bundled SVG emoji;
- a controlled icon font;
- baked emoji assets.

This can preserve the requested emoji style without platform-dependent changes.

---

# 10.7 Accessibility and touch targets

Before final lock, verify:

- minimum touch-target size;
- text contrast;
- smallest font size;
- keyboard focus states;
- screen-reader labels;
- reduced motion;
- colorblind-safe rarity and status;
- panel scroll behavior.

Several phone labels and counters are visually small and should be tested on a physical device.

---

# 11. Required Gold gates

Complete these before locking v1.7.

## Gate 1 — Phone UI safe areas

Fix bottom-dock overlap for:

- helper text;
- guide popup;
- settings panel;
- reset control;
- all scrollable panels.

## Gate 2 — Complete phone-board proof set

Provide phone proofs for:

- Prime Codex;
- Atlas;
- Records;
- Shipyard.

## Gate 3 — Open-sea variance

Expand the dominant 55% landing family and/or rebalance its occurrence.

## Gate 4 — Flora-vista family mapping

Ensure the named biome flora family matches visible growth forms.

## Gate 5 — Remaining fauna-read micro-pass

Resolve the highest-value bird, frog, ungulate, and small-mammal silhouettes identified in the current proofs.

## Gate 6 — Airborne pose

Increase visible separation between airborne and grounded wing states.

## Gate 7 — Full Earth-catalog propagation proof

The package shows the corrected visible catalog proof, but does not provide all individual catalog pages.

Before lock:

- export every page;
- verify pelt propagation;
- check for pattern leakage;
- run eye and classifier sentinels;
- compare at real card size.

## Gate 8 — Final shipping integration checks

Verify:

- actual-size readability;
- paper-doll equipped state;
- ring integration;
- celestial exposure;
- correct release version;
- deterministic fingerprint.

---

# 12. Non-blocking post-Gold opportunities

These should not delay release after the required gates are complete:

- deeper cat anatomy;
- additional frog subfamilies;
- more botanical Earth-flora overrides;
- stronger star-class surface differences;
- richer moon geology;
- more wormhole distortion;
- stronger ship silhouette escalation;
- more gear-role shapes;
- denser ecosystem behaviors;
- additional settlement variations.

---

# 13. Final decision

## Is the v1.7 direction correct?

**Yes.**

Round 2 successfully strengthens the entire game-wide visual language.

## Is it ready to lock exactly as supplied?

**Not yet.**

The remaining work is narrow and clearly defined:

- phone safe-area corrections;
- complete phone-screen coverage;
- open-sea variance;
- biome-flora mapping;
- remaining fauna reads;
- stronger airborne posture;
- full-catalog propagation verification.

## Recommended status

> **Approve Gold Proofs Round 2 as the near-final visual candidate.**  
> **Complete the eight Gold gates.**  
> **Then lock v1.7 without reopening the foundational art direction.**
