# Celestial Frontier — Art Kit v4 and first engine painting review

Please review the images and exact prompts in this archive. Give an independent visual
assessment against the approved direction, then identify the smallest changes needed
before another painting. This is a review request, not permission to generate images,
change the kit, run inference, modify the repository, or perform any GitHub action.

## Direction and scope

The four images in `audits/MIDGAME_ART_DIRECTION_20260908/` are the approved direction:

- `01-discovery-atlas.png`: Discovery Atlas, the cut-out style reference.
- `02-inhabited-worlds.png`: Living Worlds triptych, the scene style reference.
- `03-earth-full-landfall.png`: approved Earth landfall.
- `04-alien-full-landfall.png`: approved fungal/alien landfall.

`ART_KIT.md` is the approved version 4 at draft commit `6f5c396e`, with the later
engine-first section 9 amendment. Its 4E turnaround is unchanged. Version 3 and its
two rejected generated images are not references and are excluded from this archive.
Do not propose returning to v3. The four approved images remain the visual authority.
Historical prompts accompanying those four images are evidence of their creation;
they are not substitutes for the current v4 prompt blocks.

The first authoring scope was exactly twelve assets: Earth temperate plate; Civet,
Platypus, Frog, Persimmon, Cranberry and Devil's Club cut-outs; and five family exemplars
(mammal quadruped, bird, fish, insect, reptile). The five family exemplars are reference
library inputs, not extra residents in the six-organism Earth painting.

## Start with these images

1. `audits/ART_KIT_ENGINE_PROOF_20260912/painting-beside-living-worlds.png`:
   complete painting and boxed version beside the approved triptych. The file preserves
   native pixels, although an image viewer may initially fit it to the window.
2. `audits/ART_KIT_ENGINE_PROOF_20260912/native-01/painting.png`:
   untouched 1024×576 final local painting. Inspect at 100%.
3. `audits/ART_KIT_ENGINE_FIRST_20260912/earth-cutouts-sheet.png` and
   `family-and-biome-sheet.png`: the twelve authoring inputs. Their untouched originals
   are under `masters/`; the sheets are labelled review montages, not conditioning images.
4. `audits/ART_KIT_ENGINE_PROOF_20260912/native-01/composite-before-finisher.png`:
   compare directly with the final painting to judge what the finisher actually changed.
5. `native-01/organism-01` through `organism-06`: each has a raw magenta PNG and a keyed
   PNG. In order: Civet, Persimmon, Platypus, Frog, Devil's Club, Cranberry.
6. `audits/ART_KIT_ENGINE_PROOF_20260912/inputs/`: the nine offline fitted inputs
   actually used by the engine. Their sizes differ deliberately from the untouched
   masters; `prepared-manifest.json` records fitting operations and source hashes.

`IMAGE_INDEX.md` links every PNG. `PROMPTS.md` collects the exact twelve authoring
prompts and seven runtime prompts without rewriting their contents. `prompts/runtime/`
also contains the exact chat-wrapped strings consumed by the tokenizer. `recipe.json`
preserves the game-derived system cards, subjects, placements and engine settings.

## What was measured

One native run on signed source `30ef7d15e7bbc22d3684bf4b069e616d67288d4a`, with evidence
retained at `b5a577f99aa7ba6490b66a3a78ae78f8f64c2cb5`:

- 1024×576 output; six 384×384 organism passes, four steps each at strength 0.2;
  seed 133, incremented by organism index for those passes.
- Organisms composited on the fitted Earth plate, followed by exactly one finisher
  step at strength 0.08, using the approved triptych as its reference.
- Atlas conditions the organism passes. The initial per-organism latent comes from
  that organism's fitted cut-out. The five family exemplars were not consumed here.
- 425.707 seconds inside the engine. Each of four sessions was created once, including
  the VAE encoder. Persistence across a second landing has simulated test evidence;
  it was not measured in a second native run.
