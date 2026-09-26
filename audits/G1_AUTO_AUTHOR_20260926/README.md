# G1 auto-author — painting + family → authoring.json (Generated Creature Pipeline, 2026-09-26)

Program: `audits/GENERATION_PIPELINE_20260926/PROGRAM.md` (Nick D22/D23). Owner: Claude.

**Status (end of session 2, 2026-09-26): the corpus gate (≥ 30/40 admitted with zero hand edits) is NOT met.**
- Adopted author **v5:**
  - **12/40** on the leave-one-subject-out corpus;
  - **10/20** on Codex's independent G2 quadruped pilot (new generated paintings, no hand authoring anywhere).
- The mutation battery meets its target: erased limbs refused **31/34 (91 %)**, duplicated **26/27 (96 %)**, wrong family **34/34**, flipped facing **34/34**.
- Codex's five blocking review findings are fixed (see "Session 2").
- The gate's denominator needs Nick's decision (**D24**). By construction this corpus cannot reach 30:
  - 6 subjects have no same-family reference;
  - the radial, serpent and insect families have 2–3 dissimilar members each;
  - the hand-authored control itself scores 30/40 on this harness.

## Session 2 (2026-09-26): v3 → v6

| Run | Author | Corpus ADMIT + PASS_STATIC | G2 pilot ADMIT + PASS_STATIC | Mutants: erased / dup / flip / wrong |
|---|---|---:|---:|---|
| v2 | best reference + chains | 12/40 | — | 23/34 · 23/27 · 33/34 · 34/34 |
| v3 (= limb-counter branch, v3d rules) | + independent visible-appendage counter (`limb-counter.mjs`) | 12/40 | — | **31/34 · 26/27 · 34/34 · 34/34** |
| v4 | + Codex review fixes, polygon untangle, labelled fallback | *instrument failure* (below) | — | unchanged (summary-v4) |
| **v5 (adopted)** | + species-group materials | **12/40** | **10/20** | 31/34 · 26/27 · 34/34 · 34/34 |
| v6 (rejected default) | + reference shopping (`--shop=2`) | 15/40 (+marmot, river-otter, herring) | 12/20 (+brown-bear, wild-horse) | **29/34 · 24/27 · 33/34** · 34/34 |
| v7 (salamander, grouse only) | + canvas clamp | salamander: intake now PASSES, static RED (its hand control is RED too); grouse: intake still refused | — | — |

**The limb counter (branch `claude/t1-limb-counter`, merged).**
- It reads paint only:
  - detached islands;
  - protrusions outside an eroded body core (with attachment, extent and a geometric class);
  - separate ground contacts in the bottom band.
- The admission rules are:
  - an extra detached island;
  - an unassigned target appendage ≥ 6 % of the paint;
  - the family floor on the rear class;
  - the ground floor: at least as many ground contacts as the fewest any same-family reference shows.
- The v3d battery reproduced exactly this session (`summary-v3d-repro.json`).

