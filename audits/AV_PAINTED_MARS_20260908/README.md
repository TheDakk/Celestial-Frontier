# Painted canonical Mars — local implementation and verification

2026-09-08 · OpenAI/Codex on macOS · `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`.
**Current status: final focused/static checks, three scoped native runs, preview packaging and the ordinary preview browser check PASS. Human asset acceptance remains OPEN.**
This is one opt-in, static painted vista for an exact canonical request. It is not full game
admission, physical-phone qualification or human acceptance of a production asset.

## Direction and exact scene

Nick authorized local implementation of the approved painted direction. This candidate uses
the top-right dune treatment from the supplied [biome reference](../PAINTED_SPACE_DIRECTION_ADDENDUM_20260908/biome-reference.png).
The approved space/creature direction remains authoritative. The UI example is graphic/material
inspiration only: control layout and placement must not be copied. The original Dakk source and
previous audit packets remain untouched. [Batch intent and startup state](BATCH_INTENT.md).

[canonical-mars.json](canonical-mars.json) preserves the actual source-derived request:

| Authority | Exact value |
| --- | --- |
| World | `CF1|g:999@90,-60|s:424242@560,170|p:134#3` |
| Environment | `cwe1:145:0d97c0f8` |
| Biome profile | `cf.domain.biome-profile.v1` / `bpd1-6fce883d4d70e3b6bde0fb184b416e8e` |
| Surface | `dunesea`, generic scene, `sand` palette, land |
| Current presentation | `wx:null`, no aurora/night/dusk/ring/event/Titan, two moons |
| Life/water | Zero inhabitants, no flora, water `none`; era `none` |

Generic biome-profile fauna/flora possibilities and hazard labels are not authority to populate
this barren request or invent an active storm. No biological generation, genome, biome IDs,
world probabilities, save data or rewards change.

## Asset and provenance

One original built-in image-generation attempt produced the retained
[mars-dunesea-source.png](mars-dunesea-source.png), from the exact [IMAGE_PROMPT.txt](IMAGE_PROMPT.txt).
Agent visual inspection found two small moons, no visible inhabitants, water or settlement;
this is not Nick's production-asset acceptance. [Generation receipt](generation.json).

| Artifact | Size/identity |
| --- | --- |
| Untouched generated PNG | 2,565,982 bytes; SHA256 `79bcc721c4ce25d2503ec7dc146560dbc12a9a6a45cd76e57c9e4edb1d53df08` |
| Exact prompt | SHA256 `f8d424152686415bc5b0e21758c0bd061a7a74dcb5d5f4b4e4b20e1619aebd22` |
| Runtime derivative | `port/v2/apps/game/src/assets/painted/mars-dunesea-v1.webp`; opaque sRGB, 960×430, 127,088 bytes |
| Derivative SHA256 | `59b9b940c17c5995d71b4f7d756f4e051ed43393d77d0213f63df52a655882e2` |

The [normalization receipt](asset-normalization.json) and [asset provenance](asset-provenance.json)
record ImageMagick resize-to-cover, centered 960×430 crop, stripped metadata and WebP quality 90.
Runtime phone placement still uses the existing uncropped vista layout; the earlier export crop
is not a claim that the original PNG was preserved uncropped in the derivative. Original capture
bytes remain intact. Deterministic selection binds a reviewed request and immutable asset;
AI-generated pixels are not claimed deterministic and no exploration-time generation occurs.

## Runtime owner and fallback

`?paintedvista=1` enables the candidate only when
[painted-mars-binding.ts](../../port/v2/apps/game/src/painted-mars-binding.ts) validates the complete
plain-data request against the recorded binding. This is not a general desert selector.
Main uses the `painted-mars-dunesea-v1` variant in the cache key, independently of the canonical
worker result. World/environment publication now precedes cache lookup, including a cache hit.

[painted-vista-load.ts](../../port/v2/apps/game/src/painted-vista-load.ts) verifies the expected
asset bytes and dimensions, decodes within current-generation authority and closes the bitmap.
Stale/exit requests abort. Only a current failure may request the unchanged native vista worker;
late results cannot mount into another scene. Existing one-entry CPU canvas caching, scene texture
leases and native navigation/layout remain the owners. No new engine, runtime dependency, online
provider, animation or morphing is introduced.

This does not swap Earth's background. Earth's current opaque vista also contains canonical
inhabitants; replacing only its background requires an explicit separated-layer solution.
Earth organisms retain their existing appearance, anatomy, colors and species-appropriate
movement requirements. Alien generation and existing named/bred lineage routes stay unchanged.

## Completed focused/static checks and retained first failures

The current [cache-owner-browser-free.json](cache-owner-browser-free.json) is **PASS**:

- [97 tests in 6 files](final-focused-cache-owner.log): painted loader, exact binding, surface
  wiring, vista cache, current producer authorities and Compendium budget checks.
- [All three TypeScript programs](typescript-final-cache-owner.log),
  [art-unused](art-unused-final-cache-owner.log), [art audit](art-audit-final-cache-owner.log),
  [override contract](override-check-final-cache-owner.log), [spec check](spec-check-cache-owner.log)
  and [root validation](root-validation-cache-owner.log) passed.

