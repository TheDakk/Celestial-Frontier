# Batch A — develop sync and private audio source preservation

Completed 2026-09-05 by OpenAI/Codex on macOS in its owned `openai/mac` checkout.
This is the audiovisual pilot's Batch A, separate from the external review's lettered batches.

## Exact sync result

Real merge **`241572365716a3436e2055410b6130a43d46af23`**, tree
`8a79396a38b09c2da9fc92d4d3342e3ad9186bde`, parents:

- OpenAI `3ffee05113904cf5cc8d45a90a6d2704ddf1b1eb`
- Develop `9ea01041dcdc711190bbf909ea8bb743cd993734`

The branch was clean before merging; both parents' documentation histories are retained.
All workflows, policy code and non-documentation v2 files match develop. No rebase or signed
commit rewrite. Matching Compendium producer pins were verified by the profile's existing
producer check; measurement authority, calibration and numerical ceilings were not changed.

The clean committed merge ran each requested command once:

| Check | Result |
| --- | --- |
| `node port/v2/tools/tracked-input-preflight.mjs --profile=develop` | PASS; 274 files, 2,886 passed / one skipped; all three TypeScript programs, art 34/0, routes 1,014 and spec 454/0; 45.322s wrapper |
| `node tools/actions-budget-policy.js --selftest` | PASS; 81 controls; 0.090s |
| Root `node tools/validate.js`, after resolution and before commit | PASS; 1,010 renders, zero errors, all 50 v1 fingerprints unchanged |

Exact HEAD/index stayed clean and unchanged through both requested checks. Normal SSH push and
remote read-back verified the merge at origin/openai/mac. The review branch remains `121df53…`,
parked backup `cf1b9a7…`. The evidence object in `AAA_BATCH_A_SYNC_EVIDENCE_20260905.json` records
full identities and log hashes; raw logs are privately preserved as
`cf-openai-mac-develop-sync-20260905`. These are local browser-free results, not phone or hosted
certification. This later documentation-only record does not change the tested runtime source.

## Fresh-start boundary

PRs #36/#38/#39/#40 are landed. PR #37 is closed as superseded. V2 starts fresh for everyone;
no legacy player-import door may return. Keep the v1.8.9 codec, evidence-build `importBlob` seam,
77-outcome bulletin and Glass planned-ledger matching. Gate C concerns v2 persistence on a real
device. Batch 4 no longer waits for an exported save; its own bounded review PR and Nick's exact
hosted authorization remain necessary. Its gameplay and WIP remain parked.

## Batch A continuation

The earlier preview copy held only flat output files; its readiness manifest's five relative
references could not resolve there. The complete original layout is now preserved privately under
logical source ID `cf-reaper-surge-audio-readiness-20260904`: the REAPER project, Lua recipe,
waveform/browser verification scripts, logs/results, and WAV/FLAC outputs. The embedded MIDI and
Surge instrument/effects state remain unchanged. Application configuration and registration files
were not part of this preservation.

**9/9 copied files match their original bytes** (1,340,635 bytes). **5/5 original manifest
references resolve and match hashes**. Private inventory is 5,333 bytes, SHA-256
`3ddffec7c5dd09361fd6beec1d6f2695ffaf3829ace32f8bcc74915042598953`.
The total local bundle is 1,345,968 bytes. No master/audio binary is committed to public Git.

This is local preservation, not independent backup. Nick has been asked to choose an existing
external-drive/cloud destination; none is selected or verified. Original scratch paths in the
project/recipe are retained, so portable replay is not claimed. No new application launch,
render, browser probe or gameplay change was needed. Existing human listening, Safari/iPhone,
in-game integration and eight-body-plan acceptance remain open. The pilot approval stop stands.

## Paired handoff

Codex keeps the Batch A source-backup prerequisite open and records these results on `openai/mac`.
No new PR is needed now. Claude can continue unrelated work and, at its next coding batch,
fetch/merge latest develop into its own clean owned branch; the additional audiovisual records
are not integrated into develop. Nick need not open Claude now. No manual file copying.

Budget remains UNFROZEN, last verified PUBLIC, private fallback 3,000; zero hosted attempts or
labels are authorized. The requested branch push triggers no workflow. No release, deployment,
purchase, protected-portrait change or Phase 2 work occurred.
