# Accumulated develop integration — September 9, 2026 UTC

Nick explicitly requested that the accumulated work move into develop and that coding then
continue from the current landfall-generation direction. This is a newly directed integration
batch, not an extension or recreation of the expired unattended campaign. No model installation,
paid generation service, production release, version bump or deployment is included.

## Source and scope

OpenAI/Codex, macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`, upstream
`origin/openai/mac`. SSH origin is `git@github.com:TheDakk/Celestial-Frontier.git`; retained
TheDakk auth proof and fresh `git fetch origin` succeeded. Starting signed source is
`a84f4ea959ae51c6423ed6c88e5274bfa88d8786`; fetched develop is
`c1791e210158de864fdd475323c3091d9ecbae58`, an ancestor with no incoming reconciliation.
There are109 ancestry commits beyond develop and46 beyond the agent upstream. Tracked source
was clean; ambient `.DS_Store` remains untouched.

A bounded independent read-only scope review classified the starting3,695-file diff:

| Category | Files | Binary | Text added | Text removed |
| --- | ---: | ---: | ---: | ---: |
| Audit evidence | 3,456 | 2,081 | 1,097,206 | 1 |
| Runtime/build source | 54 | 0 | 5,150 | 342 |
| Verification/authoring code | 111 | 0 | 17,884 | 626 |
| Project Markdown outside audits | 44 | 0 | 12,651 | 309 |
| Runtime binary assets | 17 | 17 | — | — |
| Metadata/locks/configuration/licenses | 13 | 0 | 5,403 | 8 |
| Total | 3,695 | 2,098 | 1,138,294 | 1,286 |

96.39% of added text is retained audit evidence, not gameplay implementation. Runtime and
tooling together add23,034/remove968 lines. Main game TypeScript adds658/removes49.
No workflow, legacy main.js or celestial-frontier.html differences were found against develop.
Subsequent integration repairs are additional and do not retrospectively alter these counts.

The PR covers responsive controls/sheets, readable guidance, Training Settings access,
notification history, bounded audiovisual presentation, optional Mars/Earth art and the static
painted Earth landing, plus current references and immutable review material. The approved
on-demand generator, universal articulated animation, adaptive cache, seasons and exact-image
sharing remain proposed or unqualified, not implemented by the static paintings.

## First current-head admission — retained FAIL

One `tracked-input-preflight.mjs --profile=develop` attempt on clean a84f4ea9 exported the exact
index into an isolated temporary checkout and installed the existing lock with npm ci. It ran
under the shared foreground lock and reused the uninterrupted startup receipt at
`audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json`; Node26.8.1 was rechecked. An older root
Vite PID30716 (elapsed9 days) was left untouched; the rehearsal built only its isolated snapshot.

Result:344 files/4,104 tests PASS;4 files/5 tests FAIL;1 skipped. The profile stopped at npm test;
TypeScript/art/override/spec and browser stages were not reached. Start/end HEAD and tracked
cleanliness matched. Preserve `first-start.json`, `first-result.json` and `first-rehearsal.log`.
Raw log SHA256:e052d24200bc36c60e24f7bdd2bb567e16c2daab80b9cb62a95f4ace4f022db8.

- AppChrome wiring: two tests reject `raw-main-dom`. Earth layout reads dock directly and
  other AppChrome elements through a dynamic ID lookup; the second failure is baseline
  restoration, not a broken status mutation. Ownership must be repaired, not exempted.
- Build-mode fixture: its synthetic bundle omits the now-required sealed Earth resident worker.
  Actual worker admission remains strict; the existing PWA test already rejects its absence.
- Compendium producer authority: index/service-worker and aggregate hashes still bind an earlier
  build. Refresh current producer bytes only, preserving measurement authority/ruler/ceilings.
- Slice ordered release authority: the current83 rendered bullets hash to
  `073174fbd708495367c01a51b488ddb78cb8730de078e0e30d3b720eab8d1158`, while the checker still
  expects `218f02b5130fe78a6fcf76e898b6372b8761b4ef4bb4590137668920980f0793`.
  Keep exact count/order/mutation guards and update the current-copy digest.

All older Earth, U1/U2, navigation, instrument, signing and physical-device blockers in ROADMAP
remain. This new run does not replace the earlier330-file/3,742-pass/5-failure Earth profile.
The narrow repairs and their verification are recorded below before the final candidate commit.

## Integration protocol

Fresh GitHub reads found no open openai/mac PR and confirmed PUBLIC visibility. Develop rules
require a PR, normal merge commits, resolved review threads and the exact `battery` context.
The unchanged workflow has only `pull_request: [labeled]`; other workflows are manual-only.
A normal branch push and unlabeled draft PR start no Actions run. Nick's current integration
request authorizes preparing that path; it is not an exact owner-label battery authorization.

Next PR base:develop; source:openai/mac. Proposed title:
“Refine responsive UI and add bounded audiovisual and painted-world prototypes”.
The description must cover the accumulated source, scoped evidence, current rehearsal result,
open blockers and exact final head/base, rather than only the final repair commit.

After a reviewed clean candidate passes local tracked admission, Nick applies
`actions-budget-approved` for one agent-lane attempt: test-battery, this PR/ref, its exact head
and base, maximum122 runner-minutes (authorize2+battery120), no retry. Mode UNFROZEN/PUBLIC;
private fallback cap3,000. No label, workflow attempt or merge has occurred in this packet.
Do not bypass a red result or mark the draft Ready under generic standing authority.

Claude/macOS `anthropic/mac` does not yet contain these changes. No need to open or sync Claude
now; preserve its work and review packets. After a separately authorized green develop merge,
Claude fetches/merges origin/develop into its clean owned branch at its next batch. No manual
file copies or messages. Main/live site remain unchanged; no release/deployment.

## Repair and precommit verification

AppChrome now owns `surfaceLayoutRects()` with frozen detached upper/dock geometry. Main retains
only its Planetside/canvas lookups and unchanged layout/fallback math. Literal and dynamic owner
lookup mutants fail; owner tests exercise visibility, fresh snapshots, immutability and disposal.
The extracted real layout helper preserves all seven geometry fields and rejects lost scaling
and reversed Planetside precedence. No native UI layout or art acceptance claim is added.

`repaired-focused-result.json`:7 files/139 tests PASS, all3 TypeScript programs PASS, root validate
PASS with1010 named renders/0 errors/50 original fingerprints. Legacy HTML unchanged. One
separate97-file evidence build in its own installed snapshot produced `producer-observed.json`.
Current producer:2083bac2808da830f9d8b5c67386c9e1c6816ba4ee56317e121169817fc9f9cb.
Measurement:4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12, unchanged.
The temporary snapshot was removed only after its completed observation; no root build touched.

`producer-refresh.json` records the initial producer-only update. Its focused budget check
retained27 PASS/1 FAIL because the existing contract also requires the new hashes in its audit
narrative. `producer-narrative-correction.json` proves the entire old selectionRule remains a
verbatim prefix and only the dated source transition was appended. Fixed ruler/ceilings/calibration
samples remain unchanged. `repaired-budget-corrected-result.json` is28 PASS on changed metadata;
there was no second producer build. The first result remains intact, not retroactively corrected.

Independent read-only review matched current Main against observed source, budget and test pins
against the producer report, seven focused source hashes/five logs and the original first failure.
The repaired runtime is frozen. Final tracked-only admission follows the signed candidate commit;
its exact result is a separate admission boundary, not implied by the precommit checks above.
Raw logs retain their exact whitespace/bytes; only source/document formatting is normalized.
