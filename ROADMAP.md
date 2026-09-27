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

## CLAUDE SESSION HANDOFF — 2026-09-27 (session 5, overnight) · GENERATED ART IS THE GOAL
Self-contained for a fresh Claude session. Codex's block follows below. Older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md` (session 4's is at its top).

**Dakk's goal (2026-09-26, verbatim):** "Can we get to the generated art? That's the main goal, so that we have the complete Earth creatures having full movement animations and all the procedurally generated animations in their various different battleground biomes." Dakk does ONE full visual pass at the end, so don't stop for per-creature approvals. **Dakk (2026-09-27): run through the night without stopping; nothing waits on him except real gates.**

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit adding this block; every commit is signed G (`git-ssh-sign-cf`). Codex is merged through `b3a34e15` (the I5 instrumentation checkpoint; Codex is running the guarded 3+1 epoch that re-seals the budget).
- **Gate:** from `port/v2`, `node tools/check-profile.mjs --profile=develop` gives 5,647 pass; the only red is I5 (Compendium producer authority: built index/worker/painter hashes versus the sealed budget; Codex's re-seal is pending). Run it on a QUIET tree, plus by hand: `npm run typecheck`, `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** serves `e71d1496`; no player-visible change since.
- **develop** is still `c1791e21`; PR #43 is open; no hosted attempt.
- **Decisions:** D24/D26 DECIDED; D25 open (shopping stays off); D27 open (its pattern-first default is implemented).
- **Progress** (`audits/GENERATED_GALLERY_20260927/coverage.json`, regenerate with `coverage.mjs` after each batch): **150 of 631 Earth species (23.8 %)** have a generated creature passing native with zero hand edits: quadruped 37/205, fish 59/132, biped-bird 32/102, insect 5/41, serpent 16/22, hopper 1/18; every other family 0. None is visually accepted or admitted. Master gallery: `gallery.jpg`. Batches score with ONE command: `score-batch.mjs <batch> <tag>` (observed supports).

**Session 5 (overnight 2026-09-27), all in `audits/G1_AUTO_AUTHOR_20260926/README.md` unless noted**
- **Serpent strip author:** `port/v2/tools/anatomy-verify/serpent-author.mjs`, runner `--serpent-strips` (USE IT for every serpent batch). **Snakes 0 → 9** static + native, clean at full size. Battery `serpent/battery.mjs`: 59/60 mutants, 9/9 wrong family.
- **Guarded tail labels:** `tail-labels-fit.mjs`, runner `--tail-labels`, off by default. Held-out Herring/Trout pass; welded versions deform in the reaction (not accepted).
- **Codex's foreleg repair checked** (`audits/C59_REPAIR_CHECK_20260927`): exact on all 7; guard proposed at 25 %.
- **C59 scored:** Raccoon, Vulture, Water Snake pass. Bobcat is a real slowdown. The Raven split is wing/tail overlap.
- **legMatch lever rejected** (battery positives 18 → 14; G2 quads unchanged).

**Next, in order (Claude)**
1. Read Codex's mailbox (`/Users/dakk/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) and merge any newer signed `openai/mac` (`--no-ff`; `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing; keep this block).
2. **Score every new G2 batch with ONE command:** `node audits/G1_AUTO_AUTHOR_20260926/score-batch.mjs <batchDir> <fresh-tag>` (out of the sandbox). It covers the pattern gate, the author with the standard flags, native on the passes, sheets, `summary.json` and the gallery registry.
   - Then LOOK at `native-<tag>/fullsize-reaction.png` at full size, edit each new registry note from `unreviewed` to what you see, run `node audits/GENERATED_GALLERY_20260927/gallery.mjs`, record the results in the G1 README, and send Dakk the sheet.
3. **Insects (0 so far):** diagnose the refusals (family floor, antenna/leg coverage, wrong family, facing) the way the snakes were diagnosed, and consider an insect-specific transfer if the references' construction allows it.
4. Admission only after Dakk's end-of-pass approval (`CARD_ARCHETYPES` → build pipeline/pins, through their owners).

**Traps (obey them)**
- **Disk-space law:** ≥ 40 GiB free; newest 2 preview packages only.
- **Inline `//` comments swallow dense one-line JS:** use `/* */`.
- **zsh does not word-split `$var` or `${@:-a b}`:** use arrays (`fish=(a b)`) or `${pr%%:*}` pairs. It bit twice.
- **`Buffer.slice()` is a VIEW:** copy with `Uint8Array.from` before mutating (it corrupted a check once).
- The G1 runner caches fits: use a fresh `--tag`.
- A green number is not visual acceptance: look at full-size reaction stills, not only approach.
- Browser-owning commands need out-of-sandbox execution. Codex's sealed inventories are never rebound by Claude.

## Current Codex sprint handoff — 2026-09-27, I5 repair + art together

Dakk explicitly renewed complete I5 repair and said not to pause art. Goal remains generated art for all631 Earth creatures with full biome battle movement and one final human visual pass. Own lane openai/mac only; Claude mailbox absolute read-only, reply only own TO_CLAUDE. Signed G commits, own normal push after develop+7owners and current PUBLIC/UNFROZEN workflow check. Preserve Claude handoff byte-identically on signed --no-ff merges. No hosted/PR/label/develop/main/release/deploy/version bump. Disk196GiB floor40GiB; two preview directories. Reuse uninterrupted startup receipt C59.

**I5:** historical c506 calibration1 remains stopped, never retried. Actual cause now reproduced: pinned recipe chip z40 covers phone Back, click opens Shipyard. Signed829008f9a lowers chip to21 below panels; phone+desktop native Back restores exact row777 focus, uncovered chip still opens Shipyard; z40 mutant fails. V2 second keyboard entry also fixed to observed11Tabs,63instrument controls/actual omitted-patch mutant pass. All78outcomes/40ceilings/v1history unchanged. Evidence `audits/I5_BACK_REPAIR_20260927`. Next: quiet committed battery, one separate clean signed changed-source local3cal+1cert proof, first-red stop. No active budget or certificate claim until raw-verified success; only then implement explicit v2 profile selection without rewriting history. No wait for Dakk/Claude reply.

**C100 fish:** signed1ea0b7312 delivers guarded opt-in batch (`fish-seams-batch.mjs`): exact canonical/master/static/semantic/pattern/source admission,16negative controls/2actual mutants, Gar byte parity. Cold-WaterFish/Sunfish/Snailfish static/native PASS, Harpy nonfish skipped. Cold-WaterFish/Sunfish continuous in inspected reaction/late idle; **Snailfish still large head/trunk and lower-fin splits**, held despite green. Fullfilms+9namedstills; no default or visual admission. Claude independently reviews candidates.

**C101 art:** `audits/G2_C101_20260927/pilot.json`,24 exact1254 original paintings (12fish8birds4quads),2patternPASS/22notrequired.23framingPASS; Deep-SeaFishREFUSE96/97pxvs101 preserved. Per-source full-size anatomy holds and7pregen context clarifications retained. Claude scores automatically; no absence/admission inferred from prompts. Prior coverage150/631 afterC98, C99fivefishseams independently selected withholds. Keep more broad batches~24, fourquadlegs/bothearswhereanatomicallypresent/true tails; foldedbirdwingsabove tails; xmonotone snakes; pattern-first prompts.

**Other open repairs preserved:** Bobcat replacement native933/0 with lethal p9512.6ms vs old191.2ms, ear/paw/sliver holds. SnowyOwl10exactstagefailures/7standalone; rejected fade/collar/weight candidates. Foreleg25%guard done. Basslargegap; Cicadacast/hit/tame/faint; insect handreferences; Hyraxtail-absent exhaustive action remainsred; Raven/Vulturewingtail; Marmot/Cattle/RedFoxcompression; ArcticFoxcuts; Tiger/Ocelot/Fisheralpha seams. D26finisher completed without widening join eligibility. Source-bound phone originals continue aseligible. Full prior details archived verbatim above.

**Next:** commit24originals, quietbattery+7owners/freshpushpreflight; ownpush, read Claude mailbox and merge newer signed lane preserving handoff, then fresh I5 proof on exact signed source. Continue art and source-supported repairs; don't turn a green number into visual acceptance. No app switching or relay needed.

Final batch verification: signed8861b8f4e unchanged-source profile5,675PASS/I5solefailure; allseven remaining owners PASS, exact HEAD/source/log hashes verified. Duplicate-bullet preliminary red retained and corrected without changing sealed copy authority. Root validate/smoke/layoutselftest and focused phone+desktop Back/keyboard controls PASS.24exact originals,23framingPASS/1held; C100three motion candidates remain visually scoped.196GiBfree. PUBLIC/UNFROZEN/five unchanged manual-label workflows checked. Proceed one fresh changed-source local I5 proof; never retry a stopped epoch.

I5 continuation: both ca46 carrier-overflow and875 compact-carrier epochs stopped honestly at calibration1; neither resumed.875 phone completed with real memory/cache/listener excess and premature painted publication; desktop final lazy-control foreground30s timed out. Product repair releases idle paint inputs, uses flat byte-identical base64, shares original broker caps with painted thumbnails, and removes idle reveal listeners. V2 publication waits for both actual owners. Focused heap saves2.315MBbacking/386KBheap, paint inputs return0; audio PCM6.144MB remains owned by Claude (C105). The320s hidden probe resumed in105ms and did not reproduce the timeout; v2 now retains its last raw foreground observation on failure.60product/67instrument controls and rootvalidate PASS; no certification or active-budget claim. New24C106 generation runs alongside. Keep all78outcomes/40ceilings/deadlines/v1history unchanged.

C106 complete:24untouched originals,4requiredpatternPASS/20notrequired;19framingPASS/5refuse, anatomy holds preserved. `audits/G2_C106_20260927/pilot.json` ready for Claude automatic scoring. Current20274612e exact unchanged-source battery5678PASS/I5solefailure and all7owners PASS (`audits/I5_MEMORY_C105_20260927`). Native idlepaint0/listeners92. First follow-up heap launch used production instead of evidence mode and timed out before collecting; retained, corrected evidence-mode diagnostic succeeds. Claude audio pre-render admission/lifetime repair underway in his lane; merge signed result then targeted native proof and freshchanged-source I5 epoch. No push/cert yet.176GiBfree.

C108 I5: Claude audio repair f77e158c4 merged in cd4e75cff; exactcd4 battery5683PASS/I5solefailure+7owners PASS. Focused native15s painted0/audioPCM0/audioqueue0/listeners92/backing3,228,326. Start fresh changed-product3+1 epoch on signedcd4 in reused clean managed i5-back-proof; source and instrument stay unchanged during proof. New24G2_C107 generating remotely, no pause. Every earlier stopped epoch is preserved; no cert/active-budget/push claim until full raw-verified success.

C110 continuation: cd4 proof stopped calibration1 at desktop listeners100>96;77/78outcomes PASS, raw/named red preserved. Focused desktop replay89listeners did not reproduce transient spike. Worker callbacks now removed on disposal/fatal/suspend; painted yields clear callback/closebothports.30tests+3actualmutants androotvalidatePASS; fullbattery/freshchanged-productproof next. C10724originals complete,19framingPASS/5REFUSE/4patternPASS, canonical anatomy holds retained. C110next24ungulates generating concurrently. ClaudeC109 reports159/631 accepted plus12held (oldcoverageincludedheld); fourC106selected: Shark/ReefShark/Hammerhead repairedseams andFox. No cert/push/admission claim.

I5 next proof: exactsigneda80f05d7b battery5685PASS/I5solefailure+7ownersPASS, everyloghash/sourceverified. C10724originals committedcfc93590a; Claude throughf579 merged. Freshchanged-product3+1 targeta80 under I5_LISTENERS_20260927, first-redstop/noresumption. Next24C110half generated, restactive.


C114 continuation: C11024exact originals complete,7patternPASS/17notrequired,24framingPASS; anatomical holds remain. Total96new originals C101/C106/C107/C110 while I5 proceeds. a80 listener epoch STOPPED calibration1 instrument-fail: mainphone flow completed; final lazycontrol rAFobserved but later timer unobserved30s despite visible/focused. Rawlastsample/execution preserved, no retry/resume/cert/push. Separate diagnostic now instruments timer scheduling/cancellation and lifecycle, not calibration. ClaudeC113 accepts repairedSeabird;160/631accepted/11held, SnowPetrel wingseam stillheld.169GiBfree. Next: identify actual foreground cause, negativecontrolrepair, requiredbattery and only genuinely changedsource proof; continue G2 and score holds independently. All ceilings/history unchanged.


C115 foreground candidate: rawdeadline5000ms, earlier30s prose incorrect/superseded. Oldfocus-before-bring order reproduces timeout twice; native phone+desktop bring-before-focus completes exactservice. V2-only order repair retains commands/rAF/timer/identities/visibilityguards/limits.68controls+actualomissionmutantPASS/rootvalidatePASS. Fullbattery then freshchanged-instrument3+1proof, firstredstop; no cert/active-budget/push claim. Next24C114art compiles concurrently; C11024delivery signed1b3ea91eb. Claude591ec9aaf merged signedb0033c88d withhandoffidentical.165GiBfree/floor40GiB.

C116: exactsignedc7bdfc9e3 unchanged-source battery5685PASS/I5solefailure+all7ownersPASS, hashesverified. Start freshlocal3+1epoch with testedforegroundorder, original5000msdeadline/limits unchanged; firstredstop/noresumption. C114next24half generated with exactreceipts; last12active. No activebudget/cert/push claim.

C117: c7 foreground-order epoch stopped calibration1 on desktop; never resumed. Concrete cause reproduced: Windows A=65 sent as macOS native code produces 92,438 stray keypad-decimal events, starving the lazy-control timer. V2 Mac codes corrected; phone/desktop full diagnostic flow completes with zero stray lazy-page keys;69controls+actual mutant/rootvalidatePASS. Fresh signed3+1proof next, unchanged78outcomes/40ceilings/5000msdeadline/v1. C11424 originals complete, exactreceipts and all anatomy/framing holds retained;120new originals across latest5batches. ClaudeC115 coverage166/631accepted+13held read; ungulate reference packets remain priority unlock. Both art and I5 continue.

C118 verification: c4e751e78 unchanged-source develop5685PASS/I5solefailure, all7ownersPASS,69v2controlsPASS. Fresh native-key-corrected epoch starts on signedc4; stoppedc7budget retained separately. No certificate or activation claim before raw-verified3+1.

C120: native-key epoch on c4 passedcal1/rawverify then stoppedcal2 on phoneBack backing10.5MB>5MB;77otheroutcomesPASS. Threeboundeddiagnosticreplays didnotreproduce. PNGcodec lifecycle defect repaired (waitbothdirections/releaselocks/propagateerrors),13tests/twoactualmutants/nativepixel+encodedparity/rootvalidatePASS. Nativeisolatedretention stableold/new, so cause/fix oftransient notclaimed. Fullbattery/freshchanged-product3+1next; no stoppedepochresume. C11824originalscomplete (144totalrecent),21framingPASS/3held,4patternPASS; anatomyholds retained. ClaudeC119 hostloadnote read, no reclassification ofrawred.

C122: native renderer oldpost-GC excess exactly7,077,888bytes (three768²RGBA scratchbuffers) reproduced; explicit owned-buffer release removes it with exactnativepixels+120pre-changehashes.11tests/twoactualmutants/rootvalidatePASS. Quietfullbattery thenfreshchanged-product3+1proof; stoppedc4neverresumed, noI5closureyet. C12124generated originals complete:168recenttotal,21framingPASS/3REFUSE,2patternPASS; anatomyclaims remainheld. ClaudeC121coverage175/631accepted+13held; D28pending so5%cap unchanged. Readonlymailbox/ownsignedcommits/nohosted/pushuntilfullgreen.167GiBfree.

C123: exactsignedf8588b039 battery5692PASS/I5solefailure+7ownersPASS/source+hashesverified. Freshlocal3+1scratch-disposal epoch on unchangedf858product starts; firstredstop, alloldstoppedepochs preserved. C12124originalssigned, noartpause.

C125 — latest Dakk direction: pause further art/gameplay development, record everything, prioritize complete I5 repair. All168recent paintings signed, C12124 ready for scoring. f858 epoch stopped atcal3 listeners100>96, cal1+2PASS and allmemoryPASS; never resume. Exact+11 IDB wrappers traced to lease/revision operations. Database capture owner replaces per-operation native listeners; native real storage/atomic rollback/concurrent ownership controls and actual mutants pass. Full evidence and self-contained pause handoff: `audits/I5_IDB_OWNERS_20260927/SESSION_HANDOFF.md`. Next quiet signed battery, fresh changed-product3+1; only raw-certified result can activate v2. No cert/push claim yet; allceilings/history unchanged.
