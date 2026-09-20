# P1 — the four remaining crabs, painted (Claude review, read-only, 2026-09-20)

Codex packet: `/Users/nick/Projects/celestial-frontier-openai-mac/audits/VISION_P1_FOUR_CRABS_20260920/` (one generation
each, exact packet prompts, Discovery Atlas lock + anatomy guide attached, originals 1254² RGBA retained, no retry).
Sheet here: `sheet.png` (painter guide left, painting right).

## Anatomy read (Claude's eye + the T1 tip detector, slice 5)
| Subject | Visible walking legs (eye) | Claws | Eyes | Detector down-tips (feet + claw fingers) | Notes |
|---|---:|---:|---:|---:|---|
| crab | 8 (4 + 4) | 2 | 2 stalked | 9 | clean; claws closed and lowered, guide's were raised |
| freshwater-crab | 8 | 2 | 2 stalked | 9 | clean; claws forward and low |
| mud-crab | 8 | 2 | 2 stalked + 2 small dark orbs at the face | 9 | Codex's "extra eye-like structures": two dark antennule/orbital knobs beside the mouthparts — a plausible crab feature, but the species line said exactly two eyes; a finding for T2, not a refusal |
| vent-crab | 8 | 2 | 2 stalked | 11 | legs thicker and claws larger than the guide (the vent crab painter is spindly); pale chalky finish as asked |

All four are true crabs with the full eight walking legs visible, so **no hidden declaration is needed** for any of
them. Claw pose differs from every guide (closed/lowered versus the painter's raised pose); that is the model's
natural stance and is what the rig will observe — the guide governs counts, arrangement and facing, not the exact
claw angle. Side margins are below the kit's 8 % on all four (as on the coconut); retained as delivered.

## Art
At the Civet's level on all four; the finish, material and the one hand are the kit's. **Nick's verdict pending.**

## Direction (Codex, copy-ready)
```
Four crabs: Claude's review /Users/nick/Projects/celestial-frontier-anthropic-mac/audits/VISION_PROGRAM_20260920/P1-four-crabs-review/README.md
(read-only). All four show eight visible walking legs: intake with NO hidden declaration, exactly the hidden-01 chain
(alpha as delivered, new masks, landmarks, observed split, binding, static rows). Do this now, before the CPU decision:
their bindings give the vertex-budget table five painted subjects instead of one. Record the mud crab's two facial
orbs as a T2 finding (species line said two eyes) — no repaint. Native films wait for the painted-tier CPU gate and the
split continuity guard. Signed commits; no fetch, push, PR, merge.
```

## Addendum — the three "missing" feet (Codex question, 2026-09-20)
Full-resolution crops (retained in this lane's scratch, reproducible from the detector overlays) show the same thing on
all three: the **front walking leg on one side passes behind that side's claw and its foot is not painted**. There is no
true (x, y) to trace; any coordinate is an inference. Handling is the P1 verdict's law 2: declare that leg `hidden`
(present, occluded), place its landmarks by template inference from the adjacent visible pair, no paint, no contact
chain. Best estimates for the inferred foot, in master pixels, if a seed point is wanted:
crab — right front foot ≈ (750, 700), behind the right claw (mirror of the visible left front foot at (512, 702) about
the carapace axis x ≈ 630); freshwater-crab — left front foot ≈ (370, 760), behind the left claw palm (the merus enters
behind the claw at ≈ (320, 590)); mud-crab — left front foot ≈ (260, 700), behind the left claw base (the leg enters at
≈ (240, 520)). Earlier I read these three as eight visible legs; that was wrong at sheet scale, and the detector's
extra "feet" were doubled tips on one foot. T2 finding: the model occludes a front walking leg behind a claw in three
of five crabs; count lines should say "front pair may be occluded by the claws" rather than "exactly eight visible".
