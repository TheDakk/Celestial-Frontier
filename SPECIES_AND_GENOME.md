# Celestial Frontier — Species & Genome System

**STATUS:** legacy mechanics below match `main.js` as of 2026-07-31; the current v2 reset,
ownership, four bounded companion writers, Guardian/Titan acquisition, rarity presentation and six
explicit audio-surface overlays match the local `port/v2` candidate as of 2026-08-29. The offline
Wolf export contract below matches code as of 2026-09-08. ⚠ v1.8.9: every reader of the
`size` gene now goes through `_szOf` (`% FA_SIZE.length`) — see the inline note
in §2.4.
**Purpose:** how a numeric seed becomes a fully-described living species — the four kingdoms, the trait genes, the FA_* trait tables, the color language, the descriptors/naming/classifier layers, and the named-Earth overlay.
**Source of truth:** this doc is the DESIGN spec; `main.js` implements the legacy
runtime and `port/v2/packages/domain/speciestraits` owns the dated port contract.

## On-demand landfall requirement — clarified 2026-09-08

Nick's vision is to produce the finished, cohesive landfall painting **when a world is visited
as play proceeds**. Millions of possible worlds do not mean millions of images prepared and
installed in advance. A static landing presentation describes the displayed scene; it does not
require a prepainted planet catalogue. The current one-world still demonstrates quality and
placement, not the production generation mechanism.

Nick asks to investigate generation locally as part of the game and requires no separate AI
software installation for players. Local generation could manage model files within the game;
an online image API could also provide a seamless player flow without a model download. These
are different runtime choices. No model, browser/native integration or paid service is selected.
The built-in Codex tool created the current artwork during authoring; it is not an embedded game
generator. Hardware, download size, quality, latency, costs and exact shared-image retention need
qualification. A seed alone is not an exact-pixel contract. No hosted action or model installation
is authorized. [Feasibility and workflow](audits/STATIC_LANDING_PORTRAIT_20260908/LOCAL_GENERATION_FEASIBILITY.md).
Local direction is conditional on feasibility, modest storage and no separate player AI setup.
Nick now prefers adaptive scene-cache allowances: smaller on limited devices and several GB on
capable desktops. Proposed tiers remain provisional; disk storage and RAM/GPU budgets are separate.
All build/model/save/update bytes still count toward the total footprint. No cache manager, model
budget or runtime gate changed. [Current adaptive limits and retention proposal](audits/ON_DEMAND_LOCAL_GENERATION_REQUIREMENTS_20260908.md).
The next bounded art-generation scope is **one on-demand scene proof**, using an existing canonical
world/roster and the approved quality target, before expanding a prepainted planet catalogue.
Preserve full genomes, named Earth anatomy, biome authority, current clocks, saves and share codes.

## Selected landing presentation — Nick, 2026-09-08

Nick explicitly selected the [Living Worlds painting](audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png)
for the landing-screen direction: one large cohesive **static** environment painting, with multiple
canonical flora/fauna where the composition supports them. Live resident motion on landing is no
longer required now. This supersedes that earlier presentation priority while preserving its studies.
[Exact decision and supplied image](audits/STATIC_LANDING_PORTRAIT_20260908/DIRECTION_DECISION.md).

Landing art, Compendium portraits and later articulated 2D battle sprites must share the same full
organism identity, anatomy, markings and versioned art recipe. Author/retain complete organisms and
background separately, with matched scene lighting and contact, then flatten the landing view if
appropriate. A crop of a flattened or occluded animal does not supply hidden anatomy or a rig.
Battle depth may use posing, overlap, scale and authored perspective; no copied Pokémon assets or
3D simulation is implied. Existing flora effects/healing, classifications, discovery/capture rules,
complete genomes/lineage, biome mapping and saves stay owned by current gameplay data.

The new [four-image direction packet](audits/MIDGAME_ART_DIRECTION_20260908/README.md) includes the
atlas, selected triptych, full six-organism Earth landfall and fungal-family concept. The last two
are review compositions, not yet accepted runtime assets or exact geometric/genome parity proof.
The alien image uses documented fungal families; one retained real-system derivation exposes
existing habitat/painter conflicts in all three worlds. It is explicitly not an exact encounter,
and does not close D-9e. The multi-organism Earth's Civet has face/coat drift from the selected
canonical master; preserve this visual limit rather than silently replacing that identity.

The optional `paintedlanding=1` Earth Civet still pilot is now applied and bound to its real asset;
bounded integration verification passed. [STATIC_LANDING_PORTRAIT_20260908](audits/STATIC_LANDING_PORTRAIT_20260908/README.md)
owns the source, export, exact results and retained first failures. The same full-request/all19-genome admission
and accepted UI band select one leased opaque still, with no overlaid unfinished resident sprites.
Native roster rows remain intact. Nick explicitly authorized ImageMagick resize/encoding while
preserving quality. The unchanged 1875×839 original remains retained; the 960×430 lossless WebP
is 600,756 bytes, SHA `cd2c616abb35610f6ec63382f6476436f27a8c1a2c698757c8a66d34a5b2e0ec`.
Its decoded RGB exactly matches the resized reference; resampling still reduces detail at zoom.
The loader checks that exact declared byte count under a 640 KiB hard ceiling; existing loads
without a declared size retain their 512 KiB limit. The original preparation failure and unapplied
patch receipts remain historical evidence, not current installation state. This is not all-world
art coverage, Compendium replacement, completed battle animation or full admission.

Matches code as of September 8: 146 focused tests passed; the new deep-clone fixture then
failed TypeScript TS2352. Its explicit mutable-clone cast was corrected, its five tests rerun,
and all three V2 TypeScript programs plus root validation passed. The unchanged evidence build
passed native desktop and phone review. A wrong-asset observer inventory error stopped its first
chain; a separately recorded correction passed only the remaining wrong-SHA/default modes,
with ten negative controls. Prior passes and the first failure were retained, with no rebuild.
[Visual review](audits/STATIC_LANDING_PORTRAIT_20260908/VISUAL_REVIEW.md) and
[verification](audits/STATIC_LANDING_PORTRAIT_20260908/integration-native-corrected-results.json)
remain scoped; physical devices, native heap and all-world procedural quality stay unqualified.

