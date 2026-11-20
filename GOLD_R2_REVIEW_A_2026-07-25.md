# Celestial Frontier v1.7 — Gold Proofs R2 Review

**Package reviewed:** `CFv17GOLDPROOFSR2.zip`  
**Review date:** July 25, 2026  
**Scope:** Every supplied creature, fauna, flora, procedural, celestial, material, gear, ship, vista, biome, and UI proof  
**Files reviewed:** **58 PNG proof images plus `README.txt`**

---

# Executive Verdict

## Overall status: **Conditional Gold — approximately 96% ready**

R2 is a meaningful improvement rather than a cosmetic repackaging. The major concerns from the previous 92% review were addressed:

- Phone nameplate and search truncation are fixed.
- Procedural texture coverage now spans the full creature silhouette.
- Scales, chitin, feathers, and glints are clipped correctly inside the body.
- Wing roots are more anatomically attached and receive contact shadow.
- Desktop and phone HUD placement is clearer and more consistent.
- Canopy union remains successful.
- Celestial, gear, materials, and ship work remain strong.

The package no longer has a broad art-system blocker. The remaining work is concentrated in a small number of identifiable items.

## Why this is not an unconditional Gold sign-off yet

1. **Four Earth-fauna reads are still deferred and visibly unresolved:** Eagle, Gerenuk, Red Panda, and Poison Dart Frog.
2. **Open-sea landing generation is still too repetitive.** Several seeds differ only slightly in island, sun, and foreground placement.
3. **The guide panel still displays `v1.6.4 (dev)` inside a v1.7 Gold proof package.** The README describes this as bundle-time behavior, but the release package must show the actual release version before shipping.
4. **The painted-on material problem is mostly solved, not completely solved.** Scales, chitin, and feathers are much better; fur remains visually subtle, and crystalline treatment does not always alter form or lighting strongly enough.
5. **A few biome/flora vistas still expose procedural construction language**, especially the desert flora proof and portions of the jungle canopy.

## Release recommendation

- **Art direction approval:** Yes
- **Gold Candidate approval:** Yes
- **Final shipping Gold approval:** After one micro-pass
- **Estimated distance from Gold:** About **4%**

The remaining correction wave should be small and finite. A wholesale redraw is not warranted.

---

# Regression Against the Previous Gold Review

| Previous requirement | R2 result | Verdict |
|---|---|---|
| Fix phone shelf truncation | Full nameplate is visible and the search placeholder is shortened | **Fixed** |
| Integrate creature textures into the body | Engrave v2 uses full-body relief masked to the silhouette | **Substantially fixed** |
| Improve feather rendering | Shingle-like engraved plumage replaces loose painted lines | **Fixed** |
| Root wings into the torso | Shoulder-rooted wings, near/far layering, and contact shadows added | **Fixed** |
| Correct stale version presentation | Still displays `v1.6.4 (dev)` in guide proofs | **Not fixed for release** |
| Improve Eagle | Deferred in README; hook/profile still weak | **Open** |
| Improve Gerenuk | Deferred; neck still insufficiently distinctive | **Open** |
| Add Red Panda tail rings | Deferred; tail identity remains weak | **Open** |
| Increase Poison Dart Frog contrast | Deferred; warning coloration remains too quiet | **Open** |
| Increase open-sea variance | Deferred; proof still repeats strongly | **Open** |

---

# Gold-Readiness Scorecard

| Category | Estimated readiness | Status |
|---|---:|---|
| Earth creatures and fauna | 93% | Near-Gold |
| Earth flora | 95% | Near-Gold |
| Procedural creatures | 95% | Near-Gold |
| Procedural flora | 96% | Near-Gold |
| Celestial and universe | 98% | Gold-ready with minor polish |
| Materials, gear, and ships | 99% | Gold-ready |
| Vistas and biomes | 94% | Near-Gold |
| UI and HUD | 96% | Near-Gold |
| **Overall** | **96%** | **Conditional Gold** |

---

# 1. Earth Creatures and Fauna

## Overall assessment

