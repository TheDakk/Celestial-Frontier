# R2c′ — S2 STOP

The bounded correction was run once on signed, verified producer `dd33865c0e60994b37df31364959e89749d277a8`.
The halted R2c packet was signed first as `ca851fb62bd35d5804ed22496c29f48969361733`: evidence, not admission.
No retry or later stage followed this second shared-path red.

All five crabs reproduce the prior R2c action rows **bit-for-bit**. Each completed 12 rows ×
121 samples plus 601 presentation samples. Civet idle passes (max 0.193336 px) and approach
passes (max 0.059965 px). Its next row, **melee:bite**, fails at **54.988889 ms**, sample 8:
foreNearAnkle published paint drifts **0.266107412 px**, above the unchanged **0.25 px** gate.

[Static report](static.json) · [Civet failure](civet-static.json) · [summary](summary.json).
The unchanged candidate-10 binding and family solver were used. Named alert/walk/dodge/hit/
faint rows after the failure remain unrun; a passing approach alias does not certify them all.

## Residual attribution at the failure

| Component | x, y in source px | Magnitude px |
| --- | --- | ---: |
| Weighted-point model − target | −0.0000000803, +0.0000000231 | 0.0000000835 |
| Exact triangle LBS − target (kinematic) | −0.0794809574, −0.0606161976 | 0.0999577210 |
| Published − exact LBS (ARAP/publication) | −0.1811636228, +0.0069733286 | 0.1812977814 |
| Published − target | −0.2606445802, −0.0536428690 | 0.2661074117 |

The requested barycentric-weighted common-point prediction converged, but spatially varying
weights across the support triangle introduce a 0.099957671 px difference between that model
and exact per-vertex LBS interpolated at the support. ARAP/publication adds the separate vector
shown above. Vectors add; their magnitudes must not be added as scalars. The endpoint error is
3.33e-16 normalized units; compression is zero at this sample; ARAP reports zero folded triangles.
This isolates both remaining mechanisms without conflating covariance with ARAP or increasing
the iteration budget. No repair, altered binding, pin, landmark, terminal rule or gate followed.

## Every sample retained

Each compressed JSONL record contains action, time, and every support's weighted-point prediction,
exact triangle LBS, published position, kinematic vector, ARAP/publication vector, covariance and
stance state. 10,515 sample records are retained, including the failing sample.

- [crab static rows](crab-static.json) · [all support samples](crab-support-samples.jsonl.gz).
- [coconut-crab static rows](coconut-crab-static.json) · [all support samples](coconut-crab-support-samples.jsonl.gz).
- [freshwater-crab static rows](freshwater-crab-static.json) · [all support samples](freshwater-crab-support-samples.jsonl.gz).
- [mud-crab static rows](mud-crab-static.json) · [all support samples](mud-crab-support-samples.jsonl.gz).
- [vent-crab static rows](vent-crab-static.json) · [all support samples](vent-crab-support-samples.jsonl.gz).
- [civet static rows](civet-static.json) · [all support samples](civet-support-samples.jsonl.gz).

## Controls, provenance and boundaries

- 100% terminal support needs zero first correction; 50/50 needs half the rigid correction:
  [two weighted tests](weighted-tests.log). All [21 existing regressions](contact-regressions.log) pass.
- [Diffused mutant](controls.log) still fails at 2.64794 px; pinned control passes at 0.000025 px.
- [Independent probe controls](probe-tests.log) isolate both error directions and exact LBS covariance.
- App [typecheck](typecheck.log), native entry syntax, and root [validation](validate.log) pass.
- [Direction and halted-packet signing](direction-and-signing.json), [both signatures](signature-verification.json),
  and [unchanged source/input hashes](source-verification.json) are retained. Node 26.9.0 throughout.

All R2d onward stages remain unrun. No new films, sheets, phone proof, roster work or PR42 split.
R1c CPU/fold leaf reds are unchanged; the [existing CPU table](../R1c/CPU_TABLE.md) remains current evidence.
Codex is halted at S2 without a retry. Claude can read the packet if requested; no sync, merge or
app switch is required. PR42 remains parked. Nothing was pushed.
