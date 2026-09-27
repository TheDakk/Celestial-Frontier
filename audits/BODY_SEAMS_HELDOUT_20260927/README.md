# Held-out check of Codex's fish axial-remainder placement (Claude, 2026-09-27)

**Subject:** `audits/BODY_SEAMS_C68_20260927` (`axial-remainder.mjs` + `compile.mjs`, copied here unchanged so outputs stay in this lane). The three final candidates are Trout (`fin-02`), Herring (`fin-02`) and Cod (`axial-01`).

**Full-size look at Codex's native stills** (approach; turn-1 and turn-3 reactions):
- The backs stay smooth in the reaction, the dorsal fins stay attached and the tails are full on all three. This fixes the lumpy backs and the floating Trout dorsal of the welded-label fits.
- Thin dark lines near the pectoral on the Cod and Herring look like painted gill lines, not tears.

**Held-out (fish Codex did not tune on, the tail-labelled fits from `auto-g2tail-labels-v1`, no dorsal welds):**

| Fish | Moved remainder px | Conservation | Static | Native | Full-size |
|---|---:|---|---|---|---|
| Perch | 26,001 | RGBA unchanged, 0 non-remainder changes | PASS | DIAGNOSTIC_PASS | smooth back, full tail; the L-shaped gill seam remains (Codex's separate two-weld gill repair closes it) |
| Carp | 34,735 | RGBA unchanged, 0 non-remainder changes | **RED:** dodge (4 folded triangles), victory (3) | — | — |

**Verdict:** the placement generalizes to 1 of 2 held-out fish. Accept it as a per-fish candidate step (Trout, Herring, Cod, Perch), not yet a general G1 author step. Carp's folds need a diagnosis first (Codex). Perch needs the gill welds on top for visual acceptance.
