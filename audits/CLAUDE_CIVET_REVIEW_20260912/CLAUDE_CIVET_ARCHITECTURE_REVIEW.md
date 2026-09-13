# Civet animation proof and reusable anatomy: architecture review

Date: 2026-09-12. Reviewer: Claude, read-only. Evidence: Codex packet at openai/mac 2f7e344a (turnaround, two tokens, receipts, phenotype), the builder sources reconstructed from `git diff d4fe8037 HEAD` (the packet's historical-sources folder and diff patch are not present at bf401754), the game's anatomy owners, and the existing 2D rig tooling. No `.blend` files were available, so saved mesh, weight and pose contents are unverified; every claim about them below comes from the builder code. Nothing was run, generated, edited or pushed.

## Verdict

**Abandon the current approach: Wolf primitives plus three-view projection cannot become a reusable system, and the two failures are structural, not parametric.** The reusable foundation for this game is a 2D deformable-mesh rig over the painted cut-out, with one joint template per painter family, proportions read from a resolved-anatomy record that the winning painter emits, and clips authored once per template. The turnaround Codex generated is excellent and should be kept as the modelling reference for hidden-surface patches and for the later engine port; the Blender masters should be retained as assets but taken off the critical path.

### The three most consequential findings

1. **Single-axis projection with texel snapping is unfixable by calibration** (CONFIRMED). `civet_proof.py:64-76` fills UVs from vertex position with no unwrap; every polygon not classed front or back gets the side-view mapping of its (x, height) only, ignoring lateral position, so the whole dorsal surface, belly, far flank and inner legs share the side silhouette's texels. Points outside that silhouette have no texel: version one clamped to magenta and the hard key (`:80-83`) painted them flat tan (token 1's unpainted back); the correction (`texture_point`, `:55-63`) snaps to the nearest non-magenta row, collapsing the entire back onto a four-pixel strip (token 2's banding). Pink seams come from bilinear sampling of silhouette-adjacent texels through a hard threshold.
2. **The mesh is a Wolf's cross-sections under a Civet's heights, then melted** (CONFIRMED). All lateral ring widths are absolute Wolf literals (`creature_canid.py:316-324, 345-356, 376-381`); only x-positions and vertical radii are parameterized. Overlapping tubes are voxel-remeshed and smoothed (`:427-436`), which is the recipe for a blob. The three "calibration factors" (`civet_proof.py:29-31`, 0.68 / 0.84 / 1.12) are eyeballed literals applied after the source hashes are verified, and they shrank the muzzle and torso below the accepted painting.
3. **The rig would animate wrongly even on a correct mesh, and nothing audits it** (CONFIRMED for the jaw, PLAUSIBLE for the axes). The jaw bone is excluded from weighting (`creature_canid.py:517`) so the attack's jaw key moves nothing; neck, foreleg and jaw keys rotate about a pose bone's local Y, which is its length axis, so they twist rather than swing (`civet_proof.py:92-103`); the lunge is root translation that slides planted paws (`:95`), which the Wolf's own grounding check would fail; and `audit_canid.py` is Wolf-only (`:122-128`), so the Civet master has no auditor. "Connected topology and normalized weights" are the only PASS criteria and say nothing about art.

Two further defects worth recording: the game already carries two disagreeing Civet proportion sets, `QUAD2_SPEC.Civet` (`mammaloverrides.ts:95`) and the values the viverrid painter actually draws (`quadrupedoverrides.ts:2094-2103`, which ignores the spec except for palette); and the render is a lit Cycles three-quarter from above (`creature_canid.py:670-708`), which is a 3D-render look the art lock forbids and a camera that maximises the untextured dorsal region.

## Evidence table

| Item | Exists | Missing | Proves / cannot prove |
|---|---|---|---|
| Civet turnaround (2:1, three views) | Yes, unreviewed | Nick's acceptance | Species-correct, consistent across views, atlas hand, clean key. Adequate as a modelling and hidden-surface reference. Not itself an animation asset. |
| Token 1 and 2 renders and receipts | Yes | Hash of `token.png` in receipt; any art criterion | Builder runs end to end; topology and weights pass. Cannot prove appearance; both fail visually. |
| Phenotype export (genome, speciesVisualKey, owner chain) | Yes, 20 bridge tests | | The bridge preserves identity and the winning owner (`QUAD2_SPEC.Civet → faunaMammalD → faunaResetViverridD`). Sound and reusable. |
| Gene-driven proportions | No | Any gene input to the builder (`civet_proof.py:19`) | Cannot prove family bounds. For named Earth species genes are irrelevant by design: the Civet genome says size 4, eight limbs, tendril-fringed head, crystalline skin (`speciestraits.verbatim.js:193-217`); the name overrides all of it. |
| Texture-atlas finisher pass | No | A UV-space path in the engine; it is a scene compositor | Cannot be assessed; the boundary does not exist. |
| Rendered clip set, staged Pixi turn | No | | Nothing to review. |
| Existing 2D rig mechanism (`civet-articulated-rig.ts`, `kinematics.ts`) | Yes, tested | Family generality; landmarks are Civet literals | A 48×32 mesh with 12 hierarchical bones, weights and three clips works over a painted cut-out with no AI pass. This is the reusable core. |
| `.blend` masters | Hashes only | Files | Mesh, weights and poses unverifiable here. |

## The reusable architecture

### 1. Rig in 2D over the painted cut-out; keep Blender for the engine port

The accepted asset is the painted token in the atlas hand. The art lock forbids a 3D-render look. The battle target is idle, attack and hit in the token view with depth suggested by scale and overlap, not camera moves. A triangulated cut-out (from the alpha mask, replacing the fixed 48×32 grid) with per-vertex bone weights, deformed by the affine chains in `kinematics.ts`, gives exactly that, with the texture being the master itself, pixel-identical, no finisher pass and no flicker. Blender's real value is later: true turnarounds and camera freedom in the engine, using the turnaround image as reference for a hand-built family base mesh with a fixed UV layout. That is a modelling-artist cost per family and should be budgeted then, not now.

### 2. Family templates, mapped one-to-one to the painter families

A template is a joint graph, rest landmarks in normalized cut-out space, proportion bounds, depth layers, and a clip set authored once as bone-length-relative curves.

| Template | Painter families it serves | Joint graph | Clip variants |
|---|---|---|---|
| quadruped | mammal (all nine sub-builds), reptile lizard, turtle, alien quad | root, pelvis, spine, chest, neck, head, jaw, 4 legs × 3, tail chain 3 to 5, ears 2 | land |
| hopper | amphibian frog, rabbit, kangaroo-like | quadruped with folded hind chain and jump curves | land |
| biped-bird | bird | root, spine, neck chain, head, beak, 2 legs × 3, 2 wing chains, tail fan | land, flying |
| fish | fish, marine | spine wave chain, pectoral pair, dorsal, caudal | aquatic |
| insect | insect | thorax, head, abdomen, 6 legs × 2, antennae, wing pair | land, flying |
| arachnid | arachnid, crust | cephalothorax, abdomen, 8 legs × 2, chelicerae or claws | land |
| serpent | snake | chain 8 to 12 | land, aquatic |
| myriapod | myriapod | chain plus leg pairs per segment | land |
| radial | radial, sessile, jelly | centre plus N arm chains, bell | aquatic, sway |
| cephalopod | ceph | mantle, head, 8 tentacle chains | aquatic |
| flyer-membrane | bat, gliders | quadruped plus wing membrane chains | flying |
| primate | primate | biped or quadruped variant with arm chains | land |
| plant-woody | tree, shrub, cane, vine | trunk, branch chains, leaf clusters | sway |
| plant-herb | fern, grass, rosette, seaweed, fungal cap | stem chains, frond or blade sets | sway |

Fourteen templates cover every routing in `proceduraloverrides.ts` and `hdart` and every flora architecture. Explicit exceptions: gelatinous, crystalline and membranous body plans that fall through to the verbatim engine get the radial or quadruped template if their landmarks fit its bounds, else the whole-portrait fallback, flagged in the record. Plants never get limb templates; fungi and microbes use plant-herb sway or static.

### 3. The resolved-anatomy record (the boundary CREATURE_ANIMATION.md names)

Emitted by the winning painter owner at draw time for procedural and lineage creatures; stored once per authored master for named Earth cut-outs. Minimal fields:

```
identity:   speciesVisualKey, genome seed, kingdom, ownerId (e.g. "faunaResetViverridD"), earthName?
template:   familyTemplateId, templateVersion
geometry:   cutoutAssetHash, width, height, groundLineY, depthLayers [{maskHash, order}]
landmarks:  { joint: [x,y] } in normalized cut-out space for every joint in the template graph
proportions:{ boneLengths derived from landmarks, headScale, tailLength, ... } + boundsCheck {inside: bool, clamped: [...]}
materials:  fur|feather|scale|chitin|leaf, sheen tier, palette source (genome or named)
clips:      templateClipSetId (inherited), per-creature overrides: none by rule
runtime:    recipeHash of all of the above
```

Rules: named Earth anatomy comes from the painter owner's drawn values, never from raw genes; `QUAD2_SPEC` and the painter must be reconciled into one source before the record is trusted (defect above). For authored Earth masters the landmarks are a declared per-asset JSON beside the image, hash-bound, not a hidden special case: twelve now, seventy-four for the canon set, authored once each. Hybrids and descendants: the existing lineage routing already picks the winning painter; the record follows it, and proportions outside the template bounds are clamped and flagged, never randomized. No second classifier, no clock, no per-creature clip edits.

### 4. Texture

For 2D rigs the master is the texture; no finisher pass and no atlas path are needed, which removes question 5 from the critical path. Hidden surfaces at limb crossings are handled by two or three depth layers: the painter draws in layers for procedural creatures and can emit the masks; authored masters get a one-time layer mask, with small hidden-patch fills painted from the turnaround. For the later 3D route the necessary boundary is a UV-space atlas path in the engine with seam-aware masks and a bake step; it does not exist and should not be built for this proof.

## The next bounded Civet proof

1. **Record and template.** Emit the resolved-anatomy record for the Civet from `faunaResetViverridD`; write the landmark JSON for the accepted master (hash-bound); define quadruped template v1 (joint graph, bounds, two depth layers, clip curves for idle, attack, hit). Reuse `kinematics.ts` and the compose, inherit and weight mechanisms of `civet-articulated-rig.ts`; replace the fixed grid with alpha triangulation and the Civet literals with the record.
2. **Clips as template curves.** Idle: breath, weight shift, ear flick, tail sway. Attack: anticipation, push with feet planted, lunge, strike, return. Hit: recoil, compress, settle. All expressed relative to bone lengths, so they apply to any quadruped.
3. **Stage one turn in Pixi.** The accepted E landfall plate as backdrop, Civet versus Platypus (Platypus uses the same quadruped template: reuse control one), depth by scale and overlap, choreography push-in, banner, strike, hit flash, shake, number, recoil, return. No effects painting.
4. **Reuse controls.** Same template and same clips on the fox family reference (different proportions) and on one procedural quadruped emitted by the painter, with zero per-creature edits. Negative controls: a serpent body is refused by the quadruped bounds; a corrupted landmark file fails the fit; a mismatched cut-out hash refuses.
5. **Stop criteria (visual, plus the mechanical checks that must not be mistaken for art).** Rest pose is pixel-identical to the master; no tearing or spikes at joints at clip extremes; paws stay on the ground line through idle and hit; the lunge reads as forward motion with feet leaving and returning to ground; ears, tail and jaw move; 60 fps on the Mac and under 2 ms per creature update; a ten-second capture beside the accepted landfall for Nick, plus the fox and procedural captures. Fallback if the template cannot hold shape: whole-portrait staging with the new choreography, explicitly labelled.
6. **Defer.** The Blender master, the three-view projection, the texture finisher pass, and all family templates beyond quadruped.

**Approval wording:** "Approved: replace the Blender-projection Civet proof with a 2D deformable-mesh quadruped template over the accepted painted Civet, driven by a resolved-anatomy record emitted by the winning painter owner and a hash-bound landmark file for the authored master. Deliver idle, attack and hit as template curves, one staged turn on the accepted landfall plate against the Platypus, and reuse captures on the fox reference and one procedural quadruped with zero per-creature edits. Stop at the ten-second captures for my review. No 3D renders, no texture finisher pass, no effects painting, no kit edits."

## Open questions

- Does Nick want true turnaround views or camera moves in battle? A 2D rig cannot provide them; that is an engine-port capability and the turnaround image is the asset that makes it possible later.
- Which of `QUAD2_SPEC` and the painter's drawn values is the intended authority for named Earth proportions? The record must have one source.

---

## Addendum 2026-09-12 (late): the first 2D captures, and the correction to old-school pose animation

**What Nick saw is the fallback, not the rig.** Codex's report is explicit: the deformable mesh failed its own shape gate on all three subjects (8, 14 and 7 of 51 clip extremes with flipped or over-stretched triangles), so every capture is the authorized whole-portrait fallback: the whole picture slides toward the opponent, a banner, a damage number. That is exactly "shifting the picture", and it is honest evidence, not the articulated proof. The articulated rig was never shown.

**Two causes, both in the design of the rig rather than its code.**

1. A single continuous one-view mesh cannot reach big poses. Swinging a leg 40 degrees or throwing the head back folds triangles across the joint, which is the flip the gate caught. The gate is right; the mesh topology is the wrong tool for large motion. Classic 2D cut-out animation solves this with parts: head, jaw, ears, neck, torso, each leg in two segments plus paw, tail in three segments, each a separate sprite region with its own pivot, overlapping at joints with small painted patches (which is what the Civet turnaround is for). Parts rotate freely; nothing tears.
2. The clip curves are smooth and tiny. The idle drive is 2% of body length, head rotation is 0.024 radians (about 1.4 degrees), the attack is one continuous glide. Chrono Trigger and Final Fantasy VI are the opposite: three to eight hand-drawn key poses per action with large silhouette changes, held frames, snappy timing at about 12 frames per second, anticipation before the strike, a one-frame smear on the strike, and a hit flash. Smoothness is not the goal; readable poses are.

**The reusable version of old-school sprite animation.** Poses, not curves. Each family template carries a pose library: idle (two poses, breathe and weight shift), attack (crouch wind-up with head low and hindquarters raised; launch with forelegs extended; strike with jaw open and paw swipe; land and recover), hit (head thrown back, body compressed; stagger), faint, victory. Each pose is a set of part rotations and offsets relative to bone length, so the same library fits a civet, a fox and a procedural quadruped with zero per-creature edits. Playback is smooth: key poses are interpolated at 60 frames per second with easing, anticipation and overshoot (Nick's clarification: the Chrono Trigger and Final Fantasy VI feel with smooth motion, not stepped frames), a one-frame smear on the strike, a brief hitstop on impact, squash on impact, screen shake and flash on the hit, opponent recoil pose rather than a slide. The attacker runs to the target and back. Cutting into parts is per-asset data: the painter already draws legs, body, head and tail as separate strokes and can emit part masks for every procedural creature (its observer callback already emits the tube points); authored masters get a one-time part-mask file each, hash-bound, twelve now.

**Next bounded proof (replaces the mesh proof; approval wording below).** Civet parts rig: part masks for the accepted master; joint patches from the turnaround; quadruped pose library v1 with the poses above; stepped playback; the same staged turn against the Platypus with the Platypus using the hit pose from the same library; reuse captures on the fox and the procedural quadruped with zero edits. Stop criteria: every pose is a visibly different silhouette; limbs, head, jaw and tail move as parts; no tears or gaps at joints in any pose; paws planted in idle and hit; strike reads as a lunge with anticipation; ten-second captures at 60 fps for Nick beside the accepted landfall. Negative controls: a corrupted part mask fails admission; a pose outside the template's joint limits is refused; a serpent body is refused.

**Approval wording:** "Approved: replace the continuous-mesh quadruped proof with a cut-out parts rig over the accepted painted Civet (part masks per authored master, joint patches from the turnaround, painter-emitted part masks for procedural creatures) and a quadruped pose library of strong key poses interpolated smoothly at 60 fps with easing, anticipation and overshoot, in the Chrono Trigger and Final Fantasy VI manner: idle (breathe, weight shift), run-up to the target, attack (wind-up, launch, strike with smear and hitstop, land, recover, run back), hit (recoil, stagger), victory, faint. Stage one turn against the Platypus using the same library's hit pose, and reuse captures on the fox and one procedural quadruped with zero per-creature edits. Stop at the ten-second captures. Poses drive the motion and tweening connects them; no 3D, no finisher pass, no effects painting, no kit edits."
