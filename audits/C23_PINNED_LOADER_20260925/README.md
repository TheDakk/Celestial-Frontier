# C23 — master-free pinned loader and controls

The loader and requested cold/worker/offline checks are complete. Masters remain
in the package: Claude removes them through its generator after integrating this
change, remeasures the integrated pack, and restores held fits within the unchanged
128MiB cap. No pack-saving number or overall art/motion acceptance is claimed here.

`loadPinnedCreatureRigV1` accepts a genuine bundled pin plus exact alpha PNG,
decompressed binding and atlas bytes. It checks private identity before reading
the record, snapshots mutable inputs before awaiting, preflights every authority,
decodes the pinned alpha itself, and runs the shared semantic record checks.
Both loaders enter the same private binding/parts/skin/seam allocation tail.
The old byte loader still hashes the retained master. No public bypass boolean,
caller hash, arbitrary alpha, fake receipt or fallback master download.

Four authority/contract files were copied byte-for-byte from signed Claude head
4093ebca (imported-authorities.json); only the preflight module's explanatory
comment was subsequently updated. The26-entry generated pin table is unchanged.
Only the loader path was reconciled into local wiring; Claude must retain its
newer declarations, observed-support and §20 changes when consuming this patch.
The semantic checker exports validate content only and allocate no rig; the
actual runtime entry points remain byte-admitted or privately pin-admitted.

## Checks and retained failures

31 targeted tests pass. Actual published vertices match the old byte loader at
rest/head pose/rest. Fake/JSON/prototype pins refuse before record access or atlas
decode; changed creature/record/path/alpha/binding/atlas refuse; caller mutation
during async hashing cannot change admitted bytes. Three source mutants are
killed: forged authority, skipped alpha hash, and unsnapshotted caller record.
Existing byte-loader corruption, alpha, part, skin/seam and disposal tests pass.

Exact Edge153.0.4234.48, local built source (diagnostic, not certificate):
- cold02, service worker refused: Civet/Centipede then TreeFrog/Salmon, both sides
  painted, zero page/server master requests, zero page errors.
- worker-offline02: same pairs under worker control, then arena-server refusal
  and reload; cached pair remains painted with zero refused arena requests.
  UncachedStarfish/Octopus fails with an actual503 and one refused server request.
  All phases have zero master requests and zero cross-navigation page errors.
- cold01 exposed `batch.batcher===null` in Pixi BatchPipe. Boolean
  `app.destroy(true)` released GLOBAL resource pools while the main renderer was
  alive. Both secondary-app teardown calls now remove their view with
  `releaseGlobalResources:false`. Cold02 is on that changed source, not an
  unchanged retry. worker01 passed but its inherited script reset error collection
  across navigation; it is superseded by cross-page tracking in worker02.
  cold01 failed before its terminal master-request capture, so no zero claim for it.

S2 six subjects/13,286 samples and receipts byte-identical. App TypeScript/root
validate pass. Full develop5127pass,1failed(parkedI5),2expectedfail,2skipped;
485filespass,1failed,1skipped. No overallgreen or later profile-owner claim.
After this run, the existing draft motion bullet was extended (count unchanged)
and its three release/guide suites run separately; release-tests.log is their
receipt. Other post-build changes are comments only. Built artifact and exact
source-map content hashes retain both native producers. No gate or budget change.

## Scope and next steps

The inspected offline still shows actual paint-skin rigs. These short picker
checks do not establish full-stage spacing, every animation or60fps. C25 will
film the spacing-blocked candidates against Claude's actual source. No source
bundle transforms were used for these loader checks.

Claude: integrate loader/common admission and teardown fix; preserve newer wiring;
remove packaged masters via generator, measure bytes and restore six held fits
only if cap permits; smoke/re-publish under existing authority. Codex: C24 strict
root types, C25 actual-branch films, then§20 balance. Nick need not relay. C8parked;
no label/hosted/release/deploy. manifest.json hashes the review packet and sources.
