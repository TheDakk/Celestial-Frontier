# Celestial Frontier — Full Species Real-World and Procedural Audit

**Source packages reviewed**

- `cf-species-earth-fauna.zip`
- `cf-species-earth-flora.zip`
- `cf-species-earth-fungi.zip`
- `cf-species-earth-microbe.zip`
- `cf-species-procedural.zip`

**Review target supplied by the project**

`C:\Projects\Celestial-Frontier\port\v2\apps\game\smoke\species-fullsize`

**Audit scope**

- file integrity;
- catalog completeness;
- image dimensions and format;
- blank/corrupt output;
- clipping and box fit;
- exact duplicate assets;
- taxonomy and broad biological-class routing;
- visual comparability to real-life counterparts;
- species-defining anatomy;
- flora growth form;
- fungal morphology;
- microbial morphology;
- procedural coverage and diversity;
- cross-family consistency;
- release readiness.

---

# 1. Executive verdict

## Technical output verdict

The exported asset library is technically clean.

All **1,254 images** opened successfully:

| Library | Count |
|---|---:|
| Earth fauna | 631 |
| Earth flora | 334 |
| Earth fungi | 27 |
| Earth microbes | 22 |
| Procedural | 240 |
| **Total** | **1,254** |

All files are:

- `440 × 440`;
- RGBA PNG;
- readable;
- non-corrupt;
- consistently framed.

No obvious edge clipping was detected in the automated high-value foreground scan.

The procedural library is also matrix-complete:

- 60 procedural fauna;
- 60 procedural flora;
- 60 procedural fungi;
- 60 procedural microbes;
- all `h0–h2 × s0–s19` combinations present;
- no missing or malformed procedural keys.

## Biological-art verdict

> **The library is not ready for Gold if the requirement is that every Earth organism be visually comparable to its real-life counterpart.**

The current artwork is strongest as a **stylized family-level icon system**.

It is not yet consistently accurate at the **named-species level**.

The largest gaps are:

1. Earth fungi;
2. Earth microbes;
3. Earth flora;
4. specialist Earth fauna;
5. procedural fungi;
6. procedural microbes.

Procedural fauna are the strongest procedural category. Procedural flora have useful broad growth-form variety. Procedural fungi and microbes remain almost entirely color/arrangement variations of one base form.

## Critical distinction

Many Earth entries are routed to the correct broad kingdom or family, but that does not make them comparable to the named real-life organism.

Examples:

- a generic fish is still not an Angelfish, Flounder, Mudskipper, Lionfish, or Barreleye;
- a generic mushroom cluster is not a Truffle, Bracket Fungus, Earthstar, Mold, Yeast, or Lichen;
- a glowing bubble cluster is not a Diatom, Amoeba, Paramecium, Radiolarian, or Tardigrade;
- a generic leafy stem is not Acai, Milkweed, Sesame, Tea Tree, Peanut, or Rhubarb.

The next pass should therefore focus on:

> **signature morphology and canonical growth/body families—not additional color variation.**

---

# 2. Audit methodology

## Automated review

Every file was tested for:

- readability;
- dimensions;
- color mode;
- exact binary duplication;
- procedural naming/coverage;
- foreground edge contact;
- extremely low visible-content candidates;
- filename encoding.

## Visual review

All 1,254 images were reviewed through labeled contact sheets.

High-risk examples were also opened at full size, including:

- Fly Larvae;
- Dragonfly;
- Black Truffle;
- Rafflesia;
- specialist and procedural families.

## Comparison standard

This is a visual morphology and art-direction audit.

The standard used was:

> A named Earth organism should be recognizable without its label through its defining silhouette, anatomy, growth form, or surface pattern.

The art does not need to be photorealistic.

It does need to preserve the organism’s most important real-world identifiers.

---

# 3. Automated test results

# 3.1 File integrity

| Test | Result |
|---|---|
| Corrupt/unreadable images | 0 |
| Wrong dimensions | 0 |
| Wrong image mode | 0 |
| Missing procedural combinations | 0 |
| Malformed procedural names | 0 |
| Strong edge-clipping candidates | 0 |

All libraries use one stable output specification.

**Status: Passed.**

---

# 3.2 Earth count discrepancy to verify

The supplied Earth libraries total:

```text
631 fauna
+ 334 flora
+ 27 fungi
+ 22 microbes
= 1,014 Earth assets
```

