# C46 — independent review and supplementary source-label admission

Reviewed after signed merge `375935b` (Claude through `0c208c4c`). The candidate packet `audits/G5_DERIVED_LABELS_20260926` is unchanged. This review accepts its four maps as **derived ownership evidence from already admitted binding/atlas bytes**, not as manual label sources or independent anatomical observation.

The reproduction in this directory uses a separate scan implementation and writes new PNG/JSON paths. It does not import or execute Claude's evidence generator (that generator writes into its evidence folder). All four newly reproduced full-resolution RGBA maps and encoded PNGs match the candidates exactly. The current full-record, master, shipped alpha, decompressed binding and atlas hashes agree with genuine bundled pins. Source geometry is checked for integer positive dimensions, native unrotated frame/cut-out equality, bounds, distinct part identities and valid depth layers. Stable far-then-near ownership reproduces the exact label order and overwrite inventory. Original recipe and dimensions remain unchanged.

| Creature | Labels | Keyed painted pixels | Unowned | Labels outside keyed paint | Overwrites | Original-vs-keyed alpha differences |
|---|---:|---:|---:|---:|---:|---:|
| Civet | 22 | 516,758 | 0 | 0 | 0 | 1,055,758 |
| Eel | 13 | 69,953 | 0 | 0 | 0 | 1,502,563 |
| Rat | 31 | 151,783 | 0 | 0 | 0 | 1,420,733 |
| Salamander | 27 | 140,137 | 0 | 0 | 0 | 1,432,379 |

Each original master is 1254² with all **1,572,516 alpha bytes equal to 255**. Thus **all four**, not only Civet, fail the current source-alpha/card-alpha equality criterion. This is an additional finding beyond Claude's candidate README. Labels do not make any of these four card-eligible. No alpha, original master hash, source pin or D26 decision changed. The initial review test assumed only Civet differed; it failed on Eel and was corrected to the measured per-source counts retained here.

## What changed

`tools/morph/creature-finish-source-pins.mjs` now verifies the four explicitly reviewed audit packets before generating their supplementary registry entries. Its exported reviewer independently reproduces ownership, validates source and provenance hashes, verifies full-resolution labels/PNG, checks coverage, and runs the unchanged identity-finish conservation instrument. A forged labels PNG paired with a matching forged receipt cannot pass reproduction against original pinned atlas/binding bytes.

The generated registry now has **38 usable labels pins: 34 original fit-label maps and four reviewed derived maps**. The four point to the audit packet's labels PNG, with receipt path/hash retained. Every entry additionally binds the exact original binding and atlas hashes; a stale binding/atlas refuses even if the full record has not changed. Runtime authority still requires the genuine original private rig pin and the complete existing pinned loader admission. No caller hash or receipt replaces that authority.

This updates source-label admission only. Existing library transport has not been rebuilt or published by this review; Claude's build-finish-sources owner can consume the supplementary entries. The four masters' alpha incompatibility still constrains the current card route independently.

## Verification

- `tool-tests.log`: **3/3 PASS**. Full genuine controls cover all four; mutations alter original atlas, binding geometry, receipt dimensions, generator provenance, and label pixels with recomputed forged receipt hashes. Negative controls are followed by genuine controls.
- `runtime-tests.log`: **15/15 PASS** across finished admission and existing pinned-loader suites. Each of the four exact real fits admits an identity-finish original through the current engine and actual pinned rig loader with its reviewed labels. Recomputed caller label hashes on altered labels refuse. Existing original-master/alpha/binding/atlas, token, individual identity, palette-composition and delivery controls remain green.
- `registry-check.log`: generator reproduces the checked-in supplementary module exactly (38 labels pins, four derived).
- App TypeScript and root TypeScript with `--noUnusedLocals`: exit 0; logs retained. `git diff --check` clean.
- Candidate evidence directory has no staged or unstaged diff. No browser, native inference, publication, merge, staging or commit performed by this review.

The runtime positives use an identity-finish test function to isolate source/ownership admission. They are not a model-quality result, physical-phone proof, anatomy acceptance, or resolution of the fully opaque source masters. The parent batch owns integrated validation and the D26 gate.
