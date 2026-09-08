# Painted Mars composition — local checkpoint, September 8, 2026

**Scoped implementation, native checks and local preview PASS.** The approved painting now shows
without the large decorative globe in front of it. Phone placement centers the full uncropped
panorama below upper controls. The existing asset, controls, navigation and canonical data remain.

[Play the local preview](http://127.0.0.1:56749/?paintedvista=1): skip Training, select Mars in Sol, Land, close Survey.
If the first descent waves off, the game offers its guaranteed learned approach. This is still
a static landscape candidate; no new creature motion, audio or full-universe completion is claimed.

## Implementation and direction

The exact painted request remains Mars134#3 in Sol, environment cwe1:145:0d97c0f8, dunesea/sand,
no weather/water/life, two moons. [Prior asset/fact/provenance packet](../AV_PAINTED_MARS_20260908/README.md)
retains the original generation, prompt, hash and selection rules. Its bytes are unchanged:
960×430 WebP127,088bytes, SHA59b9b940c17c5995d71b4f7d756f4e051ed43393d77d0213f63df52a655882e2.

Main's syncSurfaceVistaPresentation takes ownership only of the successfully painted Mars globe
Sprite's visibility. It hides that sprite and centers the existing full-image contain layout;
world.visible, camera state and DOM controls keep their original owners. Publication and cache
hits use the same synchronization. Release restores only the previously owned Mars sprite before
normal destruction. Pending/failed/default paths keep the old globe and vista placement. Earth's
finite-turn fallback is never owned by this switch. [Source review](SOURCE_REVIEW.md) found no
blocking lifecycle, cache, authority or visibility conflict. No engine/dependency change.

The globe texture remains available for fallback: there is no claimed GPU-memory reduction.
The panorama stays fixed during camera pan/zoom. This adds no ground tiles, 3D camera, creature
articulation or new interaction. Earth appearance/movement and procedural identities remain binding.
The supplied UI example remains material inspiration only; no layout or controls were copied.

## Verification and retained observer failures

[Browser-free chain](browser-free.json): **216 tests in13 files**, all three TypeScript programs,
art-unused, art-audit, override, spec and root validation PASS. Root retains1010 clean species
renders,0 boot errors and50 original fingerprints. This is not a fresh full develop certificate.

Two native setup failures are retained unchanged:

- [First phone run](native-phone/review.json) timed out expecting immediate arrival after a real
  descent wave-off. No painted request or rendering exception occurred. The initial observer did
  not capture its durable witness; [diagnosis](FIRST_NATIVE_FAILURE.md) preserves that limitation.
- [First receipt observer](native-phone-outcome/review.json) retained the exact wave-off, then
  incorrectly expected the action ordinal to advance by two random draws. Domain SessionRNG
  increments one receipt ordinal per action, with separate draw counters. The
  [correction](RECEIPT_OBSERVER_CORRECTION.md) changes only the new observer's expectation.

No product/build change or later native stage followed either red. The corrected
[native runner](native-composition-receipt-runner.mjs) reads exact durable rows, witness, HP,
SessionRNG and native input. A verified wave-off plus the100% exact-world CTA permits one learned
native action; another outcome never triggers a retry. The blocked-image run exercised both
wave-off and guaranteed arrival successfully. This does not diagnose older navigation failures.

| Fresh native scope | Outcome |
| --- | --- |
| [Phone390×844@2](native-phone-receipt/review.json) | PASS: full panorama centered, no globe obstruction;12 visible control rectangles/hits unchanged during forced-globe control; actual Survey reopen/Close, Reduced/EffectsOff/cache hits and right-click exit. |
| [Desktop1440×1000@1](native-desktop/review.json) | PASS:13 control rectangles/hits unchanged; Survey reopen/Close and Escape exit. |
| [Exact blocked image](native-blocked/review.json) | PASS: one request failure, one canonical worker, visible original globe/vista; actual learned landing and Leave world exit. |
| [Option off](native-default/review.json) | PASS: no painted image request or loader; one canonical worker, original globe/vista, Survey and Leave world. |

The actual off→on→off globe control changed253,643 phone pixels /119,191 desktop pixels and
was rejected by the same composition acceptor; restoration returned exactly to baseline. Vista
hide/no-op/restoration controls also passed. Every run had zero Runtime exceptions and cleanup
failures. Exits retired the actual vista Sprite/Texture/Source and scene scope, cleared painted
ownership and retained the existing one-entry CPU canvas. No native-driver heap claim follows.
The93-file frozen evidence build remains separate from the distributable preview.

## Visual judgment and remaining work

Root inspected actual phone and desktop captures. The desktop now presents a clear rich dune
landscape; phone shows both moons and all horizontal detail without the old globe or upper-control
occlusion. The phone remains a contained band with substantial starfield space above and below.
This fixes the observed overlap; it is not a finished immersive biome composition or human art
acceptance. Native fixed Chromium is not physical iPhone/Safari, PWA, resize/re-entry or thermal
qualification. [Phone image](native-phone-receipt/mars-composition-phone.png),
[desktop image](native-desktop/mars-composition-desktop.png).

End this bounded Mars layout pass. Next pursue one complete canonical creature or inhabited scene
with distinct background/resident layers, grounded scale, consistent light and supported motion.
Do not replace Earth's inhabited bitmap with an empty background or substitute fantasy anatomy.
All-family battles, continuous planet rotation, richer universe/UI coverage and physical-device
acceptance remain future work. Preserve all prior source/certificate/navigation reds.

## Package and recovery

[Package](preview-package.json) and [native boot/Skip/Guide check](preview-browser-check.json) PASS.
Server PID63914 / exec26352; source parent837db4a, dirty-local-only/publishable:false.
Content SHA256 a740b005c7c054b22e5d3ab30ead610cbdb39e9f6336443ec3f771d7fa1024c7;
manifest SHA256 8b3c459bcab86afd9d4a352abd70898bdbeb2c81b7d93b9f420b89d6e9e15a40.
No diagnostic API or corner badge ships. [Playtest instructions](../../port/playtests/20260908_PAINTED_MARS_COMPOSITION_LOCAL_PREVIEW.md).
Older local previews retain their own bytes. No remote dev or production publication occurred.

Codex/macOS/openai/mac,38ahead/0behind. Required1Password signing still lacks restoration evidence;
no retry or unsigned commit. Latest intended staged recovery is
port/v2/apps/game/smoke/painted-mars-composition-staged-20260908.json plus its patch.gz; verify the
receipt before claiming it exists. Previous918file and earlier snapshots remain immutable.
Claude/macOS/anthropic/mac need not open/sync now; no GitHub/PR action. After future separately
exact-authorized openai/mac→develop integration, Claude fetches/merges origin/develop into its
own clean branch. Budget UNFROZEN/PUBLIC, private fallback3000, hosted attempts0. No release.
The campaign still ends2026-09-09T03:11:15Z, with Claude review ThursdaySeptember10.
