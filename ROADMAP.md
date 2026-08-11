# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.
## The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
## SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE · COMBAT_AND_CONQUEST ·
## PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS · BREEDING_AND_SHARING ·
## DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO) are the SOURCE OF TRUTH we pull from for a
## full-system review/edit later. RULE: whenever we change a system, update its doc IN THE
## SAME BATCH (and bump its "matches code as of" marker) — the same way we run validate and
## update this roadmap. A change isn't done until its markdown reflects it. Also keep
## celestial-frontier-codebase-reference.md (code map) in sync when functions move/appear.
## ★ PROCESS_LAWS.md (extracted from this file 2026-07-30) is the other standing reference —
## READ IT BEFORE TOUCHING UI OR TESTS. Same discipline: refreshed in place, never archived.

## 📌 PINNED — ROADMAP HYGIENE (Nick, 2026-07-21): KEEP THIS FILE LEAN. This doc holds ONLY the
## live SESSION HANDOFF (state / what's done / NEXT backlog / process). Completed batch logs and
## superseded handoff blocks live in `ROADMAP_ARCHIVE.md` (history + traceability, nothing deleted).
## RULE, run at the END OF EACH ARC (or whenever this file grows past ~400 lines): move every batch
## block older than the current one to the TOP of the archive's batch section, verbatim, then refresh
## the SESSION HANDOFF here so WHAT'S DONE / NEXT reflect reality. Rewrite the handoff in place — the
## roadmap stays a one-screen read. History is one file away, git-diffable. (Split first done 2026-07-21
## when this crossed ~285KB / 4,272 lines and stopped reading in one pass.)

## ▶▶▶ SESSION HANDOFF — 2026-08-10 · WAVE 2E MAC RESUME FAIL-CLOSED ON NON-PORTABLE BASELINE ◀◀◀

## ★ COLD START — READ THIS BLOCK, THEN THE LINKED REFERENCES
## Workspace: /Users/nick/Projects/celestial-frontier-openai-mac
## Owner/branch: OpenAI/Codex on openai/mac. Clean reset-baseline HEAD is
## bc26e800c7adca72805a832e753ace1a8f9837ba; Wave 1 is d005090f, Wave 2a is 00e499c,
## Wave 2b is 9c148f0, Wave 2c is dc015cf, and Wave 2d is committed/pushed as
## 2ed0f288a95c327aa892e8b3b54ce94f626f1ab7. Wave 2e's static checkpoint is 5db9039 and
## reached develop through merged PR #8 at bb1a980. The Mac resume verified all four frozen art
## hashes, then stopped before post-edit rendering because the documented 288-row pre-edit evidence
## was ignored and never crossed Git. The overridecheck parser false-positive is repaired and
## independently post-edit reviewed; no art source moved. No reset PR, new 1,250-row tally, final
## certification, image-inclusive ZIP, release, deployment, or version bump exists. Read next: PROCESS_LAWS.md ·
## PARALLEL_GIT_PROTOCOL.md · port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md ·
## ART_DIRECTION.md · PROCEDURAL_CHARACTERISTICS.md · LINEAGE_AND_BREEDING.md ·
## port/PROPORTION_ARC.md · port/HANDOFF_NEXT_SESSION.md · port/v2/DEVIATIONS.md · port/v2/README.md.

## ★ FROZEN FULL-RESET R1 BASELINE — COMPLETE REVIEW, NOT CERTIFICATION
## The clean bc26e8 capture covers all 1,250 identities in 181 families /233 packets and remains
## 516 PASS ·14 POLISH ·720 FAIL: fauna 151/6/474 · flora 125/0/207 · fungi 16/0/11 ·
## microbes 12/2/6 · procedural 212/6/22 (PASS/POLISH/FAIL). Authority:
## port/v2/apps/game/smoke/full-reset-results-2026-08-10-r1/results.json. Scoped wave results never
## mutate this ledger and must not be added to 516.

