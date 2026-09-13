# U1 local checkpoint — 2026-09-06

Status: static validation and normal three-view review PASS; Slice stopped with two instrument
findings. Neither phone Glass canary ran. No product/instrument correction or retry occurred.
Nick's accepted Survey/Charters layout remains accepted FOR UAT; physical-device UAT is open.

## Scope and exact source

Nick: “Proceed”. This continues the remaining local U1 checkpoint from
UI_U1_UAT_RESTORATION_RESUME_20260906.md. Tested source is signed
`ce8912864fabbe5624651e76c06b94f95b734f39`, initially 13 local commits ahead of origin/openai/mac.
Accepted product remains `053ef439774520577071f0ca50887337dd938755`; the previous isolated
restoration diagnostic remains bound to `381ddf59858bd863640703e83d2d98beeedf59fa`.

The selected sequence was one tracked-input develop profile, one normal distributable build and
three-view review, one Slice develop wrapper plus its success verifier, then small-phone and
large-phone Glass. The original U1 brief explicitly owns this local checkpoint. Compendium and
the full Slice-bound Glass matrix belong to the separately scoped integration chain and were
not selected. The profile owns full Vitest, its Glass selftest, all TypeScript programs and the
stricter no-unused pass; standalone duplicate typecheck/artunused/Glass selftests were not run.

OpenAI/Codex on macOS | openai/mac | /Users/nick/Projects/celestial-frontier-openai-mac |
origin/openai/mac. Physical root, branch, upstream and Node26.7.0 executable verified. Tracked
source and HEAD stayed unchanged through the browser run; root main.js was absent. The ambient
untracked .DS_Store stayed untouched. Same uninterrupted-session startup receipt
2026-09-06T16:28:25.659Z was reused; Node26.8.1 remained deferred for active jobs. Shared toolchain
locks covered each complete build/review stage, using first-attempt macOS escalation and owned
isolated headless Edge. No other worktree, personal browser/profile or UI surface was accessed.

## Completed checks

- Hermetic `node port/v2/tools/tracked-input-preflight.mjs --profile=develop` PASS on exact
  committed export without main.js or ambient dependencies: 311 test files, 3322 passed and
  one skipped test; all root/game/worker TypeScript programs and static art/route/spec gates.
  Vitest duration45.91s. Its existing test owner executed the Glass selftest once.
- Normal build and full `ui-shell-review.mjs` PASS: phone390×844, desktop1440×900 and tablet834×1112.
  Nine PNGs include three v1/v2/difference sheets. All three main candidate images were inspected.
- Independent read-only replay PASS: 761 answered evaluations/210 exact source expressions,
  75 frame receipts, 146 baseline metrics, 131 geometry controls, 27 launcher round trips,
  63 trusted mouse inputs and three Escape presses/six keyboard edges. These are mouse receipts,
  including the phone/tablet contexts; this is not a new native-touch claim. The earlier accepted
  six-view probe separately retains its touch evidence. Zero reported runtime/debugger errors.
- Named portrait restoration receipt33 passed; evaluation283 font/two-frame dispatch answered
  in29.31ms, evaluation284 geometry in16.10ms. Original phone predecessors and deadlines remain.

The independent verifier rehashed all nine images and three production goldens. It records its
own initial wrong assumption about the ascent result field and the corrected `journeys.after.trail`
read. Three geometry controls retain deltas/restoration flags without raw states; those raw states
cannot be independently replayed. Build inventory was not independently reread. The verification
JSON preserves these limits; no missing evidence is promoted to an independent browser result.

## Slice terminal RED — retained, no successor stage

Exact immutable ID: `local-u1-ce8912864fab-20260906-slice`.
Started2026-09-06T19:33:13.113Z, duration342352ms, wrapper/child exit1; two findings and ten PNGs.
Command: `npm run smoke:ci --prefix port/v2 -- --profile=develop`, with that exact
CF_V2_SLICE_SMOKE_RUN_ID and the installed Edge executable. The wrapper invoked Slice once.
Its success named-verifier was not run after nonzero; both phone Glass stages were skipped.

1. `left-rail-boundary-control-failed`: the fault removed only raillft's data-panel-boundary.
   A trusted mouse press hit the measured8px gap at(64.1171875,170); Records remained open.
   The approved layout nests raillft inside dock, whose boundary still protects it. The real
   dismissal owner in panels.ts uses closest('[data-panel-boundary]'), so this mutation did not
   remove effective protection. The retained result does not establish a product dismissal bug.
2. `u1-rail-duplicates`: the compact collector observed four right-rail copies—railatlas,
   railshipyard, railinventory and railrecords—all hidden with zero rectangles. The oracle
   expected only the first two. Its left-rail predicate already accepts parent dock/display:contents;
   that parent was not the mismatch. The last two right controls remain intentionally hidden in
   the shipped markup/style. This is a stale expected inventory, not an observed painted duplicate.

