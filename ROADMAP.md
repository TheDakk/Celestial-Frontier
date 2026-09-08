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

## SESSION HANDOFF — 2026-09-08 · PAINTED CIVET STUDY + EARTH/ALIEN REFERENCES

**Latest bounded result — environment cohesion:** Nick asked to ground flora/fauna and apply his
post-generation Earth reference, then asked whether the direction fits. The new
[scene-cohesion packet](audits/CREATURE_SCENE_COHESION_20260908/README.md) is complete as a local
study. Its calmer original Civet has a repaired nose alpha, modest overcast scene light and
measured contacts. A busier new generation and its damaged nose/tail matte were rejected and
retained. The full scene is **not art-complete**: Civet fine fringe/whiskers and five older flat
residents remain below the final bar. No native game integration or human acceptance is claimed.
No tall occluder is justified at the wet mud/pebble contact; no invented grass/rocks/reflection.
The first study’s 374-file staged recovery remains verified; its RECOVERY_POINTER.md is historical.

Latest selected asset: 768×512, 179,816 bytes, SHA
`186d76da888a4d6a1393eef85b0c47dfc3fd4f9653258dad3bdc027c4e400365`; every original RGB byte retained.
Study typecheck/syntax/root validation PASS. New final native Edge desktop/phone PASS: eight
motion probes and eleven control groups each; exact four-paw census, 15 visible contacts,
359,128 unchanged unowned background pixels, trusted grounding-toggle canvas change/restoration,
all owned shadow/filter resources retired while borrowed layers/sibling remain live, then full
base study disposal. Missing/shifted/absent shadows, excessive light and background grade reject.
The first native FAIL (legacy ground ruler wrongly required zero alpha despite retained
translucent painter shadows) remains intact; phone/new controls/disposal were not reached there.
Final report SHA `2707b001df593cbc7d163d556457d95a54bf8d544de5e189b037da179941bbb7`.

