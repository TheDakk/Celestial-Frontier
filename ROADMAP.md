# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Dakk, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

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

## CLAUDE SESSION HANDOFF — 2026-09-26 (session 4, end) · GENERATED ART IS THE GOAL
Self-contained for a fresh Claude session. Codex's block follows below. Older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md` (session 3's is at its top).

**Dakk's goal (2026-09-26, verbatim):** "Can we get to the generated art? That's the main goal, so that we have the complete Earth creatures having full movement animations and all the procedurally generated animations in their various different battleground biomes." Dakk does ONE full visual pass at the end, so don't stop for per-creature approvals; keep the pipeline flowing and keep the review sheets current.

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit adding this block; every commit is signed G (`git-ssh-sign-cf`); `origin` is HTTPS via `gh`. Codex is merged through `046914af` (C56: exact tail labels, the Red Fox contact measurement, phone-original producer, 32 G2 requests in generation).
- **Gate:** from `port/v2`, `node tools/check-profile.mjs --profile=develop`; the ONLY red is I5. Run it on a QUIET tree. Also run by hand: `npm run typecheck`, `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`. This session changed audits/docs only (no `port/v2` source), so the dev site was not republished (still `c99e3eb7`).
- **develop** is still `c1791e21`; PR #43 is open; no hosted attempt (I5 red).
- **Decisions** (`audits/MAILBOX/DECISIONS.md`): D24 and D26 are DECIDED (per-family G1 scoring on G2 paintings; finisher alpha ≥ 250, implemented). D25 is open (reference shopping stays off). **D27 NEW, open:** regenerate patterned cats with the pattern named first (recommended; Codex proceeds unless Dakk objects).

**This session (session 4)**
- **C54 batch scored** (`audits/G1_AUTO_AUTHOR_20260926/README.md`, "G2 C54 batch"): 9/24 ADMIT + PASS_STATIC. Quadrupeds 7/12 (Dingo, Jackal, Lion, Tiger, Leopard, Ocelot, Weasel); birds 2/4 (Goose and Quail, the first birds through static); serpents 0/4; insects 0/4.
- **Native** (`native-g2c54/`): 7/7 quadrupeds DIAGNOSTIC_PASS 0/0. Goose and Quail FAIL native (peck refusals; ARAP folds and the faint foot limit).
- **Looked at full size:** the tails are all full.
  - Fit fault: on Tiger, Leopard and Ocelot, a chest-fur flap hangs below the near elbow in stride (`chest-zoom.jpg`), and the Leopard has a shoulder seam.
  - Painting fault: the five patterned cats have no pattern (D27).
  - The review sheet and the full-size sheets were sent to Dakk.
- **Fish tail** (`audits/TAIL_STALK_BRIDGE_20260926/README.md`):
  - A component-preserving bridge on top of Codex's C55 observed fill. The Cod is byte-identical to Codex's cover-04; the negative controls hold both ways.
  - Perch and Carp now pass ownership, static and native, and with their selective welds the gill hole is gone.
  - NOT adopted: neither is a genuinely gapped tail, and Trout, Herring and Arctic Fox still refuse (the outer contour encloses later-listed owners).

**Next, in order (Claude)**
1. Read Codex's mailbox (`/Users/dakk/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) for its C57 replies. Merge any newer signed `openai/mac` (`--no-ff`; after resolving, run `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing; keep this block).
2. **Score each new G2 batch the same way:**
   - `node audits/G1_AUTO_AUTHOR_20260926/run-auto.mjs --tag=<fresh> --topk=1 --chains --counter --fallback=2 --targets=<batch>/pilot.json`.
   - Then run native on every ADMIT + PASS_STATIC. Pattern: `audits/G1_AUTO_AUTHOR_20260926/native-g2c54/run.sh` (sequential, out of the sandbox). Land scripts come from `05-cougar`, birds from `15-goose`, fish from `native-g2fam-fish/*-script.json`, each with the names swapped.
   - Build the sheet with `native-g2c54/sheet.mjs` and the full-size crops with `crops.mjs`, then LOOK at tails, legs, heads and elbows. Record the results in the G1 README and send Dakk the sheet.
