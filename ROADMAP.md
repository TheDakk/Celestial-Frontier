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
- **Codex:** merged through `bd5530d7` (its G2 quadruped pilot). Before merging again, read `/Users/nick/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md` (read-only) and run `git log HEAD..openai/mac`. Codex's current focus, per Nick: finish the preserved parked gameplay (Forge Training, the living-portrait decision) BEFORE its G5 engine work.
- **Gate:** `node tools/check-profile.mjs --profile=develop` (from `port/v2`) gives **5,586 pass; the ONLY red is I5** (`current-producer-authorities`, "binds every live memory budget").
  - Run it on a QUIET tree. A commit during the run produces a spurious "Source changed during authority read".
  - Also run by hand, all clean this session: `npm run typecheck` (root, app and worker), `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** https://dev-celestialfrontier.github.io serves `77623d3f` (G4 is live). Evidence is in `audits/DEV_PUBLISH/77623d3fdd26`.
- **develop** is still `c1791e21`. PR #43 is open. No hosted attempt: I5 is red (D5).
- **Disk:** about 230 GiB free. No agent worktrees are live, and the limb-counter branch is merged (it had no worktree). The newest 2 preview packages are kept.

**The priority: the Generated Creature Pipeline** (`audits/GENERATION_PIPELINE_20260926/PROGRAM.md`, Nick D22/D23)

| Stage | Owner | State now |
|---|---|---|
| **G1 auto-author** | Claude | **v5 adopted, gate NOT met.** Corpus **12/40**. Codex's independent **G2 quadruped pilot: 10/20** ADMIT + PASS_STATIC, zero hand edits. Mutation battery erased **31/34**, duplicated 26/27, flip 34/34, wrong family 34/34 (the limb counter, merged from `claude/t1-limb-counter`). All five of Codex's blocking review findings are fixed. Rejected with numbers: reference shopping (D25) and thin-part nudging. `audits/G1_AUTO_AUTHOR_20260926/README.md` "Session 2". |
| G2 library at scale | Codex | Pilot delivered (20 quadrupeds + 120 derived-mask candidates, `audits/G2_QUADRUPED_PILOT_20260926`). Next families are Codex's. |
| **G3 on-demand delivery** | Claude | Live. **Card path now browser-smoked PASS** (online library cards, offline core fallback, negative control): `audits/G3_ART_DELIVERY_20260926/card-smoke/`. |
| **G4 selection** | Claude | **Landed and live.** `paintedArtV2`, one resolver for card and stage: exact → same Earth profile group → nearest same-anatomy visual-gene variant → v1 stand-in. Sturgeon and Reef Shark now draw sturgeon- and shark-shaped procedural fish. 7 tests with controls. `audits/G4_SELECTION_20260926/README.md`. |
| G5 finisher in the game | Claude routes, Codex engine | **Blocked on a seam (mailbox C40(c)).** Codex's finisher takes an ARCHETYPE master. Per-individual finishing needs Claude's master-space morph plus Codex's finished-master → rig-atlas format under finish-conservation. |

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
1. Read Codex's answers to C40 (a)–(d); merge its signed commits. Re-score G1 on any new G2 families as they land (`run-auto.mjs --targets=<pilot.json>`).
2. **G1:** build a far-limb detector, so thin-part placement can relax without leaking erased far legs. Target: the corpus above 12 AND G2 above 10/20, with the battery ≥ 90 % and no flip/wrong-family loss.
3. **G5:** once Codex confirms the finished-original format, build the master-space morph (the individual's own master) and the router. Desktop: enqueue on the landfall job queue and retain in `creature-originals`. Phones: delivered finished originals via `deliverCreaturePngV1`.
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

G2 complete at90ef2c56:20 quadruped originals, exact prompts, source/verifier hashes and ONE
review sheet in`audits/G2_QUADRUPED_PILOT_20260926`;120 derived six-pattern mask candidates.
NO hand authoring. IC4 reports10 ADMIT/10 REFUSE but these are unqualified: Coyote places a
paw on an ear. Requested counts are never acceptance. Keep originals unchanged for G1 tests.
Masks conserve source alpha; G1 record binding is still required before rig admission.

G5 engine/tests and native harness are in`audits/G5_FINISHER_ENGINE_20260926`. Codex supplies
per-individual retained originals, bounded serial/deduplicated jobs, lazy desktop inference,
phone delivery with zero model construction and exact PNG/conservation. Claude owns actual
G5 gameplay/landfall routing and G4 selection. G5 native result will be recorded in that packet.
A desktop Chromium phone-path proof is not physical iPhone or Nick quality acceptance.

Only AFTER G1 PASS: S4 training-only feasibility map, then ONE fresh declared held-out epoch
or one recommended target decision. Candidates03/13 rejected and unwired, old corpora consumed.
Hand-painted rigs, missions/Outposts numbers, pack diet and I5 remain parked until G1 passes.

### Git, cleanup and next actions

Remote branches now only openai/mac, anthropic/mac, develop, main. Local OpenAI only openai/mac.
Old I5 worktrees removed; keep newest2 ignored preview packages. Git connectivity passes.
Original clone develop0 ahead/472 behind, modifiedpackage-lock.json and untracked.claude/:
no pull performed. Historical Markdown retained verbatim; current references refreshed.
Free230GiB at this batch boundary; check again at end, cleanup<60GiB, floor40GiB.

Codex: finish current integrated verification, sign, run G5 native proof, publish only own lane
with each measured pack<2GB under Nick's explicit I5-only push authority. Claude: consume
signed G2/G5/recovery checkpoint from shared store, repair G1 presence/counter/material findings,
and route G5. No Nick relay/wait for pushes. Last already-pushed Codex copy checkpointf01f911e:
119 bullets,41 topics,5 briefings; current119-bullet recovery SHA is in measured-copy.json.
No PR, label, hosted attempt, develop/main merge, release or deploy authorized by this work.
The standing I5 red remains a real gate, not waived or rebound. Pre-existing.DS_Store untouched.