## ★ ACCEPTED CHECKPOINTS BELOW THE FROZEN LEDGER
## Wave 1: committed/pushed d005090f; root 38 + fish 59 + tree 48 + fauna2 32 =177/177 scoped PASS.
## Wave 2a: committed/pushed 00e499c; Mammal A 4 + worms/sessile 13 + S1–S3 15 =32/32 scoped PASS.
## Wave 2b: committed/pushed 9c148f0; Mammal B 25 + Bird B1 21 + Invert I 5 =51/51 scoped PASS.
## Wave 2c: committed/pushed dc015cf; Mammal C 13 + Bird B2 28 + Invert II 15 =56/56 scoped PASS.
## Wave 2d: committed/pushed 2ed0f28; Mammal D 16 + Bird B3 27 + Invert III 7 =50/50 scoped PASS. Vanilla
## Orchid r6 remains a separate 234-asset continuity PASS. None is a new
## full-catalogue score.

## ★ WAVE 2D — EXACTLY 50/50 AUTHOR-SEPARATED PASS
## Mammal D: 16/16 PASS. The first shared preview failed closed on Fisher's tail silhouette,
## Marten's ears, Wolverine's claws, Sea Otter's body rotation, Hyrax's ear scale, and Mole's
## snout/forepaw separation. Bounded R2 changed those six. The first independent final judgment
## returned 15 PASS /1 FAIL because Civet still lacked its long pointed muzzle; Civet-only R4
## changed 3/3 surfaces, preserved the other 303 rows /909 surfaces, and independently closed 16/16.
##
## Bird B3: 27/27 PASS. The initial author screen was 11 candidate-ready /16 blocked: Chough · Crow ·
## Raven · Peacock · Pheasant · Rooster · Quetzal · Sandgrouse · Cockatoo · Macaw · Parrot · Dove ·
## Pigeon · Finch · Swift · Hornbill. R2 changed exactly those 16 and left only Pheasant's too-short
## tail, Quetzal's too-short streamers, and Macaw's too-short tail open. R3 changed exactly those
## three; the independent final judge returned 27 PASS /0 FAIL with 100 lane controls exact.
##
## Invert III: 7/7 PASS. Sea Spider · Camel Spider · Pseudoscorpion · Scorpion · Spider · Tarantula ·
## Millipede received exact-name whole forms. The first screen kept Camel Spider open because its
## paired chelicerae/gape vanished at 132px and Tarantula open because fangs/palps were weak. R2
## changed exactly those two while the other five targets stayed exact; independent final judgment
## returned 7 PASS /0 FAIL.

## ★ FINAL WAVE-2D R4 EVIDENCE — SEALED; JUDGMENT COMPLETE
## Pre-edit baseline seal: 7C68250E3BED9AE64FD5066A4D5389C45056600F09E48B1287253AB20E6B877F.
## Final root: port/v2/apps/game/smoke/wave2d-shared-final-r4-evidence-2026-08-10.
## Manifest SHA-256: DC21922F21E881348263C1B7CE6E8E68C6686752CE782FAA607B3AE6E7398BCE.
## It binds 304 rows =50 targets +254 protected controls and 912 surfaces/run. Current/repeat is
## exact on 912/912 surfaces; all 762 protected surfaces match the pre-edit baseline; all 150 target
## surfaces changed. R4 changed only Civet's 3 surfaces; the other 303 rows /909 surfaces stayed
## exact. All 1,824 PNG hash/dimension checks pass, three 139-file input snapshots have zero drift,
## and all four negative controls were rejected.

