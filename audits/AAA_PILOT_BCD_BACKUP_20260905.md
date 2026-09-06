# Audiovisual pilot B/C sources — verified iCloud backup

**Primary backup VERIFIED** at **2026-09-06 00:37:00 UTC** (September 5 local).
New container: `cf-pilot-bcd-sources-20260905`. This preserves the frozen B/C sources
for D integration; it does not close the integrated-pilot approval stop.

| Preserved item | Files | Bytes |
| --- | ---: | ---: |
| B art sources, outputs and history | 110 | 17,016,539 |
| C audio sources, outputs and failure history | 84 | 207,554,110 |
| New private index and restore notes | 2 | 62,242 |
| Complete durable source bundle | 196 | 224,632,891 |
| Deterministic sorted ustar | 196 members | 224,788,480 |
| SHA256SUMS | 197 entries | 24,895 |
| Complete cloud package | 198 | 449,446,266 |

Archive SHA-256: `3e319afc9e35991a99aebc9a6940662d8c6f01e41fbbda0b35d2db6ae61bf38f`.
SHA256SUMS SHA-256: `5d1665601f13e9644ca0e765bbe18dc80b21398eae5ebfd5fcde3bca6f0a50a3`.

All 194 frozen original files matched their existing inventories before copying and
remained unchanged afterward, including modification times. All 196 durable files
were rechecked. Original inventories, README caveats, the rejected coarse biome,
first ship version and first audio-attempt failure history remain intact. The new
private index maps the preserved `b/` and `c/` hierarchies. No runtime configuration,
registration, user settings or credentials were present in the selected inputs.

## Forced cloud read-back

The new package was copied with `rsync -a` into Nick's already-selected iCloud top
folder, `Files/Celestial Frontier Backups`. Copied nanosecond timestamps were restored
after system rsync reduced their precision. The original Batch A container was not
touched. Ustar members are sorted regular files with fixed mode, owner and timestamp;
there are no AppleDouble, PAX, compression or external-link members. Every archive
member was checked against its source before upload.

At **00:34:34 UTC**, the existing native NSURL command-line reader reported all
**198/198 uploaded=true, uploading=false**. The scoped `brctl evict` exited 0 at
**00:34:35 UTC** and all **198 files had zero allocated blocks**. Local durable and
frozen scratch originals remained intact.

Explicit per-file `brctl download` requests were accepted for **198/198 files**
between **00:35:30 and 00:35:33 UTC**. Before hashing, all were Current, not downloading,
and physically allocated again. At **00:37:00 UTC**, `shasum -a 256 -c SHA256SUMS`
passed **197/197 entries**: 196 source/metadata files plus the archive. SHA256SUMS itself
also matched its pre-upload hash, giving **198/198 complete package files verified**.
Post-hash native state remained Current and allocated for every file.

A separate scratch copy of the restore note was deliberately truncated by one byte.
The same checksum verifier rejected it with **exit 1 / FAILED**. No original or cloud
file was altered for this negative control. The adjacent JSON retains individual
file hashes, actual upload/allocation/read-back states, timestamps and log identities.
Raw CLI receipts and private locations are preserved in a separate durable local
companion, without mutating the verified cloud package.

## Scope and handoff

OneDrive was not retried; its earlier unsupported/unverified secondary status is
outside this proof. There were no screenshots, UI/accessibility operations, app
launches, new renders, browser/device tests, Git mutations or edits to existing docs.
Only these two sanitized audit files were added by this backup task.

These are private editable-source and evidence bytes, not the shipped asset pack.
The 128 MiB installed-pack / 256 MiB retained-update policy is unchanged. Human art
and listening approval, physical-iPhone evidence and the integrated pilot remain open;
source backup grants no Phase 2, hosted-run or release authority.

**Codex:** root may include these audits in its authorized pilot checkpoint and
continue D integration/review. **Claude:** no immediate action or app switch is
required; review the pushed audit with the next authorized handoff. Nick does not
need to open the other app for this completed backup operation.
