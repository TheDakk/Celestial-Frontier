# Celestial Frontier — Master Art Direction

**STATUS:** matches code as of 2026-07-24 (verified against main.js).
**The single source of truth for ALL organism, biome, vista, and color art.**
Consolidates every art-direction document + every decision from the 2026-07-20 art
session. When this and a source upload disagree, THIS file wins (it records the
decisions we actually made). Content catalogs (`BIOME_ATLAS.md`, the fauna/flora
data-pack CSVs) remain the *content* source of truth; this is the *direction* source
of truth.

---

## 0. Source documents (Nick's uploads, all folded in here)

1. **Earth Bestiary Art-Direction Review (pages 1–12)** — first fauna critique.
2. **Unified Art-Direction Bible** (`01`) + **Fauna A–M** (`02`) + **Fauna N–Z** (`03`)
   + **Flora A–Z** (`04`) + **Procedural** (`05`) — the 5-file bible; per-entry
   {group, base rig, required anatomy, species cues, avoid, priority}.
3. **Head & Face Supplement** (`06`) — heads as a first-class identity system.
4. **Complete Art-Source Review & Fix Plan** — card-by-card review; the P0 wrong-class
   bindings + validation-gate idea.
5. **Deterministic Cosmic Color Atlas** — the "Color DNA" upgrade to `BIOME_ATLAS.md`.
6. **Procedural Organism Integration & Flora Addendum** — curated-ecosystem procedural.
7. **Flora Review & Recommendations** — botanical specificity second pass.
8. **Biome Vista Integration & Color Application** — vistas as living ecosystems.

Counts referenced: ~1046 fauna, 569 flora, 758 procedural traits, ~450 core biomes
(93 Earth + 315 non-Earth + 43 live implementations + additional).

---

## 1. Core principles (the north star)

- **2-second silhouette test.** Hide the label at thumbnail size: broad biological
  group readable in <2s; ≥3 named-organism identity traits; how it moves/grows/feeds;
  Earth-grounded vs procedurally alien.
- **Earth = real anatomy first.** May simplify muscle/joint/texture/exact color. May
  NOT remove: correct limb count, the defining head/bill/snout/shell/fin/wing/leaf/
  root, correct posture, the signature silhouette, or the sessile-vs-mobile difference.
- **Anatomy ≠ VFX.** A glow can't replace a missing organ.
- **One dominant visual idea.** Secondary traits support it; don't stack every effect.
- **Effect intensity scales with rarity** — but rarity affects UI/effects ONLY, never
  the physical body/planet color (corrected from the earlier "rarer = more saturated").
- **Plant stat is a SECONDARY layer** (pose/accent/aura), never replaces botany.
- **Keep the minimalist painterly style.** Accuracy comes from silhouette, head shape,
  appendage structure, and species anatomy — NOT from added realism or texture noise.
- **Style constants to preserve:** near-black navy card, warm serif headings, restrained
  colored halo, soft rim light, subtle ground shadow, limited controlled palette.

---

## 2. Decisions LOCKED this session

| Decision | Choice |
|---|---|
| **Earth fauna depth** | **Everything** (full per-species) — known, finite, scrutinized. |
| **Earth flora depth** | **Everything** (full per-species) — same reasoning. |
| **Procedural (fauna+flora)** | **Systematic**: body/growth families + hero + BIOME-INHERITED palette & physics. A *curated ecosystem*, never a random part-mixer. No per-individual tuning. |
| **Phase 4 (biome/color/vista)** | **IN** this build (v1.6), not deferred. |
| **Architecture** | Everything hangs off the **Biome Profile** (see §3). |
| **Execution of "everything"** | Marquee-first, then continue class-by-class to full coverage. Genuinely-similar real species (sparrows, small rodents) converge to correct-class + accurate color — that's fidelity to the reference, not a shortcut. |

**Determinism split (critical):** Earth-name-gated art (fauna rigs, flora rigs) and the
color atlas (pure lookup, render-only) are **fingerprint-safe → no re-pin**. The
**procedural rebuild changes procedural art, which IS the 50-probe fingerprint → it
needs a Nick-authorized baseline RE-PIN.** That is the ONLY hard gate remaining.

