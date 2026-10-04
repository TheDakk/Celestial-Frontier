# Magnetar magnetic-field restoration — September 8, 2026

V2's live system renderer previously used the same beams/core for MAG and NS and explicitly
recorded the missing field arcs. This batch restores the canonical original-game geometry:
two static blue (#96c8ff) ellipses with radii 24×10, rotations ±0.5 radians, stroke width 1.2
and alpha .45, after beams and before core. `system-star-field.ts` owns the MAG-only container;
normal `clearWorld()` recursively destroys its Graphics contexts. Reduced Motion and Effects
Off retain this static class identity. No new textures, timers, randomness, save or gameplay
changes. Other stellar classes remain unchanged. This is a bounded restoration, not a new
whole-universe art pass or human visual acceptance.

## Verification and retained failures

Browser-free verification PASS: 329 files / 3,646 tests / one skip, all three TypeScript
programs, art/override/spec checks. Root validation PASS: 1,010 rendered species and 50
unchanged deterministic fingerprints. The corrected native diagnostic passes on
Edge152.0.4191.66/CDP1.3 at390×844@2 and1440×1000@1. Three screenshots were inspected.
Native Survey→Enter, Reduced/Effects Off retention and scene-exit destruction pass; NS/Sol
absence controls pass. Hiding only the field changes44,882 pixel channels at a fixed780×1688
frame; restoring it returns every pixel exactly. No runtime exception or cleanup fault.
`native-owned-array/review.json` owns these scoped results; no full certification is claimed.

- `preparation.json`: draft-text digest, evidence build and producer metadata refresh passed;
  controller then used `tools/check-profile.mjs` from the repository root and failed with
  MODULE_NOT_FOUND before any tests. Correct path is `port/v2/tools/check-profile.mjs`.
- `develop-profile-corrected.json`: actual tests passed (329 files, 3,646 tests, one skip),
  then strict root TypeScript rejected Pixi's known WebGPU/DOM declaration collision. The new
  actual-Pixi test was in the domain test folder and pulled browser declarations into that
  owner. This was a test-placement fault, not a graphics runtime failure.
- `initial-root-owner/`: retains the original failing test and configuration hashes. Moving
  those exact assertions to `apps/game/src/system-star-field.test.ts` (changing only the
  relative import) puts them beside the existing actual-Pixi tests under the existing app
  TypeScript owner. No compiler configuration, dependency, suppression or assertion changed.
- `develop-profile-app-owner.json`: successor full browser-free develop profile.

The ordered development draft still contains 83 bullets; current digest is
694c39470f8083f803d9c249c333559979ac10e71f239e6bf2af0a1ed65348ac.
Current producer is 391472b65dd3063edc71f23111a1b1eb2aea6e0947aa2900fbdff2dcd8436ce5.
Measurement 4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12,
ruler and numeric ceilings are unchanged. Prior producer/certificate history is retained;
this metadata refresh is not a fresh Compendium certificate.

## Native diagnostic boundary

The isolated evidence build uses source-proven home-galaxy fixtures from
`port/v2/tests/arc9-survey-action.test.ts`: MAG seed 2563295997 at
(-718.0755883874372, -258.9377444498241), NS seed 729068929 at
(-736.7237938377075, 61.177555879577994), and Sol seed 424242 at (560, 170),
all in galaxy seed 999 at (90, -60). Canonical veteran fixture preparation sets Ascent 2
and the owned Long-Range Array for ordinary home-galaxy access, using the existing
evidence import boundary. Chapter 2 alone does not grant stage 2. It does
not alter personal saves or invent a stellar kind. Real mouse input owns the checked
Survey/Enter path. Browser rendering and field visibility/cleanup checks are scoped
presentation diagnostics, not native Compendium/Slice/Glass certification or device UAT.

The first native attempt (`native-first/`) correctly booted the isolated imported save at
universe: the fixture lacked the Array, so normal travel authority rejected its MAG route.
No runtime exception or cleanup fault occurred. `native-first/runner.mjs` preserves that exact
runner. The successor adds only the source-defined owned Array to test setup; source inspection
also corrected its expected CF1 coordinates to the address owner's hundredth-unit normalization
before rerunning. Raw fixture coordinates, canonical coordinates and authority source hashes are
recorded. No game gate was bypassed or changed, and the first red remains red.

## Checkpoint and next review

Source parent remains signed 837db4aaa0ef5d3d8bffc79c70f62dcc2503032d on openai/mac,
38 commits ahead of origin/openai/mac. This batch extends the existing local staged work.
Its final exact-index recovery receipt is recorded in ROADMAP.md; the earlier 265-file Wolf
and 146-file playable snapshots remain unchanged. Signing is still blocked by the retained
1Password failure; no unsigned fallback or unchanged signing retry was attempted.
The older local playable package stays immutable and does not contain this MAG restoration.
No dev website, develop/main branch, release identity or hosted workflow changed.

Claude can review the small helper/integration, static geometry tests, actual native evidence
and all retained first failures. Broader stellar art, eight creature-family goals, Wolf visual
acceptance/runtime integration, U2–U4, physical iPhone/Safari/PWA and matched audio listening
remain open. The separate Wolf iCloud payload is still approval-pending; no cloud copy started.
