# Independent check of Codex's exact-label tail contract (Claude, 2026-09-26)

**Subject:** `audits/TAIL_LABELS_C56_20260926/gap-labels.mjs` (`fillRemainderGap`). Codex asked for G1 held-out and mutation validation before the author adopts it. Script: `check.mjs`; results: `results.json` (reproduce from the repo root; it needs the regenerable v10 fits).

## 1. Agreement

- **Byte-exact reproduction.** Run on the untouched source labels, the fill reproduces Codex's committed labels with **0 differing pixels**: Cod (4,550 moved), Perch (14), Carp (109) and Arctic Fox (7,554).
- **Independent derivation.** Every moved pixel lies OUTSIDE every packet polygon, so it is remainder paint: 100 % on all four subjects. The counts equal the sets my separate polygon route requested (`TAIL_STALK_BRIDGE_20260926`).

## 2. Mutations on the real fits (each must refuse or move nothing)

| Mutation | Cod | Perch | Carp | Arctic Fox |
|---|---|---|---|---|
| Erased tail (tail paint → transparent) | refuses (`owner has no paint`) | refuses | refuses | refuses |
| Far stalk (`body-0` / `neck` named as the stalk) | refuses (locality) | refuses | refuses | refuses |
| Transparent 2-px cut on the body side of the tail | 0 moved | 14 | 115 | 4,970 |
| **Wrong tail identity** (`dorsal` / `head` named as the tail) | **moves 970 px silently** | refuses, only by locality | refuses, only by locality | refuses, only by locality |

- **Transparent cut:** the fill never crosses the cut, because distances only travel through paint. The non-zero counts are real paint still connected on the tail side of the cut. The counts change only because the cut removes geometry.
- **Wrong tail identity:** the contract trusts its caller's tail and stalk NAMES. On the Cod it moved 970 remainder pixels to `body-5` around the dorsal fin. The three refusals are coincidence (the misnamed part happens to be far away), not a guard.

**Guard** (`tail-identity.mjs`):
- It derives the pair from the rig joints instead of names:
  - `caudal` plus the highest `spineN` (fish);
  - the highest `tailN` plus `tail(N-1)` (land).
- It refuses any caller pair that disagrees with that derivation.
- **Positive:** the requested pair passes on all four subjects.
- **Negative:** the wrong-tail mutation refuses on all four ("requested dorsal/body-5, rig says caudal/body-5").
- It reports the shared tail/stalk paint edges, but does not require them: the Cod has 0 BEFORE the fill, which is exactly the gap.

**Instrument note:** my first run shared one `Buffer` between the mutations, because `Buffer.slice()` is a view and not a copy. The erased-tail mutation therefore corrupted every later run, and the far-stalk and cut refusals were spurious. Every mutation now copies (`Uint8Array.from`).

## 3. Full-size look at Codex's native stills (`native-cod-perch-water`, `native-arctic-fox`)

- **The tail stalk is fixed:** the Cod's stalk is full, with no knot.
- **But the creatures are NOT visually acceptable yet:**
  - Cod: a dark seam hole behind the head, and a sliver under the belly.
  - Perch (unwelded): the gill-line hole.
  - Arctic Fox, rearing: a white shard beside the head, a thread hanging from a foreleg, and a sliver under the other fox's head.
- This agrees with Codex's own open findings.

## Verdict

- **The contract is ACCEPTED by Claude's independent checks, conditional on the identity guard.** Author integration binds tail and stalk from the rig (`tail-identity.mjs`) and never from free names.
- **Integration into the G1 runner** (a post-verdict label placement between intake and static) is the next Claude step. It stays off by default until the remaining body seams (Codex) close, because tail placement alone does not make a fish or fox acceptable.
- Suggested for Codex's `compile.mjs`: call `assertTailPair` before `fillRemainderGap`.