> **`P.hue` AUDIT RESULT (2026-07-20): RENDER-ONLY.** Every reader of `P.hue`/`seaHue`/
> `landHue`/`iceAmt`/`spotHue` is a rendering function (`surfaceColor`, `gasPalette`,
> `_hdDeckScene`, the sprite painter); NOTHING generative (`planetSpecies`, `realmBiome`,
> `classifyRealm`, `climateBand`, `planetDescriptor`) reads it. So the whole Phase-4 color
> rework is fingerprint-safe **as long as color resolves at render time and
> `planetParams`' RNG stream is left untouched** — confirming the split above.
>
> **v1.6 BUILT (2026-07-20):** `COLOR_ATLAS` (`resolveBodyPalette`/`resolveVistaTint`/
> `resolveMapDot`, pure lookup, physical hexes are swappable defaults for the authored
> atlas) · `BIOME_PROFILES` (§3, 43 live biomes) + `biomeProfile`/`colorDNAFor` · flora
> per-species differentiation (§5). Gated by `tools/{coloratlas,biomeprofile,render}-audit`.
> vista integration BUILT (`_hdVistaEco` in `hdVista`: biome-native flora+fauna rig
> silhouettes + atmosphere fx, driven by `BIOME_PROFILES[opts.wb]`, render-only).
> REMAINING: the procedural coherence rebuild — and per the DETERMINISM finding (the
> fingerprint pins `hdGenesFor` genes, not pixels), its DRAWING-layer improvements are
> **render-only → likely NO re-pin**; re-pin only if gene-layer coherence fields are added.
> Vista follow-ups: cut the repeated river motif; feed `colorDNAFor` into layer palettes.

