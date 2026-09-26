# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · PROCEDURAL_CHARACTERISTICS · CREATURE_ANIMATION · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS · LOCAL_AI_GENERATION) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## CLAUDE SESSION HANDOFF — 2026-09-26 (session 2) · THE GENERATED CREATURE PIPELINE IS THE PRIORITY
Self-contained for a fresh Claude session. Codex's own block follows below. Older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md`.

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit that adds this block. Every commit is signed G with the repo keychain key (`git-ssh-sign-cf`), and `origin` is HTTPS via `gh`.
- **Codex:** merged through `bfe76a6b` (G5 sizes/transport/stage admission). Before that: `d809c53b` (parked gameplay, the G5 engine and its native proof: five crabs finished, delivered byte-exact, 0 phone model constructions). Before merging again, read `/Users/nick/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md` (read-only) and run `git log HEAD..openai/mac`. Codex's current focus, per Nick: finish the preserved parked gameplay (Forge Training, the living-portrait decision) BEFORE its G5 engine work.
- **Gate:** `node tools/check-profile.mjs --profile=develop` (from `port/v2`) gives **5,635 pass; the ONLY red is I5** (`current-producer-authorities`, "binds every live memory budget").
  - Run it on a QUIET tree. A commit during the run produces a spurious "Source changed during authority read".
  - Also run by hand, all clean this session: `npm run typecheck` (root, app and worker), `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** https://dev-celestialfrontier.github.io serves `d60c4f95` (G4, the gated G5 card path, Codex's recovered gameplay). Evidence is in `audits/DEV_PUBLISH/d60c4f95f232`.
- **develop** is still `c1791e21`. PR #43 is open. No hosted attempt: I5 is red (D5).
- **Disk:** about 230 GiB free. No agent worktrees are live, and the limb-counter branch is merged (it had no worktree). The newest 2 preview packages are kept.

**The priority: the Generated Creature Pipeline** (`audits/GENERATION_PIPELINE_20260926/PROGRAM.md`, Nick D22/D23)

| Stage | Owner | State now |
|---|---|---|
| **G1 auto-author** | Claude | **v5 adopted, gate NOT met.** Corpus **12/40**. Codex's independent **G2 quadruped pilot: 10/20** ADMIT + PASS_STATIC, zero hand edits. Mutation battery erased **31/34**, duplicated 26/27, flip 34/34, wrong family 34/34 (the limb counter, merged from `claude/t1-limb-counter`). All five of Codex's blocking review findings are fixed. Rejected with numbers: reference shopping (D25) and thin-part nudging. `audits/G1_AUTO_AUTHOR_20260926/README.md` "Session 2". |
| G2 library at scale | Codex | Pilot delivered (20 quadrupeds + 120 derived-mask candidates, `audits/G2_QUADRUPED_PILOT_20260926`). Next families are Codex's. |
| **G3 on-demand delivery** | Claude | Live. **Card path now browser-smoked PASS** (online library cards, offline core fallback, negative control): `audits/G3_ART_DELIVERY_20260926/card-smoke/`. |
| **G4 selection** | Claude | **Landed and live.** `paintedArtV2`, one resolver for card and stage: exact → same Earth profile group → nearest same-anatomy visual-gene variant → v1 stand-in. Sturgeon and Reef Shark now draw sturgeon- and shark-shaped procedural fish. 7 tests with controls. `audits/G4_SELECTION_20260926/README.md`. |
| **G5 finisher in the game** | Claude routes, Codex engine | **Card path in the game behind `?finish=1`** (session 3, on Codex's `bfe76a6b` unblock); stage waits on C45(a). Earlier: **Codex's engine landed (`26a4bc57`, merged). Claude's routing layer v1 landed:** `creature-finish-route.ts` (tier, source, identity, store-only lookup, desktop enqueue, finished → card-master kernel) and the card `finished` hook; 5 tests on real fits with controls. NOT yet wired into `main.ts`: the desktop `createInfer` adapter and `?finish=1` wiring are next. Stage-loader and phone-delivery shapes asked in C41. `audits/G5_ROUTING_20260926/README.md`. |

**Why G1 is still red, and what moves it**
- **The corpus gate (≥ 30/40) is near-unreachable by construction.** 6 singleton families, sparse radial/serpent/insect families, and the hand control itself scores only 30/40.
  - **D24 (Nick):** measure G1 on the independent G2 pilots instead (recommended gate: ≥ 75 % per family with ≥ 2 references, battery ≥ 90 %).
- **G2 refusals are dominated by short tails** (Lynx, Brown Bear, Bison, Camel, Wild Boar: the reference tail chain has no paint). Presence never declares an absence, so these refuse. Levers:
  1. G2 prompts that paint the true tail;
  2. independently accepted short-tailed references;
  3. a measured-truncation presence contract (asked of Codex, C40(a)).
- **Admitted packets refused by Codex's stages:** bird ARAP folds (Eagle, Sparrow, Sandpiper), the Grouse surface split, Mongoose/Tapir RED. Asked in C40(b).
- **Thin parts:** ear tips and fins land beside their paint (Marmot, River Otter, Ibex, Heron, Herring). Loosening them exposes erased far-hind legs that no current check sees. The real fix is a far-limb detector (the next Claude lever).

**Next, in order (Claude)**
1. Read Codex's answers to C41 (loader admission, phone delivery) and C43 (worker size + transport); merge its signed commits. Re-score G1 on any new G2 families as they land (`run-auto.mjs --targets=<pilot.json>`).
2. **G1:** Codex's second review is closed in the runner (v8). Four author levers were tried in v9–v11: the separator is a dead end; the remainder-marker bug is fixed; the Eagle's red is its tail outline (handed to Codex); paint-grown parts are net zero. **The author-side levers are exhausted.** Next gains come from the G2 paintings: limbs posed apart and true tails (C44). Re-score each new G2 family with `run-auto.mjs --targets=`.
3. **G5:** card AND stage in the game behind `?finish=1`. The stage uses Codex's C45(a) composition: finished texture, then the individual's morph. Derived ownership evidence for Civet/Eel/Rat/Salamander awaits Codex's review (C46). **Blocked on D26** (Nick: the finisher's alpha = 255 interior rule excludes every 1254 master). Then a real-browser run on a local dev server with the model, and Nick's quality review before the flag is ever on by default.
4. Only after G1 passes (or D24 redefines it): the parked items (audio Stage 4, the mission-return voice, the Kindred picker, wiring Codex's S4/missions/Outposts numbers).

**Nick: D26 blocks the 1254 finisher (recommended: approve alpha ≥ 250 for eligibility, with conditions).** Also D24 and D25 in `audits/MAILBOX/DECISIONS.md`. Also still open: the playtest checklist (`?deviceProbe=1`, `?audioReview=1`, a full journey, `?battle2=1&vs=…` pairs).

**Traps (obey them)**
- **Disk-space law:** `df -h /System/Volumes/Data` at batch start and end; stay ≥ 40 GiB free. At most 4 live agent worktrees; remove each with `--force --force` the moment it merges. No large stashes. Newest 2 preview packages only.
- **Merges:** after resolving, run `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing.
- **Inline `//` comments inside one-line JS statements swallow the rest of the line.** This bit twice this session; use `/* */`.
- **G1 runner caches fits:** `run-auto.mjs` skips intake when `fit/` exists. Use a fresh `--tag` after changing the author.
- **The motion kit refuses an unclassified material.** Auto packets need a real kit material: `SPECIES_MATERIAL`, keyed by the Earth profile.
- **Slice-executing tests** run exact `main.ts` regions. New code inside a slice needs its real function added to that test's env.
- **`tools/run-unit-tests.mjs` builds the PWA pack first.** For quick diagnostics, run `node node_modules/vitest/vitest.mjs run <file>` directly.
- **Codex's sealed inventories** (release/Guide bullets, budgets, pins) are never rebound by Claude. Propose bullets in an audit README (the G4 README has one).
- **The lone original clone** at `/Users/nick/Projects/Celestial-Frontier` is Nick's (`develop`). Don't edit it.

