# U1 compact controls — 2026-09-06

Status: IMPLEMENTED / VERIFICATION STOPPED ON INSTRUMENT RED. U1 visual approval and the
recorded navigation blocker remain OPEN. No U2–U4, Phase2, hosted or audiovisual-pilot work.

Nick asked for upper-right phone Search with the plain Search prompt, desktop pills that fit
their text, and an explanation of Survey/Charts with possible emoji phone-dock placement.
Survey reopens the selected galaxy/star/world card or reconstructs the landed-world card after
reload; no selection in Cosmos means no card. Charts toggles orbit rings, habitable-zone shading
and the belt caption (the existing Settings → Star charts preference, not Star Atlas). These
features existed in production; the separate shortcuts are v2 additions. After an optional choice
and reasonable wait, Codex stated the Survey-only default. This implementation is for Nick's
review, not a claim that he explicitly chose between the proposed dock arrangements.

Phone: Search aligns with the upper-right edge. Five existing board icons sit above five utility
icons: Records, Notifications, Guide, Settings, Survey (🔭). The two rows retain 64px pitch,
60px board widths, 44px targets, 36px utility faces and the default 92px dock height. Charts yields
to its Settings control. Wide: name, Objective, side-rail and Survey/Charts pills fit text within
existing width caps; Health retains its meter width. Native actions, saves, panel/focus/Training,
header observer, navigation and main.ts are unchanged. The scene group is nested in the dock,
uses compact display:contents, and contributes no erroneous top-chrome box.

Review and Slice now check actual ten-button compact membership, Survey placement, hidden Charts,
Search right alignment, text-fitted wide pills and gaps between unequal-width rail buttons.
Negative controls retain exact restoration; they include widened pills, shifted/covered/missing
Survey, visible Charts, wrong group ownership and actual short-landscape header/dock collision.
The normal trace, exact native predecessors, readiness bounds and63 trusted inputs remain intact.

Precommit controls: six focused Vitest files /103 tests PASS; root validate PASS including zero
boot errors and50-probe baseline match. Bounded review caught/fixed Charts CSS specificity, a
stale nine-button reviewer expectation and a boxless-group collision oracle before browser work.
Producer derivation returned its expected exit2 on the unpinned changed build (twice: before and
after the CSS specificity correction); these are authority measurements, not browser test passes.
No unchanged-source browser retry. The terminal committed-source result follows below.

Draft81 bullets now bind bcad7fd27792ef2160b8451cdb2d366a36c9184bcc579655af3cb41129edebd7.
Compendium producer is680a4b7caf6eb7b451063d1f4160c2d61f0524dbc98b14b515c48002bd8dfabd;
only built index/service-worker inputs changed. Measurement4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12,
fixed ruler, numeric ceilings and historical records remain unchanged. Active producer and draft
pins move together; the calibration narrative is appended. No certificate or version bump.

Preserved navigation blocker:08cd97d observed native Skip785ms → Escape Cosmos1313ms → unsolicited
Cosmos/Milky Way3930ms before Notifications dispatch. No cause is repaired.95c9a1f's normal review
passed without recurrence; debugger timing can alter recurrence and its four stacks only showed
same-Cosmos resize redraws. See UI_U1_NAVIGATION_DIAGNOSTIC_20260906.md and its immutable evidence.

OpenAI/Codex macOS identity: /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac,
upstream origin/openai/mac. Initial head b231398d351826f2a48382e9c893b1ec16fda359, three local commits
ahead; origin/develop c1791e2 remains an ancestor. SSH origin/auth/read/fetch and startup receipt
2026-09-06T16:28:25.659Z are reused within the uninterrupted session. Node26.8.1 remains deferred
because five processes use26.7.0. Root main.js absent; ambient .DS_Store untouched. Terminal-only
privacy; owned isolated headless browsers with the macOS escalation and shared toolchain lock.
Budget UNFROZEN/PUBLIC per last verification/private fallback3000; zero hosted authority or writes.

## Terminal result and retained evidence

Signed and signature-verified product/tested source c57aaaebc656f2e2d15705601fe1a2a73cf15f1f.
The later records commit is not a tested product source. Fresh isolated checkout:

- Typecheck/artunused PASS; Vitest311 files /3320 passed /1 skipped.
- Glass instrument selftest and normal distributable build PASS.
- Normal review INSTRUMENT RED,17:39:20.260–17:39:48.558 UTC. Runtime.evaluate timed out while
  restoring390×844 after the844×390 Settings probe. No retry; all later stages stopped.
- Phone default31 metrics,34 negative controls, nine panel journeys and23 trusted deliveries
  passed. Same-task Settings/Motion/Close restoration, fs-xl and landscape Settings/collision
  rejection/exact style restoration/Close passed. Whole phone restoration is incomplete.
- Two current-source phone PNGs retained and the main phone image inspected. Tablet/desktop
  geometry and images, three golden comparison sheets, Slice and both phone Glass rows NOT RUN.

Settings Close restored focus to docksets and retained Cosmos. Window and visual-viewport events
then recorded390×844; cleanup could still collect DOM data at that size with panels closed and
Cosmos intact. The absent narrow.restored record places the timeout before final restoration
assessment completed: either its font/two-frame boundary evaluation or following shellGeometry
read. The existing report does not identify which expression timed out. No lasting browser hang,
product cause or repaired behavior is established. Four debugger pauses were all resumed; mapped
stacks again show frame-coalescer → renderer resize rerender → hudText universe → setTrail.
No runtime/debugger errors or trace overflow were recorded. No navigation recurrence observed;
the original08cd97d blocker stays OPEN and unattributed.

Manifest: audits/UI_U1_COMPACT_CONTROLS_c57aaae_20260906/manifest.json
SHA256 2fdd35a7609d65d98acdca61b341a5d63dbe395c505617704edc377c5437e964.
All18 carriers, original decompressed hashes, PNG hashes and retained generated bundle hashes
verified. Includes exact logs/report, trace, two phone PNGs, generated main JS/map, normal index/
service-worker and source-map-resolved stacks. The fresh checkout remains clean. This is partial
local browser evidence, not full U1, a certificate, physical-device evidence or visual acceptance.

## Paired next steps

Codex: stop at this retained failure; next bounded correction is to identify the exact restoration
evaluation and its settlement evidence before proposing an instrument fix. Do not blindly retry,
increase deadlines, insert a delay, alter navigation or run downstream gates. Resume via
UI_U1_COMPACT_CONTROLS_RESUME_20260906.md. Nick can review the phone placement now; desktop fit
is implemented but has no completed new visual review. Claude: Nick need not open Claude now;
preserve anthropic/mac and unmerged173c806, with no product copying/merge/duplicate battery.
No PR or push now; future openai/mac → develop integration needs separate exact hosted authority.
