# Local audio production tools

These use the installed REAPER, Surge XT and stock ReaEQ/ReaComp. No purchase,
extra plugin, sample service or API is required. The supplied handoff is now present. Acquisition, source/MIDI production, stems, loops,
and the local game audition are implemented; candidates still require listening review.

## Read the actual game inventory

From the repository root, choose a new report path:

```sh
node port/v2/tools/audio-production/inventory.mjs /private/tmp/cf-audio-game-inventory.json
```

The report imports the current catalogue, traits, biome and combat authorities. It reads
exported event/plan string vocabularies lexically and binds source hashes. It does not assign
recordings or claim species coverage. Existing output refuses. It changes no gameplay.

## Run the full local host qualification

REAPER should have no other audio asset job running. This command holds the shared toolchain
lock for preparation, render and saved-state replay. It opens a dedicated new REAPER instance,
refuses a nonempty project, creates a new directory and preserves all source outputs.
It does not record a microphone, touch personal projects or copy a license key.

```sh
node port/v2/tools/audio-production/qualify-host.mjs /private/tmp/cf-reaper-qualification-local
```

That exact command works with `/Applications/REAPER.app/Contents/MacOS/REAPER` and the
installed Surge XT VST3 instrument. Do not rerun it over existing output; choose a new path.
It saves an editable MIDI project, full synth/stock-effect track chunk and parameter list,
then opens the saved project twice for actual offline rendering. The script explicitly sets
all six observed oscillator Retrigger parameters on and both Drift parameters to zero.
It uses observed parameter names and verifies writes; it does not guess parameter indices.
These settings qualify only this diagnostic and are not automatic edits to production patches.

Success is qualification.json status PASS with three zero-exit stages, actual 48 kHz/24-bit
stereo WAVs, exactly 144,000 frames, identical decoded PCM, unchanged sources and rejection
of a changed-sample control. WAV container metadata can differ; encoded-byte identity is not
claimed. A zero exit without audio files/measurements is insufficient. The quiet three-note
signal is not a game voice or finished music; no listening or species acceptance follows.

If a local dialog prevents completion, preserve the output/logs and resolve the dialog in
that dedicated REAPER instance. The runner stops before the next stage on a failure and
retains its receipt. Never dismiss license terms or edit security settings automatically.
To inspect a successful editable project locally, open `<OUTPUT>/host-qualification.rpp`
in REAPER. Render only a copy with a new output name; originals remain hash-bound evidence.

The Lua entry point is `qualify-reaper.lua`; it expects CF_AUDIO_QUALIFICATION_OUT and an
empty dedicated project. Prefer the runner because it also verifies the actual files and
releases the shared toolchain lock. No external Lua install is needed: REAPER executes Lua.

Verified September 15: REAPER 7.80 / Surge XT 1.3.4; current receipt is
`audits/AUDIO_PRODUCTION_20260915/reaper-qualification-03/qualification.json`.

