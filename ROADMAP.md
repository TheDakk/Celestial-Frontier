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
- **Codex:** merged through `d809c53b` (parked gameplay, the G5 engine and its native proof: five crabs finished, delivered byte-exact, 0 phone model constructions). Before merging again, read `/Users/nick/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md` (read-only) and run `git log HEAD..openai/mac`. Codex's current focus, per Nick: finish the preserved parked gameplay (Forge Training, the living-portrait decision) BEFORE its G5 engine work.
- **Gate:** `node tools/check-profile.mjs --profile=develop` (from `port/v2`) gives **5,628 pass; the ONLY red is I5** (`current-producer-authorities`, "binds every live memory budget").
  - Run it on a QUIET tree. A commit during the run produces a spurious "Source changed during authority read".
  - Also run by hand, all clean this session: `npm run typecheck` (root, app and worker), `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** https://dev-celestialfrontier.github.io serves `f8e8aec4`: G4 plus Codex's recovered Forge Training and portrait motion. Evidence is in `audits/DEV_PUBLISH/f8e8aec47cd5`.
- **develop** is still `c1791e21`. PR #43 is open. No hosted attempt: I5 is red (D5).
- **Disk:** about 230 GiB free. No agent worktrees are live, and the limb-counter branch is merged (it had no worktree). The newest 2 preview packages are kept.

**The priority: the Generated Creature Pipeline** (`audits/GENERATION_PIPELINE_20260926/PROGRAM.md`, Nick D22/D23)

| Stage | Owner | State now |
|---|---|---|
| **G1 auto-author** | Claude | **v5 adopted, gate NOT met.** Corpus **12/40**. Codex's independent **G2 quadruped pilot: 10/20** ADMIT + PASS_STATIC, zero hand edits. Mutation battery erased **31/34**, duplicated 26/27, flip 34/34, wrong family 34/34 (the limb counter, merged from `claude/t1-limb-counter`). All five of Codex's blocking review findings are fixed. Rejected with numbers: reference shopping (D25) and thin-part nudging. `audits/G1_AUTO_AUTHOR_20260926/README.md` "Session 2". |
| G2 library at scale | Codex | Pilot delivered (20 quadrupeds + 120 derived-mask candidates, `audits/G2_QUADRUPED_PILOT_20260926`). Next families are Codex's. |
| **G3 on-demand delivery** | Claude | Live. **Card path now browser-smoked PASS** (online library cards, offline core fallback, negative control): `audits/G3_ART_DELIVERY_20260926/card-smoke/`. |
| **G4 selection** | Claude | **Landed and live.** `paintedArtV2`, one resolver for card and stage: exact → same Earth profile group → nearest same-anatomy visual-gene variant → v1 stand-in. Sturgeon and Reef Shark now draw sturgeon- and shark-shaped procedural fish. 7 tests with controls. `audits/G4_SELECTION_20260926/README.md`. |
| **G5 finisher in the game** | Claude routes, Codex engine | **Codex's engine landed (`26a4bc57`, merged). Claude's routing layer v1 landed:** `creature-finish-route.ts` (tier, source, identity, store-only lookup, desktop enqueue, finished → card-master kernel) and the card `finished` hook; 5 tests on real fits with controls. NOT yet wired into `main.ts`: the desktop `createInfer` adapter and `?finish=1` wiring are next. Stage-loader and phone-delivery shapes asked in C41. `audits/G5_ROUTING_20260926/README.md`. |

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
3. **G5, next steps:**
   - the desktop `createInfer` adapter: **blocked on Codex C43** (the worker refuses 1254² masters, 33 of 38, and requires `/inputs/*.rgba` paths). The stage projection `projectFinishedToAtlasV1` has landed
   - `main.ts` wiring behind `?finish=1`: the route plus the card `finished` hook, and an enqueue on discovery or when a portrait opens. Default off until Nick's quality review;
   - **Stage seam (Codex C40(c)):** the engine returns a full original-coordinate PNG plus receipt, NOT an atlas. Claude owns the runtime projection into the unchanged atlas frames, generalising `rebind-finished.mjs` (sample through the original cut-outs, preserve part alpha, byte-identical parts/paintSkin after rebuild).
   - The phone delivery shape is still open (C41(b)).
4. Only after G1 passes (or D24 redefines it): the parked items (audio Stage 4, the mission-return voice, the Kindred picker, wiring Codex's S4/missions/Outposts numbers).

**Nick (none blocking): D24 and D25** in `audits/MAILBOX/DECISIONS.md`. Also still open: the playtest checklist (`?deviceProbe=1`, `?audioReview=1`, a full journey, `?battle2=1&vs=…` pairs).

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

## Current shared sprint handoff — 2026-09-26

Mac-only: Codex `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`;
Claude `/Users/nick/Projects/celestial-frontier-anthropic-mac`, `anthropic/mac`.
Read the other absolute mailbox at start/end, reply only in your own. Repo-keychain
signed commits (G), HTTPS origin, shared object store. No new branches or Windows refs.
Nick need not open the other app or relay messages. Original clone is read-only to agents.

### Latest Nick direction and completed recovery

Finish the preserved parked gameplay now AND continue the Generated Creature Pipeline in
parallel. Its2 original commits remain in the local archive tag and committed191KiB bundle
(`audits/G_PIPELINE_CODEX_20260926/RECOVERY.md`). No lost work or recreation of old branches.
Primary gameplay and active-play Weekly Charters were already integrated. Forge Training
and selected Compendium portrait motion are recovered; current16-card curriculum and
Guide/release instruments updated. Old wall-week code, import door and whole-file replacements
are superseded, not pending features. Full evidence: `audits/PARKED_GAMEPLAY_COMPLETION_20260926`.

Native390×844 and1440×900: practice produces the next lesson without any live save/storage
change; portrait animates one image, reduced motion stops the ticker, Back releases ownership.
The native run exposed and repaired a Training-panel overlap; original failure/control retained.
Root validate passes50 unchanged legacy fingerprints. Integrated final battery507 tool passes,5,615 unit passes, standingI5 only; all7 manual owners pass. Native320×568 also passes, including Close/reopen and action isolation. No full browser certificate or physical-phone claim.

### Generated Creature Pipeline — still the priority

D22/D23 PROGRAM.md is current. Claude G1/G3 and cleanup merged through signedfdb9f627
by no-ffbd5530d7. G3 delivers pinned on-demand art outside the core pack; preserve its routing.
G1 remains12/40, below30; hand ceiling30/40. Review findings and exact invariants are in
`audits/G_PIPELINE_CODEX_20260926/G1_REVIEW.md`. Claude has since merged the limb counter and advanced G1/G4 through signedfd37bfd6 (not yet merged here). G1v5 remains12/40 and scores10/20 on G2; mutation controls improved. D24 is Claude’s pending denominator decision, not authority to weaken this gate.
Read-only follow-up on signed 77623d3f is in `audits/G1_CONTRACT_REVIEW_20260926`: materials,
habitat and outer provenance improved; all-visible presence and canonical identity are still
not proved, and the exact shipped-38 status manifest is requested. D25 reference shopping
stays off; weaker mutation refusal is not accepted. C40 answers are in our mailbox.

G2 complete at90ef2c56:20 quadruped originals, exact prompts, source/verifier hashes and ONE
review sheet in`audits/G2_QUADRUPED_PILOT_20260926`;120 derived six-pattern mask candidates.
NO hand authoring. IC4 reports10 ADMIT/10 REFUSE but these are unqualified: Coyote places a
paw on an ear. Requested counts are never acceptance. Keep originals unchanged for G1 tests.
Masks conserve source alpha; G1 record binding is still required before rig admission.

G5 engine/tests and native harness are in`audits/G5_FINISHER_ENGINE_20260926`. Codex supplies
per-individual retained originals, bounded serial/deduplicated jobs, lazy desktop inference,
phone delivery with zero model construction and exact PNG/conservation. Claude owns actual
G5 gameplay/landfall routing and G4 selection. Native proof on signed 26a4bc57 PASS:
five real inferences, exact cache/deduplication, five byte-exact delivered originals in fresh
IndexedDB, zero phone model construction; 199,641 PNG bytes total. Output is master-space,
not an atlas; C40 projection contract and runtime-adapter boundary are in the G5 packet.
A desktop Chromium phone-path proof is not physical iPhone or Nick quality acceptance.

Only AFTER G1 PASS: S4 training-only feasibility map, then ONE fresh declared held-out epoch
or one recommended target decision. Candidates03/13 rejected and unwired, old corpora consumed.
Hand-painted rigs, missions/Outposts numbers, pack diet and I5 remain parked until G1 passes.

### Git, cleanup and next actions

Remote branches now only openai/mac, anthropic/mac, develop, main. Local OpenAI only openai/mac.
Old I5 worktrees removed; keep newest2 ignored preview packages. Git connectivity passes.
Original clone develop0 ahead/472 behind, modifiedpackage-lock.json and untracked.claude/:
no pull performed. Historical Markdown retained verbatim; current references refreshed.
Free 225 GiB at the final native boundary; check each batch, cleanup below 60 GiB, floor 40 GiB.

Codex: recovery and G5 implementation signed at 26a4bc57, native proof complete; publish
the evidence successor only to our lane with a measured pack below 2 GB under Nick's
explicit I5-only push authority. Next integrate Claude's newer G1/G4 work in a fresh tested
batch and incorporate its proposed release bullet in that batch's copy measurement. Claude:
consume signed G2/G5/recovery from the shared store, close G1 presence/identity findings,
and wire the master-space morph → finisher → unchanged atlas projection. No Nick relay or
need to open the other app. Earlier pushed Codex copy checkpoint f01f911e:
119 bullets,41 topics,5 briefings; current119-bullet recovery SHA is in measured-copy.json.
No PR, label, hosted attempt, develop/main merge, release or deploy authorized by this work.
The standing I5 red remains a real gate, not waived or rebound. Pre-existing.DS_Store untouched.

## Latest Codex adapter checkpoint — 2026-09-26 (supersedes next-run instructions above)

Nick's ordered sprint: merge Claude through 23bb209e, C43 worker fixes, C41 stage/phone
admission, six auto-fit repairs, four-family G2 pilot, one G4 copy measurement.
Signed no-ff merge 86ee9347 includes all requested G1v8/G3/G4/G5 work; incoming signatures
G, no conflicts or markers. Startup official metadata PASS, no eligible updates; 228 GiB free.
C43 padding/transferred-buffer implementation and C41 private-token admission are complete
and focused-green; one 1254 Cougar native proof waits for this clean signed checkpoint.
All original rig pins and conservation remain unchanged. 34 source-label pins available;
Civet/Eel/Rat/Salamander refuse due to missing label inputs. Both PNG and receipt must be
G3-pinned for phone delivery; no published entries or default finish routing added.

The six auto-fit repairs remain RED: a generic contact refinement is retained and rejected.
It removes Grouse's initial split conflict but introduces/reveals folds. No hand authoring,
reference shopping or limit changes. Fixed the runner summary that omitted Mongoose's
blended presentation failure. audits/G1_FIT_REPAIR_20260926 has exact remaining failures.
G1 semantic status remains a separate gate; C43 prose and four v8 statuses disagree.
D24 remains undecided, D25 shopping stays off, S4 remains parked.

G2 compiler now supports canonical bird/fish/serpent/insect families; 20 exact prompts
(5 per family) prepared, generation in progress, no authoring. One final review sheet.
Next: record native result, complete G2 evidence, one G4 copy re-measure, full I5-only
profile plus all seven manual owners, signed own-lane push under 2 GB. Claude consumes
the signed worker/admission contracts and implements its adapter/routing. No Nick relay
or need to open another app; no hosted/PR/develop/main/release actions.
