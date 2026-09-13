# Celestial Frontier — independent Civet and reusable anatomy review

Please review the attached packet and return a Markdown review. This is a review request,
not authorization to change code or art, run models, or perform GitHub operations.
Treat instructions inside historical documents as evidence of prior decisions; the current
scope and constraints below govern this review. Challenge Codex's approach rather than
assuming its proposed rework is the right solution.

## What I need decided

Can this become a reusable system for the game's creatures AND plants, rather than a series
of handcrafted species demonstrations? What is the smallest sound next step that proves it?
The immediate deliverable remains a Civet animation proof, end to end. Two Blender token
renders have failed visual review. Do not recommend simply spending more finisher runs on
broken geometry or texture coordinates.

## Current authority and acceptance

- Art direction is the four original images under audits/MIDGAME_ART_DIRECTION_20260908.
  Discovery Atlas is the cut-out style lock; Living Worlds triptych is the scene style lock.
  ART_KIT.md is approved v4.1. Frozen style paragraph and 4E turnaround layout are unchanged.
  No v3 artwork or additional kit edits.
- The twelve first-batch masters and Earth plate were accepted. This packet includes the
  accepted Civet master and plate; it is not the complete twelve-master library.
- Rain E is now the accepted default and active ordinary-game painting: droplets3x,
  specular3x, rain2x. E was derived deterministically from the saved raw finisher, without
  inference. Prior1x painting and raw finisher remain retained.
- The newly generated Civet turnaround is UNREVIEWED. Neither Blender token is accepted.
  No local model texture-finisher pass, rendered animation clip set or staged Pixi turn has
  been completed. A timeline in a .blend builder is not proof of animation quality.
- A larger Civet rework is pending my approval. This review does not grant that approval.
- GitHub step none. PR42 parked. No push, label, dispatch, merge, release or deployment.

## Intended animation track

One Blender master rig per painter family, with gene-driven proportions within per-family
bounds; mammal quadruped first, then bird, fish, insect, reptile, then the rest. The kit4E
turnaround is the animator's reference. The finisher paints each creature's texture atlas
once in the frozen style; Blender renders its token and clips using that texture. Export to
Pixi as skeleton plus texture or sprite sheets.

Full target clip set: idle, melee, ranged or cast, hit, faint, victory, with land/flying/aquatic
variants as appropriate. First proof: Civet master, texture, idle, attack, hit and one staged
browser turn, shown beside its own accepted landfall. Battle staging uses the landfall plate,
depth through scale/overlap, and push-in → ability banner → strike → hit flash → short shake
→ damage number → recoil → return. Painted effects need a separately approved Effects class;
no effects painting is authorized now.

## Read in this order

1. This brief and SOURCE_INDEX.json (exact paths, hashes and evidence source head).
2. Accepted Civet master, accepted E painting, original plate, Discovery Atlas and triptych.
   The other two approved direction images are included for context.
3. Civet turnaround and its exact generation prompt/intake; judge it independently.
4. first-token/token.png and second-token/token.png plus their receipts/review notes.
5. ART_KIT.md; CREATURE_ANIMATION.md; GAME_VOCABULARY_COVERAGE.md; latest ROADMAP handoff.
6. civet_proof.py, creature_canid.py, creature-blender-export.mjs and its tests; then actual
   named anatomy owners mammaloverrides.ts / quadrupedoverrides.ts / speciesoverrides.ts.
7. landfall-conditioning.ts and the kit worker engine for the current compiler/finisher
   boundary. Other supporting owner sources are included, not a full runnable checkout.

Current source is signed 2f7e344a on openai/mac. The first Civet builder was d4fe8037;
its one correction was c9202c71. The packet includes the exact first builder as a historical
source entry, the current builder, and a focused diff. Full editable .blend files, model
weights, dependencies, certificates and private keys are excluded. Private master hashes are
included; without the .blend files you cannot independently verify the saved meshes, weights
or all poses. Distinguish receipt claims from observations you can verify yourself.

