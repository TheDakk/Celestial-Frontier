# Handoff for Nick and Claude — individual references and mobile delivery

Nick requests completion of individual-species references and mobile delivery. This is a local
continuation from signed 83ee60f3db1db3f78596afe7519584ef2d1f14fb on openai/mac. The signed commit
containing this handoff is the completed checkpoint; Git supplies its final SHA/signature.
Implementation and measured acceptance must remain separate: physical-phone qualification and
canonical whole-scene art acceptance are not closed by desktop tests or favorable finish feedback.

## Direction and changes awaiting the intended Claude review

The intended review in Nick’s Claude app has not happened. Do not treat a previous CLI response
or this Codex subagent review as that review. Read the accumulated
[direction/change inventory](../CLAUDE_DIRECTION_REVIEW_20260909/HANDOFF.md),
[normal-game integration](../AI_GAME_INTEGRATION_20260909/HANDOFF.md) and
[full-painting continuation](../AI_LANDFALL_CONTINUATION_20260909/HANDOFF.md) as well as this packet.
Together they cover every accumulated responsive UI, audiovisual, painted-world, local-model,
normal Land/queue/progress/ETA/cancel/View, retained-original and inspection change awaiting review.

Celestial Frontier remains a browser proof of concept for a later engine game. Landfalls should
be cohesive large natural-history paintings generated locally on demand, with multiple canonical
flora/fauna sharing light, ground contact, foliage overlap and atmosphere. The Compendium keeps
full seeded individuals and flora effects; later articulated 2D battle rigs cover land, flying
and aquatic families. Universal objects share that finish. Earth anatomy, full genomes/lineage,
biome mapping, determinism, saves and accepted control placement remain authoritative. Nick’s
favorable finish feedback is retained without a fabricated exact-image approval or taxonomy waiver.

This batch adds:

1. Four new authored individual reference PNGs—Frog, Persimmon, Devil’s Club and Cranberry—joining
   retained Civet/Platypus images. Exact prompts, original bytes/SHA, source geometry, full genome/
   visual keys and independent diagnostic reviews are committed. These authoring-tool outputs
   are not local-model quality evidence. Ordered runtime assets total 11,018,214 bytes.
2. A versioned V2 conditioning/render adapter for all six references, with unchanged canonical
   nineteen-genome Earth snapshot and V1 recipe bytes. Strict reference order, identity, digest
   and geometry checks precede sequential encoding. V2 uses explicit high-quality 480×320 fitting;
   the pinned tokenizer measures 452/512 tokens. The graph still has no box/mask/count input.
3. Same-snapshot/same-model V1 original recovery under V2 selection; no general cross-model index
   or save-schema change. Native model-storage disclosures survive progress/refills, keeping Pause
   reachable while respecting deliberate collapse and cleaning up on pagehide.
4. A 35.72 MiB six-reference runtime and 53.91 MiB optional combined app/PWA. Both external manifest
   digests and inventories are independently verified. Optional service-worker policy allows only
   explicit exact-model GET/Range without model CacheStorage, and counts all retained build response
   payloads before exceeding 256 MiB. Worker imports require explicit worker ownership of their
   retained build, closing an actual module-load refusal. Normal service-worker output is unchanged.
5. Native full-model delivery diagnostics using the actual game controls and production OPFS owner,
   with a strictly bounded freshly hashed loopback mirror of existing model bytes. The actual
   installed TS7 CLI compiles only two read-only diagnostic modules before any browser/model work.
6. A development-preview transport correction: the pinned Vite 8.2 client still connected after
   its server transport was disabled. A verified served copy omits only the eager connection;
   helpers and real error handling remain. Installed dependency bytes and static game package
   are unchanged. No error whitelist or repeated model run hides the original failure.
7. Current system references, development release notes, immutable first failures and this paired
   handoff. No production version bump, new Guide/Training flow, hosted action or scheduled prompt.

## Results and exact artifacts

The [README](README.md) indexes all commands/source-bound outcomes. Product adapter/disclosure 46/46,
current PWA/fidelity/mount owners 66/66, all three TypeScript programs and root validation pass.
Root validation retains 1,010 renders, zero boot errors and 50 unchanged original deterministic
fingerprints. Reference admission 16/16, runtime pack 12/12, mobile 8 pure plus8 actual package/HTTP,
mirror 6 pure controls, and corrected diagnostic compiler/assessor 8/8 retain their separate scopes.
Do not sum correction reruns into a fictitious full profile. No full admission/certificate run.