## ★ FROZEN WAVE-2D SOURCE SHAS
## faunaoverrides.ts 63D7A9B1E3AE8E2FE359137A030E1AE8AEFC3328ACB5C88FB6E59E7F014A2DA2 ·
## birdoverrides.ts 48FFA589F2273F0F29FD85DF1F05FD070477ADE70F1CDEB7698F5321E5702DC7 ·
## quadrupedoverrides.ts 544F5A6582F467E744C5F2A3ABF0EDF61DE5A5180CF5658155594E5FF86316C1 ·
## mammaloverrides.ts 776FB86FF9A42E348A9278F98F7DC03584568C65A09C637CB1D7BFA38BB7A46E ·
## invertoverrides.ts 2BB40BD1838D6B6B01F09B01D3BC4CBE7B00D0F0C219FEA5926BF076A4F39677.

## ★ PIXEL-NEUTRAL P2 CLEANUP — CLOSED WITH FRESH PROOF
## The Wave-2c deferred cleanup is now source-explicit and pixel-neutral: Mammal C has an explicit
## marsupial-c1 dispatcher arm; Skua's unreachable Snow-Petrel colour alternative is removed; and
## exact Invert-II legacy non-hue options shadowed by named early returns are removed. The shared
## pre-edit/final evidence keeps all 254 protected rows /762 surfaces byte-exact. These are
## route-proven cleanup changes, not visual retcons.

## ★ WHOLE-FORM / FAIL-CLOSED LAW
## One named whole form owns silhouette, anatomy, attachments and material on one winning route.
## Author screens authorize a capture, never a verdict. A changed pixel, green static gate or
## current-only preview cannot replace an author-separated 440/300/132 A/B judgment. Reopen only
## named blockers, freeze every accepted neighbour, and require exact repeat and source/input
## provenance. A pasted seam, wrong posture, missing topology or card-size cue remains FAIL.

## ★ FINAL INTEGRATED WAVE-2D GATES — GREEN; COMMITTED/PUSHED AS 2ED0F28
## All five source SHAs and the 139-input aggregate 58553184F25A8E2D4EDBA4811BEE8087BCAA7E48AC2AD978D96D264FEC793CBC
## stayed exact. git diff --check, typecheck and artunused PASS; Vitest 23 files /238 pass /1 skip;
## speccheck 419/0/0 +5/5 selftest; coveragegap 1,010/1,010; artaudit 23 sources /0; tokencheck
## selftest 16/16 (normal 445-value /23-dead /14-alias diagnostic is non-verdict); overridecheck
## 1,014/1,014 routes +1,010/1,010 species; speciesaudit 1,250/1,250 with 0 fail/duplicate/clipped;
## hybridcheck PASS with 11 negatives; hybridmatrix/speciesstrip/fullresetlayout selftests PASS;
## fullresetreview PASS 10/10 join /6 packets /9 changed fixture. No nonignored generated leakage;
## renderer drained. This authorizes only the Wave-2d checkpoint commit/push—not the reset PR, full
## recertification, ZIP, merge, release, or deployment.
## Full 1,250 recertification, the image-inclusive ZIP, reset PR, merge, release and deployment remain OPEN.

