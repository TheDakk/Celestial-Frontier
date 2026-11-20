# Native combat foreground-mix waveform proof

Prepared 2026-09-09. **Not built or run by the authoring agent.** This is an isolated native DSP
check, not game certification or listening approval. Runtime audio, game files and previous evidence
are unchanged by this harness. No model, inference, package installation or external service.

The first root-run chain stopped at strict TypeScript (TS2322); build and browser were not reached.
[Original failure packet](../../../../audits/LOCAL_AV_AI_CONTINUATION_20260909/native-audio-01/)
retains the failed source, prepared manifest and raw logs. The corrected calibration factory uses
one explicit `AudioVoiceGraph` bridge: native `onended` supplies an Event, which the runtime's
zero-argument completion callback ignores. No product type or native callback is changed. Server
and workspace cleanup failures now remain separate receipt fields, preserving any primary error
and still writing terminal failure status.

The second root-run chain passed strict TypeScript, then stopped before bundling on a missing
plugin-object brace in `build.mjs`; no browser was attempted. The
[second failure packet](../../../../audits/LOCAL_AV_AI_CONTINUATION_20260909/native-audio-02/)
retains the exact failed builder, prepared manifest and original chain/raw logs. That unique syntax
error is corrected. The author ran only `node --check` on `build.mjs`, `runner.mjs` and `chain.mjs`: 
all three PASS, with exact command/source hashes and separate raw stdout/stderr in
[syntax-correction.json](../../../../audits/LOCAL_AV_AI_CONTINUATION_20260909/native-audio-02/syntax-correction.json).
No TypeScript, build or browser was rerun by the author. The chain now checks all three scripts
before TypeScript so a cheap syntax failure cannot consume the later stages. Both original reds
remain failures; these syntax receipts do not establish build or native waveform success.

`entry.ts` imports the production runtime, combat renderer and registered cue projection. A single
fixed world/champion/duel supplies two canonical cues, with their exact registered caption tokens;
there is no seed search, fake combat plan, altered genome or copied mixer implementation. A visible
audit caption registry supplies the counterpart receipt. This does not reproduce the game's trusted
Challenge, durable settlement, Chronicle visibility or gesture-activation sequence.

Each fresh native `OfflineAudioContext` renders 400ms at48kHz, three channels. Two small constant
calibration sources enter music/ambience as neutral requests through the actual runtime. Observer
taps capture those real category gain outputs separately from the complete limited combat mix.
The DC signals make gain measurable without impact/noise contamination. They are synthetic measuring
signals, not music content or audible quality examples; nothing plays through physical speakers.

The **transparent scheduling adapter** delegates every node, AudioParam, buffer and currentTime to
the native offline context. It reports logical running state while offline rendering is deliberately
suspended for an operation; resume is a logical no-op and close marks that adapter closed. Native
offline suspend/resume remain the collector's control. OfflineAudioContext has no physical close()
contract, so this is not proof of real-time context resume/close. Runtime disposal still stops,
clears handlers and disconnects the actual native nodes. The collector disconnects its two own
observer nodes separately and lets the finite native render finish. No DSP or gain arithmetic is
implemented by the adapter. The unused watchdog scheduler creates no timer: canonical voices are
explicitly stopped before their existing250ms cleanup allowance could expire.

Two positive scenarios cover:

- Two overlapping canonical combat cues:25ms downward gain,0.75 minimum (not compounded), no restart
  on equal overlap, no early recovery after the first stop,90ms recovery after the final stop.
- Recovery interrupted by a new cue; a changed saved music gain; immediate category zero without
  a later rise; unaffected ambience recovery and exact cleanup.

The observer records actual suspension currentTime to account for native render-quantum rounding.
The same independent PCM acceptor samples dense ramp interiors, targets, recovered and zero tails.
It does not read the production transition map, automation log or injected-fault name. Three native
controls must be rejected: neutral combat intent, a native bus ramp deliberately replaced with an
immediate setter, and deliberate early restoration while another cue remains. The unchanged
positive is rendered once afterward to prove restoration. Full mix must be nonempty/finite;
calibration and observer nodes cannot substitute for combat ownership. Six finite contexts total.
Manual owner stops are explicit: natural `onended` timing and the watchdog remain separately tested.

`review.json` retains browser provenance, exact source/build hashes, operation/ownership timelines,
actual automation calls, every verdict and cleanup. Each channel is a separate immutable `.f32le`
file with SHA256, dimensions and layout. Channel0 is music,1 ambience,2 full limited mix. These are
raw48kHz Float32 samples; no new media encoder is required. Targets in runtime diagnostics are policy
values; the PCM is the actual native instantaneous result. HUMAN comfort/pumping, headphones,
phone speakers, physical iPhone/Safari/PWA, long-session heat/battery and whole-game admission remain open.

## One-attempt commands

Root coordinates with the active browser/AI owner first. Run outside macOS Seatbelt, with the
shared foreground lock. `chain.mjs` holds the checkout build lease across three Node syntax checks,
strict harness TypeScript, one isolated Rolldown build and one native browser run; it stops on first
failure and keeps raw logs.
Choose a fresh packet directory whose parent already exists:

```sh
node tools/with-toolchain-lock.mjs --label native-audio-mix-waveform -- node port/v2/tools/audio-native-mix/chain.mjs /absolute/new-native-audio-packet
```

The individual entry points, for a root-owned coordinated chain, are:

```sh
node port/v2/node_modules/typescript/bin/tsc -p port/v2/tools/audio-native-mix/tsconfig.json
node port/v2/tools/audio-native-mix/build.mjs /absolute/new-build-directory
node port/v2/tools/audio-native-mix/runner.mjs /absolute/new-build-directory /absolute/new-evidence-directory
```

The builder uses the installed Rolldown API, not the root game's Vite/PWA build. It captures all
resolved filesystem modules and rejects externals; the browser serves only that immutable inventory.
`source-manifest.json` is the prepared primary-source inventory, not a build or native PASS. The
build's own manifest expands it to actual resolved dependencies. Do not edit source-bound harness,
README or runtime files between build and native run. Preserve every first red; no automatic rerun.