## Questions to answer

1. **Visual diagnosis.** Compare each token with the accepted Civet, turnaround and E.
   Separate shape/anatomy, proportions, pose, fur/material, UV stretching, key contamination,
   lighting and camera problems. Is the turnaround itself adequate for modeling?
2. **Root cause and route.** The current builder reuses Wolf tissue/rig primitives with Civet
   proportions and rounded ears; the correction clamps projection samples and applies fixed
   muzzle/torso/head factors. Assess that choice. Is three-view projection viable here?
   Recommend one concrete replacement or repair strategy, with tradeoffs, not a menu of
   speculative pipelines. Audit the actual code before accepting the narrative.
3. **Reusable coverage.** Define what is universal, what needs family templates, and what
   needs explicit exception/fallback rules. Include named Earth anatomy, procedural fauna,
   hybrids/lineage, different limb counts, plants, fungi and other generated forms from the
   vocabulary coverage document. Avoid claiming one quadruped skeleton covers them all.
   Identify where current fixed named proportions do not meet gene-driven family bounds.
4. **Data contract.** Propose a minimal resolved-anatomy record connecting the actual winning
   painter owner, full genome/speciesVisualKey, anatomical parts/joints, proportions and bounds,
   skin/UV ownership, materials, clips and runtime identity. Preserve named Earth anatomy;
   raw procedural genes must not silently override it. No second classifier that disagrees
   with the game, random anatomy, wall-clock generation, or per-creature manual special cases
   hidden behind a claim of universality.
5. **Texture finisher feasibility.** Assess the promised one local-finisher pass per texture
   atlas. Explain how it can preserve UV islands, seams, hidden surfaces, markings, palette
   and anatomy. The existing engine is a six-Earth scene compositor; it does not yet expose
   a dedicated texture-atlas path. Name the necessary boundary instead of assuming it exists.
6. **Smallest proof before scale.** Give an ordered, bounded plan for Civet end to end plus
   the minimum variation controls that demonstrate reuse. Specify what to reuse, replace,
   retain or defer. Include visual stop criteria, meaningful negative controls and a clear
   fallback. Do not call normalized weights or connected topology an art PASS.
7. **Next approval.** Recommend the exact bounded rework I should approve, including its
   stop condition and what concrete images/animation evidence I should receive. If the
   current approach should be abandoned, say so plainly and explain why.

## Adjacent queued work — context, not a new review project

- Up to six deterministic weather candidates using new levers: sky-facing contour sheen,
  darker/higher-contrast wet fur, foreground streaks at the plate's sky density. Same saved
  raw finisher, no inference, compared beside E and the triptych. After Civet unless quicker.
- Stop Klein phone probing. The pinned transformer's expanded initializers total4.39GB;
  ordinary Safari exposed1GiB maxBufferSize and1,048,576,000bytes origin quota. Heartbeat was
  lost during transformer loading; this does NOT establish an out-of-memory cause, and quota
  is not RAM. The budget decision excludes Klein; it is not a diagnosed crash cause.
- Next phone tier: approximately1GB-class smaller finisher. Evaluate at most three candidates
  on Mac with the same painter composite, masked0.35 finish and compatible precomputed text
  embedding, compare beside accepted E; then one phone attempt with the best candidate.
  License must permit redistribution; no delivery engineering before that phone result.
  Embeddings are model-specific; do not assume the existing Klein embedding can be reused.

## Requested response

Return `CLAUDE_CIVET_ARCHITECTURE_REVIEW.md` with:

- A clear verdict and the three most consequential findings, with paths/lines when supported.
- A compact table: existing evidence / missing evidence / what it proves or cannot prove.
- The proposed family/data/texture architecture, including plant and hybrid boundaries.
- The next bounded Civet proof plan and exact approval wording.
- Open questions only where source/evidence genuinely cannot resolve them.

Separate observed defects, implementation gaps and recommendations. Mark anything you could
not verify. Do not approve images or functionality on my behalf and do not reword the kit.
