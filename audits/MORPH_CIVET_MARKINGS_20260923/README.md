# Civet marking masks — M3

Nick authorized this single archetype on 2026-09-23. Six white-on-transparent masks live beside the accepted Civet sentinel input in [markings/](../ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/markings/). [markings.json](../ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/markings.json), schema cf.marking-masks/v1, maps pattern → file → SHA256 → exact sent prompt, with generation and conversion provenance. Plain has no mask; iridescent is emissive with no mask.

[Six-mask sheet](six-mask-sheet.png) shows each delivered white alpha layer over the unchanged keyed master at half display scale. Full 1254² composites are retained beside it. The original face, eyes, paws and ringed tail remain visible and unmarked. These overlays add genome markings; they do not replace the existing coat pixels. Nick's visual sign-off is pending.

## Prompt and output provenance

Base prompt: audits/ART_KIT_ENGINE_FIRST_20260912/prompts/civet-prompt.txt, SHA256 `725a3f23e3aa5fe2cd962cafc4adb9b51c4de8131e0977ae127dec246991d2de`. Every sent prompt preserves those bytes verbatim as its prefix and appends one marking-only output block beginning “paint ONLY the <pattern> marking as a white mask over the existing body; nothing else changes”. Exact prompts in prompts/ and embedded in markings.json. Tool: image_gen.imagegen; model and seed are not exposed. Raw PNGs and generation paths are retained in raw/ and generation-receipts.json.

All delivered raw layers are native 1254²: no resize, translation, warp or new synthetic stroke. Conversion sets RGB to white and multiplies generated alpha by keyed alpha, rounded to 8-bit. Existing binding part frames map atlas alpha into source cutout coordinates for exclusion. There is no labels.png and no new label map. The binding contains no separate eye or shadow parts: eyes are protected through the head part. Head, jaw, ears, paws and tail ink are excluded; only remaining bound body paint can receive markings. Unbound pixels are excluded too. Exact frames/excluded-part list are in conservation.json. The source, record, binding, keyed image, atlas, manifest and compiled prompt hashes remain unchanged.

The first mottled layer read as repeated spots on the composite. One targeted prompt revision produced irregular broken patches; mottled-draft-01 retains its prompt, raw, mask, composite, sheet, manifest and measurement. The other five layers were not regenerated or re-tested. The final mottled check ran alone with --only=mottled; the sheet was rebuilt for review. The raw preview's hidden RGB can look filled; composited alpha is the visual evidence.

## Measured conservation

| Pattern | Nonzero mask pixels | Outside keyed alpha | Protected-part pixels | Final PNG SHA256 |
|---|---:|---:|---:|---|
| striped | 179398 | 0 | 0 | `dcdb3eb5a11eeeb9fc3a3758018100cb474fc08456c49f20d53510129ccb05ac` |
| spotted | 210487 | 0 | 0 | `2019bf581d322f62440f93c53262d0a193feca5a449ffdfb6950724bbeec1523` |
| banded | 163931 | 0 | 0 | `37f87c9c8ad56bd534fa430fedb9e56761f540c8d3fd32b82f0493a3e4d4d54f` |
| mottled | 249668 | 0 | 0 | `2818b5b1240fe96951b7fb5fa4c25cb90bf5bb8b6ca7176739ff6d9069384d97` |
| marbled | 230395 | 0 | 0 | `a11163de8e240bb5552f0776e4c11e2f85b69e761084b96b058cac10590bc349` |
| eye-spotted | 34876 | 0 | 0 | `5fc556bcff69d51aa89d02da4808190038dce7f409abf5c930ccda8a2d277de0` |

All masks are 1254², RGB=(255,255,255), with alpha no greater than keyed alpha. The initial conservation control accepts the valid mask and rejects both a one-pixel outside-alpha mutant and a one-pixel protected-part mutant. [Final receipt](conservation.json), [initial run](conservation.log), [changed mottled run](mottled-revision.log), [all artifact hashes](file-hashes.json). Raw spills and exclusions are counted before clipping, not hidden.

## Scope and handoff

No runtime/solver/loader/rig/source-paint change, new intake, roster or third archetype. No unchanged batteries or new S2 sweep: the accepted [last S2 ledger](../BORROWED_ATLAS_20260922/S2_LEDGER.md) remains the runtime reference, not a claim that these masks were filmed locally. Only mask conservation and protected-source identity were measured here. Existing Node 26.9.0 anatomy-run receipt reused; ImageMagick identity is in the receipt.

Codex holds. Claude consumes these master-space masks through the existing atlas mapping; no integration change on this lane. Nick reviews the sheet. Open Claude when ready to continue its integration; no implementation decision is waiting. Signed local commit only; no fetch/sync/push/PR/merge/release/deploy.

The earlier signature refusal is retained in signing-refusal.txt. Nick subsequently requested a normal openai/mac branch push; the completed packet is to be signed and verified first, with no repeated checks. The commit signature and final remote SHA are reported at handoff.