Previous project audit language has sometimes referenced **1,010 Earth renders**.

Verify which total is canonical.

Possible explanations include:

- four newly added assets;
- categories formerly excluded from the Earth total;
- outdated audit expectations;
- duplicate or non-game entries.

Do not lock the release manifest until the expected Earth count is authoritative.

---

# 3.3 Exact duplicate Earth-flora files

The audit found **16 exact duplicate groups covering 38 flora files**.

These are not merely similar family templates. The PNG files are byte-for-byte identical within each group.

## Exact duplicate groups

1. Acai / Milkweed / Salmonberry
2. Anise / Yerba Mate
3. Arrowhead / Clover / Fenugreek
4. Beach Pea / Bog Myrtle / Breadnut / Castor Bean
5. Bilberry / Cloudberry / Sesame
6. Bull Kelp / Kelp
7. Crowberry / Licorice
8. Devil’s Club / Rainforest Nettle
9. Dulse / Green Algae
10. Flax / Rhubarb
11. Huckleberry / Monkshood
12. Ice Algae / Snow Algae
13. Licorice Fern / Maidenhair Fern
14. Lingonberry / Wild Chive
15. Oleander / Peanut / Tea Tree
16. Saltbush / Tamarisk

## Release impact

These duplicates create several problems:

- unrelated plants are visually indistinguishable;
- codex identity depends entirely on labels;
- harvesting becomes visually unreliable;
- real-world comparability fails;
- future automated visual audits cannot distinguish the species.

> **Exact canonical-Earth duplicates should be treated as a release blocker.**

Shared art may be acceptable for hidden inventory variants, but not for named organism portraits intended to represent different species.

---

# 3.4 Filename encoding defect

One fungi filename contains broken character encoding:

```text
LionÔÇÖs_Mane.png
```

This should be normalized to a stable canonical filename, such as:

```text
Lions_Mane.png
```

or a correctly encoded Unicode form if the pipeline explicitly supports it.

This can otherwise affect:

- imports;
- cross-platform builds;
- manifests;
- lookup keys;
- automated tests;
- source control.

---

# 3.5 Low-contrast or under-scaled candidates

The automated foreground scan identified several items with unusually low high-value visible occupancy:

- Black Bear;
- Acacia;
- Pineapple;
- one procedural flora form.

This does not mean they are blank.

It indicates that their main silhouette is:

- extremely dark;
- very thin;
- unusually small;
- or visually weak against the background.

The visual review confirms:

- Black Bear loses body detail in darkness;
- Pineapple is under-scaled and does not clearly read as a pineapple plant;
- Acacia’s canopy is dark and narrow in the scan.

---

# 4. Earth fauna — overall assessment

## Status

**Broad class routing: generally successful.**  
**Named-species comparability: inconsistent.**

The catalog has many recognizable successes, particularly where a dedicated species override exists.

Examples of stronger reads include:

- Zebra;
- Tiger;
- Lion;
- Elephant;
- Flamingo;
- Owl;
- Peacock;
- Pelican;
- Pangolin;
- Armadillo;
- Giant Anteater;
- Frilled Lizard;
- Seahorse;
- Sperm Whale;
- Fruit Bat;
- Beaver;
- Red Panda;
- Poison Dart Frog.

However, many species still use broad family scaffolds with insufficient defining anatomy.

---

# 5. Earth fauna — Priority 0 corrections

These are not minor stylization differences. They are incorrect life stage, body family, or defining anatomy.

# 5.1 Insects and other arthropods

## Fly Larvae

Current art:

- fully winged adult fly.

Real-world signature:

- legless or reduced-leg maggot/larva;
- no adult wings;
- elongated soft segmented body.

**Severity: Critical.**

## Dragonfly and Damselfly

Current art:

- wingless elongated nymph-like body;
- no two-pair adult wing system.

Real-world adult signature:

- two visible wing pairs;
- long segmented abdomen;
- large compound eyes;
- six thoracic legs.

Dragonfly and Damselfly should also differ:

- Dragonfly: wings normally held open.
- Damselfly: slimmer body and wings often held together/resting.

**Severity: Critical.**

## Springtail

Current art:

- generic winged insect.

Real-world signature:

- wingless;
- very small compact body;
- springing furcula.

**Severity: Critical.**

## Scorpionfly

Current art:

- generic oval insect body without clear wings or elongated rostrum.

