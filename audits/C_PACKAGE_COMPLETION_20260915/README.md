# C-package continuation — September 15, 2026

The target remains fluid full-body creatures acting in biome arenas, including procedural
and named life. A painted pose is the rest reference; it must not constrain the creature to
that one pose. This batch implements action playback, in-view aiming and non-voice audio
export. It does not qualify full C2 animation or complete C3/C4 with infrastructure alone.

Base b95c4dc0 is signed (115 ahead upstream / 226 ahead cached origin/develop); it commits
the previously staged September 14 intake and evidence. The signing failure is historical.
OpenAI/Codex, macOS, /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac is the
verified worktree identity. No main.ts hunk, kit edit, Claude-owned path, image generation,
inference, real audio recording/download or GitHub/history operation in this batch.

## Implemented and verified

- C2 `creature-rig-performance.ts`: complete record-named action frames; explicit-time
  transitions sampled at the command time; sparse-joint reset; one atomic rig update;
  root displacement is not broadcast. No per-creature curves or frame-rate-dependent
  transition snapshot. 30/60/120 Hz controls produce the same sample.
- C2 `creature-rig-aim.ts`: actual source-bound gaze points, joint ancestry and rotation
  limits drive in-view aim; root/limb/appendage motion is preserved. Unavailable yaw requests
  another view. Targets beyond chain reach request a body turn. This is not a renderer of
  unseen anatomy. Malformed records and input angles outside limits refuse.
- `actual-producer-04/report.json`: all nine actual Civet/fox/procedural idle/melee/hit
  action comparisons match the direct read-only GSAP producer, root-only offsets retained.
  Output-changing controls fail; one pose publishes per sample. The producer SHA remains
  6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74.
- C3 deterministic loop rendering: declared sample interval, convex tail/head overlap,
  seeded cyclic phase, protected original bytes. Output loses exactly one overlap length;
  a too-short bed refuses rather than silently padding. Sidecar and recipe hashes recorded.
- C3 theme/battle/bed source-set export: canonical inventories, dry 48 kHz/24-bit masters,
  source and Opus true peak, exact decoded frame count, budgets, atomic new output and
  final source revalidation. Stereo beds use constrained VBR; full-packet ffprobe avoids
  an early-reader EPIPE. Weather export has no agreed profile and remains explicitly refused.

[Checks](checks.json): 52 Node tool tests, 373 Vitest files / 4357 passed plus one skipped,
typecheck and root validation/fingerprint pass. Codec tests actually ran, with no codec skip.
Synthetic audio fixtures are not sources or listening deliverables. Native graphics and phone
performance were not rerun. The old C2 native gate remains bound to 61512b3a.

## Instrument and defect history retained

`actual-producer-01` and `02` failed a pure mathematical-sampler comparison at 1e-8 because
GSAP rounds coefficients to six decimals. The consumer exactly matches the actual producer;
03 tests that identity at 1e-12 and separately reports pure-sampler drift. No motion curve or
rig acceptance threshold changed. These are instrument corrections, not a visual improvement.
04 additionally runs changed-head and missing-root mutants through the exact comparison
function, refuses empty action observations, and binds the probe source itself.

The first aim solver treated the eye as the joint pivot and overshot a near target. It now
includes the eye's movement around the actual joint. A separate negative control then showed
out-of-bounds input could bypass checks on the unavailable-view path; input limits now fail
before a view decision. Both failed observations and the green final suite are retained.

The stereo-bed regression first exposed unrestricted VBR exceeding the unchanged byte budget,
then ffprobe exiting before stdin was consumed. Constrained VBR and complete packet consumption
fix those failures; original peak and exact decoded frames still independently gate export.
No failed control or old shape evidence was deleted.

## Media and decisions

Nick has no original/commissioned recordings. [SOUND_SOURCE_PROPOSAL.md](SOUND_SOURCE_PROPOSAL.md)
contains one exact frozen Sound Kit section 1 rights-sentence proposal and three verified
source-page candidates. No kit change or source adoption until Nick approves. Actual original
files, listening, cue coverage, rights evidence and compiler-derived voices are still required.

The three C2 proof records lack painted gaze geometry and alternate-view coverage. Whole posed
images still show hard cuts and stretched paint. New math does not repair that skin or provide
hidden head/body surfaces. See [UPDATED_PLAN.md](UPDATED_PLAN.md) and the single
[REVIEW_PROMPT.md](REVIEW_PROMPT.md) for the remaining work and consolidated review.

## Toolchain

The fresh-session check was done under the shared maintenance lock with active-process checks.
REAPER 7.79 advanced to 7.80; Homebrew metadata refresh advanced Homebrew to 7.0.1. No runtime,
test or sealed input pin changed; no running asset job was interrupted. Tool check and capability
verification receipts are retained here. GUI-free REAPER rendering remains unqualified.

## Final local commit attempt

The new batch's configured signed commit was rejected by 1Password: “agent returned an
error.” Latest signed head remains b95c4dc0 (115 ahead upstream, 226 ahead cached develop,
zero behind both). Code, tests and this packet are staged. Recent process-scoped system
logs did not identify the cause; do not claim the vault was locked or repeat the old
Secure Enclave diagnosis as a finding for this attempt. Nick was asked to approve any
pending Git-signing request. No unsigned fallback or signer/security changes. See
signing-attempt.json. Raw test logs are retained byte-for-byte; their whitespace warnings
are evidence formatting, not source errors.
