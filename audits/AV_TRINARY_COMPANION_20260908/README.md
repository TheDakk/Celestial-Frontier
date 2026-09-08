# Generated third-star restoration — 2026-09-08

V2 now draws all three generated stars in trinary systems. Previously the generator and Survey
retained the third companion but the system scene rendered only the primary and binary companion.
The sky caption now distinguishes three suns from two. This is a local presentation correction;
world generation, RNG, routes, saves, rewards and creature art are unchanged.

## Implementation and resource ownership

`main.ts` mounts one passive `system-trinary-companion` inside the existing binary branch,
using the final generated radius/color/separation. Diameter is `4.8 * r2`; the existing orbiter
uses phase `t * 0.16 + 2.1`, with `t = 0` under Reduced Motion. Effects Off retains the star;
Effects Off alone does not freeze normal orbits. The third star has no interaction target.

A separate cached 256×256 companion corona uses the canonical white/color/transparent stops
at 0/0.25/1 followed by the existing in-place V2 polish. Primary and binary retain their existing
four-stop paint. The added canvas is 65,536 pixels / 262,144 RGBA bytes for the current fixed
companion color. Existing scene-texture leases and scene teardown own it; no new ticker/cache
owner or protected art relift was added. Granulated close-up surfaces for both companions remain
unimplemented. Black-hole art was inspected and already contains its approved canonical features.

## Verification

[Preparation](preparation.json) PASS on its first complete chain: draft-authority refresh,
evidence build and producer metadata, browser-free develop **331 files / 3,727 tests / 1 skip**,
all three TypeScript programs, art/override/spec checks and root validation. Root rendered
1,010 species with zero boot errors and preserved all 50 deterministic fingerprints. No
measurement ruler, memory ceiling or baseline was changed. No new product edits followed this
successful chain; the native observer correction reused the same source/build.

[Successful scoped native report](native-exact-address/review.json) used isolated
Edge 152.0.4191.66 / CDP 1.3 at 390×844@2 and 1440×1000@1. The source-derived bounded scan visited
32 actual home-galaxy stars to find a triple and a binary; no invented stellar data was injected.
The isolated imported fixture has chapter 2 and one owned Array, so it is not fresh-player
progression proof. Native Search → Enter/Follow committed the exact CF1 for seed 2166531614 at
(-145.99,22.47), cleared Search and published matching navigation/rendered route keys with
settled persistence authority. Trusted input is recorded.

- Actual third Sprite: diameter 30.72, radius 60.8, canvas 256×256. It advanced 0.061456 radians
  over 0.3794 seconds; absolute phase error was -0.000352 radians against the canonical law.
- Native Canvas forwarding traces on the actual TextureSource show the three-stop glow and
  shared V2 grade; primary/binary four-stop paint remains. Reduced Motion holds the expected
  position (-30.6946431597,52.4831294923); Effects Off retains it.
- With only the ticker paused, hiding or detaching only the third Sprite changes 179,245 phone
  and 215,551 desktop **channels**. Restoring visibility/parent/index restores all frame bytes
  exactly. Three original screenshots were inspected; [visual receipt](visual-inspection.json).
- Native scene exit destroys the actual Sprite/Texture/Source, clears its resource, removes
  old scene scope 6, releases 28 leases versus that scope's 24 and disposes 24 textures. The
  continuing galaxy's registry is balanced/coherent with zero external-destroy faults. This
  is finite owner cleanup evidence, not a broad native-heap certificate.
- Actual binary seed 875741432 and Sol 424242 contain no third Sprite and retain correct captions.
  Runtime/cleanup error arrays are empty; temporary native browser/server closed.

The [first native failure](native-first/review.json) remains intact. After native exit, the
crowded-map coordinate click selected nearby seed 2868415165 instead of the intended triple.
Enter correctly entered that other six-planet system, and the exact-seed wait stopped at 20s.
[Observer correction](EXACT_ENTRY_CORRECTION.md) uses the existing exact CF1 Search/Follow path.
The successful report does **not** claim successful crowded-pointer Survey → Enter. This target
ambiguity is an open interaction finding for Claude, with original runner/capture retained.

## Source identity and review boundary

Parent commit: `837db4aaa0ef5d3d8bffc79c70f62dcc2503032d`; modified local source is not signed or
publishable. Current 83-bullet draft digest:
`8379d041dda1466c843b242e0ab29cf6b38e28f56035df5801d428579bd99ebd`.
Producer: `16c4a7b9f07089dae7e8dc9aae1b6b6fb5378891e54a2ba29aadf15ea4746f60`.
Measurement: `4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12`.
The manifest binds exact sources, current references and all audit evidence. `evidence-dist.json`
records an unchanged ignored copy of the inspected build so future packaging cannot erase it.

Claude's September 10 review should check generated-value fidelity, paint/cache ownership,
reduced-motion behavior, exact native entry scope and the retained nearby-target finding.
Candidate next graphics increment: restore the original seeded close-up surfaces for binary and
third companions, using legacy seed XOR 0xB1/0xC2 respectively and the original zoom gate. This
is a proposed bounded follow-up, not completed work. No anatomical rig, biome walking, physical
iPhone/Safari/PWA, human art/listening acceptance or current Compendium/Slice/Glass is claimed.
Earlier U2 verification failures and SceneMemory quarantine remain unchanged.

## Local checkpoint and paired handoff

OpenAI/Codex × macOS × `/Users/nick/Projects/celestial-frontier-openai-mac` × `openai/mac`, tracking
`origin/openai/mac`; 38 ahead / 0 behind at the unchanged parent, `origin/develop` ancestor.
The uninterrupted session's TheDakk SSH authentication/read proof and toolchain startup receipt
are reused. SSH origin remains `git@github.com:TheDakk/Celestial-Frontier.git`.

Completed work is staged over the preserved 516-file checkpoint. New exact-index recovery is
`port/v2/apps/game/smoke/trinary-staged-20260908.json` and its adjacent gzip binary patch; retain
all earlier snapshots. Required signing awaits restored 1Password-agent evidence, with no new
retry or unsigned fallback. Private Wolf backup remains separately pending; no cloud operation
was started by this batch. Campaign deadline remains September 9 at 03:11:15 UTC.

Both ordinary previews are preserved: 53304 contains the prior sticky-header/MAG/PROTO/Charter
cue package, and 50689 the earlier landing/battle package. **Neither includes this third-star
increment.** No new package/server or hosted dev update was made this batch.

Codex next: finish signing when the existing external condition is restored, then include this
increment in the next exact-source local preview refresh. GitHub step: none; PR details: not
needed now. Claude/macOS/anthropic/mac need not open/sync now and does not have this unmerged
work; preserve its own unmerged 173c806. After a later authorized openai/mac → develop merge,
Claude fetches/merges origin/develop into its own clean branch; no manual copying. Develop/main,
hosted dev and production are unchanged. Budget UNFROZEN/public, private fallback cap 3,000;
current hosted authority/attempts/cost are zero.