Real-world signature:

- six-legged winged insect;
- long beak-like rostrum;
- some males have a curled scorpion-like abdominal tip.

**Severity: High.**

## Fiddler Crab

Current art:

- symmetrical crab claws.

Real-world signature:

- one dramatically enlarged claw;
- one small feeding claw.

**Severity: High.**

## Horseshoe Crab

Current art:

- generic crab.

Real-world signature:

- broad horseshoe-shaped carapace;
- long rigid tail spine;
- legs largely hidden below.

**Severity: High.**

## Ladybug

Current art:

- generic long-legged insect.

Real-world signature:

- rounded beetle shell;
- red/orange elytra;
- black spots.

**Severity: High.**

## Firefly

Needs:

- beetle shell;
- luminous abdomen;
- clearer separation from generic fly/cricket bodies.

## Water Strider

Needs:

- extremely long surface-spanning legs;
- narrow body;
- clear water-skating anatomy.

## Giant Water Bug

Needs:

- broad flattened body;
- grasping forelegs.

## Diving Beetle

Needs:

- smooth oval beetle body;
- paddle-like hind legs.

---

# 5.2 Fish and aquatic vertebrates

Many fish use one shared fusiform body.

That is acceptable for low-priority background fish, but not for species whose body plan is their defining feature.

## Angelfish

Current:

- generic torpedo fish.

Needs:

- deep laterally compressed body;
- tall dorsal and anal fins;
- trailing fin rays.

## Flounder and Halibut

Current:

- generic side-profile fish.

Needs:

- flattened asymmetrical body;
- both eyes on the same upper side.

## Mudskipper

Current:

- generic fish.

Needs:

- raised eyes;
- strong pectoral fins used for support;
- amphibious body posture.

## Flying Fish

Current:

- generic fish.

Needs:

- extremely enlarged pectoral fins.

## Flying Gurnard

Needs:

- huge fan-like pectoral fins.

## Lionfish

Current:

- generic fish.

Needs:

- long venomous dorsal spines;
- wide fan fins;
- striped pattern.

## Barreleye

Current:

- generic fish.

Needs:

- transparent head dome;
- upward-facing tubular eyes.

## Basking Shark

Needs:

- enormous open filter-feeding mouth;
- broad gill region.

## Whale Shark

Current:

- generic whale/fish body.

Needs:

- broad flat head;
- spotted body;
- filter-feeder mouth.

## Blobfish

Current:

- generic fish.

Needs:

- either a natural deep-water fish representation or the well-known decompressed form;
- current image provides neither signature.

## Lamprey

Current:

- generic eel.

Needs:

- circular sucker mouth;
- multiple gill openings.

## Paddlefish

Needs:

- long paddle-shaped rostrum.

## Tripod Fish

Current:

- generic fish.

Needs:

- elongated pelvic/caudal fin rays supporting a tripod stance.

## Viperfish and Fangtooth

Need:

- oversized teeth;
- deep-sea head;
- reduced but unmistakable predatory body.

## Ocean Sunfish

The body direction is stronger than many fish, but should be broader, truncated, and fin-dominant.

## Cuttlefish

Current:

- shell-like or spherical form.

Needs:

- broad oval mantle;
- lateral fin skirt;
- short arms;
- cephalopod head.

---

# 5.3 Mollusks, cephalopods, and marine invertebrates

## Abalone

Current:

- spiral snail.

Real-world signature:

- flattened ear-shaped shell;
- row of respiratory holes.

## Black/razor/giant clams and oysters

Several use a generic closed horizontal shell.

Differentiate:

- scallop radial ribs;
- razor clam long narrow shell;
- giant clam heavy fluted opening;
- oyster irregular asymmetrical shell.

## Octopus and Giant Octopus

Current:

- too few clearly readable arms;
- highly simplified suspended body.

Needs:

- eight arms;
- thicker irregular arm placement;
- mantle and eye placement.

## Squid and Giant Squid

The horizontal form is directionally good.

Improve:

- eight short arms;
- two longer feeding tentacles;
- mantle fins;
- clearer body taper.

## Nudibranch

Current:

- bead-like worm.

Needs:

- soft slug body;
- dorsal gill plume;
- rhinophores;
- vivid patterning.

## Salp and Pyrosome

Current:

- generic jelly forms.

Needs:

- Salp: translucent barrel or chain.
- Pyrosome: hollow colonial tube.

