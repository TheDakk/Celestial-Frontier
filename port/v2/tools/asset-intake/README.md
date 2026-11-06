# Asset intake and offline export tools

Matches code as of 2026-09-15. Inspection is read-only; audio export writes a new directory
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
arena wiring as pending. Other source sets use the separate adapter below; fur-source naming remains unspecified. C3 is not complete until the actual sources and all required evidence exist.

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

## Offline voice and source-set Opus export

`node port/v2/tools/asset-intake/export-audio.mjs MANIFEST.json NEW_OUTPUT_DIRECTORY`

Accepts the voice manifest above or the ability/battle/bed source-set manifest below. Requires the approved FFmpeg/libopus and ffprobe tools.
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
rule. Generic ability/battle cues without an explicit duration ceiling use mono 64 kb/s
and the unchanged under-30,000-byte budget. No duration is invented or shortened to fit.
Beds use constrained VBR. ffprobe consumes the entire packet stream; the decoder separately
verifies exact frames. Weather export refuses without an approved technical profile.
No actual source production, listening qualification, fur export, music or runtime wiring is complete.

Bed export calls `renderDeclaredLoop`: use the declared source interval, overlap its tail/head
with convex smoothstep, then rotate the cyclic buffer by a uint32-seeded phase. No clock,
normalization or source rewrite. N selected frames with F overlap produce N-F frames; the
24-second output floor still applies. At least two overlap frames are required for rendering.
The receipt binds the source and sidecar, phase, overlap, exact output frames and method.
`exportSoundSet(..., {seed})` supplies an explicit seed; the CLI defaults to zero. Original
bed true peak is checked independently of the rendered derivative and encoded output.


Real codec tests use private synthetic fixtures and exercise intersample clipping, repeat
byte equality, source protection and manifest drift. They explicitly skip only when FFmpeg
or ffprobe is absent; a present but broken codec fails. No source or listening acceptance
is inferred. C3 recording, rights review, mix targets, derived voices and arena playback remain.

## Theme, battle and first bed/weather source intake

`node port/v2/tools/asset-intake/inspect.mjs sound-set MANIFEST.json`

Schema `cf.sound-source-intake/v1`, `kind`, optional `key`, and `masters` rows with the same
hash/dry/rights fields as voice intake. `ability` uses one of the eleven CONTRACTS theme keys and
exact `<theme>.launch.wav`, `.travel.wav`, `.impact.wav` names; `battle` has no key and requires
all sixteen CONTRACTS names. `bed` currently admits key `temperate`, `bed.temperate.wav`, stereo;
`weather` admits key `rain`, `weather.rain.wav`, with explicit row `channels: 1 | 2`.
These bounded first-source keys do not add game or kit classes. Ability and battle PCM is mono.

Bed/weather rows require hash-bound `loop: {path, sha256}` JSON. Schema `cf.audio-loop/v1` declares
`sourceSha256`, `sampleRate: 48000`, `channels`, `startFrame`, exclusive `endFrame`, and positive
`crossfadeFrames` below half the loop. All are checked against the actual PCM. Per-channel raw
boundary and adjacent sample steps are reported without changing PCM. The separate exporter renders
the declared crossfade; neither declares a clean loop without listening.
Bed source and selected loop are 24–40 seconds. Ability impact and battle cursor/confirm/cancel/
hitstop-thump enforce under 600 ms; other unspecified duration limits are not invented. All sources
require dry, non-silent 48 kHz/24-bit PCM and sample headroom. Rights are declarations pending review.
Fur-source naming, actual recordings, source rights/listening, mix and playback remain. The ability,
battle and first-bed export adapter is described above; weather currently has intake only.

## Existing arena triplet intake

`node port/v2/tools/asset-intake/inspect-arena.mjs MANIFEST.json [SOURCE_ROOT]`

Schema `cf.arena-intake/v1`: bound `recipe: {path, sha256}`, ordered `layers` with roles `far`,
`mid`, `near` and bound `source` / `runtime` pairs. The existing `cf.arena.authoring-proof/v1`
recipe must bind the full compiler-emitted system card, a closed seeded battle context, one canvas,
one normalized ground line, and the original role/hash declarations. FAR must remain opaque and
pixel-identical to its source. MID/NEAR must be distinct copies with transparent and visible pixels.
The tool never types cards, keys paint, extracts masks, changes bytes or assigns quality acceptance.
It checks declared source/runtime hashes, not keyer lineage or whether a copy depicts the same scene;
those evidence and edge/style reviews remain separate. See the accepted Earth readback and negative
controls in audits/CROSS_PACKAGE_PROGRESS_20260914. This is not a live arena replay qualification.


September 15 PCM intake: REAPER integer WAVE_FORMAT_EXTENSIBLE masters are accepted only with
the exact PCM subtype GUID, 24 valid bits, and the matching mono/stereo channel layout. Float
GUIDs, truncated extensions and wrong valid-bit/layout declarations remain refused. Generated
RIFF files pad odd PCM data lengths while excluding that pad byte from the data chunk length;
the old unpadded odd-mono output is retained as a failing control in audio-loop.test.mjs.
