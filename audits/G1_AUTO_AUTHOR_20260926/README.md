# G1 auto-author — painting + family → authoring.json (Generated Creature Pipeline, 2026-09-26)

Program: `audits/GENERATION_PIPELINE_20260926/PROGRAM.md` (Nick D22/D23). Owner: Claude. Status: **built and measured; the gate (≥ 30/38
admitted with zero hand edits) is NOT met.** Best result: **12/40 admitted and PASS_STATIC with zero hand edits** (v2), and a mutation
battery that refuses wrong families 34/34 and flipped facing 33/34, but **erased limbs only 23/34 and duplicated limbs only 23/27**.

## What it is

- `port/v2/tools/anatomy-verify/auto-author.mjs`: turns a painting plus its family into the exact `authoring.json` Codex hand-writes (id, family, habitat, landmarksPx, groundLineY, materials, remainderPart, parts[{id, joint, layer, polygonPx}], coverage). It also writes a `cf.anatomy-presence/v2` declaration: all-visible, with hidden and folded **never inferred**.
- The output feeds Codex's **unchanged** `port/v2/tools/creature-animation/intake-authored.mjs`.
- **Method: registration by transfer.** There are no creature or family special cases.
  1. The silhouette comes from the master's alpha, or from the magenta key (`keyAndDespill`) for opaque masters.
  2. Its outer contour is matched to each same-family REFERENCE with cyclic dynamic time warping (DTW) on bbox-normalised position plus local turning.
  3. A regularised thin-plate spline built from the matched points carries the reference's landmarks and part polygons.
  4. Landmarks are snapped onto paint.
  5. v2 options:
     - `topK=1`: landmarks from the single best reference, so the skeleton's proportions stay coherent;
     - `chains`: every contract contact chain's knee and end are placed along the painted leg's medial-ridge path, at the reference's bone-length fractions.
- **The verdict uses only the target's visible paint:**
  - `missing-anatomy`: a mapped part covers too little paint;
  - `unexplained-anatomy`: a large painted region no part claims, away from the body;
  - `facing`: the mirrored painting matches the family better;
  - `wrong-family`: another family matches clearly better;
  - `no-reference`: no other hand-authored subject of the family exists.
- **Evaluation corpus (`corpus.json`):** 40 subjects, one canonical hand-authored packet each. The test is **leave-one-subject-out**: a subject's own packets are never its reference, and the author never reads the subject's `authoring.json`. `subject-source.json` (species name and genome, not anatomy) is copied into the auto packet.
- **Materials and habitat are automatic:**
  - Materials: a family default table.
  - Habitat: the Earth fauna profile's media (water → aquatic, ground+water → amphibious, ground → land, air only → aerial). Adult flight stays a declaration.
- **Static gate (`harness/`):** the sprint static gate (`audits/ARCHETYPE_SPRINT_20260922/static.ts` + runner), re-rooted to this worktree. The gate logic is identical; only the import paths and ROOT changed (14 lines). The original hard-codes Codex's worktree and refuses paths outside it.

## Results

| Run | Settings | ADMIT + PASS_STATIC | ADMIT + RED | ADMIT + intake refused | REFUSE |
|---|---|---:|---:|---:|---:|
| **Control** (hand-authored packets, same harness) | — | **30/40** | 8 RED | 2 intake refused | — |
| v1 | median of 3 references | 7/40 | 10 | 1 | 22 |
| **v2** | best reference + contact-chain ridge placement | **12/40** | 4 | 2 | 22 |
| v2 diagnostic | static run on the 14 refused authors | +5 would pass (heron, herring, ibex, racer, river-otter) | 3 | 6 | — |

**v2 per subject** (`auto-v2/summary.json`; landmark error = median distance to the hand landmark, in body lengths):

| Subject | Family | Verdict | Static | Landmark error | Note |
|---|---|---|---|---:|---|
| bass | fish | ADMIT | PASS | 0.056 | |
| cattle | quadruped | ADMIT | PASS | 0.067 | |
| cougar | quadruped | ADMIT | PASS | 0.038 | hand control is RED on this harness |
| gull | biped-bird | ADMIT | PASS | 0.038 | |
| impala | quadruped | ADMIT | PASS | 0.041 | |
| pike | fish | ADMIT | PASS | 0.035 | |
| reef-shark | fish | ADMIT | PASS | 0.049 | |
| salmon | fish | ADMIT | PASS | 0.058 | |
| sturgeon | fish | ADMIT | PASS | 0.035 | |
| tang | fish | ADMIT | PASS | 0.059 | |
| wild-horse | quadruped | ADMIT | PASS | 0.042 | |
| wolf | quadruped | ADMIT | PASS | 0.051 | |
| brown-bear | quadruped | ADMIT | RED | 0.105 | claw, tail, cast, victory (hand control also RED) |
| eagle | biped-bird | ADMIT | RED | 0.039 | alert, cast, victory |
| sandpiper | biped-bird | ADMIT | RED | 0.147 | alert, victory |
| sparrow | biped-bird | ADMIT | RED | 0.054 | faint |
| grouse | biped-bird | ADMIT | intake refused | 0.037 | observed surfaces: contact conflicts with fixed owner |
| salamander | quadruped | ADMIT | intake refused | 0.037 | part-mask polygon |
| heron, herring, ibex, racer, river-otter | — | REFUSE | (diagnostic PASS) | 0.03–0.07 | false refusals: thin parts (shin, dorsal fin, ear tip, head) land beside their paint |
| goose, marmot | — | REFUSE | (diagnostic RED) | 0.04, 0.03 | |
| rat, wall-lizard | quadruped | REFUSE | (diagnostic intake refused) | 0.05, 0.04 | |
| python, eel | serpent | REFUSE | (diagnostic intake refused) | 0.06–0.07 | the three serpents are posed very differently |
| beetle, dragonfly, honeybee | insect | REFUSE | (diagnostic RED / intake) | 0.13–0.14 | three insects with very different wing states |
| starfish, jellyfish | radial | REFUSE | — | 0.16–0.18 | a five-armed star and a bell with 12 arms share no geometry |
| tree-frog, chimpanzee, tarantula, octopus, fruit-bat, centipede | singletons | REFUSE | — | — | no-reference: the only hand-authored subject of their family |