## Shared animation requirement — current architecture, 2026-09-08

Nick requires one programmatic anatomy/motion system covering procedural land, flying and aquatic
creatures and their variations, with arms, legs, heads, torsos, wings, fins, tails and flexible
appendages. [CREATURE_ANIMATION.md](CREATURE_ANIMATION.md) owns the shared contract and coverage
sequence. Reusable joint/chain mathematics is the first isolated tooling foundation; the game’s
painters do not yet emit common rig geometry or a universal animation-ready skin.

The actual winning named/lineage/procedural painter must emit the same resolved anatomy used for
both rich painting and motion. Raw descriptor genes alone are insufficient: modern procedural
leg counts derive from body/locomotion; swimmers and special named owners can override body plans.
Use variable semantic appendage arrays and family-appropriate land/air/water capabilities. Do not
impose a quadruped skeleton on wings, fish, jelly or plants, or infer anatomy from an image alone.
Preserve full genome/lineage identity, named Earth anatomy/colors, alien palettes and biome mapping.
The [source inventory](audits/CIVET_PAINTED_PARTS_20260908/SOURCE_TAXONOMY.md) records existing
mismatches, including raw-limb/eye omissions, extremophile locomotion semantics and four-wing
routing; these are documented conflicts, not silently corrected by animation work.

The latest Civet atlas is unaccepted authoring evidence after a first checkerboard/parts failure
and one magenta-matte correction. Five alpha-extracted components remain unqualified as an assembled
skin; no new painted asset or motion was wired into the native game or earlier preview. Nick’s
universal-system clarification redirected the next step to the shared foundation. Fine-art blending,
all-family locomotion, physical/human review and prior admission/ownership blockers remain open.

## Earth organisms and alien flora — direction updated 2026-09-08

Nick’s [two additional reference sheets](audits/PAINTED_EARTH_AND_ALIEN_FLORA_20260908/README.md)
separate Earth flora/fauna from alien flora while continuing the approved painted style.
Earth animals keep recognizable named anatomy, proportions, markings and natural colors;
richness comes from coherent volume, directional fur/feathers/scales, expressive natural faces
and material detail. Earth plants retain their actual whole growth habit, branching/crown,
leaf shapes, flowers and fruit. A reference berry shrub is not a replacement for the named
Cranberry, Persimmon or Devil’s Club. Examples do not add species or modify the Earth roster.

Alien flora can express unusual complete architectures—fans, fronds, branching clusters,
pods, fibrous bases and porous tissues—with coherent attached roots/stems/leaves, tactile
surfaces and layered light. Existing seeded final forms, color atlas and biome profile remain
authoritative. The sheet’s copper/blue accents are examples, not a universal recolor; exposed
reference roots do not require uprooted plants in a landscape. Neither sheet rewrites genes,
lineage, encounter selection, biome mapping or the documented global D-9e gap.

The current painted animal study remains Civet. Its natural anatomy and calmer painted fur
support the Earth sheet’s direction; face hierarchy, clean edges and scene contact determine
final fit. Native Chronicle/Compendium/Planetside integration and human acceptance remain open.
This updates authoring requirements; the sheets are opaque references, not runtime sprite packs.

## Painted Civet water and articulated motion — matches study code as of 2026-09-08

The [current local study](audits/CIVET_WATER_AND_MOTION_20260908/README.md) follows Nick’s
shallow-water reading of the accepted Earth anchor, superseding the earlier mud/pebble
interpretation. Four measured paw contacts receive a narrow foreground waterline sampled from
the existing background, faint broken ripples and submerged contact shadows. Modest resident-only
overcast light preserves the painted source and all unowned background pixels. No reflection or
new scenery was invented. The five unfinished residents are absent from this review; the game’s
six-resident roster, exact genomes, biome mapping and accepted anchors remain unchanged.

The calmer original Civet still supplies all RGB; its repaired-alpha 768×512 WebP is 179,816 bytes,
SHA `186d76da888a4d6a1393eef85b0c47dfc3fd4f9653258dad3bdc027c4e400365`. Earth reference anatomy,
natural colors and botanical growth forms remain binding, as do seeded alien forms/palettes.
The painted direction fits the supplied references, but the creature remains warmer/sharper than
the rainy landscape; fine fur/whisker edges, fluid legs and human art acceptance remain open.

`port/v2/tools/painted-creature/civet-articulated-rig.ts` adds twelve local aspect-correct bone
transforms to the connected 49×33 mesh: neck, four upper/knee chains and three tail segments.
Breathe now shows two chest cycles over 6 s; brace/thrust lasts 1.6 s and reaction 1.1 s.
Four whole paw regions stay fixed while the lower-left tail is free. Stop/reset pose is disabled
at rest. Creature/Environment tabs keep the subject near controls; width changes preserve the
active clip. Every clip settles exactly with no idle animation loop. This remains one painted
projection with planted legs; fluid stepping/turning needs separately painted overlapping parts
or a proper 3D rig. It is not yet native game integration or a finished animation set.

44 focused rig tests, the study and all three V2 typechecks, and root validation PASS. Final native
Edge desktop/phone PASS has 34 frame observations, 18 control groups and three actual-canvas WebM
recordings per mode. Positive controls use real native clicks; frozen/subpixel/rigid/dead-tail/
held-breath and eight water faults reject. Four paw contacts, unchanged unowned background,
finite completion/cancellation, width-resize continuity and resource retirement have outcome
proof. The first TypeScript red and first native off→on filter-state failure remain immutable;
empty undefined/null filter chains are now treated equivalently without accepting foreign filters.
These scoped results do not close full admission, physical-device, native-heap or human review.
No native Guide/Training/release-note, version, save, roster, RNG or UI placement changed.
The earlier [cohesion study](audits/CREATURE_SCENE_COHESION_20260908/README.md) and original
[Civet study](audits/CREATURE_PAINTED_CIVET_20260908/README.md) retain their failures and evidence.

## Painted Civet authoring study — matches study code as of 2026-09-08