## Current shared sprint handoff — 2026-09-26, C41/C43/C45 batch

### Working state and authority

- Codex worktree `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`; Claude's worktree `/Users/nick/Projects/celestial-frontier-anthropic-mac`, branch `anthropic/mac`. Shared object store; signed commits only, HTTPS origin through gh. No new branches or temporary worktrees.
- Requested Claude history through signed`23bb209e` merged with signed`--no-ff` commit`86ee9347`; no conflicts or markers. Codex implementation checkpoint`bfe76a6b` follows. The final evidence/repair commit carries this handoff; resolve it from `git log openai/mac`.
- Read the other lane's absolute mailbox at run start AND batch end; write only your own. Read `PARALLEL_GIT_PROTOCOL.md` before the next batch. Claude's latest read-only head was signed`129796c8`; C44/C45 were read and answered, but that newer history is **not** merged here. Claude reports it merged`bfe76a6b` and wired the flagged G5 card adapter.
- Nick permits own-branch push only. Budget UNFROZEN; unchanged workflows trigger only PR labels or manual dispatch, so a normal branch push triggers no Actions. No PR/label/hosted/develop/main/release/deploy/version bump in this batch. I5 remains the one acknowledged battery red; no hosted attempt while red.

### Completed work

- **Parked gameplay remains consolidated and complete** from the prior batch: Forge Training and motion-aware living portraits. No parked branch or unfinished stash is needed to retain it. The generated creature pipeline remains the shared priority (D22/D23).
- **C43 size/transport code:** original128–2048 dimensions; right/bottom zero-pad1254→1264, crop back1254 without shifting/resampling original pixels. Transferred ArrayBuffers or legacy `/inputs` refs, exact SHA/length checks before GPU/model engine creation. Existing settings, alpha bytes, labels/binding and conservation checks unchanged. Corrupt/detached/shared/resizable/ambiguous refs refuse. Eligibility now refuses before engine construction too.
- **C41 stage/phones:** private per-individual admission after original rig preflight plus genuine master/binding/label pins and finish conservation. Phone delivery requires BOTH PNG and receipt entries at `library/creature-finish/<exactkey>/` in bundled G3 authority. No delivered originals published here. Supplementary label pins cover34fits; Civet/Eel/Rat/Salamander still refuse missing labels.
- **C45 CARD = STAGE seam:** verified finished pixels → existing individual palette remap → every-alpha-byte check against private baseline → unchanged seam guard. Fixed an in-place alpha alias in ordinary morphs too. Fifteen focused admission/pinned/morph tests pass. Claude can now wire stage with both `finishedAtlas` and `atlasPixels`; API/evidence in `audits/G5_ADAPTER_UNBLOCK_20260926/C45.md`.
- **G2 family pilot:**20 untouched1254 originals (five each birds/fish/serpents/insects), exact canonical identities/prompts/style hashes, one sheet and independent geometric observations in `audits/G2_FAMILY_PILOT_20260926`. No hand authoring or game admission. Full true tails requested and visibly retained; overlaps and unwanted markings remain findings. C44's later planted-stride/full leg-gap wording is in the compiler for subsequent bird/quadruped packets; these20 retain their earlier prompt receipts.
- **One G4 copy remeasurement:**120 ordered release bullets, SHA`aa5bc1c4583f685f6fe7caff9ed37636b565e290be351011dec0855fc85ef6f0`;41 Guide topics,5 briefings. G4 bullet/Compendium paragraph, Slice and Glass authorities and missing-row controls agree. `audits/G4_COPY_REMEASURE_20260926` retains the measurement and46 focused passing checks.

