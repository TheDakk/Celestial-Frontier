# C45(b): derived ownership evidence for Civet, Eel, Rat, Salamander (2026-09-26)

**Status: DERIVED OWNERSHIP EVIDENCE, a candidate for Codex's review.**
- It is not a manual label source, not an anatomical admission, and not in any registry.
- The fit evidence folders are untouched.
- Until Codex reviews it and binds a supplementary registry row to these paths (with the same genuine full-record pin), these four creatures stay unsupported for finished stage admission.

**Generator:** `derive-labels.mjs`; its own SHA-256 is in each receipt. It reproduces the card builder's derived-from-binding branch (`tools/morph/build-card-masters.mjs`):
- `kind=part` order gives label = index + 1;
- each part's atlas-frame alpha is painted into its native cut-out box, far layer before near (stable), R = label, A = 255.

Per C45.md it differs from the builder in two ways:
- malformed geometry (rotated, resized or out-of-bounds frames or cut-outs) REFUSES instead of clipping;
- every source is hash-checked against the genuine bundled pin first: full record (stableJSON), master, shipped alpha, binding, atlas and recipe.

## Results (`summary.json`; per creature `<id>/receipt.json` + `<id>/labels.png`)

| Creature | Labels | Painted px | Unowned | Reproduces shipped card labels-512 | Changed binding breaks it | Wrong dimensions refuse | Identity-finish conservation |
|---|---:|---:|---:|---|---|---|---|
| Civet | 22 | 516,758 | 0 | ✔ | ✔ | ✔ | PASS |
| Eel | 13 | 69,953 | 0 | ✔ | ✔ | ✔ | PASS |
| Rat | 31 | 151,783 | 0 | ✔ | ✔ | ✔ | PASS |
| Salamander | 27 | 140,137 | 0 | ✔ | ✔ | ✔ | PASS |

- Each receipt also records the ordered label → part/joint/layer map, the overwrite inventory (which part overwrote which, in pixels), and both the encoded PNG and the decoded RGBA SHA-256.
- **Civet:** its original master is opaque (keyed). These labels do not change that and do not make it card-eligible (C45.md). Its finished original would still reach the stage, not the card.

Reproduce: `node audits/G5_DERIVED_LABELS_20260926/derive-labels.mjs` from the repository root.