## ★ WAVE 2E — STATIC SOURCE MERGED; POST-EDIT REVIEW FAIL-CLOSED BEFORE FIRST CAPTURE
## 1. Mammal E (13 bovids): Buffalo · Cow · Eland · Gaur · Gazelle · Hartebeest · Impala · Kudu ·
##    Musk Ox · Oryx · Water Buffalo · Wildebeest · Yak. Owners: quadrupedoverrides.ts + mammaloverrides.ts.
## 2. Fauna E (21 squamates): Agama · Anole · Gecko · Skink · Wall Lizard · Whiptail · Alligator Lizard ·
##    Gila Monster · Horned Lizard · Grass Snake · King Snake · Rat Snake · Vine Snake · Water Snake ·
##    Mountain Viper · Snake · Cobra · Cottonmouth · Mamba · Rattlesnake · Viper. Owner: faunaoverrides2.ts.
## 3. Invert IV (13 insect-body rows): Bumblebee · Honeybee · Orchid Bee · Bee · Butterfly · Fly · Mantis ·
##    Moth · Termite · Thrips · Wasp · Black Fly · Mosquito. Owner: invertoverrides.ts.
## 4. The Windows handoff records a shared pre-edit union at
##    `port/v2/apps/game/smoke/wave2e-shared-preedit-baseline-2026-08-10/baseline`:
##    288 rows =47 targets +241 protected, 864 physical PNG hashes/dimensions, 3×139 source/input
##    snapshots exact. Seal `BC424C8FC8D19DDC7A23F81A946CDE99AF2A7FED759129E132233E23C598AA37`;
##    index `2AE4FDB1D443698A092304C22573D8604C07D5B42752E967549D6B038FCD26E3`.
##    That root is under ignored `apps/game/smoke/`, is absent from the Mac clone and every Git ref,
##    and has no tracked scoped-capture/reconstruction recipe. The seal/counts therefore remain a
##    documented Windows claim, not independently verified Mac evidence. Do not substitute a new
##    baseline or begin A/B promotion until the exact root is recovered or a user-authorized
##    deterministic reconstruction from pre-edit 2ed0f28 reproduces both frozen hashes.
##    The browser review path is also not Mac-ready: gp71rejudge, speciesstrip, speciesaudit,
##    hybridblendcheck and fullresetlayout (including fullresetreview's compositor) hard-code the
##    Windows Edge path. Their historical Windows passes are not current Mac results; do not patch
##    that separate portability boundary inside this scanner-only batch.
## 5. Source-only implementation is static-green but deliberately UNJUDGED. Frozen pause SHAs:
##    quadruped `AE8E3830EF57233EB43ABE0F594E335A050A1DB3375F08781FF61549B0C6D288`; mammal
##    `74BBD77CD8BA8E3C22D503AD42FB667EDB74AF6ED3C73551ED283223B28CF80B`; fauna2
##    `30B2E3E2BCDA4865EE81625805384B373423274E0634F8A50F8E4D5A20483378`; invert
##    `6785058479456FF35EE3C44D9FC8F8A9A5467B7F61BBF3153854F93B090A5C1C`.
##    Integrated pause checks: typecheck, artunused, Vitest 23 files/238 pass/1 skip, speccheck
##    455 declared/0 unread/0 inert, and diff-check PASS. No post-edit export, 440/300/132 preview,
##    repeat, independent judgment, full gate closure, reset PR, certification, ZIP, merge, release,
##    or deployment is authorized.
## 6. `overridecheck` is repaired: pinned Rolldown 1.2.1/Oxc parses each complete TypeScript art
##    source as an AST, and only literal string property/array nodes become route keys; every such
##    key is validated regardless of length or alphabet, and malformed CANON keys cannot disappear.
##    The coverage denominator is likewise the one parsed `_EARTH_NAMES` object with exactly four
##    literal kingdom arrays; quote style cannot hide a species, its read-only `_earthNamePass`
##    consumer is pinned, and post-initializer roster mutation is parser damage.
##    Inline plan and ternary values cannot masquerade as keys, while templates, regexes,
##    control-head/member-call slash context, Unicode identifiers and ASI cannot hide later routes. It reports
##    1,014/1,014 live routes and 1,010/1,010 Earth species. The control harness requires exact exit 1
##    plus finding-specific diagnostics and exercises both overcapture directions and the grammar traps.
##    Full-source declaration traversal covers parenthesized, annotated, comment-separated and later
##    `const` declarators; post-declaration writes/aliases and malformed route-table source exit 2.
##    Every painter value must also be statically callable (and each quadruped spec an object)
##    through immutable, unwritten exact local/import bindings; supported factories must return a
##    direct callable expression. Neither `null!`, mutable aliases, nor truthy objects count as painters.
##    The harness refuses concurrent
##    source overwrite and restores all owned files. Wiring is measured only from supported
##    route-selection initializer AST shapes **and their exact executable guard/call/fallback consumer
##    chains, runtime selector precedence, exact vignette/floor/painter arguments, and
##    `ink.c` → `fitInk(ink.cv,c,…)` → returned-`cv` path** inside parsed
##    `resolveOverride`; disconnected consumers, always-false selector predicates, discarded/inert
##    syntax, and later `OVERRIDE_COUNT` mentions cannot mask a disconnected table. Computed route
##    members/methods outside exact audited consumer nodes fail closed. Recursive `.ts`/`.mts`/
##    `.cts`/`.tsx` discovery rejects untracked executable sources and imports/re-exports; normalized
##    full-path ownership resolves the actual exported declaration, not merely a same-file name.
##    Resolver-priority shadow direction and complete
##    kingdom-qualified route coverage are required; helper-shadowing resolver parameters or
##    reassigned or implementation-drifted canvas helpers, direct trusted-global escape/poisoning,
##    ownerless imports, and same-basename/wrong-export/wrong-path imports fail. This static sentinel
##    assumes standard unmodified platform intrinsics and approved dependency implementations; it is not a sandbox against arbitrary hostile
##    monkey-patching, and it does not replace runtime rendering or visual review.
##    Independent post-edit provenance and resolver/compositor reviews returned PASS.
##    Static gates: typecheck/artunused; Vitest 23 files/238 pass/1 skip; speccheck 455/0/0;
##    coveragegap 1,010/1,010; artaudit 23/0; overridecheck/overridecontrol; diff-check all PASS.
## 7. Bird reset FAIL scope is exhausted: B1–B3 exactly cover all 76 frozen-r1 Bird FAIL rows; do not
##    reopen the 26 frozen-PASS birds. Only after every remaining row closes may a clean 1,250 collector, final hybrid evidence,
##    literal certification and dated image-inclusive ZIP begin.

