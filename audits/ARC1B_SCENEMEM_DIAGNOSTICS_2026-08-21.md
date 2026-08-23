# Arc 1B scene-memory diagnostics — 2026-08-21

These are retained diagnosis artifacts, not release or certification evidence. Both were captured from a dirty worktree with `--calibrate --allow-dirty`; both intentionally use 12 measured cycles, so their overall `fail` verdict is expected against the certifying contract's exact four-cycle structure. They must not be presented as terminal-green evidence.

## Retained artifacts

- `ARC1B_SCENEMEM_SAMPLING_DIAGNOSTIC12.json.gz` — allocation-sampling diagnosis. Decompressed JSON SHA-256: `5492eae26e59890d325b0fcbbc1e289321f167d87f6bddf2e0392913dc2e99f0`; gzip SHA-256: `ad20bc4fd1fbd464918527ae8207041a927690f10f267bd689e5adc9e78764a6`.
- `ARC1B_SCENEMEM_FINAL_DIAGNOSTIC12.json.gz` — post-fix 12-cycle plateau diagnosis. Decompressed JSON SHA-256: `f470bdcdf91c936bd1d29ffebd1ae8cca24e7dd495237c9606f4499c31dba02a`; gzip SHA-256: `8292a49d6d3ee845b4d16269a3a72e0f68b677564b9eca9d2a9a85b3c6ed5b6f`.

## Diagnosis and result

Allocation sampling exposed Pixi `BatchTextureArray` UID tombstones as the remaining scene-cycle retention. The product fixes then combined explicit managed-resource compaction, detached destroyed scene labels from shared `TextStyle` update listeners, destroyed owned `Graphics` contexts, and deleted cleared batch UID slots in place.

In the final report, all 12 settled cycles were stable for both profiles: 19 active leases/textures, 18,350,080 live canvas bytes, 43 managed textures, zero local-canvas or ring-cache entries, zero product render targets, and zero pending persistence/work. Pixi's six per-hash inventories stayed at 87 live / 0 cleared entries; shared style listeners stayed at 13. Backing storage was byte-flat at 2,248,466 bytes on phone and 2,248,434 bytes on desktop. Across the full 12-cycle windows, phone aggregate heap range was 496,188 bytes with a 41,991.04895104895-byte/cycle maximum positive slope; desktop range was 513,652 bytes with a 47,012.08391608392-byte/cycle slope.

This bounded diagnostic evidence is input to the required later clean, exact-head four-cycle calibration/certification work; it does not replace that work.
