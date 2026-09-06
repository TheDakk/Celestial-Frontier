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

## SESSION HANDOFF — 2026-09-06 · U1 SURVEY REPLACES CHARTERS / SCOPED PASS

OpenAI/Codex on macOS | openai/mac | /Users/nick/Projects/celestial-frontier-openai-mac |
origin/openai/mac. Physical root/branch/upstream verified. Entry70b16ee was8 commits ahead;
product053ef439774520577071f0ca50887337dd938755 and probe-only successor
cfba0ede81d5861df70628b462e125eeff4780b9 are signed locally. The final records successor carrying
this handoff is11 commits ahead of origin/openai/mac. No push/hosted action. Root main.js absent;
ambient .DS_Store untouched. SSH origin git@github.com:TheDakk/Celestial-Frontier.git authenticated
as TheDakk; read/fetch and develop c1791e2 ancestor receipts reused in this uninterrupted session.
No other worktree edited.

### Completed current correction

Nick replaces Charters with Survey in every v2 layout. Phone top five: Survey🔭, Compendium,
Prime, Shipyard, Atlas. Bottom four: Records/Achievements, Notifications, Guide, Settings. Wide
Survey sits above Compendium in the former upper-left Charters position; Charts remains below
and in Settings on compact screens. Both former Charters DOM buttons are removed. Objective is
now the sole native Charters opener, retaining progress,44px floor, native keyboard activation,
panel/Close/Escape/focus ownership, landed availability without overlays and a null-objective
Charters fallback. Survey handler and Charter gameplay are unchanged. Compact dock320px cap,
five responsive slots, centered44px lower targets/36px faces,92px default height and existing
short-landscape Settings safe-column cap. Search, fitted wide pills, Health and wide Prime unchanged.

Audit: audits/UI_U1_SURVEY_CHARTERS_20260906.md. Root validate/fingerprint and full typecheck PASS.
Initial full Vitest RED:2 stale contract files/3 tests failed;309 files/3319 tests passed,1 skipped.
Corrected2 files/48 tests PASS; raw status-owner protection retained with exact native registration
exception and negative controls. Native trace2 PASS. Full red and corrected scoped logs retained
in audits/UI_U1_SURVEY_CHARTERS_PREP_20260906/manifest.json; no full rerun PASS claimed.
First053ef43 scoped run passed390px geometry/actions/6faults/largeText, then stopped on keyboard
trace overflow with189 unexpected trusted Unidentified/Minus keydowns. Later sizes NOT RUN.
Exact red/2PNGs/logs retained in audits/UI_U1_SURVEY_CHARTERS_053ef43_RED_20260906/manifest.json.
Probe-only correction follows Slice's documented portable key parameters (no platform-specific
nativeVirtualKeyCode) and verifies exactly six trusted key edges per context; positive and
missing/extra/overflow/untrusted/retained-red controls PASS. Product/pins did not change.

Changed-source scoped PASS: cfba0ede81d5861df70628b462e125eeff4780b9, with product unchanged from
053ef439774520577071f0ca50887337dd938755. Normal build PASS. Six fresh contexts (390×844,320×740,
430×932,667×375 Settings,834×1112,1440×900) passed: 26 native pointer inputs (18 touch,8 mouse),
18 keyboard presses with exact36 trusted key edges, real Charters content and Close/Escape/focus
return,36 geometry/availability faults with exact cleanup,5 settled larger-text checks,13 PNGs,
zero runtime errors and no trace overflow. Phone320, desktop1440, tablet834, landscape667 Settings
and phone390 Charters PNGs were inspected. No further battery was run after this scoped acceptance.
Evidence: audits/UI_U1_SURVEY_CHARTERS_cfba0ed_20260906/manifest.json
SHA256 d5de9993d3903e3ac2696ab1cd5f6f8b9620bb038d9c1e934cf30f20b4ff30a0; all16 carriers and decompressed hashes verified.
The first053ef43 red remains immutable. Human visual approval and both older blockers remain OPEN.

Current producer7a67c0db4dc3ad4f3f3caf3a48ad15e61ad2e2d77facc3339975420900b77a51;
measurement4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12 unchanged.
Draft81 bullets, SHA bb995e649d578556b6e581af65e672e095337da808961accf59418c1acb944da.
Fixed ruler,ceilings,history,versions,packages,workflows and protected art unchanged.

### Preserve both blockers and paired next steps

08cd97d79b67cab4b8d19bfd493293e997dec528: Skip785ms → Escape Cosmos1313ms → unsolicited
Cosmos/Milky Way3930ms before Notifications input. Unattributed/OPEN;95c9a1f nonrecurrence is
not repair. c57aaaebc656f2e2d15705601fe1a2a73cf15f1f: Runtime.evaluate timeout after23 native
phone inputs and landscape Settings Close while restoring390×844. Pending expression unknown;
cleanup read Cosmos/closed panels/390×844, all4 debugger pauses resumed, no lasting hang established.
Both exact audits/evidence remain immutable: audits/UI_U1_NAVIGATION_DIAGNOSTIC_20260906.md and
audits/UI_U1_COMPACT_CONTROLS_20260906.md. The new key-helper finding does not establish either
older cause; old normal-review helper unchanged. No wait/deadline increase/navigation guard/retry.

Codex: requested correction and scoped evidence retention complete; stop for Nick's visual review.
Separately bounded restoration-expression diagnosis remains the next technical work. Fresh resume:
audits/UI_U1_SURVEY_CHARTERS_RESUME_20260906.md. Claude: Nick need not open Claude now; preserve
anthropic/mac/unmerged173c806, no copying/merge or repeated battery. No PR or hosted step now;
future openai/mac → develop integration requires separate exact hosted authority. No U2–U4,
Phase2, full normal review, Slice/phoneGlass/full chain or integrated-pilot work. Develop/main/live unchanged.

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