The local [Civet review packet](audits/CREATURE_PAINTED_CIVET_20260908/README.md) binds one
rich painted rest asset to the exact original 29-field Earth 133 epoch 0 Civet genome. The current
named painter supplied actual transparent ink and 132/300/440 baseline images. Its long pointed
muzzle, mask, tan spotted coat, ringed tail, rounded ears, four planted feet and whole-body
proportions are the authoring constraints; no genome or named/lineage route is rewritten.

`port/v2/tools/painted-creature/civet-rig.ts` owns a finite, single-view connected mesh study:
4.2 s breathing, 1 s brace/neck thrust/recoil and 0.7 s reaction, each returning exactly to rest.
The study uses one 768×512 texture (179,856 compressed bytes; 1,572,864 RGBA bytes) across
close views and the unchanged Earth relative anchor. This is texture deformation, not a
3D skeleton, jaw opening, walking or actual Chronicle/Compendium/Planetside integration.
The current game still uses its existing painters and whole-portrait battle motion.

The image generator twice returned opaque checkerboards. Nick then explicitly authorized
ImageMagick alpha extraction. Both generator failures and the first two matte edge failures
remain intact. The study matte attenuates fine whiskers and retains a light fur fringe under
magnification; production clean-edge and human art acceptance remain open. The painted source,
matte recipes, derivative, exact identity, source bindings and all verification results are
retained in the packet. No full admission, physical-device qualification or art-lock CI follows.

## Layered Earth scene — matches local code as of 2026-09-08

The exact `livingvista=1` riverbank uses six unchanged full Earth genomes and their current
Compendium body owners on transparent ink: Civet, Platypus, Frog, Persimmon, Devil’s Club and
Cranberry. It excludes portrait vignette/framing/polish and preserves named anatomy, markings
and colors. The existing shared input palette receives an export alias; no palette algorithm
changes. Alpha bounds and the lowest solid row provide static relative fit/contact, with
empty/clipped bodies rejecting the complete layer. This is not locomotion or metre-scale ecology.

The explicit mammal/amphibian/tree/shrub annotations are checked against the actual temperate
profile. The global generated roster remains unchanged, including the documented D-9e gap.
Older bare art and request-side phenotype helpers do not include every later named correction;
the new scene deliberately reuses current named owners. [Mapping and source findings](audits/AV_EARTH_LAYERED_SCENE_20260908/BIOME_MAPPING.md)
record the actual authority and test limitations for Claude.

## Earth appearance and movement authority — Nick, 2026-09-08

Earth creatures retain their existing explicit appearance instructions and recognizable
Earth-like features. Richer materials, light, detail and expression must preserve their exact
named catalogue identity, canonical colors and final morphology; the new visual direction does
not authorize fantasy redesign of Earth species. `speciesoverrides.ts` and the existing named
and lineage routes remain the presentation authority over generic raw trait interpretations.
Species-appropriate movement is a binding authoring requirement, not an implemented locomotion
claim. Authoring evidence includes the offline Wolf study and the finite one-view painted Civet mesh
study above. Native battles retain whole-portrait translations; complete animal-specific
locomotion and articulated combat remain open.

Alien planets, biomes and creatures remain procedural under existing seeded owners. Earth-named
organisms and their bred descendants retain the same identity/lineage rules wherever encountered;
`_earthName`, `_earthBlend`, `_earthBlendKingdom`, `_anchorVal` and the complete immutable genome
are not replaced by a style prompt or a world-location shortcut. This clarification changes no
biological generation, trait inheritance, breeding, normalization, taxonomy or save behavior.
See [current art direction](ART_DIRECTION.md) for the shared richness and movement target.

## Offline complete-genome morphology export — 2026-09-08

`port/v2/tools/creature-blender-export.mjs` is a read-only authoring bridge over fixed owned
source declarations. It preserves every plain genome field in a detached snapshot and retains
the exact `speciesVisualKey`; seed/name alone are insufficient. Lossy JSON values reject before
export. Each record binds source byte hashes, the final painter owner, source-derived proportions
and an explicit supported/static-fallback decision. Known specimen provenance is rederived and
checked; unknown derivation claims are not accepted.

The pure existing Wolf pilot uses its exact catalogue genome and named `QUAD_SPEC.Wolf` →
`faunaResetCanidC` route, regardless of raw body/locomotion genes. Proportions use normalized
pre-fit 440px painter coordinates. The Blender recipe adds authored depth and anatomy only after
this boundary. Two actual ordered crosses retain their complete child genomes, qualified Wolf
owner and anchor-derived ridge/coat paths; a mixed-kingdom child does not discard its inherited
fauna owner. Named metadata that still activates lineage drift also requires fallback. An actual
procedural audit specimen retains its final plan. The first recipe admits only pure named Wolf;
reviewed descendants, procedural and unsupported owners keep their existing static presentation.
No taxonomy, RNG, breeding, genome normalization, save or runtime painter changes are introduced.

Nineteen focused exporter tests, three TypeScript programs and root validation passed. The
second private Wolf model and five 440px Metal poses passed scoped connected-skin, weight,
planted-paw, finite-motion and settlement checks, with four rejected negative controls. This
is one unaccepted authoring candidate, not runtime rig integration or completion of any of the
eight family-level animation goals. The
[Wolf candidate audit](audits/CREATURE_BLENDER_CANID_20260908/README.md) records exact model/render
results, retained failures and private backup status. Human art/device acceptance and full
admission remain open.