The Earth set is coherent and far stronger than the earlier proof waves. The renderer now has enough rig diversity to support a broad catalogue, and many signature animals read immediately.

## Strong areas

- Elephants, apes, whales, cephalopods, corals, cats, and marine invertebrates have clear category rigs.
- Tiger and other marking-dependent animals benefit from the markings system.
- Frog, turtle, bird, ungulate, and small-mammal families are separated better than in prior builds.
- Winged forms no longer look like flat side decals.

## Remaining identity issues

### Poison Dart Frog

The body remains too close to the other frog templates and the warning pattern is too subdued.

**Recommended final fix:**

- Use mandatory high-contrast patches or bands.
- Increase saturation and value separation at card size.
- Preserve the pattern after downsampling by enforcing a minimum patch width.

### Eagle

The current bird reads as a general dark bird rather than a clear raptor.

**Recommended final fix:**

- Increase the hooked beak profile.
- Add a stronger brow and chest.
- Shorten or square the tail relative to waders.
- Add a visible talon/foot posture.

### Gerenuk

The neck is still not long enough to create an immediate identity.

**Recommended final fix:**

- Extend the neck by approximately 20–30% relative to the Impala rig.
- Raise the shoulder/head position.
- Reduce torso depth slightly to strengthen the browsing silhouette.

### Red Panda

The body is readable as a small mammal but not strongly as a Red Panda.

**Recommended final fix:**

- Add mandatory tail rings.
- Increase the tail volume.
- Add a light facial mask and darker limbs.

## Winged creature result

The wing pass is materially better:

- wing roots now connect to the shoulder/torso
- near and far wings create depth
- contact shadow reduces the pasted-on look
- airborne and grounded states remain distinguishable

### Remaining wing polish

A few wing forms still resemble a single thick dorsal lobe. For the best result:

- show at least one structural joint or membrane fold
- slightly narrow the wing root before it expands
- preserve a body contour break where the shoulder receives the wing
- let flight-feather or membrane lighting differ from torso lighting

This is polish, not a release blocker.

## File-by-file fauna review

| File | Status | Review |
|---|---|---|
| `1-earth-creatures/b15-frogs.png` | Conditional | Clean rendering, but frog species remain highly dependent on color; Poison Dart Frog still needs the deferred contrast pass |
| `1-earth-creatures/clipbirds.png` | Conditional | Useful rig proof; many waders remain close, and Eagle/Toucan/Hornbill need stronger signature profiles; proof section labels also crowd nearby cells |
| `1-earth-creatures/earthrigs.png` | Pass | Strong structural taxonomy across cephalopods, gastropods, corals, cats, cetaceans, and sessile life |
| `1-earth-creatures/fauna-all-big.png` | Near-Gold | Broad large-scale catalogue is coherent; weakest species reads remain localized |
| `1-earth-creatures/fauna-all.png` | Near-Gold | Good small-scale consistency; subtle species features can collapse at final icon size |
| `1-earth-creatures/fauna-wave2.png` | Conditional | Meaningful improvement; four deferred animals remain visibly unresolved |
| `1-earth-creatures/markings.png` | Pass | Signature markings remain valuable and readable |
| `1-earth-creatures/markings2.png` | Pass | Strong continuation of anatomy and markings correction work |
| `1-earth-creatures/winged.png` | Near-Gold | Attachment and contact shadow are fixed; a few wing shapes still need minor anatomical articulation |

---

# 2. Earth Flora

## Overall assessment

The Earth flora system remains much stronger than the original proof waves. Canopy union works, category separation is clear, and identity organs are now present for many important plants.

## What works

- Tree, palm, conifer, flower, crop, grass, cactus, and harvest forms are clearly separated.
- The canopy proof no longer exposes obvious construction circles.
- Fruit-bearing trees have stronger fruit cues.
- Root, grain, spice, aquatic, and herb correction waves improved category recognition.

## Remaining weaknesses

### Simplified conifers and harvest forms