## ★ PARALLEL GIT HANDOFF — EXACT SAFE SYNCHRONIZATION
## Current side: OpenAI/Codex on macOS, branch openai/mac — merged PR #8 put Wave 2e's static
## implementation on develop at bb1a980; this branch resumed there and repaired only scanner/tools.
## Post-edit art review is blocked before capture because the ignored sealed baseline did not cross machines.
## GitHub step: after push, Nick reviews the draft PR into develop; never merge it automatically.
## PR details: base `develop`; source `openai/mac`; title `Repair Wave 2e scanner and preserve the
## fail-closed baseline boundary`; description `Replaces overridecheck's token-shape scan with pinned
## Rolldown/Oxc full-TypeScript AST traversal and hardens exact finding/parser/restoration/wiring/
## provenance controls while preserving all four frozen Wave 2e art-source hashes. Records that the
## ignored 288-row pre-edit evidence did not cross machines, so no post-edit visual verdict is
## claimed. Verification: offline lockfile install; overridecheck 1,014/1,014 routes and 1,010/1,010
## species; the full named overridecontrol suite plus clean baseline/restoration;
## typecheck; artunused; Vitest 23 files/238
## pass/1 skip; speccheck 455/0/0 plus 5/5 controls; coveragegap 1,010/1,010; artaudit 23/0;
## tokencheck 16/16; hybridmatrix selftest; root validate including 1,010 renders and the 50-probe
## fingerprint; four frozen SHA-256 checks; and git diff-check. Anthropic/Claude Code receives the
## repair only after this PR is reviewed and merged into develop. No certification, release, or
## deployment is included.`
## Other side: Anthropic/Claude Code on Windows, branch anthropic/windows, need not be opened now and
## does not have the repair. After the PR merges, at its next batch and only from a clean worktree,
## run `git fetch origin` then `git merge origin/develop`; if dirty, do not pull/switch/merge first.
## Evidence side: Nick does need to open OpenAI/Codex on Windows, branch openai/windows, now only to
## confirm a clean worktree and recover/package the exact ignored baseline and scoped producer. Do
## not copy source files, switch branches, or merge there.
## Release status: develop has the static Wave-2e checkpoint but not this Mac repair; main and the
## live site are unchanged. No release or deployment occurred.