## Sea Squirt

Needs:

- attached sac body;
- two visible siphons.

## Corals

Current:

- very small, dark, repeated tuft forms.

Needs distinct colony architectures:

- brain;
- branching;
- table;
- fan;
- bubble;
- cold-water branching.

Coral should read as a colony and occupy more of the portrait.

---

# 5.4 Mammals

## African and Asian Elephants

The two are nearly the same.

Differentiate:

- African: larger ears, concave back, larger body.
- Asian: smaller rounded ears, domed head, more arched back.

## Camels

Bactrian and Dromedary have humps, but the body remains a low rectangular ungulate.

Needs:

- long curved neck;
- camel head;
- padded feet;
- integrated hump anatomy.

## Fennec Fox

Current:

- generic canid.

Needs:

- extremely large ears;
- smaller body;
- bushy tail.

## Hyenas

Current:

- generic canine.

Needs:

- sloping back;
- heavy front quarters;
- large head;
- shorter rear legs.

## Koala

Current:

- generic quadruped.

Needs:

- large round ears;
- large nose;
- compact climbing body.

## Panda

Marking direction is useful, but the body is too ungulate-like.

Needs:

- round bear body;
- short legs;
- round face;
- eye patches placed on a bear skull.

## Platypus

Needs:

- much larger bill;
- webbed feet;
- flat tail;
- low aquatic posture.

## Moose

Needs:

- broad palmate antlers;
- overhanging muzzle;
- heavy shoulders;
- larger ears.

## Bison

Needs:

- single dominant shoulder hump;
- lower head;
- heavy forequarters;
- shaggy front;
- smaller hindquarters.

## Bears

Many bear species collapse into dark rounded blobs.

Differentiate:

- Grizzly: shoulder hump.
- Polar: long neck/head.
- Sloth Bear: shag and long muzzle.
- Sun Bear: smaller body.
- Panda: face/roundness.
- Spectacled Bear: face markings.

## Cetaceans

Most whales and dolphins remain short and inflated.

Needs:

- longer bodies;
- stronger tail taper;
- wider flukes;
- species-specific head and dorsal profiles.

High-priority:

- Blue Whale;
- Humpback Whale;
- Beaked Whale;
- Right Whale;
- Gray Whale;
- River Dolphin;
- Beluga;
- Pilot Whale.

## Walrus

Needs:

- larger tusks;
- broad whiskered muzzle;
- low horizontal body;
- clear front flippers.

---

# 5.5 Birds

Many birds share one generic side-view body.

Priority overrides should preserve the simplest defining features.

## Albatross

Needs:

- extremely long wings;
- seabird bill;
- flight-oriented silhouette.

## Cassowary

Needs:

- prominent casque;
- heavy body;
- powerful legs.

## Kiwi

Current:

- tall wader-like body.

Needs:

- round low body;
- long thin bill;
- very short legs;
- no visible wings.

## Kakapo

Needs:

- squat flightless parrot body;
- rounded face;
- heavy posture.

## Secretary Bird

Needs:

- long raptor legs;
- crown feathers;
- eagle-like head.

## Harpy Eagle

Needs:

- heavy raptor head;
- crest;
- powerful talons.

## Hoatzin

Needs:

- prominent crest;
- long tail;
- tropical bird body.

## Kookaburra

Needs:

- oversized kingfisher head and bill.

## Swan

Needs:

- long curved neck;
- broad aquatic body.

## Puffin versus Penguin

Puffin is improved through bill color.

Continue differentiating:

- Puffin: compact auk body, colorful triangular bill.
- Penguin: upright body, flipper arms.

## Waders

Avocet, Spoonbill, Ibis, Snipe, and Godwit require their defining bill shapes.

---

# 6. Earth flora — overall assessment

## Status

> **Earth flora are not ready for a real-world-comparable release.**

The flora library has useful broad templates:

- trees;
- shrubs;
- flowers;
- herbs;
- vines;
- crops;
- grasses;
- aquatic plants;
- roots and harvest items.

However, a large portion of the catalog is identified mainly through:

- label;
- arbitrary color;
- generic leaf ladder;
- generic tree canopy;
- generic bowl/rosette;
- generic vine.

The 16 exact duplicate groups confirm that the problem is not only subjective similarity.

---

# 7. Earth flora — Priority 0 corrections

# 7.1 Remove all exact unrelated duplicates