3. **Tail:** Codex's exact-label placement (`audits/TAIL_LABELS_C56_20260926`, merged) supersedes my polygon bridge; the reassigned pixels agree exactly, and it also covers Arctic Fox.
   - Run the G1 held-out and mutation checks on the exact-label contract (Codex asks for this before integration), and look at its native stills at full size.
   - Integrate it into the author only if it passes without regressing Cod, Perch, Carp or Arctic Fox.
   - Codex's next G2 batch (C56: 32 paintings, 8 per family) arrives for scoring next to the 24.
4. **Birds:** Goose and Quail pass static but fail native. Diagnose peck/faint on the Gull-referenced fits (Codex owns the bird motion repairs; check C44/C57 replies first).
5. **Admission:** only after Dakk's end-of-pass approval, add creatures as LIBRARY archetypes (`tools/morph/build-card-masters.mjs` `CARD_ARCHETYPES`, then the build-shipped pipeline and pins, through their owners).
6. Parked until the generated pipeline flows: audio Stage 4, the mission-return voice, the Kindred picker, Codex's S4/missions/Outposts numbers.

**Traps (obey them)**
- **Disk-space law:** `df -h /System/Volumes/Data` at batch start and end; ≥ 40 GiB free; newest 2 preview packages only; no large stashes; remove merged agent worktrees with `--force --force`.
- **Inline `//` comments inside one-line JS statements swallow the rest of the line.** Use `/* */`.
- **zsh does not word-split `$var`:** `for f in "a b"; set -- $f` silently passes "a b" as one argument (it bit this session). Use `${pr%%:*}` pairs.
- The G1 runner caches fits (it skips intake when `fit/` exists): use a fresh `--tag`.
- **A green number is not visual acceptance.** The elbow flap passed every gate, and the native impact still is washed out by the hit flash (sheets use approach, return-end and reaction).
- Browser-owning commands (native runner, smokes, deploy) need out-of-sandbox execution.
- Codex's sealed inventories (release/Guide copy, pins, budgets) are never rebound by Claude; propose changes in an audit README.
- `tools/run-unit-tests.mjs` builds the PWA pack first; for quick diagnostics run `node node_modules/vitest/vitest.mjs run <file>`.

## Current Codex sprint handoff — 2026-09-26, C56/C57 verification

### Branch, goal and authority
- `/Users/dakk/Projects/celestial-frontier-openai-mac`, branch `openai/mac`. Signed no-ff23bae15b integrates requestedf50abbf7. Claude session3 handoff above preserved byte-identically. Signed native/placement checkpoint046914af. Signed delivery checkpoint126d8765; final evidence commit follows. Resolve this lane locally.
- Dakk's goal remains every Earth creature's own generated painting, full movement in battle biomes, ONE visual pass at the end. D24 generated-family scoring and D26finisher are live. D25shopping off. C55–C58 read in absolute read-only mailbox; newer signed Claude541b7d42 not merged in this batch.
- Signed only; own normal push after required local battery with I5 the only accepted red and fresh budget/public/workflow check. No PR/label/hosted/develop/main/release/deploy. ≥40GiB free; last217GiB,3permanentworktrees/no stashes.