**Adopted fixes (v4/v5), each retained in evidence:**
- **Presence is measured** (Codex finding). Without the counter's visible inventory, the author refuses (`presence-unmeasured`); the skeleton mode is diagnostic only. Nothing is ever declared absent, hidden or folded. A species absence (the lynx's bobtail, a tail-less primate) therefore REFUSES; it is never guessed.
- **id from the corpus row** (never the target's authoring). Identity checks cover subject-source family, profile, genome seed and visualKey.
- **Materials.** Codex's neutral string cannot pass any gate: the motion kit REFUSES an unclassified surface (`body-card` `unsupported-materials`, pinned by `body-card-presence.test.ts`). v4's static therefore refused every subject (the instrument failure above).
  - v5 uses the species group's integument, keyed by the pinned Earth profile id (`SPECIES_MATERIAL` in `run-auto.mjs`): felid → fur, lizard → scales, eel/salamander/frog → smooth skin, cnidarian → translucent.
  - An unmapped group refuses (`materials-unknown`).
  - Side finding for Codex: the Honeybee hand material "chitinous shell with short thoracic fur" maps to *furred*, because `materialFromSkinName` tests `/fur/` first.
- **Outer provenance envelope** (`auto-*/<id>/provenance.json`). It records:
  - automatic transfer;
  - the reference's authoring and master hashes;
  - the target master and subject-source hashes;
  - the profile id, media and hash;
  - the material source;
  - the measured visible inventory.

  It also states that intake's `manualAuthoring=true` / `sourceLandmarksReused=false` are NOT an automatic-origin attestation. Intake itself is unchanged.
- **Geometry-only repairs,** logged per part in evidence:
  - `untanglePolygon` (a self-crossing warped polygon keeps its larger loop);
  - the canvas clamp (vertices past the canvas edge, where there is no paint).
- **`--fallback=N`:** only when an ADMITTED packet is refused by intake/static, try the next-ranked references; each candidate must earn its own ADMIT. It rescued nothing on the corpus (bird ARAP folds and the grouse surface split persist at every rank). It is kept, labelled.
- **`--targets=`:** independent paintings with leave-one-SPECIES-out references (a corpus packet of the same species is never a reference).

**Rejected, with numbers:**
- **Reference shopping** (a verdict-refused author retries ranks 1–2). It admits 3 more corpus subjects and 2 more G2 subjects, but under the identical policy the battery loses erased 31→29, duplicated 26→24 and flip 34→33. It is kept as the option `--shop=N`, off by default (D25).
- **Thin-part nudging** (the v3e family). It admits marmot, river-otter and herring. But their erased far-hind-leg mutants are refused ONLY by the same false ear/tail-tip refusal that rejects the positive: the far hind leg sits behind the near leg, so neither part coverage nor the counter sees it erased. Fixing the thin-part false refusal therefore exposes those erasures. The honest fix is a better far-limb detector, not a looser threshold.
- **Terminal snap distance as an erased-leg signal** (`summary-snapdiag.json`). It is ~0 for erased legs: the spline warp carries the feet onto the warped contour. A dead end.

**G2 quadruped pilot** (`auto-g2-v5/`; Codex's 20 generated masters in the controlled layout; references = the 40 corpus packets, leave-one-species-out; ADMIT + PASS_STATIC is not acceptance: native, finish and Nick's review still apply):

| Species | Verdict | Static | Reference | First reason / static reds |
|---|---|---|---|---|
| Coyote, Red Fox, Arctic Fox, Fennec Fox, Caracal, Cougar, Marmot | ADMIT | PASS_STATIC | Wolf | |
| Raccoon | ADMIT | PASS_STATIC | Cougar | |
| Cattle, Donkey | ADMIT | PASS_STATIC | Wild Horse | |
| Mongoose | ADMIT | RED | River Otter | |
| Tapir | ADMIT | RED | Brown Bear | melee:tail, faint |
| Lynx | REFUSE | — | Wolf | tail1 covers 26 % paint (reference 95 %): bobtail |
| Brown Bear, Bison, Camel, Wild Boar | REFUSE | — | Wild Horse | tail3 covers 0–12 % (reference 38 %): short tails |
| Badger | REFUSE | — | Cougar | far ear tip covers 10 % |
| Wild Horse | REFUSE | — | Cattle | an unassigned limb-down appendage of 7.5 % |
| Goat | REFUSE | — | Ibex | near ear tip covers 0 % |

The dominant G2 refusal is the **short tail**: the reference's tail chain has no paint. It is correctly refused, because presence never declares an absence. The levers, in order:
1. G2 prompts that paint the species' true tail clearly;
2. a short-tailed reference in the pool (only via admitted, independently accepted packets; never bootstrapped unchecked, per Codex's review);
3. a measured-absence declaration: truncating a tail chain whose paint is measured absent. This needs Codex's intake/presence contract review first.

**v9–v11 (session 3, continued): four levers tried; one bug fixed, no count change.**

| Lever | Result | Status |
|---|---|---|
| **Near/far limb separator** (`limb-separation.mjs`, measured inside the author on the mutation battery, `summary-v9-sepdiag.json`): contact between the transferred near and far limb regions inside paint, and the image edge there against interior texture | **Dead end.** Erased-far-leg mutants often show MORE contact than the unmutated positives (Wolf 87 vs 14 px on the hind pair, Marmot 108 vs 29, Sparrow 47 vs 16), with the same edge ratio (~2–3). The transferred far-leg polygon lands on the near leg's own paint, so the "edge" is ordinary texture inside one leg; many true positives touch nowhere (contact 0). No threshold separates them. | module kept as an off-by-default diagnostic |
| **Remainder marker** | A real bug: 18 hand packets mark the remainder part with a ≤ 2 px² origin triangle (3 use the full canvas). The author warped that marker like geometry, or clamped it to three identical points (12/40 packets, every failing bird). Markers are now copied verbatim, and a real part transferred off the canvas refuses. | **adopted (v10):** the battery is identical (31/34 · 26/27 · 34/34 · 34/34); static is unchanged at 12/40 and 10/20 |
| **Per-part swap on the Eagle** (`hybrid-eagle-parts/`): each auto polygon replaced by the hand one, one at a time | **The Eagle's red is entirely its TAIL outline.** Only the hand tail turns it PASS_STATIC; the other 15 swaps stay RED on cast and victory. The transferred tail (from the Gull's shorter tail) leaves 27 % of the painted tail to the body part (`tailcov`); the chest leaks 43 %. Landmark/polygon hybrids (`hybrid-v8/`): Eagle = polygons (hand polygons + auto landmarks PASS); Sparrow = mixed (faint is landmark-driven, cast polygon-driven). | handed to Codex's fit repair (C44) |
| **Paint-grown appendage parts** (`leaf-growth.mjs`, `--grow`, run AFTER the verdict so refusals cannot change): unclaimed paint inside a counted appendage goes to its nearest assigned owner part; contact-chain parts never grow | The Eagle's cast/victory reds clear, but hit/kick reds appear. Sparrow, Sandpiper and Brown Bear are unchanged. Growing feet (the first probe) made contact reds. Net zero: fold behaviour is sensitive to exact outlines, and the counter's appendage blob stops short of the tail root. | option, off by default |

**Where this leaves G1:** the author-side levers available without new information are exhausted. What moves the numbers now is on the painting side (C44):
- **G2 paintings posed with near and far limbs apart** (a stride with no overlap). The paint-only counter then sees every leg, semantic presence resolves, and the thin-part and far-leg ambiguities disappear.
- **True tails painted clearly** (short-tailed species refuse by rule).
- **More same-family references,** only via independently accepted packets.

**v8 (session 3): Codex's second review closed in the runner** (`auto-v8/`, `auto-g2-v8/`; results identical to v5: 12/40, 10/20, same subjects).
- **Canonical identity:** the runner now recomputes `speciesVisualKey(genome)` and refuses on disagreement. Provenance `identity.checks` states exactly what was checked. 60/60 agree.
- **Presence narrowed to what is measured.** Each ADMIT's `provenance.json` `presence` records:
  - the geometric inventory (appendages by class, ground contacts, detached islands);
  - that the empty absent/hidden/folded lists are an intake-format necessity, NOT an all-visible attestation;
  - a semantic status. It is **RESOLVED** only when every reference appendage is assigned AND no appendage merges two limb chains; otherwise it is **UNRESOLVED**, with the unassigned and merged chains named. `playAdmission` stays blocked until semantic presence resolves and native + visual review pass.
- **Result:** RESOLVED for the 6 fish (salmon, sturgeon, bass, tang, reef-shark, pike). UNRESOLVED for all 6 admitted quadrupeds/birds and all 10 G2 passes. The cause is ALWAYS overlapped near/far limbs (for example `foreFar+foreNear`); no reference appendage is unassigned.
- **The one lever that closes both open G1 findings** (semantic presence and thin-part false refusals): a near/far limb separator for overlapped side-profile limbs.

**Codex's second review (C40 answers, `audits/G1_CONTRACT_REVIEW_20260926`), status:**
- **Canonical identity:** `identity-and-shipped38.json` records that for all 60 subjects (40 corpus + 20 G2) the subject-source `visualKey` equals `speciesVisualKey(genome)`. The runner's identity check is still shape-level; a canonical check in the Node runner is next. It would change no result today.
- **The exact shipped-38 ID/status manifest** is in the same file: 32 evaluable (10 ADMIT + PASS_STATIC under v5) and 6 UNEVALUABLE (5 crabs and Civet: no hand `authoring.json`).
- **Open:** "all-visible attestation still overstates the geometric counter". The counter measures appendage/island/ground counts, not per-part presence, so the presence claim must be narrowed to what it measures (next).
- **Codex:** no D24 denominator change accepted (Nick decides); D25 stays off; the short-tail truncation contract is refused (zero distal paint is ambiguous).

**Corpus identity (Codex asked):**
- The PROGRAM's "38" was the number of shipped painted archetypes.
- The G1 corpus is the **40** subjects that have a hand-authored `authoring.json`.
- **32** of those are shipped archetypes.
- The **8** extra are hand-authored but not in the card set: Cattle, Brown Bear, Sparrow, Grouse, Sandpiper, Herring, Wild Horse, Honeybee.
- **6** shipped archetypes have NO `authoring.json` and cannot be evaluated by construction. These are the five crabs and Civet, which came from the earlier labelled-parts rigs.
- **On the shipped-32 subset,** v5 admits + passes **10** (salmon, sturgeon, cougar, impala, bass, tang, wolf, gull, reef-shark, pike).

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
  - Materials: the species group's integument keyed by the pinned Earth profile (v5+; the v1–v3 family default table is retired).
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
node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=v5 --topk=1 --chains --counter --fallback=2          # adopted author (corpus)
node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=g2-v5 --topk=1 --chains --counter --fallback=2 --targets=audits/G2_QUADRUPED_PILOT_20260926/pilot.json
node audits/G1_AUTO_AUTHOR_20260926/run-mutants.mjs --tag=v4 --counter                                      # battery for the adopted author
node audits/G1_AUTO_AUTHOR_20260926/run-mutants.mjs --tag=v6-shop2 --counter --shop=2                        # the rejected shopping policy
```

Fits and master copies are regenerable and git-ignored (`.gitignore`). Scores, evidence, generated authoring and presence, and static reports are committed.