**Mutation battery** (`run-mutants.mjs`, v2 settings, the 34 subjects that have a reference; `mutants/summary-v2.json`). Each mutant is built from the subject's own hand labels, which define the mutation only:

| Mutant | Must REFUSE | Result |
|---|---|---|
| wrong family (authored as another family) | ✔ | **34/34** |
| flipped facing (mirrored painting) | ✔ | **33/34** |
| erased limb (one contact chain, or the largest leaf part, erased) | ✔ | 23/34 |
| duplicated limb (that limb pasted into free canvas) | ✔ | 23/27 (7 not applicable: no free placement) |
| positives (unmutated) | ADMIT | 18/34 (verdict only) |

## What failed, with numbers (retained)

- **Landmark median of three references (v1):** incoherent bone proportions, and contact-solver scale-compression and joint-limit reds. On the eight admitted-red subjects, best-single-reference turned 3 green and chain placement a 4th (cattle).
- **Ridge climb (`--ridge=0.025`):** lowered landmark error (wolf 0.034→0.026, bass 0.048→0.036), but shortened bones below the contract minimum (wolf intake "proportion bound: bone-min"). Not in v2.
- **Skeleton-grown parts** (nearest-bone ownership traced to polygons; `--skeleton`):
  - Codex's authoring convention differs by family: parent→J bone for birds (0.60–0.66 agreement), neither for quadrupeds (≈0.36–0.38).
  - Choosing per part collides: two parts get the same bone.
  - The family-level choice still refused every trial subject on part-share noise.
  - Kept as an option, not used.
- **Bounded part nudge (`--nudge=0.012`):** admits more positives (heron, marmot), but erased-limb refusal falls from 6/10 to 2/8, and flip and wrong family each leak one. The verdict and part placement share one evidence source, so loosening one weakens the other. Rejected.
- **Absolute DTW cost and detour run lengths:** mutants always cost more than their own positive, but the absolute values overlap across subjects (e.g. impala positive 0.0159 > wolf erased 0.0109). Recorded in the evidence; not used as a gate.

## Why the gate is not met, and the next levers

1. **References.**
   - 6 subjects are singletons (the only hand-authored packet of their family), and the radial, serpent and insect families have 2–3 dissimilar members each.
   - Transfer cannot work without a similar reference. The G2 pilot (Codex: about 20 same-family paintings in the controlled layout) is exactly what raises this ceiling, since each new hand-authored or admitted packet becomes a reference.
2. **Thin parts.**
   - Ear tips, shins, fins and heads land a few pixels beside their paint.
   - 5 authors refused only for this would pass static.
   - The fix must not loosen the paint evidence (the nudge did). Candidates:
     - a part-level local registration that must keep each part attached to its own chain's ridge;
     - or a second, independent limb-count verifier (T1's template-graph walk-back) so that placement can relax while counting stays strict.
3. **Limb counting (erased/duplicated) is the verifier's real weakness:** 23/34 and 23/27. It needs T1's counted-visible-anatomy verdict (the README slices before this one), not a threshold on coverage.
4. **Bird motion reds** (eagle, sparrow, sandpiper): faint, cast and victory refusals under the contact solver. Compare the hand bird fits, which also used observed supports.

## Contract for Codex's review

- **Input:** `master.png` (1254², the controlled layout: side profile facing right), the family id, `subject-source.json`.
- **Output:** `authoring.json` (the same schema Codex writes) plus `presence.json` (all-visible) plus `evidence.json` (verdict, reasons, the best reference, per-reference DTW costs, part paint coverage, detours, chain placement).
- **Codex's `intake-authored.mjs`, fit chain and gates are unchanged.**
  - A REFUSE is never fed to intake, except in the labelled diagnostic run.
  - An ADMIT still has to pass intake, static and native gates, and Nick's visual acceptance.
- **Please review:**
  - (a) whether copying `subject-source.json` is acceptable (species metadata, not anatomy);
  - (b) the materials default table (the free-text `materials.surface`);
  - (c) whether habitat-from-profile is acceptable, or must stay declared;
  - (d) the re-rooted static harness (a diff of 14 path lines against your `static.ts`).

## Reproduce (from the worktree root)

```sh
node audits/G1_AUTO_AUTHOR_20260926/run-control.mjs                                  # hand-authored ceiling
node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=v2 --topk=1 --chains          # the v2 author
node audits/G1_AUTO_AUTHOR_20260926/run-mutants.mjs --tag=v2                         # mutation battery (verdict only)
node audits/G1_AUTO_AUTHOR_20260926/report.mjs auto-v2                               # per-subject table
```

Fits and master copies are regenerable and git-ignored (`.gitignore`). Scores, evidence, generated authoring and presence, and static reports are committed.