> **2026-08-29 current local species/companion boundary:** Arc 5 exposes four exact-instance writers
> from verified real-fauna Compendium detail without changing the established creature structure.
> Feed advances bounded `fed` and consumes one exact flora lot. Breed uses the existing lifted
> `crossGenome` successor after one persisted outcome draw, keeps both parents, creates one
> deterministic child only on success, initializes its inherited `fed` once, and assigns active-play
> Recovery to both parents. Rename changes only one sanitized at-most-24-character nickname. Field
> Scout changes only `scoutCreatureId`; it does not alter genome, lineage, injury, Recovery, mission
> or bond state. The later Scout injury interception and +2 fresh-species XP remain separate open
> consequence owners.
>
> Arc 6 Guardian/Titan conquest adds a living `origin:'guardian'` individual only through the
> registered acquisition carrier and preserves exact catalogue deduplication. Battlefield `_mult`
> and `_wf` are stripped before ownership, while legitimate `apex` and `_titan` identity survives;
> no anatomy, silhouette, proportions, trait table, seed, descriptor or share-code structure changes.
> Breed's `bredlegend`, Rename's `namer` and player-combat `brink` join their true Arc 9 achievement
> owners; the complete Records surface separately presents all 96 achievement rows and exact ranks.
>
> The current Binder is another read-only consumer of those established species facts. Its six
> legacy pages project rarity spectrum, sixteen realms, fauna body plans, ability themes, flora
> stat flavors and fauna size classes from canonical Compendium species **types**, not owned
> procedural individuals; it changes no genome or creature structure. Seven non-Paragon completion
> sets can be claimed once for their authored Stardust rewards. The Fifty Paragons remains a visible
> protected boundary: an imported `para10` claim is retained, but no Paragon is generated,
> discovered, awarded, or exposed as a current claim target by the Binder.
>
> Six presentation-only audio surfaces are live: the durable Tame greeting, committed Feed
> acknowledgement, explicit exact-owned-fauna Compendium Listen, orbital Survey and visible
> inhabited-world Planetside **Listen to biosphere**, and the post-settlement Combat Chronicle. Both
> biosphere controls use the same generic no-spoiler signal. The Chronicle owns every already-
> modelled registered cue, including Guardian/Titan motifs, dodge, stun, impacts/criticals/abilities,
> burn, regeneration, defeat and resolution. Recorded assets, authored continuous ambience/music,
> broader or more-specific creature expressions and ecology, device evidence and HUMAN listening
> remain open.

> **2026-08-27 current-candidate correction:** the Tame greeting can truthfully retain an unmuted
> preference even when no AudioContext exists; “contextless” means blocked/not created, not muted.
> Descriptor parity now compares exact populated-galaxy, Earth-Moon and procedural-moon bytes from
> the immutable v1.8.9 source rather than treating an empty historical fixture as sufficient.
> Canonical v5 world identity is being completed so same-seed worlds cannot collide across distinct
> galaxy/star/ordinal addresses; the final carrier/browser proof remains pending at this moving-tree
> checkpoint.

> **Historical 2026-08-26 current-candidate species boundary — superseded where the 2026-08-29
> overlay above differs:** the internal-only Arc 5 bred-successor seam
> initializes a newly admitted child with
> `fed = 0.5 * min(clamp(parentA.fed, 0..200), clamp(parentB.fed, 0..200))` exactly once. Reversing
> the parents yields the same value, absent input becomes zero, encode/decode preserves it, and a
> later care change is not overwritten. No public/player breed action invokes this seam: breeding
> odds, parent Recovery duration and locks, care/timing/capacity, confirmation, UI and copy remain
> Arc 5B product-open.
>
> Raw deterministic grade remains mechanics/internal-art data. Player surfaces use only the strict
> ten-name rarity projector: integer tiers `0..8` map directly, raw `9..14` present as
> Transcendent, invalid/missing values are omitted rather than coerced to Common, and neither the
> internal art label nor raw tier number is shown. Planet rarity stays hidden before landing; a
> legitimate scientific stellar class is not a creature rarity label.
>
> The app now has two deliberately narrow creature expressions through one audio owner. A trusted native Tame gesture may arm
> one silent audio context only while the current surface is visible and answerable and Sound plus
> Creature Voices are enabled. Playback occurs only after the exact durable successful fauna result,
> no convergence, and a matching current ownership revision/species/live-wild-creature identity; it
> emits one deterministic greeting with a visible live-region counterpart and no retry/replay.
> Disabling sound/voices, losing visibility/answerability or replacing the result stops it. A trusted
> native Feed gesture may likewise produce one deterministic contented acknowledgement only after
> the exact committed durable non-converging meal successor and polite/atomic status counterpart
> agree. That inline status is the sole accessible announcement; its companion corner toast is
> visual-only. A constant-size latest-successful-ownership fence rejects both the same Feed result
> and every superseded result; the mutable `fed` value does not enter audio identity. These are exact current-system Tame
> and Feed expressions only: Compendium audition, distant ecology playback, ambience, broader
> companion actions, music and combat audio remain absent. Ordinary Arc 4 Slice evidence still says
> `recoveryClaimed:false`; its dedicated uninterrupted 20-minute recovery certificate remains open.

