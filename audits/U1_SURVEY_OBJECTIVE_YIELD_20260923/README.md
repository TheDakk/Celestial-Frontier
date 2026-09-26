# U1 Survey objective yield — completed local phone proof

Nick's 2026-09-23 task; openai/mac, base f25098fa4202c86cd6db8b6a5ded47c9faf5dc69. Folder uses the task date; the host's exact run timestamps are retained in the reports. No fetch, sync, push, PR or merge. Claude's lane was not modified. Codex holds.

## Final results

| Viewport | Run | Product findings | Instrument failures | Result |
| --- | --- | ---: | ---: | --- |
| small-phone, 320×568 DPR 2 | 20260921202401242-43808-32367f127295 | 0 | 0 | PASS |
| large-phone, 412×915 DPR 3 | 20260921202449160-44013-b89e1b19d18a | 0 | 0 | PASS |

- [Small-phone log](small-phone.log) and [immutable report copy](small-phone.json).
- [Large-phone log](large-phone.log) and [immutable report copy](large-phone.json).
- [Focused tests](focused-tests.log): 7 files, 98 tests pass. [App typecheck](app-typecheck.log): exit 0 (empty successful log). [Instrument controls](instrument-controls.log): 11 pass.
- [Required root validation](validate.log): passes, zero boot errors, 50-probe fingerprint matches.
- [Source hashes and browser provenance](source-manifest.json), [exact implementation diff](implementation.diff), [artifact hashes](SHA256SUMS).

Commands from port/v2: `node tools/glassmatrix.mjs --viewport=small-phone` and `--viewport=large-phone`. Node 26.9.0; native Edge 153.0.4234.48, CDP 1.3. Both reports are targeted diagnostics on the retained working-tree hash, with no source change during either run. They are not a full Slice→Glass certificate or a hosted PR #43 result. The committed implementation bytes are bound by source-manifest.json; no unchanged post-commit browser rerun.

## Product correction

`sheet-layout.ts#createSheetLayoutController` owns portrait Survey objective hiding, observes overlay/size/content changes, and publishes the new AppChrome header height before allocating sheet space. `main.ts` supplies the header/surface measurement callback. `panels.ts` synchronously announces its final layout before focus or focus restoration; generic panels retain the objective opener.

If natural objective text leaves insufficient space for a panel's measured header/edges + 44 px body or the native 72 px biosphere band, its caption ellipsizes. The button, full DOM text, accessible name and touch floor remain. Full wrapping returns when space permits; Survey hides it completely. Natural measurement preserves sheet and Compendium scroll offsets so temporary header expansion cannot clamp Settings scroll. No solver, binding, clip, mask, anatomy declaration, threshold or S2 input changed.

## Controls and instrument repairs

Both phones force the trail and objective visible separately under Survey: each mutation turns red, and exact style restoration returns green. The tests also corrupt the owned class, remove panel-layout settlement to reproduce lost opener focus, and simulate scroll clamping; restoration is verified.

The old synthetic floating-trail setup could add a new lane to a native layout with only 78.6 px available for its required 72 px band. Its labelled fixture now uses a visible compact objective caption and a 16 px synthetic trail, retaining original text/style and validating its measured fixed-chrome edge. Native geometry is independently required green before and after. The collision mutation still turns red; the fallback still must yield the trail while retaining a useful, scrollable, clear band. No assertion threshold changed.

During this fixture only, a removable CSS rule preserves the measured notice lane against live arrival/expiry and adaptive compaction. Native timer, serial, text and inline style are not changed. Footer pressure is derived from the maximum dock-bounded lane after guidance yields. Cleanup restores the exact objective/trail styles and removes the notice rule. If a native notice changes during the fixture, both native geometry samples must still pass; a legitimate adaptive header change is not treated as failed style restoration.

Charters Close retains a same-task audit before the font/two-frame wait as well as the final audit. A notice transition during the wait is accepted only when the opener was already answerable before that transition; an early red, missing audit or incoherent hit receipt still refuses. A queued achievement can no longer invalidate two independently green samples, and expiry cannot explain away the former red.

## Retained failures

The local baseline already contained the broad card/panel hide rule. Both baseline reports stop at the injected trail fixture, rather than at the sibling lane's reported Survey red.

| Retained receipt | Diagnosis before its correction |
| --- | --- |
| before-small-phone / before-large-phone | Broad hide rule: unusable floating predecessor / fallback control failure. |
| attempt-01-small-phone | New negative control restored computed display but not exact style-attribute bytes. |
| attempt-02 / attempt-03 | Charters sticky header consumed its 70.5 px panel; asynchronous layout had not published the final header. |
| attempt-04 | Hidden opener was not restored before synchronous focus return. |
| attempt-05 | Full objective + live notice left too little room for the native 72 px biosphere band. |
| attempt-06 / attempt-07 | Synthetic extra lane exceeded available space; fixture needed a measured compact caption and explicit trail height. |
| attempt-08 / attempt-09 | Footer pressure also compacted the notice or yielded guidance; the old mutation failed to establish its intended tight lane. |
| attempt-10 | A queued Hybrid Vigor notice arrived inside the Charters frame settlement. |
| attempt-11 | Live notice arrival also changed the synthetic band/fallback predecessor. |
| attempt-12 | Temporary natural-objective measurement clamped Settings scroll; Charts ended outside the panel. |

Each named receipt has its complete .log and .json here. Corrections preceded subsequent attempts; no unchanged retry. The initial focused-test observer-feedback failure and later wiring-count failure are retained in focused-attempt-01.log and focused-attempt-06.log. The final test log supersedes them.

## S2 and paired next steps

S2 untouched: [last solver ledger](../BORROWED_ATLAS_20260922/S2_LEDGER.md). No S2 sweep or rig battery was run for this UI-only task.

Codex holds after the signed local commit. Claude applies/reconciles the signed UI and Glass producer, checks both phone preflights on the integrated tree, and owns the PR #43 hosted attempt under its existing authorization. Nick can continue in Claude; no new decision is pending. No hosted green, push, merge or deployment is claimed here.
