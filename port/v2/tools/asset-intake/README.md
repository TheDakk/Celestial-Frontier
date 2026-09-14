# Asset intake and offline export tools

Matches code as of 2026-09-14. Inspection is read-only; audio export writes a new directory
from supplied masters. Neither changes kit wording, infers quality acceptance, records
a source, keys an image, resizes a master or modifies original bytes.

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

## Review batches

`node port/v2/tools/asset-intake/inspect-batch.mjs BATCH_MANIFEST.json [SOURCE_ROOT]`

Schema `cf.art-review-batch/v1`: `batchId`, hash-bound `plan: {path, sha256}`, and `masters`
rows `{sourceKey, kind, path, sha256}`. The plan is `cf.art-review-plan/v1` with one to twelve
ordered `slots: [{sourceKey, kind}]`. Every slot must be present once and in order; duplicate
paths/images, changed bytes and unsupported size categories refuse. `sourceKey` is an opaque
plan identifier, not a generator taxonomy. The tool does not compile system cards or choose
the approved library order. `SOURCE_ROOT` defaults to the manifest directory; all referenced
paths remain confined to that root. Original PNG dimensions and SHA-256 are reported unchanged.

The continuation audit checks the existing twelve first-batch masters against an inventory
plan. It creates no new sheet or art and neither grants nor revokes their existing acceptance.

## Offline voice Opus export

`node port/v2/tools/asset-intake/export-audio.mjs VOICE_MANIFEST.json NEW_OUTPUT_DIRECTORY`

Uses the same voice manifest above. Requires the approved FFmpeg/libopus and ffprobe tools.
The top-level CLI owns the workspace lock; unit functions never acquire it. Export sorts
filenames, strips metadata and uses bitexact Ogg options with a fixed serial. It re-verifies
source and manifest hashes before writing a new output directory, with `receipt.json` last.
Existing output is refused. WAV masters are never normalized, overwritten or replaced.

The exporter measures source and encoded true peak (both must be at most -1 dBTP), verifies
Opus rate/channels, exact decoded frame count and byte budget. It records tool version,
encoder arguments, recipe/output hashes and integrated LUFS when measurable. Short-term
mix loudness is explicitly pending; integrated LUFS is not a substitute. Codec determinism
is verified on the installed toolchain, not promised across FFmpeg/libopus versions.

The byte exporter exposes creature (mono 64 kb/s, under 2 s / 30,000 bytes), impact/UI
(mono 64 kb/s, under 0.6 s / 30,000 bytes), and bed (stereo 96 kb/s, 24–40 s / under
400,000 bytes) technical profiles. Voice footfalls retain the stricter under-0.3 s intake
rule. Only the voice-set manifest adapter exists; the bed primitive does not complete a
rain-bed source, loop qualification, theme/battle/fur set, music or runtime wiring.

Real codec tests use private synthetic fixtures and exercise intersample clipping, repeat
byte equality, source protection and manifest drift. They explicitly skip only when FFmpeg
or ffprobe is absent; a present but broken codec fails. No source or listening acceptance
is inferred. C3 recording, rights review, mix targets, derived voices and arena playback remain.