Every group listed in Section 3.3 needs:

- a correct growth family;
- one or more signature organs;
- a non-identical silhouette.

This should happen before lower-priority botanical polish.

---

# 7.2 Iconic plants

## Rafflesia

Current:

- conventional flower on a long stem.

Real-world signature:

- enormous ground-level bloom;
- no conventional leafy stem;
- thick fleshy spotted petals;
- large central opening.

**Severity: Critical.**

## Pineapple

Current:

- tiny dark rosette with no clear fruit.

Needs:

- broad basal leaf rosette;
- central pineapple fruit;
- crown leaves;
- much larger card occupancy.

**Severity: Critical.**

## Joshua Tree

Current:

- ground-level yucca rosette.

Needs:

- branching woody trunk;
- multiple spiky terminal rosettes.

## Dragon Fruit

Current:

- column cactus.

Needs:

- climbing/branching cactus stems;
- hanging fruit;
- support or epiphytic habit.

## Angel’s Trumpet

Needs:

- woody shrub/tree;
- large hanging trumpet flowers.

## Cabbage

Current:

- generic open bowl.

Needs:

- compact layered leafy head at ground level.

## Rhubarb

Current:

- exact duplicate of Flax.

Needs:

- broad basal leaves;
- thick red or green petioles.

## Cotton

Needs:

- branching plant;
- obvious white cotton bolls.

## Tobacco

Needs:

- very large broad leaves;
- heavy lower foliage.

## Tea Tree

Current:

- exact duplicate of Oleander and Peanut.

Needs:

- woody shrub/tree identity.

---

# 7.3 Fruit trees and attachment

Many fruit trees show fruit floating on or above a generic canopy.

Examples include:

- Apple;
- Mango;
- Coffee;
- Guava;
- Marula;
- Rambutan;
- Jujube;
- Avocado.

Required:

- visible branch/stem attachment;
- species-appropriate fruit clusters;
- plausible canopy placement.

---

# 7.4 Grain and crop families

Wheat, Barley, Rye, Rice, Oats, Millet, Sorghum, Quinoa, Buckwheat, and related crops remain too similar.

Required distinction:

- Wheat: compact spike.
- Barley: long awns.
- Rice: drooping branched panicle.
- Oats: loose hanging panicle.
- Rye: narrow elongated spike.
- Millet: dense clustered panicle.
- Sorghum: broad seed cluster.
- Quinoa: broad branching seed head.
- Buckwheat: broadleaf plant with clustered flowers, not a cereal spike.

---

# 7.5 Aquatic and marine flora

The current library overuses narrow ribbons and faceted seaweed blocks.

Separate:

- Kelp: broad blades with holdfast.
- Bull Kelp: long stipe and gas bladder.
- Sargassum: branching fronds and many air bladders.
- Sea Lettuce: broad thin sheets.
- Red Algae: branching or broad red fronds.
- Coralline Algae: crust or calcified branching.
- Seagrass/Eelgrass: grass-like underwater meadow blades.
- Duckweed: tiny floating leaf mat.
- Bladderwrack: branching fronds with paired bladders.

---

# 7.6 Natural Earth palettes

Many Earth plants use purple, blue, cyan, or glowing colors without a biological reason.

Examples include multiple:

- herbs;
- shrubs;
- fruit plants;
- spices;
- trees.

The project can remain stylized, but canonical Earth organisms should use believable natural palette families unless the card is explicitly showing:

- rarity;
- mutation;
- disease;
- elemental state;
- alien lineage.

Color should not replace anatomy.

---

# 8. Earth fungi — release-blocking findings

## Overall status

> **The 27 Earth fungi are not comparable to their real-life counterparts.**

Almost the entire catalog uses the same three cap-and-stem mushroom cluster with color changes.

This is a systemic body-family failure.

## Clearly incorrect examples

### Black Truffle

Rendered as three tall mushrooms.

A truffle should be:

- underground;
- irregular tuber-like fruiting body;
- no stem or cap.

### Bracket Fungus / Shelf Fungus / Turkey Tail / Chicken-of-the-Woods

Rendered as standard mushrooms.

They should be:

- shelf or bracket colonies attached laterally to wood;
- layered fan structures;
- no central mushroom stems.

### Coral Fungus

Should be branching coral-like fingers.

### Giant Puffball

Should be one or more round ball-like fruiting bodies.

### Earthstar

