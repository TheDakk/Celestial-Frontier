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

## SESSION HANDOFF — 2026-09-05 · BATCH 4 FINAL REVIEW HANDOFF

## Review correction — tracked v1 test source, 2026-09-05

Signed correction source: `2881cda1818b4d81b98f10da63c442b9f837d504`, successor to reviewed `bc42dbc`.
Only the travel-presentation test's module-level legacy read changes to
`readTrackedV1Source().script`. The sixth test still uses fs/fileURLToPath, so those
imports remain. All six test bodies/assertions, product files, tools, pins and authorities are unchanged.

With root `main.js` absent: typecheck PASS (2.470 s), artunused PASS (1.749 s),
Vitest PASS (301 files / 3,100 passed / 1 skipped; 61.000 s), and
`node tools/check-profile.mjs --profile=develop` PASS once (67.410 s).
The profile also passes artaudit (34 sources), overridecheck (1,014 keys) and speccheck
(454 fields). Both full suites used local `VITEST_MAX_WORKERS=4`; selection and timeouts
are unchanged. The ignored bootstrap was restored byte-for-byte; unrelated .DS_Store is untouched.

The first unrestricted Vitest run stopped at 299 files passed / 2 failed: the existing
arc4-acquisition-planner 5,000 ms and evidence-chain-tools 20,000 ms timeout limits.
No ENOENT occurred. That red is retained; only the local worker cap changed before the passing run.
Initial / passing-suite / profile log SHA256:
`d5ffb8673de34e5a5f4c0d06923c02a29c81e310e1b7d50ad17a65e07cc555ce` /
`18e5f66f378fefe1c6d4b4423927d46c093773810a208cf329477bdb6c3a9f5e` /
`09c98d45f492b34549eecb5f6754d8448bca5a630d8e5ad5e04d59dc2132092f`.

Codex publishes the signed correction and the three requested handoff documents; the final
handoff names the reporting successor's exact pushed SHA. Claude may fetch that head from its
own anthropic/windows checkout; this work is not in develop. Nick separately authorizes the
single agent-lane attempt. Budget UNFROZEN, PUBLIC, zero hosted attempts authorized.
No PR, label, hosted attempt, merge or release was performed.

## Morning report — Batch 4 complete, 2026-09-05

The signed core and all five primary gameplay items are accepted and pushed. Stretch 3a–3c
is complete. Step 3d's first analytical pass is recorded; answerability and throttled galaxy
timings remain parked because the existing profiler could not resolve them. No product step
was reverted. All final required correctness checks passed.

OpenAI/Codex worked on macOS in `/Users/nick/Projects/celestial-frontier-openai-mac`,
branch `openai/review-batch4-gameplay-20260905`, with its matching origin branch.
Base develop is `9ea01041dcdc711190bbf909ea8bb743cd993734`; a final fetch confirmed that base unchanged.
The original `openai/mac` history stays at `84b6f22`; parked backup
`cf1b9a7843200ecc281c5113b4139909dc0e3a29` remains preserved.

**Final validated head: `b173353b9e273c4b223e8ee8d6ee181081f79b4a`, pushed at 13:11:29 UTC.**
This morning report is carried in a signed documentation-only successor. Its own commit hash
cannot be embedded in its contents; the final user handoff records that successor's exact
pushed SHA and time. Browser evidence below names the validated head, not the later report.

### Checkpoints

All times are UTC on 2026-09-05. Fast counts are test files / passed tests / skipped tests.
Browser durations are command durations, not player-response timings. Every accepted phone
pair had zero findings and zero instrument failures.

