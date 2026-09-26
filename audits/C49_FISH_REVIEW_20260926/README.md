# C49 independent fish packet review — 2026-09-26

**Perch, Cod and Carp pass the additional selected-boundary measurement and reproduce exactly. They are review candidates, not admitted library entries.** Nick's visual decision remains required. The existing native reports are historical diagnostics at signed `91a62a50f70571d19217724240b25be3a0d14123`, not a new native run on this lane. Root sampled each complete Perch/Cod/Carp film at 2 fps and inspected full-resolution reaction/faint stills: this supports review-ready status, without claiming exhaustive per-frame inspection. Root also confirmed Trout's floating dorsal and Herring's lumpy silhouette. Exact film hashes and sampled-sheet paths are preserved in `root-film-review.json`; root owns the final visual recommendation.

## Additional measurement and real broken control

The unchanged source-join owner enforces `probe.joins`; `probe.excluded` is `OBSERVATION_ONLY` (`port/v2/tools/quadruped-proof/source-join-continuity.mjs:90–93`). Consequently, the original `PASS_STATIC` does not assert continuity of the selectively welded excluded boundaries.

`harness/static.ts` is an audit-only copy with the explicit extension in `harness/extension.diff`. It retains every original motion, contact, ARAP, shape, rest, sample schedule and source-pixel gate. It additionally measures exactly the nonempty, unique selected pairs from each retained weld receipt, using the same unchanged measurement function and **0.0011959075927734375 native-pixel epsilon**. Every declared pair must resolve to exactly one observed excluded boundary with nonzero source edges and spatial samples. Selected-gap failures accumulate without shortening the original sampling schedule. The original `status` is preserved; `selectedBoundaryAudit.status` is separate and both must pass for exit zero.

| Packet | Selected pairs | Spatial samples per pose | Temporal samples | Largest selected gap (px) | Selected result |
|---|---:|---:|---:|---:|---|
| Perch | 3 | 527 | 2,480 | 0.0000385400 | PASS |
| Cod | 5 | 882 | 2,522 | 0.0000528521 | PASS |
| Carp | 2 | 594 | 2,505 | 0.0000454669 | PASS |
| Original unwelded Perch | same 3 | 527 | 2,480 | **94.60925685** | **RED** |

All four runs completed every one of 121 samples for each of 13 actions plus the entire 60 Hz full-row presentation. All four retain original `PASS_STATIC`, exact rest, and source-pixel reconstruction with zero changed visible channels. The real unwelded control produces **1,104,506 spatial violations** and exits 1; it is the original automatic fit binding, not a fabricated position offset. Empty-inventory and unknown-pair controls both refuse at fixture construction. Reports retain per-pair/per-action counts, maxima and worst source coordinates. These results cover selected pairs only; they do not silently turn every remaining excluded adjacency into an enforced join or certify all visual qualities.

## Hashes, reproduction and native provenance

- `reproduction.json`: all three final binding files and split receipts reproduce **byte-for-byte** from each retained `pre-split-binding.json`, record, atlas and exact selected-pair list. `reproduce.mjs` uses the unchanged split function with the original options, writes only a new scratch result, and never runs destructive `weld-pairs.mjs`.
- `copied-fit-inventory.json`: all 29 files of each three candidate fits and the real unwelded Perch control were copied from the absolute read-only Claude worktree and compared byte-exact. Copies remain ignored scratch; no candidate input was rewritten.
- `source-pinned-manifest.json`: all five fish's original static input hashes match retained bytes; all **68** original static producers match this lane. The extension uses the same **67** imported producers plus its intentionally different harness; all imported hashes and before/after source checks match (`extension-provenance.json`). Original static hash is retained in `harness/original-static.sha256`.
- `native-recorded-head.json`: all **187 tracked native producers** match their recorded signed head. All five fish use that exact tracked producer inventory. Current native producer differences are `creature-finish-source-pins.generated.ts`, `creature-finish-engine.ts`, and `art-library.generated.ts`; the historical report must not be relabeled as a current-head native run.
- Each final native report matches the retained record, binding, keyed source and atlas hashes. Full WebM plus all 18 named stills exist and are hashed in the manifest. The three candidates have 707 sampled frames each, no reported refusals, 4× throttle and reported CPU p95 Perch 4.9 ms / Cod 4.4 ms / Carp 5.5 ms. These remain diagnostic measurements; no CPU certificate or human acceptance is inferred.
- All five automatic target masters match their provenance and the corresponding **already tracked G2 master** byte-for-byte. Perch/Cod/Carp reference Bass; Trout/Herring reference Salmon. The external automatic-provenance JSON honestly corrects intake's legacy manual/transferred flags and must accompany any future packet.