Some forms such as Pinyon Pine, Yew, Spruce Tips, Bamboo Shoots, and Barrel Cactus Fruit are intentionally icon-like. That is acceptable for harvest items, but the distinction between a full organism and a harvested component should remain explicit in-game.

### Broadleaf and shrub naturalism

The united canopy is technically correct, but some forms still have very smooth, plastic-like masses. Add:

- subtle branch gaps
- asymmetric edge erosion
- local shadow pockets
- low-frequency directional growth

### Desert-flora context

The desert vista still does not strongly sell cactus ecology. The foreground plants read closer to fan ferns or stylized grasses than unmistakable desert cacti.

## File-by-file flora review

| File | Status | Review |
|---|---|---|
| `2-flora/b15-aqflora.png` | Pass | Good aquatic-category separation and clean silhouettes |
| `2-flora/canopy.png` | Pass | Canopy union succeeds at 100% and 200%; construction circles are no longer the dominant read |
| `2-flora/earthflora.png` | Near-Gold | Strong category board; a few conifer and harvest icons remain highly simplified |
| `2-flora/flora-all-big.png` | Near-Gold | Broad organism coverage reads well at larger scale |
| `2-flora/flora-all.png` | Near-Gold | Small-scale proof remains coherent, though some related forms still share growth habits |
| `2-flora/flora-organs.png` | Pass | Identity-organ strategy is clear and effective |
| `2-flora/flora-wave2.png` | Pass | Correction wave meaningfully improves roots, grains, herbs, spices, and aquatic forms |
| `2-flora/pass9flora.png` | Near-Gold | Useful validation sheet; a few forms remain diagrammatic rather than botanical |

---

# 3. Procedural Creatures

## Overall assessment

This is the central R2 improvement. Engrave v2 successfully fixes most of the “texture scribbled or painted in the middle” problem.

## What Engrave v2 fixes

- Texture covers the full silhouette rather than a torso-only patch.
- Head, limbs, tail, and body share the same material logic.
- Texture is clipped inside the creature.
- Feathers use overlapping shingle-like relief.
- Crystalline glints do not leak outside the body.
- Chitin segmentation follows the full organism.

## What still prevents a perfect material read

### Furred material

The fur row is now coherent, but it remains the least visually specific material. Several furred creatures look like smooth matte bodies.

**Final polish:**

- add mild contour fuzz or grouped silhouette tufts
- concentrate longer tufts at neck, spine, joints, and tail
- add small self-shadow under tuft groups
- avoid applying equal fur depth everywhere

### Crystalline material

The crystalline row is clean but can read as smooth stone with faint highlights rather than crystal-grown anatomy.

**Final polish:**

- introduce a few planar value breaks
- add restrained facet edges aligned with body zones
- allow one or two silhouette corners or protrusions
- vary highlight direction across facets rather than using only soft body shading

### Chitinous material

Full-body coverage is fixed. On some bodies, the vertical segmentation is overly regular.

**Final polish:**

- warp segment spacing through body curvature
- vary plate width by anatomical zone
- soften or interrupt segments around joints

## File-by-file procedural review

| File | Status | Review |
|---|---|---|
| `3-procedural/abtest.png` | Informational | Demonstrates the contrast between named Earth identity and unnamed procedural construction; procedural result is intentionally more alien |
| `3-procedural/proc-aqua.png` | Gold-ready | Aquatic adaptation remains one of the strongest systems |
| `3-procedural/proc-features.png` | Pass | Broad trait coverage and good consistency |
| `3-procedural/proc-flora-forms.png` | Near-Gold | Strong family taxonomy; shrubs and some crown forms still benefit from more organic asymmetry |
| `3-procedural/proc-heads.png` | Pass | Head families remain readable across multiple bodies |
| `3-procedural/proc-plans.png` | Gold-ready | Excellent body-plan diversity and system coherence |
| `3-procedural/proc-skins.png` | Near-Gold | Engrave v2 is a major success; fur and crystalline materials need only final polish |
| `3-procedural/procflora.png` | Pass | Cohesive procedural flora output |
| `3-procedural/procswarm.png` | Gold-ready | Strong variety, readable silhouettes, and a convincing living system |

