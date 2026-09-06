# U1 Survey replaces Charters — 2026-09-06

Status: PRODUCT COMMITTED at 053ef43; root validation/typecheck PASS, initial full Vitest RED
with corrected affected guards PASS. First scoped browser attempt INSTRUMENT RED after passing
390px outcomes; probe-only keyboard correction awaits changed-source verification. U1 visual approval
and both recorded blockers remain OPEN. No U2–U4, Phase2, hosted, integrated-pilot or broad navigation work.

Nick explicitly replaces the Charters shortcut with Survey across every v2 layout. This
supersedes the six-upper/four-lower phone arrangement in UI_U1_SURVEY_TOP_ROW_20260906.md;
its exact predecessor evidence and the verbatim program amendments are preserved.

Phone upper row: Survey (🔭), Compendium, Prime, Shipyard, Atlas. Lower row: Records (including
Achievements), Notifications, Guide, Settings. Wide Survey occupies the former Charters position
above Compendium at upper-left; Charts remains below. The native Survey action is unchanged.
Duplicate dock/rail Charters shortcuts are removed. Objective is now the sole named native
Charters opener: 44px minimum target, pointer/Enter/Space activation, existing panel ownership,
Close/Escape handling and focus return. It remains available while landed and displays Charters
when no objective is active. The objective text/progress calculation and Charter gameplay are
unchanged; this correction adds no new Charter reward or progression action.

The compact dock has ten half-columns across at most 320px, also bounded by viewport width minus
safe sides and 20px. Five positions use pitch = width / 5 (maximum 64px), board width = pitch − 4px
with a 44px minimum. Four centered lower targets/faces remain 44px/36px; default dock height is 92px.
Panel-open short landscape retains the existing header half-column safe-width cap:
min(320px, (viewport width − safe left − safe right − 36px) / 2). The left rail is nested in the
dock and boxless in compact mode, with Survey first and its duplicate rail Compendium hidden.
The scene-actions group contains only Charts. Search alignment, fitted wide pills, Health and
wide Prime retain their existing presentation.

The current UI_PRESENTATION.md, celestial-frontier-codebase-reference.md,
port/UI_PARITY_PROGRAM_U1_U4.md, port/V2_PROGRAM_ROADMAP.md and port/v2/README.md agree with this
scope. The program preserves the complete previous amendment verbatim. ROADMAP.md owns the live
handoff; the former Survey top-row terminal handoff is archived verbatim, newest-first.

## Verification boundary and pending plan

Root validate PASS, including the 50-probe determinism fingerprint; full typecheck PASS. The
initial full Vitest run was RED: two files/three tests failed, while 309 files/3,319 tests passed
and one test was skipped. Only stale contract expectations failed in
`port/v2/tests/app-chrome-main-wiring.test.ts` and `port/v2/tests/glass-hidden-opener.test.mjs`: they
still expected a passive Objective or the removed rail Charters opener. The bounded correction
changes those tests only. Raw-status DOM protection remains, with an exception for the exact
single Main Charters registration; new wrong-opener and extra-objective-writer negatives retain
that boundary. Glass now expects Survey and Objective. The corrected two files/48 tests PASS;
the native trace selftest's two controls PASS. Product source is unchanged after the final pin.
The original full-suite red remains part of this record; no full rerun PASS is claimed.

Prep evidence is retained in `UI_U1_SURVEY_CHARTERS_PREP_20260906/manifest.json`: five compressed
logs (`validate`, `typecheck`, `vitest`, `guards`, `trace`) and two JSON authority receipts. Its
source note identifies precommit working-source checks and binds the final product and guards
to the commit carrying the manifest. Both the initial full Vitest red and the scoped two-file
correction remain recorded. It is not a full rerun or certification claim.

The first committed-source probe result and its corrected-helper boundary are recorded below.
The retained probe is
UI_U1_SURVEY_CHARTERS_PROBE_20260906.mjs in this audit directory.
It covers six separate fresh contexts: phone widths 390/320/430, 667 landscape with Settings open,
834 tablet and 1440 desktop. The executable probe owns exact viewport heights and browser evidence.
It exercises the native Objective using pointer, Enter and Space; panel Close/Escape and focus
return; Survey/Charters placement and geometry; deliberate negative controls with exact cleanup;
larger text; and retained screenshots. Its results are scoped evidence, not a full UI certificate.

The probe runs only after required prerequisites pass on settled committed source. Stop at the
first nonzero/red result and retain it without advancing or rerunning unchanged source. Full
normal review, the known-timeout portrait-restoration path, Slice, phone Glass and the full chain
are outside this bounded attempt. A scoped PASS cannot close the older navigation or instrument
blocker or supply human visual acceptance.

