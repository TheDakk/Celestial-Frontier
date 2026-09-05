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

## SESSION HANDOFF — 2026-09-05 · OVERNIGHT BATCH 4 · BLOCKED BY SIGNING

### Morning report

Core and accepted Starter Charter2a are complete and pushed. Descent2b is implemented and its
consumer correction passes all fast checks, but 1Password signing failed twice and GitHub SSH
preflight failed. The correction and this handoff remain local and staged; the browser gate
requires a new clean signed commit. Subsequent ordered checkpoints are blocked, with prepared
layers preserved for resumption. Full exact reds, per-item WIP disposition, decisions, source
identities and copy-ready held PR fields are in `audits/BATCH4_OVERNIGHT_REPORT_20260905.md`.

OpenAI/Codex, macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`, branch
`openai/review-batch4-gameplay-20260905`, tracking its matching origin. Final local Git HEAD
`d469c499dfaa7d1e09a3755299246b4949c89ee7`; last pushed `2ae776b17244d8207cb37ee45d9adf52eb99f21d`
at08:48:02UTC; base develop `9ea01041dcdc711190bbf909ea8bb743cd993734`. `openai/mac` remains
untouched at84b6f22; original parked signed WIPcf1b9a7 remains preserved. No signed history was rewritten.

| Step | Commit SHA | Pushed UTC | Fast gates | Browser gates |
| --- | --- | --- | --- | --- |
| 1 signed core integration | Merge `e77e5e09a0840a2ad7d33a81c95c7bc784523ae5`; accepted source `b572dbf5840c4fee5cbfbfa175b14e1c07f1c3cd` | `419a00bd06971ed2f1e7f1367b73842702a099ea` pushed 2026-09-05 08:30:49 | Typecheck/artunused PASS; 286 files / 2,964 passed / 1 skipped; four workers | Slice PASS 368.569s; small/large phone PASS 15.471s / 15.551s, both zero findings/instrument failures |
| 2a accepted st-scan | Accepted source `4a82f161da2a7b3c4a029421d8a16c23fc62955d`; documentation successor follows | `2ae776b17244d8207cb37ee45d9adf52eb99f21d` pushed 2026-09-05 08:48:02 | Typecheck/artunused PASS; 286 files / 2,980 passed / 1 skipped; four workers | Slice 369.674s; small/large phone 15.652s / 15.871s PASS; zero findings/instrument failures |
| 2b descent/wave-offs | Local signed product `d469c499dfaa7d1e09a3755299246b4949c89ee7`; correction staged | Blocked: 1Password signer and GitHub SSH | Typecheck/artunused PASS; 290 files / 3,018 passed / 1 skipped | First source Slice RED at33.823s on exact Earth label; corrected-source run blocked before commit; phones not run |
| 2c 50-Paragon hunt | Seven reviewed patch layers prepared; not integrated | Blocked by required preceding clean signed checkpoint | Preparation only; no product acceptance claimed | Not run |
| 2d exact-instance progression | Six reviewed patch layers prepared; not integrated | Blocked by required preceding clean signed checkpoint | Preparation only; no product acceptance claimed | Not run |
| 2e mature Atlas | Two reviewed patch layers prepared; not integrated | Blocked by required preceding clean signed checkpoint | Preparation only; no product acceptance claimed | Not run |
| 3a authority controls | Already implemented in signed core and verified by all full suites | Separate ordered checkpoint blocked by signing | Malformed/shallow mint, public clone refusal and three WorldConfig controls present | No UI change; no extra browser run |
| 3b same-owner lists | One bounded Research-ID alias patch prepared; not integrated | Blocked by checkpoint prerequisite | Independently authored browser lists retained | Not run |
| 3c bounded extraction | Not started; narrow landing-card presentation owner identified | Blocked by checkpoint prerequisite | No code extraction claimed | Not run |
| 3d phone analysis | Existing accepted2a evidence analyzed; fresh profile still pending | Fresh clean-source measurement blocked | Interim measured diagnostics only; limits below | Existing two-row results only; no new run |

### Decisions made unattended

Keep the configured signer and exact-source browser rule. Both commit attempts exited128 with
`error: 1Password: failed to fill whole buffer` / `fatal: failed to write commit object`.
SSH then exited255: `signing failed ... communication with agent failed` / `Permission denied
(publickey)`. No GitHub write followed. Computer Use permissions were pending, so no sign prompt
could be inspected. This external blocker is not an approval-review rejection or product decision.
No product revert occurred because it would require the same unavailable signer.

Current fast-tested code is HEAD plus the staged product-correction patch SHA256
`bd43d66b8ab64443180737d157b752af36195c3fadb5f9817e7f5cf7eb1f6a8b`. All290files/3,018tests pass
with1skip, typecheck/artunused pass; Glassselftest passes; root50fingerprints remain identical;
policy selftest81 controls passes. Descent's corrected-source browser acceptance remains pending.
Latest all-green browser source is accepted2a `4a82f161da2a7b3c4a029421d8a16c23fc62955d`.

Descent choices: authored type/biome/static weather; exact canonical learning+20/cap5; legacy
seed-only learning binds on its first verified encounter because original address is unknowable.
Earth/Training/canonical revisit use no draws; ordinary attempts use two named draws/one receipt.
The existing Mercury/collision flows permit one additional explicit Land only after proving an
actual durable wave-off and guaranteed next approach, with unchanged rewards and unrelated state.
All previous reds and focused-control corrections remain in the report; no unchanged browser retry.

Current78-bullet hash `af45980c0e67feebc027465f7a864c7ac80f351806b189d3e44fda465247dc53`;
Compendium producer `8c30457fe75bc5d148d1c184547221b50d32f5079b251200425665677c123d0c`.
Measurement `4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12`, ruler,
ceilings and samples unchanged. No prepared79-bullet Paragon inventory is live.

### Interim P2-phone findings

Existing accepted2a Edge phone evidence records replacement readiness734.8/638.9ms,
rendererDPR2, combined backing pixels1,454,080/3,015,840, and released canvases1×1.
Slice recorded27ms galaxy rebuild. These are historical diagnostic samples, not current2b
proof, cold-boot/TTI, native allocation, populated art-cache or physical-iPhone measurements.
Full evidence and limitations are in `audits/BATCH4_PHONE_EVIDENCE_20260905.md`.

### Parked boundaries and recovery

Weeklies, Forge Training, living portrait preview and unrelated bulk WIP copy remain parked.
Paragons, individual progression and mature Atlas are prepared but unintegrated; no acceptance
is claimed. Reserved care/bond/missions, random loot/affix/socket/vendor tables, achievement
quantities, conquest–imbue coexistence and extra Guardian cache remain excluded. Audio-source
backup remains outside this batch. Fresh v2 has no import door; codec/evidence importBlob and
planned Glass ledgers remain. Arc4.5/Arc5.5 HUMAN and real-device Gate C remain open. Protected
art locks, workflows and Actions policy are byte-identical to develop; SceneMemory stays quarantined.

A verified signed-HEAD Git bundle and hashed recovery pack are retained in ignored
`port/v2/apps/game/smoke/overnight-recovery-20260905/`. The pack preserves the uncommitted change,
prepared2c/2d/2e layers and reference patches, scripts and exact source manifest. This local copy
does not substitute for the blocked remote push. Full source paths and commands are in the report.

### Paired handoff — next action

Codex: after 1Password SSH signing is available, verify this same checkout/branch, inspect and
normally commit the staged correction, then run clean-source Slice→small-phone→large-phone.
Stop first red. Accept/push2b only after green, then integrate2c→2d→2e and complete stretch/final
checks. Do not reapply2a/2b product layers or rewrite existing signed commits.
Claude: the remote is only through accepted2a; read the completed candidate after Codex can push
this handoff and subsequent checkpoints. Nick need not open Claude now. Proposed held PR base
`develop`, source `openai/review-batch4-gameplay-20260905`; exact title/body in the full report.
Nick separately authorizes the hosted agent lane after morning review. Budget UNFROZEN, PUBLIC,
private fallback3,000, zero hosted attempts authorized. No PR, label, merge, release or purchase.
