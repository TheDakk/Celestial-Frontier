# Crab marking masks — M3

Nick authorized the original painter Crab in crab-fits-03, master 880². Six generated marking layers are delivered in [markings/](../ANATOMY_COMPLETION_20260917/crab-fits-03/crab/markings/), with [markings.json](../ANATOMY_COMPLETION_20260917/crab-fits-03/crab/markings.json) mapping each pattern to its file, SHA256, exact sent prompt bytes, tool and transform. Plain has no mask; iridescent is emissive with no mask. No second archetype or intake.

[Six-mask composite sheet](six-mask-sheet.png) shows the masks in white over the unchanged keyed master, cropped and enlarged for review. Full 880² composites are retained beside it. Nick's visual acceptance is pending; conservation is not visual approval.

## Provenance and registration

The original master is the source painter's crab, not an imagegen master. The retained P1 compiled prompt for this same archetype is used verbatim as the prefix (SHA256 6781207628876dd378eb01b00c5df6ae89763b4d138d9526357c11f99341138c). Each exact sent prompt appends one marking-only output-override block. Prompts and raw PNGs are retained under prompts/ and raw/. Tool: image_gen.imagegen; model and seed are not exposed. The first enlarged stripe silhouette was rejected and retained separately; the corrected mask request preserved framing explicitly. Raw inline previews misleadingly showed transparent RGB as white fill; compositing over grey confirmed separated alpha strokes.

All final raw outputs are 1254². finish-masks.mjs resamples generated alpha to 880² with Lanczos, registers banded by (0,−32), mottled by (0,−10), marbled by (0,−15) master pixels, and leaves the other placements at (0,0). These are marking-layer placement edits, not source/rig changes. RGB is set to white; generated alpha is multiplied by keyed-master alpha and existing eye/shadow owners are excluded. No synthetic marking strokes are added. The registrations, clipping counts and hashes are recorded. The original labels are read only for exclusion, not changed. The master, record, binding, labels, keyed image and atlas hashes are verified unchanged.

## Measured conservation

| Pattern | Nonzero mask pixels | Outside keyed alpha | PNG SHA256 |
|---|---:|---:|---|
| striped | 7846 | 0 | `5c3ac9188d3a06b2a02fa11b2180453c650f2356ab6c29ed23796a5ebd780b39` |
| spotted | 5675 | 0 | `917b6d4f8d9f92a9d33ae733912ad7895f49960685cc219d78c764bb0652c023` |
| banded | 8041 | 0 | `19ea3564dc5f8b3d4a2fc70526c71f476699bc83d171623aa4407baaa471ace5` |
| mottled | 10737 | 0 | `4af1a86c92e33b6e6bab4ad008540ace4d1240693ccb8bf94ec2e0e84bb58ddb` |
| marbled | 11230 | 0 | `b6a1ffe77ef569e1ff5a73bc426c0950ad5d87f3395ef6879a591e7ab603d204` |
| eye-spotted | 1468 | 0 | `ce9a7d41a59c559cecee83f8d3e34bc97116ba61bd6e767defb572b5dca66f51` |

Every delivered mask is 880² and RGB=(255,255,255); its alpha never exceeds keyed alpha. Positive accepts; a one-pixel outside-alpha mutant refuses. [Machine receipt](conservation.json), [run log](conservation.log), [generation receipts](generation-receipts.json). Pre-clipping spills are retained honestly in the receipt. Draft sheet annotation failed with the unavailable Helvetica alias, then montage's empty default font; the final run uses the explicit installed Arial.ttf and exits zero.

Markings signed and verified as `d8a1a8f9941df45241e3ac0bd459fbc1b85932e8`. Loader producer `5b6f89c7b0d9a2e35f4bc5ed57df33b5eaf363ac` and its [packet](../BORROWED_ATLAS_20260922/README.md) are complete: one [S2 sweep](../BORROWED_ATLAS_20260922/S2_LEDGER.md) passes with all six subjects byte-identical. Codex holds. Claude consumes these master-space masks through the existing atlas mapping for M3/M4. Nick reviews the sheet. No fetch/sync/push/PR/merge/release/deploy.