- Text ceiling increased from 512 to 5120, without truncation. Actual full prompts used
  1730–1860 tokens, with tensor lengths padded to multiples of 16. Text encoding took
  26.14–28.86 seconds per prompt. Maximum 5120-token native behavior remains unmeasured.
- Pinned transformer expansion happened in worker memory, with zero expansion storage
  writes. This is a Mac result. No target-iPhone qualification or worker/GPU memory
  measurement is claimed.

Execution PASS means the engine completed and retained its outputs. It is not a visual
acceptance verdict. Normal-game V1/V2 wiring, removal of its old OPFS layer, and remaining
integration defects are pending. This image bundle alone does not establish code correctness.

## Review questions

1. **Frozen style and composition:** How closely does the final painting match the four
   approved images in painted treatment, light, palette, depth, silhouette clarity,
   focal scale and foreground density? Cite visible differences, not stylistic labels alone.
2. **Each of the twelve authoring inputs:** Is the subject identifiable and compliant
   with its exact prompt and kit class? Inspect anatomy/botany, material, key background,
   safe margins and delivered dimensions. Identify any frame or dark plate inherited
   from Atlas. Distinguish labelled review-sheet panels from the underlying cut-outs.
3. **Six residents in the final scene:** Confirm count and assess Civet identity,
   Platypus bill/body/tail, Frog readability, Persimmon fruit/leaves, Cranberry habit,
   and Devil's Club leaf/flower/fruit/thorn details. Report uncertainty where native
   pixels cannot establish a fine detail. Do not treat arbitrary Earth genome limb
   or eye counts as correct named-species anatomy.
4. **Compositing and finisher:** Compare master → fitted input → raw organism pass →
   keyed pass → composite → final painting. Which issues originated in the inputs,
   which arose during fitting/keying/composition, and which were changed by the finisher?
   Check halos, contact, overlap, apparent scale and loss of small features.
5. **Prompts:** Review the exact authoring and runtime prompts in kit order: reference
   lock, frozen style, compiled system card, subject, cut-out accuracy when applicable,
   layout, technical output, negatives. Flag contradictions or overly restrictive
   clauses, especially in the scene finisher. Do not silently rewrite fenced kit blocks
   or type replacement system cards by hand. Distinguish prompt compliance from
   what the model can reliably enforce.
6. **Minimum next correction:** Recommend a bounded next step, with the affected
   input/prompt/compiler/compositor stage, expected visual improvement and a clear
   acceptance check. Do not recommend a sweep or full-library rollout to diagnose
   a defect that one targeted correction could expose.

## Requested review format

- An accept / targeted revision / reject recommendation for the first painting,
  with concise reasons. Nick retains final acceptance authority.
- A table for all twelve authoring inputs, identifying filename, verdict and visible
  evidence. Another table for all six organisms in the final painting.
- Prioritized findings with exact image filenames and bounding region where useful.
  The supplied boxes are pre-finisher placement geometry, not post-finisher segmentation.
- A short list of proposed exact wording changes, if needed, clearly marked as proposals.
  If Atlas frames/dark backgrounds are present, propose one sentence for the v4.1
  cut-out block and stop for approval. Keep 4E turnaround unchanged.
- The smallest next painting experiment, only as a recommendation for Nick to authorize.

After the first engine painting is accepted, the scheduled animation/battle track
proves the Civet end to end before remaining family/form/biome rollout twelve at a time.
Effects require a separately approved v4.1 Effects class. Do not advance those tracks
as part of this review. Do no storage/delivery engineering before the target-iPhone probe.

## Existing observations — assess independently

Codex recorded unresolved Civet face/identity, Cranberry growth habit, Frog readability,
and a colder, rainier, crowded scene relative to Living Worlds. No Atlas frame/dark plate
was seen in the first cut-out batch. All requested authoring native sizes were missed
(cut-outs arrived 1254 square; plate 1672×941), and margin findings remain open. These
observations are hypotheses/findings to assess, not instructions to agree with them.