[Latest local comparison](http://127.0.0.1:58521/) is served by PID 7541 / exec 84561 from the
immutable 17-file / 1,837,000-byte native-ground-ruler/dist. Inventory SHA
`a753263db4ecc4a081a486e9cde36544f3e34c1dc60a3ab9ca78cc854148df9f`. HTTP 200 exact HTML hash verified
outside Seatbelt after a sandbox EPERM; app-open queued only. Earlier port 58519 stays separate.

**Current bounded result:** one complete rich-painted canonical Civet and a finite connected-mesh
motion study, plus Nick’s two new Earth flora/fauna and alien-flora reference sheets. Native game
integration is unimplemented. The local game still uses its existing creature/plant painters,
flattened Earth resident layer and whole-portrait battle motion. No Guide/Training/release-note,
version, save, roster, RNG, lineage, biome or accepted UI placement changed in this batch.

[Review packet](audits/CREATURE_PAINTED_CIVET_20260908/README.md),
[final results](audits/CREATURE_PAINTED_CIVET_20260908/final-results.json), and
[visual review](audits/CREATURE_PAINTED_CIVET_20260908/VISUAL_REVIEW.md) are the entry points.
Starting/current HEAD: `5e222931efd642c03ce55c5e67f7670a7aef890c`. **The first new signed commit
failed with 1Password “failed to fill whole buffer” / exit 128.** Completed work remains staged;
[original failure](audits/CREATURE_PAINTED_CIVET_20260908/SIGNING_FIRST_FAILURE.md) is retained.
No unsigned fallback, signing configuration change or automatic retry. Nick was informed that
the local signer needs attention; resolve HEAD and the commit receipt after a restored-state
retry. Earlier SIGNING_RESTORED_20260908 is historical success for its own checkpoints. No hosted
write is authorized. The previous Earth handoff is archived verbatim atop ROADMAP_ARCHIVE.md.

### Authority, art direction and exact identity

Nick’s local campaign still ends **2026-09-09T03:11:15Z** (September 8, 23:11:15 Eastern).
Claude review is Thursday, September 10. No extension or broad rework loop. The
`celestial-frontier-48-hour-coding` automation was deleted; **do not recreate scheduled prompts**.
[Campaign authority](audits/AV_24H_CAMPAIGN_20260907.md).

Continue the approved painted universe/creature sheets in PAINTED_SPACE_PIPELINE_20260908 and
biome/UI addendum in PAINTED_SPACE_DIRECTION_ADDENDUM_20260908. The new exact copies/hashes in
[PAINTED_EARTH_AND_ALIEN_FLORA_20260908](audits/PAINTED_EARTH_AND_ALIEN_FLORA_20260908/README.md)
are now reflected in ART_DIRECTION, SPECIES_AND_GENOME, BIOME_ATLAS and the codebase reference:

- Earth fauna retain named anatomy, proportions, markings, natural colors and movement. Earth
  flora retain actual growth habit, branching/crown, leaves, flowers and fruit; a generic sheet
  berry shrub must not replace Cranberry, Persimmon or Devil’s Club.
- Alien flora may have rich fans, pods, fronds, branching clusters and porous tissues, with
  coherent attached growth. Seeded forms/colors, lineage and biome profile remain authoritative.
  Sheet accents and exposed roots are examples, not universal recolor/uprooting instructions.
- Preserve CF controls, emoji, text and placement. UI references are material/graphic inspiration.
  The animal study remains Civet; the Earth sheet confirms its treatment, without a style restart.

Civet seed 3212817920 is bound by the complete exact original 29-field Earth epoch 0 genome.
`port/v2/tools/painted-creature/civet-rig.ts` admits only that identity. Its pointed muzzle, mask,
rounded ears, four feet, spotted khaki/tan coat and ringed tail come from the current named painter.
One 768×512 lossless WebP is 179,856 bytes, SHA
`7df99d643544f47f0b9cfd22e97e3bcb8af5ccc184a51f29d2e6c42c603815ac`;
its decoded RGBA base is 1,572,864 bytes before other ownership/upload overhead. The study has one
shared texture across close views and Earth, a connected 49×33 grid/3,072 triangles, finite 4.2 s
breathing, 1 s brace/neck thrust/recoil and 0.7 s reaction. Whole triangles above the visible paws
stay fixed; each clip settles exactly. This is one painted projection, not a 3D/jaw/walking rig.

Both generator outputs baked opaque checkerboards. Nick explicitly authorized ImageMagick alpha
extraction; all three attempts and both originals remain. Fine whiskers are attenuated, with
pale fringe/mouth fragments and a patchy nose edge on light backing. The warm coat and weak local
contact shadow need further scene-light integration. Agent review sees much richer fur/volume and
connected anatomy, but **production edge quality and human art acceptance remain open**. Other
five native Earth residents are still flat and below the approved bar. No cloud backup retry.

### Verification — bounded study only

113 rig tests PASS, including full finite-clip sweeps and actual mutation controls. Study typecheck,
all three V2 TypeScript programs and root validation PASS: 1,010 clean named renders, zero boot
errors, 50 unchanged original determinism fingerprints. Source review corrected the NaN rest
shortcut, destroyed-mesh observer and omitted Earth-container disposal before relevant runs.

Final native Edge 152.0.4191.66 / CDP 1.3 PASS: desktop 1440×1200@1 and emulated phone 390×844@2,
eight probes/five control groups per mode on unchanged bound source/assets. Actual painted pixels
at 440/300/132 keep all four paws nonempty and exactly fixed; body/head pixels move. Constant-rest,
shifted-paw, opaque/hash and actual horizontal-overflow mutants fail; restoration passes. Trusted
native buttons complete finite clips and cancel on Reduced/Effects Off/DOM Hide. All four meshes,
geometries and actor roots, Earth container and three textures/sources/bitmaps retire; repeat
cleanup is inert. Zero Runtime/cleanup errors; browser closed. Document-hidden is synthetic,
phone inputs are CDP mouse events under emulation: no physical touch/background/Safari/PWA claim.
Native report SHA: `cd84e42ea90c7f05a0754d4efa5595dea8e8fc20500bafd5ff4b1d87a9db97d9`.

**All first failures remain:** two opaque image outputs, two matte visual failures, first native
paw-pixel FAIL (analytic point lock missed an interpolating triangle; tiny ruler had no solid ink
at 300/132), analysis FAIL comparing encoded-PNG/raw-GPU RGB counts, and second native scrollbar
assertion FAIL after eight passing probes. The first two native stops did not reach in-page disposal
or phone. The second retained only the failing width scalar, not original full geometry. Final
source fixes and stronger nonempty four-paw/overflow controls have new immutable outputs; none of
those aggregate failures is relabelled PASS. No unchanged red was automatically retried.

### Local review, startup and Git ownership

[Local motion bench](http://127.0.0.1:58519/): Breathe once / Brace and thrust / Recoil / Rest,
Reduced motion / Effects on / Hide study. Dispose retires the bench; reload for another review.
Server PID 598 / exec 25947 serves only the final immutable 17-file/1,775,620-byte study inventory.
[Exact receipt/restart](audits/CREATURE_PAINTED_CIVET_20260908/README.md); content inventory SHA
`86c5e30524484e6a4156d71b6fd051fa589719d1486997f1a52619acff4aed2d`.
This is not a game preview or certificate. Prior Earth game preview restart is in
`port/playtests/20260908_EARTH_LAYERED_LOCAL_PREVIEW.md`; its earlier port/PID is not reverified.

Verified ownership: **OpenAI/Codex · macOS ·
`/Users/nick/Projects/celestial-frontier-openai-mac` · `openai/mac` · `origin/openai/mac`**.
SSH origin is `git@github.com:TheDakk/Celestial-Frontier.git`; retained uninterrupted TheDakk
SSH/read proof applies. This local-only batch did not need a fresh fetch. Start was 40 ahead/0
behind cached upstream; cached `origin/develop` `c1791e210158de864fdd475323c3091d9ecbae58` is an
ancestor. Resolve final HEAD/counts after commit. Ambient `.DS_Store` stays untouched/untracked.

New-session tool startup completed at 2026-09-08T21:51:58.792Z:
[TOOLCHAIN_STARTUP_20260908_CIVET](audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json).
Official stable check plus scoped outdated were current; no eligible update or changed executable.
ImageMagick 7.1.2-31, FFmpeg 9.0.1_1, Blender 5.2.1, Inkscape 1.4.4, REAPER 7.79, Surge 1.3.4,
Node 26.8.1 and GSAP 3.15.0 retained. REAPER’s active process was not interrupted. Use this receipt
only for the uninterrupted session; fresh sessions follow UI_TOOLCHAIN.md and the shared lock.
Terminal/files and isolated CDP only; browser commands ran outside Seatbelt, under the shared
foreground lock and checkout build lease. No personal UI was inspected or jobs interrupted.

### Prior Earth placement and blockers stay binding

`?livingvista=1` remains the optional painted rainy Earth 133#2 riverbank with separate six-resident
layer, admitted by the full request and all 19 ordered epoch 0 genomes. Exact world:
`CF1|g:999@90,-60|s:424242@560,170|p:133#2`; environment `cwe1:148:50c1b7d6`;
profile `temperate/bpd1-6fce883d4d70e3b6bde0fb184b416e8e`. Residents: Civet/Platypus/Frog,
Persimmon/Cranberry/Devil’s Club. BIOME_ATLAS §1.1/profile allows their fauna families/flora forms;
it is not a universal geographic species database. Global D-9e remains dead, unfixed and gated.

The approved 960×430 pair publishes atomically, fits uncropped above Biosphere with 12 px clearance,
hides only its owned globe/cloud deck, and refreshes after the final camera impulse. Existing
fallback, workers, request/epoch fences and retryable cleanup remain. Native controls are unchanged.
Original background SHA `2993cd8054a2424f20ba24040717acdb17aa9c7157500cd5b945170cd1f625d8`,
130,306 bytes; pair RGBA 3,302,400 bytes before scratch/decode/GPU; optional worker 957,316 bytes.
[Earth review packet](audits/AV_EARTH_LAYERED_SCENE_20260908/README.md) retains 351 focused tests,
three typechecks, art/override/spec/root checks and four final native modes PASS. Its frozen
96-file `earth-layered-settled-evidence-dist-20260908` and 134 prior guard controls remain separate.

Preserve Earth-layer first reds: 285 PASS/1 FAIL publication, 306 PASS/2 FAIL expectations with
possible overlapping art-test edit, 308 PASS then adapter parser red, guard 102 FAIL/21 PASS,
first native policy-null, second native DOM-covered center exit, desktop Y red with unknown
original geometry, and observer offset/source camera-shake diagnosis. Final four settled modes
PASS do not close full admission, physical devices, native heap, Reduced/Effects Off reload,
resize/re-entry, hidden ancestors or position-only chrome changes outside fixed-view qualification.

83-row draft SHA `218f02b5130fe78a6fcf76e898b6372b8761b4ef4bb4590137668920980f0793`;
producer `b62563276984183b933e372242e5cd68426727094f57407f9057f1ff4d8e3ba6`;
measurement `4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12` unchanged.
No ceiling/ruler/history rebaseline or full Compendium/Slice/Glass/Recovery. Recovery receipts
including the verified 1,177-file Earth staging snapshot and six predecessors remain in the
archived handoff and `port/v2/apps/game/smoke/earth-layered-staged-20260908.json`. The accumulated
Earth checkpoint is signed `5117b4fa18afeb4869ac459b6f95dfd6a586edc6`; the single original EOF
format warning and historical signing failures remain, superseded only as current signing status.

### Earlier blockers retained

Signed `837db4a` U2 attempt: 324 files, 3,494 tests / 1 skip, then TS6133 red; no browser stage.
The binding was later fixed. `3a61352` small-phone instrument red after 3 Capture outcomes/Charters
Close remains; large-phone/Slice not run. `08cd97d` Milky Way / `c57aaaeb` portrait timeouts remain
unknown. Claude's full review stays in `UI_U2_CLAUDE_REVIEW_20260906/RESPONSE.md`. U2–U4 full
admission/Compendium/Slice/Glass, physical device, human art/listening, 256 MiB retained update,
art-lock CI, ITP and DECISIONS 19 remain open; 128 MiB admission exists. SceneMemory remains
production-only/quarantined; no activation.

Earth turn's first full profile (330 files, 3,742 PASS, 1 skip, 5 FAIL in 4 files) is a stopped
aggregate; focused 104/52/32 and static successes do not replace it. Native owner-aware aggregate
FAIL after phone exit plus desktop resize to an unexpected galaxy remains unknown; re-entry was
not reached; fresh desktop PASS is separate. MissingMeshPipe and renderer-extract observer faults/
corrections remain in AV_EARTH_SURFACE_TURN_20260908. Earth turn is finite: 18 seconds / .22 radian
on a nonperiodic atlas, not a seamless revolution. Material proof remains subtle. Mars composition's
216 tests / four native modes PASS and both first observer reds retain their prior immutable packet.

CF1 world sharing is native; CFB/CFB2 domain codecs are not native creature share/import. Preserve
complete immutable genomes, ordered lineage and versioned recipes. Universe orbits are kinematic,
not established N-body simulation. Unity/Unreal remains future portability; no engine install or
restart. Offline Wolf masters have limited poses/neck strike, no jaw/walking/all families, and
remain below the art bar. Private asset masters' hashes are preserved; an independent 94-file /
24 MB iCloud backup waits after 2 automatic review rejections; no retry/cloud write. The original
Dakk project is untouched; no copied third-party runtime assets.

### Next bounded work and paired handoff

The two bounded studies are complete. The latest reference review accepts the calmer direction
as a study, with production fine-alpha and human visual qualification still open. Next clean the
remaining Civet fringe/whiskers before one exact-identity native art recipe across the existing
Compendium/Chronicle/Planetside owners, with bounded ownership and real outcomes. The five older
Earth residents require individual rich painted replacements under named botanical/anatomical
rules; do not expand all families in one loop or call the scene finished after filtering. Alien
plants preserve seeded architecture/palettes. Stop at the campaign deadline; no extension.

Current side: Codex/macOS/`openai/mac` retains both completed studies staged pending signing
recovery; HEAD is still `5e222931efd642c03ce55c5e67f7670a7aef890c`, cached upstream 40 ahead/0 behind.
The combined local binary staging recovery is
`port/v2/apps/game/smoke/earth-cohesion-staged-20260908.patch.gz` with its adjacent JSON receipt;
see the scene packet’s RECOVERY_POINTER.md for readback/reverse-check results and exclusions.
Full staged format check retains warnings in immutable compiled Pixi and raw logs; authored
source check PASS. Scene packet format-review.json preserves exact output. No signing retry
occurred after the original 1Password failure; no unsigned fallback or signing change.
GitHub step: none. PR details: not needed. Future separately authorized path is
`openai/mac` → `develop`, never directly `main`. Actions budget UNFROZEN/PUBLIC, private fallback
3000, exact hosted authority none, attempts/cost 0; no workflow is triggered by this batch.

Other side: Claude/macOS/`anthropic/mac` does not have these unmerged changes; **no need to open
or sync Claude now**. Preserve `173c806` and review the durable packet Thursday. Only after a
future authorized exact `develop` merge should Claude fetch/merge `origin/develop` into its own
clean branch. No manual copies or messages to Claude, develop/main promotion, hosted dev update,
release, deployment or version bump occurred. Existing automation stays deleted.