| Step | Commit SHA | Pushed UTC | Fast gates | Browser gates |
| --- | --- | --- | --- | --- |
| 1 signed core integration | Merge `e77e5e09a0840a2ad7d33a81c95c7bc784523ae5`; accepted source `b572dbf5840c4fee5cbfbfa175b14e1c07f1c3cd` | `419a00bd06971ed2f1e7f1367b73842702a099ea` pushed 2026-09-05 08:30:49 | Typecheck/artunused PASS; 286 files / 2,964 passed / 1 skipped; four workers | Slice PASS 368.569s; small/large phone PASS 15.471s / 15.551s, both zero findings/instrument failures |
| 2a accepted st-scan | Accepted source `4a82f161da2a7b3c4a029421d8a16c23fc62955d`; documentation successor follows | `2ae776b17244d8207cb37ee45d9adf52eb99f21d` pushed 2026-09-05 08:48:02 | Typecheck/artunused PASS; 286 files / 2,980 passed / 1 skipped; four workers | Slice 369.674s; small/large phone 15.652s / 15.871s PASS; zero findings/instrument failures |
| 2b descent/wave-offs | Accepted source `879cad4e58b2d8d6cb924964f9a592e346e36dce`; documentation successor follows | `8546ad225d485541b377bef62db50c6c841256d6` pushed 2026-09-05 10:33:35 | Typecheck/artunused PASS; 290 files / 3,019 passed / 1 skipped; four workers | Slice 373.47s; small/large phone 15.576s / 16.338s PASS; zero findings/instrument failures |
| 2c 50-Paragon hunt | Accepted source `16cb949f2caa0398708f195f39c43822df336780`; documentation successor follows | `4647b21cca897f34095daa5b4f5ef12ab3f3ba5c` pushed 2026-09-05 11:58:07 UTC | Typecheck/artunused PASS; 292 files / 3,047 passed / 1 skipped; four workers | Slice 370.62s; small/large phone 15.875s / 16.029s PASS; zero findings/instrument failures |
| 2d exact-instance progression | Accepted source `a6c5b4ac8d6c02337dd0b45a6b1cf667c191b303`; documentation successor follows | `63685b8a6378d423db9fccf4211100403964bddd` pushed 2026-09-05 12:09:41 UTC | Typecheck/artunused PASS; 297 files / 3,071 passed / 1 skipped; four workers | Slice 371.504s; small/large phone 16.058s / 16.1s PASS; zero findings/instrument failures |
| 2e mature Atlas | Accepted source `890ab26a02a332327228e73eb7986e62b10e281b`; documentation successor follows | `f21feed5881b478bb2aeec4c1af7e93b076a870a` pushed 2026-09-05 12:44:13 UTC | Typecheck/artunused PASS; 301 files / 3,100 passed / 1 skipped; four workers | Slice 375.248s; small/large phone 16.533s / 15.995s PASS; zero findings/instrument failures |
| 3a authority controls | Accepted source `f21feed5881b478bb2aeec4c1af7e93b076a870a`; documentation successor follows | `07965ee86256929529a9f6207922eef97bd5e5a9` pushed 2026-09-05 12:45:59 UTC | Typecheck/artunused PASS; 301 files / 3,100 passed / 1 skipped; four workers | No app-source changes; browser not repeated at this checkpoint |
| 3b same-owner lists | Accepted source `34ecd3ab57d7af9b592c87874a4ee9683e3506d9`; documentation successor follows | `7ebed5c4caaaa1396766dd2192352647efb17489` pushed 2026-09-05 12:55:50 UTC | Typecheck/artunused PASS; 301 files / 3,100 passed / 1 skipped; four workers | Slice 384.468s; small/large phone 16.319s / 16.557s PASS; zero findings/instrument failures |
| 3c bounded extraction | Accepted source `b76b69aa7099f3d7db99380e6687be18be7ead51`; documentation successor follows | `4fa82d0c9fd648fcb05497552e244d594b1a959f` pushed 2026-09-05 13:05:48 UTC | Typecheck/artunused PASS; 301 files / 3,100 passed / 1 skipped; four workers | Slice 374.555s; small/large phone 16.742s / 16.167s PASS; zero findings/instrument failures |
| 3d phone analysis | Accepted source `b173353b9e273c4b223e8ee8d6ee181081f79b4a`; documentation successor follows | `b173353b9e273c4b223e8ee8d6ee181081f79b4a` pushed 2026-09-05 13:11:29 UTC | Typecheck/artunused PASS; 301 files / 3,100 passed / 1 skipped; four workers | Slice 386.147s; small/large phone 16.466s / 16.521s PASS; zero findings/instrument failures |

### Final validation