Slice's source receipt is **dirty-diagnostic**, certifying:false, because the existing collector
includes full `git status --porcelain=v1 -z --untracked-files=all`. The sole ambient .DS_Store
exactly reproduces its retained status and working-tree hashes; source begin/end agree and there
were no tracked edits. Preserve that classification. Static validation used a clean exported
snapshot, but that cannot relabel the separate Slice receipt as a clean certificate.

## Next bounded correction

Correct the Slice instrument on a new committed source, preserving product layout and ownership:

- Capture exact left-rail and ancestor-dock boundary attributes. With only the ancestor boundary
  removed, prove the rail's own boundary preserves the open panel at the measured native gap.
  Then remove the rail boundary too, prove no effective boundary remains, and require the same
  trusted gap press to dismiss. Restore exact presence/bytes in finally and re-prove the original
  protected gap. Keep the separate right-rail control and reject ineffective mutation/restoration.
- Synchronize the right-rail expected hidden-copy inventory to the four actual controls. Preserve
  exact left dock/contents ownership, per-copy hiding/zero rectangles, and both deliberate
  show-root faults with exact style restoration. Negative-control missing/visible/wrong-owner rows.
- Prepare a fully clean owned test snapshot for the changed candidate, with full status empty.
  Preserve the original workspace .DS_Store unchanged; do not weaken the source classifier or add
  an ignore exception to make a dirty receipt pass. Select one new-source attempt only after the
  bounded controls/static checks pass. Do not retry ce89128 or repeat its isolated normal review
  merely because Slice was red. Neither later canary is considered passed.

The separate Chrome-only targeted-verifier CLI was inspected, not run: it rejects Edge by design.
Future local Edge phone collectors verify their own immutable terminal evidence through the existing
Chrome/Edge/CDP1.3 authority. Their result cannot supply hosted Chrome parity. No browser product
was installed and no verifier/provenance rule was changed.

## Evidence and retained boundaries

Manifest: `UI_U1_LOCAL_CHECKPOINT_ce89128_20260906/manifest.json`.
SHA256 `6d2645e2342cd32fc1f0a95234ee76ef53ad342d16035a3dba1702c85ed97e13`.
All28 carriers and decompressed payload hashes verified: static/build/review/command logs, full
normal-review journal and independent replay, nine review PNGs, immutable Slice report/raw log,
ten Slice PNGs and the source/failure receipt. Original ignored run files remain unchanged.
The final records successor carries docs/evidence only and is14 commits ahead locally, not pushed.
Its exact commit is emitted at handoff rather than self-embedded into this audit.

The records-only completion also passed root validate: zero boot/render errors and all50 baseline
probes identical. Its separate gzip log is UI_U1_LOCAL_CHECKPOINT_RECORDS_VALIDATE_20260906.log.gz,
SHA256 e4e8b9c652f3488e877f4b2d8e230ead9cd547181fcb61655fa14c48d7fd6201; this is a documentation-completion check, not a resumed Slice stage.

Both older causes remain OPEN. Source08cd97d79b67cab4b8d19bfd493293e997dec528 observed native Skip785ms
→ EscapeCosmos1313ms → unsolicited MilkyWay3930ms before Notifications; cause is unattributed.
Sourcec57aaaebc656f2e2d15705601fe1a2a73cf15f1f timed out during portrait restoration after23 inputs;
its old pending expression is unknown. Cleanup was responsive and all four debugger pauses resumed.
Current passes do not establish causal repair; journal/debugger observation changes timing.
Immutable prior audits UI_U1_NAVIGATION_DIAGNOSTIC_20260906.md and UI_U1_COMPACT_CONTROLS_20260906.md
remain intact. No app, release81 bullets, producer7a67c0db…, measurement4a93479b…, ceilings, packages,
versions, workflow policy or protected asset changed. No new earned implementation law is claimed.

SSH origin git@github.com:TheDakk/Celestial-Frontier.git, authenticated account TheDakk, repository
read/fetch PASS reused in this session; origin/develop c1791e2 remains an ancestor. Budget
UNFROZEN/PUBLIC per last check, private fallback3000; zero exact hosted authority or attempts.
No push, PR, labels, merge, release or deployment. Develop/main/live unchanged.

Codex: retain this stop, then make only the bounded Slice correction above. Claude: Nick need not
open Claude now; anthropic/mac/unmerged173c806 remains separate, with no copying, merge or duplicate
battery. Future integration openai/mac → develop requires separate exact hosted authority. No PR
is needed now. No U2–U4, Phase2 or integrated-pilot work. Fresh resume:
UI_U1_LOCAL_CHECKPOINT_RESUME_20260906.md.
