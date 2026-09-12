# Review response: Art Kit v4 first authoring batch and first engine painting

Date: 2026-09-12. Reviewer: Claude, read-only. Reviewed the three archives Codex exported (signed source 30ef7d15, evidence b5a577f9): the twelve masters, the nine fitted inputs, the six organism passes raw and keyed, the composite, the final painting at 100% with crops upscaled for inspection, the exact runtime prompts, and `recipe.json`. No image was generated, no kit text changed, no repository outside `anthropic/mac` touched. Nick retains acceptance authority.

## Recommendation: TARGETED REVISION

Accept the twelve authoring inputs and the plate. Do not accept the painting yet. The painting is the first local output that lives in the approved hand: the plate is at Living Worlds quality, and every organism is species-correct. What fails is integration: the residents are too small, the largest one is the wrong one, there is no foreground overlap, contact shadows are absent, keying left a faint pink fringe, and the finisher at strength 0.08 changed almost nothing, so the scene still reads as good cut-outs placed on a great plate. All of that is one correction at the compositor and finisher, not a model or kit problem.

## The twelve authoring inputs

| File (masters/) | Verdict | Visible evidence |
|---|---|---|
| civet.png | Accept | Complete body, four limbs, ringed tail, spotted coat, dark mask, small round ears; alert expression; flat magenta, no frame, no floor. 1254 square, not 1024. |
| platypus.png | Accept | Bill, webbed clawed feet, paddle tail, low sleek body, dark fur; flat key. 1254 square. |
| frog.png | Accept | Crouched anuran, domed eyes, wide mouth, folded hind legs, four limbs; flat key. 1254 square. |
| persimmon.png | Accept | Branching woody trunk and crown, simple oval leaves, orange fruit with calyx; no pot; roots visible at base, which the layout allows. 1254 square. |
| cranberry.png | Accept | Low creeping runners, small oval leaves, red berries; correct habit at last. 1254 square. |
| devils-club.png | Accept | Spiny canes, large palmate lobed leaves, upright red cones; no ground. 1254 square. |
| family-mammal-quadruped.png (fox) | Accept | Correct canid anatomy, four legs, white tail tip; atlas hand. 1254 square. |
| family-bird.png (pheasant) | Accept | Two legs, plumage, tail; atlas hand. |
| family-fish.png (trout) | Accept | Fins, tail, spots; lateral view; atlas hand. |
| family-insect.png (beetle) | Accept | Six legs, two antennae, elytra; atlas hand. |
| family-reptile.png (skink) | Accept | Four limbs, tail, scales; atlas hand. |
| earth-temperate.png (plate) | Accept | Rain, mist, wet rock, three depth layers, low horizon, quiet lower third with no organisms; genuinely in the triptych's hand. 1672×941, not 2560×1440. |

No Atlas frame, lettering or dark plate was inherited by any cut-out. No v4.1 sentence is needed for that. Sizes: the generator delivered 1254 square and 1672×941 instead of the kit's 1024 and 2560×1440; both are fine as masters because they exceed the runtime inputs, but the intake check should record the delivered size and the kit's size table should say "at least", or the generator settings should be pinned, so the discrepancy stops being an open finding.

## The six residents in the final painting

| Organism | Identity | Placement and scale | Integration |
|---|---|---|---|
| 1 Civet | Correct: spots, rings, mask, four paws on rock. Face reads slightly raccoon-like at 100%, acceptable for the species. | About 150 px wide, 15% of frame; too small for the hero of the scene. | Faint pink fringe along belly and tail; no contact shadow; stands on rock convincingly otherwise. |
| 2 Persimmon | Correct: oval leaves, orange fruit. | Shorter than a civet would be; reads as a shrub. | Sits on the bank acceptably; exposed roots visible. |
| 3 Platypus | Correct: bill, paddle tail, webbed feet. | About 205 px wide, larger than the Civet; the size relationship is reversed. | Visible pink fringe along the back and tail; no shadow; body floats slightly on the wet ground. |
| 4 Frog | Correct at crop: eyes, crouch, folded legs. | About 40 px; not readable at 100% without searching. 7% width is too small for the painted direction. | Blends into moss; no contact issue. |
| 5 Devil's Club | Correct: palmate leaves, red cones, canes. | Fine. | Slight hard edge against sky; acceptable. |
| 6 Cranberry | Correct parts, but reads as a berry sprig, not a creeping mat. | 11% width as one clump. | Fine. |