The new raw-evidence archive is retained locally, outside Git. Automatic approval review rejected its public upload because raw local logs and phone evidence were not specifically authorized for that destination. Its publication is parked; this report retains exact source, result and artifact identities. No archive content is included in this reporting push.

At the final validated source: typecheck and artunused PASS; **301 test files, 3,100 passed,
1 skipped**, four workers with unchanged selection and timeouts. Glass selftest PASS in
1.996 s. Slice PASS in 386.147 s; small/large phone PASS in
16.466 / 16.521 s. Root validation PASS with all **50 legacy
fingerprints unchanged**, and Actions budget-policy selftest PASS with **81 controls**.
The fast suite checked the unchanged product/test tree before signing the evidence-document
commit; the final selftest/browser/root/policy checks ran on the exact clean committed head.

- Slice terminal log SHA256: `751ca0d127d5323aaa9e5cab07af922b4fb97b89b9de270c4afbdab1dc35824b`.
- Small phone: `20260905131837619-84499-5f1df329d7fc`;
  report SHA256 `ec558fc2838e2881161b7c6ef3d2f5417c20ece6d2045e4762c22dfcd3dd7adf`.
- Large phone: `20260905131854210-84645-6fbf165724b3`;
  report SHA256 `7f5d8ecf513e163cc13cb8c992c1a10d7b7333a646fe7081c4ac6e67fbe56f21`.
- Current draft: **79 outcomes**, rendered ordered-li SHA256
  `351c1279d7b36fa795a414f4d56a6237d57c0575675b80f69fcbc5471c6ae042`.
- Compendium producer: `c1e784b7f32016066b0a41a81b5917b63c0712ef876a35d7ff3d7a90fe9acce4`.
  Measurement authority, ruler, ceilings and samples are byte-identical to the base.
- All workflow files, the Actions policy and all three protected portrait-lock references
  match the base. No artlock run, hosted attempt, label, PR, merge into develop/main or release.

Exact command records, immutable phone metadata and every earlier red are retained below.
These are local Edge/CDP phone diagnostics; they do not supply full twelve-row certification,
canonical Chrome named verification, native heap evidence or physical iPhone/Safari proof.

## Signed WIP disposition

The signed WIP `cf1b9a7843200ecc281c5113b4139909dc0e3a29` remains preserved as provenance. Its primary items were recovered individually onto the current core; the whole WIP was not applied.

| WIP item | Final primary disposition |
| --- | --- |
| Accepted Starter bioscan Charter | Recovered in 2a: acceptance followed by a later explicit Bioscan, the authored 15 Stardust and exact Earpiece reward; no earlier Survey/Capture backfill and no weekly lifecycle. |
| Descent and wave-offs | Recovered in 2b: deterministic descent, the authored descent gear effects, canonical failure learning at +20 percentage points per failure capped at five, and canonical first binding for unresolved legacy seed-only history. No Hull descent reduction was introduced. |
| Fifty-Paragon hunt | Recovered in 2c: the authored 50 exact-home catalogue discoveries, source-validated identities, found-entry Inspect versus missing-entry travel, and a separate `para10` Claim for +120 Stardust after ten finds. Protected static portraits are unchanged; pre-feature saves with an already-Bioscanned home retain the explicit refusal, with no backfill. |
| Exact-instance progression | Recovered in 2d: individual XP, level, class, innates, wounds and recovery display; exact twins and retired snapshots; finite fractional XP preservation; the existing 486 cap and additional innate unlocks at levels 3 and 6. No care, bond, mission or new XP mechanic was added. |
| Mature Atlas | Recovered in 2e: List/Chart, filters, Home, exact-row Remove and one-level eight-second Undo, strict route/receipt/CAS ownership, restoration of an originally absent route as absent, and bounded chart clusters that open existing List actions with focus return. |

