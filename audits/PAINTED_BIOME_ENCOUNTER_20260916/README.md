# Three painted creatures in a seeded temperate clearing

Preview: http://127.0.0.1:49816/biome-battle/

Three existing fitted paintings (two genomes) share their existing template, body cards and
motion curves. Choose Clearing 301 or 927. All three take one turn in an 18-second loop.
Scenery scale/offset, edge trees/shrubs, rain coefficients and turn order derive from the
encounter seed, compiled card hash and actor record identities. Simulation time animates
rain/motion; no wall clock enters recipe generation. Earth card/source hashes are in report.
The Earth temperate template is reused; this is not a new AI-painted biome or new master.

## Repairs and controls

- Ground containment previously allowed only .64–.86 of frame, constraining a whole animal
  to 22% height. Ground bodies now rise above the authored .78 floor. Old band rejects the
  40%-height control; invalid/non-finite ground registration refuses.
- Native-01 revealed mirrored attacks selecting the opposite source bounding-box end (tail).
  Contact now uses the published jaw mesh and reflects it exactly once. The old rule fails
  the independent source-mouth test; source-dependent +X orientation is explicit.
- The copied ten-second capture validator rejected an 18.135-second three-turn recording.
  The dedicated validator requires 18–18.75 seconds, full 1600×900 video, >=1,026 encoded
  frames, >=57 measured fps, <2 ms per creature p95, and <16.67 ms whole-frame p95. Short,
  30 Hz and over-budget controls refuse. Native-01 is retained, not relabelled PASS.

## Evidence

native-02/report.json: DIAGNOSTIC_PASS. 3,243 sampled creature frames, maximum source seam gap 0.000129 px,
no body escaping scene, all three exact hitstop freezes, mouth contact and identical recipe
replay. 60.002 fps; creature p95 0.8/1.0/0.9 ms; whole frame p95 3.1 ms. Encoded 18.116357 s,
1,087 frames at 1600×900. ready.png and impact-1/2/3.png visually inspected: mirrored target
contact fixed; effect briefly overlaps the small crystal actor. alternate-clearing.png records
seed927. Full native source hashes are checked unchanged at completion.

Tests: nine Vitest habitat tests, five Node encounter tests, complete TS typecheck, root
validate (50-probe fingerprint identical). tests.json and validation logs record the commands.
Browser review: scene visibly loaded in Codex; clicking Clearing927 changed the composition.

## Scope and next work

This is a silent, scripted animation study. HP/damage are deterministic presentation values,
not CombatCore outcomes. It has no normal-game squad integration or phone qualification.
Existing fitted observations are authored; universal anatomy fitting and unseen views remain
unproven. Source joins and frame bounds are not paw-contact/biological-animation certification.
Ground shadow scale is illustrative; art still needs Nick's judgement. Other biome families
need their own approved template plates. No new inference, painting, effects, kits or originals
changed. This batch does not change main.ts or Claude-owned modules.

Reproduce from the repo root in the approved native-browser environment:
`node tools/with-toolchain-lock.mjs --label painted-clearing-native -- node port/v2/tools/biome-encounter/native-runner.mjs <new-output-directory>`

Use the exact final rigs named in native-runner. A captured standalone native-02/preview can
be served as-is; the server must bind loopback, and no GitHub/deploy action is needed.