> **2026-08-25 Arc 4/5A ownership overlay — historical recorded boundary; Arc 4 player-live, Arc 5A infrastructure-only:** the port had a strict
> identity split between immutable catalogue/discovery facts, stable owned fauna instances and
> nonliving specimen lots. Ownership-v1 binds canonical genome identity, exact CF1 provenance,
> biosphere progress and bounded legacy evidence. Ownership-v2 adds receipt-bound acquisitions,
> deterministic fauna-only bred-child successors, ordered parent/lineage evidence and tombstones;
> its active compact representation is one source-bound version-2 manifest plus exactly four fixed
> generic delta shards. The app reconstructs V2 from exact Arc 4 source + canonical changed/V2-only
> rows and verifies source/delta/target/shard fixed points without duplicating unchanged ownership.
> Arc 4's native Survey Tame/Scavenge/Sample controls now consume the canonical full roster through
> the durable writer. A first successful verb creates the one catalogue/discovery fact; Tame may
> add a stable-ID living fauna instance, while Scavenge/Sample add nonliving specimen lots. Eligible
> repeats can add another individual/lot without duplicating the first-only page or Stardust grant.
> Hit/miss, reload, storage refusal, stale convergence, publication convergence and 12-viewport
> presentation/geometry are locally browser-proven. Arc 5A boot now creates or loads those five
> carriers in the shared receipt-free CAS; an aligned legacy-v1 certificate upgrades once and an
> aligned current-v2 fixed point writes nothing. Genuine legacy Training couples one Arc 2, 18 Arc 4
> and five Arc 5 writes; every capture hit or miss advances 18+5 replacements and postcommit-publishes Arc 4/V2
> together. No public or Arc 5-only breed/care/companion writer, Recovery, assignment, Chronicle or
> mission UI exists. The internal V2-only successor produces the same exact five-carrier tuple and
> now applies the one-time child-`fed` rule above, but is not exported publicly. Source-only growth
> preserves all four canonical empty-shard bytes, keeping
> unchanged-state growth O(1). The real
> 20-minute Arc 4 recovery edge and HUMAN ownership/first-journey review remain open.
> Retained Arc 4 browser evidence predates compact Arc 5 V2. The later exact-input evidence for this
> recorded 2026-08-25 boundary is Slice run
> `20260825213041239-98104-c96d3b2d0652` on Edge `151.0.4129.101` (363,053 ms, zero
> findings/retries/source change; report/log SHA-256
> `b19ba6f749cb12e5c8fe23bdc1e779fce8fb04ebbb47653e65313ef2f47784ad` /
> `5a5be42cea5a67401472fe214f663ce8ca1bed7b3c6dbccd29b83fd8d1ea9225`) and Glass on the same Edge
> (71,449 ms, 12/12 viewport plus reload rows, 95/95 controls, 36/36 Arc 4 outcomes, zero
> blocked/omitted/findings/instrument failures/retries; report SHA-256
> `c46b81fbac123c1df22b03949e64589bf1d8d52898613efe01c809b840df177e`). Both bind source commit
> `48ce0b1662a59b21070667be339a1e59503e1f19`, status
> `729e139b14a978c39457ed9ab24990b7e1fd3f3bb63fef3efeeca24b45e4fb9f` and working tree
> `a375f64327e00f9aeaa4e7f46b8f5b4af271aad5230ba301484114520ec8e361`; audits were CLEAR for those
> exact historical inputs. Current-candidate re-audits are not final.

> **2026-08-11 v2 executable-contract correction:** No genome, descriptor or
> portrait output changed. The SpeciesTraits declaration now matches its tables:
> `SP_COLOR` is a string list, `SP_HEX` is a string-to-hex record, and `FA_EYES`
> is numeric. `colorGrade`/`spectral` options are genuinely optional, and the
> grade option includes the runtime-supported suffix. Parity tests exercise the
> shapes so later consumers cannot compile against a fictional table contract.

> **2026-08-10 v2 full-catalogue reset:** `_earthName` identifies a fixed Earth
> organism; bred descendants carry `_earthBlend`, `_earthBlendKingdom`, and
> `_anchorVal`. The selected lineage's exact catalogue owner is stored at breeding
> because a mixed-kingdom child's own kingdom may come from the other parent and
> four Earth names occur in two sets. Fauna descendants reach the lineage-aware HD
> scaffold before generic procedural mapping; non-fauna descendants reach the exact
> kingdom+name owner with the child genome unchanged. Portrait and thumbnail caches
> use the complete plain genome as pixel identity, not seed/name alone, because
> reverse-parent crosses may share a seed while inheriting different traits.
> Earth review identity is also `catalogue set + species`: 1,010 Earth identities
> own 1,014 route rows because four names occur in two sets. The live review ruler
> is `port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`; no prior band is
> a current PASS.

> **2026-08-11 route/freshness correction:** the Platinum review of the clean
> `79ce144` current-generation archive proved that lineage metadata could be exact
> while a fauna child still switched from its modern pure whole form to the retained
> HD compatibility renderer at the first bred stage. Genetics and anchor generation
> remain unchanged. Rendering now set-qualifies an exact seven-name reviewed-fauna
> migration (Fruit Bat, Eagle, Wolf, Elephant, Chameleon, Dragonfly, Octopus) to
> modern owners; Sea Turtle and Great White Shark remain protected on compatibility
> routing. Pure named paths stay separate. The same candidate adds anchor-aware bred
> treatment for Apple, Vanilla Orchid, Oyster Mushroom and Amoeba. Evidence schema v4
> binds 13×5 stages /251 assets. The exact source-`03ea297` package review returned
> **PASS with optional polish only**; the sealed archive's generated UNREVIEWED status
> remains its preparation state, and final all-bloodline certification remains open.

> **2026-08-24 v2 Arc 7 audio identity — historical package foundation, superseded for current
> playback by the 2026-08-26 boundary above:** Catalogue
> identity and living-creature identity are separate. The Earth catalogue owns 1,010
> identities and 1,014 set-qualified route rows; every art/audio join carries the exact
> catalogue set/kingdom + species rather than a bare display name. `@cf/audio` now pins that
> complete route inventory to a coarse kingdom taxonomy and rejects legacy/mammal fallback in
> ordinary sound witnesses. A living specimen's visual identity continues to use its canonical
> **complete plain genome**. The package audio pipeline instead uses an immutable typed
> `AudioSignature` projection derived only from selected audio-relevant phenotype fields, exact
> Earth owner when present, lineage markers that
> survive persistence and an explicit resolver version. It excludes mutable `xp`, `hurt`,
> `fed`, `brood`, `assignment` and `bond`. They may share a pure body/rig/habitat taxonomy,
> but neither renderer owns the other's runtime. Same seed is insufficient when
> reverse-parent children inherit different audio-relevant phenotype or lineage, while
> changing any excluded mutable field must leave the signature, audio profile and cue plan
> exactly unchanged. The audio product is stable typed data, not byte-identical browser PCM.
> Resolver-v1 and its negative/positive vectors were implemented only over an already-normalized
> `AudioIdentityInput`. At this historical 2026-08-24 boundary, the canonical app creature/save →
> audio-input projector, authored voice graph and player playback were not implemented and the app
> remained stings-only; the narrow current Tame and Feed expressions above supersede that playback boundary.
> This package-foundation paragraph changed no genome, save, portrait, descriptor, Guide capability
> or player mechanic.
>
> The package assigns fauna and each non-fauna kingdom a distinct truthful coarse policy; curated
> biological/foley families and authored ecological or Compendium sonification remain future and
> must never fall through to an animal voice. The promise is a recognizable deterministic specimen
> signature assembled from curated palettes and synthesis, **not** one recorded sample for every
> Earth species.
> Resolver-v1 accepts exact owner/anchor and ordered parent-seed fields and keeps reverse-parent
> signatures distinct, but no app projector claims a complete parent-voice blend. It may not depend
> on unregistered legacy `parents` objects. Ownership-v2 now defines a receipt-bound ordered parent
> projection for future writers; at this historical boundary no audio app projector consumed it. Automated
> identity acceptance includes negative controls for each excluded mutable
> field. See `AUDIO.md` §0 for the typed resolver, rights, listening and resource gates.

