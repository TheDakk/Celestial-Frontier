# Second deterministic weather ladder

Six variants, no model run, same saved raw finisher and masks as accepted E. E stays active.
Review `review-sheet.png` beside full native files; source hashes and controls are in manifest.json.

| ID | New levers |
|---|---|
| S | Soft sky-facing contour sheen |
| V | Darker, higher-contrast wet fur |
| P | Foreground rain crossing plate and organisms |
| SV | Sheen and wet fur |
| SP | Sheen and foreground rain |
| SVP | All three |

Foreground rain uses E's numeric whole-frame sky-pass density, with a separate deterministic
seed; it does not estimate stroke density from the painted sky. No anatomy, masks, alpha or
placement change. The existing grass can overlap low feet as before. The extra pass begins
at 38% frame height and is uniform across the foreground, not clipped around organisms.

Codex visual check: all six species and the Cranberry mat remain identifiable. V/SV/SVP
substantially darken Civet and Platypus; that degree is for Nick to choose. The variants have
not been accepted and none silently changes the compiler. Inspect at native size before a
pick; the montage is a fitted comparison. Generation from v3, kit edits and inference: zero.

Reproduce only to a new directory:
`node tools/with-toolchain-lock.mjs --label weather-details-review -- node tools/local-image-generation/render-weather-details.mjs NEW_DIRECTORY`