Should have star-shaped outer rays around a central spore sac.

### Stinkhorn

Should have a distinctive upright stalk and cap/gleba, not a generic mushroom cluster.

### Morel

Should have a deeply pitted honeycomb cap.

### Chanterelle

Should have a funnel/trumpet cap with false gill ridges.

### Lion’s Mane

Should be a hanging white mass of tooth-like spines.

### Enoki

Should be clusters of long very thin stems with small caps.

### Maitake

Should be a dense rosette of overlapping fronds.

### Oyster Mushroom

Should be lateral fan-shaped caps growing in layered clusters.

### Mold and Mildew

Should not be cap-and-stem mushrooms.

Use:

- fuzzy colonies;
- spreading surface patches;
- branching hyphae.

### Yeast

Should be microscopic budding cells, not mushrooms.

### Reindeer Lichen

Should be a branching lichen mat, not mushrooms.

### Cordyceps

Should be club-like parasitic fruiting bodies, ideally with host/substrate context.

## Required fungi renderer

Create at least these canonical structural families:

1. cap-and-stem;
2. bolete;
3. bracket/shelf;
4. coral;
5. puffball;
6. earthstar;
7. stinkhorn;
8. morel;
9. tooth fungus;
10. truffle;
11. jelly fungus;
12. mold/mildew;
13. yeast;
14. lichen;
15. parasitic club/cordyceps.

Color and glow should be layered after structural family selection.

---

# 9. Earth microbes — release-blocking findings

## Overall status

> **The 22 Earth microbe assets are not comparable to the named organisms.**

Nearly every image is the same cluster of translucent glowing circles with changes in:

- color;
- number;
- arrangement;
- glow.

This does not distinguish biological morphology.

## High-priority incorrect examples

### Amoeba

Needs:

- irregular changing pseudopod body;
- visible vacuoles/nucleus.

### Paramecium

Needs:

- elongated slipper shape;
- cilia;
- internal structures.

### Euglena

Needs:

- elongated spindle shape;
- flagellum;
- eyespot;
- chloroplast color.

### Diatom

Needs:

- rigid geometric silica shell;
- radial or bilateral symmetry.

### Dinoflagellate

Needs:

- armored or sculpted cell;
- transverse groove;
- flagella.

### Radiolarian

Needs:

- intricate radial silica skeleton;
- spines.

### Foraminiferan

Needs:

- chambered shell/test;
- branching pseudopodia.

### Cyanobacteria

Needs:

- filament, mat, or colony structure;
- not generic floating bubbles.

### Nitrogen-fixing / sulfur-oxidizing / iron-oxidizing bacteria

These can be stylized, but should use distinct:

- rods;
- cocci;
- filaments;
- chains;
- mats;
- mineral-associated colonies.

### Tardigrade

Current:

- nearly invisible generic cluster.

Needs:

- compact segmented body;
- eight short legs;
- small claws;
- clear water-bear silhouette.

### Red-Tide Algae / Snow Algae / Green Algae

Need recognizable algal forms or colony fields rather than only color changes.

## Required microbe renderer

Create at least these morphology families:

1. amoeboid;
2. ciliate;
3. flagellate;
4. diatom radial;
5. diatom bilateral;
6. dinoflagellate;
7. radiolarian;
8. foraminiferan;
9. coccoid colony;
10. rod colony;
11. filamentous bacteria;
12. cyanobacterial mat;
13. algal colony;
14. planktonic glow field;
15. tardigrade/microscopic animal.

Environmental labels such as:

- thermophile;
- acidophile;
- halophile;
- cryophile;
- methanogen

should modify the morphology/material palette, not replace the need for a base cell form.

---

# 10. Procedural fauna

## Status

> **Procedural fauna are the strongest part of the procedural library.**

The 60 outputs show meaningful structural variety:

- fish/swimmers;
- multi-limbed walkers;
- shelled forms;
- crustaceans;
- jellies;
- serpentine forms;
- cephalopods;
- radial organisms;
- armored and crystalline bodies;
- varied heads and eye layouts.

The material system also remains visible across different body families.

## Strengths

- no missing seed/host combinations;
- broad body-plan diversity;
- useful material differentiation;
- multi-eye traits;
- armor/shell variety;
- aquatic and terrestrial translation;
- readable silhouettes.

## Remaining improvements

### Repeated long-neck walker

Several land forms share:

