# Batch A — independent source backup, 2026-09-05

**Source-preservation prerequisite CLOSED through the verified primary iCloud backup.**
Source checkpoint: `fba61fb0d51d6d3d377fdcfdd889e016987f41ba` on owned `openai/mac`. All37 original inputs remain unchanged.
The companion private backup index records full destination paths outside the immutable bundle
and public Git, avoiding any change to the hashes being backed up.

| Item | Files | Bytes |
| --- | --- | --- |
| Original sources/outputs/evidence |35|10,731,051|
| Private index + restore notes |2|10,964|
| Whole copied bundle |37|10,742,015|
| Uncompressed sorted ustar archive |37 members|10,769,920|
| SHA256SUMS |38 entries|4,795|
| Whole destination package |39 files|21,516,730|

Archive SHA-256: `3be57f38eb9c3e20c8f3c787fc31d4f20b60f59e197dadfe6d0ffcb367685d0b`.
SHA256SUMS SHA-256: `d2b5c4f21bb2757a6ab24fa070b797cfaf508158d84732479a3af247f2950eac`.
Copy used `rsync -a`; system rsync rounded subsecond timestamps, so the copied files' original
nanoseconds were restored. Names and source bytes/mtimes remain unchanged. Tar uses the sorted
37-file list, `--format=ustar`, no compression or recursion, and no AppleDouble additions.

## Primary: iCloud Drive / Files / Celestial Frontier Backups

Copied at22:41:16.776880 UTC. At22:47:50.855540, Apple's native per-file resource values reported
**39/39 uploaded=true, uploading=false**. `brctl status com.apple.CloudDocs` timed out after20s;
`brctl monitor -p -t5 com.apple.CloudDocs` timed out after15s, both with no output. No brctl
caught-up line is invented; the substituted upload evidence is the39 per-file states.

`brctl evict <selected backup package>` exited0 at22:48:30.764498 with the exact final line:
`evicted content of '<selected backup package>'` (personal path redacted). All39 files went
from allocated data to zero blocks/cloud-only state. The folder download command exited0 but
did not hydrate its children;39 explicit document download requests were accepted at22:50:30.090629.
Before the successful checksum run, all39 were Current/not-downloading and allocated again.
At**22:51:46.640097 UTC**, destination `shasum -a256 -c SHA256SUMS` passed **38/38**:
**37/37 source/metadata files plus the tar**. The destination source index, all35 indexed files
and both metadata hashes also match the earlier public evidence. Post-hash native state remained
39/39 Current, not downloading, with allocated data. This was an independent cloud read-back.

The deliberate truncated scratch copy failed the same checksum verifier with exit1/FAILED;
the scratch file and scratch checksum were deleted. Originals and destinations were not changed.
The adjacent JSON retains timestamps, checksums, exact command outcomes and log identities.

## Secondary: OneDrive Personal / Celestial Frontier Backups

The10-second listing probe responded in0.056s; it was not skipped as unresponsive. Copy completed
at22:41:16.910931 UTC, with native upload metadata subsequently reporting39/39 uploaded.
However, `brctl evict` exited1: `BRCloudDocsErrorDomain Code=6`, path outside CloudDocs and will
never sync through that provider. None of the39 OneDrive files were evicted. Its copy is therefore
**COPIED / UNVERIFIED**, not independent-backup evidence. No supported scoped OneDrive eviction
CLI was found; Finder automation reported Computer Use permission not granted. A later native
OneDrive Free Up Space / Download Now action and the same38 checksums can close this secondary.
This limitation does not erase the completed primary proof.

## Handoff

Cloud backup now requires forced evict/download hash verification under PROCESS_LAWS.md and
AAA_ASSET_POLICY.md. Codex proceeds to portable replay only in a separate working copy and
records that as its own checkpoint. B–D inputs will receive a status table only; no production
work on them starts. Claude's anthropic/mac c860f57 and unmerged173c806 remain untouched.
No need to open Claude now; these records stay on openai/mac. Nick's artlock CI lane, ITP save
protection and DECISIONS row19 wording remain open.

Budget UNFROZEN, PUBLIC, private fallback3,000; no hosted authority. Branch push only, no
workflow trigger. No PR, label, merge, release, purchase, protected-portrait/artlock-reference,
workflow/Actions-policy or Phase2 change. The next checkpoint owns portable replay results.