> **★ v1.6 FINAL-REVIEW STATE (2026-07-20) — THE ART SYSTEM AS BUILT (all render-only, fp 50/50):**
> - **BOX-FIT** (`_fitBeast`/`_fitPlant` in the portrait painters): every organism is measured
>   (`_beastBBox`, getImageData) + rescaled to a per-FAMILY occupancy target (`_FIT` table,
>   review §6.1). Card = normalized readability. Fixes universal "too big / too small".
> - **VISTA REAL-SCALE** (`_vistaSizeScale`, size gene → 0.5–1.8×, multiplies each
>   `_hdPlaceBeast` scale): in-scene creatures scale by REAL size (whale looms, beetle a
>   speck) — the deliberate opposite of box-fit. Camo cut so the world's roster reads.
> - **FAUNA RIGS** (17 + legacy): all Earth species classify to a rig (`_earthArt` →
>   `_beastFamily`); marker work per Nick's reviews — cetacean heads (sperm block / beluga
>   melon / orca tall dorsal / dolphin rostrum), fusiform whales, shark torpedo, manta wings,
>   octopus asymmetric arms, Giant Conch spiral shell, coral colony masses (brain/staghorn/
>   table/fan/bubble), owl facial disc, walrus tusks, frog crouch, bison/moose front mass,
>   lion mane (FELINE-ONLY — the equine mane must NOT get the ruff, was the zebra bug),
>   kangaroo hopper, gorilla shoulders, chameleon compact-on-perch, fox bushy tail.
> - **FLORA**: `_earthFlora` classifier + `_hdPlantBare` forms (tree tforms weep/baobab/
>   acacia, conifer cforms spire/layered/bushy/dense/round/columnar, flower fforms, cactus
>   rosette, banana, corn cob, water-lily float, cattail, etc.).
> - **PROCEDURAL**: `_procFamily(G,seed)` (in `hdBeastBare`, render-only) routes non-Earth
>   genomes to coherent families (serpent/jelly/sessile-radial/ceph/insect/crust/fish-swimmer)
>   so the pool is real clade diversity, not one bead-chain. Land grazers keep the alien plan
>   body. `hdGenesFor` sets `R._earthName` ONLY for Earth genes (fingerprint-safe guard so
>   legacy Earth never mis-routes). Procedural flora growth families assigned in `hdPortraitFlora`.
> - **DETERMINISM**: ALL of the above is render-only. `R._earthName` guard is Earth-only, which
>   the procedural fingerprint probe never exercises → fp stays 50/50. NO re-pin used.
> - **PASS 3 CORRECTIONS (2026-07-21, render-only, fp 50/50):** BISON no longer double-humped —
>   the camelid dorsal-fat `hump` is now camel/dromedary/bactrian ONLY; bison/zebu carry a
>   WITHERS hump (drawing both read as "a camel with multiple bumps"). New `lowHead` flag
>   (bovines) drops head carriage off the hump; `heavyLeg` legs shortened (0.52→0.42) &
>   thickened (ungulate legW 0.030→0.044); withers hump made dominant + fore-shoulder mass so
>   fore-quarters out-bulk the rump. MOOSE antlers rebuilt as broad flat palmate blades w/ finger
>   tines (not branched) + overhanging bulbous muzzle + throat bell + big ears (all gated on
>   orn==='palmate' = moose-only). CHAMELEON: tightly coiled spiral prehensile tail, tall
>   backswept casque, zygodactyl grasping mittens on a perch, higher body arch — no longer a
>   generic lizard. WALRUS: `walr`(=tuskM)-gated LOW horizontal body (seals still rear up),
>   heavy fore-shoulder mass, clear planted fore flipper, broader muzzle + thicker long tusks.
>   CORAL: brain = rounded grooved MOUND (narrowed so box-fit stops flattening it), bubble =
>   full packed polyp cluster. CEPH: squid + cuttlefish rebuilt HORIZONTAL (torpedo/broad mantle
>   tail-left, fins, arms + 2 long feeding tentacles right); `giantC` flag → giant squid gets
>   much longer tentacles + bigger bulk; octopus arms thicker + unevenly spaced/varied-length.
> - **PASS 4 CATALOG-INTEGRITY (2026-07-21, render-only + Earth-only classifier, fp 50/50):**
>   the Full-Earth-catalog review found the real remaining risk was NAME->RIG ROUTING, not
>   morphology. Fixed all P0 wrong-class bugs: `\bboa\b` (Boar/Jerboa were snakes), `\basp\b`
>   (Wasp was a snake), `\bfly\b` (Flying Squirrel was an insect via "fly"), `\bhog\b`
>   (Hedgehog was an ungulate); +20 missing fish names (gar/bowfin/sculpin/mudskipper/
>   fangtooth/… were mammal-fallback quadrupeds) with `\bplaty\b`/`\bmolly\b` guards; generic
>   & aquatic insects (+ a !bat guard so "Insect-Eating Bat" reaches the bat rig); water
>   flea->crust; chiton->new sessile plated form; tardigrade->new arachnid water-bear form.
>   NEW `_rigBat` (mammalian torso + membrane on finger struts + ears + feet; fruit/micro
>   sub) replaces the legacy insect-like winged blob. Dragonfly/damselfly rig rebuilt (4
>   broad wings + segmented abdomen). CAMEL/TALL-HEAD CUTOFF fixed: ungulate head carriage
>   was drawn so high that long necks + tall horns clipped the 300px silhouette-canvas top
>   (box-fit can't recover a source clip) — lowered head/neck + trimmed tallest horns.
>   FLORA: Date Plum->fruit tree (was 'palm' via "date"), Water Hemlock->flower (was
>   'conifer' via "hemlock"). GATE: `tools/rig-audit.js` expected-class table now 170
>   sentinels covering every P0 name — build FAILS on any wrong-class regression.
> - **REMAINING (last art batch, all render-only):** deeper vista-painter integration
>   (coral-shallows reef treatment; bioluminescent/ember RIM light + contrast for jungle/
>   abyssal/ash fauna; stronger contact shadows/occlusion) · procedural WITHIN-clade variation
>   (feeding heads / foot types / propulsion, orientation clarity) · cedar/juniper organic
>   shaping · barrel-cactus-fruit form + source-vs-harvest-item decision.

---

## 3. The unifying architecture — the Biome Profile

Color, flora, fauna, procedural, and vistas are **one system**. Build a **Biome Profile
registry**: one record per biome —

```
BiomeProfile {
  colorDNA          // from the Cosmic Color Atlas (§6)
  nativeFloraFamilies   // which plant rigs grow here
  nativeFaunaFamilies   // which creature rigs live here
  proceduralPools       // biome-native generation pools
  niches            // canopy / ground / burrow / shore / flight / open-water / cavern / thermal / cloud
  weatherStates
  hazards
}
```

Everything then reads from it:
- **Vistas** compose a scene from the profile (color atlas paints every layer; flora
  masses + fauna silhouettes + a procedural cue fill fg/mid/bg).
- **Procedural gen** starts from the profile (planet → biome → chemistry → niche →
  family → anomaly), inheriting the biome's palette + physics.
- **Map dots & portraits** use the same Color DNA.

**Key synergy:** the vista occupancy layer REUSES the card rigs (`hdBeastBare` fauna,
`_hdPlantBare` flora) as tiny silhouettes → cross-view coherence for free.

---

## 4. FAUNA

### 4.1 Rig library — BUILT (17 rigs, in `hdBeastBare`, dispatched on `G.rig`, gated on `_earthName`)

`_rigBird` (raptor/owl/wader/waterfowl/songbird/ratite/penguin/parrot) · `_rigFish`
(bony/shark/ray/seahorse/puffer/bill/sunfish/angler/flat) · `_rigMarine` (whale/dolphin/
seal/sirenian) · `_rigInsect` · `_rigArachnid` · `_rigCrust` · `_rigSessile` (star/urchin/
cucumber/sponge/squirt/coral/anemone/bivalve) · `_rigPrimate` (ape/monkey/lemur) ·
`_rigJelly` · `_rigMammal` (feline/canid/ungulate/bear/rodent/mustelid/rabbit/marsupial/
hopper) · `_rigReptile` (lizard/croc/chameleon) · `_rigSerpent` (smooth, hood/viper/rattle)
· `_rigAmphibian` (frog/salamander/axolotl) · `_rigTurtle`. Elephant/rhino/giraffe keep distinct renders; winged (bat) stays on the legacy path.

**v1.6 additions (task D, 2026-07-20):**
- **`_rigGastropod`** (`G.rig==='gastropod'`) — creeping foot + eye-stalk tentacles + shell by `gshape`: coiled spiral (snail) / spire (conch/whelk) / low cone (limpet) / none (slug). Replaces the old legacy shelled-body path for snails.
- **`_rigCeph`** (`G.rig==='ceph'`) — the cephalopod SPLIT, by `cephk`: octopus (domed mantle + 8 arms) / squid (torpedo mantle + fins + 2 clubbed tentacles) / cuttlefish (broad finned mantle) / nautilus (coiled chambered shell + tentacle bunch). Replaces the single legacy `G.ceph` octopus.
- **`_rigSessile` coral architectures** — `G.coralA`: brain / staghorn / table / fan / bubble / branch.
- **`_rigMammal` cat sub-rigs** — `G.fsub`: heavy (lion/tiger) / speed (cheetah) / mountain (cougar, xlong tail) / lynx (bob tail + ear tufts). Feline body sharpened (deeper chest, thicker legs, fuller lion mane).
- **`_rigMarine` cetacean heads** — `G.headSquare` (sperm blunt forehead) / `G.melon` (beluga/pilot) / `G.dorsalTall` (orca).
- **BUGFIX:** the plan-based `shelled`/`tent`/`crys` body add-ons in `hdBeastBare` are now gated on `!G.rig` (they were double-drawing a stray dome/mantle on rigged species). Fingerprint-safe (procedural sets neither `rig` nor `ceph`).

### 4.2 Head system — BUILT (Head Supplement `06`)

Head-first order: body plan → head silhouette → muzzle/bill → eyes → ears → ornament →
neck merge. Family-distinct skulls/muzzles/ears; **antler ≠ horn ≠ ossicone ≠ hump**
(deer branched / moose palmate / bovid curved / ram spiral / okapi ossicone; camel
1-hump dromedary / 2-hump bactrian; bison hump; equine mane). Bird beaks, fish snouts/
rostra/cephalofoil, croc snouts, amphibian gills carry head cues from their rigs.

### 4.3 P0 — WRONG-CLASS BINDINGS (verified real, fix FIRST, ~1hr, fingerprint-safe)

| Label | Collision | Fix |
|---|---|---|
| Swallowtail | "swallow" (bird) | `swallow\b` + add to insect |
| Rhino Beetle | "rhino" (mammal) | guard rhino `!beetle` |
| Crown-of-Thorns | "crow" (bird) | `\bcrow\b` + add to sessile-star |
| Spider Monkey | "spider" (arachnid) | guard spider `!monkey` |
| Whelk | "elk" (ungulate) | `\belk\b` |
| Black Widow | none → mammal | add `widow` to arachnid |
| Blue Tang | none → mammal | add `\btang\b` to fish |
| Vervet | none → mammal | add to primate |
| Periwinkle | none → mammal | add to gastropod |
| Barnacle | routed to mobile crustacean | route to sessile cone |

*(Angelfish "lure" claim in the review is WRONG — ours renders as a normal fusiform
fish, no lure.)*

### 4.4 VALIDATION GATE (permanent battery check)

Promote `rig-audit.js` to a build gate: a `class → allowed-rig` table that FAILS the
build on any wrong binding (insect w/ 4 vertebrate legs, fish w/ paws, sessile that
walks, gastropod w/ a vertebrate neck…). Kills this bug class permanently.

### 4.5 MISSING rigs / sub-rigs to build

- **Gastropod** (foot + coiled shell + head tentacles, NO legs, no mammal neck) — snails
  currently use the legged "shelled" body.
- **Coral colony architectures** (brain mound-w/-grooves / staghorn branching / table
  plate / fan / bubble / elkhorn) — currently one tentacle-tube.
- **Cephalopod split** (octopus mantle+8 arms · squid torpedo+fins+8+2 · cuttlefish
  fin-skirt · nautilus coiled shell) — currently octopus template for all.
- **Cat sub-rigs** (heavy big-cat / speed cheetah / mountain snow-leopard / short-tail
  tufted lynx / small cat) — heads must change with sub-rig, not just color.
- **Cetacean head/dorsal differences** (orca tall fin+saddle · sperm square head ·
  beluga melon+no-dorsal · humpback long flippers · bottlenose rostrum · right-whale jaw).

### 4.6 Species-trait approach (the "everything" marathon)

Class-by-class, hero species first (the review's mandatory-3-traits table = the
checklist: moose/giraffe/lion/cheetah/polar-bear/flamingo/spoonbill/hammerhead/
manta/axolotl…), then the tail. Proof-sheet each class. Presentation polish (context
shadows fly/swim/sessile, scale cue, light edge/roughness material separation) last.

---

## 5. FLORA

### 5.1 Status: growth-form DONE → full per-species PENDING

Built: `_earthFlora(name)` classifier + `_hdPlantBare` form dispatch (tree/palm/conifer/
shrub/herb/flower/grass/cactus/fern/vine/seaweed/crop/root/moss/trap) + plant-stat
accent layer. Decision: take Earth flora to **full per-species**.

### 5.2 Required flora rig families (~20, Flora Review §6)

broad-canopy deciduous · columnar conifer · open-canopy savanna tree · swollen-trunk
tree · palm · round shrub · flowering shrub · vine/climber · reed/sedge/cattail · crop
grass · broadleaf herb · root crop · cactus column · cactus pad · succulent rosette ·
fern · moss/lichen mat · kelp/seaweed ribbon · floating aquatic pad · carnivorous trap.

### 5.3 Per-species botanical fixes (Flora Review §4)

**Trees:** willow droops (pendulous curtains) · redwood columnar trunk-dominant (not a
Christmas tree) · scots pine open tufted crown · douglas fir dense conical · blue spruce
compact · baobab swollen iconic trunk · acacia flat-topped savanna · oak heavy gnarled ·
birch slim/airy · olive twisted/irregular · fruit trees orchard-shaped w/ blossom/fruit.
**Flowers:** rose layered bloom+thorns · sunflower big disc+ray petals · tulip cup ·
orchid asymmetric exotic · lavender vertical spikes · daisy white petals+disc · iris
sword leaves. **Herbs:** basil round clusters · rosemary woody needles · mint opposite
leaves · sage gray broad leaves. **Crops:** wheat awned head · barley long awns · rice
drooping panicle · corn thick stalk+ear. **Roots:** carrot feathery top+orange root ·
ginger reed+rhizome. **Cactus:** saguaro trunk+arms · prickly pear stacked pads · aloe
radial rosette. **Aquatic/moss:** kelp ribbon blades · sea lettuce sheets · sargassum
bladders · cattail brown cigar head · duckweed floating mat · water lily/lotus floating
pad context · sphagnum bog mat · reindeer lichen branching coral-pale · spanish moss
draped strands · liverwort flat thalloid · horsetail jointed/segmented. **Vines:**
grape lobed leaves+clusters · ivy small leaves along stem · morning glory trumpet flowers.
**Carnivorous:** flytrap open jaws · pitcher tube+lip · sundew sticky glands.
**Harvest identity:** every plant should imply its harvest part (leaf/flower/fruit/seed/
root/sap/pod/stalk/frond/spore). **Stat language** (Vitality full/fleshy · Ferocity
thorned/serrated · Resilience woody/dense · Agility light/airy · Insight luminous/
patterned) stays a secondary layer, never replaces species identity.

---

## 6. BIOMES & COLOR (Phase 4)

### 6.1 Content: `BIOME_ATLAS.md` — the biome catalog (43 live + 93 Earth + 315 non-Earth + additional)

### 6.2 Color: the Deterministic Cosmic Color Atlas = color-resolution source of truth

- **Color DNA, not one hex.** A planet resolves from FIXED LOOKUP TABLES keyed by
  physical props: host-star class, atmosphere/cloud chemistry, surface material, liquid,
  ice, biosphere pigment, biome coverage, weather, artificial, rarity(UI only).
- **Physical color ≠ theme color** (two fields). Fire theme ≠ orange base. Acid ≠ auto
  neon-green. Sulfuric-acid clouds read cream from orbit.
- **Rarity → UI/effects ONLY** (border/ring/halo/particles), never the physical body.
- **Stars follow temperature** (red-orange → warm-white → white → blue-white). No
  green/purple/rainbow main-sequence stars.
- **Gas giants from cloud chemistry**, not hydrogen. **Multi-biome = coverage-weighted
  blend** (not first-listed biome). Mix in linear-RGB / OKLCH, not naive sRGB average.
- Ready-made hex libraries: stars §6, atmospheres §9, cloud condensates §9.3, surfaces
  §10, liquids §11, biosphere pigments §12, revised multi-hex live-biome palettes §13,
  Earth-family §14, theme accents §16.
- **Build as `COLOR_ATLAS`**: pure deterministic lookup functions (`resolveBodyPalette`,
  `resolveVistaTint`, `resolveMapDot`). Deterministic BY CONSTRUCTION (no `mulberry32`
  in the color path).
- **Map-dot:** segmented (center=orbit_primary · lower-left=surface/liquid · upper-right=
  atmosphere/cloud · outer ring=body class · notch=habitability · thin glow=rarity UI).
- **⚠ Audit first:** is `P.hue` render-only (→ fingerprint-safe) or does it seed gen
  (→ re-pin)? Determines whether Phase 4 color is free.

---

## 7. VISTAS — living ecosystems (Biome Vista Integration)

Current vistas read as beautiful-but-sparse backdrops. Fix = **ecological occupancy**.

- **Assembly stack:** sky/star-light → atmosphere/haze → far terrain → midground terrain
  identity → biome-defining flora masses → fauna silhouettes → procedural/anomaly cue →
  gameplay-readable foreground.
- **5 ecology layers per landing:** A atmosphere · B geology · C flora identity · D fauna
  identity · E procedural extension.
- **Density (curated, not clutter):** 2–4 flora families + 1–3 fauna cues + 0–2 procedural
  per scene, across fg/mid/bg scale tiers.
- **Color on ALL layers** (sky/atmosphere/terrain/water/flora/accent/hazard), not a full-
  screen multiply. Tint max: Earth-like 5–12% · unusual atmosphere 10–20% · extreme
  elemental 15–30% · anomalous/void/prismatic 20–35%. Palette usage ~60–70% primary /
  20–30% secondary / 5–10% accent / 0–5% emissive.
- **Cut the repeated white river/path motif** (it's in nearly every terran scene). Add
  biome-specific fg anchors (rock/crystal/driftwood/geyser/fungal cap/lava shelf) +
  atmosphere fx (marsh mist, salt shimmer, ash, cryo steam, acid halo, abyssal beams).
- **Physics respected:** NO terrestrial trees/walking animals on gas giants — floating/
  sail/gasbag life only. Venus reads cream/tan/sulfur, not green. Lava life at margins.
- **Per-biome "assembly kit" + "native ecosystem sheet"**: canonical flora families,
  fauna families, procedural families, accent palette, weather + hazard states.
- **REUSE the card rigs** as vista silhouettes → cross-view coherence.

### 7.1 v1.7 vista/material art (2026-07-23)

- **Seeded river courses** (`rvQ`); roads pick the **opposite bank** from the river mouth
  (`_rivMouthX`).
- **Titan contact skirt** grounding the titan into the terrain; **at-sea titans get a
  mirrored reflection**.
- **Space-era skyline haze skirt** — the skyline is seated into the ridge, not floating.
- **Fauna ground-leveling** — the sprite's true lowest opaque row is measured in
  `hdBeastBare` so creatures stand on the ground, not hover above it.
- **`_MAT_ART`** — bespoke per-material icon registry (all 47 materials), superseding the
  old 4-archetype recolor.
- **`partIcon`** — tier-dress + function-emblem motifs for crafted parts.
- **`shipImage` / `paperdollAvatar`** — 2x backing store for crispness.
- **Star thumbnails** — MAG (field loops), PROTO (dusty disk + jets), and swollen RG/SG
  giants.
- **GAS BIOMES ARE ALIVE** — `_hdDeckScene` now paints a gas giant's real aerial ecosystem:
  floating cloud-gardens (its `af` flora via `_hdPlantBare`), gas-bladder colonies +
  aeroplankton, and its real AIR CREATURES as flying silhouettes drawn from `hdBeastBare`
  (same genome as their Compendium portrait). `openLandingVista` threads `airGenes` /
  `aerFlora` through `xtra` → `showVistaBox` → `_hdDeckScene`. Gated on **any aerial life**
  (was gated on the ~always-zero macrofauna air-count, so gas giants looked lifeless).
- **VISTA FLORA = THE REAL SPECIES** — extracted `_floraSpx(g)` + `hdFloraBare(g,seed)` (the
  flora parallel to `hdBeastBare`) out of `hdPortraitFlora` (byte-identical refactor). The
  vista's plant canvases are now the world's ACTUAL terrestrial flora species when it carries
  flora genes (a desert draws its cacti, a jungle its broadleaves, a meadow its ferns) — the
  same art as their Compendium page. Flora-less worlds keep the tuned generic dressing
  (fallback). Coherence: the plant on the planet is the one in your Compendium, matching how
  creatures already share `hdBeastBare` across portrait/card/vista.
- **THE LANDING ROLL (vista side)** — the touch-down REGION is rolled per landing and the
  vista's fauna are picked to MATCH it: species whose rig family belongs in the rolled biome
  (BIOME_SETS fauna list), seeded-shuffled per landing so repeat descents meet different
  locals. A terran world whose roll came up a SEA region shows the shore/sea scene. (Generation
  side of the roll: WORLD_GENERATION.md `biomeForLanding`.)
- **RIVERS ON SETTLED WORLDS** — on iron/town worlds (the only ones with roads) the seeded
  river now keeps to its OWN bank the whole way down (spring pulled to the mouth side,
  meanders damped, bowing outward only) so it never crosses the road or the field quads; wild
  worlds keep full meander freedom.

---

## 8. PROCEDURAL — curated ecosystem, not a part-mixer (⚠ RE-PIN gated)

Current: procedural fauna = 2 base outcomes (beaded quadruped / beaded swimmer);
procedural flora = one canopy-tree, palette-swapped. The fix:

- **Generation order:** planet class → biome → chemistry/atmosphere → habitat niche →
  base body family → movement/growth family → surface/tissue → head/reproductive
  structure → accent → behavior/rarity/anomaly. Violating the order = arbitrary.
- **More flora families** (Addendum §4): arboreal (canopy/columnar/umbrella/crystal/
  bulbous/floating/candelabra) · shrub-colony · vertical (reed/spire/lantern/whip/cane/
  mineral-stalk) · ground-mat (moss/lichen/pad/thorn-cushion/vine-net/root-lattice) ·
  water-buoyancy (float-pad/raft/bladder/ribbon-kelp/cloud-kelp/gas-sac) · hazard-anomaly
  (flame-frond/frost-fern/acid-bladder/prism-frill/void-filament/lumen-tree).
- **More fauna archetypes** (§5.1) beyond quad/fish/bug — the full ecological body set.
- **Biome inheritance is rule #1:** body color from biome+ecology; accent expresses
  role/danger/bloom/toxin/anomaly; emissive sparse; **rare ≠ rainbow**. Palette stack:
  biome-primary → biome-secondary → ecological material → species accent → rarity/anomaly.
- **Biome adaptation** (geode→crystal plates+cave eyes · marsh→long legs+broad feet ·
  desert→heat-dissipating+pale · acid→float sacs+droplet membrane · lava→heat shield+
  obsidian scales+ember seams · cryo→compact insulation · abyssal→pressure+sparse lumens).
- **Anomaly sparse & additive**, applied only after core ecology is valid.
- **Generator fields** to add — flora: `flora_family, growth_habit, habitat_niche,
  harvest_part, surface_material, reproductive_structure, biome_palette_family,
  accent_function, anomaly_flag`; fauna: `body_family, limb_family, head_family,
  surface_covering, diet_type, movement_type, habitat_niche, biome_palette_family,
  defense_feature, anomaly_flag`. Build **biome-native preset pools** so gen starts from
  a local rule set, not the universal library.
- Goal: *"every generated organism should look surprising, but inevitable for its world."*

---

## 9. DETERMINISM RULES (hard constraints)

- **Never break determinism.** All world/genome/descriptor content derives from seeds
  (`mulberry32`, `hashInt`, `cellRng`). No `Math.random`/`Date.now` in domain modules.
- **Art is NOT fingerprinted** — canvas rendering isn't in the 50-probe fingerprint. So
  Earth-name-gated organism art + the color-atlas lookup (if render-only) are FREE.
- **Procedural (un-named) art IS the fingerprint.** Changing it → Nick-authorized
  baseline re-pin (single-key only, prove other probes byte-identical, inline note).
- **`P.hue` audit** decides if Phase-4 planet color is render-only (free) or seeds gen (re-pin).
- **GOTCHA:** never write `\b` in a `node -e` JS string literal — JS turns it into 0x08
  BACKSPACE = silently dead regex. Edit regexes with the Edit tool, or convert via an
  explicit char-code map (`[...s].map(c=>c.charCodeAt(0)===8?"\\b":c)`).
- After every edit batch: `node tools/validate.js` must stay **FINGERPRINT 50/50**.

---

## 10. BUILD ORDER & STATUS

**DONE this session (all fingerprint-safe, 50/50 held):** 15 fauna rigs + family-distinct
heads · flora growth-form rebuild + plant-stat · `BIOME_ATLAS.md` · full proof-sheet set
(fauna per-type, flora Earth+procedural, all vistas) · classifier collision hardening.

**PENDING, in order:**
1. **P0 wrong-class fixes + validation gate** (§4.3–4.4) — ~1hr, unblocks fauna.
2. **Missing fauna rigs** (§4.5: gastropod, coral architectures, cephalopod split, cat
   sub-rigs, cetacean heads).
3. **`COLOR_ATLAS` module + `P.hue` audit** (§6) — the deterministic color foundation.
4. **Biome Profile registry** (§3) — the connective tissue.
5. Then in sequence: **Earth fauna "everything"** (§4.6) · **Earth flora full per-species**
   (§5) · **vista ecosystem integration** (§7, reuses rigs) · **procedural curated
   rebuild** (§8) — the last one on Nick's **re-pin go-ahead**.
6. **Phase 8**: copy/de-dash + full QA battery + 6k beta + deploy v1.6, once art is locked.

---

## 11. KEY CODE MAP (line #s drift; function names stable)

- **Classifiers:** `_earthArt(name)` ~L4378 (fauna → rig+dials; keyword branches, ORDER
  matters, use `\b` boundaries) · merged into genome in `hdGenesFor` ~L4451 at the
  `if(g._earthName){…Object.assign(R,rec)}` gate · `_earthFlora(name)` ~L5740 (flora → form).
- **Fauna rigs:** `hdBeastBare` ~L5243; `if(G.rig==='…')` dispatch chain; the 15
  `_rig*` functions (see §4.1) each return `{hp,hips,shoulders,feetMax,noEye}`.
- **Flora:** `_hdPlantBare(seed,sp)` ~L5488 (dispatches on `sp.form`); `hdPortraitFlora`
  ~L5763 injects `_earthFlora` + plant-stat accent.
- **Biomes/vistas:** `BIOME_SETS` ~L7477 (43 live biomes × 8 types) · `hdVista(opts)`
  ~L6260 (960×430 surface scene) · `_hdDeckScene` (gas giant) · `_hdAbyssScene` (deep).
- **Tools (`scratchpad/` + `tools/`):** `classify-audit.js`, `rig-audit.js` (→ the gate),
  `shot-cat.js "Name,…" LABEL out.png`, `shot-flora.js`, `shot-proc.js`, `shot-proc-flora.js`,
  `shot-vista.js "types" LABEL out.png`, `shot-bestiary.js`, `build-biome-atlas.js`.
  Output → `tools/uisheets/`.
- **Battery:** `node tools/validate.js` (build + fingerprint 50/50) · `smoke.js` ·
  `systems-check.js` · `balance-sim.js` · `uilayout.js`.

---

*This file is the standing art spec. Update it as decisions change; prune per-section
"pending" items as each ships. Prune the whole build-order/status once v1.6 deploys.*

## 2026-07-24 additions (v1.7 universe-crispness + catalog polish — verified in main.js)
- **Planets**: noise-edged polar caps (sea-ice vs land-snow, real iceAmt weight, narrow
  ramp), atmospheric LIMB HAZE on airy types (kills ortho streaks), HD masters for the
  focused world (768 phone / 1024 desktop; 512 default), coastline variety (beach/
  wetland/cliff by shore noise), seeded cloud WIND (fronts stretch along the flow),
  DRIFTING upper cloud deck (own noise stream, motion-gated), gas VORTEX storms,
  venus layered circulation + vortices. Ring shadows both ways (planet↔rings), ring
  2nd gap ~1/3 seeds + particle grain, 512 ring masters.
- **Stars**: _starSurf granulated surfaces inside the corona when zoomed (per-class:
  B/A tight granules, M/K mottled + flare arcs, RG/SG huge cells + limb prominences,
  WD near-smooth); binaries/trinaries included; heat-gated by on-screen size.
- **Moons**: 160px HD close masters (non-overlapping rejection-sampled craters, bowl
  shading to the light, soft rims, terrain mottling; icy frost, volcanic elbow-fissures
  + caldera glows); far 28px masters kept; moons −10% (pick floor intact).
- **Deep space**: baked cinematic BLACK HOLE (Doppler disc, horizon-hugging lensed halo,
  photon ring, turbulence streaks, star-smear lensing, feathered horizon); QUASAR
  tapered/knotted asymmetric plasma jets + disc hint; WORMHOLE 192; NEBULAE 256 with
  multi-scale structure (dust lanes, newborn clusters, illuminating star, shock shell +
  filaments, carved cavities). Galaxy masters stay 512 BY DESIGN (cache memory; the zoom
  transition hands off to vector-sharp live rendering).
- **Earth catalog — RECIPE-AUTHORITATIVE PELTS** (the one-by-one pass, in progress):
  only species whose _earthArt recipe declares stripes/mottle wear them; stray pattern
  GENES are muted on Earth species; thresholded marks at real frequencies (narrow
  stripe bands ~30%, rosette cells ~25%) over a CLEAN recipe base (dark wash 0.26→0.08).
  _earthBlend children keep parental pelt MARKS in their own colors (breeding cohesion).
  Procedural aliens keep soft gene-driven hides. WINGED plans 7/14: wings dominate,
  airborne tucks to 2-leg flight stance, grounded keeps limbs.
- **Lighting verified**: baked light re-aims at the star per frame; star-tinted lit
  overlay; terminator sweeps with orbit; city lights night-side only.
