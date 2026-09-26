# Durable candidate packets: the first fully automatic creatures (Perch, Cod, Carp), 2026-09-26

**Status: CANDIDATES. These packets admit nothing.** Runtime authority comes only from the existing registry/library/build-pin owners, after **Nick's visual decision on these exact bytes** (`NickVisualDecisionForExactPacket: PENDING` in each manifest). This follows Codex's contract `audits/C49_FISH_REVIEW_20260926/packet-contract.json` and review `README.md`.

**Chain:** Codex's G2 painting (`audits/G2_FAMILY_PILOT_20260926/<id>/`) → G1 automatic authoring (Bass reference, zero hand edits) → Codex's unchanged intake → a selective axial weld found by greedy search → the unchanged static gate → Codex's native harness. Codex added a selected-boundary audit: largest welded-seam gap 0.00004–0.00005 px, against 94.6 px on the real unwelded control.

## Per packet (`<id>/`)

- `fit/`: the final welded fit, 29 files, byte for byte from `weld-g2fam-fish/pairs/<id>-final/fit/`.
- `native/`: `report.json`, the full `battle-full.webm` and the 18 named stills. This is the historical diagnostic at its recorded head; a current-head native requirement needs a new run.
- `evidence/`: the original `static.json` (PASS_STATIC) and the weld receipt.
- `manifest.json`:
  - identity (species, canonical visual key, record recipe, dimensions);
  - the required hashes: master, keyed alpha, labels encoded AND decoded, atlas, record, pre-split, binding file and semantic hash;
  - a per-file inventory (path, bytes, SHA-256, durable location);
  - the weld receipt: ordered pairs, split options, pre-split and output hashes, 0 source-coordinate changes, producer-file hashes, `selectionOrigin: greedy automatic search` with the committed candidate list and trajectory;
  - provenance: G2 generation receipt, subject source, presence, authoring evidence, automatic-transfer provenance, legacy-flag correction;
  - evidence references: Codex's selected-boundary audit and unwelded control, the native report, and the film and still inventory.
- **Master:** `record.source` points at a git-ignored copy inside the auto packet. The manifest binds it to the byte-identical TRACKED G2 master instead (both equal the record's `cutoutAssetHash`). The record is not edited; relocating the source would need a new record/recipe/packet.

## Checks (`summary.json`, from `build-packets.mjs`)

| Packet | Files | Weld re-derived from pre-split + recorded pairs | Source-coordinate changes | Record's master copy = tracked G2 master |
|---|---:|---|---:|---|
| Perch | 51 | reproduces the final binding byte for byte | 0 | ✔ |
| Cod | 51 | byte for byte | 0 | ✔ |
| Carp | 51 | byte for byte | 0 | ✔ |

**Search reproducibility:** `weld-g2fam-fish/adjjson.mjs` (the candidate enumerator, formerly an uncommitted scratch script) is now committed, and `greedy.sh` calls it. The per-fish candidate lists are `weld-g2fam-fish/candidates-<id>.txt`, byte-identical to the original scratch run's output. The full trajectory is in `greedy.log`.

**Not included:**
- A G5 finish-source labels registry row (it needs its own source-bound admission).
- Library/registry/pin rows (those owners act after Nick's decision).
- Trout and Herring: visually refused.

Rebuild: `node audits/G1_FISH_PACKETS_20260926/build-packets.mjs` from the repository root.