---

# 4. Celestial and Universe Art

## Overall assessment

This category is effectively Gold-ready.

## Strong results

- Deep-space labels no longer overlap.
- The wormhole has a clearer, continuous lensing language.
- Black hole and quasar remain strong.
- Molecular dark cloud is more readable and has protostar context.
- Relative star scale is clearly communicated.
- Ringed-planet compositing now separates front and rear ring layers.
- Planets, moons, and star surfaces remain visually cohesive.

## Minor polish only

- Increase the wormhole throat’s central depth very slightly.
- Preserve small celestial readability at actual gameplay scale.
- Add a touch more separation between the planet shadow and ring shadow in the live view.

## File-by-file celestial review

| File | Status | Review |
|---|---|---|
| `4-celestial/deepspace.png` | Gold-ready | Previous label collision fixed; object families and star-scale row are clear |
| `4-celestial/liveview.png` | Gold-ready | Rear/front ring compositing now reads correctly |
| `4-celestial/planets24.png` | Near-Gold | Strong planets; cloud and coastline improvements are visible |
| `4-celestial/skyworlds.png` | Gold-ready | Strong atmospheric-world variety |
| `4-celestial/stars.png` | Gold-ready | Clear stellar object coverage |
| `4-celestial/starsurf.png` | Near-Gold | Moon geology and ring families are substantially improved |

---

# 5. Materials, Gear, Paperdoll, and Ships

## Overall assessment

**Gold-ready.**

No systemic art correction is required in this category.

## File-by-file review

| File | Status | Review |
|---|---|---|
| `5-materials-gear-ships/gear-tiers.png` | Gold-ready | Tier progression remains clear and cohesive |
| `5-materials-gear-ships/materials47.png` | Gold-ready | Material identities are distinct and memorable |
| `5-materials-gear-ships/paperdoll.png` | Gold-ready | Full-body presentation and equipment anchors are usable and consistent |
| `5-materials-gear-ships/shiptiers.png` | Gold-ready | Cumulative ship progression is easy to understand |
| `5-materials-gear-ships/v14icons.png` | Gold-ready | Broad icon suite remains production-quality; verify final UI text wrapping independently |

---

# 6. Vistas and Biomes

## Overall assessment

The scene system is attractive and cohesive, but open-sea variance remains the clearest unresolved environmental issue.

## Open-sea repetition

The proof includes several open-sea landings with only modest changes to:

- sun position
- island silhouette
- foreground trees
- shoreline shape
- wave placement

The result is cleaner than before but still looks like one composition with parameter variation.

## Required micro-pass

Create several composition archetypes rather than one composition with different values:

1. Empty open horizon
2. Near island on left
3. Distant archipelago
4. Rocky coast
5. Reef shelf and shallow water
6. Storm front
7. Sunset or low sun
8. Open sea with distant life or vessel

Then vary weather, camera height, wave intensity, foreground vegetation, island count, and horizon height within each archetype.

## Flora-vista concerns

- Jungle canopy is improved but still has a somewhat idealized, repeated lobe language.
- The desert “its CACTI” scene needs unmistakable cactus silhouettes rather than fern-like fans.
- Repeated river/road compositions remain visible across some sheets.

## File-by-file vista review

| File | Status | Review |
|---|---|---|
| `6-vistas-biomes/biomes.png` | Near-Gold | Strong broad biome range; shared compositional grammar remains visible |
| `6-vistas-biomes/coherence.png` | Near-Gold | Fauna, flora, weather, settlements, and terrain coexist well; jungle remains slightly templated |
| `6-vistas-biomes/earthlandings.png` | Conditional | Land categories are better separated; open-sea samples remain too repetitive |
| `6-vistas-biomes/floravista.png` | Conditional | Meadow and savanna work; desert cactus identity and jungle organicity need a final pass |
| `6-vistas-biomes/gasdeck.png` | Gold-ready | Distinctive, atmospheric, and cohesive |
| `6-vistas-biomes/rivers.png` | Near-Gold | Useful seeded variety, though some camera and settlement structures repeat |
| `6-vistas-biomes/vistas-big.png` | Near-Gold | Strong showcase set with minor repetition |
| `6-vistas-biomes/vistas.png` | Near-Gold | Good full-system range and mood separation |