Committed product source 053ef439774520577071f0ca50887337dd938755 passed the first 390×844
geometry, real native touch/Enter/Space Charters, Close/Escape/focus, six geometry/availability
faults and larger-text outcomes. The run then stopped INSTRUMENT RED: its keyboard trace hit
200 entries, including 189 unexpected trusted Unidentified/Minus keydowns with timestamp zero
starting after Escape. Later viewports were NOT RUN. Exact report, two PNGs and logs are retained
in audits/UI_U1_SURVEY_CHARTERS_053ef43_RED_20260906/manifest.json. The 390 baseline PNG was inspected.
The new probe copied Windows virtual-key numbers into platform-specific nativeVirtualKeyCode;
port/v2/tools/slicesmoke.mjs already documents that mismatch and the possibility of endless
synthetic repeating keys on macOS. A probe-only correction now follows Slice's portable key
parameters and rejects anything other than the exact six trusted Enter/Escape/Space key edges.
Positive plus missing/extra/overflow/untrusted/retained-red controls PASS in
UI_U1_SURVEY_CHARTERS_KEY_CONTROLS_20260906.txt. Product/pins are unchanged. Changed instrument
verification remains pending. This finding does not establish the cause of either older blocker;
the old normal-review helper is unchanged and both blockers remain OPEN.

## Source and authority

OpenAI/Codex on macOS | openai/mac | /Users/nick/Projects/celestial-frontier-openai-mac |
origin/openai/mac. Entry HEAD 70b16eeba973f13040e47d50632fc6c1ba7d4a81 is eight local commits ahead
of origin/openai/mac. The correction is currently working-copy source; implementation and tested
commit identities are pending. No push or GitHub write. Root main.js is absent, ambient .DS_Store
is untouched, and no other agent's worktree was edited. The same uninterrupted-session SSH
receipt uses git@github.com:TheDakk/Celestial-Frontier.git authenticated as TheDakk with repository
read/fetch passed and develop c1791e2 retained as an ancestor.

New producer: 7a67c0db4dc3ad4f3f3caf3a48ad15e61ad2e2d77facc3339975420900b77a51.
Measurement unchanged: 4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12.
Draft remains 81 bullets, authority bb995e649d578556b6e581af65e672e095337da808961accf59418c1acb944da.
The fixed rulers, numeric ceilings and history remain unchanged. No game/release version,
package, workflow, protected-art, production release or certification authority changes.

## Retained blockers

Navigation remains OPEN/unattributed. Exact source 08cd97d79b67cab4b8d19bfd493293e997dec528
recorded native Skip 785ms → Escape Cosmos 1313ms → unsolicited Cosmos/Milky Way 3930ms before
Notifications dispatch. The later 95c9a1f normal review did not reproduce it; debugger timing can
change recurrence and its four stacks showed same-Cosmos resize redraws only. The immutable
source/evidence remains in UI_U1_NAVIGATION_DIAGNOSTIC_20260906.md.

Portrait-restoration verification remains OPEN. Source c57aaaebc656f2e2d15705601fe1a2a73cf15f1f
stopped on Runtime.evaluate after 23 trusted phone inputs and the landscape Settings Close while
restoring 390×844. The pending expression is still unknown. Cleanup could read Cosmos, closed
panels and 390×844, all four debugger pauses resumed, and no lasting hang was established. Exact
evidence remains in UI_U1_COMPACT_CONTROLS_20260906.md. No wait, deadline increase, navigation
guard or retry is introduced here. Prior six-board e94f7b3 scoped PASS and 810ab78 cleanup red
remain in UI_U1_SURVEY_TOP_ROW_20260906.md and do not verify the new five-board/action arrangement.

## Next and paired handoff

Codex completes the pending bounded checks, commits the settled source locally, observes the
scoped fresh-context probe once only after prerequisites pass, retains terminal evidence and
updates this audit plus the live references/handoff. Then stop for Nick's visual review.
Claude: Nick need not open Claude now; preserve anthropic/mac and unmerged 173c806. These local
changes have not reached develop; do not copy product files, merge them or duplicate the battery.
GitHub step: none. PR details: not needed now. Future integration is openai/mac → develop with
separate exact hosted authority. Develop/main/live remain unchanged; no release or deployment.

Budget UNFROZEN; PUBLIC per last verification; private fallback 3000. Zero exact hosted authority,
attempts, labels, PRs, merges, purchases, publications or deployments. Startup receipt
2026-09-06T16:28:25.659Z and SSH receipts are reused within the uninterrupted session; Node26.8.1
remains deferred while 26.7.0 is busy, other approved tools current. A new session repeats the
runbook. Terminal-only privacy, owned isolated headless browsers, shared toolchain lock and
first-attempt macOS browser escalation remain in force.
