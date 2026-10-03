# Local review delivery

The current export is `/private/tmp/cf-painted-fits-review-20260916-v2/`.
Upload all three CF-review-part-01.zip, CF-review-part-02.zip and CF-review-part-03.zip files.
Each is below Claude's30MB limit; the exporter validates archive CRCs and records SHA-256.
Read `receipt.json` beside them for exact bytes and hashes. They contain the saved candidate
code, review prompt, documentation, new captures and controls. `REVIEW_SNAPSHOT.json` in each
part identifies the base commit and file hashes. This is an uncommitted snapshot while signing
is blocked, not a signed head. Earlier cumulative C2/C3 evidence is linked by REVIEW_PROMPT.md;
the three ZIPs do not pretend to duplicate every historical audio/image packet.

Durable source/evidence is in this repository. If the temporary delivery folder expires,
rebuild from the staged checkpoint with:
`node port/v2/tools/creature-animation/pack-staged-review.mjs <new-output-folder>`
Do not overwrite a prior review export. No GitHub action or history operation is involved.