| Remaining parked WIP | Reason |
| --- | --- |
| Weekly Charter lifecycle and joins | Weekly generation, acceptance, rollover and reward joins are separate from the accepted Starter bioscan recovery. The primary instructions did not authorize recovering them. |
| Forge Training | The additional Forge lesson work is outside the existing fifteen-card curriculum and the ordered primary scope. Existing Training copy was reconciled only for the recovered mechanics. |
| Living portrait preview | The preview remains outside the gameplay recovery and subject to the separate graphics pilot approval boundary. No protected-portrait or Phase 2 art work is included. |
| Unrelated bulk copy and whole-file WIP replacements | Only copy belonging to the recovered primary owners was carried forward. Bulk Main/Guide/ROADMAP changes cannot replace the current core, independent measurement expectations, current lane policy or dated evidence. |

The WIP's legacy Settings import door, “awaits Nick's real save export” claim and blanket 78-bullet assumption are superseded, rather than future features awaiting recovery. Fresh-start policy, the retained evidence-only codec/import helpers and planned-ledger matching, and independently fixed per-checkpoint release inventories remain authoritative.

Companion care/bond/missions, random loot/affix/socket/vendor tables, achievement reward quantities, conquest–imbue coexistence and an extra first-victory Guardian cache remain reserved product decisions; this is not a claim that each has an implemented WIP owner. Audio-source backup still needs Nick's external destination and remains outside this gameplay batch. Stretch outcomes are recorded below.

## Stretch outcomes

- **3a:** existing focused tests reject shallow/malformed mint registration and public-registry
  clones. The three WorldConfig assertions pin GCELL 42, Sol coordinates 560/170, and frozen
  home/Sol anchors. Full suites exercise them; no duplicate suite or generator change.
- **3b:** Engineering aliases the canonical frozen Research ID tuple. Independently written
  test and browser lists still detect missing or reordered production rows.
- **3c:** the existing landing-card owner now contains the unchanged renderer and presentation
  state type. Main supplies the same escape function and keeps world/save checks and wiring.
  Policy, RNG, receipt/CAS, visible disclosure and accessibility behavior remain unchanged.
- **3d:** current phone, canvas, resource and limited boot evidence is recorded in
  `audits/BATCH4_PHONE_EVIDENCE_20260905.md`. Unresolved profiler timings are parked;
  no instrument change or optimization was made during the measurement-only step.

## Decisions made unattended

- Preserved the signed core as a real merge parent and recovered later WIP by completed owner.
  This retained provenance and the fresh-start boundary instead of restoring stale import code.
- Used authored descent tables and gear with seeded weather. Earth, Training and proven
  canonical revisits roll nothing; ordinary attempts use two fixed SessionRNG draws in one
  receipt/CAS. Wave-offs keep the ship in orbit, floor HP at one and grant no arrival reward.
- Bound unresolved seed-only approach history on its first source-verified canonical encounter.
  The old seed cannot prove its former full address; this retains history without inventing one.
- Kept already-scanned pre-feature Paragon homes explicitly unavailable for new discovery credit.
  Automatic backfill or repeated hazards would invent behavior outside explicit Discover Life.
- Preserved finite fractional XP and used the existing level curve. Rounding would rewrite valid
  creatures. Passive refresh preserves semantic focus with preventScroll and does not steal focus.
- Used bounded chart clusters and existing List actions for overlapping phone targets. Eight-second
  Undo restores the exact retained row and original route state; an absent route stays absent.
- Restored the actual dark Paragon button background after the phone contrast red, and restored
  the missing visible Route unavailable explanation after Atlas's browser red. Gate intent stayed
  intact. Corrected all eight references to say a wave-off leaves the ship in orbit.
- Kept independent expectations while correcting obsolete source spans and narrowly matching
  existing hold/codec-timer owners. Only producer authority and exact source inventories moved;
  no ruler, timeout, workflow, policy or measurement threshold was changed.
- Retained the configured signer through the temporary 1Password failure; Nick's unlock restored
  signing and SSH. No unsigned bypass or rewritten history.
- Parked unresolved profiler measurements because this step explicitly permits measurement only.
  The retained result does not establish whether setup, profiler or product caused the refusal.

## Blocked / reverted

**No unresolved required correctness gate and no product reversion.** The optional raw-evidence archive export is blocked by automatic approval review and remains local; publishing it needs separate authorization. Fifteen browser reds were
corrected on new sources and retained in the audit; no unchanged-source browser retry.
The separate Step 3d measurement remains incomplete and was not rerun:

```text
Source: 4fa82d0c9fd648fcb05497552e244d594b1a959f
Command: npm run perf -- 4
Exit: 1; elapsed: 28.472 seconds
SLICE PERF @ 4× CPU (phone 390×844@3x):
  painted:    1292ms
  answerable: NEVER
  galaxy rebuild (throttled): -1ms
  (v1.8.5 law: painted ≠ answerable — budgets land with plan §20)
SLICE PERF: measurement incomplete — painted, answerable, and galaxy rebuild must all resolve
```

Log SHA256: `dd989f243a7d69411cb4cd4e452061c6e84becfed3221b4c14936641dd2f2c60`.
Answerability and throttled rebuild remain unavailable measurements, not valid timings.
The audit's REDS JSON contains all sixteen retained browser/profile records; full historical
failure output remains below. Temporary signing and SSH failures are resolved.

## Phone findings and remaining human gates

The Step 3c phone samples record replacement readiness of **684.1 / 620.7 ms**, actual renderer
DPR **2**, combined canvas backing pixels **1,454,080 / 3,015,840**, and released canvases **1×1**.
Their disposed audio snapshots have zero use, so they do not prove populated-cache performance.
Slice printed one **29 ms** rebuild; the separate 4× profiler observed paint at **1,292 ms**
but did not resolve answerability or throttled rebuild. These sources remain separately named
in the phone audit. The final unchanged-product phone pair additionally records replacement
readiness of **627.6 / 611.2 ms**.

Native heap/GPU allocations, populated art/audio cache behavior, installed offline pack size and
eviction, physical iPhone/Safari persistence, thermal/battery effects and response-time percentiles
remain unmeasured. SceneMemory stays quarantined. Combined Arc 4.5, separate Arc 5.5 HUMAN
combat review and Gate C real-device v2 persistence remain open. The audiovisual pilot approval
stop stands; audio-source backup still needs the separate external destination decision.

## Proposed PR — review only, leave unopened

**Base:** `develop` at `9ea01041dcdc711190bbf909ea8bb743cd993734`.
**Source:** `openai/review-batch4-gameplay-20260905`; use its final signed reporting head,
whose exact SHA is in the final user handoff. The validated product head is `b173353b9e273c4b223e8ee8d6ee181081f79b4a`.

**Title:** Connect authored expedition systems, creature progression and mature Atlas

**Description:**

Complete the fresh-start v2 expedition loop with authored Research effects, explicit Discover
Life and Flora meals, Scout XP, the accepted Starter Charter, deterministic descent, fifty
Paragons, individual creature progression, and the mature Atlas. Co-deliver Guide, Training,
release copy and current references. Preserve exact authority, one receipt/CAS, deterministic
outcomes and the fresh-start save boundary.

Verify the existing mint/clone and WorldConfig controls, share only the production Research ID
owner, and move unchanged Landing presentation into its existing module. Record the first phone
analysis; unresolved profiler timings and reserved gameplay/art scope remain explicitly parked.

Local validation: 301 files / 3,100 passed / 1 skipped, typecheck, artunused, Glass selftest,
exact-source Slice and both phone diagnostics, 50 unchanged legacy fingerprints and 81 budget
policy controls. The audit records source SHAs, report identities and all prior reds. Claude's
checkout receives this work only after reviewed integration into develop. No hosted result,
release or deployment is included.

## Paired next steps

**Codex:** publish this signed report-only successor and report its exact pushed head. Handle
bounded review corrections on the owned review branch if Nick supplies them. The proposed PR
remains unopened; no generic proceed or hosted authorization is inferred.

**Claude on anthropic/windows:** from Claude's own checkout, fetch origin and read the exact
pushed branch plus this audit through Git. Review the gameplay, persistence boundaries and
parked decisions. Do not copy files or edit the Mac checkout; this work is not in develop yet.

**Nick:** open Claude now for the morning review. After that review, separately authorize the
exact PR/agent-lane attempt. No GitHub action is required before review. Budget UNFROZEN,
repository PUBLIC, private fallback 3,000, **zero hosted attempts authorized** for this campaign.
Develop, main and the live release remain unchanged.