The [actual six-reference landfall](native-generation-01/result.json) took 135.671 seconds to verified
Ready. SHA44f03a6c6c2e47c38d93106ce4ba08a3dcd7bac17320fd582aa57b8b6aa4c400 binds the exact 1024×576 PNG.
Its distinct fauna and plant motifs improve, but the
[independent review](native-generation-01/INDEPENDENT_VISUAL_REVIEW.md) still fails Platypus body
plan, botanical diagnostics and canonical placements. All six full observation identities and
source references are retained; V1-only landfall-fidelity.ts did not assess this V2 image.
The whole run remains FAIL due to Vite-client WebSocket exceptions. Actual generation, retained
original, explicit View, responsive Notifications, reload/resize preservation and 44 unchanged
source hashes are recorded. Nine worker-entry requests were measured; native worker IDs were not
enumerated. Browser/server/target/locks closed. No unchanged inference rerun was used as repair.

Runtime artifact: /private/tmp/cf-runtime-pack-20260909-species-01,
37,451,014 bytes, manifest SHA256 ddc09e2128a6fbfea11b3c6b0596359eb97fd7f18198fed38c74b3736502476b.
Current combined artifact: /private/tmp/cf-mobile-pack-20260909-species-03,
56,529,354 bytes/97 files, manifest SHA256 5dc7a6e41eebe0e71c399db7c526d87ca47a43d850bb1fc3111dcf8c94aa0d5c,
build ID 42d79c05f4b5269766d35e82c03f7b828f70062dc2bdca54ee98ca5f643465b4.
All 426 measured build inputs stayed unchanged during build/verify. Build03 incorporates the
optional worker-import ownership fix and its development note; package02 remains preserved for
its full-model run. Same-size retained pair: 113,058,708 bytes.
No weights are in either package, and local diagnostic artifacts are not publishable qualifications.
Rebuild from pinned sources if disposable temporary outputs disappear.

[Full-model native01](native-mobile-delivery-01/result.json) and
[native02](native-mobile-delivery-02/result.json) remain aggregate FAIL. The first hard reload
bypassed its PWA controller; corrected native02 verifies the exact activated owner through normal
reloads. Actual Install/Pause/reload/Range resume stores all 20 files in one attempt (6,392 chunks,
6,691,020,416 bytes) in 108.690 seconds using existing local source bytes. That is not a mobile or
internet transfer estimate. All 21 model interceptions originate in the actual service worker.
Its 99 CacheStorage responses total 56,490,698 bytes, with no model payload stored there.

After both origin servers physically close and CDP goes offline, a normal new document reloads.
Native UI full-model rehash takes 79.775 seconds. The exact compiled read-only production delivery
owner also verifies readiness and opens all 20 Blobs with correct size/head/tail hashes. An actual
shifted Blob slice is rejected, then the original reaccepted. All 27 source hashes remain unchanged;
owned browser/profile/servers/locks are removed. The last worker-module observer and pending
Network.enable time out. No graph execution occurred, and the aggregate remains FAIL.

The separate [worker-import diagnosis](WORKER_IMPORT_DIAGNOSIS.md) preserves three smaller failures
and native fetch metadata. Imported modules carry destination worker but empty resultingClientId;
the optional PWA treated those as new workers and rejected them. The corrected template permits
imports only from an explicit worker-role pin, then applies the existing retained build and exact
asset guards. Window/unowned/substituted/stale markers and unlisted files remain refused. No active-
build fallback is added. Ten package/ownership plus two reply controls, 34 existing PWA tests,
all three TypeScript programs and root validation pass in worker-import-controls-01. Its independent
static review found no material remaining issue.

[Native04](offline-runtime-native-04/result.json) is PASS using unchanged verified package03.
The real worker ESM graph replies through its existing pre-GPU guard online and after server-off,
CDP-offline, normal new-document reload. All 95 cached asset hashes match; the 25,749,873-byte lazy
Asyncify WASM matches its digest offline. No model store exists. All 12 sources remain unchanged,
no browser exceptions/crashes are captured, and all resources close. The final Sol screen was
visually inspected. This closes the measured module route, not model initialization, inference,
physical-phone capability or the historical full-model aggregate result.

Frozen preview native boot also passes Skip → durable Sol → new-document reload with two real
served-client captures, zero WebSockets/model requests/browser exceptions/crashes, 20 unchanged
sources and complete cleanup. Two favicon 404s remain. No unchanged inference was rerun.

## First failures and remaining boundaries

All first fixture, compiler, transport and native failures are retained with exact sources and
correction scopes. These include frozen binding mutation in a test, declaration/import mismatch,
copying into an existing strict fixture destination, initial sandbox HTTP refusals, unnecessary
Vite WebSocket bind, then the actual client exception; diagnostic TS7 API removal, strip-only
parameter-property refusal and Node26’s removed transform mode. The supported installed TS7 CLI
correction passes actual module import/error-code behavior before native execution.

The model is 6,691,020,416 bytes/6.23 GiB, separate from the optional 336 MiB desktop Q8 derivative,
app/runtime, art, saves and GPU/RAM. It is an experimental optional model, not a selected mandatory
phone download. Target iPhone/iOS identification is still pending. Physical full install, real
internet/CDN CORS/resume, Safari/PWA graph allocation, complete generation, foreground FPS, peak
memory and thermals still require device evidence. No remote generation service is added.
NativeWASM source-version correspondence is now corroborated from embedded build text and npm
integrity; a reproduced build/selected-component SBOM/full distribution review remains open.