> **B15.4 classifier + naming (render/text-only, fp 50/50):** `FA_BODY[0]` renamed `"six-limbed"` →
> `"sturdy-limbed"` (Plan 0 is now a "land grazer" whose limb count is set by the limb gene, not the
> body-plan name; fp-safe — no probe genome lands on body 0). The `_earthArt` name→rig classifier gained
> a **Lepidoptera branch** placed AFTER the fish rule but BEFORE the raptor/bird/mammal words, so
> butterfly/moth (and explicit common names, and collisions like "Hawk Moth"/"Peacock Butterfly"/
> "Elephant Hawk Moth"/"Tiger Moth") resolve to the insect rig, while bare Hawk/Peacock→bird,
> Tiger/Leopard→mammal, Butterflyfish→fish. `tools/rig-audit.js` gained 23 Lepidoptera+collision
> sentinels (expected class = biological truth, independent of the classifier).

## 1. Overview

Every organism in the game is a **genome**: a small bag of integer indices into shared trait tables, plus a few flags. A genome is synthesized deterministically from a single 32-bit `seed` by `makeGenome(seed, kingdom, biomeHeat)`. The `kingdom` decides which tables the descriptors read; the same seed always yields the same creature on every device.

Two module blocks own this system:

- **`@module SpeciesTraits [domain]`** (main.js ~1379–1609) — the raw data registries: color words + hex anchors, all the `FA_*` fauna tables, the flora/fungi/microbe form pools, the extremophile/sea/air parallel pools, the rarity ladder (`GRADE_TIERS`), and the naming syllables. Deps: `Rand`.
- **`@module Genome [domain]`** (main.js ~1610–1838) — synthesis (`makeGenome`), the codex taxonomy (`classifyRealm`, `ecologyRole`, `realmBiome`, `realmModifiers`, `sapienceTier`), the human-readable descriptors (`describeSpecies`, `faunaDesc`), the grade wrapper (`speciesGrade`), and Apex Guardians (`guardianFor`, `GUARDIAN_EPITHETS`). Deps: `Rand`, `SpeciesTraits`.
- **`@module Genetics [domain]`** (main.js ~1911–1971) — `evolveGenome` (age a genome through epochs) and `crossGenome` (breed two into a hybrid).

A separate app-layer overlay (`_earthArt`, `_earthFlora`, `_EARTH_NAMES`) paints *named Earth organisms* on top of ordinary genomes without touching the determinism domain. Art details live in **ART_DIRECTION.md** — this doc covers only the classification/naming side.

## 2. Rules & mechanics

### 2.1 Genome synthesis — `makeGenome(seed, kingdom, biomeHeat)`
One `mulberry32((seed^0x9e3b)>>>0)` stream draws every gene, **in a fixed order** (see §3). Rules that matter:

- Each gene is `(r()*LEN)|0` where `LEN` is that table's length — **except `form`, which is hard-coded `(r()*18)|0`**. That `18` is baked into every existing genome's roll; the flora/fungi/microbe form pools are read with `% length` at describe-time so `form` can index any of them. The pinned pools must never change length (see §2.6).
- `lumin` is a boolean: `r()<0.28` (≈28% bioluminescent).
- `gen` starts at 0; `heat` stores the world's `biomeHeat` (0 cold / 1 temperate / 2 hot).
- The genome also carries later-added markers set *outside* `makeGenome` (never re-rolled through the rng): `x` extremophile fauna, `aq` sea flora, `af` air flora, `wild` wild-crossbreed, `apex`/`par` guardian & paragon grade, `ep` epithet index, `parents` breed lineage, `evolved`, and the app-only `_earthName`/`_cradle`.

### 2.2 The four kingdoms
`SP_KINGDOM = ['flora','fungi','microbe','fauna']`. The kingdom selects the descriptor path in `describeSpecies`:
- **flora** → producer; `desc = color + floraFormOf(g)`; `floraFormOf` reads `AQ_FLORA_FORM` if `aq`, `AIR_FLORA_FORM` if `af`, else `FLORA_FORM`.
- **fungi** → decomposer; `desc = color + FUNGI_FORM[form]`.
- **microbe** → base of the web; `desc = color + MICROBE_FORM[form]`.
- **fauna** → routed to `faunaDesc(g)`, which assembles anatomy from ~a dozen genes.

Only **fauna** uses body/head/limbs/skin/tail/pattern/eyes/loco/diet/behavior/temper/sense/repro/life/metab; flora uses `detail`, all kingdoms use `color`/`form`/`lumin`.

### 2.3 Fauna description — `faunaDesc(g)`
Builds two strings:
- **desc** (one-line silhouette): `size, color body loco trait` + `, glowing` if `lumin` and the trait doesn't already mention glow.
- **detail** (paragraph): diet + habitat + behavior, then anatomy (`head, skin-skinned, with <eyeTxt>` + optional tail), then temper / sense / repro, then metab + lifespan. Eye text special-cases 0 → "no eyes", 1 → "a single great eye", else "N eyes".

`habOf(g)` / `locoOf(g)` swap in the extremophile pools when `g.x` is set; otherwise read `FA_HABITAT` / `FA_LOCO`.

### 2.4 Codex taxonomy (the realm layer, on top of the four kingdoms)
`classifyRealm(g)` maps a genome to one of 16 **realms** (`REALM_ORDER`) deterministically from its genes:
- flora→Flora, fungi→Fungi; microbe→`Colonial Life` if its form matches `swarm|colony|bloom|mat|film`, else `Microbial Life`.
- fauna: `sapienceTier>=3` → Intelligent Natural Life; `_szOf(g)>=5` → Megafauna; extremophiles (`g.x`) claim Gas Giant / Subterranean / Extreme-World by habitat; hot-world vent/lava → Exotic Biochemistry; then habitat/locomotion keywords resolve Subterranean, Gas Giant, Extreme-World, Amphibious, Aerial, Aquatic, else Land Fauna.