Count: exactly three animals and three plants; no duplicates; no fused anatomy. This is the first local output where every named species is right.

## Prioritized findings

1. **Composition plan is inherited from the old vector painter and is wrong for a painting** (`recipe.json` placements: Civet width 0.15, Frog 0.07, Platypus 0.20). The Living Worlds fox is about a third of the panel height with foreground grass over its feet. Here the hero is 15% of width and nothing overlaps anything. This is data in `earth-resident-plan.ts`, consumed by the compiler; it needs a painted composition profile: hero at 28 to 33% of frame height, secondary animal at about 60% of the hero, tertiary at least 10% of width, plants scaled against the animals (tree taller than the hero), and one foreground overlap element over the lowest feet.
2. **Size relationship reversed**: Platypus larger than Civet. Same fix as 1.
3. **Finisher too weak to integrate** (`finisherStrength 0.08`; final versus composite differ only in slight smoothing). At 0.08 the finisher cannot add contact shadows, ground reflection or overlap. Raise to about 0.35, and protect organism interiors with latent masks so anatomy does not drift while boundaries, ground and shadow do. This is the host-side masking hook already recommended in the full review.
4. **Keying fringe**: a one-to-two pixel pink edge on Civet and Platypus after keying. Fix in the keyer: erode the alpha by one pixel and despill toward the sampled neighbour colour before compositing. The masters themselves are clean.
5. **Runtime prompts carry text the model should never see.** The 1730 to 1860-token runtime prompts include the reference-lock instructions, SHA-256 strings, "Paste in every prompt", "Approved by Nick at 6f5c396e", the technical-output block asking for a 2560×1440 PNG, the full negative list, and percentage anchors. This model has no negative input; negations in a positive prompt prime what they ban, and the meta text is noise. Text encoding took 26 to 29 s per prompt, seven prompts, about 190 of the 426 seconds. The kit is the library authoring format; the compiler should project only the model-relevant parts to the local runtime: frozen style, the system card's Light, Mineral, Atmosphere and pigment lines, the subject, and the layout sentence. That projection fits under 512 tokens, removes the need for the 5120 ceiling, and cuts about three minutes per landing. Proposed as a v4.1 sentence below.
6. **Organism passes at strength 0.2 reproduce their inputs** (raw outputs are visually identical to the fitted cut-outs). Not harmful, but they cost six passes for no change. With per-organism masking in the finisher, these passes can be skipped entirely until a case appears where an input needs restyling.
7. **Frog unreadable at native size**; fix by 1.

## Proposed wording (proposals only; Nick approves; 4E turnaround unchanged)

- v4.1, section 0, add after "Only the SUBJECT line and the system card change per image": "RUNTIME PROJECTION: a local model without a negative input receives only the frozen style, the system card's Light, Mineral palette, Atmosphere and pigment lines, the subject, and the layout sentence. Reference-lock text, hashes, technical output and negatives are library-generator instructions and are never sent to such a model."
- v4.1, section 5, size table: "Masters may exceed these sizes; never below. The intake check records the delivered size."
- Compiler data, not kit: a painted composition profile per biome plate as described in finding 1.

## Minimum next experiment (for Nick to authorize)

