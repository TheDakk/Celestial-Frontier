# Procedural creatures that match the artwork — the program (Nick, 2026-09-20 early hours)

Author: Claude (anthropic lane). Status: **AUTHORIZED by Nick** ("proceed with your recommendation, but I want to
invest in trust now as that's the ultimate goal"). Extends `../ANATOMY_REVIEW_20260917/MASTER_PROGRAM_20260917.md`
§0 (the vision) and replaces its §5 order from step 3 onward. Nothing here changes kits, lanes, PR42, hosted
authority, determinism or the "one painted hand" rule.

## 0. What R9 taught (both lanes, independently, 2026-09-19 night)
The accepted local finisher (strength 0.35, one step) conserves silhouette, key and geometry perfectly and changes
the painter's crabs almost nothing (SSIM 0.98–0.997 in both builds). The Civet-quality masters were painted by a
strong image model from compiled Art Kit prompts; the local 4B model only finished scene contact. So the look of a
procedural creature comes from **how its master is painted**, not from finishing a painter canvas. The finisher
machinery is kept as desktop polish and as the R9 safety contract (alpha/key/geometry conservation, retained
originals, finished-fit loader). Codex's R9 is canonical at the re-merge; Claude's is a retained diagnostic.

## 1. The strategy (Nick's decision, 2026-09-20): painted library + morphs, and trust as a funded track
Every shipped creature is painted in the kit's one hand at master quality, and its genome is visible in body plan,
proportions, colour and markings. Variety is **combinatorial from a finite painted library**; a feature nobody
painted does not appear. Runtime generation of new anatomy by the local model is Track T's goal and is admitted
only through a measured trust gate.

| Track | Deliverable | Owner |
|---|---|---|
| **P — painted library** | P1 coconut-crab repainted from its compiled prompt with the painter canvas as anatomy guide, admitted, rigged, sheet beside the Civet · P2 two archetypes of one template cut to parts and swapped (assembly proof) · P3 probe count: how many variants each template needs · P4 archetype masters per template + roster, then palette/marking/proportion morphs at runtime | painting + rigging: Codex (has the image tool and the anatomy chain) · compile, intake gates, assembler, sheets: Claude |
| **T — trust** | T1 label-free anatomy verifier (silhouette → template skeleton fit, limb/appendage count, topology) with both-way mutants, calibrated on the painter canvases whose counts are known · T2 qualification battery: local-model generations across templates, human-labelled truth set, GOLD-pass judge second opinion; two numbers, model correctness and **verifier miss rate** · T3 runtime contract: generate once, verify, retain immutable original, refuse into the library fallback; desktop only | Claude (T1, T2 runner, T3 design); Nick labels; Codex reviews read-only |
| **A — anatomy chain** | R3-S through R4 as directed (stance contract, contact limits, native capture); the roster **waits** for P1 | Codex |
| **B — battle2 / E1** | re-merge at Codex's signed producers; parts rig on the family solver under the shared stance contract; pins flip; E1.5 re-shot | Claude |

## 2. Gates
- P1 passes when: the compiled prompt (from genome, palette, template counts, painter canvas as guide) is retained
  with the painted master and its hash; intake (key, masks, landmarks, split) admits it with `masterIntakeAccepted`
  set by the existing chain; the rig's native rows are green (contact, rest, seams, limits); and Nick accepts the
  sheet beside the Civet. Failure on anatomy drift is a finding, not a retry.
- P2 passes when a head (or claw) part from archetype B on archetype A's rig yields green native rows and a sheet.
- T1 passes when, on every painter canvas with a known template, the verifier reports the template's counts, and
  refuses each mutant (leg removed, leg duplicated, two legs merged, head doubled) — both directions, every template.
- T2 reports numbers only: correctness rate per template and the verifier's miss rate on the human-labelled set.
  **Trust threshold (proposed, Nick decides): verifier miss rate 0 on the labelled set and model correctness ≥ 80 %.**
- T3 is design until T2 sets the threshold.

## 3. Order and stops
1. Claude: T1 verifier now (new files only, `port/v2/tools/anatomy-verify/`), calibrated on the crabs, the Civet and
   the named painter canvases; Codex continues R3-S through R4 untouched.
2. Codex, after R4: P1 — paint the coconut crab from Claude's compiled prompt packet, admit, rig, film; hold the roster.
3. Claude: P1 compile packet + intake gates + sheet; P2 assembler proof; T2 battery runner ready to run unattended.
4. Nick: P1 sheet verdict; T2 labelling session; trust threshold.
5. Then P3/P4 and the roster on painted masters; T3 if the threshold is met.

## 4. Lane law (from tonight's double build)
One owner per deliverable; before starting anything queued, check the other lane's single-run queue; same-path
files are never created in both lanes; the painting tool lives in Codex's session, the gates in Claude's.

## 5. The intake compiler (IC) — authorized by Nick 2026-09-20 ("proceed")
Nick's requirement: one system for every anatomy, no per-creature hand work. Today three steps are still by hand on a
new painting (part masks/landmarks, the occlusion decision, mask fringe repairs); everything else is already shared.
The intake compiler removes those three: **painting + guide in → record, masks, landmarks, hidden declarations,
binding and gates out; a person looks only at the sheet.**

| Step | Owner | What it does |
|---|---|---|
| IC-1 registration | Claude (on T1's detector/thickness/walk-back) | match each painted tip to a guide chain (side, order along the body axis, thickness class, path profile); landmarks placed along the painting's ridge path by the guide's segment ratios; unmatched guide chains → `hidden` with inferred landmarks; pincer pairs → claw chains |
| IC-2 labels | Claude | painting pixels assigned to chains by geodesic distance to the chain path within the mask; parts split by arc-length ratio; body = remainder; fringes outside the body outline trimmed by rule (the freshwater fit-03 repair, generalized) |
| IC-3 writers | Codex (existing) | record/declaration/masks → observed split → binding → static/native gates, unchanged |
| IC-4 acceptance | both | the five accepted crab fits are the regression set: the compiler must reproduce each (landmark error ≤ a recorded px bound, same hidden set, static rows green) with **zero hand edits**, and refuse mutants (a leg erased, a leg duplicated, a guide from another template) |

Law: if a creature needs a hand step, that is a compiler bug and is fixed in the compiler, never on the creature.
Order: CPU table + continuity guard first (they finish the regression set), then IC-1/IC-2 here while Codex keeps
IC-3 stable, then archetypes and the roster only through the compiler. Morph-tier creatures never enter intake.