> ⚠ **`_szOf`, not `g.size` (v1.8.9).** Every reader of the size gene goes through
> `_szOf(g) = size % FA_SIZE.length` — the value the card prints. This matters because
> `crossGenome` mutates `size` **without wrapping**, so bred genomes legitimately carry
> `size > 5` (~12% of lineages by generation 5). Until v1.8.9 this line and `sapienceTier`,
> `speciesGrade` and the titan roster check read it **raw**, so a bred size-6 creature printed
> *"tiny"* on its card and was classified **Megafauna** with the full rarity boost — measured at
> vit 68 against 52 for a genuine size-0. `_szOf` is exported from `@module Genome`; see
> COMBAT_AND_CONQUEST.md and SAVE_SYSTEM.md (2026-07-31), and `tools/sizedrift-check.js`.
> **Do not "fix" the drift in `crossGenome`** — genes drift and consumers wrap is this codebase's
> idiom for all fourteen mutable trait indices, and `crossGenome` is a fingerprint probe.

`ecologyRole(g)` gives the food-web role (Producer / Decomposer / Predator / Grazer / Filter feeder / Scavenger / Chemosynthetic / Omnivore). `realmBiome(g)` gives the habitat/form phrase. `realmModifiers(g)` collects tags: Bioluminescent, Megafauna, Symbiotic, Extremophile, Magnetic navigator, Echolocator, Pressure-adapted, Heat-/Cold-adapted, Wild crossbreed, "Gen N (hybrid)".

### 2.5 Sapience — `sapienceTier(g)` (0–4)
Fauna-only. Scores cognition markers from behavior/sense/trait/size genes (`c`, size read via `_szOf` since v1.8.9), then gates the top two tiers behind a rare deterministic roll (`mulberry32(hashInt(seed,0x5A91,3))`): `c>=4 && roll<0.06` → 4 Sapient; `c>=3 && roll<0.18` → 3 Semi-sapient; `c>=2` → 2 Tool-curious; `c>=1` → 1 Social; else 0 Instinctive. Tier ≥3 promotes the creature to the **Intelligent Natural Life** realm.

### 2.6 The pinned-pool law
The comment at ~1524 is a hard invariant: the original `FLORA_FORM`/`FUNGI_FORM`/`MICROBE_FORM`/`FA_*` pools **must never grow** — their lengths are baked into every genome's index rolls, so extending one re-rolls the whole universe. New species branches instead carry markers (`x`/`aq`/`af`) and read *parallel* pools (`EX_HABITAT`, `EX_LOCO`, `AQ_FLORA_FORM`, `AIR_FLORA_FORM`) through the `habOf`/`locoOf`/`floraFormOf` helpers.

### 2.7 Naming — `speciesName(seed)`
`mulberry32((seed^0x5eed5))` picks one syllable each from `SP_NAME_A` (20) + `SP_NAME_B` (20) + `SP_NAME_C` (12, includes ''). Guardians & paragons append ` <GUARDIAN_EPITHETS[ep]>`.

### 2.8 The named-Earth overlay (app layer, determinism-safe)
`_EARTH_NAMES` (main.js ~8625) is a per-kingdom roster of real Earth names (Wolf, Oak, Chanterelle, Amoeba, …). `_earthNamePass(list)` assigns one name per genome by `seed % pool.length`, walking forward to avoid duplicates within a world, storing it as `g._earthName`. `_storeSpecies` swaps that name into the Compendium entry. This is **art/label only** — the determinism domain (`describeSpecies`) is untouched, and un-named probed creatures are never affected (fingerprint-safe).

`_earthArt(name)` (~4378) and `_earthFlora(name)` (~5740) are keyword classifiers that map an Earth name to art dials (body plan, rig, botanical growth form) so a snake slithers and a fern isn't drawn as an oak — see **ART_DIRECTION.md**. Earth beasts also get `_cradle=1` (main.js ~2228), which clamps their rarity grade at Uncommon wherever they travel (see RARITY_AND_GRADES.md §2.4).

## 3. Key tables & numbers (REAL values from code)

### Genome field draw order (makeGenome, ~1617) — order is load-bearing
`color, form(×18), body, loco, trait, size, diet, head, limbs, skin, tail, pattern, eyes, behavior, habitat, detail, accent, temper, sense, repro, life, metab, lumin(<0.28)`; then `gen:0, heat:biomeHeat`.

### Color language
- **`SP_COLOR`** (17): emerald, crimson, violet, golden, turquoise, indigo, amber, rust-red, silver-blue, obsidian-black, bone-white, magenta, teal, ochre, jade, bruise-purple, glass-clear.
- **`SP_HEX`** — hex anchor per color word so the portrait matches the description (e.g. emerald `#2fbf6b`, crimson `#d33b46`, obsidian-black `#2b2d3a`). `accent` gene indexes the same 17-color list for a secondary hue.

### Fauna trait tables (lengths — do not reorder or resize; portrait code keys off indices)
| Table | Len | Notes |
|---|---|---|
| `FA_BODY` | 16 | silhouette; portrait keys off index |
| `FA_LOCO` | 18 | locomotion (standard pool) |
| `FA_TRAIT` | 25 | signature quirk phrase |
| `FA_SIZE` | 6 | tiny→titanic |
| `FA_SIZE_M` | 6 | portrait scale per size: `[0.28,0.45,0.62,0.82,1.0,1.25]` |
| `FA_DIET` | 6 | herbivore→omnivore |
| `FA_HEAD` | 10 | head shape |
| `FA_LIMBS` | 6 | legacy total walking-limb values: `[2,4,6,8,3,0]`; current V2 resolved painter owns drawn count, not this table alone |
| `FA_SKIN` | 9 | scaled→crystalline |
| `FA_TAIL` | 7 | none→stinger-tipped |
| `FA_PATTERN` | 8 | plain→eye-spotted |
| `FA_EYES` | 6 | eye count: `[2,4,6,8,1,0]` |
| `FA_BEHAVIOR` | 12 | ecological behavior |
| `FA_HABITAT` | 19 | standard habitats |
| `FA_TEMPER` | 10 | disposition |
| `FA_SENSE` | 10 | primary sense |
| `FA_REPRO` | 8 | reproduction |
| `FA_LIFE` | 6 | lifespan |
| `FA_METAB` | 6 | metabolism |
| `FLORA_DETAIL` | 10 | flora paragraph flavor |