---

# 7. UI and HUD

## Overall assessment

The R2 HUD is much closer to a production layout. The desktop hierarchy is strong, and the phone layout is considerably cleaner than the older versions.

## Desktop HUD

### Strengths

- Identity, HP, and Charters form a clear top-left player-status cluster.
- Prime Codex receives central objective emphasis.
- Search and Star Atlas naturally occupy the exploration area at top-right.
- Compendium, Records, and Shipyard form a stable right rail.
- Bell, help, and settings remain accessible without dominating the screen.
- The center and lower-center world canvas remain unobstructed.

### Recommendation for an ARPG sandbox

The current desktop arrangement is excellent for exploration. Preserve the empty lower-center area for future:

- skill hotbar
- contextual interact prompt
- selected target state
- combat cooldowns

Do not allow meta-navigation panels to consume that future action space.

## Phone HUD

### Strengths

- Full nameplate now fits.
- Search placeholder is no longer clipped.
- The two-row dock is consistent and within the thumb zone.
- Charters, Compendium, and Settings panels fit the 390×844 proof viewport.
- The old panel-overlap problems are substantially improved.

### Remaining phone concerns

#### Meta dock versus combat controls

For the current exploration build, the two-row dock works. For a true ARPG combat state, the bottom area is also the natural location for attack, dodge, skills, and interact controls.

**Recommended behavior:**

- Exploration state: show the current meta dock.
- Combat or active encounter state: collapse the meta dock to one menu button and reveal the action bar.
- Panel-open state: dim or disable world controls and maintain safe-area padding.

#### Icon comprehension

The emoji/icon set is more recognizable than unlabeled dots, but compact phone buttons still need:

- first-use labels or tooltips
- strong active-state indication
- accessible names
- minimum 44×44 CSS-pixel touch targets

#### Guide/version card

The guide proofs still show `Celestial Frontier · v1.6.4 (dev)`.

For final release, bind this card to the same authoritative version constant used by the deployed build and verify the screenshot after the release bump.

#### Guide card overlap

On phone, the guide launcher overlaps the helper ribbon and lower narrative area. This is not a soft lock, but it is avoidable visual competition.

**Recommended fix:** reserve a fixed guide-card lane above the dock or temporarily hide the helper ribbon while the guide launcher is open.

## File-by-file UI review

| File | Status | Review |
|---|---|---|
| `7-UI/ui-atlas-desktop.png` | Gold-ready | Atlas panel placement and right-side hierarchy are clean |
| `7-UI/ui-charters-desktop.png` | Gold-ready | Charter board is readable and nonintrusive |
| `7-UI/ui-charters-phone.png` | Gold-ready | Previous wrapping and overlap failures are fixed |
| `7-UI/ui-compendium-desktop.png` | Gold-ready | Clear panel hierarchy over the world view |
| `7-UI/ui-compendium-phone.png` | Near-Gold | Fits well; ensure panel scrolling and 44-pixel targets in implementation |
| `7-UI/ui-guide-desktop.png` | Conditional | Layout is acceptable, but release version is stale and the guide card competes with lower helper content |
| `7-UI/ui-guide-phone.png` | Conditional | Same version issue; guide launcher overlaps lower helper/narrative area |
| `7-UI/ui-main-desktop.png` | Gold-ready | Strong exploration HUD and good ARPG expansion space |
| `7-UI/ui-main-phone.png` | Near-Gold | Truncation fixed; two-row meta dock must collapse during future combat states |
| `7-UI/ui-prime-desktop.png` | Gold-ready | Prime Codex receives appropriate modal emphasis |
| `7-UI/ui-records-desktop.png` | Gold-ready | Good right-panel density and hierarchy |
| `7-UI/ui-settings-desktop.png` | Gold-ready | Consistent tray/panel language |
| `7-UI/ui-settings-phone.png` | Near-Gold | Fits the viewport; verify safe-area and scrolling on physical iPhones |