These are scoped checks, not a new full `develop` profile or Compendium/Slice/Glass certificate.
Producer extraction/refresh records accompany each tested state. Numeric rulers and prior
certification authority do not become a current certificate through a producer refresh.

[VERIFICATION_CORRECTIONS.md](VERIFICATION_CORRECTIONS.md) retains three distinct events:

1. Initial fact extraction stopped before capturing facts: the audit-root bare imports did not
   resolve and Vite attempted a default websocket listener. The corrected read-only extraction
   disabled ws/hmr/discovery and used exact facade paths. [First failure](fact-extraction-first-failure.json).
2. The first focused run passed 209 tests and failed one existing source-mutation control. The
   painted branch duplicated environment assignment, so removing only its first occurrence left
   the worker binding intact. No later check ran after that red.
3. Consolidating publication into one owner produced [210 passing tests in 12 files](final-focused-corrected.log)
   and a [corrected static/art/root PASS](corrected-browser-free.json). Later read-only review found
   that cache hits returned before that publication; hoisting it before lookup and strengthening
   the existing control produced the final 97-test result above. The prior 210-test state is not
   relabelled as testing this successor. The cache issue was found before native execution.

## Native comparison — scoped PASS

Three fresh, fixed-viewport Edge 152.0.4191.66 / CDP 1.3 runs passed with exit 0. Each used native
Training Skip, Mars selection/Survey and Land, retaining source/build hashes, inputs, requests,
paint comparisons and retirement receipts. These are scoped diagnostics, not certification.

| Run | Viewport | Result and retained evidence |
| --- | --- | --- |
| Phone | 390×844 @2 | PASS; painting visibly contributes 241,486 pixels and persists under real Reduced Motion and independently selected Effects Off. [Report](native-phone/review.json), [execution](native-phone-execution.json), [image](native-phone/mars-phone.png). |
| Desktop | 1440×1000 @1 | PASS; painting visibly contributes 760,991 pixels. [Report](native-desktop/review.json), [execution](native-desktop-execution.json), [image](native-desktop/mars-desktop.png). |
| Blocked asset | 390×844 @2 | PASS; exact asset-URL interception produces one load failure and one canonical vista worker, with visible fallback and native exit. [Report](native-blocked/review.json), [execution](native-blocked-execution.json), [image](native-blocked/mars-blocked.png). |

Success used one asset request per page and no vista worker. Same-frame no-op and restored-image
deltas were zero; the deliberately hidden painting changed the actual frame while identity,
transform, visibility and ownership restoration checks passed. Phone policy captures retain
[Reduced Motion](native-phone/mars-phone-reduced.png) and [Effects Off](native-phone/mars-phone-effects-off.png).
Both success exits destroyed the sprite, Texture and Source and retired the scene scope; one
960×430 CPU canvas intentionally remains in the existing cache. The blocked route also passed
fallback ownership/exit checks. All three reports retain zero runtime exceptions, interception
instrument errors and cleanup failures, with no pending evaluation.

The inherited `requestSurfaceVista` guard still requires a roster and Worker availability before
the painted branch, even though successful painting starts no worker. These runs do not establish
a Worker-free browser path. The service worker was bypassed to observe the exact asset request;
paint probes paused the app ticker for explicit same-frame comparisons and restored it. Resource
receipts establish application-owned retirement, not native GPU-driver memory release. Fixed
Chromium viewports do not qualify physical iPhone/Safari, resize/re-entry, PWA or a full heap gate.

Agent visual inspection found a clear improvement in rich dune detail. Existing composition still
places the globe over the landscape on desktop; on phone the header covers part of the sky and
the globe sits below. The coarse globe and polar banding predate this asset. This is not finished
landscape/AAA quality, and Nick has not accepted the individual production asset. No UI expansion
or Earth background replacement is implied by these findings.
[Visual inspection](visual-inspection.md) records these limits; the bounded [source review](SOURCE_REVIEW.md)
found no blocking authority, cache, fallback or lifecycle defect.

## Local human-test preview and remaining limits

[Preview packaging](preview-package.json) and the ordinary [preview browser check](preview-browser-check.json)
passed for `port/v2/apps/game/smoke/dev-preview-painted-mars-local-20260908`. The
[local preview](http://127.0.0.1:56099/?paintedvista=1) is served by PID 58886 (exec 66980), with
`sourceState:dirty-local-only` and `publishable:false`; [server receipt](preview-server.json).
Its content SHA256 is `8721f86dce95a43e7c773f96d3b82b9a59150bedcf70053a224b3f0a79423651`.
[Playtest instructions](../../port/playtests/20260908_PAINTED_MARS_LOCAL_PREVIEW.md) own entry and restart steps.
Earlier preview packages/servers retain their original contents. This check is not a human
playthrough. Individual art acceptance, physical-device memory/thermal/performance qualification,
full current game admission and all-family animation remain open.

The batch began over signed `837db4a`; these are local successor changes, not a newly signed
checkpoint claim. Required 1Password signing remains blocked with no unsigned fallback. Earlier
navigation/instrument failures stay retained under ROADMAP and their own audits; this focused
Mars work does not diagnose or close them. No hosted attempt, deployment, release or publication
is authorized by this packet. No additional jobs were executed while preparing this README.
