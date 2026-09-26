# C50 fit continuation — contact endpoint ownership candidate rejected

2026-09-26. **No additional fit is repaired by this bounded operation.** The four existing failures remain open. This packet tests one source-evidenced hypothesis, preserves the red results, and narrows the next diagnostic. No runtime, motion, intake, gate, joint limit, root pin, original author packet or other audit was edited. No browser/native run or extra agent was used.

## Hypothesis and exact operation

The adopted author snaps landmarks to any paint, then places contact-chain interiors along a paint ridge. A contact endpoint can consequently land in a different declared part. `contact-ownership.mjs` independently rasterizes the unchanged priority polygons and original positive alpha, checks each chain landmark, and finds the nearest source pixel belonging to its declared owner. It does not infer absent/hidden anatomy.

Measured endpoint mismatches:

| Subject | Endpoint | Actual owner → declared owner | Nearest declared paint |
|---|---|---|---:|
| Grouse | legFarAnkle | far-thigh → far-shin |6.918px|
| Sparrow | legFarAnkle | far-foot → far-shin |12.825px|
| Sparrow | legNearAnkle | near-foot → near-shin |22.012px|
| Tapir | hindFarAnkle | hind-far-knee → hind-far-ankle |5.622px|
| Tapir | foreFarAnkle | fore-far-knee → fore-far-ankle |1.676px|
| Tapir | hindNearAnkle | hind-near-knee → hind-near-ankle |5.166px|

Mongoose has no endpoint mismatch. Its four endpoint landmarks already lie in their own declared positive-alpha part.

`project-contact.mjs` creates a new packet with only mismatched **contract endpoints** projected to the nearest observed pixel of their own part. It leaves hips, knees, terminals, all polygons, source pixels, presence declarations and source identity unchanged. It refuses stale observations or an owner with no observed paint. This does not establish that the transferred part is anatomically correct; it tests consistency between the packet's existing contact declaration and its paint ownership.

## Results — no adoption

- **Grouse:** intake still refuses `observed-split: contact conflicts with fixed owner`. Moving the endpoint6.918px onto its shin does not resolve the coarse support shared with fixed-root body paint. No static run follows this intake refusal.
- **Sparrow:** static remains RED, now with8 cast folds. Faint reaches the `legNearFoot` limit earlier at391.6ms /45.385849°; the full presentation also refuses. The original failure was403.4667ms /45.190043°. This candidate worsens the fit.
- **Tapir:** tail attack still exceeds the same scale-compression bound at246.1778ms. Faint has20 folded triangles; the full presentation also refuses the tail attack. The original faint had15 folds.
- **Mongoose:** unchanged packet, so **no unchanged red rerun**. The retained original has19 passing isolated actions and a blended gallop failure at presentation8,083.3333ms, action714.7219ms, `foreFarAnkle`−108.529911°.

Both compiled candidates ran all isolated actions plus the full blended presentation through the unchanged static owner. Both preserve exact rest and **zero changed visible RGBA channels**; all recorded static inputs and sources remain unchanged. Every failure is retained in `summary.json`, individual static JSON/logs and source manifests. Original v10 packets and the earlier C46 repairs remain intact.

Three focused controls pass: changed points independently land in their declared positive-alpha owner; only specified endpoints change and source authoring stays untouched; Mongoose remains byte-identical; erased ownership and stale point observations refuse. `controls.log`, `contact-ownership.json`, `operation.json` and `source-hashes.json` retain the evidence. The controls establish the operation's behavior, not anatomical acceptance.

## Why another landmark adjustment is not justified

Part membership alone is not evidence of a knee or ankle center. Moving a point until a clip passes would fit anatomy to the test, rather than recover anatomy from the painting. Grouse additionally has knee locations in body-owned paint (42.386px and26.666px from the declared thigh regions), while Tapir's far knee is in near-leg paint (69.818px away). Those observations expose disagreements in the transferred skeleton/ownership; they do not authorize snapping every joint to a polygon or inventing a hidden bone.

The existing contact owner enforces exact target reach, the fixed compression cap and joint limits. Its endpoint solve derives terminal rotation from the lower link (`creature-rig-contact.ts`, the `measure` boundary after the endpoint/support iterations). Thus a foot-angle refusal can result from rest-chain geometry, the requested target, or a feasible-solution choice; the error alone does not identify which. This audit does not change any of them.

## Reproducible next automatic diagnostic

Before another fit candidate, replay the **retained first failing frame**, with a read-only instrumented copy of the contact owner, and retain:

1. The original contract chain, rest upper/lower lengths and terminal offset; current parent transform; painted support barycentric weights and their source owners.
2. The exact requested painted target, endpoint target, current compression and candidate joint angles at the refusal boundary.
3. An independent feasibility calculation under the **same** joint intervals, endpoint/support equality and compression cap. Retain both feasible and deliberately infeasible controls. Do not change animation inputs or tune the bounds.

Use Sparrow faint403.4667ms, Mongoose blended gallop714.7219ms (presentation8,083.3333ms), and Tapir tail attack246.1778ms. The retained original reports supply the source and phase identities. If the target is feasible, investigate the solver's selected configuration while retaining every current gate; if it is infeasible, a replacement chain requires independently validated automatic landmark/support evidence. This is the missing geometry, not authority to relax the limits. The current nearest-paint/ridge heuristic does not provide that evidence.

For Grouse, the separate next operation is to enumerate the contact support triangle's source corners and all fixed/shape owners at the unchanged failure. The earlier packet already locates a shared root/foot/shin/thigh support at `(744,880)`. Test a topology construction in which only genuinely coincident source attachments share corners, while retaining all observed joins and exact source reconstruction. It must show why a root/contact coincidence is a coarse-mesh artifact rather than disconnecting a real join. Prior blanket local refinement failed; do not repeat it or release a root pin.

## Commands

```sh
node audits/G1_FIT_CONTINUATION_C50_20260926/contact-ownership.mjs
node --test audits/G1_FIT_CONTINUATION_C50_20260926/project-contact.test.mjs
```

`run-candidates.mjs` generated the retained candidates once and refuses existing candidate directories. To reproduce independently, use a new audit output copy; do not overwrite these reports or retry an unchanged red. Rebuilt fit directories and duplicate masters are ignored; packet JSON, hashes and full diagnostics remain retained. Parent owns the final battery, lane notes, signing and push.
