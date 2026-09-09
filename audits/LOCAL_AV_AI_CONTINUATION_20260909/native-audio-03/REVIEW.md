# Native audio waveform evidence review

**PASS for recorded-source integrity and the bounded mixer waveform claim.** Reviewed 2026-09-09T05:59:46.782041+00:00
by OpenAI/Codex on macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`.
This is an independent read of existing files and PCM, not another execution of the harness.
Only this review was written; frozen harness/product sources and earlier evidence were unchanged.

## Exact evidence identity

| Receipt | Bytes | SHA256 |
| --- | ---: | --- |
| [Native review](native/review.json) | 71,314 | `3b4b2a4ce36068017ce6e196c804310002d29ebac05c506b7ff67d08b5eac4d8` |
| [Build manifest](build/manifest.json) | 12,499 | `e72174ea8d3d4b2d74488e264a89363fd125a2476484434a1a34510427432fd4` |
| [Chain receipt](chain.json) | 2,852 | `5d646397753f576d6eeb4b180d278e32ae141935964eb86519181ffee351b982` |

The current [prepared primary-source manifest](../../../../port/v2/tools/audio-native-mix/source-manifest.json)
is SHA256 `ea48d5783759ce891a8bd717515b20a22af9e6303a700a1aff0c966b371b046a`.
Its prepared status is historical; the separate chain/native receipts above establish this attempt.

Python `hashlib.sha256`, exact byte lengths and `struct.unpack('<19200f', bytes)` were used for
read-only verification. All **65 build source records** match current files (858,354 source bytes);
the native report's source array exactly equals the build array. All **20 primary-source records**
also match; 19 overlap the build inventory, while `tools/workspacelock.mjs` is separately bound by
the prepared manifest (66 unique source paths across both). No missing, duplicate or additional
build/PCM file was found. The 3 built files below match; the build directory contains only these
and its manifest. No virtual modules or build warnings are recorded.

| Built file | Bytes | SHA256 |
| --- | ---: | --- |
| [bundle.js](build/bundle.js) | 267,561 | `a83b695598fcf127e79d6b3a6604e6fd1eea1dc1c851673d15ddef2bb28b79a2` |
| [bundle.js.map](build/bundle.js.map) | 662,447 | `c751302eec93b0bfe3ee11669a5953ff5e93bfeb0de55d77ebf4c0c7603cdb48` |
| [index.html](build/index.html) | 796 | `00d8223784b19b973b4daf1fdf029e82b8ab2b52895baa92e6bba1e8fafa7df2` |

The chain records six PASS stages: three syntax checks, strict harness TypeScript, isolated
Rolldown build and one native run. Native provenance is Microsoft Edge `152.0.4191.66`, CDP `1.3`,
revision `@cc2931e6363af1d70882ad63ee33b0e8cd524de0`; zero uncaught exceptions are recorded.
Browser/server closure and checkout-lease release are recorded true.

## PCM outcomes

There are **6 cases, 18 planar Float32 little-endian files, 345,600 finite samples, 1,382,400 bytes**.
Each channel contains 19,200 frames at 48,000 Hz (400ms), exactly 76,800 bytes. Channel 0 is the
music category tap, channel 1 ambience, channel 2 the complete limited mix. Every case artifact
record equals its top-level native inventory record. Hashes and shape were verified independently.
The actual tap values below were decoded again from raw files and divided by calibration level
0.02; they are instantaneous gains, not the runtime's target diagnostics.

| Case | Expected/recorded verdict | Independent raw PCM observation |
| --- | --- | --- |
| 1: overlap | Accepted | Music/ambience halfway through attack ≈0.700000/0.525000; music stays ≈0.600000 after first owner stops; halfway through release ≈0.700000/0.525000; final gains ≈0.800000/0.600000. |
| 2: interrupted recovery + saved volume/zero | Accepted | Music during interrupted recovery ≈0.626667; after category zero it is exactly 0 through the checked tail, including after final combat owner stops; ambience recovers to ≈0.600000. |
| 3: neutral combat mix | Rejected | Attack midpoint remains ≈0.800000/0.600000; no required duck. |
| 4: immediate gain jumps | Rejected | Attack midpoint is already ≈0.600000/0.450000; release midpoint already ≈0.800000/0.600000, contradicting smooth interpolation. |
| 5: restore while second owner remains | Rejected | After first stop, music/ambience become ≈0.800000/0.600000 instead of retained ≈0.600000/0.450000. |
| 6: unchanged overlap restored | Accepted | Same category-tap bytes as case 1, including attack, overlap and release. |

The source-bound acceptor additionally samples ten attack points and nine release interiors,
interrupted-ramp hold/reversal, saved music gain 0.4 producing ducked target 0.3, and immediate zero.
It reads PCM and actual operation times, not production automation/transition state or the fault
label. The same acceptor rejects all three faults. Native suspend times are explicitly observed:
overlap operations occur at 40, 56, 80 and 112ms, so the result does not pretend requested 55/110ms
checkpoints escaped native render-quantum rounding. Required 25ms attack and 90ms release remain
measured against those observed times. Two canonical combat owners give the expected overlap owner
sequence `2,3,4,3,2,2,0`, with the two calibration owners included; interruption gives
`2,3,2,3,3,3,2,2,0`.

All six records show zero remaining runtime voices, mix owners, tracked nodes, connections,
completion handlers and faults after disposal, with every tracked node disconnected. Each creates
28 runtime nodes over its lifetime plus exactly two observer nodes; peak runtime nodes are 28 for
overlap and 24 for interruption. The adapter closes logically exactly once. The final 500 full-mix
samples are exactly zero in every retained case.

## Claim limits and review cautions

- This proves native **OfflineAudioContext category-gain waveforms** through the production runtime
  and canonical registered combat requests at one fixed duel fixture. The scheduling adapter reports
  logical running state during observer suspensions, substitutes logical resume/close and suppresses
  watchdog scheduling. All DSP nodes/parameters/time remain native, but this does not qualify real-time
  activation, physical context closure, natural `onended`, watchdog timing, tab hide or panic/mute
  waveforms. The directly measured immediate-zero action is `setCategoryGain('music', 0)`.
- Category taps precede the master/output chain. The full-mix nonempty check includes calibration
  signals and would not independently reject silent combat synthesis. Actual canonical voice admission
  and node ownership are observed, but do not relabel this as an isolated combat-audibility test.
- Restoration demonstrates the gain envelope, not bit-identical whole rendered audio. Cases 1 and 6
  have byte-identical music/ambience tap files, while their full-mix files differ in 922 samples by at
  most `2.9802322387695312e-8`. No cross-browser/device PCM determinism claim follows.
- The cleanup receipt combines production counters with wrapped native connect/disconnect observations.
  It is not a heap/GC retention or physical-device resource measurement. No user listening, natural
  music/ambience content, perceived click/pumping comfort, headphones, phone speakers, physical
  iPhone/Safari/PWA, heat/battery, long-session or whole-game admission was exercised. HUMAN audio
  acceptance and existing device/certification blockers remain open.
- The authoring README's “not built or run by the authoring agent” statement remains literally true;
  this root-owned chain subsequently passed. Do not interpret the prepared manifest/README as the
  latest execution receipt or edit their source-bound bytes to update them inside this proof.

First failures remain immutable: [01 TS2322](../native-audio-01/) and
[02 builder syntax](../native-audio-02/). This successful successor does not erase those reds.

## Exact PCM inventory

Every row is 76,800 bytes; each SHA256 was rehashed from the file.

| PCM file | SHA256 |
| --- | --- |
| [case-1-overlap-none-channel-0.f32le](native/case-1-overlap-none-channel-0.f32le) | `4ecfebcd3f8b19cceed95c5b227403fc5487c51f21ce083d755641591836ed6b` |
| [case-1-overlap-none-channel-1.f32le](native/case-1-overlap-none-channel-1.f32le) | `3d52872a91035172334927c55ea82a75557d7d8fd831b3eb1dd048cca5080382` |
| [case-1-overlap-none-channel-2.f32le](native/case-1-overlap-none-channel-2.f32le) | `79e49cae2cdf9a59ad75337e18e9a41b27ecac12a2e182a55acd4e5ee04bcbeb` |
| [case-2-interruption-none-channel-0.f32le](native/case-2-interruption-none-channel-0.f32le) | `21710f47ef940c18f70af49bf224b329ea61d387a926d68224de3434f08df12d` |
| [case-2-interruption-none-channel-1.f32le](native/case-2-interruption-none-channel-1.f32le) | `1f34ebbdaf27d35f24399f703088619c888951607f5273bdc310a973a901bd9f` |
| [case-2-interruption-none-channel-2.f32le](native/case-2-interruption-none-channel-2.f32le) | `8e752a1046afd7ff4d37173f63bdd084729931527f918d5c8c1692a0fcd23f80` |
| [case-3-overlap-neutral-channel-0.f32le](native/case-3-overlap-neutral-channel-0.f32le) | `fb8934d5b24d9ed28f5408b00d4e3405331246b59b96983ffe28b5947c9f3854` |
| [case-3-overlap-neutral-channel-1.f32le](native/case-3-overlap-neutral-channel-1.f32le) | `e4d750e4089143e3b0cade5187e94f8bb5a7bb4d8cdfdd5ea8b2356d6f5c9525` |
| [case-3-overlap-neutral-channel-2.f32le](native/case-3-overlap-neutral-channel-2.f32le) | `bfa9aba003277c0764e78ab4b448f36ef4269f4b436ea3cc058b8fa69af60dbb` |
| [case-4-overlap-immediate-channel-0.f32le](native/case-4-overlap-immediate-channel-0.f32le) | `ef56c716a813eade568a5b5e7ad8dca7e7ba6e411e17cb324b09988ae0cd9aa1` |
| [case-4-overlap-immediate-channel-1.f32le](native/case-4-overlap-immediate-channel-1.f32le) | `7447861002fc5665aa433d39082238935e2f9e61ff974142c3f52eda190e472c` |
| [case-4-overlap-immediate-channel-2.f32le](native/case-4-overlap-immediate-channel-2.f32le) | `4a4ba8d639aa2061cb161542ae96d888bfe237a98bc9b4bdb2add7fff124eaaa` |
| [case-5-overlap-early-restore-channel-0.f32le](native/case-5-overlap-early-restore-channel-0.f32le) | `6e225ee9b423ff04c7a3e77fac12fbf2de13c88235553f3440fc87cb2a5001a1` |
| [case-5-overlap-early-restore-channel-1.f32le](native/case-5-overlap-early-restore-channel-1.f32le) | `1f8cd6d613779d0912ecbcbf93df03d5c60c3c73d6cf4ddc4258f555168a32d2` |
| [case-5-overlap-early-restore-channel-2.f32le](native/case-5-overlap-early-restore-channel-2.f32le) | `1f4efb2f9a3400cad7334b2cc94abe592b7d32e05292d009c7864d78b08c3cbc` |
| [case-6-overlap-none-channel-0.f32le](native/case-6-overlap-none-channel-0.f32le) | `4ecfebcd3f8b19cceed95c5b227403fc5487c51f21ce083d755641591836ed6b` |
| [case-6-overlap-none-channel-1.f32le](native/case-6-overlap-none-channel-1.f32le) | `3d52872a91035172334927c55ea82a75557d7d8fd831b3eb1dd048cca5080382` |
| [case-6-overlap-none-channel-2.f32le](native/case-6-overlap-none-channel-2.f32le) | `63e13f6e89be60f1cf1f61e0265112561b96ba2cc79af411c46a772e2481a60e` |
