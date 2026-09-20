# Declared-hidden placement — read-only answer

Inspected local source at `c93ee2e8`; no fit, writer or sibling change; no battery run.
IC-3 stays frozen. Claude slice18 / IC-4 is not passing; this note is not admission.

## 1. Exact existing rule

**Geometric, not hand-placed.** Owner:
[`inferHiddenLandmarks`](../../port/v2/tools/creature-animation/hidden-anatomy.mjs:20).
`resolveHiddenPresence` selects only explicitly declared `leg3Far`/`leg3Near`;
`checkHiddenLandmarks` checks the result (1e-12 normalized units per coordinate).
Coconut calls it in `port/v2/tools/family-review/prepare-p1-hidden.mjs:22`;
Crab/Freshwater/Mud call it in `audits/VISION_P1_FOUR_CRABS_20260920/intake-02/prepare.mjs:17`.
Vent has no hidden declaration and no inferred joints.

For each declared side `S`, using normalized record coordinates:

```text
u  = normalize(carapace - root)       # contract bodyAxis = [root, carapace]
r2 = leg2SRoot; r1 = leg1SRoot
leg3SRoot = 2*r2 - r1
for J in [Knee, Foot]:
    v = leg2SJ - r2
    leg3SJ = leg3SRoot + 2*dot(v,u)*u - v
```

Thus the ROOT is extrapolated by pair2−pair1 root spacing; the KNEE/FOOT vectors
are reflected about a line parallel to the body axis through that new root.
This preserves pair2 segment lengths 1:1. It is not pointwise extrapolation of
all three joints, reflection about the image centreline, or a claw-based offset.
No claw coordinates, fixed claw/carapace fractions, species branch, supplied hidden
seed, snapping or rounding enter the rule. Behind-claw placement is its geometric
result, not an independently positioned target.

Read-only re-evaluation on the accepted normalized records reproduced **all15 hidden
landmarks with maximum Euclidean error0px** (all masters1254²). Measured reproduction
bound: **≤1e-9px**, using the SAME visible landmarks/body axis. This is not an IC-4
registration-error allowance; errors in compiler-estimated inputs can propagate.

| Accepted fit | Hidden chain | Root px | Knee px | Foot px |
|---|---|---|---|---|
| Coconut hidden-01/fit-04 | leg3Far | (563,549) | (865.368522,719.602687) | (954.712092,961.341651) |
| Coconut hidden-01/fit-04 | leg3Near | (767,673) | (871.345489,744.190019) | (876.821497,820.051823) |
| Crab intake-02/crab-fit-01 | leg3Near | (824,635) | (621.715736,706.979695) | (611.888325,1000.563452) |
| Freshwater intake-02/freshwater-crab-fit-03 | leg3Far | (257,603) | (385.984902,689.324360) | (418.578251,948.126743) |
| Mud intake-02/mud-crab-fit-01 | leg3Far | (243,610) | (434.476012,722.973169) | (401.230136,940.013976) |
| Vent intake-01/vent-crab-fit-01 | none | — | — | — |

Table coordinates are display-rounded only. Coconut’s feet round to Nick’s (955,961)
and (877,820); the formula above explains them without a fit-specific placement.

## 2. Compiler recommendation

The hand-placement condition does not apply to hidden joints: implement the existing
formula unchanged, AFTER the evidence-per-slot verdict supplies an explicit hidden set.
Do not convert an unmatched/erased leg into hidden merely to satisfy inventory. No new
placement heuristic or parameter calibration is needed to reproduce these hidden joints.

## 3. Other hand-placed landmarks

**All five fits contain manually authored visible/body landmarks.** Their observation
JSONs supply literal `landmarksPx`; the writers divide by1254, then infer ONLY hidden
joints. Every non-hidden record coordinate matches its observation within1.61e-13px
(round-trip floating-point error). The common38 manually supplied names are:

- `root`, `carapace`.
- `leg0FarRoot`, `leg0FarKnee`, `leg0FarFoot`, `leg1FarRoot`, `leg1FarKnee`,
  `leg1FarFoot`, `leg2FarRoot`, `leg2FarKnee`, `leg2FarFoot`.
- `leg0NearRoot`, `leg0NearKnee`, `leg0NearFoot`, `leg1NearRoot`, `leg1NearKnee`,
  `leg1NearFoot`, `leg2NearRoot`, `leg2NearKnee`, `leg2NearFoot`.
- `eyeFarRoot`, `eyeFarTip`, `eyeNearRoot`, `eyeNearTip`.
- `clawFarBase`, `clawFarElbow`, `clawFarPalm`, `clawFarFixedRoot`, `clawFarFixedTip`,
  `clawFarDactylRoot`, `clawFarDactylTip`.
- `clawNearBase`, `clawNearElbow`, `clawNearPalm`, `clawNearFixedRoot`, `clawNearFixedTip`,
  `clawNearDactylRoot`, `clawNearDactylTip`.

| Fit | Additional hand-placed names beyond common38 | Total manual |
|---|---|---:|
| Coconut fit-04 | none | 38 |
| Crab fit-01 | `leg3FarRoot`, `leg3FarKnee`, `leg3FarFoot` | 41 |
| Freshwater fit-03 | `leg3NearRoot`, `leg3NearKnee`, `leg3NearFoot` | 41 |
| Mud fit-01 | `leg3NearRoot`, `leg3NearKnee`, `leg3NearFoot` | 41 |
| Vent fit-01 | `leg3FarRoot`, `leg3FarKnee`, `leg3FarFoot`, `leg3NearRoot`, `leg3NearKnee`, `leg3NearFoot` | 44 |

Observation sources: `VISION_P1_COCONUT_20260920/hidden-01/observation-04.json`;
`VISION_P1_FOUR_CRABS_20260920/intake-02/{crab-observation.json,
freshwater-crab-observation-02.json,mud-crab-observation.json}`;
`VISION_P1_FOUR_CRABS_20260920/intake-01/vent-crab-observation.json` (all under `audits/`).
These authored landmarks are comparison truth, not permissible automatic-compiler inputs.
Mud’s facial-orb T2 finding adds no landmark or extra eye joint.

Next: **Codex holds. Claude: evidence-per-slot verdict → hidden placement by this rule →
P7 labels → re-run IC-4. Nick: nothing to decide.** Existing staged delivery work remains
untouched and outside this note-only commit; no push or sibling synchronization.