### Plant / fungi / microbe form pools (read with `% length`)
- **`FLORA_FORM`** (18): fern-analogues, fungal forests, lichen mats, reed thickets, bioluminescent groves, crystalline growths, moss carpets, canopy vines, bladder-leafed shrubs, spore-towers, sail-leafed trees, mirror-bark giants, tube-stalk gardens, balloon-pods, razor-grass plains, cushion-scrub, umbrella-canopy titans, glass-needle thickets.
- **`FUNGI_FORM`** (9): mushroom forests, shelf-fungus terraces, puffball fields, lantern-cap groves, mycelial webs, spore-tower colonies, creeping mats, crystal-fungus clusters, mold plains.
- **`MICROBE_FORM`** (12): photosynthetic mats … snow-algae crusts.

### v1.3.5 parallel pools (marker-gated, additive-safe)
- **`EX_HABITAT`** (9) + **`EX_LOCO`** (9) — extremophile fauna (`g.x`).
- **`AQ_FLORA_FORM`** (6) — sea flora (`g.aq`).
- **`AIR_FLORA_FORM`** (3) — air flora (`g.af`).

### Codex realms
`REALM_ORDER` (16): Microbial Life, Colonial Life, Flora, Fungi, Land Fauna, Aquatic Fauna, Aerial Fauna, Amphibious Life, Subterranean Life, Extreme-World Life, Gas Giant Life, Megafauna, Intelligent Natural Life, Collective / Hive Life, Exotic Biochemistry, Anomalous Life. Each has an emoji in `REALM_ICON`. `SAP_LABEL` (5): Instinctive, Social, Tool-curious, Semi-sapient, Sapient.

### Naming syllables
`SP_NAME_A` (20), `SP_NAME_B` (20), `SP_NAME_C` (12, first entry '').

### Named-Earth rosters (`_EARTH_NAMES`, app layer)
fauna ~600 names, flora ~300, fungi 27, microbe 22. Assigned by `seed % pool.length`, de-duplicated per world.

## 4. Data / save fields
The genome object itself is persisted inside each Compendium entry (`entry.genome`) and inside placed champions. Persisted genome fields: all the index genes above, `lumin`, `gen`, `heat`, and any set markers (`x`, `aq`, `af`, `wild`, `parents`, `apex`, `par`, `ep`, `evolved`). Load-time hardening coerces/clamps `apex` (must be 12–TIER_MAX or dropped, ~11288). `_earthName`/`_cradle` are app-side conveniences re-derived on the world, not part of the determinism domain. New fields must default safely when absent.

In the current v2 lineage overlay, bred descendants also persist `_earthBlend`,
`_earthBlendKingdom`, and `_anchorVal`. `_earthBlendKingdom` defaults through a
live-route ownership inference for pre-marker genomes; new crosses always record
it explicitly. It is render ownership metadata, not a new RNG draw.

## 5. Determinism
- Every gene comes from `mulberry32`/`hashInt` seeded by the object seed — **no `Math.random()`/`Date.now()`** in these domain modules (enforced by validate.js's grep). The lone `Math.random` genome calls (Lab preview ~15567/15582) are UI-only and never enter the codex/fingerprint.
- The draw order and the hard-coded `form` length `18` are baked into the **50-probe determinism fingerprint** (`tools/baseline.json`); changing either re-rolls the universe and fails validation.
- Markers `x`/`aq`/`af` are set *after* synthesis and ride WITHOUT touching the rng stream, so adding them didn't move the fingerprint. `crossGenome` inheritance of markers is likewise stream-neutral.
- `_earthName`/`_earthArt`/`_earthFlora` are gated on a name being present, so probed (un-named) creatures are untouched → fingerprint safe.
- **Rarity mechanics are deterministic and authoritative; presentation is narrower.** Player
  surfaces accept only valid integer raw tiers `0..14`, map them through the ten-name ladder
  (`9..14` → Transcendent), and omit invalid/missing values. Internal art-grade labels and raw tier
  numbers do not cross that boundary. See RARITY_AND_GRADES.md.

## 6. Code anchors
- `@module SpeciesTraits [domain]` — main.js ~1379–1609. `SP_COLOR`/`SP_HEX` ~1386; all `FA_*` tables ~1546–1598; `FLORA_FORM`/`FUNGI_FORM`/`MICROBE_FORM` ~1515–1523; `EX_*`/`AQ_*`/`AIR_*` + `habOf`/`locoOf`/`floraFormOf` ~1530–1544; `speciesName` ~1602.
- `@module Genome [domain]` — main.js ~1610–1838. `makeGenome` ~1617; `REALM_ORDER`/`REALM_ICON` ~1654; `sapienceTier` ~1665; `realmBiome` ~1683; `classifyRealm` ~1689; `ecologyRole` ~1719; `realmModifiers` ~1731; `describeSpecies` ~1751; `faunaDesc` ~1790; `speciesGrade` ~1772 (see RARITY doc).
- `@module Genetics [domain]` — `evolveGenome` ~1917, `crossGenome` ~1933.
- Named-Earth overlay (app): `_earthArt` ~4378, `_earthFlora` ~5740, `_EARTH_NAMES` ~8625, `_earthNamePass` ~8631, `_storeSpecies` ~8640, `_cradle` flagging ~2222–2228.

## 7. Open questions / pending
- `FA_LIMBS` and `FA_EYES` are both length-6 arrays that intentionally alias `FA_SIZE`'s length, so a size roll and a limbs/eyes roll share the same modulus — deliberate, but worth remembering if `FA_SIZE` ever changes.
- The named-Earth rosters are app-layer strings with no test coverage tying a specific seed→name; only the "no duplicates per world" invariant is structural.