---

# 8. Painted-On Material Review

## R2 result

**The team has solved most of the original problem.**

The key improvement is that the material is no longer just a colored pattern painted on the middle of a smooth body. The relief field now follows the whole creature and is clipped by the silhouette.

## Material-by-material result

| Material | R2 assessment | Remaining work |
|---|---|---|
| Scaled | Strong | Minor scale-size variation by body zone |
| Furred | Improved but subtle | Add contour fuzz, grouped tufts, and self-shadow |
| Chitinous | Strong coverage | Reduce overly uniform vertical segmentation |
| Slick and wet | Strong | Preserve specular direction consistency |
| Plated | Strong | No major issue |
| Warty | Strong | No major issue |
| Feathered | Major improvement | Add slight contour-feather breakup in selected forms |
| Translucent | Improved | Internal anatomy can remain slightly diagrammatic |
| Crystalline | Clean but understated | Add facets, planar light breaks, and occasional silhouette interruption |

## Final code-level recommendations

### Furred edge pass

After drawing the unified body mask:

1. Sample points along the silhouette normal.
2. Modulate tuft length with low-frequency noise and anatomy-zone weights.
3. Draw short tapered tufts outward from the edge.
4. Clip the tuft roots inside the body.
5. Add a small inner shadow under dense clusters.

### Scale zoning

Use anatomical zones to vary scale size and orientation:

- small scales: head, neck, lower limbs
- medium scales: flank
- large plates: dorsal torso
- compressed scales: joints and tail bend

### Crystal faceting

Create 4–12 seeded interior regions using a clipped Voronoi or triangulated field. Give neighboring regions slightly different values and highlight directions. Keep the effect restrained so anatomy remains readable.

### Wing integration

The new wing root is good. Preserve these rules globally:

- rear wing drawn behind torso
- front wing drawn according to pose
- contact shadow at shoulder root
- root narrower than distal wing
- membrane or feather flow follows the wing skeleton
- no wing intersection with the head

---

# 9. Final Mandatory Micro-Pass

Complete these items before declaring the shipping package Gold:

1. Strengthen Eagle beak, brow, chest, and talon silhouette.
2. Extend Gerenuk neck and browsing posture.
3. Add Red Panda tail rings and facial mask.
4. Increase Poison Dart Frog warning-pattern contrast.
5. Add multiple open-sea composition archetypes.
6. Update the release guide/version card to the final v1.7 version string.
7. Prevent the phone guide launcher from overlapping the lower helper ribbon.
8. Add a light final fur/crystal material polish if schedule permits.

Items 1–6 are the actual Gold gate. Items 7–8 are strong polish recommendations.

---

# 10. Gold Acceptance Checklist

- [ ] Eagle reads as a raptor without its label.
- [ ] Gerenuk reads differently from Impala at gameplay size.
- [ ] Red Panda has visible tail rings and face contrast.
- [ ] Poison Dart Frog retains warning coloration after downsampling.
- [ ] Six open-sea seeds produce materially different compositions.
- [ ] Guide card displays the final v1.7 release version with no `(dev)` marker.
- [ ] Phone guide launcher does not cover helper text or essential controls.
- [ ] All phone buttons maintain at least 44×44 CSS-pixel targets.
- [ ] Meta dock collapses or relocates during future real-time combat states.
- [ ] Physical-iPhone test confirms safe-area padding, scrolling, and tapability.

---

# Final Recommendation

R2 is a successful correction pass. The package is now **approximately 96% Gold-ready** and can be treated as a **Gold Candidate**.

The earlier systemic problems are no longer present:

- creature textures are no longer confined to painted torso patches
- feathers are integrated
- wings attach to the torso
- phone shelf text fits
- celestial ring compositing works
- canopy union works

The remaining work is a short micro-pass rather than another major art cycle. Once the four deferred fauna, open-sea variation, and final version string are corrected, the package should be ready for a full Gold sign-off.
