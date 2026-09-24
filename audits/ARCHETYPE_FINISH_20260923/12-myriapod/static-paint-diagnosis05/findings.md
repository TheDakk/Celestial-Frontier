# Fit08/static05: isolated far3 upper-shaft influence gap

The exact first failures reproduce: hit15ms has4folds, dodge14ms has10folds. Every first-failure face belongs to leg3-far; none is fully pinned. Two hit targets and three dodge targets are already inverted before ARAP. The original refusal objects are retained verbatim; attempted poses were reconstructed from canonical sample times.

The separate contact/target-only diagnostic evaluates121 samples each of hit and dodge. All242 resolve contact and produce targets; there are **zero contact refusals and zero fully pinned target inversions**. This does not certify the unpinned deformed mesh.

Parent then authorized exactly230 previously unexecuted later ARAP samples, hit5–120 and dodge7–120. Earlier passing samples and the first failures were reused from static05/first diagnostics, not replayed. The later run checks contact, ARAP, part shape and the unchanged painted-contact guard, without source-join/rest reconstruction, other actions, presentation or native work:

- Hit:116later samples pass those scoped guards; no later error.
- Dodge:109later samples pass; five ARAP errors at16.333333333333332ms, 18.666666666666668ms, 74.66666666666667ms, 77ms, 79.33333333333333ms. Every later fold is still leg3-far.

The later union contains32faces; combined with the retained first two failed poses there are33 distinct folded faces, all in leg3-far. This is evidence for one localized soft-collar/influence repair, not broad remeshing of other legs. Every per-sample error and compact face/pin union is retained in `later-arap/report.json`.

## Source influence evidence

`proximal-influences.json` inventories148 existing supports in the explicit inspection rectangle[818,582]–[874,644], with exact source RGBA/label, current weights, region membership and inherited/new lock state. This is an inspection window, not an inferred anatomical region.

Free support1614 at[841,617] is retained leg3-far source paint, RGBA152/69/10/252. It has Foot0.5341412397541496, root0.43812717995139233 and Knee0.025940338760740405, plus small retained contributors, and is outside every authored region. Support1639[851,627] near the declared socket has positive-alpha source paint and Knee0.004480436107071489. The existing Knee declaration covers only the bend core, leaving the continuous upper shaft predominantly seeded from Foot/root.

The earlier free-point examples[824,609.5] and[828.5,614.5] are retained alpha1/3 fringes, not opaque-shaft witnesses; they must not be used to infer anatomy. Independent visual review instead confirms a continuous gold shaft from Knee[835,592] toward socket[851,629]. Triage's exact proposal is retained separately in `source-upper-review/proposal.json`: an explicitly authored soft, nonpin Knee region selecting opaque source supports while keeping the old bend-core pins and all inherited root/contact pins. Current compiler semantics still refuse conflicting inherited locks; no silent skipping, source erasure or gate change is warranted.

No shared source, authoring or intake file was edited by this diagnostic. Root owns the next candidate and its qualification. Tools: e23814 for first2ARAP+242targets;7976ed/session26736→cc4ab7 for230laterARAP samples; c04725 for read-only source inspection. Both execution source inventories matched all loaded/retained static hashes at the time of their run. Exact record`3c9d84cf0243a347e3ab0acc82834624daab4b3ffcbc8f427000222ad97ae304`; binding`2542d6063cb8f50575e64920cd52fa745ed6a9ae3ef4046f24f5ae8181ed18ed`.