### Completed and ready for Claude
- **Tail seam decision implemented:** exact raster ownership via existing painter-label contract. Existing split already welds anatomical body5/caudal; no sibling exception/limit change. Cod4550/Perch14/Carp109/ArcticFox7554gap pixels all retained, no sourceRGBA/landmark/recipe/other-owner changes. Five controls, all4static/actions/presentation and native0/0pass. Evidence TAIL_LABELS_C56_20260926. Claude C58 confirms route and owns held-out/mutation checks before author adoption. Perch/Carp are small-gap regressions, not proof of a genuinely gapped held-out fish.
- **Phone originals:** canonicalCougar/Wolf/Gull actual worker proof on signed046914af:3inferences/1model/6transfers/0phone model; zero original alpha and sub250RGBchanges; conservation/admission/cache/deliveryPASS. Published exactPNG/receipts locally before manifest regeneration;619files and actual bundled consumer PASS3keys/7fetches. Prior8keys preserved (5currentcrab+3historical). No deploy/flag/physicalphone claim. PHONE_ORIGINALS_C56_20260926 owns receipts/keys.
- **G2throughput:**32new1254originals in G2_THROUGHPUT_C56_20260926/pilot.json (8quad/8bird/8serpent/8insect). Byte-exact tool originals/receipts/observations/sheet, no hand authoring. Compiled BEFORE pattern fix. Four pattern REFUSALS: CloudedLeopard,WaterSnake,MountainViper,Ladybug. LeafcutterAnt also holds an unwanted leaf; limbs/layout require automatic scoring.
- **C57/D27 reversible prompt fix:** remove contradictory plain-coat override, put canonical pattern requirements first. Seven further1254originals (6cat species,2Jaguarattempts) in G2_PATTERN_C57_20260926/pilot.json. Five pattern-onlyPASS; bothJaguarcentralrosettespotsUNRESOLVED/REFUSE. Pattern observation requires exact-source explicit visual feature evidence, never expected prompt/variance as proof. Four adversarial controlsPASS. No G1/library admission from generation.

### Repairs still open — do not turn numerical green into visual acceptance
- Other Cod/fish body seams remain; Carp80root/caudal fringeedges. ArcticFox tail/body tears persist in crouch despite tail2/3 join repair. Named nativefilms/stills retained. No registry replacement.
- RedFox exact near-foreleg diagnosis: additiveidle+trot at54.3667ms,idle0.46875,zero travel,pass0 needs8.53%compression beyond unchanged8%. Priorfarlegprojection did not address it. Claude motion owner has source-hashed diagnostic for geometry-derived amplitude work; no fake bend/limit relaxation.
- Marmothead/Cattlehump automatic gap candidates bothstatic/nativePASS but VISUALLY REJECTED (upper-body tears, largeCattlebackgap). SeparateMarmotboth-sidesscript actually exercises reportedcrouch. QUAD_CONTACT_C56_20260926.
- C57elbowflap: Tiger/Leopard/Ocelot fore-near-root polygon distal corners108–116px lateral to boneaxis, repeated transferred chestpaint. Repair ownership from sourceanatomy; not complete. Sameaudit binds exactpolygons.
- Prior6fitqueue stillopen. C57newGoose/Quailnativefailures,SnowLeopardcompression,Termiteintake refusal remain Claude findings to preserve. I5, S4/missions/Outposts, C51phonekeyefficiency remain in their existing queues; generatedart stayspriority.

### Verification / next steps
- Rootvalidate and focused controls PASS. Full battery on quiet signed126d8765:5647pass,2expectedfail,2skip; I5 producer-authority mismatch is the ONLY failure. All7remainingownersPASS. final-battery/results.json retains the copied runner's hardcoded dirtySource:true; this was not a measurement (tracked tree clean before/after). See final-battery/REVIEW.md. Fresh public/UNFROZEN check and remote workflows byte-identical; no push trigger. No sealed gates or baselines changed.
- Current references LOCAL_AI_GENERATION,CREATURE_ANIMATION and codebase reference updated. Nativeprepared49.7MB scratch inventoried byhash and pruned; retained originals/proofs unchanged. Keep newest2previewpackages.
- Codex: remainingtail/quad/elbowrepairs after signed own-branch handoff. Claude: consume signedlane directly; score32C56 and7patterncandidates using theirpilot shapes, honoring patternrefusals; integrate exactlabelsonlyafter independentheld-out/mutations; continueG1/native. Dakk need not relay or open another app; finalvisualpass remains at end.
