# Read-only intake tools

Matches code as of 2026-09-13. These tools do not change Art/Motion/Sound Kit wording, infer
quality acceptance, produce sound, key an image, resize a master or edit a source.

`node port/v2/tools/asset-intake/inspect.mjs masters MANIFEST.json`

The manifest uses schema `cf.master-intake/v1` and `masters` rows with `path`, `sha256`, and
`kind` (`cutout` or `plate`, the two runtime size categories). These are intake categories,
not new kit classes. Paths are relative to the manifest, confined after symlink resolution.
CRC-checked PNG decode and delivered dimensions are recorded. Cutouts must be at least
384×384; plates at least 1024×576. Larger masters are admitted unchanged, per kit 4.1.

`node port/v2/tools/asset-intake/inspect.mjs voice MANIFEST.json`

Schema `cf.voice-source-intake/v1`, `archetype` from CONTRACTS §1, and `masters` rows:
`path`, `sha256`, `dry: true`, `rights: {owner, license, source, redistribution: true}`.
Names must be `<archetype>.<cue>.wav` for the eight contract cues, plus four to six consecutive
`<archetype>.footfall-set.<n>.wav` rows, starting at 1. No arbitrary names, placeholders,
extra rows, directory escapes, implicit rights or inferred dry-source permission.

RIFF structure, integer PCM 48kHz/24-bit/mono, nonzero signal, duration and sample headroom
are checked. Sample headroom is only a necessary test, not a true-peak measurement. The
report explicitly retains true peak/loudness, rights review, listening, derivation, Opus and
arena wiring as pending. Stereo beds/theme/battle/fur sets are not implemented by this
voice-set validator. C3 is not complete until the actual sources and all required evidence exist.

`npm run test:tools` from port/v2 exercises corruption, size, naming, silence, clipping,
rights, dry declaration and missing-cue controls using private synthetic fixtures. They are
never source masters. Full batch evidence is in audits/C_LANE_BATCH_REVIEW_20260913.
