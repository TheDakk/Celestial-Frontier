# U1 top/left presentation refinement — 2026-09-06

Status: LOCAL PASS; Nick's U1 visual approval stop remains.

Nick requests aligned top/left chrome, stacked actions, improved HP and Cosmos at the top.
The already approved bottom launcher is preserved. Current view is a noninteractive header
readout; Cosmos describes map scale. Inventory/HP/context actions share a left column with
8px gaps, and the health gauge keeps exact values with framed paint and meter accessibility.
Landed portrait uses one compact top action row for roster space. UI_PRESENTATION.md owns
current metrics and behavior. No domain/navigation/save/health math changed. The context stack is a pointer-transparent
layout wrapper, with explicit input on its native buttons; passive Objective text cannot
intercept canvas gestures. The bottom launcher still owns its painted gaps.

## Exact-source verification

Exact source `3e65afaace952f6e34c366058f411ad598f23458` in a fresh separate checkout without root main.js:

- Typecheck and artunused PASS; Vitest311 files /3316 tests PASS /1 skipped.
- Glass selftest PASS; fresh normal build and three-view review PASS:9 images,
  all9 native launcher opener/Close/focus journeys,63 trusted native deliveries and3 public
  trail traces. Phone fs-xl and844×390 native Settings-open numeric probes also PASS.
- Slice develop `20260906123217459-2399-a9aa2923bcf9` PASS, 376,061ms.
- small-phone: `20260906123835241-2700-c453568927e6` PASS, 14,541ms, zero findings/instrument failures.
- large-phone: `20260906123851529-2821-b3fb27266690` PASS, 14,257ms, zero findings/instrument failures.

Each selected owner ran once on this source. Normal review preceded Slice for early visual
diagnosis; Slice and both phones used unchanged source. This is local bounded evidence,
not full Glass, Compendium, production, hosted, real-device or human acceptance.
Evidence: `audits/UI_U1_TOP_LEFT_3e65afa_20260906/manifest.json`, SHA256 `5f1df257ce4b393ad1de77fd68c364f79fb77e6e2af04d02727dc95369dbaf74`.

## Visual review and remaining observations

All nine normal images were inspected. Current view is inside the header; HP/nameplate,
Survey/Charts/Objective share aligned edges without visible text clipping. The bottom
launcher retains Nick's approved arrangement. The empty Current view backing now clears under open overlays. One nonblocking Notifications-state cosmetic
observation remains for review: the phone panel reveals a thin edge of the underlying left
controls (10px shell vs12px panel inset).
Numeric/native checks found no resulting click-access failure. Panel reskin/alignment is U2.

The earlier6a88f85 normal review saw Cosmos→Milky Way following Notifications Close.
Cause remains unexplained; later instrumented PASS is not proof of a product repair. The
original red remains in UI_U1_LAUNCHER_REDS_20260906.json for Claude/Nick's U1 review.

## Retained first-candidate red and correction

00675120bd5c69136c3e21aeaf2c05cce2705df8 passed static/normal review, then Slice
20260906121642484-99852-08bf398578e9 stopped after376433ms: phone pinch0.511875→0.511875.
Both Glass rows were skipped. UI_U1_TOP_LEFT_0067512_20260906/ and
UI_U1_TOP_LEFT_REDS_20260906.json preserve it. The long Chapter3 Objective at A++/mono
intercepted contact150,400 through its newly enclosing auto-hit nav. The product correction
makes the layout wrapper transparent and its real buttons interactive. The original gesture
coordinates/timing and>1.15 zoom outcome remain, with actual root-canvas pointer receipts and
a negative control that restores the faulty nav input, rejects it, restores and proves zoom.
The successor also clears hidden Current view paint under overlays without changing geometry.
This was a changed-source successor, never a retry of unchanged source.

## Instrument and authority scope

AppChrome now observes the actual scene-action owner while preserving the72px reading-band
rule. Slice measures actual header/stack/HP/action geometry and retains live mutants. The
existing Glass portrait fallback control explicitly injects a floating-trail regression
below fixed owners, requires observed usable native/injected geometry, exercises the real
fallback, and restores exact style presence/bytes plus native header containment. It is not
presented as naturally floating chrome. Existing control IDs/ledgers and72px/44px/4.5 floors
remain. Prep and live evidence retain negative controls and restoration.

Producer-only rederivation is a036cc94ef6a8caf1bd50d32780afa005117b8bb62dc5570ed9d3118f5f70c60.
Measurement4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12, fixed ruler,
ceilings and history are unchanged. Existing ONE GLASS LANGUAGE bullet amended; still81,
ordered authority f395fc3218fe2a5edbc2c6d52aadcbddde3c5da1e4d179854a97b601605b68ec.
Preparation receipts: UI_U1_TOP_LEFT_PREP_20260906.json,
UI_U1_TOP_LEFT_PRODUCER_20260906.json/.log.gz,
UI_U1_TOP_LEFT_PRODUCER_CORRECTION_20260906.json/.log.gz and
UI_U1_TOP_LEFT_RELEASE_AUTHORITY_20260906.json. Printer initial exit2 described the old
producer pins before refresh; measurement matched and SceneMemory remains quarantined.

## Handoff

OpenAI/Codex on macOS owns /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac,
upstream origin/openai/mac. Tested signed source above; records-only signed successor carries
this report and evidence for the authorized normal branch push. Exact pushed SHA is reported
separately. SSH origin git@github.com:TheDakk/Celestial-Frontier.git; TheDakk authentication,
remote read and fetch passed this uninterrupted session. Developc1791e2 is already an ancestor.
Root main.js absent; ambient .DS_Store untouched. No other worktree changes.

Codex stops beforeU2. Claude may review this branch if Nick requests; do not copy unmerged
files into anthropic/mac. Safe-sync develop only after future integration. Nick reviews the
phone/tablet/desktop sheets and retained observations; open Claude only for that review.
GitHub step none, PR details not needed now. Future integration needs a reviewed bounded
agent PR into develop and exact hosted authority. Develop/main/live site remain unchanged.
Budget UNFROZEN, repository PUBLIC per last verification, private fallback3000, zero hosted
attempts/labels/PRs/merges/releases/deploys/purchases authorized. Branch push triggers no
workflow, expected hosted cost0. No workflow/policy/artlock/protected-portrait/dependency or
legacy-import change. U2–U4, integrated-pilot approval and Phase2 remain unstarted/open;
resolve U2 Training/Settings wording first. Nick's artlock CI, ITP save protection and
DECISIONS row19 decisions remain open. No release/deployment performed.

## Final Git completion recovery

Both records-only signing attempts returned `1Password: failed to fill whole buffer` and
`failed to write commit object`; neither created a commit. Product HEAD remains signed
3e65afaace952f6e34c366058f411ad598f23458, all checks above remain valid, and final evidence/
handoff files are retained locally. Nick subsequently confirmed 1Password is signed in. The authorized records-only signing
step resumes; the new screenshot-directed U1 revision is a separate product checkpoint.
