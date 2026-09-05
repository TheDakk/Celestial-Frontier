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

## SESSION HANDOFF — 2026-09-05 · BATCH 4 · STEP 2c BROWSER BOUNDARY CORRECTION

### Morning report

Core, Starter Charter2a and deterministic descent2b are accepted and pushed. Latest pushed
checkpoint8546ad225d485541b377bef62db50c6c841256d6 at10:33:35UTC includes accepted2b source
879cad4e58b2d8d6cb924964f9a592e346e36dce. Paragons2c is now implemented and full fast is green;
its first signed-source Slice stopped on the saturated-Charter wave-off boundary. Neither phone ran. The exact red is retained; the bounded diagnostic-hold/serialization-stamp correction now passes full fast (292 files / 3,046 tests / 1 skip). A new signed-source browser run is next. Full exact failures and evidence remain in
`audits/BATCH4_OVERNIGHT_REPORT_20260905.md`.

OpenAI/Codex on macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`, branch
`openai/review-batch4-gameplay-20260905`, matching origin. Base develop9ea01041dcdc711190bbf909ea8bb743cd993734.
Clean openai/mac84b6f22 and parkedcf1b9a7 remain untouched. Nick restored the existing1Password
signer; SSH authenticated asTheDakk and checkpoint pushes work. No signed history was rewritten.

| Step | Commit SHA | Pushed UTC | Fast gates | Browser gates |
| --- | --- | --- | --- | --- |
| 1 signed core integration | Merge `e77e5e09a0840a2ad7d33a81c95c7bc784523ae5`; accepted source `b572dbf5840c4fee5cbfbfa175b14e1c07f1c3cd` | `419a00bd06971ed2f1e7f1367b73842702a099ea` pushed 2026-09-05 08:30:49 | Typecheck/artunused PASS; 286 files / 2,964 passed / 1 skipped; four workers | Slice PASS 368.569s; small/large phone PASS 15.471s / 15.551s, both zero findings/instrument failures |
| 2a accepted st-scan | Accepted source `4a82f161da2a7b3c4a029421d8a16c23fc62955d`; documentation successor follows | `2ae776b17244d8207cb37ee45d9adf52eb99f21d` pushed 2026-09-05 08:48:02 | Typecheck/artunused PASS; 286 files / 2,980 passed / 1 skipped; four workers | Slice 369.674s; small/large phone 15.652s / 15.871s PASS; zero findings/instrument failures |
| 2b descent/wave-offs | Accepted source `879cad4e58b2d8d6cb924964f9a592e346e36dce`; documentation successor follows | `8546ad225d485541b377bef62db50c6c841256d6` pushed 2026-09-05 10:33:35 | Typecheck/artunused PASS; 290 files / 3,019 passed / 1 skipped; four workers | Slice 373.47s; small/large phone 15.576s / 16.338s PASS; zero findings/instrument failures |
| 2c 50-Paragon hunt | Implemented; signed source follows | Acceptance pending | Typecheck/artunused PASS; 292 files / 3,046 passed / 1 skipped | Pending clean-source sequence |
| 2d exact-instance progression | Six reviewed patch layers prepared; not integrated | Pending preceding accepted checkpoint | Preparation only; no product acceptance claimed | Not run |
| 2e mature Atlas | Two reviewed patch layers prepared; not integrated | Pending preceding accepted checkpoint | Preparation only; no product acceptance claimed | Not run |
| 3a authority controls | Already implemented in signed core and verified by all full suites | Pending ordered stretch checkpoint | Malformed/shallow mint, public clone refusal and three WorldConfig controls present | No UI change; no extra browser run |
| 3b same-owner lists | One bounded Research-ID alias patch prepared; not integrated | Pending ordered checkpoint | Independently authored browser lists retained | Not run |
| 3c bounded extraction | Not started; narrow landing-card presentation owner identified | Pending ordered checkpoint | No code extraction claimed | Not run |
| 3d phone analysis | Existing accepted2a evidence analyzed; fresh profile still pending | Pending final clean-source measurement | Interim measured diagnostics only; limits below | Existing two-row results only; no new run |

### Decisions made unattended and current implementation

The fifty authored Paragons retain their fixed genomes and exact canonical home worlds.
Explicit Discover Life at an eligible home adds only its catalogue record in the same Bioscan
receipt/CAS; creatures, specimens and Yield are retained. Found Binder rows Inspect their exact
existing record; missing rows use existing reach-checked travel. Ten records unlock the separate
once-only authored+120 Stardust Claim. New provenance binds index to exact genome; record pair
keys must equal record IDs. An already-scanned pre-feature development home retains its explicit
refusal; no backfill or repeated hazard is invented. Static portraits remain unchanged.

Guide, Training and all eight current references agree. New source inventory names exactly87
pure-domain files and one internal deterministic Paragon export; independent expectations,
compositor/mint restrictions and forbidden-global controls remain strict. Missing existing Main
import, unused test import and exact-list omissions were corrected; all failures remain recorded.
Full fast:292files/3,046tests/1skip; typecheck/artunused PASS. Browser acceptance pending.
Current79-bullet hash62f3490095d87bb99903ddf3e5ad0e5f03dadbe38da874835bd9f98654756194;
Compendium producer6f8e0ee67716ac716e13ce5acbe9eaebfaeb75bdffc96c354d098bfecff0d1d3.
Measurement4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12, ruler, ceilings
and samples unchanged. Exact-instance progression2d and mature Atlas2e remain prepared/unintegrated.

### Latest boundary status

Signed15d7a99 stopped at the later collision wave-off caller because phoneCardActionCheck was outside its lexical scope. The single unchanged helper now lives at module scope; all callers and geometry are retained. Full fast passes292files/3,047tests/1skip. Both exact browser reds are retained. A new signed clean-source browser sequence follows; no phones have run on the red sources.

### Parked scope and paired handoff

Weeklies, Forge Training, living portrait preview and unrelated bulk WIP copy remain parked.
Reserved care/bond/missions, random loot/affix/socket/vendor, achievement quantities,
conquest–imbue coexistence and extra Guardian cache remain excluded. Audio-source backup is
outside this batch. Fresh v2 has no legacy import door; codec/evidence importBlob and planned
Glass ledgers remain. Arc4.5/Arc5.5 HUMAN and real-device Gate C remain open. Protected portraits,
CI/policy and release remain untouched; SceneMemory stays quarantined. Existing2a phone numbers
in `audits/BATCH4_PHONE_EVIDENCE_20260905.md` are historical diagnostics, not current2c proof.

Codex commits this fast-green2c implementation, runs exact clean-source Slice→small→large,
stops first red, and accepts/pushes only after green; then2d→2e→stretch/final in order.
Claude reviews pushed checkpoints through Git; Nick need not open Claude now. Proposed PR base
`develop`, source`openai/review-batch4-gameplay-20260905`; final title/body must describe the final
accepted scope. No PR, label, hosted attempt, merge, purchase or release authorized.
BudgetUNFROZEN/PUBLIC, privatefallback3,000; branch pushes trigger no workflow.
