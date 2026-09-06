# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## SESSION HANDOFF — 2026-09-06 · U1 SURVEY / CHARTERS CORRECTION · VERIFICATION PENDING

OpenAI/Codex on macOS | openai/mac | /Users/nick/Projects/celestial-frontier-openai-mac |
origin/openai/mac. Exact physical root/branch/upstream verified. Entry HEAD
70b16eeba973f13040e47d50632fc6c1ba7d4a81 is eight local commits ahead of origin/openai/mac.
The current correction is working-copy source; final implementation/tested commit and browser
results are pending. Root main.js absent; ambient .DS_Store untouched. SSH origin
 git@github.com:TheDakk/Celestial-Frontier.git authenticated as TheDakk; read/fetch and develop
c1791e2 ancestor receipts are reused in this uninterrupted session. No other worktree edited.

### Current explicit correction

Nick replaces the Charters shortcut with Survey on every v2 layout. Phone upper five are
Survey (🔭), Compendium, Prime, Shipyard and Atlas; the lower four are Records (Achievements),
Notifications, Guide and Settings. Wide Survey replaces Charters above Compendium at upper-left;
Charts remains below, with its existing Settings toggle on compact layouts. Duplicate dock/rail
Charters shortcuts are removed. Objective becomes the sole named native Charters opener with a
44px target, pointer/Enter/Space activation and the existing panel owner/focus return. It remains
available while landed and falls back to Charters without an active objective. Objective progress,
Charter gameplay and the Survey action are unchanged.

Compact geometry is five plus four in ten half-columns: width capped at 320px and viewport minus
safe sides minus 20px, pitch = width / 5 at most 64px, board width = pitch minus 4px with a 44px
minimum. Lower targets/faces remain 44px/36px, centered; default dock height remains 92px.
Panel-open short landscape keeps the existing half-column safe-width cap. The dock now contains
the left rail, boxless in compact mode with Survey first and the duplicate rail Compendium hidden;
the scene-actions group contains only Charts. Search, fitted wide pills, Health and wide Prime
are unchanged. Five current references and the new program amendment describe this correction;
all older amendments are preserved verbatim. U1 visual acceptance remains OPEN.

Audit: audits/UI_U1_SURVEY_CHARTERS_20260906.md. Root validate PASS (50-probe fingerprint), full
typecheck PASS. Initial full Vitest RED: 2 files/3 tests failed; 309 files/3319 tests passed,
1 skipped. The failures were stale guards for the old passive Objective/rail Charters. A bounded
test-only correction keeps raw-status DOM protection, admits only Main's exact single Charters
registration, and adds wrong-opener/extra-objective-writer negatives; Glass expects Survey and
Objective. Both corrected files/48 tests PASS; native trace selftest 2 PASS. The full Vitest red
is retained; no full rerun PASS is claimed. Product unchanged after the final pin. Browser probe
NOT RUN. Prep evidence is retained in audits/UI_U1_SURVEY_CHARTERS_PREP_20260906/manifest.json
(five compressed logs, two authority receipts). The manifest explicitly binds precommit working
source to the commit carrying final product/guards; it retains the initial red and scoped correction.
Planned bounded probe:
audits/UI_U1_SURVEY_CHARTERS_PROBE_20260906.mjs, six fresh contexts at phone widths 390/320/430,
667 landscape Settings-open, 834 tablet and 1440 desktop. Scope: native Objective pointer/Enter/
Space, Close/Escape/focus return, Survey placement, geometry negative controls with exact
restoration, larger text and PNGs. This does not retry the full normal review or its portrait
restoration, and does not run Slice, phone Glass or the full chain. Stop after the first red;
retain its source/evidence and do not advance or rerun unchanged source.

Current producer 7a67c0db4dc3ad4f3f3caf3a48ad15e61ad2e2d77facc3339975420900b77a51;
measurement 4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12 is unchanged.
Draft 81-bullet authority bb995e649d578556b6e581af65e672e095337da808961accf59418c1acb944da.
Fixed rulers, ceilings, history, game/release version, packages, workflows and protected art retain
their owners. No release, certification or visual-acceptance claim follows from this correction.

### Preserve both blockers

08cd97d79b67cab4b8d19bfd493293e997dec528: Skip 785ms → Escape Cosmos 1313ms → unsolicited
Cosmos/Milky Way 3930ms before Notifications input. Navigation cause remains unattributed/OPEN;
95c9a1f nonrecurrence is not repair. c57aaaebc656f2e2d15705601fe1a2a73cf15f1f: Runtime.evaluate
timeout after 23 native phone inputs and landscape Settings Close while restoring 390×844.
Pending expression remains unknown; cleanup read Cosmos/closed panels/390×844 after all four
debugger pauses resumed, so no lasting hang was established. Portrait-restoration blocker OPEN.
Their immutable audits are UI_U1_NAVIGATION_DIAGNOSTIC_20260906.md and
UI_U1_COMPACT_CONTROLS_20260906.md under audits/. The six-board e94f7b3 scoped PASS and earlier
cleanup red remain in audits/UI_U1_SURVEY_TOP_ROW_20260906.md as predecessor evidence only.
No workaround wait, deadline increase, navigation guard or automatic retry.

### Next and standing boundaries

Codex: finish the current bounded checks, commit the settled source locally, run the scoped
fresh-context probe only after its prerequisites pass, then retain terminal results/PNGs and
refresh audit/reference/handoff source identities. Stop for Nick's visual review. No U2–U4,
Phase2, integrated-pilot or broad navigation work. Claude: Nick need not open Claude now; preserve
anthropic/mac and unmerged 173c806. These local changes are not on develop and are not available
there; no copying, merge or duplicate battery. No PR/push/GitHub step now. Future integration is
openai/mac → develop with separate exact hosted authority; develop/main/live are unchanged.

Audiovisual B–D candidates exist; preservation CLOSED, integrated pilot UNAPPROVED and eight
anatomical animations INCOMPLETE with protected static fallbacks. Matched listening, physical
iPhone/Safari/PWA and 256MiB retained-update enforcement remain OPEN; 128MiB admission exists.
Separate lane: audits/AAA_PILOT_REFINEMENT_20260905.md, AAA_GAP_AUDIT.md, AAA_COVERAGE_LEDGER.md,
port/AAA_ASSET_POLICY.md. Do not restart Batch A. U2 stacking conflict, artlock CI lane, ITP
protection and DECISIONS row19 remain open; no legacy import door or new backup acceptance.
Budget UNFROZEN/PUBLIC per last verification, private fallback 3000; no exact hosted authority,
zero hosted attempts/writes, labels, PRs, merges, purchases, releases or deployments. Same-session
startup receipt 2026-09-06T16:28:25.659Z reused; Node26.8.1 remains deferred while26.7.0 is busy;
other approved tools current. A fresh session needs a new runbook check. Terminal-only privacy,
owned isolated headless browsers, shared toolchain lock and first-attempt macOS escalation remain.