One run on the same twelve inputs, same seed, same plate, changing only: the composition profile (hero Civet about 30% of frame height, Platypus at 60% of the Civet, Frog at 12% of width, Persimmon taller than the Civet, one foreground fern or grass cut-out from the plate's own lower band composited over the Civet's and Platypus's lowest feet), the keyer (one-pixel erode plus despill), the finisher (strength 0.35 with organism-interior latent masks), and the runtime prompt projection (finding 5). Skip the six organism passes.

Acceptance check: every organism identifiable at 100% without searching; visible contact shadow under Civet and Platypus; no pink fringe at 200% crop; organism bounding boxes after the finisher overlap the composite boxes by at least 90%; species review passes on all six; the Civet's height at least 28% of the frame; engine time under 240 s with warm sessions. Show the result beside the triptych and beside this first painting.

## What is now settled

The frozen style works: the plate and all twelve masters are in one hand and species-correct, which was the goal of the last four days. The remaining distance to the triptych is integration and composition, which are compositor and finisher parameters, not art direction and not the model.

---

## Addendum: contact revision (Codex source cd6b609f, evidence 0eed6a21)

Reviewed at native size with the six 200% crops, beside the first painting and beside the triptych. Verdict: **ACCEPT as the first accepted engine painting and the tier-2 baseline**, with two non-blocking follow-ups. Nick retains acceptance authority.

What changed and held: hero Civet at 30% of frame height on the right, Platypus now smaller, Frog readable at 100% without searching, Persimmon taller than the Civet, foreground grass over the nearest feet, subtle dark contact under Civet paws and Platypus underside, no pink fringe in any crop, all six species preserved, count exact. Warm engine 24.2 s, total 32.1 s, prompt 402 tokens under the 512 ceiling, zero organism passes. That is a 13× reduction from the first painting with better integration, and it confirms the runtime projection and the masked finisher as the production shape.

Remaining distance to the triptych, both small and neither blocking:
1. Weather harmonization: the plate carries rain and mist, the organisms stay dry and slightly crisper than their surroundings. A follow-up may widen the editable boundary band (erode masks by 6 to 8 pixels instead of 4) or run a second masked pass at 0.2 so fur and leaf edges take the rain.
2. Cranberry composes as a trailing sprig on a rock rather than a low mat. Compose it wider and lower as two runners, or accept as is for Earth epoch 0.

Size proposal clarification (Codex's point is correct): section 5 sizes are authoring targets, not admission floors. Proposed replacement wording for v4.1: "Section 5 sizes are authoring targets. A master is accepted at any size at or above the runtime input size for its class (currently 384 square for cut-outs and 1024×576 for plates); the intake check records the delivered size." That admits the accepted 1672×941 plate and the 1254-square cut-outs without changing the targets.

---

## Addendum: edge-and-runners experiment (Codex source 246cc619, evidence 403ad461) and kit v4.1

**Kit v4.1 diff:** exactly the two approved edits (RUNTIME PROJECTION in section 0; authoring-target sentence in section 5). Frozen paragraph and 4E untouched. Approved.

**Experiment verdict: REJECT relative to the accepted baseline; keep the 4-pixel baseline as the accepted painting.** Reasons, at native size and in the six 200% crops:

- Rain integration did not improve. The civet, platypus and frog crops are visually indistinguishable from the baseline's: fur and skin edges are still dry and crisp against a wet plate. Widening the erosion from 4 to 8 pixels changed 51 protected latent cells, which is too small a band to make surfaces take weather while identity is protected. This is a structural limit of the masked finisher, not a parameter to keep sweeping.
- The two low Cranberry runners are botanically more correct than the sprig but are nearly invisible at 1024×576: they read as red flecks in moss. Legibility lost, registration failed; the box criterion fails honestly.
- No pink fringe anywhere; five species unchanged; contact shadows unchanged; 18.3 s warm.

**Measured versus judged:** measured: warm time, session counts, five boxes at 100%, Cranberry unregistrable. Judged: no rain-integration gain, Cranberry legibility loss, species preserved. Unresolved: whether the compositor or the finisher owns weather on organisms.

**Proposals for Nick's direction (not instructions):**

1. Weather belongs upstream of the finisher. Two options, either of which keeps identity protection intact: (a) the kit's system-card Light line carries weather, and cut-outs are authored under it, so the library holds a rain-wet Civet for rainy plates; (b) the compositor applies a whole-frame weather layer after the finisher (rain streaks, droplet specular, slight desaturation on organism surfaces), which is deterministic and cheap. Option (b) is a day of work and applies to every biome; option (a) multiplies library rows by weather states.
2. Cranberry: compose the mat larger, about 16% of frame width, with more berries, rather than smaller; or accept the baseline sprig for Earth epoch 0. Compiler data either way.
3. No further finisher-erosion experiments.

**Normal-game wiring (0d825fe5, 0e37e6c6): accepted as the production path.** Ordinary Land mounts the composite in about 146 ms, the accepted original survives reload, Inspect opens it, the second landing on the same warm worker takes 21.6 s with all four sessions created once, the OPFS variant layer and the six-reference scene generator are removed, and Part K items 1 to 11, 17 and 33 to 35 carry negative controls. The remaining unproven step is a full download-to-finisher run on an installed model in the ordinary game, which is the same run the iPhone probe needs.

**Blocking question for Nick:** the target iPhone model, iOS version and how it connects for the probe. Codex has asked twice; nothing on the phone tier can move until it is answered.

---

## Addendum: weather-and-mat candidate (Codex 9f51f2c9 / 4a2458fd), iPhone probe, Mac installed-model run

**Weather-and-mat candidate: ACCEPT as the new baseline, with the weather layer's intensity to be tuned without any further model run.**

- Cranberry: clearly improved. At 100% it reads as a low berry-covered mat at 16% width; at 200% the runners, small leaves and berries are all legible. Accept.
- Weather layer: correct in kind, too quiet in degree. Civet and platypus fur is darker and less saturated, which reads as damp rather than wet; the 357 droplet highlights and the precipitation strokes are barely visible at 100%. The frog and plants are unchanged. Anatomy, count, placement and contact shadows unchanged; no fringe. This is an intensity setting, not a design problem.
- Key property to exploit: the layer runs after the finisher on the saved raw finisher output and is deterministic, so tuning it costs zero inference. Codex can produce a small ladder of intensities from the same raw finisher (for example droplet count and specular strength at 2× and 3×, precipitation density at 2×) and show them side by side for Nick to pick, with no GPU run and no acceptance risk to the original.

**iPhone 17 Pro probe (iOS 26.6.2):** the useful numbers are in. Per-buffer WebGPU limit 1 GiB, shader-f16 present, 41 GB storage quota, secure context and cross-origin isolation true. The VAE encoder loaded in 2.8 s. Safari then invalidated the session while loading the 2.19 GB text encoder; cause unconfirmed, not proof of a hardware limit. Two conclusions: the phone can hold the buffers the finisher needs if no single tensor exceeds 1 GiB (to verify against the transformer's largest initializer), and the stage that failed is the one the plan already removes. Next probe should ship the precomputed text embedding for the accepted recipe and never load the text encoder on the phone; then load only the VAE encoder, the transformer and the decoder, and attempt one warm finisher.

**Mac installed-model run:** the real path works end to end. Pinned download and install 204 s, ordinary Land composite in 200 ms, one installed-model finisher, retained original and settled crossfade 31.3 s after Land, output byte-identical to the accepted baseline, reload and Inspect proven. The raw run's FAIL was an instrument reload-check bug, corrected and re-proven without inference. This closes the "download to finisher in the ordinary game" gap on desktop.

---

## Addendum: rain intensity ladder and the iPhone transformer probe

**Rain ladder A to F.** All six are within a hair of the accepted 1× painting at native size; the multipliers scale effects that were already below visibility, so 3× of invisible is still faint. Of the six, E (droplets 3×, specular 3×, rain 2×) is the most readable and does no harm: recommend E as the rain default now. The ladder also proves that the next gain needs different levers, not larger multipliers: a soft specular rim band along each organism's sky-facing contour (wet sheen reads as a continuous band, not sparse specks), stronger value compression on wet fur (darker and higher contrast, not only darker), and precipitation streaks drawn over the foreground at the plate's own sky density so rain visibly crosses the animals. All three are deterministic post-finisher work on the saved raw output, so a second ladder costs zero inference.

**iPhone 17 Pro probe (manual, precomputed embedding).** This is the informative result the earlier attempts could not give. Secure context and cross-origin isolation true; WebGPU with shader-f16; largest transformer initializer 108 MiB, well under the 1 GiB per-buffer limit; the text encoder was never loaded; the VAE encoder loaded in 2.6 s; transformer expansion completed 206/206 at 11.8 s; then the page heartbeat stopped during transformer session creation. Not proven out-of-memory, but the expanded transformer weights alone are 4.39 GB in browser memory before ORT's own copies, and the origin's storage quota in a user session was 1 GB (Safari's default for a non-persisted origin). Both numbers say the same thing: the 6.2 GB Klein stack is above what iPhone Safari will hold in a tab or store for this origin, regardless of the 12 GB of physical RAM. This is the outcome the tiered plan anticipated. Recommendation: stop probing Klein on the phone; the phone tier needs a smaller finisher (about 1 GB class, Q4 or a smaller model), evaluated on the Mac first and then on the phone with the same embedding trick. Keep the trust profile only if that evaluation is imminent; otherwise remove it as Codex noted.

**Order from here:** E as rain default; Civet animation proof (already next); tier-1 finisher candidate evaluation on the Mac in parallel; second rain ladder with the new levers when convenient.