## Durability and future admission packet

The review result is **not yet a self-contained durable candidate packet**. None of the 29 fit files is tracked under the final Claude fit directory. Each film and 17 of the 18 stills are ignored there; one reaction still and reports are tracked. `greedy.sh` invokes an uncommitted absolute scratch `adjjson.mjs`, so the original candidate-enumeration/search trajectory cannot be reproduced from the committed producer set alone. This does not prevent exact final-pair reconstruction (proved above), but it prevents an end-to-end deterministic search-origin claim.

Before registry admission, retain a content-addressed packet at a stable, committed path with:

1. Existing G2 master bytes (or a verified durable reference to those exact bytes), exact record, pre-split and final bindings, declaration, labels, atlas, keyed source, parts manifest/receipts, source subject/presence/authoring evidence and honest automatic provenance. Preserve final binding bytes; do not transplant their semantic hash onto a rebuilt or edited file.
2. A manifest with per-file SHA-256 and byte count; species/visual identity, record recipe hash, cutout dimensions and master hash, keyed-alpha hash, encoded **and decoded** label hashes, atlas hash and semantic plus file binding hashes. All source paths must resolve durably. If relocating a master requires modifying `record.source`, build and admit a new record/recipe/packet explicitly; do not pretend it is the reviewed packet.
3. A weld receipt binding the exact pre-split hash, ordered pair inventory, split options, producer-source hashes, output file/semantic hashes and zero source-coordinate changes. Retain the final choices and an explicit `selectionOrigin: greedy automatic search` disclosure. Persist `adjjson.mjs` and its deterministic pair/order output if claiming full-search reproducibility; final-pair reproduction alone must be labeled as such.
4. Exact unchanged static evidence **plus this additional selected-boundary evidence**, a broken unwelded control and complete pair/sample inventory. Keep the native report's recorded source, exact fit and producer hashes, full named film and still hashes, and Nick's visual decision associated with these exact bytes. Any current-head native requirement needs a new run on a stable head.
5. Only then generate normal registry/library and build pin rows through their existing admission owners. Labels for G5 need their own source-bound registry admission; a review manifest or caller-provided hash never grants runtime source authority. No G1 denominator, tolerance or D24 gate changes are implied.

The concrete current-byte inventory is `source-pinned-manifest.json`; this proposed receipt contract is `packet-contract.json`. Neither is a runtime authority.

## Trout/Herring: advice, not a claimed diagnosis

The retained evidence isolates the reference association (Salmon versus Bass), but does not prove that reference choice causes deformation. The split's actual mechanics provide a narrower hypothesis: shared supports are unioned (`split-observed-surfaces.mjs:48–54`), initialized with joint-owner weights (`:59–64`), then smoothed with a **three mesh-ring collar** and interior locks (`:68–75`). A fixed number of topology rings has no physical-width bound on a narrow body. Welding more seams can therefore couple most of a thin spine's width while the deliberately independent dorsal follows another owner. This is a hypothesis to measure, not grounds to loosen the seam epsilon, accept folds, add hidden paint or switch references until a favorable result appears.

Recommended bounded follow-up: keep the same Salmon reference and source bytes; measure physical collar width/body-width, shared-support owner spans, pin conflicts, local strain and dorsal-to-body relative displacement on the already failing named poses. Compare original / single-weld / final variants on those exact controls. Only a general, measured collar/weight rule that fixes both held-out fish without regressing the three accepted candidates should advance. Reference changes remain a separate explicitly reviewed experiment under the existing D25 restriction. Trout and Herring stay visually refused.

No source runtime, registry, shared docs or sibling files were edited. No browser, native rerun, commit, push or admission was performed. Scratch is about 30 MiB; disk remained above 220 GiB free. Root can commit this new audit after its integrated batch, and coordinate the concrete durability/admission asks in the lane mailbox.