API references: [REAPER ReaScript](https://www.reaper.fm/sdk/reascript/reascripthelp.html)
and [Surge XT manual](https://surge-synthesizer.github.io/manual-xt/). The save API requires
option 8 to assign the newly saved project filename. Command-line syntax was checked against
the installed REAPER executable's own help text. All state, rendering and replay claims above
are backed by the actual local files, not by those documentation pages alone.

## Acquire and produce the approved candidates

Run from the repository root. Original inputs are in `audio-production/source-audio/` and
`source-archives/`; they are preserved byte-for-byte. These commands use the supplied manifest,
not an open-ended crawler. Python 3.12, ffmpeg and ffprobe are installed already.

```sh
python3 port/v2/tools/audio-production/acquire.py fetch
python3 port/v2/tools/audio-production/acquire.py verify
```

Fetch verifies cached bytes. `--only SOURCE_ID` limits an explicit later acquisition without
removing other sources. Failures remain in acquisition-gaps.json; no account bypass or paid
service is attempted. Do not run `prepare` over accepted recipes: it rebuilds the unapproved
production-v1 recipe and coverage ledger from acquisition and the current game inventory.

```sh
python3 port/v2/tools/audio-production/produce.py prepare
```

Each group is a separate portable REAPER project. Use the shared toolchain lock around the
entire foreground production job (not unit tests). For a group not already rendered:

```sh
node tools/with-toolchain-lock.mjs --label 'Audio source production' -- python3 port/v2/tools/audio-production/produce.py render --group fictional-voices
```

The current 19 groups already have outputs. Existing project directories refuse; do not delete
or overwrite them to force a repeat. Recipe revisions need a new group/output identity and a
new review. `export --group GROUP` is for an existing rendered project whose export has not
started; it refuses existing audio files and is not an automatic partial-export recovery.
Each output receipt records the project, input hashes, master, Opus and measured true peaks.
Source-only and MIDI jobs both save editable RPPs, track state, regions and relative media.

The original music stems are separately rendered instrument tracks; run only when that output
directory does not exist. It already exists in this batch:

```sh
node tools/with-toolchain-lock.mjs --label 'Audio music stems' -- python3 port/v2/tools/audio-production/music-stems.py
```

Loop generation operates on copies and requires a new output name. The successful current pass
is loop-candidates-v2; the first failed pass is retained. No repeat is required:

```sh
node tools/with-toolchain-lock.mjs --label 'Audio loop copies' -- node port/v2/tools/audio-production/loops.mjs NEW-LOWERCASE-OUTPUT-NAME
```

Reconcile reports only after the current source-decode receipt exists. Python 3.12 is required
for REAPER's extensible PCM WAV header. This hashes actual files and never marks listening accepted:

```sh
/opt/homebrew/opt/python@3.12/bin/python3.12 port/v2/tools/audio-production/report.py
```

## Audition and review

```sh
npm --prefix port/v2/apps/game run dev -- --host 127.0.0.1
```

Open Vite's local URL with `?audioReview=1`, enable Master Sound, then choose Sound review.
Master mute/volume apply. Explicit voice previews are independent of automatic creature greetings.
Only one bounded review copy is fetched; Stop and Close cancel playback. All candidates are
unapproved and cannot silently replace accepted game audio. No library is added to the player pack.

`review-probe.mjs NEW_OUTPUT_DIRECTORY` drives an isolated system browser, trusted Play/Stop,
a failing fake-Stop control, narrow layout and representative WAV/Opus decodes. On macOS it
requires approved execution outside the sandbox. It is a dirty-source diagnostic, not admission
or listening review. Current evidence is under audits/AUDIO_PRODUCTION_20260915/native-review-04.

`python3 port/v2/tools/audio-production/package-review.py` makes new review ZIPs, verifies audio
hashes and ZIP CRCs, and refuses existing output. Each ZIP is below 30,000,000 bytes. This batch's
review files are local under audio-production/review-packs/20260915, with a versioned receipt.
They include the review prompt, ledgers, focused master WAVs and the complete candidate Opus set.
Full project media/original archives remain on this Mac; the ZIPs are not a portable backup.


## Coverage continuation (completed locally, outputs preserved)

The additional recipe builders are prepare-coverage.py and prepare-score.py. They refuse an
existing production-v2.json/v3.json. Render with `produce.py render --recipe production-v2.json
--group coverage-fire` (or the named group) inside with-toolchain-lock; existing output refuses.
There are15 coverage-v2 groups plus coverage-score. Do not re-render over the current outputs.
`music-stems.py --group coverage-score` rendered28 separate stems from copies of four actual
instrument tracks. These are distinct from the earlier21 stems. No stereo split was used.

`node port/v2/tools/audio-production/coverage-audit.mjs NEW_REPORT.json` bundles the real compiler
and authorities, verifies the actual three rig records, resolves all486 review scenarios against
the current rendered catalogue and writes audition/plans.json. Existing report output refuses.
The audit keeps exact-fauna source gaps separate from the existing fictional fallback and reports
missing acoustic record fields instead of defaulting to guessed Earth anatomy.

`python3 port/v2/tools/audio-production/package-review.py coverage-20260915` creates the updated
review copies and a named hash receipt, each ZIP below30,000,000 bytes. Existing destination
refuses. Focused WAVs may span multiple ZIPs; complete candidate and loop Opus files follow.
The expanded in-game panel has individual-candidate and Layered sound recipe selectors. Music
transitions use explicit transport; previews do not promote candidates to ordinary game events.


## Fauna and biome continuation (already acquired and rendered)

Supplemental CC0/public-domain sources are in `audio-production/manifests/supplemental-sources.json`;
the supplied manifest is unchanged. `wildlife.py discover` queries the public research-grade CC0
sound catalogue, `wildlife.py acquire` uses the explicit taxon bindings, and `noaa.py` admits only
the inspected recording-owner subset. Each refuses an existing completed intake. `--resume-gaps`
is a bounded explicit continuation, not an automatic retry loop. Current intake is complete for
its selected bindings; do not rerun it to erase the separately listed 477 remaining fauna gaps.

`decode-sources.py` hashes all originals and fully decodes new hashes with FFmpeg. It deliberately
returns failure for the three damaged retained originals. `report.py` requires these exact failures
to be quarantined; any production recipe using their hashes fails. This is not a green full-bank
decode claim. Rights, recording context and listening are additional gates.

`prepare-ecology.py` refuses an existing production-v4 recipe. `ecology-headroom.py` is a one-time
measured attenuation pass and also refuses its existing receipt. Current production-v4.json already
contains those measurements plus portable PCM import declarations. Do not regenerate over it.
The seven successful groups are ecology-environments and ecology-fauna-01-headroom-pcm through
ecology-fauna-06-headroom-pcm. All already exist; two preceding failed group directories remain.

For a genuinely new reviewed recipe/group, the existing command pattern is:

```sh
node tools/with-toolchain-lock.mjs --label 'Audio ecology production' -- /opt/homebrew/opt/python@3.12/bin/python3.12 port/v2/tools/audio-production/produce.py render --recipe NEW-RECIPE.json --group NEW-GROUP
```

Version-4 reference jobs require measured source/hash/duration-bound input headroom. Before REAPER,
FFmpeg creates bounded floating-point 48 kHz WAV copies (not fixed-point clipping), verifies the
codec and hashes prepared-media.json. Full compressed originals stay immutable. The saved project
contains the excerpt for editing, not a false claim to embed the entire wildlife recording.

Current native evidence: audits/AUDIO_FAUNA_BIOMES_20260915/native-01. Current review package command
is `python3 port/v2/tools/audio-production/package-review.py ecology-20260915`; it has already run
and refuses overwrite. Use the existing index rather than creating a duplicate. Tests use Python
unittest without the checkout/toolchain lock; rendering alone takes the asset-tool lock.