- long neck;
- small head;
- scalloped torso;
- evenly spaced straight legs.

Add:

- lower heads;
- broad heads;
- radial mouths;
- no-neck predators;
- compact grazers;
- rear-heavy bodies;
- true bipeds;
- asymmetric forms.

### Limb anatomy

Many multi-limbed creatures use evenly distributed straight stilts.

Group limbs into:

- shoulder;
- middle;
- hip

or use clade-specific appendage logic.

### Flight

Winged forms require clear airborne/grounded state handling in runtime, even if the full-size portrait is static.

### Scale

Add metadata/reference cues so tiny and giant procedural life do not appear identical in physical size.

**Release status: Strong, with polish recommended.**

---

# 11. Procedural flora

## Status

Procedural flora show more structural breadth than the Earth flora templates.

Visible families include:

- trees;
- shrubs;
- flowers;
- grasses;
- cacti;
- vines;
- ferns/web-fronds;
- conifers;
- mats;
- aquatic beds;
- crop-like forms.

## Strengths

- complete 60-image matrix;
- varied silhouette;
- useful luminescence;
- multiple canopy forms;
- terrestrial/aquatic-like forms.

## Remaining issues

### Repeated family templates

A significant portion still comes from the same small family set:

- cloud canopy tree;
- flat umbrella tree;
- willow;
- cereal stalk;
- web fern;
- conifer;
- vine.

### Function is unclear

Many forms do not visibly communicate:

- roots;
- substrate attachment;
- reproductive organ;
- harvestable organ;
- aquatic versus aerial suspension.

### Recommended improvements

Add explicit phenotype fields for:

```text
root/holdfast
stem/trunk
leaf/frond
reproductive organ
harvest organ
substrate
scale
luminescent organ
```

**Release status: Usable, but not fully mature.**

---

# 12. Procedural fungi

## Status

> **Procedural fungi lack meaningful structural procedural generation.**

All 60 outputs are essentially:

- three cap-and-stem mushrooms;
- varying height;
- varying color;
- varying glow.

This is color proceduralism, not morphological proceduralism.

## Required expansion

Procedural fungi should combine:

- fungal structural family;
- substrate;
- colony layout;
- spore organ;
- material;
- glow;
- scale.

Minimum structural families:

- gilled mushroom;
- bolete;
- bracket;
- coral fungus;
- puffball;
- earthstar;
- stinkhorn;
- tooth fungus;
- jelly fungus;
- truffle;
- mold mat;
- lichen;
- parasitic tendrils;
- fungal tower;
- underground network/node.

## Procedural opportunities

Alien fungi can support:

- crystal mycelium;
- floating spore bladders;
- magnetic shelves;
- walking fruiting bodies;
- gas-filled caps;
- thermal vents;
- giant colony forests.

**Release status: Not ready as a mature procedural category.**

---

# 13. Procedural microbes

## Status

> **Procedural microbes are the least diverse procedural category.**

All 60 outputs use nearly the same glowing bubble-cluster design.

The primary variations are:

- color;
- bubble size;
- bubble count;
- arrangement.

This does not communicate alien microbial diversity.

## Required expansion

Use multiple cell/colony morphologies:

- rods;
- spirals;
- filaments;
- branching chains;
- plates;
- stars;
- radial shells;
- nested cells;
- membranes;
- flagellates;
- cilia fields;
- colonial sheets;
- biofilms;
- spores;
- multicellular micro-animals.

## Environmental adaptation

Habitat/chemistry should visibly affect:

- membrane thickness;
- mineral shell;
- gas vesicles;
- pigmentation;
- heat/radiation shielding;
- colony arrangement;
- motility organ.

**Release status: Not ready as a mature procedural category.**

---

# 14. Release-blocking issue list

If the release promise includes real-world-comparable Earth organisms, address these before Gold.

## Blocker 1 — Earth fungi

Replace the one generic mushroom family with correct structural families.

## Blocker 2 — Earth microbes

Replace the universal bubble cluster with distinct microbial morphologies.

## Blocker 3 — exact duplicate Earth flora

Remove all 16 exact duplicate groups.

## Blocker 4 — incorrect life-stage/class fauna

At minimum:

- Fly Larvae;
- Dragonfly;
- Damselfly;
- Springtail;
- Scorpionfly.

## Blocker 5 — iconic flora

At minimum:

- Rafflesia;
- Pineapple;
- Joshua Tree;
- Dragon Fruit;
- Rhubarb;
- Cotton;
- Tobacco;
- Tea Tree.

## Blocker 6 — specialist fauna body plans

At minimum:

- Angelfish;
- Flounder;
- Halibut;
- Mudskipper;
- Flying Fish;
- Flying Gurnard;
- Lionfish;
- Barreleye;
- Basking Shark;
- Whale Shark;
- Lamprey;
- Tripod Fish;
- Abalone;
- Octopus;
- Cuttlefish;
- Nudibranch;
- Pyrosome;
- Salp.

## Blocker 7 — canonical manifest count

Resolve 1,014 versus previously referenced 1,010 Earth assets.

## Blocker 8 — malformed filename

Fix Lion’s Mane filename encoding.

---

# 15. Recommended correction order

## Phase 1 — integrity and routing

1. Fix canonical Earth count.
2. Normalize filenames.
3. Remove exact flora duplicates.
4. Add expected biological/growth family metadata.
5. Add automated expected-versus-resolved tests.

## Phase 2 — systemic Earth renderers

1. Fungi structural renderer.
2. Microbe morphology renderer.
3. Specialist insect life-stage renderer.
4. Specialist fish body renderer.
5. Aquatic invertebrate renderer.
6. Iconic flora override set.

## Phase 3 — family-specific fauna polish

1. mammals;
2. birds;
3. fish;
4. reptiles/amphibians;
5. arthropods;
6. marine invertebrates.

## Phase 4 — procedural completion

1. procedural fungi body plans;
2. procedural microbe morphologies;
3. procedural flora organs and substrate;
4. procedural fauna limb/anatomy refinement.

---

# 16. Canonical metadata recommendation

Every Earth organism should have authoritative fields such as:

```yaml
canonical_id:
display_name:
kingdom:
phylum_or_major_group:
biological_class:
art_family:
art_subfamily:
life_stage:
orientation:
signature_traits:
expected_limb_count:
expected_eye_logic:
expected_growth_form:
source_or_harvest_item:
```

Examples:

```yaml
dragonfly:
  biological_class: insect
  life_stage: adult
  art_family: winged_insect
  signature_traits:
    - two_wing_pairs
    - long_segmented_abdomen
    - large_compound_eyes
```

```yaml
black_truffle:
  kingdom: fungi
  art_family: truffle
  signature_traits:
    - underground_tuber_body
    - no_cap
    - no_stem
```

```yaml
rafflesia:
  kingdom: plant
  art_family: ground_flower
  signature_traits:
    - giant_five_lobed_bloom
    - no_normal_stem
    - central_opening
```

The audit should compare this manifest against the resolved renderer.

---

# 17. Automated regression recommendations

Add permanent Gold sheets and assertions for:

## Fauna

- adult versus larval insect;
- wing count;
- limb count;
- front/side eye logic;
- flatfish;
- ray;
- shark;
- cetacean;
- cephalopod arm count;
- iconic mammal markers.

## Flora

- exact duplicate detection;
- growth family;
- source versus harvest item;
- iconic plant override;
- aquatic family.

## Fungi

- one sentinel for every structural family.

## Microbes

- one sentinel for every morphology family.

## Procedural

- every `h × s` key;
- silhouette diversity floor;
- family coverage;
- no single family exceeding a chosen percentage;
- habitat/trait compatibility.

---

# 18. Final decision

## Technical export

**Passed.**

## Procedural fauna

**Strong and usable.**

## Procedural flora

**Usable with additional depth recommended.**

## Earth fauna

**Broadly routed, but many named organisms require signature-anatomy corrections.**

## Earth flora

**Not ready under a strict real-world-comparability standard.**

## Earth fungi

**Not ready.**

## Earth microbes

**Not ready.**

## Procedural fungi

**Not ready as a mature procedural system.**

## Procedural microbes

**Not ready as a mature procedural system.**

## Overall

> **Do not certify this full species output as biologically Gold yet.**

The technical pipeline is healthy.

The art pipeline now needs a focused biological-specificity pass, with the highest priority on:

```text
fungi
→ microbes
→ exact flora duplicates
→ incorrect insect life stages
→ specialist fish/invertebrates
→ iconic plants and mammals
```

The correct next milestone is not another universal recolor or broad style change.

It is:

> **A canonical morphology pass that makes every Earth label visually earned.**