### Open gates and exact next work

1. **Nick-only alpha eligibility decision is pending:** keep alpha===255, or allow alpha>=250 for the editable interior while retaining all original alpha bytes, the four-pixel boundary and conservation gates. The one native1254 Cougar run on signed`bfe76a6b` refused with `No editable creature interior`; no inference/output was produced. A pinned read-only inventory proves ZERO labels-present1254 masters eligible (only five880crabs pass). Do not rerun unchanged inputs or claim1254 native acceptance. If approved, change eligibility with controls and run one fresh native1254 proof on clean signed source. Otherwise record C43 native proof blocked. Evidence: `audits/G5_ADAPTER_UNBLOCK_20260926/{README.md,eligibility-inventory.json,native-bfe76a6b-refused}`.
2. **Six G1 author/fit reds stay open:** Grouse support split, Eagle/Sandpiper folds, Sparrow foot limit, Mongoose blended-presentation limit and Tapir compression/fold. One generic contact refinement was rejected; no hand fixes or relaxed gates. The runner's omitted presentation-failure reporting is repaired. Full findings/reproduction in `audits/G1_FIT_REPAIR_20260926`. C44 further identifies Eagle's under-owned tail and Sparrow's landmark limit. These need automatic source-evidenced ownership/landmarks and the unchanged static/native gates.
3. **Claude:** consume Codex's signed final commit from the shared store, wire the additive stage seam, re-score the20 new G2 packets, and create NEW candidate derived-label audit packets for the four missing sources under C45.md's provenance/overlap/coverage controls. Do not alter original fit evidence or call derived ownership an anatomical observation. Civet's opaque master is a separate card limitation. Native1254 original publication waits for a real output and its receipt.
4. **G1 remains red, S4/broad generation parked.** D24's alternative denominator is undecided; old gate stands. D25 reference shopping remains OFF. No fit static/semantic/quality acceptance is inferred from library generation, unit tests or a RESOLVED status.

### Final verification and cleanup

- Browser-free `node tools/check-profile.mjs --profile=develop`: **5,635 PASS; I5 only FAIL**,2 expected failures,2 skips across560 files. All seven manual owners PASS: root/app/worker TypeScript, artaudit, overridecheck, speccheck, overridecontrol. Logs and exact changed-code hashes: `audits/G5_ADAPTER_UNBLOCK_20260926/final-battery`.
- Root validate PASS: zero boot errors,1010 Earth renders, unchanged50-probe fingerprint. Worker regressions, C41/C45 controls and copy mutation controls pass. Initial test-only count/type failures are retained in `pre-repair-battery`; both corrected without weakening assertions. No full browser certificate or physical-iPhone proof is claimed.
- Startup approved-tool check PASS, no eligible updates; receipt in G5_ADAPTER_UNBLOCK_20260926. Free disk **227GiB**, above40GiB floor. Removed82.2MB of ignored rejected-fit/prepared-input scratch; kept full reports/originals/hashes/reproduction. Only3 permanent worktrees, no stashes, newest2 previews retained; image-tool originals remain in their original location.
- Next Codex: resolve the actual alpha gate, then proof and remaining automatic-fit repair. Next Claude: shared-store merge/stage wiring/G1 re-score and derived-label evidence. **Nick need not open the other app or relay this handoff.** No PR or hosted attempt is requested.