Broader canonical adapters, hard species/placement fidelity, cross-model original discovery,
protected export/exact-image sharing, durable background/reload jobs, adaptive art eviction,
physical seasons/orbits and articulated family rigs/universal objects remain unfinished.
All older ROADMAP blockers are retained verbatim. SceneMemory stays quarantined; iCloud 94-file
backup remains blocked after two automatic-review rejections, with no retry or cloud write.
Audio retains its 268 focused checks/six DSP renders; HUMAN listening remains pending.

## Fresh-session startup and paired Git handoff

Current side: OpenAI/Codex · macOS · /Users/nick/Projects/celestial-frontier-openai-mac · openai/mac ·
upstream origin/openai/mac. Starting83ee60f3 was11 ahead/0 behind upstream9bfec7dc4a06d97dfd29f8f5424553336776c9fb
and122 ahead/0 behind developc1791e210158de864fdd475323c3091d9ecbae58. This completed local checkpoint
adds one signed commit (12/123 ahead at those last verified refs); no fetch or GitHub writes here.
SSH origin remains git@github.com:TheDakk/Celestial-Frontier.git; prior TheDakk/read proof established.
Ambient .DS_Store is untouched/untracked; all intended work is committed before handoff.

Read ROADMAP first, PROCESS_LAWS before UI/tests, PARALLEL_GIT_PROTOCOL before batch/handoff.
Reuse the September8 Civet startup receipt only in this uninterrupted session; fresh sessions
complete UI_TOOLCHAIN update/idle/lock startup. Terminal/files/isolated native CDP only, with
browser owners outside Seatbelt and shared foreground/checkout locks. Caffeinate33372/93550 were
verified active; no security/lock-screen change. Sign through command-scoped configured 1Password
SSH socket and ssh-keygen, then independently verify with a temporary allowed-signers file.

GitHub step: none. PR42 remains parked Draft/unlabeled at old remote9bf, base develop/source
openai/mac. No new PR needed. Current title: “Refine responsive UI and add bounded audiovisual
and painted-world prototypes.” Before any future exact-authorized push/Ready/owner label, refresh
its accumulated exact head/title/body and selected admission evidence. Prepared later fields:

- Base: develop
- Source: openai/mac
- Title: Expand the browser slice with responsive UI, audiovisuals and local AI landfalls
- Description:

```text
Expand the browser development slice with responsive presentation, audiovisual refinements,
cohesive painted-world studies and local AI landfalls. Ordinary Land publishes its durable
transaction before a separate painting queue starts. Survey and Notifications expose progress,
cancel, explicit View and full-original inspection. Verified originals reload without inference.
Model installation is explicit, resumable and hash-verified; storage controls preserve Pause
through progress. Six full-identity Earth references feed a versioned local renderer. An optional
53.91 MiB combined app/runtime PWA excludes weights and supports verified OPFS-only admission,
uncached exact-model delivery and bounded retained-build installation. Worker imports preserve
their creator’s retained app build through explicit worker ownership.

This remains an Earth-only browser proof of concept. Favorable painted-finish feedback is recorded,
but actual generated anatomy/botany/placement still fails acceptance. The 6.23 GiB model, physical
phone inference/storage/latency/thermal tests, full distribution qualification, broad cross-model
original discovery and exact-head admission remain open. Deterministic identities, saves and
accepted base controls are preserved. Every first failure and rejected candidate remains recorded.

Validation: source-bound focused product/tool tests, all three TypeScript programs, root validation,
exact static inventory/build verification, prior native viewer and small-file OPFS controls,
current actual six-reference generation with an honestly retained aggregate dev-transport failure.
Full 20-file native storage/resume/offline/Blob subresults are recorded with their honestly failed
final module observer. The corrected exact package separately passes native online/offline worker
imports and lazy runtime byte checks; it initializes no model. Read AI_SPECIES_MOBILE_20260909 for
the exact scopes; none replaces physical-device or Compendium/Slice/Glass admission.

Claude’s workspace receives this only after a separately admitted develop merge. No release,
deployment, production version bump or hosted test attempt is included.
```

Claude side: the intended app review remains pending; Nick need not open Claude now. Its checkout
does not have these local changes. Review the committed packet when wanted. Only after verified
develop integration may clean anthropic/mac fetch/merge origin/develop; finish/commit dirty work
first and never manually copy files across worktrees. Develop/main/live site are unchanged.
Actions budget: recorded UNFROZEN/PUBLIC, private fallback3,000; zero new exact hosted/owner-label
attempts. No Ready, labels, Actions, merge, release/deploy, automation or scheduled prompt.
