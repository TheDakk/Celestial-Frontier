# Batch A — portable replay checkpoint, 2026-09-05

**Partial: ship replay passes; audio replay remains unproved.** This checkpoint follows verified
primary iCloud backup `629e0cceeb4df474ab2a7c8f9da21085c368aead`. It does not close all portable replay prerequisites.

A fresh derivative bundle was copied to a new directory. Exactly seven derivative files changed;
all37 immutable source inputs remain unchanged. The private work/index preserves the patches and
outputs; full personal paths and application configuration are excluded from public evidence.

## Path preparation

Four Blender recipes use required CF_AV_BUNDLE_ROOT paths for ship or Lanternback outputs, with
no old-path fallback. The relative ecosystem.py import remains intact. Authoring/refinement saves
remain beside the derivative __file__, so only derivative scripts may execute. Four AST checks
pass; Lanternback was not rerendered.

Lua uses CF_AV_BUNDLE_ROOT/audio and a separately declared CF_REAPER_CONFIG_ROOT. The saved RPP's
single render path was rebound to the fresh working directory; all other RPP bytes, embedded
MIDI and Surge instrument/effect state are unchanged. RPP does not expand environment variables,
so a later relocation must rebind that field before launch. The historical Lua had raw format
strings that did not match the final RPP; its derivative now uses the preserved RPP's exact
base64 WAV/FLAC sink strings. No synth patch or mix parameter changed.

The audio browser verifier uses the explicit bundle root plus CF_BROWSER_CDP_MODULE for the
existing launcher dependency; JavaScript syntax passes. This declares the external tool dependency
rather than copying it or rerunning browser readiness. The Python waveform verifier already uses
its own directory. Historical WAV/FLAC files were moved within the derivative to historical-output;
new outputs started empty. The original readiness.log remains historical, not fresh save/reopen proof.

## Ship result

One derivative scene save (2.831s) and one separate-process frame render (5.111s) passed. At
2026-09-05T22:58:40.887634+00:00, the stored PNG hash was
`012be5bb149729a9456ba915f06a659a6609b0718eda4dd85349740a4b4497f5` and replay hash was
`ad5bedc79f15e214442c0c6380247644c9aca895ecc57b005ece668bbb5567c6`.
PNG file bytes differ, but image header and decoded scanlines are identical:
`3675d7b1c5b6aea4cd378532ccafe5a3745054890c58dd87a4c901be0db726c9`.
Only File, Date, RenderTime and two Cycles timing text chunks differ. This is metadata variation,
not a different image. The proof covers relocated ship-terminal replay, not every asset or machine.

## Audio result and remaining blocker

One REAPER -newinst/-nosplash/-cfgfile/-renderproject launch used a fresh configuration containing
only [REAPER] and the derivative RPP. The45.02s process wait expired with no WAV/FLAC output.
The startup log contains only Metal context creation. On a later process check, the dedicated PID
was absent; no exit code was retained and the output directory was still empty. No duplicate
render was launched. The exact cause is unknown; an evaluation/first-run/device/plugin dialog
cannot be claimed without observation. Computer Use permission was unavailable, and Nick has
been asked what the dedicated instance displayed. Do not claim plugin-load, audio replay,
waveform, output-hash or listening acceptance from this attempt.

The private derivative work is preserved separately without the generated .runtime factory
resources/config/registration. Next: resolve the observed startup/render blocker with native UI
access or Nick's input, complete one audio render, and compare WAV/FLAC outputs with the retained
masters, reporting exact hashes or supported synthesis nondeterminism. The source-backup
prerequisite remains CLOSED; portable audio remains OPEN.

## Boundaries and paired handoff

No B–D production work was started; its requested input-status table follows in its own checkpoint.
Codex records/pushes only openai/mac documentation; immutable original and cloud backup bytes are
unchanged. Claude's anthropic/mac c860f57/unmerged173c806 remains untouched; no need to open Claude.
Nick's artlock CI lane, ITP save protection and DECISIONS row19 wording remain open. Budget
UNFROZEN/PUBLIC, private fallback3,000; no hosted authority, PR, label, merge, purchase, release,
Phase2, protected-portrait/artlock-reference, workflow or Actions-policy edit.
